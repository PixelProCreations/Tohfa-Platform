/**
 * GET /v1/admin/orders/{orderId} — the general admin order detail (any channel).
 *
 * BR-99 = one read for every channel (ONLINE, DIRECT, MARKET, HORECA, B2B), confined to the
 *         caller's warehouse scope (cross-warehouse == unknown == 404, never 403, BR-30), built by
 *         an allow-list serializer: no farm identity at any depth (BR-16, BR-90), no handover OTP or
 *         its hash (BR-20), masked buyer mobile (BR-92), Money strings exact to the paisa, and no
 *         audit row because it is a read (BR-35 covers mutations).
 *
 * Three layers, as in sales-read.test.ts:
 *   1. service tests against a fake repo (no database),
 *   2. `describeIfDatabase` repo + service tests inside a rolled-back transaction,
 *   3. real HTTP through a local express app mounting `adminFulfilmentRouter` at /v1/admin/orders.
 *      The handler reads through the shared pool, so these fixture rows are COMMITTED and stay:
 *      an order cannot be deleted (its FK cascade into the append-only order_status_history trips
 *      that table's statement-level trigger, BR-35). They use unique `OD-HTTP-*` numbers.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { Server } from 'node:http';
import { RoleCode, ScopeLevel, type Money } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { aScope, databaseReady, describeIfDatabase, newId } from '../../test/factories.js';
import type { AdminOrderDetailRecord, FulfilmentRepo } from './fulfilment.repo.js';
import { adminOrderDetailResponse } from './fulfilment.schema.js';
import { createFulfilmentService } from './fulfilment.service.js';

const WH_A = '10000000-0000-4000-8000-0000000000a1';
const ORDER_ID = '20000000-0000-4000-8000-000000000001';
const CROP = '30000000-0000-4000-8000-000000000001';
const CUSTOMER_ID = '40000000-0000-4000-8000-000000000001';
const INVOICE_ID = '50000000-0000-4000-8000-000000000001';
const USER = '00000000-0000-4000-8000-0000000000a1';

const m = (value: string): Money => value as Money;

const PERMISSION = 'order.list.view_all';
const subScope = (warehouseIds: string[] = [WH_A]): ResolvedScope =>
  aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds, permission: PERMISSION, userId: USER });
const mainAll = (): ResolvedScope =>
  aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.MAIN_WH_ADMIN, permission: PERMISSION, userId: USER });

/** Any key that could carry a farm identity (BR-16, BR-90), matched case-insensitively. */
const FARM_IDENTITY_KEY = /farm|village|gps|fmb|latitude|longitude|^lat$|^lng$|batch|source|allocation|plot/i;
/** Any key that could carry the handover secret (BR-20). */
const OTP_SECRET_KEY = /otp(?!Required|VerifiedAt)|hash|attempt/i;

function keysMatching(pattern: RegExp, value: unknown, path = '$'): string[] {
  if (Array.isArray(value)) return value.flatMap((item, i) => keysMatching(pattern, item, `${path}[${i}]`));
  if (value !== null && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => [
      ...(pattern.test(key) ? [`${path}.${key}`] : []),
      ...keysMatching(pattern, child, `${path}.${key}`),
    ]);
  }
  return [];
}

/** Every run of five consecutive digits of a stored mobile found anywhere in the JSON (BR-92a). */
function mobileFragments(value: unknown, mobiles: string[]): string[] {
  const json = JSON.stringify(value);
  return mobiles.flatMap((mobile) => {
    const digits = mobile.replace(/[^0-9]/g, '');
    const windows = Array.from({ length: Math.max(digits.length - 4, 0) }, (_, i) => digits.slice(i, i + 5));
    return windows.filter((w) => json.includes(w));
  });
}

const DOCUMENTED_KEYS = [
  'buyer', 'cancelledAt', 'channel', 'completedAt', 'fulfilment', 'fulfilmentType', 'id', 'invoice', 'items',
  'orderNumber', 'packedAt', 'paymentMethod', 'paymentStatus', 'placedAt', 'status', 'timeline', 'totals', 'warehouse',
].sort();

function aRecord(overrides: Partial<AdminOrderDetailRecord> = {}): AdminOrderDetailRecord {
  return {
    id: ORDER_ID,
    orderNumber: 'TOH-2031-000001',
    channel: 'ONLINE',
    status: 'DELIVERED',
    fulfilmentType: 'DELIVERY',
    paymentMethod: 'WALLET',
    paymentStatus: 'PAID',
    warehouseId: WH_A,
    warehouseName: 'Coonoor Warehouse',
    customerId: CUSTOMER_ID,
    customerCode: 'CUST-000001',
    customerName: 'Registered Buyer',
    customerMobile: '+919812345678',
    walkInName: null,
    walkInMobile: null,
    subtotal: m('950.50'),
    deliveryFee: m('0.10'),
    discount: m('0.20'),
    gstAmount: m('47.53'),
    totalAmount: m('997.93'),
    deliveryDate: '2031-05-10',
    deliverySlot: 'MORNING_8_12',
    otpRequired: false,
    otpVerifiedAt: '2031-05-10T07:00:00.000Z',
    invoice: { id: INVOICE_ID, invoiceNumber: 'INV-2031-0001', status: 'ISSUED' },
    placedAt: '2031-05-10T04:00:00.000Z',
    packedAt: '2031-05-10T05:00:00.000Z',
    completedAt: '2031-05-10T07:00:00.000Z',
    cancelledAt: null,
    items: [
      {
        productId: CROP,
        name: 'Carrot',
        grade: 'GRADE_1',
        qtyKg: '0.125',
        unitPrice: m('0.80'),
        gstRate: '5.00',
        gstAmount: m('0.01'),
        lineTotal: m('0.10'),
      },
    ],
    timeline: [
      { fromStatus: null, toStatus: 'CONFIRMED', at: '2031-05-10T04:00:00.000Z' },
      { fromStatus: 'CONFIRMED', toStatus: 'DELIVERED', at: '2031-05-10T07:00:00.000Z' },
    ],
    ...overrides,
  };
}

function fakeRepo(record: AdminOrderDetailRecord | null): FulfilmentRepo {
  return { findAdminOrderDetail: vi.fn(async () => record) } as unknown as FulfilmentRepo;
}

// ===========================================================================
// 1. Service against a fake repo
// ===========================================================================
describe('admin order detail service (fake repo)', () => {
  it('BR-99a: an unknown or out-of-scope order is 404 NOT_FOUND, and the scope is handed to the repo', async () => {
    const repo = fakeRepo(null);
    const service = createFulfilmentService({ repo, db: {} as Executor });
    const scope = subScope();
    const error = await service.getAdminOrderDetail(scope, ORDER_ID).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({ code: 'NOT_FOUND', status: 404 });
    expect(vi.mocked(repo.findAdminOrderDetail).mock.calls[0]?.[1]).toBe(scope);
    expect(vi.mocked(repo.findAdminOrderDetail).mock.calls[0]?.[2]).toBe(ORDER_ID);
  });

  it('BR-99b: the response is an allow-list — keys equal the documented set even when the record carries farm, batch and OTP fields', async () => {
    const leaky = {
      ...aRecord(),
      farmerId: newId(),
      sourceFarmerId: newId(),
      farmName: 'Leaky Farm',
      deliveryOtpHash: 'deadbeef',
      otpAttempts: 2,
      items: [{ ...aRecord().items[0]!, batchId: newId(), sourceFarmerId: newId(), farmId: newId() }],
      timeline: [{ fromStatus: null, toStatus: 'CONFIRMED', at: '2031-05-10T04:00:00.000Z', note: 'from Leaky Farm', changedBy: USER }],
    } as unknown as AdminOrderDetailRecord;
    const service = createFulfilmentService({ repo: fakeRepo(leaky), db: {} as Executor });
    const result = await service.getAdminOrderDetail(mainAll(), ORDER_ID);
    expect(Object.keys(result).sort()).toEqual(DOCUMENTED_KEYS);
    expect(adminOrderDetailResponse.parse(result)).toEqual(result);
    expect(keysMatching(FARM_IDENTITY_KEY, result)).toEqual([]);
    expect(keysMatching(OTP_SECRET_KEY, result)).toEqual([]);
    const json = JSON.stringify(result);
    expect(json).not.toContain('Leaky Farm');
    expect(json).not.toContain('deadbeef');
    expect(result.timeline[0]).toEqual({ fromStatus: null, toStatus: 'CONFIRMED', at: '2031-05-10T04:00:00.000Z' });
  });

  it('BR-99i: a counter sale cancelled with its captured UPI payment REFUND_DUE (BR-94i) is serialized, not a 500', async () => {
    const service = createFulfilmentService({ repo: fakeRepo(aRecord({ status: 'CANCELLED', paymentStatus: 'REFUND_DUE' })), db: {} as Executor });
    const detail = await service.getAdminOrderDetail(subScope(), ORDER_ID);
    expect(detail.paymentStatus).toBe('REFUND_DUE');
    expect(adminOrderDetailResponse.parse(detail)).toEqual(detail);
  });

  it('BR-99b: the strict response schema rejects an unknown key at any depth', () => {
    const ok = {
      id: ORDER_ID,
      orderNumber: 'X',
      channel: 'ONLINE',
      status: 'CONFIRMED',
      fulfilmentType: 'PICKUP',
      paymentMethod: 'WALLET',
      paymentStatus: 'PAID',
      warehouse: { id: WH_A, name: 'W' },
      buyer: { kind: 'CUSTOMER', customerId: CUSTOMER_ID, customerCode: 'C', name: 'N', mobileMasked: '****5678' },
      items: [],
      totals: { subtotal: '0.00', deliveryFee: '0.00', discount: '0.00', gst: '0.00', total: '0.00' },
      invoice: null,
      fulfilment: { deliveryDate: null, deliverySlot: null, otpRequired: false, otpVerifiedAt: null },
      timeline: [],
      placedAt: '2031-05-10T04:00:00.000Z',
      packedAt: null,
      completedAt: null,
      cancelledAt: null,
    };
    expect(adminOrderDetailResponse.safeParse(ok).success).toBe(true);
    expect(adminOrderDetailResponse.safeParse({ ...ok, farmerId: newId() }).success).toBe(false);
    expect(adminOrderDetailResponse.safeParse({ ...ok, warehouse: { ...ok.warehouse, lat: 11.3 } }).success).toBe(false);
    expect(adminOrderDetailResponse.safeParse({ ...ok, fulfilment: { ...ok.fulfilment, otp: '1234' } }).success).toBe(false);
  });

  it('BR-99c: the customer mobile and a walk-in mobile are masked to the last four digits, for every scope', async () => {
    for (const scope of [subScope(), mainAll()]) {
      const customer = await createFulfilmentService({ repo: fakeRepo(aRecord()), db: {} as Executor }).getAdminOrderDetail(scope, ORDER_ID);
      expect(customer.buyer).toEqual({
        kind: 'CUSTOMER',
        customerId: CUSTOMER_ID,
        customerCode: 'CUST-000001',
        name: 'Registered Buyer',
        mobileMasked: '*********5678',
      });

      const walkIn = await createFulfilmentService({
        repo: fakeRepo(aRecord({
          channel: 'DIRECT', customerId: null, customerCode: null, customerName: null, customerMobile: null,
          walkInName: 'Counter Walk-in', walkInMobile: '+919876543210',
        })),
        db: {} as Executor,
      }).getAdminOrderDetail(scope, ORDER_ID);
      expect(walkIn.buyer).toEqual({
        kind: 'WALK_IN', customerId: null, customerCode: null, name: 'Counter Walk-in', mobileMasked: '*********3210',
      });
      expect(mobileFragments([customer, walkIn], ['+919812345678', '+919876543210'])).toEqual([]);
    }

    const shortAndMissing = await createFulfilmentService({
      repo: fakeRepo(aRecord({ customerId: null, customerCode: null, customerName: null, customerMobile: null, walkInName: 'Anon', walkInMobile: null })),
      db: {} as Executor,
    }).getAdminOrderDetail(subScope(), ORDER_ID);
    expect(shortAndMissing.buyer.mobileMasked).toBeNull();
  });

  it('BR-99d: money is passed through as exact Money strings, never re-computed through a float', async () => {
    const result = await createFulfilmentService({ repo: fakeRepo(aRecord()), db: {} as Executor }).getAdminOrderDetail(mainAll(), ORDER_ID);
    expect(result.totals).toEqual({ subtotal: '950.50', deliveryFee: '0.10', discount: '0.20', gst: '47.53', total: '997.93' });
    expect(result.items[0]).toEqual({
      productId: CROP, name: 'Carrot', grade: 'GRADE_1', qtyKg: '0.125', unitPrice: '0.80', gstRate: '5.00', gstAmount: '0.01', lineTotal: '0.10',
    });
    for (const value of [...Object.values(result.totals), result.items[0]!.unitPrice, result.items[0]!.lineTotal]) {
      expect(typeof value).toBe('string');
    }
  });

  it('BR-99e: the read writes nothing — the service touches only findAdminOrderDetail on the repo', async () => {
    const repo = fakeRepo(aRecord());
    const query = vi.fn();
    await createFulfilmentService({ repo, db: { query } as unknown as Executor }).getAdminOrderDetail(mainAll(), ORDER_ID);
    expect(query).not.toHaveBeenCalled();
    expect(vi.mocked(repo.findAdminOrderDetail)).toHaveBeenCalledTimes(1);
  });
});

describe('admin fulfilment routes (wiring)', () => {
  it('BR-99f: GET /:orderId is declared with order.list.view_all and does not shadow the POST action routes', async () => {
    const { adminFulfilmentRouter } = await import('./fulfilment.routes.js');
    const routes = (adminFulfilmentRouter.stack as unknown as Array<{ route?: { path: string; methods: Record<string, boolean> } }>)
      .filter((layer) => layer.route !== undefined)
      .map((layer) => ({ path: layer.route!.path, methods: Object.keys(layer.route!.methods) }));
    const detail = routes.filter((r) => r.path === '/:orderId');
    expect(detail.flatMap((r) => r.methods)).toEqual(['get']);
    for (const action of ['/:id/assign-warehouse', '/:id/pack', '/:id/dispatch', '/:id/verify-otp']) {
      expect(routes.find((r) => r.path === action)?.methods, action).toEqual(['post']);
    }
  });
});

// ===========================================================================
// 2. PostgreSQL: repo + service in a rolled-back transaction
// ===========================================================================
class RollbackFixture extends Error {}

describeIfDatabase('admin order detail repo + service (PostgreSQL)', () => {
  let ready = false;

  beforeAll(async () => {
    ready = (await databaseReady('orders')) && (await databaseReady('sale_payments'));
  });

  async function inRolledBackTx(fn: (tx: Executor) => Promise<void>): Promise<void> {
    const { withTransaction } = await import('../../db/pool.js');
    await withTransaction(async (tx) => {
      await fn(tx);
      throw new RollbackFixture();
    }).catch((error: unknown) => {
      if (!(error instanceof RollbackFixture)) throw error;
    });
  }

  interface Fixture {
    coonoor: string;
    gudalur: string;
    farmerName: string;
    batchCode: string;
    orders: Record<'online' | 'direct' | 'market' | 'horeca' | 'b2b' | 'otherWarehouse', string>;
  }

  async function seed(tx: Executor): Promise<Fixture> {
    const { createHash } = await import('node:crypto');
    const { insertCrop, insertFarmerWithPlot, insertUser } = await import('../../test/dbFixtures.js');
    const wh = await tx.query<{ id: string; code: string }>(`SELECT id, code FROM warehouses WHERE code IN ('WH-COON', 'WH-GUDA')`);
    const coonoor = wh.rows.find((w) => w.code === 'WH-COON')!.id;
    const gudalur = wh.rows.find((w) => w.code === 'WH-GUDA')!.id;

    const adminId = await insertUser(tx, 'ADMIN', 'CI detail admin');
    const customerUser = await insertUser(tx, 'CUSTOMER', 'Registered Buyer');
    const customer = await tx.query<{ id: string }>(
      `INSERT INTO customers (user_id, customer_code) VALUES ($1, $2) RETURNING id`,
      [customerUser, `CUST-OD-${newId().slice(0, 8)}`],
    );
    const customerId = customer.rows[0]!.id;
    const address = await tx.query<{ id: string }>(
      `INSERT INTO customer_addresses (customer_id, line1, city, pincode, lat, lng)
       VALUES ($1, '12 Secret Lane', 'Coonoor', '643101', 11.350000, 76.790000) RETURNING id`,
      [customerId],
    );

    const cropId = await insertCrop(tx);
    const farmer = await insertFarmerWithPlot(tx);
    const farmerName = (await tx.query<{ full_name: string }>(
      `SELECT u.full_name FROM farmers f JOIN users u ON u.id = f.user_id WHERE f.id = $1`,
      [farmer.farmerId],
    )).rows[0]!.full_name;
    const batchCode = `B-OD-${newId().slice(0, 8)}`;
    const batch = await tx.query<{ id: string }>(
      `INSERT INTO inventory_batches (batch_code, warehouse_id, crop_id, grade, source_farmer_id, qty_received, expiry_on)
       VALUES ($1, $2, $3, 'GRADE_1', $4, 10, '2031-06-01') RETURNING id`,
      [batchCode, coonoor, cropId, farmer.farmerId],
    );
    const batchId = batch.rows[0]!.id;

    async function order(o: {
      warehouseId: string;
      channel: string;
      customer?: boolean;
      walkIn?: { name: string; mobile: string | null };
      delivery?: boolean;
      otp?: string;
      method: string;
    }): Promise<string> {
      const result = await tx.query<{ id: string }>(
        `INSERT INTO orders (order_number, customer_id, walk_in_name, walk_in_mobile, warehouse_id, channel,
                             fulfilment_type, delivery_address_id, delivery_date, delivery_slot,
                             subtotal, delivery_fee, discount, gst_amount, total_amount,
                             payment_method, payment_status, status, delivery_otp_hash, otp_attempts,
                             placed_at, packed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7::fulfilment_type, $8, $9::date, $10::delivery_slot,
                 950.50, 0.10, 0.20, 47.53, 997.93,
                 $11::payment_method, 'PAID', 'PACKED', $12, 2,
                 '2031-05-10T04:00:00Z', '2031-05-10T05:00:00Z')
         RETURNING id`,
        [
          `OD-CI-${newId().slice(0, 13)}`,
          o.customer === true ? customerId : null,
          o.walkIn?.name ?? null,
          o.walkIn?.mobile ?? null,
          o.warehouseId,
          o.channel,
          o.delivery === true ? 'DELIVERY' : 'PICKUP',
          o.delivery === true ? address.rows[0]!.id : null,
          o.delivery === true ? '2031-05-11' : null,
          o.delivery === true ? 'MORNING_8_12' : null,
          o.method,
          o.otp === undefined ? null : createHash('sha256').update(o.otp).digest('hex'),
        ],
      );
      const id = result.rows[0]!.id;
      await tx.query(
        `INSERT INTO order_items (order_id, crop_id, grade, qty_kg, unit_price, gst_rate, gst_amount, line_total, batch_id)
         VALUES ($1, $2, 'GRADE_1', 0.125, 0.80, 5.00, 0.01, 0.10, $3)`,
        [id, cropId, batchId],
      );
      await tx.query(
        `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, note, created_at)
         VALUES ($1, NULL, 'CONFIRMED', $2, $3, '2031-05-10T04:00:00Z'),
                ($1, 'CONFIRMED', 'PACKED', $2, $4, '2031-05-10T05:00:00Z')`,
        [id, adminId, `sourced from ${farmerName}`, `batch ${batchCode}`],
      );
      return id;
    }

    const walkIn = { name: 'Counter Walk-in', mobile: '+919876543210' };
    const online = await order({ warehouseId: coonoor, channel: 'ONLINE', customer: true, delivery: true, otp: '4821', method: 'WALLET' });
    const direct = await order({ warehouseId: coonoor, channel: 'DIRECT', walkIn, method: 'CASH' });
    const market = await order({ warehouseId: coonoor, channel: 'MARKET', walkIn, method: 'UPI' });
    const horeca = await order({ warehouseId: coonoor, channel: 'HORECA', customer: true, method: 'UPI' });
    const b2b = await order({ warehouseId: coonoor, channel: 'B2B', customer: true, method: 'CARD' });
    const otherWarehouse = await order({ warehouseId: gudalur, channel: 'ONLINE', customer: true, method: 'WALLET' });

    await tx.query(
      `INSERT INTO invoices (invoice_number, invoice_type, order_id, customer_id, fiscal_year, status, total_amount)
       VALUES ($1, 'SALE_RETAIL', $2, $3, '2031-32', 'ISSUED', 997.93)`,
      [`INV-OD-${newId().slice(0, 12)}`, online, customerId],
    );
    return { coonoor, gudalur, farmerName, batchCode, orders: { online, direct, market, horeca, b2b, otherWarehouse } };
  }

  async function serviceOn(tx: Executor) {
    const { fulfilmentRepo } = await import('./fulfilment.repo.js');
    return createFulfilmentService({ repo: fulfilmentRepo, db: tx });
  }

  it('BR-99g (DB): every channel is returned for an in-scope warehouse, schema-valid and with no farm, batch or OTP data at any depth', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const service = await serviceOn(tx);
      const sub = subScope([f.coonoor]);
      const expected = { online: 'ONLINE', direct: 'DIRECT', market: 'MARKET', horeca: 'HORECA', b2b: 'B2B' } as const;
      for (const [key, channel] of Object.entries(expected)) {
        const detail = await service.getAdminOrderDetail(sub, f.orders[key as keyof typeof expected]);
        expect(detail.channel, key).toBe(channel);
        expect(adminOrderDetailResponse.parse(detail)).toEqual(detail);
        expect(Object.keys(detail).sort()).toEqual(DOCUMENTED_KEYS);
        expect(keysMatching(FARM_IDENTITY_KEY, detail), key).toEqual([]);
        expect(keysMatching(OTP_SECRET_KEY, detail), key).toEqual([]);
        const json = JSON.stringify(detail);
        expect(json, key).not.toContain(f.farmerName);
        expect(json, key).not.toContain(f.batchCode);
        expect(json, key).not.toContain('Fixture Farm');
        expect(json, key).not.toContain('Secret Lane');
        expect(json, key).not.toContain('76.79');
        expect(detail.warehouse).toEqual({ id: f.coonoor, name: 'Coonoor Warehouse' });
        expect(detail.timeline.map((t) => t.toStatus)).toEqual(['CONFIRMED', 'PACKED']);
      }
    });
  });

  it('BR-99i (DB): GET detail of a cancelled sale whose UPI payment is REFUND_DUE returns it with that payment status', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      await tx.query(
        `UPDATE orders SET status = 'CANCELLED', payment_status = 'REFUND_DUE', cancelled_at = now(), cancellation_reason = 'Stock unavailable at confirmation' WHERE id = $1`,
        [f.orders.market],
      );
      const service = await serviceOn(tx);
      const detail = await service.getAdminOrderDetail(subScope([f.coonoor]), f.orders.market);
      expect(detail).toMatchObject({ status: 'CANCELLED', paymentStatus: 'REFUND_DUE' });
      expect(adminOrderDetailResponse.parse(detail)).toEqual(detail);
    });
  });

  it('BR-99a (DB): an order at another warehouse is null for a Sub admin, exactly like an unknown id; scope all sees it', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const service = await serviceOn(tx);
      const sub = subScope([f.coonoor]);
      const cross = await service.getAdminOrderDetail(sub, f.orders.otherWarehouse).catch((e: unknown) => e);
      const unknownId = newId();
      const unknown = await service.getAdminOrderDetail(sub, unknownId).catch((e: unknown) => e);
      expect(cross).toMatchObject({ code: 'NOT_FOUND', status: 404 });
      expect(unknown).toMatchObject({ code: 'NOT_FOUND', status: 404 });
      expect((cross as AppError).message.replace(f.orders.otherWarehouse, '<id>')).toBe(
        (unknown as AppError).message.replace(unknownId, '<id>'),
      );
      const main = await service.getAdminOrderDetail(mainAll(), f.orders.otherWarehouse);
      expect(main.warehouse.id).toBe(f.gudalur);
      // MAIN_WH_ADMIN at `own` with no warehouse also sees all four (owner, 2026-10-11).
      const mainOwn = aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.MAIN_WH_ADMIN, warehouseIds: [], permission: PERMISSION });
      expect((await service.getAdminOrderDetail(mainOwn, f.orders.otherWarehouse)).id).toBe(f.orders.otherWarehouse);
      // A customer-owned scope on this admin route fails closed.
      const customerOwn = aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.CUSTOMER, permission: PERMISSION, customerId: newId() });
      await expect(service.getAdminOrderDetail(customerOwn, f.orders.online)).rejects.toMatchObject({ status: 404 });
    });
  });

  it('BR-99c / BR-99d / BR-99h (DB): masked mobiles, exact money, invoice ref, handover flag without the OTP', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const service = await serviceOn(tx);
      const online = await service.getAdminOrderDetail(mainAll(), f.orders.online);
      const direct = await service.getAdminOrderDetail(mainAll(), f.orders.direct);

      expect(direct.buyer).toEqual({ kind: 'WALK_IN', customerId: null, customerCode: null, name: 'Counter Walk-in', mobileMasked: '*********3210' });
      expect(online.buyer.kind).toBe('CUSTOMER');
      expect(online.buyer.mobileMasked).toMatch(/^\*+[0-9]{4}$/);
      const storedMobiles = (await tx.query<{ mobile: string }>(
        `SELECT u.mobile FROM orders o JOIN customers c ON c.id = o.customer_id JOIN users u ON u.id = c.user_id WHERE o.id = $1`,
        [f.orders.online],
      )).rows.map((r) => r.mobile);
      expect(mobileFragments([online, direct], [...storedMobiles, '+919876543210'])).toEqual([]);

      expect(online.totals).toEqual({ subtotal: '950.50', deliveryFee: '0.10', discount: '0.20', gst: '47.53', total: '997.93' });
      expect(online.items).toEqual([
        { productId: expect.any(String), name: 'Fixture Crop', grade: 'GRADE_1', qtyKg: '0.125', unitPrice: '0.80', gstRate: '5.00', gstAmount: '0.01', lineTotal: '0.10' },
      ]);

      expect(online.invoice).toMatchObject({ id: expect.any(String), invoiceNumber: expect.stringMatching(/^INV-OD-/), status: 'ISSUED' });
      expect(direct.invoice).toBeNull();

      expect(online.fulfilment).toEqual({ deliveryDate: '2031-05-11', deliverySlot: 'MORNING_8_12', otpRequired: true, otpVerifiedAt: null });
      expect(direct.fulfilment.otpRequired).toBe(false);
      expect(JSON.stringify(online)).not.toContain('4821');
      expect(online.placedAt).toBe('2031-05-10T04:00:00.000Z');
      expect(online.packedAt).toBe('2031-05-10T05:00:00.000Z');
    });
  });

  it('BR-99e (DB): reading a detail writes no audit_log row', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const service = await serviceOn(tx);
      const before = (await tx.query<{ n: number }>(`SELECT count(*)::int AS n FROM audit_log`)).rows[0]!.n;
      await service.getAdminOrderDetail(mainAll(), f.orders.online);
      const after = (await tx.query<{ n: number }>(`SELECT count(*)::int AS n FROM audit_log`)).rows[0]!.n;
      expect(after).toBe(before);
    });
  });
});

// ===========================================================================
// 3. Real HTTP through a local express app mounting the router at /v1/admin/orders
// ===========================================================================
describeIfDatabase('admin order detail route (HTTP, PostgreSQL)', () => {
  let ready = false;
  let server: Server;
  const tokens: Record<string, string> = {};
  const seededUserId = '00000000-0000-0000-0000-000000000001';
  let coonoorOrder = '';
  let gudalurOrder = '';
  // Committed rows of this block, removed in afterAll so no order of ours stays at the seeded
  // WH-COON / WH-GUDA for later files (src/test/committedFixtureCleanup.ts).
  const created = { users: [] as string[], customers: [] as string[], crops: [] as string[], orders: [] as string[] };

  beforeAll(async () => {
    ready = await databaseReady('sale_payments');
    if (!ready) return;
    const [{ adminFulfilmentRouter }, { signAccessToken }, { pool }, { errorHandler, notFoundHandler }, fx] = await Promise.all([
      import('./fulfilment.routes.js'),
      import('../../auth/jwt.js'),
      import('../../db/pool.js'),
      import('../../http/errorHandler.js'),
      import('../../test/dbFixtures.js'),
    ]);
    const app = express();
    app.use(express.json());
    app.use('/v1/admin/orders', adminFulfilmentRouter);
    app.use(notFoundHandler);
    app.use(errorHandler);
    server = app.listen(0);

    const wh = await pool.query<{ id: string; code: string }>(`SELECT id, code FROM warehouses WHERE code IN ('WH-COON', 'WH-GUDA')`);
    const coonoor = wh.rows.find((w) => w.code === 'WH-COON')!.id;
    const gudalur = wh.rows.find((w) => w.code === 'WH-GUDA')!.id;

    // Committed fixture rows (the handler reads through the shared pool); see the file header.
    const userId = await fx.insertUser(pool, 'CUSTOMER', 'HTTP Detail Buyer');
    const customer = await pool.query<{ id: string }>(
      `INSERT INTO customers (user_id, customer_code) VALUES ($1, $2) RETURNING id`,
      [userId, `CUST-HD-${newId().slice(0, 8)}`],
    );
    const cropId = await fx.insertCrop(pool);
    created.users.push(userId);
    created.customers.push(customer.rows[0]!.id);
    created.crops.push(cropId);
    for (const warehouseId of [coonoor, gudalur]) {
      const o = await pool.query<{ id: string }>(
        `INSERT INTO orders (order_number, customer_id, warehouse_id, channel, subtotal, total_amount,
                             payment_method, payment_status, status)
         VALUES ($1, $2, $3, 'ONLINE', 1.10, 1.10, 'WALLET', 'PAID', 'CONFIRMED') RETURNING id`,
        [`OD-HTTP-${newId().slice(0, 12)}`, customer.rows[0]!.id, warehouseId],
      );
      const id = o.rows[0]!.id;
      created.orders.push(id);
      await pool.query(
        `INSERT INTO order_items (order_id, crop_id, grade, qty_kg, unit_price, line_total) VALUES ($1, $2, 'GRADE_2', 1.000, 1.10, 1.10)`,
        [id, cropId],
      );
      if (warehouseId === coonoor) coonoorOrder = id;
      else gudalurOrder = id;
    }

    const base = { farmerId: null, customerId: null };
    tokens['sub'] = signAccessToken({ sub: seededUserId, roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: coonoor }], ...base });
    tokens['main'] = signAccessToken({ sub: seededUserId, roles: [{ code: RoleCode.MAIN_WH_ADMIN }], ...base });
    tokens['tohfa'] = signAccessToken({ sub: seededUserId, roles: [{ code: RoleCode.TOHFA_ADMIN }], ...base });
    tokens['super'] = signAccessToken({ sub: seededUserId, roles: [{ code: RoleCode.SUPER_ADMIN }], ...base });
    tokens['farmer'] = signAccessToken({ sub: seededUserId, roles: [{ code: RoleCode.FARMER }], farmerId: newId(), customerId: null });
    tokens['farmerAdmin'] = signAccessToken({ sub: seededUserId, roles: [{ code: RoleCode.FARMER_ADMIN, zoneId: newId() }], ...base });
    tokens['customer'] = signAccessToken({ sub: seededUserId, roles: [{ code: RoleCode.CUSTOMER }], farmerId: null, customerId: customer.rows[0]!.id });
  });

  afterAll(async () => {
    if (!ready) return;
    const [{ closePool, withTransaction }, { closeRedis }, { removeCommittedFixtures }] = await Promise.all([
      import('../../db/pool.js'),
      import('../../redis.js'),
      import('../../test/committedFixtureCleanup.js'),
    ]);
    await new Promise<void>((resolve) => server.close(() => resolve()));
    try {
      await removeCommittedFixtures(withTransaction, {
        orderIds: created.orders,
        cropIds: created.crops,
        customerIds: created.customers,
        userIds: created.users,
      });
    } finally {
      await Promise.allSettled([closePool(), closeRedis()]);
    }
  });

  const auth = (name: string): string => `Bearer ${tokens[name]!}`;
  const path = (id: string): string => `/v1/admin/orders/${id}`;

  it('BR-99f (HTTP): 401 without a token, 403 for FARMER and FARMER_ADMIN, 200 for the four admin roles on an in-scope order', async () => {
    if (!ready) return;
    expect((await request(server).get(path(coonoorOrder))).status).toBe(401);
    for (const who of ['farmer', 'farmerAdmin']) {
      const res = await request(server).get(path(coonoorOrder)).set('Authorization', auth(who));
      expect(res.status, who).toBe(403);
      expect(res.headers['content-type']).toContain('application/problem+json');
    }
    for (const who of ['sub', 'main', 'tohfa', 'super']) {
      const res = await request(server).get(path(coonoorOrder)).set('Authorization', auth(who));
      expect(res.status, who).toBe(200);
      expect(adminOrderDetailResponse.parse(res.body)).toEqual(res.body);
      expect(res.body.totals.total).toBe('1.10');
    }
  });

  it('BR-99a (HTTP): another warehouse\'s order is 404 for a Sub admin with the same problem body as an unknown id, never 403', async () => {
    if (!ready) return;
    const cross = await request(server).get(path(gudalurOrder)).set('Authorization', auth('sub'));
    const unknownId = newId();
    const unknown = await request(server).get(path(unknownId)).set('Authorization', auth('sub'));
    expect(cross.status).toBe(404);
    expect(unknown.status).toBe(404);
    expect(cross.headers['content-type']).toContain('application/problem+json');
    const strip = (body: Record<string, unknown>, id: string) => {
      const { traceId: _t, correlationId: _c, instance: _i, ...rest } = body;
      return JSON.parse(JSON.stringify(rest).split(id).join('<id>')) as unknown;
    };
    expect(strip(cross.body as Record<string, unknown>, gudalurOrder)).toEqual(strip(unknown.body as Record<string, unknown>, unknownId));
    // Scope `all` sees it.
    expect((await request(server).get(path(gudalurOrder)).set('Authorization', auth('main'))).status).toBe(200);
  });

  // docs/rbac.json grants CUSTOMER `none` on order.list.view_all (customers read their own orders
  // through /orders, order.view_own), so requirePermission answers 403 before the handler. That
  // 403 is the same for every id, existing or not, so it reveals no row: CLAUDE.md §2.1's "empty,
  // not 403" governs a caller who HOLDS the permission reading outside its scope (BR-99a), not a
  // caller with no grant at all (FARMER and FARMER_ADMIN get the same 403 above). BR-101a.
  it('BR-99f (HTTP): a CUSTOMER (`none` on order.list.view_all) gets 403 on this admin route even for its own order, the same as for an unknown id; a malformed id is 422', async () => {
    if (!ready) return;
    const res = await request(server).get(path(coonoorOrder)).set('Authorization', auth('customer'));
    expect(res.status).toBe(403);
    expect(res.headers['content-type']).toContain('application/problem+json');
    const unknown = await request(server).get(path(newId())).set('Authorization', auth('customer'));
    expect(unknown.status).toBe(403);
    expect(unknown.body.code).toBe(res.body.code);
    const bad = await request(server).get(path('not-a-uuid')).set('Authorization', auth('super'));
    expect(bad.status).toBe(422);
  });
});
