/**
 * Field rules for the New Crop wizard (docs/openapi.yaml FarmCropCreateRequest):
 * seedVariety / seedCompany maxLength 160; seedQuantity and expectedYieldKg
 * numbers >= 0; seedCostPaise integer >= 0 (the rupee string is converted with
 * parseMoney/toPaise, so it follows Money: <= 10 integer digits, <= 2 decimals).
 * The spec gives no digit limits for the two quantities: the generic limits below
 * are SPEC GAPS. Area is informational (never sent), so only its shape is checked.
 */
import { decimal, maxLength, MONEY_MAX_DECIMALS, MONEY_MAX_INTEGER_DIGITS, type FieldRules } from '../../../../utils/validation';

export type NewCropField =
  | 'seedVariety'
  | 'seedCompany'
  | 'quantityUsed'
  | 'costRs'
  | 'areaAcres'
  | 'expectedQtyKg';

/** On-screen order across both steps. */
export const NEW_CROP_FIELD_ORDER: readonly NewCropField[] = [
  'seedVariety',
  'seedCompany',
  'quantityUsed',
  'costRs',
  'areaAcres',
  'expectedQtyKg',
];

export const NEW_CROP_STEP_ONE_FIELDS: readonly NewCropField[] = ['seedVariety', 'seedCompany', 'quantityUsed', 'costRs'];

/** Spec gap: generic digit limits for quantities that docs/openapi.yaml leaves unbounded. */
export const QUANTITY_MAX_INTEGER_DIGITS = 10;
export const QUANTITY_MAX_DECIMALS = 3;
export const AREA_MAX_INTEGER_DIGITS = 8;

export const NEW_CROP_RULES: FieldRules<NewCropField> = {
  seedVariety: [maxLength(160)],
  seedCompany: [maxLength(160)],
  quantityUsed: [decimal({ maxIntegerDigits: QUANTITY_MAX_INTEGER_DIGITS, maxDecimals: QUANTITY_MAX_DECIMALS })],
  costRs: [decimal({ maxIntegerDigits: MONEY_MAX_INTEGER_DIGITS, maxDecimals: MONEY_MAX_DECIMALS })],
  areaAcres: [decimal({ maxIntegerDigits: AREA_MAX_INTEGER_DIGITS })],
  expectedQtyKg: [decimal({ maxIntegerDigits: QUANTITY_MAX_INTEGER_DIGITS, maxDecimals: QUANTITY_MAX_DECIMALS })],
};

/** The farmer may type thousands commas in quantities (the save handler strips them), so validate the stripped text. */
function withoutCommas(value: string): string {
  return value.replace(/,/g, '');
}

export interface NewCropTextValues {
  seedVariety: string;
  seedCompany: string;
  quantityUsed: string;
  costRs: string;
  areaAcres: string;
  expectedQtyKg: string;
}

export function newCropFieldValues(state: NewCropTextValues): Record<NewCropField, string> {
  return {
    seedVariety: state.seedVariety,
    seedCompany: state.seedCompany,
    quantityUsed: withoutCommas(state.quantityUsed),
    costRs: state.costRs,
    areaAcres: state.areaAcres,
    expectedQtyKg: withoutCommas(state.expectedQtyKg),
  };
}
