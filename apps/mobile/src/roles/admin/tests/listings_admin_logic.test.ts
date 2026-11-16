/**
 * Listing approval (Tohfa "Produce list"): the API client (api/listings.ts),
 * its query keys, and the pure screen logic (screens/listings/listingsLogic.ts).
 *
 * The shell client is mocked, so these pin exactly what goes on the wire:
 * GET /admin/listings (listing.queue.view_pending), POST
 * /admin/listings/{id}/approve | reject | counter-offers, each POST with an
 * Idempotency-Key (docs/openapi.yaml IdempotencyKeyHeader, required). Money is
 * the shared-types Money string, built from integer paise, never a float.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type * as ClientModule from '../../../shell/api/client';

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return { ...actual, request: vi.fn(async () => ({ items: [], page: { nextCursor: null, hasMore: false } })) };
});

import type { Money } from '@tohfa/shared-types';
import { ApiError, request } from '../../../shell/api/client';
import { adminErrorKey } from '../api/errors';
import { ADMIN_REQUEST_TIMEOUT_MS } from '../api/http';
import {
  approveListing,
  listAdminListings,
  listingWriteFingerprint,
  rejectListing,
  REJECT_REASON_CODES,
  sendCounterOffer,
  toListingQueueRow,
  type AdminListingDto,
} from '../api/listings';
import { adminKeys, listingKeys, LISTINGS_MODULE } from '../api/queryKeys';
import { hasKey } from '../i18n';
import { makeCan } from '../permissions/can';
import {
  approveBody,
  filterByGrade,
  formatPerKg,
  formatQuantityKg,
  GRADE_TABS,
  LISTING_CODES,
  listingAccess,
  validateCounterDraft,
  validateRejectDraft,
} from '../screens/listings/listingsLogic';

const requestMock = vi.mocked(request);
const LISTING = '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d';
const WAREHOUSE = '3f1b7c2e-2a44-4f0e-9b1a-6b0d2f0f1a01';
const KEY = '1b2c3d4e-5f60-4a7b-8c9d-0e1f2a3b4c5d';

function lastCall() {
  const call = requestMock.mock.calls.at(-1);
  if (call === undefined) throw new Error('no request');
  return { path: call[0], options: (call[1] ?? {}) as Record<string, unknown> };
}

function dto(over: Partial<AdminListingDto> = {}): AdminListingDto {
  return {
    id: LISTING,
    cropId: 'c1',
    cropName: 'Kohlrabi',
    grade: 'GRADE_2',
    quantityKg: '12.500',
    askingPricePerKg: '41.50',
    ceilingPricePerKg: '44.00',
    status: 'PENDING_APPROVAL',
    createdAt: '2026-11-10T06:00:00Z',
    farmerName: 'Live Farmer',
    tohfaFarmerId: 'TF-LIVE-1',
    routedAway: false,
    ...over,
  };
}

beforeEach(() => requestMock.mockClear());

describe('listings client: wire format', () => {
  it('GETs /admin/listings for the pending queue with cursor and limit', async () => {
    await listAdminListings({ status: 'PENDING_APPROVAL', cursor: 'abc', limit: 20 });
    expect(lastCall().path).toBe('/admin/listings?status=PENDING_APPROVAL&cursor=abc&limit=20');
    expect(lastCall().options).toMatchObject({ method: 'GET', timeoutMs: ADMIN_REQUEST_TIMEOUT_MS });
  });

  it('approve POSTs the destination warehouse with the Idempotency-Key, once', async () => {
    await approveListing(LISTING, { warehouseId: WAREHOUSE }, KEY);
    expect(requestMock).toHaveBeenCalledTimes(1);
    expect(lastCall().path).toBe(`/admin/listings/${LISTING}/approve`);
    expect(lastCall().options).toMatchObject({ method: 'POST', body: { warehouseId: WAREHOUSE }, idempotencyKey: KEY });
  });

  it('reject POSTs reasonCode and reason with the Idempotency-Key, once', async () => {
    await rejectListing(LISTING, { reasonCode: 'NO_DEMAND', reason: 'No buyers this week' }, KEY);
    expect(requestMock).toHaveBeenCalledTimes(1);
    expect(lastCall().path).toBe(`/admin/listings/${LISTING}/reject`);
    expect(lastCall().options).toMatchObject({
      method: 'POST',
      body: { reasonCode: 'NO_DEMAND', reason: 'No buyers this week' },
      idempotencyKey: KEY,
    });
  });

  it('BR-10/BR-11: counter POSTs /counter-offers with price, quantity and the Idempotency-Key, once', async () => {
    await sendCounterOffer(LISTING, { pricePerKg: '75.00' as Money, quantityKg: '75' }, KEY);
    expect(requestMock).toHaveBeenCalledTimes(1);
    expect(lastCall().path).toBe(`/admin/listings/${LISTING}/counter-offers`);
    expect(lastCall().options).toMatchObject({
      method: 'POST',
      body: { pricePerKg: '75.00', quantityKg: '75' },
      idempotencyKey: KEY,
    });
  });

  it('the reject reason codes are exactly the spec enum', () => {
    expect([...REJECT_REASON_CODES]).toEqual(['QUALITY_CONCERN', 'PRICE_UNACCEPTABLE', 'NO_DEMAND', 'CERT_ISSUE', 'DUPLICATE', 'OTHER']);
  });

  it('one Idempotency-Key per listing AND body: two listings with the same body never share a key', () => {
    const a = listingWriteFingerprint('a', { warehouseId: WAREHOUSE });
    const b = listingWriteFingerprint('b', { warehouseId: WAREHOUSE });
    expect(a).not.toEqual(b);
    expect(listingWriteFingerprint('a', { warehouseId: WAREHOUSE })).toEqual(a);
  });

  it('documented failures map to admin strings (BR-29 self approval, BR-11 rounds, not pending)', () => {
    for (const code of ['SELF_APPROVAL_FORBIDDEN', 'COUNTER_LIMIT_REACHED', 'LISTING_NOT_PENDING', 'IDEMPOTENCY_KEY_REUSED', 'NOT_FOUND', 'FORBIDDEN']) {
      const key = adminErrorKey(new ApiError({ type: 'about:blank', title: code, status: 409, code: code as never }));
      expect(key).toBe(`admin.error.${code}`);
      expect(hasKey(key)).toBe(true);
    }
  });
});

describe('listings query keys', () => {
  it('are scoped by warehouse under the listings module', () => {
    const key = listingKeys.queue(WAREHOUSE, { status: 'PENDING_APPROVAL' });
    expect(key.slice(0, 2)).toEqual(adminKeys.module(LISTINGS_MODULE));
    expect(key[2]).toBe(WAREHOUSE);
    expect(listingKeys.queue(undefined, {})[2]).toBe('all');
  });
});

describe('queue row mapping (live data only)', () => {
  it('keeps the live values and turns money into Money', () => {
    const row = toListingQueueRow(dto());
    expect(row).toMatchObject({
      id: LISTING,
      cropName: 'Kohlrabi',
      quantityKg: '12.500',
      askingPrice: '41.50',
      ceilingPrice: '44.00',
      farmerName: 'Live Farmer',
      farmerCode: 'TF-LIVE-1',
      grade: 'GRADE_2',
      routedAway: false,
    });
  });

  it('missing or malformed values are null, never a guessed number', () => {
    const row = toListingQueueRow(
      dto({ cropName: undefined, farmerName: undefined, tohfaFarmerId: undefined, ceilingPricePerKg: undefined, askingPricePerKg: 'abc' }),
    );
    expect(row.cropName).toBeNull();
    expect(row.farmerName).toBeNull();
    expect(row.farmerCode).toBeNull();
    expect(row.ceilingPrice).toBeNull();
    expect(row.askingPrice).toBeNull();
  });

  it('BR-29: routedAway rows stay read-only', () => {
    expect(toListingQueueRow(dto({ routedAway: true })).routedAway).toBe(true);
  });
});

describe('access: codes only, missing can denies', () => {
  it('uses the rbac.json codes', () => {
    expect(LISTING_CODES).toEqual({
      view: 'listing.queue.view_pending',
      approve: 'listing.approve',
      reject: 'listing.reject',
      counter: 'listing.counter_offer.send',
    });
    const rbac = fs.readFileSync(path.join(__dirname, '../../../../../../docs/rbac.json'), 'utf8');
    for (const code of Object.values(LISTING_CODES)) expect(rbac).toContain(`"${code}"`);
  });

  it('each action follows only its own code', () => {
    expect(listingAccess(makeCan(['listing.queue.view_pending', 'listing.approve']))).toEqual({
      view: true,
      approve: true,
      reject: false,
      counter: false,
    });
    expect(listingAccess(makeCan(['listing.reject']))).toEqual({ view: false, approve: false, reject: true, counter: false });
  });

  it('a missing can denies everything', () => {
    expect(listingAccess(undefined)).toEqual({ view: false, approve: false, reject: false, counter: false });
  });
});

describe('grade tabs and display', () => {
  it('filters loaded rows by the selected grade', () => {
    const rows = [toListingQueueRow(dto({ id: 'a', grade: 'GRADE_1' })), toListingQueueRow(dto({ id: 'b', grade: 'GRADE_3' }))];
    expect(GRADE_TABS).toEqual(['ALL', 'GRADE_1', 'GRADE_2', 'GRADE_3']);
    expect(filterByGrade(rows, 'ALL').map((r) => r.id)).toEqual(['a', 'b']);
    expect(filterByGrade(rows, 'GRADE_3').map((r) => r.id)).toEqual(['b']);
  });

  it('quantity trims trailing zeros as text, never through a float', () => {
    expect(formatQuantityKg('80.000')).toBe('80');
    expect(formatQuantityKg('12.500')).toBe('12.5');
    expect(formatQuantityKg('0.125')).toBe('0.125');
    expect(formatQuantityKg(null)).toBeNull();
  });

  it('per-kg prices render from paise; null stays null', () => {
    expect(formatPerKg('40.00' as Money)).toBe('₹40');
    expect(formatPerKg('41.50' as Money)).toBe('₹41.50');
    expect(formatPerKg(null)).toBeNull();
  });
});

describe('approve body', () => {
  it('needs the destination warehouse the spec requires; none means no request', () => {
    expect(approveBody(WAREHOUSE)).toEqual({ warehouseId: WAREHOUSE });
    expect(approveBody(undefined)).toBeNull();
    expect(approveBody('')).toBeNull();
  });
});

describe('reject draft: the spec requires reasonCode and a 5..500 char reason', () => {
  it('refuses a missing code or a short reason', () => {
    expect(validateRejectDraft({ reasonCode: null, reason: 'Long enough reason' })).toEqual({ ok: false, errors: { reasonCode: true } });
    expect(validateRejectDraft({ reasonCode: 'OTHER', reason: ' abc ' })).toEqual({ ok: false, errors: { reason: true } });
    expect(validateRejectDraft({ reasonCode: null, reason: '' })).toEqual({ ok: false, errors: { reasonCode: true, reason: true } });
  });

  it('builds the trimmed body', () => {
    expect(validateRejectDraft({ reasonCode: 'CERT_ISSUE', reason: '  Certificate expired  ' })).toEqual({
      ok: true,
      body: { reasonCode: 'CERT_ISSUE', reason: 'Certificate expired' },
    });
  });

  it('refuses a reason over 500 characters', () => {
    expect(validateRejectDraft({ reasonCode: 'OTHER', reason: 'x'.repeat(501) })).toEqual({ ok: false, errors: { reason: true } });
  });
});

describe('counter draft: Money from integer paise, never a float', () => {
  it("normalises typed rupees to a 2-dp Money string ('0.1' -> '0.10', not 0.1 + 0.2 drift)", () => {
    const a = validateCounterDraft({ price: '0.1', quantity: '75', message: '' });
    expect(a).toEqual({ ok: true, body: { pricePerKg: '0.10', quantityKg: '75' } });
    const b = validateCounterDraft({ price: '0.30', quantity: '1.250', message: ' soft demand ' });
    expect(b).toEqual({ ok: true, body: { pricePerKg: '0.30', quantityKg: '1.250', message: 'soft demand' } });
    const c = validateCounterDraft({ price: '33.5', quantity: '10', message: '' });
    expect(c.ok && c.body.pricePerKg).toBe('33.50');
  });

  it('refuses garbage, zero, negatives and too many decimals', () => {
    expect(validateCounterDraft({ price: 'abc', quantity: '10', message: '' })).toEqual({ ok: false, errors: { price: true } });
    expect(validateCounterDraft({ price: '0', quantity: '10', message: '' })).toEqual({ ok: false, errors: { price: true } });
    expect(validateCounterDraft({ price: '1.234', quantity: '10', message: '' })).toEqual({ ok: false, errors: { price: true } });
    expect(validateCounterDraft({ price: '10', quantity: '-1', message: '' })).toEqual({ ok: false, errors: { quantity: true } });
    expect(validateCounterDraft({ price: '10', quantity: '0', message: '' })).toEqual({ ok: false, errors: { quantity: true } });
    expect(validateCounterDraft({ price: '10', quantity: '1.2345', message: '' })).toEqual({ ok: false, errors: { quantity: true } });
  });

  it('does not check the price against the ceiling (server-side, BR-07; being fixed by the API team)', () => {
    expect(validateCounterDraft({ price: '999999', quantity: '1', message: '' }).ok).toBe(true);
  });
});
