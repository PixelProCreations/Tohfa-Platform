/**
 * Field rules for the payment screens (add money, withdraw, bank account, UPI).
 * Pure so the screens and tests share one definition. Limits are the ones in
 * docs/openapi.yaml: CreateFarmerBankAccountRequest, UpdateFarmerUpiRequest, Money.
 */
import type { TranslationKey } from '../../../../i18n/farmer';
import {
  maxLength,
  minLength,
  name,
  positiveAmount,
  required,
  type DecimalBound,
  type FieldRules,
  type Validator,
} from '../../utils/validation';

/** Not yet in farmer.*.json -- see the keys file handed to the orchestrator. */
export const PAYMENT_MESSAGES = {
  accountNumberInvalid: 'farmer.validation.accountNumberInvalid' as TranslationKey,
  ifscInvalid: 'farmer.validation.ifscInvalid' as TranslationKey,
  upiInvalid: 'farmer.validation.upiInvalid' as TranslationKey,
};

export const ACCOUNT_HOLDER_MAX = 120;
export const BANK_NAME_MAX = 120;
export const BRANCH_NAME_MAX = 120;
export const ACCOUNT_NUMBER_MIN = 9;
export const ACCOUNT_NUMBER_MAX = 18;
export const IFSC_LENGTH = 11;
export const UPI_MAX = 256 + 1 + 64;

const ACCOUNT_NUMBER = /^[0-9]{9,18}$/;
const IFSC = /^[A-Za-z]{4}0[A-Za-z0-9]{6}$/;
const UPI_VPA = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

export function accountNumber(): Validator {
  return (value) => {
    const text = value.trim();
    if (text.length === 0) return null;
    return ACCOUNT_NUMBER.test(text) ? null : { key: PAYMENT_MESSAGES.accountNumberInvalid };
  };
}

export function ifsc(): Validator {
  return (value) => {
    const text = value.trim();
    if (text.length === 0) return null;
    return IFSC.test(text) ? null : { key: PAYMENT_MESSAGES.ifscInvalid };
  };
}

export function upiVpa(): Validator {
  return (value) => {
    const text = value.trim();
    if (text.length === 0) return null;
    return UPI_VPA.test(text) ? null : { key: PAYMENT_MESSAGES.upiInvalid };
  };
}

/**
 * "2,000" / "Rs 4,250.50" / "₹4,250" as the plain decimal "2000" / "4250.50" the validators
 * and the API expect: only the grouping commas, spaces and the currency sign are removed, so
 * anything else a farmer typed ("-5", "12ab") still fails validation. Strings only -- never a float.
 */
export function toPlainAmount(text: string): string {
  return text.replace(/^\s*rs\.?/i, '').replace(/[,\s₹]/g, '');
}

/** A rupee amount typed with thousands separators and/or a currency sign: required, > 0, Money shape, optional bounds. */
export function amountText(bounds: { min?: DecimalBound; max?: DecimalBound } = {}): Validator {
  const rule = positiveAmount(bounds);
  return (value) => {
    const plain = toPlainAmount(value);
    return rule(plain);
  };
}

/**
 * Bounds for a rupee amount, from whatever the caller supplied as text ("₹4,250"); a bound
 * that is not a decimal is dropped (no bound) rather than guessed at.
 */
export function boundFromText(text: string | undefined): string | undefined {
  if (text === undefined) return undefined;
  const plain = toPlainAmount(text);
  return /^\d+(\.\d+)?$/.test(plain) ? plain : undefined;
}

export type AmountField = 'amount';

export function amountRules(bounds: { min?: string | undefined; max?: string | undefined }): FieldRules<AmountField> {
  const b: { min?: DecimalBound; max?: DecimalBound } = {};
  if (bounds.min !== undefined) b.min = bounds.min;
  if (bounds.max !== undefined) b.max = bounds.max;
  return { amount: [required(), amountText(b)] };
}

export type BankField = 'holder' | 'bank' | 'account' | 'ifsc' | 'branch';
export const BANK_FIELD_ORDER: readonly BankField[] = ['holder', 'bank', 'account', 'ifsc', 'branch'];

/**
 * `accountUnchanged`: the account number field still holds the masked value shown from the
 * server (only the last 4 digits are ever returned, BR-53a), so it is not re-validated.
 */
export function bankRules(accountUnchanged: boolean): FieldRules<BankField> {
  return {
    holder: [required(), name({ max: ACCOUNT_HOLDER_MAX })],
    bank: [required(), minLength(2), maxLength(BANK_NAME_MAX)],
    account: accountUnchanged ? [required()] : [required(), accountNumber()],
    ifsc: [required(), ifsc()],
    branch: [maxLength(BRANCH_NAME_MAX)],
  };
}

export type UpiField = 'upi';
export const upiRules: FieldRules<UpiField> = { upi: [required(), upiVpa()] };
