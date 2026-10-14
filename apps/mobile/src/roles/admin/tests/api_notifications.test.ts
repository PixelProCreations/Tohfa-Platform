/**
 * roles/admin/api/notifications.ts: the signed-in admin's own notifications
 * and the system messages visible to them (docs/openapi.yaml /notifications,
 * /system-messages). The shell client is mocked (same pattern as
 * roles/farmer/tests/admin_auth_api.test.ts), so these tests pin exactly what
 * reaches `request()`: path, query string, method and body.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../shell/api/client', () => ({
  request: vi.fn(async () => ({})),
}));

import { request } from '../../../shell/api/client';
import { ADMIN_REQUEST_TIMEOUT_MS } from '../api/http';
import {
  ERROR_CODES,
  listNotifications,
  listSystemMessages,
  markAllNotificationsRead,
  markNotificationRead,
  markSystemMessageRead,
  type NotificationList,
} from '../api/notifications';

const requestMock = vi.mocked(request);

const ID = '6f0c6a53-9d1e-4f6e-8a55-1f6b2d0f5a11';
const OTHER_ID = '0b7d9c4e-2a1f-4c3b-9e8d-7a6b5c4d3e2f';

beforeEach(() => {
  vi.clearAllMocks();
});

function lastCall(): [string, Record<string, unknown>] {
  const call = requestMock.mock.calls.at(-1);
  if (call === undefined) throw new Error('request() was not called');
  return [call[0], call[1] as Record<string, unknown>];
}

describe('listNotifications', () => {
  it('GETs /notifications with no query by default', async () => {
    await listNotifications();
    expect(requestMock).toHaveBeenCalledWith('/notifications', { method: 'GET', timeoutMs: ADMIN_REQUEST_TIMEOUT_MS });
  });

  it('sends cursor, limit and unreadOnly=true', async () => {
    await listNotifications({ cursor: 'c-2', limit: 20, unreadOnly: true });
    expect(lastCall()[0]).toBe('/notifications?cursor=c-2&limit=20&unreadOnly=true');
  });

  it('does not send unreadOnly when it is false (the server default)', async () => {
    await listNotifications({ unreadOnly: false });
    expect(lastCall()[0]).toBe('/notifications');
  });

  it('returns the page with its unreadCount unchanged', async () => {
    const page: NotificationList = {
      items: [],
      page: { nextCursor: null, hasMore: false },
      unreadCount: 3,
    };
    requestMock.mockResolvedValueOnce(page);
    await expect(listNotifications()).resolves.toEqual(page);
  });

  it('passes the caller signal through', async () => {
    const controller = new AbortController();
    await listNotifications({}, controller.signal);
    expect(lastCall()[1]['signal']).toBe(controller.signal);
  });

  it('BR-30: a list of own notifications never carries a warehouseId', async () => {
    await listNotifications({ cursor: 'c', limit: 5, unreadOnly: true });
    expect(lastCall()[0]).not.toMatch(/warehouseId/);
  });
});

describe('markNotificationRead', () => {
  it('BR-65: marks only that id read: POST /notifications/{id}/read with no body', async () => {
    await markNotificationRead(ID);
    expect(requestMock).toHaveBeenCalledTimes(1);
    const [path, options] = lastCall();
    expect(path).toBe(`/notifications/${ID}/read`);
    expect(options['method']).toBe('POST');
    expect(options['body']).toBeUndefined();
    expect(path).not.toContain(OTHER_ID);
  });

  it('BR-65: two reads are two calls, each naming its own id', async () => {
    await markNotificationRead(ID);
    await markNotificationRead(OTHER_ID);
    expect(requestMock.mock.calls.map((c) => c[0])).toEqual([
      `/notifications/${ID}/read`,
      `/notifications/${OTHER_ID}/read`,
    ]);
  });

  it('encodes the id so it can never change the path', async () => {
    await markNotificationRead('a/b?c');
    expect(lastCall()[0]).toBe('/notifications/a%2Fb%3Fc/read');
  });

  it('sends no Idempotency-Key (a read mark moves no money and replays as a no-op)', async () => {
    await markNotificationRead(ID);
    expect(lastCall()[1]).not.toHaveProperty('idempotencyKey');
  });
});

describe('markAllNotificationsRead', () => {
  it('BR-65: POSTs /notifications/read-all and sends no ids', async () => {
    requestMock.mockResolvedValueOnce({ updated: 2 });
    await expect(markAllNotificationsRead()).resolves.toEqual({ updated: 2 });
    const [path, options] = lastCall();
    expect(path).toBe('/notifications/read-all');
    expect(options['method']).toBe('POST');
    expect(options['body']).toBeUndefined();
  });
});

describe('listSystemMessages', () => {
  it('GETs /system-messages with no query by default', async () => {
    await listSystemMessages();
    expect(lastCall()[0]).toBe('/system-messages');
    expect(lastCall()[1]['method']).toBe('GET');
  });

  it('sends cursor, limit and status', async () => {
    await listSystemMessages({ cursor: 'c-1', limit: 10, status: 'read' });
    expect(lastCall()[0]).toBe('/system-messages?cursor=c-1&limit=10&status=read');
  });
});

describe('markSystemMessageRead', () => {
  it('BR-65: marks only that message read: POST /system-messages/{id}/read with no body', async () => {
    await markSystemMessageRead(ID);
    const [path, options] = lastCall();
    expect(path).toBe(`/system-messages/${ID}/read`);
    expect(options['method']).toBe('POST');
    expect(options['body']).toBeUndefined();
  });
});

describe('ERROR_CODES', () => {
  it('lists the problem codes these endpoints document', () => {
    expect(ERROR_CODES).toEqual(expect.arrayContaining(['UNAUTHENTICATED', 'NOT_FOUND', 'VALIDATION_FAILED', 'INTERNAL']));
  });
});
