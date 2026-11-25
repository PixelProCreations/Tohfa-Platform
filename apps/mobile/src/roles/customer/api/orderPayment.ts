/**
 * Pay for an order, end to end (no UI). BR-17 as amended, BR-220, BR-221, BR-224.
 *
 *   1. `POST /orders` {..., paymentMethod} + Idempotency-Key -> Order.
 *      WALLET: CONFIRMED/PAID at once -> done. UPI/CARD/NETBANKING:
 *      PENDING_PAYMENT with a `payment` block (gatewayOrderId, razorpayKeyId,
 *      amount = server total, expiresAt). CASH: 422 PAYMENT_METHOD_DISABLED.
 *   2. Open the Razorpay sheet with that key/order (amount in integer paise
 *      derived from the server Money string; card/UPI/bank details are
 *      collected by Razorpay, never in-app), method preselected.
 *   3. On SDK success: `POST /orders/{id}/payment/verify` with the handler
 *      response, then poll `GET /orders/{id}` until CONFIRMED / CANCELLED or
 *      `pollTimeoutMs` passes. The webhook confirms too (same server
 *      function), so an unverified-but-captured payment still lands.
 *
 * Only a server order with `status === 'CONFIRMED'` is ever reported as
 * `confirmed` (BR-224). Outcomes:
 *   confirmed | pending (not settled within the poll window) |
 *   cancelled (customer closed the sheet; order still PENDING_PAYMENT, retry
 *   with `payPendingOrder` or cancel with `cancelPendingOrder`) |
 *   failed (gateway error / verification rejected / payments unavailable) |
 *   expired (server cancelled the order: window passed or late capture).
 *
 * Idempotency: one key per checkout attempt via `orderIdempotencyKeys`, keyed
 * by the checkout fingerprint (which includes the method). A network retry of
 * step 1 replays the key (same order, same gatewayOrderId); once the server
 * order exists the key is released.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toPaise } from '@tohfa/shared-types';
import { ApiError } from '../../../shell/api/client';
import { createIdempotencyKeyCache } from '../../../shell/api/idempotency';
import { openRazorpayCheckout, type RazorpayCheckoutInput, type RazorpayOutcome } from '../../../shell/payments/razorpay';
import {
  cancelPendingOrder,
  checkoutFingerprint,
  fetchOrder,
  orderIdempotencyKeys,
  orderQueryKeys,
  placeOrder,
  verifyOrderPayment,
  type CheckoutInput,
  type GatewayPaymentMethod,
  type Order,
} from './orders';
import { cartQueryKeys } from './cart';
import { walletQueryKeys } from './wallet';
import { clearPendingOrderPayment, savePendingOrderPayment } from '../state/pendingOrderPayment';

export type OrderPaymentOutcome =
  | { status: 'confirmed'; order: Order }
  /** Paid in the sheet (or replayed) but the server has not confirmed within the poll window. */
  | { status: 'pending'; order: Order }
  /** Customer closed the Razorpay sheet; the order is still PENDING_PAYMENT. */
  | { status: 'cancelled'; order: Order }
  | {
      status: 'failed';
      order: Order;
      /** gateway: the SDK reported a failed attempt (retryable); verification: server rejected the payment; unavailable: no Razorpay key. */
      reason: 'gateway' | 'verification' | 'unavailable';
      code?: string;
      description?: string;
    }
  /** The server cancelled the order (payment window passed / late capture => REFUND_DUE). */
  | { status: 'expired'; order: Order };

export interface PaySheetOptions {
  prefill?: RazorpayCheckoutInput['prefill'];
  /** Shown in the Razorpay sheet; pass a translated string. Defaults to 'TOHFA'. */
  merchantName?: string;
  description?: string;
}

export interface StartOrderPaymentInput extends PaySheetOptions {
  checkout: CheckoutInput;
}

export interface OrderPaymentDeps {
  placeOrder: typeof placeOrder;
  verifyOrderPayment: typeof verifyOrderPayment;
  fetchOrder: (id: string) => Promise<Order>;
  openCheckout: (input: RazorpayCheckoutInput) => Promise<RazorpayOutcome>;
  sleep: (ms: number) => Promise<void>;
  now: () => number;
  pollIntervalMs: number;
  pollTimeoutMs: number;
}

const defaultDeps: OrderPaymentDeps = {
  placeOrder,
  verifyOrderPayment,
  fetchOrder: (id) => fetchOrder(id),
  openCheckout: (input) => openRazorpayCheckout(input),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now: () => Date.now(),
  pollIntervalMs: 2000,
  pollTimeoutMs: 60000,
};

const METHOD_HINT: Record<GatewayPaymentMethod, string> = { UPI: 'upi', CARD: 'card', NETBANKING: 'netbanking' };

function methodHint(order: Order, fallback?: string): string | undefined {
  const m = order.paymentMethod;
  if (m === 'UPI' || m === 'CARD' || m === 'NETBANKING') return METHOD_HINT[m];
  return fallback;
}

/** The terminal outcome a server order status maps to, or null while still awaiting payment. */
export function outcomeForOrder(order: Order): OrderPaymentOutcome | null {
  if (order.status === 'CONFIRMED') return { status: 'confirmed', order };
  if (order.status === 'CANCELLED') return { status: 'expired', order };
  if (order.status === 'PENDING_PAYMENT') return null;
  // Already past CONFIRMED (e.g. a replay of an old key): not a fresh success; let the UI link to the order.
  return { status: 'pending', order };
}

const isOrder = (v: unknown): v is Order =>
  typeof v === 'object' && v !== null && typeof (v as Order).id === 'string' && typeof (v as Order).status === 'string';

/** Poll GET /orders/{id} until it leaves PENDING_PAYMENT or the window closes. Poll errors are retried. */
export async function pollOrderPayment(
  order: Order,
  deps: Pick<OrderPaymentDeps, 'fetchOrder' | 'sleep' | 'now' | 'pollIntervalMs' | 'pollTimeoutMs'>,
): Promise<OrderPaymentOutcome> {
  const deadline = deps.now() + deps.pollTimeoutMs;
  let last = order;
  for (;;) {
    try {
      last = await deps.fetchOrder(order.id);
      const out = outcomeForOrder(last);
      if (out !== null) return out;
    } catch {
      // transient; keep polling until the deadline
    }
    if (deps.now() + deps.pollIntervalMs > deadline) return { status: 'pending', order: last };
    await deps.sleep(deps.pollIntervalMs);
  }
}

/**
 * Open (or reopen, for Retry payment) the Razorpay sheet for an order that is
 * PENDING_PAYMENT, then verify + poll. Reuses the order's own gatewayOrderId.
 */
export async function payPendingOrder(
  order: Order,
  options: PaySheetOptions & { methodHint?: string } = {},
  overrides: Partial<OrderPaymentDeps> = {},
): Promise<OrderPaymentOutcome> {
  const deps: OrderPaymentDeps = { ...defaultDeps, ...overrides };
  const payment = order.payment;
  if (payment == null || !payment.razorpayKeyId || !payment.gatewayOrderId) {
    return { status: 'failed', order, reason: 'unavailable' };
  }

  // Persist before the sheet opens: a kill inside Razorpay resumes polling on next launch.
  await savePendingOrderPayment({
    orderId: order.id,
    gatewayOrderId: payment.gatewayOrderId,
    createdAt: deps.now(),
    expiresAt: payment.expiresAt,
    amount: payment.amount,
  });

  const sdk = await deps.openCheckout({
    keyId: payment.razorpayKeyId,
    orderId: payment.gatewayOrderId,
    amountPaise: toPaise(payment.amount),
    currency: payment.currency,
    name: options.merchantName ?? 'TOHFA',
    description: options.description,
    prefill: options.prefill,
    method: methodHint(order, options.methodHint),
  });
  // Cancel / failure: the order stays PENDING_PAYMENT (retryable until expiresAt); keep the record.
  if (sdk.status === 'cancelled') return { status: 'cancelled', order };
  if (sdk.status === 'failed') return { status: 'failed', order, reason: 'gateway', description: sdk.description };

  let current = order;
  if (sdk.signature !== undefined && sdk.signature.length > 0) {
    try {
      const verified = await deps.verifyOrderPayment(order.id, {
        razorpayOrderId: sdk.orderId ?? payment.gatewayOrderId,
        razorpayPaymentId: sdk.paymentId,
        razorpaySignature: sdk.signature,
      });
      // 200 -> Order; 202 PAYMENT_PENDING -> not an Order, fall through to polling.
      if (isOrder(verified)) {
        current = verified;
        const out = outcomeForOrder(verified);
        if (out !== null) {
          if (out.status !== 'pending') await clearPendingOrderPayment(order.id);
          return out;
        }
      }
    } catch (err) {
      const code = err instanceof ApiError ? (err.code as string) : '';
      if (code === 'ORDER_PAYMENT_EXPIRED') {
        await clearPendingOrderPayment(order.id);
        return { status: 'expired', order: { ...order, status: 'CANCELLED' } };
      }
      if (code === 'PAYMENT_SIGNATURE_INVALID' || code === 'PAYMENT_AMOUNT_MISMATCH') {
        return { status: 'failed', order, reason: 'verification', code };
      }
      // PAYMENT_PENDING / network / 5xx: the webhook may still confirm; poll.
    }
  }

  const polled = await pollOrderPayment(current, deps);
  if (polled.status === 'confirmed' || polled.status === 'expired') await clearPendingOrderPayment(order.id);
  return polled;
}

/** Create the order for `input.checkout` and, for a gateway method, run the Razorpay flow. */
export async function startOrderPayment(
  input: StartOrderPaymentInput,
  overrides: Partial<OrderPaymentDeps> = {},
): Promise<OrderPaymentOutcome> {
  const deps: OrderPaymentDeps = { ...defaultDeps, ...overrides };
  // Throws ApiError/NetworkError; the key stays cached so a retry replays it.
  const order = await deps.placeOrder(input.checkout, orderIdempotencyKeys.keyFor(checkoutFingerprint(input.checkout)));
  // The order exists server-side: this attempt is done with its key.
  orderIdempotencyKeys.reset();

  if (order.status !== 'PENDING_PAYMENT') {
    return outcomeForOrder(order) ?? { status: 'pending', order };
  }
  const m = input.checkout.paymentMethod;
  const hint = m === 'UPI' || m === 'CARD' || m === 'NETBANKING' ? METHOD_HINT[m] : undefined;
  return payPendingOrder(order, { ...input, ...(hint !== undefined ? { methodHint: hint } : {}) }, deps);
}

/** One key per cancel tap on a given order. */
export const cancelOrderIdempotencyKeys = createIdempotencyKeyCache();

export type OrderPaymentRequest = StartOrderPaymentInput | ({ retry: Order } & PaySheetOptions);

function useInvalidateAfterPayment() {
  const qc = useQueryClient();
  return {
    onSuccess: (outcome: { order: Order } | Order) => {
      const order = 'order' in outcome ? outcome.order : outcome;
      qc.setQueryData(orderQueryKeys.detail(order.id), order);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: cartQueryKeys.cart });
      void qc.invalidateQueries({ queryKey: orderQueryKeys.all });
      void qc.invalidateQueries({ queryKey: walletQueryKeys.wallet });
      void qc.invalidateQueries({ queryKey: ['invoices'] });
    },
  };
}

/**
 * TanStack mutation: `{checkout}` places + pays; `{retry: order}` reopens the
 * sheet for the same gatewayOrderId. Switch on `data.status`; `error` is an
 * ApiError/NetworkError from POST /orders (show with mapProblem()).
 */
export const useOrderPayment = () => {
  const handlers = useInvalidateAfterPayment();
  return useMutation({
    mutationFn: (req: OrderPaymentRequest) =>
      'retry' in req ? payPendingOrder(req.retry, req) : startOrderPayment(req),
    retry: 0,
    ...handlers,
  });
};

/** POST /orders/{id}/cancel for a PENDING_PAYMENT order (releases stock + slot server-side, BR-222). */
export const useCancelPendingOrder = () => {
  const handlers = useInvalidateAfterPayment();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const out = await cancelPendingOrder(orderId, cancelOrderIdempotencyKeys.keyFor(`cancel:${orderId}`));
      cancelOrderIdempotencyKeys.reset();
      await clearPendingOrderPayment(orderId);
      return out;
    },
    retry: 0,
    ...handlers,
  });
};
