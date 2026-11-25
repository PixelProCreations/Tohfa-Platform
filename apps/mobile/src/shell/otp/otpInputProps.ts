import type { TextInputProps } from 'react-native';

/** docs/openapi.yaml: every OTP `code` is `^[0-9]{6}$`, for every role. */
export const OTP_CODE_LENGTH = 6;

/**
 * Keyboard/OS-level autofill hints for the TextInput that receives an SMS
 * one-time code. Spread onto exactly one input per OTP field (for a row of
 * per-digit boxes, the first box):
 *
 * - `textContentType="oneTimeCode"`: iOS offers the code from Messages above
 *   the keyboard. This is the whole iOS story — there is no SMS-read API.
 * - `autoComplete="sms-otp"` + `importantForAutofill="yes"`: Android's
 *   autofill framework / Gboard offer the code as a suggestion chip.
 *
 * The Android SMS User Consent flow (useOtpSmsAutofill) is a separate,
 * stronger path; these hints still matter when the user denies that sheet.
 */
export const otpTextInputProps = {
  keyboardType: 'number-pad',
  textContentType: 'oneTimeCode',
  autoComplete: 'sms-otp',
  importantForAutofill: 'yes',
  maxLength: OTP_CODE_LENGTH,
} as const satisfies Partial<TextInputProps>;
