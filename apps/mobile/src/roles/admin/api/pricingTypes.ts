/**
 * View-models for the Market & Pricing screens (team design on
 * origin/tofhafarmfin-rbac: MarketPricingHomeScreen, FairPriceCeilingScreen,
 * RetailPricingScreen, PriceHistoryScreen, CategoriesGradesScreen,
 * MarkupPricingBreakdownScreen), built by ./pricingMappers.ts from the DTOs in
 * ./pricing.ts.
 *
 * A field typed `null` (the literal type) is shown by the design but has NO
 * API source today. It stays null: a screen must render it as "not available"
 * or hide it, never fill it with a demo value. Values are raw (ISO dates, enum
 * codes, Money strings); labels, units ("/kg") and date formatting belong to
 * the screen and the i18n catalogue.
 *
 * Money is the shared-types `Money` string; a field that could not be read as
 * Money is null rather than a guessed number (root CLAUDE.md 2.2).
 */
import type { Money } from '@tohfa/shared-types';
import type { FairPriceFrequency, PricingGrade } from './pricing';

/**
 * Where a ceiling window sits relative to today: started and not closed
 * (current), not started yet (scheduled), closed (historical). Derived only
 * from effectiveFrom / effectiveTo; the design's 'No ceiling' state has no API
 * source (there is no row for a crop without a ceiling).
 */
export type CeilingWindowStatus = 'current' | 'scheduled' | 'historical';

/**
 * A price compared with its ceiling, in integer paise. `difference` is the
 * absolute gap as Money; `position` says which side of the ceiling it is on.
 * Display only: BR-09 is enforced by the server.
 */
export interface CeilingComparison {
  position: 'below' | 'at' | 'above';
  differencePaise: number;
  difference: Money;
}

/** One card of the fair price ceiling list, and its details sheet. */
export interface FairPriceRowView {
  id: string;
  cropId: string;
  /** The crop name the server sent; null if absent. */
  cropName: string | null;
  grade: PricingGrade;
  ceilingPrice: Money | null;
  /** BR-08: the stored frequency; the design's literal "Weekly" must not be used. */
  frequency: FairPriceFrequency | null;
  effectiveFrom: string;
  /** null = open-ended ("No end date"). */
  effectiveTo: string | null;
  windowStatus: CeilingWindowStatus;
  /** The setter's user id; the design shows a name, which the API does not send. */
  setById: string | null;
  /** Free-text notes; the closest the API has to the design's "reason". */
  notes: string | null;
  /** Not in the API: no category on a ceiling. */
  category: null;
  /** Not in the API: setBy is a uuid only. */
  setByName: null;
  /** Not in the API: no updated/created timestamp on a ceiling. */
  lastUpdatedAt: null;
  /** Not on the row: fetch the per-crop history (useFairPriceHistory) instead. */
  recentChanges: null;
  /** Not in the API: whether the crop+grade has a retail price is not on a ceiling. */
  hasRetailPrice: null;
}

/** One price-change record of the price history (ceiling windows only). */
export interface CeilingHistoryRowView {
  id: string;
  cropId: string;
  cropName: string | null;
  grade: PricingGrade;
  /** The only price type the history endpoint returns. */
  priceType: 'FAIR_PRICE_CEILING';
  newCeiling: Money | null;
  /**
   * The ceiling of the next older window for the same crop and grade among the
   * LOADED rows; null for the oldest loaded one (an older one may be on a later
   * page) and never guessed.
   */
  previousCeiling: Money | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  windowStatus: CeilingWindowStatus;
  setById: string | null;
  notes: string | null;
  /** Not in the API: setBy is a uuid only. */
  changedByName: null;
  /** Not in the API: no recorded-at timestamp. */
  recordedAt: null;
  /** Not in the API: no Valid/Failed/Applied validation result. */
  validation: null;
  /** Not in the API: no audit-log reference in the response. */
  auditRef: null;
}

/** One card of the retail price list. */
export interface RetailPriceRowView {
  id: string;
  cropId: string;
  cropName: string | null;
  grade: PricingGrade;
  retailPrice: Money | null;
  ceilingPrice: Money | null;
  /** A percentage, not money. */
  markupPct: number | null;
  gstInclusive: boolean | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  /** Retail vs ceiling in paise; null when either is unknown. */
  ceilingComparison: CeilingComparison | null;
  /** Not in the API: no category on a retail price. */
  category: null;
  /**
   * Not in the API: the design's "Action required" / "Review needed" / "No
   * retail price" / "Compliant" statuses have no source or rule.
   */
  reviewStatus: null;
  /** Not in the API. */
  actionNote: null;
}

/** The markup breakdown screen: only what a RetailPrice carries. */
export interface MarkupBreakdownView {
  cropName: string | null;
  grade: PricingGrade;
  retailPrice: Money | null;
  ceilingPrice: Money | null;
  markupPct: number | null;
  ceilingComparison: CeilingComparison | null;
  /** Not in the API: no farmer purchase-price source for a retail price. */
  purchasePrice: null;
  /** Not in the API: no freight / loading / unloading expense model. */
  expenses: null;
  /** Not in the API: no customer discount model. */
  customerDiscount: null;
  /** Not in the API: no final customer price model. */
  finalCustomerPrice: null;
}

/** The retail price edit drawer's live check of what was typed. */
export type RetailDraftCheck =
  | { kind: 'empty' }
  | { kind: 'invalid' }
  /** The ceiling is not known, so no comparison is shown. */
  | { kind: 'noCeiling'; proposed: Money }
  | { kind: 'checked'; proposed: Money; comparison: CeilingComparison };

/** What the edit drawer collects; buildRetailPriceBody turns it into the POST body. */
export interface RetailPriceFormValues {
  cropId: string;
  grade: PricingGrade;
  /** As typed ("55", "55.5", "₹55.50"). */
  priceInput: string;
  /** YYYY-MM-DD; the design has no date field, so the screen must decide (owner decision). */
  effectiveFrom: string;
  markupPct?: number | undefined;
  gstInclusive?: boolean | undefined;
}

/**
 * What the Update Fair Price screen collects; buildFairPriceBody turns it into
 * the POST /fair-prices body. `ceilingInput` is a typed rupee string, never a
 * float (root CLAUDE.md 2.2).
 */
export interface FairPriceFormValues {
  cropId: string;
  grade: PricingGrade;
  /** As typed or stepped ("48", "48.50"). */
  ceilingInput: string;
  /** YYYY-MM-DD. */
  effectiveFrom: string;
  frequency?: FairPriceFrequency | undefined;
  notes?: string | undefined;
}

/**
 * One row of the Bulk Price Update list: a live ceiling, whether it is
 * selected, and what the percentage would make it (integer paise, display
 * only — the server stores what is sent and enforces BR-08).
 */
export interface BulkCeilingDraftRow {
  row: FairPriceRowView;
  selected: boolean;
  /** The ceiling the batch would send for this row; null when the row has no readable ceiling. */
  proposedCeiling: Money | null;
}

/**
 * The Market & Pricing home KPIs (Tohfa and Farmer Admin layouts). NONE has an
 * API source: there is no dashboard endpoint, and counting a paged list on the
 * phone would be wrong after the first page.
 */
export interface PricingHomeKpisView {
  totalProducts: null;
  withRetailPrices: null;
  pendingPriceUpdates: null;
  ceilingCompliance: null;
  categoriesAndGrades: null;
  recentChanges7d: null;
  activeFairPrices: null;
  productCategories: null;
  priceUpdates: null;
  retailPriceRecords: null;
}

export const PRICING_HOME_KPIS_UNAVAILABLE: PricingHomeKpisView = {
  totalProducts: null,
  withRetailPrices: null,
  pendingPriceUpdates: null,
  ceilingCompliance: null,
  categoriesAndGrades: null,
  recentChanges7d: null,
  activeFairPrices: null,
  productCategories: null,
  priceUpdates: null,
  retailPriceRecords: null,
};
