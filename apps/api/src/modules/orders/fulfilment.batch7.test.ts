import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { pool } from '../../db/pool.js';
import { databaseReady, describeIfDatabase, newId } from '../../test/factories.js';
import { randomMobile } from '../../test/dbFixtures.js';

describeIfDatabase('Batch 7 Orders Parity & Write Endpoints (BR-151, BR-152, BR-153, BR-156)', () => {
  const app = createApp();
  let ready = false;

  let _superAdminToken: string;
  let superAdminUserId: string;

  let _mainWhAdminToken: string;
  let mainWhAdminUserId: string;

  let subWhAdminToken1: string;
  let subWhAdminUserId1: string;

  let _subWhAdminToken2: string;
  let subWhAdminUserId2: string;

  let warehouseId1: string;
  let warehouseId2: string;
  let cropId: string;
  let customerId: string;

  beforeAll(async () => {
    ready = await databaseReady('orders');
    if (!ready) return;

    // 1. Resolve two warehouses
    const whRes = await pool.query<{ id: string }>(
      `SELECT id FROM warehouses ORDER BY code ASC LIMIT 2`,
    );
    warehouseId1 = whRes.rows[0]!.id;
    warehouseId2 = whRes.rows[1]!.id;

    // 2. Resolve crop
    const cropRes = await pool.query<{ id: string }>(
      `SELECT id FROM crop_master LIMIT 1`,
    );
    cropId = cropRes.rows[0]!.id;

    // 3. Super Admin
    superAdminUserId = newId();
    await pool.query(
      `INSERT INTO users (id, mobile, user_type, full_name, status) VALUES ($1, $2, 'ADMIN', 'Super Admin', 'ACTIVE') ON CONFLICT DO NOTHING`,
      [superAdminUserId, randomMobile()],
    );
    _superAdminToken = signAccessToken({
      sub: superAdminUserId,
      roles: [{ code: 'SUPER_ADMIN' }],
      customerId: null,
      farmerId: null,
    });

    // 4. Main WH Admin
    mainWhAdminUserId = newId();
    await pool.query(
      `INSERT INTO users (id, mobile, user_type, full_name, status) VALUES ($1, $2, 'ADMIN', 'Main Admin', 'ACTIVE') ON CONFLICT DO NOTHING`,
      [mainWhAdminUserId, randomMobile()],
    );
    _mainWhAdminToken = signAccessToken({
      sub: mainWhAdminUserId,
      roles: [{ code: 'MAIN_WH_ADMIN' }],
      customerId: null,
      farmerId: null,
    });

    // 5. Sub WH Admin for Warehouse 1
    subWhAdminUserId1 = newId();
    await pool.query(
      `INSERT INTO users (id, mobile, user_type, full_name, status) VALUES ($1, $2, 'ADMIN', 'Sub Admin 1', 'ACTIVE') ON CONFLICT DO NOTHING`,
      [subWhAdminUserId1, randomMobile()],
    );
    subWhAdminToken1 = signAccessToken({
      sub: subWhAdminUserId1,
      roles: [{ code: 'SUB_WH_ADMIN', warehouseId: warehouseId1 }],
      customerId: null,
      farmerId: null,
    });

    // 6. Sub WH Admin for Warehouse 2
    subWhAdminUserId2 = newId();
    await pool.query(
      `INSERT INTO users (id, mobile, user_type, full_name, status) VALUES ($1, $2, 'ADMIN', 'Sub Admin 2', 'ACTIVE') ON CONFLICT DO NOTHING`,
      [subWhAdminUserId2, randomMobile()],
    );
    _subWhAdminToken2 = signAccessToken({
      sub: subWhAdminUserId2,
      roles: [{ code: 'SUB_WH_ADMIN', warehouseId: warehouseId2 }],
      customerId: null,
      farmerId: null,
    });

    // 7. Customer
    const custUser = newId();
    await pool.query(
      `INSERT INTO users (id, mobile, user_type, full_name, status) VALUES ($1, $2, 'CUSTOMER', 'Batch 7 Buyer', 'ACTIVE') ON CONFLICT DO NOTHING`,
      [custUser, randomMobile()],
    );
    customerId = newId();
    await pool.query(
      `INSERT INTO customers (id, user_id, customer_code, customer_type)
       VALUES ($1, $2, $3, 'RETAIL') ON CONFLICT DO NOTHING`,
      [customerId, custUser, `CUST-B7-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`],
    );
  });

  async function createTestOrder(warehouseId: string, status = 'CONFIRMED', packedAt: Date | null = null, cancellationReason: string | null = null) {
    const orderId = newId();
    const orderNumber = `ORD-B7-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
    const reason = status === 'CANCELLED' ? (cancellationReason ?? 'Cancelled order') : cancellationReason;

    await pool.query(
      `INSERT INTO orders (
         id, order_number, customer_id, warehouse_id, channel, fulfilment_type,
         subtotal, delivery_fee, discount, gst_amount, total_amount, payment_method,
         payment_status, status, cancellation_reason, placed_at, packed_at
       ) VALUES ($1, $2, $3, $4, 'ONLINE', 'PICKUP', 500.00, 0, 0, 25.00, 525.00, 'WALLET', 'PAID', $5, $6, now(), $7)`,
      [orderId, orderNumber, customerId, warehouseId, status, reason, packedAt],
    );

    const orderItemId = newId();
    await pool.query(
      `INSERT INTO order_items (id, order_id, crop_id, grade, qty_kg, unit_price, line_total, status)
       VALUES ($1, $2, $3, 'GRADE_1', 5.000, 100.00, 500.00, 'PENDING')`,
      [orderItemId, orderId, cropId],
    );

    await pool.query(
      `INSERT INTO order_status_history (id, order_id, from_status, to_status, changed_by, note)
       VALUES ($1, $2, null, $3, $4, 'Initial order creation')`,
      [newId(), orderId, status, superAdminUserId],
    );

    return { orderId, orderNumber, orderItemId };
  }

  // ---------------------------------------------------------------------------
  // BR-151: Order Cancellation
  // ---------------------------------------------------------------------------
  describe('BR-151: POST /admin/orders/:id/cancel', () => {
    it('BR-151a: cancels an order, updates status, writes status history and audit log', async () => {
      const { orderId } = await createTestOrder(warehouseId1, 'CONFIRMED');
      const idemKey = newId();

      const res = await request(app)
        .post(`/v1/admin/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${subWhAdminToken1}`)
        .set('Idempotency-Key', idemKey)
        .send({ reason: 'Customer requested cancellation via call' });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(orderId);
      expect(res.body.status).toBe('CANCELLED');

      // Verify DB status
      const orderDb = await pool.query(`SELECT status, cancellation_reason FROM orders WHERE id = $1`, [orderId]);
      expect(orderDb.rows[0]?.status).toBe('CANCELLED');
      expect(orderDb.rows[0]?.cancellation_reason).toBe('Customer requested cancellation via call');

      // Verify order_status_history
      const history = await pool.query(
        `SELECT to_status, note FROM order_status_history WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [orderId],
      );
      expect(history.rows[0]?.to_status).toBe('CANCELLED');
      expect(history.rows[0]?.note).toBe('Customer requested cancellation via call');

      // Verify audit log
      const audit = await pool.query(
        `SELECT action_code, entity_id FROM audit_log WHERE entity_id = $1 AND action_code = 'order.cancel'`,
        [orderId],
      );
      expect(audit.rows.length).toBeGreaterThan(0);
    });

    it('BR-151b: enforces warehouse scope (404 for order belonging to another warehouse)', async () => {
      const { orderId } = await createTestOrder(warehouseId2, 'CONFIRMED');

      const res = await request(app)
        .post(`/v1/admin/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${subWhAdminToken1}`)
        .set('Idempotency-Key', newId())
        .send({ reason: 'Out of scope cancellation' });

      expect(res.status).toBe(404);
    });

    it('BR-151c: returns 409 INVALID_STATE_TRANSITION if order is already CANCELLED', async () => {
      const { orderId } = await createTestOrder(warehouseId1, 'CANCELLED');

      const res = await request(app)
        .post(`/v1/admin/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${subWhAdminToken1}`)
        .set('Idempotency-Key', newId())
        .send({ reason: 'Already cancelled' });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('INVALID_STATE_TRANSITION');
    });

    it('BR-151c: requires Idempotency-Key header', async () => {
      const { orderId } = await createTestOrder(warehouseId1, 'CONFIRMED');

      const res = await request(app)
        .post(`/v1/admin/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${subWhAdminToken1}`)
        .send({ reason: 'Missing idempotency key' });

      expect(res.status).toBe(422);
    });
  });

  // ---------------------------------------------------------------------------
  // BR-152: Order Issues
  // ---------------------------------------------------------------------------
  describe('BR-152: POST /admin/orders/:id/issues', () => {
    it('BR-152a: records issue with ISS-xxxx sequential number, links order and items', async () => {
      const { orderId, orderItemId } = await createTestOrder(warehouseId1, 'CONFIRMED');
      const idemKey = newId();

      const res = await request(app)
        .post(`/v1/admin/orders/${orderId}/issues`)
        .set('Authorization', `Bearer ${subWhAdminToken1}`)
        .set('Idempotency-Key', idemKey)
        .send({
          issueType: 'QUALITY',
          description: 'Crates crushed during staging',
          lineItemIds: [orderItemId],
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.issueNumber).toMatch(/^ISS-\d{4,}$/);
      expect(res.body.status).toBe('OPEN');

      // Verify DB persistence in warehouse_issues
      const issueDb = await pool.query(
        `SELECT id, issue_number, order_id, order_line_ids FROM warehouse_issues WHERE id = $1`,
        [res.body.id],
      );
      expect(issueDb.rows[0]?.order_id).toBe(orderId);
      expect(issueDb.rows[0]?.order_line_ids).toEqual([orderItemId]);

      // Verify audit log
      const audit = await pool.query(
        `SELECT action_code, entity_id FROM audit_log WHERE entity_id = $1 AND action_code = 'warehouse.issue.manage'`,
        [res.body.id],
      );
      expect(audit.rows.length).toBeGreaterThan(0);
    });

    it('BR-152b: enforces warehouse scope (404 for order of other warehouse)', async () => {
      const { orderId } = await createTestOrder(warehouseId2, 'CONFIRMED');

      const res = await request(app)
        .post(`/v1/admin/orders/${orderId}/issues`)
        .set('Authorization', `Bearer ${subWhAdminToken1}`)
        .set('Idempotency-Key', newId())
        .send({
          issueType: 'OTHER',
          description: 'Other warehouse order issue',
        });

      expect(res.status).toBe(404);
    });
  });

  // ---------------------------------------------------------------------------
  // BR-153: Admin Order Detail & List Parity
  // ---------------------------------------------------------------------------
  describe('BR-153: Order Detail & List Parity Fields', () => {
    it('BR-153a: GET /admin/orders/:id exposes pickupType, notes, items[].id, and timeline excludes actor and note (BR-99)', async () => {
      const { orderId, orderItemId } = await createTestOrder(warehouseId1, 'CONFIRMED');

      // Add cancellation reason to test notes
      await pool.query(`UPDATE orders SET cancellation_reason = 'Test order note' WHERE id = $1`, [orderId]);

      const res = await request(app)
        .get(`/v1/admin/orders/${orderId}`)
        .set('Authorization', `Bearer ${subWhAdminToken1}`);

      expect(res.status).toBe(200);
      expect(res.body.pickupType).toBe('WAREHOUSE_PICKUP');
      expect(res.body.notes).toBe('Test order note');
      expect(res.body.items[0]?.id).toBe(orderItemId);
      expect(res.body.timeline[0]).not.toHaveProperty('actor');
      expect(res.body.timeline[0]).not.toHaveProperty('note');
    });

    it('BR-153b: GET /admin/orders list rows expose buyerName, customerName, and packedAt', async () => {
      const packedTime = new Date();
      const { orderId } = await createTestOrder(warehouseId1, 'PACKED', packedTime);

      const res = await request(app)
        .get(`/v1/admin/orders`)
        .set('Authorization', `Bearer ${subWhAdminToken1}`);

      expect(res.status).toBe(200);
      const row = res.body.items.find((item: { id: string }) => item.id === orderId);
      expect(row).toBeDefined();
      expect(row.buyerName).toBe('Batch 7 Buyer');
      expect(row.customerName).toBe('Batch 7 Buyer');
      expect(row.packedAt).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // BR-156: Order Stock Check
  // ---------------------------------------------------------------------------
  describe('BR-156: GET /admin/orders/:id/stock-check', () => {
    it('BR-156a: computes ordered, shelf stock, reserved, shortage, and status per line and overall', async () => {
      const { orderId, orderItemId } = await createTestOrder(warehouseId1, 'CONFIRMED');

      const res = await request(app)
        .get(`/v1/admin/orders/${orderId}/stock-check`)
        .set('Authorization', `Bearer ${subWhAdminToken1}`);

      expect(res.status).toBe(200);
      expect(res.body.orderId).toBe(orderId);
      expect(['AVAILABLE', 'INSUFFICIENT']).toContain(res.body.status);
      expect(Array.isArray(res.body.lines)).toBe(true);
      expect(res.body.lines[0]?.orderItemId).toBe(orderItemId);
      expect(res.body.lines[0]?.orderedKg).toBe('5.000');
      expect(res.body.lines[0]?.availableStockKg).toBeDefined();
      expect(res.body.lines[0]?.reservedKg).toBeDefined();
      expect(res.body.lines[0]?.availableKg).toBeDefined();
      expect(res.body.lines[0]?.shortageKg).toBeDefined();
      expect(['IN_STOCK', 'SHORTAGE']).toContain(res.body.lines[0]?.status);
    });

    it('BR-156b: enforces warehouse scope (404 outside scope)', async () => {
      const { orderId } = await createTestOrder(warehouseId2, 'CONFIRMED');

      const res = await request(app)
        .get(`/v1/admin/orders/${orderId}/stock-check`)
        .set('Authorization', `Bearer ${subWhAdminToken1}`);

      expect(res.status).toBe(404);
    });
  });
});
