/**
 * Input rules for the produce-log modal (milk, eggs, value-added dairy).
 * Limits follow livestock_production_logs.quantity numeric(10,3) > 0 (db
 * migration 0024) and createProductionLogBody (notes max 2000, fatPercent
 * 0..100). They are request-shape limits, not business thresholds.
 */
import {
  decimal,
  integer,
  maxLength,
  required,
  validateFields,
  type FieldErrors,
  type FieldRules,
} from '../../../../utils/validation';
import { isValueAddedType, type DairyProductType } from './model';

/** numeric(10,3): 7 digits before the point, 3 after. */
export const QUANTITY_MAX_INTEGER_DIGITS = 7;
export const QUANTITY_MAX_DECIMALS = 3;
/** Smallest storable positive quantity at 3 decimals. */
export const QUANTITY_MIN = '0.001';
export const FAT_PERCENT_MAX = 100;
export const COUNT_MAX = '9999999';
/** createProductionLogBody.notes. */
export const PRODUCE_NOTES_MAX = 2000;

export type ProduceField = 'quantity' | 'fat' | 'milkUsed' | 'count' | 'damaged' | 'notes';

export interface ProduceFormValues {
  quantity: string;
  fat: string;
  milkUsed: string;
  count: string;
  damaged: string;
  notes: string;
}

const positiveQuantity = () =>
  decimal({ min: QUANTITY_MIN, maxIntegerDigits: QUANTITY_MAX_INTEGER_DIGITS, maxDecimals: QUANTITY_MAX_DECIMALS });

/** The rules that apply to `product`'s form (fields it does not show are not validated). */
export function produceRules(product: DairyProductType): FieldRules<ProduceField> {
  const notes = [maxLength(PRODUCE_NOTES_MAX)];
  if (product === 'milk') {
    return {
      quantity: [required(), positiveQuantity()],
      fat: [decimal({ min: '0', max: FAT_PERCENT_MAX, maxDecimals: 2 })],
      notes,
    };
  }
  if (product === 'eggs') {
    return {
      count: [required(), integer({ min: '1', max: COUNT_MAX })],
      damaged: [integer({ min: '0', max: COUNT_MAX })],
      notes,
    };
  }
  return {
    quantity: [required(), positiveQuantity()],
    ...(product === 'curd' || product === 'paneer' ? { milkUsed: [positiveQuantity()] } : {}),
    notes: isValueAddedType(product) ? notes : [],
  };
}

export function validateProduceForm(
  product: DairyProductType,
  values: ProduceFormValues,
): FieldErrors<ProduceField> {
  return validateFields(values, produceRules(product));
}
