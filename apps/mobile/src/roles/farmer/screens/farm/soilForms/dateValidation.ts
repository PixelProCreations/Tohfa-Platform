/**
 * Validators for the soil forms' free-typed DD/MM/YY(YY) dates. The shared `date()`
 * validator only knows DD/MM/YYYY, while these screens accept two-digit years and
 * single-digit day/month, so this wraps the forms' own `toIsoDate` and then checks
 * the result is a real calendar date (toIsoDate alone accepts 31/02/26).
 */
import type { TranslationKey } from '../../../../../i18n/farmer';
import { isCalendarDate, todayInKolkata, VALIDATION_MESSAGES, type Validator } from '../../../utils/validation';
import { toIsoDate } from './dateUtils';

/** The API's YYYY-MM-DD for a typed soil date, or null when it is not a real calendar date. */
export function soilIsoDate(value: string): string | null {
  const iso = toIsoDate(value);
  return iso !== null && isCalendarDate(iso) ? iso : null;
}

/** A real calendar date; blank passes (pair with required()). */
export function soilDate(): Validator {
  return (value) =>
    value.trim().length === 0 || soilIsoDate(value) !== null ? null : { key: VALIDATION_MESSAGES.dateInvalid };
}

/** A real date that is not after `today` (defaults to Asia/Kolkata today). */
export function soilDateNotInFuture(today?: string): Validator {
  return (value) => {
    if (value.trim().length === 0) return null;
    const iso = soilIsoDate(value);
    if (iso === null) return { key: VALIDATION_MESSAGES.dateInvalid };
    return iso > (today ?? todayInKolkata()) ? { key: VALIDATION_MESSAGES.dateInFuture } : null;
  };
}

/**
 * A real date that is not before the date typed in `earlier` (nothing to compare
 * while `earlier` is blank/invalid). `tooEarlyKey` is the message to show, since
 * "cannot be in the past" would be wrong for a next-due date set before a test date.
 */
export function soilDateNotBefore(earlier: string, tooEarlyKey: TranslationKey): Validator {
  return (value) => {
    if (value.trim().length === 0) return null;
    const iso = soilIsoDate(value);
    if (iso === null) return { key: VALIDATION_MESSAGES.dateInvalid };
    const floor = soilIsoDate(earlier);
    return floor !== null && iso < floor ? { key: tooEarlyKey } : null;
  };
}
