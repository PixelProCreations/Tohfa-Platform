/**
 * Customer self-service profile (BR-160).
 *
 *  - Own data only: every call is keyed on the resolved scope's customerId. A
 *    scope without one (staff holding the code at `all`) sees 404, never another
 *    customer's profile (BR-36).
 *  - Email changes need an OTP sent to the NEW address; the code is stored hashed,
 *    expires after system_config.email_otp_ttl_minutes and locks after
 *    system_config.otp_max_attempts wrong tries (same budget as BR-32a).
 *  - GST details go through their own permission (customer.gst_details.manage).
 *  - Deleting the account anonymises PII and soft-deletes; ledgers are never
 *    touched. It is refused while money or an open order is still attached.
 */
import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import { isZero, parseMoney } from '@tohfa/shared-types';
import { writeAuditLog } from '../../audit/auditLog.js';
import { config } from '../../config.js';
import { emailSender, renderOtpEmail } from '../../email/index.js';
import type { Executor } from '../../db/pool.js';
import { pool, withTransaction } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { customerProfileRepo, type CustomerProfileRepo } from './customer-profile.repo.js';
import type {
  CustomerProfile,
  EmailOtpBody,
  EmailOtpSentResponse,
  EmailVerifyBody,
  GstDetailsBody,
  UpdateProfileBody,
} from './customer-profile.schema.js';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

/** Delivers an email OTP. Never logs the code. */
export type EmailOtpSender = (email: string, code: string, ttlMinutes: number) => Promise<void>;

/** Sends the OTP through the configured vendor-neutral EmailSender (BR-184). */
export const defaultEmailOtpSender: EmailOtpSender = async (email, code, ttlMinutes) => {
  const mail = renderOtpEmail(code, ttlMinutes);
  await emailSender.send({ to: email, ...mail, redact: [code] });
};

export interface CustomerProfileServiceDeps {
  repo: CustomerProfileRepo;
  db: Executor;
  transaction: TransactionRunner;
  sendEmailOtp: EmailOtpSender;
  /** False when no email transport is configured (503 before any budget is spent). */
  emailConfigured: () => boolean;
  now: () => Date;
}

export interface CustomerProfileService {
  get(scope: ResolvedScope): Promise<CustomerProfile>;
  update(scope: ResolvedScope, body: UpdateProfileBody): Promise<CustomerProfile>;
  setGstDetails(scope: ResolvedScope, body: GstDetailsBody): Promise<CustomerProfile>;
  requestEmailOtp(scope: ResolvedScope, body: EmailOtpBody): Promise<EmailOtpSentResponse>;
  verifyEmail(scope: ResolvedScope, body: EmailVerifyBody): Promise<CustomerProfile>;
  deleteAccount(scope: ResolvedScope): Promise<void>;
}

const sha256 = (text: string): string => createHash('sha256').update(text).digest('hex');

function notFound(): AppError {
  return new AppError('NOT_FOUND', { detail: 'No customer profile is visible to you.' });
}

/** A positive integer from system_config, or a 500: there is no literal fallback (CLAUDE.md 2.7). */
function positiveInt(value: unknown, key: string): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isInteger(n) || n <= 0) {
    throw new AppError('INTERNAL', { detail: `system_config.${key} is missing or not a positive integer.` });
  }
  return n;
}

/**
 * A syntactically valid but unassignable E.164 number (+999 is not a country code), unique per
 * customer, so users.mobile (NOT NULL, E.164 CHECK) no longer holds the person's real number.
 */
export function placeholderMobile(customerId: string): string {
  const digits = BigInt(`0x${customerId.replace(/-/g, '')}`).toString().slice(-11);
  return `+999${digits.padStart(11, '0')}`;
}

export function createCustomerProfileService(
  deps: Partial<CustomerProfileServiceDeps> = {},
): CustomerProfileService {
  const repo = deps.repo ?? customerProfileRepo;
  const db = deps.db ?? pool;
  const transaction: TransactionRunner = deps.transaction ?? ((fn) => withTransaction(fn));
  const sendEmailOtp = deps.sendEmailOtp ?? defaultEmailOtpSender;
  const emailConfigured = deps.emailConfigured ?? (() => emailSender.configured);
  const now = deps.now ?? (() => new Date());

  function customerOf(scope: ResolvedScope): string {
    if (scope.customerId === undefined) throw notFound();
    return scope.customerId;
  }

  async function load(executor: Executor, customerId: string): Promise<CustomerProfile> {
    const profile = await repo.findProfile(executor, customerId);
    if (profile === null) throw notFound();
    return profile;
  }

  return {
    async get(scope) {
      return load(db, customerOf(scope));
    },

    async update(scope, body) {
      const customerId = customerOf(scope);
      return transaction(async (tx) => {
        await load(tx, customerId);
        await repo.updateProfile(tx, customerId, body);
        return load(tx, customerId);
      });
    },

    async setGstDetails(scope, body) {
      const customerId = customerOf(scope);
      return transaction(async (tx) => {
        const before = await load(tx, customerId);
        await repo.updateGstDetails(tx, customerId, body);
        const after = await load(tx, customerId);
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'customer.gst_details.manage',
          entityType: 'customer',
          entityId: customerId,
          before: { customerType: before.customerType, gstin: before.gstin, businessName: before.businessName },
          after: { customerType: after.customerType, gstin: after.gstin, businessName: after.businessName },
        });
        return after;
      });
    },

    async requestEmailOtp(scope, body) {
      const customerId = customerOf(scope);
      await load(db, customerId);
      if (!emailConfigured()) {
        throw new AppError('EMAIL_NOT_CONFIGURED', { detail: 'Email delivery is not configured.' });
      }
      if (await repo.emailTakenByOther(db, customerId, body.email)) {
        throw new AppError('CONFLICT', { detail: 'That email address is already in use.' });
      }
      const ttlMinutes = positiveInt(await repo.configValue(db, 'email_otp_ttl_minutes'), 'email_otp_ttl_minutes');
      const maxAttempts = positiveInt(await repo.configValue(db, 'otp_max_attempts'), 'otp_max_attempts');
      const length = positiveInt(await repo.configValue(db, 'otp_length'), 'otp_length');
      // BR-184: resend cooldown and an hourly cap, both from the stored challenges.
      const nowMs = now().getTime();
      const sentTimes = (await repo.recentEmailChallengeTimes(db, customerId, new Date(nowMs - 3_600_000)))
        .map((d) => d.getTime())
        .sort((x, y) => y - x);
      const latest = sentTimes[0];
      if (latest !== undefined && nowMs - latest < config.OTP_RESEND_SECONDS * 1000) {
        const wait = Math.ceil((config.OTP_RESEND_SECONDS * 1000 - (nowMs - latest)) / 1000);
        throw new AppError('OTP_RESEND_TOO_SOON', {
          detail: `Wait ${wait} seconds before requesting another code.`,
          meta: { retryAfterSeconds: wait },
        });
      }
      if (sentTimes.length >= config.EMAIL_OTP_MAX_SENDS_PER_HOUR) {
        throw new AppError('RATE_LIMITED', {
          detail: 'Too many verification emails requested. Try again in an hour.',
          meta: { retryAfterSeconds: Math.ceil((sentTimes[sentTimes.length - 1]! + 3_600_000 - nowMs) / 1000) },
        });
      }
      const code = String(randomInt(0, 10 ** length)).padStart(length, '0');
      const expiresAt = new Date(now().getTime() + ttlMinutes * 60_000);

      // Store first, then send: a send failure leaves an unusable challenge, never a usable
      // code the customer did not receive. The plaintext is never stored or logged.
      await repo.insertEmailChallenge(db, {
        customerId,
        email: body.email,
        codeHash: sha256(code),
        maxAttempts,
        expiresAt,
      });
      await sendEmailOtp(body.email, code, ttlMinutes);
      return { email: body.email, expiresAt: expiresAt.toISOString() };
    },

    async verifyEmail(scope, body) {
      const customerId = customerOf(scope);
      let wrong: { remaining: number } | null = null;
      const result = await transaction(async (tx) => {
        const challenge = await repo.lockLatestEmailChallenge(tx, customerId);
        if (challenge === null || challenge.email !== body.email) {
          throw new AppError('OTP_INVALID', { detail: 'No pending verification for this email address.' });
        }
        if (challenge.attempts >= challenge.maxAttempts) {
          throw new AppError('OTP_LOCKED', { detail: 'Too many wrong codes. Request a new one.' });
        }
        if (challenge.expiresAt.getTime() <= now().getTime()) {
          throw new AppError('OTP_EXPIRED', { detail: 'The code has expired. Request a new one.' });
        }
        const a = Buffer.from(sha256(body.code));
        const b = Buffer.from(challenge.codeHash);
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          // Counted and committed, so the lockout holds.
          await repo.incrementEmailChallengeAttempts(tx, challenge.id);
          wrong = { remaining: Math.max(0, challenge.maxAttempts - challenge.attempts - 1) };
          return null;
        }
        if (await repo.emailTakenByOther(tx, customerId, body.email)) {
          throw new AppError('CONFLICT', { detail: 'That email address is already in use.' });
        }
        await repo.consumeEmailChallenge(tx, challenge.id);
        await repo.setVerifiedEmail(tx, customerId, body.email);
        return load(tx, customerId);
      });
      if (result === null) {
        const remaining = (wrong as { remaining: number } | null)?.remaining ?? 0;
        throw new AppError('OTP_INVALID', {
          detail: `${remaining} attempts remaining.`,
          meta: { remainingAttempts: remaining },
        });
      }
      return result;
    },

    async deleteAccount(scope) {
      const customerId = customerOf(scope);
      await transaction(async (tx) => {
        await load(tx, customerId);
        const blockers = await repo.deletionBlockers(tx, customerId);
        if (!isZero(parseMoney(blockers.walletBalance))) {
          throw new AppError('CONFLICT', {
            detail: 'Your wallet still holds money. Use or withdraw it before deleting the account.',
            meta: { reason: 'WALLET_NOT_EMPTY' },
          });
        }
        if (blockers.openOrders > 0) {
          throw new AppError('CONFLICT', {
            detail: 'You have orders that are not yet completed.',
            meta: { reason: 'OPEN_ORDERS', openOrders: blockers.openOrders },
          });
        }
        await repo.anonymise(tx, customerId, placeholderMobile(customerId));
        // No PII in the audit image: ids and the outcome only.
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'customer.account.delete_own',
          entityType: 'customer',
          entityId: customerId,
          after: { anonymised: true },
        });
      });
    },
  };
}

export const customerProfileService: CustomerProfileService = createCustomerProfileService();
