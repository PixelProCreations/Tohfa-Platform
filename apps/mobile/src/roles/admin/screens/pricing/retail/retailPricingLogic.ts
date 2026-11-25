/**
 * Every decision of the retail pricing screen (team design on
 * origin/tofhafarmfin-rbac RetailPricingScreen.tsx), kept pure so plain-Node
 * vitest covers it (tests/pricingRetail_logic.test.ts). The components in this
 * folder only draw what these functions return.
 *
 * Access is by permission code only, fail closed (no `can` = nothing):
 *   - pricing.retail_price.view: the list and its data at all;
 *   - pricing.fair_price.view: the ceiling, the difference and the
 *     within/above badge (the server sends ceilingPrice with every retail row,
 *     but the ceiling is fair-price data);
 *   - pricing.retail_price.set: the Edit control and the edit drawer. Owner
 *     decision: only Super Admin sets the price, and rbac.json gives that code
 *     to Super Admin only. The design showed Edit to Tohfa by role; that role
 *     check is replaced by this code check, never by a role string.
 *
 * Money stays a `Money` string; the within/above display compares integer
 * paise through compareToCeiling / retailDraftCheck (root CLAUDE.md 2.2). It is
 * display only: BR-09 is enforced by the server (422 PRICE_ABOVE_CEILING).
 */
import type { Money } from '@tohfa/shared-types';
import type { PricingGrade } from '../../../api/pricing';
import type { RetailPriceListFilters } from '../../../api/pricingHooks';
import { formatPrice, retailDraftCheck } from '../../../api/pricingMappers';
import type { CeilingComparison, RetailPriceRowView } from '../../../api/pricingTypes';
import { t, type TranslationKey } from '../../../i18n';
import type { Can } from '../../../permissions/can';
import { formatAdminDay } from '../../../utils/datetime';

// ─── Access ──────────────────────────────────────────────────────────────────

export const RETAIL_VIEW = 'pricing.retail_price.view';
export const FAIR_VIEW = 'pricing.fair_price.view';
export const RETAIL_SET = 'pricing.retail_price.set';

export interface RetailPricingAccess {
  canViewRetail: boolean;
  /** pricing.fair_price.view, on top of canViewRetail. */
  canViewCeiling: boolean;
  /** pricing.retail_price.set, on top of canViewRetail. */
  canEditRetail: boolean;
}

export function retailPricingAccess(can: Can | undefined): RetailPricingAccess {
  if (can === undefined) return { canViewRetail: false, canViewCeiling: false, canEditRetail: false };
  const canViewRetail = can(RETAIL_VIEW);
  return {
    canViewRetail,
    canViewCeiling: canViewRetail && can(FAIR_VIEW),
    canEditRetail: canViewRetail && can(RETAIL_SET),
  };
}

// ─── Shared text helpers ─────────────────────────────────────────────────────

/** The placeholder for a value the API does not send. */
export function noValue(): string {
  return t('pricingRetail.noValue');
}

export function gradeLabel(grade: PricingGrade): string {
  return t(`pricingRetail.grade.${grade}` as TranslationKey);
}

export function moneyText(money: Money | null): string {
  return formatPrice(money) ?? noValue();
}

/** "₹5 below" / "₹4 above" / "At ceiling"; the placeholder when not comparable. */
export function differenceText(comparison: CeilingComparison | null): string {
  if (comparison === null) return noValue();
  if (comparison.position === 'at') return t('pricingRetail.diff.at');
  const amount = moneyText(comparison.difference);
  return t(comparison.position === 'above' ? 'pricingRetail.diff.above' : 'pricingRetail.diff.below', { amount });
}

export function rowTitle(cropName: string | null, grade: PricingGrade): string {
  return t('pricingRetail.card.title', { crop: cropName ?? noValue(), grade: gradeLabel(grade) });
}

// ─── Card ────────────────────────────────────────────────────────────────────

/** 'within' covers below and at the ceiling (BR-09 allows retail <= ceiling). */
export type CeilingBadge = 'within' | 'above';

export interface RetailCardView {
  title: string;
  badge: CeilingBadge | null;
  pricesLine: string;
  effectiveLine: string;
}

export function ceilingBadge(comparison: CeilingComparison | null): CeilingBadge | null {
  if (comparison === null) return null;
  return comparison.position === 'above' ? 'above' : 'within';
}

export function retailCardView(row: RetailPriceRowView, access: RetailPricingAccess): RetailCardView {
  const comparison = access.canViewCeiling ? row.ceilingComparison : null;
  return {
    title: rowTitle(row.cropName, row.grade),
    badge: ceilingBadge(comparison),
    pricesLine: t('pricingRetail.card.prices', {
      ceiling: access.canViewCeiling ? moneyText(row.ceilingPrice) : noValue(),
      retail: moneyText(row.retailPrice),
      diff: differenceText(comparison),
    }),
    // The design's "- Priya Nair" setter name has no API source, so only the date is shown.
    effectiveLine: t('pricingRetail.card.effective', { date: formatAdminDay(row.effectiveFrom) || noValue() }),
  };
}

// ─── Search and filter ───────────────────────────────────────────────────────

/** The loaded rows whose crop name or grade label contains `search` (GET /retail-prices takes no text query). */
export function filterRetailRows(rows: readonly RetailPriceRowView[], search: string): RetailPriceRowView[] {
  const q = search.trim().toLowerCase();
  if (q === '') return [...rows];
  return rows.filter((r) => (r.cropName ?? '').toLowerCase().includes(q) || gradeLabel(r.grade).toLowerCase().includes(q));
}

export const ALL_GRADES = 'ALL';
export type GradeChoice = PricingGrade | typeof ALL_GRADES;

/** The design's filter sheet had Category, Grade and Status; only Grade has an API parameter. */
export interface RetailFilterValues {
  grade: GradeChoice;
}

export const INITIAL_RETAIL_FILTERS: RetailFilterValues = { grade: ALL_GRADES };

export function toRetailListFilters(values: RetailFilterValues): RetailPriceListFilters {
  return values.grade === ALL_GRADES ? {} : { grade: values.grade };
}

export function gradeChoiceLabel(choice: GradeChoice): string {
  return choice === ALL_GRADES ? t('pricingRetail.filter.all') : gradeLabel(choice);
}

// ─── Edit drawer ─────────────────────────────────────────────────────────────

export type DrawerStatus = 'empty' | 'invalid' | 'noCeiling' | 'within' | 'above';

export interface DrawerView {
  proposed: string;
  difference: string;
  status: DrawerStatus;
  /** The Status line; the placeholder while nothing is typed. */
  statusText: string;
}

const STATUS_KEY: Readonly<Record<Exclude<DrawerStatus, 'empty'>, TranslationKey>> = {
  invalid: 'pricingRetail.drawer.status.invalid',
  noCeiling: 'pricingRetail.drawer.status.noCeiling',
  within: 'pricingRetail.drawer.status.within',
  above: 'pricingRetail.drawer.status.above',
};

/**
 * The drawer's live "within / above ceiling" lines for what was typed, against
 * the row's REAL ceiling (the design hard-coded 60.0 and used parseFloat).
 * `ceiling` is null when the caller may not see it or the server sent none.
 */
export function drawerView(input: string, ceiling: Money | null): DrawerView {
  const check = retailDraftCheck(input, ceiling);
  if (check.kind === 'empty') return { proposed: noValue(), difference: noValue(), status: 'empty', statusText: noValue() };
  if (check.kind === 'invalid') return { proposed: noValue(), difference: noValue(), status: 'invalid', statusText: t(STATUS_KEY.invalid) };
  if (check.kind === 'noCeiling') {
    return { proposed: moneyText(check.proposed), difference: noValue(), status: 'noCeiling', statusText: t(STATUS_KEY.noCeiling) };
  }
  const status: DrawerStatus = check.comparison.position === 'above' ? 'above' : 'within';
  return {
    proposed: moneyText(check.proposed),
    difference: differenceText(check.comparison),
    status,
    statusText: t(STATUS_KEY[status]),
  };
}
