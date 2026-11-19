/**
 * Validation rules for the Add / Edit Worker form.
 *
 * Limits mirror docs/openapi.yaml `WorkerCreate` / `WorkerUpdate`:
 * name 1..200, bankAccountNo <= 40, ifscCode <= 20, upiId <= 120,
 * payRatePaise > 0. The IFSC and UPI shapes below are the banking formats
 * (IFSC: 4 letters, `0`, 6 alphanumerics; UPI: handle@provider); the OpenAPI
 * schema itself only caps their length, so the tighter shape is a client-side
 * typo guard (spec gap -- the server does not enforce it).
 */
import type { TranslationKey } from '../../../../../../i18n/farmer';
import {
  maxLength,
  name,
  positiveAmount,
  required,
  type FieldRules,
  type Validator,
} from '../../../../utils/validation';

export const WORKER_NAME_MAX_LENGTH = 200;
export const WORKER_ACCOUNT_MAX_LENGTH = 40;
export const WORKER_IFSC_MAX_LENGTH = 20;
export const WORKER_UPI_MAX_LENGTH = 120;
/** TextInput cap for the wage field: Money's 10 integer digits + '.' + 2 decimals. */
export const WORKER_WAGE_MAX_CHARS = 13;

// Keys live in the orchestrator-merged catalogue fragment (scratchpad keys_C.json).
export const WORKER_VALIDATION_MESSAGES = {
  ifscInvalid: 'farmer.validation.ifscInvalid' as TranslationKey,
  upiInvalid: 'farmer.validation.upiInvalid' as TranslationKey,
  accountInvalid: 'farmer.validation.accountNumberInvalid' as TranslationKey,
};

const IFSC = /^[A-Za-z]{4}0[A-Za-z0-9]{6}$/;
const UPI = /^[A-Za-z0-9._-]{2,64}@[A-Za-z][A-Za-z0-9.-]{1,63}$/;
const DIGITS = /^\d+$/;

/** Blank passes; otherwise an IFSC such as SBIN0001234 (case-insensitive, trimmed). */
export function ifscCode(): Validator {
  return (value) => {
    const text = value.trim();
    return text.length === 0 || IFSC.test(text) ? null : { key: WORKER_VALIDATION_MESSAGES.ifscInvalid };
  };
}

/** Blank passes; otherwise a UPI handle such as name@bank. */
export function upiId(): Validator {
  return (value) => {
    const text = value.trim();
    return text.length === 0 || UPI.test(text) ? null : { key: WORKER_VALIDATION_MESSAGES.upiInvalid };
  };
}

/** Blank passes; otherwise digits only (leading zeros are legitimate in an account number). */
export function accountNumber(): Validator {
  return (value) => {
    const text = value.trim();
    return text.length === 0 || DIGITS.test(text) ? null : { key: WORKER_VALIDATION_MESSAGES.accountInvalid };
  };
}

export type WorkerField = 'name' | 'accountNo' | 'ifsc' | 'upiId' | 'wageAmount';

export const WORKER_FIELD_ORDER: readonly WorkerField[] = ['name', 'accountNo', 'ifsc', 'upiId', 'wageAmount'];

export const WORKER_RULES: FieldRules<WorkerField> = {
  name: [required(), name({ min: 1, max: WORKER_NAME_MAX_LENGTH })],
  accountNo: [accountNumber(), maxLength(WORKER_ACCOUNT_MAX_LENGTH)],
  ifsc: [maxLength(WORKER_IFSC_MAX_LENGTH), ifscCode()],
  upiId: [maxLength(WORKER_UPI_MAX_LENGTH), upiId()],
  wageAmount: [required(), positiveAmount()],
};
