/**
 * BR-70: a payout's bank account must be an active destination of the farmer
 * being paid.
 *
 * Real-database tests through the service and the real router (the service
 * opens its own transaction, so there is no meaningful mocked-repo version).
 * They COMMIT rows (the row-lock test needs two connections), so run them
 * against a throwaway / CI database.
 */
import request from 'supertest';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import type { Actor } from '../../auth/requireAuth.js';
import { pool } from '../../db/pool.js';
import type { AppError } from '../../http/problem.js';
import { aScope, databaseReady, describeIfDatabase, newId } from '../../test/factories.js';
import { createPayoutsService } from './payouts.service.js';

const adminActor = (userId = newId()): Actor => ({
  userId,
  roles: [{ code: 'SUPER_ADMIN' as const }],
  farmerId: null,
  customerId: null,
});

// ---------------------------------------------------------------------------
// Real database
// ---------------------------------------------------------------------------

interface FarmerFixture {
  userId: string;
  farmerId: string;
  accountId: string;
}

describeIfDatabase('BR-70: payout bank account ownership (real database)', () => {
  const app = createApp();
  const service = createPayoutsService();
  let adminUserId: string;
  let adminToken: string;
  const createdUsers: string[] = [];

  async function makeFarmer(label: string): Promise<FarmerFixture> {
    const userId = newId();
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, $3, 'FARMER', 'ACTIVE')`,
      [userId, `+9195${Math.floor(10000000 + Math.random() * 89999999)}`, `Payout ${label} Farmer`],
    );
    const farmerId = newId();
    await pool.query(`INSERT INTO farmers (id, user_id, tohfa_farmer_id) VALUES ($1, $2, $3)`, [
      farmerId,
      userId,
      `TOHFA-PBA-${farmerId.slice(0, 8)}`,
    ]);
    const accountId = newId();
    await pool.query(
      `INSERT INTO farmer_bank_accounts (id, farmer_id, account_holder_name, account_number_last4, ifsc, bank_name, is_default)
       VALUES ($1, $2, $3, '1234', 'HDFC0001234', 'HDFC Bank', true)`,
      [accountId, farmerId, `Payout ${label} Farmer`],
    );
    createdUsers.push(userId);
    return { userId, farmerId, accountId };
  }

  const payoutRows = async (farmerId: string): Promise<number> =>
    Number(
      (await pool.query<{ n: string }>(`SELECT count(*)::text AS n FROM payouts WHERE farmer_id = $1`, [farmerId])).rows[0]!.n,
    );
  const auditRows = async (): Promise<number> =>
    Number(
      (
        await pool.query<{ n: string }>(
          `SELECT count(*)::text AS n FROM audit_log WHERE actor_id = $1 AND action_code = 'payout.farmer.initiate'`,
          [adminUserId],
        )
      ).rows[0]!.n,
    );
  const keyRows = async (): Promise<number> =>
    Number(
      (await pool.query<{ n: string }>(`SELECT count(*)::text AS n FROM idempotency_keys WHERE actor_user_id = $1`, [adminUserId]))
        .rows[0]!.n,
    );

  const post = (body: object, key: string = newId()) =>
    request(app).post('/v1/admin/payouts').set('Authorization', `Bearer ${adminToken}`).set('Idempotency-Key', key).send(body);

  /** The problem body with the per-request fields removed, so two refusals can be compared. */
  const stable = (body: Record<string, unknown>): Record<string, unknown> => {
    const { traceId: _t, instance: _i, ...rest } = body;
    return rest;
  };

  beforeAll(async () => {
    if (!(await databaseReady('payouts'))) throw new Error('database is not migrated (needs payouts): run `pnpm db:migrate`');
    adminUserId = newId();
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, 'Payout Ownership Admin', 'ADMIN', 'ACTIVE')`,
      [adminUserId, `+9194${Math.floor(10000000 + Math.random() * 89999999)}`],
    );
    createdUsers.push(adminUserId);
    adminToken = signAccessToken({ sub: adminUserId, roles: [{ code: 'SUPER_ADMIN' }], customerId: null, farmerId: null });
  });

  afterAll(async () => {
    const { closePool } = await import('../../db/pool.js');
    await closePool();
  });

  it("BR-70a: the QA reproduction: farmer B's account on farmer A's payout is 404 and writes no payout row and no audit row", async () => {
    const a = await makeFarmer('A');
    const b = await makeFarmer('B');
    const auditBefore = await auditRows();
    const keysBefore = await keyRows();

    const res = await post({ farmerId: a.farmerId, amount: '500.00', mode: 'IMPS', bankAccountId: b.accountId });

    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
    expect(res.body.code).toBe('NOT_FOUND');
    expect(await payoutRows(a.farmerId)).toBe(0);
    expect(await payoutRows(b.farmerId)).toBe(0);
    expect(await auditRows()).toBe(auditBefore);
    expect(await keyRows()).toBe(keysBefore);
  });

  it("BR-70a: the same refusal for a payout above Rs 10,000 (the pending-approval path) writes nothing", async () => {
    const a = await makeFarmer('A');
    const b = await makeFarmer('B');
    const res = await post({ farmerId: a.farmerId, amount: '18400.00', mode: 'NEFT', bankAccountId: b.accountId });
    expect(res.status).toBe(404);
    expect(await payoutRows(a.farmerId)).toBe(0);
  });

  it('BR-70a: through the service the same case rejects with NOT_FOUND 404 and leaves no rows', async () => {
    const a = await makeFarmer('A');
    const b = await makeFarmer('B');
    await expect(
      service.createPayout(adminActor(adminUserId), aScope({}), {
        farmerId: a.farmerId,
        amount: '500.00',
        mode: 'IMPS',
        bankAccountId: b.accountId,
      }, newId()),
    ).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
    expect(await payoutRows(a.farmerId)).toBe(0);
  });

  it("BR-70b: the farmer's own bank account is accepted and stored on the payout", async () => {
    const a = await makeFarmer('A');
    const res = await post({ farmerId: a.farmerId, amount: '500.00', mode: 'IMPS', bankAccountId: a.accountId });
    expect(res.status).toBe(201);
    expect(res.body.farmerId).toBe(a.farmerId);
    const row = await pool.query<{ bank_account_id: string }>(`SELECT bank_account_id FROM payouts WHERE id = $1`, [res.body.id]);
    expect(row.rows[0]!.bank_account_id).toBe(a.accountId);
  });

  it('BR-70b: a payout with no bankAccountId is still accepted', async () => {
    const a = await makeFarmer('A');
    const res = await post({ farmerId: a.farmerId, amount: '500.00', mode: 'IMPS' });
    expect(res.status).toBe(201);
    const row = await pool.query<{ bank_account_id: string | null }>(`SELECT bank_account_id FROM payouts WHERE id = $1`, [res.body.id]);
    expect(row.rows[0]!.bank_account_id).toBeNull();
  });

  it("BR-70c: the farmer's own soft-deleted bank account is refused with 404 and writes nothing", async () => {
    const a = await makeFarmer('A');
    await pool.query(`UPDATE farmer_bank_accounts SET deleted_at = now(), is_default = false WHERE id = $1`, [a.accountId]);
    const auditBefore = await auditRows();
    const res = await post({ farmerId: a.farmerId, amount: '500.00', mode: 'IMPS', bankAccountId: a.accountId });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
    expect(await payoutRows(a.farmerId)).toBe(0);
    expect(await auditRows()).toBe(auditBefore);
  });

  it('BR-70d: a nonexistent id, another farmer\'s id and a deleted id give the identical 404 body', async () => {
    const a = await makeFarmer('A');
    const b = await makeFarmer('B');
    await pool.query(`UPDATE farmer_bank_accounts SET deleted_at = now(), is_default = false WHERE id = $1`, [a.accountId]);
    const ghostId = newId();

    // The detail names the id the caller sent, so each body is checked with
    // the caller's own id substituted out. Anything else that differed would
    // tell the caller which of the three situations they are in.
    const norm = (res: { body: Record<string, unknown> }, id: string): string =>
      JSON.stringify(stable(res.body)).split(id).join('<ID>');
    const bodyFor = async (id: string) => {
      const res = await post({ farmerId: a.farmerId, amount: '500.00', mode: 'IMPS', bankAccountId: id });
      expect(res.status).toBe(404);
      return norm(res, id);
    };
    const nonexistent = await bodyFor(ghostId);
    const foreign = await bodyFor(b.accountId);
    const deleted = await bodyFor(a.accountId);
    expect(foreign).toBe(nonexistent);
    expect(deleted).toBe(nonexistent);
    expect(nonexistent).toContain('NOT_FOUND');
  });

  it('BR-70e: a refused payout does not consume the Idempotency-Key: the same key works once the account is right', async () => {
    const a = await makeFarmer('A');
    const b = await makeFarmer('B');
    const key = newId();
    const keysBefore = await keyRows();
    const refused = await post({ farmerId: a.farmerId, amount: '500.00', mode: 'IMPS', bankAccountId: b.accountId }, key);
    expect(refused.status).toBe(404);
    expect(await keyRows()).toBe(keysBefore);
    const ok = await post({ farmerId: a.farmerId, amount: '500.00', mode: 'IMPS', bankAccountId: a.accountId }, key);
    expect(ok.status).toBe(201);
    expect(await payoutRows(a.farmerId)).toBe(1);
  });

  it('BR-70f: creating a payout waits for a concurrent delete of the account (same farmer lock) and then refuses it', async () => {
    const a = await makeFarmer('A');
    // The delete path locks the farmer row first (lockFarmer in the bank-accounts service),
    // checks for in-flight payouts, then soft-deletes. Hold that state in an open transaction.
    const deleter = await pool.connect();
    try {
      await deleter.query('BEGIN');
      await deleter.query(`SELECT id FROM farmers WHERE id = $1 FOR UPDATE`, [a.farmerId]);

      let settled = false;
      const creating = service
        .createPayout(adminActor(adminUserId), aScope({}), {
          farmerId: a.farmerId,
          amount: '500.00',
          mode: 'IMPS',
          bankAccountId: a.accountId,
        }, newId())
        .then(
          () => ({ ok: true as const }),
          (err: unknown) => ({ ok: false as const, err }),
        )
        .finally(() => {
          settled = true;
        });

      await new Promise((r) => setTimeout(r, 400));
      // A payout that did not wait could be committed against an account that is about to be deleted.
      expect(settled).toBe(false);

      await deleter.query(`UPDATE farmer_bank_accounts SET deleted_at = now(), is_default = false WHERE id = $1`, [a.accountId]);
      await deleter.query('COMMIT');

      const outcome = await creating;
      expect(outcome.ok).toBe(false);
      expect((outcome as { err: AppError }).err).toMatchObject({ code: 'NOT_FOUND', status: 404 });
      expect(await payoutRows(a.farmerId)).toBe(0);
    } finally {
      await deleter.query('ROLLBACK').catch(() => undefined);
      deleter.release();
    }
  });
});
