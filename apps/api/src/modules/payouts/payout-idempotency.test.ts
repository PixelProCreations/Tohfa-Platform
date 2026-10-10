/**
 * BR-72: payout creation and approval are replay-safe, and payout numbers are
 * unique under concurrency.
 *
 * Real-database tests (gated on DATABASE_URL) through the service and the real
 * router. They COMMIT rows (a rolled-back single client cannot race), so run
 * them against a throwaway / CI database.
 */
import request from 'supertest';
import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { pool } from '../../db/pool.js';
import { eventBus } from '../../events/bus.js';
import { databaseReady, describeIfDatabase, newId } from '../../test/factories.js';

interface Admin {
  userId: string;
  token: string;
}

describeIfDatabase('BR-72: payout replay safety and payout numbers (real database)', () => {
  // One listening server for all requests: supertest(app) opens a server per call, and 20 at once can reset.
  const server = createApp().listen(0);
  let year: string;
  const admins: Admin[] = [];

  async function makeAdmin(role: 'SUPER_ADMIN' | 'TOHFA_ADMIN' = 'SUPER_ADMIN'): Promise<Admin> {
    const userId = newId();
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, 'Payout Replay Admin', 'ADMIN', 'ACTIVE')`,
      [userId, `+9193${Math.floor(10000000 + Math.random() * 89999999)}`],
    );
    const admin = { userId, token: signAccessToken({ sub: userId, roles: [{ code: role }], customerId: null, farmerId: null }) };
    admins.push(admin);
    return admin;
  }

  async function makeFarmer(): Promise<string> {
    const userId = newId();
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, 'Payout Replay Farmer', 'FARMER', 'ACTIVE')`,
      [userId, `+9192${Math.floor(10000000 + Math.random() * 89999999)}`],
    );
    const farmerId = newId();
    await pool.query(`INSERT INTO farmers (id, user_id, tohfa_farmer_id) VALUES ($1, $2, $3)`, [
      farmerId,
      userId,
      `TOHFA-PRP-${farmerId.slice(0, 8)}`,
    ]);
    return farmerId;
  }

  const create = (admin: Admin, body: object, key?: string) => {
    const req = request(server).post('/v1/admin/payouts').set('Authorization', `Bearer ${admin.token}`);
    return (key === undefined ? req : req.set('Idempotency-Key', key)).send(body);
  };
  const approve = (admin: Admin, payoutId: string, body: object, key?: string) => {
    const req = request(server).post(`/v1/admin/payouts/${payoutId}/approve`).set('Authorization', `Bearer ${admin.token}`);
    return (key === undefined ? req : req.set('Idempotency-Key', key)).send(body);
  };

  const count = async (sql: string, params: unknown[]): Promise<number> =>
    Number((await pool.query<{ n: string }>(sql, params)).rows[0]!.n);
  const payoutRows = (farmerId: string) => count(`SELECT count(*)::text AS n FROM payouts WHERE farmer_id = $1`, [farmerId]);
  const auditRows = (actorId: string, action: string) =>
    count(`SELECT count(*)::text AS n FROM audit_log WHERE actor_id = $1 AND action_code = $2`, [actorId, action]);
  const keyRows = (actorId: string) => count(`SELECT count(*)::text AS n FROM idempotency_keys WHERE actor_user_id = $1`, [actorId]);
  const approvalRows = (payoutId: string) => count(`SELECT count(*)::text AS n FROM payout_approvals WHERE payout_id = $1`, [payoutId]);

  beforeAll(async () => {
    if (!(await databaseReady('payouts')) || !(await databaseReady('idempotency_keys'))) {
      throw new Error('database is not migrated (needs payouts and idempotency_keys): run `pnpm db:migrate`');
    }
    year = (await pool.query<{ yr: string }>(`SELECT EXTRACT(YEAR FROM now())::text AS yr`)).rows[0]!.yr;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    const { closePool } = await import('../../db/pool.js');
    await closePool();
  });

  // ---- create: replay ----------------------------------------------------

  it.each([
    ['missing', undefined],
    ['empty', ''],
    ['blank', '   '],
    ['over 255 characters', 'k'.repeat(256)],
  ])('BR-72a: POST /admin/payouts with a %s Idempotency-Key is 422 naming the header and creates nothing', async (_n, key) => {
    const admin = await makeAdmin();
    const farmerId = await makeFarmer();
    const res = await create(admin, { farmerId, amount: '500.00', mode: 'IMPS' }, key);
    expect(res.status).toBe(422);
    expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
    expect(res.body.code).toBe('VALIDATION_FAILED');
    expect(Object.keys(res.body.errors)).toEqual(['header.Idempotency-Key']);
    expect(await payoutRows(farmerId)).toBe(0);
    expect(await keyRows(admin.userId)).toBe(0);
  });

  it('BR-72b: a replay (same admin, same key, same request) returns the original 201 body and writes no second payout, audit row or event', async () => {
    const admin = await makeAdmin();
    const farmerId = await makeFarmer();
    const key = `payout-${newId()}-${Date.now()}`; // the admin-web shape: not a UUID
    const body = { farmerId, amount: '500.00', mode: 'IMPS', remarks: 'replay me' };
    const spy = vi.spyOn(eventBus, 'publish');
    try {
      const first = await create(admin, body, key);
      expect(first.status).toBe(201);
      const replay = await create(admin, { ...body }, key);
      expect(replay.status).toBe(201);
      expect(replay.body).toEqual(first.body);
      expect(await payoutRows(farmerId)).toBe(1);
      expect(await auditRows(admin.userId, 'payout.farmer.initiate')).toBe(1);
      expect(await keyRows(admin.userId)).toBe(1);
      const released = spy.mock.calls.filter((c) => c[0] === 'payout.released' && (c[1] as { payoutId: string }).payoutId === first.body.id);
      expect(released).toHaveLength(1);
    } finally {
      spy.mockRestore();
    }
  });

  it('BR-72b: a replay of a pending-approval payout (above Rs 10,000) returns the original body', async () => {
    const admin = await makeAdmin();
    const farmerId = await makeFarmer();
    const key = newId();
    const body = { farmerId, amount: '18400.00', mode: 'NEFT' };
    const first = await create(admin, body, key);
    const replay = await create(admin, body, key);
    expect([first.status, replay.status]).toEqual([201, 201]);
    expect(first.body.status).toBe('PENDING_APPROVAL');
    expect(replay.body).toEqual(first.body);
    expect(await payoutRows(farmerId)).toBe(1);
  });

  it('BR-72c: the same key with a different request is 409 IDEMPOTENCY_KEY_REUSED and creates nothing more', async () => {
    const admin = await makeAdmin();
    const farmerId = await makeFarmer();
    const key = newId();
    expect((await create(admin, { farmerId, amount: '500.00', mode: 'IMPS' }, key)).status).toBe(201);
    const clash = await create(admin, { farmerId, amount: '600.00', mode: 'IMPS' }, key);
    expect(clash.status).toBe(409);
    expect(clash.body.code).toBe('IDEMPOTENCY_KEY_REUSED');
    expect(await payoutRows(farmerId)).toBe(1);
  });

  it('BR-72d: five parallel requests with one key create exactly one payout and all return it', { timeout: 30_000 }, async () => {
    const admin = await makeAdmin();
    const farmerId = await makeFarmer();
    const key = newId();
    await Promise.all(Array.from({ length: 6 }, () => pool.query('SELECT pg_sleep(0.05)')));
    const results = await Promise.all(
      Array.from({ length: 5 }, () => create(admin, { farmerId, amount: '500.00', mode: 'IMPS' }, key)),
    );
    expect(results.map((r) => r.status)).toEqual([201, 201, 201, 201, 201]);
    expect(new Set(results.map((r) => r.body.id)).size).toBe(1);
    expect(await payoutRows(farmerId)).toBe(1);
    expect(await auditRows(admin.userId, 'payout.farmer.initiate')).toBe(1);
  });

  it('BR-72e: two admins using the same key string each get their own payout', async () => {
    const a = await makeAdmin();
    const b = await makeAdmin();
    const farmerId = await makeFarmer();
    const key = newId();
    const ra = await create(a, { farmerId, amount: '500.00', mode: 'IMPS' }, key);
    const rb = await create(b, { farmerId, amount: '500.00', mode: 'IMPS' }, key);
    expect([ra.status, rb.status]).toEqual([201, 201]);
    expect(ra.body.id).not.toBe(rb.body.id);
    expect(ra.body.initiatedBy).toBe(a.userId);
    expect(rb.body.initiatedBy).toBe(b.userId);
  });

  it('BR-72f: a refused attempt (unknown farmer, bad amount) leaves no claim, so the key works once the cause is fixed', async () => {
    const admin = await makeAdmin();
    const farmerId = await makeFarmer();
    const key = newId();
    expect((await create(admin, { farmerId: newId(), amount: '500.00', mode: 'IMPS' }, key)).status).toBe(404);
    expect((await create(admin, { farmerId, amount: '0.00', mode: 'IMPS' }, key)).status).toBe(422);
    expect(await keyRows(admin.userId)).toBe(0);
    const ok = await create(admin, { farmerId, amount: '500.00', mode: 'IMPS' }, key);
    expect(ok.status).toBe(201);
    expect(await payoutRows(farmerId)).toBe(1);
  });

  it('BR-72g: a key older than 24 hours is released and can be used for a new request', async () => {
    const admin = await makeAdmin();
    const farmerId = await makeFarmer();
    const key = newId();
    const first = await create(admin, { farmerId, amount: '500.00', mode: 'IMPS' }, key);
    await pool.query(`UPDATE idempotency_keys SET created_at = now() - interval '25 hours' WHERE actor_user_id = $1`, [admin.userId]);
    const second = await create(admin, { farmerId, amount: '700.00', mode: 'IMPS' }, key);
    expect(second.status).toBe(201);
    expect(second.body.id).not.toBe(first.body.id);
    expect(await payoutRows(farmerId)).toBe(2);
  });

  // ---- approve: replay ---------------------------------------------------

  async function pendingPayout(initiator: Admin): Promise<{ farmerId: string; payoutId: string }> {
    const farmerId = await makeFarmer();
    const res = await create(initiator, { farmerId, amount: '18400.00', mode: 'NEFT' }, newId());
    expect(res.status).toBe(201);
    return { farmerId, payoutId: res.body.id as string };
  }

  it.each([
    ['missing', undefined],
    ['blank', '  '],
  ])('BR-72h: POST /admin/payouts/{id}/approve with a %s Idempotency-Key is 422 and the payout stays pending', async (_n, key) => {
    const initiator = await makeAdmin();
    const approver = await makeAdmin();
    const { payoutId } = await pendingPayout(initiator);
    const res = await approve(approver, payoutId, { note: 'x' }, key);
    expect(res.status).toBe(422);
    expect(Object.keys(res.body.errors)).toEqual(['header.Idempotency-Key']);
    const row = await pool.query<{ status: string }>(`SELECT status FROM payouts WHERE id = $1`, [payoutId]);
    expect(row.rows[0]!.status).toBe('PENDING_APPROVAL');
    expect(await approvalRows(payoutId)).toBe(0);
  });

  it('BR-72h: an approve replay returns the original 200 body with one approval, one audit row and one release event', async () => {
    const initiator = await makeAdmin();
    const approver = await makeAdmin();
    const { payoutId } = await pendingPayout(initiator);
    const key = newId();
    const spy = vi.spyOn(eventBus, 'publish');
    try {
      const first = await approve(approver, payoutId, { note: 'ok' }, key);
      expect(first.status).toBe(200);
      expect(first.body.status).toBe('APPROVED');
      const replay = await approve(approver, payoutId, { note: 'ok' }, key);
      expect(replay.status).toBe(200);
      expect(replay.body).toEqual(first.body);
      expect(await approvalRows(payoutId)).toBe(1);
      expect(await auditRows(approver.userId, 'payout.approve_above_10k')).toBe(1);
      const released = spy.mock.calls.filter((c) => c[0] === 'payout.released' && (c[1] as { payoutId: string }).payoutId === payoutId);
      expect(released).toHaveLength(1);
      // The same approve with a NEW key is a state error: the key is what made the first one repeatable.
      const fresh = await approve(approver, payoutId, { note: 'ok' }, newId());
      expect(fresh.status).toBe(409);
      expect(fresh.body.code).toBe('INVALID_STATE_TRANSITION');
    } finally {
      spy.mockRestore();
    }
  });

  it('BR-72h: an approve key reused with a different note is 409 IDEMPOTENCY_KEY_REUSED', async () => {
    const initiator = await makeAdmin();
    const approver = await makeAdmin();
    const { payoutId } = await pendingPayout(initiator);
    const key = newId();
    expect((await approve(approver, payoutId, { note: 'one' }, key)).status).toBe(200);
    const clash = await approve(approver, payoutId, { note: 'two' }, key);
    expect(clash.status).toBe(409);
    expect(clash.body.code).toBe('IDEMPOTENCY_KEY_REUSED');
  });

  it('BR-72i: two different Super Admins approving at the same moment: exactly one approval, one 200 and one 409', async () => {
    const initiator = await makeAdmin();
    const a = await makeAdmin();
    const b = await makeAdmin();
    const { payoutId } = await pendingPayout(initiator);
    await Promise.all(Array.from({ length: 6 }, () => pool.query('SELECT pg_sleep(0.05)')));
    const [ra, rb] = await Promise.all([
      approve(a, payoutId, { note: 'a' }, newId()),
      approve(b, payoutId, { note: 'b' }, newId()),
    ]);
    expect([ra.status, rb.status].sort()).toEqual([200, 409]);
    expect(await approvalRows(payoutId)).toBe(1);
  });

  it('BR-72i: an approve waits for the payout row lock and then sees the committed state (no double release)', async () => {
    const initiator = await makeAdmin();
    const approver = await makeAdmin();
    const winner = await makeAdmin();
    const { payoutId } = await pendingPayout(initiator);
    const other = await pool.connect();
    try {
      await other.query('BEGIN');
      await other.query(`SELECT id FROM payouts WHERE id = $1 FOR UPDATE`, [payoutId]);
      let settled = false;
      const approving = approve(approver, payoutId, { note: 'x' }, newId()).then((r) => {
        settled = true;
        return r;
      });
      await new Promise((r) => setTimeout(r, 500));
      // Without the row lock this approval would already have read PENDING_APPROVAL and released the payout.
      expect(settled).toBe(false);
      await other.query(`UPDATE payouts SET status = 'APPROVED', released_by = $2, released_at = now() WHERE id = $1`, [payoutId, winner.userId]);
      await other.query('COMMIT');
      const res = await approving;
      expect(res.status).toBe(409);
      expect(res.body.code).toBe('INVALID_STATE_TRANSITION');
      expect(await approvalRows(payoutId)).toBe(0);
    } finally {
      await other.query('ROLLBACK').catch(() => undefined);
      other.release();
    }
  });

  it('BR-72: a refused approve (self-approval) leaves no claim', async () => {
    const initiator = await makeAdmin();
    const { payoutId } = await pendingPayout(initiator);
    const before = await keyRows(initiator.userId);
    const res = await approve(initiator, payoutId, {}, newId());
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('SAME_ACTOR_APPROVAL');
    expect(await keyRows(initiator.userId)).toBe(before);
  });

  // ---- payout numbers ----------------------------------------------------

  const NUMBER = () => new RegExp(`^PO-${year}-\\d{6,}$`);

  it('BR-72j: 20 parallel payouts for 20 different farmers all succeed with distinct numbers in the existing format', { timeout: 30_000 }, async () => {
    const admin = await makeAdmin();
    const farmers = await Promise.all(Array.from({ length: 20 }, () => makeFarmer()));
    await Promise.all(Array.from({ length: 8 }, () => pool.query('SELECT pg_sleep(0.05)')));
    const responses = await Promise.all(
      farmers.map((farmerId) => create(admin, { farmerId, amount: '500.00', mode: 'IMPS' }, newId())),
    );
    expect(responses.map((r) => r.status)).toEqual(Array(20).fill(201));
    const numbers = responses.map((r) => r.body.payoutNumber as string);
    expect(new Set(numbers).size).toBe(20);
    for (const n of numbers) expect(n).toMatch(NUMBER());
  });

  it('BR-72j: 20 parallel payouts for ONE farmer, each with its own key, all succeed with distinct numbers', { timeout: 30_000 }, async () => {
    const admin = await makeAdmin();
    const farmerId = await makeFarmer();
    await Promise.all(Array.from({ length: 8 }, () => pool.query('SELECT pg_sleep(0.05)')));
    const responses = await Promise.all(
      Array.from({ length: 20 }, () => create(admin, { farmerId, amount: '500.00', mode: 'IMPS' }, newId())),
    );
    expect(responses.map((r) => r.status)).toEqual(Array(20).fill(201));
    expect(new Set(responses.map((r) => r.body.payoutNumber)).size).toBe(20);
    expect(await payoutRows(farmerId)).toBe(20);
  });

  it('BR-72k: the next number follows the highest suffix of the year (a gap is never reused) and other years do not move it', async () => {
    const admin = await makeAdmin();
    const farmerId = await makeFarmer();
    const planted = `PO-${year}-${String(800000 + Math.floor(Math.random() * 90000))}`;
    const otherYear = `PO-${Number(year) - 1}-999999`;
    for (const n of [planted, otherYear]) {
      await pool.query(
        `INSERT INTO payouts (payout_number, farmer_id, amount, mode, status, initiated_by) VALUES ($1, $2, 100.00, 'IMPS', 'PAID', $3)
         ON CONFLICT (payout_number) DO NOTHING`,
        [n, farmerId, admin.userId],
      );
    }
    // Earlier runs against the same database leave their own planted rows behind, so the expectation is read
    // from the table: it must be the highest suffix of THIS year plus one (never the count, never last year's).
    const max = await pool.query<{ n: string }>(
      `SELECT MAX(substring(payout_number FROM '^PO-${year}-([0-9]+)$')::bigint)::text AS n FROM payouts`,
    );
    expect(Number(max.rows[0]!.n)).toBeGreaterThanOrEqual(Number(planted.slice(-6)));
    const res = await create(admin, { farmerId, amount: '500.00', mode: 'IMPS' }, newId());
    expect(res.status).toBe(201);
    expect(res.body.payoutNumber).toBe(`PO-${year}-${String(Number(max.rows[0]!.n) + 1).padStart(6, '0')}`);
  });
});
