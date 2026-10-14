/**
 * Farmer listings screens: the pure view helpers and client wiring they render
 * from (api/listings.ts). Plain Node, no React -- same constraint as
 * audits.test.ts (see this app's CLAUDE.md "Testing").
 *
 * Business rules are enforced SERVER-SIDE (docs/rules.md). Where a screen
 * mirrors one as UX (BR-07 inline ceiling check, BR-10 countdown / respondable
 * state, BR-11 limit message), the test is named with the rule ID and asserts
 * only the client mirror -- never that the client is the gate.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ACTIVE_LISTING_STATUSES,
  buildCreateListingInput,
  checkAskingPrice,
  checkQuantity,
  computeRemainingTime,
  countdownParts,
  createIdempotencyKeyCache,
  createListing,
  deriveListingsOverview,
  findMyListing,
  formatKg,
  getMyListings,
  GRADE_LABEL_KEY,
  isStaleListingError,
  LISTING_STATUS_LABEL_KEY,
  lineTotal,
  listAllMyListings,
  listingDateParts,
  listingErrorMessageKey,
  listingStatusTone,
  newIdempotencyKey,
  parseServerTime,
  priceChange,
  respondableOffer,
  respondToCounterOffer,
  SELLABLE_GRADES,
  toIsoTimestamp,
  type CounterOffer,
  type Listing,
  type ListingStatus,
} from '../api/listings';
import { formatMoneyAmount } from '../api/wallet';
import { ApiError, NetworkError, setAccessToken } from '../../../shell/api/client';
import { en } from '../../../i18n/farmer';
import ta from '../../../i18n/farmer.ta.json';

const NOW = Date.parse('2026-10-05T06:00:00.000Z');
const HOUR = 60 * 60 * 1000;

function offer(overrides: Partial<CounterOffer> = {}): CounterOffer {
  return {
    id: 'offer-1',
    listingId: 'listing-1',
    round: 1,
    offeredBy: 'ADMIN',
    pricePerKg: '34.00',
    quantityKg: '150.000',
    message: 'Grades as Grade 2 on inspection.',
    status: 'PENDING',
    expiresAt: new Date(NOW + 22 * HOUR + 30 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

function listing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: 'listing-1',
    listingNumber: 'LST-2026-0001',
    farmerId: 'farmer-a',
    farmId: null,
    cropId: 'crop-carrot',
    cropName: 'Carrot',
    grade: 'GRADE_1',
    quantityKg: '150.000',
    askingPricePerKg: '40.00',
    ceilingPricePerKg: '42.00',
    finalPricePerKg: null,
    finalQuantityKg: null,
    status: 'PENDING_APPROVAL',
    availableFrom: null,
    photos: [],
    counterRoundsUsed: 0,
    activeCounterOffer: null,
    rejectionReason: null,
    version: 1,
    createdAt: '2026-10-01T05:00:00.000Z',
    updatedAt: null,
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': status >= 400 ? 'application/problem+json' : 'application/json' },
  });
}

interface CapturedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
}

function captureFetch(respond: (req: CapturedRequest, n: number) => Response): CapturedRequest[] {
  const calls: CapturedRequest[] = [];
  global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const req: CapturedRequest = {
      url: String(input),
      method: init?.method ?? 'GET',
      headers: (init?.headers ?? {}) as Record<string, string>,
      body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
    };
    calls.push(req);
    return respond(req, calls.length);
  }) as typeof fetch;
  return calls;
}

const emptyPage = { items: [], page: { nextCursor: null, hasMore: false } };

describe('Farmer listings: api client wiring', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setAccessToken('token-farmer-a');
  });
  afterEach(() => setAccessToken(null));

  it('getMyListings() sends status, cursor and limit to the own-listings endpoint and forwards the abort signal', async () => {
    let url = '';
    let seenSignal: AbortSignal | undefined;
    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      url = String(input);
      seenSignal = init?.signal ?? undefined;
      return jsonResponse(emptyPage);
    }) as typeof fetch;

    const controller = new AbortController();
    await getMyListings('COUNTER_OFFERED', 'c-1', 50, controller.signal);

    expect(url).toContain('/v1/listings?');
    expect(url).toContain('status=COUNTER_OFFERED');
    expect(url).toContain('cursor=c-1');
    expect(url).toContain('limit=50');
    expect(seenSignal).toBe(controller.signal);
  });

  it('listAllMyListings() follows the cursor to the end instead of truncating at one page', async () => {
    const calls = captureFetch((_req, n) =>
      n === 1
        ? jsonResponse({ items: [listing({ id: 'l-1' })], page: { nextCursor: 'cur-2', hasMore: true } })
        : jsonResponse({ items: [listing({ id: 'l-2' })], page: { nextCursor: null, hasMore: false } }),
    );

    const result = await listAllMyListings();

    expect(result.items.map((l) => l.id)).toEqual(['l-1', 'l-2']);
    expect(result.complete).toBe(true);
    expect(calls).toHaveLength(2);
    expect(calls[1]?.url).toContain('cursor=cur-2');
  });

  it('listAllMyListings() reports complete=false when the page guard trips (a looping cursor is not silently presented as everything)', async () => {
    let n = 0;
    captureFetch(() => {
      n += 1;
      return jsonResponse({ items: [listing({ id: `l-${n}` })], page: { nextCursor: `cur-${n}`, hasMore: true } });
    });

    const result = await listAllMyListings();

    expect(result.complete).toBe(false);
    expect(result.items.length).toBeGreaterThan(1);
  });

  it('createListing() posts the body with the Idempotency-Key header the spec requires', async () => {
    const calls = captureFetch(() => jsonResponse(listing(), 201));

    await createListing(
      { cropId: 'crop-carrot', grade: 'GRADE_1', quantityKg: '120', askingPricePerKg: '38.00' },
      'key-create-1',
    );

    expect(calls[0]?.method).toBe('POST');
    expect(calls[0]?.url).toMatch(/\/v1\/listings$/);
    expect(calls[0]?.headers['Idempotency-Key']).toBe('key-create-1');
    expect(calls[0]?.body).toEqual({
      cropId: 'crop-carrot',
      grade: 'GRADE_1',
      quantityKg: '120',
      askingPricePerKg: '38.00',
    });
  });

  it('respondToCounterOffer(accept) calls the accept endpoint for that listing + offer with the idempotency key', async () => {
    const calls = captureFetch(() => jsonResponse(listing({ status: 'ACCEPTED' })));

    await respondToCounterOffer('listing-1', 'offer-1', { kind: 'accept' }, 'key-accept');

    expect(calls).toHaveLength(1);
    expect(calls[0]?.method).toBe('POST');
    expect(calls[0]?.url).toMatch(/\/v1\/listings\/listing-1\/counter-offers\/offer-1\/accept$/);
    expect(calls[0]?.headers['Idempotency-Key']).toBe('key-accept');
  });

  it('respondToCounterOffer(reject) calls the reject endpoint with the optional message and the idempotency key', async () => {
    const calls = captureFetch(() => jsonResponse(offer({ status: 'REJECTED' })));

    await respondToCounterOffer('listing-1', 'offer-1', { kind: 'reject', message: 'Too low' }, 'key-reject');

    expect(calls[0]?.url).toMatch(/\/v1\/listings\/listing-1\/counter-offers\/offer-1\/reject$/);
    expect(calls[0]?.body).toEqual({ message: 'Too low' });
    expect(calls[0]?.headers['Idempotency-Key']).toBe('key-reject');
  });

  it('respondToCounterOffer(counter) calls the counter endpoint with price, quantity and the idempotency key', async () => {
    const calls = captureFetch(() => jsonResponse(offer({ offeredBy: 'FARMER', round: 2 }), 201));

    await respondToCounterOffer(
      'listing-1',
      'offer-1',
      { kind: 'counter', body: { pricePerKg: '38.00', quantityKg: '150.000' } },
      'key-counter',
    );

    expect(calls[0]?.url).toMatch(/\/v1\/listings\/listing-1\/counter-offers\/offer-1\/counter$/);
    expect(calls[0]?.body).toEqual({ pricePerKg: '38.00', quantityKg: '150.000' });
    expect(calls[0]?.headers['Idempotency-Key']).toBe('key-counter');
  });

  it('findMyListing() resolves a listing id from the own-listings walk (there is no GET /listings/{id})', async () => {
    captureFetch(() =>
      jsonResponse({ items: [listing({ id: 'a' }), listing({ id: 'b' })], page: { nextCursor: null, hasMore: false } }),
    );

    expect((await findMyListing('b'))?.id).toBe('b');
    expect(await findMyListing('missing')).toBeNull();
  });
});

describe('Farmer listings: status, grade and quantity display', () => {
  const ALL_STATUSES: ListingStatus[] = [
    'DRAFT',
    'PENDING_APPROVAL',
    'COUNTER_OFFERED',
    'ACCEPTED',
    'REJECTED',
    'WITHDRAWN',
    'EXPIRED',
  ];

  it('every listing status maps to a label key present in English and Tamil, and to a badge tone', () => {
    const taKeys = ta as Record<string, string>;
    for (const status of ALL_STATUSES) {
      const key = LISTING_STATUS_LABEL_KEY[status];
      expect(en[key as keyof typeof en], `missing English for ${key}`).toBeTruthy();
      expect(taKeys[key], `missing Tamil for ${key}`).toBeTruthy();
    }
    expect(listingStatusTone('COUNTER_OFFERED')).toBe('counter');
    expect(listingStatusTone('PENDING_APPROVAL')).toBe('waiting');
    expect(listingStatusTone('ACCEPTED')).toBe('approved');
    expect(listingStatusTone('REJECTED')).toBe('rejected');
    expect(listingStatusTone('WITHDRAWN')).toBe('neutral');
    expect(listingStatusTone('EXPIRED')).toBe('neutral');
    expect(listingStatusTone('DRAFT')).toBe('neutral');
  });

  it('only GRADE_1..3 are offered for a new listing (the server refuses REJECT); every grade has a label', () => {
    expect(SELLABLE_GRADES).toEqual(['GRADE_1', 'GRADE_2', 'GRADE_3']);
    for (const grade of ['GRADE_1', 'GRADE_2', 'GRADE_3', 'REJECT'] as const) {
      expect(en[GRADE_LABEL_KEY[grade] as keyof typeof en]).toBeTruthy();
    }
  });

  it('formatKg() trims trailing zeros from the server quantity string without float parsing', () => {
    expect(formatKg('150.000')).toBe('150');
    expect(formatKg('150.500')).toBe('150.5');
    expect(formatKg('0.125')).toBe('0.125');
    expect(formatKg('80')).toBe('80');
    expect(formatKg('not-a-number')).toBe('not-a-number');
  });

  it('listingDateParts() renders server timestamps in IST with a localized short-month key', () => {
    // 2026-07-13T20:00Z is already 14 Jul in IST (UTC+05:30).
    expect(listingDateParts('2026-07-13T20:00:00.000Z')).toEqual({
      day: '14',
      monthKey: 'farmer.listings.common.month.jul',
      year: 2026,
    });
    expect(listingDateParts('2026-01-05T00:00:00.000Z')?.day).toBe('05');
    expect(listingDateParts('not-a-date')).toBeNull();
    const taKeys = ta as Record<string, string>;
    for (const m of ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']) {
      expect(taKeys[`farmer.listings.common.month.${m}`]).toBeTruthy();
    }
  });

  it('toIsoTimestamp() turns the Postgres ::text timestamps the listings repo emits into ISO that Hermes can parse', () => {
    // Hermes (RN 0.74) returns NaN for the left-hand forms; V8 parses them, so assert the shape, not just Date.parse.
    expect(toIsoTimestamp('2026-10-05 07:42:36.490266+00')).toBe('2026-10-05T07:42:36.490266+00:00');
    expect(toIsoTimestamp('2026-10-05 13:12:36+05:30')).toBe('2026-10-05T13:12:36+05:30');
    expect(toIsoTimestamp('2026-10-05 13:12:36.5+0530')).toBe('2026-10-05T13:12:36.5+05:30');
    // Already-ISO values and date-only values pass through untouched.
    expect(toIsoTimestamp('2026-10-05T07:42:36.490Z')).toBe('2026-10-05T07:42:36.490Z');
    expect(toIsoTimestamp('2026-10-05')).toBe('2026-10-05');
    expect(parseServerTime('2026-10-05 07:42:36.490266+00')).toBe(Date.parse('2026-10-05T07:42:36.490Z'));
    expect(Number.isNaN(parseServerTime('garbage'))).toBe(true);
  });

  it('BR-10: an offer whose expiresAt arrives in Postgres text form is still respondable and dated correctly', () => {
    const pgExpiry = '2026-10-06 04:30:00.123456+00'; // NOW + 22h30m
    const live = listing({
      status: 'COUNTER_OFFERED',
      createdAt: '2026-07-13 20:00:00.5+00',
      activeCounterOffer: offer({ expiresAt: pgExpiry }),
    });
    expect(respondableOffer(live, NOW)?.id).toBe('offer-1');
    expect(deriveListingsOverview([live], NOW, 3).needsReply).toHaveLength(1);
    expect(listingDateParts(live.createdAt)?.monthKey).toBe('farmer.listings.common.month.jul');
    const { remainingMs } = computeRemainingTime(pgExpiry, NOW, 0, 0);
    expect(countdownParts(remainingMs)).toEqual({ hours: 22, minutes: 30 });
  });

  it('checkQuantity() accepts positive decimals up to 3 places, matching the server regex', () => {
    expect(checkQuantity('')).toBe('EMPTY');
    expect(checkQuantity('  ')).toBe('EMPTY');
    expect(checkQuantity('120')).toBe('OK');
    expect(checkQuantity('120.125')).toBe('OK');
    expect(checkQuantity('120.1255')).toBe('INVALID');
    expect(checkQuantity('0')).toBe('INVALID');
    expect(checkQuantity('0.000')).toBe('INVALID');
    expect(checkQuantity('-5')).toBe('INVALID');
    expect(checkQuantity('12a')).toBe('INVALID');
  });
});

describe('Farmer listings: money math is integer paise, never float', () => {
  it('lineTotal() multiplies price x quantity exactly and rounds half-up on the paise', () => {
    expect(lineTotal('38.00', '120.000')).toBe('4560.00');
    expect(lineTotal('0.10', '3')).toBe('0.30');
    // 19.99 x 1.5 = 29.985 -> 29.99 (half-up on paise), where float gives 29.984999...
    expect(lineTotal('19.99', '1.5')).toBe('29.99');
    expect(lineTotal('1.005', '1')).toBeNull();
    expect(lineTotal('abc', '1')).toBeNull();
    expect(lineTotal('10.00', '')).toBeNull();
  });

  it('a line total renders through formatMoneyAmount with Indian grouping', () => {
    const total = lineTotal('38.00', '200');
    expect(total).not.toBeNull();
    expect(formatMoneyAmount(total ?? '')).toBe('₹7,600.00');
  });

  it('priceChange() computes the counter-offer delta from real prices with integer rounding', () => {
    expect(priceChange('40.00', '34.00')).toEqual({ direction: 'down', percent: 15 });
    expect(priceChange('40.00', '46.00')).toEqual({ direction: 'up', percent: 15 });
    // 1/3 -> 33.33...% rounds to 33; 2/3 -> 66.66...% rounds to 67
    expect(priceChange('3.00', '2.00')).toEqual({ direction: 'down', percent: 33 });
    expect(priceChange('3.00', '1.00')).toEqual({ direction: 'down', percent: 67 });
    expect(priceChange('40.00', '40.00')).toBeNull();
    expect(priceChange('0.00', '10.00')).toBeNull();
    expect(priceChange('bad', '10.00')).toBeNull();
  });
});

describe('Farmer listings: create-listing form (BR-07 mirror; the server is the gate)', () => {
  it('BR-07: flags a price 1 paisa above the ceiling and accepts exactly the ceiling', () => {
    expect(checkAskingPrice('100.01', '100.00')).toBe('ABOVE_CEILING');
    expect(checkAskingPrice('100.00', '100.00')).toBe('WITHIN_CEILING');
    expect(checkAskingPrice('100', '100.00')).toBe('WITHIN_CEILING');
    expect(checkAskingPrice('0.30', '0.30')).toBe('WITHIN_CEILING');
    expect(checkAskingPrice('0.31', '0.30')).toBe('ABOVE_CEILING');
  });

  it('BR-07: rejects empty, zero, negative and over-precise prices before any ceiling comparison', () => {
    expect(checkAskingPrice('', '80.00')).toBe('EMPTY');
    expect(checkAskingPrice('0', '80.00')).toBe('INVALID');
    expect(checkAskingPrice('-10', '80.00')).toBe('INVALID');
    expect(checkAskingPrice('10.555', '80.00')).toBe('INVALID');
    expect(checkAskingPrice('ten', '80.00')).toBe('INVALID');
    expect(checkAskingPrice('45', null)).toBe('NO_CEILING');
  });

  it('BR-07: buildCreateListingInput refuses a price above a known ceiling and shapes a valid request', () => {
    const base = { cropId: 'crop-carrot', grade: 'GRADE_1' as const, quantityInput: ' 120 ', priceInput: '38' };

    const ok = buildCreateListingInput({ ...base, ceiling: { status: 'found', price: '42.00' } });
    expect(ok).toEqual({
      ok: true,
      input: { cropId: 'crop-carrot', grade: 'GRADE_1', quantityKg: '120', askingPricePerKg: '38.00' },
    });

    const above = buildCreateListingInput({ ...base, priceInput: '42.01', ceiling: { status: 'found', price: '42.00' } });
    expect(above).toEqual({ ok: false, error: 'PRICE_ABOVE_CEILING' });

    // Ceiling lookup failed (network): the client does not guess -- the server decides.
    const unknown = buildCreateListingInput({ ...base, priceInput: '999', ceiling: { status: 'unknown' } });
    expect(unknown.ok).toBe(true);

    // No ceiling row in effect: the server would refuse with 422, so the form says so up front.
    expect(buildCreateListingInput({ ...base, ceiling: { status: 'none' } })).toEqual({ ok: false, error: 'NO_CEILING' });
  });

  it('buildCreateListingInput requires a crop, a sellable grade, and valid quantity and price', () => {
    const ceiling = { status: 'found', price: '42.00' } as const;
    const base = { cropId: 'crop-carrot', grade: 'GRADE_2' as const, quantityInput: '10', priceInput: '30', ceiling };
    expect(buildCreateListingInput({ ...base, cropId: null })).toEqual({ ok: false, error: 'NO_CROP' });
    expect(buildCreateListingInput({ ...base, grade: null })).toEqual({ ok: false, error: 'NO_GRADE' });
    expect(buildCreateListingInput({ ...base, grade: 'REJECT' })).toEqual({ ok: false, error: 'NO_GRADE' });
    expect(buildCreateListingInput({ ...base, quantityInput: '' })).toEqual({ ok: false, error: 'QUANTITY_INVALID' });
    expect(buildCreateListingInput({ ...base, quantityInput: '1.2345' })).toEqual({ ok: false, error: 'QUANTITY_INVALID' });
    expect(buildCreateListingInput({ ...base, priceInput: '' })).toEqual({ ok: false, error: 'PRICE_INVALID' });
  });
});

describe('Farmer listings: counter-offer state (BR-10 / BR-11 mirrors)', () => {
  it('BR-10: an ADMIN offer is respondable only while PENDING, unexpired, on a COUNTER_OFFERED listing', () => {
    const live = listing({ status: 'COUNTER_OFFERED', activeCounterOffer: offer() });
    expect(respondableOffer(live, NOW)?.id).toBe('offer-1');

    const expired = listing({
      status: 'COUNTER_OFFERED',
      activeCounterOffer: offer({ expiresAt: new Date(NOW - 1000).toISOString() }),
    });
    expect(respondableOffer(expired, NOW)).toBeNull();

    const ownCounter = listing({ status: 'COUNTER_OFFERED', activeCounterOffer: offer({ offeredBy: 'FARMER' }) });
    expect(respondableOffer(ownCounter, NOW)).toBeNull();

    const notOpen = listing({ status: 'PENDING_APPROVAL', activeCounterOffer: offer() });
    expect(respondableOffer(notOpen, NOW)).toBeNull();
    expect(respondableOffer(listing(), NOW)).toBeNull();
  });

  it('BR-10: the countdown is derived from the server expiresAt, shown as hours and minutes', () => {
    expect(countdownParts(22 * HOUR + 30 * 60 * 1000)).toEqual({ hours: 22, minutes: 30 });
    expect(countdownParts(59 * 1000)).toEqual({ hours: 0, minutes: 0 });
    expect(countdownParts(0)).toEqual({ hours: 0, minutes: 0 });
    expect(countdownParts(-5000)).toEqual({ hours: 0, minutes: 0 });
  });

  it('BR-11: a server COUNTER_LIMIT_REACHED surfaces as the localized no-rounds-left message (the client never decides the limit)', () => {
    const error = new ApiError({ type: 'about:blank', title: 'Conflict', status: 409, code: 'COUNTER_LIMIT_REACHED' });
    expect(listingErrorMessageKey(error, 'farmer.listings.error.generic')).toBe('farmer.listings.error.COUNTER_LIMIT_REACHED');
  });

  it('BR-02: a server CERT_MISSING on submit (no certificate, or only rejected ones) surfaces as its own localized message', () => {
    const error = new ApiError({ type: 'about:blank', title: 'Unprocessable', status: 422, code: 'CERT_MISSING' });
    const key = listingErrorMessageKey(error, 'farmer.listings.error.generic');
    expect(key).toBe('farmer.listings.error.CERT_MISSING');
    expect(en[key as keyof typeof en]).toBe(
      'You need a verified PGS or NPOP certificate to list produce. Add one in Certifications.',
    );
    const taKeys = ta as Record<string, string>;
    expect(taKeys[key]).toBeTruthy();
    expect(taKeys[key]).not.toBe(en[key as keyof typeof en]);
  });

  it('BR-07: a server PRICE_ABOVE_CEILING on submit surfaces as the localized ceiling message', () => {
    const error = new ApiError({ type: 'about:blank', title: 'Unprocessable', status: 422, code: 'PRICE_ABOVE_CEILING' });
    expect(listingErrorMessageKey(error, 'farmer.listings.error.generic')).toBe('farmer.listings.error.PRICE_ABOVE_CEILING');
  });

  it('BR-10: COUNTER_OFFER_EXPIRED and other stale-state errors send the user back to a refreshed list', () => {
    const problem = (code: 'COUNTER_OFFER_EXPIRED' | 'LISTING_NOT_PENDING' | 'CONFLICT' | 'NOT_FOUND' | 'INTERNAL') =>
      new ApiError({ type: 'about:blank', title: 't', status: 409, code });
    expect(isStaleListingError(problem('COUNTER_OFFER_EXPIRED'))).toBe(true);
    expect(isStaleListingError(problem('LISTING_NOT_PENDING'))).toBe(true);
    expect(isStaleListingError(problem('CONFLICT'))).toBe(true);
    expect(isStaleListingError(problem('NOT_FOUND'))).toBe(true);
    expect(isStaleListingError(problem('INTERNAL'))).toBe(false);
    expect(isStaleListingError(new NetworkError(new Error('offline')))).toBe(false);
  });

  it('listingErrorMessageKey() maps network and unknown errors, and every key it can return exists in English and Tamil', () => {
    expect(listingErrorMessageKey(new NetworkError(new Error('x')), 'farmer.listings.error.generic')).toBe(
      'farmer.listings.error.network',
    );
    expect(listingErrorMessageKey(new Error('boom'), 'farmer.listings.error.generic')).toBe('farmer.listings.error.generic');
    const unmapped = new ApiError({ type: 'about:blank', title: 't', status: 500, code: 'INTERNAL' });
    expect(listingErrorMessageKey(unmapped, 'farmer.listings.error.generic')).toBe('farmer.listings.error.generic');

    const taKeys = ta as Record<string, string>;
    const codes = [
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
    ] as const;
    for (const code of codes) {
      const key = listingErrorMessageKey(
        new ApiError({ type: 'about:blank', title: 't', status: 400, code }),
        'farmer.listings.error.generic',
      );
      expect(key).toBe(`farmer.listings.error.${code}`);
      expect(en[key as keyof typeof en], `missing English for ${key}`).toBeTruthy();
      expect(taKeys[key], `missing Tamil for ${key}`).toBeTruthy();
    }
  });
});

describe('Farmer listings: marketing overview', () => {
  it('counts active listings the way the server does (pending, counter-offered, accepted) and orders replies by expiry', () => {
    const soon = listing({
      id: 'soon',
      status: 'COUNTER_OFFERED',
      createdAt: '2026-09-20T05:00:00.000Z',
      activeCounterOffer: offer({ id: 'o-soon', expiresAt: new Date(NOW + 2 * HOUR).toISOString() }),
    });
    const later = listing({
      id: 'later',
      status: 'COUNTER_OFFERED',
      createdAt: '2026-10-02T05:00:00.000Z',
      activeCounterOffer: offer({ id: 'o-later', expiresAt: new Date(NOW + 20 * HOUR).toISOString() }),
    });
    const waitingOnAdmin = listing({
      id: 'own-counter',
      status: 'COUNTER_OFFERED',
      createdAt: '2026-09-25T05:00:00.000Z',
      activeCounterOffer: offer({ offeredBy: 'FARMER' }),
    });
    const items = [
      listing({ id: 'pending', createdAt: '2026-10-04T05:00:00.000Z' }),
      later,
      waitingOnAdmin,
      soon,
      listing({ id: 'accepted', status: 'ACCEPTED', createdAt: '2026-09-10T05:00:00.000Z' }),
      listing({ id: 'withdrawn', status: 'WITHDRAWN', createdAt: '2026-09-01T05:00:00.000Z' }),
      listing({ id: 'rejected', status: 'REJECTED', createdAt: '2026-08-01T05:00:00.000Z' }),
    ];

    const overview = deriveListingsOverview(items, NOW, 3);

    expect(ACTIVE_LISTING_STATUSES).toEqual(['PENDING_APPROVAL', 'COUNTER_OFFERED', 'ACCEPTED']);
    expect(overview.activeCount).toBe(5);
    expect(overview.needsReply.map((l) => l.id)).toEqual(['soon', 'later']);
    expect(overview.recent.map((l) => l.id)).toEqual(['pending', 'later', 'own-counter']);
    expect(overview.isEmpty).toBe(false);
  });

  it('an empty history is an empty overview, not an error', () => {
    const overview = deriveListingsOverview([], NOW, 3);
    expect(overview).toEqual({ activeCount: 0, needsReply: [], recent: [], isEmpty: true });
  });
});

describe('Farmer listings: idempotency keys', () => {
  it('newIdempotencyKey() produces UUIDv4-shaped, distinct keys', () => {
    const a = newIdempotencyKey();
    const b = newIdempotencyKey();
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(a).not.toBe(b);
  });

  it('the key cache reuses one key for retries of the same request and issues a new one when the request changes', () => {
    let n = 0;
    const cache = createIdempotencyKeyCache(() => `k-${++n}`);
    expect(cache.keyFor('body-A')).toBe('k-1');
    expect(cache.keyFor('body-A')).toBe('k-1');
    // A different body under the same key would be 409 IDEMPOTENCY_KEY_REUSED on the server.
    expect(cache.keyFor('body-B')).toBe('k-2');
    cache.reset();
    expect(cache.keyFor('body-B')).toBe('k-3');
  });
});

describe('Farmer listings: i18n', () => {
  // Formats made only of placeholders / symbols legitimately read the same in Tamil.
  const SAME_IN_TAMIL = new Set([
    'farmer.listings.common.rupee',
    'farmer.listings.common.dash',
    'farmer.listings.common.shortDate',
    'farmer.listings.common.fullDate',
    'farmer.listings.create.step2.requiredMark',
    'farmer.listings.offer.subtitle',
    'farmer.listings.offer.priceDown',
    'farmer.listings.offer.priceUp',
  ]);
  const NEW_NAMESPACES = [
    'farmer.listings.common.',
    'farmer.listings.status.',
    'farmer.listings.grade.',
    'farmer.listings.market.',
    'farmer.listings.mine.',
    'farmer.listings.detail.',
    'farmer.listings.create.step1.',
    'farmer.listings.create.step2.',
    'farmer.listings.offer.',
    'farmer.listings.error.',
  ];

  it('every farmer.listings.* key has a real Tamil translation', () => {
    const taKeys = ta as Record<string, string>;
    const enKeys = en as Record<string, string>;
    const keys = Object.keys(en).filter((key) => NEW_NAMESPACES.some((ns) => key.startsWith(ns)));
    expect(keys.length).toBeGreaterThan(80);
    for (const key of Object.keys(en).filter((k) => k.startsWith('farmer.listings.'))) {
      expect(taKeys[key], `missing Tamil for ${key}`).toBeTruthy();
    }
    for (const key of keys) {
      if (SAME_IN_TAMIL.has(key)) continue;
      expect(taKeys[key], `Tamil for ${key} is a copy of English`).not.toBe(enKeys[key]);
    }
  });
});
