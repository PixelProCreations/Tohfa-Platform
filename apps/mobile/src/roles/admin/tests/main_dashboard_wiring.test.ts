/**
 * Main Warehouse dashboard wiring (screens/dashboard/MainWarehouseAdminDashboardScreen.tsx),
 * modelled on dashboard_wiring.test.ts: source-level checks, since the vitest
 * setup has no DOM. The figures themselves are unit-tested on the pure module
 * (mappers_mainDashboard.test.ts); this file pins that the screen uses it.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const SRC = path.join(__dirname, '..', '..', '..');
const read = (rel: string) => fs.readFileSync(path.join(SRC, rel), 'utf8');

const MAIN = read('roles/admin/screens/dashboard/MainWarehouseAdminDashboardScreen.tsx');
const EN = JSON.parse(read('roles/admin/i18n/en.json')) as Record<string, string>;

describe('no design samples on the live dashboard', () => {
  it.each([
    'OVERVIEW_WAREHOUSES',
    'DEFAULT_ALERTS',
    'CONSOLIDATED_PRODUCTS',
    'LOW_STOCK_ITEMS',
    'TRACKING_TRANSFERS',
    'PROFILE_WAREHOUSES',
    'WAREHOUSE_ADMIN_ROWS',
    'WALLET_WAREHOUSES',
    'Suresh',
  ])('%s does not appear in the Main dashboard', (name) => {
    expect(MAIN).not.toContain(name);
  });

  it('imports no fixtures module from the warehouse areas', () => {
    expect(MAIN).not.toMatch(/from '\.\.\/warehouse\/[^']*\/fixtures'/);
    expect(MAIN).not.toMatch(/from '\.\.\/warehouse\/[^']*[Ff]ixtures'/);
  });

  it('every figure goes through the pure module or the view-state gate: no query result is read bare into JSX', () => {
    expect(MAIN).not.toMatch(/\{(batches|goodsReceipts|liveAlerts|openTasks)\.length\}/);
  });
});

describe('every query has a view-state handler (no zeros or "all normal" while loading or failed)', () => {
  const QUERY_SOURCES = [
    'warehousesQuery',
    'batchesQuery',
    'taskSummaryQuery',
    'openTasksQuery',
    'salesSummaryQuery',
    'ordersQuery',
    'goodsReceiptsQuery',
    'alertsQuery',
    'issuesQuery',
    'perfTodayQuery',
    'perfMtdQuery',
    'salesMtdQuery',
    'activityQuery',
    'snoozedAlertsQuery',
  ];

  it.each(QUERY_SOURCES)('%s is wrapped by sourceOf() so its loading and error state reach a gate', (name) => {
    expect(MAIN).toMatch(new RegExp(`sourceOf\\(${name}\\)`));
  });

  it('every sourceOf() result is read by a SectionGate or a figureOrPlaceholder, never left unused', () => {
    const sources = [...MAIN.matchAll(/const (\w+Src) = sourceOf\(/g)].map((m) => m[1]!);
    expect(sources.length).toBeGreaterThanOrEqual(QUERY_SOURCES.length);
    for (const name of sources) {
      const uses = MAIN.split(name).length - 1;
      expect({ name, uses: uses > 1 }).toEqual({ name, uses: true });
    }
  });

  it('the alerts card and the empty states live inside a SectionGate, so "All Warehouses Normal" needs a successful alerts fetch', () => {
    const gate = MAIN.indexOf('<SectionGate sources={[alertsSrc, warehousesSrc]}>');
    const normal = MAIN.indexOf('All Warehouses Normal');
    expect(gate).toBeGreaterThan(-1);
    expect(normal).toBeGreaterThan(gate);
  });

  it('every KPI value goes through figureOrPlaceholder, so a loading tile shows the dash, not 0', () => {
    for (const bare of [
      '{totalStockKg.toLocaleString()}</Text>',
      '{orders.length}</Text>',
      '{liveAlerts.length}</Text>',
      '{salesRevenueText}</Text>',
    ]) {
      expect(MAIN).not.toContain(`styles.kpiValue}>${bare}`);
    }
  });
});

describe('BR-78: dismissing an alert', () => {
  it('awaits the mutation and shows success only after it resolved (mutateAsync, never fire-and-forget mutate)', () => {
    expect(MAIN).toMatch(/await dismissMutation\.mutateAsync\(alert\.id\)/);
    expect(MAIN).not.toMatch(/dismissMutation\.mutate\(/);
    const awaited = MAIN.indexOf('await dismissMutation.mutateAsync(alert.id)');
    const success = MAIN.indexOf("t('mainDashboard.alert.dismissed.title')");
    expect(success).toBeGreaterThan(awaited);
  });

  it('a failure returns before the success message and renders from the mutation error', () => {
    expect(MAIN).toMatch(/catch \{[\s\S]*?return;\s*\}\s*Alert\.alert\(t\('mainDashboard\.alert\.dismissed\.title'\)/);
    expect(MAIN).toMatch(/dismissMutation\.isError \? \(\s*<Text style=\{styles\.dismissErrorText\}>\{t\(adminErrorKey\(dismissMutation\.error\)\)\}/);
  });

  it('says it hides the alert for the caller only (spec: other users still see it) and is gated on alert.own.view', () => {
    expect(EN['mainDashboard.alert.dismiss']).toBe('Dismiss for me');
    expect(EN['mainDashboard.alert.dismissed.body']).toMatch(/your list only/);
    expect(MAIN).toContain("can('alert.own.view')");
    expect(MAIN).not.toMatch(/>Acknowledge</);
    expect(MAIN).not.toContain('Alert Acknowledged');
  });
});

describe('weights are integers and money is paise (root CLAUDE.md 2.2; BR-66b)', () => {
  it('the screen does no float weight math: no Number(), parseFloat or toLocaleString on a quantity', () => {
    expect(MAIN).not.toMatch(/Number\(\s*\w+\.(qty\w*|acceptedQtyKg|rejectedQtyKg|capacityKg)/);
    expect(MAIN).not.toContain('toLocaleString');
    expect(MAIN).not.toContain('parseFloat');
    expect(MAIN).not.toMatch(/\.toFixed\(/);
  });

  it('BR-66b: capacity is not clamped (no Math.max(0, capacity - used)) and the figures come from deriveStockFigures', () => {
    expect(MAIN).not.toMatch(/Math\.max\(\s*0,\s*total/);
    expect(MAIN).toContain('deriveStockFigures(batches, warehouses)');
    expect(MAIN).toContain('stockFig.capacity.availableGrams');
  });

  it('a malformed revenue is an error state, never a silent Rs 0', () => {
    expect(MAIN).not.toContain("'₹0'");
    expect(MAIN).not.toMatch(/catch \{\s*return '/);
    expect(MAIN).toContain('derivedSource(revenueD');
  });
});

describe('honest figures: no claim the data does not back', () => {
  it("asks for the IST day, not the UTC one (the sales summary counts Asia/Kolkata days, BR-96)", () => {
    expect(MAIN).toContain('istDay(now)');
    expect(MAIN).not.toContain('toISOString()');
  });

  it("Today's orders is placed-today from placedAt (GET /admin/orders has no placed-date filter), shown as N+ when the pages ran out", () => {
    expect(MAIN).toContain('countOrdersPlacedOn(');
    expect(MAIN).toContain('countLabel(ordersToday.count, ordersToday.exact)');
    expect(MAIN).not.toMatch(/String\(orders\.length\)/);
  });

  it('Receipts today are the receipts of the IST day (receiptsOnDay), not every receipt the first page held', () => {
    expect(MAIN).toContain('receiptsOnDay(goodsReceiptsQuery.data');
  });

  it('the transfers tile does not count every open task as a pending transfer', () => {
    expect(MAIN).not.toContain("t.type === 'ORDER_DISPATCH' || t.state === 'OPEN'");
  });

  it('"Adjustments awaiting approval" no longer counts RETURN_APPROVAL tasks; the row says what it counts and opens Returns', () => {
    expect(MAIN).not.toContain('Adjustments Awaiting Approval');
    expect(MAIN).toContain("t('mainDashboard.pending.returnsApproval')");
    expect(MAIN).toContain("openTaskCount(taskSummary, 'RETURN_APPROVAL')");
  });

  it('alerts carry no invented Critical / High / Medium priority and no Resolved filter (only active alerts are fetched)', () => {
    expect(MAIN).not.toMatch(/'Critical'|'High'|'Medium'/);
    expect(MAIN).not.toContain('Resolved');
    expect(MAIN).not.toContain('alertPriorityFilter');
    expect(MAIN).not.toContain('alertStatusFilter');
  });

  it('Recent Activity words titleKey through the catalogue (toRecentActivity) and never renders it raw', () => {
    expect(MAIN).toContain('toRecentActivity(openTasks, warehouses, now)');
    expect(MAIN).not.toMatch(/\{\s*t\.titleKey\s*\}/);
    expect(MAIN).not.toMatch(/\.titleKey\}/);
  });

  it('low-stock rows are named from the batches, not the raw itemKey', () => {
    expect(MAIN).toContain('toLowStockItems(liveAlerts, batches, warehouses)');
    expect(MAIN).not.toContain("a.itemKey || 'Produce Stock'");
    expect(MAIN).not.toContain("'Below Threshold'");
  });

  it('no invented copy stands in for data the server did not send (no "Regional Facility", no fixed "4 warehouses")', () => {
    expect(MAIN).not.toContain('Regional Facility');
    expect(MAIN).not.toContain('All 4 warehouses');
  });

  it('the greeting follows the hour of day and is not hard-coded', () => {
    expect(MAIN).toContain('greetingKey(now)');
    expect(MAIN).not.toContain('Good morning');
  });

  it('the warehouse list is the API\'s own isActive list, with no hard-coded seed codes', () => {
    expect(MAIN).toContain('listWarehouses({ isActive: true, pageSize: 100 }');
    expect(MAIN).not.toMatch(/WH-OOTY|WH-COON|WH-KOTA|WH-GUDA/);
  });

  it('every i18n key the screen asks for exists in the admin catalogue', () => {
    const used = [...MAIN.matchAll(/\bt\('([A-Za-z0-9_.]+)'/g)].map((m) => m[1]!);
    expect(used.length).toBeGreaterThan(5);
    for (const key of used) expect({ key, has: key in EN }).toEqual({ key, has: true });
  });
});

describe('transfers come from GET /warehouse-transfers (BR-102), not from tasks or orders', () => {
  it('the screen reads the real list through the read-only client and derives counts and rows from it', () => {
    expect(MAIN).toContain("from '../../api/warehouseTransfers'");
    expect(MAIN).toContain('listWarehouseTransfers({ warehouseId: selectedWarehouseId, pageSize: DASHBOARD_PAGE_LIMIT }');
    expect(MAIN).toContain('deriveTransfers(transfersQuery.data.items, transfersQuery.data.total, warehouses)');
  });

  it('transfer_tracking, the stock_and_transfer block and the home tile all read transferFig', () => {
    expect(MAIN).toContain('transferFig.rows.map(');
    expect(MAIN).toContain('transferFig.counts.pendingApproval');
    expect(MAIN).toContain('transferFig.counts.inTransit');
    expect(MAIN).toContain('transferFig.counts.received');
    expect(MAIN).toContain('transferFig.counts.discrepancies');
    expect(MAIN).toContain('transferFig.counts.open');
  });

  it('no tasks-as-transfers proxy remains: no trackingTransfers, no ORDER_DISPATCH, no dispatched-orders-as-in-transit, no alert count as Exceptions', () => {
    expect(MAIN).not.toContain('trackingTransfers');
    expect(MAIN).not.toContain('ORDER_DISPATCH');
    expect(MAIN).not.toMatch(/In Transit<\/Text>\s*<Text[^>]*>\s*\{ordersToday/);
    expect(MAIN).not.toMatch(/Exceptions<\/Text>\s*<Text[^>]*>\s*\{liveAlerts/);
    expect(MAIN).not.toMatch(/Pending<\/Text>\s*<Text[^>]*>\s*\{openTasks/);
  });

  it('the transfer client is read-only: the screen imports no write helper from it', () => {
    const imports = /import \{([^}]*)\} from '\.\.\/\.\.\/api\/warehouseTransfers'/.exec(MAIN)?.[1] ?? '';
    expect(imports.trim()).toBe('listWarehouseTransfers');
  });
});

describe('warehouse selection: every flow is live, so the selection is always a uuid', () => {
  /** The opening JSX tag of the first `<Name ... >` in the screen (props run to the first '>' not inside braces). */
  function openingTag(name: string, from = 0): string {
    const start = MAIN.indexOf(`<${name}`, from);
    expect(start).toBeGreaterThan(-1);
    let depth = 0;
    for (let i = start; i < MAIN.length; i += 1) {
      const ch = MAIN[i];
      if (ch === '{') depth += 1;
      else if (ch === '}') depth -= 1;
      else if (ch === '>' && depth === 0 && MAIN[i - 1] !== '=') return MAIN.slice(start, i + 1);
    }
    throw new Error(`unterminated <${name}`);
  }

  it.each(['CustomersFlow', 'ReportsScreen', 'InventoryFlow', 'OrdersFlow', 'BillingFlow'])(
    '%s gets the live warehouseOptions (real uuids), not its seed-code defaults',
    (flow) => {
      expect(openingTag(flow)).toContain('warehouseOptions={warehouseOptions}');
    },
  );

  it("the More menu's ReturnsFlow gets them (IssueReturnFlow opens one return by id and has no selector)", () => {
    expect(openingTag('ReturnsFlow', MAIN.indexOf("moreSubScreen === 'returns'"))).toContain('warehouseOptions={warehouseOptions}');
  });

  it('WalletFlow and FinanceFlow take no warehouse options: they load their own live picker (GET /warehouses, uuids only)', () => {
    for (const flow of ['WalletFlow', 'FinanceFlow']) {
      expect({ flow, passed: openingTag(flow).includes('warehouseOptions') }).toEqual({ flow, passed: false });
    }
    const second = MAIN.indexOf('<WalletFlow', MAIN.indexOf('<WalletFlow') + 1);
    expect(openingTag('WalletFlow', second)).not.toContain('warehouseOptions');
    expect(read('roles/admin/screens/warehouse/wallet-cashtopup/WalletFlow.tsx')).toContain('useWalletWarehouseScopes');
    expect(read('roles/admin/screens/warehouse/finance-expenses/WarehouseExpensesScreen.tsx')).toContain('useFinanceWarehousePicker');
  });

  it('Warehouse Settings and the City Detail card are live flows, so they get the selected warehouse uuid, never a seed code', () => {
    expect(MAIN).toContain('initialWarehouseId={detailWarehouseId}');
    expect(MAIN).toContain('{ warehouseId: detailWarehouseId }');
    expect(MAIN).not.toContain('fixtureWarehouseId');
    expect(MAIN).not.toContain('detailFixtureId');
  });

  it('the live Storage Info route gets the live options and the selected uuid', () => {
    const tag = openingTag('ProfileFlow', MAIN.indexOf('initialScreen="StorageInfo"') - 200);
    expect(tag).toContain('warehouseOptions={warehouseOptions}');
    expect(tag).toContain('initialWarehouseId={detailWarehouseId}');
  });

  it('selection is kept by uuid: no name-keyed state and no hard-coded default warehouse or location', () => {
    expect(MAIN).not.toContain('selectedWHName');
    expect(MAIN).not.toContain('selectedWHFilter');
    expect(MAIN).not.toContain('warehouseIdForName');
    expect(MAIN).not.toContain('WAREHOUSE_OPTIONS');
    expect(MAIN).not.toContain("'Ooty Warehouse'");
    expect(MAIN).not.toContain("'CS-C01'");
    expect(MAIN).toContain('useState<string | undefined>(undefined)');
  });

  it('the scope of every query is the selected uuid (the warehouse filter), so the cache key and the request agree (BR-30)', () => {
    expect(MAIN).toContain('const selectedWarehouseId = filterWarehouseId;');
    expect(MAIN).toContain('listBatches({ warehouseId: selectedWarehouseId');
  });

  it('Main keeps its own all-warehouses scope: no single warehouse (MAIN_WAREHOUSE_SCOPE = {})', () => {
    expect(MAIN).toContain('const MAIN_WAREHOUSE_SCOPE: WarehouseScope = {};');
  });
});

describe('theme: the screen takes colours from adminColors where a token exists', () => {
  it('the brand, ink, canvas, card and semantic colours are tokens, not literals', () => {
    for (const literal of ["'#F0562A'", "'#7A2E14'", "'#FDF3F0'", "'#F3EFE9'", "'#1A1A1A'", "'#5F5E5A'", "'#EEDCD3'", "'#854F0B'", "'#173404'", "'#E24B4A'", "'#FFFFFF'"]) {
      expect({ literal, present: MAIN.includes(literal) }).toEqual({ literal, present: false });
    }
    expect(MAIN).toContain('primary: adminColors.brand,');
    expect(MAIN).toContain('amberBg: adminColors.warning.bg,');
  });

  it('the raw colour count sits at or below the ratchet baseline for this file (admin_theme_guard.baseline.json)', () => {
    const allowed = read('tests/admin_theme_guard.baseline.json').match(
      /"screens\/dashboard\/MainWarehouseAdminDashboardScreen\.tsx":\s*(\d+)/,
    )?.[1];
    const hex = /(['"`])#(?:[0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3,4})\1/g;
    const rgb = /\brgba?\s*\(/g;
    const count = (MAIN.match(hex)?.length ?? 0) + (MAIN.match(rgb)?.length ?? 0);
    expect(Number(allowed)).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(Number(allowed));
  });
});

describe('the warehouse filter scopes what it feeds (old shell: filter -> KPIs, capacity and stock summary)', () => {
  it('the stock figures are scoped to the filter, so the cards and the capacity follow the picked warehouse', () => {
    expect(MAIN).toContain('scopeStockFigures(stockD.value, selectedWarehouseId)');
  });

  it('Capacity Summary counts the warehouses covered by the filter, not every active warehouse', () => {
    expect(MAIN).toContain('{stockFig.warehouses.length}');
    expect(MAIN).not.toMatch(/Active Warehouses<\/Text>\s*<Text[^>]*>\{warehouses\.length\}/);
  });

  it('Consolidated Stock searches product and grade through filterStockProducts and keys cards by the product+grade key', () => {
    expect(MAIN).toContain('filterStockProducts(stockFig.products, stockSearchQuery)');
    expect(MAIN).toContain('key={p.key}');
    expect(MAIN).not.toContain('key={p.cropId}');
  });

  it('the search placeholder is a catalogue string and does not promise a batch search the filter does not do', () => {
    expect(MAIN).not.toContain('Product, grade, batch...');
    expect(MAIN).toContain("t('mainDashboard.stock.searchPlaceholder')");
    expect(EN['mainDashboard.stock.searchPlaceholder']).toBe('Product or grade');
  });
});

describe('permission gating: a figure whose rbac code is missing is not fetched and not drawn (old shell)', () => {
  it('the screen asks dashboardAccess(can) once and gates the optional sources on it', () => {
    expect(MAIN).toContain('const access = dashboardAccess(can);');
    expect(MAIN).toContain('{ enabled: canAllView && access.sales }');
    expect(MAIN).toContain('{ enabled: canAllView && access.transfers }');
  });

  it('the Sales tile and the Pending Transfers tile are drawn only with their code', () => {
    expect(MAIN).toMatch(/\{access\.sales \? \(\s*<TouchableOpacity[\s\S]*?navigateWh\('sales'\)/);
    expect(MAIN).toMatch(/\{access\.transfers \? \(\s*<TouchableOpacity[\s\S]*?kpi\.pendingTransfers/);
  });

  it('Initiate Stock Transfer is drawn only with transfer.inter_warehouse.initiate, never as a button that answers "Permission Denied"', () => {
    expect(MAIN).not.toContain('Permission Denied');
    expect(MAIN).not.toContain('Transfer initiation requires');
    expect(MAIN).toContain('access.transferInitiate');
  });

  it('no fake "Export Successful" alert: the activity feed has no export endpoint (StorageFlow documents the prop as unused)', () => {
    expect(MAIN).not.toContain('Export Successful');
    expect(MAIN).not.toContain('onExportActivity');
  });
});

describe('BR-103: Open Issues is the real operational-issue count, not the alert count', () => {
  it('the tile and the per-warehouse Issues stat read the warehouse issue totals', () => {
    expect(MAIN).toContain('getOpenIssueCounts(coveredIds, signal)');
    expect(MAIN).toContain('issueFig.total');
    expect(MAIN).toContain('issueFig.byWarehouse[row.warehouseId]');
  });

  it('no alert count is shown under an "issues" label', () => {
    expect(MAIN).not.toContain('String(liveAlerts.length)');
    expect(MAIN).not.toMatch(/liveAlerts\.filter\(\(a\) => a\.warehouseId === row\.warehouseId\)/);
  });

  it('is fetched and drawn only with warehouse.issue.view, and the tile opens the issues list', () => {
    expect(MAIN).toContain('canAllView && access.issues');
    expect(MAIN).toMatch(/\{access\.issues \? \(\s*<TouchableOpacity[\s\S]*?navigateWh\('operational_issues'\)/);
  });
});

describe('KPI tiles open their module (old shell), with catalogue labels', () => {
  it.each([
    ['totalStock', "navigateWh('warehouse_capacity')"],
    ['incoming', "openTab('Receiving')"],
    ['orders', "navigateWh('customer_orders')"],
    ['pendingTransfers', "navigateWh('inter_warehouse_transfer')"],
  ])('the %s tile navigates', (name, call) => {
    const at = MAIN.indexOf(`t('mainDashboard.kpi.${name}')`);
    expect(at).toBeGreaterThan(-1);
    const tile = MAIN.slice(Math.max(0, at - 500), at);
    expect(tile).toContain(call);
  });

  it('the Sales tile says how many paid sales stand behind the revenue', () => {
    expect(MAIN).toContain("t('mainDashboard.kpi.salesSub', { count: figureOrPlaceholder(revenueSrc.status");
    expect(MAIN).toContain('deriveSalesCount(salesSummary)');
  });
});

describe('BR-80: Warehouse Performance carries the month-to-date figures the old shell showed', () => {
  it('reads the server-exact performance of the covered warehouses over the IST month, only while the view is open', () => {
    expect(MAIN).toContain('useWarehousesPerformance(coveredIds, monthToDateRange(now), canAllView && whSubView ===');
    expect(MAIN).toContain("'warehouse_performance'");
    expect(MAIN).toContain('derivePerformance(perfMtdQuery.data)');
  });

  it('shows receipts, received kg, orders placed and fulfilled, rejected kg and returns, from integer grams', () => {
    for (const field of ['goodsReceipts', 'grossGrams', 'ordersPlaced', 'ordersFulfilled', 'rejectedGrams', 'returnsRequested']) {
      expect(MAIN).toContain(`perfMtd.${field}`);
    }
    expect(MAIN).toContain('formatKg(perfMtd.grossGrams)');
    expect(MAIN).toContain('formatKg(perfMtd.rejectedGrams)');
  });

  it('month-to-date sales (revenue through paise, and the paid-sales count) need sales.dashboard.view', () => {
    expect(MAIN).toContain('useDashboardSalesSummary(selectedWarehouseId, monthToDateRange(now)');
    expect(MAIN).toContain('salesRevenueText(salesMtdQuery.data)');
    expect(MAIN).toContain('deriveSalesCount(salesMtdQuery.data)');
  });

  it("the Quality card also says how many returns were requested today (BR-80 returns.requested)", () => {
    expect(MAIN).toContain('useWarehousesPerformance(coveredIds, { from: today, to: today }');
    expect(MAIN).toContain('perfToday.returnsRequested');
    expect(EN['mainDashboard.ops.returns']).toBe('Returns today');
  });

  it('the shared hooks are reused, not re-implemented: no second performance client in the screen', () => {
    expect(MAIN).not.toContain('getWarehousePerformance(');
  });
});

describe('BR-104: Recent Activity and the timeline read the warehouse activity feed (old shell)', () => {
  it('reads the first feed page of the covered warehouses through the shared hook, only with warehouse.activity.view', () => {
    expect(MAIN).toContain('useRecentActivityPages(coveredIds, RECENT_ACTIVITY_ROWS, canAllView && access.activity');
    expect(MAIN).toContain('mergeRecentActivity(activityQuery.pages');
  });

  it('events are worded through the catalogue (activitySubLine, mainDashboard.activity.title), never as raw enums', () => {
    expect(MAIN).toContain("t('mainDashboard.activity.title', { type: row.typeLabel, reference: row.reference })");
    expect(MAIN).toContain('activitySubLine(row)');
  });

  it('a feed row opens its record: transfers to the transfer list, goods receipts to Receiving, the rest to the activity log', () => {
    expect(MAIN).toMatch(/row\.type === 'TRANSFER'[\s\S]*?navigateWh\('inter_warehouse_transfer'\)/);
    expect(MAIN).toMatch(/row\.type === 'GOODS_RECEIPT'[\s\S]*?openTab\('Receiving'\)/);
  });

  it('the Activity Timeline line is the newest event of any type, not only the last goods receipt', () => {
    expect(MAIN).toContain('activityTimelineLine(activityFeed[0])');
  });

  it("the open-task rows #128 shows stay (toRecentActivity), after the events", () => {
    expect(MAIN).toContain('toRecentActivity(openTasks, warehouses, now)');
    expect(MAIN.indexOf('activityFeed.map(')).toBeGreaterThan(-1);
    expect(MAIN.indexOf('activityRows.map(')).toBeGreaterThan(MAIN.indexOf('activityFeed.map('));
  });

  it('the section is gated: while the feed loads or fails there is a spinner or an error with Retry, not "No recent activity"', () => {
    expect(MAIN).toContain('<SectionGate sources={[openTasksSrc, ...(access.activity ? [activitySrc] : [])]}>');
  });
});

describe('BR-78: the Alerts & Action Center snoozes alerts and lists the snoozed ones, as the old Needs Attention did', () => {
  it('snoozes through the alerts API for the caller only, awaiting the server before it reports success', () => {
    expect(MAIN).toMatch(/await snoozeMutation\.mutateAsync\(alert\.id\)/);
    expect(MAIN).not.toMatch(/snoozeMutation\.mutate\(/);
    expect(MAIN).toContain('snoozeAlert(itemKey, snoozeUntil(new Date()))');
    const awaited = MAIN.indexOf('await snoozeMutation.mutateAsync(alert.id)');
    const success = MAIN.indexOf("t('mainDashboard.alert.snoozed.title')");
    expect(success).toBeGreaterThan(awaited);
  });

  it('a snooze failure returns before the success message and renders from the mutation error', () => {
    expect(MAIN).toMatch(/snoozeMutation\.isError \? \(\s*<Text style=\{styles\.dismissErrorText\}>\{t\(adminErrorKey\(snoozeMutation\.error\)\)\}/);
  });

  it('the snooze button is offered only for an active alert and only with alert.own.view', () => {
    expect(MAIN).toMatch(/canDismissAlert && !selectedAlert\.snoozed/);
    expect(MAIN).toContain("t('dashboardHome.alerts.snooze')");
  });

  it('the snoozed list is its own query (state=snoozed), read only while that list is shown, and gated like the others', () => {
    expect(MAIN).toContain("state: 'snoozed'");
    expect(MAIN).toContain("alertState === 'snoozed'");
    expect(MAIN).toContain('<SectionGate sources={[alertState === \'active\' ? alertsSrc : snoozedAlertsSrc, warehousesSrc]}>');
  });

  it('Active / Snoozed and the type filter are chips with counts from the pure mapper', () => {
    expect(MAIN).toContain('ChipGroup');
    expect(MAIN).toContain('countDashboardAlerts(');
    expect(MAIN).toContain('filterDashboardAlerts(');
  });

  it('the new copy is in the catalogue', () => {
    for (const key of ['mainDashboard.alert.snoozed.title', 'mainDashboard.alert.snoozed.body', 'mainDashboard.alert.snoozing']) {
      expect({ key, has: key in EN }).toEqual({ key, has: true });
    }
    expect(EN['mainDashboard.alert.snoozed.body']).toMatch(/your list only/);
  });
});
