/**
 * roles/admin/screens/warehouse/finance-expenses/mappers.ts:
 * Turns the finance DTOs into UI types.
 *
 * Money rule (CLAUDE.md 2.2): Money is never a float. API decimal strings like
 * "1234.50" are converted immediately into integer paise via parseRupeesToPaise.
 *
 * BR-62: Expense mapping, status fallback.
 * BR-63: Revenue item and detail mapping.
 * BR-74: Daily cash summary and cash close integer paise math.
 * BR-75: Expense voucher mapping.
 */
import { describe, expect, it } from 'vitest';
import type {
  CashCloseDto,
  DailyCashSummaryDto,
  ExpenseCategoryDto,
  ExpenseDto,
  ExpenseVoucherDto,
  FinanceRevenueDetailDto,
  FinanceRevenueItemDto,
} from '../api/finance';
import {
  financeWarehouseFilter,
  mapCashClose,
  mapDailyCashSummary,
  mapExpenseCategory,
  mapExpenseRecord,
  mapExpenseStatus,
  mapExpenseVoucher,
  mapRevenueDetail,
  mapRevenueRecord,
} from '../screens/warehouse/finance-expenses/mappers';

describe('roles/admin/screens/warehouse/finance-expenses/mappers', () => {
  describe('BR-62: Expense mappers', () => {
    it('maps an ExpenseDto to UI ExpenseRecord with integer paise', () => {
      const dto: ExpenseDto = {
        id: '11111111-1111-4111-8111-111111111111',
        expenseNumber: 'EXP-001245',
        warehouseId: '22222222-2222-4222-8222-222222222222',
        warehouseName: 'Coonoor Warehouse',
        categoryId: '33333333-3333-4333-8333-333333333333',
        categoryName: 'Transport',
        amount: '2400.50',
        expenseDate: '2026-10-13',
        paymentMethod: 'CASH',
        status: 'RECORDED',
        description: 'Collection point freight',
        recordedBy: '44444444-4444-4444-8444-444444444444',
        recordedByName: 'Admin Staff',
        createdAt: '2026-10-13T09:30:00.000Z',
      };

      const record = mapExpenseRecord(dto);
      expect(record.id).toBe('EXP-001245');
      expect(record.amount).toBe(240050); // integer paise
      expect(record.status).toBe('Recorded');
      expect(record.categoryRef).toContain('Transport');
      expect(record.categoryRef).toContain('Collection point freight');
    });

    it('handles decimal fractions with exact integer paise (no float drift)', () => {
      const dtoA: ExpenseDto = {
        id: '11111111-1111-4111-8111-111111111111',
        expenseNumber: 'EXP-1',
        warehouseId: '22222222-2222-4222-8222-222222222222',
        categoryId: '33333333-3333-4333-8333-333333333333',
        categoryName: 'General',
        amount: '0.10',
        expenseDate: '2026-10-13',
        paymentMethod: 'CASH',
        status: 'RECORDED',
        recordedBy: '44444444-4444-4444-8444-444444444444',
        createdAt: '2026-10-13T09:30:00.000Z',
      };
      const dtoB: ExpenseDto = {
        ...dtoA,
        expenseNumber: 'EXP-2',
        amount: '0.20',
      };

      const recA = mapExpenseRecord(dtoA);
      const recB = mapExpenseRecord(dtoB);
      expect(recA.amount).toBe(10);
      expect(recB.amount).toBe(20);
      expect(recA.amount + recB.amount).toBe(30); // exact 30 paise
    });

    it('exhaustively maps known statuses and safely falls back for unknown', () => {
      expect(mapExpenseStatus('RECORDED')).toBe('Recorded');
      expect(mapExpenseStatus('APPROVED')).toBe('Approved');
      expect(mapExpenseStatus('REJECTED')).toBe('Rejected');
      // @ts-expect-error test unexpected status
      expect(mapExpenseStatus('CANCELLED')).toBe('Recorded');
      // @ts-expect-error test unknown status
      expect(mapExpenseStatus('SOMETHING_NEW')).toBe('Recorded');
    });

    it('maps ExpenseCategoryDto to UI ExpenseCategoryItem', () => {
      const catDto: ExpenseCategoryDto = {
        id: 'cat-uuid-1',
        name: 'Maintenance',
        active: true,
      };
      const uiCat = mapExpenseCategory(catDto);
      expect(uiCat.id).toBe('cat-uuid-1');
      expect(uiCat.name).toBe('Maintenance');
      expect(uiCat.status).toBe('Active');
      expect(uiCat.usedCount).toBe(0);
    });
  });

  describe('BR-63: Revenue mappers', () => {
    it('maps FinanceRevenueItemDto to UI RevenueRecord with integer paise', () => {
      const dto: FinanceRevenueItemDto = {
        id: 'ord-uuid-1',
        orderNumber: 'ORD-10284',
        warehouseId: 'wh-uuid-1',
        warehouseName: 'Coonoor',
        channel: 'DIRECT',
        paymentMethod: 'WALLET',
        amount: '3450.00',
        completedAt: '2026-10-13T05:50:00.000Z',
      };

      const record = mapRevenueRecord(dto);
      expect(record.id).toBe('ORD-10284');
      expect(record.amount).toBe(345000); // 3450.00 in paise
      expect(record.category).toBe('Direct Sales');
      expect(record.paymentMethod).toBe('Wallet');
      expect(record.status).toBe('Completed');
    });

    it('maps FinanceRevenueDetailDto to UI RevenueDetail with paise formatting', () => {
      const dto: FinanceRevenueDetailDto = {
        id: 'ord-uuid-1',
        orderNumber: 'ORD-10284',
        warehouseId: 'wh-uuid-1',
        warehouseName: 'Coonoor',
        channel: 'ONLINE',
        paymentMethod: 'UPI',
        amount: '1250.00',
        completedAt: '2026-10-13T05:50:00.000Z',
        invoiceNumber: 'INV-2026-000845',
        invoiceStatus: 'ISSUED',
      };

      const detail = mapRevenueDetail(dto);
      expect(detail.orderId).toBe('ORD-10284');
      expect(detail.invoiceId).toBe('INV-2026-000845');
      expect(detail.finalAmount).toBe('1,250');
      expect(detail.salesChannel).toBe('Online');
      expect(detail.paymentMethod).toBe('UPI');
    });
  });

  describe('BR-74: Daily Cash Summary and Cash Close mappers', () => {
    it('maps DailyCashSummaryDto to integer paise figures', () => {
      const dto: DailyCashSummaryDto = {
        date: '2026-10-13',
        warehouseId: 'wh-uuid-1',
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
      // Arithmetic check in integer paise:
      expect(summary.expectedClosingPaise).toBe(
        summary.openingCashPaise + summary.cashSalesPaise + summary.cashTopUpsPaise - summary.cashExpensesPaise,
      );
    });

    it('maps CashCloseDto with negative difference when short', () => {
      const dto: CashCloseDto = {
        id: 'close-uuid-1',
        closeNumber: 'CLS-20261013-001',
        warehouseId: 'wh-uuid-1',
        date: '2026-10-13',
        openingCash: '10000.00',
        cashSales: '25000.00',
        cashTopUps: '5000.00',
        cashExpenses: '3000.00',
        expectedClosing: '37000.00',
        countedCash: '36500.00',
        difference: '-500.00',
        note: 'Cash drawer shortage 500',
        closedBy: 'user-uuid-1',
        closedByName: 'John Doe',
        closedAt: '2026-10-13T16:00:00.000Z',
      };

      const mapped = mapCashClose(dto);
      expect(mapped.countedCashPaise).toBe(3650000);
      expect(mapped.differencePaise).toBe(-50000);
      expect(mapped.differencePaise).toBe(mapped.countedCashPaise - mapped.expectedClosingPaise);
    });
  });

  describe('BR-75: Expense Voucher mapper', () => {
    it('maps ExpenseVoucherDto to UI VoucherRecord', () => {
      const dto: ExpenseVoucherDto = {
        voucherNumber: 'VCH-20261013-22222222',
        expenseId: '22222222-2222-4222-8222-222222222222',
        expenseNumber: 'EXP-001245',
        warehouseId: 'wh-uuid-1',
        warehouseName: 'Coonoor',
        categoryId: 'cat-uuid-1',
        categoryName: 'Transport',
        amount: '2400.00',
        expenseDate: '2026-10-13',
        paymentMethod: 'CASH',
        status: 'RECORDED',
        description: 'Transport freight',
        recordedBy: 'user-uuid-1',
        recordedByName: 'John Doe',
        createdAt: '2026-10-13T09:30:00.000Z',
      };

      const voucher = mapExpenseVoucher(dto);
      expect(voucher.id).toBe('VCH-20261013-22222222');
      expect(voucher.referenceId).toBe('EXP-001245');
      expect(voucher.type).toBe('Expense');
      expect(voucher.amount).toBe(240000); // paise
      expect(voucher.createdBy).toBe('John Doe');
      expect(voucher.status).toBe('Recorded');
    });
  });

  describe('BR-30: financeWarehouseFilter', () => {
    it('locks Sub Warehouse Admin to their own warehouse id', () => {
      const subScope = { warehouseId: 'wh-sub-1', warehouseCode: 'WH-COON' };
      expect(financeWarehouseFilter(subScope, 'wh-other')).toBe('wh-sub-1');
      expect(financeWarehouseFilter(subScope, undefined)).toBe('wh-sub-1');
    });

    it('allows Main Warehouse Admin to filter or view all', () => {
      const mainScope = {};
      expect(financeWarehouseFilter(mainScope, 'wh-sub-1')).toBe('wh-sub-1');
      expect(financeWarehouseFilter(mainScope, undefined)).toBeUndefined();
    });
  });
});
