import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { pool } from '../../db/pool.js';
import { databaseReady, describeIfDatabase, newId } from '../../test/factories.js';
import { randomMobile } from '../../test/dbFixtures.js';

describeIfDatabase('Batch 7 Returns Parity Fields & Queue Search (BR-154, BR-155)', () => {
  const app = createApp();
  let ready = false;

  let superAdminToken: string;
  let superAdminUserId: string;

  let subWhAdminToken1: string;
  let subWhAdminUserId1: string;

  let _subWhAdminToken2: string;
  let subWhAdminUserId2: string;

  let warehouseId1: string;
  let warehouseId2: string;
  let cropId: string;
  let customerId: string;
  let customerUserId: string;

  beforeAll(async () => {
    ready = await databaseReady('return_requests');
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
      `INSERT INTO users (id, mobile, user_type, full_name, status) VALUES ($1, $2, 'ADMIN', 'Super Admin Returns', 'ACTIVE') ON CONFLICT DO NOTHING`,
      [superAdminUserId, randomMobile()],
    );
    superAdminToken = signAccessToken({
      sub: superAdminUserId,
      roles: [{ code: 'SUPER_ADMIN' }],
      customerId: null,
      farmerId: null,
    });

    // 4. Sub WH Admin 1 (Warehouse 1)
    subWhAdminUserId1 = newId();
    await pool.query(
      `INSERT INTO users (id, mobile, user_type, full_name, status) VALUES ($1, $2, 'ADMIN', 'Sub Admin R1', 'ACTIVE') ON CONFLICT DO NOTHING`,
      [subWhAdminUserId1, randomMobile()],
    );
    subWhAdminToken1 = signAccessToken({
      sub: subWhAdminUserId1,
      roles: [{ code: 'SUB_WH_ADMIN', warehouseId: warehouseId1 }],
      customerId: null,
      farmerId: null,
    });

    // 5. Sub WH Admin 2 (Warehouse 2)
    subWhAdminUserId2 = newId();
    await pool.query(
      `INSERT INTO users (id, mobile, user_type, full_name, status) VALUES ($1, $2, 'ADMIN', 'Sub Admin R2', 'ACTIVE') ON CONFLICT DO NOTHING`,
      [subWhAdminUserId2, randomMobile()],
    );
    _subWhAdminToken2 = signAccessToken({
      sub: subWhAdminUserId2,
      roles: [{ code: 'SUB_WH_ADMIN', warehouseId: warehouseId2 }],
      customerId: null,
      farmerId: null,
    });

    // 6. Customer
    customerUserId = newId();
    await pool.query(
      `INSERT INTO users (id, mobile, user_type, full_name, status) VALUES ($1, $2, 'CUSTOMER', 'RMA Customer Ananya', 'ACTIVE') ON CONFLICT DO NOTHING`,
      [customerUserId, randomMobile()],
    );
    customerId = newId();
    await pool.query(
      `INSERT INTO customers (id, user_id, customer_code, customer_type)
       VALUES ($1, $2, $3, 'RETAIL') ON CONFLICT DO NOTHING`,
      [customerId, customerUserId, `CUST-RMA-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`],
    );
  });

  async function createOrderAndReturn(
    warehouseId: string,
    opts: {
      orderNumber?: string;
      reason?: string;
      issueCategory?: string;
      issueTicket?: string;
      requestedResolution?: string;
      customerEvidence?: string[];
      placedDaysAgo?: number;
      completedDaysAgo?: number;
    } = {},
  ) {
    const orderId = newId();
    const orderNumber = opts.orderNumber ?? `ORD-RMA-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
    const placedDays = opts.placedDaysAgo ?? 1;
    const completedDays = opts.completedDaysAgo ?? 1;

    await pool.query(
      `INSERT INTO orders (
         id, order_number, customer_id, warehouse_id, channel, fulfilment_type,
         subtotal, delivery_fee, discount, gst_amount, total_amount, payment_method,
         payment_status, status, placed_at, completed_at
       ) VALUES ($1, $2, $3, $4, 'ONLINE', 'PICKUP', 300.00, 0, 0, 15.00, 315.00, 'WALLET', 'PAID', 'PICKED_UP',
                 now() - interval '${placedDays} days', now() - interval '${completedDays} days')`,
      [orderId, orderNumber, customerId, warehouseId],
    );

    const orderItemId = newId();
    await pool.query(
      `INSERT INTO order_items (id, order_id, crop_id, grade, qty_kg, unit_price, line_total, status)
       VALUES ($1, $2, $3, 'GRADE_1', 3.000, 100.00, 300.00, 'FULFILLED')`,
      [orderItemId, orderId, cropId],
    );

    const returnId = newId();
    const reason = opts.reason ?? 'Bruised packaging upon pickup';

    await pool.query(
      `INSERT INTO return_requests (
         id, order_id, customer_id, reason, note, issue_category, issue_ticket,
         requested_resolution, customer_evidence, status, created_at
       ) VALUES ($1, $2, $3, $4, 'Customer note', $5, $6, $7, $8, 'PENDING', now())`,
      [
        returnId,
        orderId,
        customerId,
        reason,
        opts.issueCategory ?? 'QUALITY',
        opts.issueTicket ?? 'TCK-001',
        opts.requestedResolution ?? 'REFUND',
        opts.customerEvidence ?? ['photo1.jpg', 'photo2.jpg'],
      ],
    );

    await pool.query(
      `INSERT INTO return_request_items (id, return_request_id, order_item_id, requested_qty)
       VALUES ($1, $2, $3, 2.000)`,
      [newId(), returnId, orderItemId],
    );

    await pool.query(
      `INSERT INTO return_request_status_history (id, return_request_id, from_status, to_status, changed_by)
       VALUES ($1, $2, null, 'PENDING', $3)`,
      [newId(), returnId, superAdminUserId],
    );

    return { orderId, orderNumber, orderItemId, returnId, reason };
  }

  // ---------------------------------------------------------------------------
  // BR-154: Returns queue search, warehouse scoping, and KPI status summary
  // ---------------------------------------------------------------------------
  describe('BR-154: GET /admin/returns search, filter and KPI summary', () => {
    it('BR-154a: filters by q free-text search (matching order number or customer or reason)', async () => {
      const uniqueTag = `TAG${Date.now().toString().slice(-5)}`;
      const { returnId } = await createOrderAndReturn(warehouseId1, {
        orderNumber: `ORD-SPEC-${uniqueTag}`,
        reason: `Reason with ${uniqueTag}`,
      });

      const res = await request(app)
        .get(`/v1/admin/returns?q=${uniqueTag}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.items.length).toBeGreaterThanOrEqual(1);
      const found = res.body.items.find((r: { id: string }) => r.id === returnId);
      expect(found).toBeDefined();
      expect(found.orderNumber).toBe(`ORD-SPEC-${uniqueTag}`);
    });

    it('BR-154a: filters by warehouseId', async () => {
      const { returnId } = await createOrderAndReturn(warehouseId2);

      const res1 = await request(app)
        .get(`/v1/admin/returns?warehouseId=${warehouseId1}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res1.status).toBe(200);
      const inWh1 = res1.body.items.some((r: { id: string }) => r.id === returnId);
      expect(inWh1).toBe(false);

      const res2 = await request(app)
        .get(`/v1/admin/returns?warehouseId=${warehouseId2}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res2.status).toBe(200);
      const inWh2 = res2.body.items.some((r: { id: string }) => r.id === returnId);
      expect(inWh2).toBe(true);
    });

    it('BR-154b: returns queue response includes KPI summary counts and list item customerName/orderNumber', async () => {
      const { returnId, orderNumber } = await createOrderAndReturn(warehouseId1);

      const res = await request(app)
        .get(`/v1/admin/returns`)
        .set('Authorization', `Bearer ${subWhAdminToken1}`);

      expect(res.status).toBe(200);
      expect(res.body.summary).toBeDefined();
      expect(typeof res.body.summary.pending).toBe('number');
      expect(typeof res.body.summary.underReview).toBe('number');
      expect(typeof res.body.summary.approved).toBe('number');
      expect(typeof res.body.summary.refundPending).toBe('number');
      expect(res.body.summary.pending).toBeGreaterThanOrEqual(1);

      const item = res.body.items.find((r: { id: string }) => r.id === returnId);
      expect(item).toBeDefined();
      expect(item.orderNumber).toBe(orderNumber);
      expect(item.customerName).toBe('RMA Customer Ananya');
    });
  });

  // ---------------------------------------------------------------------------
  // BR-155: Admin Returns extended fields and calculations
  // ---------------------------------------------------------------------------
  describe('BR-155: Returns extended fields, eligibility and projected refund', () => {
    it('BR-155a: accepts extended fields on create and inspect', async () => {
      const { orderId, orderItemId } = await createOrderAndReturn(warehouseId1);

      const createRes = await request(app)
        .post(`/v1/orders/${orderId}/returns`)
        .set('Authorization', `Bearer ${subWhAdminToken1}`)
        .send({
          reason: 'Excess moisture in cabbage',
          items: [{ orderItemId, qty: '1.000' }],
          issueCategory: 'QUALITY_DEFECT',
          issueTicket: 'TICK-999',
          requestedResolution: 'WALLET_REFUND',
          customerEvidence: ['https://storage.tohfa.com/evidence1.jpg'],
        });

      expect(createRes.status).toBe(201);
      const returnId = createRes.body.id;
      expect(createRes.body.issueCategory).toBe('QUALITY_DEFECT');
      expect(createRes.body.issueTicket).toBe('TICK-999');
      expect(createRes.body.requestedResolution).toBe('WALLET_REFUND');
      expect(createRes.body.customerEvidence).toEqual(['https://storage.tohfa.com/evidence1.jpg']);

      // Inspect return with inspectionNotes and inspectionPhotos
      const inspectRes = await request(app)
        .post(`/v1/admin/returns/${returnId}/inspect`)
        .set('Authorization', `Bearer ${subWhAdminToken1}`)
        .send({
          items: [
            {
              orderItemId,
              condition: 'DAMAGED',
              acceptedQty: '0.500',
              damagedQty: '0.500',
            },
          ],
          inspectionNotes: 'Verified moisture and mold on inner leaves',
          inspectionPhotos: ['https://storage.tohfa.com/inspect1.jpg'],
        });

      expect(inspectRes.status).toBe(200);
      expect(inspectRes.body.status).toBe('INSPECTED');
      expect(inspectRes.body.inspectionNotes).toBe('Verified moisture and mold on inner leaves');
      expect(inspectRes.body.inspectionPhotos).toEqual(['https://storage.tohfa.com/inspect1.jpg']);
    });

    it('BR-155b: calculates returnWindowEligible, projectedRefundAmount, and projectedRefundMethod', async () => {
      // Order completed 2 days ago -> eligible
      const eligible = await createOrderAndReturn(warehouseId1, { completedDaysAgo: 2 });
      const resEligible = await request(app)
        .get(`/v1/admin/returns/${eligible.returnId}`)
        .set('Authorization', `Bearer ${subWhAdminToken1}`);

      expect(resEligible.status).toBe(200);
      expect(resEligible.body.returnWindowEligible).toBe(true);
      // Unit price is 100.00, requestedQty is 2.000 -> projected refund is 200.00
      expect(resEligible.body.projectedRefundAmount).toBe('200.00');
      expect(resEligible.body.projectedRefundMethod).toBe('WALLET');

      // Order completed 10 days ago -> not eligible (> 7 days)
      const expired = await createOrderAndReturn(warehouseId1, {
        placedDaysAgo: 12,
        completedDaysAgo: 10,
      });
      const resExpired = await request(app)
        .get(`/v1/admin/returns/${expired.returnId}`)
        .set('Authorization', `Bearer ${subWhAdminToken1}`);

      expect(resExpired.status).toBe(200);
      expect(resExpired.body.returnWindowEligible).toBe(false);
    });
  });
});
