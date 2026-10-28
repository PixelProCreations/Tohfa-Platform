import { describe, expect, it } from 'vitest';
import type { SalesReportDto } from '../api/reports';
import type { OrderSummaryDto } from '../api/orders';
import type { BatchDto } from '../api/inventory';
import type { GoodsReceiptDto } from '../api/receiving';
import type { AdminCustomerListItemDto } from '../api/customers';
// CashTopupSummaryDto has no API type; use inline shape
type CashTopupSummaryDto = { id: string; customerId: string; warehouseId: string; amount: unknown; notes?: string | null; collectedAt?: string };
import type { ExpenseDto } from '../api/finance';
import type { ReturnSummaryDto } from '../api/returns';
import {
  mapSalesReportToSummary,
  mapOrderToReportRow,
  mapBatchToInventoryReportRow,
  mapGoodsReceiptToReceivingReportRow,
  mapCustomerToReportRow,
  mapCashTopupToReportRow,
  mapExpenseToReportRow,
  mapReturnToReportRow,
  getIstDateRange,
} from '../screens/warehouse/reports/mappers';

describe('Reports mappers', () => {
  it('maps SalesReportDto to summary metrics', () => {
    const dto: SalesReportDto = {
      from: '2026-09-01',
      to: '2026-09-25',
      warehouseId: 'wh-1',
      count: 15,
      total: '15000.00',
      averageOrderValue: '1000.00',
      byDay: [],
      byChannel: [],
      byStatus: [],
    };
    const summary = mapSalesReportToSummary(dto);
    expect(summary.totalSales).toBe('₹15,000');
    expect(summary.ordersCount).toBe(15);
    expect(summary.avgOrder).toBe('₹1,000');
  });

  it('maps OrderSummaryDto to report row enforcing negative rules (no buyer PII)', () => {
    const order: OrderSummaryDto = {
      id: 'ord-123',
      orderNumber: 'ORD-10284',
      status: 'DELIVERED',
      channel: 'ONLINE',
      warehouseId: 'wh-1',
      itemCount: 4,
      totalAmount: '1240.00' as any,
      placedAt: '2026-09-25T11:20:00Z',
    };
    const row = mapOrderToReportRow(order);
    expect(row.orderId).toBe('ORD-10284');
    expect(row.channel).toBe('Online');
    expect(row.amount).toBe('₹1,240');
    expect(row.amountNum).toBe(1240);
    expect(row.items).toBe(4);
    expect(row.status).toBe('Completed');
  });

  it('maps BatchDto to inventory report row', () => {
    const batch: BatchDto = {
      id: 'batch-1',
      batchCode: 'BAT-CR-0245',
      warehouseId: 'wh-1',
      cropId: 'crop-1',
      cropName: 'Carrot',
      grade: 'GRADE_1',
      qtyAvailableKg: '420.000',
      qtyReservedKg: '35.000',
      storageLocation: 'Cold Storage A',
      receivedOn: '2026-09-23',
      status: 'ACTIVE',
    };
    const row = mapBatchToInventoryReportRow(batch);
    expect(row.productName).toBe('Carrot');
    expect(row.batchCode).toBe('BAT-CR-0245');
    expect(row.availableQty).toBe('420 kg');
    expect(row.reservedQty).toBe('35 kg');
    expect(row.status).toBe('Available');
  });

  it('maps GoodsReceiptDto to receiving report row', () => {
    const gr: GoodsReceiptDto = {
      id: 'gr-1',
      grnNumber: 'GR-00245',
      purchaseOrderId: 'po-1',
      warehouseId: 'wh-1',
      receivedAt: '2026-09-25T10:20:00Z',
      grossQtyKg: '420.000',
      acceptedQtyKg: '400.000',
      rejectedQtyKg: '5.000',
      status: 'ACCEPTED',
      cropName: 'Carrot',
      grade: 'GRADE_1',
      rejectionReason: 'Clean produce',
    };
    const row = mapGoodsReceiptToReceivingReportRow(gr);
    expect(row.receiptId).toBe('GR-00245');
    expect(row.product).toBe('Carrot');
    expect(row.qtyReceived).toBe('420 kg');
    expect(row.qualityStatus).toBe('Accepted');
    expect(row.acceptedQty).toBe('400 kg');
  });

  it('maps CustomerSummaryDto to customer report row', () => {
    const cust: AdminCustomerListItemDto = {
      id: 'cus-1',
      customerCode: 'C-001',
      name: 'Customer #10284',
      mobileMasked: '******3210',
      customerType: 'RETAIL',
      status: 'ACTIVE',
      isNew: false,
      preferredWarehouseId: null,
      totalOrders: 5,
      lastActivityAt: null,
      piiMasked: true,
      createdAt: '2026-08-01T00:00:00Z',
    };
    const row = mapCustomerToReportRow(cust);
    expect(row.id).toBe('cus-1');
    expect(row.name).toBe('Customer #10284');
  });

  it('maps CashTopupSummaryDto to cash top-up report row', () => {
    const topup: CashTopupSummaryDto = {
      id: 'top-1',
      customerId: 'CUS-1024',
      warehouseId: 'wh-1',
      amount: '2000.00' as any,
      collectedAt: '2026-09-25T10:24:00Z',
      notes: null,
    };
    const row = mapCashTopupToReportRow(topup);
    expect(row.id).toBe('top-1');
    expect(row.amount).toBe('₹2,000');
    expect(row.amountNum).toBe(2000);
    expect(row.paymentMethod).toBe('Cash');
    expect(row.status).toBe('Completed');
  });

  it('maps ExpenseDto to expense report row', () => {
    const exp: ExpenseDto = {
      id: 'exp-1',
      warehouseId: 'wh-1',
      categoryId: 'cat-1',
      category: 'Transport',
      amount: '2400.00' as any,
      paymentMethod: 'CASH',
      status: 'RECORDED',
      expenseDate: '2026-09-25',
      vendor: 'Local Transport Co.',
      description: 'Transport from collection point',
      recordedBy: 'Suresh',
      createdAt: '2026-09-25T10:00:00Z',
    };
    const row = mapExpenseToReportRow(exp);
    expect(row.id).toBe('exp-1');
    expect(row.category).toBe('Transport');
    expect(row.amount).toBe('₹2,400');
    expect(row.amountNum).toBe(2400);
    expect(row.status).toBe('Recorded');
  });

  it('maps ReturnSummaryDto to return report row', () => {
    const ret: ReturnSummaryDto = {
      id: 'ret-1',
      orderId: 'ORD-10284',
      customerId: 'CUS-10284',
      warehouseId: 'wh-1',
      status: 'APPROVED',
      reason: 'Produce damaged during transit',
      createdAt: '2026-09-25T12:00:00Z',
    };
    const row = mapReturnToReportRow(ret);
    expect(row.id).toBe('ret-1');
    expect(row.orderId).toBe('ORD-10284');
    expect(row.status).toBe('Approved');
  });

  it('computes correct IST date range for Today, Week, Month', () => {
    const refDate = new Date('2026-09-25T12:00:00Z');
    const today = getIstDateRange('Today', refDate);
    expect(today.from).toBe('2026-09-25');
    expect(today.to).toBe('2026-09-25');

    const month = getIstDateRange('Month', refDate);
    expect(month.from).toBe('2026-09-01');
    expect(month.to).toBe('2026-09-25');
  });
});
