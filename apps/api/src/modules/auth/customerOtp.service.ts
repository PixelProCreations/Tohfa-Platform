import crypto from 'node:crypto';
import { type RoleCode } from '@tohfa/shared-types';
import { signTokenPair } from '../../auth/jwt.js';
import { writeAuditLog } from '../../audit/auditLog.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { isAllowedRoleSet } from '../../rbac/loadRbac.js';
import { authRepo, type AuthRepo, type UserRow } from './auth.repo.js';
import type { CustomerOtpSendBody, CustomerOtpVerifyBody, SendOtpBody } from './auth.schema.js';
import { authService } from './auth.service.js';
import { customerOtpRepo, type CustomerOtpRepo } from './customerOtp.repo.js';
import { otpProvider as defaultOtpProvider, type OtpProvider } from './otp/index.js';
import {
  PLACEHOLDER_CUSTOMER_NAME,
  profileCompleteness,
  type MissingProfileField,
} from '../customer-profile/customer-profile.completeness.js';

/**
 * BR-153: passwordless customer sign-in (mobile + OTP).
 *
 *   send   -> same BR-32 OTP machinery as /auth/otp/send (purpose LOGIN), and a
 *             response that is identical whether or not the number has an account.
 *   verify -> BR-32 checks, single-use claim of the challenge, then: existing
 *             CUSTOMER -> session; unknown number -> customer account (no password,
 *             ACTIVE, customers row, wallet) + session; any other account type ->
 *             a generic refusal (never logged in, never converted).
 */

const OTP_PURPOSE = 'LOGIN' as const;
/** full_name is NOT NULL; the customer edits it from their profile. */
const DEFAULT_CUSTOMER_NAME = PLACEHOLDER_CUSTOMER_NAME;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === '23505';
}

/** One refusal for every non-customer account, so the role is never disclosed. */
function notCustomerSignIn(): AppError {
  return new AppError('FORBIDDEN', {
    detail: 'This number cannot be used for customer sign-in.',
  });
}

export interface CustomerOtpSendResult {
  challengeId: string;
  expiresAt: string;
  resendAvailableAt: string;
  attemptsRemaining: number;
  _mockCode?: string;
}

export interface CustomerOtpVerifyResult {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  isNewUser: boolean;
  user: {
    id: string;
    fullName: string;
    mobile: string;
    userType: 'CUSTOMER';
    preferredLocale: 'en' | 'ta';
    status: 'ACTIVE';
    hasPassword: boolean;
    customerId: string;
    profileComplete: boolean;
    missingFields: MissingProfileField[];
    roles: { code: RoleCode }[];
  };
}

export interface CustomerOtpService {
  send(input: CustomerOtpSendBody): Promise<CustomerOtpSendResult>;
  verify(input: CustomerOtpVerifyBody, ip?: string, userAgent?: string): Promise<CustomerOtpVerifyResult>;
}

export interface CustomerOtpDeps {
  repo: AuthRepo;
  customerRepo: CustomerOtpRepo;
  db: Executor;
  transaction: <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;
  /** The BR-32 OTP issuer (`authService.sendOtp`): cooldown, 6 digits, 3 attempts, SMS. */
  sendOtp: (input: SendOtpBody) => Promise<unknown>;
  /** BR-218: the one OTP provider every role's verify path uses. */
  otpProvider: OtpProvider;
}

const defaultDeps: CustomerOtpDeps = {
  repo: authRepo,
  customerRepo: customerOtpRepo,
  db: pool,
  transaction: (fn) => withTransaction(fn),
  sendOtp: (input) => authService.sendOtp(input),
  otpProvider: defaultOtpProvider,
};

export function createCustomerOtpService(overrides: Partial<CustomerOtpDeps> = {}): CustomerOtpService {
  const { repo, customerRepo, db, transaction, sendOtp, otpProvider } = { ...defaultDeps, ...overrides };

  /**
   * Refuses anything that is not a live customer account (BR-153c).
   *
   * An account that holds CUSTOMER together with other roles of its BR-135 group (FARMER,
   * FARMER_ADMIN) is a customer too: BR-135 lets one person be both, and this endpoint is the
   * app's customer entry, so such an account signs in here as a customer. The session minted
   * below carries CUSTOMER alone and no farmerId, so it never opens the farmer side. Every other
   * account (no CUSTOMER role, or CUSTOMER beside a staff admin role) is still refused.
   * A legacy CUSTOMER user with no role rows at all keeps signing in as before.
   */
  async function assertCustomer(user: UserRow): Promise<void> {
    const roles = (await repo.getUserRoles(db, user.id)).map((r) => r.role_code);
    const holdsCustomer =
      roles.length === 0 ? user.user_type === 'CUSTOMER' : roles.includes('CUSTOMER') && isAllowedRoleSet(roles);
    if (!holdsCustomer) throw notCustomerSignIn();
    if (user.status === 'DISABLED') {
      throw new AppError('FORBIDDEN', { detail: 'Account has been disabled.' });
    }
  }

  return {
    async send(input) {
      // Purpose is fixed; the response is built only from the challenge, so it
      // carries nothing that differs between a registered and a new number.
      const result = (await sendOtp({ mobile: input.mobile, purpose: OTP_PURPOSE })) as CustomerOtpSendResult;
      return {
        challengeId: result.challengeId,
        expiresAt: result.expiresAt,
        resendAvailableAt: result.resendAvailableAt,
        attemptsRemaining: result.attemptsRemaining,
        ...(result._mockCode !== undefined ? { _mockCode: result._mockCode } : {}),
      };
    },

    async verify(input, ip, userAgent) {
      const challenge = await repo.findOtpById(db, input.challengeId);
      // A challenge for another number or purpose is indistinguishable from none.
      if (challenge === null || challenge.mobile !== input.mobile || challenge.purpose !== OTP_PURPOSE) {
        throw new AppError('OTP_INVALID', { status: 400, detail: 'Invalid OTP challenge.' });
      }
      if (challenge.consumed_at !== null) {
        throw new AppError('OTP_INVALID', { status: 400, detail: 'OTP challenge has already been used.' });
      }
      if (challenge.locked_at !== null || challenge.attempts >= challenge.max_attempts) {
        throw new AppError('OTP_LOCKED', {
          status: 429,
          detail: 'OTP challenge is locked due to too many failed attempts.',
        });
      }
      if (new Date(challenge.expires_at).getTime() < Date.now()) {
        throw new AppError('OTP_EXPIRED', { status: 400, detail: 'OTP challenge has expired.' });
      }

      // BR-218: the same provider check as /auth/otp/verify; BR-32 counting stays here.
      const codeOk = await otpProvider.check({ mobile: challenge.mobile, code: input.otp, codeHash: challenge.code_hash });
      if (!codeOk) {
        const attempts = challenge.attempts + 1;
        const lock = attempts >= challenge.max_attempts;
        await repo.incrementOtpAttempts(db, challenge.id, lock);
        if (lock) {
          throw new AppError('OTP_LOCKED', {
            status: 429,
            detail: 'OTP challenge is locked due to 3 failed attempts (BR-32).',
          });
        }
        throw new AppError('OTP_INVALID', {
          status: 401,
          detail: 'Invalid OTP code.',
          meta: { attemptsRemaining: challenge.max_attempts - attempts },
        });
      }

      // Single use: a replayed or concurrent verify of the same challenge loses here.
      const claimed = await customerRepo.consumeOtpIfUnconsumed(db, challenge.id);
      if (!claimed) {
        throw new AppError('OTP_INVALID', { status: 400, detail: 'OTP challenge has already been used.' });
      }

      let user = await repo.findUserByMobile(db, challenge.mobile);
      let isNewUser = false;
      let customerId: string;

      if (user !== null) {
        await assertCustomer(user);
        if (user.status === 'PENDING') {
          await repo.updateUserStatus(db, user.id, 'ACTIVE');
          user.status = 'ACTIVE';
        }
        customerId = await customerRepo.ensureCustomerAndWallet(db, user.id);
      } else {
        try {
          const created = await transaction(async (tx) => {
            const newUser = await repo.createCustomerUser(tx, {
              mobile: challenge.mobile,
              fullName: DEFAULT_CUSTOMER_NAME,
              passwordHash: null,
              preferredLocale: input.preferredLocale ?? 'en',
              status: 'ACTIVE',
            });
            const newCustomerId = await customerRepo.ensureCustomerAndWallet(tx, newUser.id);
            await writeAuditLog(tx, {
              actorId: newUser.id,
              actionCode: 'auth.customer.otp_register',
              entityType: 'user',
              entityId: newUser.id,
              after: { userType: 'CUSTOMER', status: 'ACTIVE', viaOtp: true },
            });
            return { user: newUser, customerId: newCustomerId };
          });
          user = created.user;
          customerId = created.customerId;
          isNewUser = true;
        } catch (error) {
          // UNIQUE(mobile) among live users: a concurrent verify for the same
          // number created the account first. Sign in to that one instead.
          if (!isUniqueViolation(error)) throw error;
          user = await repo.findUserByMobile(db, challenge.mobile);
          if (user === null) throw error;
          await assertCustomer(user);
          customerId = await customerRepo.ensureCustomerAndWallet(db, user.id);
        }
      }

      // Session + token pair, exactly as /auth/otp/verify does it.
      const roles = [{ code: 'CUSTOMER' as RoleCode, warehouseId: undefined, zoneId: undefined }];
      const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
      const session = await repo.createSession(db, {
        userId: user.id,
        expiresAt,
        ip,
        userAgent,
        deviceId: input.deviceInfo?.deviceId,
        platform: input.deviceInfo?.platform,
      });
      const tokenPair = signTokenPair(
        { sub: user.id, roles, farmerId: null, customerId },
        { sub: user.id, jti: session.id },
      );
      await repo.createRefreshToken(db, {
        sessionId: session.id,
        userId: user.id,
        tokenHash: hashValue(tokenPair.refreshToken),
        expiresAt,
      });
      await repo.updateUserLastLogin(db, user.id);

      const completeness = profileCompleteness({
        fullName: user.full_name,
        ...(await customerRepo.onboardingFields(db, customerId)),
      });

      return {
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        tokenType: 'Bearer',
        expiresIn: 900,
        isNewUser,
        user: {
          id: user.id,
          fullName: user.full_name,
          mobile: user.mobile,
          userType: 'CUSTOMER',
          preferredLocale: user.preferred_locale,
          status: 'ACTIVE',
          hasPassword: user.password_hash !== null,
          customerId,
          ...completeness,
          roles: [{ code: 'CUSTOMER' as RoleCode }],
        },
      };
    },
  };
}

export const customerOtpService = createCustomerOtpService();
