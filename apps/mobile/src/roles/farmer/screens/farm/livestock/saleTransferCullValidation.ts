/**
 * Text-input rules for SaleTransferCullScreen. Limits are the
 * RecordLifecycleEventBody limits in docs/openapi.yaml: counterparty max 160,
 * reason max 500, salePricePaise integer >= 0 (so a sale price may be 0, unlike
 * a listing price). Only the fields of the chosen event type are validated.
 */
import {
  MONEY_MAX_DECIMALS,
  MONEY_MAX_INTEGER_DIGITS,
  decimal,
  errorMessage,
  maxLength,
  validateFields,
  type FieldRules,
} from '../../../utils/validation';
import { t } from '../../../../../i18n/farmer';

export const COUNTERPARTY_MAX = 160;
export const REASON_MAX = 500;

export type SaleTransferCullEventType = 'sale' | 'transfer' | 'cull';
export type SaleTransferCullField = 'buyer' | 'salePrice' | 'destinationFarm' | 'cullReason';

export function saleTransferCullRules(eventType: SaleTransferCullEventType): FieldRules<SaleTransferCullField> {
  switch (eventType) {
    case 'sale':
      return {
        buyer: [maxLength(COUNTERPARTY_MAX)],
        salePrice: [
          decimal({ min: '0', maxIntegerDigits: MONEY_MAX_INTEGER_DIGITS, maxDecimals: MONEY_MAX_DECIMALS }),
        ],
      };
    case 'transfer':
      return { destinationFarm: [maxLength(COUNTERPARTY_MAX)] };
    case 'cull':
      return { cullReason: [maxLength(REASON_MAX)] };
  }
}

/** Field-keyed, translated messages; empty when everything passes. */
export function validateSaleTransferCull(
  eventType: SaleTransferCullEventType,
  values: Readonly<Record<SaleTransferCullField, string>>,
): Record<string, string> {
  const errors = validateFields(values, saleTransferCullRules(eventType));
  const out: Record<string, string> = {};
  for (const field of Object.keys(errors) as SaleTransferCullField[]) {
    const message = errorMessage(errors[field], t);
    if (message !== undefined) out[field] = message;
  }
  return out;
}
