/**
 * Validation rules for the soil amendment and erosion-note forms.
 *
 * Limits mirror docs/openapi.yaml `SoilAmendmentCreate` (amendmentType 1..120,
 * quantityKg > 0, notes <= 2000) and `ErosionConservationNoteCreate`
 * (practiceNotes <= 2000). The schema puts no upper bound or decimal limit on
 * quantityKg; the digit limits below are conservative generic ones (spec gap).
 */
import { decimal, maxLength, required, type FieldRules } from '../../utils/validation';
import { soilDate, soilDateNotInFuture } from './soilForms/dateValidation';
import { greaterThanZero } from './workforce/attendanceHours';

export const SOIL_AMENDMENT_TYPE_MAX_LENGTH = 120;
export const SOIL_NOTES_MAX_LENGTH = 2000;
/** Spec gap: generic digit limits for quantityKg. */
export const SOIL_QUANTITY_MAX_INTEGER_DIGITS = 7;
export const SOIL_QUANTITY_MAX_DECIMALS = 3;
/** TextInput cap: digits + '.' + decimals. */
export const SOIL_QUANTITY_MAX_CHARS = SOIL_QUANTITY_MAX_INTEGER_DIGITS + 1 + SOIL_QUANTITY_MAX_DECIMALS;

export type AmendmentField = 'amendmentType' | 'quantityKg' | 'notes';
export const AMENDMENT_FIELD_ORDER: readonly AmendmentField[] = ['amendmentType', 'quantityKg', 'notes'];

export const AMENDMENT_RULES: FieldRules<AmendmentField> = {
  amendmentType: [required(), maxLength(SOIL_AMENDMENT_TYPE_MAX_LENGTH)],
  quantityKg: [
    required(),
    decimal({
      min: '0',
      maxIntegerDigits: SOIL_QUANTITY_MAX_INTEGER_DIGITS,
      maxDecimals: SOIL_QUANTITY_MAX_DECIMALS,
    }),
    greaterThanZero,
  ],
  notes: [maxLength(SOIL_NOTES_MAX_LENGTH)],
};

export type ErosionField = 'practiceNotes';

export const EROSION_RULES: FieldRules<ErosionField> = {
  practiceNotes: [maxLength(SOIL_NOTES_MAX_LENGTH)],
};

/**
 * Dates are typed as DD/MM/YY (see soilForms/dateValidation). Kept apart from the
 * rule sets above so those stay keyed to the text fields only.
 */
const SOIL_LOG_DATE_RULES = [required(), soilDate(), soilDateNotInFuture()];

export type AmendmentFormField = AmendmentField | 'appliedDate';
export const AMENDMENT_FORM_FIELD_ORDER: readonly AmendmentFormField[] = [
  'amendmentType',
  'quantityKg',
  'appliedDate',
  'notes',
];
export const AMENDMENT_FORM_RULES: FieldRules<AmendmentFormField> = {
  ...AMENDMENT_RULES,
  appliedDate: SOIL_LOG_DATE_RULES,
};

export type ErosionFormField = ErosionField | 'logDate';
export const EROSION_FORM_FIELD_ORDER: readonly ErosionFormField[] = ['logDate', 'practiceNotes'];
export const EROSION_FORM_RULES: FieldRules<ErosionFormField> = {
  ...EROSION_RULES,
  logDate: SOIL_LOG_DATE_RULES,
};
