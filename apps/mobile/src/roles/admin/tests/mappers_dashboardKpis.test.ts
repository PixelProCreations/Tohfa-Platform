/**
 * screens/warehouse/dashboard-home-more/mappers_dashboardKpis.ts: the pure
 * mapping behind the live Main / Sub dashboard KPIs (performance BR-80,
 * sales summary BR-96, capacity BR-66b, activity BR-104). An unloaded figure
 * must read as the dash, never as an invented 0.
 */
import { describe, expect, it } from 'vitest';
import type { TransferStatusCounts } from '../api/dashboardFeeds';
import type { WarehouseActivityEventDto } from '../api/warehouseActivity';
import type { WarehouseOption } from '../api/warehouseList';
import type { WarehousePerformanceDto } from '../api/warehouseOps';
import type { WarehouseCapacityDto } from '../api/warehouses';
import { t } from '../i18n';
import {
  activitySubLine,
  activityTimelineLine,
  capacityFigures,
  countLabel,
  gramsLabel,
  kpiWarehouseIds,
  mergeRecentActivity,
  moneyLabel,
  monthToDateRange,
  pendingTransferCount,
  performanceFigures,
  sumPerformance,
} from '../screens/warehouse/dashboard-home-more/mappers_dashboardKpis';

const WH_A = '11111111-1111-4111-8111-111111111111';
const WH_B = '22222222-2222-4222-8222-222222222222';
// 2026-10-14 20:00 UTC = 2026-10-15 01:30 IST.
const NOW = new Date('2026-10-14T20:00:00.000Z');
const DASH = t('dashboardHome.noValue');

const OPTIONS: WarehouseOption[] = [
  { warehouseId: WH_A, warehouseName: 'Ooty Warehouse', warehouseCode: 'WH-OOTY', type: 'MAIN', city: 'Ooty', isActive: true },
  { warehouseId: WH_B, warehouseName: 'Coonoor Warehouse', warehouseCode: 'WH-COON', type: 'SUB', city: null, isActive: true },
];

function perf(over: Partial<{ receipts: number; gross: string; accepted: string; rejected: string; placed: number; fulfilled: number; cancelled: number; returns: number }> = {}): WarehousePerformanceDto {
  return {
    warehouseId: WH_A,
    from: '2026-10-15',
    to: '2026-10-15',
    orders: { placed: over.placed ?? 3, fulfilled: over.fulfilled ?? 2, cancelled: over.cancelled ?? 1, byStatus: [] },
    receiving: {
      goodsReceipts: over.receipts ?? 2,
      byStatus: [],
      grossQtyKg: over.gross ?? '100.500',
      acceptedQtyKg: over.accepted ?? '90.000',
      rejectedQtyKg: over.rejected ?? '10.500',
    },
    returns: { requested: over.returns ?? 1, byStatus: [] },
    stockMovements: [],
  };
}

function capacity(warehouseId: string, usedKg: string, capacityKg: string | null): WarehouseCapacityDto {
  return { warehouseId, usedKg, capacityKg, availableKg: null, utilizationPercent: null } as unknown as WarehouseCapacityDto;
}

function event(over: Partial<WarehouseActivityEventDto> = {}): WarehouseActivityEventDto {
  return {
    type: 'GOODS_RECEIPT',
    sourceId: 'src-1',
    occurredAt: '2026-10-14T19:00:00.000Z',
    reference: 'GRN-000123',
    status: 'ACCEPTED',
    severity: null,
    qtyKg: '50.000',
    direction: null,
    actorId: null,
    ...over,
  };
}

describe('labels: unknown is the dash, never 0', () => {
  it('countLabel', () => {
    expect(countLabel(7)).toBe('7');
    expect(countLabel(0)).toBe('0');
    expect(countLabel(null)).toBe(DASH);
    expect(countLabel(undefined)).toBe(DASH);
  });

  it('gramsLabel', () => {
    expect(gramsLabel(1240000)).toBe(t('unit.kg', { value: '1,240' }));
    expect(gramsLabel(null)).toBe(DASH);
  });

  it('moneyLabel formats server Money through paise and refuses garbage (BR-96)', () => {
    expect(moneyLabel('145100.00')).toBe('₹1,45,100');
    expect(moneyLabel('0.10')).toBe('₹0.10');
    expect(moneyLabel(undefined)).toBe(DASH);
    expect(moneyLabel('')).toBe(DASH);
    expect(moneyLabel('abc')).toBe(DASH);
  });
});

describe('ranges and scope', () => {
  it('month-to-date runs from the 1st to today in IST', () => {
    expect(monthToDateRange(NOW)).toEqual({ from: '2026-10-01', to: '2026-10-15' });
  });

  it('kpiWarehouseIds narrows to a known pick, else every warehouse', () => {
    expect(kpiWarehouseIds(OPTIONS, undefined)).toEqual([WH_A, WH_B]);
    expect(kpiWarehouseIds(OPTIONS, WH_B)).toEqual([WH_B]);
    expect(kpiWarehouseIds(OPTIONS, 'WH-OOTY')).toEqual([WH_A, WH_B]);
  });
});

describe('performance (BR-80)', () => {
  it('sums counts exactly and kg through integer grams', () => {
    const totals = sumPerformance([perf(), perf({ gross: '0.001', accepted: '0.001', rejected: '0.000', placed: 4 })]);
    expect(totals.goodsReceipts).toBe(4);
    expect(totals.grossGrams).toBe(100501);
    expect(totals.acceptedGrams).toBe(90001);
    expect(totals.rejectedGrams).toBe(10500);
    expect(totals.ordersPlaced).toBe(7);
    expect(totals.ordersFulfilled).toBe(4);
    expect(totals.ordersCancelled).toBe(2);
    expect(totals.returnsRequested).toBe(2);
  });

  it('an unreadable quantity makes that kg total unknown rather than wrong', () => {
    expect(sumPerformance([perf(), perf({ gross: 'n/a' })]).grossGrams).toBeNull();
  });

  it('figures are the dash until loaded', () => {
    const none = performanceFigures(undefined);
    expect(Object.values(none).every((v) => v === DASH)).toBe(true);
    const some = performanceFigures(sumPerformance([perf()]));
    expect(some.receipts).toBe('2');
    expect(some.ordersPlaced).toBe('3');
    expect(some.rejectedKg).toBe(t('unit.kg', { value: '10.5' }));
  });
});

describe('transfers', () => {
  it('pending = awaiting approval + in transit; null before load', () => {
    const counts: TransferStatusCounts = { PENDING_APPROVAL: 2, IN_TRANSIT: 3, RECEIVED: 9, CANCELLED: 1 };
    expect(pendingTransferCount(counts)).toBe(5);
    expect(pendingTransferCount(undefined)).toBeNull();
  });
});

describe('capacity (BR-66b)', () => {
  it('sums used over all, available and utilization over warehouses with a capacity', () => {
    const map = new Map([
      [WH_A, capacity(WH_A, '800.000', '1000.000')],
      [WH_B, capacity(WH_B, '200.000', null)],
    ]);
    const figures = capacityFigures([WH_A, WH_B], map);
    expect(figures.used).toBe(t('unit.kg', { value: '1,000' }));
    expect(figures.available).toBe(t('unit.kg', { value: '200' }));
    expect(figures.utilization).toBe(t('dashboardHome.capacity.percent', { percent: 80 }));
    expect(figures.hasCapacity).toBe(true);
  });

  it('over capacity is 0 kg available, not negative', () => {
    const map = new Map([[WH_A, capacity(WH_A, '1200.000', '1000.000')]]);
    expect(capacityFigures([WH_A], map).available).toBe(t('unit.kg', { value: '0' }));
  });

  it('no capacity set anywhere says so; a missing warehouse makes everything unknown', () => {
    const map = new Map([[WH_A, capacity(WH_A, '5.000', null)]]);
    expect(capacityFigures([WH_A], map).utilization).toBe(t('dashboardHome.capacity.notSet'));
    expect(capacityFigures([WH_A, WH_B], map).used).toBe(DASH);
    expect(capacityFigures([WH_A], undefined).used).toBe(DASH);
  });
});

describe('recent activity across warehouses (BR-104)', () => {
  it('merges newest first, names the warehouse, keeps keys distinct, honours the limit', () => {
    const rows = mergeRecentActivity(
      [
        { warehouseId: WH_A, items: [event({ occurredAt: '2026-10-14T18:00:00.000Z', reference: 'GRN-A' })] },
        {
          warehouseId: WH_B,
          items: [
            event({ occurredAt: '2026-10-14T19:30:00.000Z', reference: 'GRN-B', sourceId: 'b1' }),
            event({ occurredAt: '2026-10-14T10:00:00.000Z', reference: 'GRN-OLD', sourceId: 'b2' }),
          ],
        },
      ],
      OPTIONS,
      NOW,
      2,
    );
    expect(rows.map((r) => r.reference)).toEqual(['GRN-B', 'GRN-A']);
    expect(rows[0]?.warehouseName).toBe('Coonoor Warehouse');
    expect(new Set(rows.map((r) => r.key)).size).toBe(2);
  });

  it('the same transfer in both warehouses stays two rows', () => {
    const e = event({ type: 'TRANSFER', reference: 'TRF-1', qtyKg: null });
    const rows = mergeRecentActivity([{ warehouseId: WH_A, items: [e] }, { warehouseId: WH_B, items: [e] }], OPTIONS, NOW, 5);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.key).not.toBe(rows[1]?.key);
  });

  it('timeline and sub lines come from the row, or the empty text', () => {
    const [row] = mergeRecentActivity([{ warehouseId: WH_A, items: [event()] }], OPTIONS, NOW, 1);
    expect(row).toBeDefined();
    expect(activityTimelineLine(row)).toContain('GRN-000123');
    expect(activityTimelineLine(row)).toContain('Ooty Warehouse');
    expect(activitySubLine(row!)).toBe(t('mainDashboard.activity.sub', { warehouse: 'Ooty Warehouse', qty: t('unit.kg', { value: '50' }) }));
    expect(activityTimelineLine(undefined)).toBe(t('mainDashboard.activity.none'));
  });
});
