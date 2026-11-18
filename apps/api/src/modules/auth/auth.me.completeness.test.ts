import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { RoleCode } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { closePool, pool } from '../../db/pool.js';
import { describeIfDatabase } from '../../test/factories.js';
import { randomMobile } from '../../test/dbFixtures.js';

/**
 * BR-205a-c: GET /v1/auth/me carries `profileComplete` for customers only (BR-190 helper).
 * Users are left behind on purpose (audit/append-only references; the run database is disposable).
 */

const app = createApp();

async function createUser(userType: 'CUSTOMER' | 'ADMIN', fullName: string): Promise<string> {
  const r = await pool.query<{ id: string }>(
    `INSERT INTO users (mobile, full_name, user_type, status)
     VALUES ($1, $2, $3::user_type, 'ACTIVE') RETURNING id`,
    [randomMobile(), fullName, userType],
  );
  return r.rows[0]!.id;
}

function me(userId: string, role: RoleCode) {
  const token = signAccessToken({ sub: userId, roles: [{ code: role }], farmerId: null, customerId: null });
  return request(app).get('/v1/auth/me').set('Authorization', `Bearer ${token}`);
}

describeIfDatabase('BR-205: GET /v1/auth/me profileComplete (real database, real router)', () => {
  afterAll(async () => {
    await closePool();
  });

  it('BR-205a: a customer with a placeholder name and no onboarding data is incomplete', async () => {
    const id = await createUser('CUSTOMER', 'TOHFA Customer');
    const res = await me(id, RoleCode.CUSTOMER);
    expect(res.status).toBe(200);
    expect(res.body.profileComplete).toBe(false);
    expect(res.body.missingFields).toContain('fullName');
  });

  it('BR-205b: a customer with a real name and an onboarding field is complete', async () => {
    const id = await createUser('CUSTOMER', 'Meena Devi');
    await pool.query(`INSERT INTO customers (user_id, customer_code, age) VALUES ($1, 'CUST-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)), 30)`, [id]);
    const res = await me(id, RoleCode.CUSTOMER);
    expect(res.status).toBe(200);
    expect(res.body.profileComplete).toBe(true);
    expect(res.body.missingFields).toEqual([]);
  });

  it('BR-205c: a non-customer user gets no profileComplete key', async () => {
    const id = await createUser('ADMIN', 'Some Admin');
    const res = await me(id, RoleCode.TOHFA_ADMIN);
    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty('profileComplete');
    expect(res.body).not.toHaveProperty('missingFields');
  });
});
