/**
 * API rows -> the KPI figures of the Main and Sub warehouse dashboards (Home
 * KPI grid, Today's Operations, Inventory tab, Performance and Capacity
 * Summary, Recent Activity).
 *
 * Pure, with `now` passed in, so plain-Node vitest covers it
 * (../../../tests/mappers_dashboardKpis.test.ts). Every figure comes from an
 * existing endpoint; when a source has not loaded (or failed) the figure is
 * the "no value" dash, never a 0 that would read as a real count. Weights go
 * through integer grams and money through integer paise (root CLAUDE.md 2.2).
 *
 * What the API does not carry is not shown: there is no turnaround time, no
 * "quality issue" count separate from QC tasks and rejected kg, and no
 * per-warehouse storage-area count on the capacity read.
 */
import { parseMoney, toPaise, type Money } from '@tohfa/shared-types';
import type { TransferStatusCounts } from '../../../api/dashboardFeeds';
import type { WarehouseActivityEventDto } from '../../../api/warehouseActivity';
import type { WarehouseOption } from '../../../api/warehouseList';
import type { WarehousePerformanceDto } from '../../../api/warehouseOps';
import type { WarehouseCapacityDto } from '../../../api/warehouses';
import { t } from '../../../i18n';
import { formatPaise } from '../../../money/paise';
import { formatKg, parseKgToGrams } from '../../../money/quantity';
import { istDateString, toActivityRow, warehouseLabel, type ActivityRow } from './mappers_dashboardHome';

function noValue(): string {
  return t('dashboardHome.noValue');
}

/** A count as text; the dash while it is unknown. */
export function countLabel(count: number | null | undefined): string {
  return count === null || count === undefined || !Number.isFinite(count) ? noValue() : String(count);
}

/** A grams total as "1,240 kg"; the dash while it is unknown. */
export function gramsLabel(grams: number | null | undefined): string {
  return grams === null || grams === undefined ? noValue() : formatKg(grams);
}

/** A server Money amount as "₹1,45,100"; the dash when absent or not a Money string. */
export function moneyLabel(value: Money | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return noValue();
  try {
    return formatPaise(toPaise(parseMoney(String(value))));
  } catch {
    return noValue();
  }
}

/** The inclusive IST month-to-date range (`from` = the 1st, `to` = today) the performance and sales reads take. */
export function monthToDateRange(now: Date): { from: string; to: string } {
  const today = istDateString(now);
  return { from: `${today.slice(0, 8)}01`, to: today };
}

/** The warehouses a Main KPI covers: the picked one, or every warehouse in the list. */
export function kpiWarehouseIds(options: readonly WarehouseOption[], selectedId: string | undefined): string[] {
  if (selectedId !== undefined && options.some((o) => o.warehouseId === selectedId)) return [selectedId];
  return options.map((o) => o.warehouseId);
}

// ─── Performance (GET /warehouses/{id}/performance, BR-80) ─────────────────

export interface PerformanceTotals {
  goodsReceipts: number;
  /** null when any warehouse sent a quantity that is not a kg Quantity. */
  grossGrams: number | null;
  acceptedGrams: number | null;
  rejectedGrams: number | null;
  ordersPlaced: number;
  ordersFulfilled: number;
  ordersCancelled: number;
  returnsRequested: number;
}

function addGrams(total: number | null, value: string): number | null {
  const grams = parseKgToGrams(value);
  return total === null || grams === null ? null : total + grams;
}

/** Exact sums over several warehouses' performance for the same range. */
export function sumPerformance(rows: readonly WarehousePerformanceDto[]): PerformanceTotals {
  const totals: PerformanceTotals = {
    goodsReceipts: 0,
    grossGrams: 0,
    acceptedGrams: 0,
    rejectedGrams: 0,
    ordersPlaced: 0,
    ordersFulfilled: 0,
    ordersCancelled: 0,
    returnsRequested: 0,
  };
  for (const row of rows) {
    totals.goodsReceipts += row.receiving.goodsReceipts;
    totals.grossGrams = addGrams(totals.grossGrams, row.receiving.grossQtyKg);
    totals.acceptedGrams = addGrams(totals.acceptedGrams, row.receiving.acceptedQtyKg);
    totals.rejectedGrams = addGrams(totals.rejectedGrams, row.receiving.rejectedQtyKg);
    totals.ordersPlaced += row.orders.placed;
    totals.ordersFulfilled += row.orders.fulfilled;
    totals.ordersCancelled += row.orders.cancelled;
    totals.returnsRequested += row.returns.requested;
  }
  return totals;
}

export interface PerformanceFigures {
  receipts: string;
  receivedKg: string;
  acceptedKg: string;
  rejectedKg: string;
  ordersPlaced: string;
  ordersFulfilled: string;
  ordersCancelled: string;
  returnsRequested: string;
}

/** The performance totals as display text; every figure the dash until they load. */
export function performanceFigures(totals: PerformanceTotals | undefined): PerformanceFigures {
  return {
    receipts: countLabel(totals?.goodsReceipts),
    receivedKg: gramsLabel(totals?.grossGrams),
    acceptedKg: gramsLabel(totals?.acceptedGrams),
    rejectedKg: gramsLabel(totals?.rejectedGrams),
    ordersPlaced: countLabel(totals?.ordersPlaced),
    ordersFulfilled: countLabel(totals?.ordersFulfilled),
    ordersCancelled: countLabel(totals?.ordersCancelled),
    returnsRequested: countLabel(totals?.returnsRequested),
  };
}

// ─── Transfers ───────────────────────────────────────────────────────────────

/** Transfers not yet received: awaiting approval plus in transit. null until the counts load. */
export function pendingTransferCount(counts: TransferStatusCounts | undefined): number | null {
  return counts === undefined ? null : counts.PENDING_APPROVAL + counts.IN_TRANSIT;
}

// ─── Capacity (GET /warehouses/{id}/capacity, BR-66b) ────────────────────────

export interface CapacityFigures {
  used: string;
  available: string;
  utilization: string;
  /** True when at least one covered warehouse has a capacity to measure against. */
  hasCapacity: boolean;
}

/**
 * Used kg over every covered warehouse; available kg and utilization over the
 * warehouses that HAVE a capacity (a warehouse without one has no "available"
 * to add). Over-capacity counts as 0 kg available, as on the snapshot.
 */
export function capacityFigures(
  warehouseIds: readonly string[],
  capacities: ReadonlyMap<string, WarehouseCapacityDto> | undefined,
): CapacityFigures {
  const unknown: CapacityFigures = { used: noValue(), available: noValue(), utilization: noValue(), hasCapacity: false };
  if (capacities === undefined || warehouseIds.length === 0) return unknown;
  let usedGrams = 0;
  let capacityGrams = 0;
  let usedWithCapacityGrams = 0;
  let availableGrams = 0;
  let hasCapacity = false;
  for (const id of warehouseIds) {
    const row = capacities.get(id);
    const used = parseKgToGrams(row?.usedKg ?? '');
    if (row === undefined || used === null) return unknown;
    usedGrams += used;
    const capacity = row.capacityKg === null ? null : parseKgToGrams(row.capacityKg);
    if (capacity === null || capacity <= 0) continue;
    hasCapacity = true;
    capacityGrams += capacity;
    usedWithCapacityGrams += used;
    availableGrams += Math.max(0, capacity - used);
  }
  if (!hasCapacity) {
    return { used: formatKg(usedGrams), available: t('dashboardHome.capacity.notSet'), utilization: t('dashboardHome.capacity.notSet'), hasCapacity };
  }
  return {
    used: formatKg(usedGrams),
    available: formatKg(availableGrams),
    utilization: t('dashboardHome.capacity.percent', { percent: Math.round((usedWithCapacityGrams * 100) / capacityGrams) }),
    hasCapacity,
  };
}

// ─── Activity across warehouses (GET /warehouses/{id}/activity, BR-104) ─────

export interface RecentActivityRow extends ActivityRow {
  warehouseId: string;
  warehouseName: string;
  occurredAt: string;
}

/**
 * The newest `limit` events over several warehouses' first feed pages. Each
 * page is newest first already; the merge sorts on the UTC instant, which the
 * server sends as a fixed-width ISO string.
 */
export function mergeRecentActivity(
  pages: readonly { warehouseId: string; items: readonly WarehouseActivityEventDto[] }[],
  options: readonly WarehouseOption[],
  now: Date,
  limit: number,
): RecentActivityRow[] {
  const rows: RecentActivityRow[] = [];
  for (const page of pages) {
    for (const dto of page.items) {
      rows.push({
        ...toActivityRow(dto, now),
        // The same event can appear in both warehouses of a transfer; the key keeps them apart.
        key: `${page.warehouseId}:${dto.type}:${dto.sourceId}:${dto.occurredAt}`,
        warehouseId: page.warehouseId,
        warehouseName: warehouseLabel(options, page.warehouseId),
        occurredAt: dto.occurredAt,
      });
    }
  }
  const time = (iso: string) => {
    const ms = Date.parse(iso);
    return Number.isNaN(ms) ? 0 : ms;
  };
  return rows.sort((a, b) => time(b.occurredAt) - time(a.occurredAt)).slice(0, Math.max(0, limit));
}

/** "Goods receipt — GRN-000123 · Ooty Warehouse · Today · 09:45 AM", or the empty-feed text. */
export function activityTimelineLine(row: RecentActivityRow | undefined): string {
  if (row === undefined) return t('mainDashboard.activity.none');
  return t('mainDashboard.activity.timeline', {
    type: row.typeLabel,
    reference: row.reference,
    warehouse: row.warehouseName,
    when: row.when,
  });
}

/** The sub line of a Recent Activity row: warehouse, then the quantity when the event has one. */
export function activitySubLine(row: RecentActivityRow): string {
  return row.qty === null ? row.warehouseName : t('mainDashboard.activity.sub', { warehouse: row.warehouseName, qty: row.qty });
}
