import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../shell/api/client')>();
  return { ...actual, request: vi.fn() };
});

import { request } from '../../../shell/api/client';
import { AdminTimeoutError, adminGet, adminPatch, adminPost, adminPut } from '../api/http';

const requestMock = vi.mocked(request);

beforeEach(() => {
  requestMock.mockReset();
  requestMock.mockResolvedValue({ ok: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('admin http wrappers', () => {
  it('adminGet appends the query string and passes an abort signal', async () => {
    await adminGet('/admin/returns', { query: { status: 'PENDING', cursor: undefined, limit: 20 } });
    expect(requestMock).toHaveBeenCalledTimes(1);
    const [path, opts] = requestMock.mock.calls[0]!;
    expect(path).toBe('/admin/returns?status=PENDING&limit=20');
    expect(opts?.method).toBe('GET');
    expect(opts?.signal).toBeInstanceOf(AbortSignal);
    expect(opts?.idempotencyKey).toBeUndefined();
  });

  it('BR-62a: adminPost forwards the Idempotency-Key and body unchanged', async () => {
    const body = { amount: '5000.00', warehouseId: 'w1', fiscalCashTag: 'T-1' };
    await adminPost('/admin/wallets/c1/cash-topup', body, { idempotencyKey: 'k-1' });
    const [path, opts] = requestMock.mock.calls[0]!;
    expect(path).toBe('/admin/wallets/c1/cash-topup');
    expect(opts?.method).toBe('POST');
    expect(opts?.body).toEqual(body);
    expect(opts?.idempotencyKey).toBe('k-1');
  });

  it('adminPatch and adminPut use the right verbs and may carry a key', async () => {
    await adminPatch('/auth/me', { fullName: 'A' });
    await adminPut('/x/1', { a: 1 }, { idempotencyKey: 'k-2' });
    expect(requestMock.mock.calls[0]![1]?.method).toBe('PATCH');
    expect(requestMock.mock.calls[0]![1]?.idempotencyKey).toBeUndefined();
    expect(requestMock.mock.calls[1]![1]?.method).toBe('PUT');
    expect(requestMock.mock.calls[1]![1]?.idempotencyKey).toBe('k-2');
  });

  it('aborts and throws AdminTimeoutError when the request outlives the timeout', async () => {
    vi.useFakeTimers();
    requestMock.mockImplementation(
      (_path, opts) =>
        new Promise((_resolve, reject) => {
          opts?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    const pending = adminGet('/admin/returns', { timeoutMs: 1000 });
    const assertion = expect(pending).rejects.toBeInstanceOf(AdminTimeoutError);
    await vi.advanceTimersByTimeAsync(1001);
    await assertion;
  });

  it('propagates an abort from the caller (React Query cancellation) without calling it a timeout', async () => {
    const controller = new AbortController();
    requestMock.mockImplementation(
      (_path, opts) =>
        new Promise((_resolve, reject) => {
          opts?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    const pending = adminGet('/admin/returns', { signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toThrow('aborted');
    await expect(pending).rejects.not.toBeInstanceOf(AdminTimeoutError);
  });
});
