/**
 * Brief 07 P1-P4 honesty & wiring verification for Sales, Reports, Config & Certifications.
 * Covers source guards (no fixtures, no inline em-dash literals, no q: '', no catch-success,
 * no invented IDs) and live screen behavior against mocked API modules.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import React from 'react';
import renderer, { act, type ReactTestInstance } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  alert: vi.fn(),
  openURL: vi.fn(async () => undefined),
  listAdminOrders: vi.fn(),
  packOrder: vi.fn(),
  getInvoiceDownloadUrl: vi.fn(),
  getSalesReport: vi.fn(),
  getCustomersReport: vi.fn(),
  getInventoryReport: vi.fn(),
  useFarmerSummary: vi.fn(),
  useFarmerList: vi.fn(),
  listAdminAnnouncements: vi.fn(),
  createAnnouncementMutateAsync: vi.fn(),
  listAlerts: vi.fn(),
  dismissAlert: vi.fn(),
  verifyCertification: vi.fn(),
  useCertificationList: vi.fn(),
  useWarehouseOptions: vi.fn(),
  listWarehouses: vi.fn(),
  getWarehouseCapacity: vi.fn(),
  getTransferStatusCounts: vi.fn(),
}));

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Alert: { alert: mocks.alert },
  FlatList: ({ data, renderItem, ListEmptyComponent }: {
    data: unknown[];
    renderItem: (info: { item: unknown; index: number }) => React.ReactElement;
    ListEmptyComponent?: React.ReactElement | null;
  }) => React.createElement(
    'FlatList',
    null,
    data && data.length > 0
      ? data.map((item, index) => React.createElement('View', { key: String(index) }, renderItem({ item, index })))
      : ListEmptyComponent ?? null,
  ),
  Linking: { openURL: mocks.openURL },
  Modal: ({ visible, children }: { visible?: boolean; children?: React.ReactNode }) =>
    visible ? React.createElement('Modal', null, children) : null,
  Platform: { OS: 'ios', select: (o: Record<string, unknown>) => o['ios'] ?? o['default'] },
  Pressable: 'Pressable',
  RefreshControl: 'RefreshControl',
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  StatusBar: 'StatusBar',
  StyleSheet: { create: (s: Record<string, unknown>) => s, flatten: (s: unknown) => s, absoluteFill: {}, hairlineWidth: 1 },
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

vi.mock('@tohfa/mobile-ui', () => ({
  ScreenStatusBar: 'ScreenStatusBar',
  SafeAreaView: 'SafeAreaView',
  Icon: 'Icon',
}));

vi.mock('../components/OverviewDashboardCard', () => ({
  OverviewCardsGrid: ({ children }: { children: React.ReactNode }) => React.createElement('Grid', null, children),
  OverviewDashboardCard: (p: Record<string, unknown>) => React.createElement('Card', p),
}));

vi.mock('../api/orders', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/orders')>();
  return {
    ...actual,
    listAdminOrders: mocks.listAdminOrders,
    packOrder: mocks.packOrder,
  };
});

vi.mock('../api/invoices', () => ({
  getInvoiceDownloadUrl: mocks.getInvoiceDownloadUrl,
}));

vi.mock('../api/reports', () => ({
  getSalesReport: mocks.getSalesReport,
  getCustomersReport: mocks.getCustomersReport,
  getInventoryReport: mocks.getInventoryReport,
}));

vi.mock('../api/farmerHooks', () => ({
  useFarmerSummary: mocks.useFarmerSummary,
  useFarmerList: mocks.useFarmerList,
}));

vi.mock('../api/announcements', () => ({
  listAdminAnnouncements: mocks.listAdminAnnouncements,
}));

vi.mock('../api/announcementsHooks', () => ({
  useCreateAdminAnnouncement: () => ({
    mutateAsync: mocks.createAnnouncementMutateAsync,
    isPending: false,
  }),
}));

vi.mock('../api/alerts', () => ({
  listAlerts: mocks.listAlerts,
  dismissAlert: mocks.dismissAlert,
}));

vi.mock('../api/certifications', () => ({
  verifyCertification: mocks.verifyCertification,
}));

vi.mock('../api/certificationHooks', () => ({
  useCertificationList: mocks.useCertificationList,
}));

vi.mock('../screens/warehouse/shared/useWarehouseOptions', () => ({
  useWarehouseOptions: mocks.useWarehouseOptions,
}));

vi.mock('../api/warehouses', () => ({
  listWarehouses: mocks.listWarehouses,
  getWarehouseCapacity: mocks.getWarehouseCapacity,
}));

vi.mock('../api/dashboardFeeds', () => ({
  getTransferStatusCounts: mocks.getTransferStatusCounts,
}));

import { SalesOnlineOrdersScreen } from '../screens/sales/SalesOnlineOrdersScreen';
import { SalesFulfillmentAssignmentScreen } from '../screens/sales/SalesFulfillmentAssignmentScreen';
import { SalesInvoiceScreen } from '../screens/sales/SalesInvoiceScreen';
import { AnalyticsDashboardScreen } from '../screens/reports/AnalyticsDashboardScreen';
import { AnnouncementsScreen } from '../screens/reports/AnnouncementsScreen';
import { SystemAlertsScreen } from '../screens/reports/SystemAlertsScreen';
import { AdminCertVerificationScreen } from '../screens/certifications/AdminCertVerificationScreen';
import { t } from '../i18n';
import { ADMIN_NO_VALUE } from '../utils/noValue';

const ADMIN_DIR = path.resolve(__dirname, '..');
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

const WIRING_FILES = [
  'screens/sales/SalesOnlineOrdersScreen.tsx',
  'screens/sales/SalesChannelOverviewScreen.tsx',
  'screens/sales/SalesB2BOrdersScreen.tsx',
  'screens/sales/SalesHorecaOrdersScreen.tsx',
  'screens/sales/SalesInvoiceScreen.tsx',
  'screens/sales/SalesFulfillmentAssignmentScreen.tsx',
  'screens/sales/PurchaseOrderDetailScreen.tsx',
  'screens/sales/PurchaseOrderReceiptScreen.tsx',
  'screens/sales/PurchaseOrderPayoutScreen.tsx',
  'screens/sales/PurchaseSalesOrdersScreen.tsx',
  'screens/sales/SalesOrderDetailScreen.tsx',
  'screens/reports/AnnouncementsScreen.tsx',
  'screens/certifications/AdminComplianceTiersScreen.tsx',
  'screens/config/SystemAuditLogsScreen.tsx',
  'screens/reports/SystemAlertsScreen.tsx',
  'screens/config/SystemConfigScreen.tsx',
  'screens/reports/AdminReportsMainScreen.tsx',
  'screens/reports/RecentReportDetailScreen.tsx',
  'screens/reports/AllRecentReportsScreen.tsx',
  'screens/reports/AnalyticsDashboardScreen.tsx',
  'screens/reports/FarmerPerformanceReportScreen.tsx',
  'screens/reports/WarehouseOpsReportScreen.tsx',
  'screens/certifications/AdminCertVerificationScreen.tsx',
];

async function flush() {
  for (let i = 0; i < 4; i++) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
  }
}

async function renderWithQuery(el: React.ReactElement): Promise<renderer.ReactTestRenderer> {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(
      React.createElement(QueryClientProvider, { client }, el),
    );
  });
  await flush();
  return tree;
}

function collectText(node: ReactTestInstance): string {
  const out: string[] = [];
  const visit = (n: ReactTestInstance) => {
    if ((n.type as unknown) === 'Text') {
      const text = [n.props.children].flat(Infinity).filter((c) => c !== null && c !== undefined).join('');
      if (text) out.push(text);
    }
    if ((n.type as unknown) === 'Card') {
      if (n.props.title) out.push(String(n.props.title));
      if (n.props.value !== undefined) out.push(String(n.props.value));
      if (n.props.subtitle) out.push(String(n.props.subtitle));
    }
    for (const child of n.children) {
      if (typeof child !== 'string') visit(child);
    }
  };
  visit(node);
  return out.join(' | ');
}

function findButtonByText(root: ReactTestInstance, label: string): ReactTestInstance | undefined {
  return root.findAll((n) => (n.type as unknown) === 'TouchableOpacity' && collectText(n).includes(label))[0];
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.listAdminOrders.mockResolvedValue({ items: [], page: { nextCursor: null, hasMore: false } });
  mocks.packOrder.mockResolvedValue({ id: 'ord-1', status: 'PACKED' });
  mocks.getInvoiceDownloadUrl.mockResolvedValue('https://example.com/inv.pdf');
  mocks.getSalesReport.mockResolvedValue({
    from: '2026-10-01',
    to: '2026-10-31',
    warehouseId: null,
    count: 5,
    total: '12500.00',
    averageOrderValue: '2500.00',
    byDay: [{ date: '2026-10-30', count: 5, total: '12500.00' }],
    byChannel: [],
    byStatus: [],
  });
  mocks.getCustomersReport.mockResolvedValue({
    from: '2026-10-01',
    to: '2026-10-31',
    warehouseId: null,
    customersWithOrders: 42,
    newCustomers: 9,
    byDay: [{ date: '2026-10-30', count: 4 }],
  });
  mocks.getInventoryReport.mockResolvedValue({
    from: null,
    to: null,
    warehouseId: null,
    items: [{ cropId: 'c1', name: 'Carrot', totalQty: '100.000', batchCount: 3 }],
  });
  mocks.useFarmerSummary.mockReturnValue({ summary: { pendingApplications: 3, activeFarmers: 18 }, error: null, isLoading: false });
  mocks.useFarmerList.mockReturnValue({ items: [], error: null, isLoading: false, refresh: vi.fn() });
  mocks.listAdminAnnouncements.mockResolvedValue({ items: [], page: { nextCursor: null, hasMore: false } });
  mocks.createAnnouncementMutateAsync.mockResolvedValue({ id: 'ann-1' });
  mocks.listAlerts.mockResolvedValue({
    items: [{ itemKey: 'alert-1', type: 'LOW_STOCK', warehouseId: 'wh-1' }],
    page: { nextCursor: null, hasMore: false },
  });
  mocks.dismissAlert.mockResolvedValue(undefined);
  mocks.verifyCertification.mockResolvedValue({ id: 'cert-1', verificationStatus: 'VERIFIED' });
  mocks.useCertificationList.mockReturnValue({ items: [], isLoading: false, error: null, refresh: vi.fn() });
  mocks.useWarehouseOptions.mockReturnValue({
    options: [{ warehouseId: 'wh-uuid-1', warehouseName: 'Ooty Hub', code: 'OOTY' }],
    isLoading: false,
    error: null,
    refresh: vi.fn(),
  });
  mocks.listWarehouses.mockResolvedValue({ items: [], page: 1, pageSize: 20, total: 0 });
  mocks.getWarehouseCapacity.mockResolvedValue({ warehouseId: 'wh-1', capacityKg: null, usedKg: '0.000', availableKg: null, utilizationPercent: null });
  mocks.getTransferStatusCounts.mockResolvedValue({ PENDING_APPROVAL: 0, IN_TRANSIT: 0, COMPLETED: 0, REJECTED: 0 });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('Brief 07 P1-P4 source guard (Sales, Reports, Config, Certifications)', () => {
  it('uses ADMIN_NO_VALUE instead of literal em-dash in edited screens', () => {
    const allowedCommentOrHeadingLines = (rel: string, line: string) =>
      (rel === 'screens/certifications/AdminComplianceTiersScreen.tsx' && /Excellent|Good|Moderate|Poor/.test(line)) ||
      (rel === 'screens/sales/PurchaseOrderDetailScreen.tsx' && /DIRECT APPROVAL/.test(line)) ||
      (rel === 'screens/sales/SalesFulfillmentAssignmentScreen.tsx' && /awaiting OTP/.test(line));

    const hits: string[] = [];
    for (const rel of WIRING_FILES) {
      const clean = stripComments(fs.readFileSync(path.join(ADMIN_DIR, rel), 'utf8'));
      clean.split('\n').forEach((line, idx) => {
        if (line.includes('—') && !allowedCommentOrHeadingLines(rel, line)) {
          hits.push(`${rel}:${idx + 1}: ${line.trim()}`);
        }
      });
    }
    expect(hits).toEqual([]);
  });

  it('carries none of the deleted fixture blocks, invented IDs, q: "", or catch-success alerts', () => {
    const FORBIDDEN: readonly [string, RegExp][] = [
      ['deleted fixture symbol', /\b(DEMO_ONLINE_ORDERS|RECENT_DOCS|RECENT_REPORTS_DATA|FALLBACK_AUDIT_LOGS|fallbackAlerts|WAREHOUSES_DATA|PERFORMANCE_DATA_MATRIX)\b/],
      ['fabricated prefix/ID', /`(?:GR|PY|CALC|PAY|LST)-\$\{|'GR-0008'|'FMR-00098'|'127\.0\.0\.1'|'#8492'|'33AABCT1234D1Z5'|'12 Oct 2026'/],
      ['blank search param q: ""', /\bq:\s*''/],
      ['fake offline/saved alerts', /Warehouse_Operations_Report\.pdf|Configuration Saved|Report link copied/],
    ];
    const hits: string[] = [];
    for (const rel of WIRING_FILES) {
      const clean = stripComments(fs.readFileSync(path.join(ADMIN_DIR, rel), 'utf8'));
      for (const [label, re] of FORBIDDEN) {
        if (re.test(clean)) hits.push(`${rel}: ${label}`);
      }
    }
    expect(hits).toEqual([]);
  });
});

describe('Sales screen wiring', () => {
  it('SalesOnlineOrdersScreen filters by channel ONLINE and avoids invented buyer/location strings', async () => {
    mocks.listAdminOrders.mockResolvedValueOnce({
      items: [
        {
          id: 'ord-1',
          orderNumber: 'ORD-501',
          status: 'CONFIRMED',
          total: '450.00',
          placedAt: '2026-10-10T09:00:00Z',
          customerName: null,
          warehouseName: null,
        },
      ],
      page: { nextCursor: null, hasMore: false },
    });

    const tree = await renderWithQuery(<SalesOnlineOrdersScreen />);
    expect(mocks.listAdminOrders).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'ONLINE' }),
      expect.any(AbortSignal),
    );
    const text = collectText(tree.root);
    expect(text).toContain('ORD-501');
    expect(text).toContain(ADMIN_NO_VALUE);
    expect(text).not.toContain('Online Buyer');
  });

  it('SalesFulfillmentAssignmentScreen disables Mark as Packed without orderId and calls packOrder when orderId is provided', async () => {
    const noIdTree = await renderWithQuery(<SalesFulfillmentAssignmentScreen />);
    const disabledBtn = findButtonByText(noIdTree.root, 'Mark as Packed');
    expect(disabledBtn?.props.disabled).toBe(true);
    expect(collectText(noIdTree.root)).toContain(t('wiringSales.fulfillment.packUnavailable'));

    const withIdTree = await renderWithQuery(
      <SalesFulfillmentAssignmentScreen orderId="ord-uuid-9" orderNumber="ORD-9" />,
    );
    const packBtn = findButtonByText(withIdTree.root, 'Mark as Packed');
    expect(packBtn?.props.disabled).toBeFalsy();
    await act(async () => {
      packBtn!.props.onPress();
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(mocks.packOrder).toHaveBeenCalledWith(
      'ord-uuid-9',
      {},
      expect.stringMatching(/^pack-ord-uuid-9-/),
    );
    expect(mocks.alert).toHaveBeenCalledWith(
      t('wiringSales.fulfillment.packSuccessTitle'),
      t('wiringSales.fulfillment.packSuccessBody', { order: 'ORD-9' }),
      expect.any(Array),
    );
  });

  it('SalesInvoiceScreen disables Download PDF without invoiceId and opens signed URL when invoiceId exists', async () => {
    const disabledTree = await renderWithQuery(<SalesInvoiceScreen />);
    const disabledBtn = findButtonByText(disabledTree.root, t('wiringSales.invoice.downloadPdf'));
    expect(disabledBtn?.props.disabled).toBe(true);
    expect(collectText(disabledTree.root)).toContain(t('wiringSales.invoice.downloadUnavailable'));

    const liveTree = await renderWithQuery(<SalesInvoiceScreen invoiceId="inv-uuid-1" total={500} />);
    const dlBtn = findButtonByText(liveTree.root, t('wiringSales.invoice.downloadPdf'));
    expect(dlBtn?.props.disabled).toBeFalsy();
    await act(async () => {
      dlBtn!.props.onPress();
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(mocks.getInvoiceDownloadUrl).toHaveBeenCalledWith('inv-uuid-1');
    expect(mocks.openURL).toHaveBeenCalledWith('https://example.com/inv.pdf');
  });
});

describe('Reports, Alerts, Announcements & Certifications wiring', () => {
  it('AnalyticsDashboardScreen queries live date ranges and shows honest labels across Customers, Warehouses, and Sales tabs', async () => {
    const tree = await renderWithQuery(<AnalyticsDashboardScreen onBack={() => undefined} />);
    // Farmers tab shows real summary counts and no static fake numbers like 142
    expect(collectText(tree.root)).toContain(t('wiringReports.analytics.activeFarmers'));
    expect(collectText(tree.root)).not.toContain('142');

    // Open category dropdown and switch to Customers
    const selector = findButtonByText(tree.root, 'Selected Analytics');
    await act(async () => {
      selector!.props.onPress();
    });
    const custChoice = findButtonByText(tree.root, 'Customers Analytics');
    await act(async () => {
      custChoice!.props.onPress();
    });
    await flush();
    expect(mocks.getCustomersReport).toHaveBeenCalledWith(
      expect.objectContaining({
        from: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        to: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      }),
      expect.any(AbortSignal),
    );
    const custText = collectText(tree.root);
    expect(custText).toContain('Active Buyers');
    expect(custText).toContain(t('wiringReports.analytics.newCustomers'));
    expect(custText).not.toContain('70%');

    // Switch to Sales
    await act(async () => {
      findButtonByText(tree.root, 'Selected Analytics')!.props.onPress();
    });
    await act(async () => {
      findButtonByText(tree.root, 'Sales Analytics')!.props.onPress();
    });
    await flush();
    expect(mocks.getSalesReport).toHaveBeenCalled();
    const salesText = collectText(tree.root);
    expect(salesText).toContain(t('wiringReports.analytics.salesOrderCount'));
    expect(salesText).toContain(t('wiringReports.analytics.salesAvgOrderValue'));
    expect(salesText).not.toContain('74%');
  });

  it('AnnouncementsScreen surfaces server errors cleanly and succeeds only when mutation resolves', async () => {
    const tree = await renderWithQuery(<AnnouncementsScreen onBack={() => undefined} />);
    const plusBtn = tree.root.findAll((n) => (n.type as unknown) === 'TouchableOpacity')[1]!;
    await act(async () => {
      plusBtn.props.onPress();
    });

    const inputs = tree.root.findAll((n) => (n.type as unknown) === 'TextInput');
    // index 0 is disabled Audience input, index 1 is Title, index 2 is Message
    act(() => {
      inputs[1]!.props.onChangeText('Harvest Notice');
      inputs[2]!.props.onChangeText('Bring clean crates tomorrow.');
    });

    mocks.createAnnouncementMutateAsync.mockRejectedValueOnce(new Error('Network down'));
    await act(async () => {
      await findButtonByText(tree.root, 'Broadcast Announcement')!.props.onPress();
    });
    expect(mocks.alert).toHaveBeenCalledWith(
      t('wiringReports.announcements.broadcastFailedTitle'),
      'Network down',
    );
    // Form stays open on failure
    expect(findButtonByText(tree.root, 'Broadcast Announcement')).toBeDefined();

    mocks.createAnnouncementMutateAsync.mockResolvedValueOnce({ id: 'ann-2' });
    await act(async () => {
      await findButtonByText(tree.root, 'Broadcast Announcement')!.props.onPress();
    });
    expect(mocks.alert).toHaveBeenCalledWith(
      t('wiringReports.announcements.broadcastSuccessTitle'),
      t('wiringReports.announcements.broadcastSuccessBody'),
    );
  });

  it('SystemAlertsScreen keeps alert when dismissAlert rejects, removes it when resolved, and disables Save Thresholds', async () => {
    const tree = await renderWithQuery(<SystemAlertsScreen onBack={() => undefined} />);
    expect(collectText(tree.root)).toContain('Low stock threshold reached');

    // Dismiss failure keeps alert visible
    mocks.dismissAlert.mockRejectedValueOnce(new Error('Server error'));
    const dismissButtons = tree.root.findAll(
      (n) => (n.type as unknown) === 'TouchableOpacity' && typeof n.props.onPress === 'function' && n.props.hitSlop?.top === 12,
    );
    await act(async () => {
      await dismissButtons[0]!.props.onPress();
    });
    expect(mocks.alert).toHaveBeenCalledWith(
      t('wiringReports.alerts.dismissFailedTitle'),
      t('wiringReports.alerts.dismissFailedBody'),
    );
    expect(collectText(tree.root)).toContain('Low stock threshold reached');

    // Dismiss success removes it
    mocks.dismissAlert.mockResolvedValueOnce(undefined);
    await act(async () => {
      await dismissButtons[0]!.props.onPress();
    });
    expect(collectText(tree.root)).not.toContain('Low stock threshold reached');

    // Configure Thresholds save button is disabled
    await act(async () => {
      findButtonByText(tree.root, 'Configure Alert Thresholds')!.props.onPress();
    });
    const saveBtn = findButtonByText(tree.root, 'Save Thresholds');
    expect(saveBtn?.props.disabled).toBe(true);
  });

  it('AdminCertVerificationScreen disables verify without ID and calls verifyCertification when ID is present', async () => {
    const noIdTree = await renderWithQuery(<AdminCertVerificationScreen onBack={() => undefined} />);
    const disabledVerify = findButtonByText(noIdTree.root, 'Mark as Verified');
    expect(disabledVerify?.props.disabled).toBe(true);

    const onVerified = vi.fn();
    const withIdTree = await renderWithQuery(
      <AdminCertVerificationScreen certificationId="cert-uuid-1" onBack={() => undefined} onVerified={onVerified} />,
    );
    const verifyBtn = findButtonByText(withIdTree.root, 'Mark as Verified');
    expect(verifyBtn?.props.disabled).toBe(false);
    await act(async () => {
      verifyBtn!.props.onPress();
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(mocks.verifyCertification).toHaveBeenCalledWith(
      'cert-uuid-1',
      {},
      expect.stringMatching(/^cert-verify-cert-uuid-1-/),
    );
    expect(onVerified).toHaveBeenCalledTimes(1);
    expect(collectText(withIdTree.root)).toContain('Verified');
  });
});
