/**
 * Inventory tab overview (the 8 stat cards and their sections): the pure
 * derivations in ./mainInventoryMappers.ts.
 *
 * Every figure is integer grams or a whole count read from what the server
 * returned. A card whose source is loading or failed shows the placeholder,
 * never 0; a card whose permission the caller lacks is absent, never 0.
 */
import { describe, expect, it } from 'vitest';
import type { AlertItemDto } from '../../../api/alerts';
import type { AllocationDto, BatchDto, StockLedgerEntryDto } from '../../../api/inventory';
import type { StockVerificationDto } from '../../../api/stockVerifications';
import { FIGURE_PLACEHOLDER } from '../../dashboard/mappers_mainDashboard';
import { formatKg } from '../../../money/quantity';
import { inventoryWarehouseFilter } from './mappers';
import {
  EMPTY_MAIN_INVENTORY_FIGURES,
  MAIN_INVENTORY_CARD_ORDER,
  MAIN_INVENTORY_CODES,
  buildInventoryHealth,
  buildMainInventoryCards,
  buildPendingActions,
  buildQuickActions,
  buildWarehouseOverview,
  collectOffsetPages,
  countLowStockItems,
  deriveAllocatedStockGrams,
  deriveAvailableStockGrams,
  deriveReservedStockGrams,
  deriveServerTotal,
  deriveTotalStockGrams,
  deriveVerificationCounts,
  hasOpenVariance,
  isVerificationPending,
  mainInventoryAccess,
  toRecentMovements,
  type MainInventoryAccess,
  type MainInventoryCardKey,
  type MainInventoryFigures,
} from './mainInventoryMappers';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const OOTY = '11111111-1111-4111-8111-111111111111';
const COONOOR = '22222222-2222-4222-8222-222222222222';
const TOMATO = '33333333-3333-4333-8333-333333333333';
const CARROT = '44444444-4444-4444-8444-444444444444';

let seq = 0;
function nextId(): string {
  seq += 1;
  return `00000000-0000-4000-8000-${String(seq).padStart(12, '0')}`;
}

function batch(overrides: Partial<BatchDto> = {}): BatchDto {
  return {
    id: nextId(),
    batchCode: 'BATCH-2026-000001',
    warehouseId: OOTY,
    cropId: TOMATO,
    cropName: 'Tomato',
    grade: 'GRADE_1',
    qtyAvailableKg: '10.000',
    status: 'ACTIVE',
    ...overrides,
  };
}

/** Overrides that may also REMOVE an optional field (`{ availableQtyKg: undefined }`): the server omits it. */
type Overrides<T> = { [K in keyof T]?: T[K] | undefined };

function allocation(overrides: Overrides<AllocationDto> = {}): AllocationDto {
  const row: Record<string, unknown> = {
    id: nextId(),
    warehouseId: OOTY,
    cropId: TOMATO,
    grade: 'GRADE_1',
    allocationDate: '2026-10-20',
    channel: 'ONLINE',
    allocatedQtyKg: '7.000',
    consumedQtyKg: '0.000',
    reservedQtyKg: '0.000',
    availableQtyKg: '7.000',
    ...overrides,
  };
  for (const key of Object.keys(row)) if (row[key] === undefined) delete row[key];
  return row as unknown as AllocationDto;
}

function verification(overrides: Partial<StockVerificationDto> = {}): StockVerificationDto {
  return {
    id: nextId(),
    warehouseId: OOTY,
    batchId: nextId(),
    batchCode: 'BATCH-2026-000001',
    cropId: TOMATO,
    grade: 'GRADE_1',
    systemQtyKg: '10.000',
    countedQtyKg: '9.500',
    varianceKg: '-0.500',
    status: 'RECORDED',
    notes: null,
    verifiedBy: nextId(),
    verifiedAt: '2026-10-20T04:30:00.000Z',
    adjustmentId: null,
    adjustmentStatus: null,
    createdAt: '2026-10-20T04:30:00.000Z',
    updatedAt: null,
    ...overrides,
  };
}

function alert(overrides: Partial<AlertItemDto> = {}): AlertItemDto {
  return {
    itemKey: `low_stock:${OOTY}:${TOMATO}:GRADE_1`,
    type: 'LOW_STOCK',
    messageKey: 'alert.low_stock.message',
    refType: 'warehouse',
    refId: OOTY,
    warehouseId: OOTY,
    since: '2026-10-20T04:30:00.000Z',
    params: { cropId: TOMATO, grade: 'GRADE_1', totalQtyKg: '2.000', thresholdKg: '5.000' },
    state: 'ACTIVE',
    snoozedUntil: null,
    ...overrides,
  } as AlertItemDto;
}

function ledger(overrides: Partial<StockLedgerEntryDto> = {}): StockLedgerEntryDto {
  return {
    id: nextId(),
    batchId: nextId(),
    warehouseId: OOTY,
    txnType: 'RECEIPT',
    qtyDeltaKg: '100.000',
    balanceAfterKg: '100.000',
    performedAt: '2026-10-20T04:30:00.000Z',
    ...overrides,
  };
}

const FULL_ACCESS: MainInventoryAccess = {
  stock: true,
  allocations: true,
  lowStock: true,
  verifications: true,
  adjustments: true,
  transfers: true,
  transferInitiate: true,
  ledger: true,
};

const NO_ACCESS: MainInventoryAccess = {
  stock: false,
  allocations: false,
  lowStock: false,
  verifications: false,
  adjustments: false,
  transfers: false,
  transferInitiate: false,
  ledger: false,
};

function allStatuses(status: 'loading' | 'error' | 'ready'): Record<MainInventoryCardKey, 'loading' | 'error' | 'ready'> {
  return Object.fromEntries(MAIN_INVENTORY_CARD_ORDER.map((key) => [key, status])) as Record<
    MainInventoryCardKey,
    'loading' | 'error' | 'ready'
  >;
}

const SAMPLE_FIGURES: MainInventoryFigures = {
  totalStockGrams: 12_840_000,
  availableStockGrams: 9_240_000,
  allocatedStockGrams: 2_100_000,
  reservedStockGrams: 1_500_000,
  lowStockItems: { count: 14, exact: true },
  verificationPending: { count: 6, exact: true },
  varianceDetected: { count: 2, exact: false },
  pendingAdjustments: 3,
  transfersAwaitingReceipt: 2,
};

function ok<T>(derived: { ok: true; value: T } | { ok: false }): T {
  if (!derived.ok) throw new Error('expected the derivation to succeed');
  return derived.value;
}

// ─── Card 1: Total Stock ─────────────────────────────────────────────────────

describe('Total Stock (sum of ACTIVE batch qtyAvailableKg, integer grams)', () => {
  it('is a real 0 g for an empty warehouse', () => {
    expect(ok(deriveTotalStockGrams([]))).toBe(0);
  });

  it('counts ACTIVE batches only, in integer grams', () => {
    const batches = [
      batch({ qtyAvailableKg: '0.100' }),
      batch({ qtyAvailableKg: '0.200' }),
      batch({ qtyAvailableKg: '5.000', status: 'DEPLETED' }),
      batch({ qtyAvailableKg: '4.000', status: 'EXPIRED' }),
    ];
    // 0.1 + 0.2 as floats is 0.30000000000000004; as grams it is exactly 300.
    expect(ok(deriveTotalStockGrams(batches))).toBe(300);
  });

  it('fails the figure (never a smaller total) on a quantity that is not a Quantity', () => {
    expect(deriveTotalStockGrams([batch({ qtyAvailableKg: '1.000' }), batch({ qtyAvailableKg: 'ten' })]).ok).toBe(false);
  });

  it('BR-24a: two batches of one crop/grade from different farmers add up to one pooled figure', () => {
    const batches = [
      batch({ sourceFarmerId: nextId(), qtyAvailableKg: '4.250' }),
      batch({ sourceFarmerId: nextId(), qtyAvailableKg: '5.750' }),
    ];
    expect(ok(deriveTotalStockGrams(batches))).toBe(10_000);
  });
});

// ─── Card 2: Available Stock (BR-100) ────────────────────────────────────────

describe('Available Stock (allocation availableQtyKg, capped by the pooled shelf)', () => {
  it('is a real 0 g with no batches and no allocations', () => {
    expect(ok(deriveAvailableStockGrams([], []))).toBe(0);
  });

  it('BR-100f: with no DIRECT sale it equals the sum of the server availableQtyKg', () => {
    const batches = [batch({ qtyAvailableKg: '10.000' })];
    const allocations = [
      allocation({ channel: 'ONLINE', availableQtyKg: '7.000' }),
      allocation({ channel: 'LIVE_MARKET', availableQtyKg: '1.000' }),
      allocation({ channel: 'RESERVE', availableQtyKg: '1.000' }),
      allocation({ channel: 'BUFFER', availableQtyKg: '1.000' }),
    ];
    expect(ok(deriveAvailableStockGrams(batches, allocations))).toBe(10_000);
  });

  it('BR-100a: after a DIRECT sale leaves 0.5 kg on the shelf, the four channels never add up past the shelf', () => {
    // The server caps each channel row at the shelf (0.5 kg each), so a plain
    // sum would claim 2 kg that is not there.
    const batches = [batch({ qtyAvailableKg: '0.500' })];
    const allocations = (['ONLINE', 'LIVE_MARKET', 'RESERVE', 'BUFFER'] as const).map((channel) =>
      allocation({ channel, availableQtyKg: '0.500' }),
    );
    expect(ok(deriveAvailableStockGrams(batches, allocations))).toBe(500);
  });

  it('BR-100e: cart reservations on the shelf are not available again', () => {
    const batches = [batch({ qtyAvailableKg: '10.000' })];
    const allocations = [
      allocation({ channel: 'ONLINE', reservedQtyKg: '2.000', availableQtyKg: '5.000' }),
      allocation({ channel: 'LIVE_MARKET', availableQtyKg: '2.000' }),
      allocation({ channel: 'RESERVE', availableQtyKg: '1.000' }),
      allocation({ channel: 'BUFFER', availableQtyKg: '1.000' }),
    ];
    // 9 kg claimed by the rows, but the shelf is 10 kg minus 2 kg in carts.
    expect(ok(deriveAvailableStockGrams(batches, allocations))).toBe(8_000);
  });

  it('BR-24: pools per warehouse, crop and grade, so one warehouse is never capped by another', () => {
    const batches = [
      batch({ warehouseId: OOTY, qtyAvailableKg: '1.000' }),
      batch({ warehouseId: COONOOR, qtyAvailableKg: '10.000' }),
    ];
    const allocations = [
      allocation({ warehouseId: OOTY, channel: 'ONLINE', availableQtyKg: '1.000' }),
      allocation({ warehouseId: OOTY, channel: 'LIVE_MARKET', availableQtyKg: '1.000' }),
      allocation({ warehouseId: OOTY, channel: 'RESERVE', availableQtyKg: '1.000' }),
      allocation({ warehouseId: COONOOR, channel: 'ONLINE', availableQtyKg: '2.000' }),
    ];
    // Ooty capped at its 1 kg shelf, Coonoor 2 kg: 3 kg, not min(5, 11).
    expect(ok(deriveAvailableStockGrams(batches, allocations))).toBe(3_000);
  });

  it('ignores the shelf of batches that are not ACTIVE', () => {
    const batches = [batch({ qtyAvailableKg: '0.000' }), batch({ qtyAvailableKg: '9.000', status: 'EXPIRED' })];
    expect(ok(deriveAvailableStockGrams(batches, [allocation({ availableQtyKg: '3.000' })]))).toBe(0);
  });

  it('is unknown (null), not 0, when a row carries no availableQtyKg', () => {
    const rows = [allocation({ availableQtyKg: '1.000' }), allocation({ channel: 'BUFFER', availableQtyKg: undefined })];
    expect(ok(deriveAvailableStockGrams([batch()], rows))).toBeNull();
  });

  it('fails on a malformed quantity', () => {
    expect(deriveAvailableStockGrams([batch()], [allocation({ availableQtyKg: '1,5 kg' })]).ok).toBe(false);
    expect(deriveAvailableStockGrams([batch({ qtyAvailableKg: 'x' })], [allocation()]).ok).toBe(false);
  });
});

// ─── Cards 3 and 4: Allocated, Reserved ──────────────────────────────────────

describe('Allocated Stock (sum of allocatedQtyKg)', () => {
  it('is 0 g for no rows and an exact gram sum for mixed rows', () => {
    expect(ok(deriveAllocatedStockGrams([]))).toBe(0);
    const rows = [allocation({ allocatedQtyKg: '0.001' }), allocation({ channel: 'BUFFER', allocatedQtyKg: '2.999' })];
    expect(ok(deriveAllocatedStockGrams(rows))).toBe(3_000);
  });

  it('fails on a malformed quantity', () => {
    expect(deriveAllocatedStockGrams([allocation({ allocatedQtyKg: '' })]).ok).toBe(false);
  });
});

describe('Reserved Stock (sum of allocation reservedQtyKg, the cart holds of BR-22)', () => {
  it('is 0 g for no rows; an absent reservedQtyKg holds nothing', () => {
    expect(ok(deriveReservedStockGrams([]))).toBe(0);
    expect(ok(deriveReservedStockGrams([allocation({ reservedQtyKg: undefined })]))).toBe(0);
  });

  it('sums the stored reservations exactly', () => {
    const rows = [allocation({ reservedQtyKg: '1.250' }), allocation({ channel: 'LIVE_MARKET', reservedQtyKg: '0.250' })];
    expect(ok(deriveReservedStockGrams(rows))).toBe(1_500);
  });

  it('fails on a malformed quantity', () => {
    expect(deriveReservedStockGrams([allocation({ reservedQtyKg: 'abc' })]).ok).toBe(false);
  });
});

// ─── Card 5: Low Stock Items ─────────────────────────────────────────────────

describe('Low Stock Items (the server LOW_STOCK alerts)', () => {
  it('is 0 for no alerts', () => {
    expect(countLowStockItems([])).toBe(0);
  });

  it('counts each LOW_STOCK item once and ignores the other alert types', () => {
    const alerts = [
      alert(),
      alert(), // the same item twice (two pages overlapping): still one item
      alert({ itemKey: `low_stock:${OOTY}:${CARROT}:GRADE_1` }),
      alert({ itemKey: 'batch_near_expiry:x', type: 'BATCH_NEAR_EXPIRY' }),
      alert({ itemKey: 'capacity_near_full:y', type: 'CAPACITY_NEAR_FULL' }),
    ];
    expect(countLowStockItems(alerts)).toBe(2);
  });
});

// ─── Cards 6 and 7: Verification Pending, Variance Detected (BR-107) ─────────

describe('Verification Pending and Variance Detected (stock counts, BR-107)', () => {
  it('Verification Pending is a RECORDED count; RECONCILED is done', () => {
    expect(isVerificationPending(verification({ status: 'RECORDED' }))).toBe(true);
    expect(isVerificationPending(verification({ status: 'RECONCILED', varianceKg: '0.000' }))).toBe(false);
  });

  it('Variance Detected is a non-zero variance that is not RECONCILED, compared in grams', () => {
    expect(hasOpenVariance(verification({ varianceKg: '-0.001' }))).toBe(true);
    expect(hasOpenVariance(verification({ varianceKg: '2.000' }))).toBe(true);
    expect(hasOpenVariance(verification({ varianceKg: '0.000' }))).toBe(false);
    expect(hasOpenVariance(verification({ varianceKg: '-0.000' }))).toBe(false);
    expect(hasOpenVariance(verification({ status: 'RECONCILED', varianceKg: '-3.000' }))).toBe(false);
  });

  it('counts nothing for no rows', () => {
    expect(ok(deriveVerificationCounts([]))).toEqual({ pending: 0, variance: 0 });
  });

  it('counts mixed rows', () => {
    const rows = [
      verification({ varianceKg: '-0.500' }),
      verification({ varianceKg: '1.000' }),
      verification({ varianceKg: '0.000' }), // recorded but no difference: pending, not a variance
      verification({ status: 'RECONCILED', varianceKg: '-1.000', adjustmentId: nextId() }),
    ];
    expect(ok(deriveVerificationCounts(rows))).toEqual({ pending: 3, variance: 2 });
  });

  it('BR-107: never reports a DISPUTED count; a DISPUTED row the server should not write is ignored', () => {
    const rows = [
      verification({ status: 'DISPUTED', varianceKg: '-4.000' }),
      verification({ status: 'DISPUTED', varianceKg: '0.000' }),
      verification({ varianceKg: '-0.250' }),
    ];
    const counts = ok(deriveVerificationCounts(rows));
    expect(counts).toEqual({ pending: 1, variance: 1 });
    expect(Object.keys(counts)).not.toContain('disputed');
    expect(isVerificationPending(rows[0] as StockVerificationDto)).toBe(false);
    expect(hasOpenVariance(rows[0] as StockVerificationDto)).toBe(false);
  });

  it('fails (never undercounts) when a RECORDED variance is not a Quantity', () => {
    expect(deriveVerificationCounts([verification({ varianceKg: 'n/a' })]).ok).toBe(false);
  });
});

// ─── Card 8: Pending Adjustments, and the transfer receiving count ───────────

describe('Server totals (Pending Adjustments, transfers awaiting receipt)', () => {
  it('accepts a whole, non-negative total, including a real 0', () => {
    expect(ok(deriveServerTotal(0))).toBe(0);
    expect(ok(deriveServerTotal(3))).toBe(3);
  });

  it('fails a total that is not a whole count', () => {
    expect(deriveServerTotal(-1).ok).toBe(false);
    expect(deriveServerTotal(1.5).ok).toBe(false);
    expect(deriveServerTotal('3').ok).toBe(false);
    expect(deriveServerTotal(undefined).ok).toBe(false);
  });
});

// ─── Reading every page of a number-paged list ───────────────────────────────

describe('collectOffsetPages', () => {
  it('reads pages until the server total is reached', async () => {
    const all = [1, 2, 3, 4, 5];
    const asked: number[] = [];
    const read = await collectOffsetPages(async (page) => {
      asked.push(page);
      return { items: all.slice((page - 1) * 2, page * 2), page, pageSize: 2, total: all.length };
    }, 10);
    expect(read).toEqual({ items: all, complete: true });
    expect(asked).toEqual([1, 2, 3]);
  });

  it('stops on an empty page and says so when the page cap cut the list short', async () => {
    const empty = await collectOffsetPages(async (page) => ({ items: [], page, pageSize: 2, total: 0 }), 10);
    expect(empty).toEqual({ items: [], complete: true });
    const capped = await collectOffsetPages(async (page) => ({ items: [page, page], page, pageSize: 2, total: 100 }), 2);
    expect(capped).toEqual({ items: [1, 1, 2, 2], complete: false });
  });
});

// ─── Permissions and scope ───────────────────────────────────────────────────

describe('permissions and scope', () => {
  it('reads every gate from a docs/rbac.json code', () => {
    const held = new Set<string>([
      MAIN_INVENTORY_CODES.batches,
      MAIN_INVENTORY_CODES.allocations,
      MAIN_INVENTORY_CODES.ledgerOwn,
      'inventory.stock_verification.perform',
    ]);
    const access = mainInventoryAccess((code) => held.has(code));
    expect(access).toEqual({
      stock: true,
      allocations: true,
      lowStock: false,
      verifications: true,
      adjustments: false,
      transfers: false,
      transferInitiate: false,
      ledger: true,
    });
  });

  it('BR-30: a Sub scope always sends its own warehouse, whatever the picker says', () => {
    expect(inventoryWarehouseFilter({ warehouseId: OOTY }, COONOOR)).toBe(OOTY);
    expect(inventoryWarehouseFilter({}, COONOOR)).toBe(COONOOR);
    expect(inventoryWarehouseFilter({}, undefined)).toBeUndefined();
  });
});

// ─── The 8 cards ─────────────────────────────────────────────────────────────

describe('the 8 stat cards', () => {
  it('keeps the design order', () => {
    expect(MAIN_INVENTORY_CARD_ORDER).toEqual([
      'totalStock',
      'availableStock',
      'allocatedStock',
      'reservedStock',
      'lowStockItems',
      'verificationPending',
      'varianceDetected',
      'pendingAdjustments',
    ]);
    const cards = buildMainInventoryCards(FULL_ACCESS, allStatuses('ready'), SAMPLE_FIGURES);
    expect(cards.map((c) => c.key)).toEqual(MAIN_INVENTORY_CARD_ORDER);
  });

  it('formats ready figures: kilograms from grams, counts with "+" when more may exist', () => {
    const cards = buildMainInventoryCards(FULL_ACCESS, allStatuses('ready'), SAMPLE_FIGURES);
    const value = (key: MainInventoryCardKey) => cards.find((c) => c.key === key)?.value;
    expect(value('totalStock')).toBe(formatKg(12_840_000));
    expect(value('availableStock')).toBe(formatKg(9_240_000));
    expect(value('allocatedStock')).toBe(formatKg(2_100_000));
    expect(value('reservedStock')).toBe(formatKg(1_500_000));
    expect(value('lowStockItems')).toBe('14');
    expect(value('verificationPending')).toBe('6');
    expect(value('varianceDetected')).toBe('2+');
    expect(value('pendingAdjustments')).toBe('3');
    for (const card of cards) {
      expect(card.title).not.toBe('');
      expect(card.subtitle).not.toBe('');
    }
  });

  it('shows the placeholder, never 0, while loading or after a failure', () => {
    for (const status of ['loading', 'error'] as const) {
      const cards = buildMainInventoryCards(FULL_ACCESS, allStatuses(status), EMPTY_MAIN_INVENTORY_FIGURES);
      expect(cards).toHaveLength(8);
      for (const card of cards) {
        expect(card.value).toBe(FIGURE_PLACEHOLDER);
        expect(card.status).toBe(status);
      }
    }
  });

  it('shows a real 0 once the server has answered with nothing', () => {
    const cards = buildMainInventoryCards(FULL_ACCESS, allStatuses('ready'), EMPTY_MAIN_INVENTORY_FIGURES);
    expect(cards.find((c) => c.key === 'totalStock')?.value).toBe(formatKg(0));
    expect(cards.find((c) => c.key === 'pendingAdjustments')?.value).toBe('0');
  });

  it('shows "no value" for an Available Stock the server did not supply', () => {
    const cards = buildMainInventoryCards(FULL_ACCESS, allStatuses('ready'), { ...SAMPLE_FIGURES, availableStockGrams: null });
    expect(cards.find((c) => c.key === 'availableStock')?.value).toBe(FIGURE_PLACEHOLDER);
  });

  it('hides (does not zero) a card whose permission the caller lacks', () => {
    expect(buildMainInventoryCards(NO_ACCESS, allStatuses('ready'), SAMPLE_FIGURES)).toEqual([]);
    const noCounts = buildMainInventoryCards({ ...FULL_ACCESS, verifications: false, adjustments: false }, allStatuses('ready'), SAMPLE_FIGURES);
    expect(noCounts.map((c) => c.key)).toEqual(['totalStock', 'availableStock', 'allocatedStock', 'reservedStock', 'lowStockItems']);
    const noAllocations = buildMainInventoryCards({ ...FULL_ACCESS, allocations: false }, allStatuses('ready'), SAMPLE_FIGURES);
    expect(noAllocations.map((c) => c.key)).toEqual([
      'totalStock',
      'lowStockItems',
      'verificationPending',
      'varianceDetected',
      'pendingAdjustments',
    ]);
  });

  it('marks Low Stock and Variance as needing attention only when there are some', () => {
    const tone = (figures: MainInventoryFigures, key: MainInventoryCardKey) =>
      buildMainInventoryCards(FULL_ACCESS, allStatuses('ready'), figures).find((c) => c.key === key)?.tone;
    expect(tone(SAMPLE_FIGURES, 'lowStockItems')).toBe('danger');
    expect(tone(SAMPLE_FIGURES, 'varianceDetected')).toBe('danger');
    expect(tone(SAMPLE_FIGURES, 'totalStock')).toBe('default');
    expect(tone(EMPTY_MAIN_INVENTORY_FIGURES, 'lowStockItems')).toBe('default');
  });

  it('opens the screen each card summarises', () => {
    const cards = buildMainInventoryCards(FULL_ACCESS, allStatuses('ready'), SAMPLE_FIGURES);
    expect(Object.fromEntries(cards.map((c) => [c.key, c.target]))).toEqual({
      totalStock: 'stockList',
      availableStock: 'stockList',
      allocatedStock: 'allocation',
      reservedStock: 'allocation',
      lowStockItems: 'lowStock',
      verificationPending: 'verification',
      varianceDetected: 'varianceReview',
      pendingAdjustments: 'adjustments',
    });
  });
});

// ─── Sections ────────────────────────────────────────────────────────────────

describe('Warehouse Overview', () => {
  const warehouses = [
    { warehouseId: OOTY, name: 'Ooty Warehouse' },
    { warehouseId: COONOOR, name: 'Coonoor Warehouse' },
  ];

  it('lists every warehouse with its ACTIVE stock; one with none is a real 0 g', () => {
    const batches = [
      batch({ warehouseId: OOTY, qtyAvailableKg: '1.500' }),
      batch({ warehouseId: OOTY, qtyAvailableKg: '0.500' }),
      batch({ warehouseId: OOTY, qtyAvailableKg: '9.000', status: 'DEPLETED' }),
    ];
    expect(ok(buildWarehouseOverview(batches, warehouses, undefined))).toEqual([
      { warehouseId: OOTY, name: 'Ooty', stockGrams: 2_000, stockText: formatKg(2_000) },
      { warehouseId: COONOOR, name: 'Coonoor', stockGrams: 0, stockText: formatKg(0) },
    ]);
  });

  it('keeps only the picked warehouse, and nothing for a warehouse that is not listed', () => {
    expect(ok(buildWarehouseOverview([], warehouses, COONOOR)).map((r) => r.warehouseId)).toEqual([COONOOR]);
    expect(ok(buildWarehouseOverview([], warehouses, nextId()))).toEqual([]);
  });

  it('fails on a malformed quantity', () => {
    expect(buildWarehouseOverview([batch({ qtyAvailableKg: '?' })], warehouses, undefined).ok).toBe(false);
  });
});

describe('Inventory Health', () => {
  it('is all zero for an empty warehouse', () => {
    expect(ok(buildInventoryHealth([], []))).toEqual({ normal: 0, low: 0 });
  });

  it('BR-24: counts pooled stock lines (warehouse, crop, grade); a line is low only when the server flagged it', () => {
    const batches = [
      batch({ cropId: TOMATO, sourceFarmerId: nextId() }),
      batch({ cropId: TOMATO, sourceFarmerId: nextId() }), // same line, another farmer
      batch({ cropId: CARROT }),
      batch({ cropId: CARROT, grade: 'GRADE_2' }),
      batch({ cropId: CARROT, warehouseId: COONOOR }),
      batch({ cropId: CARROT, qtyAvailableKg: '0.000', grade: 'GRADE_3' }), // nothing on hand: not a stocked line
    ];
    const alerts = [alert({ params: { cropId: TOMATO, grade: 'GRADE_1' } }), alert({ itemKey: 'x', type: 'CAPACITY_NEAR_FULL' })];
    expect(ok(buildInventoryHealth(batches, alerts))).toEqual({ normal: 3, low: 1 });
  });
});

describe('Recent Stock Movements', () => {
  it('names the batch and product from the loaded batches, newest first as the server sent them', () => {
    const b = batch({ batchCode: 'BATCH-2026-000128', sourceFarmerId: nextId() });
    const rows = toRecentMovements(
      [ledger({ batchId: b.id, txnType: 'RECEIPT', qtyDeltaKg: '100.000' }), ledger({ txnType: 'SALE', qtyDeltaKg: '-2.500' })],
      [b],
      [{ warehouseId: OOTY, name: 'Ooty Warehouse' }],
      new Date('2026-10-20T06:00:00.000Z'),
      3,
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]?.subtitle).toContain('BATCH-2026-000128');
    expect(rows[0]?.subtitle).toContain('Ooty');
    expect(rows[0]?.qty).toBe(`+${formatKg(100_000)}`);
    expect(rows[1]?.qty).toBe(formatKg(-2_500));
    expect(rows[1]?.direction).toBe('out');
  });

  it('BR-16: carries no farmer field even when the batch has one', () => {
    const b = batch({ sourceFarmerId: nextId() });
    const [row] = toRecentMovements([ledger({ batchId: b.id })], [b], [], new Date(), 3);
    expect(JSON.stringify(row)).not.toContain(b.sourceFarmerId as string);
    expect(Object.keys(row ?? {}).some((k) => /farm/i.test(k))).toBe(false);
  });

  it('keeps at most `limit` rows', () => {
    expect(toRecentMovements([ledger(), ledger(), ledger(), ledger()], [], [], new Date(), 3)).toHaveLength(3);
  });
});

describe('Pending Actions and Quick Actions', () => {
  it('lists the four queues in the design order with their figures', () => {
    const rows = buildPendingActions(FULL_ACCESS, { verifications: 'ready', adjustments: 'ready', transfers: 'ready' }, SAMPLE_FIGURES);
    expect(rows.map((r) => [r.key, r.value, r.target])).toEqual([
      ['verification', '6', 'verification'],
      ['adjustment', '3', 'adjustments'],
      ['transferReceiving', '2', 'transferReceiving'],
      ['stockException', '2+', 'varianceReview'],
    ]);
  });

  it('hides a queue the caller cannot read, and shows the placeholder while one loads', () => {
    const rows = buildPendingActions(
      { ...FULL_ACCESS, transfers: false, adjustments: false },
      { verifications: 'loading', adjustments: 'ready', transfers: 'ready' },
      SAMPLE_FIGURES,
    );
    expect(rows.map((r) => [r.key, r.value])).toEqual([
      ['verification', FIGURE_PLACEHOLDER],
      ['stockException', FIGURE_PLACEHOLDER],
    ]);
  });

  it('offers only the quick actions the caller holds the code for; no delivery or material handling', () => {
    expect(buildQuickActions(FULL_ACCESS).map((a) => a.target)).toEqual([
      'stockList',
      'verification',
      'allocation',
      'lowStock',
      'createTransfer',
    ]);
    expect(buildQuickActions(NO_ACCESS)).toEqual([]);
  });
});
