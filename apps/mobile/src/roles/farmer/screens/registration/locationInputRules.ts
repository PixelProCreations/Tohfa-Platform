/**
 * Field rules for the map-location inputs: the place-search box, a parcel's name and acreage, and
 * the typed latitude / longitude rows (registration Step 3, Profile -> Zone boundary, FMB sketch).
 *
 * Pure -- no React, no `t()` -- so it runs in plain-Node vitest and every screen that has these
 * inputs shares one definition. Built on the shared validators in utils/validation.
 *
 * Limits: docs/openapi.yaml fixes `location.locations[].label` at maxLength 120 and requires
 * `areaAcres` and in-range coordinates (lat -90..90, lng -180..180) but gives `areaAcres` no
 * bounds, and says nothing about the search box. Those are SPEC GAPS; the values below are
 * conservative generic limits, not business thresholds.
 */
import {
  compareDecimal,
  compose,
  decimal,
  maxLength,
  minLength,
  required,
  runRules,
  VALIDATION_MESSAGES,
  type FieldError,
  type Validator,
} from '../../utils/validation';
import type { ManualPointRow } from './manualPoints';

/** `locations[].label`: spec maxLength 120. */
export const LOCATION_LABEL_MAX_LENGTH = 120;
/** SPEC GAP: a parcel's acreage has no spec bounds; 0.0001..100000 acres with 4 decimals. */
export const AREA_ACRES_MIN = '0.0001';
export const AREA_ACRES_MAX = '100000';
export const AREA_ACRES_MAX_DECIMALS = 4;
export const AREA_ACRES_MAX_INTEGER_DIGITS = 6;
/** Typing cap: 6 integer digits + point + 4 decimals. */
export const AREA_ACRES_INPUT_MAX_LENGTH = AREA_ACRES_MAX_INTEGER_DIGITS + 1 + AREA_ACRES_MAX_DECIMALS;
/** SPEC GAP: place search is free text; Mapbox waits for 2 characters, so 1 is rejected. */
export const SEARCH_QUERY_MIN_LENGTH = 2;
export const SEARCH_QUERY_MAX_LENGTH = 100;
/** Typing cap for a coordinate: a sign, three integer digits and a generous fraction. */
export const COORDINATE_INPUT_MAX_LENGTH = 20;

export const LATITUDE_RANGE_KEY = 'farmer.registration.step3.latitudeRange';
export const LONGITUDE_RANGE_KEY = 'farmer.registration.step3.longitudeRange';
export const BOTH_COORDINATES_KEY = 'farmer.registration.step3.bothCoordinates';

export const LOCATION_LABEL_RULES: readonly Validator[] = [required(), maxLength(LOCATION_LABEL_MAX_LENGTH)];

const areaDecimal = decimal({
  min: AREA_ACRES_MIN,
  max: AREA_ACRES_MAX,
  maxDecimals: AREA_ACRES_MAX_DECIMALS,
  maxIntegerDigits: AREA_ACRES_MAX_INTEGER_DIGITS,
});

/** Acreage as typed: required, a plain positive decimal ("5." is tolerated, as parseFloat does). */
export const AREA_ACRES_RULES: readonly Validator[] = [
  required(),
  (value) => areaDecimal(value.trim().replace(/\.$/, '')),
];

/** Free-text place search: optional, but a single character or more than 100 is rejected. */
export const SEARCH_QUERY_RULES: readonly Validator[] = [
  minLength(SEARCH_QUERY_MIN_LENGTH),
  maxLength(SEARCH_QUERY_MAX_LENGTH),
];

export function validateLocationLabel(value: string): FieldError | null {
  return runRules(value, LOCATION_LABEL_RULES);
}
export function validateAreaAcres(value: string): FieldError | null {
  return runRules(value, AREA_ACRES_RULES);
}
export function validateSearchQuery(value: string): FieldError | null {
  return runRules(value, SEARCH_QUERY_RULES);
}

/** Digits, one sign and the point only: no exponent ("1e1") or hex ("0x1") that `Number()` would accept. */
export function sanitizeCoordinateText(text: string): string {
  return text.replace(/[^0-9.+-]/g, '');
}

const COORDINATE_SHAPE = /^[+-]?(\d+\.?\d*|\.\d+)$/;

function coordinate(bound: number, rangeKey: typeof LATITUDE_RANGE_KEY | typeof LONGITUDE_RANGE_KEY): Validator {
  return (value) => {
    const text = value.trim();
    if (text.length === 0) return null;
    if (!COORDINATE_SHAPE.test(text)) return { key: VALIDATION_MESSAGES.decimalInvalid };
    const normal = text.replace(/^\+/, '').replace(/\.$/, '');
    const within = compareDecimal(normal, bound) <= 0 && compareDecimal(normal, -bound) >= 0;
    return within ? null : { key: rangeKey };
  };
}

export const latitudeRule: Validator = coordinate(90, LATITUDE_RANGE_KEY);
export const longitudeRule: Validator = coordinate(180, LONGITUDE_RANGE_KEY);

export const validateLatitude = compose(latitudeRule);
export const validateLongitude = compose(longitudeRule);

export type CoordinateField = 'latText' | 'lngText';

export interface RowFieldErrors {
  latText?: FieldError;
  lngText?: FieldError;
}

/** Which of a row's two fields have been left (blurred), and whether the form was submitted. */
export interface RowTouched {
  latText?: boolean;
  lngText?: boolean;
}

/**
 * The errors to SHOW for one typed point row.
 *  - a field's format / range error appears once that field is blurred (or after submit);
 *  - "enter both" appears on the empty half only once both fields have been left (or after
 *    submit), so tabbing from latitude to longitude does not flag longitude prematurely.
 * A wholly blank row has no errors: the farmer may add a row before filling it.
 */
export function rowFieldErrors(row: ManualPointRow, touched: RowTouched, submitted = false): RowFieldErrors {
  const errors: RowFieldErrors = {};
  const latFilled = row.latText.trim() !== '';
  const lngFilled = row.lngText.trim() !== '';
  if (!latFilled && !lngFilled) return errors;

  const latError = latitudeRule(row.latText);
  const lngError = longitudeRule(row.lngText);
  if (latError && (touched.latText || submitted)) errors.latText = latError;
  if (lngError && (touched.lngText || submitted)) errors.lngText = lngError;

  if (latFilled !== lngFilled && ((touched.latText && touched.lngText) || submitted)) {
    const missing: CoordinateField = latFilled ? 'lngText' : 'latText';
    errors[missing] = { key: BOTH_COORDINATES_KEY };
  }
  return errors;
}

/** True when every non-blank row is a complete, in-range pair -- the condition for committing. */
export function rowsAreValid(rows: readonly ManualPointRow[]): boolean {
  return rows.every((row) => {
    const latFilled = row.latText.trim() !== '';
    const lngFilled = row.lngText.trim() !== '';
    if (!latFilled && !lngFilled) return true;
    return latFilled && lngFilled && latitudeRule(row.latText) === null && longitudeRule(row.lngText) === null;
  });
}
