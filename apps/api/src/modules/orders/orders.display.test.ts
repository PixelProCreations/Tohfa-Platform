import { describe, expect, it } from 'vitest';
import { paymentMethodLabel, pickupCode } from './orders.display.js';

describe('BR-182: order display extras', () => {
  it('derives the human pickup code from the order sequence, pickup orders only', () => {
    expect(pickupCode('TOH-2026-000039', 'PICKUP')).toBe('PICKUP-0039');
    expect(pickupCode('TOH-2026-123456', 'PICKUP')).toBe('PICKUP-3456');
    expect(pickupCode('TOH-2026-000039', 'DELIVERY')).toBeNull();
    expect(pickupCode('NO-DIGITS', 'PICKUP')).toBeNull();
  });
  it('labels payment methods for display', () => {
    expect(paymentMethodLabel('WALLET')).toBe('Wallet');
    expect(paymentMethodLabel('UPI')).toBe('UPI');
  });
});

import { pickupQr, verifyPickupQr } from './orders.display.js';

describe('BR-194: pickup QR payload', () => {
  const secret = 'x'.repeat(32);
  it('BR-194: PICKUP orders get a signed payload with only order number and pickup code', () => {
    const qr = pickupQr('TOH-2026-000039', 'PICKUP', secret)!;
    expect(qr.payload).toContain('TOH-2026-000039');
    expect(qr.payload).toContain('PICKUP-0039');
    expect(verifyPickupQr(qr.payload, secret)).toEqual({ orderNumber: 'TOH-2026-000039', pickupCode: 'PICKUP-0039' });
  });
  it('BR-194: delivery orders have no QR', () => {
    expect(pickupQr('TOH-2026-000039', 'DELIVERY', secret)).toBeNull();
  });
  it('BR-194: a tampered payload or another secret fails verification', () => {
    const { payload } = pickupQr('TOH-2026-000039', 'PICKUP', secret)!;
    expect(verifyPickupQr(payload.replace('000039', '000040'), secret)).toBeNull();
    expect(verifyPickupQr(payload, 'y'.repeat(32))).toBeNull();
    expect(verifyPickupQr('garbage', secret)).toBeNull();
  });
});
