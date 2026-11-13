/**
 * Input validation for the auth, registration, payment and listing-quantity fields.
 * Pure rule tests (no renderer). The new i18n keys used by these rules are not in the
 * catalogue until keys_A.json is merged, so only the keys are asserted here.
 */
import { describe, it, expect, vi } from 'vitest';

// locationUtils pulls in the persisted registration-draft store, which touches AsyncStorage.
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: { getItem: async () => null, setItem: async () => undefined, removeItem: async () => undefined },
}));
import { runRules, validateFields } from '../utils/validation';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MISMATCH_KEY,
  forgotRules,
  loginRules,
  resetRules,
} from '../screens/auth/authValidation';
import {
  PAYMENT_MESSAGES,
  accountNumber,
  amountRules,
  amountText,
  bankRules,
  boundFromText,
  ifsc,
  toPlainAmount,
  upiRules,
  upiVpa,
} from '../screens/payment/paymentValidation';
import { sanitizeAcresText } from '../screens/registration/step3Location/locationUtils';
import { collectStep1Errors } from '../screens/registration/step1Personal/validate';
import type { Step1State } from '../screens/registration/step1Personal/formState';

describe('auth rules', () => {
  it('login: mobile is required and must be a real Indian mobile; password only required', () => {
    expect(validateFields({ mobile: '', password: '' }, loginRules)).toEqual({
      mobile: { key: 'farmer.validation.required' },
      password: { key: 'farmer.validation.required' },
    });
    expect(validateFields({ mobile: '12345', password: 'x' }, loginRules).mobile?.key).toBe('farmer.validation.mobileInvalid');
    expect(validateFields({ mobile: '5876543210', password: 'x' }, loginRules).mobile?.key).toBe('farmer.validation.mobileInvalid');
    expect(validateFields({ mobile: '98765 43210', password: 'short' }, loginRules)).toEqual({});
  });

  it('forgot password: same mobile rule', () => {
    expect(validateFields({ mobile: '9876543210' }, forgotRules)).toEqual({});
    expect(validateFields({ mobile: '98765' }, forgotRules).mobile?.key).toBe('farmer.validation.mobileInvalid');
  });

  it('reset: 10..128 characters and the two passwords must match', () => {
    const pw = 'a'.repeat(PASSWORD_MIN_LENGTH);
    expect(validateFields({ password: pw, confirmPassword: pw }, resetRules(pw))).toEqual({});
    const short = validateFields({ password: 'a'.repeat(9), confirmPassword: 'a'.repeat(9) }, resetRules('a'.repeat(9)));
    expect(short.password).toEqual({ key: 'farmer.validation.tooShort', params: { min: 10 } });
    const long = 'a'.repeat(PASSWORD_MAX_LENGTH + 1);
    expect(validateFields({ password: long, confirmPassword: long }, resetRules(long)).password?.key).toBe('farmer.validation.tooLong');
    expect(validateFields({ password: pw, confirmPassword: pw + 'b' }, resetRules(pw)).confirmPassword?.key).toBe(PASSWORD_MISMATCH_KEY);
    expect(validateFields({ password: pw, confirmPassword: '' }, resetRules(pw)).confirmPassword?.key).toBe('farmer.validation.required');
  });
});

describe('payment rules', () => {
  it('toPlainAmount strips grouping and the currency sign only', () => {
    expect(toPlainAmount('2,000')).toBe('2000');
    expect(toPlainAmount('₹4,250.50')).toBe('4250.50');
    expect(toPlainAmount('Rs 4,250')).toBe('4250');
    expect(toPlainAmount('-5')).toBe('-5');
  });

  it('amount: positive Money shape, with caller-supplied bounds (money stays a string)', () => {
    const rules = amountRules({ min: '100', max: '10000' });
    expect(validateFields({ amount: '2,000' }, rules)).toEqual({});
    expect(validateFields({ amount: '' }, rules).amount?.key).toBe('farmer.validation.required');
    expect(validateFields({ amount: '0' }, rules).amount?.key).toBe('farmer.validation.amountNotPositive');
    expect(validateFields({ amount: '-5' }, rules).amount?.key).toBe('farmer.validation.amountInvalid');
    expect(validateFields({ amount: '12ab' }, rules).amount?.key).toBe('farmer.validation.amountInvalid');
    expect(validateFields({ amount: '1.234' }, rules).amount?.key).toBe('farmer.validation.tooManyDecimals');
    expect(validateFields({ amount: '99' }, rules).amount?.key).toBe('farmer.validation.amountTooSmall');
    expect(validateFields({ amount: '10,000.01' }, rules).amount?.key).toBe('farmer.validation.amountTooLarge');
    expect(validateFields({ amount: '10,000' }, rules)).toEqual({});
    expect(validateFields({ amount: '12345678901' }, amountRules({})).amount?.key).toBe('farmer.validation.tooManyDigits');
    expect(runRules('1', [amountText()])).toBeNull();
  });

  it('boundFromText parses a formatted balance and drops a non-decimal bound', () => {
    expect(boundFromText('₹4,250')).toBe('4250');
    expect(boundFromText('n/a')).toBeUndefined();
    expect(boundFromText(undefined)).toBeUndefined();
  });

  it('account number: 9-18 digits', () => {
    const v = accountNumber();
    expect(v('123456789')).toBeNull();
    expect(v('12345678')).toEqual({ key: PAYMENT_MESSAGES.accountNumberInvalid });
    expect(v('1'.repeat(19))).not.toBeNull();
    expect(v('12345678a')).not.toBeNull();
  });

  it('IFSC: 4 letters, a zero, 6 alphanumerics (case-insensitive)', () => {
    const v = ifsc();
    expect(v('HDFC0001234')).toBeNull();
    expect(v('hdfc0001234')).toBeNull();
    expect(v('HDFC1001234')).toEqual({ key: PAYMENT_MESSAGES.ifscInvalid });
    expect(v('HDFC000123')).not.toBeNull();
  });

  it('UPI VPA format', () => {
    const v = upiVpa();
    expect(v('murugan.r@okhdfcbank')).toBeNull();
    expect(v('murugan')).toEqual({ key: PAYMENT_MESSAGES.upiInvalid });
    expect(v('a@b')).not.toBeNull();
    expect(validateFields({ upi: '' }, upiRules).upi?.key).toBe('farmer.validation.required');
  });

  it('bank form: required fields, and an unchanged masked account number is not re-validated', () => {
    const base = { holder: 'Murugan R', bank: 'HDFC Bank', account: '123456789', ifsc: 'HDFC0001234', branch: '' };
    expect(validateFields(base, bankRules(false))).toEqual({});
    expect(validateFields({ ...base, account: '4821' }, bankRules(true))).toEqual({});
    expect(validateFields({ ...base, account: '4821' }, bankRules(false)).account).toBeDefined();
    const errs = validateFields({ holder: '', bank: '', account: '', ifsc: '', branch: 'x'.repeat(121) }, bankRules(false));
    expect(Object.keys(errs).sort()).toEqual(['account', 'bank', 'branch', 'holder', 'ifsc']);
    expect(validateFields({ ...base, holder: 'R2D2' }, bankRules(false)).holder?.key).toBe('farmer.validation.nameInvalid');
  });
});

describe('registration step 1 / step 3 helpers', () => {
  const valid = {
    fullName: 'Senthil Kumar',
    dob: '01 / 02 / 1980',
    gender: 'Male',
    mobileNumber: '9876543210',
    aadhaarNumber: '123456789012',
    addressLine1: '12 Main Road',
    village: 'Ithalar',
    taluk: 'Ooty',
    district: 'The Nilgiris',
    pincode: '643001',
    otp: '123456',
    showDatePicker: false,
    showGenderMenu: false,
    showDistrictMenu: false,
    challengeId: null,
    fieldErrors: {},
  } as unknown as Step1State;

  it('accepts a fully valid form (mobile already verified)', () => {
    expect(collectStep1Errors(valid, true).errors).toEqual({});
  });

  it('rejects a mobile that does not start with 6-9', () => {
    expect(collectStep1Errors({ ...valid, mobileNumber: '5876543210' }, true).errors.mobile).toBeDefined();
  });

  it('rejects over-long / non-letter names, address, village and taluk', () => {
    expect(collectStep1Errors({ ...valid, fullName: 'R2 D2' }, true).errors.fullName).toBeDefined();
    expect(collectStep1Errors({ ...valid, fullName: 'a'.repeat(121) }, true).errors.fullName).toBeDefined();
    expect(collectStep1Errors({ ...valid, addressLine1: 'a'.repeat(301) }, true).errors.addressLine1).toBeDefined();
    expect(collectStep1Errors({ ...valid, village: 'a'.repeat(101) }, true).errors.village).toBeDefined();
    expect(collectStep1Errors({ ...valid, taluk: 'a'.repeat(101) }, true).errors.taluk).toBeDefined();
  });

  it('rejects an impossible or future date of birth', () => {
    expect(collectStep1Errors({ ...valid, dob: '31 / 02 / 1980' }, true).errors.dob).toBeDefined();
    expect(collectStep1Errors({ ...valid, dob: '01 / 01 / 2999' }, true).errors.dob).toBeDefined();
  });

  it('sanitizeAcresText keeps digits and one decimal point', () => {
    expect(sanitizeAcresText('1.2.3')).toBe('1.23');
    expect(sanitizeAcresText('a1b,2')).toBe('12');
    expect(sanitizeAcresText('2.5')).toBe('2.5');
    expect(sanitizeAcresText('')).toBe('');
  });
});
