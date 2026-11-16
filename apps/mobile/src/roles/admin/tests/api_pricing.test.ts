/**
 * roles/admin/api/pricing.ts: the Market & Pricing clients (docs/openapi.yaml
 * /fair-prices, /fair-prices/history, /retail-prices). The shell client is
 * mocked, so these tests pin exactly what goes on the wire: paths, methods,
 * query strings, bodies and the Idempotency-Key the spec declares on
 * POST /retail-prices.
 *
 * BR-09 (retail price <= ceiling) is enforced server-side; the client only has
 * to turn the 422 into the right admin string and expose the ceiling the
 * server reported. There is deliberately no client for POST /fair-prices or
 * POST /fair-prices/bulk (Super Admin price management is still being
 * designed).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as ClientModule from '../../../shell/api/client';

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return { ...actual, request: vi.fn(async () => ({ items: [], page: { nextCursor: null, hasMore: false } })) };
});

import { ApiError, NetworkError, request } from '../../../shell/api/client';
import { adminErrorKey } from '../api/errors';
import { ADMIN_REQUEST_TIMEOUT_MS } from '../api/http';
import * as pricing from '../api/pricing';
import {
  createRetailPrice,
  ERROR_CODES,
  getFairPriceHistory,
  listFairPrices,
  listRetailPrices,
  priceAboveCeilingDetails,
  PRICING_GRADES,
} from '../api/pricing';
import { hasKey } from '../i18n';

const requestMock = vi.mocked(request);
const CROP = '11112222-3333-4444-5555-666677778888';
const KEY = '9b2f7c1e-4d3a-4e5f-8a6b-1c2d3e4f5a6b';

function lastCall() {
  const call = requestMock.mock.calls.at(-1);
  if (call === undefined) throw new Error('no request');
  return { path: call[0], options: call[1] ?? {} };
}

function problem(code: string, status: number, meta?: Record<string, unknown>) {
  return new ApiError({ type: 'about:blank', title: code, status, code: code as never, ...(meta ? { meta } : {}) });
}

beforeEach(() => requestMock.mockClear());

describe('fair price ceiling list client', () => {
  it('GETs /fair-prices with no query by default', async () => {
    await listFairPrices();
    expect(lastCall().path).toBe('/fair-prices');
    expect(lastCall().options).toMatchObject({ method: 'GET', timeoutMs: ADMIN_REQUEST_TIMEOUT_MS });
  });

  it('BR-08: sends only the documented filters (cropId, grade, effectiveOn, cursor, limit)', async () => {
    await listFairPrices({ cropId: CROP, grade: 'GRADE_1', effectiveOn: '2026-11-10', cursor: 'c1', limit: 50 });
    expect(lastCall().path).toBe(`/fair-prices?cropId=${CROP}&grade=GRADE_1&effectiveOn=2026-11-10&cursor=c1&limit=50`);
  });

  it('a 403 maps to FORBIDDEN', async () => {
    requestMock.mockRejectedValueOnce(problem('FORBIDDEN', 403));
    const err = await listFairPrices().catch((e: unknown) => e);
    expect(adminErrorKey(err)).toBe('admin.error.FORBIDDEN');
  });

  it('a lost connection maps to the network string', async () => {
    requestMock.mockRejectedValueOnce(new NetworkError(new Error('offline')));
    const err = await listFairPrices().catch((e: unknown) => e);
    expect(adminErrorKey(err)).toBe('admin.error.network');
  });
});

describe('fair price history client', () => {
  it('BR-08: GETs /fair-prices/history with the required cropId', async () => {
    await getFairPriceHistory({ cropId: CROP });
    expect(lastCall().path).toBe(`/fair-prices/history?cropId=${CROP}`);
    expect(lastCall().options).toMatchObject({ method: 'GET' });
  });

  it('sends grade, from, to, cursor and limit when given', async () => {
    await getFairPriceHistory({ cropId: CROP, grade: 'GRADE_2', from: '2026-01-01', to: '2026-11-10', cursor: 'c2', limit: 20 });
    expect(lastCall().path).toBe(
      `/fair-prices/history?cropId=${CROP}&grade=GRADE_2&from=2026-01-01&to=2026-11-10&cursor=c2&limit=20`,
    );
  });

  it('a 422 (e.g. a malformed cropId) maps to VALIDATION_FAILED', async () => {
    requestMock.mockRejectedValueOnce(problem('VALIDATION_FAILED', 422));
    const err = await getFairPriceHistory({ cropId: 'nope' }).catch((e: unknown) => e);
    expect(adminErrorKey(err)).toBe('admin.error.VALIDATION_FAILED');
  });
});

describe('retail price list client', () => {
  it('GETs /retail-prices with no query by default', async () => {
    await listRetailPrices();
    expect(lastCall().path).toBe('/retail-prices');
    expect(lastCall().options).toMatchObject({ method: 'GET' });
  });

  it('BR-09: sends only the documented filters (cropId, grade, cursor, limit)', async () => {
    await listRetailPrices({ cropId: CROP, grade: 'GRADE_3', cursor: 'c3', limit: 10 });
    expect(lastCall().path).toBe(`/retail-prices?cropId=${CROP}&grade=GRADE_3&cursor=c3&limit=10`);
  });
});

describe('set retail price client', () => {
  const body = { cropId: CROP, grade: 'GRADE_1' as const, price: '45.00', effectiveFrom: '2026-11-11' };

  it('BR-09: POSTs the body to /retail-prices with the Idempotency-Key the spec declares', async () => {
    await createRetailPrice(body, KEY);
    expect(lastCall().path).toBe('/retail-prices');
    expect(lastCall().options).toMatchObject({ method: 'POST', body, idempotencyKey: KEY });
  });

  it('sends markupPct and gstInclusive only when given', async () => {
    await createRetailPrice({ ...body, markupPct: 12.5, gstInclusive: false }, KEY);
    expect(lastCall().options.body).toEqual({ ...body, markupPct: 12.5, gstInclusive: false });
  });

  it('BR-09a: a 422 PRICE_ABOVE_CEILING maps to its admin string', async () => {
    requestMock.mockRejectedValueOnce(
      problem('PRICE_ABOVE_CEILING', 422, { ceilingPrice: '40.00', attemptedPrice: '45.00' }),
    );
    const err = await createRetailPrice(body, KEY).catch((e: unknown) => e);
    expect(adminErrorKey(err)).toBe('admin.error.PRICE_ABOVE_CEILING');
  });

  it('BR-09a: the ceiling and attempted price the server reported are surfaced as Money strings', async () => {
    requestMock.mockRejectedValueOnce(
      problem('PRICE_ABOVE_CEILING', 422, { ceilingPrice: '40.00', attemptedPrice: '45.00' }),
    );
    const err = await createRetailPrice(body, KEY).catch((e: unknown) => e);
    expect(priceAboveCeilingDetails(err)).toEqual({ ceilingPrice: '40.00', attemptedPrice: '45.00' });
  });

  it('BR-09a: rules.md names the code RETAIL_ABOVE_CEILING; that code also maps to a ceiling string', async () => {
    requestMock.mockRejectedValueOnce(problem('RETAIL_ABOVE_CEILING', 422));
    const err = await createRetailPrice(body, KEY).catch((e: unknown) => e);
    expect(adminErrorKey(err)).toBe('admin.error.RETAIL_ABOVE_CEILING');
  });

  it('priceAboveCeilingDetails is null for any other failure or a malformed meta', () => {
    expect(priceAboveCeilingDetails(problem('CONFLICT', 409))).toBeNull();
    expect(priceAboveCeilingDetails(problem('PRICE_ABOVE_CEILING', 422))).toBeNull();
    expect(priceAboveCeilingDetails(problem('PRICE_ABOVE_CEILING', 422, { ceilingPrice: 40, attemptedPrice: 'x' }))).toBeNull();
    expect(priceAboveCeilingDetails(new Error('boom'))).toBeNull();
  });

  it('no ceiling in force for the crop and grade (404) maps to NOT_FOUND', async () => {
    requestMock.mockRejectedValueOnce(problem('NOT_FOUND', 404));
    const err = await createRetailPrice(body, KEY).catch((e: unknown) => e);
    expect(adminErrorKey(err)).toBe('admin.error.NOT_FOUND');
  });

  it('a caller without pricing.retail_price.set (anyone but SUPER_ADMIN) gets FORBIDDEN', async () => {
    requestMock.mockRejectedValueOnce(problem('FORBIDDEN', 403));
    const err = await createRetailPrice(body, KEY).catch((e: unknown) => e);
    expect(adminErrorKey(err)).toBe('admin.error.FORBIDDEN');
  });
});

describe('module surface', () => {
  it('the grades are exactly the API enum (pricing.schema.ts gradeEnum)', () => {
    expect([...PRICING_GRADES]).toEqual(['GRADE_1', 'GRADE_2', 'GRADE_3', 'REJECT']);
  });

  it('there is no client for setting or bulk-updating a fair price ceiling', () => {
    const names = Object.keys(pricing);
    expect(names).not.toContain('createFairPrice');
    expect(names).not.toContain('bulkUpsertFairPrices');
  });

  it('every documented problem code has an admin-facing string', () => {
    for (const code of ERROR_CODES) {
      expect({ code, has: hasKey(`admin.error.${code}`) }).toEqual({ code, has: true });
    }
  });
});
