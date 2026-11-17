import { describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import type { Redis } from 'ioredis';
import { RoleCode, ScopeLevel, add, greaterThan, parseMoney, subtract, type Money } from '@tohfa/shared-types';
import type { Actor } from '../../auth/requireAuth.js';
import type { AuditEntry } from '../../audit/auditLog.js';
import type { Executor } from '../../db/pool.js';
import { errorHandler } from '../../http/errorHandler.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { createInMemoryIdempotencyStore } from '../../test/idempotencyStore.js';
import type { WalletRepo, WalletRow } from '../wallet/wallet.repo.js';
import type { WalletMoveInput, WalletService } from '../wallet/wallet.service.js';
import type { WalletTransactionResponse } from '../wallet/wallet.schema.js';
import type { CustomerEligibilityRow, InsertTransferData, TransferConfigRaw, WalletTransfersRepo } from './wallet-transfers.repo.js';
import { createWalletTransfersService, maskName } from './wallet-transfers.service.js';
import { transferLookupRateLimit } from './wallet-transfers.routes.js';
import {
  adminListTransfersResponse,
  createTransferBody,
  createTransferResponse,
  listTransfersResponse,
} from './wallet-transfers.schema.js';

const A = { customer_id: 'c0000000-0000-4000-8000-00000000000a', user_id: 'u0000000-0000-4000-8000-00000000000a', full_name: 'Asha Rao', mobile: '+919800000001' };
const B = { customer_id: 'c0000000-0000-4000-8000-00000000000b', user_id: 'u0000000-0000-4000-8000-00000000000b', full_name: 'Bala Kumar', mobile: '+919800000002' };
const C = { customer_id: 'c0000000-0000-4000-8000-00000000000c', user_id: 'u0000000-0000-4000-8000-00000000000c', full_name: 'Chitra Devi', mobile: '+919800000003' };
const PEOPLE = [A, B, C];

const actorA: Actor = { userId: A.user_id, roles: [], farmerId: null, customerId: A.customer_id };
const scope: ResolvedScope = {
  level: ScopeLevel.OWN, permission: 'wallet.transfer.send', roleCode: RoleCode.CUSTOMER,
  warehouseIds: [], zoneIds: [], userId: A.user_id, customerId: A.customer_id,
};

type Status = Pick<CustomerEligibilityRow, 'user_status' | 'user_deleted' | 'customer_deleted'> & { wallet_status?: string };

/**
 * A ledger fake: balances change ONLY by move(), which rejects an overdraft like the 0007 trigger.
 * Each runTx snapshot is restored when the callback throws, mirroring a rolled-back transaction.
 */
class World {
  balances = new Map<string, Money>();
  walletStatus = new Map<string, string>();
  status = new Map<string, Status>();
  ledger: { walletId: string; type: string; direction: string; amount: Money; key: string }[] = [];
  transfers: InsertTransferData[] = [];
  audits: AuditEntry[] = [];
  events: { name: string; payload: unknown }[] = [];
  locks: string[][] = [];
  config: TransferConfigRaw = { enabled: true, minAmount: '10.00', maxPerTxn: '2000.00', maxDaily: '5000.00', maxMonthly: '20000.00', maxDailyCount: 10 };
  /** Sent earlier this month but not today (BR-150e monthly cap). */
  sentEarlierThisMonth = parseMoney('0');
  private n = 0;

  wallets: WalletRepo = {
    findWalletByOwner: async (_db, _t, id) => this.wallet(id),
    createWallet: async (_db, _t, id) => { this.balances.set(`w-${id}`, parseMoney('0')); return this.wallet(id)!; },
    findWalletBalance: async () => null,
    insertTransaction: async () => { throw new Error('unused'); },
    findTransactionByIdempotencyKey: async () => null,
    listTransactions: async () => ({ items: [], nextCursor: null, hasMore: false }),
  };

  private wallet(customerId: string): WalletRow | null {
    const id = `w-${customerId}`;
    if (!this.balances.has(id)) return null;
    return { id, owner_type: 'CUSTOMER', customer_id: customerId, farmer_id: null, balance: this.balances.get(id)!, currency: 'INR', status: (this.walletStatus.get(id) ?? 'ACTIVE') as WalletRow['status'], version: 1, created_at: new Date(), updated_at: null };
  }

  private statusOf(id: string): Status {
    return this.status.get(id) ?? { user_status: 'ACTIVE', user_deleted: false, customer_deleted: false };
  }

  private eligible(id: string): boolean {
    const s = this.statusOf(id);
    const ws = this.walletStatus.get(`w-${id}`);
    return s.user_status === 'ACTIVE' && !s.user_deleted && !s.customer_deleted && (ws === undefined || ws === 'ACTIVE');
  }

  walletSvc: WalletService = {
    getWalletForActor: async () => { throw new Error('unused'); },
    getWalletWithLimits: async () => { throw new Error('unused'); },
    listTransactionsForActor: async () => { throw new Error('unused'); },
    move: async (_s, input: WalletMoveInput): Promise<WalletTransactionResponse> => {
      const cur = this.balances.get(input.walletId!)!;
      const next = input.direction === 'CREDIT' ? add(cur, input.amount) : subtract(cur, input.amount);
      if (greaterThan(parseMoney('0'), next)) throw new AppError('WALLET_INSUFFICIENT', { status: 402, detail: 'Insufficient wallet balance.' });
      this.balances.set(input.walletId!, next);
      this.ledger.push({ walletId: input.walletId!, type: input.type, direction: input.direction, amount: input.amount, key: input.idempotencyKey });
      return {
        id: `e0000000-0000-4000-8000-${String(++this.n).padStart(12, '0')}`, walletId: input.walletId!, txnType: input.type,
        amount: input.amount, balanceAfter: next, refType: input.refType ?? null, refId: input.refId ?? null,
        fiscalCashTag: null, warehouseId: null, performedBy: null, performedAt: new Date().toISOString(), remarks: null, status: 'COMPLETED',
      };
    },
  };

  repo: WalletTransfersRepo = {
    getConfig: async () => this.config,
    getLookupLimits: async () => ({ perCustomerPerHour: 10, perIpPerHour: 30 }),
    // Mirrors the SQL: only ACTIVE, non-deleted customers whose wallet (if any) is ACTIVE.
    findCustomerByMobile: async (_db, m) => PEOPLE.find((c) => c.mobile === m && this.eligible(c.customer_id)) ?? null,
    findCustomerById: async (_db, id) => PEOPLE.find((c) => c.customer_id === id) ?? null,
    findEligibility: async (_db, id) => {
      const p = PEOPLE.find((c) => c.customer_id === id);
      if (p === undefined) return null;
      const s = this.statusOf(id);
      return { ...p, user_status: s.user_status, user_deleted: s.user_deleted, customer_deleted: s.customer_deleted, wallet_status: this.walletStatus.get(`w-${id}`) ?? (this.balances.has(`w-${id}`) ? 'ACTIVE' : null) };
    },
    lockWallets: async (_db, ids) => { this.locks.push(ids); },
    sentStats: async (_db, id) => {
      const mine = this.transfers.filter((t) => t.senderCustomerId === id);
      const today = mine.reduce((s, t) => add(s, parseMoney(t.amount)), parseMoney('0'));
      return { day_total: today, day_count: mine.length, month_total: add(today, this.sentEarlierThisMonth) };
    },
    newId: async () => `f0000000-0000-4000-8000-${String(++this.n).padStart(12, '0')}`,
    insertTransfer: async (_db, d) => { this.transfers.push(d); return { created_at: new Date('2026-11-16T05:00:00Z') }; },
    listForCustomer: async (_db, id, _after, limit) =>
      this.transfers
        .filter((t) => t.senderCustomerId === id || t.recipientCustomerId === id)
        .slice(0, limit + 1)
        .map((t) => {
          const other = PEOPLE.find((c) => c.customer_id === (t.senderCustomerId === id ? t.recipientCustomerId : t.senderCustomerId))!;
          return { id: t.id, sender_customer_id: t.senderCustomerId, recipient_customer_id: t.recipientCustomerId, amount: t.amount, note: t.note,
            created_at: new Date('2026-11-16T05:00:00Z'), cursor_ts: '2026-11-16T05:00:00.000000Z', counterparty_name: other.full_name, counterparty_mobile: other.mobile };
        }),
    listAdmin: async (_db, f, _after, limit) =>
      this.transfers
        .filter((t) => f.customerId === undefined || t.senderCustomerId === f.customerId || t.recipientCustomerId === f.customerId)
        .slice(0, limit + 1)
        .map((t) => {
          const s = PEOPLE.find((c) => c.customer_id === t.senderCustomerId)!;
          const r = PEOPLE.find((c) => c.customer_id === t.recipientCustomerId)!;
          return { id: t.id, amount: t.amount, note: t.note, created_at: new Date('2026-11-16T05:00:00Z'), cursor_ts: '2026-11-16T05:00:00.000000Z',
            debit_txn_id: t.debitTxnId, credit_txn_id: t.creditTxnId,
            sender_customer_id: s.customer_id, sender_name: s.full_name, sender_mobile: s.mobile,
            recipient_customer_id: r.customer_id, recipient_name: r.full_name, recipient_mobile: r.mobile };
        }),
  };

  service(lookupFloorMs = 0) {
    const db = {} as Executor;
    return createWalletTransfersService({
      repo: this.repo, wallets: this.wallets, walletSvc: this.walletSvc, idempotency: createInMemoryIdempotencyStore(), db,
      runTx: async (fn) => {
        const snap = { balances: new Map(this.balances), ledger: [...this.ledger], transfers: [...this.transfers], audits: [...this.audits] };
        try { return await fn(db); } catch (e) { Object.assign(this, snap); throw e; }
      },
      bus: { publish: async (name, payload) => { this.events.push({ name, payload }); } },
      audit: async (_tx, entry) => { this.audits.push(entry); return 'a1'; },
      lookupFloorMs,
    });
  }
}

function fund(w: World, c: { customer_id: string }, amt: string) { w.balances.set(`w-${c.customer_id}`, parseMoney(amt)); }
const body = (amount: string, extra: object = {}) => ({ recipientMobile: B.mobile, amount, ...extra });

describe('wallet transfers (BR-150)', () => {
  it('BR-150a: with the ops kill switch off lookup and send are 403 WALLET_TRANSFER_DISABLED and nothing moves', async () => {
    for (const flag of [false, null, 'true']) {
      const w = new World(); fund(w, A, '500.00'); w.config.enabled = flag;
      const svc = w.service();
      await expect(svc.lookup(actorA, B.mobile)).rejects.toMatchObject({ code: 'WALLET_TRANSFER_DISABLED', status: 403 });
      await expect(svc.send(actorA, scope, body('100.00'), 'k1')).rejects.toMatchObject({ code: 'WALLET_TRANSFER_DISABLED' });
      expect(w.ledger).toHaveLength(0);
    }
  });

  it('BR-150b: a transfer writes exactly one TRANSFER_OUT and one TRANSFER_IN ledger row and one transfer record', async () => {
    const w = new World(); fund(w, A, '500.00');
    const res = await w.service().send(actorA, scope, body('120.50', { note: 'veg share' }), 'k1');
    expect(w.ledger.map((l) => [l.walletId, l.type, l.direction, l.amount])).toEqual([
      [`w-${A.customer_id}`, 'TRANSFER_OUT', 'DEBIT', '120.50'],
      [`w-${B.customer_id}`, 'TRANSFER_IN', 'CREDIT', '120.50'],
    ]);
    expect(w.balances.get(`w-${A.customer_id}`)).toBe('379.50');
    expect(w.balances.get(`w-${B.customer_id}`)).toBe('120.50'); // recipient wallet created on demand
    expect(w.transfers).toHaveLength(1);
    expect(res).toMatchObject({ direction: 'SENT', amount: '120.50', balanceAfter: '379.50', note: 'veg share', status: 'COMPLETED' });
    expect(res.counterparty).toEqual({ displayName: 'B*** K***', mobileMasked: '*********0002' });
    expect(() => createTransferResponse.parse(res)).not.toThrow();
    expect(w.locks[0]!.sort()).toEqual([`w-${A.customer_id}`, `w-${B.customer_id}`].sort());
  });

  it('BR-150c: insufficient balance is 402 WALLET_INSUFFICIENT and nothing is recorded, audited or announced', async () => {
    const w = new World(); fund(w, A, '50.00');
    const err = await w.service().send(actorA, scope, body('60.00'), 'k1').catch((e: unknown) => e);
    expect(err).toMatchObject({ code: 'WALLET_INSUFFICIENT', status: 402 });
    expect(w.ledger).toHaveLength(0);
    expect(w.transfers).toHaveLength(0);
    expect(w.audits).toHaveLength(0);
    expect(w.events).toHaveLength(0);
  });

  it('BR-150d: replaying the Idempotency-Key moves money once and returns the original response', async () => {
    const w = new World(); fund(w, A, '500.00');
    const svc = w.service();
    const first = await svc.send(actorA, scope, body('100.00'), 'same-key');
    const second = await svc.send(actorA, scope, body('100.00'), 'same-key');
    expect(second).toEqual(first);
    expect(w.ledger).toHaveLength(2);
    expect(w.balances.get(`w-${A.customer_id}`)).toBe('400.00');
    expect(w.events).toHaveLength(2); // credited + debited, once
    expect(w.audits).toHaveLength(1);
    await expect(svc.send(actorA, scope, body('200.00'), 'same-key')).rejects.toMatchObject({ code: 'IDEMPOTENCY_KEY_REUSED' });
  });

  it('BR-150d: a missing Idempotency-Key is 422 and moves nothing', async () => {
    const w = new World(); fund(w, A, '500.00');
    await expect(w.service().send(actorA, scope, body('100.00'), undefined)).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    expect(w.ledger).toHaveLength(0);
  });

  it('BR-150e: per-transfer min/max and the daily max come from system_config', async () => {
    const w = new World(); fund(w, A, '9000.00');
    const svc = w.service();
    await expect(svc.send(actorA, scope, body('9.99'), 'k1')).rejects.toMatchObject({ code: 'WALLET_TRANSFER_LIMIT_EXCEEDED', status: 422 });
    await expect(svc.send(actorA, scope, body('2000.01'), 'k2')).rejects.toMatchObject({ code: 'WALLET_TRANSFER_LIMIT_EXCEEDED' });
    await svc.send(actorA, scope, body('2000.00'), 'k3');
    await svc.send(actorA, scope, body('2000.00'), 'k4');
    await expect(svc.send(actorA, scope, body('1000.01'), 'k5')).rejects.toMatchObject({ code: 'WALLET_TRANSFER_LIMIT_EXCEEDED' });
    await svc.send(actorA, scope, body('1000.00'), 'k6'); // exactly the daily max
    expect(w.transfers).toHaveLength(3);
    w.config.maxDaily = '6000.00';
    await svc.send(actorA, scope, body('1000.00'), 'k7');
    expect(w.transfers).toHaveLength(4);
  });

  it('BR-150e: the monthly cap counts earlier days; exactly at the cap is allowed, one paisa over is not', async () => {
    const w = new World(); fund(w, A, '9000.00');
    w.sentEarlierThisMonth = parseMoney('19500.00');
    const svc = w.service();
    await expect(svc.send(actorA, scope, body('500.01'), 'k1')).rejects.toMatchObject({ code: 'WALLET_TRANSFER_LIMIT_EXCEEDED', detail: expect.stringContaining('monthly') });
    await svc.send(actorA, scope, body('500.00'), 'k2');
    await expect(svc.send(actorA, scope, body('10.00'), 'k3')).rejects.toMatchObject({ code: 'WALLET_TRANSFER_LIMIT_EXCEEDED' });
    expect(w.transfers).toHaveLength(1);
  });

  it('BR-150e: at most max_daily_count transfers per day', async () => {
    const w = new World(); fund(w, A, '1000.00'); w.config.maxDailyCount = 3;
    const svc = w.service();
    for (const k of ['k1', 'k2', 'k3']) await svc.send(actorA, scope, body('10.00'), k);
    await expect(svc.send(actorA, scope, body('10.00'), 'k4')).rejects.toMatchObject({ code: 'WALLET_TRANSFER_LIMIT_EXCEEDED', detail: expect.stringContaining('3 transfers') });
    expect(w.transfers).toHaveLength(3);
    expect(w.balances.get(`w-${A.customer_id}`)).toBe('970.00');
  });

  it('BR-150e: missing or malformed limits fail closed (INTERNAL)', async () => {
    for (const bad of [{ minAmount: null }, { maxPerTxn: 2000 }, { maxDaily: '0.00' }, { minAmount: '3000.00' },
      { maxMonthly: null }, { maxMonthly: 'lots' }, { maxDailyCount: 0 }, { maxDailyCount: '10' }, { maxDailyCount: 2.5 }]) {
      const w = new World(); fund(w, A, '500.00'); Object.assign(w.config, bad);
      await expect(w.service().send(actorA, scope, body('100.00'), 'k')).rejects.toMatchObject({ code: 'INTERNAL' });
      expect(w.ledger).toHaveLength(0);
    }
  });

  it('BR-150f: sending to yourself is 422 WALLET_TRANSFER_SELF; an unknown mobile is 404', async () => {
    const w = new World(); fund(w, A, '500.00');
    const svc = w.service();
    await expect(svc.send(actorA, scope, { recipientMobile: A.mobile, amount: '20.00' }, 'k1')).rejects.toMatchObject({ code: 'WALLET_TRANSFER_SELF', status: 422 });
    await expect(svc.lookup(actorA, A.mobile)).rejects.toMatchObject({ code: 'WALLET_TRANSFER_SELF' });
    await expect(svc.send(actorA, scope, { recipientMobile: '+919899999999', amount: '20.00' }, 'k2')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(w.ledger).toHaveLength(0);
  });

  it('BR-150f/j: a disabled, deleted or frozen recipient is indistinguishable from an unknown number', async () => {
    const unknown = await new World().service().lookup(actorA, '+919899999999').catch((e: unknown) => e) as AppError;
    const cases: ((w: World) => void)[] = [
      (w) => w.status.set(B.customer_id, { user_status: 'DISABLED', user_deleted: false, customer_deleted: false }),
      (w) => w.status.set(B.customer_id, { user_status: 'ACTIVE', user_deleted: true, customer_deleted: false }),
      (w) => w.status.set(B.customer_id, { user_status: 'ACTIVE', user_deleted: false, customer_deleted: true }),
      (w) => { fund(w, B, '0.00'); w.walletStatus.set(`w-${B.customer_id}`, 'FROZEN'); },
    ];
    for (const setup of cases) {
      const w = new World(); fund(w, A, '500.00'); setup(w);
      const svc = w.service();
      const err = await svc.lookup(actorA, B.mobile).catch((e: unknown) => e) as AppError;
      expect({ code: err.code, status: err.status, detail: err.detail }).toEqual({ code: unknown.code, status: unknown.status, detail: unknown.detail });
      await expect(svc.send(actorA, scope, body('20.00'), 'k')).rejects.toMatchObject({ code: 'NOT_FOUND' });
      expect(w.ledger).toHaveLength(0);
    }
  });

  it('BR-150j: the sender must be ACTIVE (OTP-verified), not deleted, with an ACTIVE wallet', async () => {
    const cases: ((w: World) => void)[] = [
      (w) => w.status.set(A.customer_id, { user_status: 'PENDING', user_deleted: false, customer_deleted: false }),
      (w) => w.status.set(A.customer_id, { user_status: 'DISABLED', user_deleted: false, customer_deleted: false }),
      (w) => w.status.set(A.customer_id, { user_status: 'ACTIVE', user_deleted: true, customer_deleted: false }),
      (w) => w.status.set(A.customer_id, { user_status: 'ACTIVE', user_deleted: false, customer_deleted: true }),
      (w) => w.walletStatus.set(`w-${A.customer_id}`, 'FROZEN'),
      (w) => w.walletStatus.set(`w-${A.customer_id}`, 'CLOSED'),
    ];
    for (const setup of cases) {
      const w = new World(); fund(w, A, '500.00'); setup(w);
      const svc = w.service();
      await expect(svc.send(actorA, scope, body('20.00'), 'k')).rejects.toMatchObject({ code: 'FORBIDDEN', status: 403 });
      await expect(svc.lookup(actorA, B.mobile)).rejects.toMatchObject({ code: 'FORBIDDEN' });
      expect(w.ledger).toHaveLength(0);
    }
  });

  it('BR-150g: lookup returns only a masked name and masked mobile', async () => {
    const w = new World();
    const r = await w.service().lookup(actorA, B.mobile);
    expect(r).toEqual({ displayName: 'B*** K***', mobileMasked: '*********0002' });
    expect(maskName('  ravi  ')).toBe('R***');
  });

  it('BR-150g: found and not-found lookups both wait for the latency floor', async () => {
    const svc = new World().service(60);
    for (const m of [B.mobile, '+919899999999']) {
      const t0 = Date.now();
      await svc.lookup(actorA, m).catch(() => undefined);
      expect(Date.now() - t0).toBeGreaterThanOrEqual(55);
    }
  });

  it('BR-150h: after commit the recipient gets wallet.credited and the sender wallet.debited, each with their new balance', async () => {
    const w = new World(); fund(w, A, '500.00'); fund(w, B, '10.00');
    const res = await w.service().send(actorA, scope, body('40.00'), 'k1');
    expect(w.events).toEqual([
      { name: 'wallet.credited', payload: { userId: B.user_id, amount: '40.00', balance: '50.00', reference: res.id } },
      { name: 'wallet.debited', payload: { userId: A.user_id, amount: '40.00', balance: '460.00', reference: res.id } },
    ]);
  });

  it('BR-150h: a failing event publish never fails a committed transfer', async () => {
    const w = new World(); fund(w, A, '500.00');
    const svc = createWalletTransfersService({
      repo: w.repo, wallets: w.wallets, walletSvc: w.walletSvc, idempotency: createInMemoryIdempotencyStore(), db: {} as Executor,
      runTx: async (fn) => fn({} as Executor), audit: async () => 'a', lookupFloorMs: 0,
      bus: { publish: async () => { throw new Error('bus down'); } },
    });
    await expect(svc.send(actorA, scope, body('40.00'), 'k1')).resolves.toMatchObject({ status: 'COMPLETED' });
  });

  it('BR-150i: history shows SENT to the sender and RECEIVED to the recipient, masked', async () => {
    const w = new World(); fund(w, A, '500.00');
    const svc = w.service();
    await svc.send(actorA, scope, body('40.00'), 'k1');
    const mine = await svc.list(actorA, { limit: 20 });
    expect(mine.items.map((i) => [i.direction, i.amount, i.counterparty.displayName])).toEqual([['SENT', '40.00', 'B*** K***']]);
    const theirs = await svc.list({ ...actorA, userId: B.user_id, customerId: B.customer_id }, { limit: 20 });
    expect(theirs.items.map((i) => [i.direction, i.counterparty.mobileMasked])).toEqual([['RECEIVED', '*********0001']]);
    expect(() => listTransfersResponse.parse(mine)).not.toThrow();
    expect((await svc.list({ ...actorA, customerId: null }, { limit: 20 })).items).toEqual([]);
    await expect(svc.list(actorA, { limit: 20, cursor: 'bogus' })).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });

  it('BR-150k: the note is plain text, at most 100 characters, sanitised', () => {
    const parse = (note: string) => createTransferBody.parse({ recipientMobile: B.mobile, amount: '10.00', note }).note;
    expect(parse('  veg\u0000 <b>share</b>‮  \n ok ')).toBe('veg b share /b ok');
    expect(parse(' ​\t ')).toBeUndefined();
    expect(parse('x'.repeat(100))).toHaveLength(100);
    expect(createTransferBody.safeParse({ recipientMobile: B.mobile, amount: '10.00', note: 'x'.repeat(101) }).success).toBe(false);
  });

  it('BR-150m: every transfer writes one audit_log row in the same transaction', async () => {
    const w = new World(); fund(w, A, '500.00');
    const res = await w.service().send(actorA, scope, body('25.00', { note: 'rent' }), 'k1');
    expect(w.audits).toEqual([expect.objectContaining({
      actorId: A.user_id, actionCode: 'wallet.transfer.send', entityType: 'wallet_transfer', entityId: res.id,
      after: expect.objectContaining({ senderCustomerId: A.customer_id, recipientCustomerId: B.customer_id, amount: '25.00', note: 'rent' }),
    })]);
  });

  it('BR-150l: the admin list shows both parties unmasked and validates its filters', async () => {
    const w = new World(); fund(w, A, '500.00');
    const svc = w.service();
    await svc.send(actorA, scope, body('25.00'), 'k1');
    const all = await svc.adminList({ limit: 20 });
    expect(all.items[0]).toMatchObject({ amount: '25.00', sender: { customerId: A.customer_id, fullName: 'Asha Rao', mobile: A.mobile }, recipient: { customerId: B.customer_id, mobile: B.mobile } });
    expect(() => adminListTransfersResponse.parse(all)).not.toThrow();
    expect((await svc.adminList({ limit: 20, customerId: C.customer_id })).items).toEqual([]);
    await expect(svc.adminList({ limit: 20, from: '2026-11-20', to: '2026-11-01' })).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    await expect(svc.adminList({ limit: 20, minAmount: '100.00', maxAmount: '10.00' })).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });

  it('a non-customer actor cannot send', async () => {
    const w = new World();
    await expect(w.service().send({ ...actorA, customerId: null }, scope, body('20.00'), 'k')).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});

/** Sliding-window fake with the same contract as the Lua script in rateLimiter.ts. */
function fakeRedis(): Pick<Redis, 'eval'> {
  const buckets = new Map<string, number[]>();
  return {
    eval: (async (_s: string, _n: number, key: string, now: string, windowMs: string, max: string) => {
      const t = Number(now);
      const list = (buckets.get(key) ?? []).filter((x) => x > t - Number(windowMs));
      const count = list.length;
      if (count < Number(max)) list.push(t);
      buckets.set(key, list);
      return [count, Number(windowMs) - (t - (list[0] ?? t))];
    }) as unknown as Redis['eval'],
  };
}

describe('BR-150g: lookup rate limit (per customer and per IP)', () => {
  function appWith(limiter: express.RequestHandler, customerOf: (req: express.Request) => string) {
    const app = express();
    app.set('trust proxy', true);
    app.use((req, _res, next) => { req.actor = { userId: 'u', roles: [], farmerId: null, customerId: customerOf(req) }; next(); });
    app.post('/lookup', limiter, (_req, res) => { res.json({ ok: true }); });
    app.use(errorHandler);
    return app;
  }

  it('the 11th lookup in an hour by one customer is 429 with Retry-After', async () => {
    const app = appWith(transferLookupRateLimit({ client: fakeRedis(), getLimits: async () => ({ perCustomerPerHour: 10, perIpPerHour: 100 }) }), () => 'cust-1');
    for (let i = 0; i < 10; i++) {
      expect((await request(app).post('/lookup').set('X-Forwarded-For', `10.0.0.${i}`)).status).toBe(200);
    }
    const res = await request(app).post('/lookup').set('X-Forwarded-For', '10.0.0.99');
    expect(res.status).toBe(429);
    expect(res.body.code).toBe('RATE_LIMITED');
    expect(Number(res.headers['retry-after'])).toBeGreaterThan(0);
  });

  it('one IP is capped across many customer accounts', async () => {
    let n = 0;
    const app = appWith(transferLookupRateLimit({ client: fakeRedis(), getLimits: async () => ({ perCustomerPerHour: 10, perIpPerHour: 3 }) }), () => `cust-${n++}`);
    for (let i = 0; i < 3; i++) expect((await request(app).post('/lookup').set('X-Forwarded-For', '10.0.0.1')).status).toBe(200);
    expect((await request(app).post('/lookup').set('X-Forwarded-For', '10.0.0.1')).status).toBe(429);
  });

  it('falls back to the defaults on bad config and fails open when Redis is down', async () => {
    const app = appWith(transferLookupRateLimit({ client: fakeRedis(), getLimits: async () => ({ perCustomerPerHour: 'x', perIpPerHour: null }) }), () => 'c');
    for (let i = 0; i < 10; i++) await request(app).post('/lookup').set('X-Forwarded-For', `10.1.0.${i}`);
    expect((await request(app).post('/lookup').set('X-Forwarded-For', '10.1.0.50')).status).toBe(429);
    const down = appWith(transferLookupRateLimit({ client: { eval: (async () => { throw new Error('ECONNREFUSED'); }) as unknown as Redis['eval'] }, getLimits: async () => ({ perCustomerPerHour: 1, perIpPerHour: 1 }) }), () => 'c');
    for (let i = 0; i < 3; i++) expect((await request(down).post('/lookup')).status).toBe(200);
  });
});
