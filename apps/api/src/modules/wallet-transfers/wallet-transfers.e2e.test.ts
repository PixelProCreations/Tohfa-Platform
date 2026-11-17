/**
 * BR-150 over HTTP against a LOCAL throwaway database (dbSafety guards it): the real ledger
 * triggers, row locks, idempotency table, audit_log and the admin list. Skipped without DATABASE_URL.
 */
import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { RoleCode, ScopeLevel, parseMoney } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { pool } from '../../db/pool.js';
import { redis } from '../../redis.js';
import { aScope, describeIfDatabase, newId } from '../../test/factories.js';
import { walletService } from '../wallet/wallet.service.js';

describeIfDatabase('BR-150 wallet transfers over HTTP', () => {
  let app: Express;
  const tail = String(Date.now()).slice(-6);
  const people: Record<'a' | 'b' | 'c' | 'd', { userId: string; customerId: string; walletId: string; mobile: string; token: string }> = {} as never;
  let adminTok: string;
  let enabledBefore: unknown;

  const q = async <T>(sql: string, p: unknown[] = []) => (await pool.query(sql, p)).rows as T[];
  const auth = (k: keyof typeof people) => ({ Authorization: `Bearer ${people[k].token}` });
  const balance = async (k: keyof typeof people) =>
    (await q<{ balance: string }>('SELECT balance::text AS balance FROM wallets WHERE id = $1', [people[k].walletId]))[0]!.balance;
  const send = (k: keyof typeof people, key: string | null, body: object) => {
    const r = request(app).post('/v1/wallets/me/transfers').set(auth(k));
    return (key === null ? r : r.set('Idempotency-Key', key)).send(body);
  };

  async function makeCustomer(k: keyof typeof people, name: string, prefix: string, status = 'ACTIVE') {
    const userId = newId();
    const mobile = `+91${prefix}${tail}`;
    await q(`INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1,$2,$3,'CUSTOMER',$4)`, [userId, mobile, name, status]);
    const customerId = (await q<{ id: string }>(
      `INSERT INTO customers (user_id, customer_code) VALUES ($1,$2) RETURNING id`, [userId, `CUST-WT-${k}-${tail}`]))[0]!.id;
    const walletId = (await q<{ id: string }>(
      `INSERT INTO wallets (owner_type, customer_id, balance, currency, status) VALUES ('CUSTOMER',$1,'0.00','INR','ACTIVE') RETURNING id`,
      [customerId]))[0]!.id;
    const token = signAccessToken({ sub: userId, roles: [{ code: RoleCode.CUSTOMER }], farmerId: null, customerId });
    people[k] = { userId, customerId, walletId, mobile, token };
  }

  async function fund(k: keyof typeof people, amount: string) {
    await walletService.move(
      aScope({ level: ScopeLevel.ALL, permission: 'wallet.manual_credit_debit', roleCode: RoleCode.SUPER_ADMIN }),
      { walletId: people[k].walletId, idempotencyKey: `wt-e2e-fund-${newId()}`, direction: 'CREDIT', type: 'TOPUP_CASH', amount: parseMoney(amount), refType: 'TEST', refId: null, remarks: 'BR-150 e2e funding' },
    );
  }

  beforeAll(async () => {
    app = createApp();
    enabledBefore = (await q<{ value: unknown }>(`SELECT value FROM system_config WHERE key = 'wallet_transfer.enabled'`))[0]?.value;
    // Lookup buckets are per IP too; start every run with a clean IP window for 127.0.0.1.
    const stale = await redis.keys('wallet-transfer-lookup:ip:*');
    if (stale.length > 0) await redis.del(...stale);
    await makeCustomer('a', 'Asha Rao', '98701');
    await makeCustomer('b', 'Bala Kumar', '98702');
    await makeCustomer('c', 'Chitra Devi', '98703');
    await makeCustomer('d', 'Dinesh Disabled', '98704', 'DISABLED');
    const adminUser = newId();
    await q(`INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1,$2,'WT Admin','ADMIN','ACTIVE')`, [adminUser, `+9198705${tail}`]);
    adminTok = signAccessToken({ sub: adminUser, roles: [{ code: RoleCode.SUPER_ADMIN }], farmerId: null, customerId: null });
    await fund('a', '100.00');
  });

  afterAll(async () => {
    await q(`UPDATE system_config SET value = $1::jsonb WHERE key = 'wallet_transfer.enabled'`, [JSON.stringify(enabledBefore ?? true)]);
  });

  it('BR-150a: migration 0150 turned the feature on', () => {
    expect(enabledBefore).toBe(true);
  });

  it('BR-150g/f: lookup masks a real customer; disabled and unknown numbers get the identical 404', async () => {
    const ok = await request(app).post('/v1/wallets/me/transfers/lookup').set(auth('a')).send({ mobile: people.b.mobile });
    expect(ok.status, JSON.stringify(ok.body)).toBe(200);
    expect(ok.body).toEqual({ displayName: 'B*** K***', mobileMasked: expect.stringMatching(/^\*+\d{4}$/) });
    const pick = (b: Record<string, unknown>) => ({ code: b['code'], status: b['status'], title: b['title'], detail: b['detail'] });
    const disabled = await request(app).post('/v1/wallets/me/transfers/lookup').set(auth('a')).send({ mobile: people.d.mobile });
    const unknown = await request(app).post('/v1/wallets/me/transfers/lookup').set(auth('a')).send({ mobile: `+9198799${tail}` });
    expect(disabled.status).toBe(404);
    expect(unknown.status).toBe(404);
    expect(pick(disabled.body)).toEqual(pick(unknown.body));
  });

  it('BR-150d: no Idempotency-Key is 422 and moves nothing', async () => {
    const res = await send('a', null, { recipientMobile: people.b.mobile, amount: '10.00' });
    expect(res.status).toBe(422);
    expect(await balance('a')).toBe('100.00');
  });

  it('BR-150b/d/m: a transfer is double-entry, replay-safe and audited', async () => {
    const key = `wt-e2e-${newId()}`;
    const body = { recipientMobile: people.b.mobile, amount: '25.50', note: '  rent <b>share</b> ' };
    const first = await send('a', key, body);
    expect(first.status, JSON.stringify(first.body)).toBe(201);
    expect(first.body).toMatchObject({ direction: 'SENT', amount: '25.50', balanceAfter: '74.50', note: 'rent b share /b', status: 'COMPLETED' });
    const replay = await send('a', key, body);
    expect(replay.status).toBe(201);
    expect(replay.body).toEqual(first.body);
    expect(await balance('a')).toBe('74.50');
    expect(await balance('b')).toBe('25.50');
    const legs = await q<{ type: string; amount: string }>(
      `SELECT type::text AS type, amount::text AS amount FROM wallet_transactions WHERE ref_id = $1 ORDER BY type`, [first.body.id]);
    expect(legs).toEqual([{ type: 'TRANSFER_IN', amount: '25.50' }, { type: 'TRANSFER_OUT', amount: '25.50' }]);
    const audit = await q<{ actor_id: string; action_code: string }>(
      `SELECT actor_id, action_code FROM audit_log WHERE entity_type = 'wallet_transfer' AND entity_id = $1`, [first.body.id]);
    expect(audit).toEqual([{ actor_id: people.a.userId, action_code: 'wallet.transfer.send' }]);
    const conflict = await send('a', key, { ...body, amount: '26.00' });
    expect(conflict.status).toBe(409);
  });

  it('BR-150c/f: overdraft is 402 WALLET_INSUFFICIENT; own number 422; disabled recipient 404', async () => {
    const over = await send('a', `wt-e2e-${newId()}`, { recipientMobile: people.b.mobile, amount: '500.00' });
    expect(over.status).toBe(402);
    expect(over.body.code).toBe('WALLET_INSUFFICIENT');
    const self = await send('a', `wt-e2e-${newId()}`, { recipientMobile: people.a.mobile, amount: '10.00' });
    expect(self.status).toBe(422);
    expect(self.body.code).toBe('WALLET_TRANSFER_SELF');
    const toDisabled = await send('a', `wt-e2e-${newId()}`, { recipientMobile: people.d.mobile, amount: '10.00' });
    expect(toDisabled.status).toBe(404);
    expect(await balance('a')).toBe('74.50');
  });

  it('BR-150j: a disabled sender cannot send', async () => {
    const res = await send('d', `wt-e2e-${newId()}`, { recipientMobile: people.b.mobile, amount: '10.00' });
    expect(res.status).toBe(403);
  });

  it('BR-150e: two parallel transfers cannot overdraw one wallet (row locks + ledger trigger)', async () => {
    // a holds 74.50: each 50.00 alone fits, both together do not.
    const [r1, r2] = await Promise.all([
      send('a', `wt-e2e-${newId()}`, { recipientMobile: people.b.mobile, amount: '50.00' }),
      send('a', `wt-e2e-${newId()}`, { recipientMobile: people.c.mobile, amount: '50.00' }),
    ]);
    expect([r1.status, r2.status].sort()).toEqual([201, 402]);
    expect(await balance('a')).toBe('24.50');
    const sum = await q<{ total: string }>(
      `SELECT (SELECT balance FROM wallets WHERE id = $1) + (SELECT balance FROM wallets WHERE id = $2) + (SELECT balance FROM wallets WHERE id = $3) AS total`,
      [people.a.walletId, people.b.walletId, people.c.walletId]);
    expect(sum[0]!.total).toBe('100.00'); // money is moved, never created or destroyed
  });

  it('BR-150i: the recipient sees a RECEIVED, masked history row', async () => {
    const res = await request(app).get('/v1/wallets/me/transfers').set(auth('b'));
    expect(res.status).toBe(200);
    expect(res.body.items[0]).toMatchObject({ direction: 'RECEIVED', counterparty: { displayName: 'A*** R***' } });
  });

  it('BR-150l: admins list transfers unmasked by customer/amount; customers are 403', async () => {
    const res = await request(app).get('/v1/admin/wallet-transfers')
      .query({ customerId: people.a.customerId, minAmount: '20.00' }).set({ Authorization: `Bearer ${adminTok}` });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.items.map((i: { amount: string }) => i.amount).sort()).toEqual(['25.50', '50.00']);
    expect(res.body.items[0].sender).toEqual({ customerId: people.a.customerId, fullName: 'Asha Rao', mobile: people.a.mobile });
    const page1 = await request(app).get('/v1/admin/wallet-transfers').query({ customerId: people.a.customerId, limit: 1 }).set({ Authorization: `Bearer ${adminTok}` });
    expect(page1.body.page.hasMore).toBe(true);
    const page2 = await request(app).get('/v1/admin/wallet-transfers')
      .query({ customerId: people.a.customerId, limit: 1, cursor: page1.body.page.nextCursor }).set({ Authorization: `Bearer ${adminTok}` });
    expect(page2.body.items[0].id).not.toBe(page1.body.items[0].id);
    expect((await request(app).get('/v1/admin/wallet-transfers').set(auth('a'))).status).toBe(403);
  });

  it('BR-150g: the 11th lookup in an hour by one customer is 429', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 11; i++) {
      statuses.push((await request(app).post('/v1/wallets/me/transfers/lookup').set(auth('c')).send({ mobile: people.b.mobile })).status);
    }
    expect(statuses.slice(0, 10).every((s) => s === 200)).toBe(true);
    expect(statuses[10]).toBe(429);
  });

  it('BR-150a: switching the flag off stops sends immediately', async () => {
    await q(`UPDATE system_config SET value = 'false'::jsonb WHERE key = 'wallet_transfer.enabled'`);
    const res = await send('b', `wt-e2e-${newId()}`, { recipientMobile: people.c.mobile, amount: '10.00' });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('WALLET_TRANSFER_DISABLED');
  });
});
