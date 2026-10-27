import { describe, expect, it } from 'vitest';
import type {
  CashTopupsReportDto,
  CustomersReportDto,
  InventoryReportDto,
  ReceivingReportDto,
  ReturnsReportDto,
  SalesReportDto,
} from '../api/reports';
import {
  mapCashTopupsReportDto,
  mapCustomersReportDto,
  mapInventoryReportDto,
  mapReceivingReportDto,
  mapReturnsReportDto,
  mapSalesReportDto,
} from '../screens/warehouse/reports/mappers';

describe('reports mappers', () => {
  it('maps SalesReportDto with paise money conversion', () => {
    const dto: SalesReportDto = {
      from: '2026-09-01',
      to: '2026-09-25',
      warehouseId: 'WH-COON',
      count: 42,
      total: '125000.00' as any,
      averageOrderValue: '2976.19' as any,
      byDay: [{ date: '2026-09-25', count: 5, total: '15000.00' as any }],
      byChannel: [{ channel: 'ONLINE', count: 20, total: '60000.00' as any }],
      byStatus: [{ status: 'DELIVERED', count: 35 }],
    };

    const res = mapSalesReportDto(dto);
    expect(res.count).toBe(42);
    expect(res.totalPaise).toBe(12500000);
    expect(res.averageOrderValuePaise).toBe(297619);
    expect(res.byChannel.length).toBe(1);
  });

  it('maps InventoryReportDto with grams conversion', () => {
    const dto: InventoryReportDto = {
      from: null,
      to: null,
      warehouseId: 'WH-COON',
      items: [
        { cropId: 'crop-1', name: 'Carrot', totalQty: '150.500', batchCount: 3 },
      ],
    };

    const res = mapInventoryReportDto(dto);
    expect(res.totalItems).toBe(1);
    expect(res.items[0]?.totalQtyGrams).toBe(150500);
  });

  it('maps ReceivingReportDto correctly', () => {
    const dto: ReceivingReportDto = {
      from: '2026-09-01',
      to: '2026-09-25',
      warehouseId: 'WH-COON',
      byDay: [
        { date: '2026-09-25', status: 'ACCEPTED', count: 8 },
        { date: '2026-09-25', status: 'REJECTED', count: 1 },
      ],
    };

    const res = mapReceivingReportDto(dto);
    expect(res.totalReceipts).toBe(9);
    expect(res.byDay.length).toBe(2);
  });

  it('maps ReturnsReportDto with paise money conversion', () => {
    const dto: ReturnsReportDto = {
      from: '2026-09-01',
      to: '2026-09-25',
      warehouseId: 'WH-COON',
      byStatus: [
        { status: 'RESOLVED', count: 4 },
        { status: 'REJECTED', count: 1 },
      ],
      byDay: [{ date: '2026-09-25', count: 5 }],
      refundedTotal: '4500.00' as any,
    };

    const res = mapReturnsReportDto(dto);
    expect(res.totalReturns).toBe(5);
    expect(res.refundedTotalPaise).toBe(450000);
  });

  it('maps CustomersReportDto correctly', () => {
    const dto: CustomersReportDto = {
      from: '2026-09-01',
      to: '2026-09-25',
      warehouseId: 'WH-COON',
      customersWithOrders: 120,
      newCustomers: 15,
      byDay: [{ date: '2026-09-25', count: 3 }],
    };

    const res = mapCustomersReportDto(dto);
    expect(res.customersWithOrders).toBe(120);
    expect(res.newCustomers).toBe(15);
  });

  it('maps CashTopupsReportDto with paise conversion', () => {
    const dto: CashTopupsReportDto = {
      from: '2026-09-01',
      to: '2026-09-25',
      warehouseId: 'WH-COON',
      count: 18,
      total: '36000.00' as any,
      byDay: [{ date: '2026-09-25', count: 2, total: '4000.00' as any }],
    };

    const res = mapCashTopupsReportDto(dto);
    expect(res.count).toBe(18);
    expect(res.totalPaise).toBe(3600000);
  });
});
