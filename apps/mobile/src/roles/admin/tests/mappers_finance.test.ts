import { describe, expect, it } from 'vitest';
import type {
  ExpenseCategoryDto,
  ExpenseDto,
  ExpenseVoucherDto,
  FinanceRevenueDetailDto,
  FinanceRevenueItemDto,
} from '../api/finance';
import {
  averagePaise,
  expenseCategoryRows,
  formatPaiseOrDash,
  mapExpenseCategoryDtoToItem,
  mapExpenseDtoToRecord,
  mapExpenseVoucherDtoToRecord,
  mapRevenueDetailDtoToDetail,
  mapRevenueItemDtoToRecord,
  paiseFromMoney,
  revenueBreakdownOf,
  revenueCategoryOf,
  subtractPaise,
  sumPaise,
  textOrDash,
} from '../screens/warehouse/finance-expenses/mappers';
import type { Money } from '@tohfa/shared-types';

const EXPENSE: ExpenseDto = {
  id: 'f2a1b3c4-0000-4000-8000-000000000001',
  warehouseId: '9b1d2c3e-4f50-4a6b-8c7d-1e2f3a4b5c6d',
  categoryId: '3f0c6a52-6a43-4d2b-9a55-0d4a1f6c2b11',
  category: 'Transport',
  amount: '2400.50' as Money,
  expenseDate: '2026-09-25',
  paymentMethod: 'CASH',
  vendor: null,
  description: null,
  status: 'RECORDED',
  recordedBy: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  createdAt: '2026-09-25T10:00:00Z',
};

describe('finance-expenses mappers', () => {
  it('maps ExpenseDto to ExpenseRecord with exact integer paise', () => {
    const record = mapExpenseDtoToRecord(EXPENSE);
    expect(record.id).toBe(EXPENSE.id);
    expect(record.categoryRef).toBe('Transport');
    expect(record.amountPaise).toBe(240050);
    expect(record.status).toBe('Recorded');
    expect(record.warehouseId).toBe(EXPENSE.warehouseId);
  });

  it('BR-62: legacy APPROVED / REJECTED rows keep their own label, never "Pending"', () => {
    expect(mapExpenseDtoToRecord({ ...EXPENSE, status: 'APPROVED' }).status).toBe('Approved');
    expect(mapExpenseDtoToRecord({ ...EXPENSE, status: 'REJECTED' }).status).toBe('Rejected');
  });

  it('BR-75: an expense record never carries the recorder UUID as a person', () => {
    const record = mapExpenseDtoToRecord(EXPENSE);
    expect(JSON.stringify(record)).not.toContain(EXPENSE.recordedBy);
  });

  it('maps FinanceRevenueItemDto to RevenueRecord', () => {
    const dto: FinanceRevenueItemDto = {
      orderId: 'ORD-10284',
      channel: 'MARKET',
      paymentMethod: 'WALLET',
      paymentStatus: 'PAID',
      status: 'DELIVERED',
      totalAmount: '3450.10' as Money,
      gstAmount: '150.00' as Money,
      placedAt: '2026-09-25T11:20:00Z',
      completedAt: '2026-09-25T11:30:00Z',
      warehouseId: 'WH-COON',
    };

    const record = mapRevenueItemDtoToRecord(dto);
    expect(record.id).toBe('ORD-10284');
    expect(record.category).toBe('Direct Sales');
    expect(record.amountPaise).toBe(345010);
    expect(record.status).toBe('Completed');
  });

  it('BR-63: revenue channels map to the hub categories, DIRECT (at-counter, BR-85) included', () => {
    expect(revenueCategoryOf('ONLINE')).toBe('Orders');
    expect(revenueCategoryOf('MARKET')).toBe('Direct Sales');
    expect(revenueCategoryOf('DIRECT')).toBe('Direct Sales');
    expect(revenueCategoryOf('HORECA')).toBe('Other');
    expect(revenueCategoryOf('B2B')).toBe('Other');
  });

  it('BR-63: the revenue breakdown sums channel totals exactly in paise (0.10 + 0.20 = 0.30)', () => {
    const b = revenueBreakdownOf([
      { channel: 'MARKET', count: 1, total: '0.10' as Money },
      { channel: 'DIRECT', count: 1, total: '0.20' as Money },
      { channel: 'ONLINE', count: 2, total: '1200.00' as Money },
      { channel: 'B2B', count: 1, total: '99.99' as Money },
    ]);
    expect(b.directPaise).toBe(30);
    expect(b.ordersPaise).toBe(120000);
    expect(b.otherPaise).toBe(9999);
    expect(b.totalPaise).toBe(120000 + 30 + 9999);
    expect(revenueBreakdownOf([]).totalPaise).toBe(0);
    expect(revenueBreakdownOf([{ channel: 'ONLINE', count: 1, total: 'oops' }]).totalPaise).toBeNull();
  });

  it('maps FinanceRevenueDetailDto and enforces BR-16 (hides customer name)', () => {
    const dto: FinanceRevenueDetailDto = {
      orderId: 'ORD-10284',
      channel: 'MARKET',
      paymentMethod: 'WALLET',
      paymentStatus: 'PAID',
      status: 'DELIVERED',
      totalAmount: '3450.00' as Money,
      gstAmount: '0.00' as Money,
      placedAt: '2026-09-25T11:20:00Z',
      completedAt: '2026-09-25T11:30:00Z',
      warehouseId: 'WH-COON',
      invoiceNumber: 'INV-2026-000845',
      invoiceStatus: 'ISSUED',
    };

    const detail = mapRevenueDetailDtoToDetail(dto);
    expect(detail.orderId).toBe('ORD-10284');
    // BR-16: Customer name must be hidden
    expect(detail.customer).toBe('');
    expect(detail.invoiceId).toBe('INV-2026-000845');
    expect(detail.finalAmount).toBe('₹3,450');
  });

  it('maps ExpenseCategoryDto to ExpenseCategoryItem', () => {
    const dto: ExpenseCategoryDto = { id: 'cat-1', name: 'Transport' };
    const item = mapExpenseCategoryDtoToItem(dto);
    expect(item.id).toBe('cat-1');
    expect(item.name).toBe('Transport');
    expect(item.status).toBe('Active');
  });

  it('BR-75: maps ExpenseVoucherDto to VoucherRecord with the recorder name', () => {
    const dto: ExpenseVoucherDto = {
      voucherNumber: 'VCH-20260925-F2A1B3C4',
      voucherType: 'EXPENSE',
      expenseId: 'exp-1',
      warehouse: { id: 'WH-COON', code: 'COON', name: 'Coonoor Warehouse' },
      category: 'Transport',
      amount: '2400.00' as Money,
      expenseDate: '2026-09-25',
      paymentMethod: 'CASH',
      vendor: null,
      description: null,
      status: 'RECORDED',
      recordedBy: { id: '7c9e6679-7425-40de-944b-e07fc1f90ae7', name: 'John Admin' },
    };

    const record = mapExpenseVoucherDtoToRecord(dto);
    expect(record.id).toBe('VCH-20260925-F2A1B3C4');
    expect(record.type).toBe('Expense');
    expect(record.amountPaise).toBe(240000);
    expect(record.referenceId).toBe('exp-1');
    expect(record.createdBy).toBe('John Admin');
    expect(record.notes).toBeUndefined();
  });
});

describe('finance money helpers (CLAUDE.md 2.2: integer paise, never floats)', () => {
  it('reads API Money strings into exact paise and refuses garbage instead of showing 0', () => {
    expect(paiseFromMoney('2400.50')).toBe(240050);
    expect(paiseFromMoney('0.1')).toBe(10);
    expect(paiseFromMoney('-12.30')).toBe(-1230);
    expect(paiseFromMoney('abc')).toBeNull();
    expect(paiseFromMoney('')).toBeNull();
    expect(paiseFromMoney(null)).toBeNull();
    expect(paiseFromMoney(undefined)).toBeNull();
  });

  it('formats paise for display, and an unknown figure as an em dash', () => {
    expect(formatPaiseOrDash(240050)).toBe('₹2,400.50');
    expect(formatPaiseOrDash(18443000)).toBe('₹1,84,430');
    expect(formatPaiseOrDash(-120000)).toBe('-₹1,200');
    expect(formatPaiseOrDash(null)).toBe('—');
    expect(formatPaiseOrDash(undefined)).toBe('—');
  });

  it('sums, subtracts and averages in integer paise; one unknown input makes the result unknown', () => {
    expect(sumPaise([10, 20])).toBe(30);
    expect(sumPaise([])).toBe(0);
    expect(sumPaise([10, null])).toBeNull();
    expect(subtractPaise(2485000, 642000)).toBe(1843000);
    expect(subtractPaise(10, null)).toBeNull();
    // Display-only average, floored to the paisa without floating point.
    expect(averagePaise(1000, 3)).toBe(333);
    expect(averagePaise(1000, 0)).toBeNull();
    expect(averagePaise(null, 3)).toBeNull();
  });

  it('BR-62: expense category rows come from the report, exact and in report order', () => {
    expect(
      expenseCategoryRows([
        { category: 'Transport', count: 2, total: '2400.00' as Money },
        { category: 'Utilities', count: 1, total: '620.25' as Money },
      ]),
    ).toEqual([
      { label: 'Transport', value: '₹2,400' },
      { label: 'Utilities', value: '₹620.25' },
    ]);
  });

  it('shows an em dash for a missing vendor or description instead of fixture text', () => {
    expect(textOrDash(null)).toBe('—');
    expect(textOrDash('   ')).toBe('—');
    expect(textOrDash('Diesel')).toBe('Diesel');
  });
});
