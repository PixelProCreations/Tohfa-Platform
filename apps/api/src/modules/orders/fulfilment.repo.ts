import type { Executor } from '../../db/pool.js';
import type {
  AdminOrdersQuery,
  AdminOrderSummary,
  AdminOrderDetail,
  OrderTracking,
  OrderTrackingEvent,
} from './fulfilment.schema.js';
import type { OrderStatus, ProduceGrade, SalesChannel, FulfillmentType, DeliverySlot } from './orders.schema.js';
import { parseMoney, type Money } from '@tohfa/shared-types';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { warehouseScopeFilter } from '../../rbac/warehouseScope.js';
import { AppError } from '../../http/problem.js';
import { MICRO_TS_SQL } from '../../http/microTimestamp.js';
import { decodeAdminOrderCursor, encodeAdminOrderCursor } from './fulfilment.cursor.js';
import type {
  AdminOrderChannel,
  AdminOrderFulfilmentType,
  AdminOrderInvoiceStatus,
  AdminOrderPaymentMethod,
  AdminOrderPaymentStatus,
  AdminOrderStatus,
} from './fulfilment.schema.js';

/**
 * What `findAdminOrderDetail` loads (BR-99). Internal: the service serializes it through an
 * allow-list. Deliberately NOT selected: `order_items.batch_id` / `allocation_id` (a batch leads to
 * `source_farmer_id`, BR-16 / BR-90), `delivery_otp_hash` and `otp_attempts` (BR-20), the delivery
 * address (customer PII, BR-92), and the history `note` / `changed_by` (free text can name a farmer).
 */
export interface AdminOrderDetailRecord {
  id: string;
  orderNumber: string;
  channel: AdminOrderChannel;
  status: AdminOrderStatus;
  fulfilmentType: AdminOrderFulfilmentType;
  paymentMethod: AdminOrderPaymentMethod;
  paymentStatus: AdminOrderPaymentStatus;
  warehouseId: string;
  warehouseName: string;
  customerId: string | null;
  customerCode: string | null;
  customerName: string | null;
  customerMobile: string | null;
  walkInName: string | null;
  walkInMobile: string | null;
  subtotal: Money;
  deliveryFee: Money;
  discount: Money;
  gstAmount: Money;
  totalAmount: Money;
  deliveryDate: string | null;
  deliverySlot: DeliverySlot | null;
  otpRequired: boolean;
  otpVerifiedAt: string | null;
  invoice: { id: string; invoiceNumber: string; status: AdminOrderInvoiceStatus } | null;
  placedAt: string;
  packedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  items: Array<{
    productId: string;
    name: string;
    grade: ProduceGrade;
    qtyKg: string;
    unitPrice: Money;
    gstRate: string;
    gstAmount: Money;
    lineTotal: Money;
  }>;
  timeline: Array<{ fromStatus: AdminOrderStatus | null; toStatus: AdminOrderStatus; at: string }>;
}

interface AdminOrderDetailRow {
  id: string;
  order_number: string;
  channel: string;
  status: string;
  fulfilment_type: string;
  payment_method: string;
  payment_status: string;
  warehouse_id: string;
  warehouse_name: string;
  customer_id: string | null;
  customer_code: string | null;
  customer_name: string | null;
  customer_mobile: string | null;
  walk_in_name: string | null;
  walk_in_mobile: string | null;
  subtotal: string;
  delivery_fee: string;
  discount: string;
  gst_amount: string;
  total_amount: string;
  delivery_date: string | null;
  delivery_slot: string | null;
  otp_required: boolean;
  otp_verified_at: Date | null;
  invoice_id: string | null;
  invoice_number: string | null;
  invoice_status: string | null;
  placed_at: Date;
  packed_at: Date | null;
  completed_at: Date | null;
  cancelled_at: Date | null;
}

const isoOrNull = (value: Date | null): string | null => (value === null ? null : value.toISOString());

interface FulfilmentOrderRow {
  id: string;
  orderNumber: string;
  status: string;
  channel: string;
  fulfillmentType: string;
  warehouseId: string;
  itemCount: number;
  totalAmount: string;
  paymentStatus: string;
  deliveryDate: string | null;
  placedAt: string | Date;
  /** Microsecond UTC text of placed_at, for the keyset cursor only (never in a response). */
  placedAtCursor: string;
}

interface FulfilmentOrderDetailRow {
  id: string;
  orderNumber: string;
  status: string;
  channel: string;
  fulfillmentType: string;
  warehouseId: string;
  subtotal: string;
  deliveryFee: string;
  discount: string;
  gstAmount: string;
  totalAmount: string;
  paymentStatus: string;
  deliveryDate: string | null;
  deliverySlot: string | null;
  deliveryAddressId: string | null;
  otpRequired: boolean;
  cancellationReason: string | null;
  deliveredAt: string | Date | null;
  placedAt: string | Date;
}

interface FulfilmentOrderItemRow {
  id: string;
  productId: string;
  name: string;
  grade: string;
  qtyKg: string;
  fulfilledQtyKg: string;
  unitPrice: string;
  gstRate: number;
  gstAmount: string;
  lineTotal: string;
}

export interface FulfilmentRepo {
  /**
   * BR-101 / BR-30: the warehouse scope is an explicit SQL predicate built from the RESOLVED scope
   * (`warehouseScopeFilter`), and `query.warehouseId` is ANDed on top of it. So a Sub admin naming
   * another warehouse gets an empty page (never 403), and a scope carrying a customer or farmer id
   * (CUSTOMER is `own` on `order.list.view_all`) fails closed to an empty page.
   */
  listAdminOrders(
    db: Executor,
    scope: ResolvedScope,
    query: AdminOrdersQuery,
  ): Promise<{ items: AdminOrderSummary[]; nextCursor: string | null; hasMore: boolean }>;

  findOrderForFulfilment(
    db: Executor,
    orderId: string,
    warehouseScope?: string | null,
  ): Promise<AdminOrderDetail | null>;

  getOrderDeliveryOtpHolder(
    db: Executor,
    orderId: string,
  ): Promise<{
    id: string;
    status: OrderStatus;
    fulfilmentType: FulfillmentType;
    deliveryOtpHash: string | null;
    otpAttempts: number;
    customerId: string;
    warehouseId: string;
  } | null>;

  /**
   * BR-85j: the order row locked with SELECT ... FOR UPDATE, for a caller that must decide on the
   * row's CURRENT status/channel/warehouse inside its own transaction (a concurrent pack or cancel
   * then waits, or is waited for, instead of interleaving). Null when the order does not exist.
   */
  lockOrderForUpdate(
    db: Executor,
    orderId: string,
  ): Promise<{ id: string; status: OrderStatus; channel: SalesChannel; warehouseId: string } | null>;

  /**
   * Conditional on `fromStatus`. Returns the number of order rows updated (0 or 1). On 0 nothing is
   * appended to order_status_history: an append-only ledger must not record a change that did not
   * happen. The caller decides what 0 means (BR-85j: a 409 that rolls the transaction back).
   */
  updateOrderStatus(
    db: Executor,
    params: {
      orderId: string;
      fromStatus: OrderStatus;
      toStatus: OrderStatus;
      actorUserId: string;
      note?: string | null;
      warehouseId?: string;
      packedAt?: Date;
      completedAt?: Date;
      otpVerifiedAt?: Date;
      otpVerifiedBy?: string;
      cancellationReason?: string;
    },
  ): Promise<number>;

  incrementOtpAttempts(db: Executor, orderId: string): Promise<number>;

  getOrderTracking(
    db: Executor,
    orderId: string,
    customerScope?: string | null,
  ): Promise<OrderTracking | null>;

  getMaxOtpAttempts(db: Executor): Promise<number>;

  /**
   * BR-99: one order of any channel, or null when it does not exist OR is outside the scope. The
   * scope is an explicit SQL predicate (`warehouseScopeFilter`), so both cases are the same null.
   */
  findAdminOrderDetail(db: Executor, scope: ResolvedScope, orderId: string): Promise<AdminOrderDetailRecord | null>;
}

export const fulfilmentRepo: FulfilmentRepo = {
  async listAdminOrders(db, scope, query) {
    // Warehouse isolation from the resolved scope, never from role names: this used to read the
    // actor's roles and treat "not a Sub admin" as "no filter", which let a CUSTOMER token (`own` on
    // order.list.view_all) list every order of every customer and warehouse.
    const filter = warehouseScopeFilter(scope, 'o.warehouse_id', 1);
    const conditions: string[] = [filter.sql];
    const values: unknown[] = [...filter.params];
    let idx = filter.nextIndex;

    // The caller's filter only ever narrows the scope; outside it the result is empty (BR-30).
    if (query.warehouseId) {
      conditions.push(`o.warehouse_id = $${idx++}`);
      values.push(query.warehouseId);
    }

    if (query.status) {
      conditions.push(`o.status = $${idx++}`);
      values.push(query.status);
    }

    if (query.channel) {
      conditions.push(`o.channel = $${idx++}`);
      values.push(query.channel);
    }

    if (query.deliveryDate) {
      conditions.push(`o.delivery_date = $${idx++}`);
      values.push(query.deliveryDate);
    }

    if (query.cursor !== undefined) {
      // The route validated the cursor (adminOrdersQuerySchema). A caller that skipped validation
      // still never reaches the ::timestamptz cast with a value we did not produce.
      const after = decodeAdminOrderCursor(query.cursor);
      if (after === null) {
        throw new AppError('VALIDATION_FAILED', {
          detail: 'cursor is not a value returned by this endpoint.',
          errors: { 'query.cursor': ['Invalid cursor.'] },
        });
      }
      conditions.push(`(o.placed_at, o.id) < ($${idx++}::timestamptz, $${idx++}::uuid)`);
      values.push(after.ts, after.id);
    }

    const limit = query.limit || 20;
    values.push(limit + 1);

    const sql = `
      SELECT o.id, o.order_number AS "orderNumber", o.status, o.channel,
             o.fulfilment_type AS "fulfillmentType", o.warehouse_id AS "warehouseId",
             o.total_amount::text AS "totalAmount", o.payment_status AS "paymentStatus",
             o.delivery_date::text AS "deliveryDate", o.placed_at AS "placedAt",
             ${MICRO_TS_SQL('o.placed_at')} AS "placedAtCursor",
             (SELECT count(*)::int FROM order_items oi WHERE oi.order_id = o.id) AS "itemCount"
        FROM orders o
       WHERE ${conditions.join(' AND ')}
       ORDER BY o.placed_at DESC, o.id DESC
        LIMIT $${idx}
    `;

    const res = await db.query<FulfilmentOrderRow>(sql, values);
    const hasMore = res.rows.length > limit;
    const items = res.rows.slice(0, limit).map((r) => ({
      id: r.id,
      orderNumber: r.orderNumber,
      status: r.status as OrderStatus,
      channel: r.channel as SalesChannel,
      fulfillmentType: r.fulfillmentType as FulfillmentType,
      warehouseId: r.warehouseId,
      itemCount: r.itemCount,
      totalAmount: r.totalAmount as Money,
      paymentStatus: r.paymentStatus,
      deliveryDate: r.deliveryDate,
      placedAt: new Date(r.placedAt).toISOString(),
    }));

    let nextCursor: string | null = null;
    if (hasMore && items.length > 0) {
      const last = res.rows[limit - 1]!;
      nextCursor = encodeAdminOrderCursor({ ts: last.placedAtCursor, id: last.id });
    }

    return { items, nextCursor, hasMore };
  },

  async findOrderForFulfilment(db, orderId, warehouseScope) {
    const conditions = ['o.id = $1'];
    const values: unknown[] = [orderId];

    if (warehouseScope) {
      conditions.push('o.warehouse_id = $2');
      values.push(warehouseScope);
    }

    const orderRes = await db.query<FulfilmentOrderDetailRow>(
      `SELECT o.id, o.order_number AS "orderNumber", o.status, o.channel,
              o.fulfilment_type AS "fulfillmentType", o.warehouse_id AS "warehouseId",
              o.subtotal::text AS subtotal, o.delivery_fee::text AS "deliveryFee",
              o.discount::text AS discount, o.gst_amount::text AS "gstAmount",
              o.total_amount::text AS "totalAmount", o.payment_status AS "paymentStatus",
              o.delivery_date::text AS "deliveryDate", o.delivery_slot AS "deliverySlot",
              o.delivery_address_id AS "deliveryAddressId",
              (o.delivery_otp_hash IS NOT NULL) AS "otpRequired",
              o.cancellation_reason AS "cancellationReason",
              o.completed_at AS "deliveredAt",
              o.placed_at AS "placedAt"
         FROM orders o
        WHERE ${conditions.join(' AND ')}`,
      values,
    );

    const order = orderRes.rows[0];
    if (!order) return null;

    const itemsRes = await db.query<FulfilmentOrderItemRow>(
      `SELECT oi.id, oi.crop_id AS "productId", cm.name, oi.grade,
              oi.qty_kg::text AS "qtyKg", oi.fulfilled_qty_kg::text AS "fulfilledQtyKg",
              oi.unit_price::text AS "unitPrice", oi.gst_rate AS "gstRate",
              oi.gst_amount::text AS "gstAmount", oi.line_total::text AS "lineTotal"
         FROM order_items oi
         JOIN crop_master cm ON cm.id = oi.crop_id
        WHERE oi.order_id = $1
        ORDER BY oi.created_at ASC`,
      [order.id],
    );

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status as OrderStatus,
      channel: order.channel as SalesChannel,
      fulfillmentType: order.fulfillmentType as FulfillmentType,
      warehouseId: order.warehouseId,
      itemCount: itemsRes.rows.length,
      totalAmount: order.totalAmount as Money,
      paymentStatus: order.paymentStatus,
      deliveryDate: order.deliveryDate,
      placedAt: new Date(order.placedAt).toISOString(),
      subtotal: order.subtotal as Money,
      deliveryFee: order.deliveryFee as Money,
      discount: order.discount as Money,
      gstAmount: order.gstAmount as Money,
      deliverySlot: order.deliverySlot as DeliverySlot | null,
      deliveryAddressId: order.deliveryAddressId,
      otpRequired: order.otpRequired,
      cancellationReason: order.cancellationReason,
      deliveredAt: order.deliveredAt ? new Date(order.deliveredAt).toISOString() : null,
      items: itemsRes.rows.map((it) => ({
        id: it.id,
        productId: it.productId,
        name: it.name,
        grade: it.grade as ProduceGrade,
        qtyKg: it.qtyKg,
        fulfilledQtyKg: it.fulfilledQtyKg,
        unitPrice: it.unitPrice as Money,
        gstRate: Number(it.gstRate),
        gstAmount: it.gstAmount as Money,
        lineTotal: it.lineTotal as Money,
      })),
    };
  },

  async getOrderDeliveryOtpHolder(db, orderId) {
    const res = await db.query<{
      id: string;
      status: OrderStatus;
      fulfilment_type: FulfillmentType;
      delivery_otp_hash: string | null;
      otp_attempts: number;
      customer_id: string;
      warehouse_id: string;
    }>(
      `SELECT id, status, fulfilment_type, delivery_otp_hash, otp_attempts,
              customer_id, warehouse_id
         FROM orders
        WHERE id = $1`,
      [orderId],
    );
    const row = res.rows[0];
    if (!row) return null;
    return {
      id: row.id,
      status: row.status,
      fulfilmentType: row.fulfilment_type,
      deliveryOtpHash: row.delivery_otp_hash,
      otpAttempts: row.otp_attempts,
      customerId: row.customer_id,
      warehouseId: row.warehouse_id,
    };
  },

  async lockOrderForUpdate(db, orderId) {
    const res = await db.query<{ id: string; status: OrderStatus; channel: SalesChannel; warehouse_id: string }>(
      `SELECT id, status, channel, warehouse_id
         FROM orders
        WHERE id = $1
          FOR UPDATE`,
      [orderId],
    );
    const row = res.rows[0];
    if (!row) return null;
    return { id: row.id, status: row.status, channel: row.channel, warehouseId: row.warehouse_id };
  },

  async updateOrderStatus(db, params) {
    // 1. Update orders table
    const updated = await db.query(
      `UPDATE orders
          SET status = $1,
              warehouse_id = COALESCE($2, warehouse_id),
              packed_at = COALESCE($3, packed_at),
              completed_at = COALESCE($4, completed_at),
              otp_verified_at = COALESCE($5, otp_verified_at),
              otp_verified_by = COALESCE($6, otp_verified_by),
              cancellation_reason = COALESCE($7, cancellation_reason),
              updated_at = now()
        WHERE id = $8 AND status = $9`,
      [
        params.toStatus,
        params.warehouseId ?? null,
        params.packedAt ?? null,
        params.completedAt ?? null,
        params.otpVerifiedAt ?? null,
        params.otpVerifiedBy ?? null,
        params.cancellationReason ?? null,
        params.orderId,
        params.fromStatus,
      ],
    );
    const rowCount = updated.rowCount ?? 0;
    if (rowCount === 0) return 0;

    // 2. Append to order_status_history (only for a change that actually happened)
    await db.query(
      `INSERT INTO order_status_history (
         order_id, from_status, to_status, changed_by, note, created_at
       )
       VALUES ($1, $2, $3, $4, $5, now())`,
      [
        params.orderId,
        params.fromStatus,
        params.toStatus,
        params.actorUserId,
        params.note ?? null,
      ],
    );
    return rowCount;
  },

  async incrementOtpAttempts(db, orderId) {
    const res = await db.query<{ otp_attempts: number }>(
      `UPDATE orders
          SET otp_attempts = otp_attempts + 1,
              updated_at = now()
        WHERE id = $1
        RETURNING otp_attempts`,
      [orderId],
    );
    return res.rows[0]?.otp_attempts ?? 0;
  },

  async getOrderTracking(db, orderId, customerScope) {
    const conditions = ['o.id = $1'];
    const values: unknown[] = [orderId];

    if (customerScope) {
      conditions.push('o.customer_id = $2');
      values.push(customerScope);
    }

    const orderRes = await db.query<{
      id: string;
      status: OrderStatus;
      delivery_otp_hash: string | null;
      otp_verified_at: Date | null;
      delivery_date: string | null;
    }>(
      `SELECT id, status, delivery_otp_hash, otp_verified_at, delivery_date::text
         FROM orders o
        WHERE ${conditions.join(' AND ')}`,
      values,
    );

    const order = orderRes.rows[0];
    if (!order) return null;

    const historyRes = await db.query<{
      id: string;
      to_status: OrderStatus;
      created_at: Date;
      note: string | null;
    }>(
      `SELECT id, to_status, created_at, note
         FROM order_status_history
        WHERE order_id = $1
        ORDER BY created_at ASC`,
      [order.id],
    );

    const events: OrderTrackingEvent[] = historyRes.rows.map((r) => ({
      id: r.id,
      status: r.to_status,
      at: r.created_at.toISOString(),
      note: r.note,
    }));

    return {
      orderId: order.id,
      status: order.status,
      otpRequired: Boolean(order.delivery_otp_hash && !order.otp_verified_at),
      estimatedArrival: order.delivery_date,
      events,
    };
  },

  async getMaxOtpAttempts(db) {
    const res = await db.query<{ value: unknown }>(
      `SELECT value FROM system_config WHERE key = 'otp_max_attempts'`,
    );
    const row = res.rows[0];
    if (row && (typeof row.value === 'number' || typeof row.value === 'string')) {
      return Number(row.value);
    }
    return 3;
  },

  async findAdminOrderDetail(db, scope, orderId) {
    const filter = warehouseScopeFilter(scope, 'o.warehouse_id', 2);
    const head = await db.query<AdminOrderDetailRow>(
      `SELECT o.id, o.order_number, o.channel, o.status::text AS status,
              o.fulfilment_type::text AS fulfilment_type, o.payment_method::text AS payment_method,
              o.payment_status, o.warehouse_id, w.name AS warehouse_name,
              o.customer_id, c.customer_code, u.full_name AS customer_name, u.mobile AS customer_mobile,
              o.walk_in_name, o.walk_in_mobile,
              o.subtotal::text AS subtotal, o.delivery_fee::text AS delivery_fee,
              o.discount::text AS discount, o.gst_amount::text AS gst_amount,
              o.total_amount::text AS total_amount,
              o.delivery_date::text AS delivery_date, o.delivery_slot::text AS delivery_slot,
              (o.delivery_otp_hash IS NOT NULL AND o.otp_verified_at IS NULL) AS otp_required,
              o.otp_verified_at,
              inv.id AS invoice_id, inv.invoice_number, inv.status AS invoice_status,
              o.placed_at, o.packed_at, o.completed_at, o.cancelled_at
         FROM orders o
         JOIN warehouses w ON w.id = o.warehouse_id
         LEFT JOIN customers c ON c.id = o.customer_id
         LEFT JOIN users u ON u.id = c.user_id
         LEFT JOIN LATERAL (
               SELECT i.id, i.invoice_number, i.status
                 FROM invoices i
                WHERE i.order_id = o.id
             ORDER BY i.created_at DESC, i.id DESC
                LIMIT 1
         ) inv ON TRUE
        WHERE o.id = $1::uuid AND ${filter.sql}
        LIMIT 1`,
      [orderId, ...filter.params],
    );
    const row = head.rows[0];
    if (row === undefined) return null;

    // The order is already proven visible; the children are read by its id only.
    const [items, history] = await Promise.all([
      db.query<{
        product_id: string;
        name: string;
        grade: string;
        qty_kg: string;
        unit_price: string;
        gst_rate: string;
        gst_amount: string;
        line_total: string;
      }>(
        `SELECT oi.crop_id AS product_id, cm.name, oi.grade::text AS grade, oi.qty_kg::text AS qty_kg,
                oi.unit_price::text AS unit_price, oi.gst_rate::text AS gst_rate,
                oi.gst_amount::text AS gst_amount, oi.line_total::text AS line_total
           FROM order_items oi
           JOIN crop_master cm ON cm.id = oi.crop_id
          WHERE oi.order_id = $1
       ORDER BY oi.created_at, oi.id`,
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
      id: row.id,
      orderNumber: row.order_number,
      channel: row.channel as AdminOrderChannel,
      status: row.status as AdminOrderStatus,
      fulfilmentType: row.fulfilment_type as AdminOrderFulfilmentType,
      paymentMethod: row.payment_method as AdminOrderPaymentMethod,
      paymentStatus: row.payment_status as AdminOrderPaymentStatus,
      warehouseId: row.warehouse_id,
      warehouseName: row.warehouse_name,
      customerId: row.customer_id,
      customerCode: row.customer_code,
      customerName: row.customer_name,
      customerMobile: row.customer_mobile,
      walkInName: row.walk_in_name,
      walkInMobile: row.walk_in_mobile,
      subtotal: parseMoney(row.subtotal),
      deliveryFee: parseMoney(row.delivery_fee),
      discount: parseMoney(row.discount),
      gstAmount: parseMoney(row.gst_amount),
      totalAmount: parseMoney(row.total_amount),
      deliveryDate: row.delivery_date,
      deliverySlot: row.delivery_slot as DeliverySlot | null,
      otpRequired: row.otp_required,
      otpVerifiedAt: isoOrNull(row.otp_verified_at),
      invoice:
        row.invoice_id === null || row.invoice_number === null || row.invoice_status === null
          ? null
          : {
              id: row.invoice_id,
              invoiceNumber: row.invoice_number,
              status: row.invoice_status as AdminOrderInvoiceStatus,
            },
      placedAt: row.placed_at.toISOString(),
      packedAt: isoOrNull(row.packed_at),
      completedAt: isoOrNull(row.completed_at),
      cancelledAt: isoOrNull(row.cancelled_at),
      items: items.rows.map((r) => ({
        productId: r.product_id,
        name: r.name,
        grade: r.grade as ProduceGrade,
        qtyKg: r.qty_kg,
        unitPrice: parseMoney(r.unit_price),
        gstRate: r.gst_rate,
        gstAmount: parseMoney(r.gst_amount),
        lineTotal: parseMoney(r.line_total),
      })),
      timeline: history.rows.map((r) => ({
        fromStatus: r.from_status as AdminOrderStatus | null,
        toStatus: r.to_status as AdminOrderStatus,
        at: r.created_at.toISOString(),
      })),
    };
  },
};
