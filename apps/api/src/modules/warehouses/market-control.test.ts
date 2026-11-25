/**
 * Warehouse Market Open/Close + Schedule + Checkout Enforcement (BR-243 — D13):
 *  - GET /v1/warehouses/:id/market-status (public/customer read)
 *  - GET/POST /v1/admin/warehouses/:id/market-status (market.schedule.manage)
 *  - GET/POST/PATCH/DELETE /v1/admin/warehouses/:id/market-schedules (market.schedule.manage)
 *  - Cart addItem + Order checkout enforce open market (409 CONFLICT reason='MARKET_CLOSED')
 */
import type { Server } from 'node:http';
import request from 'supertest';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { RoleCode } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { pool } from '../../db/pool.js';
import { describeIfDatabase, newId } from '../../test/factories.js';

function randomMobile(): string {
  return `+917${Math.floor(100000000 + Math.random() * 899999999)}`;
}

describeIfDatabase('Warehouse Market Open/Close & Schedules HTTP (BR-243)', () => {
  let server: Server;
  let ready = false;

  const superAdminId = newId();
  const tohfaAdminId = newId();
  const subWhAdminId = newId();
  const customerUserId = newId();
  const customerId = newId();
  const farmerUserId = newId();
  const farmerId = newId();
  const warehouseId = newId();
  const cropId = newId();
  const batchId = newId();
  const allocationId = newId();

  const token = (userId: string, roleCode: RoleCode, extra: { warehouseId?: string; customerId?: string } = {}) =>
    signAccessToken({
      sub: userId,
      roles: [{ code: roleCode, ...(extra.warehouseId ? { warehouseId: extra.warehouseId } : {}) }],
      farmerId: null,
      customerId: extra.customerId ?? null,
    });

  beforeAll(async () => {
    try {
      await pool.query('SELECT 1 FROM market_open_close_schedules LIMIT 0');
      const col = await pool.query<{ n: number }>(
        `SELECT COUNT(*)::int AS n FROM information_schema.columns
          WHERE table_name = 'warehouses' AND column_name = 'is_market_open'`,
      );
      if ((col.rows[0]?.n ?? 0) === 0) return;
      ready = true;
    } catch {
      return;
    }

    const app = createApp();
    server = app.listen(0);

    for (const [id, name, type] of [
      [superAdminId, 'SA Market', 'ADMIN'],
      [tohfaAdminId, 'TA Market', 'ADMIN'],
      [subWhAdminId, 'SWA Market', 'ADMIN'],
      [customerUserId, 'Customer Market', 'CUSTOMER'],
      [farmerUserId, 'Farmer Market', 'FARMER'],
    ] as const) {
      await pool.query(
        `INSERT INTO users (id, full_name, mobile, user_type, status) VALUES ($1, $2, $3, $4, 'ACTIVE')`,
        [id, name, randomMobile(), type],
      );
    }

    await pool.query(
      `INSERT INTO farmers (id, user_id, tohfa_farmer_id, kyc_status, application_status)
       VALUES ($1, $2, $3, 'VERIFIED', 'APPROVED')`,
      [farmerId, farmerUserId, `TF-${farmerId.slice(0, 6)}`],
    );

    await pool.query(
      `INSERT INTO customers (id, user_id, customer_code) VALUES ($1, $2, $3)`,
      [customerId, customerUserId, `CUS-${customerId.slice(0, 6)}`],
    );
    await pool.query(
      `INSERT INTO wallets (owner_type, customer_id, balance) VALUES ('CUSTOMER', $1, 1000.00)`,
      [customerId],
    );

    await pool.query(
      `INSERT INTO warehouses (id, code, name, type, city, is_active, is_market_open)
       VALUES ($1, $2, 'Market Test Hub', 'MAIN', 'Ooty', true, true)`,
      [warehouseId, `WH-MKT-${warehouseId.slice(0, 6)}`],
    );

    const catRes = await pool.query<{ id: string }>(`SELECT id FROM categories ORDER BY created_at LIMIT 1`);
    const categoryId = catRes.rows[0]!.id;
    await pool.query(
      `INSERT INTO crop_master (id, code, slug, name, category_id, default_unit, is_active)
       VALUES ($1, $2, $3, 'Market Greens', $4, 'kg', true)`,
      [cropId, `CRP-${cropId.slice(0, 4)}`, `greens-${cropId.slice(0, 6)}`, categoryId],
    );

    await pool.query(
      `INSERT INTO retail_prices (crop_id, grade, price, effective_from, set_by)
       VALUES ($1, 'GRADE_1', 100.00, '2026-01-01', $2)`,
      [cropId, superAdminId],
    );

    await pool.query(
      `INSERT INTO inventory_batches (id, warehouse_id, crop_id, grade, source_farmer_id, batch_code, received_on, qty_received)
       VALUES ($1, $2, $3, 'GRADE_1', $4, $5, CURRENT_DATE, 50.000)`,
      [batchId, warehouseId, cropId, farmerId, `BCH-${batchId.slice(0, 6)}`],
    );
    await pool.query(
      `INSERT INTO stock_ledger (batch_id, warehouse_id, movement_type, qty_delta, balance_after, ref_type, remarks)
       VALUES ($1, $2, 'RECEIPT', 50.000, 0, 'TEST', 'fixture receipt')`,
      [batchId, warehouseId],
    );

    await pool.query(
      `INSERT INTO allocations (id, batch_id, warehouse_id, channel, allocated_qty)
       VALUES ($1, $2, $3, 'ONLINE', 50.000)`,
      [allocationId, batchId, warehouseId],
    );
  });

  afterAll(async () => {
    if (!ready) return;
    try {
      await pool.query(`DELETE FROM market_open_close_schedules WHERE warehouse_id = $1`, [warehouseId]);
      await pool.query(`DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE customer_id = $1)`, [customerId]);
      await pool.query(`DELETE FROM carts WHERE customer_id = $1`, [customerId]);
      await pool.query(`DELETE FROM allocations WHERE id = $1`, [allocationId]);
      await pool.query(`UPDATE warehouses SET deleted_at = now(), is_active = false WHERE id = $1`, [warehouseId]);
    } finally {
      server?.close();
    }
  });

  it('BR-243: toggles warehouse market status, blocks cart/checkout when closed, manages market schedules, and writes audit_log', async (ctx) => {
    if (!ready) return ctx.skip();

    const saToken = token(superAdminId, RoleCode.SUPER_ADMIN);
    const taToken = token(tohfaAdminId, RoleCode.TOHFA_ADMIN);
    const swaToken = token(subWhAdminId, RoleCode.SUB_WH_ADMIN, { warehouseId });
    const customerToken = token(customerUserId, RoleCode.CUSTOMER, { customerId });

    // Customer & SUB_WH_ADMIN forbidden from changing market status -> 403
    expect(
      (
        await request(server)
          .post(`/v1/admin/warehouses/${warehouseId}/market-status`)
          .set('Authorization', `Bearer ${customerToken}`)
          .send({ isMarketOpen: false, reason: 'Try close' })
      ).status,
    ).toBe(403);
    expect(
      (
        await request(server)
          .post(`/v1/admin/warehouses/${warehouseId}/market-status`)
          .set('Authorization', `Bearer ${swaToken}`)
          .send({ isMarketOpen: false, reason: 'Sub WH admin cannot override' })
      ).status,
    ).toBe(403);

    // Public read initially open
    const pubOpen = await request(server).get(`/v1/warehouses/${warehouseId}/market-status`);
    expect(pubOpen.status).toBe(200);
    expect(pubOpen.body.isMarketOpen).toBe(true);

    // SUPER_ADMIN closes market with hours + reason -> 200
    const closeRes = await request(server)
      .post(`/v1/admin/warehouses/${warehouseId}/market-status`)
      .set('Authorization', `Bearer ${saToken}`)
      .send({
        isMarketOpen: false,
        marketOpenTime: '07:00',
        marketCloseTime: '20:00',
        reason: 'Inventory stocktaking in progress',
      });
    expect(closeRes.status).toBe(200);
    expect(closeRes.body.isMarketOpen).toBe(false);
    expect(closeRes.body.marketOpenTime).toBe('07:00');
    expect(closeRes.body.marketCloseTime).toBe('20:00');
    expect(closeRes.body.reason).toBe('Inventory stocktaking in progress');

    // Public status reflects closed
    const pubClosed = await request(server).get(`/v1/warehouses/${warehouseId}/market-status`);
    expect(pubClosed.status).toBe(200);
    expect(pubClosed.body.isMarketOpen).toBe(false);

    // Customer addItem to closed warehouse -> 409 CONFLICT (MARKET_CLOSED)
    const blockedCart = await request(server)
      .post('/v1/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: cropId, grade: 'GRADE_1', qtyKg: '1.000', warehouseId });
    expect(blockedCart.status).toBe(409);
    expect(blockedCart.body.meta?.reason).toBe('MARKET_CLOSED');

    // Re-open market via TOHFA_ADMIN -> 200
    const openRes = await request(server)
      .post(`/v1/admin/warehouses/${warehouseId}/market-status`)
      .set('Authorization', `Bearer ${taToken}`)
      .send({ isMarketOpen: true, reason: 'Reopened after stocktake' });
    expect(openRes.status).toBe(200);
    expect(openRes.body.isMarketOpen).toBe(true);

    // Add item while open -> 201
    const okCart = await request(server)
      .post('/v1/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: cropId, grade: 'GRADE_1', qtyKg: '1.000', warehouseId });
    expect(okCart.status).toBe(201);

    // Close market BEFORE checkout -> checkout refused with 409 MARKET_CLOSED!
    await request(server)
      .post(`/v1/admin/warehouses/${warehouseId}/market-status`)
      .set('Authorization', `Bearer ${saToken}`)
      .send({ isMarketOpen: false, reason: 'Emergency closure' });

    const blockedOrder = await request(server)
      .post('/v1/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .set('Idempotency-Key', newId())
      .send({ warehouseId, fulfillmentType: 'PICKUP', paymentMethod: 'WALLET' });
    expect(blockedOrder.status).toBe(409);
    expect(blockedOrder.body.meta?.reason).toBe('MARKET_CLOSED');

    // Market Schedule CRUD
    const schedCreate = await request(server)
      .post(`/v1/admin/warehouses/${warehouseId}/market-schedules`)
      .set('Authorization', `Bearer ${taToken}`)
      .send({
        mode: 'OPEN',
        scheduleDate: '2026-12-01',
        scheduleTime: '06:30',
        repeatRule: 'DAILY',
        notes: 'Morning opening schedule',
      });
    expect(schedCreate.status).toBe(201);
    const scheduleId = schedCreate.body.id as string;

    const schedList = await request(server)
      .get(`/v1/admin/warehouses/${warehouseId}/market-schedules`)
      .set('Authorization', `Bearer ${saToken}`);
    expect(schedList.status).toBe(200);
    expect(schedList.body.items.some((s: { id: string }) => s.id === scheduleId)).toBe(true);

    const schedPatch = await request(server)
      .patch(`/v1/admin/warehouses/${warehouseId}/market-schedules/${scheduleId}`)
      .set('Authorization', `Bearer ${saToken}`)
      .send({ scheduleTime: '07:00', isActive: false });
    expect(schedPatch.status).toBe(200);
    expect(schedPatch.body.scheduleTime).toBe('07:00');
    expect(schedPatch.body.isActive).toBe(false);

    const schedDel = await request(server)
      .delete(`/v1/admin/warehouses/${warehouseId}/market-schedules/${scheduleId}`)
      .set('Authorization', `Bearer ${taToken}`);
    expect(schedDel.status).toBe(204);

    // Check audit_log rows for market status & schedule actions
    const auditRes = await pool.query<{ action_code: string }>(
      `SELECT action_code FROM audit_log WHERE actor_id IN ($1, $2) ORDER BY created_at ASC`,
      [superAdminId, tohfaAdminId],
    );
    expect(auditRes.rows.map((r) => r.action_code)).toContain('warehouse.market_status.update');
    expect(auditRes.rows.map((r) => r.action_code)).toContain('warehouse.market_schedule.create');
    expect(auditRes.rows.map((r) => r.action_code)).toContain('warehouse.market_schedule.update');
    expect(auditRes.rows.map((r) => r.action_code)).toContain('warehouse.market_schedule.delete');
  });
});
