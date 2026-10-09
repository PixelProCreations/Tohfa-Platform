/**
 * Pure helpers for the migration runner: file ordering, version naming, the
 * `-- +migrate Up/Down` splitter and the legacy-version mapping. No I/O and no
 * database, so all of it is unit-testable with a fake file list.
 */
import { createHash } from 'node:crypto';

export interface MigrationFile {
  /**
   * The key stored in `schema_migrations.version`: the FULL file name without
   * `.sql` (e.g. `0021_soil_management`). Numeric prefixes are not unique in
   * this repo (0021..0025 each exist twice), so the prefix alone cannot be a key.
   */
  version: string;
  /** Leading digits, e.g. `0021`. What the pre-2026-10 runner used as `version`. */
  prefix: string;
  upFile: string;
  /** Name of the sibling `<version>.down.sql`, when present. */
  downFile: string | null;
}

const UP_MARKER = /^[^\S\r\n]*--[^\S\r\n]*\+migrate[^\S\r\n]+Up[^\S\r\n]*$/im;
const DOWN_MARKER = /^[^\S\r\n]*--[^\S\r\n]*\+migrate[^\S\r\n]+Down[^\S\r\n]*$/im;

/** Filename order. `localeCompare(..., 'en')` is the order the schema was built in; do not change it. */
export const byFilename = (a: string, b: string): number => a.localeCompare(b, 'en');

export function prefixOf(version: string): string {
  const separator = version.indexOf('_');
  return separator === -1 ? version : version.slice(0, separator);
}

/** Turn a directory listing into ordered migrations (`.down.sql` files are pairing data, not migrations). */
export function planMigrationFiles(fileNames: readonly string[]): MigrationFile[] {
  const present = new Set(fileNames);
  return fileNames
    .filter((file) => file.endsWith('.sql') && !file.endsWith('.down.sql'))
    .slice()
    .sort(byFilename)
    .map((file) => {
      const version = file.slice(0, -'.sql'.length);
      const downFile = `${version}.down.sql`;
      return {
        version,
        prefix: prefixOf(version),
        upFile: file,
        downFile: present.has(downFile) ? downFile : null,
      };
    });
}

/**
 * Split a migration file into its `up` and `down` halves.
 * Files without `-- +migrate Up` markers are up-only (the older
 * `<name>.down.sql` convention then supplies the down).
 */
export function splitSections(sql: string): { up: string; down: string | null } {
  const upMatch = UP_MARKER.exec(sql);
  if (upMatch === null) return { up: sql, down: null };

  const afterUp = sql.slice(upMatch.index + upMatch[0].length);
  const downMatch = DOWN_MARKER.exec(afterUp);
  if (downMatch === null) return { up: afterUp, down: null };

  return {
    up: afterUp.slice(0, downMatch.index),
    down: afterUp.slice(downMatch.index + downMatch[0].length),
  };
}

/** True when a SQL chunk contains something other than comments/whitespace. */
export function hasStatements(sql: string): boolean {
  return (
    sql
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('--'))
      .join('')
      .trim().length > 0
  );
}

export function checksum(contents: string): string {
  return createHash('sha256').update(contents).digest('hex').slice(0, 16);
}

export interface AppliedRow {
  version: string;
  name: string;
  checksum: string;
}

export interface LegacyUpgrade {
  from: string;
  to: string;
}

/**
 * Legacy rows are those written by the old runner, whose `version` was a bare
 * numeric prefix (`0021`). Each is mapped to the migration it most plausibly
 * recorded:
 *
 *   1. the file whose full name equals the row's `name` column, if one has the prefix;
 *   2. otherwise the file whose checksum equals the row's recorded checksum;
 *   3. otherwise the FIRST file with that prefix in filename order.
 *
 * (1) and (2) only ever refine (3) when a database was built from the second
 * file of a duplicated prefix; for every unambiguous prefix all three agree.
 * A row whose prefix matches no file is left alone. A row whose version is
 * itself a real file name (a migration literally called `0042.sql`) is not legacy.
 */
export function planLegacyUpgrades(
  migrations: readonly MigrationFile[],
  applied: readonly AppliedRow[],
  checksumOf: (migration: MigrationFile) => string,
): LegacyUpgrade[] {
  const knownVersions = new Set(migrations.map((m) => m.version));
  const appliedVersions = new Set(applied.map((row) => row.version));
  const upgrades: LegacyUpgrade[] = [];
  const claimed = new Set<string>();

  for (const row of applied) {
    if (!/^\d+$/.test(row.version) || knownVersions.has(row.version)) continue;

    const candidates = migrations.filter((m) => m.prefix === row.version);
    if (candidates.length === 0) continue;

    const target =
      candidates.find((m) => m.version === row.name) ??
      candidates.find((m) => checksumOf(m) === row.checksum) ??
      candidates[0]!;

    // Never collide with a row that is already in the new format.
    if (appliedVersions.has(target.version) || claimed.has(target.version)) continue;
    claimed.add(target.version);
    upgrades.push({ from: row.version, to: target.version });
  }
  return upgrades;
}
