/**
 * roles/admin/api/queryKeys.ts pricingKeys: the Market & Pricing query keys.
 * Fair prices and retail prices are separate modules so that setting a retail
 * price refetches the retail list only (the ceiling list is read-only here).
 * Every key carries the caller's warehouse like every admin key (BR-30).
 */
import { describe, expect, it } from 'vitest';
import { adminKeys, pricingKeys, PRICING_FAIR_MODULE, PRICING_RETAIL_MODULE } from '../api/queryKeys';

const CROP = '11112222-3333-4444-5555-666677778888';

function startsWith(key: readonly unknown[], prefix: readonly unknown[]): boolean {
  return prefix.every((part, i) => key[i] === part);
}

describe('pricingKeys', () => {
  it('ceiling keys sit under the fair-price module, retail keys under the retail module', () => {
    expect(startsWith(pricingKeys.fairList('wh-a', {}), adminKeys.module(PRICING_FAIR_MODULE))).toBe(true);
    expect(startsWith(pricingKeys.fairHistory('wh-a', { cropId: CROP }), adminKeys.module(PRICING_FAIR_MODULE))).toBe(true);
    expect(startsWith(pricingKeys.retailList('wh-a', {}), adminKeys.module(PRICING_RETAIL_MODULE))).toBe(true);
  });

  it('BR-09: the retail invalidation prefix does not reach the ceiling keys', () => {
    const retailPrefix = adminKeys.module(PRICING_RETAIL_MODULE);
    expect(startsWith(pricingKeys.fairList('wh-a', {}), retailPrefix)).toBe(false);
    expect(startsWith(pricingKeys.fairHistory('wh-a', { cropId: CROP }), retailPrefix)).toBe(false);
  });

  it('unset filters are null so the key shape is stable', () => {
    expect(pricingKeys.fairList(undefined, {})).toEqual([
      'admin',
      PRICING_FAIR_MODULE,
      'all',
      { resource: 'list', cropId: null, grade: null, effectiveOn: null },
    ]);
    expect(pricingKeys.fairHistory(undefined, { cropId: undefined })).toEqual([
      'admin',
      PRICING_FAIR_MODULE,
      'all',
      { resource: 'history', cropId: null, grade: null, from: null, to: null },
    ]);
    expect(pricingKeys.retailList(undefined, {})).toEqual([
      'admin',
      PRICING_RETAIL_MODULE,
      'all',
      { resource: 'list', cropId: null, grade: null },
    ]);
  });

  it('every filter changes the key', () => {
    expect(pricingKeys.fairList('wh-a', { grade: 'GRADE_1' })).not.toEqual(pricingKeys.fairList('wh-a', { grade: 'GRADE_2' }));
    expect(pricingKeys.fairList('wh-a', { effectiveOn: '2026-11-10' })).not.toEqual(pricingKeys.fairList('wh-a', {}));
    expect(pricingKeys.fairHistory('wh-a', { cropId: CROP, grade: 'GRADE_1' })).not.toEqual(
      pricingKeys.fairHistory('wh-a', { cropId: CROP }),
    );
    expect(pricingKeys.retailList('wh-a', { cropId: CROP })).not.toEqual(pricingKeys.retailList('wh-a', {}));
  });

  it('BR-30: two warehouses never share a pricing key', () => {
    expect(pricingKeys.retailList('wh-a', {})).not.toEqual(pricingKeys.retailList('wh-b', {}));
  });
});
