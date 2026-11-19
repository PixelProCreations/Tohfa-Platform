/**
 * The five Super Admin overview screens ported from the design
 * (origin/Superadmin-main screens/dashboard): Approvals Inbox, Approval Detail
 * (payout), Finance & Business, System Health & Administration, Warehouse &
 * Operations. Rendered with react-test-renderer and a real QueryClient against
 * mocked api modules. Pins:
 *   - every design tile, card, section and button renders, with or without data
 *     (owner rule: a missing number is the dash, a missing card is a bug);
 *   - none of the design's fixture strings render;
 *   - reads are gated by their route's code and fail closed without `can`;
 *   - real figures come from the API (money through integer paise);
 *   - money-moving buttons act only through host callbacks and are disabled
 *     without them;
 *   - source guards (no hex, no numeric fontSize, no role names, keys exist).
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestInstance, type ReactTestRendererJSON } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type * as TransfersModule from '../api/transfers';
import type * as WarehouseListModule from '../api/warehouseList';
import type * as FinanceModule from '../api/finance';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Alert: { alert: vi.fn() },
  BackHandler: { addEventListener: vi.fn(() => ({ remove: () => undefined })) },
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
  Circle: 'Circle',
  Ellipse: 'Ellipse',
  Line: 'Line',
  Path: 'Path',
  Rect: 'Rect',
}));

const api = vi.hoisted(() => ({
  listWarehouseTransfers: vi.fn(),
  listPromotionRequests: vi.fn(),
  listStockAdjustments: vi.fn(),
  listFarmerApplications: vi.fn(),
  listAdminListings: vi.fn(),
  listAllWarehouses: vi.fn(),
  listPayoutDues: vi.fn(),
  checkHealth: vi.fn(),
  getTaskSummary: vi.fn(),
  listTasks: vi.fn(),
  getInventoryOverview: vi.fn(),
  getWarehouseCapacity: vi.fn(),
  getFinanceRevenueReport: vi.fn(),
  getFinanceExpenseReport: vi.fn(),
}));
vi.mock('../api/transfers', async (importOriginal) => ({
  ...(await importOriginal<typeof TransfersModule>()),
  listWarehouseTransfers: api.listWarehouseTransfers,
}));
vi.mock('../api/promotions', () => ({ listPromotionRequests: api.listPromotionRequests }));
vi.mock('../api/stockAdjustments', () => ({ listStockAdjustments: api.listStockAdjustments }));
vi.mock('../api/farmerApplications', () => ({ listFarmerApplications: api.listFarmerApplications }));
vi.mock('../api/listings', () => ({ listAdminListings: api.listAdminListings }));
vi.mock('../api/warehouseList', async (importOriginal) => ({
  ...(await importOriginal<typeof WarehouseListModule>()),
  listAllWarehouses: api.listAllWarehouses,
}));
vi.mock('../api/payoutDues', () => ({ listPayoutDues: api.listPayoutDues }));
vi.mock('../api/health', () => ({ checkHealth: api.checkHealth }));
vi.mock('../api/tasks', () => ({ getTaskSummary: api.getTaskSummary, listTasks: api.listTasks }));
vi.mock('../api/inventoryOverview', () => ({ getInventoryOverview: api.getInventoryOverview }));
vi.mock('../api/warehouses', () => ({ getWarehouseCapacity: api.getWarehouseCapacity }));
vi.mock('../api/finance', async (importOriginal) => ({
  ...(await importOriginal<typeof FinanceModule>()),
  getFinanceRevenueReport: api.getFinanceRevenueReport,
  getFinanceExpenseReport: api.getFinanceExpenseReport,
}));

import { Alert } from 'react-native';
import { ApprovalsInboxScreen, type ApprovalItem } from '../screens/dashboard/ApprovalsInboxScreen';
import { ApprovalDetailPayoutScreen } from '../screens/dashboard/ApprovalDetailPayoutScreen';
import { FinanceBusinessOverviewScreen } from '../screens/dashboard/FinanceBusinessOverviewScreen';
import { SystemHealthAdminOverviewScreen } from '../screens/dashboard/SystemHealthAdminOverviewScreen';
import { WarehouseOperationsOverviewScreen } from '../screens/dashboard/WarehouseOperationsOverviewScreen';
import { makeCan } from '../permissions/can';
import { en, t } from '../i18n';

const DASH = '—';
const HOUR = 3_600_000;
const iso = (hoursAgo: number) => new Date(Date.now() - hoursAgo * HOUR).toISOString();

function textOf(node: ReactTestRendererJSON | ReactTestRendererJSON[] | string | null): string[] {
  if (node === null) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(textOf);
  return (node.children ?? []).flatMap(textOf);
}
const allText = (tree: renderer.ReactTestRenderer) => textOf(tree.toJSON()).join('\n');
const byId = (tree: renderer.ReactTestRenderer, id: string) =>
  tree.root.findAll((n) => typeof n.type === 'string' && n.props.testID === id);
const hostButtons = (tree: renderer.ReactTestRenderer) =>
  tree.root.findAll((n) => (n.type as unknown) === 'TouchableOpacity');
const labelOf = (n: ReactTestInstance) => String(n.props.accessibilityLabel ?? '');
/** The stat card's spoken label "Title: value[, subtitle]" for a given (sentence-case) title. */
function tile(tree: renderer.ReactTestRenderer, title: string): string {
  const hit = hostButtons(tree).find((n) => labelOf(n).startsWith(`${title}: `));
  expect(hit, `tile "${title}" is drawn`).toBeDefined();
  return labelOf(hit!);
}
const actionTile = (tree: renderer.ReactTestRenderer, title: string) =>
  hostButtons(tree).find((n) => labelOf(n) === title);

async function flush() {
  for (let i = 0; i < 6; i += 1) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
  }
}

async function mount(el: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(<QueryClientProvider client={client}>{el}</QueryClientProvider>);
  });
  await flush();
  return tree;
}

const noop = () => undefined;
const A = '00000000-0000-4000-8000-00000000000a';
const B = '00000000-0000-4000-8000-00000000000b';
const emptyPage = { items: [], page: { nextCursor: null, hasMore: false } };
const offsetPage = (items: unknown[]) => ({ items, page: 1, pageSize: 100, total: items.length });

const ALL_APPROVAL_CODES = [
  'transfer.inter_warehouse.view',
  'transfer.high_value.approve',
  'admin.promotion.view',
  'admin.promotion.approve',
  'inventory.stock_adjustment.create',
  'inventory.stock_adjustment.approve',
  'farmer.application.list_pending',
  'farmer.application.approve',
  'listing.queue.view_pending',
  'listing.approve',
  'warehouse.all.view',
];

beforeEach(() => {
  api.listWarehouseTransfers.mockResolvedValue(offsetPage([]));
  api.listPromotionRequests.mockResolvedValue(emptyPage);
  api.listStockAdjustments.mockResolvedValue(offsetPage([]));
  api.listFarmerApplications.mockResolvedValue(emptyPage);
  api.listAdminListings.mockResolvedValue(emptyPage);
  api.listAllWarehouses.mockResolvedValue([]);
  api.listPayoutDues.mockResolvedValue({ items: [], page: { nextCursor: null, hasMore: false }, totals: { totalDue: '0.00', farmerCount: 0 } });
  api.checkHealth.mockResolvedValue({ ok: true, latencyMs: 41 });
  api.getTaskSummary.mockResolvedValue({ open: 0, byType: {} });
  api.getInventoryOverview.mockResolvedValue({
    warehouses: [],
    nearExpiryBatchCount: null,
    lowStockCount: null,
    pendingAdjustmentCount: 0,
    unreconciledVerificationCount: 0,
    varianceUnreconciledVerificationCount: 0,
    thresholds: { nearExpiryDays: null, lowStockThresholdKg: null },
  });
  api.getWarehouseCapacity.mockRejectedValue(new Error('no capacity'));
  api.getFinanceRevenueReport.mockRejectedValue(new Error('off'));
  api.getFinanceExpenseReport.mockRejectedValue(new Error('off'));
});
afterEach(() => vi.clearAllMocks());

// ─── Approvals Inbox ─────────────────────────────────────────────────────────

describe('Approvals Inbox', () => {
  const props = (over: Record<string, unknown> = {}) => ({
    can: makeCan(ALL_APPROVAL_CODES),
    onBack: noop,
    onSelectApproval: noop,
    ...over,
  });

  it('design parity: chrome (back, title, search, filter, count line, list) renders with no access and no data', async () => {
    const tree = await mount(<ApprovalsInboxScreen onBack={noop} onSelectApproval={noop} />);
    for (const id of ['saApprovals.back', 'saApprovals.search', 'saApprovals.filter', 'saApprovals.count', 'saApprovals.list', 'saApprovals.empty']) {
      expect(byId(tree, id).length, id).toBeGreaterThan(0);
    }
    const text = allText(tree);
    expect(text).toContain(t('saApprovals.title'));
    expect(text).toContain(t('saApprovals.allCount', { count: 0 }));
    for (const fn of [api.listWarehouseTransfers, api.listPromotionRequests, api.listStockAdjustments, api.listFarmerApplications, api.listAdminListings]) {
      expect(fn).not.toHaveBeenCalled();
    }
  });

  it('gates each source by its route code AND its decision code', async () => {
    await mount(<ApprovalsInboxScreen {...props({ can: makeCan(['transfer.inter_warehouse.view', 'admin.promotion.view']) })} />);
    expect(api.listWarehouseTransfers).not.toHaveBeenCalled();
    expect(api.listPromotionRequests).not.toHaveBeenCalled();
    await mount(<ApprovalsInboxScreen {...props({ can: makeCan(['listing.queue.view_pending', 'listing.approve']) })} />);
    expect(api.listAdminListings).toHaveBeenCalledTimes(1);
    expect(api.listFarmerApplications).not.toHaveBeenCalled();
  });

  it('renders a card for every real row, with money through paise and no fixtures', async () => {
    api.listAllWarehouses.mockResolvedValue([
      { id: A, name: 'Ooty', code: 'WH-MAIN', type: 'MAIN', isActive: true, createdAt: iso(1) },
      { id: B, name: 'Coonoor', code: 'WH-SUB1', type: 'SUB', isActive: true, createdAt: iso(1) },
    ]);
    api.listWarehouseTransfers.mockResolvedValue(
      offsetPage([{ id: 't1', transferNumber: 'TRF-9', fromWarehouseId: A, toWarehouseId: B, status: 'PENDING_APPROVAL', totalValue: '42000.00', createdAt: iso(24) }]),
    );
    api.listPromotionRequests.mockResolvedValue({
      items: [{ id: 'p1', targetUserId: A, fromRole: 'SUB_WH_ADMIN', toRole: 'MAIN_WH_ADMIN', requestedBy: B, reason: 'x', status: 'PENDING', decidedBy: null, decidedAt: null, decisionNote: null, createdAt: iso(48) }],
      page: { nextCursor: null, hasMore: false },
    });
    api.listStockAdjustments.mockResolvedValue(
      offsetPage([{ id: 's1', batchCode: 'BT-77', warehouseId: A, qtyDeltaKg: '-42.000', status: 'PENDING', createdAt: iso(6) }]),
    );
    api.listFarmerApplications.mockResolvedValue({
      items: [{ id: 'a1', fullName: 'Asha', status: 'SUBMITTED', submittedAt: iso(72), createdAt: iso(72), completedSteps: [], mobile: '+910000000000' }],
      page: { nextCursor: null, hasMore: false },
    });
    api.listAdminListings.mockResolvedValue({
      items: [
        { id: 'l1', cropId: 'c', cropName: 'Tomato', grade: 'GRADE_1', quantityKg: '1', askingPricePerKg: '1.00', status: 'PENDING_APPROVAL', createdAt: iso(2), farmerName: 'Selvi' },
        { id: 'l2', cropId: 'c', cropName: 'Carrot', grade: 'GRADE_2', quantityKg: '1', askingPricePerKg: '1.00', status: 'PENDING_APPROVAL', createdAt: iso(1), farmerName: 'Own', routedAway: true },
      ],
      page: { nextCursor: null, hasMore: false },
    });
    const selected: ApprovalItem[] = [];
    const tree = await mount(<ApprovalsInboxScreen {...props({ onSelectApproval: (i: ApprovalItem) => selected.push(i) })} />);
    const text = allText(tree);
    expect(text).toContain(t('saApprovals.allCount', { count: 6 }));
    expect(text).toContain('TRF-9 · Ooty → Coonoor · ₹42,000');
    expect(text).toContain('BT-77 · -42 kg (Ooty)');
    expect(text).toContain('Tomato Grade 1 · Selvi');
    expect(text).toContain('Main Wh Admin');
    expect(text).toContain(t('saApprovals.status.routedOwn'));
    expect(text).toContain('Waiting 3 days');
    expect(text).toContain('Waiting 6 hours');
    for (const fixture of ['PAY-0002', 'Kumar', 'TR-0015', 'PROMO-001', 'ADJ-0031', 'APP-2026', 'LST-2026', 'Priya', 'Sathish', '18,000']) {
      expect(text).not.toContain(fixture);
    }
    const card = hostButtons(tree).find((n) => typeof n.props.onPress === 'function' && allTextOfInstance(n).includes('TRF-9'));
    await act(async () => card!.props.onPress());
    expect(selected[0]).toMatchObject({ id: 't1', type: 'transfer' });
  });

  it('search narrows the rows and the pill steps through the kinds present', async () => {
    api.listFarmerApplications.mockResolvedValue({
      items: [{ id: 'a1', fullName: 'Asha', status: 'SUBMITTED', submittedAt: iso(5), createdAt: iso(5), completedSteps: [], mobile: 'x' }],
      page: { nextCursor: null, hasMore: false },
    });
    api.listAdminListings.mockResolvedValue({
      items: [{ id: 'l1', cropId: 'c', cropName: 'Tomato', grade: 'GRADE_1', quantityKg: '1', askingPricePerKg: '1.00', status: 'PENDING_APPROVAL', createdAt: iso(2), farmerName: 'Selvi' }],
      page: { nextCursor: null, hasMore: false },
    });
    const tree = await mount(<ApprovalsInboxScreen {...props()} />);
    expect(allText(tree)).toContain(t('saApprovals.allCount', { count: 2 }));
    await act(async () => byId(tree, 'saApprovals.search')[0]!.props.onChangeText('tomato'));
    expect(allText(tree)).toContain(t('saApprovals.allCount', { count: 1 }));
    await act(async () => byId(tree, 'saApprovals.search')[0]!.props.onChangeText(''));
    await act(async () => byId(tree, 'saApprovals.count')[0]!.props.onPress());
    expect(allText(tree)).toContain(t('saApprovals.typeCount', { type: t('saApprovals.cat.application'), count: 1 }));
  });

  it('a failed source shows the error state with Retry and keeps the chrome', async () => {
    api.listAdminListings.mockRejectedValue(new Error('offline'));
    const tree = await mount(<ApprovalsInboxScreen {...props()} />);
    expect(allText(tree)).toContain(t('saApprovals.error'));
    const calls = api.listAdminListings.mock.calls.length;
    await act(async () => byId(tree, 'saApprovals.retry')[0]!.props.onPress());
    await flush();
    expect(api.listAdminListings.mock.calls.length).toBeGreaterThan(calls);
    expect(byId(tree, 'saApprovals.search').length).toBeGreaterThan(0);
  });
});

function allTextOfInstance(n: ReactTestInstance): string {
  return n
    .findAll((c) => (c.type as unknown) === 'Text')
    .map((c) => [c.props.children].flat().join(''))
    .join('|');
}

// ─── Approval Detail (payout) ────────────────────────────────────────────────

describe('Approval Detail (payout)', () => {
  const SECTION_ROWS: Record<string, number> = { farmer: 4, purchase: 8, calc: 5, history: 5, payment: 6 };

  it('design parity: all five sections, every row, the audit line, banner, note and both buttons render', async () => {
    const tree = await mount(<ApprovalDetailPayoutScreen onBack={noop} />);
    for (const [id, rows] of Object.entries(SECTION_ROWS)) {
      const section = byId(tree, `saPayout.section.${id}`)[0];
      expect(section, id).toBeDefined();
      expect(section!.findAll((n) => typeof n.type === 'string' && String(n.props.testID ?? '').startsWith('saPayout.row.')).length).toBe(rows);
    }
    for (const id of ['saPayout.audit', 'saPayout.warning', 'saPayout.note', 'saPayout.approve', 'saPayout.reject', 'saPayout.back']) {
      expect(byId(tree, id).length, id).toBeGreaterThan(0);
    }
    const text = allText(tree);
    expect(text).toContain(t('saApprovals.payout.headerTitle', { id: DASH }));
    // 28 rows: 27 dashes plus the one static "Not shown here"; the audit line adds three more.
    expect(text.split(DASH).length - 1).toBeGreaterThanOrEqual(27);
    for (const fixture of ['FMR-00098', 'Kumar', 'PO-0002', '12,600', '18,000', '0123', 'CALC-PAY', 'Demo TOHFA', 'Beans', '300 kg']) {
      expect(text).not.toContain(fixture);
    }
  });

  it('without host callbacks (or without the approve code) both buttons are disabled', async () => {
    const plain = await mount(<ApprovalDetailPayoutScreen payoutId="PY-1" can={makeCan(['payout.approve_above_10k'])} onBack={noop} />);
    expect(byId(plain, 'saPayout.approve')[0]!.props.disabled).toBe(true);
    expect(byId(plain, 'saPayout.reject')[0]!.props.disabled).toBe(true);
    const denied = await mount(<ApprovalDetailPayoutScreen can={makeCan([])} onBack={noop} onApprove={vi.fn()} onReject={vi.fn()} />);
    expect(byId(denied, 'saPayout.approve')[0]!.props.disabled).toBe(true);
  });

  it('with the code and callbacks: confirm, then call the host with the note', async () => {
    const onApprove = vi.fn();
    const onBack = vi.fn();
    const tree = await mount(
      <ApprovalDetailPayoutScreen can={makeCan(['payout.approve_above_10k'])} onBack={onBack} onApprove={onApprove} onReject={vi.fn()} />,
    );
    await act(async () => byId(tree, 'saPayout.note')[0]!.props.onChangeText('ok'));
    await act(async () => byId(tree, 'saPayout.approve')[0]!.props.onPress());
    const buttons = vi.mocked(Alert.alert).mock.calls[0]![2]!;
    expect(onApprove).not.toHaveBeenCalled();
    await act(async () => buttons[1]!.onPress!());
    expect(onApprove).toHaveBeenCalledWith('ok');
    expect(onBack).toHaveBeenCalled();
  });
});

// ─── Finance & Business ──────────────────────────────────────────────────────

describe('Finance & Business Overview', () => {
  const kpis = ['Purchase value', 'Sales revenue', 'Pending payouts', 'Awaiting sa approval', 'Outstanding dues', 'Expenses'];
  const quick = ['quick.payouts', 'quick.purchases', 'quick.sales', 'quick.finance', 'quick.wallet', 'quick.reports'] as const;

  it('design parity: six KPI tiles, six quick tiles and the payout card render, all dashes without access', async () => {
    const tree = await mount(<FinanceBusinessOverviewScreen onBack={noop} />);
    for (const title of kpis) expect(tile(tree, title), title).toContain(`: ${DASH}`);
    for (const key of quick) expect(actionTile(tree, t(`saFinance.${key}`)), key).toBeDefined();
    for (const id of ['saFinance.payoutCard', 'saFinance.approve', 'saFinance.reject']) expect(byId(tree, id).length, id).toBeGreaterThan(0);
    expect(api.getFinanceRevenueReport).not.toHaveBeenCalled();
    expect(api.listPayoutDues).not.toHaveBeenCalled();
    const text = allText(tree);
    expect(text).toContain(t('saFinance.payout.title', { number: DASH, farmer: DASH }));
    for (const fixture of ['PY-0002', 'Kumar', '18,000', '1,38,900', '2,14,600', '32,450', '18,200']) expect(text).not.toContain(fixture);
  });

  it('real figures: sales, expenses and outstanding dues, exact through paise', async () => {
    api.getFinanceRevenueReport.mockResolvedValue({ from: 'a', to: 'b', summary: { count: 2, total: '1250.50' }, byDay: [], byChannel: [], byPaymentMethod: [] });
    api.getFinanceExpenseReport.mockResolvedValue({ from: 'a', to: 'b', summary: { count: 1, total: '300.25' }, byDay: [], byCategory: [], byPaymentMethod: [] });
    api.listPayoutDues.mockResolvedValue({ items: [], page: { nextCursor: null, hasMore: false }, totals: { totalDue: '32450.10', farmerCount: 3 } });
    const tree = await mount(
      <FinanceBusinessOverviewScreen onBack={noop} can={makeCan(['finance.sales_income.view', 'finance.expense.log', 'payout.dues.view'])} />,
    );
    expect(tile(tree, 'Sales revenue')).toContain('₹1,250.50');
    expect(tile(tree, 'Expenses')).toContain('₹300.25');
    expect(tile(tree, 'Outstanding dues')).toContain('₹32,450.10');
    expect(tile(tree, 'Purchase value')).toContain(`: ${DASH}`);
    expect(api.listPayoutDues).toHaveBeenCalledWith({ limit: 1 }, expect.anything());
  });

  it('Quick Access tiles open through the host callback', async () => {
    const nav = vi.fn();
    const tree = await mount(<FinanceBusinessOverviewScreen onBack={noop} onNavigateSubScreen={nav} />);
    await act(async () => actionTile(tree, t('saFinance.quick.wallet'))!.props.onPress());
    expect(nav).toHaveBeenCalledWith('wallet_flow');
  });

  // Approve itself is a real POST /admin/payouts/{id}/approve; its calls, key and failure
  // handling are pinned in finance_live_writes.test.tsx. Here: the confirm prompt and the host-owned Reject.
  it('payout buttons: disabled without a payout; with one Approve asks to confirm and Reject calls the host', async () => {
    const none = await mount(<FinanceBusinessOverviewScreen onBack={noop} can={makeCan(['payout.approve_above_10k'])} />);
    expect(byId(none, 'saFinance.approve')[0]!.props.disabled).toBe(true);

    const onRejectPayout = vi.fn();
    const tree = await mount(
      <FinanceBusinessOverviewScreen
        onBack={noop}
        can={makeCan(['payout.approve_above_10k'])}
        awaitingPayout={{ id: 'p-1', number: 'PO-2026-000871', farmerName: 'Meena', amount: '18400.00' }}
        onRejectPayout={onRejectPayout}
      />,
    );
    expect(allText(tree)).toContain('PO-2026-000871 · Meena');
    expect(allText(tree)).toContain('₹18,400');
    await act(async () => byId(tree, 'saFinance.approve')[0]!.props.onPress());
    expect(vi.mocked(Alert.alert).mock.calls[0]![0]).toBe(t('saFinance.approve.title'));
    await act(async () => byId(tree, 'saFinance.reject')[0]!.props.onPress());
    await act(async () => vi.mocked(Alert.alert).mock.calls[1]![2]![1]!.onPress!());
    expect(onRejectPayout).toHaveBeenCalledWith('p-1');
  });

  it('without payout.approve_above_10k the buttons stay disabled even with a payout and a reject callback', async () => {
    const tree = await mount(
      <FinanceBusinessOverviewScreen
        onBack={noop}
        can={makeCan([])}
        awaitingPayout={{ id: 'p-1', number: null, farmerName: null, amount: null }}
        onRejectPayout={vi.fn()}
      />,
    );
    expect(byId(tree, 'saFinance.approve')[0]!.props.disabled).toBe(true);
    expect(byId(tree, 'saFinance.reject')[0]!.props.disabled).toBe(true);
  });
});

// ─── System Health & Administration ──────────────────────────────────────────

describe('System Health & Administration Overview', () => {
  const tiles = ['System status', 'Active admins', 'Api latency', 'Sync errors'];
  const actions = ['admins', 'matrix', 'audit', 'settings'] as const;

  it('design parity: four KPI tiles and four action tiles render; unsourced figures are dashes', async () => {
    const tree = await mount(<SystemHealthAdminOverviewScreen onBack={noop} />);
    for (const title of tiles) tile(tree, title);
    for (const key of actions) expect(actionTile(tree, t(`saHealth.actions.${key}`)), key).toBeDefined();
    expect(tile(tree, 'Active admins')).toContain(`: ${DASH}`);
    expect(tile(tree, 'Sync errors')).toContain(`: ${DASH}`);
    for (const fixture of ['14', '48 ms', 'All services healthy']) expect(allText(tree)).not.toContain(fixture);
  });

  it('status and latency come from the health probe', async () => {
    api.checkHealth.mockResolvedValue({ ok: true, latencyMs: 41 });
    const tree = await mount(<SystemHealthAdminOverviewScreen onBack={noop} />);
    expect(tile(tree, 'System status')).toContain(t('saHealth.status.operational'));
    expect(tile(tree, 'Api latency')).toContain('41 ms');
  });

  it('a failed probe reads Unreachable and the latency stays a dash', async () => {
    api.checkHealth.mockRejectedValue(new Error('down'));
    const tree = await mount(<SystemHealthAdminOverviewScreen onBack={noop} />);
    expect(tile(tree, 'System status')).toContain(t('saHealth.status.unreachable'));
    expect(tile(tree, 'Api latency')).toContain(`: ${DASH}`);
  });

  it('Audit Logs and System Settings are disabled (not hidden) without their codes; tiles navigate', async () => {
    const nav = vi.fn();
    const denied = await mount(<SystemHealthAdminOverviewScreen onBack={noop} can={makeCan([])} onNavigateSubScreen={nav} />);
    expect(actionTile(denied, t('saHealth.actions.audit'))!.props.disabled).toBe(true);
    expect(actionTile(denied, t('saHealth.actions.settings'))!.props.disabled).toBe(true);
    const ok = await mount(<SystemHealthAdminOverviewScreen onBack={noop} can={makeCan(['auditlog.view'])} onNavigateSubScreen={nav} />);
    await act(async () => actionTile(ok, t('saHealth.actions.audit'))!.props.onPress());
    expect(nav).toHaveBeenCalledWith('system_audit_logs');
  });
});

// ─── Warehouse & Operations ──────────────────────────────────────────────────

describe('Warehouse & Operations Overview', () => {
  const kpis = ['Total warehouses', 'Inventory (total)', 'Pending receipts', 'Pending verifications', 'Active transfers', 'Exceptions'];
  const FULL = [
    'warehouse.all.view',
    'warehouse.own.view',
    'inventory.batch.view',
    'task.own.view',
    'transfer.inter_warehouse.view',
    'transfer.inter_warehouse.initiate',
    'allocation.channel_percentage.set',
  ];

  it('design parity: six KPI tiles, the quick tiles and the Warehouses section render; dashes without access', async () => {
    const tree = await mount(<WarehouseOperationsOverviewScreen onBack={noop} />);
    for (const title of kpis) expect(tile(tree, title), title).toContain(`: ${DASH}`);
    for (const key of ['warehouses', 'stock', 'verification', 'adjustments'] as const) {
      expect(actionTile(tree, t(`saWhOps.quick.${key}`)), key).toBeDefined();
    }
    expect(byId(tree, 'saWhOps.list').length).toBe(1);
    expect(byId(tree, 'saWhOps.empty').length).toBe(1);
    expect(api.listAllWarehouses).not.toHaveBeenCalled();
    expect(api.getInventoryOverview).not.toHaveBeenCalled();
    for (const fixture of ['130,000', 'Kotagiri', 'WH-SUB3', 'Gudalur', '50,000 kg']) expect(allText(tree)).not.toContain(fixture);
  });

  it('real figures and the warehouse rows', async () => {
    api.listAllWarehouses.mockResolvedValue([
      { id: A, name: 'Ooty', code: 'WH-MAIN', type: 'MAIN', isActive: true, createdAt: iso(1) },
      { id: B, name: 'Kotagiri', code: 'WH-SUB2', type: 'SUB', isActive: false, createdAt: iso(1) },
    ]);
    api.getInventoryOverview.mockResolvedValue({
      warehouses: [
        { warehouseId: A, name: 'Ooty', availableQtyKg: '1200.500' },
        { warehouseId: B, name: 'Kotagiri', availableQtyKg: '99.500' },
      ],
      nearExpiryBatchCount: 0,
      lowStockCount: 0,
      pendingAdjustmentCount: 0,
      unreconciledVerificationCount: 2,
      varianceUnreconciledVerificationCount: 1,
      thresholds: { nearExpiryDays: null, lowStockThresholdKg: null },
    });
    api.getTaskSummary.mockResolvedValue({ open: 5, byType: { GOODS_RECEIPT_QC: 3 } });
    api.listWarehouseTransfers.mockImplementation(async (p: { status: string }) => offsetPage(p.status === 'IN_TRANSIT' ? [{}, {}] : [{}]));
    api.getWarehouseCapacity.mockImplementation(async (id: string) => ({
      warehouseId: id,
      capacityKg: '50000.000',
      usedKg: '21000.000',
      availableKg: '29000.000',
      utilizationPercent: 42,
    }));
    const tree = await mount(<WarehouseOperationsOverviewScreen onBack={noop} can={makeCan(FULL)} />);
    expect(tile(tree, 'Total warehouses')).toContain(': 2');
    expect(tile(tree, 'Inventory (total)')).toContain('1,300 kg');
    expect(tile(tree, 'Pending receipts')).toContain(': 3');
    expect(tile(tree, 'Pending verifications')).toContain(': 2');
    expect(tile(tree, 'Active transfers')).toContain(': 3');
    expect(tile(tree, 'Exceptions')).toContain(': 1');
    const text = allText(tree);
    expect(text).toContain('Ooty (WH-MAIN)');
    expect(text).toContain('50,000 kg capacity · 42% used');
    expect(text).toContain(t('saWhOps.wh.inactive'));
  });

  it('a warehouse whose capacity failed still renders, with dashes', async () => {
    api.listAllWarehouses.mockResolvedValue([{ id: A, name: 'Ooty', code: 'WH-MAIN', type: 'MAIN', isActive: true, createdAt: iso(1) }]);
    const tree = await mount(<WarehouseOperationsOverviewScreen onBack={noop} can={makeCan(FULL)} />);
    expect(allText(tree)).toContain(t('saWhOps.wh.capacity', { capacity: DASH, used: DASH }));
  });

  it('Initiate Transfer and Configure Allocation need their codes; the rest open through the host', async () => {
    const without = await mount(<WarehouseOperationsOverviewScreen onBack={noop} can={makeCan(['warehouse.all.view'])} />);
    expect(actionTile(without, t('saWhOps.quick.transfer'))).toBeUndefined();
    expect(actionTile(without, t('saWhOps.quick.allocation'))).toBeUndefined();
    const nav = vi.fn();
    const full = await mount(<WarehouseOperationsOverviewScreen onBack={noop} can={makeCan(FULL)} onNavigateSubScreen={nav} />);
    await act(async () => actionTile(full, t('saWhOps.quick.allocation'))!.props.onPress());
    await act(async () => actionTile(full, t('saWhOps.quick.stock'))!.props.onPress());
    expect(nav.mock.calls.map((c) => c[0])).toEqual(['allocation', 'inventory_flow']);
  });
});

// ─── Source guards ───────────────────────────────────────────────────────────

describe('source guards', () => {
  const DIR = path.join(__dirname, '../screens/dashboard');
  const FILES = [
    'ApprovalsInboxScreen.tsx',
    'ApprovalDetailPayoutScreen.tsx',
    'FinanceBusinessOverviewScreen.tsx',
    'SystemHealthAdminOverviewScreen.tsx',
    'WarehouseOperationsOverviewScreen.tsx',
    'saOverviewFormat.ts',
  ];
  const read = (f: string) => fs.readFileSync(path.join(DIR, f), 'utf8');

  it.each(FILES)('%s: no hex or rgba, numeric fontSize, fontFamily, role names, any-casts or fixtures', (f) => {
    const c = read(f);
    expect(c).not.toMatch(/['"`]#[0-9A-Fa-f]{3,8}['"`]/);
    expect(c).not.toMatch(/\brgba?\s*\(/);
    expect(c).not.toMatch(/fontSize\s*:\s*\d/);
    expect(c).not.toMatch(/fontFamily/);
    expect(c).not.toMatch(/TOHFA_ADMIN|SUPER_ADMIN|FARMER_ADMIN|MAIN_WH_ADMIN|SUB_WH_ADMIN|\.role\s*===/);
    expect(c).not.toMatch(/\bas any\b|Parameters<typeof/);
    expect(c).not.toMatch(/@tohfa\/mobile-ui/);
    expect(c).not.toMatch(/INITIAL_APPROVALS|PAY-0002|Kumar|WAREHOUSE_LIST/);
    expect(c.split('\n').length).toBeLessThanOrEqual(800);
  });

  it('every t() key the screens use has an English string', () => {
    const missing: string[] = [];
    for (const f of FILES) {
      for (const m of read(f).matchAll(/'(sa(?:Approvals|Finance|Health|WhOps)\.[A-Za-z0-9_.]+)'/g)) {
        if (!(m[1]! in en)) missing.push(`${f}: ${m[1]}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
