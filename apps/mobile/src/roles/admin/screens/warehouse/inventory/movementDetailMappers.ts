/**
 * Movement Detail (design M3-16, route M3S15): pure decisions behind the
 * screen. No React, so plain-Node vitest covers them
 * (../../../tests/movement_detail.test.ts).
 *
 * The detail is the ledger row the user tapped, carried in the route params.
 * GET /admin/stock-ledger/{id} exists in docs/openapi.yaml (same row shape)
 * but the app does not call it yet, so a deep link without the row shows
 * "not found" (follow-up: load the row by id).
 *
 * The row is immutable (BR-37: a correction is a new row). Every element of
 * the design renders; a value the API does not carry is ADMIN_NO_VALUE, never
 * sample data — there is no movement code (only a uuid) and no
 * source/destination warehouse pair (a transfer writes one row per
 * warehouse). The names BR-130 added are carried: who recorded the row and,
 * for a row an approved stock adjustment inserted, who approved it
 * (createdByName / approvedByName).
 */
import { t, type TranslationKey } from '../../../i18n';
import { formatKg } from '../../../money/quantity';
import { ADMIN_NO_VALUE } from '../../../utils/noValue';
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
    // BR-130: the API names who recorded the row and who approved the
    // adjustment that inserted it.
    field('inventory.movementDetail.field.recordedBy', movement.createdByName),
    field('inventory.movementDetail.field.approvedBy', movement.approvedByName),
  ]);
}

/** A value for an element the design always draws: the dash when the API has none. */
function shown(value: string | undefined): string {
  return value === undefined || value === '' ? ADMIN_NO_VALUE : value;
}

/**
 * The balance before the movement: balance after minus the signed delta, in
 * integer grams (BR-37: the ledger row records both). null when either is
 * missing.
 */
export function movementBalanceBeforeGrams(movement: StockMovementRow): number | null {
  if (movement.balanceAfterGrams === null || movement.deltaGrams === null) return null;
  return movement.balanceAfterGrams - movement.deltaGrams;
}

/**
 * The adjustment a row points at (stock_ledger.ref_type 'stock_adjustment',
 * ref_id = the adjustment uuid), which View Reference can open (M3S17). Other
 * references have no screen in the inventory flow.
 */
export function movementAdjustmentId(movement: StockMovementRow): string | undefined {
  return movement.refType?.toUpperCase() === 'STOCK_ADJUSTMENT' ? movement.refId : undefined;
}

/** Every value the screen and its voucher draw, in display form. */
export interface MovementDetailView {
  typeLabel: string;
  /** No status on a ledger row in the API. */
  status: string;
  movementId: string;
  warehouse: string;
  dateTime: string;
  product: string;
  grade: string;
  productLabel: string;
  batch: string;
  delta: string;
  before: string;
  after: string;
  storageType: string;
  section: string;
  rack: string;
  shelf: string;
  location: string;
  referenceLabel: string;
  referenceValue: string;
  reference: string;
  receivedFrom: string;
  performedBy: string;
  approvedBy: string | undefined;
  notes: string;
  /** Timeline: only "Ledger Posted" has a time in the API (performedAt). */
  timeline: readonly { labelKey: TranslationKey; time: string }[];
}

export function movementDetailView(movement: StockMovementRow, warehouseName: string | undefined): MovementDetailView {
  const before = movementBalanceBeforeGrams(movement);
  const refKey = movement.refType === undefined ? undefined : REFERENCE_LABEL[movement.refType.toUpperCase()];
  return {
    typeLabel: movement.typeLabel,
    status: ADMIN_NO_VALUE,
    movementId: shortRef(movement.id),
    warehouse: shown(warehouseName),
    dateTime: shown(movement.performedAt),
    product: shown(movement.productName),
    grade: shown(movement.gradeLabel),
    productLabel: shown(movement.productLabel),
    batch: shown(movement.batchCode),
    delta: shown(movement.deltaText),
    before: before === null ? ADMIN_NO_VALUE : formatKg(before),
    after: shown(movement.balanceText),
    storageType: ADMIN_NO_VALUE,
    section: ADMIN_NO_VALUE,
    rack: ADMIN_NO_VALUE,
    shelf: ADMIN_NO_VALUE,
    location: shown(movement.storageLocation),
    referenceLabel: t(refKey ?? 'inventory.stockMovement.reference'),
    referenceValue: movement.refId === undefined ? ADMIN_NO_VALUE : shortRef(movement.refId),
    reference: shown(movementReference(movement.refType, movement.refId)),
    receivedFrom: ADMIN_NO_VALUE,
    performedBy: shown(movement.createdByName),
    approvedBy: movement.approvedByName,
    notes: shown(movement.remarks),
    timeline: [
      { labelKey: 'inventory.stockMovement.step.created', time: ADMIN_NO_VALUE },
      { labelKey: 'inventory.stockMovement.step.recorded', time: ADMIN_NO_VALUE },
      { labelKey: 'inventory.stockMovement.step.posted', time: shown(movement.performedAt) },
      { labelKey: 'inventory.stockMovement.step.completed', time: ADMIN_NO_VALUE },
    ],
  };
}
