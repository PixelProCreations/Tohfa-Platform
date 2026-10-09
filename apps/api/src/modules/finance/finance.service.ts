/**
 * Module 11 (Warehouse Finance): all business logic.
 *
 * Takes a `ResolvedScope`, never a `Request`. Throws `AppError` with a domain `ErrorCode`.
 *
 * Warehouse scoping (BR-62, BR-63): reads narrow with `warehouseScopeFilter` inside the repo; a
 * row outside the caller's scope is absent, so a by-id read of it is 404, never 403. Under the
 * UNCONFIRMED owner default in src/rbac/warehouseScope.ts, an `own` grant with no assigned
 * warehouse (a Main Warehouse Admin) means all four warehouses.
 */
import { fromPaise, parseMoney, ScopeLevel, toPaise, type Money } from '@tohfa/shared-types';
import { writeAuditLog } from '../../audit/auditLog.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { isCalendarDate } from '../certifications/certifications.schema.js';
import {
  financeRepo,
  type ChannelTotalRecord,
  type DayTotalRecord,
  type ExpenseCursor,
  type ExpenseRecord,
  type FinanceRepo,
  type RevenueCursor,
} from './finance.repo.js';
import type {
  CreateExpenseBody,
  ExpenseReportResponse,
  ExpenseResponse,
  ListExpenseCategoriesResponse,
  ListExpensesQuery,
  ListExpensesResponse,
  ListRevenueQuery,
  ListRevenueResponse,
  ReportQuery,
  RevenueDetailResponse,
  RevenueReportResponse,
  TotalSummary,
} from './finance.schema.js';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export interface FinanceServiceDeps {
  repo: FinanceRepo;
  db: Executor;
  runTx: TransactionRunner;
}

export interface CreateExpenseResult {
  expense: ExpenseResponse;
  /** True when the Idempotency-Key had already recorded this exact request. */
  replayed: boolean;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** The microsecond timestamp the repo emits for cursors. */
const MICRO_TS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/;

function failValidation(errors: Record<string, string[]>): never {
  throw new AppError('VALIDATION_FAILED', { detail: 'One or more fields are invalid.', errors });
}

function notFound(what: string, id: string): AppError {
  return new AppError('NOT_FOUND', { detail: `${what} "${id}" not found.` });
}

/**
 * The warehouses the actor is confined to, or null when the scope is not confined to any (an
 * `all` grant, or an `own` grant on a role with no warehouse dimension: the owner default).
 */
function confinedWarehouses(scope: ResolvedScope): { first: string; all: string[] } | null {
  if (scope.level === ScopeLevel.ALL || scope.level === ScopeLevel.CONDITIONAL) return null;
  const [first] = scope.warehouseIds;
  return first === undefined ? null : { first, all: scope.warehouseIds };
}

function encodeCursor(parts: string[]): string {
  return Buffer.from(JSON.stringify(parts), 'utf8').toString('base64url');
}

function decodeCursorParts(raw: string, length: number): string[] {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    if (Array.isArray(parsed) && parsed.length === length && parsed.every((part) => typeof part === 'string')) {
      return parsed as string[];
    }
  } catch {
    // fall through to the 422 below
  }
  return invalidCursor();
}

function invalidCursor(): never {
  throw new AppError('VALIDATION_FAILED', { detail: 'cursor is not a value returned by this endpoint.' });
}

function decodeExpenseCursor(raw: string): ExpenseCursor {
  const [expenseDate, createdAt, id] = decodeCursorParts(raw, 3);
  // Validated so a forged cursor is a 422 here, not a failed ::date / ::timestamptz cast (500) in SQL.
  if (!isCalendarDate(expenseDate ?? '') || !MICRO_TS.test(createdAt ?? '') || !UUID.test(id ?? '')) {
    return invalidCursor();
  }
  return { expenseDate: expenseDate as string, createdAt: createdAt as string, id: id as string };
}

function decodeRevenueCursor(raw: string): RevenueCursor {
  const [completedAt, id] = decodeCursorParts(raw, 2);
  if (!MICRO_TS.test(completedAt ?? '') || !UUID.test(id ?? '')) return invalidCursor();
  return { completedAt: completedAt as string, id: id as string };
}

/** Exact integer-paise sum of 2dp Money strings. */
function sumTotals(rows: ReadonlyArray<{ count: number; total: Money }>): TotalSummary {
  return {
    count: rows.reduce((sum, row) => sum + row.count, 0),
    total: fromPaise(rows.reduce((sum, row) => sum + toPaise(row.total), 0)),
  };
}

function pageOf<C>(next: C | null, encode: (cursor: C) => string): { nextCursor: string | null; hasMore: boolean } {
  return { nextCursor: next === null ? null : encode(next), hasMore: next !== null };
}

/** True when `a` and `b` are the same request, as far as an idempotent replay cares. */
function sameRequest(existing: ExpenseRecord, wanted: Omit<ExpenseRecord, 'id' | 'category' | 'status' | 'createdAt'>): boolean {
  return (
    existing.warehouseId === wanted.warehouseId &&
    existing.categoryId === wanted.categoryId &&
    existing.amount === wanted.amount &&
    existing.expenseDate === wanted.expenseDate &&
    existing.paymentMethod === wanted.paymentMethod &&
    existing.vendor === wanted.vendor &&
    existing.description === wanted.description &&
    existing.recordedBy === wanted.recordedBy
  );
}

export interface FinanceService {
  listExpenseCategories(): Promise<ListExpenseCategoriesResponse>;
  createExpense(
    scope: ResolvedScope,
    idempotencyKey: string | undefined,
    body: CreateExpenseBody,
  ): Promise<CreateExpenseResult>;
  listExpenses(scope: ResolvedScope, query: ListExpensesQuery): Promise<ListExpensesResponse>;
  getExpense(scope: ResolvedScope, id: string): Promise<ExpenseResponse>;
  listRevenue(scope: ResolvedScope, query: ListRevenueQuery): Promise<ListRevenueResponse>;
  getRevenue(scope: ResolvedScope, id: string): Promise<RevenueDetailResponse>;
  revenueReport(scope: ResolvedScope, query: ReportQuery): Promise<RevenueReportResponse>;
  expenseReport(scope: ResolvedScope, query: ReportQuery): Promise<ExpenseReportResponse>;
}

export function createFinanceService(
  deps: FinanceServiceDeps = { repo: financeRepo, db: pool, runTx: withTransaction },
): FinanceService {
  const { repo, db, runTx } = deps;

  /** BR-62: a Sub admin records for their own warehouse; an unconfined actor must say which. */
  function targetWarehouse(scope: ResolvedScope, requested: string | undefined): string {
    const confined = confinedWarehouses(scope);
    if (confined !== null) {
      if (requested === undefined) return confined.first;
      // 404, not 403: a 403 would confirm the other warehouse exists.
      if (!confined.all.includes(requested)) throw notFound('Warehouse', requested);
      return requested;
    }
    if (requested === undefined) {
      return failValidation({ 'body.warehouseId': ['warehouseId is required for an actor not assigned to a warehouse.'] });
    }
    return requested;
  }

  /** The `finance_report_max_range_days` cap; `from`/`to` are real dates (schema), so the subtraction is exact. */
  async function assertRangeWithinCap(query: ReportQuery): Promise<void> {
    const maxDays = await repo.getReportMaxRangeDays(db);
    const spanDays = (Date.parse(`${query.to}T00:00:00Z`) - Date.parse(`${query.from}T00:00:00Z`)) / MS_PER_DAY;
    if (spanDays > maxDays) {
      failValidation({ 'query.to': [`Date range cannot exceed ${maxDays} days.`] });
    }
  }

  return {
    async listExpenseCategories() {
      const categories = await repo.listActiveCategories(db);
      return { items: categories.map((c) => ({ id: c.id, name: c.name })) };
    },

    async createExpense(scope, idempotencyKey, body) {
      const key = idempotencyKey?.trim();
      if (key === undefined || key.length === 0) {
        return failValidation({ 'header.Idempotency-Key': ['The Idempotency-Key header is required.'] });
      }
      const warehouseId = targetWarehouse(scope, body.warehouseId);
      const wanted = {
        warehouseId,
        categoryId: body.categoryId,
        amount: parseMoney(body.amount),
        expenseDate: body.expenseDate,
        paymentMethod: body.paymentMethod,
        vendor: body.vendor ?? null,
        description: body.description ?? null,
        recordedBy: scope.userId,
      };

      function replay(existing: ExpenseRecord): CreateExpenseResult {
        // Same key, different request (or a different actor): never hand back a row the caller did not write.
        if (!sameRequest(existing, wanted)) {
          throw new AppError('IDEMPOTENCY_KEY_REUSED', {
            detail: 'This Idempotency-Key was already used for a different request.',
          });
        }
        return { expense: existing, replayed: true };
      }

      return runTx(async (tx) => {
        // Before any validation, so a replay still answers after its category was retired.
        const existing = await repo.findExpenseByIdempotencyKey(tx, key);
        if (existing !== null) return replay(existing);

        const category = await repo.findCategoryById(tx, body.categoryId);
        if (category === null || !category.isActive) {
          failValidation({ 'body.categoryId': ['categoryId is not an active expense category.'] });
        }
        if (!(await repo.activeWarehouseExists(tx, warehouseId))) {
          failValidation({ 'body.warehouseId': ['warehouseId is not an existing active warehouse.'] });
        }

        const inserted = await repo.insertExpense(tx, {
          warehouseId,
          categoryId: body.categoryId,
          category: category.name,
          amount: wanted.amount,
          expenseDate: body.expenseDate,
          paymentMethod: body.paymentMethod,
          vendor: wanted.vendor,
          description: wanted.description,
          recordedBy: scope.userId,
          idempotencyKey: key,
        });
        if (inserted === null) {
          // A concurrent request with the same key committed between the lookup and the insert.
          const winner = await repo.findExpenseByIdempotencyKey(tx, key);
          if (winner === null) throw new Error('expense insert reported a key conflict but no row holds the key');
          return replay(winner);
        }

        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'finance.expense.log',
          entityType: 'expense',
          entityId: inserted.id,
          warehouseId,
          // Masked image: no vendor or description free text, which can carry names or phone numbers.
          after: {
            id: inserted.id,
            category: inserted.category,
            amount: inserted.amount,
            paymentMethod: inserted.paymentMethod,
            expenseDate: inserted.expenseDate,
            warehouseId: inserted.warehouseId,
            status: inserted.status,
          },
        });

        return { expense: inserted, replayed: false };
      });
    },

    async listExpenses(scope, query) {
      const cursor = query.cursor === undefined ? undefined : decodeExpenseCursor(query.cursor);
      const filters = {
        categoryId: query.categoryId,
        paymentMethod: query.paymentMethod,
        status: query.status,
        from: query.from,
        to: query.to,
        warehouseId: query.warehouseId,
      };
      const { items, next } = await repo.listExpenses(db, scope, filters, query.limit, cursor);
      const summary = await repo.summarizeExpenses(db, scope, filters);
      return { items, summary, page: pageOf(next, (c) => encodeCursor([c.expenseDate, c.createdAt, c.id])) };
    },

    async getExpense(scope, id) {
      const expense = await repo.findExpenseById(db, scope, id);
      if (expense === null) throw notFound('Expense', id);
      return expense;
    },

    async listRevenue(scope, query) {
      const cursor = query.cursor === undefined ? undefined : decodeRevenueCursor(query.cursor);
      const filters = { from: query.from, to: query.to, channel: query.channel, paymentMethod: query.paymentMethod };
      const { items, next } = await repo.listRevenue(db, scope, filters, query.limit, cursor);
      const byChannel: ChannelTotalRecord[] = await repo.revenueByChannel(db, scope, filters);
      return {
        items,
        summary: { ...sumTotals(byChannel), byChannel },
        page: pageOf(next, (c) => encodeCursor([c.completedAt, c.id])),
      };
    },

    async getRevenue(scope, id) {
      const order = await repo.findRevenueById(db, scope, id);
      if (order === null) throw notFound('Revenue order', id);
      return order;
    },

    async revenueReport(scope, query) {
      await assertRangeWithinCap(query);
      const byChannel = await repo.revenueByChannel(db, scope, { from: query.from, to: query.to });
      const byDay: DayTotalRecord[] = await repo.revenueReportByDay(db, scope, query.from, query.to);
      const byPaymentMethod = await repo.revenueReportByPaymentMethod(db, scope, query.from, query.to);
      return { from: query.from, to: query.to, summary: sumTotals(byChannel), byDay, byChannel, byPaymentMethod };
    },

    async expenseReport(scope, query) {
      await assertRangeWithinCap(query);
      const byDay = await repo.expenseReportByDay(db, scope, query.from, query.to);
      const byCategory = await repo.expenseReportByCategory(db, scope, query.from, query.to);
      const byPaymentMethod = await repo.expenseReportByPaymentMethod(db, scope, query.from, query.to);
      return { from: query.from, to: query.to, summary: sumTotals(byDay), byDay, byCategory, byPaymentMethod };
    },
  };
}

export const financeService: FinanceService = createFinanceService();
