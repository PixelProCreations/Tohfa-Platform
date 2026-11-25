/**
 * Super Admin shell (screens/dashboard/SuperAdminDashboardScreen.tsx): the
 * Menu tab.
 *
 * The design (origin/Superadmin-main) ends the bottom bar with Menu, and
 * without it roughly ten already-built admin modules have no way in from this
 * shell. The tab mounts the SHARED AdminMoreMenuScreen (screens/more) — the
 * same component the Tohfa and Farmer Admin shells mount — not the design's
 * 598-line hardcoded copy, so the rows are gated by docs/rbac.json codes
 * through the signed-in admin's own `can` and labelled from the i18n
 * catalogue.
 *
 * AdminMoreMenuScreen is rendered for real here (its gating is the point);
 * every destination screen is stubbed, because this tests the host's wiring —
 * which row opens which flow — not the screens themselves.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const h = vi.hoisted(() => {
  const stub = (name: string) => {
    const C = (_props: Record<string, unknown>) => null;
    C.displayName = name;
    return C;
  };
  return { stub, fetchMe: vi.fn(), alert: vi.fn() };
});

vi.mock('react-native', () => ({
  Alert: { alert: h.alert },
  BackHandler: { addEventListener: vi.fn(() => ({ remove: () => undefined })) },
  Modal: 'Modal',
  Platform: { OS: 'android', select: (o: Record<string, unknown>) => o['android'] ?? o['default'] },
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  StatusBar: 'StatusBar',
  StyleSheet: { create: (s: Record<string, unknown>) => s, flatten: (s: unknown) => s, absoluteFill: {} },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));
vi.mock('react-native-svg', () => ({
  default: 'Svg',
  Svg: 'Svg',
  Circle: 'Circle',
  Defs: 'Defs',
  Ellipse: 'Ellipse',
  G: 'G',
  Line: 'Line',
  LinearGradient: 'LinearGradient',
  Path: 'Path',
  Polygon: 'Polygon',
  Polyline: 'Polyline',
  Rect: 'Rect',
  Stop: 'Stop',
  Text: 'Text',
}));
vi.mock('@tohfa/mobile-ui', () => ({ ScreenStatusBar: 'ScreenStatusBar', SafeAreaView: 'SafeAreaView' }));
vi.mock('../../farmer/api/auth', () => ({
  fetchMe: h.fetchMe,
  getPrimaryAdminRole: (roles: Array<{ code: string }>) => roles[0]?.code ?? null,
}));

// Every destination the shell can mount: stubbed.
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
vi.mock('../screens/audits/AuditManagementFlow', () => ({ AuditManagementFlow: h.stub('AuditManagementFlow') }));

import { SuperAdminDashboardScreen } from '../screens/dashboard/SuperAdminDashboardScreen';
import { AdminProfileScreen } from '../screens/dashboard/AdminProfileScreen';
import { NotificationsFlow } from '../screens/warehouse/notifications/NotificationsFlow';
import { PricingFlow } from '../screens/pricing/PricingFlow';
import { FarmersFlow } from '../screens/farmers/FarmersFlow';
import { AdminReportsMainScreen } from '../screens/reports';
import { ProduceControlFlow } from '../screens/produce';
import { PurchaseOrdersFlow } from '../screens/purchase-orders/PurchaseOrdersFlow';
import { CustomersManagementFlow } from '../screens/customers-management';
import { CustomersFlow } from '../screens/warehouse/customers/CustomersFlow';
import { InventoryFlow } from '../screens/warehouse/inventory/InventoryFlow';
import { OrdersFlow } from '../screens/warehouse/orders/OrdersFlow';
import { StaffFlow } from '../screens/warehouse/staff-attendance/StaffFlow';
import { AuditManagementFlow } from '../screens/audits/AuditManagementFlow';
import { t } from '../i18n';

/**
 * What the test's Super Admin holds. Deliberately NOT granted:
 * produce.calendar.view_consolidated, purchase.order.view,
 * inputs.catalog.manage, dispute.farmer.mediate, farmer.learning.view,
 * allocation.dashboard.view, order.list.view_all, admin.staff.list_view —
 * those rows must not render.
 */
const GRANTED = [
  'farmer.profile.view_all',
  'audit.view',
  'pricing.fair_price.view',
  'customer.list.view',
  'report.export.file',
  'notification.own.view',
];

type Stub = (props: Record<string, unknown>) => null;

beforeEach(() => {
  h.fetchMe.mockResolvedValue({
    id: 'u1',
    fullName: 'Test Super Admin',
    roles: [{ code: 'SUPER_ADMIN' }],
    permissions: GRANTED,
  });
});
afterEach(() => vi.clearAllMocks());

/**
 * The Overview tab reads its figures through useAdminQuery, so the shell needs
 * a QueryClientProvider above it exactly as App.tsx's SessionQueryProvider
 * gives it at runtime. Retries are off so a failed read settles at once.
 */
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
  return tree;
}

/**
 * The rows the narrow GRANTED set deliberately leaves out need their codes to
 * render at all, so the wiring tests below sign in a Super Admin holding
 * everything the menu gates on.
 */
const WIDE = [
  ...GRANTED,
  'produce.calendar.view_consolidated',
  'purchase.order.view',
  'inputs.catalog.manage',
  'dispute.farmer.mediate',
  'farmer.learning.view',
  'allocation.dashboard.view',
  'order.list.view_all',
  'admin.staff.list_view',
];

async function mountWide(props: Partial<React.ComponentProps<typeof SuperAdminDashboardScreen>> = {}) {
  h.fetchMe.mockResolvedValue({
    id: 'u3',
    fullName: 'Wide Super Admin',
    roles: [{ code: 'SUPER_ADMIN' }],
    permissions: WIDE,
  });
  return mount(props);
}

function tabIds(tree: renderer.ReactTestRenderer): string[] {
  return tree.root
    .findAll((n) => typeof n.type === 'string' && String(n.props.testID ?? '').startsWith('saShell.tab.'))
    .map((n) => String(n.props.testID).replace('saShell.tab.', ''));
}

function press(tree: renderer.ReactTestRenderer, testID: string) {
  const node = tree.root.find((n) => typeof n.type === 'string' && n.props.testID === testID);
  act(() => node.props.onPress());
}

function rowIds(tree: renderer.ReactTestRenderer): string[] {
  return tree.root
    .findAll((n) => typeof n.type === 'string' && String(n.props.testID ?? '').startsWith('moreMenu.row.'))
    .map((n) => String(n.props.testID).replace('moreMenu.row.', ''));
}

function has(tree: renderer.ReactTestRenderer, C: unknown): boolean {
  return tree.root.findAllByType(C as Stub).length > 0;
}

describe('Super Admin shell: Menu tab', () => {
  it('ends the bottom bar with Menu, keeping the other tabs', async () => {
    const tree = await mount();
    expect(tabIds(tree)).toEqual(['Overview', 'Farmers', 'Warehouse', 'Finance', 'Menu']);
  });

  it('labels the tab from the catalogue, not a hardcoded string', async () => {
    const tree = await mount();
    const node = tree.root.find((n) => typeof n.type === 'string' && n.props.testID === 'saShell.tab.Menu');
    const labels = node.findAll((n) => (n.type as unknown) === 'Text').map((n) => [n.props.children].flat().join(''));
    expect(labels).toContain(t('superAdminDashboard.tab.menu'));
  });

  it('mounts SuperAdminMoreScreen on the Menu tab', async () => {
    const tree = await mount();
    expect(rowIds(tree)).toEqual([]);
    press(tree, 'saShell.tab.Menu');
    expect(rowIds(tree).length).toBeGreaterThan(0);
    // Its own header with back button
    expect(tree.root.findAll((n) => typeof n.type === 'string' && n.props.testID === 'moreMenu.back').length).toBe(1);
  });

  it('shows only the rows the signed-in admin holds the rbac.json code for', async () => {
    const tree = await mount();
    press(tree, 'saShell.tab.Menu');
    expect(rowIds(tree)).toEqual([
      'audit',
      'market_pricing',
      'customers',
      'notifications',
      'reports',
      'settings',
      'logout',
    ]);
  });

  it('hides a row whose permission the caller lacks', async () => {
    h.fetchMe.mockResolvedValue({
      id: 'u2',
      fullName: 'Narrow Admin',
      roles: [{ code: 'SUPER_ADMIN' }],
      permissions: GRANTED.filter((c) => c !== 'pricing.fair_price.view'),
    });
    const tree = await mount();
    press(tree, 'saShell.tab.Menu');
    expect(rowIds(tree)).not.toContain('market_pricing');
    expect(rowIds(tree)).toContain('audit');
  });

  it('shows nothing but the always-on rows before /auth/me answers (fails closed)', async () => {
    h.fetchMe.mockRejectedValue(new Error('offline'));
    const tree = await mount();
    press(tree, 'saShell.tab.Menu');
    expect(rowIds(tree)).toEqual(['settings', 'logout']);
  });

  describe('row wiring', () => {
    it('Pricing opens the Pricing flow', async () => {
      const tree = await mount();
      press(tree, 'saShell.tab.Menu');
      press(tree, 'moreMenu.row.market_pricing');
      expect(has(tree, PricingFlow)).toBe(true);
    });

    it('Reports opens the reports hub', async () => {
      const tree = await mount();
      press(tree, 'saShell.tab.Menu');
      press(tree, 'moreMenu.row.reports');
      expect(has(tree, AdminReportsMainScreen)).toBe(true);
    });

    it('Notifications opens the notifications flow', async () => {
      const tree = await mount();
      press(tree, 'saShell.tab.Menu');
      press(tree, 'moreMenu.row.notifications');
      expect(has(tree, NotificationsFlow)).toBe(true);
    });

    it('Settings opens the admin profile screen', async () => {
      const tree = await mount();
      press(tree, 'saShell.tab.Menu');
      press(tree, 'moreMenu.row.settings');
      expect(has(tree, AdminProfileScreen)).toBe(true);
    });

    it('Audit opens the AuditManagementFlow', async () => {
      const tree = await mount();
      press(tree, 'saShell.tab.Menu');
      press(tree, 'moreMenu.row.audit');
      expect(has(tree, AuditManagementFlow)).toBe(true);
    });

    it('Produce opens the Produce Control flow', async () => {
      const tree = await mountWide();
      press(tree, 'saShell.tab.Menu');
      press(tree, 'moreMenu.row.produce');
      expect(has(tree, ProduceControlFlow)).toBe(true);
    });

    it('Purchase & Sales opens the Purchase Orders flow', async () => {
      const tree = await mountWide();
      press(tree, 'saShell.tab.Menu');
      press(tree, 'moreMenu.row.purchases');
      expect(has(tree, PurchaseOrdersFlow)).toBe(true);
    });

    // The Customers area has ONE host, CustomersManagementFlow (hub -> directory ->
    // add -> detail). This shell used to hand-roll that wiring: it mounted the bare
    // hub and routed its "Customer Directory" action to the warehouse CustomersFlow,
    // which has no Add Customer button, so Super Admin could not create a customer.
    it('Customers opens the Customers Management flow, not the warehouse customer list', async () => {
      const tree = await mount();
      press(tree, 'saShell.tab.Menu');
      press(tree, 'moreMenu.row.customers');
      expect(has(tree, CustomersManagementFlow)).toBe(true);
      expect(has(tree, CustomersFlow)).toBe(false);

      const flow = tree.root.findByType(CustomersManagementFlow as unknown as Stub);
      expect(typeof flow.props['can']).toBe('function');
    });

    // The all-warehouses scope is the flow's own, so customers_wiring.test.ts
    // pins it where the other customer-source scans live.

    it('Stock Allocation opens the allocation dashboard route of the inventory module', async () => {
      const tree = await mountWide();
      press(tree, 'saShell.tab.Menu');
      press(tree, 'moreMenu.row.allocation');
      expect(has(tree, InventoryFlow)).toBe(true);
      const flow = tree.root.findByType(InventoryFlow as unknown as Stub);
      expect(flow.props['initialScreen']).toBe('M3S07');
      expect((flow.props['scope'] as { warehouseId?: string }).warehouseId).toBeUndefined();
    });

    it('Sales & Orders opens the order module for every warehouse', async () => {
      const tree = await mountWide();
      press(tree, 'saShell.tab.Menu');
      press(tree, 'moreMenu.row.sales_orders');
      expect(has(tree, OrdersFlow)).toBe(true);
      const flow = tree.root.findByType(OrdersFlow as unknown as Stub);
      expect((flow.props['scope'] as { warehouseId?: string }).warehouseId).toBeUndefined();
    });

    it('Staff & Admin Accounts opens the staff module for every warehouse', async () => {
      const tree = await mountWide();
      press(tree, 'saShell.tab.Menu');
      press(tree, 'moreMenu.row.staff');
      expect(has(tree, StaffFlow)).toBe(true);
      const flow = tree.root.findByType(StaffFlow as unknown as Stub);
      expect((flow.props['scope'] as { warehouseId?: string }).warehouseId).toBeUndefined();
    });

    it.each([
      ['allocation', 'allocation.dashboard.view'],
      ['sales_orders', 'order.list.view_all'],
      ['staff', 'admin.staff.list_view'],
    ])('%s does not render without %s', async (row, codeHeld) => {
      h.fetchMe.mockResolvedValue({
        id: 'u4',
        fullName: 'Wide Minus One',
        roles: [{ code: 'SUPER_ADMIN' }],
        permissions: WIDE.filter((c) => c !== codeHeld),
      });
      const tree = await mount();
      press(tree, 'saShell.tab.Menu');
      expect(rowIds(tree)).not.toContain(row);
    });

    it.each(['inputs', 'community'])(
      '%s is still unwired: callback is undefined and triggers no alert',
      async (row) => {
        const tree = await mountWide();
        press(tree, 'saShell.tab.Menu');
        press(tree, `moreMenu.row.${row}`);
        expect(h.alert).not.toHaveBeenCalled();
        expect(rowIds(tree).length).toBeGreaterThan(0);
      },
    );

    it('Logout signs out only after the confirmation', async () => {
      const onSignOut = vi.fn();
      const tree = await mount({ onSignOut });
      press(tree, 'saShell.tab.Menu');
      press(tree, 'moreMenu.row.logout');
      expect(onSignOut).not.toHaveBeenCalled();
      const buttons = h.alert.mock.calls[0]![2] as Array<{ style?: string; onPress?: () => void }>;
      const confirm = buttons.find((b) => b.style === 'destructive');
      act(() => confirm!.onPress!());
      expect(onSignOut).toHaveBeenCalledTimes(1);
    });
  });
});
