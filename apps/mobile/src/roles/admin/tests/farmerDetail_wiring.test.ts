/**
 * Farmer Detail + Edit Farmer wiring, checked on the source (no React renderer
 * in this app's plain-Node vitest; same approach as
 * warehouse_management_m15.test.ts). The pure rules are in
 * farmerDetail_model.test.ts and farmerEdit_model.test.ts.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import en from '../i18n/farmerDetail.en.json';

const FARMERS = path.resolve(__dirname, '../screens/farmers');
const strip = (s: string) =>
  s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '');

function filesIn(dir: string): string[] {
  return fs
    .readdirSync(dir)
    .filter((n) => /\.(ts|tsx)$/.test(n))
    .map((n) => path.join(dir, n));
}

const DETAIL_SHELL = path.join(FARMERS, 'AdminFarmerDetailScreen.tsx');
const EDIT_SHELL = path.join(FARMERS, 'AdminEditFarmerScreen.tsx');
const DETAIL_FILES = [DETAIL_SHELL, ...filesIn(path.join(FARMERS, 'detail'))];
const EDIT_FILES = [EDIT_SHELL, ...filesIn(path.join(FARMERS, 'edit'))];
const ALL_FILES = [...DETAIL_FILES, ...EDIT_FILES];
const raw = (f: string) => fs.readFileSync(f, 'utf8');
const SRC = Object.fromEntries(ALL_FILES.map((f) => [path.relative(FARMERS, f), raw(f)]));
const CODE = Object.fromEntries(Object.entries(SRC).map(([k, v]) => [k, strip(v)]));
const ALL_CODE = Object.values(CODE).join('\n');
const ALL_RAW = Object.values(SRC).join('\n');
const read = (rel: string) => CODE[rel] ?? '';

describe('Farmer Detail / Edit: structure', () => {
  it('splits into a shell plus detail/ and edit/ folders, every file <= 800 lines', () => {
    expect(DETAIL_FILES.length).toBeGreaterThan(6);
    expect(EDIT_FILES.length).toBeGreaterThan(2);
    for (const [rel, s] of Object.entries(SRC)) expect(s.split('\n').length, rel).toBeLessThanOrEqual(800);
  });

  it('keeps the mobile-ui wrappers and the Android BackHandler (Dev behaviour)', () => {
    for (const shell of ['AdminFarmerDetailScreen.tsx', 'AdminEditFarmerScreen.tsx']) {
      expect(read(shell)).toMatch(/from '@tohfa\/mobile-ui'/);
      expect(read(shell)).toMatch(/ScreenStatusBar/);
      expect(read(shell)).toMatch(/SafeAreaView/);
    }
    expect(read('AdminFarmerDetailScreen.tsx')).toMatch(/BackHandler\.addEventListener\('hardwareBackPress'/);
    expect(ALL_CODE).not.toMatch(/import\s*\{[^}]*\bSafeAreaView\b[^}]*\}\s*from 'react-native'/);
    expect(ALL_CODE).not.toMatch(/import\s*\{[^}]*\bStatusBar\b[^}]*\}\s*from 'react-native'/);
  });
});

describe('Farmer Detail / Edit: access is code-based and fails closed', () => {
  it('no role or userScope props, no role strings, no fail-open can', () => {
    expect(ALL_CODE).not.toMatch(/\brole\??\s*:/);
    expect(ALL_CODE).not.toMatch(/userScope/);
    expect(ALL_CODE).not.toMatch(/SUPER_ADMIN|TOHFA_ADMIN|FARMER_ADMIN|WH_ADMIN/);
    expect(ALL_CODE).not.toMatch(/can\s*\?\s*can\(/);
    expect(ALL_CODE).not.toMatch(/can=\{\(\)\s*=>\s*true\}/);
    expect(ALL_CODE).not.toMatch(/\bas any\b/);
  });

  it('BR-108a: zone scoping is server-side; nothing filters by zone text', () => {
    // A null check for display is fine; comparing the zone to a literal or filtering by it is not.
    expect(ALL_CODE).not.toMatch(/Coonoor|coonoor|zone(Name|Id)?\s*[!=]==?\s*['"`]|\.filter\([^)]*zone/i);
  });

  it('every hook gets its id from the access-gated fetch ids (no API call without view_all)', () => {
    const shell = read('AdminFarmerDetailScreen.tsx');
    expect(shell).toMatch(/farmerDetailFetchIds\(access, /);
    expect(shell).toMatch(/useFarmer\(warehouseId, ids\.farmer\)/);
    expect(shell).toMatch(/useFarmerDocuments\(warehouseId, ids\.documents\)/);
    expect(shell).toMatch(/useFarmerBankAccounts\(warehouseId, ids\.bankAccounts\)/);
    expect(shell).toMatch(/useFarmerSubscription\(warehouseId, ids\.subscription\)/);
    expect(shell).toMatch(/useFarmerRating\(warehouseId, ids\.rating\)/);
    const edit = read('AdminEditFarmerScreen.tsx');
    expect(edit).toMatch(/useFarmer\(warehouseId, farmerEditFetchId\(access, /);
  });

  it('Edit pencil only with canEdit; Disable / Deactivate / Edit Rating / Verify document behind their flags', () => {
    expect(ALL_CODE).toMatch(/access\.canEdit\s*&&/);
    expect(ALL_CODE).toMatch(/access\.canDisable/);
    expect(ALL_CODE).toMatch(/access\.canDeactivate/);
    expect(ALL_CODE).toMatch(/access\.canEditRating/);
    expect(read('detail/KycTab.tsx')).toMatch(/row\.canVerify/);
  });
});

describe('Farmer Detail / Edit: DESIGN-ONLY actions never pretend to succeed', () => {
  it('Disable, Deactivate, plot/soil actions and Edit Rating Save carry the DESIGN-ONLY marker', () => {
    const marker = '// DESIGN-ONLY: no endpoint yet, owner decision pending';
    expect(SRC['detail/AccountModals.tsx']).toContain(marker);
    expect(SRC['detail/RecordModals.tsx']).toContain(marker);
    expect(SRC['detail/EditRatingView.tsx']).toContain(marker);
  });

  it('confirm never calls onDisable, never shows an Alert of success, never mutates the farmer', () => {
    expect(ALL_CODE).not.toMatch(/onDisable\s*\??\.?\(/);
    // The detail (where every DESIGN-ONLY action lives) shows no Alert at all.
    expect(DETAIL_FILES.map((f) => CODE[path.relative(FARMERS, f)] ?? '').join('\n')).not.toMatch(/Alert\.alert/);
    // The edit form's only Alert is the owner-requested "Save changes?" confirmation before the real PATCH,
    // never a success message (success is the flow's toast, after the server answered).
    const editCode = EDIT_FILES.map((f) => CODE[path.relative(FARMERS, f)] ?? '').join('\n');
    expect(editCode.match(/Alert\.alert/g) ?? []).toHaveLength(1);
    expect(read('AdminEditFarmerScreen.tsx')).toMatch(/Alert\.alert\(\s*t\('farmerDetail\.edit\.saveConfirm\.title'\)/);
    expect(read('detail/AccountModals.tsx')).not.toMatch(/use(Update|Verify)Farmer/);
    expect(read('detail/RecordModals.tsx')).not.toMatch(/use(Update|Verify)Farmer/);
    expect(read('detail/EditRatingView.tsx')).not.toMatch(/use(Update|Verify)Farmer|adminPost|adminPatch|adminPut/);
  });

  it('the not-available notice is an i18n string', () => {
    expect(en['farmerDetail.designOnly.notAvailable']).toBeTruthy();
    expect(read('detail/AccountModals.tsx')).toMatch(/farmerDetail\.designOnly\.notAvailable/);
    expect(read('detail/RecordModals.tsx')).toMatch(/farmerDetail\.designOnly\.notAvailable/);
    expect(read('detail/EditRatingView.tsx')).toMatch(/farmerDetail\.designOnly\.ratingSave/);
  });
});

describe('Farmer Detail / Edit: BR-33a locked mobile on the edit form', () => {
  it('the mobile input is editable only with canEditLockedFields; the Aadhaar is never an input', () => {
    const sections = read('edit/EditSections.tsx');
    expect(sections).toMatch(/editable=\{access\.canEditLockedFields\}/);
    expect(sections).not.toMatch(/aadhaarLast4[^\n]*onChangeText|onChangeText[^\n]*aadhaar/i);
  });

  it('the save goes through editPatch (buildFarmerPatch) and useUpdateFarmer', () => {
    const edit = read('AdminEditFarmerScreen.tsx');
    expect(edit).toMatch(/editPatch\(/);
    expect(edit).toMatch(/useUpdateFarmer\(/);
  });
});

describe('Farmer Detail / Edit: no fixtures, tokens only, i18n only', () => {
  it('no design fixture text anywhere', () => {
    for (const fixture of [
      'Ramesh',
      'PLT-00124',
      'SOIL-00124',
      'FMR-00124',
      'FR-00124',
      'Demo village',
      'Demo plot',
      'Mixed vegetable',
      'fmb-sketch-1.pdf',
      'AUD-2026',
      '125378300124',
      'aadhaar_scan',
      'Sub Warehouse, Coonoor',
      '98765',
      'Wild Eden',
      'DEMO_ALL_FARMERS',
      'DEFAULT_CATEGORY_RATINGS',
    ]) {
      expect(ALL_RAW.includes(fixture), fixture).toBe(false);
    }
  });

  it('no raw colours and no numeric fontSize (spread adminType)', () => {
    expect(ALL_CODE).not.toMatch(/(['"`])#(?:[0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3,4})\1/);
    expect(ALL_CODE).not.toMatch(/\brgba?\s*\(/);
    expect(ALL_CODE).not.toMatch(/fontSize\s*:\s*[0-9]/);
    expect(ALL_CODE).not.toMatch(/fontFamily\s*:/);
  });

  it('no English JSX text: every Text child is an expression', () => {
    for (const [rel, s] of Object.entries(CODE)) {
      const hits = s.match(/<Text[^>]*>\s*[A-Za-z][^<{]*</g) ?? [];
      expect(hits, rel).toEqual([]);
    }
  });

  it("every farmerDetail key the screens use exists in farmerDetail.en.json, and the catalogue holds only that prefix", () => {
    const used = new Set([...ALL_CODE.matchAll(/'(farmerDetail\.[A-Za-z0-9_.]+)'/g)].map((m) => m[1] as string));
    const missing = [...used].filter((k) => !k.endsWith('.') && !(k in en));
    expect(missing).toEqual([]);
    expect(Object.keys(en).every((k) => k.startsWith('farmerDetail.'))).toBe(true);
  });
});
