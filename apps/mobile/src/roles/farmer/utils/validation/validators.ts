/**
 * Shared field validators for the farmer app's plain TextInput forms.
 *
 * Every validator works on the string the farmer typed and returns either
 * `null` (valid) or a `FieldError` -- an i18n KEY plus optional `{{param}}`
 * values -- never a rendered string. That keeps this module free of `t()` and of
 * React, so it runs in this app's plain-Node vitest, and lets a screen render
 * the message in the farmer's current locale at display time.
 *
 * Optional-aware by construction: every validator except `required()` treats a
 * blank (whitespace-only) value as VALID. A field is mandatory only when its
 * rule list includes `required()`; the rest of its rules then describe what a
 * non-blank value must look like.
 *
 * Numbers are validated on the STRING, never via parseFloat. Amounts and
 * decimal quantities travel to the API as decimal strings (docs/openapi.yaml
 * `Money`, `Quantity`, `CropInputCost`); comparing bounds here is exact decimal
 * string arithmetic (`compareDecimal`), so no IEEE-754 rounding can ever make a
 * value pass or fail by a paisa.
 *
 * The limits below that ARE baked in are API request-shape limits copied from
 * docs/openapi.yaml (pattern / maxLength), not business thresholds. Business
 * thresholds (a max listing price, a withdrawal cap) must be passed in as
 * `min` / `max` from system_config (GET /config/farmer) -- root CLAUDE.md §2.7.
 */
import type { TranslationKey } from '../../../../i18n/farmer';
import { displayDateToIso, isCalendarDate, todayInKolkata } from '../../screens/certifications/certificationForm';

export { isCalendarDate, todayInKolkata };

/** A validation failure: the i18n key to render, and the values for its `{{placeholders}}`. */
export interface FieldError {
  key: TranslationKey;
  params?: Record<string, string | number>;
}

/** One rule: `null` when the value passes. */
export type Validator = (value: string) => FieldError | null;

/** A bound for a numeric rule: a decimal string (preferred, exact) or a finite number. */
export type DecimalBound = string | number;

export const VALIDATION_MESSAGES = {
  required: 'farmer.validation.required',
  tooShort: 'farmer.validation.tooShort',
  tooLong: 'farmer.validation.tooLong',
  nameInvalid: 'farmer.validation.nameInvalid',
  mobileInvalid: 'farmer.validation.mobileInvalid',
  emailInvalid: 'farmer.validation.emailInvalid',
  pincodeInvalid: 'farmer.validation.pincodeInvalid',
  integerInvalid: 'farmer.validation.integerInvalid',
  decimalInvalid: 'farmer.validation.decimalInvalid',
  negativeNotAllowed: 'farmer.validation.negativeNotAllowed',
  tooManyDecimals: 'farmer.validation.tooManyDecimals',
  tooManyDigits: 'farmer.validation.tooManyDigits',
  numberTooSmall: 'farmer.validation.numberTooSmall',
  numberTooLarge: 'farmer.validation.numberTooLarge',
  amountInvalid: 'farmer.validation.amountInvalid',
  amountNotPositive: 'farmer.validation.amountNotPositive',
  amountTooSmall: 'farmer.validation.amountTooSmall',
  amountTooLarge: 'farmer.validation.amountTooLarge',
  dateInvalid: 'farmer.validation.dateInvalid',
  dateInFuture: 'farmer.validation.dateInFuture',
  dateInPast: 'farmer.validation.dateInPast',
} as const satisfies Record<string, TranslationKey>;

const M = VALIDATION_MESSAGES;

// ── Limits copied from docs/openapi.yaml ────────────────────────────────────

/** `fullName` (farmer registration / profile): minLength 2, maxLength 120. */
export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 120;
/** `email`: format email, maxLength 254. */
export const EMAIL_MAX_LENGTH = 254;
/** `Money`: `^-?[0-9]{1,10}(\.[0-9]{1,2})?$`. */
export const MONEY_MAX_INTEGER_DIGITS = 10;
export const MONEY_MAX_DECIMALS = 2;

/** `Mobile`: `^\+91[6-9][0-9]{9}$` -- the local part is 10 digits starting 6-9. */
const LOCAL_MOBILE = /^[6-9]\d{9}$/;
/** Real Indian PIN codes never start with 0 (farmers.pincode CHECK; registration/validation.ts). */
const PINCODE = /^[1-9]\d{5}$/;
/**
 * Pragmatic email shape: one `@`, no spaces, a dot in the domain. The server's
 * `format: email` is the authority; this only catches typos before a round trip.
 */
const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
/**
 * A person / place name in any script: letters with their combining marks
 * (Tamil vowel signs are \p{M}), separated by single spaces, `.`, `'` or `-`.
 */
const NAME = /^[\p{L}\p{M}]+(?:[ .'-]+[\p{L}\p{M}]+)*\.?$/u;
const INTEGER = /^(-)?(\d+)$/;
/** Digits with an optional fraction; a bare leading dot (".5") is accepted, a trailing one ("5.") is not. */
const DECIMAL = /^(-)?(\d*)(?:\.(\d+))?$/;

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

/** Spaces and hyphens a farmer may type inside a number ("98765 43210"). */
function stripSeparators(value: string): string {
  return value.replace(/[\s-]/g, '');
}

// ── Exact decimal-string arithmetic (no floats) ─────────────────────────────

interface ParsedDecimal {
  negative: boolean;
  whole: string;
  frac: string;
}

function parseDecimal(value: string): ParsedDecimal | null {
  const match = DECIMAL.exec(value);
  if (match === null) return null;
  const whole = match[2] ?? '';
  const frac = match[3] ?? '';
  if (whole === '' && frac === '') return null;
  return { negative: match[1] === '-', whole, frac };
}

function boundToString(bound: DecimalBound): string {
  if (typeof bound === 'string') return bound.trim();
  if (!Number.isFinite(bound)) throw new RangeError(`validation bound must be finite, got ${bound}`);
  const text = String(bound);
  if (/e/i.test(text)) throw new RangeError(`validation bound ${bound} needs a decimal string`);
  return text;
}

function isZeroDigits(digits: string): boolean {
  return /^0*$/.test(digits);
}

/**
 * Compares two decimal strings exactly: -1 when a < b, 0 when equal, 1 when a > b.
 * Leading zeros, trailing fractional zeros and "-0" are normalised away.
 * Throws on a non-decimal input -- callers validate first.
 */
export function compareDecimal(a: DecimalBound, b: DecimalBound): -1 | 0 | 1 {
  const pa = parseDecimal(boundToString(a));
  const pb = parseDecimal(boundToString(b));
  if (pa === null || pb === null) throw new RangeError('compareDecimal expects decimal strings');
  const norm = (p: ParsedDecimal) => {
    const whole = p.whole.replace(/^0+/, '');
    const frac = p.frac.replace(/0+$/, '');
    const zero = whole === '' && frac === '';
    return { negative: p.negative && !zero, whole, frac };
  };
  const x = norm(pa);
  const y = norm(pb);
  if (x.negative !== y.negative) return x.negative ? -1 : 1;
  const sign = x.negative ? -1 : 1;
  let magnitude: -1 | 0 | 1 = 0;
  if (x.whole.length !== y.whole.length) {
    magnitude = x.whole.length < y.whole.length ? -1 : 1;
  } else {
    const width = Math.max(x.frac.length, y.frac.length);
    const ax = x.whole + x.frac.padEnd(width, '0');
    const ay = y.whole + y.frac.padEnd(width, '0');
    magnitude = ax === ay ? 0 : ax < ay ? -1 : 1;
  }
  return (magnitude * sign) as -1 | 0 | 1;
}

/**
 * The canonical decimal string for the API: trimmed, leading zeros dropped,
 * ".5" -> "0.5". Fractional digits are kept as typed ("12.50" stays "12.50").
 * Null when the value is not a decimal. Never goes through a float.
 */
export function normalizeDecimal(value: string): string | null {
  const parsed = parseDecimal(value.trim());
  if (parsed === null) return null;
  const whole = parsed.whole.replace(/^0+(?=\d)/, '') || '0';
  const zero = isZeroDigits(whole) && isZeroDigits(parsed.frac);
  const sign = parsed.negative && !zero ? '-' : '';
  return parsed.frac === '' ? `${sign}${whole}` : `${sign}${whole}.${parsed.frac}`;
}

// ── Text ────────────────────────────────────────────────────────────────────

/** Fails on an empty or whitespace-only value. The only validator that does. */
export function required(): Validator {
  return (value) => (isBlank(value) ? { key: M.required } : null);
}

/** Trimmed length at least `min` (blank passes; pair with `required()`). */
export function minLength(min: number): Validator {
  return (value) => {
    const text = value.trim();
    return text.length > 0 && text.length < min ? { key: M.tooShort, params: { min } } : null;
  };
}

/** Trimmed length at most `max`. */
export function maxLength(max: number): Validator {
  return (value) => (value.trim().length > max ? { key: M.tooLong, params: { max } } : null);
}

/**
 * A person's or place's name in any script (English, Tamil, ...): letters only,
 * words separated by spaces, `.`, `'` or `-`; length bounds default to
 * `fullName`'s 2..120.
 */
export function name(options: { min?: number; max?: number } = {}): Validator {
  const min = options.min ?? NAME_MIN_LENGTH;
  const max = options.max ?? NAME_MAX_LENGTH;
  return (value) => {
    const text = value.trim();
    if (text.length === 0) return null;
    if (text.length < min) return { key: M.tooShort, params: { min } };
    if (text.length > max) return { key: M.tooLong, params: { max } };
    return NAME.test(text) ? null : { key: M.nameInvalid };
  };
}

// ── Identity / contact ──────────────────────────────────────────────────────

/**
 * The 10-digit local part of an Indian mobile (first digit 6-9) from what the
 * farmer typed: spaces / hyphens ignored, an optional `+91` / `91` / `0` prefix
 * accepted. Null when it is not an Indian mobile.
 */
export function localIndianMobile(value: string): string | null {
  const digits = stripSeparators(value.trim());
  const local = /^(?:\+91|91|0)?(\d{10})$/.exec(digits)?.[1];
  return local !== undefined && LOCAL_MOBILE.test(local) ? local : null;
}

/** The API's `Mobile` (E.164, `+91XXXXXXXXXX`), or null when the input is not an Indian mobile. */
export function toE164IndianMobile(value: string): string | null {
  const local = localIndianMobile(value);
  return local === null ? null : `+91${local}`;
}

/** docs/openapi.yaml `Mobile`: 10 digits starting 6-9 (an optional +91 prefix is fine). */
export function indianMobile(): Validator {
  return (value) => (isBlank(value) || localIndianMobile(value) !== null ? null : { key: M.mobileInvalid });
}

export function email(): Validator {
  return (value) => {
    const text = value.trim();
    if (text.length === 0) return null;
    if (text.length > EMAIL_MAX_LENGTH) return { key: M.tooLong, params: { max: EMAIL_MAX_LENGTH } };
    return EMAIL.test(text) ? null : { key: M.emailInvalid };
  };
}

/** A 6-digit Indian PIN code, not starting with 0 (spaces ignored, as registration does). */
export function pincode(): Validator {
  return (value) => {
    if (isBlank(value)) return null;
    return PINCODE.test(value.replace(/\s+/g, '')) ? null : { key: M.pincodeInvalid };
  };
}

// ── Numbers (string-exact) ──────────────────────────────────────────────────

export interface IntegerOptions {
  min?: DecimalBound;
  max?: DecimalBound;
  allowNegative?: boolean;
}

/** Whole number, digits only (no sign unless `allowNegative`), within optional inclusive bounds. */
export function integer(options: IntegerOptions = {}): Validator {
  return (value) => {
    const text = value.trim();
    if (text.length === 0) return null;
    const match = INTEGER.exec(text);
    if (match === null) return { key: M.integerInvalid };
    if (match[1] === '-' && !options.allowNegative && !isZeroDigits(match[2] ?? '')) {
      return { key: M.negativeNotAllowed };
    }
    return boundsError(text, options.min, options.max, M.numberTooSmall, M.numberTooLarge);
  };
}

export interface DecimalOptions {
  /** Inclusive lower bound. */
  min?: DecimalBound;
  /** Inclusive upper bound. */
  max?: DecimalBound;
  /** Maximum digits after the point (e.g. 2 for numeric(10,2)). Unlimited when omitted. */
  maxDecimals?: number;
  /** Maximum digits before the point (e.g. 8 for numeric(10,2)). Unlimited when omitted. */
  maxIntegerDigits?: number;
  allowNegative?: boolean;
}

/** A decimal number typed as `123`, `123.45` or `.5`; no exponent, no thousands separator. */
export function decimal(options: DecimalOptions = {}): Validator {
  return (value) => {
    const text = value.trim();
    if (text.length === 0) return null;
    const parsed = parseDecimal(text);
    if (parsed === null) return { key: M.decimalInvalid };
    const zero = isZeroDigits(parsed.whole) && isZeroDigits(parsed.frac);
    if (parsed.negative && !options.allowNegative && !zero) return { key: M.negativeNotAllowed };
    const shapeError = digitLimitsError(parsed, options.maxIntegerDigits, options.maxDecimals);
    if (shapeError !== null) return shapeError;
    return boundsError(text, options.min, options.max, M.numberTooSmall, M.numberTooLarge);
  };
}

export interface AmountOptions {
  /** Inclusive lower bound in rupees, e.g. a system_config minimum. Default: any amount above 0. */
  min?: DecimalBound;
  /** Inclusive upper bound in rupees, e.g. a system_config cap. */
  max?: DecimalBound;
  /** Defaults to Money's 10; CropInputCost uses 8. */
  maxIntegerDigits?: number;
}

/**
 * A rupee amount strictly greater than 0, at most 2 decimals (`Money` /
 * `CropInputCost`). Validates the string only -- send `normalizeDecimal(value)`
 * to the API, never `Number(value)`.
 */
export function positiveAmount(options: AmountOptions = {}): Validator {
  const maxIntegerDigits = options.maxIntegerDigits ?? MONEY_MAX_INTEGER_DIGITS;
  return (value) => {
    const text = value.trim();
    if (text.length === 0) return null;
    const parsed = parseDecimal(text);
    if (parsed === null || parsed.negative) return { key: M.amountInvalid };
    const shapeError = digitLimitsError(parsed, maxIntegerDigits, MONEY_MAX_DECIMALS);
    if (shapeError !== null) return shapeError;
    if (isZeroDigits(parsed.whole) && isZeroDigits(parsed.frac)) return { key: M.amountNotPositive };
    return boundsError(text, options.min, options.max, M.amountTooSmall, M.amountTooLarge);
  };
}

function digitLimitsError(parsed: ParsedDecimal, maxIntegerDigits?: number, maxDecimals?: number): FieldError | null {
  const wholeDigits = parsed.whole.replace(/^0+(?=\d)/, '').length;
  if (maxIntegerDigits !== undefined && wholeDigits > maxIntegerDigits) {
    return { key: M.tooManyDigits, params: { max: maxIntegerDigits } };
  }
  if (maxDecimals !== undefined && parsed.frac.length > maxDecimals) {
    return { key: M.tooManyDecimals, params: { max: maxDecimals } };
  }
  return null;
}

function boundsError(
  text: string,
  min: DecimalBound | undefined,
  max: DecimalBound | undefined,
  tooSmall: TranslationKey,
  tooLarge: TranslationKey,
): FieldError | null {
  if (min !== undefined && compareDecimal(text, min) < 0) return { key: tooSmall, params: { min: boundToString(min) } };
  if (max !== undefined && compareDecimal(text, max) > 0) return { key: tooLarge, params: { max: boundToString(max) } };
  return null;
}

// ── Dates ───────────────────────────────────────────────────────────────────

export interface DateOptions {
  /** Today's calendar date, YYYY-MM-DD. Defaults to Asia/Kolkata today (`todayInKolkata`), as the server uses. */
  today?: string;
}

/**
 * A typed or picked date as the API's YYYY-MM-DD: accepts YYYY-MM-DD or the
 * screens' DD/MM/YYYY. Null when it is not a real calendar date.
 */
export function toIsoCalendarDate(value: string): string | null {
  const text = value.trim();
  const iso = isCalendarDate(text) ? text : displayDateToIso(text);
  return iso !== null && isCalendarDate(iso) ? iso : null;
}

/** A real calendar date (YYYY-MM-DD or DD/MM/YYYY). */
export function date(): Validator {
  return (value) => (isBlank(value) || toIsoCalendarDate(value) !== null ? null : { key: M.dateInvalid });
}

/** A real date that is today or earlier (purchase dates, harvest dates, issued-on). */
export function dateNotInFuture(options: DateOptions = {}): Validator {
  return (value) => {
    if (isBlank(value)) return null;
    const iso = toIsoCalendarDate(value);
    if (iso === null) return { key: M.dateInvalid };
    return iso > (options.today ?? todayInKolkata()) ? { key: M.dateInFuture } : null;
  };
}

/** A real date that is today or later (due dates, reminders, expiry). */
export function dateNotInPast(options: DateOptions = {}): Validator {
  return (value) => {
    if (isBlank(value)) return null;
    const iso = toIsoCalendarDate(value);
    if (iso === null) return { key: M.dateInvalid };
    return iso < (options.today ?? todayInKolkata()) ? { key: M.dateInPast } : null;
  };
}

// ── Composition ─────────────────────────────────────────────────────────────

/** Runs `rules` in order and returns the first failure, or null. */
export function runRules(value: string, rules: readonly Validator[]): FieldError | null {
  for (const rule of rules) {
    const error = rule(value);
    if (error !== null) return error;
  }
  return null;
}

/** Several rules as one validator (first failure wins). */
export function compose(...rules: Validator[]): Validator {
  return (value) => runRules(value, rules);
}

/** `rules` prefixed with `required()` when `isRequired` -- for fields whose mandatoriness depends on another field. */
export function requiredIf(isRequired: boolean, ...rules: Validator[]): Validator[] {
  return isRequired ? [required(), ...rules] : rules;
}
