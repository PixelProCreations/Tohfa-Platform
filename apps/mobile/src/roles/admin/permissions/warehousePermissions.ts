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
