/**
 * BR-218: the one seam through which every auth OTP is issued and checked.
 *
 * The auth services keep the BR-32 machinery on our own `otp_verifications`
 * row (resend cooldown, 3-attempt lockout, local expiry, single use) and only
 * delegate the two things a provider may own: making/sending the code, and
 * saying whether a submitted code is right. That split is why Twilio Verify
 * (which generates, stores and expires the code itself) and the in-house
 * generator can sit behind the same interface without either path bypassing
 * BR-32.
 */

export type OtpProviderName = 'local' | 'twilio';

export interface OtpIssue {
  /**
   * Stored in `otp_verifications.code_hash`. For the local provider it is the
   * SHA-256 of the code. A provider that keeps the code itself (Twilio) returns
   * the hash of random bytes nobody knows, so the row can never be satisfied by
   * a local hash comparison if the provider is later switched.
   */
  codeHash: string;
  /** Plaintext code for the dev/test mock SMS path only. A live provider never sets it. */
  mockCode?: string;
  /**
   * Sends the code. Called AFTER the challenge row is persisted, so the resend
   * cooldown applies even when delivery fails. Throws an AppError on failure.
   */
  deliver(): Promise<void>;
}

export interface OtpCheckInput {
  /** E.164, already validated by the request schema. */
  mobile: string;
  code: string;
  /** The challenge row's stored `code_hash`. */
  codeHash: string;
}

export interface OtpProvider {
  readonly name: OtpProviderName;
  issue(mobile: string): OtpIssue;
  /**
   * true = correct code, false = wrong code (the caller counts the attempt).
   * Throws an AppError for a provider-decided terminal state (expired, locked,
   * rate limited, unavailable). Never resolves true on an error.
   */
  check(input: OtpCheckInput): Promise<boolean>;
}
