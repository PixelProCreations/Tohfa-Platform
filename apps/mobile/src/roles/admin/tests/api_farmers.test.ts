/**
 * roles/admin/api/farmers.ts: the /admin/farmers clients (BR-108, BR-33, BR-06,
 * BR-14, BR-53). The shell client is mocked, so these tests pin exactly what
 * goes on the wire: paths, methods, query strings and bodies, and that no
 * Idempotency-Key is sent (docs/openapi.yaml declares none on these routes:
 * the PATCH is a field update and the document verify is idempotent by rule,
 * BR-108e). Scope (BR-108a) is a server WHERE clause, so no client test exists
 * for it: the client sends no scope at all.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as ClientModule from '../../../shell/api/client';

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return { ...actual, request: vi.fn(async () => ({ items: [], page: { nextCursor: null, hasMore: false } })) };
});

import { ApiError, NetworkError, request } from '../../../shell/api/client';
import { adminErrorKey } from '../api/errors';
import {
  ERROR_CODES,
  FARMER_LOCKED_FIELDS,
  getFarmer,
  getFarmerRating,
  getFarmerSubscription,
  listFarmerBankAccounts,
  listFarmerDocuments,
  listFarmers,
  updateFarmer,
  verifyFarmerDocument,
} from '../api/farmers';
import { ADMIN_REQUEST_TIMEOUT_MS } from '../api/http';
import { hasKey } from '../i18n';

const requestMock = vi.mocked(request);
const FARMER = '33333333-3333-4333-8333-333333333333';
const DOC = '44444444-4444-4444-8444-444444444444';
const ZONE = '55555555-5555-4555-8555-555555555555';

function lastCall() {
  const call = requestMock.mock.calls.at(-1);
  if (call === undefined) throw new Error('no request');
  return { path: call[0], options: call[1] ?? {} };
}

function problem(code: string, status: number) {
  return new ApiError({ type: 'about:blank', title: code, status, code: code as never });
}

beforeEach(() => requestMock.mockClear());

describe('farmer directory client', () => {
  it('GETs /admin/farmers with no query by default', async () => {
    await listFarmers();
    expect(lastCall().path).toBe('/admin/farmers');
    expect(lastCall().options).toMatchObject({ method: 'GET', timeoutMs: ADMIN_REQUEST_TIMEOUT_MS });
  });

  it('BR-108b: sends only the documented filters (q, status, zoneId, ratingTier, cursor, limit)', async () => {
    await listFarmers({ q: ' Murugan ', status: 'ACTIVE', zoneId: ZONE, ratingTier: 'GOOD', cursor: 'c1', limit: 20 });
    expect(lastCall().path).toBe(`/admin/farmers?q=Murugan&status=ACTIVE&zoneId=${ZONE}&ratingTier=GOOD&cursor=c1&limit=20`);
  });

  it('drops a blank search (the server needs at least one character)', async () => {
    await listFarmers({ q: '   ' });
    expect(lastCall().path).toBe('/admin/farmers');
  });

  it('GETs one farmer by encoded id', async () => {
    await getFarmer(FARMER);
    expect(lastCall().path).toBe(`/admin/farmers/${FARMER}`);
    expect(lastCall().options).toMatchObject({ method: 'GET' });
  });

  it('encodes an id that is not a plain uuid', async () => {
    await getFarmer('a/b');
    expect(lastCall().path).toBe('/admin/farmers/a%2Fb');
  });
});

describe('farmer profile edit client', () => {
  it('BR-108d: PATCHes only the given fields, with no Idempotency-Key', async () => {
    await updateFarmer(FARMER, { fullName: 'Murugan Selvam', village: null });
    expect(lastCall().path).toBe(`/admin/farmers/${FARMER}`);
    expect(lastCall().options).toMatchObject({ method: 'PATCH', body: { fullName: 'Murugan Selvam', village: null } });
    expect(lastCall().options.idempotencyKey).toBeUndefined();
  });

  it('BR-33a: the locked keys are exactly mobile, aadhaarLast4 and aadhaar', () => {
    expect([...FARMER_LOCKED_FIELDS].sort()).toEqual(['aadhaar', 'aadhaarLast4', 'mobile']);
  });

  it('BR-33a: a FIELD_LOCKED refusal maps to its admin string', async () => {
    requestMock.mockRejectedValueOnce(problem('FIELD_LOCKED', 403));
    const err = await updateFarmer(FARMER, { mobile: '+919812345678' }).catch((e: unknown) => e);
    expect(adminErrorKey(err)).toBe('admin.error.FIELD_LOCKED');
  });
});

describe('farmer documents client', () => {
  it('GETs the document list', async () => {
    await listFarmerDocuments(FARMER);
    expect(lastCall().path).toBe(`/admin/farmers/${FARMER}/documents`);
    expect(lastCall().options).toMatchObject({ method: 'GET' });
  });

  it('BR-108e: verify POSTs no body and no Idempotency-Key (a replay is a no-op by rule)', async () => {
    await verifyFarmerDocument(FARMER, DOC);
    expect(lastCall().path).toBe(`/admin/farmers/${FARMER}/documents/${DOC}/verify`);
    expect(lastCall().options).toMatchObject({ method: 'POST' });
    expect(lastCall().options.body).toBeUndefined();
    expect(lastCall().options.idempotencyKey).toBeUndefined();
  });

  it('a 404 (missing, or outside scope) maps to NOT_FOUND', async () => {
    requestMock.mockRejectedValueOnce(problem('NOT_FOUND', 404));
    const err = await verifyFarmerDocument(FARMER, DOC).catch((e: unknown) => e);
    expect(adminErrorKey(err)).toBe('admin.error.NOT_FOUND');
  });
});

describe('farmer bank, subscription and rating clients', () => {
  it('BR-108f: GETs the masked payout destinations', async () => {
    await listFarmerBankAccounts(FARMER);
    expect(lastCall().path).toBe(`/admin/farmers/${FARMER}/bank-accounts`);
    expect(lastCall().options).toMatchObject({ method: 'GET' });
  });

  it('BR-14b: GETs the subscription and free-tier limits', async () => {
    await getFarmerSubscription(FARMER);
    expect(lastCall().path).toBe(`/admin/farmers/${FARMER}/subscription`);
    expect(lastCall().options).toMatchObject({ method: 'GET' });
  });

  it('BR-06: GETs the read-only rating (there is no write route)', async () => {
    await getFarmerRating(FARMER);
    expect(lastCall().path).toBe(`/admin/farmers/${FARMER}/rating`);
    expect(lastCall().options).toMatchObject({ method: 'GET' });
  });

  it('a lost connection maps to the network string', async () => {
    requestMock.mockRejectedValueOnce(new NetworkError(new Error('offline')));
    const err = await getFarmerRating(FARMER).catch((e: unknown) => e);
    expect(adminErrorKey(err)).toBe('admin.error.network');
  });

  it('a 403 maps to FORBIDDEN', async () => {
    requestMock.mockRejectedValueOnce(problem('FORBIDDEN', 403));
    const err = await listFarmerBankAccounts(FARMER).catch((e: unknown) => e);
    expect(adminErrorKey(err)).toBe('admin.error.FORBIDDEN');
  });
});

describe('ERROR_CODES', () => {
  it('every documented problem code has an admin-facing string', () => {
    for (const code of ERROR_CODES) {
      expect({ code, has: hasKey(`admin.error.${code}`) }).toEqual({ code, has: true });
    }
  });
});
