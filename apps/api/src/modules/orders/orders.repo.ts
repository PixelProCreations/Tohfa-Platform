import { createHash } from 'node:crypto';
import { parseMoney, type Money } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type {
  DeliverySlot,
  FulfillmentType,
  ListOrdersQuery,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProduceGrade,
  SalesChannel,
} from './orders.schema.js';

export interface DeliveryConfig {
  deliveryFee: Money;
  freeDeliveryThreshold: Money;
  homeDeliveryEnabled: boolean;
  /** BR-200: system_config.handling_fee; 0 when the row is missing. */
  handlingFee: Money;
}

export interface CartCheckoutItem {
  id: string;
  cartId: string;
  productId: string;
  name: string;
  grade: ProduceGrade;
  qtyKg: string;
  unitPrice: string;
  lineTotal: string;
  allocationId: string | null;
  batchId: string | null;
}

export interface CartCheckoutRecord {
  id: string;
  customerId: string;
  warehouseId: string | null;
  status: string;
  lockedAt: Date | null;
  lockedUntil: Date | null;
  items: CartCheckoutItem[];
}

/** BR-195: one thumbnail source row (catalog name + icon key only; no farm data). */
export interface OrderThumbRecord {
  productName: string;
  iconKey: string | null;
  cropId: string;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  customerId: string;
  warehouseId: string;
  cartId: string | null;
  channel: SalesChannel;
  fulfillmentType: FulfillmentType;
  deliveryAddressId: string | null;
  deliverySlot: DeliverySlot | null;
  deliveryDate: string | null;
  subtotal: string;
  deliveryFee: string;
  /** BR-200 (migration 0170); 0 for orders placed before the column existed. */
  handlingFee: string;
  discount: string;
  gstAmount: string;
  totalAmount: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  deliveryOtpHash: string | null;
  itemCount: number;
  placedAt: Date;
  createdAt: Date;
  updatedAt: Date | null;
  /** Set by listOrders only: up to three items, biggest line first. */
  thumbs?: OrderThumbRecord[];
  /**
   * BR-213 (migration 0190): the POST /orders Idempotency-Key, when one was stored. Selected by
   * every read here; absent only from the createOrder RETURNING (it echoes the params instead).
   */
  idempotencyKey?: string | null;
  /** BR-215 (migration 0190): end of the payment window of a PENDING_PAYMENT gateway order. */
  paymentExpiresAt?: Date | null;
  /** Set by lockOrderForPayment / getOrderByGatewayOrderId / the cancel and confirm writes. */
  cancelledAt?: Date | null;
  cancellationReason?: string | null;
}

/** BR-215: why a PENDING_PAYMENT order was cancelled (orders.cancellation_reason). */
export type PendingOrderCancellationReason = 'PAYMENT_NOT_COMPLETED' | 'CUSTOMER_CANCELLED';

/** payments.status CHECK (0007_money.sql). A gateway order starts CREATED (the "pending" state). */
export type GatewayPaymentStatus = 'CREATED' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'REFUNDED';

/** One `payments` row. For an order: ref_type 'ORDER', ref_id = orders.id. */
export interface OrderPaymentRecord {
  id: string;
  gateway: string;
  gatewayOrderId: string | null;
  gatewayPaymentId: string | null;
  amount: string;
  currency: string;
  method: PaymentMethod | null;
  status: GatewayPaymentStatus;
  refType: string | null;
  refId: string | null;
  capturedAt: Date | null;
  createdAt: Date;
  updatedAt: Date | null;
}

/** BR-215: an order the payment-expiry sweep must settle (confirm if captured, else cancel). */
export interface ExpiredPendingOrderRecord {
  orderId: string;
  customerId: string;
  paymentExpiresAt: Date;
  gatewayOrderId: string | null;
}

export interface CreateOrderParams {
  orderNumber: string;
  customerId: string;
  warehouseId: string;
  cartId: string;
  channel: SalesChannel;
  fulfillmentType: FulfillmentType;
  deliveryAddressId?: string | null | undefined;
  deliveryDate?: string | null | undefined;
  deliverySlot?: DeliverySlot | null | undefined;
  subtotal: Money;
  deliveryFee: Money;
  handlingFee: Money;
  discount: Money;
  gstAmount: Money;
  totalAmount: Money;
  paymentMethod: PaymentMethod;
  deliveryOtpPlaintext: string;
  items: CartCheckoutItem[];
  actorUserId: string;
  /**
   * BR-17 / BR-213. Omitted = 'CONFIRMED' (the wallet path, unchanged). A gateway order passes
   * 'PENDING_PAYMENT'.
   */
  status?: 'CONFIRMED' | 'PENDING_PAYMENT' | undefined;
  /**
   * Omitted = 'PAID' for CONFIRMED, 'PENDING' for PENDING_PAYMENT. CONFIRMED + PENDING is refused:
   * an order is never CONFIRMED with an unpaid balance (BR-17 amended).
   */
  paymentStatus?: 'PAID' | 'PENDING' | undefined;
  /** BR-213: stored on the order so a replay of a gateway order finds it. Unique per customer. */
  idempotencyKey?: string | null | undefined;
  /** BR-215: end of the payment window; set for PENDING_PAYMENT orders only. */
  paymentExpiresAt?: Date | null | undefined;
  /** order_status_history note; defaults keep the wallet note unchanged. */
  statusNote?: string | undefined;
}

/**
 * Every orders column the record carries, from alias `o`. Payment-flow reads use this; the
 * pre-existing reads keep their own literal column lists.
 */
const ORDER_PAYMENT_COLUMNS = `
  o.id, o.order_number AS "orderNumber", o.customer_id AS "customerId",
  o.warehouse_id AS "warehouseId", o.cart_id AS "cartId", o.channel,
  o.fulfilment_type AS "fulfillmentType", o.delivery_address_id AS "deliveryAddressId",
  o.delivery_slot AS "deliverySlot", o.delivery_date::text AS "deliveryDate",
  o.subtotal::text AS subtotal, o.delivery_fee::text AS "deliveryFee",
  o.handling_fee::text AS "handlingFee",
  o.discount::text AS discount, o.gst_amount::text AS "gstAmount",
  o.total_amount::text AS "totalAmount", o.payment_method AS "paymentMethod",
  o.payment_status AS "paymentStatus", o.status, o.delivery_otp_hash AS "deliveryOtpHash",
  (SELECT COUNT(*)::int FROM order_items WHERE order_id = o.id) AS "itemCount",
  o.placed_at AS "placedAt", o.created_at AS "createdAt", o.updated_at AS "updatedAt",
  o.idempotency_key AS "idempotencyKey", o.payment_expires_at AS "paymentExpiresAt",
  o.cancelled_at AS "cancelledAt", o.cancellation_reason AS "cancellationReason"`;

const PAYMENT_COLUMNS = `
  p.id, p.gateway, p.gateway_order_id AS "gatewayOrderId",
  p.gateway_payment_id AS "gatewayPaymentId", p.amount::text AS amount, p.currency,
  p.method, p.status, p.ref_type AS "refType", p.ref_id AS "refId",
  p.captured_at AS "capturedAt", p.created_at AS "createdAt", p.updated_at AS "updatedAt"`;

/** The same column list as PAYMENT_COLUMNS, for `RETURNING` (no alias available there). */
const PAYMENT_RETURNING = `
  id, gateway, gateway_order_id AS "gatewayOrderId",
  gateway_payment_id AS "gatewayPaymentId", amount::text AS amount, currency,
  method, status, ref_type AS "refType", ref_id AS "refId",
  captured_at AS "capturedAt", created_at AS "createdAt", updated_at AS "updatedAt"`;

async function loadOrderItems(db: Executor, orderId: string): Promise<OrderItemRecord[]> {
  const itemsRes = await db.query<OrderItemRecord>(
    `SELECT oi.id, oi.order_id AS "orderId", oi.crop_id AS "productId",
            cm.name, cm.icon_key AS "iconKey", oi.grade, oi.qty_kg::text AS "qtyKg",
            oi.unit_price::text AS "unitPrice", oi.line_total::text AS "lineTotal"
       FROM order_items oi
       JOIN crop_master cm ON cm.id = oi.crop_id
      WHERE oi.order_id = $1
      ORDER BY oi.created_at ASC`,
    [orderId],
  );
  return itemsRes.rows;
}

async function selectOrderPayment(db: Executor, orderId: string): Promise<OrderPaymentRecord | null> {
  const res = await db.query<OrderPaymentRecord>(
    `SELECT ${PAYMENT_COLUMNS}
       FROM payments p
      WHERE p.ref_type = 'ORDER' AND p.ref_id = $1
      ORDER BY p.created_at DESC
      LIMIT 1`,
    [orderId],
  );
  return res.rows[0] ?? null;
}

async function selectOrderForUpdate(db: Executor, orderId: string): Promise<OrderRecord | null> {
  const res = await db.query<OrderRecord>(
    `SELECT ${ORDER_PAYMENT_COLUMNS}
       FROM orders o
      WHERE o.id = $1
      FOR UPDATE OF o`,
    [orderId],
  );
  return res.rows[0] ?? null;
}

export interface OrderItemRecord {
  id: string;
  /** Catalog icon key, for thumbnails only (never serialised raw). */
  iconKey?: string | null;
  orderId: string;
  productId: string;
  name: string;
  grade: ProduceGrade;
  qtyKg: string;
  unitPrice: string;
  lineTotal: string;
}

export interface OrdersRepo {
  getDeliveryConfig(db: Executor): Promise<DeliveryConfig>;

  /** BR-98 / BR-161: raw system_config.retail_gst_rate_percent value; undefined when the row is missing. */
  getRetailGstRateRaw(db: Executor): Promise<unknown>;

  /** BR-161: true only for a live (not deleted) address owned by this customer. */
  isOwnLiveAddress(db: Executor, customerId: string, addressId: string): Promise<boolean>;

  /**
   * BR-200: the customer's wallet balance, read-only (the quote must not create a wallet the way
   * walletService.getWalletForActor does). null when the customer has no wallet yet.
   */
  getCustomerWalletBalance(db: Executor, customerId: string): Promise<string | null>;

  findCartForCheckout(
    db: Executor,
    customerId: string,
  ): Promise<CartCheckoutRecord | null>;

  generateOrderNumber(db: Executor): Promise<string>;

  findOrderByCartId(
    db: Executor,
    cartId: string,
  ): Promise<{ order: OrderRecord; items: OrderItemRecord[] } | null>;

  findOrderByCartOrIdempotencyKey(
    db: Executor,
    customerId: string,
    idempotencyKey: string,
  ): Promise<{ order: OrderRecord; items: OrderItemRecord[] } | null>;

  findOrderById(
    db: Executor,
    orderId: string,
    /** BR-36: always the caller's own customer id; there is no unscoped variant (fail closed). */
    customerId: string,
  ): Promise<{ order: OrderRecord; items: OrderItemRecord[] } | null>;

  listOrders(
    db: Executor,
    customerId: string,
    query: ListOrdersQuery,
  ): Promise<{ orders: OrderRecord[]; nextCursor: string | null; hasMore: boolean }>;

  checkAndBookDeliverySlot(
    db: Executor,
    warehouseId: string,
    slotDate: string,
    slot: DeliverySlot,
  ): Promise<void>;

  createOrder(
    db: Executor,
    params: CreateOrderParams,
  ): Promise<{ order: OrderRecord; items: OrderItemRecord[] }>;

  convertAllocationsAndAppendStockLedger(
    db: Executor,
    items: CartCheckoutItem[],
    orderId: string,
    warehouseId: string,
    actorUserId: string,
  ): Promise<void>;

  // ---------------------------------------------------------------------------------------------
  // BR-213..BR-215: gateway-paid orders. Every write below expects to run inside the caller's
  // transaction (pass the tx client); none of them opens or commits one.
  // ---------------------------------------------------------------------------------------------

  /**
   * BR-213: idempotent replay of POST /orders for ANY payment method. Looks up the wallet debit
   * (`order_debit_<key>`, the pre-existing wallet path) first, then orders.idempotency_key.
   * Customer-scoped: an order of another customer is never returned (null). `payment` is the
   * order's latest ORDER payments row (null for wallet orders).
   */
  findOrderByIdempotencyKey(
    db: Executor,
    customerId: string,
    idempotencyKey: string,
  ): Promise<{ order: OrderRecord; items: OrderItemRecord[]; payment: OrderPaymentRecord | null } | null>;

  /**
   * BR-214: `SELECT ... FOR UPDATE` of the order row (unscoped: the caller has already checked
   * ownership, or is the webhook/sweep). Must be called inside a transaction. null if no row.
   */
  lockOrderForPayment(db: Executor, orderId: string): Promise<OrderRecord | null>;

  /**
   * BR-214: the order behind a Razorpay order id (payments.ref_type = 'ORDER'). Unscoped (webhook
   * and sweep); does NOT lock: follow with lockOrderForPayment inside the transaction.
   */
  getOrderByGatewayOrderId(
    db: Executor,
    gatewayOrderId: string,
  ): Promise<{ order: OrderRecord; payment: OrderPaymentRecord } | null>;

  /** Webhook routing: the payments row for a gateway order id, any ref_type (TOPUP or ORDER). */
  getPaymentByGatewayOrderId(db: Executor, gatewayOrderId: string): Promise<OrderPaymentRecord | null>;

  /** The order's latest ORDER payments row, or null (wallet orders have none). */
  getOrderPayment(db: Executor, orderId: string): Promise<OrderPaymentRecord | null>;

  /** BR-213: records the Razorpay order created for this order. status CREATED (= pending). */
  insertOrderPayment(
    db: Executor,
    params: { orderId: string; gatewayOrderId: string; amount: Money; method: PaymentMethod; gateway?: string },
  ): Promise<OrderPaymentRecord>;

  /**
   * BR-214: CREATED/AUTHORIZED/FAILED -> CAPTURED with the gateway payment id. null when the row
   * is already CAPTURED/REFUNDED (idempotent no-op: compare gatewayPaymentId via getOrderPayment).
   * A second CAPTURED row for the same gateway_payment_id fails on the UNIQUE constraint (23505).
   */
  markOrderPaymentCaptured(
    db: Executor,
    params: {
      paymentId: string;
      gatewayPaymentId: string;
      signature?: string | null;
      capturedAt?: Date;
      rawPayload?: unknown;
    },
  ): Promise<OrderPaymentRecord | null>;

  /**
   * BR-213: records a failed attempt (payment.failed). The order is NOT touched (it stays
   * PENDING_PAYMENT until expiry; the Razorpay order can be retried). null when already CAPTURED/REFUNDED.
   */
  markOrderPaymentFailed(
    db: Executor,
    params: { paymentId: string; rawPayload?: unknown },
  ): Promise<OrderPaymentRecord | null>;

  /**
   * BR-214: PENDING_PAYMENT/PENDING -> CONFIRMED/PAID plus an order_status_history row.
   * null when the order is not PENDING_PAYMENT (caller decides: already confirmed or cancelled).
   */
  confirmPendingOrder(
    db: Executor,
    params: { orderId: string; actorUserId: string | null; note?: string },
  ): Promise<OrderRecord | null>;

  /**
   * BR-215: PENDING_PAYMENT -> CANCELLED / payment_status FAILED, cancelled_at, cancellation_reason,
   * order_items CANCELLED and an order_status_history row. Does NOT release stock or slot: call
   * releaseOrderStock and releaseDeliverySlot in the same transaction. null when not PENDING_PAYMENT.
   */
  cancelPendingOrder(
    db: Executor,
    params: {
      orderId: string;
      reason: PendingOrderCancellationReason;
      actorUserId: string | null;
      note?: string;
    },
  ): Promise<OrderRecord | null>;

  /** BR-215: a capture that arrived after cancellation: payment_status REFUND_DUE (CANCELLED orders only). */
  markOrderRefundDue(db: Executor, orderId: string): Promise<OrderRecord | null>;

  /**
   * BR-215 / BR-37: reverses the stock taken at placement. For every SALE ledger row of the order
   * a compensating RELEASE row (+qty, ref ORDER) is appended, and allocations.consumed_qty is
   * reduced by the converted cart lines. Idempotent: a no-op (released=false) when the order
   * already has a RELEASE row. Caller must hold the order lock (lockOrderForPayment).
   */
  releaseOrderStock(
    db: Executor,
    order: Pick<OrderRecord, 'id' | 'cartId' | 'warehouseId'>,
    actorUserId: string | null,
  ): Promise<{ released: boolean; ledgerRows: number; allocations: number }>;

  /** BR-215: booked_orders - 1 on the order's delivery slot. false when there is no slot/row. */
  releaseDeliverySlot(
    db: Executor,
    order: Pick<OrderRecord, 'warehouseId' | 'deliveryDate' | 'deliverySlot'>,
  ): Promise<boolean>;

  /** BR-215: PENDING_PAYMENT orders whose payment window has ended, oldest first. */
  listExpiredPendingPaymentOrders(db: Executor, limit: number): Promise<ExpiredPendingOrderRecord[]>;

  /**
   * BR-215: system_config.order_payment_window_minutes (migration 0190). Missing, non-numeric or
   * non-positive values fall back to the documented default of 15.
   */
  getOrderPaymentWindowMinutes(db: Executor): Promise<number>;
}

/** BR-215 documented default for system_config.order_payment_window_minutes. */
export const ORDER_PAYMENT_WINDOW_MINUTES_DEFAULT = 15;

export const ordersRepo: OrdersRepo = {
  async getDeliveryConfig(db) {
    const res = await db.query<{ key: string; value: unknown }>(
      `SELECT key, value FROM system_config
        WHERE key IN ('delivery_fee', 'free_delivery_threshold', 'home_delivery_enabled', 'handling_fee')`,
    );

    let deliveryFee = '40.00' as Money;
    let freeDeliveryThreshold = '500.00' as Money;
    let homeDeliveryEnabled = true;
    let handlingFee = '0.00' as Money;

    for (const row of res.rows) {
      if (row.key === 'delivery_fee' && (typeof row.value === 'number' || typeof row.value === 'string')) {
        deliveryFee = String(row.value) as Money;
      } else if (row.key === 'free_delivery_threshold' && (typeof row.value === 'number' || typeof row.value === 'string')) {
        freeDeliveryThreshold = String(row.value) as Money;
      } else if (row.key === 'home_delivery_enabled' && typeof row.value === 'boolean') {
        homeDeliveryEnabled = row.value;
      } else if (row.key === 'handling_fee' && (typeof row.value === 'number' || typeof row.value === 'string')) {
        // BR-200: a malformed or negative value is ignored (fee 0) rather than charged.
        try {
          const fee = parseMoney(String(row.value));
          if (!fee.startsWith('-')) handlingFee = fee;
        } catch {
          handlingFee = '0.00' as Money;
        }
      }
    }

    return { deliveryFee, freeDeliveryThreshold, homeDeliveryEnabled, handlingFee };
  },

  async getRetailGstRateRaw(db) {
    const res = await db.query<{ value: unknown }>(
      `SELECT value FROM system_config WHERE key = 'retail_gst_rate_percent'`,
    );
    return res.rows[0]?.value;
  },

  async isOwnLiveAddress(db, customerId, addressId) {
    const res = await db.query(
      `SELECT 1 FROM customer_addresses
        WHERE id = $1 AND customer_id = $2 AND deleted_at IS NULL`,
      [addressId, customerId],
    );
    return (res.rowCount ?? 0) > 0;
  },

  async getCustomerWalletBalance(db, customerId) {
    const res = await db.query<{ balance: string }>(
      `SELECT balance::text AS balance FROM wallets
        WHERE owner_type = 'CUSTOMER' AND customer_id = $1
        LIMIT 1`,
      [customerId],
    );
    return res.rows[0]?.balance ?? null;
  },

  async findCartForCheckout(db, customerId) {
    const cartRes = await db.query<{
      id: string;
      customer_id: string;
      warehouse_id: string | null;
      status: string;
      locked_at: Date | null;
      locked_until: Date | null;
    }>(
      `SELECT id, customer_id, warehouse_id, status, locked_at, locked_until
         FROM carts
        WHERE customer_id = $1
          AND status IN ('ACTIVE', 'LOCKED')
        ORDER BY created_at DESC
        LIMIT 1`,
      [customerId],
    );

    const cart = cartRes.rows[0];
    if (!cart) return null;

    const itemsRes = await db.query<{
      id: string;
      cartId: string;
      productId: string;
      name: string;
      grade: ProduceGrade;
      qtyKg: string;
      unitPrice: string;
      lineTotal: string;
      allocationId: string | null;
      batchId: string | null;
    }>(
      `SELECT ci.id, ci.cart_id AS "cartId", ci.crop_id AS "productId", cm.name, ci.grade,
              ci.qty_kg::text AS "qtyKg", ci.unit_price::text AS "unitPrice",
              ci.line_total::text AS "lineTotal", ci.allocation_id AS "allocationId",
              a.batch_id AS "batchId"
         FROM cart_items ci
         JOIN crop_master cm ON cm.id = ci.crop_id
    LEFT JOIN allocations a ON a.id = ci.allocation_id
        WHERE ci.cart_id = $1
          AND ci.status = 'HELD'
        ORDER BY ci.created_at ASC`,
      [cart.id],
    );

    return {
      id: cart.id,
      customerId: cart.customer_id,
      warehouseId: cart.warehouse_id,
      status: cart.status,
      lockedAt: cart.locked_at,
      lockedUntil: cart.locked_until,
      items: itemsRes.rows,
    };
  },

  async generateOrderNumber(db) {
    const res = await db.query<{ yr: string; num: string }>(
      `SELECT to_char(CURRENT_DATE, 'YYYY') AS yr,
              LPAD(nextval('order_number_seq')::text, 6, '0') AS num`,
    );
    const { yr, num } = res.rows[0]!;
    return `TOH-${yr}-${num}`;
  },

  async findOrderByCartId(db, cartId) {
    const res = await db.query<OrderRecord>(
      `SELECT o.id, o.order_number AS "orderNumber", o.customer_id AS "customerId",
              o.warehouse_id AS "warehouseId", o.cart_id AS "cartId", o.channel,
              o.fulfilment_type AS "fulfillmentType", o.delivery_address_id AS "deliveryAddressId",
              o.delivery_slot AS "deliverySlot", o.delivery_date::text AS "deliveryDate",
              o.subtotal::text AS subtotal, o.delivery_fee::text AS "deliveryFee",
              o.handling_fee::text AS "handlingFee",
              o.discount::text AS discount, o.gst_amount::text AS "gstAmount",
              o.total_amount::text AS "totalAmount", o.payment_method AS "paymentMethod",
              o.payment_status AS "paymentStatus", o.status, o.delivery_otp_hash AS "deliveryOtpHash",
              (SELECT COUNT(*)::int FROM order_items WHERE order_id = o.id) AS "itemCount",
              o.placed_at AS "placedAt", o.created_at AS "createdAt", o.updated_at AS "updatedAt",
              o.idempotency_key AS "idempotencyKey", o.payment_expires_at AS "paymentExpiresAt"
         FROM orders o
        WHERE o.cart_id = $1
        LIMIT 1`,
      [cartId],
    );

    const order = res.rows[0];
    if (!order) return null;

    const itemsRes = await db.query<OrderItemRecord>(
      `SELECT oi.id, oi.order_id AS "orderId", oi.crop_id AS "productId",
              cm.name, cm.icon_key AS "iconKey", oi.grade, oi.qty_kg::text AS "qtyKg",
              oi.unit_price::text AS "unitPrice", oi.line_total::text AS "lineTotal"
         FROM order_items oi
         JOIN crop_master cm ON cm.id = oi.crop_id
        WHERE oi.order_id = $1
        ORDER BY oi.created_at ASC`,
      [order.id],
    );

    return { order, items: itemsRes.rows };
  },

  async findOrderByCartOrIdempotencyKey(db, customerId, idempotencyKey) {
    const txRes = await db.query<{ ref_id: string }>(
      `SELECT ref_id FROM wallet_transactions
        WHERE idempotency_key = $1`,
      [`order_debit_${idempotencyKey}`],
    );
    if (txRes.rows.length > 0 && txRes.rows[0]?.ref_id) {
      const cartId = txRes.rows[0].ref_id;
      return this.findOrderByCartId(db, cartId);
    }
    return null;
  },

  async findOrderById(db, orderId, customerId) {
    // BR-36 / BR-187: an empty or missing customer id narrows to NOTHING, never to every order.
    if (!customerId) return null;
    const params: unknown[] = [orderId, customerId];
    const whereClause = `WHERE o.id = $1 AND o.customer_id = $2`;

    const res = await db.query<OrderRecord>(
      `SELECT o.id, o.order_number AS "orderNumber", o.customer_id AS "customerId",
              o.warehouse_id AS "warehouseId", o.cart_id AS "cartId", o.channel,
              o.fulfilment_type AS "fulfillmentType", o.delivery_address_id AS "deliveryAddressId",
              o.delivery_slot AS "deliverySlot", o.delivery_date::text AS "deliveryDate",
              o.subtotal::text AS subtotal, o.delivery_fee::text AS "deliveryFee",
              o.handling_fee::text AS "handlingFee",
              o.discount::text AS discount, o.gst_amount::text AS "gstAmount",
              o.total_amount::text AS "totalAmount", o.payment_method AS "paymentMethod",
              o.payment_status AS "paymentStatus", o.status, o.delivery_otp_hash AS "deliveryOtpHash",
              (SELECT COUNT(*)::int FROM order_items WHERE order_id = o.id) AS "itemCount",
              o.placed_at AS "placedAt", o.created_at AS "createdAt", o.updated_at AS "updatedAt",
              o.idempotency_key AS "idempotencyKey", o.payment_expires_at AS "paymentExpiresAt"
         FROM orders o
        ${whereClause}
        LIMIT 1`,
      params,
    );

    const order = res.rows[0];
    if (!order) return null;

    const itemsRes = await db.query<OrderItemRecord>(
      `SELECT oi.id, oi.order_id AS "orderId", oi.crop_id AS "productId",
              cm.name, oi.grade, oi.qty_kg::text AS "qtyKg",
              oi.unit_price::text AS "unitPrice", oi.line_total::text AS "lineTotal"
         FROM order_items oi
         JOIN crop_master cm ON cm.id = oi.crop_id
        WHERE oi.order_id = $1
        ORDER BY oi.created_at ASC`,
      [order.id],
    );

    return { order, items: itemsRes.rows };
  },

  async listOrders(db, customerId, query) {
    const params: unknown[] = [customerId];
    let paramIndex = 2;
    let whereClause = `WHERE o.customer_id = $1`;

    if (query.status) {
      params.push(query.status);
      whereClause += ` AND o.status = $${paramIndex++}`;
    }

    if (query.cursor) {
      params.push(query.cursor);
      whereClause += ` AND o.placed_at < $${paramIndex++}::timestamptz`;
    }

    const limit = query.limit ?? 20;
    params.push(limit + 1);
    const limitParam = paramIndex;

    const res = await db.query<OrderRecord>(
      `SELECT o.id, o.order_number AS "orderNumber", o.customer_id AS "customerId",
              o.warehouse_id AS "warehouseId", o.cart_id AS "cartId", o.channel,
              o.fulfilment_type AS "fulfillmentType", o.delivery_address_id AS "deliveryAddressId",
              o.delivery_slot AS "deliverySlot", o.delivery_date::text AS "deliveryDate",
              o.subtotal::text AS subtotal, o.delivery_fee::text AS "deliveryFee",
              o.handling_fee::text AS "handlingFee",
              o.discount::text AS discount, o.gst_amount::text AS "gstAmount",
              o.total_amount::text AS "totalAmount", o.payment_method AS "paymentMethod",
              o.payment_status AS "paymentStatus", o.status, o.delivery_otp_hash AS "deliveryOtpHash",
              (SELECT COUNT(*)::int FROM order_items WHERE order_id = o.id) AS "itemCount",
              (SELECT COALESCE(json_agg(t), '[]'::json) FROM (
                 SELECT cm.name AS "productName", cm.icon_key AS "iconKey", oi.crop_id AS "cropId"
                   FROM order_items oi JOIN crop_master cm ON cm.id = oi.crop_id
                  WHERE oi.order_id = o.id
                  ORDER BY oi.line_total DESC, oi.id
                  LIMIT 3) t) AS thumbs,
              o.placed_at AS "placedAt", o.created_at AS "createdAt", o.updated_at AS "updatedAt",
              o.idempotency_key AS "idempotencyKey", o.payment_expires_at AS "paymentExpiresAt"
         FROM orders o
        ${whereClause}
        ORDER BY o.placed_at DESC
        LIMIT $${limitParam}`,
      params,
    );

    const hasMore = res.rows.length > limit;
    const orders = res.rows.slice(0, limit);
    const nextCursor = hasMore && orders.length > 0
      ? orders[orders.length - 1]!.placedAt.toISOString()
      : null;

    return { orders, nextCursor, hasMore };
  },

  async checkAndBookDeliverySlot(db, warehouseId, slotDate, slot) {
    const res = await db.query<{ id: string; capacity_orders: number; booked_orders: number; is_active: boolean }>(
      `SELECT id, capacity_orders, booked_orders, is_active
         FROM delivery_slots
        WHERE warehouse_id = $1 AND slot_date = $2 AND slot = $3
        FOR UPDATE`,
      [warehouseId, slotDate, slot],
    );

    if (res.rows.length > 0) {
      const slotRow = res.rows[0]!;
      // BR-161: a slot an admin switched off is as unbookable as a full one.
      if (!slotRow.is_active || slotRow.booked_orders >= slotRow.capacity_orders) {
        throw new Error('SLOT_CAPACITY_EXCEEDED');
      }
      await db.query(
        `UPDATE delivery_slots
            SET booked_orders = booked_orders + 1, updated_at = now()
          WHERE id = $1`,
        [slotRow.id],
      );
    }
  },

  async createOrder(db, params) {
    // BR-17 (amended) / BR-213: omitted status/paymentStatus keep the wallet path exactly as it was.
    const status = params.status ?? 'CONFIRMED';
    const paymentStatus = params.paymentStatus ?? (status === 'PENDING_PAYMENT' ? 'PENDING' : 'PAID');
    if (status === 'CONFIRMED' && paymentStatus !== 'PAID') {
      throw new Error('createOrder: an order is never CONFIRMED with an unpaid balance (BR-17).');
    }
    const statusNote =
      params.statusNote ??
      (status === 'CONFIRMED' ? 'Order placed via wallet checkout' : 'Order placed; awaiting gateway payment');

    const otpHash = createHash('sha256')
      .update(params.deliveryOtpPlaintext)
      .digest('hex');

    const dbFulfillmentType =
      params.fulfillmentType === 'HOME_DELIVERY' || params.fulfillmentType === 'DELIVERY'
        ? 'DELIVERY'
        : 'PICKUP';

    const orderRes = await db.query<OrderRecord>(
      `INSERT INTO orders (
         order_number, customer_id, warehouse_id, cart_id, channel,
         fulfilment_type, delivery_address_id, delivery_date, delivery_slot,
         subtotal, delivery_fee, discount, gst_amount, total_amount,
         payment_method, payment_status, status, delivery_otp_hash, placed_at, handling_fee,
         idempotency_key, payment_expires_at
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9,
         $10::numeric, $11::numeric, $12::numeric, $13::numeric, $14::numeric,
         $15, $19, $20::order_status, $16, now(), $18::numeric,
         $21, $22::timestamptz
       )
       RETURNING id, order_number AS "orderNumber", customer_id AS "customerId",
                 warehouse_id AS "warehouseId", cart_id AS "cartId", channel,
                 fulfilment_type AS "fulfillmentType", delivery_address_id AS "deliveryAddressId",
                 delivery_slot AS "deliverySlot", delivery_date::text AS "deliveryDate",
                 subtotal::text AS subtotal, delivery_fee::text AS "deliveryFee",
                 handling_fee::text AS "handlingFee",
                 discount::text AS discount, gst_amount::text AS "gstAmount",
                 total_amount::text AS "totalAmount", payment_method AS "paymentMethod",
                 payment_status AS "paymentStatus", status, delivery_otp_hash AS "deliveryOtpHash",
                 $17::int AS "itemCount", placed_at AS "placedAt",
                 created_at AS "createdAt", updated_at AS "updatedAt",
                 idempotency_key AS "idempotencyKey", payment_expires_at AS "paymentExpiresAt"`,
      [
        params.orderNumber,
        params.customerId,
        params.warehouseId,
        params.cartId,
        params.channel,
        dbFulfillmentType,
        params.deliveryAddressId ?? null,
        params.deliveryDate ?? null,
        params.deliverySlot ?? null,
        params.subtotal,
        params.deliveryFee,
        params.discount,
        params.gstAmount,
        params.totalAmount,
        params.paymentMethod,
        otpHash,
        params.items.length,
        params.handlingFee,
        paymentStatus,
        status,
        params.idempotencyKey ?? null,
        params.paymentExpiresAt ?? null,
      ],
    );
    const order = orderRes.rows[0]!;

    const insertedItems: OrderItemRecord[] = [];
    for (const item of params.items) {
      const itemRes = await db.query<OrderItemRecord>(
        `INSERT INTO order_items (
           order_id, crop_id, grade, qty_kg, unit_price, gst_rate, gst_amount, line_total
         )
         VALUES ($1, $2, $3, $4::numeric, $5::numeric, 0, 0, $6::numeric)
         RETURNING id, order_id AS "orderId", crop_id AS "productId",
                   $7::text AS "name", grade, qty_kg::text AS "qtyKg",
                   unit_price::text AS "unitPrice", line_total::text AS "lineTotal"`,
        [
          order.id,
          item.productId,
          item.grade,
          item.qtyKg,
          item.unitPrice,
          item.lineTotal,
          item.name,
        ],
      );
      insertedItems.push(itemRes.rows[0]!);
    }

    // Record status history
    await db.query(
      `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, note)
       VALUES ($1, NULL, $3::order_status, $2, $4)`,
      [order.id, params.actorUserId, status, statusNote],
    );

    // Mark cart and cart_items as CONVERTED
    await db.query(
      `UPDATE cart_items SET status = 'CONVERTED', updated_at = now() WHERE cart_id = $1 AND status = 'HELD'`,
      [params.cartId],
    );
    await db.query(
      `UPDATE carts SET status = 'CONVERTED', updated_at = now() WHERE id = $1`,
      [params.cartId],
    );

    return { order, items: insertedItems };
  },

  async convertAllocationsAndAppendStockLedger(
    db,
    items,
    orderId,
    warehouseId,
    actorUserId,
  ) {
    for (const item of items) {
      if (item.allocationId) {
        await db.query(
          `UPDATE allocations
              SET reserved_qty = GREATEST(0, reserved_qty - $1::numeric),
                  consumed_qty = consumed_qty + $1::numeric,
                  updated_at = now()
            WHERE id = $2`,
          [item.qtyKg, item.allocationId],
        );
      }

      if (item.batchId) {
        try {
          await db.query(
            `INSERT INTO stock_ledger (
               batch_id, warehouse_id, movement_type, qty_delta, balance_after,
               ref_type, ref_id, remarks, created_by
             )
             VALUES ($1, $2, 'SALE', -$3::numeric, 0, 'ORDER', $4, 'Customer order checkout', $5)`,
            [
              item.batchId,
              warehouseId,
              item.qtyKg,
              orderId,
              actorUserId,
            ],
          );
        } catch (error: unknown) {
          // trg_stock_ledger_balance refuses a movement that would take the batch below zero. The
          // allocation row can still show stock here, because a DIRECT counter sale draws the
          // batch without touching any allocation (BR-95k, owner decision 2026-10-11). That is a
          // stock conflict for the customer, not a server fault; the caller's transaction rolls
          // back the debit and the order.
          const pg = error as { code?: string; hint?: string };
          if (pg.code === '23514' && pg.hint === 'code: INSUFFICIENT_STOCK') {
            throw new AppError('STOCK_UNAVAILABLE', {
              detail: `${item.name} (${item.grade}) is no longer in stock for the quantity in your cart.`,
              cause: error,
            });
          }
          throw error;
        }
      }
    }
  },

  async findOrderByIdempotencyKey(db, customerId, idempotencyKey) {
    // BR-36 / BR-187: no customer, no order (fail closed).
    if (!customerId || !idempotencyKey) return null;

    // The wallet path keys its replay on the wallet debit row (unchanged since BR-17).
    const viaWallet = await this.findOrderByCartOrIdempotencyKey(db, customerId, idempotencyKey);
    if (viaWallet && viaWallet.order.customerId === customerId) {
      return { ...viaWallet, payment: await selectOrderPayment(db, viaWallet.order.id) };
    }

    const res = await db.query<OrderRecord>(
      `SELECT ${ORDER_PAYMENT_COLUMNS}
         FROM orders o
        WHERE o.customer_id = $1 AND o.idempotency_key = $2
        LIMIT 1`,
      [customerId, idempotencyKey],
    );
    const order = res.rows[0];
    if (!order) return null;
    return {
      order,
      items: await loadOrderItems(db, order.id),
      payment: await selectOrderPayment(db, order.id),
    };
  },

  async lockOrderForPayment(db, orderId) {
    return selectOrderForUpdate(db, orderId);
  },

  async getOrderByGatewayOrderId(db, gatewayOrderId) {
    const payRes = await db.query<OrderPaymentRecord>(
      `SELECT ${PAYMENT_COLUMNS}
         FROM payments p
        WHERE p.ref_type = 'ORDER' AND p.gateway_order_id = $1
        LIMIT 1`,
      [gatewayOrderId],
    );
    const payment = payRes.rows[0];
    if (!payment?.refId) return null;
    const orderRes = await db.query<OrderRecord>(
      `SELECT ${ORDER_PAYMENT_COLUMNS} FROM orders o WHERE o.id = $1`,
      [payment.refId],
    );
    const order = orderRes.rows[0];
    return order ? { order, payment } : null;
  },

  async getPaymentByGatewayOrderId(db, gatewayOrderId) {
    const res = await db.query<OrderPaymentRecord>(
      `SELECT ${PAYMENT_COLUMNS}
         FROM payments p
        WHERE p.gateway_order_id = $1
        ORDER BY p.created_at DESC
        LIMIT 1`,
      [gatewayOrderId],
    );
    return res.rows[0] ?? null;
  },

  async getOrderPayment(db, orderId) {
    return selectOrderPayment(db, orderId);
  },

  async insertOrderPayment(db, params) {
    const res = await db.query<OrderPaymentRecord>(
      `INSERT INTO payments (gateway, gateway_order_id, amount, currency, method, status, ref_type, ref_id)
       VALUES ($1, $2, $3::numeric, 'INR', $4::payment_method, 'CREATED', 'ORDER', $5)
       RETURNING ${PAYMENT_RETURNING}`,
      [params.gateway ?? 'razorpay', params.gatewayOrderId, params.amount, params.method, params.orderId],
    );
    return res.rows[0]!;
  },

  async markOrderPaymentCaptured(db, params) {
    const res = await db.query<OrderPaymentRecord>(
      `UPDATE payments
          SET status = 'CAPTURED',
              gateway_payment_id = $2,
              gateway_signature = COALESCE($3, gateway_signature),
              captured_at = COALESCE($4::timestamptz, now()),
              raw_payload = COALESCE($5::jsonb, raw_payload),
              updated_at = now()
        WHERE id = $1
          AND ref_type = 'ORDER'
          AND status IN ('CREATED', 'AUTHORIZED', 'FAILED')
        RETURNING ${PAYMENT_RETURNING}`,
      [
        params.paymentId,
        params.gatewayPaymentId,
        params.signature ?? null,
        params.capturedAt ?? null,
        params.rawPayload === undefined ? null : JSON.stringify(params.rawPayload),
      ],
    );
    return res.rows[0] ?? null;
  },

  async markOrderPaymentFailed(db, params) {
    const res = await db.query<OrderPaymentRecord>(
      `UPDATE payments
          SET status = 'FAILED',
              raw_payload = COALESCE($2::jsonb, raw_payload),
              updated_at = now()
        WHERE id = $1
          AND ref_type = 'ORDER'
          AND status IN ('CREATED', 'AUTHORIZED', 'FAILED')
        RETURNING ${PAYMENT_RETURNING}`,
      [params.paymentId, params.rawPayload === undefined ? null : JSON.stringify(params.rawPayload)],
    );
    return res.rows[0] ?? null;
  },

  async confirmPendingOrder(db, params) {
    const res = await db.query<{ id: string }>(
      `UPDATE orders
          SET status = 'CONFIRMED', payment_status = 'PAID', updated_at = now()
        WHERE id = $1 AND status = 'PENDING_PAYMENT'
        RETURNING id`,
      [params.orderId],
    );
    if (res.rows.length === 0) return null;
    await db.query(
      `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, note)
       VALUES ($1, 'PENDING_PAYMENT', 'CONFIRMED', $2, $3)`,
      [params.orderId, params.actorUserId, params.note ?? 'Gateway payment captured and verified'],
    );
    return selectOrderForUpdate(db, params.orderId);
  },

  async cancelPendingOrder(db, params) {
    const res = await db.query<{ id: string }>(
      `UPDATE orders
          SET status = 'CANCELLED', payment_status = 'FAILED',
              cancelled_at = now(), cancellation_reason = $2, updated_at = now()
        WHERE id = $1 AND status = 'PENDING_PAYMENT'
        RETURNING id`,
      [params.orderId, params.reason],
    );
    if (res.rows.length === 0) return null;
    await db.query(
      `UPDATE order_items SET status = 'CANCELLED', updated_at = now()
        WHERE order_id = $1 AND status = 'PENDING'`,
      [params.orderId],
    );
    await db.query(
      `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, note)
       VALUES ($1, 'PENDING_PAYMENT', 'CANCELLED', $2, $3)`,
      [
        params.orderId,
        params.actorUserId,
        params.note ??
          (params.reason === 'CUSTOMER_CANCELLED'
            ? 'Cancelled by customer before payment'
            : 'Payment not completed within the payment window'),
      ],
    );
    return selectOrderForUpdate(db, params.orderId);
  },

  async markOrderRefundDue(db, orderId) {
    const res = await db.query<{ id: string }>(
      `UPDATE orders SET payment_status = 'REFUND_DUE', updated_at = now()
        WHERE id = $1 AND status = 'CANCELLED'
        RETURNING id`,
      [orderId],
    );
    if (res.rows.length === 0) return null;
    return selectOrderForUpdate(db, orderId);
  },

  async releaseOrderStock(db, order, actorUserId) {
    // Idempotent: one release per order. The caller holds the order row lock, so two releases of
    // the same order cannot interleave here.
    const already = await db.query(
      `SELECT 1 FROM stock_ledger
        WHERE ref_type = 'ORDER' AND ref_id = $1 AND movement_type = 'RELEASE'
        LIMIT 1`,
      [order.id],
    );
    if ((already.rowCount ?? 0) > 0) return { released: false, ledgerRows: 0, allocations: 0 };

    // BR-37: a compensating RELEASE row per batch the order's SALE rows drew from (never an edit).
    const sales = await db.query<{ batch_id: string; warehouse_id: string; qty: string }>(
      `SELECT batch_id, warehouse_id, (-SUM(qty_delta))::text AS qty
         FROM stock_ledger
        WHERE ref_type = 'ORDER' AND ref_id = $1 AND movement_type = 'SALE'
        GROUP BY batch_id, warehouse_id
       HAVING SUM(qty_delta) < 0
        ORDER BY batch_id`,
      [order.id],
    );
    for (const row of sales.rows) {
      await db.query(
        `INSERT INTO stock_ledger (
           batch_id, warehouse_id, movement_type, qty_delta, balance_after,
           ref_type, ref_id, remarks, created_by
         )
         VALUES ($1, $2, 'RELEASE', $3::numeric, 0, 'ORDER', $4, 'Unpaid order cancelled: stock released', $5)`,
        [row.batch_id, row.warehouse_id, row.qty, order.id, actorUserId],
      );
    }

    // BR-12c: give the converted quantity back to the allocation bucket it was consumed from.
    let allocations = 0;
    if (order.cartId) {
      const alloc = await db.query(
        `UPDATE allocations a
            SET consumed_qty = GREATEST(0, a.consumed_qty - x.qty),
                updated_at = now()
           FROM (SELECT allocation_id, SUM(qty_kg) AS qty
                   FROM cart_items
                  WHERE cart_id = $1 AND status = 'CONVERTED' AND allocation_id IS NOT NULL
                  GROUP BY allocation_id) x
          WHERE a.id = x.allocation_id`,
        [order.cartId],
      );
      allocations = alloc.rowCount ?? 0;
    }

    return { released: true, ledgerRows: sales.rows.length, allocations };
  },

  async releaseDeliverySlot(db, order) {
    if (!order.deliveryDate || !order.deliverySlot) return false;
    const res = await db.query(
      `UPDATE delivery_slots
          SET booked_orders = booked_orders - 1, updated_at = now()
        WHERE warehouse_id = $1 AND slot_date = $2::date AND slot = $3 AND booked_orders > 0`,
      [order.warehouseId, order.deliveryDate, order.deliverySlot],
    );
    return (res.rowCount ?? 0) > 0;
  },

  async listExpiredPendingPaymentOrders(db, limit) {
    const res = await db.query<ExpiredPendingOrderRecord>(
      `SELECT o.id AS "orderId", o.customer_id AS "customerId",
              o.payment_expires_at AS "paymentExpiresAt",
              (SELECT p.gateway_order_id FROM payments p
                WHERE p.ref_type = 'ORDER' AND p.ref_id = o.id
                ORDER BY p.created_at DESC LIMIT 1) AS "gatewayOrderId"
         FROM orders o
        WHERE o.status = 'PENDING_PAYMENT'
          AND o.payment_expires_at IS NOT NULL
          AND o.payment_expires_at <= now()
        ORDER BY o.payment_expires_at ASC
        LIMIT $1`,
      [limit],
    );
    return res.rows;
  },

  async getOrderPaymentWindowMinutes(db) {
    const res = await db.query<{ value: unknown }>(
      `SELECT value FROM system_config WHERE key = 'order_payment_window_minutes'`,
    );
    const raw = res.rows[0]?.value;
    const minutes = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN;
    return Number.isInteger(minutes) && minutes > 0 ? minutes : ORDER_PAYMENT_WINDOW_MINUTES_DEFAULT;
  },
};
