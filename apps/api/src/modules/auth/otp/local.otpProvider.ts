import crypto from 'node:crypto';
import { config } from '../../../config.js';
import { AppError } from '../../../http/problem.js';
import type { SmsTransport } from '../../notifications/sms/sms.transport.js';
import type { OtpCheckInput, OtpIssue, OtpProvider } from './otpProvider.js';

/**
 * BR-225 `local`: the in-house OTP. We generate the code, store only its hash
 * (BR-20b) and send it through the configured SmsTransport (mock or msg91).
 * This is the dev/test/CI default; production can only reach it with a real
 * SMS transport, because config.ts refuses SMS_PROVIDER=mock in production.
 */

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export interface LocalOtpOptions {
  sms: SmsTransport;
  codeLength: number;
  ttlSeconds: number;
  /** Echo the plaintext as `_mockCode`: only for tests and the mock SMS transport. */
  exposeCode: boolean;
  msg91TemplateId?: string | undefined;
}

export function createLocalOtpProvider(options: LocalOtpOptions): OtpProvider {
  return {
    name: 'local',

    issue(mobile): OtpIssue {
      const code = crypto.randomInt(0, 10 ** options.codeLength).toString().padStart(options.codeLength, '0');
      const ttlMinutes = Math.round(options.ttlSeconds / 60);
      return {
        codeHash: sha256(code),
        ...(options.exposeCode ? { mockCode: code } : {}),
        async deliver() {
          const result = await options.sms.sendSms({
            to: mobile,
            // Used as-is by free-text transports (mock); msg91's Flow API
            // ignores this and fills its own DLT-approved template instead
            // (templateId + templateVars below) -- see SendSmsParams.
            message: `Your TOHFA verification code is ${code}. It expires in ${ttlMinutes} minutes. Do not share this code with anyone.`,
            templateId: options.msg91TemplateId || undefined,
            templateVars: { OTP: code },
          });
          if (result.status === 'FAILED') {
            throw new AppError('OTP_SMS_DELIVERY_FAILED', {
              status: 502,
              detail: 'Could not send the OTP SMS. Please try again in a moment.',
            });
          }
        },
      };
    },

    async check({ code, codeHash }: OtpCheckInput): Promise<boolean> {
      const incoming = Buffer.from(sha256(code), 'hex');
      const stored = Buffer.from(codeHash, 'hex');
      return incoming.length === stored.length && crypto.timingSafeEqual(incoming, stored);
    },
  };
}

export function createConfiguredLocalOtpProvider(sms: SmsTransport): OtpProvider {
  return createLocalOtpProvider({
    sms,
    codeLength: config.OTP_LENGTH,
    ttlSeconds: config.OTP_TTL_SECONDS,
    exposeCode: config.isTest || config.SMS_PROVIDER === 'mock',
    msg91TemplateId: config.MSG91_OTP_TEMPLATE_ID,
  });
}
