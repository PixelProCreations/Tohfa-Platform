/**
 * Per-order gateway payment (BR-17 as amended, BR-213, BR-214, BR-215, BR-216, BR-217).
 *
 * Unit: startOrderPayment / payPendingOrder with injected deps (like the
 * wallet top-up tests): WALLET confirms without the sheet; UPI/CARD/NETBANKING
 * open Razorpay with the server's key/order/amount, verify, then poll; only a
 * server status of CONFIRMED is `confirmed`.
 *
 * Screen: CheckoutScreen against a mocked API + the mocked react-native-razorpay
 * SDK: success modal only for CONFIRMED, retry reuses the gatewayOrderId, cancel
 * calls the cancel API, COD is visible but disabled, no in-app card fields, and
 * no fabricated order when the API fails.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import type { QueryClient } from '@tanstack/react-query';
import RazorpayCheckout from 'react-native-razorpay';
import type { Money } from '@tohfa/shared-types';

vi.mock('react-native', async () => (await import('./helpers/rnMock')).rnMock());
vi.mock('react-native-svg', async () => (await import('./helpers/rnMock')).svgMock());

import * as client from '../../../shell/api/client';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { checkoutDraftStore } from '../state/checkoutDraft';
import { checkoutFingerprint, orderIdempotencyKeys, type CheckoutInput, type Order } from '../api/orders';
import { payPendingOrder, startOrderPayment, type OrderPaymentDeps } from '../api/orderPayment';
import { pendingOrderPaymentStore } from '../state/pendingOrderPayment';
import { byTestId, flush, hasTestId, mockGet, newQueryClient, press, problem, renderWith, textOf } from './helpers/harness';

const WH = 'w1';
const PAYMENT = {
  gateway: 'RAZORPAY' as const,
  gatewayOrderId: 'order_rzp_1',
  razorpayKeyId: 'rzp_test_key',
  amount: '149.90' as Money,
  currency: 'INR' as const,
  expiresAt: '2099-01-01T00:15:00Z',
};
const BASE_ORDER = {
  id: 'o-uuid',
  orderNumber: 'TOH-2026-0000042',
  fulfillmentType: 'PICKUP',
  warehouseId: WH,
  itemCount: 1,
  totalAmount: '149.90',
  placedAt: '2026-11-20T05:00:00Z',
  subtotal: '138.00',
  pickupCode: 'PICKUP-0042',
  pickupQr: { payload: 'TOHFA|PICKUP|v1|TOH-2026-0000042|PICKUP-0042|sig' },
  items: [{ id: 'oi1', productId: 'p1', name: 'Carrot', grade: 'GRADE_1', qtyKg: '2.000', unitPrice: '69.00', lineTotal: '138.00' }],
};
const PENDING = { ...BASE_ORDER, status: 'PENDING_PAYMENT', paymentStatus: 'PENDING', paymentMethod: 'UPI', payment: PAYMENT } as unknown as Order;
const CONFIRMED = { ...BASE_ORDER, status: 'CONFIRMED', paymentStatus: 'PAID', paymentMethod: 'UPI', payment: null } as unknown as Order;
const CANCELLED = { ...BASE_ORDER, status: 'CANCELLED', paymentStatus: 'FAILED', paymentMethod: 'UPI', payment: null } as unknown as Order;
const WALLET_CONFIRMED = { ...CONFIRMED, paymentMethod: 'WALLET' } as unknown as Order;

const CHECKOUT: CheckoutInput = { fulfillmentType: 'WAREHOUSE_PICKUP', warehouseId: WH, paymentMethod: 'UPI' };

describe('startOrderPayment (BR-213 / BR-214 / BR-217)', () => {
  let clock = 0;
  const deps = (over: Partial<OrderPaymentDeps> = {}): Partial<OrderPaymentDeps> => ({
    placeOrder: vi.fn().mockResolvedValue(PENDING),
    verifyOrderPayment: vi.fn().mockResolvedValue(CONFIRMED),
    fetchOrder: vi.fn().mockResolvedValue(CONFIRMED),
    openCheckout: vi.fn().mockResolvedValue({ status: 'success', paymentId: 'pay_1', orderId: 'order_rzp_1', signature: 'sig_1' }),
    sleep: vi.fn(async (ms: number) => {
      clock += ms;
    }),
    now: () => clock,
    pollIntervalMs: 2000,
    pollTimeoutMs: 10000,
    ...over,
  });

  beforeEach(() => {
    clock = 0;
    orderIdempotencyKeys.reset();
    pendingOrderPaymentStore.resetMemory();
  });

  it('BR-17: WALLET returns the CONFIRMED order without opening Razorpay', async () => {
    const d = deps({ placeOrder: vi.fn().mockResolvedValue(WALLET_CONFIRMED) });
    const out = await startOrderPayment({ checkout: { ...CHECKOUT, paymentMethod: 'WALLET' } }, d);
    expect(out.status).toBe('confirmed');
    expect(d.openCheckout).not.toHaveBeenCalled();
  });

  it('BR-213: UPI opens Razorpay with the server key/order, integer paise of the server amount and the upi hint, then verifies', async () => {
    const d = deps();
    const out = await startOrderPayment({ checkout: CHECKOUT }, d);
    expect(out).toMatchObject({ status: 'confirmed', order: { status: 'CONFIRMED' } });
    expect(d.openCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ keyId: 'rzp_test_key', orderId: 'order_rzp_1', amountPaise: 14990, currency: 'INR', method: 'upi' }),
    );
    expect(d.verifyOrderPayment).toHaveBeenCalledWith('o-uuid', {
      razorpayOrderId: 'order_rzp_1',
      razorpayPaymentId: 'pay_1',
      razorpaySignature: 'sig_1',
    });
    expect(pendingOrderPaymentStore.get().pending).toBeNull();
  });

  it('BR-213: the Idempotency-Key is replayed on a network retry and the method is part of the fingerprint', async () => {
    const place = vi.fn().mockRejectedValueOnce(new client.NetworkError(new Error('x'))).mockResolvedValue(PENDING);
    const d = deps({ placeOrder: place });
    await expect(startOrderPayment({ checkout: CHECKOUT }, d)).rejects.toBeInstanceOf(client.NetworkError);
    await startOrderPayment({ checkout: CHECKOUT }, d);
    expect(place.mock.calls[1]?.[1]).toBe(place.mock.calls[0]?.[1]);
    expect(checkoutFingerprint(CHECKOUT)).not.toBe(checkoutFingerprint({ ...CHECKOUT, paymentMethod: 'WALLET' }));
    expect(checkoutFingerprint({ ...CHECKOUT, paymentMethod: 'CARD' })).toContain('paymentMethod=CARD');
  });

  it('BR-214: 202 PAYMENT_PENDING from verify falls back to polling GET /orders/{id} until CONFIRMED', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(PENDING).mockResolvedValueOnce(CONFIRMED);
    const d = deps({ verifyOrderPayment: vi.fn().mockResolvedValue({ code: 'PAYMENT_PENDING' }), fetchOrder: fetch });
    const out = await startOrderPayment({ checkout: CHECKOUT }, d);
    expect(out.status).toBe('confirmed');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('BR-217: a payment the server never confirms within the window is `pending`, not confirmed', async () => {
    const d = deps({ verifyOrderPayment: vi.fn().mockRejectedValue(problem(503, 'PAYMENT_GATEWAY_UNAVAILABLE')), fetchOrder: vi.fn().mockResolvedValue(PENDING) });
    const out = await startOrderPayment({ checkout: CHECKOUT }, d);
    expect(out.status).toBe('pending');
    // Still persisted so a relaunch keeps polling.
    expect(pendingOrderPaymentStore.get().pending?.orderId).toBe('o-uuid');
  });

  it('BR-215: SDK cancel keeps the order PENDING_PAYMENT (no verify); retry reopens the same gatewayOrderId', async () => {
    const open = vi.fn().mockResolvedValueOnce({ status: 'cancelled', code: 0, description: 'cancelled' });
    const d = deps({ openCheckout: open });
    const out = await startOrderPayment({ checkout: CHECKOUT }, d);
    expect(out.status).toBe('cancelled');
    expect(d.verifyOrderPayment).not.toHaveBeenCalled();
    open.mockResolvedValueOnce({ status: 'success', paymentId: 'pay_2', orderId: 'order_rzp_1', signature: 'sig_2' });
    const retried = await payPendingOrder(out.order, {}, d);
    expect(retried.status).toBe('confirmed');
    expect(open.mock.calls[1]?.[0]).toMatchObject({ orderId: 'order_rzp_1' });
    expect(d.placeOrder).toHaveBeenCalledTimes(1);
  });

  it('BR-215: verify 409 ORDER_PAYMENT_EXPIRED and a CANCELLED poll are `expired`', async () => {
    const d1 = deps({ verifyOrderPayment: vi.fn().mockRejectedValue(problem(409, 'ORDER_PAYMENT_EXPIRED')) });
    expect((await startOrderPayment({ checkout: CHECKOUT }, d1)).status).toBe('expired');
    const d2 = deps({ verifyOrderPayment: vi.fn().mockResolvedValue({ code: 'PAYMENT_PENDING' }), fetchOrder: vi.fn().mockResolvedValue(CANCELLED) });
    expect((await startOrderPayment({ checkout: CHECKOUT }, d2)).status).toBe('expired');
  });

  it('BR-214: a rejected signature / amount is `failed` (verification); a gateway failure is `failed` (gateway)', async () => {
    const bad = deps({ verifyOrderPayment: vi.fn().mockRejectedValue(problem(422, 'PAYMENT_SIGNATURE_INVALID')) });
    expect(await startOrderPayment({ checkout: CHECKOUT }, bad)).toMatchObject({ status: 'failed', reason: 'verification' });
    const gw = deps({ openCheckout: vi.fn().mockResolvedValue({ status: 'failed', code: 2, description: 'declined' }) });
    expect(await startOrderPayment({ checkout: CHECKOUT }, gw)).toMatchObject({ status: 'failed', reason: 'gateway' });
    const noKey = deps({ placeOrder: vi.fn().mockResolvedValue({ ...PENDING, payment: null }) });
    expect(await startOrderPayment({ checkout: CHECKOUT }, noKey)).toMatchObject({ status: 'failed', reason: 'unavailable' });
  });
});

// ── Screen ──────────────────────────────────────────────────────────────────

const QUOTE = {
  fulfillmentType: 'PICKUP', warehouseId: WH, cartId: 'c1', cartStatus: 'LOCKED', lockExpiresAt: '2099-01-01T00:00:00Z', lockExpired: false,
  lines: [{ id: 'l1', productId: 'p1', name: 'Carrot', grade: 'GRADE_1', qtyKg: '2.000', unitPrice: '69.00', lineTotal: '138.00' }],
  itemCount: 1, subtotal: '138.00', deliveryFee: '0.00', handlingFee: '5.00', gstRateBasisPoints: 500, gstAmount: '6.90', discount: '0.00',
  totalAmount: '149.90', freeDeliveryThreshold: '500.00', walletBalance: '200.00', walletSufficient: true, shortfall: '0.00', slot: null,
};
const CART = { id: 'c1', warehouseId: WH, status: 'LOCKED', subtotal: '138.00', items: [], lockExpiresAt: null };

const sdkOpen = vi.mocked(RazorpayCheckout.open);
let qc: QueryClient;

function mockPost(handler: (path: string, body: unknown, key?: string) => unknown) {
  return vi.spyOn(client.api, 'post').mockImplementation(async (path: string, body: unknown, key?: string) => {
    const out = handler(path, body, key);
    if (out instanceof Error) throw out;
    return out as never;
  });
}

function routesWith(orderGet: unknown) {
  mockGet({
    '/wallets/me': { id: 'w', balance: '200.00', status: 'ACTIVE' },
    '/cart': CART,
    '/pickup-points': { items: [{ id: WH, name: 'Coonoor Market', address: 'Bedford', phone: null, openingHours: null, isOpenNow: true, lat: null, lng: null }] },
    '/customers/me/addresses': { items: [] },
    '/orders/o-uuid': orderGet,
  });
}

describe('CheckoutScreen gateway payment (BR-213..BR-217)', () => {
  beforeEach(() => {
    qc = newQueryClient();
    client.setAccessToken('token');
    orderIdempotencyKeys.reset();
    pendingOrderPaymentStore.resetMemory();
    checkoutDraftStore.reset();
    checkoutDraftStore.setDraft({ fulfillmentType: 'WAREHOUSE_PICKUP', warehouseId: WH });
    sdkOpen.mockReset();
    routesWith(CONFIRMED);
  });
  afterEach(() => {
    client.setAccessToken(null);
    vi.restoreAllMocks();
  });

  it('BR-213: UPI places a PENDING_PAYMENT order, opens Razorpay, verifies, and shows success only for the CONFIRMED order', async () => {
    sdkOpen.mockResolvedValueOnce({ razorpay_payment_id: 'pay_1', razorpay_order_id: 'order_rzp_1', razorpay_signature: 'sig_1' });
    const post = mockPost((path) => {
      if (path === '/orders/quote') return QUOTE;
      if (path === '/orders') return PENDING;
      if (path === '/orders/o-uuid/payment/verify') return CONFIRMED;
      return new Error(`unexpected ${path}`);
    });
    const root = await renderWith(qc, <CheckoutScreen onNavigate={vi.fn()} />);
    await press(root, 'upi-method');
    await press(root, 'checkout-proceed');
    expect(sdkOpen).toHaveBeenCalledWith(expect.objectContaining({ key: 'rzp_test_key', order_id: 'order_rzp_1', amount: 14990, method: 'upi' }));
    const orderCall = post.mock.calls.find((c) => c[0] === '/orders');
    expect(orderCall?.[1]).toEqual({ fulfillmentType: 'WAREHOUSE_PICKUP', warehouseId: WH, paymentMethod: 'UPI' });
    expect(orderCall?.[2]).toBeTruthy();
    expect(post.mock.calls.find((c) => c[0] === '/orders/o-uuid/payment/verify')?.[1]).toEqual({
      razorpayOrderId: 'order_rzp_1',
      razorpayPaymentId: 'pay_1',
      razorpaySignature: 'sig_1',
    });
    expect(hasTestId(root, 'order-success')).toBe(true);
    expect(textOf(root)).toContain('TOH-2026-0000042');
  });

  it('BR-215: closing the sheet shows Retry payment (same gatewayOrderId) and Cancel order (cancel API); never success', async () => {
    sdkOpen.mockRejectedValue({ code: 0, description: 'Payment Cancelled' });
    const post = mockPost((path) => {
      if (path === '/orders/quote') return QUOTE;
      if (path === '/orders') return { ...PENDING, paymentMethod: 'NETBANKING' };
      if (path === '/orders/o-uuid/cancel') return CANCELLED;
      return new Error(`unexpected ${path}`);
    });
    const root = await renderWith(qc, <CheckoutScreen onNavigate={vi.fn()} />);
    await press(root, 'netbanking-method');
    await press(root, 'checkout-proceed');
    expect(hasTestId(root, 'order-success')).toBe(false);
    expect(hasTestId(root, 'checkout-payment-retryable')).toBe(true);

    await press(root, 'checkout-retry-payment');
    expect(sdkOpen).toHaveBeenCalledTimes(2);
    expect(sdkOpen.mock.calls[1]?.[0]).toMatchObject({ order_id: 'order_rzp_1', method: 'netbanking' });
    expect(post.mock.calls.filter((c) => c[0] === '/orders')).toHaveLength(1);

    await press(root, 'checkout-cancel-order');
    const cancel = post.mock.calls.find((c) => c[0] === '/orders/o-uuid/cancel');
    expect(cancel?.[2]).toBeTruthy();
    expect(hasTestId(root, 'checkout-payment-closed')).toBe(true);
    expect(hasTestId(root, 'order-success')).toBe(false);
  });

  it('BR-217: verify 202 PAYMENT_PENDING then a CANCELLED order (window passed) shows the expired notice, not success', async () => {
    sdkOpen.mockResolvedValueOnce({ razorpay_payment_id: 'pay_1', razorpay_order_id: 'order_rzp_1', razorpay_signature: 'sig_1' });
    routesWith(CANCELLED);
    mockPost((path) => {
      if (path === '/orders/quote') return QUOTE;
      if (path === '/orders') return PENDING;
      if (path === '/orders/o-uuid/payment/verify') return { code: 'PAYMENT_PENDING' };
      return new Error(`unexpected ${path}`);
    });
    const root = await renderWith(qc, <CheckoutScreen onNavigate={vi.fn()} />);
    await press(root, 'card-method');
    await press(root, 'checkout-proceed');
    await flush();
    expect(hasTestId(root, 'order-success')).toBe(false);
    expect(hasTestId(root, 'checkout-payment-closed')).toBe(true);
  });

  it('BR-217: a failed POST /orders never fabricates an order (no success modal, retry offered)', async () => {
    mockPost((path) => (path === '/orders/quote' ? QUOTE : new client.NetworkError(new Error('offline'))));
    const root = await renderWith(qc, <CheckoutScreen onNavigate={vi.fn()} />);
    await press(root, 'upi-method');
    await press(root, 'checkout-proceed');
    expect(sdkOpen).not.toHaveBeenCalled();
    expect(hasTestId(root, 'order-success')).toBe(false);
    expect(textOf(root)).not.toMatch(/ORD-\d{8}-\d{4}/);
    expect(hasTestId(root, 'checkout-retry')).toBe(true);
  });

  it('BR-216: cash on delivery/shop is visible but disabled; a PAYMENT_METHOD_DISABLED reply is not treated as "no home delivery"', async () => {
    mockPost((path) => (path === '/orders/quote' ? QUOTE : problem(422, 'PAYMENT_METHOD_DISABLED')));
    const onGoBack = vi.fn();
    const root = await renderWith(qc, <CheckoutScreen onGoBack={onGoBack} />);
    const cod = byTestId(root, 'cod-method');
    expect(cod.props.disabled).toBe(true);
    expect(textOf(root)).toContain('Cash on Delivery or Shop');
    expect(textOf(root)).toContain('Not available');
    await press(root, 'upi-method');
    await press(root, 'checkout-proceed');
    expect(onGoBack).not.toHaveBeenCalled();
    expect(checkoutDraftStore.get().homeDeliveryDisabled).not.toBe(true);
    expect(textOf(root)).toContain('Cash on delivery or at the shop is not available yet');
  });

  it('PCI: the card option has no in-app card number / expiry / CVV fields (Razorpay collects them)', async () => {
    mockPost((path) => (path === '/orders/quote' ? QUOTE : new Error('x')));
    const root = await renderWith(qc, <CheckoutScreen onNavigate={vi.fn()} />);
    await press(root, 'card-method');
    expect(hasTestId(root, 'card-hint')).toBe(true);
    const inputs = root.root.findAll((n) => (n.type as unknown) === 'TextInput');
    const placeholders = inputs.map((n) => String(n.props.placeholder ?? ''));
    expect(placeholders.some((p) => /card|MM\/YY|CVV/i.test(p))).toBe(false);
  });
});
