/**
 * BR-118: the warehouse intake writes honour their Idempotency-Key (docs/openapi.yaml
 * `IdempotencyKeyHeader`, `required: true`; root CLAUDE.md 2.4).
 *
 * WHY THIS FILE EXISTS: POST /admin/goods-receipts, .../quality-check and .../counter-offer declared
 * the header but the server ignored it. A retry after a dropped response recorded a second receipt
 * for one delivery, and a retried quality check either failed with a spurious 409 (the receipt was
 * no longer AWAITING_QC) or, racing the first, could stock the lot twice (BR-106).
 *
 * The contract is the shared helper's (apps/api/src/http/idempotency.ts, BR-68): missing key 422,
 * replay returns the stored response and writes nothing, same key with a different request 409
 * IDEMPOTENCY_KEY_REUSED, a refused attempt is not remembered.
 *
 *   1. Unit: a counting mock repo and the in-memory store.
 *   2. PostgreSQL, one rolled-back transaction whose inner transactions are SAVEPOINTs, so a
 *      refused request really rolls back its writes and its claim; the real `idempotency_keys` store.
 */
import { describe, expect, it, vi } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Actor } from '../../auth/requireAuth.js';
import type { Executor } from '../../db/pool.js';
import { eventBus } from '../../events/bus.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { createInMemoryIdempotencyStore } from '../../test/idempotencyStore.js';
import { insertCrop, insertFarmerWithPlot, insertUser, requireDatabaseTables } from '../../test/dbFixtures.js';
import { aScope, anActor, describeIfDatabase, IDS, newId } from '../../test/factories.js';
import { goodsReceiptsRepo, type GoodsReceiptsRepo } from './goods-receipts.repo.js';
import { qcParameters, qualityCheckCreateBody, type QualityCheckCreateBody } from './goods-receipts.schema.js';
import { createGoodsReceiptsService } from './goods-receipts.service.js';

/** The wire form: what res.json sends and what the store replays. */
const wire = (value: unknown): unknown => JSON.parse(JSON.stringify(value));

async function expectAppError(promise: Promise<unknown>, code: string, status: number): Promise<AppError> {
  let caught: unknown;
  try {
    await promise;
  } catch (error) {
    caught = error;
  }
  expect(caught, `expected ${code}`).toBeInstanceOf(AppError);
  expect((caught as AppError).code).toBe(code);
  expect((caught as AppError).status).toBe(status);
  return caught as AppError;
}

function qcBody(overrides: Record<string, unknown> = {}): QualityCheckCreateBody {
  return qualityCheckCreateBody.parse({
    assignedGrade: 'GRADE_1',
    outcome: 'ACCEPTED',
    acceptedQtyKg: '100.000',
    items: qcParameters.map((parameter) => ({ parameter, score: 8, passed: true })),
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// 1. Unit: counting mock repo
// ---------------------------------------------------------------------------
describe('BR-118: goods receipt, quality check and quality counter-offer honour the Idempotency-Key (unit)', () => {
  const WH = IDS.warehouseOoty;
  const PO_ID = '4a1c7b52-0000-4000-8000-0000000000a1';
  const GRN_ID = '4a1c7b52-0000-4000-8000-0000000000a2';
  const admin: Actor = anActor({ userId: IDS.userSuperAdmin, roles: [{ code: RoleCode.MAIN_WH_ADMIN }] });
  const scope: ResolvedScope = aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.MAIN_WH_ADMIN, userId: IDS.userSuperAdmin });

  function harness() {
    const calls: Record<string, number> = {};
    const count = (name: string): void => {
      calls[name] = (calls[name] ?? 0) + 1;
    };
    const repo = {
      findPurchaseOrderForReceipt: async () => ({
        id: PO_ID,
        poNumber: 'PO-2026-000001',
        farmerId: IDS.farmer,
        warehouseId: WH,
        cropId: 'crop-1',
        cropName: 'Carrot',
        grade: 'GRADE_1',
        quantityKg: '100.000',
        pricePerKg: '50.00',
        status: 'ISSUED',
      }),
      insertGoodsReceipt: async (_tx: Executor, data: { purchaseOrderId: string; warehouseId: string; farmerId: string; grossQtyKg: string; receivedBy: string }) => {
        count('insertGoodsReceipt');
        return {
          id: `grn-${calls['insertGoodsReceipt']}`,
          grn_number: `GRN-2026-00000${calls['insertGoodsReceipt']}`,
          purchase_order_id: data.purchaseOrderId,
          warehouse_id: data.warehouseId,
          farmer_id: data.farmerId,
          status: 'AWAITING_QC',
          gross_qty_kg: data.grossQtyKg,
          accepted_qty_kg: '0.000',
          rejected_qty_kg: '0.000',
          rejection_reason: null,
          vehicle_number: null,
          photo_keys: [],
          received_by: data.receivedBy,
          received_at: new Date(),
          created_at: new Date(),
          updated_at: null,
        };
      },
      findGoodsReceiptById: async (_tx: Executor, id: string) =>
        id !== GRN_ID
          ? null
          : {
              id: GRN_ID,
              grnNumber: 'GRN-2026-000001',
              purchaseOrderId: PO_ID,
              warehouseId: WH,
              farmerId: IDS.farmer,
              grossQtyKg: '100.000',
              acceptedQtyKg: '0.000',
              rejectedQtyKg: '0.000',
              rejectionReason: null,
              vehicleNumber: null,
              photos: [],
              status: 'AWAITING_QC',
              receivedBy: IDS.userSuperAdmin,
              receivedAt: '2026-10-26T04:00:00.000Z',
              poNumber: 'PO-2026-000001',
              cropName: 'Carrot',
              grade: 'GRADE_1',
            },
      insertQualityCheckWithItems: async (_tx: Executor, data: QualityCheckCreateBody & { goodsReceiptId: string; warehouseId: string; listedGrade: string; checkedBy: string }) => {
        count('insertQualityCheck');
        return {
          id: `qc-${calls['insertQualityCheck']}`,
          goodsReceiptId: data.goodsReceiptId,
          warehouseId: data.warehouseId,
          assignedGrade: data.assignedGrade,
          listedGrade: data.listedGrade,
          outcome: data.outcome,
          acceptedQtyKg: data.acceptedQtyKg,
          rejectedQtyKg: data.rejectedQtyKg ?? '0.000',
          priceAdjustment: data.priceAdjustment ?? '0.00',
          defectNotes: null,
          photos: [],
          checkedBy: data.checkedBy,
          checkedAt: new Date().toISOString(),
          items: [],
        };
      },
      updateGoodsReceiptStatus: async () => count('updateGoodsReceiptStatus'),
      recordAudit: async (_tx: Executor, entry: { actionCode: string }) => {
        count(`audit:${entry.actionCode}`);
        return 'audit-1';
      },
      findStockingSource: async (_tx: Executor, goodsReceiptId: string) => ({
        goodsReceiptId,
        warehouseId: WH,
        farmerId: IDS.farmer,
        cropId: 'crop-1',
        purchasePricePerKg: '50.00',
        grossQtyKg: '100.000',
        existingBatchId: null,
      }),
      nextBatchCode: async () => 'BATCH-2026-000001',
      insertInventoryBatch: async () => {
        count('insertInventoryBatch');
        return `batch-${calls['insertInventoryBatch']}`;
      },
      insertReceiptMovement: async () => {
        count('insertReceiptMovement');
        return 'ledger-1';
      },
      findBatchView: async (_tx: Executor, batchId: string) => ({
        id: batchId,
        batchCode: 'BATCH-2026-000001',
        warehouseId: WH,
        cropId: 'crop-1',
        grade: 'GRADE_1',
        goodsReceiptId: GRN_ID,
        sourceFarmerId: IDS.farmer,
        qtyReceivedKg: '100.000',
        qtyAvailableKg: '100.000',
        costPerKg: '50.00',
        storageLocation: null,
        receivedOn: '2026-10-26',
        expiryOn: null,
        status: 'ACTIVE',
      }),
      findQualityNegotiationTarget: async () => ({
        listingId: '4a1c7b52-0000-4000-8000-0000000000aa',
        listingStatus: 'ACCEPTED',
        listingVersion: 2,
        ownerUserId: IDS.userFarmer,
        agreedPricePerKg: '50.00',
      }),
      findNegotiationState: async () => ({ maxRound: 0, pendingOfferId: null }),
      getCounterOfferConfig: async () => ({ windowHours: 24, roundLimit: 3 }),
      insertQualityCounterOffer: async (_tx: Executor, data: { listingId: string; goodsReceiptId: string; round: number; pricePerKg: string; quantityKg: string; offeredByUserId: string; expiresAt: Date }) => {
        count('insertQualityCounterOffer');
        return {
          id: `co-${calls['insertQualityCounterOffer']}`,
          listingId: data.listingId,
          goodsReceiptId: data.goodsReceiptId,
          round: data.round,
          offeredBy: 'ADMIN',
          offeredByUserId: data.offeredByUserId,
          pricePerKg: data.pricePerKg,
          quantityKg: data.quantityKg,
          message: null,
          status: 'PENDING',
          expiresAt: data.expiresAt.toISOString(),
          respondedAt: null,
        };
      },
      markListingCounterOffered: async (_tx: Executor, _listingId: string, version: number) => version + 1,
      markGoodsReceiptCounterOffered: async () => count('markGoodsReceiptCounterOffered'),
    } as unknown as GoodsReceiptsRepo;
    const tx = { query: async () => ({ rows: [] }) } as unknown as Executor;
    const allocate = async (): Promise<void> => count('allocate');
    const store = createInMemoryIdempotencyStore();
    const service = createGoodsReceiptsService(repo, async (fn) => fn(tx), tx, allocate, store);
    return { service, calls, store };
  }

  const receiptBody = { purchaseOrderId: PO_ID, warehouseId: WH, grossQtyKg: '100.000', photos: [] };
  const offerBody = { pricePerKg: '45.00', quantityKg: '100.000' };

  it('BR-118a: a missing, empty or blank Idempotency-Key is 422 VALIDATION_FAILED naming the header on all three operations, and nothing is written', async () => {
    const h = harness();
    for (const key of [undefined, '', '   ']) {
      const attempts: Array<[string, Promise<unknown>]> = [
        ['create', h.service.createGoodsReceipt(admin, scope, receiptBody, key)],
        ['quality-check', h.service.recordQualityCheck(admin, scope, GRN_ID, qcBody(), key)],
        ['counter-offer', h.service.createQualityCounterOffer(admin, scope, GRN_ID, offerBody, key)],
      ];
      for (const [name, attempt] of attempts) {
        const error = await expectAppError(attempt, 'VALIDATION_FAILED', 422);
        expect(Object.keys(error.errors ?? {}), name).toContain('header.Idempotency-Key');
      }
    }
    expect(h.calls).toEqual({});
    expect(h.store.size()).toBe(0);
  });

  it('BR-118b: a replayed goods receipt returns the identical body and writes one receipt and one audit row', async () => {
    const h = harness();
    const key = newId();
    const first = await h.service.createGoodsReceipt(admin, scope, receiptBody, key);
    const second = await h.service.createGoodsReceipt(admin, scope, receiptBody, key);
    expect(wire(second)).toEqual(wire(first));
    expect(h.calls['insertGoodsReceipt']).toBe(1);
    expect(h.calls['audit:inventory.goods_receipt.record']).toBe(1);
  });

  it('BR-118b / BR-106: a replayed quality check returns the identical body and stocks one batch with one RECEIPT ledger row, one allocation and one audit row each', async () => {
    const h = harness();
    const key = newId();
    const first = await h.service.recordQualityCheck(admin, scope, GRN_ID, qcBody(), key);
    const second = await h.service.recordQualityCheck(admin, scope, GRN_ID, qcBody(), key);
    expect(first.batch).not.toBeNull();
    expect(wire(second)).toEqual(wire(first));
    expect(h.calls).toMatchObject({
      insertQualityCheck: 1,
      updateGoodsReceiptStatus: 1,
      insertInventoryBatch: 1,
      insertReceiptMovement: 1,
      allocate: 1,
      'audit:inventory.quality_check.perform': 1,
      'audit:inventory.batch.assign': 1,
    });
  });

  it('BR-118b: a replayed quality counter-offer returns the identical body, opens one round and notifies the farmer once', async () => {
    const h = harness();
    const publish = vi.spyOn(eventBus, 'publish').mockResolvedValue(undefined);
    try {
      const key = newId();
      const first = await h.service.createQualityCounterOffer(admin, scope, GRN_ID, offerBody, key);
      const second = await h.service.createQualityCounterOffer(admin, scope, GRN_ID, offerBody, key);
      expect(wire(second)).toEqual(wire(first));
      expect(h.calls['insertQualityCounterOffer']).toBe(1);
      expect(h.calls['markGoodsReceiptCounterOffered']).toBe(1);
      expect(h.calls['audit:inventory.quality.counter_offer']).toBe(1);
      expect(publish.mock.calls.filter(([name]) => name === 'counter_offer.received')).toHaveLength(1);
    } finally {
      publish.mockRestore();
    }
  });

  it('BR-118c: the same key with a different body, a different receipt or on a different operation is 409 IDEMPOTENCY_KEY_REUSED, and nothing more is written', async () => {
    const h = harness();
    const key = newId();
    await h.service.createGoodsReceipt(admin, scope, receiptBody, key);
    await expectAppError(h.service.createGoodsReceipt(admin, scope, { ...receiptBody, grossQtyKg: '99.000' }, key), 'IDEMPOTENCY_KEY_REUSED', 409);
    await expectAppError(h.service.recordQualityCheck(admin, scope, GRN_ID, qcBody(), key), 'IDEMPOTENCY_KEY_REUSED', 409);
    await expectAppError(h.service.createQualityCounterOffer(admin, scope, GRN_ID, offerBody, key), 'IDEMPOTENCY_KEY_REUSED', 409);

    const qcKey = newId();
    await h.service.recordQualityCheck(admin, scope, GRN_ID, qcBody(), qcKey);
    await expectAppError(
      h.service.recordQualityCheck(admin, scope, GRN_ID, qcBody({ acceptedQtyKg: '90.000' }), qcKey),
      'IDEMPOTENCY_KEY_REUSED',
      409,
    );
    await expectAppError(h.service.recordQualityCheck(admin, scope, newId(), qcBody(), qcKey), 'IDEMPOTENCY_KEY_REUSED', 409);

    expect(h.calls['insertGoodsReceipt']).toBe(1);
    expect(h.calls['insertQualityCheck']).toBe(1);
    expect(h.calls['insertInventoryBatch']).toBe(1);
    expect(h.calls['insertQualityCounterOffer']).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 2. PostgreSQL, rolled back
// ---------------------------------------------------------------------------
class RollbackFixture extends Error {}

interface Lot {
  listingId: string;
  purchaseOrderId: string;
  goodsReceiptId: string;
}

interface World {
  tx: Executor;
  ooty: string;
  admin: Actor;
  scope: ResolvedScope;
  service: ReturnType<typeof createGoodsReceiptsService>;
  lot: () => Promise<Lot>;
}

/** farmer -> crop -> fair price -> ACCEPTED listing -> purchase order -> receipt AWAITING_QC (BR-106 fixture). */
async function insertLot(db: Executor, warehouseId: string, issuedBy: string): Promise<Lot> {
  const farmer = await insertFarmerWithPlot(db);
  const cropId = await insertCrop(db);
  const fairPriceId = newId();
  await db.query(
    `INSERT INTO fair_prices (id, crop_id, grade, ceiling_price, effective_from, set_by)
     VALUES ($1, $2, 'GRADE_1', 100.00, '2026-01-01', $3)`,
    [fairPriceId, cropId, issuedBy],
  );
  const listingId = newId();
  await db.query(
    `INSERT INTO produce_listings
       (id, listing_number, farmer_id, crop_id, grade, quantity_kg, price_per_kg, fair_price_id, status,
        final_price_per_kg, final_quantity_kg, approved_by, approved_at, version)
     VALUES ($1, $2, $3, $4, 'GRADE_1', 100, 50.00, $5, 'ACCEPTED', 50.00, 100, $6, now(), 2)`,
    [listingId, `LST-B118-${listingId.slice(0, 8)}`, farmer.farmerId, cropId, fairPriceId, issuedBy],
  );
  const purchaseOrderId = newId();
  await db.query(
    `INSERT INTO purchase_orders
       (id, po_number, farmer_id, listing_id, warehouse_id, crop_id, grade, quantity_kg, price_per_kg, total_amount, issued_by)
     VALUES ($1, $2, $3, $4, $5, $6, 'GRADE_1', 100, 50.00, 5000.00, $7)`,
    [purchaseOrderId, `PO-B118-${purchaseOrderId.slice(0, 8)}`, farmer.farmerId, listingId, warehouseId, cropId, issuedBy],
  );
  const goodsReceiptId = newId();
  await db.query(
    `INSERT INTO goods_receipts (id, grn_number, purchase_order_id, warehouse_id, farmer_id, gross_qty_kg, received_by, status)
     VALUES ($1, $2, $3, $4, $5, 100, $6, 'AWAITING_QC')`,
    [goodsReceiptId, `GRN-B118-${goodsReceiptId.slice(0, 8)}`, purchaseOrderId, warehouseId, farmer.farmerId, issuedBy],
  );
  return { listingId, purchaseOrderId, goodsReceiptId };
}

async function inRolledBackTx(fn: (world: World) => Promise<void>): Promise<void> {
  const { withTransaction } = await import('../../db/pool.js');
  await withTransaction(async (tx) => {
    const adminId = await insertUser(tx, 'ADMIN', 'BR-118 warehouse admin');
    const res = await tx.query<{ id: string }>(`SELECT id FROM warehouses WHERE code = 'WH-OOTY'`);
    const ooty = res.rows[0]?.id;
    if (ooty === undefined) throw new Error('seeded warehouse WH-OOTY is missing: run the reference seed first');
    let savepoints = 0;
    const runTx = async <T>(work: (executor: Executor) => Promise<T>): Promise<T> => {
      const name = `sp_${(savepoints += 1)}`;
      await tx.query(`SAVEPOINT ${name}`);
      try {
        const result = await work(tx);
        await tx.query(`RELEASE SAVEPOINT ${name}`);
        return result;
      } catch (error) {
        await tx.query(`ROLLBACK TO SAVEPOINT ${name}`);
        throw error;
      }
    };
    await fn({
      tx,
      ooty,
      admin: anActor({ userId: adminId, roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: ooty }] }),
      scope: aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.SUB_WH_ADMIN, userId: adminId, warehouseIds: [ooty] }),
      // The real idempotency store (the default): the claim lives in idempotency_keys on `tx`.
      service: createGoodsReceiptsService(goodsReceiptsRepo, runTx, tx),
      lot: () => insertLot(tx, ooty, adminId),
    });
    throw new RollbackFixture();
  }).catch((error: unknown) => {
    if (!(error instanceof RollbackFixture)) throw error;
  });
}

const dbReady = (): Promise<boolean> =>
  requireDatabaseTables('goods_receipts', 'quality_checks', 'inventory_batches', 'stock_ledger', 'counter_offers', 'idempotency_keys');

function dbIt(name: string, fn: (world: World) => Promise<void>): void {
  it(name, async (ctx) => {
    if (!(await dbReady())) return ctx.skip();
    await inRolledBackTx(fn);
  });
}

async function counts(db: Executor, lot: Lot) {
  const res = await db.query<Record<string, number>>(
    `SELECT
       (SELECT count(*)::int FROM goods_receipts WHERE purchase_order_id = $1) AS receipts,
       (SELECT count(*)::int FROM quality_checks WHERE goods_receipt_id = $2) AS "qualityChecks",
       (SELECT count(*)::int FROM inventory_batches WHERE goods_receipt_id = $2) AS batches,
       (SELECT count(*)::int FROM stock_ledger sl JOIN inventory_batches b ON b.id = sl.batch_id
         WHERE b.goods_receipt_id = $2) AS "ledgerRows",
       (SELECT count(*)::int FROM allocations a JOIN inventory_batches b ON b.id = a.batch_id
         WHERE b.goods_receipt_id = $2) AS allocations,
       (SELECT count(*)::int FROM counter_offers WHERE listing_id = $3) AS "counterOffers"`,
    [lot.purchaseOrderId, lot.goodsReceiptId, lot.listingId],
  );
  return res.rows[0]!;
}

async function auditRows(db: Executor, actionCode: string, actorId: string): Promise<number> {
  const res = await db.query<{ n: number }>(
    `SELECT count(*)::int AS n FROM audit_log WHERE action_code = $1 AND actor_id = $2`,
    [actionCode, actorId],
  );
  return res.rows[0]!.n;
}

describeIfDatabase('BR-118: goods-receipt writes are idempotent against PostgreSQL (rolled back)', () => {
  dbIt('BR-118b: a replayed goods receipt returns the identical body; one receipt row and one audit row exist', async (w) => {
    const lot = await w.lot();
    const body = { purchaseOrderId: lot.purchaseOrderId, warehouseId: w.ooty, grossQtyKg: '40.000', photos: [] };
    const key = newId();
    const first = await w.service.createGoodsReceipt(w.admin, w.scope, body, key);
    const second = await w.service.createGoodsReceipt(w.admin, w.scope, body, key);
    expect(wire(second)).toEqual(wire(first));
    // The fixture's own receipt plus exactly one created here.
    expect((await counts(w.tx, lot)).receipts).toBe(2);
    expect(await auditRows(w.tx, 'inventory.goods_receipt.record', w.admin.userId)).toBe(1);

    await expectAppError(
      w.service.createGoodsReceipt(w.admin, w.scope, { ...body, grossQtyKg: '41.000' }, key),
      'IDEMPOTENCY_KEY_REUSED',
      409,
    );
    expect((await counts(w.tx, lot)).receipts).toBe(2);
    expect(await auditRows(w.tx, 'inventory.goods_receipt.record', w.admin.userId)).toBe(1);
  });

  dbIt('BR-118b / BR-106: a replayed quality check is not the "already checked" 409; it returns the identical body and leaves one check, one batch, one RECEIPT ledger row and one audit row each', async (w) => {
    const lot = await w.lot();
    const key = newId();
    const first = await w.service.recordQualityCheck(w.admin, w.scope, lot.goodsReceiptId, qcBody(), key);
    expect(first.batch).not.toBeNull();
    const after = await counts(w.tx, lot);
    const second = await w.service.recordQualityCheck(w.admin, w.scope, lot.goodsReceiptId, qcBody(), key);
    expect(wire(second)).toEqual(wire(first));
    expect(await counts(w.tx, lot)).toEqual(after);
    expect(after).toMatchObject({ qualityChecks: 1, batches: 1, ledgerRows: 1 });
    expect(await auditRows(w.tx, 'inventory.quality_check.perform', w.admin.userId)).toBe(1);
    expect(await auditRows(w.tx, 'inventory.batch.assign', w.admin.userId)).toBe(1);
  });

  dbIt('BR-118c: the same key with a different quality check body is 409 IDEMPOTENCY_KEY_REUSED (not the status CONFLICT), and nothing more is written', async (w) => {
    const lot = await w.lot();
    const key = newId();
    await w.service.recordQualityCheck(w.admin, w.scope, lot.goodsReceiptId, qcBody(), key);
    const after = await counts(w.tx, lot);
    await expectAppError(
      w.service.recordQualityCheck(w.admin, w.scope, lot.goodsReceiptId, qcBody({ acceptedQtyKg: '90.000' }), key),
      'IDEMPOTENCY_KEY_REUSED',
      409,
    );
    expect(await counts(w.tx, lot)).toEqual(after);
    expect(await auditRows(w.tx, 'inventory.quality_check.perform', w.admin.userId)).toBe(1);
  });

  dbIt('BR-118b: a replayed quality counter-offer returns the identical body and opens one round with one audit row; a different body is 409 IDEMPOTENCY_KEY_REUSED', async (w) => {
    const lot = await w.lot();
    const body = { pricePerKg: '45.00', quantityKg: '100.000' };
    const key = newId();
    const first = await w.service.createQualityCounterOffer(w.admin, w.scope, lot.goodsReceiptId, body, key);
    const second = await w.service.createQualityCounterOffer(w.admin, w.scope, lot.goodsReceiptId, body, key);
    expect(wire(second)).toEqual(wire(first));
    expect((await counts(w.tx, lot)).counterOffers).toBe(1);
    expect(await auditRows(w.tx, 'inventory.quality.counter_offer', w.admin.userId)).toBe(1);

    await expectAppError(
      w.service.createQualityCounterOffer(w.admin, w.scope, lot.goodsReceiptId, { ...body, pricePerKg: '44.00' }, key),
      'IDEMPOTENCY_KEY_REUSED',
      409,
    );
    expect((await counts(w.tx, lot)).counterOffers).toBe(1);
  });

  dbIt('BR-118d: a refused quality check is not remembered; the same key works once the cause is fixed', async (w) => {
    const lot = await w.lot();
    const key = newId();
    // accepted + rejected above the gross quantity: refused 422, and the claim rolls back with it.
    await expectAppError(
      w.service.recordQualityCheck(w.admin, w.scope, lot.goodsReceiptId, qcBody({ acceptedQtyKg: '100.000', rejectedQtyKg: '5.000', rejectionReason: 'Bruised' }), key),
      'VALIDATION_FAILED',
      422,
    );
    expect((await counts(w.tx, lot)).qualityChecks).toBe(0);
    const ok = await w.service.recordQualityCheck(w.admin, w.scope, lot.goodsReceiptId, qcBody(), key);
    expect(ok.qualityCheck.goodsReceiptId).toBe(lot.goodsReceiptId);
    expect((await counts(w.tx, lot)).qualityChecks).toBe(1);
  });
});
