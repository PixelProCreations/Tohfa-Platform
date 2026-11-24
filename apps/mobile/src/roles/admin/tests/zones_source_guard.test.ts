/**
 * Source scan of Zone Management (screens/zones/**). Pins what a render test
 * cannot in this plain-Node app: the screen reads the API, no fixture array or
 * hardcoded KPI literal survives, nothing is dashed by hand, only tokens and
 * i18n keys that exist are used, and the logic file stays free of UI.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { en } from '../i18n';

const ZONES = path.join(__dirname, '../screens/zones');
const SCREEN = path.join(ZONES, 'AdminZoneManagementScreen.tsx');
const LOGIC = path.join(ZONES, 'zonesLogic.ts');
const FILES = fs.readdirSync(ZONES).filter((n) => /\.tsx?$/.test(n)).map((n) => path.join(ZONES, n));
const read = (f: string) => fs.readFileSync(f, 'utf8');
const code = (source: string) =>
  source
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\s\/\/.*$/gm, '');

describe('Zone Management reads the API', () => {
  const screen = code(read(SCREEN));

  it('uses the zone, farmer-summary, zone-farmer and warehouse reads', () => {
    expect(screen).toMatch(/useAdminZones\(/);
    expect(screen).toMatch(/useFarmerSummary\(/);
    expect(screen).toMatch(/useFarmersAllPages\(/);
    expect(screen).toMatch(/useZoneWarehouses\(/);
    expect(screen).toMatch(/useAdminZone\(/);
  });

  it('does not import the public /zones read or a second summary hook', () => {
    expect(screen).not.toMatch(/listZones|getPublicZones|useZonesPublic/);
    expect(read(path.join(__dirname, '../api/zonesHooks.ts'))).not.toMatch(/getFarmerSummary/);
  });

  it('renders loading, error and empty states', () => {
    expect(screen).toMatch(/AdminLoadingState/);
    expect(screen).toMatch(/AdminErrorState/);
    expect(screen).toMatch(/AdminEmptyState/);
  });
});

describe('no fixture or hardcoded figure survives', () => {
  it.each(FILES.map((f) => path.relative(ZONES, f)))('%s has no INITIAL_* fixture array', (file) => {
    expect(code(read(path.join(ZONES, file)))).not.toMatch(/\bINITIAL_[A-Z_]+\b/);
  });

  it('has no zone, farmer or location literal from the old fixtures', () => {
    const screen = code(read(SCREEN));
    for (const needle of ['Rajesh Kumar', 'Murugan Devi', 'Priya Pillai', 'Meenakshi Kumar', 'Demo Farmer Admin', 'Demo Super Admin', 'zn-00', 'loc-00', 'fmr-00', 'FMR-00', 'Udhagamandalam', 'Masinagudi', 'Naduvattam', '98XXXXX', '643001', 'Kundah']) {
      expect(screen, needle).not.toContain(needle);
    }
  });

  it('has no hardcoded KPI value= literal (the old "5" "4" "1" "27" "248" "12" "3")', () => {
    const screen = code(read(SCREEN));
    expect(screen).not.toMatch(/\bvalue="\d+/);
    expect(screen).not.toMatch(/subtitle="(24 in zones|of 260|need a zone)/);
  });

  it('has no hardcoded report metric (245, 612.8 acres, 5 of 5 active zones)', () => {
    const screen = code(read(SCREEN));
    expect(screen).not.toMatch(/612\.8|5 of 5 active zones/);
    expect(screen).not.toMatch(/reportMetricValue\}>\s*\d+\s*</);
    expect(screen).not.toMatch(/\{ name: '(Organic|Natural|Biodynamic)', count: \d+/);
  });

  it('has no hardcoded map label or pin count in the SVG', () => {
    const screen = code(read(SCREEN));
    expect(screen).not.toMatch(/textAnchor="middle">\s*(GUD|OOT|COO|KOT|KUN)\s*</);
    expect(screen).not.toMatch(/fontSize="(?:7\.5|6\.5)" fontWeight="700" textAnchor="middle">\d+</);
  });

  it('never mutates zones locally: the fixture-era setZones / setLocations / setFarmersList are gone', () => {
    const screen = code(read(SCREEN));
    expect(screen).not.toMatch(/\bsetZones\b|\bsetLocations\b|\bsetFarmersList\b|\bsetUnassignedFarmers\b|\bsetWarehouseMappings\b|\bsetRecentTransfers\b/);
  });
});

describe('what has no source is the shared dash', () => {
  it.each(FILES.map((f) => path.relative(ZONES, f)))('%s never writes the em-dash literal as a value', (file) => {
    const src = code(read(path.join(ZONES, file)));
    // "(frozen — no new assignments)" style prose lives in the catalogue, not here.
    expect(src).not.toMatch(/['"`]—['"`]/);
  });

  it('the screen reuses ADMIN_NO_VALUE', () => {
    expect(read(SCREEN)).toMatch(/from '..\/..\/utils\/noValue'/);
    expect(code(read(SCREEN)).match(/ADMIN_NO_VALUE/g)?.length ?? 0).toBeGreaterThan(20);
  });

  it('the logic file types every unsourced field as null', () => {
    const logic = read(LOGIC);
    for (const field of ['farmAreaAcres: null', 'boundaryPoints: null', 'locationsCount: null', 'district: null', 'acres: null', 'farmingType: null', 'sinceDate: null']) {
      expect(logic, field).toContain(field);
    }
  });

  it('counts derived from a paged list go through countLoadedWhere', () => {
    expect(read(LOGIC)).toMatch(/countLoadedWhere\(/);
  });
});

describe('tokens and i18n only', () => {
  it.each(FILES.map((f) => path.relative(ZONES, f)))('%s has no raw colour literal', (file) => {
    const src = code(read(path.join(ZONES, file)));
    expect(src).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(src).not.toMatch(/\brgba?\(/);
  });

  it('every t("zones.*") key the screen uses exists in the English catalogue', () => {
    const src = read(SCREEN);
    const keys = new Set<string>();
    for (const m of src.matchAll(/'(zones\.[A-Za-z0-9_.]+)'/g)) keys.add(m[1]!);
    for (const type of ['organic', 'natural', 'biodynamic']) keys.add(`zones.report.type.${type}`);
    expect(keys.size).toBeGreaterThan(30);
    for (const key of keys) expect(Object.prototype.hasOwnProperty.call(en, key), key).toBe(true);
  });

  it('the logic file stays free of React, react-native and i18n', () => {
    const logic = code(read(LOGIC));
    expect(logic).not.toMatch(/from 'react'|from 'react-native'|from '..\/..\/i18n'/);
  });
});

describe('writes the spec does not have are not faked', () => {
  const screen = code(read(SCREEN));

  it('every zone write handler reports "not available" and changes nothing', () => {
    expect(screen).toMatch(/const notifyUnavailable = \(\) =>/);
    for (const h of ['handleSaveZone', 'handleDeactivateZone', 'handleReactivateZone', 'handleArchiveZone', 'handleSaveNewLocation', 'handleConfirmFarmerAssignment', 'handleConfirmBulkAssignment', 'handleExportReport']) {
      expect(screen, h).toMatch(new RegExp(`const ${h} = .*notifyUnavailable`));
    }
  });

  it('shows no success alert for a change that never happened', () => {
    expect(screen).not.toMatch(/Alert\.alert\(\s*'(Zone Created|Zone Deactivated|Zone Reactivated|Zone Archived|Location Added|Transfer Confirmed|Mapping Added|Mapping Removed|Boundary Saved|Saved)'/);
  });
});
