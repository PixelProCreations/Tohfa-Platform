import { describe, expect, it } from 'vitest';
import {
  type AppliedRow,
  type MigrationFile,
  hasStatements,
  planLegacyUpgrades,
  planMigrationFiles,
  splitSections,
} from './migrationFiles.js';

// A shuffled listing shaped like db/migrations: duplicated numeric prefixes
// (0021, 0022), a two-file style migration (0038 + .down.sql) and an up-only one.
const LISTING = [
  '0022_farm_diary_workforce.sql',
  '0021_soil_management.sql',
  '0038_learning_hub.down.sql',
  '0001_initial.sql',
  '0021_farm_diary.sql',
  '0022_cover_crop_windows.sql',
  '0038_learning_hub.sql',
  'README.md',
];

describe('planMigrationFiles', () => {
  it('orders by full filename, keeping both files of a duplicated numeric prefix', () => {
    expect(planMigrationFiles(LISTING).map((m) => m.version)).toEqual([
      '0001_initial',
      '0021_farm_diary',
      '0021_soil_management',
      '0022_cover_crop_windows',
      '0022_farm_diary_workforce',
      '0038_learning_hub',
    ]);
  });

  it('keys by full name (so versions are unique) while still exposing the numeric prefix', () => {
    const plan = planMigrationFiles(LISTING);
    expect(new Set(plan.map((m) => m.version)).size).toBe(plan.length);
    expect(plan.filter((m) => m.prefix === '0021')).toHaveLength(2);
  });

  it('pairs .down.sql by the same full name and never lists it as a migration', () => {
    const plan = planMigrationFiles(LISTING);
    expect(plan.find((m) => m.version === '0038_learning_hub')?.downFile).toBe(
      '0038_learning_hub.down.sql',
    );
    expect(plan.find((m) => m.version === '0021_farm_diary')?.downFile).toBeNull();
    expect(plan.some((m) => m.version.endsWith('.down'))).toBe(false);
  });
});

describe('splitSections', () => {
  it('runs only the Up half and exposes the Down half', () => {
    const { up, down } = splitSections('-- +migrate Up\nCREATE TABLE a();\n-- +migrate Down\nDROP TABLE a;\n');
    expect(up).toContain('CREATE TABLE a');
    expect(up).not.toContain('DROP TABLE');
    expect(down).toContain('DROP TABLE a');
  });

  it('treats a file without markers as up-only', () => {
    expect(splitSections('CREATE TABLE a();').down).toBeNull();
  });

  it('hasStatements ignores comments and whitespace', () => {
    expect(hasStatements('\n -- nothing\n  \n')).toBe(false);
    expect(hasStatements('-- c\nDROP TABLE a;')).toBe(true);
  });
});

describe('planLegacyUpgrades', () => {
  const plan: MigrationFile[] = planMigrationFiles(LISTING);
  const sums: Record<string, string> = {
    '0001_initial': 'sum-initial',
    '0021_farm_diary': 'sum-diary',
    '0021_soil_management': 'sum-soil',
    '0022_cover_crop_windows': 'sum-cover',
    '0022_farm_diary_workforce': 'sum-workforce',
    '0038_learning_hub': 'sum-hub',
  };
  const checksumOf = (m: MigrationFile): string => sums[m.version] ?? '';
  const row = (version: string, name: string, checksum: string): AppliedRow => ({ version, name, checksum });

  it('maps a bare-prefix row of an unambiguous prefix to its only file', () => {
    expect(planLegacyUpgrades(plan, [row('0001', '0001_initial', 'sum-initial')], checksumOf)).toEqual([
      { from: '0001', to: '0001_initial' },
    ]);
  });

  it('maps a duplicated prefix to the FIRST file in filename order by default', () => {
    // name/checksum give no hint (e.g. a row written by hand)
    expect(planLegacyUpgrades(plan, [row('0022', 'x', 'unknown')], checksumOf)).toEqual([
      { from: '0022', to: '0022_cover_crop_windows' },
    ]);
  });

  it('prefers the file named by the row, then the one with the recorded checksum, over the first', () => {
    expect(planLegacyUpgrades(plan, [row('0021', '0021_soil_management', 'x')], checksumOf)).toEqual([
      { from: '0021', to: '0021_soil_management' },
    ]);
    expect(planLegacyUpgrades(plan, [row('0021', 'old-name', 'sum-soil')], checksumOf)).toEqual([
      { from: '0021', to: '0021_soil_management' },
    ]);
  });

  it('leaves rows already keyed by full name, and rows whose prefix matches no file, alone', () => {
    const applied = [row('0001_initial', '0001_initial', 'sum-initial'), row('0099', '0099_gone', 'x')];
    expect(planLegacyUpgrades(plan, applied, checksumOf)).toEqual([]);
  });

  it('does not upgrade onto a version that is already recorded', () => {
    const applied = [row('0021', '0021_farm_diary', 'sum-diary'), row('0021_farm_diary', '0021_farm_diary', 'sum-diary')];
    expect(planLegacyUpgrades(plan, applied, checksumOf)).toEqual([]);
  });

  it('does not treat a migration literally named by digits only as legacy', () => {
    const digitsOnly = planMigrationFiles(['0042.sql']);
    expect(planLegacyUpgrades(digitsOnly, [row('0042', '0042', 'x')], () => 'x')).toEqual([]);
  });
});
