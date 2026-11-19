import { afterAll, beforeAll, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { pool } from '../../db/pool.js';
import { databaseReady, describeIfDatabase, newId } from '../../test/factories.js';
import { randomMobile } from '../../test/dbFixtures.js';

describeIfDatabase('Batch 8 Dual Fulfilment & Delivery Modules (BR-21, BR-99, BR-158, BR-159)', () => {
  const app = createApp();
  let ready = false;

  let subWhAdminToken: string;
  let subWhAdminUserId: string;

  let warehouseId: string;
  let customerId: string;
  let customerUserId: string;
  let addressId: string;
  let activePartnerId: string;
  let inactivePartnerId: string;

  beforeAll(async () => {
    ready = await databaseReady('orders');
    if (!ready) return;

    // 1. Warehouse
    const whRes = await pool.query<{ id: string }>(`SELECT id FROM warehouses LIMIT 1`);
    warehouseId = whRes.rows[0]!.id;

    // 2. Admin
    subWhAdminUserId = newId();
    await pool.query(
      `INSERT INTO users (id, mobile, user_type, full_name, status) VALUES ($1, $2, 'ADMIN', 'Sub WH Admin', 'ACTIVE') ON CONFLICT DO NOTHING`,
      [subWhAdminUserId, randomMobile()],
    );
    subWhAdminToken = signAccessToken({
      sub: subWhAdminUserId,
      roles: [{ code: 'SUB_WH_ADMIN', warehouseId }],
      customerId: null,
      farmerId: null,
    });

    // 3. Customer & Address
    customerUserId = newId();
    await pool.query(
      `INSERT INTO users (id, mobile, user_type, full_name, status) VALUES ($1, $2, 'CUSTOMER', 'Ramesh Kumar', 'ACTIVE') ON CONFLICT DO NOTHING`,
      [customerUserId, randomMobile()],
    );
    const custRes = await pool.query<{ id: string }>(
      `INSERT INTO customers (user_id, customer_code) VALUES ($1, $2) RETURNING id`,
      [customerUserId, `CUST-${newId().slice(0, 6)}`],
    );
    customerId = custRes.rows[0]!.id;

    const addrRes = await pool.query<{ id: string }>(
      `INSERT INTO customer_addresses (customer_id, line1, line2, city, district, state, pincode, lat, lng)
       VALUES ($1, '42 Nilgiri Hills Road', 'Near Tea Estate', 'Coonoor', 'The Nilgiris', 'Tamil Nadu', '643101', 11.353200, 76.795400)
       RETURNING id`,
      [customerId],
    );
    addressId = addrRes.rows[0]!.id;

    // 4. Delivery Partners
    const p1 = await pool.query<{ id: string }>(
      `INSERT INTO delivery_partners (name, phone, vehicle_ref, is_active)
       VALUES ('Express Rider', '+919111111111', 'TN-43-E-1001', true) RETURNING id`,
    );
    activePartnerId = p1.rows[0]!.id;

    const p2 = await pool.query<{ id: string }>(
      `INSERT INTO delivery_partners (name, phone, vehicle_ref, is_active)
       VALUES ('Inactive Rider', '+919222222222', 'TN-43-E-2002', false) RETURNING id`,
    );
    inactivePartnerId = p2.rows[0]!.id;
  });

  it('BR-158: GET /admin/delivery-slots returns 3 fixed windows and per-warehouse capacity metrics', async () => {
    if (!ready) return;

    // 1. Without query params: 3 fixed reference slots
    const resNoQuery = await request(app)
      .get('/v1/admin/delivery-slots')
      .set('Authorization', `Bearer ${subWhAdminToken}`);
    expect(resNoQuery.status).toBe(200);
    expect(resNoQuery.body).toHaveLength(3);
    expect(resNoQuery.body.map((s: { slot: string }) => s.slot)).toEqual([
      'MORNING_8_12',
      'AFTERNOON_12_4',
      'EVENING_4_8',
    ]);
    expect(resNoQuery.body[0]).toEqual({
      slot: 'MORNING_8_12',
      capacityOrders: 0,
      bookedOrders: 0,
      availableOrders: 0,
      isActive: true,
    });

    // 2. Insert test slot capacity in delivery_slots table
    const testDate = '2031-10-15';
    await pool.query(
      `INSERT INTO delivery_slots (warehouse_id, slot_date, slot, capacity_orders, booked_orders, is_active)
       VALUES ($1, $2, 'MORNING_8_12', 15, 3, true),
              ($1, $2, 'AFTERNOON_12_4', 10, 10, true),
              ($1, $2, 'EVENING_4_8', 8, 2, false)
       ON CONFLICT (warehouse_id, slot_date, slot)
       DO UPDATE SET capacity_orders = EXCLUDED.capacity_orders, booked_orders = EXCLUDED.booked_orders, is_active = EXCLUDED.is_active`,
      [warehouseId, testDate],
    );

    // 3. With warehouseId and date query: live availability
    const resWithQuery = await request(app)
      .get(`/v1/admin/delivery-slots?warehouseId=${warehouseId}&date=${testDate}`)
      .set('Authorization', `Bearer ${subWhAdminToken}`);
    expect(resWithQuery.status).toBe(200);
    expect(resWithQuery.body).toEqual([
      {
        slot: 'MORNING_8_12',
        capacityOrders: 15,
        bookedOrders: 3,
        availableOrders: 12,
        isActive: true,
      },
      {
        slot: 'AFTERNOON_12_4',
        capacityOrders: 10,
        bookedOrders: 10,
        availableOrders: 0,
        isActive: true,
      },
      {
        slot: 'EVENING_4_8',
        capacityOrders: 8,
        bookedOrders: 2,
        availableOrders: 6,
        isActive: false,
      },
    ]);

    // 4. Cross-scope warehouseId returns empty array [] (Item 4.4)
    const otherWhRes = await pool.query<{ id: string }>(
      `SELECT id FROM warehouses WHERE id <> $1 LIMIT 1`,
      [warehouseId],
    );
    if (otherWhRes.rows.length > 0) {
      const otherWhId = otherWhRes.rows[0]!.id;
      const resCrossScope = await request(app)
        .get(`/v1/admin/delivery-slots?warehouseId=${otherWhId}&date=${testDate}`)
        .set('Authorization', `Bearer ${subWhAdminToken}`);
      expect(resCrossScope.status).toBe(200);
      expect(resCrossScope.body).toEqual([]);
    }
  });

  it('BR-21b & BR-159a: POST /admin/orders/{id}/dispatch transitions PACKED delivery order to OUT_FOR_DELIVERY with partner', async () => {
    if (!ready) return;

    // Create a delivery order in PACKED status
    const orderNumber = `DEL-ORD-${newId().slice(0, 8)}`;
    const ins = await pool.query<{ id: string }>(
      `INSERT INTO orders (order_number, warehouse_id, customer_id, channel, fulfilment_type, status, payment_method, payment_status, subtotal, delivery_fee, discount, gst_amount, total_amount, delivery_address_id, delivery_date, packed_at)
       VALUES ($1, $2, $3, 'ONLINE', 'DELIVERY', 'PACKED', 'WALLET', 'PAID', 250, 40, 0, 12.50, 302.50, $4, '2031-11-20', now())
       RETURNING id`,
      [orderNumber, warehouseId, customerId, addressId],
    );
    const orderId = ins.rows[0]!.id;

    const dispatchKey = newId();
    const dispatchRes = await request(app)
      .post(`/v1/admin/orders/${orderId}/dispatch`)
      .set('Authorization', `Bearer ${subWhAdminToken}`)
      .set('Idempotency-Key', dispatchKey)
      .send({
        deliveryPartnerId: activePartnerId,
        vehicleNumber: 'TN-43-E-1001',
        slot: 'MORNING_8_12',
      });

    expect(dispatchRes.status).toBe(200);
    expect(dispatchRes.body).toMatchObject({
      id: orderId,
      status: 'OUT_FOR_DELIVERY',
      fulfillmentType: 'DELIVERY',
      deliverySlot: 'MORNING_8_12',
    });

    // Check detail endpoint reflects delivery partner assignment
    const getDetail = await request(app)
      .get(`/v1/admin/orders/${orderId}`)
      .set('Authorization', `Bearer ${subWhAdminToken}`);
    expect(getDetail.status).toBe(200);
    expect(getDetail.body.deliveryPartner).toMatchObject({
      id: activePartnerId,
      name: 'Express Rider',
      phone: '+919111111111',
      vehicleRef: 'TN-43-E-1001',
    });

    // Verify order_status_history row
    const hist = await pool.query<{ from_status: string; to_status: string; note: string }>(
      `SELECT from_status, to_status, note FROM order_status_history WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [orderId],
    );
    expect(hist.rows[0]!).toMatchObject({
      from_status: 'PACKED',
      to_status: 'OUT_FOR_DELIVERY',
    });
    expect(hist.rows[0]!.note).toContain('Express Rider');

    // Verify audit_log row
    const audit = await pool.query<{ action_code: string; after: unknown }>(
      `SELECT action_code, "after" FROM audit_log WHERE entity_type = 'orders' AND entity_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [orderId],
    );
    expect(audit.rows[0]!.action_code).toBe('order.dispatch');

    // BR-159c: Idempotency replay with same key returns identical body
    const replayRes = await request(app)
      .post(`/v1/admin/orders/${orderId}/dispatch`)
      .set('Authorization', `Bearer ${subWhAdminToken}`)
      .set('Idempotency-Key', dispatchKey)
      .send({
        deliveryPartnerId: activePartnerId,
        vehicleNumber: 'TN-43-E-1001',
        slot: 'MORNING_8_12',
      });
    expect(replayRes.status).toBe(200);
    expect(replayRes.body).toEqual(dispatchRes.body);
  });

  it('BR-21b & BR-159b: dispatch state machine guards for PICKUP and DELIVERY orders', async () => {
    if (!ready) return;

    // 1. PICKUP order cannot be dispatched with deliveryPartnerId -> 409 INVALID_STATE_TRANSITION
    const pickupOrder = await pool.query<{ id: string }>(
      `INSERT INTO orders (order_number, warehouse_id, customer_id, channel, fulfilment_type, status, payment_method, payment_status, subtotal, delivery_fee, discount, gst_amount, total_amount, packed_at)
       VALUES ($1, $2, $3, 'ONLINE', 'PICKUP', 'PACKED', 'WALLET', 'PAID', 200, 0, 0, 10, 210, now())
       RETURNING id`,
      [`PICK-ORD-${newId().slice(0, 8)}`, warehouseId, customerId],
    );
    const pickupOrderId = pickupOrder.rows[0]!.id;

    const pickupDispatchFail = await request(app)
      .post(`/v1/admin/orders/${pickupOrderId}/dispatch`)
      .set('Authorization', `Bearer ${subWhAdminToken}`)
      .set('Idempotency-Key', newId())
      .send({ deliveryPartnerId: activePartnerId });

    expect(pickupDispatchFail.status).toBe(409);
    expect(pickupDispatchFail.body.code).toBe('INVALID_STATE_TRANSITION');

    // Item 3.4 assertion: After pickup+partner 409, order_status_history and audit_log have 0 new rows written
    const historyCheck = await pool.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM order_status_history WHERE order_id = $1`,
      [pickupOrderId],
    );
    expect(Number(historyCheck.rows[0]!.count)).toBe(0);

    const auditCheck = await pool.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM audit_log WHERE entity_type = 'orders' AND entity_id = $1`,
      [pickupOrderId],
    );
    expect(Number(auditCheck.rows[0]!.count)).toBe(0);

    // Non-PACKED pickup order (e.g. CONFIRMED) cannot be dispatched -> 409 INVALID_STATE_TRANSITION
    const confirmedPickupOrder = await pool.query<{ id: string }>(
      `INSERT INTO orders (order_number, warehouse_id, customer_id, channel, fulfilment_type, status, payment_method, payment_status, subtotal, delivery_fee, discount, gst_amount, total_amount)
       VALUES ($1, $2, $3, 'ONLINE', 'PICKUP', 'CONFIRMED', 'WALLET', 'PAID', 200, 0, 0, 10, 210)
       RETURNING id`,
      [`PICK-CONF-${newId().slice(0, 8)}`, warehouseId, customerId],
    );
    const confirmedPickupOrderId = confirmedPickupOrder.rows[0]!.id;

    const confirmedDispatchFail = await request(app)
      .post(`/v1/admin/orders/${confirmedPickupOrderId}/dispatch`)
      .set('Authorization', `Bearer ${subWhAdminToken}`)
      .set('Idempotency-Key', newId())
      .send({});
    expect(confirmedDispatchFail.status).toBe(409);
    expect(confirmedDispatchFail.body.code).toBe('INVALID_STATE_TRANSITION');

    // Dispatching PACKED PICKUP order with empty body succeeds -> READY_FOR_PICKUP
    const pickupDispatchOk = await request(app)
      .post(`/v1/admin/orders/${pickupOrderId}/dispatch`)
      .set('Authorization', `Bearer ${subWhAdminToken}`)
      .set('Idempotency-Key', newId())
      .send({});

    expect(pickupDispatchOk.status).toBe(200);
    expect(pickupDispatchOk.body.status).toBe('READY_FOR_PICKUP');

    // 2. DELIVERY order cannot be dispatched without deliveryPartnerId -> 409 INVALID_STATE_TRANSITION
    const delOrder = await pool.query<{ id: string }>(
      `INSERT INTO orders (order_number, warehouse_id, customer_id, channel, fulfilment_type, status, payment_method, payment_status, subtotal, delivery_fee, discount, gst_amount, total_amount, delivery_address_id, delivery_date, packed_at)
       VALUES ($1, $2, $3, 'ONLINE', 'DELIVERY', 'PACKED', 'WALLET', 'PAID', 200, 40, 0, 10, 250, $4, '2031-11-20', now())
       RETURNING id`,
      [`DEL-FAIL-${newId().slice(0, 8)}`, warehouseId, customerId, addressId],
    );
    const delOrderId = delOrder.rows[0]!.id;

    const delMissingPartner = await request(app)
      .post(`/v1/admin/orders/${delOrderId}/dispatch`)
      .set('Authorization', `Bearer ${subWhAdminToken}`)
      .set('Idempotency-Key', newId())
      .send({});

    expect(delMissingPartner.status).toBe(409);
    expect(delMissingPartner.body.code).toBe('INVALID_STATE_TRANSITION');

    // 3. DELIVERY order with inactive partner -> 404 NOT_FOUND
    const delInactivePartner = await request(app)
      .post(`/v1/admin/orders/${delOrderId}/dispatch`)
      .set('Authorization', `Bearer ${subWhAdminToken}`)
      .set('Idempotency-Key', newId())
      .send({ deliveryPartnerId: inactivePartnerId });

    expect(delInactivePartner.status).toBe(404);
  });

  it('BR-159e: slot locking, unbooked slot booking, and full slot rejection', async () => {
    if (!ready) return;

    const slotDate = '2031-11-20';
    // Ensure clean slot setup for this test
    await pool.query(
      `INSERT INTO delivery_slots (warehouse_id, slot_date, slot, capacity_orders, booked_orders, is_active)
       VALUES ($1, $2, 'MORNING_8_12', 10, 2, true),
              ($1, $2, 'AFTERNOON_12_4', 5, 5, true)
       ON CONFLICT (warehouse_id, slot_date, slot)
       DO UPDATE SET capacity_orders = EXCLUDED.capacity_orders, booked_orders = EXCLUDED.booked_orders, is_active = true`,
      [warehouseId, slotDate],
    );

    // 1. Slot locking: order booked for MORNING_8_12 cannot be dispatched for AFTERNOON_12_4
    const bookedDelOrder = await pool.query<{ id: string }>(
      `INSERT INTO orders (order_number, warehouse_id, customer_id, channel, fulfilment_type, status, payment_method, payment_status, subtotal, delivery_fee, discount, gst_amount, total_amount, delivery_address_id, delivery_date, delivery_slot, packed_at)
       VALUES ($1, $2, $3, 'ONLINE', 'DELIVERY', 'PACKED', 'WALLET', 'PAID', 200, 40, 0, 10, 250, $4, $5, 'MORNING_8_12', now())
       RETURNING id`,
      [`DEL-SLOT-${newId().slice(0, 8)}`, warehouseId, customerId, addressId, slotDate],
    );
    const bookedDelOrderId = bookedDelOrder.rows[0]!.id;

    const slotMismatchFail = await request(app)
      .post(`/v1/admin/orders/${bookedDelOrderId}/dispatch`)
      .set('Authorization', `Bearer ${subWhAdminToken}`)
      .set('Idempotency-Key', newId())
      .send({
        deliveryPartnerId: activePartnerId,
        slot: 'AFTERNOON_12_4',
      });
    expect(slotMismatchFail.status).toBe(409);
    expect(slotMismatchFail.body.code).toBe('INVALID_STATE_TRANSITION');

    // 2. Pre-booked order dispatched with same slot: booked_orders in delivery_slots is unchanged (stays 2)
    const sameSlotDispatch = await request(app)
      .post(`/v1/admin/orders/${bookedDelOrderId}/dispatch`)
      .set('Authorization', `Bearer ${subWhAdminToken}`)
      .set('Idempotency-Key', newId())
      .send({
        deliveryPartnerId: activePartnerId,
        slot: 'MORNING_8_12',
      });
    expect(sameSlotDispatch.status).toBe(200);
    expect(sameSlotDispatch.body.status).toBe('OUT_FOR_DELIVERY');

    const slotCheck1 = await pool.query<{ booked_orders: number }>(
      `SELECT booked_orders FROM delivery_slots WHERE warehouse_id = $1 AND slot_date = $2 AND slot = 'MORNING_8_12'`,
      [warehouseId, slotDate],
    );
    expect(slotCheck1.rows[0]!.booked_orders).toBe(2);

    // 3. Unbooked order dispatched: booked_orders in delivery_slots increments by exactly 1 (2 -> 3)
    const unbookedOrder = await pool.query<{ id: string }>(
      `INSERT INTO orders (order_number, warehouse_id, customer_id, channel, fulfilment_type, status, payment_method, payment_status, subtotal, delivery_fee, discount, gst_amount, total_amount, delivery_address_id, delivery_date, packed_at)
       VALUES ($1, $2, $3, 'ONLINE', 'DELIVERY', 'PACKED', 'WALLET', 'PAID', 200, 40, 0, 10, 250, $4, $5, now())
       RETURNING id`,
      [`DEL-UNBOOKED-${newId().slice(0, 8)}`, warehouseId, customerId, addressId, slotDate],
    );
    const unbookedOrderId = unbookedOrder.rows[0]!.id;

    const unbookedDispatch = await request(app)
      .post(`/v1/admin/orders/${unbookedOrderId}/dispatch`)
      .set('Authorization', `Bearer ${subWhAdminToken}`)
      .set('Idempotency-Key', newId())
      .send({
        deliveryPartnerId: activePartnerId,
        slot: 'MORNING_8_12',
      });
    expect(unbookedDispatch.status).toBe(200);
    expect(unbookedDispatch.body.status).toBe('OUT_FOR_DELIVERY');

    const slotCheck2 = await pool.query<{ booked_orders: number }>(
      `SELECT booked_orders FROM delivery_slots WHERE warehouse_id = $1 AND slot_date = $2 AND slot = 'MORNING_8_12'`,
      [warehouseId, slotDate],
    );
    expect(slotCheck2.rows[0]!.booked_orders).toBe(3);

    // 4. Full slot: dispatch into full slot returns 409 CONFLICT, booked_orders is unchanged, order remains PACKED
    const fullSlotDelOrder = await pool.query<{ id: string }>(
      `INSERT INTO orders (order_number, warehouse_id, customer_id, channel, fulfilment_type, status, payment_method, payment_status, subtotal, delivery_fee, discount, gst_amount, total_amount, delivery_address_id, delivery_date, packed_at)
       VALUES ($1, $2, $3, 'ONLINE', 'DELIVERY', 'PACKED', 'WALLET', 'PAID', 200, 40, 0, 10, 250, $4, $5, now())
       RETURNING id`,
      [`DEL-FULL-${newId().slice(0, 8)}`, warehouseId, customerId, addressId, slotDate],
    );
    const fullSlotDelOrderId = fullSlotDelOrder.rows[0]!.id;

    const fullSlotFail = await request(app)
      .post(`/v1/admin/orders/${fullSlotDelOrderId}/dispatch`)
      .set('Authorization', `Bearer ${subWhAdminToken}`)
      .set('Idempotency-Key', newId())
      .send({
        deliveryPartnerId: activePartnerId,
        slot: 'AFTERNOON_12_4',
      });
    expect(fullSlotFail.status).toBe(409);
    expect(fullSlotFail.body.code).toBe('CONFLICT');

    // Assert booked_orders is unchanged (remains 5)
    const slotCheck3 = await pool.query<{ booked_orders: number }>(
      `SELECT booked_orders FROM delivery_slots WHERE warehouse_id = $1 AND slot_date = $2 AND slot = 'AFTERNOON_12_4'`,
      [warehouseId, slotDate],
    );
    expect(slotCheck3.rows[0]!.booked_orders).toBe(5);

    // Assert order status in DB remains PACKED
    const orderCheck = await pool.query<{ status: string }>(
      `SELECT status FROM orders WHERE id = $1`,
      [fullSlotDelOrderId],
    );
    expect(orderCheck.rows[0]!.status).toBe('PACKED');

    // 5. Unbooked DELIVERY order with no delivery_date returns 409 INVALID_STATE_TRANSITION and writes nothing
    const noDateDelOrder = await pool.query<{ id: string }>(
      `INSERT INTO orders (order_number, warehouse_id, customer_id, channel, fulfilment_type, status, payment_method, payment_status, subtotal, delivery_fee, discount, gst_amount, total_amount, delivery_address_id, delivery_date, packed_at)
       VALUES ($1, $2, $3, 'ONLINE', 'DELIVERY', 'PACKED', 'WALLET', 'PAID', 200, 40, 0, 10, 250, $4, NULL, now())
       RETURNING id`,
      [`DEL-NODATE-${newId().slice(0, 8)}`, warehouseId, customerId, addressId],
    );
    const noDateDelOrderId = noDateDelOrder.rows[0]!.id;

    const noDateHistoryBefore = (await pool.query(
      `SELECT count(*) FROM order_status_history WHERE order_id = $1`,
      [noDateDelOrderId],
    )).rows[0]!.count;
    const auditBefore = (await pool.query(
      `SELECT count(*) FROM audit_log WHERE entity_id = $1`,
      [noDateDelOrderId],
    )).rows[0]!.count;

    const noDateFail = await request(app)
      .post(`/v1/admin/orders/${noDateDelOrderId}/dispatch`)
      .set('Authorization', `Bearer ${subWhAdminToken}`)
      .set('Idempotency-Key', newId())
      .send({
        deliveryPartnerId: activePartnerId,
        slot: 'MORNING_8_12',
      });
    expect(noDateFail.status).toBe(409);
    expect(noDateFail.body.code).toBe('INVALID_STATE_TRANSITION');
    expect(noDateFail.body.detail).toBe('Cannot dispatch a delivery order with no delivery date.');

    // Assert order status in DB remains PACKED and delivery_date remains NULL
    const noDateOrderCheck = await pool.query<{ status: string; delivery_date: string | null }>(
      `SELECT status, delivery_date FROM orders WHERE id = $1`,
      [noDateDelOrderId],
    );
    expect(noDateOrderCheck.rows[0]!.status).toBe('PACKED');
    expect(noDateOrderCheck.rows[0]!.delivery_date).toBeNull();

    // Assert 0 rows written to order_status_history and audit_log
    const noDateHistoryAfter = (await pool.query(
      `SELECT count(*) FROM order_status_history WHERE order_id = $1`,
      [noDateDelOrderId],
    )).rows[0]!.count;
    const auditAfter = (await pool.query(
      `SELECT count(*) FROM audit_log WHERE entity_id = $1`,
      [noDateDelOrderId],
    )).rows[0]!.count;
    expect(noDateHistoryAfter).toBe(noDateHistoryBefore);
    expect(auditAfter).toBe(auditBefore);
  });

  it('BR-99 & BR-159d: GET /admin/orders/{id} exposes deliveryAddress for DELIVERY orders and null for PICKUP orders', async () => {
    if (!ready) return;

    // 1. DELIVERY order detail has deliveryAddress and masked mobile
    const delOrder = await pool.query<{ id: string }>(
      `INSERT INTO orders (order_number, warehouse_id, customer_id, channel, fulfilment_type, status, payment_method, payment_status, subtotal, delivery_fee, discount, gst_amount, total_amount, delivery_address_id, delivery_partner_id, delivery_slot, placed_at)
       VALUES ($1, $2, $3, 'ONLINE', 'DELIVERY', 'OUT_FOR_DELIVERY', 'WALLET', 'PAID', 500, 40, 0, 25, 565, $4, $5, 'AFTERNOON_12_4', now())
       RETURNING id`,
      [`DEL-DET-${newId().slice(0, 8)}`, warehouseId, customerId, addressId, activePartnerId],
    );
    const delOrderId = delOrder.rows[0]!.id;

    const delDetailRes = await request(app)
      .get(`/v1/admin/orders/${delOrderId}`)
      .set('Authorization', `Bearer ${subWhAdminToken}`);

    expect(delDetailRes.status).toBe(200);
    expect(delDetailRes.body).toMatchObject({
      id: delOrderId,
      fulfilmentType: 'DELIVERY',
      deliverySlot: 'AFTERNOON_12_4',
      deliveryAddress: {
        line1: '42 Nilgiri Hills Road',
        line2: 'Near Tea Estate',
        city: 'Coonoor',
        district: 'The Nilgiris',
        state: 'Tamil Nadu',
        pincode: '643101',
        lat: 11.3532,
        lng: 76.7954,
      },
      deliveryPartner: {
        id: activePartnerId,
        name: 'Express Rider',
        phone: '+919111111111',
        vehicleRef: 'TN-43-E-1001',
      },
    });
    // Customer mobile remains masked to last 4 digits (BR-92)
    expect(delDetailRes.body.buyer.mobileMasked).toMatch(/^\*+[0-9]{4}$/);

    // 2. PICKUP order detail has null deliveryAddress and null deliveryPartner
    const pickOrder = await pool.query<{ id: string }>(
      `INSERT INTO orders (order_number, warehouse_id, customer_id, channel, fulfilment_type, status, payment_method, payment_status, subtotal, delivery_fee, discount, gst_amount, total_amount, placed_at)
       VALUES ($1, $2, $3, 'ONLINE', 'PICKUP', 'CONFIRMED', 'WALLET', 'PAID', 300, 0, 0, 15, 315, now())
       RETURNING id`,
      [`PICK-DET-${newId().slice(0, 8)}`, warehouseId, customerId],
    );
    const pickOrderId = pickOrder.rows[0]!.id;

    const pickDetailRes = await request(app)
      .get(`/v1/admin/orders/${pickOrderId}`)
      .set('Authorization', `Bearer ${subWhAdminToken}`);

    expect(pickDetailRes.status).toBe(200);
    expect(pickDetailRes.body).toMatchObject({
      id: pickOrderId,
      fulfilmentType: 'PICKUP',
      deliveryAddress: null,
      deliveryPartner: null,
    });

    // 3. List endpoint GET /admin/orders never leaks full address (P0-70 constraint)
    const listRes = await request(app)
      .get('/v1/admin/orders')
      .set('Authorization', `Bearer ${subWhAdminToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.items.length).toBeGreaterThan(0);
    const EXPECTED_KEYS = [
      'buyerName',
      'channel',
      'customerMobileMasked',
      'customerName',
      'deliveryDate',
      'fulfillmentType',
      'id',
      'itemCount',
      'orderNumber',
      'packedAt',
      'paymentStatus',
      'placedAt',
      'readyAt',
      'status',
      'totalAmount',
      'warehouseId',
    ].sort();
    for (const item of listRes.body.items) {
      expect(Object.keys(item).sort()).toEqual(EXPECTED_KEYS);
    }
  });

  afterAll(async () => {
    if (!ready) return;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SET LOCAL session_replication_role = replica');
      await client.query(
        `DELETE FROM order_status_history WHERE order_id IN (SELECT id FROM orders WHERE customer_id = $1)`,
        [customerId],
      );
      await client.query(
        `DELETE FROM audit_log WHERE entity_type = 'orders' AND entity_id IN (SELECT id FROM orders WHERE customer_id = $1)`,
        [customerId],
      );
      await client.query(`DELETE FROM orders WHERE customer_id = $1`, [customerId]);
      await client.query(
        `DELETE FROM delivery_slots WHERE warehouse_id = $1 AND slot_date IN ('2031-10-15', '2031-11-20')`,
        [warehouseId],
      );
      await client.query(`DELETE FROM customer_addresses WHERE id = $1`, [addressId]);
      await client.query(`DELETE FROM customers WHERE id = $1`, [customerId]);
      await client.query(`DELETE FROM delivery_partners WHERE id IN ($1, $2)`, [
        activePartnerId,
        inactivePartnerId,
      ]);
      await client.query(`DELETE FROM users WHERE id IN ($1, $2)`, [
        subWhAdminUserId,
        customerUserId,
      ]);
      await client.query('COMMIT');
    } catch {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });
});
