/**
 * Pure logic of the Market & Pricing screens (screens/pricing/ceiling/
 * pricingLogic.ts and home/pricingHomeLogic.ts): fail-closed access from
 * permission codes, the stored ceiling frequency (BR-08), money shown through
 * integer paise only (root CLAUDE.md 2.2), the retail-vs-ceiling display
 * (BR-09), the "In force on" date input and the client-side search.
 */
import { describe, expect, it } from 'vitest';
import { fromPaise, parseMoney, toPaise } from '@tohfa/shared-types';
import { en } from '../i18n';
import { makeCan } from '../permissions/can';
import { compareToCeiling, toFairPriceRow, toRetailPriceRow } from '../api/pricingMappers';
import { PRICING_HOME_KPIS_UNAVAILABLE } from '../api/pricingTypes';
import {
  FAIR_PRICE_VIEW,
  RETAIL_PRICE_VIEW,
  ceilingComparisonBadge,
  diffText,
  filterCeilingRows,
  frequencyLabel,
  gradeLabel,
  parseInForceDate,
  priceText,
  pricingAccess,
  toCropSelection,
  windowStatusLabel,
} from '../screens/pricing/ceiling/pricingLogic';
import { HOME_KPI_CARDS, homeSections, kpiValueText } from '../screens/pricing/home/pricingHomeLogic';
import { TODAY, fairDto, retailDto } from './pricingCeiling_renderHelpers';

describe('pricing access is permission codes, fail closed', () => {
  it('missing can denies everything', () => {
    expect(pricingAccess(undefined)).toEqual({ canViewFair: false, canViewRetail: false });
  });

  it('an empty permission list denies everything', () => {
    expect(pricingAccess(makeCan([]))).toEqual({ canViewFair: false, canViewRetail: false });
  });

  it('each read code opens only its own side', () => {
    expect(pricingAccess(makeCan([FAIR_PRICE_VIEW]))).toEqual({ canViewFair: true, canViewRetail: false });
    expect(pricingAccess(makeCan([RETAIL_PRICE_VIEW]))).toEqual({ canViewFair: false, canViewRetail: true });
    expect(FAIR_PRICE_VIEW).toBe('pricing.fair_price.view');
    expect(RETAIL_PRICE_VIEW).toBe('pricing.retail_price.view');
  });

  it('write codes alone grant no read', () => {
    expect(pricingAccess(makeCan(['pricing.fair_price.set', 'pricing.retail_price.set']))).toEqual({
      canViewFair: false,
      canViewRetail: false,
    });
  });
});

describe('BR-08: the stored ceiling frequency is shown, never a literal', () => {
  it('BR-08: DAILY reads Daily, never Weekly', () => {
    expect(frequencyLabel('DAILY')).toBe(en['pricingCeiling.frequency.DAILY']);
    expect(frequencyLabel('DAILY')).not.toMatch(/weekly/i);
  });

  it('BR-08: WEEKLY reads Weekly', () => {
    expect(frequencyLabel('WEEKLY')).toBe(en['pricingCeiling.frequency.WEEKLY']);
  });

  it('BR-08: a ceiling without a stored frequency shows the no-value dash', () => {
    expect(frequencyLabel(null)).toBe(en['pricingCeiling.noValue']);
    expect(en['pricingCeiling.noValue']).toBe('—');
  });
});

describe('labels', () => {
  it('grades and window statuses come from the catalogue', () => {
    expect(gradeLabel('GRADE_1')).toBe(en['pricingCeiling.grade.GRADE_1']);
    expect(gradeLabel('REJECT')).toBe(en['pricingCeiling.grade.REJECT']);
    expect(windowStatusLabel('current')).toBe(en['pricingCeiling.status.current']);
    expect(windowStatusLabel('scheduled')).toBe(en['pricingCeiling.status.scheduled']);
    expect(windowStatusLabel('historical')).toBe(en['pricingCeiling.status.historical']);
  });
});

describe('money is shown through integer paise (root CLAUDE.md 2.2)', () => {
  it('formats a Money string per kg and a missing one as the dash', () => {
    const row = toFairPriceRow(fairDto({ ceilingPrice: '61.25' }), TODAY);
    expect(priceText(row.ceilingPrice)).toBe('₹61.25/kg');
    expect(priceText(null)).toBe('—');
  });

  it("BR-09: '0.10' + '0.20' equals a '0.30' ceiling in paise, so the retail is within the ceiling", () => {
    // In floats 0.1 + 0.2 = 0.30000000000000004 > 0.3, which would wrongly read "over ceiling".
    expect(0.1 + 0.2 > 0.3).toBe(true);
    const sum = fromPaise(toPaise(parseMoney('0.10')) + toPaise(parseMoney('0.20')));
    const comparison = compareToCeiling(sum, parseMoney('0.30'));
    expect(comparison?.position).toBe('at');
    expect(ceilingComparisonBadge(comparison)).toEqual({ labelKey: 'pricingCeiling.compare.within', tone: 'success' });
    expect(diffText(comparison)).toBe('₹0');
  });

  it('BR-09: one paisa above the ceiling reads over ceiling with a +₹0.01 difference', () => {
    const row = toRetailPriceRow(retailDto({ price: '0.31', ceilingPrice: '0.30' }));
    expect(ceilingComparisonBadge(row.ceilingComparison)).toEqual({ labelKey: 'pricingCeiling.compare.over', tone: 'danger' });
    expect(diffText(row.ceilingComparison)).toBe('+₹0.01');
  });

  it('BR-09: below the ceiling reads within with a minus difference', () => {
    const row = toRetailPriceRow(retailDto({ price: '58.00', ceilingPrice: '61.25' }));
    expect(ceilingComparisonBadge(row.ceilingComparison)?.labelKey).toBe('pricingCeiling.compare.within');
    expect(diffText(row.ceilingComparison)).toBe('-₹3.25');
  });

  it('BR-09: no ceiling known means no badge and a dash difference', () => {
    const row = toRetailPriceRow(retailDto({ ceilingPrice: undefined }));
    expect(ceilingComparisonBadge(row.ceilingComparison)).toBeNull();
    expect(diffText(row.ceilingComparison)).toBe('—');
  });
});

describe('"In force on" date input (dd-mm-yyyy)', () => {
  it('empty means no filter', () => {
    expect(parseInForceDate('')).toEqual({ kind: 'none' });
    expect(parseInForceDate('   ')).toEqual({ kind: 'none' });
  });

  it('a real date becomes YYYY-MM-DD', () => {
    expect(parseInForceDate('05-11-2026')).toEqual({ kind: 'ok', iso: '2026-11-05' });
    expect(parseInForceDate('29-02-2028')).toEqual({ kind: 'ok', iso: '2028-02-29' });
  });

  it('garbage and impossible dates are invalid', () => {
    expect(parseInForceDate('2026-11-05')).toEqual({ kind: 'invalid' });
    expect(parseInForceDate('31-02-2026')).toEqual({ kind: 'invalid' });
    expect(parseInForceDate('5-11-2026')).toEqual({ kind: 'invalid' });
    expect(parseInForceDate('aa-bb-cccc')).toEqual({ kind: 'invalid' });
  });
});

describe('client-side search of the loaded ceilings', () => {
  const rows = [
    toFairPriceRow(fairDto({ id: 'a', cropName: 'Okra Live', grade: 'GRADE_1' }), TODAY),
    toFairPriceRow(fairDto({ id: 'b', cropName: 'Leek Live', grade: 'GRADE_2' }), TODAY),
    toFairPriceRow(fairDto({ id: 'c', cropName: undefined, grade: 'GRADE_3' }), TODAY),
  ];

  it('an empty query keeps every row', () => {
    expect(filterCeilingRows(rows, '  ').map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });

  it('matches crop name and grade label, case-insensitively', () => {
    expect(filterCeilingRows(rows, 'leek').map((r) => r.id)).toEqual(['b']);
    expect(filterCeilingRows(rows, 'grade 3').map((r) => r.id)).toEqual(['c']);
  });
});

describe('crop selection for the history screen', () => {
  it('carries the crop id, name and grade of the ceiling row only', () => {
    const row = toFairPriceRow(fairDto({ cropId: 'crop-9', cropName: 'Okra Live', grade: 'GRADE_2' }), TODAY);
    expect(toCropSelection(row)).toEqual({ cropId: 'crop-9', cropName: 'Okra Live', grade: 'GRADE_2' });
  });
});

describe('home layout logic', () => {
  it('a KPI with no counted figure is the no-value dash, never a zero', () => {
    expect(kpiValueText(null)).toBe('—');
    expect(kpiValueText(null, 'percent')).toBe('—');
    expect(HOME_KPI_CARDS.length).toBe(7);
    for (const card of HOME_KPI_CARDS) expect(['pricing.fair_price.view', 'pricing.retail_price.view']).toContain(card.code);
  });

  it('a counted KPI renders the number the list gave, percentages with their sign', () => {
    expect(kpiValueText(0)).toBe('0');
    expect(kpiValueText(12)).toBe('12');
    expect(kpiValueText(98, 'percent')).toBe('98%');
  });

  it('the cards with no API source keep the dash by construction', () => {
    // pendingPriceUpdates: no "pending" state exists in the pricing schema.
    // categoriesAndGrades: categories have no backend (owner decision D6).
    const unsourced = HOME_KPI_CARDS.filter((c) => c.id === 'pendingPriceUpdates' || c.id === 'categoriesAndGrades');
    expect(unsourced).toHaveLength(2);
    for (const card of unsourced) expect(kpiValueText(PRICING_HOME_KPIS_UNAVAILABLE[card.id], card.format)).toBe('—');
  });

  it('sections follow their read code; nothing without a code', () => {
    expect(homeSections({ canViewFair: false, canViewRetail: false })).toEqual({
      any: false,
      alerts: false,
      overview: false,
      recentlyUpdated: false,
    });
    expect(homeSections({ canViewFair: true, canViewRetail: false })).toEqual({
      any: true,
      alerts: false,
      overview: false,
      recentlyUpdated: true,
    });
    expect(homeSections({ canViewFair: false, canViewRetail: true })).toEqual({
      any: true,
      alerts: true,
      overview: true,
      recentlyUpdated: false,
    });
  });
});
