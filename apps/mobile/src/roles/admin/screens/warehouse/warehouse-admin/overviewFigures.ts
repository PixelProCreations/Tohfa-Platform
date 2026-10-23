/**
 * Pure figures shared by the Main admin's two warehouse overviews: the Shell's
 * Warehouse Overview / Capacity Summary (D02, MainWarehouseAdminDashboardScreen)
 * with its City Detail, and the More-tab Warehouse List (M15-02,
 * ./WarehouseOverviewScreen). No React, no react-native, so plain-Node vitest
 * covers every decision (tests/overviewFigures_warehouseAdmin.test.ts).
 *
 * A figure that cannot be read from the server's answer is null (the screen
 * hides it or shows the dash), never a 0 the server did not say.
 */
import type { AlertItemDto } from '../../../api/alerts';
import type { RollCallDto } from '../../../api/attendance';
import type { WarehousePerformanceDto } from '../../../api/warehouseOps';
import type { WarehouseCapacityDto } from '../../../api/warehouses';
import { parseKgToGrams } from '../../../money/quantity';

/** The rbac codes the added figures are gated on (docs/rbac.json). */
export const WAREHOUSE_OVERVIEW_CODES = {
  /** GET /warehouses/{id}/storage-locations (BR-79). MAIN all. */
  storageAreas: 'inventory.batch.view',
  /** GET /admin/staff-attendance/roll-call (BR-84). MAIN own (all four when unassigned). */
  staffCount: 'admin.staff.attendance.view',
} as const;

/** GET /admin/alerts (BR-77), read for CAPACITY_NEAR_FULL on the Warehouse Management list. MAIN all. */
export const NEAR_FULL_ALERTS_CODE = 'alert.own.view';

function isCount(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n >= 0;
}

// ─── Today's receipts (GET /warehouses/{id}/performance, BR-80) ──────────────

/**
 * The goods receipts of one warehouse's performance range. Read from the
 * server's exact count rather than by filtering the goods-receipts list, which
 * the dashboard only walks up to a page cap.
 */
export function todayReceiptsCount(dto: Pick<WarehousePerformanceDto, 'receiving'>): number | null {
  const n = dto.receiving.goodsReceipts;
  return isCount(n) ? n : null;
}

/** Receipts per warehouse uuid; a warehouse with an unreadable count is left out (its card shows the dash). */
export function receiptsByWarehouse(rows: readonly WarehousePerformanceDto[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const row of rows) {
    const n = todayReceiptsCount(row);
    if (n !== null) out[row.warehouseId] = n;
  }
  return out;
}

// ─── Storage areas (GET /warehouses/{id}/storage-locations `total`, BR-79) ───

/**
 * The storage areas of the covered warehouses: the sum of each list's exact
 * `total`. A partial sum would understate the figure, so one unreadable total
 * (or none at all) makes it null.
 */
export function sumStorageAreas(totals: readonly number[]): number | null {
  if (totals.length === 0 || !totals.every(isCount)) return null;
  return totals.reduce((sum, n) => sum + n, 0);
}

// ─── Near-full capacity (GET /admin/alerts CAPACITY_NEAR_FULL, BR-66, BR-77) ─

/**
 * What the server has said about near-full warehouses. The limit is
 * system_config.alert_capacity_utilization_percent, which no endpoint exposes
 * on its own; it reaches the client only as `thresholdPercent` in the params of
 * a raised CAPACITY_NEAR_FULL alert (root CLAUDE.md 2.7: never a client constant).
 */
export interface NearFullSignal {
  /** Warehouses with a CAPACITY_NEAR_FULL alert in the caller's list. */
  warehouseIds: ReadonlySet<string>;
  /** The server's threshold in basis points, when the alerts carry one value; else null. */
  thresholdBp: number | null;
}

function percentToBp(value: unknown): number | null {
  const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : Number.NaN;
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null;
}

export function nearFullSignal(alerts: readonly AlertItemDto[]): NearFullSignal {
  const warehouseIds = new Set<string>();
  const thresholds = new Set<number>();
  for (const alert of alerts) {
    if (alert.type !== 'CAPACITY_NEAR_FULL') continue;
    warehouseIds.add(alert.warehouseId);
    const bp = percentToBp(alert.params.thresholdPercent);
    if (bp !== null) thresholds.add(bp);
  }
  // Two different values would mean a mid-change config; neither is guessed at.
  const [only] = thresholds;
  return { warehouseIds, thresholdBp: thresholds.size === 1 && only !== undefined ? only : null };
}

/**
 * How a capacity pill / bar is drawn. There is deliberately no "ok" tone: the
 * alert list leaves out alerts the caller dismissed or snoozed (BR-78), so the
 * absence of an alert does not prove a warehouse is below the limit.
 *   over      available below zero: a fact of the figures (BR-66b), no threshold involved
 *   nearFull  the server raised CAPACITY_NEAR_FULL for it, or its utilization is at or
 *             above the threshold the server's own alerts carry
 *   neutral   anything else, including alerts not loaded yet and no capacity set
 */
export type CapacityTone = 'neutral' | 'nearFull' | 'over';

export interface CapacityToneInput {
  warehouseId: string;
  /** used / capacity in basis points; null without a capacity. */
  utilizationBp: number | null;
  /** capacity - used in grams; null without a capacity. */
  availableGrams: number | null;
}

export function capacityTone(row: CapacityToneInput, signal: NearFullSignal | null): CapacityTone {
  if (row.availableGrams !== null && row.availableGrams < 0) return 'over';
  if (signal === null || row.utilizationBp === null) return 'neutral';
  if (signal.warehouseIds.has(row.warehouseId)) return 'nearFull';
  if (signal.thresholdBp !== null && row.utilizationBp >= signal.thresholdBp) return 'nearFull';
  return 'neutral';
}

/**
 * The near-full signal from a walked alert list, or null while it is unknown:
 * not loaded, or cut short by the page cap (a missing alert would read as
 * "not near full").
 */
export function nearFullSignalOf(collected: { items: readonly AlertItemDto[]; complete: boolean } | undefined): NearFullSignal | null {
  if (collected === undefined || !collected.complete) return null;
  return nearFullSignal(collected.items);
}

/** capacityTone's input from GET /warehouses/{id}/capacity: utilization in basis points, available in grams. */
export function capacityToneInputOf(dto: WarehouseCapacityDto): CapacityToneInput {
  const set = dto.capacityKg !== null;
  const percent = dto.utilizationPercent;
  return {
    warehouseId: dto.warehouseId,
    utilizationBp: set && typeof percent === 'number' && Number.isFinite(percent) ? Math.round(percent * 100) : null,
    availableGrams: set && dto.availableKg !== null ? parseKgToGrams(dto.availableKg) : null,
  };
}

/**
 * The warehouses the Needs Attention KPI counts (design M15-01): near full or
 * over capacity, or an active Sub warehouse without a SWA. A set, so a
 * warehouse with two problems counts once. `unstaffedIds` is null when the SWA
 * list is not read (no admin.sub_wh_admin.create), and then only capacity counts.
 */
export function needsAttentionIds(
  tones: ReadonlyMap<string, CapacityTone>,
  unstaffedIds: ReadonlySet<string> | null,
): Set<string> {
  const out = new Set<string>();
  for (const [id, tone] of tones) if (tone !== 'neutral') out.add(id);
  for (const id of unstaffedIds ?? []) out.add(id);
  return out;
}

// ─── Staff count (GET /admin/staff-attendance/roll-call, BR-84) ──────────────

/**
 * The warehouse's current staff: ACTIVE members in its roll call. No staff
 * list carries a total (GET /admin/warehouse-staff is cursor-paged), and the
 * roll call lists every ACTIVE member; a member deactivated later appears only
 * on a day they have a record for, so INACTIVE rows are not counted.
 */
export function activeStaffCount(rollCall: RollCallDto, warehouseId: string): number {
  return rollCall.items.filter((s) => s.warehouseId === warehouseId && s.staffStatus === 'ACTIVE').length;
}
