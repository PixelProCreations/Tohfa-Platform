import type { OtpProviderName } from './otpProvider.js';

/**
 * BR-225: boot-time resolution of OTP_PROVIDER. Pure (no `config` import) so
 * config.ts can call it and tests can exercise it without touching process.env.
 *
 * Error messages name the variable, never its value: these strings end up in
 * crash logs.
 */

export interface OtpProviderEnv {
  NODE_ENV: 'development' | 'test' | 'production';
  OTP_PROVIDER?: OtpProviderName | undefined;
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_VERIFY_SERVICE_SID: string;
}

const ACCOUNT_SID = /^AC[0-9a-fA-F]{32}$/;
const VERIFY_SERVICE_SID = /^VA[0-9a-fA-F]{32}$/;

export function resolveOtpProvider(env: OtpProviderEnv): OtpProviderName {
  // Production must say which provider it means. A default here would be a
  // silent fallback, which is exactly what BR-225 forbids.
  if (env.OTP_PROVIDER === undefined) {
    if (env.NODE_ENV === 'production') {
      throw new Error('OTP_PROVIDER must be set explicitly when NODE_ENV=production (one of: twilio, local)');
    }
    return 'local';
  }

  if (env.OTP_PROVIDER === 'twilio') {
    const missing = (['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_VERIFY_SERVICE_SID'] as const).filter(
      (key) => env[key].trim() === '',
    );
    if (missing.length > 0) {
      throw new Error(`OTP_PROVIDER=twilio requires ${missing.join(', ')}`);
    }
    if (!ACCOUNT_SID.test(env.TWILIO_ACCOUNT_SID)) {
      throw new Error('TWILIO_ACCOUNT_SID is malformed (expected AC followed by 32 hex characters)');
    }
    if (!VERIFY_SERVICE_SID.test(env.TWILIO_VERIFY_SERVICE_SID)) {
      throw new Error('TWILIO_VERIFY_SERVICE_SID is malformed (expected VA followed by 32 hex characters)');
    }
  }

  return env.OTP_PROVIDER;
}
