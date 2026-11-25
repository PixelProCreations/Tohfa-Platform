import crypto from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../../../http/problem.js';
import type { AuthRepo, OtpVerificationRow } from '../auth.repo.js';
import { createAuthService } from '../auth.service.js';
import type { CustomerOtpRepo } from '../customerOtp.repo.js';
import { createCustomerOtpService } from '../customerOtp.service.js';
import type { OtpProvider } from './otpProvider.js';

/**
 * BR-225: every OTP path (farmer / admin `/auth/otp/*`, `/auth/forgot-password` +
 * `/auth/reset-password`, customer `/auth/customer/otp/*`) issues and checks codes
 * through ONE injected OtpProvider, while BR-32 (resend cooldown, 3-attempt
 * lockout, expiry, single use) stays enforced on our own challenge row.
 */

const MOBILE = '+919876543210';
const GOOD = '482913';
const CHALLENGE_ID = '44444444-4444-4444-4444-444444444444';

/** A Twilio-shaped provider: it owns the code, so nothing plaintext ever comes back. */
function fakeLiveProvider() {
  const deliver = vi.fn(async () => {});
  const provider: OtpProvider = {
    name: 'twilio',
    issue: vi.fn(() => ({ codeHash: crypto.randomBytes(32).toString('hex'), deliver })),
    check: vi.fn(async ({ code }: { mobile: string; code: string; codeHash: string }) => code === GOOD),
  };
  return { provider, deliver };
}

function challengeRow(overrides: Partial<OtpVerificationRow> = {}): OtpVerificationRow {
  return {
    id: CHALLENGE_ID,
    user_id: null,
    mobile: MOBILE,
    purpose: 'LOGIN',
    code_hash: 'random-sentinel-hash',
    attempts: 0,
    max_attempts: 3,
    locked_at: null,
    expires_at: new Date(Date.now() + 300_000),
    consumed_at: null,
    resend_count: 0,
    last_sent_at: new Date(),
    created_at: new Date(),
    ...overrides,
  };
}

/** Only the methods these paths touch; anything else is a test bug and should throw. */
function repoAround(state: { challenge: OtpVerificationRow }, extra: Partial<AuthRepo> = {}): AuthRepo {
  const base: Partial<AuthRepo> = {
    findLatestOtp: async () => null,
    findUserByMobile: async () => null,
    findUserById: async () => null,
    findOtpById: async () => state.challenge,
    createOtpVerification: async (_db, p) => {
      state.challenge = challengeRow({ mobile: p.mobile, purpose: p.purpose, code_hash: p.codeHash });
      return state.challenge;
    },
    incrementOtpAttempts: async (_db, _id, lock) => {
      state.challenge = {
        ...state.challenge,
        attempts: state.challenge.attempts + 1,
        locked_at: lock ? new Date() : null,
      };
      return state.challenge;
    },
    consumeOtp: async () => {
      state.challenge = { ...state.challenge, consumed_at: new Date() };
    },
    ...extra,
  };
  return new Proxy(base as AuthRepo, {
    get(target, prop, receiver) {
      if (prop in target) return Reflect.get(target, prop, receiver);
      throw new Error(`unexpected repo call: ${String(prop)}`);
    },
  });
}

describe('BR-225: all OTP paths go through the configured OTP provider', () => {
  it('BR-225: send persists the challenge first, then delivers through the provider, and returns no _mockCode', async () => {
    const { provider, deliver } = fakeLiveProvider();
    const state = { challenge: challengeRow() };
    const created = vi.fn();
    const repo = repoAround(state, {
      createOtpVerification: async (_db, p) => {
        created(p);
        expect(deliver).not.toHaveBeenCalled();
        state.challenge = challengeRow({ code_hash: p.codeHash });
        return state.challenge;
      },
    });
    const service = createAuthService(repo, undefined, provider);

    const res = (await service.sendOtp({ mobile: MOBILE, purpose: 'LOGIN' })) as Record<string, unknown>;

    expect(provider.issue).toHaveBeenCalledWith(MOBILE);
    expect(deliver).toHaveBeenCalledTimes(1);
    expect(created.mock.calls[0]![0].codeHash).toMatch(/^[0-9a-f]{64}$/);
    expect(res).not.toHaveProperty('_mockCode');
    expect(res['challengeId']).toBe(CHALLENGE_ID);
  });

  it('BR-225: the BR-32 resend cooldown is enforced before the provider is ever called', async () => {
    const { provider, deliver } = fakeLiveProvider();
    const state = { challenge: challengeRow({ last_sent_at: new Date(Date.now() - 5_000) }) };
    const service = createAuthService(repoAround(state, { findLatestOtp: async () => state.challenge }), undefined, provider);

    await expect(service.sendOtp({ mobile: MOBILE, purpose: 'LOGIN' })).rejects.toMatchObject({
      code: 'OTP_RESEND_TOO_SOON',
      status: 429,
    });
    expect(provider.issue).not.toHaveBeenCalled();
    expect(deliver).not.toHaveBeenCalled();
  });

  it('BR-225: a provider delivery failure surfaces as its AppError', async () => {
    const { provider, deliver } = fakeLiveProvider();
    deliver.mockRejectedValueOnce(new AppError('OTP_PROVIDER_RATE_LIMITED', { status: 429 }));
    const service = createAuthService(repoAround({ challenge: challengeRow() }), undefined, provider);

    await expect(service.sendOtp({ mobile: MOBILE, purpose: 'LOGIN' })).rejects.toMatchObject({
      code: 'OTP_PROVIDER_RATE_LIMITED',
    });
  });

  it('BR-225: /auth/otp/verify (farmer and admin) checks the code with the provider', async () => {
    const { provider } = fakeLiveProvider();
    const state = { challenge: challengeRow() };
    const service = createAuthService(repoAround(state), undefined, provider);

    const res = (await service.verifyOtp({ challengeId: CHALLENGE_ID, code: GOOD })) as Record<string, unknown>;

    expect(provider.check).toHaveBeenCalledWith({ mobile: MOBILE, code: GOOD, codeHash: 'random-sentinel-hash' });
    expect(res['verified']).toBe(true);
    expect(state.challenge.consumed_at).not.toBeNull();
  });

  it('BR-225: wrong codes count against the BR-32 lockout; once locked the provider is not consulted', async () => {
    const { provider } = fakeLiveProvider();
    const state = { challenge: challengeRow() };
    const service = createAuthService(repoAround(state), undefined, provider);

    await expect(service.verifyOtp({ challengeId: CHALLENGE_ID, code: '000000' })).rejects.toMatchObject({ code: 'OTP_INVALID', status: 401 });
    await expect(service.verifyOtp({ challengeId: CHALLENGE_ID, code: '000000' })).rejects.toMatchObject({ code: 'OTP_INVALID', status: 401 });
    await expect(service.verifyOtp({ challengeId: CHALLENGE_ID, code: '000000' })).rejects.toMatchObject({ code: 'OTP_LOCKED', status: 429 });
    expect(provider.check).toHaveBeenCalledTimes(3);

    await expect(service.verifyOtp({ challengeId: CHALLENGE_ID, code: GOOD })).rejects.toMatchObject({ code: 'OTP_LOCKED', status: 429 });
    expect(provider.check).toHaveBeenCalledTimes(3);
  });

  it('BR-225: a locally expired or consumed challenge is refused without asking the provider', async () => {
    const { provider } = fakeLiveProvider();
    const expired = createAuthService(
      repoAround({ challenge: challengeRow({ expires_at: new Date(Date.now() - 1_000) }) }),
      undefined,
      provider,
    );
    await expect(expired.verifyOtp({ challengeId: CHALLENGE_ID, code: GOOD })).rejects.toMatchObject({ code: 'OTP_EXPIRED' });

    const consumed = createAuthService(repoAround({ challenge: challengeRow({ consumed_at: new Date() }) }), undefined, provider);
    await expect(consumed.verifyOtp({ challengeId: CHALLENGE_ID, code: GOOD })).rejects.toMatchObject({ code: 'OTP_INVALID' });
    expect(provider.check).not.toHaveBeenCalled();
  });

  it('BR-225: a provider-side expiry (Twilio 404) is OTP_EXPIRED and leaves the challenge unconsumed', async () => {
    const { provider } = fakeLiveProvider();
    vi.mocked(provider.check).mockRejectedValueOnce(new AppError('OTP_EXPIRED', { status: 400 }));
    const state = { challenge: challengeRow() };
    const service = createAuthService(repoAround(state), undefined, provider);

    await expect(service.verifyOtp({ challengeId: CHALLENGE_ID, code: GOOD })).rejects.toMatchObject({ code: 'OTP_EXPIRED' });
    expect(state.challenge.consumed_at).toBeNull();
  });

  it('BR-225: /auth/reset-password checks the code with the provider', async () => {
    const { provider } = fakeLiveProvider();
    const state = { challenge: challengeRow({ purpose: 'PASSWORD_RESET' }) };
    const service = createAuthService(repoAround(state), undefined, provider);

    await expect(
      service.resetPassword({ challengeId: CHALLENGE_ID, code: '000000', newPassword: 'N3w-Passw0rd!long' }),
    ).rejects.toMatchObject({ code: 'OTP_INVALID', status: 401 });
    expect(provider.check).toHaveBeenCalledWith({ mobile: MOBILE, code: '000000', codeHash: 'random-sentinel-hash' });
    expect(state.challenge.attempts).toBe(1);
  });

  it('BR-225: /auth/customer/otp/verify checks the code with the same provider', async () => {
    const { provider } = fakeLiveProvider();
    const state = { challenge: challengeRow() };
    const repo = repoAround(state);
    const service = createCustomerOtpService({
      repo,
      customerRepo: {} as CustomerOtpRepo,
      otpProvider: provider,
    });

    await expect(service.verify({ mobile: MOBILE, challengeId: CHALLENGE_ID, otp: '000000' })).rejects.toMatchObject({
      code: 'OTP_INVALID',
      status: 401,
    });
    expect(provider.check).toHaveBeenCalledWith({ mobile: MOBILE, code: '000000', codeHash: 'random-sentinel-hash' });
    expect(state.challenge.attempts).toBe(1);
  });
});
