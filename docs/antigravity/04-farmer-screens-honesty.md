# Antigravity brief 04 — Remove fabricated data from the remaining farmer screens

**Scope: `apps/mobile/src/roles/admin/screens/farmers/` only. Do not touch `apps/api`
or `apps/admin-web`.**

## Why

Three farmer screens display invented people and invented compliance status as if it
were real. A fourth screen, `AdminAllFarmersScreen`, has already been fixed — **read it
first, it is your reference**, along with its new mapper `allFarmersMappers.ts`.

This matters more than a cosmetic bug: these screens show **KYC status, certification
status and ratings against real farmers' names**. Someone could approve a payout or a
listing on the strength of a status the system invented.

## The rule, which is the whole point of this task

**A value the API cannot supply renders an em-dash. It is never guessed, and the
designed element is never deleted to hide the gap.**

- Use the existing `ADMIN_NO_VALUE` constant (`utils/noValue.ts`). Never write `'—'`
  inline.
- Never `?? 'some literal'` as a fallback for a missing value. That is the exact defect
  being removed.
- An empty list is an **empty state**, never a demo fixture.
- Distinguish loading, error and genuinely-empty. The components already exist:
  `AdminLoadingState`, `AdminErrorState`, `AdminEmptyState` and `queryViewState` in
  `screens/warehouse/shared/`.
- Reference pattern for honest mapping: `apps/mobile/src/roles/admin/api/pricingMappers.ts`
  — read its docblock.

## The three screens

### 1. `FarmerManagementFlow.tsx`
- Falls back to `DEMO_ALL_FARMERS` when the live list is empty.
- Maps a missing rating to `4.5`, divides the real 0-100 score by 20, defaults the tier
  to `'TIER_A'` and the farm name to `"{name} Farm"`.
- `matchComplianceFarmer` starts from `DEMO_ALL_FARMERS[0]` and writes `'KYC Verified'`.
- It also feeds the compliance screen below, so fixing it here fixes part of that.

### 2. `SuperAdminVerificationComplianceScreen.tsx`
Falls back to `DEMO_COMPLIANCE_FARMERS` (Ramesh Kumar, Selvi Murugan, M. Anand) when the
list is empty, and when real farmers ARE passed it fabricates their compliance data:
- KYC status derived from account status (wrong — they are different things)
- Certification hardcoded to `'PGS-India / Organic'`, expiring `'2027-12-31'`
- Audit status hardcoded to `'Completed'`
- Rating `'4.5 / 5.0'`, tier `'Tier A'`, last updated `'Today'`, zone `'Nilgiris'`

**What can be wired honestly:** `kycStatus`, `zone`, `overallRating` and `ratingTier` all
come from `GET /admin/farmers` today (see `api/farmers.ts`). Certification type, expiry
and status come from `GET /admin/certifications` (`api/certifications.ts`, permission
`certification.view`). Audit status: `listAudits` / `getAuditCompliance` exist in
`api/audits.ts` but nothing joins them per farmer — **dash it and say so**. "Last
updated" has no source — **dash it**.

Show the rating as the real 0-100 score, not a 0-5 star figure. The design's star rating
has no source and must not be derived.

### 3. `SuperAdminFarmRecordsListScreen.tsx`
`FARM_RECORD_ENTRIES` is four hardcoded farmers (Ramesh Kumar, Kumar, John, Rani) with
fixed codes, mobile numbers and a 4.5 rating, spread over `DEMO_ALL_FARMERS[0..3]`. It
does use live farmers when passed, but falls back to those four.

**What can be wired:** the live farmer list exists. `getFarmer` returns `landLocations`
(name, area, village, district), so per-farmer farm data is reachable with one fetch per
farmer. There is **no bulk farm-records endpoint** — if that makes the screen impractical
to wire fully, say so and dash what you cannot get rather than inventing it.

### Also remove, if they are still referenced
Demo default prop names `'Ramesh Kumar'` in `FarmerPayoutTabSection`,
`FarmerBankAccountDetailsScreen`, `FarmRecordsSection` and `AdminAddFarmRecordScreen`, and
`'Wild Eden Organic Farms'` in `AdminFarmMapScreen`.

Once nothing imports them, delete `DEMO_ALL_FARMERS`, `DEMO_APPLICATIONS` and
`DEMO_COMPLIANCE_FARMERS` from `farmerManagementFixtures.ts`. Check for importers first.

## Do not

- Do not restyle or redesign anything. Keep every card, icon, colour and layout.
- Do not delete a designed field because the API cannot fill it. Dash it.
- Do not change `apps/api`. If a screen needs a backend field that does not exist, **say
  so in the report** — that is a separate piece of work, not something to paper over.
- No raw hex or spacing numbers (tokens only). No inline English — use the admin i18n
  catalogue.

## Git and safety

- **Never commit, push, merge, branch, stage, or open a PR.** The owner commits.
- **Never touch any database.** Prefix every command with
  `DATABASE_URL=postgres://nobody:nobody@127.0.0.1:1/no_such_db`.
- Never read or print a `.env` file. Never start or stop Metro, the API, an emulator, or
  docker.
- Quote zsh globs single-quoted.

## Tests — write them first and watch them fail

Add to `apps/mobile/src/roles/admin/tests/`. Follow `farmersAll_honest.test.ts` and
`farmersAll_states.test.tsx`, which were written for the screen already fixed. Cover:
- a farmer with no KYC / certification / rating renders dashes, not invented status
- an empty live list renders the empty state and no demo farmer
- loading and error are distinguishable from empty
- a source guard: no `'Ramesh Kumar'`, `'Selvi'`, `'4.5 / 5.0'`, `'PGS-India / Organic'`,
  `'Tier A'`, `'Completed'` or `'Wild Eden Organic Farms'` literal survives under
  `screens/farmers/`
Name any test touching a numbered rule with its `BR-xx` id from `docs/rules.md` (farmer
rating is **BR-06**, identity masking is **BR-33b**).

**Never delete, skip or weaken a test to go green.** Leave it failing and explain why.

## Verify — paste REAL terminal output, never a summary

**Run the baseline BEFORE you edit anything and save it**, then compare after. Do not skip
this: the previous agent on this area compared file names only and could not prove it had
not added a failure inside an already-failing file.

```
DATABASE_URL=postgres://nobody:nobody@127.0.0.1:1/no_such_db pnpm --filter @tohfa/mobile typecheck
DATABASE_URL=postgres://nobody:nobody@127.0.0.1:1/no_such_db pnpm --filter @tohfa/mobile test
```

Baseline is **exactly 25 failing test files**: api_customers, audits_inspection_overview,
availability_entrypoints, farmersList_wiring, listingsFlow_wiring, profile_wiring,
sa_home_dashboard, tohfa_shell, warehousePermissions, warehouse_overview, orders_screens,
return_order_screen, store_submission, support_help_notifications, animal_detail_i18n,
animal_detail_records, animal_record_forms, create_password_routing,
crop_diary_entries_honest, payout_destinations_screens, support_feedback,
wallet_money_actions_honest, admin_theme_guard, admin_warehouse_area_guard,
cross_role_import_guard.

`farmersList_wiring`, `sa_home_dashboard` and `admin_theme_guard` are already failing and
are in the area you are editing — **compare their per-file test counts before and after**,
not just the file names. The suite has a known flake of about one test per run.

Report "no NEW failures vs baseline" with both lists, or name exactly what you broke.

## Report

Per screen and per field: what is now real, what is now a dash and why. Which demo
constants you could delete. Any field a screen needs that the API does not provide (that
becomes backend work). Verbatim typecheck and test output, with the before and after
baselines.
