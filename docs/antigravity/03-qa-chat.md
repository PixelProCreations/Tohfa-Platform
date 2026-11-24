# Antigravity brief 03 — Questions & Answers (Q&A chat)

**Scope: `apps/api` only. Do not touch `apps/mobile` or `apps/admin-web`.**

## Why

`QuestionAnswerChatScreen` in the admin app shows a thread with a reply box and
moderation actions. None of it works: there is no messaging resource in the API at all.
The thread is currently an honest "not built yet" panel and every action is disabled.

## The model — decided by the owner, 2026-11-24

> "in qa and chat build, anybody can answer"

**This is not an admin-only feature.** Farmers ask and farmers answer; admins take part
and moderate. That means this brief needs **farmer-facing endpoints as well as admin
ones**, and farmer permissions in `docs/rbac.json` — it is the widest of the three briefs.

## Resolve this before building, and report it

**What does a question hang off?** The screen is reached from the Community & Knowledge
module, so it is one of:
- a standalone question in a community or group,
- a thread attached to a knowledge item (an article or video),
- or both.

Read `QuestionAnswerChatScreen.tsx` and `CommunityKnowledgeFlow.tsx` to see what context
the screen is actually handed, and let that decide. **State your conclusion and the
evidence in the report** — this determines the table shape and is expensive to change
later. If genuinely ambiguous, build the narrower version and say so rather than
modelling both.

Note brief 01 may be introducing a `communities` table concurrently. If a question
belongs to a community, **coordinate** — do not duplicate or pre-empt that table.

## What to build

1. **Migration** — new numbered file in `db/migrations/` with `-- +migrate Down`. Never
   modify one that has already run. The latest is `0190`.
   Questions and answers. Follow the column conventions of `learning_articles` and
   `learning_group_memberships` — read both first. Soft delete (`deleted_at`) rather than
   hard delete, consistent with the rest of this schema.

2. **Endpoints.** Two surfaces:
   - **Farmer** (`/farmers/me/...`, mirroring the existing farmer learning routes): ask a
     question, list questions, read one with its answers, post an answer, edit or delete
     one's **own** post.
   - **Admin** (`/admin/...`): list and read across farmers, answer, and moderate —
     hide or remove a post, and whatever the screen's existing Block / Archive actions
     need. Check what the screen actually offers before inventing moderation verbs.

3. **Permissions.** `community.group.moderate` exists in `docs/rbac.json` with **zero
   routes** — consider it for the moderation half. You will almost certainly need a new
   farmer-side code for asking and answering. **Adding a permission is a specification
   change: call it out loudly**, add it to `docs/rbac.json`, add rows to
   `apps/api/src/rbac/rbac.test.ts` pinning it across all seven roles, and keep
   `pnpm rbac:check` passing.

4. **Rules.** New behaviour needs a numbered rule in `docs/rules.md` with a test
   contract. BR-59r is taken. Cover at least: who may answer (anyone), who may edit or
   delete a post (its author, plus a moderator), and what a moderated post looks like to
   a reader.

## Things to get right

- **"Anybody can answer" does not mean no authorization.** A farmer may edit their own
  answer, not someone else's. Enforce ownership server-side from the resolved scope,
  never from a client-supplied id.
- **BR-16 farm anonymity still applies.** If any of this can reach a customer surface,
  no farmer identity, farm name, location or GPS may leak. Check before you expose an
  author field, and say in your report what an author looks like to each audience.
- **Cross-scope reads return an empty result set, not 403.**
- Think about ordering and paging now: a thread grows. Follow the page/limit convention
  the Learning Hub lists already use rather than inventing a cursor here.

## House rules — these are not optional

Read `/CLAUDE.md` and `/apps/api/CLAUDE.md` first.

- **Module shape**: `routes` (wiring only) → `schema` (Zod matching openapi exactly) →
  `service` (takes a `ResolvedScope`, never a `Request`) → `repo` (SQL only, takes an
  `Executor`). Canonical module: `apps/api/src/modules/warehouses/`. Scaffolder:
  `pnpm exec tsx scripts/new-module.ts <name>`.
- **Mutating admin actions write an `audit_log` row inside the same transaction.**
  Moderation especially — removing someone's post must be provable.
- **Errors**: `AppError` with a code from `packages/shared-types/src/errors.ts`; a new
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
transaction. Cover: anyone may answer; a farmer cannot edit another farmer's post; a
moderated post behaves correctly for a reader; and the farm-anonymity check if any of
this is customer-reachable. Name rule tests with their `BR-xx`.
**Never delete, skip or weaken a test to go green.**

## Verify — paste real terminal output, never a summary

Baseline first, then compare:

```
DATABASE_URL=postgres://nobody:nobody@127.0.0.1:1/no_such_db pnpm --filter @tohfa/api typecheck
DATABASE_URL=postgres://tohfa:tohfa@localhost:5432/tohfa_test pnpm --filter @tohfa/api test
DATABASE_URL=postgres://nobody:nobody@127.0.0.1:1/no_such_db pnpm spec:lint
DATABASE_URL=postgres://nobody:nobody@127.0.0.1:1/no_such_db pnpm rbac:check
```

Known isolation defect: about one random file fails per run. Judge by the failing FILE
list, not the count. Report "no NEW failures vs baseline" with both lists, or name
exactly what you broke.

## Collision warning

`docs/openapi.yaml`, `docs/rules.md` and `docs/rbac.json` are shared single files. Briefs
01 and 02 touch all three. **Do not edit them concurrently with another brief.**

## Report

What a question hangs off and the evidence for it, the migration, both endpoint surfaces,
every new permission with its rbac rows, the new business rule, what an author looks like
to each audience, and all four verification outputs verbatim.
