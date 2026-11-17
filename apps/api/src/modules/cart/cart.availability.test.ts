/**
 * BR-203: every held cart line carries a stock flag (OK | LOW_STOCK | UNAVAILABLE) and
 * `availableKg`, from the same BR-100 shelf figures the reservation uses, so the UI can flag a line
 * before checkout fails.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { pool } from '../../db/pool.js';
import { databaseReady, describeIfDatabase, newId } from '../../test/factories.js';
import { classifyCartLine, lowStockThresholdGrams } from './cart.service.js';

describe('BR-203: cart line stock flag (pure)', () => {
  it('BR-203a: a fully backed line with plenty more is OK; availableKg = hold + further stock', () => {
    expect(classifyCartLine('2.000', '2.000', '10.000', 2000)).toEqual({ availability: 'OK', availableKg: '12.000' });
  });

  it('BR-203b: a fully backed line with little more stock is LOW_STOCK', () => {
    expect(classifyCartLine('2.000', '2.000', '1.999', 2000)).toEqual({ availability: 'LOW_STOCK', availableKg: '3.999' });
  });

  it('BR-203c: a hold no longer fully on the shelf is UNAVAILABLE, whatever else exists', () => {
    expect(classifyCartLine('2.000', '1.500', '50.000', 2000).availability).toBe('UNAVAILABLE');
    expect(classifyCartLine('2.000', '0.000', '0.000', 2000)).toEqual({ availability: 'UNAVAILABLE', availableKg: '0.000' });
  });

  it('BR-203d: the threshold comes from config, invalid values fall back to the 2 kg default', () => {
    expect(lowStockThresholdGrams(5)).toBe(5000);
    expect(lowStockThresholdGrams('0.5')).toBe(500);
    expect(lowStockThresholdGrams('abc')).toBe(2000);
    expect(lowStockThresholdGrams(undefined)).toBe(2000);
  });
});

describeIfDatabase('BR-203: GET /v1/cart line availability (integration)', () => {
  const app = createApp();
  let ready = false;
  let token = '';
  let cropPlenty = '';
  let cropScarce = '';
  let batchPlenty = '';
  let warehouseId = '';

  beforeAll(async () => {
    ready = await databaseReady('cart_items');
    if (!ready) return;
    const rand = Math.floor(100000 + Math.random() * 900000);
    warehouseId = newId();
    const userId = newId();
    const customerId = newId();
    const farmerUserId = newId();
    const farmerId = newId();
    const adminUserId = newId();
    await pool.query(
      `INSERT INTO warehouses (id, code, name, type, address, city, pincode)
       VALUES ($1, $2, 'Avail WH', 'MAIN', '1 Rd', 'Ooty', '643001')`,
      [warehouseId, `WH-AV-${rand}`],
    );
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES
         ($1, $2, 'Avail C', 'CUSTOMER', 'ACTIVE'), ($3, $4, 'Avail F', 'FARMER', 'ACTIVE'), ($5, $6, 'Avail A', 'ADMIN', 'ACTIVE')`,
      [userId, `+919866${rand}`, farmerUserId, `+919877${rand}`, adminUserId, `+919888${rand}`],
    );
    await pool.query(`INSERT INTO customers (id, user_id, customer_code) VALUES ($1, $2, $3)`, [customerId, userId, `CUST-AV-${rand}`]);
    await pool.query(
      `INSERT INTO farmers (id, user_id, tohfa_farmer_id, application_status) VALUES ($1, $2, $3, 'APPROVED')`,
      [farmerId, farmerUserId, `FARM-AV-${rand}`],
    );
    const cat = await pool.query<{ id: string }>(`SELECT id FROM categories LIMIT 1`);
    cropPlenty = newId();
    cropScarce = newId();
    for (const [id, slug] of [[cropPlenty, 'plenty'], [cropScarce, 'scarce']] as const) {
      await pool.query(`INSERT INTO crop_master (id, category_id, slug, name) VALUES ($1, $2, $3, $4)`, [id, cat.rows[0]!.id, `av-${slug}-${rand}`, `Avail ${slug} ${rand}`]);
      await pool.query(
        `INSERT INTO retail_prices (crop_id, grade, price, effective_from, set_by) VALUES ($1, 'GRADE_1', 50.00, CURRENT_DATE - interval '1 day', $2)`,
        [id, adminUserId],
      );
    }
    batchPlenty = newId();
    const batchScarce = newId();
    await pool.query(
      `INSERT INTO inventory_batches (id, batch_code, warehouse_id, crop_id, grade, source_farmer_id, qty_received, qty_available, status)
       VALUES ($1, $2, $3, $4, 'GRADE_1', $5, 100.000, 100.000, 'ACTIVE'), ($6, $7, $3, $8, 'GRADE_1', $5, 3.000, 3.000, 'ACTIVE')`,
      [batchPlenty, `B-AVP-${rand}`, warehouseId, cropPlenty, farmerId, batchScarce, `B-AVS-${rand}`, cropScarce],
    );
    await pool.query(
      `INSERT INTO allocations (batch_id, warehouse_id, channel, allocated_qty, consumed_qty, reserved_qty)
       VALUES ($1, $3, 'ONLINE', 50.000, 0, 0), ($2, $3, 'ONLINE', 3.000, 0, 0)`,
      [batchPlenty, batchScarce, warehouseId],
    );
    token = signAccessToken({ sub: userId, roles: [{ code: 'CUSTOMER' }], farmerId: null, customerId });
  });

  it('BR-203: lines read OK / LOW_STOCK with availableKg, then UNAVAILABLE once the batch leaves the shelf', async () => {
    if (!ready) return;
    const auth = { Authorization: `Bearer ${token}` };
    const put = await request(app)
      .put('/v1/cart')
      .set(auth)
      .send({ warehouseId, items: [{ productId: cropPlenty, grade: 'GRADE_1', qtyKg: '2.000' }, { productId: cropScarce, grade: 'GRADE_1', qtyKg: '2.000' }] });
    expect(put.status).toBe(200);
    // the write response carries the flag too
    expect(put.body.items.every((i: { availability?: string }) => typeof i.availability === 'string')).toBe(true);

    const cart = await request(app).get('/v1/cart').set(auth);
    expect(cart.status).toBe(200);
    const plenty = cart.body.items.find((i: { productId: string }) => i.productId === cropPlenty);
    const scarce = cart.body.items.find((i: { productId: string }) => i.productId === cropScarce);
    expect(plenty).toMatchObject({ availability: 'OK', availableKg: '50.000' });
    // 3 kg on the shelf, 2 kg held: 1 kg more is below the 2 kg default threshold.
    expect(scarce).toMatchObject({ availability: 'LOW_STOCK', availableKg: '3.000' });

    await pool.query(`UPDATE inventory_batches SET status = 'EXPIRED' WHERE id = $1`, [batchPlenty]);
    const after = await request(app).get('/v1/cart').set(auth);
    const gone = after.body.items.find((i: { productId: string }) => i.productId === cropPlenty);
    expect(gone).toMatchObject({ availability: 'UNAVAILABLE', availableKg: '0.000' });
  });
});
