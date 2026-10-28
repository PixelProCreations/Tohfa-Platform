/**
 * screens/dashboard/mappers_mainDashboard.ts: every figure the Main Warehouse
 * dashboard (D01 Home, D02 Warehouse Overview, D04 Stock & Transfer, D05
 * Alerts & Action Center) draws from the API. Pure functions, plain-Node vitest.
 *
 * The rule under test everywhere: a figure is drawn only from what the server
 * returned. Loading / failed sources show the placeholder, a malformed value
 * fails the derivation (never a 0), and nothing the API does not carry
 * (priority, read state, surplus, targets) is invented.
 */
import { describe, expect, it } from 'vitest';
import type { AlertItemDto } from '../api/alerts';
import type { BatchDto } from '../api/inventory';
import type { GoodsReceiptDto, PurchaseOrderDto } from '../api/receiving';
import type { WarehouseActivityEventDto } from '../api/warehouseActivity';
import type { WarehousePerformanceDto } from '../api/warehouseOps';
import type { WarehouseTransferDto } from '../api/warehouseTransfers';
import type { WarehouseCapacityDto, WarehouseDto } from '../api/warehouses';
import { t } from '../i18n';
import { nearFullSignal } from '../screens/warehouse/warehouse-admin/overviewFigures';
import {
  ALERT_TYPE_FILTERS,
  FIGURE_PLACEHOLDER,
  MAIN_DASHBOARD_CODES,
  activityTimelineLine,
  alertFilterLabel,
  barWidthPercent,
  combineStatus,
  countLabel,
  coveredWarehouseIds,
  dashboardAccess,
  deriveCapacityRows,
  deriveExpectedToday,
  deriveOpenIssues,
  deriveProductStock,
  deriveReceiptFigures,
  deriveTransfers,
  figureOr,
  filterDashboardAlerts,
  filterProductStock,
  findWarehouseByName,
  formatKgFigure,
  formatUtilization,
  greetingText,
  mergeRecentActivity,
  salesRevenueText,
  sectionStatus,
  sumOrdersPlaced,
  toDashboardAlerts,
  toLowStockItems,
  toOverviewCards,
  toWarehouseOptions,
  warehouseShortName,
} from '../screens/dashboard/mappers_mainDashboard';

const OOTY = '11111111-1111-4111-8111-111111111111';
const COON = '22222222-2222-4222-8222-222222222222';
const KOTA = '33333333-3333-4333-8333-333333333333';
const CROP_CARROT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const CROP_BEANS = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
// 2026-10-26 10:00 IST
const NOW = new Date('2026-10-26T04:30:00.000Z');
const TODAY = '2026-10-26';

function wh(id: string, name: string): WarehouseDto {
  return { id, code: name.slice(0, 3).toUpperCase(), name, type: 'SUB', isActive: true, createdAt: '2026-01-01T00:00:00.000Z' };
}
const WAREHOUSES = [wh(OOTY, 'Ooty Warehouse'), wh(COON, 'Coonoor Warehouse'), wh(KOTA, 'Kotagiri Warehouse')];

function cap(warehouseId: string, over: Partial<WarehouseCapacityDto> = {}): WarehouseCapacityDto {
  return { warehouseId, capacityKg: '1000.000', usedKg: '820.000', availableKg: '180.000', utilizationPercent: 82, ...over };
}

function receipt(over: Partial<GoodsReceiptDto>): GoodsReceiptDto {
  return {
    id: 'g',
    grnNumber: 'GRN-1',
    purchaseOrderId: 'po',
    warehouseId: OOTY,
    grossQtyKg: '100.000',
    status: 'ACCEPTED',
    receivedAt: '2026-10-26T03:00:00.000Z',
    ...over,
  };
}

function po(over: Partial<PurchaseOrderDto>): PurchaseOrderDto {
  return {
    id: 'p',
    poNumber: 'PO-1',
    farmerId: 'f',
    warehouseId: OOTY,
    quantityKg: '50.000',
    pricePerKg: '10.00' as PurchaseOrderDto['pricePerKg'],
    totalAmount: '500.00' as PurchaseOrderDto['totalAmount'],
    status: 'ISSUED',
    expectedDeliveryDate: TODAY,
    ...over,
  };
}

function transfer(over: Partial<WarehouseTransferDto>): WarehouseTransferDto {
  return {
    id: 't',
    transferNumber: 'TRF-000001',
    fromWarehouseId: COON,
    toWarehouseId: OOTY,
    status: 'IN_TRANSIT',
    totalValue: '12000.50' as WarehouseTransferDto['totalValue'],
    hasUnvaluedLines: false,
    requiresApproval: false,
    hasDiscrepancy: false,
    vehicleNumber: null,
    notes: null,
    receiptNote: null,
    cancelReason: null,
    initiatedBy: 'u',
    approvedBy: null,
    approvedAt: null,
    dispatchedAt: null,
    receivedBy: null,
    receivedAt: null,
    cancelledBy: null,
    cancelledAt: null,
    createdAt: '2026-10-18T05:00:00.000Z',
    updatedAt: null,
    ...over,
  };
}

function alert(over: Partial<AlertItemDto>): AlertItemDto {
  return {
    itemKey: `LOW_STOCK:${COON}:${CROP_BEANS}:GRADE_1`,
    type: 'LOW_STOCK',
    messageKey: 'alert.low_stock.message',
    refType: 'WAREHOUSE',
    refId: COON,
    warehouseId: COON,
    since: '2026-10-26T03:00:00.000Z',
    params: { cropId: CROP_BEANS, grade: 'GRADE_1', totalQtyKg: '90.000', thresholdKg: '300.000' },
    state: 'ACTIVE',
    snoozedUntil: null,
    ...over,
  };
}

function batch(over: Partial<BatchDto>): BatchDto {
  return {
    id: 'b',
    batchCode: 'B-1',
    warehouseId: OOTY,
    cropId: CROP_CARROT,
    cropName: 'Carrot',
    grade: 'GRADE_1',
    qtyAvailableKg: '850.000',
    status: 'ACTIVE',
    ...over,
  };
}

function event(over: Partial<WarehouseActivityEventDto>): WarehouseActivityEventDto {
  return {
    type: 'GOODS_RECEIPT',
    sourceId: 's',
    occurredAt: '2026-10-26T04:15:00.000000Z',
    reference: 'GRN-04512',
    status: 'ACCEPTED',
    severity: null,
    qtyKg: '140.000',
    direction: null,
    actorId: null,
    ...over,
  };
}

describe('section status: nothing is drawn before the server answered', () => {
  it('loading, error and ready from a query result', () => {
    expect(sectionStatus({ isLoading: true, isFetching: true, error: null, data: undefined })).toBe('loading');
    expect(sectionStatus({ isLoading: false, isFetching: false, error: new Error('x'), data: undefined })).toBe('error');
    expect(sectionStatus({ isLoading: false, isFetching: false, error: null, data: [] })).toBe('ready');
    // A failed refresh does not blank data already shown.
    expect(sectionStatus({ isLoading: false, isFetching: false, error: new Error('x'), data: [1] })).toBe('ready');
    // A disabled query (never started) is not ready.
    expect(sectionStatus({ isLoading: false, isFetching: false, error: null, data: undefined })).toBe('loading');
  });

  it('several sources: error wins, then loading, then ready', () => {
    expect(combineStatus(['ready', 'loading', 'error'])).toBe('error');
    expect(combineStatus(['ready', 'loading'])).toBe('loading');
    expect(combineStatus(['ready', 'ready'])).toBe('ready');
  });

  it('a figure is the placeholder until its source is ready (never 0)', () => {
    expect(figureOr('loading', () => '12')).toBe(FIGURE_PLACEHOLDER);
    expect(figureOr('error', () => '12')).toBe(FIGURE_PLACEHOLDER);
    expect(figureOr('ready', () => '12')).toBe('12');
  });

  it('a walked count says "at least" when the page cap cut it short', () => {
    expect(countLabel(12, true)).toBe('12');
    expect(countLabel(12, false)).toBe('12+');
  });
});

describe('warehouses: live uuids, never seed codes (BR-30)', () => {
  it('short names, selector options and lookup by the names other screens hand back', () => {
    expect(warehouseShortName('Gudalur Market Warehouse')).toBe('Gudalur Market');
    expect(toWarehouseOptions(WAREHOUSES)[0]).toEqual({ warehouseId: OOTY, warehouseName: 'Ooty Warehouse' });
    expect(findWarehouseByName(WAREHOUSES, 'Coonoor')?.id).toBe(COON);
    expect(findWarehouseByName(WAREHOUSES, 'Kotagiri Warehouse')?.id).toBe(KOTA);
    expect(findWarehouseByName(WAREHOUSES, 'All Warehouses')).toBeUndefined();
  });

  it('the filter covers every warehouse, the picked one, or none when it is not listed', () => {
    expect(coveredWarehouseIds(WAREHOUSES, undefined)).toEqual([OOTY, COON, KOTA]);
    expect(coveredWarehouseIds(WAREHOUSES, COON)).toEqual([COON]);
    expect(coveredWarehouseIds(WAREHOUSES, 'WH-OOTY')).toEqual([]);
  });
});

describe('BR-66 / BR-66b: stock and capacity from GET /warehouses/{id}/capacity', () => {
  it('rows in grams and basis points, the network total, nothing clamped', () => {
    const d = deriveCapacityRows(WAREHOUSES, new Map([
      [OOTY, cap(OOTY)],
      [COON, cap(COON, { usedKg: '1200.500', availableKg: '-200.500', utilizationPercent: 120.05 })],
      [KOTA, cap(KOTA, { capacityKg: null, usedKg: '10.250', availableKg: null, utilizationPercent: null })],
    ]));
    expect(d.ok).toBe(true);
    if (!d.ok) return;
    expect(d.value.rows.map((r) => [r.name, r.usedGrams, r.capacityGrams, r.utilizationBp])).toEqual([
      ['Ooty', 820000, 1000000, 8200],
      ['Coonoor', 1200500, 1000000, 12005],
      ['Kotagiri', 10250, null, null],
    ]);
    expect(d.value.rows[1]?.availableGrams).toBe(-200500);
    expect(d.value.totalUsedGrams).toBe(2030750);
  });

  it('only the covered warehouses are rows (a filter never draws other warehouses as 0 kg)', () => {
    const d = deriveCapacityRows(WAREHOUSES, new Map([[COON, cap(COON)]]));
    expect(d.ok && d.value.rows.map((r) => r.warehouseId)).toEqual([COON]);
  });

  it('a malformed quantity fails the figure instead of showing 0', () => {
    expect(deriveCapacityRows(WAREHOUSES, new Map([[OOTY, cap(OOTY, { usedKg: 'lots' })]])).ok).toBe(false);
  });

  it('kg figures without the unit, utilization with two decimals at most, bars clamped only on the track', () => {
    expect(formatKgFigure(12840000)).toBe('12,840');
    expect(formatKgFigure(1234567890)).toBe('12,34,567.89');
    expect(formatUtilization(8200)).toBe('82%');
    expect(formatUtilization(4167)).toBe('41.67%');
    expect(formatUtilization(12005)).toBe('120.05%');
    expect(formatUtilization(4150)).toBe('41.5%');
    expect(barWidthPercent(12005)).toBe(100);
    expect(barWidthPercent(5849)).toBe(58);
    expect(barWidthPercent(null)).toBe(0);
  });
});

describe("today's receiving (GET /admin/goods-receipts, GET /admin/purchase-orders)", () => {
  it('arrived, discrepancies, damage and rejected over the receipts, with gross kg per warehouse', () => {
    const d = deriveReceiptFigures([
      receipt({ id: '1', status: 'ACCEPTED', grossQtyKg: '100.000' }),
      receipt({ id: '2', status: 'PARTIALLY_ACCEPTED', rejectedQtyKg: '5.000', grossQtyKg: '50.500' }),
      receipt({ id: '3', status: 'REJECTED', warehouseId: COON, grossQtyKg: '20.000' }),
      receipt({ id: '4', status: 'AWAITING_QC', warehouseId: COON, grossQtyKg: '10.000', rejectedQtyKg: '0.000' }),
    ]);
    expect(d).toEqual({
      ok: true,
      value: { arrived: 4, discrepancies: 2, damaged: 1, rejected: 1, grossGramsByWarehouse: { [OOTY]: 150500, [COON]: 30000 } },
    });
  });

  it('a receipt with an unreadable weight fails the figures', () => {
    expect(deriveReceiptFigures([receipt({ grossQtyKg: '1e3' })]).ok).toBe(false);
  });

  it('expected today: open purchase orders due on the IST day, counted and summed in grams', () => {
    const d = deriveExpectedToday(
      [
        po({ id: 'a', quantityKg: '50.000' }),
        po({ id: 'b', status: 'PARTIALLY_RECEIVED', quantityKg: '25.250' }),
        po({ id: 'c', expectedDeliveryDate: '2026-10-27' }),
        po({ id: 'd', expectedDeliveryDate: null }),
        po({ id: 'e', status: 'RECEIVED' }),
      ],
      TODAY,
    );
    expect(d).toEqual({ ok: true, value: { count: 2, grams: 75250 } });
  });
});

describe('orders, issues and sales', () => {
  function perf(warehouseId: string, placed: number): WarehousePerformanceDto {
    return {
      warehouseId,
      from: TODAY,
      to: TODAY,
      orders: { placed, fulfilled: 0, cancelled: 0, byStatus: [] },
      receiving: { goodsReceipts: 0, byStatus: [], grossQtyKg: '0.000', acceptedQtyKg: '0.000', rejectedQtyKg: '0.000' },
      returns: { requested: 0, byStatus: [] },
      stockMovements: [],
    };
  }

  it("BR-80: today's orders are the server's exact placed counts, summed", () => {
    expect(sumOrdersPlaced([perf(OOTY, 3), perf(COON, 4)])).toEqual({ ok: true, value: 7 });
    expect(sumOrdersPlaced([perf(OOTY, 1.5)]).ok).toBe(false);
  });

  it('BR-103: open issues over the covered warehouses; a missing count fails the total', () => {
    expect(deriveOpenIssues({ [OOTY]: 2, [COON]: 3 }, [OOTY, COON])).toEqual({ ok: true, value: { total: 5, byWarehouse: { [OOTY]: 2, [COON]: 3 } } });
    expect(deriveOpenIssues({ [OOTY]: 2 }, [OOTY, COON]).ok).toBe(false);
  });

  it('BR-96: revenue through integer paise; malformed is a failure, not Rs 0', () => {
    const ok = salesRevenueText({ revenue: '145100.00' });
    expect(ok.ok && ok.value).toBe('₹1,45,100');
    expect(salesRevenueText({ revenue: '' }).ok).toBe(false);
  });
});

describe('BR-102: transfers from GET /warehouse-transfers', () => {
  it('counts per status, open = pending approval + in transit, exact only when the page holds every transfer', () => {
    const d = deriveTransfers(
      [
        transfer({ id: '1', status: 'PENDING_APPROVAL', hasUnvaluedLines: true }),
        transfer({ id: '2', status: 'IN_TRANSIT' }),
        transfer({ id: '3', status: 'RECEIVED', hasDiscrepancy: true }),
        transfer({ id: '4', status: 'CANCELLED' }),
      ],
      4,
      WAREHOUSES,
    );
    expect(d.ok).toBe(true);
    if (!d.ok) return;
    expect(d.value.counts).toEqual({ pendingApproval: 1, inTransit: 1, received: 1, cancelled: 1, discrepancies: 1, open: 2, exact: true });
    expect(d.value.rows[1]).toEqual({
      id: 'TRF-000001',
      route: t('mainDashboard.transfer.route', { from: 'Coonoor', to: 'Ooty' }),
      kind: 'inTransit',
      statusLabel: t('mainDashboard.transfer.status.inTransit'),
      details: t('mainDashboard.transfer.detailsWithValue', { date: '18 Oct 2026', value: '₹12,000.50' }),
    });
    // A line with no cost: the value is left out, never shown as a smaller total.
    expect(d.value.rows[0]?.details).toBe(t('mainDashboard.transfer.details', { date: '18 Oct 2026' }));
    expect(deriveTransfers([transfer({})], 30, WAREHOUSES).ok && deriveTransfers([transfer({})], 30, WAREHOUSES)).toMatchObject({
      value: { counts: { exact: false } },
    });
  });

  it('a transfer value that is not Money fails the figures', () => {
    expect(deriveTransfers([transfer({ totalValue: 'abc' as WarehouseTransferDto['totalValue'] })], 1, WAREHOUSES).ok).toBe(false);
  });
});

describe('BR-77 / BR-78: alerts from GET /admin/alerts (no priority, no read state invented)', () => {
  it('rows carry the warehouse, the type wording, the server message and the IST time', () => {
    const [row] = toDashboardAlerts([alert({})], WAREHOUSES, NOW);
    expect(row).toMatchObject({
      id: `LOW_STOCK:${COON}:${CROP_BEANS}:GRADE_1`,
      type: 'LOW_STOCK',
      warehouseId: COON,
      warehouse: 'Coonoor',
      typeLabel: t('alert.low_stock.title'),
      title: t('mainDashboard.alert.cardTitle', { warehouse: 'Coonoor', title: t('alert.low_stock.title') }),
      time: 'Today · 08:30 AM',
      target: 'lowStock',
    });
    expect(row?.description).toContain('90 kg');
    expect(row?.description).toContain('300 kg');
    expect(row?.subtitle).toBe(t('mainDashboard.alert.subtitleWithTime', { detail: row?.description ?? '', time: 'Today · 08:30 AM' }));
    expect(Object.keys(row ?? {})).not.toContain('priority');
  });

  it('a point-in-time alert has no time, and an unknown warehouse is said so', () => {
    const [row] = toDashboardAlerts([alert({ since: null, warehouseId: 'gone', type: 'BATCH_NEAR_EXPIRY', messageKey: 'alert.nope' })], WAREHOUSES, NOW);
    expect(row?.time).toBe('');
    expect(row?.subtitle).toBe(row?.description);
    expect(row?.description).toBe(t('alert.unknown.message'));
    expect(row?.warehouse).toBe(t('mainDashboard.warehouse.unknown'));
    expect(row?.target).toBe('inventory');
  });

  it('filters by warehouse uuid and by the API alert type', () => {
    const rows = toDashboardAlerts(
      [alert({}), alert({ itemKey: 'c', type: 'CAPACITY_NEAR_FULL', warehouseId: OOTY, messageKey: 'alert.capacity_near_full.message' })],
      WAREHOUSES,
      NOW,
    );
    expect(ALERT_TYPE_FILTERS).toEqual(['all', 'LOW_STOCK', 'BATCH_NEAR_EXPIRY', 'CAPACITY_NEAR_FULL']);
    expect(filterDashboardAlerts(rows, { warehouseId: undefined, type: 'all' })).toHaveLength(2);
    expect(filterDashboardAlerts(rows, { warehouseId: OOTY, type: 'all' }).map((r) => r.id)).toEqual(['c']);
    expect(filterDashboardAlerts(rows, { warehouseId: undefined, type: 'LOW_STOCK' }).map((r) => r.type)).toEqual(['LOW_STOCK']);
    expect(alertFilterLabel('all')).toBe(t('mainDashboard.filter.all'));
    expect(alertFilterLabel('CAPACITY_NEAR_FULL')).toBe(t('alert.capacity_near_full.title'));
  });

  it('low-stock rows: product named from the batches, current and threshold as the server sent them', () => {
    const items = toLowStockItems(
      [alert({}), alert({ itemKey: 'x', type: 'CAPACITY_NEAR_FULL' })],
      [batch({ cropId: CROP_BEANS, cropName: 'Beans' })],
      WAREHOUSES,
    );
    expect(items).toEqual([
      {
        id: `LOW_STOCK:${COON}:${CROP_BEANS}:GRADE_1`,
        product: t('inventory.product.label', { product: 'Beans', grade: t('inventory.grade.GRADE_1') }),
        warehouse: 'Coonoor',
        current: '90 kg',
        target: '300 kg',
      },
    ]);
    const [unnamed] = toLowStockItems([alert({})], [], WAREHOUSES);
    expect(unnamed?.product).toBe(t('inventory.product.label', { product: t('mainDashboard.lowStock.unknownProduct'), grade: t('inventory.grade.GRADE_1') }));
  });
});

describe('BR-104: recent activity merged across warehouses', () => {
  it('newest first over every page, with the type wording, warehouse and IST time', () => {
    const rows = mergeRecentActivity(
      [
        { warehouseId: OOTY, items: [event({ sourceId: 'o1', occurredAt: '2026-10-26T03:00:00.000000Z' })] },
        {
          warehouseId: KOTA,
          items: [
            event({ sourceId: 'k1', type: 'TRANSFER', reference: 'TRF-000284', occurredAt: '2026-10-26T04:50:00.000000Z', qtyKg: null }),
            event({ sourceId: 'k2', occurredAt: '2026-10-25T04:50:00.000000Z' }),
          ],
        },
      ],
      WAREHOUSES,
      NOW,
      2,
    );
    expect(rows.map((r) => r.key)).toEqual([`${KOTA}:TRANSFER:k1:2026-10-26T04:50:00.000000Z`, `${OOTY}:GOODS_RECEIPT:o1:2026-10-26T03:00:00.000000Z`]);
    expect(rows[0]).toMatchObject({
      type: 'TRANSFER',
      title: t('mainDashboard.activity.title', { type: t('mainDashboard.activity.type.TRANSFER'), reference: 'TRF-000284' }),
      warehouse: 'Kotagiri',
      time: '10:20 AM',
    });
    expect(activityTimelineLine(rows[1])).toBe(
      t('mainDashboard.activity.timeline', { type: t('mainDashboard.activity.type.GOODS_RECEIPT'), reference: 'GRN-04512', warehouse: 'Ooty', time: '08:30 AM' }),
    );
    expect(activityTimelineLine(undefined)).toBe(t('mainDashboard.activity.none'));
  });

  it('a transfer seen from both of its warehouses is one row, not two', () => {
    const tr = event({ sourceId: 'x', type: 'TRANSFER', reference: 'TRF-1', qtyKg: null });
    const rows = mergeRecentActivity(
      [
        { warehouseId: OOTY, items: [tr] },
        { warehouseId: COON, items: [{ ...tr, direction: 'INBOUND' }, event({ sourceId: 'y', occurredAt: '2026-10-26T01:00:00.000000Z' })] },
      ],
      WAREHOUSES,
      NOW,
      2,
    );
    expect(rows.map((r) => r.reference)).toEqual(['TRF-1', 'GRN-04512']);
  });

  it('an event from an earlier day shows its date, not a clock time that reads as today', () => {
    const [row] = mergeRecentActivity([{ warehouseId: OOTY, items: [event({ occurredAt: '2026-10-20T04:50:00.000000Z' })] }], WAREHOUSES, NOW, 5);
    expect(row?.time).toBe('20 Oct 2026');
  });
});

describe('consolidated stock by product (GET /admin/batches ACTIVE)', () => {
  it('one row per crop and grade, per warehouse, in grams; search on the product label', () => {
    const d = deriveProductStock(
      [
        batch({ id: '1', warehouseId: OOTY, qtyAvailableKg: '850.000' }),
        batch({ id: '2', warehouseId: COON, qtyAvailableKg: '620.000' }),
        batch({ id: '3', warehouseId: OOTY, qtyAvailableKg: '0.500' }),
        batch({ id: '4', cropId: CROP_BEANS, cropName: 'Beans', warehouseId: KOTA, qtyAvailableKg: '680.000' }),
        batch({ id: '5', status: 'DEPLETED', qtyAvailableKg: '999.000' }),
      ],
      WAREHOUSES,
    );
    expect(d.ok).toBe(true);
    if (!d.ok) return;
    const carrot = d.value.find((p) => p.cropId === CROP_CARROT);
    expect(carrot?.label).toBe(t('inventory.product.label', { product: 'Carrot', grade: t('inventory.grade.GRADE_1') }));
    expect(carrot?.rows).toEqual([
      { warehouseId: OOTY, warehouse: 'Ooty', grams: 850500 },
      { warehouseId: COON, warehouse: 'Coonoor', grams: 620000 },
    ]);
    expect(carrot?.totalGrams).toBe(1470500);
    expect(filterProductStock(d.value, 'bea').map((p) => p.cropId)).toEqual([CROP_BEANS]);
    expect(filterProductStock(d.value, '  ')).toHaveLength(2);
  });

  it('a batch with an unreadable quantity fails the figures', () => {
    expect(deriveProductStock([batch({ qtyAvailableKg: 'x' })], WAREHOUSES).ok).toBe(false);
  });
});

describe('header and permission gates', () => {
  it('greets by the IST hour with the first name, and a neutral word before /auth/me answers', () => {
    expect(greetingText(NOW, 'Suresh Kumar')).toBe(t('mainDashboard.greeting.morning', { name: 'Suresh' }));
    expect(greetingText(new Date('2026-10-26T08:30:00.000Z'), 'Suresh')).toBe(t('mainDashboard.greeting.afternoon', { name: 'Suresh' }));
    expect(greetingText(new Date('2026-10-26T13:30:00.000Z'), undefined)).toBe(
      t('mainDashboard.greeting.evening', { name: t('mainDashboard.greeting.fallbackName') }),
    );
  });

  it('every optional source is gated on a code that exists in docs/rbac.json', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const rbac = fs.readFileSync(path.join(__dirname, '..', '..', '..', '..', '..', '..', 'docs', 'rbac.json'), 'utf8');
    for (const code of Object.values(MAIN_DASHBOARD_CODES)) expect(rbac).toContain(`"${code}"`);
    const held = new Set(['warehouse.issue.view']);
    const access = dashboardAccess((c) => held.has(c));
    expect(access.issues).toBe(true);
    expect(access.sales).toBe(false);
  });
});

describe('D02 Warehouse Overview cards: capacity, stock, receipts and issues per warehouse', () => {
  const caps = new Map([
    [OOTY, cap(OOTY)],
    [COON, cap(COON, { usedKg: '1200.500', availableKg: '-200.500', utilizationPercent: 120.05 })],
    [KOTA, cap(KOTA, { capacityKg: null, usedKg: '10.000', availableKg: null, utilizationPercent: null })],
  ]);
  const d = deriveCapacityRows(WAREHOUSES, caps);
  const rows = d.ok ? d.value.rows : [];

  it('BR-66b / BR-77: badge from the server percent, tone from CAPACITY_NEAR_FULL, never a client cut-off', () => {
    const nearFullAlert = alert({ itemKey: 'n', type: 'CAPACITY_NEAR_FULL', warehouseId: OOTY, params: {} });
    const cards = toOverviewCards(rows, nearFullSignal([nearFullAlert]), null, null);
    expect(cards.map((c) => [c.name, c.capacityLabel, c.tone, c.barWidth, c.stock])).toEqual([
      ['Ooty', t('mainDashboard.overview.capacityBadge', { percent: '82%' }), 'nearFull', 82, t('mainDashboard.kgUpper', { value: '820' })],
      ['Coonoor', t('mainDashboard.overview.capacityBadge', { percent: '120.05%' }), 'over', 100, t('mainDashboard.kgUpper', { value: '1,200.5' })],
      ['Kotagiri', null, 'neutral', 0, t('mainDashboard.kgUpper', { value: '10' })],
    ]);
    // Without permission for receipts / issues those figures are not drawn at all.
    expect(cards[0]?.receipts).toBeNull();
    expect(cards[0]?.issues).toBeNull();
  });

  it("today's receipts and open issues per warehouse; placeholder while loading; a cut-short walk is 'at least'", () => {
    const ready = toOverviewCards(
      rows,
      null,
      { status: 'ready', grams: { [OOTY]: 420000 }, exact: false },
      { status: 'ready', byWarehouse: { [OOTY]: 2, [COON]: 0, [KOTA]: 1 } },
    );
    expect(ready[0]?.receipts).toBe(`${t('mainDashboard.kgUpper', { value: '420' })}+`);
    expect(ready[1]?.receipts).toBe(`${t('mainDashboard.kgUpper', { value: '0' })}+`);
    expect(ready.map((c) => c.issues)).toEqual(['2', '0', '1']);
    const loading = toOverviewCards(rows, null, { status: 'loading', grams: {}, exact: true }, { status: 'error', byWarehouse: {} });
    expect(loading[0]?.receipts).toBe(FIGURE_PLACEHOLDER);
    expect(loading[0]?.issues).toBe(FIGURE_PLACEHOLDER);
  });
});
