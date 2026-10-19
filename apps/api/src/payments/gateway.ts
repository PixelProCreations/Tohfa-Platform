import type { Paise } from '@tohfa/shared-types';

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
  createOrder(params: CreateOrderParams): Promise<GatewayOrderResult>;
  verifyWebhookSignature(rawBody: Buffer | string, signature: string, secret: string): boolean;
  parseEvent(rawBody: Buffer | string): WebhookEvent;
  fetchPayment?(gatewayPaymentId: string): Promise<PaymentCapturedPayload | null>;
  /** Refunds a captured payment. Optional: a gateway without it cannot refund automatically. */
  refundPayment?(params: RefundPaymentParams): Promise<RefundResult>;
}

