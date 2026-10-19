/**
 * Main Warehouse dashboard: the pure view-state helpers (screens/dashboard/
 * mappers_mainDashboard.ts). The dashboard must never draw a zero, "All
 * Warehouses Normal" or "No alerts" for a query that is still loading or has
 * failed (root CLAUDE.md 6, "report honestly"; BR-77, BR-78 for the alert and
 * task sources).
 */
import { describe, expect, it } from 'vitest';
import type { BatchDto } from '../api/inventory';
import type { GoodsReceiptDto } from '../api/receiving';
import type { WarehouseDto } from '../api/warehouses';
import { formatKg } from '../money/quantity';
import {
  FIGURE_PLACEHOLDER,
  attempt,
  combineSources,
  deriveReceiptFigures,
  deriveStockFigures,
  figureOrPlaceholder,
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
