/**
 * D-01 end to end: the cart stores integer-paise, half-up line totals (also across a merged
 * repeat add), and the checkout arithmetic over the stored lines gives exactly the cart subtotal.
 */
import { beforeAll, expect, it } from 'vitest';
import request from 'supertest';
import type { Money } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { pool } from '../../db/pool.js';
import { databaseReady, describeIfDatabase, newId } from '../../test/factories.js';
import { computeCheckoutTotals } from '../orders/orders.pricing.js';

describeIfDatabase('Cart money: integer paise in the stored cart (D-01, BR-22)', () => {
  let ready = false;
  const app = createApp();
  const rand = Math.floor(100000 + Math.random() * 900000);
  const ids = { wh: newId(), cu: newId(), cust: newId(), fu: newId(), farmer: newId(), admin: newId(), cropA: newId(), cropB: newId() };
  let token = '';

  beforeAll(async () => {
    ready = await databaseReady('carts');
    if (!ready) return;
    await pool.query(
      `INSERT INTO warehouses (id, code, name, type, address, city, pincode)
       VALUES ($1, $2, 'Money Cart WH', 'MAIN', '1 Paise Rd', 'Coonoor', '643101')`,
      [ids.wh, `WH-CM-${rand}`],
    );
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES
         ($1, $4, 'Money Customer', 'CUSTOMER', 'ACTIVE'),
         ($2, $5, 'Money Farmer', 'FARMER', 'ACTIVE'),
         ($3, $6, 'Money Admin', 'ADMIN', 'ACTIVE')`,
      [ids.cu, ids.fu, ids.admin, `+919611${rand}`, `+919622${rand}`, `+919633${rand}`],
    );
    await pool.query(`INSERT INTO customers (id, user_id, customer_code) VALUES ($1, $2, $3)`, [ids.cust, ids.cu, `CUST-CM-${rand}`]);
    await pool.query(
      `INSERT INTO farmers (id, user_id, tohfa_farmer_id, application_status) VALUES ($1, $2, $3, 'APPROVED')`,
      [ids.farmer, ids.fu, `FARM-CM-${rand}`],
    );
    const cat = await pool.query<{ id: string }>(`SELECT id FROM categories LIMIT 1`);
    for (const [crop, price, tag] of [[ids.cropA, '0.15', 'a'], [ids.cropB, '33.33', 'b']] as const) {
      await pool.query(`INSERT INTO crop_master (id, category_id, slug, name) VALUES ($1, $2, $3, $4)`, [
        crop, cat.rows[0]!.id, `crop-cm-${tag}-${rand}`, `Money Crop ${tag} ${rand}`,
      ]);
      await pool.query(
        `INSERT INTO retail_prices (crop_id, grade, price, effective_from, set_by)
         VALUES ($1, 'GRADE_1', $2::numeric, CURRENT_DATE - interval '1 day', $3)`,
        [crop, price, ids.admin],
      );
      const batch = newId();
      await pool.query(
        `INSERT INTO inventory_batches (id, batch_code, warehouse_id, crop_id, grade, source_farmer_id, qty_received, qty_available, status)
         VALUES ($1, $2, $3, $4, 'GRADE_1', $5, 100.000, 100.000, 'ACTIVE')`,
        [batch, `BATCH-CM-${tag}-${rand}`, ids.wh, crop, ids.farmer],
      );
      await pool.query(
        `INSERT INTO allocations (id, batch_id, warehouse_id, channel, allocated_qty, consumed_qty, reserved_qty)
         VALUES ($1, $2, $3, 'ONLINE', 50.000, 0, 0)`,
        [newId(), batch, ids.wh],
      );
    }
    token = signAccessToken({ sub: ids.cu, roles: [{ code: 'CUSTOMER' }], farmerId: null, customerId: ids.cust });
  });

  it('half-up paise per line, exact on a merged repeat add, and cart subtotal == checkout subtotal', async () => {
    if (!ready) return;
    const add = (productId: string, qtyKg: string) =>
      request(app).post('/v1/cart/items').set('Authorization', `Bearer ${token}`).send({ productId, grade: 'GRADE_1', qtyKg });

    // 0.15/kg x 0.300 kg = 0.045 -> 0.05 half-up (Number()*Number().toFixed(2) gave "0.04").
    let res = await add(ids.cropA, '0.300');
    expect(res.status).toBe(201);
    expect(res.body.items[0]).toMatchObject({ qtyKg: '0.300', unitPrice: '0.15', lineTotal: '0.05' });
    expect(res.body.subtotal).toBe('0.05');

    // Merge: the line is re-priced from the merged 0.600 kg (0.09), not 0.05 + 0.05.
    res = await add(ids.cropA, '0.300');
    expect(res.status).toBe(201);
    expect(res.body.items[0]).toMatchObject({ qtyKg: '0.600', lineTotal: '0.09' });

    // 33.33/kg x 0.333 kg = 11.09889 -> 11.10.
    res = await add(ids.cropB, '0.333');
    expect(res.status).toBe(201);
    const lineB = (res.body.items as Array<{ productId: string; lineTotal: string }>).find((i) => i.productId === ids.cropB);
    expect(lineB?.lineTotal).toBe('11.10');
    expect(res.body.subtotal).toBe('11.19');

    // Checkout reads exactly the stored line totals; its subtotal must equal the cart's.
    const stored = await pool.query<{ line_total: string }>(
      `SELECT ci.line_total::text FROM cart_items ci JOIN carts c ON c.id = ci.cart_id
        WHERE c.customer_id = $1 AND ci.status = 'HELD'`,
      [ids.cust],
    );
    const checkout = computeCheckoutTotals({
      lineTotals: stored.rows.map((r) => r.line_total),
      fulfilment: 'PICKUP',
      deliveryFee: '40.00' as Money,
      freeDeliveryThreshold: '500.00' as Money,
      gstRateBasisPoints: 500,
    });
    expect(checkout.subtotal).toBe(res.body.subtotal);
    expect(checkout.gstAmount).toBe('0.56'); // round_half_up(1119 * 5%) = 55.95 -> 56 paise
    expect(checkout.totalAmount).toBe('11.75');
  });
});
