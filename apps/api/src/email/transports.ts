import nodemailer from 'nodemailer';
import { AppError } from '../http/problem.js';
import type { EmailMessage, EmailSender } from './email.types.js';

export interface SmtpOptions {
  host: string;
  port: number;
  secure: boolean;
  user?: string | undefined;
  pass?: string | undefined;
  from: string;
  fromName: string;
}

/** Minimal slice of a nodemailer transporter, so tests inject a fake. */
export interface MailTransporter {
  sendMail(m: { from: string; to: string; subject: string; text: string; html: string }): Promise<unknown>;
}

export function createSmtpSender(opts: SmtpOptions, transporter?: MailTransporter): EmailSender {
  const t: MailTransporter =
    transporter ??
    nodemailer.createTransport({
      host: opts.host,
      port: opts.port,
      secure: opts.secure,
      ...(opts.user !== undefined && opts.pass !== undefined ? { auth: { user: opts.user, pass: opts.pass } } : {}),
    });
  const from = `"${opts.fromName.replace(/"/g, '')}" <${opts.from}>`;
  return {
    configured: true,
    async send(m) {
      try {
        await t.sendMail({ from, to: m.to, subject: m.subject, text: m.text, html: m.html });
      } catch {
        // The vendor error may echo addresses or credentials: never forward or log it.
        throw new AppError('EMAIL_DELIVERY_FAILED', { detail: 'The email could not be delivered. Try again shortly.' });
      }
    },
  };
}

export interface SendGridOptions {
  apiKey: string;
  from: string;
  fromName: string;
  /** Request timeout; default 10s. */
  timeoutMs?: number;
}

export const SENDGRID_SEND_URL = 'https://api.sendgrid.com/v3/mail/send';

/** SendGrid v3 Mail Send over built-in fetch (no SDK dependency). */
export function createSendGridSender(opts: SendGridOptions): EmailSender {
  const configured = opts.apiKey !== '' && opts.from !== '';
  return {
    configured,
    async send(m) {
      if (!configured) {
        throw new AppError('EMAIL_NOT_CONFIGURED', { detail: 'Email delivery is not configured.' });
      }
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 10_000);
      try {
        const res = await fetch(SENDGRID_SEND_URL, {
          method: 'POST',
          headers: { Authorization: `Bearer ${opts.apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: m.to }] }],
            from: { email: opts.from, name: opts.fromName },
            subject: m.subject,
            content: [
              { type: 'text/plain', value: m.text },
              { type: 'text/html', value: m.html },
            ],
          }),
          signal: ctrl.signal,
        });
        if (!res.ok) {
          // Only the status is surfaced: SendGrid error text can echo addresses, and 403
          // usually means the From is not a verified Sender Identity (operator hint below).
          const hint = res.status === 401 || res.status === 403 ? ' (check API key and verified sender)' : '';
          throw new AppError('EMAIL_DELIVERY_FAILED', {
            detail: `The email could not be delivered (provider status ${res.status})${hint}. Try again shortly.`,
          });
        }
      } catch (e) {
        if (e instanceof AppError) throw e;
        // Network/abort errors may echo the URL, headers or address: never forward them.
        throw new AppError('EMAIL_DELIVERY_FAILED', { detail: 'The email could not be delivered. Try again shortly.' });
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

export function createDisabledSender(): EmailSender {
  return {
    configured: false,
    async send() {
      throw new AppError('EMAIL_NOT_CONFIGURED', { detail: 'Email delivery is not configured.' });
    },
  };
}

export interface LogSender extends EmailSender {
  /** Last message as logged (redacted) -- for tests. */
  readonly last: EmailMessage | null;
  /** Last message unredacted -- only populated when `keepRaw` (tests). */
  readonly lastRaw: EmailMessage | null;
}

export function redact(text: string, secrets: readonly string[] | undefined): string {
  return (secrets ?? []).reduce((acc, s) => (s === '' ? acc : acc.split(s).join('******')), text);
}

export function createLogSender(
  log: (line: string) => void,
  opts: { keepRaw?: boolean } = {},
): LogSender {
  let last: EmailMessage | null = null;
  let lastRaw: EmailMessage | null = null;
  return {
    configured: true,
    get last() {
      return last;
    },
    get lastRaw() {
      return lastRaw;
    },
    async send(m) {
      const safe: EmailMessage = {
        to: m.to,
        subject: redact(m.subject, m.redact),
        text: redact(m.text, m.redact),
        html: redact(m.html, m.redact),
      };
      last = safe;
      if (opts.keepRaw === true) lastRaw = m;
      log(`[email:log] to=${safe.to} subject=${safe.subject}\n${safe.text}`);
    },
  };
}
