/**
 * API rows -> the warehouse Home / dashboard UI shapes (tasks, alerts, stock &
 * transfer overview, snapshot, activity feed, Main overview cards).
 *
 * Pure, with `now` passed in, so plain-Node vitest covers it
 * (../../../tests/mappers_dashboardHome.test.ts). Words come from the admin
 * i18n catalogue (`dashboardHome.*` plus the shared `alert.*`, `inventory.*`,
 * `datetime.*` keys), weights go through integer grams, dates through the
 * admin IST formatters.
 *
 * What the API does not carry is not invented: a task has no priority,
 * assignee or "in progress" state (state is OPEN or DONE only, BR-77/78); an
 * alert has no severity; a transfer summary has no lines (so no kg or crop on
 * a tracking row); the activity feed carries no actor name.
 */
import type { AlertItemDto, AlertType } from '../../../api/alerts';
import type { TransferStatusCounts } from '../../../api/dashboardFeeds';
import type { TaskItemDto, TaskSummaryDto, TaskType } from '../../../api/tasks';
import type { WarehouseTransferStatus, WarehouseTransferSummaryDto } from '../../../api/transfers';
import type { ActivityTypeCode, WarehouseActivityEventDto } from '../../../api/warehouseActivity';
import { warehouseOptionName, type WarehouseOption } from '../../../api/warehouseList';
import type { WarehousePerformanceDto } from '../../../api/warehouseOps';
import type { WarehouseCapacityDto } from '../../../api/warehouses';
import { t, type TranslationKey } from '../../../i18n';
import { formatKg, parseKgToGrams } from '../../../money/quantity';
import { formatAdminDate, formatAdminDay } from '../../../utils/datetime';
import { toApprovalAlertItem } from '../notifications/mappers';
import type { AlertRecordTarget } from '../notifications/types';
import type { BatchRow } from '../inventory/types';
import { mapTaskDestination, summarizeTaskCounts, type TaskDestination } from './mappers_tasks';

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function has<K extends string>(record: Readonly<Record<K, unknown>>, key: string): key is K {
  return Object.prototype.hasOwnProperty.call(record, key);
}

// ─── Dates ───────────────────────────────────────────────────────────────────

/** The IST calendar date of `now` shifted by `offsetDays`, as YYYY-MM-DD (the server's date params). */
export function istDateString(now: Date, offsetDays = 0): string {
  const shifted = new Date(now.getTime() + IST_OFFSET_MS + offsetDays * DAY_MS);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const d = String(shifted.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Today in IST as the inclusive `{ from, to }` range GET /warehouses/{id}/performance takes. */
export function todayRange(now: Date): { from: string; to: string } {
  const day = istDateString(now);
  return { from: day, to: day };
}

/** A kg Quantity string as display text, or null when absent / not a Quantity (never NaN). */
export function kgLabel(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const grams = parseKgToGrams(value);
  return grams === null ? null : formatKg(grams);
}

// ─── Tasks (BR-77, BR-78) ────────────────────────────────────────────────────

export const TASK_TYPE_LABEL: Record<TaskType, TranslationKey> = {
  RETURN_INSPECTION: 'dashboardHome.task.type.RETURN_INSPECTION',
  RETURN_APPROVAL: 'dashboardHome.task.type.RETURN_APPROVAL',
  GOODS_RECEIPT_QC: 'dashboardHome.task.type.GOODS_RECEIPT_QC',
  ORDER_PACK: 'dashboardHome.task.type.ORDER_PACK',
  ORDER_DISPATCH: 'dashboardHome.task.type.ORDER_DISPATCH',
  ORDER_PICKUP_OTP: 'dashboardHome.task.type.ORDER_PICKUP_OTP',
};

/** The two server task states; the filter maps 1:1 to GET /admin/tasks?state=. */
export type TaskStateFilter = 'open' | 'done';
export const TASK_STATE_FILTERS: readonly TaskStateFilter[] = ['open', 'done'];

/** One task as the task screens show it. */
export interface TaskRow {
  itemKey: string;
  type: TaskType;
  typeLabel: string;
  /** "<type> · <ref code>", or the type alone when the params carry no code. */
  title: string;
  /** Human reference code from params, '' when none. */
  refCode: string;
  refId: string;
  details: string | null;
  /** "Due 25 Sep 2026", or null when the server sent no due date (never invented). */
  dueLabel: string | null;
  dueToday: boolean;
  createdLabel: string;
  done: boolean;
  warehouseId: string;
  destination: TaskDestination;
}

function stringParam(params: TaskItemDto['params'], keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const value = params[key];
    if (typeof value === 'string' && value !== '') return value;
    if (typeof value === 'number') return String(value);
  }
  return undefined;
}

function taskDetails(dto: TaskItemDto): string | null {
  const produce = stringParam(dto.params, ['produce', 'cropName', 'productName']);
  const qtyRaw = stringParam(dto.params, ['grossQtyKg', 'qtyKg']);
  const qty = qtyRaw === undefined ? null : kgLabel(qtyRaw) ?? qtyRaw;
  const customer = stringParam(dto.params, ['customerName', 'customer']);
  const parts: string[] = [];
  if (produce !== undefined && qty !== null) parts.push(t('dashboardHome.task.produceQty', { produce, qty }));
  else if (produce !== undefined) parts.push(produce);
  else if (qty !== null) parts.push(qty);
  if (customer !== undefined) parts.push(t('dashboardHome.task.customer', { customer }));
  return parts.length > 0 ? parts.join(' · ') : null;
}

export function toTaskRow(dto: TaskItemDto, now: Date): TaskRow {
  const typeLabel = has(TASK_TYPE_LABEL, dto.type) ? t(TASK_TYPE_LABEL[dto.type]) : t('dashboardHome.task.type.unknown');
  const refCode = stringParam(dto.params, ['orderNumber', 'grnNumber', 'rmaNumber', 'refCode']) ?? '';
  const dueDay = dto.dueOn === null ? '' : formatAdminDay(dto.dueOn);
  return {
    itemKey: dto.itemKey,
    type: dto.type,
    typeLabel,
    title: refCode === '' ? typeLabel : t('dashboardHome.task.titleWithRef', { type: typeLabel, ref: refCode }),
    refCode,
    refId: dto.refId,
    details: taskDetails(dto),
    dueLabel: dto.dueOn === null ? null : t('dashboardHome.task.due', { day: dueDay === '' ? dto.dueOn : dueDay }),
    dueToday: dto.dueOn !== null && dto.dueOn.slice(0, 10) === istDateString(now),
    createdLabel: formatAdminDate(dto.createdAt, now),
    done: dto.state === 'DONE',
    warehouseId: dto.warehouseId,
    destination: mapTaskDestination(dto),
  };
}

/** Free-text match over the title, reference code and ids. */
export function filterTaskRows(rows: readonly TaskRow[], query: string): TaskRow[] {
  const q = query.trim().toLowerCase();
  if (q === '') return [...rows];
  return rows.filter((row) =>
    [row.title, row.refCode, row.refId, row.itemKey, row.details ?? ''].some((v) => v.toLowerCase().includes(q)),
  );
}

export interface KpiItem {
  label: string;
  value: string;
}

/** Task KPI tiles from GET /admin/tasks/summary; '—' until it loads (never a fake 0). */
export function taskKpis(summary: TaskSummaryDto | null | undefined): KpiItem[] {
  const known = summary !== null && summary !== undefined;
  const counts = summarizeTaskCounts(summary);
  const value = (n: number) => (known ? String(n) : t('dashboardHome.noValue'));
  return [
    { label: t('dashboardHome.task.kpi.open'), value: value(summary?.open ?? 0) },
    { label: t('dashboardHome.task.kpi.qc'), value: value(counts.qcPending) },
    { label: t('dashboardHome.task.kpi.orders'), value: value(counts.ordersActionable) },
    { label: t('dashboardHome.task.kpi.returns'), value: value(counts.returnsPending) },
  ];
}

/** Destinations the host can open from a task (returns have no Home target yet). */
export function taskOpensRecord(row: TaskRow): boolean {
  return row.destination.module === 'orders' || row.destination.module === 'receiving';
}

// ─── Alerts (BR-77, BR-78) ───────────────────────────────────────────────────

export const ALERT_TYPES: readonly AlertType[] = ['LOW_STOCK', 'BATCH_NEAR_EXPIRY', 'CAPACITY_NEAR_FULL'];
export type AlertFilter = 'all' | AlertType;
export const ALERT_FILTERS: readonly AlertFilter[] = ['all', ...ALERT_TYPES];
export type AlertStateFilter = 'active' | 'snoozed';
export const ALERT_STATE_FILTERS: readonly AlertStateFilter[] = ['active', 'snoozed'];

export const ALERT_FILTER_LABEL: Record<AlertFilter, TranslationKey> = {
  all: 'dashboardHome.alerts.filter.all',
  LOW_STOCK: 'alert.low_stock.title',
  BATCH_NEAR_EXPIRY: 'alert.batch_near_expiry.title',
  CAPACITY_NEAR_FULL: 'alert.capacity_near_full.title',
};

/**
 * The Needs Attention filter a host asked for. The Sales hub still passes its
 * old sales-queue categories; only 'stock_issue' has an alert source
 * (LOW_STOCK). Payment / failed sale / invoice issues have no endpoint, so
 * they open the whole list rather than an empty, misleading one.
 */
export function alertFilterFromCategory(category: string | undefined): AlertFilter {
  if (category === undefined) return 'all';
  if (category === 'stock_issue') return 'LOW_STOCK';
  return (ALERT_TYPES as readonly string[]).includes(category) ? (category as AlertType) : 'all';
}

export interface AttentionAlert {
  itemKey: string;
  type: AlertType | 'UNKNOWN';
  title: string;
  message: string;
  /** "3 hours ago" since the condition began; '' for a point-in-time alert. */
  since: string;
  snoozed: boolean;
  /** "Today · 04:20 PM"; undefined unless snoozed. */
  snoozedUntil: string | undefined;
  warehouseId: string;
  record: AlertRecordTarget | undefined;
}

/** Built on the notifications area's alert mapper so both lists word an alert the same way. */
export function toAttentionAlert(dto: AlertItemDto, now: Date): AttentionAlert {
  const base = toApprovalAlertItem(dto, now);
  return {
    itemKey: dto.itemKey,
    type: (ALERT_TYPES as readonly string[]).includes(dto.type) ? dto.type : 'UNKNOWN',
    title: base.title,
    message: base.detail,
    since: base.timestamp,
    snoozed: dto.state === 'SNOOZED',
    snoozedUntil: base.snoozedUntil,
    warehouseId: dto.warehouseId,
    record: base.record,
  };
}

/** Count per filter chip over the loaded alerts. */
export function countAlertsByFilter(alerts: readonly AttentionAlert[]): Record<AlertFilter, number> {
  const out: Record<AlertFilter, number> = { all: alerts.length, LOW_STOCK: 0, BATCH_NEAR_EXPIRY: 0, CAPACITY_NEAR_FULL: 0 };
  for (const alert of alerts) if (alert.type !== 'UNKNOWN') out[alert.type] += 1;
  return out;
}

/**
 * Snooze length. UX choice, not a business rule: the design shows a 1-hour
 * snooze; the server bounds `until` with system_config.alert_snooze_max_hours
 * (BR-78f) and answers 422 beyond it, so this is never the authority.
 */
export const ALERT_SNOOZE_MS = 60 * 60 * 1000;

export function snoozeUntil(now: Date): Date {
  return new Date(now.getTime() + ALERT_SNOOZE_MS);
}

// ─── Warehouses: overview cards, stock rows ─────────────────────────────────

/** A warehouse's display name from the real list, or a neutral label. */
export function warehouseLabel(options: readonly WarehouseOption[], warehouseId: string | undefined): string {
  return warehouseOptionName(options, warehouseId) ?? t('dashboardHome.warehouse.unknown');
}

export interface OverviewCard {
  warehouseId: string;
  name: string;
  /** Stock held (capacity usedKg, ACTIVE batches), '—' until known. */
  stockLabel: string;
  /** "82% used" / "No capacity set" / '—'. */
  capacityLabel: string;
  /** 0-100 for the bar; null when there is no capacity to measure against. */
  progressPercent: number | null;
  overCapacity: boolean;
  /** "3,420 kg · 82%" for the comparison table. */
  comparisonLabel: string;
  isActive: boolean;
  city: string | null;
  code: string;
}

export function toOverviewCard(option: WarehouseOption, capacity: WarehouseCapacityDto | undefined): OverviewCard {
  const stock = capacity === undefined ? null : kgLabel(capacity.usedKg);
  const pct = capacity?.utilizationPercent ?? null;
  const stockLabel = stock ?? t('dashboardHome.noValue');
  let capacityLabel: string;
  if (capacity === undefined) capacityLabel = t('dashboardHome.noValue');
  else if (pct === null) capacityLabel = t('dashboardHome.capacity.notSet');
  else capacityLabel = t('dashboardHome.capacity.percent', { percent: Math.round(pct) });
  return {
    warehouseId: option.warehouseId,
    name: option.warehouseName,
    stockLabel,
    capacityLabel,
    progressPercent: pct === null ? null : Math.max(0, Math.min(100, Math.round(pct))),
    overCapacity: pct !== null && pct > 100,
    comparisonLabel: pct === null ? stockLabel : t('dashboardHome.capacity.comparison', { stock: stockLabel, percent: Math.round(pct) }),
    isActive: option.isActive,
    city: option.city,
    code: option.warehouseCode,
  };
}

export interface StockRow {
  warehouseId: string;
  label: string;
  value: string;
}

/** One row per warehouse with its used kg, plus the total (only when every row is known). */
export function warehouseStockRows(
  options: readonly WarehouseOption[],
  capacities: ReadonlyMap<string, WarehouseCapacityDto> | undefined,
): { rows: StockRow[]; total: string } {
  let totalGrams = 0;
  let complete = capacities !== undefined;
  const rows = options.map((option) => {
    const grams = parseKgToGrams(capacities?.get(option.warehouseId)?.usedKg ?? '');
    if (grams === null) complete = false;
    else totalGrams += grams;
    return {
      warehouseId: option.warehouseId,
      label: option.warehouseName,
      value: grams === null ? t('dashboardHome.noValue') : formatKg(grams),
    };
  });
  return { rows, total: complete ? formatKg(totalGrams) : t('dashboardHome.noValue') };
}

// ─── Transfers ───────────────────────────────────────────────────────────────

export const TRANSFER_STATUS_LABEL: Record<WarehouseTransferStatus, TranslationKey> = {
  PENDING_APPROVAL: 'dashboardHome.transfer.status.PENDING_APPROVAL',
  IN_TRANSIT: 'dashboardHome.transfer.status.IN_TRANSIT',
  RECEIVED: 'dashboardHome.transfer.status.RECEIVED',
  CANCELLED: 'dashboardHome.transfer.status.CANCELLED',
};

const TRANSFER_ROW_ORDER: readonly WarehouseTransferStatus[] = ['PENDING_APPROVAL', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED'];

/** The transfer count rows, '—' until the counts load. */
export function transferCountRows(counts: TransferStatusCounts | undefined): { status: WarehouseTransferStatus; label: string; value: string }[] {
  return TRANSFER_ROW_ORDER.map((status) => ({
    status,
    label: t(TRANSFER_STATUS_LABEL[status]),
    value: counts === undefined ? t('dashboardHome.noValue') : String(counts[status]),
  }));
}

export interface TrackedTransfer {
  id: string;
  title: string;
  route: string;
  status: WarehouseTransferStatus;
  statusLabel: string;
  when: string;
  hasDiscrepancy: boolean;
}

export function toTrackedTransfer(dto: WarehouseTransferSummaryDto, options: readonly WarehouseOption[], now: Date): TrackedTransfer {
  return {
    id: dto.id,
    title: dto.transferNumber,
    route: t('dashboardHome.transfer.route', {
      from: warehouseLabel(options, dto.fromWarehouseId),
      to: warehouseLabel(options, dto.toWarehouseId),
    }),
    status: dto.status,
    statusLabel: has(TRANSFER_STATUS_LABEL, dto.status) ? t(TRANSFER_STATUS_LABEL[dto.status]) : dto.status,
    when: formatAdminDate(dto.createdAt, now),
    hasDiscrepancy: dto.hasDiscrepancy,
  };
}

// ─── Consolidated stock (Main) ───────────────────────────────────────────────

export interface ConsolidatedProduct {
  key: string;
  label: string;
  rows: { warehouseId: string; name: string; value: string }[];
  total: string;
  totalGrams: number;
}

/** Available kg of every product (crop + grade) per warehouse, over ACTIVE batches; most stock first. */
export function consolidateStock(batches: readonly BatchRow[], options: readonly WarehouseOption[]): ConsolidatedProduct[] {
  const groups = new Map<string, { label: string; perWarehouse: Map<string, number>; total: number }>();
  for (const batch of batches) {
    if (batch.status !== 'active' || batch.availableGrams === null) continue;
    const key = `${batch.cropId}|${batch.grade}`;
    let group = groups.get(key);
    if (group === undefined) {
      group = {
        label: t('inventory.product.label', { product: batch.productName, grade: batch.gradeLabel }),
        perWarehouse: new Map(),
        total: 0,
      };
      groups.set(key, group);
    }
    group.perWarehouse.set(batch.warehouseId, (group.perWarehouse.get(batch.warehouseId) ?? 0) + batch.availableGrams);
    group.total += batch.availableGrams;
  }
  return [...groups.entries()]
    .map(([key, g]) => ({
      key,
      label: g.label,
      rows: [...g.perWarehouse.entries()]
        .map(([warehouseId, grams]) => ({ warehouseId, name: warehouseLabel(options, warehouseId), value: formatKg(grams), grams }))
        .sort((a, b) => b.grams - a.grams || a.name.localeCompare(b.name))
        .map(({ warehouseId, name, value }) => ({ warehouseId, name, value })),
      total: formatKg(g.total),
      totalGrams: g.total,
    }))
    .sort((a, b) => b.totalGrams - a.totalGrams || a.label.localeCompare(b.label));
}

export function filterConsolidated(products: readonly ConsolidatedProduct[], query: string): ConsolidatedProduct[] {
  const q = query.trim().toLowerCase();
  return q === '' ? [...products] : products.filter((p) => p.label.toLowerCase().includes(q));
}

// ─── Snapshot (one warehouse) ────────────────────────────────────────────────

export interface SnapshotFigures {
  stock: string;
  utilization: string;
  occupied: string;
  available: string;
  percent: number;
  overCapacity: boolean;
}

export function snapshotCapacity(capacity: WarehouseCapacityDto | undefined): SnapshotFigures {
  const none = t('dashboardHome.noValue');
  const pct = capacity?.utilizationPercent ?? null;
  const availableGrams = parseKgToGrams(capacity?.availableKg ?? '');
  return {
    stock: kgLabel(capacity?.usedKg) ?? none,
    utilization: pct === null ? (capacity === undefined ? none : t('dashboardHome.capacity.notSet')) : t('dashboardHome.capacity.percent', { percent: Math.round(pct) }),
    occupied: kgLabel(capacity?.usedKg) ?? none,
    // A negative available (over capacity) is shown as 0 kg free; overCapacity carries the warning.
    available: availableGrams === null ? none : formatKg(Math.max(0, availableGrams)),
    percent: pct === null ? 0 : Math.round(pct),
    overCapacity: pct !== null && pct > 100,
  };
}

/** Today's exact counts from GET /warehouses/{id}/performance (BR-80); '—' when not loaded / not allowed. */
export function snapshotToday(performance: WarehousePerformanceDto | undefined): {
  receipts: string;
  receivedKg: string;
  ordersPlaced: string;
  ordersFulfilled: string;
} {
  const none = t('dashboardHome.noValue');
  if (performance === undefined) return { receipts: none, receivedKg: none, ordersPlaced: none, ordersFulfilled: none };
  return {
    receipts: String(performance.receiving.goodsReceipts),
    receivedKg: kgLabel(performance.receiving.grossQtyKg) ?? none,
    ordersPlaced: String(performance.orders.placed),
    ordersFulfilled: String(performance.orders.fulfilled),
  };
}

// ─── Activity feed (BR-104) ──────────────────────────────────────────────────

export type ActivityDateFilter = 'today' | 'yesterday' | 'week' | 'all';
export const ACTIVITY_DATE_FILTERS: readonly ActivityDateFilter[] = ['today', 'yesterday', 'week', 'all'];
export type ActivityTypeFilter = 'all' | ActivityTypeCode;
export const ACTIVITY_TYPE_FILTERS: readonly ActivityTypeFilter[] = [
  'all',
  'STOCK_MOVEMENT',
  'GOODS_RECEIPT',
  'TRANSFER',
  'ISSUE',
  'RETURN',
  'DOCUMENT',
];

export const ACTIVITY_DATE_LABEL: Record<ActivityDateFilter, TranslationKey> = {
  today: 'dashboardHome.activity.date.today',
  yesterday: 'dashboardHome.activity.date.yesterday',
  week: 'dashboardHome.activity.date.week',
  all: 'dashboardHome.activity.date.all',
};

export const ACTIVITY_TYPE_LABEL: Record<ActivityTypeFilter, TranslationKey> = {
  all: 'dashboardHome.activity.type.all',
  STOCK_MOVEMENT: 'dashboardHome.activity.type.STOCK_MOVEMENT',
  GOODS_RECEIPT: 'dashboardHome.activity.type.GOODS_RECEIPT',
  TRANSFER: 'dashboardHome.activity.type.TRANSFER',
  ISSUE: 'dashboardHome.activity.type.ISSUE',
  RETURN: 'dashboardHome.activity.type.RETURN',
  DOCUMENT: 'dashboardHome.activity.type.DOCUMENT',
};

/** The inclusive IST `from`/`to` the feed takes for a date chip; 'all' sends neither. */
export function activityRange(filter: ActivityDateFilter, now: Date): { from: string; to: string } | Record<string, never> {
  switch (filter) {
    case 'today':
      return todayRange(now);
    case 'yesterday': {
      const day = istDateString(now, -1);
      return { from: day, to: day };
    }
    case 'week':
      return { from: istDateString(now, -6), to: istDateString(now) };
    default:
      return {};
  }
}

const MOVEMENT_LABEL: Record<string, TranslationKey> = {
  RECEIPT: 'inventory.movement.receipt',
  SALE: 'inventory.movement.sale',
  TRANSFER_OUT: 'inventory.movement.transferOut',
  TRANSFER_IN: 'inventory.movement.transferIn',
  ADJUSTMENT: 'inventory.movement.adjustment',
  WASTAGE: 'inventory.movement.wastage',
  RETURN_IN: 'inventory.movement.returnIn',
  RESERVATION: 'inventory.movement.reservation',
  RELEASE: 'inventory.movement.release',
};

export interface ActivityRow {
  key: string;
  type: ActivityTypeCode;
  typeLabel: string;
  /** Movement name for a stock movement; else the server reference (GRN / transfer / issue number...). */
  reference: string;
  /** Server status code as sent (no translation exists for every module's enum); null when none. */
  status: string | null;
  qty: string | null;
  direction: string | null;
  when: string;
}

export function toActivityRow(dto: WarehouseActivityEventDto, now: Date): ActivityRow {
  const reference =
    dto.type === 'STOCK_MOVEMENT'
      ? t(has(MOVEMENT_LABEL, dto.reference) ? MOVEMENT_LABEL[dto.reference]! : 'inventory.movement.unknown')
      : dto.reference;
  return {
    key: `${dto.type}:${dto.sourceId}:${dto.occurredAt}`,
    type: dto.type,
    typeLabel: has(ACTIVITY_TYPE_LABEL, dto.type) ? t(ACTIVITY_TYPE_LABEL[dto.type]) : dto.type,
    reference,
    status: dto.status,
    qty: kgLabel(dto.qtyKg),
    direction:
      dto.direction === 'INBOUND'
        ? t('dashboardHome.activity.direction.INBOUND')
        : dto.direction === 'OUTBOUND'
          ? t('dashboardHome.activity.direction.OUTBOUND')
          : null,
    when: formatAdminDate(dto.occurredAt, now),
  };
}
