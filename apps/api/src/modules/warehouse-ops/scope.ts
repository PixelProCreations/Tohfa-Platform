/**
 * Warehouse visibility shared by every warehouse-ops service.
 *
 * Two rules, both from BR-30 / BR-66:
 *  - a scope that carries ASSIGNED warehouses is narrowed to them even when the permission's grant is
 *    `all` (docs/rbac.json `scopeFilters`: every query of a warehouse-dimension admin is filtered by its
 *    assigned warehouse). `warehouseScopeFilter` alone would treat `all` as unfiltered;
 *  - a warehouse the caller cannot reach and a warehouse that does not exist are the SAME 404, so the
 *    response never confirms that an id exists (a 403 would).
 *
 * A Main/Super/Tohfa admin has no warehouse dimension and reaches all four (for Main this was
 * confirmed by the owner 2026-10-11; see `apps/api/src/rbac/warehouseScope.ts`).
 */
import { ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { isWarehouseConfinable, warehouseVisible } from '../../rbac/warehouseScope.js';

export function confineToAssignedWarehouses(scope: ResolvedScope): ResolvedScope {
  const widened = scope.level === ScopeLevel.ALL || scope.level === ScopeLevel.CONDITIONAL;
  if (widened && scope.warehouseIds.length > 0) return { ...scope, level: ScopeLevel.OWN };
  return scope;
}

/**
 * The warehouse ids a list must be narrowed to, or null for "every warehouse". The SQL twin of
 * `warehouseVisible` for an already-confined scope: a scope that is not a warehouse admin's (farmer,
 * customer, Farmer Admin; decided by rbac.json `scopeDimension`) sees nothing, an
 * `all`/`conditional` scope everything, an `own` scope its assigned warehouses (none assigned on a
 * warehouse-admin `own` grant means all four, as `warehouseScopeFilter`).
 */
export function visibleWarehouseIds(confined: ResolvedScope): string[] | null {
  if (!isWarehouseConfinable(confined)) return [];
  if (confined.level === ScopeLevel.ALL || confined.level === ScopeLevel.CONDITIONAL) return null;
  return confined.warehouseIds.length > 0 ? confined.warehouseIds : null;
}

export function warehouseNotFound(warehouseId: string): AppError {
  return new AppError('NOT_FOUND', { detail: `No warehouse with id ${warehouseId} is visible to you.` });
}

/** True when the warehouse row exists and is not soft-deleted. */
export async function warehouseExists(db: Executor, warehouseId: string): Promise<boolean> {
  const result = await db.query(`SELECT 1 FROM warehouses WHERE id = $1 AND deleted_at IS NULL`, [warehouseId]);
  return result.rowCount === 1;
}

/**
 * Returns the confined scope when the caller may reach the warehouse, else throws the one 404.
 * The scope check runs first so a probe of another warehouse never reaches the database.
 */
export async function requireReachableWarehouse(
  db: Executor,
  scope: ResolvedScope,
  warehouseId: string,
): Promise<ResolvedScope> {
  const confined = confineToAssignedWarehouses(scope);
  if (!warehouseVisible(confined, warehouseId)) throw warehouseNotFound(warehouseId);
  if (!(await warehouseExists(db, warehouseId))) throw warehouseNotFound(warehouseId);
  return confined;
}
