/**
 * BR-17 (amended 2026-11-20 by owner decision): the wallet is one of the checkout
 * methods (UPI / card / net banking go through Razorpay, see
 * checkout.payment.test.tsx; cash stays disabled, BR-223). Wallet path: totals
 * come from POST /orders/quote; POST /orders carries one Idempotency-Key per
 * attempt; 402 WALLET_INSUFFICIENT shows the shortfall and routes to the wallet
 * top-up; the order is only shown as placed when the server says CONFIRMED.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import type { QueryClient } from '@tanstack/react-query';

vi.mock('react-native', async () => (await import('./helpers/rnMock')).rnMock());
vi.mock('react-native-svg', async () => (await import('./helpers/rnMock')).svgMock());

import * as client from '../../../shell/api/client';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { checkoutDraftStore } from '../state/checkoutDraft';
import { orderIdempotencyKeys } from '../api/orders';
import { flush, hasTestId, mockGet, newQueryClient, press, problem, renderWith, textOf } from './helpers/harness';

const WH = 'w1';
const QUOTE = {
  fulfillmentType: 'PICKUP', warehouseId: WH, cartId: 'c1', cartStatus: 'LOCKED', lockExpiresAt: '2099-01-01T00:00:00Z', lockExpired: false,
  lines: [{ id: 'l1', productId: 'p1', name: 'Carrot', grade: 'GRADE_1', qtyKg: '2.000', unitPrice: '69.00', lineTotal: '138.00' }],
  itemCount: 1, subtotal: '138.00', deliveryFee: '0.00', handlingFee: '5.00', gstRateBasisPoints: 500, gstAmount: '6.90', discount: '0.00',
  totalAmount: '149.90', freeDeliveryThreshold: '500.00', walletBalance: '200.00', walletSufficient: true, shortfall: '0.00', slot: null,
};
const ORDER = {
  id: 'o-uuid', orderNumber: 'TOH-2026-0000042', status: 'CONFIRMED', fulfillmentType: 'PICKUP', warehouseId: WH, itemCount: 1,
  totalAmount: '149.90', placedAt: '2026-11-18T05:00:00Z', subtotal: '138.00', paymentMethodLabel: 'Wallet', pickupCode: 'PICKUP-0042',
  pickupQr: { payload: 'TOHFA|PICKUP|v1|TOH-2026-0000042|PICKUP-0042|sig' },
  items: [{ id: 'oi1', productId: 'p1', name: 'Carrot', grade: 'GRADE_1', qtyKg: '2.000', unitPrice: '69.00', lineTotal: '138.00' }],
};
const CART = { id: 'c1', warehouseId: WH, status: 'LOCKED', subtotal: '138.00', items: [], lockExpiresAt: null };

let qc: QueryClient;
function mockPost(handler: (path: string, body: unknown, key?: string) => unknown) {
  return vi.spyOn(client.api, 'post').mockImplementation(async (path: string, body: unknown, key?: string) => {
    const out = handler(path, body, key);
    if (out instanceof Error) throw out;
    return out as never;
  });
}

beforeEach(() => {
  qc = newQueryClient();
  client.setAccessToken('token');
  orderIdempotencyKeys.reset();
  checkoutDraftStore.reset();
  checkoutDraftStore.setDraft({ fulfillmentType: 'WAREHOUSE_PICKUP', warehouseId: WH });
  mockGet({
    '/wallets/me': { id: 'w', balance: '200.00', status: 'ACTIVE' },
    '/cart': CART,
    '/pickup-points': { items: [{ id: WH, name: 'Coonoor Market', address: 'Bedford', phone: null, openingHours: null, isOpenNow: true, lat: null, lng: null }] },
    '/customers/me/addresses': { items: [] },
  });
});
afterEach(() => {
  client.setAccessToken(null);
  vi.restoreAllMocks();
});

describe('BR-17: wallet checkout (amended: wallet is one of the methods)', () => {
  it('BR-17: shows quote totals and offers payment methods including the TOHFA wallet', async () => {
    mockPost((path) => (path === '/orders/quote' ? QUOTE : new Error('unexpected')));
    const root = await renderWith(qc, <CheckoutScreen onNavigate={vi.fn()} />);
    const t = textOf(root);
    expect(t).toContain('₹149.90');
    expect(t).toContain('Wallets');
    expect(t).toContain('UPI');
    expect(t).toContain('Credit/Debit Card');
    expect(t).toContain('Cash on Delivery or Shop');
    expect(t).toContain('Net banking');
    expect(t).toContain('Not available');
  });

  it('BR-17: a wallet order is never shown as placed unless the server returned CONFIRMED', async () => {
    mockPost((path) => (path === '/orders/quote' ? QUOTE : { ...ORDER, status: 'PENDING_PAYMENT', paymentStatus: 'PENDING', payment: null }));
    const root = await renderWith(qc, <CheckoutScreen onNavigate={vi.fn()} />);
    await press(root, 'wallet-method');
    await press(root, 'checkout-proceed');
    await press(root, 'wallet-confirm');
    expect(hasTestId(root, 'order-success')).toBe(false);
    expect(textOf(root)).not.toContain('TOH-2026-0000042');
  });

  it('BR-17: Returns to checkout after insufficient funds top-up recovery (402 shortfall, same Idempotency-Key, WALLET body)', async () => {
    let attempt = 0;
    const post = mockPost((path) => {
      if (path === '/orders/quote') return QUOTE;
      attempt += 1;
      return attempt === 1 ? problem(402, 'WALLET_INSUFFICIENT', { shortfall: '50.00', balance: '99.90', required: '149.90' }) : ORDER;
    });
    const onNavigate = vi.fn();
    const root = await renderWith(qc, <CheckoutScreen onNavigate={onNavigate} />);
    await press(root, 'wallet-method');
    await press(root, 'checkout-proceed');
    await press(root, 'wallet-confirm');
    expect(hasTestId(root, 'checkout-shortfall')).toBe(true);
    expect(textOf(root)).toContain('₹50.00');
    await press(root, 'checkout-add-money');
    expect(onNavigate).toHaveBeenCalledWith('Topup', { shortfall: '50.00' });

    // Back from top-up: the same attempt replays the same key and succeeds.
    const again = await renderWith(qc, <CheckoutScreen onNavigate={onNavigate} />);
    await press(again, 'wallet-method');
    await press(again, 'checkout-proceed');
    await press(again, 'wallet-confirm');
    expect(hasTestId(again, 'order-success')).toBe(true);
    expect(textOf(again)).toContain('TOH-2026-0000042');

    const orderCalls = post.mock.calls.filter((c) => c[0] === '/orders');
    expect(orderCalls).toHaveLength(2);
    expect(orderCalls[0]?.[2]).toBeTruthy();
    expect(orderCalls[1]?.[2]).toBe(orderCalls[0]?.[2]);
    expect(orderCalls[0]?.[1]).toEqual({ fulfillmentType: 'WAREHOUSE_PICKUP', warehouseId: WH, paymentMethod: 'WALLET' });
  });

  it('BR-17: a quote with walletSufficient=false shows the shortfall and an Add money CTA up front', async () => {
    mockPost((path) => (path === '/orders/quote' ? { ...QUOTE, walletBalance: '100.00', walletSufficient: false, shortfall: '49.90' } : new Error('x')));
    const onNavigate = vi.fn();
    const root = await renderWith(qc, <CheckoutScreen onNavigate={onNavigate} />);
    expect(textOf(root)).toContain('₹49.90');
    expect(hasTestId(root, 'checkout-proceed')).toBe(false);
    await press(root, 'checkout-topup-cta');
    expect(onNavigate).toHaveBeenCalledWith('Topup', { shortfall: '49.90' });
  });

  it('BR-17: success shows the pickup code and a QR of pickupQr.payload; View order uses the order uuid', async () => {
    mockPost((path) => (path === '/orders/quote' ? QUOTE : ORDER));
    const onNavigate = vi.fn();
    const root = await renderWith(qc, <CheckoutScreen onNavigate={onNavigate} />);
    await press(root, 'wallet-method');
    await press(root, 'checkout-proceed');
    await press(root, 'wallet-confirm');
    await press(root, 'success-check-pickup');
    expect(textOf(root)).toContain('PICKUP-0042');
    const qr = root.root.find((n) => (n.type as unknown) === 'QRCode');
    expect(qr.props.value).toBe(ORDER.pickupQr.payload);
    await press(root, 'pickup-view-order');
    expect(onNavigate).toHaveBeenCalledWith('OrderTracking', { orderId: 'o-uuid' });
  });

  it('BR-17: 409 STOCK_UNAVAILABLE sends the customer back to the cart with a notice', async () => {
    mockPost((path) => (path === '/orders/quote' ? QUOTE : problem(409, 'STOCK_UNAVAILABLE')));
    const onGoBack = vi.fn();
    const root = await renderWith(qc, <CheckoutScreen onGoBack={onGoBack} />);
    await press(root, 'wallet-method');
    await press(root, 'checkout-proceed');
    await press(root, 'wallet-confirm');
    expect(onGoBack).toHaveBeenCalled();
    expect(checkoutDraftStore.get().notice).toBeTruthy();
  });

  it('BR-17: SLOT_FULL clears the slot and returns to the slot picker', async () => {
    checkoutDraftStore.setDraft({ fulfillmentType: 'HOME_DELIVERY', warehouseId: WH, deliveryAddressId: 'a1', deliveryDate: '2026-11-18', deliverySlot: 'MORNING_8_12' });
    mockPost((path) => (path === '/orders/quote' ? { ...QUOTE, fulfillmentType: 'DELIVERY' } : problem(409, 'SLOT_FULL')));
    const onGoBack = vi.fn();
    const root = await renderWith(qc, <CheckoutScreen onGoBack={onGoBack} />);
    await press(root, 'wallet-method');
    await press(root, 'checkout-proceed');
    await press(root, 'wallet-confirm');
    await flush();
    expect(onGoBack).toHaveBeenCalled();
    expect(checkoutDraftStore.get().draft?.deliverySlot).toBeUndefined();
  });
});
