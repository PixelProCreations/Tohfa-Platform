import { describe, expect, it } from 'vitest';
import type {
  ExpenseCategoryDto,
  ExpenseDto,
  ExpenseVoucherDto,
  FinanceRevenueDetailDto,
  FinanceRevenueItemDto,
} from '../api/finance';
import {
  mapExpenseCategoryDtoToItem,
  mapExpenseDtoToRecord,
  mapExpenseVoucherDtoToRecord,
  mapRevenueDetailDtoToDetail,
  mapRevenueItemDtoToRecord,
} from '../screens/warehouse/finance-expenses/mappers';
import type { Money } from '@tohfa/shared-types';

describe('finance-expenses mappers', () => {
  it('maps ExpenseDto to ExpenseRecord', () => {
    const dto: ExpenseDto = {
      id: 'exp-1',
      warehouseId: 'WH-COON',
      categoryId: 'cat-1',
      category: 'Transport',
      amount: '2400.00' as Money,
      expenseDate: '2026-09-25',
      paymentMethod: 'CASH',
      vendor: 'Local Logistics',
      description: 'Diesel for transport',
      status: 'RECORDED',
      recordedBy: 'user-1',
      createdAt: '2026-09-25T10:00:00Z',
    };

    const record = mapExpenseDtoToRecord(dto);
    expect(record.id).toBe('exp-1');
    expect(record.categoryRef).toBe('Transport');
    expect(record.amount).toBe(2400);
    expect(record.status).toBe('Recorded');
    expect(record.warehouseId).toBe('WH-COON');
  });

  it('maps FinanceRevenueItemDto to RevenueRecord', () => {
    const dto: FinanceRevenueItemDto = {
      orderId: 'ORD-10284',
      channel: 'MARKET',
      paymentMethod: 'WALLET',
      paymentStatus: 'PAID',
      status: 'DELIVERED',
      totalAmount: '3450.00' as Money,
      gstAmount: '150.00' as Money,
      placedAt: '2026-09-25T11:20:00Z',
      completedAt: '2026-09-25T11:30:00Z',
      warehouseId: 'WH-COON',
    };

    const record = mapRevenueItemDtoToRecord(dto);
    expect(record.id).toBe('ORD-10284');
    expect(record.category).toBe('Direct Sales');
    expect(record.amount).toBe(3450);
    expect(record.status).toBe('Completed');
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
    expect(detail.finalAmount).toBe('3,450');
  });

  it('maps ExpenseCategoryDto to ExpenseCategoryItem', () => {
    const dto: ExpenseCategoryDto = {
      id: 'cat-1',
      name: 'Transport',
    };

    const item = mapExpenseCategoryDtoToItem(dto);
    expect(item.id).toBe('cat-1');
    expect(item.name).toBe('Transport');
    expect(item.status).toBe('Active');
  });

  it('maps ExpenseVoucherDto to VoucherRecord', () => {
    const dto: ExpenseVoucherDto = {
      voucherNumber: 'VCH-000821',
      voucherType: 'EXPENSE',
      expenseId: 'exp-1',
      warehouse: { id: 'WH-COON', code: 'COON', name: 'Coonoor Warehouse' },
      category: 'Transport',
      amount: '2400.00' as Money,
      expenseDate: '2026-09-25',
      paymentMethod: 'CASH',
      vendor: 'Driver',
      description: 'Trip fuel',
      status: 'RECORDED',
      recordedBy: { id: 'user-1', name: 'John Admin' },
    };

    const record = mapExpenseVoucherDtoToRecord(dto);
    expect(record.id).toBe('VCH-000821');
    expect(record.type).toBe('Expense');
    expect(record.amount).toBe(2400);
    expect(record.referenceId).toBe('exp-1');
  });
});
