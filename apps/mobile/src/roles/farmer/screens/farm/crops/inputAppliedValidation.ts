/**
 * Field rules for AddInputAppliedScreen. Limits from docs/openapi.yaml
 * CropInputRequest: inputName 1..200, quantity > 0 (numeric(10,2): 8 integer
 * digits, 2 decimals), notes maxLength 2000. The date/time field is free text
 * ("17 Sep 2026, 09:20 AM") with no API shape yet, so it is only required and
 * length-bounded (50 is a generic limit -- SPEC GAP).
 */
import { decimal, maxLength, required, type FieldRules } from '../../../utils/validation';

export type InputAppliedField = 'productName' | 'quantity' | 'dateTime' | 'notes';

export const INPUT_APPLIED_FIELD_ORDER: readonly InputAppliedField[] = ['productName', 'quantity', 'dateTime', 'notes'];

export const INPUT_APPLIED_RULES: FieldRules<InputAppliedField> = {
  productName: [required(), maxLength(200)],
  quantity: [required(), decimal({ min: '0.01', maxDecimals: 2, maxIntegerDigits: 8 })],
  dateTime: [required(), maxLength(50)],
  notes: [maxLength(2000)],
};
