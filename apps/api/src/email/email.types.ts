/** Vendor-neutral outbound email. Transports implement EmailSender; callers never see a vendor SDK. */
export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
  /** Substrings (e.g. an OTP) the `log` transport must redact before printing. */
  redact?: readonly string[];
}

export interface EmailSender {
  /** False for the `disabled` transport; callers check this before spending rate-limit budget. */
  readonly configured: boolean;
  send(message: EmailMessage): Promise<void>;
}
