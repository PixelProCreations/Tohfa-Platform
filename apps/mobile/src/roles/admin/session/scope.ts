/**
 * The admin's warehouse scope, derived from `GET /auth/me`.
 *
 * BR-30: a Sub Warehouse Admin's every read and write is filtered by its
 * assigned warehouse — server-side. The client's job is only to send the
 * right `warehouseId` where a request body or path needs one (e.g.
 * `CashTopupCreate.warehouseId`) and to namespace its cache by it. It always
 * takes that id from here, never from user input.
 *
 * BR-25: a SUB_WH_ADMIN assignment without a warehouse is invalid. We surface
 * that as an error state instead of proceeding "unscoped".
 *
 * SPEC GAP: `/auth/me` returns `warehouseId` and `warehouseName` but not the
 * warehouse `code`. `warehouseCode` starts null and can be filled from
 * `GET /warehouses/{id}` (`Warehouse.code`) via `withWarehouseCode`.
 */
import type { CurrentUserProfile, RoleCode } from '@tohfa/shared-types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Admin role codes, in docs/rbac.json `roles` order. */
const ADMIN_ROLES = [
  'SUPER_ADMIN',
  'TOHFA_ADMIN',
  'FARMER_ADMIN',
  'MAIN_WH_ADMIN',
  'SUB_WH_ADMIN',
] as const;
export type AdminRoleCode = (typeof ADMIN_ROLES)[number];

/** Roles whose assignment must name a warehouse (BR-25). */
const WAREHOUSE_REQUIRED_ROLES: readonly AdminRoleCode[] = ['SUB_WH_ADMIN'];

export interface AdminScope {
  roleCode: AdminRoleCode;
  /** null for an HQ admin with no assigned warehouse. */
  warehouseId: string | null;
  warehouseName: string | null;
  warehouseCode: string | null;
}

export type AdminScopeResult =
  | { kind: 'ok'; scope: AdminScope }
  | { kind: 'error'; reason: 'NOT_ADMIN' | 'WAREHOUSE_REQUIRED' };

function isAdminRole(code: RoleCode | string): code is AdminRoleCode {
  return (ADMIN_ROLES as readonly string[]).includes(code);
}

export function resolveAdminScope(profile: CurrentUserProfile): AdminScopeResult {
  const adminAssignments = profile.roles.filter((r) => isAdminRole(r.code));
  if (adminAssignments.length === 0) return { kind: 'error', reason: 'NOT_ADMIN' };

  // A warehouse-scoped assignment wins: it is the one whose id writes must carry.
  const chosen =
    adminAssignments.find((r) => r.warehouseId !== undefined && r.warehouseId !== null) ??
    adminAssignments[0]!;
  const roleCode = chosen.code as AdminRoleCode;
  const warehouseId = chosen.warehouseId ?? null;

  if (warehouseId !== null && !UUID_RE.test(warehouseId)) {
    return { kind: 'error', reason: 'WAREHOUSE_REQUIRED' };
  }
  if (warehouseId === null && WAREHOUSE_REQUIRED_ROLES.includes(roleCode)) {
    return { kind: 'error', reason: 'WAREHOUSE_REQUIRED' };
  }

  return {
    kind: 'ok',
    scope: {
      roleCode,
      warehouseId,
      warehouseName: warehouseId === null ? null : (chosen.warehouseName ?? null),
      warehouseCode: null,
    },
  };
}

export function withWarehouseCode(
  scope: AdminScope,
  warehouse: { id: string; code: string },
): AdminScope {
  return warehouse.id === scope.warehouseId ? { ...scope, warehouseCode: warehouse.code } : scope;
}
