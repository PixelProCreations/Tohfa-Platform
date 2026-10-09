/**
 * NUL: real routers + real Postgres. Postgres `text` cannot hold 0x00, so a NUL
 * in any string used to reach the database and come back as 500 INTERNAL. Every
 * request now passes rejectNulBytes (mounted once in createApp) first, so these
 * are 422 VALIDATION_FAILED, never 5xx, and nothing is written.
 *
 * Commits a user and a farmer, like golden-thread.e2e.test.ts: run it against a
 * throwaway / CI database.
 */
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RoleCode } from '@tohfa/shared-types';
import { createApp } from '../app.js';
import { signAccessToken } from '../auth/jwt.js';
import { pool } from '../db/pool.js';
import { databaseReady, describeIfDatabase, newId } from '../test/factories.js';

const NUL = '\u0000';

describeIfDatabase('NUL: real routers (no 500, no database write)', () => {
  const app = createApp();
  let token: string;
  let userId: string;
  let farmerId: string;

  beforeAll(async () => {
    if (!(await databaseReady('farms'))) throw new Error('database is not migrated: run `pnpm db:migrate`');
    userId = newId();
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, 'NUL Test Farmer', 'FARMER', 'ACTIVE')`,
      [userId, `+9196${Math.floor(10000000 + Math.random() * 89999999)}`],
    );
    farmerId = newId();
    await pool.query(
      `INSERT INTO farmers (id, user_id, tohfa_farmer_id, application_status, kyc_status, is_market_blocked)
       VALUES ($1, $2, $3, 'APPROVED', 'VERIFIED', false)`,
      [farmerId, userId, `TOHFA-NUL-${farmerId.slice(0, 8)}`],
    );
    token = signAccessToken({ sub: userId, roles: [{ code: RoleCode.FARMER }], farmerId, customerId: null });
  });

  afterAll(async () => {
    await pool.query(`DELETE FROM farms WHERE farmer_id = $1`, [farmerId]).catch(() => undefined);
  });

  const count = async (sql: string, params: unknown[] = []): Promise<number> =>
    Number((await pool.query<{ n: string }>(sql, params)).rows[0]!.n);

  function expectNul(res: request.Response, ...fields: string[]): void {
    expect(res.status).toBe(422);
    expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
    expect(res.body.code).toBe('VALIDATION_FAILED');
    expect(Object.keys(res.body.errors).sort()).toEqual([...fields].sort());
    // The value is never echoed. (`instance` is the request URL, as in every problem, so for a
    // %00 URL it carries that encoded text; the field messages and detail never do.)
    expect(JSON.stringify([res.body.errors, res.body.detail, res.body.title])).not.toMatch(/Bad|\\u0000|%00/);
  }

  it('NUL: POST /v1/auth/register/customer with a NUL in fullName is 422 and creates no user', async () => {
    const mobile = `+9195${Math.floor(10000000 + Math.random() * 89999999)}`;
    const res = await request(app)
      .post('/v1/auth/register/customer')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ mobile, fullName: 'Bad\u0000Name', password: 'a-long-enough-password' }));
    expectNul(res, 'body.fullName');
    expect(await count(`SELECT count(*)::text AS n FROM users WHERE mobile = $1`, [mobile])).toBe(0);
  });

  it('NUL: GET /v1/notifications?cursor=%00 is 422 naming query.cursor', async () => {
    const res = await request(app).get('/v1/notifications?cursor=%00').set('Authorization', `Bearer ${token}`);
    expectNul(res, 'query.cursor');
  });

  it('NUL: POST /v1/farms with a NUL in the name (and in a nested village) is 422 and creates no farm', async () => {
    const before = await count(`SELECT count(*)::text AS n FROM farms WHERE farmer_id = $1`, [farmerId]);
    const res = await request(app)
      .post('/v1/farms')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `Farm${NUL}One`, village: `Kotagiri${NUL}` });
    expectNul(res, 'body.name', 'body.village');
    expect(await count(`SELECT count(*)::text AS n FROM farms WHERE farmer_id = $1`, [farmerId])).toBe(before);
  });

  it('NUL: a NUL inside an array element of POST /v1/listings (photos) is 422 before any handler or key claim', async () => {
    const res = await request(app)
      .post('/v1/listings')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', newId())
      .send({ cropId: newId(), grade: 'GRADE_1', quantityKg: '1.000', askingPricePerKg: '1.00', photos: [`https://cdn.example/a${NUL}.jpg`] });
    expectNul(res, 'body.photos.0');
    expect(await count(`SELECT count(*)::text AS n FROM idempotency_keys WHERE actor_user_id = $1`, [userId])).toBe(0);
  });

  it('NUL: a NUL in a route param (PATCH /v1/listings/a%00b) is 422, not a database error', async () => {
    const res = await request(app).patch('/v1/listings/a%00b').set('Authorization', `Bearer ${token}`).send({});
    expectNul(res, 'params');
  });

  it('NUL: a NUL in a query value of a list endpoint is 422 (GET /v1/listings?status=%00)', async () => {
    const res = await request(app).get('/v1/listings?status=%00').set('Authorization', `Bearer ${token}`);
    expectNul(res, 'query.status');
  });

  it('NUL: normal Tamil and emoji text still reaches the handler (a farm is created)', async () => {
    const res = await request(app)
      .post('/v1/farms')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'நீலகிரி பண்ணை \u{1F33E}', village: 'Kotagiri' });
    expect(res.status).toBeLessThan(300);
    expect(await count(`SELECT count(*)::text AS n FROM farms WHERE farmer_id = $1 AND name = $2`, [farmerId, 'நீலகிரி பண்ணை \u{1F33E}'])).toBe(1);
  });
});
