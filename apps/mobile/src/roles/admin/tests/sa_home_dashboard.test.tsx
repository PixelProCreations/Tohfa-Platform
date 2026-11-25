/**
 * Super Admin shell, Overview (Home) tab (screens/dashboard/SuperAdminDashboardScreen.tsx):
 * the greeting and every figure on it, for the CURRENT design (origin/Superadmin-main:
 * the 8-card "Platform KPIs" grid, Market Control, Quick Access, Work Queue, Approval
 * Inbox, Recent Activity).
 *
 * Rewritten 2026-11-25 (W6). The 2026-11-19 version tested an older layout (Revenue
 * MTD, Warehouses Active "3 / 4", approvals and compliance cards, `saShell.home.*`)
 * that the design replaced. Every honesty guarantee it encoded is kept here:
 *
 *   - the greeting shows what /auth/me returned, ALWAYS, and never a person;
 *     loading shows the loading text, failure shows the dash;
 *   - a card with an endpoint shows the server's value (a real 0 is "0");
 *   - a card with no endpoint shows ADMIN_NO_VALUE, and the card still renders;
 *   - one page of a list is never shown as a total;
 *   - loading, failure and missing permission render every card with the dash,
 *     and a read the role may not make is never fired;
 *   - none of the old fabrications nor the design's 8 literal KPI values render;
 *   - the screen never compares a role string.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type * as CustomersModule from '../api/customers';
import type * as FarmersModule from '../api/farmers';
import type * as ListingsModule from '../api/listings';
import type * as NotificationsModule from '../api/notifications';
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
    getFarmerSummary: vi.fn(),
    listCustomers: vi.fn(),
    listAdminListings: vi.fn(),
    listNotifications: vi.fn(),
    listAudits: vi.fn(),
    getAuditCompliance: vi.fn(),
  };
});

vi.mock('react-native', () => ({
  Alert: { alert: h.alert },
  BackHandler: { addEventListener: vi.fn(() => ({ remove: () => undefined })) },
  Platform: { OS: 'android', select: (o: Record<string, unknown>) => o['android'] ?? o['default'] },
  ScrollView: 'ScrollView',
  StyleSheet: { create: (s: Record<string, unknown>) => s, flatten: (s: unknown) => s, absoluteFill: {}, hairlineWidth: 1 },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
  ActivityIndicator: 'ActivityIndicator',
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

// The reads the Home tab may make; everything else about these modules is real.
vi.mock('../api/farmers', async (importOriginal) => ({
  ...(await importOriginal<typeof FarmersModule>()),
  getFarmerSummary: h.getFarmerSummary,
}));
vi.mock('../api/customers', async (importOriginal) => ({
  ...(await importOriginal<typeof CustomersModule>()),
  listCustomers: h.listCustomers,
}));
vi.mock('../api/listings', async (importOriginal) => ({
  ...(await importOriginal<typeof ListingsModule>()),
  listAdminListings: h.listAdminListings,
}));
vi.mock('../api/notifications', async (importOriginal) => ({
  ...(await importOriginal<typeof NotificationsModule>()),
  listNotifications: h.listNotifications,
}));
vi.mock('../api/audits', async (importOriginal) => ({
  ...(await importOriginal<typeof AuditsModule>()),
  listAudits: h.listAudits,
  getAuditCompliance: h.getAuditCompliance,
}));

// Every destination the shell can mount: stubbed. This tests the Home tab only.
vi.mock('../screens/dashboard/AdminProfileScreen', () => ({ AdminProfileScreen: h.stub('AdminProfileScreen') }));
vi.mock('../screens/warehouse/notifications/NotificationsFlow', () => ({ NotificationsFlow: h.stub('NotificationsFlow') }));
vi.mock('../screens/pricing/PricingFlow', () => ({ PricingFlow: h.stub('PricingFlow') }));
vi.mock('../screens/farmers/FarmersFlow', () => ({ FarmersFlow: h.stub('FarmersFlow') }));
vi.mock('../screens/farmers/FarmerManagementFlow', () => ({ FarmerManagementFlow: h.stub('FarmerManagementFlow') }));
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
vi.mock('../screens/finance', () => ({
  FinanceManagementFlow: h.stub('FinanceManagementFlow'),
  PLStatementScreen: h.stub('PLStatementScreen'),
  PayoutProcessingScreen: h.stub('PayoutProcessingScreen'),
  ProfitLossScreen: h.stub('ProfitLossScreen'),
  PaymentMethodsScreen: h.stub('PaymentMethodsScreen'),
}));
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
vi.mock('../screens/audits/AuditManagementFlow', () => ({ AuditManagementFlow: h.stub('AuditManagementFlow') }));

import { SuperAdminDashboardScreen } from '../screens/dashboard/SuperAdminDashboardScreen';
import { OverviewDashboardCard } from '../components/OverviewDashboardCard';
import { greetingNameText, lastUpdatedText, saHomeKpiValues, unreadBadgeText } from '../screens/dashboard/superAdminHomeFigures';
import { tohfaDateStamp } from '../screens/tohfa-home/tohfaHomeLogic';
import { ADMIN_NO_VALUE } from '../utils/noValue';
import { en, t } from '../i18n';

/** Codes the Home tab's wired reads are gated on (docs/rbac.json x-permission of each route). */
const HOME_GRANTS = ['farmer.profile.view_all', 'customer.list.view', 'listing.queue.view_pending', 'notification.own.view'];

/** The literals the old layout invented. None of them may ever render again. */
const FABRICATIONS = ['Rajesh Kumar', '1,284', '6,502', '18.4L', '3 payouts', '2 Sub Warehouse'];

/** The design's literal KPI values (origin/Superadmin-main). None may be shown as a KPI value. */
const DESIGN_LITERALS = ['214', '9', '196', '5', '6', '18', '27'];

/** The design's fixture rows and stamps on the Home tab. */
const HOME_FIXTURES = [
  'PAY-0002',
  'APP-2026-0101',
  'Sathish Kumar',
  'AUD-2026-0052',
  'TR-0015',
  'Demo TOHFA Admin',
  'Demo Main Warehouse Admin',
  'Fair Price ceiling updated',
  'Sub Warehouse Admin account created',
  'Channel Allocation updated',
  'Auto Closes at 11:00 AM',
  'Auto Open at 06:00 AM',
  '13 Oct 2026',
  '10:45 · All details',
];

/** The 8 KPI card titles of the current design, in order. */
const KPI_TITLES = [
  'superAdminDashboard.kpi.totalFarmers',
  'superAdminDashboard.kpi.pendingApplications',
  'superAdminDashboard.kpi.activeFarmers',
  'superAdminDashboard.kpi.deactivatedFarmers',
  'superAdminDashboard.kpi.pendingListings',
  'superAdminDashboard.kpi.activeAudits',
  'superAdminDashboard.kpi.totalCustomers',
  'superAdminDashboard.kpi.staffAndAdmins',
] as const;

/** Every section the design draws on the Home tab; all must render in every state. */
const SECTION_LABELS = [
  'superAdminDashboard.market.title',
  'superAdminDashboard.market.upcoming',
  'superAdminDashboard.section.quickAccess',
  'superAdminDashboard.section.workQueue',
  'superAdminDashboard.section.approvalInbox',
  'superAdminDashboard.section.recentActivity',
] as const;

function textOf(node: unknown): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('\n');
  const json = node as { children?: unknown };
  return textOf(json.children);
}

const allText = (tree: renderer.ReactTestRenderer): string => textOf(tree.toJSON());

/** title -> value of every KPI card on screen. */
function kpis(tree: renderer.ReactTestRenderer): Record<string, string> {
  const out: Record<string, string> = {};
  for (const card of tree.root.findAllByType(OverviewDashboardCard)) {
    out[String(card.props.title)] = String(card.props.value);
  }
  return out;
}

const kpi = (tree: renderer.ReactTestRenderer, key: (typeof KPI_TITLES)[number]) => kpis(tree)[t(key)];

async function flush() {
  for (let i = 0; i < 8; i += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }
}

async function mount(opts: { settle?: boolean } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(
      <QueryClientProvider client={client}>
        <SuperAdminDashboardScreen onSignOut={() => undefined} />
      </QueryClientProvider>,
    );
  });
  if (opts.settle !== false) await flush();
  return tree;
}

function signedIn(fullName: string, permissions: readonly string[] = HOME_GRANTS) {
  h.fetchMe.mockResolvedValue({ id: 'u1', fullName, roles: [{ code: 'SUPER_ADMIN' }], permissions });
}

function listingDto(id: string, farmerName: string) {
  return {
    id,
    cropId: 'c1',
    cropName: 'Carrot',
    grade: 'GRADE_1',
    quantityKg: '40',
    askingPricePerKg: '30.00',
    status: 'PENDING_APPROVAL',
    createdAt: '2026-11-20T04:00:00.000Z',
    farmerName,
  };
}

const READS = () => [h.getFarmerSummary, h.listCustomers, h.listAdminListings, h.listNotifications];

beforeEach(() => {
  signedIn('Super Administrator');
  h.getFarmerSummary.mockResolvedValue({
    totalFarmers: 3,
    pendingApplications: 1,
    activeFarmers: 2,
    deactivatedFarmers: 0,
    inactiveFarmers: 1,
    expiredCertifications: 0,
    activeSubscriptions: 0,
    approvalInbox: 0,
    zones: [],
  });
  // One row on the page, 42 in the visible set: the card must say 42.
  h.listCustomers.mockResolvedValue({
    items: [{ id: 'c1' }],
    page: { nextCursor: 'next', hasMore: true },
    summary: { total: 42, active: 40, new: 2 },
  });
  h.listAdminListings.mockResolvedValue({
    items: [listingDto('l1', 'Anitha'), listingDto('l2', 'Babu')],
    page: { nextCursor: null, hasMore: false },
  });
  h.listNotifications.mockResolvedValue({ items: [], page: { nextCursor: null, hasMore: false }, unreadCount: 7 });
});
afterEach(() => vi.clearAllMocks());

describe('Super Admin home: the greeting shows the server name, never a person', () => {
  it("shows 'Super Administrator' when that is what /auth/me returned", async () => {
    const tree = await mount();
    const text = allText(tree);
    expect(text).toContain(t('homeDashboards.sa.greeting', { name: 'Super Administrator' }));
    expect(text).not.toContain('Rajesh Kumar');
  });

  it("shows a real admin's own name", async () => {
    signedIn('Meena Krishnan');
    const tree = await mount();
    expect(allText(tree)).toContain(t('homeDashboards.sa.greeting', { name: 'Meena Krishnan' }));
  });

  it('shows the loading state, not a placeholder person, before /auth/me answers', async () => {
    h.fetchMe.mockReturnValue(new Promise(() => undefined));
    const tree = await mount();
    const text = allText(tree);
    expect(text).toContain(t('homeDashboards.sa.greeting', { name: t('async.loading') }));
    expect(text).not.toContain(t('homeDashboards.sa.greeting', { name: 'Super Admin' }));
    for (const fake of FABRICATIONS) expect(text).not.toContain(fake);
  });

  it('shows the dash, not a name, when /auth/me fails', async () => {
    h.fetchMe.mockRejectedValue(new Error('offline'));
    const tree = await mount();
    const text = allText(tree);
    expect(text).not.toContain('Rajesh Kumar');
    expect(text).toContain(t('homeDashboards.sa.greeting', { name: ADMIN_NO_VALUE }));
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

describe('Super Admin home: a card with an endpoint shows the server value', () => {
  it('the four farmer cards come from GET /admin/farmers/summary, and a real 0 is 0', async () => {
    const tree = await mount();
    expect(kpi(tree, 'superAdminDashboard.kpi.totalFarmers')).toBe('3');
    expect(kpi(tree, 'superAdminDashboard.kpi.pendingApplications')).toBe('1');
    expect(kpi(tree, 'superAdminDashboard.kpi.activeFarmers')).toBe('2');
    expect(kpi(tree, 'superAdminDashboard.kpi.deactivatedFarmers')).toBe('0');
    expect(h.getFarmerSummary).toHaveBeenCalledTimes(1);
  });

  it('Total Customers comes from GET /admin/customers summary.total, not a page of rows', async () => {
    const tree = await mount();
    expect(kpi(tree, 'superAdminDashboard.kpi.totalCustomers')).toBe('42');
    expect(h.listCustomers).toHaveBeenCalledWith({ limit: 1 }, expect.anything());
  });

  it('Pending Listings counts the PENDING_APPROVAL queue when the whole queue is loaded', async () => {
    const tree = await mount();
    expect(kpi(tree, 'superAdminDashboard.kpi.pendingListings')).toBe('2');
    const [params] = h.listAdminListings.mock.calls[0] as [{ status: string }];
    expect(params.status).toBe('PENDING_APPROVAL');
  });

  it('Pending Listings is the dash when more pages exist: one page is not a total', async () => {
    h.listAdminListings.mockResolvedValue({
      items: [listingDto('l1', 'Anitha'), listingDto('l2', 'Babu')],
      page: { nextCursor: 'c2', hasMore: true },
    });
    const tree = await mount();
    expect(kpi(tree, 'superAdminDashboard.kpi.pendingListings')).toBe(ADMIN_NO_VALUE);
  });

  it('the bell shows the server unread total, not a fixed number', async () => {
    const tree = await mount();
    const bell = tree.root.find((n) => n.props.accessibilityLabel === 'Notifications' && typeof n.type === 'string');
    const badge = bell.findAll((n) => (n.type as unknown) === 'Text').map((n) => textOf(n.children)).join('');
    expect(badge).toBe('7');
  });

  it('the bell has no badge when nothing is unread', async () => {
    h.listNotifications.mockResolvedValue({ items: [], page: { nextCursor: null, hasMore: false }, unreadCount: 0 });
    const tree = await mount();
    const bell = tree.root.find((n) => n.props.accessibilityLabel === 'Notifications' && typeof n.type === 'string');
    expect(bell.findAll((n) => (n.type as unknown) === 'Text')).toHaveLength(0);
  });

  it('unreadBadgeText is the count above zero, otherwise no badge', () => {
    expect(unreadBadgeText(7)).toBe('7');
    expect(unreadBadgeText(0)).toBeNull();
    expect(unreadBadgeText(undefined)).toBeNull();
  });

  it('the date stamps are today (IST), never the design date', async () => {
    const tree = await mount();
    const text = allText(tree);
    expect(text).toContain(tohfaDateStamp(new Date()));
    expect(text).not.toContain('Mon, 13 Oct 2026');
  });

  it('"Last updated" is the time the reads succeeded, and the dash before any did', async () => {
    const tree = await mount();
    const text = allText(tree);
    expect(text).not.toContain('10:45 · All details');
    expect(text).not.toContain(t('homeDashboards.sa.lastUpdated', { time: ADMIN_NO_VALUE }));
    expect(lastUpdatedText([])).toBe(t('homeDashboards.sa.lastUpdated', { time: ADMIN_NO_VALUE }));
    expect(lastUpdatedText([0, 0])).toBe(t('homeDashboards.sa.lastUpdated', { time: ADMIN_NO_VALUE }));
  });
});

describe('Super Admin home: a card with no endpoint is the dash, never a number', () => {
  it('Active Audits is the dash (meaning not decided), fires no audit read, and its card still renders', async () => {
    const tree = await mount();
    expect(kpi(tree, 'superAdminDashboard.kpi.activeAudits')).toBe(ADMIN_NO_VALUE);
    expect(h.listAudits).not.toHaveBeenCalled();
    expect(h.getAuditCompliance).not.toHaveBeenCalled();
  });

  it('Staff & Admins is the dash (no admin list endpoint) and its card still renders', async () => {
    const tree = await mount();
    expect(kpi(tree, 'superAdminDashboard.kpi.staffAndAdmins')).toBe(ADMIN_NO_VALUE);
  });

  it("no KPI shows one of the design's literal values", async () => {
    const tree = await mount();
    for (const value of Object.values(kpis(tree))) expect(DESIGN_LITERALS).not.toContain(value);
  });

  it('saHomeKpiValues dashes every unknown source', () => {
    const values = saHomeKpiValues({ farmerSummary: undefined, customerTotal: undefined, pendingListings: null });
    for (const value of Object.values(values)) expect(value).toBe(ADMIN_NO_VALUE);
  });

  it('market status has no source: dash, not "open"; Close Market is disabled; no fixture schedules', async () => {
    const tree = await mount();
    const text = allText(tree);
    expect(text).not.toContain(t('superAdminDashboard.market.statusOpen'));
    expect(text).not.toContain(t('superAdminDashboard.market.statusClosed'));
    expect(text).toContain(t('homeDashboards.sa.market.noSource'));
    const close = tree.root.find(
      (n) =>
        (n.type as unknown) === 'TouchableOpacity' &&
        n.findAll((c) => (c.type as unknown) === 'Text').some((c) => textOf(c.children) === t('superAdminDashboard.market.close')),
    );
    expect(close.props.disabled).toBe(true);
  });

  it('no fixture rows, names or stamps render on the Home tab', async () => {
    const tree = await mount();
    const text = allText(tree);
    for (const fake of HOME_FIXTURES) expect(text).not.toContain(fake);
    expect(text).toContain(t('homeDashboards.sa.workQueue.notLoaded'));
    expect(text).toContain(t('homeDashboards.sa.approvalInbox.notLoaded'));
    expect(text).toContain(t('homeDashboards.sa.activity.notLoaded'));
  });

  it('no delta/trend line is invented', async () => {
    const tree = await mount();
    const text = allText(tree);
    expect(text).not.toContain('+18 this month');
    expect(text).not.toContain('+142 this month');
    expect(text).not.toContain('+6.2%');
    expect(text).not.toContain('All operational');
  });
});

describe('Super Admin home: loading, failure and permission states keep every card', () => {
  it('renders every card and section while the reads are still in flight, all dashed', async () => {
    for (const fn of READS()) fn.mockReturnValue(new Promise(() => undefined));
    const tree = await mount({ settle: false });
    await flush();
    const text = allText(tree);
    for (const key of SECTION_LABELS) expect(text).toContain(t(key));
    const values = kpis(tree);
    for (const key of KPI_TITLES) expect(values[t(key)]).toBe(ADMIN_NO_VALUE);
    for (const fake of FABRICATIONS) expect(text).not.toContain(fake);
  });

  it('a failed read shows the dash, not a number, and keeps the card', async () => {
    for (const fn of READS()) fn.mockRejectedValue(new Error('upstream down'));
    const tree = await mount();
    const text = allText(tree);
    for (const key of SECTION_LABELS) expect(text).toContain(t(key));
    const values = kpis(tree);
    for (const key of KPI_TITLES) expect(values[t(key)]).toBe(ADMIN_NO_VALUE);
    expect(text).toContain(t('homeDashboards.sa.lastUpdated', { time: ADMIN_NO_VALUE }));
    for (const fake of FABRICATIONS) expect(text).not.toContain(fake);
  });

  it('an admin without the codes fires no request and sees the dash, not a number', async () => {
    signedIn('Super Administrator', []);
    const tree = await mount();
    for (const fn of READS()) expect(fn).not.toHaveBeenCalled();
    const values = kpis(tree);
    expect(Object.keys(values)).toHaveLength(8);
    for (const key of KPI_TITLES) expect(values[t(key)]).toBe(ADMIN_NO_VALUE);
    expect(allText(tree)).not.toContain('42');
  });

  it('one failed read does not dash the figures that loaded', async () => {
    h.getFarmerSummary.mockRejectedValue(new Error('farmers down'));
    const tree = await mount();
    expect(kpi(tree, 'superAdminDashboard.kpi.totalFarmers')).toBe(ADMIN_NO_VALUE);
    expect(kpi(tree, 'superAdminDashboard.kpi.totalCustomers')).toBe('42');
    expect(kpi(tree, 'superAdminDashboard.kpi.pendingListings')).toBe('2');
  });
});

describe('Super Admin home: source guard', () => {
  const SCREEN = path.resolve(__dirname, '../screens/dashboard/SuperAdminDashboardScreen.tsx');
  const FILES = [
    SCREEN,
    path.resolve(__dirname, '../screens/dashboard/superAdminHomeFigures.ts'),
    path.resolve(__dirname, '../i18n/homeDashboards.en.json'),
  ];

  it.each(FILES)('%s carries none of the invented figures', (file) => {
    const src = fs.readFileSync(file, 'utf8');
    for (const fake of FABRICATIONS) expect(src).not.toContain(fake);
    expect(src).not.toContain('₹18.4L');
    expect(src).not.toContain('↑ +');
  });

  it('the KPI grid carries no literal value, and the home no fixture row', () => {
    const src = fs.readFileSync(SCREEN, 'utf8');
    expect(src).not.toMatch(/value:\s*'\d+'/);
    for (const fake of HOME_FIXTURES) expect(src).not.toContain(fake);
    expect(src).not.toContain("useState('10:45");
    expect(src).not.toContain('useState(true)');
  });

  it('the screen never compares a role string', () => {
    const src = fs.readFileSync(SCREEN, 'utf8');
    expect(src).not.toMatch(/user\?\.\s*roles|roleCode\s*===|=== 'SUPER_ADMIN'/);
  });

  it('the figures file never invents a value', () => {
    const src = fs.readFileSync(FILES[1]!, 'utf8');
    expect(src).not.toMatch(/\?\?\s*0\b|\?\?\s*'[^']*'|\|\|\s*'[^']+'/);
    expect(src).not.toContain("'—'");
  });

  it('every homeDashboards key the home uses has an English string', () => {
    const missing: string[] = [];
    for (const file of FILES.slice(0, 2)) {
      const src = fs.readFileSync(file, 'utf8');
      for (const m of src.matchAll(/'(homeDashboards\.[A-Za-z0-9_.]+)'/g)) {
        if (!(m[1]! in en)) missing.push(m[1]!);
      }
    }
    expect(missing).toEqual([]);
  });
});
