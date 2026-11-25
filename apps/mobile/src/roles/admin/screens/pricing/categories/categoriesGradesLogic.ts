/**
 * Categories & Grades, kept pure (tests/pricingRetail_logic.test.ts).
 *
 * Grades are the pricing API's fixed enum (PRICING_GRADES) with i18n labels.
 * Categories, grade descriptions / criteria, status, applicable products and
 * pricing-record counts have no backend (owner decision D6 undecided), so the
 * screen draws an empty state or the placeholder, never the design fixtures.
 *
 * Access, fail closed: rbac.json has no categories/grades view code; the
 * grades are the second key of every fair price ceiling, so the screen uses
 * pricing.fair_price.view (UNKNOWN: owner to confirm).
 */
import { PRICING_GRADES, type PricingGrade } from '../../../api/pricing';
import type { Can } from '../../../permissions/can';
import { FAIR_VIEW, gradeLabel } from '../retail/retailPricingLogic';

export type CategoriesTab = 'categories' | 'grades';

export interface CategoriesAccess {
  canView: boolean;
}

export function categoriesAccess(can: Can | undefined): CategoriesAccess {
  return { canView: can !== undefined && can(FAIR_VIEW) };
}

export interface GradeCardView {
  grade: PricingGrade;
  /** The enum code, in place of the design's invented "GR-1" prefix. */
  code: PricingGrade;
  label: string;
}

export function gradeCards(search: string): GradeCardView[] {
  const q = search.trim().toLowerCase();
  return PRICING_GRADES.map((grade) => ({ grade, code: grade, label: gradeLabel(grade) })).filter(
    (c) => q === '' || c.label.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
  );
}
