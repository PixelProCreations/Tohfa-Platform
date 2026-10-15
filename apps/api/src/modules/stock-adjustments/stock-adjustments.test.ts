/**
 * BR-37 (stock movements are ledger-first; adjustments need separate approval).
 *
 *  BR-37a  nobody approves (or rejects) an adjustment they raised: 403 SELF_APPROVAL_FORBIDDEN; a
 *          Sub Warehouse Admin cannot reach the approve/reject routes at all (rbac `none`); the
 *          adjustment stays PENDING and nothing is written
 *  BR-37b  creating an adjustment moves no stock; approval moves it by INSERTING exactly one
 *          ADJUSTMENT ledger row (referenced as ledgerEntryId) in the same transaction as the
 *          status change and the audit row; nothing writes a balance column
 *  BR-30   reads and creates are warehouse-scoped: a Sub admin's other warehouse is an empty page
 *          (lists) or the same 404 as an unknown id (one row), never 403
 *
 * Layers: schema tests (no I/O); service tests against an in-memory repo and ledger (always run);
 * route gate tests on a mini app with a stub service (always run, no database); service tests
 * against real PostgreSQL in a rolled-back transaction (gated on DATABASE_URL).
 */
import { beforeAll, describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { aScope, describeIfDatabase, newId } from '../../test/factories.js';
import { insertCrop, insertFarmerWithPlot, insertUser, requireDatabaseTables } from '../../test/dbFixtures.js';
import { createInMemoryIdempotencyStore } from '../../test/idempotencyStore.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import type { RecordMovementInput, StockLedgerEntryView } from '../inventory/inventory.schema.js';
import { InventoryService } from '../inventory/inventory.service.js';
import { inventoryRepo } from '../inventory/inventory.repo.js';
import {
  createAdjustmentBody,
  listAdjustmentsQuery,
  rejectAdjustmentBody,
  signedKgToGrams,
  type ListAdjustmentsQuery,
  type StockAdjustment,
} from './stock-adjustments.schema.js';
import { stockAdjustmentsRepo, type AdjustableBatch, type NewAdjustment, type StockAdjustmentsRepo } from './stock-adjustments.repo.js';
import { createStockAdjustmentsService, type StockAdjustmentsService } from './stock-adjustments.service.js';
import { inRolledBackTx, loadWarehouseIds, type WarehouseIds } from '../warehouse-ops/testkit.js';

const W1 = '10000000-0000-4000-8000-0000000000b1';
const W2 = '10000000-0000-4000-8000-0000000000b2';

// ===========================================================================
// 1. Schemas
// ===========================================================================
const createBody = (overrides: Record<string, unknown> = {}) => ({
  batchId: newId(),
  adjustmentType: 'SHRINKAGE',
  qtyDeltaKg: '-2.500',
  reason: 'Moisture loss over 3 days in cold store.',
  ...overrides,
});

describe('stock adjustment schemas', () => {
  it('BR-37: the create body is strict, needs a signed non-zero decimal-string quantity, a 5-500 char reason, and a loss type only removes stock', () => {
    expect(createAdjustmentBody.safeParse(createBody()).success).toBe(true);
    expect(createAdjustmentBody.safeParse(createBody({ adjustmentType: 'COUNT_CORRECTION', qtyDeltaKg: '4.25' })).success).toBe(true);
    expect(createAdjustmentBody.safeParse(createBody({ adjustmentType: 'COUNT_CORRECTION', qtyDeltaKg: '-0.001' })).success).toBe(true);
    for (const type of ['DAMAGE', 'EXPIRY', 'SHRINKAGE']) {
      expect(createAdjustmentBody.safeParse(createBody({ adjustmentType: type, qtyDeltaKg: '-1' })).success, type).toBe(true);
    }
    for (const bad of [
      createBody({ qtyDeltaKg: '0' }),
      createBody({ qtyDeltaKg: '-0.000' }),
      createBody({ qtyDeltaKg: -2.5 }),
      createBody({ qtyDeltaKg: '-1.0001' }),
      createBody({ qtyDeltaKg: '1e3' }),
      createBody({ qtyDeltaKg: '+1' }),
      createBody({ adjustmentType: 'DAMAGE', qtyDeltaKg: '1' }),
      createBody({ adjustmentType: 'EXPIRY', qtyDeltaKg: '0.5' }),
      createBody({ adjustmentType: 'SHRINKAGE', qtyDeltaKg: '3' }),
      createBody({ adjustmentType: 'THEFT' }),
      createBody({ reason: 'abcd' }),
      createBody({ reason: '    abcd    ' }),
      createBody({ reason: 'r'.repeat(501) }),
      createBody({ batchId: 'not-a-uuid' }),
      createBody({ status: 'APPROVED' }),
      createBody({ warehouseId: W1 }),
      { adjustmentType: 'SHRINKAGE', qtyDeltaKg: '-1', reason: 'missing batch' },
    ]) {
      expect(createAdjustmentBody.safeParse(bad).success, JSON.stringify(bad)).toBe(false);
    }
  });

  it('BR-37: signed quantities compare as integer grams, never floats', () => {
    expect(signedKgToGrams('-2.5')).toBe(-2500);
    expect(signedKgToGrams('0.001')).toBe(1);
    expect(signedKgToGrams('123456789.999')).toBe(123_456_789_999);
  });

  it('BR-37: reject needs a 1-500 char reason and nothing else; the list query is strict and pages at most 100', () => {
    expect(rejectAdjustmentBody.safeParse({ reason: 'Recount first' }).success).toBe(true);
    for (const bad of [{}, { reason: '' }, { reason: '  ' }, { reason: 'r'.repeat(501) }, { reason: 'x', status: 'REJECTED' }]) {
      expect(rejectAdjustmentBody.safeParse(bad).success, JSON.stringify(bad)).toBe(false);
    }
    expect(listAdjustmentsQuery.parse({})).toEqual({ page: 1, pageSize: 20 });
    expect(listAdjustmentsQuery.safeParse({ status: 'PENDING', warehouseId: W1, batchId: W2, adjustmentType: 'DAMAGE' }).success).toBe(true);
    for (const bad of [{ status: 'PENDING_APPROVAL' }, { pageSize: '101' }, { page: '0' }, { warehouseId: 'x' }, { farmerId: W1 }]) {
      expect(listAdjustmentsQuery.safeParse(bad).success, JSON.stringify(bad)).toBe(false);
    }
  });
});

// ===========================================================================
// 2. Service against an in-memory repo and ledger (no database)
// ===========================================================================
interface FakeBatch extends AdjustableBatch {
  batchCode: string;
  cropId: string;
  grade: string;
  sourceFarmerId: string;
}

const SECRET_REASON = 'Ramesh dropped crate 4, call +91 98765 43210';

function makeWorld() {
  const batches = new Map<string, FakeBatch>();
  const adjustments = new Map<string, StockAdjustment>();
  const ledger: Array<RecordMovementInput & { id: string; performedBy: string; inTx: Executor | undefined }> = [];
  const audits: Array<{ actionCode: string; entityType: string; entityId: string; warehouseId: string | null; before: unknown; after: unknown; sql: string }> = [];
  const ledgerFailure: { next: AppError | null } = { next: null };
  let clock = 0;
  const stamp = () => new Date(Date.UTC(2026, 9, 14, 6, 0, clock++)).toISOString();

  const repo: StockAdjustmentsRepo = {
    async findBatch(_db, batchId) {
      const b = batches.get(batchId);
      return b === undefined ? null : { id: b.id, warehouseId: b.warehouseId, status: b.status, qtyAvailableKg: b.qtyAvailableKg };
    },
    async insertAdjustment(_db, input: NewAdjustment) {
      const id = newId();
      const b = batches.get(input.batchId)!;
      adjustments.set(id, {
        id,
        batchId: input.batchId,
        batchCode: b.batchCode,
        warehouseId: input.warehouseId,
        cropId: b.cropId,
        grade: b.grade,
        adjustmentType: input.adjustmentType,
        qtyDeltaKg: (signedKgToGrams(input.qtyDeltaKg) / 1000).toFixed(3),
        reason: input.reason,
        status: 'PENDING',
        createdBy: input.createdBy,
        createdAt: stamp(),
        approvedBy: null,
        approvedAt: null,
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null,
        ledgerEntryId: null,
        verificationId: null,
        updatedAt: null,
      });
      return id;
    },
    async findAdjustment(_db, id) {
      const a = adjustments.get(id);
      return a === undefined ? null : { ...a };
    },
    async lockAdjustment(_db, id) {
      const a = adjustments.get(id);
      return a === undefined ? null : { ...a };
    },
    async list(_db, query: ListAdjustmentsQuery, visible) {
      const all = [...adjustments.values()]
        .filter((a) => visible === null || visible.includes(a.warehouseId))
        .filter((a) => query.status === undefined || a.status === query.status)
        .filter((a) => query.warehouseId === undefined || a.warehouseId === query.warehouseId)
        .filter((a) => query.batchId === undefined || a.batchId === query.batchId)
        .filter((a) => query.adjustmentType === undefined || a.adjustmentType === query.adjustmentType)
        .reverse();
      const start = (query.page - 1) * query.pageSize;
      return { items: all.slice(start, start + query.pageSize), total: all.length };
    },
    async markApproved(_db, id, input) {
      const a = adjustments.get(id)!;
      if (a.status !== 'PENDING') throw new Error('frozen');
      Object.assign(a, { status: 'APPROVED', approvedBy: input.approvedBy, approvedAt: stamp(), ledgerEntryId: input.ledgerEntryId, updatedAt: stamp() });
    },
    async markRejected(_db, id, input) {
      const a = adjustments.get(id)!;
      if (a.status !== 'PENDING') throw new Error('frozen');
      Object.assign(a, { status: 'REJECTED', rejectedBy: input.rejectedBy, rejectedAt: stamp(), rejectionReason: input.reason, updatedAt: stamp() });
    },
  };

  // The only SQL the service runs itself is the audit insert (writeAuditLog).
  const tx: Executor = {
    async query(sql: string, params?: unknown[]) {
      if (sql.includes('INSERT INTO audit_log')) {
        const p = params ?? [];
        audits.push({
          actionCode: p[3] as string,
          entityType: p[4] as string,
          entityId: p[5] as string,
          warehouseId: p[6] as string | null,
          before: p[8] === null ? null : JSON.parse(p[8] as string),
          after: p[9] === null ? null : JSON.parse(p[9] as string),
          sql: JSON.stringify(p),
        });
        return { rows: [{ id: newId() }], rowCount: 1, command: 'INSERT', oid: 0, fields: [] } as never;
      }
      throw new Error(`unexpected SQL in a unit test: ${sql.slice(0, 80)}`);
    },
  };

  const ledgerWriter = {
    async recordMovement(actor: { userId: string }, _scope: ResolvedScope, input: RecordMovementInput, inTx?: Executor): Promise<StockLedgerEntryView> {
      if (ledgerFailure.next !== null) {
        const e = ledgerFailure.next;
        ledgerFailure.next = null;
        throw e;
      }
      const b = batches.get(input.batchId)!;
      const after = signedKgToGrams(b.qtyAvailableKg) + signedKgToGrams(input.qtyDeltaKg);
      b.qtyAvailableKg = (after / 1000).toFixed(3);
      const id = newId();
      ledger.push({ ...input, id, performedBy: actor.userId, inTx });
      return {
        id,
        batchId: input.batchId,
        warehouseId: input.warehouseId ?? b.warehouseId,
        txnType: input.movementType,
        qtyDeltaKg: input.qtyDeltaKg,
        balanceAfterKg: b.qtyAvailableKg,
        refType: input.refType ?? null,
        refId: input.refId ?? null,
        performedBy: actor.userId,
        performedAt: stamp(),
        remarks: input.remarks ?? null,
      };
    },
  };

  const service = createStockAdjustmentsService({
    repo,
    db: tx,
    runTx: async (fn) => fn(tx),
    idempotency: createInMemoryIdempotencyStore(),
    ledger: ledgerWriter,
  });

  const addBatch = (overrides: Partial<FakeBatch> = {}): FakeBatch => {
    const id = overrides.id ?? newId();
    const batch: FakeBatch = {
      id,
      batchCode: `B-${id.slice(0, 6)}`,
      warehouseId: W1,
      cropId: newId(),
      grade: 'GRADE_1',
      status: 'ACTIVE',
      qtyAvailableKg: '100.000',
      sourceFarmerId: newId(),
      ...overrides,
    };
    batches.set(id, batch);
    return batch;
  };

  return { service, tx, batches, adjustments, ledger, audits, ledgerFailure, addBatch };
}

const CREATOR = '00000000-0000-4000-8000-0000000000e1';
const APPROVER = '00000000-0000-4000-8000-0000000000e2';

const subCreator = (warehouseId = W1, userId = CREATOR): ResolvedScope =>
  aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.SUB_WH_ADMIN, permission: 'inventory.stock_adjustment.create', warehouseIds: [warehouseId], userId });
const mainCreator = (userId = CREATOR): ResolvedScope =>
  aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.MAIN_WH_ADMIN, permission: 'inventory.stock_adjustment.create', userId });
const approver = (userId = APPROVER, roleCode: RoleCode = RoleCode.MAIN_WH_ADMIN): ResolvedScope =>
  aScope({ level: ScopeLevel.ALL, roleCode, permission: 'inventory.stock_adjustment.approve', userId });

async function failure(promise: Promise<unknown>): Promise<AppError> {
  const error = await promise.then(() => null, (e: unknown) => e);
  expect(error, 'expected the call to fail').toBeInstanceOf(AppError);
  return error as AppError;
}

let keyN = 0;
const key = (): string => `adj-k-${++keyN}`;

async function pending(w: ReturnType<typeof makeWorld>, scope: ResolvedScope = subCreator(), overrides: Record<string, unknown> = {}) {
  // The batch lives in the creating scope's warehouse (W1 for an unconfined scope).
  const b = w.addBatch({ warehouseId: scope.warehouseIds[0] ?? W1 });
  const { adjustment } = await w.service.create(scope, key(), createAdjustmentBody.parse(createBody({ batchId: b.id, ...overrides })));
  return { batch: b, adjustment };
}

describe('stock adjustments service (in-memory repo)', () => {
  it('BR-37: a missing or blank Idempotency-Key is 422 on create and approve and writes nothing', async () => {
    const w = makeWorld();
    const b = w.addBatch();
    for (const k of [undefined, '', '   ']) {
      const e = await failure(w.service.create(subCreator(), k, createAdjustmentBody.parse(createBody({ batchId: b.id }))));
      expect(e.status).toBe(422);
      expect(e.errors).toHaveProperty(['header.Idempotency-Key']);
    }
    expect((await failure(w.service.approve(approver(), newId(), undefined))).status).toBe(422);
    expect(w.adjustments.size + w.ledger.length + w.audits.length).toBe(0);
  });

  it('BR-37b: creating an adjustment records it PENDING and moves no stock', async () => {
    const w = makeWorld();
    const { batch, adjustment } = await pending(w);
    expect(adjustment).toMatchObject({
      batchId: batch.id,
      warehouseId: W1,
      adjustmentType: 'SHRINKAGE',
      qtyDeltaKg: '-2.500',
      status: 'PENDING',
      createdBy: CREATOR,
      approvedBy: null,
      ledgerEntryId: null,
    });
    expect(w.ledger).toHaveLength(0);
    expect(w.batches.get(batch.id)!.qtyAvailableKg).toBe('100.000');
  });

  it('BR-37b: approval by another admin inserts exactly one ADJUSTMENT ledger row in the same transaction and records it as ledgerEntryId', async () => {
    const w = makeWorld();
    const { batch, adjustment } = await pending(w);
    const approved = await w.service.approve(approver(), adjustment.id, key());

    expect(w.ledger).toHaveLength(1);
    const row = w.ledger[0]!;
    expect(row).toMatchObject({
      batchId: batch.id,
      warehouseId: W1,
      movementType: 'ADJUSTMENT',
      qtyDeltaKg: '-2.500',
      refType: 'stock_adjustment',
      refId: adjustment.id,
      performedBy: APPROVER,
    });
    // The ledger insert joined the service's transaction rather than opening its own.
    expect(row.inTx).toBe(w.tx);
    expect(approved).toMatchObject({ status: 'APPROVED', approvedBy: APPROVER, ledgerEntryId: row.id });
    expect(approved.approvedAt).not.toBeNull();
    expect(w.batches.get(batch.id)!.qtyAvailableKg).toBe('97.500');
  });

  it('BR-37a: the creator cannot approve or reject their own adjustment (403 SELF_APPROVAL_FORBIDDEN); it stays PENDING and nothing is written', async () => {
    const w = makeWorld();
    // A Main admin holds both create and approve, so the self-approval rule is the only thing in the way.
    const { batch, adjustment } = await pending(w, mainCreator(APPROVER));
    const auditsBefore = w.audits.length;

    const self = await failure(w.service.approve(approver(APPROVER), adjustment.id, key()));
    expect(self.status).toBe(403);
    expect(self.code).toBe('SELF_APPROVAL_FORBIDDEN');
    const selfReject = await failure(w.service.reject(approver(APPROVER), adjustment.id, { reason: 'never mind' }));
    expect(selfReject.status).toBe(403);
    expect(selfReject.code).toBe('SELF_APPROVAL_FORBIDDEN');

    expect(w.adjustments.get(adjustment.id)!.status).toBe('PENDING');
    expect(w.ledger).toHaveLength(0);
    expect(w.batches.get(batch.id)!.qtyAvailableKg).toBe('100.000');
    expect(w.audits.length).toBe(auditsBefore);
  });

  it('BR-37a: the same holds for a Super Admin approving an adjustment they raised', async () => {
    const w = makeWorld();
    const sa = aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.SUPER_ADMIN, permission: 'inventory.stock_adjustment.create', userId: APPROVER });
    const { adjustment } = await pending(w, sa);
    const e = await failure(w.service.approve(approver(APPROVER, RoleCode.SUPER_ADMIN), adjustment.id, key()));
    expect(e.code).toBe('SELF_APPROVAL_FORBIDDEN');
    expect(w.ledger).toHaveLength(0);
  });

  it('BR-37: reject by another admin records who, when and why, and moves no stock', async () => {
    const w = makeWorld();
    const { batch, adjustment } = await pending(w);
    const rejected = await w.service.reject(approver(), adjustment.id, { reason: 'Recount first' });
    expect(rejected).toMatchObject({ status: 'REJECTED', rejectedBy: APPROVER, rejectionReason: 'Recount first', ledgerEntryId: null, approvedBy: null });
    expect(rejected.rejectedAt).not.toBeNull();
    expect(w.ledger).toHaveLength(0);
    expect(w.batches.get(batch.id)!.qtyAvailableKg).toBe('100.000');
  });

  it('BR-37: only a PENDING adjustment can be decided (409 INVALID_STATE_TRANSITION); an unknown id is 404; nothing more is written', async () => {
    const w = makeWorld();
    const { adjustment } = await pending(w);
    await w.service.approve(approver(), adjustment.id, key());
    const auditsAfterApprove = w.audits.length;
    for (const attempt of [
      w.service.approve(approver('00000000-0000-4000-8000-0000000000e3'), adjustment.id, key()),
      w.service.reject(approver('00000000-0000-4000-8000-0000000000e3'), adjustment.id, { reason: 'late' }),
    ]) {
      const e = await failure(attempt);
      expect(e.status).toBe(409);
      expect(e.code).toBe('INVALID_STATE_TRANSITION');
    }
    expect((await failure(w.service.approve(approver(), newId(), key()))).status).toBe(404);
    expect((await failure(w.service.reject(approver(), newId(), { reason: 'x' }))).status).toBe(404);
    expect(w.ledger).toHaveLength(1);
    expect(w.audits.length).toBe(auditsAfterApprove);
  });

  it('BR-37b: a ledger stock guard at approval (409 STOCK_UNAVAILABLE) leaves the adjustment PENDING with no audit row', async () => {
    const w = makeWorld();
    const { adjustment } = await pending(w);
    const auditsBefore = w.audits.length;
    w.ledgerFailure.next = new AppError('STOCK_UNAVAILABLE', { detail: 'Insufficient stock' });
    const e = await failure(w.service.approve(approver(), adjustment.id, key()));
    expect(e.code).toBe('STOCK_UNAVAILABLE');
    expect(w.adjustments.get(adjustment.id)!.status).toBe('PENDING');
    expect(w.audits.length).toBe(auditsBefore);
  });

  it('BR-37: a removal larger than the batch balance is refused at creation (409 STOCK_UNAVAILABLE); an unknown batch is 404; nothing is written', async () => {
    const w = makeWorld();
    const b = w.addBatch({ qtyAvailableKg: '2.000' });
    const tooMuch = await failure(w.service.create(subCreator(), key(), createAdjustmentBody.parse(createBody({ batchId: b.id, qtyDeltaKg: '-2.001' }))));
    expect(tooMuch.status).toBe(409);
    expect(tooMuch.code).toBe('STOCK_UNAVAILABLE');
    const exact = await w.service.create(subCreator(), key(), createAdjustmentBody.parse(createBody({ batchId: b.id, qtyDeltaKg: '-2' })));
    expect(exact.adjustment.status).toBe('PENDING');
    const unknown = await failure(w.service.create(subCreator(), key(), createAdjustmentBody.parse(createBody())));
    expect(unknown.status).toBe(404);
    expect(w.adjustments.size).toBe(1);
  });

  it('BR-30: a Sub admin creates only in its own warehouse; another warehouse batch is the same 404 as an unknown batch', async () => {
    const w = makeWorld();
    const foreign = w.addBatch({ warehouseId: W2 });
    const e = await failure(w.service.create(subCreator(W1), key(), createAdjustmentBody.parse(createBody({ batchId: foreign.id }))));
    expect(e.status).toBe(404);
    const unknown = await failure(w.service.create(subCreator(W1), key(), createAdjustmentBody.parse(createBody())));
    expect(e.detail?.replace(foreign.id, 'X')).toBe(unknown.detail?.replace(/[0-9a-f-]{36}/, 'X'));
    expect(w.adjustments.size + w.audits.length).toBe(0);
  });

  it('BR-30: reads are scoped: a Sub admin lists only its warehouse, another warehouse filter is an empty page (not 403), and another row is the same 404 as an unknown id', async () => {
    const w = makeWorld();
    const mine = await pending(w, subCreator(W1));
    const theirs = await pending(w, subCreator(W2));

    const subRead = aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.SUB_WH_ADMIN, permission: 'inventory.stock_adjustment.create', warehouseIds: [W1], userId: CREATOR });
    const list = await w.service.list(subRead, listAdjustmentsQuery.parse({}));
    expect(list.items.map((a) => a.id)).toEqual([mine.adjustment.id]);
    expect(list.total).toBe(1);

    const other = await w.service.list(subRead, listAdjustmentsQuery.parse({ warehouseId: W2 }));
    expect(other).toEqual({ items: [], page: 1, pageSize: 20, total: 0 });

    expect((await w.service.get(subRead, mine.adjustment.id)).id).toBe(mine.adjustment.id);
    const hidden = await failure(w.service.get(subRead, theirs.adjustment.id));
    const unknownId = newId();
    const unknown = await failure(w.service.get(subRead, unknownId));
    expect(hidden.status).toBe(404);
    expect(unknown.status).toBe(404);
    expect(hidden.detail?.replace(theirs.adjustment.id, 'X')).toBe(unknown.detail?.replace(unknownId, 'X'));

    // A Sub admin whose grant is widened to `all` is still confined to its assigned warehouse.
    const widened: ResolvedScope = { ...subRead, level: ScopeLevel.ALL };
    expect((await w.service.list(widened, listAdjustmentsQuery.parse({}))).total).toBe(1);

    const main = await w.service.list(approver(), listAdjustmentsQuery.parse({ status: 'PENDING' }));
    expect(main.total).toBe(2);
  });

  it('BR-37: one masked audit row per create, approve and reject, in the same transaction, never the free-text reason', async () => {
    const w = makeWorld();
    const { adjustment } = await pending(w, subCreator(), { reason: SECRET_REASON });
    await w.service.approve(approver(), adjustment.id, key());
    const second = await pending(w, subCreator(), { reason: SECRET_REASON });
    await w.service.reject(approver(), second.adjustment.id, { reason: SECRET_REASON });

    expect(w.audits.map((a) => a.actionCode)).toEqual([
      'inventory.stock_adjustment.create',
      'inventory.stock_adjustment.approve',
      'inventory.stock_adjustment.create',
      'inventory.stock_adjustment.reject',
    ]);
    for (const audit of w.audits) {
      expect(audit.entityType).toBe('stock_adjustment');
      expect(audit.warehouseId).toBe(W1);
      expect(audit.sql).not.toContain('Ramesh');
      expect(audit.sql).not.toContain('98765');
    }
    expect(w.audits[1]!.before).toMatchObject({ status: 'PENDING' });
    expect(w.audits[1]!.after).toMatchObject({ status: 'APPROVED', qtyDeltaKg: '-2.500', ledgerEntryId: w.ledger[0]!.id });
  });

  it('BR-37: replaying an Idempotency-Key returns the original adjustment and writes nothing twice; another body is 409 IDEMPOTENCY_KEY_REUSED', async () => {
    const w = makeWorld();
    const b = w.addBatch();
    const k = key();
    const body = createAdjustmentBody.parse(createBody({ batchId: b.id }));
    const first = await w.service.create(subCreator(), k, body);
    const replay = await w.service.create(subCreator(), k, body);
    expect(replay.replayed).toBe(true);
    expect(replay.adjustment).toEqual(first.adjustment);
    expect(w.adjustments.size).toBe(1);
    const reused = await failure(w.service.create(subCreator(), k, { ...body, qtyDeltaKg: '-1.000' }));
    expect(reused.code).toBe('IDEMPOTENCY_KEY_REUSED');

    const approveKey = key();
    const approved = await w.service.approve(approver(), first.adjustment.id, approveKey);
    const approvedAgain = await w.service.approve(approver(), first.adjustment.id, approveKey);
    expect(approvedAgain).toEqual(approved);
    expect(w.ledger).toHaveLength(1);
    expect(w.audits.filter((a) => a.actionCode === 'inventory.stock_adjustment.approve')).toHaveLength(1);
  });

  it('BR-16: no adjustment response carries the source farmer id', async () => {
    const w = makeWorld();
    const { batch, adjustment } = await pending(w);
    const approved = await w.service.approve(approver(), adjustment.id, key());
    const list = await w.service.list(approver(), listAdjustmentsQuery.parse({}));
    for (const payload of [adjustment, approved, list]) {
      expect(JSON.stringify(payload)).not.toContain(batch.sourceFarmerId);
    }
  });
});

// ===========================================================================
// 3. Route gates on a mini app with a stub service (no database)
// ===========================================================================
describe('stock adjustments routes (permission gates, stub service)', async () => {
  const { createStockAdjustmentsRouter } = await import('./stock-adjustments.routes.js');
  const { signAccessToken } = await import('../../auth/jwt.js');
  const { errorHandler, notFoundHandler } = await import('../../http/errorHandler.js');
  const calls: string[] = [];
  const stub = new Proxy({} as StockAdjustmentsService, {
    get: (_target, prop) => async () => {
      calls.push(String(prop));
      return prop === 'create' ? { adjustment: { ok: true }, replayed: false } : { ok: true };
    },
  });
  const app = express();
  app.use(express.json());
  app.use('/v1/admin/stock-adjustments', createStockAdjustmentsRouter(stub));
  app.use(notFoundHandler);
  app.use(errorHandler);

  const token = (role: RoleCode, extra: Record<string, unknown> = {}) =>
    `Bearer ${signAccessToken({ sub: newId(), roles: [{ code: role, ...extra }], farmerId: role === RoleCode.FARMER ? newId() : null, customerId: role === RoleCode.CUSTOMER ? newId() : null } as never)}`;
  const sub = () => token(RoleCode.SUB_WH_ADMIN, { warehouseId: W1 });
  const id = newId();

  it('BR-37a: a Sub Warehouse Admin is 403 on approve and reject (rbac `none`) and the service is never reached', async () => {
    calls.length = 0;
    const approve = await request(app).post(`/v1/admin/stock-adjustments/${id}/approve`).set('Authorization', sub()).set('Idempotency-Key', newId());
    expect(approve.status).toBe(403);
    expect(approve.headers['content-type']).toContain('application/problem+json');
    const reject = await request(app).post(`/v1/admin/stock-adjustments/${id}/reject`).set('Authorization', sub()).send({ reason: 'x' });
    expect(reject.status).toBe(403);
    expect(calls).toEqual([]);
  });

  it('BR-37: Super Admin, TOHFA Admin and Main reach approve and reject; a Sub admin reaches create, list and detail', async () => {
    for (const role of [RoleCode.SUPER_ADMIN, RoleCode.TOHFA_ADMIN, RoleCode.MAIN_WH_ADMIN]) {
      expect((await request(app).post(`/v1/admin/stock-adjustments/${id}/approve`).set('Authorization', token(role)).set('Idempotency-Key', newId())).status, role).toBe(200);
      expect((await request(app).post(`/v1/admin/stock-adjustments/${id}/reject`).set('Authorization', token(role)).send({ reason: 'x' })).status, role).toBe(200);
    }
    const created = await request(app).post('/v1/admin/stock-adjustments').set('Authorization', sub()).set('Idempotency-Key', newId()).send(createBody());
    expect(created.status).toBe(201);
    expect((await request(app).get('/v1/admin/stock-adjustments').set('Authorization', sub())).status).toBe(200);
    expect((await request(app).get(`/v1/admin/stock-adjustments/${id}`).set('Authorization', sub())).status).toBe(200);
  });

  it('BR-37: every route is 401 without a token and 403 for farmer, customer and Farmer Admin; a bad body is 422', async () => {
    const routes: Array<{ method: 'get' | 'post'; path: string; body?: object }> = [
      { method: 'get', path: '/v1/admin/stock-adjustments' },
      { method: 'get', path: `/v1/admin/stock-adjustments/${id}` },
      { method: 'post', path: '/v1/admin/stock-adjustments', body: createBody() },
      { method: 'post', path: `/v1/admin/stock-adjustments/${id}/approve` },
      { method: 'post', path: `/v1/admin/stock-adjustments/${id}/reject`, body: { reason: 'x' } },
    ];
    for (const route of routes) {
      expect((await request(app)[route.method](route.path).send(route.body)).status, `${route.path} anonymous`).toBe(401);
      for (const role of [RoleCode.FARMER, RoleCode.CUSTOMER]) {
        expect((await request(app)[route.method](route.path).set('Authorization', token(role)).send(route.body)).status, `${route.path} ${role}`).toBe(403);
      }
      expect((await request(app)[route.method](route.path).set('Authorization', token(RoleCode.FARMER_ADMIN, { zoneId: newId() })).send(route.body)).status, `${route.path} FA`).toBe(403);
    }
    const bad = await request(app).post('/v1/admin/stock-adjustments').set('Authorization', sub()).send(createBody({ adjustmentType: 'DAMAGE', qtyDeltaKg: '5' }));
    expect(bad.status).toBe(422);
  });
});

// ===========================================================================
// 4. Service against real PostgreSQL (rolled back; gated on DATABASE_URL)
// ===========================================================================
describeIfDatabase('stock adjustments service (PostgreSQL)', () => {
  let ready = false;
  let wh: WarehouseIds;

  beforeAll(async () => {
    ready = await requireDatabaseTables('stock_adjustments', 'stock_verifications', 'inventory_batches', 'stock_ledger', 'idempotency_keys');
    if (ready) {
      const { pool } = await import('../../db/pool.js');
      wh = await loadWarehouseIds(pool);
    }
  });

  const dbTest = (name: string, fn: () => Promise<void>) =>
    it(name, async (context) => {
      if (!ready) context.skip();
      await fn();
    });

  const service = (tx: Executor) =>
    createStockAdjustmentsService({
      repo: stockAdjustmentsRepo,
      db: tx,
      runTx: async (fn) => fn(tx),
      idempotency: createInMemoryIdempotencyStore(),
      ledger: new InventoryService(inventoryRepo, async (fn) => fn(tx)),
    });

  async function batch(tx: Executor, warehouseId: string, qty: string): Promise<string> {
    const farmer = await insertFarmerWithPlot(tx);
    const cropId = await insertCrop(tx);
    const id = newId();
    await tx.query(
      `INSERT INTO inventory_batches (id, batch_code, warehouse_id, crop_id, grade, source_farmer_id, qty_received, expiry_on, status)
       VALUES ($1, $2, $3, $4, 'GRADE_1', $5, $6::numeric, DATE '2031-01-31', 'ACTIVE')`,
      [id, `B-CI-ADJ-${id.slice(0, 8)}`, warehouseId, cropId, farmer.farmerId, qty],
    );
    await tx.query(
      `INSERT INTO stock_ledger (batch_id, warehouse_id, movement_type, qty_delta, balance_after, ref_type, remarks)
       VALUES ($1, $2, 'RECEIPT', $3::numeric, 0, 'TEST', 'fixture receipt')`,
      [id, warehouseId, qty],
    );
    return id;
  }

  const available = async (tx: Executor, batchId: string) =>
    (await tx.query<{ q: string }>(`SELECT qty_available::text AS q FROM inventory_batches WHERE id = $1`, [batchId])).rows[0]!.q;

  dbTest('BR-37b: approval inserts one ADJUSTMENT ledger row, the trigger moves the balance, and the adjustment points at that row', async () => {
    await inRolledBackTx(async (tx) => {
      const creator = await insertUser(tx, 'ADMIN', 'CI adj creator');
      const approverId = await insertUser(tx, 'ADMIN', 'CI adj approver');
      const batchId = await batch(tx, wh.ooty, '50');
      const svc = service(tx);
      const { adjustment } = await svc.create(
        aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.SUB_WH_ADMIN, permission: 'inventory.stock_adjustment.create', warehouseIds: [wh.ooty], userId: creator }),
        'db-adj-1',
        createAdjustmentBody.parse(createBody({ batchId, qtyDeltaKg: '-1.250' })),
      );
      expect(await available(tx, batchId)).toBe('50.000');
      const approved = await svc.approve(approver(approverId), adjustment.id, 'db-adj-2');
      expect(approved.status).toBe('APPROVED');
      expect(await available(tx, batchId)).toBe('48.750');
      const ledger = await tx.query<{ movement_type: string; qty_delta: string; ref_type: string; ref_id: string }>(
        `SELECT movement_type::text, qty_delta::text, ref_type, ref_id FROM stock_ledger WHERE id = $1`,
        [approved.ledgerEntryId],
      );
      expect(ledger.rows[0]).toEqual({ movement_type: 'ADJUSTMENT', qty_delta: '-1.250', ref_type: 'stock_adjustment', ref_id: adjustment.id });
      const audits = await tx.query<{ n: string }>(
        `SELECT count(*)::text AS n FROM audit_log WHERE entity_id = $1 AND action_code LIKE 'inventory.stock_adjustment.%'`,
        [adjustment.id],
      );
      expect(audits.rows[0]!.n).toBe('2');
    });
  });

  dbTest('BR-37a: the database refuses approval by the creator even if the service were bypassed, and a decided adjustment is frozen', async () => {
    await inRolledBackTx(async (tx) => {
      const creator = await insertUser(tx, 'ADMIN', 'CI adj self');
      const batchId = await batch(tx, wh.ooty, '5');
      const svc = service(tx);
      const { adjustment } = await svc.create(mainCreator(creator), 'db-adj-3', createAdjustmentBody.parse(createBody({ batchId, qtyDeltaKg: '-1' })));
      await tx.query('SAVEPOINT self_approval');
      await expect(
        tx.query(`UPDATE stock_adjustments SET approved_by = created_by, approved_at = now() WHERE id = $1`, [adjustment.id]),
      ).rejects.toThrow();
      await tx.query('ROLLBACK TO SAVEPOINT self_approval');
      const e = await failure(svc.approve(approver(creator), adjustment.id, 'db-adj-4'));
      expect(e.code).toBe('SELF_APPROVAL_FORBIDDEN');
      expect(await available(tx, batchId)).toBe('5.000');

      const other = await insertUser(tx, 'ADMIN', 'CI adj other');
      await svc.reject(approver(other), adjustment.id, { reason: 'Recount first' });
      await tx.query('SAVEPOINT frozen');
      await expect(tx.query(`UPDATE stock_adjustments SET reason = 'edited' WHERE id = $1`, [adjustment.id])).rejects.toThrow();
      await tx.query('ROLLBACK TO SAVEPOINT frozen');
    });
  });
});
