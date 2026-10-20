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
import type { AlertItemDto } from '../../api/alerts';
import type { OrderSummaryDto } from '../../api/orders';
import type { GoodsReceiptDto } from '../../api/receiving';
import type { TaskItemDto, TaskSummaryDto, TaskType } from '../../api/tasks';
import type { WarehouseTransferDto } from '../../api/warehouseTransfers';
import type { Page } from '../../../../shell/api/pagination';
import type { SalesDashboardSummaryDto } from '../../api/sales';
import type { WarehouseDto } from '../../api/warehouses';
import { parseKgToGrams } from '../../money/quantity';
import { formatPaise } from '../../money/paise';
import { toBatchRow } from '../warehouse/inventory/mappers';
import { hasKey, t, type TranslationKey } from '../../i18n';
import { formatAdminDate, formatAdminDay, isOnIstDay, istDay, istHour, relativeTime } from '../../utils/datetime';
import { cropNamesOf, toLowStockRow } from '../warehouse/inventory/mappers';
import type { WarehouseScope } from '../warehouse/finance-expenses/types';
import { toApprovalAlertItem } from '../warehouse/notifications/mappers';
import { queryViewState } from '../warehouse/shared/queryViewState';
import type { PerformanceTotals } from '../warehouse/dashboard-home-more/mappers_dashboardKpis';

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
  /** cropId + grade: one row per product and grade (Grade 1 and Grade 2 are different stock). */
  key: string;
  cropId: string;
  /** The product name ("Carrot"). */
  product: string;
  /** The grade code ("GRADE_1"). */
  grade: string;
  /** "Carrot · Grade 1", what a card and a search match. */
  label: string;
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
    const productByKey = new Map<string, { cropId: string; product: string; grade: string; label: string; byWarehouse: Map<string, number> }>();
    let totalGrams = 0;
    let reservedGrams = 0;

    for (const dto of batches) {
      const row = toBatchRow(dto);
      if (row.status !== 'active') continue;
      const available = requiredGrams(dto.qtyAvailableKg, 'qtyAvailableKg');
      reservedGrams += optionalGrams(dto.qtyReservedKg, 'qtyReservedKg');
      totalGrams += available;
      stockByWarehouse.set(dto.warehouseId, (stockByWarehouse.get(dto.warehouseId) ?? 0) + available);
      const productKey = `${dto.cropId}|${dto.grade}`;
      let product = productByKey.get(productKey);
      if (product === undefined) {
        product = {
          cropId: dto.cropId,
          product: row.productName,
          grade: dto.grade,
          label: t('inventory.product.label', { product: row.productName, grade: row.gradeLabel }),
          byWarehouse: new Map(),
        };
        productByKey.set(productKey, product);
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


    const unknown = t('mainDashboard.warehouse.unknown');
    const products: ProductStockRow[] = [...productByKey.entries()].map(([key, { cropId, product, grade, label, byWarehouse }]) => {
      const productRows = [...byWarehouse.entries()].map(([warehouseId, grams]) => ({
        warehouseId,
        warehouse: names.get(warehouseId) ?? unknown,
        grams,
      }));
      return { key, cropId, product, grade, label, rows: productRows, totalGrams: productRows.reduce((sum, r) => sum + r.grams, 0) };
    });

    return {
      totalGrams,
      reservedGrams,
      warehouses: rows,
      capacity: capacityOfRows(rows),
      products,
    };
  });
}

/** The network capacity over `rows`: only the warehouses that have one count (BR-66b: never clamped). */
function capacityOfRows(rows: readonly WarehouseStockRow[]): StockFigures['capacity'] {
  const measured = rows.filter((r) => r.capacityGrams !== null);
  const capacityGrams = measured.length === 0 ? null : measured.reduce((sum, r) => sum + (r.capacityGrams ?? 0), 0);
  const usedGrams = measured.reduce((sum, r) => sum + r.stockGrams, 0);
  return {
    capacityGrams,
    usedGrams,
    availableGrams: capacityGrams === null ? null : capacityGrams - usedGrams,
    utilizationBp: capacityGrams === null || capacityGrams === 0 ? null : basisPoints(usedGrams, capacityGrams),
    warehousesWithCapacity: measured.length,
  };
}

/**
 * The stock figures for the header filter. The batches are already filtered by
 * the API, but the warehouse list is not, so without this every other
 * warehouse would be drawn as a false "0 kg" and the capacity would be measured
 * against the whole network. A filter that names no listed warehouse leaves no
 * rows (never silently the whole network). The batch totals are kept as read.
 */
export function scopeStockFigures(figures: StockFigures, warehouseId: string | undefined): StockFigures {
  if (warehouseId === undefined) return figures;
  const rows = figures.warehouses.filter((w) => w.warehouseId === warehouseId);
  return { ...figures, warehouses: rows, capacity: capacityOfRows(rows) };
}

/** Products whose "Product · Grade" label contains the search text, case-insensitively; empty text keeps all. */
export function filterStockProducts(products: readonly ProductStockRow[], query: string): ProductStockRow[] {
  const q = query.trim().toLowerCase();
  return q === '' ? [...products] : products.filter((p) => p.label.toLowerCase().includes(q));
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

// ─── Reading every page of a list ────────────────────────────────────────────

/** The API's largest `limit` for the cursor-paged lists the dashboard reads. */
export const DASHBOARD_PAGE_LIMIT = 100;
/**
 * Pages read per list before giving up: a technical bound on one dashboard
 * load (10 x 100 rows), not a business threshold. Hitting it makes the result
 * `complete: false`, which the screen says out loud.
 */
export const DASHBOARD_MAX_PAGES = 10;

export interface CollectedPages<T> {
  items: T[];
  /** False only when `maxPages` ran out with more pages still on the server. */
  complete: boolean;
}

export interface CollectPagesOptions<T> {
  maxPages?: number | undefined;
  /** Called with each page's rows; true ends the read as complete (e.g. a newest-first list has reached yesterday). */
  isDone?: ((pageItems: readonly T[]) => boolean) | undefined;
}

/**
 * Follows `page.nextCursor` until the last page, the cap, or `isDone`. A failed
 * page rejects the whole read: a partial list is never returned as if whole.
 */
export async function collectPages<T>(
  fetchPage: (cursor: string | undefined) => Promise<Page<T>>,
  options: CollectPagesOptions<T> = {},
): Promise<CollectedPages<T>> {
  const maxPages = options.maxPages ?? DASHBOARD_MAX_PAGES;
  const items: T[] = [];
  let cursor: string | undefined;
  for (let n = 0; n < maxPages; n += 1) {
    const page = await fetchPage(cursor);
    items.push(...page.items);
    if (options.isDone?.(page.items) === true || !page.page.hasMore || page.page.nextCursor === null) {
      return { items, complete: true };
    }
    cursor = page.page.nextCursor;
  }
  return { items, complete: false };
}

// ─── Today ───────────────────────────────────────────────────────────────────

/** Goods receipts received on the IST calendar day `day` ("YYYY-MM-DD"). */
export function receiptsOnDay(receipts: readonly GoodsReceiptDto[], day: string): GoodsReceiptDto[] {
  return receipts.filter((g) => isOnIstDay(g.receivedAt, day));
}

export interface OrdersToday {
  /** The orders placed on the day. */
  orders: OrderSummaryDto[];
  count: number;
  /**
   * True when the count is the whole day: the list was read to its end, or it
   * reached an order from another day (the queue is newest first, so nothing
   * placed today follows). False means more may exist: show "N+".
   */
  exact: boolean;
}

/**
 * GET /admin/orders has no placed-date filter (`deliveryDate` is the pickup or
 * delivery date, not when the order was placed), so "today's orders" is read
 * from `placedAt` of the newest-first list.
 */
export function countOrdersPlacedOn(orders: readonly OrderSummaryDto[], day: string, listComplete: boolean): OrdersToday {
  const today = orders.filter((o) => isOnIstDay(o.placedAt, day));
  const reachedAnotherDay = orders.some((o) => !isOnIstDay(o.placedAt, day));
  return { orders: today, count: today.length, exact: listComplete || reachedAnotherDay };
}

/** A count as text: "12", or "12+" when more may exist beyond what was read. */
export function countLabel(count: number, exact: boolean): string {
  return `${count}${exact ? '' : '+'}`;
}

/** The greeting for the IST hour: morning before 12:00, afternoon before 17:00, evening after. */
export function greetingKey(now: Date): TranslationKey {
  const hour = istHour(now);
  if (hour < 12) return 'mainDashboard.greeting.morning';
  if (hour < 17) return 'mainDashboard.greeting.afternoon';
  return 'mainDashboard.greeting.evening';
}

/** Open tasks of one type, exact from GET /admin/tasks/summary (the spec zero-fills, so absent means none). */
export function openTaskCount(summary: TaskSummaryDto, type: TaskType): number {
  return summary.byType[type] ?? 0;
}

// ─── Alerts (the spec carries no priority, read state or resolved state) ─────

/** Which dashboard view an alert type belongs to. */
export type AlertTarget = 'lowStock' | 'capacity' | 'inventory' | 'operations';

export interface DashboardAlert {
  /** The alert itemKey, passed back verbatim to dismiss it. */
  id: string;
  type: AlertItemDto['type'];
  /** The type's title from the catalogue. */
  title: string;
  warehouseId: string;
  /** Short warehouse name, or "Unknown warehouse". */
  warehouse: string;
  /** Relative time since the condition began ('' for a point-in-time alert). */
  time: string;
  /** The server's message key worded through the catalogue, with formatted kg. */
  detail: string;
  target: AlertTarget;
  /** True for an alert the caller snoozed (GET /admin/alerts?state=snoozed). */
  snoozed: boolean;
  /** When the snooze ends, as IST text; null for an active alert. */
  snoozedUntil: string | null;
}

function alertTargetOf(type: string): AlertTarget {
  if (type === 'LOW_STOCK') return 'lowStock';
  if (type === 'CAPACITY_NEAR_FULL') return 'capacity';
  if (type === 'BATCH_NEAR_EXPIRY') return 'inventory';
  return 'operations';
}

function warehouseLabel(warehouses: readonly WarehouseDto[], id: string): string {
  const w = warehouses.find((row) => row.id === id);
  return w === undefined ? t('mainDashboard.warehouse.unknown') : warehouseShortName(w.name);
}

/**
 * Alerts as dashboard rows. Titles and wording reuse the Notifications alert
 * mapper; nothing here ranks them: docs/openapi.yaml AlertItem has a type, not
 * a priority, so no Critical / High / Medium is invented.
 */
export function toDashboardAlerts(
  alerts: readonly AlertItemDto[],
  warehouses: readonly WarehouseDto[],
  now: Date,
): DashboardAlert[] {
  return alerts.map((dto) => {
    const row = toApprovalAlertItem(dto, now);
    return {
      id: dto.itemKey,
      type: dto.type,
      title: row.title,
      warehouseId: dto.warehouseId,
      warehouse: warehouseLabel(warehouses, dto.warehouseId),
      time: row.timestamp,
      detail: row.detail,
      target: alertTargetOf(dto.type),
      snoozed: dto.state === 'SNOOZED',
      snoozedUntil: dto.snoozedUntil === null ? null : formatAdminDate(dto.snoozedUntil, now),
    };
  });
}

/** The alert types the type filter offers, in the order the chips show them (docs/openapi.yaml AlertType). */
export const ALERT_TYPE_FILTERS = ['all', 'LOW_STOCK', 'BATCH_NEAR_EXPIRY', 'CAPACITY_NEAR_FULL'] as const;
export type AlertTypeFilter = (typeof ALERT_TYPE_FILTERS)[number];

/** How many alerts each chip holds: `all` is the whole list, a type with none is a real 0. */
export function countDashboardAlerts(alerts: readonly DashboardAlert[]): Record<AlertTypeFilter, number> {
  const counts: Record<AlertTypeFilter, number> = { all: alerts.length, LOW_STOCK: 0, BATCH_NEAR_EXPIRY: 0, CAPACITY_NEAR_FULL: 0 };
  for (const alert of alerts) {
    if (alert.type === 'LOW_STOCK' || alert.type === 'BATCH_NEAR_EXPIRY' || alert.type === 'CAPACITY_NEAR_FULL') counts[alert.type] += 1;
  }
  return counts;
}

/** The alerts of one type, or all of them. A type the app does not know shows under `all` only. */
export function filterDashboardAlerts(alerts: readonly DashboardAlert[], filter: AlertTypeFilter): DashboardAlert[] {
  return filter === 'all' ? [...alerts] : alerts.filter((alert) => alert.type === filter);
}

export interface LowStockItem {
  id: string;
  /** "Carrot · Grade 1", named from the batches; a neutral label when no batch names the crop. */
  product: string;
  warehouse: string;
  /** The alert's totalQtyKg as "20 kg". */
  current: string;
  /** The alert's thresholdKg as "50 kg". */
  target: string;
}

/** LOW_STOCK alerts as rows, with the product name joined from the batches (cropId) and the figures the server sent. */
export function toLowStockItems(
  alerts: readonly AlertItemDto[],
  batches: readonly BatchDto[],
  warehouses: readonly WarehouseDto[],
): LowStockItem[] {
  const cropNames = cropNamesOf(batches.map(toBatchRow));
  return alerts
    .filter((a) => a.type === 'LOW_STOCK')
    .map((alert) => {
      const row = toLowStockRow(alert, cropNames);
      return {
        id: row.id,
        product: row.name,
        warehouse: warehouseLabel(warehouses, alert.warehouseId),
        current: row.available,
        target: row.threshold,
      };
    });
}

// ─── Recent activity ─────────────────────────────────────────────────────────

export interface ActivityRow {
  id: string;
  title: string;
  /** Short warehouse name. */
  subtitle: string;
  /** Relative time. */
  time: string;
}

/**
 * Open tasks as activity rows. The server sends a translation key
 * (`task.<type>.title`); it is worded through the catalogue and a task whose
 * key the app has no string for is left out, never shown as a raw key.
 */
export function toRecentActivity(
  tasks: readonly TaskItemDto[],
  warehouses: readonly WarehouseDto[],
  now: Date,
  limit = 2,
): ActivityRow[] {
  return tasks
    .filter((task) => task.titleKey.startsWith('task.') && hasKey(task.titleKey))
    .slice(0, limit)
    .map((task) => ({
      id: task.itemKey,
      title: t(task.titleKey as TranslationKey),
      subtitle: warehouseLabel(warehouses, task.warehouseId),
      time: relativeTime(task.createdAt, now),
    }));
}

// ─── Transfers (GET /warehouse-transfers, BR-102) ────────────────────────────

export type TransferKind = 'pendingApproval' | 'inTransit' | 'received' | 'cancelled' | 'unknown';

/**
 * Every status docs/openapi.yaml WarehouseTransferSummary declares, with its
 * label. Typed as a record over the API's status union, so adding a status to
 * the spec type fails the build here until it is mapped.
 */
const TRANSFER_STATUS: Record<WarehouseTransferDto['status'], { kind: Exclude<TransferKind, 'unknown'>; label: TranslationKey }> = {
  PENDING_APPROVAL: { kind: 'pendingApproval', label: 'mainDashboard.transfer.status.pendingApproval' },
  IN_TRANSIT: { kind: 'inTransit', label: 'mainDashboard.transfer.status.inTransit' },
  RECEIVED: { kind: 'received', label: 'mainDashboard.transfer.status.received' },
  CANCELLED: { kind: 'cancelled', label: 'mainDashboard.transfer.status.cancelled' },
};

function knownTransferStatus(status: string): status is WarehouseTransferDto['status'] {
  return Object.prototype.hasOwnProperty.call(TRANSFER_STATUS, status);
}

/** A server status as a kind; one the app does not know is 'unknown', never guessed as pending. */
export function transferStatusKind(status: string): TransferKind {
  return knownTransferStatus(status) ? TRANSFER_STATUS[status].kind : 'unknown';
}

export interface TransferRow {
  /** The transfer number ("TRF-000001"). */
  id: string;
  /** "Ooty \u2192 Coonoor". */
  route: string;
  kind: TransferKind;
  statusLabel: string;
  /** "Created 18 Oct 2026 \u00b7 \u20b912,000.50"; the value is left out when a line had no cost. */
  details: string;
  hasDiscrepancy: boolean;
}

export interface TransferCounts {
  pendingApproval: number;
  inTransit: number;
  received: number;
  cancelled: number;
  unknown: number;
  /** Received short. */
  discrepancies: number;
  /** Not yet received: pending approval plus in transit. */
  open: number;
  /** False when the page held fewer transfers than the server reported. */
  exact: boolean;
}

export interface TransferFigures {
  counts: TransferCounts;
  rows: TransferRow[];
}

/**
 * The transfer list as counts and rows. `total` is the server's count of every
 * transfer, so a page that holds fewer says its counts are not exact. Money
 * goes through integer paise; a malformed value fails the derivation.
 */
export function deriveTransfers(
  transfers: readonly WarehouseTransferDto[],
  total: number,
  warehouses: readonly WarehouseDto[],
): Derived<TransferFigures> {
  return attempt(() => {
    const counts: TransferCounts = {
      pendingApproval: 0,
      inTransit: 0,
      received: 0,
      cancelled: 0,
      unknown: 0,
      discrepancies: 0,
      open: 0,
      exact: transfers.length >= total,
    };
    const rows = transfers.map((tr): TransferRow => {
      const kind = transferStatusKind(tr.status);
      counts[kind] += 1;
      if (tr.hasDiscrepancy) counts.discrepancies += 1;
      const date = formatAdminDay(tr.createdAt);
      const details = tr.hasUnvaluedLines
        ? t('mainDashboard.transfer.details', { date })
        : t('mainDashboard.transfer.detailsWithValue', { date, value: formatPaise(toPaise(parseMoney(tr.totalValue))) });
      return {
        id: tr.transferNumber,
        route: t('mainDashboard.transfer.route', {
          from: warehouseLabel(warehouses, tr.fromWarehouseId),
          to: warehouseLabel(warehouses, tr.toWarehouseId),
        }),
        kind,
        statusLabel: t(knownTransferStatus(tr.status) ? TRANSFER_STATUS[tr.status].label : 'mainDashboard.transfer.status.unknown'),
        details,
        hasDiscrepancy: tr.hasDiscrepancy,
      };
    });
    counts.open = counts.pendingApproval + counts.inTransit;
    return { counts, rows };
  });
}

export const EMPTY_TRANSFER_FIGURES: TransferFigures = {
  counts: { pendingApproval: 0, inTransit: 0, received: 0, cancelled: 0, unknown: 0, discrepancies: 0, open: 0, exact: true },
  rows: [],
};

// ─── Warehouse selection ─────────────────────────────────────────────────────

/**
 * The live warehouses as selector options: the server uuid as `warehouseId`
 * (what live-backed flows send to the API, BR-30), with its name and code.
 */
export function toWarehouseOptions(warehouses: readonly WarehouseDto[]): WarehouseScope[] {
  return warehouses.map((w) => ({ warehouseId: w.id, warehouseName: w.name, warehouseCode: w.code }));
}

/**
 * The live warehouse a name belongs to, as the storage screens hand names back
 * ("Ooty Warehouse" or "Ooty"): the exact name first, then the exact short
 * name, then a prefix of the short name.
 */
export function findWarehouseByName(warehouses: readonly WarehouseDto[], name: string): WarehouseDto | undefined {
  const key = warehouseShortName(name).trim().toLowerCase();
  if (key === '') return undefined;
  const exactShort = warehouses.find((w) => warehouseShortName(w.name).toLowerCase() === key);
  if (exactShort !== undefined) return exactShort;
  return warehouses.find((w) => warehouseShortName(w.name).toLowerCase().startsWith(key));
}

// ─── Permission gating ───────────────────────────────────────────────────────

/**
 * The docs/rbac.json codes the optional dashboard sources read (each exists
 * there; the server authorises every read again, root CLAUDE.md 2.1). A source
 * whose code is not held is not fetched and not drawn, so a role without it
 * sees no tile instead of a tile that answers 403.
 */
export const MAIN_DASHBOARD_CODES = {
  /** GET /admin/sales/summary (BR-96). */
  sales: 'sales.dashboard.view',
  /** GET /warehouse-transfers (BR-102). */
  transfers: 'transfer.inter_warehouse.view',
  /** GET /warehouses/{id}/issues (BR-103). */
  issues: 'warehouse.issue.view',
  /** GET /warehouses/{id}/activity (BR-104). */
  activity: 'warehouse.activity.view',
  /** GET /admin/stock-adjustments, approved from the queue (BR-37). */
  adjustments: 'inventory.stock_adjustment.approve',
  /** The Initiate Stock Transfer button. */
  transferInitiate: 'transfer.inter_warehouse.initiate',
} as const;

export type DashboardAccess = { [K in keyof typeof MAIN_DASHBOARD_CODES]: boolean };

/** Which optional dashboard sources and actions the signed-in admin holds the code for. */
export function dashboardAccess(can: (code: string) => boolean): DashboardAccess {
  return {
    sales: can(MAIN_DASHBOARD_CODES.sales),
    transfers: can(MAIN_DASHBOARD_CODES.transfers),
    issues: can(MAIN_DASHBOARD_CODES.issues),
    activity: can(MAIN_DASHBOARD_CODES.activity),
    adjustments: can(MAIN_DASHBOARD_CODES.adjustments),
    transferInitiate: can(MAIN_DASHBOARD_CODES.transferInitiate),
  };
}

// ─── Open issues (BR-103) and the paid-sales count ───────────────────────────

/** The warehouses a filter covers: every listed one, or the picked one. A filter naming none that is listed covers nothing. */
export function coveredWarehouseIds(warehouses: readonly WarehouseDto[], selectedId: string | undefined): string[] {
  if (selectedId === undefined) return warehouses.map((w) => w.id);
  return warehouses.some((w) => w.id === selectedId) ? [selectedId] : [];
}

export interface OpenIssueFigures {
  /** Open plus in-progress issues over the covered warehouses. */
  total: number;
  byWarehouse: Record<string, number>;
}

/** Zero figures for an issue count that has not loaded: never drawn, a gate or figureOrPlaceholder stands in front of it. */
export const EMPTY_ISSUE_FIGURES: OpenIssueFigures = { total: 0, byWarehouse: {} };

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

/**
 * GET /warehouses/{id}/issues totals over the covered warehouses. A covered
 * warehouse with no count, or one that is not a whole number, fails the
 * figure: a smaller total is never shown as the real one.
 */
export function deriveOpenIssues(counts: Readonly<Record<string, unknown>>, warehouseIds: readonly string[]): Derived<OpenIssueFigures> {
  return attempt(() => {
    const byWarehouse: Record<string, number> = {};
    let total = 0;
    for (const id of warehouseIds) {
      const count = counts[id];
      if (!isCount(count)) throw new DashboardDataError(`issue count of ${id} is not a count`);
      byWarehouse[id] = count;
      total += count;
    }
    return { total, byWarehouse };
  });
}

/** The number of paid sales behind today's revenue; a missing or fractional count is a data error, never 0. */
export function deriveSalesCount(summary: Pick<SalesDashboardSummaryDto, 'count'>): Derived<number> {
  return attempt(() => {
    const count: unknown = summary.count;
    if (!isCount(count)) throw new DashboardDataError('sales count is not a count');
    return count;
  });
}

// ─── Performance (GET /warehouses/{id}/performance, BR-80) ───────────────────

/** The IST month so far as the inclusive `{ from, to }` range the performance and sales reads take. */
export function monthToDateRange(now: Date): { from: string; to: string } {
  const day = istDay(now);
  return { from: `${day.slice(0, 8)}01`, to: day };
}

/** The server's exact counts for a range, summed over the covered warehouses; weights as integer grams. */
export interface MainPerformance {
  goodsReceipts: number;
  grossGrams: number;
  acceptedGrams: number;
  rejectedGrams: number;
  ordersPlaced: number;
  ordersFulfilled: number;
  ordersCancelled: number;
  returnsRequested: number;
}

export const EMPTY_PERFORMANCE: MainPerformance = {
  goodsReceipts: 0,
  grossGrams: 0,
  acceptedGrams: 0,
  rejectedGrams: 0,
  ordersPlaced: 0,
  ordersFulfilled: 0,
  ordersCancelled: 0,
  returnsRequested: 0,
};

/**
 * The summed performance as figures. A quantity the sum could not read (null
 * grams) or a count that is not a whole number fails the figure, so the screen
 * draws the error state a failed request gets and never "0 kg".
 */
export function derivePerformance(totals: PerformanceTotals): Derived<MainPerformance> {
  return attempt(() => {
    const grams = (value: number | null, what: string): number => {
      if (value === null || !Number.isInteger(value)) throw new DashboardDataError(`${what} is not a quantity`);
      return value;
    };
    const count = (value: number, what: string): number => {
      if (!isCount(value)) throw new DashboardDataError(`${what} is not a count`);
      return value;
    };
    return {
      goodsReceipts: count(totals.goodsReceipts, 'goodsReceipts'),
      grossGrams: grams(totals.grossGrams, 'grossGrams'),
      acceptedGrams: grams(totals.acceptedGrams, 'acceptedGrams'),
      rejectedGrams: grams(totals.rejectedGrams, 'rejectedGrams'),
      ordersPlaced: count(totals.ordersPlaced, 'ordersPlaced'),
      ordersFulfilled: count(totals.ordersFulfilled, 'ordersFulfilled'),
      ordersCancelled: count(totals.ordersCancelled, 'ordersCancelled'),
      returnsRequested: count(totals.returnsRequested, 'returnsRequested'),
    };
  });
}
