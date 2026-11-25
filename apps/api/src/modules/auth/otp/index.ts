import { config } from '../../../config.js';
import { smsTransport } from '../../notifications/sms/index.js';
import { createConfiguredLocalOtpProvider } from './local.otpProvider.js';
import type { OtpProvider } from './otpProvider.js';
import { createTwilioVerifyOtpProvider } from './twilioVerify.otpProvider.js';

export type { OtpCheckInput, OtpIssue, OtpProvider, OtpProviderName } from './otpProvider.js';

/**
 * BR-218: exactly one OTP provider per process, chosen by OTP_PROVIDER (resolved
 * and validated in config.ts). There is no fallback: if `twilio` is selected and
 * Twilio is misconfigured, boot fails; if Twilio is down, requests fail.
 */
export function getOtpProvider(): OtpProvider {
  if (config.OTP_PROVIDER === 'twilio') {
    return createTwilioVerifyOtpProvider({
      accountSid: config.TWILIO_ACCOUNT_SID,
      authToken: config.TWILIO_AUTH_TOKEN,
      serviceSid: config.TWILIO_VERIFY_SERVICE_SID,
      timeoutMs: config.OTP_PROVIDER_TIMEOUT_MS,
    });
  }
  return createConfiguredLocalOtpProvider(smsTransport);
}

export const otpProvider = getOtpProvider();
