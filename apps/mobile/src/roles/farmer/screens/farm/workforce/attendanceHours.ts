/**
 * Validation for the daily-attendance "Hours" field.
 *
 * docs/openapi.yaml `AttendanceUpsertItem.hoursWorked`: number, exclusiveMinimum
 * 0, maximum 24 (BR-41b, also a database CHECK). The field is optional --
 * blank means "no hours recorded" and passes.
 */
import type { TranslationKey } from '../../../../../i18n/farmer';
import {
  compareDecimal,
  decimal,
  errorMessage,
  runRules,
  VALIDATION_MESSAGES,
  type FieldError,
  type Validator,
} from '../../../utils/validation';

export const ATTENDANCE_MAX_HOURS = '24';
/** "24", "23.75" -- two digits, a point and two decimals at most. */
export const ATTENDANCE_HOURS_MAX_CHARS = 5;

/** hoursWorked is exclusive of 0: "0" / "0.0" are rejected even though `decimal({min:0})` allows them. */
export const greaterThanZero: Validator = (value) => {
  const text = value.trim();
  if (text.length === 0 || !/^\d*\.?\d*$/.test(text) || text === '.') return null; // shape errors come from decimal()
  return compareDecimal(text, '0') > 0
    ? null
    : { key: VALIDATION_MESSAGES.numberTooSmall, params: { min: '0.01' } };
};

const HOURS_RULES: readonly Validator[] = [
  decimal({ min: '0', max: ATTENDANCE_MAX_HOURS, maxDecimals: 2 }),
  greaterThanZero,
];

export function hoursError(value: string): FieldError | null {
  return runRules(value, HOURS_RULES);
}

export function hoursErrorMessage(
  value: string,
  translate: (key: TranslationKey, params?: Record<string, string | number>) => string,
): string | undefined {
  return errorMessage(hoursError(value), translate);
}
