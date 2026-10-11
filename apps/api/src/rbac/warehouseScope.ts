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
 *  - a scope that carries a farmer or customer id is never widened (it fails closed).
 * Use this ONLY for endpoints whose permission is granted to warehouse admins.
 */
import { ScopeLevel } from '@tohfa/shared-types';
import type { ResolvedScope } from './requirePermission.js';

export interface WarehouseScopeFilter {
  sql: string;
  params: unknown[];
  nextIndex: number;
}

function isOwnerScoped(scope: ResolvedScope): boolean {
  return scope.farmerId !== undefined || scope.customerId !== undefined;
}

export function warehouseScopeFilter(
  scope: ResolvedScope,
  column: string,
  startIndex = 1,
): WarehouseScopeFilter {
  if (isOwnerScoped(scope)) return { sql: 'FALSE', params: [], nextIndex: startIndex };
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
  if (isOwnerScoped(scope)) return false;
  if (scope.level === ScopeLevel.ALL || scope.level === ScopeLevel.CONDITIONAL) return true;
  if (scope.warehouseIds.length > 0) return warehouseId !== null && scope.warehouseIds.includes(warehouseId);
  return true;
}
