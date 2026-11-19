/**
 * Field rules for Log Pest Treatment. docs/openapi.yaml: intervalDays and phiDays
 * are integers >= 0 with no upper bound -- the 365-day ceiling is a generic
 * conservative limit (SPEC GAP), kept as a named constant, not a business rule.
 */
import { integer, type FieldRules } from '../../../../utils/validation';

export type PestTreatmentField = 'intervalDays' | 'phiDays';

export const PEST_TREATMENT_FIELD_ORDER: readonly PestTreatmentField[] = ['intervalDays', 'phiDays'];

export const PEST_DAYS_MAX = 365;

export const PEST_TREATMENT_RULES: FieldRules<PestTreatmentField> = {
  intervalDays: [integer({ min: 0, max: PEST_DAYS_MAX })],
  phiDays: [integer({ min: 0, max: PEST_DAYS_MAX })],
};
