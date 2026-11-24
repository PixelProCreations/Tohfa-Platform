# Antigravity brief 02 — Content review workflow

**Scope: `apps/api` only. Do not touch `apps/mobile` or `apps/admin-web`.**

## Why

The admin app has a "Submit for Review" button and a Pending Review screen. Neither does
anything: there is no review state, no reviewer and no approval date anywhere in the
Learning Hub API. The buttons are currently disabled with a note. This brief builds the
backend behind them.

## The model — decided by the owner, 2026-11-24

> "if tohfa admin creates content he submits for review to superadmin and also can
> publish immediately after submitting for review"

Read that carefully, because it is **not** a normal draft→approve→publish pipeline:

**Review state and published state are two independent axes.**

- A TOHFA Admin creating content submits it to the Super Admin for review.
- The same admin **may publish it immediately**, without waiting for that review.
- So content can legitimately be **published AND pending review at the same time**.
- Publishing is therefore never blocked by review state. Do not add such a block.

Review state applies to the four Learning Hub content types: **articles, videos,
trainings, groups** — confirm against the screens which of those actually offer the
button, and say in your report if any should be excluded.

## What to build

1. **Migration** — a new numbered file in `db/migrations/` with `-- +migrate Down`.
   Never modify a migration that has already run. The latest is `0190`.
   Add review columns to the content tables. At minimum a review status, the reviewer,
   the decision timestamp, and a decision note. Propose the status value set and argue
   it — something like `NOT_SUBMITTED | PENDING_REVIEW | APPROVED | REJECTED`, with a
   CHECK constraint, matching how `announcements.scope` and `learning_*` columns are
   constrained in this schema.

2. **Endpoints**, extending the existing `learning-hub` module:
   - `POST /admin/learning/{type}/{id}/submit-review` — moves to PENDING_REVIEW
   - `POST /admin/learning/{type}/{id}/review` — the Super Admin's decision
     (approve or reject, with an optional note)
   - Return the review fields on every read (list rows and detail), so the Pending
     Review screen can show status, reviewer and decision date instead of dashes.
   - A list filter by review status, so the Pending Review screen can ask for exactly
     the pending items rather than filtering client-side.

3. **Permissions.** There is no review permission in `docs/rbac.json` today. You will
   need one — a reviewer code such as `learning.content.review`, granted to SUPER_ADMIN.
   **Adding a permission code is a specification change: call it out loudly**, add it to
   `docs/rbac.json`, add table rows to `apps/api/src/rbac/rbac.test.ts` pinning it across
   all seven roles, and make sure `pnpm rbac:check` still passes.
   Submitting for review is a write to one's own content and should sit under the
   existing `learning.admin.manage` — justify if you disagree.

4. **Rules.** This is new behaviour and needs a numbered rule in `docs/rules.md` with a
   test contract. BR-59r is taken (crop tagging); use the next free letter. State the
   independence of review and publish explicitly, because it is the surprising part and
   a future reader will otherwise "fix" it into a pipeline.

## Questions to resolve and report, not guess

- Can a Super Admin's own content skip review, or does everyone submit?
- Does rejecting published content unpublish it? (Owner's model implies **no** — they are
  independent — but say what you implemented.)
- Can content be resubmitted after rejection?
Answer these in the report with what you chose and why; the owner will confirm.

## House rules — these are not optional

Read `/CLAUDE.md` and `/apps/api/CLAUDE.md` first.

- **Module shape**: `routes` (wiring only) → `schema` (Zod matching openapi exactly) →
  `service` (takes a `ResolvedScope`, never a `Request`) → `repo` (SQL only, takes an
  `Executor`). The canonical module is `apps/api/src/modules/warehouses/`.
- **Authorization is server-side and data-driven.** Never a role-name check in a handler.
  Cross-scope reads return an **empty result set, not 403**.
- **Mutating admin actions write an `audit_log` row inside the same transaction**
  (`withTransaction`, same client). A review decision is exactly the kind of action
  someone will later need to prove happened.
- **Errors**: `AppError` with a code from `packages/shared-types/src/errors.ts`. A new
  code goes in `errors.ts` **and** the `Problem` schema in `docs/openapi.yaml`.
- **`docs/openapi.yaml` must match the implementation.** `pnpm spec:lint`, 0 errors.

## Database safety — absolute

- **NEVER touch the database named `tohfa`.** It is the owner's working database.
- No database needed: `DATABASE_URL=postgres://nobody:nobody@127.0.0.1:1/no_such_db`
- Integration tests: `DATABASE_URL=postgres://tohfa:tohfa@localhost:5432/tohfa_test`
- Never leave `DATABASE_URL` unset. No `env $E` tricks. Never read or print a `.env`.
- Never start or stop Metro, the API, an emulator, or docker.

## Git

**Never commit, push, merge, branch, stage, or open a PR.** The owner commits.

## Tests — write them first and watch them fail

Unit against a mocked repo; integration gated on `DATABASE_URL`, in a rolled-back
transaction. Cover the independence explicitly: **a published item can be pending review,
and a review decision does not change `isPublished`.** Name rule tests with their `BR-xx`.
**Never delete, skip or weaken a test to go green.**

## Verify — paste real terminal output, never a summary

Baseline first, then compare:

```
DATABASE_URL=postgres://nobody:nobody@127.0.0.1:1/no_such_db pnpm --filter @tohfa/api typecheck
DATABASE_URL=postgres://tohfa:tohfa@localhost:5432/tohfa_test pnpm --filter @tohfa/api test
DATABASE_URL=postgres://nobody:nobody@127.0.0.1:1/no_such_db pnpm spec:lint
DATABASE_URL=postgres://nobody:nobody@127.0.0.1:1/no_such_db pnpm rbac:check
```

The API suite has a known isolation defect failing about one random file per run — judge
by the failing FILE list, not the count. Report "no NEW failures vs baseline" with both
lists, or name exactly what you broke.

## Collision warning

`docs/openapi.yaml`, `docs/rules.md` and `docs/rbac.json` are shared single files. If
briefs 01 and 03 are running concurrently, **do not edit them at the same time**.

## Report

The migration, the status value set and why, every endpoint with its gate, the new
permission and its rbac rows, the new business rule, your answers to the three open
questions above, and all four verification outputs verbatim.
