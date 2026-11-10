/**
 * roles/admin/api/farmerApplications.ts: the /admin/farmer-applications
 * clients. The shell client is mocked, so these tests pin what goes on the
 * wire. docs/openapi.yaml declares the Idempotency-Key header (required) on
 * approve, reject and request-info, so each of them must carry the key it is
 * given; the reads carry none.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as ClientModule from '../../../shell/api/client';

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return { ...actual, request: vi.fn(async () => ({ items: [], page: { nextCursor: null, hasMore: false } })) };
});

import { ApiError, request } from '../../../shell/api/client';
import { adminErrorKey } from '../api/errors';
import {
  ERROR_CODES,
  approveFarmerApplication,
  getFarmerApplication,
  listFarmerApplications,
  rejectFarmerApplication,
  requestFarmerApplicationInfo,
} from '../api/farmerApplications';
import { ADMIN_REQUEST_TIMEOUT_MS } from '../api/http';
import { hasKey } from '../i18n';

const requestMock = vi.mocked(request);
const APP = '66666666-6666-4666-8666-666666666666';
const ZONE = '55555555-5555-4555-8555-555555555555';
const KEY = '77777777-7777-4777-8777-777777777777';

function lastCall() {
  const call = requestMock.mock.calls.at(-1);
  if (call === undefined) throw new Error('no request');
  return { path: call[0], options: call[1] ?? {} };
}

function problem(code: string, status: number, meta?: Record<string, unknown>) {
  return new ApiError({ type: 'about:blank', title: code, status, code: code as never, ...(meta ? { meta } : {}) });
}

beforeEach(() => requestMock.mockClear());

describe('application queue client', () => {
  it('GETs /admin/farmer-applications with no query by default', async () => {
    await listFarmerApplications();
    expect(lastCall().path).toBe('/admin/farmer-applications');
    expect(lastCall().options).toMatchObject({ method: 'GET', timeoutMs: ADMIN_REQUEST_TIMEOUT_MS });
  });

  it('sends only the documented filters (status, zoneId, submittedAfter, cursor, limit)', async () => {
    await listFarmerApplications({
      status: 'SUBMITTED',
      zoneId: ZONE,
      submittedAfter: '2026-10-01T00:00:00.000Z',
      cursor: 'c1',
      limit: 20,
    });
    expect(lastCall().path).toBe(
      `/admin/farmer-applications?status=SUBMITTED&zoneId=${ZONE}&submittedAfter=2026-10-01T00%3A00%3A00.000Z&cursor=c1&limit=20`,
    );
  });

  it('GETs one application by encoded id', async () => {
    await getFarmerApplication(APP);
    expect(lastCall().path).toBe(`/admin/farmer-applications/${APP}`);
    expect(lastCall().options).toMatchObject({ method: 'GET' });
    expect(lastCall().options.idempotencyKey).toBeUndefined();
  });
});

describe('application decision clients', () => {
  it('approve POSTs the optional note with the Idempotency-Key', async () => {
    await approveFarmerApplication(APP, { note: 'Documents checked.' }, KEY);
    expect(lastCall().path).toBe(`/admin/farmer-applications/${APP}/approve`);
    expect(lastCall().options).toMatchObject({ method: 'POST', body: { note: 'Documents checked.' }, idempotencyKey: KEY });
  });

  it('approve with no note still sends an (empty) body and the key', async () => {
    await approveFarmerApplication(APP, {}, KEY);
    expect(lastCall().options).toMatchObject({ method: 'POST', body: {}, idempotencyKey: KEY });
  });

  it('BR-69: an approval refused for zero farm locations maps to VALIDATION_FAILED', async () => {
    requestMock.mockRejectedValueOnce(problem('VALIDATION_FAILED', 422, { missingSteps: [3] }));
    const err = await approveFarmerApplication(APP, {}, KEY).catch((e: unknown) => e);
    expect(adminErrorKey(err)).toBe('admin.error.VALIDATION_FAILED');
  });

  it('BR-135: an approval refused for an admin applicant maps to CONFLICT', async () => {
    requestMock.mockRejectedValueOnce(problem('CONFLICT', 409));
    const err = await approveFarmerApplication(APP, {}, KEY).catch((e: unknown) => e);
    expect(adminErrorKey(err)).toBe('admin.error.CONFLICT');
  });

  it('reject POSTs reasonCode and reason with the Idempotency-Key', async () => {
    const body = { reasonCode: 'LAND_NOT_VERIFIED' as const, reason: 'Survey number does not match the FMB polygon.' };
    await rejectFarmerApplication(APP, body, KEY);
    expect(lastCall().path).toBe(`/admin/farmer-applications/${APP}/reject`);
    expect(lastCall().options).toMatchObject({ method: 'POST', body, idempotencyKey: KEY });
  });

  it('request-info POSTs the message and steps with the Idempotency-Key', async () => {
    const body = { message: 'Please re-upload the ID proof.', requiredSteps: [4] };
    await requestFarmerApplicationInfo(APP, body, KEY);
    expect(lastCall().path).toBe(`/admin/farmer-applications/${APP}/request-info`);
    expect(lastCall().options).toMatchObject({ method: 'POST', body, idempotencyKey: KEY });
  });

  it('a reused key maps to IDEMPOTENCY_KEY_REUSED', async () => {
    requestMock.mockRejectedValueOnce(problem('IDEMPOTENCY_KEY_REUSED', 409));
    const err = await rejectFarmerApplication(APP, { reasonCode: 'OTHER', reason: 'Duplicate entry.' }, KEY).catch(
      (e: unknown) => e,
    );
    expect(adminErrorKey(err)).toBe('admin.error.IDEMPOTENCY_KEY_REUSED');
  });
});

describe('ERROR_CODES', () => {
  it('every documented problem code has an admin-facing string', () => {
    for (const code of ERROR_CODES) {
      expect({ code, has: hasKey(`admin.error.${code}`) }).toEqual({ code, has: true });
    }
  });
});
