/**
 * roles/admin/api/http.ts: the thin layer every admin API module calls.
 * The shell client is mocked (same pattern as
 * roles/farmer/tests/admin_auth_api.test.ts), so these tests pin exactly what
 * reaches `request()`: path + query string, method, body, the
 * Idempotency-Key, the caller's signal and the admin timeout.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../shell/api/client', () => ({
  request: vi.fn(async () => ({ ok: true })),
}));

import { request } from '../../../shell/api/client';
import { ADMIN_REQUEST_TIMEOUT_MS, adminGet, adminPatch, adminPost, adminPut } from '../api/http';

const requestMock = vi.mocked(request);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ADMIN_REQUEST_TIMEOUT_MS', () => {
  it('is a positive whole number of milliseconds', () => {
    expect(Number.isInteger(ADMIN_REQUEST_TIMEOUT_MS)).toBe(true);
    expect(ADMIN_REQUEST_TIMEOUT_MS).toBeGreaterThan(0);
  });
});

describe('adminGet', () => {
  it('GETs the path with the admin timeout and returns the response', async () => {
    await expect(adminGet('/admin/tasks/summary')).resolves.toEqual({ ok: true });
    expect(requestMock).toHaveBeenCalledWith('/admin/tasks/summary', {
      method: 'GET',
      timeoutMs: ADMIN_REQUEST_TIMEOUT_MS,
    });
  });

  it('appends the query, dropping undefined and null', async () => {
    await adminGet('/admin/orders', { status: 'PACKED', cursor: undefined, warehouseId: null, limit: 20 });
    expect(requestMock.mock.calls[0]?.[0]).toBe('/admin/orders?status=PACKED&limit=20');
  });

  it('BR-30: never adds a warehouseId the caller did not pass', async () => {
    await adminGet('/admin/orders', { limit: 20 });
    expect(requestMock.mock.calls[0]?.[0]).not.toMatch(/warehouseId/);
  });

  it('passes the caller signal alongside the timeout', async () => {
    const controller = new AbortController();
    await adminGet('/admin/orders', undefined, controller.signal);
    expect(requestMock).toHaveBeenCalledWith('/admin/orders', {
      method: 'GET',
      timeoutMs: ADMIN_REQUEST_TIMEOUT_MS,
      signal: controller.signal,
    });
  });

  it('propagates a failure unchanged', async () => {
    const err = new Error('boom');
    requestMock.mockRejectedValueOnce(err);
    await expect(adminGet('/admin/orders')).rejects.toBe(err);
  });
});

describe('adminPost', () => {
  it('POSTs the body with the Idempotency-Key and the admin timeout', async () => {
    await adminPost('/admin/wallet/cash-topups', { amount: '500.00' }, { idempotencyKey: 'k-1' });
    expect(requestMock).toHaveBeenCalledWith('/admin/wallet/cash-topups', {
      method: 'POST',
      body: { amount: '500.00' },
      idempotencyKey: 'k-1',
      timeoutMs: ADMIN_REQUEST_TIMEOUT_MS,
    });
  });

  it('sends no Idempotency-Key and no signal when none are given', async () => {
    await adminPost('/admin/alerts/a1/dismiss', {});
    const options = requestMock.mock.calls[0]?.[1];
    expect(options).toEqual({ method: 'POST', body: {}, timeoutMs: ADMIN_REQUEST_TIMEOUT_MS });
    expect(options && 'idempotencyKey' in options).toBe(false);
    expect(options && 'signal' in options).toBe(false);
  });

  it('passes the signal', async () => {
    const controller = new AbortController();
    await adminPost('/x', { a: 1 }, { idempotencyKey: 'k', signal: controller.signal });
    expect(requestMock.mock.calls[0]?.[1]).toMatchObject({ signal: controller.signal, idempotencyKey: 'k' });
  });
});

describe('adminPatch / adminPut', () => {
  it('PATCHes with the body and timeout', async () => {
    await adminPatch('/admin/notifications/n1', { read: true });
    expect(requestMock).toHaveBeenCalledWith('/admin/notifications/n1', {
      method: 'PATCH',
      body: { read: true },
      timeoutMs: ADMIN_REQUEST_TIMEOUT_MS,
    });
  });

  it('PUTs with the body, key and timeout', async () => {
    await adminPut('/me/notification-preferences', { items: [] }, { idempotencyKey: 'k-2' });
    expect(requestMock).toHaveBeenCalledWith('/me/notification-preferences', {
      method: 'PUT',
      body: { items: [] },
      idempotencyKey: 'k-2',
      timeoutMs: ADMIN_REQUEST_TIMEOUT_MS,
    });
  });
});
