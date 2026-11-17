/** BR-184: vendor-neutral email layer -- transports, redaction, templates, config. */
import { describe, expect, it, vi } from 'vitest';
import { renderOtpEmail } from './templates.js';
import { createDisabledSender, createLogSender, createSmtpSender, redact } from './transports.js';

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
    const saved = { ...process.env };
    delete process.env.EMAIL_TRANSPORT;
    Object.assign(process.env, base, env);
    try {
      return await import('../config.js');
    } finally {
      process.env = saved;
    }
  }
  it('production without EMAIL_TRANSPORT=smtp fails startup clearly', async () => {
    await expect(load({})).rejects.toThrow(/EMAIL_TRANSPORT=smtp is required/);
    await expect(load({ EMAIL_TRANSPORT: 'disabled' })).rejects.toThrow(/EMAIL_TRANSPORT=smtp is required/);
  });
  it('smtp requires host and from', async () => {
    await expect(load({ EMAIL_TRANSPORT: 'smtp' })).rejects.toThrow(/SMTP_HOST, EMAIL_FROM/);
  });
  it('dev defaults to log', async () => {
    const m = await load({ NODE_ENV: 'development' });
    expect(m.config.EMAIL_TRANSPORT).toBe('log');
  });
});
