/**
 * Brief 07, work stream W1 (P1 #10, #11, #12, #14; P3 Finance; P4): the
 * ledger, invoice, GST, expense, sales-income, history and export screens.
 *   - a control with no endpoint is drawn disabled and reports nothing (R3)
 *   - a counter is the server's total, never one page's length (R4)
 *   - no identifier or name is built out of a UUID or another field (R9)
 *   - drill-down opens the live detail screen with the real id (R2)
 *   - the demo export list is gone (P4, R10)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { act } from 'react-test-renderer';
import type * as FinanceModule from '../api/finance';
import type * as InvoicesModule from '../api/invoices';

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
  listExpenses: vi.fn(),
  listFinanceRevenue: vi.fn(),
  listInvoices: vi.fn(),
  getInvoiceSummary: vi.fn(),
  getInvoiceDownloadUrl: vi.fn(),
  listAllWarehouses: vi.fn(),
}));
vi.mock('../api/finance', async (importOriginal) => ({
  ...(await importOriginal<typeof FinanceModule>()),
  listExpenses: api.listExpenses,
  listFinanceRevenue: api.listFinanceRevenue,
}));
vi.mock('../api/invoices', async (importOriginal) => ({
  ...(await importOriginal<typeof InvoicesModule>()),
  listInvoices: api.listInvoices,
  getInvoiceSummary: api.getInvoiceSummary,
  getInvoiceDownloadUrl: api.getInvoiceDownloadUrl,
}));
vi.mock('../api/warehouseList', () => ({ listAllWarehouses: api.listAllWarehouses }));

// The live detail screens belong to the warehouse modules; here only the id they receive matters.
const { detail, stub } = vi.hoisted(() => {
  const detail = { props: [] as { name: string; props: Record<string, unknown> }[] };
  const stub = (name: string) => (props: Record<string, unknown>) => {
    detail.props.push({ name, props });
    return null;
  };
  return { detail, stub };
});
vi.mock('../screens/warehouse/finance-expenses', () => ({
  ExpenseDetailScreen: stub('ExpenseDetailScreen'),
  RevenueDetailScreen: stub('RevenueDetailScreen'),
}));
vi.mock('../screens/warehouse/billing-invoices', () => ({ LiveInvoiceDetail: stub('LiveInvoiceDetail') }));
vi.mock('../screens/warehouse/reports', () => ({ ReportsScreen: stub('ReportsScreen') }));
vi.mock('../screens/finance/PreviewReportsScreen', () => ({ PreviewReportsScreen: stub('PreviewReportsScreen') }));
vi.mock('../screens/sales/SalesOrderDetailScreen', () => ({ SalesOrderDetailScreen: stub('SalesOrderDetailScreen') }));
vi.mock('../screens/sales/SalesInvoiceScreen', () => ({ SalesInvoiceScreen: stub('SalesInvoiceScreen') }));

import { Alert, Linking } from 'react-native';
import { AddManualJournalEntryScreen } from '../screens/finance/AddManualJournalEntryScreen';
import { BasicAccountingLedgerScreen } from '../screens/finance/BasicAccountingLedgerScreen';
import { ExpensesScreen } from '../screens/finance/ExpensesScreen';
import { GSTFilingReportDetailScreen } from '../screens/finance/GSTFilingReportDetailScreen';
import { InvoicesGstBillingScreen } from '../screens/finance/InvoicesGstBillingScreen';
import { ReportsExportScreen } from '../screens/finance/ReportsExportScreen';
import { SalesIncomeRevenueScreen } from '../screens/finance/SalesIncomeRevenueScreen';
import { TransactionHistoryScreen } from '../screens/finance/TransactionHistoryScreen';
import { allText, byId, expectUnavailable, ISO_DAY, mount, W1_NOW } from './w1_harness';

const noop = () => undefined;
const allow = () => true;
const alertMock = vi.mocked(Alert.alert);
const openUrlMock = vi.mocked(Linking.openURL);

const ORDER_ID = '7d1c2b3a-4e5f-4a6b-8c7d-9e0f1a2b3c4d';
const EXPENSE_ID = '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d';
const INVOICE_ID = '9f8e7d6c-5b4a-4392-8170-6f5e4d3c2b1a';
const WAREHOUSE_ID = '00000000-0000-4000-8000-0000000000a1';

const revenueItem = (paymentStatus: string) => ({
  orderId: ORDER_ID,
  channel: 'HORECA',
  paymentMethod: 'UPI',
  paymentStatus,
  status: 'DELIVERED',
  totalAmount: '1200.00',
  gstAmount: '57.14',
  placedAt: '2026-11-20T04:30:00Z',
  completedAt: '2026-11-21T04:30:00Z',
  warehouseId: WAREHOUSE_ID,
});
const expenseItem = {
  id: EXPENSE_ID,
  warehouseId: WAREHOUSE_ID,
  categoryId: null,
  category: 'Transport',
  amount: '350.00',
  expenseDate: '2026-11-22',
  paymentMethod: 'CASH',
  vendor: 'Nilgiri Movers',
  description: null,
  status: 'RECORDED',
  recordedBy: '0f0e0d0c-0b0a-4909-8807-060504030201',
  createdAt: '2026-11-22T05:00:00Z',
};
const invoiceItem = (status: string) => ({
  id: INVOICE_ID,
  invoiceNumber: 'INV-2026-000123',
  invoiceType: 'SALE_B2B',
  orderId: ORDER_ID,
  issueDate: '2026-11-23',
  taxableAmount: '1142.86',
  totalAmount: '1200.00',
  gstApplicable: true,
  status,
});

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(W1_NOW);
  for (const fn of Object.values(api)) fn.mockReset();
  alertMock.mockReset();
  openUrlMock.mockReset();
  detail.props = [];
  api.listExpenses.mockResolvedValue({ items: [expenseItem], summary: { count: 41, total: '9100.00' }, page: { nextCursor: 'c2', hasMore: true } });
  api.listFinanceRevenue.mockResolvedValue({
    items: [revenueItem('PAID')],
    summary: { count: 57, total: '88000.00', byChannel: [] },
    page: { nextCursor: 'c2', hasMore: true },
  });
  api.listInvoices.mockResolvedValue({ items: [invoiceItem('ISSUED')], page: { nextCursor: 'c2', hasMore: true } });
  api.getInvoiceSummary.mockResolvedValue({ count: 37, totalAmount: '64000.00', byStatus: [], byType: [] });
  api.listAllWarehouses.mockResolvedValue([{ id: WAREHOUSE_ID, code: 'WH-OOTY', name: 'Ooty Main', type: 'MAIN', isActive: true }]);
});

describe('P1 #10: manual journal entry has no endpoint', () => {
  it('the Post button is drawn disabled and nothing reports success', async () => {
    const tree = await mount(<AddManualJournalEntryScreen onBack={noop} />);
    expectUnavailable(tree, 'finance.journal.submit');
    expect(alertMock).not.toHaveBeenCalled();
  });
});

describe('BR-62: expenses are only recorded, never approved or verified (P1 #11)', () => {
  it('BR-62: the designed approve control is disabled and nothing reports success', async () => {
    const tree = await mount(<ExpensesScreen onBack={noop} onNavigateToAddExpense={noop} />);
    expectUnavailable(tree, 'finance.expenses.approve');
    expect(alertMock).not.toHaveBeenCalled();
  });

  it('BR-62: the list is the live expense list for this month (its label), with the real category and amount', async () => {
    const tree = await mount(<ExpensesScreen onBack={noop} onNavigateToAddExpense={noop} />);
    const params = api.listExpenses.mock.calls[0]![0] as { from: string; to: string };
    expect(params.from).toMatch(ISO_DAY);
    expect(params).toMatchObject({ from: '2026-11-01', to: '2026-11-25' });
    const text = allText(tree);
    expect(text).toContain('Transport');
    expect(text).toContain('₹350');
    expect(text).not.toContain('awaiting approval · this month\n18');
  });
});

describe('P1 #12: GSTR-1 export has no endpoint', () => {
  it('the export is disabled; the counter is the server count and taxable sales are dashed', async () => {
    const tree = await mount(<GSTFilingReportDetailScreen onBack={noop} />);
    expectUnavailable(tree, 'finance.gstFiling.export');
    const text = allText(tree);
    expect(text).toContain('37');
    expect(text).not.toContain('₹64,000');
    expect(text).not.toContain('5%');
  });
});

describe('InvoicesGstBillingScreen (P1 #14, P3)', () => {
  it('Download opens the signed URL and shows no "ready" alert', async () => {
    api.getInvoiceDownloadUrl.mockResolvedValue('https://files.example/inv.pdf');
    const tree = await mount(<InvoicesGstBillingScreen onBack={noop} can={allow} />);
    await act(async () => byId(tree, `finance.invoices.download.${INVOICE_ID}`)[0]!.props.onPress());
    expect(api.getInvoiceDownloadUrl).toHaveBeenCalledWith(INVOICE_ID);
    expect(openUrlMock).toHaveBeenCalledWith('https://files.example/inv.pdf');
    expect(alertMock).not.toHaveBeenCalled();
  });

  it('the counter is the summary count, not the page length, and no UUID sits in the order-number slot', async () => {
    const tree = await mount(<InvoicesGstBillingScreen onBack={noop} can={allow} />);
    const text = allText(tree);
    expect(text).toContain('37');
    expect(text).not.toContain(ORDER_ID);
    expect(text).not.toContain('SO-');
  });

  it('CREDIT_NOTED is not shown as Cancelled', async () => {
    api.listInvoices.mockResolvedValue({ items: [invoiceItem('CREDIT_NOTED')], page: { nextCursor: null, hasMore: false } });
    const tree = await mount(<InvoicesGstBillingScreen onBack={noop} can={allow} />);
    expect(allText(tree)).not.toContain('Cancelled');
  });

  it('Details opens the live invoice with the real id', async () => {
    const tree = await mount(<InvoicesGstBillingScreen onBack={noop} can={allow} />);
    await act(async () => byId(tree, `finance.invoices.details.${INVOICE_ID}`)[0]!.props.onPress());
    const opened = detail.props.find((d) => d.name === 'LiveInvoiceDetail');
    expect(opened?.props['invoiceId']).toBe(INVOICE_ID);
  });
});

describe('SalesIncomeRevenueScreen (P3)', () => {
  it('counts with summary.count, dashes NET SALES VALUE and invents no buyer name', async () => {
    const tree = await mount(<SalesIncomeRevenueScreen onBack={noop} can={allow} />);
    const text = allText(tree);
    expect(text).toContain('57');
    expect(text).not.toContain('Buyer');
    expect(text).not.toContain(ORDER_ID);
    // ₹88,000 is gross: it may sit under GROSS SALES VALUE once, never again as NET.
    expect(text.split('₹88,000').length - 1).toBe(1);
  });

  it('does not say "Paid" for an unpaid order', async () => {
    api.listFinanceRevenue.mockResolvedValue({
      items: [revenueItem('PENDING')],
      summary: { count: 1, total: '1200.00', byChannel: [] },
      page: { nextCursor: null, hasMore: false },
    });
    const tree = await mount(<SalesIncomeRevenueScreen onBack={noop} can={allow} />);
    expect(allText(tree)).not.toContain('Paid');
  });
});

describe('TransactionHistoryScreen (P3)', () => {
  it('builds no SO- number and does not call gstApplicable "GST registered"', async () => {
    const tree = await mount(<TransactionHistoryScreen onBack={noop} can={allow} />);
    const text = allText(tree);
    expect(text).not.toContain('SO-');
    expect(text).not.toContain('GST registered');
  });

  it('restores drill-down: each row opens its live detail screen with the real id', async () => {
    const tree = await mount(<TransactionHistoryScreen onBack={noop} can={allow} />);
    await act(async () => byId(tree, `finance.history.view.exp-${EXPENSE_ID}`)[0]!.props.onPress());
    expect(detail.props.find((d) => d.name === 'ExpenseDetailScreen')?.props['expenseId']).toBe(EXPENSE_ID);
  });
});

describe('BasicAccountingLedgerScreen (P3)', () => {
  it('dashes the closing balance and shows no page-length transaction count', async () => {
    const tree = await mount(<BasicAccountingLedgerScreen onBack={noop} />);
    const text = allText(tree);
    // credits 88,000 - debits 9,100 would be a computed 78,900.
    expect(text).not.toContain('78,900');
    expect(text).not.toMatch(/Transactions \(\d+\)/);
    expect(text).not.toContain(ORDER_ID);
  });
});

describe('P4: ReportsExportScreen shows no demo exports', () => {
  it('renders no sample export rows', async () => {
    const tree = await mount(<ReportsExportScreen onBack={noop} can={allow} />);
    const text = allText(tree);
    for (const sample of ['EXP-REQ', 'Expenses Export', 'Farmer Purchase & Payouts', 'Warehouse Operational Expenses', 'Ready']) {
      expect(text).not.toContain(sample);
    }
  });
});
