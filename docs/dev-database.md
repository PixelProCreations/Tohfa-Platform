# Dev database (shared Supabase Postgres)

## The model

| What | Where |
|---|---|
| Dev's shared Postgres | A Supabase project, used as **plain Postgres only**. The app has its own auth and RBAC (`docs/rbac.json`); no Supabase Auth, no RLS, no Supabase client libraries. |
| Redis | **Local**, from the `redis` service in `docker-compose.yml` (`REDIS_URL=redis://localhost:6379`). `pnpm dev` starts it (`docker compose up -d --wait redis`). Docker is therefore still required for Redis, and optional for Postgres. |
| Tests | A **throwaway** database (local Docker Postgres, `tohfa_test` or a per-run shadow DB). Never the shared one. |
| Feature branches | Use their own local / throwaway database (`pnpm infra:up` gives a local Postgres + Redis). They do not touch the shared DB. |

`.env` selects the database: `DATABASE_URL` (+ `DATABASE_SSL`). See the
"Shared Dev database on Supabase" block in `.env.example` for the URL shapes.

## THE RULE

> **Only code that is merged into Dev may migrate the shared database.**
> Never run `db:migrate`, `db:rollback`, `db:reset` or `db:seed` with
> `DATABASE_URL` pointing at the shared DB from a feature branch.

Why: a feature branch can contain a migration that is later renamed, rewritten
or dropped in review. Once it has run on the shared DB, every other developer's
schema is now different from the branch they are testing, and the runner refuses
to re-run an edited file (checksum guard).

Who runs it: **one named person** (or a CI step that runs after the merge to
Dev), by checking out Dev and running `pnpm db:migrate` with the shared
`DATABASE_URL`. Everyone else does `git pull` and waits for the migration to be
announced. `db:rollback --all` / `db:reset` on the shared DB drops every table:
do not run them there.

The migration runner needs only `DATABASE_URL` (and `DATABASE_SSL`); it does not
load the API's other environment variables.

## Supabase project checklist (owner)

Not verifiable from the repo; to be done in the Supabase dashboard.

1. **Region**: `ap-south-1` (Mumbai), the closest to the Nilgiris users.
2. **Turn off the Data API (PostgREST)** for the project (Settings > API), or
   remove `public` from the exposed schemas. Otherwise every table in `public`
   is reachable over HTTPS with the project's `anon` key. The app never uses it.
3. **Connection string**: use the **direct connection** or the **session
   pooler** (port **5432**). Do **not** use the transaction pooler (port
   **6543**): it does not give each client a stable session, so session-level
   features (advisory locks, `SET`, `LISTEN`, named prepared statements) are not
   reliable. (The direct host may be IPv6-only; if your network has no IPv6, the
   session pooler is the option that works.)
4. **Extensions** (Database > Extensions): enable `postgis`, `pgcrypto`,
   `btree_gist`. Migration `0001` runs `CREATE EXTENSION IF NOT EXISTS` for all
   three; enable them in the dashboard first so the migration does not need
   privileges Supabase may withhold.
5. **Network restrictions** (Database settings), if the plan offers them: allow
   only the team's IPs.
6. **Free tier** projects pause after about a week of inactivity; the first
   request after a pause fails until the project is restored from the dashboard.
7. Use a strong database password; share it through a password manager, not chat
   or git. Rotate it when a person leaves.

TLS: set `DATABASE_SSL=no-verify` (encrypted, certificate not verified) or
`DATABASE_SSL=true` with the provider CA (`sslrootcert=` in the URL or
`NODE_EXTRA_CA_CERTS`). A bare `?sslmode=require` does **not** mean what it does
in `psql`: the installed `pg` 8.23 treats it as `verify-full` (it prints a
security warning saying so), which fails against Supabase's own CA. This is
covered by `apps/api/src/db/poolConfig.test.ts`.

## Seeds on the shared database

The shared database gets **only `001_reference.sql` and `002_permissions.js`**
(roles, the four fixed warehouses, categories, grades, `system_config`, and the
permission grants projected from `docs/rbac.json`). `pnpm db:seed` runs exactly
those two, and they are idempotent (a second run leaves identical row counts).

The older seeds (`003_dev_users.sql`, `004_demo.js`, `005_crop_rotation_seed.sql`,
`006_pest_library_seed.sql`) are **retired by owner decision**: they do not have
proper data, and a fresh seed will be written later. Until the files are deleted
from the tree the runner skips them unless `SEED_DEV_USERS=true`, and refuses
that flag when `NODE_ENV=production`. Never set it against the shared DB:
`003` creates SUPER_ADMIN and other admins with the publicly known password
`Password@123`, and `005` deletes all crop-rotation rows on every run.

**There are no seeded users, so on the shared DB the first admin must be created
separately.** No mechanism for that exists yet; a fresh seed will be added.

## Tests

The test suite **commits rows** (the e2e suites) and can modify shared
reference tables (roles, permissions, `system_config`, ...). Never run `pnpm test`,
`test:e2e` or `test:smoke` with `DATABASE_URL` pointing at the shared DB. Use a
throwaway database, e.g.:

```bash
docker exec tohfa-postgres psql -U tohfa -d postgres -c "CREATE DATABASE tohfa_mine"
export DATABASE_URL=postgres://tohfa:tohfa@localhost:5432/tohfa_mine
pnpm db:migrate && pnpm db:seed
pnpm test
```

Some tests depend on the retired seeds (the seeded admin accounts, the pest
catalogue); on a database seeded with only `001` + `002` they fail until a new
seed exists. With `SEED_DEV_USERS=true pnpm db:seed` on a **throwaway** database
the retired seeds still load. The
migration-runner integration test creates and drops its own database and skips
itself when `DATABASE_URL` is not a local server.

## What is NOT verified

Nobody on this change had access to a Supabase project, so none of the following
has been run against a real one:

- Connecting with `DATABASE_SSL=no-verify` / `true` to Supabase. Verified only
  that `pg`'s own parser turns the config into the intended `ssl` options
  (`poolConfig.test.ts`); no TLS handshake was performed.
- `db:migrate` on Supabase: privileges for `CREATE EXTENSION` (postgis,
  pgcrypto, btree_gist) and for the trigger / `REVOKE ... FROM tohfa_app` logic in
  migration `0001`. Migrations were verified on the local `postgis/postgis:16-3.4`
  image only, as a superuser.
- The test suite on Supabase. Some tests need a privileged role
  (`golden-thread.e2e.test.ts` runs `ALTER TABLE ... DISABLE TRIGGER ALL`); that
  only matters for tests, which must not run on the shared DB anyway.
- Supabase specifics stated above from general knowledge, not checked here:
  IPv6-only direct host, free-tier pause behaviour, the dashboard location of the
  Data API switch and network restrictions.

## Suggestion (not applied)

BullMQ expects Redis `maxmemory-policy noeviction`. The compose Redis does not set
it (`command: ['redis-server', '--appendonly', 'yes']`). Adding
`'--maxmemory-policy', 'noeviction'` to that command is a one-line compose change
that nobody has made here; until then, `docker exec tohfa-redis redis-cli config
set maxmemory-policy noeviction` sets it until the container restarts.
