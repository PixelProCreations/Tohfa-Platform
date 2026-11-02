/**
 * BR-135: role exclusivity. Only a Farmer Admin (an elected farmer) may also be a farmer. A user
 * holding a role marked `excludesEndUserRoles` in docs/rbac.json (SUPER_ADMIN, TOHFA_ADMIN,
 * MAIN_WH_ADMIN, SUB_WH_ADMIN) never also holds an end-user role (the farmer- and customer-scoped
 * roles: FARMER, CUSTOMER) and never has a live `farmers` row.
 *
 * WHY: the access token's farmerId comes from the `farmers` row, and a scope that carries a
 * farmerId is never confined to a warehouse (rbac/warehouseScope.ts fails closed on it). A Sub
 * Warehouse Admin who was also a farmer got 404 "Warehouse not found" on its own warehouse. The
 * scope code is right; the data must not exist.
 *
 * Combinations of two admin roles are NOT restricted here (open contradiction 33 in docs/rules.md).
 *
 * Callers (service layer) load the account's live role codes and whether it has a live farmers
 * row, then call `assertMayGrantRole` before writing. Migration 0082 enforces the same rule in the
 * database as the last line of defence.
 */
import { loadRbac } from './loadRbac.js';
import { AppError } from '../http/problem.js';

export interface RoleHolding {
  /** Codes of the account's live role assignments, before the grant. */
  readonly roles: readonly string[];
  /** True when the account has a `farmers` row that is not soft-deleted. */
  readonly hasLiveFarmer: boolean;
}

/** Roles marked `excludesEndUserRoles: true` in docs/rbac.json. */
export function singleRoleAdminCodes(): ReadonlySet<string> {
  return new Set(loadRbac().document.roles.filter((role) => role.excludesEndUserRoles === true).map((role) => role.code));
}

/** The end-user roles: those scoped to the actor's own farmer or customer row in docs/rbac.json. */
export function endUserRoleCodes(): ReadonlySet<string> {
  return new Set(
    loadRbac()
      .document.roles.filter((role) => role.scopeDimension === 'farmer_id' || role.scopeDimension === 'customer_id')
      .map((role) => role.code),
  );
}

function refuse(detail: string, roleCode: string): AppError {
  return new AppError('CONFLICT', { detail, meta: { rule: 'BR-135', role: roleCode } });
}

/**
 * Throws 409 CONFLICT when giving `roleCode` to an account holding `holding` would break BR-135.
 * Creating a `farmers` row for an account is checked as a grant of FARMER.
 */
export function assertMayGrantRole(holding: RoleHolding, roleCode: string): void {
  const singleRoleAdmins = singleRoleAdminCodes();
  const endUserRoles = endUserRoleCodes();

  if (singleRoleAdmins.has(roleCode)) {
    const endUserRole = holding.roles.find((code) => endUserRoles.has(code));
    if (endUserRole !== undefined || holding.hasLiveFarmer) {
      throw refuse(
        `A ${roleCode} account cannot also be a farmer or a customer; this account is ${endUserRole ?? 'a farmer'}.`,
        roleCode,
      );
    }
  }

  if (endUserRoles.has(roleCode)) {
    const admin = holding.roles.find((code) => singleRoleAdmins.has(code));
    if (admin !== undefined) {
      throw refuse(`A ${admin} account cannot also be a ${roleCode}.`, roleCode);
    }
  }
}
