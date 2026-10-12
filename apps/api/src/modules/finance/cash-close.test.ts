/**
 * Module 11 (Warehouse Finance): the daily cash summary and close (BR-74).
 *
 * BR-74 = for one warehouse and one Asia/Kolkata day the system computes cash sales, cash top-ups and
 * cash expenses from existing data, the opening cash is the counted cash of the latest earlier close,
 * and a close records the counted cash, the expected cash, the difference and who closed it. One close
 * per warehouse and day, append-only, idempotent, audited, warehouse-scoped.
 *
 * Every repo query is run against a migrated Postgres: schema tests (no I/O), service tests inside a
 * transaction that is rolled back, and real-HTTP tests through the real app router.
 */
import { randomInt } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import type { Server } from 'node:http';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { aScope, databaseReady, describeIfDatabase, newId } from '../../test/factories.js';
import {
  cashCloseResponse,
  createCashCloseBody,
  dailySummaryQuery,
  dailySummaryResponse,
  listCashClosesQuery,
} from './cash-close.schema.js';
import { createCashCloseService } from './cash-close.service.js';
import { cashCloseRepo } from './cash-close.repo.js';

class RollbackFixture extends Error {}

async function failure(promise: Promise<unknown>): Promise<AppError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof AppError) return error;
    throw error;
  }
  throw new Error('expected the call to fail with an AppError, but it succeeded');
}

const WH = '10000000-0000-4000-8000-0000000000a1';
const DAY = '1950-03-10';
const validBody = { date: DAY, countedCash: '100.00' };

// ===========================================================================
// 1. Schemas (no I/O)
// ===========================================================================
describe('cash close schemas', () => {
  it('BR-74a: the counted cash is a Money string with at most 2 decimals; zero is valid, negatives, floats and JSON numbers are not', () => {
    for (const countedCash of ['0', '0.00', '1', '1234.5', '9999999999.99']) {
      expect(createCashCloseBody.safeParse({ ...validBody, countedCash }).success, countedCash).toBe(true);
    }
    for (const countedCash of ['-1', '-0.01', '1.234', '10000000000.00', '1e3', ' 5', '', 'abc']) {
      expect(createCashCloseBody.safeParse({ ...validBody, countedCash }).success, countedCash).toBe(false);
    }
    expect(createCashCloseBody.safeParse({ ...validBody, countedCash: 12.5 }).success).toBe(false);
  });

  it('BR-74a: the date must be a real calendar date, the note is trimmed and bounded, and the body is strict', () => {
    expect(createCashCloseBody.safeParse({ ...validBody, date: '2026-02-30' }).success).toBe(false);
    expect(createCashCloseBody.safeParse({ ...validBody, date: '2026-2-3' }).success).toBe(false);
    expect(createCashCloseBody.safeParse({ countedCash: '1.00' }).success).toBe(false);
    expect(createCashCloseBody.safeParse({ ...validBody, note: '   ' }).success).toBe(false);
    expect(createCashCloseBody.safeParse({ ...validBody, note: 'n'.repeat(501) }).success).toBe(false);
    expect(createCashCloseBody.parse({ ...validBody, note: '  short by 10 ' }).note).toBe('short by 10');
    expect(createCashCloseBody.safeParse({ ...validBody, expectedClosing: '5.00' }).success).toBe(false);
    expect(createCashCloseBody.safeParse({ ...validBody, difference: '5.00' }).success).toBe(false);
    expect(createCashCloseBody.safeParse({ ...validBody, warehouseId: 'nope' }).success).toBe(false);
  });

  it('BR-74a: the summary needs a real date; the list is strict, bounded and needs from <= to', () => {
    expect(dailySummaryQuery.safeParse({ date: DAY }).success).toBe(true);
    expect(dailySummaryQuery.safeParse({}).success).toBe(false);
    expect(dailySummaryQuery.safeParse({ date: '1950-13-01' }).success).toBe(false);
    expect(dailySummaryQuery.safeParse({ date: DAY, extra: 1 }).success).toBe(false);
    expect(listCashClosesQuery.parse({}).limit).toBe(20);
    expect(listCashClosesQuery.safeParse({ limit: '101' }).success).toBe(false);
    expect(listCashClosesQuery.safeParse({ from: '1950-03-02', to: '1950-03-01' }).success).toBe(false);
    expect(listCashClosesQuery.safeParse({ from: '1950-03-01', to: '1950-03-01' }).success).toBe(true);
    expect(listCashClosesQuery.safeParse({ bogus: 'x' }).success).toBe(false);
  });

  it('BR-74a: the response schemas allow a negative difference and a null opening date', () => {
    const close = {
      id: newId(), warehouseId: WH, date: DAY, openingCash: '0.00', openingFrom: null, cashSales: '1.00', cashTopUps: '0.00',
      cashExpenses: '0.00', expectedClosing: '1.00', countedCash: '0.00', difference: '-1.00', note: null, closedBy: newId(),
      createdAt: '1950-03-10T10:00:00.000Z',
    };
    expect(cashCloseResponse.safeParse(close).success).toBe(true);
    expect(dailySummaryResponse.safeParse({ warehouseId: WH, date: DAY, system: { openingCash: '0.00', openingFrom: null, cashSales: '1.00', cashTopUps: '0.00', cashExpenses: '0.00', expectedClosing: '1.00' }, closed: null }).success).toBe(true);
  });
});

// ===========================================================================
// 2. Service + SQL against PostgreSQL (rolled-back transactions)
// ===========================================================================
describeIfDatabase('Cash close (PostgreSQL)', () => {
  let ready = false;

  beforeAll(async () => {
    ready = await databaseReady('cash_closes');
    if (!ready) throw new Error('the database is configured but cash_closes is missing: run the migrations');
  });

  async function inRolledBackTx(fn: (tx: Executor) => Promise<void>): Promise<void> {
    const { withTransaction } = await import('../../db/pool.js');
    await withTransaction(async (tx) => {
      await fn(tx);
      throw new RollbackFixture();
    }).catch((error: unknown) => {
      if (!(error instanceof RollbackFixture)) throw error;
    });
  }

  const cash = (tx: Executor) =>
    createCashCloseService({ repo: cashCloseRepo, db: tx, runTx: async (fn) => fn(tx) });

  interface Fixture {
    closer: string;
    otherUser: string;
    customerId: string;
    walletId: string;
    ooty: string;
    coonoor: string;
    kotagiri: string;
    gudalur: string;
    transport: string;
  }

  let seq = 0;
  async function newUser(tx: Executor, type: 'ADMIN' | 'CUSTOMER', name: string): Promise<string> {
    seq += 1;
    const stamp = `${Date.now()}${seq}${Math.floor(Math.random() * 1000)}`;
    const result = await tx.query<{ id: string }>(
      `INSERT INTO users (mobile, full_name, user_type, status) VALUES ($1, $2, $3, 'ACTIVE') RETURNING id`,
      [`+9195${stamp.slice(-8)}`, name, type],
    );
    return result.rows[0]!.id;
  }

  async function seed(tx: Executor): Promise<Fixture> {
    const warehouses = await tx.query<{ id: string; code: string }>(
      `SELECT id, code FROM warehouses WHERE code IN ('WH-OOTY', 'WH-COON', 'WH-KOTA', 'WH-GUDA')`,
    );
    const byCode = new Map(warehouses.rows.map((w) => [w.code, w.id]));
    const customerUser = await newUser(tx, 'CUSTOMER', 'Private Customer Name');
    const customer = await tx.query<{ id: string }>(
      `INSERT INTO customers (user_id, customer_code) VALUES ($1, $2) RETURNING id`,
      [customerUser, `CUST-CI-${Date.now()}${seq}`],
    );
    const wallet = await tx.query<{ id: string }>(
      `INSERT INTO wallets (owner_type, customer_id) VALUES ('CUSTOMER', $1) RETURNING id`,
      [customer.rows[0]!.id],
    );
    const cat = await tx.query<{ id: string }>(`SELECT id FROM expense_categories WHERE name = 'Transport'`);
    return {
      closer: await newUser(tx, 'ADMIN', 'CI Closer'),
      otherUser: await newUser(tx, 'ADMIN', 'CI Other'),
      customerId: customer.rows[0]!.id,
      walletId: wallet.rows[0]!.id,
      ooty: byCode.get('WH-OOTY')!,
      coonoor: byCode.get('WH-COON')!,
      kotagiri: byCode.get('WH-KOTA')!,
      gudalur: byCode.get('WH-GUDA')!,
      transport: cat.rows[0]!.id,
    };
  }

  const sub = (f: Fixture, warehouseId: string, userId = f.closer): ResolvedScope =>
    aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds: [warehouseId], permission: 'finance.cash_close.manage', userId });
  const main = (f: Fixture, userId = f.closer): ResolvedScope =>
    aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.MAIN_WH_ADMIN, permission: 'finance.cash_close.manage', userId });

  async function insertOrder(
    tx: Executor,
    f: Fixture,
    o: { warehouseId: string; total: string; completedAt: string | null; paymentMethod?: string; paymentStatus?: string; status?: string },
  ): Promise<void> {
    await tx.query(
      `INSERT INTO orders (order_number, customer_id, warehouse_id, channel, total_amount, payment_method, payment_status, status, placed_at, completed_at)
       VALUES ($1, $2, $3, 'MARKET', $4, $5::payment_method, $6, $7::order_status,
               COALESCE($8::timestamptz, now()) - interval '1 hour', $8::timestamptz)`,
      [`CI-${newId()}`, f.customerId, o.warehouseId, o.total, o.paymentMethod ?? 'CASH', o.paymentStatus ?? 'PAID', o.status ?? 'PICKED_UP', o.completedAt],
    );
  }

  let tagSeq = 0;
  async function insertTopUp(
    tx: Executor,
    f: Fixture,
    o: { warehouseId: string; amount: string; createdAt: string; channel?: string; status?: string },
  ): Promise<void> {
    tagSeq += 1;
    const channel = o.channel ?? 'CASH';
    await tx.query(
      `INSERT INTO topups (wallet_id, customer_id, channel, amount, fiscal_cash_tag, warehouse_id, processed_by, status, created_at)
       VALUES ($1, $2, $3::topup_channel, $4, $5, $6, $7, $8, $9::timestamptz)`,
      [
        f.walletId,
        f.customerId,
        channel,
        o.amount,
        channel === 'CASH' ? `TAG-${Date.now()}-${tagSeq}-${newId()}` : null,
        o.warehouseId,
        f.closer,
        o.status ?? 'SUCCESS',
        o.createdAt,
      ],
    );
  }

  async function insertExpense(
    tx: Executor,
    f: Fixture,
    o: { warehouseId: string; amount: string; date?: string; paymentMethod?: string; status?: string; deleted?: boolean },
  ): Promise<void> {
    await tx.query(
      `INSERT INTO expenses (warehouse_id, category, category_id, amount, expense_date, payment_method, status, recorded_by, deleted_at)
       VALUES ($1, 'Transport', $2, $3, $4::date, $5, $6, $7, CASE WHEN $8::boolean THEN now() END)`,
      [o.warehouseId, f.transport, o.amount, o.date ?? DAY, o.paymentMethod ?? 'CASH', o.status ?? 'RECORDED', f.closer, o.deleted ?? false],
    );
  }

  /** Raw insert of an earlier close, satisfying the table's arithmetic CHECKs (all of `expected` is booked as cash sales). */
  async function insertClose(tx: Executor, f: Fixture, o: { warehouseId: string; date: string; counted: string; expected?: string }): Promise<void> {
    const expected = o.expected ?? o.counted;
    await tx.query(
      `INSERT INTO cash_closes (warehouse_id, close_date, opening_cash, cash_sales, cash_top_ups, cash_expenses, expected_closing, counted_cash, difference, closed_by)
       VALUES ($1, $2::date, 0, $3, 0, 0, $3, $4, $4::numeric - $3::numeric, $5)`,
      [o.warehouseId, o.date, expected, o.counted, f.closer],
    );
  }

  async function auditRows(tx: Executor, entityId: string) {
    const result = await tx.query<{ action_code: string; actor_id: string; actor_role: string; warehouse_id: string | null; after: Record<string, unknown> | null }>(
      `SELECT action_code, actor_id, actor_role, warehouse_id, after FROM audit_log WHERE entity_id = $1 ORDER BY created_at, id`,
      [entityId],
    );
    return result.rows;
  }

  /** The fixed scenario: every kind of row that must, and must not, count for ooty on DAY. */
  async function seedDay(tx: Executor, f: Fixture): Promise<void> {
    const IN_START = '1950-03-09T18:30:00Z'; // 00:00 IST on DAY, inclusive
    const IN_END = '1950-03-10T18:29:59Z'; // 23:59:59 IST on DAY
    // Orders: 100.10 + 200.20 count.
    await insertOrder(tx, f, { warehouseId: f.ooty, total: '100.10', completedAt: IN_START });
    await insertOrder(tx, f, { warehouseId: f.ooty, total: '200.20', completedAt: IN_END, status: 'DELIVERED' });
    await insertOrder(tx, f, { warehouseId: f.ooty, total: '999.00', completedAt: '1950-03-09T18:29:59Z' });
    await insertOrder(tx, f, { warehouseId: f.ooty, total: '888.00', completedAt: '1950-03-10T18:30:00Z' });
    await insertOrder(tx, f, { warehouseId: f.ooty, total: '50.00', completedAt: IN_START, paymentMethod: 'UPI' });
    await insertOrder(tx, f, { warehouseId: f.ooty, total: '60.00', completedAt: IN_START, paymentMethod: 'WALLET' });
    await insertOrder(tx, f, { warehouseId: f.ooty, total: '70.00', completedAt: IN_START, paymentStatus: 'PENDING' });
    await insertOrder(tx, f, { warehouseId: f.ooty, total: '80.00', completedAt: null, status: 'CONFIRMED' });
    await insertOrder(tx, f, { warehouseId: f.coonoor, total: '30.00', completedAt: IN_START });
    // Top-ups: 0.10 + 0.20 count.
    await insertTopUp(tx, f, { warehouseId: f.ooty, amount: '0.10', createdAt: IN_START });
    await insertTopUp(tx, f, { warehouseId: f.ooty, amount: '0.20', createdAt: IN_END });
    await insertTopUp(tx, f, { warehouseId: f.ooty, amount: '500.00', createdAt: IN_START, status: 'PENDING' });
    await insertTopUp(tx, f, { warehouseId: f.ooty, amount: '600.00', createdAt: IN_START, status: 'FAILED' });
    await insertTopUp(tx, f, { warehouseId: f.ooty, amount: '700.00', createdAt: IN_START, channel: 'UPI' });
    await insertTopUp(tx, f, { warehouseId: f.coonoor, amount: '800.00', createdAt: IN_START });
    await insertTopUp(tx, f, { warehouseId: f.ooty, amount: '900.00', createdAt: '1950-03-09T18:29:59Z' });
    // Expenses: 0.10 + 0.20 + 0.30 count. Every CASH expense of the day counts; the legacy APPROVED and
    // REJECTED values (no endpoint can produce them, BR-62) are not excluded either.
    await insertExpense(tx, f, { warehouseId: f.ooty, amount: '0.10' });
    await insertExpense(tx, f, { warehouseId: f.ooty, amount: '0.20', status: 'APPROVED' });
    await insertExpense(tx, f, { warehouseId: f.ooty, amount: '0.30', status: 'REJECTED' });
    await insertExpense(tx, f, { warehouseId: f.ooty, amount: '500.00', paymentMethod: 'UPI' });
    await insertExpense(tx, f, { warehouseId: f.ooty, amount: '600.00', deleted: true });
    await insertExpense(tx, f, { warehouseId: f.ooty, amount: '700.00', date: '1950-03-11' });
    await insertExpense(tx, f, { warehouseId: f.coonoor, amount: '800.00' });
  }

  // ----- the computed figures ----------------------------------------------
  it('BR-74a (PostgreSQL): cash sales, cash top-ups and cash expenses are computed from existing data for one warehouse and one Asia/Kolkata day, exactly', async () => {
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      await seedDay(tx, f);
      const summary = await cash(tx).dailySummary(sub(f, f.ooty), { date: DAY });
      expect(summary.warehouseId).toBe(f.ooty);
      expect(summary.date).toBe(DAY);
      expect(summary.closed).toBeNull();
      expect(summary.system).toEqual({
        openingCash: '0.00',
        openingFrom: null,
        cashSales: '300.30',
        cashTopUps: '0.30',
        cashExpenses: '0.60',
        // 0.00 + 300.30 + 0.30 - 0.60: exact decimal, never a float.
        expectedClosing: '300.00',
      });
      expect(dailySummaryResponse.safeParse(summary).success).toBe(true);

      // Coonoor sees only its own rows: 30.00 sale, 800.00 top-up, 800.00 expense.
      const coonoor = await cash(tx).dailySummary(main(f), { date: DAY, warehouseId: f.coonoor });
      expect(coonoor.system).toMatchObject({ cashSales: '30.00', cashTopUps: '800.00', cashExpenses: '800.00', expectedClosing: '30.00' });
      // A day with nothing is all zeros, never null.
      const empty = await cash(tx).dailySummary(main(f), { date: '1950-03-20', warehouseId: f.gudalur });
      expect(empty.system).toEqual({ openingCash: '0.00', openingFrom: null, cashSales: '0.00', cashTopUps: '0.00', cashExpenses: '0.00', expectedClosing: '0.00' });
    });
  });

  it('BR-74b (PostgreSQL): the opening cash is the COUNTED cash of the latest earlier close, 0 with none; a later close and another warehouse are ignored', async () => {
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      await insertClose(tx, f, { warehouseId: f.ooty, date: '1950-03-05', counted: '1000.00' });
      await insertClose(tx, f, { warehouseId: f.ooty, date: '1950-03-08', counted: '2500.00', expected: '2490.00' });
      await insertClose(tx, f, { warehouseId: f.ooty, date: '1950-03-12', counted: '9999.00' });
      await insertClose(tx, f, { warehouseId: f.coonoor, date: '1950-03-09', counted: '7777.00' });
      await insertOrder(tx, f, { warehouseId: f.ooty, total: '10.50', completedAt: '1950-03-10T06:00:00Z' });

      const ooty = (await cash(tx).dailySummary(sub(f, f.ooty), { date: DAY })).system;
      expect(ooty.openingCash).toBe('2500.00');
      expect(ooty.openingFrom).toBe('1950-03-08');
      expect(ooty.expectedClosing).toBe('2510.50');

      const gudalur = (await cash(tx).dailySummary(main(f), { date: DAY, warehouseId: f.gudalur })).system;
      expect(gudalur).toMatchObject({ openingCash: '0.00', openingFrom: null });
      // The day of a close is not its own opening: closing 03-08 itself opens from 03-05.
      const eighth = (await cash(tx).dailySummary(sub(f, f.ooty), { date: '1950-03-08' })).system;
      expect(eighth).toMatchObject({ openingCash: '1000.00', openingFrom: '1950-03-05' });
    });
  });

  // ----- the close ----------------------------------------------------------
  it('BR-74c (PostgreSQL): a close records the system figures, the counted cash, the difference, the note and the closer, plus ONE masked audit row in the same transaction', async () => {
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      await seedDay(tx, f);
      const { close, replayed } = await cash(tx).close(sub(f, f.ooty), 'k-close-1', {
        date: DAY,
        countedCash: '290.00',
        note: 'Short by 10, call 9876543210',
      });
      expect(replayed).toBe(false);
      expect(cashCloseResponse.safeParse(close).success).toBe(true);
      expect(close).toMatchObject({
        warehouseId: f.ooty,
        date: DAY,
        openingCash: '0.00',
        openingFrom: null,
        cashSales: '300.30',
        cashTopUps: '0.30',
        cashExpenses: '0.60',
        expectedClosing: '300.00',
        countedCash: '290.00',
        difference: '-10.00',
        note: 'Short by 10, call 9876543210',
        closedBy: f.closer,
      });

      const row = await tx.query<{ difference: string; expected_closing: string; closed_by: string }>(
        `SELECT difference::text, expected_closing::text, closed_by FROM cash_closes WHERE id = $1`,
        [close.id],
      );
      expect(row.rows[0]).toEqual({ difference: '-10.00', expected_closing: '300.00', closed_by: f.closer });

      const audits = await auditRows(tx, close.id);
      expect(audits).toHaveLength(1);
      expect(audits[0]).toMatchObject({ action_code: 'finance.cash_close.manage', actor_id: f.closer, actor_role: 'SUB_WH_ADMIN', warehouse_id: f.ooty });
      expect(Object.keys(audits[0]!.after!).sort()).toEqual(['countedCash', 'date', 'difference', 'expectedClosing', 'id', 'warehouseId']);
      expect(JSON.stringify(audits[0])).not.toContain('9876543210');
      expect(JSON.stringify(audits[0])).not.toContain('Short by');

      // The day now reads as closed, with the stored snapshot; the live system figures are still computed.
      const summary = await cash(tx).dailySummary(sub(f, f.ooty), { date: DAY });
      expect(summary.closed).toEqual(close);
      expect(summary.system.expectedClosing).toBe('300.00');
    });
  });

  it('BR-74c (PostgreSQL): counting more than expected is a positive difference, counting nothing is valid, and no difference is ever refused', async () => {
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      await seedDay(tx, f);
      const over = await cash(tx).close(sub(f, f.ooty), 'k-over', { date: DAY, countedCash: '350.00' });
      expect(over.close).toMatchObject({ expectedClosing: '300.00', difference: '50.00', note: null });

      const zero = await cash(tx).close(sub(f, f.coonoor), 'k-zero', { date: '1950-03-20', countedCash: '0.00' });
      expect(zero.close).toMatchObject({ expectedClosing: '0.00', countedCash: '0.00', difference: '0.00' });

      // A huge shortfall is recorded, not judged: there is no tolerance to exceed.
      await insertOrder(tx, f, { warehouseId: f.kotagiri, total: '9000000.00', completedAt: '1950-03-10T06:00:00Z' });
      const big = await cash(tx).close(sub(f, f.kotagiri), 'k-big', { date: DAY, countedCash: '0.01' });
      expect(big.close).toMatchObject({ expectedClosing: '9000000.00', difference: '-8999999.99' });
    });
  });

  it('BR-74d (PostgreSQL): one close per warehouse and day: a second close of the same day with a NEW key is 409 CONFLICT and writes nothing; another day or warehouse is fine', async () => {
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const first = await cash(tx).close(sub(f, f.ooty), 'k-once-1', { date: DAY, countedCash: '10.00' });
      const err = await failure(cash(tx).close(main(f, f.otherUser), 'k-once-2', { date: DAY, countedCash: '99.00', warehouseId: f.ooty }));
      expect(err.code).toBe('CONFLICT');
      expect(err.status).toBe(409);
      const count = await tx.query<{ n: string }>(`SELECT count(*)::text AS n FROM cash_closes WHERE warehouse_id = $1 AND close_date = $2::date`, [f.ooty, DAY]);
      expect(count.rows[0]!.n).toBe('1');
      expect(await auditRows(tx, first.close.id)).toHaveLength(1);

      expect((await cash(tx).close(sub(f, f.ooty), 'k-once-3', { date: '1950-03-11', countedCash: '1.00' })).replayed).toBe(false);
      expect((await cash(tx).close(sub(f, f.coonoor), 'k-once-4', { date: DAY, countedCash: '1.00' })).replayed).toBe(false);
    });
  });

  it('BR-74e (PostgreSQL): replaying the key returns the original close with no second row or audit row; a different body is 409 IDEMPOTENCY_KEY_REUSED; a missing key is 422', async () => {
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      await seedDay(tx, f);
      const first = await cash(tx).close(sub(f, f.ooty), 'k-replay', { date: DAY, countedCash: '290.00', note: 'once' });
      const replay = await cash(tx).close(sub(f, f.ooty), 'k-replay', { date: DAY, countedCash: '290.00', note: 'once' });
      expect(replay.replayed).toBe(true);
      expect(replay.close).toEqual(first.close);
      const counts = await tx.query<{ closes: string; audits: string }>(
        `SELECT (SELECT count(*) FROM cash_closes WHERE warehouse_id = $1 AND close_date = $3::date)::text AS closes,
                (SELECT count(*) FROM audit_log WHERE entity_id = $2)::text AS audits`,
        [f.ooty, first.close.id, DAY],
      );
      expect(counts.rows[0]).toEqual({ closes: '1', audits: '1' });

      expect((await failure(cash(tx).close(sub(f, f.ooty), 'k-replay', { date: DAY, countedCash: '291.00', note: 'once' }))).code).toBe('IDEMPOTENCY_KEY_REUSED');
      expect((await failure(cash(tx).close(sub(f, f.ooty), 'k-replay', { date: DAY, countedCash: '290.00' }))).code).toBe('IDEMPOTENCY_KEY_REUSED');
      expect((await failure(cash(tx).close(sub(f, f.ooty), undefined, { date: '1950-03-12', countedCash: '1.00' }))).code).toBe('VALIDATION_FAILED');
      expect((await failure(cash(tx).close(sub(f, f.ooty), '   ', { date: '1950-03-12', countedCash: '1.00' }))).code).toBe('VALIDATION_FAILED');
    });
  });

  it('BR-74f (PostgreSQL): a future day cannot be closed, an unknown or inactive warehouse is 422, and a Main admin must name the warehouse', async () => {
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const future = await failure(cash(tx).close(sub(f, f.ooty), 'k-future', { date: '2999-01-01', countedCash: '1.00' }));
      expect(future.code).toBe('VALIDATION_FAILED');
      expect(future.errors).toHaveProperty(['body.date']);
      // Today (India) is allowed.
      const today = await tx.query<{ d: string }>(`SELECT (now() AT TIME ZONE 'Asia/Kolkata')::date::text AS d`);
      expect((await cash(tx).close(sub(f, f.ooty), 'k-today', { date: today.rows[0]!.d, countedCash: '1.00' })).replayed).toBe(false);

      const noWarehouse = await failure(cash(tx).close(main(f), 'k-nowh', { date: DAY, countedCash: '1.00' }));
      expect(noWarehouse.code).toBe('VALIDATION_FAILED');
      expect(noWarehouse.errors).toHaveProperty(['body.warehouseId']);
      expect((await failure(cash(tx).close(main(f), 'k-unknown', { date: DAY, countedCash: '1.00', warehouseId: newId() }))).code).toBe('VALIDATION_FAILED');
      await tx.query(`UPDATE warehouses SET is_active = false WHERE id = $1`, [f.gudalur]);
      expect((await failure(cash(tx).close(main(f), 'k-inactive', { date: DAY, countedCash: '1.00', warehouseId: f.gudalur }))).code).toBe('VALIDATION_FAILED');
      expect((await cash(tx).close(main(f), 'k-main-ok', { date: DAY, countedCash: '1.00', warehouseId: f.kotagiri })).close.warehouseId).toBe(f.kotagiri);

      const noSummaryWarehouse = await failure(cash(tx).dailySummary(main(f), { date: DAY }));
      expect(noSummaryWarehouse.errors).toHaveProperty(['query.warehouseId']);
    });
  });

  it('BR-74g (PostgreSQL): a Sub admin closes only their own warehouse (default) and gets 404 for another, for both the summary and the close', async () => {
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const own = await cash(tx).close(sub(f, f.ooty), 'k-own', { date: DAY, countedCash: '1.00' });
      expect(own.close.warehouseId).toBe(f.ooty);
      const cross = await failure(cash(tx).close(sub(f, f.ooty), 'k-cross', { date: DAY, countedCash: '1.00', warehouseId: f.coonoor }));
      expect(cross.code).toBe('NOT_FOUND');
      expect(cross.status).toBe(404);
      expect((await failure(cash(tx).dailySummary(sub(f, f.ooty), { date: DAY, warehouseId: f.coonoor }))).code).toBe('NOT_FOUND');
      const none = await tx.query<{ n: string }>(`SELECT count(*)::text AS n FROM cash_closes WHERE warehouse_id = $1 AND close_date = $2::date`, [f.coonoor, DAY]);
      expect(none.rows[0]!.n).toBe('0');
    });
  });

  it('BR-74h (PostgreSQL): closing an earlier day after a later one is recorded with its own opening: no ordering rule is invented', async () => {
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      await insertClose(tx, f, { warehouseId: f.ooty, date: '1950-03-05', counted: '1000.00' });
      await insertClose(tx, f, { warehouseId: f.ooty, date: '1950-03-12', counted: '4000.00' });
      const backdated = await cash(tx).close(sub(f, f.ooty), 'k-back', { date: '1950-03-08', countedCash: '1000.00' });
      expect(backdated.close).toMatchObject({ openingCash: '1000.00', openingFrom: '1950-03-05', expectedClosing: '1000.00', difference: '0.00' });
    });
  });

  // ----- append-only --------------------------------------------------------
  it('BR-74i (PostgreSQL): a close can never be updated or deleted, the arithmetic is enforced by CHECKs, and the day is unique at the database level', async () => {
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const { close } = await cash(tx).close(sub(f, f.ooty), 'k-ao', { date: DAY, countedCash: '5.00' });

      async function refused(sql: string, params: unknown[], pattern: RegExp): Promise<void> {
        await tx.query('SAVEPOINT refused');
        try {
          await tx.query(sql, params);
          throw new Error(`expected the database to refuse: ${sql}`);
        } catch (error) {
          expect(String((error as Error).message), sql).toMatch(pattern);
        } finally {
          await tx.query('ROLLBACK TO SAVEPOINT refused');
        }
      }

      await refused(`UPDATE cash_closes SET counted_cash = 6.00 WHERE id = $1`, [close.id], /append-only/);
      await refused(`UPDATE cash_closes SET note = 'edit' WHERE id = $1`, [close.id], /append-only/);
      await refused(`DELETE FROM cash_closes WHERE id = $1`, [close.id], /append-only/);
      await refused(`TRUNCATE cash_closes`, [], /append-only/);
      await refused(
        `INSERT INTO cash_closes (warehouse_id, close_date, opening_cash, cash_sales, cash_top_ups, cash_expenses, expected_closing, counted_cash, difference, closed_by)
         VALUES ($1, '1950-04-01', 0, 10, 0, 0, 10, 4, 99, $2)`,
        [f.ooty, f.closer],
        /cash_closes_difference_chk/,
      );
      await refused(
        `INSERT INTO cash_closes (warehouse_id, close_date, opening_cash, cash_sales, cash_top_ups, cash_expenses, expected_closing, counted_cash, difference, closed_by)
         VALUES ($1, '1950-04-01', 0, 10, 0, 0, 11, 4, -7, $2)`,
        [f.ooty, f.closer],
        /cash_closes_expected_chk/,
      );
      await refused(
        `INSERT INTO cash_closes (warehouse_id, close_date, opening_cash, cash_sales, cash_top_ups, cash_expenses, expected_closing, counted_cash, difference, closed_by)
         VALUES ($1, $2::date, 0, 10, 0, 0, 10, 10, 0, $3)`,
        [f.ooty, DAY, f.closer],
        /uq_cash_closes_warehouse_date/,
      );
      await refused(
        `INSERT INTO cash_closes (warehouse_id, close_date, opening_cash, cash_sales, cash_top_ups, cash_expenses, expected_closing, counted_cash, difference, closed_by)
         VALUES ($1, '1950-04-02', 0, 10, 0, 0, 10, -1, -11, $2)`,
        [f.ooty, f.closer],
        /cash_closes_counted_cash_check/,
      );
    });
  });

  // ----- reads --------------------------------------------------------------
  it('BR-74j (PostgreSQL): the close list is scoped (Sub sees only its warehouse, Main all four), newest first, filterable, cursor-paginated exactly once; by-id is 404 out of scope', async () => {
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      await insertClose(tx, f, { warehouseId: f.ooty, date: '1950-03-01', counted: '1.00' });
      await insertClose(tx, f, { warehouseId: f.ooty, date: '1950-03-02', counted: '2.00' });
      await insertClose(tx, f, { warehouseId: f.ooty, date: '1950-03-03', counted: '3.00' });
      await insertClose(tx, f, { warehouseId: f.coonoor, date: '1950-03-03', counted: '4.00' });
      await insertClose(tx, f, { warehouseId: f.kotagiri, date: '1950-03-04', counted: '5.00' });
      const window = { from: '1950-03-01', to: '1950-03-31', limit: 100 };

      const own = await cash(tx).list(sub(f, f.ooty), window);
      expect(own.items.map((c) => c.date)).toEqual(['1950-03-03', '1950-03-02', '1950-03-01']);
      expect(own.items.every((c) => c.warehouseId === f.ooty)).toBe(true);
      expect(own.page).toEqual({ nextCursor: null, hasMore: false });

      const all = await cash(tx).list(main(f), window);
      expect(all.items).toHaveLength(5);
      expect(all.items[0]!.date).toBe('1950-03-04');
      expect((await cash(tx).list(main(f), { ...window, warehouseId: f.coonoor })).items.map((c) => c.countedCash)).toEqual(['4.00']);
      expect((await cash(tx).list(sub(f, f.ooty), { ...window, warehouseId: f.coonoor })).items).toEqual([]);
      expect((await cash(tx).list(main(f), { ...window, from: '1950-03-03', to: '1950-03-03' })).items).toHaveLength(2);

      const seen: string[] = [];
      let cursor: string | undefined;
      let pages = 0;
      do {
        const page = await cash(tx).list(main(f), { ...window, limit: 2, ...(cursor === undefined ? {} : { cursor }) });
        seen.push(...page.items.map((c) => c.id));
        cursor = page.page.nextCursor ?? undefined;
        pages += 1;
        expect(pages).toBeLessThan(10);
      } while (cursor !== undefined);
      expect(seen).toHaveLength(5);
      expect(new Set(seen).size).toBe(5);
      expect(pages).toBe(3);
      expect((await failure(cash(tx).list(main(f), { ...window, cursor: 'garbage' }))).code).toBe('VALIDATION_FAILED');

      const otherWarehouseId = all.items.find((c) => c.warehouseId === f.kotagiri)!.id;
      const cross = await failure(cash(tx).get(sub(f, f.ooty), otherWarehouseId));
      expect(cross.code).toBe('NOT_FOUND');
      expect(cross.status).toBe(404);
      expect((await cash(tx).get(main(f), otherWarehouseId)).warehouseId).toBe(f.kotagiri);
      expect((await failure(cash(tx).get(main(f), newId()))).code).toBe('NOT_FOUND');
      expect((await cash(tx).get(sub(f, f.ooty), own.items[0]!.id)).countedCash).toBe('3.00');
    });
  });
});

// ===========================================================================
// 3. Real HTTP through the real app router
// ===========================================================================
describeIfDatabase('Cash close routes (real app router, PostgreSQL)', () => {
  let ready = false;
  let app: Express;
  let server: Server;
  const tokens: Record<string, string> = {};
  let ootyId = '';
  let coonoorId = '';
  let kotagiriId = '';
  const userIds = { sub: '', other: '' };

  /**
   * cash_closes is append-only, so a committed row can never be cleaned up and a day closes once.
   * Each run therefore closes a random day in 1960-2022 (never "today" or the future). The service
   * tests above use 1950, EARLIER than every such day, so a committed row is never the "latest earlier
   * close" that sets their opening cash; and 1950 is inside Asia/Kolkata's fixed +05:30 era, which the
   * day-boundary assertions rely on.
   */
  const randomDay = (): string => new Date(Date.UTC(1960, 0, 1) + randomInt(0, 23_000) * 86_400_000).toISOString().slice(0, 10);
  let seq = 0;
  const key = (label: string): string => `ci-cash-${Date.now()}-${label}-${(seq += 1)}`;

  beforeAll(async () => {
    ready = await databaseReady('cash_closes');
    if (!ready) throw new Error('the database is configured but cash_closes is missing: run the migrations');
    const [{ createApp }, { signAccessToken }, { pool }] = await Promise.all([
      import('../../app.js'),
      import('../../auth/jwt.js'),
      import('../../db/pool.js'),
    ]);
    app = createApp();
    server = app.listen(0);
    const wh = await pool.query<{ id: string; code: string }>(`SELECT id, code FROM warehouses WHERE code IN ('WH-OOTY', 'WH-COON', 'WH-KOTA')`);
    ootyId = wh.rows.find((w) => w.code === 'WH-OOTY')!.id;
    coonoorId = wh.rows.find((w) => w.code === 'WH-COON')!.id;
    kotagiriId = wh.rows.find((w) => w.code === 'WH-KOTA')!.id;

    const stamp = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
    for (const [field, name, offset] of [['sub', 'CI Cash Sub', 1], ['other', 'CI Cash Other', 2]] as const) {
      const row = await pool.query<{ id: string }>(
        `INSERT INTO users (mobile, full_name, user_type, status) VALUES ($1, $2, 'ADMIN', 'ACTIVE') RETURNING id`,
        [`+9194${stamp.slice(-7)}${offset}`, name],
      );
      userIds[field] = row.rows[0]!.id;
    }
    const superAdmin = '00000000-0000-0000-0000-000000000001';
    const base = { farmerId: null, customerId: null };
    tokens['sa'] = signAccessToken({ sub: superAdmin, roles: [{ code: RoleCode.SUPER_ADMIN }], ...base });
    tokens['ta'] = signAccessToken({ sub: userIds.other, roles: [{ code: RoleCode.TOHFA_ADMIN }], ...base });
    tokens['main'] = signAccessToken({ sub: userIds.other, roles: [{ code: RoleCode.MAIN_WH_ADMIN }], ...base });
    tokens['subOoty'] = signAccessToken({ sub: userIds.sub, roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: ootyId }], ...base });
    tokens['subCoonoor'] = signAccessToken({ sub: userIds.sub, roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: coonoorId }], ...base });
    tokens['subKotagiri'] = signAccessToken({ sub: userIds.sub, roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: kotagiriId }], ...base });
    tokens['farmer'] = signAccessToken({ sub: superAdmin, roles: [{ code: RoleCode.FARMER }], farmerId: newId(), customerId: null });
    tokens['customer'] = signAccessToken({ sub: superAdmin, roles: [{ code: RoleCode.CUSTOMER }], farmerId: null, customerId: newId() });
    tokens['farmerAdmin'] = signAccessToken({ sub: superAdmin, roles: [{ code: RoleCode.FARMER_ADMIN, zoneId: newId() }], ...base });
  });

  afterAll(async () => {
    if (!ready) return;
    const [{ pool, closePool }, { closeRedis }] = await Promise.all([import('../../db/pool.js'), import('../../redis.js')]);
    await pool.query(`DELETE FROM idempotency_keys WHERE idempotency_key LIKE 'ci-cash-%'`);
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await Promise.allSettled([closePool(), closeRedis()]);
  });

  const auth = (name: string): string => `Bearer ${tokens[name]!}`;
  const ZERO_ID = '99999999-9999-4999-8999-999999999999';

  const ROUTES: Array<{ method: 'get' | 'post'; path: string; body?: object }> = [
    { method: 'get', path: `/v1/admin/finance/daily-summary?date=${DAY}` },
    { method: 'post', path: '/v1/admin/finance/cash-close', body: { date: DAY, countedCash: '1.00' } },
    { method: 'get', path: '/v1/admin/finance/cash-close' },
    { method: 'get', path: `/v1/admin/finance/cash-close/${ZERO_ID}` },
  ];

  it('BR-74k (HTTP): every cash-close route is 401 without a token and 403 for FARMER, CUSTOMER and FARMER_ADMIN', async () => {
    for (const { method, path, body } of ROUTES) {
      const anonymous = await request(server)[method](path).send(body);
      expect(anonymous.status, `${method} ${path} anonymous`).toBe(401);
      for (const role of ['farmer', 'customer', 'farmerAdmin']) {
        const res = await request(server)[method](path).set('Authorization', auth(role)).set('Idempotency-Key', key('denied')).send(body);
        expect(res.status, `${method} ${path} as ${role}: ${JSON.stringify(res.body)}`).toBe(403);
        expect(res.headers['content-type']).toContain('application/problem+json');
      }
    }
  });

  it('BR-74l (HTTP): a Sub admin sees the computed summary, closes the day (201), the replay is 200 with the same row, a second close is 409, and the summary then shows it closed', async () => {
    const date = randomDay();
    const summary = await request(server).get('/v1/admin/finance/daily-summary').query({ date }).set('Authorization', auth('subOoty'));
    expect(summary.status, JSON.stringify(summary.body)).toBe(200);
    expect(summary.body).toMatchObject({ warehouseId: ootyId, date, closed: null });
    expect(dailySummaryResponse.safeParse(summary.body).success).toBe(true);
    const expected = summary.body.system.expectedClosing as string;
    expect(typeof expected).toBe('string');

    const k = key('close');
    const body = { date, countedCash: '12.34', note: 'ci close' };
    const created = await request(server).post('/v1/admin/finance/cash-close').set('Authorization', auth('subOoty')).set('Idempotency-Key', k).send(body);
    expect(created.status, JSON.stringify(created.body)).toBe(201);
    expect(created.body).toMatchObject({ warehouseId: ootyId, date, countedCash: '12.34', expectedClosing: expected, closedBy: userIds.sub, note: 'ci close' });
    expect(cashCloseResponse.safeParse(created.body).success).toBe(true);
    expect(typeof created.body.difference).toBe('string');

    const replay = await request(server).post('/v1/admin/finance/cash-close').set('Authorization', auth('subOoty')).set('Idempotency-Key', k).send(body);
    expect(replay.status).toBe(200);
    expect(replay.body).toEqual(created.body);
    const reused = await request(server).post('/v1/admin/finance/cash-close').set('Authorization', auth('subOoty')).set('Idempotency-Key', k).send({ ...body, countedCash: '12.35' });
    expect(reused.status).toBe(409);
    expect(reused.body.code).toBe('IDEMPOTENCY_KEY_REUSED');
    const second = await request(server).post('/v1/admin/finance/cash-close').set('Authorization', auth('subOoty')).set('Idempotency-Key', key('second')).send(body);
    expect(second.status).toBe(409);
    expect(second.body.code).toBe('CONFLICT');

    const after = await request(server).get('/v1/admin/finance/daily-summary').query({ date }).set('Authorization', auth('subOoty'));
    expect(after.body.closed).toEqual(created.body);

    const detail = await request(server).get(`/v1/admin/finance/cash-close/${created.body.id as string}`).set('Authorization', auth('subOoty'));
    expect(detail.status).toBe(200);
    expect(detail.body).toEqual(created.body);
    expect((await request(server).get(`/v1/admin/finance/cash-close/${created.body.id as string}`).set('Authorization', auth('subKotagiri'))).status).toBe(404);
    expect((await request(server).get(`/v1/admin/finance/cash-close/${created.body.id as string}`).set('Authorization', auth('main'))).status).toBe(200);
    expect((await request(server).get(`/v1/admin/finance/cash-close/${ZERO_ID}`).set('Authorization', auth('sa'))).status).toBe(404);
    expect((await request(server).get('/v1/admin/finance/cash-close/not-a-uuid').set('Authorization', auth('sa'))).status).toBe(422);

    const list = await request(server).get('/v1/admin/finance/cash-close').query({ from: date, to: date }).set('Authorization', auth('subOoty'));
    expect(list.status, JSON.stringify(list.body)).toBe(200);
    expect(list.body.items.map((c: { id: string }) => c.id)).toEqual([created.body.id]);
    const otherList = await request(server).get('/v1/admin/finance/cash-close').query({ from: date, to: date }).set('Authorization', auth('subKotagiri'));
    expect(otherList.status).toBe(200);
    expect(otherList.body.items).toEqual([]);
    const mainList = await request(server).get('/v1/admin/finance/cash-close').query({ from: date, to: date, warehouseId: ootyId }).set('Authorization', auth('main'));
    expect(mainList.body.items.map((c: { id: string }) => c.id)).toEqual([created.body.id]);
  });

  it('BR-74m (HTTP): Main and TOHFA Admin close a named warehouse; they must name it; another Sub warehouse id in the body is 404', async () => {
    const date = randomDay();
    const noWarehouse = await request(server).post('/v1/admin/finance/cash-close').set('Authorization', auth('main')).set('Idempotency-Key', key('main-nowh')).send({ date, countedCash: '1.00' });
    expect(noWarehouse.status).toBe(422);
    const noSummaryWarehouse = await request(server).get('/v1/admin/finance/daily-summary').query({ date }).set('Authorization', auth('main'));
    expect(noSummaryWarehouse.status).toBe(422);

    const viaMain = await request(server).post('/v1/admin/finance/cash-close').set('Authorization', auth('main')).set('Idempotency-Key', key('main')).send({ date, countedCash: '1.00', warehouseId: coonoorId });
    expect(viaMain.status, JSON.stringify(viaMain.body)).toBe(201);
    expect(viaMain.body.warehouseId).toBe(coonoorId);
    const viaTa = await request(server).post('/v1/admin/finance/cash-close').set('Authorization', auth('ta')).set('Idempotency-Key', key('ta')).send({ date, countedCash: '1.00', warehouseId: kotagiriId });
    expect(viaTa.status, JSON.stringify(viaTa.body)).toBe(201);

    const cross = await request(server).post('/v1/admin/finance/cash-close').set('Authorization', auth('subCoonoor')).set('Idempotency-Key', key('cross')).send({ date: randomDay(), countedCash: '1.00', warehouseId: kotagiriId });
    expect(cross.status).toBe(404);
  });

  it('BR-74n (HTTP): validation errors are 422 and write nothing: no key, float or negative cash, bad date, future date, unknown field, unknown warehouse', async () => {
    const date = randomDay();
    const post = (body: object, k: string | null = key('bad')) => {
      const r = request(server).post('/v1/admin/finance/cash-close').set('Authorization', auth('subKotagiri'));
      return (k === null ? r : r.set('Idempotency-Key', k)).send(body);
    };
    expect((await post({ date, countedCash: '1.00' }, null)).status).toBe(422);
    for (const bad of [{ countedCash: 12.5 }, { countedCash: '-1.00' }, { countedCash: '1.234' }, { date: '1950-02-30' }, { date: '2999-01-01' }, { note: '  ' }, { expectedClosing: '1.00' }]) {
      const res = await post({ date, countedCash: '1.00', ...bad });
      expect(res.status, JSON.stringify(bad)).toBe(422);
    }
    const unknownWarehouse = await request(server).post('/v1/admin/finance/cash-close').set('Authorization', auth('sa')).set('Idempotency-Key', key('unk')).send({ date, countedCash: '1.00', warehouseId: ZERO_ID });
    expect(unknownWarehouse.status).toBe(422);

    const { pool } = await import('../../db/pool.js');
    const rows = await pool.query(`SELECT 1 FROM cash_closes WHERE close_date = $1::date AND warehouse_id = $2`, [date, kotagiriId]);
    expect(rows.rowCount).toBe(0);
    expect((await request(server).get('/v1/admin/finance/daily-summary').query({ date: '1950-02-30' }).set('Authorization', auth('sa'))).status).toBe(422);
    expect((await request(server).get('/v1/admin/finance/cash-close').query({ cursor: 'garbage' }).set('Authorization', auth('sa'))).status).toBe(422);
    expect((await request(server).get('/v1/admin/finance/cash-close').query({ from: '1950-03-02', to: '1950-03-01' }).set('Authorization', auth('sa'))).status).toBe(422);
  });
});
