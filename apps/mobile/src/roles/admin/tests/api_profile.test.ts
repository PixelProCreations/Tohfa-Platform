import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type * as ClientModule from '../../../shell/api/client';

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return { ...actual, request: vi.fn() };
});

import {
  ApiError,
  configureTokenStorage,
  getAccessToken,
  request,
  setAccessToken,
} from '../../../shell/api/client';
import { adminErrorKey } from '../api/errors';
import {
  ERROR_CODES as PROFILE_ERROR_CODES,
  LOCALES,
  changePassword,
  getMe,
  listMySessions,
  updateMe,
} from '../api/profile';
import {
  ADMIN_NOTIFICATION_CATEGORIES,
  ERROR_CODES as PREF_ERROR_CODES,
  listAdminNotificationPreferences,
  setAdminNotificationPreference,
} from '../api/notificationPreferences';
import { ERROR_CODES as HELP_ERROR_CODES, getAdminHelp } from '../api/help';

const requestMock = vi.mocked(request);

const openapi = fs.readFileSync(
  path.resolve(__dirname, '../../../../../../docs/openapi.yaml'),
  'utf8',
);

function problem(code: string, status: number): ApiError {
  return new ApiError({ type: 'about:blank', title: code, status, code } as never);
}

beforeEach(() => {
  requestMock.mockReset();
  requestMock.mockResolvedValue({});
  setAccessToken(null);
  configureTokenStorage(null);
});

describe('api/profile — GET/PATCH /auth/me', () => {
  it('getMe GETs exactly /auth/me', async () => {
    await getMe();
    const [p, opts] = requestMock.mock.calls[0]!;
    expect(p).toBe('/auth/me');
    expect(opts?.method).toBe('GET');
  });

  it('BR-82: updateMe PATCHes /auth/me with only fullName and preferredLocale', async () => {
    await updateMe({ fullName: 'Suresh Kumar', preferredLocale: 'ta' });
    const [p, opts] = requestMock.mock.calls[0]!;
    expect(p).toBe('/auth/me');
    expect(opts?.method).toBe('PATCH');
    expect(opts?.body).toEqual({ fullName: 'Suresh Kumar', preferredLocale: 'ta' });
  });

  it('BR-82: updateMe never sends the locked mobile/email (BR-33) or any other key, even if smuggled', async () => {
    const smuggled = {
      fullName: 'A Name',
      mobile: '+919800000000',
      email: 'x@example.com',
      status: 'ACTIVE',
      roles: ['SUPER_ADMIN'],
    } as never;
    await updateMe(smuggled);
    expect(requestMock.mock.calls[0]![1]?.body).toEqual({ fullName: 'A Name' });
  });

  it('BR-82: updateMe sends one field alone without padding the other', async () => {
    await updateMe({ preferredLocale: 'en' });
    expect(requestMock.mock.calls[0]![1]?.body).toEqual({ preferredLocale: 'en' });
  });

  it('BR-82: a FIELD_LOCKED answer maps to its own message key', async () => {
    requestMock.mockRejectedValue(problem('FIELD_LOCKED', 403));
    const error = await updateMe({ fullName: 'Name' }).catch((e: unknown) => e);
    expect(adminErrorKey(error)).toBe('admin.errors.FIELD_LOCKED');
  });

  it('LOCALES mirror the OpenAPI Locale enum', () => {
    expect([...LOCALES]).toEqual(['en', 'ta']);
    expect(openapi).toContain('enum: [en, ta]');
  });
});

describe('api/profile — GET /auth/me/sessions', () => {
  it('BR-67: listMySessions GETs /auth/me/sessions with no user id or query (owner = token)', async () => {
    requestMock.mockResolvedValue([]);
    await listMySessions();
    const [p, opts] = requestMock.mock.calls[0]!;
    expect(p).toBe('/auth/me/sessions');
    expect(opts?.method).toBe('GET');
  });

  it('BR-67: the response is a bare array (not a page envelope) and passes through', async () => {
    const row = {
      id: '0b8f6d1e-1111-4222-8333-944455556666',
      platform: 'android',
      userAgent: 'okhttp/4',
      issuedAt: '2026-10-12T04:00:00.000Z',
      lastSeenAt: null,
      lastSeenIp: null,
      expiresAt: '2026-11-11T04:00:00.000Z',
    };
    requestMock.mockResolvedValue([row]);
    await expect(listMySessions()).resolves.toEqual([row]);
  });
});

describe('api/profile — POST /auth/me/change-password', () => {
  it('posts exactly { currentPassword, newPassword } and nothing else', async () => {
    requestMock.mockResolvedValue(undefined);
    const smuggled = { currentPassword: 'old', newPassword: 'new', confirm: 'new' } as never;
    await changePassword(smuggled);
    const [p, opts] = requestMock.mock.calls[0]!;
    expect(p).toBe('/auth/me/change-password');
    expect(opts?.method).toBe('POST');
    expect(opts?.body).toEqual({ currentPassword: 'old', newPassword: 'new' });
    // Not a money-moving write and the spec declares no Idempotency-Key here.
    expect(opts?.idempotencyKey).toBeUndefined();
  });

  it('on success clears this device\'s tokens: the server has ended every session', async () => {
    const clearTokens = vi.fn(async () => undefined);
    configureTokenStorage({ getTokens: async () => null, setTokens: async () => undefined, clearTokens });
    setAccessToken('access-1');
    requestMock.mockResolvedValue(undefined);

    await changePassword({ currentPassword: 'old', newPassword: 'new' });

    expect(getAccessToken()).toBeNull();
    expect(clearTokens).toHaveBeenCalledTimes(1);
  });

  it('on failure keeps the tokens — the old password (and session) is still active', async () => {
    const clearTokens = vi.fn(async () => undefined);
    configureTokenStorage({ getTokens: async () => null, setTokens: async () => undefined, clearTokens });
    setAccessToken('access-1');
    requestMock.mockRejectedValue(problem('UNAUTHENTICATED', 401));

    await expect(changePassword({ currentPassword: 'bad', newPassword: 'new' })).rejects.toBeInstanceOf(
      ApiError,
    );
    expect(getAccessToken()).toBe('access-1');
    expect(clearTokens).not.toHaveBeenCalled();
  });
});

describe('api/notificationPreferences — admin categories', () => {
  it('BR-82: exactly the 14 admin categories, in screen order, matching the OpenAPI enum', () => {
    expect([...ADMIN_NOTIFICATION_CATEGORIES]).toEqual([
      'IN_APP_MASTER',
      'GOODS_RECEIVING',
      'INVENTORY_ALERTS',
      'WAREHOUSE_OPERATIONS',
      'TASK_ALERTS',
      'EXCEPTION_ALERTS',
      'ORDER_CONFIRMED',
      'ORDER_DISPATCHED',
      'ORDER_DELIVERED',
      'WALLET_CREDITED',
      'PAYOUT_RELEASED',
      'SYSTEM_MESSAGES',
      'MAINTENANCE_MESSAGES',
      'SECURITY_ALERTS',
    ]);
    const start = openapi.indexOf('\n    AdminNotificationCategory:');
    const block = openapi.slice(start, openapi.indexOf('\n    AdminNotificationPreference:', start));
    const specEnum = [...block.matchAll(/^\s+- ([A-Z_]+)$/gm)].map((m) => m[1]);
    expect(specEnum).toEqual([...ADMIN_NOTIFICATION_CATEGORIES]);
  });

  it('BR-82: lists via GET /notification-preferences/admin', async () => {
    requestMock.mockResolvedValue({ items: [] });
    await listAdminNotificationPreferences();
    const [p, opts] = requestMock.mock.calls[0]!;
    expect(p).toBe('/notification-preferences/admin');
    expect(opts?.method).toBe('GET');
  });

  it('BR-82: sets one category via PATCH /notification-preferences/admin/{category} with { enabled } only', async () => {
    await setAdminNotificationPreference('GOODS_RECEIVING', false);
    const [p, opts] = requestMock.mock.calls[0]!;
    expect(p).toBe('/notification-preferences/admin/GOODS_RECEIVING');
    expect(opts?.method).toBe('PATCH');
    expect(opts?.body).toEqual({ enabled: false });
  });

  it('encodes the category so it cannot change the path', async () => {
    await setAdminNotificationPreference('a/../b' as never, true);
    expect(requestMock.mock.calls[0]![0]).toBe('/notification-preferences/admin/a%2F..%2Fb');
  });
});

describe('api/help — GET /admin/help', () => {
  it('BR-82: sends only locale and category', async () => {
    requestMock.mockResolvedValue({ items: [], categories: [], contact: { phone: null, email: null } });
    await getAdminHelp({ locale: 'ta', category: 'Orders & billing', extra: 'x' } as never);
    const [p, opts] = requestMock.mock.calls[0]!;
    expect(p).toBe('/admin/help?locale=ta&category=Orders%20%26%20billing');
    expect(opts?.method).toBe('GET');
  });

  it('omits unset filters (server default locale applies)', async () => {
    requestMock.mockResolvedValue({ items: [], categories: [], contact: { phone: null, email: null } });
    await getAdminHelp({});
    expect(requestMock.mock.calls[0]![0]).toBe('/admin/help');
  });
});

describe('error codes these endpoints answer with (docs/openapi.yaml responses)', () => {
  it('profile / sessions / change-password', () => {
    expect([...PROFILE_ERROR_CODES].sort()).toEqual(
      ['BAD_REQUEST', 'FIELD_LOCKED', 'FORBIDDEN', 'INTERNAL', 'RATE_LIMITED', 'UNAUTHENTICATED', 'VALIDATION_FAILED'].sort(),
    );
  });

  it('notification preferences and help', () => {
    expect([...PREF_ERROR_CODES].sort()).toEqual(
      ['FORBIDDEN', 'INTERNAL', 'UNAUTHENTICATED', 'VALIDATION_FAILED'].sort(),
    );
    expect([...HELP_ERROR_CODES].sort()).toEqual(
      ['FORBIDDEN', 'INTERNAL', 'UNAUTHENTICATED', 'VALIDATION_FAILED'].sort(),
    );
  });
});
