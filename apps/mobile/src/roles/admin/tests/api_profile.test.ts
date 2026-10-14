/**
 * roles/admin/api/profile.ts (the signed-in admin's own account, notification
 * preferences and help) and the warehouse reads added to
 * roles/admin/api/warehouses.ts (plan phase 8). The shell client is mocked
 * (same pattern as roles/farmer/tests/admin_auth_api.test.ts), so these tests
 * pin exactly what goes on the wire.
 *
 * BR-82 / BR-33: the own-profile edit sends ONLY fullName and preferredLocale.
 * mobile and email are locked identity fields (403 FIELD_LOCKED and nothing is
 * applied), so the module never sends either, whatever a caller passes.
 * BR-67: the session list is the caller's own, from the token; no user id is
 * ever sent. BR-82: the 14 admin notification categories, one PATCH each.
 * BR-66 / BR-30: a warehouse is read by its uuid; a Sub admin's screens only
 * ever ask for scope.warehouseId (profileWarehouseId pins it).
 *
 * None of these routes declares an Idempotency-Key in docs/openapi.yaml (they
 * move no money; the PATCHes are idempotent by value), so none is sent.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as ClientModule from '../../../shell/api/client';

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return {
    ...actual,
    request: vi.fn(async () => ({})),
  };
});

import { ApiError, request } from '../../../shell/api/client';
import { adminErrorKey } from '../api/errors';
import { ADMIN_REQUEST_TIMEOUT_MS } from '../api/http';
import {
  ADMIN_NOTIFICATION_CATEGORIES,
  ERROR_CODES,
  PasswordPolicyError,
  changeOwnPassword,
  getAdminHelp,
  getMe,
  listAdminNotificationPreferences,
  listMySessions,
  updateAdminNotificationPreference,
  updateMe,
} from '../api/profile';
import { ERROR_CODES as WAREHOUSE_ERROR_CODES, getWarehouse, getWarehouseCapacity, listStorageLocations } from '../api/warehouses';
import { hasKey } from '../i18n';
import { profileWarehouseId } from '../screens/warehouse/profile-settings/mappers';

const requestMock = vi.mocked(request);

const OWN = '3f1b7c2e-2a44-4f0e-9b1a-6b0d2f0f1a01';
const FOREIGN = '99999999-9999-4999-8999-999999999999';
const GET = { method: 'GET', timeoutMs: ADMIN_REQUEST_TIMEOUT_MS };

beforeEach(() => {
  vi.clearAllMocks();
});

function lastCall(): [string, Record<string, unknown>] {
  const call = requestMock.mock.calls.at(-1);
  if (call === undefined) throw new Error('request() was not called');
  return [call[0], call[1] as Record<string, unknown>];
}

describe('getMe / listMySessions', () => {
  it('GETs /auth/me', async () => {
    await getMe();
    expect(requestMock).toHaveBeenCalledWith('/auth/me', GET);
  });

  it('BR-67: GETs /auth/me/sessions and sends no user id (the owner comes from the token)', async () => {
    await listMySessions();
    expect(requestMock).toHaveBeenCalledWith('/auth/me/sessions', GET);
  });

  it('passes the caller signal through', async () => {
    const controller = new AbortController();
    await getMe(controller.signal);
    expect(lastCall()[1]['signal']).toBe(controller.signal);
  });
});

describe('updateMe (BR-82, BR-33)', () => {
  it('PATCHes /auth/me with fullName and preferredLocale only', async () => {
    await updateMe({ fullName: 'Suresh Kumar', preferredLocale: 'ta' });
    expect(requestMock).toHaveBeenCalledWith('/auth/me', {
      method: 'PATCH',
      body: { fullName: 'Suresh Kumar', preferredLocale: 'ta' },
      timeoutMs: ADMIN_REQUEST_TIMEOUT_MS,
    });
  });

  it('sends only the field given (a language change alone)', async () => {
    await updateMe({ preferredLocale: 'en' });
    expect(lastCall()[1]['body']).toEqual({ preferredLocale: 'en' });
  });

  it('BR-33: never sends mobile, email or any other key, even when a caller passes them', async () => {
    const leaky = {
      fullName: 'Suresh',
      mobile: '+919800000099',
      email: 'x@example.com',
      status: 'ACTIVE',
      roles: ['SUPER_ADMIN'],
    } as unknown as Parameters<typeof updateMe>[0];
    await updateMe(leaky);
    expect(lastCall()[1]['body']).toEqual({ fullName: 'Suresh' });
  });

  it('BR-82: a FIELD_LOCKED answer maps to its admin message', async () => {
    requestMock.mockRejectedValueOnce(new ApiError({ type: 'about:blank', title: 'Locked', status: 403, code: 'FIELD_LOCKED' }));
    const error = await updateMe({ fullName: 'Suresh' }).catch((e: unknown) => e);
    expect(adminErrorKey(error)).toBe('admin.error.FIELD_LOCKED');
  });
});

describe('changeOwnPassword', () => {
  it('POSTs {currentPassword, newPassword} to /auth/me/change-password', async () => {
    requestMock.mockResolvedValueOnce(undefined);
    await changeOwnPassword({ currentPassword: 'Password@123', newPassword: 'NewPassword@456' });
    expect(requestMock).toHaveBeenCalledWith('/auth/me/change-password', {
      method: 'POST',
      body: { currentPassword: 'Password@123', newPassword: 'NewPassword@456' },
      timeoutMs: ADMIN_REQUEST_TIMEOUT_MS,
    });
  });

  it('refuses a new password outside the spec bounds (10..128) before any request', async () => {
    for (const newPassword of ['', 'short', '123456789', 'x'.repeat(129)]) {
      await expect(changeOwnPassword({ currentPassword: 'Password@123', newPassword })).rejects.toBeInstanceOf(PasswordPolicyError);
    }
    await expect(changeOwnPassword({ currentPassword: '', newPassword: 'NewPassword@456' })).rejects.toBeInstanceOf(PasswordPolicyError);
    expect(requestMock).not.toHaveBeenCalled();
  });

  it('accepts exactly 10 and exactly 128 characters', async () => {
    await changeOwnPassword({ currentPassword: 'a', newPassword: 'x'.repeat(10) });
    await changeOwnPassword({ currentPassword: 'a', newPassword: 'x'.repeat(128) });
    expect(requestMock).toHaveBeenCalledTimes(2);
  });

  it('sends the passwords exactly as typed (no trimming)', async () => {
    await changeOwnPassword({ currentPassword: ' old pass ', newPassword: ' new password ' });
    expect(lastCall()[1]['body']).toEqual({ currentPassword: ' old pass ', newPassword: ' new password ' });
  });
});

describe('admin notification preferences (BR-82)', () => {
  it('BR-82: the 14 categories, in screen order', () => {
    expect(ADMIN_NOTIFICATION_CATEGORIES).toEqual([
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
  });

  it('GETs /notification-preferences/admin', async () => {
    await listAdminNotificationPreferences();
    expect(requestMock).toHaveBeenCalledWith('/notification-preferences/admin', GET);
  });

  it('PATCHes /notification-preferences/admin/{category} with {enabled}', async () => {
    await updateAdminNotificationPreference('ORDER_DISPATCHED', false);
    expect(requestMock).toHaveBeenCalledWith('/notification-preferences/admin/ORDER_DISPATCHED', {
      method: 'PATCH',
      body: { enabled: false },
      timeoutMs: ADMIN_REQUEST_TIMEOUT_MS,
    });
  });

  it('BR-82: refuses a category outside the 14 (including the five farmer ones) before any request', async () => {
    for (const category of ['ORDERS', 'PAYMENTS', 'order_dispatched', '../admin', '']) {
      await expect(updateAdminNotificationPreference(category as 'IN_APP_MASTER', true)).rejects.toThrow();
    }
    expect(requestMock).not.toHaveBeenCalled();
  });
});

describe('getAdminHelp (BR-82)', () => {
  it('GETs /admin/help with the locale, and a category only when given', async () => {
    await getAdminHelp({ locale: 'en' });
    expect(lastCall()[0]).toBe('/admin/help?locale=en');
    await getAdminHelp({ locale: 'ta', category: 'Orders & Returns' });
    expect(lastCall()[0]).toBe('/admin/help?locale=ta&category=Orders%20%26%20Returns');
  });
});

describe('warehouse reads (BR-66, BR-30)', () => {
  it('getWarehouse GETs /warehouses/{id}, encoded as one segment', async () => {
    await getWarehouse(OWN);
    expect(requestMock).toHaveBeenCalledWith(`/warehouses/${OWN}`, GET);
    await getWarehouse('a/b');
    expect(lastCall()[0]).toBe('/warehouses/a%2Fb');
  });

  it('getWarehouseCapacity GETs /warehouses/{id}/capacity', async () => {
    await getWarehouseCapacity(OWN);
    expect(requestMock).toHaveBeenCalledWith(`/warehouses/${OWN}/capacity`, GET);
  });

  it('listStorageLocations pages by page/pageSize (OffsetPage), not by cursor', async () => {
    await listStorageLocations(OWN, { page: 2, pageSize: 20, isActive: true, q: 'cold' });
    expect(lastCall()[0]).toBe(`/warehouses/${OWN}/storage-locations?q=cold&isActive=true&page=2&pageSize=20`);
  });

  it('BR-30: a Sub scope always reads its own warehouse uuid, whatever was selected', () => {
    const sub = { warehouseId: OWN, warehouseName: 'Coonoor', warehouseCode: 'WH-COON' };
    expect(profileWarehouseId(sub, FOREIGN)).toBe(OWN);
    expect(profileWarehouseId(sub, undefined)).toBe(OWN);
  });

  it('BR-30: a Main scope reads its pick only when it is a warehouse uuid (a sample code is not)', () => {
    const main = {};
    expect(profileWarehouseId(main, FOREIGN)).toBe(FOREIGN);
    expect(profileWarehouseId(main, 'WH-COON')).toBeUndefined();
    expect(profileWarehouseId(main, undefined)).toBeUndefined();
  });

  it('BR-66: another warehouse is 404 NOT_FOUND (never 403) and reads as not found', async () => {
    requestMock.mockRejectedValueOnce(new ApiError({ type: 'about:blank', title: 'Not Found', status: 404, code: 'NOT_FOUND' }));
    const error = await getWarehouse(FOREIGN).catch((e: unknown) => e);
    expect(adminErrorKey(error)).toBe('admin.error.NOT_FOUND');
  });
});

describe('ERROR_CODES', () => {
  it('profile: the codes its routes document, each with an admin message', () => {
    expect([...ERROR_CODES].sort()).toEqual(
      ['BAD_REQUEST', 'FIELD_LOCKED', 'FORBIDDEN', 'INTERNAL', 'RATE_LIMITED', 'UNAUTHENTICATED', 'VALIDATION_FAILED'].sort(),
    );
    for (const code of ERROR_CODES) expect({ code, hasKey: hasKey(`admin.error.${code}`) }).toEqual({ code, hasKey: true });
  });

  it('warehouses: the codes its read routes document, each with an admin message', () => {
    expect([...WAREHOUSE_ERROR_CODES].sort()).toEqual(['FORBIDDEN', 'INTERNAL', 'NOT_FOUND', 'UNAUTHENTICATED', 'VALIDATION_FAILED'].sort());
    for (const code of WAREHOUSE_ERROR_CODES) expect({ code, hasKey: hasKey(`admin.error.${code}`) }).toEqual({ code, hasKey: true });
  });
});
