/**
 * The Inventory tab overview (design M3S01, Main variant): API rows -> the 8
 * stat cards and the section lists. Pure (no React, no react-native), so
 * plain-Node vitest covers every figure (./mainInventoryMappers.test.ts).
 *
 * One module for both warehouse shells: the role difference is the warehouse
 * the requests send (BR-30, inventoryWarehouseFilter) and the permissions the
 * caller holds (mainInventoryAccess), never a copied screen.
 *
 * Every definition a person might want to change lives here as a named,
 * commented function, so changing what "Variance Detected" means is a one-line
 * edit with a test next to it:
 *
 *   Total Stock          sum of qtyAvailableKg over ACTIVE batches (on hand)
 *   Available Stock      sum of the server's effective allocation availability
 *                        (BR-100), capped by the pooled shelf per warehouse,
 *                        crop and grade
 *   Allocated Stock      sum of allocatedQtyKg over the allocation rows
 *   Reserved Stock       sum of allocation reservedQtyKg (cart holds, BR-22)
 *   Low Stock Items      LOW_STOCK alerts the server raised (BR-77)
 *   Verification Pending stock counts in status RECORDED (BR-107)
 *   Variance Detected    RECORDED counts with a non-zero variance (BR-107)
 *   Pending Adjustments  the server's total of PENDING adjustments (BR-37)
 *
 * Rules for every figure: weights are integer grams (money/quantity.ts), never
 * floats; a malformed server value fails the figure (Derived ok:false), which
 * the screen draws as an error with Retry, never as a smaller total or a 0.
 * Admin rows may show batch codes; nothing here carries a farmer id or farm
 * name (BR-16), and stock is pooled across farmers (BR-24).
 */
import type { AlertItemDto } from '../../../api/alerts';
import type { AllocationDto, BatchDto, StockLedgerEntryDto } from '../../../api/inventory';
import type { StockVerificationDto } from '../../../api/stockVerifications';
import type { OffsetPage } from '../../../../../shell/api/pagination';
import { t, type TranslationKey } from '../../../i18n';
import { formatKg, parseKgToGrams } from '../../../money/quantity';
import {
  FIGURE_PLACEHOLDER,
  attempt,
  countLabel,
  deriveAllocatedGrams,
  figureOrPlaceholder,
  warehouseShortName,
  type Derived,
  type SectionStatus,
} from '../../dashboard/mappers_mainDashboard';
import { isAreaAvailable } from '../availability';
import { productKey, toBatchRow, toStockMovementRow } from './mappers';
import type { MovementDirection, PermissionCheck } from './types';

// ─── Quantities ──────────────────────────────────────────────────────────────

class InventoryDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InventoryDataError';
  }
}

/** Grams of a required Quantity; throws (failing the whole figure) on anything else. */
function gramsOf(value: string | null | undefined, what: string): number {
  const grams = typeof value === 'string' ? parseKgToGrams(value) : null;
  if (grams === null) throw new InventoryDataError(`${what} is not a Quantity`);
  return grams;
}

/** Grams of an optional Quantity: absent is 0, present but unreadable throws. */
function optionalGramsOf(value: string | null | undefined, what: string): number {
  return value === undefined || value === null ? 0 : gramsOf(value, what);
}

function isActiveBatch(dto: BatchDto): boolean {
  return dto.status === 'ACTIVE';
}

/**
 * The pooled stock line a row belongs to (BR-24): warehouse, crop and grade.
 * Batches from different farmers of one line are one figure; provenance stays
 * on the batch and never scopes availability.
 */
function stockLineKey(warehouseId: string, cropId: string, grade: string): string {
  return `${warehouseId}|${productKey(cropId, grade)}`;
}

function addTo(map: Map<string, number>, key: string, grams: number): void {
  map.set(key, (map.get(key) ?? 0) + grams);
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

// ─── Permissions ─────────────────────────────────────────────────────────────

/**
 * The docs/rbac.json codes the stock sources need. The counts, adjustments
 * and transfers are gated through availability.ts (isAreaAvailable), which
 * already names their codes. Hiding is display only; the server authorises
 * every read again (root CLAUDE.md 2.1).
 */
export const MAIN_INVENTORY_CODES = {
  /** GET /admin/batches (BR-16, BR-24, BR-30). */
  batches: 'inventory.batch.view',
  /** GET /admin/allocations (BR-12, BR-100). */
  allocations: 'allocation.dashboard.view',
  /** GET /admin/alerts (BR-77). */
  lowStock: 'alert.own.view',
  /** GET /admin/stock-ledger: own warehouse (Sub) ... */
  ledgerOwn: 'inventory.stock_ledger.view_own',
  /** ... or every warehouse (Main). */
  ledgerAll: 'inventory.stock_ledger.view_all',
  /** The Create Transfer quick action. */
  transferInitiate: 'transfer.inter_warehouse.initiate',
} as const;

/** Which sources the caller may read; a source it may not read is neither fetched nor drawn. */
export interface MainInventoryAccess {
  stock: boolean;
  allocations: boolean;
  lowStock: boolean;
  /** Stock counts (BR-107): inventory.stock_verification.perform. */
  verifications: boolean;
  /** Stock adjustments (BR-37): inventory.stock_adjustment.create, the code the list read checks. */
  adjustments: boolean;
  /** Inter-warehouse transfers (BR-102): transfer.inter_warehouse.view. */
  transfers: boolean;
  transferInitiate: boolean;
  ledger: boolean;
}

export function mainInventoryAccess(can: PermissionCheck): MainInventoryAccess {
  return {
    stock: can(MAIN_INVENTORY_CODES.batches),
    allocations: can(MAIN_INVENTORY_CODES.allocations),
    lowStock: can(MAIN_INVENTORY_CODES.lowStock),
    verifications: isAreaAvailable('stockCounts', can),
    adjustments: isAreaAvailable('stockAdjustments', can),
    transfers: isAreaAvailable('interWarehouseTransfers', can),
    transferInitiate: can(MAIN_INVENTORY_CODES.transferInitiate),
    ledger: can(MAIN_INVENTORY_CODES.ledgerOwn) || can(MAIN_INVENTORY_CODES.ledgerAll),
  };
}

// ─── Card figures ────────────────────────────────────────────────────────────

/** Total Stock: what is on hand, the ledger-derived qtyAvailableKg of every ACTIVE batch. */
export function deriveTotalStockGrams(batches: readonly BatchDto[]): Derived<number> {
  return attempt(() =>
    batches.filter(isActiveBatch).reduce((sum, b) => sum + gramsOf(b.qtyAvailableKg, 'qtyAvailableKg'), 0),
  );
}

/**
 * Available Stock (BR-100): the server's effective availability of each
 * allocation row (`availableQtyKg`, already capped by its batch's unclaimed
 * shelf), summed per pooled line and capped by that line's shelf.
 *
 * Why the cap: the server caps each channel ROW, so adding the four channels
 * of one line can count the same kilograms up to four times (after a DIRECT
 * sale leaves 0.5 kg, every channel reports 0.5 kg). The cap is the line's
 * on-hand stock minus what customer carts already hold; pending UPI holds are
 * not visible to the app, so the server's per-row figure stays the authority
 * below that cap.
 *
 * null (not 0) when a row carries no availableQtyKg: the figure is unknown.
 */
export function deriveAvailableStockGrams(
  batches: readonly BatchDto[],
  allocations: readonly AllocationDto[],
): Derived<number | null> {
  return attempt(() => {
    const onHand = new Map<string, number>();
    for (const b of batches) {
      if (!isActiveBatch(b)) continue;
      addTo(onHand, stockLineKey(b.warehouseId, b.cropId, b.grade), gramsOf(b.qtyAvailableKg, 'qtyAvailableKg'));
    }
    const claimed = new Map<string, number>();
    const inCarts = new Map<string, number>();
    let unknown = false;
    for (const row of allocations) {
      const key = stockLineKey(row.warehouseId, row.cropId, row.grade);
      addTo(inCarts, key, optionalGramsOf(row.reservedQtyKg, 'reservedQtyKg'));
      if (row.availableQtyKg === undefined || row.availableQtyKg === null) {
        unknown = true;
        continue;
      }
      addTo(claimed, key, gramsOf(row.availableQtyKg, 'availableQtyKg'));
    }
    if (unknown) return null;
    let total = 0;
    for (const [key, grams] of claimed) {
      const shelfFree = Math.max(0, (onHand.get(key) ?? 0) - (inCarts.get(key) ?? 0));
      total += Math.min(grams, shelfFree);
    }
    return total;
  });
}

/** Allocated Stock: allocatedQtyKg over every allocation row (BR-12), as the Main dashboard always summed it. */
export function deriveAllocatedStockGrams(allocations: readonly AllocationDto[]): Derived<number> {
  return deriveAllocatedGrams(allocations);
}

/** Reserved Stock: the stored quantity customer carts hold (allocation reservedQtyKg, BR-22). */
export function deriveReservedStockGrams(allocations: readonly AllocationDto[]): Derived<number> {
  return attempt(() => allocations.reduce((sum, row) => sum + optionalGramsOf(row.reservedQtyKg, 'reservedQtyKg'), 0));
}

/**
 * Low Stock Items: the LOW_STOCK alerts the server raised. The threshold lives
 * in system_config on the server, so the app never decides "low" itself. Each
 * item is counted once by its itemKey.
 */
export function countLowStockItems(alerts: readonly AlertItemDto[]): number {
  return new Set(alerts.filter((a) => a.type === 'LOW_STOCK').map((a) => a.itemKey)).size;
}

/**
 * The status a stock count waits in until its variance is handed to the
 * adjustment workflow (BR-107). A count matching the system figure is stored
 * RECONCILED at once, so RECORDED means "counted, not yet reconciled".
 *
 * DISPUTED is a legal stored status, but no route writes it (BR-107 rule 4).
 * It is never counted here, in either figure: if the API ever returns one it
 * is ignored rather than reported as a business number.
 */
const VERIFICATION_PENDING_STATUS: StockVerificationDto['status'] = 'RECORDED';

/** Verification Pending: a count recorded but not yet reconciled. */
export function isVerificationPending(v: StockVerificationDto): boolean {
  return v.status === VERIFICATION_PENDING_STATUS;
}

/**
 * Variance Detected / Stock Exception: a count whose variance is not zero and
 * that is not RECONCILED (DISPUTED ignored, see above). Compared in grams, so
 * "-0.001" is a variance and "0.000" / "-0.000" are not. Throws on a pending
 * count whose variance is not a Quantity, so the figure fails instead of
 * undercounting.
 */
export function hasOpenVariance(v: StockVerificationDto): boolean {
  if (!isVerificationPending(v)) return false;
  return gramsOf(v.varianceKg, 'varianceKg') !== 0;
}

export interface VerificationCounts {
  pending: number;
  variance: number;
}

export function deriveVerificationCounts(rows: readonly StockVerificationDto[]): Derived<VerificationCounts> {
  return attempt(() => ({
    pending: rows.filter(isVerificationPending).length,
    variance: rows.filter(hasOpenVariance).length,
  }));
}

/** A server list `total` (Pending Adjustments, transfers awaiting receipt): a whole count, or a data error. */
export function deriveServerTotal(total: unknown): Derived<number> {
  return attempt(() => {
    if (!isCount(total)) throw new InventoryDataError('total is not a count');
    return total;
  });
}

// ─── Reading every page of a number-paged list ───────────────────────────────

export interface CollectedOffsetPages<T> {
  items: T[];
  /** False only when `maxPages` ran out with rows still on the server. */
  complete: boolean;
}

/**
 * Reads pages 1, 2, ... until the server's `total` is reached or a page comes
 * back empty. `maxPages` is a guard on one dashboard load, not a business
 * limit; when it trips the result says `complete: false` and the screen says
 * the figure may be partial. A failed page rejects the whole read.
 */
export async function collectOffsetPages<T>(
  fetchPage: (page: number) => Promise<OffsetPage<T>>,
  maxPages: number,
): Promise<CollectedOffsetPages<T>> {
  const items: T[] = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const result = await fetchPage(page);
    items.push(...result.items);
    if (result.items.length === 0 || items.length >= result.total) return { items, complete: true };
  }
  return { items, complete: false };
}

// ─── The 8 cards ─────────────────────────────────────────────────────────────

/** A count, and whether it is all of them ("12+" when the read stopped early). */
export interface CountFigure {
  count: number;
  exact: boolean;
}

/** "12", or "12+" when the read stopped before the end. */
export function countLabelOf(figure: CountFigure): string {
  return countLabel(figure.count, figure.exact);
}

export interface MainInventoryFigures {
  totalStockGrams: number;
  /** null: a row carried no availableQtyKg, so the figure is unknown. */
  availableStockGrams: number | null;
  allocatedStockGrams: number;
  reservedStockGrams: number;
  lowStockItems: CountFigure;
  verificationPending: CountFigure;
  varianceDetected: CountFigure;
  pendingAdjustments: number;
  /** IN_TRANSIT transfers into the covered warehouses (Pending Actions only). */
  transfersAwaitingReceipt: number;
}

/** Zero figures for sources that have not loaded: never drawn, a status gate stands in front of each. */
export const EMPTY_MAIN_INVENTORY_FIGURES: MainInventoryFigures = {
  totalStockGrams: 0,
  availableStockGrams: 0,
  allocatedStockGrams: 0,
  reservedStockGrams: 0,
  lowStockItems: { count: 0, exact: true },
  verificationPending: { count: 0, exact: true },
  varianceDetected: { count: 0, exact: true },
  pendingAdjustments: 0,
  transfersAwaitingReceipt: 0,
};

/** Where a card or row leads; the host shell maps each to its own navigation. */
export type MainInventoryTarget =
  | 'stockList'
  | 'allocation'
  | 'lowStock'
  | 'verification'
  | 'varianceReview'
  | 'adjustments'
  | 'ledger'
  | 'transferReceiving'
  | 'createTransfer';

/** The cards in the design's order (2 columns x 4 rows). */
export const MAIN_INVENTORY_CARD_ORDER = [
  'totalStock',
  'availableStock',
  'allocatedStock',
  'reservedStock',
  'lowStockItems',
  'verificationPending',
  'varianceDetected',
  'pendingAdjustments',
] as const;

export type MainInventoryCardKey = (typeof MAIN_INVENTORY_CARD_ORDER)[number];

interface CardSpec {
  title: TranslationKey;
  subtitle: TranslationKey;
  target: MainInventoryTarget;
  visible: (access: MainInventoryAccess) => boolean;
  value: (figures: MainInventoryFigures) => string;
  /** True when the figure asks for attention (drawn in the danger tone). */
  attention?: (figures: MainInventoryFigures) => boolean;
}

const CARD_SPECS: Record<MainInventoryCardKey, CardSpec> = {
  totalStock: {
    title: 'mainDashboard.inventory.card.totalStock.title',
    subtitle: 'mainDashboard.inventory.card.totalStock.sub',
    target: 'stockList',
    visible: (a) => a.stock,
    value: (f) => formatKg(f.totalStockGrams),
  },
  availableStock: {
    title: 'mainDashboard.inventory.card.availableStock.title',
    subtitle: 'mainDashboard.inventory.card.availableStock.sub',
    target: 'stockList',
    // Needs both: the allocation availability and the shelf that caps it.
    visible: (a) => a.stock && a.allocations,
    value: (f) => (f.availableStockGrams === null ? FIGURE_PLACEHOLDER : formatKg(f.availableStockGrams)),
  },
  allocatedStock: {
    title: 'mainDashboard.inventory.card.allocatedStock.title',
    subtitle: 'mainDashboard.inventory.card.allocatedStock.sub',
    target: 'allocation',
    visible: (a) => a.allocations,
    value: (f) => formatKg(f.allocatedStockGrams),
  },
  reservedStock: {
    title: 'mainDashboard.inventory.card.reservedStock.title',
    subtitle: 'mainDashboard.inventory.card.reservedStock.sub',
    target: 'allocation',
    visible: (a) => a.allocations,
    value: (f) => formatKg(f.reservedStockGrams),
  },
  lowStockItems: {
    title: 'mainDashboard.inventory.card.lowStockItems.title',
    subtitle: 'mainDashboard.inventory.card.lowStockItems.sub',
    target: 'lowStock',
    visible: (a) => a.lowStock,
    value: (f) => countLabelOf(f.lowStockItems),
    attention: (f) => f.lowStockItems.count > 0,
  },
  verificationPending: {
    title: 'mainDashboard.inventory.card.verificationPending.title',
    subtitle: 'mainDashboard.inventory.card.verificationPending.sub',
    target: 'verification',
    visible: (a) => a.verifications,
    value: (f) => countLabelOf(f.verificationPending),
  },
  varianceDetected: {
    title: 'mainDashboard.inventory.card.varianceDetected.title',
    subtitle: 'mainDashboard.inventory.card.varianceDetected.sub',
    target: 'varianceReview',
    visible: (a) => a.verifications,
    value: (f) => countLabelOf(f.varianceDetected),
    attention: (f) => f.varianceDetected.count > 0,
  },
  pendingAdjustments: {
    title: 'mainDashboard.inventory.card.pendingAdjustments.title',
    subtitle: 'mainDashboard.inventory.card.pendingAdjustments.sub',
    target: 'adjustments',
    visible: (a) => a.adjustments,
    value: (f) => String(f.pendingAdjustments),
  },
};

export interface MainInventoryCard {
  key: MainInventoryCardKey;
  title: string;
  subtitle: string;
  /** The figure once its sources are ready, FIGURE_PLACEHOLDER before that. */
  value: string;
  status: SectionStatus;
  tone: 'default' | 'danger';
  target: MainInventoryTarget;
}

/**
 * The cards the caller may see, in order. A card whose permission is missing
 * is left out (never drawn as 0); a card whose source is loading or failed
 * shows the placeholder.
 */
export function buildMainInventoryCards(
  access: MainInventoryAccess,
  statuses: Readonly<Record<MainInventoryCardKey, SectionStatus>>,
  figures: MainInventoryFigures,
): MainInventoryCard[] {
  return MAIN_INVENTORY_CARD_ORDER.filter((key) => CARD_SPECS[key].visible(access)).map((key) => {
    const spec = CARD_SPECS[key];
    const status = statuses[key];
    return {
      key,
      title: t(spec.title),
      subtitle: t(spec.subtitle),
      value: figureOrPlaceholder(status, () => spec.value(figures)),
      status,
      tone: status === 'ready' && spec.attention?.(figures) === true ? 'danger' : 'default',
      target: spec.target,
    };
  });
}

// ─── Sections ────────────────────────────────────────────────────────────────

/** A warehouse the overview can list: the live uuid and the name the server has. */
export interface MainInventoryWarehouse {
  warehouseId: string;
  name: string;
}

export interface WarehouseOverviewRow {
  warehouseId: string;
  /** Short name ("Ooty"). */
  name: string;
  stockGrams: number;
  stockText: string;
}

/**
 * Warehouse Overview: on-hand ACTIVE stock per warehouse. A listed warehouse
 * with no batches is a real 0 g. With a warehouse picked only that row stays;
 * a pick that names no listed warehouse leaves none (never the whole network).
 */
export function buildWarehouseOverview(
  batches: readonly BatchDto[],
  warehouses: readonly MainInventoryWarehouse[],
  selectedWarehouseId: string | undefined,
): Derived<WarehouseOverviewRow[]> {
  return attempt(() => {
    const byWarehouse = new Map<string, number>();
    for (const b of batches) {
      if (isActiveBatch(b)) addTo(byWarehouse, b.warehouseId, gramsOf(b.qtyAvailableKg, 'qtyAvailableKg'));
    }
    return warehouses
      .filter((w) => selectedWarehouseId === undefined || w.warehouseId === selectedWarehouseId)
      .map((w) => {
        const stockGrams = byWarehouse.get(w.warehouseId) ?? 0;
        return { warehouseId: w.warehouseId, name: warehouseShortName(w.name), stockGrams, stockText: formatKg(stockGrams) };
      });
  });
}

export interface InventoryHealth {
  /** Stocked lines (warehouse, crop, grade) the server has not flagged low. */
  normal: number;
  /** LOW_STOCK items, as on the Low Stock Items card. */
  low: number;
}

function stringParam(alert: AlertItemDto, key: string): string | undefined {
  const value = alert.params[key];
  return typeof value === 'string' ? value : undefined;
}

/**
 * Inventory Health over pooled stock lines (BR-24). "Low" is only what the
 * server flagged (its threshold is system_config); "normal" is every line with
 * stock on hand that it did not flag. The design's "Critical" bucket has no
 * server definition or threshold, so it is not computed.
 */
export function buildInventoryHealth(batches: readonly BatchDto[], alerts: readonly AlertItemDto[]): Derived<InventoryHealth> {
  return attempt(() => {
    const flagged = new Set<string>();
    for (const a of alerts) {
      if (a.type !== 'LOW_STOCK') continue;
      const cropId = stringParam(a, 'cropId');
      const grade = stringParam(a, 'grade');
      if (cropId !== undefined && grade !== undefined) flagged.add(stockLineKey(a.warehouseId, cropId, grade));
    }
    const stocked = new Map<string, number>();
    for (const b of batches) {
      if (isActiveBatch(b)) addTo(stocked, stockLineKey(b.warehouseId, b.cropId, b.grade), gramsOf(b.qtyAvailableKg, 'qtyAvailableKg'));
    }
    let normal = 0;
    for (const [key, grams] of stocked) if (grams > 0 && !flagged.has(key)) normal += 1;
    return { normal, low: countLowStockItems(alerts) };
  });
}

export interface RecentMovementRow {
  id: string;
  /** The movement type ("Receipt"). */
  title: string;
  /** "Ooty · Tomato · Grade 1 · BATCH-2026-000128", or just the warehouse when the batch is not loaded. */
  subtitle: string;
  /** "+100 kg" / "-2.5 kg". */
  qty: string;
  /** IST date and time. */
  time: string;
  direction: MovementDirection;
}

/**
 * The newest ledger rows as the server ordered them (newest first), at most
 * `limit`. The batch code and product come from the loaded batches; the farmer
 * on a batch is never read (BR-16).
 */
export function toRecentMovements(
  entries: readonly StockLedgerEntryDto[],
  batches: readonly BatchDto[],
  warehouses: readonly MainInventoryWarehouse[],
  now: Date,
  limit: number,
): RecentMovementRow[] {
  const batchRows = new Map(batches.map((b) => [b.id, toBatchRow(b)]));
  const names = new Map(warehouses.map((w) => [w.warehouseId, warehouseShortName(w.name)]));
  return entries.slice(0, limit).map((dto) => {
    const row = toStockMovementRow(dto, now, batchRows);
    const warehouse = names.get(dto.warehouseId) ?? t('mainDashboard.warehouse.unknown');
    const subtitle =
      row.batchCode !== undefined && row.productLabel !== undefined
        ? t('mainDashboard.inventory.movement.subWithBatch', { warehouse, product: row.productLabel, batch: row.batchCode })
        : t('mainDashboard.inventory.movement.sub', { warehouse });
    return { id: row.id, title: row.typeLabel, subtitle, qty: row.deltaText, time: row.performedAt, direction: row.direction };
  });
}

export type PendingActionKey = 'verification' | 'adjustment' | 'transferReceiving' | 'stockException';

export interface PendingActionRow {
  key: PendingActionKey;
  label: string;
  value: string;
  status: SectionStatus;
  target: MainInventoryTarget;
}

/** The statuses of the three queues Pending Actions reads. */
export interface PendingActionStatuses {
  verifications: SectionStatus;
  adjustments: SectionStatus;
  transfers: SectionStatus;
}

/**
 * Pending Actions in the design order. A queue the caller cannot read is left
 * out; one still loading shows the placeholder.
 */
export function buildPendingActions(
  access: MainInventoryAccess,
  statuses: PendingActionStatuses,
  figures: MainInventoryFigures,
): PendingActionRow[] {
  const all: {
    key: PendingActionKey;
    label: TranslationKey;
    allowed: boolean;
    status: SectionStatus;
    value: () => string;
    target: MainInventoryTarget;
  }[] = [
    {
      key: 'verification',
      label: 'mainDashboard.inventory.pending.verification',
      allowed: access.verifications,
      status: statuses.verifications,
      value: () => countLabelOf(figures.verificationPending),
      target: 'verification',
    },
    {
      key: 'adjustment',
      label: 'mainDashboard.inventory.pending.adjustment',
      allowed: access.adjustments,
      status: statuses.adjustments,
      value: () => String(figures.pendingAdjustments),
      target: 'adjustments',
    },
    {
      key: 'transferReceiving',
      label: 'mainDashboard.inventory.pending.transferReceiving',
      allowed: access.transfers,
      status: statuses.transfers,
      value: () => String(figures.transfersAwaitingReceipt),
      target: 'transferReceiving',
    },
    {
      key: 'stockException',
      label: 'mainDashboard.inventory.pending.stockException',
      allowed: access.verifications,
      status: statuses.verifications,
      value: () => countLabelOf(figures.varianceDetected),
      target: 'varianceReview',
    },
  ];
  return all
    .filter((row) => row.allowed)
    .map((row) => ({
      key: row.key,
      label: t(row.label),
      value: figureOrPlaceholder(row.status, row.value),
      status: row.status,
      target: row.target,
    }));
}

export type QuickActionKey = 'consolidated' | 'verification' | 'allocation' | 'lowStock' | 'createTransfer';

export interface QuickAction {
  key: QuickActionKey;
  label: string;
  target: MainInventoryTarget;
}

/**
 * The quick actions the caller holds the code for. No delivery dispatch
 * (BR-21) and no material handling (dropped 2026-10-14): neither is offered.
 */
export function buildQuickActions(access: MainInventoryAccess): QuickAction[] {
  const all: { key: QuickActionKey; label: TranslationKey; target: MainInventoryTarget; allowed: boolean }[] = [
    { key: 'consolidated', label: 'mainDashboard.inventory.quick.consolidated', target: 'stockList', allowed: access.stock },
    { key: 'verification', label: 'mainDashboard.inventory.quick.verification', target: 'verification', allowed: access.verifications },
    { key: 'allocation', label: 'mainDashboard.inventory.quick.allocation', target: 'allocation', allowed: access.allocations },
    { key: 'lowStock', label: 'mainDashboard.inventory.quick.lowStock', target: 'lowStock', allowed: access.lowStock },
    { key: 'createTransfer', label: 'mainDashboard.inventory.quick.createTransfer', target: 'createTransfer', allowed: access.transferInitiate },
  ];
  return all.filter((a) => a.allowed).map(({ key, label, target }) => ({ key, label: t(label), target }));
}
