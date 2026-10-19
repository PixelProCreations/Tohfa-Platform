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
    expect(MAIN).toContain("ordersToday.exact ? '' : '+'");
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
