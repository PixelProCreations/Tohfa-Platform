/**
 * Pure functions in ./warehouse/inventory/mappers.ts.
 * No React, no network: plain-Node vitest.
 *
 * Tests written before mappers.ts existed (tests-first rule) — they will fail
 * until the implementation is present.
 */
import { describe, expect, it } from 'vitest';
import type { AllocationDto, BatchDto, StockLedgerEntryDto } from '../api/inventory';
import {
  aggregateStockByProduct,
  allocationChannelOf,
  batchStatusOf,
  buildAllocationDashboard,
  inventoryWarehouseFilter,
  gradeLabel,
  productKey,
  signedKg,
  stockMovementKindOf,
  toBatchRow,
  toStockMovementRow,
} from '../screens/warehouse/inventory/mappers';
import type { WarehouseScope } from '../screens/warehouse/inventory/types';

const SUB_SCOPE: WarehouseScope = { warehouseId: 'wh-001', warehouseName: 'Ooty' };
const MAIN_SCOPE: WarehouseScope = { warehouseId: undefined, warehouseName: undefined };

// ─── inventoryWarehouseFilter ─────────────────────────────────────────────────

describe('inventoryWarehouseFilter', () => {
  it('BR-30: Sub scope always sends its own warehouseId, ignoring selectedId', () => {
    expect(inventoryWarehouseFilter(SUB_SCOPE, 'some-other-wh')).toBe('wh-001');
  });

  it('Main scope with a selected warehouse sends that warehouse', () => {
    expect(inventoryWarehouseFilter(MAIN_SCOPE, 'wh-002')).toBe('wh-002');
  });

  it('Main scope with no selection sends undefined (all warehouses)', () => {
    expect(inventoryWarehouseFilter(MAIN_SCOPE, undefined)).toBeUndefined();
  });
});

// ─── productKey ───────────────────────────────────────────────────────────────

describe('productKey', () => {
  it('returns cropId:grade', () => {
    expect(productKey('crop-1', 'GRADE_1')).toBe('crop-1:GRADE_1');
  });
});

// ─── batchStatusOf ────────────────────────────────────────────────────────────

describe('batchStatusOf', () => {
  it('maps known statuses', () => {
    expect(batchStatusOf('ACTIVE')).toBe('active');
    expect(batchStatusOf('DEPLETED')).toBe('depleted');
    expect(batchStatusOf('EXPIRED')).toBe('expired');
    expect(batchStatusOf('WRITTEN_OFF')).toBe('writtenOff');
  });

  it('returns unknown for unrecognised values', () => {
    expect(batchStatusOf('MYSTERY')).toBe('unknown');
  });
});

// ─── gradeLabel ───────────────────────────────────────────────────────────────

describe('gradeLabel', () => {
  it('returns a non-empty string for GRADE_1', () => {
    expect(typeof gradeLabel('GRADE_1')).toBe('string');
    expect(gradeLabel('GRADE_1').length).toBeGreaterThan(0);
  });
});

// ─── toBatchRow ───────────────────────────────────────────────────────────────

describe('toBatchRow', () => {
  const DTO: BatchDto = {
    id: 'batch-uuid',
    batchCode: 'BT-001',
    warehouseId: 'wh-001',
    cropId: 'crop-1',
    grade: 'GRADE_1',
    status: 'ACTIVE',
    qtyAvailableKg: '100.500',
    qtyReceivedKg: '120.000',
    qtyReservedKg: '10.000',
    storageLocation: 'Zone A-1',
    receivedOn: '2026-09-01',
    expiryOn: '2026-12-01',
    cropName: 'Tomato',
  };

  it('maps id, batchCode, warehouseId, cropId, grade, status', () => {
    const row = toBatchRow(DTO);
    expect(row.id).toBe('batch-uuid');
    expect(row.batchCode).toBe('BT-001');
    expect(row.warehouseId).toBe('wh-001');
    expect(row.cropId).toBe('crop-1');
    expect(row.grade).toBe('GRADE_1');
    expect(row.status).toBe('active');
  });

  it('converts qtyAvailableKg to integer grams (never a float)', () => {
    const row = toBatchRow(DTO);
    expect(row.availableGrams).toBe(100500);
    expect(Number.isInteger(row.availableGrams)).toBe(true);
  });

  it('converts qtyReceivedKg and qtyReservedKg to integer grams', () => {
    const row = toBatchRow(DTO);
    expect(row.receivedGrams).toBe(120000);
    expect(row.reservedGrams).toBe(10000);
  });

  it('carries storageLocation as-is when non-blank', () => {
    expect(toBatchRow(DTO).storageLocation).toBe('Zone A-1');
  });

  it('gives null storageLocation when absent or blank', () => {
    expect(toBatchRow({ ...DTO, storageLocation: null }).storageLocation).toBeNull();
    expect(toBatchRow({ ...DTO, storageLocation: '' }).storageLocation).toBeNull();
  });

  it('BR-16: sourceFarmerId does NOT appear on the row (farm-anonymous)', () => {
    const row = toBatchRow({ ...DTO, sourceFarmerId: 'farmer-uuid' }) as unknown as Record<string, unknown>;
    expect(row['sourceFarmerId']).toBeUndefined();
  });
});

// ─── aggregateStockByProduct ──────────────────────────────────────────────────

describe('aggregateStockByProduct', () => {
  const BATCH_A: ReturnType<typeof toBatchRow> = {
    id: 'b1', batchCode: 'BT-001', warehouseId: 'wh', cropId: 'crop-1', grade: 'GRADE_1',
    productName: 'Tomato', gradeLabel: 'Grade 1', status: 'active', statusLabel: 'Active',
    availableGrams: 200000, receivedGrams: 250000, reservedGrams: 30000,
    storageLocation: 'A1', receivedOn: '2026-09-01', expiryOn: '',
  };
  const BATCH_B: ReturnType<typeof toBatchRow> = {
    id: 'b2', batchCode: 'BT-002', warehouseId: 'wh', cropId: 'crop-1', grade: 'GRADE_1',
    productName: 'Tomato', gradeLabel: 'Grade 1', status: 'active', statusLabel: 'Active',
    availableGrams: 50000, receivedGrams: 60000, reservedGrams: 5000,
    storageLocation: 'B2', receivedOn: '2026-09-02', expiryOn: '',
  };
  const DEPLETED: ReturnType<typeof toBatchRow> = {
    id: 'b3', batchCode: 'BT-003', warehouseId: 'wh', cropId: 'crop-1', grade: 'GRADE_1',
    productName: 'Tomato', gradeLabel: 'Grade 1', status: 'depleted', statusLabel: 'Depleted',
    availableGrams: 0, receivedGrams: 100000, reservedGrams: 0,
    storageLocation: null, receivedOn: '2026-08-01', expiryOn: '',
  };

  it('sums availableGrams from ACTIVE batches only', () => {
    const { products } = aggregateStockByProduct([BATCH_A, BATCH_B, DEPLETED]);
    expect(products).toHaveLength(1);
    expect(products[0]!.availableGrams).toBe(250000);
  });

  it('groups by productKey (cropId:grade)', () => {
    const CARROT: ReturnType<typeof toBatchRow> = {
      ...BATCH_A, id: 'b4', batchCode: 'BT-004', cropId: 'crop-2', grade: 'GRADE_1',
      productName: 'Carrot',
    };
    const { products } = aggregateStockByProduct([BATCH_A, CARROT]);
    expect(products).toHaveLength(2);
  });

  it('BR-100: uses server availableQtyKg (no recomputation)', () => {
    // The mapper does not recompute available from received - reserved.
    // We test that the sum IS the sum of qtyAvailableKg, not something derived.
    const { products } = aggregateStockByProduct([BATCH_A, BATCH_B]);
    expect(products[0]!.availableGrams).toBe(200000 + 50000);
  });
});

// ─── stockMovementKindOf ──────────────────────────────────────────────────────

describe('stockMovementKindOf', () => {
  it('maps RECEIPT to receipt', () => {
    expect(stockMovementKindOf('RECEIPT')).toBe('receipt');
  });

  it('returns unknown for unrecognised values', () => {
    expect(stockMovementKindOf('MAGIC')).toBe('unknown');
  });
});

// ─── signedKg ─────────────────────────────────────────────────────────────────

describe('signedKg', () => {
  it('prefixes positive grams with +', () => {
    expect(signedKg(100000)).toMatch(/^\+/);
  });

  it('negative grams start with -', () => {
    expect(signedKg(-20000)).toMatch(/^-/);
  });

  it('returns empty string for null', () => {
    expect(signedKg(null)).toBe('');
  });
});

// ─── toStockMovementRow ───────────────────────────────────────────────────────

describe('toStockMovementRow', () => {
  const DTO: StockLedgerEntryDto = {
    id: 'ledger-1',
    batchId: 'batch-uuid',
    warehouseId: 'wh-001',
    txnType: 'RECEIPT',
    qtyDeltaKg: '100.000',
    balanceAfterKg: '100.000',
    performedAt: '2026-09-01T10:00:00Z',
    remarks: null,
    refType: null,
    refId: null,
    performedBy: null,
  };

  it('converts qtyDeltaKg to integer grams', () => {
    const row = toStockMovementRow(DTO, new Date());
    expect(row.deltaGrams).toBe(100000);
  });

  it('BR-37: append-only — the row never carries an edit payload', () => {
    const row = toStockMovementRow(DTO, new Date()) as unknown as Record<string, unknown>;
    // No mutable fields on the row shape
    expect(row['mutable']).toBeUndefined();
  });
});

// ─── allocationChannelOf ─────────────────────────────────────────────────────

describe('allocationChannelOf', () => {
  it('maps ONLINE to online', () => {
    expect(allocationChannelOf('ONLINE')).toBe('online');
    expect(allocationChannelOf('LIVE_MARKET')).toBe('liveMarket');
    expect(allocationChannelOf('RESERVE')).toBe('reserve');
    expect(allocationChannelOf('BUFFER')).toBe('buffer');
  });

  it('returns unknown for unrecognised channel', () => {
    expect(allocationChannelOf('MYSTERY')).toBe('unknown');
  });
});

// ─── buildAllocationDashboard ─────────────────────────────────────────────────

describe('buildAllocationDashboard', () => {
  const ALLOC: AllocationDto = {
    id: 'alloc-1',
    warehouseId: 'wh-001',
    cropId: 'crop-1',
    grade: 'GRADE_1',
    allocationDate: '2026-09-01',
    channel: 'ONLINE',
    allocatedQtyKg: '100.000',
    consumedQtyKg: '50.000',
    reservedQtyKg: '10.000',
    availableQtyKg: '40.000',
  };

  it('BR-12: sums allocated grams per channel', () => {
    const dashboard = buildAllocationDashboard([ALLOC]);
    const online = dashboard.channels.find((c) => c.channel === 'online');
    expect(online?.allocatedGrams).toBe(100000);
  });

  it('totalAllocatedGrams sums across all channels', () => {
    const dashboard = buildAllocationDashboard([ALLOC]);
    expect(dashboard.totalAllocatedGrams).toBe(100000);
  });

  it('always has all four known channels (even when empty)', () => {
    const { channels } = buildAllocationDashboard([]);
    expect(channels.map((c) => c.channel)).toEqual(
      expect.arrayContaining(['online', 'liveMarket', 'reserve', 'buffer']),
    );
  });
});
