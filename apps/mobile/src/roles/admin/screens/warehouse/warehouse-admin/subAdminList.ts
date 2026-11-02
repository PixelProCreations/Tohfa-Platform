/**
 * Pure helpers of the Sub Warehouse Admins list (design M15-06): the warehouse
 * selector, the search box and the four KPI tiles. No React, so plain-Node
 * vitest covers them (tests/swa_list_m15_06.test.ts).
 *
 * Why the selector and the search filter the loaded rows instead of calling
 * GET /admin/sub-warehouse-admins?warehouseId= again: the screen already holds
 * the whole list (useSubAdmins follows `total` page by page) and it is a
 * handful of rows, at most one per warehouse of the four (BR-23). Filtering
 * here keeps the KPIs, the rows and the unassigned warehouses on one snapshot,
 * and the endpoint has no `q` parameter anyway, so search could not be
 * server-side. Narrowing by warehouse is still a read the server would allow
 * (BR-30: Main sees every warehouse); nothing here widens access.
 */
import type { SubAdminDto } from '../../../api/subAdmins';
import type { WarehouseOption } from '../../../api/warehouseList';
import { combinedSource, countLabel, figureLabel, warehousesWithoutSubAdmin, type FigureSource } from './mappers';

/** Admins whose account is ACTIVE; PENDING and DISABLED accounts are not. */
export function activeSubAdminCount(admins: readonly SubAdminDto[]): number {
  return admins.filter((a) => a.status === 'ACTIVE').length;
}

/** The rows of one warehouse; `undefined` is "All Warehouses". */
export function filterSubAdminsByWarehouse(admins: readonly SubAdminDto[], warehouseId: string | undefined): SubAdminDto[] {
  return warehouseId === undefined ? [...admins] : admins.filter((a) => a.warehouseId === warehouseId);
}

/**
 * Active SUB warehouses with no SWA (the one definition, in ./mappers.ts),
 * limited to the selected warehouse. Always computed from ALL admins first: a
 * warehouse is unassigned because nobody anywhere is assigned to it, not
 * because the filtered rows are empty.
 */
export function unstaffedInSelection(
  options: readonly WarehouseOption[],
  admins: readonly SubAdminDto[],
  warehouseId: string | undefined,
): WarehouseOption[] {
  const unstaffed = warehousesWithoutSubAdmin(options, admins);
  return warehouseId === undefined ? unstaffed : unstaffed.filter((w) => w.warehouseId === warehouseId);
}

function matches(haystacks: readonly (string | null | undefined)[], query: string): boolean {
  return haystacks.some((h) => (h ?? '').toLowerCase().includes(query));
}

/** Case-insensitive, trimmed match on name, admin code and warehouse name. A blank query keeps every row. */
export function filterSubAdmins(
  admins: readonly SubAdminDto[],
  query: string,
  warehouseNameOf: (warehouseId: string) => string,
): SubAdminDto[] {
  const q = query.trim().toLowerCase();
  if (q === '') return [...admins];
  return admins.filter((a) => matches([a.fullName, a.adminCode, warehouseNameOf(a.warehouseId)], q));
}

/** The same search over the warehouses that have no SWA yet (they have no name or code of an admin). */
export function filterUnstaffedWarehouses(unstaffed: readonly WarehouseOption[], query: string): WarehouseOption[] {
  const q = query.trim().toLowerCase();
  if (q === '') return [...unstaffed];
  return unstaffed.filter((w) => matches([w.warehouseName], q));
}

export interface SwaKpiFigures {
  total: number;
  active: number;
  pendingAssignment: number;
  attention: number;
}

/**
 * The four tiles for the selected warehouse. Pending Assignment and Attention
 * Required are the same set by definition: the product's only "needs attention"
 * rule for SWAs is an active SUB warehouse without one (the overview's Needs
 * Attention uses the same function), so both read one list and cannot drift.
 */
export function swaKpiFigures(
  admins: readonly SubAdminDto[],
  options: readonly WarehouseOption[],
  warehouseId: string | undefined,
): SwaKpiFigures {
  const rows = filterSubAdminsByWarehouse(admins, warehouseId);
  const unassigned = unstaffedInSelection(options, admins, warehouseId).length;
  return { total: rows.length, active: activeSubAdminCount(rows), pendingAssignment: unassigned, attention: unassigned };
}

export interface SwaKpiLabelInput {
  admins: FigureSource<readonly SubAdminDto[]>;
  warehouses: FigureSource<readonly WarehouseOption[]>;
  warehouseId: string | undefined;
}

/**
 * The tile text: the count once its sources are here, "…" while they load, "—"
 * when one failed, never a made-up zero. Total and Active need only the admins;
 * the two warehouse tiles need the warehouse list as well, because without it
 * "no warehouse lacks an SWA" would be indistinguishable from "not loaded".
 */
export function swaKpiLabels(input: SwaKpiLabelInput): Record<keyof SwaKpiFigures, string> {
  const { admins, warehouses, warehouseId } = input;
  const both = combinedSource([admins, warehouses]);
  const figures = (): SwaKpiFigures | undefined =>
    admins.data === undefined || warehouses.data === undefined ? undefined : swaKpiFigures(admins.data, warehouses.data, warehouseId);
  const adminOnly = (pick: (rows: readonly SubAdminDto[]) => number) =>
    figureLabel(admins, (rows) => countLabel(pick(filterSubAdminsByWarehouse(rows, warehouseId))));
  const withWarehouses = (pick: (f: SwaKpiFigures) => number) =>
    figureLabel({ ...both, data: figures() }, (f) => countLabel(pick(f)));
  return {
    total: adminOnly((rows) => rows.length),
    active: adminOnly(activeSubAdminCount),
    pendingAssignment: withWarehouses((f) => f.pendingAssignment),
    attention: withWarehouses((f) => f.attention),
  };
}
