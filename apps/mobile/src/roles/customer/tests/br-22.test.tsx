/**
 * BR-22: the server cart reserves stock for 24 h; the cart shows the countdown
 * from `lockExpiresAt`, and an expired lock is re-reserved with PUT /cart.
 * Also: debounced single PUT, rollback banner on 409, empty state, delivery
 * needs a slot + address, pickup point becomes the warehouse.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { act } from 'react-test-renderer';
import type { QueryClient } from '@tanstack/react-query';

vi.mock('react-native', async () => (await import('./helpers/rnMock')).rnMock());
vi.mock('react-native-svg', async () => (await import('./helpers/rnMock')).svgMock());

import * as client from '../../../shell/api/client';
import { CartScreen, lockCountdown } from '../screens/CartScreen';
import { checkoutDraftStore } from '../state/checkoutDraft';
import { flush, hasTestId, mockGet, newQueryClient, press, problem, renderWith, textOf, byTestId } from './helpers/harness';

const LINE = { id: 'l1', productId: 'p1', name: 'Carrot', grade: 'GRADE_1', qtyKg: '1.000', unitPrice: '69.00', lineTotal: '69.00', availability: 'OK', availableKg: '5.000' };
const LINE2 = { id: 'l2', productId: 'p2', name: 'Beans', grade: 'GRADE_2', qtyKg: '2.000', unitPrice: '40.00', lineTotal: '80.00', availability: 'OK', availableKg: '5.000' };
const POINTS = {
  items: [
    { id: 'w1', name: 'Ooty Market', address: 'Commercial Rd', phone: null, openingHours: null, isOpenNow: true, lat: null, lng: null, isNearest: true },
    { id: 'w2', name: 'Coonoor Market', address: 'Bedford', phone: null, openingHours: null, isOpenNow: false, lat: null, lng: null },
  ],
};
const ADDRESS = { id: 'a1', label: 'HOME', line1: '77 Sylks Rd', line2: null, city: 'Ooty', district: null, state: 'Tamil Nadu', pincode: '643001', lat: null, lng: null, landmark: null, contactPhone: '9999999999', nearestPickupPointId: 'w1', isDefault: true, createdAt: 'x', updatedAt: null };
const SLOTS = {
  warehouseId: 'w1', date: 'x',
  items: [
    { slot: 'MORNING_8_12', label: '8 AM - 12 PM', date: 'x', startsAt: 'x', endsAt: 'x', cutoff: 'x', cutoffPassed: false, capacity: 10, booked: 10, available: 0, isActive: true, bookable: false },
    { slot: 'EVENING_4_8', label: '4 PM - 8 PM', date: 'x', startsAt: 'x', endsAt: 'x', cutoff: 'x', cutoffPassed: false, capacity: 10, booked: 2, available: 8, isActive: true, bookable: true },
  ],
};

let qc: QueryClient;
function cart(over: Record<string, unknown> = {}) {
  return { id: 'c1', warehouseId: 'w1', status: 'ACTIVE', subtotal: '149.00', items: [LINE, LINE2], lockedAt: null, lockExpiresAt: null, ...over };
}
function routes(c: unknown, addresses: unknown[] = [ADDRESS]) {
  mockGet({ '/cart': c, '/customers/me/addresses': { items: addresses }, '/pickup-points': POINTS, '/delivery-slots': SLOTS });
}

beforeEach(() => {
  qc = newQueryClient();
  client.setAccessToken('token');
  checkoutDraftStore.reset();
  vi.spyOn(client.api, 'post').mockRejectedValue(problem(404, 'NOT_FOUND'));
});
afterEach(() => {
  vi.useRealTimers();
  client.setAccessToken(null);
  vi.restoreAllMocks();
});

describe('BR-22: Cart locking', () => {
  it('BR-22: formats the countdown and treats a passed deadline as expired', () => {
    const now = Date.parse('2026-09-08T10:00:00Z');
    expect(lockCountdown(new Date(now + (2 * 3600 + 30 * 60 + 15) * 1000).toISOString(), now)).toBe('02:30:15');
    expect(lockCountdown(new Date(now - 1000).toISOString(), now)).toBeNull();
    expect(lockCountdown(null, now)).toBeNull();
  });

  it('BR-22: Displays cart lock countdown from the server cart', async () => {
    routes(cart({ status: 'LOCKED', lockExpiresAt: new Date(Date.now() + 3 * 3600 * 1000).toISOString() }));
    const root = await renderWith(qc, <CartScreen />);
    expect(hasTestId(root, 'cart-lock-countdown')).toBe(true);
    expect(textOf(root)).toMatch(/Items reserved for\s+0[23]:\d\d:\d\d/);
  });

  it('BR-22: an expired reservation is re-reserved with PUT /cart (same lines)', async () => {
    routes(cart({ status: 'LOCKED', lockExpiresAt: new Date(Date.now() - 1000).toISOString() }));
    const put = vi.spyOn(client.api, 'put').mockResolvedValue(cart({ status: 'LOCKED', lockExpiresAt: new Date(Date.now() + 86400000).toISOString() }) as never);
    const root = await renderWith(qc, <CartScreen />);
    await press(root, 'cart-lock-expired');
    expect(put).toHaveBeenCalledWith('/cart', {
      warehouseId: 'w1',
      items: [
        { productId: 'p1', grade: 'GRADE_1', qtyKg: '1.000' },
        { productId: 'p2', grade: 'GRADE_2', qtyKg: '2.000' },
      ],
    });
  });
});

describe('Cart', () => {
  it('debounces stepper taps into one PUT with every line', async () => {
    routes(cart());
    const put = vi.spyOn(client.api, 'put').mockResolvedValue(cart() as never);
    const root = await renderWith(qc, <CartScreen />);
    vi.useFakeTimers();
    await act(async () => byTestId(root, 'cart-inc-p1:GRADE_1').props.onPress());
    await act(async () => byTestId(root, 'cart-inc-p1:GRADE_1').props.onPress());
    expect(put).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(450);
    });
    vi.useRealTimers();
    await flush();
    expect(put).toHaveBeenCalledTimes(1);
    expect(put.mock.calls[0]?.[1]).toEqual({
      warehouseId: 'w1',
      items: [
        { productId: 'p1', grade: 'GRADE_1', qtyKg: '2.000' },
        { productId: 'p2', grade: 'GRADE_2', qtyKg: '2.000' },
      ],
    });
  });

  it('rolls back and shows a banner when the PUT is refused with 409', async () => {
    routes(cart({ items: [{ ...LINE, availability: 'UNAVAILABLE' }, LINE2] }));
    vi.spyOn(client.api, 'put').mockRejectedValue(problem(409, 'STOCK_UNAVAILABLE'));
    const root = await renderWith(qc, <CartScreen />);
    await press(root, 'cart-remove-p1:GRADE_1');
    expect(hasTestId(root, 'cart-banner')).toBe(true);
    expect(hasTestId(root, 'cart-line-p1:GRADE_1')).toBe(true);
  });

  it('shows the empty state for an empty server cart', async () => {
    routes(cart({ items: [], subtotal: '0.00' }));
    const root = await renderWith(qc, <CartScreen />);
    expect(hasTestId(root, 'cart-empty')).toBe(true);
    expect(textOf(root)).not.toMatch(/Royal Gala|Fuji|Suresh/);
  });

  it('home delivery needs a slot; full slots are disabled; checkout hands the draft over', async () => {
    routes(cart());
    const onNavigate = vi.fn();
    const root = await renderWith(qc, <CartScreen onNavigate={onNavigate} />);
    expect(byTestId(root, 'cart-checkout').props.disabled).toBe(true);
    expect(byTestId(root, 'slot-MORNING_8_12').props.disabled).toBe(true);
    await press(root, 'slot-EVENING_4_8');
    expect(byTestId(root, 'cart-checkout').props.disabled).toBe(false);
    await press(root, 'cart-checkout');
    expect(onNavigate).toHaveBeenCalledWith('Checkout');
    expect(checkoutDraftStore.get().draft).toMatchObject({ fulfillmentType: 'HOME_DELIVERY', warehouseId: 'w1', deliveryAddressId: 'a1', deliverySlot: 'EVENING_4_8' });
  });

  it('a chosen pickup point becomes the warehouse (cart moved with PUT first)', async () => {
    routes(cart());
    const put = vi.spyOn(client.api, 'put').mockResolvedValue(cart({ warehouseId: 'w2' }) as never);
    const onNavigate = vi.fn();
    const root = await renderWith(qc, <CartScreen onNavigate={onNavigate} />);
    await press(root, 'mode-customize');
    await press(root, 'market-dropdown');
    await press(root, 'market-w2');
    await press(root, 'cart-checkout');
    expect(put.mock.calls[0]?.[1]).toMatchObject({ warehouseId: 'w2' });
    expect(checkoutDraftStore.get().draft).toEqual({ fulfillmentType: 'WAREHOUSE_PICKUP', warehouseId: 'w2' });
    expect(onNavigate).toHaveBeenCalledWith('Checkout');
  });
});
