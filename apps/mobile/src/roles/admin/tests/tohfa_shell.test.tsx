/**
 * Tohfa Admin shell (screens/dashboard/TohfaAdminDashboardScreen.tsx + screens/tohfa-shell/):
 * the design's bottom tab bar (origin/tofhafarmfin-rbac), Home · Work Queue ·
 * Inventory · Finance · More (owner decision 2026-11-11: Work Queue shown),
 * each tab mounting the screen built for it, and
 * every wired callback opening its real flow with the signed-in admin's own
 * `can` (makeCan of /auth/me permissions) and an all-warehouses scope.
 *
 * Every child screen and flow is stubbed: this file tests the host's wiring
 * (which component, which props), not the screens themselves, which have
 * their own tests. Plus source guards on the host and the shell folder.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act } from 'react-test-renderer';

const h = vi.hoisted(() => {
  const backListeners: Array<() => boolean> = [];
  const stub = (name: string) => {
    const C = (_props: Record<string, unknown>) => null;
    C.displayName = name;
    return C;
  };
  return { backListeners, stub, fetchMe: vi.fn() };
});

vi.mock('react-native', () => ({
  Platform: { OS: 'android', select: (o: Record<string, unknown>) => o['android'] ?? o['default'] },
  ScrollView: 'ScrollView',
  StyleSheet: { create: (s: Record<string, unknown>) => s, flatten: (s: unknown) => s, absoluteFill: {} },
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
  BackHandler: {
    addEventListener: (_event: string, fn: () => boolean) => {
      h.backListeners.push(fn);
      return {
        remove: () => {
          const i = h.backListeners.indexOf(fn);
          if (i >= 0) h.backListeners.splice(i, 1);
        },
      };
    },
  },
}));
vi.mock('react-native-svg', () => ({
  default: 'Svg',
  Circle: 'Circle',
  Line: 'Line',
  Path: 'Path',
  Rect: 'Rect',
}));
vi.mock('@tohfa/mobile-ui', () => ({ ScreenStatusBar: 'ScreenStatusBar', SafeAreaView: 'SafeAreaView' }));
vi.mock('../../farmer/api/auth', () => ({
  fetchMe: h.fetchMe,
  getPrimaryAdminRole: (roles: Array<{ code: string }>) => roles[0]?.code ?? null,
}));
vi.mock('../screens/tohfa-home/TohfaHomeScreen', () => ({ TohfaHomeScreen: h.stub('TohfaHomeScreen') }));
vi.mock('../screens/operations', () => ({ WarehouseOverviewScreen: h.stub('WarehouseOverviewScreen') }));
vi.mock('../screens/finance-hub', () => ({ FinanceHubScreen: h.stub('FinanceHubScreen') }));
vi.mock('../screens/finance', () => ({ FinanceManagementFlow: h.stub('FinanceManagementFlow') }));
vi.mock('../screens/more/AdminMoreMenuScreen', () => ({ AdminMoreMenuScreen: h.stub('AdminMoreMenuScreen') }));
vi.mock('../screens/settings/TohfaAdminSettingsScreen', () => ({ TohfaAdminSettingsScreen: h.stub('TohfaAdminSettingsScreen') }));
vi.mock('../screens/farmers/FarmersFlow', () => ({ FarmersFlow: h.stub('FarmersFlow') }));
vi.mock('../screens/pricing/PricingFlow', () => ({ PricingFlow: h.stub('PricingFlow') }));
vi.mock('../screens/warehouse/notifications/NotificationsFlow', () => ({ NotificationsFlow: h.stub('NotificationsFlow') }));
vi.mock('../screens/warehouse/inventory/InventoryFlow', () => ({ InventoryFlow: h.stub('InventoryFlow') }));
vi.mock('../screens/warehouse/receiving-qc/ReceivingFlow', () => ({ ReceivingFlow: h.stub('ReceivingFlow') }));
vi.mock('../screens/warehouse/transfers/TransfersFlow', () => ({ TransfersFlow: h.stub('TransfersFlow') }));
vi.mock('../screens/warehouse/sales-direct/SalesFlow', () => ({ SalesFlow: h.stub('SalesFlow') }));
vi.mock('../screens/warehouse/finance-expenses/FinanceFlow', () => ({ FinanceFlow: h.stub('FinanceFlow') }));
vi.mock('../screens/warehouse/wallet-cashtopup/WalletFlow', () => ({ WalletFlow: h.stub('WalletFlow') }));
vi.mock('../screens/warehouse/returns-rma/ReturnsFlow', () => ({ ReturnsFlow: h.stub('ReturnsFlow') }));
vi.mock('../screens/warehouse/customers/CustomersFlow', () => ({ CustomersFlow: h.stub('CustomersFlow') }));
vi.mock('../screens/customers-management', () => ({ CustomersManagementFlow: h.stub('CustomersManagementFlow') }));
vi.mock('../screens/tohfa-shell/TohfaReportsFlow', () => ({ TohfaReportsFlow: h.stub('TohfaReportsFlow') }));
vi.mock('../screens/work-queue/WorkQueueScreen', () => ({ WorkQueueScreen: h.stub('WorkQueueScreen') }));
vi.mock('../screens/warehouse/staff-attendance/StaffFlow', () => ({ StaffFlow: h.stub('StaffFlow') }));
vi.mock('../screens/warehouse/billing-invoices/BillingFlow', () => ({ BillingFlow: h.stub('BillingFlow') }));
vi.mock('../screens/warehouse/orders/OrdersFlow', () => ({ OrdersFlow: h.stub('OrdersFlow') }));
vi.mock('../screens/produce', () => ({ ProduceControlFlow: h.stub('ProduceControlFlow') }));
vi.mock('../screens/audits/AuditManagementFlow', () => ({ AuditManagementFlow: h.stub('AuditManagementFlow') }));

import {
  TohfaAdminDashboardScreen,
  type TohfaAdminDashboardScreenProps,
} from '../screens/dashboard/TohfaAdminDashboardScreen';
import { TohfaHomeScreen } from '../screens/tohfa-home/TohfaHomeScreen';
import { WarehouseOverviewScreen } from '../screens/operations';
import { FinanceHubScreen as TohfaFinanceHubScreen } from '../screens/finance-hub';
import { FinanceManagementFlow } from '../screens/finance';
import { AdminMoreMenuScreen } from '../screens/more/AdminMoreMenuScreen';
import { TohfaAdminSettingsScreen } from '../screens/settings/TohfaAdminSettingsScreen';
import { FarmersFlow } from '../screens/farmers/FarmersFlow';
import { PricingFlow } from '../screens/pricing/PricingFlow';
import { NotificationsFlow } from '../screens/warehouse/notifications/NotificationsFlow';
import { InventoryFlow } from '../screens/warehouse/inventory/InventoryFlow';
import { ReceivingFlow } from '../screens/warehouse/receiving-qc/ReceivingFlow';
import { TransfersFlow } from '../screens/warehouse/transfers/TransfersFlow';
import { SalesFlow } from '../screens/warehouse/sales-direct/SalesFlow';
import { WalletFlow } from '../screens/warehouse/wallet-cashtopup/WalletFlow';
import { ReturnsFlow } from '../screens/warehouse/returns-rma/ReturnsFlow';
import { CustomersManagementFlow } from '../screens/customers-management';
import { TohfaReportsFlow } from '../screens/tohfa-shell/TohfaReportsFlow';
import { WorkQueueScreen } from '../screens/work-queue/WorkQueueScreen';
import { StaffFlow } from '../screens/warehouse/staff-attendance/StaffFlow';
import { BillingFlow } from '../screens/warehouse/billing-invoices/BillingFlow';
import { OrdersFlow } from '../screens/warehouse/orders/OrdersFlow';
import { ProduceControlFlow } from '../screens/produce';
import { AuditManagementFlow } from '../screens/audits/AuditManagementFlow';
import { en, t } from '../i18n';

const ADMIN = path.join(__dirname, '..');
const HOST = path.join(ADMIN, 'screens/dashboard/TohfaAdminDashboardScreen.tsx');
const SHELL_DIR = path.join(ADMIN, 'screens/tohfa-shell');

/** Codes the test user holds; anything else must be denied by the `can` the host passes down. */
const GRANTED = ['farmer.profile.view_all', 'notification.own.view', 'warehouse.all.view'];
const ALL_WAREHOUSES = { warehouseId: undefined, warehouseName: t('profile.scope.allWarehouses') };

type Stub = (props: Record<string, unknown>) => null;
type Props = Record<string, unknown>;

function user(permissions: string[], roles: string[] = ['ROLE_A']) {
  return { id: 'u1', fullName: 'Test Admin', roles: roles.map((code) => ({ code })), permissions };
}

beforeEach(() => {
  h.backListeners.length = 0;
  h.fetchMe.mockResolvedValue(user(GRANTED));
});
afterEach(() => vi.clearAllMocks());

async function mount(props: Partial<TohfaAdminDashboardScreenProps> = {}) {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(<TohfaAdminDashboardScreen {...props} />);
  });
  return tree;
}

function tabIds(tree: renderer.ReactTestRenderer): string[] {
  return tree.root
    .findAll((n) => typeof n.type === 'string' && typeof n.props.testID === 'string' && n.props.testID.startsWith('tohfaShell.tab.'))
    .map((n) => String(n.props.testID).replace('tohfaShell.tab.', ''));
}

function allText(tree: renderer.ReactTestRenderer): string {
  return tree.root
    .findAll((n) => (n.type as unknown) === 'Text')
    .map((n) => [n.props.children].flat().join(''))
    .join('|');
}

function pressTab(tree: renderer.ReactTestRenderer, id: string) {
  const node = tree.root.find((n) => typeof n.type === 'string' && n.props.testID === `tohfaShell.tab.${id}`);
  act(() => node.props.onPress());
}

function only(tree: renderer.ReactTestRenderer, C: unknown): Props {
  const found = tree.root.findAllByType(C as Stub);
  expect(found.length).toBe(1);
  return found[0]!.props as Props;
}

function none(tree: renderer.ReactTestRenderer, C: unknown) {
  expect(tree.root.findAllByType(C as Stub).length).toBe(0);
}

function call(fn: unknown, ...args: unknown[]) {
  expect(typeof fn).toBe('function');
  act(() => {
    (fn as (...a: unknown[]) => void)(...args);
  });
}

/** The `can` passed down is the user's own: grants exactly GRANTED. */
function expectAdminCan(can: unknown) {
  expect(typeof can).toBe('function');
  const check = can as (code: string) => boolean;
  for (const code of GRANTED) expect(check(code), code).toBe(true);
  for (const code of ['finance.sales_income.view', 'report.export.file', 'anything.else']) expect(check(code), code).toBe(false);
}

function definedKeys(props: Props, keys: readonly string[]): string[] {
  return keys.filter((k) => props[k] !== undefined);
}

function pressBack(): boolean {
  const top = h.backListeners[h.backListeners.length - 1];
  expect(top).toBeDefined();
  let handled = false;
  act(() => {
    handled = top!();
  });
  return handled;
}

describe('tab bar', () => {
  it('shows Home, Work Queue, Inventory, Finance, More in the design order; no old Dashboard/Farmers/Sales/Reports/Profile tabs', async () => {
    const tree = await mount();
    expect(tabIds(tree)).toEqual(['Home', 'WorkQueue', 'Inventory', 'Finance', 'More']);
    const text = allText(tree);
    for (const label of [
      'tohfaShell.tab.home',
      'tohfaShell.tab.workQueue',
      'tohfaShell.tab.inventory',
      'tohfaShell.tab.finance',
      'tohfaShell.tab.more',
    ] as const) {
      expect(text).toContain(t(label));
    }
    for (const old of ['Dashboard', 'Farmers', 'Sales', 'Reports', 'Profile']) expect(text).not.toContain(old);
  });

  it('marks the active tab selected', async () => {
    const tree = await mount();
    const selected = () =>
      tree.root
        .findAll((n) => typeof n.type === 'string' && String(n.props.testID ?? '').startsWith('tohfaShell.tab.'))
        .filter((n) => n.props.accessibilityState?.selected)
        .map((n) => n.props.testID);
    expect(selected()).toEqual(['tohfaShell.tab.Home']);
    pressTab(tree, 'Finance');
    expect(selected()).toEqual(['tohfaShell.tab.Finance']);
  });

  it('each tab renders its screen with the admin can', async () => {
    const tree = await mount();
    expectAdminCan(only(tree, TohfaHomeScreen).can);
    pressTab(tree, 'WorkQueue');
    none(tree, TohfaHomeScreen);
    expectAdminCan(only(tree, WorkQueueScreen).can);
    pressTab(tree, 'Inventory');
    none(tree, WorkQueueScreen);
    expectAdminCan(only(tree, WarehouseOverviewScreen).can);
    pressTab(tree, 'Finance');
    expectAdminCan(only(tree, FinanceManagementFlow).can);
    pressTab(tree, 'More');
    expectAdminCan(only(tree, AdminMoreMenuScreen).can);
    pressTab(tree, 'Home');
    only(tree, TohfaHomeScreen);
  });

  it('is hidden while a sub-flow is open and back while on a tab', async () => {
    const tree = await mount();
    call(only(tree, TohfaHomeScreen).onOpenPricing);
    expect(tabIds(tree)).toEqual([]);
    call(only(tree, PricingFlow).onBack);
    expect(tabIds(tree)).toEqual(['Home', 'WorkQueue', 'Inventory', 'Finance', 'More']);
  });
});

describe('Home tab wiring', () => {
  const WIRED = [
    'onOpenNotifications',
    'onOpenProfile',
    'onOpenPendingApplications',
    'onOpenFarmers',
    'onOpenPricing',
    'onOpenInventory',
    'onOpenFinance',
    'onOpenTransfers',
    'onOpenCashTopUp',
    'onOpenReceiving',
    'onOpenStaff',
    'onCreateStaff',
    'onOpenInvoices',
    'onOpenListingApproval',
    'onOpenPurchaseOrders',
  ];
  const UNWIRED = [
    'onOpenAudits',
    'onOpenProduceCalendar',
    'onOpenSupport',
    'onOpenPayouts',
    'onCreateChannelOrder',
    'onOpenSalesFinanceOverview',
  ];

  it('passes exactly the built destinations and the signed-in user', async () => {
    const tree = await mount();
    const home = only(tree, TohfaHomeScreen);
    expect(definedKeys(home, [...WIRED, ...UNWIRED])).toEqual(WIRED);
    expect((home.user as { fullName?: string }).fullName).toBe('Test Admin');
  });

  it.each([
    ['onOpenNotifications', NotificationsFlow, { scope: ALL_WAREHOUSES }],
    ['onOpenProfile', TohfaAdminSettingsScreen, {}],
    ['onOpenPendingApplications', FarmersFlow, { entry: 'pendingApplications' }],
    ['onOpenFarmers', FarmersFlow, { entry: 'list' }],
    ['onOpenPricing', PricingFlow, {}],
    ['onOpenTransfers', TransfersFlow, { scope: ALL_WAREHOUSES }],
    ['onOpenCashTopUp', WalletFlow, { scope: ALL_WAREHOUSES }],
    ['onOpenReceiving', ReceivingFlow, { scope: ALL_WAREHOUSES }],
    ['onOpenStaff', StaffFlow, { scope: ALL_WAREHOUSES, initialScreen: 'Staff' }],
    ['onCreateStaff', StaffFlow, { scope: ALL_WAREHOUSES, initialScreen: 'EditStaffProfile' }],
    ['onOpenInvoices', BillingFlow, { scope: ALL_WAREHOUSES }],
  ] as const)('%s opens its flow with the admin can; back returns to Home', async (cb, Flow, expected) => {
    const tree = await mount();
    call(only(tree, TohfaHomeScreen)[cb]);
    none(tree, TohfaHomeScreen);
    const props = only(tree, Flow);
    expectAdminCan(props.can);
    expect(props).toMatchObject(expected);
    call(props.onBack);
    none(tree, Flow);
    only(tree, TohfaHomeScreen);
  });

  it('onOpenInventory / onOpenFinance switch tabs', async () => {
    const tree = await mount();
    call(only(tree, TohfaHomeScreen).onOpenInventory);
    only(tree, WarehouseOverviewScreen);
    pressTab(tree, 'Home');
    call(only(tree, TohfaHomeScreen).onOpenFinance);
    only(tree, FinanceManagementFlow);
  });
});

describe('Work Queue tab wiring', () => {
  it('mounts the Work Queue screen with the admin can; its back returns Home', async () => {
    const tree = await mount();
    pressTab(tree, 'WorkQueue');
    const wq = only(tree, WorkQueueScreen);
    expectAdminCan(wq.can);
    call(wq.onBack);
    only(tree, TohfaHomeScreen);
  });

  it.each([
    ['onOpenOrders', OrdersFlow],
    ['onOpenReceiving', ReceivingFlow],
    ['onOpenReturns', ReturnsFlow],
  ] as const)('%s opens its flow (all warehouses, admin can) and back returns to Work Queue', async (cb, Flow) => {
    const tree = await mount();
    pressTab(tree, 'WorkQueue');
    call(only(tree, WorkQueueScreen)[cb]);
    expect(tabIds(tree)).toEqual([]);
    const props = only(tree, Flow);
    expect(props.scope).toEqual(ALL_WAREHOUSES);
    expectAdminCan(props.can);
    call(props.onBack);
    only(tree, WorkQueueScreen);
    expect(tree.root.findAll((n) => n.props.accessibilityState?.selected).map((n) => n.props.testID)).toEqual(['tohfaShell.tab.WorkQueue']);
  });

  it('Android back from Work Queue goes Home', async () => {
    const tree = await mount();
    pressTab(tree, 'WorkQueue');
    expect(pressBack()).toBe(true);
    only(tree, TohfaHomeScreen);
  });
});

describe('Inventory tab wiring', () => {
  it('stock ledger / verification open InventoryFlow at M3S02 / M3S10, all warehouses or the chosen one', async () => {
    const tree = await mount();
    pressTab(tree, 'Inventory');
    const overview = only(tree, WarehouseOverviewScreen);
    // onOpenWarehouse is now wired: tapping a card opens InventoryFlow at M3S02 for that warehouse.
    expect(typeof overview.onOpenWarehouse).toBe('function');

    call(overview.onOpenStockLedger);
    let flow = only(tree, InventoryFlow);
    expect(flow).toMatchObject({ initialScreen: 'M3S02', scope: ALL_WAREHOUSES });
    expectAdminCan(flow.can);
    call(flow.onBack);

    call(only(tree, WarehouseOverviewScreen).onOpenStockVerification, 'wh-uuid-1');
    flow = only(tree, InventoryFlow);
    expect(flow.initialScreen).toBe('M3S10');
    expect((flow.scope as { warehouseId?: string }).warehouseId).toBe('wh-uuid-1');
    call(flow.onBack);
    only(tree, WarehouseOverviewScreen);
    expect(tabIds(tree)).toContain('Inventory');
  });

  it('transfers open TransfersFlow and return to Inventory; the overview back goes Home', async () => {
    const tree = await mount();
    pressTab(tree, 'Inventory');
    call(only(tree, WarehouseOverviewScreen).onOpenTransfers);
    const flow = only(tree, TransfersFlow);
    expect(flow.scope).toEqual(ALL_WAREHOUSES);
    call(flow.onBack);
    call(only(tree, WarehouseOverviewScreen).onBack);
    only(tree, TohfaHomeScreen);
  });
});

describe('Finance tab wiring', () => {
  it('mounts FinanceManagementFlow with admin can and returns Home on back', async () => {
    const tree = await mount();
    pressTab(tree, 'Finance');
    none(tree, TohfaFinanceHubScreen);
    const flow = only(tree, FinanceManagementFlow);
    expectAdminCan(flow.can);
    call(flow.onBack);
    only(tree, TohfaHomeScreen);
  });

  it('Home onOpenInvoices opens BillingFlow and returns to Home on back', async () => {
    const tree = await mount();
    call(only(tree, TohfaHomeScreen).onOpenInvoices);
    const fromHome = only(tree, BillingFlow);
    expect(fromHome.scope).toEqual(ALL_WAREHOUSES);
    expectAdminCan(fromHome.can);
    call(fromHome.onBack);
    only(tree, TohfaHomeScreen);
  });
});

describe('More tab wiring', () => {
  it('offers exactly the built rows and the host sign-out', async () => {
    const onSignOut = vi.fn();
    const tree = await mount({ onSignOut });
    pressTab(tree, 'More');
    const more = only(tree, AdminMoreMenuScreen);
    expect(Object.keys(more.handlers as object).sort()).toEqual([
      'allocation',
      'audit',
      'customers',
      'farmers',
      'inputs',
      'notifications',
      'pricing',
      'produce',
      'purchase_sales',
      'reports',
      'sales_orders',
      'settings',
      'staff',
    ]);
    expect(more.canSwitchRole).toBe(false);
    call(more.onLogout);
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['farmers', FarmersFlow, { entry: 'list' }],
    ['pricing', PricingFlow, {}],
    // The More row opens Customers Management (design Screen 1), not the older warehouse customers flow.
    ['customers', CustomersManagementFlow, {}],
    ['reports', TohfaReportsFlow, {}],
    ['notifications', NotificationsFlow, { scope: ALL_WAREHOUSES }],
    ['settings', TohfaAdminSettingsScreen, {}],
    ['produce', ProduceControlFlow, {}],
    ['audit', AuditManagementFlow, {}],
  ] as const)('%s opens its destination and back returns to More', async (row, Dest, expected) => {
    const tree = await mount();
    pressTab(tree, 'More');
    call((only(tree, AdminMoreMenuScreen).handlers as Record<string, unknown>)[row]);
    const props = only(tree, Dest);
    expect(props).toMatchObject(expected);
    if (Dest !== TohfaReportsFlow) expectAdminCan(props.can);
    call(props.onBack);
    only(tree, AdminMoreMenuScreen);
  });

  it('settings signs out through the host prop', async () => {
    const onSignOut = vi.fn();
    const tree = await mount({ onSignOut });
    pressTab(tree, 'More');
    call((only(tree, AdminMoreMenuScreen).handlers as Record<string, unknown>).settings);
    call(only(tree, TohfaAdminSettingsScreen).onSignOut);
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it('switch role needs both a multi-role user and a host onSwitchRole', async () => {
    h.fetchMe.mockResolvedValue(user(GRANTED, ['ROLE_A', 'ROLE_B']));
    let tree = await mount();
    pressTab(tree, 'More');
    expect(only(tree, AdminMoreMenuScreen).canSwitchRole).toBe(false);
    expect((only(tree, AdminMoreMenuScreen).handlers as Record<string, unknown>).switch_role).toBeUndefined();

    const onSwitchRole = vi.fn();
    tree = await mount({ onSwitchRole });
    pressTab(tree, 'More');
    const more = only(tree, AdminMoreMenuScreen);
    expect(more.canSwitchRole).toBe(true);
    call((more.handlers as Record<string, unknown>).switch_role);
    expect(onSwitchRole).toHaveBeenCalledWith('ROLE_B');

    h.fetchMe.mockResolvedValue(user(GRANTED, ['ROLE_A']));
    tree = await mount({ onSwitchRole });
    pressTab(tree, 'More');
    expect(only(tree, AdminMoreMenuScreen).canSwitchRole).toBe(false);
  });
});

describe('Android back', () => {
  it('sub-flow -> its tab; tab -> Home; Home -> not handled', async () => {
    const tree = await mount();
    pressTab(tree, 'Inventory');
    call(only(tree, WarehouseOverviewScreen).onOpenTransfers);
    only(tree, TransfersFlow);
    expect(pressBack()).toBe(true);
    only(tree, WarehouseOverviewScreen);
    expect(pressBack()).toBe(true);
    only(tree, TohfaHomeScreen);
    expect(pressBack()).toBe(false);
    only(tree, TohfaHomeScreen);
  });
});

describe('no permissions, no gated controls', () => {
  it.each([
    ['an empty permission list', () => h.fetchMe.mockResolvedValue(user([]))],
    ['a failed /auth/me', () => h.fetchMe.mockRejectedValue(new Error('offline'))],
  ])('%s: every screen gets a can that denies everything; Farmers never opens', async (_name, arrange) => {
    arrange();
    const tree = await mount({ initialTab: 'Farmers' });
    none(tree, FarmersFlow);
    const home = (() => {
      pressTab(tree, 'Home');
      return only(tree, TohfaHomeScreen);
    })();
    for (const code of [...GRANTED, 'finance.sales_income.view']) expect((home.can as (c: string) => boolean)(code)).toBe(false);
    call(home.onOpenFarmers);
    call(home.onOpenPendingApplications);
    none(tree, FarmersFlow);
    pressTab(tree, 'More');
    const more = only(tree, AdminMoreMenuScreen);
    expect((more.can as (c: string) => boolean)('farmer.profile.view_all')).toBe(false);
  });
});

describe('old initialTab values', () => {
  it.each([
    ['Dashboard', TohfaHomeScreen, 'Home'],
    ['WorkQueue', WorkQueueScreen, 'Home'],
    ['Farmers', FarmersFlow, 'More'],
    ['Sales', SalesFlow, 'Finance'],
    ['Reports', TohfaReportsFlow, 'More'],
    ['Profile', TohfaAdminSettingsScreen, 'More'],
  ] as const)('%s opens the mapped destination', async (initialTab, Dest, returnTab) => {
    const tree = await mount({ initialTab });
    const props = only(tree, Dest);
    if (props.onBack) {
      call(props.onBack);
      expect(tree.root.findAll((n) => n.props.accessibilityState?.selected).map((n) => n.props.testID)).toEqual([`tohfaShell.tab.${returnTab}`]);
    }
  });
});

describe('source guards', () => {
  const files = [HOST, ...fs.readdirSync(SHELL_DIR).map((f) => path.join(SHELL_DIR, f))];
  const code = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  it('the host is a thin file: at most 800 lines', () => {
    expect(fs.readFileSync(HOST, 'utf8').split('\n').length).toBeLessThanOrEqual(800);
  });

  it.each(files)('%s: no hex colours, no role names, no fail-open can, no warehouse codes, no fixtures', (file) => {
    const src = code(fs.readFileSync(file, 'utf8'));
    expect(src).not.toMatch(/['"`]#[0-9A-Fa-f]{3,8}['"`]|\brgba?\(/);
    expect(src).not.toMatch(/PALETTE/);
    expect(src).not.toMatch(/TOHFA_ADMIN|SUPER_ADMIN|FARMER_ADMIN|MAIN_WH_ADMIN|SUB_WH_ADMIN|role=|\.role\s*===/);
    expect(src).not.toMatch(/can=\{\s*\(\)\s*=>\s*true\s*\}|\|\|\s*!user\b|=>\s*true\s*\)/);
    expect(src).not.toMatch(/WH-[A-Z0-9]+|warehouseOptions/);
    expect(src).not.toMatch(/Rajesh|Ganga Devi|Divya|pendingApplications:\s*\d/);
  });

  it('the host no longer mounts the old sample sales screens or the old modals', () => {
    const src = code(fs.readFileSync(HOST, 'utf8'));
    for (const screen of [
      'SalesChannelOverviewScreen',
      'SalesOnlineOrdersScreen',
      'SalesMarketDayScreen',
      'SalesHorecaOrdersScreen',
      'SalesB2BOrdersScreen',
      'SalesFulfillmentAssignmentScreen',
      'SalesInvoiceScreen',
      'SalesReturnsRefundsScreen',
      'ListingApprovalQueueScreen',
      'AdminSupportScreen',
      'AdminProfileScreen',
      'Modal',
    ]) {
      expect(src, screen).not.toMatch(new RegExp(`\\b${screen}\\b`));
    }
  });

  it('JSX in the shell carries no literal text (strings come from t())', () => {
    for (const file of files) {
      expect(code(fs.readFileSync(file, 'utf8')), file).not.toMatch(/>\s*[A-Za-z][A-Za-z ]+\s*<\//);
    }
  });

  it('the tohfaShell catalogue is registered in the admin i18n', () => {
    const catEn = JSON.parse(fs.readFileSync(path.join(ADMIN, 'i18n/tohfaShell.en.json'), 'utf8')) as Record<string, string>;
    const catTa = JSON.parse(fs.readFileSync(path.join(ADMIN, 'i18n/tohfaShell.ta.json'), 'utf8')) as Record<string, string>;
    expect(Object.keys(catEn).length).toBeGreaterThan(0);
    expect(catTa).toEqual({});
    for (const [k, v] of Object.entries(catEn)) expect((en as Record<string, string>)[k], k).toBe(v);
  });
});
