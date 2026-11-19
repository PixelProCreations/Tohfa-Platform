/**
 * roles/admin/api/payouts.ts (docs/openapi.yaml tag "Payouts & Invoices"):
 *   GET  /admin/payouts               payout.view                (BR-72)
 *   POST /admin/payouts/{id}/approve  payout.approve_above_10k   (BR-31, BR-72; Idempotency-Key)
 *
 * The shell client is mocked (same pattern as api_finance.test.ts).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as ClientModule from '../../../shell/api/client';

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return { ...actual, request: vi.fn(async () => ({})) };
});

import { request } from '../../../shell/api/client';
import { approvePayout, listPayouts, PAYOUT_AWAITING_STATUS, payoutApproveFingerprint } from '../api/payouts';

const PAYOUT = '3c4d5e6f-7081-4923-8a45-6b7c8d9e0f12';

function lastCall(): [string, { method: string; idempotencyKey?: string; body?: unknown }] {
  const calls = vi.mocked(request).mock.calls;
  return calls[calls.length - 1] as unknown as [string, { method: string; idempotencyKey?: string; body?: unknown }];
}

beforeEach(() => {
  vi.mocked(request).mockClear();
});

describe('payouts API', () => {
  it('BR-31/BR-72: approvePayout sends POST /admin/payouts/{id}/approve with the Idempotency-Key', async () => {
    await approvePayout(PAYOUT, { note: 'checked' }, 'key-1');
    const [path, init] = lastCall();
    expect(path).toBe(`/admin/payouts/${PAYOUT}/approve`);
    expect(init.method).toBe('POST');
    expect(init.idempotencyKey).toBe('key-1');
    expect(init.body).toEqual({ note: 'checked' });
  });

  it('listPayouts reads GET /admin/payouts filtered to the payouts awaiting approval', async () => {
    await listPayouts({ status: PAYOUT_AWAITING_STATUS, limit: 1 });
    const [path, init] = lastCall();
    expect(path).toBe('/admin/payouts?status=PENDING_APPROVAL&limit=1');
    expect(init.method).toBe('GET');
  });

  it('BR-72: the key fingerprint differs per payout and per note, so one payout never replays another key', () => {
    const a = payoutApproveFingerprint('p-1', {});
    expect(payoutApproveFingerprint('p-1', {})).toBe(a);
    expect(payoutApproveFingerprint('p-2', {})).not.toBe(a);
    expect(payoutApproveFingerprint('p-1', { note: 'x' })).not.toBe(a);
  });
});
