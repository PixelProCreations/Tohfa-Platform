/**
 * Source scan and structural checks for the warehouse reports area (M12) and
 * the warehouse pickers of the customers / billing / receiving filter screens:
 * - No fixtures: reports/fixtures.ts is gone, nothing imports a fixtures module,
 *   and no fake warehouse list (REPORT_/CUSTOMER_/BILLING_/WALLET_WAREHOUSES).
 * - The Main pickers read GET /warehouses (useWarehouseOptions), Sub never (BR-30).
 * - Each card is gated on the code its server route requires (BR-64h).
 * - CSV export is hidden (no file save / share mechanism in the app).
 * - No fake Alert actions, no hard-coded English titles in the report cards.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { REPORT_CODES, REPORT_SECTIONS, reportVisible, visibleReportSections } from '../screens/warehouse/reports/constants';
import { hasKey } from '../i18n';

const SRC = path.join(__dirname, '..', '..', '..');
const REPO = path.join(SRC, '..', '..', '..');
const read = (rel: string) => fs.readFileSync(path.join(SRC, rel), 'utf8');
/** Source without comment lines, so doc comments that explain a removal do not trip the scan. */
const codeOf = (rel: string) =>
  read(rel)
    .split(/\r?\n/)
    .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l))
    .join(String.fromCharCode(10));

const REPORTS = 'roles/admin/screens/warehouse/reports';
const REPORT_FILES = fs.readdirSync(path.join(SRC, REPORTS)).filter((f) => /\.tsx?$/.test(f));
const PICKER_FILES = [
  'roles/admin/screens/warehouse/customers/OrderFiltersScreen.tsx',
  'roles/admin/screens/warehouse/billing-invoices/InvoiceFiltersScreen.tsx',
  'roles/admin/screens/warehouse/billing-invoices/BillingFlow.tsx',
  'roles/admin/screens/warehouse/receiving-qc/ReceivingSearchFiltersScreen.tsx',
];
const ALL_FILES = [...REPORT_FILES.map((f) => `${REPORTS}/${f}`), ...PICKER_FILES];
const FAKE_LISTS = /\b(REPORT_WAREHOUSES|CUSTOMER_WAREHOUSES|BILLING_WAREHOUSES|WALLET_WAREHOUSES)\b/;

describe('Reports wiring (M12, BR-64)', () => {
  it('reports/fixtures.ts is gone and no reports file imports a fixtures module', () => {
    expect(fs.existsSync(path.join(SRC, REPORTS, 'fixtures.ts'))).toBe(false);
    for (const f of REPORT_FILES) {
      expect(read(`${REPORTS}/${f}`), f).not.toMatch(/fixtures'/);
    }
  });

  it('BR-30: no fake warehouse list anywhere in the reports area or the three filter screens', () => {
    for (const f of ALL_FILES) {
      const src = codeOf(f);
      expect(src, f).not.toMatch(FAKE_LISTS);
      expect(src, f).not.toMatch(/wallet-cashtopup\/fixtures/);
      expect(src, f).not.toMatch(/'WH-(OOTY|COON|KOTA|GUDA)'/);
    }
    for (const f of ['customers/fixtures.ts', 'customers/index.ts', 'billing-invoices/fixtures.ts', 'billing-invoices/index.ts']) {
      expect(read(`roles/admin/screens/warehouse/${f}`), f).not.toMatch(/CUSTOMER_WAREHOUSES|BILLING_WAREHOUSES/);
    }
  });

  it('BR-64b: Main pickers read GET /warehouses, enabled only for Main with warehouse.all.view', () => {
    for (const f of [
      `${REPORTS}/ReportsScreen.tsx`,
      'roles/admin/screens/warehouse/billing-invoices/InvoiceFiltersScreen.tsx',
      'roles/admin/screens/warehouse/receiving-qc/ReceivingSearchFiltersScreen.tsx',
    ]) {
      const src = read(f);
      expect(src, f).toContain('useWarehouseOptions(');
      expect(src, f).toContain("can('warehouse.all.view')");
    }
  });

  it('BR-64h: the receiving card is gated on the code the server route requires', () => {
    const routes = fs.readFileSync(path.join(REPO, 'apps/api/src/modules/reports/reports.routes.ts'), 'utf8');
    const routeCode = (p: string): string | undefined =>
      new RegExp(`'${p}',\\s*requireAuth,\\s*requirePermission\\('([^']+)'\\)`).exec(routes)?.[1];
    expect(routeCode('/receiving')).toBe(REPORT_CODES.receiving);
    expect(routeCode('/sales')).toBe(REPORT_CODES.sales);
    expect(routeCode('/inventory')).toBe(REPORT_CODES.inventory);
    expect(routeCode('/returns')).toBe(REPORT_CODES.returns);
    expect(routeCode('/customers')).toBe(REPORT_CODES.customers);
    expect(routeCode('/cash-topups')).toBe(REPORT_CODES.cashTopUp);
    const receiving = REPORT_SECTIONS.flatMap((s) => s.reports).find((c) => c.code === 'RECEIVING_REPORT');
    expect(receiving?.permission).toBe('inventory.goods_receipt.record');
    // batch.view alone does not open the receiving report (the route would be a 403).
    expect(reportVisible(receiving!, (code) => code === 'inventory.batch.view')).toBe(false);
  });

  it('every gate code exists in docs/rbac.json', () => {
    const rbac = fs.readFileSync(path.join(REPO, 'docs/rbac.json'), 'utf8');
    for (const code of Object.values(REPORT_CODES)) {
      expect(rbac, code).toContain(`"${code}"`);
    }
  });

  it('CSV export is hidden: no export card, view or exports call (no file save / share mechanism)', () => {
    const codes = REPORT_SECTIONS.flatMap((s) => s.reports).map((c) => String(c.code));
    expect(codes).not.toContain('EXPORT_REPORT');
    for (const f of REPORT_FILES) {
      const src = codeOf(`${REPORTS}/${f}`);
      expect(src, f).not.toMatch(/export_report|\/admin\/exports/);
    }
  });

  it('no detail view without an endpoint, and no fake Alert actions', () => {
    for (const f of REPORT_FILES) {
      const src = codeOf(`${REPORTS}/${f}`);
      expect(src, f).not.toMatch(/sales_order_detail|invoice_detail|_item_detail|orders_list/);
      expect(src, f).not.toMatch(/Alert\.alert/);
    }
  });

  it('cards carry i18n keys that exist, and a viewer with no code sees no card', () => {
    for (const card of REPORT_SECTIONS.flatMap((s) => s.reports)) {
      expect(hasKey(card.titleKey), card.titleKey).toBe(true);
      expect(hasKey(card.subtitleKey), card.subtitleKey).toBe(true);
    }
    for (const s of REPORT_SECTIONS) expect(hasKey(s.labelKey), s.labelKey).toBe(true);
    expect(visibleReportSections(() => false)).toEqual([]);
    // The summary shows with any one of its parts.
    const summaryOnly = visibleReportSections((code) => code === REPORT_CODES.cashTopUp).flatMap((s) => s.reports.map((c) => c.code));
    expect(summaryOnly).toEqual(['CASH_TOPUP_REPORT', 'SUMMARY_REPORT']);
  });

  it('the finance reports read the real DTO through useFinanceReports (summary.total, not totalAmount)', () => {
    const src = read(`${REPORTS}/useReportsData.ts`);
    expect(src).toContain('useFinanceReports(');
    expect(src).not.toContain('totalAmount');
    expect(read(`${REPORTS}/ReportsScreen.tsx`)).not.toContain('totalAmount');
  });
});
