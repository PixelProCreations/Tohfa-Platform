/**
 * Farmers Management entry points (Module 1 phase 3A), pinned at the source:
 * every admin host reaches farmers through the ONE shared FarmersFlow, built
 * with the signed-in admin's own `can`, and draws its entry only when
 * `canOpenFarmers(can)` (farmer.profile.view_all) holds. No host mounts a
 * farmer screen with a fixture farmer, a fixture application, a grant-all
 * `can` or a role literal. BR-108a scoping stays server-side.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import en from '../i18n/farmersEntry.en.json';
import ta from '../i18n/farmersEntry.ta.json';
import { en as merged } from '../i18n';

const SRC = path.join(__dirname, '..', '..', '..');
const read = (rel: string) => fs.readFileSync(path.join(SRC, rel), 'utf8');
const exists = (rel: string) => fs.existsSync(path.join(SRC, rel));
const code = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const APP = 'roles/farmer/App.tsx';
const DASH = 'roles/admin/screens/dashboard';
const HOSTS = {
  tohfa: `${DASH}/TohfaAdminDashboardScreen.tsx`,
  superAdmin: `${DASH}/SuperAdminDashboardScreen.tsx`,
  farmerAdmin: `${DASH}/FarmerAdminDashboardScreen.tsx`,
  subWarehouse: `${DASH}/SubWarehouseAdminDashboardScreen.tsx`,
  warehouseMore: 'roles/admin/screens/warehouse/dashboard-home-more/MoreScreen.tsx',
} as const;
const FLOW = 'roles/admin/screens/farmers/FarmersFlow.tsx';
const ALL = [APP, ...Object.values(HOSTS), `${DASH}/MainWarehouseAdminDashboardScreen.tsx`, FLOW];

const FARMER_SCREENS = [
  'AdminAllFarmersScreen',
  'AdminFarmerDetailScreen',
  'AdminEditFarmerScreen',
  'AdminPendingApplicationsScreen',
  'AdminApplicationDetailScreen',
  'AdminApplicationRejectScreen',
];

/** The JSX of every <FarmersFlow ... /> mount in a file. */
function flowMounts(src: string): string[] {
  return [...src.matchAll(/<FarmersFlow\b[\s\S]*?\/>/g)].map((m) => m[0]);
}

describe('farmers entry wiring: no fixtures, no grant-all can', () => {
  it.each(ALL)('%s imports no farmer/application fixture', (file) => {
    const src = code(read(file));
    expect(src).not.toMatch(/DEMO_ALL_FARMERS|DEMO_PENDING_APPLICATIONS|legacyDemoApplications/);
    expect(src).not.toMatch(/'farmer-001'|'app-001'/);
  });

  it.each(ALL)('%s passes no `() => true` can and no role literal to a farmer screen', (file) => {
    const src = code(read(file));
    expect(src).not.toMatch(/can=\{\s*\(\)\s*=>\s*true\s*\}/);
    for (const m of flowMounts(src)) expect(m).not.toMatch(/role=/);
    for (const screen of FARMER_SCREENS) {
      for (const m of src.matchAll(new RegExp(`<${screen}\\b[\\s\\S]*?\\/>`, 'g'))) expect(m[0]).not.toMatch(/role=|=>\s*true/);
    }
  });

  it('App.tsx no longer routes the farmer screens itself (the hosts mount FarmersFlow)', () => {
    const src = code(read(APP));
    for (const screen of [...FARMER_SCREENS, 'AdminApplicationApproveScreen', 'AdminApplicationRequestInfoScreen']) {
      expect(src, screen).not.toMatch(new RegExp(`<${screen}\\b`));
    }
    expect(src).not.toMatch(/'AdminApplicationApprove'|'AdminApplicationRequestInfo'/);
  });

  it('the dashboards mount farmer screens only through FarmersFlow', () => {
    for (const file of Object.values(HOSTS)) {
      const src = code(read(file));
      for (const screen of FARMER_SCREENS) expect(src, `${file} mounts ${screen}`).not.toMatch(new RegExp(`<${screen}\\b`));
    }
  });
});

describe('farmers entry wiring: every entry is gated by farmer.profile.view_all', () => {
  it.each(Object.entries(HOSTS))('%s mounts FarmersFlow with its own can and gates the entry with canOpenFarmers', (_name, file) => {
    const src = code(read(file));
    const mounts = flowMounts(src);
    expect(mounts.length, file).toBeGreaterThan(0);
    for (const m of mounts) expect(m).toMatch(/\bcan=\{(can|adminCan)\}/);
    expect(src).toMatch(/canOpenFarmers\((can|adminCan)\)/);
  });

  it('the dashboards build can from the signed-in user\'s /auth/me permissions (makeCan), never a default grant', () => {
    for (const file of [HOSTS.tohfa, HOSTS.superAdmin, HOSTS.farmerAdmin]) {
      expect(code(read(file)), file).toMatch(/const adminCan = useMemo\(\(\) => makeCan\(user\?\.permissions\), \[user\]\)/);
    }
  });

  it('the Sub warehouse Home tile and the More row are drawn only when canOpenFarmers holds', () => {
    const sub = code(read(HOSTS.subWarehouse));
    expect(sub).toMatch(/\{canOpenFarmers\(can\) \? \(\s*<Pressable[\s\S]*?farmersEntry\.tile\.farmers/);
    const more = code(read(HOSTS.warehouseMore));
    expect(more).toMatch(/withFarmersRow\(visibleGroups, canOpenFarmers\(can\)\)/);
  });
});

describe('farmers entry wiring: removed screens and catalogue', () => {
  it('the Approve and Request-info screens and the demo applications are gone', () => {
    const reg = 'roles/admin/screens/registration';
    for (const f of ['AdminApplicationApproveScreen.tsx', 'AdminApplicationRequestInfoScreen.tsx', 'legacyDemoApplications.ts']) {
      expect(exists(`${reg}/${f}`), f).toBe(false);
    }
    const index = read(`${reg}/index.ts`);
    expect(index).not.toMatch(/Approve|RequestInfo|DEMO_PENDING_APPLICATIONS/);
  });

  it('DEMO_ALL_FARMERS is gone; only the legacy FarmerListItem type remains for the satellite screens', () => {
    expect(code(read('roles/admin/screens/farmers/list/legacyFarmerListItem.ts'))).not.toMatch(/DEMO_ALL_FARMERS/);
    expect(code(read('roles/admin/screens/farmers/AdminAllFarmersScreen.tsx'))).not.toMatch(/DEMO_ALL_FARMERS/);
  });

  it('the entry labels live in their own catalogue, registered in the admin i18n', () => {
    expect(Object.keys(en).length).toBeGreaterThan(0);
    expect(ta).toEqual({});
    for (const [k, v] of Object.entries(en)) expect((merged as Record<string, string>)[k], k).toBe(v);
  });
});
