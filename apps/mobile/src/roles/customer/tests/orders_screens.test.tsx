/**
 * My Orders + order detail/tracking against mocked API shapes (OrderSummary,
 * Order, OrderTracking, ReorderResult, InvoiceDetail).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { Linking } from 'react-native';

vi.mock('react-native', async () => (await import('./helpers/rnMock')).rnMock());
vi.mock('react-native-svg', async () => (await import('./helpers/rnMock')).svgMock());

import * as client from '../../../shell/api/client';
import { OrderHistoryScreen } from '../screens/OrderHistoryScreen';
import { OrderTrackingScreen, buildTimeline } from '../screens/OrderTrackingScreen';
import { orderStatusLabel, formatIstDate } from '../utils/orderFormat';
import { byTestId, hasTestId, mockGet, newQueryClient, press, problem, renderWith, textOf } from './helpers/harness';

const SUMMARY = (over: Record<string, unknown>) => ({
  id: 'o1', orderNumber: 'TOH-2026-0000001', status: 'CONFIRMED', fulfillmentType: 'DELIVERY', warehouseId: 'w1', itemCount: 2,
  thumbnails: [{ productName: 'Carrot', imageUrl: 'https://cdn/c.jpg' }], totalAmount: '149.90', paymentStatus: 'PAID',
  deliveryDate: '2026-11-19', placedAt: '2026-11-18T04:00:00Z', ...over,
});
const ORDER = {
  ...SUMMARY({ id: 'o9', orderNumber: 'TOH-2026-0000009', status: 'READY_FOR_PICKUP', fulfillmentType: 'PICKUP', deliveryDate: null }),
  items: [{ id: 'oi1', productId: 'p1', name: 'Carrot', grade: 'GRADE_1', qtyKg: '2.000', unitPrice: '69.00', lineTotal: '138.00' }],
  subtotal: '138.00', deliveryFee: '0.00', handlingFee: '5.00', gstAmount: '6.90', paymentMethodLabel: 'Wallet',
  pickupCode: 'PICKUP-0009', pickupQr: { payload: 'TOHFA|PICKUP|v1|TOH-2026-0000009|PICKUP-0009|sig' }, otpRequired: true, invoiceId: null,
};
const TRACKING = {
  orderId: 'o9', status: 'READY_FOR_PICKUP', otpRequired: true, estimatedArrival: null,
  events: [
    { id: 'e1', status: 'CONFIRMED', at: '2026-11-18T04:00:00Z', note: null },
    { id: 'e2', status: 'PACKED', at: '2026-11-18T05:00:00Z', note: null },
    { id: 'e3', status: 'READY_FOR_PICKUP', at: '2026-11-18T06:00:00Z', note: null },
  ],
};
const COMMON = {
  '/pickup-points': { items: [{ id: 'w1', name: 'Ooty Market', address: 'Commercial Rd', phone: null, openingHours: null, isOpenNow: true, lat: null, lng: null }] },
  '/customers/me/addresses': { items: [] },
  '/catalog/home': { categories: [], featured: [] },
  '/wishlist': { items: [] },
};

let qc: QueryClient;
beforeEach(() => {
  qc = newQueryClient();
  client.setAccessToken('token');
});
afterEach(() => {
  client.setAccessToken(null);
  vi.restoreAllMocks();
});

describe('order helpers', () => {
  it('labels unknown statuses "In progress" and formats IST dates', () => {
    expect(orderStatusLabel('SOMETHING_NEW')).toBe('In progress');
    expect(orderStatusLabel('PICKED_UP')).toBe('Collected');
    expect(formatIstDate('2026-11-18T20:00:00Z')).toBe('19/11/2026');
    expect(formatIstDate('2026-11-18')).toBe('18/11/2026');
  });

  it('maps tracking events onto the delivery steps (missing steps pending, next active)', () => {
    const steps = buildTimeline('DELIVERY', 'PACKED', [
      { status: 'CONFIRMED', at: 'a' },
      { status: 'PACKED', at: 'b' },
    ]);
    expect(steps.map((s) => `${s.status}:${s.state}`)).toEqual(['CONFIRMED:done', 'PACKED:done', 'DISPATCHED:active', 'DELIVERED:todo']);
  });

  it('pickup steps; a cancelled order appends a terminal row and nothing is active', () => {
    const steps = buildTimeline('PICKUP', 'CANCELLED', [{ status: 'CONFIRMED', at: 'a' }, { status: 'CANCELLED', at: 'b' }]);
    expect(steps.map((s) => `${s.status}:${s.state}`)).toEqual(['CONFIRMED:done', 'PACKED:todo', 'READY_FOR_PICKUP:todo', 'PICKED_UP:todo', 'CANCELLED:cancelled']);
  });
});

describe('OrderHistory', () => {
  it('groups active vs past orders from GET /orders and opens the order by uuid', async () => {
    mockGet({
      '/orders': {
        items: [SUMMARY({}), SUMMARY({ id: 'o2', orderNumber: 'TOH-2026-0000002', status: 'DELIVERED', placedAt: '2026-11-01T04:00:00Z' })],
        page: { nextCursor: null, hasMore: false },
      },
    });
    const onNavigate = vi.fn();
    const root = await renderWith(qc, <OrderHistoryScreen onNavigate={onNavigate} />);
    const t = textOf(root);
    expect(t).toContain('Recent Orders');
    expect(t).toContain('Past Orders');
    expect(t).toContain('Carrot +1 more');
    expect(t).toContain('18/11/2026');
    expect(t).not.toMatch(/Royal Gala|ORD-2026/);
    await press(root, 'order-row-o2');
    expect(onNavigate).toHaveBeenCalledWith('OrderTracking', { orderId: 'o2' });
  });

  it('shows the empty state', async () => {
    mockGet({ '/orders': { items: [], page: { nextCursor: null, hasMore: false } } });
    const root = await renderWith(qc, <OrderHistoryScreen />);
    expect(hasTestId(root, 'orders-empty')).toBe(true);
  });

  it('shows an error with retry', async () => {
    mockGet({ '/orders': problem(500, 'INTERNAL') });
    const root = await renderWith(qc, <OrderHistoryScreen />);
    expect(hasTestId(root, 'orders-error')).toBe(true);
  });
});

describe('OrderTracking', () => {
  it('renders a pickup order: timeline from events, pickup code + QR payload, gated actions', async () => {
    mockGet({ ...COMMON, '/orders/o9/tracking': TRACKING, '/orders/o9': ORDER });
    const root = await renderWith(qc, <OrderTrackingScreen orderId="o9" />);
    expect(textOf(root)).toContain('TOH-2026-0000009');
    expect(hasTestId(root, 'step-READY_FOR_PICKUP-done')).toBe(true);
    expect(hasTestId(root, 'step-PICKED_UP-active')).toBe(true);
    expect(hasTestId(root, 'action-return')).toBe(false);
    expect(hasTestId(root, 'action-review')).toBe(false);
    expect(byTestId(root, 'action-invoice').props.disabled).toBe(true);
    await press(root, 'view-qr');
    const qr = root.root.find((n) => (n.type as unknown) === 'QRCode');
    expect(qr.props.value).toBe(ORDER.pickupQr.payload);
    expect(textOf(root)).not.toMatch(/Fresh apples|312\.00|4\.8|06\/11\/2026/);
  });

  it('enables review/return after PICKED_UP and shows reorder unavailable lines', async () => {
    mockGet({
      ...COMMON,
      '/orders/o9/tracking': { ...TRACKING, status: 'PICKED_UP' },
      '/orders/o9/review': problem(404, 'NOT_FOUND'),
      '/orders/o9': { ...ORDER, status: 'PICKED_UP', invoiceId: 'inv1' },
    });
    vi.spyOn(client.api, 'post').mockResolvedValue({
      cart: { id: 'c', status: 'ACTIVE', items: [], subtotal: '0.00' },
      addedCount: 0,
      unavailable: [{ productId: 'p1', name: 'Carrot', grade: 'GRADE_1', qtyKg: '2.000', reason: 'OUT_OF_STOCK' }],
    } as never);
    const onNavigate = vi.fn();
    const root = await renderWith(qc, <OrderTrackingScreen orderId="o9" onNavigate={onNavigate} />);
    expect(hasTestId(root, 'action-return')).toBe(true);
    expect(hasTestId(root, 'action-review')).toBe(true);
    await press(root, 'action-review');
    expect(onNavigate).toHaveBeenCalledWith('ReviewFeedback', { orderId: 'o9' });
    await press(root, 'action-reorder');
    expect(hasTestId(root, 'reorder-modal')).toBe(true);
    expect(textOf(root)).toContain('Nothing could be added');
    expect(textOf(root)).toContain('Out of stock today');
  });

  it('views the invoice (GST not applicable) and opens the signed download link', async () => {
    mockGet({
      ...COMMON,
      '/orders/o9/tracking': { ...TRACKING, status: 'PICKED_UP' },
      '/orders/o9/review': problem(404, 'NOT_FOUND'),
      '/orders/o9': { ...ORDER, status: 'PICKED_UP', invoiceId: 'inv1' },
      '/invoices/inv1': {
        id: 'inv1', invoiceNumber: 'TOH/2026-27/R/000001', invoiceType: 'SALE_RETAIL', issueDate: '2026-11-18', totalAmount: '149.90', status: 'ISSUED',
        gstApplicable: false, buyerName: 'Meena', buyerGstin: null, lines: [{ description: 'Carrot', qty: '2.000', unitPrice: '69.00', total: '138.00' }],
      },
    });
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, status: 200, url: 'https://files/inv1.pdf?token=t&expires=1', json: async () => ({}) });
    vi.stubGlobal('fetch', fetchSpy);
    const root = await renderWith(qc, <OrderTrackingScreen orderId="o9" />);
    await press(root, 'action-invoice');
    expect(textOf(root)).toContain('TOH/2026-27/R/000001');
    await press(root, 'invoice-view');
    expect(textOf(root)).toContain('GST not applicable');
    await press(root, 'invoice-full-download');
    expect(Linking.openURL).toHaveBeenCalledWith('https://files/inv1.pdf?token=t&expires=1');
    vi.unstubAllGlobals();
  });

  it('shows "Order not found" for a 404', async () => {
    mockGet({ ...COMMON });
    const root = await renderWith(qc, <OrderTrackingScreen orderId="missing" />);
    expect(hasTestId(root, 'order-not-found')).toBe(true);
  });
});
