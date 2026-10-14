/**
 * Source scan: the account and warehouse-profile screens read the live API
 * (plan phase 8), hold no design samples, and offer nothing the server refuses
 * a warehouse admin. Hooks and JSX cannot render in this plain-Node vitest, so
 * the wiring is pinned by reading the sources, as billing_wiring.test.ts does.
 * The behaviour behind each screen is tested on the pure mappers and the API
 * module (mappers_profile.test.ts, api_profile.test.ts).
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const SRC = path.join(__dirname, '..', '..', '..');
const REPO = path.join(SRC, '..', '..', '..');
const read = (rel: string) => fs.readFileSync(path.join(SRC, rel), 'utf8');
/** The source without comments, so "never drawn" checks read code only. */
const code = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const PROFILE = 'roles/admin/screens/warehouse/profile-settings';

/** Every screen the live flow renders with server data, plus its data hooks. */
const LIVE_PROFILE_FILES = [
  'SettingsScreen.tsx',
  'UserProfileScreen.tsx',
  'NotificationSettingsScreen.tsx',
  'SecurityScreen.tsx',
  'SessionSecurityScreen.tsx',
  'HelpSupportScreen.tsx',
  'WarehouseInfoScreen.tsx',
  'StorageInfoScreen.tsx',
  'OperatingInfoScreen.tsx',
  'ContactScreen.tsx',
  'useProfileData.ts',
];

const FLOW = read(`${PROFILE}/ProfileFlow.tsx`);
const DATA = read(`${PROFILE}/useProfileData.ts`);
const API = code(read('roles/admin/api/profile.ts'));
const WAREHOUSE_API = code(read('roles/admin/api/warehouses.ts'));
const SETTINGS = code(read(`${PROFILE}/SettingsScreen.tsx`));
const USER = code(read(`${PROFILE}/UserProfileScreen.tsx`));
const SESSIONS = code(read(`${PROFILE}/SessionSecurityScreen.tsx`));
const SECURITY = code(read(`${PROFILE}/SecurityScreen.tsx`));
const HELP = code(read(`${PROFILE}/HelpSupportScreen.tsx`));
const NOTIFICATIONS = code(read(`${PROFILE}/NotificationSettingsScreen.tsx`));
const WAREHOUSE_SCREENS = ['WarehouseInfoScreen.tsx', 'StorageInfoScreen.tsx', 'OperatingInfoScreen.tsx', 'ContactScreen.tsx'].map((f) =>
  code(read(`${PROFILE}/${f}`)),
);

function grant(codeName: string, role: string): string | undefined {
  const rbac = JSON.parse(fs.readFileSync(path.join(REPO, 'docs', 'rbac.json'), 'utf8')) as {
    permissions: { code: string; grants: Record<string, string> }[];
  };
  return rbac.permissions.find((p) => p.code === codeName)?.grants[role];
}

describe('no design samples on a live account or warehouse-profile screen', () => {
  it.each(LIVE_PROFILE_FILES)('%s imports no fixture', (file) => {
    expect(read(`${PROFILE}/${file}`)).not.toMatch(/from '\.\/fixtures'|from '\.\/warehouseFixtures'|\/fixtures'/);
  });

  it('no sample account, session, ticket or contact is drawn', () => {
    for (const source of [SETTINGS, USER, SESSIONS, SECURITY, HELP]) {
      expect(source).not.toMatch(/defaultProfile|CURRENT_SESSION|LOGIN_HISTORY|SUPPORT_TICKETS|SUPPORT_CONTACT|FAQ_ITEMS|ADM-MWA|SWA-/);
    }
  });
});

describe('change password ends every session (docs/openapi.yaml changeOwnPassword)', () => {
  it('the form posts to the real route through the flow, and a success signs the admin out', () => {
    expect(DATA).toMatch(/changeOwnPassword\(/);
    expect(SETTINGS).not.toMatch(/mock success/i);
    expect(SETTINGS).toMatch(/onPasswordChanged\(\)/);
    // Without a host sign-out the screen falls back to its own signed-out state.
    expect(FLOW).toMatch(/onPasswordChanged=\{onLogout \? signOutAfterPasswordChange : undefined\}/);
    expect(FLOW).toMatch(/const signOutAfterPasswordChange = \(\) => \{[\s\S]*?onLogout\(\)/);
  });

  it('the button is disabled while the request is pending', () => {
    expect(SETTINGS).toMatch(/disabled=\{isChangingPassword\}/);
  });
});

describe('own profile (BR-82, BR-33)', () => {
  it('the edit saves the name only; mobile and email are shown locked, never edited', () => {
    expect(USER).not.toMatch(/setEditEmail|editEmail/);
    expect(DATA).toMatch(/updateMe\(\{ fullName/);
  });

  it('the language choice is the server preferredLocale', () => {
    expect(DATA).toMatch(/updateMe\(\{ preferredLocale/);
  });

  it('shows no admin id, access level or password-changed date (the API has none)', () => {
    for (const source of [USER, SECURITY]) expect(source).not.toMatch(/adminId|accessLevel|passwordChanged|Access Level|Admin ID/);
  });
});

describe('sessions (BR-67)', () => {
  it('lists the live sessions from GET /auth/me/sessions', () => {
    expect(DATA).toMatch(/listMySessions\(/);
  });

  it('claims no current device and shows no login history, trusted device, location or session id', () => {
    expect(SESSIONS).not.toMatch(/isCurrent|LOGIN HISTORY|Login History|TRUSTED DEVICE|remembered|Location|Session ID|Failed/);
  });

  it('BR-67: terminating another session is none for both warehouse roles, so there is no route or control for it', () => {
    expect(grant('auth.session.terminate_other', 'SUB_WH_ADMIN')).toBe('none');
    expect(grant('auth.session.terminate_other', 'MAIN_WH_ADMIN')).toBe('none');
    expect(API).not.toMatch(/\/auth\/sessions\//);
    expect(SESSIONS).not.toMatch(/terminate|Log out other|other devices/i);
  });
});

describe('notification preferences (BR-82)', () => {
  it('Save PATCHes only the changed categories; the screen reads the server state', () => {
    expect(DATA).toMatch(/listAdminNotificationPreferences\(/);
    expect(DATA).toMatch(/updateAdminNotificationPreference\(change\.category, change\.enabled\)/);
    expect(NOTIFICATIONS).toMatch(/changedPreferences\(/);
    expect(NOTIFICATIONS).not.toMatch(/saved successfully/);
  });
});

describe('help (BR-82)', () => {
  it('reads GET /admin/help in the admin locale and shows no support tickets (admin tickets are not built)', () => {
    expect(DATA).toMatch(/getAdminHelp\(\{ locale \}/);
    expect(HELP).not.toMatch(/MY SUPPORT REQUESTS|tickets/);
  });
});

describe('warehouse profile (BR-30, BR-66)', () => {
  it('every warehouse read asks for profileWarehouseId (a Sub scope is always its own uuid)', () => {
    expect(FLOW).toMatch(/const warehouseId = profileWarehouseId\(scope, selectedWarehouseId\);/);
    expect(DATA).toMatch(/getWarehouse\(warehouseId/);
    expect(DATA).toMatch(/getWarehouseCapacity\(warehouseId/);
    expect(DATA).toMatch(/listStorageLocations\(warehouseId/);
  });

  it('is read-only for Sub: warehouse.profile.edit, capacity.set and storage_location.manage are none, and no write is exported', () => {
    expect(grant('warehouse.profile.edit', 'SUB_WH_ADMIN')).toBe('none');
    expect(grant('warehouse.capacity.set', 'SUB_WH_ADMIN')).toBe('none');
    expect(grant('warehouse.storage_location.manage', 'SUB_WH_ADMIN')).toBe('none');
    expect(WAREHOUSE_API).not.toMatch(/adminPatch|adminPost|adminPut/);
    for (const source of WAREHOUSE_SCREENS) expect(source).not.toMatch(/label="Edit|onEdit|onSave/);
  });

  it('shows no region, assigned admin, sections, hierarchy, services or emergency contact (no API field)', () => {
    for (const source of WAREHOUSE_SCREENS) {
      expect(source).not.toMatch(/Region|Assigned Admin|Storage Hierarchy|Storage Sections|Operational Services|Emergency Contact|Contact Person|currentKg/);
    }
  });

  it('warehouse performance stays hidden for Sub: it needs warehouse.all.view, which Sub does not hold', () => {
    expect(grant('warehouse.all.view', 'SUB_WH_ADMIN')).toBe('none');
    const storageFlow = read('roles/admin/screens/warehouse/storage-ops/StorageFlow.tsx');
    expect(storageFlow).toMatch(/Performance: STORAGE_CODES\.allWarehousesView/);
    expect(read('roles/admin/screens/warehouse/storage-ops/StorageParts.tsx')).toMatch(/allWarehousesView: 'warehouse\.all\.view'/);
  });
});
