/**
 * roles/admin/screens/warehouse/reports/mappers.ts:
 * Domain mappers between OpenAPI DTOs and warehouse reports UI types (BR-64).
 *
 * Rules:
 *   - Money is NEVER a float. Every amount is integer paise (BR-64).
 *   - Quantities are integer grams (parseKgToGrams).
 *   - Scoping: Sub Warehouse Admin is confined to its assigned warehouse (BR-30, BR-64).
 *   - Date range validation: from and to are required (from <= to) for date-bounded reports.
 */
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
  getReportPresetDates,
  mapCashTopupsReport,
  mapCustomersReport,
  mapInventoryReport,
  mapReceivingReport,
  mapReturnsReport,
  mapSalesReport,
  reportChannelLabel,
  reportStatusLabel,
  reportsWarehouseFilter,
  validateReportDateRange,
} from '../screens/warehouse/reports/mappers';

const OWN_WAREHOUSE = '11111111-1111-4111-8111-111111111111';
const FOREIGN_WAREHOUSE = '99999999-9999-4999-8999-999999999999';
const SUB_SCOPE = { warehouseId: OWN_WAREHOUSE, warehouseCode: 'WH-COON', warehouseName: 'Coonoor' };
const MAIN_SCOPE = {};

describe('roles/admin/screens/warehouse/reports/mappers.ts', () => {
  describe('mapSalesReport (BR-64)', () => {
    it('converts totals and averages to integer paise and formats cleanly', () => {
      const dto: SalesReportDto = {
        from: '2026-10-01',
        to: '2026-10-13',
        warehouseId: OWN_WAREHOUSE,
        count: 25,
        total: '12500.50',
        averageOrderValue: '500.02',
        byDay: [
          { date: '2026-10-01', count: 10, total: '5000.00' },
          { date: '2026-10-02', count: 15, total: '7500.50' },
        ],
        byChannel: [
          { channel: 'DIRECT', count: 20, total: '10000.50' },
          { channel: 'ONLINE', count: 5, total: '2500.00' },
        ],
        byStatus: [
          { status: 'DELIVERED', count: 20 },
          { status: 'CONFIRMED', count: 5 },
        ],
      };

      const mapped = mapSalesReport(dto);
      expect(mapped.totalPaise).toBe(1250050);
      expect(mapped.totalFormatted).toBe('₹12,500.50');
      expect(mapped.averageOrderValuePaise).toBe(50002);
      expect(mapped.averageOrderValueFormatted).toBe('₹500.02');
      expect(mapped.count).toBe(25);
      expect(mapped.byDay[0]?.totalPaise).toBe(500000);
      expect(mapped.byDay[0]?.totalFormatted).toBe('₹5,000');
      expect(mapped.byChannel[0]?.totalPaise).toBe(1000050);
      expect(mapped.byStatus[0]?.status).toBe('DELIVERED');
    });

    it('BR-64c: maps empty sales report with zero totals and empty arrays', () => {
      const dto: SalesReportDto = {
        from: '2026-10-01',
        to: '2026-10-13',
        warehouseId: OWN_WAREHOUSE,
        count: 0,
        total: '0.00',
        averageOrderValue: '0.00',
        byDay: [],
        byChannel: [],
        byStatus: [],
      };
      const mapped = mapSalesReport(dto);
      expect(mapped.count).toBe(0);
      expect(mapped.totalPaise).toBe(0);
      expect(mapped.totalFormatted).toBe('₹0');
      expect(mapped.averageOrderValuePaise).toBe(0);
      expect(mapped.averageOrderValueFormatted).toBe('₹0');
      expect(mapped.byDay).toEqual([]);
      expect(mapped.byChannel).toEqual([]);
      expect(mapped.byStatus).toEqual([]);
    });
  });

  describe('mapReceivingReport (BR-64)', () => {
    it('computes total receipts and status distribution counts', () => {
      const dto: ReceivingReportDto = {
        from: '2026-10-01',
        to: '2026-10-13',
        warehouseId: OWN_WAREHOUSE,
        byDay: [
          { date: '2026-10-01', status: 'ACCEPTED', count: 4 },
          { date: '2026-10-01', status: 'REJECTED', count: 1 },
          { date: '2026-10-02', status: 'ACCEPTED', count: 3 },
        ],
      };

      const mapped = mapReceivingReport(dto);
      expect(mapped.totalReceipts).toBe(8);
      expect(mapped.byStatusCounts['ACCEPTED']).toBe(7);
      expect(mapped.byStatusCounts['REJECTED']).toBe(1);
      expect(mapped.acceptedCount).toBe(7);
      expect(mapped.rejectedCount).toBe(1);
      expect(mapped.byDay).toHaveLength(3);
    });
  });

  describe('mapInventoryReport (BR-64)', () => {
    it('maps kg quantities to integer grams without float drift and sums totals', () => {
      const dto: InventoryReportDto = {
        from: '2026-10-01',
        to: '2026-10-13',
        warehouseId: OWN_WAREHOUSE,
        items: [
          { cropId: 'crop-1', name: 'Carrot', totalQty: '12.500', batchCount: 3 },
          { cropId: 'crop-2', name: 'Potato', totalQty: '25.000', batchCount: 5 },
        ],
      };

      const mapped = mapInventoryReport(dto);
      expect(mapped.items[0]?.totalQtyGrams).toBe(12500);
      expect(mapped.items[0]?.totalQtyKg).toBe('12.500');
      expect(mapped.items[1]?.totalQtyGrams).toBe(25000);
      expect(mapped.totalQtyGrams).toBe(37500);
      expect(mapped.totalQtyKg).toBe('37.500');
      expect(mapped.totalBatchCount).toBe(8);
    });
  });

  describe('mapReturnsReport (BR-64)', () => {
    it('converts refunded total to integer paise and computes total returns', () => {
      const dto: ReturnsReportDto = {
        from: '2026-10-01',
        to: '2026-10-13',
        warehouseId: OWN_WAREHOUSE,
        refundedTotal: '1450.00',
        byStatus: [
          { status: 'REFUNDED', count: 5 },
          { status: 'SUBMITTED', count: 2 },
        ],
        byDay: [
          { date: '2026-10-01', count: 3 },
          { date: '2026-10-02', count: 4 },
        ],
      };

      const mapped = mapReturnsReport(dto);
      expect(mapped.refundedTotalPaise).toBe(145000);
      expect(mapped.refundedTotalFormatted).toBe('₹1,450');
      expect(mapped.totalReturns).toBe(7);
      expect(mapped.byStatus).toHaveLength(2);
      expect(mapped.byDay).toHaveLength(2);
    });
  });

  describe('mapCustomersReport (BR-64d: counts only)', () => {
    it('maps customer counts and per-day ordering counts without PII', () => {
      const dto: CustomersReportDto = {
        from: '2026-10-01',
        to: '2026-10-13',
        warehouseId: OWN_WAREHOUSE,
        customersWithOrders: 18,
        newCustomers: 4,
        byDay: [
          { date: '2026-10-01', count: 8 },
          { date: '2026-10-02', count: 10 },
        ],
      };

      const mapped = mapCustomersReport(dto);
      expect(mapped.customersWithOrders).toBe(18);
      expect(mapped.newCustomers).toBe(4);
      expect(mapped.byDay).toHaveLength(2);
    });
  });

  describe('mapCashTopupsReport (BR-64)', () => {
    it('converts cash top-up total to integer paise and formats cleanly', () => {
      const dto: CashTopupsReportDto = {
        from: '2026-10-01',
        to: '2026-10-13',
        warehouseId: OWN_WAREHOUSE,
        count: 12,
        total: '6000.00',
        byDay: [
          { date: '2026-10-01', count: 5, total: '2500.00' },
          { date: '2026-10-02', count: 7, total: '3500.00' },
        ],
      };

      const mapped = mapCashTopupsReport(dto);
      expect(mapped.count).toBe(12);
      expect(mapped.totalPaise).toBe(600000);
      expect(mapped.totalFormatted).toBe('₹6,000');
      expect(mapped.byDay[0]?.totalPaise).toBe(250000);
      expect(mapped.byDay[0]?.totalFormatted).toBe('₹2,500');
    });
  });

  describe('reportsWarehouseFilter (BR-30 warehouse scoping)', () => {
    it('pins to sub-warehouse id when scope is sub-warehouse', () => {
      expect(reportsWarehouseFilter(SUB_SCOPE, FOREIGN_WAREHOUSE)).toBe(OWN_WAREHOUSE);
      expect(reportsWarehouseFilter(SUB_SCOPE, undefined)).toBe(OWN_WAREHOUSE);
    });

    it('passes through selected warehouse when scope is main', () => {
      expect(reportsWarehouseFilter(MAIN_SCOPE, FOREIGN_WAREHOUSE)).toBe(FOREIGN_WAREHOUSE);
      expect(reportsWarehouseFilter(MAIN_SCOPE, undefined)).toBeUndefined();
    });

    it('BR-64a: a Sub admin never sends a non-uuid warehouse id (old fixture ids become undefined)', () => {
      expect(reportsWarehouseFilter({ warehouseId: 'WH-COON', warehouseName: 'Coonoor' }, FOREIGN_WAREHOUSE)).toBeUndefined();
      expect(reportsWarehouseFilter(SUB_SCOPE, 'WH-OOTY')).toBe(OWN_WAREHOUSE);
    });

    it('BR-64b: a Main admin selection that is not a uuid means all warehouses, not a 400', () => {
      expect(reportsWarehouseFilter(MAIN_SCOPE, 'WH-OOTY')).toBeUndefined();
      expect(reportsWarehouseFilter(MAIN_SCOPE, '')).toBeUndefined();
      expect(reportsWarehouseFilter(MAIN_SCOPE, 'ALL')).toBeUndefined();
      expect(reportsWarehouseFilter(MAIN_SCOPE, FOREIGN_WAREHOUSE)).toBe(FOREIGN_WAREHOUSE);
    });
  });

  describe('report labels', () => {
    it('translates known status and channel codes and falls back to the raw code', () => {
      expect(reportStatusLabel('order', 'PENDING_PAYMENT')).toBe('Payment Pending');
      expect(reportStatusLabel('grn', 'PARTIALLY_ACCEPTED')).toBe('Partially Accepted');
      expect(reportStatusLabel('return', 'REFUND_PENDING_BANK')).toBe('Bank Refund Pending');
      expect(reportStatusLabel('order', 'SOMETHING_NEW')).toBe('SOMETHING_NEW');
      expect(reportChannelLabel('ONLINE')).toBe('Online');
      expect(reportChannelLabel('X')).toBe('X');
    });
  });

  describe('validateReportDateRange (BR-64)', () => {
    it('returns true when from and to are valid and from <= to', () => {
      expect(validateReportDateRange('2026-10-01', '2026-10-13')).toBe(true);
      expect(validateReportDateRange('2026-10-01', '2026-10-01')).toBe(true);
    });

    it('returns false when from or to is empty or from > to', () => {
      expect(validateReportDateRange('', '2026-10-13')).toBe(false);
      expect(validateReportDateRange('2026-10-01', '')).toBe(false);
      expect(validateReportDateRange('2026-10-15', '2026-10-13')).toBe(false);
    });
  });

  describe('getReportPresetDates (BR-64 Asia/Kolkata day)', () => {
    it('computes exact IST calendar ranges for Today, Week, and Month', () => {
      // 2026-10-13T10:00:00Z -> IST is 2026-10-13 15:30:00
      const now = new Date('2026-10-13T10:00:00Z');

      const today = getReportPresetDates('Today', now);
      expect(today).toEqual({ from: '2026-10-13', to: '2026-10-13' });
      expect(validateReportDateRange(today.from, today.to)).toBe(true);

      const week = getReportPresetDates('Week', now);
      expect(week).toEqual({ from: '2026-10-07', to: '2026-10-13' });
      expect(validateReportDateRange(week.from, week.to)).toBe(true);

      const month = getReportPresetDates('Month', now);
      expect(month).toEqual({ from: '2026-10-01', to: '2026-10-13' });
      expect(validateReportDateRange(month.from, month.to)).toBe(true);
    });
  });
});
