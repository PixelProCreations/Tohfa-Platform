import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { createApp } from '../../app.js';
import { signOAuthLinkToken, signRefreshToken, verifyOAuthLinkToken } from '../../auth/jwt.js';
import { isAccessTokenInvalidated } from '../../auth/tokenInvalidation.js';
import { AppError } from '../../http/problem.js';
import { pingRedis } from '../../redis.js';
import { createAuthService } from './auth.service.js';
import { changePasswordBody } from './auth.schema.js';
import type { AuthRepo, OAuthIdentityRow, OtpVerificationRow, RefreshTokenRow } from './auth.repo.js';
import type { OAuthProviderClient } from './oauth.providers.js';
import { anActor, databaseReady, describeIfDatabase } from '../../test/factories.js';

function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * `resetPassword`/`changePassword` now stamp a Redis invalidation marker
 * (see auth/tokenInvalidation.ts) after their DB transaction commits. Those
 * assertions need real Redis, same as the DB-gated tests around them need
 * real Postgres; soft-skip rather than fail the whole file when Redis isn't
 * reachable, mirroring `databaseReady` in test/factories.ts.
 */
async function redisAvailableForTest(): Promise<boolean> {
  try {
    return await pingRedis();
  } catch {
    return false;
  }
}

function mockRepo(overrides: Partial<AuthRepo> = {}): AuthRepo {
  return {
    findUserByMobile: async () => null,
    findUserByEmail: async () => null,
    findUserById: async () => null,
    getUserRoles: async () => [],
    getUserPermissions: async () => [],
    createCustomerUser: async (_db, params) => ({
      id: '00000000-0000-0000-0000-000000000001',
      mobile: params.mobile,
      email: params.email ?? null,
      password_hash: params.passwordHash,
      full_name: params.fullName,
      preferred_locale: params.preferredLocale,
      user_type: 'CUSTOMER',
      status: 'ACTIVE',
      mfa_enabled: false,
      last_login_at: null,
      created_at: new Date(),
    }),
    updateUserPassword: async () => {},
    updateUserStatus: async () => {},
    updateUserLastLogin: async () => {},
    createSession: async (_db, params) => ({
      id: '11111111-1111-1111-1111-111111111111',
      user_id: params.userId,
      device_id: params.deviceId ?? null,
      platform: params.platform ?? null,
      fcm_token: null,
      user_agent: params.userAgent ?? null,
      last_seen_ip: params.ip ?? null,
      issued_at: new Date(),
      expires_at: params.expiresAt,
      last_seen_at: null,
      revoked_at: null,
      revoked_by: null,
      revoke_reason: null,
    }),
    findSessionById: async () => null,
    revokeSession: async () => {},
    revokeAllUserSessions: async () => {},
    createRefreshToken: async (_db, params) => ({
      id: '22222222-2222-2222-2222-222222222222',
      session_id: params.sessionId,
      user_id: params.userId,
      token_hash: params.tokenHash,
      issued_at: new Date(),
      expires_at: params.expiresAt,
      used_at: null,
      revoked_at: null,
      replaced_by: null,
    }),
    findRefreshTokenByHash: async () => null,
    rotateRefreshToken: async (_db, _oldId, params) => ({
      id: '33333333-3333-3333-3333-333333333333',
      session_id: params.sessionId,
      user_id: params.userId,
      token_hash: params.tokenHash,
      issued_at: new Date(),
      expires_at: params.expiresAt,
      used_at: null,
      revoked_at: null,
      replaced_by: null,
    }),
    revokeSessionTokenFamily: async () => {},
    createOtpVerification: async (_db, params) => ({
      id: '44444444-4444-4444-4444-444444444444',
      user_id: params.userId ?? null,
      mobile: params.mobile,
      purpose: params.purpose,
      code_hash: params.codeHash,
      attempts: 0,
      max_attempts: params.maxAttempts,
      locked_at: null,
      expires_at: params.expiresAt,
      consumed_at: null,
      resend_count: 0,
      last_sent_at: new Date(),
      created_at: new Date(),
    }),
    findLatestOtp: async () => null,
    findOtpById: async () => null,
    incrementOtpAttempts: async () => null,
    consumeOtp: async () => {},
    findOAuthIdentity: async () => null,
    findOAuthIdentityByUserAndProvider: async () => null,
    createOAuthIdentity: async (_db, params) => ({
      id: '55555555-5555-5555-5555-555555555555',
      user_id: params.userId,
      provider: params.provider,
      provider_subject_id: params.providerSubjectId,
      email: params.email ?? null,
      linked_at: new Date(),
      created_at: new Date(),
    }),
    deleteOAuthIdentity: async () => null,
    ...overrides,
  };
}

function fakeOAuthClient(overrides: Partial<OAuthProviderClient> = {}): OAuthProviderClient {
  return {
    verifyGoogleToken: async () => ({
      subjectId: 'google-sub-1',
      email: 'priya@example.com',
      fullName: 'Priya Raman',
      photoUrl: 'https://lh3.googleusercontent.com/a/photo.jpg',
    }),
    verifyFacebookToken: async () => ({
      subjectId: 'fb-sub-1',
      email: 'priya@example.com',
      fullName: 'Priya Raman',
    }),
    ...overrides,
  };
}

describe('Auth Module & BR-32 Test Contract', () => {
  describe('BR-32a: OTP 3-attempt lockout', () => {
    it('BR-32a: 4th wrong attempt -> 429 OTP_LOCKED and challenge stays dead for correct code', async () => {
      const correctCode = '123456';
      const challengeId = '44444444-4444-4444-4444-444444444444';

      let challenge: OtpVerificationRow = {
        id: challengeId,
        user_id: null,
        mobile: '+919000000001',
        purpose: 'LOGIN',
        code_hash: hashValue(correctCode),
        attempts: 0,
        max_attempts: 3,
        locked_at: null,
        expires_at: new Date(Date.now() + 300000),
        consumed_at: null,
        resend_count: 0,
        last_sent_at: new Date(),
        created_at: new Date(),
      };

      const repo = mockRepo({
        findOtpById: async () => challenge,
        incrementOtpAttempts: async (_db, _id, lock) => {
          challenge = {
            ...challenge,
            attempts: challenge.attempts + 1,
            locked_at: lock ? new Date() : null,
          };
          return challenge;
        },
      });

      const service = createAuthService(repo);

      // Attempt 1: wrong code -> 401 OTP_INVALID
      await expect(service.verifyOtp({ challengeId, code: '000000' })).rejects.toThrow(
        expect.objectContaining({ code: 'OTP_INVALID', status: 401 }),
      );
      expect(challenge.attempts).toBe(1);

      // Attempt 2: wrong code -> 401 OTP_INVALID
      await expect(service.verifyOtp({ challengeId, code: '000000' })).rejects.toThrow(
        expect.objectContaining({ code: 'OTP_INVALID', status: 401 }),
      );
      expect(challenge.attempts).toBe(2);

      // Attempt 3: wrong code -> 429 OTP_LOCKED (locks challenge on 3rd failure)
      await expect(service.verifyOtp({ challengeId, code: '000000' })).rejects.toThrow(
        expect.objectContaining({ code: 'OTP_LOCKED', status: 429 }),
      );
      expect(challenge.attempts).toBe(3);
      expect(challenge.locked_at).not.toBeNull();

      // 4th attempt: even with CORRECT code, challenge is locked -> 429 OTP_LOCKED
      await expect(service.verifyOtp({ challengeId, code: correctCode })).rejects.toThrow(
        expect.objectContaining({ code: 'OTP_LOCKED', status: 429 }),
      );
    });
  });

  describe('BR-32b: 60-second OTP resend cooldown', () => {
    it('BR-32b: Resend at 59s -> 429 OTP_RESEND_TOO_SOON; at 61s -> accepted', async () => {
      const mobile = '+919000000001';

      // Case 1: Last sent 59 seconds ago
      const recentOtp: OtpVerificationRow = {
        id: '44444444-4444-4444-4444-444444444444',
        user_id: null,
        mobile,
        purpose: 'LOGIN',
        code_hash: 'abc',
        attempts: 0,
        max_attempts: 3,
        locked_at: null,
        expires_at: new Date(Date.now() + 240000),
        consumed_at: null,
        resend_count: 0,
        last_sent_at: new Date(Date.now() - 59 * 1000), // 59s ago
        created_at: new Date(Date.now() - 59 * 1000),
      };

      const repoRecent = mockRepo({
        findLatestOtp: async () => recentOtp,
      });
      const serviceRecent = createAuthService(repoRecent);

      await expect(serviceRecent.sendOtp({ mobile, purpose: 'LOGIN' })).rejects.toThrow(
        expect.objectContaining({ code: 'OTP_RESEND_TOO_SOON', status: 429 }),
      );

      // Case 2: Last sent 61 seconds ago
      const agedOtp: OtpVerificationRow = {
        ...recentOtp,
        last_sent_at: new Date(Date.now() - 61 * 1000), // 61s ago
      };

      const repoAged = mockRepo({
        findLatestOtp: async () => agedOtp,
      });
      const serviceAged = createAuthService(repoAged);

      const result = await serviceAged.sendOtp({ mobile, purpose: 'LOGIN' });
      expect(result).toHaveProperty('challengeId');
      expect(result).toHaveProperty('attemptsRemaining', 3);
    });
  });

  describe('Refresh Token Rotation & Theft Detection', () => {
    it('reusing a rotated refresh token revokes the entire session', async () => {
      let revokedSessionId: string | null = null;

      const validJwt = signRefreshToken({ sub: 'user-1', jti: 'session-123' });
      const tokenHash = hashValue(validJwt);

      const rotatedToken: RefreshTokenRow = {
        id: 'token-1',
        session_id: 'session-123',
        user_id: 'user-1',
        token_hash: tokenHash,
        issued_at: new Date(),
        expires_at: new Date(Date.now() + 1000000),
        used_at: new Date(), // Already used / rotated!
        revoked_at: null,
        replaced_by: 'token-2',
      };

      const repo = mockRepo({
        findRefreshTokenByHash: async () => rotatedToken,
        revokeSessionTokenFamily: async (_db, sessionId) => {
          revokedSessionId = sessionId;
        },
      });

      const service = createAuthService(repo);

      // Expect 401 UNAUTHENTICATED on reused token
      await expect(service.refreshToken(validJwt)).rejects.toThrow(
        expect.objectContaining({ code: 'UNAUTHENTICATED' }),
      );

      // Assert that the entire session family was revoked
      expect(revokedSessionId).toBe('session-123');
    });
  });

  describe('BR-39: OAuth is login/linking only, never a bypass of mobile+OTP', () => {
    it('BR-39b: a verified token with no linked identity returns NOT_LINKED + profile + linkToken, no tokens issued', async () => {
      const repo = mockRepo({ findOAuthIdentity: async () => null });
      const service = createAuthService(repo, fakeOAuthClient());

      const result = (await service.loginWithOAuth('google', { token: 'valid-google-token' })) as {
        status: string;
        profile: { fullName?: string; email?: string; photoUrl?: string };
        linkToken: string;
      };

      expect(result.status).toBe('NOT_LINKED');
      expect(result.profile.email).toBe('priya@example.com');
      expect(result.profile.fullName).toBe('Priya Raman');
      expect(result).not.toHaveProperty('accessToken');

      // The linkToken is real and carries the verified profile through to
      // /auth/otp/verify.
      const payload = verifyOAuthLinkToken(result.linkToken);
      expect(payload.provider).toBe('GOOGLE');
      expect(payload.providerSubjectId).toBe('google-sub-1');
      expect(payload.email).toBe('priya@example.com');
    });

    it('BR-39e: POST /auth/me/oauth/link against an identity already linked to a DIFFERENT account fails with OAUTH_IDENTITY_ALREADY_LINKED', async () => {
      const repo = mockRepo({
        findOAuthIdentity: async () => ({
          id: 'identity-other',
          user_id: 'someone-else',
          provider: 'GOOGLE',
          provider_subject_id: 'google-sub-1',
          email: 'other@example.com',
          linked_at: new Date(),
          created_at: new Date(),
        }),
      });
      const service = createAuthService(repo, fakeOAuthClient());
      const actor = anActor({ userId: 'me-user-id' });

      await expect(
        service.linkOAuthIdentity(actor, { provider: 'google', token: 'valid-google-token' }),
      ).rejects.toThrow(expect.objectContaining({ code: 'OAUTH_IDENTITY_ALREADY_LINKED', status: 409 }));
    });

    it('BR-39f: a provider that rejects the token surfaces OAUTH_TOKEN_INVALID, not a generic 401', async () => {
      const repo = mockRepo();
      const service = createAuthService(
        repo,
        fakeOAuthClient({
          verifyGoogleToken: async () => {
            throw new AppError('OAUTH_TOKEN_INVALID', { detail: 'Google rejected the ID token.' });
          },
        }),
      );

      await expect(service.loginWithOAuth('google', { token: 'garbage' })).rejects.toThrow(
        expect.objectContaining({ code: 'OAUTH_TOKEN_INVALID', status: 401 }),
      );
    });

    it('BR-39f: a malformed/tampered linkToken passed to /auth/otp/verify surfaces OAUTH_LINK_TOKEN_INVALID, not a generic 401', async () => {
      const correctCode = '333444';
      const challengeId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
      const challenge: OtpVerificationRow = {
        id: challengeId,
        user_id: null,
        mobile: '+919000000097',
        purpose: 'REGISTRATION',
        code_hash: hashValue(correctCode),
        attempts: 0,
        max_attempts: 3,
        locked_at: null,
        expires_at: new Date(Date.now() + 300000),
        consumed_at: null,
        resend_count: 0,
        last_sent_at: new Date(),
        created_at: new Date(),
      };

      const repo = mockRepo({
        findOtpById: async () => challenge,
        findUserByMobile: async () => null,
      });
      const service = createAuthService(repo);

      await expect(
        service.verifyOtp({ challengeId, code: correctCode, linkToken: 'not-a-real-jwt' }),
      ).rejects.toThrow(expect.objectContaining({ code: 'OAUTH_LINK_TOKEN_INVALID', status: 401 }));
    });

    // The remaining BR-39 cases exercise the success path, which — like
    // `login`/`verifyOtp` themselves — reaches the database directly for the
    // farmer/customer lookup and/or `withTransaction`, not only through the
    // mocked repo. They run only when DATABASE_URL points at a real,
    // migrated Postgres (see apps/api/CLAUDE.md's "Tests" section).
    describeIfDatabase('success paths (real database)', () => {
      it('BR-39a: a verified Google token for an already-linked identity logs in like /auth/login', async () => {
        if (!(await databaseReady('users'))) return;

        const linkedUserId = '66666666-6666-6666-6666-666666666666';
        const repo = mockRepo({
          findOAuthIdentity: async () => ({
            id: 'identity-1',
            user_id: linkedUserId,
            provider: 'GOOGLE',
            provider_subject_id: 'google-sub-1',
            email: 'priya@example.com',
            linked_at: new Date(),
            created_at: new Date(),
          }),
          findUserById: async () => ({
            id: linkedUserId,
            mobile: '+919876500001',
            email: 'priya@example.com',
            password_hash: null,
            full_name: 'Priya Raman',
            preferred_locale: 'en',
            user_type: 'CUSTOMER',
            status: 'ACTIVE',
            mfa_enabled: false,
            last_login_at: null,
            created_at: new Date(),
          }),
          getUserRoles: async () => [],
        });

        const service = createAuthService(repo, fakeOAuthClient());
        const result = (await service.loginWithOAuth('google', { token: 'valid-google-token' })) as {
          accessToken: string;
          requiresRoleSelection: boolean;
        };

        expect(result.accessToken).toBeTypeOf('string');
        expect(result.requiresRoleSelection).toBe(false);
      });

      it('BR-39c: OTP-verify with a valid linkToken for a brand-new mobile number creates the account AND links the identity', async () => {
        if (!(await databaseReady('oauth_identities'))) return;

        const correctCode = '654321';
        const challengeId = '77777777-7777-7777-7777-777777777777';
        const mobile = '+919000000099';

        const challenge: OtpVerificationRow = {
          id: challengeId,
          user_id: null,
          mobile,
          purpose: 'REGISTRATION',
          code_hash: hashValue(correctCode),
          attempts: 0,
          max_attempts: 3,
          locked_at: null,
          expires_at: new Date(Date.now() + 300000),
          consumed_at: null,
          resend_count: 0,
          last_sent_at: new Date(),
          created_at: new Date(),
        };

        let createdUserId: string | null = null;
        let createCustomerUserCalls = 0;
        let createOAuthIdentityCalls = 0;

        const repo = mockRepo({
          findOtpById: async () => challenge,
          findUserByMobile: async () => null,
          createCustomerUser: async (_db, params) => {
            createCustomerUserCalls += 1;
            // A real seeded user id (db/seed/003_dev_users.sql) — not
            // semantically meaningful here, only load-bearing: `repo` is
            // mocked so this "created" row is never really inserted, but the
            // service's `writeAuditLog` call right after IS a real INSERT
            // whose `actor_id` carries a live FK to `users(id)`.
            createdUserId = '00000000-0000-0000-0000-000000000001';
            return {
              id: createdUserId,
              mobile: params.mobile,
              email: params.email ?? null,
              password_hash: params.passwordHash,
              full_name: params.fullName,
              preferred_locale: params.preferredLocale,
              user_type: 'CUSTOMER',
              status: params.status ?? 'ACTIVE',
              mfa_enabled: false,
              last_login_at: null,
              created_at: new Date(),
            };
          },
          createOAuthIdentity: async (_db, params): Promise<OAuthIdentityRow> => {
            createOAuthIdentityCalls += 1;
            expect(params.userId).toBe(createdUserId);
            return {
              id: 'identity-new',
              user_id: params.userId,
              provider: params.provider,
              provider_subject_id: params.providerSubjectId,
              email: params.email ?? null,
              linked_at: new Date(),
              created_at: new Date(),
            };
          },
        });

        const service = createAuthService(repo);
        const linkToken = signOAuthLinkToken({
          provider: 'GOOGLE',
          providerSubjectId: 'google-sub-new',
          email: 'newperson@example.com',
          fullName: 'New Person',
        });

        const result = (await service.verifyOtp({ challengeId, code: correctCode, linkToken })) as {
          accessToken: string;
          oauthProfile?: { fullName?: string; email?: string };
        };

        expect(createCustomerUserCalls).toBe(1);
        expect(createOAuthIdentityCalls).toBe(1);
        expect(result.accessToken).toBeTypeOf('string');
        expect(result.oauthProfile?.email).toBe('newperson@example.com');
      });

      it('BR-39d: OTP-verify with a valid linkToken for an EXISTING mobile number links to that account instead of creating a duplicate', async () => {
        if (!(await databaseReady('oauth_identities'))) return;

        const correctCode = '111222';
        const challengeId = '99999999-9999-9999-9999-999999999999';
        // A real seeded user id (db/seed/003_dev_users.sql) — see the same
        // note on BR-39c above: `writeAuditLog` inside the link branch does a
        // real INSERT whose actor_id needs a live FK target.
        const existingUserId = '00000000-0000-0000-0000-000000000002';
        const mobile = '+919000000098';

        const challenge: OtpVerificationRow = {
          id: challengeId,
          user_id: existingUserId,
          mobile,
          purpose: 'LOGIN',
          code_hash: hashValue(correctCode),
          attempts: 0,
          max_attempts: 3,
          locked_at: null,
          expires_at: new Date(Date.now() + 300000),
          consumed_at: null,
          resend_count: 0,
          last_sent_at: new Date(),
          created_at: new Date(),
        };

        let createCustomerUserCalls = 0;
        let createOAuthIdentityCalls = 0;

        const repo = mockRepo({
          findOtpById: async () => challenge,
          findUserById: async () => ({
            id: existingUserId,
            mobile,
            email: null,
            password_hash: 'hash',
            full_name: 'Existing User',
            preferred_locale: 'en',
            user_type: 'CUSTOMER',
            status: 'ACTIVE',
            mfa_enabled: false,
            last_login_at: null,
            created_at: new Date(),
          }),
          createCustomerUser: async () => {
            createCustomerUserCalls += 1;
            throw new Error('must not create a new account for an existing mobile number');
          },
          findOAuthIdentity: async () => null,
          createOAuthIdentity: async (_db, params): Promise<OAuthIdentityRow> => {
            createOAuthIdentityCalls += 1;
            expect(params.userId).toBe(existingUserId);
            return {
              // audit_log.entity_id is `uuid` (no FK, but the column type
              // still rejects a non-UUID string).
              id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
              user_id: params.userId,
              provider: params.provider,
              provider_subject_id: params.providerSubjectId,
              email: params.email ?? null,
              linked_at: new Date(),
              created_at: new Date(),
            };
          },
        });

        const service = createAuthService(repo);
        const linkToken = signOAuthLinkToken({
          provider: 'GOOGLE',
          providerSubjectId: 'google-sub-existing',
          email: 'existing@example.com',
        });

        const result = (await service.verifyOtp({ challengeId, code: correctCode, linkToken })) as {
          accessToken: string;
        };

        expect(createCustomerUserCalls).toBe(0);
        expect(createOAuthIdentityCalls).toBe(1);
        expect(result.accessToken).toBeTypeOf('string');
      });

      it('unlink removes the row', async () => {
        if (!(await databaseReady('oauth_identities'))) return;

        let deleteCalledWith: { userId: string; provider: string } | null = null;
        const repo = mockRepo({
          deleteOAuthIdentity: async (_db, userId, provider): Promise<OAuthIdentityRow> => {
            deleteCalledWith = { userId, provider };
            return {
              // See the BR-39d note above: audit_log.entity_id is `uuid`.
              id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
              user_id: userId,
              provider,
              provider_subject_id: 'google-sub-1',
              email: null,
              linked_at: new Date(),
              created_at: new Date(),
            };
          },
        });
        const service = createAuthService(repo, fakeOAuthClient());
        // A real seeded user id (db/seed/003_dev_users.sql) — `writeAuditLog`
        // after the delete needs a live FK target, same as BR-39c/d above.
        const actor = anActor({ userId: '00000000-0000-0000-0000-000000000003' });

        await service.unlinkOAuthIdentity(actor, 'google');

        expect(deleteCalledWith).toEqual({
          userId: '00000000-0000-0000-0000-000000000003',
          provider: 'GOOGLE',
        });
      });
    });
  });

  describe('HTTP Schema Validation', () => {
    const app = createApp();

    it('POST /v1/auth/otp/send rejects invalid mobile format with 422', async () => {
      const res = await request(app)
        .post('/v1/auth/otp/send')
        .send({ mobile: 'invalid-mobile', purpose: 'LOGIN' });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('VALIDATION_FAILED');
    });

    it('POST /v1/auth/register/customer rejects short password with 422', async () => {
      const res = await request(app)
        .post('/v1/auth/register/customer')
        .send({
          mobile: '+919876543210',
          fullName: 'Test User',
          password: 'short',
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('VALIDATION_FAILED');
    });
  });

  describeIfDatabase('Integration against PostgreSQL', () => {
    const app = createApp();

    it('POST /v1/auth/forgot-password always responds with 202 on real database', async () => {
      if (!(await databaseReady('otp_verifications'))) return;

      const randMobile = `+91987654${Math.floor(1000 + Math.random() * 9000)}`;
      const res = await request(app)
        .post('/v1/auth/forgot-password')
        .send({ mobile: randMobile });

      expect(res.status).toBe(202);
      expect(res.body).toHaveProperty('challengeId');
    });
  });

  describe('Multi-role login (login())', () => {
    const mobile = '+919876500011';
    const plainPassword = 'CorrectHorse99!';
    let passwordHash: string;

    beforeAll(async () => {
      // Real bcrypt hash, matching how auth.service.ts's login() actually
      // compares (bcrypt.compare against user.password_hash) — a fake string
      // would make every login attempt fail regardless of what we're testing.
      passwordHash = await bcrypt.hash(plainPassword, 12);
    });

    function adminUser(): NonNullable<Awaited<ReturnType<AuthRepo['findUserByMobile']>>> {
      return {
        id: '00000000-0000-4000-8000-000000000101',
        mobile,
        email: null,
        password_hash: passwordHash,
        full_name: 'Multi Role Admin',
        preferred_locale: 'en',
        // ADMIN + non-FARMER/CUSTOMER role codes below so the service never
        // takes the `pool.query(...)` farmer/customer lookup branches
        // (auth.service.ts lines ~516-531) — keeps this a pure mocked-repo
        // unit test with no live database required.
        user_type: 'ADMIN',
        status: 'ACTIVE',
        mfa_enabled: false,
        last_login_at: null,
        created_at: new Date(),
      };
    }

    it('a user with more than one role assignment and no roleCode gets requiresRoleSelection with no tokens', async () => {
      const repo = mockRepo({
        findUserByMobile: async () => adminUser(),
        getUserRoles: async () => [
          { role_code: 'TOHFA_ADMIN', warehouse_id: null, warehouse_name: null, zone_id: null, zone_name: null },
          { role_code: 'SUB_WH_ADMIN', warehouse_id: null, warehouse_name: null, zone_id: null, zone_name: null },
        ],
      });
      const service = createAuthService(repo);

      const result = (await service.login({ mobile, password: plainPassword })) as {
        requiresRoleSelection: boolean;
        availableRoles: Array<{ code: string; warehouseId?: string; zoneId?: string }>;
        accessToken?: string;
      };

      expect(result).toEqual({
        requiresRoleSelection: true,
        availableRoles: [
          { code: 'TOHFA_ADMIN', warehouseId: undefined, zoneId: undefined },
          { code: 'SUB_WH_ADMIN', warehouseId: undefined, zoneId: undefined },
        ],
      });
      expect(result).not.toHaveProperty('accessToken');
    });

    it('the same multi-role user supplying a valid roleCode gets real tokens scoped to only that role', async () => {
      const repo = mockRepo({
        findUserByMobile: async () => adminUser(),
        getUserRoles: async () => [
          { role_code: 'TOHFA_ADMIN', warehouse_id: null, warehouse_name: null, zone_id: null, zone_name: null },
          { role_code: 'SUB_WH_ADMIN', warehouse_id: null, warehouse_name: null, zone_id: null, zone_name: null },
        ],
      });
      const service = createAuthService(repo);

      const result = (await service.login({
        mobile,
        password: plainPassword,
        roleCode: 'TOHFA_ADMIN',
      })) as {
        requiresRoleSelection: boolean;
        accessToken: string;
        user: { roles: Array<{ code: string }> };
      };

      expect(result.requiresRoleSelection).toBe(false);
      expect(result.accessToken).toBeTypeOf('string');
      expect(result.user.roles).toHaveLength(1);
      expect(result.user.roles[0]?.code).toBe('TOHFA_ADMIN');
    });

    it('a user with only one role assignment never gets requiresRoleSelection, even without a roleCode', async () => {
      const repo = mockRepo({
        findUserByMobile: async () => adminUser(),
        getUserRoles: async () => [
          { role_code: 'TOHFA_ADMIN', warehouse_id: null, warehouse_name: null, zone_id: null, zone_name: null },
        ],
      });
      const service = createAuthService(repo);

      const result = (await service.login({ mobile, password: plainPassword })) as {
        requiresRoleSelection: boolean;
        accessToken: string;
      };

      expect(result.requiresRoleSelection).toBe(false);
      expect(result.accessToken).toBeTypeOf('string');
    });
  });

  describe('resetPassword()', () => {
    it('an invalid OTP code is rejected with OTP_INVALID, reusing verifyOtp\'s OTP-checking logic', async () => {
      const correctCode = '445566';
      const challengeId = '88888888-8888-8888-8888-888888888888';

      const challenge: OtpVerificationRow = {
        id: challengeId,
        user_id: null,
        mobile: '+919000000055',
        purpose: 'PASSWORD_RESET',
        code_hash: hashValue(correctCode),
        attempts: 0,
        max_attempts: 3,
        locked_at: null,
        expires_at: new Date(Date.now() + 300000),
        consumed_at: null,
        resend_count: 0,
        last_sent_at: new Date(),
        created_at: new Date(),
      };

      const repo = mockRepo({
        findOtpById: async () => challenge,
        incrementOtpAttempts: async () => null,
      });
      const service = createAuthService(repo);

      await expect(
        service.resetPassword({ challengeId, code: '000000', newPassword: 'BrandNewPassword1' }),
      ).rejects.toThrow(expect.objectContaining({ code: 'OTP_INVALID', status: 401 }));
    });

    it('a locked OTP challenge is rejected with OTP_LOCKED and never touches the password or sessions', async () => {
      const challengeId = '77777777-aaaa-bbbb-cccc-777777777777';

      const challenge: OtpVerificationRow = {
        id: challengeId,
        user_id: null,
        mobile: '+919000000056',
        purpose: 'PASSWORD_RESET',
        code_hash: hashValue('999999'),
        attempts: 3,
        max_attempts: 3,
        locked_at: new Date(),
        expires_at: new Date(Date.now() + 300000),
        consumed_at: null,
        resend_count: 0,
        last_sent_at: new Date(),
        created_at: new Date(),
      };

      let updateUserPasswordCalls = 0;
      let revokeAllUserSessionsCalls = 0;

      const repo = mockRepo({
        findOtpById: async () => challenge,
        updateUserPassword: async () => {
          updateUserPasswordCalls += 1;
        },
        revokeAllUserSessions: async () => {
          revokeAllUserSessionsCalls += 1;
        },
      });
      const service = createAuthService(repo);

      await expect(
        service.resetPassword({ challengeId, code: '999999', newPassword: 'BrandNewPassword1' }),
      ).rejects.toThrow(expect.objectContaining({ code: 'OTP_LOCKED', status: 429 }));

      expect(updateUserPasswordCalls).toBe(0);
      expect(revokeAllUserSessionsCalls).toBe(0);
    });

    // The success path calls `withTransaction`, which opens a REAL
    // pool.connect() + BEGIN/COMMIT against Postgres even though `repo` here
    // is mocked (see db/pool.ts). Gated the same way as BR-39c/d above.
    describeIfDatabase('success path (real database transaction)', () => {
      it('hashes the new password with bcrypt and revokes every session for that user', async () => {
        if (!(await databaseReady('users'))) return;

        const correctCode = '246810';
        const challengeId = '55555555-6666-7777-8888-999999999999';
        const mobile = '+919000000057';
        const userId = '00000000-0000-4000-8000-000000000102';
        const oldPasswordHash = await bcrypt.hash('OldPassword123', 12);
        const newPassword = 'BrandNewPassword2';

        const challenge: OtpVerificationRow = {
          id: challengeId,
          user_id: null,
          mobile,
          purpose: 'PASSWORD_RESET',
          code_hash: hashValue(correctCode),
          attempts: 0,
          max_attempts: 3,
          locked_at: null,
          expires_at: new Date(Date.now() + 300000),
          consumed_at: null,
          resend_count: 0,
          last_sent_at: new Date(),
          created_at: new Date(),
        };

        let capturedPasswordHash: string | null = null;
        let revokeAllUserSessionsCalledWith:
          | { userId: string; revokedBy: string | undefined; reason: string | undefined }
          | null = null;
        let consumeOtpCalledWith: string | null = null;

        const repo = mockRepo({
          findOtpById: async () => challenge,
          consumeOtp: async (_db, id) => {
            consumeOtpCalledWith = id;
          },
          findUserByMobile: async () => ({
            id: userId,
            mobile,
            email: null,
            password_hash: oldPasswordHash,
            full_name: 'Reset Password User',
            preferred_locale: 'en',
            user_type: 'CUSTOMER',
            status: 'ACTIVE',
            mfa_enabled: false,
            last_login_at: null,
            created_at: new Date(),
          }),
          updateUserPassword: async (_db, uid, passwordHash) => {
            capturedPasswordHash = passwordHash;
            expect(uid).toBe(userId);
          },
          revokeAllUserSessions: async (_db, uid, revokedBy, reason) => {
            revokeAllUserSessionsCalledWith = { userId: uid, revokedBy, reason };
          },
        });
        const service = createAuthService(repo);

        await service.resetPassword({ challengeId, code: correctCode, newPassword });

        expect(consumeOtpCalledWith).toBe(challengeId);

        expect(capturedPasswordHash).toBeTypeOf('string');
        expect(capturedPasswordHash).not.toBe(oldPasswordHash);
        expect(await bcrypt.compare(newPassword, capturedPasswordHash as unknown as string)).toBe(true);

        expect(revokeAllUserSessionsCalledWith).toEqual({
          userId,
          revokedBy: userId,
          reason: 'PASSWORD_RESET_ALL_SESSIONS',
        });

        // The other half of the fix (auth/tokenInvalidation.ts): revoking
        // refresh tokens/sessions is not enough on its own -- an access token
        // already issued must ALSO stop working immediately, not ride out its
        // remaining TTL. Before this fix, `isAccessTokenInvalidated` did not
        // exist and this old token would have kept passing `requireAuth`.
        if (await redisAvailableForTest()) {
          const iatBeforeReset = Math.floor(Date.now() / 1000) - 5;
          await expect(isAccessTokenInvalidated(userId, iatBeforeReset)).resolves.toBe(true);

          // A token minted AFTER the reset must be unaffected.
          const iatAfterReset = Math.floor(Date.now() / 1000) + 5;
          await expect(isAccessTokenInvalidated(userId, iatAfterReset)).resolves.toBe(false);
        }
      });
    });
  });

  describe('changePassword()', () => {
    it('BR-schema: newPassword shorter than 10 characters is rejected by the schema', () => {
      const result = changePasswordBody.safeParse({
        currentPassword: 'CorrectHorse99!',
        newPassword: 'short1234',
      });

      expect(result.success).toBe(false);
    });

    it('wrong current password is rejected with UNAUTHENTICATED and never touches the password or sessions', async () => {
      const actor = anActor({ userId: '99999999-1111-2222-3333-444444444444' });
      const correctPasswordHash = await bcrypt.hash('ActualPassword123', 12);

      let updateUserPasswordCalls = 0;
      let revokeAllUserSessionsCalls = 0;

      const repo = mockRepo({
        findUserById: async () => ({
          id: actor.userId,
          mobile: '+919000000090',
          email: null,
          password_hash: correctPasswordHash,
          full_name: 'Change Password User',
          preferred_locale: 'en',
          user_type: 'CUSTOMER',
          status: 'ACTIVE',
          mfa_enabled: false,
          last_login_at: null,
          created_at: new Date(),
        }),
        updateUserPassword: async () => {
          updateUserPasswordCalls += 1;
        },
        revokeAllUserSessions: async () => {
          revokeAllUserSessionsCalls += 1;
        },
      });
      const service = createAuthService(repo);

      await expect(
        service.changePassword(actor, { currentPassword: 'WrongPassword123', newPassword: 'BrandNewPassword1' }),
      ).rejects.toThrow(expect.objectContaining({ code: 'UNAUTHENTICATED' }));

      expect(updateUserPasswordCalls).toBe(0);
      expect(revokeAllUserSessionsCalls).toBe(0);
    });

    it('an account with no password set (OAuth-only) is rejected with UNAUTHENTICATED', async () => {
      const actor = anActor({ userId: '99999999-5555-6666-7777-888888888888' });

      const repo = mockRepo({
        findUserById: async () => ({
          id: actor.userId,
          mobile: '+919000000091',
          email: 'oauth-only@example.com',
          password_hash: null,
          full_name: 'OAuth Only User',
          preferred_locale: 'en',
          user_type: 'CUSTOMER',
          status: 'ACTIVE',
          mfa_enabled: false,
          last_login_at: null,
          created_at: new Date(),
        }),
      });
      const service = createAuthService(repo);

      await expect(
        service.changePassword(actor, { currentPassword: 'Whatever123', newPassword: 'BrandNewPassword1' }),
      ).rejects.toThrow(
        expect.objectContaining({
          code: 'UNAUTHENTICATED',
          detail: "This account doesn't have a password set yet. Use 'Forgot password' instead.",
        }),
      );
    });

    // Same shape as resetPassword's real-database test above: `repo` here is
    // still mocked, but `changePassword` opens a REAL pool.connect() +
    // BEGIN/COMMIT via withTransaction, so this is gated the same way.
    describeIfDatabase('success path (real database transaction)', () => {
      it('hashes the new password with bcrypt and revokes every session for that user', async () => {
        if (!(await databaseReady('users'))) return;

        const userId = '00000000-0000-4000-8000-000000000103';
        const oldPassword = 'OldPassword123';
        const oldPasswordHash = await bcrypt.hash(oldPassword, 12);
        const newPassword = 'BrandNewPassword3';
        const actor = anActor({ userId });

        let capturedPasswordHash: string | null = null;
        let revokeAllUserSessionsCalledWith:
          | { userId: string; revokedBy: string | undefined; reason: string | undefined }
          | null = null;

        const repo = mockRepo({
          findUserById: async () => ({
            id: userId,
            mobile: '+919000000058',
            email: null,
            password_hash: oldPasswordHash,
            full_name: 'Change Password User',
            preferred_locale: 'en',
            user_type: 'CUSTOMER',
            status: 'ACTIVE',
            mfa_enabled: false,
            last_login_at: null,
            created_at: new Date(),
          }),
          updateUserPassword: async (_db, uid, passwordHash) => {
            capturedPasswordHash = passwordHash;
            expect(uid).toBe(userId);
          },
          revokeAllUserSessions: async (_db, uid, revokedBy, reason) => {
            revokeAllUserSessionsCalledWith = { userId: uid, revokedBy, reason };
          },
        });
        const service = createAuthService(repo);

        await service.changePassword(actor, { currentPassword: oldPassword, newPassword });

        expect(capturedPasswordHash).toBeTypeOf('string');
        expect(capturedPasswordHash).not.toBe(oldPasswordHash);
        // (a) the new password hash actually works for a subsequent login attempt
        expect(await bcrypt.compare(newPassword, capturedPasswordHash as unknown as string)).toBe(true);
        // (b) the old password no longer works against the new hash
        expect(await bcrypt.compare(oldPassword, capturedPasswordHash as unknown as string)).toBe(false);

        // (c) sessions were revoked -- same call shape resetPassword's test checks.
        expect(revokeAllUserSessionsCalledWith).toEqual({
          userId,
          revokedBy: userId,
          reason: 'PASSWORD_CHANGED_ALL_SESSIONS',
        });

        // (d) the other half of the fix -- an access token issued before
        // this changePassword() call must now be rejected by
        // isAccessTokenInvalidated (and therefore by requireAuth), not just
        // have its refresh token/session revoked. This is the live bug
        // reproduced: change-password succeeded but the OLD access token
        // kept passing GET /auth/me until it naturally expired.
        if (await redisAvailableForTest()) {
          const iatBeforeChange = Math.floor(Date.now() / 1000) - 5;
          await expect(isAccessTokenInvalidated(userId, iatBeforeChange)).resolves.toBe(true);

          const iatAfterChange = Math.floor(Date.now() / 1000) + 5;
          await expect(isAccessTokenInvalidated(userId, iatAfterChange)).resolves.toBe(false);
        }
      });
    });
  });
});
