/**
 * roles/admin/api/alerts.ts: the live warehouse alerts (docs/openapi.yaml
 * /admin/alerts) and the caller's own dismiss / snooze state on them (BR-78).
 * The shell client is mocked (same pattern as
 * roles/farmer/tests/admin_auth_api.test.ts).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../shell/api/client', () => ({
  request: vi.fn(async () => ({})),
}));

import { request } from '../../../shell/api/client';
import { ADMIN_REQUEST_TIMEOUT_MS } from '../api/http';
import { ERROR_CODES, dismissAlert, listAlerts, snoozeAlert } from '../api/alerts';

const requestMock = vi.mocked(request);

const WAREHOUSE = '11111111-1111-4111-8111-111111111111';
const BATCH_KEY = 'batch_near_expiry:6f0c6a53-9d1e-4f6e-8a55-1f6b2d0f5a11';
const LOW_KEY = `low_stock:${WAREHOUSE}:22222222-2222-4222-8222-222222222222:a`;

beforeEach(() => {
  vi.clearAllMocks();
});

function lastCall(): [string, Record<string, unknown>] {
  const call = requestMock.mock.calls.at(-1);
  if (call === undefined) throw new Error('request() was not called');
  return [call[0], call[1] as Record<string, unknown>];
}

describe('listAlerts', () => {
  it('GETs /admin/alerts with no query by default (the server lists active alerts)', async () => {
    await listAlerts();
    expect(requestMock).toHaveBeenCalledWith('/admin/alerts', { method: 'GET', timeoutMs: ADMIN_REQUEST_TIMEOUT_MS });
  });

  it('sends type, warehouseId, state, cursor and limit', async () => {
    await listAlerts({ type: 'LOW_STOCK', warehouseId: WAREHOUSE, state: 'snoozed', cursor: 'c-1', limit: 20 });
    expect(lastCall()[0]).toBe(
      `/admin/alerts?type=LOW_STOCK&warehouseId=${WAREHOUSE}&state=snoozed&cursor=c-1&limit=20`,
    );
  });

  it('BR-30: sends no warehouseId unless the caller passes its own', async () => {
    await listAlerts({ state: 'active' });
    expect(lastCall()[0]).toBe('/admin/alerts?state=active');
    expect(lastCall()[0]).not.toMatch(/warehouseId/);
  });

  it('passes the caller signal through', async () => {
    const controller = new AbortController();
    await listAlerts({}, controller.signal);
    expect(lastCall()[1]['signal']).toBe(controller.signal);
  });
});

describe('dismissAlert', () => {
  it('BR-78: dismisses exactly that itemKey: POST /admin/alerts/{itemKey}/dismiss with no body', async () => {
    await dismissAlert(BATCH_KEY);
    expect(requestMock).toHaveBeenCalledTimes(1);
    const [path, options] = lastCall();
    expect(path).toBe(`/admin/alerts/${encodeURIComponent(BATCH_KEY)}/dismiss`);
    expect(options['method']).toBe('POST');
    expect(options['body']).toBeUndefined();
  });

  it('BR-78: each alert is its own call; one dismissal never names another key', async () => {
    await dismissAlert(BATCH_KEY);
    await dismissAlert(LOW_KEY);
    expect(requestMock.mock.calls.map((c) => c[0])).toEqual([
      `/admin/alerts/${encodeURIComponent(BATCH_KEY)}/dismiss`,
      `/admin/alerts/${encodeURIComponent(LOW_KEY)}/dismiss`,
    ]);
  });

  it('encodes the key, so its colons and any slash stay one path segment', async () => {
    await dismissAlert('a/b:c');
    expect(lastCall()[0]).toBe('/admin/alerts/a%2Fb%3Ac/dismiss');
  });
});

describe('snoozeAlert', () => {
  it('BR-78: snoozes exactly that itemKey and sends the until instant verbatim', async () => {
    const until = '2026-10-12T16:30:00+05:30';
    await snoozeAlert(LOW_KEY, until);
    const [path, options] = lastCall();
    expect(path).toBe(`/admin/alerts/${encodeURIComponent(LOW_KEY)}/snooze`);
    expect(options['method']).toBe('POST');
    expect(options['body']).toEqual({ until });
  });

  it('BR-78: a Date is sent as an ISO instant (the server accepts any offset)', async () => {
    await snoozeAlert(BATCH_KEY, new Date('2026-10-12T11:00:00Z'));
    expect(lastCall()[1]['body']).toEqual({ until: '2026-10-12T11:00:00.000Z' });
  });

  it('BR-78: the body carries only `until` (the server schema is strict)', async () => {
    await snoozeAlert(BATCH_KEY, '2026-10-12T11:00:00Z');
    expect(Object.keys(lastCall()[1]['body'] as object)).toEqual(['until']);
  });

  it('BR-78: an until that is not a date is refused before any request', async () => {
    await expect(snoozeAlert(BATCH_KEY, 'tomorrow')).rejects.toThrow();
    await expect(snoozeAlert(BATCH_KEY, new Date('nope'))).rejects.toThrow();
    expect(requestMock).not.toHaveBeenCalled();
  });
});

describe('ERROR_CODES', () => {
  it('lists the problem codes these endpoints document', () => {
    expect(ERROR_CODES).toEqual(
      expect.arrayContaining(['UNAUTHENTICATED', 'FORBIDDEN', 'NOT_FOUND', 'VALIDATION_FAILED', 'INTERNAL']),
    );
  });
});
