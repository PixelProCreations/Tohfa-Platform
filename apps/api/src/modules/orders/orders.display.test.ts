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
