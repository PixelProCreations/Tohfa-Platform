import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { RoleCode } from '@tohfa/shared-types';
import { signAccessToken } from '../../auth/jwt.js';
import { IDS, newId } from '../../test/factories.js';
import { pool } from '../../db/pool.js';

describe('BR-170: customer wallet deduct (POST /admin/wallets/:customerId/deduct)', () => {
  const app = createApp();
  const superAdminToken = signAccessToken({
    sub: IDS.userSuperAdmin,
    roles: [{ code: RoleCode.SUPER_ADMIN }],
    farmerId: null,
    customerId: null,
  });

  const setupCustomerWithWallet = async (initialBalance: string) => {
    const custId = newId();
    const userId = newId();
    const customerCode = `CUST-TEST-${custId.slice(0, 8)}`;
    // Insert user
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type) VALUES ($1, $2, 'Test Customer', 'CUSTOMER')`,
      [userId, `+9198${Math.floor(10000000 + Math.random() * 90000000)}`],
    );
    // Insert customer — customer_code is NOT NULL
    await pool.query(
      `INSERT INTO customers (id, user_id, customer_code, customer_type) VALUES ($1, $2, $3, 'RETAIL')`,
      [custId, userId, customerCode],
    );
    // Insert wallet with balance
    await pool.query(
      `INSERT INTO wallets (customer_id, owner_type, balance, status) VALUES ($1, 'CUSTOMER', $2, 'ACTIVE')`,
      [custId, initialBalance],
    );
    return { custId, userId };
  };

  it('BR-170a: requires Idempotency-Key header and valid body', async () => {
    const { custId } = await setupCustomerWithWallet('100.00');

    // Missing Idempotency-Key
    const res1 = await request(app)
      .post(`/v1/admin/wallets/${custId}/deduct`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ amount: '50.00', reason: 'Penalty' });
    expect(res1.status).toBe(422);

    // Invalid amount
    const res2 = await request(app)
      .post(`/v1/admin/wallets/${custId}/deduct`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .set('Idempotency-Key', newId())
      .send({ amount: '-10.00', reason: 'Penalty' });
    expect(res2.status).toBe(422);
  });

  it('BR-170b: deducts balance and records transaction idempotently', async () => {
    const { custId } = await setupCustomerWithWallet('150.00');
    const key = newId();

    // First deduct of 50.00
    const res1 = await request(app)
      .post(`/v1/admin/wallets/${custId}/deduct`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .set('Idempotency-Key', key)
      .send({ amount: '50.00', reason: 'Adjustment debit' });

    expect(res1.status).toBe(200);
    expect(res1.body.balanceAfter).toBe('100.00');

    // Idempotent replay with same key returns original response without second deduction
    const res2 = await request(app)
      .post(`/v1/admin/wallets/${custId}/deduct`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .set('Idempotency-Key', key)
      .send({ amount: '50.00', reason: 'Adjustment debit' });

    expect(res2.status).toBe(200);
    expect(res2.body.balanceAfter).toBe('100.00');

    // Key reuse with different amount fails 409
    const res3 = await request(app)
      .post(`/v1/admin/wallets/${custId}/deduct`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .set('Idempotency-Key', key)
      .send({ amount: '25.00', reason: 'Adjustment debit' });

    expect(res3.status).toBe(409);
  });

  it('BR-170c: overdraw fails with insufficient funds', async () => {
    const { custId } = await setupCustomerWithWallet('20.00');

    const res = await request(app)
      .post(`/v1/admin/wallets/${custId}/deduct`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .set('Idempotency-Key', newId())
      .send({ amount: '50.00', reason: 'Excessive debit' });

    expect([402, 409]).toContain(res.status);
  });
});
