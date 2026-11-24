import { lessThan, parseMoney, toPaise, type Money } from '@tohfa/shared-types';
import { paymentGateway as defaultPaymentGateway, type PaymentGateway } from '../../payments/index.js';
import { logger } from '../../logger.js';
import { parseRateBasisPoints } from '../sales/sales.math.js';
import {
  computeCheckoutTotals,
  toDbFulfilmentType,
  todayInKolkata,
  walletCoverage,
  type CheckoutTotals,
  type DbFulfilmentType,
} from './orders.pricing.js';
import { deliverySlotsService, type DeliverySlotsService } from '../delivery-slots/delivery-slots.service.js';
import type { CartCheckoutRecord } from './orders.repo.js';
import type { Actor } from '../../auth/requireAuth.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { config } from '../../config.js';
import { productImageUrl } from '../catalog/catalog.image.js';
import { walletInsufficientError } from '../wallet/wallet.insufficient.js';
import { AppError } from '../../http/problem.js';
import { requireIdempotencyKey } from '../../http/idempotency.js';
import { writeAuditLog } from '../../audit/auditLog.js';
import { walletService, type WalletService } from '../wallet/wallet.service.js';
import { cartService, type CartService } from '../cart/cart.service.js';
import { gramsToKg, kgToGrams } from '../sales/sales.math.js';
import { createOrderEventPublisher, type OrderEventPublisher } from './orders.events.js';
import {
  ordersRepo,
  type OrdersRepo,
  type OrderRecord,
  type OrderItemRecord,
  type OrderPaymentRecord,
} from './orders.repo.js';
import { paymentMethodLabel, pickupCode, pickupQr } from './orders.display.js';
import { isGatewayPaymentMethod } from './orders.schema.js';
import type {
  CheckoutRequest,
  ListOrdersQuery,
  OrderGatewayPayment,
  OrderResponse,
  OrderSummaryResponse,
  QuoteRequest,
  QuoteResponse,
  ReorderResponse,
  ReorderUnavailableItem,
  ReorderUnavailableReason,
} from './orders.schema.js';

export interface OrdersService {
  checkout(
    actor: Actor,
    scope: ResolvedScope,
    input: CheckoutRequest,
    idempotencyKey?: string,
  ): Promise<OrderResponse>;

  /**
   * BR-200: what checkout would charge for the caller's cart right now. Read-only: reserves,
   * debits, books and creates nothing. Uses the same pricing path as checkout.
   */
  quote(actor: Actor, scope: ResolvedScope, input: QuoteRequest): Promise<QuoteResponse>;

  getOrder(
    actor: Actor,
    scope: ResolvedScope,
    orderId: string,
  ): Promise<OrderResponse>;

  listOrders(
    actor: Actor,
    scope: ResolvedScope,
    query: ListOrdersQuery,
  ): Promise<{ items: OrderSummaryResponse[]; page: { nextCursor: string | null; hasMore: boolean } }>;

  /** BR-162: put a past order's lines back in the active cart, as far as stock allows today. */
  reorder(
    actor: Actor,
    scope: ResolvedScope,
    orderId: string,
    idempotencyKey: string | undefined,
  ): Promise<ReorderResponse>;
}

/**
 * BR-162: cart refusals that mean "not available today" rather than a fault. Anything else (a
 * database error, a 403) propagates, so a broken cart is never reported as "out of stock".
 */
function reorderReason(err: unknown): ReorderUnavailableReason | null {
  if (!(err instanceof AppError)) return null;
  if (err.code === 'STOCK_UNAVAILABLE') return 'OUT_OF_STOCK';
  if (err.code === 'INSUFFICIENT_ALLOCATION') return 'INSUFFICIENT_ALLOCATION';
  // No active retail price for the product/grade any more.
  if (err.code === 'NOT_FOUND') return 'DELISTED';
  return null;
}

function thumbnail(productName: string, iconKey: string | null, cropId: string) {
  return { productName, imageUrl: productImageUrl(iconKey, cropId) };
}

/** BR-213: the public key id the Razorpay sheet is opened with (never the secret). */
export function razorpayKeyIdFor(gateway: PaymentGateway): string {
  return gateway.provider === 'razorpay' ? config.RAZORPAY_KEY_ID : 'rzp_test_mock_publishable_key';
}

/**
 * BR-213: the `payment` block of a gateway-paid order (null for WALLET orders and for an order
 * whose payments row is missing). The amount is the stored server total, never a client value.
 */
export function orderPaymentBlock(
  order: OrderRecord,
  payment: OrderPaymentRecord | null,
  razorpayKeyId: string,
): OrderGatewayPayment | null {
  if (!payment?.gatewayOrderId || !isGatewayPaymentMethod(order.paymentMethod)) return null;
  const expiresAt = order.paymentExpiresAt ?? null;
  return {
    gateway: 'RAZORPAY',
    gatewayOrderId: payment.gatewayOrderId,
    razorpayKeyId,
    amount: parseMoney(order.totalAmount),
    currency: 'INR',
    expiresAt: (expiresAt ? new Date(expiresAt) : order.placedAt).toISOString(),
  };
}

export function mapOrderResponse(
  order: OrderRecord,
  items: OrderItemRecord[],
  payment: OrderGatewayPayment | null = null,
): OrderResponse {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    channel: order.channel,
    fulfillmentType: order.fulfillmentType,
    warehouseId: order.warehouseId,
    itemCount: items.length,
    thumbnails: items.slice(0, 3).map((it) => thumbnail(it.name, it.iconKey ?? null, it.productId)),
    totalAmount: order.totalAmount as Money,
    paymentStatus: order.paymentStatus,
    deliveryDate: order.deliveryDate,
    placedAt: order.placedAt.toISOString(),
    payment,
    ...(order.cancellationReason === undefined ? {} : { cancellationReason: order.cancellationReason }),
    subtotal: order.subtotal as Money,
    deliveryFee: order.deliveryFee as Money,
    handlingFee: order.handlingFee as Money,
    discount: order.discount as Money,
    gstAmount: order.gstAmount as Money,
    deliveryAddressId: order.deliveryAddressId,
    deliverySlot: order.deliverySlot,
    paymentMethod: order.paymentMethod,
    paymentMethodLabel: paymentMethodLabel(order.paymentMethod),
    pickupCode: pickupCode(order.orderNumber, order.fulfillmentType),
    pickupQr: pickupQr(order.orderNumber, order.fulfillmentType, config.JWT_SECRET),
    items: items.map((it) => ({
      id: it.id,
      productId: it.productId,
      name: it.name,
      grade: it.grade,
      qtyKg: it.qtyKg,
      unitPrice: it.unitPrice as Money,
      lineTotal: it.lineTotal as Money,
    })),
  };
}

export function createOrdersService(opts: {
  repo?: OrdersRepo;
  walletSvc?: WalletService;
  db?: Executor;
  events?: OrderEventPublisher;
  cartSvc?: CartService;
  slotsSvc?: DeliverySlotsService;
  /** BR-213: the Razorpay (or mock) gateway that creates the order's gateway order. */
  gateway?: PaymentGateway;
  /** Clock for the payment window (tests). */
  now?: () => Date;
} = {}): OrdersService {
  const repo = opts.repo ?? ordersRepo;
  const walletSvc = opts.walletSvc ?? walletService;
  const db = opts.db ?? pool;
  // BR-163: order.confirmed after commit, best-effort, never on an idempotent replay.
  const events = opts.events ?? createOrderEventPublisher({ db });
  const cartSvc = opts.cartSvc ?? cartService;
  const slotsSvc = opts.slotsSvc ?? deliverySlotsService;
  const gateway = opts.gateway ?? defaultPaymentGateway;
  const now = opts.now ?? (() => new Date());

  /**
   * BR-17 (amended 2026-11-20) / BR-213 / BR-216. WALLET, UPI, CARD and NETBANKING are accepted;
   * CASH (cash on delivery / at the shop) stays disabled: 422 PAYMENT_METHOD_DISABLED, never 501.
   * Shared by checkout and quote, so the quote refuses exactly what checkout refuses.
   */
  function assertPaymentMethod(input: CheckoutRequest): void {
    if (input.paymentMethod === 'CASH') {
      throw new AppError('PAYMENT_METHOD_DISABLED', {
        status: 422,
        detail: 'Cash payment is not available for online orders (BR-216). Pay by wallet, UPI, card or net banking.',
      });
    }
  }

  /** Replays a POST /orders key: the same order, with its payment block (BR-213 5). */
  async function replayCheckout(customerId: string, key: string): Promise<OrderResponse | null> {
    const existing = await repo.findOrderByIdempotencyKey(db, customerId, key);
    if (!existing) return null;
    return mapOrderResponse(
      existing.order,
      existing.items,
      orderPaymentBlock(existing.order, existing.payment, razorpayKeyIdFor(gateway)),
    );
  }

  /**
   * BR-200: THE pricing path. Checkout and quote both call this with the same cart and body, so
   * the quoted total is the order total by construction. Validates the fulfilment inputs
   * (BR-161), reads the fees and GST rate from system_config (BR-98) and calls the one pure
   * pricing function (orders.pricing computeCheckoutTotals). Read-only.
   */
  async function priceCart(
    executor: Executor,
    customerId: string,
    cart: CartCheckoutRecord,
    input: CheckoutRequest,
  ): Promise<{ fulfilment: DbFulfilmentType; totals: CheckoutTotals; gstRateBasisPoints: number; freeDeliveryThreshold: Money }> {
    const deliveryConfig = await repo.getDeliveryConfig(executor);
    // BR-161: HOME_DELIVERY / DELIVERY and PICKUP / WAREHOUSE_PICKUP are client aliases of the
    // two DB enum values; everything below works on the DB value.
    const fulfilment = toDbFulfilmentType(input.fulfillmentType);

    if (fulfilment === 'DELIVERY') {
      if (!deliveryConfig.homeDeliveryEnabled) {
        throw new AppError('INTERNAL', {
          status: 501,
          detail: 'Home delivery is currently disabled.',
        });
      }
      if (!input.deliveryAddressId) {
        throw new AppError('VALIDATION_FAILED', {
          status: 422,
          detail: 'Delivery address is required for home delivery.',
        });
      }
      if (!input.deliveryDate || !input.deliverySlot) {
        throw new AppError('VALIDATION_FAILED', {
          status: 422,
          detail: 'Delivery date and slot are required for home delivery.',
        });
      }
      // BR-161 / BR-36: the address must be the caller's own live address. Unknown, deleted
      // and another customer's address are the same 404.
      if (!(await repo.isOwnLiveAddress(executor, customerId, input.deliveryAddressId))) {
        throw new AppError('NOT_FOUND', {
          status: 404,
          detail: `No address with id ${input.deliveryAddressId} is visible to you.`,
        });
      }
      if (input.deliveryDate < todayInKolkata()) {
        throw new AppError('VALIDATION_FAILED', {
          status: 422,
          detail: 'Delivery date cannot be in the past.',
          errors: { deliveryDate: ['must be today or later (Asia/Kolkata)'] },
        });
      }
    }

    // BR-161 / BR-98: integer paise throughout; GST rate from system_config, half-up, per order.
    const rawRate = await repo.getRetailGstRateRaw(executor);
    let gstRateBasisPoints = parseRateBasisPoints(rawRate);
    if (gstRateBasisPoints === null) {
      logger.warn(
        { key: 'retail_gst_rate_percent', present: rawRate !== undefined },
        'checkout: GST rate missing or invalid in system_config; using the documented default 0 (BR-98i)',
      );
      gstRateBasisPoints = 0;
    }
    const totals = computeCheckoutTotals({
      lineTotals: cart.items.map((it) => it.lineTotal),
      fulfilment,
      deliveryFee: deliveryConfig.deliveryFee,
      freeDeliveryThreshold: deliveryConfig.freeDeliveryThreshold,
      handlingFee: deliveryConfig.handlingFee,
      gstRateBasisPoints,
    });
    return { fulfilment, totals, gstRateBasisPoints, freeDeliveryThreshold: deliveryConfig.freeDeliveryThreshold };
  }

  const slotFull = (): AppError =>
    new AppError('SLOT_FULL', {
      status: 409,
      detail: 'Selected delivery slot is fully booked or closed (BR-201).',
    });

  const slotCutoffPassed = (): AppError =>
    new AppError('SLOT_CUTOFF_PASSED', {
      status: 409,
      detail: 'The ordering cutoff for the selected delivery slot has passed (BR-210). Pick a later slot.',
    });

  return {
    async checkout(actor, scope, input, idempotencyKey) {
      if (!actor.customerId) {
        throw new AppError('FORBIDDEN', {
          status: 403,
          detail: 'Orders can only be placed by customers.',
        });
      }

      assertPaymentMethod(input);
      // BR-213 1: Idempotency-Key is required for every method (docs/openapi.yaml).
      const key = requireIdempotencyKey(idempotencyKey);
      const customerId = actor.customerId;
      const viaGateway = isGatewayPaymentMethod(input.paymentMethod);

      // Replay before the cart lookup: the cart of a placed order is already CONVERTED.
      const replayed = await replayCheckout(customerId, key);
      if (replayed) return replayed;

      const cart = await repo.findCartForCheckout(db, actor.customerId);
      if (!cart || cart.items.length === 0) {
        throw new AppError('NOT_FOUND', {
          status: 404,
          detail: 'No active cart found for checkout.',
        });
      }

      if (
        cart.status !== 'LOCKED' ||
        !cart.lockedUntil ||
        new Date(cart.lockedUntil) <= new Date()
      ) {
        throw new AppError('CART_LOCK_EXPIRED', {
          status: 409,
          detail: 'Cart reservation lock has expired (BR-22). Please re-add items.',
        });
      }

      // BR-200: the one pricing path shared with POST /orders/quote.
      const { fulfilment, totals } = await priceCart(db, customerId, cart, input);
      const { subtotal, deliveryFee, handlingFee, discount, gstAmount, totalAmount } = totals;

      // BR-210: refuse a slot whose ordering cutoff (start - delivery_slot_cutoff_minutes) passed.
      if (fulfilment === 'DELIVERY' && input.deliveryDate && input.deliverySlot) {
        const view = await slotsSvc.describeOne(db, input.warehouseId, input.deliveryDate, input.deliverySlot);
        if (view.cutoffPassed) throw slotCutoffPassed();
      }

      // BR-17 / BR-213 2: the wallet balance check is WALLET-only, compared in paise.
      const wallet = viaGateway ? null : await walletSvc.getWalletForActor(actor);
      if (wallet && lessThan(wallet.balance as Money, totalAmount)) {
        throw walletInsufficientError({
          balance: wallet.balance,
          required: totalAmount,
          detail: `Wallet balance INR ${wallet.balance} is insufficient for order total INR ${totalAmount}.`,
        });
      }

      // BR-215 1: the payment window of a gateway order.
      const paymentExpiresAt = viaGateway
        ? new Date(now().getTime() + (await repo.getOrderPaymentWindowMinutes(db)) * 60_000)
        : null;
      const keyId = razorpayKeyIdFor(gateway);

      let placed: { response: OrderResponse; confirmed: boolean };
      try {
        placed = await withTransaction(async (tx) => {
          if (fulfilment === 'DELIVERY' && input.deliveryDate && input.deliverySlot) {
            try {
              await repo.checkAndBookDeliverySlot(
                tx,
                input.warehouseId,
                input.deliveryDate,
                input.deliverySlot,
              );
            } catch (err: unknown) {
              if (err instanceof Error && err.message === 'SLOT_CAPACITY_EXCEEDED') {
                // BR-201: a specific code so the client can reopen the slot picker.
                throw slotFull();
              }
              throw err;
            }
          }

          const orderNumber = await repo.generateOrderNumber(tx);
          const deliveryOtp = String(Math.floor(1000 + Math.random() * 9000));

          if (wallet) {
            // BR-17: WALLET, unchanged. Debit in the same transaction as the order.
            await walletSvc.move(
              scope,
              {
                walletId: wallet.id,
                direction: 'DEBIT',
                type: 'ORDER_DEBIT',
                amount: totalAmount,
                refType: 'ORDER',
                refId: cart.id,
                idempotencyKey: `order_debit_${key}`,
                remarks: `Payment for order ${orderNumber}`,
                createdBy: actor.userId,
              },
              tx,
            );
          }

          // WALLET: CONFIRMED / PAID. Gateway methods: PENDING_PAYMENT / PENDING (BR-213 3).
          const { order, items } = await repo.createOrder(tx, {
            orderNumber,
            customerId,
            warehouseId: input.warehouseId,
            cartId: cart.id,
            channel: 'ONLINE',
            fulfillmentType: fulfilment,
            // A pickup order carries no address or slot (orders_pickup_has_no_address_chk).
            deliveryAddressId: fulfilment === 'DELIVERY' ? input.deliveryAddressId : null,
            deliveryDate: fulfilment === 'DELIVERY' ? input.deliveryDate : null,
            deliverySlot: fulfilment === 'DELIVERY' ? input.deliverySlot : null,
            subtotal,
            deliveryFee,
            handlingFee,
            discount,
            gstAmount,
            totalAmount,
            paymentMethod: input.paymentMethod,
            deliveryOtpPlaintext: deliveryOtp,
            items: cart.items,
            actorUserId: actor.userId,
            idempotencyKey: key,
            ...(viaGateway
              ? { status: 'PENDING_PAYMENT' as const, paymentStatus: 'PENDING' as const, paymentExpiresAt }
              : {}),
          });

          // Convert allocations & append stock ledger SALE rows. This is where a stock conflict
          // (STOCK_UNAVAILABLE) surfaces, so it runs BEFORE any Razorpay order is created.
          await repo.convertAllocationsAndAppendStockLedger(
            tx,
            cart.items,
            order.id,
            input.warehouseId,
            actor.userId,
          );

          let paymentBlock: OrderGatewayPayment | null = null;
          if (viaGateway) {
            // BR-213 3 / 8: the Razorpay order for the SERVER total. A gateway failure throws
            // 503 and rolls back everything above (order, stock, slot, cart).
            let gatewayOrderId: string;
            try {
              const created = await gateway.createOrder({
                amountPaise: toPaise(totalAmount),
                currency: 'INR',
                receipt: order.orderNumber,
                notes: { orderId: order.id, orderNumber: order.orderNumber, customerId },
              });
              gatewayOrderId = created.gatewayOrderId;
            } catch (err: unknown) {
              throw new AppError('PAYMENT_GATEWAY_UNAVAILABLE', {
                status: 503,
                detail: 'The payment gateway could not be reached. Nothing was charged or reserved; please retry.',
                cause: err,
              });
            }
            const paymentRow = await repo.insertOrderPayment(tx, {
              orderId: order.id,
              gatewayOrderId,
              amount: totalAmount,
              method: input.paymentMethod,
            });
            paymentBlock = orderPaymentBlock(
              { ...order, paymentExpiresAt: order.paymentExpiresAt ?? paymentExpiresAt },
              paymentRow,
              keyId,
            );
          }

          await writeAuditLog(tx, {
            actorId: actor.userId,
            actorRole: scope.roleCode,
            actionCode: 'order.place',
            entityType: 'order',
            entityId: order.id,
            warehouseId: input.warehouseId,
            after: {
              orderNumber: order.orderNumber,
              totalAmount: order.totalAmount,
              status: order.status,
              paymentStatus: order.paymentStatus,
              paymentMethod: input.paymentMethod,
              ...(paymentBlock ? { gatewayOrderId: paymentBlock.gatewayOrderId } : {}),
            },
          });

          return { response: mapOrderResponse(order, items, paymentBlock), confirmed: !viaGateway };
        });
      } catch (err: unknown) {
        // A concurrent request with the same key lost the race on the unique key (the order's
        // idempotency key or the wallet debit's): answer with the winner's order.
        if ((err as { code?: string }).code === '23505') {
          const winner = await replayCheckout(customerId, key);
          if (winner) return winner;
        }
        throw err;
      }

      // BR-163 / BR-213 6: order.confirmed only for an order that IS confirmed (wallet).
      if (placed.confirmed) await events.publish('order.confirmed', placed.response.id);
      return placed.response;
    },

    async quote(actor, _scope, input) {
      // BR-187: an own scope with no customer id narrows to nothing; same refusal as checkout.
      if (!actor.customerId) {
        throw new AppError('FORBIDDEN', {
          status: 403,
          detail: 'Orders can only be quoted for customers.',
        });
      }
      assertPaymentMethod(input);

      const cart = await repo.findCartForCheckout(db, actor.customerId);
      if (!cart || cart.items.length === 0) {
        throw new AppError('NOT_FOUND', {
          status: 404,
          detail: 'No active cart found for checkout.',
        });
      }

      // BR-200: the same pricing path checkout runs, on the same cart rows.
      const { fulfilment, totals, gstRateBasisPoints, freeDeliveryThreshold } = await priceCart(
        db,
        actor.customerId,
        cart,
        input,
      );

      // BR-201: checkout refuses a full or switched-off slot; the quote says so first, read-only.
      let slot: QuoteResponse['slot'] = null;
      if (fulfilment === 'DELIVERY' && input.deliveryDate && input.deliverySlot) {
        const view = await slotsSvc.describeOne(db, input.warehouseId, input.deliveryDate, input.deliverySlot);
        if (view.cutoffPassed) throw slotCutoffPassed();
        if (!view.bookable) throw slotFull();
        slot = {
          date: view.date,
          slot: view.slot,
          label: view.label,
          startsAt: view.startsAt,
          cutoff: view.cutoff,
          cutoffPassed: view.cutoffPassed,
          capacity: view.capacity,
          booked: view.booked,
          available: view.available,
          bookable: view.bookable,
        };
      }

      // Read-only balance: no wallet is created by a quote (checkout creates one if missing).
      const walletBalance = parseMoney((await repo.getCustomerWalletBalance(db, actor.customerId)) ?? '0.00');
      const coverage = walletCoverage(walletBalance, totals.totalAmount);
      const lockExpired =
        cart.status !== 'LOCKED' || !cart.lockedUntil || new Date(cart.lockedUntil) <= new Date();

      return {
        fulfillmentType: input.fulfillmentType,
        warehouseId: input.warehouseId,
        cartId: cart.id,
        cartStatus: cart.status,
        lockExpiresAt: cart.lockedUntil ? new Date(cart.lockedUntil).toISOString() : null,
        lockExpired,
        lines: cart.items.map((it) => ({
          id: it.id,
          productId: it.productId,
          name: it.name,
          grade: it.grade,
          qtyKg: it.qtyKg,
          unitPrice: parseMoney(it.unitPrice),
          lineTotal: parseMoney(it.lineTotal),
        })),
        itemCount: cart.items.length,
        subtotal: totals.subtotal,
        deliveryFee: totals.deliveryFee,
        handlingFee: totals.handlingFee,
        gstRateBasisPoints,
        gstAmount: totals.gstAmount,
        discount: totals.discount,
        totalAmount: totals.totalAmount,
        freeDeliveryThreshold: parseMoney(freeDeliveryThreshold),
        walletBalance,
        walletSufficient: coverage.sufficient,
        shortfall: coverage.shortfall,
        slot,
      };
    },

    async reorder(actor, scope, orderId, idempotencyKey) {
      // docs/openapi.yaml requires the header. The operation is idempotent by STATE rather than
      // by a stored response: a line already in the cart at the ordered quantity is not added
      // again, so a replay (same key or not) never doubles a reservation.
      requireIdempotencyKey(idempotencyKey);
      // Own orders only: another customer's order is the same 404 as an unknown id (BR-36).
      const customerId = actor.customerId;
      const past = customerId ? await repo.findOrderById(db, orderId, customerId) : null;
      if (!past) {
        throw new AppError('NOT_FOUND', { status: 404, detail: 'Order not found.' });
      }

      // Each line is reserved on its own (the cart's own transaction and BR-22 lock), so one
      // sold-out line does not stop the others. Today's retail price applies, never the old one.
      const current = await cartSvc.getCart(actor, scope);
      const heldGrams = new Map<string, number>();
      for (const line of current.items) {
        heldGrams.set(`${line.productId}:${line.grade}`, kgToGrams(line.qtyKg));
      }

      const unavailable: ReorderUnavailableItem[] = [];
      let addedCount = 0;
      for (const item of past.items) {
        const missingGrams = kgToGrams(item.qtyKg) - (heldGrams.get(`${item.productId}:${item.grade}`) ?? 0);
        if (missingGrams <= 0) {
          addedCount += 1;
          continue;
        }
        try {
          await cartSvc.addItem(actor, scope, {
            productId: item.productId,
            grade: item.grade,
            qtyKg: gramsToKg(missingGrams),
            warehouseId: past.order.warehouseId,
          });
          addedCount += 1;
        } catch (err) {
          const reason = reorderReason(err);
          if (reason === null) throw err;
          unavailable.push({
            productId: item.productId,
            name: item.name,
            grade: item.grade,
            qtyKg: item.qtyKg,
            reason,
          });
        }
      }

      return { cart: await cartSvc.getCart(actor, scope), addedCount, unavailable };
    },

    async getOrder(actor, _scope, orderId) {
      // BR-187: `own` scope with no resolvable customer id narrows to nothing (404), never to
      // every order. Staff read orders through /admin/orders with order.list.view_all.
      const customerId = actor.customerId;
      const res = customerId ? await repo.findOrderById(db, orderId, customerId) : null;

      if (!res) {
        throw new AppError('NOT_FOUND', {
          status: 404,
          detail: 'Order not found.',
        });
      }

      // BR-213: a gateway order carries its Razorpay checkout parameters so the client can reopen
      // the sheet (WALLET orders have no payments row; skip the read).
      const payment = isGatewayPaymentMethod(res.order.paymentMethod)
        ? await repo.getOrderPayment(db, res.order.id)
        : null;
      return mapOrderResponse(res.order, res.items, orderPaymentBlock(res.order, payment, razorpayKeyIdFor(gateway)));
    },

    async listOrders(actor, _scope, query) {
      if (!actor.customerId) {
        throw new AppError('FORBIDDEN', {
          status: 403,
          detail: 'Orders can only be listed by customers.',
        });
      }

      const { orders, nextCursor, hasMore } = await repo.listOrders(
        db,
        actor.customerId,
        query,
      );

      const items: OrderSummaryResponse[] = orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        channel: o.channel,
        fulfillmentType: o.fulfillmentType,
        warehouseId: o.warehouseId,
        itemCount: o.itemCount,
        thumbnails: (o.thumbs ?? []).map((t) => thumbnail(t.productName, t.iconKey, t.cropId)),
        totalAmount: o.totalAmount as Money,
        paymentStatus: o.paymentStatus,
        deliveryDate: o.deliveryDate,
        placedAt: o.placedAt.toISOString(),
      }));

      return {
        items,
        page: {
          nextCursor,
          hasMore,
        },
      };
    },
  };
}

export const ordersService = createOrdersService();
