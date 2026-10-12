/**
 * Module 11 (Warehouse Finance), BR-74: SQL only, for the daily cash summary and close.
 *
 * Everything is one warehouse and one Asia/Kolkata calendar day, [day 00:00 IST, next day 00:00 IST).
 * Sums are `SUM(numeric)` in SQL, returned as 2dp text; the service does any arithmetic in integer
 * paise. `cash_closes` is append-only: this repo only ever INSERTs and SELECTs it.
 */
import { parseMoney, type Money } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { warehouseScopeFilter } from '../../rbac/warehouseScope.js';
import { MICRO_TS, REVENUE_PREDICATE, type Page } from './finance.repo.js';

export interface CashCloseRecord {
  id: string;
  warehouseId: string;
  date: string;
  openingCash: Money;
  openingFrom: string | null;
  cashSales: Money;
  cashTopUps: Money;
  cashExpenses: Money;
  expectedClosing: Money;
  countedCash: Money;
  difference: Money;
  note: string | null;
  closedBy: string;
  createdAt: string;
}

/** What the system derives for a warehouse day, before any arithmetic. */
export interface DayFigures {
  openingCash: Money;
  openingFrom: string | null;
  cashSales: Money;
  cashTopUps: Money;
  cashExpenses: Money;
}

export interface NewCashClose extends DayFigures {
  warehouseId: string;
  date: string;
  expectedClosing: Money;
  countedCash: Money;
  difference: Money;
  note: string | null;
  closedBy: string;
}

export interface CashCloseFilters {
  warehouseId?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
}

/** `createdAt` carries microseconds: a millisecond cursor would skip or repeat rows. */
export interface CashCloseCursor {
  date: string;
  createdAt: string;
  id: string;
}

export interface CashCloseRepo {
  activeWarehouseExists(db: Executor, id: string): Promise<boolean>;
  /** Today's date in Asia/Kolkata, from the database clock. */
  todayInIndia(db: Executor): Promise<string>;
  dayFigures(db: Executor, warehouseId: string, date: string): Promise<DayFigures>;
  findByWarehouseAndDate(db: Executor, warehouseId: string, date: string): Promise<CashCloseRecord | null>;
  /** Null when the warehouse day is already closed (the unique key refused the row). */
  insert(db: Executor, input: NewCashClose): Promise<CashCloseRecord | null>;
  findById(db: Executor, scope: ResolvedScope, id: string): Promise<CashCloseRecord | null>;
  list(
    db: Executor,
    scope: ResolvedScope,
    filters: CashCloseFilters,
    limit: number,
    cursor?: CashCloseCursor,
  ): Promise<Page<CashCloseRecord, CashCloseCursor>>;
}

interface CashCloseRow {
  id: string;
  warehouse_id: string;
  close_date: string;
  opening_cash: string;
  opening_from: string | null;
  cash_sales: string;
  cash_top_ups: string;
  cash_expenses: string;
  expected_closing: string;
  counted_cash: string;
  difference: string;
  note: string | null;
  closed_by: string;
  created_at: Date;
}

interface CashCloseListRow extends CashCloseRow {
  created_at_cursor: string;
}

const COLUMNS = `c.id, c.warehouse_id, c.close_date::text AS close_date, c.opening_cash::text AS opening_cash,
       c.opening_from::text AS opening_from, c.cash_sales::text AS cash_sales, c.cash_top_ups::text AS cash_top_ups,
       c.cash_expenses::text AS cash_expenses, c.expected_closing::text AS expected_closing,
       c.counted_cash::text AS counted_cash, c.difference::text AS difference, c.note, c.closed_by, c.created_at`;

function map(row: CashCloseRow): CashCloseRecord {
  return {
    id: row.id,
    warehouseId: row.warehouse_id,
    date: row.close_date,
    openingCash: parseMoney(row.opening_cash),
    openingFrom: row.opening_from,
    cashSales: parseMoney(row.cash_sales),
    cashTopUps: parseMoney(row.cash_top_ups),
    cashExpenses: parseMoney(row.cash_expenses),
    expectedClosing: parseMoney(row.expected_closing),
    countedCash: parseMoney(row.counted_cash),
    difference: parseMoney(row.difference),
    note: row.note,
    closedBy: row.closed_by,
    createdAt: row.created_at.toISOString(),
  };
}

/** `SUM(numeric)` with a 2-decimal text result; an empty set sums to 0.00, not NULL. */
const SUM_TEXT = (column: string): string => `COALESCE(SUM(${column}), 0)::numeric(14,2)::text`;

/** The Asia/Kolkata day `$2::date`, as a half-open range over a timestamptz column. */
const IN_DAY = (column: string): string =>
  `${column} >= ($2::date)::timestamp AT TIME ZONE 'Asia/Kolkata'
   AND ${column} < (($2::date + 1)::timestamp AT TIME ZONE 'Asia/Kolkata')`;

function closeWhere(scope: ResolvedScope, filters: CashCloseFilters): { sql: string; params: unknown[] } {
  const clauses: string[] = [];
  const params: unknown[] = [];
  const filter = warehouseScopeFilter(scope, 'c.warehouse_id', 1);
  params.push(...filter.params);
  clauses.push(filter.sql);
  if (filters.warehouseId !== undefined) {
    params.push(filters.warehouseId);
    clauses.push(`c.warehouse_id = $${params.length}::uuid`);
  }
  if (filters.from !== undefined) {
    params.push(filters.from);
    clauses.push(`c.close_date >= $${params.length}::date`);
  }
  if (filters.to !== undefined) {
    params.push(filters.to);
    clauses.push(`c.close_date <= $${params.length}::date`);
  }
  return { sql: clauses.join(' AND '), params };
}

export const cashCloseRepo: CashCloseRepo = {
  async activeWarehouseExists(db, id) {
    const result = await db.query<{ ok: boolean }>(
      `SELECT EXISTS (SELECT 1 FROM warehouses WHERE id = $1 AND is_active AND deleted_at IS NULL) AS ok`,
      [id],
    );
    return result.rows[0]?.ok === true;
  },

  async todayInIndia(db) {
    const result = await db.query<{ today: string }>(`SELECT (now() AT TIME ZONE 'Asia/Kolkata')::date::text AS today`);
    const today = result.rows[0]?.today;
    if (today === undefined) throw new Error('the database returned no current date');
    return today;
  },

  async dayFigures(db, warehouseId, date) {
    // Cash sales: the revenue definition of BR-63 (paid, completed) restricted to CASH, dated by completed_at.
    // Cash top-ups: a successful CASH top-up processed at this warehouse (only CASH top-ups carry a warehouse).
    // Cash expenses: every CASH expense dated that day, never soft-deleted. Expenses are only recorded
    // (BR-62: no approval or cancellation exists), so no status is excluded.
    const result = await db.query<{
      cash_sales: string;
      cash_top_ups: string;
      cash_expenses: string;
      opening_cash: string | null;
      opening_from: string | null;
    }>(
      `SELECT
         (SELECT ${SUM_TEXT('o.total_amount')} FROM orders o
           WHERE ${REVENUE_PREDICATE} AND o.payment_method::text = 'CASH' AND o.warehouse_id = $1::uuid
             AND ${IN_DAY('o.completed_at')}) AS cash_sales,
         (SELECT ${SUM_TEXT('t.amount')} FROM topups t
           WHERE t.channel::text = 'CASH' AND t.status = 'SUCCESS' AND t.warehouse_id = $1::uuid
             AND ${IN_DAY('t.created_at')}) AS cash_top_ups,
         (SELECT ${SUM_TEXT('e.amount')} FROM expenses e
           WHERE e.payment_method = 'CASH' AND e.deleted_at IS NULL
             AND e.warehouse_id = $1::uuid AND e.expense_date = $2::date) AS cash_expenses,
         prev.counted_cash::text AS opening_cash,
         prev.close_date::text AS opening_from
       FROM (SELECT 1) AS one
       LEFT JOIN LATERAL (
         SELECT c.counted_cash, c.close_date FROM cash_closes c
          WHERE c.warehouse_id = $1::uuid AND c.close_date < $2::date
          ORDER BY c.close_date DESC LIMIT 1
       ) AS prev ON true`,
      [warehouseId, date],
    );
    const row = result.rows[0];
    if (row === undefined) throw new Error('the day figures query returned no row');
    return {
      openingCash: parseMoney(row.opening_cash ?? '0.00'),
      openingFrom: row.opening_from,
      cashSales: parseMoney(row.cash_sales),
      cashTopUps: parseMoney(row.cash_top_ups),
      cashExpenses: parseMoney(row.cash_expenses),
    };
  },

  async findByWarehouseAndDate(db, warehouseId, date) {
    const result = await db.query<CashCloseRow>(
      `SELECT ${COLUMNS} FROM cash_closes c WHERE c.warehouse_id = $1::uuid AND c.close_date = $2::date`,
      [warehouseId, date],
    );
    const row = result.rows[0];
    return row ? map(row) : null;
  },

  async insert(db, input) {
    // ON CONFLICT rather than catching 23505: a unique violation would abort the whole transaction, and
    // a concurrent close of the same day blocks here until it commits, then yields no row.
    const result = await db.query<CashCloseRow>(
      `INSERT INTO cash_closes AS c (warehouse_id, close_date, opening_cash, opening_from, cash_sales, cash_top_ups,
                                     cash_expenses, expected_closing, counted_cash, difference, note, closed_by)
       VALUES ($1, $2::date, $3, $4::date, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (warehouse_id, close_date) DO NOTHING
       RETURNING ${COLUMNS}`,
      [
        input.warehouseId,
        input.date,
        input.openingCash,
        input.openingFrom,
        input.cashSales,
        input.cashTopUps,
        input.cashExpenses,
        input.expectedClosing,
        input.countedCash,
        input.difference,
        input.note,
        input.closedBy,
      ],
    );
    const row = result.rows[0];
    return row ? map(row) : null;
  },

  async findById(db, scope, id) {
    const where = closeWhere(scope, {});
    const result = await db.query<CashCloseRow>(
      `SELECT ${COLUMNS} FROM cash_closes c WHERE ${where.sql} AND c.id = $${where.params.length + 1}::uuid`,
      [...where.params, id],
    );
    const row = result.rows[0];
    return row ? map(row) : null;
  },

  async list(db, scope, filters, limit, cursor) {
    const where = closeWhere(scope, filters);
    let cursorSql = '';
    if (cursor !== undefined) {
      where.params.push(cursor.date, cursor.createdAt, cursor.id);
      const n = where.params.length;
      cursorSql = ` AND (c.close_date, c.created_at, c.id) < ($${n - 2}::date, $${n - 1}::timestamptz, $${n}::uuid)`;
    }
    const result = await db.query<CashCloseListRow>(
      `SELECT ${COLUMNS}, ${MICRO_TS('c.created_at')} AS created_at_cursor
         FROM cash_closes c
        WHERE ${where.sql}${cursorSql}
     ORDER BY c.close_date DESC, c.created_at DESC, c.id DESC
        LIMIT $${where.params.length + 1}`,
      [...where.params, limit + 1],
    );
    const hasMore = result.rows.length > limit;
    const rows = hasMore ? result.rows.slice(0, limit) : result.rows;
    const last = rows[rows.length - 1];
    return {
      items: rows.map(map),
      next: hasMore && last !== undefined ? { date: last.close_date, createdAt: last.created_at_cursor, id: last.id } : null,
    };
  },
};
