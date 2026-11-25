import { describe, expect, it } from 'vitest';
import { extractOtpCode, sanitizeOtpInput } from './extractOtpCode';
import { OTP_CODE_LENGTH } from './otpInputProps';

describe('extractOtpCode', () => {
  it('BR-32: extracts the 6-digit code from a Twilio Verify style SMS', () => {
    expect(extractOtpCode('Your TOHFA verification code is: 482913', OTP_CODE_LENGTH)).toBe('482913');
  });

  it('BR-32: extracts a code at the very start or end of the message', () => {
    expect(extractOtpCode('482913 is your TOHFA code', OTP_CODE_LENGTH)).toBe('482913');
    expect(extractOtpCode('Code:482913', OTP_CODE_LENGTH)).toBe('482913');
  });

  it('BR-32: ignores digit runs that are not exactly 6 long (phone numbers, order ids, 4-digit codes)', () => {
    expect(extractOtpCode('Call 9876543210 for help', OTP_CODE_LENGTH)).toBeNull();
    expect(extractOtpCode('Your pickup OTP is 4821', OTP_CODE_LENGTH)).toBeNull();
    expect(extractOtpCode('Order 1234567 shipped', OTP_CODE_LENGTH)).toBeNull();
  });

  it('BR-32: picks the standalone 6-digit code even when longer digit runs appear first', () => {
    expect(extractOtpCode('From +919876543210: your code is 102938', OTP_CODE_LENGTH)).toBe('102938');
  });

  it('returns null for an SMS with no code, or no message at all', () => {
    expect(extractOtpCode('Your order is on its way', OTP_CODE_LENGTH)).toBeNull();
    expect(extractOtpCode('', OTP_CODE_LENGTH)).toBeNull();
    expect(extractOtpCode(null, OTP_CODE_LENGTH)).toBeNull();
    expect(extractOtpCode(undefined, OTP_CODE_LENGTH)).toBeNull();
  });

  it('keeps leading zeros', () => {
    expect(extractOtpCode('code 004512', OTP_CODE_LENGTH)).toBe('004512');
  });
});

describe('sanitizeOtpInput', () => {
  it('strips separators from a pasted code and caps it at the code length', () => {
    expect(sanitizeOtpInput('482 913', OTP_CODE_LENGTH)).toBe('482913');
    expect(sanitizeOtpInput('48-29-13-77', OTP_CODE_LENGTH)).toBe('482913');
    expect(sanitizeOtpInput('ab1', OTP_CODE_LENGTH)).toBe('1');
  });
});
