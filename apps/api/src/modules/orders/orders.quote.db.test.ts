/**
 * BR-200 / BR-201 integration: POST /v1/orders/quote against a real database.
 *  - the quote total equals the total of the order then placed with the same body;
 *  - a quote changes no stock, cart, slot or wallet row;
 *  - a full delivery slot is 409 SLOT_FULL at quote and at checkout.
 */
import { beforeAll, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { pool } from '../../db/pool.js';
import { databaseReady, describeIfDatabase, newId } from '../../test/factories.js';

describeIfDatabase('BR-200: POST /v1/orders/quote (integration)', () => {
  const app = createApp();
  let ready = false;
  let token = '';
  let warehouseId = '';
  let cropId = '';
  let allocationId = '';
  let addressId = '';
  let customerId = '';
  const date = '2999-03-01';

  beforeAll(async () => {
    ready = await databaseReady('orders');
    if (!ready) return;
    const rand = Math.floor(100000 + Math.random() * 900000);
    warehouseId = newId();
    const userId = newId();
    customerId = newId();
    const farmerUserId = newId();
    const farmerId = newId();
    const adminId = newId();
    addressId = newId();
    await pool.query(`INSERT INTO warehouses (id, code, name, type, address, city, pincode) VALUES ($1, $2, 'Quote WH', 'MAIN', '1 Rd', 'Ooty', '643001')`, [warehouseId, `WH-Q-${rand}`]);
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, 'Quote C', 'CUSTOMER', 'ACTIVE'), ($3, $4, 'Quote F', 'FARMER', 'ACTIVE'), ($5, $6, 'Quote A', 'ADMIN', 'ACTIVE')`,
      [userId, `+919711${rand}`, farmerUserId, `+919722${rand}`, adminId, `+919733${rand}`],
    );
    await pool.query(`INSERT INTO customers (id, user_id, customer_code) VALUES ($1, $2, $3)`, [customerId, userId, `CUST-Q-${rand}`]);
    await pool.query(`INSERT INTO customer_addresses (id, customer_id, label, line1, city, pincode, is_default) VALUES ($1, $2, 'HOME', '1 Lane', 'Ooty', '643004', true)`, [addressId, customerId]);
    await pool.query(`INSERT INTO farmers (id, user_id, tohfa_farmer_id, application_status) VALUES ($1, $2, $3, 'APPROVED')`, [farmerId, farmerUserId, `FARM-Q-${rand}`]);
    const w = newId();
    await pool.query(`INSERT INTO wallets (id, owner_type, customer_id, balance, currency, status) VALUES ($1, 'CUSTOMER', $2, 0, 'INR', 'ACTIVE')`, [w, customerId]);
    await pool.query(
      `INSERT INTO wallet_transactions (wallet_id, idempotency_key, direction, type, amount, balance_after, ref_type, ref_id, remarks)
       VALUES ($1, $2, 'CREDIT', 'TOPUP_DIGITAL', 5000.00, 5000.00, 'TOPUP', gen_random_uuid(), 'seed')`,
      [w, `seed-${w}`],
    );
    const cat = await pool.query<{ id: string }>(`SELECT id FROM categories LIMIT 1`);
    cropId = newId();
    await pool.query(`INSERT INTO crop_master (id, category_id, slug, name) VALUES ($1, $2, $3, $4)`, [cropId, cat.rows[0]!.id, `quote-${rand}`, `Quote Leek ${rand}`]);
    await pool.query(`INSERT INTO retail_prices (crop_id, grade, price, effective_from, set_by) VALUES ($1, 'GRADE_1', 33.33, CURRENT_DATE - interval '1 day', $2)`, [cropId, adminId]);
    const batchId = newId();
    allocationId = newId();
    await pool.query(
      `INSERT INTO inventory_batches (id, batch_code, warehouse_id, crop_id, grade, source_farmer_id, qty_received, qty_available, status)
       VALUES ($1, $2, $3, $4, 'GRADE_1', $5, 100.000, 100.000, 'ACTIVE')`,
      [batchId, `B-Q-${rand}`, warehouseId, cropId, farmerId],
    );
    await pool.query(`INSERT INTO allocations (id, batch_id, warehouse_id, channel, allocated_qty, consumed_qty, reserved_qty) VALUES ($1, $2, $3, 'ONLINE', 50.000, 0, 0)`, [allocationId, batchId, warehouseId]);
    await pool.query(
      `INSERT INTO delivery_slots (warehouse_id, slot_date, slot, capacity_orders, booked_orders) VALUES ($1, $2, 'MORNING_8_12', 1, 1), ($1, $2, 'EVENING_4_8', 5, 0)`,
      [warehouseId, date],
    );
    token = signAccessToken({ sub: userId, roles: [{ code: 'CUSTOMER' }], farmerId: null, customerId });
  });

  async function snapshot() {
    const r = await pool.query(
      `SELECT (SELECT reserved_qty::text FROM allocations WHERE id = $1) AS reserved,
              (SELECT balance::text FROM wallets WHERE customer_id = $2) AS balance,
              (SELECT string_agg(status || ':' || subtotal::text, ',') FROM carts WHERE customer_id = $2) AS carts,
              (SELECT string_agg(slot::text || ':' || booked_orders, ',' ORDER BY slot) FROM delivery_slots WHERE warehouse_id = $3) AS slots,
              (SELECT count(*)::int FROM orders WHERE customer_id = $2) AS orders`,
      [allocationId, customerId, warehouseId],
    );
    return r.rows[0];
  }

  it('BR-200: quote is read-only and its total equals the placed order total; BR-201: full slot is SLOT_FULL', async () => {
    if (!ready) return;
    const auth = { Authorization: `Bearer ${token}` };
    const put = await request(app).put('/v1/cart').set(auth).send({ warehouseId, items: [{ productId: cropId, grade: 'GRADE_1', qtyKg: '3.333' }] });
    expect(put.status).toBe(200);

    const body = { fulfillmentType: 'HOME_DELIVERY', warehouseId, deliveryAddressId: addressId, deliveryDate: date, deliverySlot: 'EVENING_4_8', paymentMethod: 'WALLET' };
    const before = await snapshot();
    const quote = await request(app).post('/v1/orders/quote').set(auth).send(body);
    expect(quote.status).toBe(200);
    expect(await snapshot()).toEqual(before);
    expect(quote.body).toMatchObject({
      itemCount: 1,
      lockExpired: false,
      walletBalance: '5000.00',
      walletSufficient: true,
      shortfall: '0.00',
      slot: { slot: 'EVENING_4_8', capacity: 5, booked: 0, available: 5, bookable: true },
    });

    const full = await request(app).post('/v1/orders/quote').set(auth).send({ ...body, deliverySlot: 'MORNING_8_12' });
    expect(full.status).toBe(409);
    expect(full.body.code).toBe('SLOT_FULL');
    const fullCheckout = await request(app).post('/v1/orders').set(auth).set('Idempotency-Key', newId()).send({ ...body, deliverySlot: 'MORNING_8_12' });
    expect(fullCheckout.status).toBe(409);
    expect(fullCheckout.body.code).toBe('SLOT_FULL');

    const placed = await request(app).post('/v1/orders').set(auth).set('Idempotency-Key', newId()).send(body);
    expect(placed.status).toBe(201);
    expect(placed.body.totalAmount).toBe(quote.body.totalAmount);
    expect(placed.body.subtotal).toBe(quote.body.subtotal);
    expect(placed.body.deliveryFee).toBe(quote.body.deliveryFee);
    expect(placed.body.handlingFee).toBe(quote.body.handlingFee);
    expect(placed.body.gstAmount).toBe(quote.body.gstAmount);
  });

  it('BR-200: no cart is 404; anonymous is 401', async () => {
    if (!ready) return;
    const body = { fulfillmentType: 'PICKUP', warehouseId, paymentMethod: 'WALLET' };
    const empty = await request(app).post('/v1/orders/quote').set({ Authorization: `Bearer ${token}` }).send(body);
    expect(empty.status).toBe(404);
    const anon = await request(app).post('/v1/orders/quote').send(body);
    expect(anon.status).toBe(401);
  });
});
