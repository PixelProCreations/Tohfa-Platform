# Antigravity brief 08: remaining backend work for the admin app

**Scope: `apps/api`, `db/migrations`, `docs/openapi.yaml`, `docs/rules.md`, `docs/rbac.json`,
`packages/shared-types`.**
Do **not** touch `apps/mobile` or `apps/admin-web`. The mobile side is wired separately,
after each backend piece lands.

## Why this brief exists

The admin mobile app was just made honest. Every button that pretended to work, and every
number that was invented, is now one of two things:

- **disabled**, with a "not available yet" note, or
- **a dash (`—`)**.

Almost every one of those is waiting for a backend endpoint that does not exist. This brief
lists all of them, explains what each screen needs, and gives the order to build them in.

> Do not start until the owner says so. A separate worker is **right now** building the farmer
> application review backend. It edits `docs/openapi.yaml`, `docs/rules.md` and `docs/rbac.json`.
> Those are single shared files, so two writers at once will clobber each other.

## Out of scope

These are already handled elsewhere. **Do not build them.**

| Item | Why it is excluded |
|---|---|
| Farmer **application review**: stages, document and FMB verification, request info, review notes, resubmission | Being built now by another worker. New permission codes (`farmer.application.advance`, `.verify_document`, `.verify_fmb`, `.add_note`) belong to that work. |
| **Audits** | The owner is redesigning the audit flow separately. Don't touch audit routes or rules. |
| **Add Farmer** | Removed from the app by the owner. Leave the existing admin create-farmer API as it is; don't extend it. |
| Bank refund for returns | The endpoint exists. Whether the app uses it is an owner decision, so there is no backend work. |

---

## How to work: these rules are not optional

Read `/CLAUDE.md` and `/apps/api/CLAUDE.md` first.

1. **Verify before building.** Every gap below was observed on 2026-11-25. Before building an
   item, grep `docs/openapi.yaml` and `apps/api/src` to confirm it is still missing. If it now
   exists, report it as `ALREADY EXISTS` and move on.
2. **Module shape:** `routes` (wiring only) → `schema` (Zod, matching openapi exactly) →
   `service` (takes a `ResolvedScope`, never a `Request`) → `repo` (SQL only, takes an
   `Executor`). The canonical module is `apps/api/src/modules/warehouses/`, and there is a
   scaffolder: `pnpm exec tsx scripts/new-module.ts <name>`.
3. **Authorization** is `requirePermission('<code>')`, with a code that exists in `rbac.json`.
   Never check `user.role` in a handler. Cross-scope reads return an **empty result set, not
   403**.
4. **Mutating admin actions write an `audit_log` row in the same transaction.**
5. **Money moves need an `Idempotency-Key`** and must be safe to replay. Money is `Money`
   (integer paise) and never a float.
6. **Ledgers are append-only.** Balances are trigger-maintained caches; never write them directly.
7. **No hard-coded business thresholds.** Values such as ₹10,000, the 70/10/10/10 split, or a
   24-hour window come from `system_config`.
8. **Every rule gets a test, written first, that you watch fail.** New behaviour gets a
   numbered rule in `docs/rules.md` with a test contract, and each test name starts with its
   `BR-xx`.
9. **A new permission code is a spec change.** Add it to `docs/rbac.json`, add rows to
   `apps/api/src/rbac/rbac.test.ts` across all seven roles, keep `pnpm rbac:check` green, and
   **call it out loudly** in your report. Prefer an existing orphan code (listed in §9) over
   inventing a new one.
10. **Errors** are `AppError` with a code from `packages/shared-types/src/errors.ts`. A new code
    also goes in the openapi `Problem` description.
11. **Never invent business logic.** Items marked **⛔ OWNER DECISION** must not be built until
    the owner answers. Write down the question, propose a default with your reasoning, and stop
    there.

### Database safety: absolute
- **NEVER touch the database named `tohfa`.** It is the owner's working database.
- Integration tests run against `DATABASE_URL=postgres://tohfa:tohfa@localhost:5432/tohfa_test` only.
- Commands that need no database use `DATABASE_URL=postgres://nobody:nobody@127.0.0.1:1/no_such_db`.
- Never leave `DATABASE_URL` unset, never use `env $E` tricks, and never read or print a `.env`.
- Never start or stop Metro, the API, an emulator or docker.
- Migrations are new numbered files with `-- +migrate Down`. Never edit a migration that has
  already run.

### Git
**Never commit, push, merge, branch, stage, stash or open a PR.** The owner commits.

---

## The plan, in build order

Each item gives the screen that is waiting on it, what exists today, what to build, the
permission and rule involved, and any owner decision.

### Phase 1: small items that unlock real numbers on screens already built

These are quick and make dashboards show real figures instead of dashes. Do them first.

**1.1 Server totals on list endpoints**
- **Waiting:**
  - the Super Admin home "Pending Listings" card
  - the Farmer Admin home pending-listings card
  - the payouts list counts
- **Today:** `GET /admin/listings` and `GET /admin/payouts` return cursor pages with **no
  total**. The app can only count rows when every page is loaded, otherwise it shows a dash.
- **Build:** an exact `page.total`, or a `summary` with counts per status, matching how
  `GET /admin/customers` returns `summary`. Follow whichever pattern already exists in this
  codebase; don't invent a third.
- **Also check:** a mobile worker reported that the mobile `PayoutListPage` expects
  `nextCursor`/`hasMore` at the top level while the server returns
  `page: {nextCursor, hasMore}`. Confirm what the server returns and state it in your report.
  It's a mobile bug, not yours to fix.

**1.2 Admin accounts list and count**
- **Waiting:**
  - the Super Admin home "Staff & Admins" card
  - the Assign Access user picker
  - Manage Admins
- **Today:** `/admin/accounts` is **POST only** (create). Nothing lists or counts admin accounts.
- **Build:**
  - `GET /admin/accounts`: paged, filterable by role and status, with a server total.
  - `GET /admin/accounts/{id}`: one account.
  - No secrets, no password hashes.
- **Permission:** find the code the existing create route uses. The `admin.*.create` codes are
  orphans (§9), so check how role-specific creation is gated before adding a view code.
- **Rule:** role exclusivity applies. Only a Farmer Admin may hold two roles. Make sure the list
  reports roles truthfully.

**1.3 Listing zone filter for Farmer Admin**
- **Waiting:** the Farmer Admin home and listing queue.
- **Today:** `rbac.json` gives FARMER_ADMIN `listing.queue.view_pending` with scope `all`, and
  the server does not zone-filter `/admin/listings`. A comment in the mobile `api/listings.ts`
  says "API team fixing".
- **⛔ OWNER DECISION:** should a Farmer Admin see only their own zone's listings? If yes:
  - change the scope in `rbac.json`;
  - filter in the service via `ResolvedScope`;
  - cross-zone reads return empty.

### Phase 2: money (highest risk; test hardest)

**2.1 Payout reject / return**
- **Waiting:**
  - the "Reject" button on `FarmerPayoutDetailScreen`
  - the "Return for Review" button on `PayoutProcessingScreen`

  Both are disabled.
- **Today:** only `POST /admin/payouts/{id}/approve` exists.
- **Build:** `POST /admin/payouts/{id}/reject`, with a required reason.
  - Status transition per the payout state machine; read the existing `PayoutStatus` enum and
    BR-31 / BR-144.
  - Audit row.
  - Idempotency-Key.
- **⛔ OWNER DECISION:**
  - Is "reject" final, or does "return for review" send it back to the requester?
  - Are these one action or two?

**2.2 Payout "intimation"**
- **Waiting:** the "Intimate" buttons on payout detail, the RMA detail and the PO receipt. All
  are disabled.
- **⛔ OWNER DECISION, required before anything is built:** what does "intimate" mean?
  - Notify the farmer that a payout is coming?
  - Notify finance?
  - Is it a status change or only a notification?

  Nothing in `rules.md` defines it.

**2.3 Bulk payouts**
- **Waiting:** "Bulk-Process Payouts < ₹10K" on `FarmerPayoutDuesScreen`. It is disabled.
- **Today:** payouts are created one at a time (`POST /admin/payouts`).
- **⛔ OWNER DECISION:**
  - Which dues are included?
  - Is the ₹10,000 line the BR-31 dual-approval threshold, read from `system_config`?
  - What happens when one payout in the batch fails: all-or-nothing, or partial?
- **Build after the decision:**
  - an idempotent batch endpoint;
  - one Idempotency-Key per batch, plus a stable derived key per item, so a replay never pays
    twice;
  - an audit row per payout;
  - a dual-approval check per BR-31 / BR-144.

**2.4 Manual journal entries (general ledger)**
- **Waiting:** `AddManualJournalEntryScreen` ("Post Journal Entry"), which is disabled, and
  `BasicAccountingLedgerScreen` (running and closing balance, which are dashed).
- **Today:** there is no ledger or journal resource at all.
- **⛔ OWNER DECISION:** this is a real accounting feature, not a small endpoint.
  - Is double-entry required?
  - What is the chart of accounts?
  - Who may post?
  - Can a posted entry be reversed? It must never be edited, because ledgers are append-only.

  Propose a design and stop.

### Phase 3: farmers

**3.1 Rating write**
- **Waiting:** `AdminEditRatingCategoriesScreen`. "Save All Category Changes" and the steppers
  are disabled.
- **Today:** `GET /admin/farmers/{id}/rating` only. BR-06 says the farm rating is 10 categories ×
  10 points and that no write exists yet. The tier scale is BR-04b (0–100).
- **Build:**
  - Write category scores; the server recomputes the total and the tier from
    `rating_tier_config`, never from client numbers.
  - Audit row.
  - Permission `farmer.rating.edit` (an orphan, so use it).
  - Also `farmer.rating.configure_tiers` for editing the tier thresholds, if a screen needs it.
- **Rule:** amend BR-06, keeping the test contract.

**3.2 Admin edits to farm records**
- **Waiting:** every action on `FarmRecordsSection` and `AdminEditFarmRecordScreen`, all of them
  disabled:
  - update crop stage
  - record harvest
  - log livestock production
  - end a livestock record
  - record asset service
  - retire an asset
  - edit a diary entry
- **Today:** admin can **read** produce records, livestock and assets. There is no admin write
  and no admin diary read.
- **⛔ OWNER DECISION:** may an admin edit a farmer's records on the farmer's behalf? If yes:
  - the record must show "added on behalf" (the design has that badge);
  - every change is audited;
  - the farmer's own write rules (BR ids in the produce, livestock and asset modules) still
    apply.

  Propose which actions an admin may do.

**3.3 Admin diary read**
- **Waiting:** the farmer detail's Farmer Records → Diary tab, which says "not loaded".
- **Build:** `GET /admin/farmers/{id}/diary`, paged, read-only. Gate it with an existing view
  code if one fits; otherwise add one, loudly.

**3.4 Farmer account disable / reactivate**
- **Orphans:** `farmer.account.disable`, `farmer.account.reactivate`.
- Check whether the admin farmer update already covers this. If not, add explicit endpoints with
  a required reason and an audit row.
- **Rule:** what happens to live listings and pending payouts of a disabled farmer?
  **⛔ OWNER DECISION.**

**3.5 Subscription extend / waive**
- **Orphan:** `farmer.subscription.extend_waive`.
- **Waiting:** the subscription overview.
- **⛔ OWNER DECISION** on the rules: how long can an extension be, and who may waive.

**3.6 Farmer disputes**
- **Orphan:** `dispute.farmer.mediate`.
- The design has dispute screens, and the Farmer Admin home has an "Open disputes" card, which is
  dashed.
- **⛔ OWNER DECISION:**
  - What is a dispute: farmer vs TOHFA about a payout, a quality grade, a rejection?
  - What are its states?
  - Who mediates?

### Phase 4: zones (currently read-only)

**4.1 Zone writes**
- **Waiting:** every write control on the admin Zone Management screen, all disabled:
  - create zone
  - edit zone
  - deactivate zone
  - assign a farmer to a zone
  - transfer a farmer between zones
  - set the taluks/locations a zone covers
  - set a zone boundary
  - export
- **Today:** two GET endpoints only.
- **Must know:**
  - `geographic_zones` is a **VIEW over `zone_taluks`**, created in
    `db/migrations/0088_geographic_zones.sql`. It is not a second table. Write to `zone_taluks`
    and `zones` only.
  - There is one zone per warehouse (Ooty, Coonoor, Kotagiri, Gudalur). Kundah groups with Ooty
    and Pandalur with Gudalur.
  - Zone derivation from taluk is BR-143 / BR-19.
- **Build:**
  - Zone CRUD, with a soft deactivate and no hard delete.
  - Taluk mapping writes.
  - Farmer zone assign/transfer, with a reason and an audit row.
  - Respect BR-143.
- **⛔ OWNER DECISION:**
  - Can a zone exist without a warehouse? The previous owner decision implies **no**.
  - What happens to a zone's farmers when it is deactivated?
  - Is boundary geometry needed now, or only taluk mapping?

### Phase 5: inputs and pests

**5.1 Inputs catalogue**
- **Waiting:** `ApprovedInputsScreen`, `InputDetailScreen` and `InputsPestHomeScreen`. All are
  disabled or dashed: list, add, edit, deactivate, delete, and view PDF.
- **Today:** no inputs catalogue in openapi. `inputs.catalog.manage` has **0 routes**.
- **Build:**
  - Catalogue CRUD: name, type, composition, application method, frequency, approval status,
    certification/registration id, document upload.
  - Soft deactivate.
  - Audit.
  - Gate with `inputs.catalog.manage`, plus a view code.
- **⛔ OWNER DECISION:**
  - What fields does an input need? Use the design's form as the starting proposal.
  - Do farmers read this catalogue? If so, add farmer read endpoints, and check BR-16
    anonymity.

**5.2 Admin pest incidents**
- **Waiting:** `FarmerPestIncidentsScreen` and `PestIncidentDetailScreen` (Link Pest, Link
  Treatment, Review Note), which are disabled.
- **Today:** pest data is farm-scoped (`farmer.pest.manage_own` is an orphan); there is no admin
  list or actions.
- **Build:**
  - Admin list and detail across farmers, scoped.
  - Link a pest-library entry and a treatment.
  - A review note.
  - Audit.
- **Also:** `pest_library.view` is an orphan, while `/pest-library` exists. Check how it is
  gated today and fix the mismatch.
- **Ownership note:** soil, pest and workforce modules were a teammate's area. Check
  `git log -- apps/api/src/modules/` for recent pest work before building, and say what you find.

### Phase 6: settings and configuration

**6.1 System config CRUD**
- **Waiting:** `SystemConfigScreen`. Save is disabled, and the values (split percentages, fees,
  timeouts, tier cut-offs) are dashed.
- **Today:** a `system_config` table exists with typed rows, but there is no admin endpoint.
  `system.config.manage` is an orphan.
- **Build:**
  - `GET /admin/system-config`.
  - `PATCH /admin/system-config/{key}`, validated by each row's `data_type` and an allowed
    range.
  - Audit with the old and new value.
  - Gate with `system.config.manage` (Super Admin only, unless rbac.json says otherwise).
- **Rule:** some keys are dangerous, such as the revenue split or the finance report range.
  **⛔ OWNER DECISION:** which keys are editable from the app, and which are read-only?

**6.2 Alert thresholds**
- **Orphan:** `alert.threshold.configure`.
- **Waiting:** "Thresholds Updated" on `SystemAlertsScreen`, which is disabled.
- **Build:** read and update the alert thresholds that the alerts module uses, stored in
  `system_config` or the alerts module's own table, whichever exists. Audit.

**6.3 Notification templates**
- **Orphan:** `notification.template.configure`.
- **Build:** list and edit notification templates; the seed has `FARMER_APP_INFO_REQUESTED`,
  among others. Validate placeholders. Audit.

**6.4 Market open/close and schedule**
- **Waiting:** "Close Market" and the market schedule on the Super Admin home (disabled), and
  `ScheduleMarketOpenCloseScreen`.
- **Today:** no endpoint reports or changes market status. `market.schedule.manage` existed
  only on the design branch.
- **⛔ OWNER DECISION:**
  - What does "market closed" stop: customer checkout, farmer listings, or both?
  - Is it per warehouse or global?

**6.5 Role permission editing**
- **Orphan:** `role.permission.edit`.
- **⛔ OWNER DECISION, high risk:** letting the app change `rbac.json` behaviour at runtime goes
  against the repo's rule that `rbac.json` is the specification. Do not build this without an
  explicit owner design.

### Phase 7: finance reports

**7.1 Warehouse filter on finance reports**
- **Waiting:** the `ProfitLossScreen` warehouse filter (disabled).
- **Today:** `/admin/finance/reports/revenue` and `/expenses` take only `from` / `to`.
- **Build:** an optional `warehouseId`, with scope rules: a Sub Warehouse Admin is always
  limited to their own warehouse. Amend BR-63.

**7.2 Exports**
- **Waiting:** the GSTR-1 JSON export, the P&L export and the finance overview export. All are
  disabled.
- **Today:** `/admin/exports/*` covers sales, receiving, inventory, returns, customers, cash
  top-ups, expenses, finance revenue and finance expenses.
- **Build:**
  - a GSTR-1 export in the government's JSON format;
  - export history, because the Reports Export screen shows past exports but the server keeps
    none.
- **⛔ OWNER DECISION:**
  - Who files GST?
  - Must the JSON match the GSTN portal schema exactly?

**7.3 Profit & loss**
- **Waiting:** every profit, margin, gross and net figure on `ProfitLossScreen`,
  `PLStatementScreen` and `FinancialDashboardScreen`, all dashed.
- **⛔ BLOCKED BY A RULE:** `docs/rules.md` BR-63 clause 5 says reports return **raw sums only,
  with no profit or loss**. Building P&L means amending that rule first, which the owner must
  approve. Also needed:
  - **COGS:** is it the farmer purchase cost, from purchase orders and payouts?
  - **Finance permissions:** `finance.pnl.view` and `finance.dashboard.view` are orphans.

### Phase 8: reports and analytics (aggregation)

**8.1 Summary and time-series endpoints**
- **Waiting:** `AnalyticsDashboardScreen`, `FarmerPerformanceReportScreen` and
  `WarehouseOpsReportScreen`. Their charts and trend lines are dashed.
- **Today:** the reports return totals with day buckets; there is no `period` parameter.
- **Build ONE reusable time-series shape, not a bespoke endpoint per chart:**
  - query `?metric=&period=day|week|month&from=&to=&warehouseId=`;
  - response `{ bucket, value }[]`.
- **Metrics to cover:**
  - sales revenue and order count, by channel
  - new farmers and applications
  - listings approved
  - intake kg
  - spoilage / loss kg
  - payouts made
  - customer count
- **Rules:**
  - Respect the report max range (`system_config`).
  - Scope by warehouse.
  - Raw sums and counts only (BR-63).
- **Also needed:**
  - **Farmer performance:** yield and rating distribution per zone.
  - **Compliance tiers:** a count of farmers per rating tier. Today the app had faked this as
    "active farmers × 48%".

### Phase 9: orphan permissions audit (do last)

On 2026-11-25, **71 of 266 codes** in `docs/rbac.json` were used by no `requirePermission(...)`
route. Some are **not real gaps**:
- role names (`FARMER`, `SUPER_ADMIN` and the rest);
- public or auth flows gated differently (`auth.otp.request`, `catalog.browse`,
  `customer.self_register`);
- the application-review codes that the other worker is adding now.

For **each** remaining orphan, decide and report exactly one of:
- **ROUTE IT:** it belongs to an item above; name the item.
- **ALREADY ENFORCED ELSEWHERE:** say where, for example a public route or a service-level
  check.
- **PROPOSE REMOVAL:** nothing in the product needs it. This is the owner's call; don't delete.

The orphans observed:

| Area | Codes |
|---|---|
| admin | `admin.crop_taxonomy.manage`, `admin.decision.override`, `admin.farmer_admin.create`, `admin.main_wh_admin.create`, `admin.super_admin.create`, `admin.tohfa_admin.create` |
| alert | `alert.threshold.configure` |
| allocation | `allocation.b2b_horeca.manage`, `allocation.per_produce.adjust` |
| announcement | `announcement.system_wide.create`, `announcement.warehouse.create` |
| audit | `audit.tier.configure_thresholds` (**skip**: audit is out of scope) |
| catalog | `catalog.farm_identity.view`, `catalog.home_content.manage` |
| certification | `certification.block_listings`, `certification.verify_via_portal` |
| customer | `customer.address.manage_own` |
| dispute | `dispute.farmer.mediate` |
| farmer | `farmer.account.disable`, `farmer.account.reactivate`, `farmer.farm.manage_own`, `farmer.pest.manage_own`, `farmer.profile.edit_locked_field`, `farmer.rating.configure_tiers`, `farmer.rating.edit`, `farmer.soil.manage_own`, `farmer.subscription.extend_waive`, `farmer.workforce.manage_own` |
| finance | `finance.dashboard.view`, `finance.pnl.view` |
| inputs | `inputs.catalog.manage` |
| inventory | `inventory.batch.assign`, `inventory.produce.reject_incoming`, `inventory.stock_ledger.view_all` |
| invoice | `invoice.generate`, `invoice.gst.generate` |
| listing | `listing.approval.auto_route` |
| notification | `notification.template.configure` |
| order | `order.delivery_slot.select`, `order.delivery_status.view` |
| payout | `payout.escalate_above_10k` |
| pest_library | `pest_library.view` |
| purchase | `purchase.order.create` |
| report | `report.bulk_data_export` |
| rma | `rma.request.create_own` |
| role | `role.permission.edit` |
| sales | `sales.channel.manage` |
| support | `support.ticket.view_all` |
| system | `system.config.manage`, `system.db_export.raw`, `system.integration_key.manage` |
| wallet | `wallet.checkout.enforce_wallet_first` |

Note that `announcement.warehouse.create` and `announcement.system_wide.create` look orphaned,
yet announcements can be created. Check whether the route gates on a different code, and report
the mismatch.

---

## Owner decisions collected (answer these before the phases that need them)

1. Farmer Admin listings: own zone only, or all? (1.3)
2. Payout reject vs return-for-review: one action or two, and the resulting state? (2.1)
3. What "intimate" means. (2.2)
4. Bulk payouts: which dues, the threshold, and partial-failure behaviour. (2.3)
5. General ledger design: double-entry, chart of accounts, who posts, reversals. (2.4)
6. May admins edit farm records on a farmer's behalf, and which actions? (3.2)
7. Effects of disabling a farmer. (3.4)
8. Subscription extend/waive rules. (3.5)
9. What a dispute is. (3.6)
10. Zone rules: warehouse required? Effect of deactivating? Boundaries now? (4.1)
11. Inputs catalogue fields, and whether farmers read it. (5.1)
12. Which `system_config` keys are app-editable. (6.1)
13. What "market closed" stops, and whether it is per warehouse or global. (6.4)
14. Role permission editing: build at all? (6.5)
15. GST filing: who files, and must the output match the GSTN schema? (7.2)
16. P&L: amend BR-63 clause 5? COGS definition? (7.3)

## Verify: paste the real terminal output, never a summary

Run each command **before** your first edit, save the output, then run it again at the end:
```
DATABASE_URL=postgres://nobody:nobody@127.0.0.1:1/no_such_db pnpm --filter @tohfa/api typecheck
DATABASE_URL=postgres://tohfa:tohfa@localhost:5432/tohfa_test pnpm --filter @tohfa/api test
DATABASE_URL=postgres://nobody:nobody@127.0.0.1:1/no_such_db pnpm spec:lint
DATABASE_URL=postgres://nobody:nobody@127.0.0.1:1/no_such_db pnpm rbac:check
```
The API suite has a known isolation defect that fails about one random file per run. Judge by
the failing **file list**, not the count.

## Report: per item, never "complete"

For every numbered item, give exactly one status:
- `BUILT`: list the endpoints, permission, rule id and tests.
- `ALREADY EXISTS`
- `WAITING ON OWNER`: give the question and your proposed default.
- `NOT DONE`: say why.

Then list:
- every new permission code
- every new rule
- every new migration
- every change that could affect `apps/admin-web` or the mobile app

Finish with the verification output, verbatim.
