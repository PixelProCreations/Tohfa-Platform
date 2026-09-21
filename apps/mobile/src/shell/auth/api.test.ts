/**
 * Unit tests for the shell auth API wrappers.
 *
 * This module is wiring, so these tests assert exactly what wiring can get
 * wrong and nothing more: the path (including the interpolated `:provider`
 * segment), the method, that the body reaches the transport unmodified, and
 * that the response is passed back untouched. Anything that decides what a
 * response *means* lives in ./session.ts and is tested there.
 *
 * The transport is replaced wholesale with `vi.mock`, the same way
 * ./session.test.ts replaces this module — no `fetch` stub, so nothing here
 * depends on the client's header, retry or problem+json behaviour, which
 * ../api/client.ts owns and is entitled to change.
 *
 * As in session.test.ts, everything is pure and node-only: apps/mobile has no
 * DOM test environment.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LoginSuccess, RoleSelectionRequired } from '@tohfa/shared-types';
import { RoleCode } from '@tohfa/shared-types';

vi.mock('../api/client', () => ({
  request: vi.fn(),
}));

// Imported after the mock declaration; vi.mock is hoisted above both.
import { request } from '../api/client';
import {
  fetchCurrentUser,
  forgotPassword,
  login,
  loginWithOAuth,
  logout,
  registerCustomer,
  resetPassword,
  sendOtp,
  verifyOtp,
  type OAuthNotLinkedResponse,
} from './api';

const requestMock = vi.mocked(request);

/** Exactly what apps/api returns for a single-role token-bearing login. */
const loginSuccess: LoginSuccess = {
  accessToken: 'access-1',
  refreshToken: 'refresh-1',
  tokenType: 'Bearer',
  expiresIn: 900,
  requiresRoleSelection: false,
  user: {
    id: 'user-1',
    fullName: 'Test User',
    userType: 'CUSTOMER',
    roles: [{ code: RoleCode.CUSTOMER }],
    preferredLocale: 'en',
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

/**
 * BR-39: Google/Facebook sign-in is login/linking only, never a bypass of
 * mobile+OTP. See docs/rules.md BR-39 and its `BR-39a`..`BR-39f` contract;
 * these cover this module's slice — the path it calls and the three response
 * shapes it must pass through without interpreting them.
 */
describe('login', () => {
  it('POSTs mobile/password/roleCode to /auth/login unmodified', async () => {
    requestMock.mockResolvedValueOnce(loginSuccess);

    await login({ mobile: '+919876543210', password: 'a-long-enough-password', roleCode: RoleCode.CUSTOMER });

    expect(requestMock).toHaveBeenCalledWith('/auth/login', {
      method: 'POST',
      body: { mobile: '+919876543210', password: 'a-long-enough-password', roleCode: RoleCode.CUSTOMER },
    });
  });
});

describe('sendOtp', () => {
  it('POSTs mobile/purpose to /auth/otp/send unmodified', async () => {
    requestMock.mockResolvedValueOnce({
      challengeId: 'challenge-1',
      expiresAt: '2026-09-21T10:10:00.000Z',
      resendAvailableAt: '2026-09-21T10:01:00.000Z',
      attemptsRemaining: 3,
    });

    await sendOtp({ mobile: '+919876543210', purpose: 'LOGIN' });

    expect(requestMock).toHaveBeenCalledWith('/auth/otp/send', {
      method: 'POST',
      body: { mobile: '+919876543210', purpose: 'LOGIN' },
    });
  });
});

describe('verifyOtp', () => {
  it('POSTs challengeId/code to /auth/otp/verify unmodified', async () => {
    requestMock.mockResolvedValueOnce(loginSuccess);

    await verifyOtp({ challengeId: 'challenge-1', code: '123456' });

    expect(requestMock).toHaveBeenCalledWith('/auth/otp/verify', {
      method: 'POST',
      body: { challengeId: 'challenge-1', code: '123456' },
    });
  });
});

describe('fetchCurrentUser', () => {
  it('GETs /auth/me with no body', async () => {
    requestMock.mockResolvedValueOnce(loginSuccess.user);

    await fetchCurrentUser();

    expect(requestMock).toHaveBeenCalledWith('/auth/me', {});
  });
});

describe('logout', () => {
  /**
   * No body: apps/api/src/modules/auth/auth.routes.ts's logout handler reads
   * nothing off the request body, and a caller-supplied `{}` here previously
   * slipped in during a refactor with no test to catch it -- pinned so that
   * regression can't come back silently.
   */
  it('POSTs to /auth/logout with no body', async () => {
    requestMock.mockResolvedValueOnce(undefined);

    await logout();

    expect(requestMock).toHaveBeenCalledWith('/auth/logout', { method: 'POST' });
  });
});

describe('loginWithOAuth', () => {
  it('BR-39: POSTs the token to /auth/oauth/<provider> with the provider in the path, not the body', async () => {
    requestMock.mockResolvedValueOnce(loginSuccess);

    await loginWithOAuth('google', { token: 'a-verified-google-id-token' });

    expect(requestMock).toHaveBeenCalledWith('/auth/oauth/google', {
      method: 'POST',
      body: { token: 'a-verified-google-id-token' },
    });
  });

  it('BR-39: interpolates facebook the same way, so the two providers differ only by path segment', async () => {
    requestMock.mockResolvedValueOnce(loginSuccess);

    await loginWithOAuth('facebook', { token: 'a-verified-facebook-token' });

    expect(requestMock).toHaveBeenCalledWith('/auth/oauth/facebook', {
      method: 'POST',
      body: { token: 'a-verified-facebook-token' },
    });
  });

  it('BR-39: forwards the optional deviceId, platform and roleCode fields verbatim', async () => {
    requestMock.mockResolvedValueOnce(loginSuccess);

    await loginWithOAuth('google', {
      token: 'a-verified-google-id-token',
      deviceId: 'device-1',
      platform: 'android',
      roleCode: 'TOHFA_ADMIN',
    });

    expect(requestMock).toHaveBeenCalledWith('/auth/oauth/google', {
      method: 'POST',
      body: {
        token: 'a-verified-google-id-token',
        deviceId: 'device-1',
        platform: 'android',
        roleCode: 'TOHFA_ADMIN',
      },
    });
  });

  /**
   * The body is forwarded by reference rather than rebuilt field by field, so
   * an omitted optional stays omitted from the JSON instead of being sent as
   * an explicit null. A rebuild would silently regress this.
   */
  it('BR-39: sends no key at all for an omitted optional', async () => {
    requestMock.mockResolvedValueOnce(loginSuccess);

    await loginWithOAuth('google', { token: 'a-verified-google-id-token' });

    const [, options] = requestMock.mock.calls[0] as [string, { body: Record<string, unknown> }];
    expect('deviceId' in options.body).toBe(false);
    expect('platform' in options.body).toBe(false);
    expect('roleCode' in options.body).toBe(false);
  });

  it('BR-39: passes the already-linked success response through as a token pair', async () => {
    requestMock.mockResolvedValueOnce(loginSuccess);

    const res = await loginWithOAuth('google', { token: 'a-verified-google-id-token' });

    expect(res).toEqual(loginSuccess);
  });

  /**
   * The third 200 shape docs/openapi.yaml's `oneOf` omits: an OAuth-linked
   * account holding more than one role gets the same role-selection payload a
   * password login would. Pinned here because a union that only listed the two
   * documented shapes would make this branch a type error at every call site.
   */
  it('BR-39: passes the role-selection response through, which the OpenAPI oneOf does not list', async () => {
    const roleSelection: RoleSelectionRequired = {
      requiresRoleSelection: true,
      availableRoles: [{ code: RoleCode.FARMER }, { code: RoleCode.TOHFA_ADMIN }],
    };
    requestMock.mockResolvedValueOnce(roleSelection);

    const res = await loginWithOAuth('google', { token: 'a-verified-google-id-token' });

    expect(res).toEqual(roleSelection);
  });

  it('BR-39: passes the NOT_LINKED response through and issues no tokens with it', async () => {
    const notLinked: OAuthNotLinkedResponse = {
      status: 'NOT_LINKED',
      profile: { fullName: 'New Customer', email: 'new@example.com', photoUrl: null },
      linkToken: 'signed-link-token',
    };
    requestMock.mockResolvedValueOnce(notLinked);

    const res = await loginWithOAuth('facebook', { token: 'a-verified-facebook-token' });

    expect(res).toEqual(notLinked);
    expect('accessToken' in res).toBe(false);
    // One round-trip only: nothing tries to persist tokens that were never issued.
    expect(requestMock).toHaveBeenCalledTimes(1);
  });
});

describe('forgotPassword', () => {
  it('POSTs the mobile number to /auth/forgot-password', async () => {
    requestMock.mockResolvedValueOnce({
      challengeId: 'challenge-1',
      expiresAt: '2026-09-21T10:10:00.000Z',
      resendAvailableAt: '2026-09-21T10:01:00.000Z',
      attemptsRemaining: 3,
    });

    await forgotPassword({ mobile: '+919876543210' });

    expect(requestMock).toHaveBeenCalledWith('/auth/forgot-password', {
      method: 'POST',
      body: { mobile: '+919876543210' },
    });
  });

  /**
   * The server answers 202 with a challenge whether or not the account exists,
   * so that the response cannot be used to enumerate accounts. This module must
   * therefore return the challenge unchanged and must not try to infer
   * existence from it.
   */
  it('returns the OTP challenge unchanged, which is not evidence the account exists', async () => {
    const challenge = {
      challengeId: 'challenge-1',
      expiresAt: '2026-09-21T10:10:00.000Z',
      resendAvailableAt: '2026-09-21T10:01:00.000Z',
      attemptsRemaining: 3,
    };
    requestMock.mockResolvedValueOnce(challenge);

    await expect(forgotPassword({ mobile: '+919999999999' })).resolves.toEqual(challenge);
  });
});

describe('resetPassword', () => {
  it('POSTs the challenge, code and new password to /auth/reset-password', async () => {
    requestMock.mockResolvedValueOnce(undefined);

    await resetPassword({
      challengeId: 'challenge-1',
      code: '123456',
      newPassword: 'a-long-enough-password',
    });

    expect(requestMock).toHaveBeenCalledWith('/auth/reset-password', {
      method: 'POST',
      body: {
        challengeId: 'challenge-1',
        code: '123456',
        newPassword: 'a-long-enough-password',
      },
    });
  });

  it('resolves to undefined, because the server answers 204 with no body', async () => {
    requestMock.mockResolvedValueOnce(undefined);

    await expect(
      resetPassword({ challengeId: 'challenge-1', code: '123456', newPassword: 'a-long-one-x' }),
    ).resolves.toBeUndefined();
  });
});

describe('registerCustomer', () => {
  const accepted = {
    userId: 'user-1',
    status: 'PENDING_OTP' as const,
    challengeId: 'challenge-1',
    otpExpiresAt: '2026-09-21T10:10:00.000Z',
    resendAvailableAt: '2026-09-21T10:01:00.000Z',
    attemptsRemaining: 3,
  };

  it('POSTs the registration body to /auth/register/customer unmodified', async () => {
    requestMock.mockResolvedValueOnce(accepted);

    await registerCustomer({
      mobile: '+919876543210',
      fullName: 'Deepa Raman',
      password: 'a-long-enough-password',
      preferredLocale: 'ta',
    });

    expect(requestMock).toHaveBeenCalledWith('/auth/register/customer', {
      method: 'POST',
      body: {
        mobile: '+919876543210',
        fullName: 'Deepa Raman',
        password: 'a-long-enough-password',
        preferredLocale: 'ta',
      },
    });
  });

  /**
   * No `+91` normalization and no `preferredLocale` default here: this module
   * is wiring. Both of those belong to the customer role's own boundary
   * (src/roles/customer/api/auth.ts), which is where they are tested.
   */
  it('adds no defaults of its own to the body', async () => {
    requestMock.mockResolvedValueOnce(accepted);

    await registerCustomer({
      mobile: '9876543210',
      fullName: 'Deepa Raman',
      password: 'a-long-enough-password',
    });

    const [, options] = requestMock.mock.calls[0] as [string, { body: Record<string, unknown> }];
    expect(options.body).toEqual({
      mobile: '9876543210',
      fullName: 'Deepa Raman',
      password: 'a-long-enough-password',
    });
    expect('preferredLocale' in options.body).toBe(false);
  });

  /**
   * `challengeId` is what the caller must feed to POST /auth/otp/verify, and
   * docs/openapi.yaml's `RegistrationAccepted` schema does not list it even
   * though the server always sends it. Pinned so a future tightening of the
   * response type against the spec alone cannot drop it.
   */
  it('returns the challengeId the spec omits but the server always sends', async () => {
    requestMock.mockResolvedValueOnce(accepted);

    const res = await registerCustomer({
      mobile: '+919876543210',
      fullName: 'Deepa Raman',
      password: 'a-long-enough-password',
    });

    expect(res.challengeId).toBe('challenge-1');
    expect(res.status).toBe('PENDING_OTP');
    expect(res.attemptsRemaining).toBe(3);
  });
});
