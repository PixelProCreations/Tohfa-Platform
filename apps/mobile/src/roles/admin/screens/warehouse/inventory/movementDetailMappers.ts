/**
 * Movement Detail (design M3-16, route M3S15): pure decisions behind the
 * screen. No React, so plain-Node vitest covers them
 * (../../../tests/movement_detail.test.ts).
 *
 * There is no GET /admin/stock-ledger/{id} in docs/openapi.yaml, so the
 * detail is the ledger row the user tapped, carried in the route params. A
 * deep link without that row has nothing to show (and nothing to ask for).
 *
 * Only what the ledger row carries is shown (BR-37: the row is immutable; a
 * correction is a new row). Not shown, because the API does not carry them:
 * a movement code (only a uuid), a source/destination warehouse pair (a
 * transfer writes one row per warehouse), and who performed it (a user uuid,
 * no name).
 */
import { t, type TranslationKey } from '../../../i18n';
import { pairFields, type InfoFieldValue } from '../shared/infoFields';
import { shortRef } from './adjustmentMappers';
import type { InventoryRouteParams, StockMovementRow } from './types';

/** The route param key the ledger list puts the tapped row under. */
const MOVEMENT_PARAM = 'movement';

export function movementRouteParams(movement: StockMovementRow): Record<string, unknown> {
  return { [MOVEMENT_PARAM]: movement };
}

const REQUIRED_STRINGS = ['id', 'batchId', 'warehouseId', 'kind', 'typeLabel', 'direction', 'deltaText', 'balanceText', 'performedAt'] as const;

/**
 * The tapped row from the route params, or undefined when there is none or it
 * is not a row this app built (a deep link, an old host key).
 */
export function movementParam(params: InventoryRouteParams | undefined): StockMovementRow | undefined {
  const value: unknown = params?.[MOVEMENT_PARAM];
  if (typeof value !== 'object' || value === null) return undefined;
  const record = value as Record<string, unknown>;
  if (!REQUIRED_STRINGS.every((key) => typeof record[key] === 'string')) return undefined;
  return value as StockMovementRow;
}

/**
 * stock_ledger.ref_type values the server writes (goods receipts, orders and
 * direct sales, transfers, adjustments, returns), upper-cased; the server is
 * not consistent about case.
 */
const REFERENCE_LABEL: Readonly<Record<string, TranslationKey>> = {
  GOODS_RECEIPT: 'inventory.movementDetail.ref.GOODS_RECEIPT',
  ORDER: 'inventory.movementDetail.ref.ORDER',
  ORDER_ITEM: 'inventory.movementDetail.ref.ORDER',
  STOCK_TRANSFER: 'inventory.movementDetail.ref.STOCK_TRANSFER',
  STOCK_ADJUSTMENT: 'inventory.movementDetail.ref.STOCK_ADJUSTMENT',
  RETURN_REQUEST: 'inventory.movementDetail.ref.RETURN_REQUEST',
};

/**
 * "Goods receipt · ABCDEF01": the kind of record (when known) and a short form
 * of its uuid (the only id the API carries). undefined hides the field.
 */
export function movementReference(refType: string | undefined, refId: string | undefined): string | undefined {
  const key = refType === undefined ? undefined : REFERENCE_LABEL[refType.toUpperCase()];
  const label = key === undefined ? undefined : t(key);
  const id = refId === undefined ? undefined : shortRef(refId);
  if (label !== undefined && id !== undefined) return t('stockShared.pair', { first: label, second: id });
  return label ?? id;
}

function field(labelKey: TranslationKey, value: string | undefined): InfoFieldValue | undefined {
  return value === undefined || value === '' ? undefined : { label: t(labelKey), value };
}

/** The info card rows, in design order; a field the row does not carry is left out. */
export function movementDetailRows(movement: StockMovementRow, warehouseName: string | undefined): InfoFieldValue[][] {
  return pairFields([
    field('inventory.movementDetail.field.type', movement.typeLabel),
    field('inventory.movementDetail.field.warehouse', warehouseName),
    field('inventory.movementDetail.field.quantity', movement.deltaText),
    field('inventory.movementDetail.field.balanceAfter', movement.balanceText),
    field('inventory.movementDetail.field.product', movement.productLabel),
    field('inventory.movementDetail.field.batch', movement.batchCode),
    field('inventory.movementDetail.field.reference', movementReference(movement.refType, movement.refId)),
    field('inventory.movementDetail.field.performedAt', movement.performedAt),
  ]);
}
