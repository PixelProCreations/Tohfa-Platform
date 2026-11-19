/**
 * The shared farmer field validators (utils/validation). Pure functions plus
 * the hook, rendered with react-test-renderer in plain Node.
 */
import { describe, it, expect } from 'vitest';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import en from '../../../i18n/farmer.en.json';
import ta from '../../../i18n/farmer.ta.json';
import {
  VALIDATION_MESSAGES as M,
  compareDecimal,
  compose,
  date,
  dateNotInFuture,
  dateNotInPast,
  decimal,
  email,
  errorMessage,
  firstInvalidField,
  hasErrors,
  indianMobile,
  initialVisibility,
  integer,
  maxLength,
  minLength,
  name,
  normalizeDecimal,
  pincode,
  positiveAmount,
  required,
  requiredIf,
  toE164IndianMobile,
  toIsoCalendarDate,
  useFieldValidation,
  validateFields,
  visibilityReducer,
  visibleErrors,
  type FieldValidation,
  type FieldRules,
} from '../utils/validation';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const keyOf = (r: ReturnType<ReturnType<typeof required>>) => r?.key ?? null;

describe('i18n catalogue', () => {
  it('has every validation key in both en and ta', () => {
    for (const key of Object.values(M)) {
      expect((en as Record<string, string>)[key], key).toBeTruthy();
      expect((ta as Record<string, string>)[key], key).toBeTruthy();
    }
  });
});

describe('required / length', () => {
  it('required fails on empty and whitespace only', () => {
    expect(keyOf(required()(''))).toBe(M.required);
    expect(keyOf(required()('   \t'))).toBe(M.required);
    expect(required()(' a ')).toBeNull();
  });

  it('length rules trim and let blank pass (optional-aware)', () => {
    expect(minLength(3)('')).toBeNull();
    expect(minLength(3)(' ab ')).toEqual({ key: M.tooShort, params: { min: 3 } });
    expect(minLength(3)('abc')).toBeNull();
    expect(maxLength(3)('  abc  ')).toBeNull();
    expect(maxLength(3)('abcd')).toEqual({ key: M.tooLong, params: { max: 3 } });
  });
});

describe('name', () => {
  it('accepts English and Tamil names with spaces, dots, apostrophes, hyphens', () => {
    for (const v of ['Murugan S', 'R. Selvam', "D'Souza", 'Anne-Marie', 'முருகன் செல்வம்', 'K.']) {
      expect(name()(v), v).toBeNull();
    }
  });

  it('rejects digits, symbols and too-short / too-long values', () => {
    expect(keyOf(name()('Murugan2'))).toBe(M.nameInvalid);
    expect(keyOf(name()('a@b'))).toBe(M.nameInvalid);
    expect(keyOf(name()('-ab'))).toBe(M.nameInvalid);
    expect(keyOf(name()('A'))).toBe(M.tooShort);
    expect(keyOf(name()('a'.repeat(121)))).toBe(M.tooLong);
    expect(name()('a'.repeat(120))).toBeNull();
    expect(name()('')).toBeNull();
  });
});

describe('indianMobile', () => {
  it('accepts 10 digits starting 6-9, with spacing or a +91 / 91 / 0 prefix', () => {
    for (const v of ['9876543210', '6000000000', '98765 43210', '+91 98765-43210', '919876543210', '09876543210']) {
      expect(indianMobile()(v), v).toBeNull();
    }
  });

  it('rejects a first digit 0-5, wrong lengths and letters', () => {
    for (const v of ['5876543210', '1234567890', '987654321', '98765432101', '98765abcde', '+449876543210']) {
      expect(keyOf(indianMobile()(v)), v).toBe(M.mobileInvalid);
    }
    expect(indianMobile()('  ')).toBeNull();
  });

  it('builds the API Mobile (E.164) form', () => {
    expect(toE164IndianMobile('98765 43210')).toBe('+919876543210');
    expect(toE164IndianMobile('+919876543210')).toBe('+919876543210');
    expect(toE164IndianMobile('5876543210')).toBeNull();
  });
});

describe('email / pincode', () => {
  it('email', () => {
    expect(email()('farmer@example.in')).toBeNull();
    expect(email()(' a.b+c@mail.co.in ')).toBeNull();
    for (const v of ['farmer', 'a@b', 'a @b.in', 'a@@b.in', '@b.in', 'a@b.']) {
      expect(keyOf(email()(v)), v).toBe(M.emailInvalid);
    }
    expect(keyOf(email()(`${'a'.repeat(250)}@b.in`))).toBe(M.tooLong);
  });

  it('pincode: 6 digits, never starting with 0', () => {
    expect(pincode()('643001')).toBeNull();
    expect(pincode()('643 001')).toBeNull();
    for (const v of ['043001', '64300', '6430011', '64300a']) expect(keyOf(pincode()(v)), v).toBe(M.pincodeInvalid);
  });
});

describe('integer', () => {
  it('accepts whole numbers within inclusive bounds', () => {
    expect(integer()('42')).toBeNull();
    expect(integer({ min: 1, max: 120 })('120')).toBeNull();
    expect(integer({ min: 1, max: 120 })('1')).toBeNull();
    expect(integer({ min: 1, max: 120 })('121')).toEqual({ key: M.numberTooLarge, params: { max: '120' } });
    expect(integer({ min: 1 })('0')).toEqual({ key: M.numberTooSmall, params: { min: '1' } });
  });

  it('rejects decimals, exponents, signs and separators', () => {
    for (const v of ['1.5', '1e3', '+3', '1,000', 'abc', '0x10']) expect(keyOf(integer()(v)), v).toBe(M.integerInvalid);
    expect(keyOf(integer()('-3'))).toBe(M.negativeNotAllowed);
    expect(integer({ allowNegative: true, min: -5 })('-3')).toBeNull();
    expect(integer()('-0')).toBeNull();
  });

  it('compares huge values exactly (no float overflow)', () => {
    expect(keyOf(integer({ max: '9007199254740993' })('9007199254740994'))).toBe(M.numberTooLarge);
    expect(integer({ max: '9007199254740993' })('9007199254740993')).toBeNull();
  });
});

describe('decimal', () => {
  it('accepts plain decimals and a leading dot, rejects junk', () => {
    expect(decimal()('12')).toBeNull();
    expect(decimal()('12.5')).toBeNull();
    expect(decimal()('.5')).toBeNull();
    for (const v of ['5.', '.', '1e2', '1,5', '1.2.3', 'NaN', 'Infinity', '']) {
      if (v === '') expect(decimal()(v)).toBeNull();
      else expect(keyOf(decimal()(v)), v).toBe(M.decimalInvalid);
    }
  });

  it('enforces maxDecimals and maxIntegerDigits (numeric(10,2))', () => {
    const v = decimal({ maxDecimals: 2, maxIntegerDigits: 8 });
    expect(v('99999999.99')).toBeNull();
    expect(v('12.345')).toEqual({ key: M.tooManyDecimals, params: { max: 2 } });
    expect(v('123456789')).toEqual({ key: M.tooManyDigits, params: { max: 8 } });
    expect(v('00000012.5')).toBeNull();
  });

  it('bounds are exact: 0.1 + 0.2 style edges do not leak', () => {
    const v = decimal({ min: '0.3', max: '10.00' });
    expect(v('0.3')).toBeNull();
    expect(v('0.30')).toBeNull();
    expect(keyOf(v('0.29999999999999999'))).toBe(M.numberTooSmall);
    expect(v('10')).toBeNull();
    expect(keyOf(v('10.0000001'))).toBe(M.numberTooLarge);
  });

  it('negative only when allowed', () => {
    expect(keyOf(decimal()('-1.5'))).toBe(M.negativeNotAllowed);
    expect(decimal({ allowNegative: true })('-1.5')).toBeNull();
  });
});

describe('positiveAmount (Money string)', () => {
  it('accepts positive rupee amounts with up to 2 decimals', () => {
    for (const v of ['1', '0.01', '250.50', '9999999999.99']) expect(positiveAmount()(v), v).toBeNull();
  });

  it('rejects zero, negatives, 3 decimals, too many digits and float junk', () => {
    expect(keyOf(positiveAmount()('0'))).toBe(M.amountNotPositive);
    expect(keyOf(positiveAmount()('0.00'))).toBe(M.amountNotPositive);
    expect(keyOf(positiveAmount()('-5'))).toBe(M.amountInvalid);
    expect(keyOf(positiveAmount()('1e3'))).toBe(M.amountInvalid);
    expect(keyOf(positiveAmount()('Rs 50'))).toBe(M.amountInvalid);
    expect(positiveAmount()('1.005')).toEqual({ key: M.tooManyDecimals, params: { max: 2 } });
    expect(positiveAmount()('12345678901')).toEqual({ key: M.tooManyDigits, params: { max: 10 } });
    expect(keyOf(positiveAmount({ maxIntegerDigits: 8 })('123456789'))).toBe(M.tooManyDigits);
  });

  it('applies caller-supplied (system_config) bounds exactly', () => {
    const cap = positiveAmount({ min: '10.00', max: '10000.00' });
    expect(cap('10000')).toBeNull();
    expect(cap('10000.01')).toEqual({ key: M.amountTooLarge, params: { max: '10000.00' } });
    expect(cap('9.99')).toEqual({ key: M.amountTooSmall, params: { min: '10.00' } });
  });

  it('normalizeDecimal gives the wire string without a float round trip', () => {
    expect(normalizeDecimal(' 0012.50 ')).toBe('12.50');
    expect(normalizeDecimal('.5')).toBe('0.5');
    expect(normalizeDecimal('-0.00')).toBe('0.00');
    expect(normalizeDecimal('9999999999.99')).toBe('9999999999.99');
    expect(normalizeDecimal('abc')).toBeNull();
  });
});

describe('compareDecimal', () => {
  it('orders decimal strings exactly', () => {
    expect(compareDecimal('0.1', '0.10')).toBe(0);
    expect(compareDecimal('-0', '0')).toBe(0);
    expect(compareDecimal('2', '10')).toBe(-1);
    expect(compareDecimal('-2', '-10')).toBe(1);
    expect(compareDecimal('1.05', '1.5')).toBe(-1);
    expect(compareDecimal('123456789012345678.01', '123456789012345678.001')).toBe(1);
    expect(compareDecimal(2.5, '2.50')).toBe(0);
  });

  it('refuses exponent-form numeric bounds instead of comparing wrongly', () => {
    expect(() => compareDecimal('1', 1e21)).toThrow(RangeError);
    expect(() => compareDecimal('1', Number.NaN)).toThrow(RangeError);
  });
});

describe('dates', () => {
  const today = '2026-11-11';

  it('date accepts ISO and DD/MM/YYYY real calendar dates only', () => {
    expect(date()('2028-02-29')).toBeNull();
    expect(date()('29/02/2028')).toBeNull();
    expect(keyOf(date()('2027-02-29'))).toBe(M.dateInvalid);
    expect(keyOf(date()('31/04/2026'))).toBe(M.dateInvalid);
    expect(keyOf(date()('11-11-2026'))).toBe(M.dateInvalid);
    expect(toIsoCalendarDate('05/01/2026')).toBe('2026-01-05');
  });

  it('dateNotInFuture: today passes, tomorrow fails', () => {
    const v = dateNotInFuture({ today });
    expect(v('2026-11-11')).toBeNull();
    expect(v('10/11/2026')).toBeNull();
    expect(keyOf(v('2026-11-12'))).toBe(M.dateInFuture);
    expect(keyOf(v('garbage'))).toBe(M.dateInvalid);
    expect(v('')).toBeNull();
  });

  it('dateNotInPast: today passes, yesterday fails', () => {
    const v = dateNotInPast({ today });
    expect(v('2026-11-11')).toBeNull();
    expect(v('2027-01-01')).toBeNull();
    expect(keyOf(v('2026-11-10'))).toBe(M.dateInPast);
  });

  it('defaults "today" to Asia/Kolkata', () => {
    expect(dateNotInFuture()('2000-01-01')).toBeNull();
    expect(keyOf(dateNotInFuture()('9999-12-31'))).toBe(M.dateInFuture);
  });
});

describe('composition and validateFields', () => {
  type F = 'fullName' | 'mobile' | 'email' | 'price';
  const rules: FieldRules<F> = {
    fullName: [required(), name()],
    mobile: [required(), indianMobile()],
    email: [email()],
    price: requiredIf(true, positiveAmount()),
  };

  it('returns only the first failure per field; blank optional fields pass', () => {
    const errors = validateFields<F>({ fullName: '', mobile: '123', email: '', price: '0' }, rules);
    expect(errors).toEqual({
      fullName: { key: M.required },
      mobile: { key: M.mobileInvalid },
      price: { key: M.amountNotPositive },
    });
    expect(hasErrors(errors)).toBe(true);
    expect(firstInvalidField(errors, ['price', 'mobile', 'fullName'])).toBe('price');
    expect(firstInvalidField(errors)).toBe('fullName');
  });

  it('passes a valid form', () => {
    const errors = validateFields<F>(
      { fullName: 'Murugan', mobile: '9876543210', email: '', price: '120.50' },
      rules,
    );
    expect(errors).toEqual({});
    expect(hasErrors(errors)).toBe(false);
    expect(firstInvalidField(errors)).toBeNull();
  });

  it('compose and requiredIf', () => {
    expect(keyOf(compose(required(), maxLength(2))('abc'))).toBe(M.tooLong);
    expect(requiredIf(false, maxLength(2))).toHaveLength(1);
  });

  it('errorMessage renders with the given translator', () => {
    const tr = (k: string, p?: Record<string, string | number>) => `${k}|${JSON.stringify(p ?? {})}`;
    expect(errorMessage({ key: M.tooLong, params: { max: 5 } }, tr)).toBe(`${M.tooLong}|{"max":5}`);
    expect(errorMessage(undefined, tr)).toBeUndefined();
  });
});

describe('visibility (touched / submit)', () => {
  type F = 'a' | 'b';
  const errors = { a: { key: M.required }, b: { key: M.required } } as const;

  it('hides untouched errors, shows blurred ones, shows all after submit, reset clears', () => {
    let s = initialVisibility<F>();
    expect(visibleErrors<F>(errors, s)).toEqual({});
    s = visibilityReducer(s, { type: 'blur', field: 'a' });
    expect(Object.keys(visibleErrors<F>(errors, s))).toEqual(['a']);
    const same = visibilityReducer(s, { type: 'blur', field: 'a' });
    expect(same).toBe(s);
    s = visibilityReducer(s, { type: 'submit' });
    expect(Object.keys(visibleErrors<F>(errors, s))).toEqual(['a', 'b']);
    s = visibilityReducer(s, { type: 'reset' });
    expect(s).toEqual({ touched: {}, submitted: false });
  });
});

describe('useFieldValidation', () => {
  type F = 'name' | 'mobile';
  const rules: FieldRules<F> = { name: [required(), name()], mobile: [required(), indianMobile()] };
  const order: readonly F[] = ['name', 'mobile'];
  const tr = (k: string) => `T:${k}`;

  function mount(initial: Record<F, string>) {
    let api: FieldValidation<F> | null = null;
    let setValues: (v: Record<F, string>) => void = () => undefined;
    function Probe() {
      const [values, set] = React.useState(initial);
      setValues = set;
      api = useFieldValidation<F>({ values, rules, order }, tr);
      return null;
    }
    act(() => {
      renderer.create(React.createElement(Probe));
    });
    return { get: () => api!, setValues: (v: Record<F, string>) => act(() => setValues(v)) };
  }

  it('shows nothing before blur, the blurred field after blur, everything after submit', () => {
    const h = mount({ name: '', mobile: '12' });
    expect(h.get().errors).toEqual({});
    expect(h.get().isValid).toBe(false);
    expect(h.get().firstInvalid).toBeNull();

    act(() => h.get().onBlur('mobile'));
    expect(h.get().messageFor('mobile')).toBe(`T:${M.mobileInvalid}`);
    expect(h.get().messageFor('name')).toBeUndefined();
    expect(h.get().firstInvalid).toBe('mobile');

    let result: { valid: boolean; firstInvalid: F | null } | null = null;
    act(() => {
      result = h.get().validateAll();
    });
    expect(result).toEqual({ valid: false, firstInvalid: 'name' });
    expect(h.get().submitted).toBe(true);
    expect(h.get().errorFor('name')).toEqual({ key: M.required });
    expect(h.get().firstInvalid).toBe('name');
  });

  it('clears an error as soon as the value is fixed, and reset hides again', () => {
    const h = mount({ name: '', mobile: '' });
    act(() => {
      h.get().validateAll();
    });
    h.setValues({ name: 'Selvam', mobile: '9876543210' });
    expect(h.get().errors).toEqual({});
    expect(h.get().isValid).toBe(true);
    let result: { valid: boolean; firstInvalid: F | null } | null = null;
    act(() => {
      result = h.get().validateAll();
    });
    expect(result).toEqual({ valid: true, firstInvalid: null });

    h.setValues({ name: '', mobile: '' });
    act(() => h.get().reset());
    expect(h.get().errors).toEqual({});
    expect(h.get().submitted).toBe(false);
  });
});
