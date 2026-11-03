/**
 * BR-135: role exclusivity (owner rule 2026-11-03, final). A user holds exactly one role, except
 * that the roles of one group of docs/rbac.json `allowedRoleCombinations` (today FARMER,
 * FARMER_ADMIN and CUSTOMER) may be held together in any combination. Every other role
 * (SUPER_ADMIN, TOHFA_ADMIN, MAIN_WH_ADMIN, SUB_WH_ADMIN) is held alone. A live `farmers` row
 * counts as holding the farmer role.
 *
 * WHY: the access token's farmerId comes from the `farmers` row, and a scope that carries a
 * farmerId is never confined to a warehouse (rbac/warehouseScope.ts fails closed on it). A Sub
 * Warehouse Admin who was also a farmer got 404 "Warehouse not found" on its own warehouse. More
 * generally, resolveScope merges every role an account holds, so a staff admin role must never sit
 * beside another role. The scope code is right; the data must not exist.
 *
 * Callers (service layer) load the account's live role codes and whether it has a live farmers
 * row, then call `assertMayGrantRole` before writing. Migration 0083 enforces the same rule in the
 * database as the last line of defence.
 */
import { isAllowedRoleSet, loadRbac } from './loadRbac.js';
import { AppError } from '../http/problem.js';

export interface RoleHolding {
  /** Codes of the account's live role assignments, before the change. */
  readonly roles: readonly string[];
  /** True when the account has a `farmers` row that is not soft-deleted. */
  readonly hasLiveFarmer: boolean;
}

export interface GrantOptions {
  /** A role the same change ends (a promotion's `fromRole`): it is not part of the resulting set. */
  readonly ending?: string;
}

/** The farmer role: the docs/rbac.json role scoped to the actor's own farmer row. */
export function farmerRoleCode(): string {
  const farmerRoles = loadRbac().document.roles.filter((role) => role.scopeDimension === 'farmer_id');
  if (farmerRoles.length !== 1) {
    throw new Error(`docs/rbac.json must declare exactly one farmer_id-scoped role, found ${farmerRoles.length}`);
  }
  return farmerRoles[0]!.code;
}

/**
 * The distinct roles the account holds once the change is made: its live roles, minus `ending`,
 * plus `grant`, plus the farmer role when it keeps a live farmers row.
 */
export function resultingRoleSet(holding: RoleHolding, grant: string, ending?: string): string[] {
  const result = new Set(holding.roles.filter((code) => code !== ending));
  result.add(grant);
  if (holding.hasLiveFarmer) result.add(farmerRoleCode());
  return [...result];
}

/**
 * Throws 409 CONFLICT (`meta.rule = 'BR-135'`) when giving `roleCode` to an account holding
 * `holding` would leave it with a role set docs/rbac.json does not allow. Creating a `farmers` row
 * for an account is checked as a grant of the farmer role.
 */
export function assertMayGrantRole(holding: RoleHolding, roleCode: string, options: GrantOptions = {}): void {
  const result = resultingRoleSet(holding, roleCode, options.ending);
  if (isAllowedRoleSet(result)) return;

  const others = result.filter((code) => code !== roleCode).sort();
  throw new AppError('CONFLICT', {
    detail: `This account cannot hold ${roleCode} together with ${others.join(', ')}.`,
    meta: { rule: 'BR-135', role: roleCode },
  });
}
