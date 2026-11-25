# Antigravity brief 07: fix the admin wiring pass

Brief 06 is reserved for the admin Zone Management screen (see brief 05). This is 07.

**Scope: `apps/mobile/src/roles/admin/` only** (screens and `api/` client wrappers).
Do not touch `apps/api`, `apps/admin-web`, `apps/mobile/src/shell/`, or any other role.

## Why

Your last pass changed about 60 files under `screens/`. Part of it was good, and it stays:
- the `DEMO_*` fixtures are gone
- many screens now call real hooks
- the typecheck is clean again

Four reviewers then read every changed line, and the owner checked the worst findings
against the code. **The pass is not complete.** The problems fall into five kinds:

1. About 25 buttons show "Success" with no server request behind them. Some of them move
   money.
2. Several screens send requests the server always rejects. They then show `—` forever, or
   show an error as if the list were empty.
3. Real numbers are shown under labels that mean something else. For example, average
   order value appears as "Net Profit".
4. Some numbers are invented: profit and margin computed on the phone, tier counts made
   from fixed percentages, and the count of one page shown as a total.
5. Demo data was reworded so it reads as real.

Every item below was confirmed on 2026-11-25. **Line numbers may have moved, because you
were still editing.** Find each item by the quoted code. If an item is already fixed,
report it as `ALREADY FIXED` and do not touch it again.

---

## The rules: every fix must satisfy all of them

- **R1. Missing values.** A value the API cannot supply renders `ADMIN_NO_VALUE`
  (`utils/noValue.ts`).
  - Never write `'—'` inline. 27 inline ones were added last pass; replace them all.
  - Never use `?? 'literal'`, `|| 'literal'`, `?? 0` or `?? 1` in place of a missing value.
  - A real `0` is shown as `0`, not as a dash.
- **R2. Designed elements stay.** Never delete a designed element to hide a gap; dash it
  instead. Never rename a designed label to fit the data you happen to have. The design
  of record is `origin/Superadmin-main`.
- **R3. Success needs a server.** No control reports success unless a server request
  succeeded.
  - The success Alert, toast or modal must sit in the mutation's `onSuccess` (or after an
    `await` that did not throw).
  - A failed request must show an error, never a success.
  - When **no endpoint exists**, disable the control. Use the disabled-with-note pattern
    already used in `screens/community/` (read it first; do not invent a new one). Then
    list the control in your report as backend work.
  - `setTimeout`-then-success is always wrong.
- **R4. One page is not a total.** A count or sum taken from one page of a list is never
  shown as a total.
  - Use the server total where one exists: `summary.count`, `summary.total`, `totals.*`,
    `page.total`, `getInvoiceSummary`, `useProduceRecordCount`.
  - Otherwise, dash it.
- **R5. Matching labels.** A live value may appear only under a label that means the same
  thing. If no live value means what the label says, dash it.
- **R6. No business numbers computed on the phone** (BR-63, clause 5: reports return raw
  sums and counts only). That covers profit, margin, net, closing balance, GST amounts
  and tier distributions. Dash them.
- **R7. Money uses the money helpers.** Use `Money` with `moneyText` /
  `formatMoneyOrDash`. Never use `Number(` / `parseFloat(` / `parseInt(` / `toFixed` /
  `toLocaleString` on money, and never parse a formatted `₹` string back into a number.
- **R8. No hard-coded business thresholds.** The ₹10,000 dual-approval line (BR-31) is an
  example. If the server sends a flag, use it. If it does not, do not show the claim.
- **R9. No fake identifiers or names.** Never build an ID or name out of a UUID or another
  field, for example `` `SO-${uuid}` ``, `` `GR-${poNumber}` ``, `` `PY-…` ``,
  `` `LST-${id.slice(0,4)}` ``, `` `DUE-${id}` ``, `` `${channel} Buyer` ``,
  `` `Warehouse ${id.slice(0,6)}` ``, or a UUID in a name slot. Dash it.
- **R10. Demo data stays out.** Never reword demo data so it looks real. Where no source
  exists, show the empty state. Never fall back to a fixture when the live list is empty,
  loading or failed.
- **R11. Loading, error and empty are three different states.** Use `AdminLoadingState`,
  `AdminErrorState` and `AdminEmptyState` from `screens/warehouse/shared/AsyncStates`.
  An error never renders as "No items". A screen that never fetched must not say "No
  records".
- **R12. Do not restyle.** Where you changed a designed style, restore it from
  `origin/Superadmin-main`. Known cases are listed in P5.

---

## P1: actions that lie. Do these first, and money first.

**"Endpoint exists"** means the endpoint is in `docs/openapi.yaml` today. Wire to it.
**"No endpoint"** means disable the control per R3.

| # | Where (find by the quote) | What it does now | Fix |
|---|---|---|---|
| 1 | `finance/WalletDeductionFlow.tsx`: `'Deduction Successful'` | Debits nobody's wallet, then reports success. | **Endpoint exists:** `POST /admin/wallets/{customerId}/deduct` (`deductCustomerWallet`, permission `wallet.manual_credit_debit`, **Idempotency-Key required**). There is no client wrapper yet, so add one to `api/wallet.ts` beside the cash-topup one. Generate the Idempotency-Key **once per confirmed deduction** and reuse it on retry. Enable the button only when a real customer id is passed. `FinanceManagementFlow` passes none today, so it stays disabled there; do **not** build a customer picker. Remove the pre-filled `500`, `'FC-ADJUSTMENT'`, `'Wallet adjustment and deduction.'`, `balance: '₹0'`, `'Demo TOHFA Admin'` and the hard-coded dates. Remove the `parseInt(... .replace(/[^\d]/g,''))` balance parse (R7). |
| 2 | `finance/FarmerPayoutDuesScreen.tsx`: `handleBulkProcess`, `'Bulk Payouts Initiated'` | Fake bulk bank transfer. | No bulk endpoint. Disable it. |
| 3 | `farmers/FarmerPayoutDetailScreen.tsx`: Approve `Alert.alert('Success', ...approved)` | Fake approve. | **Endpoint exists:** use `useApprovePayout` (`api/payoutsHooks.ts`). |
| 4 | Same file: Reject `'Rejected'`, Intimate `'Intimated'` | Fake. | No endpoint. Disable both. Also note that the parent never sets `selectedPayout` (`FarmerManagementFlow.tsx`: `_setSelectedPayout`), so this screen never receives a payout. Report it. |
| 5 | `sales/SalesReturnsRefundsScreen.tsx`: `'Refund Processed'` | Local state only. | **Endpoint exists:** `refundReturnToWallet(id, idempotencyKey)` (`api/returns.ts`), BR-61d. Only for `APPROVED` returns. |
| 6 | Same file: `'Bank Refund Initiated'` | Local state only. | The endpoint exists, but `api/returns.ts` **deliberately does not wrap it** (see its header comment). Do not add the wrapper; that is the owner's call. Disable it, and report it. |
| 7 | Same file: the reject action | Local state only. | **Endpoint exists:** `rejectReturn` (`api/returns.ts`). |
| 8 | `finance/ReturnsRmaDetailScreen.tsx`: `'Payout Intimated'` | Fake. | No endpoint. Disable it. |
| 9 | `reports/AnnouncementsScreen.tsx`: the `catch { // Retain optimistic local addition }` block, then `'Announcement Broadcasted'` | Reports success **even when the server rejects the request**. | Show success only on success, and show the error otherwise. Remove the optimistic local add. `WAREHOUSE` target requires `warehouseId`: send the selected warehouse's id. If the form has no way to pick one, disable the warehouse option and report it. The `formTarget` audience picker is never sent, and the API has no audience field, so disable it and report. Remove the `fallbackAnnouncements` fallback (R10). |
| 10 | `finance/AddManualJournalEntryScreen.tsx`: `'Journal Entry Posted'` | Fake. | No journal endpoint. Disable it. |
| 11 | `finance/ExpensesScreen.tsx`: `'Vouchers Verified'` | Fake. | No endpoint. BR-62 says expenses are only recorded, with no approval step. Disable it. |
| 12 | `finance/GSTFilingReportDetailScreen.tsx`: `'GSTR-1 JSON Generated'` | `setTimeout` fake. | No endpoint. Disable it. |
| 13 | `finance/PLStatementScreen.tsx` `handleExport`; `finance/ProfitLossScreen.tsx` export modal; `finance/FinanceManagementFlow.tsx` `'export initiated'` toast | Fake exports. | Wire one only if an endpoint under `/admin/exports/*` produces **exactly** what the button says. A P&L export has none. Otherwise disable it. |
| 14 | `finance/InvoicesGstBillingScreen.tsx`: `'Download Ready'` | Fetches the signed URL, then throws it away. | Open the URL (`Linking.openURL`). No "ready" alert; show an error only if opening fails. |
| 15 | `reports/RecentReportDetailScreen.tsx` `'Document Downloaded'`; `reports/FarmerPerformanceReportScreen.tsx` `'Downloaded'` / `'Exported'`; `reports/WarehouseOpsReportScreen.tsx` `'...saved to files.'` | Fake. | Disable them. |
| 16 | `sales/SalesInvoiceScreen.tsx`: `'Invoice PDF Generated'`, `total = 0`, `((total * 0.05) / 1.05)` | Fake PDF, fake ₹0, GST computed on the phone. | With a real invoice id, use `getInvoiceDownloadUrl`; otherwise disable. Dash the total and the GST (R1, R6). |
| 17 | `sales/SalesFulfillmentAssignmentScreen.tsx`: `'Order Packed'`, `'Pickup OTP #8492 sent...'`, the `WAREHOUSES` array | Fake pack, fake OTP, hard-coded warehouses. | With a real order id, use the existing pack wrapper in `api/orders.ts` (Idempotency-Key). Remove the fake OTP and disable that control. Warehouses come from the live warehouse list. |
| 18 | `sales/PurchaseOrderReceiptScreen.tsx`: `Alert.alert('Intimate Payout'` | Fake. | Disable it. |
| 19 | `farmers/AdminEditRatingCategoriesScreen.tsx`: `'Scorecard Saved'`, `INITIAL_CATEGORIES` (scores 88, 82…), `score >= 750` | Fake save. Invented scores are shown against a real farmer's name, on a dead 0-1000 scale. | No endpoint (BR-06 says so). Disable Save. Dash every score. The scale is 0-100 (BR-04b), and tier thresholds come from the server, never from literals. |
| 20 | `certifications/AdminCertVerificationScreen.tsx`: `'Certification marked as Verified'` | Local state. | **Endpoint exists:** `POST /admin/certifications/{id}/verify` (`certification.mark_verified`, Idempotency-Key). Wire it if the screen has a real certification id; otherwise disable. Dash `Dec 2026`. |
| 21 | `farmers/AdminEditFarmRecordScreen.tsx` `'Saved'` and `'Photo attached...'`; `farmers/FarmRecordsSection.tsx` `'Stage Updated'`, `'Harvest Recorded'`, `'Record Ended'` and the other livestock modals | Fake. | Disable them. |
| 22 | `inputs/InputDetailScreen.tsx`: Deactivate, Terminate and Delete alerts; `inputs/ApprovedInputsScreen.tsx`: Save and Add that mutate `CATALOG_INPUTS` | Fake, and they mutate a module-level fixture. | No endpoint: `inputs.catalog.manage` has 0 routes. Disable them. |
| 23 | `config/SystemConfigScreen.tsx`: `'Configuration Saved'`, `useState('70/10/10/10')`, `'₹500/yr'`, `'30 min'`, `'650/700/750'` | Fake save, hard-coded config. | No endpoint. Disable Save and dash the values. |
| 24 | `reports/SystemAlertsScreen.tsx`: `void dismissAlert(id).catch(() => {})`, `'Thresholds Updated'` | Hides the row before the server answers, and swallows failures. The thresholds action is fake. | Hide the row only on success, and show an error on failure. Disable the thresholds action. |

## P2: requests the server always rejects, and broken wiring

- **Blank finance report dates.** These calls send `{ from: '', to: '' }`:
  - `FinanceManagementFlow`
  - `FinancialDashboardScreen`
  - `ProfitLossScreen`
  - `PLStatementScreen`

  The server requires real `YYYY-MM-DD` dates (`reportQuery` in
  `apps/api/src/modules/finance/finance.schema.ts`). The span may be at most
  `system_config.finance_report_max_range_days` (366). Send the range the screen's own
  label states: MTD is the 1st of this month to today, and "Last 30 days" is today−29 to
  today. In `ProfitLossScreen`, derive from/to from `selectedMonth`; today the picker is
  cosmetic. Its warehouse filter is never sent either: send it if the endpoint accepts
  one, otherwise disable it. **Never send an empty string.**
- **Empty purchase-order search.** `PurchaseSalesOrdersScreen`:
  `usePurchaseOrderList(undefined, { q: searchQuery })` sends `?q=` when the search box is
  empty, and the server rejects that with a 422. Pass `undefined` when the box is blank.
  Do **not** change `buildQueryString`; it is shared shell code. Suggest that in your
  report instead.
- **Returns statuses.** `SalesReturnsRefundsScreen` tests `r.status === 'REQUESTED'`, a
  status that does not exist, so every open return shows as "Rejected".
  `ReturnsRmaRefundsScreen` shows `APPROVED` as "Approved - Refunded" / refund "Completed".
  Map all six real statuses in both screens: `PENDING | INSPECTED | APPROVED | REJECTED |
  REFUND_PENDING_BANK | REFUNDED`. Also:
  - In `ReturnsRmaRefundsScreen`, `r.created.split('T')[0]` runs on an already-formatted
    label and returns `''` for today. Fix it.
  - Use `useReturn` (`screens/warehouse/returns-rma/useReturnsData.ts`) for the detail
    instead of rebuilding it from the list row.
- **Bank account screen asks for the wrong farmer.** `FarmerManagementFlow` passes
  `farmerId={selectedFarmer.code ?? selectedFarmer.id}`. `code` is the TOHFA code, not
  the UUID, so pass the id. Gate the hook on `farmer.bank_account.view` with `enabled`,
  and render the loading and error states. Today a refused request shows "Unverified".
- **"15+ days" dues filter.** `FarmerPayoutDuesScreen` maps "15+ days" to `D16_30`, which
  hides every due older than 30 days (`D30_PLUS`). The API takes one bucket per request.
  Choose a fix and say which:
  - request both buckets and merge the results, or
  - send no bucket and filter on `ageDays > 15`, with R4 applying to any count.
- **Audit log.** In `SystemAuditLogsScreen`:
  - `entry.entityType === 'CONFIG'` never matches, because real types are lower-case
    snake_case. As a result every row lands in AUTH and the tabs do nothing.
  - Remove the `'127.0.0.1'` IP fallback.
  - Remove `FALLBACK_AUDIT_LOGS`.
- **Farmer status case.** `FarmerPerformanceReportScreen` compares `f.status === 'Active'`,
  but real statuses are lower-case.
- **Fixture under a real warehouse name.** `WarehouseOpsReportScreen` uses
  `WAREHOUSES_DATA[selectedWarehouseId] ?? WAREHOUSES_DATA['all']`, so choosing a real
  warehouse shows fixture numbers under its name. Remove the fixture and dash anything
  without a source. Use `getWarehouseCapacities` for capacity, not a hub count.
- **Online Orders shows every channel.** `SalesOnlineOrdersScreen` calls `listAdminOrders`
  with no `channel`, so add `channel: 'ONLINE'`. The DTO has a real `customerName`; use
  it, not `orderNumber`.

## P3: wrong labels and invented numbers

Each fix is either "put the right live value under it" or "dash it". Never compute.

**Finance**
- **`FinancialDashboardScreen`**
  - `profit = totalRevNum - totalExpNum` and the margin %: dash both (R6).
  - "Net Revenue": the API gives gross, so dash it.
- **`BasicAccountingLedgerScreen`**
  - "Current Closing Balance" (credits − debits): dash it.
  - `Transactions (${ledgerEntries.length})`: R4.
- **`ProfitLossScreen` and `PLStatementScreen`**
  - Dash profit, margin, gross profit and net profit (R6).
  - Remove the "· Verified" claim.
  - Restore the deleted rows as dashes (R2): Farmer Payouts, Previous Month, VS and growth.
- **`FinanceManagementFlow`**
  - Only "Outstanding Dues" gets the dues total. "Farmer Purchase Value" and "Pending
    Payouts" get a dash.
  - "Net Financial Summary" is sales: dash it.
  - The bar widths `'85%' '55%' '15%' '100%'` must come from the real values, or render
    empty.
  - `Last updated 14 Oct 2026, 06:00`: dash it.
  - Colour the status badge by `paymentStatus`.
  - Remove `.slice(0, 4)` on warehouses.
- **`PurchaseDuesPayoutsScreen`**
  - `farmerCount` shown under "Pending initiation" and "Unrequested dues": dash both.
  - `APPROVED` shown as "Pending initiation": map it correctly.
  - The `'Above threshold: needs dual authorization'` claim: R8.
  - `quantityKg: 0` and `unitPrice: 0`: dash them.
  - The `'Closed' / 'Completed' / 'Open'` statuses: dash them.
  - `` `DUE-${d.id}` ``: R9.
  - Restore the deleted "OVERDUE" card as a dash.
- **`SalesIncomeRevenueScreen`**
  - "NET SALES VALUE" = gross: dash it.
  - `` `${item.channel} Buyer` ``: R9.
  - `'· Paid'` is shown even when unpaid: fix it.
  - The detail values the API never gave (`itemCount: 1`, `status: 'Completed'` …): dash
    them.
  - Use `summary.count` for the counter.
- **`InvoicesGstBillingScreen`**
  - `CREDIT_NOTED` is shown as "Cancelled": map it correctly.
  - `gstin: 'GST Registered'`: dash it, or take `buyerGstin` from `getInvoice`.
  - `'Included: 5% GST'`: R6.
  - `` `SO-${orderId}` ``: R9.
  - The counter: use `getInvoiceSummary`.
- **`GSTFilingReportDetailScreen`**
  - "Total Taxable Sales" = gross total: dash it.
  - The invoice count: use `summaryData.count`.
  - `'Yes (5%)'`: R6.
  - Restore the "Total Output GST" card as a dash.
  - Restore the client name and GSTIN lines as dashes.
- **`TransactionHistoryScreen`**
  - `` `Order SO-${orderId}` ``: R9.
  - `gstApplicable` shown as "GST registered": fix it.
  - Restore row drill-down to the detail screens, using real ids (R2).

**Sales**
- **`PurchaseSalesOrdersScreen`**
  - These are invented: `customerName: item.orderNumber`, `customerId: item.id.slice(0,8)`,
    `` `PAY-${...}` ``, `'Fresh Produce'`, `'Grade 1'`, `: 'Paid'`, `itemCount ?? 1`, the
    order total used as unit price, `DIRECT: 'Market'`, `` `LST-…` ``,
    `` `Warehouse ${id.slice(0,6)}` ``, and the invoice literals (`'12 Oct 2026'`,
    `'Main Warehouse, Ooty'`, `'33AABCT1234D1Z5'`). Use the real field where one exists;
    dash everything else.
  - The KPI counts that use `.length`: R4.
- **`SalesChannelOverviewScreen`**
  - The summary is fetched with no range but labelled "MTD": send an MTD range.
  - The `DIRECT` count sits on the "Online" tile: fix it.
  - HORECA and B2B can come from `/admin/reports/sales` `byChannel`.
- **`SalesB2BOrdersScreen` and `SalesHorecaOrdersScreen`**
  - The customer code is shown in the GSTIN slot.
  - The order status is shown as the GST invoice status.
  - The placed date is shown as the delivery date, and its label was renamed.
  - One order's size is shown as the "Recurring order".
  - "N active accounts" counts orders on one page.

  Dash every one of these.
- **`PurchaseOrderDetailScreen`**
  - The "Original farmer request" and "TOHFA counter offer" rows repeat the agreed terms,
    which invents a negotiation that never happened. Dash them.
  - Never show the farmer UUID as the farmer code.
- **`PurchaseOrderPayoutScreen` and `PurchaseOrderReceiptScreen`**
  - `` `PY-…` ``, `` `GR-…` ``, `GR-0008`, `` `${warehouse} Admin` ``, `'· System'`:
    R9, dash them.
  - The PO issue date reused as the received or decision date: dash it.

**Reports, certifications and farmers**
- **`AnalyticsDashboardScreen`**
  - Each live value sits under an unrelated label:

    | Value | Shown as |
    |---|---|
    | `averageOrderValue` | "Net Profit" |
    | order count | "Platform Rev" |
    | `activeFarmers` | "Total Acres" |
    | `newCustomers` | "Repeat Orders" |
    | item count | "Total Intake" |
    | batch count | "Loss/Spoilage" |

    Re-map by meaning (R5) or dash.
  - Fixtures show while loading and on error: R10, R11.
  - The hard-coded `{ from: '2026-04-01', to: '2027-03-31' }`: derive it from today.
  - Chart bars use `Math.max(1, …)`, which fakes a bar for a zero day. Remove it.
- **`AdminComplianceTiersScreen`**
  - The tier counts are `activeFarmers * 0.48 / 0.31 / 0.15 / 0.06`, invented numbers.
    `FarmerSummaryDto` has no per-tier counts, so dash them (R6).
  - Restore "Audited This Quarter" and "Overdue Audits" as designed, dashed (R2).
- **`FarmerPerformanceReportScreen`**
  - `PERFORMANCE_DATA_MATRIX` still drives most KPIs and charts: remove it and dash (R10).
  - `overallRating / 10` invents a star figure (BR-06): show the 0-100 score.
  - A null rating renders as "★ 0": dash it.
- **`FarmerBankAccountDetailsScreen`**
  - `'Savings'` and `'Active'` are invented: dash both.
  - `docType === 'CERTIFICATE'` is treated as the bank passbook: remove that.
  - `'Verified Document'` ignores `verificationStatus`: use the real status.
  - `'✓ Used for farmer payouts'` contradicts BR-53: remove the claim.
  - Restore the deleted "Last payout" line as a dash.
  - View and Download must open the real `readUrl`.
- **`AdminRatingScorecardScreen`**
  - `DEFAULT_CATEGORY_NAMES` keys never match the real codes (`db/seed/001_reference.sql`,
    the rating categories). Use the real codes.
  - Remove the six invented fallback categories.
  - The tip card is hard-coded: dash it.
- **`CropHistoryRecordsScreen` and `ZoneCropBreakdownScreen`**
  - Both render the crop-type dropdown list (`useProduceFilterOptions`) as crop records.
    If `/admin/produce/records` is in `docs/openapi.yaml`, add a list wrapper beside
    `useProduceRecordCount` in `api/produceHooks.ts` and use it. Otherwise show the empty
    state.
  - Remove the fixed 4-of-7 stage bar and `'(2 excluded)'`.
- **`AdminFarmMapScreen`**
  - The plot pins are invented, and "Geo-fenced" and "FMB record" are claims with no
    source.
  - Use the plots from `GET /admin/farmers/{id}` if they carry geometry; otherwise show an
    empty map state. Do not invent pins.
- **`FarmRecordsSection`**
  - It says "No crops registered" without fetching anything (R11).
  - Either fetch from the farm-assets and livestock endpoints (wrap them if they are in
    openapi) or show "not loaded", never "none".
  - Remove the default date `'28-10-2026'`.

## P4: demo data reworded to look real

Each of these becomes the empty state, or a dash, with no fixture:
- `finance/ReportsExportScreen.tsx` `SAMPLE_EXPORTS`: you removed the "(demo)" labels and
  changed `'Failed'` to `'Ready'`.
- `reports/AdminReportsMainScreen.tsx` `RECENT_DOCS`.
- `reports/AllRecentReportsScreen.tsx` `RECENT_REPORTS_DATA`.
- `inputs/FarmerPestIncidentsScreen.tsx` `SAMPLE_INCIDENTS`, including
  `'Initial incident observation.'`.
- `inputs/ApprovedInputsScreen.tsx` `CATALOG_INPUTS`, with `updatedBy: 'Admin'`.
- `inputs/InputsPestHomeScreen.tsx`: the Neem, Panchagavya, Late Blight and Bio-NPK cards.
- `inputs/InputDetailScreen.tsx`: `|| 'Approved'`, and `` `${code}-TN` ``.
- `produce/ProduceControlFiltersModal.tsx`: `'Farmer #00124'`.
- `reports/SystemAlertsScreen.tsx`: `fallbackAlerts`.
- `sales/SalesOnlineOrdersScreen.tsx`: delete the dead `DEMO_ONLINE_ORDERS` export.

## P5: restyles to undo (R12)

Compare each against `origin/Superadmin-main` and restore the design:
- `FinancialDashboardScreen`:
  - `heroCard` was changed to `brandDeep`.
  - The mini icon boxes lost their colours.
  - The shadows were removed.
  - The nav cards lost their height and centring.
- `GSTAccountingScreen`: the shadows were removed.
- `SalesReturnsRefundsScreen`: the icons were swapped (`WalletBtnIcon` → `ArrowRotateLeftIcon`,
  `RejectBtnIcon` → `XCloseIcon`).
- `ExpensesScreen`: the per-category icons were collapsed into one.
- `FarmerPayoutDuesScreen`: the card shadows and the avatar tint changed.

Also remove the new user-facing English strings you added in loading, empty and alert
states. Move them to the admin i18n catalogue.

---

## Tests: write first, watch them fail

Add them under `apps/mobile/src/roles/admin/tests/`. Name each test with its rule id, and
check every id in `docs/rules.md` before citing it. The ids involved here are BR-06,
BR-04b, BR-31, BR-53, BR-61d, BR-62 and BR-63.

**Render tests for the money and announcement actions** (P1 #1, #3, #5, #7, #9):
- The API is mocked to reject: there is no success alert, and an error is shown.
- The API is mocked to resolve: the success alert is shown.
- Wallet deduction: a retry after a failure reuses the **same** Idempotency-Key.

**Status mapping:** all six return statuses, in both returns screens.

**Finance report requests:** `from` and `to` match `^\d{4}-\d{2}-\d{2}$` and are never
empty.

**One source guard over every file you touched.** None of these may appear:
- `from: ''` or `q: ''` sent to a request
- a `'—'` literal
- `setTimeout(` near `Alert.alert(`
- `* 0.48`, `* 0.31`, `* 0.15`, `* 0.06`
- `` `SO-${ ``, `` `GR-${ ``, `` `PY-${ ``, `` `LST-${ ``, `` `DUE-${ ``
- `parseFloat(` or `Number(` applied to an amount
- `'Deduction Successful'`, `'Bulk Payouts Initiated'`, `'Journal Entry Posted'`,
  `'Vouchers Verified'`, `'GSTR-1 JSON Generated'` or `'Scorecard Saved'` outside an
  `onSuccess`

**Never delete, skip or weaken a test to go green.** If one fails, leave it failing and
explain why.

## Git and safety

- **Never commit, push, merge, branch, stage, stash or open a PR.** The owner commits.
- No database: prefix every command with
  `DATABASE_URL=postgres://nobody:nobody@127.0.0.1:1/no_such_db`.
- Never read or print a `.env`.
- Never start or stop Metro, the API, an emulator or docker.
- Quote zsh globs in single quotes.

## Verify: paste the REAL terminal output, never a summary

Run each command **before** your first edit, save the output, then run it again at the end:
```
DATABASE_URL=postgres://nobody:nobody@127.0.0.1:1/no_such_db pnpm --filter @tohfa/mobile typecheck
DATABASE_URL=postgres://nobody:nobody@127.0.0.1:1/no_such_db pnpm --filter @tohfa/mobile test
```
The baseline is **26 failing test files**: the 25 known files plus `design_parity`.
- `design_parity` fails because the design branch gained `AuditReportExportWizardScreen`
  and `AuditReportPreviewScreen`. **Do not edit `design_parity.baseline.json` to silence
  it.** That is the owner's decision.
- Compare the failing **file list** and the per-file counts, before and after.

## Report

**One row per numbered item above**, with exactly one status:
- `FIXED`: say what is now real.
- `DISABLED`: no endpoint; give the endpoint that would be needed.
- `ALREADY FIXED`
- `NOT DONE`: say why.

Then:
- every new client wrapper you added
- every backend gap you found
- both baselines, and the final verification output, verbatim

**Do not describe the work as "complete".** The owner decides that from the table.
