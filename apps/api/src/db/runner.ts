/**
 * Migration + seed runner (the logic behind `pnpm db:migrate | db:rollback | db:seed`).
 * `migrate.ts` is the CLI shim; this file takes its pool and directories as
 * arguments so it can be exercised against a throwaway database in a test.
 * See `migrate.ts` for the file conventions and the version-key rules.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type pg from 'pg';
import {
  type AppliedRow,
  type MigrationFile,
  byFilename,
  checksum,
  hasStatements,
  planLegacyUpgrades,
  planMigrationFiles,
  splitSections,
} from './migrationFiles.js';

const TRACKING_TABLE = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version     text PRIMARY KEY,
    name        text NOT NULL,
    checksum    text NOT NULL,
    applied_at  timestamptz NOT NULL DEFAULT now()
  )
`;

/**
 * Seeds are classified explicitly. A seed that is not listed here is an error,
 * not a default, so a new seed file forces a decision about whether it is safe
 * on a shared database.
 *
 *   reference  idempotent catalogue/permission data; runs on every `db:seed`.
 *   dev        retired seeds (owner decision: they do not have proper data and a
 *              fresh seed will be written; the files are slated for deletion).
 *              Until they are removed from db/seed they run only when
 *              SEED_DEV_USERS=true and never when NODE_ENV=production, so the
 *              default `db:seed` is exactly 001 + 002.
 */
export const SEED_KINDS: Readonly<Record<string, 'reference' | 'dev'>> = {
  '001_reference.sql': 'reference',
  '002_permissions.js': 'reference',
  '003_dev_users.sql': 'dev',
  '004_demo.js': 'dev',
  // Inserts plots for every farm that has none and DELETEs all
  // crop_rotation_entries / cover_crop_windows on every run: that is a demo
  // fixture, not reference data, and destructive against real farmers' data.
  '005_crop_rotation_seed.sql': 'dev',
  // Retired with the others (owner decision), although it is only catalogue data.
  '006_pest_library_seed.sql': 'dev',
};

export interface SeedPlan {
  run: string[];
  skipped: { file: string; reason: string }[];
}

export function planSeeds(fileNames: readonly string[], env: NodeJS.ProcessEnv): SeedPlan {
  const files = fileNames
    .filter((file) => file.endsWith('.sql') || file.endsWith('.js'))
    .slice()
    .sort(byFilename);

  const unclassified = files.filter((file) => SEED_KINDS[file] === undefined);
  if (unclassified.length > 0) {
    throw new Error(
      `Seed file(s) not classified as reference or dev in SEED_KINDS (apps/api/src/db/runner.ts): ` +
        `${unclassified.join(', ')}. Decide whether each is safe to run on every database.`,
    );
  }

  const devEnabled = env['SEED_DEV_USERS'] === 'true';
  if (devEnabled && env['NODE_ENV'] === 'production') {
    throw new Error(
      'SEED_DEV_USERS=true is refused when NODE_ENV=production: the dev seeds create accounts ' +
        'with a publicly known password.',
    );
  }

  const plan: SeedPlan = { run: [], skipped: [] };
  for (const file of files) {
    if (SEED_KINDS[file] === 'dev' && !devEnabled) {
      plan.skipped.push({ file, reason: 'dev/demo seed; set SEED_DEV_USERS=true to run it' });
    } else {
      plan.run.push(file);
    }
  }
  return plan;
}

export interface RunnerOptions {
  pool: pg.Pool;
  migrationsDir: string;
  seedDir: string;
  /** The (TLS-adjusted) URL handed to executable seeds, which own their own connection. */
  databaseUrl: string;
  env?: NodeJS.ProcessEnv;
  log?: (message: string) => void;
}

export function createRunner(options: RunnerOptions) {
  const { pool, migrationsDir, seedDir } = options;
  const env = options.env ?? process.env;
  // eslint-disable-next-line no-console
  const log = options.log ?? ((message: string) => console.log(message));

  async function withTransaction<T>(fn: (tx: pg.PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch {
        // the original error is the useful one
      }
      throw error;
    } finally {
      client.release();
    }
  }

  function listMigrations(): MigrationFile[] {
    if (!existsSync(migrationsDir)) return [];
    return planMigrationFiles(readdirSync(migrationsDir));
  }

  const readUp = (migration: MigrationFile): string =>
    readFileSync(join(migrationsDir, migration.upFile), 'utf8');

  /**
   * Ensure the tracking table exists, upgrade legacy rows (bare numeric
   * version) to full file names, and return version -> checksum.
   */
  async function appliedVersions(migrations: MigrationFile[]): Promise<Map<string, string>> {
    await pool.query(TRACKING_TABLE);

    const read = async (): Promise<AppliedRow[]> =>
      (
        await pool.query<AppliedRow>(
          'SELECT version, name, checksum FROM schema_migrations ORDER BY version',
        )
      ).rows;

    let rows = await read();
    const sums = new Map(migrations.map((m) => [m.version, checksum(readUp(m))]));
    const upgrades = planLegacyUpgrades(migrations, rows, (m) => sums.get(m.version) ?? '');

    if (upgrades.length > 0) {
      await withTransaction(async (tx) => {
        for (const { from, to } of upgrades) {
          await tx.query('UPDATE schema_migrations SET version = $2 WHERE version = $1', [from, to]);
        }
      });
      for (const { from, to } of upgrades) log(`upgraded tracking row ${from} -> ${to}`);
      rows = await read();
    }

    return new Map(rows.map((row) => [row.version, row.checksum]));
  }

  async function up(): Promise<void> {
    const migrations = listMigrations();
    if (migrations.length === 0) {
      log('No migrations found in db/migrations — nothing to do.');
      return;
    }
    const applied = await appliedVersions(migrations);

    let count = 0;
    for (const migration of migrations) {
      const sql = readUp(migration);
      const sum = checksum(sql);
      const previous = applied.get(migration.version);

      if (previous !== undefined) {
        if (previous !== sum) {
          throw new Error(
            `Migration ${migration.version} has already been applied but its contents changed ` +
              `(recorded ${previous}, now ${sum}). Create a NEW migration instead of editing this one.`,
          );
        }
        continue;
      }

      const { up: upSql } = splitSections(sql);
      await withTransaction(async (tx) => {
        await tx.query(upSql);
        await tx.query(
          'INSERT INTO schema_migrations (version, name, checksum) VALUES ($1, $2, $3)',
          [migration.version, migration.version, sum],
        );
      });

      log(`applied  ${migration.version}`);
      count += 1;
    }

    log(count === 0 ? 'Database already up to date.' : `Applied ${count} migration(s).`);
  }

  async function down(all: boolean): Promise<void> {
    const migrations = listMigrations();
    const applied = await appliedVersions(migrations);
    if (applied.size === 0) {
      log('Nothing to roll back.');
      return;
    }

    // Reverse of the order `up` applies in: the position in the sorted file
    // list, so duplicated numeric prefixes roll back in exact reverse.
    const order = new Map(migrations.map((m, index) => [m.version, index]));
    const versions = [...applied.keys()].sort(
      (a, b) => (order.get(b) ?? Number.MAX_SAFE_INTEGER) - (order.get(a) ?? Number.MAX_SAFE_INTEGER),
    );
    const targets = all ? versions : versions.slice(0, 1);
    const byVersion = new Map(migrations.map((m) => [m.version, m]));

    let rolledBack = 0;
    for (const version of targets) {
      const migration = byVersion.get(version);
      if (migration === undefined) {
        throw new Error(
          `Cannot roll back ${version}: it is recorded as applied but no migration file with that name ` +
            `exists in db/migrations. Stopped after rolling back ${rolledBack} migration(s).`,
        );
      }

      // An inline `-- +migrate Down` section wins; a sibling `.down.sql` is the
      // fallback for migrations written in the older two-file style.
      let downSql: string | null = null;
      const inline = splitSections(readUp(migration)).down;
      if (inline !== null && hasStatements(inline)) {
        downSql = inline;
      } else if (migration.downFile !== null) {
        downSql = readFileSync(join(migrationsDir, migration.downFile), 'utf8');
      }

      if (downSql === null) {
        throw new Error(
          `Cannot roll back ${version}: it has no \`-- +migrate Down\` section and no ` +
            `${version}.down.sql. Stopped after rolling back ${rolledBack} migration(s); ` +
            `${version} and everything older is still applied.`,
        );
      }

      await withTransaction(async (tx) => {
        await tx.query(downSql);
        await tx.query('DELETE FROM schema_migrations WHERE version = $1', [version]);
      });
      log(`rolled back  ${version}`);
      rolledBack += 1;
    }
  }

  async function seed(): Promise<void> {
    if (!existsSync(seedDir)) {
      log('No db/seed directory — nothing to seed.');
      return;
    }

    const plan = planSeeds(readdirSync(seedDir), env);
    if (plan.run.length === 0 && plan.skipped.length === 0) {
      log('No seed files found.');
      return;
    }

    for (const { file, reason } of plan.skipped) log(`skipped ${file} (${reason})`);

    for (const file of plan.run) {
      const path = join(seedDir, file);

      if (file.endsWith('.js')) {
        // Executable seeds (e.g. 002_permissions.js, which projects
        // docs/rbac.json into permissions/role_permissions) own their own
        // connection and transaction handling.
        const result = spawnSync(process.execPath, [path], {
          stdio: 'inherit',
          env: { ...env, DATABASE_URL: options.databaseUrl },
        });
        if (result.status !== 0) {
          throw new Error(`seed ${file} exited with status ${String(result.status)}`);
        }
        log(`seeded  ${file}`);
        continue;
      }

      const sql = readFileSync(path, 'utf8');
      await withTransaction(async (tx) => {
        await tx.query(sql);
      });
      log(`seeded  ${file}`);
    }
  }

  return { up, down, seed, listMigrations };
}
