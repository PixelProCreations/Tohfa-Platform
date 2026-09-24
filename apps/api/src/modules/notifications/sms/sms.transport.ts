export interface SendSmsParams {
  /** E.164 or national phone number */
  to: string;
  /** Free-text body. Used as-is by transports that send raw SMS (mock). */
  message: string;
  templateId?: string | undefined;
  /**
   * Variable name -> value, for transports whose provider requires a
   * pre-approved DLT template rather than a free-text body (msg91's Flow
   * API). Keys must match the template's own variable names exactly (e.g. a
   * template reading "Your OTP is ##OTP##" needs `{ OTP: '123456' }`) --
   * mismatched keys are silently dropped by the provider, not rejected, so
   * getting this wrong fails quietly rather than loudly.
   */
  templateVars?: Record<string, string> | undefined;
}

export interface SmsSendResult {
  providerMessageId: string;
  status: 'SENT' | 'DELIVERED' | 'FAILED';
  error?: string | undefined;
}

export interface SmsTransport {
  readonly provider: 'mock' | 'msg91';
  sendSms(params: SendSmsParams): Promise<SmsSendResult>;
}
