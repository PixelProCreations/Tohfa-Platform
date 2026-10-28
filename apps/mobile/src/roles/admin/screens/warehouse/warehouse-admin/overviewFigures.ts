/**
 * The near-full capacity tone shared by the Main admin's warehouse views: the
 * Home "Warehouse Overview" bars (D01) and the Warehouse Overview cards (D02,
 * ./WarehouseOverviewScreen). Ported from the Dev lineage (PR #139,
 * overviewFigures.ts; only the capacity part, the staff / storage-area figures
 * are not on these screens). No React, no react-native, so plain-Node vitest
 * covers every decision (tests/overviewFigures_warehouseAdmin.test.ts).
 */
import type { AlertItemDto } from '../../../api/alerts';
import type { WarehouseCapacityDto } from '../../../api/warehouses';
import { parseKgToGrams } from '../../../money/quantity';

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
