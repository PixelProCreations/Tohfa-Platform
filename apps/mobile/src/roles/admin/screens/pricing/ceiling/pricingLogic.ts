/**
 * Pure decisions shared by the Market & Pricing view-only screens (home,
 * fair price ceilings, price history). No React, so plain-Node vitest covers
 * it (tests/pricingCeiling_logic.test.ts).
 *
 * Access is by permission code only and fails closed: no `can` means nothing
 * is readable. There is no role input; the owner decided that every admin who
 * may read prices sees the same view-only screens (only Super Admin sets
 * prices, on screens that are still being designed).
 *
 * Money stays a Money string and is formatted through the paise helpers
 * (pricingMappers.formatPrice); no amount is ever turned into a float here.
 */
import type { FairPriceFrequency, PricingGrade } from '../../../api/pricing';
import { PRICING_GRADES } from '../../../api/pricing';
import { formatPrice } from '../../../api/pricingMappers';
import type { CeilingComparison, CeilingWindowStatus, FairPriceRowView } from '../../../api/pricingTypes';
import type { Money } from '@tohfa/shared-types';
import { t, type TranslationKey } from '../../../i18n';
import type { Can } from '../../../permissions/can';
import { formatAdminDay } from '../../../utils/datetime';

export const FAIR_PRICE_VIEW = 'pricing.fair_price.view';
export const RETAIL_PRICE_VIEW = 'pricing.retail_price.view';

export interface PricingAccess {
  canViewFair: boolean;
  canViewRetail: boolean;
}

export function pricingAccess(can: Can | undefined): PricingAccess {
  if (can === undefined) return { canViewFair: false, canViewRetail: false };
  return { canViewFair: can(FAIR_PRICE_VIEW), canViewRetail: can(RETAIL_PRICE_VIEW) };
}

/** What a ceiling row's History action hands to the history screen. */
export interface PricingCropSelection {
  cropId: string;
  cropName: string | null;
  grade: PricingGrade;
}

export function toCropSelection(row: Pick<FairPriceRowView, 'cropId' | 'cropName' | 'grade'>): PricingCropSelection {
  return { cropId: row.cropId, cropName: row.cropName, grade: row.grade };
}

// ─── Labels ──────────────────────────────────────────────────────────────────

/** The dash shown for every value the API does not send. */
export function noValue(): string {
  return t('pricingCeiling.noValue');
}

export function gradeLabel(grade: PricingGrade): string {
  return t(`pricingCeiling.grade.${grade}` as TranslationKey);
}

/** BR-08: the stored frequency; a ceiling without one shows the dash, never a guessed "Weekly". */
export function frequencyLabel(frequency: FairPriceFrequency | null): string {
  return frequency === null ? noValue() : t(`pricingCeiling.frequency.${frequency}` as TranslationKey);
}

export function windowStatusLabel(status: CeilingWindowStatus): string {
  return t(`pricingCeiling.status.${status}` as TranslationKey);
}

export type PricingTone = 'success' | 'info' | 'muted' | 'danger';

export function windowStatusTone(status: CeilingWindowStatus): PricingTone {
  if (status === 'current') return 'success';
  if (status === 'scheduled') return 'info';
  return 'muted';
}

/** "Okra · Grade 1"; a crop the server sent without a name shows the dash. */
export function cropGradeTitle(cropName: string | null, grade: PricingGrade): string {
  return t('pricingCeiling.cropGrade', { crop: cropName ?? noValue(), grade: gradeLabel(grade) });
}

/** "₹61.25/kg" through the paise formatter; null shows the dash. */
export function priceText(money: Money | null): string {
  const formatted = formatPrice(money);
  return formatted === null ? noValue() : t('pricingCeiling.perKg', { price: formatted });
}

/** "1 Nov 2026" for a YYYY-MM-DD; null or unreadable shows the dash. */
export function dayText(isoDay: string | null): string {
  if (isoDay === null) return noValue();
  const text = formatAdminDay(isoDay);
  return text === '' ? noValue() : text;
}

// ─── Retail vs ceiling (BR-09, display only) ─────────────────────────────────

export interface ComparisonBadge {
  labelKey: 'pricingCeiling.compare.within' | 'pricingCeiling.compare.over';
  tone: PricingTone;
}

/**
 * BR-09: a retail price must not exceed the ceiling. The comparison was made
 * on integer paise by the mapper; the server enforces the rule, this only
 * labels it. No ceiling known: no badge.
 */
export function ceilingComparisonBadge(comparison: CeilingComparison | null): ComparisonBadge | null {
  if (comparison === null) return null;
  return comparison.position === 'above'
    ? { labelKey: 'pricingCeiling.compare.over', tone: 'danger' }
    : { labelKey: 'pricingCeiling.compare.within', tone: 'success' };
}

/** Retail minus ceiling as "+₹5", "-₹4" or "₹0"; the dash when there is no comparison. */
export function diffText(comparison: CeilingComparison | null): string {
  if (comparison === null) return noValue();
  const amount = formatPrice(comparison.difference) ?? noValue();
  if (comparison.position === 'above') return t('pricingCeiling.compare.diffAbove', { amount });
  if (comparison.position === 'below') return t('pricingCeiling.compare.diffBelow', { amount });
  return amount;
}

// ─── Filters and search ──────────────────────────────────────────────────────

export const GRADE_ALL = 'ALL';
export type GradeFilter = PricingGrade | typeof GRADE_ALL;
export const GRADE_FILTER_OPTIONS: readonly GradeFilter[] = [GRADE_ALL, ...PRICING_GRADES];

export function gradeFilterLabel(grade: GradeFilter): string {
  return grade === GRADE_ALL ? t('pricingCeiling.filter.all') : gradeLabel(grade);
}

export type InForceDate = { kind: 'none' } | { kind: 'ok'; iso: string } | { kind: 'invalid' };

const DMY_RE = /^(\d{2})-(\d{2})-(\d{4})$/;

/** The design's "In force on" field (dd-mm-yyyy) as the API's YYYY-MM-DD. */
export function parseInForceDate(input: string): InForceDate {
  const trimmed = input.trim();
  if (trimmed === '') return { kind: 'none' };
  const m = DMY_RE.exec(trimmed);
  if (m === null) return { kind: 'invalid' };
  const iso = `${m[3] ?? ''}-${m[2] ?? ''}-${m[1] ?? ''}`;
  // Round-trip through a UTC date so 31-02 or 00-13 is refused. Calendar maths, not money.
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== iso) return { kind: 'invalid' };
  return { kind: 'ok', iso };
}

/** The applied ceiling-list filters, as the hook takes them (unset ones left out). */
export interface CeilingFilterState {
  grade: GradeFilter;
  /** As typed (dd-mm-yyyy); validated on Apply. */
  inForceOn: string;
}

export const INITIAL_CEILING_FILTERS: CeilingFilterState = { grade: GRADE_ALL, inForceOn: '' };

export function toFairListFilters(state: CeilingFilterState): { grade?: PricingGrade; effectiveOn?: string } {
  const date = parseInForceDate(state.inForceOn);
  return {
    ...(state.grade === GRADE_ALL ? {} : { grade: state.grade }),
    ...(date.kind === 'ok' ? { effectiveOn: date.iso } : {}),
  };
}

/**
 * The API takes no text search, so the search box narrows the LOADED rows by
 * crop name and grade label (as the farmers' applications tab does).
 */
export function matchesSearch(cropName: string | null, grade: PricingGrade, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (q === '') return true;
  return (cropName ?? '').toLowerCase().includes(q) || gradeLabel(grade).toLowerCase().includes(q);
}

export function filterCeilingRows<T extends { cropName: string | null; grade: PricingGrade }>(rows: readonly T[], query: string): T[] {
  return rows.filter((r) => matchesSearch(r.cropName, r.grade, query));
}
