/**
 * Field rules for the auth screens (login, forgot / reset password).
 * Pure so the screens and tests share one definition.
 *
 * Password limits come from docs/openapi.yaml `/auth/reset-password`
 * (`newPassword`: minLength 10, maxLength 128). Login deliberately applies NO
 * minimum to the password it is given -- accounts created under an older policy
 * must still be able to sign in; the server is the authority there.
 */
import type { TranslationKey } from '../../../../i18n/farmer';
import {
  indianMobile,
  required,
  VALIDATION_MESSAGES,
  type FieldRules,
  type Validator,
} from '../../utils/validation';

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;

/** Not yet in farmer.*.json -- see the keys file handed to the orchestrator. */
export const PASSWORD_MISMATCH_KEY = 'farmer.validation.passwordMismatch' as TranslationKey;

export type LoginField = 'mobile' | 'password';
export type ForgotField = 'mobile';
export type ResetField = 'password' | 'confirmPassword';

export const LOGIN_FIELD_ORDER: readonly LoginField[] = ['mobile', 'password'];
export const RESET_FIELD_ORDER: readonly ResetField[] = ['password', 'confirmPassword'];

/** Raw (untrimmed) length: spaces are legitimate password characters. */
function passwordLength(min: number, max: number): Validator {
  return (value) => {
    if (value.length === 0) return null;
    if (value.length < min) return { key: VALIDATION_MESSAGES.tooShort, params: { min } };
    if (value.length > max) return { key: VALIDATION_MESSAGES.tooLong, params: { max } };
    return null;
  };
}

export const loginRules: FieldRules<LoginField> = {
  mobile: [required(), indianMobile()],
  password: [required()],
};

export const forgotRules: FieldRules<ForgotField> = {
  mobile: [required(), indianMobile()],
};

export function resetRules(password: string): FieldRules<ResetField> {
  const matches: Validator = (value) =>
    value.length > 0 && value !== password ? { key: PASSWORD_MISMATCH_KEY } : null;
  return {
    password: [required(), passwordLength(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH)],
    confirmPassword: [required(), matches],
  };
}
