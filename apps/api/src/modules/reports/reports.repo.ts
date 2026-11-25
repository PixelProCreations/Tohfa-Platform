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
import type { ResolvedScope, ScopedWhere } from '../../rbac/requirePermission.js';
import { warehouseScopeFilter } from '../../rbac/warehouseScope.js';
import type {
  ComplianceTiersReportResponse,
  FarmerPerformanceReportResponse,
  GrnStatus,
  OrderChannel,
  OrderStatus,
  TimeSeriesBucket,
  TimeSeriesMetric,
  TimeSeriesPeriod,
} from './reports.schema.js';
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
  timeSeries(
    db: Executor,
    filter: RangeFilter & { metric: TimeSeriesMetric; period: TimeSeriesPeriod },
  ): Promise<{ total: string | number; buckets: TimeSeriesBucket[] }>;
  farmerPerformance(
    db: Executor,
    filter: RangeFilter & { farmerScope: ScopedWhere; zoneId: string | null },
  ): Promise<Omit<FarmerPerformanceReportResponse, 'from' | 'to' | 'warehouseId' | 'zoneId'>>;
  complianceTiers(
    db: Executor,
    filter: { farmerScope: ScopedWhere; warehouseId: string | null; zoneId: string | null },
  ): Promise<Omit<ComplianceTiersReportResponse, 'warehouseId' | 'zoneId'>>;
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

  async timeSeries(db, filter) {
    type MetricKind = 'money' | 'kg' | 'count';
    interface MetricDef {
      fromSql: string;
      timeCol: string;
      whCol: string;
      extra?: string[];
      valueExpr: string;
      kind: MetricKind;
    }

    const METRICS: Record<TimeSeriesMetric, MetricDef> = {
      sales_revenue: {
        fromSql: 'orders o',
        timeCol: 'o.placed_at',
        whCol: 'o.warehouse_id',
        valueExpr: MONEY_SUM('o.total_amount'),
        kind: 'money',
      },
      sales_orders: {
        fromSql: 'orders o',
        timeCol: 'o.placed_at',
        whCol: 'o.warehouse_id',
        valueExpr: 'COUNT(*)::int',
        kind: 'count',
      },
      new_farmers: {
        fromSql: 'farmers f JOIN users u ON u.id = f.user_id AND u.deleted_at IS NULL LEFT JOIN zones z ON z.id = f.zone_id',
        timeCol: 'f.created_at',
        whCol: 'z.warehouse_id',
        valueExpr: 'COUNT(*)::int',
        kind: 'count',
      },
      farmer_applications: {
        fromSql: `farmer_applications fa
          LEFT JOIN farmers f ON f.id = fa.farmer_id
          LEFT JOIN zones z ON z.id = COALESCE(
            f.zone_id,
            CASE WHEN (fa.step3_location->>'zoneId') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                 THEN (fa.step3_location->>'zoneId')::uuid ELSE NULL END
          )`,
        timeCol: 'COALESCE(fa.submitted_at, fa.created_at)',
        whCol: 'z.warehouse_id',
        extra: ['fa.is_draft = false', 'fa.deleted_at IS NULL'],
        valueExpr: 'COUNT(*)::int',
        kind: 'count',
      },
      listings_approved: {
        fromSql: 'produce_listings l JOIN farmers f ON f.id = l.farmer_id LEFT JOIN zones z ON z.id = f.zone_id',
        timeCol: 'COALESCE(l.approved_at, l.updated_at, l.created_at)',
        whCol: 'z.warehouse_id',
        extra: [`l.status IN ('ACCEPTED', 'FULFILLED')`, 'l.deleted_at IS NULL'],
        valueExpr: 'COUNT(*)::int',
        kind: 'count',
      },
      intake_kg: {
        fromSql: 'goods_receipts gr',
        timeCol: 'gr.received_at',
        whCol: 'gr.warehouse_id',
        extra: ['gr.accepted_qty_kg > 0'],
        valueExpr: 'COALESCE(SUM(gr.accepted_qty_kg), 0)::numeric(14,3)::text',
        kind: 'kg',
      },
      spoilage_loss_kg: {
        fromSql: 'stock_adjustments sa',
        timeCol: 'COALESCE(sa.approved_at, sa.created_at)',
        whCol: 'sa.warehouse_id',
        extra: [`sa.status = 'APPROVED'`, `sa.adjustment_type IN ('DAMAGE', 'SHRINKAGE', 'EXPIRY')`],
        valueExpr: 'COALESCE(SUM(ABS(sa.qty_delta)), 0)::numeric(14,3)::text',
        kind: 'kg',
      },
      payouts_paid: {
        fromSql: 'payouts p JOIN farmers f ON f.id = p.farmer_id LEFT JOIN zones z ON z.id = f.zone_id',
        timeCol: 'COALESCE(p.paid_at, p.released_at, p.created_at)',
        whCol: 'z.warehouse_id',
        extra: [`p.status = 'PAID'`],
        valueExpr: MONEY_SUM('p.amount'),
        kind: 'money',
      },
      customer_count: {
        fromSql: 'customers c',
        timeCol: 'c.created_at',
        whCol: 'c.preferred_warehouse_id',
        valueExpr: 'COUNT(*)::int',
        kind: 'count',
      },
    };

    const def = METRICS[filter.metric];
    const bucketExpr =
      filter.period === 'month'
        ? `to_char(date_trunc('month', (${def.timeCol} AT TIME ZONE 'Asia/Kolkata')::date)::date, 'YYYY-MM-DD')`
        : filter.period === 'week'
          ? `to_char(date_trunc('week', (${def.timeCol} AT TIME ZONE 'Asia/Kolkata')::date)::date, 'YYYY-MM-DD')`
          : istDay(def.timeCol);

    const where = windowAndWarehouse(filter, def.timeCol, def.whCol, def.extra ?? []);
    const [totalRes, bucketRes] = await Promise.all([
      db.query<{ value: string | number }>(
        `SELECT ${def.valueExpr} AS value FROM ${def.fromSql} WHERE ${where.sql}`,
        where.params,
      ),
      db.query<{ bucket: string; count: number; value: string | number }>(
        `SELECT ${bucketExpr} AS bucket, COUNT(*)::int AS count, ${def.valueExpr} AS value
           FROM ${def.fromSql}
          WHERE ${where.sql}
          GROUP BY 1
          ORDER BY 1`,
        where.params,
      ),
    ]);

    const emptyTotal = def.kind === 'money' ? '0.00' : def.kind === 'kg' ? '0.000' : 0;
    const rawTotal = totalRes.rows[0]?.value;
    const total = rawTotal === undefined || rawTotal === null ? emptyTotal : def.kind === 'count' ? Number(rawTotal) : String(rawTotal);

    return {
      total,
      buckets: bucketRes.rows.map((r) => ({
        bucket: r.bucket,
        count: Number(r.count),
        value: def.kind === 'count' ? Number(r.value) : String(r.value),
      })),
    };
  },

  async farmerPerformance(db, filter) {
    const conditions: string[] = [`(${filter.farmerScope.sql})`];
    const params: unknown[] = [filter.from, filter.to, ...filter.farmerScope.params];
    if (filter.warehouseId !== null) {
      params.push(filter.warehouseId);
      conditions.push(`z.warehouse_id = $${params.length}::uuid`);
    }
    if (filter.zoneId !== null) {
      params.push(filter.zoneId);
      conditions.push(`f.zone_id = $${params.length}::uuid`);
    }
    const whereSql = conditions.join(' AND ');

    const activityCt = `
      WITH scoped_farmers AS (
        SELECT f.id, f.zone_id, f.is_market_blocked, f.overall_rating, u.status AS account_status,
               z.code AS zone_code, z.name AS zone_name
          FROM farmers f
          JOIN users u ON u.id = f.user_id AND u.deleted_at IS NULL
          LEFT JOIN zones z ON z.id = f.zone_id
         WHERE ${whereSql}
      ),
      listing_agg AS (
        SELECT l.farmer_id,
               COUNT(*)::int AS total_listings,
               COUNT(*) FILTER (WHERE l.status IN ('ACCEPTED', 'FULFILLED'))::int AS approved_listings
          FROM produce_listings l
         WHERE l.deleted_at IS NULL
           AND l.created_at >= ($1::date)::timestamp AT TIME ZONE 'Asia/Kolkata'
           AND l.created_at < (($2::date + 1)::timestamp AT TIME ZONE 'Asia/Kolkata')
         GROUP BY l.farmer_id
      ),
      grn_agg AS (
        SELECT gr.farmer_id,
               COALESCE(SUM(gr.accepted_qty_kg), 0)::numeric(14,3) AS accepted_kg
          FROM goods_receipts gr
         WHERE gr.received_at >= ($1::date)::timestamp AT TIME ZONE 'Asia/Kolkata'
           AND gr.received_at < (($2::date + 1)::timestamp AT TIME ZONE 'Asia/Kolkata')
         GROUP BY gr.farmer_id
      ),
      payout_agg AS (
        SELECT p.farmer_id,
               COALESCE(SUM(p.amount), 0)::numeric(14,2) AS paid_amount
          FROM payouts p
         WHERE p.status = 'PAID'
           AND COALESCE(p.paid_at, p.released_at, p.created_at) >= ($1::date)::timestamp AT TIME ZONE 'Asia/Kolkata'
           AND COALESCE(p.paid_at, p.released_at, p.created_at) < (($2::date + 1)::timestamp AT TIME ZONE 'Asia/Kolkata')
         GROUP BY p.farmer_id
      )
    `;

    const [totalsRes, byZoneRes] = await Promise.all([
      db.query<{
        totalFarmers: number;
        activeFarmers: number;
        marketBlockedFarmers: number;
        avgRating: string | null;
        totalListings: number;
        approvedListings: number;
        acceptedKg: string;
        payoutsPaid: string;
      }>(
        `${activityCt}
         SELECT COUNT(sf.id)::int AS "totalFarmers",
                COUNT(sf.id) FILTER (WHERE sf.account_status = 'ACTIVE')::int AS "activeFarmers",
                COUNT(sf.id) FILTER (WHERE sf.is_market_blocked)::int AS "marketBlockedFarmers",
                ROUND(AVG(sf.overall_rating), 2)::numeric::text AS "avgRating",
                COALESCE(SUM(la.total_listings), 0)::int AS "totalListings",
                COALESCE(SUM(la.approved_listings), 0)::int AS "approvedListings",
                COALESCE(SUM(ga.accepted_kg), 0)::numeric(14,3)::text AS "acceptedKg",
                COALESCE(SUM(pa.paid_amount), 0)::numeric(14,2)::text AS "payoutsPaid"
           FROM scoped_farmers sf
           LEFT JOIN listing_agg la ON la.farmer_id = sf.id
           LEFT JOIN grn_agg ga ON ga.farmer_id = sf.id
           LEFT JOIN payout_agg pa ON pa.farmer_id = sf.id`,
        params,
      ),
      db.query<{
        zoneId: string | null;
        zoneCode: string | null;
        zoneName: string | null;
        farmerCount: number;
        avgRating: string | null;
        acceptedKg: string;
        payoutsPaid: string;
      }>(
        `${activityCt}
         SELECT sf.zone_id AS "zoneId", sf.zone_code AS "zoneCode", sf.zone_name AS "zoneName",
                COUNT(sf.id)::int AS "farmerCount",
                ROUND(AVG(sf.overall_rating), 2)::numeric::text AS "avgRating",
                COALESCE(SUM(ga.accepted_kg), 0)::numeric(14,3)::text AS "acceptedKg",
                COALESCE(SUM(pa.paid_amount), 0)::numeric(14,2)::text AS "payoutsPaid"
           FROM scoped_farmers sf
           LEFT JOIN grn_agg ga ON ga.farmer_id = sf.id
           LEFT JOIN payout_agg pa ON pa.farmer_id = sf.id
          GROUP BY sf.zone_id, sf.zone_code, sf.zone_name
          ORDER BY sf.zone_name NULLS LAST`,
        params,
      ),
    ]);

    const t = totalsRes.rows[0]!;
    return {
      totalFarmers: t.totalFarmers,
      activeFarmers: t.activeFarmers,
      marketBlockedFarmers: t.marketBlockedFarmers,
      avgRating: t.avgRating,
      totalListings: t.totalListings,
      approvedListings: t.approvedListings,
      acceptedKg: t.acceptedKg,
      payoutsPaid: t.payoutsPaid,
      byZone: byZoneRes.rows,
    };
  },

  async complianceTiers(db, filter) {
    const conditions: string[] = [`(${filter.farmerScope.sql})`];
    const params: unknown[] = [...filter.farmerScope.params];
    if (filter.warehouseId !== null) {
      params.push(filter.warehouseId);
      conditions.push(`z.warehouse_id = $${params.length}::uuid`);
    }
    if (filter.zoneId !== null) {
      params.push(filter.zoneId);
      conditions.push(`f.zone_id = $${params.length}::uuid`);
    }
    const whereSql = conditions.join(' AND ');

    const effRes = await db.query<{ eff: string | null }>(
      `SELECT MAX(effective_from)::text AS eff FROM rating_tier_config WHERE effective_from <= CURRENT_DATE`,
    );
    const effectiveFrom = effRes.rows[0]?.eff ?? null;

    const [totalsRes, tiersRes] = await Promise.all([
      db.query<{ totalFarmers: number; unratedCount: number }>(
        `SELECT COUNT(*)::int AS "totalFarmers",
                COUNT(*) FILTER (WHERE f.overall_rating IS NULL)::int AS "unratedCount"
           FROM farmers f
           JOIN users u ON u.id = f.user_id AND u.deleted_at IS NULL
           LEFT JOIN zones z ON z.id = f.zone_id
          WHERE ${whereSql}`,
        params,
      ),
      effectiveFrom === null
        ? Promise.resolve({ rows: [] as Array<{ tierCode: string; label: string; minScore: string; maxScore: string | null; farmerCount: number }> })
        : db.query<{ tierCode: string; label: string; minScore: string; maxScore: string | null; farmerCount: number }>(
            `SELECT t.tier_code AS "tierCode",
                    t.label,
                    t.min_score::text AS "minScore",
                    t.max_score::text AS "maxScore",
                    COUNT(sf.id)::int AS "farmerCount"
               FROM rating_tier_config t
               LEFT JOIN (
                 SELECT f.id, f.overall_rating
                   FROM farmers f
                   JOIN users u ON u.id = f.user_id AND u.deleted_at IS NULL
                   LEFT JOIN zones z ON z.id = f.zone_id
                  WHERE ${whereSql}
                    AND f.overall_rating IS NOT NULL
               ) sf
                 ON sf.overall_rating >= t.min_score
                AND (t.max_score IS NULL OR sf.overall_rating < t.max_score)
              WHERE t.effective_from = $${params.length + 1}::date
              GROUP BY t.tier_code, t.label, t.min_score, t.max_score, t.sort_order
              ORDER BY t.sort_order ASC`,
            [...params, effectiveFrom],
          ),
    ]);

    return {
      effectiveFrom,
      totalFarmers: totalsRes.rows[0]?.totalFarmers ?? 0,
      unratedCount: totalsRes.rows[0]?.unratedCount ?? 0,
      tiers: tiersRes.rows,
    };
  },
};
