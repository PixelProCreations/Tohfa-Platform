import crypto from 'node:crypto';
import { AppError } from '../../../http/problem.js';
import { logger } from '../../../logger.js';
import { maskMobile } from '../../notifications/sms/mock.sms.js';
import type { OtpCheckInput, OtpIssue, OtpProvider } from './otpProvider.js';

/**
 * BR-218: Twilio Verify as the OTP provider (plain fetch, no SDK dependency).
 *
 *   start  POST /v2/Services/{sid}/Verifications       To=<E.164>, Channel=sms
 *   check  POST /v2/Services/{sid}/VerificationCheck   To=<E.164>, Code=<code>
 *
 * Twilio generates, stores and expires the code. We still keep our own
 * challenge row (BR-32), and its limits are the stricter ones: our TTL and
 * 3-attempt lockout apply before Twilio is ever asked.
 *
 * Secrecy: nothing here logs or throws the full number, the code or the auth
 * token. Twilio's own `message` field is deliberately dropped, because it
 * routinely echoes the destination number back.
 */

const API_BASE = 'https://verify.twilio.com/v2/Services';

/** Twilio error codes that mean "this destination cannot receive an OTP", i.e. the user's input. */
const DESTINATION_INVALID = new Set([
  60200, // invalid parameter (the To number)
  21211, // invalid 'To' phone number
  21614, // 'To' number is not a valid mobile number
  60205, // SMS is not supported by landline phone number
]);
/** Twilio-side rate limits. */
const RATE_LIMITED = new Set([60203 /* max send attempts */, 20429 /* too many requests */]);
const MAX_CHECK_ATTEMPTS = 60202;
const NOT_FOUND = 20404;

export interface TwilioVerifyOptions {
  accountSid: string;
  authToken: string;
  serviceSid: string;
  timeoutMs: number;
  /** Injected in tests; the global fetch otherwise. */
  fetch?: typeof fetch;
}

interface TwilioReply {
  httpStatus: number;
  body: Record<string, unknown>;
}

function twilioErrorCode(reply: TwilioReply): number | undefined {
  const code = reply.body['code'];
  return typeof code === 'number' ? code : undefined;
}

export function createTwilioVerifyOtpProvider(options: TwilioVerifyOptions): OtpProvider {
  const { accountSid, authToken, serviceSid, timeoutMs } = options;
  // config.ts already fails boot for this; repeated here so the provider can
  // never be built half-configured from a script or test either.
  if (!accountSid || !authToken || !serviceSid) {
    throw new Error('Twilio Verify provider requires accountSid, authToken and serviceSid');
  }
  const doFetch = options.fetch ?? fetch;
  const authorization = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`;

  async function post(path: 'Verifications' | 'VerificationCheck', form: Record<string, string>): Promise<TwilioReply> {
    const response = await doFetch(`${API_BASE}/${serviceSid}/${path}`, {
      method: 'POST',
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams(form).toString(),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    return { httpStatus: response.status, body };
  }

  function logRejection(operation: 'start' | 'check', mobile: string, reply: TwilioReply): void {
    logger.warn(
      { provider: 'twilio', operation, to: maskMobile(mobile), httpStatus: reply.httpStatus, twilioCode: twilioErrorCode(reply) },
      'Twilio Verify rejected the request',
    );
  }

  async function start(mobile: string): Promise<void> {
    let reply: TwilioReply;
    try {
      reply = await post('Verifications', { To: mobile, Channel: 'sms' });
    } catch (err) {
      logger.error({ provider: 'twilio', operation: 'start', to: maskMobile(mobile), errName: (err as Error).name }, 'Twilio Verify unreachable');
      throw new AppError('OTP_SMS_DELIVERY_FAILED', { status: 502, detail: 'Could not send the OTP SMS. Please try again in a moment.' });
    }
    if (reply.httpStatus >= 200 && reply.httpStatus < 300) return;

    logRejection('start', mobile, reply);
    const code = twilioErrorCode(reply);
    if (reply.httpStatus === 429 || (code !== undefined && RATE_LIMITED.has(code))) {
      throw new AppError('OTP_PROVIDER_RATE_LIMITED', {
        status: 429,
        detail: 'Too many OTP requests for this number. Please try again later.',
      });
    }
    if (code !== undefined && DESTINATION_INVALID.has(code)) {
      throw new AppError('OTP_DESTINATION_INVALID', {
        status: 422,
        detail: 'This mobile number cannot receive an OTP SMS.',
      });
    }
    // Auth failure, trial-account unverified number (21608), geo permission
    // (21408), 5xx: an operator problem, not the user's. Generic to the caller;
    // the Twilio code is in the log above.
    throw new AppError('OTP_SMS_DELIVERY_FAILED', { status: 502, detail: 'Could not send the OTP SMS. Please try again in a moment.' });
  }

  return {
    name: 'twilio',

    issue(mobile): OtpIssue {
      return {
        codeHash: crypto.createHash('sha256').update(crypto.randomBytes(32)).digest('hex'),
        deliver: () => start(mobile),
      };
    },

    async check({ mobile, code }: OtpCheckInput): Promise<boolean> {
      let reply: TwilioReply;
      try {
        reply = await post('VerificationCheck', { To: mobile, Code: code });
      } catch (err) {
        logger.error({ provider: 'twilio', operation: 'check', to: maskMobile(mobile), errName: (err as Error).name }, 'Twilio Verify unreachable');
        throw new AppError('OTP_PROVIDER_UNAVAILABLE', { status: 503, detail: 'Could not verify the OTP right now. Please try again.' });
      }

      if (reply.httpStatus >= 200 && reply.httpStatus < 300) {
        // Only an explicit `approved` is success; `pending` is a wrong code.
        return reply.body['status'] === 'approved';
      }

      logRejection('check', mobile, reply);
      const twilioCode = twilioErrorCode(reply);
      if (twilioCode === MAX_CHECK_ATTEMPTS) {
        throw new AppError('OTP_LOCKED', { status: 429, detail: 'OTP challenge is locked due to too many failed attempts.' });
      }
      if (reply.httpStatus === 429 || (twilioCode !== undefined && RATE_LIMITED.has(twilioCode))) {
        throw new AppError('OTP_PROVIDER_RATE_LIMITED', { status: 429, detail: 'Too many OTP attempts. Please try again later.' });
      }
      // 404: no pending verification for this number -- expired at Twilio,
      // already approved, or cancelled. A new OTP is needed either way.
      if (reply.httpStatus === 404 || twilioCode === NOT_FOUND) {
        throw new AppError('OTP_EXPIRED', { status: 400, detail: 'OTP challenge has expired.' });
      }
      throw new AppError('OTP_PROVIDER_UNAVAILABLE', { status: 503, detail: 'Could not verify the OTP right now. Please try again.' });
    },
  };
}
