/**
 * roles/admin/screens/warehouse/finance-expenses/mappers.ts: finance DTOs
 * (shaped exactly like apps/api/src/modules/finance/*.schema.ts) to UI types.
 *
 * Money rule (CLAUDE.md 2.2): API decimal strings become integer paise at once.
 * BR-62: expense mapping and the strict ExpenseCreate body.
 * BR-63: revenue item, detail and reports.
 * BR-74: the daily summary is read from `system`; the cash close body.
 * BR-75: expense voucher mapping.
 */
import { describe, expect, it } from 'vitest';
import type {
  CashCloseDto,
  DailyCashSummaryDto,
  ExpenseDto,
  ExpenseVoucherDto,
  FinanceExpenseReportDto,
  FinanceRevenueDetailDto,
  FinanceRevenueItemDto,
  FinanceRevenueReportDto,
} from '../api/finance';
import {
  buildCashCloseBody,
  buildExpenseCreateBody,
  cashDifferencePaise,
  expenseStatusLabel,
  financeWarehouseFilter,
  istToday,
  mapCashClose,
  mapDailyCashSummary,
  mapExpenseCategory,
  mapExpenseRecord,
  mapExpenseReport,
  mapExpenseVoucher,
  mapRevenueDetail,
  mapRevenueRecord,
  mapRevenueReport,
  mergeFinanceHistory,
  paiseToMoneyString,
  uuidOrUndefined,
} from '../screens/warehouse/finance-expenses/mappers';

const WH = '22222222-2222-4222-8222-222222222222';
const CAT = '33333333-3333-4333-8333-333333333333';
const USER = '44444444-4444-4444-8444-444444444444';
const SUB = { warehouseId: WH };
const MAIN = {};

const EXPENSE: ExpenseDto = {
  id: '11111111-1111-4111-8111-111111111111',
  warehouseId: WH,
  categoryId: CAT,
  category: 'Transport',
  amount: '2400.50',
  expenseDate: '2026-10-13',
  paymentMethod: 'CASH',
  vendor: 'Nilgiri Freight',
  description: 'Collection point freight',
  status: 'RECORDED',
  recordedBy: USER,
  createdAt: '2026-10-13T09:30:00.000Z',
};

const REVENUE: FinanceRevenueItemDto = {
  orderId: '66666666-6666-4666-8666-666666666666',
  channel: 'MARKET',
  paymentMethod: 'WALLET',
  paymentStatus: 'PAID',
  status: 'DELIVERED',
  totalAmount: '3450.00',
  gstAmount: '164.29',
  placedAt: '2026-10-13T05:00:00.000Z',
  completedAt: '2026-10-13T05:50:00.000Z',
  warehouseId: WH,
};

const CLOSE: CashCloseDto = {
  id: '77777777-7777-4777-8777-777777777777',
  warehouseId: WH,
  date: '2026-10-13',
  openingCash: '10000.00',
  openingFrom: '2026-10-12',
  cashSales: '25000.00',
  cashTopUps: '5000.00',
  cashExpenses: '3000.00',
  expectedClosing: '37000.00',
  countedCash: '36500.00',
  difference: '-500.00',
  note: 'Drawer short',
  closedBy: USER,
  createdAt: '2026-10-13T16:00:00.000Z',
};

describe('finance-expenses/mappers', () => {
  describe('BR-62: expenses', () => {
    it('maps an Expense to integer paise, keeping the uuid as the id', () => {
      const record = mapExpenseRecord(EXPENSE);
      expect(record.id).toBe(EXPENSE.id);
      expect(record.amountPaise).toBe(240050);
      expect(record.categoryName).toBe('Transport');
      expect(record.vendor).toBe('Nilgiri Freight');
      expect(record.status).toBe('RECORDED');
      expect(record.statusLabel).toBe('Recorded');
      expect(record.paymentMethodLabel).toBe('Cash');
    });

    it('adds 0.10 + 0.20 to exactly 30 paise', () => {
      const a = mapExpenseRecord({ ...EXPENSE, amount: '0.10' });
      const b = mapExpenseRecord({ ...EXPENSE, amount: '0.20' });
      expect(a.amountPaise + b.amountPaise).toBe(30);
    });

    it('a legacy row with no payment method or category id still maps', () => {
      const record = mapExpenseRecord({ ...EXPENSE, paymentMethod: null, categoryId: null, vendor: null });
      expect(record.paymentMethodLabel).toBe('');
      expect(record.categoryName).toBe('Transport');
    });

    it('an unknown status falls back to Recorded', () => {
      // @ts-expect-error a value the client does not know yet
      expect(expenseStatusLabel('SOMETHING_NEW')).toBe('Recorded');
    });

    it('maps a category', () => {
      expect(mapExpenseCategory({ id: CAT, name: 'Maintenance' })).toEqual({ id: CAT, name: 'Maintenance' });
    });

    it('BR-62a: builds the strict ExpenseCreate body in decimal rupees, no float', () => {
      const result = buildExpenseCreateBody(
        {
          categoryId: CAT,
          amountText: '2,400.5',
          expenseDate: '2026-10-13',
          paymentMethod: 'UPI',
          vendor: '  ',
          description: ' Boxes ',
          warehouseId: undefined,
        },
        SUB,
      );
      expect(result).toEqual({
        ok: true,
        body: { categoryId: CAT, amount: '2400.50', expenseDate: '2026-10-13', paymentMethod: 'UPI', description: 'Boxes', warehouseId: WH },
      });
    });

    it('BR-62a: refuses a form with no category, a zero amount, no method, and (Main) no warehouse', () => {
      const result = buildExpenseCreateBody(
        { categoryId: undefined, amountText: '0', expenseDate: '2026-10-13', paymentMethod: undefined, vendor: '', description: '', warehouseId: 'WH-OOTY' },
        MAIN,
      );
      expect(result).toEqual({ ok: false, errors: ['category', 'amount', 'paymentMethod', 'warehouse'] });
    });
  });

  describe('BR-63: revenue', () => {
    it('maps a FinanceRevenueItem (orderId, totalAmount) to integer paise', () => {
      const record = mapRevenueRecord(REVENUE, new Date('2026-10-13T08:00:00.000Z'));
      expect(record.id).toBe(REVENUE.orderId);
      expect(record.amountPaise).toBe(345000);
      expect(record.gstPaise).toBe(16429);
      expect(record.channelLabel).toBe('Market Sale');
      expect(record.paymentMethodLabel).toBe('Wallet');
    });

    it('maps a FinanceRevenueDetail with its invoice', () => {
      const dto: FinanceRevenueDetailDto = { ...REVENUE, invoiceNumber: 'INV-2026-000845', invoiceStatus: 'ISSUED' };
      const detail = mapRevenueDetail(dto);
      expect(detail.invoiceNumber).toBe('INV-2026-000845');
      expect(detail.paymentStatus).toBe('PAID');
      expect(detail.amountPaise).toBe(345000);
    });

    it('maps the revenue and expense reports from summary.total', () => {
      const rev: FinanceRevenueReportDto = {
        from: '2026-10-01',
        to: '2026-10-13',
        summary: { count: 2, total: '100.30' },
        byDay: [{ date: '2026-10-13', count: 2, total: '100.30' }],
        byChannel: [{ channel: 'ONLINE', count: 2, total: '100.30' }],
        byPaymentMethod: [{ paymentMethod: 'UPI', count: 2, total: '100.30' }],
      };
      const exp: FinanceExpenseReportDto = {
        from: '2026-10-01',
        to: '2026-10-13',
        summary: { count: 1, total: '50.00' },
        byDay: [],
        byCategory: [{ category: 'Transport', count: 1, total: '50.00' }],
        byPaymentMethod: [{ paymentMethod: null, count: 1, total: '50.00' }],
      };
      const r = mapRevenueReport(rev);
      expect(r.totalPaise).toBe(10030);
      expect(r.byGroup[0]).toEqual({ label: 'Online', totalPaise: 10030, count: 2 });
      const e = mapExpenseReport(exp);
      expect(e.totalPaise).toBe(5000);
      expect(e.byGroup[0]?.label).toBe('Transport');
      expect(e.byPaymentMethod[0]?.label).toBe('Not recorded');
    });

    it('merges revenue and expense rows newest first, expenses negative', () => {
      const rows = mergeFinanceHistory([mapRevenueRecord(REVENUE)], [mapExpenseRecord(EXPENSE)]);
      expect(rows.map((r) => r.kind)).toEqual(['expense', 'revenue']);
      expect(rows[0]?.signedPaise).toBe(-240050);
      expect(rows[1]?.signedPaise).toBe(345000);
    });
  });

  describe('BR-74: daily cash summary and close', () => {
    it('BR-74: reads the figures from `system`, the server computation', () => {
      const dto: DailyCashSummaryDto = {
        warehouseId: WH,
        date: '2026-10-13',
        system: {
          openingCash: '10000.00',
          openingFrom: '2026-10-12',
          cashSales: '25000.50',
          cashTopUps: '5000.00',
          cashExpenses: '3200.50',
          expectedClosing: '36800.00',
        },
        closed: null,
      };
      const summary = mapDailyCashSummary(dto);
      expect(summary.openingCashPaise).toBe(1000000);
      expect(summary.cashSalesPaise).toBe(2500050);
      expect(summary.cashTopUpsPaise).toBe(500000);
      expect(summary.cashExpensesPaise).toBe(320050);
      expect(summary.expectedClosingPaise).toBe(3680000);
      expect(summary.openingFrom).toBe('2026-10-12');
      expect(summary.closed).toBeNull();
    });

    it('BR-74: a stored close maps with its signed difference', () => {
      const mapped = mapCashClose(CLOSE);
      expect(mapped.countedCashPaise).toBe(3650000);
      expect(mapped.differencePaise).toBe(-50000);
      expect(mapped.createdAt).toBe(CLOSE.createdAt);
    });

    it('BR-74: builds CashCloseCreate; zero is a valid count, a short count is still sent', () => {
      expect(buildCashCloseBody({ date: '2026-10-13', countedText: '0', note: '', warehouseId: undefined }, SUB)).toEqual({
        date: '2026-10-13',
        warehouseId: WH,
        countedCash: '0.00',
      });
      expect(buildCashCloseBody({ date: '2026-10-13', countedText: '36,500.5', note: ' short ', warehouseId: WH }, MAIN)).toEqual({
        date: '2026-10-13',
        warehouseId: WH,
        countedCash: '36500.50',
        note: 'short',
      });
    });

    it('BR-74: no body without a parseable count or (Main) a real warehouse', () => {
      expect(buildCashCloseBody({ date: '2026-10-13', countedText: 'abc', note: '', warehouseId: WH }, MAIN)).toBeNull();
      expect(buildCashCloseBody({ date: '2026-10-13', countedText: '10', note: '', warehouseId: 'WH-OOTY' }, MAIN)).toBeNull();
    });

    it('BR-74: the preview difference is counted minus expected, in paise', () => {
      expect(cashDifferencePaise('36,500', 3700000)).toBe(-50000);
      expect(cashDifferencePaise('', 3700000)).toBeNull();
    });
  });

  describe('BR-75: expense voucher', () => {
    it('maps an ExpenseVoucher', () => {
      const dto: ExpenseVoucherDto = {
        voucherNumber: 'VCH-20261013-11111111',
        voucherType: 'EXPENSE',
        expenseId: EXPENSE.id,
        warehouse: { id: WH, code: 'WH-COON', name: 'Coonoor' },
        category: 'Transport',
        amount: '2400.00',
        expenseDate: '2026-10-13',
        paymentMethod: 'BANK',
        vendor: null,
        description: 'Freight',
        status: 'RECORDED',
        recordedBy: { id: USER, name: 'John Doe' },
      };
      const voucher = mapExpenseVoucher(dto);
      expect(voucher.voucherNumber).toBe('VCH-20261013-11111111');
      expect(voucher.amountPaise).toBe(240000);
      expect(voucher.recordedByName).toBe('John Doe');
      expect(voucher.warehouseName).toBe('Coonoor');
      expect(voucher.paymentMethodLabel).toBe('Bank Transfer');
    });
  });

  describe('helpers', () => {
    it('BR-30: a Sub admin is pinned; a Main admin may pick a uuid, never a fixture id', () => {
      expect(financeWarehouseFilter(SUB, 'other')).toBe(WH);
      expect(financeWarehouseFilter(MAIN, WH)).toBe(WH);
      expect(financeWarehouseFilter(MAIN, 'WH-OOTY')).toBeUndefined();
      expect(financeWarehouseFilter(MAIN, undefined)).toBeUndefined();
      expect(uuidOrUndefined(null)).toBeUndefined();
    });

    it('paise round-trip to the API decimal string', () => {
      expect(paiseToMoneyString(240050)).toBe('2400.50');
      expect(paiseToMoneyString(5)).toBe('0.05');
    });

    it('the IST day rolls over at 18:30 UTC', () => {
      expect(istToday(new Date('2026-10-13T18:29:00.000Z'))).toBe('2026-10-13');
      expect(istToday(new Date('2026-10-13T18:30:00.000Z'))).toBe('2026-10-14');
    });
  });
});
