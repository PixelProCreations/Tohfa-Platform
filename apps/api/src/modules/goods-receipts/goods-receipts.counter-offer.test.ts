/**
 * BR-10 / BR-11: the quality counter-offer at goods receipt, against a real PostgreSQL.
 *
 * WHY THIS FILE EXISTS: POST /v1/admin/goods-receipts/{id}/counter-offer shipped with an INSERT
 * naming columns counter_offers never had (goods_receipt_id, offered_by, offered_by_user_id). The
 * only tests ran the service against a mocked repo, so every real call was a 500 (Postgres 42703).
 * Every query of this path now runs here against a migrated database.
 *
 * THE DESIGN UNDER TEST (an UNCONFIRMED default, docs/rules.md BR-10: the rules list the quality
 * counter-offer as a second surface that is not specified yet): a quality counter-offer is a round
 * of the negotiation on the LISTING behind the receipt's purchase order
 * (goods_receipts.purchase_order_id -> purchase_orders.listing_id). So it takes the next free
 * round of that listing under the same 4-round ceiling, its window comes from
 * system_config.counter_offer_window_hours, it moves the ACCEPTED listing to COUNTER_OFFERED, and
 * the farmer answers it through the existing listing endpoints. A closed quality negotiation
 * (farmer reject, expiry) returns the listing to ACCEPTED, its prior state, because it already has
 * a purchase order; a listing without one still goes back to PENDING_APPROVAL.
 *
 * Two layers:
 *   1. the real service + repo inside one transaction that is rolled back (the services' own
 *      transactions become SAVEPOINTs, so a refused request really rolls its writes back);
 *   2. the real app router over HTTP, on committed rows this suite removes afterwards.
 */
import type { Server } from 'node:http';
import { afterAll, beforeAll, expect, it } from 'vitest';
import request from 'supertest';
import { z } from 'zod';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Actor } from '../../auth/requireAuth.js';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { aScope, anActor, describeIfDatabase, hasDatabase, IDS, newId } from '../../test/factories.js';
import {
  ensureStandardUsers,
  insertCrop,
  insertFarmerWithPlot,
  insertUser,
  requireDatabaseTables,
} from '../../test/dbFixtures.js';
import { counterOffersRepo } from '../listings/counter-offers.repo.js';
import { CounterOffersService } from '../listings/counter-offers.service.js';
import { goodsReceiptsRepo } from './goods-receipts.repo.js';
import { createGoodsReceiptsService } from './goods-receipts.service.js';

const HOUR_MS = 60 * 60 * 1000;
const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

/**
 * docs/openapi.yaml components.schemas.CounterOffer, written out independently of the
 * implementation. Strict, and every documented property is present on this endpoint's body.
 */
const documentedCounterOffer = z
  .object({
    id: z.string().uuid(),
    listingId: z.string().uuid().nullable(),
    goodsReceiptId: z.string().uuid().nullable(),
    round: z.number().int().min(1).max(4),
    offeredBy: z.enum(['ADMIN', 'FARMER']),
    offeredByUserId: z.string().uuid().nullable(),
    pricePerKg: z.string().regex(/^-?[0-9]{1,10}(\.[0-9]{1,2})?$/),
    quantityKg: z.string().regex(/^-?[0-9]{1,9}(\.[0-9]{1,3})?$/),
    message: z.string().nullable(),
    status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'COUNTERED', 'LAPSED']),
    expiresAt: z.string().regex(ISO_DATE_TIME),
    respondedAt: z.string().regex(ISO_DATE_TIME).nullable(),
  })
  .strict();

const OFFER_BODY = {
  pricePerKg: '45.00',
  quantityKg: '100.000',
  message: 'Size variation on 20% of the lot; offering Rs 45/kg for the full quantity',
};

const dbReady = (): Promise<boolean> =>
  requireDatabaseTables('counter_offers', 'goods_receipts', 'purchase_orders', 'produce_listings', 'system_config');

async function expectAppError(promise: Promise<unknown>, code: string, status: number): Promise<void> {
  await expect(promise).rejects.toSatisfy((error: unknown) => {
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe(code);
    expect((error as AppError).status).toBe(status);
    return true;
  });
}

async function warehouseIdByCode(db: Executor, code: string): Promise<string> {
  const res = await db.query<{ id: string }>('SELECT id FROM warehouses WHERE code = $1', [code]);
  const id = res.rows[0]?.id;
  if (id === undefined) throw new Error(`seeded warehouse ${code} is missing: run the reference seed first`);
  return id;
}

async function windowHoursFromConfig(db: Executor): Promise<number> {
  const res = await db.query<{ value: unknown }>(
    `SELECT value FROM system_config WHERE key = 'counter_offer_window_hours'`,
  );
  const hours = Number(res.rows[0]?.value);
  if (!Number.isFinite(hours) || hours <= 0) throw new Error('system_config.counter_offer_window_hours is not seeded');
  return hours;
}

interface Lot {
  farmerUserId: string;
  farmerId: string;
  listingId: string;
  purchaseOrderId: string;
  goodsReceiptId: string;
  warehouseId: string;
}

interface LotOptions {
  /** ACCEPTED with a purchase order and a receipt (the normal case), or a bare pending listing. */
  listing: 'ACCEPTED_WITH_RECEIPT' | 'PENDING_APPROVAL_NO_PO';
  warehouseId: string;
  issuedBy: string;
  tag: string;
  receipt?: { status: string; acceptedQtyKg: string; rejectedQtyKg: string; rejectionReason: string | null };
}

/** farmer -> crop -> fair price -> listing (-> approval -> purchase order -> goods receipt). */
async function insertLot(db: Executor, options: LotOptions): Promise<Lot> {
  const farmer = await insertFarmerWithPlot(db);
  const cropId = await insertCrop(db);
  const fairPriceId = newId();
  await db.query(
    `INSERT INTO fair_prices (id, crop_id, grade, ceiling_price, effective_from, set_by)
     VALUES ($1, $2, 'GRADE_1', 100.00, '2026-01-01', $3)`,
    [fairPriceId, cropId, options.issuedBy],
  );
  const listingId = newId();
  await db.query(
    `INSERT INTO produce_listings (id, listing_number, farmer_id, crop_id, grade, quantity_kg, price_per_kg, fair_price_id, status)
     VALUES ($1, $2, $3, $4, 'GRADE_1', 100, 50.00, $5, 'PENDING_APPROVAL')`,
    [listingId, `LST-${options.tag}-${listingId.slice(0, 8)}`, farmer.farmerId, cropId, fairPriceId],
  );
  const lot: Lot = {
    farmerUserId: farmer.userId,
    farmerId: farmer.farmerId,
    listingId,
    purchaseOrderId: '',
    goodsReceiptId: '',
    warehouseId: options.warehouseId,
  };
  if (options.listing === 'PENDING_APPROVAL_NO_PO') return lot;

  // What the approve route does: ACCEPTED at the asking terms, version 2, then the purchase order.
  await db.query(
    `UPDATE produce_listings
        SET status = 'ACCEPTED', final_price_per_kg = 50.00, final_quantity_kg = 100,
            approved_by = $2, approved_at = now(), version = version + 1
      WHERE id = $1`,
    [listingId, options.issuedBy],
  );
  lot.purchaseOrderId = newId();
  await db.query(
    `INSERT INTO purchase_orders
       (id, po_number, farmer_id, listing_id, warehouse_id, crop_id, grade, quantity_kg, price_per_kg, total_amount, issued_by)
     VALUES ($1, $2, $3, $4, $5, $6, 'GRADE_1', 100, 50.00, 5000.00, $7)`,
    [lot.purchaseOrderId, `PO-${options.tag}-${lot.purchaseOrderId.slice(0, 8)}`, farmer.farmerId, listingId, options.warehouseId, cropId, options.issuedBy],
  );
  const receipt = options.receipt ?? { status: 'AWAITING_QC', acceptedQtyKg: '0', rejectedQtyKg: '0', rejectionReason: null };
  lot.goodsReceiptId = newId();
  await db.query(
    `INSERT INTO goods_receipts
       (id, grn_number, purchase_order_id, warehouse_id, farmer_id, gross_qty_kg, accepted_qty_kg, rejected_qty_kg,
        rejection_reason, received_by, status)
     VALUES ($1, $2, $3, $4, $5, 100, $6, $7, $8, $9, $10)`,
    [
      lot.goodsReceiptId,
      `GRN-${options.tag}-${lot.goodsReceiptId.slice(0, 8)}`,
      lot.purchaseOrderId,
      options.warehouseId,
      farmer.farmerId,
      receipt.acceptedQtyKg,
      receipt.rejectedQtyKg,
      receipt.rejectionReason,
      options.issuedBy,
      receipt.status,
    ],
  );
  return lot;
}

/** Insert a closed listing-negotiation round directly (the history a quality offer follows). */
async function insertClosedRound(db: Executor, listingId: string, round: number, actorUserId: string): Promise<void> {
  await db.query(
    `INSERT INTO counter_offers
       (listing_id, round, actor, actor_user_id, price_per_kg, quantity_kg, status, expires_at, responded_at, responded_by)
     VALUES ($1, $2, $3, $4, 48.00, 100, 'COUNTERED', now() + interval '1 day', now(), $4)`,
    [listingId, round, round % 2 === 1 ? 'ADMIN' : 'FARMER', actorUserId],
  );
}

interface ListingState {
  status: string;
  version: number;
  finalPricePerKg: string | null;
  finalQuantityKg: string | null;
}

async function listingState(db: Executor, listingId: string): Promise<ListingState> {
  const res = await db.query<ListingState>(
    `SELECT status, version, final_price_per_kg::text AS "finalPricePerKg", final_quantity_kg::text AS "finalQuantityKg"
       FROM produce_listings WHERE id = $1`,
    [listingId],
  );
  return res.rows[0]!;
}

async function offersOf(db: Executor, listingId: string) {
  const res = await db.query<{
    id: string;
    listing_id: string;
    goods_receipt_id: string | null;
    round: number;
    actor: string;
    actor_user_id: string;
    status: string;
    price_per_kg: string;
    quantity_kg: string;
    message: string | null;
    expires_at: Date;
    created_at: Date;
    responded_at: Date | null;
    responded_by: string | null;
  }>(
    `SELECT id, listing_id, goods_receipt_id, round, actor, actor_user_id, status, price_per_kg::text, quantity_kg::text,
            message, expires_at, created_at, responded_at, responded_by
       FROM counter_offers WHERE listing_id = $1 ORDER BY round`,
    [listingId],
  );
  return res.rows;
}

async function receiptState(db: Executor, goodsReceiptId: string) {
  const res = await db.query<{ status: string; accepted: string; rejected: string; reason: string | null }>(
    `SELECT status, accepted_qty_kg::text AS accepted, rejected_qty_kg::text AS rejected, rejection_reason AS reason
       FROM goods_receipts WHERE id = $1`,
    [goodsReceiptId],
  );
  return res.rows[0]!;
}

async function qualityAuditRows(db: Executor, goodsReceiptId: string) {
  const res = await db.query<{
    action_code: string;
    actor_id: string;
    actor_role: string;
    entity_type: string;
    entity_id: string;
    warehouse_id: string;
    outcome: string;
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
  }>(
    `SELECT action_code, actor_id, actor_role, entity_type, entity_id, warehouse_id, outcome, before, after
       FROM audit_log
      WHERE action_code = 'inventory.quality.counter_offer' AND after->>'goodsReceiptId' = $1`,
    [goodsReceiptId],
  );
  return res.rows;
}

// ===========================================================================
// 1. Service + repo against PostgreSQL, rolled back
// ===========================================================================
class RollbackFixture extends Error {}

interface World {
  tx: Executor;
  adminId: string;
  ooty: string;
  admin: Actor;
  /** Main Warehouse Admin with no assigned warehouse: all four (warehouseScope.ts default). */
  mainScope: ResolvedScope;
  goodsReceipts: ReturnType<typeof createGoodsReceiptsService>;
  counterOffers: CounterOffersService;
  lot: (options?: Partial<Pick<LotOptions, 'listing' | 'receipt'>>) => Promise<Lot>;
  farmer: (lot: Lot) => { actor: Actor; scope: ResolvedScope };
  listingAdminScope: ResolvedScope;
}

async function inRolledBackTx(fn: (world: World) => Promise<void>): Promise<void> {
  const { withTransaction } = await import('../../db/pool.js');
  await withTransaction(async (tx) => {
    const adminId = await insertUser(tx, 'ADMIN', 'H3 quality admin');
    const ooty = await warehouseIdByCode(tx, 'WH-OOTY');
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
      adminId,
      ooty,
      admin: anActor({ userId: adminId, roles: [{ code: RoleCode.MAIN_WH_ADMIN }] }),
      mainScope: aScope({
        level: ScopeLevel.ALL,
        permission: 'inventory.quality.counter_offer',
        roleCode: RoleCode.MAIN_WH_ADMIN,
        userId: adminId,
      }),
      listingAdminScope: aScope({
        level: ScopeLevel.ALL,
        permission: 'listing.counter_offer.send',
        roleCode: RoleCode.TOHFA_ADMIN,
        userId: adminId,
      }),
      goodsReceipts: createGoodsReceiptsService(goodsReceiptsRepo, runTx, tx),
      // The real repo and the real idempotency_keys store, all on the test transaction.
      counterOffers: new CounterOffersService(counterOffersRepo, runTx, tx),
      lot: (options = {}) =>
        insertLot(tx, {
          listing: options.listing ?? 'ACCEPTED_WITH_RECEIPT',
          warehouseId: ooty,
          issuedBy: adminId,
          tag: 'H3T',
          ...(options.receipt === undefined ? {} : { receipt: options.receipt }),
        }),
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

describeIfDatabase('quality counter-offer: service and repo against PostgreSQL (rolled back)', () => {
  dbIt('BR-10: the quality counter-offer is written on the listing behind the receipt and returns the documented CounterOffer shape', async (w) => {
    const lot = await w.lot();
    const windowHours = await windowHoursFromConfig(w.tx);
    const before = Date.now();
    const offer = await w.goodsReceipts.createQualityCounterOffer(w.admin, w.mainScope, lot.goodsReceiptId, OFFER_BODY);
    const after = Date.now();

    const body = documentedCounterOffer.parse(offer);
    expect(body).toEqual({
      id: body.id,
      listingId: lot.listingId,
      goodsReceiptId: lot.goodsReceiptId,
      round: 1,
      offeredBy: 'ADMIN',
      offeredByUserId: w.adminId,
      pricePerKg: '45.00',
      quantityKg: '100.000',
      message: OFFER_BODY.message,
      status: 'PENDING',
      expiresAt: body.expiresAt,
      respondedAt: null,
    });

    const [row, ...others] = await offersOf(w.tx, lot.listingId);
    expect(others).toHaveLength(0);
    expect(row).toMatchObject({
      id: body.id,
      listing_id: lot.listingId,
      goods_receipt_id: lot.goodsReceiptId,
      round: 1,
      actor: 'ADMIN',
      actor_user_id: w.adminId,
      status: 'PENDING',
      price_per_kg: '45.00',
      quantity_kg: '100.000',
      responded_at: null,
      responded_by: null,
    });
    expect(row!.expires_at.toISOString()).toBe(body.expiresAt);
    expect(row!.expires_at.getTime()).toBeGreaterThanOrEqual(before + windowHours * HOUR_MS);
    expect(row!.expires_at.getTime()).toBeLessThanOrEqual(after + windowHours * HOUR_MS);

    // The listing is reopened for the farmer; the receipt shows the offer.
    expect(await listingState(w.tx, lot.listingId)).toEqual({
      status: 'COUNTER_OFFERED',
      version: 3,
      finalPricePerKg: '50.00',
      finalQuantityKg: '100.000',
    });
    expect((await receiptState(w.tx, lot.goodsReceiptId)).status).toBe('COUNTER_OFFERED');

    // One audit row, in the same transaction, with ids, statuses and the round only.
    const audits = await qualityAuditRows(w.tx, lot.goodsReceiptId);
    expect(audits).toHaveLength(1);
    expect(audits[0]).toMatchObject({
      action_code: 'inventory.quality.counter_offer',
      actor_id: w.adminId,
      actor_role: RoleCode.MAIN_WH_ADMIN,
      entity_type: 'counter_offer',
      entity_id: body.id,
      warehouse_id: w.ooty,
      outcome: 'ALLOWED',
      before: { goodsReceiptStatus: 'AWAITING_QC', listingStatus: 'ACCEPTED', listingVersion: 2 },
      after: {
        goodsReceiptId: lot.goodsReceiptId,
        listingId: lot.listingId,
        round: 1,
        status: 'PENDING',
        goodsReceiptStatus: 'COUNTER_OFFERED',
        listingStatus: 'COUNTER_OFFERED',
        listingVersion: 3,
        expiresAt: body.expiresAt,
      },
    });
    const image = JSON.stringify([audits[0]!.before, audits[0]!.after]);
    expect(image).not.toContain('Size variation');
    expect(image).not.toContain('45.00');
  });

  dbIt('BR-10: the window is read from system_config.counter_offer_window_hours: set to 6 inside the transaction, the offer expires 6 hours out', async (w) => {
    const lot = await w.lot();
    await w.tx.query(`UPDATE system_config SET value = '6'::jsonb WHERE key = 'counter_offer_window_hours'`);
    const before = Date.now();
    const offer = await w.goodsReceipts.createQualityCounterOffer(w.admin, w.mainScope, lot.goodsReceiptId, OFFER_BODY);
    const after = Date.now();
    const expiresAt = new Date(offer.expiresAt).getTime();
    expect(expiresAt).toBeGreaterThanOrEqual(before + 6 * HOUR_MS);
    expect(expiresAt).toBeLessThanOrEqual(after + 6 * HOUR_MS);
    const [row] = await offersOf(w.tx, lot.listingId);
    expect(row!.expires_at.getTime()).toBe(expiresAt);
  });

  dbIt('BR-10: an invalid counter_offer_window_hours is a 500 INTERNAL that writes nothing (no literal 24-hour fallback, as in the listing module)', async (w) => {
    const lot = await w.lot();
    await w.tx.query(`UPDATE system_config SET value = '0'::jsonb WHERE key = 'counter_offer_window_hours'`);
    await expectAppError(
      w.goodsReceipts.createQualityCounterOffer(w.admin, w.mainScope, lot.goodsReceiptId, OFFER_BODY),
      'INTERNAL',
      500,
    );
    expect(await offersOf(w.tx, lot.listingId)).toHaveLength(0);
    expect((await listingState(w.tx, lot.listingId)).status).toBe('ACCEPTED');
    expect((await receiptState(w.tx, lot.goodsReceiptId)).status).toBe('AWAITING_QC');
  });

  dbIt('BR-11: the quality counter-offer takes the next round of the listing negotiation (round 3 after two listing rounds)', async (w) => {
    const lot = await w.lot();
    await insertClosedRound(w.tx, lot.listingId, 1, w.adminId);
    await insertClosedRound(w.tx, lot.listingId, 2, lot.farmerUserId);
    const offer = await w.goodsReceipts.createQualityCounterOffer(w.admin, w.mainScope, lot.goodsReceiptId, OFFER_BODY);
    expect(offer.round).toBe(3);
    expect((await offersOf(w.tx, lot.listingId)).map((o) => [o.round, o.actor, o.goods_receipt_id])).toEqual([
      [1, 'ADMIN', null],
      [2, 'FARMER', null],
      [3, 'ADMIN', lot.goodsReceiptId],
    ]);
  });

  dbIt('BR-11: with all 4 rounds of the listing used, the quality counter-offer is 409 COUNTER_LIMIT_REACHED and nothing changes', async (w) => {
    const lot = await w.lot();
    for (const round of [1, 2, 3, 4]) await insertClosedRound(w.tx, lot.listingId, round, round % 2 === 1 ? w.adminId : lot.farmerUserId);
    await expectAppError(
      w.goodsReceipts.createQualityCounterOffer(w.admin, w.mainScope, lot.goodsReceiptId, OFFER_BODY),
      'COUNTER_LIMIT_REACHED',
      409,
    );
    expect(await offersOf(w.tx, lot.listingId)).toHaveLength(4);
    expect(await listingState(w.tx, lot.listingId)).toMatchObject({ status: 'ACCEPTED', version: 2 });
    expect((await receiptState(w.tx, lot.goodsReceiptId)).status).toBe('AWAITING_QC');
    expect(await qualityAuditRows(w.tx, lot.goodsReceiptId)).toHaveLength(0);
  });

  dbIt('BR-10: a second quality counter-offer on the same receipt while the first is PENDING is 409 CONFLICT and changes nothing', async (w) => {
    const lot = await w.lot();
    const first = await w.goodsReceipts.createQualityCounterOffer(w.admin, w.mainScope, lot.goodsReceiptId, OFFER_BODY);
    await expectAppError(
      w.goodsReceipts.createQualityCounterOffer(w.admin, w.mainScope, lot.goodsReceiptId, { ...OFFER_BODY, pricePerKg: '44.00' }),
      'CONFLICT',
      409,
    );
    const offers = await offersOf(w.tx, lot.listingId);
    expect(offers.map((o) => [o.id, o.status, o.price_per_kg])).toEqual([[first.id, 'PENDING', '45.00']]);
    expect(await listingState(w.tx, lot.listingId)).toMatchObject({ status: 'COUNTER_OFFERED', version: 3 });
    expect(await qualityAuditRows(w.tx, lot.goodsReceiptId)).toHaveLength(1);
  });

  dbIt('BR-10: a counter-offer on a partially rejected receipt keeps its quantities and rejection reason (the old update nulled the reason and broke the CHECK)', async (w) => {
    const lot = await w.lot({
      receipt: { status: 'PARTIALLY_ACCEPTED', acceptedQtyKg: '90', rejectedQtyKg: '10', rejectionReason: 'Bruised on arrival' },
    });
    const offer = await w.goodsReceipts.createQualityCounterOffer(w.admin, w.mainScope, lot.goodsReceiptId, {
      pricePerKg: '46.50',
      quantityKg: '90.000',
    });
    expect(offer).toMatchObject({ round: 1, pricePerKg: '46.50', quantityKg: '90.000', message: null });
    expect(await receiptState(w.tx, lot.goodsReceiptId)).toEqual({
      status: 'COUNTER_OFFERED',
      accepted: '90.000',
      rejected: '10.000',
      reason: 'Bruised on arrival',
    });
  });

  dbIt('BR-10: a receipt whose listing is no longer ACCEPTED is 409 INVALID_STATE_TRANSITION and writes nothing', async (w) => {
    const lot = await w.lot();
    await w.tx.query(
      `UPDATE produce_listings SET status = 'REJECTED', rejection_reason = 'Withdrawn by the association', rejected_by = $2, rejected_at = now()
        WHERE id = $1`,
      [lot.listingId, w.adminId],
    );
    await expectAppError(
      w.goodsReceipts.createQualityCounterOffer(w.admin, w.mainScope, lot.goodsReceiptId, OFFER_BODY),
      'INVALID_STATE_TRANSITION',
      409,
    );
    expect(await offersOf(w.tx, lot.listingId)).toHaveLength(0);
    expect((await receiptState(w.tx, lot.goodsReceiptId)).status).toBe('AWAITING_QC');
  });

  dbIt('BR-10: an unknown receipt id is 404 NOT_FOUND', async (w) => {
    await expectAppError(
      w.goodsReceipts.createQualityCounterOffer(w.admin, w.mainScope, newId(), OFFER_BODY),
      'NOT_FOUND',
      404,
    );
  });

  dbIt('BR-10: the farmer accepts the quality counter-offer through the existing respondAccept: listing ACCEPTED at the offer terms, offer ACCEPTED', async (w) => {
    const lot = await w.lot();
    const offer = await w.goodsReceipts.createQualityCounterOffer(w.admin, w.mainScope, lot.goodsReceiptId, OFFER_BODY);
    const farmer = w.farmer(lot);
    const listing = await w.counterOffers.respondAccept(farmer.actor, farmer.scope, lot.listingId, offer.id, newId());
    expect(listing).toMatchObject({ id: lot.listingId, status: 'ACCEPTED', finalPricePerKg: '45.00', finalQuantityKg: '100.000' });
    const [row] = await offersOf(w.tx, lot.listingId);
    expect(row).toMatchObject({ id: offer.id, status: 'ACCEPTED', responded_by: lot.farmerUserId });
    expect(row!.responded_at).not.toBeNull();
  });

  dbIt('BR-10: the farmer rejects the quality counter-offer: the listing returns to ACCEPTED (its prior state, it has a purchase order), not to PENDING_APPROVAL', async (w) => {
    const lot = await w.lot();
    const offer = await w.goodsReceipts.createQualityCounterOffer(w.admin, w.mainScope, lot.goodsReceiptId, OFFER_BODY);
    const farmer = w.farmer(lot);
    const view = await w.counterOffers.respondReject(farmer.actor, farmer.scope, lot.listingId, offer.id, 'Price too low', newId());
    expect(view).toMatchObject({ id: offer.id, status: 'REJECTED', listingId: lot.listingId });
    expect(await listingState(w.tx, lot.listingId)).toEqual({
      status: 'ACCEPTED',
      version: 4,
      finalPricePerKg: '50.00',
      finalQuantityKg: '100.000',
    });
  });

  dbIt('BR-10: the farmer counters the quality counter-offer: round 2 opens as a FARMER offer on the same listing, which stays COUNTER_OFFERED', async (w) => {
    const lot = await w.lot();
    const offer = await w.goodsReceipts.createQualityCounterOffer(w.admin, w.mainScope, lot.goodsReceiptId, OFFER_BODY);
    const farmer = w.farmer(lot);
    const counter = await w.counterOffers.respondCounter(
      farmer.actor,
      farmer.scope,
      lot.listingId,
      offer.id,
      { pricePerKg: '48.00', quantityKg: '100.000' },
      newId(),
    );
    expect(counter).toMatchObject({ round: 2, offeredBy: 'FARMER', status: 'PENDING', listingId: lot.listingId });
    expect((await offersOf(w.tx, lot.listingId)).map((o) => [o.round, o.actor, o.status])).toEqual([
      [1, 'ADMIN', 'COUNTERED'],
      [2, 'FARMER', 'PENDING'],
    ]);
    expect((await listingState(w.tx, lot.listingId)).status).toBe('COUNTER_OFFERED');
  });

  dbIt('BR-10b: the expiry sweep lapses an unanswered quality counter-offer and returns the listing to ACCEPTED, not PENDING_APPROVAL', async (w) => {
    const lot = await w.lot();
    const offer = await w.goodsReceipts.createQualityCounterOffer(w.admin, w.mainScope, lot.goodsReceiptId, OFFER_BODY);
    await w.tx.query(
      `UPDATE counter_offers SET created_at = now() - interval '2 days', expires_at = now() - interval '1 day' WHERE id = $1`,
      [offer.id],
    );
    const result = await w.counterOffers.sweepExpiredOffers();
    expect(result.offersLapsed).toBeGreaterThanOrEqual(1);
    const [row] = await offersOf(w.tx, lot.listingId);
    expect(row).toMatchObject({ id: offer.id, status: 'LAPSED', responded_at: null, responded_by: null });
    expect(await listingState(w.tx, lot.listingId)).toMatchObject({ status: 'ACCEPTED', finalPricePerKg: '50.00' });
  });

  dbIt('BR-10: a negotiation on a listing with no purchase order still returns to PENDING_APPROVAL on a farmer reject and on expiry', async (w) => {
    const lot = await w.lot({ listing: 'PENDING_APPROVAL_NO_PO' });
    const farmer = w.farmer(lot);
    const first = await w.counterOffers.sendCounterOffer(w.admin, w.listingAdminScope, lot.listingId, {
      pricePerKg: '45.00',
      quantityKg: '100.000',
    });
    await w.counterOffers.respondReject(farmer.actor, farmer.scope, lot.listingId, first.id, null, newId());
    expect((await listingState(w.tx, lot.listingId)).status).toBe('PENDING_APPROVAL');

    const second = await w.counterOffers.sendCounterOffer(w.admin, w.listingAdminScope, lot.listingId, {
      pricePerKg: '46.00',
      quantityKg: '100.000',
    });
    await w.tx.query(
      `UPDATE counter_offers SET created_at = now() - interval '2 days', expires_at = now() - interval '1 day' WHERE id = $1`,
      [second.id],
    );
    await w.counterOffers.sweepExpiredOffers();
    expect((await offersOf(w.tx, lot.listingId)).map((o) => [o.round, o.status])).toEqual([
      [1, 'REJECTED'],
      [2, 'LAPSED'],
    ]);
    expect((await listingState(w.tx, lot.listingId)).status).toBe('PENDING_APPROVAL');
  });

  dbIt('BR-10: the listing module still reads counter_offers with the new column: the admin queue and the farmer listing show the quality counter-offer as the active offer', async (w) => {
    const lot = await w.lot();
    const offer = await w.goodsReceipts.createQualityCounterOffer(w.admin, w.mainScope, lot.goodsReceiptId, OFFER_BODY);

    const queue = await counterOffersRepo.listAdminQueue(w.tx, { status: 'COUNTER_OFFERED', limit: 100 });
    const queued = queue.items.find((item) => (item as { id: string }).id === lot.listingId) as
      | { activeCounterOffer: { id: string; round: number; offeredBy: string } | null }
      | undefined;
    expect(queued?.activeCounterOffer).toMatchObject({ id: offer.id, round: 1, offeredBy: 'ADMIN' });

    const { listingsRepo } = await import('../listings/listings.repo.js');
    const mine = await listingsRepo.listFarmerListings(w.tx, lot.farmerId, { limit: 10 });
    expect(mine.items.map((item) => [item.id, item.status, item.activeCounterOffer?.id])).toEqual([
      [lot.listingId, 'COUNTER_OFFERED', offer.id],
    ]);

    expect(await counterOffersRepo.findOfferById(w.tx, lot.listingId, offer.id)).toMatchObject({
      id: offer.id,
      actor: 'ADMIN',
      round: 1,
      status: 'PENDING',
    });
  });
});

// ===========================================================================
// 2. The real app router over HTTP (committed rows, removed afterwards)
// ===========================================================================
describeIfDatabase('quality counter-offer over HTTP (real app router, PostgreSQL)', () => {
  let ready = false;
  const httpIt = (name: string, fn: () => Promise<void>): void => {
    it(name, async (ctx) => {
      if (!ready) return ctx.skip();
      await fn();
    });
  };
  let server: Server;
  let db: Executor;
  const tokens: Record<string, string> = {};
  const listingIds: string[] = [];
  const TAG = `H3H${Date.now().toString(36)}`;

  const newLot = async (): Promise<Lot> => {
    const lot = await insertLot(db, {
      listing: 'ACCEPTED_WITH_RECEIPT',
      warehouseId: await warehouseIdByCode(db, 'WH-OOTY'),
      issuedBy: IDS.userSuperAdmin,
      tag: TAG,
    });
    listingIds.push(lot.listingId);
    return lot;
  };

  beforeAll(async () => {
    ready = await dbReady();
    if (!ready) return;
    const [{ createApp }, { signAccessToken }, { pool }] = await Promise.all([
      import('../../app.js'),
      import('../../auth/jwt.js'),
      import('../../db/pool.js'),
    ]);
    db = pool;
    await ensureStandardUsers(pool, 'userSuperAdmin');
    server = createApp().listen(0);
    const base = { farmerId: null, customerId: null };
    tokens['main'] = signAccessToken({ sub: IDS.userSuperAdmin, roles: [{ code: RoleCode.MAIN_WH_ADMIN }], ...base });
    tokens['subCoonoor'] = signAccessToken({
      sub: IDS.userSuperAdmin,
      roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: await warehouseIdByCode(pool, 'WH-COON') }],
      ...base,
    });
    tokens['customer'] = signAccessToken({ sub: IDS.userSuperAdmin, roles: [{ code: RoleCode.CUSTOMER }], farmerId: null, customerId: newId() });
    tokens['farmerOther'] = signAccessToken({ sub: IDS.userSuperAdmin, roles: [{ code: RoleCode.FARMER }], farmerId: newId(), customerId: null });
  });

  afterAll(async () => {
    if (!ready) return;
    // Only the rows this suite created; audit_log is append-only and stays.
    await db.query(`DELETE FROM counter_offers WHERE listing_id = ANY($1::uuid[])`, [listingIds]);
    await db.query(
      `DELETE FROM goods_receipts WHERE purchase_order_id IN (SELECT id FROM purchase_orders WHERE listing_id = ANY($1::uuid[]))`,
      [listingIds],
    );
    await db.query(`DELETE FROM purchase_orders WHERE listing_id = ANY($1::uuid[])`, [listingIds]);
    await db.query(`DELETE FROM produce_listings WHERE id = ANY($1::uuid[])`, [listingIds]);
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  const url = (goodsReceiptId: string): string => `/v1/admin/goods-receipts/${goodsReceiptId}/counter-offer`;

  httpIt('BR-10: POST is 201 with exactly the documented CounterOffer body, a repeat while it is pending is 409 problem+json, and the farmer accepts it over HTTP', async () => {
    const lot = await newLot();
    const { signAccessToken } = await import('../../auth/jwt.js');
    const farmerToken = signAccessToken({
      sub: lot.farmerUserId,
      roles: [{ code: RoleCode.FARMER }],
      farmerId: lot.farmerId,
      customerId: null,
    });

    const created = await request(server).post(url(lot.goodsReceiptId)).set('Authorization', `Bearer ${tokens['main']!}`).send(OFFER_BODY);
    expect(created.status, JSON.stringify(created.body)).toBe(201);
    expect(created.headers['content-type']).toMatch(/^application\/json/);
    const offer = documentedCounterOffer.parse(created.body);
    expect(offer).toMatchObject({
      listingId: lot.listingId,
      goodsReceiptId: lot.goodsReceiptId,
      round: 1,
      offeredBy: 'ADMIN',
      offeredByUserId: IDS.userSuperAdmin,
      pricePerKg: '45.00',
      quantityKg: '100.000',
      status: 'PENDING',
      respondedAt: null,
    });

    const repeat = await request(server).post(url(lot.goodsReceiptId)).set('Authorization', `Bearer ${tokens['main']!}`).send(OFFER_BODY);
    expect(repeat.status).toBe(409);
    expect(repeat.headers['content-type']).toMatch(/^application\/problem\+json/);
    expect(repeat.body.code).toBe('CONFLICT');
    expect(await offersOf(db, lot.listingId)).toHaveLength(1);

    const accepted = await request(server)
      .post(`/v1/listings/${lot.listingId}/counter-offers/${offer.id}/accept`)
      .set('Authorization', `Bearer ${farmerToken}`)
      .set('Idempotency-Key', newId())
      .send({});
    expect(accepted.status, JSON.stringify(accepted.body)).toBe(200);
    expect(accepted.body).toMatchObject({ id: lot.listingId, status: 'ACCEPTED', finalPricePerKg: '45.00', finalQuantityKg: '100.000' });
    expect((await offersOf(db, lot.listingId)).map((o) => [o.id, o.status])).toEqual([[offer.id, 'ACCEPTED']]);
  });

  httpIt('BR-10: no token is 401, FARMER and CUSTOMER are 403, an unknown receipt or another warehouse\'s receipt is 404 and a malformed price or quantity is 422, all problem+json and nothing written', async () => {
    const lot = await newLot();
    const anonymous = await request(server).post(url(lot.goodsReceiptId)).send(OFFER_BODY);
    expect(anonymous.status).toBe(401);
    expect(anonymous.headers['content-type']).toMatch(/^application\/problem\+json/);
    for (const role of ['farmerOther', 'customer']) {
      const denied = await request(server).post(url(lot.goodsReceiptId)).set('Authorization', `Bearer ${tokens[role]!}`).send(OFFER_BODY);
      expect(denied.status, role).toBe(403);
      expect(denied.headers['content-type']).toMatch(/^application\/problem\+json/);
    }
    const unknown = await request(server).post(url(newId())).set('Authorization', `Bearer ${tokens['main']!}`).send(OFFER_BODY);
    expect(unknown.status).toBe(404);
    expect(unknown.body.code).toBe('NOT_FOUND');
    // An Ooty receipt seen by the Coonoor Sub Warehouse Admin: the same 404, never a 403 (BR-30b).
    const foreign = await request(server).post(url(lot.goodsReceiptId)).set('Authorization', `Bearer ${tokens['subCoonoor']!}`).send(OFFER_BODY);
    expect(foreign.status).toBe(404);
    expect(foreign.body.code).toBe('NOT_FOUND');
    // docs/openapi.yaml CounterOfferCreate: Money has at most 2 decimals, Quantity at most 3, no exponent.
    for (const bad of [
      { pricePerKg: '45.123' },
      { pricePerKg: '1e3' },
      { pricePerKg: '0.00' },
      { pricePerKg: '-45.00' },
      { quantityKg: '100.0001' },
      { quantityKg: '0' },
      { expiresAt: '2030-01-01T00:00:00Z' },
    ]) {
      const invalid = await request(server)
        .post(url(lot.goodsReceiptId))
        .set('Authorization', `Bearer ${tokens['main']!}`)
        .send({ ...OFFER_BODY, ...bad });
      expect(invalid.status, JSON.stringify(bad)).toBe(422);
      expect(invalid.headers['content-type']).toMatch(/^application\/problem\+json/);
    }
    expect(await offersOf(db, lot.listingId)).toHaveLength(0);
    expect(await listingState(db, lot.listingId)).toMatchObject({ status: 'ACCEPTED', version: 2 });
  });

  httpIt('BR-11: over HTTP a listing with no rounds left is 409 COUNTER_LIMIT_REACHED problem+json', async () => {
    const lot = await newLot();
    for (const round of [1, 2, 3, 4]) await insertClosedRound(db, lot.listingId, round, round % 2 === 1 ? IDS.userSuperAdmin : lot.farmerUserId);
    const res = await request(server).post(url(lot.goodsReceiptId)).set('Authorization', `Bearer ${tokens['main']!}`).send(OFFER_BODY);
    expect(res.status).toBe(409);
    expect(res.headers['content-type']).toMatch(/^application\/problem\+json/);
    expect(res.body.code).toBe('COUNTER_LIMIT_REACHED');
    expect(await offersOf(db, lot.listingId)).toHaveLength(4);
  });
});

afterAll(async () => {
  if (!hasDatabase) return;
  const [{ closePool }, { closeRedis }] = await Promise.all([import('../../db/pool.js'), import('../../redis.js')]);
  await Promise.allSettled([closePool(), closeRedis()]);
});
