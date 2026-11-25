/**
 * Source scan of the Market & Pricing phase 2B screens: the three dashboard
 * shells (RetailPricing, CategoriesGrades, MarkupPricingBreakdown) and
 * screens/pricing/{retail,categories,markup}/**. Pins what a render test
 * cannot: no role strings or fail-open permission checks, no float money
 * (parseFloat / Number() / toFixed), no hex or numeric fontSize, the mobile-ui
 * SafeAreaView / ScreenStatusBar, an Android BackHandler, no write hook on the
 * screens (the drawer's Save is DESIGN-ONLY), i18n keys that exist, and files
 * of at most 800 lines.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { en } from '../i18n';

const ADMIN = path.join(__dirname, '..');
const DASHBOARD = path.join(ADMIN, 'screens/dashboard');
const PRICING = path.join(ADMIN, 'screens/pricing');
const read = (abs: string) => fs.readFileSync(abs, 'utf8');
const code = (source: string) =>
  source
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\s\/\/.*$/gm, '');

const SHELLS = ['RetailPricingScreen.tsx', 'CategoriesGradesScreen.tsx', 'MarkupPricingBreakdownScreen.tsx'].map((n) => path.join(DASHBOARD, n));
const FOLDERS = ['retail', 'categories', 'markup'].map((n) => path.join(PRICING, n));
const folderFiles = FOLDERS.flatMap((dir) =>
  fs.existsSync(dir)
    ? fs
        .readdirSync(dir)
        .filter((n) => /\.tsx?$/.test(n))
        .map((n) => path.join(dir, n))
    : [],
);
const ALL = [...SHELLS, ...folderFiles];
const rel = (f: string) => path.relative(ADMIN, f);

describe('pricing 2B: structure', () => {
  it('every folder exists and every file stays at or under 800 lines', () => {
    for (const dir of FOLDERS) expect(fs.existsSync(dir), rel(dir)).toBe(true);
    expect(folderFiles.length).toBeGreaterThan(6);
    for (const f of ALL) expect(read(f).split('\n').length, rel(f)).toBeLessThanOrEqual(800);
  });

  it('the dashboard index re-exports the three screens', () => {
    const index = read(path.join(DASHBOARD, 'index.ts'));
    for (const n of ['RetailPricingScreen', 'CategoriesGradesScreen', 'MarkupPricingBreakdownScreen']) {
      expect(index).toContain(`export * from './${n}';`);
    }
  });
});

describe('pricing 2B: permissions are codes, fail closed', () => {
  it.each(ALL.map(rel))('%s has no role strings, no fail-open can, no `as any`', (file) => {
    const src = code(read(path.join(ADMIN, file)));
    expect(src).not.toMatch(/'(SUPER_ADMIN|TOHFA_ADMIN|FARMER_ADMIN|MAIN_WH_ADMIN|SUB_WH_ADMIN)'/);
    expect(src).not.toMatch(/can\s*\?\s*can\(/);
    expect(src).not.toMatch(/=>\s*true\b/);
    expect(src).not.toMatch(/\|\|\s*!user/);
    expect(src).not.toMatch(/as any/);
    expect(src).not.toMatch(/\brole\??\s*:/);
    expect(src).not.toMatch(/isFarmerAdmin|isTohfaAdmin|userScope/);
  });

  it('the codes the screens gate on are the rbac codes', () => {
    const logic = folderFiles.filter((f) => /Logic\.ts$/.test(f)).map((f) => code(read(f))).join('\n');
    expect(logic).toMatch(/'pricing\.retail_price\.view'/);
    expect(logic).toMatch(/'pricing\.fair_price\.view'/);
    expect(logic).toMatch(/'pricing\.retail_price\.set'/);
  });

  it('the screens never reach the retail price write (Save is DESIGN-ONLY)', () => {
    for (const f of ALL) expect(code(read(f)), rel(f)).not.toMatch(/useCreateRetailPrice|createRetailPrice|buildRetailPriceBody/);
    const drawer = read(path.join(PRICING, 'retail', 'RetailEditDrawer.tsx'));
    expect(drawer).toContain('// DESIGN-ONLY: effectiveFrom rule not decided (owner)');
  });

  it('the retail list is fetched with an enabled flag', () => {
    const live = folderFiles.map((f) => code(read(f))).join('\n');
    expect(live).toMatch(/useRetailPriceList\([^)]*\{\s*enabled:/);
  });
});

describe('pricing 2B: money, theme, i18n, platform', () => {
  it.each(ALL.map(rel))('%s has no float money, no raw colour, no numeric fontSize', (file) => {
    const src = code(read(path.join(ADMIN, file)));
    expect(src).not.toMatch(/parseFloat|parseInt|Number\(|toFixed\(/);
    expect(src).not.toMatch(/(['"`])#(?:[0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3,4})\1/);
    expect(src).not.toMatch(/\brgba?\s*\(/);
    expect(src).not.toMatch(/fontSize\s*:\s*[0-9]/);
    expect(src).not.toMatch(/fontFamily\s*:/);
  });

  it.each(ALL.filter((f) => f.endsWith('.tsx')).map(rel))('%s has no raw English between JSX tags and no design fixture', (file) => {
    const src = code(read(path.join(ADMIN, file)));
    expect(src).not.toMatch(/>\s*[A-Z][a-z]+(?: [A-Za-z]+)*\s*</);
    expect(src).not.toMatch(/INITIAL_RETAIL_MANAGEMENT_ITEMS|SAMPLE_RETAIL_PRICES|CATEGORIES_DATA|GRADES_DATA|DEFAULT_EXPENSES/);
    expect(src).not.toMatch(/import \{[^}]*\b(SafeAreaView|StatusBar)\b[^}]*\} from 'react-native'/);
  });

  it('uses the mobile-ui wrappers and an Android BackHandler', () => {
    const all = folderFiles.map((f) => code(read(f))).join('\n');
    expect(all).toMatch(/import \{[^}]*ScreenStatusBar[^}]*\} from '@tohfa\/mobile-ui'/);
    expect(all).toMatch(/BackHandler\.addEventListener\('hardwareBackPress'/);
  });

  it('every pricingRetail.* key used exists in English and all keys are prefixed', () => {
    const used = new Set<string>();
    for (const f of ALL) for (const m of read(f).matchAll(/'(pricingRetail\.[A-Za-z0-9_.]+)'/g)) used.add(m[1]!);
    expect(used.size).toBeGreaterThan(20);
    const catalogue = en as Record<string, string>;
    for (const key of used) {
      if (key.endsWith('.')) continue;
      expect(catalogue[key], key).toBeTruthy();
    }
    const own = JSON.parse(read(path.join(ADMIN, 'i18n/pricingRetail.en.json'))) as Record<string, string>;
    for (const key of Object.keys(own)) expect(key.startsWith('pricingRetail.'), key).toBe(true);
  });
});
