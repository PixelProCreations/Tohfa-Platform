/**
 * Module 11 (Warehouse Finance): expense recording, revenue reads, raw reports.
 *
 * BR-62 = expense recording: own warehouse, idempotent, audited, no approval workflow, real date,
 *         positive Money.
 * BR-63 = finance reads are warehouse-scoped: revenue definition, 404 out of scope, a Main
 *         Warehouse Admin sees all four warehouses by the documented default.
 *
 * Three layers, because mocked-repo tests alone once let a SQL bug on nonexistent columns ship:
 *   1. schema tests (no I/O),
 *   2. service tests against a stateful fake repo (fast, no database),
 *   3. `describeIfDatabase` tests that run EVERY repo query against a migrated Postgres, inside
 *      a transaction that is rolled back, plus a few real-HTTP tests through the real app router.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import type { Server } from 'node:http';
import { fromPaise, parseMoney, RoleCode, ScopeLevel, toPaise } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { warehouseVisible } from '../../rbac/warehouseScope.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { aScope, databaseReady, describeIfDatabase, newId } from '../../test/factories.js';
import type {
  ChannelTotalRecord,
  DayTotalRecord,
  ExpenseCategoryRecord,
  ExpenseCursor,
  ExpenseFilters,
  ExpenseRecord,
  FinanceRepo,
  MoneyCount,
  NewExpenseInput,
  RevenueCursor,
  RevenueDetailRecord,
  RevenueFilters,
} from './finance.repo.js';
import {
  createExpenseBody,
  listExpensesQuery,
  listRevenueQuery,
  reportQuery,
} from './finance.schema.js';
import { createFinanceService } from './finance.service.js';

const WH_A = '10000000-0000-4000-8000-0000000000a1';
const WH_B = '10000000-0000-4000-8000-0000000000b2';
const WH_INACTIVE = '10000000-0000-4000-8000-0000000000c3';
const SUB_USER = '00000000-0000-4000-8000-0000000000a1';
const MAIN_USER = '00000000-0000-4000-8000-0000000000a2';
const CAT_TRANSPORT = '70000000-0000-4000-8000-0000000000a1';
const CAT_RETIRED = '70000000-0000-4000-8000-0000000000a2';
const KEY = 'idem-key-0001';

const subScope = (warehouseIds: string[] = [WH_A], permission = 'finance.expense.log'): ResolvedScope =>
  aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds, permission, userId: SUB_USER });
/** finance.expense.log grants MAIN_WH_ADMIN `all`. */
const mainAll = (): ResolvedScope =>
  aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.MAIN_WH_ADMIN, permission: 'finance.expense.log', userId: MAIN_USER });
/** finance.sales_income.view grants MAIN_WH_ADMIN `own`, with no warehouse dimension. */
const mainOwn = (): ResolvedScope =>
  aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.MAIN_WH_ADMIN, permission: 'finance.sales_income.view', userId: MAIN_USER });

const validBody = {
  categoryId: CAT_TRANSPORT,
  expenseDate: '2026-03-10',
  amount: '1234.50',
  paymentMethod: 'CASH' as const,
};

// ===========================================================================
// 1. Schemas
// ===========================================================================
describe('finance schemas', () => {
  it('BR-62a: accepts a Money string amount of at most 2 decimals and 10 integer digits, and rejects zero, negatives, floats and numbers', () => {
    for (const amount of ['0.01', '1', '1234.5', '9999999999.99']) {
      expect(createExpenseBody.safeParse({ ...validBody, amount }).success, amount).toBe(true);
    }
    for (const amount of ['0', '0.00', '-5.00', '1.234', '10000000000.00', '1e3', ' 5', '', 'abc']) {
      expect(createExpenseBody.safeParse({ ...validBody, amount }).success, amount).toBe(false);
    }
    // A JSON number is never Money, even when it is exactly representable.
    expect(createExpenseBody.safeParse({ ...validBody, amount: 12.5 }).success).toBe(false);
  });

  it('BR-62a: rejects a date that is not a real calendar date (2026-02-30) instead of letting Postgres answer 500', () => {
    expect(createExpenseBody.safeParse({ ...validBody, expenseDate: '2026-02-30' }).success).toBe(false);
    expect(createExpenseBody.safeParse({ ...validBody, expenseDate: '2026-2-3' }).success).toBe(false);
    expect(createExpenseBody.safeParse({ ...validBody, expenseDate: '2024-02-29' }).success).toBe(true);
  });

  it('BR-62a: is strict: an unknown field, an unknown payment method and an over-long vendor are all rejected', () => {
    expect(createExpenseBody.safeParse({ ...validBody, status: 'APPROVED' }).success).toBe(false);
    expect(createExpenseBody.safeParse({ ...validBody, recordedBy: SUB_USER }).success).toBe(false);
    expect(createExpenseBody.safeParse({ ...validBody, paymentMethod: 'CARD' }).success).toBe(false);
    expect(createExpenseBody.safeParse({ ...validBody, vendor: 'v'.repeat(201) }).success).toBe(false);
    expect(createExpenseBody.safeParse({ ...validBody, description: 'd'.repeat(1001) }).success).toBe(false);
    expect(createExpenseBody.safeParse({ ...validBody, vendor: 'v'.repeat(200), description: 'd'.repeat(1000) }).success).toBe(true);
    expect(createExpenseBody.safeParse({ ...validBody, categoryId: 'not-a-uuid' }).success).toBe(false);
  });

  it('BR-63a: list and report queries need real dates with from <= to, and the list query is strict', () => {
    expect(listExpensesQuery.safeParse({ from: '2026-03-02', to: '2026-03-01' }).success).toBe(false);
    expect(listExpensesQuery.safeParse({ from: '2026-02-30' }).success).toBe(false);
    expect(listExpensesQuery.safeParse({ from: '2026-03-01', to: '2026-03-01' }).success).toBe(true);
    expect(listExpensesQuery.safeParse({ limit: '101' }).success).toBe(false);
    expect(listExpensesQuery.parse({}).limit).toBe(20);
    expect(listExpensesQuery.safeParse({ bogus: 'x' }).success).toBe(false);
    expect(listRevenueQuery.safeParse({ channel: 'RETAIL' }).success).toBe(false);
    expect(listRevenueQuery.safeParse({ channel: 'HORECA', paymentMethod: 'NETBANKING' }).success).toBe(true);
    expect(reportQuery.safeParse({ from: '2026-03-01' }).success).toBe(false);
    expect(reportQuery.safeParse({ from: '2026-03-02', to: '2026-03-01' }).success).toBe(false);
  });
});

// ===========================================================================
// 2. Service, against a stateful fake repo
// ===========================================================================
interface AuditCall {
  actionCode: string;
  entityType: string;
  entityId: string | null;
  warehouseId: string | null;
  after: Record<string, unknown>;
}

interface Harness {
  service: ReturnType<typeof createFinanceService>;
  expenses: ExpenseRecord[];
  audits: AuditCall[];
  insertCalls: { count: number; executors: Executor[] };
  tx: Executor;
  setCategories(next: ExpenseCategoryRecord[]): void;
  failAudit(): void;
  /** Make the next insertExpense behave as if a concurrent request with the same key committed first. */
  raceWith(existing: ExpenseRecord): void;
  setRevenue(rows: RevenueDetailRecord[]): void;
  setByChannel(rows: ChannelTotalRecord[]): void;
  setMaxRange(days: number): void;
}

const category = (id: string, name: string, isActive = true): ExpenseCategoryRecord => ({ id, name, isActive });

function makeHarness(): Harness {
  let expenses: ExpenseRecord[] = [];
  let keys = new Map<string, string>();
  let categories: ExpenseCategoryRecord[] = [
    category(CAT_TRANSPORT, 'Transport'),
    category(CAT_RETIRED, 'Retired', false),
  ];
  const warehouses = new Map<string, boolean>([
    [WH_A, true],
    [WH_B, true],
    [WH_INACTIVE, false],
  ]);
  let revenue: RevenueDetailRecord[] = [];
  let byChannel: ChannelTotalRecord[] = [];
  let maxRange = 366;
  let auditShouldFail = false;
  let raceExisting: ExpenseRecord | null = null;
  const audits: AuditCall[] = [];
  const insertCalls = { count: 0, executors: [] as Executor[] };

  const tx: Executor = {
    query: async (sql: string, params?: unknown[]) => {
      if (sql.includes('INSERT INTO audit_log')) {
        if (auditShouldFail) throw new Error('audit insert failed');
        const p = params ?? [];
        audits.push({
          actionCode: String(p[3]),
          entityType: String(p[4]),
          entityId: p[5] === null ? null : String(p[5]),
          warehouseId: p[6] === null ? null : String(p[6]),
          after: JSON.parse(String(p[9])) as Record<string, unknown>,
        });
        return { rows: [{ id: newId() }] } as never;
      }
      throw new Error(`the fake repo should never let the service run SQL itself: ${sql}`);
    },
  };
  const db: Executor = {
    query: async () => {
      throw new Error('the service wrote through the pool instead of the transaction');
    },
  };

  const repo: FinanceRepo = {
    async listActiveCategories() {
      return categories.filter((c) => c.isActive);
    },
    async findCategoryById(_db, id) {
      return categories.find((c) => c.id === id) ?? null;
    },
    async activeWarehouseExists(_db, id) {
      return warehouses.get(id) === true;
    },
    async findExpenseByIdempotencyKey(_db, key) {
      const id = keys.get(key);
      return expenses.find((e) => e.id === id) ?? null;
    },
    async insertExpense(executor, input: NewExpenseInput) {
      insertCalls.count += 1;
      insertCalls.executors.push(executor);
      if (raceExisting !== null) {
        const winner = raceExisting;
        raceExisting = null;
        expenses.push(winner);
        keys.set(input.idempotencyKey, winner.id);
        return null;
      }
      if (keys.has(input.idempotencyKey)) return null;
      const record: ExpenseRecord = {
        id: newId(),
        warehouseId: input.warehouseId,
        categoryId: input.categoryId,
        category: input.category,
        amount: input.amount,
        expenseDate: input.expenseDate,
        paymentMethod: input.paymentMethod,
        vendor: input.vendor,
        description: input.description,
        status: 'RECORDED',
        recordedBy: input.recordedBy,
        createdAt: '2026-03-10T10:00:00.000Z',
        decidedBy: null,
        decidedAt: null,
        decisionReason: null,
      };
      expenses.push(record);
      keys.set(input.idempotencyKey, record.id);
      return record;
    },
    async findExpenseById(_db, scope, id) {
      const row = expenses.find((e) => e.id === id);
      return row !== undefined && warehouseVisible(scope, row.warehouseId) ? row : null;
    },
    async listExpenses(_db, scope, _filters: ExpenseFilters, _limit: number, _cursor?: ExpenseCursor) {
      return { items: expenses.filter((e) => warehouseVisible(scope, e.warehouseId)), next: null };
    },
    async summarizeExpenses(_db, scope): Promise<MoneyCount> {
      const rows = expenses.filter((e) => warehouseVisible(scope, e.warehouseId));
      return { count: rows.length, total: fromPaise(rows.reduce((sum, e) => sum + toPaise(e.amount), 0)) };
    },
    async findRevenueById(_db, scope, id) {
      const row = revenue.find((r) => r.orderId === id);
      return row !== undefined && warehouseVisible(scope, row.warehouseId) ? row : null;
    },
    async listRevenue(_db, scope, _filters: RevenueFilters, _limit: number, _cursor?: RevenueCursor) {
      return { items: revenue.filter((r) => warehouseVisible(scope, r.warehouseId)), next: null };
    },
    async revenueByChannel() {
      return byChannel;
    },
    async getReportMaxRangeDays() {
      return maxRange;
    },
    async revenueReportByDay(): Promise<DayTotalRecord[]> {
      return [];
    },
    async revenueReportByPaymentMethod() {
      return [];
    },
    async expenseReportByDay(): Promise<DayTotalRecord[]> {
      return [];
    },
    async expenseReportByCategory() {
      return [];
    },
    async expenseReportByPaymentMethod() {
      return [];
    },
  };

  // A transaction that is really all-or-nothing for the fake store: a throw restores the snapshot.
  const runTx = async <T>(fn: (executor: Executor) => Promise<T>): Promise<T> => {
    const snapshot = { expenses: [...expenses], keys: new Map(keys), audits: [...audits] };
    try {
      return await fn(tx);
    } catch (error) {
      expenses = snapshot.expenses;
      keys = snapshot.keys;
      audits.length = 0;
      audits.push(...snapshot.audits);
      throw error;
    }
  };

  return {
    service: createFinanceService({ repo, db, runTx }),
    get expenses() {
      return expenses;
    },
    audits,
    insertCalls,
    tx,
    setCategories: (next) => {
      categories = next;
    },
    failAudit: () => {
      auditShouldFail = true;
    },
    raceWith: (existing) => {
      raceExisting = existing;
    },
    setRevenue: (rows) => {
      revenue = rows;
    },
    setByChannel: (rows) => {
      byChannel = rows;
    },
    setMaxRange: (days) => {
      maxRange = days;
    },
  };
}

async function failure(promise: Promise<unknown>): Promise<AppError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof AppError) return error;
    throw error;
  }
  throw new Error('expected the call to reject with an AppError');
}

const body = (overrides: Record<string, unknown> = {}) =>
  createExpenseBody.parse({ ...validBody, vendor: 'Secret Vendor Pvt', description: 'Diesel for the truck', ...overrides });

describe('finance service: expense recording', () => {
  it('BR-62a: a Sub Warehouse Admin records the expense for their own warehouse, as RECORDED, by themselves, with the category name captured', async () => {
    const h = makeHarness();
    const result = await h.service.createExpense(subScope(), KEY, body());

    expect(result.replayed).toBe(false);
    expect(result.expense).toMatchObject({
      warehouseId: WH_A,
      categoryId: CAT_TRANSPORT,
      category: 'Transport',
      amount: '1234.50',
      expenseDate: '2026-03-10',
      paymentMethod: 'CASH',
      status: 'RECORDED',
      recordedBy: SUB_USER,
    });
    expect(h.expenses).toHaveLength(1);
  });

  it('BR-62a: a Sub Warehouse Admin naming a warehouse they are not assigned to gets 404 and nothing is written', async () => {
    const h = makeHarness();
    const error = await failure(h.service.createExpense(subScope(), KEY, body({ warehouseId: WH_B })));
    expect(error.code).toBe('NOT_FOUND');
    expect(error.status).toBe(404);
    expect(h.insertCalls.count).toBe(0);
    expect(h.audits).toHaveLength(0);
  });

  it('BR-62a: a Sub Warehouse Admin may name one of their own assigned warehouses, and otherwise the first one is used', async () => {
    const h = makeHarness();
    const named = await h.service.createExpense(subScope([WH_A, WH_B]), 'k-named', body({ warehouseId: WH_B }));
    expect(named.expense.warehouseId).toBe(WH_B);
    const defaulted = await h.service.createExpense(subScope([WH_A, WH_B]), 'k-default', body());
    expect(defaulted.expense.warehouseId).toBe(WH_A);
  });

  it('BR-62a: a Main Warehouse Admin must name the warehouse (422), and it must be an existing active one (422)', async () => {
    const h = makeHarness();
    const missing = await failure(h.service.createExpense(mainAll(), KEY, body()));
    expect(missing.code).toBe('VALIDATION_FAILED');
    expect(missing.errors).toHaveProperty(['body.warehouseId']);

    const inactive = await failure(h.service.createExpense(mainAll(), KEY, body({ warehouseId: WH_INACTIVE })));
    expect(inactive.code).toBe('VALIDATION_FAILED');
    const unknown = await failure(h.service.createExpense(mainAll(), KEY, body({ warehouseId: newId() })));
    expect(unknown.code).toBe('VALIDATION_FAILED');
    expect(h.insertCalls.count).toBe(0);

    const ok = await h.service.createExpense(mainAll(), KEY, body({ warehouseId: WH_B }));
    expect(ok.expense.warehouseId).toBe(WH_B);
    expect(ok.expense.recordedBy).toBe(MAIN_USER);
  });

  it('BR-62a: a missing or blank Idempotency-Key is 422 and nothing is read or written', async () => {
    const h = makeHarness();
    for (const key of [undefined, '', '   ']) {
      const error = await failure(h.service.createExpense(subScope(), key, body()));
      expect(error.code).toBe('VALIDATION_FAILED');
      expect(error.errors).toHaveProperty(['header.Idempotency-Key']);
    }
    expect(h.insertCalls.count).toBe(0);
    expect(h.audits).toHaveLength(0);
  });

  it('BR-62a: replaying the same key and body returns the original row, replayed, with no second row and no second audit row', async () => {
    const h = makeHarness();
    const first = await h.service.createExpense(subScope(), KEY, body());
    const second = await h.service.createExpense(subScope(), KEY, body());

    expect(second.replayed).toBe(true);
    expect(second.expense.id).toBe(first.expense.id);
    expect(h.expenses).toHaveLength(1);
    expect(h.audits).toHaveLength(1);
    expect(h.insertCalls.count).toBe(1);
  });

  it('BR-62a: a replay still answers with the original after its category has been retired', async () => {
    const h = makeHarness();
    const first = await h.service.createExpense(subScope(), KEY, body());
    h.setCategories([category(CAT_TRANSPORT, 'Transport', false)]);
    const replay = await h.service.createExpense(subScope(), KEY, body());
    expect(replay.replayed).toBe(true);
    expect(replay.expense.id).toBe(first.expense.id);
  });

  it('BR-62a: the same key with a different body, or from a different admin, is 409 IDEMPOTENCY_KEY_REUSED and never returns the other row', async () => {
    const h = makeHarness();
    await h.service.createExpense(subScope(), KEY, body());

    const otherAmount = await failure(h.service.createExpense(subScope(), KEY, body({ amount: '1234.51' })));
    expect(otherAmount.code).toBe('IDEMPOTENCY_KEY_REUSED');
    expect(otherAmount.status).toBe(409);

    const otherText = await failure(h.service.createExpense(subScope(), KEY, body({ vendor: 'Another vendor' })));
    expect(otherText.code).toBe('IDEMPOTENCY_KEY_REUSED');

    const otherActor = await failure(
      h.service.createExpense({ ...subScope(), userId: newId() }, KEY, body()),
    );
    expect(otherActor.code).toBe('IDEMPOTENCY_KEY_REUSED');
    expect(h.expenses).toHaveLength(1);
    expect(h.audits).toHaveLength(1);
  });

  it('BR-62a: when a concurrent request with the same key wins the insert, this one replays the winner and writes no audit row', async () => {
    const h = makeHarness();
    const winner: ExpenseRecord = {
      id: newId(),
      warehouseId: WH_A,
      categoryId: CAT_TRANSPORT,
      category: 'Transport',
      amount: parseMoney('1234.50'),
      expenseDate: '2026-03-10',
      paymentMethod: 'CASH',
      vendor: 'Secret Vendor Pvt',
      description: 'Diesel for the truck',
      status: 'RECORDED',
      recordedBy: SUB_USER,
      createdAt: '2026-03-10T10:00:00.000Z',
        decidedBy: null,
        decidedAt: null,
        decisionReason: null,
    };
    h.raceWith(winner);
    const result = await h.service.createExpense(subScope(), KEY, body());
    expect(result.replayed).toBe(true);
    expect(result.expense.id).toBe(winner.id);
    expect(h.audits).toHaveLength(0);
  });

  it('BR-62a: an unknown category and a retired (inactive) category are both 422 on body.categoryId', async () => {
    const h = makeHarness();
    for (const categoryId of [newId(), CAT_RETIRED]) {
      const error = await failure(h.service.createExpense(subScope(), `k-${categoryId}`, body({ categoryId })));
      expect(error.code).toBe('VALIDATION_FAILED');
      expect(error.errors).toHaveProperty(['body.categoryId']);
    }
    expect(h.insertCalls.count).toBe(0);
  });

  it('BR-62a: writes exactly one finance.expense.log audit row whose image is masked (no vendor or description text)', async () => {
    const h = makeHarness();
    const { expense } = await h.service.createExpense(subScope(), KEY, body());

    expect(h.audits).toHaveLength(1);
    const audit = h.audits[0]!;
    expect(audit.actionCode).toBe('finance.expense.log');
    expect(audit.entityType).toBe('expense');
    expect(audit.entityId).toBe(expense.id);
    expect(audit.warehouseId).toBe(WH_A);
    expect(Object.keys(audit.after).sort()).toEqual(
      ['amount', 'category', 'expenseDate', 'id', 'paymentMethod', 'status', 'warehouseId'].sort(),
    );
    expect(audit.after).toMatchObject({ category: 'Transport', amount: '1234.50', status: 'RECORDED', warehouseId: WH_A });
    const serialised = JSON.stringify(audit.after);
    expect(serialised).not.toContain('Secret Vendor Pvt');
    expect(serialised).not.toContain('Diesel');
  });

  it('BR-62a: the insert and the audit row go through the SAME transaction executor, and a failing audit rolls the expense back', async () => {
    const h = makeHarness();
    await h.service.createExpense(subScope(), KEY, body());
    expect(h.insertCalls.executors).toEqual([h.tx]);

    const failing = makeHarness();
    failing.failAudit();
    await expect(failing.service.createExpense(subScope(), KEY, body())).rejects.toThrow('audit insert failed');
    expect(failing.expenses).toHaveLength(0);
    expect(failing.audits).toHaveLength(0);
  });
});

describe('finance service: reads', () => {
  const sampleExpense = (warehouseId: string): ExpenseRecord => ({
    id: newId(),
    warehouseId,
    categoryId: CAT_TRANSPORT,
    category: 'Transport',
    amount: parseMoney('10.00'),
    expenseDate: '2026-03-10',
    paymentMethod: 'UPI',
    vendor: null,
    description: null,
    status: 'RECORDED',
    recordedBy: MAIN_USER,
    createdAt: '2026-03-10T10:00:00.000Z',
        decidedBy: null,
        decidedAt: null,
        decisionReason: null,
  });

  it('BR-63a: an expense in another warehouse, and an id that does not exist, are both 404 for a Sub Warehouse Admin; Main sees it', async () => {
    const h = makeHarness();
    const theirs = sampleExpense(WH_B);
    h.expenses.push(theirs);

    const crossScope = await failure(h.service.getExpense(subScope(), theirs.id));
    expect(crossScope.code).toBe('NOT_FOUND');
    const absent = await failure(h.service.getExpense(subScope(), newId()));
    expect(absent.code).toBe('NOT_FOUND');
    expect((await h.service.getExpense(mainAll(), theirs.id)).id).toBe(theirs.id);
  });

  it('BR-63a: a revenue order in another warehouse is 404 for a Sub Warehouse Admin and visible to a Main admin with an own grant and no warehouse', async () => {
    const h = makeHarness();
    const order: RevenueDetailRecord = {
      orderId: newId(),
      channel: 'ONLINE',
      paymentMethod: 'UPI',
      paymentStatus: 'PAID',
      status: 'DELIVERED',
      totalAmount: parseMoney('100.00'),
      gstAmount: parseMoney('5.00'),
      placedAt: '2026-03-10T08:00:00.000Z',
      completedAt: '2026-03-10T10:00:00.000Z',
      warehouseId: WH_B,
      invoiceNumber: null,
      invoiceStatus: null,
    };
    h.setRevenue([order]);
    const error = await failure(h.service.getRevenue(subScope([WH_A], 'finance.sales_income.view'), order.orderId));
    expect(error.code).toBe('NOT_FOUND');
    expect((await h.service.getRevenue(mainOwn(), order.orderId)).orderId).toBe(order.orderId);
  });

  it('BR-63a: the revenue summary adds exact paise (0.10 + 0.20 = 0.30) across channels, never floats', async () => {
    const h = makeHarness();
    h.setByChannel([
      { channel: 'ONLINE', count: 1, total: parseMoney('0.10') },
      { channel: 'MARKET', count: 2, total: parseMoney('0.20') },
    ]);
    const result = await h.service.listRevenue(mainOwn(), { limit: 20 });
    expect(result.summary).toEqual({
      count: 3,
      total: '0.30',
      byChannel: [
        { channel: 'ONLINE', count: 1, total: '0.10' },
        { channel: 'MARKET', count: 2, total: '0.20' },
      ],
    });
    expect(result.page).toEqual({ nextCursor: null, hasMore: false });
  });

  it('BR-63a: a report span is capped by system_config (366 days accepted, 367 is 422 on query.to) and the cap is read, not hard-coded', async () => {
    const h = makeHarness();
    const ok = await h.service.revenueReport(mainOwn(), { from: '2026-01-01', to: '2027-01-02' });
    expect(ok.from).toBe('2026-01-01');
    const tooWide = await failure(h.service.revenueReport(mainOwn(), { from: '2026-01-01', to: '2027-01-03' }));
    expect(tooWide.code).toBe('VALIDATION_FAILED');
    expect(tooWide.errors).toHaveProperty(['query.to']);

    h.setMaxRange(10);
    const narrow = await failure(h.service.expenseReport(mainAll(), { from: '2026-03-01', to: '2026-03-12' }));
    expect(narrow.errors).toHaveProperty(['query.to']);
    await expect(h.service.expenseReport(mainAll(), { from: '2026-03-01', to: '2026-03-11' })).resolves.toBeDefined();
  });

  it('BR-63a: a cursor that this endpoint did not issue is 422, not a 500', async () => {
    const h = makeHarness();
    for (const cursor of ['%%%', Buffer.from('[1]').toString('base64url'), Buffer.from('["x","y"]').toString('base64url')]) {
      const error = await failure(h.service.listExpenses(mainAll(), { limit: 20, cursor }));
      expect(error.code).toBe('VALIDATION_FAILED');
    }
  });
});

// ===========================================================================
// 3. Real database
// ===========================================================================
class RollbackFixture extends Error {}

describeIfDatabase('Finance (PostgreSQL)', () => {
  let ready = false;

  beforeAll(async () => {
    ready = await databaseReady('expense_categories');
  });

  // The pool is NOT closed here: the HTTP describe below shares it (a closed pool made its
  // `databaseReady` probe fail and every test in it return vacuously). Its afterAll closes the pool.

  /** Runs `fn` in a real transaction and always rolls it back, so no fixture rows survive. */
  async function inRolledBackTx(fn: (tx: Executor) => Promise<void>): Promise<void> {
    const { withTransaction } = await import('../../db/pool.js');
    await withTransaction(async (tx) => {
      await fn(tx);
      throw new RollbackFixture();
    }).catch((error: unknown) => {
      if (!(error instanceof RollbackFixture)) throw error;
    });
  }

  async function service(tx: Executor) {
    const { financeRepo } = await import('./finance.repo.js');
    return createFinanceService({ repo: financeRepo, db: tx, runTx: async (fn) => fn(tx) });
  }

  interface Fixture {
    userId: string;
    ooty: string;
    coonoor: string;
    kotagiri: string;
    gudalur: string;
    transport: string;
    other: string;
  }

  async function seed(tx: Executor): Promise<Fixture> {
    const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const user = await tx.query<{ id: string }>(
      `INSERT INTO users (mobile, full_name, user_type, status) VALUES ($1, 'CI finance admin', 'ADMIN', 'ACTIVE') RETURNING id`,
      [`+9198${stamp.slice(-8)}`],
    );
    const warehouses = await tx.query<{ id: string; code: string }>(
      `SELECT id, code FROM warehouses WHERE code IN ('WH-OOTY', 'WH-COON', 'WH-KOTA', 'WH-GUDA')`,
    );
    const byCode = new Map(warehouses.rows.map((w) => [w.code, w.id]));
    const categories = await tx.query<{ id: string; name: string }>(`SELECT id, name FROM expense_categories`);
    const catByName = new Map(categories.rows.map((c) => [c.name, c.id]));
    return {
      userId: user.rows[0]!.id,
      ooty: byCode.get('WH-OOTY')!,
      coonoor: byCode.get('WH-COON')!,
      kotagiri: byCode.get('WH-KOTA')!,
      gudalur: byCode.get('WH-GUDA')!,
      transport: catByName.get('Transport')!,
      other: catByName.get('Other')!,
    };
  }

  const subOf = (f: Fixture, warehouseId: string, permission = 'finance.expense.log'): ResolvedScope =>
    aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds: [warehouseId], permission, userId: f.userId });
  const mainOf = (f: Fixture, permission = 'finance.expense.log', level: ResolvedScope['level'] = ScopeLevel.ALL): ResolvedScope =>
    aScope({ level, roleCode: RoleCode.MAIN_WH_ADMIN, warehouseIds: [], permission, userId: f.userId });

  /** Direct insert of an expense row (the API cannot create legacy or back-dated rows). */
  async function insertExpenseRow(
    tx: Executor,
    f: Fixture,
    o: {
      warehouseId: string | null;
      amount: string;
      date?: string;
      createdAt?: string;
      categoryId?: string | null;
      categoryName?: string;
      paymentMethod?: string | null;
      status?: string;
      deleted?: boolean;
    },
  ): Promise<string> {
    const result = await tx.query<{ id: string }>(
      `INSERT INTO expenses (warehouse_id, category, category_id, amount, expense_date, payment_method, status, recorded_by, created_at, deleted_at)
       VALUES ($1, $2, $3, $4, $5::date, $6, $7, $8, COALESCE($9::timestamptz, now()), CASE WHEN $10::boolean THEN now() END)
       RETURNING id`,
      [
        o.warehouseId,
        o.categoryName ?? 'Transport',
        o.categoryId === undefined ? f.transport : o.categoryId,
        o.amount,
        o.date ?? '2031-03-10',
        o.paymentMethod === undefined ? 'CASH' : o.paymentMethod,
        o.status ?? 'RECORDED',
        f.userId,
        o.createdAt ?? null,
        o.deleted ?? false,
      ],
    );
    return result.rows[0]!.id;
  }

  let customerSeq = 0;
  async function seedCustomer(tx: Executor): Promise<string> {
    customerSeq += 1;
    const stamp = `${Date.now()}${customerSeq}${Math.floor(Math.random() * 1000)}`;
    const user = await tx.query<{ id: string }>(
      `INSERT INTO users (mobile, full_name, user_type, status) VALUES ($1, 'Private Customer Name', 'CUSTOMER', 'ACTIVE') RETURNING id`,
      [`+9197${stamp.slice(-8)}`],
    );
    const customer = await tx.query<{ id: string }>(
      `INSERT INTO customers (user_id, customer_code) VALUES ($1, $2) RETURNING id`,
      [user.rows[0]!.id, `CUST-CI-${stamp}`],
    );
    return customer.rows[0]!.id;
  }

  interface OrderSpec {
    warehouseId: string;
    customerId: string;
    total: string;
    gst?: string;
    channel?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    status?: string;
    completedAt: string | null;
  }
  async function insertOrder(tx: Executor, o: OrderSpec): Promise<string> {
    const result = await tx.query<{ id: string }>(
      `INSERT INTO orders (order_number, customer_id, warehouse_id, channel, total_amount, gst_amount,
                           payment_method, payment_status, status, placed_at, completed_at, cancellation_reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7::payment_method, $8, $9::order_status,
               COALESCE($10::timestamptz, now()) - interval '1 hour', $10::timestamptz,
               CASE WHEN $9 = 'CANCELLED' THEN 'CI fixture' END)
       RETURNING id`,
      [
        `CI-${newId()}`,
        o.customerId,
        o.warehouseId,
        o.channel ?? 'ONLINE',
        o.total,
        o.gst ?? '0.00',
        o.paymentMethod ?? 'UPI',
        o.paymentStatus ?? 'PAID',
        o.status ?? 'DELIVERED',
        o.completedAt,
      ],
    );
    return result.rows[0]!.id;
  }

  const created = (service_: ReturnType<typeof createFinanceService>, scope: ResolvedScope, key: string, raw: Record<string, unknown>) =>
    service_.createExpense(scope, key, createExpenseBody.parse(raw));

  // ----- migration facts ---------------------------------------------------
  it('BR-62a (PostgreSQL): migration 0047 seeds the seven prototype categories, the unique idempotency index and the report-range config key', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const names = await tx.query<{ name: string }>(`SELECT name FROM expense_categories WHERE is_active ORDER BY name`);
      expect(names.rows.map((r) => r.name)).toEqual(
        ['Loading', 'Maintenance', 'Other', 'Transport', 'Unloading', 'Utilities', 'Warehouse Operations'],
      );
      const index = await tx.query<{ indexdef: string }>(
        `SELECT indexdef FROM pg_indexes WHERE indexname = 'uq_expenses_idempotency_key'`,
      );
      expect(index.rows[0]?.indexdef).toContain('UNIQUE');
      const config = await tx.query<{ value: unknown }>(`SELECT value FROM system_config WHERE key = 'finance_report_max_range_days'`);
      expect(config.rows[0]?.value).toBe(366);
      // The categories are unique case-insensitively.
      await expect(
        tx.query(`INSERT INTO expense_categories (name) VALUES ('transport')`),
      ).rejects.toThrow();
    });
  });

  // ----- expense recording -------------------------------------------------
  it('BR-62a (PostgreSQL): a Sub admin records an expense; the row, its exact amount and ONE masked audit row exist in the same transaction', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const svc = await service(tx);
      const { expense, replayed } = await created(svc, subOf(f, f.coonoor), 'ci-key-1', {
        categoryId: f.transport,
        expenseDate: '2031-03-10',
        amount: '1234.50',
        paymentMethod: 'UPI',
        vendor: 'Secret Vendor Pvt',
        description: 'Diesel for the truck',
      });
      expect(replayed).toBe(false);
      expect(expense).toMatchObject({
        warehouseId: f.coonoor,
        categoryId: f.transport,
        category: 'Transport',
        amount: '1234.50',
        expenseDate: '2031-03-10',
        paymentMethod: 'UPI',
        status: 'RECORDED',
        recordedBy: f.userId,
        vendor: 'Secret Vendor Pvt',
      });

      const row = await tx.query<{ idempotency_key: string; amount: string; approved_by: string | null }>(
        `SELECT idempotency_key, amount::text, approved_by FROM expenses WHERE id = $1`,
        [expense.id],
      );
      expect(row.rows[0]).toEqual({ idempotency_key: 'ci-key-1', amount: '1234.50', approved_by: null });

      const audits = await tx.query<{ action_code: string; warehouse_id: string; actor_id: string; after: Record<string, unknown> }>(
        `SELECT action_code, warehouse_id, actor_id, after FROM audit_log WHERE entity_type = 'expense' AND entity_id = $1`,
        [expense.id],
      );
      expect(audits.rows).toHaveLength(1);
      expect(audits.rows[0]).toMatchObject({ action_code: 'finance.expense.log', warehouse_id: f.coonoor, actor_id: f.userId });
      expect(Object.keys(audits.rows[0]!.after).sort()).toEqual(
        ['amount', 'category', 'expenseDate', 'id', 'paymentMethod', 'status', 'warehouseId'].sort(),
      );
      expect(JSON.stringify(audits.rows[0]!.after)).not.toContain('Secret Vendor');
    });
  });

  it('BR-62a (PostgreSQL): replaying the key returns the original and writes no second expense or audit row; a different body is 409; the raw insert reports the lost race as null', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const svc = await service(tx);
      const raw = { categoryId: f.transport, expenseDate: '2031-03-10', amount: '10.00', paymentMethod: 'CASH' };
      const first = await created(svc, subOf(f, f.ooty), 'ci-key-2', raw);
      const replay = await created(svc, subOf(f, f.ooty), 'ci-key-2', raw);
      expect(replay.replayed).toBe(true);
      expect(replay.expense.id).toBe(first.expense.id);

      const counts = await tx.query<{ expenses: string; audits: string }>(
        `SELECT (SELECT count(*) FROM expenses WHERE idempotency_key = 'ci-key-2')::text AS expenses,
                (SELECT count(*) FROM audit_log WHERE entity_type = 'expense' AND entity_id = $1)::text AS audits`,
        [first.expense.id],
      );
      expect(counts.rows[0]).toEqual({ expenses: '1', audits: '1' });

      const conflict = await failure(created(svc, subOf(f, f.ooty), 'ci-key-2', { ...raw, amount: '10.01' }));
      expect(conflict.code).toBe('IDEMPOTENCY_KEY_REUSED');

      const { financeRepo } = await import('./finance.repo.js');
      const lost = await financeRepo.insertExpense(tx, {
        warehouseId: f.ooty,
        categoryId: f.transport,
        category: 'Transport',
        amount: parseMoney('10.00'),
        expenseDate: '2031-03-10',
        paymentMethod: 'CASH',
        vendor: null,
        description: null,
        recordedBy: f.userId,
        idempotencyKey: 'ci-key-2',
      });
      expect(lost).toBeNull();
    });
  });

  it('BR-62a (PostgreSQL): the numeric(12,2) upper bound is stored exactly, and an unknown or retired category is 422 before any row is written', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const svc = await service(tx);
      const big = await created(svc, subOf(f, f.ooty), 'ci-big', {
        categoryId: f.other, expenseDate: '2031-03-10', amount: '9999999999.99', paymentMethod: 'BANK',
      });
      expect(big.expense.amount).toBe('9999999999.99');

      const unknown = await failure(created(svc, subOf(f, f.ooty), 'ci-unknown', {
        categoryId: newId(), expenseDate: '2031-03-10', amount: '5.00', paymentMethod: 'CASH',
      }));
      expect(unknown.code).toBe('VALIDATION_FAILED');

      await tx.query(`UPDATE expense_categories SET is_active = false WHERE id = $1`, [f.other]);
      const retired = await failure(created(svc, subOf(f, f.ooty), 'ci-retired', {
        categoryId: f.other, expenseDate: '2031-03-10', amount: '5.00', paymentMethod: 'CASH',
      }));
      expect(retired.errors).toHaveProperty(['body.categoryId']);
      const left = await tx.query<{ n: string }>(`SELECT count(*)::text AS n FROM expenses WHERE idempotency_key IN ('ci-unknown', 'ci-retired')`);
      expect(left.rows[0]?.n).toBe('0');

      const list = await (await import('./finance.repo.js')).financeRepo.listActiveCategories(tx);
      expect(list.map((c) => c.id)).not.toContain(f.other);
    });
  });

  it('BR-62a (PostgreSQL): a Main admin records for a named warehouse and cannot omit it or name an inactive one', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const svc = await service(tx);
      const raw = { categoryId: f.transport, expenseDate: '2031-03-10', amount: '7.00', paymentMethod: 'CASH' };
      const ok = await created(svc, mainOf(f), 'ci-main', { ...raw, warehouseId: f.kotagiri });
      expect(ok.expense.warehouseId).toBe(f.kotagiri);
      expect((await failure(created(svc, mainOf(f), 'ci-main-2', raw))).code).toBe('VALIDATION_FAILED');
      await tx.query(`UPDATE warehouses SET is_active = false WHERE id = $1`, [f.gudalur]);
      expect((await failure(created(svc, mainOf(f), 'ci-main-3', { ...raw, warehouseId: f.gudalur }))).code).toBe('VALIDATION_FAILED');
    });
  });

  // ----- expense reads -----------------------------------------------------
  it('BR-63a (PostgreSQL): a Sub admin sees only their warehouse and gets 404 for another warehouse\'s id; Main sees all four; deleted rows are hidden', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const svc = await service(tx);
      const ids = {
        ooty: await insertExpenseRow(tx, f, { warehouseId: f.ooty, amount: '1.00' }),
        coonoor: await insertExpenseRow(tx, f, { warehouseId: f.coonoor, amount: '2.00' }),
        kotagiri: await insertExpenseRow(tx, f, { warehouseId: f.kotagiri, amount: '3.00' }),
        gudalur: await insertExpenseRow(tx, f, { warehouseId: f.gudalur, amount: '4.00' }),
      };
      const deleted = await insertExpenseRow(tx, f, { warehouseId: f.coonoor, amount: '99.00', deleted: true });
      const noWarehouse = await insertExpenseRow(tx, f, { warehouseId: null, amount: '8.00' });
      const window = { from: '2031-03-01', to: '2031-03-31', limit: 100 };

      const sub = await svc.listExpenses(subOf(f, f.coonoor), window);
      expect(sub.items.map((e) => e.id)).toEqual([ids.coonoor]);
      expect(sub.summary).toEqual({ count: 1, total: '2.00' });

      const main = await svc.listExpenses(mainOf(f), window);
      expect(main.items.map((e) => e.id).sort()).toEqual([...Object.values(ids), noWarehouse].sort());
      expect(main.summary).toEqual({ count: 5, total: '18.00' });
      expect(main.items.map((e) => e.id)).not.toContain(deleted);

      const cross = await failure(svc.getExpense(subOf(f, f.coonoor), ids.kotagiri));
      expect(cross.code).toBe('NOT_FOUND');
      expect((await failure(svc.getExpense(subOf(f, f.coonoor), noWarehouse))).code).toBe('NOT_FOUND');
      expect((await failure(svc.getExpense(mainOf(f), deleted))).code).toBe('NOT_FOUND');
      expect((await svc.getExpense(mainOf(f), ids.gudalur)).warehouseId).toBe(f.gudalur);

      // A Sub admin filtering by another warehouse gets an empty set, never that warehouse's rows.
      const crossFilter = await svc.listExpenses(subOf(f, f.coonoor), { ...window, warehouseId: f.kotagiri });
      expect(crossFilter.items).toEqual([]);
      expect(crossFilter.summary).toEqual({ count: 0, total: '0.00' });
      const mainFilter = await svc.listExpenses(mainOf(f), { ...window, warehouseId: f.kotagiri });
      expect(mainFilter.items.map((e) => e.id)).toEqual([ids.kotagiri]);
    });
  });

  it('BR-63a (PostgreSQL): the expense summary is exact (0.10 + 0.20 = 0.30) and every filter narrows both items and summary', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const svc = await service(tx);
      await insertExpenseRow(tx, f, { warehouseId: f.ooty, amount: '0.10', date: '2031-03-01', paymentMethod: 'CASH' });
      await insertExpenseRow(tx, f, { warehouseId: f.ooty, amount: '0.20', date: '2031-03-02', paymentMethod: 'UPI', categoryId: f.other, categoryName: 'Other' });
      await insertExpenseRow(tx, f, { warehouseId: f.ooty, amount: '5.00', date: '2031-03-03', paymentMethod: null, categoryId: null, categoryName: 'Legacy text' });
      await insertExpenseRow(tx, f, { warehouseId: f.ooty, amount: '700.00', date: '2031-04-01', status: 'REJECTED', paymentMethod: 'BANK' });
      const scope = subOf(f, f.ooty);
      const base = { limit: 100 };

      const march = await svc.listExpenses(scope, { ...base, from: '2031-03-01', to: '2031-03-02' });
      expect(march.summary).toEqual({ count: 2, total: '0.30' });
      expect((await svc.listExpenses(scope, { ...base, from: '2031-03-01', to: '2031-04-30', categoryId: f.other })).summary).toEqual({ count: 1, total: '0.20' });
      expect((await svc.listExpenses(scope, { ...base, from: '2031-03-01', to: '2031-04-30', paymentMethod: 'CASH' })).summary).toEqual({ count: 1, total: '0.10' });
      expect((await svc.listExpenses(scope, { ...base, from: '2031-03-01', to: '2031-04-30', status: 'REJECTED' })).summary).toEqual({ count: 1, total: '700.00' });

      // A pre-0043 row reads back with null category_id and payment_method, never an error.
      const legacy = (await svc.listExpenses(scope, { ...base, from: '2031-03-03', to: '2031-03-03' })).items;
      expect(legacy).toHaveLength(1);
      expect(legacy[0]).toMatchObject({ categoryId: null, paymentMethod: null, category: 'Legacy text', amount: '5.00' });
    });
  });

  it('BR-63a (PostgreSQL): cursor pagination returns every row exactly once: rows sharing created_at, and rows that differ by one microsecond', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const svc = await service(tx);
      // Five rows share one transaction timestamp (created_at ties); six more differ by 1 microsecond.
      const expected: string[] = [];
      for (let i = 0; i < 5; i += 1) expected.push(await insertExpenseRow(tx, f, { warehouseId: f.ooty, amount: '1.00' }));
      for (let i = 0; i < 6; i += 1) {
        expected.push(await insertExpenseRow(tx, f, {
          warehouseId: f.ooty, amount: '2.00', createdAt: `2031-03-10T10:00:00.12345${i}Z`,
        }));
      }
      const seen: string[] = [];
      let cursor: string | undefined;
      let pages = 0;
      do {
        const page = await svc.listExpenses(mainOf(f), {
          from: '2031-03-10', to: '2031-03-10', limit: 2, ...(cursor === undefined ? {} : { cursor }),
        });
        expect(page.summary.count).toBe(11);
        seen.push(...page.items.map((e) => e.id));
        cursor = page.page.nextCursor ?? undefined;
        pages += 1;
        expect(pages).toBeLessThan(20);
      } while (cursor !== undefined);

      expect(seen).toHaveLength(11);
      expect(new Set(seen).size).toBe(11);
      expect([...seen].sort()).toEqual([...expected].sort());
      expect(pages).toBe(6);
    });
  });

  it('BR-63a (PostgreSQL): the category list holds only active categories, as {id, name}', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const svc = await service(tx);
      await tx.query(`UPDATE expense_categories SET is_active = false WHERE id = $1`, [f.other]);
      const { items } = await svc.listExpenseCategories();
      expect(items).toHaveLength(6);
      expect(items.map((c) => c.name)).not.toContain('Other');
      expect(Object.keys(items[0]!).sort()).toEqual(['id', 'name']);
    });
  });

  // ----- revenue -----------------------------------------------------------
  it('BR-63a (PostgreSQL): revenue is PAID orders in a completed status (DELIVERED or PICKED_UP) with a completed_at; nothing else counts', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const svc = await service(tx);
      const customerId = await seedCustomer(tx);
      const at = '2031-03-10T06:00:00Z';
      const counted = [
        await insertOrder(tx, { warehouseId: f.ooty, customerId, total: '100.10', gst: '5.00', status: 'DELIVERED', completedAt: at }),
        await insertOrder(tx, { warehouseId: f.ooty, customerId, total: '200.20', status: 'PICKED_UP', completedAt: at }),
      ];
      const notCounted = [
        await insertOrder(tx, { warehouseId: f.ooty, customerId, total: '1.00', status: 'CONFIRMED', completedAt: null }),
        await insertOrder(tx, { warehouseId: f.ooty, customerId, total: '1.00', status: 'PENDING_PAYMENT', paymentStatus: 'PENDING', completedAt: null }),
        await insertOrder(tx, { warehouseId: f.ooty, customerId, total: '1.00', status: 'DELIVERED', paymentStatus: 'PENDING', completedAt: at }),
        await insertOrder(tx, { warehouseId: f.ooty, customerId, total: '1.00', status: 'DELIVERED', paymentStatus: 'REFUNDED', completedAt: at }),
        await insertOrder(tx, { warehouseId: f.ooty, customerId, total: '1.00', status: 'RETURNED', completedAt: at }),
        await insertOrder(tx, { warehouseId: f.ooty, customerId, total: '1.00', status: 'DELIVERED', completedAt: null }),
        await insertOrder(tx, { warehouseId: f.ooty, customerId, total: '1.00', status: 'CANCELLED', paymentStatus: 'FAILED', completedAt: null }),
      ];
      const result = await svc.listRevenue(mainOf(f, 'finance.sales_income.view', ScopeLevel.OWN), {
        from: '2031-03-10', to: '2031-03-10', limit: 100,
      });
      expect(result.items.map((r) => r.orderId).sort()).toEqual([...counted].sort());
      for (const id of notCounted) expect(result.items.map((r) => r.orderId)).not.toContain(id);
      expect(result.summary).toEqual({
        count: 2,
        total: '300.30',
        byChannel: [{ channel: 'ONLINE', count: 2, total: '300.30' }],
      });
    });
  });

  it('BR-63a (PostgreSQL): Sub sees only own-warehouse revenue and gets 404 for another warehouse\'s order; Main (own, no warehouse) sees all four; items carry no customer data', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const svc = await service(tx);
      const customerId = await seedCustomer(tx);
      const at = '2031-03-10T06:00:00Z';
      const orders: Record<string, string> = {};
      for (const [name, wh] of [['ooty', f.ooty], ['coonoor', f.coonoor], ['kotagiri', f.kotagiri], ['gudalur', f.gudalur]] as const) {
        orders[name] = await insertOrder(tx, { warehouseId: wh, customerId, total: '10.00', completedAt: at });
      }
      const window = { from: '2031-03-10', to: '2031-03-10', limit: 100 };

      const sub = await svc.listRevenue(subOf(f, f.coonoor, 'finance.sales_income.view'), window);
      expect(sub.items.map((r) => r.orderId)).toEqual([orders['coonoor']]);
      expect(sub.summary.count).toBe(1);

      const main = await svc.listRevenue(mainOf(f, 'finance.sales_income.view', ScopeLevel.OWN), window);
      expect(main.items.map((r) => r.orderId).sort()).toEqual(Object.values(orders).sort());
      expect(main.summary.total).toBe('40.00');

      const cross = await failure(svc.getRevenue(subOf(f, f.coonoor, 'finance.sales_income.view'), orders['kotagiri']!));
      expect(cross.code).toBe('NOT_FOUND');
      expect((await failure(svc.getRevenue(mainOf(f, 'finance.sales_income.view', ScopeLevel.OWN), newId()))).code).toBe('NOT_FOUND');

      expect(Object.keys(main.items[0]!).sort()).toEqual(
        ['channel', 'completedAt', 'gstAmount', 'orderId', 'paymentMethod', 'paymentStatus', 'placedAt', 'status', 'totalAmount', 'warehouseId'],
      );
      expect(JSON.stringify(main)).not.toContain('Private Customer Name');
    });
  });

  it('BR-63a (PostgreSQL): the revenue summary is exact (0.10 + 0.20), byChannel lists only channels that have rows, and channel / paymentMethod filters apply', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const svc = await service(tx);
      const customerId = await seedCustomer(tx);
      const at = '2031-03-10T06:00:00Z';
      await insertOrder(tx, { warehouseId: f.ooty, customerId, total: '0.10', channel: 'MARKET', paymentMethod: 'CASH', completedAt: at });
      await insertOrder(tx, { warehouseId: f.ooty, customerId, total: '0.20', channel: 'HORECA', paymentMethod: 'NETBANKING', completedAt: at });
      const scope = mainOf(f, 'finance.sales_income.view', ScopeLevel.OWN);
      const window = { from: '2031-03-10', to: '2031-03-10', limit: 100 };

      const all = await svc.listRevenue(scope, window);
      expect(all.summary).toEqual({
        count: 2,
        total: '0.30',
        byChannel: [
          { channel: 'HORECA', count: 1, total: '0.20' },
          { channel: 'MARKET', count: 1, total: '0.10' },
        ],
      });
      const market = await svc.listRevenue(scope, { ...window, channel: 'MARKET' });
      expect(market.items).toHaveLength(1);
      expect(market.summary.total).toBe('0.10');
      const bank = await svc.listRevenue(scope, { ...window, paymentMethod: 'NETBANKING' });
      expect(bank.summary).toEqual({ count: 1, total: '0.20', byChannel: [{ channel: 'HORECA', count: 1, total: '0.20' }] });
    });
  });

  it('BR-63a (PostgreSQL): from/to bound completed_at by the Asia/Kolkata day, to the second', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const svc = await service(tx);
      const customerId = await seedCustomer(tx);
      // 18:29:59Z is 23:59:59 IST on 1 March; 18:30:00Z is 00:00:00 IST on 2 March.
      const lastSecond = await insertOrder(tx, { warehouseId: f.ooty, customerId, total: '1.00', completedAt: '2031-03-01T18:29:59Z' });
      const firstSecond = await insertOrder(tx, { warehouseId: f.ooty, customerId, total: '2.00', completedAt: '2031-03-01T18:30:00Z' });
      const scope = mainOf(f, 'finance.sales_income.view', ScopeLevel.OWN);

      const first = await svc.listRevenue(scope, { from: '2031-03-01', to: '2031-03-01', limit: 100 });
      expect(first.items.map((r) => r.orderId)).toEqual([lastSecond]);
      const second = await svc.listRevenue(scope, { from: '2031-03-02', to: '2031-03-02', limit: 100 });
      expect(second.items.map((r) => r.orderId)).toEqual([firstSecond]);
      const both = await svc.listRevenue(scope, { from: '2031-03-01', to: '2031-03-02', limit: 100 });
      expect(both.summary.count).toBe(2);
    });
  });

  it('BR-63a (PostgreSQL): revenue cursor pagination returns each order exactly once, including orders completed one microsecond apart', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const svc = await service(tx);
      const customerId = await seedCustomer(tx);
      const expected: string[] = [];
      for (let i = 0; i < 4; i += 1) {
        expected.push(await insertOrder(tx, { warehouseId: f.ooty, customerId, total: '1.00', completedAt: '2031-03-10T06:00:00.000000Z' }));
      }
      for (let i = 0; i < 4; i += 1) {
        expected.push(await insertOrder(tx, { warehouseId: f.ooty, customerId, total: '1.00', completedAt: `2031-03-10T06:00:00.00000${i + 1}Z` }));
      }
      const seen: string[] = [];
      let cursor: string | undefined;
      let pages = 0;
      do {
        const page = await svc.listRevenue(mainOf(f, 'finance.sales_income.view', ScopeLevel.OWN), {
          from: '2031-03-10', to: '2031-03-10', limit: 3, ...(cursor === undefined ? {} : { cursor }),
        });
        seen.push(...page.items.map((r) => r.orderId));
        cursor = page.page.nextCursor ?? undefined;
        pages += 1;
        expect(pages).toBeLessThan(20);
      } while (cursor !== undefined);
      expect(seen).toHaveLength(8);
      expect(new Set(seen).size).toBe(8);
      expect([...seen].sort()).toEqual([...expected].sort());
    });
  });

  it('BR-63a (PostgreSQL): revenue detail adds the invoice number and status when an invoice row exists, null otherwise, and never a PDF key', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const svc = await service(tx);
      const customerId = await seedCustomer(tx);
      const at = '2031-03-10T06:00:00Z';
      const withInvoice = await insertOrder(tx, { warehouseId: f.ooty, customerId, total: '10.00', completedAt: at });
      const without = await insertOrder(tx, { warehouseId: f.ooty, customerId, total: '10.00', completedAt: at });
      await tx.query(
        `INSERT INTO invoices (invoice_number, invoice_type, order_id, fiscal_year, status, pdf_key)
         VALUES ($1, 'SALE_RETAIL', $2, '2030-31', 'ISSUED', 'secret/pdf/key.pdf')`,
        [`INV-CI-${newId()}`, withInvoice],
      );
      const scope = mainOf(f, 'finance.sales_income.view', ScopeLevel.OWN);

      const a = await svc.getRevenue(scope, withInvoice);
      expect(a.invoiceNumber).toMatch(/^INV-CI-/);
      expect(a.invoiceStatus).toBe('ISSUED');
      expect(JSON.stringify(a)).not.toContain('pdf');
      const b = await svc.getRevenue(scope, without);
      expect(b).toMatchObject({ invoiceNumber: null, invoiceStatus: null, totalAmount: '10.00' });
    });
  });

  // ----- reports -----------------------------------------------------------
  it('BR-63a (PostgreSQL): the revenue report groups by Asia/Kolkata day, channel and payment method, scoped to the caller\'s warehouse, with an exact summary', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const svc = await service(tx);
      const customerId = await seedCustomer(tx);
      // 20:00Z on 1 March is 01:30 IST on 2 March.
      await insertOrder(tx, { warehouseId: f.coonoor, customerId, total: '0.10', channel: 'ONLINE', paymentMethod: 'UPI', completedAt: '2031-03-01T20:00:00Z' });
      await insertOrder(tx, { warehouseId: f.coonoor, customerId, total: '0.20', channel: 'MARKET', paymentMethod: 'CASH', completedAt: '2031-03-02T06:00:00Z' });
      await insertOrder(tx, { warehouseId: f.coonoor, customerId, total: '3.00', channel: 'ONLINE', paymentMethod: 'UPI', completedAt: '2031-03-04T06:00:00Z' });
      await insertOrder(tx, { warehouseId: f.kotagiri, customerId, total: '500.00', channel: 'B2B', paymentMethod: 'NETBANKING', completedAt: '2031-03-02T06:00:00Z' });

      const range = { from: '2031-03-01', to: '2031-03-05' };
      const sub = await svc.revenueReport(subOf(f, f.coonoor, 'finance.sales_income.view'), range);
      expect(sub).toEqual({
        from: '2031-03-01',
        to: '2031-03-05',
        summary: { count: 3, total: '3.30' },
        byDay: [
          { date: '2031-03-02', count: 2, total: '0.30' },
          { date: '2031-03-04', count: 1, total: '3.00' },
        ],
        byChannel: [
          { channel: 'MARKET', count: 1, total: '0.20' },
          { channel: 'ONLINE', count: 2, total: '3.10' },
        ],
        byPaymentMethod: [
          { paymentMethod: 'CASH', count: 1, total: '0.20' },
          { paymentMethod: 'UPI', count: 2, total: '3.10' },
        ],
      });
      const main = await svc.revenueReport(mainOf(f, 'finance.sales_income.view', ScopeLevel.OWN), range);
      expect(main.summary).toEqual({ count: 4, total: '503.30' });
      expect(main.byChannel.map((c) => c.channel)).toEqual(['B2B', 'MARKET', 'ONLINE']);
    });
  });

  it('BR-63a (PostgreSQL): the expense report groups by day, category and payment method, scoped to the caller\'s warehouse, ignoring deleted rows', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const svc = await service(tx);
      await insertExpenseRow(tx, f, { warehouseId: f.coonoor, amount: '0.10', date: '2031-03-01', paymentMethod: 'CASH' });
      await insertExpenseRow(tx, f, { warehouseId: f.coonoor, amount: '0.20', date: '2031-03-01', paymentMethod: 'UPI', categoryId: f.other, categoryName: 'Other' });
      await insertExpenseRow(tx, f, { warehouseId: f.coonoor, amount: '4.00', date: '2031-03-03', paymentMethod: null, categoryId: null, categoryName: 'Transport' });
      await insertExpenseRow(tx, f, { warehouseId: f.coonoor, amount: '99.00', date: '2031-03-01', deleted: true });
      await insertExpenseRow(tx, f, { warehouseId: f.ooty, amount: '1000.00', date: '2031-03-01' });

      const range = { from: '2031-03-01', to: '2031-03-05' };
      const sub = await svc.expenseReport(subOf(f, f.coonoor), range);
      expect(sub).toEqual({
        from: '2031-03-01',
        to: '2031-03-05',
        summary: { count: 3, total: '4.30' },
        byDay: [
          { date: '2031-03-01', count: 2, total: '0.30' },
          { date: '2031-03-03', count: 1, total: '4.00' },
        ],
        byCategory: [
          { category: 'Other', count: 1, total: '0.20' },
          { category: 'Transport', count: 2, total: '4.10' },
        ],
        byPaymentMethod: [
          { paymentMethod: 'CASH', count: 1, total: '0.10' },
          { paymentMethod: 'UPI', count: 1, total: '0.20' },
          { paymentMethod: null, count: 1, total: '4.00' },
        ],
      });
      expect((await svc.expenseReport(mainOf(f), range)).summary).toEqual({ count: 4, total: '1004.30' });
    });
  });

  it('BR-63a (PostgreSQL): the report span cap is read from system_config: default 366 when the row is missing, and the configured value when set', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const svc = await service(tx);
      const scope = mainOf(f);
      await expect(svc.expenseReport(scope, { from: '2031-01-01', to: '2032-01-02' })).resolves.toBeDefined();
      expect((await failure(svc.expenseReport(scope, { from: '2031-01-01', to: '2032-01-03' }))).code).toBe('VALIDATION_FAILED');

      await tx.query(`UPDATE system_config SET value = '5'::jsonb WHERE key = 'finance_report_max_range_days'`);
      await expect(svc.expenseReport(scope, { from: '2031-01-01', to: '2031-01-06' })).resolves.toBeDefined();
      expect((await failure(svc.expenseReport(scope, { from: '2031-01-01', to: '2031-01-07' }))).code).toBe('VALIDATION_FAILED');

      await tx.query(`DELETE FROM system_config WHERE key = 'finance_report_max_range_days'`);
      await expect(svc.expenseReport(scope, { from: '2031-01-01', to: '2032-01-02' })).resolves.toBeDefined();
      expect((await failure(svc.expenseReport(scope, { from: '2031-01-01', to: '2032-01-03' }))).code).toBe('VALIDATION_FAILED');
    });
  });
});

// ===========================================================================
// 4. Real HTTP through the real app router
// ===========================================================================
describeIfDatabase('Finance routes (real app router, PostgreSQL)', () => {
  let ready = false;
  let app: Express;
  let server: Server;
  const tokens: Record<string, string> = {};
  const tag = `ci-http-${Date.now()}`;
  let coonoorId = '';
  let kotagiriId = '';
  let transportId = '';
  const seededUserId = '00000000-0000-0000-0000-000000000001';

  beforeAll(async () => {
    ready = await databaseReady('expense_categories');
    if (!ready) return;
    const [{ createApp }, { signAccessToken }, { pool }] = await Promise.all([
      import('../../app.js'),
      import('../../auth/jwt.js'),
      import('../../db/pool.js'),
    ]);
    app = createApp();
    server = app.listen(0);
    const wh = await pool.query<{ id: string; code: string }>(`SELECT id, code FROM warehouses WHERE code IN ('WH-COON', 'WH-KOTA')`);
    coonoorId = wh.rows.find((w) => w.code === 'WH-COON')!.id;
    kotagiriId = wh.rows.find((w) => w.code === 'WH-KOTA')!.id;
    const cat = await pool.query<{ id: string }>(`SELECT id FROM expense_categories WHERE name = 'Transport'`);
    transportId = cat.rows[0]!.id;

    const base = { farmerId: null, customerId: null };
    tokens['subCoonoor'] = signAccessToken({ sub: seededUserId, roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: coonoorId }], ...base });
    tokens['subKotagiri'] = signAccessToken({ sub: seededUserId, roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: kotagiriId }], ...base });
    tokens['main'] = signAccessToken({ sub: seededUserId, roles: [{ code: RoleCode.MAIN_WH_ADMIN }], ...base });
    tokens['farmer'] = signAccessToken({ sub: seededUserId, roles: [{ code: RoleCode.FARMER }], farmerId: newId(), customerId: null });
    tokens['customer'] = signAccessToken({ sub: seededUserId, roles: [{ code: RoleCode.CUSTOMER }], farmerId: null, customerId: newId() });
    tokens['farmerAdmin'] = signAccessToken({ sub: seededUserId, roles: [{ code: RoleCode.FARMER_ADMIN, zoneId: newId() }], ...base });
  });

  afterAll(async () => {
    if (!ready) return;
    const [{ pool, closePool }, { closeRedis }] = await Promise.all([import('../../db/pool.js'), import('../../redis.js')]);
    // The audit rows are append-only and stay; the expenses this suite committed are removed.
    await pool.query(`DELETE FROM expenses WHERE idempotency_key LIKE $1`, [`${tag}%`]);
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await Promise.allSettled([closePool(), closeRedis()]);
  });

  const auth = (name: string): string => `Bearer ${tokens[name]!}`;
  // A date no other test in this file uses, so a row left by an interrupted run cannot skew their windows.
  const goodBody = () => ({ categoryId: transportId, expenseDate: '2033-01-05', amount: '10.00', paymentMethod: 'CASH' });

  const ROUTES: Array<{ method: 'get' | 'post'; path: string }> = [
    { method: 'post', path: '/v1/admin/expenses' },
    { method: 'get', path: '/v1/admin/expenses' },
    { method: 'get', path: `/v1/admin/expenses/${'99999999-9999-4999-8999-999999999999'}` },
    { method: 'get', path: '/v1/admin/expense-categories' },
    { method: 'get', path: '/v1/admin/finance/revenue' },
    { method: 'get', path: `/v1/admin/finance/revenue/${'99999999-9999-4999-8999-999999999999'}` },
    { method: 'get', path: '/v1/admin/finance/reports/revenue?from=2031-03-01&to=2031-03-02' },
    { method: 'get', path: '/v1/admin/finance/reports/expenses?from=2031-03-01&to=2031-03-02' },
  ];

  it('BR-62a (HTTP): every finance route is 401 without a token and 403 for FARMER, CUSTOMER and FARMER_ADMIN', async () => {
    if (!ready) return;
    for (const { method, path } of ROUTES) {
      const anonymous = await request(server)[method](path).send(method === 'post' ? goodBody() : undefined);
      expect(anonymous.status, `${method} ${path} anonymous`).toBe(401);
      for (const role of ['farmer', 'customer', 'farmerAdmin']) {
        const res = await request(server)[method](path).set('Authorization', auth(role)).set('Idempotency-Key', `${tag}-denied`).send(method === 'post' ? goodBody() : undefined);
        expect(res.status, `${method} ${path} as ${role}: ${JSON.stringify(res.body)}`).toBe(403);
        expect(res.headers['content-type']).toContain('application/problem+json');
      }
    }
  });

  it('BR-62a (HTTP): POST without Idempotency-Key is 422, with an invalid body is 422, and neither writes a row', async () => {
    if (!ready) return;
    const noKey = await request(server).post('/v1/admin/expenses').set('Authorization', auth('subCoonoor')).send(goodBody());
    expect(noKey.status).toBe(422);
    expect(noKey.body.code).toBe('VALIDATION_FAILED');
    const blank = await request(server).post('/v1/admin/expenses').set('Authorization', auth('subCoonoor')).set('Idempotency-Key', '  ').send(goodBody());
    expect(blank.status).toBe(422);
    for (const bad of [{ amount: '0' }, { amount: 10.5 }, { expenseDate: '2031-02-30' }, { paymentMethod: 'CARD' }, { status: 'APPROVED' }]) {
      const res = await request(server).post('/v1/admin/expenses').set('Authorization', auth('subCoonoor')).set('Idempotency-Key', `${tag}-bad`).send({ ...goodBody(), ...bad });
      expect(res.status, JSON.stringify(bad)).toBe(422);
    }
    const { pool } = await import('../../db/pool.js');
    const rows = await pool.query(`SELECT 1 FROM expenses WHERE idempotency_key LIKE $1`, [`${tag}%`]);
    expect(rows.rowCount).toBe(0);
  });

  it('BR-62a/BR-63a (HTTP): create 201, replay 200 with the same row, own warehouse only for Sub, 404 for another Sub, Main must name the warehouse and sees it', async () => {
    if (!ready) return;
    const key = `${tag}-create`;
    const created = await request(server).post('/v1/admin/expenses').set('Authorization', auth('subCoonoor')).set('Idempotency-Key', key).send(goodBody());
    expect(created.status, JSON.stringify(created.body)).toBe(201);
    expect(created.body).toMatchObject({ warehouseId: coonoorId, amount: '10.00', status: 'RECORDED', category: 'Transport' });
    expect(typeof created.body.amount).toBe('string');

    const replay = await request(server).post('/v1/admin/expenses').set('Authorization', auth('subCoonoor')).set('Idempotency-Key', key).send(goodBody());
    expect(replay.status).toBe(200);
    expect(replay.body.id).toBe(created.body.id);
    const reused = await request(server).post('/v1/admin/expenses').set('Authorization', auth('subCoonoor')).set('Idempotency-Key', key).send({ ...goodBody(), amount: '11.00' });
    expect(reused.status).toBe(409);
    expect(reused.body.code).toBe('IDEMPOTENCY_KEY_REUSED');

    const detail = await request(server).get(`/v1/admin/expenses/${created.body.id as string}`).set('Authorization', auth('subCoonoor'));
    expect(detail.status).toBe(200);
    const other = await request(server).get(`/v1/admin/expenses/${created.body.id as string}`).set('Authorization', auth('subKotagiri'));
    expect(other.status).toBe(404);
    const main = await request(server).get(`/v1/admin/expenses/${created.body.id as string}`).set('Authorization', auth('main'));
    expect(main.status).toBe(200);

    const list = await request(server).get('/v1/admin/expenses').query({ from: '2033-01-05', to: '2033-01-05' }).set('Authorization', auth('subKotagiri'));
    expect(list.status).toBe(200);
    expect(list.body.items).toEqual([]);
    expect(list.body.summary).toEqual({ count: 0, total: '0.00' });

    const crossBody = await request(server).post('/v1/admin/expenses').set('Authorization', auth('subKotagiri')).set('Idempotency-Key', `${key}-x`).send({ ...goodBody(), warehouseId: coonoorId });
    expect(crossBody.status).toBe(404);
    const mainNoWh = await request(server).post('/v1/admin/expenses').set('Authorization', auth('main')).set('Idempotency-Key', `${key}-m`).send(goodBody());
    expect(mainNoWh.status).toBe(422);
    const mainOk = await request(server).post('/v1/admin/expenses').set('Authorization', auth('main')).set('Idempotency-Key', `${key}-m2`).send({ ...goodBody(), warehouseId: kotagiriId });
    expect(mainOk.status).toBe(201);
    expect(mainOk.body.warehouseId).toBe(kotagiriId);
  });

  it('BR-63a (HTTP): the read endpoints answer 200 with their documented shapes for Sub and Main (no 5xx from any query)', async () => {
    if (!ready) return;
    const cats = await request(server).get('/v1/admin/expense-categories').set('Authorization', auth('subCoonoor'));
    expect(cats.status).toBe(200);
    expect(cats.body.items.length).toBeGreaterThanOrEqual(1);

    for (const role of ['subCoonoor', 'main']) {
      const revenue = await request(server).get('/v1/admin/finance/revenue').query({ from: '2031-03-10', to: '2031-03-10', channel: 'ONLINE' }).set('Authorization', auth(role));
      expect(revenue.status, JSON.stringify(revenue.body)).toBe(200);
      expect(revenue.body.summary).toEqual({ count: 0, total: '0.00', byChannel: [] });
      const rev404 = await request(server).get('/v1/admin/finance/revenue/99999999-9999-4999-8999-999999999999').set('Authorization', auth(role));
      expect(rev404.status).toBe(404);
      const rr = await request(server).get('/v1/admin/finance/reports/revenue').query({ from: '2031-03-01', to: '2031-03-31' }).set('Authorization', auth(role));
      expect(rr.status, JSON.stringify(rr.body)).toBe(200);
      expect(rr.body.summary).toEqual({ count: 0, total: '0.00' });
      const er = await request(server).get('/v1/admin/finance/reports/expenses').query({ from: '2031-03-01', to: '2031-03-31' }).set('Authorization', auth(role));
      expect(er.status, JSON.stringify(er.body)).toBe(200);
    }
    const tooWide = await request(server).get('/v1/admin/finance/reports/expenses').query({ from: '2020-01-01', to: '2031-03-31' }).set('Authorization', auth('main'));
    expect(tooWide.status).toBe(422);
    const backwards = await request(server).get('/v1/admin/finance/reports/revenue').query({ from: '2031-03-02', to: '2031-03-01' }).set('Authorization', auth('main'));
    expect(backwards.status).toBe(422);
    const badCursor = await request(server).get('/v1/admin/expenses').query({ cursor: 'garbage' }).set('Authorization', auth('main'));
    expect(badCursor.status).toBe(422);
  });
});
