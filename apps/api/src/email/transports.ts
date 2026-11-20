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
