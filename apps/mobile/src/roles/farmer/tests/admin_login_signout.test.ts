/**
 * Admin login and warehouse sign-out, the pure pieces.
 *
 * Before this change the LoginScreen opened an admin shell from what was TYPED
 * (mobile number suffixes, the words "sub" / "main" / "ooty" / "coonoor"),
 * fired loginWithPassword without awaiting it, and an unknown admin role fell
 * through to the Super Admin dashboard. Every warehouse sign-out only
 * navigated, so the Keychain tokens and the server session survived it and a
 * cold start restored the previous admin. These tests pin the replacements:
 *
 *   - the shell comes from the role the SERVER returned (adminShellForRole),
 *     and anything it does not recognise is null, never SUPER_ADMIN;
 *   - the shortcut cannot come back into LoginScreen;
 *   - sign-out always clears local state and leaves, even if revoking fails;
 *   - a failed token refresh on an admin/warehouse route goes to Login;
 *   - the warehouse permission cache is keyed to the session that fetched it.
 */
import { describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  ADMIN_SHELL_ROLES,
  adminShellForRole,
  adminShellForRoles,
  preferredRoleForSelection,
} from '../utils/adminShell';
import { endSession } from '../utils/signOut';
import { authFailureTarget } from '../utils/navigationSession';
import { permissionsForSession } from '../../admin/permissions/warehousePermissions';

const FARMER_DIR = path.join(__dirname, '..');
const REPO_ROOT = path.join(__dirname, '..', '..', '..', '..', '..', '..');
const LOGIN_SOURCE = fs.readFileSync(path.join(FARMER_DIR, 'screens', 'auth', 'LoginScreen.tsx'), 'utf8');
const APP_SOURCE = fs.readFileSync(path.join(FARMER_DIR, 'App.tsx'), 'utf8');

describe('adminShellForRole: the admin shell comes from the server role, fail-closed', () => {
  it('maps each of the five admin role codes in docs/rbac.json to its own shell', () => {
    const rbac = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'docs', 'rbac.json'), 'utf8')) as {
      roles: { code: string }[];
    };
    const adminCodes = rbac.roles.map((r) => r.code).filter((c) => c !== 'FARMER' && c !== 'CUSTOMER');
    expect([...ADMIN_SHELL_ROLES].sort()).toEqual([...adminCodes].sort());
    for (const code of adminCodes) {
      expect(adminShellForRole(code)).toBe(code);
    }
  });

  it('an unknown role gives null and never falls back to SUPER_ADMIN', () => {
    for (const unknown of ['SA', 'MW', 'super_admin', 'SuperAdmin', 'WAREHOUSE_STAFF', 'FARMER', 'CUSTOMER', '', ' SUPER_ADMIN']) {
      expect({ unknown, shell: adminShellForRole(unknown) }).toEqual({ unknown, shell: null });
    }
  });

  it('no role at all gives null', () => {
    for (const none of [undefined, null, 0, {}, []]) {
      expect(adminShellForRole(none)).toBeNull();
    }
  });

  it('adminShellForRoles reads the first admin role the server listed, or null', () => {
    expect(adminShellForRoles([{ code: 'SUB_WH_ADMIN' }])).toBe('SUB_WH_ADMIN');
    expect(adminShellForRoles([{ code: 'FARMER' }, { code: 'MAIN_WH_ADMIN' }])).toBe('MAIN_WH_ADMIN');
    expect(adminShellForRoles([{ code: 'FARMER' }])).toBeNull();
    expect(adminShellForRoles([{ code: 'SA' }])).toBeNull();
    expect(adminShellForRoles([])).toBeNull();
    expect(adminShellForRoles(undefined)).toBeNull();
    expect(adminShellForRoles(null)).toBeNull();
  });
});

describe('preferredRoleForSelection: the existing no-picker role choice, unchanged', () => {
  it('a multi-role admin (dev seed: admin + FARMER) gets the admin role', () => {
    expect(preferredRoleForSelection([{ code: 'FARMER' }, { code: 'SUB_WH_ADMIN' }])).toBe('SUB_WH_ADMIN');
    expect(preferredRoleForSelection([{ code: 'MAIN_WH_ADMIN' }, { code: 'FARMER' }])).toBe('MAIN_WH_ADMIN');
  });

  it('with two admin roles it takes the first one the server listed', () => {
    expect(preferredRoleForSelection([{ code: 'TOHFA_ADMIN' }, { code: 'FARMER_ADMIN' }])).toBe('TOHFA_ADMIN');
  });

  it('with no admin role it takes the first role; with none, null', () => {
    expect(preferredRoleForSelection([{ code: 'FARMER' }, { code: 'CUSTOMER' }])).toBe('FARMER');
    expect(preferredRoleForSelection([])).toBeNull();
  });
});

describe('LoginScreen: the demo shortcut is gone', () => {
  it('opens no admin shell from what was typed', () => {
    expect(LOGIN_SOURCE).not.toMatch(/endsWith\(/);
    expect(LOGIN_SOURCE).not.toMatch(/toLowerCase\(\)\.includes\(/);
    expect(LOGIN_SOURCE).not.toMatch(/98000000\d/);
    expect(LOGIN_SOURCE).not.toMatch(/'(sub|main|ooty|coonoor)'/);
    expect(LOGIN_SOURCE).not.toMatch(/onNavigate\('AdminMain'/);
    expect(LOGIN_SOURCE).not.toMatch(/adminRole:\s*'/);
  });

  it('never fires a login without awaiting it or swallows its error', () => {
    expect(LOGIN_SOURCE).not.toMatch(/\.catch\(\s*\(\)\s*=>\s*\{\s*\}\s*\)/);
    const calls = [...LOGIN_SOURCE.matchAll(/(\S+)\s+loginWithPassword\(/g)].map((m) => m[1]);
    expect(calls.length).toBeGreaterThan(0);
    for (const before of calls) expect(before).toBe('await');
  });

  it('routes a password login from the roles the login response carried', () => {
    expect(LOGIN_SOURCE).toMatch(/resolveRouteAfterLogin\(outcome, me\)/);
    expect(LOGIN_SOURCE).toMatch(/preferredRoleForSelection\(outcome\.availableRoles\)/);
  });
});

describe('endSession: sign-out always clears and leaves', () => {
  it('runs revoke, then forgets the session and leaves', async () => {
    const order: string[] = [];
    await endSession({
      revoke: async () => {
        order.push('revoke');
      },
      forget: () => order.push('forget'),
      leave: () => order.push('leave'),
    });
    expect(order).toEqual(['revoke', 'forget', 'leave']);
  });

  it('still forgets and leaves when revoking rejects (offline, Keychain error)', async () => {
    const forget = vi.fn();
    const leave = vi.fn();
    await expect(
      endSession({
        revoke: () => Promise.reject(new Error('network unavailable')),
        forget,
        leave,
      }),
    ).resolves.toBeUndefined();
    expect(forget).toHaveBeenCalledTimes(1);
    expect(leave).toHaveBeenCalledTimes(1);
  });
});

describe('App.tsx: every admin and warehouse sign-out ends the session', () => {
  const ADMIN_HOSTS = [
    'SuperAdminDashboardScreen',
    'TohfaAdminDashboardScreen',
    'FarmerAdminDashboardScreen',
    'MainWarehouseAdminDashboardScreen',
    'SubWarehouseAdminDashboardScreen',
    'ProfileFlow',
    'MoreScreen',
  ];

  /** [component, prop value] for every onSignOut= / onLogout= prop in App.tsx. */
  function signOutProps(): [string, string][] {
    const out: [string, string][] = [];
    for (const m of APP_SOURCE.matchAll(/on(?:SignOut|Logout)=\{([^\n]*)\}\s*$/gm)) {
      const before = APP_SOURCE.slice(0, m.index);
      const host = [...before.matchAll(/<([A-Z][A-Za-z]+)\b/g)].pop()?.[1] ?? '?';
      out.push([host, m[1] as string]);
    }
    return out;
  }

  it('each admin host gets signOutTo(...), never a bare navigate', () => {
    const props = signOutProps().filter(([host]) => ADMIN_HOSTS.includes(host));
    const hostsSeen = new Set(props.map(([host]) => host));
    for (const host of ADMIN_HOSTS) expect({ host, seen: hostsSeen.has(host) }).toEqual({ host, seen: true });
    for (const [host, value] of props) {
      expect({ host, value, ends: /^\(\) => signOutTo\('(Login|Welcome)'\)$/.test(value) }).toEqual({
        host,
        value,
        ends: true,
      });
    }
  });

  it('signOutTo runs logout() through endSession and drops the permission cache', () => {
    expect(APP_SOURCE).toMatch(/endSession\(\{\s*revoke: logout,/);
    expect(APP_SOURCE).toMatch(/sessionKey: sessionEpoch/);
  });

  it('an AdminMain with no recognised role renders no admin shell', () => {
    expect(APP_SOURCE).toMatch(/const adminShell = adminShellForRole\(params\['adminRole'\]\)/);
    expect(APP_SOURCE).not.toMatch(/params\['adminRole'\] === 'TOHFA_ADMIN' \?/);
  });
});

describe('authFailureTarget: a dead session on an admin route goes to Login', () => {
  it('admin dashboards and warehouse routes go to Login', () => {
    for (const s of [
      'AdminMain',
      'SuperAdminDashboard',
      'TohfaAdminDashboard',
      'FarmerAdminDashboard',
      'MainWarehouseAdminDashboard',
      'SubWarehouseAdminDashboard',
      'SubWarehouseSettings',
      'WarehouseMore',
      'MainWarehouseInventory',
      'InterWarehouseTransfer',
    ]) {
      expect({ s, target: authFailureTarget(s) }).toEqual({ s, target: 'Login' });
    }
  });

  it('farmer and customer screens keep going to Welcome', () => {
    for (const s of ['MainTabs', 'Notifications', 'CreateListing', 'CustomerMain']) {
      expect({ s, target: authFailureTarget(s) }).toEqual({ s, target: 'Welcome' });
    }
  });
});

describe('permissionsForSession: a permission list belongs to the session that fetched it', () => {
  it('returns the list for the same session', () => {
    expect(permissionsForSession({ sessionKey: 3, list: ['a'] }, 3)).toEqual(['a']);
  });

  it('drops the previous admin list after a sign-out bumps the session', () => {
    expect(permissionsForSession({ sessionKey: 3, list: ['a'] }, 4)).toBeUndefined();
    expect(permissionsForSession(undefined, 4)).toBeUndefined();
  });
});

describe('App.tsx: no sign-out handler only navigates', () => {
  // A handler that only navigates leaves the server session alive and the
  // Keychain tokens in place, so a cold start restores the signed-in user.
  // The farmer Settings sign-out and the AdminAllFarmers Profile tab both did
  // this. CustomerMainApp is NOT exempt: it only forwards 'SignOut' to its
  // onSignOut prop and never calls its own logout (customer/api/auth.ts's
  // logout() has no caller), and a customer signs in through the farmer login
  // so the tokens live in the store signOutTo clears.
  it('no onSignOut={() => navigate(...)} remains', () => {
    expect(APP_SOURCE).not.toMatch(/onSignOut=\{\(\) => navigate\(/);
    expect(APP_SOURCE).not.toMatch(/onLogout=\{\(\) => navigate\(/);
  });

  it('every onSignOut= / onLogout= prop in App.tsx is signOutTo(...)', () => {
    const values = [...APP_SOURCE.matchAll(/on(?:SignOut|Logout)=\{([^\n]*)\}\s*$/gm)].map((m) => m[1]);
    expect(values.length).toBeGreaterThan(0);
    for (const v of values) expect(v).toMatch(/^\(\) => signOutTo\('(Login|Welcome)'\)$/);
  });

  it('the farmer SettingsScreen, CustomerMainApp and the admin shells all end the session', () => {
    expect(APP_SOURCE).toMatch(/<SettingsScreen[\s\S]*?onSignOut=\{\(\) => signOutTo\('Welcome'\)\}/);
    expect(APP_SOURCE).toMatch(/<CustomerMainApp onSignOut=\{\(\) => signOutTo\('Welcome'\)\} \/>/);
  });

  it('the AdminAllFarmers Profile tab opens the admin profile instead of leaving the session', () => {
    const block = APP_SOURCE.match(/<AdminAllFarmersScreen[\s\S]*?onSelectFarmer=/)?.[0] ?? '';
    expect(block).toMatch(/tab === 'Profile'/);
    expect(block).not.toMatch(/navigate\('Welcome'\)/);
    expect(block).toMatch(/navigate\('TohfaAdminDashboard', \{ initialTab: 'Profile' \}\)/);
  });
});
