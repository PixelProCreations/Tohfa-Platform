/**
 * Pulls a one-time code out of an SMS body.
 *
 * The SMS is written by Twilio Verify (apps/api/src/modules/auth/otp/
 * twilioVerify.otpProvider.ts), not by us, so its wording can change from
 * template to template and locale to locale. The only thing we rely on is
 * that the code is a standalone run of exactly `length` digits: a longer
 * digit run (a phone number, an order id) is never mistaken for it, and a
 * message with no such run returns null so the caller keeps waiting for
 * the next SMS instead of filling garbage.
 *
 * No lookbehind on purpose: the leading boundary is a capture-free
 * alternation so the pattern runs on every JS engine this app ships to.
 */
export function extractOtpCode(message: string | null | undefined, length: number): string | null {
  if (!message || length <= 0) {
    return null;
  }
  const pattern = new RegExp(`(?:^|\\D)(\\d{${length}})(?!\\d)`);
  const match = pattern.exec(message);
  return match?.[1] ?? null;
}

/**
 * Normalises whatever the keyboard handed a code field — a typed digit, a
 * pasted "123 456", or a keyboard/OS autofill — to at most `length` digits.
 */
export function sanitizeOtpInput(text: string, length: number): string {
  return text.replace(/\D/g, '').slice(0, length);
}
