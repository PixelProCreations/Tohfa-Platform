/**
 * Warehouse filter for the warehouse-admin read endpoints (finance, reports, warehouses...).
 *
 * `scopedWhere` fails closed (`FALSE`) when a restricted scope has no warehouse ids. That is
 * right for farmers and customers, but wrong for MAIN_WH_ADMIN: that role has no warehouse
 * dimension in docs/rbac.json (`scopeDimension: null`), so an `own` grant on it - for example
 * `finance.sales_income.view` - has nothing to be confined to.
 *
 * A warehouse-admin `own` grant with no assigned warehouse means "all four warehouses".
 * Confirmed by the owner 2026-10-11: a Main Warehouse Admin sees all four warehouses. It is safe
 * here because
 *  - SUB_WH_ADMIN with a non-`all` scope and no warehouse never gets this far: requirePermission
 *    throws WAREHOUSE_SCOPE_VIOLATION for it, and
 *  - a scope whose winning role is not a warehouse admin or above is never widened (it fails
 *    closed), see `isWarehouseConfinable` below.
 * Use this ONLY for endpoints whose permission is granted to warehouse admins.
 */
import { ScopeLevel } from '@tohfa/shared-types';
import { loadRbac } from './loadRbac.js';
import type { ResolvedScope } from './requirePermission.js';

export interface WarehouseScopeFilter {
  sql: string;
  params: unknown[];
  nextIndex: number;
}

/**
 * May this scope be read as "a warehouse admin or above"? Decided by the WINNING role's
 * `scopeDimension` in docs/rbac.json, never by a role name: `null` (Super, TOHFA, Main) and
 * `warehouse_id` (Sub) are warehouse-shaped; `zone_id`, `farmer_id` and `customer_id` are not,
 * and such a scope fails closed here whatever its level.
 *
 * Why not just "has a customerId / farmerId": a self-registered customer has no customers row,
 * so its token carries customerId = null and resolveScope leaves the key off. Keying the fail-closed
 * on the id's PRESENCE let exactly that customer fall through to TRUE and read every order on
 * GET /admin/orders (CUSTOMER is `own` on order.list.view_all). The role dimension is always there.
 * The id checks stay as a belt-and-braces second condition.
 */
function isWarehouseConfinable(scope: ResolvedScope): boolean {
  if (scope.farmerId !== undefined || scope.customerId !== undefined) return false;
  const role = loadRbac().rolesByCode.get(scope.roleCode);
  if (role === undefined) return false;
  return role.scopeDimension === null || role.scopeDimension === 'warehouse_id';
}

export function warehouseScopeFilter(
  scope: ResolvedScope,
  column: string,
  startIndex = 1,
): WarehouseScopeFilter {
  if (!isWarehouseConfinable(scope)) return { sql: 'FALSE', params: [], nextIndex: startIndex };
  if (scope.level === ScopeLevel.ALL || scope.level === ScopeLevel.CONDITIONAL) {
    return { sql: 'TRUE', params: [], nextIndex: startIndex };
  }
  if (scope.warehouseIds.length > 0) {
    return {
      sql: `${column} = ANY($${startIndex}::uuid[])`,
      params: [scope.warehouseIds],
      nextIndex: startIndex + 1,
    };
  }
  return { sql: 'TRUE', params: [], nextIndex: startIndex };
}

/** Row-level twin of `warehouseScopeFilter`, for a row that was already loaded by id. */
export function warehouseVisible(scope: ResolvedScope, warehouseId: string | null): boolean {
  if (!isWarehouseConfinable(scope)) return false;
  if (scope.level === ScopeLevel.ALL || scope.level === ScopeLevel.CONDITIONAL) return true;
  if (scope.warehouseIds.length > 0) return warehouseId !== null && scope.warehouseIds.includes(warehouseId);
  return true;
}
