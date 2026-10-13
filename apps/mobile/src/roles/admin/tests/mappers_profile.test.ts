import { describe, expect, it } from 'vitest';
import { ApiError } from '../../../shell/api/client';
import type { CurrentUserDto, MySessionDto } from '../api/profile';
import { ADMIN_NOTIFICATION_CATEGORIES } from '../api/notificationPreferences';
import { isTranslationKey } from '../i18n';
import {
  PROFILE_STATUSES,
  SESSION_PLATFORMS,
  adminRoleLabelKey,
  buildProfilePatch,
  changePasswordErrorKey,
  groupAdminPreferences,
  isPasswordFormValid,
  profileStatusMeta,
  sessionPlatformLabelKey,
  toHelpModel,
  toProfile,
  toSessionRow,
  validatePasswordForm,
} from '../screens/warehouse/profile/mappers';

const me: CurrentUserDto = {
  id: '2a9f0d1b-7c3e-4a55-9f0b-1e2d3c4b5a60',
  fullName: 'Anand Kumar',
  mobile: '+919812345678',
  email: null,
  userType: 'admin',
  preferredLocale: 'ta',
  status: 'ACTIVE',
  createdAt: '2026-09-01T09:30:00.000Z',
  lastLoginAt: null,
  roles: [{ code: 'SUB_WH_ADMIN', warehouseId: '3f1b7c2e-2a44-4f0e-9b1a-6b0d2f0f1a01', warehouseName: 'Coonoor' }],
  permissions: ['auth.profile.edit_own'],
};

const session: MySessionDto = {
  id: '0b8f6d1e-1111-4222-8333-944455556666',
  platform: 'android',
  userAgent: 'okhttp/4.12',
  issuedAt: '2026-10-12T04:00:00.000Z',
  lastSeenAt: '2026-10-13T06:30:00.000Z',
  lastSeenIp: '10.0.0.7',
  expiresAt: '2026-11-11T04:00:00.000Z',
};

describe('profile mappers — own profile (BR-82)', () => {
  it('maps an allow-list only: no roles, permissions or ids reach the screen model', () => {
    const model = toProfile(me);
    expect(Object.keys(model).sort()).toEqual(
      [
        'createdAtLabel',
        'email',
        'fullName',
        'lastLoginAtLabel',
        'localeLabelKey',
        'mobile',
        'preferredLocale',
        'status',
      ].sort(),
    );
    expect(model.fullName).toBe('Anand Kumar');
    expect(model.mobile).toBe('+919812345678');
    expect(model.email).toBeNull();
    expect(model.preferredLocale).toBe('ta');
    expect(model.createdAtLabel).toBe('01/09/2026 15:00');
  });

  it('BR-67: a never-logged-in user has lastLoginAt null and shows no invented time', () => {
    expect(toProfile(me).lastLoginAtLabel).toBeNull();
    expect(toProfile({ ...me, lastLoginAt: '2026-10-08T06:15:00.000Z' }).lastLoginAtLabel).toBe(
      '08/10/2026 11:45',
    );
  });

  it('an unknown locale is not guessed', () => {
    const model = toProfile({ ...me, preferredLocale: 'fr' as never });
    expect(model.preferredLocale).toBeNull();
    expect(isTranslationKey(model.localeLabelKey)).toBe(true);
  });

  it('every account status has a real catalogue key, and unknown falls back', () => {
    for (const status of PROFILE_STATUSES) {
      expect(isTranslationKey(profileStatusMeta(status).labelKey)).toBe(true);
    }
    expect(profileStatusMeta('SOMETHING_NEW').labelKey).toBe('admin.profile.status.unknown');
  });
  it('every admin role has a real catalogue key, and unknown falls back', () => {
    for (const code of ['SUPER_ADMIN', 'TOHFA_ADMIN', 'FARMER_ADMIN', 'MAIN_WH_ADMIN', 'SUB_WH_ADMIN']) {
      expect(isTranslationKey(adminRoleLabelKey(code))).toBe(true);
    }
    expect(adminRoleLabelKey('FARMER')).toBe('admin.profile.role.unknown');
  });
});

describe('profile mappers — edit patch (BR-82)', () => {
  const original = { fullName: 'Anand Kumar', preferredLocale: 'ta' as const };

  it('BR-82: sends only the fields that changed, name trimmed', () => {
    expect(buildProfilePatch(original, { fullName: '  Anand K  ', preferredLocale: 'ta' })).toEqual({
      fullName: 'Anand K',
    });
    expect(buildProfilePatch(original, { fullName: 'Anand Kumar', preferredLocale: 'en' })).toEqual({
      preferredLocale: 'en',
    });
  });

  it('BR-82: a no-op returns null so no request (and no empty-body 422) is made', () => {
    expect(buildProfilePatch(original, { fullName: ' Anand Kumar ', preferredLocale: 'ta' })).toBeNull();
  });

  it('BR-82: never includes the locked mobile/email (BR-33)', () => {
    const patch = buildProfilePatch(original, {
      fullName: 'New',
      preferredLocale: 'en',
      mobile: '+919800000000',
      email: 'x@example.com',
    } as never);
    expect(patch).toEqual({ fullName: 'New', preferredLocale: 'en' });
  });

  it('does not invent the name length bounds: the server decides (422)', () => {
    // OpenAPI marks 2..120 as an "unconfirmed default"; the client only trims.
    expect(buildProfilePatch(original, { fullName: 'A', preferredLocale: 'ta' })).toEqual({
      fullName: 'A',
    });
  });
});

describe('profile mappers — change password form', () => {
  it('requires every field and a matching confirmation', () => {
    expect(validatePasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })).toEqual({
      currentPassword: 'admin.profile.password.required',
      newPassword: 'admin.profile.password.required',
      confirmPassword: 'admin.profile.password.required',
    });
    const mismatch = validatePasswordForm({
      currentPassword: 'old',
      newPassword: 'new-secret',
      confirmPassword: 'new-secreT',
    });
    expect(mismatch).toEqual({ confirmPassword: 'admin.profile.password.mismatch' });
    expect(isPasswordFormValid(mismatch)).toBe(false);
  });

  it('does not invent a length/complexity policy client-side (server enforces the spec)', () => {
    const errors = validatePasswordForm({ currentPassword: 'o', newPassword: 'n', confirmPassword: 'n' });
    expect(errors).toEqual({});
    expect(isPasswordFormValid(errors)).toBe(true);
  });

  it('a 401 from change-password means the current password was rejected, not an expired session', () => {
    const wrong = new ApiError({ type: 'about:blank', title: 'x', status: 401, code: 'UNAUTHENTICATED' } as never);
    expect(changePasswordErrorKey(wrong)).toBe('admin.profile.password.errors.UNAUTHENTICATED');
    const invalid = new ApiError({ type: 'about:blank', title: 'x', status: 422, code: 'VALIDATION_FAILED' } as never);
    expect(changePasswordErrorKey(invalid)).toBe('admin.profile.password.errors.VALIDATION_FAILED');
    const limited = new ApiError({ type: 'about:blank', title: 'x', status: 429, code: 'RATE_LIMITED' } as never);
    expect(changePasswordErrorKey(limited)).toBe('admin.errors.RATE_LIMITED');
  });
});

describe('profile mappers — sessions (BR-67)', () => {
  it('BR-67: a session row carries only the API fields — no isCurrent, location or failed logins', () => {
    const row = toSessionRow(session);
    expect(Object.keys(row).sort()).toEqual(
      [
        'expiresAtLabel',
        'id',
        'issuedAtLabel',
        'lastSeenAtLabel',
        'lastSeenIp',
        'platformLabelKey',
        'userAgent',
      ].sort(),
    );
    expect(row).not.toHaveProperty('isCurrent');
    expect(row.issuedAtLabel).toBe('12/10/2026 09:30');
    expect(row.lastSeenAtLabel).toBe('13/10/2026 12:00');
    expect(row.lastSeenIp).toBe('10.0.0.7');
  });

  it('BR-67: nullable fields stay null rather than being filled in', () => {
    const row = toSessionRow({ ...session, platform: null, userAgent: null, lastSeenAt: null, lastSeenIp: null });
    expect(row.userAgent).toBeNull();
    expect(row.lastSeenAtLabel).toBeNull();
    expect(row.lastSeenIp).toBeNull();
    expect(row.platformLabelKey).toBe('admin.profile.sessions.platform.unknown');
  });

  it('every platform has a real catalogue key, and unknown falls back', () => {
    for (const p of SESSION_PLATFORMS) {
      expect(isTranslationKey(sessionPlatformLabelKey(p))).toBe(true);
    }
    expect(sessionPlatformLabelKey('tv')).toBe('admin.profile.sessions.platform.unknown');
  });
});

describe('profile mappers — admin notification preferences (BR-82)', () => {
  const allOn = ADMIN_NOTIFICATION_CATEGORIES.map((category) => ({ category, enabled: true }));

  it('BR-82: every one of the 14 categories appears exactly once, master first, in screen order', () => {
    const groups = groupAdminPreferences(allOn);
    const flat = groups.flatMap((g) => g.items.map((i) => i.category));
    expect(flat).toEqual([...ADMIN_NOTIFICATION_CATEGORIES]);
    expect(groups[0]!.items.map((i) => i.category)).toEqual(['IN_APP_MASTER']);
    for (const g of groups) {
      expect(isTranslationKey(g.titleKey)).toBe(true);
      for (const i of g.items) expect(isTranslationKey(i.labelKey)).toBe(true);
    }
  });

  it('BR-82: a category missing from the response is enabled (no stored row = enabled)', () => {
    const groups = groupAdminPreferences(allOn.filter((p) => p.category !== 'TASK_ALERTS'));
    const task = groups.flatMap((g) => g.items).find((i) => i.category === 'TASK_ALERTS');
    expect(task?.enabled).toBe(true);
  });

  it('BR-82: with IN_APP_MASTER off the other toggles are greyed but keep their stored value', () => {
    const prefs = allOn.map((p) =>
      p.category === 'IN_APP_MASTER' || p.category === 'ORDER_CONFIRMED' ? { ...p, enabled: false } : p,
    );
    const items = groupAdminPreferences(prefs).flatMap((g) => g.items);
    const master = items.find((i) => i.category === 'IN_APP_MASTER')!;
    expect(master.enabled).toBe(false);
    expect(master.disabled).toBe(false);
    const others = items.filter((i) => i.category !== 'IN_APP_MASTER');
    expect(others.every((i) => i.disabled)).toBe(true);
    expect(others.find((i) => i.category === 'ORDER_CONFIRMED')!.enabled).toBe(false);
    expect(others.find((i) => i.category === 'ORDER_DELIVERED')!.enabled).toBe(true);
  });

  it('drops a category the client does not know instead of rendering a raw code', () => {
    const items = groupAdminPreferences([...allOn, { category: 'NEW_THING' as never, enabled: true }]).flatMap(
      (g) => g.items,
    );
    expect(items).toHaveLength(14);
  });
});

describe('profile mappers — help (BR-82)', () => {
  it('BR-82: maps published articles and leaves unconfigured contact channels null (none invented)', () => {
    const model = toHelpModel({
      items: [
        {
          id: 'a1',
          category: 'Orders',
          locale: 'en',
          title: 'How do I verify an order OTP?',
          body: 'Ask the customer for the code.',
          sortOrder: 0,
        },
      ],
      categories: ['Orders'],
      contact: { phone: null, email: null },
    });
    expect(model.articles).toEqual([
      { id: 'a1', category: 'Orders', title: 'How do I verify an order OTP?', body: 'Ask the customer for the code.' },
    ]);
    expect(model.categories).toEqual(['Orders']);
    expect(model.contact).toEqual({ phone: null, email: null });
    expect(model.hasContact).toBe(false);
  });

  it('treats a blank channel as not configured', () => {
    const model = toHelpModel({ items: [], categories: [], contact: { phone: '  ', email: 'help@x.in' } });
    expect(model.contact).toEqual({ phone: null, email: 'help@x.in' });
    expect(model.hasContact).toBe(true);
  });
});
