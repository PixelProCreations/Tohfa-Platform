/**
 * BR-102 (inter-warehouse transfers) and BR-26 (who may initiate one).
 *
 *  a  create body validation; Idempotency-Key required
 *  b  below the threshold: IN_TRANSIT at creation, one TRANSFER_OUT per line; above the free shelf 409
 *  c  at/above the threshold or with an unvalued line: PENDING_APPROVAL, nothing moves; exact paise
 *  d  approve: only PENDING_APPROVAL, never by the initiator, then dispatches
 *  e  receive: only IN_TRANSIT, every line, no over-receipt, a short line needs a note, TRANSFER_IN rows
 *  f  receive scope: destination yes, source 403 WAREHOUSE_SCOPE_VIOLATION, unrelated 404
 *  g  cancel: only PENDING_APPROVAL, reason required
 *  h  reads scoped to either side; same 404 for another and unknown; no farmer id anywhere
 *  i  one masked audit row per state change; an Idempotency-Key replay writes nothing twice
 *
 * Layers: schema tests (no I/O); service tests against a hand-written in-memory repo (always run);
 * service tests against real PostgreSQL in a rolled-back transaction and real-HTTP tests through the
 * real app router (both gated on DATABASE_URL).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { aScope, describeIfDatabase, newId } from '../../test/factories.js';
import { insertCrop, insertFarmerWithPlot, insertUser, requireDatabaseTables } from '../../test/dbFixtures.js';
import { createInMemoryIdempotencyStore } from '../../test/idempotencyStore.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import {
  cancelTransferBody,
  createTransferBody,
  kgToGrams,
  listTransfersQuery,
  receiveTransferBody,
  type ListTransfersQuery,
  type Transfer,
} from './warehouse-transfers.schema.js';
import {
  warehouseTransfersRepo,
  type BatchCheck,
  type LedgerInsert,
  type NewTransfer,
  type NewTransferItem,
  type WarehouseTransfersRepo,
} from './warehouse-transfers.repo.js';
import { createWarehouseTransfersService, type WarehouseTransfersServiceDeps } from './warehouse-transfers.service.js';
import { inRolledBackTx, loadWarehouseIds, startHttpHarness, type HttpHarness, type WarehouseIds } from './../warehouse-ops/testkit.js';

// ===========================================================================
// 1. Schemas
// ===========================================================================
const W1 = '10000000-0000-4000-8000-0000000000a1';
const W2 = '10000000-0000-4000-8000-0000000000a2';
const W3 = '10000000-0000-4000-8000-0000000000a3';

const line = (qtyKg = '1.5') => ({ batchId: newId(), qtyKg });
const body = (overrides: Record<string, unknown> = {}) => ({ fromWarehouseId: W1, toWarehouseId: W2, lines: [line()], ...overrides });

describe('warehouse transfer schemas', () => {
  it('BR-102a: the create body needs two different warehouses, 1-50 distinct batches and positive decimal-string quantities, and is strict', () => {
    expect(createTransferBody.safeParse(body()).success).toBe(true);
    expect(createTransferBody.safeParse(body({ vehicleNumber: 'TN43 AB 1234', notes: 'Fragile' })).success).toBe(true);
    expect(createTransferBody.safeParse(body({ lines: Array.from({ length: 50 }, () => line()) })).success).toBe(true);

    const dup = line();
    for (const bad of [
      body({ toWarehouseId: W1 }),
      body({ lines: [] }),
      body({ lines: Array.from({ length: 51 }, () => line()) }),
      body({ lines: [dup, { ...dup, qtyKg: '2' }] }),
      body({ lines: [{ batchId: newId(), qtyKg: 1.5 }] }),
      body({ lines: [{ batchId: newId(), qtyKg: '0' }] }),
      body({ lines: [{ batchId: newId(), qtyKg: '0.000' }] }),
      body({ lines: [{ batchId: newId(), qtyKg: '-1' }] }),
      body({ lines: [{ batchId: newId(), qtyKg: '1.0001' }] }),
      body({ lines: [{ batchId: newId(), qtyKg: '1e3' }] }),
      body({ lines: [{ batchId: 'not-a-uuid', qtyKg: '1' }] }),
      body({ lines: [{ batchId: newId(), qtyKg: '1', farmerId: newId() }] }),
      body({ status: 'IN_TRANSIT' }),
      body({ vehicleNumber: 'V'.repeat(21) }),
      body({ notes: 'n'.repeat(1001) }),
      { toWarehouseId: W2, lines: [line()] },
    ]) {
      expect(createTransferBody.safeParse(bad).success, JSON.stringify(bad).slice(0, 120)).toBe(false);
    }
  });

  it('BR-102e: the receive body is strict, lines are distinct and quantities are non-negative decimal strings', () => {
    const itemId = newId();
    expect(receiveTransferBody.safeParse({ lines: [{ itemId, qtyReceivedKg: '0' }] }).success).toBe(true);
    expect(receiveTransferBody.safeParse({ lines: [{ itemId, qtyReceivedKg: '1.250' }], receiptNote: 'one crate crushed' }).success).toBe(true);
    for (const bad of [
      {},
      { lines: [] },
      { lines: [{ itemId, qtyReceivedKg: 1 }] },
      { lines: [{ itemId, qtyReceivedKg: '-1' }] },
      { lines: [{ itemId, qtyReceivedKg: '1' }, { itemId, qtyReceivedKg: '1' }] },
      { lines: [{ itemId, qtyReceivedKg: '1' }], receiptNote: '' },
      { lines: [{ itemId, qtyReceivedKg: '1' }], receiptNote: 'x'.repeat(1001) },
      { lines: [{ itemId, qtyReceivedKg: '1' }], status: 'RECEIVED' },
    ]) {
      expect(receiveTransferBody.safeParse(bad).success, JSON.stringify(bad)).toBe(false);
    }
  });

  it('BR-102g: cancel needs a reason of 1-500 characters and nothing else', () => {
    expect(cancelTransferBody.safeParse({ reason: 'Truck unavailable' }).success).toBe(true);
    for (const bad of [{}, { reason: '' }, { reason: '   ' }, { reason: 'r'.repeat(501) }, { reason: 'x', status: 'CANCELLED' }]) {
      expect(cancelTransferBody.safeParse(bad).success, JSON.stringify(bad)).toBe(false);
    }
  });

  it('BR-102h: the list query is strict, pages at most 100, and direction requires warehouseId', () => {
    expect(listTransfersQuery.parse({})).toEqual({ page: 1, pageSize: 20 });
    expect(listTransfersQuery.safeParse({ status: 'IN_TRANSIT', warehouseId: W1, direction: 'INBOUND' }).success).toBe(true);
    for (const bad of [
      { direction: 'INBOUND' },
      { status: 'DRAFT' },
      { pageSize: '101' },
      { page: '0' },
      { warehouseId: 'x' },
      { farmerId: W1 },
    ]) {
      expect(listTransfersQuery.safeParse(bad).success, JSON.stringify(bad)).toBe(false);
    }
  });
});

// ===========================================================================
// 2. Service against an in-memory repo (no database)
// ===========================================================================
interface FakeBatch {
  id: string;
  batchCode: string;
  warehouseId: string;
  cropId: string;
  grade: string;
  status: string;
  costPerKg: string | null;
  sourceFarmerId: string;
  freeGrams: number;
}

interface StoredItem {
  id: string;
  batchId: string;
  qtyKg: string;
  costPerKg: string | null;
  lineValuePaise: number | null;
  qtyReceivedKg: string | null;
  destBatchId: string | null;
  outLedgerId: string | null;
  inLedgerId: string | null;
}

interface StoredTransfer {
  header: NewTransfer & { id: string; transferNumber: string; status: string };
  extra: Record<string, unknown>;
  items: StoredItem[];
}

const SECRET_NOTES = 'Driver Ramesh +91 98765 43210';

function costPaise(cost: string): number {
  const [rupees = '0', paise = ''] = cost.split('.');
  return Number(rupees) * 100 + Number(paise.padEnd(2, '0'));
}

function makeWorld(options: { threshold?: number } = {}) {
  const warehouses = new Map<string, boolean>([
    [W1, true],
    [W2, true],
    [W3, true],
  ]);
  const batches = new Map<string, FakeBatch>();
  const transfers = new Map<string, StoredTransfer>();
  const ledger: Array<LedgerInsert & { id: string }> = [];
  const destBatches: Array<{ id: string; sourceBatchId: string; warehouseId: string; qtyKg: string; batchCode: string }> = [];
  const audits: Array<{ actionCode: string; entityType: string; entityId: string; warehouseId: string | null; before: unknown; after: unknown }> = [];
  let seq = 0;
  const threshold = { value: options.threshold ?? 5_000_000 };

  const toTransfer = (stored: StoredTransfer): Transfer => {
    const h = stored.header;
    return {
      id: h.id,
      transferNumber: h.transferNumber,
      // BR-126 fields: the in-memory repo does not model them (covered on PostgreSQL in
      // warehouse-transfers.receive-details.test.ts).
      receiptNumber: (stored.extra['receiptNumber'] as string | null | undefined) ?? null,
      fromWarehouseId: h.fromWarehouseId,
      toWarehouseId: h.toWarehouseId,
      status: h.status as Transfer['status'],
      totalValue: `${Math.trunc(h.totalValuePaise / 100)}.${String(h.totalValuePaise % 100).padStart(2, '0')}`,
      hasUnvaluedLines: h.hasUnvaluedLines,
      requiresApproval: h.requiresApproval,
      hasDiscrepancy: (stored.extra['hasDiscrepancy'] as boolean | undefined) ?? false,
      vehicleNumber: h.vehicleNumber,
      notes: h.notes,
      receiptNote: (stored.extra['receiptNote'] as string | null | undefined) ?? null,
      cancelReason: (stored.extra['cancelReason'] as string | null | undefined) ?? null,
      initiatedBy: h.initiatedBy,
      initiatedByName: null,
      approvedBy: (stored.extra['approvedBy'] as string | null | undefined) ?? null,
      approvedAt: (stored.extra['approvedAt'] as string | null | undefined) ?? null,
      dispatchedAt: (stored.extra['dispatchedAt'] as string | null | undefined) ?? null,
      receivedBy: (stored.extra['receivedBy'] as string | null | undefined) ?? null,
      receivedAt: (stored.extra['receivedAt'] as string | null | undefined) ?? null,
      cancelledBy: (stored.extra['cancelledBy'] as string | null | undefined) ?? null,
      cancelledAt: (stored.extra['cancelledAt'] as string | null | undefined) ?? null,
      createdAt: '2026-10-12T05:00:00.000Z',
      updatedAt: null,
      lines: stored.items.map((item) => {
        const batch = batches.get(item.batchId)!;
        const variance =
          item.qtyReceivedKg === null ? null : ((kgToGrams(item.qtyReceivedKg) - kgToGrams(item.qtyKg)) / 1000).toFixed(3);
        return {
          id: item.id,
          batchId: item.batchId,
          batchCode: batch.batchCode,
          cropId: batch.cropId,
          grade: batch.grade,
          qtySentKg: (kgToGrams(item.qtyKg) / 1000).toFixed(3),
          qtyReceivedKg: item.qtyReceivedKg === null ? null : (kgToGrams(item.qtyReceivedKg) / 1000).toFixed(3),
          varianceKg: variance,
          costPerKg: item.costPerKg,
          lineValue:
            item.lineValuePaise === null
              ? null
              : `${Math.trunc(item.lineValuePaise / 100)}.${String(item.lineValuePaise % 100).padStart(2, '0')}`,
          destBatchId: item.destBatchId,
          damagedQtyKg: null,
          spoiledQtyKg: null,
          condition: null,
          actualGrade: null,
          actualProductId: null,
          actualProductName: null,
          storageLocationId: null,
          storageLocation: null,
        };
      }),
    };
  };

  const repo: WarehouseTransfersRepo = {
    async findWarehouses(_db, ids) {
      return ids.filter((id) => warehouses.has(id)).map((id) => ({ id, isActive: warehouses.get(id)! }));
    },
    async highValueThresholdPaise() {
      return threshold.value;
    },
    async lockAndCheckBatches(_db, lines) {
      const out: BatchCheck[] = [];
      for (const l of lines) {
        const b = batches.get(l.batchId);
        if (b === undefined) continue;
        const grams = kgToGrams(l.qtyKg);
        out.push({
          batchId: b.id,
          batchCode: b.batchCode,
          warehouseId: b.warehouseId,
          status: b.status,
          costPerKg: b.costPerKg,
          lineValuePaise: b.costPerKg === null ? null : Math.round((grams * costPaise(b.costPerKg)) / 1000),
          fits: grams <= b.freeGrams,
        });
      }
      return out;
    },
    async insertTransfer(_db, input) {
      seq += 1;
      const id = newId();
      const transferNumber = `TRF-${String(seq).padStart(6, '0')}`;
      transfers.set(id, { header: { ...input, id, transferNumber, status: 'PENDING_APPROVAL' }, extra: {}, items: [] });
      return { id, transferNumber };
    },
    async insertItems(_db, transferId, items: NewTransferItem[]) {
      const t = transfers.get(transferId)!;
      for (const item of items) {
        t.items.push({ id: newId(), ...item, qtyReceivedKg: null, destBatchId: null, outLedgerId: null, inLedgerId: null });
      }
    },
    async lockTransfer(_db, id) {
      const t = transfers.get(id);
      return t === undefined ? null : toTransfer(t);
    },
    async findTransfer(_db, id) {
      const t = transfers.get(id);
      return t === undefined ? null : toTransfer(t);
    },
    async list(_db, query: ListTransfersQuery, visible) {
      let items = [...transfers.values()].map(toTransfer);
      if (visible !== null) items = items.filter((t) => visible.includes(t.fromWarehouseId) || visible.includes(t.toWarehouseId));
      if (query.status !== undefined) items = items.filter((t) => t.status === query.status);
      if (query.warehouseId !== undefined) {
        const w = query.warehouseId;
        items = items.filter((t) =>
          query.direction === 'INBOUND' ? t.toWarehouseId === w : query.direction === 'OUTBOUND' ? t.fromWarehouseId === w : t.fromWarehouseId === w || t.toWarehouseId === w,
        );
      }
      return { items: items.map(({ lines: _lines, ...summary }) => summary), total: items.length };
    },
    async insertLedger(_db, row) {
      const id = newId();
      const batch = batches.get(row.batchId);
      if (batch !== undefined) batch.freeGrams += Math.sign(Number(row.qtyDeltaKg)) * kgToGrams(row.qtyDeltaKg.replace('-', ''));
      ledger.push({ ...row, id });
      return id;
    },
    async setOutLedger(_db, itemId, ledgerId) {
      for (const t of transfers.values()) for (const i of t.items) if (i.id === itemId) i.outLedgerId = ledgerId;
    },
    async markDispatched(_db, id, approvedBy) {
      const t = transfers.get(id)!;
      t.header.status = 'IN_TRANSIT';
      t.extra['dispatchedAt'] = '2026-10-12T06:00:00.000Z';
      if (approvedBy !== null) {
        t.extra['approvedBy'] = approvedBy;
        t.extra['approvedAt'] = '2026-10-12T06:00:00.000Z';
      }
    },
    async insertDestBatch(_db, input) {
      const source = batches.get(input.sourceBatchId)!;
      const id = newId();
      const batchCode = `${source.batchCode}/${input.transferNumber}`;
      destBatches.push({ id, sourceBatchId: input.sourceBatchId, warehouseId: input.warehouseId, qtyKg: input.qtyKg, batchCode });
      batches.set(id, { ...source, id, batchCode, warehouseId: input.warehouseId, freeGrams: 0, status: 'ACTIVE' });
      return id;
    },
    async markItemReceived(_db, itemId, input) {
      for (const t of transfers.values()) {
        for (const i of t.items) {
          if (i.id === itemId) {
            i.qtyReceivedKg = input.qtyKg;
            i.destBatchId = input.destBatchId;
            i.inLedgerId = input.inLedgerId;
          }
        }
      }
    },
    async markReceived(_db, id, input) {
      const t = transfers.get(id)!;
      t.header.status = 'RECEIVED';
      t.extra['receivedBy'] = input.receivedBy;
      t.extra['receivedAt'] = '2026-10-13T06:00:00.000Z';
      t.extra['hasDiscrepancy'] = input.hasDiscrepancy;
      t.extra['receiptNote'] = input.receiptNote;
    },
    async findLiveCropIds() {
      return [];
    },
    async findPlaceableLocation() {
      return null;
    },
    async markCancelled(_db, id, input) {
      const t = transfers.get(id)!;
      t.header.status = 'CANCELLED';
      t.extra['cancelledBy'] = input.cancelledBy;
      t.extra['cancelledAt'] = '2026-10-12T07:00:00.000Z';
      t.extra['cancelReason'] = input.reason;
    },
  };

  // The only SQL the service runs itself: the audit insert (writeAuditLog) and nothing else.
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
        });
        return { rows: [{ id: newId() }], rowCount: 1, command: 'INSERT', oid: 0, fields: [] } as never;
      }
      throw new Error(`unexpected SQL in a unit test: ${sql.slice(0, 80)}`);
    },
  };

  const deps: WarehouseTransfersServiceDeps = {
    repo,
    db: tx,
    runTx: async (fn) => fn(tx),
    idempotency: createInMemoryIdempotencyStore(),
  };

  const addBatch = (overrides: Partial<FakeBatch> = {}): FakeBatch => {
    const id = overrides.id ?? newId();
    const batch: FakeBatch = {
      id,
      batchCode: `B-${id.slice(0, 6)}`,
      warehouseId: W1,
      cropId: newId(),
      grade: 'GRADE_1',
      status: 'ACTIVE',
      costPerKg: '40.00',
      sourceFarmerId: newId(),
      freeGrams: 100_000,
      ...overrides,
    };
    batches.set(id, batch);
    return batch;
  };

  return { repo, deps, service: createWarehouseTransfersService(deps), warehouses, batches, transfers, ledger, destBatches, audits, threshold, addBatch };
}

const SA = '00000000-0000-4000-8000-0000000000f1';
const SA2 = '00000000-0000-4000-8000-0000000000f2';
const MAIN = '00000000-0000-4000-8000-0000000000f3';

const initiator = (userId = MAIN): ResolvedScope =>
  aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.MAIN_WH_ADMIN, permission: 'transfer.inter_warehouse.initiate', userId });
const approver = (userId = SA): ResolvedScope =>
  aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.SUPER_ADMIN, permission: 'transfer.high_value.approve', userId });
const receiver = (userId = SA2): ResolvedScope =>
  aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.SUPER_ADMIN, permission: 'transfer.inter_warehouse.receive', userId });
/** A Sub admin's receive grant is `all` in rbac.json; the service confines it to its warehouse. */
const subReceiver = (warehouseId: string): ResolvedScope =>
  aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.SUB_WH_ADMIN, permission: 'transfer.inter_warehouse.receive', warehouseIds: [warehouseId], userId: SA2 });
const subViewer = (warehouseId: string): ResolvedScope =>
  aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.SUB_WH_ADMIN, permission: 'transfer.inter_warehouse.view', warehouseIds: [warehouseId], userId: SA2 });
const viewer = (): ResolvedScope =>
  aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.TOHFA_ADMIN, permission: 'transfer.inter_warehouse.view', userId: SA2 });

async function failure(promise: Promise<unknown>): Promise<AppError> {
  const error = await promise.then(() => null, (e: unknown) => e);
  expect(error, 'expected the call to fail').toBeInstanceOf(AppError);
  return error as AppError;
}

let keyN = 0;
const key = (): string => `k-${++keyN}`;

describe('warehouse transfers service (in-memory repo)', () => {
  it('BR-102a: a missing or blank Idempotency-Key is 422 on create, approve and receive and writes nothing', async () => {
    const w = makeWorld();
    const b = w.addBatch();
    for (const k of [undefined, '', '   ']) {
      const e = await failure(w.service.create(initiator(), k, body({ lines: [{ batchId: b.id, qtyKg: '1' }] })));
      expect(e.status).toBe(422);
      expect(e.errors).toHaveProperty(['header.Idempotency-Key']);
    }
    expect((await failure(w.service.approve(approver(), newId(), undefined))).status).toBe(422);
    expect((await failure(w.service.receive(receiver(), newId(), undefined, { lines: [{ itemId: newId(), qtyReceivedKg: '1' }] }))).status).toBe(422);
    expect(w.transfers.size + w.ledger.length + w.audits.length).toBe(0);
  });

  it('BR-102b: below the threshold the transfer is IN_TRANSIT at creation with one TRANSFER_OUT row per line from the source warehouse', async () => {
    const w = makeWorld();
    const b1 = w.addBatch({ costPerKg: '40.00' });
    const b2 = w.addBatch({ costPerKg: '12.35' });
    const { transfer, replayed } = await w.service.create(initiator(), key(), body({
      lines: [{ batchId: b1.id, qtyKg: '10' }, { batchId: b2.id, qtyKg: '3.333' }],
      vehicleNumber: 'TN43 AB 1234',
      notes: SECRET_NOTES,
    }));
    expect(replayed).toBe(false);
    expect(transfer).toMatchObject({
      status: 'IN_TRANSIT',
      requiresApproval: false,
      hasUnvaluedLines: false,
      fromWarehouseId: W1,
      toWarehouseId: W2,
      initiatedBy: MAIN,
      approvedBy: null,
      // 10 x 40.00 = 400.00; 3.333 x 12.35 = 41.16255 -> 4116 paise
      totalValue: '441.16',
    });
    expect(transfer.dispatchedAt).not.toBeNull();
    expect(transfer.transferNumber).toMatch(/^TRF-\d{6}$/);
    expect(transfer.lines.map((l) => l.lineValue)).toEqual(['400.00', '41.16']);

    expect(w.ledger).toHaveLength(2);
    for (const row of w.ledger) {
      expect(row).toMatchObject({ movementType: 'TRANSFER_OUT', warehouseId: W1, transferId: transfer.id, actorId: MAIN });
      expect(row.qtyDeltaKg.startsWith('-')).toBe(true);
    }
    expect(w.ledger.map((r) => r.qtyDeltaKg)).toEqual(['-10.000', '-3.333']);
    const stored = w.transfers.get(transfer.id)!;
    expect(stored.items.map((i) => i.outLedgerId)).toEqual(w.ledger.map((r) => r.id));
    expect(w.batches.get(b1.id)!.freeGrams).toBe(90_000);
  });

  it('BR-102b: a quantity above the free shelf is 409 STOCK_UNAVAILABLE and writes nothing', async () => {
    const w = makeWorld();
    const ok = w.addBatch({ freeGrams: 50_000 });
    const short = w.addBatch({ freeGrams: 2_000 });
    const e = await failure(
      w.service.create(initiator(), key(), body({ lines: [{ batchId: ok.id, qtyKg: '5' }, { batchId: short.id, qtyKg: '2.001' }] })),
    );
    expect(e.status).toBe(409);
    expect(e.code).toBe('STOCK_UNAVAILABLE');
    expect(w.transfers.size + w.ledger.length + w.audits.length).toBe(0);
    // Exactly the free shelf is allowed.
    const { transfer } = await w.service.create(initiator(), key(), body({ lines: [{ batchId: short.id, qtyKg: '2' }] }));
    expect(transfer.status).toBe('IN_TRANSIT');
  });

  it('BR-102b: a database stock guard (23514 INSUFFICIENT_STOCK) at dispatch is translated to 409 STOCK_UNAVAILABLE', async () => {
    const w = makeWorld();
    const b = w.addBatch();
    w.repo.insertLedger = async () => {
      throw Object.assign(new Error('insufficient stock'), { code: '23514', hint: 'code: INSUFFICIENT_STOCK' });
    };
    const e = await failure(w.service.create(initiator(), key(), body({ lines: [{ batchId: b.id, qtyKg: '1' }] })));
    expect(e.code).toBe('STOCK_UNAVAILABLE');
    expect(e.status).toBe(409);
  });

  it('BR-102b: an unknown, inactive or foreign batch and an unknown or inactive warehouse are 422 on the field; nothing is written', async () => {
    const w = makeWorld();
    const good = w.addBatch();
    const depleted = w.addBatch({ status: 'DEPLETED' });
    const elsewhere = w.addBatch({ warehouseId: W3 });
    const cases: Array<[Record<string, unknown>, string]> = [
      [body({ lines: [{ batchId: newId(), qtyKg: '1' }] }), 'body.lines.0.batchId'],
      [body({ lines: [{ batchId: good.id, qtyKg: '1' }, { batchId: depleted.id, qtyKg: '1' }] }), 'body.lines.1.batchId'],
      [body({ lines: [{ batchId: elsewhere.id, qtyKg: '1' }] }), 'body.lines.0.batchId'],
      [body({ toWarehouseId: newId(), lines: [{ batchId: good.id, qtyKg: '1' }] }), 'body.toWarehouseId'],
      [body({ fromWarehouseId: newId(), lines: [{ batchId: good.id, qtyKg: '1' }] }), 'body.fromWarehouseId'],
    ];
    for (const [b, field] of cases) {
      const e = await failure(w.service.create(initiator(), key(), b as never));
      expect(e.status, field).toBe(422);
      expect(e.code).toBe('VALIDATION_FAILED');
      expect(e.errors, field).toHaveProperty([field]);
    }
    w.warehouses.set(W2, false);
    const inactive = await failure(w.service.create(initiator(), key(), body({ lines: [{ batchId: good.id, qtyKg: '1' }] })));
    expect(inactive.errors).toHaveProperty(['body.toWarehouseId']);
    expect(w.transfers.size + w.ledger.length + w.audits.length).toBe(0);
  });

  it('BR-102b: a scope confined to another warehouse cannot send from the source (404, as BR-30)', async () => {
    const w = makeWorld();
    const b = w.addBatch();
    const confined = aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.SUB_WH_ADMIN, permission: 'transfer.inter_warehouse.initiate', warehouseIds: [W2], userId: MAIN });
    const e = await failure(w.service.create(confined, key(), body({ lines: [{ batchId: b.id, qtyKg: '1' }] })));
    expect(e.status).toBe(404);
    expect(w.transfers.size).toBe(0);
  });

  it('BR-102c: at the threshold, or with an unvalued line, the transfer is PENDING_APPROVAL and no ledger row is written; one paisa below is dispatched', async () => {
    const w = makeWorld({ threshold: 5_000_000 });
    // 1250 kg x 40.00 = 50,000.00 = exactly the threshold.
    const big = w.addBatch({ costPerKg: '40.00', freeGrams: 5_000_000 });
    const at = await w.service.create(initiator(), key(), body({ lines: [{ batchId: big.id, qtyKg: '1250' }] }));
    expect(at.transfer).toMatchObject({ status: 'PENDING_APPROVAL', requiresApproval: true, totalValue: '50000.00', dispatchedAt: null });
    expect(w.ledger).toHaveLength(0);

    // 1249.999 kg x 40.00 = 49,999.96: below.
    const below = await w.service.create(initiator(), key(), body({ lines: [{ batchId: big.id, qtyKg: '1249.999' }] }));
    expect(below.transfer).toMatchObject({ status: 'IN_TRANSIT', requiresApproval: false, totalValue: '49999.96' });
    expect(w.ledger).toHaveLength(1);

    const unvalued = w.addBatch({ costPerKg: null });
    const cheap = w.addBatch({ costPerKg: '1.00' });
    const u = await w.service.create(initiator(), key(), body({ lines: [{ batchId: cheap.id, qtyKg: '1' }, { batchId: unvalued.id, qtyKg: '1' }] }));
    expect(u.transfer).toMatchObject({ status: 'PENDING_APPROVAL', requiresApproval: true, hasUnvaluedLines: true, totalValue: '1.00' });
    expect(u.transfer.lines.map((l) => [l.costPerKg, l.lineValue])).toEqual([['1.00', '1.00'], [null, null]]);
    expect(w.ledger).toHaveLength(1);
  });

  it('BR-102c: the threshold is whatever the repo reads from system_config', async () => {
    const w = makeWorld({ threshold: 100 });
    const b = w.addBatch({ costPerKg: '1.00' });
    expect((await w.service.create(initiator(), key(), body({ lines: [{ batchId: b.id, qtyKg: '0.994' }] }))).transfer.status).toBe('IN_TRANSIT');
    // 0.995 kg x Rs 1.00 = 99.5 paise, rounded to 100 = the threshold.
    expect((await w.service.create(initiator(), key(), body({ lines: [{ batchId: b.id, qtyKg: '0.995' }] }))).transfer.status).toBe('PENDING_APPROVAL');
    expect((await w.service.create(initiator(), key(), body({ lines: [{ batchId: b.id, qtyKg: '1' }] }))).transfer.status).toBe('PENDING_APPROVAL');
  });

  async function pending(w: ReturnType<typeof makeWorld>, by = MAIN) {
    const b = w.addBatch({ costPerKg: null });
    return (await w.service.create(initiator(by), key(), body({ lines: [{ batchId: b.id, qtyKg: '4' }] }))).transfer;
  }

  it('BR-102d: approval by someone else dispatches (TRANSFER_OUT rows, IN_TRANSIT, approver recorded)', async () => {
    const w = makeWorld();
    const t = await pending(w);
    const approved = await w.service.approve(approver(), t.id, key());
    expect(approved).toMatchObject({ status: 'IN_TRANSIT', approvedBy: SA });
    expect(approved.approvedAt).not.toBeNull();
    expect(approved.dispatchedAt).not.toBeNull();
    expect(w.ledger).toHaveLength(1);
    expect(w.ledger[0]).toMatchObject({ movementType: 'TRANSFER_OUT', warehouseId: W1, qtyDeltaKg: '-4.000', actorId: SA });
  });

  it('BR-102d: the initiator is 403 SELF_APPROVAL_FORBIDDEN; a non-pending transfer is 409; an unknown id is 404; nothing is written', async () => {
    const w = makeWorld();
    const t = await pending(w, SA);
    const auditsBefore = w.audits.length;
    const self = await failure(w.service.approve(approver(SA), t.id, key()));
    expect(self.status).toBe(403);
    expect(self.code).toBe('SELF_APPROVAL_FORBIDDEN');

    await w.service.approve(approver(SA2), t.id, key());
    const again = await failure(w.service.approve(approver(SA2), t.id, key()));
    expect(again.status).toBe(409);
    expect(again.code).toBe('INVALID_STATE_TRANSITION');
    expect((await failure(w.service.approve(approver(), newId(), key()))).status).toBe(404);
    expect(w.ledger).toHaveLength(1);
    expect(w.audits.length).toBe(auditsBefore + 1);
  });

  it('BR-102d: approval repeats the free-shelf check and is 409 STOCK_UNAVAILABLE when the shelf shrank, writing nothing', async () => {
    const w = makeWorld();
    const t = await pending(w);
    w.batches.get(t.lines[0]!.batchId)!.freeGrams = 3_999;
    const e = await failure(w.service.approve(approver(), t.id, key()));
    expect(e.code).toBe('STOCK_UNAVAILABLE');
    expect(w.ledger).toHaveLength(0);
    expect(w.transfers.get(t.id)!.header.status).toBe('PENDING_APPROVAL');
  });

  async function inTransit(w: ReturnType<typeof makeWorld>, from = W1, to = W2) {
    const b1 = w.addBatch({ warehouseId: from, costPerKg: '10.00' });
    const b2 = w.addBatch({ warehouseId: from, costPerKg: '20.00' });
    const { transfer } = await w.service.create(initiator(), key(), {
      fromWarehouseId: from,
      toWarehouseId: to,
      lines: [{ batchId: b1.id, qtyKg: '5' }, { batchId: b2.id, qtyKg: '2.5' }],
    });
    expect(transfer.status).toBe('IN_TRANSIT');
    return transfer;
  }

  it('BR-102e: a full receipt creates one destination batch and one TRANSFER_IN row per line and marks the transfer RECEIVED', async () => {
    const w = makeWorld();
    const t = await inTransit(w);
    const [l1, l2] = t.lines;
    const received = await w.service.receive(receiver(), t.id, key(), {
      lines: [{ itemId: l1!.id, qtyReceivedKg: '5' }, { itemId: l2!.id, qtyReceivedKg: '2.500' }],
    });
    expect(received).toMatchObject({ status: 'RECEIVED', hasDiscrepancy: false, receivedBy: SA2, receiptNote: null });
    expect(received.lines.map((l) => [l.qtyReceivedKg, l.varianceKg])).toEqual([['5.000', '0.000'], ['2.500', '0.000']]);
    const ins = w.ledger.filter((r) => r.movementType === 'TRANSFER_IN');
    expect(ins).toHaveLength(2);
    expect(w.destBatches).toHaveLength(2);
    for (const d of w.destBatches) {
      expect(d.warehouseId).toBe(W2);
      expect(d.batchCode).toBe(`${w.batches.get(d.sourceBatchId)!.batchCode}/${t.transferNumber}`);
    }
    expect(ins.map((r) => [r.warehouseId, r.qtyDeltaKg, r.batchId])).toEqual(
      w.destBatches.map((d) => [W2, d.qtyKg, d.id]),
    );
    expect(received.lines.map((l) => l.destBatchId)).toEqual(w.destBatches.map((d) => d.id));
  });

  it('BR-102e: a short receipt needs a note, then flags the discrepancy and records the variance; a zero line moves nothing', async () => {
    const w = makeWorld();
    const t = await inTransit(w);
    const [l1, l2] = t.lines;
    const short = { lines: [{ itemId: l1!.id, qtyReceivedKg: '4.750' }, { itemId: l2!.id, qtyReceivedKg: '0' }] };
    const noNote = await failure(w.service.receive(receiver(), t.id, key(), short));
    expect(noNote.status).toBe(422);
    expect(noNote.errors).toHaveProperty(['body.receiptNote']);

    const received = await w.service.receive(receiver(), t.id, key(), { ...short, receiptNote: 'One crate crushed; second crate missing' });
    expect(received).toMatchObject({ status: 'RECEIVED', hasDiscrepancy: true, receiptNote: 'One crate crushed; second crate missing' });
    expect(received.lines.map((l) => [l.qtyReceivedKg, l.varianceKg])).toEqual([['4.750', '-0.250'], ['0.000', '-2.500']]);
    expect(received.lines[1]!.destBatchId).toBeNull();
    expect(w.ledger.filter((r) => r.movementType === 'TRANSFER_IN')).toHaveLength(1);
    expect(w.destBatches).toHaveLength(1);
  });

  it('BR-102e: every line is required, over-receipt is 422, an unknown line is 422 and only IN_TRANSIT can be received', async () => {
    const w = makeWorld();
    const t = await inTransit(w);
    const [l1, l2] = t.lines;
    const cases: Array<[unknown, string]> = [
      [{ lines: [{ itemId: l1!.id, qtyReceivedKg: '5' }] }, 'body.lines'],
      [{ lines: [{ itemId: l1!.id, qtyReceivedKg: '5.001' }, { itemId: l2!.id, qtyReceivedKg: '2.5' }] }, 'body.lines.0.qtyReceivedKg'],
      [{ lines: [{ itemId: l1!.id, qtyReceivedKg: '5' }, { itemId: newId(), qtyReceivedKg: '2.5' }] }, 'body.lines.1.itemId'],
    ];
    for (const [b, field] of cases) {
      const e = await failure(w.service.receive(receiver(), t.id, key(), b as never));
      expect(e.status, field).toBe(422);
      expect(e.errors, field).toHaveProperty([field]);
    }
    expect(w.ledger.filter((r) => r.movementType === 'TRANSFER_IN')).toHaveLength(0);

    const p = await pending(w);
    const notYet = await failure(w.service.receive(receiver(), p.id, key(), { lines: [{ itemId: p.lines[0]!.id, qtyReceivedKg: '4' }] }));
    expect(notYet.status).toBe(409);
    expect(notYet.code).toBe('INVALID_STATE_TRANSITION');

    await w.service.receive(receiver(), t.id, key(), { lines: [{ itemId: l1!.id, qtyReceivedKg: '5' }, { itemId: l2!.id, qtyReceivedKg: '2.5' }] });
    const twice = await failure(w.service.receive(receiver(), t.id, key(), { lines: [{ itemId: l1!.id, qtyReceivedKg: '5' }, { itemId: l2!.id, qtyReceivedKg: '2.5' }] }));
    expect(twice.code).toBe('INVALID_STATE_TRANSITION');
  });

  it('BR-102f: a Sub admin of the destination receives; of the source gets 403 WAREHOUSE_SCOPE_VIOLATION; of an unrelated warehouse the same 404 as an unknown id', async () => {
    const w = makeWorld();
    const t = await inTransit(w, W1, W2);
    const full = { lines: t.lines.map((l) => ({ itemId: l.id, qtyReceivedKg: l.qtySentKg })) };

    const source = await failure(w.service.receive(subReceiver(W1), t.id, key(), full));
    expect(source.status).toBe(403);
    expect(source.code).toBe('WAREHOUSE_SCOPE_VIOLATION');

    const unrelated = await failure(w.service.receive(subReceiver(W3), t.id, key(), full));
    const unknown = await failure(w.service.receive(subReceiver(W3), newId(), key(), full));
    expect([unrelated.status, unknown.status]).toEqual([404, 404]);
    expect(unrelated.message.replace(/[0-9a-f-]{36}/g, '<id>')).toBe(unknown.message.replace(/[0-9a-f-]{36}/g, '<id>'));
    expect(w.ledger.filter((r) => r.movementType === 'TRANSFER_IN')).toHaveLength(0);

    const ok = await w.service.receive(subReceiver(W2), t.id, key(), full);
    expect(ok.status).toBe('RECEIVED');
    expect(w.audits.at(-1)).toMatchObject({ actionCode: 'transfer.inter_warehouse.receive', warehouseId: W2 });
  });

  it('BR-102g: cancel works only from PENDING_APPROVAL and records the reason; IN_TRANSIT is 409 INVALID_STATE_TRANSITION', async () => {
    const w = makeWorld();
    const p = await pending(w);
    const cancelled = await w.service.cancel(initiator(), p.id, { reason: 'Truck unavailable this week' });
    expect(cancelled).toMatchObject({ status: 'CANCELLED', cancelledBy: MAIN, cancelReason: 'Truck unavailable this week' });
    expect(cancelled.cancelledAt).not.toBeNull();
    expect(w.ledger).toHaveLength(0);

    const again = await failure(w.service.cancel(initiator(), p.id, { reason: 'again' }));
    expect(again.code).toBe('INVALID_STATE_TRANSITION');
    const t = await inTransit(w);
    const moving = await failure(w.service.cancel(initiator(), t.id, { reason: 'too late' }));
    expect(moving.status).toBe(409);
    expect(moving.code).toBe('INVALID_STATE_TRANSITION');
    expect((await failure(w.service.cancel(initiator(), newId(), { reason: 'x' }))).status).toBe(404);
    // A cancelled transfer can be neither approved nor received.
    expect((await failure(w.service.approve(approver(), p.id, key()))).code).toBe('INVALID_STATE_TRANSITION');
  });

  it('BR-102h: a Sub admin reads only transfers touching its warehouse; another and an unknown id are the same 404; the list is confined', async () => {
    const w = makeWorld();
    const mine = await inTransit(w, W1, W2);
    const theirs = await inTransit(w, W3, W2);
    expect((await w.service.get(subViewer(W1), mine.id)).id).toBe(mine.id);
    expect((await w.service.get(subViewer(W2), mine.id)).id).toBe(mine.id);
    const other = await failure(w.service.get(subViewer(W1), theirs.id));
    const unknown = await failure(w.service.get(subViewer(W1), newId()));
    expect([other.status, unknown.status]).toEqual([404, 404]);
    expect(other.message.replace(/[0-9a-f-]{36}/g, '<id>')).toBe(unknown.message.replace(/[0-9a-f-]{36}/g, '<id>'));

    const list = await w.service.list(subViewer(W1), { page: 1, pageSize: 20 });
    expect(list.items.map((t) => t.id)).toEqual([mine.id]);
    expect((await w.service.list(subViewer(W1), { page: 1, pageSize: 20, warehouseId: W3 })).items).toEqual([]);
    expect((await w.service.list(viewer(), { page: 1, pageSize: 20 })).total).toBe(2);
    expect((await w.service.list(viewer(), { page: 1, pageSize: 20, warehouseId: W2, direction: 'INBOUND' })).total).toBe(2);
    expect((await w.service.list(viewer(), { page: 1, pageSize: 20, warehouseId: W2, direction: 'OUTBOUND' })).total).toBe(0);
  });

  it('BR-102h: no response carries the source farmer id', async () => {
    const w = makeWorld();
    const t = await inTransit(w);
    const farmerIds = [...w.batches.values()].map((b) => b.sourceFarmerId);
    const received = await w.service.receive(receiver(), t.id, key(), { lines: t.lines.map((l) => ({ itemId: l.id, qtyReceivedKg: l.qtySentKg })) });
    const json = JSON.stringify([t, received, await w.service.get(viewer(), t.id), await w.service.list(viewer(), { page: 1, pageSize: 20 })]);
    for (const id of farmerIds) expect(json).not.toContain(id);
    expect(json).not.toMatch(/farmer/i);
  });

  it('BR-102i: one masked audit row per state change, never the notes, reason or receipt note', async () => {
    const w = makeWorld();
    const b = w.addBatch({ costPerKg: null });
    const { transfer } = await w.service.create(initiator(), key(), body({ lines: [{ batchId: b.id, qtyKg: '4' }], notes: SECRET_NOTES, vehicleNumber: 'TN43 SECRET' }));
    await w.service.approve(approver(), transfer.id, key());
    await w.service.receive(receiver(), transfer.id, key(), { lines: [{ itemId: transfer.lines[0]!.id, qtyReceivedKg: '3' }], receiptNote: 'Driver admitted theft' });
    const p = await pending(w);
    await w.service.cancel(initiator(), p.id, { reason: 'Owner said so personally' });

    expect(w.audits.map((a) => a.actionCode)).toEqual([
      'transfer.inter_warehouse.initiate',
      'transfer.high_value.approve',
      'transfer.inter_warehouse.receive',
      'transfer.inter_warehouse.initiate',
      'transfer.inter_warehouse.cancel',
    ]);
    for (const a of w.audits) expect(a.entityType).toBe('stock_transfer');
    expect(w.audits.map((a) => a.warehouseId)).toEqual([W1, W1, W2, W1, W1]);
    expect(w.audits[0]!.after).toEqual({
      transferNumber: transfer.transferNumber,
      status: 'PENDING_APPROVAL',
      fromWarehouseId: W1,
      toWarehouseId: W2,
      lineCount: 1,
      totalValuePaise: 0,
      hasDiscrepancy: false,
    });
    expect(w.audits[2]!.before).toMatchObject({ status: 'IN_TRANSIT' });
    expect(w.audits[2]!.after).toMatchObject({ status: 'RECEIVED', hasDiscrepancy: true });
    const json = JSON.stringify(w.audits);
    for (const secret of [SECRET_NOTES, 'TN43 SECRET', 'Driver admitted theft', 'Owner said so personally']) expect(json).not.toContain(secret);
  });

  it('BR-102i: replaying an Idempotency-Key returns the original transfer and writes no second ledger or audit row; another body is 409', async () => {
    const w = makeWorld();
    const b = w.addBatch();
    const k = key();
    const req = body({ lines: [{ batchId: b.id, qtyKg: '1' }] });
    const first = await w.service.create(initiator(), k, req);
    const counts = () => [w.transfers.size, w.ledger.length, w.audits.length];
    const before = counts();
    const replay = await w.service.create(initiator(), k, req);
    expect(replay.replayed).toBe(true);
    expect(replay.transfer).toEqual(first.transfer);
    expect(counts()).toEqual(before);
    const reused = await failure(w.service.create(initiator(), k, body({ lines: [{ batchId: b.id, qtyKg: '2' }] })));
    expect(reused.status).toBe(409);
    expect(reused.code).toBe('IDEMPOTENCY_KEY_REUSED');

    const p = await pending(w);
    const ak = key();
    const approved = await w.service.approve(approver(), p.id, ak);
    const afterApprove = counts();
    expect(await w.service.approve(approver(), p.id, ak)).toEqual(approved);
    expect(counts()).toEqual(afterApprove);

    const rk = key();
    const receiveBody = { lines: [{ itemId: p.lines[0]!.id, qtyReceivedKg: '4' }] };
    const received = await w.service.receive(receiver(), p.id, rk, receiveBody);
    const afterReceive = [...counts(), w.destBatches.length];
    expect(await w.service.receive(receiver(), p.id, rk, receiveBody)).toEqual(received);
    expect([...counts(), w.destBatches.length]).toEqual(afterReceive);
  });
});

// ===========================================================================
// 3. Service against real PostgreSQL, in a rolled-back transaction
// ===========================================================================
describeIfDatabase('warehouse transfers service (PostgreSQL)', () => {
  let ready = false;
  let wh: WarehouseIds;

  beforeAll(async () => {
    ready = await requireDatabaseTables('stock_transfers', 'stock_transfer_items', 'inventory_batches', 'stock_ledger', 'idempotency_keys');
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
    createWarehouseTransfersService({ repo: warehouseTransfersRepo, db: tx, runTx: async (fn) => fn(tx), idempotency: createInMemoryIdempotencyStore() });

  interface Fixture {
    main: string;
    sa: string;
    farmerId: string;
    cropId: string;
  }

  async function fixture(tx: Executor): Promise<Fixture> {
    const farmer = await insertFarmerWithPlot(tx);
    return {
      main: await insertUser(tx, 'ADMIN', 'CI transfer main'),
      sa: await insertUser(tx, 'ADMIN', 'CI transfer approver'),
      farmerId: farmer.farmerId,
      cropId: await insertCrop(tx),
    };
  }

  async function batch(tx: Executor, f: Fixture, warehouseId: string, qty: string, cost: string | null): Promise<string> {
    const id = newId();
    await tx.query(
      `INSERT INTO inventory_batches (id, batch_code, warehouse_id, crop_id, grade, source_farmer_id, qty_received, cost_per_kg, expiry_on, status)
       VALUES ($1, $2, $3, $4, 'GRADE_1', $5, $6::numeric, $7::numeric, DATE '2031-01-31', 'ACTIVE')`,
      [id, `B-CI-TRF-${id.slice(0, 8)}`, warehouseId, f.cropId, f.farmerId, qty, cost],
    );
    await tx.query(
      `INSERT INTO stock_ledger (batch_id, warehouse_id, movement_type, qty_delta, balance_after, ref_type, remarks)
       VALUES ($1, $2, 'RECEIPT', $3::numeric, 0, 'TEST', 'fixture receipt')`,
      [id, warehouseId, qty],
    );
    return id;
  }

  const scopeOf = (userId: string, roleCode: RoleCode, permission: string, warehouseIds: string[] = []) =>
    aScope({ level: ScopeLevel.ALL, roleCode, permission, userId, warehouseIds });

  async function available(tx: Executor, batchId: string): Promise<string> {
    return (await tx.query<{ q: string }>(`SELECT qty_available::text AS q FROM inventory_batches WHERE id = $1`, [batchId])).rows[0]!.q;
  }

  dbTest('BR-102b/c: below the threshold the TRANSFER_OUT rows reduce the source shelf; the value is exact integer paise from SQL numeric', async () => {
    await inRolledBackTx(async (tx) => {
      const f = await fixture(tx);
      const b1 = await batch(tx, f, wh.ooty, '20', '12.35');
      const b2 = await batch(tx, f, wh.ooty, '10', '0.01');
      const svc = service(tx);
      const { transfer } = await svc.create(scopeOf(f.main, RoleCode.MAIN_WH_ADMIN, 'transfer.inter_warehouse.initiate'), 'db-k1', {
        fromWarehouseId: wh.ooty,
        toWarehouseId: wh.coonoor,
        lines: [{ batchId: b1, qtyKg: '3.333' }, { batchId: b2, qtyKg: '0.5' }],
        notes: SECRET_NOTES,
      });
      // 3.333 x 12.35 = 41.16255 -> 4116 paise; 0.5 x 0.01 = 0.005 -> round half away from zero -> 1 paisa.
      // Lines are ordered by (created_at, id), so they are matched by batch rather than by position.
      const valueOf = (batchId: string) => transfer.lines.find((l) => l.batchId === batchId)?.lineValue;
      expect([valueOf(b1), valueOf(b2)]).toEqual(['41.16', '0.01']);
      expect(transfer).toMatchObject({ status: 'IN_TRANSIT', totalValue: '41.17', requiresApproval: false });
      expect(transfer.transferNumber).toMatch(/^TRF-\d{6,}$/);
      expect(await available(tx, b1)).toBe('16.667');
      expect(await available(tx, b2)).toBe('9.500');
      const ledger = await tx.query<{ movement_type: string; qty_delta: string; warehouse_id: string; ref_type: string; ref_id: string }>(
        `SELECT movement_type, qty_delta::text, warehouse_id::text, ref_type, ref_id::text FROM stock_ledger sl WHERE ref_id = $1 ORDER BY sl.qty_delta`,
        [transfer.id],
      );
      expect(ledger.rows).toEqual([
        { movement_type: 'TRANSFER_OUT', qty_delta: '-3.333', warehouse_id: wh.ooty, ref_type: 'STOCK_TRANSFER', ref_id: transfer.id },
        { movement_type: 'TRANSFER_OUT', qty_delta: '-0.500', warehouse_id: wh.ooty, ref_type: 'STOCK_TRANSFER', ref_id: transfer.id },
      ]);
      const items = await tx.query<{ n: string }>(`SELECT count(*)::text AS n FROM stock_transfer_items WHERE transfer_id = $1 AND out_ledger_id IS NOT NULL`, [transfer.id]);
      expect(items.rows[0]!.n).toBe('2');
      const audit = await tx.query<{ after: unknown }>(`SELECT after FROM audit_log WHERE entity_id = $1 AND action_code = 'transfer.inter_warehouse.initiate'`, [transfer.id]);
      expect(audit.rows).toHaveLength(1);
      expect(JSON.stringify(audit.rows)).not.toContain(SECRET_NOTES);
    });
  });

  dbTest('BR-102b: a cart hold on the batch shrinks the free shelf: above it is 409 STOCK_UNAVAILABLE and nothing is written', async () => {
    await inRolledBackTx(async (tx) => {
      const f = await fixture(tx);
      const b = await batch(tx, f, wh.ooty, '10', '1.00');
      await tx.query(
        `INSERT INTO allocations (batch_id, warehouse_id, channel, allocated_qty, reserved_qty) VALUES ($1, $2, 'ONLINE', 10, 4)`,
        [b, wh.ooty],
      );
      const svc = service(tx);
      const scope = scopeOf(f.main, RoleCode.MAIN_WH_ADMIN, 'transfer.inter_warehouse.initiate');
      const before = (await tx.query<{ n: string }>(`SELECT count(*)::text AS n FROM stock_transfers`)).rows[0]!.n;
      const e = await svc
        .create(scope, 'db-k2', { fromWarehouseId: wh.ooty, toWarehouseId: wh.coonoor, lines: [{ batchId: b, qtyKg: '6.001' }] })
        .then(() => null, (err: unknown) => err);
      expect((e as AppError).code).toBe('STOCK_UNAVAILABLE');
      expect((await tx.query<{ n: string }>(`SELECT count(*)::text AS n FROM stock_transfers`)).rows[0]!.n).toBe(before);
      expect(await available(tx, b)).toBe('10.000');
      const ok = await svc.create(scope, 'db-k3', { fromWarehouseId: wh.ooty, toWarehouseId: wh.coonoor, lines: [{ batchId: b, qtyKg: '6' }] });
      expect(ok.transfer.status).toBe('IN_TRANSIT');
    });
  });

  dbTest('BR-102c: the threshold comes from system_config and falls back to 5,000,000 paise when the row is unusable', async () => {
    await inRolledBackTx(async (tx) => {
      await tx.query(`UPDATE system_config SET value = '100'::jsonb WHERE key = 'transfer_high_value_threshold_paise'`);
      expect(await warehouseTransfersRepo.highValueThresholdPaise(tx)).toBe(100);
      await tx.query(`UPDATE system_config SET value = '"lots"'::jsonb WHERE key = 'transfer_high_value_threshold_paise'`);
      expect(await warehouseTransfersRepo.highValueThresholdPaise(tx)).toBe(5_000_000);
      await tx.query(`DELETE FROM system_config WHERE key = 'transfer_high_value_threshold_paise'`);
      expect(await warehouseTransfersRepo.highValueThresholdPaise(tx)).toBe(5_000_000);
    });
  });

  dbTest('BR-102c/d/e: a pending transfer moves nothing; approval dispatches; a short receipt creates destination batches and records the variance', async () => {
    await inRolledBackTx(async (tx) => {
      const f = await fixture(tx);
      const valued = await batch(tx, f, wh.ooty, '10', '50.00');
      const unvalued = await batch(tx, f, wh.ooty, '5', null);
      const svc = service(tx);
      const { transfer } = await svc.create(scopeOf(f.main, RoleCode.MAIN_WH_ADMIN, 'transfer.inter_warehouse.initiate'), 'db-k4', {
        fromWarehouseId: wh.ooty,
        toWarehouseId: wh.coonoor,
        lines: [{ batchId: valued, qtyKg: '4' }, { batchId: unvalued, qtyKg: '2' }],
      });
      expect(transfer).toMatchObject({ status: 'PENDING_APPROVAL', hasUnvaluedLines: true, requiresApproval: true, totalValue: '200.00' });
      expect(await available(tx, valued)).toBe('10.000');

      const self = await svc.approve(scopeOf(f.main, RoleCode.SUPER_ADMIN, 'transfer.high_value.approve'), transfer.id, 'db-k5').then(() => null, (e: unknown) => e);
      expect((self as AppError).code).toBe('SELF_APPROVAL_FORBIDDEN');

      const approved = await svc.approve(scopeOf(f.sa, RoleCode.SUPER_ADMIN, 'transfer.high_value.approve'), transfer.id, 'db-k6');
      expect(approved).toMatchObject({ status: 'IN_TRANSIT', approvedBy: f.sa });
      expect(await available(tx, valued)).toBe('6.000');
      expect(await available(tx, unvalued)).toBe('3.000');

      const lv = approved.lines.find((l) => l.batchId === valued);
      const lu = approved.lines.find((l) => l.batchId === unvalued);
      const received = await svc.receive(
        scopeOf(f.sa, RoleCode.SUB_WH_ADMIN, 'transfer.inter_warehouse.receive', [wh.coonoor]),
        transfer.id,
        'db-k7',
        { lines: [{ itemId: lv!.id, qtyReceivedKg: '3.900' }, { itemId: lu!.id, qtyReceivedKg: '0' }], receiptNote: 'short' },
      );
      expect(received).toMatchObject({ status: 'RECEIVED', hasDiscrepancy: true, receivedBy: f.sa });
      const rv = received.lines.find((l) => l.batchId === valued)!;
      const ru = received.lines.find((l) => l.batchId === unvalued)!;
      expect([rv, ru].map((l) => [l.qtyReceivedKg, l.varianceKg])).toEqual([['3.900', '-0.100'], ['0.000', '-2.000']]);
      const dest = rv.destBatchId!;
      const row = await tx.query<{ warehouse_id: string; qty_available: string; qty_received: string; cost_per_kg: string; batch_code: string; source_farmer_id: string; goods_receipt_id: string | null; expiry_on: string }>(
        `SELECT warehouse_id::text, qty_available::text, qty_received::text, cost_per_kg::text, batch_code, source_farmer_id::text, goods_receipt_id::text, expiry_on::text
           FROM inventory_batches WHERE id = $1`,
        [dest],
      );
      expect(row.rows[0]).toMatchObject({
        warehouse_id: wh.coonoor,
        qty_available: '3.900',
        qty_received: '3.900',
        cost_per_kg: '50.00',
        source_farmer_id: f.farmerId,
        goods_receipt_id: null,
        expiry_on: '2031-01-31',
        batch_code: `B-CI-TRF-${valued.slice(0, 8)}/${transfer.transferNumber}`,
      });
      expect(ru.destBatchId).toBeNull();
      const ins = await tx.query<{ n: string }>(`SELECT count(*)::text AS n FROM stock_ledger WHERE ref_id = $1 AND movement_type = 'TRANSFER_IN'`, [transfer.id]);
      expect(ins.rows[0]!.n).toBe('1');
      const variance = await tx.query<{ v: string }>(`SELECT variance_qty::text AS v FROM stock_transfer_items WHERE id = $1`, [lv!.id]);
      expect(variance.rows[0]!.v).toBe('-0.100');
      const audits = await tx.query<{ action_code: string }>(`SELECT action_code FROM audit_log WHERE entity_id = $1 ORDER BY created_at, action_code`, [transfer.id]);
      expect(audits.rows.map((r) => r.action_code).sort()).toEqual(
        ['transfer.high_value.approve', 'transfer.inter_warehouse.initiate', 'transfer.inter_warehouse.receive'],
      );
    });
  });

  dbTest('BR-102g/h: cancel from pending; the list filters by warehouse, direction and status and a Sub admin sees only its side', async () => {
    await inRolledBackTx(async (tx) => {
      const f = await fixture(tx);
      const b = await batch(tx, f, wh.kotagiri, '10', null);
      const svc = service(tx);
      const main = scopeOf(f.main, RoleCode.MAIN_WH_ADMIN, 'transfer.inter_warehouse.initiate');
      const { transfer } = await svc.create(main, 'db-k8', { fromWarehouseId: wh.kotagiri, toWarehouseId: wh.gudalur, lines: [{ batchId: b, qtyKg: '1' }] });
      const cancelled = await svc.cancel(main, transfer.id, { reason: 'not needed' });
      expect(cancelled).toMatchObject({ status: 'CANCELLED', cancelReason: 'not needed', cancelledBy: f.main });

      const view = scopeOf(f.sa, RoleCode.TOHFA_ADMIN, 'transfer.inter_warehouse.view');
      const out = await svc.list(view, { page: 1, pageSize: 100, warehouseId: wh.kotagiri, direction: 'OUTBOUND', status: 'CANCELLED' });
      expect(out.items.map((t) => t.id)).toContain(transfer.id);
      const inb = await svc.list(view, { page: 1, pageSize: 100, warehouseId: wh.kotagiri, direction: 'INBOUND' });
      expect(inb.items.map((t) => t.id)).not.toContain(transfer.id);

      const subGudalur = aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.SUB_WH_ADMIN, permission: 'transfer.inter_warehouse.view', warehouseIds: [wh.gudalur], userId: f.sa });
      const subOoty = aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.SUB_WH_ADMIN, permission: 'transfer.inter_warehouse.view', warehouseIds: [wh.ooty], userId: f.sa });
      expect((await svc.list(subGudalur, { page: 1, pageSize: 100 })).items.map((t) => t.id)).toContain(transfer.id);
      expect((await svc.list(subOoty, { page: 1, pageSize: 100 })).items.map((t) => t.id)).not.toContain(transfer.id);
      expect((await svc.get(subGudalur, transfer.id)).lines).toHaveLength(1);
      const hidden = await svc.get(subOoty, transfer.id).then(() => null, (e: unknown) => e);
      expect((hidden as AppError).status).toBe(404);
      const json = JSON.stringify(await svc.get(view, transfer.id));
      expect(json).not.toContain(f.farmerId);
    });
  });
});

// ===========================================================================
// 4. Real HTTP through the real app router
// ===========================================================================
describeIfDatabase('warehouse transfers routes (real app router, PostgreSQL)', () => {
  let ready = false;
  let harness: HttpHarness;

  beforeAll(async () => {
    ready = await requireDatabaseTables('stock_transfers', 'stock_transfer_items');
    if (ready) harness = await startHttpHarness();
    // Booting the whole app (every router) can exceed the 10 s default when the shared test
    // database and machine are busy with parallel suites.
  }, 60_000);

  afterAll(async () => {
    if (ready && harness !== undefined) await harness.stop();
  });

  const dbTest = (name: string, fn: () => Promise<void>) =>
    it(name, async (context) => {
      if (!ready) context.skip();
      await fn();
    });

  const id = '99999999-9999-4999-8999-999999999999';
  const createBody = () => ({ fromWarehouseId: harness.warehouse.ooty, toWarehouseId: harness.warehouse.coonoor, lines: [{ batchId: id, qtyKg: '1' }] });

  dbTest('BR-102 (HTTP): every route is 401 without a token and 403 for farmer, customer and Farmer Admin', async () => {
    const routes: Array<{ method: 'get' | 'post'; path: string; body?: object }> = [
      { method: 'get', path: '/v1/warehouse-transfers' },
      { method: 'get', path: `/v1/warehouse-transfers/${id}` },
      { method: 'post', path: '/v1/warehouse-transfers', body: createBody() },
      { method: 'post', path: `/v1/warehouse-transfers/${id}/approve` },
      { method: 'post', path: `/v1/warehouse-transfers/${id}/receive`, body: { lines: [{ itemId: id, qtyReceivedKg: '1' }] } },
      { method: 'post', path: `/v1/warehouse-transfers/${id}/cancel`, body: { reason: 'x' } },
    ];
    for (const route of routes) {
      const anonymous = await request(harness.server)[route.method](route.path).set('Idempotency-Key', newId()).send(route.body);
      expect(anonymous.status, `${route.method} ${route.path} anonymous`).toBe(401);
      for (const role of ['farmer', 'customer', 'farmerAdmin'] as const) {
        const res = await request(harness.server)[route.method](route.path).set('Authorization', harness.auth(role)).set('Idempotency-Key', newId()).send(route.body);
        expect(res.status, `${route.method} ${route.path} as ${role}`).toBe(403);
        expect(res.headers['content-type']).toContain('application/problem+json');
      }
    }
  });

  dbTest('BR-26a / BR-26b (HTTP): TOHFA Admin and a Sub admin are 403 on create and cancel; only Super Admin approves', async () => {
    for (const role of ['tohfaAdmin', 'subOoty'] as const) {
      const create = await request(harness.server).post('/v1/warehouse-transfers').set('Authorization', harness.auth(role)).set('Idempotency-Key', newId()).send(createBody());
      expect(create.status, `create as ${role}`).toBe(403);
      const cancel = await request(harness.server).post(`/v1/warehouse-transfers/${id}/cancel`).set('Authorization', harness.auth(role)).send({ reason: 'x' });
      expect(cancel.status, `cancel as ${role}`).toBe(403);
    }
    for (const role of ['tohfaAdmin', 'main', 'subOoty'] as const) {
      const approve = await request(harness.server).post(`/v1/warehouse-transfers/${id}/approve`).set('Authorization', harness.auth(role)).set('Idempotency-Key', newId());
      expect(approve.status, `approve as ${role}`).toBe(403);
    }
  });

  dbTest('BR-102a/h (HTTP): a missing Idempotency-Key is 422; an unknown batch is 422; unknown ids are 404; the list is readable by every warehouse admin', async () => {
    const noKey = await request(harness.server).post('/v1/warehouse-transfers').set('Authorization', harness.auth('main')).send(createBody());
    expect(noKey.status).toBe(422);
    const unknownBatch = await request(harness.server).post('/v1/warehouse-transfers').set('Authorization', harness.auth('main')).set('Idempotency-Key', newId()).send(createBody());
    expect(unknownBatch.status).toBe(422);
    const sameSide = await request(harness.server).post('/v1/warehouse-transfers').set('Authorization', harness.auth('main')).set('Idempotency-Key', newId())
      .send({ ...createBody(), toWarehouseId: harness.warehouse.ooty });
    expect(sameSide.status).toBe(422);
    for (const role of ['superAdmin', 'tohfaAdmin', 'main', 'subOoty'] as const) {
      const list = await request(harness.server).get('/v1/warehouse-transfers').set('Authorization', harness.auth(role));
      expect(list.status, role).toBe(200);
      const one = await request(harness.server).get(`/v1/warehouse-transfers/${id}`).set('Authorization', harness.auth(role));
      expect(one.status, role).toBe(404);
    }
    const receive = await request(harness.server).post(`/v1/warehouse-transfers/${id}/receive`).set('Authorization', harness.auth('subOoty')).set('Idempotency-Key', newId())
      .send({ lines: [{ itemId: id, qtyReceivedKg: '1' }] });
    expect(receive.status).toBe(404);
    const badQuery = await request(harness.server).get('/v1/warehouse-transfers?direction=INBOUND').set('Authorization', harness.auth('main'));
    expect(badQuery.status).toBe(422);
  });
});
