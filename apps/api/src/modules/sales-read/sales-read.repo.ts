/**
 * SWA Module 6 (Direct / Market sales), READ side: SQL only.
 *
 * Warehouse scoping uses `warehouseScopeFilter` (src/rbac/warehouseScope.ts), never `scopedWhere`.
 * For a Sub Warehouse Admin (`own`, one warehouse) it is an EXPLICIT `warehouse_id = ANY($n)`
 * predicate inside every query, so a sale of another warehouse is simply absent: a list is empty
 * and a by-id read is 404, never 403 (BR-30, CLAUDE.md 2.1). An `own` grant with no warehouse (a
 * Main Warehouse Admin) sees all four warehouses, as confirmed by the owner 2026-10-11 (BR-63).
 *
 * The records returned here are INTERNAL: they carry the raw customer and walk-in mobile so the
 * service can mask it (BR-92). They never carry a farm identity column: no query in this file
 * selects `source_farmer_id`, `farmer_id`, a farm, a batch code or a batch id (BR-90). The service
 * still builds every response by an allow-list, so a column added here later cannot leak.
 *
 * Money is `numeric(12,2)` rendered as text by Postgres and branded with `parseMoney`; sums are
 * `SUM(numeric)` in SQL. Quantities are `numeric(12,3)` text. No float touches either.
 */
import { parseMoney, type Money } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { effectiveAvailableSql } from '../../db/shelfAvailability.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { warehouseScopeFilter } from '../../rbac/warehouseScope.js';
import type {
  ChannelOrderStatus,
  Grade,
  SaleChannel,
  SalePaymentMethod,
  SalePaymentStatus,
  SaleStatus,
} from './sales-read.schema.js';

/**
 * The business day is the Asia/Kolkata calendar day (BR-96, BR-63). Warehouses carry no time-zone
 * column: all four are in the Nilgiris.
 */
export const SALES_TIME_ZONE = 'Asia/Kolkata';

/**
 * BR-96: the dashboard counts a Direct or Market sale only when it is PAID, PICKED_UP and has a
 * `completed_at`. A pending UPI sale (BR-94), a cancelled sale and a failed attempt (which never
 * reaches `orders`, BR-87) are therefore excluded. Stricter than REVENUE_PREDICATE in
 * finance.repo.ts on purpose: a counter sale is never DELIVERED.
 */
export const COMPLETED_SALE_PREDICATE =
  `o.channel IN ('DIRECT', 'MARKET') AND o.payment_status = 'PAID' AND o.status = 'PICKED_UP' AND o.completed_at IS NOT NULL`;

/** Microsecond ISO timestamp for cursors: `placed_at` has microsecond precision, a JS Date does not. */
const MICRO_TS = (column: string): string =>
  `to_char(${column} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`;

/** 366 is the one-year bound used by the reports module (BR-64) when no config row exists. */
const DEFAULT_REPORT_MAX_RANGE_DAYS = 366;

// ---------------------------------------------------------------------------
// Records
// ---------------------------------------------------------------------------
export interface DayWindow {
  /** First Asia/Kolkata day, inclusive, YYYY-MM-DD. */
  from: string;
  /** Last Asia/Kolkata day, inclusive, YYYY-MM-DD. */
  to: string;
}

/** An explicit narrowing on top of the scope (the `warehouseId` query parameter). */
export interface WarehouseNarrowing {
  warehouseId?: string | undefined;
}

export interface ChannelTotalRow {
  channel: SaleChannel;
  count: number;
  revenue: Money;
}

export interface MethodTotalRow {
  method: SalePaymentMethod;
  count: number;
  revenue: Money;
}

export interface NeedsAttentionRow {
  paymentPending: number;
  stockIssues: number;
  failedSales: number;
  invoiceIssues: number;
}

/** Buyer identity as stored. The mobiles are raw here and MUST be masked by the service (BR-92). */
export interface BuyerRecord {
  customerId: string | null;
  customerCode: string | null;
  customerName: string | null;
  customerMobile: string | null;
  walkInName: string | null;
  walkInMobile: string | null;
}

export interface SaleListRecord {
  id: string;
  orderNumber: string;
  channel: SaleChannel;
  status: SaleStatus;
  paymentStatus: SalePaymentStatus;
  paymentMethod: SalePaymentMethod;
  warehouseId: string;
  buyer: BuyerRecord;
  itemCount: number;
  total: Money;
  invoiceNumber: string | null;
  placedAt: string;
  completedAt: string | null;
}

export interface SaleListFilters extends WarehouseNarrowing {
  channel?: SaleChannel | undefined;
  status?: SaleStatus | undefined;
  paymentStatus?: SalePaymentStatus | undefined;
  paymentMethod?: SalePaymentMethod | undefined;
  /** Asia/Kolkata day of `placed_at`, inclusive. */
  from?: string | undefined;
  to?: string | undefined;
  customerId?: string | undefined;
  q?: string | undefined;
  /** Market-day view: only warehouses that are market-day venues. */
  venueOnly?: boolean | undefined;
}

export interface OrderCursor {
  placedAt: string;
  id: string;
}

export interface Page<T> {
  items: T[];
  next: OrderCursor | null;
}

export interface SaleLineRecord {
  productId: string;
  name: string;
  grade: Grade;
  qtyKg: string;
  unitPrice: Money;
  lineTotal: Money;
}

export interface SalePaymentRecord {
  method: SalePaymentMethod;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  amount: Money;
  amountReceived: Money | null;
  changeGiven: Money | null;
  cardRef: string | null;
  upiTxnRef: string | null;
  confirmedAt: string | null;
  createdAt: string;
}

export interface TimelineRecord {
  fromStatus: string | null;
  toStatus: string;
  at: string;
}

export interface SaleDetailRecord extends SaleListRecord {
  subtotal: Money;
  gst: Money;
  invoiceId: string | null;
  items: SaleLineRecord[];
  payments: SalePaymentRecord[];
  timeline: TimelineRecord[];
}

export interface AllocationRow {
  productId: string;
  name: string;
  grade: Grade;
  allocatedQtyKg: string;
  soldQtyKg: string;
  remainingQtyKg: string;
}

export interface ChannelOrderRecord {
  id: string;
  orderNumber: string;
  channel: 'HORECA' | 'B2B';
  status: ChannelOrderStatus;
  paymentStatus: SalePaymentStatus;
  warehouseId: string;
  customerCode: string | null;
  businessName: string | null;
  itemCount: number;
  total: Money;
  placedAt: string;
}

// ---------------------------------------------------------------------------
// Interface (the service depends on THIS; tests pass a plain object)
// ---------------------------------------------------------------------------
export interface SalesReadRepo {
  getReportMaxRangeDays(db: Executor): Promise<number>;
  /** True when an active, not-deleted warehouse with this id exists AND is inside the scope. */
  warehouseVisible(db: Executor, scope: ResolvedScope, id: string): Promise<boolean>;
  totalsByChannel(db: Executor, scope: ResolvedScope, window: DayWindow, narrow: WarehouseNarrowing): Promise<ChannelTotalRow[]>;
  totalsByMethod(
    db: Executor,
    scope: ResolvedScope,
    window: DayWindow,
    narrow: WarehouseNarrowing & { channel?: SaleChannel; venueOnly?: boolean },
  ): Promise<MethodTotalRow[]>;
  needsAttention(db: Executor, scope: ResolvedScope, window: DayWindow, narrow: WarehouseNarrowing): Promise<NeedsAttentionRow>;
  listSales(
    db: Executor,
    scope: ResolvedScope,
    filters: SaleListFilters,
    limit: number,
    cursor: OrderCursor | undefined,
  ): Promise<Page<SaleListRecord>>;
  findSale(db: Executor, scope: ResolvedScope, id: string): Promise<SaleDetailRecord | null>;
  marketAllocation(db: Executor, scope: ResolvedScope, narrow: WarehouseNarrowing): Promise<AllocationRow[]>;
  listChannelOrders(
    db: Executor,
    scope: ResolvedScope,
    channel: 'HORECA' | 'B2B',
    limit: number,
    cursor: OrderCursor | undefined,
  ): Promise<{ items: ChannelOrderRecord[]; next: OrderCursor | null }>;
}

// ---------------------------------------------------------------------------
// WHERE builder
// ---------------------------------------------------------------------------
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

  /** BR-30: the explicit warehouse predicate for a confined scope (TRUE only for an unconfined one). */
  addScope(scope: ResolvedScope, column: string): void {
    const filter = warehouseScopeFilter(scope, column, this.params.length + 1);
    this.params.push(...filter.params);
    this.clauses.push(filter.sql);
  }

  addNarrowing(narrow: WarehouseNarrowing, column: string): void {
    if (narrow.warehouseId !== undefined) this.addParam((p) => `${column} = ${p}::uuid`, narrow.warehouseId);
  }

  /** `[from 00:00 IST, (to + 1 day) 00:00 IST)` on `column`. */
  addDayWindow(column: string, from: string | undefined, to: string | undefined): void {
    if (from !== undefined) {
      this.addParam((p) => `${column} >= ((${p}::date)::timestamp AT TIME ZONE '${SALES_TIME_ZONE}')`, from);
    }
    if (to !== undefined) {
      this.addParam((p) => `${column} < ((${p}::date + 1)::timestamp AT TIME ZONE '${SALES_TIME_ZONE}')`, to);
    }
  }

  addCursor(cursor: OrderCursor | undefined): void {
    if (cursor === undefined) return;
    this.params.push(cursor.placedAt, cursor.id);
    const n = this.params.length;
    this.clauses.push(`(o.placed_at, o.id) < ($${n - 1}::timestamptz, $${n}::uuid)`);
  }

  get sql(): string {
    return this.clauses.length === 0 ? 'TRUE' : this.clauses.join(' AND ');
  }
}

/** `%`, `_` and `\` typed by a user are literals in an ILIKE search, not wildcards. */
function likeContains(value: string): string {
  return `%${value.replace(/[\\%_]/g, (ch) => `\\${ch}`)}%`;
}

// ---------------------------------------------------------------------------
// Rows
// ---------------------------------------------------------------------------
interface SaleListRow {
  id: string;
  order_number: string;
  channel: string;
  status: string;
  payment_status: string;
  payment_method: string;
  warehouse_id: string;
  customer_id: string | null;
  customer_code: string | null;
  customer_name: string | null;
  customer_mobile: string | null;
  walk_in_name: string | null;
  walk_in_mobile: string | null;
  item_count: number;
  total_amount: string;
  invoice_number: string | null;
  placed_at: Date;
  completed_at: Date | null;
  placed_at_cursor: string;
}

interface SaleDetailRow extends SaleListRow {
  subtotal: string;
  gst_amount: string;
  invoice_id: string | null;
}

/**
 * The buyer and the issued invoice. The invoice is the latest ISSUED (or later CREDIT_NOTED)
 * one for the order: a DRAFT or CANCELLED invoice is not the sale's invoice.
 */
const SALE_FROM = `
  FROM orders o
  LEFT JOIN customers c ON c.id = o.customer_id
  LEFT JOIN users u ON u.id = c.user_id
  LEFT JOIN LATERAL (
        SELECT i.id, i.invoice_number
          FROM invoices i
         WHERE i.order_id = o.id AND i.status IN ('ISSUED', 'CREDIT_NOTED')
      ORDER BY i.created_at DESC, i.id DESC
         LIMIT 1
  ) inv ON TRUE`;

const SALE_LIST_COLUMNS = `
  o.id, o.order_number, o.channel, o.status::text AS status, o.payment_status,
  o.payment_method::text AS payment_method, o.warehouse_id,
  o.customer_id, c.customer_code, u.full_name AS customer_name, u.mobile AS customer_mobile,
  o.walk_in_name, o.walk_in_mobile,
  (SELECT count(*)::int FROM order_items oi WHERE oi.order_id = o.id) AS item_count,
  o.total_amount::text AS total_amount, inv.invoice_number,
  o.placed_at, o.completed_at, ${MICRO_TS('o.placed_at')} AS placed_at_cursor`;

function mapSaleList(row: SaleListRow): SaleListRecord {
  return {
    id: row.id,
    orderNumber: row.order_number,
    channel: row.channel as SaleChannel,
    status: row.status as SaleStatus,
    paymentStatus: row.payment_status as SalePaymentStatus,
    paymentMethod: row.payment_method as SalePaymentMethod,
    warehouseId: row.warehouse_id,
    buyer: {
      customerId: row.customer_id,
      customerCode: row.customer_code,
      customerName: row.customer_name,
      customerMobile: row.customer_mobile,
      walkInName: row.walk_in_name,
      walkInMobile: row.walk_in_mobile,
    },
    itemCount: row.item_count,
    total: parseMoney(row.total_amount),
    invoiceNumber: row.invoice_number,
    placedAt: row.placed_at.toISOString(),
    completedAt: row.completed_at === null ? null : row.completed_at.toISOString(),
  };
}

function pageFrom<R extends { id: string; placed_at_cursor: string }, T>(
  rows: R[],
  limit: number,
  map: (row: R) => T,
): { items: T[]; next: OrderCursor | null } {
  const hasMore = rows.length > limit;
  const kept = hasMore ? rows.slice(0, limit) : rows;
  const last = kept[kept.length - 1];
  return {
    items: kept.map(map),
    next: hasMore && last !== undefined ? { placedAt: last.placed_at_cursor, id: last.id } : null,
  };
}

const SUM_MONEY = (column: string): string => `COALESCE(SUM(${column}), 0)::numeric(14,2)::text`;
const SUM_QTY = (column: string): string => `COALESCE(SUM(${column}), 0)::numeric(14,3)::text`;

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------
export const salesReadRepo: SalesReadRepo = {
  async getReportMaxRangeDays(db) {
    const result = await db.query<{ value: unknown }>(
      `SELECT value FROM system_config WHERE key = 'report_max_range_days' LIMIT 1`,
    );
    const raw = result.rows[0]?.value;
    const parsed = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : Number.NaN;
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : DEFAULT_REPORT_MAX_RANGE_DAYS;
  },

  async warehouseVisible(db, scope, id) {
    const w = new WhereBuilder();
    w.addParam((p) => `w.id = ${p}::uuid`, id);
    w.add('w.deleted_at IS NULL');
    w.addScope(scope, 'w.id');
    const result = await db.query(`SELECT 1 FROM warehouses w WHERE ${w.sql} LIMIT 1`, w.params);
    return result.rowCount === 1;
  },

  async totalsByChannel(db, scope, window, narrow) {
    const w = new WhereBuilder();
    w.add(COMPLETED_SALE_PREDICATE);
    w.addScope(scope, 'o.warehouse_id');
    w.addNarrowing(narrow, 'o.warehouse_id');
    w.addDayWindow('o.completed_at', window.from, window.to);
    const result = await db.query<{ channel: string; count: number; revenue: string }>(
      `SELECT o.channel, count(*)::int AS count, ${SUM_MONEY('o.total_amount')} AS revenue
         FROM orders o
        WHERE ${w.sql}
     GROUP BY o.channel
     ORDER BY o.channel`,
      w.params,
    );
    return result.rows.map((r) => ({ channel: r.channel as SaleChannel, count: r.count, revenue: parseMoney(r.revenue) }));
  },

  async totalsByMethod(db, scope, window, narrow) {
    const w = new WhereBuilder();
    w.add(COMPLETED_SALE_PREDICATE);
    w.addScope(scope, 'o.warehouse_id');
    w.addNarrowing(narrow, 'o.warehouse_id');
    w.addDayWindow('o.completed_at', window.from, window.to);
    if (narrow.channel !== undefined) w.addParam((p) => `o.channel = ${p}`, narrow.channel);
    if (narrow.venueOnly === true) {
      w.add(`EXISTS (SELECT 1 FROM warehouses wv WHERE wv.id = o.warehouse_id AND wv.is_market_day_venue)`);
    }
    const result = await db.query<{ method: string; count: number; revenue: string }>(
      `SELECT o.payment_method::text AS method, count(*)::int AS count, ${SUM_MONEY('o.total_amount')} AS revenue
         FROM orders o
        WHERE ${w.sql}
     GROUP BY o.payment_method
     ORDER BY o.payment_method::text`,
      w.params,
    );
    return result.rows.map((r) => ({ method: r.method as SalePaymentMethod, count: r.count, revenue: parseMoney(r.revenue) }));
  },

  async needsAttention(db, scope, window, narrow) {
    // Payment pending: an open (not cancelled) Direct/Market sale whose money has not arrived,
    // whenever it was placed. Outstanding work, so it is NOT bounded by the day window.
    const pending = new WhereBuilder();
    pending.add(`o.channel IN ('DIRECT', 'MARKET')`);
    pending.add(`o.status <> 'CANCELLED'`);
    pending.add(
      `(o.status = 'PENDING_PAYMENT' OR o.payment_status = 'PENDING'
        OR EXISTS (SELECT 1 FROM sale_payments sp WHERE sp.order_id = o.id AND sp.status = 'PENDING'))`,
    );
    pending.addScope(scope, 'o.warehouse_id');
    pending.addNarrowing(narrow, 'o.warehouse_id');

    // Failed sales: rolled-back attempts (BR-87) in the window. Stock issues are the subset whose
    // reason is a stock change (BR-89, BR-95).
    const attempts = new WhereBuilder();
    attempts.addScope(scope, 'sa.warehouse_id');
    attempts.addNarrowing(narrow, 'sa.warehouse_id');
    attempts.addDayWindow('sa.created_at', window.from, window.to);

    // Invoice issue: a completed sale in the window with no ISSUED invoice (BR-98).
    const invoice = new WhereBuilder();
    invoice.add(COMPLETED_SALE_PREDICATE);
    invoice.addScope(scope, 'o.warehouse_id');
    invoice.addNarrowing(narrow, 'o.warehouse_id');
    invoice.addDayWindow('o.completed_at', window.from, window.to);
    invoice.add(`NOT EXISTS (SELECT 1 FROM invoices i WHERE i.order_id = o.id AND i.status = 'ISSUED')`);

    const [p, a, i] = await Promise.all([
      db.query<{ n: number }>(`SELECT count(*)::int AS n FROM orders o WHERE ${pending.sql}`, pending.params),
      db.query<{ failed: number; stock: number }>(
        `SELECT count(*)::int AS failed,
                count(*) FILTER (WHERE sa.reason_code = 'SALE_STOCK_CHANGED')::int AS stock
           FROM sale_attempts sa
          WHERE ${attempts.sql}`,
        attempts.params,
      ),
      db.query<{ n: number }>(`SELECT count(*)::int AS n FROM orders o WHERE ${invoice.sql}`, invoice.params),
    ]);
    return {
      paymentPending: p.rows[0]?.n ?? 0,
      stockIssues: a.rows[0]?.stock ?? 0,
      failedSales: a.rows[0]?.failed ?? 0,
      invoiceIssues: i.rows[0]?.n ?? 0,
    };
  },

  async listSales(db, scope, filters, limit, cursor) {
    const w = new WhereBuilder();
    w.add(`o.channel IN ('DIRECT', 'MARKET')`);
    w.addScope(scope, 'o.warehouse_id');
    w.addNarrowing(filters, 'o.warehouse_id');
    if (filters.channel !== undefined) w.addParam((p) => `o.channel = ${p}`, filters.channel);
    if (filters.status !== undefined) w.addParam((p) => `o.status::text = ${p}`, filters.status);
    if (filters.paymentStatus !== undefined) w.addParam((p) => `o.payment_status = ${p}`, filters.paymentStatus);
    if (filters.paymentMethod !== undefined) w.addParam((p) => `o.payment_method::text = ${p}`, filters.paymentMethod);
    if (filters.customerId !== undefined) w.addParam((p) => `o.customer_id = ${p}::uuid`, filters.customerId);
    // A completed sale is dated by `completed_at` (as the BR-96 summary is), an open or cancelled
    // one by `placed_at`, so the PAID + PICKED_UP rows of a day equal that day's summary (BR-96c).
    w.addDayWindow('COALESCE(o.completed_at, o.placed_at)', filters.from, filters.to);
    if (filters.venueOnly === true) {
      w.add(`EXISTS (SELECT 1 FROM warehouses wv WHERE wv.id = o.warehouse_id AND wv.is_market_day_venue)`);
    }
    if (filters.q !== undefined) {
      // Sale number, invoice number and walk-in name match as substrings. A mobile matches only
      // EXACTLY (as typed, or with +91 in front of a 10-digit number): a substring match would let
      // an own-scope actor recover a masked number digit by digit (BR-92).
      const q = filters.q;
      const digits = q.replace(/[\s-]/g, '');
      const mobiles = /^\+?[0-9]{8,15}$/.test(digits)
        ? [digits.startsWith('+') ? digits : `+${digits}`, `+91${digits.replace(/^\+/, '')}`]
        : [];
      w.params.push(likeContains(q), mobiles);
      const like = `$${w.params.length - 1}`;
      const mob = `$${w.params.length}`;
      w.add(
        `(o.order_number ILIKE ${like} OR inv.invoice_number ILIKE ${like} OR o.walk_in_name ILIKE ${like}
          OR o.walk_in_mobile = ANY(${mob}::text[]) OR u.mobile = ANY(${mob}::text[]))`,
      );
    }
    w.addCursor(cursor);
    const result = await db.query<SaleListRow>(
      `SELECT ${SALE_LIST_COLUMNS}
       ${SALE_FROM}
        WHERE ${w.sql}
     ORDER BY o.placed_at DESC, o.id DESC
        LIMIT $${w.params.length + 1}`,
      [...w.params, limit + 1],
    );
    return pageFrom(result.rows, limit, mapSaleList);
  },

  async findSale(db, scope, id) {
    const w = new WhereBuilder();
    w.addParam((p) => `o.id = ${p}::uuid`, id);
    w.add(`o.channel IN ('DIRECT', 'MARKET')`);
    w.addScope(scope, 'o.warehouse_id');
    const head = await db.query<SaleDetailRow>(
      `SELECT ${SALE_LIST_COLUMNS}, o.subtotal::text AS subtotal, o.gst_amount::text AS gst_amount,
              inv.id AS invoice_id
       ${SALE_FROM}
        WHERE ${w.sql}
        LIMIT 1`,
      w.params,
    );
    const row = head.rows[0];
    if (row === undefined) return null;

    // The order is already proven visible; the children are read by its id only.
    const [items, payments, history] = await Promise.all([
      db.query<{ product_id: string; name: string; grade: string; qty_kg: string; unit_price: string; line_total: string }>(
        `SELECT oi.crop_id AS product_id, cm.name, oi.grade::text AS grade, oi.qty_kg::text AS qty_kg,
                oi.unit_price::text AS unit_price, oi.line_total::text AS line_total
           FROM order_items oi
           JOIN crop_master cm ON cm.id = oi.crop_id
          WHERE oi.order_id = $1
       ORDER BY oi.created_at, oi.id`,
        [row.id],
      ),
      db.query<{
        method: string;
        status: string;
        amount: string;
        amount_received: string | null;
        change_given: string | null;
        card_ref: string | null;
        upi_txn_ref: string | null;
        confirmed_at: Date | null;
        created_at: Date;
      }>(
        `SELECT sp.method::text AS method, sp.status, sp.amount::text AS amount,
                sp.amount_received::text AS amount_received, sp.change_given::text AS change_given,
                sp.card_ref, sp.upi_txn_ref, sp.confirmed_at, sp.created_at
           FROM sale_payments sp
          WHERE sp.order_id = $1
       ORDER BY sp.created_at, sp.id`,
        [row.id],
      ),
      db.query<{ from_status: string | null; to_status: string; created_at: Date }>(
        `SELECT h.from_status::text AS from_status, h.to_status::text AS to_status, h.created_at
           FROM order_status_history h
          WHERE h.order_id = $1
       ORDER BY h.created_at, h.id`,
        [row.id],
      ),
    ]);

    return {
      ...mapSaleList(row),
      subtotal: parseMoney(row.subtotal),
      gst: parseMoney(row.gst_amount),
      invoiceId: row.invoice_id,
      items: items.rows.map((r) => ({
        productId: r.product_id,
        name: r.name,
        grade: r.grade as Grade,
        qtyKg: r.qty_kg,
        unitPrice: parseMoney(r.unit_price),
        lineTotal: parseMoney(r.line_total),
      })),
      payments: payments.rows.map((r) => ({
        method: r.method as SalePaymentMethod,
        status: r.status as SalePaymentRecord['status'],
        amount: parseMoney(r.amount),
        amountReceived: r.amount_received === null ? null : parseMoney(r.amount_received),
        changeGiven: r.change_given === null ? null : parseMoney(r.change_given),
        cardRef: r.card_ref,
        upiTxnRef: r.upi_txn_ref,
        confirmedAt: r.confirmed_at === null ? null : r.confirmed_at.toISOString(),
        createdAt: r.created_at.toISOString(),
      })),
      timeline: history.rows.map((r) => ({ fromStatus: r.from_status, toStatus: r.to_status, at: r.created_at.toISOString() })),
    };
  },

  async marketAllocation(db, scope, narrow) {
    // The CURRENT LIVE_MARKET allocation of ACTIVE batches at market-day venues (BR-95):
    // sold = consumed, remaining = the generated available_qty (allocated - consumed - reserved)
    // capped by the batch's unclaimed shelf (BR-100): a DIRECT counter sale draws the batch without
    // decrementing the LIVE_MARKET row (BR-95), so the stored figure alone can exceed the shelf.
    const w = new WhereBuilder();
    w.add(`a.channel = 'LIVE_MARKET'`);
    w.add(`b.status = 'ACTIVE'`);
    w.add(`wh.is_market_day_venue`);
    w.add(`wh.deleted_at IS NULL`);
    w.addScope(scope, 'a.warehouse_id');
    w.addNarrowing(narrow, 'a.warehouse_id');
    const result = await db.query<{
      product_id: string;
      name: string;
      grade: string;
      allocated: string;
      sold: string;
      remaining: string;
    }>(
      `SELECT b.crop_id AS product_id, cm.name, b.grade::text AS grade,
              ${SUM_QTY('a.allocated_qty')} AS allocated,
              ${SUM_QTY('a.consumed_qty')} AS sold,
              ${SUM_QTY(effectiveAvailableSql('a', 'b'))} AS remaining
         FROM allocations a
         JOIN inventory_batches b ON b.id = a.batch_id
         JOIN crop_master cm ON cm.id = b.crop_id
         JOIN warehouses wh ON wh.id = a.warehouse_id
        WHERE ${w.sql}
     GROUP BY b.crop_id, cm.name, b.grade
     ORDER BY cm.name, b.grade`,
      w.params,
    );
    return result.rows.map((r) => ({
      productId: r.product_id,
      name: r.name,
      grade: r.grade as Grade,
      allocatedQtyKg: r.allocated,
      soldQtyKg: r.sold,
      remainingQtyKg: r.remaining,
    }));
  },

  async listChannelOrders(db, scope, channel, limit, cursor) {
    const w = new WhereBuilder();
    w.addParam((p) => `o.channel = ${p}`, channel);
    w.addScope(scope, 'o.warehouse_id');
    w.addCursor(cursor);
    const result = await db.query<{
      id: string;
      order_number: string;
      channel: string;
      status: string;
      payment_status: string;
      warehouse_id: string;
      customer_code: string | null;
      business_name: string | null;
      item_count: number;
      total_amount: string;
      placed_at: Date;
      placed_at_cursor: string;
    }>(
      `SELECT o.id, o.order_number, o.channel, o.status::text AS status, o.payment_status, o.warehouse_id,
              c.customer_code, c.business_name,
              (SELECT count(*)::int FROM order_items oi WHERE oi.order_id = o.id) AS item_count,
              o.total_amount::text AS total_amount, o.placed_at, ${MICRO_TS('o.placed_at')} AS placed_at_cursor
         FROM orders o
         LEFT JOIN customers c ON c.id = o.customer_id
        WHERE ${w.sql}
     ORDER BY o.placed_at DESC, o.id DESC
        LIMIT $${w.params.length + 1}`,
      [...w.params, limit + 1],
    );
    return pageFrom(result.rows, limit, (r) => ({
      id: r.id,
      orderNumber: r.order_number,
      channel: r.channel as 'HORECA' | 'B2B',
      status: r.status as ChannelOrderStatus,
      paymentStatus: r.payment_status as SalePaymentStatus,
      warehouseId: r.warehouse_id,
      customerCode: r.customer_code,
      businessName: r.business_name,
      itemCount: r.item_count,
      total: parseMoney(r.total_amount),
      placedAt: r.placed_at.toISOString(),
    }));
  },
};
