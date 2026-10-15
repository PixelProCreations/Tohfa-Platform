/**
 * SWA Module 7 (Customers): SQL only. See CLAUDE.md §4.
 *
 * The repo applies the `CustomerAccess` it is handed and decides nothing itself:
 *  - `access.warehouseIds === null`  -> no warehouse predicate (scope `all`, or a Main Warehouse
 *    Admin with no assigned warehouse, who sees all four - warehouseScope.ts),
 *  - `access.denyAll`                -> `FALSE` (fail closed),
 *  - otherwise                       -> the BR-91 visibility predicate for customers and the
 *    BR-91g `orders.warehouse_id` predicate for the order-derived sub-resources.
 * Customer-level visibility is an EXPLICIT predicate in every query, never `scopedWhere` (which
 * has no notion of "customer seen at this warehouse").
 *
 * Every function takes an `Executor` first so the service can compose them in one transaction.
 * snake_case never leaves this file; values are always positional parameters.
 */
import type { Executor } from '../../db/pool.js';
import {
  toWalletTransactionResponse,
  type WalletTransactionRow,
} from '../wallet/wallet.repo.js';
import type { CustomerAccess, NameKey, TimeKey } from './customers.policy.js';
import type { AdminWalletTransaction, CustomerStatusFilter } from './customers.schema.js';

// ---------------------------------------------------------------------------
// Domain rows handed to the service (unmasked; the service's serializers mask)
// ---------------------------------------------------------------------------
export interface CustomerRow {
  id: string;
  customerCode: string;
  customerType: 'RETAIL' | 'B2B' | 'HORECA';
  businessName: string | null;
  preferredWarehouseId: string | null;
  fullName: string;
  mobile: string;
  email: string | null;
  totalOrders: number;
  lifetimeValue: string;
  lastOrderAt: string | null;
  lastActivityAt: string | null;
  isActive: boolean;
  isNew: boolean;
  createdAt: string;
}

export interface AddressRow {
  id: string;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  pincode: string;
  isDefault: boolean;
}

export interface PurchaseRow {
  orderId: string;
  orderNumber: string;
  channel: string;
  warehouseId: string;
  itemId: string;
  productId: string;
  productName: string;
  grade: string;
  qtyKg: string;
  unitPrice: string;
  lineTotal: string;
  purchasedAt: string;
  cursorTs: string;
}

export interface OrderRow {
  id: string;
  orderNumber: string;
  channel: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  warehouseId: string;
  itemCount: number;
  totalAmount: string;
  invoiceNumber: string | null;
  placedAt: string;
  completedAt: string | null;
  cursorTs: string;
}

export interface WalletSummaryRow {
  walletId: string;
  status: string;
  currency: string;
  /** Sum of the ledger (credits minus debits), NUMERIC as text. */
  ledgerBalance: string;
  transactionCount: number;
  lastTransactionAt: string | null;
}

export interface WalletTxnRow {
  txn: AdminWalletTransaction;
  cursorTs: string;
}

export interface IssueRow {
  id: string;
  orderId: string | null;
  orderNumber: string | null;
  status: string;
  reason: string | null;
  /** Null until at least one item has an accepted quantity (inspection). */
  refundAmount: string | null;
  createdAt: string;
  resolvedAt: string | null;
  cursorTs: string;
}

export interface TicketRow {
  id: string;
  ticketNumber: string;
  orderId: string | null;
  category: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  cursorTs: string;
}

export interface MessageRow {
  id: string;
  ticketId: string;
  senderUserId: string | null;
  senderRole: string;
  body: string;
  isInternal: boolean;
  attachmentKey: string | null;
  createdAt: string;
}

export interface ListCustomersArgs {
  access: CustomerAccess;
  windowDays: number;
  q?: string;
  status?: CustomerStatusFilter;
  after?: NameKey;
  limit: number;
}

export interface PageArgs<K> {
  access: CustomerAccess;
  after?: K;
  limit: number;
}

export interface Fetched<T> {
  rows: T[];
  hasMore: boolean;
}

export interface CustomersRepo {
  /** `system_config.active_customer_window_days`, or null when missing or not a non-negative integer. */
  readActiveWindowDays(db: Executor): Promise<number | null>;
  listCustomers(db: Executor, args: ListCustomersArgs): Promise<Fetched<CustomerRow>>;
  summarize(db: Executor, access: CustomerAccess, windowDays: number): Promise<{ total: number; active: number; new: number }>;
  findCustomer(db: Executor, customerId: string, access: CustomerAccess, windowDays: number): Promise<CustomerRow | null>;
  /** BR-91: is the customer inside the access? Used by every sub-resource before it reads. */
  isVisible(db: Executor, customerId: string, access: CustomerAccess): Promise<boolean>;
  listAddresses(db: Executor, customerId: string): Promise<AddressRow[]>;
  listPurchases(db: Executor, customerId: string, args: PageArgs<TimeKey>): Promise<Fetched<PurchaseRow>>;
  listOrders(db: Executor, customerId: string, args: PageArgs<TimeKey>): Promise<Fetched<OrderRow>>;
  findWallet(db: Executor, customerId: string): Promise<WalletSummaryRow | null>;
  listWalletTransactions(db: Executor, walletId: string, after: TimeKey | undefined, limit: number): Promise<Fetched<WalletTxnRow>>;
  findWalletTransaction(db: Executor, walletId: string, txnId: string): Promise<AdminWalletTransaction | null>;
  listIssues(db: Executor, customerId: string, args: PageArgs<TimeKey>): Promise<Fetched<IssueRow>>;
  listTickets(db: Executor, customerId: string, after: TimeKey | undefined, limit: number): Promise<Fetched<TicketRow>>;
  findTicket(db: Executor, customerId: string, ticketId: string, forUpdate?: boolean): Promise<TicketRow | null>;
  /** Oldest first. */
  listMessages(db: Executor, ticketIds: string[]): Promise<MessageRow[]>;
  /**
   * The farmer-identity redaction list for a customer's tickets (BR-97): farmer id, TOHFA farmer
   * code, farmer name, farmer and farm village, farm name, farm survey number (FMB, BR-16), farm
   * centroid and the batch codes of every farmer whose batch reached this customer's orders (and
   * the ticket's own order), plus each such farmer's mobile in `phones`.
   */
  farmerIdentityTerms(
    db: Executor,
    customerId: string,
    orderIds: string[],
  ): Promise<{ terms: string[]; personNames: string[]; phones?: string[] }>;
  /** The customer's stored mobile and e-mail, for masking them in ticket text (BR-92a, BR-97g). Null if no such customer. */
  customerContact(db: Executor, customerId: string): Promise<{ mobile: string; email: string | null } | null>;
  insertMessage(
    db: Executor,
    input: { ticketId: string; senderUserId: string; body: string; attachmentKey: string | null },
  ): Promise<{ id: string; createdAt: string }>;
}

// ---------------------------------------------------------------------------
// SQL helpers
// ---------------------------------------------------------------------------
/** Microsecond UTC text used for keyset cursors (millisecond `Date`s would skip rows). */
const microTs = (column: string): string => `to_char(${column} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`;

const iso = (value: Date | null): string | null => (value === null ? null : value.toISOString());

type Add = (value: unknown) => string;

function params(): { values: unknown[]; add: Add } {
  const values: unknown[] = [];
  return {
    values,
    add: (value) => {
      values.push(value);
      return `$${values.length}`;
    },
  };
}

/**
 * BR-91 / owner decision D8: visible iff the customer has an order or a top-up at one of the
 * warehouses, or prefers one of them. `alias` is the `customers` alias.
 */
function customerVisibility(access: CustomerAccess, alias: string, add: Add): string {
  if (access.denyAll) return 'FALSE';
  if (access.warehouseIds === null) return 'TRUE';
  const wh = add(access.warehouseIds);
  return `(
      ${alias}.preferred_warehouse_id = ANY(${wh}::uuid[])
      OR EXISTS (SELECT 1 FROM orders vo WHERE vo.customer_id = ${alias}.id AND vo.warehouse_id = ANY(${wh}::uuid[]))
      OR EXISTS (
        SELECT 1 FROM topups vt
         WHERE vt.warehouse_id = ANY(${wh}::uuid[])
           AND (vt.customer_id = ${alias}.id
                OR vt.wallet_id IN (SELECT vw.id FROM wallets vw WHERE vw.customer_id = ${alias}.id))
      )
    )`;
}

/** BR-91g: order-derived rows are confined to the warehouses for an `own` actor. */
function warehouseConfinement(access: CustomerAccess, column: string, add: Add): string {
  if (access.denyAll) return 'FALSE';
  if (access.warehouseIds === null) return 'TRUE';
  return `${column} = ANY(${add(access.warehouseIds)}::uuid[])`;
}

function timeKeyCondition(after: TimeKey | undefined, tsColumn: string, idColumn: string, add: Add): string {
  if (after === undefined) return 'TRUE';
  return `(${tsColumn}, ${idColumn}) < (${add(after.ts)}::timestamptz, ${add(after.id)}::uuid)`;
}

function fetched<T>(rows: T[], limit: number): Fetched<T> {
  return { rows: rows.slice(0, limit), hasMore: rows.length > limit };
}

/** `%` and `_` in a search term are literal (openapi `q`). */
const likeEscape = (term: string): string => term.replace(/[\\%_]/g, (c) => `\\${c}`);

interface CustomerDbRow {
  id: string;
  customer_code: string;
  customer_type: 'RETAIL' | 'B2B' | 'HORECA';
  business_name: string | null;
  preferred_warehouse_id: string | null;
  full_name: string;
  mobile: string;
  email: string | null;
  total_orders: number;
  lifetime_value: string;
  last_order_at: Date | null;
  last_activity_at: Date | null;
  is_active: boolean;
  is_new: boolean;
  created_at: Date;
}

function toCustomer(row: CustomerDbRow): CustomerRow {
  return {
    id: row.id,
    customerCode: row.customer_code,
    customerType: row.customer_type,
    businessName: row.business_name,
    preferredWarehouseId: row.preferred_warehouse_id,
    fullName: row.full_name,
    mobile: row.mobile,
    email: row.email,
    totalOrders: row.total_orders,
    lifetimeValue: row.lifetime_value,
    lastOrderAt: iso(row.last_order_at),
    lastActivityAt: iso(row.last_activity_at),
    isActive: row.is_active,
    isNew: row.is_new,
    createdAt: row.created_at.toISOString(),
  };
}

/**
 * The visible customers with their derived activity. Order and top-up aggregates are confined to
 * the actor's warehouses for `own` (BR-91g), so an Ooty admin's "active" means active at Ooty.
 * "Active" = a completed order or a successful top-up within the window; "new" = created within
 * it (BR-98). `extraWhere` is ANDed onto the customer filter.
 */
function classifiedCte(access: CustomerAccess, windowDays: number, add: Add, extraWhere: string[]): string {
  const visibility = customerVisibility(access, 'c', add);
  const ordersWh = warehouseConfinement(access, 'o.warehouse_id', add);
  const topupsWh = warehouseConfinement(access, 't.warehouse_id', add);
  const window = add(windowDays);
  const where = ['c.deleted_at IS NULL', visibility, ...extraWhere].join(' AND ');
  return `
    base AS (
      SELECT c.id, c.customer_code, c.customer_type, c.business_name, c.preferred_warehouse_id, c.created_at,
             u.full_name, u.mobile, u.email,
             agg.total_orders, agg.lifetime_value, agg.last_order_at,
             GREATEST(agg.last_completed_at, tp.last_topup_at) AS last_activity_at
        FROM customers c
        JOIN users u ON u.id = c.user_id
        CROSS JOIN LATERAL (
          SELECT count(*) FILTER (WHERE o.status <> 'CANCELLED')::int AS total_orders,
                 COALESCE(sum(o.total_amount) FILTER (
                   WHERE o.payment_status = 'PAID' AND o.status NOT IN ('CANCELLED', 'RETURNED')), 0)::numeric(14,2)::text AS lifetime_value,
                 max(o.placed_at) AS last_order_at,
                 max(o.completed_at) AS last_completed_at
            FROM orders o
           WHERE o.customer_id = c.id AND ${ordersWh}
        ) agg
        CROSS JOIN LATERAL (
          SELECT max(t.created_at) AS last_topup_at
            FROM topups t
           WHERE t.status = 'SUCCESS'
             AND (t.customer_id = c.id OR t.wallet_id IN (SELECT w.id FROM wallets w WHERE w.customer_id = c.id))
             AND ${topupsWh}
        ) tp
       WHERE ${where}
    ),
    classified AS (
      SELECT base.*,
             (base.last_activity_at IS NOT NULL
               AND base.last_activity_at >= now() - make_interval(days => ${window}::int)) AS is_active,
             (base.created_at >= now() - make_interval(days => ${window}::int)) AS is_new
        FROM base
    )`;
}

const CUSTOMER_COLUMNS = `id, customer_code, customer_type, business_name, preferred_warehouse_id, full_name, mobile,
  email, total_orders, lifetime_value, last_order_at, last_activity_at, is_active, is_new, created_at`;

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------
export const customersRepo: CustomersRepo = {
  async readActiveWindowDays(db) {
    const res = await db.query<{ value: unknown }>(
      `SELECT value FROM system_config WHERE key = 'active_customer_window_days' LIMIT 1`,
    );
    const value = res.rows[0]?.value;
    const parsed =
      typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : Number.NaN;
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
  },

  async listCustomers(db, args) {
    const p = params();
    const extra: string[] = [];
    if (args.q !== undefined) {
      const like = p.add(`%${likeEscape(args.q)}%`);
      const clauses = [`u.full_name ILIKE ${like} ESCAPE '\\'`, `c.customer_code ILIKE ${like} ESCAPE '\\'`];
      // Mobile search only for unmasked (scope `all`) actors: otherwise an `own` actor could
      // recover a full number digit by digit through the filter (openapi `q`, BR-92).
      const digits = args.q.replace(/\D/g, '');
      if (!args.access.masked && digits.length >= 3) {
        clauses.push(`regexp_replace(u.mobile, '\\D', '', 'g') LIKE ${p.add(`%${digits}%`)}`);
      }
      extra.push(`(${clauses.join(' OR ')})`);
    }
    const cte = classifiedCte(args.access, args.windowDays, p.add, extra);
    const outer: string[] = [];
    if (args.status === 'ACTIVE') outer.push('is_active');
    if (args.status === 'INACTIVE') outer.push('NOT is_active');
    if (args.status === 'NEW') outer.push('is_new');
    if (args.after !== undefined) {
      outer.push(`(full_name, id) > (${p.add(args.after.name)}::text, ${p.add(args.after.id)}::uuid)`);
    }
    const limit = p.add(args.limit + 1);
    const res = await db.query<CustomerDbRow>(
      `WITH ${cte}
       SELECT ${CUSTOMER_COLUMNS}
         FROM classified
        WHERE ${outer.length === 0 ? 'TRUE' : outer.join(' AND ')}
        ORDER BY full_name, id
        LIMIT ${limit}`,
      p.values,
    );
    return fetched(res.rows.map(toCustomer), args.limit);
  },

  async summarize(db, access, windowDays) {
    const p = params();
    const cte = classifiedCte(access, windowDays, p.add, []);
    const res = await db.query<{ total: number; active: number; new: number }>(
      `WITH ${cte}
       SELECT count(*)::int AS total,
              count(*) FILTER (WHERE is_active)::int AS active,
              count(*) FILTER (WHERE is_new)::int AS new
         FROM classified`,
      p.values,
    );
    const row = res.rows[0];
    return { total: row?.total ?? 0, active: row?.active ?? 0, new: row?.new ?? 0 };
  },

  async findCustomer(db, customerId, access, windowDays) {
    const p = params();
    const cte = classifiedCte(access, windowDays, p.add, [`c.id = ${p.add(customerId)}::uuid`]);
    const res = await db.query<CustomerDbRow>(`WITH ${cte} SELECT ${CUSTOMER_COLUMNS} FROM classified LIMIT 1`, p.values);
    const row = res.rows[0];
    return row === undefined ? null : toCustomer(row);
  },

  async isVisible(db, customerId, access) {
    const p = params();
    const id = p.add(customerId);
    const res = await db.query(
      `SELECT 1 FROM customers c WHERE c.id = ${id}::uuid AND c.deleted_at IS NULL AND ${customerVisibility(access, 'c', p.add)} LIMIT 1`,
      p.values,
    );
    return (res.rowCount ?? 0) > 0;
  },

  async listAddresses(db, customerId) {
    const res = await db.query<{
      id: string;
      label: string | null;
      line1: string;
      line2: string | null;
      city: string;
      state: string | null;
      pincode: string;
      is_default: boolean;
    }>(
      `SELECT id, label, line1, line2, city, state, pincode, is_default
         FROM customer_addresses
        WHERE customer_id = $1 AND deleted_at IS NULL
        ORDER BY is_default DESC, created_at, id`,
      [customerId],
    );
    return res.rows.map((r) => ({
      id: r.id,
      label: r.label,
      line1: r.line1,
      line2: r.line2,
      city: r.city,
      state: r.state,
      pincode: r.pincode,
      isDefault: r.is_default,
    }));
  },

  async listPurchases(db, customerId, args) {
    const p = params();
    const customer = p.add(customerId);
    const wh = warehouseConfinement(args.access, 'o.warehouse_id', p.add);
    const after = timeKeyCondition(args.after, 'o.placed_at', 'oi.id', p.add);
    const limit = p.add(args.limit + 1);
    // An order that was never paid for (PENDING_PAYMENT) or was cancelled is not a purchase.
    // Only crop-level columns are read: no batch, farmer or farm column is selected (BR-90).
    const res = await db.query<{
      order_id: string;
      order_number: string;
      channel: string;
      warehouse_id: string;
      item_id: string;
      crop_id: string;
      crop_name: string;
      grade: string;
      qty_kg: string;
      unit_price: string;
      line_total: string;
      placed_at: Date;
      cursor_ts: string;
    }>(
      `SELECT o.id AS order_id, o.order_number, o.channel, o.warehouse_id, oi.id AS item_id,
              oi.crop_id, cm.name AS crop_name, oi.grade::text AS grade, oi.qty_kg::text AS qty_kg,
              oi.unit_price::text AS unit_price, oi.line_total::text AS line_total, o.placed_at,
              ${microTs('o.placed_at')} AS cursor_ts
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         JOIN crop_master cm ON cm.id = oi.crop_id
        WHERE o.customer_id = ${customer}::uuid
          AND o.status NOT IN ('PENDING_PAYMENT', 'CANCELLED')
          AND ${wh} AND ${after}
        ORDER BY o.placed_at DESC, oi.id DESC
        LIMIT ${limit}`,
      p.values,
    );
    return fetched(
      res.rows.map((r) => ({
        orderId: r.order_id,
        orderNumber: r.order_number,
        channel: r.channel,
        warehouseId: r.warehouse_id,
        itemId: r.item_id,
        productId: r.crop_id,
        productName: r.crop_name,
        grade: r.grade,
        qtyKg: r.qty_kg,
        unitPrice: r.unit_price,
        lineTotal: r.line_total,
        purchasedAt: r.placed_at.toISOString(),
        cursorTs: r.cursor_ts,
      })),
      args.limit,
    );
  },

  async listOrders(db, customerId, args) {
    const p = params();
    const customer = p.add(customerId);
    const wh = warehouseConfinement(args.access, 'o.warehouse_id', p.add);
    const after = timeKeyCondition(args.after, 'o.placed_at', 'o.id', p.add);
    const limit = p.add(args.limit + 1);
    const res = await db.query<{
      id: string;
      order_number: string;
      channel: string;
      status: string;
      payment_status: string;
      payment_method: string | null;
      warehouse_id: string;
      item_count: number;
      total_amount: string;
      invoice_number: string | null;
      placed_at: Date;
      completed_at: Date | null;
      cursor_ts: string;
    }>(
      `SELECT o.id, o.order_number, o.channel, o.status::text AS status, o.payment_status,
              o.payment_method::text AS payment_method, o.warehouse_id,
              (SELECT count(*) FROM order_items oi WHERE oi.order_id = o.id)::int AS item_count,
              o.total_amount::text AS total_amount,
              (SELECT i.invoice_number FROM invoices i
                WHERE i.order_id = o.id AND i.invoice_type IN ('SALE_RETAIL', 'SALE_B2B') AND i.status <> 'CANCELLED'
                ORDER BY i.created_at DESC LIMIT 1) AS invoice_number,
              o.placed_at, o.completed_at, ${microTs('o.placed_at')} AS cursor_ts
         FROM orders o
        WHERE o.customer_id = ${customer}::uuid AND ${wh} AND ${after}
        ORDER BY o.placed_at DESC, o.id DESC
        LIMIT ${limit}`,
      p.values,
    );
    return fetched(
      res.rows.map((r) => ({
        id: r.id,
        orderNumber: r.order_number,
        channel: r.channel,
        status: r.status,
        paymentStatus: r.payment_status,
        paymentMethod: r.payment_method,
        warehouseId: r.warehouse_id,
        itemCount: r.item_count,
        totalAmount: r.total_amount,
        invoiceNumber: r.invoice_number,
        placedAt: r.placed_at.toISOString(),
        completedAt: iso(r.completed_at),
        cursorTs: r.cursor_ts,
      })),
      args.limit,
    );
  },

  async findWallet(db, customerId) {
    // The balance is summed from the ledger itself, not read from the trigger-maintained cache,
    // so the read-only view reports exactly what the ledger says (BR-93e).
    const res = await db.query<{
      id: string;
      status: string;
      currency: string;
      ledger_balance: string;
      txn_count: number;
      last_at: Date | null;
    }>(
      `SELECT w.id, w.status, w.currency, l.ledger_balance, l.txn_count, l.last_at
         FROM wallets w
         CROSS JOIN LATERAL (
           SELECT COALESCE(sum(CASE WHEN t.direction = 'CREDIT' THEN t.amount ELSE -t.amount END), 0)::numeric(14,2)::text AS ledger_balance,
                  count(*)::int AS txn_count,
                  max(t.created_at) AS last_at
             FROM wallet_transactions t
            WHERE t.wallet_id = w.id
         ) l
        WHERE w.customer_id = $1
        LIMIT 1`,
      [customerId],
    );
    const row = res.rows[0];
    if (row === undefined) return null;
    return {
      walletId: row.id,
      status: row.status,
      currency: row.currency,
      ledgerBalance: row.ledger_balance,
      transactionCount: row.txn_count,
      lastTransactionAt: iso(row.last_at),
    };
  },

  async listWalletTransactions(db, walletId, after, limit) {
    // Keyset on (created_at, id) DESC: the cursor carries BOTH columns of the ORDER BY. A cursor
    // on `id` alone skips or repeats rows because uuids are not ordered by time.
    const p = params();
    const wallet = p.add(walletId);
    const cond = timeKeyCondition(after, 't.created_at', 't.id', p.add);
    const lim = p.add(limit + 1);
    const res = await db.query<WalletTransactionRow & { cursor_ts: string }>(
      `SELECT t.*, tu.fiscal_cash_tag, tu.warehouse_id, ${microTs('t.created_at')} AS cursor_ts
         FROM wallet_transactions t
         LEFT JOIN topups tu ON tu.wallet_txn_id = t.id
        WHERE t.wallet_id = ${wallet}::uuid AND ${cond}
        ORDER BY t.created_at DESC, t.id DESC
        LIMIT ${lim}`,
      p.values,
    );
    return fetched(
      res.rows.map((r) => ({ txn: toWalletTransactionResponse(r) as AdminWalletTransaction, cursorTs: r.cursor_ts })),
      limit,
    );
  },

  async findWalletTransaction(db, walletId, txnId) {
    const res = await db.query<WalletTransactionRow>(
      `SELECT t.*, tu.fiscal_cash_tag, tu.warehouse_id
         FROM wallet_transactions t
         LEFT JOIN topups tu ON tu.wallet_txn_id = t.id
        WHERE t.id = $1 AND t.wallet_id = $2
        LIMIT 1`,
      [txnId, walletId],
    );
    const row = res.rows[0];
    return row === undefined ? null : (toWalletTransactionResponse(row) as AdminWalletTransaction);
  },

  async listIssues(db, customerId, args) {
    const p = params();
    const customer = p.add(customerId);
    const wh = warehouseConfinement(args.access, 'o.warehouse_id', p.add);
    const after = timeKeyCondition(args.after, 'rr.created_at', 'rr.id', p.add);
    const limit = p.add(args.limit + 1);
    // return_requests has no warehouse column: the warehouse is the order's (0046 comment).
    const res = await db.query<{
      id: string;
      order_id: string | null;
      order_number: string | null;
      status: string;
      reason: string | null;
      refund_amount: string | null;
      created_at: Date;
      resolved_at: Date | null;
      cursor_ts: string;
    }>(
      `SELECT rr.id, rr.order_id, o.order_number, rr.status::text AS status, rr.reason,
              (SELECT round(sum(oi.unit_price * ri.accepted_qty), 2)::text
                 FROM return_request_items ri JOIN order_items oi ON oi.id = ri.order_item_id
                WHERE ri.return_request_id = rr.id AND ri.accepted_qty IS NOT NULL) AS refund_amount,
              rr.created_at,
              (SELECT min(h.created_at) FROM return_request_status_history h
                WHERE h.return_request_id = rr.id AND h.to_status IN ('REJECTED', 'REFUNDED')) AS resolved_at,
              ${microTs('rr.created_at')} AS cursor_ts
         FROM return_requests rr
         JOIN orders o ON o.id = rr.order_id
        WHERE rr.customer_id = ${customer}::uuid AND ${wh} AND ${after}
        ORDER BY rr.created_at DESC, rr.id DESC
        LIMIT ${limit}`,
      p.values,
    );
    return fetched(
      res.rows.map((r) => ({
        id: r.id,
        orderId: r.order_id,
        orderNumber: r.order_number,
        status: r.status,
        reason: r.reason,
        refundAmount: r.refund_amount,
        createdAt: r.created_at.toISOString(),
        resolvedAt: iso(r.resolved_at),
        cursorTs: r.cursor_ts,
      })),
      args.limit,
    );
  },

  async listTickets(db, customerId, after, limit) {
    const p = params();
    const customer = p.add(customerId);
    const cond = timeKeyCondition(after, 'st.created_at', 'st.id', p.add);
    const lim = p.add(limit + 1);
    const res = await db.query<TicketDbRow>(
      `SELECT ${TICKET_COLUMNS}
         FROM support_tickets st
        WHERE st.customer_id = ${customer}::uuid AND ${cond}
        ORDER BY st.created_at DESC, st.id DESC
        LIMIT ${lim}`,
      p.values,
    );
    return fetched(res.rows.map(toTicket), limit);
  },

  async findTicket(db, customerId, ticketId, forUpdate = false) {
    const res = await db.query<TicketDbRow>(
      `SELECT ${TICKET_COLUMNS}
         FROM support_tickets st
        WHERE st.id = $1 AND st.customer_id = $2
        LIMIT 1 ${forUpdate ? 'FOR UPDATE' : ''}`,
      [ticketId, customerId],
    );
    const row = res.rows[0];
    return row === undefined ? null : toTicket(row);
  },

  async listMessages(db, ticketIds) {
    if (ticketIds.length === 0) return [];
    // senderRole: the ticket's customer is CUSTOMER; anyone else is their highest active role,
    // falling back to the user type. support_messages has no sender_role column of its own.
    const res = await db.query<{
      id: string;
      ticket_id: string;
      sender_user_id: string | null;
      sender_role: string;
      body: string;
      is_internal: boolean;
      attachment_key: string | null;
      created_at: Date;
    }>(
      `SELECT m.id, m.ticket_id, m.sender_user_id,
              CASE WHEN m.sender_user_id = cu.user_id THEN 'CUSTOMER'
                   ELSE COALESCE(
                     (SELECT ur.role_code FROM user_roles ur JOIN roles r ON r.id = ur.role_id
                       WHERE ur.user_id = m.sender_user_id AND (ur.valid_to IS NULL OR ur.valid_to > now())
                       ORDER BY r.hierarchy_level, ur.role_code LIMIT 1),
                     su.user_type::text)
              END AS sender_role,
              m.body, m.is_internal, m.attachment_key, m.created_at
         FROM support_messages m
         JOIN support_tickets st ON st.id = m.ticket_id
         LEFT JOIN customers cu ON cu.id = st.customer_id
         LEFT JOIN users su ON su.id = m.sender_user_id
        WHERE m.ticket_id = ANY($1::uuid[])
        ORDER BY m.created_at, m.id`,
      [ticketIds],
    );
    return res.rows.map((r) => ({
      id: r.id,
      ticketId: r.ticket_id,
      senderUserId: r.sender_user_id,
      senderRole: r.sender_role,
      body: r.body,
      isInternal: r.is_internal,
      attachmentKey: r.attachment_key,
      createdAt: r.created_at.toISOString(),
    }));
  },

  async farmerIdentityTerms(db, customerId, orderIds) {
    const res = await db.query<{ term: string | null; kind: 'term' | 'person' | 'phone' }>(
      `WITH lines AS (
         SELECT oi.batch_id
           FROM order_items oi JOIN orders o ON o.id = oi.order_id
          WHERE (o.customer_id = $1 OR o.id = ANY($2::uuid[])) AND oi.batch_id IS NOT NULL
       ),
       f AS (
         SELECT DISTINCT b.source_farmer_id AS farmer_id
           FROM inventory_batches b JOIN lines l ON l.batch_id = b.id
       )
       SELECT fr.id::text AS term, 'term' AS kind FROM farmers fr JOIN f ON f.farmer_id = fr.id
       UNION SELECT fr.tohfa_farmer_id, 'term' FROM farmers fr JOIN f ON f.farmer_id = fr.id
       UNION SELECT fr.village, 'term' FROM farmers fr JOIN f ON f.farmer_id = fr.id
       UNION SELECT u.full_name, 'person' FROM farmers fr JOIN f ON f.farmer_id = fr.id JOIN users u ON u.id = fr.user_id
       UNION SELECT u.mobile, 'phone' FROM farmers fr JOIN f ON f.farmer_id = fr.id JOIN users u ON u.id = fr.user_id
       UNION SELECT fm.name, 'term' FROM farms fm JOIN f ON f.farmer_id = fm.farmer_id
       UNION SELECT fm.village, 'term' FROM farms fm JOIN f ON f.farmer_id = fm.farmer_id
       UNION SELECT fm.survey_number, 'term' FROM farms fm JOIN f ON f.farmer_id = fm.farmer_id
       UNION SELECT fm.centroid_lat::text, 'term' FROM farms fm JOIN f ON f.farmer_id = fm.farmer_id
       UNION SELECT fm.centroid_lng::text, 'term' FROM farms fm JOIN f ON f.farmer_id = fm.farmer_id
       UNION SELECT b.batch_code, 'term' FROM inventory_batches b JOIN lines l ON l.batch_id = b.id`,
      [customerId, orderIds],
    );
    const terms: string[] = [];
    const personNames: string[] = [];
    const phones: string[] = [];
    for (const row of res.rows) {
      if (row.term === null) continue;
      if (row.kind === 'person') personNames.push(row.term);
      else if (row.kind === 'phone') phones.push(row.term);
      else terms.push(row.term);
    }
    return { terms, personNames, phones };
  },

  async customerContact(db, customerId) {
    const res = await db.query<{ mobile: string; email: string | null }>(
      `SELECT u.mobile, u.email FROM customers c JOIN users u ON u.id = c.user_id WHERE c.id = $1`,
      [customerId],
    );
    return res.rows[0] ?? null;
  },

  async insertMessage(db, input) {
    const res = await db.query<{ id: string; created_at: Date }>(
      `INSERT INTO support_messages (ticket_id, sender_user_id, body, attachment_key, is_internal)
       VALUES ($1, $2, $3, $4, false)
       RETURNING id, created_at`,
      [input.ticketId, input.senderUserId, input.body, input.attachmentKey],
    );
    const row = res.rows[0];
    if (row === undefined) throw new Error('support_messages insert returned no row');
    return { id: row.id, createdAt: row.created_at.toISOString() };
  },
};

interface TicketDbRow {
  id: string;
  ticket_number: string;
  order_id: string | null;
  category: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  resolved_at: Date | null;
  created_at: Date;
  updated_at: Date;
  cursor_ts: string;
}

const TICKET_COLUMNS = `st.id, st.ticket_number, st.order_id, st.category, st.subject, st.description, st.status,
  st.priority, st.resolved_at, st.created_at, COALESCE(st.updated_at, st.created_at) AS updated_at,
  ${microTs('st.created_at')} AS cursor_ts`;

function toTicket(row: TicketDbRow): TicketRow {
  return {
    id: row.id,
    ticketNumber: row.ticket_number,
    orderId: row.order_id,
    category: row.category,
    subject: row.subject,
    description: row.description,
    status: row.status,
    priority: row.priority,
    resolvedAt: iso(row.resolved_at),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    cursorTs: row.cursor_ts,
  };
}
