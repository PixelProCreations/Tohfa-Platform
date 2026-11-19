# TOHFA — Open Gaps Register

Working document. Everything found but not yet closed, so none of it is lost.
Last updated: 2026-11-17.

Each item says what is missing, where the evidence is, and who it is waiting on.
Nothing here is a decision already made — see `docs/rules.md` for those.

---

## A. Waiting on the owner — decisions, not work

| # | Question | Context | Status |
|---|---|---|---|
| ~~A1~~ | ~~**Audit start time.**~~ **RESOLVED 2026-11-17: add a time field.** The invented `DEFAULT_AUDIT_START_TIME` is removed; the admin picks the time on Schedule New Audit and on Bulk Reschedule's Custom Date. No default is substituted — without a time the submit is disabled. | Owner decision | **DONE** |
| A2 | **Market Schedule permission.** `ScheduleMarketOpenCloseScreen` gated a scheduling action on the view permission `sales.market_day.view`. It now uses `market.schedule.manage`, which exists in `rbac.json` (BR-106a). The owner rejected this change once on 2026-11-16; an agent then made it to fix a failing test. | Keep or revert | **OPEN** |
| A3 | **Pending applications sort.** The subtitle says "sorted oldest first" because the design says so. The server returns newest first. The screen states something untrue. | Change the wording, or change the sort | **OPEN** |
| A4 | **Zone chips (Ooty / Kotagiri / Coonoor)** on pending applications filter on the device only — they narrow rows already loaded, not the full list. They had previously been removed deliberately; the design wants them. | Keep client-side, or ask backend for a zone filter | **OPEN** |
| A5 | **Trusted Device switch** on Session & Security shows ON by default with nothing behind it. | Leave, or render off/disabled until the API supports it | **OPEN** |
| A6 | **Order issue form** collects an affected item and quantity. The endpoint has no field for either, so they are appended as lines in the description text. | Keep appending, or stop sending them | **OPEN** |

### Resolved 2026-11-17 (owner: screens follow the backend)
- Audit inspection scoring — design has 6 criteria scaled to 1000; backend has 10 categories totalling 100. Screen follows the backend. Design UI (stepper, score bubble, total badge) preserved.
- Expense form gained a payment-method field — the API requires it.
- "Assign auditor" became Internal/External plus agency name — the old auditor list had no real ids.
- Expense button "Submit for Approval" → "Save Expense" — BR-62 has no approval step.

---

## B. Backend — endpoints that do not exist

| Endpoint needed | What it blocks | DB ready? |
|---|---|---|
| `POST /admin/customers` | Add Customer. Nothing can create a customer. | **Yes** — `customers` has `customer_type`, `business_name`, `gstin`, `gst_verified`, `preferred_warehouse_id` (migration 0006) |
| `PATCH /admin/customers/{id}` | Editing a customer, setting GSTIN. Invoices read `buyerGstin` from a field nothing can write. | **Yes** |
| ~~`GET /admin/payouts`~~ | **CORRECTION 2026-11-17: it EXISTS.** `payoutsRouter.get('/')` and `get('/:id')`, both `payout.view`, in `apps/api/src/modules/payouts/payouts.routes.ts:69,86`. It is simply **absent from `docs/openapi.yaml`** (only `post:` is documented there). The mobile side can call it today. What it lacks is a COUNT — it returns a cursor page with no total, so "N payouts awaiting sign-off" still cannot be shown exactly. | Yes |
| ~~`GET /admin/accounts`~~ | **CORRECTION 2026-11-17: it EXISTS.** `adminAccountsRouter.get('/')` in `admin-accounts.routes.ts:25`. Also **absent from `openapi.yaml`**. But note it is a directory of EXISTING admins, not pending requests — see the account-requests row below. | Yes |
| **Undocumented endpoints generally** | At least three live routes are missing from `openapi.yaml`. That means `spec:lint` and `spec:drift` do not cover them, and nobody building a screen knows they exist. Worth an audit: diff the registered Express routes against the documented paths. | n/a |
| Admin account **requests** | `POST /admin/accounts` creates an ACTIVE account directly. There is no request/approval table anywhere, and `AdminRequestsApprovalScreen` is pure local `MOCK_REQUESTS`. Needs a table, `GET /admin/account-requests?status=PENDING`, approve/reject, and a new rbac code. | **No** |
| **Zones — the whole module** (see B1 below) | Farmer Admin accounts cannot be created at all, and the designed Zone Management module has no backend. | **Yes** |
| Admin account update | "Save Changes" is drawn and disabled — no update route. | Yes |
| Admin account reactivate | "Reactivate" is drawn and disabled — no re-enable route. | Yes |
| Payout reject | Reject stays disabled; no reject endpoint exists. | Yes |
| Compliance alert resolution | `ComplianceAlertResolutionScreen` is mounted and its Resolve sends nothing. Only `GET /admin/audits/compliance` exists. | Partly |
| Manual journal / ledger write | `AddManualJournalEntryScreen` is mounted and reports success. **No endpoint and no table anywhere.** Decide whether this feature exists. | **No** |
| `GET /admin/diary/categories` | Four KPI tiles have no source. Path is POST+PATCH only. | Yes |
| Role → permission write | `AssignAccessScreen` Save and Apply are permanently disabled. Matches orphan permission `role.permission.edit`. | Yes |
| Customers filter screen source | `CustomerFiltersScreen` does not exist in the repo at all; the restored filter icon opens nothing. | n/a |

### Closed in Backend Gap Batches (2026-11-17 / 2026-11-18)

| Endpoint | Feature & Rule | Migration | Status |
|---|---|---|---|
| `GET/POST/PUT /admin/warehouse-staff/{id}/bank-account` | Staff bank account details (BR-167) | 0096 | **DONE** |
| `GET/POST /admin/warehouse-staff/{id}/documents` | Staff identity documents (BR-167) | 0096 | **DONE** |
| `GET/PUT /admin/warehouse-staff/{id}/emergency-contact` | Staff emergency contact details (BR-167) | 0096 | **DONE** |
| `GET /admin/returns/summary` | Returns queue KPI summary (BR-168) | - | **DONE** |
| `GET /invoices/{id}`, `GET /admin/invoices` | Support all 5 invoice types (BR-169) | - | **DONE** |
| `POST /admin/wallets/{customerId}/deduct` | Customer wallet deduction with idempotency (BR-170) | - | **DONE** |
| `GET/POST /admin/payment-methods`, `GET/PUT/PATCH/DELETE /admin/payment-methods/{id}` | Payment methods management (BR-171) | 0096 | **DONE** |

### B1. Zones — a designed module with no backend

The largest single gap found. The database has been ready since **migration 0003**;
the design has a full module; the API has almost nothing.

**Database — ready.**
`zones` (0003): `id`, `code`, `name`, `warehouse_id`, `description`, `is_active`,
`created_at`, `updated_at`, `deleted_at`. Indexed on `warehouse_id`. Its own comment
says the `OWN_ZONE_ONLY` predicate in `rbac.json` resolves against `user_roles.zone_id`,
which points here. Plus `zone_taluks` (0086) and `0088_geographic_zones.sql`.

**Design — a full module.**
- `screens/dashboard/AdminZoneManagementScreen.tsx` (admin)
- `screens/profile/ZonesScreen.tsx`, `ZoneDetailsModal.tsx` (farmer)
- `useZoneBoundaryEditor.ts`, `zoneMap.ts` — boundary editing on a map
- `ZoneCropBreakdownScreen`
- entry points in `SuperAdminDashboardScreen` and `SuperAdminMoreScreen`

**API — one endpoint.**
`PUT /admin/accounts/{id}/zones` (`setFarmerAdminZones`) — *assigns* existing zones to
a Farmer Admin. That is all. There is no list, create, edit, deactivate, or crop
breakdown.

**RBAC — one permission.**
`admin.farmer_admin.assign_zones`. There is no `zone.view`, `zone.manage`,
`zone.create` or equivalent, so even the read has no code to gate it with.

**What this blocks**
- Farmer Admin accounts cannot be created — the server requires exactly one `zoneId`
  and nothing can list zones to choose from.
- `AdminZoneManagementScreen` has no backend at all.
- The `OWN_ZONE_ONLY` scope predicate depends on zones that nothing in the product
  can create or maintain.

**Needed**: `GET /admin/zones` (list, with warehouse filter), `GET /admin/zones/{id}`,
`POST`, `PATCH`, deactivate, and the permission codes to gate them. Boundary geometry
and the crop breakdown are separate questions.

**Note on ownership**: the FMB / zone map UI (boundary drawing, the Step-3 map) is
Subaganesh's work. This entry is about the **backend and permissions**, which are
needed whoever builds the screens.

---

### Orphan permissions — in `rbac.json`, zero routes behind them
`payment.method.configure` · `alert.threshold.configure` · `role.permission.edit` ·
`system.config.manage` · `notification.template.configure` ·
`announcement.system_wide.create` · `dispute.farmer.mediate`

Also unused but live: `POST /admin/farmer-applications/{id}/request-info` exists; the
screen marks "Request More Info" as dropped by owner decision. Confirm it is still wanted.

---

## C. Backend — missing fields on existing endpoints

Collected from the design-restoration sweep. Each is rendered as an em-dash today.

**Customers**
- list summary: with-orders count, with-issues count
- list row: purchases total, warehouse name; no `warehouseId` filter on the endpoint
- profile: open-issues count, completed-orders count, cancelled-orders count, preferred warehouse name
- support tickets: summary counts (total/open/resolved), order reference, resolved-by
- purchases: summary (total purchases, count, last purchase date), per-line payment status
- issues: summary counts; per-issue **category, product, quantity** — the category tabs render but every tab is empty because no issue carries a category
- orders list: pickup/delivery type
- `business_type` column (one-column migration 0094, pending)

**Profile / settings / identity**
- `GET /auth/me/sessions`: no `isCurrent` flag or session id in the token — **nothing identifies which session is yours**; no device, browser or location
- trusted-device flag is not persisted anywhere
- `GET /auth/me`: `adminId`, `accessLevel`, `passwordChangedAt`
- `GET /warehouses/{id}`: `region`, `assignedAdmin`
- storage locations: `activeCount`, `occupiedCount`, `emptyCount`, per-location `currentKg`, hierarchy children, section type/name/meta/fill percent, plus `section`/`rack`/`shelf` columns
- customer wallet: `totalCredited`, `totalUsed`
- notifications: no `category` field (derived from `data.refType`; Farmers, Disputes and Audits map to nothing)
- farmer applications: total and per-status counts

**Orders / transfers / sales**
- channel orders: contact person, phone, GSTIN; `items`/`subtotalPaise`/`gstPaise` on the list row; warehouse name
- transfers: no arrived status, no receiving-pending count, no quality field on a receipt, no timestamps for 5 of the 9 timeline steps
- `POST /warehouse-transfers`: no `reason` or `priority` field — **`stock_transfers` has no priority column**, so this needs a migration
- returns inspection: no `result`, `notes` or photo storage — `return_request_items` has no columns for them, so this needs a migration
- orders list row: customer name (BR-101)

**Billing / finance / audits**
- invoices: `customerName`, `orderNumber`, time of day on `issueDate`; detail missing sales channel, warehouse, discount, payment status/method, generated-by, timeline times; line `grade` and `unit`
- no "failed" invoice status; no endpoint listing orders awaiting an invoice
- vouchers: voucher number on the card, PENDING/COMPLETED counts (expense status is RECORDED/APPROVED/REJECTED), total count on the list response
- payout detail: ~27 fields (farmer, purchase, calculation, approval history, payment) — see `ApprovalDetailPayoutScreen`
- audits: `auditCode` (e.g. `AUD-2026-0042`) has no source; required-field count per inspection section; "Field Visit" type and "Rescheduled" status have no API equivalent
- audit log: no `role` filter
- purchase orders: `requestedQty`, `requestedPrice`; no "Collection Scheduled" status
- alerts: no priority field, no read/resolved state
- approval threshold for transfers lives in `system_config` but the app cannot read it, so the Initiate screen cannot show "Dispatch" vs "Submit for Sign-off"

---

## D. Forms that collect data the API discards

Invisible from both ends — the user types it, the screen looks like it worked, nothing is stored.

| Screen | Dropped |
|---|---|
| Initiate New Transfer | Priority (needs a column on `stock_transfers`) |
| Inspect Product (returns) | Inspection result, notes, photos (needs columns on `return_request_items`) |
| Order Issue | Affected item + quantity — currently appended to the description as a workaround (see A6); photo tile sends nothing |

---

## E. Screens in the design that were never built

120 in `design_parity.baseline.json` → `notYetBuilt`. Named ones that matter:

- `AddCustomerScreen`, `CustomerDirectoryScreen`, `CustomerFiltersScreen`
- the rest are listed in the baseline file; run
  `pnpm --filter @tohfa/mobile test -- src/roles/admin/tests/design_parity.test.ts`
  for the current count.

---

## F. Built but unreachable or inert

| Screen | Why |
|---|---|
| Dispatch (M5S13/M5S14) | Wired, but `availability.ts` hides the delivery area under BR-21. Ready for when delivery turns on. |
| Payout approval | Wired, but the only route in comes from a payout **dues** list that is mock data, and a due is not a payout — no real `payoutId` to pass. Approve stays disabled with "no payout selected". |
| `FinanceBusinessOverviewScreen` | Mounted nowhere, not even exported from `screens/dashboard/index.ts`. Self-contained now; give it `can` and it works. |
| `AlertThresholdsScreen` | Not mounted; referenced only from tests. |
| `ScheduleMarketOpenCloseScreen` | Not mounted; referenced only from tests. |
| Audit Calendar → Inspection | Calendar passes fixture ids ("1", "2"), so the inspection 404s. The real path is `AuditScheduleAssignmentScreen`. |
| Manage Admins | Renders `MOCK_ADMIN_ACCOUNTS`; disable from there will fail until `GET /admin/accounts` exists. |
| Orders / purchases filter screens | They open, but Apply only calls `back()` and discards the values. Pre-existing. |

---

## G. Still not honest

| Screen | What it does |
|---|---|
| "Return for Review" on `PayoutProcessingScreen` | Shows an alert and navigates back. No endpoint exists, so nothing is sent. It does not claim success, but it does not reach the server either. |
| `AuditReportScreen` | Says "compliance alert will be triggered" for major violations. BR-05b says completion has no such effect. |

---

## G1. Farmer app — Wave 3 findings (2026-11-17)

The farmer app had the same fabricated-success problem as the admin app.

**Fixed**
- `BankAccountScreen` / `UpiIdScreen` — were showing an invented account ("Murugan R.",
  HDFC, "Ooty Main Branch", an always-Verified badge) and a fake UPI id. Now read and
  write the real endpoints: `GET/POST/PATCH /farmers/me/bank-accounts`,
  `GET/PUT /farmers/me/upi`.
- `BankPaymentScreen` (the summary a farmer opens first) — was hardcoding
  `HDFC Bank • • • • 4821` and `murugan.r@okhdfcbank`, announcing them as "Verified"
  to a screen reader. Now real, with honest empty and error states.
- `WithdrawFundsScreen` / `AddMoneyScreen` — claimed money moved and invented a cash
  reference code `CASH-TU-7734`. No endpoint exists for either, so both actions are
  now visibly disabled with an explanation. Nothing deleted.

**Verified NOT broken** (the quick grep over-flagged them): CropManagementScreen,
inputDetails, RemoveItemScreen, Step3Location — all write through their parent.

**Still outstanding**
| Item | Problem | Endpoint |
|---|---|---|
| Wallet card on `BankPaymentScreen` | hardcoded "Balance: ₹4,250 · 3 recent transactions" | `getMyWallet` exists — being wired |
| `AboutSupportScreen` feedback form | says "submitted to the TOHFA team", sends nothing | **`POST /farmers/me/support-tickets` EXISTS** — just unwired |
| `App.tsx` asset/tree delete | `catch { }` swallows a failed delete and navigates back as success | both DELETE routes exist and are wired; the error handling is the bug |
| `CropDiaryEntriesScreen` | the entire list is a 6-row invented fixture (`INITIAL_DIARY_ENTRIES`) | `GET /farmers/me/diary/entries` exists, already in `api/farmDiary.ts`, never called |
| `WithdrawFundsScreen` display data | `availableBalance = '₹4,250'` and invented destination strings | needs the payout-request endpoints below |
| `CashTopUpScreen` | now unreachable, still defaults to the invented `CASH-TU-7734` | needs the top-up endpoints below |

**Farmer money endpoints that do not exist (backend brief)**
- `POST /farmers/me/payout-requests` + `GET` list. Idempotency-Key required. Needs a
  new permission code. The ₹10,000 approval threshold is a `system_config` value and
  must be enforced server-side; the debit goes through `wallet_transactions`
  (append-only).
- `POST /farmers/me/wallet/topups` for CASH and DIGITAL. The cash reference code must
  be **server-issued**. A gateway webhook must credit the wallet — the client must
  never be what credits a balance. Plus a staff confirm endpoint for the cash branch.

**Open decisions**
- UPI default switch: the design starts it ON for a new registration; it is currently
  OFF so a farmer with an existing default bank account is not silently switched.
- Multiple bank accounts: the screen edits the default (else the first). The design is
  single-account, so no list / delete / set-default control exists, though the
  endpoints do.

---

## G2. Dev database trap — stale dual-role account

`+919800000004` (`multirole@tohfa.test`) still logs in on older dev databases and
lands as Tohfa Admin.

It held **TOHFA_ADMIN + FARMER_ADMIN**, which BR-135 forbids. It was removed from
`db/seed/003_dev_users.sql` on 2026-11-03 — but the seed only inserts, it never
deletes, and `0083_role_exclusivity_strict.sql` guards **new writes only** (its own
comment says so). So any database seeded before that date still carries the violation.

Manual cleanup, per database:
```sql
UPDATE user_roles SET valid_to = now()
 WHERE user_id = '00000000-0000-0000-0000-000000000004' AND valid_to IS NULL;
UPDATE users SET deleted_at = now(), status = 'DISABLED'
 WHERE id = '00000000-0000-0000-0000-000000000004';
```

**Worth fixing properly**: the seed should retire that account rather than leaving it
to whoever trips over it. The whole scoping model rests on BR-135 holding.

Dev login map (single role each, correct as seeded):

| Mobile | Role |
|---|---|
| +919800000001 | SUPER_ADMIN |
| +919800000002 | TOHFA_ADMIN |
| +919800000003 | FARMER_ADMIN |
| +919800000005 | MAIN_WH_ADMIN |
| +919800000006 | SUB_WH_ADMIN (WH-COON) |

---

## H. Known test failures (all pre-existing, none from this work)

Mobile — 6 failures of 4,393:
- `cross_role_import_guard` (2) — `roles/admin/components` exists, and 24 cross-role imports in `roles/farmer/App.tsx`. Predates 2026-11-17.
- `admin_warehouse_area_guard` (1) — numeric `fontSize` in `BatchDetailScreen.tsx`, `DeliveryPreparationScreen.tsx`, `ReportIssueScreen.tsx`.
- `farmer/foundation` (1) — raw hex literals in `App.tsx`, `branding.json`, icon SVGs.
- `customer/store_submission` (2) — app ids do not contain `in.tohfa.customer`.

API — intermittent:
- `community-planting.test.ts` BR-136g (2 tests) — `/v1/farmers/community/planting-summary` returns 404 instead of 401/403 in roughly one run in three. Passes 31/31 in isolation. The router is sometimes not mounted when 149 files share one process. **This is an authorization test, so a run where it 404s is a run where the guard was never exercised.**

---

## I. Translation debt

- 21 Tamil entries under `billing.detail.*` and `billing.hub.*` are English placeholders.
- All `admin.auditActions.*`, `adminAccount.*` and the new customer/orders keys are English-only; `ta.json` is partial by convention.

---

## J. Open with the backend team (sent 2026-11-17, not yet closed)

1. The invented delivery date — `fulfilment.service.ts:614` defaults a missing `deliveryDate` to UTC today and persists it; the customer sees it as their delivery date and ETA. Wrong before 05:30 IST every day. Decision made: refuse the dispatch with 409.
2. No test covers `order.deliveryDate == null` — the path that change introduced.
3. OpenAPI dispatch 200 is `$ref: Order`, which requires `totalAmount` and `subtotal` at the top level; the handler returns `AdminOrderDetail` where both are nested under `totals`.
4. The `community-planting` flake (see H).
5. `_test` database guard has three bypasses: `ALLOW_REMOTE_TEST_DB` returns before the name check; an empty db name passes; a socket-path URL skips it. `deleteTestWarehouseAndFixtures` is also exported and called unguarded from two test files.
6. Slot release on cancel/return — proposed, not approved. Needs a rule id, a recorded "this order holds a seat" fact, no `GREATEST(0, …)`, a row lock, and before/after tests.

### Separate ticket, not to be fixed quietly
`getOrderTracking` (`fulfilment.repo.ts:642-647`) returns `order_status_history.note`
as free text **to the customer**. Dates to `b23f27b6`, 12 Oct — not from this work.
Today's notes are machine-generated and farm-free, but the column is free text and
staff paths write it. A pack note naming a farmer would reach a customer verbatim —
BR-16, through a channel with no allow-list. Decide: drop the field, or constrain it
to a code plus parameters.
