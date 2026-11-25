/**
 * Brief 07, work stream W1 (P1 #13, P2, P3 Finance): the four finance report
 * screens ask for real report dates, show no figure computed on the phone, and
 * offer no export the server cannot produce.
 *
 *   GET /admin/finance/reports/revenue   from/to required, YYYY-MM-DD (BR-63)
 *   GET /admin/finance/reports/expenses  from/to required, YYYY-MM-DD (BR-62, BR-63)
 *
 * The range sent is the one the screen's own label states: MTD is the 1st of
 * this month to today, "Last 30 Days" is today-29 to today. There is no
 * /admin/exports/* endpoint for a P&L, so every P&L export is disabled.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { act } from 'react-test-renderer';
import type * as FinanceModule from '../api/finance';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Alert: { alert: vi.fn() },
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  Linking: { openURL: vi.fn() },
  Modal: 'Modal',
  Platform: { OS: 'android', select: (o: Record<string, unknown>) => o['android'] ?? o['default'] },
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  StatusBar: 'StatusBar',
  StyleSheet: { create: (s: Record<string, unknown>) => s, flatten: (s: unknown) => s, absoluteFill: {}, hairlineWidth: 1 },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));
vi.mock('react-native-svg', () => ({ default: 'Svg', Circle: 'Circle', Path: 'Path', Rect: 'Rect', Line: 'Line', Ellipse: 'Ellipse', G: 'G' }));
vi.mock('@tohfa/mobile-ui', () => ({ Icon: 'Icon', SafeAreaView: 'SafeAreaView', ScreenStatusBar: 'ScreenStatusBar' }));

const api = vi.hoisted(() => ({
  getFinanceRevenueReport: vi.fn(),
  getFinanceExpenseReport: vi.fn(),
  listFinanceRevenue: vi.fn(),
  listPayoutDues: vi.fn(),
  listAllWarehouses: vi.fn(),
}));
vi.mock('../api/finance', async (importOriginal) => ({
  ...(await importOriginal<typeof FinanceModule>()),
  getFinanceRevenueReport: api.getFinanceRevenueReport,
  getFinanceExpenseReport: api.getFinanceExpenseReport,
  listFinanceRevenue: api.listFinanceRevenue,
}));
vi.mock('../api/payoutDues', () => ({ listPayoutDues: api.listPayoutDues }));
vi.mock('../api/warehouseList', () => ({ listAllWarehouses: api.listAllWarehouses }));

// FinanceManagementFlow's sub-screens belong to other work streams; only the overview is under test.
const { stub } = vi.hoisted(() => ({ stub: (_name: string) => () => null }));
vi.mock('../screens/warehouse/finance-expenses', () => ({ FinanceFlow: stub('FinanceFlow') }));
vi.mock('../screens/warehouse/sales-direct', () => ({ SalesFlow: stub('SalesFlow') }));
vi.mock('../screens/warehouse/wallet-cashtopup', () => ({ WalletFlow: stub('WalletFlow') }));
vi.mock('../screens/finance/WalletDeductionFlow', () => ({ WalletDeductionFlow: stub('WalletDeductionFlow') }));
vi.mock('../screens/finance/PaymentMethodsScreen', () => ({ PaymentMethodsScreen: stub('PaymentMethodsScreen') }));
vi.mock('../screens/finance/PurchaseDuesPayoutsScreen', () => ({ PurchaseDuesPayoutsScreen: stub('PurchaseDuesPayoutsScreen') }));
vi.mock('../screens/finance/ReturnsRmaRefundsScreen', () => ({ ReturnsRmaRefundsScreen: stub('ReturnsRmaRefundsScreen') }));
vi.mock('../screens/finance/PayoutTransactionsListScreen', () => ({ PayoutTransactionsListScreen: stub('PayoutTransactionsListScreen') }));
vi.mock('../screens/finance/PayoutBatchListScreen', () => ({ PayoutBatchListScreen: stub('PayoutBatchListScreen') }));
vi.mock('../screens/finance/SalesIncomeRevenueScreen', () => ({ SalesIncomeRevenueScreen: stub('SalesIncomeRevenueScreen') }));
vi.mock('../screens/finance/InvoicesGstBillingScreen', () => ({ InvoicesGstBillingScreen: stub('InvoicesGstBillingScreen') }));
vi.mock('../screens/finance/TransactionHistoryScreen', () => ({ TransactionHistoryScreen: stub('TransactionHistoryScreen') }));
vi.mock('../screens/finance/ReportsExportScreen', () => ({ ReportsExportScreen: stub('ReportsExportScreen') }));

import { Alert } from 'react-native';
import { FinancialDashboardScreen } from '../screens/finance/FinancialDashboardScreen';
import { FinanceManagementFlow } from '../screens/finance/FinanceManagementFlow';
import { ProfitLossScreen } from '../screens/finance/ProfitLossScreen';
import { PLStatementScreen } from '../screens/finance/PLStatementScreen';
import { ADMIN_NO_VALUE } from '../utils/noValue';
import { allText, byId, expectUnavailable, ISO_DAY, mount, rangesOf, W1_NOW } from './w1_harness';

const noop = () => undefined;
const alertMock = vi.mocked(Alert.alert);

const revenueReport = (total: string) => ({
  from: '2026-11-01',
  to: '2026-11-25',
  summary: { count: 4, total },
  byDay: [],
  byChannel: [
    { channel: 'ONLINE', count: 3, total: '700.00' },
    { channel: 'HORECA', count: 1, total: '300.00' },
  ],
  byPaymentMethod: [],
});
const expenseReport = (total: string) => ({
  from: '2026-11-01',
  to: '2026-11-25',
  summary: { count: 2, total },
  byDay: [],
  byCategory: [{ category: 'Transport', count: 2, total }],
  byPaymentMethod: [],
});

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(W1_NOW);
  for (const fn of Object.values(api)) fn.mockReset();
  alertMock.mockReset();
  api.getFinanceRevenueReport.mockResolvedValue(revenueReport('1000.00'));
  api.getFinanceExpenseReport.mockResolvedValue(expenseReport('400.00'));
  api.listFinanceRevenue.mockResolvedValue({ items: [], summary: { count: 0, total: '0.00', byChannel: [] }, page: { nextCursor: null, hasMore: false } });
  api.listPayoutDues.mockResolvedValue({ items: [], page: { nextCursor: null, hasMore: false }, totals: { totalDue: '2500.00', farmerCount: 3 } });
  api.listAllWarehouses.mockResolvedValue(
    ['Ooty Main', 'Coonoor', 'Kotagiri', 'Gudalur', 'Nilgiri'].map((name, i) => ({
      id: `00000000-0000-4000-8000-00000000000${i}`,
      code: `WH-${i}`,
      name,
      type: i === 0 ? 'MAIN' : 'SUB',
      isActive: true,
    })),
  );
});
afterEach(() => {
  vi.useRealTimers();
});

function expectEveryRange(ranges: { from: string; to: string }[], expected: { from: string; to: string }) {
  expect(ranges.length).toBeGreaterThan(0);
  for (const r of ranges) {
    expect(r.from).toMatch(ISO_DAY);
    expect(r.to).toMatch(ISO_DAY);
    expect(r).toEqual(expected);
  }
}

describe('P2: finance report requests carry real dates', () => {
  it('FinancialDashboardScreen asks for month to date (its "MTD" label)', async () => {
    await mount(<FinancialDashboardScreen onBack={noop} onNavigate={noop} />);
    expectEveryRange(rangesOf(api.getFinanceExpenseReport), { from: '2026-11-01', to: '2026-11-25' });
    for (const r of rangesOf(api.getFinanceRevenueReport)) expect(r).toEqual({ from: '2026-11-01', to: '2026-11-25' });
  });

  it('FinanceManagementFlow asks for the last 30 days (its "Last 30 Days" label)', async () => {
    await mount(<FinanceManagementFlow onBack={noop} />);
    expectEveryRange(rangesOf(api.getFinanceRevenueReport), { from: '2026-10-27', to: '2026-11-25' });
    expectEveryRange(rangesOf(api.getFinanceExpenseReport), { from: '2026-10-27', to: '2026-11-25' });
  });

  it('ProfitLossScreen derives the range from the period picker', async () => {
    const tree = await mount(<ProfitLossScreen onBack={noop} />);
    expectEveryRange(rangesOf(api.getFinanceRevenueReport), { from: '2026-11-01', to: '2026-11-25' });
    expectEveryRange(rangesOf(api.getFinanceExpenseReport), { from: '2026-11-01', to: '2026-11-25' });

    await act(async () => byId(tree, 'finance.profitLoss.period')[0]!.props.onPress());
    const buttons = alertMock.mock.calls.at(-1)![2] as { text: string; onPress?: () => void }[];
    await act(async () => buttons.find((b) => b.text === 'Last Month')!.onPress!());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(rangesOf(api.getFinanceRevenueReport).at(-1)).toEqual({ from: '2026-10-01', to: '2026-10-31' });
    expect(rangesOf(api.getFinanceExpenseReport).at(-1)).toEqual({ from: '2026-10-01', to: '2026-10-31' });
  });

  it('ProfitLossScreen "This Year" is the calendar year: Jan 1 to today (owner decision)', async () => {
    const tree = await mount(<ProfitLossScreen onBack={noop} />);
    await act(async () => byId(tree, 'finance.profitLoss.period')[0]!.props.onPress());
    const buttons = alertMock.mock.calls.at(-1)![2] as { text: string; onPress?: () => void }[];
    await act(async () => buttons.find((b) => b.text === 'This Year')!.onPress!());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(rangesOf(api.getFinanceRevenueReport).at(-1)).toEqual({ from: '2026-01-01', to: '2026-11-25' });
    expect(rangesOf(api.getFinanceExpenseReport).at(-1)).toEqual({ from: '2026-01-01', to: '2026-11-25' });
    expect(allText(tree)).toContain('₹1,000');
  });

  it('ProfitLossScreen offers no warehouse filter the report endpoint cannot apply', async () => {
    const tree = await mount(<ProfitLossScreen onBack={noop} />);
    expectUnavailable(tree, 'finance.profitLoss.warehouse');
  });

  it('PLStatementScreen asks for month to date', async () => {
    await mount(<PLStatementScreen onBack={noop} />);
    expectEveryRange(rangesOf(api.getFinanceRevenueReport), { from: '2026-11-01', to: '2026-11-25' });
    expectEveryRange(rangesOf(api.getFinanceExpenseReport), { from: '2026-11-01', to: '2026-11-25' });
  });
});

describe('BR-63: reports return raw sums only, so no profit or margin is computed on the phone', () => {
  // Revenue 1000, expenses 400: a computed profit would read 600 and a margin 60%.
  const computed = ['₹600', '60%', '60% Margin'];

  it.each([
    ['FinancialDashboardScreen', () => <FinancialDashboardScreen onBack={noop} onNavigate={noop} />],
    ['ProfitLossScreen', () => <ProfitLossScreen onBack={noop} />],
    ['PLStatementScreen', () => <PLStatementScreen onBack={noop} />],
  ])('BR-63: %s shows no computed profit or margin', async (_name, el) => {
    const tree = await mount(el());
    const text = allText(tree);
    for (const c of computed) expect(text).not.toContain(c);
    expect(text).toContain(ADMIN_NO_VALUE);
  });

  it('BR-63: FinancialDashboardScreen dashes "Net Revenue" (the API gives gross) and shows the real expense total', async () => {
    const tree = await mount(<FinancialDashboardScreen onBack={noop} onNavigate={noop} />);
    const text = allText(tree);
    expect(text).not.toContain('₹1,000');
    expect(text).toContain('₹400');
  });

  it('BR-63: PLStatementScreen adds no channel totals together on the phone', async () => {
    const tree = await mount(<PLStatementScreen onBack={noop} />);
    // ONLINE 700 is shown as sent; HORECA + B2B would only be a sum.
    const text = allText(tree);
    expect(text).toContain('₹700');
    expect(text).not.toContain('₹300');
  });
});

describe('P1 #13: no fake export', () => {
  it('PLStatementScreen export is disabled and shows nothing', async () => {
    const tree = await mount(<PLStatementScreen onBack={noop} />);
    expectUnavailable(tree, 'finance.plStatement.export');
    expect(alertMock).not.toHaveBeenCalled();
  });

  it('ProfitLossScreen export is disabled on both tabs', async () => {
    const tree = await mount(<ProfitLossScreen onBack={noop} />);
    expectUnavailable(tree, 'finance.profitLoss.export');
    await act(async () => byId(tree, 'finance.profitLoss.segment.warehouse')[0]!.props.onPress());
    expectUnavailable(tree, 'finance.profitLoss.export');
  });

  it('FinanceManagementFlow download is disabled and no "export initiated" toast appears', async () => {
    const tree = await mount(<FinanceManagementFlow onBack={noop} />);
    expectUnavailable(tree, 'finance.flow.export');
    expect(allText(tree).toLowerCase()).not.toContain('export initiated');
  });
});

describe('P3: FinanceManagementFlow puts each value only under the label that means it', () => {
  it('only "Outstanding Dues" gets the dues total; purchase value, pending payouts and net summary are dashed', async () => {
    const tree = await mount(<FinanceManagementFlow onBack={noop} />);
    const text = allText(tree);
    // ₹2,500 is the dues total: exactly one KPI card may show it.
    expect(text.split('₹2,500').length - 1).toBe(1);
    // Sales (₹1,000) appears once, as Sales; never again as "Net Financial Summary".
    expect(text.split('₹1,000').length - 1).toBe(1);
    expect(text).not.toContain('14 Oct 2026');
  });

  it('lists every warehouse the server returns', async () => {
    const tree = await mount(<FinanceManagementFlow onBack={noop} />);
    expect(allText(tree)).toContain('Nilgiri');
  });
});
