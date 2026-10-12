/**
 * GET /v1/admin/orders (the admin order queue) and the admin order action routes, against a
 * CUSTOMER token and the warehouse roles.
 *
 * BR-101 = the admin order routes are confined by the RESOLVED scope, not by role names:
 *   - CUSTOMER holds `own` on `order.list.view_all` (that grant is its own-orders permission), so it
 *     passes requirePermission on the list. Its scope carries a customer id, and on these admin
 *     routes a customer-owned scope fails closed: an empty list, a 404 detail, never another
 *     customer's order. On the action routes it holds `none` and requirePermission answers 403.
 *   - A Sub Warehouse Admin sees only its warehouse; a `warehouseId` filter naming another
 *     warehouse is an EMPTY list, never 403 (BR-30: a 403 confirms the other warehouse's data).
 *   - scope `all` (MAIN_WH_ADMIN, TOHFA_ADMIN, SUPER_ADMIN) sees every warehouse; the filter narrows.
 *   - The list item is an allow-list: no farm identity and no buyer PII at any depth (BR-16).
 *
 * The HTTP layer mounts `adminFulfilmentRouter` on a local express app (as fulfilment.detail.test.ts
 * does). The handler reads through the shared pool, so the fixture rows are COMMITTED and removed in
 * afterAll. Each run gets a unique far-future delivery date so the list assertions never depend on
 * other rows in the database.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { Server } from 'node:http';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { aScope, databaseReady, describeIfDatabase, newId } from '../../test/factories.js';
import type { FulfilmentRepo } from './fulfilment.repo.js';
import { createFulfilmentService } from './fulfilment.service.js';

const PERMISSION = 'order.list.view_all';
const WH_A = '10000000-0000-4000-8000-0000000000a1';
const WH_B = '10000000-0000-4000-8000-0000000000b2';

/** Any key that could carry a farm identity (BR-16, BR-90) or buyer PII (BR-92). */
const FORBIDDEN_KEY = /farm|village|gps|fmb|latitude|longitude|^lat$|^lng$|batch|source|allocation|plot|mobile|phone|address|customer|walkIn|otp|hash/i;

const LIST_ITEM_KEYS = [
  'channel', 'deliveryDate', 'fulfillmentType', 'id', 'itemCount', 'orderNumber', 'paymentStatus', 'placedAt',
  'status', 'totalAmount', 'warehouseId',
].sort();

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

// ===========================================================================
// 1. Service against a fake repo: the scope, not the actor's role names, reaches the repo
// ===========================================================================
describe('admin order list service (fake repo)', () => {
  function fakeRepo(): FulfilmentRepo {
    return {
      listAdminOrders: vi.fn(async () => ({ items: [], nextCursor: null, hasMore: false })),
    } as unknown as FulfilmentRepo;
  }

  it('BR-101c: a Sub admin filtering by another warehouse is not a 403; the scope and the filter go to the repo, which returns empty', async () => {
    const repo = fakeRepo();
    const service = createFulfilmentService({ repo, db: {} as Executor });
    const sub: ResolvedScope = aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds: [WH_A], permission: PERMISSION });
    const query = { limit: 20, warehouseId: WH_B };
    await expect(service.listAdminOrders(sub, query)).resolves.toEqual({ items: [], page: { nextCursor: null, hasMore: false } });
    expect(vi.mocked(repo.listAdminOrders).mock.calls[0]?.[1]).toBe(sub);
    expect(vi.mocked(repo.listAdminOrders).mock.calls[0]?.[2]).toBe(query);
  });

  it('BR-101a: a customer-owned scope is handed to the repo as-is (the repo fails it closed), never widened to "no warehouse filter"', async () => {
    const repo = fakeRepo();
    const service = createFulfilmentService({ repo, db: {} as Executor });
    const customer: ResolvedScope = aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.CUSTOMER, permission: PERMISSION, customerId: newId() });
    await service.listAdminOrders(customer, { limit: 20 });
    expect(vi.mocked(repo.listAdminOrders).mock.calls[0]?.[1]).toBe(customer);
  });

  it('BR-101a: the action services fail closed (404, nothing written) for a customer-owned scope even if rbac.json ever granted it', async () => {
    const order = { id: newId(), status: 'CONFIRMED', fulfillmentType: 'PICKUP', warehouseId: WH_A };
    const repo = {
      findOrderForFulfilment: vi.fn(async () => order),
      getOrderDeliveryOtpHolder: vi.fn(async () => ({
        id: order.id, status: 'READY_FOR_PICKUP', fulfilmentType: 'PICKUP', deliveryOtpHash: 'x', otpAttempts: 0, customerId: newId(), warehouseId: WH_A,
      })),
      updateOrderStatus: vi.fn(),
      incrementOtpAttempts: vi.fn(),
    } as unknown as FulfilmentRepo;
    const service = createFulfilmentService({ repo, db: {} as Executor });
    const actor = { userId: newId(), roles: [{ code: RoleCode.CUSTOMER }], farmerId: null, customerId: newId() };
    const customer: ResolvedScope = aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.CUSTOMER, customerId: actor.customerId });
    for (const call of [
      () => service.assignWarehouse(actor, customer, order.id, { warehouseId: WH_B }),
      () => service.packOrder(actor, customer, order.id, {}),
      () => service.dispatchOrder(actor, customer, order.id, {}),
      () => service.verifyOtp(actor, customer, order.id, { otp: '1234' }),
    ]) {
      await expect(call()).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
    }
    expect(vi.mocked(repo.updateOrderStatus)).not.toHaveBeenCalled();
    expect(vi.mocked(repo.incrementOtpAttempts)).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// 2. Real HTTP through a local express app mounting the router at /v1/admin/orders
// ===========================================================================
describeIfDatabase('admin order list and actions (HTTP, PostgreSQL) — BR-101', () => {
  let ready = false;
  let server: Server;
  const tokens: Record<string, string> = {};
  const seededUserId = '00000000-0000-0000-0000-000000000001';
  let coonoor = '';
  let gudalur = '';
  let coonoorOrder = '';
  let gudalurOrder = '';
  let customerMobile = '';
  // A unique far-future delivery date per run isolates this file's rows in every list query.
  const day = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0');
  const month = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
  const deliveryDate = `20${90 + Math.floor(Math.random() * 9)}-${month}-${day}`;
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
    coonoor = wh.rows.find((w) => w.code === 'WH-COON')!.id;
    gudalur = wh.rows.find((w) => w.code === 'WH-GUDA')!.id;

    const userId = await fx.insertUser(pool, 'CUSTOMER', 'HTTP List Buyer');
    customerMobile = (await pool.query<{ mobile: string }>(`SELECT mobile FROM users WHERE id = $1`, [userId])).rows[0]!.mobile;
    const customer = await pool.query<{ id: string }>(
      `INSERT INTO customers (user_id, customer_code) VALUES ($1, $2) RETURNING id`,
      [userId, `CUST-HL-${newId().slice(0, 8)}`],
    );
    const cropId = await fx.insertCrop(pool);
    created.users.push(userId);
    created.customers.push(customer.rows[0]!.id);
    created.crops.push(cropId);
    for (const warehouseId of [coonoor, gudalur]) {
      const o = await pool.query<{ id: string }>(
        `INSERT INTO orders (order_number, customer_id, warehouse_id, channel, subtotal, total_amount,
                             payment_method, payment_status, status, delivery_date)
         VALUES ($1, $2, $3, 'ONLINE', 1.10, 1.10, 'WALLET', 'PAID', 'CONFIRMED', $4::date) RETURNING id`,
        [`OL-HTTP-${newId().slice(0, 12)}`, customer.rows[0]!.id, warehouseId, deliveryDate],
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
    // The customer who OWNS both fixture orders: even its own orders do not come back on admin routes.
    tokens['customer'] = signAccessToken({ sub: userId, roles: [{ code: RoleCode.CUSTOMER }], farmerId: null, customerId: customer.rows[0]!.id });
    // A different customer: must never see the first customer's orders.
    tokens['otherCustomer'] = signAccessToken({ sub: seededUserId, roles: [{ code: RoleCode.CUSTOMER }], farmerId: null, customerId: newId() });
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
  const list = (who: string, query: Record<string, string> = {}) =>
    request(server).get('/v1/admin/orders').query(query).set('Authorization', auth(who));
  const ids = (body: { items: Array<{ id: string }> }): string[] => body.items.map((item) => item.id);

  it('BR-101a (HTTP): a CUSTOMER token lists NO orders on GET /admin/orders — not all orders, not even its own — with or without filters', async () => {
    if (!ready) return;
    for (const who of ['customer', 'otherCustomer']) {
      for (const query of [{}, { limit: '100' }, { deliveryDate }, { warehouseId: coonoor }, { warehouseId: gudalur, deliveryDate }]) {
        const res = await list(who, query);
        expect(res.status, `${who} ${JSON.stringify(query)}`).toBe(200);
        expect(res.body.items, `${who} ${JSON.stringify(query)}`).toEqual([]);
        expect(res.body.page).toEqual({ nextCursor: null, hasMore: false });
      }
    }
  });

  it('BR-101a (HTTP): a CUSTOMER token gets no order data from any admin order route: detail 404, every action 403 (no grant), and nothing changes', async () => {
    if (!ready) return;
    const { pool } = await import('../../db/pool.js');
    const detail = await request(server).get(`/v1/admin/orders/${coonoorOrder}`).set('Authorization', auth('customer'));
    expect(detail.status).toBe(404);
    expect(detail.body.id).toBeUndefined();

    const actions: Array<[string, Record<string, unknown>]> = [
      ['assign-warehouse', { warehouseId: gudalur }],
      ['pack', {}],
      ['dispatch', {}],
      ['verify-otp', { otp: '1234' }],
    ];
    for (const [action, body] of actions) {
      const res = await request(server)
        .post(`/v1/admin/orders/${coonoorOrder}/${action}`)
        .set('Authorization', auth('customer'))
        .send(body);
      expect(res.status, action).toBe(403);
      expect(res.body.code, action).toBe('FORBIDDEN');
      expect(res.body.id, action).toBeUndefined();
    }
    const row = await pool.query<{ status: string; warehouse_id: string; otp_attempts: number }>(
      `SELECT status, warehouse_id, otp_attempts FROM orders WHERE id = $1`,
      [coonoorOrder],
    );
    expect(row.rows[0]).toEqual({ status: 'CONFIRMED', warehouse_id: coonoor, otp_attempts: 0 });
  });

  it('BR-101b (HTTP): 401 without a token; FARMER and FARMER_ADMIN get 403 on the list, as before', async () => {
    if (!ready) return;
    expect((await request(server).get('/v1/admin/orders')).status).toBe(401);
    for (const who of ['farmer', 'farmerAdmin']) {
      const res = await list(who, { deliveryDate });
      expect(res.status, who).toBe(403);
      expect(res.headers['content-type']).toContain('application/problem+json');
    }
  });

  it('BR-101c / BR-30 (HTTP): a Sub admin lists only its warehouse; a filter naming another warehouse is an empty 200, never 403', async () => {
    if (!ready) return;
    const own = await list('sub', { deliveryDate });
    expect(own.status).toBe(200);
    expect(ids(own.body)).toEqual([coonoorOrder]);

    const cross = await list('sub', { deliveryDate, warehouseId: gudalur });
    expect(cross.status).toBe(200);
    expect(cross.body).toEqual({ items: [], page: { nextCursor: null, hasMore: false } });

    // Same answer as a warehouse id that does not exist at all: nothing distinguishes the two.
    const unknown = await list('sub', { deliveryDate, warehouseId: newId() });
    expect(unknown.status).toBe(200);
    expect(unknown.body).toEqual(cross.body);

    const ownFilter = await list('sub', { deliveryDate, warehouseId: coonoor });
    expect(ids(ownFilter.body)).toEqual([coonoorOrder]);
  });

  it('BR-101d (HTTP): MAIN_WH_ADMIN, TOHFA_ADMIN and SUPER_ADMIN see every warehouse; the warehouseId filter narrows', async () => {
    if (!ready) return;
    for (const who of ['main', 'tohfa', 'super']) {
      const all = await list(who, { deliveryDate });
      expect(all.status, who).toBe(200);
      expect(ids(all.body).sort(), who).toEqual([coonoorOrder, gudalurOrder].sort());
      const narrowed = await list(who, { deliveryDate, warehouseId: gudalur });
      expect(ids(narrowed.body), who).toEqual([gudalurOrder]);
    }
  });

  it('BR-101e (HTTP): a list item is the documented allow-list — no farm identity and no buyer PII at any depth', async () => {
    if (!ready) return;
    const res = await list('super', { deliveryDate });
    expect(res.body.items.length).toBe(2);
    for (const item of res.body.items as Array<Record<string, unknown>>) {
      expect(Object.keys(item).sort()).toEqual(LIST_ITEM_KEYS);
    }
    expect(keysMatching(FORBIDDEN_KEY, res.body.items)).toEqual([]);
    expect(JSON.stringify(res.body)).not.toContain(customerMobile.slice(-6));
    expect(JSON.stringify(res.body)).not.toContain('HTTP List Buyer');
  });
});
