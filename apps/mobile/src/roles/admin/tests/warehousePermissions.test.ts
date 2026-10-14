/**
 * Regression: "In the Sub Warehouse login, Goods Receiving says you do not have
 * permission to view goods receiving."
 *
 * Root cause: the demo admin sign-in (roles/farmer/screens/auth/LoginScreen.tsx)
 * fires loginWithPassword without awaiting it and opens the shell at once. The
 * shell's single GET /auth/me therefore ran before a token existed (or the demo
 * login never got one), failed, and was only retried on the next App `screen`
 * change. Switching tabs inside the Sub shell is not a screen change, so `can`
 * stayed deny-all and ReceivingDashboardScreen rendered its PermissionNote.
 *
 * These tests pin the pure decisions the fix delegates to
 * ../permissions/warehousePermissions and the generated
 * ../permissions/demoGrants snapshot (checked against docs/rbac.json here).
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { DEMO_ROLE_PERMISSIONS } from '../permissions/demoGrants';
import {
  PERMISSION_ATTEMPTS_BEFORE_FALLBACK,
  PERMISSION_RETRY_BACKOFF_MS,
  PERMISSION_RETRY_STEADY_MS,
  PERMISSION_TOKEN_POLL_MS,
  isDemoWarehouseRole,
  nextPermissionRetryDelay,
  permissionAttemptsExhausted,
  resolveWarehousePermissions,
} from '../permissions/warehousePermissions';

const REPO_ROOT = path.resolve(__dirname, '../../../../../../');
const RBAC_PATH = path.join(REPO_ROOT, 'docs/rbac.json');

interface RbacPermission {
  code: string;
  grants: Record<string, string>;
}

function expectedGrants(role: string): string[] {
  const rbac = JSON.parse(fs.readFileSync(RBAC_PATH, 'utf8')) as { permissions: RbacPermission[] };
  // Same filter as apps/api auth.repo getUserPermissions: scope <> 'none'.
  return rbac.permissions
    .filter((p) => (p.grants[role] ?? 'none') !== 'none')
    .map((p) => p.code)
    .sort();
}

describe('demoGrants snapshot (generated from docs/rbac.json)', () => {
  it('SUB_WH_ADMIN snapshot matches the docs/rbac.json grants that are not none', () => {
    expect([...DEMO_ROLE_PERMISSIONS.SUB_WH_ADMIN].sort()).toEqual(expectedGrants('SUB_WH_ADMIN'));
  });

  it('MAIN_WH_ADMIN snapshot matches the docs/rbac.json grants that are not none', () => {
    expect([...DEMO_ROLE_PERMISSIONS.MAIN_WH_ADMIN].sort()).toEqual(expectedGrants('MAIN_WH_ADMIN'));
  });

  it('only covers the two warehouse roles and never carries a wildcard', () => {
    expect(Object.keys(DEMO_ROLE_PERMISSIONS).sort()).toEqual(['MAIN_WH_ADMIN', 'SUB_WH_ADMIN']);
    for (const codes of Object.values(DEMO_ROLE_PERMISSIONS)) {
      expect(codes).not.toContain('*');
    }
  });

  it('includes the receiving gate codes for the Sub warehouse admin', () => {
    expect(DEMO_ROLE_PERMISSIONS.SUB_WH_ADMIN).toContain('inventory.batch.view');
    expect(DEMO_ROLE_PERMISSIONS.SUB_WH_ADMIN).toContain('inventory.goods_receipt.record');
    expect(DEMO_ROLE_PERMISSIONS.SUB_WH_ADMIN).toContain('inventory.quality_check.perform');
  });
});

describe('permission retry schedule', () => {
  it('backs off 1s / 2s / 4s after errors, then settles on the steady interval', () => {
    expect(PERMISSION_RETRY_BACKOFF_MS).toEqual([1000, 2000, 4000]);
    expect(nextPermissionRetryDelay(1, 'error')).toBe(1000);
    expect(nextPermissionRetryDelay(2, 'error')).toBe(2000);
    expect(nextPermissionRetryDelay(3, 'error')).toBe(4000);
    expect(nextPermissionRetryDelay(4, 'error')).toBe(PERMISSION_RETRY_STEADY_MS);
    expect(nextPermissionRetryDelay(50, 'error')).toBe(PERMISSION_RETRY_STEADY_MS);
    expect(PERMISSION_RETRY_STEADY_MS).toBe(10_000);
  });

  it('polls lightly while there is no token yet (the demo login is still in flight)', () => {
    expect(nextPermissionRetryDelay(1, 'no-credentials')).toBe(PERMISSION_TOKEN_POLL_MS);
    expect(nextPermissionRetryDelay(9, 'no-credentials')).toBe(PERMISSION_TOKEN_POLL_MS);
    expect(PERMISSION_TOKEN_POLL_MS).toBeLessThanOrEqual(1000);
  });

  it('counts the attempts as exhausted after the initial try plus the backoff retries', () => {
    expect(PERMISSION_ATTEMPTS_BEFORE_FALLBACK).toBe(PERMISSION_RETRY_BACKOFF_MS.length + 1);
    expect(permissionAttemptsExhausted(0)).toBe(false);
    expect(permissionAttemptsExhausted(PERMISSION_ATTEMPTS_BEFORE_FALLBACK - 1)).toBe(false);
    expect(permissionAttemptsExhausted(PERMISSION_ATTEMPTS_BEFORE_FALLBACK)).toBe(true);
  });
});

describe('resolveWarehousePermissions', () => {
  const fetched = ['inventory.batch.view'];

  it('a real fetched list always wins, in dev and release, exhausted or not', () => {
    for (const isDev of [true, false]) {
      for (const attemptsExhausted of [true, false]) {
        expect(
          resolveWarehousePermissions({ fetched, adminRole: 'SUB_WH_ADMIN', isDev, attemptsExhausted }),
        ).toEqual({ permissions: fetched, source: 'server' });
      }
    }
  });

  it('a real empty list wins too (the server said no grants)', () => {
    expect(
      resolveWarehousePermissions({ fetched: [], adminRole: 'SUB_WH_ADMIN', isDev: true, attemptsExhausted: true }),
    ).toEqual({ permissions: [], source: 'server' });
  });

  it('release build: a failed /me denies everything, even for a demo role', () => {
    expect(
      resolveWarehousePermissions({ fetched: undefined, adminRole: 'SUB_WH_ADMIN', isDev: false, attemptsExhausted: true }),
    ).toEqual({ permissions: undefined, source: 'none' });
  });

  it('dev build: denies everything while the retries are still running', () => {
    expect(
      resolveWarehousePermissions({ fetched: undefined, adminRole: 'SUB_WH_ADMIN', isDev: true, attemptsExhausted: false }),
    ).toEqual({ permissions: undefined, source: 'none' });
  });

  it('dev build + exhausted + demo role: that role snapshot, never another role', () => {
    expect(
      resolveWarehousePermissions({ fetched: undefined, adminRole: 'SUB_WH_ADMIN', isDev: true, attemptsExhausted: true }),
    ).toEqual({ permissions: DEMO_ROLE_PERMISSIONS.SUB_WH_ADMIN, source: 'demo' });
    expect(
      resolveWarehousePermissions({ fetched: undefined, adminRole: 'MAIN_WH_ADMIN', isDev: true, attemptsExhausted: true }),
    ).toEqual({ permissions: DEMO_ROLE_PERMISSIONS.MAIN_WH_ADMIN, source: 'demo' });
  });

  it('never falls back for a non-warehouse role or no role, and never yields a wildcard', () => {
    for (const adminRole of ['SUPER_ADMIN', 'TOHFA_ADMIN', 'FARMER_ADMIN', 'FARMER', undefined, null, '*']) {
      const result = resolveWarehousePermissions({ fetched: undefined, adminRole, isDev: true, attemptsExhausted: true });
      expect(result).toEqual({ permissions: undefined, source: 'none' });
    }
    expect(isDemoWarehouseRole('SUB_WH_ADMIN')).toBe(true);
    expect(isDemoWarehouseRole('MAIN_WH_ADMIN')).toBe(true);
    expect(isDemoWarehouseRole('SUPER_ADMIN')).toBe(false);
  });
});

describe('shells use the helpers (static source check)', () => {
  const MOBILE_SRC = path.resolve(__dirname, '../../../');
  const read = (rel: string) => fs.readFileSync(path.join(MOBILE_SRC, rel), 'utf8');

  it('App.tsx loads warehouse permissions through useWarehousePermissions, not a one-shot fetchMe', () => {
    const app = read('roles/farmer/App.tsx');
    expect(app).toMatch(/useWarehousePermissions\(/);
    expect(app).not.toMatch(/warehousePermissionsRequested/);
  });

  it('the Main shell builds its can from useWarehousePermissions with the MAIN_WH_ADMIN role', () => {
    const main = read('roles/admin/screens/dashboard/MainWarehouseAdminDashboardScreen.tsx');
    expect(main).toMatch(/useWarehousePermissions\(/);
    expect(main).toMatch(/adminRole:\s*'MAIN_WH_ADMIN'/);
  });

  it('the hook resolves through resolveWarehousePermissions and passes __DEV__ only from the call sites', () => {
    const hook = read('roles/admin/permissions/useWarehousePermissions.ts');
    expect(hook).toMatch(/resolveWarehousePermissions\(/);
    expect(hook).toMatch(/nextPermissionRetryDelay\(/);
    expect(read('roles/farmer/App.tsx')).toMatch(/isDev:\s*__DEV__/);
    expect(read('roles/admin/screens/dashboard/MainWarehouseAdminDashboardScreen.tsx')).toMatch(/isDev:\s*__DEV__/);
  });
});
