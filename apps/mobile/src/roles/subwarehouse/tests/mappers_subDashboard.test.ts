import { describe, expect, it } from 'vitest';
import type { AlertItemDto } from '../../admin/api/alerts';
import type { GoodsReceiptDto, PurchaseOrderDto } from '../../admin/api/receiving';
import type { CashTopupsReportDto, SalesReportDto } from '../../admin/api/reports';
import type { WarehouseActivityEventDto } from '../../admin/api/warehouseActivity';
import {
  buildSubRmaRecord,
  deriveSubLowStockAlert,
  deriveSubReceivingKpi,
  deriveSubTodayReceiving,
  filterSubActivities,
  mapSubWarehouseActivity,
  deriveSubCashSummary,
  deriveSubLowStockCount,
  deriveSubSalesSummary,
} from '../screens/mappers_subDashboard';

describe('SubWarehouse Dashboard Mappers', () => {
  describe('BR-77b, BR-119: deriveSubReceivingKpi', () => {
    it('returns placeholder dashes when data is undefined (loading)', () => {
      const result = deriveSubReceivingKpi(undefined, true, undefined);
      expect(result.countText).toBe('—');
      expect(result.awaitingText).toBe('— awaiting QC');
    });

    it('formats exact counts with padStart', () => {
      const openPos = [{ id: 'po-1' }, { id: 'po-2' }, { id: 'po-3' }] as PurchaseOrderDto[];
      const awaitingQc = { count: 2, exact: true };
      const result = deriveSubReceivingKpi(openPos, true, awaitingQc);
      expect(result.countText).toBe('03');
      expect(result.awaitingText).toBe('2 awaiting QC');
    });

    it('appends + when walked count is not exact', () => {
      const openPos = [{ id: 'po-1' }] as PurchaseOrderDto[];
      const awaitingQc = { count: 10, exact: false };
      const result = deriveSubReceivingKpi(openPos, false, awaitingQc);
      expect(result.countText).toBe('01+');
      expect(result.awaitingText).toBe('10+ awaiting QC');
    });
  });

  describe('BR-119, BR-120: deriveSubTodayReceiving', () => {
    it('returns empty array when receipts is undefined or empty', () => {
      expect(deriveSubTodayReceiving(undefined, 'Coonoor')).toEqual([]);
      expect(deriveSubTodayReceiving([], 'Coonoor')).toEqual([]);
    });

    it('maps awaiting QC and QC completed receipts correctly', () => {
      const receipts: GoodsReceiptDto[] = [
        {
          id: 'gr-1',
          grnNumber: 'GR-2026-001',
          purchaseOrderId: 'po-1',
          warehouseId: 'wh-1',
          grossQtyKg: '150.000',
          status: 'AWAITING_QC',
          receivedAt: '2026-10-28T09:40:00.000Z',
          cropName: 'Tomato',
          grade: 'GRADE_1',
        },
        {
          id: 'gr-2',
          grnNumber: 'GR-2026-002',
          purchaseOrderId: 'po-2',
          warehouseId: 'wh-1',
          grossQtyKg: '80.000',
          acceptedQtyKg: '78.500',
          status: 'ACCEPTED',
          receivedAt: '2026-10-28T10:15:00.000Z',
          cropName: 'Carrot',
          grade: 'GRADE_1',
        },
      ];

      const items = deriveSubTodayReceiving(receipts, 'Coonoor');
      expect(items).toHaveLength(2);

      expect(items[0]).toMatchObject({
        id: 'gr-1',
        grnNumber: 'GR-2026-001',
        status: 'Awaiting QC',
        isAwaitingQc: true,
        route: 'Main Warehouse → Coonoor',
        produceTitle: 'Tomato · Grade 1',
        detailText: 'Expected: 150.000 KG',
      });

      expect(items[1]).toMatchObject({
        id: 'gr-2',
        grnNumber: 'GR-2026-002',
        status: 'QC Completed',
        isAwaitingQc: false,
        route: 'Main Warehouse → Coonoor',
        produceTitle: 'Carrot · Grade 1',
        detailText: 'Received: 78.500 KG',
      });
    });
  });

  describe('BR-77e: deriveSubLowStockAlert', () => {
    it('returns hasAlert: false when there is no LOW_STOCK alert', () => {
      const result = deriveSubLowStockAlert([], new Map());
      expect(result.hasAlert).toBe(false);
      expect(result.subText).toBe('');
    });

    it('formats crop name, grade and available weight from LOW_STOCK alert', () => {
      const alerts: AlertItemDto[] = [
        {
          itemKey: 'LOW_STOCK:wh-1:crop-1:GRADE_1',
          type: 'LOW_STOCK',
          messageKey: 'alert.low_stock.message',
          refType: 'WAREHOUSE',
          refId: 'wh-1',
          warehouseId: 'wh-1',
          since: '2026-10-28T00:00:00.000Z',
          state: 'ACTIVE',
          snoozedUntil: null,
          params: {
            cropId: 'crop-1',
            grade: 'GRADE_1',
            totalQtyKg: '12.000',
            thresholdKg: '50.000',
          },
        },
      ];
      const cropNames = new Map([['crop-1', 'Carrot']]);

      const result = deriveSubLowStockAlert(alerts, cropNames);
      expect(result.hasAlert).toBe(true);
      expect(result.title).toBe('Low Stock');
      expect(result.subText).toContain('Carrot');
      expect(result.subText).toContain('Grade 1');
      expect(result.subText).toContain('12');
    });
  });

  describe('BR-104b, BR-104d: mapSubWarehouseActivity & filterSubActivities', () => {
    const fixedNow = new Date('2026-10-28T12:00:00.000Z');

    const sampleEvents: WarehouseActivityEventDto[] = [
      {
        type: 'STOCK_MOVEMENT',
        sourceId: 'sm-1',
        occurredAt: '2026-10-28T08:30:00.000Z',
        reference: 'Tomato — Grade 1',
        status: null,
        severity: null,
        qtyKg: '-5.000',
        direction: null,
        actorId: null,
      },
      {
        type: 'GOODS_RECEIPT',
        sourceId: 'gr-1',
        occurredAt: '2026-10-28T09:15:00.000Z',
        reference: 'GR-2026-001',
        status: 'AWAITING_QC',
        severity: null,
        qtyKg: '150.000',
        direction: null,
        actorId: null,
      },
      {
        type: 'ISSUE',
        sourceId: 'iss-1',
        occurredAt: '2026-10-27T10:00:00.000Z', // Yesterday
        reference: 'ISSUE-001',
        status: 'OPEN',
        severity: 'HIGH',
        qtyKg: null,
        direction: null,
        actorId: null,
      },
      {
        type: 'RETURN',
        sourceId: 'ret-1',
        occurredAt: '2026-10-24T10:00:00.000Z', // This Week
        reference: 'RET-001',
        status: 'PENDING',
        severity: null,
        qtyKg: null,
        direction: null,
        actorId: null,
      },
    ];

    it('maps activity events to SubActivityItems with appropriate badges and categories', () => {
      const items = mapSubWarehouseActivity(sampleEvents, fixedNow);
      expect(items).toHaveLength(4);

      expect(items[0]).toMatchObject({
        title: 'Stock Movement',
        badge: 'Inventory',
        type: 'Inventory',
        dateCategory: 'Today',
      });

      expect(items[1]).toMatchObject({
        title: 'Goods Received',
        badge: 'Receiving',
        type: 'Receiving',
        dateCategory: 'Today',
      });

      expect(items[2]).toMatchObject({
        title: 'Quality Issue',
        badge: 'QC',
        type: 'QC',
        dateCategory: 'Yesterday',
      });

      expect(items[3]).toMatchObject({
        title: 'Order Return',
        badge: 'Orders',
        type: 'Orders',
        dateCategory: 'This Week',
      });
    });

    it('filters items by activity type and date range client-side', () => {
      const items = mapSubWarehouseActivity(sampleEvents, fixedNow);

      const todayOnly = filterSubActivities(items, 'Today', 'All Activities');
      expect(todayOnly.map((i) => i.sourceId)).toEqual(['sm-1', 'gr-1']);

      const yesterdayOnly = filterSubActivities(items, 'Yesterday', 'All Activities');
      expect(yesterdayOnly.map((i) => i.sourceId)).toEqual(['iss-1']);

      const thisWeekOnly = filterSubActivities(items, 'This Week', 'All Activities');
      expect(thisWeekOnly.map((i) => i.sourceId)).toEqual(['sm-1', 'gr-1', 'iss-1', 'ret-1']);

      const inventoryOnly = filterSubActivities(items, 'All Time', 'Inventory');
      expect(inventoryOnly.map((i) => i.sourceId)).toEqual(['sm-1']);

      const qcOnly = filterSubActivities(items, 'All Time', 'QC');
      expect(qcOnly.map((i) => i.sourceId)).toEqual(['iss-1']);
    });
  });

  describe('BR-103: buildSubRmaRecord', () => {
    it('returns null when issue or customer details are missing (no fabricated fallbacks)', () => {
      expect(buildSubRmaRecord(undefined, undefined)).toBeNull();
      expect(buildSubRmaRecord({ issueNo: 'ISSUE-1' }, undefined)).toBeNull();
      expect(buildSubRmaRecord(undefined, { name: 'Customer' })).toBeNull();
      expect(buildSubRmaRecord({ issueNo: 'ISSUE-1' }, { name: 'Customer' })).toBeNull(); // missing orderNo
    });

    it('constructs RmaRecord from real customer and issue details', () => {
      const issue = {
        id: 'iss-1',
        issueNo: 'ISSUE-2026-99',
        orderNo: 'ORD-2026-88',
        category: 'Quality',
        product: 'Tomato Grade 1',
        quantity: '5 KG',
        description: 'Damaged produce',
        dateText: '28 Oct 2026',
        status: 'Open' as const,
      };
      const customer = {
        id: 'cus-1',
        name: 'Venkatesh Rao',
        code: 'CUS-001',
        phone: '+91 9988776655',
        status: 'Active' as const,
        ordersCount: 2,
        lastPurchase: '28 Oct 2026',
      };

      const rma = buildSubRmaRecord(issue, customer);
      expect(rma).not.toBeNull();
      expect(rma?.rmaId).toBe('RMA-2026-99');
      expect(rma?.orderId).toBe('ORD-2026-88');
      expect(rma?.customerName).toBe('Venkatesh Rao');
      expect(rma?.customerPhone).toBe('+91 9988776655');
      expect(rma?.productName).toBe('Tomato Grade 1');
      expect(rma?.quantityPurchased).toBe('5 KG');
      expect(rma?.description).toBe('Damaged produce');
    });
  });
});


describe('BR-64: sales and cash top-up summaries', () => {
  const sales: SalesReportDto = {
    from: '2026-10-28',
    to: '2026-10-28',
    warehouseId: 'w1',
    count: 3,
    total: '1250.50',
    averageOrderValue: '416.83',
    byDay: [],
    byChannel: [
      { channel: 'MARKET', count: 1, total: '250.50' },
      { channel: 'ONLINE', count: 2, total: '1000.00' },
    ],
    byStatus: [],
  };

  it('BR-64: shows a dash while the sales report is loading', () => {
    expect(deriveSubSalesSummary(undefined)).toEqual({
      totalText: '—',
      countNumberText: '—',
      countText: '—',
      channels: [],
    });
  });

  it('BR-64: formats sales money from decimal strings via integer paise, channels in fixed order', () => {
    const s = deriveSubSalesSummary(sales);
    expect(s.totalText).toBe('₹1,250.50');
    expect(s.countText).toBe('3 transactions');
    expect(s.channels.map((c) => [c.label, c.totalText])).toEqual([
      ['Online', '₹1,000'],
      ['Market', '₹250.50'],
    ]);
  });

  it('BR-64c: an empty range is 0 / ₹0 with no channel rows, and 1 is singular', () => {
    const empty = deriveSubSalesSummary({ ...sales, count: 0, total: '0.00', byChannel: [] });
    expect(empty.totalText).toBe('₹0');
    expect(empty.countText).toBe('0 transactions');
    expect(empty.channels).toEqual([]);
    expect(deriveSubSalesSummary({ ...sales, count: 1 }).countText).toBe('1 transaction');
  });

  it('BR-64: summarises cash top-ups and shows a dash while loading', () => {
    const cash: CashTopupsReportDto = {
      from: '2026-10-28',
      to: '2026-10-28',
      warehouseId: 'w1',
      count: 12,
      total: '18500.00',
      byDay: [],
    };
    expect(deriveSubCashSummary(cash)).toEqual({
      totalText: '₹18,500',
      countNumberText: '12',
      countText: '12 transactions',
    });
    expect(deriveSubCashSummary(undefined).totalText).toBe('—');
  });

  it('BR-77: counts only LOW_STOCK alerts, zero padded, dash while loading', () => {
    const alerts = [{ type: 'LOW_STOCK' }, { type: 'LOW_STOCK' }, { type: 'OTHER' }] as unknown as AlertItemDto[];
    expect(deriveSubLowStockCount(alerts)).toBe('02');
    expect(deriveSubLowStockCount(undefined)).toBe('—');
  });
});
