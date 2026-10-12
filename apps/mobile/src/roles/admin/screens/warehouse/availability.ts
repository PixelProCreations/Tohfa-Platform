/**
 * Which warehouse areas the app offers at all. Owner decision (API
 * integration plan, decision 2):
 *
 *   - Five areas have no server API, so they are hidden for every warehouse
 *     admin: material handling, operational issues, warehouse activity,
 *     warehouse documents and inter-warehouse transfers. Their screens stay in
 *     the code (fixture-backed) until an API exists; only the entry points
 *     (button, row, tile, route) are hidden.
 *   - Staff (roster and attendance) is shown only with `admin.staff.list_view`.
 *     docs/rbac.json grants it MAIN_WH_ADMIN `own` and SUB_WH_ADMIN `none`
 *     (owner decision 2026-10-11, superseding the withdrawn
 *     `warehouse.staff.list_view`).
 *
 * Hiding is display only. The server refuses what it has no route for, and
 * authorises everything else on the caller's token (root CLAUDE.md 2.1).
 */
import type { PermissionCheck } from './finance-expenses/types';
import type { StorageRoute } from './storage-ops/types';

export type WarehouseArea =
  | 'materialHandling'
  | 'operationalIssues'
  | 'warehouseActivity'
  | 'warehouseDocuments'
  | 'interWarehouseTransfers'
  | 'staff';

export const AREAS_WITHOUT_API: readonly WarehouseArea[] = [
  'materialHandling',
  'operationalIssues',
  'warehouseActivity',
  'warehouseDocuments',
  'interWarehouseTransfers',
];

/** The docs/rbac.json code that lists the warehouse staff roster. */
export const STAFF_AREA_CODE = 'admin.staff.list_view';

export function isAreaAvailable(area: WarehouseArea, can: PermissionCheck): boolean {
  if (AREAS_WITHOUT_API.includes(area)) return false;
  if (area === 'staff') return can(STAFF_AREA_CODE);
  return true;
}

/**
 * The hidden area a storage-ops route belongs to. ReportIssue and
 * IssueSubmitted are left out on purpose: Help & Support opens them in
 * 'support' mode, which is not the operational-issues area.
 */
const STORAGE_ROUTE_AREA: Partial<Record<StorageRoute, WarehouseArea>> = {
  MaterialHandling: 'materialHandling',
  MaterialDetail: 'materialHandling',
  AddMaterial: 'materialHandling',
  OperationalIssues: 'operationalIssues',
  OperationalIssueDetail: 'operationalIssues',
  Activity: 'warehouseActivity',
  ActivityDetail: 'warehouseActivity',
};

export function storageRouteArea(route: string): WarehouseArea | undefined {
  return Object.prototype.hasOwnProperty.call(STORAGE_ROUTE_AREA, route)
    ? STORAGE_ROUTE_AREA[route as StorageRoute]
    : undefined;
}
