/**
 * Pure presentation helpers for the farmer Listings screens.
 *
 * Kept free of React / react-native imports so they run in plain Node under
 * vitest (see tests/listing_view.test.ts). Everything here derives strictly
 * from fields the backend actually returns on `Listing` / `FairPriceCeiling`
 * (docs/openapi.yaml) -- nothing is estimated, defaulted or invented. When a
 * value cannot be derived honestly, the helper returns `null` and the screen
 * says so.
 *
 * Money never touches a float (CLAUDE.md §2.2): prices are converted to
 * integer paise and quantities to integer grams before any multiplication.
 */
import { fromPaise, parseMoney, toPaise, type Money } from '@tohfa/shared-types';
import type { FairPriceCeiling, Grade, Listing, ListingStatus } from '../../api/listings';
import { t, type TranslationKey } from '../../../../i18n/farmer';

// ---------------------------------------------------------------------------
// Status -> label / tone
// ---------------------------------------------------------------------------

/**
 * Colour family for a status badge. Screens map a tone onto the palette tokens
 * they already use, so this module stays free of colour values.
 */
export type ListingTone = 'grey' | 'orange' | 'purple' | 'green' | 'red';

export interface ListingStatusDisplay {
  label: string;
  tone: ListingTone;
}

const STATUS_LABEL_KEY: Readonly<Record<ListingStatus, TranslationKey>> = {
  DRAFT: 'farmer.listings.status.DRAFT',
  PENDING_APPROVAL: 'farmer.listings.status.PENDING_APPROVAL',
  COUNTER_OFFERED: 'farmer.listings.status.COUNTER_OFFERED',
  ACCEPTED: 'farmer.listings.status.ACCEPTED',
  REJECTED: 'farmer.listings.status.REJECTED',
  WITHDRAWN: 'farmer.listings.status.WITHDRAWN',
  EXPIRED: 'farmer.listings.status.EXPIRED',
};

const STATUS_TONE: Readonly<Record<ListingStatus, ListingTone>> = {
  DRAFT: 'grey',
  PENDING_APPROVAL: 'orange',
  COUNTER_OFFERED: 'purple',
  ACCEPTED: 'green',
  REJECTED: 'red',
  WITHDRAWN: 'grey',
  EXPIRED: 'grey',
};

/**
 * Label + tone for every real `ListingStatus`. Unknown values fall back to a grey raw label.
 * The label is looked up through `t()` on every call (never pre-built into a static table) so
 * it always reflects whatever locale is live when the screen renders -- see i18n/runtime.ts.
 */
export function listingStatusDisplay(status: ListingStatus | string): ListingStatusDisplay {
  const key = (STATUS_LABEL_KEY as Record<string, TranslationKey | undefined>)[status];
  const tone = (STATUS_TONE as Record<string, ListingTone | undefined>)[status];
  if (!key || !tone) return { label: String(status), tone: 'grey' };
  return { label: t(key), tone };
}

/** Statuses a farmer filter can pick from, in display order. */
export const LISTING_STATUS_FILTERS: readonly ListingStatus[] = [
  'PENDING_APPROVAL',
  'COUNTER_OFFERED',
  'ACCEPTED',
  'REJECTED',
  'WITHDRAWN',
  'EXPIRED',
  'DRAFT',
];

/** Market grades a farmer may list. `REJECT` is refused by POST /listings, so it is not offered. */
export const LISTABLE_GRADES: readonly Exclude<Grade, 'REJECT'>[] = ['GRADE_1', 'GRADE_2', 'GRADE_3'];

export function gradeLabel(grade: Grade | string): string {
  switch (grade) {
    case 'GRADE_1':
      return t('farmer.listings.grade.GRADE_1');
    case 'GRADE_2':
      return t('farmer.listings.grade.GRADE_2');
    case 'GRADE_3':
      return t('farmer.listings.grade.GRADE_3');
    case 'REJECT':
      return t('farmer.listings.grade.REJECT');
    default:
      return String(grade);
  }
}

// ---------------------------------------------------------------------------
// Quantity / money parsing
// ---------------------------------------------------------------------------

const RUPEE_INPUT_RE = /^\d{1,10}(\.\d{1,2})?$/;
const QUANTITY_INPUT_RE = /^\d{1,9}(\.\d{1,3})?$/;

/**
 * Parses what a farmer typed into a price box into `Money` ("38" -> "38.00").
 * Returns null for empty, malformed, more-than-2-decimal or non-positive input.
 */
export function parseRupeeInput(input: string): Money | null {
  const trimmed = input.trim();
  if (!RUPEE_INPUT_RE.test(trimmed)) return null;
  const money = parseMoney(trimmed);
  return toPaise(money) > 0 ? money : null;
}

/**
 * Parses a typed kg quantity into the API `Quantity` format ("120" -> "120.000").
 * Returns null for empty, malformed, more-than-3-decimal or non-positive input.
 */
export function parseQuantityInput(input: string): string | null {
  const trimmed = input.trim();
  if (!QUANTITY_INPUT_RE.test(trimmed)) return null;
  const grams = quantityToGrams(trimmed);
  if (grams === null || grams <= 0) return null;
  return gramsToQuantity(grams);
}

/** Integer grams for a `Quantity` decimal string, or null when malformed. */
export function quantityToGrams(quantity: string | null | undefined): number | null {
  if (quantity === null || quantity === undefined) return null;
  const trimmed = quantity.trim();
  if (!/^-?\d+(\.\d{1,3})?$/.test(trimmed)) return null;
  const negative = trimmed.startsWith('-');
  const body = negative ? trimmed.slice(1) : trimmed;
  const [whole = '0', frac = ''] = body.split('.');
  const grams = Number(whole) * 1000 + Number(frac.padEnd(3, '0'));
  if (!Number.isSafeInteger(grams)) return null;
  return negative ? -grams : grams;
}

function gramsToQuantity(grams: number): string {
  const whole = Math.trunc(grams / 1000);
  const frac = grams % 1000;
  return `${whole}.${String(frac).padStart(3, '0')}`;
}

/** "250.000" -> "250", "1.500" -> "1.5". Display only. */
export function formatQuantityKg(quantity: string | null | undefined): string {
  const grams = quantityToGrams(quantity);
  if (grams === null) return quantity ?? '';
  const whole = Math.trunc(grams / 1000);
  const frac = Math.abs(grams % 1000);
  if (frac === 0) return String(whole);
  return `${whole}.${String(frac).padStart(3, '0').replace(/0+$/, '')}`;
}

/**
 * price-per-kg x quantity, computed on integer paise x integer grams and
 * rounded half-up to the paisa. Returns null if either side is missing or
 * malformed -- callers must then show "not available", never a guess.
 */
export function computeSaleValue(
  pricePerKg: string | null | undefined,
  quantityKg: string | null | undefined,
): Money | null {
  if (!pricePerKg || !quantityKg) return null;
  let pricePaise: number;
  try {
    pricePaise = toPaise(parseMoney(pricePerKg));
  } catch {
    return null;
  }
  const grams = quantityToGrams(quantityKg);
  if (grams === null) return null;
  const product = pricePaise * grams;
  if (!Number.isSafeInteger(product)) return null;
  const paise = product < 0 ? -Math.round(-product / 1000) : Math.round(product / 1000);
  return fromPaise(paise);
}

/**
 * Whole-percent drop from `askPrice` to `offerPrice`, computed on integer paise.
 * Display only. Null when the offer is not below the ask or either side is malformed.
 */
export function discountPercent(
  askPrice: string | null | undefined,
  offerPrice: string | null | undefined,
): number | null {
  if (!askPrice || !offerPrice) return null;
  let ask: number;
  let offer: number;
  try {
    ask = toPaise(parseMoney(askPrice));
    offer = toPaise(parseMoney(offerPrice));
  } catch {
    return null;
  }
  if (ask <= 0 || offer >= ask) return null;
  return Math.round(((ask - offer) * 100) / ask);
}

/** Formats a Money-ish string for display as "₹38" / "₹38.50". Falls back to the raw text. */
export function formatRupees(value: string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  let money: Money;
  try {
    money = parseMoney(value);
  } catch {
    return `₹${value}`;
  }
  const paise = toPaise(money);
  const negative = paise < 0;
  const abs = Math.abs(paise);
  const rupees = String(Math.trunc(abs / 100));
  const rem = abs % 100;
  let grouped = rupees;
  if (rupees.length > 3) {
    grouped = `${rupees.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${rupees.slice(-3)}`;
  }
  return `${negative ? '-' : ''}₹${grouped}${rem === 0 ? '' : `.${String(rem).padStart(2, '0')}`}`;
}

// ---------------------------------------------------------------------------
// Summary metrics
// ---------------------------------------------------------------------------

export interface ListingsSummary {
  /** DRAFT + PENDING_APPROVAL + COUNTER_OFFERED. */
  activeCount: number;
  /** COUNTER_OFFERED listings -- these need the farmer's reply. */
  awaitingResponseCount: number;
  /**
   * Sum of finalPricePerKg x finalQuantityKg over ACCEPTED listings that carry
   * both final fields. This is GROSS sale value: the API exposes no commission,
   * payout or paid status, so nothing is deducted here. Null when no accepted
   * listing has both final fields.
   */
  acceptedGross: Money | null;
}

const ACTIVE_STATUSES: ReadonlySet<ListingStatus> = new Set<ListingStatus>([
  'DRAFT',
  'PENDING_APPROVAL',
  'COUNTER_OFFERED',
]);

export function summarizeListings(listings: readonly Listing[]): ListingsSummary {
  let activeCount = 0;
  let awaitingResponseCount = 0;
  let grossPaise = 0;
  let grossSeen = false;
  for (const l of listings) {
    if (ACTIVE_STATUSES.has(l.status)) activeCount += 1;
    if (l.status === 'COUNTER_OFFERED') awaitingResponseCount += 1;
    if (l.status === 'ACCEPTED') {
      const value = computeSaleValue(l.finalPricePerKg, l.finalQuantityKg);
      if (value !== null) {
        grossPaise += toPaise(value);
        grossSeen = true;
      }
    }
  }
  return {
    activeCount,
    awaitingResponseCount,
    acceptedGross: grossSeen ? fromPaise(grossPaise) : null,
  };
}

// ---------------------------------------------------------------------------
// Fair price ceiling
// ---------------------------------------------------------------------------

/**
 * GET /fair-prices already returns ceilings effective today. If the server
 * hands back more than one row for the grade, the latest `effectiveFrom` wins.
 * Returns null when no ceiling exists for the grade -- the server will refuse
 * the listing in that case, so the screen must block submit and say why.
 */
export function pickCurrentCeiling(
  items: readonly FairPriceCeiling[],
  grade: Grade,
): FairPriceCeiling | null {
  let best: FairPriceCeiling | null = null;
  for (const item of items) {
    if (item.grade !== grade) continue;
    if (best === null || item.effectiveFrom > best.effectiveFrom) best = item;
  }
  return best;
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-07-09T..." -> "09 Jul 2026" (device-local date). Empty string when unparseable. */
export function formatListingDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()] ?? ''} ${d.getFullYear()}`;
}

/** Human label for the last server-side change, keyed by the current status. */
export function updatedAtLabel(status: ListingStatus | string): string {
  switch (status) {
    case 'COUNTER_OFFERED':
      return t('farmer.dashboard.alerts.counterOfferTitle');
    case 'ACCEPTED':
      return t('farmer.listings.status.ACCEPTED');
    case 'REJECTED':
      return t('farmer.listings.status.REJECTED');
    case 'WITHDRAWN':
      return t('farmer.listings.status.WITHDRAWN');
    case 'EXPIRED':
      return t('farmer.listings.status.EXPIRED');
    default:
      return t('farmer.listings.updatedAt.default');
  }
}
