/** BR-184: vendor-neutral email layer -- transports, redaction, templates, config. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderOtpEmail } from './templates.js';
import {
  createDisabledSender,
  createLogSender,
  createSendGridSender,
  createSmtpSender,
  redact,
} from './transports.js';

const msg = { to: 'a@example.com', subject: 's 123456', text: 'code 123456', html: '<b>123456</b>', redact: ['123456'] };

describe('BR-184: email transports', () => {
  it('log transport redacts the OTP in every logged field and keeps raw only on request', async () => {
    const lines: string[] = [];
    const s = createLogSender((l) => lines.push(l));
    await s.send(msg);
    expect(lines.join('\n')).not.toContain('123456');
    expect(s.last?.html).not.toContain('123456');
    expect(s.lastRaw).toBeNull();
    const t = createLogSender(() => undefined, { keepRaw: true });
    await t.send(msg);
    expect(t.lastRaw?.text).toContain('123456');
  });

  it('redact ignores empty secrets', () => {
    expect(redact('abc', [''])).toBe('abc');
  });

  it('smtp transport sends via the transporter with a branded From', async () => {
    const sendMail = vi.fn(async () => ({}));
    const s = createSmtpSender(
      { host: 'h', port: 587, secure: false, from: 'no-reply@tohfa.in', fromName: 'TOHFA' },
      { sendMail },
    );
    await s.send(msg);
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ from: '"TOHFA" <no-reply@tohfa.in>', to: 'a@example.com' }),
    );
  });

  it('smtp failure becomes EMAIL_DELIVERY_FAILED without leaking the vendor error', async () => {
    const s = createSmtpSender(
      { host: 'h', port: 587, secure: false, from: 'x@y.in', fromName: 'T' },
      { sendMail: async () => Promise.reject(new Error('auth failed user=secret pass=hunter2')) },
    );
    const err = await s.send(msg).catch((e: unknown) => e);
    expect(err).toMatchObject({ code: 'EMAIL_DELIVERY_FAILED' });
    expect(JSON.stringify(err, Object.getOwnPropertyNames(err))).not.toContain('hunter2');
  });

  it('disabled transport is unconfigured and throws EMAIL_NOT_CONFIGURED', async () => {
    const s = createDisabledSender();
    expect(s.configured).toBe(false);
    await expect(s.send(msg)).rejects.toMatchObject({ code: 'EMAIL_NOT_CONFIGURED' });
  });
});

describe('BR-184: OTP template', () => {
  it('renders subject, code, expiry, ignore note and TOHFA branding in text and html', () => {
    const m = renderOtpEmail('654321', 10);
    expect(m.subject).toContain('654321');
    for (const body of [m.text, m.html]) {
      expect(body).toContain('654321');
      expect(body).toContain('10 minutes');
      expect(body).toContain('TOHFA');
      expect(body).toContain('ignore');
      expect(body.toLowerCase()).not.toContain('farm');
    }
  });
});

describe('BR-184: config', () => {
  const base = {
    NODE_ENV: 'production',
    DATABASE_URL: 'postgres://x',
    REDIS_URL: 'redis://x',
    JWT_SECRET: 'x'.repeat(40),
    PAYMENT_PROVIDER: 'razorpay',
    SMS_PROVIDER: 'msg91',
  };
  async function load(env: Record<string, string>) {
    vi.resetModules();
    // Hermetic: never let the developer's repo-root .env leak into these cases.
    vi.doMock('dotenv', () => ({ config: () => ({}) }));
    const saved = { ...process.env };
    for (const k of ['EMAIL_TRANSPORT', 'EMAIL_PROVIDER', 'SENDGRID_API_KEY', 'SENDGRID_FROM_EMAIL', 'SENDGRID_FROM_NAME', 'EMAIL_FROM', 'SMTP_HOST']) {
      delete process.env[k];
    }
    Object.assign(process.env, base, env);
    try {
      return await import('../config.js');
    } finally {
      vi.doUnmock('dotenv');
      process.env = saved;
    }
  }
  it('production without EMAIL_TRANSPORT=smtp|sendgrid fails startup clearly', async () => {
    await expect(load({})).rejects.toThrow(/smtp or sendgrid is required/);
    await expect(load({ EMAIL_TRANSPORT: 'disabled' })).rejects.toThrow(/smtp or sendgrid is required/);
    await expect(load({ EMAIL_TRANSPORT: 'log' })).rejects.toThrow(/smtp or sendgrid is required/);
  });
  it('production accepts sendgrid', async () => {
    const m = await load({ EMAIL_TRANSPORT: 'sendgrid', SENDGRID_API_KEY: 'SG.test-key', SENDGRID_FROM_EMAIL: 'a@example.com' });
    expect(m.config.EMAIL_TRANSPORT).toBe('sendgrid');
  });
  it('EMAIL_PROVIDER=sendgrid selects sendgrid; EMAIL_TRANSPORT wins when both set', async () => {
    const dev = { NODE_ENV: 'development', SENDGRID_API_KEY: 'SG.test-key', SENDGRID_FROM_EMAIL: 'a@example.com' };
    expect((await load({ ...dev, EMAIL_PROVIDER: 'sendgrid' })).config.EMAIL_TRANSPORT).toBe('sendgrid');
    expect((await load({ ...dev, EMAIL_PROVIDER: 'sendgrid', EMAIL_TRANSPORT: 'log' })).config.EMAIL_TRANSPORT).toBe('log');
  });
  it('sendgrid requires the key and a from address, naming the variable not the value', async () => {
    const dev = { NODE_ENV: 'development', EMAIL_PROVIDER: 'sendgrid' };
    await expect(load({ ...dev, SENDGRID_FROM_EMAIL: 'a@example.com' })).rejects.toThrow(/SENDGRID_API_KEY/);
    await expect(load({ ...dev, SENDGRID_API_KEY: 'SG.test-key' })).rejects.toThrow(/SENDGRID_FROM_EMAIL/);
    await expect(load({ ...dev, SENDGRID_API_KEY: 'SG.test-key' })).rejects.not.toThrow(/SG\.test-key/);
    // EMAIL_FROM is an accepted fallback sender.
    const m = await load({ ...dev, SENDGRID_API_KEY: 'SG.test-key', EMAIL_FROM: 'f@example.com' });
    expect(m.config.EMAIL_TRANSPORT).toBe('sendgrid');
  });
  it('smtp requires host and from', async () => {
    await expect(load({ EMAIL_TRANSPORT: 'smtp' })).rejects.toThrow(/SMTP_HOST, EMAIL_FROM/);
  });
  it('dev defaults to log', async () => {
    const m = await load({ NODE_ENV: 'development' });
    expect(m.config.EMAIL_TRANSPORT).toBe('log');
  });
});

describe('BR-184: sendgrid transport', () => {
  const opts = { apiKey: 'SG.test-key', from: 'no-reply@tohfa.in', fromName: 'TOHFA' };
  const fetchMock = vi.fn();
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });
  const stub = (impl: (...a: unknown[]) => unknown) => {
    fetchMock.mockImplementation(impl);
    vi.stubGlobal('fetch', fetchMock);
  };

  it('posts the v3 Mail Send payload with bearer auth', async () => {
    stub(async () => new Response(null, { status: 202 }));
    await createSendGridSender(opts).send(msg);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.sendgrid.com/v3/mail/send');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer SG.test-key');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body as string)).toEqual({
      personalizations: [{ to: [{ email: 'a@example.com' }] }],
      from: { email: 'no-reply@tohfa.in', name: 'TOHFA' },
      subject: msg.subject,
      content: [
        { type: 'text/plain', value: msg.text },
        { type: 'text/html', value: msg.html },
      ],
    });
  });

  it('non-2xx becomes EMAIL_DELIVERY_FAILED without leaking key, OTP or recipient', async () => {
    stub(async () =>
      new Response(JSON.stringify({ errors: [{ message: 'The from address does not match a verified Sender Identity.' }] }), { status: 403 }),
    );
    const err = (await createSendGridSender(opts).send(msg).catch((e: unknown) => e)) as Error;
    expect(err).toMatchObject({ code: 'EMAIL_DELIVERY_FAILED' });
    const text = JSON.stringify({ m: err.message, d: (err as { detail?: unknown }).detail, s: String(err.stack) });
    expect(text).not.toContain('SG.test-key');
    expect(text).not.toContain('123456');
    expect(text).not.toContain('a@example.com');
  });

  it('network error and timeout become EMAIL_DELIVERY_FAILED', async () => {
    stub(async () => {
      throw new Error('connect ECONNREFUSED a@example.com SG.test-key');
    });
    const err = (await createSendGridSender(opts).send(msg).catch((e: unknown) => e)) as Error;
    expect(err).toMatchObject({ code: 'EMAIL_DELIVERY_FAILED' });
    expect(JSON.stringify({ m: err.message, d: (err as { detail?: unknown }).detail })).not.toContain('SG.test-key');

    stub((_u: unknown, init: unknown) =>
      new Promise((_res, rej) => {
        (init as RequestInit).signal?.addEventListener('abort', () => rej(new Error('aborted')));
      }),
    );
    await expect(createSendGridSender({ ...opts, timeoutMs: 10 }).send(msg)).rejects.toMatchObject({
      code: 'EMAIL_DELIVERY_FAILED',
    });
  });

  it('configured is true only with key and sender', () => {
    expect(createSendGridSender(opts).configured).toBe(true);
    expect(createSendGridSender({ ...opts, apiKey: '' }).configured).toBe(false);
    expect(createSendGridSender({ ...opts, from: '' }).configured).toBe(false);
  });

  it('unconfigured sender throws EMAIL_NOT_CONFIGURED and makes no request', async () => {
    stub(async () => new Response(null, { status: 202 }));
    await expect(createSendGridSender({ ...opts, apiKey: '' }).send(msg)).rejects.toMatchObject({ code: 'EMAIL_NOT_CONFIGURED' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
