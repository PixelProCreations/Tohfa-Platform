/**
 * The markup & pricing breakdown, kept pure (tests/pricingRetail_logic.test.ts).
 *
 * Only what a RetailPrice carries is real: the retail price, its ceiling and
 * markupPct. The owner has not defined the markup formula (decision D5), so
 * the design's farmer purchase price, cost components, freight / loading /
 * unloading expenses, customer discount and final customer price have no
 * source and are the placeholder, never the design's numbers.
 *
 * Access, fail closed: pricing.retail_price.view for the screen (no code for
 * markup exists in rbac.json; this is the closest), pricing.fair_price.view
 * for the ceiling and the within/above validation line.
 */
import type { MarkupBreakdownView, RetailPriceRowView } from '../../../api/pricingTypes';
import { t } from '../../../i18n';
import type { Can } from '../../../permissions/can';
import { FAIR_VIEW, moneyText, noValue, RETAIL_VIEW, rowTitle } from '../retail/retailPricingLogic';

export interface MarkupAccess {
  canView: boolean;
  canViewCeiling: boolean;
}

export function markupAccess(can: Can | undefined): MarkupAccess {
  if (can === undefined) return { canView: false, canViewCeiling: false };
  const canView = can(RETAIL_VIEW);
  return { canView, canViewCeiling: canView && can(FAIR_VIEW) };
}

/** The Phase 1 breakdown view-model, built from an already loaded list row. */
export function breakdownFromRow(row: RetailPriceRowView): MarkupBreakdownView {
  return {
    cropName: row.cropName,
    grade: row.grade,
    retailPrice: row.retailPrice,
    ceilingPrice: row.ceilingPrice,
    markupPct: row.markupPct,
    ceilingComparison: row.ceilingComparison,
    purchasePrice: null,
    expenses: null,
    customerDiscount: null,
    finalCustomerPrice: null,
  };
}

export interface MarkupScreenView {
  title: string;
  purchasePrice: string;
  costComponents: string;
  markup: string;
  retail: string;
  ceiling: string;
  validation: string;
  validationAbove: boolean;
  expenses: string;
  freight: string;
  loading: string;
  unloading: string;
  customerDiscount: string;
  finalPrice: string;
}

export function markupView(row: RetailPriceRowView, access: MarkupAccess): MarkupScreenView {
  const b = breakdownFromRow(row);
  const comparison = access.canViewCeiling ? b.ceilingComparison : null;
  const above = comparison !== null && comparison.position === 'above';
  return {
    title: rowTitle(b.cropName, b.grade),
    purchasePrice: noValue(),
    costComponents: noValue(),
    markup: b.markupPct === null ? noValue() : t('pricingRetail.markup.pct', { pct: String(b.markupPct) }),
    retail: moneyText(b.retailPrice),
    ceiling: access.canViewCeiling ? moneyText(b.ceilingPrice) : noValue(),
    validation:
      comparison === null
        ? noValue()
        : t(above ? 'pricingRetail.markup.validation.above' : 'pricingRetail.markup.validation.within'),
    validationAbove: above,
    expenses: noValue(),
    freight: noValue(),
    loading: noValue(),
    unloading: noValue(),
    customerDiscount: noValue(),
    finalPrice: noValue(),
  };
}
