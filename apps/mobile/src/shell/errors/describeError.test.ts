import { describe, expect, it } from 'vitest';
import type { Problem } from '@tohfa/shared-types';
import { ApiError, NetworkError } from '../api/client';
import { describeError } from './describeError';
import errorsEn from '../../i18n/errors.en.json';
import errorsTa from '../../i18n/errors.ta.json';

function apiError(code: string, status: number, extra: Partial<Problem> = {}, retryAfterSeconds: number | null = null) {
  return new ApiError(
    { type: 'about:blank', title: code, status, code: code as Problem['code'], ...extra },
    { retryAfterSeconds },
  );
}

const CUSTOMER_FLOW_CASES: Array<[string, number, string, string]> = [
  ['WALLET_INSUFFICIENT', 402, 'error.WALLET_INSUFFICIENT', 'topup'],
  ['INSUFFICIENT_ALLOCATION', 422, 'error.INSUFFICIENT_ALLOCATION', 'refresh_cart'],
  ['STOCK_UNAVAILABLE', 409, 'error.STOCK_UNAVAILABLE', 'refresh_cart'],
  ['CART_LOCK_EXPIRED', 409, 'error.CART_LOCK_EXPIRED', 're_reserve'],
  ['SLOT_FULL', 409, 'error.SLOT_FULL', 'choose_slot'],
  ['RATE_LIMITED', 429, 'error.RATE_LIMITED', 'wait'],
  ['OTP_INVALID', 401, 'error.OTP_INVALID', 'none'],
  ['OTP_EXPIRED', 400, 'error.OTP_EXPIRED', 'resend_otp'],
  ['OTP_LOCKED', 429, 'error.OTP_LOCKED', 'resend_otp'],
  ['OTP_RESEND_TOO_SOON', 429, 'error.OTP_RESEND_TOO_SOON', 'wait'],
  ['OTP_SMS_DELIVERY_FAILED', 502, 'error.OTP_SMS_DELIVERY_FAILED', 'retry'],
  // BR-218: Twilio Verify outcomes.
  ['OTP_PROVIDER_RATE_LIMITED', 429, 'error.OTP_PROVIDER_RATE_LIMITED', 'wait'],
  ['OTP_DESTINATION_INVALID', 422, 'error.OTP_DESTINATION_INVALID', 'none'],
  ['OTP_PROVIDER_UNAVAILABLE', 503, 'error.OTP_PROVIDER_UNAVAILABLE', 'retry'],
  ['VALIDATION_FAILED', 422, 'error.VALIDATION_FAILED', 'fix_fields'],
  ['EMAIL_NOT_CONFIGURED', 503, 'error.EMAIL_NOT_CONFIGURED', 'retry'],
  ['WALLET_TRANSFER_DISABLED', 403, 'error.WALLET_TRANSFER_DISABLED', 'none'],
  ['WALLET_TRANSFER_LIMIT_EXCEEDED', 422, 'error.WALLET_TRANSFER_LIMIT_EXCEEDED', 'none'],
  ['WALLET_TRANSFER_SELF', 422, 'error.WALLET_TRANSFER_SELF', 'none'],
];

describe('describeError: customer-flow problem codes -> i18n keys + actions', () => {
  it.each(CUSTOMER_FLOW_CASES)('%s (%d) -> %s, action %s', (code, status, key, action) => {
    const d = describeError(apiError(code, status));
    expect(d.messageKey).toBe(key);
    expect(d.action).toBe(action);
    expect(d.code).toBe(code);
    expect(d.status).toBe(status);
    expect(errorsEn).toHaveProperty([key]);
    expect(errorsTa).toHaveProperty([key]);
  });

  it('RATE_LIMITED with Retry-After interpolates the countdown', () => {
    const d = describeError(apiError('RATE_LIMITED', 429, {}, 30));
    expect(d).toMatchObject({ messageKey: 'error.RATE_LIMITED.seconds', params: { seconds: 30 }, retryAfterSeconds: 30 });
  });

  it('WALLET_INSUFFICIENT (402) with top-level shortfall/balance/required prefills the top-up amount', () => {
    const err = apiError('WALLET_INSUFFICIENT', 402, { shortfall: '50.00', balance: '150.00', required: '200.00' } as Partial<Problem>);
    expect(err.walletShortfall).toEqual({ shortfall: '50.00', balance: '150.00', required: '200.00' });
    expect(describeError(err)).toMatchObject({
      messageKey: 'error.WALLET_INSUFFICIENT.shortfall',
      params: { amount: '50.00', balance: '150.00', required: '200.00' },
      action: 'topup',
    });
    // meta.shortfall is accepted as a fallback
    expect(apiError('WALLET_INSUFFICIENT', 422, { meta: { shortfall: '1.00' } }).walletShortfall?.shortfall).toBe('1.00');
    expect(apiError('STOCK_UNAVAILABLE', 409, { shortfall: '1.00' } as Partial<Problem>).walletShortfall).toBeNull();
  });

  it('top-up VALIDATION_FAILED with meta.topupLimits shows the allowed range', () => {
    const err = apiError('VALIDATION_FAILED', 422, {
      errors: { 'body.amount': ['Too small'] },
      meta: { topupLimits: { min: '100.00', max: '50000.00' } },
    });
    expect(err.topupLimits).toEqual({ min: '100.00', max: '50000.00' });
    expect(describeError(err)).toMatchObject({
      messageKey: 'error.TOPUP_AMOUNT_OUT_OF_RANGE',
      params: { min: '100.00', max: '50000.00' },
      fieldErrors: { amount: 'Too small' },
    });
  });

  it('validation field errors are surfaced for form binding', () => {
    const d = describeError(apiError('VALIDATION_FAILED', 422, { errors: { 'body.pincode': ['Invalid pincode'] } }));
    expect(d.fieldErrors).toEqual({ pincode: 'Invalid pincode' });
  });

  it('an unknown code with field errors is still a validation error; otherwise generic', () => {
    expect(describeError(apiError('SOMETHING_NEW', 422, { errors: { 'body.x': ['bad'] } })).messageKey).toBe(
      'error.VALIDATION_FAILED',
    );
    expect(describeError(apiError('SOMETHING_NEW', 400)).messageKey).toBe('error.generic');
    expect(describeError(apiError('SOMETHING_NEW', 503)).action).toBe('retry');
  });

  it('UNAUTHENTICATED reaching a screen means sign in again (not "wrong password")', () => {
    expect(describeError(apiError('UNAUTHENTICATED', 401))).toMatchObject({
      messageKey: 'error.SESSION_EXPIRED',
      action: 'sign_in',
    });
  });

  it('network: offline, timeout, and silent caller abort', () => {
    expect(describeError(new NetworkError(new Error('x')))).toMatchObject({ messageKey: 'error.NETWORK_OFFLINE', action: 'retry' });
    expect(describeError(new NetworkError(new Error('x'), 'timeout')).messageKey).toBe('error.NETWORK_TIMEOUT');
    expect(describeError(new NetworkError(new Error('x'), 'aborted')).silent).toBe(true);
    expect(describeError(new Error('boom')).messageKey).toBe('error.generic');
  });

  it('every key describeError can emit exists in English', () => {
    const emitted = new Set<string>(['error.generic', 'error.NETWORK_OFFLINE', 'error.NETWORK_TIMEOUT', 'error.SESSION_EXPIRED']);
    for (const [, , key] of CUSTOMER_FLOW_CASES) emitted.add(key);
    emitted.add('error.RATE_LIMITED.seconds');
    emitted.add('error.OTP_RESEND_TOO_SOON.seconds');
    emitted.add('error.WALLET_INSUFFICIENT.shortfall');
    emitted.add('error.TOPUP_AMOUNT_OUT_OF_RANGE');
    for (const key of emitted) expect(errorsEn).toHaveProperty([key]);
  });
});
