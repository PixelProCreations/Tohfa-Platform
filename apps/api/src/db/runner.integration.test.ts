/**
 * Runs the REAL migrations against a THROWAWAY database that this file creates
 * and drops itself (`tohfa_migtest_<pid>_<time>`). It never touches the
 * database named in DATABASE_URL beyond issuing CREATE/DROP DATABASE on that
 * server, and it refuses to run at all unless that server is local: a shared
 * (e.g. Supabase) database must never be the target of the test suite.
 */
import { mkdirSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MIGRATIONS_DIR, SEED_DIR } from '../paths.js';
import { planMigrationFiles } from './migrationFiles.js';
import { createRunner } from './runner.js';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);
const baseUrl = process.env['DATABASE_URL'] ?? '';
const dbName = `tohfa_migtest_${process.pid}_${Date.now()}`;

function urlFor(database: string): string {
  const url = new URL(baseUrl);
  url.pathname = `/${database}`;
  return url.toString();
}

describe('migration runner against a throwaway database', () => {
  let ready = false;
  let admin: pg.Client | undefined;
  let pool: pg.Pool | undefined;
  let logs: string[] = [];

  const runner = () =>
    createRunner({
      pool: pool!,
      migrationsDir: MIGRATIONS_DIR,
      seedDir: SEED_DIR,
      databaseUrl: urlFor(dbName),
      log: (message) => logs.push(message),
    });
  const all = () => planMigrationFiles(readdirSync(MIGRATIONS_DIR));
  const applied = async () =>
    (await pool!.query<{ version: string }>('SELECT version FROM schema_migrations ORDER BY version')).rows.map(
      (r) => r.version,
    );

  beforeAll(async () => {
    try {
      if (!LOCAL_HOSTS.has(new URL(baseUrl).hostname)) {
        console.warn('[skip] DATABASE_URL is not a local server; migration integration test not run');
        return;
      }
      admin = new pg.Client({ connectionString: baseUrl });
      await admin.connect();
      await admin.query(`CREATE DATABASE ${dbName}`);
      pool = new pg.Pool({ connectionString: urlFor(dbName), max: 2 });
      await pool.query('SELECT 1');
      ready = true;
    } catch (error) {
      console.warn(`[skip] cannot create a throwaway database (${String(error)})`);
    }
  }, 30_000);

  afterAll(async () => {
    await pool?.end();
    if (admin !== undefined) {
      await admin.query(`DROP DATABASE IF EXISTS ${dbName} WITH (FORCE)`);
      await admin.end();
    }
  }, 30_000);

  it('a fresh build applies ALL migrations, including duplicated numeric prefixes', async () => {
    if (!ready) return;
    logs = [];
    await runner().up();

    const expected = all().map((m) => m.version);
    expect(await applied()).toEqual([...expected].sort());
    expect(expected.length).toBeGreaterThan(40);
    expect(await applied()).toContain('0021_farm_diary');
    expect(await applied()).toContain('0021_soil_management');
    expect(logs.filter((l) => l.startsWith('applied')).length).toBe(expected.length);
    expect(logs.at(-1)).toBe(`Applied ${expected.length} migration(s).`);
  }, 180_000);

  it('a second run is a no-op', async () => {
    if (!ready) return;
    logs = [];
    await runner().up();
    expect(logs).toEqual(['Database already up to date.']);
  }, 60_000);

  it('refuses to proceed when an applied migration file was edited (checksum guard)', async () => {
    if (!ready) return;
    await pool!.query("UPDATE schema_migrations SET checksum = 'tampered' WHERE version = '0001_extensions_and_enums'");
    await expect(runner().up()).rejects.toThrow(/0001_extensions_and_enums.*contents changed/);
    const real = (await import('./migrationFiles.js')).checksum;
    const { readFileSync } = await import('node:fs');
    await pool!.query('UPDATE schema_migrations SET checksum = $1 WHERE version = $2', [
      real(readFileSync(join(MIGRATIONS_DIR, '0001_extensions_and_enums.sql'), 'utf8')),
      '0001_extensions_and_enums',
    ]);
  }, 60_000);

  it('--down --all rolls back in exact reverse order, then up works again', async () => {
    if (!ready) return;
    logs = [];
    await runner().down(true);

    const expected = all().map((m) => m.version);
    expect(logs.filter((l) => l.startsWith('rolled back')).map((l) => l.replace('rolled back  ', ''))).toEqual(
      [...expected].reverse(),
    );
    expect(await applied()).toEqual([]);
    const users = await pool!.query("SELECT to_regclass('public.users') AS t");
    expect(users.rows[0]?.t).toBeNull();

    logs = [];
    await runner().up();
    expect(await applied()).toEqual([...expected].sort());
  }, 300_000);

  it('--down (single step) rolls back only the newest migration', async () => {
    if (!ready) return;
    const expected = all().map((m) => m.version);
    await runner().down(false);
    expect(await applied()).toEqual(expected.slice(0, -1).sort());
    await runner().up();
    expect(await applied()).toHaveLength(expected.length);
  }, 120_000);

  it('upgrades a schema_migrations table written by the old (numeric-prefix) runner in place', async () => {
    if (!ready) return;
    // Rewrite every row the old runner could have written: the first file of
    // each prefix keyed by the bare prefix. (The old runner could not record a
    // second file of a duplicated prefix at all, so those stay full-name rows.)
    const seen = new Set<string>();
    for (const migration of all()) {
      if (seen.has(migration.prefix)) continue;
      seen.add(migration.prefix);
      await pool!.query('UPDATE schema_migrations SET version = $1 WHERE version = $2', [
        migration.prefix,
        migration.version,
      ]);
    }
    expect((await applied()).filter((v) => /^\d+$/.test(v)).length).toBeGreaterThan(30);

    logs = [];
    await runner().up();

    const expected = all().map((m) => m.version);
    expect(await applied()).toEqual([...expected].sort());
    expect(logs.some((l) => l.startsWith('applied '))).toBe(false); // nothing was re-run
    expect(logs.filter((l) => l.startsWith('upgraded tracking row')).length).toBe(seen.size);
    expect(logs).toContain('upgraded tracking row 0021 -> 0021_farm_diary');
    expect(logs).toContain('upgraded tracking row 0022 -> 0022_cover_crop_windows');
    expect(logs.at(-1)).toBe('Database already up to date.');
  }, 60_000);

  it('rollback stops with a clear message at a migration that has no Down section', async () => {
    if (!ready) return;
    await runner().down(true);

    const dir = mkdtempSync(join(tmpdir(), 'tohfa-migtest-'));
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, '0001_a.sql'), '-- +migrate Up\nCREATE TABLE mig_a (id int);\n-- +migrate Down\nDROP TABLE mig_a;\n');
    writeFileSync(join(dir, '0002_b.sql'), '-- +migrate Up\nCREATE TABLE mig_b (id int);\n');
    writeFileSync(join(dir, '0003_c.sql'), '-- +migrate Up\nCREATE TABLE mig_c (id int);\n-- +migrate Down\nDROP TABLE mig_c;\n');
    const small = createRunner({
      pool: pool!,
      migrationsDir: dir,
      seedDir: SEED_DIR,
      databaseUrl: urlFor(dbName),
      log: () => undefined,
    });

    await small.up();
    await expect(small.down(true)).rejects.toThrow(
      /Cannot roll back 0002_b: it has no `-- \+migrate Down` section.*rolling back 1 migration/,
    );
    // 0003_c was rolled back, 0002_b and 0001_a are still applied and their tables still exist.
    expect(await applied()).toEqual(['0001_a', '0002_b']);
    const tables = await pool!.query(
      "SELECT to_regclass('public.mig_b') IS NOT NULL AS b, to_regclass('public.mig_c') IS NULL AS c_gone",
    );
    expect(tables.rows[0]).toEqual({ b: true, c_gone: true });
  }, 120_000);
});
