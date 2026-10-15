/**
 * BR-106 (physical stock verification: a count never edits the ledger; its variance becomes a
 * COUNT_CORRECTION stock adjustment that someone else approves, BR-37).
 *
 *  a  body and query validation (decimal-string counts, strict bodies, paging)
 *  b  recording snapshots the ledger balance as systemQtyKg, derives the variance, writes no ledger
 *     row and no adjustment; zero variance is RECONCILED, any other RECORDED; Idempotency-Key required
 *  c  scope: a Sub admin counts and reads only its warehouse; another warehouse batch or row is the
 *     same 404 as an unknown id, another warehouse filter an empty page (never 403)
 *  d  raising an adjustment: only a RECORDED count with a non-zero variance and no adjustment yet;
 *     creates ONE PENDING COUNT_CORRECTION with qtyDeltaKg = variance in the same transaction, links
 *     it and marks the count RECONCILED; anything else is 409 INVALID_STATE_TRANSITION
 *  e  one masked audit row per change (never the notes), same transaction; replay writes nothing twice
 *  f  401 without a token; 403 for farmer, customer and Farmer Admin on every route
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
import { signedKgToGrams, type CreateAdjustmentBody, type StockAdjustment } from '../stock-adjustments/stock-adjustments.schema.js';
import { createStockAdjustmentsService } from '../stock-adjustments/stock-adjustments.service.js';
import { stockAdjustmentsRepo } from '../stock-adjustments/stock-adjustments.repo.js';
import { InventoryService } from '../inventory/inventory.service.js';
import { inventoryRepo } from '../inventory/inventory.repo.js';
import {
  createVerificationBody,
  listVerificationsQuery,
  raiseAdjustmentBody,
  type ListVerificationsQuery,
  type StockVerification,
} from './stock-verifications.schema.js';
import { stockVerificationsRepo, type NewVerification, type StockVerificationsRepo } from './stock-verifications.repo.js';
import { createStockVerificationsService, type StockVerificationsService } from './stock-verifications.service.js';
import { inRolledBackTx, loadWarehouseIds, type WarehouseIds } from '../warehouse-ops/testkit.js';

const W1 = '10000000-0000-4000-8000-0000000000c1';
const W2 = '10000000-0000-4000-8000-0000000000c2';

const toKg = (grams: number): string => {
  const sign = grams < 0 ? '-' : '';
  const abs = Math.abs(grams);
  return `${sign}${Math.trunc(abs / 1000)}.${String(abs % 1000).padStart(3, '0')}`;
};

// ===========================================================================
// 1. Schemas
// ===========================================================================
describe('stock verification schemas', () => {
  it('BR-106a: the record body is strict and takes a non-negative decimal-string count; raise and list are strict', () => {
    const batchId = newId();
    expect(createVerificationBody.safeParse({ batchId, countedQtyKg: '0' }).success).toBe(true);
    expect(createVerificationBody.safeParse({ batchId, countedQtyKg: '12.345', notes: 'Rack B3' }).success).toBe(true);
    for (const bad of [
      {},
      { batchId, countedQtyKg: 12 },
      { batchId, countedQtyKg: '-1' },
      { batchId, countedQtyKg: '1.0001' },
      { batchId, countedQtyKg: '1e3' },
      { batchId: 'x', countedQtyKg: '1' },
      { batchId, countedQtyKg: '1', notes: '' },
      { batchId, countedQtyKg: '1', notes: 'n'.repeat(1001) },
      { batchId, countedQtyKg: '1', systemQtyKg: '2' },
      { batchId, countedQtyKg: '1', status: 'RECONCILED' },
    ]) {
      expect(createVerificationBody.safeParse(bad).success, JSON.stringify(bad)).toBe(false);
    }
    expect(raiseAdjustmentBody.safeParse({}).success).toBe(true);
    expect(raiseAdjustmentBody.safeParse({ reason: 'Recount confirmed' }).success).toBe(true);
    for (const bad of [{ reason: 'abc' }, { reason: 'r'.repeat(501) }, { qtyDeltaKg: '-1' }]) {
      expect(raiseAdjustmentBody.safeParse(bad).success, JSON.stringify(bad)).toBe(false);
    }
    expect(listVerificationsQuery.parse({})).toEqual({ page: 1, pageSize: 20 });
    expect(listVerificationsQuery.parse({ hasVariance: 'true' }).hasVariance).toBe(true);
    for (const bad of [{ status: 'OPEN' }, { pageSize: '101' }, { hasVariance: 'yes' }, { warehouseId: 'x' }, { farmerId: W1 }]) {
      expect(listVerificationsQuery.safeParse(bad).success, JSON.stringify(bad)).toBe(false);
    }
  });
});

// ===========================================================================
// 2. Service against an in-memory repo (no database)
// ===========================================================================
interface FakeBatch {
  id: string;
  warehouseId: string;
  batchCode: string;
  cropId: string;
  qtyAvailableKg: string;
  sourceFarmerId: string;
}

const SECRET_NOTES = 'Counted with Suresh, +91 91234 56789';

function makeWorld() {
  const batches = new Map<string, FakeBatch>();
  const verifications = new Map<string, StockVerification>();
  const raised: Array<{ tx: Executor; scope: ResolvedScope; body: CreateAdjustmentBody; adjustment: StockAdjustment }> = [];
  const audits: Array<{ actionCode: string; entityType: string; entityId: string; warehouseId: string | null; after: unknown; raw: string }> = [];
  let clock = 0;
  const stamp = () => new Date(Date.UTC(2026, 9, 14, 7, 0, clock++)).toISOString();

  const repo: StockVerificationsRepo = {
    async lockBatchForCount(_db, batchId) {
      const b = batches.get(batchId);
      return b === undefined ? null : { id: b.id, warehouseId: b.warehouseId, qtyAvailableKg: b.qtyAvailableKg };
    },
    async insertVerification(_db, input: NewVerification) {
      const id = newId();
      const b = batches.get(input.batchId)!;
      verifications.set(id, {
        id,
        warehouseId: input.warehouseId,
        batchId: input.batchId,
        batchCode: b.batchCode,
        cropId: b.cropId,
        grade: 'GRADE_1',
        systemQtyKg: toKg(signedKgToGrams(input.systemQtyKg)),
        countedQtyKg: toKg(signedKgToGrams(input.countedQtyKg)),
        // The database GENERATES this column; the fake mirrors counted - system.
        varianceKg: toKg(signedKgToGrams(input.countedQtyKg) - signedKgToGrams(input.systemQtyKg)),
        status: input.status,
        notes: input.notes,
        verifiedBy: input.verifiedBy,
        verifiedAt: stamp(),
        adjustmentId: null,
        adjustmentStatus: null,
        createdAt: stamp(),
        updatedAt: null,
      });
      return id;
    },
    async findVerification(_db, id) {
      const v = verifications.get(id);
      return v === undefined ? null : { ...v };
    },
    async lockVerification(_db, id) {
      const v = verifications.get(id);
      return v === undefined ? null : { ...v };
    },
    async list(_db, query: ListVerificationsQuery, visible) {
      const all = [...verifications.values()]
        .filter((v) => visible === null || visible.includes(v.warehouseId))
        .filter((v) => query.status === undefined || v.status === query.status)
        .filter((v) => query.warehouseId === undefined || v.warehouseId === query.warehouseId)
        .filter((v) => query.batchId === undefined || v.batchId === query.batchId)
        .filter((v) => query.hasVariance === undefined || (signedKgToGrams(v.varianceKg) !== 0) === query.hasVariance)
        .reverse();
      const start = (query.page - 1) * query.pageSize;
      return { items: all.slice(start, start + query.pageSize), total: all.length };
    },
    async linkAdjustment(_db, id, adjustmentId) {
      const v = verifications.get(id)!;
      const adjustment = raised.find((r) => r.adjustment.id === adjustmentId)?.adjustment;
      Object.assign(v, { adjustmentId, adjustmentStatus: adjustment?.status ?? null, status: 'RECONCILED', updatedAt: stamp() });
    },
  };

  const tx: Executor = {
    async query(sql: string, params?: unknown[]) {
      if (sql.includes('INSERT INTO audit_log')) {
        const p = params ?? [];
        audits.push({
          actionCode: p[3] as string,
          entityType: p[4] as string,
          entityId: p[5] as string,
          warehouseId: p[6] as string | null,
          after: p[9] === null ? null : JSON.parse(p[9] as string),
          raw: JSON.stringify(p),
        });
        return { rows: [{ id: newId() }], rowCount: 1, command: 'INSERT', oid: 0, fields: [] } as never;
      }
      throw new Error(`unexpected SQL in a unit test: ${sql.slice(0, 80)}`);
    },
  };

  const adjustments = {
    async createInTransaction(inTx: Executor, scope: ResolvedScope, body: CreateAdjustmentBody): Promise<StockAdjustment> {
      const b = batches.get(body.batchId)!;
      const adjustment: StockAdjustment = {
        id: newId(),
        batchId: b.id,
        batchCode: b.batchCode,
        warehouseId: b.warehouseId,
        cropId: b.cropId,
        grade: 'GRADE_1',
        adjustmentType: body.adjustmentType,
        qtyDeltaKg: toKg(signedKgToGrams(body.qtyDeltaKg)),
        reason: body.reason,
        status: 'PENDING',
        createdBy: scope.userId,
        createdAt: stamp(),
        approvedBy: null,
        approvedAt: null,
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null,
        ledgerEntryId: null,
        verificationId: null,
        updatedAt: null,
      };
      raised.push({ tx: inTx, scope, body, adjustment });
      return adjustment;
    },
  };

  const service = createStockVerificationsService({
    repo,
    db: tx,
    runTx: async (fn) => fn(tx),
    idempotency: createInMemoryIdempotencyStore(),
    adjustments,
  });

  const addBatch = (overrides: Partial<FakeBatch> = {}): FakeBatch => {
    const id = overrides.id ?? newId();
    const batch: FakeBatch = {
      id,
      warehouseId: W1,
      batchCode: `B-${id.slice(0, 6)}`,
      cropId: newId(),
      qtyAvailableKg: '40.000',
      sourceFarmerId: newId(),
      ...overrides,
    };
    batches.set(id, batch);
    return batch;
  };

  return { service, tx, batches, verifications, raised, audits, addBatch };
}

const COUNTER = '00000000-0000-4000-8000-0000000000d1';

const subCounter = (warehouseId = W1): ResolvedScope =>
  aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.SUB_WH_ADMIN, permission: 'inventory.stock_verification.perform', warehouseIds: [warehouseId], userId: COUNTER });
const subRaiser = (warehouseId = W1): ResolvedScope =>
  aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.SUB_WH_ADMIN, permission: 'inventory.stock_adjustment.create', warehouseIds: [warehouseId], userId: COUNTER });
const mainCounter = (): ResolvedScope =>
  aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.MAIN_WH_ADMIN, permission: 'inventory.stock_verification.perform', userId: COUNTER });

async function failure(promise: Promise<unknown>): Promise<AppError> {
  const error = await promise.then(() => null, (e: unknown) => e);
  expect(error, 'expected the call to fail').toBeInstanceOf(AppError);
  return error as AppError;
}

let keyN = 0;
const key = (): string => `ver-k-${++keyN}`;

describe('stock verifications service (in-memory repo)', () => {
  it('BR-106b: recording snapshots the ledger balance, derives the variance, and writes no ledger row and no adjustment', async () => {
    const w = makeWorld();
    const b = w.addBatch({ qtyAvailableKg: '40.000' });
    const { verification } = await w.service.create(subCounter(), key(), { batchId: b.id, countedQtyKg: '37.5', notes: 'Rack B3' });
    expect(verification).toMatchObject({
      batchId: b.id,
      warehouseId: W1,
      systemQtyKg: '40.000',
      countedQtyKg: '37.500',
      varianceKg: '-2.500',
      status: 'RECORDED',
      verifiedBy: COUNTER,
      adjustmentId: null,
    });
    expect(w.raised).toHaveLength(0);
    expect(w.batches.get(b.id)!.qtyAvailableKg).toBe('40.000');
  });

  it('BR-106b: a count that matches the system is RECONCILED at once; a surplus is RECORDED with a positive variance', async () => {
    const w = makeWorld();
    const b = w.addBatch({ qtyAvailableKg: '10.000' });
    const same = await w.service.create(subCounter(), key(), { batchId: b.id, countedQtyKg: '10' });
    expect(same.verification).toMatchObject({ varianceKg: '0.000', status: 'RECONCILED' });
    const surplus = await w.service.create(subCounter(), key(), { batchId: b.id, countedQtyKg: '10.001' });
    expect(surplus.verification).toMatchObject({ varianceKg: '0.001', status: 'RECORDED' });
  });

  it('BR-106b: a missing Idempotency-Key is 422 on record and raise and writes nothing; a replay records once', async () => {
    const w = makeWorld();
    const b = w.addBatch();
    for (const k of [undefined, '', '  ']) {
      const e = await failure(w.service.create(subCounter(), k, { batchId: b.id, countedQtyKg: '1' }));
      expect(e.status).toBe(422);
      expect(e.errors).toHaveProperty(['header.Idempotency-Key']);
    }
    expect((await failure(w.service.raiseAdjustment(subRaiser(), newId(), undefined, {}))).status).toBe(422);
    expect(w.verifications.size + w.audits.length).toBe(0);

    const k = key();
    const first = await w.service.create(subCounter(), k, { batchId: b.id, countedQtyKg: '1' });
    const again = await w.service.create(subCounter(), k, { batchId: b.id, countedQtyKg: '1' });
    expect(again.replayed).toBe(true);
    expect(again.verification).toEqual(first.verification);
    expect(w.verifications.size).toBe(1);
    expect((await failure(w.service.create(subCounter(), k, { batchId: b.id, countedQtyKg: '2' }))).code).toBe('IDEMPOTENCY_KEY_REUSED');
  });

  it('BR-106c: a Sub admin counts only its own warehouse; another warehouse batch is the same 404 as an unknown batch', async () => {
    const w = makeWorld();
    const foreign = w.addBatch({ warehouseId: W2 });
    const hidden = await failure(w.service.create(subCounter(W1), key(), { batchId: foreign.id, countedQtyKg: '1' }));
    const unknownId = newId();
    const unknown = await failure(w.service.create(subCounter(W1), key(), { batchId: unknownId, countedQtyKg: '1' }));
    expect(hidden.status).toBe(404);
    expect(unknown.status).toBe(404);
    expect(hidden.detail?.replace(foreign.id, 'X')).toBe(unknown.detail?.replace(unknownId, 'X'));
    expect(w.verifications.size + w.audits.length).toBe(0);
  });

  it('BR-106c: reads are scoped: own list only, another warehouse filter is an empty page, another row the same 404 as an unknown id', async () => {
    const w = makeWorld();
    const mine = (await w.service.create(subCounter(W1), key(), { batchId: w.addBatch({ warehouseId: W1 }).id, countedQtyKg: '1' })).verification;
    const theirs = (await w.service.create(subCounter(W2), key(), { batchId: w.addBatch({ warehouseId: W2 }).id, countedQtyKg: '1' })).verification;

    const list = await w.service.list(subCounter(W1), listVerificationsQuery.parse({}));
    expect(list.items.map((v) => v.id)).toEqual([mine.id]);
    expect(await w.service.list(subCounter(W1), listVerificationsQuery.parse({ warehouseId: W2 }))).toEqual({ items: [], page: 1, pageSize: 20, total: 0 });
    expect((await w.service.list(mainCounter(), listVerificationsQuery.parse({}))).total).toBe(2);
    expect((await w.service.list(mainCounter(), listVerificationsQuery.parse({ hasVariance: 'true' }))).total).toBe(2);

    expect((await w.service.get(subCounter(W1), mine.id)).id).toBe(mine.id);
    const unknownId = newId();
    const hidden = await failure(w.service.get(subCounter(W1), theirs.id));
    const unknown = await failure(w.service.get(subCounter(W1), unknownId));
    expect(hidden.status).toBe(404);
    expect(hidden.detail?.replace(theirs.id, 'X')).toBe(unknown.detail?.replace(unknownId, 'X'));
    // Nor can the Sub admin raise an adjustment for the other warehouse's count.
    expect((await failure(w.service.raiseAdjustment(subRaiser(W1), theirs.id, key(), {}))).status).toBe(404);
  });

  it('BR-106d: raising an adjustment creates ONE PENDING COUNT_CORRECTION equal to the variance in the same transaction, links it and reconciles the count', async () => {
    const w = makeWorld();
    const b = w.addBatch({ qtyAvailableKg: '40.000' });
    const { verification } = await w.service.create(subCounter(), key(), { batchId: b.id, countedQtyKg: '37.5' });
    const result = await w.service.raiseAdjustment(subRaiser(), verification.id, key(), {});

    expect(w.raised).toHaveLength(1);
    const call = w.raised[0]!;
    expect(call.tx).toBe(w.tx);
    expect(call.body).toMatchObject({ batchId: b.id, adjustmentType: 'COUNT_CORRECTION', qtyDeltaKg: '-2.500' });
    expect(call.body.reason.length).toBeGreaterThanOrEqual(5);
    expect(result.adjustment).toMatchObject({ status: 'PENDING', adjustmentType: 'COUNT_CORRECTION', qtyDeltaKg: '-2.500', createdBy: COUNTER });
    expect(result.verification).toMatchObject({ id: verification.id, status: 'RECONCILED', adjustmentId: result.adjustment.id, adjustmentStatus: 'PENDING' });
    // No stock moved: the adjustment still needs someone else's approval (BR-37).
    expect(w.batches.get(b.id)!.qtyAvailableKg).toBe('40.000');

    const withReason = await w.service.create(subCounter(), key(), { batchId: b.id, countedQtyKg: '41' });
    await w.service.raiseAdjustment(subRaiser(), withReason.verification.id, key(), { reason: 'Recount by two staff confirmed' });
    expect(w.raised[1]!.body).toMatchObject({ qtyDeltaKg: '1.000', reason: 'Recount by two staff confirmed' });
  });

  it('BR-106d: a reconciled, zero-variance or already-linked count is 409 INVALID_STATE_TRANSITION; an unknown id 404; nothing is written', async () => {
    const w = makeWorld();
    const b = w.addBatch({ qtyAvailableKg: '5.000' });
    const zero = (await w.service.create(subCounter(), key(), { batchId: b.id, countedQtyKg: '5' })).verification;
    const short = (await w.service.create(subCounter(), key(), { batchId: b.id, countedQtyKg: '4' })).verification;
    await w.service.raiseAdjustment(subRaiser(), short.id, key(), {});
    const auditsBefore = w.audits.length;
    for (const id of [zero.id, short.id]) {
      const e = await failure(w.service.raiseAdjustment(subRaiser(), id, key(), {}));
      expect(e.status).toBe(409);
      expect(e.code).toBe('INVALID_STATE_TRANSITION');
    }
    w.verifications.get(zero.id)!.status = 'DISPUTED';
    expect((await failure(w.service.raiseAdjustment(subRaiser(), zero.id, key(), {}))).code).toBe('INVALID_STATE_TRANSITION');
    expect((await failure(w.service.raiseAdjustment(subRaiser(), newId(), key(), {}))).status).toBe(404);
    expect(w.raised).toHaveLength(1);
    expect(w.audits.length).toBe(auditsBefore);
  });

  it('BR-106e: one masked audit row per record and raise, never the notes; replaying a raise writes nothing twice', async () => {
    const w = makeWorld();
    const b = w.addBatch({ qtyAvailableKg: '9.000' });
    const { verification } = await w.service.create(subCounter(), key(), { batchId: b.id, countedQtyKg: '8', notes: SECRET_NOTES });
    const k = key();
    const first = await w.service.raiseAdjustment(subRaiser(), verification.id, k, {});
    const replay = await w.service.raiseAdjustment(subRaiser(), verification.id, k, {});
    expect(replay).toEqual(first);
    expect(w.raised).toHaveLength(1);

    expect(w.audits.map((a) => a.actionCode)).toEqual(['inventory.stock_verification.perform', 'inventory.stock_verification.reconcile']);
    for (const audit of w.audits) {
      expect(audit.entityType).toBe('stock_verification');
      expect(audit.entityId).toBe(verification.id);
      expect(audit.warehouseId).toBe(W1);
      expect(audit.raw).not.toContain('Suresh');
      expect(audit.raw).not.toContain('91234');
    }
    expect(w.audits[0]!.after).toMatchObject({ systemQtyKg: '9.000', countedQtyKg: '8.000', varianceKg: '-1.000', status: 'RECORDED' });
    expect(w.audits[1]!.after).toMatchObject({ status: 'RECONCILED', adjustmentId: first.adjustment.id });
  });

  it('BR-16: no verification response carries the source farmer id', async () => {
    const w = makeWorld();
    const b = w.addBatch();
    const { verification } = await w.service.create(subCounter(), key(), { batchId: b.id, countedQtyKg: '1' });
    const list = await w.service.list(mainCounter(), listVerificationsQuery.parse({}));
    for (const payload of [verification, list]) expect(JSON.stringify(payload)).not.toContain(b.sourceFarmerId);
  });
});

// ===========================================================================
// 3. Route gates on a mini app with a stub service (no database)
// ===========================================================================
describe('stock verifications routes (permission gates, stub service)', async () => {
  const { createStockVerificationsRouter } = await import('./stock-verifications.routes.js');
  const { signAccessToken } = await import('../../auth/jwt.js');
  const { errorHandler, notFoundHandler } = await import('../../http/errorHandler.js');
  const stub = new Proxy({} as StockVerificationsService, {
    get: (_target, prop) => async () => (prop === 'create' ? { verification: { ok: true }, replayed: false } : { ok: true }),
  });
  const app = express();
  app.use(express.json());
  app.use('/v1/admin/stock-verifications', createStockVerificationsRouter(stub));
  app.use(notFoundHandler);
  app.use(errorHandler);

  const token = (role: RoleCode, extra: Record<string, unknown> = {}) =>
    `Bearer ${signAccessToken({ sub: newId(), roles: [{ code: role, ...extra }], farmerId: role === RoleCode.FARMER ? newId() : null, customerId: role === RoleCode.CUSTOMER ? newId() : null } as never)}`;
  const id = newId();
  const routes: Array<{ method: 'get' | 'post'; path: string; body?: object; ok: number }> = [
    { method: 'get', path: '/v1/admin/stock-verifications', ok: 200 },
    { method: 'get', path: `/v1/admin/stock-verifications/${id}`, ok: 200 },
    { method: 'post', path: '/v1/admin/stock-verifications', body: { batchId: id, countedQtyKg: '1' }, ok: 201 },
    { method: 'post', path: `/v1/admin/stock-verifications/${id}/adjustment`, body: {}, ok: 201 },
  ];

  it('BR-106f: every route is 401 without a token and 403 for farmer, customer and Farmer Admin', async () => {
    for (const route of routes) {
      expect((await request(app)[route.method](route.path).send(route.body)).status, `${route.path} anonymous`).toBe(401);
      for (const auth of [token(RoleCode.FARMER), token(RoleCode.CUSTOMER), token(RoleCode.FARMER_ADMIN, { zoneId: newId() })]) {
        const res = await request(app)[route.method](route.path).set('Authorization', auth).send(route.body);
        expect(res.status, route.path).toBe(403);
      }
    }
  });

  it('BR-106c: Super Admin, TOHFA Admin, Main and a Sub admin reach every route; a bad body is 422', async () => {
    for (const auth of [token(RoleCode.SUPER_ADMIN), token(RoleCode.TOHFA_ADMIN), token(RoleCode.MAIN_WH_ADMIN), token(RoleCode.SUB_WH_ADMIN, { warehouseId: W1 })]) {
      for (const route of routes) {
        expect((await request(app)[route.method](route.path).set('Authorization', auth).set('Idempotency-Key', newId()).send(route.body)).status, route.path).toBe(route.ok);
      }
    }
    const bad = await request(app).post('/v1/admin/stock-verifications').set('Authorization', token(RoleCode.MAIN_WH_ADMIN)).send({ batchId: id, countedQtyKg: -1 });
    expect(bad.status).toBe(422);
  });
});

// ===========================================================================
// 4. Real PostgreSQL (rolled back; gated on DATABASE_URL)
// ===========================================================================
describeIfDatabase('stock verifications service (PostgreSQL)', () => {
  let ready = false;
  let wh: WarehouseIds;

  beforeAll(async () => {
    ready = await requireDatabaseTables('stock_verifications', 'stock_adjustments', 'inventory_batches', 'stock_ledger', 'idempotency_keys');
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

  dbTest('BR-106b/d: the database snapshots and generates the variance; raising links a PENDING adjustment that a different admin approves through the ledger', async () => {
    await inRolledBackTx(async (tx) => {
      const counter = await insertUser(tx, 'ADMIN', 'CI counter');
      const approverId = await insertUser(tx, 'ADMIN', 'CI count approver');
      const farmer = await insertFarmerWithPlot(tx);
      const cropId = await insertCrop(tx);
      const batchId = newId();
      await tx.query(
        `INSERT INTO inventory_batches (id, batch_code, warehouse_id, crop_id, grade, source_farmer_id, qty_received, expiry_on, status)
         VALUES ($1, $2, $3, $4, 'GRADE_1', $5, 30, DATE '2031-01-31', 'ACTIVE')`,
        [batchId, `B-CI-VER-${batchId.slice(0, 8)}`, wh.ooty, cropId, farmer.farmerId],
      );
      await tx.query(
        `INSERT INTO stock_ledger (batch_id, warehouse_id, movement_type, qty_delta, balance_after, ref_type, remarks)
         VALUES ($1, $2, 'RECEIPT', 30, 0, 'TEST', 'fixture receipt')`,
        [batchId, wh.ooty],
      );
      const ledger = new InventoryService(inventoryRepo, async (fn) => fn(tx));
      const adjustments = createStockAdjustmentsService({ repo: stockAdjustmentsRepo, db: tx, runTx: async (fn) => fn(tx), idempotency: createInMemoryIdempotencyStore(), ledger });
      const svc = createStockVerificationsService({ repo: stockVerificationsRepo, db: tx, runTx: async (fn) => fn(tx), idempotency: createInMemoryIdempotencyStore(), adjustments });

      const sub = (permission: string) => aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.SUB_WH_ADMIN, permission, warehouseIds: [wh.ooty], userId: counter });
      const { verification } = await svc.create(sub('inventory.stock_verification.perform'), 'db-ver-1', { batchId, countedQtyKg: '28.75' });
      expect(verification).toMatchObject({ systemQtyKg: '30.000', countedQtyKg: '28.750', varianceKg: '-1.250', status: 'RECORDED' });

      const raised = await svc.raiseAdjustment(sub('inventory.stock_adjustment.create'), verification.id, 'db-ver-2', {});
      expect(raised.verification).toMatchObject({ status: 'RECONCILED', adjustmentId: raised.adjustment.id, adjustmentStatus: 'PENDING' });
      expect(raised.adjustment.verificationId).toBe(verification.id);

      const approved = await adjustments.approve(
        aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.MAIN_WH_ADMIN, permission: 'inventory.stock_adjustment.approve', userId: approverId }),
        raised.adjustment.id,
        'db-ver-3',
      );
      expect(approved.status).toBe('APPROVED');
      const q = await tx.query<{ q: string }>(`SELECT qty_available::text AS q FROM inventory_batches WHERE id = $1`, [batchId]);
      expect(q.rows[0]!.q).toBe('28.750');
      expect((await svc.get(sub('inventory.stock_verification.perform'), verification.id)).adjustmentStatus).toBe('APPROVED');
    });
  });
});
