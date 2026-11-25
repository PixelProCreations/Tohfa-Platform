import crypto from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { AuthRepo, OtpVerificationRow, UserRoleRow, UserRow } from './auth.repo.js';
import { customerOtpSendBody, customerOtpVerifyBody } from './auth.schema.js';
import { createAuthService } from './auth.service.js';
import type { CustomerOtpRepo } from './customerOtp.repo.js';
import { createCustomerOtpService, type CustomerOtpDeps } from './customerOtp.service.js';

const MOBILE = '+919876500001';
const CHALLENGE_ID = '0b2d0f2e-8b1c-4c1a-9f0a-9d3e6c1b2a30';
const CODE = '482915';

const sha = (v: string) => crypto.createHash('sha256').update(v).digest('hex');

/** Fake executor: answers the audit-log INSERT ... RETURNING id. */
const fakeDb: Executor = {
  query: (async () => ({ rows: [{ id: 'audit-1' }], rowCount: 1 })) as unknown as Executor['query'],
};

function userRow(overrides: Partial<UserRow> = {}): UserRow {
  return {
    id: 'user-existing',
    mobile: MOBILE,
    email: null,
    password_hash: null,
    full_name: 'Existing Customer',
    preferred_locale: 'en',
    user_type: 'CUSTOMER',
    status: 'ACTIVE',
    mfa_enabled: false,
    last_login_at: null,
    created_at: new Date(),
    ...overrides,
  };
}

function challenge(overrides: Partial<OtpVerificationRow> = {}): OtpVerificationRow {
  return {
    id: CHALLENGE_ID,
    user_id: null,
    mobile: MOBILE,
    purpose: 'LOGIN',
    code_hash: sha(CODE),
    attempts: 0,
    max_attempts: 3,
    locked_at: null,
    expires_at: new Date(Date.now() + 5 * 60_000),
    consumed_at: null,
    resend_count: 0,
    last_sent_at: new Date(),
    created_at: new Date(),
    ...overrides,
  };
}

/** An in-memory world: users by mobile, one challenge, a customer-row counter. */
function world(opts: { users?: UserRow[]; roles?: UserRoleRow[]; otp?: OtpVerificationRow } = {}) {
  const users = new Map<string, UserRow>((opts.users ?? []).map((u) => [u.mobile, u]));
  let otp: OtpVerificationRow | null = opts.otp ?? challenge();
  const customers = new Map<string, string>();
  const sessions: string[] = [];
  let latestOtp: OtpVerificationRow | null = null;

  const repo = {
    findUserByMobile: vi.fn(async (_db: Executor, mobile: string) => users.get(mobile) ?? null),
    getUserRoles: vi.fn(async () => opts.roles ?? []),
    createCustomerUser: vi.fn(async (_db: Executor, p: Parameters<AuthRepo['createCustomerUser']>[1]) => {
      if (users.has(p.mobile)) throw Object.assign(new Error('dup'), { code: '23505' });
      const u = userRow({
        id: `user-${users.size + 1}`,
        mobile: p.mobile,
        full_name: p.fullName,
        password_hash: p.passwordHash,
        preferred_locale: p.preferredLocale,
      });
      users.set(p.mobile, u);
      return u;
    }),
    updateUserStatus: vi.fn(async () => {}),
    updateUserLastLogin: vi.fn(async () => {}),
    createSession: vi.fn(async (_db: Executor, p: { userId: string; expiresAt: Date }) => {
      const id = crypto.randomUUID();
      sessions.push(id);
      return { id, user_id: p.userId, expires_at: p.expiresAt } as never;
    }),
    createRefreshToken: vi.fn(async () => ({}) as never),
    findOtpById: vi.fn(async () => (otp === null ? null : { ...otp })),
    findLatestOtp: vi.fn(async () => latestOtp),
    createOtpVerification: vi.fn(async (_db: Executor, p: { mobile: string; purpose: string; codeHash: string; maxAttempts: number; expiresAt: Date }) => {
      latestOtp = challenge({ id: crypto.randomUUID(), mobile: p.mobile, purpose: p.purpose, code_hash: p.codeHash, expires_at: p.expiresAt });
      return latestOtp;
    }),
    incrementOtpAttempts: vi.fn(async (_db: Executor, _id: string, lock: boolean) => {
      if (otp !== null) otp = { ...otp, attempts: otp.attempts + 1, locked_at: lock ? new Date() : null };
      return otp;
    }),
  } as unknown as AuthRepo & Record<string, ReturnType<typeof vi.fn>>;

  const customerRepo: CustomerOtpRepo = {
    consumeOtpIfUnconsumed: vi.fn(async () => {
      if (otp === null || otp.consumed_at !== null) return false;
      otp = { ...otp, consumed_at: new Date() };
      return true;
    }),
    ensureCustomerAndWallet: vi.fn(async (_db: Executor, userId: string) => {
      if (!customers.has(userId)) customers.set(userId, `cust-${userId}`);
      return customers.get(userId)!;
    }),
    onboardingFields: vi.fn(async () => ({ age: null, gender: null, harvestPreferences: [] as string[] })),
  };

  const deps: Partial<CustomerOtpDeps> = {
    repo,
    customerRepo,
    db: fakeDb,
    transaction: (fn) => fn(fakeDb),
    sendOtp: (input) => createAuthService(repo).sendOtp(input),
  };
  return {
    service: createCustomerOtpService(deps),
    repo,
    customerRepo,
    users,
    customers,
    sessions,
    setLatestOtp: (row: OtpVerificationRow | null) => {
      latestOtp = row;
    },
  };
}

const verifyInput = { mobile: MOBILE, challengeId: CHALLENGE_ID, otp: CODE };

async function expectAppError(p: Promise<unknown>, code: string): Promise<AppError> {
  const err = await p.then(
    () => {
      throw new Error(`expected ${code}`);
    },
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(AppError);
  expect((err as AppError).code).toBe(code);
  return err as AppError;
}

describe('BR-153 passwordless customer sign-in', () => {
  it('BR-190: a new account signs in with profileComplete=false and the placeholder name flagged', async () => {
    const w = world();
    const result = await w.service.verify(verifyInput, '127.0.0.1', 'vitest');
    expect(result.user.profileComplete).toBe(false);
    expect(result.user.missingFields).toContain('fullName');
  });

  it('BR-153a: an unknown number is auto-registered as an ACTIVE customer with no password, a customers row and a wallet', async () => {
    const w = world();
    const result = await w.service.verify({ ...verifyInput, preferredLocale: 'ta' }, '127.0.0.1', 'vitest');

    expect(result.isNewUser).toBe(true);
    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(result.user).toMatchObject({ mobile: MOBILE, userType: 'CUSTOMER', hasPassword: false, preferredLocale: 'ta' });
    expect(w.repo.createCustomerUser).toHaveBeenCalledWith(
      fakeDb,
      expect.objectContaining({ mobile: MOBILE, passwordHash: null, status: 'ACTIVE' }),
    );
    expect(w.customerRepo.ensureCustomerAndWallet).toHaveBeenCalledTimes(1);
    expect(result.user.customerId).toBe(w.customers.get(result.user.id));
    expect(w.repo.createSession).toHaveBeenCalledTimes(1);
    expect(w.repo.createRefreshToken).toHaveBeenCalledTimes(1);
  });

  it('BR-153b: an existing customer is logged in, not re-created', async () => {
    const w = world({ users: [userRow({ password_hash: 'bcrypt-hash' })], roles: [{ role_code: 'CUSTOMER' } as UserRoleRow] });
    const result = await w.service.verify(verifyInput);

    expect(result.isNewUser).toBe(false);
    expect(result.user.id).toBe('user-existing');
    expect(result.user.hasPassword).toBe(true);
    expect(w.repo.createCustomerUser).not.toHaveBeenCalled();
    expect(w.sessions).toHaveLength(1);
  });

  it.each([
    ['FARMER user type', userRow({ user_type: 'FARMER' }), []],
    ['ADMIN user type', userRow({ user_type: 'ADMIN' }), []],
    ['CUSTOMER user holding an admin role', userRow(), [{ role_code: 'TOHFA_ADMIN' }]],
  ])('BR-153c: a %s number is refused generically and never logged in or converted', async (_label, user, roles) => {
    const w = world({ users: [user], roles: roles as UserRoleRow[] });
    const err = await expectAppError(w.service.verify(verifyInput), 'FORBIDDEN');

    expect(err.message + JSON.stringify(err)).not.toMatch(/farmer|admin/i);
    expect(w.repo.createCustomerUser).not.toHaveBeenCalled();
    expect(w.repo.createSession).not.toHaveBeenCalled();
    expect(w.customerRepo.ensureCustomerAndWallet).not.toHaveBeenCalled();
  });

  it.each([
    ['CUSTOMER user type with no role assignment', userRow(), [{ role_code: 'FARMER' }]],
    ['FARMER user type with only the FARMER role', userRow({ user_type: 'FARMER' }), [{ role_code: 'FARMER' }]],
    ['CUSTOMER role beside a staff admin role', userRow(), [{ role_code: 'CUSTOMER' }, { role_code: 'TOHFA_ADMIN' }]],
  ])('BR-153c: an account not holding CUSTOMER inside a BR-135 group (%s) is refused', async (_label, user, roles) => {
    const w = world({ users: [user], roles: roles as UserRoleRow[] });
    await expectAppError(w.service.verify(verifyInput), 'FORBIDDEN');
    expect(w.repo.createSession).not.toHaveBeenCalled();
    expect(w.customerRepo.ensureCustomerAndWallet).not.toHaveBeenCalled();
  });

  it.each([
    ['FARMER + CUSTOMER (CUSTOMER user type)', userRow(), [{ role_code: 'CUSTOMER' }, { role_code: 'FARMER' }]],
    ['FARMER + CUSTOMER (FARMER user type)', userRow({ user_type: 'FARMER' }), [{ role_code: 'FARMER' }, { role_code: 'CUSTOMER' }]],
    ['FARMER_ADMIN + CUSTOMER', userRow(), [{ role_code: 'FARMER_ADMIN' }, { role_code: 'CUSTOMER' }]],
  ])(
    'BR-135/BR-153c: an account holding CUSTOMER together with its BR-135 group (%s) signs in as a customer only',
    async (_label, user, roles) => {
      const w = world({ users: [user], roles: roles as UserRoleRow[] });
      const result = await w.service.verify(verifyInput);

      expect(result.isNewUser).toBe(false);
      expect(result.user.roles).toEqual([{ code: 'CUSTOMER' }]);
      // The session is a customer session: the token carries CUSTOMER alone and no farmerId,
      // so the customer entry never opens the farmer side of a dual-role account.
      const payload = JSON.parse(Buffer.from(result.accessToken.split('.')[1]!, 'base64url').toString('utf8')) as {
        roles: { code: string }[];
        farmerId: string | null;
      };
      expect(payload.roles.map((r) => r.code)).toEqual(['CUSTOMER']);
      expect(payload.farmerId).toBeNull();
      expect(w.repo.createCustomerUser).not.toHaveBeenCalled();
      expect(w.sessions).toHaveLength(1);
    },
  );

  it('BR-153d: three wrong OTPs lock the challenge; the correct OTP is then refused', async () => {
    const w = world();
    const wrong = { ...verifyInput, otp: '000000' };
    await expectAppError(w.service.verify(wrong), 'OTP_INVALID');
    await expectAppError(w.service.verify(wrong), 'OTP_INVALID');
    await expectAppError(w.service.verify(wrong), 'OTP_LOCKED');
    await expectAppError(w.service.verify(verifyInput), 'OTP_LOCKED');
    expect(w.repo.createSession).not.toHaveBeenCalled();
  });

  it('BR-153e: a resend within 60s is refused with OTP_RESEND_TOO_SOON', async () => {
    const w = world();
    w.setLatestOtp(challenge({ last_sent_at: new Date(Date.now() - 30_000) }));
    await expectAppError(w.service.send({ mobile: MOBILE }), 'OTP_RESEND_TOO_SOON');

    w.setLatestOtp(challenge({ last_sent_at: new Date(Date.now() - 61_000) }));
    await expect(w.service.send({ mobile: MOBILE })).resolves.toMatchObject({ attemptsRemaining: 3 });
  });

  it('BR-153f: replaying a verify never creates a second account or session', async () => {
    const w = world();
    const first = await w.service.verify(verifyInput);
    expect(first.isNewUser).toBe(true);

    await expectAppError(w.service.verify(verifyInput), 'OTP_INVALID');
    expect(w.repo.createCustomerUser).toHaveBeenCalledTimes(1);
    expect(w.users.size).toBe(1);
    expect(w.sessions).toHaveLength(1);
  });

  it('BR-153f: a concurrent create that loses the UNIQUE(mobile) race signs in to the winning account', async () => {
    const w = world();
    const winner = userRow({ id: 'user-winner' });
    // The first lookup sees no user; the winner commits before our INSERT.
    (w.repo.findUserByMobile as ReturnType<typeof vi.fn>).mockImplementationOnce(async () => {
      w.users.set(MOBILE, winner);
      return null;
    });
    const result = await w.service.verify(verifyInput);

    expect(result.isNewUser).toBe(false);
    expect(result.user.id).toBe('user-winner');
    expect(w.users.size).toBe(1);
  });

  it('BR-153g: the send response is identical for a registered and an unregistered number', async () => {
    const shape = async (users: UserRow[]) => {
      const w = world({ users });
      const res = (await w.service.send({ mobile: MOBILE })) as unknown as Record<string, unknown>;
      return Object.keys(res).filter((k) => k !== '_mockCode').sort();
    };
    const known = await shape([userRow()]);
    const unknown = await shape([]);
    const farmer = await shape([userRow({ user_type: 'FARMER' })]);

    expect(known).toEqual(['attemptsRemaining', 'challengeId', 'expiresAt', 'resendAvailableAt']);
    expect(unknown).toEqual(known);
    expect(farmer).toEqual(known);
  });

  it('BR-153h: a challenge for another mobile or another purpose is refused', async () => {
    const other = world({ otp: challenge({ mobile: '+919876500002' }) });
    await expectAppError(other.service.verify(verifyInput), 'OTP_INVALID');
    const reset = world({ otp: challenge({ purpose: 'PASSWORD_RESET' }) });
    await expectAppError(reset.service.verify(verifyInput), 'OTP_INVALID');
    expect(other.repo.createSession).not.toHaveBeenCalled();
    expect(reset.repo.createSession).not.toHaveBeenCalled();
  });

  it('BR-153i: a disabled customer is refused', async () => {
    const w = world({ users: [userRow({ status: 'DISABLED' })] });
    await expectAppError(w.service.verify(verifyInput), 'FORBIDDEN');
    expect(w.repo.createSession).not.toHaveBeenCalled();
  });

  it('BR-153j: schemas accept the documented bodies and reject unknown keys / bad codes', () => {
    expect(customerOtpSendBody.safeParse({ mobile: MOBILE }).success).toBe(true);
    expect(customerOtpSendBody.safeParse({ mobile: MOBILE, purpose: 'LOGIN' }).success).toBe(false);
    expect(
      customerOtpVerifyBody.safeParse({ ...verifyInput, preferredLocale: 'ta', deviceInfo: { platform: 'android' } }).success,
    ).toBe(true);
    expect(customerOtpVerifyBody.safeParse({ ...verifyInput, otp: '12345' }).success).toBe(false);
    expect(customerOtpVerifyBody.safeParse({ ...verifyInput, password: 'x' }).success).toBe(false);
  });
});
