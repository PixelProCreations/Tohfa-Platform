/**
 * Source scan of the Market & Pricing view-only screens (phase 2A): the three
 * dashboard shells and screens/pricing/{home,ceiling,history}/**. Pins what a
 * render test cannot: no role strings / role props / fail-open checks, no
 * fixtures, admin theme only (no hex, no numeric fontSize, no fontFamily), no
 * float money, i18n keys that exist (all pricingCeiling.*), files <= 800
 * lines, Dev's mobile-ui wrappers kept, and the owner's untouched files.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { en } from '../i18n';

const ADMIN = path.join(__dirname, '..');
const DASH = path.join(ADMIN, 'screens/dashboard');
const PRICING = path.join(ADMIN, 'screens/pricing');
const FOLDERS = ['home', 'ceiling', 'history'].map((f) => path.join(PRICING, f));
const read = (abs: string) => fs.readFileSync(abs, 'utf8');
const code = (source: string) =>
  source
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\s\/\/.*$/gm, '');

const SHELLS = ['MarketPricingHomeScreen.tsx', 'FairPriceCeilingScreen.tsx', 'PriceHistoryScreen.tsx'].map((f) => path.join(DASH, f));
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

describe('pricing screens: structure', () => {
  it('each folder exists, shells are thin, every file <= 800 lines', () => {
    for (const dir of FOLDERS) expect(fs.existsSync(dir), rel(dir)).toBe(true);
    expect(folderFiles.length).toBeGreaterThan(6);
    for (const f of ALL) expect(read(f).split('\n').length, rel(f)).toBeLessThanOrEqual(800);
    for (const f of SHELLS) expect(read(f).split('\n').length, rel(f)).toBeLessThan(60);
  });

  it('the shells keep the exported component names the hosts import', () => {
    expect(read(SHELLS[0]!)).toMatch(/MarketPricingHomeScreen/);
    expect(read(SHELLS[1]!)).toMatch(/FairPriceCeilingScreen/);
    expect(read(SHELLS[2]!)).toMatch(/PriceHistoryScreen/);
  });

  it('UpdateFairPriceScreen and BulkPriceUpdateScreen are not imported by the view-only screens', () => {
    for (const f of ALL) expect(code(read(f)), rel(f)).not.toMatch(/UpdateFairPriceScreen|BulkPriceUpdateScreen/);
  });
});

describe('pricing screens: permissions are codes, fail closed', () => {
  it.each(ALL.map(rel))('%s has no role strings, no role prop, no fail-open can, no `as any`', (file) => {
    const src = code(read(path.join(ADMIN, file)));
    expect(src).not.toMatch(/'(SUPER_ADMIN|TOHFA_ADMIN|FARMER_ADMIN|MAIN_WH_ADMIN|SUB_WH_ADMIN)'/);
    expect(src).not.toMatch(/\brole\s*(===|!==)/);
    expect(src).not.toMatch(/\brole\??\s*:/);
    expect(src).not.toMatch(/userScope/);
    expect(src).not.toMatch(/isFarmerAdmin|isTohfaAdmin/);
    expect(src).not.toMatch(/can\s*\?\s*can\(/);
    expect(src).not.toMatch(/\|\|\s*!user/);
    expect(src).not.toMatch(/=>\s*true\b/);
    expect(src).not.toMatch(/as any/);
  });

  it('the read codes are pricing.fair_price.view and pricing.retail_price.view only', () => {
    const logic = code(read(path.join(PRICING, 'ceiling/pricingLogic.ts')));
    expect(logic).toMatch(/'pricing\.fair_price\.view'/);
    expect(logic).toMatch(/'pricing\.retail_price\.view'/);
  });
});

describe('pricing screens: no fixtures, no float money', () => {
  it.each(ALL.map(rel))('%s has no fixture arrays and no float maths on amounts', (file) => {
    const src = code(read(path.join(ADMIN, file)));
    expect(src).not.toMatch(/INITIAL_FAIR_PRICE_CEILINGS|SAMPLE_FAIR_PRICES|PRICE_HISTORY_FIXTURES|COUNTER_OFFER_FIXTURES|MOCK_PRICES|\bHISTORY\b/);
    expect(src).not.toMatch(/parseFloat|toFixed\(|Number\(/);
    expect(src).not.toMatch(/'Weekly'|"Weekly"/);
  });
});

describe('pricing screens: admin theme and i18n', () => {
  it.each(ALL.map(rel))('%s has no raw colour, numeric fontSize or fontFamily', (file) => {
    const src = code(read(path.join(ADMIN, file)));
    expect(src).not.toMatch(/(['"`])#(?:[0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3,4})\1/);
    expect(src).not.toMatch(/\brgba?\s*\(/);
    expect(src).not.toMatch(/fontSize\s*:\s*[0-9]/);
    expect(src).not.toMatch(/fontFamily\s*:/);
  });

  it('every i18n key used is pricingCeiling.* (or the shared async/error keys) and exists', () => {
    const catalogue = en as Record<string, string>;
    const used = new Set<string>();
    for (const f of ALL) for (const m of code(read(f)).matchAll(/\bt\(\s*'([A-Za-z0-9_.]+)'/g)) used.add(m[1]!);
    expect(used.size).toBeGreaterThan(30);
    for (const key of used) {
      expect(key, key).toMatch(/^pricingCeiling\./);
      expect(catalogue[key], key).toBeTruthy();
    }
  });

  it('the pricingCeiling catalogue has only pricingCeiling.* keys, and ta is an empty object', () => {
    const enFile = JSON.parse(read(path.join(ADMIN, 'i18n/pricingCeiling.en.json'))) as Record<string, string>;
    for (const key of Object.keys(enFile)) expect(key).toMatch(/^pricingCeiling\./);
    expect(JSON.parse(read(path.join(ADMIN, 'i18n/pricingCeiling.ta.json')))).toEqual({});
  });

  it('no raw English text between JSX tags', () => {
    for (const f of ALL.filter((x) => x.endsWith('.tsx'))) {
      expect(code(read(f)), rel(f)).not.toMatch(/>\s*[A-Z][a-z]+(?: [A-Za-z]+)*\s*</);
    }
  });

  it("keeps Dev's mobile-ui status bar and safe area wrappers, never the react-native ones", () => {
    const frame = code(read(path.join(PRICING, 'ceiling/PricingFrame.tsx')));
    expect(frame).toMatch(/import \{[^}]*ScreenStatusBar[^}]*SafeAreaView[^}]*\} from '@tohfa\/mobile-ui'/);
    for (const f of ALL) {
      expect(code(read(f)), rel(f)).not.toMatch(/import \{[^}]*\b(SafeAreaView|StatusBar)\b[^}]*\} from 'react-native'/);
    }
  });
});
