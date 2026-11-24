# Antigravity brief 01 — Communities backend

**Scope: `apps/api` only. Do not touch `apps/mobile` or `apps/admin-web`.**

## Why

The admin app has three screens that currently do nothing, because no community
resource exists in the API: `CommunitiesListScreen`, `CommunityDetailsScreen` and
`CreateCommunityScreen`. They are visible but disabled with a note. This brief builds
the backend they need.

## The model — decided by the owner, 2026-11-24

**A community works like a WhatsApp Community: a container that holds many groups.**

- A community has many groups. A group belongs to at most one community (a group may
  also stand alone, as today — do not make `community_id` mandatory).
- Members belong to groups. Community membership is derived through group membership;
  do not invent a separate direct-join table unless you can show the screens need one,
  and say so if you do.
- A community carries its own announcements (that link is brief 02's concern if it
  lands first — coordinate, do not duplicate).

`learning_groups` already exists (`db/migrations/0038_learning_hub.sql`) with
`learning_group_memberships`. Build on those; do not create a parallel group concept.

## What to build

1. **Migration** — a new numbered file in `db/migrations/` with a `-- +migrate Down`.
   Never modify a migration that has already run. The latest is `0190`.
   - `communities` table. At minimum: id, name, description, category, is_archived /
     archived_at, created_by, created_at, updated_at, deleted_at. Follow the column
     conventions of `learning_groups` exactly — read it first.
   - `community_id uuid REFERENCES communities (id)` on `learning_groups`, nullable.
     Argue your `ON DELETE` choice in a comment in the migration, as `0190` does.

2. **Endpoints**, following the existing `learning-hub` module's shape:
   - `GET /admin/communities` (page/limit, like the other learning lists — these are
     page-paginated, NOT cursor-paginated; check `LearningGroupsListResponse`)
   - `POST /admin/communities`
   - `GET /admin/communities/{id}`
   - `PATCH /admin/communities/{id}`
   - `POST /admin/communities/{id}/archive` (mirror the group archive, BR-59q)
   - `GET /admin/communities/{id}/groups` — the groups in this community
   - `GET /admin/communities/{id}/members` — derived through group membership
   - Add an optional `communityId` filter to the existing `GET /admin/learning/groups`,
     and accept `communityId` on group create/update so a group can be placed in one.

3. **Permission.** `community.group.moderate` already exists in `docs/rbac.json`
   (SUPER_ADMIN / TOHFA_ADMIN / FARMER_ADMIN, `all`) and is enforced by **zero routes**.
   Decide whether it is the right gate for these endpoints or whether managing a
   community is `learning.admin.manage`. **Justify the choice in your report.** Do not
   invent a new permission code without flagging it loudly.

## House rules — these are not optional

Read `/CLAUDE.md` and `/apps/api/CLAUDE.md` before writing anything.

- **Module shape**: `routes` (wiring only) → `schema` (Zod, matching openapi exactly) →
  `service` (logic, takes a `ResolvedScope`, never a `Request`) → `repo` (SQL only, takes
  an `Executor`). Copy `apps/api/src/modules/warehouses/`. There is a scaffolder:
  `pnpm exec tsx scripts/new-module.ts <name>`.
- **Authorization is server-side and data-driven.** Never `if (user.role === '...')` in a
  handler. Cross-scope reads return an **empty result set, not 403** — a 403 leaks that
  the row exists.
- **Mutating admin actions write an `audit_log` row inside the same transaction**
  (`withTransaction`, same client). An action that rolls back must not leave an audit row.
- **Errors**: throw `AppError` with a code from `packages/shared-types/src/errors.ts`.
  A new code goes in `errors.ts` **and** the `Problem` schema in `docs/openapi.yaml`.
- **`docs/openapi.yaml` must match the implementation.** `pnpm spec:lint` must pass with
  0 errors.
- A new business rule goes in `docs/rules.md` with an id and a test contract, and must be
  **called out loudly in your report** — it is a specification change the owner signs off.

## Database safety — absolute

- **NEVER touch the database named `tohfa`.** It is the owner's working database.
- Commands needing no database: `DATABASE_URL=postgres://nobody:nobody@127.0.0.1:1/no_such_db`
- Integration tests: `DATABASE_URL=postgres://tohfa:tohfa@localhost:5432/tohfa_test`
- Never leave `DATABASE_URL` unset. Never use `env $E` tricks in zsh. Never read or print
  a `.env` file.
- Never start or stop Metro, the API, an emulator, or docker.

## Git

**Never commit, push, merge, branch, stage, or open a PR.** The owner commits. Leave the
work in the working tree.

## Tests — write them first and watch them fail

- Unit: service against a mocked repo. Integration: real pool, gated on `DATABASE_URL`,
  wrapped in a transaction that rolls back.
- Any business rule touched gets a test named with its `BR-xx` id.
- Add rows to `apps/api/src/rbac/rbac.test.ts` — it is table-driven over `docs/rbac.json`
  and is the only thing between a typo and a privilege escalation.
- **Never delete, skip or weaken a test to go green.** Leave it failing and explain why.

## Verify — paste real terminal output, never a summary

Establish a **baseline first** (run each before editing, save the output), then compare:

```
DATABASE_URL=postgres://nobody:nobody@127.0.0.1:1/no_such_db pnpm --filter @tohfa/api typecheck
DATABASE_URL=postgres://tohfa:tohfa@localhost:5432/tohfa_test pnpm --filter @tohfa/api test
DATABASE_URL=postgres://nobody:nobody@127.0.0.1:1/no_such_db pnpm spec:lint
DATABASE_URL=postgres://nobody:nobody@127.0.0.1:1/no_such_db pnpm rbac:check
```

The API suite has a known isolation defect that fails about one random file per run.
**Judge by the failing FILE list, not the count**, and say if you see it.
Report "no NEW failures vs baseline" with both lists, or name exactly what you broke.

## Collision warning

`docs/openapi.yaml` and `docs/rules.md` are single shared files. If briefs 02 and 03 are
running at the same time, **do not edit those two files concurrently** — finish and hand
back, or coordinate. A clobbered spec file is worse than a slow build.

## Report

The migration you wrote and why you chose that shape, every endpoint with its permission
gate, the permission decision and its justification, any new business rule, and all four
verification outputs verbatim. Flag anything ambiguous instead of guessing.
