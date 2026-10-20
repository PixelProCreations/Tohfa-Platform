/**
 * Main Warehouse dashboard: the pure view-state helpers (screens/dashboard/
 * mappers_mainDashboard.ts). The dashboard must never draw a zero, "All
 * Warehouses Normal" or "No alerts" for a query that is still loading or has
 * failed (root CLAUDE.md 6, "report honestly"; BR-77, BR-78 for the alert and
 * task sources).
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { AllocationDto, BatchDto } from '../api/inventory';
import type { AlertItemDto } from '../api/alerts';
import type { OrderSummaryDto } from '../api/orders';
import type { GoodsReceiptDto } from '../api/receiving';
import type { TaskItemDto, TaskSummaryDto } from '../api/tasks';
import { TRANSFER_STATUSES, type WarehouseTransferDto } from '../api/warehouseTransfers';
import type { Page } from '../../../shell/api/pagination';
import type { WarehouseDto } from '../api/warehouses';
import { formatKg } from '../money/quantity';
import {
  FIGURE_PLACEHOLDER,
  attempt,
  collectPages,
  combineSources,
  deriveTransfers,
  transferStatusKind,
  countLabel,
  countOrdersPlacedOn,
  greetingKey,
  openTaskCount,
  receiptsOnDay,
  scopeStockFigures,
  filterStockProducts,
  dashboardAccess,
  MAIN_DASHBOARD_CODES,
  coveredWarehouseIds,
  deriveOpenIssues,
  deriveSalesCount,
  derivePerformance,
  monthToDateRange,
  countDashboardAlerts,
  filterDashboardAlerts,
  deriveAllocatedGrams,
  derivePendingAdjustments,
  toDashboardAlerts,
  toLowStockItems,
  toWarehouseOptions,
  toRecentActivity,
  deriveReceiptFigures,
  deriveStockFigures,
  figureOrPlaceholder,
  findWarehouseByName,
  formatUtilization,
  salesRevenueText,
  sectionStatus,
  warehouseShortName,
} from '../screens/dashboard/mappers_mainDashboard';

const idle = { isLoading: false, isFetching: false, error: null, data: undefined };

describe('sectionStatus: which state a dashboard section draws', () => {
  it('BR-77: a query with no data yet is loading, never ready (no zeros while loading)', () => {
    expect(sectionStatus({ ...idle, isLoading: true, isFetching: true })).toBe('loading');
  });

  it('a query that has not started (disabled) is loading, not an empty success', () => {
    expect(sectionStatus(idle)).toBe('loading');
  });

  it('a failed query with no data is an error', () => {
    expect(sectionStatus({ ...idle, error: new Error('x') })).toBe('error');
  });

  it('a Retry in flight after an error shows loading, not the stale error', () => {
    expect(sectionStatus({ ...idle, error: new Error('x'), isFetching: true })).toBe('loading');
  });

  it('data on screen is ready, even an empty list (a real "no alerts" after a successful fetch)', () => {
    expect(sectionStatus({ ...idle, data: { items: [] } })).toBe('ready');
  });

  it('a failed or in-flight refresh does not blank data already on screen', () => {
    expect(sectionStatus({ ...idle, data: { items: [] }, error: new Error('x') })).toBe('ready');
    expect(sectionStatus({ ...idle, data: { items: [] }, isFetching: true })).toBe('ready');
  });
});

describe('combineSources: a section that needs several queries', () => {
  it('is ready only when every source is ready', () => {
    expect(combineSources(['ready', 'ready'])).toBe('ready');
    expect(combineSources(['ready', 'loading'])).toBe('loading');
    expect(combineSources([])).toBe('ready');
  });

  it('an error wins over loading, so a failed source is not hidden behind a slow one', () => {
    expect(combineSources(['loading', 'error', 'ready'])).toBe('error');
  });
});

describe('figureOrPlaceholder: a tile value', () => {
  it('shows the placeholder, never 0, until the source is ready', () => {
    expect(figureOrPlaceholder('loading', () => '0')).toBe(FIGURE_PLACEHOLDER);
    expect(figureOrPlaceholder('error', () => '0')).toBe(FIGURE_PLACEHOLDER);
  });

  it('formats the value once ready, and does not evaluate it before that', () => {
    let calls = 0;
    expect(figureOrPlaceholder('ready', () => { calls += 1; return '12'; })).toBe('12');
    figureOrPlaceholder('loading', () => { calls += 1; return '1'; });
    expect(calls).toBe(1);
  });
});

// ─── Weights: integer grams, never floats ───────────────────────────────────

const WH_A = '11111111-1111-4111-8111-111111111111';
const WH_B = '22222222-2222-4222-8222-222222222222';
const CARROT = '33333333-3333-4333-8333-333333333333';
const BEET = '44444444-4444-4444-8444-444444444444';

function warehouse(over: Partial<WarehouseDto> & Pick<WarehouseDto, 'id' | 'name'>): WarehouseDto {
  return { code: over.name.toUpperCase(), type: 'SUB', isActive: true, createdAt: '2026-10-01T00:00:00Z', ...over };
}

function batch(over: Partial<BatchDto> & Pick<BatchDto, 'warehouseId' | 'qtyAvailableKg'>): BatchDto {
  return {
    id: `b-${over.qtyAvailableKg}-${over.warehouseId}`,
    batchCode: 'B1',
    cropId: CARROT,
    cropName: 'Carrot',
    grade: 'GRADE_1',
    status: 'ACTIVE',
    ...over,
  };
}

function stockOf(batches: BatchDto[], warehouses: WarehouseDto[]) {
  const d = deriveStockFigures(batches, warehouses);
  if (!d.ok) throw new Error('expected derivable stock');
  return d.value;
}

describe('deriveStockFigures: weights are summed as integer grams', () => {
  const a = warehouse({ id: WH_A, name: 'Ooty Warehouse', capacityKg: '1000.000' });

  it('0.100 kg + 0.200 kg is exactly 300 g, where float kg would give 0.30000000000000004', () => {
    const f = stockOf([batch({ warehouseId: WH_A, qtyAvailableKg: '0.100' }), batch({ warehouseId: WH_A, qtyAvailableKg: '0.200' })], [a]);
    expect(f.totalGrams).toBe(300);
    expect(Number.isInteger(f.totalGrams)).toBe(true);
    expect(formatKg(f.totalGrams)).toBe('0.3 kg');
  });

  it('keeps every gram of three-decimal quantities across many batches', () => {
    const batches = Array.from({ length: 10 }, (_, i) => batch({ id: `x${i}`, warehouseId: WH_A, qtyAvailableKg: '0.001' }));
    expect(stockOf(batches, [a]).totalGrams).toBe(10);
  });

  it('counts only ACTIVE batches (depleted, expired and written-off stock is not on the shelf)', () => {
    const f = stockOf(
      [
        batch({ warehouseId: WH_A, qtyAvailableKg: '10.000' }),
        batch({ id: 'e', warehouseId: WH_A, qtyAvailableKg: '99.000', status: 'EXPIRED' }),
        batch({ id: 'w', warehouseId: WH_A, qtyAvailableKg: '99.000', status: 'WRITTEN_OFF' }),
      ],
      [a],
    );
    expect(f.totalGrams).toBe(10000);
  });

  it('sums reserved grams of active batches, and treats an absent optional qtyReservedKg as 0', () => {
    const f = stockOf(
      [
        batch({ warehouseId: WH_A, qtyAvailableKg: '5.000', qtyReservedKg: '1.250' }),
        batch({ id: 'n', warehouseId: WH_A, qtyAvailableKg: '5.000' }),
      ],
      [a],
    );
    expect(f.reservedGrams).toBe(1250);
  });

  it('an unreadable quantity is a data error, not a silent zero', () => {
    const d = deriveStockFigures([batch({ warehouseId: WH_A, qtyAvailableKg: 'ten' })], [a]);
    expect(d.ok).toBe(false);
  });

  it('splits stock per warehouse and consolidates a product across warehouses', () => {
    const b = warehouse({ id: WH_B, name: 'Coonoor Warehouse' });
    const f = stockOf(
      [
        batch({ warehouseId: WH_A, qtyAvailableKg: '100.500' }),
        batch({ id: 'b2', warehouseId: WH_B, qtyAvailableKg: '49.500' }),
        batch({ id: 'b3', warehouseId: WH_B, qtyAvailableKg: '10.000', cropId: BEET, cropName: 'Beetroot' }),
      ],
      [a, b],
    );
    expect(f.warehouses.map((w) => [w.name, w.stockGrams])).toEqual([
      ['Ooty', 100500],
      ['Coonoor', 59500],
    ]);
    const carrot = f.products.find((p) => p.cropId === CARROT);
    expect(carrot?.totalGrams).toBe(150000);
    expect(carrot?.rows).toEqual([
      { warehouseId: WH_A, warehouse: 'Ooty', grams: 100500 },
      { warehouseId: WH_B, warehouse: 'Coonoor', grams: 49500 },
    ]);
    expect(f.products.find((p) => p.cropId === BEET)?.product).toBe('Beetroot');
    expect(f.totalGrams).toBe(160000);
  });
});

describe('BR-66b: capacity is derived and an over-full warehouse is never clamped', () => {
  it('BR-66b: availableKg goes negative when stock exceeds capacity (no Math.max(0, ...))', () => {
    const a = warehouse({ id: WH_A, name: 'Ooty Warehouse', capacityKg: '1000.000' });
    const f = stockOf([batch({ warehouseId: WH_A, qtyAvailableKg: '1200.000' })], [a]);
    expect(f.warehouses[0]?.availableGrams).toBe(-200000);
    expect(f.capacity.availableGrams).toBe(-200000);
  });

  it('BR-66b: utilization above 100% is reported as it is, rounded to 2 decimals', () => {
    const a = warehouse({ id: WH_A, name: 'Ooty Warehouse', capacityKg: '1000.000' });
    const f = stockOf([batch({ warehouseId: WH_A, qtyAvailableKg: '1200.000' })], [a]);
    expect(f.warehouses[0]?.utilizationBp).toBe(12000);
    expect(formatUtilization(12000)).toBe('120.00%');
  });

  it('BR-66b: matches the spec example, 12500.250 of 30000.000 kg is 41.67%', () => {
    const a = warehouse({ id: WH_A, name: 'Ooty Warehouse', capacityKg: '30000.000' });
    const f = stockOf([batch({ warehouseId: WH_A, qtyAvailableKg: '12500.250' })], [a]);
    expect(f.warehouses[0]?.availableGrams).toBe(17499750);
    expect(formatUtilization(f.warehouses[0]?.utilizationBp ?? -1)).toBe('41.67%');
  });

  it('BR-66b: with no capacity set, available and utilization are null, not 0 or 100%', () => {
    const a = warehouse({ id: WH_A, name: 'Ooty Warehouse', capacityKg: null });
    const f = stockOf([batch({ warehouseId: WH_A, qtyAvailableKg: '5.000' })], [a]);
    expect(f.warehouses[0]).toMatchObject({ capacityGrams: null, availableGrams: null, utilizationBp: null });
    expect(f.capacity).toMatchObject({ capacityGrams: null, availableGrams: null, utilizationBp: null, warehousesWithCapacity: 0 });
  });

  it('BR-66b: no batches means used 0', () => {
    const a = warehouse({ id: WH_A, name: 'Ooty Warehouse', capacityKg: '1000.000' });
    const f = stockOf([], [a]);
    expect(f.warehouses[0]).toMatchObject({ stockGrams: 0, availableGrams: 1000000, utilizationBp: 0 });
  });

  it('the network capacity only counts warehouses that have one, so a warehouse without capacity cannot inflate utilization', () => {
    const a = warehouse({ id: WH_A, name: 'Ooty Warehouse', capacityKg: '1000.000' });
    const b = warehouse({ id: WH_B, name: 'Coonoor Warehouse', capacityKg: null });
    const f = stockOf(
      [batch({ warehouseId: WH_A, qtyAvailableKg: '500.000' }), batch({ id: 'z', warehouseId: WH_B, qtyAvailableKg: '900.000' })],
      [a, b],
    );
    expect(f.capacity).toMatchObject({ capacityGrams: 1000000, usedGrams: 500000, availableGrams: 500000, utilizationBp: 5000, warehousesWithCapacity: 1 });
    expect(f.totalGrams).toBe(1400000);
  });

  it('an unreadable capacity is a data error', () => {
    const a = warehouse({ id: WH_A, name: 'Ooty Warehouse', capacityKg: 'lots' });
    expect(deriveStockFigures([], [a]).ok).toBe(false);
  });
});

describe('warehouseShortName and formatUtilization', () => {
  it('drops the trailing " Warehouse" and nothing else', () => {
    expect(warehouseShortName('Ooty Warehouse')).toBe('Ooty');
    expect(warehouseShortName('Gudalur Market Warehouse')).toBe('Gudalur Market');
    expect(warehouseShortName('Warehouse Row')).toBe('Warehouse Row');
  });

  it('formats basis points with two decimals from integers', () => {
    expect(formatUtilization(0)).toBe('0.00%');
    expect(formatUtilization(5)).toBe('0.05%');
    expect(formatUtilization(4167)).toBe('41.67%');
  });
});

// ─── Money: integer paise, and a malformed amount is an error, not Rs 0 ─────

describe('salesRevenueText: integer paise from the Money string', () => {
  const summary = (revenue: unknown) => ({ revenue }) as Parameters<typeof salesRevenueText>[0];

  it('formats a Money string through integer paise', () => {
    expect(salesRevenueText(summary('21980.50'))).toEqual({ ok: true, value: '\u20b921,980.50' });
    expect(salesRevenueText(summary('300.00'))).toEqual({ ok: true, value: '\u20b9300' });
  });

  it('0.10 + 0.20 style amounts stay exact (no float on the way in)', () => {
    expect(salesRevenueText(summary('0.30'))).toEqual({ ok: true, value: '\u20b90.30' });
  });

  it('a malformed or missing revenue is a data error, never shown as Rs 0', () => {
    expect(salesRevenueText(summary('abc')).ok).toBe(false);
    expect(salesRevenueText(summary(undefined)).ok).toBe(false);
    expect(salesRevenueText(summary('')).ok).toBe(false);
  });
});

describe('attempt', () => {
  it('wraps a throwing derivation as { ok: false } and a value as { ok: true, value }', () => {
    expect(attempt(() => 7)).toEqual({ ok: true, value: 7 });
    expect(attempt(() => { throw new Error('x'); })).toEqual({ ok: false });
  });
});

// ─── Goods receipts: grams, and the counts the operations card shows ────────

function receipt(over: Partial<GoodsReceiptDto> & { id: string }): GoodsReceiptDto {
  return {
    grnNumber: `GRN-${over.id}`,
    purchaseOrderId: 'po',
    warehouseId: WH_A,
    grossQtyKg: '100.000',
    status: 'ACCEPTED',
    receivedAt: '2026-10-19T04:00:00Z',
    ...over,
  };
}

function receiptsOf(list: GoodsReceiptDto[]) {
  const d = deriveReceiptFigures(list);
  if (!d.ok) throw new Error('expected derivable receipts');
  return d.value;
}

describe('deriveReceiptFigures: gross received weight counts what arrived, accepted or not (old shell: received kg)', () => {
  it('sums grossQtyKg in grams, so a receipt still awaiting QC counts as received (its accepted weight is not known yet)', () => {
    const f = receiptsOf([
      receipt({ id: '1', grossQtyKg: '0.100', acceptedQtyKg: '0.100' }),
      receipt({ id: '2', grossQtyKg: '0.200', status: 'AWAITING_QC' }),
    ]);
    expect(f.grossGrams).toBe(300);
    expect(f.acceptedGrams).toBe(100);
  });

  it('an unreadable gross weight is a data error, not a silent zero', () => {
    expect(deriveReceiptFigures([receipt({ id: '1', grossQtyKg: 'heavy' })]).ok).toBe(false);
  });
});

describe('deriveReceiptFigures: accepted weight in integer grams', () => {
  it('sums accepted kg exactly (0.100 + 0.200 is 300 g) and treats an absent acceptedQtyKg as 0', () => {
    const f = receiptsOf([
      receipt({ id: '1', acceptedQtyKg: '0.100' }),
      receipt({ id: '2', acceptedQtyKg: '0.200' }),
      receipt({ id: '3', status: 'AWAITING_QC' }),
    ]);
    expect(f.acceptedGrams).toBe(300);
  });

  it('counts by status and by rejected weight, comparing grams not floats', () => {
    const f = receiptsOf([
      receipt({ id: '1', status: 'AWAITING_QC' }),
      receipt({ id: '2', status: 'ACCEPTED' }),
      receipt({ id: '3', status: 'PARTIALLY_ACCEPTED', rejectedQtyKg: '0.001' }),
      receipt({ id: '4', status: 'REJECTED', rejectedQtyKg: '100.000' }),
      receipt({ id: '5', status: 'ACCEPTED', rejectedQtyKg: '0.000' }),
    ]);
    expect(f).toMatchObject({ awaitingQc: 1, arrived: 3, discrepancies: 2, damaged: 2, rejected: 1 });
  });

  it('an unreadable quantity is a data error, not zero', () => {
    expect(deriveReceiptFigures([receipt({ id: '1', acceptedQtyKg: 'x' })]).ok).toBe(false);
    expect(deriveReceiptFigures([receipt({ id: '1', rejectedQtyKg: 'x' })]).ok).toBe(false);
  });
});

// ─── Honest figures ──────────────────────────────────────────────────────────

const TODAY = '2026-10-19';
const NOW = new Date('2026-10-19T06:30:00Z');

describe('collectPages: every page up to a cap, and whether that was all of them', () => {
  const pages = (...sets: string[][]) => {
    const calls: (string | undefined)[] = [];
    const fetchPage = async (cursor: string | undefined): Promise<Page<string>> => {
      calls.push(cursor);
      const i = cursor === undefined ? 0 : Number(cursor);
      return { items: sets[i] ?? [], page: { nextCursor: i + 1 < sets.length ? String(i + 1) : null, hasMore: i + 1 < sets.length } };
    };
    return { fetchPage, calls };
  };

  it('follows the cursor to the last page and reports it complete', async () => {
    const { fetchPage, calls } = pages(['a'], ['b'], ['c']);
    expect(await collectPages(fetchPage)).toEqual({ items: ['a', 'b', 'c'], complete: true });
    expect(calls).toEqual([undefined, '1', '2']);
  });

  it('stops at maxPages and says the result is partial, so a total is never presented as complete', async () => {
    const { fetchPage } = pages(['a'], ['b'], ['c']);
    expect(await collectPages(fetchPage, { maxPages: 2 })).toEqual({ items: ['a', 'b'], complete: false });
  });

  it('stops early (and is complete) once a page holds everything wanted, e.g. a newest-first list reaching yesterday', async () => {
    const { fetchPage, calls } = pages(['today'], ['yesterday'], ['older']);
    const result = await collectPages(fetchPage, { isDone: (items) => items.includes('yesterday') });
    expect(result).toEqual({ items: ['today', 'yesterday'], complete: true });
    expect(calls).toHaveLength(2);
  });

  it('propagates a failed page instead of returning a partial list as if it were whole', async () => {
    const fetchPage = async (cursor: string | undefined): Promise<Page<string>> => {
      if (cursor === undefined) return { items: ['a'], page: { nextCursor: '1', hasMore: true } };
      throw new Error('boom');
    };
    await expect(collectPages(fetchPage)).rejects.toThrow('boom');
  });
});

describe('receiptsOnDay: Receipts today must filter by date', () => {
  const list = [
    receipt({ id: 'today-morning', receivedAt: '2026-10-19T03:00:00Z' }),
    receipt({ id: 'today-ist-edge', receivedAt: '2026-10-18T18:30:00Z' }), // 00:00 IST on the 19th
    receipt({ id: 'yesterday-late', receivedAt: '2026-10-19T18:29:00Z' }), // 23:59 IST on the 19th: still today
    receipt({ id: 'yesterday', receivedAt: '2026-10-18T18:29:59Z' }), // 23:59 IST on the 18th
    receipt({ id: 'tomorrow', receivedAt: '2026-10-19T18:30:00Z' }),
  ];

  it('keeps only receipts received on the IST day, in IST (not UTC) day boundaries', () => {
    expect(receiptsOnDay(list, TODAY).map((g) => g.id)).toEqual(['today-morning', 'today-ist-edge', 'yesterday-late']);
  });

  it('drops a receipt whose receivedAt is not a date rather than counting it as today', () => {
    expect(receiptsOnDay([receipt({ id: 'x', receivedAt: '' })], TODAY)).toEqual([]);
  });

  it('feeds the incoming-today weight: an old 500 kg receipt no longer inflates today', () => {
    const f = receiptsOf(
      receiptsOnDay(
        [
          receipt({ id: 'a', receivedAt: '2026-10-19T04:00:00Z', acceptedQtyKg: '20.000' }),
          receipt({ id: 'b', receivedAt: '2026-10-10T04:00:00Z', acceptedQtyKg: '500.000' }),
        ],
        TODAY,
      ),
    );
    expect(f.acceptedGrams).toBe(20000);
  });
});

describe("countOrdersPlacedOn: Today's orders must be today's", () => {
  const order = (id: string, placedAt: string): OrderSummaryDto => ({
    id,
    orderNumber: id,
    status: 'CONFIRMED',
    totalAmount: '10.00' as OrderSummaryDto['totalAmount'],
    placedAt,
  });

  it('counts orders placed on the IST day only', () => {
    const orders = [order('1', '2026-10-19T05:00:00Z'), order('2', '2026-10-19T02:00:00Z'), order('3', '2026-10-17T05:00:00Z')];
    expect(countOrdersPlacedOn(orders, TODAY, true)).toMatchObject({ count: 2, exact: true });
    expect(countOrdersPlacedOn(orders, TODAY, true).orders.map((o) => o.id)).toEqual(['1', '2']);
  });

  it('is exact when the list was read to the end, or when it reached an older order (newest first)', () => {
    expect(countOrdersPlacedOn([order('1', '2026-10-19T05:00:00Z')], TODAY, true).exact).toBe(true);
    expect(countOrdersPlacedOn([order('1', '2026-10-19T05:00:00Z'), order('2', '2026-10-01T05:00:00Z')], TODAY, false).exact).toBe(true);
  });

  it('is NOT exact when the pages ran out while every order read was still today (more may follow)', () => {
    expect(countOrdersPlacedOn([order('1', '2026-10-19T05:00:00Z')], TODAY, false)).toMatchObject({ count: 1, exact: false });
  });

  it('no orders is an exact zero only when the list was complete', () => {
    expect(countOrdersPlacedOn([], TODAY, true)).toMatchObject({ count: 0, exact: true });
  });
});

describe('greetingKey: by IST hour of day, not always "Good morning"', () => {
  it.each([
    ['2026-10-19T00:30:00Z', 'mainDashboard.greeting.morning'], // 06:00 IST
    ['2026-10-19T06:29:00Z', 'mainDashboard.greeting.morning'], // 11:59 IST
    ['2026-10-19T06:30:00Z', 'mainDashboard.greeting.afternoon'], // 12:00 IST
    ['2026-10-19T11:29:00Z', 'mainDashboard.greeting.afternoon'], // 16:59 IST
    ['2026-10-19T11:30:00Z', 'mainDashboard.greeting.evening'], // 17:00 IST
    ['2026-10-19T17:00:00Z', 'mainDashboard.greeting.evening'], // 22:30 IST
    ['2026-10-18T22:00:00Z', 'mainDashboard.greeting.morning'], // 03:30 IST: before dawn still reads as morning
  ])('%s -> %s', (iso, key) => {
    expect(greetingKey(new Date(iso))).toBe(key);
  });
});

describe('openTaskCount: exact from the server summary, not from the loaded page', () => {
  const summary: TaskSummaryDto = { open: 7, byType: { RETURN_APPROVAL: 3, GOODS_RECEIPT_QC: 4 } };

  it('reads the count of one task type from byType', () => {
    expect(openTaskCount(summary, 'RETURN_APPROVAL')).toBe(3);
    expect(openTaskCount(summary, 'GOODS_RECEIPT_QC')).toBe(4);
  });

  it('a type the summary lacks is 0 (the spec zero-fills, so absent means none)', () => {
    expect(openTaskCount(summary, 'ORDER_PACK')).toBe(0);
  });
});

// ─── Alerts: no invented priority ───────────────────────────────────────────

const alertDto = (over: Partial<AlertItemDto> & Pick<AlertItemDto, 'itemKey' | 'type'>): AlertItemDto => ({
  messageKey: `alert.${over.type.toLowerCase()}.message`,
  refType: 'WAREHOUSE',
  refId: WH_A,
  warehouseId: WH_A,
  since: '2026-10-19T04:00:00Z',
  params: {},
  state: 'ACTIVE',
  snoozedUntil: null,
  ...over,
});

describe('toDashboardAlerts: the type only, never an invented Critical/High/Medium', () => {
  const warehouses = [warehouse({ id: WH_A, name: 'Ooty Warehouse' })];

  it('has no priority field and no unread/resolved status: the spec carries neither (docs/openapi.yaml AlertItem)', () => {
    const [a] = toDashboardAlerts([alertDto({ itemKey: 'low_stock:x', type: 'LOW_STOCK', params: { grade: 'GRADE_1', totalQtyKg: '20.000', thresholdKg: '50.000' } })], warehouses, NOW);
    expect(a).toBeDefined();
    expect(Object.keys(a ?? {})).not.toContain('priority');
    expect(Object.keys(a ?? {})).not.toContain('status');
  });

  it('titles each alert by its type from the catalogue, names the warehouse, and words the message with formatted kg', () => {
    const [low, cap] = toDashboardAlerts(
      [
        alertDto({ itemKey: 'low_stock:x', type: 'LOW_STOCK', params: { grade: 'GRADE_1', totalQtyKg: '20.000', thresholdKg: '50.000' } }),
        alertDto({ itemKey: 'capacity_near_full:y', type: 'CAPACITY_NEAR_FULL', params: { utilizationPercent: '92.50', usedKg: '9250.000', capacityKg: '10000.000' } }),
      ],
      warehouses,
      NOW,
    );
    expect(low).toMatchObject({ id: 'low_stock:x', title: 'Low stock', warehouse: 'Ooty', target: 'lowStock' });
    expect(low?.detail).toBe('Grade GRADE_1 stock is 20 kg, below 50 kg');
    expect(cap).toMatchObject({ title: 'Warehouse nearly full', target: 'capacity' });
    expect(cap?.detail).toBe('92.50% used · 9,250 kg of 10,000 kg');
  });

  it('an alert type the app does not know gets the generic title, not a raw enum', () => {
    const [a] = toDashboardAlerts([alertDto({ itemKey: 'new:z', type: 'SOMETHING_NEW' as AlertItemDto['type'], messageKey: 'alert.something_new.message' })], warehouses, NOW);
    expect(a?.title).toBe('Warehouse alert');
    expect(a?.target).toBe('operations');
  });

  it('a warehouse missing from the list is "Unknown warehouse", never a raw uuid', () => {
    const [a] = toDashboardAlerts([alertDto({ itemKey: 'low_stock:x', type: 'LOW_STOCK', warehouseId: WH_B })], warehouses, NOW);
    expect(a?.warehouse).toBe('Unknown warehouse');
  });
});

describe('toLowStockItems: the product name, not the raw itemKey', () => {
  const warehouses = [warehouse({ id: WH_A, name: 'Ooty Warehouse' })];
  const low = alertDto({
    itemKey: `low_stock:${WH_A}:${CARROT}:GRADE_1`,
    type: 'LOW_STOCK',
    params: { cropId: CARROT, grade: 'GRADE_1', totalQtyKg: '20.000', thresholdKg: '50.000' },
  });

  it('joins the crop name from the batches by cropId and shows current vs threshold', () => {
    const [item] = toLowStockItems([low], [batch({ warehouseId: WH_A, qtyAvailableKg: '20.000' })], warehouses);
    expect(item).toMatchObject({ product: 'Carrot \u00b7 Grade 1', warehouse: 'Ooty', current: '20 kg', target: '50 kg' });
    expect(item?.product).not.toContain('low_stock');
  });

  it('with no batch to name the crop it shows the neutral label, never the uuid or the itemKey', () => {
    const [item] = toLowStockItems([low], [], warehouses);
    expect(item?.product).not.toContain(CARROT);
    expect(item?.product).not.toContain('low_stock');
  });

  it('ignores alerts that are not LOW_STOCK', () => {
    expect(toLowStockItems([alertDto({ itemKey: 'c:1', type: 'CAPACITY_NEAR_FULL' })], [], warehouses)).toEqual([]);
  });
});

// ─── Recent activity: no raw i18n keys ──────────────────────────────────────

const task = (over: Partial<TaskItemDto> & Pick<TaskItemDto, 'itemKey' | 'type' | 'titleKey'>): TaskItemDto => ({
  refType: 'ORDER',
  refId: WH_A,
  warehouseId: WH_A,
  createdAt: '2026-10-19T05:50:00Z',
  dueOn: null,
  params: {},
  state: 'OPEN',
  ...over,
});

describe('toRecentActivity: titles come from the catalogue, unknown keys are hidden', () => {
  const warehouses = [warehouse({ id: WH_A, name: 'Ooty Warehouse' })];

  it('translates the server titleKey instead of printing it', () => {
    const [row] = toRecentActivity([task({ itemKey: 'ORDER_PACK:1', type: 'ORDER_PACK', titleKey: 'task.order_pack.title' })], warehouses, NOW);
    expect(row?.title).toBe('Order to pack');
    expect(row?.title).not.toContain('task.');
    expect(row?.subtitle).toBe('Ooty');
    expect(row?.time).toBe('40 minutes ago');
  });

  it('hides a task whose titleKey the app has no string for, rather than showing a raw key', () => {
    const rows = toRecentActivity(
      [
        task({ itemKey: 'A', type: 'ORDER_PACK', titleKey: 'task.brand_new.title' }),
        task({ itemKey: 'B', type: 'GOODS_RECEIPT_QC', titleKey: 'task.goods_receipt_qc.title' }),
      ],
      warehouses,
      NOW,
    );
    expect(rows.map((r) => r.id)).toEqual(['B']);
  });

  it('has a catalogue string for every task type the spec lists', () => {
    for (const type of ['RETURN_INSPECTION', 'RETURN_APPROVAL', 'GOODS_RECEIPT_QC', 'ORDER_PACK', 'ORDER_DISPATCH', 'ORDER_PICKUP_OTP'] as const) {
      const rows = toRecentActivity([task({ itemKey: type, type, titleKey: `task.${type.toLowerCase()}.title` })], warehouses, NOW);
      expect({ type, shown: rows.length }).toEqual({ type, shown: 1 });
    }
  });

  it('shows at most the requested number of rows', () => {
    const many = Array.from({ length: 5 }, (_, i) => task({ itemKey: `K${i}`, type: 'ORDER_PACK', titleKey: 'task.order_pack.title' }));
    expect(toRecentActivity(many, warehouses, NOW, 2)).toHaveLength(2);
  });
});

// ─── Transfers (GET /warehouse-transfers, BR-102) ───────────────────────────

const transfer = (over: Partial<WarehouseTransferDto> & Pick<WarehouseTransferDto, 'id' | 'status'>): WarehouseTransferDto => ({
  transferNumber: `TRF-${over.id}`,
  fromWarehouseId: WH_A,
  toWarehouseId: WH_B,
  totalValue: '12000.00' as WarehouseTransferDto['totalValue'],
  hasUnvaluedLines: false,
  requiresApproval: false,
  hasDiscrepancy: false,
  vehicleNumber: null,
  notes: null,
  receiptNote: null,
  cancelReason: null,
  initiatedBy: 'u1',
  approvedBy: null,
  approvedAt: null,
  dispatchedAt: null,
  receivedBy: null,
  receivedAt: null,
  cancelledBy: null,
  cancelledAt: null,
  createdAt: '2026-10-18T05:00:00Z',
  updatedAt: null,
  ...over,
});

const whs = [warehouse({ id: WH_A, name: 'Ooty Warehouse' }), warehouse({ id: WH_B, name: 'Coonoor Warehouse' })];

function transfersOf(list: WarehouseTransferDto[], total = list.length) {
  const d = deriveTransfers(list, total, whs);
  if (!d.ok) throw new Error('expected derivable transfers');
  return d.value;
}

describe('transferStatusKind: an exhaustive mapping of the spec statuses, with a safe fallback', () => {
  it('maps every status docs/openapi.yaml declares', () => {
    expect(TRANSFER_STATUSES.map((s) => [s, transferStatusKind(s)])).toEqual([
      ['PENDING_APPROVAL', 'pendingApproval'],
      ['IN_TRANSIT', 'inTransit'],
      ['RECEIVED', 'received'],
      ['CANCELLED', 'cancelled'],
    ]);
  });

  it('a status the app does not know is "unknown", never a throw and never guessed as pending', () => {
    expect(transferStatusKind('ON_HOLD')).toBe('unknown');
    expect(transferStatusKind('')).toBe('unknown');
    expect(transferStatusKind('toString')).toBe('unknown');
  });
});

describe('deriveTransfers: counts and rows from the real list, not from tasks', () => {
  const list = [
    transfer({ id: '1', status: 'PENDING_APPROVAL' }),
    transfer({ id: '2', status: 'IN_TRANSIT' }),
    transfer({ id: '3', status: 'IN_TRANSIT' }),
    transfer({ id: '4', status: 'RECEIVED', hasDiscrepancy: true }),
    transfer({ id: '5', status: 'RECEIVED' }),
    transfer({ id: '6', status: 'CANCELLED' }),
  ];

  it('counts each status, and the received-short transfers as exceptions', () => {
    expect(transfersOf(list).counts).toMatchObject({ pendingApproval: 1, inTransit: 2, received: 2, cancelled: 1, unknown: 0, discrepancies: 1 });
  });

  it('"open" is what is not yet received: pending approval plus in transit, cancelled and received excluded', () => {
    expect(transfersOf(list).counts.open).toBe(3);
  });

  it('counts a status the app does not know as unknown, and not as open', () => {
    const f = transfersOf([transfer({ id: '9', status: 'ON_HOLD' as WarehouseTransferDto['status'] })]);
    expect(f.counts).toMatchObject({ unknown: 1, open: 0 });
    expect(f.rows[0]?.statusLabel).toBe('Unknown status');
  });

  it('is exact only when the page holds every transfer the server reported (total)', () => {
    expect(transfersOf(list).counts.exact).toBe(true);
    expect(transfersOf(list, 250).counts.exact).toBe(false);
  });

  it('builds a row per transfer: number, "from \u2192 to" by warehouse name, status label, and the value through integer paise', () => {
    const [row] = transfersOf([transfer({ id: '2', status: 'IN_TRANSIT', totalValue: '12000.50' as WarehouseTransferDto['totalValue'] })]).rows;
    expect(row).toMatchObject({ id: 'TRF-2', route: 'Ooty \u2192 Coonoor', statusLabel: 'In transit', kind: 'inTransit' });
    expect(row?.details).toBe('Created 18 Oct 2026 \u00b7 \u20b912,000.50');
  });

  it('leaves the value out when a line had no cost (the total is partial), instead of showing a low number', () => {
    const [row] = transfersOf([transfer({ id: '2', status: 'PENDING_APPROVAL', hasUnvaluedLines: true })]).rows;
    expect(row?.details).toBe('Created 18 Oct 2026');
  });

  it('a warehouse missing from the list is "Unknown warehouse" in the route, never a uuid', () => {
    const [row] = transfersOf([transfer({ id: '2', status: 'IN_TRANSIT', toWarehouseId: '99999999-9999-4999-8999-999999999999' })]).rows;
    expect(row?.route).toBe('Ooty \u2192 Unknown warehouse');
  });

  it('a malformed totalValue is a data error, not a shown zero', () => {
    expect(deriveTransfers([transfer({ id: '2', status: 'IN_TRANSIT', totalValue: 'lots' as WarehouseTransferDto['totalValue'] })], 1, whs).ok).toBe(false);
  });

  it('no transfers is an exact zero', () => {
    expect(transfersOf([]).counts).toMatchObject({ open: 0, exact: true });
  });
});

describe('countLabel: a count that may be partial says so', () => {
  it('shows the number when exact and N+ when more may exist', () => {
    expect(countLabel(12, true)).toBe('12');
    expect(countLabel(12, false)).toBe('12+');
    expect(countLabel(0, true)).toBe('0');
  });
});

// ─── Selector flows: every flow is live, so the selection is the uuid ────────

describe('selector ids: a live warehouse resolves by uuid', () => {
  const OOTY = '5b1f1c1e-0000-4000-8000-000000000001';
  const COON = '5b1f1c1e-0000-4000-8000-000000000002';
  const live = [
    warehouse({ id: OOTY, name: 'Ooty Warehouse', code: 'WH-OOTY' }),
    warehouse({ id: COON, name: 'Coonoor Warehouse', code: 'WH-COON' }),
  ];

  it('live-backed flows get the uuid: toWarehouseOptions carries id, name and code, and the selected uuid finds its option', () => {
    const options = toWarehouseOptions(live);
    expect(options).toEqual([
      { warehouseId: OOTY, warehouseName: 'Ooty Warehouse', warehouseCode: 'WH-OOTY' },
      { warehouseId: COON, warehouseName: 'Coonoor Warehouse', warehouseCode: 'WH-COON' },
    ]);
    expect(options.find((o) => o.warehouseId === COON)?.warehouseName).toBe('Coonoor Warehouse');
  });
});

describe('findWarehouseByName: StorageFlow hands names back', () => {
  const live = [
    warehouse({ id: 'a', name: 'Ooty Warehouse' }),
    warehouse({ id: 'b', name: 'Gudalur Market Warehouse' }),
    warehouse({ id: 'c', name: 'Gudalur Warehouse' }),
  ];

  it('matches the full or the short name, case-insensitively', () => {
    expect(findWarehouseByName(live, 'Ooty Warehouse')?.id).toBe('a');
    expect(findWarehouseByName(live, 'ooty')?.id).toBe('a');
  });

  it('prefers the exact short name over a name that merely starts with it', () => {
    expect(findWarehouseByName(live, 'Gudalur')?.id).toBe('c');
    expect(findWarehouseByName(live, 'Gudalur Market')?.id).toBe('b');
  });

  it('falls back to a prefix match (the labels the storage screens print), and to undefined when nothing matches', () => {
    expect(findWarehouseByName(live, 'Gud')?.id).toBe('b');
    expect(findWarehouseByName(live, 'Mettupalayam')).toBeUndefined();
    expect(findWarehouseByName(live, '')).toBeUndefined();
  });
});

// ─── The warehouse filter scopes every figure it feeds ──────────────────────

describe('scopeStockFigures: the header filter narrows the cards and the capacity, not only the batches', () => {
  const a = warehouse({ id: WH_A, name: 'Ooty Warehouse', capacityKg: '1000.000' });
  const b = warehouse({ id: WH_B, name: 'Coonoor Warehouse', capacityKg: '3000.000' });
  // The API already returned only Ooty's batches for the filter; Coonoor has no stock in this read.
  const ootyOnly = stockOf([batch({ warehouseId: WH_A, qtyAvailableKg: '500.000' })], [a, b]);

  it('with no filter every warehouse stays, unchanged', () => {
    expect(scopeStockFigures(ootyOnly, undefined)).toEqual(ootyOnly);
  });

  it('with a filter only that warehouse is a row: the others are not drawn as a false 0 kg', () => {
    const scoped = scopeStockFigures(ootyOnly, WH_A);
    expect(scoped.warehouses.map((w) => w.warehouseId)).toEqual([WH_A]);
  });

  it('BR-66b: utilization is measured against the covered warehouses only (500 of 1000, not 500 of 4000)', () => {
    expect(ootyOnly.capacity.utilizationBp).toBe(1250);
    const scoped = scopeStockFigures(ootyOnly, WH_A);
    expect(scoped.capacity).toMatchObject({ capacityGrams: 1000000, usedGrams: 500000, availableGrams: 500000, utilizationBp: 5000, warehousesWithCapacity: 1 });
  });

  it('a filter naming a warehouse that is not in the list leaves no rows and no capacity, never the whole network', () => {
    const scoped = scopeStockFigures(ootyOnly, 'not-a-warehouse');
    expect(scoped.warehouses).toEqual([]);
    expect(scoped.capacity).toMatchObject({ capacityGrams: null, utilizationBp: null, warehousesWithCapacity: 0 });
  });

  it('keeps the batch totals the API returned (they are already filtered server-side)', () => {
    const scoped = scopeStockFigures(ootyOnly, WH_A);
    expect(scoped.totalGrams).toBe(500000);
  });
});

describe('consolidated stock is per product and grade, and searchable by either', () => {
  const a = warehouse({ id: WH_A, name: 'Ooty Warehouse' });
  const b = warehouse({ id: WH_B, name: 'Coonoor Warehouse' });
  const f = stockOf(
    [
      batch({ warehouseId: WH_A, qtyAvailableKg: '10.000', grade: 'GRADE_1' }),
      batch({ id: 'g2', warehouseId: WH_A, qtyAvailableKg: '5.000', grade: 'GRADE_2' }),
      batch({ id: 'g1b', warehouseId: WH_B, qtyAvailableKg: '2.500', grade: 'GRADE_1' }),
      batch({ id: 'bt', warehouseId: WH_B, qtyAvailableKg: '1.000', cropId: BEET, cropName: 'Beetroot', grade: 'GRADE_1' }),
    ],
    [a, b],
  );

  it('keeps grades of one crop apart (Grade 1 and Grade 2 are different stock) and still totals across warehouses', () => {
    const carrots = f.products.filter((p) => p.cropId === CARROT);
    expect(carrots).toHaveLength(2);
    const g1 = carrots.find((p) => p.grade === 'GRADE_1');
    expect(g1?.totalGrams).toBe(12500);
    expect(g1?.rows.map((r) => r.grams)).toEqual([10000, 2500]);
    expect(carrots.find((p) => p.grade === 'GRADE_2')?.totalGrams).toBe(5000);
  });

  it('every product row has a unique key and a "Product · Grade" label', () => {
    expect(new Set(f.products.map((p) => p.key)).size).toBe(f.products.length);
    expect(f.products.find((p) => p.cropId === BEET)?.label).toBe('Beetroot · Grade 1');
  });

  it('search matches the product or the grade, case-insensitively, and empty search keeps everything', () => {
    expect(filterStockProducts(f.products, '').length).toBe(f.products.length);
    expect(filterStockProducts(f.products, 'beet').map((p) => p.product)).toEqual(['Beetroot']);
    expect(filterStockProducts(f.products, 'grade 2').map((p) => p.grade)).toEqual(['GRADE_2']);
    expect(filterStockProducts(f.products, 'zzz')).toEqual([]);
  });
});

// ─── Permission gating: a figure whose code is not held is not fetched or drawn ─

describe('dashboardAccess: one rbac code per optional dashboard source (docs/rbac.json)', () => {
  const holding = (...codes: string[]) => (code: string) => codes.includes(code);

  it('fails closed: a user holding nothing sees no optional figure and no transfer action', () => {
    expect(dashboardAccess(holding())).toEqual({
      sales: false,
      transfers: false,
      issues: false,
      activity: false,
      adjustments: false,
      transferInitiate: false,
    });
  });

  it('each flag follows its own code and no other', () => {
    expect(dashboardAccess(holding('sales.dashboard.view')).sales).toBe(true);
    expect(dashboardAccess(holding('sales.dashboard.view')).transfers).toBe(false);
    expect(dashboardAccess(holding('transfer.inter_warehouse.view')).transfers).toBe(true);
    expect(dashboardAccess(holding('warehouse.issue.view')).issues).toBe(true);
    expect(dashboardAccess(holding('warehouse.activity.view')).activity).toBe(true);
    expect(dashboardAccess(holding('inventory.stock_adjustment.approve')).adjustments).toBe(true);
    expect(dashboardAccess(holding('transfer.inter_warehouse.initiate')).transferInitiate).toBe(true);
    expect(dashboardAccess(holding('transfer.inter_warehouse.view')).transferInitiate).toBe(false);
  });

  it('uses only codes that exist in docs/rbac.json (a code that does not exist would gate a figure off for everyone)', () => {
    const rbac = fs.readFileSync(path.join(__dirname, '..', '..', '..', '..', '..', '..', 'docs', 'rbac.json'), 'utf8');
    for (const code of Object.values(MAIN_DASHBOARD_CODES)) {
      expect({ code, known: rbac.includes(`"${code}"`) }).toEqual({ code, known: true });
    }
  });
});

// ─── Open issues: the real operational issues, not the alert count ──────────

describe('coveredWarehouseIds: the warehouses a filter covers', () => {
  const live = [warehouse({ id: WH_A, name: 'Ooty Warehouse' }), warehouse({ id: WH_B, name: 'Coonoor Warehouse' })];

  it('no filter covers every listed warehouse', () => {
    expect(coveredWarehouseIds(live, undefined)).toEqual([WH_A, WH_B]);
  });

  it('a filter covers that warehouse only', () => {
    expect(coveredWarehouseIds(live, WH_B)).toEqual([WH_B]);
  });

  it('a filter that is not a listed warehouse covers nothing, never the whole network', () => {
    expect(coveredWarehouseIds(live, 'gone')).toEqual([]);
  });
});

describe('BR-103: deriveOpenIssues', () => {
  it('sums the per-warehouse counts over the covered warehouses and keeps each warehouse\'s own', () => {
    const d = deriveOpenIssues({ [WH_A]: 5, [WH_B]: 4 }, [WH_A, WH_B]);
    expect(d).toEqual({ ok: true, value: { total: 9, byWarehouse: { [WH_A]: 5, [WH_B]: 4 } } });
  });

  it('only the covered warehouses count', () => {
    const d = deriveOpenIssues({ [WH_A]: 5, [WH_B]: 4 }, [WH_A]);
    expect(d.ok && d.value.total).toBe(5);
  });

  it('zero open issues is a real, exact 0', () => {
    const d = deriveOpenIssues({ [WH_A]: 0 }, [WH_A]);
    expect(d).toEqual({ ok: true, value: { total: 0, byWarehouse: { [WH_A]: 0 } } });
  });

  it('a covered warehouse with no count, or a count that is not a whole number, is a data error and not a smaller total', () => {
    expect(deriveOpenIssues({ [WH_A]: 5 }, [WH_A, WH_B]).ok).toBe(false);
    expect(deriveOpenIssues({ [WH_A]: 2.5 }, [WH_A]).ok).toBe(false);
    expect(deriveOpenIssues({ [WH_A]: -1 }, [WH_A]).ok).toBe(false);
    expect(deriveOpenIssues({ [WH_A]: 'many' as unknown as number }, [WH_A]).ok).toBe(false);
  });
});

describe('deriveSalesCount: the number of paid sales behind the revenue', () => {
  it('reads the server count as a whole number', () => {
    expect(deriveSalesCount({ count: 12 })).toEqual({ ok: true, value: 12 });
    expect(deriveSalesCount({ count: 0 })).toEqual({ ok: true, value: 0 });
  });

  it('a missing or fractional count is a data error, never 0', () => {
    expect(deriveSalesCount({} as { count: number }).ok).toBe(false);
    expect(deriveSalesCount({ count: 1.5 }).ok).toBe(false);
    expect(deriveSalesCount({ count: -1 }).ok).toBe(false);
  });
});

// ─── Performance (BR-80): exact server counts for a range ───────────────────

describe('monthToDateRange: the IST month so far, from utils/datetime', () => {
  it('runs from the 1st of the IST month to the IST day', () => {
    expect(monthToDateRange(new Date('2026-10-20T08:00:00Z'))).toEqual({ from: '2026-10-01', to: '2026-10-20' });
  });

  it('uses the IST calendar, not UTC: 19:00 UTC on 31 Oct is already 1 Nov in India', () => {
    expect(monthToDateRange(new Date('2026-10-31T19:00:00Z'))).toEqual({ from: '2026-11-01', to: '2026-11-01' });
  });

  it('the 1st of the month is a one-day range', () => {
    expect(monthToDateRange(new Date('2026-10-01T03:00:00Z'))).toEqual({ from: '2026-10-01', to: '2026-10-01' });
  });
});

describe('BR-80: derivePerformance', () => {
  const totals = {
    goodsReceipts: 4,
    grossGrams: 100501,
    acceptedGrams: 90001,
    rejectedGrams: 10500,
    ordersPlaced: 7,
    ordersFulfilled: 4,
    ordersCancelled: 2,
    returnsRequested: 2,
  };

  it('passes exact counts and integer grams through', () => {
    const d = derivePerformance(totals);
    expect(d).toEqual({ ok: true, value: totals });
    expect(d.ok && Number.isInteger(d.value.grossGrams)).toBe(true);
  });

  it('a quantity the sum could not read (null grams) is a data error, never shown as 0 kg', () => {
    expect(derivePerformance({ ...totals, grossGrams: null }).ok).toBe(false);
    expect(derivePerformance({ ...totals, acceptedGrams: null }).ok).toBe(false);
    expect(derivePerformance({ ...totals, rejectedGrams: null }).ok).toBe(false);
  });

  it('a count that is not a whole number is a data error', () => {
    expect(derivePerformance({ ...totals, ordersPlaced: 1.5 }).ok).toBe(false);
    expect(derivePerformance({ ...totals, returnsRequested: Number.NaN }).ok).toBe(false);
  });
});

// ─── Alerts: snoozed state and the type filter (BR-78) ──────────────────────

describe('BR-78: toDashboardAlerts carries the snooze state the server sent', () => {
  const warehouses = [warehouse({ id: WH_A, name: 'Ooty Warehouse' })];

  it('an active alert is not snoozed and has no snooze time', () => {
    const [a] = toDashboardAlerts([alertDto({ itemKey: 'low_stock:x', type: 'LOW_STOCK' })], warehouses, NOW);
    expect(a).toMatchObject({ snoozed: false, snoozedUntil: null });
  });

  it('a snoozed alert says it is snoozed and until when, in IST, worded by the catalogue', () => {
    const [a] = toDashboardAlerts(
      [alertDto({ itemKey: 'low_stock:x', type: 'LOW_STOCK', state: 'SNOOZED', snoozedUntil: '2026-10-19T09:30:00Z' })],
      warehouses,
      NOW,
    );
    expect(a?.snoozed).toBe(true);
    expect(a?.snoozedUntil).toMatch(/3:00 PM|03:00 PM/);
  });
});

describe('alert type filter: counts and filtering over what the server returned', () => {
  const warehouses = [warehouse({ id: WH_A, name: 'Ooty Warehouse' })];
  const alerts = toDashboardAlerts(
    [
      alertDto({ itemKey: 'low_stock:a', type: 'LOW_STOCK' }),
      alertDto({ itemKey: 'low_stock:b', type: 'LOW_STOCK' }),
      alertDto({ itemKey: 'batch_near_expiry:c', type: 'BATCH_NEAR_EXPIRY' }),
    ],
    warehouses,
    NOW,
  );

  it('counts every type, with all being the whole list and a type with none being a real 0', () => {
    expect(countDashboardAlerts(alerts)).toEqual({ all: 3, LOW_STOCK: 2, BATCH_NEAR_EXPIRY: 1, CAPACITY_NEAR_FULL: 0 });
  });

  it('all keeps every alert; a type keeps only that type, in order', () => {
    expect(filterDashboardAlerts(alerts, 'all')).toHaveLength(3);
    expect(filterDashboardAlerts(alerts, 'LOW_STOCK').map((a) => a.id)).toEqual(['low_stock:a', 'low_stock:b']);
    expect(filterDashboardAlerts(alerts, 'CAPACITY_NEAR_FULL')).toEqual([]);
  });

  it('a type the app does not know still counts under all, and is never shown under a known type', () => {
    const odd = toDashboardAlerts([alertDto({ itemKey: 'x:1', type: 'SOMETHING_NEW' as AlertItemDto['type'] })], warehouses, NOW);
    expect(countDashboardAlerts(odd)).toEqual({ all: 1, LOW_STOCK: 0, BATCH_NEAR_EXPIRY: 0, CAPACITY_NEAR_FULL: 0 });
    expect(filterDashboardAlerts(odd, 'LOW_STOCK')).toEqual([]);
    expect(filterDashboardAlerts(odd, 'all')).toHaveLength(1);
  });
});

// ─── Inventory tab: allocated stock and pending adjustments ─────────────────

describe('deriveAllocatedGrams: stock allocated to channels, as integer grams', () => {
  const alloc = (over: Partial<AllocationDto> & Pick<AllocationDto, 'allocatedQtyKg'>): AllocationDto => ({
    id: `a-${over.allocatedQtyKg}`,
    warehouseId: WH_A,
    cropId: CARROT,
    grade: 'GRADE_1',
    allocationDate: '2026-10-20',
    channel: 'ONLINE',
    ...over,
  });

  it('0.100 kg + 0.200 kg is exactly 300 g', () => {
    expect(deriveAllocatedGrams([alloc({ allocatedQtyKg: '0.100' }), alloc({ id: 'b', allocatedQtyKg: '0.200' })])).toEqual({ ok: true, value: 300 });
  });

  it('no allocations is a real, exact 0', () => {
    expect(deriveAllocatedGrams([])).toEqual({ ok: true, value: 0 });
  });

  it('an unreadable quantity is a data error, never a silently smaller total', () => {
    expect(deriveAllocatedGrams([alloc({ allocatedQtyKg: '5.000' }), alloc({ id: 'x', allocatedQtyKg: 'lots' })]).ok).toBe(false);
  });
});

describe('BR-37: derivePendingAdjustments', () => {
  it('is the server total of PENDING adjustments, a whole number', () => {
    expect(derivePendingAdjustments(3)).toEqual({ ok: true, value: 3 });
    expect(derivePendingAdjustments(0)).toEqual({ ok: true, value: 0 });
  });

  it('a total that is not a whole number is a data error, never 0', () => {
    expect(derivePendingAdjustments(undefined).ok).toBe(false);
    expect(derivePendingAdjustments(2.5).ok).toBe(false);
    expect(derivePendingAdjustments('3').ok).toBe(false);
  });
});
