import { config } from '../config.js';
import { logger } from '../logger.js';
import type { EmailSender } from './email.types.js';
import { createDisabledSender, createLogSender, createSmtpSender } from './transports.js';

export * from './email.types.js';
export * from './templates.js';
export { createDisabledSender, createLogSender, createSmtpSender } from './transports.js';

export function buildEmailSender(): EmailSender {
  switch (config.EMAIL_TRANSPORT) {
    case 'smtp':
      return createSmtpSender({
        host: config.SMTP_HOST as string,
        port: config.SMTP_PORT,
        secure: config.SMTP_SECURE,
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
        from: config.EMAIL_FROM as string,
        fromName: config.EMAIL_FROM_NAME,
      });
    case 'log':
      return createLogSender((line) => logger.info(line), { keepRaw: config.isTest });
    default:
      return createDisabledSender();
  }
}

export const emailSender: EmailSender = buildEmailSender();
