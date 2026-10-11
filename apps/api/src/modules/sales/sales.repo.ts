/**
 * SWA Module 6 (Direct / Market sales): SQL only. Every function takes an `Executor` so the sale
 * service can run them all inside one transaction (BR-87).
 *
 * FARM ANONYMITY (BR-16, BR-90): no query in this file selects `inventory_batches.source_farmer_id`,
 * `goods_receipts.farmer_id`, or joins farmers / farms. Rows are mapped to camelCase domain shapes
 * here and the service serialises them through an allow-list.
 *
 * STOCK POLICY (BR-95; owner decision 2026-10-11, see the service header):
 *   sellable(DIRECT, batch)  = qty_available
 *                              - stock held by pending DIRECT and MARKET UPI sales on the batch
 *                              (NOT net of any allocation: a counter sale may take the whole batch)
 *   sellable(MARKET, batch)  = LIVE_MARKET allocation available_qty
 *                              - stock held by pending MARKET UPI sales on that allocation
 *                              (and never more than the batch's own unheld qty_available)
 * Only ACTIVE, unexpired (Asia/Kolkata day), non-REJECT batches whose GRN (if any) is not rejected or
 * still in QC are candidates (BR-89e). FEFO order: expiry_on, received_on, created_at, id.
 */
import { parseMoney, type Money } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import type { Grade, SaleChannel, SalePaymentMethod } from './sales.schema.js';

/** Asia/Kolkata calendar day, the day every date rule on this platform uses. */
const TODAY_IST = `(now() AT TIME ZONE 'Asia/Kolkata')::date`;

/** GRN states whose stock is not sellable yet (or ever): rejected, or still awaiting quality check. */
const UNSELLABLE_GRN_STATES = `('REJECTED', 'AWAITING_QC', 'QC_PENDING')`;

const CANDIDATE_BATCH = `
      b.status = 'ACTIVE'
  AND b.grade <> 'REJECT'
  AND (b.expiry_on IS NULL OR b.expiry_on >= ${TODAY_IST})
  AND NOT EXISTS (
        SELECT 1 FROM goods_receipts g
         WHERE g.id = b.goods_receipt_id AND g.status::text IN ${UNSELLABLE_GRN_STATES})`;

/**
 * Stock held by unconfirmed UPI sales (BR-94): their order_items already name the batch (and for
 * MARKET the allocation) chosen at create, but no SALE ledger row exists until the confirm.
 */
const HOLDS_CTE = (warehouseParam: string): string => `
  holds AS (
    SELECT oi.batch_id, oi.allocation_id, SUM(oi.qty_kg) AS qty
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
     WHERE o.status = 'PENDING_PAYMENT'
       AND o.channel IN ('DIRECT', 'MARKET')
       AND o.warehouse_id = ${warehouseParam}
       AND oi.batch_id IS NOT NULL
       AND oi.status = 'PENDING'
     GROUP BY oi.batch_id, oi.allocation_id
  )`;

/** Per-batch sellable quantity for a channel. Parameter $1 is always the warehouse id. */
function sellableCte(channel: SaleChannel): string {
  if (channel === 'DIRECT') {
    return `
  sellable AS (
    SELECT b.id AS batch_id, NULL::uuid AS allocation_id, b.crop_id, b.grade, b.batch_code,
           b.storage_location, b.expiry_on, b.received_on, b.created_at,
           -- Owner decision 2026-10-11: no allocation is subtracted. Every pending UPI hold on the
           -- batch is, DIRECT and MARKET alike, because both will become SALE ledger rows here.
           GREATEST(0,
             b.qty_available
             - COALESCE((SELECT SUM(h.qty) FROM holds h WHERE h.batch_id = b.id), 0)
           ) AS sellable_qty
      FROM inventory_batches b
     WHERE b.warehouse_id = $1 AND ${CANDIDATE_BATCH}
  )`;
  }
  return `
  sellable AS (
    SELECT b.id AS batch_id, a.id AS allocation_id, b.crop_id, b.grade, b.batch_code,
           b.storage_location, b.expiry_on, b.received_on, b.created_at,
           GREATEST(0, LEAST(
             a.available_qty - COALESCE((SELECT SUM(h.qty) FROM holds h WHERE h.allocation_id = a.id), 0),
             b.qty_available - COALESCE((SELECT SUM(h.qty) FROM holds h WHERE h.batch_id = b.id), 0)
           )) AS sellable_qty
      FROM allocations a
      JOIN inventory_batches b ON b.id = a.batch_id
     WHERE a.channel = 'LIVE_MARKET' AND a.warehouse_id = $1 AND b.warehouse_id = $1 AND ${CANDIDATE_BATCH}
  )`;
}

const FEFO_ORDER = 's.expiry_on ASC NULLS LAST, s.received_on ASC, s.created_at ASC, s.batch_id ASC';

/** The active retail price, else the active fair-price ceiling (Asia/Kolkata day). */
const PRICE_CTES = `
  active_retail AS (
    SELECT DISTINCT ON (crop_id, grade) crop_id, grade, price
      FROM retail_prices
     WHERE effective_from <= ${TODAY_IST} AND (effective_to IS NULL OR effective_to > ${TODAY_IST})
     ORDER BY crop_id, grade, effective_from DESC
  ),
  active_ceiling AS (
    SELECT DISTINCT ON (crop_id, grade) crop_id, grade, ceiling_price
      FROM fair_prices
     WHERE effective_from <= ${TODAY_IST} AND (effective_to IS NULL OR effective_to > ${TODAY_IST})
     ORDER BY crop_id, grade, effective_from DESC
  )`;

// ---------------------------------------------------------------------------
// Domain shapes
// ---------------------------------------------------------------------------

export interface ProductRow {
  productId: string;
  name: string;
  categoryId: string;
  grade: Grade;
  unitPrice: Money;
  availableQtyKg: string;
  batchCode: string | null;
  storageLocation: string | null;
}

export interface ProductCursor {
  name: string;
  productId: string;
  grade: Grade;
}

export interface ProductRef {
  id: string;
  name: string;
}

export interface SellableBatchRow {
  batchId: string;
  allocationId: string | null;
  sellableQtyKg: string;
}

export interface CustomerMatchRow {
  customerId: string;
  customerCode: string;
  name: string;
  mobile: string;
  walletBalance: Money;
}

export interface SaleCustomerRow {
  id: string;
  customerCode: string;
  name: string;
  mobile: string;
}

export type CustomerMatch =
  | { kind: 'mobile'; digits: string }
  | { kind: 'code'; code: string }
  | { kind: 'q'; text: string };

export interface OrderInsert {
  orderNumber: string;
  customerId: string | null;
  walkInName: string | null;
  walkInMobile: string | null;
  warehouseId: string;
  channel: SaleChannel;
  subtotal: Money;
  gstAmount: Money;
  totalAmount: Money;
  paymentMethod: SalePaymentMethod;
  completed: boolean;
}

export interface OrderItemInsert {
  orderId: string;
  productId: string;
  grade: Grade;
  qtyKg: string;
  unitPrice: Money;
  gstRatePercent: string;
  lineTotal: Money;
  batchId: string;
  allocationId: string | null;
  completed: boolean;
}

export interface PaymentInsert {
  orderId: string;
  method: SalePaymentMethod;
  amount: Money;
  amountReceived: Money | null;
  changeGiven: Money | null;
  cardRef: string | null;
  status: 'PENDING' | 'CONFIRMED';
  idempotencyKey: string;
  createdBy: string;
}

export interface SaleHeaderRow {
  id: string;
  warehouseId: string;
  channel: SaleChannel;
  status: string;
  paymentStatus: string;
  customerId: string | null;
  totalAmount: Money;
  gstAmount: Money;
  paymentId: string | null;
  paymentMethod: SalePaymentMethod | null;
  paymentStatusDetail: 'PENDING' | 'CONFIRMED' | 'FAILED' | null;
}

export interface SaleItemRow {
  productId: string;
  name: string;
  grade: Grade;
  qtyKg: string;
  unitPrice: Money;
  lineTotal: Money;
  gstRatePercent: string;
  batchId: string | null;
  allocationId: string | null;
}

export interface SaleRecord {
  id: string;
  orderNumber: string;
  channel: SaleChannel;
  status: string;
  paymentStatus: string;
  warehouseId: string;
  customerId: string | null;
  customerCode: string | null;
  customerName: string | null;
  customerMobile: string | null;
  walkInName: string | null;
  walkInMobile: string | null;
  subtotal: Money;
  gstAmount: Money;
  totalAmount: Money;
  createdAt: Date;
  completedAt: Date | null;
  items: SaleItemRow[];
  payment: {
    method: SalePaymentMethod;
    status: 'PENDING' | 'CONFIRMED' | 'FAILED';
    amount: Money;
    amountReceived: Money | null;
    changeGiven: Money | null;
    cardRef: string | null;
    upiTxnRef: string | null;
    confirmedAt: Date | null;
  } | null;
  invoiceId: string | null;
  invoiceNumber: string | null;
}

export interface AttemptInsert {
  warehouseId: string;
  actorId: string;
  reasonCode: string;
  payload: Record<string, unknown>;
}

export interface SalesRepo {
  /** The raw system_config value for `key`, or `undefined` when the row is missing. */
  configValue(db: Executor, key: string): Promise<unknown>;
  activeWarehouseExists(db: Executor, warehouseId: string): Promise<boolean>;
  /** Up to `limit + 1` sellable products, keyset-paged by (name, productId, grade). */
  listProducts(
    db: Executor,
    args: { warehouseId: string; channel: SaleChannel; q?: string | undefined; limit: number; after?: ProductCursor | undefined },
  ): Promise<ProductRow[]>;
  findActiveProduct(db: Executor, productId: string): Promise<ProductRef | null>;
  /** Whether the warehouse has ever held a batch of this product and grade (404 vs 409). */
  warehouseStocksProduct(db: Executor, warehouseId: string, productId: string, grade: Grade): Promise<boolean>;
  activePrice(db: Executor, productId: string, grade: Grade): Promise<Money | null>;
  /**
   * Row-locks (FOR UPDATE) every ACTIVE batch of the product/grade at the warehouse, and for MARKET
   * the LIVE_MARKET allocation rows on them, in id order. Run it BEFORE `sellableBatches` inside the
   * sale transaction so the availability read sees every sale that committed while we waited.
   */
  lockStock(db: Executor, warehouseId: string, channel: SaleChannel, productId: string, grade: Grade): Promise<void>;
  /** Candidate batches in FEFO order with what the channel may sell from each. */
  sellableBatches(db: Executor, warehouseId: string, channel: SaleChannel, productId: string, grade: Grade): Promise<SellableBatchRow[]>;
  lookupCustomers(db: Executor, match: CustomerMatch, visibleWarehouses: string[] | null): Promise<CustomerMatchRow[]>;
  findCustomerForSale(db: Executor, customerId: string, visibleWarehouses: string[] | null): Promise<SaleCustomerRow | null>;
  nextSaleNumber(db: Executor): Promise<string>;
  insertOrder(db: Executor, order: OrderInsert): Promise<string>;
  insertOrderItem(db: Executor, item: OrderItemInsert): Promise<void>;
  insertStatusHistory(db: Executor, orderId: string, from: string | null, to: string, actorId: string, note: string): Promise<void>;
  insertPayment(db: Executor, payment: PaymentInsert): Promise<string>;
  insertSaleLedger(db: Executor, row: { batchId: string; warehouseId: string; qtyKg: string; orderId: string; actorId: string }): Promise<void>;
  consumeAllocation(db: Executor, allocationId: string, qtyKg: string): Promise<void>;
  /** The sale header, row-locked FOR UPDATE, when it is a DIRECT/MARKET sale inside `visibleWarehouses`. */
  lockSale(db: Executor, saleId: string, visibleWarehouses: string[] | null): Promise<SaleHeaderRow | null>;
  findSaleHeader(db: Executor, saleId: string, visibleWarehouses: string[] | null): Promise<SaleHeaderRow | null>;
  saleItems(db: Executor, orderId: string): Promise<SaleItemRow[]>;
  completeOrder(db: Executor, orderId: string): Promise<void>;
  confirmPayment(db: Executor, paymentId: string, upiTxnRef: string): Promise<void>;
  loadSale(db: Executor, orderId: string): Promise<SaleRecord | null>;
  insertAttempt(db: Executor, attempt: AttemptInsert): Promise<void>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** `$n` scope predicate for a customer `c`: BR-91 / D8 visibility at the given warehouses. */
function customerVisibility(visibleWarehouses: string[] | null, params: unknown[]): string {
  if (visibleWarehouses === null) return 'TRUE';
  params.push(visibleWarehouses);
  const p = `$${params.length}::uuid[]`;
  return `(
        c.preferred_warehouse_id = ANY(${p})
     OR EXISTS (SELECT 1 FROM orders vo WHERE vo.customer_id = c.id AND vo.warehouse_id = ANY(${p}))
     OR EXISTS (SELECT 1 FROM topups vt WHERE vt.customer_id = c.id AND vt.status = 'SUCCESS' AND vt.warehouse_id = ANY(${p}))
  )`;
}

function warehouseVisibility(column: string, visibleWarehouses: string[] | null, params: unknown[]): string {
  if (visibleWarehouses === null) return 'TRUE';
  params.push(visibleWarehouses);
  return `${column} = ANY($${params.length}::uuid[])`;
}

function money(value: string): Money {
  return parseMoney(value);
}

function nullableMoney(value: string | null): Money | null {
  return value === null ? null : parseMoney(value);
}

interface HeaderDbRow {
  id: string;
  warehouse_id: string;
  channel: SaleChannel;
  status: string;
  payment_status: string;
  customer_id: string | null;
  total_amount: string;
  gst_amount: string;
  payment_id: string | null;
  payment_method: SalePaymentMethod | null;
  payment_state: 'PENDING' | 'CONFIRMED' | 'FAILED' | null;
}

function toHeader(row: HeaderDbRow): SaleHeaderRow {
  return {
    id: row.id,
    warehouseId: row.warehouse_id,
    channel: row.channel,
    status: row.status,
    paymentStatus: row.payment_status,
    customerId: row.customer_id,
    totalAmount: money(row.total_amount),
    gstAmount: money(row.gst_amount),
    paymentId: row.payment_id,
    paymentMethod: row.payment_method,
    paymentStatusDetail: row.payment_state,
  };
}

const HEADER_SELECT = `
  SELECT o.id, o.warehouse_id, o.channel, o.status::text AS status, o.payment_status, o.customer_id,
         o.total_amount::text AS total_amount, o.gst_amount::text AS gst_amount,
         p.id AS payment_id, p.method::text AS payment_method, p.status AS payment_state
    FROM orders o
    LEFT JOIN LATERAL (
      SELECT sp.id, sp.method, sp.status FROM sale_payments sp
       WHERE sp.order_id = o.id ORDER BY sp.created_at DESC, sp.id DESC LIMIT 1
    ) p ON TRUE`;

interface ItemDbRow {
  product_id: string;
  name: string;
  grade: Grade;
  qty_kg: string;
  unit_price: string;
  line_total: string;
  gst_rate: string;
  batch_id: string | null;
  allocation_id: string | null;
}

function toItem(row: ItemDbRow): SaleItemRow {
  return {
    productId: row.product_id,
    name: row.name,
    grade: row.grade,
    qtyKg: row.qty_kg,
    unitPrice: money(row.unit_price),
    lineTotal: money(row.line_total),
    gstRatePercent: row.gst_rate,
    batchId: row.batch_id,
    allocationId: row.allocation_id,
  };
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export const salesRepo: SalesRepo = {
  async configValue(db, key) {
    const result = await db.query<{ value: unknown }>(`SELECT value FROM system_config WHERE key = $1 LIMIT 1`, [key]);
    return result.rows.length === 0 ? undefined : result.rows[0]!.value;
  },

  async activeWarehouseExists(db, warehouseId) {
    const result = await db.query(`SELECT 1 FROM warehouses WHERE id = $1 AND is_active AND deleted_at IS NULL`, [warehouseId]);
    return (result.rowCount ?? 0) > 0;
  },

  async listProducts(db, { warehouseId, channel, q, limit, after }) {
    const params: unknown[] = [warehouseId];
    const conditions: string[] = ['cm.deleted_at IS NULL', 'cm.is_active'];
    if (q !== undefined) {
      params.push(`%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`);
      conditions.push(`cm.name ILIKE $${params.length}`);
    }
    if (after !== undefined) {
      params.push(after.name, after.productId, after.grade);
      const n = params.length;
      conditions.push(`(cm.name, cm.id, agg.grade::text) > ($${n - 2}, $${n - 1}::uuid, $${n})`);
    }
    params.push(limit + 1);
    const limitParam = `$${params.length}`;

    const result = await db.query<{
      product_id: string;
      name: string;
      category_id: string;
      grade: Grade;
      unit_price: string;
      available_qty: string;
      batch_code: string | null;
      storage_location: string | null;
    }>(
      `WITH ${HOLDS_CTE('$1')},
       ${sellableCte(channel)},
       ${PRICE_CTES},
       agg AS (
         SELECT s.crop_id, s.grade, SUM(s.sellable_qty) AS available_qty,
                (ARRAY_AGG(s.batch_code ORDER BY ${FEFO_ORDER}) FILTER (WHERE s.sellable_qty > 0))[1] AS batch_code,
                (ARRAY_AGG(s.storage_location ORDER BY ${FEFO_ORDER}) FILTER (WHERE s.sellable_qty > 0))[1] AS storage_location
           FROM sellable s
          GROUP BY s.crop_id, s.grade
         HAVING SUM(s.sellable_qty) > 0
       )
       SELECT cm.id AS product_id, cm.name, cm.category_id, agg.grade,
              COALESCE(ar.price, ac.ceiling_price)::text AS unit_price,
              agg.available_qty::text AS available_qty, agg.batch_code, agg.storage_location
         FROM agg
         JOIN crop_master cm ON cm.id = agg.crop_id
         LEFT JOIN active_retail ar ON ar.crop_id = agg.crop_id AND ar.grade = agg.grade
         LEFT JOIN active_ceiling ac ON ac.crop_id = agg.crop_id AND ac.grade = agg.grade
        WHERE ${conditions.join(' AND ')}
          -- Unpriced stock is not sellable: no retail price and no ceiling means no price at all,
          -- and inventing one (the catalog's '50.00') would sell at a made-up price.
          AND COALESCE(ar.price, ac.ceiling_price) IS NOT NULL
        ORDER BY cm.name, cm.id, agg.grade::text
        LIMIT ${limitParam}`,
      params,
    );
    return result.rows.map((row) => ({
      productId: row.product_id,
      name: row.name,
      categoryId: row.category_id,
      grade: row.grade,
      unitPrice: money(row.unit_price),
      availableQtyKg: row.available_qty,
      batchCode: row.batch_code,
      storageLocation: row.storage_location,
    }));
  },

  async findActiveProduct(db, productId) {
    const result = await db.query<{ id: string; name: string }>(
      `SELECT id, name FROM crop_master WHERE id = $1 AND is_active AND deleted_at IS NULL`,
      [productId],
    );
    return result.rows[0] ?? null;
  },

  async warehouseStocksProduct(db, warehouseId, productId, grade) {
    const result = await db.query(
      `SELECT 1 FROM inventory_batches WHERE warehouse_id = $1 AND crop_id = $2 AND grade = $3::produce_grade LIMIT 1`,
      [warehouseId, productId, grade],
    );
    return (result.rowCount ?? 0) > 0;
  },

  async activePrice(db, productId, grade) {
    const result = await db.query<{ price: string | null }>(
      `WITH ${PRICE_CTES}
       SELECT COALESCE(
                (SELECT price FROM active_retail WHERE crop_id = $1 AND grade = $2::produce_grade),
                (SELECT ceiling_price FROM active_ceiling WHERE crop_id = $1 AND grade = $2::produce_grade)
              )::text AS price`,
      [productId, grade],
    );
    const price = result.rows[0]?.price ?? null;
    return price === null ? null : money(price);
  },

  async lockStock(db, warehouseId, channel, productId, grade) {
    await db.query(
      `SELECT b.id FROM inventory_batches b
        WHERE b.warehouse_id = $1 AND b.crop_id = $2 AND b.grade = $3::produce_grade AND b.status = 'ACTIVE'
        ORDER BY b.id
        FOR UPDATE`,
      [warehouseId, productId, grade],
    );
    if (channel === 'MARKET') {
      await db.query(
        `SELECT a.id FROM allocations a
           JOIN inventory_batches b ON b.id = a.batch_id
          WHERE a.warehouse_id = $1 AND a.channel = 'LIVE_MARKET'
            AND b.crop_id = $2 AND b.grade = $3::produce_grade AND b.status = 'ACTIVE'
          ORDER BY a.id
          FOR UPDATE OF a`,
        [warehouseId, productId, grade],
      );
    }
  },

  async sellableBatches(db, warehouseId, channel, productId, grade) {
    const result = await db.query<{ batch_id: string; allocation_id: string | null; sellable_qty: string }>(
      `WITH ${HOLDS_CTE('$1')},
       ${sellableCte(channel)}
       SELECT s.batch_id, s.allocation_id, s.sellable_qty::text AS sellable_qty
         FROM sellable s
        WHERE s.crop_id = $2 AND s.grade = $3::produce_grade
        ORDER BY ${FEFO_ORDER}`,
      [warehouseId, productId, grade],
    );
    return result.rows.map((row) => ({
      batchId: row.batch_id,
      allocationId: row.allocation_id,
      sellableQtyKg: row.sellable_qty,
    }));
  },

  async lookupCustomers(db, match, visibleWarehouses) {
    const params: unknown[] = [];
    let matchSql: string;
    if (match.kind === 'code') {
      params.push(match.code);
      matchSql = `lower(c.customer_code) = lower($${params.length})`;
    } else if (match.kind === 'mobile') {
      // Compare the last 10 digits, so "+919876543210", "919876543210" and "9876543210" all match.
      params.push(match.digits.slice(-10));
      matchSql = `right(regexp_replace(u.mobile, '[^0-9]', '', 'g'), 10) = $${params.length}`;
    } else {
      const escaped = match.text.replace(/[\\%_]/g, (ch) => `\\${ch}`);
      params.push(`%${escaped}%`);
      const like = `$${params.length}`;
      const digits = match.text.replace(/[^0-9]/g, '');
      const mobileClause =
        digits.length >= 4 ? ` OR regexp_replace(u.mobile, '[^0-9]', '', 'g') LIKE '%' || $${params.push(digits)}` : '';
      matchSql = `(u.full_name ILIKE ${like} OR c.customer_code ILIKE ${like}${mobileClause})`;
    }
    const scopeSql = customerVisibility(visibleWarehouses, params);
    const result = await db.query<{
      customer_id: string;
      customer_code: string;
      full_name: string;
      mobile: string;
      balance: string | null;
    }>(
      `SELECT c.id AS customer_id, c.customer_code, u.full_name, u.mobile, w.balance::text AS balance
         FROM customers c
         JOIN users u ON u.id = c.user_id
         LEFT JOIN wallets w ON w.customer_id = c.id AND w.owner_type = 'CUSTOMER'
        WHERE c.deleted_at IS NULL AND ${matchSql} AND ${scopeSql}
        ORDER BY u.full_name, c.id
        LIMIT 20`,
      params,
    );
    return result.rows.map((row) => ({
      customerId: row.customer_id,
      customerCode: row.customer_code,
      name: row.full_name,
      mobile: row.mobile,
      walletBalance: money(row.balance ?? '0.00'),
    }));
  },

  async findCustomerForSale(db, customerId, visibleWarehouses) {
    const params: unknown[] = [customerId];
    const scopeSql = customerVisibility(visibleWarehouses, params);
    const result = await db.query<{ id: string; customer_code: string; full_name: string; mobile: string }>(
      `SELECT c.id, c.customer_code, u.full_name, u.mobile
         FROM customers c
         JOIN users u ON u.id = c.user_id
        WHERE c.id = $1 AND c.deleted_at IS NULL AND ${scopeSql}`,
      params,
    );
    const row = result.rows[0];
    return row === undefined ? null : { id: row.id, customerCode: row.customer_code, name: row.full_name, mobile: row.mobile };
  },

  async nextSaleNumber(db) {
    // The same sequence and format as an online order (orders.repo.ts generateOrderNumber), so a
    // sale number and an order number can never collide. The sequence is owned by migration 0064.
    const result = await db.query<{ yr: string; num: string }>(
      `SELECT to_char(${TODAY_IST}, 'YYYY') AS yr, LPAD(nextval('order_number_seq')::text, 6, '0') AS num`,
    );
    const { yr, num } = result.rows[0]!;
    return `TOH-${yr}-${num}`;
  },

  async insertOrder(db, order) {
    const result = await db.query<{ id: string }>(
      `INSERT INTO orders (
         order_number, customer_id, walk_in_name, walk_in_mobile, warehouse_id, channel,
         fulfilment_type, subtotal, delivery_fee, discount, gst_amount, total_amount,
         payment_method, payment_status, status, placed_at, completed_at
       ) VALUES (
         $1, $2, $3, $4, $5, $6,
         'PICKUP', $7::numeric, 0, 0, $8::numeric, $9::numeric,
         $10::payment_method,
         CASE WHEN $11::boolean THEN 'PAID' ELSE 'PENDING' END,
         CASE WHEN $11::boolean THEN 'PICKED_UP'::order_status ELSE 'PENDING_PAYMENT'::order_status END,
         now(),
         CASE WHEN $11::boolean THEN now() ELSE NULL END
       ) RETURNING id`,
      [
        order.orderNumber,
        order.customerId,
        order.walkInName,
        order.walkInMobile,
        order.warehouseId,
        order.channel,
        order.subtotal,
        order.gstAmount,
        order.totalAmount,
        order.paymentMethod,
        order.completed,
      ],
    );
    return result.rows[0]!.id;
  },

  async insertOrderItem(db, item) {
    await db.query(
      `INSERT INTO order_items (
         order_id, crop_id, grade, qty_kg, unit_price, gst_rate, gst_amount, line_total,
         fulfilled_qty_kg, batch_id, allocation_id, status
       ) VALUES (
         $1, $2, $3::produce_grade, $4::numeric, $5::numeric, $6::numeric, 0, $7::numeric,
         CASE WHEN $10::boolean THEN $4::numeric ELSE 0 END, $8, $9,
         CASE WHEN $10::boolean THEN 'FULFILLED' ELSE 'PENDING' END
       )`,
      [
        item.orderId,
        item.productId,
        item.grade,
        item.qtyKg,
        item.unitPrice,
        item.gstRatePercent,
        item.lineTotal,
        item.batchId,
        item.allocationId,
        item.completed,
      ],
    );
  },

  async insertStatusHistory(db, orderId, from, to, actorId, note) {
    await db.query(
      `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, note)
       VALUES ($1, $2::order_status, $3::order_status, $4, $5)`,
      [orderId, from, to, actorId, note],
    );
  },

  async insertPayment(db, payment) {
    const result = await db.query<{ id: string }>(
      `INSERT INTO sale_payments (
         order_id, method, amount, amount_received, change_given, card_ref, status,
         idempotency_key, created_by, confirmed_at
       ) VALUES (
         $1, $2::payment_method, $3::numeric, $4::numeric, $5::numeric, $6, $7, $8, $9,
         CASE WHEN $7 = 'CONFIRMED' THEN now() ELSE NULL END
       ) RETURNING id`,
      [
        payment.orderId,
        payment.method,
        payment.amount,
        payment.amountReceived,
        payment.changeGiven,
        payment.cardRef,
        payment.status,
        payment.idempotencyKey,
        payment.createdBy,
      ],
    );
    return result.rows[0]!.id;
  },

  async insertSaleLedger(db, row) {
    // balance_after is computed by trg_stock_ledger_balance under a row lock; qty_available is
    // maintained by trg_stock_ledger_apply. Nothing here writes a balance column (CLAUDE.md 2.3).
    await db.query(
      `INSERT INTO stock_ledger (
         batch_id, warehouse_id, movement_type, qty_delta, balance_after, ref_type, ref_id, remarks, created_by
       ) VALUES ($1, $2, 'SALE', -($3::numeric), 0, 'ORDER', $4, 'Direct/Market sale', $5)`,
      [row.batchId, row.warehouseId, row.qtyKg, row.orderId, row.actorId],
    );
  },

  async consumeAllocation(db, allocationId, qtyKg) {
    // allocations_not_oversold_chk (consumed + reserved <= allocated) is the backstop.
    await db.query(
      `UPDATE allocations SET consumed_qty = consumed_qty + $2::numeric, updated_at = now() WHERE id = $1`,
      [allocationId, qtyKg],
    );
  },

  async lockSale(db, saleId, visibleWarehouses) {
    const params: unknown[] = [saleId];
    const scopeSql = warehouseVisibility('o.warehouse_id', visibleWarehouses, params);
    await db.query(
      `SELECT o.id FROM orders o
        WHERE o.id = $1 AND o.channel IN ('DIRECT', 'MARKET') AND ${scopeSql}
        FOR UPDATE`,
      params,
    );
    return salesRepo.findSaleHeader(db, saleId, visibleWarehouses);
  },

  async findSaleHeader(db, saleId, visibleWarehouses) {
    const params: unknown[] = [saleId];
    const scopeSql = warehouseVisibility('o.warehouse_id', visibleWarehouses, params);
    const result = await db.query<HeaderDbRow>(
      `${HEADER_SELECT}
        WHERE o.id = $1 AND o.channel IN ('DIRECT', 'MARKET') AND ${scopeSql}`,
      params,
    );
    const row = result.rows[0];
    return row === undefined ? null : toHeader(row);
  },

  async saleItems(db, orderId) {
    const result = await db.query<ItemDbRow>(
      `SELECT oi.crop_id AS product_id, cm.name, oi.grade, oi.qty_kg::text AS qty_kg,
              oi.unit_price::text AS unit_price, oi.line_total::text AS line_total, oi.gst_rate::text AS gst_rate,
              oi.batch_id, oi.allocation_id
         FROM order_items oi
         JOIN crop_master cm ON cm.id = oi.crop_id
        WHERE oi.order_id = $1
        ORDER BY cm.name, oi.crop_id, oi.grade, oi.batch_id`,
      [orderId],
    );
    return result.rows.map(toItem);
  },

  async completeOrder(db, orderId) {
    await db.query(
      `UPDATE orders
          SET status = 'PICKED_UP', payment_status = 'PAID', completed_at = now(), updated_at = now()
        WHERE id = $1`,
      [orderId],
    );
    await db.query(
      `UPDATE order_items
          SET status = 'FULFILLED', fulfilled_qty_kg = qty_kg, updated_at = now()
        WHERE order_id = $1 AND status = 'PENDING'`,
      [orderId],
    );
  },

  async confirmPayment(db, paymentId, upiTxnRef) {
    await db.query(
      `UPDATE sale_payments
          SET status = 'CONFIRMED', upi_txn_ref = $2, confirmed_at = now()
        WHERE id = $1 AND status = 'PENDING'`,
      [paymentId, upiTxnRef],
    );
  },

  async loadSale(db, orderId) {
    const header = await db.query<{
      id: string;
      order_number: string;
      channel: SaleChannel;
      status: string;
      payment_status: string;
      warehouse_id: string;
      customer_id: string | null;
      customer_code: string | null;
      customer_name: string | null;
      customer_mobile: string | null;
      walk_in_name: string | null;
      walk_in_mobile: string | null;
      subtotal: string;
      gst_amount: string;
      total_amount: string;
      created_at: Date;
      completed_at: Date | null;
      invoice_id: string | null;
      invoice_number: string | null;
      p_method: SalePaymentMethod | null;
      p_status: 'PENDING' | 'CONFIRMED' | 'FAILED' | null;
      p_amount: string | null;
      p_amount_received: string | null;
      p_change_given: string | null;
      p_card_ref: string | null;
      p_upi_txn_ref: string | null;
      p_confirmed_at: Date | null;
    }>(
      `SELECT o.id, o.order_number, o.channel, o.status::text AS status, o.payment_status, o.warehouse_id,
              o.customer_id, c.customer_code, u.full_name AS customer_name, u.mobile AS customer_mobile,
              o.walk_in_name, o.walk_in_mobile,
              o.subtotal::text AS subtotal, o.gst_amount::text AS gst_amount, o.total_amount::text AS total_amount,
              o.created_at, o.completed_at,
              inv.id AS invoice_id, inv.invoice_number,
              p.method::text AS p_method, p.status AS p_status, p.amount::text AS p_amount,
              p.amount_received::text AS p_amount_received, p.change_given::text AS p_change_given,
              p.card_ref AS p_card_ref, p.upi_txn_ref AS p_upi_txn_ref, p.confirmed_at AS p_confirmed_at
         FROM orders o
         LEFT JOIN customers c ON c.id = o.customer_id
         LEFT JOIN users u ON u.id = c.user_id
         LEFT JOIN LATERAL (
           SELECT i.id, i.invoice_number FROM invoices i
            WHERE i.order_id = o.id AND i.invoice_type = 'SALE_RETAIL' AND i.status <> 'CANCELLED'
            ORDER BY i.created_at DESC LIMIT 1
         ) inv ON TRUE
         LEFT JOIN LATERAL (
           SELECT sp.* FROM sale_payments sp WHERE sp.order_id = o.id ORDER BY sp.created_at DESC, sp.id DESC LIMIT 1
         ) p ON TRUE
        WHERE o.id = $1`,
      [orderId],
    );
    const row = header.rows[0];
    if (row === undefined) return null;
    const items = await salesRepo.saleItems(db, orderId);
    return {
      id: row.id,
      orderNumber: row.order_number,
      channel: row.channel,
      status: row.status,
      paymentStatus: row.payment_status,
      warehouseId: row.warehouse_id,
      customerId: row.customer_id,
      customerCode: row.customer_code,
      customerName: row.customer_name,
      customerMobile: row.customer_mobile,
      walkInName: row.walk_in_name,
      walkInMobile: row.walk_in_mobile,
      subtotal: money(row.subtotal),
      gstAmount: money(row.gst_amount),
      totalAmount: money(row.total_amount),
      createdAt: row.created_at,
      completedAt: row.completed_at,
      items,
      payment:
        row.p_method === null || row.p_status === null || row.p_amount === null
          ? null
          : {
              method: row.p_method,
              status: row.p_status,
              amount: money(row.p_amount),
              amountReceived: nullableMoney(row.p_amount_received),
              changeGiven: nullableMoney(row.p_change_given),
              cardRef: row.p_card_ref,
              upiTxnRef: row.p_upi_txn_ref,
              confirmedAt: row.p_confirmed_at,
            },
      invoiceId: row.invoice_id,
      invoiceNumber: row.invoice_number,
    };
  },

  async insertAttempt(db, attempt) {
    await db.query(
      `INSERT INTO sale_attempts (warehouse_id, actor_id, reason_code, payload) VALUES ($1, $2, $3, $4::jsonb)`,
      [attempt.warehouseId, attempt.actorId, attempt.reasonCode, JSON.stringify(attempt.payload)],
    );
  },
};
