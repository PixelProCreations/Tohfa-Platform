/**
 * Module 11 (Warehouse Finance): SQL only.
 *
 * Warehouse scoping uses `warehouseScopeFilter` (src/rbac/warehouseScope.ts), never `scopedWhere`:
 * `scopedWhere` fails closed for a Main Warehouse Admin, who has no warehouse dimension, and this
 * module's `own` grants include that role. The filter is applied inside every query, so a row
 * outside the caller's scope is simply absent (CLAUDE.md 2.1: cross-scope reads are empty, 404).
 *
 * Revenue is DERIVED from `orders`, there is no revenue table. See REVENUE_PREDICATE.
 * Sums are `SUM(numeric)` in SQL (or integer paise in the service), never JS floats.
 */
import { parseMoney, type Money } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { warehouseScopeFilter } from '../../rbac/warehouseScope.js';
import type {
  ExpensePaymentMethod,
  ExpenseStatus,
  OrderPaymentMethod,
  SalesChannel,
} from './finance.schema.js';

// ---------------------------------------------------------------------------
// Records
// ---------------------------------------------------------------------------
export interface ExpenseRecord {
  id: string;
  warehouseId: string | null;
  categoryId: string | null;
  category: string;
  amount: Money;
  expenseDate: string;
  paymentMethod: ExpensePaymentMethod | null;
  vendor: string | null;
  description: string | null;
  status: ExpenseStatus;
  recordedBy: string;
  createdAt: string;
  /** BR-73: who approved, rejected or cancelled the expense; all three null while RECORDED. */
  decidedBy: string | null;
  decidedAt: string | null;
  decisionReason: string | null;
}

export interface ExpenseCategoryRecord {
  id: string;
  name: string;
  isActive: boolean;
}

export interface NewExpenseInput {
  warehouseId: string;
  categoryId: string;
  /** The category's name at the time of writing; `expenses.category` is NOT NULL text. */
  category: string;
  amount: Money;
  expenseDate: string;
  paymentMethod: ExpensePaymentMethod;
  vendor: string | null;
  description: string | null;
  recordedBy: string;
  idempotencyKey: string;
}

export interface ExpenseFilters {
  categoryId?: string | undefined;
  paymentMethod?: ExpensePaymentMethod | undefined;
  status?: ExpenseStatus | undefined;
  from?: string | undefined;
  to?: string | undefined;
  warehouseId?: string | undefined;
}

/** `createdAt` carries microseconds: a millisecond cursor would skip or repeat rows. */
export interface ExpenseCursor {
  expenseDate: string;
  createdAt: string;
  id: string;
}

export interface MoneyCount {
  count: number;
  total: Money;
}

export interface RevenueFilters {
  from?: string | undefined;
  to?: string | undefined;
  channel?: SalesChannel | undefined;
  paymentMethod?: OrderPaymentMethod | undefined;
}

export interface RevenueCursor {
  completedAt: string;
  id: string;
}

export interface RevenueRecord {
  orderId: string;
  channel: SalesChannel;
  paymentMethod: OrderPaymentMethod;
  paymentStatus: string;
  status: string;
  totalAmount: Money;
  gstAmount: Money;
  placedAt: string;
  completedAt: string;
  warehouseId: string;
}

export interface RevenueDetailRecord extends RevenueRecord {
  invoiceNumber: string | null;
  invoiceStatus: string | null;
}

export interface ChannelTotalRecord {
  channel: SalesChannel;
  count: number;
  total: Money;
}

export interface DayTotalRecord {
  date: string;
  count: number;
  total: Money;
}

export interface OrderPaymentMethodTotalRecord {
  paymentMethod: OrderPaymentMethod;
  count: number;
  total: Money;
}

export interface CategoryTotalRecord {
  category: string;
  count: number;
  total: Money;
}

export interface ExpensePaymentMethodTotalRecord {
  paymentMethod: ExpensePaymentMethod | null;
  count: number;
  total: Money;
}

export interface Page<T, C> {
  items: T[];
  next: C | null;
}

// ---------------------------------------------------------------------------
// The revenue definition
// ---------------------------------------------------------------------------
/**
 * UNCONFIRMED DEFAULT (BR-63), not yet approved by the owner: revenue is an order that is PAID and
 * COMPLETED. `orders.status` has no COMPLETED value; the two completed states are DELIVERED (a
 * delivery order) and PICKED_UP (a pickup order), and both set `completed_at` on the OTP handover.
 * `completed_at IS NOT NULL` is required because the report dates a sale by it.
 */
export const REVENUE_PREDICATE =
  `o.payment_status = 'PAID' AND o.status IN ('DELIVERED', 'PICKED_UP') AND o.completed_at IS NOT NULL`;

/** Microsecond ISO timestamp for cursors: `created_at` has microsecond precision, a JS Date does not. */
export const MICRO_TS = (column: string): string =>
  `to_char(${column} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`;

/** 366 is the one-year bound; it matches the row seeded by migration 0047. */
const DEFAULT_REPORT_MAX_RANGE_DAYS = 366;

// ---------------------------------------------------------------------------
// Rows
// ---------------------------------------------------------------------------
export interface ExpenseRow {
  id: string;
  warehouse_id: string | null;
  category_id: string | null;
  category: string;
  amount: string;
  expense_date: string;
  payment_method: string | null;
  vendor: string | null;
  description: string | null;
  status: string;
  recorded_by: string;
  created_at: Date;
  decided_by: string | null;
  decided_at: Date | null;
  decision_reason: string | null;
}

interface ExpenseListRow extends ExpenseRow {
  created_at_cursor: string;
}

interface RevenueRow {
  order_id: string;
  channel: string;
  payment_method: string;
  payment_status: string;
  status: string;
  total_amount: string;
  gst_amount: string;
  placed_at: Date;
  completed_at: Date;
  warehouse_id: string;
}

interface RevenueListRow extends RevenueRow {
  completed_at_cursor: string;
}

interface RevenueDetailRow extends RevenueRow {
  invoice_number: string | null;
  invoice_status: string | null;
}

export const EXPENSE_COLUMNS = `e.id, e.warehouse_id, e.category_id, e.category, e.amount::text AS amount,
       e.expense_date::text AS expense_date, e.payment_method, e.vendor, e.description,
       e.status, e.recorded_by, e.created_at, e.decided_by, e.decided_at, e.decision_reason`;

const REVENUE_COLUMNS = `o.id AS order_id, o.channel, o.payment_method::text AS payment_method,
       o.payment_status, o.status::text AS status, o.total_amount::text AS total_amount,
       o.gst_amount::text AS gst_amount, o.placed_at, o.completed_at, o.warehouse_id`;

export function mapExpense(row: ExpenseRow): ExpenseRecord {
  return {
    id: row.id,
    warehouseId: row.warehouse_id,
    categoryId: row.category_id,
    category: row.category,
    amount: parseMoney(row.amount),
    expenseDate: row.expense_date,
    paymentMethod: row.payment_method as ExpensePaymentMethod | null,
    vendor: row.vendor,
    description: row.description,
    status: row.status as ExpenseStatus,
    recordedBy: row.recorded_by,
    createdAt: row.created_at.toISOString(),
    decidedBy: row.decided_by,
    decidedAt: row.decided_at === null ? null : row.decided_at.toISOString(),
    decisionReason: row.decision_reason,
  };
}

function mapRevenue(row: RevenueRow): RevenueRecord {
  return {
    orderId: row.order_id,
    channel: row.channel as SalesChannel,
    paymentMethod: row.payment_method as OrderPaymentMethod,
    paymentStatus: row.payment_status,
    status: row.status,
    totalAmount: parseMoney(row.total_amount),
    gstAmount: parseMoney(row.gst_amount),
    placedAt: row.placed_at.toISOString(),
    completedAt: row.completed_at.toISOString(),
    warehouseId: row.warehouse_id,
  };
}

// ---------------------------------------------------------------------------
// WHERE builders
// ---------------------------------------------------------------------------
interface Where {
  sql: string;
  params: unknown[];
}

/** Accumulates `AND` clauses and positional parameters in step. */
class WhereBuilder {
  private readonly clauses: string[] = [];
  readonly params: unknown[] = [];

  add(clause: string): void {
    this.clauses.push(clause);
  }

  /** `template` receives the `$n` placeholder for `value`. */
  addParam(template: (placeholder: string) => string, value: unknown): void {
    this.params.push(value);
    this.clauses.push(template(`$${this.params.length}`));
  }

  addScope(scope: ResolvedScope, column: string): void {
    const filter = warehouseScopeFilter(scope, column, this.params.length + 1);
    this.params.push(...filter.params);
    this.clauses.push(filter.sql);
  }

  build(): Where {
    return { sql: this.clauses.join(' AND '), params: this.params };
  }
}

function expenseWhere(scope: ResolvedScope, filters: ExpenseFilters): WhereBuilder {
  const w = new WhereBuilder();
  w.add('e.deleted_at IS NULL');
  w.addScope(scope, 'e.warehouse_id');
  if (filters.categoryId !== undefined) w.addParam((p) => `e.category_id = ${p}::uuid`, filters.categoryId);
  if (filters.paymentMethod !== undefined) w.addParam((p) => `e.payment_method = ${p}`, filters.paymentMethod);
  if (filters.status !== undefined) w.addParam((p) => `e.status = ${p}`, filters.status);
  if (filters.from !== undefined) w.addParam((p) => `e.expense_date >= ${p}::date`, filters.from);
  if (filters.to !== undefined) w.addParam((p) => `e.expense_date <= ${p}::date`, filters.to);
  if (filters.warehouseId !== undefined) w.addParam((p) => `e.warehouse_id = ${p}::uuid`, filters.warehouseId);
  return w;
}

function revenueWhere(scope: ResolvedScope, filters: RevenueFilters): WhereBuilder {
  const w = new WhereBuilder();
  w.add(REVENUE_PREDICATE);
  w.addScope(scope, 'o.warehouse_id');
  // The Asia/Kolkata day, to the second: [from 00:00 IST, (to + 1 day) 00:00 IST).
  if (filters.from !== undefined) {
    w.addParam((p) => `o.completed_at >= (${p}::date)::timestamp AT TIME ZONE 'Asia/Kolkata'`, filters.from);
  }
  if (filters.to !== undefined) {
    w.addParam((p) => `o.completed_at < ((${p}::date + 1)::timestamp AT TIME ZONE 'Asia/Kolkata')`, filters.to);
  }
  if (filters.channel !== undefined) w.addParam((p) => `o.channel = ${p}`, filters.channel);
  if (filters.paymentMethod !== undefined) {
    w.addParam((p) => `o.payment_method::text = ${p}`, filters.paymentMethod);
  }
  return w;
}

// ---------------------------------------------------------------------------
// Repo
// ---------------------------------------------------------------------------
export interface FinanceRepo {
  listActiveCategories(db: Executor): Promise<ExpenseCategoryRecord[]>;
  findCategoryById(db: Executor, id: string): Promise<ExpenseCategoryRecord | null>;
  activeWarehouseExists(db: Executor, id: string): Promise<boolean>;
  findExpenseByIdempotencyKey(db: Executor, key: string): Promise<ExpenseRecord | null>;
  /** Null when another request already holds the key: the caller then replays that row. */
  insertExpense(db: Executor, input: NewExpenseInput): Promise<ExpenseRecord | null>;
  findExpenseById(db: Executor, scope: ResolvedScope, id: string): Promise<ExpenseRecord | null>;
  listExpenses(
    db: Executor,
    scope: ResolvedScope,
    filters: ExpenseFilters,
    limit: number,
    cursor?: ExpenseCursor,
  ): Promise<Page<ExpenseRecord, ExpenseCursor>>;
  summarizeExpenses(db: Executor, scope: ResolvedScope, filters: ExpenseFilters): Promise<MoneyCount>;
  findRevenueById(db: Executor, scope: ResolvedScope, id: string): Promise<RevenueDetailRecord | null>;
  listRevenue(
    db: Executor,
    scope: ResolvedScope,
    filters: RevenueFilters,
    limit: number,
    cursor?: RevenueCursor,
  ): Promise<Page<RevenueRecord, RevenueCursor>>;
  revenueByChannel(db: Executor, scope: ResolvedScope, filters: RevenueFilters): Promise<ChannelTotalRecord[]>;
  getReportMaxRangeDays(db: Executor): Promise<number>;
  revenueReportByDay(db: Executor, scope: ResolvedScope, from: string, to: string): Promise<DayTotalRecord[]>;
  revenueReportByPaymentMethod(
    db: Executor,
    scope: ResolvedScope,
    from: string,
    to: string,
  ): Promise<OrderPaymentMethodTotalRecord[]>;
  expenseReportByDay(db: Executor, scope: ResolvedScope, from: string, to: string): Promise<DayTotalRecord[]>;
  expenseReportByCategory(db: Executor, scope: ResolvedScope, from: string, to: string): Promise<CategoryTotalRecord[]>;
  expenseReportByPaymentMethod(
    db: Executor,
    scope: ResolvedScope,
    from: string,
    to: string,
  ): Promise<ExpensePaymentMethodTotalRecord[]>;
}

/** `SUM(numeric)` with a 2-decimal text result; an empty set sums to 0.00, not NULL. */
const SUM_TEXT = (column: string): string => `COALESCE(SUM(${column}), 0)::numeric(14,2)::text`;

export const financeRepo: FinanceRepo = {
  async listActiveCategories(db) {
    const result = await db.query<{ id: string; name: string }>(
      `SELECT id, name FROM expense_categories WHERE is_active ORDER BY name`,
    );
    return result.rows.map((row) => ({ id: row.id, name: row.name, isActive: true }));
  },

  async findCategoryById(db, id) {
    const result = await db.query<{ id: string; name: string; is_active: boolean }>(
      `SELECT id, name, is_active FROM expense_categories WHERE id = $1`,
      [id],
    );
    const row = result.rows[0];
    return row ? { id: row.id, name: row.name, isActive: row.is_active } : null;
  },

  async activeWarehouseExists(db, id) {
    const result = await db.query<{ ok: boolean }>(
      `SELECT EXISTS (SELECT 1 FROM warehouses WHERE id = $1 AND is_active AND deleted_at IS NULL) AS ok`,
      [id],
    );
    return result.rows[0]?.ok === true;
  },

  async findExpenseByIdempotencyKey(db, key) {
    const result = await db.query<ExpenseRow>(
      `SELECT ${EXPENSE_COLUMNS} FROM expenses e WHERE e.idempotency_key = $1`,
      [key],
    );
    const row = result.rows[0];
    return row ? mapExpense(row) : null;
  },

  async insertExpense(db, input) {
    // ON CONFLICT rather than catching 23505: a unique violation would abort the whole transaction,
    // and a concurrent in-flight insert of the same key blocks here until it commits, then yields no row.
    const result = await db.query<ExpenseRow>(
      `INSERT INTO expenses AS e (warehouse_id, category, category_id, amount, expense_date, payment_method,
                                  vendor, description, status, recorded_by, idempotency_key)
       VALUES ($1, $2, $3, $4, $5::date, $6, $7, $8, 'RECORDED', $9, $10)
       ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING
       RETURNING ${EXPENSE_COLUMNS}`,
      [
        input.warehouseId,
        input.category,
        input.categoryId,
        input.amount,
        input.expenseDate,
        input.paymentMethod,
        input.vendor,
        input.description,
        input.recordedBy,
        input.idempotencyKey,
      ],
    );
    const row = result.rows[0];
    return row ? mapExpense(row) : null;
  },

  async findExpenseById(db, scope, id) {
    const w = expenseWhere(scope, {});
    w.addParam((p) => `e.id = ${p}::uuid`, id);
    const where = w.build();
    const result = await db.query<ExpenseRow>(
      `SELECT ${EXPENSE_COLUMNS} FROM expenses e WHERE ${where.sql}`,
      where.params,
    );
    const row = result.rows[0];
    return row ? mapExpense(row) : null;
  },

  async listExpenses(db, scope, filters, limit, cursor) {
    const w = expenseWhere(scope, filters);
    if (cursor !== undefined) {
      w.params.push(cursor.expenseDate, cursor.createdAt, cursor.id);
      const n = w.params.length;
      w.add(`(e.expense_date, e.created_at, e.id) < ($${n - 2}::date, $${n - 1}::timestamptz, $${n}::uuid)`);
    }
    const where = w.build();
    const result = await db.query<ExpenseListRow>(
      `SELECT ${EXPENSE_COLUMNS}, ${MICRO_TS('e.created_at')} AS created_at_cursor
         FROM expenses e
        WHERE ${where.sql}
     ORDER BY e.expense_date DESC, e.created_at DESC, e.id DESC
        LIMIT $${where.params.length + 1}`,
      [...where.params, limit + 1],
    );
    const hasMore = result.rows.length > limit;
    const rows = hasMore ? result.rows.slice(0, limit) : result.rows;
    const last = rows[rows.length - 1];
    return {
      items: rows.map(mapExpense),
      next:
        hasMore && last !== undefined
          ? { expenseDate: last.expense_date, createdAt: last.created_at_cursor, id: last.id }
          : null,
    };
  },

  async summarizeExpenses(db, scope, filters) {
    const where = expenseWhere(scope, filters).build();
    const result = await db.query<{ count: number; total: string }>(
      `SELECT count(*)::int AS count, ${SUM_TEXT('e.amount')} AS total FROM expenses e WHERE ${where.sql}`,
      where.params,
    );
    const row = result.rows[0];
    return { count: row?.count ?? 0, total: parseMoney(row?.total ?? '0.00') };
  },

  async findRevenueById(db, scope, id) {
    const w = revenueWhere(scope, {});
    w.addParam((p) => `o.id = ${p}::uuid`, id);
    const where = w.build();
    // The newest invoice row for the order; only its number and status ever leave this query, never `pdf_key`.
    const result = await db.query<RevenueDetailRow>(
      `SELECT ${REVENUE_COLUMNS}, inv.invoice_number, inv.status AS invoice_status
         FROM orders o
    LEFT JOIN LATERAL (SELECT i.invoice_number, i.status
                         FROM invoices i
                        WHERE i.order_id = o.id
                     ORDER BY i.created_at DESC, i.id DESC
                        LIMIT 1) inv ON TRUE
        WHERE ${where.sql}`,
      where.params,
    );
    const row = result.rows[0];
    return row
      ? { ...mapRevenue(row), invoiceNumber: row.invoice_number, invoiceStatus: row.invoice_status }
      : null;
  },

  async listRevenue(db, scope, filters, limit, cursor) {
    const w = revenueWhere(scope, filters);
    if (cursor !== undefined) {
      w.params.push(cursor.completedAt, cursor.id);
      const n = w.params.length;
      w.add(`(o.completed_at, o.id) < ($${n - 1}::timestamptz, $${n}::uuid)`);
    }
    const where = w.build();
    const result = await db.query<RevenueListRow>(
      `SELECT ${REVENUE_COLUMNS}, ${MICRO_TS('o.completed_at')} AS completed_at_cursor
         FROM orders o
        WHERE ${where.sql}
     ORDER BY o.completed_at DESC, o.id DESC
        LIMIT $${where.params.length + 1}`,
      [...where.params, limit + 1],
    );
    const hasMore = result.rows.length > limit;
    const rows = hasMore ? result.rows.slice(0, limit) : result.rows;
    const last = rows[rows.length - 1];
    return {
      items: rows.map(mapRevenue),
      next: hasMore && last !== undefined ? { completedAt: last.completed_at_cursor, id: last.order_id } : null,
    };
  },

  async revenueByChannel(db, scope, filters) {
    const where = revenueWhere(scope, filters).build();
    const result = await db.query<{ channel: string; count: number; total: string }>(
      `SELECT o.channel, count(*)::int AS count, ${SUM_TEXT('o.total_amount')} AS total
         FROM orders o
        WHERE ${where.sql}
     GROUP BY o.channel
     ORDER BY o.channel`,
      where.params,
    );
    return result.rows.map((row) => ({
      channel: row.channel as SalesChannel,
      count: row.count,
      total: parseMoney(row.total),
    }));
  },

  async getReportMaxRangeDays(db) {
    const result = await db.query<{ value: unknown }>(
      `SELECT value FROM system_config WHERE key = 'finance_report_max_range_days' LIMIT 1`,
    );
    const value = result.rows[0]?.value;
    const parsed =
      typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : DEFAULT_REPORT_MAX_RANGE_DAYS;
  },

  async revenueReportByDay(db, scope, from, to) {
    const where = revenueWhere(scope, { from, to }).build();
    const result = await db.query<{ date: string; count: number; total: string }>(
      `SELECT to_char(o.completed_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') AS date,
              count(*)::int AS count, ${SUM_TEXT('o.total_amount')} AS total
         FROM orders o
        WHERE ${where.sql}
     GROUP BY 1
     ORDER BY 1`,
      where.params,
    );
    return result.rows.map((row) => ({ date: row.date, count: row.count, total: parseMoney(row.total) }));
  },

  async revenueReportByPaymentMethod(db, scope, from, to) {
    const where = revenueWhere(scope, { from, to }).build();
    const result = await db.query<{ payment_method: string; count: number; total: string }>(
      `SELECT o.payment_method::text AS payment_method, count(*)::int AS count, ${SUM_TEXT('o.total_amount')} AS total
         FROM orders o
        WHERE ${where.sql}
     GROUP BY 1
     ORDER BY 1`,
      where.params,
    );
    return result.rows.map((row) => ({
      paymentMethod: row.payment_method as OrderPaymentMethod,
      count: row.count,
      total: parseMoney(row.total),
    }));
  },

  async expenseReportByDay(db, scope, from, to) {
    const where = expenseWhere(scope, { from, to }).build();
    const result = await db.query<{ date: string; count: number; total: string }>(
      `SELECT e.expense_date::text AS date, count(*)::int AS count, ${SUM_TEXT('e.amount')} AS total
         FROM expenses e
        WHERE ${where.sql}
     GROUP BY e.expense_date
     ORDER BY e.expense_date`,
      where.params,
    );
    return result.rows.map((row) => ({ date: row.date, count: row.count, total: parseMoney(row.total) }));
  },

  async expenseReportByCategory(db, scope, from, to) {
    const where = expenseWhere(scope, { from, to }).build();
    const result = await db.query<{ category: string; count: number; total: string }>(
      `SELECT e.category, count(*)::int AS count, ${SUM_TEXT('e.amount')} AS total
         FROM expenses e
        WHERE ${where.sql}
     GROUP BY e.category
     ORDER BY e.category`,
      where.params,
    );
    return result.rows.map((row) => ({ category: row.category, count: row.count, total: parseMoney(row.total) }));
  },

  async expenseReportByPaymentMethod(db, scope, from, to) {
    const where = expenseWhere(scope, { from, to }).build();
    const result = await db.query<{ payment_method: string | null; count: number; total: string }>(
      `SELECT e.payment_method, count(*)::int AS count, ${SUM_TEXT('e.amount')} AS total
         FROM expenses e
        WHERE ${where.sql}
     GROUP BY e.payment_method
     ORDER BY e.payment_method NULLS LAST`,
      where.params,
    );
    return result.rows.map((row) => ({
      paymentMethod: row.payment_method as ExpensePaymentMethod | null,
      count: row.count,
      total: parseMoney(row.total),
    }));
  },
};
