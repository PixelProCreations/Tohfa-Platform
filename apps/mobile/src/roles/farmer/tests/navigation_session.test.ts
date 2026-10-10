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
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  emptyHistoryBackTarget,
  isWarehouseAdminScreen,
  keepsScreenOnAuthFailure,
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
    path.join(__dirname, '..', '..', 'subwarehouse', 'screens', 'SubWarehouseAdminDashboardScreen.tsx'),
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

describe('Sub warehouse More menu never lands on the login page', () => {
  it('a 401 / failed /auth/me on any More destination keeps the admin on that screen', () => {
    const keys = moreMenuKeys().filter((k) => k !== 'Login');
    expect(keys.length).toBeGreaterThan(10);
    for (const key of keys) {
      expect({ key, kept: keepsScreenOnAuthFailure(key) }).toEqual({ key, kept: true });
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
    expect(APP_SOURCE).toContain('keepsScreenOnAuthFailure(prev)');
    expect(APP_SOURCE).toContain('resetsHistoryOn(nextScreen)');
    expect(APP_SOURCE).toContain('emptyHistoryBackTarget(screen)');
  });

  it('the old admin dashboards are still kept; farmer and customer screens still go to Welcome', () => {
    for (const s of ['AdminMain', 'SuperAdminDashboard', 'SubWarehouseAdminDashboard', 'MainWarehouseAdminDashboard']) {
      expect(keepsScreenOnAuthFailure(s)).toBe(true);
    }
    for (const s of ['MainTabs', 'Notifications', 'CreateListing', 'CustomerMain']) {
      expect(keepsScreenOnAuthFailure(s)).toBe(false);
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
