/**
 * Customer-initiated Order Cancellation (BR-247 — Brief 11 GAP 5):
 *  - POST /v1/orders/:id/cancel (order.cancel_own, CUSTOMER: own)
 *  - Allows cancellation only while status = CONFIRMED (409 otherwise)
 *  - Refunds wallet if paid via WALLET, writes order_status_history + audit_log,
 *    and publishes order.cancelled.
 */
import type { Server } from 'node:http';
import request from 'supertest';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { RoleCode } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { pool } from '../../db/pool.js';
import { eventBus } from '../../events/bus.js';
import { describeIfDatabase, newId } from '../../test/factories.js';

function randomMobile(): string {
  return `+918${Math.floor(100000000 + Math.random() * 899999999)}`;
}

describeIfDatabase('orders', () => {
  let server: Server;
  let customerToken: string;
  let otherCustomerToken: string;
  let customerUserId: string;
  let customerId: string;
  let otherCustomerId: string;
  let warehouseId: string;
  let confirmedOrderId: string;
  let packedOrderId: string;
  let walletId: string;

  beforeAll(async () => {
    const app = createApp();
    server = app.listen(0);

    const whRes = await pool.query<{ id: string }>(
      `SELECT id FROM warehouses WHERE is_active = true AND deleted_at IS NULL LIMIT 1`,
    );
    warehouseId = whRes.rows[0]!.id;

    customerUserId = newId();
    const otherUserId = newId();
    customerId = newId();
    otherCustomerId = newId();
    walletId = newId();

    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, 'Cancel Cust', 'CUSTOMER', 'ACTIVE'), ($3, $4, 'Other Cust', 'CUSTOMER', 'ACTIVE')`,
      [customerUserId, randomMobile(), otherUserId, randomMobile()],
    );
    const roleRes = await pool.query<{ id: string }>(`SELECT id FROM roles WHERE code = 'CUSTOMER' LIMIT 1`);
    const customerRoleId = roleRes.rows[0]!.id;
    await pool.query(
      `INSERT INTO user_roles (id, user_id, role_id, role_code) VALUES ($1, $2, $3, 'CUSTOMER'), ($4, $5, $3, 'CUSTOMER')`,
      [newId(), customerUserId, customerRoleId, newId(), otherUserId],
    );
    await pool.query(
      `INSERT INTO customers (id, user_id, customer_code) VALUES ($1, $2, $3), ($4, $5, $6)`,
      [customerId, customerUserId, `C-${customerId.slice(0, 6)}`, otherCustomerId, otherUserId, `C-${otherCustomerId.slice(0, 6)}`],
    );
    await pool.query(
      `INSERT INTO wallets (id, owner_type, customer_id, balance, currency, status) VALUES ($1, 'CUSTOMER', $2, 100.00, 'INR', 'ACTIVE')`,
      [walletId, customerId],
    );

    confirmedOrderId = newId();
    packedOrderId = newId();
    await pool.query(
      `INSERT INTO orders (id, order_number, customer_id, warehouse_id, status, payment_status, payment_method, subtotal, total_amount)
       VALUES
         ($1, $2, $3, $4, 'CONFIRMED', 'PAID', 'WALLET', 50.00, 50.00),
         ($5, $6, $3, $4, 'PACKED', 'PAID', 'WALLET', 30.00, 30.00)`,
      [
        confirmedOrderId,
        `ORD-${confirmedOrderId.slice(0, 8)}`,
        customerId,
        warehouseId,
        packedOrderId,
        `ORD-${packedOrderId.slice(0, 8)}`,
      ],
    );

    customerToken = signAccessToken({
      sub: customerUserId,
      roles: [{ code: RoleCode.CUSTOMER }],
      farmerId: null,
      customerId,
    });
    otherCustomerToken = signAccessToken({
      sub: otherUserId,
      roles: [{ code: RoleCode.CUSTOMER }],
      farmerId: null,
      customerId: otherCustomerId,
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('BR-247: POST /v1/orders/:id/cancel cancels a CONFIRMED order, refunds wallet, logs audit, and publishes order.cancelled', async () => {
    const events: unknown[] = [];
    const unsub = eventBus.subscribe('order.cancelled', (p) => {
      events.push(p);
    });

    try {
      const res = await request(server)
        .post(`/v1/orders/${confirmedOrderId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ reason: 'Changed my mind' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('CANCELLED');

      const walletRow = await pool.query<{ balance: string }>(
        `SELECT balance::text AS balance FROM wallets WHERE id = $1`,
        [walletId],
      );
      expect(Number(walletRow.rows[0]!.balance)).toBe(150);

      const histRow = await pool.query(
        `SELECT to_status FROM order_status_history WHERE order_id = $1 AND to_status = 'CANCELLED'`,
        [confirmedOrderId],
      );
      expect(histRow.rowCount).toBe(1);
      expect(events).toHaveLength(1);
    } finally {
      unsub();
    }
  });

  it('BR-247: refuses cancellation once order is PACKED (409) and hides other customer orders (404)', async () => {
    const packedRes = await request(server)
      .post(`/v1/orders/${packedOrderId}/cancel`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ reason: 'Too late' });
    expect(packedRes.status).toBe(409);

    const otherRes = await request(server)
      .post(`/v1/orders/${packedOrderId}/cancel`)
      .set('Authorization', `Bearer ${otherCustomerToken}`)
      .send({ reason: 'Not mine' });
    expect(otherRes.status).toBe(404);
  });
});
