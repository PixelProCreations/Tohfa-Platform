/**
 * Regression: "In the Sub Warehouse login, some More tabs go to the login page."
 *
 * Root cause: every More row that leaves the Sub shell lands on an App route
 * ('SubWarehouseCustomerList', 'SubWarehouseSettings', ...). The first such
 * route fires GET /auth/me for the warehouse permissions; a 401 there (or from
 * any API call the screen makes on mount) runs the shared client's failed-refresh
 * path, and App.tsx's auth-failure handler bounced every screen except the five
 * admin dashboards to 'Welcome' (the Login / Create account page). These tests
 * pin the pure decisions App.tsx now delegates to ../utils/navigationSession.
 *
 * That 401 only happened because the demo sign-in opened the shell before any
 * token existed. The demo sign-in is gone (every admin login is awaited), so a
 * failed refresh on these routes now means the session really is dead and the
 * admin goes to Login, not the Welcome / Create account page. The render-branch
 * check below still guards the original "no fall-through" half of the bug.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  emptyHistoryBackTarget,
  isWarehouseAdminScreen,
  authFailureTarget,
  resetsHistoryOn,
} from '../utils/navigationSession';

const APP_SOURCE = fs.readFileSync(path.join(__dirname, '..', 'App.tsx'), 'utf8');

/** Every App-route key the warehouse More menu (App.tsx 'WarehouseMore' and the Sub shell's More tab) navigates to. */
function moreMenuKeys(): string[] {
  const start = APP_SOURCE.indexOf("screen === 'WarehouseMore' ? (");
  const end = APP_SOURCE.indexOf('/>', start);
  expect(start).toBeGreaterThan(-1);
  const block = APP_SOURCE.slice(start, end);
  const keys = [...block.matchAll(/navigate\('([A-Za-z]+)'\)/g)].map((m) => m[1] as string);

  const shellSource = fs.readFileSync(
    path.join(__dirname, '..', '..', 'admin', 'screens', 'dashboard', 'SubWarehouseAdminDashboardScreen.tsx'),
    'utf8',
  );
  const shellStart = shellSource.indexOf('<MoreScreen');
  const shellEnd = shellSource.indexOf('onLogout={onSignOut}', shellStart);
  expect(shellStart).toBeGreaterThan(-1);
  const shellKeys = [...shellSource.slice(shellStart, shellEnd).matchAll(/onNavigate\('([A-Za-z]+)'\)/g)].map(
    (m) => m[1] as string,
  );
  return [...new Set([...keys, ...shellKeys])];
}

describe('Sub warehouse More menu and a dead session', () => {
  it('a failed token refresh on any More destination sends the admin to Login, not Welcome', () => {
    const keys = moreMenuKeys().filter((k) => k !== 'Login');
    expect(keys.length).toBeGreaterThan(10);
    for (const key of keys) {
      expect({ key, target: authFailureTarget(key) }).toEqual({ key, target: 'Login' });
    }
  });

  it('every More destination key has a render branch in App.tsx (no fall-through)', () => {
    for (const key of moreMenuKeys()) {
      const routed =
        APP_SOURCE.includes(`screen === '${key}'`) || new RegExp(`^\\s+${key}: `, 'm').test(APP_SOURCE);
      expect({ key, routed }).toEqual({ key, routed: true });
    }
  });

  it('App.tsx delegates its auth-failure and back decisions to the tested helpers', () => {
    expect(APP_SOURCE).toContain('authFailureTarget(prev)');
    expect(APP_SOURCE).toContain('resetsHistoryOn(nextScreen)');
    expect(APP_SOURCE).toContain('emptyHistoryBackTarget(screen)');
  });

  it('the admin dashboards go to Login; farmer and customer screens still go to Welcome', () => {
    for (const s of ['AdminMain', 'SuperAdminDashboard', 'SubWarehouseAdminDashboard', 'MainWarehouseAdminDashboard']) {
      expect(authFailureTarget(s)).toBe('Login');
    }
    for (const s of ['MainTabs', 'Notifications', 'CreateListing', 'CustomerMain']) {
      expect(authFailureTarget(s)).toBe('Welcome');
    }
  });

  it('classifies warehouse-admin screens by key', () => {
    expect(isWarehouseAdminScreen('WarehouseMore')).toBe(true);
    expect(isWarehouseAdminScreen('SubWarehouseSettings')).toBe(true);
    expect(isWarehouseAdminScreen('InterWarehouseTransfer')).toBe(true);
    expect(isWarehouseAdminScreen('Login')).toBe(false);
  });
});

describe('back stack after sign-in / sign-out', () => {
  it('signing in (AdminMain) and signing out (Login) start a fresh history, so back never pops to Login', () => {
    expect(resetsHistoryOn('AdminMain')).toBe(true);
    expect(resetsHistoryOn('Login')).toBe(true);
    expect(resetsHistoryOn('MainTabs')).toBe(true);
    expect(resetsHistoryOn('SubWarehouseCustomerList')).toBe(false);
  });

  it('back with an empty history returns a warehouse screen to its dashboard, never the farmer tabs', () => {
    expect(emptyHistoryBackTarget('SubWarehouseSettings')).toBe('SubWarehouseAdminDashboard');
    expect(emptyHistoryBackTarget('WarehouseMore')).toBe('SubWarehouseAdminDashboard');
    expect(emptyHistoryBackTarget('MainWarehouseInventory')).toBe('MainWarehouseAdminDashboard');
    expect(emptyHistoryBackTarget('AdminMain')).toBeNull();
    expect(emptyHistoryBackTarget('SubWarehouseAdminDashboard')).toBeNull();
    expect(emptyHistoryBackTarget('Login')).toBe('Welcome');
    expect(emptyHistoryBackTarget('MainTabs')).toBeNull();
    expect(emptyHistoryBackTarget('Notifications')).toBe('MainTabs');
  });
});
