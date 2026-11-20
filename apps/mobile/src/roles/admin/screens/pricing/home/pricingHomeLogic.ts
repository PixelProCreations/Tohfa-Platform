/**
 * The Market & Pricing home's layout decisions, pure (tests/pricingCeiling_logic.test.ts).
 *
 * ONE layout for every admin who may read prices (owner decision): the team
 * design's Tohfa layout as the base, with the Farmer Admin layout's
 * "Recently Updated Prices" section and "View History" button added. Each
 * part shows only when its read code holds; the design's `role ===` switch is
 * gone.
 *
 * KPI figures: there is no KPI endpoint, so the ones that can be counted are
 * counted from GET /fair-prices and GET /retail-prices once the whole list is
 * loaded (api/pricingMappers derivePricingHomeKpis, via usePricingHomeKpis).
 * A card whose figure has no source — or whose list is still paging — renders
 * the dash. Nothing here estimates.
 */
import type { OverviewCardIcon } from '../../../components';
import { t, type TranslationKey } from '../../../i18n';
import type { PricingHomeKpisView } from '../../../api/pricingTypes';
import { FAIR_PRICE_VIEW, RETAIL_PRICE_VIEW, noValue, type PricingAccess } from '../ceiling/pricingLogic';

export type HomeTarget = 'fairPrice' | 'retail' | 'categories' | 'history';

/** How a figure reads on the card: a plain count, or a whole percentage. */
export type KpiFormat = 'count' | 'percent';

export interface HomeKpiCard {
  id: keyof PricingHomeKpisView;
  titleKey: TranslationKey;
  icon: OverviewCardIcon;
  /** The read code the card needs. */
  code: typeof FAIR_PRICE_VIEW | typeof RETAIL_PRICE_VIEW;
  target: HomeTarget;
  format: KpiFormat;
}

/**
 * Tohfa layout's six cards (including "Pending Price Updates" as in the
 * design) plus the FA layout's "Active Fair Prices" card merged in.
 */
export const HOME_KPI_CARDS: readonly HomeKpiCard[] = [
  { id: 'totalProducts', titleKey: 'pricingCeiling.home.kpi.totalProducts', icon: 'box', code: FAIR_PRICE_VIEW, target: 'fairPrice', format: 'count' },
  { id: 'withRetailPrices', titleKey: 'pricingCeiling.home.kpi.withRetailPrices', icon: 'sales', code: RETAIL_PRICE_VIEW, target: 'retail', format: 'count' },
  { id: 'pendingPriceUpdates', titleKey: 'pricingCeiling.home.kpi.pendingPriceUpdates', icon: 'cash', code: FAIR_PRICE_VIEW, target: 'fairPrice', format: 'count' },
  { id: 'ceilingCompliance', titleKey: 'pricingCeiling.home.kpi.ceilingCompliance', icon: 'orders', code: RETAIL_PRICE_VIEW, target: 'retail', format: 'percent' },
  { id: 'categoriesAndGrades', titleKey: 'pricingCeiling.home.kpi.categoriesGrades', icon: 'inventory', code: FAIR_PRICE_VIEW, target: 'categories', format: 'count' },
  { id: 'recentChanges7d', titleKey: 'pricingCeiling.home.kpi.recentChanges', icon: 'receiving', code: FAIR_PRICE_VIEW, target: 'history', format: 'count' },
  { id: 'activeFairPrices', titleKey: 'pricingCeiling.home.kpi.activeFairPrices', icon: 'receiving', code: FAIR_PRICE_VIEW, target: 'history', format: 'count' },
];

/**
 * A KPI figure as the card shows it. null — no source, or the list has not
 * been loaded in full — is the dash, never a zero and never a guess.
 */
export function kpiValueText(value: number | null, format: KpiFormat = 'count'): string {
  if (value === null) return noValue();
  return format === 'percent' ? t('pricingCeiling.home.kpi.percent', { pct: String(value) }) : String(value);
}

export function canSee(access: PricingAccess, code: HomeKpiCard['code']): boolean {
  return code === FAIR_PRICE_VIEW ? access.canViewFair : access.canViewRetail;
}

export interface HomeQuickAction {
  id: 'retail' | 'fairPrices' | 'categories' | 'history';
  labelKey: TranslationKey;
  code: HomeKpiCard['code'];
  target: HomeTarget;
}

/**
 * Both layouts have the same four tiles. The Tohfa label "Manage Retail
 * Prices" becomes FA's "Retail Pricing": the screens are view-only.
 * Categories & Grades has no code of its own; fair_price.view is the closest.
 */
export const HOME_QUICK_ACTIONS: readonly HomeQuickAction[] = [
  { id: 'retail', labelKey: 'pricingCeiling.home.quick.retail', code: RETAIL_PRICE_VIEW, target: 'retail' },
  { id: 'fairPrices', labelKey: 'pricingCeiling.home.quick.fairPrices', code: FAIR_PRICE_VIEW, target: 'fairPrice' },
  { id: 'categories', labelKey: 'pricingCeiling.home.quick.categories', code: FAIR_PRICE_VIEW, target: 'categories' },
  { id: 'history', labelKey: 'pricingCeiling.home.quick.history', code: FAIR_PRICE_VIEW, target: 'history' },
];

export interface HomeSections {
  /** false: the neutral not-available state, and no request at all. */
  any: boolean;
  /** Retail-vs-ceiling alerts (no API feed: empty state). */
  alerts: boolean;
  /** Retail rows with their ceilings (useRetailPriceList). */
  overview: boolean;
  /** FA layout's recently updated prices (no API feed: empty state) + View History. */
  recentlyUpdated: boolean;
}

export function homeSections(access: PricingAccess): HomeSections {
  return {
    any: access.canViewFair || access.canViewRetail,
    alerts: access.canViewRetail,
    overview: access.canViewRetail,
    recentlyUpdated: access.canViewFair,
  };
}

/** How many retail rows the overview card list shows; a layout size, not a business threshold. */
export const HOME_OVERVIEW_ROWS = 3;

/**
 * How many rows the Super Admin layout's "Recent Price Changes" list shows —
 * the number of cards the design draws. A layout size, not a business
 * threshold; the look-back period itself is RECENT_CHANGE_WINDOW_DAYS.
 */
export const HOME_RECENT_CHANGE_ROWS = 3;
