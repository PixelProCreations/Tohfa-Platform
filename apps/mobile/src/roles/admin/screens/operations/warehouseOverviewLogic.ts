/**
 * Pure decisions behind the Tohfa Admin Inventory & Warehouse overview
 * (M10-S01, ./WarehouseOverviewScreen). No React, no react-native, so
 * plain-Node vitest covers every branch (tests/warehouse_overview_logic.test.ts).
 *
 * Why the dash and not 0: a figure the server did not send is unknown, and a
 * 0 would read as "nothing pending". The backend has no source yet for batch
 * counts, products per warehouse, pending (QC) receipts per warehouse, open
 * discrepancies per warehouse, or a per-warehouse "updated at"; those always
 * render the dash until an endpoint exists.
 *
 * Quantities are summed as integer grams (money/quantity.ts), never floats.
 */
import type { InventoryOverviewDto } from '../../api/inventoryOverview';
import type { WarehouseCapacityDto, WarehouseDto } from '../../api/warehouses';
import { formatKg, parseKgToGrams } from '../../money/quantity';
import type { Can } from '../../permissions/can';
import { t } from '../../i18n';

/** The rbac codes this screen gates on (docs/rbac.json). */
export const OPS_OVERVIEW_CODES = {
  /** The whole screen: GET /warehouses. */
  screen: 'warehouse.all.view',
  /** GET /warehouses/{id}/capacity. */
  capacity: 'warehouse.own.view',
  /** GET /admin/inventory/overview (BR-116). */
  overview: 'inventory.batch.view',
  /** Stock ledger opens with either code. */
  stockLedger: ['inventory.stock_ledger.view_all', 'inventory.batch.view'],
  /** The KPI cards that open stock verification (design: Pending Verification, Stock Discrepancies). */
  verification: 'inventory.batch.view',
  /** GET /warehouse-transfers (BR-102). */
  transfers: 'transfer.inter_warehouse.view',
} as const;

/** One figure source: loaded, loading, failed, or not fetched (no permission). */
export type Fetched<T> = { status: 'ok'; data: T } | { status: 'loading' } | { status: 'failed' } | { status: 'off' };

export function canViewWarehouseOverview(can: Can | undefined): boolean {
  return typeof can === 'function' && can(OPS_OVERVIEW_CODES.screen);
}

export interface QuickLinkCallbacks {
  onOpenStockLedger?: ((warehouseId?: string) => void) | undefined;
  onOpenStockVerification?: ((warehouseId?: string) => void) | undefined;
  onOpenTransfers?: (() => void) | undefined;
}

export interface QuickLinkAccess {
  stockLedger: boolean;
  verification: boolean;
  transfers: boolean;
}

/**
 * A tile or KPI-card press is live only when the host passed its callback AND the
 * caller holds its code. `verification` has no tile (the design has exactly two);
 * it only drives the Pending Verification and Stock Discrepancies cards.
 */
export function quickLinkAccess(can: Can | undefined, cbs: QuickLinkCallbacks): QuickLinkAccess {
  const has = (code: string) => typeof can === 'function' && can(code);
  return {
    stockLedger: cbs.onOpenStockLedger !== undefined && OPS_OVERVIEW_CODES.stockLedger.some(has),
    verification: cbs.onOpenStockVerification !== undefined && has(OPS_OVERVIEW_CODES.verification),
    transfers: cbs.onOpenTransfers !== undefined && has(OPS_OVERVIEW_CODES.transfers),
  };
}

// ─── Formatting ──────────────────────────────────────────────────────────────

function dash(): string {
  return t('warehouseOverview.figure.none');
}

function isCount(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n >= 0;
}

/** Two digits like the design ("05"); the dash for anything not a count. */
function countText(n: number | null | undefined): string {
  return isCount(n) ? String(n).padStart(2, '0') : dash();
}

/** A plain count for the card lines. */
function plainCount(n: number | null | undefined): string {
  return isCount(n) ? String(n) : dash();
}

function kgText(qty: string | null | undefined): string {
  if (qty === null || qty === undefined) return dash();
  const grams = parseKgToGrams(qty);
  return grams === null ? dash() : formatKg(grams);
}

/** The text for one sourced figure in its fetch state. */
function fetchedText<T>(src: Fetched<T>, pick: (data: T) => string): string {
  if (src.status === 'ok') return pick(src.data);
  if (src.status === 'loading') return t('warehouseOverview.figure.loading');
  return dash();
}

// ─── KPI cards ───────────────────────────────────────────────────────────────

export interface KpiFigures {
  totalAvailable: string;
  /** No backend source for a batch count: always the dash. */
  batches: string;
  lowStock: string;
  pendingVerification: string;
  inTransit: string;
  discrepancies: string;
}

/** Sum of every warehouse's free shelf in grams; null when any row is unreadable. */
function totalAvailableGrams(overview: InventoryOverviewDto): number | null {
  let sum = 0;
  for (const row of overview.warehouses) {
    const grams = parseKgToGrams(row.availableQtyKg);
    if (grams === null) return null;
    sum += grams;
  }
  return sum;
}

export function kpiFigures(overview: Fetched<InventoryOverviewDto>, inTransit: Fetched<number>): KpiFigures {
  return {
    totalAvailable: fetchedText(overview, (o) => {
      const grams = totalAvailableGrams(o);
      return grams === null ? dash() : formatKg(grams);
    }),
    batches: dash(),
    lowStock: fetchedText(overview, (o) => countText(o.lowStockCount)),
    pendingVerification: fetchedText(overview, (o) => countText(o.unreconciledVerificationCount)),
    inTransit: fetchedText(inTransit, (n) => countText(n)),
    discrepancies: fetchedText(overview, (o) => countText(o.varianceUnreconciledVerificationCount)),
  };
}

// ─── Warehouse comparison rows ───────────────────────────────────────────────

export interface WarehouseRowView {
  id: string;
  name: string;
  code: string;
  title: string;
  active: boolean;
  statusLabel: string;
  capacityFailed: boolean;
  capacity: string;
  utilization: string;
  products: string;
  batches: string;
  available: string;
  pendingReceipts: string;
  transfers: string;
  discrepancies: string;
  updated: string;
  line1: string;
  line2: string;
  line3: string;
}

function capacityParts(src: Fetched<WarehouseCapacityDto> | undefined): { capacity: string; utilization: string } {
  if (src === undefined || src.status !== 'ok') {
    const text = src?.status === 'loading' ? t('warehouseOverview.figure.loading') : dash();
    return { capacity: text, utilization: text };
  }
  const pct = src.data.utilizationPercent;
  return {
    capacity: kgText(src.data.capacityKg),
    utilization: typeof pct === 'number' ? t('warehouseOverview.card.percent', { value: String(pct) }) : dash(),
  };
}

export function buildWarehouseRows(
  warehouses: readonly WarehouseDto[],
  overview: Fetched<InventoryOverviewDto>,
  capacityById: Readonly<Record<string, Fetched<WarehouseCapacityDto>>>,
  openTransfersById: Readonly<Record<string, Fetched<number>>>,
): WarehouseRowView[] {
  const sorted = [...warehouses].sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    if (a.type !== b.type) return a.type === 'MAIN' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return sorted.map((w) => {
    const cap = capacityById[w.id];
    const capacityFailed = cap?.status === 'failed';
    const { capacity, utilization } = capacityParts(cap);
    const available = fetchedText(overview, (o) => kgText(o.warehouses.find((r) => r.warehouseId === w.id)?.availableQtyKg));
    const transferSrc = openTransfersById[w.id];
    const transfers = transferSrc === undefined ? dash() : fetchedText(transferSrc, plainCount);
    const products = dash();
    const batches = dash();
    const pendingReceipts = dash();
    const discrepancies = dash();
    const updated = dash();
    const line1 = capacityFailed
      ? t('warehouseOverview.card.line1Failed', { products, batches })
      : t('warehouseOverview.card.line1', { capacity, utilization, products, batches });
    return {
      id: w.id,
      name: w.name,
      code: w.code,
      title: t('warehouseOverview.card.title', { name: w.name, code: w.code }),
      active: w.isActive,
      statusLabel: t(w.isActive ? 'warehouseOverview.status.active' : 'warehouseOverview.status.inactive'),
      capacityFailed,
      capacity,
      utilization,
      products,
      batches,
      available,
      pendingReceipts,
      transfers,
      discrepancies,
      updated,
      line1,
      line2: t('warehouseOverview.card.line2', { available, pendingReceipts, transfers }),
      line3: t('warehouseOverview.card.line3', { discrepancies, updated }),
    };
  });
}

// ─── Search and filter ───────────────────────────────────────────────────────

export interface FilterOption {
  /** null = All Warehouses. */
  id: string | null;
  label: string;
}

/** All Warehouses, then one option per API row (no hard-coded warehouse). */
export function filterOptions(rows: readonly WarehouseRowView[]): FilterOption[] {
  return [{ id: null, label: t('warehouseOverview.filter.all') }, ...rows.map((r) => ({ id: r.id, label: r.title }))];
}

export function filterRows(rows: readonly WarehouseRowView[], query: string, selectedId: string | null): WarehouseRowView[] {
  const q = query.trim().toLowerCase();
  return rows.filter((r) => {
    if (selectedId !== null && r.id !== selectedId) return false;
    if (q === '') return true;
    return r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q);
  });
}
