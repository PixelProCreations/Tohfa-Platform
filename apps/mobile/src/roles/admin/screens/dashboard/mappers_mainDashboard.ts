/**
 * The Main Warehouse dashboard's data derivation (D01 Home, D02 Warehouse
 * Overview, D04 Stock & Transfer, D05 Alerts & Action Center), as pure
 * functions (no React, no react-native) so plain-Node vitest covers every
 * figure it shows (tests/mappers_mainDashboard.test.ts). The screens only pass
 * query results in and draw what comes out. Ported from the Dev lineage's
 * mappers_mainDashboard.ts (PR #139) and cut to the figures this branch's
 * approved layout shows.
 *
 * Rule for every figure here: a number is drawn only from data the server has
 * actually returned. While a source query is loading or has failed the screen
 * shows FIGURE_PLACEHOLDER or an error with Retry, never a zero the server did
 * not say. A malformed server value fails its derivation (Derived ok: false),
 * which the screen draws as the same error state. Weights are integer grams
 * and money integer paise (root CLAUDE.md 2.2); nothing the API does not carry
 * (alert priority / read state, surplus, stock targets) is invented.
 */
import { parseMoney, toPaise } from '@tohfa/shared-types';
import type { AlertItemDto, AlertType, WorklistParams } from '../../api/alerts';
import type { BatchDto } from '../../api/inventory';
import type { GoodsReceiptDto, PurchaseOrderDto } from '../../api/receiving';
import type { SalesDashboardSummaryDto } from '../../api/sales';
import type { WarehouseActivityEventDto } from '../../api/warehouseActivity';
import type { WarehousePerformanceDto } from '../../api/warehouseOps';
import type { WarehouseTransferDto } from '../../api/warehouseTransfers';
import type { WarehouseCapacityDto, WarehouseDto } from '../../api/warehouses';
import { hasKey, t, type TranslationKey } from '../../i18n';
import { formatPaise } from '../../money/paise';
import { formatKg, formatKgNumber, parseKgToGrams } from '../../money/quantity';
import { formatAdminDate, formatAdminDay, formatAdminTime, istDay, istHour } from '../../utils/datetime';
import { queryViewState } from '../warehouse/shared/queryViewState';
import type { WarehouseScope } from '../warehouse/finance-expenses/types';
import { capacityTone, type CapacityTone, type NearFullSignal } from '../warehouse/warehouse-admin/overviewFigures';

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
 * Built on the shared queryViewState. `data` being defined is the "item on
 * screen" (an empty list is still data: a real, successful "none"). A failed
 * refresh never blanks data already shown; a query that has not started
 * (disabled) is not ready.
 */
export function sectionStatus(query: QueryLike): SectionStatus {
  const view = queryViewState({
    isLoading: query.isLoading || (query.isFetching && query.data === undefined),
    error: query.error,
    itemCount: query.data === undefined ? 0 : 1,
  });
  if (view === 'ready') return 'ready';
  if (view === 'error') return 'error';
  return 'loading';
}

/** Several sources as one: an error wins over loading, so one failed source is not hidden behind a slow one. */
export function combineStatus(statuses: readonly SectionStatus[]): SectionStatus {
  if (statuses.includes('error')) return 'error';
  if (statuses.includes('loading')) return 'loading';
  return 'ready';
}

/** Shown in place of a figure whose source is not ready (an em dash, not a word, not a 0). */
export const FIGURE_PLACEHOLDER = '—';

/** `format()` once `status` is ready, FIGURE_PLACEHOLDER before that (format is not called). */
export function figureOr(status: SectionStatus, format: () => string): string {
  return status === 'ready' ? format() : FIGURE_PLACEHOLDER;
}

/** A count as text: "12", or "12+" when more may exist beyond what was read. */
export function countLabel(count: number, exact: boolean): string {
  return `${count}${exact ? '' : '+'}`;
}

// ─── Derived figures that can fail ───────────────────────────────────────────

export type Derived<T> = { ok: true; value: T } | { ok: false };

class DashboardDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DashboardDataError';
  }
}

function attempt<T>(derive: () => T): Derived<T> {
  try {
    return { ok: true, value: derive() };
  } catch {
    return { ok: false };
  }
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

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

// ─── Warehouses (live uuids, BR-30) ──────────────────────────────────────────

/** "Ooty Warehouse" -> "Ooty": the short name the cards show. */
export function warehouseShortName(name: string): string {
  return name.replace(/ Warehouse$/, '');
}

function warehouseLabel(warehouses: readonly WarehouseDto[], id: string): string {
  const w = warehouses.find((row) => row.id === id);
  return w === undefined ? t('mainDashboard.warehouse.unknown') : warehouseShortName(w.name);
}

/** The live warehouses as selector options: the server uuid (what the API takes), with its name. */
export function toWarehouseOptions(warehouses: readonly WarehouseDto[]): WarehouseScope[] {
  return warehouses.map((w) => ({ warehouseId: w.id, warehouseName: w.name }));
}

/**
 * The live warehouse a display name belongs to ("Ooty Warehouse" or "Ooty"):
 * the exact short name first, then a prefix of it.
 */
export function findWarehouseByName(warehouses: readonly WarehouseDto[], name: string): WarehouseDto | undefined {
  const key = warehouseShortName(name).trim().toLowerCase();
  if (key === '') return undefined;
  const exact = warehouses.find((w) => warehouseShortName(w.name).toLowerCase() === key);
  if (exact !== undefined) return exact;
  return warehouses.find((w) => warehouseShortName(w.name).toLowerCase().startsWith(key));
}

/** The warehouses a filter covers: every listed one, or the picked one. A filter naming none that is listed covers nothing. */
export function coveredWarehouseIds(warehouses: readonly WarehouseDto[], selectedId: string | undefined): string[] {
  if (selectedId === undefined) return warehouses.map((w) => w.id);
  return warehouses.some((w) => w.id === selectedId) ? [selectedId] : [];
}

// ─── Stock and capacity (GET /warehouses/{id}/capacity, BR-66 / BR-66b) ──────

/** 12840000 g -> "12,840": the kg figure of a card whose label already says KG. */
export function formatKgFigure(grams: number): string {
  return formatKgNumber(grams);
}

/** Basis points as a percent with at most two decimals, never clamped (BR-66b): 8200 -> "82%", 4167 -> "41.67%". */
export function formatUtilization(bp: number): string {
  const sign = bp < 0 ? '-' : '';
  const abs = Math.abs(Math.round(bp));
  const fraction = String(abs % 100).padStart(2, '0').replace(/0+$/, '');
  return `${sign}${Math.floor(abs / 100)}${fraction === '' ? '' : `.${fraction}`}%`;
}

/** Width in percent of a progress bar. Only the BAR is clamped to its track; the figure beside it never is. */
export function barWidthPercent(bp: number | null): number {
  if (bp === null) return 0;
  return Math.min(100, Math.max(0, Math.floor(bp / 100)));
}

export interface CapacityRow {
  warehouseId: string;
  /** Short name ("Ooty"). */
  name: string;
  /** Sum of ACTIVE batches' qty_available, as the server computed it. */
  usedGrams: number;
  /** null while no capacity is set. */
  capacityGrams: number | null;
  /** capacity - used, negative when over capacity; null without a capacity. */
  availableGrams: number | null;
  /** The server's utilizationPercent in basis points; null without a capacity. */
  utilizationBp: number | null;
}

export interface CapacityFigures {
  rows: CapacityRow[];
  totalUsedGrams: number;
}

/**
 * One row per warehouse the capacity map covers, in the warehouse list's
 * order. The map holds only the covered warehouses, so a filter never draws
 * the others as a false "0 kg".
 */
export function deriveCapacityRows(
  warehouses: readonly WarehouseDto[],
  capacities: ReadonlyMap<string, WarehouseCapacityDto>,
): Derived<CapacityFigures> {
  return attempt(() => {
    const rows: CapacityRow[] = [];
    for (const w of warehouses) {
      const dto = capacities.get(w.id);
      if (dto === undefined) continue;
      const set = dto.capacityKg !== null;
      const percent = dto.utilizationPercent;
      rows.push({
        warehouseId: w.id,
        name: warehouseShortName(w.name),
        usedGrams: requiredGrams(dto.usedKg, 'usedKg'),
        capacityGrams: set ? requiredGrams(dto.capacityKg, 'capacityKg') : null,
        availableGrams: set ? requiredGrams(dto.availableKg, 'availableKg') : null,
        utilizationBp: set && typeof percent === 'number' && Number.isFinite(percent) ? Math.round(percent * 100) : null,
      });
    }
    return { rows, totalUsedGrams: rows.reduce((sum, r) => sum + r.usedGrams, 0) };
  });
}

export interface OverviewCard {
  warehouseId: string;
  name: string;
  /** "82% capacity"; null while no capacity is set (the badge is hidden, never "0%"). */
  capacityLabel: string | null;
  tone: CapacityTone;
  /** Bar fill in percent, clamped to the track only. */
  barWidth: number;
  /** "3,420 KG" in use. */
  stock: string;
  /** Gross kg received today; null when the caller cannot read receipts (the figure is hidden). */
  receipts: string | null;
  /** Open + in-progress issues; null when the caller cannot read issues. */
  issues: string | null;
}

function kgUpper(grams: number): string {
  return t('mainDashboard.kgUpper', { value: formatKgFigure(grams) });
}

/**
 * The D02 Warehouse Overview cards (and the D01 brief bars) from the capacity
 * rows. The tone is the server's near-full signal (CAPACITY_NEAR_FULL), never
 * a client cut-off (root CLAUDE.md 2.7). A source that is not ready shows the
 * placeholder; a source the caller has no code for is null and not drawn.
 */
export function toOverviewCards(
  rows: readonly CapacityRow[],
  nearFull: NearFullSignal | null,
  receipts: { status: SectionStatus; grams: Readonly<Record<string, number>>; exact: boolean } | null,
  issues: { status: SectionStatus; byWarehouse: Readonly<Record<string, number>> } | null,
): OverviewCard[] {
  return rows.map((row) => ({
    warehouseId: row.warehouseId,
    name: row.name,
    capacityLabel:
      row.utilizationBp === null ? null : t('mainDashboard.overview.capacityBadge', { percent: formatUtilization(row.utilizationBp) }),
    tone: capacityTone(row, nearFull),
    barWidth: barWidthPercent(row.utilizationBp),
    stock: kgUpper(row.usedGrams),
    receipts:
      receipts === null
        ? null
        : figureOr(receipts.status, () => `${kgUpper(receipts.grams[row.warehouseId] ?? 0)}${receipts.exact ? '' : '+'}`),
    issues: issues === null ? null : figureOr(issues.status, () => String(issues.byWarehouse[row.warehouseId] ?? FIGURE_PLACEHOLDER)),
  }));
}

// ─── Today's receiving ───────────────────────────────────────────────────────

export interface ReceiptFigures {
  /** Every receipt recorded today, whatever its QC state. */
  arrived: number;
  /** REJECTED, or any rejected weight. */
  discrepancies: number;
  /** Any rejected weight (compared in grams, so 0.001 kg counts and 0.000 kg does not). */
  damaged: number;
  /** REJECTED. */
  rejected: number;
  /** Gross kg received today per warehouse uuid, in grams (absent = none received). */
  grossGramsByWarehouse: Record<string, number>;
}

/** The Operations card / Warehouse Overview figures over today's goods receipts. */
export function deriveReceiptFigures(receipts: readonly GoodsReceiptDto[]): Derived<ReceiptFigures> {
  return attempt(() => {
    const f: ReceiptFigures = { arrived: 0, discrepancies: 0, damaged: 0, rejected: 0, grossGramsByWarehouse: {} };
    for (const g of receipts) {
      const gross = requiredGrams(g.grossQtyKg, 'grossQtyKg');
      const hasRejectedWeight = optionalGrams(g.rejectedQtyKg, 'rejectedQtyKg') > 0;
      f.arrived += 1;
      if (g.status === 'REJECTED') f.rejected += 1;
      if (g.status === 'REJECTED' || hasRejectedWeight) f.discrepancies += 1;
      if (hasRejectedWeight) f.damaged += 1;
      f.grossGramsByWarehouse[g.warehouseId] = (f.grossGramsByWarehouse[g.warehouseId] ?? 0) + gross;
    }
    return f;
  });
}

/**
 * Goods expected today: open purchase orders (ISSUED or PARTIALLY_RECEIVED)
 * whose expectedDeliveryDate is the IST day. The weight is the ordered
 * quantity: the PO list carries no received quantity, so a partly received
 * order counts in full (spec gap, see the dashboard report).
 */
export function deriveExpectedToday(orders: readonly PurchaseOrderDto[], day: string): Derived<{ count: number; grams: number }> {
  return attempt(() => {
    let count = 0;
    let grams = 0;
    for (const o of orders) {
      if (o.status !== 'ISSUED' && o.status !== 'PARTIALLY_RECEIVED') continue;
      if (o.expectedDeliveryDate !== day) continue;
      count += 1;
      grams += requiredGrams(o.quantityKg, 'quantityKg');
    }
    return { count, grams };
  });
}

// ─── Orders, issues, sales ───────────────────────────────────────────────────

/** Orders placed in the range, summed from each warehouse's exact performance (BR-80). */
export function sumOrdersPlaced(rows: readonly WarehousePerformanceDto[]): Derived<number> {
  return attempt(() =>
    rows.reduce((sum, row) => {
      if (!isCount(row.orders.placed)) throw new DashboardDataError('orders.placed is not a count');
      return sum + row.orders.placed;
    }, 0),
  );
}

export interface OpenIssueFigures {
  total: number;
  byWarehouse: Record<string, number>;
}

/** GET /warehouses/{id}/issues totals over the covered warehouses; a missing count fails the total (BR-103). */
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

/** Today's paid sales revenue as rupee text, through integer paise (BR-96). Malformed is a failure, not "Rs 0". */
export function salesRevenueText(summary: Pick<SalesDashboardSummaryDto, 'revenue'>): Derived<string> {
  return attempt(() => {
    const revenue: unknown = summary.revenue;
    if (typeof revenue !== 'string' || revenue === '') throw new DashboardDataError('revenue is not Money');
    return formatPaise(toPaise(parseMoney(revenue)));
  });
}

// ─── Transfers (GET /warehouse-transfers, BR-102) ────────────────────────────

export type TransferKind = 'pendingApproval' | 'inTransit' | 'received' | 'cancelled';

const TRANSFER_STATUS: Record<WarehouseTransferDto['status'], { kind: TransferKind; label: TranslationKey }> = {
  PENDING_APPROVAL: { kind: 'pendingApproval', label: 'mainDashboard.transfer.status.pendingApproval' },
  IN_TRANSIT: { kind: 'inTransit', label: 'mainDashboard.transfer.status.inTransit' },
  RECEIVED: { kind: 'received', label: 'mainDashboard.transfer.status.received' },
  CANCELLED: { kind: 'cancelled', label: 'mainDashboard.transfer.status.cancelled' },
};

export interface TransferRow {
  /** The transfer number ("TRF-000001"). */
  id: string;
  /** "Coonoor → Ooty". */
  route: string;
  kind: TransferKind | 'unknown';
  statusLabel: string;
  /** "Created 18 Oct 2026 · ₹12,000.50"; the value is left out when a line had no cost. */
  details: string;
}

export interface TransferCounts {
  pendingApproval: number;
  inTransit: number;
  received: number;
  cancelled: number;
  /** Received short (hasDiscrepancy). */
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
 * goes through integer paise; a malformed value fails the derivation. A status
 * the app does not know is counted nowhere, never guessed as pending.
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
      discrepancies: 0,
      open: 0,
      exact: transfers.length >= total,
    };
    const rows = transfers.map((tr): TransferRow => {
      const known = Object.prototype.hasOwnProperty.call(TRANSFER_STATUS, tr.status) ? TRANSFER_STATUS[tr.status] : undefined;
      if (known !== undefined) counts[known.kind] += 1;
      if (tr.hasDiscrepancy) counts.discrepancies += 1;
      const date = formatAdminDay(tr.createdAt);
      return {
        id: tr.transferNumber,
        route: t('mainDashboard.transfer.route', {
          from: warehouseLabel(warehouses, tr.fromWarehouseId),
          to: warehouseLabel(warehouses, tr.toWarehouseId),
        }),
        kind: known?.kind ?? 'unknown',
        statusLabel: t(known?.label ?? 'mainDashboard.transfer.status.unknown'),
        details: tr.hasUnvaluedLines
          ? t('mainDashboard.transfer.details', { date })
          : t('mainDashboard.transfer.detailsWithValue', { date, value: formatPaise(toPaise(parseMoney(tr.totalValue))) }),
      };
    });
    counts.open = counts.pendingApproval + counts.inTransit;
    return { counts, rows };
  });
}

// ─── Alerts (GET /admin/alerts; the spec carries no priority or read state) ──

/** Where "Open Related Record" goes for an alert type. */
export type AlertTarget = 'lowStock' | 'capacity' | 'inventory';

const ALERT_LOOK: Record<AlertType, { title: TranslationKey; target: AlertTarget }> = {
  LOW_STOCK: { title: 'alert.low_stock.title', target: 'lowStock' },
  BATCH_NEAR_EXPIRY: { title: 'alert.batch_near_expiry.title', target: 'inventory' },
  CAPACITY_NEAR_FULL: { title: 'alert.capacity_near_full.title', target: 'capacity' },
};

function alertLook(type: string): { title: TranslationKey; target: AlertTarget } {
  return Object.prototype.hasOwnProperty.call(ALERT_LOOK, type)
    ? ALERT_LOOK[type as AlertType]
    : { title: 'alert.unknown.title', target: 'inventory' };
}

/** One param as display text: `...Kg` quantities as "1,250 kg", `expiryOn` as an IST day; unparseable values as sent. */
function formatParam(key: string, value: WorklistParams[string] | undefined): string {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'string') return String(value);
  if (key.endsWith('Kg')) {
    const grams = parseKgToGrams(value);
    return grams === null ? value : formatKg(grams);
  }
  if (key === 'expiryOn') {
    const day = formatAdminDay(value);
    return day === '' ? value : day;
  }
  return value;
}

function alertMessage(dto: AlertItemDto): string {
  const key = dto.messageKey;
  if (!key.startsWith('alert.') || !hasKey(key)) return t('alert.unknown.message');
  const params: Record<string, string> = {};
  for (const [k, v] of Object.entries(dto.params)) params[k] = formatParam(k, v);
  return t(key, params);
}

export interface DashboardAlert {
  /** The alert itemKey, passed back verbatim to dismiss it. */
  id: string;
  type: string;
  /** The type's title ("Low stock"): the Category field. */
  typeLabel: string;
  /** "Coonoor: Low stock". */
  title: string;
  /** The server's message, with the IST time when the condition has one. */
  subtitle: string;
  /** The server's message key worded through the catalogue, with formatted kg. */
  description: string;
  /** "Today · 08:30 AM"; '' for a point-in-time alert. */
  time: string;
  warehouseId: string;
  /** Short warehouse name, or "Unknown warehouse". */
  warehouse: string;
  target: AlertTarget;
}

/** Alerts as dashboard rows. Nothing here ranks them: AlertItem has a type, not a priority. */
export function toDashboardAlerts(alerts: readonly AlertItemDto[], warehouses: readonly WarehouseDto[], now: Date): DashboardAlert[] {
  return alerts.map((dto) => {
    const look = alertLook(dto.type);
    const typeLabel = t(look.title);
    const warehouse = warehouseLabel(warehouses, dto.warehouseId);
    const description = alertMessage(dto);
    const time = dto.since === null ? '' : formatAdminDate(dto.since, now);
    return {
      id: dto.itemKey,
      type: dto.type,
      typeLabel,
      title: t('mainDashboard.alert.cardTitle', { warehouse, title: typeLabel }),
      subtitle: time === '' ? description : t('mainDashboard.alert.subtitleWithTime', { detail: description, time }),
      description,
      time,
      warehouseId: dto.warehouseId,
      warehouse,
      target: look.target,
    };
  });
}

/** The alert types the category filter offers (docs/openapi.yaml AlertType). */
export const ALERT_TYPE_FILTERS = ['all', 'LOW_STOCK', 'BATCH_NEAR_EXPIRY', 'CAPACITY_NEAR_FULL'] as const;
export type AlertTypeFilter = (typeof ALERT_TYPE_FILTERS)[number];

export function alertFilterLabel(filter: AlertTypeFilter): string {
  return filter === 'all' ? t('mainDashboard.filter.all') : t(alertLook(filter).title);
}

/** The alerts of one warehouse (uuid) and/or one type; undefined / 'all' keep everything. */
export function filterDashboardAlerts(
  alerts: readonly DashboardAlert[],
  filter: { warehouseId: string | undefined; type: AlertTypeFilter },
): DashboardAlert[] {
  return alerts.filter(
    (a) => (filter.warehouseId === undefined || a.warehouseId === filter.warehouseId) && (filter.type === 'all' || a.type === filter.type),
  );
}

export interface LowStockItem {
  id: string;
  /** "Beans · Grade 1", named from the batches; a neutral name when no batch names the crop. */
  product: string;
  warehouse: string;
  /** The alert's totalQtyKg as "90 kg". */
  current: string;
  /** The alert's thresholdKg as "300 kg" (the server's low-stock trigger). */
  target: string;
}

function gradeLabel(grade: unknown): string {
  const key = `inventory.grade.${String(grade)}`;
  return hasKey(key) ? t(key) : t('inventory.grade.unknown');
}

/** LOW_STOCK alerts as rows; the product name is joined from the batches by cropId. */
export function toLowStockItems(
  alerts: readonly AlertItemDto[],
  batches: readonly BatchDto[],
  warehouses: readonly WarehouseDto[],
): LowStockItem[] {
  const cropNames = new Map<string, string>();
  for (const b of batches) if (b.cropName !== undefined && b.cropName !== '') cropNames.set(b.cropId, b.cropName);
  return alerts
    .filter((a) => a.type === 'LOW_STOCK')
    .map((a) => {
      const cropId = a.params.cropId;
      const product = (typeof cropId === 'string' ? cropNames.get(cropId) : undefined) ?? t('mainDashboard.lowStock.unknownProduct');
      return {
        id: a.itemKey,
        product: t('inventory.product.label', { product, grade: gradeLabel(a.params.grade) }),
        warehouse: warehouseLabel(warehouses, a.warehouseId),
        current: formatParam('totalQtyKg', a.params.totalQtyKg),
        target: formatParam('thresholdKg', a.params.thresholdKg),
      };
    });
}

// ─── Recent activity (GET /warehouses/{id}/activity, BR-104) ─────────────────

export interface ActivityRow {
  key: string;
  type: WarehouseActivityEventDto['type'];
  /** "Transfer TRF-000284". */
  title: string;
  typeLabel: string;
  reference: string;
  /** Short warehouse name. */
  warehouse: string;
  /** "10:20 AM" today, else the IST date. */
  time: string;
}

function activityTypeLabel(type: string): string {
  const key = `mainDashboard.activity.type.${type}`;
  return hasKey(key) ? t(key) : t('mainDashboard.activity.type.unknown');
}

/** "10:20 AM" for an event on today's IST day, else "20 Oct 2026" (a bare clock time would read as today). */
function activityTime(iso: string, now: Date): string {
  return istDay(new Date(Date.parse(iso))) === istDay(now) ? formatAdminTime(iso) : formatAdminDay(iso);
}

/**
 * The newest `limit` events over several warehouses' first feed pages, sorted
 * on the UTC instant (fixed-width ISO strings from the server).
 */
export function mergeRecentActivity(
  pages: readonly { warehouseId: string; items: readonly WarehouseActivityEventDto[] }[],
  warehouses: readonly WarehouseDto[],
  now: Date,
  limit: number,
): ActivityRow[] {
  const rows: (ActivityRow & { at: number })[] = [];
  // A transfer is in the feed of both its warehouses: one event, shown once (the first warehouse read keeps it).
  const seen = new Set<string>();
  for (const page of pages) {
    for (const dto of page.items) {
      const eventKey = `${dto.type}:${dto.sourceId}:${dto.occurredAt}`;
      if (seen.has(eventKey)) continue;
      seen.add(eventKey);
      const typeLabel = activityTypeLabel(dto.type);
      const at = Date.parse(dto.occurredAt);
      rows.push({
        // The same transfer appears in both of its warehouses; the warehouse keeps the keys apart.
        key: `${page.warehouseId}:${dto.type}:${dto.sourceId}:${dto.occurredAt}`,
        type: dto.type,
        title: t('mainDashboard.activity.title', { type: typeLabel, reference: dto.reference }),
        typeLabel,
        reference: dto.reference,
        warehouse: warehouseLabel(warehouses, page.warehouseId),
        time: activityTime(dto.occurredAt, now),
        at: Number.isNaN(at) ? 0 : at,
      });
    }
  }
  return rows
    .sort((a, b) => b.at - a.at)
    .slice(0, Math.max(0, limit))
    .map(({ at: _at, ...row }) => row);
}

/** "Goods received — GRN-04512 · Kotagiri · 09:45 AM", or the empty-feed text. */
export function activityTimelineLine(row: ActivityRow | undefined): string {
  if (row === undefined) return t('mainDashboard.activity.none');
  return t('mainDashboard.activity.timeline', { type: row.typeLabel, reference: row.reference, warehouse: row.warehouse, time: row.time });
}

// ─── Consolidated stock by product (GET /admin/batches ACTIVE) ───────────────

export interface ProductStockRow {
  /** cropId + grade: Grade 1 and Grade 2 are different stock. */
  key: string;
  cropId: string;
  /** "Carrot · Grade 1". */
  label: string;
  rows: { warehouseId: string; warehouse: string; grams: number }[];
  totalGrams: number;
}

/** ACTIVE stock per product and grade, per warehouse, as integer grams. */
export function deriveProductStock(batches: readonly BatchDto[], warehouses: readonly WarehouseDto[]): Derived<ProductStockRow[]> {
  return attempt(() => {
    const byKey = new Map<string, { cropId: string; label: string; byWarehouse: Map<string, number> }>();
    for (const b of batches) {
      if (b.status !== 'ACTIVE') continue;
      const grams = requiredGrams(b.qtyAvailableKg, 'qtyAvailableKg');
      const key = `${b.cropId}|${b.grade}`;
      let product = byKey.get(key);
      if (product === undefined) {
        const name = b.cropName !== undefined && b.cropName !== '' ? b.cropName : t('mainDashboard.lowStock.unknownProduct');
        product = { cropId: b.cropId, label: t('inventory.product.label', { product: name, grade: gradeLabel(b.grade) }), byWarehouse: new Map() };
        byKey.set(key, product);
      }
      product.byWarehouse.set(b.warehouseId, (product.byWarehouse.get(b.warehouseId) ?? 0) + grams);
    }
    return [...byKey.entries()].map(([key, p]) => {
      const rows = [...p.byWarehouse.entries()].map(([warehouseId, grams]) => ({
        warehouseId,
        warehouse: warehouseLabel(warehouses, warehouseId),
        grams,
      }));
      return { key, cropId: p.cropId, label: p.label, rows, totalGrams: rows.reduce((sum, r) => sum + r.grams, 0) };
    });
  });
}

/** Products whose label contains the search text, case-insensitively; blank text keeps all. */
export function filterProductStock(products: readonly ProductStockRow[], query: string): ProductStockRow[] {
  const q = query.trim().toLowerCase();
  return q === '' ? [...products] : products.filter((p) => p.label.toLowerCase().includes(q));
}

// ─── Header ──────────────────────────────────────────────────────────────────

/** "Good morning, Suresh" by the IST hour (before 12:00, before 17:00, after); a neutral word until /auth/me answers. */
export function greetingText(now: Date, fullName: string | null | undefined): string {
  const first = fullName?.trim().split(/\s+/)[0];
  const name = first !== undefined && first !== '' ? first : t('mainDashboard.greeting.fallbackName');
  const hour = istHour(now);
  if (hour < 12) return t('mainDashboard.greeting.morning', { name });
  if (hour < 17) return t('mainDashboard.greeting.afternoon', { name });
  return t('mainDashboard.greeting.evening', { name });
}

// ─── Permission gating ───────────────────────────────────────────────────────

/**
 * The docs/rbac.json codes the optional dashboard sources read. A source whose
 * code is not held is not fetched and its figure is not drawn, so a role
 * without it sees no figure instead of one that answers 403. The server
 * authorises every read again (root CLAUDE.md 2.1).
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
  /** GET /admin/alerts and the dismiss behind "Acknowledge" (BR-77, BR-78). */
  alerts: 'alert.own.view',
  /** GET /admin/orders (BR-101). */
  orders: 'order.list.view_all',
  /** GET /admin/goods-receipts. */
  receipts: 'inventory.goods_receipt.record',
  /** GET /admin/purchase-orders. */
  purchaseOrders: 'purchase.order.view',
  /** GET /admin/batches. */
  batches: 'inventory.batch.view',
  /** GET /warehouses/{id}/capacity (BR-66). */
  capacity: 'warehouse.own.view',
} as const;

export type DashboardAccess = { -readonly [K in keyof typeof MAIN_DASHBOARD_CODES]: boolean };

export function dashboardAccess(can: (code: string) => boolean): DashboardAccess {
  const out = {} as DashboardAccess;
  for (const key of Object.keys(MAIN_DASHBOARD_CODES) as (keyof typeof MAIN_DASHBOARD_CODES)[]) {
    out[key] = can(MAIN_DASHBOARD_CODES[key]);
  }
  return out;
}
