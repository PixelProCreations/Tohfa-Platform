/**
 * BR-142 (docs/rules.md): a first sign-in by OTP leads to creating a password.
 *
 * The routing decision lives in `resolveRouteAfterAuth`, which every sign-in
 * path already goes through (OTP verify, Splash session restore, social login,
 * password login via `resolveRouteAfterLogin`). Putting the check there, rather
 * than only in the OTP screen, is what makes Create Password impossible to skip
 * by killing the app: the next cold start resolves the same `/auth/me` and lands
 * on it again.
 *
 * The shell client, shell auth API and Keychain store are mocked so this file
 * loads without react-native (same setup as admin_auth_api.test.ts).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const clientState = vi.hoisted(() => ({ token: 'access' as string | null }));
const storage = vi.hoisted(() => ({ stored: 'access' as string | null }));

vi.mock('../../../shell/api/client', () => ({
  getAccessToken: vi.fn(() => clientState.token),
  setAccessToken: vi.fn((t: string | null) => {
    clientState.token = t;
  }),
  request: vi.fn(),
}));

vi.mock('../../../shell/auth/api', () => ({
  fetchCurrentUser: vi.fn(),
  forgotPassword: vi.fn(),
  login: vi.fn(),
  loginWithOAuth: vi.fn(),
  logout: vi.fn(),
  resetPassword: vi.fn(),
  sendOtp: vi.fn(),
  verifyOtp: vi.fn(),
}));

vi.mock('../storage/tokenStorage', () => ({
  saveTokens: vi.fn(async (a: string) => {
    storage.stored = a;
  }),
  clearTokens: vi.fn(async () => {
    storage.stored = null;
  }),
  getAccessToken: vi.fn(async () => storage.stored),
}));

import * as shellClient from '../../../shell/api/client';
import * as shellAuthApi from '../../../shell/auth/api';
import {
  fetchMe,
  resolveRouteAfterAuth,
  resolveRouteAfterLogin,
  setInitialPassword,
  type TokenResponse,
  type UserMe,
} from '../api/auth';
import { emptyHistoryBackTarget, resetsHistoryOn } from '../utils/navigationSession';

const request = vi.mocked(shellClient.request);

beforeEach(() => {
  vi.clearAllMocks();
  clientState.token = 'access';
  storage.stored = 'access';
});

function me(roles: string[], hasPassword?: boolean): UserMe {
  return {
    id: 'u1',
    status: 'ACTIVE',
    roles: roles.map((code) => ({ code })) as UserMe['roles'],
    ...(hasPassword === undefined ? {} : { hasPassword }),
  };
}

describe('BR-142e: resolveRouteAfterAuth sends an account with no password to Create Password', () => {
  it.each(['FARMER', 'CUSTOMER', 'SUB_WH_ADMIN', 'SUPER_ADMIN'])(
    'BR-142e: %s with hasPassword false goes to CreatePassword, before any role shell',
    (role) => {
      expect(resolveRouteAfterAuth(me([role], false))).toEqual({ name: 'CreatePassword' });
    },
  );

  it('BR-142e: a returning user who already has a password is not asked again', () => {
    expect(resolveRouteAfterAuth(me(['FARMER'], true))).toEqual({ name: 'MainTabs' });
    expect(resolveRouteAfterAuth(me(['CUSTOMER'], true))).toEqual({ name: 'CustomerMain' });
    expect(resolveRouteAfterAuth(me(['SUB_WH_ADMIN'], true))).toEqual({
      name: 'AdminMain',
      params: { adminRole: 'SUB_WH_ADMIN' },
    });
  });

  it('BR-142e: hasPassword absent (an older server) never forces Create Password', () => {
    expect(resolveRouteAfterAuth(me(['FARMER']))).toEqual({ name: 'MainTabs' });
  });

  it('BR-142e: an approved, ACTIVE farmer whose real /auth/me says hasPassword false goes to CreatePassword', async () => {
    // The GET /v1/auth/me body a dev OTP sign-in actually returned for an
    // approved farmer with no password (permissions trimmed). Runs the real
    // fetchMe -> resolveRouteAfterAuth chain the OTP screen uses, so a mapper
    // that dropped `hasPassword`, or a farmer/approved branch evaluated before
    // the gate, would land this account on MainTabs, as the device did when it
    // ran a pre-BR-142 bundle.
    vi.mocked(shellAuthApi.fetchCurrentUser).mockResolvedValueOnce({
      id: '00000000-0000-4000-8000-000000000142',
      fullName: 'Farmer',
      mobile: '+911234567890',
      email: null,
      userType: 'FARMER',
      preferredLocale: 'en',
      status: 'ACTIVE',
      createdAt: '2026-11-10T12:18:29.403Z',
      lastLoginAt: '2026-11-10T12:21:47.385Z',
      hasPassword: false,
      roles: [{ code: 'FARMER' }],
      permissions: ['auth.password.change_own', 'auth.principal.view_own', 'farmer.profile.view_own'],
    } as never);

    expect(resolveRouteAfterAuth(await fetchMe())).toEqual({ name: 'CreatePassword' });
  });

  it('BR-142e: resolveRouteAfterLogin carries the same gate (it reads hasPassword from /auth/me)', () => {
    const outcome = { accessToken: 'a', refreshToken: 'r', user: me(['FARMER']) } as TokenResponse;
    expect(resolveRouteAfterLogin(outcome, me(['FARMER'], false))).toEqual({ name: 'CreatePassword' });
    expect(resolveRouteAfterLogin(outcome, me(['FARMER'], true))).toEqual({ name: 'MainTabs' });
  });
});

describe('BR-142: setInitialPassword()', () => {
  it('POSTs the new password to /auth/me/set-password and keeps the session (nothing is revoked)', async () => {
    request.mockResolvedValueOnce(undefined);

    await setInitialPassword({ newPassword: 'FirstPassword142' });

    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith('/auth/me/set-password', {
      method: 'POST',
      body: { newPassword: 'FirstPassword142' },
    });
    expect(clientState.token).toBe('access');
    expect(storage.stored).toBe('access');
  });
});

describe('BR-142f: Create Password cannot be skipped with back navigation', () => {
  it('BR-142f: opening Create Password starts a fresh back stack (nothing to pop back into)', () => {
    expect(resetsHistoryOn('CreatePassword')).toBe(true);
  });

  it('BR-142f: with an empty stack, back on Create Password goes nowhere in the app (Android leaves it)', () => {
    expect(emptyHistoryBackTarget('CreatePassword')).toBeNull();
  });
});
