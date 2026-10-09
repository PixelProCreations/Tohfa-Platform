#!/usr/bin/env tsx
/**
 * SQL migration runner (CLI). Needs only DATABASE_URL (plus optional
 * DATABASE_SSL): it deliberately does NOT import `config.ts`, which would
 * demand JWT_SECRET, REDIS_URL and the rest of the API's environment.
 * The logic lives in `runner.ts`; pure helpers in `migrationFiles.ts`.
 *
 * Migrations are plain `.sql` files in `db/migrations`, applied in filename
 * order. Convention:
 *
 *   db/migrations/0001_initial.sql          -- the "up"
 *   db/migrations/0001_initial.down.sql     -- optional matching "down"
 *
 * A migration may instead carry BOTH directions in one file, delimited by
 * marker comments (the style every migration in this repo uses):
 *
 *   -- +migrate Up
 *   CREATE TABLE ...
 *   -- +migrate Down
 *   DROP TABLE ...
 *
 * When those markers are present only the relevant section is executed — the
 * whole file is never run as-is, or `db:migrate` would drop what it just made.
 *
 * ## How applied migrations are tracked
 *
 * `schema_migrations.version` is the FULL file name without `.sql`
 * (`0021_soil_management`). The numeric prefix is NOT unique in this repo
 * (0021..0025 each exist twice, written by different people in parallel), and
 * renaming an applied file is forbidden, so the name is the key. `.down.sql`
 * pairs by the same name. Order is filename order (`localeCompare`, 'en').
 * Editing an already-applied file is detected by checksum and refused: on a
 * shared database that silently produces divergent schemas.
 *
 * ### Backwards compatibility with the old runner
 *
 * The old runner keyed rows by the bare numeric prefix (`0021`). On every
 * run, before anything else, any such row is upgraded IN PLACE (one
 * transaction, `UPDATE schema_migrations SET version = <full name>`) to the
 * file it recorded: the file whose name equals the row's `name` column if it
 * has that prefix, else the file with the same checksum, else the FIRST file
 * with that prefix in filename order. The table layout is unchanged, so no DDL
 * is needed. A row whose prefix matches no file is left untouched.
 *
 * ### Rolling back
 *
 * `--down` rolls back the latest migration, `--down --all` all of them, in the
 * exact reverse of the apply order (so duplicated prefixes unwind correctly).
 * A migration with no Down section and no `.down.sql`, or an applied version
 * with no file, STOPS the rollback with an error naming it; nothing is skipped
 * silently and no tracking row is dropped without the schema change.
 *
 *   pnpm db:migrate            apply everything pending
 *   pnpm db:rollback           roll back the most recent migration
 *   pnpm db:rollback --all     roll back everything (used by db:reset)
 *   pnpm db:seed               run db/seed/* in filename order (idempotent).
 *                              Reference seeds (001, 002, 006) always run.
 *                              Dev seeds (003 users with a known password, 004
 *                              demo data, 005 rotation fixtures) run only with
 *                              SEED_DEV_USERS=true, and never when
 *                              NODE_ENV=production. See `SEED_KINDS`.
 */
import { config as loadDotenv } from 'dotenv';
import { join } from 'node:path';
import pg from 'pg';
import { MIGRATIONS_DIR, REPO_ROOT, SEED_DIR } from '../paths.js';
import { buildPoolConfig, applyDatabaseSsl, parseDatabaseSsl } from './poolConfig.js';
import { createRunner } from './runner.js';

loadDotenv({ path: join(REPO_ROOT, '.env') });

async function main(): Promise<void> {
  const databaseUrl = process.env['DATABASE_URL'];
  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error('DATABASE_URL is required (set it in .env or the environment).');
  }
  const ssl = parseDatabaseSsl(process.env['DATABASE_SSL']);

  // Same numeric-parsing rules as pool.ts: keep NUMERIC/BIGINT as strings.
  pg.types.setTypeParser(1700, (value: string) => value);
  pg.types.setTypeParser(20, (value: string) => value);

  const pool = new pg.Pool(buildPoolConfig({ databaseUrl, ssl, max: 2 }));
  pool.on('error', (error: Error) => console.error(`idle postgres client errored: ${error.message}`));

  const runner = createRunner({
    pool,
    migrationsDir: MIGRATIONS_DIR,
    seedDir: SEED_DIR,
    databaseUrl: applyDatabaseSsl(databaseUrl, ssl),
  });

  const args = process.argv.slice(2);
  try {
    if (args.includes('--seed')) {
      await runner.seed();
    } else if (args.includes('--down')) {
      await runner.down(args.includes('--all'));
    } else {
      await runner.up();
    }
  } finally {
    await pool.end();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
