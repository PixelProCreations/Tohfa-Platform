import { config } from '../../../config.js';
import { logger } from '../../../logger.js';
import { maskMobile } from './mock.sms.js';
import type { SendSmsParams, SmsSendResult, SmsTransport } from './sms.transport.js';

export class Msg91SmsTransport implements SmsTransport {
  readonly provider = 'msg91' as const;

  async sendSms(params: SendSmsParams): Promise<SmsSendResult> {
    const authKey = config.MSG91_AUTH_KEY;
    if (!authKey) {
      logger.error('MSG91_AUTH_KEY is not configured');
      return {
        providerMessageId: `msg91-err-${Date.now()}`,
        status: 'FAILED',
        error: 'MSG91_AUTH_KEY is missing from configuration.',
      };
    }

    if (!params.templateId) {
      logger.error('MSG91 Flow API call attempted with no templateId');
      return {
        providerMessageId: `msg91-err-${Date.now()}`,
        status: 'FAILED',
        error: 'templateId is required for MSG91 Flow API (DLT-approved templates only, no free text).',
      };
    }

    try {
      // MSG91 Flow API: DLT-approved template, filled in by variable name --
      // never free text. `params.message` is intentionally unused here (see
      // SendSmsParams' own doc comment); `templateVars` keys must match the
      // approved template's own placeholder names exactly.
      const response = await fetch('https://control.msg91.com/api/v5/flow/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authkey: authKey,
        },
        body: JSON.stringify({
          template_id: params.templateId,
          recipients: [
            {
              mobiles: params.to.replace(/^\+/, ''),
              ...params.templateVars,
            },
          ],
        }),
      });

      const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;

      if (!response.ok) {
        const errorMsg = String(body['message'] ?? response.statusText);
        logger.warn(
          { to: maskMobile(params.to), status: response.status, error: errorMsg },
          'MSG91 SMS send rejected by provider',
        );
        return {
          providerMessageId: `msg91-${Date.now()}`,
          status: 'FAILED',
          error: `MSG91 HTTP ${response.status}: ${errorMsg}`,
        };
      }

      const messageId = String(body['message'] ?? `msg91-${Date.now()}`);
      logger.info(
        { to: maskMobile(params.to), providerMessageId: messageId },
        'MSG91 SMS sent successfully',
      );

      return {
        providerMessageId: messageId,
        status: 'SENT',
      };
    } catch (err: unknown) {
      const error = (err as Error).message;
      logger.error({ to: maskMobile(params.to), err }, 'MSG91 SMS dispatch network failure');
      return {
        providerMessageId: `msg91-err-${Date.now()}`,
        status: 'FAILED',
        error,
      };
    }
  }
}

export const msg91SmsTransport = new Msg91SmsTransport();
