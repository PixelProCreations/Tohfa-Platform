/**
 * SWA Module 7 (Customers) - PostgreSQL tests. Mocked-repo tests alone have let SQL on the wrong
 * columns ship before, so every repo query runs here against a migrated database:
 *
 *   1. service + real repo inside a transaction that is rolled back (fresh fixture warehouses, so
 *      the visible set is exactly what the test created),
 *   2. real HTTP through the customers router on a local Express app (the lead mounts the router in
 *      app.ts; this suite does not depend on that), against committed fixtures it removes after.
 *
 * Skips visibly (never silently passes) when no migrated database is configured.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import express, { type Express } from 'express';
import request from 'supertest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { aScope, describeIfDatabase, IDS, newId } from '../../test/factories.js';
import {
  ensureStandardUsers,
  insertCrop,
  insertFarmerWithPlot,
  insertUser,
  randomMobile,
  requireDatabaseTables,
} from '../../test/dbFixtures.js';
import { walletRepo } from '../wallet/wallet.repo.js';
import { decodeTimeKey } from './customers.policy.js';
import { customersRepo } from './customers.repo.js';
import {
  adminCustomerDetailSchema,
  adminCustomerListResponseSchema,
  adminCustomerSupportTicketDetailSchema,
  adminCustomerWalletSummarySchema,
  walletTransactionSchema,
} from './customers.schema.js';
import { createCustomersService } from './customers.service.js';

class RollbackFixture extends Error {}

const TABLES = ['customers', 'orders', 'order_items', 'wallets', 'wallet_transactions', 'topups', 'support_tickets', 'support_messages', 'return_requests', 'system_config'];
const dbReady = (): Promise<boolean> => requireDatabaseTables(...TABLES);

function dbIt(name: string, fn: () => Promise<void>): void {
  it(name, async (ctx) => {
    if (!(await dbReady())) return ctx.skip();
    await fn();
  });
}

async function rejects(promise: Promise<unknown>): Promise<AppError> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(AppError);
    return error as AppError;
  }
  throw new Error('expected a rejection');
}

function leaksMobile(value: unknown, mobile: string): boolean {
  const digits = mobile.replace(/\D/g, '');
  const json = JSON.stringify(value);
  for (let i = 0; i + 5 <= digits.length; i += 1) if (json.includes(digits.slice(i, i + 5))) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Fixture builders (all take an Executor so they work in a rolled-back tx or on the pool)
// ---------------------------------------------------------------------------
interface CustomerFx {
  id: string;
  userId: string;
  mobile: string;
  name: string;
}

async function addWarehouse(db: Executor): Promise<string> {
  const id = newId();
  await db.query(`INSERT INTO warehouses (id, code, name) VALUES ($1, $2, 'Fixture Warehouse')`, [id, `WH-M7-${id.slice(0, 8)}`]);
  return id;
}

async function addCustomer(
  db: Executor,
  name: string,
  opts: { preferred?: string; createdDaysAgo?: number; email?: string } = {},
): Promise<CustomerFx> {
  const userId = newId();
  const mobile = randomMobile();
  await db.query(`INSERT INTO users (id, mobile, email, full_name, user_type, status) VALUES ($1, $2, $3, $4, 'CUSTOMER', 'ACTIVE')`, [
    userId,
    mobile,
    opts.email ?? `${userId.slice(0, 8)}@example.com`,
    name,
  ]);
  const id = newId();
  await db.query(
    `INSERT INTO customers (id, user_id, customer_code, preferred_warehouse_id, created_at)
     VALUES ($1, $2, $3, $4, now() - make_interval(days => $5::int))`,
    [id, userId, `CUST-M7-${id.slice(0, 8)}`, opts.preferred ?? null, opts.createdDaysAgo ?? 0],
  );
  return { id, userId, mobile, name };
}

async function addOrder(
  db: Executor,
  customerId: string,
  warehouseId: string,
  opts: { completedDaysAgo?: number | null; total?: string; status?: string } = {},
): Promise<string> {
  const id = newId();
  const completed = opts.completedDaysAgo === undefined ? 0 : opts.completedDaysAgo;
  await db.query(
    `INSERT INTO orders (id, order_number, customer_id, warehouse_id, channel, total_amount, payment_method, payment_status, status, placed_at, completed_at)
     VALUES ($1, $2, $3, $4, 'DIRECT', $5, 'CASH', 'PAID', $6,
             now() - make_interval(days => COALESCE($7::int, 0)),
             CASE WHEN $7::int IS NULL THEN NULL ELSE now() - make_interval(days => $7::int) END)`,
    [id, `ORD-M7-${id.slice(0, 8)}`, customerId, warehouseId, opts.total ?? '100.00', opts.status ?? 'PICKED_UP', completed],
  );
  return id;
}

async function addItem(db: Executor, orderId: string, cropId: string, batchId: string | null): Promise<string> {
  const id = newId();
  await db.query(
    `INSERT INTO order_items (id, order_id, crop_id, grade, qty_kg, unit_price, line_total, batch_id)
     VALUES ($1, $2, $3, 'GRADE_1', 2.5, 40.00, 100.00, $4)`,
    [id, orderId, cropId, batchId],
  );
  return id;
}

async function addBatch(db: Executor, warehouseId: string, cropId: string, farmerId: string): Promise<string> {
  const id = newId();
  await db.query(
    `INSERT INTO inventory_batches (id, batch_code, warehouse_id, crop_id, grade, source_farmer_id, qty_received)
     VALUES ($1, $2, $3, $4, 'GRADE_1', $5, 10)`,
    [id, `BATCH-M7-${id.slice(0, 8)}`, warehouseId, cropId, farmerId],
  );
  return id;
}

async function addWallet(db: Executor, customerId: string): Promise<string> {
  const id = newId();
  await db.query(`INSERT INTO wallets (id, owner_type, customer_id) VALUES ($1, 'CUSTOMER', $2)`, [id, customerId]);
  return id;
}

async function addTxn(db: Executor, walletId: string, direction: 'CREDIT' | 'DEBIT', amount: string, createdAt?: string): Promise<string> {
  const id = newId();
  await db.query(
    `INSERT INTO wallet_transactions (id, wallet_id, idempotency_key, direction, type, amount, balance_after, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, 0, COALESCE($7::timestamptz, now()))`,
    [id, walletId, `m7-${id}`, direction, direction === 'CREDIT' ? 'TOPUP_DIGITAL' : 'ORDER_DEBIT', amount, createdAt ?? null],
  );
  return id;
}

async function addTopup(db: Executor, customerId: string, walletId: string, warehouseId: string, processedBy: string, daysAgo = 0): Promise<void> {
  await db.query(
    `INSERT INTO topups (wallet_id, customer_id, channel, amount, fiscal_cash_tag, warehouse_id, processed_by, status, created_at)
     VALUES ($1, $2, 'CASH', 500.00, $3, $4, $5, 'SUCCESS', now() - make_interval(days => $6::int))`,
    [walletId, customerId, `FT-M7-${newId().slice(0, 12)}`, warehouseId, processedBy, daysAgo],
  );
}

async function addTicket(db: Executor, customerId: string, orderId: string | null, status = 'OPEN'): Promise<string> {
  const id = newId();
  await db.query(
    `INSERT INTO support_tickets (id, ticket_number, customer_id, order_id, category, subject, description, status)
     VALUES ($1, $2, $3, $4, 'QUALITY', 'Soft carrots', 'The carrots were soft.', $5)`,
    [id, `TKT-M7-${id.slice(0, 8)}`, customerId, orderId, status],
  );
  return id;
}

/**
 * Rows inserted in one transaction share `now()`, so each fixture message is placed `secondsAgo`
 * before it: the thread order (created_at, id) is then deterministic, and a reply (stamped `now()`)
 * sorts last.
 */
async function addMessage(db: Executor, ticketId: string, senderUserId: string, body: string, isInternal: boolean, secondsAgo: number): Promise<string> {
  const id = newId();
  await db.query(
    `INSERT INTO support_messages (id, ticket_id, sender_user_id, body, is_internal, created_at)
     VALUES ($1, $2, $3, $4, $5, now() - make_interval(secs => $6::int))`,
    [id, ticketId, senderUserId, body, isInternal, secondsAgo],
  );
  return id;
}

// ---------------------------------------------------------------------------
// 1. Service + repo in a rolled-back transaction
// ---------------------------------------------------------------------------
interface World {
  tx: Executor;
  whA: string;
  whB: string;
  adminId: string;
  cropId: string;
  svc: ReturnType<typeof createCustomersService>;
  subA: (permission?: string) => ResolvedScope;
  all: (permission?: string) => ResolvedScope;
  /** Four customers (D8): order at A; top-up at A (order at B); prefers A; order at B only. */
  cOrder: CustomerFx;
  cTopup: CustomerFx;
  cPref: CustomerFx;
  cNone: CustomerFx;
  orderA: string;
  orderTopupB: string;
  orderNoneB: string;
}

async function inRolledBackTx(fn: (w: World) => Promise<void>): Promise<void> {
  const { withTransaction } = await import('../../db/pool.js');
  await withTransaction(async (tx) => {
    const adminId = await insertUser(tx, 'ADMIN', 'M7 admin');
    const [whA, whB] = [await addWarehouse(tx), await addWarehouse(tx)];
    const cropId = await insertCrop(tx);
    // Letters only, starting with a non-hex letter: a `q` built from it can never hit the mobile
    // search (needs 3+ digits) or a hex customer code, so BR-91b's exact list cannot pick up an
    // unrelated committed customer whose mobile happened to contain the tag's digits (seen flaky).
    const tag = `q${newId().slice(0, 5).replace(/[0-9]/g, (d) => 'ghijklmnop'[Number(d)]!)}`;
    const cOrder = await addCustomer(tx, `M7 ${tag} Anitha Order`);
    const cTopup = await addCustomer(tx, `M7 ${tag} Bala Topup`);
    const cPref = await addCustomer(tx, `M7 ${tag} Chitra Preferred`, { preferred: whA });
    const cNone = await addCustomer(tx, `M7 ${tag} Devi Elsewhere`);
    const orderA = await addOrder(tx, cOrder.id, whA);
    const orderTopupB = await addOrder(tx, cTopup.id, whB);
    const orderNoneB = await addOrder(tx, cNone.id, whB);
    await addTopup(tx, cTopup.id, await addWallet(tx, cTopup.id), whA, adminId);

    let n = 0;
    const runTx = async <T>(work: (e: Executor) => Promise<T>): Promise<T> => {
      const sp = `m7_sp_${(n += 1)}`;
      await tx.query(`SAVEPOINT ${sp}`);
      try {
        const out = await work(tx);
        await tx.query(`RELEASE SAVEPOINT ${sp}`);
        return out;
      } catch (error) {
        await tx.query(`ROLLBACK TO SAVEPOINT ${sp}`);
        throw error;
      }
    };
    const svc = createCustomersService({ repo: customersRepo, db: tx, transaction: runTx });
    await fn({
      tx,
      whA,
      whB,
      adminId,
      cropId,
      svc,
      subA: (permission = 'customer.list.view') =>
        aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds: [whA], permission, userId: adminId }),
      all: (permission = 'customer.list.view') => aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.SUPER_ADMIN, permission, userId: adminId }),
      cOrder,
      cTopup,
      cPref,
      cNone,
      orderA,
      orderTopupB,
      orderNoneB,
    });
    throw new RollbackFixture();
  }).catch((error: unknown) => {
    if (!(error instanceof RollbackFixture)) throw error;
  });
}

const ids = (items: Array<{ id: string }>): string[] => items.map((i) => i.id).sort();

describeIfDatabase('Customers service and repo (PostgreSQL)', () => {
  dbIt('BR-91b: an own actor sees a customer with an order at its warehouse, one with only a top-up there, one who prefers it - and not one with none of these', async () => {
    await inRolledBackTx(async (w) => {
      const res = await w.svc.list(w.subA(), { limit: 100 });
      expect(adminCustomerListResponseSchema.parse(res)).toEqual(res);
      expect(ids(res.items)).toEqual([w.cOrder.id, w.cTopup.id, w.cPref.id].sort());
      const all = await w.svc.list(w.all(), { limit: 100, q: w.cNone.name.split(' ')[1]! });
      expect(ids(all.items)).toEqual([w.cOrder.id, w.cTopup.id, w.cPref.id, w.cNone.id].sort());
    });
  });

  dbIt('BR-91d: q and status cannot widen the scope - a q that matches only an out-of-scope customer is an empty page', async () => {
    await inRolledBackTx(async (w) => {
      expect((await w.svc.list(w.subA(), { limit: 100, q: w.cNone.name })).items).toEqual([]);
      expect((await w.svc.list(w.subA(), { limit: 100, q: w.cNone.name, status: 'ACTIVE' })).items).toEqual([]);
      expect(ids((await w.svc.list(w.subA(), { limit: 100, q: 'anitha' })).items)).toEqual([w.cOrder.id]);
      // `%` and `_` are literal, not wildcards.
      expect((await w.svc.list(w.subA(), { limit: 100, q: '%' })).items).toEqual([]);
    });
  });

  dbIt('BR-92: mobile digits match q only for an all-scope actor; an own actor cannot search by mobile', async () => {
    await inRolledBackTx(async (w) => {
      const digits = w.cOrder.mobile.slice(-7);
      expect(ids((await w.svc.list(w.all(), { limit: 100, q: digits })).items)).toEqual([w.cOrder.id]);
      expect((await w.svc.list(w.subA(), { limit: 100, q: digits })).items).toEqual([]);
    });
  });

  dbIt('BR-91e: summary total/active/new count only the visible set and equal the sum of the visible rows over all pages', async () => {
    await inRolledBackTx(async (w) => {
      const first = await w.svc.list(w.subA(), { limit: 1 });
      // cOrder (completed order at A) and cTopup (top-up at A) are active; cPref is not; all three are new.
      expect(first.summary).toEqual({ total: 3, active: 2, new: 3 });
      const seen: typeof first.items = [...first.items];
      let cursor = first.page.nextCursor;
      while (cursor !== null) {
        const next = await w.svc.list(w.subA(), { limit: 1, cursor });
        expect(next.summary).toEqual(first.summary);
        seen.push(...next.items);
        cursor = next.page.nextCursor;
      }
      expect(seen).toHaveLength(3);
      expect(new Set(seen.map((s) => s.id)).size).toBe(3);
      expect(seen.map((s) => s.name)).toEqual([...seen.map((s) => s.name)].sort());
      expect(seen.filter((s) => s.status === 'ACTIVE')).toHaveLength(2);
      expect(seen.filter((s) => s.isNew)).toHaveLength(3);
    });
  });

  dbIt('BR-91f: a customer who places an order at the warehouse becomes visible on the next request', async () => {
    await inRolledBackTx(async (w) => {
      await rejects(w.svc.get(w.subA('customer.detail.view'), w.cNone.id));
      await addOrder(w.tx, w.cNone.id, w.whA);
      expect((await w.svc.get(w.subA('customer.detail.view'), w.cNone.id)).id).toBe(w.cNone.id);
    });
  });

  dbIt('BR-91c: an out-of-scope customer is 404 on the profile and on every sub-resource, with the same detail as an unknown id', async () => {
    await inRolledBackTx(async (w) => {
      const ticket = await addTicket(w.tx, w.cNone.id, w.orderNoneB);
      const unknown = await rejects(w.svc.get(w.subA(), newId()));
      const page = { limit: 20 };
      const calls = [
        () => w.svc.get(w.subA(), w.cNone.id),
        () => w.svc.listPurchases(w.subA(), w.cNone.id, page),
        () => w.svc.listOrders(w.subA(), w.cNone.id, page),
        () => w.svc.getWallet(w.subA(), w.cNone.id),
        () => w.svc.listWalletTransactions(w.subA(), w.cNone.id, page),
        () => w.svc.getWalletTransaction(w.subA(), w.cNone.id, newId()),
        () => w.svc.listIssues(w.subA(), w.cNone.id, page),
        () => w.svc.listSupportTickets(w.subA(), w.cNone.id, page),
        () => w.svc.getSupportTicket(w.subA(), w.cNone.id, ticket),
        () => w.svc.reply(w.all('support.ticket.respond'), w.subA('customer.support_history.view'), w.cNone.id, ticket, { message: 'Hello' }),
      ];
      for (const call of calls) {
        const error = await rejects(call());
        expect(error.status).toBe(404);
        expect(error.detail).toBe(unknown.detail);
      }
    });
  });

  dbIt('BR-91g: purchases, orders and issues of an in-scope customer are confined to the own warehouse; scope all sees every warehouse', async () => {
    await inRolledBackTx(async (w) => {
      await addItem(w.tx, w.orderTopupB, w.cropId, null);
      await w.tx.query(`INSERT INTO return_requests (order_id, customer_id, reason) VALUES ($1, $2, 'Soft')`, [w.orderTopupB, w.cTopup.id]);
      const page = { limit: 20 };
      expect((await w.svc.listOrders(w.subA(), w.cTopup.id, page)).items).toEqual([]);
      expect((await w.svc.listPurchases(w.subA(), w.cTopup.id, page)).items).toEqual([]);
      expect((await w.svc.listIssues(w.subA(), w.cTopup.id, page)).items).toEqual([]);
      const orders = await w.svc.listOrders(w.all(), w.cTopup.id, page);
      expect(orders.items.map((o) => o.id)).toEqual([w.orderTopupB]);
      expect(orders.items[0]).toMatchObject({ channel: 'DIRECT', status: 'PICKED_UP', paymentStatus: 'PAID', paymentMethod: 'CASH', totalAmount: '100.00', itemCount: 1, warehouseId: w.whB });
      const purchases = await w.svc.listPurchases(w.all(), w.cTopup.id, page);
      expect(purchases.items[0]).toMatchObject({ orderId: w.orderTopupB, grade: 'GRADE_1', qtyKg: '2.500', unitPrice: '40.00', lineTotal: '100.00' });
      const issues = await w.svc.listIssues(w.all(), w.cTopup.id, page);
      expect(issues.items[0]).toMatchObject({ kind: 'RETURN', status: 'PENDING', orderId: w.orderTopupB, reason: 'Soft', resolvedAt: null });
      expect(issues.items[0]).not.toHaveProperty('refundAmount');
    });
  });

  dbIt('BR-92a/BR-92c: own-scope list and detail carry no full mobile, e-mail or address; scope all gets them', async () => {
    await inRolledBackTx(async (w) => {
      await w.tx.query(`INSERT INTO customer_addresses (customer_id, line1, city, pincode, is_default) VALUES ($1, '7 Lake Road', 'Ooty', '643001', true)`, [w.cOrder.id]);
      const list = await w.svc.list(w.subA(), { limit: 100 });
      const detail = await w.svc.get(w.subA('customer.detail.view'), w.cOrder.id);
      expect(adminCustomerDetailSchema.parse(detail)).toEqual(detail);
      for (const res of [list, detail]) {
        expect(leaksMobile(res, w.cOrder.mobile)).toBe(false);
        expect(JSON.stringify(res)).not.toMatch(/@example\.com|Lake Road/);
      }
      expect(detail.mobileMasked).toBe(`${'*'.repeat(w.cOrder.mobile.length - 4)}${w.cOrder.mobile.slice(-4)}`);
      const full = await w.svc.get(w.all('customer.detail.view'), w.cOrder.id);
      expect(full).toMatchObject({ mobile: w.cOrder.mobile, piiMasked: false });
      expect(full.addresses?.[0]).toMatchObject({ line1: '7 Lake Road', city: 'Ooty', pincode: '643001', isDefault: true });
      expect(full).toMatchObject({ totalOrders: 1, lifetimeValue: '100.00', walletBalance: '0.00' });
    });
  });

  dbIt('BR-93e: the wallet summary balance equals the sum of the ledger in exact paise and equals the trigger-maintained cache', async () => {
    await inRolledBackTx(async (w) => {
      const wallet = await addWallet(w.tx, w.cOrder.id);
      await addTxn(w.tx, wallet, 'CREDIT', '500.00');
      await addTxn(w.tx, wallet, 'CREDIT', '0.10');
      await addTxn(w.tx, wallet, 'CREDIT', '0.20');
      await addTxn(w.tx, wallet, 'DEBIT', '100.30');
      const summary = await w.svc.getWallet(w.subA('customer.wallet.view'), w.cOrder.id);
      expect(adminCustomerWalletSummarySchema.parse(summary)).toEqual(summary);
      expect(summary).toMatchObject({ walletId: wallet, balance: '400.00', currency: 'INR', transactionCount: 4 });
      const cache = await w.tx.query<{ balance: string }>(`SELECT balance::text FROM wallets WHERE id = $1`, [wallet]);
      expect(cache.rows[0]!.balance).toBe('400.00');
    });
  });

  dbIt('BR-129a: totalCredited sums every CREDIT row and totalUsed only ORDER_DEBIT and SUBSCRIPTION_DEBIT rows, in exact paise', async () => {
    await inRolledBackTx(async (w) => {
      const wallet = await addWallet(w.tx, w.cOrder.id);
      const rows: Array<['CREDIT' | 'DEBIT', string, string]> = [
        ['CREDIT', 'TOPUP_DIGITAL', '500.00'],
        ['CREDIT', 'TOPUP_CASH', '0.10'],
        ['CREDIT', 'TOPUP_DIGITAL', '0.20'],
        ['CREDIT', 'ORDER_REFUND', '10.00'],
        ['CREDIT', 'ADJUSTMENT', '1.00'],
        ['DEBIT', 'ORDER_DEBIT', '100.30'],
        ['DEBIT', 'SUBSCRIPTION_DEBIT', '5.00'],
        ['DEBIT', 'ADJUSTMENT', '2.00'],
      ];
      for (const [direction, type, amount] of rows) {
        const id = newId();
        await w.tx.query(
          `INSERT INTO wallet_transactions (id, wallet_id, idempotency_key, direction, type, amount, balance_after)
           VALUES ($1, $2, $3, $4, $5, $6, 0)`,
          [id, wallet, `br129-${id}`, direction, type, amount],
        );
      }
      const summary = await w.svc.getWallet(w.subA('customer.wallet.view'), w.cOrder.id);
      expect(adminCustomerWalletSummarySchema.parse(summary)).toEqual(summary);
      // 500.00 + 0.10 + 0.20 + 10.00 + 1.00: a float sum would not land on .30 exactly.
      expect(summary.totalCredited).toBe('511.30');
      // ORDER_DEBIT + SUBSCRIPTION_DEBIT; the ADJUSTMENT debit is not usage.
      expect(summary.totalUsed).toBe('105.30');
      expect(summary.balance).toBe('404.00');
      expect(typeof summary.totalCredited).toBe('string');
      expect(typeof summary.totalUsed).toBe('string');
    });
  });

  dbIt('BR-129b: a wallet with no ledger rows reports 0.00 for both totals; an out-of-scope customer is still 404 and nothing is summed for it', async () => {
    await inRolledBackTx(async (w) => {
      await addWallet(w.tx, w.cOrder.id);
      const empty = await w.svc.getWallet(w.subA('customer.wallet.view'), w.cOrder.id);
      expect(empty).toMatchObject({ balance: '0.00', totalCredited: '0.00', totalUsed: '0.00', transactionCount: 0 });
      const other = await addWallet(w.tx, w.cNone.id);
      const id = newId();
      await w.tx.query(
        `INSERT INTO wallet_transactions (id, wallet_id, idempotency_key, direction, type, amount, balance_after)
         VALUES ($1, $2, $3, 'CREDIT', 'TOPUP_DIGITAL', 75.00, 0)`,
        [id, other, `br129-${id}`],
      );
      await expect(w.svc.getWallet(w.subA('customer.wallet.view'), w.cNone.id)).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
    });
  });

  dbIt('BR-93: wallet transactions page by (created_at, id) DESC with no row skipped or repeated, including ties on created_at', async () => {
    await inRolledBackTx(async (w) => {
      const wallet = await addWallet(w.tx, w.cOrder.id);
      const stamps = ['2026-01-01T10:00:00Z', '2026-01-02T10:00:00Z', '2026-01-02T10:00:00Z', '2026-01-03T10:00:00Z', '2026-01-04T10:00:00Z'];
      for (const at of stamps) await addTxn(w.tx, wallet, 'CREDIT', '10.00', at);
      const expected = (
        await w.tx.query<{ id: string }>(`SELECT id FROM wallet_transactions WHERE wallet_id = $1 ORDER BY created_at DESC, id DESC`, [wallet])
      ).rows.map((r) => r.id);
      const seen: string[] = [];
      let cursor: string | undefined;
      do {
        const page = await w.svc.listWalletTransactions(w.subA('customer.wallet.view'), w.cOrder.id, { limit: 2, ...(cursor === undefined ? {} : { cursor }) });
        page.items.forEach((t) => expect(walletTransactionSchema.parse(t)).toEqual(t));
        seen.push(...page.items.map((t) => t.id));
        cursor = page.page.nextCursor ?? undefined;
        if (cursor !== undefined) expect(decodeTimeKey(cursor).ts).toMatch(/\.\d{6}Z$/);
      } while (cursor !== undefined);
      expect(seen).toEqual(expected);
    });
  });

  dbIt("BR-93d: a transaction id from another customer's wallet is 404; the customer's own is returned", async () => {
    await inRolledBackTx(async (w) => {
      const mine = await addTxn(w.tx, await addWallet(w.tx, w.cOrder.id), 'CREDIT', '5.00');
      const theirs = (await w.tx.query<{ id: string }>(`SELECT id FROM wallets WHERE customer_id = $1`, [w.cTopup.id])).rows[0]!.id;
      const other = await addTxn(w.tx, theirs, 'CREDIT', '7.00');
      expect((await rejects(w.svc.getWalletTransaction(w.subA(), w.cOrder.id, other))).status).toBe(404);
      expect(await w.svc.getWalletTransaction(w.subA(), w.cOrder.id, mine)).toMatchObject({ id: mine, amount: '5.00', txnType: 'TOPUP_DIGITAL' });
    });
  });

  dbIt('BR-129c: the admin wallet list and detail and the own-ledger repo read carry status COMPLETED on every real ledger row, credit and debit', async () => {
    await inRolledBackTx(async (w) => {
      const wallet = await addWallet(w.tx, w.cOrder.id);
      const credit = await addTxn(w.tx, wallet, 'CREDIT', '20.00');
      const debit = await addTxn(w.tx, wallet, 'DEBIT', '5.00');

      const page = await w.svc.listWalletTransactions(w.subA('customer.wallet.view'), w.cOrder.id, { limit: 10 });
      expect(page.items.map((t) => t.id).sort()).toEqual([credit, debit].sort());
      for (const t of page.items) {
        expect(t.status).toBe('COMPLETED');
        expect(walletTransactionSchema.parse(t)).toEqual(t);
      }
      for (const id of [credit, debit]) {
        expect((await w.svc.getWalletTransaction(w.subA('customer.wallet.view'), w.cOrder.id, id)).status).toBe('COMPLETED');
      }

      // GET /wallets/me/transactions reads through this repo function and the same serializer.
      const own = await walletRepo.listTransactions(w.tx, wallet, { limit: 10, tab: 'all' });
      expect(own.items.map((t) => t.status)).toEqual(['COMPLETED', 'COMPLETED']);
    });
  });

  describe('support tickets (BR-97)', () => {
    async function threadWorld(w: World) {
      const farmer = await insertFarmerWithPlot(w.tx);
      await w.tx.query(`UPDATE users SET full_name = 'Muthu Selvaraj' WHERE id = (SELECT user_id FROM farmers WHERE id = $1)`, [farmer.farmerId]);
      await w.tx.query(`UPDATE farms SET name = 'Kurinji Hill Estate' WHERE id = $1`, [farmer.farmId]);
      const batch = await addBatch(w.tx, w.whA, w.cropId, farmer.farmerId);
      await addItem(w.tx, w.orderA, w.cropId, batch);
      const ticket = await addTicket(w.tx, w.cOrder.id, w.orderA);
      const customerMsg = await addMessage(w.tx, ticket, w.cOrder.userId, 'Were these from Kurinji Hill Estate?', false, 30);
      const internalFarmer = await addMessage(w.tx, ticket, w.adminId, 'Batch came from Muthu Selvaraj.', true, 20);
      const internalPlain = await addMessage(w.tx, ticket, w.adminId, 'Offer a replacement.', true, 10);
      return { farmer, ticket, customerMsg, internalFarmer, internalPlain };
    }

    dbIt('BR-97a/BR-97e: for an own actor the internal note naming the farmer is removed and the farm name redacted; scope all sees the stored thread', async () => {
      await inRolledBackTx(async (w) => {
        const t = await threadWorld(w);
        const own = await w.svc.getSupportTicket(w.subA('customer.support_history.view'), w.cOrder.id, t.ticket);
        expect(adminCustomerSupportTicketDetailSchema.parse(own)).toEqual(own);
        expect(own.messages.map((m) => m.id)).toEqual([t.customerMsg, t.internalPlain]);
        expect(own.messages[0]).toMatchObject({ redacted: true, senderRole: 'CUSTOMER' });
        expect(JSON.stringify(own)).not.toMatch(/Muthu|Selvaraj|Kurinji|Fixture Farm|TOHFA-FX|Fixture Farmer/);
        const list = await w.svc.listSupportTickets(w.subA('customer.support_history.view'), w.cOrder.id, { limit: 20 });
        expect(list.items[0]).toMatchObject({ id: t.ticket, messageCount: 2, status: 'OPEN' });
        const all = await w.svc.getSupportTicket(w.all('customer.support_history.view'), w.cOrder.id, t.ticket);
        expect(all.messages.map((m) => m.id)).toEqual([t.customerMsg, t.internalFarmer, t.internalPlain]);
        expect(all.messages[1]!.message).toBe('Batch came from Muthu Selvaraj.');
      });
    });

    dbIt('BR-97b/BR-97f: a reply is stored as a new message (201 shape with ticket and author id) and writes exactly one ids-only audit row in the same transaction', async () => {
      await inRolledBackTx(async (w) => {
        const t = await threadWorld(w);
        const respond = aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds: [w.whA], permission: 'support.ticket.respond', userId: w.adminId });
        const reply = await w.svc.reply(respond, w.subA('customer.support_history.view'), w.cOrder.id, t.ticket, { message: 'We will replace them tomorrow.' });
        expect(reply).toMatchObject({ ticketId: t.ticket, senderUserId: w.adminId, senderRole: 'SUB_WH_ADMIN', isInternal: false, redacted: false });
        const stored = await w.tx.query(`SELECT body, is_internal FROM support_messages WHERE id = $1`, [reply.id]);
        expect(stored.rows[0]).toEqual({ body: 'We will replace them tomorrow.', is_internal: false });
        const audit = await w.tx.query<{ action_code: string; actor_id: string; actor_role: string; warehouse_id: string; after: Record<string, unknown>; before: unknown }>(
          `SELECT action_code, actor_id, actor_role, warehouse_id, after, before FROM audit_log WHERE entity_id = $1`,
          [reply.id],
        );
        expect(audit.rows).toHaveLength(1);
        expect(audit.rows[0]).toMatchObject({ action_code: 'support.ticket.respond', actor_id: w.adminId, actor_role: 'SUB_WH_ADMIN', warehouse_id: w.whA, before: null });
        expect(audit.rows[0]!.after).toEqual({ messageId: reply.id, ticketId: t.ticket, customerId: w.cOrder.id });
        const thread = await w.svc.getSupportTicket(w.subA('customer.support_history.view'), w.cOrder.id, t.ticket);
        expect(thread.messages.at(-1)!.id).toBe(reply.id);
      });
    });

    dbIt('BR-97c: a reply naming the farmer, the farm or the TOHFA farmer code for this customer is refused 422 and stores nothing', async () => {
      await inRolledBackTx(async (w) => {
        const t = await threadWorld(w);
        const code = (await w.tx.query<{ c: string }>(`SELECT tohfa_farmer_id AS c FROM farmers WHERE id = $1`, [t.farmer.farmerId])).rows[0]!.c;
        const before = (await w.tx.query(`SELECT 1 FROM support_messages WHERE ticket_id = $1`, [t.ticket])).rowCount;
        for (const message of ['Muthu will call you', 'From Kurinji Hill Estate', `Farmer ${code}`]) {
          const error = await rejects(w.svc.reply(w.all('support.ticket.respond'), w.all('customer.support_history.view'), w.cOrder.id, t.ticket, { message }));
          expect(error.status).toBe(422);
        }
        expect((await w.tx.query(`SELECT 1 FROM support_messages WHERE ticket_id = $1`, [t.ticket])).rowCount).toBe(before);
      });
    });

    dbIt("BR-16: the farm's survey number (FMB) and the farmer's mobile are redacted for an own actor and refused in a reply", async () => {
      await inRolledBackTx(async (w) => {
        const t = await threadWorld(w);
        await w.tx.query(`UPDATE farms SET survey_number = 'SY-417/2B' WHERE id = $1`, [t.farmer.farmId]);
        const farmerMobile = (await w.tx.query<{ m: string }>(`SELECT mobile AS m FROM users WHERE id = $1`, [t.farmer.userId])).rows[0]!.m;
        const national = farmerMobile.replace(/\D/g, '').slice(-10);
        const spaced = `${national.slice(0, 5)} ${national.slice(5)}`;
        const msg = await addMessage(w.tx, t.ticket, w.cOrder.userId, `FMB SY-417/2B. The farmer gave me ${spaced}`, false, 5);
        const own = await w.svc.getSupportTicket(w.subA('customer.support_history.view'), w.cOrder.id, t.ticket);
        const shown = own.messages.find((m) => m.id === msg)!;
        expect(shown.redacted).toBe(true);
        expect(JSON.stringify(own)).not.toContain('SY-417/2B');
        expect(leaksMobile(own, farmerMobile)).toBe(false);
        for (const message of ['Survey no. SY-417/2B', `Call the farmer on ${national}`]) {
          const error = await rejects(w.svc.reply(w.all('support.ticket.respond'), w.all('customer.support_history.view'), w.cOrder.id, t.ticket, { message }));
          expect(error.status, message).toBe(422);
        }
      });
    });

    dbIt("BR-97g: the customer's own stored mobile and e-mail typed into a ticket are masked for an own actor (BR-92a); scope all sees them", async () => {
      await inRolledBackTx(async (w) => {
        const ticket = await addTicket(w.tx, w.cOrder.id, null);
        const email = (await w.tx.query<{ e: string }>(`SELECT email AS e FROM users WHERE id = $1`, [w.cOrder.userId])).rows[0]!.e;
        const national = w.cOrder.mobile.replace(/\D/g, '').slice(-10);
        const body = `Please call ${national} or write to ${email}`;
        await addMessage(w.tx, ticket, w.cOrder.userId, body, false, 5);
        const own = await w.svc.getSupportTicket(w.subA('customer.support_history.view'), w.cOrder.id, ticket);
        expect(leaksMobile(own, w.cOrder.mobile)).toBe(false);
        expect(JSON.stringify(own)).not.toContain(email);
        expect(own.messages[0]!.redacted).toBe(true);
        const all = await w.svc.getSupportTicket(w.all('customer.support_history.view'), w.cOrder.id, ticket);
        expect(all.messages[0]!.message).toBe(body);
      });
    });

    dbIt('BR-97i: replying to a CLOSED ticket is 409 CONFLICT; a ticket of another customer is 404', async () => {
      await inRolledBackTx(async (w) => {
        const closed = await addTicket(w.tx, w.cOrder.id, null, 'CLOSED');
        expect((await rejects(w.svc.reply(w.all('support.ticket.respond'), w.all(), w.cOrder.id, closed, { message: 'hi' }))).status).toBe(409);
        const others = await addTicket(w.tx, w.cTopup.id, null);
        expect((await rejects(w.svc.getSupportTicket(w.all(), w.cOrder.id, others))).status).toBe(404);
      });
    });

    dbIt('BR-97h: (DB level) support_messages is append-only - UPDATE, DELETE and TRUNCATE are refused (migration 0066)', async () => {
      await inRolledBackTx(async (w) => {
        const t = await threadWorld(w);
        for (const sql of [
          `UPDATE support_messages SET body = 'rewritten' WHERE id = '${t.customerMsg}'`,
          `DELETE FROM support_messages WHERE id = '${t.internalFarmer}'`,
          `TRUNCATE support_messages`,
        ]) {
          await w.tx.query('SAVEPOINT br97h');
          let refused = false;
          try {
            await w.tx.query(sql);
          } catch {
            refused = true;
          }
          await w.tx.query('ROLLBACK TO SAVEPOINT br97h');
          expect(refused, sql).toBe(true);
        }
        const kept = await w.tx.query<{ body: string }>(`SELECT body FROM support_messages WHERE id = $1`, [t.customerMsg]);
        expect(kept.rows[0]!.body).toBe('Were these from Kurinji Hill Estate?');
      });
    });
  });

  dbIt('BR-98f: the active window is read from system_config - activity 89 days ago is ACTIVE at 90 and INACTIVE at 60; "new" uses the same window on created_at', async () => {
    await inRolledBackTx(async (w) => {
      const old = await addCustomer(w.tx, `M7 Elango Old ${newId().slice(0, 4)}`, { createdDaysAgo: 100, preferred: w.whA });
      await addOrder(w.tx, old.id, w.whA, { completedDaysAgo: 89 });
      await w.tx.query(`UPDATE system_config SET value = '90'::jsonb WHERE key = 'active_customer_window_days'`);
      expect(await w.svc.get(w.subA('customer.detail.view'), old.id)).toMatchObject({ status: 'ACTIVE', isNew: false });
      expect(ids((await w.svc.list(w.subA(), { limit: 100, status: 'NEW' })).items)).not.toContain(old.id);
      await w.tx.query(`UPDATE system_config SET value = '60'::jsonb WHERE key = 'active_customer_window_days'`);
      expect(await w.svc.get(w.subA('customer.detail.view'), old.id)).toMatchObject({ status: 'INACTIVE' });
      expect(ids((await w.svc.list(w.subA(), { limit: 100, status: 'INACTIVE' })).items)).toContain(old.id);
      await w.tx.query(`DELETE FROM system_config WHERE key = 'active_customer_window_days'`);
      expect(await w.svc.get(w.subA('customer.detail.view'), old.id)).toMatchObject({ status: 'ACTIVE' });
    });
  });
});

// ---------------------------------------------------------------------------
// 2. Real HTTP through the customers router (committed fixtures, removed afterwards)
// ---------------------------------------------------------------------------
describeIfDatabase('Customers routes (local Express app, PostgreSQL)', () => {
  let ready = false;
  const httpIt = (name: string, fn: () => Promise<void>): void => {
    it(name, async (ctx) => {
      if (!ready) return ctx.skip();
      await fn();
    });
  };
  let app: Express;
  const tokens: Record<string, string> = {};
  const created = { customers: [] as string[], users: [] as string[] };
  let inScope: CustomerFx;
  let outScope: CustomerFx;
  let outTicket = '';
  let outTxn = '';
  let inWallet = '';

  beforeAll(async () => {
    ready = await dbReady();
    if (!ready) return;
    const [{ createCustomersRouter }, { signAccessToken }, { pool }, { errorHandler, notFoundHandler }] = await Promise.all([
      import('./customers.routes.js'),
      import('../../auth/jwt.js'),
      import('../../db/pool.js'),
      import('../../http/errorHandler.js'),
    ]);
    await ensureStandardUsers(pool, 'userSuperAdmin', 'userSubWhAdmin');
    const wh = await pool.query<{ id: string; code: string }>(`SELECT id, code FROM warehouses WHERE code IN ('WH-OOTY', 'WH-COON')`);
    const ooty = wh.rows.find((r) => r.code === 'WH-OOTY')!.id;
    const coon = wh.rows.find((r) => r.code === 'WH-COON')!.id;

    inScope = await addCustomer(pool, `M7 HTTP Inscope ${newId().slice(0, 6)}`);
    outScope = await addCustomer(pool, `M7 HTTP Outscope ${newId().slice(0, 6)}`);
    created.customers.push(inScope.id, outScope.id);
    created.users.push(inScope.userId, outScope.userId);
    await addOrder(pool, inScope.id, ooty);
    const outOrder = await addOrder(pool, outScope.id, coon);
    inWallet = await addWallet(pool, inScope.id);
    await addTxn(pool, inWallet, 'CREDIT', '250.00');
    outTxn = await addTxn(pool, await addWallet(pool, outScope.id), 'CREDIT', '75.00');
    outTicket = await addTicket(pool, outScope.id, outOrder);

    app = express();
    app.use(express.json());
    app.use('/v1/admin/customers', createCustomersRouter());
    app.use(notFoundHandler);
    app.use(errorHandler);
    const base = { farmerId: null, customerId: null };
    tokens['subOoty'] = signAccessToken({ sub: IDS.userSubWhAdmin, roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: ooty }], ...base });
    tokens['superAdmin'] = signAccessToken({ sub: IDS.userSuperAdmin, roles: [{ code: RoleCode.SUPER_ADMIN }], ...base });
  });

  afterAll(async () => {
    if (!ready) return;
    const [{ withTransaction, closePool }, { closeRedis }] = await Promise.all([import('../../db/pool.js'), import('../../redis.js')]);
    // Ledgers are append-only for the app role; replica mode lets this test-only cleanup remove
    // exactly this run's rows from the scratch test database.
    await withTransaction(async (tx) => {
      await tx.query(`SET LOCAL session_replication_role = replica`);
      const c = created.customers;
      await tx.query(`DELETE FROM support_messages WHERE ticket_id IN (SELECT id FROM support_tickets WHERE customer_id = ANY($1::uuid[]))`, [c]);
      await tx.query(`DELETE FROM support_tickets WHERE customer_id = ANY($1::uuid[])`, [c]);
      await tx.query(`DELETE FROM wallet_transactions WHERE wallet_id IN (SELECT id FROM wallets WHERE customer_id = ANY($1::uuid[]))`, [c]);
      await tx.query(`DELETE FROM wallets WHERE customer_id = ANY($1::uuid[])`, [c]);
      await tx.query(`DELETE FROM order_status_history WHERE order_id IN (SELECT id FROM orders WHERE customer_id = ANY($1::uuid[]))`, [c]);
      await tx.query(`DELETE FROM orders WHERE customer_id = ANY($1::uuid[])`, [c]);
      await tx.query(`DELETE FROM customers WHERE id = ANY($1::uuid[])`, [c]);
      await tx.query(`DELETE FROM users WHERE id = ANY($1::uuid[])`, [created.users]);
    });
    await Promise.allSettled([closePool(), closeRedis()]);
  });

  const auth = (name: string): string => `Bearer ${tokens[name]!}`;
  const comparable = (body: Record<string, unknown>) => ({ type: body['type'], title: body['title'], status: body['status'], code: body['code'], detail: body['detail'] });

  httpIt('BR-91c: for an out-of-scope customer the profile and all nine sub-routes are 404 problem+json, never 403, with the same body as a nonexistent id', async () => {
    const unknown = await request(app).get(`/v1/admin/customers/${newId()}`).set('Authorization', auth('subOoty'));
    expect(unknown.status).toBe(404);
    const c = outScope.id;
    const reads = ['', '/purchases', '/orders', '/wallet', '/wallet/transactions', `/wallet/transactions/${outTxn}`, '/issues', '/support-tickets', `/support-tickets/${outTicket}`];
    for (const suffix of reads) {
      const res = await request(app).get(`/v1/admin/customers/${c}${suffix}`).set('Authorization', auth('subOoty'));
      expect(res.status, suffix).toBe(404);
      expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
      expect(comparable(res.body)).toEqual(comparable(unknown.body));
    }
    const reply = await request(app).post(`/v1/admin/customers/${c}/support-tickets/${outTicket}/replies`).set('Authorization', auth('subOoty')).send({ message: 'Hello' });
    expect(reply.status).toBe(404);
    expect(comparable(reply.body)).toEqual(comparable(unknown.body));
    // Scope all reaches the same customer.
    expect((await request(app).get(`/v1/admin/customers/${c}`).set('Authorization', auth('superAdmin'))).status).toBe(200);
  });

  httpIt('BR-92a/BR-92c: over HTTP the own-scope profile carries the masked mobile and no full mobile, e-mail or address key; scope all gets the full mobile', async () => {
    const own = await request(app).get(`/v1/admin/customers/${inScope.id}`).set('Authorization', auth('subOoty'));
    expect(own.status).toBe(200);
    expect(own.body).toMatchObject({ piiMasked: true, name: inScope.name });
    expect(Object.keys(own.body)).not.toEqual(expect.arrayContaining(['mobile']));
    for (const key of ['mobile', 'email', 'addresses']) expect(own.body).not.toHaveProperty(key);
    expect(leaksMobile(own.body, inScope.mobile)).toBe(false);
    const full = await request(app).get(`/v1/admin/customers/${inScope.id}`).set('Authorization', auth('superAdmin'));
    expect(full.body).toMatchObject({ piiMasked: false, mobile: inScope.mobile });
    const wallet = await request(app).get(`/v1/admin/customers/${inScope.id}/wallet`).set('Authorization', auth('subOoty'));
    expect(wallet.status).toBe(200);
    expect(wallet.body).toMatchObject({ balance: '250.00', walletId: inWallet });
  });

  httpIt('BR-93a: POST, PUT, PATCH and DELETE on the wallet paths are 404 for SUB_WH_ADMIN and the ledger is unchanged', async () => {
    const { pool } = await import('../../db/pool.js');
    const count = async () => Number((await pool.query<{ n: string }>(`SELECT count(*)::text AS n FROM wallet_transactions WHERE wallet_id = $1`, [inWallet])).rows[0]!.n);
    const before = await count();
    const c = inScope.id;
    for (const path of [`/v1/admin/customers/${c}/wallet`, `/v1/admin/customers/${c}/wallet/transactions`, `/v1/admin/customers/${c}/wallet/transactions/${newId()}`]) {
      for (const verb of ['post', 'put', 'patch', 'delete'] as const) {
        const res = await request(app)[verb](path).set('Authorization', auth('subOoty')).send({ amount: '100.00', direction: 'CREDIT' });
        expect([404, 405], `${verb} ${path}`).toContain(res.status);
      }
    }
    expect(await count()).toBe(before);
  });
});
