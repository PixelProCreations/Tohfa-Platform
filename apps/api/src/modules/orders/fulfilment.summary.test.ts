import { afterAll, beforeAll, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { pool } from '../../db/pool.js';
import { databaseReady, describeIfDatabase, newId } from '../../test/factories.js';
import { removeCommittedFixtures } from '../../test/committedFixtureCleanup.js';

describeIfDatabase('Orders Summary Endpoint (BR-163)', () => {
  const app = createApp();
  let ready = false;

  let superAdminToken: string;
  let superAdminUserId: string;

  let subWhAdminToken: string;
  let subWhAdminUserId: string;

  let warehouseId1: string;
  let warehouseId2: string;
  const createdOrderIds: string[] = [];
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    ready = await databaseReady('orders');
    if (!ready) return;

    // Pick 2 seeded warehouses
    const whRes = await pool.query<{ id: string }>(
      `SELECT id FROM warehouses ORDER BY code ASC LIMIT 2`,
    );
    warehouseId1 = whRes.rows[0]!.id;
    warehouseId2 = whRes.rows[1]!.id;

    // Create Super Admin user
    superAdminUserId = newId();
    createdUserIds.push(superAdminUserId);
    await pool.query(
      `INSERT INTO users (id, mobile, user_type, full_name, status)
       VALUES ($1, '+919999000163', 'ADMIN', 'Summary SuperAdmin', 'ACTIVE')
       ON CONFLICT DO NOTHING`,
      [superAdminUserId],
    );
    await pool.query(
      `INSERT INTO user_roles (id, user_id, role_id, role_code)
       SELECT $1, $2, r.id, r.code FROM roles r WHERE r.code = 'SUPER_ADMIN'`,
      [newId(), superAdminUserId],
    );
    superAdminToken = signAccessToken({
      sub: superAdminUserId,
      roles: [{ code: 'SUPER_ADMIN' }],
      customerId: null,
      farmerId: null,
    });

    // Create Sub-warehouse Admin for warehouseId1
    subWhAdminUserId = newId();
    createdUserIds.push(subWhAdminUserId);
    await pool.query(
      `INSERT INTO users (id, mobile, user_type, full_name, status)
       VALUES ($1, '+919999001163', 'ADMIN', 'SubWH Admin', 'ACTIVE')
       ON CONFLICT DO NOTHING`,
      [subWhAdminUserId],
    );
    await pool.query(
      `INSERT INTO user_roles (id, user_id, role_id, role_code, warehouse_id)
       SELECT $1, $2, r.id, r.code, $3 FROM roles r WHERE r.code = 'SUB_WH_ADMIN'`,
      [newId(), subWhAdminUserId, warehouseId1],
    );
    subWhAdminToken = signAccessToken({
      sub: subWhAdminUserId,
      roles: [{ code: 'SUB_WH_ADMIN', warehouseId: warehouseId1 }],
      customerId: null,
      farmerId: null,
    });

    // Insert 2 test orders in warehouseId1 and 1 test order in warehouseId2
    const o1 = newId();
    const o2 = newId();
    const o3 = newId();
    createdOrderIds.push(o1, o2, o3);

    // o1: warehouse1, CONFIRMED
    await pool.query(
      `INSERT INTO orders (id, order_number, warehouse_id, status, channel, fulfilment_type, walk_in_name, walk_in_mobile, subtotal, delivery_fee, discount, gst_amount, total_amount, payment_method, payment_status, placed_at)
       VALUES ($1, 'ORD-SUM-001', $2, 'CONFIRMED', 'DIRECT', 'PICKUP', 'Buyer 1', '+919999000111', 100, 0, 0, 0, 100, 'UPI', 'PAID', '2026-06-01T10:00:00Z')`,
      [o1, warehouseId1],
    );

    // o2: warehouse1, PACKED
    await pool.query(
      `INSERT INTO orders (id, order_number, warehouse_id, status, channel, fulfilment_type, walk_in_name, walk_in_mobile, subtotal, delivery_fee, discount, gst_amount, total_amount, payment_method, payment_status, placed_at)
       VALUES ($1, 'ORD-SUM-002', $2, 'PACKED', 'DIRECT', 'PICKUP', 'Buyer 2', '+919999000222', 200, 0, 0, 0, 200, 'UPI', 'PAID', '2026-06-02T10:00:00Z')`,
      [o2, warehouseId1],
    );

    // o3: warehouse2, CONFIRMED
    await pool.query(
      `INSERT INTO orders (id, order_number, warehouse_id, status, channel, fulfilment_type, walk_in_name, walk_in_mobile, subtotal, delivery_fee, discount, gst_amount, total_amount, payment_method, payment_status, placed_at)
       VALUES ($1, 'ORD-SUM-003', $2, 'CONFIRMED', 'DIRECT', 'PICKUP', 'Buyer 3', '+919999000333', 150, 0, 0, 0, 150, 'CASH', 'PAID', '2026-06-03T10:00:00Z')`,
      [o3, warehouseId2],
    );
  });

  afterAll(async () => {
    if (!ready) return;
    await removeCommittedFixtures(
      async (fn) => {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const res = await fn(client);
          await client.query('COMMIT');
          return res;
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
      },
      {
        userIds: createdUserIds,
        orderIds: createdOrderIds,
      },
    );
  });

  it('BR-163a: GET /v1/admin/orders/summary returns aggregated counts for super admin', async () => {
    const res = await request(app)
      .get('/v1/admin/orders/summary')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('byStatus');
    expect(res.body).toHaveProperty('byWarehouse');
    expect(typeof res.body.total).toBe('number');
    expect(res.body.total).toBeGreaterThanOrEqual(3);
    expect(res.body.byStatus.CONFIRMED).toBeGreaterThanOrEqual(2);
    expect(res.body.byStatus.PACKED).toBeGreaterThanOrEqual(1);

    const wh1Summary = res.body.byWarehouse.find((w: any) => w.warehouseId === warehouseId1);
    const wh2Summary = res.body.byWarehouse.find((w: any) => w.warehouseId === warehouseId2);
    expect(wh1Summary).toBeDefined();
    expect(wh1Summary.count).toBeGreaterThanOrEqual(2);
    expect(wh2Summary).toBeDefined();
    expect(wh2Summary.count).toBeGreaterThanOrEqual(1);
  });

  it('BR-163b: GET /v1/admin/orders/summary filters by warehouseId', async () => {
    const res = await request(app)
      .get(`/v1/admin/orders/summary?warehouseId=${warehouseId1}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.byWarehouse).toHaveLength(1);
    expect(res.body.byWarehouse[0].warehouseId).toBe(warehouseId1);
    expect(res.body.byWarehouse[0].count).toBeGreaterThanOrEqual(2);
  });

  it('BR-163c: GET /v1/admin/orders/summary filters by date range (from/to)', async () => {
    const res = await request(app)
      .get(`/v1/admin/orders/summary?from=2026-06-01T00:00:00Z&to=2026-06-01T23:59:59Z`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.byStatus.CONFIRMED).toBe(1);
  });

  it('BR-163d: GET /v1/admin/orders/summary scopes to sub-warehouse admin allowed warehouse', async () => {
    const res = await request(app)
      .get('/v1/admin/orders/summary')
      .set('Authorization', `Bearer ${subWhAdminToken}`);

    expect(res.status).toBe(200);
    // Sub-warehouse admin only sees warehouseId1
    for (const wh of res.body.byWarehouse) {
      expect(wh.warehouseId).toBe(warehouseId1);
    }
  });

  it('BR-163e: GET /v1/admin/orders/summary rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/v1/admin/orders/summary');
    expect(res.status).toBe(401);
  });
});
