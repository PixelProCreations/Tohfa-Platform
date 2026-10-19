/**
 * The Main Warehouse dashboard's data derivation, as pure functions (no React,
 * no react-native import) so plain-Node vitest covers every figure it shows
 * (tests/mappers_mainDashboard.test.ts). The screen only passes query results
 * in and draws what comes out.
 *
 * Rule for every figure here: a number is drawn only from data the server has
 * actually returned. While a source query is loading or has failed the screen
 * shows FIGURE_PLACEHOLDER or an error with Retry (sectionStatus below), never
 * a zero, "All Warehouses Normal" or "No alerts" that the server did not say.
 */
import { parseMoney, toPaise } from '@tohfa/shared-types';
import type { BatchDto } from '../../api/inventory';
import type { GoodsReceiptDto } from '../../api/receiving';
import type { SalesDashboardSummaryDto } from '../../api/sales';
import type { WarehouseDto } from '../../api/warehouses';
import { parseKgToGrams } from '../../money/quantity';
import { formatPaise } from '../../money/paise';
import { toBatchRow } from '../warehouse/inventory/mappers';
import { t } from '../../i18n';
import { queryViewState } from '../warehouse/shared/queryViewState';

// ─── View states ─────────────────────────────────────────────────────────────

/** What a dashboard section draws: its data is not here yet, it failed, or it is here. */
export type SectionStatus = 'loading' | 'error' | 'ready';

/** The slice of a TanStack query result `sectionStatus` reads. */
export interface QueryLike {
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  data: unknown;
}

/**
 * Built on the shared queryViewState so the dashboard behaves like every other
 * live screen. `data` being defined is the "item on screen" (an empty list is
 * still data: it is a real, successful "none"). A Retry running after an error
 * counts as loading, and a failed refresh never blanks data already shown.
 */
export function sectionStatus(query: QueryLike): SectionStatus {
  const view = queryViewState({
    isLoading: query.isLoading || (query.isFetching && query.data === undefined),
    error: query.error,
    itemCount: query.data === undefined ? 0 : 1,
  });
  if (view === 'ready') return 'ready';
  if (view === 'error') return 'error';
  // 'loading', or 'empty' with no data at all (a query that has not started): not ready.
  return 'loading';
}

/**
 * The status of a section fed by several queries: ready only when all are. An
 * error wins over loading, so one failed source is not hidden behind a slow one.
 */
export function combineSources(statuses: readonly SectionStatus[]): SectionStatus {
  if (statuses.includes('error')) return 'error';
  if (statuses.includes('loading')) return 'loading';
  return 'ready';
}

/** Shown in place of a figure whose source is not ready (an em dash, not a word). */
export const FIGURE_PLACEHOLDER = '—';

/** `format()` once `status` is ready, FIGURE_PLACEHOLDER before that (format is not called). */
export function figureOrPlaceholder(status: SectionStatus, format: () => string): string {
  return status === 'ready' ? format() : FIGURE_PLACEHOLDER;
}

// ─── Derived figures that can fail ───────────────────────────────────────────

/**
 * A derivation either yields its value or fails as a whole. A figure built
 * from a malformed server value (a quantity that is not a Quantity, a revenue
 * that is not Money) is never shown as a default 0: the screen turns a failed
 * derivation into the same error state a failed request gets.
 */
export type Derived<T> = { ok: true; value: T } | { ok: false };

class DashboardDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DashboardDataError';
  }
}

export function attempt<T>(derive: () => T): Derived<T> {
  try {
    return { ok: true, value: derive() };
  } catch {
    return { ok: false };
  }
}

// ─── Stock and capacity (integer grams, BR-66b) ──────────────────────────────

/** "Ooty Warehouse" -> "Ooty": the short name the cards show. */
export function warehouseShortName(name: string): string {
  return name.replace(/ Warehouse$/, '');
}

/** Grams of a required kg string; throws on anything that is not a Quantity. */
function requiredGrams(value: string | null | undefined, what: string): number {
  const grams = typeof value === 'string' ? parseKgToGrams(value) : null;
  if (grams === null) throw new DashboardDataError(`${what} is not a Quantity`);
  return grams;
}

/** Grams of an optional kg string: absent is 0, present but unreadable throws. */
function optionalGrams(value: string | null | undefined, what: string): number {
  return value === undefined || value === null ? 0 : requiredGrams(value, what);
}

/** Basis points (1/100 of a percent) of `part` in `whole`, rounded to the nearest. */
function basisPoints(part: number, whole: number): number {
  return Math.round((part / whole) * 10000);
}

/**
 * "41.67%" from basis points, built from integers (BR-66b: two decimals, and
 * above 100 when over capacity: it is never clamped).
 */
export function formatUtilization(bp: number): string {
  const sign = bp < 0 ? '-' : '';
  const abs = Math.abs(bp);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}%`;
}

/**
 * How full a warehouse looks on a card. Display only (colour of the bar and
 * pill); no rule depends on it, and system_config has no key for these two
 * cut-offs, so they are named here rather than buried in the screen.
 */
export const UTILIZATION_WARN_BP = 7500;
export const UTILIZATION_DANGER_BP = 9000;

export type CapacityLevel = 'none' | 'ok' | 'warn' | 'danger';

export function capacityLevel(bp: number | null): CapacityLevel {
  if (bp === null) return 'none';
  if (bp >= UTILIZATION_DANGER_BP) return 'danger';
  if (bp >= UTILIZATION_WARN_BP) return 'warn';
  return 'ok';
}

/** Width in percent of a progress bar. Only the BAR is clamped to its track; the figure beside it never is (BR-66b). */
export function barWidthPercent(bp: number | null): number {
  if (bp === null) return 0;
  return Math.min(100, Math.max(0, Math.round(bp / 100)));
}

export interface WarehouseStockRow {
  warehouseId: string;
  /** Short name ("Ooty"). */
  name: string;
  /** The name as the server has it ("Ooty Warehouse"). */
  fullName: string;
  /** The server's warehouse code. */
  code: string;
  stockGrams: number;
  /** null while no capacity is set. */
  capacityGrams: number | null;
  /** capacity - stock: negative when over capacity (BR-66b: never clamped); null without a capacity. */
  availableGrams: number | null;
  /** stock / capacity in basis points: above 10000 when over capacity; null without a capacity. */
  utilizationBp: number | null;
}

export interface ProductStockRow {
  cropId: string;
  product: string;
  rows: { warehouseId: string; warehouse: string; grams: number }[];
  totalGrams: number;
}

export interface StockFigures {
  /** Active stock over every batch the server returned. */
  totalGrams: number;
  reservedGrams: number;
  warehouses: WarehouseStockRow[];
  /** Over the warehouses that have a capacity set only; the rest cannot be measured against one. */
  capacity: {
    capacityGrams: number | null;
    usedGrams: number;
    availableGrams: number | null;
    utilizationBp: number | null;
    warehousesWithCapacity: number;
  };
  products: ProductStockRow[];
}

/**
 * Every stock figure the dashboard shows, from the batches and warehouses the
 * API returned. Weights are summed as integer grams (money/quantity.ts) and
 * only formatted at the edge. Only ACTIVE batches count, as BR-66b derives
 * capacity use. Capacity is not clamped (BR-66b, docs/openapi.yaml
 * WarehouseCapacity).
 */
export function deriveStockFigures(
  batches: readonly BatchDto[],
  warehouses: readonly WarehouseDto[],
): Derived<StockFigures> {
  return attempt(() => {
    const names = new Map(warehouses.map((w) => [w.id, warehouseShortName(w.name)]));
    const stockByWarehouse = new Map<string, number>();
    const productByCrop = new Map<string, { product: string; byWarehouse: Map<string, number> }>();
    let totalGrams = 0;
    let reservedGrams = 0;

    for (const dto of batches) {
      const row = toBatchRow(dto);
      if (row.status !== 'active') continue;
      const available = requiredGrams(dto.qtyAvailableKg, 'qtyAvailableKg');
      reservedGrams += optionalGrams(dto.qtyReservedKg, 'qtyReservedKg');
      totalGrams += available;
      stockByWarehouse.set(dto.warehouseId, (stockByWarehouse.get(dto.warehouseId) ?? 0) + available);
      let product = productByCrop.get(dto.cropId);
      if (product === undefined) {
        product = { product: row.productName, byWarehouse: new Map() };
        productByCrop.set(dto.cropId, product);
      }
      product.byWarehouse.set(dto.warehouseId, (product.byWarehouse.get(dto.warehouseId) ?? 0) + available);
    }

    const rows: WarehouseStockRow[] = warehouses.map((w) => {
      const stockGrams = stockByWarehouse.get(w.id) ?? 0;
      const hasCapacity = w.capacityKg !== undefined && w.capacityKg !== null;
      const capacityGrams = hasCapacity ? requiredGrams(w.capacityKg, 'capacityKg') : null;
      return {
        warehouseId: w.id,
        name: warehouseShortName(w.name),
        fullName: w.name,
        code: w.code,
        stockGrams,
        capacityGrams,
        availableGrams: capacityGrams === null ? null : capacityGrams - stockGrams,
        utilizationBp: capacityGrams === null || capacityGrams === 0 ? null : basisPoints(stockGrams, capacityGrams),
      };
    });

    const measured = rows.filter((r) => r.capacityGrams !== null);
    const capacityGrams = measured.length === 0 ? null : measured.reduce((sum, r) => sum + (r.capacityGrams ?? 0), 0);
    const usedGrams = measured.reduce((sum, r) => sum + r.stockGrams, 0);

    const unknown = t('mainDashboard.warehouse.unknown');
    const products: ProductStockRow[] = [...productByCrop.entries()].map(([cropId, { product, byWarehouse }]) => {
      const productRows = [...byWarehouse.entries()].map(([warehouseId, grams]) => ({
        warehouseId,
        warehouse: names.get(warehouseId) ?? unknown,
        grams,
      }));
      return { cropId, product, rows: productRows, totalGrams: productRows.reduce((sum, r) => sum + r.grams, 0) };
    });

    return {
      totalGrams,
      reservedGrams,
      warehouses: rows,
      capacity: {
        capacityGrams,
        usedGrams,
        availableGrams: capacityGrams === null ? null : capacityGrams - usedGrams,
        utilizationBp: capacityGrams === null || capacityGrams === 0 ? null : basisPoints(usedGrams, capacityGrams),
        warehousesWithCapacity: measured.length,
      },
      products,
    };
  });
}

// ─── Sales (integer paise) ───────────────────────────────────────────────────

/**
 * Today's sales revenue as rupees text, through integer paise (root CLAUDE.md
 * 2.2). A missing or malformed revenue is a failed derivation, not "Rs 0".
 */
export function salesRevenueText(summary: Pick<SalesDashboardSummaryDto, 'revenue'>): Derived<string> {
  return attempt(() => {
    const revenue: unknown = summary.revenue;
    if (typeof revenue !== 'string' || revenue === '') throw new DashboardDataError('revenue is not Money');
    return formatPaise(toPaise(parseMoney(revenue)));
  });
}

// ─── Goods receipts ──────────────────────────────────────────────────────────

export interface ReceiptFigures {
  /** Sum of acceptedQtyKg, in grams. */
  acceptedGrams: number;
  /** status AWAITING_QC. */
  awaitingQc: number;
  /** status ACCEPTED or PARTIALLY_ACCEPTED. */
  arrived: number;
  /** status REJECTED, or any rejected weight. */
  discrepancies: number;
  /** Any rejected weight (compared in grams, so 0.001 kg counts and 0.000 kg does not). */
  damaged: number;
  /** status REJECTED. */
  rejected: number;
}

/** The figures the operations card, performance and incoming tiles read, over `receipts`. */
export function deriveReceiptFigures(receipts: readonly GoodsReceiptDto[]): Derived<ReceiptFigures> {
  return attempt(() => {
    const f: ReceiptFigures = { acceptedGrams: 0, awaitingQc: 0, arrived: 0, discrepancies: 0, damaged: 0, rejected: 0 };
    for (const g of receipts) {
      f.acceptedGrams += optionalGrams(g.acceptedQtyKg, 'acceptedQtyKg');
      const hasRejectedWeight = optionalGrams(g.rejectedQtyKg, 'rejectedQtyKg') > 0;
      if (g.status === 'AWAITING_QC') f.awaitingQc += 1;
      if (g.status === 'ACCEPTED' || g.status === 'PARTIALLY_ACCEPTED') f.arrived += 1;
      if (g.status === 'REJECTED') f.rejected += 1;
      if (g.status === 'REJECTED' || hasRejectedWeight) f.discrepancies += 1;
      if (hasRejectedWeight) f.damaged += 1;
    }
    return f;
  });
}

/** Zero figures for a section that has not loaded: never drawn, because a SectionGate or figureOrPlaceholder stands in front of it. */
export const EMPTY_STOCK_FIGURES: StockFigures = {
  totalGrams: 0,
  reservedGrams: 0,
  warehouses: [],
  capacity: { capacityGrams: null, usedGrams: 0, availableGrams: null, utilizationBp: null, warehousesWithCapacity: 0 },
  products: [],
};

export const EMPTY_RECEIPT_FIGURES: ReceiptFigures = {
  acceptedGrams: 0,
  awaitingQc: 0,
  arrived: 0,
  discrepancies: 0,
  damaged: 0,
  rejected: 0,
};
