/**
 * api/auth.ts pieces of the admin login / sign-out fix, with the shell API
 * client, the shell auth API and the Keychain store mocked so this file loads
 * without react-native (auth.test.ts cannot load on this branch: "Expected
 * 'from', got 'typeOf'" from react-native's Flow source).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const clientState = vi.hoisted(() => ({ token: null as string | null }));
const storage = vi.hoisted(() => ({ stored: null as string | null }));

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

import * as shellAuthApi from '../../../shell/auth/api';
import * as tokenStore from '../storage/tokenStorage';
import { logout, resolveRouteAfterAuth, resolveRouteAfterLogin, type TokenResponse, type UserMe } from '../api/auth';

const apiLogout = vi.mocked(shellAuthApi.logout);

beforeEach(() => {
  vi.clearAllMocks();
  clientState.token = 'access';
  storage.stored = 'access';
});

describe('logout(): revoke on the server, always clear locally', () => {
  it('calls POST /auth/logout, then clears the in-memory and Keychain tokens', async () => {
    apiLogout.mockResolvedValueOnce(undefined);
    await logout();
    expect(apiLogout).toHaveBeenCalledTimes(1);
    expect(clientState.token).toBeNull();
    expect(storage.stored).toBeNull();
    expect(tokenStore.clearTokens).toHaveBeenCalledTimes(1);
  });

  it('still clears the tokens when the server call rejects (offline)', async () => {
    apiLogout.mockRejectedValueOnce(new Error('network unavailable'));
    await expect(logout()).resolves.toBeUndefined();
    expect(clientState.token).toBeNull();
    expect(storage.stored).toBeNull();
  });

  it('skips the server call when no session is left (a second sign-out), but still clears', async () => {
    clientState.token = null;
    storage.stored = null;
    await logout();
    expect(apiLogout).not.toHaveBeenCalled();
    expect(tokenStore.clearTokens).toHaveBeenCalledTimes(1);
  });
});

const me = (roles: string[]): UserMe => ({ id: 'u1', roles: roles.map((code) => ({ code })) as UserMe['roles'] });

describe('resolveRouteAfterAuth: no admin shell for a role it does not recognise', () => {
  it('an exact admin code opens that shell', () => {
    expect(resolveRouteAfterAuth(me(['SUB_WH_ADMIN', 'FARMER']))).toEqual({
      name: 'AdminMain',
      params: { adminRole: 'SUB_WH_ADMIN' },
    });
  });

  it('an alias or unknown code is not an admin, so never SUPER_ADMIN', () => {
    expect(resolveRouteAfterAuth(me(['SA'])).name).toBe('Unsupported');
    expect(resolveRouteAfterAuth(me(['MAIN_WAREHOUSE_ADMIN'])).name).toBe('Unsupported');
    expect(resolveRouteAfterAuth(me([])).name).toBe('Unsupported');
  });

  it('farmers and customers still go where they went', () => {
    expect(resolveRouteAfterAuth(me(['FARMER'])).name).toBe('MainTabs');
    expect(resolveRouteAfterAuth(me(['CUSTOMER'])).name).toBe('CustomerMain');
  });
});

describe('resolveRouteAfterLogin: route on the role this session was issued for', () => {
  const outcome = (roles: string[]): TokenResponse => ({
    accessToken: 'a',
    refreshToken: 'r',
    requiresRoleSelection: false,
    user: me(roles),
  });

  it('uses the login response roles, not every role /auth/me lists', () => {
    // /auth/me lists every role the account holds; the token was issued for one.
    const allHeld = me(['TOHFA_ADMIN', 'FARMER_ADMIN', 'FARMER']);
    expect(resolveRouteAfterLogin(outcome(['FARMER_ADMIN']), allHeld)).toEqual({
      name: 'AdminMain',
      params: { adminRole: 'FARMER_ADMIN' },
    });
    expect(resolveRouteAfterLogin(outcome(['FARMER']), allHeld).name).toBe('MainTabs');
  });

  it('an unknown session role gets no admin shell', () => {
    expect(resolveRouteAfterLogin(outcome(['SA']), me(['SUPER_ADMIN'])).name).toBe('Unsupported');
  });
});
