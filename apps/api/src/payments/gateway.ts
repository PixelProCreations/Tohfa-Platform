import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Paise } from '@tohfa/shared-types';

/**
 * BR-214: Razorpay's checkout signature, HMAC-SHA256(`order_id|payment_id`, key_secret) in hex,
 * compared in constant time. Shared by the Razorpay and mock gateways.
 */
export function verifyRazorpayPaymentSignature(
  gatewayOrderId: string,
  gatewayPaymentId: string,
  signature: string,
  keySecret: string,
): boolean {
  if (!gatewayOrderId || !gatewayPaymentId || !signature || !keySecret) return false;
  const expected = createHmac('sha256', keySecret).update(`${gatewayOrderId}|${gatewayPaymentId}`).digest('hex');
  const sigBuf = Buffer.from(signature, 'utf-8');
  const expBuf = Buffer.from(expected, 'utf-8');
  if (sigBuf.length !== expBuf.length) return false;
  return timingSafeEqual(sigBuf, expBuf);
}

export interface CreateOrderParams {
  amountPaise: Paise | number;
  currency?: 'INR';
  receipt: string;
  notes?: Record<string, string>;
}

export interface GatewayOrderResult {
  gatewayOrderId: string;
  amountPaise: number;
  currency: string;
  status: string;
}

export interface PaymentCapturedPayload {
  paymentId: string;
  orderId?: string | null;
  amountPaise: number;
  currency: string;
  method?: string | null;
  status: string;
  email?: string | null;
  contact?: string | null;
}

export interface WebhookEvent {
  event: string;
  createdAt: number;
  payment?: PaymentCapturedPayload | undefined;
  rawPayload: Record<string, unknown>;
}

export interface RefundPaymentParams {
  gatewayPaymentId: string;
  amountPaise: number;
  /**
   * Stable per payment (e.g. `sale_refund:<sale_payments.id>`). Sent to the provider as the refund
   * receipt so a provider-side lookup can find it; the caller's own state machine is what makes the
   * refund at-most-once (BR-94i), not this value.
   */
  idempotencyKey: string;
  notes?: Record<string, string>;
}

export interface RefundResult {
  refundId: string;
  status: string;
}

export interface PaymentGateway {
  readonly provider: 'mock' | 'razorpay';
  /** Creates a gateway order with automatic capture (`payment_capture: 1`). */
  createOrder(params: CreateOrderParams): Promise<GatewayOrderResult>;
  verifyWebhookSignature(rawBody: Buffer | string, signature: string, secret: string): boolean;
  /**
   * BR-214: the checkout callback signature, a timing-safe compare of
   * HMAC-SHA256(`<gatewayOrderId>|<gatewayPaymentId>`, key secret). False on any malformed input.
   * Optional like fetchPayment (sales test doubles omit it); callers fail closed without it.
   */
  verifyPaymentSignature?(gatewayOrderId: string, gatewayPaymentId: string, signature: string): boolean;
  parseEvent(rawBody: Buffer | string): WebhookEvent;
  fetchPayment?(gatewayPaymentId: string): Promise<PaymentCapturedPayload | null>;
  /** BR-215: every payment attempt made against a gateway order (cancel and expiry sweep). */
  fetchOrderPayments?(gatewayOrderId: string): Promise<PaymentCapturedPayload[]>;
  /** Refunds a captured payment. Optional: a gateway without it cannot refund automatically. */
  refundPayment?(params: RefundPaymentParams): Promise<RefundResult>;
}

