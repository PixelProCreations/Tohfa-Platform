/**
 * Field rules for LogFertigationScreen. quantity limits come from docs/openapi.yaml
 * CropInputRequest (quantity > 0, numeric(10,2): max 8 integer digits, 2 decimals).
 * PHI days has no limit in docs/openapi.yaml (it is only echoed into `notes`), so a
 * conservative generic whole-number bound is used -- SPEC GAP, see PHI_DAYS_MAX.
 */
import { decimal, integer, required, type FieldRules } from '../../../utils/validation';

export type FertigationField = 'quantity' | 'phiDays';

export const FERTIGATION_FIELD_ORDER: readonly FertigationField[] = ['quantity', 'phiDays'];

/** Spec gap: a conservative generic ceiling (one year) for pre-harvest interval days. */
export const PHI_DAYS_MAX = 365;

export const FERTIGATION_RULES: FieldRules<FertigationField> = {
  quantity: [required(), decimal({ min: '0.01', maxDecimals: 2, maxIntegerDigits: 8 })],
  phiDays: [integer({ min: 0, max: PHI_DAYS_MAX })],
};
