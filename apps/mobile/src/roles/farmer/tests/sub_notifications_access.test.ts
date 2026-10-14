/**
 * Regression: "In the Sub Warehouse login, the notification bell opens a
 * 'not available / you don't have access' notice instead of the list."
 *
 * Root cause: the Sub shell renders under screen 'AdminMain' (params.adminRole
 * 'SUB_WH_ADMIN') with can={warehouseCan}, but App.tsx only fetched the
 * warehouse permissions on SubWarehouse* / Warehouse* / transfer routes, so
 * inside the shell `can` was makeCan(undefined) and denied everything; the
 * notifications screens gated on notification.own.view and showed the notice.
 *
 * Fix, pinned here:
 *   1. App.tsx loads the permissions for the Sub shell too
 *      (shouldLoadWarehousePermissions).
 *   2. The notifications screens no longer gate VIEWING or mark-read on
 *      notification.own.*: every role holds those codes as `all` in
 *      docs/rbac.json (asserted below, so a change there re-opens this), and
 *      the server enforces them. Per-item action buttons stay gated.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { shouldLoadWarehousePermissions } from '../utils/navigationSession';

const REPO_ROOT = path.join(__dirname, '..', '..', '..', '..', '..', '..');
const APP_SOURCE = fs.readFileSync(path.join(__dirname, '..', 'App.tsx'), 'utf8');
const WAREHOUSE_DIR = path.join(__dirname, '..', '..', 'admin', 'screens', 'warehouse');

function source(relative: string): string {
  return fs.readFileSync(path.join(WAREHOUSE_DIR, relative), 'utf8');
}

/** Source with comment lines dropped, so doc comments naming a code do not count. */
function code(relative: string): string {
  return source(relative)
    .split('\n')
    .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line) && !/^\s*\{\/\*/.test(line))
    .join('\n');
}

describe('shouldLoadWarehousePermissions', () => {
  it('is true for the Sub shell (AdminMain + SUB_WH_ADMIN)', () => {
    expect(shouldLoadWarehousePermissions('AdminMain', { adminRole: 'SUB_WH_ADMIN' })).toBe(true);
  });

  it('is true for every warehouse route it covered before', () => {
    for (const screen of [
      'SubWarehouseSettings',
      'WarehouseMore',
      'WarehouseNotifications',
      'InterWarehouseTransfer',
      'InitiateNewTransfer',
    ]) {
      expect(shouldLoadWarehousePermissions(screen, {})).toBe(true);
    }
  });

  it('is false for other admin shells and non-warehouse screens', () => {
    expect(shouldLoadWarehousePermissions('AdminMain', { adminRole: 'TOHFA_ADMIN' })).toBe(false);
    expect(shouldLoadWarehousePermissions('AdminMain', { adminRole: 'FARMER_ADMIN' })).toBe(false);
    expect(shouldLoadWarehousePermissions('AdminMain', {})).toBe(false);
    expect(shouldLoadWarehousePermissions('AdminMain', undefined)).toBe(false);
    expect(shouldLoadWarehousePermissions('MainTabs', { adminRole: 'SUB_WH_ADMIN' })).toBe(false);
    expect(shouldLoadWarehousePermissions('Login', {})).toBe(false);
  });

  it('App.tsx gates the warehouse /auth/me fetch on it', () => {
    // The fetch now runs inside useWarehousePermissions (retried until it
    // answers); it is enabled exactly when this predicate holds.
    expect(APP_SOURCE).toMatch(/useWarehousePermissions\(\{\s*enabled: shouldLoadWarehousePermissions\(screen, params\),/);
  });
});

describe('notifications screens do not gate on notification.own.* (every role holds it)', () => {
  it('docs/rbac.json grants notification.own.view and mark_read as `all` to every role', () => {
    const rbac = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'docs', 'rbac.json'), 'utf8')) as {
      roles: { code: string }[];
      permissions: { code: string; grants?: Record<string, string> }[];
    };
    const list = rbac.permissions;
    const roles = rbac.roles.map((r) => r.code);
    expect(roles.length).toBeGreaterThan(0);
    for (const permission of ['notification.own.view', 'notification.own.mark_read']) {
      const entry = list.find((p) => p.code === permission);
      expect(entry, permission).toBeDefined();
      for (const role of roles) expect(entry?.grants?.[role], `${permission} for ${role}`).toBe('all');
    }
  });

  const SCREENS = [
    'notifications/NotificationsScreen.tsx',
    'notifications/NotificationDetailScreen.tsx',
    'notifications/ApprovalAlertsScreen.tsx',
    'profile-settings/NotificationSettingsScreen.tsx',
    'profile-settings/SettingsScreen.tsx',
  ];

  it.each(SCREENS)('%s has no can() check on a notification.own code', (file) => {
    const body = code(file);
    expect(body).not.toMatch(/NOTIFICATION_CODES\.(view|markRead)/);
    expect(body).not.toMatch(/PROFILE_CODES\.notificationView/);
    expect(body).not.toMatch(/can\(\s*'notification\.own\./);
  });

  it.each(SCREENS.slice(0, 3))('%s no longer renders the "not available" notice', (file) => {
    expect(code(file)).not.toMatch(/FinanceNotAvailable/);
  });

  it('per-item action buttons stay gated on the target screen code', () => {
    expect(code('notifications/NotificationsScreen.tsx')).toMatch(/canOpenTarget\(can, item\.target\)/);
    expect(code('notifications/NotificationDetailScreen.tsx')).toMatch(/canOpenTarget\(can, target\)/);
    expect(code('notifications/ApprovalAlertsScreen.tsx')).toMatch(/canOpenAlertRecord\(can, alert\.record\)/);
  });
});
