/**
 * Super Admin shell, Overview tab (screens/dashboard/SuperAdminDashboardScreen.tsx):
 * the greeting and every figure on it.
 *
 * Why this file exists: the screen shipped with a fabricated greeting
 * ('Rajesh Kumar', substituted whenever /auth/me said 'Super Administrator')
 * and fabricated figures ('1,284' farmers, '6,502' customers, '₹18.4L'
 * revenue, '4 / 4' warehouses, '3 payouts', '2 Sub Warehouse Admin
 * accounts'). An admin read those as real numbers. The contract now is:
 *
 *   - the greeting shows what /auth/me returned, ALWAYS, and never a person;
 *   - a figure with an endpoint shows the server's value;
 *   - a figure with no endpoint shows ADMIN_NO_VALUE, never a number and
 *     never a stand-in computed from something else;
 *   - the card, label and section are drawn in EVERY state (loading, error,
 *     no permission, no endpoint). Nothing in the design is removed.
 *
 * The source guard at the end fails if any of the old literals comes back.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type * as CustomersModule from '../api/customers';
import type * as FinanceModule from '../api/finance';
import type * as WarehouseListModule from '../api/warehouseList';
import type * as AuditsModule from '../api/audits';

const h = vi.hoisted(() => {
  const stub = (name: string) => {
    const C = (_props: Record<string, unknown>) => null;
    C.displayName = name;
    return C;
  };
  return {
    stub,
    fetchMe: vi.fn(),
    alert: vi.fn(),
    listCustomers: vi.fn(),
    getFinanceRevenueReport: vi.fn(),
    listAllWarehouses: vi.fn(),
    getAuditCompliance: vi.fn(),
  };
});

vi.mock('react-native', () => ({
  Alert: { alert: h.alert },
  BackHandler: { addEventListener: vi.fn(() => ({ remove: () => undefined })) },
  Platform: { OS: 'android', select: (o: Record<string, unknown>) => o['android'] ?? o['default'] },
  ScrollView: 'ScrollView',
  StyleSheet: { create: (s: Record<string, unknown>) => s, flatten: (s: unknown) => s, absoluteFill: {} },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));
vi.mock('react-native-svg', () => ({
  default: 'Svg',
  Circle: 'Circle',
  Line: 'Line',
  Path: 'Path',
  Rect: 'Rect',
}));
vi.mock('@tohfa/mobile-ui', () => ({ ScreenStatusBar: 'ScreenStatusBar', SafeAreaView: 'SafeAreaView' }));
vi.mock('../../farmer/api/auth', () => ({ fetchMe: h.fetchMe }));

// The four reads the Overview tab makes; everything else about these modules is real.
vi.mock('../api/customers', async (importOriginal) => ({
  ...(await importOriginal<typeof CustomersModule>()),
  listCustomers: h.listCustomers,
}));
vi.mock('../api/finance', async (importOriginal) => ({
  ...(await importOriginal<typeof FinanceModule>()),
  getFinanceRevenueReport: h.getFinanceRevenueReport,
}));
vi.mock('../api/warehouseList', async (importOriginal) => ({
  ...(await importOriginal<typeof WarehouseListModule>()),
  listAllWarehouses: h.listAllWarehouses,
}));
vi.mock('../api/audits', async (importOriginal) => ({
  ...(await importOriginal<typeof AuditsModule>()),
  getAuditCompliance: h.getAuditCompliance,
}));

// Every destination the shell can mount: stubbed. This tests the Overview tab only.
vi.mock('../screens/dashboard/AdminProfileScreen', () => ({ AdminProfileScreen: h.stub('AdminProfileScreen') }));
vi.mock('../screens/warehouse/notifications/NotificationsFlow', () => ({ NotificationsFlow: h.stub('NotificationsFlow') }));
vi.mock('../screens/pricing/PricingFlow', () => ({ PricingFlow: h.stub('PricingFlow') }));
vi.mock('../screens/farmers/FarmersFlow', () => ({ FarmersFlow: h.stub('FarmersFlow') }));
vi.mock('../screens/sales', () => ({
  SalesChannelOverviewScreen: h.stub('SalesChannelOverviewScreen'),
  SalesOnlineOrdersScreen: h.stub('SalesOnlineOrdersScreen'),
  SalesMarketDayScreen: h.stub('SalesMarketDayScreen'),
  SalesHorecaOrdersScreen: h.stub('SalesHorecaOrdersScreen'),
  SalesB2BOrdersScreen: h.stub('SalesB2BOrdersScreen'),
  SalesFulfillmentAssignmentScreen: h.stub('SalesFulfillmentAssignmentScreen'),
  SalesInvoiceScreen: h.stub('SalesInvoiceScreen'),
  SalesReturnsRefundsScreen: h.stub('SalesReturnsRefundsScreen'),
}));
vi.mock('../screens/config', () => ({
  SystemConfigScreen: h.stub('SystemConfigScreen'),
  EditChannelAllocationScreen: h.stub('EditChannelAllocationScreen'),
  IntegrationDetailScreen: h.stub('IntegrationDetailScreen'),
  CompanyDetailsScreen: h.stub('CompanyDetailsScreen'),
  SystemAuditLogsScreen: h.stub('SystemAuditLogsScreen'),
}));
vi.mock('../screens/dashboard/CreateAdminAccountScreen', () => ({ CreateAdminAccountScreen: h.stub('CreateAdminAccountScreen') }));
vi.mock('../screens/dashboard/ManageAdminsScreen', () => ({ ManageAdminsScreen: h.stub('ManageAdminsScreen') }));
vi.mock('../screens/dashboard/AdminDetailProfileScreen', () => ({ AdminDetailProfileScreen: h.stub('AdminDetailProfileScreen') }));
vi.mock('../screens/dashboard/AdminPermissionsMatrixScreen', () => ({ AdminPermissionsMatrixScreen: h.stub('AdminPermissionsMatrixScreen') }));
vi.mock('../screens/dashboard/AdminActivityLogsScreen', () => ({ AdminActivityLogsScreen: h.stub('AdminActivityLogsScreen') }));
vi.mock('../screens/dashboard/AdminRequestsApprovalScreen', () => ({ AdminRequestsApprovalScreen: h.stub('AdminRequestsApprovalScreen') }));
vi.mock('../screens/reports', () => ({
  AdminReportsMainScreen: h.stub('AdminReportsMainScreen'),
  AnalyticsDashboardScreen: h.stub('AnalyticsDashboardScreen'),
  FarmerPerformanceReportScreen: h.stub('FarmerPerformanceReportScreen'),
  WarehouseOpsReportScreen: h.stub('WarehouseOpsReportScreen'),
  ReportBuilderScreen: h.stub('ReportBuilderScreen'),
  SystemAlertsScreen: h.stub('SystemAlertsScreen'),
  AnnouncementsScreen: h.stub('AnnouncementsScreen'),
  AllRecentReportsScreen: h.stub('AllRecentReportsScreen'),
}));
vi.mock('../screens/finance', () => ({ PLStatementScreen: h.stub('PLStatementScreen') }));
vi.mock('../screens/produce', () => ({ ProduceControlFlow: h.stub('ProduceControlFlow') }));
vi.mock('../screens/purchase-orders/PurchaseOrdersFlow', () => ({ PurchaseOrdersFlow: h.stub('PurchaseOrdersFlow') }));
vi.mock('../screens/customers-management', () => ({
  CustomersManagementFlow: h.stub('CustomersManagementFlow'),
  CustomersManagementScreen: h.stub('CustomersManagementScreen'),
}));
vi.mock('../screens/warehouse/customers/CustomersFlow', () => ({ CustomersFlow: h.stub('CustomersFlow') }));
vi.mock('../screens/warehouse/inventory/InventoryFlow', () => ({ InventoryFlow: h.stub('InventoryFlow') }));
vi.mock('../screens/warehouse/orders/OrdersFlow', () => ({ OrdersFlow: h.stub('OrdersFlow') }));
vi.mock('../screens/warehouse/staff-attendance/StaffFlow', () => ({ StaffFlow: h.stub('StaffFlow') }));

import { SuperAdminDashboardScreen } from '../screens/dashboard/SuperAdminDashboardScreen';
import { greetingNameText, warehousesActiveText } from '../screens/dashboard/superAdminHomeFigures';
import { ADMIN_NO_VALUE } from '../utils/noValue';
import { en, t } from '../i18n';

/** Codes the Overview tab's four wired reads are gated on. */
const HOME_GRANTS = ['customer.list.view', 'finance.sales_income.view', 'warehouse.all.view', 'audit.view'];

/** The literals the screen used to invent. None of them may ever render again. */
const FABRICATIONS = ['Rajesh Kumar', '1,284', '6,502', '18.4L', '3 payouts', '2 Sub Warehouse'];

function textOf(node: unknown): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('\n');
  const json = node as { children?: unknown };
  return textOf(json.children);
}

const allText = (tree: renderer.ReactTestRenderer): string => textOf(tree.toJSON());

async function flush() {
  for (let i = 0; i < 6; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }
}

async function mount(props: Partial<React.ComponentProps<typeof SuperAdminDashboardScreen>> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(
      <QueryClientProvider client={client}>
        <SuperAdminDashboardScreen onSignOut={() => undefined} {...props} />
      </QueryClientProvider>,
    );
  });
  await flush();
  return tree;
}

function signedIn(fullName: string, permissions: readonly string[] = HOME_GRANTS) {
  h.fetchMe.mockResolvedValue({ id: 'u1', fullName, roles: [{ code: 'SUPER_ADMIN' }], permissions });
}

beforeEach(() => {
  signedIn('Super Administrator');
  h.listCustomers.mockResolvedValue({ items: [], page: { nextCursor: null, hasMore: false }, summary: { total: 42, active: 40, new: 2 } });
  h.getFinanceRevenueReport.mockResolvedValue({
    from: '2026-11-01',
    to: '2026-11-17',
    summary: { count: 7, total: '1250.50' },
    byDay: [],
    byChannel: [],
    byPaymentMethod: [],
  });
  h.listAllWarehouses.mockResolvedValue([
    { id: 'w1', isActive: true },
    { id: 'w2', isActive: true },
    { id: 'w3', isActive: true },
    { id: 'w4', isActive: false },
  ]);
  h.getAuditCompliance.mockResolvedValue({
    fiscalYear: '2026-27',
    isFiscalYearClosed: false,
    currentQuarter: 3,
    currentQuarterEndsOn: '2026-12-31',
    asOf: '2026-11-17',
    counts: { farmersWithoutCurrentQuarterAudit: 9, overdueAudits: 11 },
    farmers: [],
    page: { nextCursor: null, hasMore: false },
  });
});
afterEach(() => vi.clearAllMocks());

/** Every label the design draws on the Overview tab; all must render in every state. */
const CARD_LABELS = [
  'saShell.home.kpi.farmers',
  'saShell.home.kpi.customers',
  'saShell.home.kpi.revenue',
  'saShell.home.kpi.warehouses',
  'saShell.home.approvals.payouts.title',
  'saShell.home.approvals.admins.title',
  'saShell.home.section.overview',
  'saShell.home.section.approvals',
  'saShell.home.section.compliance',
  'saShell.home.section.quickActions',
] as const;

describe('Super Admin home: the greeting shows the server name, never a person', () => {
  it("shows 'Super Administrator' when that is what /auth/me returned", async () => {
    const tree = await mount();
    const text = allText(tree);
    expect(text).toContain('Super Administrator');
    expect(text).not.toContain('Rajesh Kumar');
  });

  it("shows a real admin's own name", async () => {
    signedIn('Meena Krishnan');
    const tree = await mount();
    expect(allText(tree)).toContain('Meena Krishnan');
  });

  it('shows the loading state, not a placeholder person, before /auth/me answers', async () => {
    h.fetchMe.mockReturnValue(new Promise(() => undefined));
    const tree = await mount();
    const text = allText(tree);
    expect(text).toContain(t('async.loading'));
    for (const fake of FABRICATIONS) expect(text).not.toContain(fake);
  });

  it('shows the dash, not a name, when /auth/me fails', async () => {
    h.fetchMe.mockRejectedValue(new Error('offline'));
    const tree = await mount();
    const text = allText(tree);
    expect(text).not.toContain('Rajesh Kumar');
    expect(text).toContain(ADMIN_NO_VALUE);
  });

  it('greetingNameText never substitutes a name', () => {
    expect(greetingNameText('Super Administrator', 'ready')).toBe('Super Administrator');
    expect(greetingNameText('Meena Krishnan', 'ready')).toBe('Meena Krishnan');
    expect(greetingNameText(undefined, 'loading')).toBe(t('async.loading'));
    expect(greetingNameText(undefined, 'error')).toBe(ADMIN_NO_VALUE);
    expect(greetingNameText('', 'ready')).toBe(ADMIN_NO_VALUE);
    expect(greetingNameText(null, 'ready')).toBe(ADMIN_NO_VALUE);
  });
});

describe('Super Admin home: a figure with an endpoint shows the server value', () => {
  it('Total Customers comes from GET /admin/customers summary.total, not a page of rows', async () => {
    const tree = await mount();
    expect(allText(tree)).toContain('42');
    expect(h.listCustomers).toHaveBeenCalledWith({ limit: 1 }, expect.anything());
  });

  it('Revenue (MTD) comes from the revenue report, formatted through integer paise', async () => {
    const tree = await mount();
    expect(allText(tree)).toContain('₹1,250.50');
    const [params] = h.getFinanceRevenueReport.mock.calls[0] as [{ from: string; to: string }];
    expect(params.from).toMatch(/^\d{4}-\d{2}-01$/);
    expect(params.to.slice(0, 7)).toBe(params.from.slice(0, 7));
  });

  it('Warehouses Active counts the active rows of GET /warehouses', async () => {
    const tree = await mount();
    expect(allText(tree)).toContain('3 / 4');
  });

  it('warehousesActiveText dashes an unknown list instead of guessing', () => {
    expect(warehousesActiveText(undefined)).toBe(ADMIN_NO_VALUE);
    expect(warehousesActiveText([])).toBe('0 / 0');
    expect(warehousesActiveText([{ isActive: true }, { isActive: false }])).toBe('1 / 2');
  });

  it('the overdue-audit alert counts farmers without a current-quarter audit', async () => {
    const tree = await mount();
    expect(allText(tree)).toContain(t('saShell.home.compliance.audits.title', { count: '9' }));
  });
});

describe('Super Admin home: a figure with no endpoint is the dash, never a number', () => {
  it('Total Farmers is the dash (no farmer-count endpoint) and its card still renders', async () => {
    const tree = await mount();
    const text = allText(tree);
    expect(text).toContain(t('saShell.home.kpi.farmers'));
    expect(text).not.toMatch(/1,284|1284/);
  });

  it('payouts awaiting sign-off and admin accounts pending are both the dash', async () => {
    const tree = await mount();
    const text = allText(tree);
    expect(text).toContain(t('saShell.home.approvals.payouts.subtitle', { count: ADMIN_NO_VALUE }));
    expect(text).toContain(t('saShell.home.approvals.admins.subtitle', { count: ADMIN_NO_VALUE }));
  });

  it('certifications expiring is the dash (no expiry-count endpoint)', async () => {
    const tree = await mount();
    expect(allText(tree)).toContain(t('saShell.home.compliance.certifications.title', { count: ADMIN_NO_VALUE }));
  });

  it('no delta/trend line is invented: every one is the dash', async () => {
    const tree = await mount();
    const text = allText(tree);
    expect(text).not.toContain('+18 this month');
    expect(text).not.toContain('+142 this month');
    expect(text).not.toContain('+6.2%');
    expect(text).not.toContain('All operational');
  });
});

describe('Super Admin home: loading, failure and permission states keep every card', () => {
  it('renders every card and section while the reads are still in flight', async () => {
    for (const fn of [h.listCustomers, h.getFinanceRevenueReport, h.listAllWarehouses, h.getAuditCompliance]) {
      fn.mockReturnValue(new Promise(() => undefined));
    }
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <QueryClientProvider client={client}>
          <SuperAdminDashboardScreen onSignOut={() => undefined} />
        </QueryClientProvider>,
      );
    });
    const text = allText(tree);
    for (const key of CARD_LABELS) expect(text).toContain(t(key));
    for (const fake of FABRICATIONS) expect(text).not.toContain(fake);
  });

  it('a failed read shows the dash, not a number, and keeps the card', async () => {
    for (const fn of [h.listCustomers, h.getFinanceRevenueReport, h.listAllWarehouses, h.getAuditCompliance]) {
      fn.mockRejectedValue(new Error('upstream down'));
    }
    const tree = await mount();
    const text = allText(tree);
    for (const key of CARD_LABELS) expect(text).toContain(t(key));
    expect(text).toContain(ADMIN_NO_VALUE);
    expect(text).not.toContain('₹1,250.50');
    expect(text).not.toContain('3 / 4');
    for (const fake of FABRICATIONS) expect(text).not.toContain(fake);
  });

  it('an admin without the codes fires no request and sees the dash, not a number', async () => {
    signedIn('Super Administrator', []);
    const tree = await mount();
    expect(h.listCustomers).not.toHaveBeenCalled();
    expect(h.getFinanceRevenueReport).not.toHaveBeenCalled();
    expect(h.listAllWarehouses).not.toHaveBeenCalled();
    expect(h.getAuditCompliance).not.toHaveBeenCalled();
    const text = allText(tree);
    for (const key of CARD_LABELS) expect(text).toContain(t(key));
    expect(text).not.toContain('42');
    expect(text).not.toContain('₹1,250.50');
  });

  it('one failed read does not dash the figures that loaded', async () => {
    h.getFinanceRevenueReport.mockRejectedValue(new Error('finance down'));
    const tree = await mount();
    const text = allText(tree);
    expect(text).toContain('3 / 4');
    expect(text).toContain('42');
    expect(text).not.toContain('₹18.4L');
  });
});

describe('Super Admin home: source guard', () => {
  const FILES = [
    path.resolve(__dirname, '../screens/dashboard/SuperAdminDashboardScreen.tsx'),
    path.resolve(__dirname, '../screens/dashboard/superAdminHomeFigures.ts'),
    path.resolve(__dirname, '../i18n/saShell.en.json'),
  ];

  it.each(FILES)('%s carries none of the invented figures', (file) => {
    const src = fs.readFileSync(file, 'utf8');
    for (const fake of FABRICATIONS) expect(src).not.toContain(fake);
    expect(src).not.toContain('₹18.4L');
    expect(src).not.toContain('↑ +');
  });

  it('the Overview tab never compares a role string', () => {
    const src = fs.readFileSync(FILES[0]!, 'utf8');
    expect(src).not.toMatch(/user\?\.\s*roles|roleCode\s*===|=== 'SUPER_ADMIN'/);
  });

  it('every saShell.home key the screen uses has an English string', () => {
    const missing: string[] = [];
    for (const file of FILES.slice(0, 2)) {
      const src = fs.readFileSync(file, 'utf8');
      for (const m of src.matchAll(/'(saShell\.[A-Za-z0-9_.]+)'/g)) {
        if (!(m[1]! in en)) missing.push(m[1]!);
      }
    }
    expect(missing).toEqual([]);
  });
});
