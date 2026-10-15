/**
 * screens/warehouse/dashboard-home-more/mappers_dashboardHome.ts: the pure
 * mapping behind the live Home screens (tasks BR-77/78, alerts BR-77/78,
 * stock & transfer, snapshot BR-66b/BR-80, activity BR-104).
 */
import { describe, expect, it } from 'vitest';
import type { AlertItemDto } from '../api/alerts';
import type { TaskItemDto } from '../api/tasks';
import type { WarehouseTransferSummaryDto } from '../api/transfers';
import type { WarehouseActivityEventDto } from '../api/warehouseActivity';
import type { WarehouseOption } from '../api/warehouseList';
import type { WarehouseCapacityDto } from '../api/warehouses';
import {
  ALERT_SNOOZE_MS,
  activityRange,
  alertFilterFromCategory,
  consolidateStock,
  countAlertsByFilter,
  filterConsolidated,
  filterTaskRows,
  istDateString,
  kgLabel,
  snapshotCapacity,
  snapshotToday,
  snoozeUntil,
  taskKpis,
  taskOpensRecord,
  toActivityRow,
  toAttentionAlert,
  toOverviewCard,
  toTaskRow,
  toTrackedTransfer,
  todayRange,
  transferCountRows,
  warehouseLabel,
  warehouseStockRows,
} from '../screens/warehouse/dashboard-home-more/mappers_dashboardHome';
import type { BatchRow } from '../screens/warehouse/inventory/types';

const WH_A = '11111111-1111-4111-8111-111111111111';
const WH_B = '22222222-2222-4222-8222-222222222222';
// 2026-10-14 20:00 UTC = 2026-10-15 01:30 IST: the IST date has already rolled over.
const NOW = new Date('2026-10-14T20:00:00.000Z');

const OPTIONS: WarehouseOption[] = [
  { warehouseId: WH_A, warehouseName: 'Ooty Warehouse', warehouseCode: 'WH-OOTY', type: 'MAIN', city: 'Ooty', isActive: true },
  { warehouseId: WH_B, warehouseName: 'Coonoor Warehouse', warehouseCode: 'WH-COON', type: 'SUB', city: null, isActive: false },
];

function task(over: Partial<TaskItemDto> = {}): TaskItemDto {
  return {
    itemKey: 'GOODS_RECEIPT_QC:abc',
    type: 'GOODS_RECEIPT_QC',
    titleKey: 'task.goods_receipt_qc.title',
    refType: 'GOODS_RECEIPT',
    refId: '33333333-3333-4333-8333-333333333333',
    warehouseId: WH_A,
    createdAt: '2026-10-14T05:00:00.000Z',
    dueOn: null,
    params: {},
    state: 'OPEN',
    ...over,
  };
}

function capacity(over: Partial<WarehouseCapacityDto> = {}): WarehouseCapacityDto {
  return { warehouseId: WH_A, capacityKg: '1000.000', usedKg: '820.500', availableKg: '179.500', utilizationPercent: 82.05, ...over };
}

describe('dates', () => {
  it('istDateString uses the IST calendar day, not UTC', () => {
    expect(istDateString(NOW)).toBe('2026-10-15');
    expect(istDateString(NOW, -1)).toBe('2026-10-14');
    expect(todayRange(NOW)).toEqual({ from: '2026-10-15', to: '2026-10-15' });
  });

  it('kgLabel goes through integer grams and never shows NaN', () => {
    expect(kgLabel('1250.000')).toBe('1,250 kg');
    expect(kgLabel('12.350')).toBe('12.35 kg');
    expect(kgLabel('abc')).toBeNull();
    expect(kgLabel(null)).toBeNull();
  });
});

describe('tasks (BR-77, BR-78)', () => {
  it('BR-77: maps a task with its reference code, details and no invented due date', () => {
    const row = toTaskRow(task({ params: { grnNumber: 'GRN-0042', cropName: 'Carrot', grossQtyKg: '95.000' } }), NOW);
    expect(row.title).toBe('QC pending · GRN-0042');
    expect(row.details).toBe('Carrot · 95 kg');
    expect(row.dueLabel).toBeNull();
    expect(row.dueToday).toBe(false);
    expect(row.done).toBe(false);
    expect(row.destination).toEqual({ module: 'receiving', refId: row.refId });
  });

  it('BR-77: flags a task due on the IST today', () => {
    const row = toTaskRow(task({ dueOn: '2026-10-15' }), NOW);
    expect(row.dueToday).toBe(true);
    expect(row.dueLabel).toContain('Due');
  });

  it('BR-78: a DONE task is done; there is no in-progress state', () => {
    const row = toTaskRow(task({ state: 'DONE' }), NOW);
    expect(row.done).toBe(true);
    expect(Object.keys(row)).not.toContain('status');
    expect(Object.keys(row)).not.toContain('priority');
  });

  it('searches over title and reference', () => {
    const rows = [toTaskRow(task({ params: { orderNumber: 'ORD-1' }, type: 'ORDER_PACK' }), NOW), toTaskRow(task(), NOW)];
    expect(filterTaskRows(rows, 'ord-1')).toHaveLength(1);
    expect(filterTaskRows(rows, '  ')).toHaveLength(2);
  });

  it('BR-77: KPI tiles read the summary and show no fake zero before it loads', () => {
    expect(taskKpis(undefined).map((k) => k.value)).toEqual(['—', '—', '—', '—']);
    const kpis = taskKpis({ open: 9, byType: { GOODS_RECEIPT_QC: 2, ORDER_PACK: 3, ORDER_DISPATCH: 1, ORDER_PICKUP_OTP: 1, RETURN_INSPECTION: 1, RETURN_APPROVAL: 1 } });
    expect(kpis.map((k) => k.value)).toEqual(['9', '2', '5', '2']);
  });

  it('only order and receiving tasks open a host record', () => {
    expect(taskOpensRecord(toTaskRow(task({ type: 'ORDER_DISPATCH', refType: 'ORDER' }), NOW))).toBe(true);
    expect(taskOpensRecord(toTaskRow(task(), NOW))).toBe(true);
    expect(taskOpensRecord(toTaskRow(task({ type: 'RETURN_APPROVAL', refType: 'RETURN_REQUEST' }), NOW))).toBe(false);
  });
});

describe('alerts (BR-77, BR-78)', () => {
  const alert = (over: Partial<AlertItemDto> = {}): AlertItemDto => ({
    itemKey: 'low_stock:wh:crop:GRADE_1',
    type: 'LOW_STOCK',
    messageKey: 'alert.low_stock.message',
    refType: 'WAREHOUSE',
    refId: WH_A,
    warehouseId: WH_A,
    since: '2026-10-14T19:00:00.000Z',
    params: { grade: 'GRADE_1', totalQtyKg: '90.000', thresholdKg: '300.000' },
    state: 'ACTIVE',
    snoozedUntil: null,
    ...over,
  });

  it('BR-77: maps an alert with its translated title and message', () => {
    const a = toAttentionAlert(alert(), NOW);
    expect(a.title).toBe('Low stock');
    expect(a.message).toContain('90 kg');
    expect(a.snoozed).toBe(false);
    expect(a.snoozedUntil).toBeUndefined();
  });

  it('BR-78: a snoozed alert carries its end time', () => {
    const a = toAttentionAlert(alert({ state: 'SNOOZED', snoozedUntil: '2026-10-14T21:00:00.000Z' }), NOW);
    expect(a.snoozed).toBe(true);
    expect(a.snoozedUntil).toBeTruthy();
  });

  it('counts per filter chip', () => {
    const list = [toAttentionAlert(alert(), NOW), toAttentionAlert(alert({ type: 'BATCH_NEAR_EXPIRY', itemKey: 'x' }), NOW)];
    expect(countAlertsByFilter(list)).toEqual({ all: 2, LOW_STOCK: 1, BATCH_NEAR_EXPIRY: 1, CAPACITY_NEAR_FULL: 0 });
  });

  it('maps the Sales hub categories onto alert filters (no alert source for payments / invoices)', () => {
    expect(alertFilterFromCategory('stock_issue')).toBe('LOW_STOCK');
    expect(alertFilterFromCategory('payment_pending')).toBe('all');
    expect(alertFilterFromCategory('CAPACITY_NEAR_FULL')).toBe('CAPACITY_NEAR_FULL');
    expect(alertFilterFromCategory(undefined)).toBe('all');
  });

  it('BR-78f: snoozes one hour ahead (the server caps with alert_snooze_max_hours)', () => {
    expect(snoozeUntil(NOW).getTime() - NOW.getTime()).toBe(ALERT_SNOOZE_MS);
    expect(ALERT_SNOOZE_MS).toBe(60 * 60 * 1000);
  });
});

describe('warehouses and stock (BR-66b)', () => {
  it('BR-66b: an overview card shows used kg and the server utilisation, clamped for the bar', () => {
    const card = toOverviewCard(OPTIONS[0]!, capacity());
    expect(card.stockLabel).toBe('820.5 kg');
    expect(card.capacityLabel).toBe('82% used');
    expect(card.progressPercent).toBe(82);
    const over = toOverviewCard(OPTIONS[0]!, capacity({ utilizationPercent: 130.4 }));
    expect(over.progressPercent).toBe(100);
    expect(over.overCapacity).toBe(true);
  });

  it('a warehouse without a capacity has no bar; an unloaded one shows no value', () => {
    expect(toOverviewCard(OPTIONS[0]!, capacity({ capacityKg: null, availableKg: null, utilizationPercent: null })).progressPercent).toBeNull();
    expect(toOverviewCard(OPTIONS[0]!, undefined).stockLabel).toBe('—');
  });

  it('totals stock rows only when every warehouse is known', () => {
    const map = new Map([
      [WH_A, capacity()],
      [WH_B, capacity({ warehouseId: WH_B, usedKg: '100.000' })],
    ]);
    expect(warehouseStockRows(OPTIONS, map).total).toBe('920.5 kg');
    expect(warehouseStockRows(OPTIONS, new Map([[WH_A, capacity()]])).total).toBe('—');
    expect(warehouseStockRows(OPTIONS, undefined).rows.map((r) => r.value)).toEqual(['—', '—']);
  });

  it('names a warehouse from the real list, never a fixture id', () => {
    expect(warehouseLabel(OPTIONS, WH_B)).toBe('Coonoor Warehouse');
    expect(warehouseLabel(OPTIONS, 'WH-OOTY')).toBe('Warehouse');
  });

  it('consolidates ACTIVE batch stock per product and warehouse', () => {
    const batch = (over: Partial<BatchRow>): BatchRow => ({
      id: 'b',
      batchCode: 'B',
      warehouseId: WH_A,
      cropId: 'carrot',
      grade: 'GRADE_1',
      productName: 'Carrot',
      gradeLabel: 'Grade 1',
      status: 'active',
      statusLabel: 'Active',
      availableGrams: 100_000,
      receivedGrams: null,
      reservedGrams: null,
      storageLocation: null,
      receivedOn: '',
      expiryOn: '',
      ...over,
    });
    const products = consolidateStock(
      [
        batch({}),
        batch({ warehouseId: WH_B, availableGrams: 50_500 }),
        batch({ warehouseId: WH_B, availableGrams: 999_000, status: 'depleted' as BatchRow['status'] }),
        batch({ cropId: 'beans', productName: 'Beans', availableGrams: 500_000 }),
      ],
      OPTIONS,
    );
    expect(products.map((p) => p.label)).toEqual(['Beans · Grade 1', 'Carrot · Grade 1']);
    expect(products[1]?.total).toBe('150.5 kg');
    expect(products[1]?.rows.map((r) => r.name)).toEqual(['Ooty Warehouse', 'Coonoor Warehouse']);
    expect(filterConsolidated(products, 'carr')).toHaveLength(1);
  });

  it('BR-66b / BR-80: snapshot figures come from capacity and today performance only', () => {
    const cap = snapshotCapacity(capacity({ availableKg: '-20.000', utilizationPercent: 102 }));
    expect(cap.available).toBe('0 kg');
    expect(cap.overCapacity).toBe(true);
    expect(snapshotCapacity(undefined).stock).toBe('—');
    expect(snapshotToday(undefined).receipts).toBe('—');
  });
});

describe('transfers (BR-102)', () => {
  it('rows for every status, no value before the counts load', () => {
    expect(transferCountRows(undefined).map((r) => r.value)).toEqual(['—', '—', '—', '—']);
    expect(transferCountRows({ PENDING_APPROVAL: 1, IN_TRANSIT: 2, RECEIVED: 3, CANCELLED: 0 }).map((r) => r.value)).toEqual(['1', '2', '3', '0']);
  });

  it('a tracked transfer names both warehouses', () => {
    const dto = {
      id: 'id',
      transferNumber: 'TRF-0001',
      fromWarehouseId: WH_A,
      toWarehouseId: WH_B,
      status: 'IN_TRANSIT',
      createdAt: '2026-10-14T10:00:00.000Z',
      hasDiscrepancy: false,
    } as WarehouseTransferSummaryDto;
    const row = toTrackedTransfer(dto, OPTIONS, NOW);
    expect(row.route).toBe('Ooty Warehouse → Coonoor Warehouse');
    expect(row.statusLabel).toBe('In transit');
  });
});

describe('activity feed (BR-104)', () => {
  it('BR-104: date chips map to inclusive IST from/to; all sends none', () => {
    expect(activityRange('today', NOW)).toEqual({ from: '2026-10-15', to: '2026-10-15' });
    expect(activityRange('yesterday', NOW)).toEqual({ from: '2026-10-14', to: '2026-10-14' });
    expect(activityRange('week', NOW)).toEqual({ from: '2026-10-09', to: '2026-10-15' });
    expect(activityRange('all', NOW)).toEqual({});
  });

  it('BR-104: maps an event without inventing an actor name', () => {
    const dto: WarehouseActivityEventDto = {
      type: 'STOCK_MOVEMENT',
      sourceId: '44444444-4444-4444-8444-444444444444',
      occurredAt: '2026-10-14T10:00:00.000001Z',
      reference: 'TRANSFER_OUT',
      status: null,
      severity: null,
      qtyKg: '-5.000',
      direction: null,
      actorId: '55555555-5555-4555-8555-555555555555',
    };
    const row = toActivityRow(dto, NOW);
    expect(row.reference).toBe('Transfer out');
    expect(row.qty).toBe('-5 kg');
    expect(row.typeLabel).toBe('Stock');
    expect(JSON.stringify(row)).not.toContain(dto.actorId!);
    const transfer = toActivityRow({ ...dto, type: 'TRANSFER', reference: 'TRF-1', qtyKg: null, direction: 'INBOUND', status: 'RECEIVED' }, NOW);
    expect(transfer.reference).toBe('TRF-1');
    expect(transfer.direction).toBe('Inbound');
  });
});
