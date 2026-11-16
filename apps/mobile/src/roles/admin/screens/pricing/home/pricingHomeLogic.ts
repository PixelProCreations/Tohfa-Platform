/**
 * The Market & Pricing home's layout decisions, pure (tests/pricingCeiling_logic.test.ts).
 *
 * ONE layout for every admin who may read prices (owner decision): the team
 * design's Tohfa layout as the base, with the Farmer Admin layout's
 * "Recently Updated Prices" section and "View History" button added. Each
 * part shows only when its read code holds; the design's `role ===` switch is
 * gone.
 *
 * No KPI has an API source (pricingTypes PRICING_HOME_KPIS_UNAVAILABLE), so
 * every card shows the dash; counting a paged list on the phone would be wrong
 * after the first page.
 */
import type { OverviewCardIcon } from '../../../components';
import type { TranslationKey } from '../../../i18n';
import type { PricingHomeKpisView } from '../../../api/pricingTypes';
import { FAIR_PRICE_VIEW, RETAIL_PRICE_VIEW, noValue, type PricingAccess } from '../ceiling/pricingLogic';

export type HomeTarget = 'fairPrice' | 'retail' | 'categories' | 'history';

export interface HomeKpiCard {
  id: keyof PricingHomeKpisView;
  titleKey: TranslationKey;
  icon: OverviewCardIcon;
  /** The read code the card needs. */
  code: typeof FAIR_PRICE_VIEW | typeof RETAIL_PRICE_VIEW;
  target: HomeTarget;
}

/**
 * Tohfa layout's six cards (including "Pending Price Updates" as in the
 * design) plus the FA layout's "Active Fair Prices" card merged in.
 */
export const HOME_KPI_CARDS: readonly HomeKpiCard[] = [
  { id: 'totalProducts', titleKey: 'pricingCeiling.home.kpi.totalProducts', icon: 'box', code: FAIR_PRICE_VIEW, target: 'fairPrice' },
  { id: 'withRetailPrices', titleKey: 'pricingCeiling.home.kpi.withRetailPrices', icon: 'sales', code: RETAIL_PRICE_VIEW, target: 'retail' },
  { id: 'pendingPriceUpdates', titleKey: 'pricingCeiling.home.kpi.pendingPriceUpdates', icon: 'cash', code: FAIR_PRICE_VIEW, target: 'fairPrice' },
  { id: 'ceilingCompliance', titleKey: 'pricingCeiling.home.kpi.ceilingCompliance', icon: 'orders', code: RETAIL_PRICE_VIEW, target: 'retail' },
  { id: 'categoriesAndGrades', titleKey: 'pricingCeiling.home.kpi.categoriesGrades', icon: 'inventory', code: FAIR_PRICE_VIEW, target: 'categories' },
  { id: 'recentChanges7d', titleKey: 'pricingCeiling.home.kpi.recentChanges', icon: 'receiving', code: FAIR_PRICE_VIEW, target: 'history' },
  { id: 'activeFairPrices', titleKey: 'pricingCeiling.home.kpi.activeFairPrices', icon: 'receiving', code: FAIR_PRICE_VIEW, target: 'history' },
];

export function kpiValueText(): string {
  return noValue();
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
