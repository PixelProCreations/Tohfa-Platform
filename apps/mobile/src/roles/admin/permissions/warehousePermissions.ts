/**
 * Pure decisions behind loading a warehouse admin's permission list
 * (GET /auth/me `permissions`). Kept free of react-native so plain-Node vitest
 * can pin them; see ../tests/warehousePermissions.test.ts. The React side is
 * ./useWarehousePermissions.ts.
 *
 * Why there is a retry at all: the demo admin sign-in
 * (roles/farmer/screens/auth/LoginScreen.tsx) fires loginWithPassword without
 * awaiting it and opens the shell immediately, so the first /auth/me can run
 * before any token exists. A single fetch then left `can` deny-all for the
 * whole session (Sub shell -> Receiving showed "You do not have permission to
 * view goods receiving").
 *
 * None of this is authority. makeCan only decides what is worth rendering; the
 * server authorises every request on the caller's token (root CLAUDE.md 2.1).
 */
import type { WarehouseScope } from '../screens/warehouse/finance-expenses/types';
import { DEMO_ROLE_PERMISSIONS, type DemoWarehouseRole } from './demoGrants';

/** Delays after the 1st, 2nd and 3rd failed /auth/me (ms). */
export const PERMISSION_RETRY_BACKOFF_MS: readonly number[] = [1000, 2000, 4000];
/** Delay between attempts once the backoff is used up, for as long as the shell is mounted. */
export const PERMISSION_RETRY_STEADY_MS = 10_000;
/** Light poll while no token exists yet (the demo login is still in flight). */
export const PERMISSION_TOKEN_POLL_MS = 1000;
/** The initial attempt plus one per backoff step. */
export const PERMISSION_ATTEMPTS_BEFORE_FALLBACK = PERMISSION_RETRY_BACKOFF_MS.length + 1;

/** Why the last attempt did not produce a list. */
export type PermissionFailure = 'no-credentials' | 'error';

/** Delay before the next attempt, given how many attempts have failed so far (>= 1). */
export function nextPermissionRetryDelay(failures: number, reason: PermissionFailure): number {
  if (reason === 'no-credentials') return PERMISSION_TOKEN_POLL_MS;
  return PERMISSION_RETRY_BACKOFF_MS[failures - 1] ?? PERMISSION_RETRY_STEADY_MS;
}

/** True once the initial attempt and every backoff retry have failed. */
export function permissionAttemptsExhausted(failures: number): boolean {
  return failures >= PERMISSION_ATTEMPTS_BEFORE_FALLBACK;
}

export function isDemoWarehouseRole(role: unknown): role is DemoWarehouseRole {
  return role === 'SUB_WH_ADMIN' || role === 'MAIN_WH_ADMIN';
}

/**
 * One entry of GET /auth/me `roles[]`, structurally. Declared here rather than
 * imported because roles/admin may not import roles/farmer (the farmer
 * `UserRole` satisfies it), and the shared-types `CurrentUserRoleAssignment`
 * does not allow the nulls the server sends for a role without a warehouse.
 */
export interface ScopeRoleAssignment {
  code: string;
  warehouseId?: string | null | undefined;
  warehouseName?: string | null | undefined;
}

/** What the session loader returns: GET /auth/me `permissions` and `roles`. */
export interface WarehouseSessionSnapshot {
  permissions: readonly string[];
  roles: readonly ScopeRoleAssignment[];
}

/**
 * The Sub Warehouse Admin's own warehouse, from the SUB_WH_ADMIN assignment
 * that names one (BR-30). Null when there is none: the account has no Sub
 * role, or the assignment carries no warehouse. Fail closed: there is no demo
 * or default warehouse here, unlike the dev permission fallback below, because
 * a guessed warehouse would label (and later request) someone else's data.
 */
export function subWarehouseScopeFromRoles(
  roles: readonly ScopeRoleAssignment[] | null | undefined,
): WarehouseScope | null {
  const assignment = (roles ?? []).find(
    (r) => r.code === 'SUB_WH_ADMIN' && typeof r.warehouseId === 'string' && r.warehouseId !== '',
  );
  if (assignment === undefined || typeof assignment.warehouseId !== 'string') return null;
  return typeof assignment.warehouseName === 'string' && assignment.warehouseName !== ''
    ? { warehouseId: assignment.warehouseId, warehouseName: assignment.warehouseName }
    : { warehouseId: assignment.warehouseId };
}

/** A fetched permission list, tagged with the session (App's sign-out counter) it was fetched in. */
export interface SessionPermissions {
  sessionKey: unknown;
  list: readonly string[];
  /**
   * The Sub warehouse from the same /auth/me; null (or absent) when the
   * account has none. Optional so a permissions-only record still type-checks;
   * absent reads as "no warehouse" (fail closed), never as "still loading".
   */
  subScope?: WarehouseScope | null | undefined;
}

/**
 * The Sub scope fetched in the current session: undefined while nothing has
 * arrived (or what arrived belongs to a signed-out session), null when the
 * account has no Sub warehouse. Same stale-session rule as
 * permissionsForSession below.
 */
export function subScopeForSession(
  fetched: SessionPermissions | undefined,
  sessionKey: unknown,
): WarehouseScope | null | undefined {
  return fetched !== undefined && fetched.sessionKey === sessionKey ? (fetched.subScope ?? null) : undefined;
}

/**
 * Result of GET /warehouses/{id} for the Sub scope: the human code
 * (`Warehouse.code`, e.g. WH-COON), or null when the lookup failed.
 */
export interface WarehouseCodeLookup {
  sessionKey: unknown;
  warehouseId: string;
  code: string | null;
}

/**
 * The scope the Sub shell renders with: the /auth/me scope plus its warehouse
 * code once the lookup for THIS warehouse in THIS session has settled. Waits
 * (undefined) until then so screens still keyed on fixture codes do not flash
 * empty; a failed lookup keeps the scope without a code rather than blocking.
 */
export function resolveSubScope(
  scope: WarehouseScope | null | undefined,
  lookup: WarehouseCodeLookup | undefined,
  sessionKey: unknown,
): WarehouseScope | null | undefined {
  if (scope === undefined || scope === null) return scope;
  if (lookup === undefined || lookup.sessionKey !== sessionKey || lookup.warehouseId !== scope.warehouseId) {
    return undefined;
  }
  return lookup.code === null ? scope : { ...scope, warehouseCode: lookup.code };
}

/** What WarehouseScopeGate shows. */
export type ScopeGateState = 'loading' | 'error' | 'ready';

/**
 * `failed` is true once every /auth/me attempt has failed. The dev permission
 * fallback may still let `can` render in that case, but it never supplies a
 * scope, so the gate shows the error (with Retry) instead.
 */
export function scopeGateState(scope: WarehouseScope | null | undefined, failed: boolean): ScopeGateState {
  if (scope !== undefined && scope !== null) return 'ready';
  if (scope === null || failed) return 'error';
  return 'loading';
}

/**
 * The fetched list only while the session that fetched it is still current.
 * App.tsx's hook instance outlives a sign-out (App never unmounts), so without
 * this the next admin to sign in on the device would render with the previous
 * admin's permissions until a refetch landed.
 */
export function permissionsForSession(
  fetched: SessionPermissions | undefined,
  sessionKey: unknown,
): readonly string[] | undefined {
  return fetched !== undefined && fetched.sessionKey === sessionKey ? fetched.list : undefined;
}

export interface ResolveWarehousePermissionsInput {
  /** The list /auth/me returned, or undefined while none has arrived. */
  fetched: readonly string[] | undefined;
  /** The demo shell's role (App params.adminRole), if any. */
  adminRole: unknown;
  /** Pass `__DEV__` from the call site. */
  isDev: boolean;
  attemptsExhausted: boolean;
}

export interface ResolvedWarehousePermissions {
  /** Feed to makeCan; undefined denies everything. */
  permissions: readonly string[] | undefined;
  source: 'server' | 'demo' | 'none';
}

/**
 * The list a warehouse shell renders with.
 *
 *   - A real /auth/me list ALWAYS wins (even an empty one).
 *   - Release builds: no list means deny everything. Nothing else.
 *   - Dev builds only, after every retry failed, for a demo warehouse role:
 *     that role's docs/rbac.json grants (./demoGrants.ts, generated). It exists
 *     because the demo login does not wait for a token; it is never '*' and
 *     never another role's grants. The server still refuses whatever the
 *     missing token does not allow, so this only stops the UI from hiding
 *     screens the role is entitled to.
 */
export function resolveWarehousePermissions(input: ResolveWarehousePermissionsInput): ResolvedWarehousePermissions {
  if (input.fetched !== undefined) return { permissions: input.fetched, source: 'server' };
  if (input.isDev && input.attemptsExhausted && isDemoWarehouseRole(input.adminRole)) {
    return { permissions: DEMO_ROLE_PERMISSIONS[input.adminRole], source: 'demo' };
  }
  return { permissions: undefined, source: 'none' };
}
