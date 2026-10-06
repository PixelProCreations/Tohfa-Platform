import { api, ApiError, NetworkError } from '../../../shell/api/client';
import { fromPaise, isMoney, parseMoney, toPaise, type Money } from '@tohfa/shared-types';

export type Grade = 'GRADE_1' | 'GRADE_2' | 'GRADE_3' | 'REJECT';

export type ListingStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'COUNTER_OFFERED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'EXPIRED';

export type CounterOfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED' | 'LAPSED';

export interface CounterOffer {
  id: string;
  listingId: string;
  round: number;
  offeredBy: 'ADMIN' | 'FARMER';
  offeredByUserId?: string | null | undefined;
  pricePerKg: string;
  quantityKg: string;
  message: string | null;
  status: CounterOfferStatus;
  expiresAt: string;
  respondedAt?: string | null | undefined;
}

export interface Listing {
  id: string;
  listingNumber: string;
  farmerId: string;
  farmId: string | null;
  cropId: string;
  cropName: string;
  grade: Grade;
  quantityKg: string;
  askingPricePerKg: string;
  ceilingPricePerKg: string;
  finalPricePerKg: string | null;
  finalQuantityKg: string | null;
  fairPriceId?: string | undefined;
  status: ListingStatus;
  availableFrom: string | null;
  photos: string[];
  counterRoundsUsed?: number | undefined;
  activeCounterOffer?: CounterOffer | null | undefined;
  rejectionReason: string | null;
  version: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface FairPriceCeiling {
  id: string;
  cropId: string;
  cropName?: string | undefined;
  grade: Grade;
  ceilingPrice: string;
  frequency?: string | undefined;
  effectiveFrom: string;
  notes?: string | null | undefined;
}

/**
 * The crop picked on create-listing step 1 (a `crop_master` row from
 * `GET /farmers/me/crop-master`), carried to step 2. `id` is what
 * `CreateListingInput.cropId` takes.
 */
export interface ListingCropChoice {
  id: string;
  slug: string;
  /** Already localized for display (crop_master `nameTa` in Tamil when present). */
  displayName: string;
}

export interface CreateListingInput {
  cropId: string;
  grade: Grade;
  quantityKg: string;
  askingPricePerKg: string;
  farmId?: string | undefined;
  availableFrom?: string | undefined;
  photos?: string[] | undefined;
}

export interface UpdateListingInput {
  quantityKg?: string | undefined;
  askingPricePerKg?: string | undefined;
  availableFrom?: string | undefined;
  photos?: string[] | undefined;
  version?: number | undefined;
}

export interface CounterOfferCreateInput {
  pricePerKg: string;
  quantityKg: string;
  message?: string | undefined;
}

export interface ListingListResponse {
  items: Listing[];
  page: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export interface FairPriceListResponse {
  items: FairPriceCeiling[];
  page: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

// ---------------------------------------------------------------------------
// Business Rule Validation & Domain Helpers
// ---------------------------------------------------------------------------

/**
 * BR-07: Listing price must not exceed the fair price ceiling.
 * Floating-point arithmetic is forbidden: converts to integer paise for exact comparisons.
 */
export function evalListingCeiling(
  askingPrice: string,
  ceilingPrice: string,
): { isValid: boolean; error: string | null; message: string | null } {
  if (!askingPrice || askingPrice.trim() === '') {
    return { isValid: false, error: 'REQUIRED', message: 'Price is required' };
  }

  const askingNum = Number(askingPrice);
  if (isNaN(askingNum) || askingNum <= 0) {
    return { isValid: false, error: 'INVALID_PRICE', message: 'Price must be greater than zero' };
  }

  const ceilingNum = Number(ceilingPrice);
  if (isNaN(ceilingNum) || ceilingNum <= 0) {
    // If no valid ceiling is provided yet, accept price format but flag missing ceiling
    return { isValid: true, error: null, message: null };
  }

  const askingPaise = Math.round(askingNum * 100);
  const ceilingPaise = Math.round(ceilingNum * 100);

  if (askingPaise > ceilingPaise) {
    return {
      isValid: false,
      error: 'PRICE_ABOVE_CEILING',
      message: `Price exceeds fair-price ceiling of ₹${ceilingNum.toFixed(2)}/kg (BR-07)`,
    };
  }

  return { isValid: true, error: null, message: null };
}

/**
 * BR-11: Counter-offers may be countered back at most 3 times.
 * @param farmerCountersUsed Number of times the farmer has already submitted a counter-offer.
 */
export function canCounterBack(farmerCountersUsed: number): boolean {
  return farmerCountersUsed < 3;
}

/**
 * BR-10: 24-Hour Counter-Offer countdown derived strictly from server `expiresAt`.
 * Uses monotonic elapsed time (performance.now) to protect against local device clock tampering.
 */
export function computeRemainingTime(
  expiresAtIso: string,
  serverNowMs?: number,
  clientBasePerfMs?: number,
  currentPerfMs?: number,
): { remainingMs: number; remainingSeconds: number; isExpired: boolean } {
  // Accepts the server's Postgres text form too (see toIsoTimestamp).
  const expiresAtMs = parseServerTime(expiresAtIso);

  let nowMs: number;
  if (serverNowMs !== undefined && clientBasePerfMs !== undefined && currentPerfMs !== undefined) {
    const elapsed = Math.max(0, currentPerfMs - clientBasePerfMs);
    nowMs = serverNowMs + elapsed;
  } else {
    nowMs = Date.now();
  }

  const remainingMs = Math.max(0, expiresAtMs - nowMs);
  const remainingSeconds = Math.floor(remainingMs / 1000);
  const isExpired = remainingMs <= 0;

  return { remainingMs, remainingSeconds, isExpired };
}

/**
 * Formats milliseconds into HH:MM:SS format.
 */
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

// ---------------------------------------------------------------------------
// API Methods
// ---------------------------------------------------------------------------

/**
 * Fetches fair price ceiling for a crop and grade.
 * Authoritative source before typing asking price (BR-07).
 */
export async function getFairPriceCeilings(
  cropId?: string,
  grade?: Grade,
  signal?: AbortSignal,
): Promise<FairPriceListResponse> {
  const parts: string[] = [];
  if (cropId) parts.push(`cropId=${encodeURIComponent(cropId)}`);
  if (grade) parts.push(`grade=${encodeURIComponent(grade)}`);
  const path = parts.length > 0 ? `/fair-prices?${parts.join('&')}` : '/fair-prices';
  return await api.get<FairPriceListResponse>(path, signal);
}

/**
 * Submits a new produce listing.
 * Reuses single idempotencyKey across retries to prevent duplicate submissions.
 */
export async function createListing(
  input: CreateListingInput,
  idempotencyKey: string,
): Promise<Listing> {
  return await api.post<Listing>('/listings', input, idempotencyKey);
}

/**
 * Lists the caller's produce listings with status filter (e.g. for Sold / Unsold tabs).
 */
export async function getMyListings(
  status?: ListingStatus,
  cursor?: string,
  limit: number = 20,
  signal?: AbortSignal,
): Promise<ListingListResponse> {
  const parts: string[] = [`limit=${limit}`];
  if (status) parts.push(`status=${encodeURIComponent(status)}`);
  if (cursor) parts.push(`cursor=${encodeURIComponent(cursor)}`);
  return await api.get<ListingListResponse>(`/listings?${parts.join('&')}`, signal);
}

/**
 * Updates a pending produce listing.
 */
export async function updateListing(id: string, body: UpdateListingInput): Promise<Listing> {
  return await api.patch<Listing>(`/listings/${id}`, body);
}

/**
 * Withdraws a pending produce listing.
 * docs/openapi.yaml marks `Idempotency-Key` required on this POST; the key is
 * optional here only so existing callers keep compiling.
 */
export async function withdrawListing(
  id: string,
  version?: number,
  idempotencyKey?: string,
): Promise<Listing> {
  return await api.post<Listing>(`/listings/${id}/withdraw`, { version }, idempotencyKey);
}

/**
 * Accepts an admin counter-offer (spec: `Idempotency-Key` required).
 */
export async function acceptCounterOffer(
  listingId: string,
  offerId: string,
  idempotencyKey?: string,
): Promise<Listing> {
  return await api.post<Listing>(
    `/listings/${listingId}/counter-offers/${offerId}/accept`,
    {},
    idempotencyKey,
  );
}

/**
 * Rejects an admin counter-offer with optional message (spec: `Idempotency-Key` required).
 */
export async function rejectCounterOffer(
  listingId: string,
  offerId: string,
  message?: string,
  idempotencyKey?: string,
): Promise<CounterOffer> {
  return await api.post<CounterOffer>(
    `/listings/${listingId}/counter-offers/${offerId}/reject`,
    { message },
    idempotencyKey,
  );
}

/**
 * Counters back an admin counter-offer (BR-11, at most 3 rounds).
 * Reuses idempotencyKey across network retries.
 */
export async function counterBackOffer(
  listingId: string,
  offerId: string,
  body: CounterOfferCreateInput,
  idempotencyKey?: string,
): Promise<CounterOffer> {
  return await api.post<CounterOffer>(
    `/listings/${listingId}/counter-offers/${offerId}/counter`,
    body,
    idempotencyKey,
  );
}

// ---------------------------------------------------------------------------
// Listing screens: history walk, counter-offer dispatch, pure view helpers
//
// Everything below is what the six screens in screens/listings/ render from.
// No React and no i18n import, so it unit-tests in plain Node
// (tests/listings.test.ts) -- same split as api/audits.ts. i18n keys are typed
// `string`; screens call `t(key as TranslationKey)`.
//
// Business rules stay server-side (docs/rules.md). The BR-07 / BR-10 helpers
// here only let a screen say early what the server is going to say anyway;
// the server's own error is always surfaced when it disagrees.
// ---------------------------------------------------------------------------

/** LimitParam maximum in docs/openapi.yaml. */
const LISTING_PAGE_SIZE = 100;
/**
 * Guard against a server bug looping the cursor, not a business limit. When it
 * trips, the result says so (`complete: false`) rather than passing a partial
 * history off as the whole thing.
 */
const LISTING_MAX_PAGES = 50;

export interface ListingHistory {
  items: Listing[];
  /** False only when the page guard stopped the walk before `hasMore` went false. */
  complete: boolean;
}

/**
 * Walks the caller's own listings to the end of the cursor so counts ("Active
 * listings", "N listings · all time") are real, not one page's worth.
 */
export async function listAllMyListings(
  status?: ListingStatus,
  signal?: AbortSignal,
): Promise<ListingHistory> {
  const items: Listing[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < LISTING_MAX_PAGES; i += 1) {
    const page = await getMyListings(status, cursor, LISTING_PAGE_SIZE, signal);
    items.push(...page.items);
    if (!page.page.hasMore || page.page.nextCursor === null) {
      return { items, complete: true };
    }
    cursor = page.page.nextCursor;
  }
  return { items, complete: false };
}

/**
 * docs/openapi.yaml has no `GET /listings/{id}`, so a screen opened with only
 * an id (a notification deep link) resolves it from the caller's own listing
 * walk. Another farmer's id is simply not in that list (BR-36) -> null.
 */
export async function findMyListing(listingId: string, signal?: AbortSignal): Promise<Listing | null> {
  const { items } = await listAllMyListings(undefined, signal);
  return items.find((l) => l.id === listingId) ?? null;
}

export type CounterOfferResponse =
  | { kind: 'accept' }
  | { kind: 'reject'; message?: string | undefined }
  | { kind: 'counter'; body: CounterOfferCreateInput };

/**
 * One entry point for the three farmer responses to an admin counter-offer,
 * so the screen (and the test) cannot wire a button to the wrong endpoint.
 * Every one of these POSTs requires an `Idempotency-Key` in docs/openapi.yaml.
 */
export async function respondToCounterOffer(
  listingId: string,
  offerId: string,
  response: CounterOfferResponse,
  idempotencyKey: string,
): Promise<Listing | CounterOffer> {
  switch (response.kind) {
    case 'accept':
      return acceptCounterOffer(listingId, offerId, idempotencyKey);
    case 'reject':
      return rejectCounterOffer(listingId, offerId, response.message, idempotencyKey);
    case 'counter':
      return counterBackOffer(listingId, offerId, response.body, idempotencyKey);
  }
}

export const LISTING_STATUS_LABEL_KEY: Record<ListingStatus, string> = {
  DRAFT: 'farmer.listings.status.DRAFT',
  PENDING_APPROVAL: 'farmer.listings.status.PENDING_APPROVAL',
  COUNTER_OFFERED: 'farmer.listings.status.COUNTER_OFFERED',
  ACCEPTED: 'farmer.listings.status.ACCEPTED',
  REJECTED: 'farmer.listings.status.REJECTED',
  WITHDRAWN: 'farmer.listings.status.WITHDRAWN',
  EXPIRED: 'farmer.listings.status.EXPIRED',
};

/** Which of the design's badge / card-accent colour sets a status uses. */
export type ListingStatusTone = 'counter' | 'waiting' | 'approved' | 'rejected' | 'neutral';

export function listingStatusTone(status: ListingStatus): ListingStatusTone {
  switch (status) {
    case 'COUNTER_OFFERED':
      return 'counter';
    case 'PENDING_APPROVAL':
      return 'waiting';
    case 'ACCEPTED':
      return 'approved';
    case 'REJECTED':
      return 'rejected';
    default:
      return 'neutral';
  }
}

export const GRADE_LABEL_KEY: Record<Grade, string> = {
  GRADE_1: 'farmer.listings.grade.GRADE_1',
  GRADE_2: 'farmer.listings.grade.GRADE_2',
  GRADE_3: 'farmer.listings.grade.GRADE_3',
  REJECT: 'farmer.listings.grade.REJECT',
};

/** `REJECT` is a valid Grade but `POST /listings` refuses it (ListingCreate in docs/openapi.yaml). */
export const SELLABLE_GRADES: readonly Grade[] = ['GRADE_1', 'GRADE_2', 'GRADE_3'];

/**
 * "Active listings" means what the server counts as active for the BR-14
 * free-tier quota (`countActiveListings` in apps/api/.../listings.repo.ts),
 * not a definition invented here.
 */
export const ACTIVE_LISTING_STATUSES: readonly ListingStatus[] = [
  'PENDING_APPROVAL',
  'COUNTER_OFFERED',
  'ACCEPTED',
];

/** Server `Quantity`: kg with up to 3 decimals (listings.schema.ts quantityRegex). */
const QUANTITY_RE = /^\d+(\.\d{1,3})?$/;

/** "150.000" -> "150", "150.500" -> "150.5". String-only, never parsed to a float. */
export function formatKg(quantity: string): string {
  const trimmed = quantity.trim();
  if (!QUANTITY_RE.test(trimmed)) return quantity;
  if (!trimmed.includes('.')) return trimmed;
  return trimmed.replace(/\.?0+$/, '');
}

export type QuantityCheck = 'EMPTY' | 'INVALID' | 'OK';

export function checkQuantity(input: string): QuantityCheck {
  const trimmed = input.trim();
  if (trimmed === '') return 'EMPTY';
  if (!QUANTITY_RE.test(trimmed)) return 'INVALID';
  return /[1-9]/.test(trimmed) ? 'OK' : 'INVALID';
}

/** Integer paise for a price string, or null when it is not a well-formed Money value. */
function paiseOf(value: string): number | null {
  const trimmed = value.trim();
  if (!isMoney(trimmed)) return null;
  return toPaise(parseMoney(trimmed));
}

/** Quantity in thousandths of a kg, as a BigInt so price x quantity can never overflow. */
function milliKgOf(quantity: string): bigint | null {
  const trimmed = quantity.trim();
  if (!QUANTITY_RE.test(trimmed)) return null;
  const [whole = '0', frac = ''] = trimmed.split('.');
  return BigInt(whole) * 1000n + BigInt(frac.padEnd(3, '0'));
}

/**
 * The listings repo serializes timestamps with `::text`, i.e. Postgres's own
 * format (`2026-10-05 07:42:36.490266+00`), not the ISO 8601 `date-time` that
 * docs/openapi.yaml promises. V8 (and so the tests) parses that, but Hermes --
 * the engine RN 0.74 ships -- returns NaN, which would make every counter-offer
 * look expired and every date blank on a device. Normalized to ISO here; an
 * already-ISO value passes through unchanged. (Server-side mismatch flagged
 * separately -- the fix belongs in the repo's SELECT.)
 */
export function toIsoTimestamp(value: string): string {
  const time = String.raw`(\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)`;
  return value
    .trim()
    .replace(/^(\d{4}-\d{2}-\d{2}) (?=\d)/, '$1T')
    .replace(new RegExp(`${time}([+-]\\d{2})$`), '$1$2:00')
    .replace(new RegExp(`${time}([+-]\\d{2})(\\d{2})$`), '$1$2:$3');
}

/** Epoch ms for a server timestamp in either ISO or Postgres text form; NaN when unparseable. */
export function parseServerTime(value: string): number {
  return Date.parse(toIsoTimestamp(value));
}

/** The price a listing trades at: the agreed one once set, otherwise the ask. */
export function effectivePricePerKg(l: Pick<Listing, 'askingPricePerKg' | 'finalPricePerKg'>): string {
  return l.finalPricePerKg ?? l.askingPricePerKg;
}

export function effectiveQuantityKg(l: Pick<Listing, 'quantityKg' | 'finalQuantityKg'>): string {
  return l.finalQuantityKg ?? l.quantityKg;
}

/**
 * price/kg x kg, in integer paise (x1000 for the kg decimals), rounded half-up
 * on the paise -- the same convention as `multiply()` in @tohfa/shared-types,
 * but without ever turning the fractional kg into a float factor.
 */
export function lineTotal(pricePerKg: string, quantityKg: string): Money | null {
  const paise = paiseOf(pricePerKg);
  const milliKg = milliKgOf(quantityKg);
  if (paise === null || paise < 0 || milliKg === null) return null;
  const roundedPaise = (BigInt(paise) * milliKg + 500n) / 1000n;
  const asNumber = Number(roundedPaise);
  if (!Number.isSafeInteger(asNumber)) return null;
  return fromPaise(asNumber);
}

/**
 * Percentage move from one price to another (the counter-offer card's
 * "▼15%"), rounded half-up in integers. Null when there is no move to show.
 */
export function priceChange(
  fromPrice: string,
  toPrice: string,
): { direction: 'down' | 'up'; percent: number } | null {
  const from = paiseOf(fromPrice);
  const to = paiseOf(toPrice);
  if (from === null || to === null || from <= 0 || to < 0 || from === to) return null;
  const diff = BigInt(Math.abs(from - to));
  const base = BigInt(from);
  const percent = Number((diff * 200n + base) / (base * 2n));
  return { direction: to < from ? 'down' : 'up', percent };
}

export type PriceCheck = 'EMPTY' | 'INVALID' | 'NO_CEILING' | 'WITHIN_CEILING' | 'ABOVE_CEILING';

/**
 * BR-07 mirror for the inline hint under the asking-price field. Exact paise
 * comparison; `ceilingPrice` null means there is no ceiling to compare against.
 */
export function checkAskingPrice(input: string, ceilingPrice: string | null): PriceCheck {
  const trimmed = input.trim();
  if (trimmed === '') return 'EMPTY';
  const asking = paiseOf(trimmed);
  if (asking === null || asking <= 0) return 'INVALID';
  const ceiling = ceilingPrice === null ? null : paiseOf(ceilingPrice);
  if (ceiling === null) return 'NO_CEILING';
  return asking > ceiling ? 'ABOVE_CEILING' : 'WITHIN_CEILING';
}

/**
 * What the screen knows about the fair-price ceiling for the chosen crop and
 * grade. `none` = the server answered with no ceiling in effect (it would
 * refuse the listing); `unknown` = the lookup failed, so the server decides.
 */
export type CeilingLookup =
  | { status: 'found'; price: string }
  | { status: 'none' }
  | { status: 'unknown' };

export type CreateListingFormError =
  | 'NO_CROP'
  | 'NO_GRADE'
  | 'QUANTITY_INVALID'
  | 'PRICE_INVALID'
  | 'NO_CEILING'
  | 'PRICE_ABOVE_CEILING';

export interface CreateListingForm {
  cropId: string | null;
  grade: Grade | null;
  quantityInput: string;
  priceInput: string;
  ceiling: CeilingLookup;
}

export type CreateListingFormResult =
  | { ok: true; input: CreateListingInput }
  | { ok: false; error: CreateListingFormError };

/** Shapes the `POST /listings` body from the step-2 form, or says why it cannot yet. */
export function buildCreateListingInput(form: CreateListingForm): CreateListingFormResult {
  if (form.cropId === null) return { ok: false, error: 'NO_CROP' };
  if (form.grade === null || !SELLABLE_GRADES.includes(form.grade)) return { ok: false, error: 'NO_GRADE' };
  if (checkQuantity(form.quantityInput) !== 'OK') return { ok: false, error: 'QUANTITY_INVALID' };
  const priceCheck = checkAskingPrice(
    form.priceInput,
    form.ceiling.status === 'found' ? form.ceiling.price : null,
  );
  if (priceCheck === 'EMPTY' || priceCheck === 'INVALID') return { ok: false, error: 'PRICE_INVALID' };
  if (form.ceiling.status === 'none') return { ok: false, error: 'NO_CEILING' };
  if (priceCheck === 'ABOVE_CEILING') return { ok: false, error: 'PRICE_ABOVE_CEILING' };
  return {
    ok: true,
    input: {
      cropId: form.cropId,
      grade: form.grade,
      quantityKg: form.quantityInput.trim(),
      askingPricePerKg: parseMoney(form.priceInput.trim()),
    },
  };
}

/**
 * BR-10 mirror: the admin counter-offer the farmer can still answer, or null.
 * The farmer's own counter (offeredBy FARMER) is waiting on the admin, and an
 * offer past `expiresAt` is refused by the server (409 COUNTER_OFFER_EXPIRED)
 * even before the expiry sweep marks it LAPSED.
 */
export function respondableOffer(
  listing: Pick<Listing, 'status' | 'activeCounterOffer'>,
  nowMs: number,
): CounterOffer | null {
  const offer = listing.activeCounterOffer;
  if (listing.status !== 'COUNTER_OFFERED' || offer === null || offer === undefined) return null;
  if (offer.offeredBy !== 'ADMIN' || offer.status !== 'PENDING') return null;
  const expiresAtMs = parseServerTime(offer.expiresAt);
  if (Number.isNaN(expiresAtMs) || expiresAtMs <= nowMs) return null;
  return offer;
}

/** Asia/Kolkata is a fixed UTC+05:30 with no DST, so a plain offset is exact. */
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const;

/**
 * Day / short-month key / year of a server timestamp in IST, for the "14 Jul"
 * and "09 Jul 2026" labels. Null for an unparseable value.
 */
export function listingDateParts(iso: string): { day: string; monthKey: string; year: number } | null {
  const ms = parseServerTime(iso);
  if (Number.isNaN(ms)) return null;
  const d = new Date(ms + IST_OFFSET_MS);
  const day = d.getUTCDate();
  return {
    day: day < 10 ? `0${day}` : String(day),
    monthKey: `farmer.listings.common.month.${MONTH_KEYS[d.getUTCMonth()] ?? 'jan'}`,
    year: d.getUTCFullYear(),
  };
}

/** "22h 30m" parts for a remaining-time figure; never negative. */
export function countdownParts(remainingMs: number): { hours: number; minutes: number } {
  const totalMinutes = Math.max(0, Math.floor(remainingMs / 60000));
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
}

export interface ListingsOverview {
  activeCount: number;
  /** Listings with an answerable admin counter-offer, soonest expiry first. */
  needsReply: Listing[];
  /** Newest first, at most `recentLimit`. */
  recent: Listing[];
  isEmpty: boolean;
}

export function deriveListingsOverview(items: Listing[], nowMs: number, recentLimit: number): ListingsOverview {
  const expiryOf = (l: Listing): number => parseServerTime(l.activeCounterOffer?.expiresAt ?? '');
  return {
    activeCount: items.filter((l) => ACTIVE_LISTING_STATUSES.includes(l.status)).length,
    needsReply: items
      .filter((l) => respondableOffer(l, nowMs) !== null)
      .sort((a, b) => expiryOf(a) - expiryOf(b)),
    recent: [...items]
      .sort((a, b) => parseServerTime(b.createdAt) - parseServerTime(a.createdAt))
      .slice(0, recentLimit),
    isEmpty: items.length === 0,
  };
}

/** Problem codes the listing screens have their own localized message for. */
const LISTING_ERROR_CODES = new Set<string>([
  'PRICE_ABOVE_CEILING',
  'CERT_EXPIRED',
  'CERT_UNVERIFIED',
  'CERT_MISSING',
  'FREE_TIER_LIMIT',
  'COUNTER_OFFER_EXPIRED',
  'COUNTER_LIMIT_REACHED',
  'LISTING_NOT_PENDING',
  'CONFLICT',
  'NOT_FOUND',
  'VALIDATION_FAILED',
  'IDEMPOTENCY_KEY_REUSED',
  'FORBIDDEN',
]);

/**
 * i18n key for a failed listing request, branching on the machine code (never
 * the English `detail`, which the server does not localize).
 */
export function listingErrorMessageKey(error: unknown, fallbackKey: string): string {
  if (error instanceof NetworkError) return 'farmer.listings.error.network';
  if (error instanceof ApiError && LISTING_ERROR_CODES.has(error.problem.code)) {
    return `farmer.listings.error.${error.problem.code}`;
  }
  return fallbackKey;
}

const STALE_LISTING_CODES = new Set<string>([
  'COUNTER_OFFER_EXPIRED',
  'LISTING_NOT_PENDING',
  'CONFLICT',
  'NOT_FOUND',
]);

/** The listing changed under the screen; going back re-fetches the list. */
export function isStaleListingError(error: unknown): boolean {
  return error instanceof ApiError && STALE_LISTING_CODES.has(error.problem.code);
}

/**
 * UUIDv4 for the `Idempotency-Key` header. Hermes on older Androids has no
 * `crypto.randomUUID`; the fallback only has to be unique per logical
 * operation from this device (the server scopes keys and keeps them 24h), not
 * unguessable, so Math.random is acceptable there.
 */
export function newIdempotencyKey(): string {
  const cryptoLike = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (typeof cryptoLike?.randomUUID === 'function') return cryptoLike.randomUUID();
  const hex = '0123456789abcdef';
  let key = '';
  for (let i = 0; i < 36; i += 1) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      key += '-';
    } else if (i === 14) {
      key += '4';
    } else {
      const nibble = Math.floor(Math.random() * 16);
      key += hex.charAt(i === 19 ? (nibble & 0x3) | 0x8 : nibble);
    }
  }
  return key;
}

/**
 * One key per logical request: a retry of the same body replays the same key
 * (the server returns the original result), while a changed body gets a new
 * key (re-using one would be 409 IDEMPOTENCY_KEY_REUSED).
 */
export function createIdempotencyKeyCache(generate: () => string = newIdempotencyKey): {
  keyFor: (fingerprint: string) => string;
  reset: () => void;
} {
  let current: { fingerprint: string; key: string } | null = null;
  return {
    keyFor(fingerprint: string): string {
      if (current === null || current.fingerprint !== fingerprint) {
        current = { fingerprint, key: generate() };
      }
      return current.key;
    },
    reset(): void {
      current = null;
    },
  };
}
