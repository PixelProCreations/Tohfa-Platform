# Antigravity brief 09: finish the remaining work

Claude's workers stopped partway through on 2026-11-25, at about 04:30, because they ran out of
tokens. This brief hands you everything that's left. Several tasks are **half-done in the
working tree**, so **read the current code and `git diff` first**, continue from there, and
**never revert anyone's work**.

A backup of the tree as it stood at the stop is in
`~/Downloads/tohfa_backup_stop_nov25_0430/`. Do not restore from it unless the owner says so.

## Before anything: the house rules
Read `/CLAUDE.md`, `/apps/api/CLAUDE.md`, `/apps/mobile/CLAUDE.md`. These are not optional:

- **Git:** never commit, push, merge, branch, stage, stash, checkout, reset, restore or open a
  PR. The owner commits.
- **Database:** never touch the database named `tohfa`. API integration tests run against
  `DATABASE_URL=postgres://tohfa:tohfa@localhost:5432/tohfa_test` only. Every other command
  gets `DATABASE_URL=postgres://nobody:nobody@127.0.0.1:1/no_such_db`.
  - Never leave `DATABASE_URL` unset.
  - No `env $E` tricks in zsh.
  - Never read or print a `.env`.
- **Processes:** never start or stop Metro, the API, an emulator or docker.
- **Off-limits:** never touch `apps/admin-web`.
- **Honesty rules:** see brief 07, R1–R12. In short:
  - A value with no source shows `ADMIN_NO_VALUE`.
  - A designed element is never deleted to hide a gap.
  - No success message unless the server succeeded.
  - One page of a list is not a total.
  - No demo data.
- **Design of record:** branch `origin/Superadmin-main`. Read it with
  `git show origin/Superadmin-main:<path>`, and never merge it. When a task is a design port,
  **the styles are the deliverable**: copy them exactly, mapping colours and spacing to existing
  admin tokens.
- **Tests first:** watch them fail, name them with their `BR-xx`, and never delete, skip or
  weaken an assertion.
- **Out of scope:**
  - **Audit**: the owner is redesigning it separately.
  - **Add Farmer**: the owner removed it from the app; don't bring it back.

---

## Task 1: finish the backend for farmer application review (HALF-DONE)

**Where it stopped:**
- Changed so far:
  - `apps/api/src/modules/farmer-applications/` service, repo, routes and schema
  - a new `farmer-applications.review.ts`
  - new tests `application-review.test.ts` and `application-review.db.test.ts`
  - `docs/rules.md`, `docs/rbac.json`, `docs/openapi.yaml` (partial; it stopped *while editing
    openapi*)
  - `packages/shared-types` `enums.ts` and `errors.ts`
  - `events/bus.ts`, `http/problem.ts`
- **No migrations have been written yet. None of its tests have been run.**
- Delete the scratch file `apps/api/.tmp_q.mjs` (a leftover query script; not product code).

**Read what it already wrote**, especially the new rules in `docs/rules.md` and the new codes in
`docs/rbac.json`, and complete it consistently.

### Owner decisions (2026-11-25): implement exactly
1. **No audit in this flow.** Flow: SUBMITTED (draft) → submit → **DOCS_REVIEW** →
   **FARM_VERIFICATION** → **APPROVED**. REJECTED is reachable from any non-draft, non-terminal
   state. The `AUDIT` enum value stays in the DB, unused.
2. **Gates:**
   - DOCS_REVIEW → FARM_VERIFICATION only when the required documents (ID_PROOF and FARM_DOC)
     are VERIFIED and no document is REJECTED.
   - **Approve only from FARM_VERIFICATION**, and only when the required documents are verified,
     no document is rejected, and **every location's FMB is VERIFIED**.
   - A failed gate returns a domain ErrorCode naming what is missing.
3. **Per-document verification:** VERIFY, or REJECT with a required reason. Documents need a
   stable id; today `step4_documents` JSON has none. Choose the storage and argue it in the
   migration. A re-uploaded document resets to pending.
4. **FMB review per land location:** VERIFY, or REJECT with a required reason. The admin
   `GET /admin/farmer-applications/{id}` must return each location's `fmbPolygon`, area figures
   and FMB review state.
5. **Request more info is a real stored status, `INFO_REQUESTED`.** Add it in a NEW migration
   (`ALTER TYPE … ADD VALUE`; check how the migration runner handles transactions, because a new
   enum value can't be used in the same transaction).
   - Allowed from DOCS_REVIEW or FARM_VERIFICATION.
   - Body: a checklist of requested items (FMB sketch / boundary, ID proof (Aadhaar), land
     document (Patta/Chitta), bank details, certificate, other) plus a message.
   - Store it structured, not as a note string. Today it is derived from
     `note LIKE 'More info requested:%'`; replace that.
   - **Fix the bug** where request-info sets `zone_id` to NULL (`repo.transitionStatus` treats
     DOCS_REVIEW as a submit).
   - The applicant **resubmits** through a public endpoint, following the existing public
     application endpoints' auth pattern exactly, and flag that security model in your report.
     Resubmit moves INFO_REQUESTED → DOCS_REVIEW.
   - The public status endpoint returns INFO_REQUESTED, the items and the message.
   - The notification must not fail when `user_id` is null.
6. **Review notes:**
   - An endpoint saves a note at any non-terminal stage, with no status change.
   - Approve keeps its optional note.
   - Reject stores `reasonCode` as a structured field, not only inside the text.
   - Every transition and note records the actor and time.
   - `farmer_application_status_history` becomes **append-only at DB level** (a trigger, in a NEW
     migration); review its ON DELETE CASCADE.
7. **On approve, copy the application's documents into `farmer_documents`**, with their
   verification status, verifier, time and reject reason. Update the BR-54 "known limitation"
   text.
8. **Who:** SUPER_ADMIN and TOHFA_ADMIN act; FARMER_ADMIN views only. New codes must be in
   `rbac.json`, in `rbac.test.ts` across all 7 roles, and keep `pnpm rbac:check` green.
   - The codes already added (check them): `farmer.application.advance`,
     `farmer.application.verify_document`, `farmer.application.verify_fmb`,
     `farmer.application.add_note`.
   - Apply scope on every admin read and mutation.
9. **Idempotency-Key is enforced** on approve, reject, request-info and the new mutations.
10. **`packages/shared-types` `ApplicationStatus`** must match the real set. Grep every importer,
    including mobile and admin-web. Don't edit admin-web; report the impact.

**Verify** with the commands in the Verification section: API typecheck, API tests on
`tohfa_test`, `pnpm spec:lint`, `pnpm rbac:check`, plus the spec drift check if it exists. Then
**write the exact JSON shape of the admin `GET /:id` and of the public status/resubmit
endpoints into your report**, because Task 4 wires against them.

---

## Task 2: finish the application review screens design port (NEARLY DONE)

**Where it stopped:** `apps/mobile/src/roles/admin/screens/registration/**` was rebuilt to match
`origin/Superadmin-main` (about 21 files). The mobile typecheck has about **6 errors**, all in old
tests that still expect the removed Audit stage:
- `tests/applications_documents.test.tsx` (`.state`, `'audit'`)
- `tests/applications_detail_fields.test.tsx`

It stopped while writing its logic test, source guard and wiring test (`tests/reg_*`).

**Finish:**
- Update those old tests **only** to follow the intentional removal of Audit, and report each
  assertion change before → after.
- Finish the `reg_*` tests.
- Confirm the screens match the design exactly:
  - section order, spacing, alignment, header and action bar;
  - the **Approve (with notes)** and **Request Info** screens are ported and navigable;
  - the real FMB polygon shows on the map card.
- Every not-yet-wired control is disabled, each with a `testID`: per-document Verify/Reject, FMB
  Verify/Reject, stage change, Request Info Send, Save notes, and Approve-with-note. No demo
  values. No audit options.

---

## Task 3: finish the Farm Records design port (PARTLY DONE)

**Owner:** "bring the designs, we will create the backend accordingly."

**Where it stopped:**
- `docs/antigravity/08a-farm-records-fields.md` is written; finish and check it.
- It was editing the Add Record screen.

**Files:**
- `screens/farmers/FarmRecordsSection.tsx`
- `SuperAdminFarmRecordsScreen.tsx`
- `SuperAdminFarmRecordsListScreen.tsx`
- `AdminAddFarmRecordScreen.tsx`
- `AdminEditFarmRecordScreen.tsx`

**Finish:**
- Copy every Farm Records screen and popup from `origin/Superadmin-main` exactly, with the
  navigation the design has. That covers the Diary / Plant / Livestock / Assets tabs, update
  stage, harvest, production, end record, service, retire, and Add / Edit Record.
- **Keep the real reads already wired:** crops via `useProduceRecordList`, livestock and assets
  via `api/w5FarmRecords.ts`, all permission-gated, showing "not loaded" when not permitted.
- Every form is complete and openable, but the final **Save / Confirm is disabled** with a note
  and a `testID`. Never a success alert.
- No demo values.
- **Never route "add record" to Add Farmer**; Add Farmer is gone.

---

## Task 4: wire the application screens to the new backend (after Tasks 1 and 2)

Turn on every control Task 2 disabled, using the endpoints from Task 1:
- document Verify/Reject
- FMB Verify/Reject
- Move to Farm Verification
- Request Info (checklist + message)
- Save review notes
- Approve with note
- Reject (already wired; add the structured `reasonCode` if needed)

**Requirements:**
- Client wrappers live in `apps/mobile/src/roles/admin/api/farmerApplications.ts` and
  `farmerHooks.ts`, with an Idempotency-Key where the API requires one.
- Show success only after the server answers; errors show inline.
- Disable a control when the gate isn't met, and show why (for example "2 documents not
  verified").
- Show `reviewHistory`. Today the mapper sets it to null in `api/farmerMappers.ts`.
- Show the INFO_REQUESTED status.
- Gate every control on its permission code via `can`.

**Tests:** success, failure, gate-blocked and permission-denied, for each action.

## Task 5: farmer-side "info requested" + resubmit (after Task 1)

Small and minimal; the owner approved it. In `apps/mobile/src/roles/farmer/`:
- **`screens/auth/ApplicationStatusScreen.tsx`:**
  - show INFO_REQUESTED with the requested items and the admin's message;
  - show REJECTED with its reason;
  - strings go through the farmer i18n, not hard-coded English.
- **`RegistrationFlowScreen.tsx`:** let the farmer reopen the requested steps, edit, and
  resubmit through the Task 1 public endpoint.
- Don't import admin code (`cross_role_import_guard`).

## Task 6: demo data script (do NOT run it)

Write `db/seed/dev_demo_applications.sql`. It updates the owner's 3 demo applications for
Lakshmi Narayan, Suresh Gowda and Ramesh Patel, matching them by name. It fills in:
- documents with mixed review states (some verified, some pending, one rejected with a reason)
- FMB polygons and review states
- a status history such as Submitted → Docs Review
- one application in INFO_REQUESTED with items and a message
- review notes

The script must be idempotent and wrapped in a transaction. **Do not run it.** The owner runs
it on their `tohfa` database.

## Task 7: the two paused honesty streams from brief 07

Claude's workers never started these, so do them per brief 07, P1–P5.

**Sales:** everything under `screens/sales/` except `SalesReturnsRefundsScreen.tsx`, which is
done:
- PO search sends `q=''` → send `undefined` when the search is blank
- Online Orders: add `channel:'ONLINE'`
- Channel Overview: MTD range; the DIRECT count sits on the Online tile; HORECA/B2B from
  `/admin/reports/sales` `byChannel`
- B2B/HORECA wrong-meaning fields
- fake `SO-`/`GR-`/`PY-`/`LST-` ids
- invoice PDF; the fake pickup OTP `#8492`
- PO receipt "intimate" → disabled
- delete the dead `DEMO_ONLINE_ORDERS`

**Reports / config / certifications:** everything under `screens/reports/`, `screens/config/`
and `screens/certifications/`:
- announcements: the WAREHOUSE target has no `warehouseId`; remove the audience picker and the
  fallback announcements
- AnalyticsDashboard: live values sit under the wrong labels; fixtures show while loading
- compliance tiers: `activeFarmers × 0.48` etc. → dash
- audit-log entityType case, fake IP, fallback rows
- SystemAlerts: optimistic dismiss; fallbackAlerts
- SystemConfig: fake save and hard-coded values
- cert verify: `POST /admin/certifications/{id}/verify` exists
- report download alerts; `RECENT_DOCS` / `RECENT_REPORTS_DATA`
- FarmerPerformance: `'Active'` case, `PERFORMANCE_DATA_MATRIX`, `/10` stars
- WarehouseOps fixture fallback

**i18n:** use the catalogues `i18n/wiringSales.en.json` and `i18n/wiringReports.en.json`. Both
exist and are registered, and both are empty.

## Task 8: small cleanups
- Delete `apps/api/.tmp_q.mjs`.
- Remove the now-unused i18n key `superAdmin.farmersManagement.addFarmer` (`i18n/en.json`).
- Fix the stale comment in `screens/farmers/FarmerPayoutDetailScreen.tsx` (~line 246) that
  says "FarmerManagementFlow never sets selectedPayout"; it does now.
- `tests/tohfa_shell.test.tsx` fails 14 tests with "No QueryClient set", because it renders
  `FinanceManagementFlow` unstubbed. Stub it the way that test stubs the other flows, or wrap the
  test in a `QueryClientProvider`. Fix the test host, not the screen.
- `admin_theme_guard` fails only on `screens/farmers/AdminAllFarmersScreen.tsx` (29 raw
  colours). Move them to tokens, and tighten the baselines of the files that are now at 0.

---

## Verification: paste the REAL output, never a summary
Run all of these **before** you start and save the output, then run them again at the end:
```
DATABASE_URL=postgres://nobody:nobody@127.0.0.1:1/no_such_db pnpm --filter @tohfa/mobile typecheck
DATABASE_URL=postgres://nobody:nobody@127.0.0.1:1/no_such_db pnpm --filter @tohfa/mobile test
DATABASE_URL=postgres://nobody:nobody@127.0.0.1:1/no_such_db pnpm --filter @tohfa/api typecheck
DATABASE_URL=postgres://tohfa:tohfa@localhost:5432/tohfa_test pnpm --filter @tohfa/api test
DATABASE_URL=postgres://nobody:nobody@127.0.0.1:1/no_such_db pnpm spec:lint
DATABASE_URL=postgres://nobody:nobody@127.0.0.1:1/no_such_db pnpm rbac:check
```

**Mobile baseline:** about 25 known failing test files, plus `design_parity`. That one fails
because the design branch added `AuditReportExportWizardScreen` and `AuditReportPreviewScreen`.
Don't edit `design_parity.baseline.json`; that's the owner's call.

**API suite:** about one random file fails per run (an isolation defect). Judge by the failing
**file list**, not the count.

**Target:**
- mobile typecheck **0 errors**
- API typecheck **0**
- `spec:lint` **0**
- `rbac:check` **green**
- no NEW failing test files

## Report: per task, never "complete"
For every task (1–8), give one status:
- `DONE`: say what is now real.
- `PARTLY DONE`: say what's left.
- `NOT DONE`: say why.

Then list:
- new rules, permission codes and migrations
- the API shapes from Task 1
- every changed test assertion, before → after
- every decision you need from the owner
- the verification output, before and after, verbatim

The owner will commit and open the PR against `Dev`.
