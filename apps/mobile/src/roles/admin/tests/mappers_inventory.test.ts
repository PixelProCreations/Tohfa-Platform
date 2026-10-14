/**
 * screens/warehouse/inventory/mappers.ts: API rows -> the inventory UI types.
 *
 * Every quantity is integer grams parsed from the API's kg string, never a
 * float, so sums and signs are exact. What the server says is shown as it
 * says it: availability is the server's own figure (BR-100), never recomputed
 * from received / reserved / consumed, and a ledger delta keeps its own sign
 * (BR-37: the ledger is the source of truth for stock).
 */
import { describe, expect, it } from 'vitest';
import type { AlertItemDto } from '../api/alerts';
import type { AllocationDto, BatchDto, StockLedgerEntryDto } from '../api/inventory';
import { t } from '../i18n';
import {
  aggregateStockByProduct,
  allocatedByProduct,
  batchStatusOf,
  buildAllocationDashboard,
  cropNamesOf,
  gradeLabel,
  lowStockKeysOf,
  productKey,
  stockMovementKindOf,
  toBatchRow,
  toLowStockRow,
  toStockMovementRow,
} from '../screens/warehouse/inventory/mappers';

// 12 Oct 2026, 12:00 PM IST.
const NOW = new Date('2026-10-12T06:30:00Z');
const WAREHOUSE = '11111111-1111-4111-8111-111111111111';
const CARROT = '22222222-2222-4222-8222-222222222222';
const BEANS = '44444444-4444-4444-8444-444444444444';
const BATCH = '33333333-3333-4333-8333-333333333333';

function batch(overrides: Partial<BatchDto> = {}): BatchDto {
  return {
    id: BATCH,
    batchCode: 'BAT-DEMO-WH2-001',
    warehouseId: WAREHOUSE,
    cropId: CARROT,
    cropName: 'Carrot',
    grade: 'GRADE_1',
    goodsReceiptId: null,
    sourceFarmerId: null,
    qtyReceivedKg: '2000.000',
    qtyAvailableKg: '2000.000',
    qtyReservedKg: '0.000',
    storageLocation: 'Cold Storage · A03',
    receivedOn: '2026-10-10',
    expiryOn: null,
    status: 'ACTIVE',
    ...overrides,
  };
}

function entry(overrides: Partial<StockLedgerEntryDto> = {}): StockLedgerEntryDto {
  return {
    id: '55555555-5555-4555-8555-555555555555',
    batchId: BATCH,
    warehouseId: WAREHOUSE,
    txnType: 'RECEIPT',
    qtyDeltaKg: '2000.000',
    balanceAfterKg: '2000.000',
    refType: null,
    refId: null,
    performedBy: '66666666-6666-4666-8666-666666666666',
    // 12 Oct 2026, 10:00 AM IST.
    performedAt: '2026-10-12T04:30:00Z',
    remarks: null,
    ...overrides,
  };
}

function allocation(overrides: Partial<AllocationDto> = {}): AllocationDto {
  return {
    id: '77777777-7777-4777-8777-777777777777',
    warehouseId: WAREHOUSE,
    cropId: CARROT,
    grade: 'GRADE_1',
    allocationDate: '2026-10-10',
    channel: 'ONLINE',
    allocatedQtyKg: '0.000',
    consumedQtyKg: '0.000',
    reservedQtyKg: '0.000',
    availableQtyKg: '0.000',
    computedBy: 'AUTO',
    overriddenBy: null,
    ...overrides,
  };
}

function lowStockAlert(overrides: Partial<AlertItemDto> = {}): AlertItemDto {
  return {
    itemKey: `LOW_STOCK:${WAREHOUSE}:${CARROT}:GRADE_1`,
    type: 'LOW_STOCK',
    messageKey: 'alert.low_stock.message',
    refType: 'WAREHOUSE',
    refId: WAREHOUSE,
    warehouseId: WAREHOUSE,
    since: null,
    params: { cropId: CARROT, grade: 'GRADE_1', totalQtyKg: '12.500', thresholdKg: '50' },
    state: 'ACTIVE',
    snoozedUntil: null,
    ...overrides,
  };
}

describe('toBatchRow', () => {
  it('BR-100: the shown available quantity is the server qtyAvailableKg, exactly, in grams', () => {
    const row = toBatchRow(batch({ qtyReceivedKg: '2000.000', qtyReservedKg: '10.000', qtyAvailableKg: '1234.567' }));
    expect(row.availableGrams).toBe(1234567);
    // Not received - reserved, not anything else the app could compute.
    expect(row.availableGrams).not.toBe(1990000);
    expect(row.receivedGrams).toBe(2000000);
    expect(row.reservedGrams).toBe(10000);
  });

  it('keeps the uuid apart from the human batch code', () => {
    const row = toBatchRow(batch());
    expect(row.id).toBe(BATCH);
    expect(row.batchCode).toBe('BAT-DEMO-WH2-001');
  });

  it('uses the crop name when the server sends one', () => {
    expect(toBatchRow(batch()).productName).toBe('Carrot');
  });

  it('shows a neutral label, never the crop uuid or an invented name, when cropName is missing', () => {
    const { cropName: _omit, ...withoutName } = batch();
    const row = toBatchRow(withoutName);
    expect(row.productName).toBe(t('inventory.crop.unnamed'));
    expect(row.productName).not.toContain(CARROT);
  });

  it('a quantity that is not a Quantity string becomes null, never NaN', () => {
    const row = toBatchRow(batch({ qtyAvailableKg: '12.3456' }));
    expect(row.availableGrams).toBeNull();
  });

  it('an absent optional quantity is null, not zero', () => {
    const { qtyReservedKg: _omit, ...withoutReserved } = batch();
    expect(toBatchRow(withoutReserved).reservedGrams).toBeNull();
  });

  it('formats the received day in IST and keeps a missing storage location as null', () => {
    const row = toBatchRow(batch({ storageLocation: null }));
    expect(row.receivedOn).toBe('10 Oct 2026');
    expect(row.storageLocation).toBeNull();
  });
});

describe('batch status: an exhaustive table with a fallback', () => {
  it('maps every BatchStatus', () => {
    expect(batchStatusOf('ACTIVE')).toBe('active');
    expect(batchStatusOf('DEPLETED')).toBe('depleted');
    expect(batchStatusOf('EXPIRED')).toBe('expired');
    expect(batchStatusOf('WRITTEN_OFF')).toBe('writtenOff');
  });

  it('an unknown status falls back to unknown, with its own label', () => {
    expect(batchStatusOf('QUARANTINED')).toBe('unknown');
    const row = toBatchRow(batch({ status: 'QUARANTINED' as BatchDto['status'] }));
    expect(row.status).toBe('unknown');
    expect(row.statusLabel).toBe(t('inventory.batchStatus.unknown'));
  });
});

describe('gradeLabel', () => {
  it('names every Grade and falls back for an unknown one', () => {
    expect(gradeLabel('GRADE_1')).toBe(t('inventory.grade.GRADE_1'));
    expect(gradeLabel('GRADE_2')).toBe(t('inventory.grade.GRADE_2'));
    expect(gradeLabel('GRADE_3')).toBe(t('inventory.grade.GRADE_3'));
    expect(gradeLabel('REJECT')).toBe(t('inventory.grade.REJECT'));
    expect(gradeLabel('PREMIUM')).toBe(t('inventory.grade.unknown'));
  });
});

describe('aggregateStockByProduct: per crop and grade, in integer grams', () => {
  it('sums exactly: 0.1 kg + 0.2 kg = 300 g', () => {
    const rows = [
      toBatchRow(batch({ id: 'b1', qtyAvailableKg: '0.100', qtyReservedKg: '0.010' })),
      toBatchRow(batch({ id: 'b2', qtyAvailableKg: '0.200', qtyReservedKg: '0.020' })),
    ];
    const summary = aggregateStockByProduct(rows);
    expect(summary.products).toHaveLength(1);
    expect(summary.products[0]?.availableGrams).toBe(300);
    expect(summary.products[0]?.reservedGrams).toBe(30);
    expect(summary.totalAvailableGrams).toBe(300);
    expect(summary.totalReservedGrams).toBe(30);
  });

  it('keeps each crop and each grade apart', () => {
    const summary = aggregateStockByProduct([
      toBatchRow(batch({ id: 'b1', qtyAvailableKg: '10.000' })),
      toBatchRow(batch({ id: 'b2', grade: 'GRADE_2', qtyAvailableKg: '5.000' })),
      toBatchRow(batch({ id: 'b3', cropId: BEANS, cropName: 'Beans', qtyAvailableKg: '7.500' })),
    ]);
    expect(summary.products.map((p) => [p.key, p.availableGrams])).toEqual([
      [productKey(CARROT, 'GRADE_1'), 10000],
      [productKey(BEANS, 'GRADE_1'), 7500],
      [productKey(CARROT, 'GRADE_2'), 5000],
    ]);
    expect(summary.totalAvailableGrams).toBe(22500);
  });

  it('counts only ACTIVE batches (depleted, expired and written-off stock is not on offer)', () => {
    const summary = aggregateStockByProduct([
      toBatchRow(batch({ id: 'b1', qtyAvailableKg: '10.000' })),
      toBatchRow(batch({ id: 'b2', status: 'EXPIRED', qtyAvailableKg: '4.000' })),
      toBatchRow(batch({ id: 'b3', status: 'WRITTEN_OFF', qtyAvailableKg: '3.000' })),
    ]);
    expect(summary.products[0]?.availableGrams).toBe(10000);
    expect(summary.products[0]?.activeBatchCount).toBe(1);
  });

  it('lists distinct storage locations; the primary one holds the most stock', () => {
    const summary = aggregateStockByProduct([
      toBatchRow(batch({ id: 'b1', storageLocation: 'Rack 1', qtyAvailableKg: '1.000' })),
      toBatchRow(batch({ id: 'b2', storageLocation: 'Rack 2', qtyAvailableKg: '5.000' })),
      toBatchRow(batch({ id: 'b3', storageLocation: 'Rack 1', qtyAvailableKg: '2.000' })),
      toBatchRow(batch({ id: 'b4', storageLocation: null, qtyAvailableKg: '9.000' })),
    ]);
    expect(summary.products[0]?.storageLocations).toEqual(['Rack 1', 'Rack 2']);
    expect(summary.products[0]?.primaryStorage).toBe('Rack 2');
  });

  it('marks a product out when nothing is available, low only when the server raised LOW_STOCK for it', () => {
    const rows = [
      toBatchRow(batch({ id: 'b1', qtyAvailableKg: '12.500' })),
      toBatchRow(batch({ id: 'b2', cropId: BEANS, cropName: 'Beans', qtyAvailableKg: '0.000' })),
      toBatchRow(batch({ id: 'b3', grade: 'GRADE_2', qtyAvailableKg: '80.000' })),
    ];
    const summary = aggregateStockByProduct(rows, { lowStockKeys: lowStockKeysOf([lowStockAlert()]) });
    const level = (key: string) => summary.products.find((p) => p.key === key)?.level;
    expect(level(productKey(CARROT, 'GRADE_1'))).toBe('low');
    expect(level(productKey(BEANS, 'GRADE_1'))).toBe('out');
    expect(level(productKey(CARROT, 'GRADE_2'))).toBe('inStock');
  });

  it('a batch with an unreadable quantity is left out of the sums and flags the product incomplete', () => {
    const summary = aggregateStockByProduct([
      toBatchRow(batch({ id: 'b1', qtyAvailableKg: '1.000' })),
      toBatchRow(batch({ id: 'b2', qtyAvailableKg: 'oops' })),
    ]);
    expect(summary.products[0]?.availableGrams).toBe(1000);
    expect(summary.products[0]?.complete).toBe(false);
  });

  it('takes the allocated total per product from the allocation rows, or null when none was given', () => {
    const allocated = allocatedByProduct([
      allocation({ allocatedQtyKg: '0.700' }),
      allocation({ channel: 'BUFFER', allocatedQtyKg: '0.100' }),
    ]);
    const withAllocations = aggregateStockByProduct([toBatchRow(batch())], { allocatedByProduct: allocated });
    expect(withAllocations.products[0]?.allocatedGrams).toBe(800);
    expect(aggregateStockByProduct([toBatchRow(batch())]).products[0]?.allocatedGrams).toBeNull();
  });
});

describe('toStockMovementRow: the ledger as the server recorded it (BR-37)', () => {
  it('BR-37: ledger signs map without float (the delta keeps its own sign, in whole grams)', () => {
    const sale = toStockMovementRow(entry({ txnType: 'SALE', qtyDeltaKg: '-20.000', balanceAfterKg: '1980.000' }), NOW);
    expect(sale.deltaGrams).toBe(-20000);
    expect(sale.direction).toBe('out');
    expect(sale.deltaText).toBe('-20 kg');
    expect(sale.balanceAfterGrams).toBe(1980000);

    const receipt = toStockMovementRow(entry(), NOW);
    expect(receipt.deltaGrams).toBe(2000000);
    expect(receipt.direction).toBe('in');
    expect(receipt.deltaText).toBe('+2,000 kg');

    const gram = toStockMovementRow(entry({ txnType: 'ADJUSTMENT', qtyDeltaKg: '-0.001', balanceAfterKg: '0.300' }), NOW);
    expect(gram.deltaGrams).toBe(-1);
    expect(gram.deltaText).toBe('-0.001 kg');
    expect(gram.balanceAfterGrams).toBe(300);
  });

  it('BR-37: an adjustment can go either way; the sign comes from the delta, not the type', () => {
    const up = toStockMovementRow(entry({ txnType: 'ADJUSTMENT', qtyDeltaKg: '0.250' }), NOW);
    const down = toStockMovementRow(entry({ txnType: 'ADJUSTMENT', qtyDeltaKg: '-0.250' }), NOW);
    expect([up.direction, up.deltaGrams]).toEqual(['in', 250]);
    expect([down.direction, down.deltaGrams]).toEqual(['out', -250]);
  });

  it('maps every StockTxnType to its kind, and an unknown type falls back', () => {
    expect(stockMovementKindOf('RECEIPT')).toBe('receipt');
    expect(stockMovementKindOf('SALE')).toBe('sale');
    expect(stockMovementKindOf('TRANSFER_OUT')).toBe('transferOut');
    expect(stockMovementKindOf('TRANSFER_IN')).toBe('transferIn');
    expect(stockMovementKindOf('ADJUSTMENT')).toBe('adjustment');
    expect(stockMovementKindOf('WASTAGE')).toBe('wastage');
    expect(stockMovementKindOf('RETURN_IN')).toBe('returnIn');
    expect(stockMovementKindOf('RESERVATION')).toBe('reservation');
    expect(stockMovementKindOf('RELEASE')).toBe('release');
    expect(stockMovementKindOf('RECOUNT')).toBe('unknown');
    const row = toStockMovementRow(entry({ txnType: 'RECOUNT' as StockLedgerEntryDto['txnType'] }), NOW);
    expect(row.typeLabel).toBe(t('inventory.movement.unknown'));
  });

  it('an unreadable delta is shown as nothing, with no direction, never NaN', () => {
    const row = toStockMovementRow(entry({ qtyDeltaKg: '1e3' }), NOW);
    expect(row.deltaGrams).toBeNull();
    expect(row.direction).toBe('none');
    expect(row.deltaText).toBe('');
  });

  it('dates the movement in IST and names the batch only when it is known', () => {
    const unknown = toStockMovementRow(entry(), NOW);
    expect(unknown.performedAt).toBe('Today · 10:00 AM');
    expect(unknown.batchCode).toBeUndefined();
    expect(unknown.productLabel).toBeUndefined();

    const lookup = new Map([[BATCH, toBatchRow(batch())]]);
    const known = toStockMovementRow(entry(), NOW, lookup);
    expect(known.batchCode).toBe('BAT-DEMO-WH2-001');
    expect(known.productLabel).toBe(`Carrot · ${t('inventory.grade.GRADE_1')}`);
  });
});

describe('buildAllocationDashboard: channel totals in grams', () => {
  it('always lists the four channels in order, summed exactly', () => {
    const dashboard = buildAllocationDashboard([
      allocation({ channel: 'BUFFER', allocatedQtyKg: '0.100', consumedQtyKg: '0.000', availableQtyKg: '0.100' }),
      allocation({ channel: 'ONLINE', allocatedQtyKg: '0.100', consumedQtyKg: '0.050', reservedQtyKg: '0.010', availableQtyKg: '0.040' }),
      allocation({ channel: 'ONLINE', allocatedQtyKg: '0.200', consumedQtyKg: '0.000', reservedQtyKg: '0.000', availableQtyKg: '0.200' }),
    ]);
    expect(dashboard.channels.map((c) => c.channel)).toEqual(['online', 'liveMarket', 'reserve', 'buffer']);
    const online = dashboard.channels[0];
    expect(online?.allocatedGrams).toBe(300);
    expect(online?.consumedGrams).toBe(50);
    expect(online?.reservedGrams).toBe(10);
    expect(online?.availableGrams).toBe(240);
    expect(dashboard.channels[1]?.allocatedGrams).toBe(0);
    expect(dashboard.totalAllocatedGrams).toBe(400);
  });

  it('BR-100: shows the server availableQtyKg (capped by the shelf), never allocated - consumed - reserved', () => {
    const dashboard = buildAllocationDashboard([
      allocation({ channel: 'ONLINE', allocatedQtyKg: '7.000', consumedQtyKg: '0.000', reservedQtyKg: '0.000', availableQtyKg: '0.500' }),
    ]);
    expect(dashboard.channels[0]?.availableGrams).toBe(500);
    expect(dashboard.channels[0]?.allocatedGrams).toBe(7000);
  });

  it('BR-100: a channel whose rows lack availableQtyKg shows no figure rather than a computed one', () => {
    const { availableQtyKg: _omit, ...withoutAvailable } = allocation({ allocatedQtyKg: '5.000' });
    const dashboard = buildAllocationDashboard([withoutAvailable]);
    expect(dashboard.channels[0]?.availableGrams).toBeNull();
  });

  it('the split bar shares are integer basis points proportional to allocated grams, summing to 10000', () => {
    const dashboard = buildAllocationDashboard([
      allocation({ channel: 'ONLINE', allocatedQtyKg: '420.000' }),
      allocation({ channel: 'LIVE_MARKET', allocatedQtyKg: '120.000' }),
      allocation({ channel: 'RESERVE', allocatedQtyKg: '80.000' }),
      allocation({ channel: 'BUFFER', allocatedQtyKg: '60.000' }),
    ]);
    const shares = dashboard.channels.map((c) => c.shareBasisPoints);
    expect(shares).toEqual([6177, 1765, 1176, 882]);
    expect(shares.reduce((a, b) => a + b, 0)).toBe(10000);
    for (const share of shares) expect(Number.isInteger(share)).toBe(true);
  });

  it('with nothing allocated every share is zero', () => {
    const dashboard = buildAllocationDashboard([]);
    expect(dashboard.channels.map((c) => c.shareBasisPoints)).toEqual([0, 0, 0, 0]);
    expect(dashboard.totalAllocatedGrams).toBe(0);
  });

  it('an unknown channel falls back to its own bucket after the four', () => {
    const dashboard = buildAllocationDashboard([
      allocation({ channel: 'HORECA' as AllocationDto['channel'], allocatedQtyKg: '1.000', availableQtyKg: '1.000' }),
    ]);
    expect(dashboard.channels.map((c) => c.channel)).toEqual(['online', 'liveMarket', 'reserve', 'buffer', 'unknown']);
    expect(dashboard.channels[4]?.label).toBe(t('inventory.channel.unknown'));
    expect(dashboard.channels[4]?.allocatedGrams).toBe(1000);
  });
});

describe('low stock from the LOW_STOCK alerts', () => {
  it('keys each alert by crop and grade', () => {
    expect([...lowStockKeysOf([lowStockAlert(), lowStockAlert({ type: 'BATCH_NEAR_EXPIRY' })])]).toEqual([
      productKey(CARROT, 'GRADE_1'),
    ]);
  });

  it('names the crop from the loaded batches, else a neutral label', () => {
    const names = cropNamesOf([toBatchRow(batch())]);
    const named = toLowStockRow(lowStockAlert(), names);
    expect(named.name).toBe(`Carrot · ${t('inventory.grade.GRADE_1')}`);
    expect(named.available).toBe('12.5 kg');
    expect(named.threshold).toBe('50 kg');
    expect(named.cropId).toBe(CARROT);
    expect(named.grade).toBe('GRADE_1');

    const unnamed = toLowStockRow(lowStockAlert(), new Map());
    expect(unnamed.name).toBe(`${t('inventory.crop.unnamed')} · ${t('inventory.grade.GRADE_1')}`);
  });

  it('a quantity that does not parse is shown as sent, never NaN', () => {
    const row = toLowStockRow(lowStockAlert({ params: { cropId: CARROT, grade: 'GRADE_1', totalQtyKg: 'n/a', thresholdKg: '50' } }), new Map());
    expect(row.available).toBe('n/a');
  });
});
