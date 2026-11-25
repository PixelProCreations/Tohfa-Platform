import { describe, expect, it } from 'vitest';
import { resolveOtpProvider, type OtpProviderEnv } from './otpProvider.config.js';

/** BR-225: provider selection is explicit and fails fast; it never falls back to the mock. */

const TWILIO: Pick<OtpProviderEnv, 'TWILIO_ACCOUNT_SID' | 'TWILIO_AUTH_TOKEN' | 'TWILIO_VERIFY_SERVICE_SID'> = {
  TWILIO_ACCOUNT_SID: `AC${'a'.repeat(32)}`,
  TWILIO_AUTH_TOKEN: 'b'.repeat(32),
  TWILIO_VERIFY_SERVICE_SID: `VA${'c'.repeat(32)}`,
};
const NO_TWILIO = { TWILIO_ACCOUNT_SID: '', TWILIO_AUTH_TOKEN: '', TWILIO_VERIFY_SERVICE_SID: '' };

describe('BR-225: OTP provider configuration', () => {
  it('BR-225: OTP_PROVIDER=twilio with full credentials resolves to twilio', () => {
    expect(resolveOtpProvider({ NODE_ENV: 'development', OTP_PROVIDER: 'twilio', ...TWILIO })).toBe('twilio');
    expect(resolveOtpProvider({ NODE_ENV: 'production', OTP_PROVIDER: 'twilio', ...TWILIO })).toBe('twilio');
  });

  it('BR-225: OTP_PROVIDER=twilio with a missing credential fails at boot, naming only the variable', () => {
    for (const key of Object.keys(TWILIO) as Array<keyof typeof TWILIO>) {
      const env = { NODE_ENV: 'development' as const, OTP_PROVIDER: 'twilio' as const, ...TWILIO, [key]: '' };
      expect(() => resolveOtpProvider(env)).toThrow(key);
    }
  });

  it('BR-225: malformed Twilio SIDs fail at boot without echoing the value', () => {
    const badSid = 'not-a-sid-value';
    for (const key of ['TWILIO_ACCOUNT_SID', 'TWILIO_VERIFY_SERVICE_SID'] as const) {
      let message = '';
      try {
        resolveOtpProvider({ NODE_ENV: 'development', OTP_PROVIDER: 'twilio', ...TWILIO, [key]: badSid });
      } catch (error) {
        message = (error as Error).message;
      }
      expect(message).toContain(key);
      expect(message).not.toContain(badSid);
    }
  });

  it('BR-225: unset OTP_PROVIDER outside production is the local (in-house) provider', () => {
    expect(resolveOtpProvider({ NODE_ENV: 'development', ...NO_TWILIO })).toBe('local');
    expect(resolveOtpProvider({ NODE_ENV: 'test', ...NO_TWILIO })).toBe('local');
  });

  it('BR-225: production must name its OTP provider; there is no default to fall back to', () => {
    expect(() => resolveOtpProvider({ NODE_ENV: 'production', ...TWILIO })).toThrow(/OTP_PROVIDER/);
  });
});
