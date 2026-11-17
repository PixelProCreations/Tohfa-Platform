/**
 * BR-160 (profile part): own-only, email change by OTP, GST details audited,
 * account deletion anonymises and keeps ledgers. Service tests with a fake repo.
 */
import { describe, expect, it, vi } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { aScope } from '../../test/factories.js';
import type { CustomerProfileRepo, EmailChallenge } from './customer-profile.repo.js';
import { createCustomerProfileService, placeholderMobile } from './customer-profile.service.js';
import { gstDetailsBody, updateProfileBody, type CustomerProfileRecord } from './customer-profile.schema.js';

const CUSTOMER = '40000000-0000-4000-8000-00000000000a';
const scope = aScope({
  level: ScopeLevel.OWN,
  roleCode: RoleCode.CUSTOMER,
  permission: 'customer.profile.edit',
  customerId: CUSTOMER,
  userId: '30000000-0000-4000-8000-00000000000a',
});

function aProfile(): CustomerProfileRecord {
  return {
    id: CUSTOMER,
    customerCode: 'CUST-0001',
    fullName: 'Asha',
    mobile: '+919800000001',
    email: null,
    emailVerified: false,
    age: null,
    gender: null,
    harvestPreferences: [],
    photoKey: null,
    customerType: 'RETAIL',
    businessName: null,
    gstin: null,
    gstVerified: false,
    defaultAddressId: null,
    preferredLocale: 'en',
    createdAt: '2026-11-01T00:00:00.000Z',
  };
}

function setup(over: { walletBalance?: string; openOrders?: number; emailTaken?: boolean; configured?: boolean } = {}) {
  const clock = { t: new Date('2026-11-16T10:00:00Z').getTime() };
  const times: Date[] = [];
  const profile = aProfile();
  const challenges: Array<EmailChallenge & { consumed: boolean }> = [];
  const audits: string[] = [];
  const anonymise = vi.fn(async () => undefined);
  const config: Record<string, unknown> = { email_otp_ttl_minutes: 10, otp_max_attempts: 3, otp_length: 6 };
  const repo: CustomerProfileRepo = {
    findProfile: async (_db, id) => (id === CUSTOMER ? { ...profile } : null),
    updateProfile: async (_db, _id, patch) => {
      Object.assign(profile, patch);
    },
    updateGstDetails: async (_db, _id, body) => {
      profile.customerType = body.customerType;
      profile.businessName = body.businessName ?? null;
      profile.gstin = body.gstin ?? null;
    },
    emailTakenByOther: async () => over.emailTaken ?? false,
    configValue: async (_db, key) => config[key],
    insertEmailChallenge: async (_db, row) => {
      times.push(new Date(clock.t));
      challenges.push({ id: `c${challenges.length}`, attempts: 0, consumed: false, ...row });
    },
    recentEmailChallengeTimes: async (_db, _id, since) => times.filter((d) => d > since),
    lockLatestEmailChallenge: async () => {
      const live = challenges.filter((c) => !c.consumed);
      return live[live.length - 1] ?? null;
    },
    incrementEmailChallengeAttempts: async (_db, id) => {
      const c = challenges.find((x) => x.id === id);
      if (c) c.attempts += 1;
    },
    consumeEmailChallenge: async (_db, id) => {
      const c = challenges.find((x) => x.id === id);
      if (c) c.consumed = true;
    },
    setVerifiedEmail: async (_db, _id, email) => {
      profile.email = email;
      profile.emailVerified = true;
    },
    deletionBlockers: async () => ({ walletBalance: over.walletBalance ?? '0.00', openOrders: over.openOrders ?? 0 }),
    anonymise,
  };
  const db = {
    query: vi.fn(async (sql: string, params?: unknown[]) => {
      if (/INSERT INTO audit_log/i.test(sql)) {
        audits.push(String(params?.find((p) => typeof p === 'string' && p.startsWith('customer.')) ?? 'audit'));
      }
      return { rows: [{ id: 'a' }], rowCount: 1 };
    }),
  } as unknown as Executor;
  const sent: Array<{ email: string; code: string; ttl: number }> = [];
  const svc = createCustomerProfileService({
    repo,
    db,
    transaction: (fn) => fn(db),
    sendEmailOtp: async (email, code, ttl) => void sent.push({ email, code, ttl }),
    emailConfigured: () => over.configured ?? true,
    now: () => new Date(clock.t),
  });
  return { svc, clock, profile, sent, challenges, audits, anonymise };
}

describe('BR-160: customer profile', () => {
  it('BR-160: a scope without a customer id is 404, never another profile', async () => {
    const { svc } = setup();
    await expect(svc.get(aScope())).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('BR-160: PATCH updates name, age, gender, preferences and photo', async () => {
    const { svc } = setup();
    const out = await svc.update(
      scope,
      updateProfileBody.parse({ fullName: 'Asha K', age: 34, gender: 'FEMALE', harvestPreferences: ['carrot'], photoKey: 'u/1.jpg' }),
    );
    expect(out).toMatchObject({ fullName: 'Asha K', age: 34, gender: 'FEMALE', harvestPreferences: ['carrot'], photoKey: 'u/1.jpg' });
    expect(updateProfileBody.safeParse({ email: 'x@y.z' }).success).toBe(false);
  });

  it('BR-191: PATCH sets preferredLocale en|ta and rejects anything else', async () => {
    const { svc } = setup();
    const out = await svc.update(scope, updateProfileBody.parse({ preferredLocale: 'ta' }));
    expect(out.preferredLocale).toBe('ta');
    expect(updateProfileBody.safeParse({ preferredLocale: 'fr' }).success).toBe(false);
  });

  it('BR-190: GET carries profileComplete and missingFields', async () => {
    const { svc } = setup();
    const before = await svc.get(scope);
    expect(before).toMatchObject({ profileComplete: false, missingFields: ['age', 'gender', 'harvestPreferences'] });
    const after = await svc.update(scope, updateProfileBody.parse({ gender: 'FEMALE' }));
    expect(after).toMatchObject({ profileComplete: true, missingFields: [] });
  });

  it('BR-160: email changes only after the OTP sent to the new address is verified', async () => {
    const { svc, sent, profile } = setup();
    const res = await svc.requestEmailOtp(scope, { email: 'asha@example.com' });
    expect(res.expiresAt).toBe('2026-11-16T10:10:00.000Z');
    expect(profile.email).toBeNull();
    const code = sent[0]!.code;
    expect(code).toMatch(/^[0-9]{6}$/);
    const out = await svc.verifyEmail(scope, { email: 'asha@example.com', code });
    expect(out).toMatchObject({ email: 'asha@example.com', emailVerified: true });
  });

  it('BR-160: wrong codes are counted and lock the challenge at otp_max_attempts', async () => {
    const { svc, sent } = setup();
    await svc.requestEmailOtp(scope, { email: 'asha@example.com' });
    const wrong = sent[0]!.code === '000000' ? '111111' : '000000';
    for (let i = 0; i < 3; i += 1) {
      await expect(svc.verifyEmail(scope, { email: 'asha@example.com', code: wrong })).rejects.toMatchObject({ code: 'OTP_INVALID' });
    }
    await expect(svc.verifyEmail(scope, { email: 'asha@example.com', code: sent[0]!.code })).rejects.toMatchObject({ code: 'OTP_LOCKED' });
  });

  it('BR-160: an email held by another live user is 409', async () => {
    const { svc, sent } = setup({ emailTaken: true });
    await expect(svc.requestEmailOtp(scope, { email: 'taken@example.com' })).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(sent).toEqual([]);
  });

  it('BR-160: GST details are validated and audited', async () => {
    const { svc, audits } = setup();
    expect(gstDetailsBody.safeParse({ customerType: 'B2B' }).success).toBe(false);
    expect(gstDetailsBody.safeParse({ customerType: 'RETAIL', gstin: 'BAD' }).success).toBe(false);
    const out = await svc.setGstDetails(scope, gstDetailsBody.parse({ customerType: 'B2B', businessName: 'Hill Cafe', gstin: '33ABCDE1234F1Z5' }));
    expect(out).toMatchObject({ customerType: 'B2B', gstin: '33ABCDE1234F1Z5' });
    expect(audits).toContain('customer.gst_details.manage');
  });

  it('BR-160: deletion is refused while the wallet holds money or an order is open', async () => {
    const rich = setup({ walletBalance: '0.01' });
    await expect(rich.svc.deleteAccount(scope)).rejects.toMatchObject({ code: 'CONFLICT' });
    const busy = setup({ openOrders: 1 });
    await expect(busy.svc.deleteAccount(scope)).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(rich.anonymise).not.toHaveBeenCalled();
    expect(busy.anonymise).not.toHaveBeenCalled();
  });

  it('BR-160: deletion anonymises with a non-routable placeholder mobile and audits without PII', async () => {
    const { svc, anonymise, audits } = setup();
    await svc.deleteAccount(scope);
    expect(anonymise).toHaveBeenCalledWith(expect.anything(), CUSTOMER, placeholderMobile(CUSTOMER));
    expect(placeholderMobile(CUSTOMER)).toMatch(/^\+999[0-9]{11}$/);
    expect(audits).toContain('customer.account.delete_own');
  });

  it('BR-184: resend inside the cooldown is 429 OTP_RESEND_TOO_SOON, after it is allowed', async () => {
    const { svc, clock, sent } = setup();
    await svc.requestEmailOtp(scope, { email: 'asha@example.com' });
    clock.t += 30_000;
    await expect(svc.requestEmailOtp(scope, { email: 'asha@example.com' })).rejects.toMatchObject({ code: 'OTP_RESEND_TOO_SOON' });
    clock.t += 31_000;
    await svc.requestEmailOtp(scope, { email: 'asha@example.com' });
    expect(sent).toHaveLength(2);
  });

  it('BR-184: at most 3 sends per hour, then RATE_LIMITED until the window slides', async () => {
    const { svc, clock, sent } = setup();
    for (let i = 0; i < 3; i += 1) {
      await svc.requestEmailOtp(scope, { email: 'asha@example.com' });
      clock.t += 61_000;
    }
    await expect(svc.requestEmailOtp(scope, { email: 'asha@example.com' })).rejects.toMatchObject({ code: 'RATE_LIMITED' });
    expect(sent).toHaveLength(3);
    clock.t += 3_600_000;
    await svc.requestEmailOtp(scope, { email: 'asha@example.com' });
    expect(sent).toHaveLength(4);
  });

  it('BR-184: no configured transport is 503 EMAIL_NOT_CONFIGURED and spends no budget', async () => {
    const { svc, sent, challenges } = setup({ configured: false });
    await expect(svc.requestEmailOtp(scope, { email: 'asha@example.com' })).rejects.toMatchObject({ code: 'EMAIL_NOT_CONFIGURED' });
    expect(sent).toEqual([]);
    expect(challenges).toEqual([]);
  });

  it('BR-184: the TTL is passed to the sender and only the hash is stored', async () => {
    const { svc, challenges, sent } = setup();
    await svc.requestEmailOtp(scope, { email: 'asha@example.com' });
    expect(challenges[0]!.codeHash).not.toContain(sent[0]!.code);
    expect(sent[0]!.ttl).toBe(10);
  });
});
