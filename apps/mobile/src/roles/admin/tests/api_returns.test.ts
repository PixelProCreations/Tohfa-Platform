/**
 * roles/admin/api/returns.ts (plan phase 10): the return (RMA) queue, detail,
 * status history, and the inspect / approve / reject / wallet-refund writes
 * (docs/openapi.yaml tag Returns). The shell client is mocked (same pattern as
 * roles/farmer/tests/admin_auth_api.test.ts), so these tests pin exactly what
 * goes on the wire.
 *
 * BR-30: return_requests has no warehouse of its own; the server scopes the
 * queue by the linked order's warehouse. No route takes a warehouseId, so the
 * module never sends one.
 * BR-61: the wallet refund needs an Idempotency-Key; the same return reuses its
 * key on a retry and two returns never share one. The bank refund
 * (rma.refund.bank_process) is `none` for both warehouse roles: the module
 * exports nothing for it.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as ClientModule from '../../../shell/api/client';

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return {
    ...actual,
    request: vi.fn(async () => ({ items: [], page: { nextCursor: null, hasMore: false } })),
  };
});

import { ApiError, NetworkError, request } from '../../../shell/api/client';
import { createIdempotencyKeyCache } from '../../../shell/api/idempotency';
import { adminErrorKey } from '../api/errors';
import { bodyFingerprint } from '../api/hookHelpers';
import { ADMIN_REQUEST_TIMEOUT_MS } from '../api/http';
import * as returnsApi from '../api/returns';
import {
  ERROR_CODES,
  approveReturn,
  getReturn,
  getReturnHistory,
  inspectReturn,
  listReturns,
  refundReturnToWallet,
  rejectReturn,
} from '../api/returns';
import { hasKey } from '../i18n';
import { refundIdempotencyFingerprint } from '../screens/warehouse/returns-rma/mappers';

const requestMock = vi.mocked(request);

const RETURN_ID = '7a7a7a7a-1111-4222-8333-444455556666';
const OTHER_RETURN = '8b8b8b8b-1111-4222-8333-444455556666';
const ITEM = '5c5c5c5c-1111-4222-8333-444455556666';
const FOREIGN_WH = '99999999-9999-4999-8999-999999999999';
const GET = { method: 'GET', timeoutMs: ADMIN_REQUEST_TIMEOUT_MS };

beforeEach(() => {
  vi.clearAllMocks();
});

function lastCall(): [string, Record<string, unknown>] {
  const call = requestMock.mock.calls.at(-1);
  if (call === undefined) throw new Error('request() was not called');
  return [call[0], call[1] as Record<string, unknown>];
}

describe('listReturns (BR-30)', () => {
  it('GETs /admin/returns with no query by default', async () => {
    await listReturns();
    expect(requestMock).toHaveBeenCalledWith('/admin/returns', GET);
  });

  it('sends status, cursor and limit as given', async () => {
    await listReturns({ status: 'INSPECTED', cursor: 'c-1', limit: 20 });
    expect(lastCall()[0]).toBe('/admin/returns?status=INSPECTED&cursor=c-1&limit=20');
  });

  it('BR-30: never sends a warehouseId (or any filter the spec does not define)', async () => {
    const leaky = { status: 'PENDING', warehouseId: FOREIGN_WH, customerId: FOREIGN_WH } as unknown as Parameters<typeof listReturns>[0];
    await listReturns(leaky);
    expect(lastCall()[0]).toBe('/admin/returns?status=PENDING');
  });
});

describe('getReturn / getReturnHistory', () => {
  it('GETs /admin/returns/{id} and /admin/returns/{id}/history, each id one encoded segment', async () => {
    await getReturn(RETURN_ID);
    expect(requestMock).toHaveBeenCalledWith(`/admin/returns/${RETURN_ID}`, GET);
    await getReturnHistory(RETURN_ID);
    expect(requestMock).toHaveBeenCalledWith(`/admin/returns/${RETURN_ID}/history`, GET);
    await getReturn('a/b');
    expect(lastCall()[0]).toBe('/admin/returns/a%2Fb');
  });

  it('BR-30: a return outside the scope is 404 (never 403) and reads as not found', async () => {
    requestMock.mockRejectedValueOnce(new ApiError({ type: 'about:blank', title: 'Not Found', status: 404, code: 'NOT_FOUND' }));
    const error = await getReturn(RETURN_ID).catch((e: unknown) => e);
    expect(adminErrorKey(error)).toBe('admin.error.NOT_FOUND');
  });
});

describe('inspectReturn (BR-61)', () => {
  it('POSTs the per-item condition, accepted and damaged quantity (kg strings) to /admin/returns/{id}/inspect', async () => {
    const body = { items: [{ orderItemId: ITEM, condition: 'DAMAGED' as const, acceptedQty: '1.500', damagedQty: '0.500' }] };
    await inspectReturn(RETURN_ID, body);
    expect(requestMock).toHaveBeenCalledWith(`/admin/returns/${RETURN_ID}/inspect`, {
      method: 'POST',
      body,
      timeoutMs: ADMIN_REQUEST_TIMEOUT_MS,
    });
  });
});

describe('approveReturn / rejectReturn (BR-61)', () => {
  it('approve POSTs an empty body to /admin/returns/{id}/approve', async () => {
    await approveReturn(RETURN_ID);
    expect(requestMock).toHaveBeenCalledWith(`/admin/returns/${RETURN_ID}/approve`, {
      method: 'POST',
      body: {},
      timeoutMs: ADMIN_REQUEST_TIMEOUT_MS,
    });
  });

  it('BR-61a: approving a return that is not INSPECTED is a 409 the admin is told about', async () => {
    requestMock.mockRejectedValueOnce(
      new ApiError({ type: 'about:blank', title: 'Conflict', status: 409, code: 'INVALID_STATE_TRANSITION' }),
    );
    const error = await approveReturn(RETURN_ID).catch((e: unknown) => e);
    expect(adminErrorKey(error)).toBe('admin.error.INVALID_STATE_TRANSITION');
  });

  it('reject POSTs {reason} trimmed', async () => {
    await rejectReturn(RETURN_ID, { reason: '  Produce was consumed  ' });
    expect(requestMock).toHaveBeenCalledWith(`/admin/returns/${RETURN_ID}/reject`, {
      method: 'POST',
      body: { reason: 'Produce was consumed' },
      timeoutMs: ADMIN_REQUEST_TIMEOUT_MS,
    });
  });

  it('reject refuses an empty or over-long reason (spec 1..300) before any request', async () => {
    await expect(rejectReturn(RETURN_ID, { reason: '   ' })).rejects.toThrow();
    await expect(rejectReturn(RETURN_ID, { reason: 'x'.repeat(301) })).rejects.toThrow();
    expect(requestMock).not.toHaveBeenCalled();
    await rejectReturn(RETURN_ID, { reason: 'x'.repeat(300) });
    expect(requestMock).toHaveBeenCalledTimes(1);
  });
});

describe('refundReturnToWallet (BR-61, root CLAUDE.md 2.4)', () => {
  it('POSTs to /admin/returns/{id}/refund/wallet with the Idempotency-Key', async () => {
    await refundReturnToWallet(RETURN_ID, 'key-refund-1');
    expect(requestMock).toHaveBeenCalledWith(`/admin/returns/${RETURN_ID}/refund/wallet`, {
      method: 'POST',
      body: {},
      idempotencyKey: 'key-refund-1',
      timeoutMs: ADMIN_REQUEST_TIMEOUT_MS,
    });
  });

  it('refuses to send without a key (the server would 422)', async () => {
    await expect(refundReturnToWallet(RETURN_ID, '')).rejects.toThrow();
    expect(requestMock).not.toHaveBeenCalled();
  });

  it('BR-61d: a retry of the same refund sends the same Idempotency-Key header (useIdempotencyKey keyed on the return)', async () => {
    let n = 0;
    // What useIdempotencyKey() holds for the screen's lifetime, fed as the refund hook feeds it.
    const cache = createIdempotencyKeyCache(() => `key-${(n += 1)}`);
    const keyFor = (returnId: string) => cache.keyFor(bodyFingerprint(refundIdempotencyFingerprint(returnId)));
    await refundReturnToWallet(RETURN_ID, keyFor(RETURN_ID));
    requestMock.mockRejectedValueOnce(new NetworkError(new Error('dropped')));
    await refundReturnToWallet(RETURN_ID, keyFor(RETURN_ID)).catch(() => undefined);
    await refundReturnToWallet(RETURN_ID, keyFor(RETURN_ID));
    const sent = requestMock.mock.calls.map((call) => (call[1] as Record<string, unknown>)['idempotencyKey']);
    expect(sent).toEqual(['key-1', 'key-1', 'key-1']);
    // Every call is the same POST with an empty body: only the key ties them together.
    for (const call of requestMock.mock.calls) {
      expect(call[0]).toBe(`/admin/returns/${RETURN_ID}/refund/wallet`);
      expect(call[1]).toMatchObject({ method: 'POST', body: {} });
    }
  });

  it('two returns never share a refund key', () => {
    let n = 0;
    const cache = createIdempotencyKeyCache(() => `key-${(n += 1)}`);
    const keyFor = (returnId: string) => cache.keyFor(bodyFingerprint(refundIdempotencyFingerprint(returnId)));
    expect(keyFor(RETURN_ID)).toBe('key-1');
    expect(keyFor(OTHER_RETURN)).not.toBe('key-1');
  });

  it('BR-61: the bank refund (none for both warehouse roles) is not exported', () => {
    expect(Object.keys(returnsApi).some((name) => /bank/i.test(name))).toBe(false);
  });
});

describe('ERROR_CODES', () => {
  it('lists the codes the returns routes document, each with an admin message', () => {
    expect([...ERROR_CODES].sort()).toEqual(
      ['CONFLICT', 'FORBIDDEN', 'INTERNAL', 'INVALID_STATE_TRANSITION', 'NOT_FOUND', 'UNAUTHENTICATED', 'VALIDATION_FAILED'].sort(),
    );
    for (const code of ERROR_CODES) expect({ code, hasKey: hasKey(`admin.error.${code}`) }).toEqual({ code, hasKey: true });
  });
});
