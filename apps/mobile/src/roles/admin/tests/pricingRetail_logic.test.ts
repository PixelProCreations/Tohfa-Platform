/**
 * Retail pricing / markup / categories logic (Market & Pricing phase 2B):
 * the pure decisions behind the three ported screens. Pins the fail-closed
 * permission gates (codes only), the in-app within/above-ceiling display in
 * integer paise (BR-09 is enforced by the server; this is display only), the
 * drawer's live check against the row's REAL ceiling, and that every field
 * the API lacks renders as the '—' placeholder, never a design number.
 */
import { describe, expect, it } from 'vitest';
import type { Money } from '@tohfa/shared-types';
import type { RetailPriceRowView } from '../api/pricingTypes';
import { compareToCeiling } from '../api/pricingMappers';
import { makeCan } from '../permissions/can';
import { en } from '../i18n';
import {
  ALL_GRADES,
  drawerView,
  filterRetailRows,
  retailCardView,
  retailPricingAccess,
  toRetailListFilters,
} from '../screens/pricing/retail/retailPricingLogic';
import { markupAccess, markupView } from '../screens/pricing/markup/markupBreakdownLogic';
import { categoriesAccess, gradeCards } from '../screens/pricing/categories/categoriesGradesLogic';

const DASH = en['pricingRetail.noValue'];
const RETAIL_VIEW = 'pricing.retail_price.view';
const FAIR_VIEW = 'pricing.fair_price.view';
const RETAIL_SET = 'pricing.retail_price.set';

function row(over: Partial<RetailPriceRowView> = {}): RetailPriceRowView {
  const retailPrice = ('retailPrice' in over ? over.retailPrice : '41.50') as Money | null;
  const ceilingPrice = ('ceilingPrice' in over ? over.ceilingPrice : '44.00') as Money | null;
  return {
    id: 'rp-1',
    cropId: 'crop-1',
    cropName: 'Kohlrabi',
    grade: 'GRADE_2',
    markupPct: 12.5,
    gstInclusive: true,
    effectiveFrom: '2026-11-02',
    effectiveTo: null,
    category: null,
    reviewStatus: null,
    actionNote: null,
    ...over,
    retailPrice,
    ceilingPrice,
    ceilingComparison: over.ceilingComparison ?? compareToCeiling(retailPrice, ceilingPrice),
  };
}

describe('retail pricing access: permission codes only, fail closed', () => {
  it('a missing can denies everything', () => {
    expect(retailPricingAccess(undefined)).toEqual({ canViewRetail: false, canViewCeiling: false, canEditRetail: false });
  });

  it('view-only callers (Tohfa, Farmer Admin, Main WH, Sub WH) get no edit', () => {
    const access = retailPricingAccess(makeCan([RETAIL_VIEW, FAIR_VIEW]));
    expect(access).toEqual({ canViewRetail: true, canViewCeiling: true, canEditRetail: false });
  });

  it('edit needs pricing.retail_price.set, and only on top of the read code', () => {
    expect(retailPricingAccess(makeCan([RETAIL_VIEW, FAIR_VIEW, RETAIL_SET])).canEditRetail).toBe(true);
    expect(retailPricingAccess(makeCan([RETAIL_SET])).canEditRetail).toBe(false);
  });

  it('the ceiling is shown only with pricing.fair_price.view', () => {
    expect(retailPricingAccess(makeCan([RETAIL_VIEW])).canViewCeiling).toBe(false);
  });

  it('markup and categories are fail closed too', () => {
    expect(markupAccess(undefined)).toEqual({ canView: false, canViewCeiling: false });
    expect(markupAccess(makeCan([RETAIL_VIEW]))).toEqual({ canView: true, canViewCeiling: false });
    expect(categoriesAccess(undefined).canView).toBe(false);
    expect(categoriesAccess(makeCan([FAIR_VIEW])).canView).toBe(true);
  });
});

describe('retail card: live values, display-only ceiling check', () => {
  const full = retailPricingAccess(makeCan([RETAIL_VIEW, FAIR_VIEW]));

  it('draws crop, grade label, ceiling, retail and the paise difference', () => {
    const card = retailCardView(row(), full);
    expect(card.title).toBe(`Kohlrabi · ${en['pricingRetail.grade.GRADE_2']}`);
    expect(card.badge).toBe('within');
    expect(card.pricesLine).toContain('₹44');
    expect(card.pricesLine).toContain('₹41.50');
    expect(card.pricesLine).toContain('₹2.50');
  });

  it('BR-09: a retail price above its ceiling is flagged above (display only)', () => {
    const card = retailCardView(row({ retailPrice: '46.00' as Money }), full);
    expect(card.badge).toBe('above');
  });

  it('without fair_price.view the ceiling, difference and badge are not shown', () => {
    const card = retailCardView(row(), retailPricingAccess(makeCan([RETAIL_VIEW])));
    expect(card.badge).toBeNull();
    expect(card.pricesLine).not.toContain('₹44');
    expect(card.pricesLine).toContain(DASH);
  });

  it('an unknown crop name or price is the placeholder, never a sample value', () => {
    const card = retailCardView(row({ cropName: null, retailPrice: null }), full);
    expect(card.title.startsWith(DASH)).toBe(true);
    expect(card.badge).toBeNull();
  });

  it('the effective line carries the real date', () => {
    expect(retailCardView(row(), full).effectiveLine).toContain('2026');
  });
});

describe('retail edit drawer: live check against the REAL ceiling (BR-09)', () => {
  it('BR-09: a typed price above the row ceiling is flagged above', () => {
    const view = drawerView('45', '44.00' as Money);
    expect(view.status).toBe('above');
    expect(view.difference).toContain('₹1');
  });

  it('BR-09: "0.10" against a ceiling of "0.30" is compared in paise (within, 20 paise below)', () => {
    const view = drawerView('0.10', '0.30' as Money);
    expect(view.status).toBe('within');
    expect(view.difference).toContain('₹0.20');
    expect(drawerView('0.31', '0.30' as Money).status).toBe('above');
    expect(drawerView('0.30', '0.30' as Money).status).toBe('within');
  });

  it('uses the row ceiling, not the design constant of 60', () => {
    expect(drawerView('58', '50.00' as Money).status).toBe('above');
    expect(drawerView('58', '90.00' as Money).status).toBe('within');
  });

  it('empty, invalid and no-ceiling input show no comparison', () => {
    expect(drawerView('', '44.00' as Money).status).toBe('empty');
    expect(drawerView('12.345', '44.00' as Money).status).toBe('invalid');
    expect(drawerView('abc', '44.00' as Money).status).toBe('invalid');
    const noCeiling = drawerView('40', null);
    expect(noCeiling.status).toBe('noCeiling');
    expect(noCeiling.difference).toBe(DASH);
  });
});

describe('retail list: search and the grade filter', () => {
  it('search matches crop name and grade label on the loaded rows', () => {
    const rows = [row(), row({ id: 'rp-2', cropName: 'Turnip', grade: 'GRADE_1' })];
    expect(filterRetailRows(rows, 'turn').map((r) => r.id)).toEqual(['rp-2']);
    expect(filterRetailRows(rows, en['pricingRetail.grade.GRADE_2'].toLowerCase()).map((r) => r.id)).toEqual(['rp-1']);
    expect(filterRetailRows(rows, '  ')).toHaveLength(2);
  });

  it('the grade filter is sent to the server; All sends nothing', () => {
    expect(toRetailListFilters({ grade: ALL_GRADES })).toEqual({});
    expect(toRetailListFilters({ grade: 'GRADE_3' })).toEqual({ grade: 'GRADE_3' });
  });
});

describe('markup breakdown: only retail, ceiling and markupPct are real', () => {
  const access = markupAccess(makeCan([RETAIL_VIEW, FAIR_VIEW]));

  it('shows the three real values and the paise validation', () => {
    const view = markupView(row(), access);
    expect(view.retail).toBe('₹41.50');
    expect(view.ceiling).toBe('₹44');
    expect(view.markup).toContain('12.5');
    expect(view.validation).toBe(en['pricingRetail.markup.validation.within']);
    expect(markupView(row({ retailPrice: '50.00' as Money }), access).validationAbove).toBe(true);
  });

  it('purchase price, cost components, expenses, discount and final price are the placeholder', () => {
    const view = markupView(row(), access);
    for (const value of [view.purchasePrice, view.costComponents, view.freight, view.loading, view.unloading, view.customerDiscount, view.finalPrice, view.expenses]) {
      expect(value).toBe(DASH);
    }
  });

  it('without fair_price.view the ceiling and the validation are the placeholder', () => {
    const view = markupView(row(), markupAccess(makeCan([RETAIL_VIEW])));
    expect(view.ceiling).toBe(DASH);
    expect(view.validation).toBe(DASH);
  });

  it('a missing markupPct is the placeholder', () => {
    expect(markupView(row({ markupPct: null }), access).markup).toBe(DASH);
  });
});

describe('categories & grades: the fixed grade enum', () => {
  it('lists GRADE_1, GRADE_2, GRADE_3 and REJECT with i18n labels', () => {
    const cards = gradeCards('');
    expect(cards.map((c) => c.grade)).toEqual(['GRADE_1', 'GRADE_2', 'GRADE_3', 'REJECT']);
    expect(cards[3]!.label).toBe(en['pricingRetail.grade.REJECT']);
  });

  it('search filters by label or code', () => {
    expect(gradeCards('reject').map((c) => c.grade)).toEqual(['REJECT']);
    expect(gradeCards('grade_3').map((c) => c.grade)).toEqual(['GRADE_3']);
  });
});
