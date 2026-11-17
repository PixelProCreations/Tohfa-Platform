/**
 * Customer-backend smoke: address -> catalog -> cart -> checkout -> order list -> reorder -> wishlist
 * -> support ticket -> admin sees the ticket. Needs a LOCAL throwaway database (dbSafety guards it).
 */
import { createHash } from 'node:crypto';
import type { Express } from 'express';
import request from 'supertest';
import { beforeAll, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { createApp } from './app.js';
import { signAccessToken } from './auth/jwt.js';
import { pool } from './db/pool.js';
import { aScope, describeIfDatabase, newId } from './test/factories.js';
import { inventoryService } from './modules/inventory/inventory.service.js';

describeIfDatabase('customer backend smoke', () => {
  let app: Express;
  let custTok: string;
  let adminTok: string;
  let customerId: string;
  const mobile = `+919844${String(Date.now()).slice(-6)}`;
  let cropId: string;
  let whId: string;
  let orderId: string;
  const ts = Date.now();

  beforeAll(async () => {
    app = createApp();
    const q = async <T>(sql: string, p: unknown[] = []) => (await pool.query(sql, p)).rows as T[];
    whId = (await q<{ id: string }>(
      `INSERT INTO warehouses (code, name, address, lat, lng, capacity_kg, is_active)
       VALUES ('WH-SMK', 'Smoke WH', 'Ooty', 11.41, 76.69, 50000, true)
       ON CONFLICT (code) DO UPDATE SET is_active = true RETURNING id`))[0]!.id;
    const zoneId = (await q<{ id: string }>(
      `INSERT INTO zones (code, name, is_active) VALUES ('ZONE_SMK','Smoke Zone',true)
       ON CONFLICT (code) DO UPDATE SET is_active = true RETURNING id`))[0]!.id;
    const catId = (await q<{ id: string }>(
      `INSERT INTO categories (slug, name, sort_order) VALUES ('smoke-veg','Smoke Veg',1)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id`))[0]!.id;
    cropId = (await q<{ id: string }>(
      `INSERT INTO crop_master (slug, name, category_id, default_unit) VALUES ('smoke-carrot','Smoke Carrot',$1,'kg')
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id`, [catId]))[0]!.id;
    const adminUser = newId();
    await q(`INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1,$2,'Smoke Admin','ADMIN','ACTIVE')`,
      [adminUser, `+919811${String(ts).slice(-6)}`]);
    adminTok = signAccessToken({ sub: adminUser, roles: [{ code: RoleCode.SUPER_ADMIN }], farmerId: null, customerId: null });
    const fUser = newId();
    await q(`INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1,$2,'Smoke Farmer','FARMER','ACTIVE')`,
      [fUser, `+919872${String(ts).slice(-6)}`]);
    const farmerId = (await q<{ id: string }>(
      `INSERT INTO farmers (user_id, tohfa_farmer_id, zone_id, application_status, kyc_status, is_market_blocked)
       VALUES ($1,$2,$3,'APPROVED','VERIFIED',false) RETURNING id`, [fUser, `TF-SMK-${ts}`, zoneId]))[0]!.id;
    const whUser = newId();
    await q(`INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1,$2,'Smoke WH','ADMIN','ACTIVE')`,
      [whUser, `+919833${String(ts).slice(-6)}`]);
    await inventoryService.createBatchWithReceipt(
      { userId: whUser, roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: whId }], farmerId: null, customerId: null },
      aScope({ level: ScopeLevel.OWN, permission: 'inventory.batch.assign', roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds: [whId], userId: whUser }),
      { batchCode: `BAT-SMK-${ts}`, warehouseId: whId, cropId, grade: 'GRADE_1', sourceFarmerId: farmerId, qtyReceivedKg: '1000.000', receivedOn: '2026-08-28' },
    );
    await q(`INSERT INTO retail_prices (crop_id, grade, price, effective_from, set_by)
             VALUES ($1,'GRADE_1',110.00,CURRENT_DATE,$2)
             ON CONFLICT (crop_id, grade, effective_from) DO UPDATE SET price = 110.00`, [cropId, adminUser]);
  });

  const c = () => ({ Authorization: `Bearer ${custTok}` });

  it('runs the customer journey end to end', async () => {
    // Passwordless sign-in: send -> verify auto-registers a brand-new number.
    const send = await request(app).post('/v1/auth/customer/otp/send').send({ mobile });
    expect(send.status, JSON.stringify(send.body)).toBe(202);
    // The code is only ever stored hashed; pin a known one on this challenge.
    await pool.query('UPDATE otp_verifications SET code_hash = $1 WHERE id = $2',
      [createHash('sha256').update('123456').digest('hex'), send.body.challengeId]);
    const verify = await request(app).post('/v1/auth/customer/otp/verify')
      .send({ mobile, challengeId: send.body.challengeId, otp: '123456' });
    expect(verify.status, JSON.stringify(verify.body)).toBe(200);
    expect(verify.body.isNewUser).toBe(true);
    custTok = verify.body.accessToken;
    customerId = (await pool.query(
      `SELECT c.id FROM customers c JOIN users u ON u.id = c.user_id WHERE u.mobile = $1`, [mobile])).rows[0]!.id;
    // Fund the new wallet so checkout can pay (the ledger tests do the same by SQL).
    await pool.query(`UPDATE wallets SET balance = 5000 WHERE customer_id = $1`, [customerId]);

    const named = await request(app).patch('/v1/customers/me').set(c()).send({ fullName: 'Smoke Customer' });
    expect(named.status, JSON.stringify(named.body)).toBe(200);
    expect(JSON.stringify(named.body)).toContain('Smoke Customer');

    const addr = await request(app).post('/v1/customers/me/addresses').set(c())
      .send({ line1: '12 Church Rd', city: 'Ooty', pincode: '643001', lat: 11.41, lng: 76.69, isDefault: true });
    expect(addr.status, JSON.stringify(addr.body)).toBe(201);
    const list = await request(app).get('/v1/customers/me/addresses').set(c());
    expect(list.status).toBe(200);

    const pickup = await request(app).get('/v1/pickup-points').set(c());
    expect(pickup.status, JSON.stringify(pickup.body)).toBe(200);

    const cat = await request(app).get('/v1/catalog/products').set(c());
    expect(cat.status, JSON.stringify(cat.body)).toBe(200);
    const search = await request(app).get('/v1/catalog/search?q=smoke').set(c());
    expect(search.status, JSON.stringify(search.body)).toBe(200);

    const cart = await request(app).post('/v1/cart/items').set(c()).send({ productId: cropId, qtyKg: '5.000' });
    expect([200, 201], JSON.stringify(cart.body)).toContain(cart.status);

    const order = await request(app).post('/v1/orders').set(c()).set('Idempotency-Key', newId())
      .send({ fulfillmentType: 'PICKUP', warehouseId: whId });
    expect(order.status, JSON.stringify(order.body)).toBe(201);
    orderId = order.body.id;

    const orders = await request(app).get('/v1/orders').set(c());
    expect(orders.status, JSON.stringify(orders.body)).toBe(200);
    expect(JSON.stringify(orders.body)).toContain(orderId);

    const re = await request(app).post(`/v1/orders/${orderId}/reorder`).set(c()).set('Idempotency-Key', newId()).send({});
    expect(re.status, JSON.stringify(re.body)).toBeLessThan(300);

    const wl = await request(app).post('/v1/wishlist').set(c()).send({ productId: cropId, grade: 'GRADE_1' });
    expect(wl.status, JSON.stringify(wl.body)).toBeLessThan(300);
    const wlGet = await request(app).get('/v1/wishlist').set(c());
    expect(wlGet.status).toBe(200);

    const tk = await request(app).post('/v1/support/tickets').set(c())
      .send({ category: 'QUALITY', subject: 'Smoke ticket', description: 'Carrots were soft', orderId });
    expect(tk.status, JSON.stringify(tk.body)).toBe(201);

    const adm = await request(app).get(`/v1/admin/customers/${customerId}/support-tickets`)
      .set('Authorization', `Bearer ${adminTok}`);
    expect(adm.status, JSON.stringify(adm.body)).toBe(200);
    expect(JSON.stringify(adm.body)).toContain('Smoke ticket');
  });
});
