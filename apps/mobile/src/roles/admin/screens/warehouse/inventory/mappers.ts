/**
 * API rows -> the inventory UI types (./types.ts).
 *
 * Pure, so plain-Node vitest covers every branch
 * (../../../tests/mappers_inventory.test.ts). Every quantity becomes integer
 * grams through parseKgToGrams (the digits are read as text, never through
 * parseFloat), so sums, signs and shares are exact.
 *
 * What the server decides is shown as the server sends it:
 *  - available stock is the server's own figure: a batch's qtyAvailableKg and
 *    an allocation's availableQtyKg, which is already capped by the batch's
 *    unclaimed shelf (BR-100). Nothing here recomputes it from received,
 *    reserved or consumed, and a missing figure stays missing.
 *  - a ledger delta keeps its own sign; the stored balance_after is the batch
 *    balance plus that delta (BR-37), so the type only names the movement.
 *  - "low stock" needs a threshold that lives in system_config on the server,
 *    so a product is low only when the server raised a LOW_STOCK alert for it.
 *
 * What the API does not carry is not invented: a batch without cropName gets a
 * neutral label, never the crop uuid or a guessed name.
 */
import type { AlertItemDto } from '../../../api/alerts';
import type { AllocationDto, BatchDto, StockLedgerEntryDto } from '../../../api/inventory';
import { t, type TranslationKey } from '../../../i18n';
import { formatKg, parseKgToGrams } from '../../../money/quantity';
import { formatAdminDate, formatAdminDay } from '../../../utils/datetime';
import type {
  AllocationChannelKey,
  AllocationChannelSummary,
  AllocationDashboard,
  BatchRow,
  BatchUiStatus,
  LowStockRow,
  MovementDirection,
  ProductStock,
  StockMovementKind,
  StockMovementRow,
  StockSummary,
  WarehouseScope,
} from './types';

function has<K extends string>(table: Record<K, unknown>, value: string): value is K {
  return Object.prototype.hasOwnProperty.call(table, value);
}

/**
 * The warehouseId an inventory request sends (BR-30). A Sub scope always sends
 * its own warehouse uuid, whatever a picker says; the Main view sends the
 * warehouse it picked, or nothing for all of them.
 */
export function inventoryWarehouseFilter(scope: WarehouseScope, selectedId: string | undefined): string | undefined {
  return scope.warehouseId !== undefined ? scope.warehouseId : selectedId;
}

/** The key of one product (crop + grade), shared by batches, allocations and LOW_STOCK alerts. */
export function productKey(cropId: string, grade: string): string {
  return `${cropId}:${grade}`;
}

function cropLabel(cropName: string | null | undefined): string {
  return typeof cropName === 'string' && cropName.trim() !== '' ? cropName : t('inventory.crop.unnamed');
}

const GRADE_LABEL: Record<BatchDto['grade'], TranslationKey> = {
  GRADE_1: 'inventory.grade.GRADE_1',
  GRADE_2: 'inventory.grade.GRADE_2',
  GRADE_3: 'inventory.grade.GRADE_3',
  REJECT: 'inventory.grade.REJECT',
};

export function gradeLabel(grade: string): string {
  return t(has(GRADE_LABEL, grade) ? GRADE_LABEL[grade] : 'inventory.grade.unknown');
}

/** "Carrot · Grade 1". */
function productLabelOf(productName: string, grade: string): string {
  return t('inventory.product.label', { product: productName, grade: gradeLabel(grade) });
}

/** A Quantity string as grams; null for an absent value or one that is not a Quantity. */
function grams(value: string | null | undefined): number | null {
  return typeof value === 'string' ? parseKgToGrams(value) : null;
}

// ─── Batches ─────────────────────────────────────────────────────────────────

const BATCH_STATUS: Record<BatchDto['status'], Exclude<BatchUiStatus, 'unknown'>> = {
  ACTIVE: 'active',
  DEPLETED: 'depleted',
  EXPIRED: 'expired',
  WRITTEN_OFF: 'writtenOff',
};

const BATCH_STATUS_LABEL: Record<BatchUiStatus, TranslationKey> = {
  active: 'inventory.batchStatus.active',
  depleted: 'inventory.batchStatus.depleted',
  expired: 'inventory.batchStatus.expired',
  writtenOff: 'inventory.batchStatus.writtenOff',
  unknown: 'inventory.batchStatus.unknown',
};

export function batchStatusOf(status: string): BatchUiStatus {
  return has(BATCH_STATUS, status) ? BATCH_STATUS[status] : 'unknown';
}

export function toBatchRow(dto: BatchDto): BatchRow {
  const status = batchStatusOf(dto.status);
  return {
    id: dto.id,
    batchCode: dto.batchCode,
    warehouseId: dto.warehouseId,
    cropId: dto.cropId,
    grade: dto.grade,
    productName: cropLabel(dto.cropName),
    gradeLabel: gradeLabel(dto.grade),
    status,
    statusLabel: t(BATCH_STATUS_LABEL[status]),
    availableGrams: grams(dto.qtyAvailableKg),
    receivedGrams: grams(dto.qtyReceivedKg),
    reservedGrams: grams(dto.qtyReservedKg),
    storageLocation: typeof dto.storageLocation === 'string' && dto.storageLocation.trim() !== '' ? dto.storageLocation : null,
    receivedOn: dto.receivedOn === undefined ? '' : formatAdminDay(dto.receivedOn),
    expiryOn: dto.expiryOn === undefined || dto.expiryOn === null ? '' : formatAdminDay(dto.expiryOn),
  };
}

/** cropId -> crop name, from batches whose server row carried a name. */
export function cropNamesOf(batches: readonly BatchRow[]): Map<string, string> {
  const unnamed = t('inventory.crop.unnamed');
  const names = new Map<string, string>();
  for (const batch of batches) {
    if (batch.productName !== unnamed && !names.has(batch.cropId)) names.set(batch.cropId, batch.productName);
  }
  return names;
}

export interface AggregateOptions {
  /** productKey()s the server raised LOW_STOCK for (lowStockKeysOf). */
  lowStockKeys?: ReadonlySet<string> | undefined;
  /** productKey() -> allocated grams (allocatedByProduct). */
  allocatedByProduct?: ReadonlyMap<string, number> | undefined;
}

interface ProductAccumulator {
  product: ProductStock;
  byLocation: Map<string, number>;
}

/**
 * Per crop + grade totals over the ACTIVE batches (depleted, expired and
 * written-off stock is not on offer), plus warehouse totals. Most available
 * first; ties by name then grade, so the order is stable.
 */
export function aggregateStockByProduct(batches: readonly BatchRow[], options: AggregateOptions = {}): StockSummary {
  const groups = new Map<string, ProductAccumulator>();
  for (const batch of batches) {
    if (batch.status !== 'active') continue;
    const key = productKey(batch.cropId, batch.grade);
    let group = groups.get(key);
    if (group === undefined) {
      group = {
        product: {
          key,
          cropId: batch.cropId,
          grade: batch.grade,
          productName: batch.productName,
          gradeLabel: batch.gradeLabel,
          availableGrams: 0,
          reservedGrams: 0,
          allocatedGrams: options.allocatedByProduct === undefined ? null : options.allocatedByProduct.get(key) ?? 0,
          activeBatchCount: 0,
          storageLocations: [],
          primaryStorage: null,
          level: 'inStock',
          complete: true,
        },
        byLocation: new Map(),
      };
      groups.set(key, group);
    }
    const { product, byLocation } = group;
    product.activeBatchCount += 1;
    if (batch.availableGrams === null) product.complete = false;
    else product.availableGrams += batch.availableGrams;
    if (batch.reservedGrams !== null) product.reservedGrams += batch.reservedGrams;
    if (batch.storageLocation !== null) {
      if (!byLocation.has(batch.storageLocation)) product.storageLocations.push(batch.storageLocation);
      byLocation.set(batch.storageLocation, (byLocation.get(batch.storageLocation) ?? 0) + (batch.availableGrams ?? 0));
    }
  }

  const products: ProductStock[] = [];
  let totalAvailableGrams = 0;
  let totalReservedGrams = 0;
  for (const { product, byLocation } of groups.values()) {
    let best: [string, number] | null = null;
    for (const entry of byLocation) if (best === null || entry[1] > best[1]) best = entry;
    product.primaryStorage = best === null ? null : best[0];
    product.level =
      product.availableGrams === 0 ? 'out' : options.lowStockKeys?.has(product.key) === true ? 'low' : 'inStock';
    totalAvailableGrams += product.availableGrams;
    totalReservedGrams += product.reservedGrams;
    products.push(product);
  }
  products.sort(
    (a, b) =>
      b.availableGrams - a.availableGrams || a.productName.localeCompare(b.productName) || a.grade.localeCompare(b.grade),
  );
  return { products, totalAvailableGrams, totalReservedGrams };
}

// ─── Ledger ──────────────────────────────────────────────────────────────────

const MOVEMENT_KIND: Record<StockLedgerEntryDto['txnType'], Exclude<StockMovementKind, 'unknown'>> = {
  RECEIPT: 'receipt',
  SALE: 'sale',
  TRANSFER_OUT: 'transferOut',
  TRANSFER_IN: 'transferIn',
  ADJUSTMENT: 'adjustment',
  WASTAGE: 'wastage',
  RETURN_IN: 'returnIn',
  RESERVATION: 'reservation',
  RELEASE: 'release',
};

const MOVEMENT_LABEL: Record<StockMovementKind, TranslationKey> = {
  receipt: 'inventory.movement.receipt',
  sale: 'inventory.movement.sale',
  transferOut: 'inventory.movement.transferOut',
  transferIn: 'inventory.movement.transferIn',
  adjustment: 'inventory.movement.adjustment',
  wastage: 'inventory.movement.wastage',
  returnIn: 'inventory.movement.returnIn',
  reservation: 'inventory.movement.reservation',
  release: 'inventory.movement.release',
  unknown: 'inventory.movement.unknown',
};

export function stockMovementKindOf(txnType: string): StockMovementKind {
  return has(MOVEMENT_KIND, txnType) ? MOVEMENT_KIND[txnType] : 'unknown';
}

function directionOf(deltaGrams: number | null): MovementDirection {
  if (deltaGrams === null || deltaGrams === 0) return 'none';
  return deltaGrams > 0 ? 'in' : 'out';
}

/** "+100 kg" for an inflow, "-20 kg" for an outflow, '' when unreadable. */
function signedKg(deltaGrams: number | null): string {
  if (deltaGrams === null) return '';
  return deltaGrams > 0 ? `+${formatKg(deltaGrams)}` : formatKg(deltaGrams);
}

/**
 * One ledger row. `batches` (batch uuid -> row) names the batch when it is
 * among the loaded ones; otherwise the row shows no batch rather than a guess.
 */
export function toStockMovementRow(
  dto: StockLedgerEntryDto,
  now: Date,
  batches?: ReadonlyMap<string, BatchRow>,
): StockMovementRow {
  const kind = stockMovementKindOf(dto.txnType);
  const deltaGrams = grams(dto.qtyDeltaKg);
  const balanceAfterGrams = grams(dto.balanceAfterKg);
  const batch = batches?.get(dto.batchId);
  const remarks = typeof dto.remarks === 'string' && dto.remarks.trim() !== '' ? dto.remarks : undefined;
  return {
    id: dto.id,
    batchId: dto.batchId,
    kind,
    typeLabel: t(MOVEMENT_LABEL[kind]),
    direction: directionOf(deltaGrams),
    deltaGrams,
    deltaText: signedKg(deltaGrams),
    balanceAfterGrams,
    balanceText: balanceAfterGrams === null ? '' : formatKg(balanceAfterGrams),
    performedAt: formatAdminDate(dto.performedAt, now),
    ...(batch === undefined
      ? {}
      : { batchCode: batch.batchCode, productLabel: productLabelOf(batch.productName, batch.grade) }),
    ...(remarks === undefined ? {} : { remarks }),
  };
}

// ─── Allocations ─────────────────────────────────────────────────────────────

const KNOWN_CHANNELS: readonly Exclude<AllocationChannelKey, 'unknown'>[] = ['online', 'liveMarket', 'reserve', 'buffer'];

const CHANNEL_KEY: Record<AllocationDto['channel'], Exclude<AllocationChannelKey, 'unknown'>> = {
  ONLINE: 'online',
  LIVE_MARKET: 'liveMarket',
  RESERVE: 'reserve',
  BUFFER: 'buffer',
};

const CHANNEL_LABEL: Record<AllocationChannelKey, TranslationKey> = {
  online: 'inventory.channel.online',
  liveMarket: 'inventory.channel.liveMarket',
  reserve: 'inventory.channel.reserve',
  buffer: 'inventory.channel.buffer',
  unknown: 'inventory.channel.unknown',
};

export function allocationChannelOf(channel: string): AllocationChannelKey {
  return has(CHANNEL_KEY, channel) ? CHANNEL_KEY[channel] : 'unknown';
}

// BigInt() calls, not `0n` literals, so no bundler step has to know the literal syntax.
const ZERO = BigInt(0);
const ONE = BigInt(1);
const BASIS = BigInt(10000);

/**
 * `parts` as integer basis points of their sum, by largest remainder, so the
 * result sums to exactly 10000 (0 for every part when the sum is 0). BigInt,
 * because grams * 10000 can pass Number.MAX_SAFE_INTEGER.
 */
function basisPoints(parts: readonly number[]): number[] {
  const total = parts.reduce((sum, part) => sum + BigInt(part), ZERO);
  if (total <= ZERO) return parts.map(() => 0);
  const scaled = parts.map((part) => BigInt(part) * BASIS);
  const shares = scaled.map((value) => value / total);
  let left = BASIS - shares.reduce((sum, share) => sum + share, ZERO);
  // Hand the rounding leftovers to the largest remainders; earlier channels win ties.
  const order = scaled
    .map((value, index) => ({ index, remainder: value % total }))
    .sort((a, b) => (a.remainder === b.remainder ? a.index - b.index : a.remainder > b.remainder ? -1 : 1));
  for (const { index } of order) {
    if (left === ZERO) break;
    shares[index] = (shares[index] ?? ZERO) + ONE;
    left -= ONE;
  }
  return shares.map((share) => Number(share));
}

function emptyChannel(channel: AllocationChannelKey): AllocationChannelSummary {
  return {
    channel,
    label: t(CHANNEL_LABEL[channel]),
    allocatedGrams: 0,
    consumedGrams: 0,
    reservedGrams: 0,
    availableGrams: 0,
    shareBasisPoints: 0,
  };
}

/**
 * Per-channel totals over every allocation row the server returned. The split
 * bar's shares are computed from integer grams; available is the server's
 * effective figure (BR-100), and a channel with any row lacking it shows none.
 */
export function buildAllocationDashboard(rows: readonly AllocationDto[]): AllocationDashboard {
  const byChannel = new Map<AllocationChannelKey, AllocationChannelSummary>(
    KNOWN_CHANNELS.map((channel) => [channel, emptyChannel(channel)]),
  );
  for (const row of rows) {
    const key = allocationChannelOf(row.channel);
    let summary = byChannel.get(key);
    if (summary === undefined) {
      summary = emptyChannel(key);
      byChannel.set(key, summary);
    }
    summary.allocatedGrams += grams(row.allocatedQtyKg) ?? 0;
    summary.consumedGrams += grams(row.consumedQtyKg) ?? 0;
    summary.reservedGrams += grams(row.reservedQtyKg) ?? 0;
    const available = grams(row.availableQtyKg);
    summary.availableGrams = summary.availableGrams === null || available === null ? null : summary.availableGrams + available;
  }
  const channels = [...byChannel.values()];
  const shares = basisPoints(channels.map((channel) => channel.allocatedGrams));
  channels.forEach((channel, index) => {
    channel.shareBasisPoints = shares[index] ?? 0;
  });
  return {
    channels,
    totalAllocatedGrams: channels.reduce((sum, channel) => sum + channel.allocatedGrams, 0),
  };
}

/** productKey() -> allocated grams over every channel row of that product. */
export function allocatedByProduct(rows: readonly AllocationDto[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const key = productKey(row.cropId, row.grade);
    totals.set(key, (totals.get(key) ?? 0) + (grams(row.allocatedQtyKg) ?? 0));
  }
  return totals;
}

// ─── Low stock (LOW_STOCK alerts) ────────────────────────────────────────────

function stringParam(alert: AlertItemDto, key: string): string | undefined {
  const value = alert.params[key];
  return typeof value === 'string' ? value : undefined;
}

/** productKey()s of the LOW_STOCK alerts (params cropId + grade). */
export function lowStockKeysOf(alerts: readonly AlertItemDto[]): Set<string> {
  const keys = new Set<string>();
  for (const alert of alerts) {
    if (alert.type !== 'LOW_STOCK') continue;
    const cropId = stringParam(alert, 'cropId');
    const grade = stringParam(alert, 'grade');
    if (cropId !== undefined && grade !== undefined) keys.add(productKey(cropId, grade));
  }
  return keys;
}

/** A kg param as "12.5 kg", or as sent when it is not a Quantity (never NaN). */
function kgParam(alert: AlertItemDto, key: string): string {
  const value = alert.params[key];
  if (value === null || value === undefined) return '';
  const text = String(value);
  const parsed = parseKgToGrams(text);
  return parsed === null ? text : formatKg(parsed);
}

/** One LOW_STOCK alert as a row; `cropNames` (cropNamesOf) names the crop when known. */
export function toLowStockRow(alert: AlertItemDto, cropNames: ReadonlyMap<string, string>): LowStockRow {
  const cropId = stringParam(alert, 'cropId') ?? '';
  const grade = stringParam(alert, 'grade') ?? '';
  return {
    id: alert.itemKey,
    cropId,
    grade,
    name: productLabelOf(cropLabel(cropNames.get(cropId)), grade),
    available: kgParam(alert, 'totalQtyKg'),
    threshold: kgParam(alert, 'thresholdKg'),
    warehouseId: alert.warehouseId,
  };
}
