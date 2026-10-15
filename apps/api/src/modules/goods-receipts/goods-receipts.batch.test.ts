/**
 * BR-106: an accepted goods receipt is stocked as exactly one inventory batch, through the ledger,
 * in the same transaction as the decision that accepted it. Real PostgreSQL, rolled back.
 *
 * WHY THIS FILE EXISTS: until BR-106 the quality check answered `batch: null` ("S-26 handles
 * inventory batches"), so goods a Sub Warehouse Admin accepted never became stock: nothing could
 * sell them, transfer them or pay the farmer for them through the ledger.
 *
 * The owner's decisions under test (docs/rules.md BR-106):
 *   1. cost per kg = the purchase order's agreed price, as-is (no QC price adjustment);
 *   2. batch code = BATCH-{year}-{6-digit sequence} (inventory_batch_number_seq, migration 0070);
 *   3. grade = the inspector's assigned grade, not the farmer's listed grade;
 *   4. expiry = the QC's optional expiryOn, NULL when it was not given;
 *   5. a quality counter-offer stocks nothing when it is sent; the batch is created when the farmer
 *      ACCEPTS it (counter-offers.service respondAccept), never on a reject or a lapse.
 *
 * Every service runs on one outer transaction that is rolled back; the services' own transactions
 * become SAVEPOINTs, so a refused request really rolls its writes back and the test can see that.
 */
import { expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Actor } from '../../auth/requireAuth.js';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { aScope, anActor, describeIfDatabase, newId } from '../../test/factories.js';
import { insertCrop, insertFarmerWithPlot, insertUser, requireDatabaseTables } from '../../test/dbFixtures.js';
import { counterOffersRepo } from '../listings/counter-offers.repo.js';
import { CounterOffersService } from '../listings/counter-offers.service.js';
import { goodsReceiptsRepo } from './goods-receipts.repo.js';
import { qcParameters, qualityCheckCreateBody } from './goods-receipts.schema.js';
import { createGoodsReceiptsService } from './goods-receipts.service.js';

const BATCH_CODE = /^BATCH-(\d{4})-(\d{6,})$/;

const dbReady = (): Promise<boolean> =>
  requireDatabaseTables('inventory_batches', 'stock_ledger', 'goods_receipts', 'quality_checks', 'counter_offers', 'allocations');

async function expectAppError(promise: Promise<unknown>, code: string, status: number): Promise<void> {
  await expect(promise).rejects.toSatisfy((error: unknown) => {
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe(code);
    expect((error as AppError).status).toBe(status);
    return true;
  });
}

/** A valid quality check body, parsed through the real schema so its defaults apply. */
function qcBody(overrides: Record<string, unknown>) {
  return qualityCheckCreateBody.parse({
    assignedGrade: 'GRADE_1',
    outcome: 'ACCEPTED',
    acceptedQtyKg: '100.000',
    items: qcParameters.map((parameter) => ({ parameter, score: 8, passed: true })),
    ...overrides,
  });
}

interface Lot {
  farmerUserId: string;
  farmerId: string;
  cropId: string;
  listingId: string;
  purchaseOrderId: string;
  goodsReceiptId: string;
}

/**
 * farmer -> crop -> fair price -> listing (ACCEPTED at Rs 50/kg, GRADE_1, 100 kg) -> purchase
 * order (Rs 50.00/kg, GRADE_1) -> goods receipt of 100 kg AWAITING_QC.
 */
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
    [listingId, `LST-B106-${listingId.slice(0, 8)}`, farmer.farmerId, cropId, fairPriceId, issuedBy],
  );
  const purchaseOrderId = newId();
  await db.query(
    `INSERT INTO purchase_orders
       (id, po_number, farmer_id, listing_id, warehouse_id, crop_id, grade, quantity_kg, price_per_kg, total_amount, issued_by)
     VALUES ($1, $2, $3, $4, $5, $6, 'GRADE_1', 100, 50.00, 5000.00, $7)`,
    [purchaseOrderId, `PO-B106-${purchaseOrderId.slice(0, 8)}`, farmer.farmerId, listingId, warehouseId, cropId, issuedBy],
  );
  const goodsReceiptId = newId();
  await db.query(
    `INSERT INTO goods_receipts (id, grn_number, purchase_order_id, warehouse_id, farmer_id, gross_qty_kg, received_by, status)
     VALUES ($1, $2, $3, $4, $5, 100, $6, 'AWAITING_QC')`,
    [goodsReceiptId, `GRN-B106-${goodsReceiptId.slice(0, 8)}`, purchaseOrderId, warehouseId, farmer.farmerId, issuedBy],
  );
  return { farmerUserId: farmer.userId, farmerId: farmer.farmerId, cropId, listingId, purchaseOrderId, goodsReceiptId };
}

async function batchesOf(db: Executor, goodsReceiptId: string) {
  const res = await db.query<{
    id: string;
    batch_code: string;
    warehouse_id: string;
    crop_id: string;
    grade: string;
    goods_receipt_id: string;
    source_farmer_id: string;
    qty_received: string;
    qty_available: string;
    cost_per_kg: string | null;
    storage_location: string | null;
    expiry_on: string | null;
    status: string;
  }>(
    `SELECT id, batch_code, warehouse_id, crop_id, grade::text, goods_receipt_id, source_farmer_id,
            qty_received::text, qty_available::text, cost_per_kg::text, storage_location,
            expiry_on::text, status
       FROM inventory_batches WHERE goods_receipt_id = $1`,
    [goodsReceiptId],
  );
  return res.rows;
}

async function ledgerOf(db: Executor, batchId: string) {
  const res = await db.query<{
    movement_type: string;
    qty_delta: string;
    balance_after: string;
    ref_type: string | null;
    ref_id: string | null;
    created_by: string | null;
  }>(
    `SELECT movement_type::text, qty_delta::text, balance_after::text, ref_type, ref_id, created_by
       FROM stock_ledger WHERE batch_id = $1 ORDER BY created_at, id`,
    [batchId],
  );
  return res.rows;
}

async function batchAuditRows(db: Executor, batchId: string) {
  const res = await db.query<{
    actor_id: string | null;
    actor_type: string;
    actor_role: string | null;
    action_code: string;
    entity_type: string;
    warehouse_id: string | null;
    outcome: string;
    after: Record<string, unknown> | null;
  }>(
    `SELECT actor_id, actor_type::text, actor_role, action_code, entity_type, warehouse_id, outcome, after
       FROM audit_log WHERE action_code = 'inventory.batch.assign' AND entity_id = $1`,
    [batchId],
  );
  return res.rows;
}

async function receiptState(db: Executor, goodsReceiptId: string) {
  const res = await db.query<{ status: string; checks: number }>(
    `SELECT gr.status::text AS status,
            (SELECT count(*)::int FROM quality_checks qc WHERE qc.goods_receipt_id = gr.id) AS checks
       FROM goods_receipts gr WHERE gr.id = $1`,
    [goodsReceiptId],
  );
  return res.rows[0]!;
}

// ---------------------------------------------------------------------------
// Harness: one rolled-back transaction, services' transactions as SAVEPOINTs
// ---------------------------------------------------------------------------
class RollbackFixture extends Error {}

interface World {
  tx: Executor;
  adminId: string;
  ooty: string;
  admin: Actor;
  qcScope: ResolvedScope;
  offerScope: ResolvedScope;
  goodsReceipts: ReturnType<typeof createGoodsReceiptsService>;
  counterOffers: CounterOffersService;
  lot: () => Promise<Lot>;
  farmer: (lot: Lot) => { actor: Actor; scope: ResolvedScope };
}

async function inRolledBackTx(fn: (world: World) => Promise<void>): Promise<void> {
  const { withTransaction } = await import('../../db/pool.js');
  await withTransaction(async (tx) => {
    const adminId = await insertUser(tx, 'ADMIN', 'BR-106 warehouse admin');
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
    const goodsReceipts = createGoodsReceiptsService(goodsReceiptsRepo, runTx, tx);
    await fn({
      tx,
      adminId,
      ooty,
      admin: anActor({ userId: adminId, roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: ooty }] }),
      qcScope: aScope({
        level: ScopeLevel.ALL,
        permission: 'inventory.quality_check.perform',
        roleCode: RoleCode.SUB_WH_ADMIN,
        userId: adminId,
        warehouseIds: [ooty],
      }),
      offerScope: aScope({
        level: ScopeLevel.ALL,
        permission: 'inventory.quality.counter_offer',
        roleCode: RoleCode.SUB_WH_ADMIN,
        userId: adminId,
        warehouseIds: [ooty],
      }),
      goodsReceipts,
      counterOffers: new CounterOffersService(counterOffersRepo, runTx, tx),
      lot: () => insertLot(tx, ooty, adminId),
      farmer: (lot) => ({
        actor: anActor({ userId: lot.farmerUserId, roles: [{ code: RoleCode.FARMER }], farmerId: lot.farmerId }),
        scope: aScope({
          level: ScopeLevel.OWN,
          permission: 'listing.counter_offer.respond',
          roleCode: RoleCode.FARMER,
          userId: lot.farmerUserId,
          farmerId: lot.farmerId,
        }),
      }),
    });
    throw new RollbackFixture();
  }).catch((error: unknown) => {
    if (!(error instanceof RollbackFixture)) throw error;
  });
}

function dbIt(name: string, fn: (world: World) => Promise<void>): void {
  it(name, async (ctx) => {
    if (!(await dbReady())) return ctx.skip();
    await inRolledBackTx(fn);
  });
}

// ---------------------------------------------------------------------------
// 1. The direct path: the quality check itself accepts the goods
// ---------------------------------------------------------------------------
describeIfDatabase('BR-106: an accepted quality check stocks one inventory batch (PostgreSQL, rolled back)', () => {
  dbIt('BR-106a: an ACCEPTED quality check creates one batch at the inspector grade and the purchase-order price, with one RECEIPT ledger row', async (w) => {
    const lot = await w.lot();
    const result = await w.goodsReceipts.recordQualityCheck(
      w.admin,
      w.qcScope,
      lot.goodsReceiptId,
      qcBody({
        assignedGrade: 'GRADE_2', // the farmer listed GRADE_1; the inspector's grade wins (decision 3)
        priceAdjustment: '-4.00', // recorded on the QC, NOT applied to the batch cost (decision 1)
        expiryOn: '2026-10-30',
        storageLocation: 'A-04-R2',
      }),
    );

    const rows = await batchesOf(w.tx, lot.goodsReceiptId);
    expect(rows).toHaveLength(1);
    const row = rows[0]!;
    const code = BATCH_CODE.exec(row.batch_code);
    expect(code).not.toBeNull();
    expect(Number(code![1])).toBe(new Date().getFullYear());
    expect(row).toMatchObject({
      warehouse_id: w.ooty,
      crop_id: lot.cropId,
      grade: 'GRADE_2',
      goods_receipt_id: lot.goodsReceiptId,
      source_farmer_id: lot.farmerId,
      qty_received: '100.000',
      qty_available: '100.000', // filled by the ledger trigger, never written directly
      cost_per_kg: '50.00',
      storage_location: 'A-04-R2',
      expiry_on: '2026-10-30',
      status: 'ACTIVE',
    });

    expect(await ledgerOf(w.tx, row.id)).toEqual([
      {
        movement_type: 'RECEIPT',
        qty_delta: '100.000',
        balance_after: '100.000',
        ref_type: 'GOODS_RECEIPT',
        ref_id: lot.goodsReceiptId,
        created_by: w.adminId,
      },
    ]);

    // The response carries the real batch, not null.
    expect(result.batch).not.toBeNull();
    expect(result.batch).toMatchObject({
      id: row.id,
      batchCode: row.batch_code,
      warehouseId: w.ooty,
      cropId: lot.cropId,
      grade: 'GRADE_2',
      goodsReceiptId: lot.goodsReceiptId,
      qtyReceivedKg: '100.000',
      qtyAvailableKg: '100.000',
      costPerKg: '50.00',
      storageLocation: 'A-04-R2',
      expiryOn: '2026-10-30',
      status: 'ACTIVE',
    });
    expect(result.qualityCheck.assignedGrade).toBe('GRADE_2');
    expect((await receiptState(w.tx, lot.goodsReceiptId)).status).toBe('ACCEPTED');
  });

  dbIt('BR-106b: a PARTIALLY_ACCEPTED quality check stocks the accepted quantity only, and an omitted expiryOn leaves expiry_on NULL', async (w) => {
    const lot = await w.lot();
    const result = await w.goodsReceipts.recordQualityCheck(
      w.admin,
      w.qcScope,
      lot.goodsReceiptId,
      qcBody({ outcome: 'PARTIALLY_ACCEPTED', acceptedQtyKg: '90.000', rejectedQtyKg: '10.000', rejectionReason: 'Bruised on arrival' }),
    );
    const [row, ...others] = await batchesOf(w.tx, lot.goodsReceiptId);
    expect(others).toHaveLength(0);
    expect(row).toMatchObject({ qty_received: '90.000', qty_available: '90.000', expiry_on: null, grade: 'GRADE_1' });
    const ledger = await ledgerOf(w.tx, row!.id);
    expect(ledger.map((l) => [l.movement_type, l.qty_delta])).toEqual([['RECEIPT', '90.000']]);
    expect(result.batch).toMatchObject({ id: row!.id, qtyReceivedKg: '90.000', expiryOn: null });
  });

  dbIt('BR-106c: a REJECTED quality check creates no batch, no ledger row and no batch audit row', async (w) => {
    const lot = await w.lot();
    const since = (await w.tx.query<{ n: number }>(`SELECT count(*)::int AS n FROM audit_log WHERE action_code = 'inventory.batch.assign'`)).rows[0]!.n;
    const result = await w.goodsReceipts.recordQualityCheck(
      w.admin,
      w.qcScope,
      lot.goodsReceiptId,
      qcBody({ outcome: 'REJECTED', acceptedQtyKg: '0.000', rejectedQtyKg: '100.000', rejectionReason: 'Pest damage' }),
    );
    expect(result.batch).toBeNull();
    expect(await batchesOf(w.tx, lot.goodsReceiptId)).toHaveLength(0);
    const after = (await w.tx.query<{ n: number }>(`SELECT count(*)::int AS n FROM audit_log WHERE action_code = 'inventory.batch.assign'`)).rows[0]!.n;
    expect(after).toBe(since);
  });

  dbIt('BR-106d: the batch is audited (inventory.batch.assign, same transaction) and allocated across the channels (BR-12)', async (w) => {
    const lot = await w.lot();
    const result = await w.goodsReceipts.recordQualityCheck(w.admin, w.qcScope, lot.goodsReceiptId, qcBody({}));
    const batchId = result.batch!.id;

    const audits = await batchAuditRows(w.tx, batchId);
    expect(audits).toHaveLength(1);
    expect(audits[0]).toMatchObject({
      actor_id: w.adminId,
      actor_type: 'USER',
      actor_role: RoleCode.SUB_WH_ADMIN,
      action_code: 'inventory.batch.assign',
      entity_type: 'batch',
      warehouse_id: w.ooty,
      outcome: 'ALLOWED',
      after: {
        batchCode: result.batch!.batchCode,
        goodsReceiptId: lot.goodsReceiptId,
        grade: 'GRADE_1',
        qtyReceivedKg: '100.000',
        trigger: 'quality_check',
      },
    });

    const allocations = await w.tx.query<{ channel: string; allocated_qty: string }>(
      `SELECT channel::text, allocated_qty::text FROM allocations WHERE batch_id = $1`,
      [batchId],
    );
    expect(allocations.rows.length).toBeGreaterThan(0);
    const totalGrams = allocations.rows.reduce((sum, r) => sum + Math.round(Number(r.allocated_qty) * 1000), 0);
    expect(totalGrams).toBe(100_000);
  });

  dbIt('BR-106e: a receipt that already has a batch is 409 CONFLICT and the quality check, the receipt status and the audit roll back together', async (w) => {
    const lot = await w.lot();
    // A batch already tied to this receipt (the DB allows at most one per receipt).
    await w.tx.query(
      `INSERT INTO inventory_batches (batch_code, warehouse_id, crop_id, grade, goods_receipt_id, source_farmer_id, qty_received)
       VALUES ($1, $2, $3, 'GRADE_1', $4, $5, 1)`,
      [`PRE-${newId()}`, w.ooty, lot.cropId, lot.goodsReceiptId, lot.farmerId],
    );
    const qcAudits = async () =>
      (await w.tx.query<{ n: number }>(
        `SELECT count(*)::int AS n FROM audit_log WHERE action_code = 'inventory.quality_check.perform' AND actor_id = $1`,
        [w.adminId],
      )).rows[0]!.n;

    await expectAppError(
      w.goodsReceipts.recordQualityCheck(w.admin, w.qcScope, lot.goodsReceiptId, qcBody({})),
      'CONFLICT',
      409,
    );
    expect(await receiptState(w.tx, lot.goodsReceiptId)).toEqual({ status: 'AWAITING_QC', checks: 0 });
    expect(await qcAudits()).toBe(0);
    expect(await batchesOf(w.tx, lot.goodsReceiptId)).toHaveLength(1);
  });

  dbIt('BR-106f: batch codes come from inventory_batch_number_seq: a later receipt gets a higher number', async (w) => {
    const first = await w.lot();
    const second = await w.lot();
    const a = await w.goodsReceipts.recordQualityCheck(w.admin, w.qcScope, first.goodsReceiptId, qcBody({}));
    const b = await w.goodsReceipts.recordQualityCheck(w.admin, w.qcScope, second.goodsReceiptId, qcBody({}));
    const seqA = Number(BATCH_CODE.exec(a.batch!.batchCode)![2]);
    const seqB = Number(BATCH_CODE.exec(b.batch!.batchCode)![2]);
    expect(seqB).toBeGreaterThan(seqA);
  });

  dbIt('BR-106g: an ACCEPTED quality check at grade REJECT stocks nothing (a REJECT grade is never sellable)', async (w) => {
    const lot = await w.lot();
    const result = await w.goodsReceipts.recordQualityCheck(w.admin, w.qcScope, lot.goodsReceiptId, qcBody({ assignedGrade: 'REJECT' }));
    expect(result.batch).toBeNull();
    expect(await batchesOf(w.tx, lot.goodsReceiptId)).toHaveLength(0);
  });

  dbIt('BR-106h: the receipt read shows the batch it created', async (w) => {
    const lot = await w.lot();
    const result = await w.goodsReceipts.recordQualityCheck(w.admin, w.qcScope, lot.goodsReceiptId, qcBody({}));
    const receipt = await w.goodsReceipts.getById(w.admin, w.qcScope, lot.goodsReceiptId);
    expect(receipt.batchId).toBe(result.batch!.id);
    expect(receipt.batchCode).toBe(result.batch!.batchCode);
  });
});

// ---------------------------------------------------------------------------
// 2. The counter-offer path: stock only when the farmer accepts
// ---------------------------------------------------------------------------
describeIfDatabase('BR-106: a quality counter-offer stocks the batch only when the farmer accepts it (PostgreSQL, rolled back)', () => {
  /** QC rejects the lot as delivered, then the warehouse offers a lower price for 80 kg of it. */
  async function rejectedThenOffered(w: World, offer = { pricePerKg: '40.00', quantityKg: '80.000' }) {
    const lot = await w.lot();
    await w.goodsReceipts.recordQualityCheck(
      w.admin,
      w.qcScope,
      lot.goodsReceiptId,
      qcBody({
        outcome: 'REJECTED',
        assignedGrade: 'GRADE_2',
        acceptedQtyKg: '0.000',
        rejectedQtyKg: '100.000',
        rejectionReason: 'Below GRADE_1 size',
        expiryOn: '2026-11-02',
        storageLocation: 'B-01',
      }),
    );
    const sent = await w.goodsReceipts.createQualityCounterOffer(w.admin, w.offerScope, lot.goodsReceiptId, offer);
    return { lot, offerId: sent.id };
  }

  dbIt('BR-106i: sending the quality counter-offer creates no batch (decision 5)', async (w) => {
    const { lot } = await rejectedThenOffered(w);
    expect(await batchesOf(w.tx, lot.goodsReceiptId)).toHaveLength(0);
  });

  dbIt('BR-106j: the farmer accepting the quality counter-offer stocks one batch: QC grade and expiry, offer quantity, purchase-order cost, one RECEIPT row, a SYSTEM audit row', async (w) => {
    const { lot, offerId } = await rejectedThenOffered(w);
    const farmer = w.farmer(lot);
    await w.counterOffers.respondAccept(farmer.actor, farmer.scope, lot.listingId, offerId, newId());

    const rows = await batchesOf(w.tx, lot.goodsReceiptId);
    expect(rows).toHaveLength(1);
    const row = rows[0]!;
    expect(row.batch_code).toMatch(BATCH_CODE);
    expect(row).toMatchObject({
      warehouse_id: w.ooty,
      crop_id: lot.cropId,
      grade: 'GRADE_2', // the inspector's grade from the quality check
      source_farmer_id: lot.farmerId,
      qty_received: '80.000', // the quantity the farmer accepted
      qty_available: '80.000',
      cost_per_kg: '50.00', // the purchase order's price as-is (decision 1), not the offer's 40.00
      expiry_on: '2026-11-02',
      storage_location: 'B-01',
      status: 'ACTIVE',
    });
    const ledger = await ledgerOf(w.tx, row.id);
    expect(ledger).toEqual([
      { movement_type: 'RECEIPT', qty_delta: '80.000', balance_after: '80.000', ref_type: 'GOODS_RECEIPT', ref_id: lot.goodsReceiptId, created_by: null },
    ]);
    const audits = await batchAuditRows(w.tx, row.id);
    expect(audits).toHaveLength(1);
    expect(audits[0]).toMatchObject({
      actor_id: null,
      actor_type: 'SYSTEM',
      action_code: 'inventory.batch.assign',
      entity_type: 'batch',
      warehouse_id: w.ooty,
      after: { goodsReceiptId: lot.goodsReceiptId, counterOfferId: offerId, qtyReceivedKg: '80.000', trigger: 'quality_counter_offer.accepted' },
    });
  });

  dbIt('BR-106k: replaying the farmer accept with the same Idempotency-Key stocks nothing twice', async (w) => {
    const { lot, offerId } = await rejectedThenOffered(w);
    const farmer = w.farmer(lot);
    const key = newId();
    await w.counterOffers.respondAccept(farmer.actor, farmer.scope, lot.listingId, offerId, key);
    await w.counterOffers.respondAccept(farmer.actor, farmer.scope, lot.listingId, offerId, key);
    const rows = await batchesOf(w.tx, lot.goodsReceiptId);
    expect(rows).toHaveLength(1);
    expect(await ledgerOf(w.tx, rows[0]!.id)).toHaveLength(1);
  });

  dbIt('BR-106l: the farmer rejecting the quality counter-offer stocks nothing', async (w) => {
    const { lot, offerId } = await rejectedThenOffered(w);
    const farmer = w.farmer(lot);
    await w.counterOffers.respondReject(farmer.actor, farmer.scope, lot.listingId, offerId, 'Price too low', newId());
    expect(await batchesOf(w.tx, lot.goodsReceiptId)).toHaveLength(0);
  });

  dbIt('BR-106m: an offer quantity above what physically arrived is stocked at the received gross quantity, never more', async (w) => {
    const { lot, offerId } = await rejectedThenOffered(w, { pricePerKg: '40.00', quantityKg: '150.000' });
    const farmer = w.farmer(lot);
    await w.counterOffers.respondAccept(farmer.actor, farmer.scope, lot.listingId, offerId, newId());
    const [row] = await batchesOf(w.tx, lot.goodsReceiptId);
    expect(row).toMatchObject({ qty_received: '100.000', qty_available: '100.000' });
  });

  dbIt('BR-106n: a lot already stocked by its quality check is not stocked again when a later counter-offer on it is accepted', async (w) => {
    const lot = await w.lot();
    const qc = await w.goodsReceipts.recordQualityCheck(w.admin, w.qcScope, lot.goodsReceiptId, qcBody({ acceptedQtyKg: '100.000' }));
    const sent = await w.goodsReceipts.createQualityCounterOffer(w.admin, w.offerScope, lot.goodsReceiptId, {
      pricePerKg: '45.00',
      quantityKg: '100.000',
    });
    const farmer = w.farmer(lot);
    await w.counterOffers.respondAccept(farmer.actor, farmer.scope, lot.listingId, sent.id, newId());
    const rows = await batchesOf(w.tx, lot.goodsReceiptId);
    expect(rows.map((r) => r.id)).toEqual([qc.batch!.id]);
    expect(await ledgerOf(w.tx, qc.batch!.id)).toHaveLength(1);
  });

  dbIt('BR-106o: a counter-offer on a receipt with no quality check stocks nothing on accept (there is no inspector grade to stock it at)', async (w) => {
    const lot = await w.lot();
    const sent = await w.goodsReceipts.createQualityCounterOffer(w.admin, w.offerScope, lot.goodsReceiptId, {
      pricePerKg: '45.00',
      quantityKg: '100.000',
    });
    const farmer = w.farmer(lot);
    const listing = await w.counterOffers.respondAccept(farmer.actor, farmer.scope, lot.listingId, sent.id, newId());
    expect(listing.status).toBe('ACCEPTED');
    expect(await batchesOf(w.tx, lot.goodsReceiptId)).toHaveLength(0);
  });
});
