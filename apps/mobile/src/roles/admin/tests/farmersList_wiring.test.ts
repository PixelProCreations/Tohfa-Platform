/**
 * Source scan of the farmers list (Module 1, phase 2B): screens/farmers/
 * AdminAllFarmersScreen.tsx (the shell) and screens/farmers/list/**. Pins what
 * a render test cannot: no fixture in the live import graph, no role-string
 * or fail-open permission checks, no client zone literal (BR-108a), the admin
 * theme rules (no hex, no numeric fontSize), i18n keys that exist, files under
 * 800 lines, and the props the existing hosts pass still being accepted.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { en } from '../i18n';

const SRC = path.join(__dirname, '..', '..', '..');
const FARMERS = path.join(SRC, 'roles/admin/screens/farmers');
const LIST_DIR = path.join(FARMERS, 'list');
const read = (abs: string) => fs.readFileSync(abs, 'utf8');
/** Source without comments, so a docblock may explain what the code must not do. */
const code = (source: string) =>
  source
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\s\/\/.*$/gm, '');

const LEGACY_FILE = 'legacyFarmerListItem.ts';
const listFiles = fs
  .readdirSync(LIST_DIR)
  .filter((n) => /\.tsx?$/.test(n))
  .map((n) => path.join(LIST_DIR, n));
const SHELL = path.join(FARMERS, 'AdminAllFarmersScreen.tsx');
const ALL = [SHELL, ...listFiles];
/** The files the live screen renders through (everything but the legacy bridge). */
const LIVE = ALL.filter((f) => path.basename(f) !== LEGACY_FILE);
const rel = (f: string) => path.relative(SRC, f);

describe('farmers list: structure', () => {
  it('the shell is thin and every file stays under 800 lines', () => {
    expect(listFiles.length).toBeGreaterThan(3);
    for (const f of ALL) expect(read(f).split('\n').length, rel(f)).toBeLessThanOrEqual(800);
    expect(read(SHELL).split('\n').length).toBeLessThan(120);
  });

  it('keeps the exports still imported (AdminAllFarmersScreen, FarmerListItem) and no longer exports DEMO_ALL_FARMERS (phase 3A)', () => {
    const shell = read(SHELL);
    expect(shell).toMatch(/AdminAllFarmersScreen/);
    expect(shell).toMatch(/FarmerListItem/);
    expect(code(shell)).not.toMatch(/DEMO_ALL_FARMERS/);
  });
});

describe('farmers list: no fixture data on the live path', () => {
  it.each(LIVE.filter((f) => f !== SHELL).map(rel))('%s does not import the legacy fixture (a type-only import is erased)', (file) => {
    const src = code(read(path.join(SRC, file)));
    expect(src).not.toMatch(/DEMO_ALL_FARMERS|DEMO_APPLICATIONS/);
    expect(src).not.toMatch(/import (?!type )[^;]*legacyFarmerListItem'/);
  });

  it('the shell only re-exports DEMO_ALL_FARMERS for the hosts; the screen component never reads it', () => {
    const shell = code(read(SHELL));
    const demoLines = shell.split('\n').filter((l) => l.includes('DEMO_ALL_FARMERS'));
    for (const l of demoLines) expect(l).toMatch(/^\s*export \{[^}]*DEMO_ALL_FARMERS[^}]*\} from '\.\/list\/legacyFarmerListItem';$/);
  });
});

describe('farmers list: permissions are codes, fail closed', () => {
  it.each(ALL.map(rel))('%s has no role strings, no fail-open can, no `as any`', (file) => {
    const src = code(read(path.join(SRC, file)));
    expect(src).not.toMatch(/'(SUPER_ADMIN|TOHFA_ADMIN|FARMER_ADMIN|MAIN_WH_ADMIN|SUB_WH_ADMIN)'/);
    expect(src).not.toMatch(/can\s*\?\s*can\(/);
    expect(src).not.toMatch(/=>\s*true\b/);
    expect(src).not.toMatch(/as any/);
    expect(src).not.toMatch(/\brole\??\s*:/);
    expect(src).not.toMatch(/userScope/);
  });

  it('the list hooks are only reached behind farmer.profile.view_all, applications behind list_pending', () => {
    const logic = code(read(path.join(LIST_DIR, 'farmersListLogic.ts')));
    expect(logic).toMatch(/'farmer\.profile\.view_all'/);
    expect(logic).toMatch(/'farmer\.application\.list_pending'/);
    const screen = code(read(path.join(LIST_DIR, 'FarmersListScreen.tsx')));
    expect(screen).toMatch(/canViewFarmers/);
    const live = code(read(path.join(LIST_DIR, 'LiveFarmersList.tsx')));
    expect(live).toMatch(/useApplicationList\([^)]*\{\s*enabled:/);
  });
});

describe('farmers list: zone scoping is server-side (BR-108a)', () => {
  it.each(LIVE.map(rel))('BR-108a: %s never filters by zone text and has no static zone list', (file) => {
    const src = code(read(path.join(SRC, file)));
    expect(src).not.toMatch(/coonoor|ooty|kotagiri|gudalur/i);
    expect(src).not.toMatch(/\.includes\(\s*'main'\s*\)/);
  });
});

describe('farmers list: admin theme and i18n', () => {
  it.each(LIVE.map(rel))('%s has no raw colour and no numeric fontSize', (file) => {
    const src = code(read(path.join(SRC, file)));
    expect(src).not.toMatch(/(['"`])#(?:[0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3,4})\1/);
    expect(src).not.toMatch(/\brgba?\s*\(/);
    expect(src).not.toMatch(/fontSize\s*:\s*[0-9]/);
    expect(src).not.toMatch(/fontFamily\s*:/);
  });

  it('every farmersList.* key the code uses exists in the English catalogue', () => {
    const used = new Set<string>();
    for (const f of LIVE) for (const m of read(f).matchAll(/'(farmersList\.[A-Za-z0-9_.]+)'/g)) used.add(m[1]!);
    expect(used.size).toBeGreaterThan(10);
    const catalogue = en as Record<string, string>;
    for (const key of used) {
      // A key ending in '.' is a prefix completed at runtime (status codes); its entries are tested in farmersList_logic.
      if (key.endsWith('.')) continue;
      expect(catalogue[key], key).toBeTruthy();
    }
  });

  it('no raw English text between JSX tags', () => {
    for (const f of LIVE.filter((x) => x.endsWith('.tsx'))) {
      const src = code(read(f));
      expect(src, rel(f)).not.toMatch(/>\s*[A-Z][a-z]+(?: [A-Za-z]+)*\s*</);
    }
  });

  it('keeps Dev\'s mobile-ui status bar and safe area wrappers', () => {
    const layout = code(read(path.join(LIST_DIR, 'FarmersListLayout.tsx')));
    expect(layout).toMatch(/import \{[^}]*ScreenStatusBar[^}]*SafeAreaView[^}]*\} from '@tohfa\/mobile-ui'/);
    expect(layout).not.toMatch(/import \{[^}]*\b(SafeAreaView|StatusBar)\b[^}]*\} from 'react-native'/);
  });
});

describe('farmers list: the existing host mounts still fit', () => {
  it('the shared FarmersFlow (the only host since phase 3A) passes only props the screen accepts', () => {
    const props = code(read(path.join(LIST_DIR, 'FarmersListScreen.tsx')));
    for (const name of ['onBack', 'onSelectFarmer', 'onNavigateTab', 'showBottomNav', 'can', 'initialTab', 'onReviewApplication', 'warehouseId', 'title']) {
      expect(props, name).toMatch(new RegExp(`\\b${name}\\?:`));
    }
    const flow = read(path.join(FARMERS, 'FarmersFlow.tsx'));
    const mount = /<FarmersListScreen([\s\S]*?)\/>/.exec(flow)?.[1] ?? '';
    const passed = [...mount.matchAll(/^\s{8}([a-zA-Z]+)=/gm)].map((m) => m[1]);
    expect(passed.length).toBeGreaterThan(0);
    for (const p of passed) expect(props, `FarmersFlow passes ${p}`).toMatch(new RegExp(`\\b${p}\\?:`));
  });
});
