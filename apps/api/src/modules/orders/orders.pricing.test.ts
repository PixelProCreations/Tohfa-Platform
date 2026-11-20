/**
 * BR-161 (checkout totals) and BR-98 (GST half-up, per order, integer paise).
 */
import { describe, expect, it } from 'vitest';
import type { Money } from '@tohfa/shared-types';
import { readFileSync } from 'node:fs';
import { computeCheckoutTotals, toDbFulfilmentType, todayInKolkata, walletCoverage } from './orders.pricing.js';

const fee = '40.00' as Money;
const threshold = '500.00' as Money;

const totals = (lineTotals: string[], bp: number, fulfilment: 'PICKUP' | 'DELIVERY' = 'PICKUP') =>
  computeCheckoutTotals({ lineTotals, fulfilment, deliveryFee: fee, freeDeliveryThreshold: threshold, gstRateBasisPoints: bp });

describe('BR-161: checkout totals', () => {
  it('BR-98a: rate 0 means total equals subtotal exactly and GST is 0', () => {
    expect(totals(['0.10', '0.20'], 0)).toEqual({
      subtotal: '0.30',
      deliveryFee: '0.00',
      handlingFee: '0.00',
      discount: '0.00',
      gstAmount: '0.00',
      totalAmount: '0.30',
    });
  });

  it('BR-98b: GST rounds half up on paise (19.99 at 5% -> 1.00; 19.89 -> 0.99)', () => {
    expect(totals(['19.99'], 500).gstAmount).toBe('1.00');
    expect(totals(['19.90'], 500).gstAmount).toBe('1.00');
    expect(totals(['19.89'], 500).gstAmount).toBe('0.99');
    expect(totals(['19.99'], 500).totalAmount).toBe('20.99');
  });

  it('BR-98c: GST is computed once per order, not per line', () => {
    expect(totals(['10.10', '10.10'], 500).gstAmount).toBe('1.01');
  });

  it('BR-161: delivery fee applies below the free threshold only, never to pickup', () => {
    expect(totals(['200.00'], 0, 'DELIVERY')).toMatchObject({ deliveryFee: '40.00', totalAmount: '240.00' });
    expect(totals(['500.00'], 0, 'DELIVERY')).toMatchObject({ deliveryFee: '0.00', totalAmount: '500.00' });
    expect(totals(['200.00'], 0, 'PICKUP')).toMatchObject({ deliveryFee: '0.00', totalAmount: '200.00' });
  });

  it('BR-161: client aliases map onto the DB fulfilment_type enum', () => {
    expect(toDbFulfilmentType('HOME_DELIVERY')).toBe('DELIVERY');
    expect(toDbFulfilmentType('DELIVERY')).toBe('DELIVERY');
    expect(toDbFulfilmentType('WAREHOUSE_PICKUP')).toBe('PICKUP');
    expect(toDbFulfilmentType('PICKUP')).toBe('PICKUP');
  });

  it('BR-161: today is the Asia/Kolkata calendar date', () => {
    // 2026-11-16T20:00Z is already 17 Nov in India (UTC+5:30).
    expect(todayInKolkata(new Date('2026-11-16T20:00:00Z'))).toBe('2026-11-17');
  });

  it('BR-98d: no float money maths and no literal GST rate in the checkout service', () => {
    const src = readFileSync(new URL('./orders.service.ts', import.meta.url), 'utf8');
    expect(src).not.toMatch(/toFixed\(/);
    expect(src).not.toMatch(/Number\(\s*(wallet|it|deliveryConfig)/);
  });
});

describe('BR-200: handling fee and wallet coverage', () => {
  it('BR-200: the handling fee is added once per order, pickup and delivery, outside the GST base', () => {
    const base = { lineTotals: ['100.00'], deliveryFee: fee, freeDeliveryThreshold: threshold, gstRateBasisPoints: 500, handlingFee: '12.50' as Money };
    expect(computeCheckoutTotals({ ...base, fulfilment: 'PICKUP' })).toMatchObject({ handlingFee: '12.50', gstAmount: '5.00', totalAmount: '117.50' });
    expect(computeCheckoutTotals({ ...base, fulfilment: 'DELIVERY' })).toMatchObject({ deliveryFee: '40.00', totalAmount: '157.50' });
  });

  it('BR-200: wallet coverage is the checkout comparison; shortfall = total - balance, else 0', () => {
    expect(walletCoverage('200.00', '500.00' as Money)).toEqual({ sufficient: false, shortfall: '300.00' });
    expect(walletCoverage('500.00', '500.00' as Money)).toEqual({ sufficient: true, shortfall: '0.00' });
    expect(walletCoverage('0.10', '0.30' as Money)).toEqual({ sufficient: false, shortfall: '0.20' });
  });
});
