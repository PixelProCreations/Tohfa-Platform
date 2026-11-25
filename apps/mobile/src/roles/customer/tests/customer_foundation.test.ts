/**
 * Customer integration foundation: passwordless OTP login writes THE shared
 * secure token store and routes to onboarding/home; localized error mapping;
 * Razorpay top-up wrapper with receipt polling (mocked SDK).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RazorpayCheckout from 'react-native-razorpay';
import type { Money, Problem } from '@tohfa/shared-types';
import * as client from '../../../shell/api/client';
import { ApiError } from '../../../shell/api/client';
import { __resetTokenCacheForTests, tokenStorage as sharedStore } from '../../../shell/storage/secureTokenStorage';
import { openRazorpayCheckout } from '../../../shell/payments/razorpay';
import { setLocale } from '../../../i18n/customer';
import { __resetEntryRoleForTests, forgetEntryRole, readEntryRole } from '../../../shell/auth/entryRole';
import {
  isValidCustomerMobile,
  isValidCustomerOtp,
  resolveCustomerRouteAfterLogin,
  sendCustomerLoginOtp,
  toE164IndianMobile,
  verifyCustomerLoginOtp,
} from '../api/auth';
import { mapProblem } from '../api/problem';
import { pollTopupReceipt, startWalletTopup, type TopupDeps } from '../api/topup';
import { topupIdempotencyKeys, type TopupIntent, type TopupReceipt } from '../api/wallet';
import { tokenStorage as customerStore } from '../storage/tokenStorage';

const verifyResponse = (over: Record<string, unknown> = {}) => ({
  accessToken: 'acc',
  refreshToken: 'ref',
  tokenType: 'Bearer',
  expiresIn: 900,
  isNewUser: false,
  user: {
    id: 'u1',
    fullName: 'Asha',
    mobile: '+919876543210',
    userType: 'CUSTOMER',
    preferredLocale: 'en',
    status: 'ACTIVE',
    hasPassword: false,
    customerId: 'c1',
    roles: [{ code: 'CUSTOMER' }],
    profileComplete: true,
  },
  ...over,
});

beforeEach(async () => {
  vi.restoreAllMocks();
  __resetTokenCacheForTests();
  await sharedStore.clearTokens();
  client.setAccessToken(null);
});

describe('BR-153 passwordless customer login', () => {
  it('validates and normalises mobile numbers and 6-digit OTPs', () => {
    expect(isValidCustomerMobile('98765 43210')).toBe(true);
    expect(isValidCustomerMobile('+919876543210')).toBe(true);
    expect(isValidCustomerMobile('5876543210')).toBe(false);
    expect(toE164IndianMobile('09876543210')).toBe('+919876543210');
    expect(isValidCustomerOtp('482915')).toBe(true);
    expect(isValidCustomerOtp('4829')).toBe(false);
  });

  it('send hits /auth/customer/otp/send with +91 and a 15s deadline', async () => {
    const spy = vi.spyOn(client, 'request').mockResolvedValue({ challengeId: 'ch' });
    await sendCustomerLoginOtp('9876543210');
    expect(spy).toHaveBeenCalledWith('/auth/customer/otp/send', {
      method: 'POST',
      body: { mobile: '+919876543210' },
      timeoutMs: 15000,
    });
  });

  it('verify stores tokens in the SAME store the client refreshes from, and sets the bearer', async () => {
    const spy = vi.spyOn(client, 'request').mockResolvedValue(verifyResponse());
    const result = await verifyCustomerLoginOtp({ mobile: '9876543210', challengeId: 'ch', otp: ' 482915 ' });
    expect(spy).toHaveBeenCalledWith('/auth/customer/otp/verify', {
      method: 'POST',
      body: { mobile: '+919876543210', challengeId: 'ch', otp: '482915' },
      timeoutMs: 15000,
    });
    expect(await sharedStore.getTokens()).toEqual({ accessToken: 'acc', refreshToken: 'ref' });
    expect(customerStore).toBe(sharedStore);
    expect(client.getAccessToken()).toBe('acc');
    expect(result.route).toBe('CustomerMain');
  });

  it('BR-135: a customer sign-in remembers the customer entry, so a FARMER + CUSTOMER account reopens the customer side', async () => {
    __resetEntryRoleForTests();
    await forgetEntryRole();
    vi.spyOn(client, 'request').mockResolvedValue(verifyResponse());
    await verifyCustomerLoginOtp({ mobile: '9876543210', challengeId: 'ch', otp: '482915' });
    __resetEntryRoleForTests(); // cold start
    expect(await readEntryRole()).toBe('CUSTOMER');
  });

  it('routes new users and incomplete profiles to onboarding; absent flag goes home', () => {
    expect(resolveCustomerRouteAfterLogin({ isNewUser: true, user: { profileComplete: true } })).toBe('CustomerProfileName');
    expect(resolveCustomerRouteAfterLogin({ isNewUser: false, user: { profileComplete: false } })).toBe('CustomerProfileName');
    expect(resolveCustomerRouteAfterLogin({ isNewUser: false, user: {} })).toBe('CustomerMain');
  });
});

describe('mapProblem: localized customer error messages', () => {
  const err = (code: string, status: number, extra: Partial<Problem> = {}, retryAfterSeconds: number | null = null) =>
    new ApiError({ type: 'about:blank', title: code, status, code: code as Problem['code'], ...extra }, { retryAfterSeconds });

  it('English and Tamil, with interpolation', () => {
    setLocale('en');
    expect(mapProblem(err('RATE_LIMITED', 429, {}, 30)).message).toBe('Too many attempts. Please try again in 30 seconds.');
    expect(mapProblem(err('WALLET_INSUFFICIENT', 402, { shortfall: '50.00' } as Partial<Problem>)).message).toBe(
      'Your wallet balance is too low. Add ₹50.00 to continue.',
    );
    setLocale('ta');
    expect(mapProblem(err('SLOT_FULL', 409)).message).toContain('பிக்கப்');
    setLocale('en');
  });

  it('offline is a retryable, user-visible message', () => {
    const p = mapProblem(new client.NetworkError(new Error('x')));
    expect(p.action).toBe('retry');
    expect(p.message).toBe("You're offline. Check your connection and try again.");
  });
});

describe('Razorpay wrapper', () => {
  it('maps SDK success / cancel / failure', async () => {
    const sdk = { open: vi.fn() };
    const input = { keyId: 'rzp_test', orderId: 'order_1', amountPaise: 100000, currency: 'INR' as const, name: 'TOHFA' };
    sdk.open.mockResolvedValueOnce({ razorpay_payment_id: 'pay_1', razorpay_order_id: 'order_1' });
    expect(await openRazorpayCheckout(input, sdk)).toMatchObject({ status: 'success', paymentId: 'pay_1' });
    expect(sdk.open).toHaveBeenCalledWith(expect.objectContaining({ key: 'rzp_test', order_id: 'order_1', amount: 100000 }));
    sdk.open.mockRejectedValueOnce({ code: 0, description: 'Payment Cancelled' });
    expect((await openRazorpayCheckout(input, sdk)).status).toBe('cancelled');
    sdk.open.mockRejectedValueOnce({ code: 2, description: 'Network error' });
    expect((await openRazorpayCheckout(input, sdk)).status).toBe('failed');
    await expect(openRazorpayCheckout({ ...input, amountPaise: 10.5 }, sdk)).rejects.toThrow();
  });

  it('defaults to the (mocked) react-native-razorpay SDK', async () => {
    const out = await openRazorpayCheckout({ keyId: 'k', orderId: 'o', amountPaise: 1, currency: 'INR', name: 'T' });
    expect(out.status).toBe('success');
    expect(RazorpayCheckout.open).toHaveBeenCalled();
  });
});

describe('wallet top-up: create intent -> Razorpay -> poll receipt', () => {
  const intent: TopupIntent = {
    topupId: 't1',
    gateway: 'RAZORPAY',
    gatewayOrderId: 'order_9',
    amount: '1000.10' as Money,
    currency: 'INR',
    status: 'PENDING',
    razorpayKeyId: 'rzp_test_key',
  };
  const receipt = (status: TopupReceipt['status']): TopupReceipt => ({
    topupId: 't1',
    status,
    amount: '1000.10' as Money,
    currency: 'INR',
    mode: 'UPI',
    transactionId: status === 'SUCCESS' ? 'tx' : null,
    balanceAfter: status === 'SUCCESS' ? ('2000.10' as Money) : null,
    createdAt: 'now',
    completedAt: null,
  });
  let clock = 0;
  const deps = (over: Partial<TopupDeps> = {}): Partial<TopupDeps> => ({
    createTopup: vi.fn().mockResolvedValue(intent),
    fetchTopupReceipt: vi.fn().mockResolvedValue(receipt('SUCCESS')),
    openCheckout: vi.fn().mockResolvedValue({ status: 'success', paymentId: 'pay' }),
    sleep: vi.fn(async (ms: number) => {
      clock += ms;
    }),
    now: () => clock,
    pollIntervalMs: 2000,
    pollTimeoutMs: 10000,
    ...over,
  });

  beforeEach(() => {
    clock = 0;
    topupIdempotencyKeys.reset();
  });

  it('opens Razorpay with the API key/order and integer paise, then succeeds on the receipt', async () => {
    const d = deps({
      fetchTopupReceipt: vi
        .fn()
        .mockResolvedValueOnce(receipt('PENDING'))
        .mockResolvedValueOnce(receipt('PENDING'))
        .mockResolvedValueOnce(receipt('SUCCESS')),
    });
    const out = await startWalletTopup({ amount: '1000.10' as Money, mode: 'UPI' }, d);
    expect(out.status).toBe('success');
    expect(d.openCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ keyId: 'rzp_test_key', orderId: 'order_9', amountPaise: 100010, method: 'upi' }),
    );
    expect(d.fetchTopupReceipt).toHaveBeenCalledTimes(3);
    if (out.status === 'success') expect(out.receipt.balanceAfter).toBe('2000.10');
  });

  it('sends an Idempotency-Key, reused when the create call is retried after a failure', async () => {
    const create = vi.fn().mockRejectedValueOnce(new client.NetworkError(new Error('x'))).mockResolvedValue(intent);
    const d = deps({ createTopup: create });
    await expect(startWalletTopup({ amount: '500.00' as Money, mode: 'CARD' }, d)).rejects.toBeInstanceOf(client.NetworkError);
    await startWalletTopup({ amount: '500.00' as Money, mode: 'CARD' }, d);
    const [k1, k2] = [create.mock.calls[0]?.[1], create.mock.calls[1]?.[1]];
    expect(typeof k1).toBe('string');
    expect(k2).toBe(k1);
    // After a completed flow the next tap is a new action with a new key.
    await startWalletTopup({ amount: '500.00' as Money, mode: 'CARD' }, d);
    expect(create.mock.calls[2]?.[1]).not.toBe(k1);
  });

  it('FAILED receipt, SDK cancel, poll timeout and missing key are distinct outcomes', async () => {
    expect((await startWalletTopup({ amount: '1.00' as Money, mode: 'UPI' }, deps({ fetchTopupReceipt: vi.fn().mockResolvedValue(receipt('FAILED')) }))).status).toBe('failed');
    expect((await startWalletTopup({ amount: '1.00' as Money, mode: 'UPI' }, deps({ openCheckout: vi.fn().mockResolvedValue({ status: 'cancelled', code: 0, description: 'x' }) }))).status).toBe('cancelled');
    const pending = deps({ fetchTopupReceipt: vi.fn().mockResolvedValue(receipt('PENDING')) });
    expect((await startWalletTopup({ amount: '1.00' as Money, mode: 'UPI' }, pending)).status).toBe('pending');
    expect((pending.fetchTopupReceipt as ReturnType<typeof vi.fn>).mock.calls.length).toBeLessThanOrEqual(6);
    const noKey = deps({ createTopup: vi.fn().mockResolvedValue({ ...intent, razorpayKeyId: undefined }) });
    expect((await startWalletTopup({ amount: '1.00' as Money, mode: 'UPI' }, noKey)).status).toBe('unavailable');
  });

  it('a transient poll error does not abort polling', async () => {
    const fetch = vi.fn().mockRejectedValueOnce(new Error('blip')).mockResolvedValue(receipt('SUCCESS'));
    const d = deps({ fetchTopupReceipt: fetch });
    const out = await pollTopupReceipt('t1', d as TopupDeps);
    expect(out).toMatchObject({ final: true });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
