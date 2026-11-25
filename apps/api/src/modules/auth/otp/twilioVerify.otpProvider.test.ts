import { describe, expect, it, vi } from 'vitest';
import { createTwilioVerifyOtpProvider, type TwilioVerifyOptions } from './twilioVerify.otpProvider.js';

/**
 * BR-225: Twilio Verify issues and checks every auth OTP when OTP_PROVIDER=twilio.
 *
 * No test here touches the network: `fetch` is injected and every response is
 * fabricated. The credentials are obviously fake shapes, never the real ones.
 */

const FAKE: Omit<TwilioVerifyOptions, 'fetch'> = {
  accountSid: `AC${'0'.repeat(32)}`,
  authToken: 'test-auth-token-not-real',
  serviceSid: `VA${'1'.repeat(32)}`,
  timeoutMs: 5_000,
};
const MOBILE = '+919876543210';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function providerWith(...responses: Array<Response | Error>) {
  const fetchMock = vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => {
    const next = responses.shift();
    if (next === undefined) throw new Error('unexpected extra fetch');
    if (next instanceof Error) throw next;
    return next;
  });
  const provider = createTwilioVerifyOtpProvider({ ...FAKE, fetch: fetchMock as unknown as typeof fetch });
  return { provider, fetchMock };
}

async function startVerification(provider: ReturnType<typeof providerWith>['provider']): Promise<void> {
  const issue = provider.issue(MOBILE);
  await issue.deliver();
}

describe('BR-225: Twilio Verify OTP provider', () => {
  describe('configuration', () => {
    it('BR-225: refuses to construct with any credential missing (fail fast, no silent mock)', () => {
      for (const key of ['accountSid', 'authToken', 'serviceSid'] as const) {
        expect(() => createTwilioVerifyOtpProvider({ ...FAKE, [key]: '' })).toThrow(/Twilio/);
      }
    });
  });

  describe('start (issue + deliver)', () => {
    it('BR-225: starts an sms verification for the E.164 number with basic auth', async () => {
      const { provider, fetchMock } = providerWith(jsonResponse(201, { sid: 'VEx', status: 'pending' }));

      const issue = provider.issue(MOBILE);
      // Twilio owns the code: nothing plaintext is ever handed back to the caller.
      expect(issue.mockCode).toBeUndefined();
      expect(issue.codeHash).toMatch(/^[0-9a-f]{64}$/);
      await issue.deliver();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0]!;
      expect(String(url)).toBe(`https://verify.twilio.com/v2/Services/${FAKE.serviceSid}/Verifications`);
      expect(init?.method).toBe('POST');
      const headers = new Headers(init?.headers);
      expect(headers.get('Authorization')).toBe(
        `Basic ${Buffer.from(`${FAKE.accountSid}:${FAKE.authToken}`).toString('base64')}`,
      );
      expect(headers.get('Content-Type')).toBe('application/x-www-form-urlencoded');
      const form = new URLSearchParams(String(init?.body));
      expect(form.get('To')).toBe(MOBILE);
      expect(form.get('Channel')).toBe('sms');
    });

    it('BR-225: each issue gets a different unguessable code hash (no shared sentinel)', () => {
      const { provider } = providerWith();
      expect(provider.issue(MOBILE).codeHash).not.toBe(provider.issue(MOBILE).codeHash);
    });

    it('BR-225: Twilio send rate limit (429 / 60203) -> 429 OTP_PROVIDER_RATE_LIMITED', async () => {
      const { provider } = providerWith(jsonResponse(429, { code: 60203, message: 'Max send attempts reached', status: 429 }));
      await expect(startVerification(provider)).rejects.toMatchObject({ code: 'OTP_PROVIDER_RATE_LIMITED', status: 429 });
    });

    it('BR-225: invalid destination number (60200 / 21211 / 21614 / 60205) -> 422 OTP_DESTINATION_INVALID', async () => {
      for (const code of [60200, 21211, 21614, 60205]) {
        const { provider } = providerWith(jsonResponse(400, { code, message: `The 'To' number ${MOBILE} is not valid`, status: 400 }));
        await expect(startVerification(provider)).rejects.toMatchObject({ code: 'OTP_DESTINATION_INVALID', status: 422 });
      }
    });

    it('BR-225: auth failure, trial/geo restriction or 5xx -> 502 OTP_SMS_DELIVERY_FAILED', async () => {
      for (const [status, code] of [[401, 20003], [400, 21608], [400, 21408], [503, 20500]] as const) {
        const { provider } = providerWith(jsonResponse(status, { code, message: 'nope', status }));
        await expect(startVerification(provider)).rejects.toMatchObject({ code: 'OTP_SMS_DELIVERY_FAILED', status: 502 });
      }
    });

    it('BR-225: a network failure on start -> 502 OTP_SMS_DELIVERY_FAILED', async () => {
      const { provider } = providerWith(new TypeError('fetch failed'));
      await expect(startVerification(provider)).rejects.toMatchObject({ code: 'OTP_SMS_DELIVERY_FAILED', status: 502 });
    });
  });

  describe('check', () => {
    const input = { mobile: MOBILE, code: '482913', codeHash: 'irrelevant-for-twilio' };

    it('BR-225: status approved -> true, posting To + Code to VerificationCheck', async () => {
      const { provider, fetchMock } = providerWith(jsonResponse(200, { status: 'approved', valid: true }));
      await expect(provider.check(input)).resolves.toBe(true);

      const [url, init] = fetchMock.mock.calls[0]!;
      expect(String(url)).toBe(`https://verify.twilio.com/v2/Services/${FAKE.serviceSid}/VerificationCheck`);
      const form = new URLSearchParams(String(init?.body));
      expect(form.get('To')).toBe(MOBILE);
      expect(form.get('Code')).toBe('482913');
    });

    it('BR-225: wrong code (status pending) -> false, so the BR-32 attempt counter applies', async () => {
      const { provider } = providerWith(jsonResponse(200, { status: 'pending', valid: false }));
      await expect(provider.check(input)).resolves.toBe(false);
    });

    it('BR-225: any status other than approved is never treated as success', async () => {
      for (const status of ['canceled', 'failed', 'max_attempts_reached', 'expired', undefined]) {
        const { provider } = providerWith(jsonResponse(200, { status, valid: true }));
        await expect(provider.check(input)).resolves.toBe(false);
      }
    });

    it('BR-225: expired / already used / not found (404 / 20404) -> 400 OTP_EXPIRED', async () => {
      const { provider } = providerWith(jsonResponse(404, { code: 20404, message: 'not found', status: 404 }));
      await expect(provider.check(input)).rejects.toMatchObject({ code: 'OTP_EXPIRED', status: 400 });
    });

    it('BR-225: Twilio max check attempts (60202) -> 429 OTP_LOCKED', async () => {
      const { provider } = providerWith(jsonResponse(429, { code: 60202, message: 'Max check attempts reached', status: 429 }));
      await expect(provider.check(input)).rejects.toMatchObject({ code: 'OTP_LOCKED', status: 429 });
    });

    it('BR-225: Twilio request rate limit (429 / 20429) on check -> 429 OTP_PROVIDER_RATE_LIMITED', async () => {
      const { provider } = providerWith(jsonResponse(429, { code: 20429, message: 'Too many requests', status: 429 }));
      await expect(provider.check(input)).rejects.toMatchObject({ code: 'OTP_PROVIDER_RATE_LIMITED', status: 429 });
    });

    it('BR-225: provider outage on check -> 503 OTP_PROVIDER_UNAVAILABLE (never a silent pass)', async () => {
      const outage = providerWith(jsonResponse(500, { code: 20500, message: 'boom', status: 500 }));
      await expect(outage.provider.check(input)).rejects.toMatchObject({ code: 'OTP_PROVIDER_UNAVAILABLE', status: 503 });
      const network = providerWith(new TypeError('fetch failed'));
      await expect(network.provider.check(input)).rejects.toMatchObject({ code: 'OTP_PROVIDER_UNAVAILABLE', status: 503 });
    });
  });

  describe('secrecy', () => {
    it('BR-225: errors never carry the full number, the code or the auth token', async () => {
      const { provider } = providerWith(
        jsonResponse(400, { code: 60200, message: `Invalid parameter To: ${MOBILE}`, status: 400 }),
        jsonResponse(500, { code: 20500, message: `boom ${MOBILE}`, status: 500 }),
      );
      const startError = await startVerification(provider).catch((e: unknown) => e);
      const checkError = await provider
        .check({ mobile: MOBILE, code: '482913', codeHash: 'x' })
        .catch((e: unknown) => e);
      for (const error of [startError, checkError]) {
        const text = JSON.stringify(error) + String((error as Error).message);
        expect(text).not.toContain(MOBILE);
        expect(text).not.toContain('482913');
        expect(text).not.toContain(FAKE.authToken);
      }
    });
  });
});
