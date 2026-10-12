/**
 * Reports (Module 12). See CLAUDE.md for the four-file module pattern.
 *
 * <name>.repo.ts is the ONLY place that writes SQL for this module, and every statement in it
 * is a SELECT: a report never changes a row (BR-64).
 *
 * Rules:
 *  - Every function takes an `Executor` first.
 *  - Values are positional params. The one interpolated fragment is the warehouse filter from
 *    `warehouseScopeFilter`, whose column name is ours and whose values are still params.
 *  - Money is summed by Postgres (`numeric`) and leaves as text, so no float is ever involved.
 *  - A day bucket is the Asia/Kolkata calendar day. `from`..`to` is inclusive on both days: the
 *    window is [from 00:00 IST, to+1 00:00 IST), which also lets the timestamp indexes be used.
 *  - Only groups that have rows come back. A channel, status or day with no rows is absent,
 *    never a zero row (BR-64c).
 *
 * The caller hands in the scope it wants applied. Deciding what that scope is, including that a
 * Sub warehouse admin stays confined on an `all` grant, is the service's job.
 */
import type { Executor } from '../../db/pool.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { warehouseScopeFilter } from '../../rbac/warehouseScope.js';
import type { GrnStatus, OrderChannel, OrderStatus } from './reports.schema.js';
import type { ReturnStatus } from '../returnRequests/returnRequests.schema.js';

/** Returned when `report_max_range_days` is missing or is not a non-negative integer. */
const DEFAULT_REPORT_MAX_RANGE_DAYS = 366;

export interface RangeFilter {
  /** Inclusive IST calendar day, YYYY-MM-DD. */
  from: string;
  /** Inclusive IST calendar day, YYYY-MM-DD. */
  to: string;
  scope: ResolvedScope;
  warehouseId: string | null;
}

export interface SalesFilter extends RangeFilter {
  channel: OrderChannel | null;
}

export interface InventoryFilter {
  scope: ResolvedScope;
  warehouseId: string | null;
}

export interface DayCountTotalRow {
  date: string;
  count: number;
  /** Decimal string with 2 dp, summed in Postgres. */
  total: string;
}

export interface DayCountRow {
  date: string;
  count: number;
}

export interface SalesRows {
  count: number;
  total: string;
  byDay: DayCountTotalRow[];
  byChannel: Array<{ channel: OrderChannel; count: number; total: string }>;
  byStatus: Array<{ status: OrderStatus; count: number }>;
}

export interface ReceivingRow {
  date: string;
  status: GrnStatus;
  count: number;
}

export interface InventoryRow {
  cropId: string;
  name: string;
  /** Decimal string with 3 dp, in the unit the column is stored in (kg). */
  totalQty: string;
  batchCount: number;
}

export interface ReturnsRows {
  byStatus: Array<{ status: ReturnStatus; count: number }>;
  byDay: DayCountRow[];
  refundedTotal: string;
}

export interface CustomersRows {
  customersWithOrders: number;
  newCustomers: number;
  byDay: DayCountRow[];
}

export interface CashTopupsRows {
  count: number;
  total: string;
  byDay: DayCountTotalRow[];
}

export interface ReportsRepo {
  /** `system_config.report_max_range_days`, or 366 when the row is missing or unusable. */
  getMaxRangeDays(db: Executor): Promise<number>;
  sales(db: Executor, filter: SalesFilter): Promise<SalesRows>;
  receiving(db: Executor, filter: RangeFilter): Promise<ReceivingRow[]>;
  inventory(db: Executor, filter: InventoryFilter): Promise<InventoryRow[]>;
  returns(db: Executor, filter: RangeFilter): Promise<ReturnsRows>;
  customers(db: Executor, filter: RangeFilter): Promise<CustomersRows>;
  cashTopups(db: Executor, filter: RangeFilter): Promise<CashTopupsRows>;
}

interface Where {
  sql: string;
  params: unknown[];
}

/** The IST calendar day of a timestamptz column, as `YYYY-MM-DD`. */
function istDay(column: string): string {
  return `(${column} AT TIME ZONE 'Asia/Kolkata')::date::text`;
}

/**
 * `WHERE` body for the filter: the IST day window on `timeColumn` ($1 = from, $2 = to), then the
 * warehouse scope on `warehouseColumn`, then the optional single-warehouse narrowing.
 */
function windowAndWarehouse(
  filter: RangeFilter,
  timeColumn: string,
  warehouseColumn: string,
  extra: string[] = [],
): Where {
  const conditions = [
    `${timeColumn} >= ($1::date)::timestamp AT TIME ZONE 'Asia/Kolkata'`,
    `${timeColumn} < (($2::date + 1)::timestamp AT TIME ZONE 'Asia/Kolkata')`,
    ...extra,
  ];
  const params: unknown[] = [filter.from, filter.to];
  const scoped = warehouseScope(filter, warehouseColumn, params.length + 1);
  conditions.push(scoped.sql);
  params.push(...scoped.params);
  return { sql: conditions.join(' AND '), params };
}

function warehouseScope(
  filter: { scope: ResolvedScope; warehouseId: string | null },
  column: string,
  startIndex: number,
): Where {
  const base = warehouseScopeFilter(filter.scope, column, startIndex);
  if (filter.warehouseId === null) return { sql: base.sql, params: base.params };
  return {
    sql: `(${base.sql}) AND ${column} = $${base.nextIndex}::uuid`,
    params: [...base.params, filter.warehouseId],
  };
}

/** Postgres `ROUND(...,2)::text` always has two decimals; SUM of nothing is NULL, so coalesce first. */
const MONEY_SUM = (expression: string): string => `ROUND(COALESCE(SUM(${expression}), 0), 2)::text`;

export const reportsRepo: ReportsRepo = {
  async getMaxRangeDays(db) {
    const res = await db.query<{ value: unknown }>(
      `SELECT value FROM system_config WHERE key = 'report_max_range_days' LIMIT 1`,
    );
    const value = res.rows[0]?.value;
    const parsed =
      typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : DEFAULT_REPORT_MAX_RANGE_DAYS;
  },

  async sales(db, filter) {
    const where = windowAndWarehouse(filter, 'o.placed_at', 'o.warehouse_id');
    const params = [...where.params];
    let sql = where.sql;
    if (filter.channel !== null) {
      params.push(filter.channel);
      sql += ` AND o.channel = $${params.length}`;
    }

    const totals = await db.query<{ count: number; total: string }>(
      `SELECT COUNT(*)::int AS count, ${MONEY_SUM('o.total_amount')} AS total
         FROM orders o WHERE ${sql}`,
      params,
    );
    const byDay = await db.query<DayCountTotalRow>(
      `SELECT ${istDay('o.placed_at')} AS date, COUNT(*)::int AS count, ${MONEY_SUM('o.total_amount')} AS total
         FROM orders o WHERE ${sql}
        GROUP BY 1 ORDER BY 1`,
      params,
    );
    const byChannel = await db.query<{ channel: OrderChannel; count: number; total: string }>(
      `SELECT o.channel, COUNT(*)::int AS count, ${MONEY_SUM('o.total_amount')} AS total
         FROM orders o WHERE ${sql}
        GROUP BY o.channel ORDER BY o.channel`,
      params,
    );
    const byStatus = await db.query<{ status: OrderStatus; count: number }>(
      `SELECT o.status::text AS status, COUNT(*)::int AS count
         FROM orders o WHERE ${sql}
        GROUP BY o.status ORDER BY o.status`,
      params,
    );

    return {
      count: totals.rows[0]!.count,
      total: totals.rows[0]!.total,
      byDay: byDay.rows,
      byChannel: byChannel.rows,
      byStatus: byStatus.rows,
    };
  },

  async receiving(db, filter) {
    const where = windowAndWarehouse(filter, 'gr.received_at', 'gr.warehouse_id');
    const res = await db.query<ReceivingRow>(
      `SELECT ${istDay('gr.received_at')} AS date, gr.status::text AS status, COUNT(*)::int AS count
         FROM goods_receipts gr WHERE ${where.sql}
        GROUP BY 1, gr.status ORDER BY 1, gr.status`,
      where.params,
    );
    return res.rows;
  },

  async inventory(db, filter) {
    const scoped = warehouseScope(filter, 'b.warehouse_id', 1);
    const res = await db.query<InventoryRow>(
      `SELECT b.crop_id AS "cropId", c.name, SUM(b.qty_available)::numeric(14,3)::text AS "totalQty",
              COUNT(*)::int AS "batchCount"
         FROM inventory_batches b
         JOIN crop_master c ON c.id = b.crop_id
        WHERE b.status = 'ACTIVE' AND ${scoped.sql}
        GROUP BY b.crop_id, c.name ORDER BY c.name, b.crop_id`,
      scoped.params,
    );
    return res.rows;
  },

  async returns(db, filter) {
    // return_requests has no warehouse_id of its own (0046_returns.sql): scope on the order's.
    const source = `return_requests r JOIN orders o ON o.id = r.order_id`;
    const where = windowAndWarehouse(filter, 'r.created_at', 'o.warehouse_id');

    const byStatus = await db.query<{ status: ReturnStatus; count: number }>(
      `SELECT r.status::text AS status, COUNT(*)::int AS count
         FROM ${source} WHERE ${where.sql}
        GROUP BY r.status ORDER BY r.status`,
      where.params,
    );
    const byDay = await db.query<DayCountRow>(
      `SELECT ${istDay('r.created_at')} AS date, COUNT(*)::int AS count
         FROM ${source} WHERE ${where.sql}
        GROUP BY 1 ORDER BY 1`,
      where.params,
    );
    // The per-return amount is the same expression as returnRequestsRepo.sumAcceptedAmount
    // (unit_price * accepted_qty, rounded to 2 dp per return), because that is the figure each
    // refund actually moved. Only REFUNDED returns count: the money has left.
    const refunded = await db.query<{ total: string }>(
      `SELECT ${MONEY_SUM('refund.amount')} AS total
         FROM ${source}
         JOIN LATERAL (
           SELECT ROUND(SUM(oi.unit_price * COALESCE(ri.accepted_qty, 0))::numeric, 2) AS amount
             FROM return_request_items ri
             JOIN order_items oi ON oi.id = ri.order_item_id
            WHERE ri.return_request_id = r.id
         ) refund ON TRUE
        WHERE r.status = 'REFUNDED' AND ${where.sql}`,
      where.params,
    );

    return { byStatus: byStatus.rows, byDay: byDay.rows, refundedTotal: refunded.rows[0]!.total };
  },

  async customers(db, filter) {
    // Customers who ordered: the order's warehouse. New customers: customers has no warehouse of
    // its own, so the closest column is the one the customer chose, preferred_warehouse_id.
    const orders = windowAndWarehouse(filter, 'o.placed_at', 'o.warehouse_id');
    const created = windowAndWarehouse(filter, 'c.created_at', 'c.preferred_warehouse_id');

    const ordered = await db.query<{ count: number }>(
      `SELECT COUNT(DISTINCT o.customer_id)::int AS count FROM orders o WHERE ${orders.sql}`,
      orders.params,
    );
    const newCustomers = await db.query<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM customers c WHERE ${created.sql}`,
      created.params,
    );
    const byDay = await db.query<DayCountRow>(
      `SELECT ${istDay('o.placed_at')} AS date, COUNT(DISTINCT o.customer_id)::int AS count
         FROM orders o WHERE ${orders.sql}
        GROUP BY 1 ORDER BY 1`,
      orders.params,
    );

    return {
      customersWithOrders: ordered.rows[0]!.count,
      newCustomers: newCustomers.rows[0]!.count,
      byDay: byDay.rows,
    };
  },

  async cashTopups(db, filter) {
    const where = windowAndWarehouse(filter, 't.created_at', 't.warehouse_id', [
      `t.channel = 'CASH'`,
      `t.status = 'SUCCESS'`,
    ]);
    const totals = await db.query<{ count: number; total: string }>(
      `SELECT COUNT(*)::int AS count, ${MONEY_SUM('t.amount')} AS total FROM topups t WHERE ${where.sql}`,
      where.params,
    );
    const byDay = await db.query<DayCountTotalRow>(
      `SELECT ${istDay('t.created_at')} AS date, COUNT(*)::int AS count, ${MONEY_SUM('t.amount')} AS total
         FROM topups t WHERE ${where.sql}
        GROUP BY 1 ORDER BY 1`,
      where.params,
    );
    return { count: totals.rows[0]!.count, total: totals.rows[0]!.total, byDay: byDay.rows };
  },
};
