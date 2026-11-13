/**
 * Pure validation rules for the Profile screens' text inputs (personal details, the profile edit
 * modals, change password, FMB edit-farm area). Built on the shared validators in
 * utils/validation so a screen's submit check and its unit test run the same code.
 *
 * Limits are the API contract's field limits (docs/openapi.yaml `FarmerProfileUpdate`,
 * `FarmUpdate`, change-password body) mirrored only so the farmer sees the problem before a
 * round-trip 400 -- they are not business thresholds.
 */
import type { TranslationKey } from '../../../../i18n/farmer';
import {
  compareDecimal,
  decimal,
  integer,
  maxLength,
  name,
  required,
  todayInKolkata,
  type FieldRules,
  type FieldError,
  type Validator,
} from '../../utils/validation';

/** `FarmerProfileUpdate.farmingExperienceYears`: integer 0..90. */
export const FARMING_EXPERIENCE_MIN_YEARS = 0;
export const FARMING_EXPERIENCE_MAX_YEARS = 90;
/** `FarmerProfileUpdate.address` maxLength. */
export const ADDRESS_MAX_LENGTH = 300;
/** `FarmUpdate.name` / `village` / `taluk` / `district` maxLength. */
export const FARM_NAME_MAX_LENGTH = 120;
/** `FarmUpdate.waterSources[]` item maxLength. */
export const WATER_SOURCE_MAX_LENGTH = 60;
/** change-password `newPassword`: minLength 10, maxLength 128. */
export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;
/**
 * Generic upper bounds for fields the spec does not bound (SPEC GAP): acreage and the number of
 * zones a profile edit may state. Deliberately loose -- they only stop an obviously mistyped value.
 */
export const ACRES_MAX = '100000';
export const ZONES_MAX = '1000';

// Keys that are not in the farmer catalogue yet (added by the orchestrator from keys_B.json).
const KEY_MUST_BE_POSITIVE = 'farmer.validation.mustBePositive' as TranslationKey;
const KEY_PASSWORD_MISMATCH = 'farmer.validation.passwordMismatch' as TranslationKey;
const KEY_INVALID_FORMAT = 'farmer.profile.personal.invalidFormat' as TranslationKey;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function monthLabel(monthIdx: number): string | undefined {
  return MONTHS[monthIdx];
}

/**
 * "D Mon YYYY" (the profile's display format) to YYYY-MM-DD, or null when it does not round-trip
 * to a real calendar date. Stricter than a bare day <= 31 check: "31 Feb 1980" is rejected.
 */
export function parseDobInput(text: string): string | null {
  const m = /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/.exec(text.trim());
  if (!m) return null;
  const [, dStr, moStr, yStr] = m;
  if (!dStr || !moStr || !yStr) return null;
  const monthIdx = MONTHS.findIndex((mo) => mo.toLowerCase() === moStr.toLowerCase());
  if (monthIdx < 0) return null;
  const day = Number(dStr);
  const year = Number(yStr);
  const daysInMonth = new Date(Date.UTC(year, monthIdx + 1, 0)).getUTCDate();
  if (day < 1 || day > daysInMonth) return null;
  return `${yStr}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Optional "D Mon YYYY" date of birth that is a real date and not in the future. */
export function displayDob(today?: string): Validator {
  return (value) => {
    if (value.trim().length === 0) return null;
    const iso = parseDobInput(value);
    if (iso === null) return { key: KEY_INVALID_FORMAT };
    const limit = today ?? todayInKolkata();
    return iso > limit ? { key: 'farmer.validation.dateInFuture' as TranslationKey } : null;
  };
}

/** Optional gender text: MALE / FEMALE / OTHER or M / F / O (case-insensitive) -- the API enum. */
export function genderText(): Validator {
  return (value) => {
    const v = value.trim().toUpperCase();
    if (v.length === 0) return null;
    return ['MALE', 'M', 'FEMALE', 'F', 'OTHER', 'O'].includes(v) ? null : { key: KEY_INVALID_FORMAT };
  };
}

/** A decimal strictly greater than zero (blank passes; pair with `required()`). */
export function positiveDecimal(max: string): Validator {
  // No decimal-place cap: saved areas can carry map-measured fractions (e.g. 2.4691358) and the
  // API only requires areaAcres > 0.
  const base = decimal({ max });
  return (value) => {
    const text = value.trim();
    if (text.length === 0) return null;
    const error = base(text);
    if (error !== null) return error;
    return compareDecimal(text, '0') > 0 ? null : { key: KEY_MUST_BE_POSITIVE };
  };
}

/** Comma-separated list where every item is at most `max` characters. */
export function commaItemsMaxLength(max: number): Validator {
  return (value) => {
    const tooLong = value.split(',').some((item) => item.trim().length > max);
    return tooLong ? { key: 'farmer.validation.tooLong' as TranslationKey, params: { max } } : null;
  };
}

/** Passwords are never trimmed: a space is a legitimate character. */
export function passwordMinLength(min: number): Validator {
  return (value) =>
    value.length > 0 && value.length < min ? { key: 'farmer.validation.tooShort' as TranslationKey, params: { min } } : null;
}

export function passwordMaxLength(max: number): Validator {
  return (value) =>
    value.length > max ? { key: 'farmer.validation.tooLong' as TranslationKey, params: { max } } : null;
}

/** Fails unless the value equals `other()` (evaluated lazily so it sees the current form). */
export function matches(other: () => string): Validator {
  return (value): FieldError | null => (value === other() ? null : { key: KEY_PASSWORD_MISMATCH });
}

// ── Field rule sets ─────────────────────────────────────────────────────────

/** ProfileScreen's "edit personal details" modal and PersonalDetailsScreen's edit mode. */
export type PersonalField = 'fullName' | 'dob' | 'yearsInOrganic' | 'farmName' | 'location';

export const PERSONAL_RULES: FieldRules<PersonalField> = {
  fullName: [required(), name()],
  dob: [displayDob()],
  yearsInOrganic: [integer({ min: FARMING_EXPERIENCE_MIN_YEARS, max: FARMING_EXPERIENCE_MAX_YEARS })],
  farmName: [maxLength(FARM_NAME_MAX_LENGTH)],
  location: [maxLength(ADDRESS_MAX_LENGTH)],
};

/** PersonalDetailsScreen has `address` where the modal has `location`. */
export type PersonalDetailsField = 'fullName' | 'dob' | 'gender' | 'address' | 'yearsInOrganic';

export const PERSONAL_DETAILS_RULES: FieldRules<PersonalDetailsField> = {
  fullName: PERSONAL_RULES.fullName!,
  dob: PERSONAL_RULES.dob!,
  gender: [genderText()],
  address: [maxLength(ADDRESS_MAX_LENGTH)],
  yearsInOrganic: PERSONAL_RULES.yearsInOrganic!,
};

/** ProfileScreen's "edit farm" modal. */
export type FarmField = 'acres' | 'zones' | 'waterSource';

export const FARM_RULES: FieldRules<FarmField> = {
  acres: [positiveDecimal(ACRES_MAX)],
  zones: [integer({ min: 0, max: ZONES_MAX })],
  waterSource: [maxLength(WATER_SOURCE_MAX_LENGTH * 10), commaItemsMaxLength(WATER_SOURCE_MAX_LENGTH)],
};

/** Change-password screen / modal. */
export type PasswordField = 'currentPassword' | 'newPassword' | 'confirmPassword';

export function passwordRules(getNewPassword: () => string): FieldRules<PasswordField> {
  return {
    currentPassword: [required()],
    newPassword: [required(), passwordMinLength(PASSWORD_MIN_LENGTH), passwordMaxLength(PASSWORD_MAX_LENGTH)],
    confirmPassword: [required(), matches(getNewPassword)],
  };
}

/** ZoneDetailsModal: `PlotCreate.name` 1..120; `areaAcres` exclusiveMinimum 0. */
export type ZoneField = 'name' | 'areaText';
export const ZONE_NAME_MAX_LENGTH = 120;

export const ZONE_RULES: FieldRules<ZoneField> = {
  name: [required(), maxLength(ZONE_NAME_MAX_LENGTH)],
  areaText: [positiveDecimal(ACRES_MAX)],
};

/** ZonesScreen's edit-details modal. Crop is local-only (never sent), bounded generically (SPEC GAP). */
export type ZoneEditField = 'name' | 'cropName' | 'cropDay';
export const ZONE_CROP_NAME_MAX_LENGTH = 60;
/** SPEC GAP: no spec limit for "day of crop"; a generic ceiling stops a mistyped value. */
export const ZONE_CROP_DAY_MAX = '1000';

export const ZONE_EDIT_RULES: FieldRules<ZoneEditField> = {
  name: [maxLength(ZONE_NAME_MAX_LENGTH)],
  cropName: [maxLength(ZONE_CROP_NAME_MAX_LENGTH)],
  cropDay: [integer({ min: 0, max: ZONE_CROP_DAY_MAX })],
};
