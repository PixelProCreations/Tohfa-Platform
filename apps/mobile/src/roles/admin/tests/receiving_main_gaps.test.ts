/**
 * Receiving batch 2 (Main warehouse admin, design M2-03 / M2-08B / M2-12A):
 *
 *  - Search & Filters offers only the facets the two list endpoints take:
 *    `warehouseId` (GET /admin/purchase-orders and /admin/goods-receipts) and
 *    the receipt `status` (GET /admin/goods-receipts). A Sub scope never gets
 *    a warehouse facet and never widens past its own warehouse (BR-30).
 *  - The Main view names a receipt's / order's warehouse from GET /warehouses,
 *    since its scope carries no warehouse name.
 *  - A purchase order carries no crop name (server gap): the label says which
 *    order it is, never "Unnamed crop" and never an invented crop.
 *  - Grade verification is derived from the order's grade, the assigned grade
 *    and the received weight; the batch shown after a receipt is the one the
 *    quality check created (BR-106), read from the API, never assigned later.
 *
 * Pure functions only (plain-Node vitest), plus a few source checks for wiring
 * a function test cannot see.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { GoodsReceiptDto, PurchaseOrderDto, QualityCheckResultDto } from '../api/receiving';
import type { BatchDto } from '../api/inventory';
import { t } from '../i18n';
import {
  EMPTY_RECEIVING_FILTERS,
  gradeVerificationOf,
  offersReceivingFilters,
  receiptBatchOf,
  receivingCropLabel,
  receivingFilterFacets,
  receivingFilterParams,
  toIncomingShipment,
  toReceivingRecord,
  warehouseNameFor,
} from '../screens/warehouse/receiving-qc/mappers';
import type { WarehouseScope } from '../screens/warehouse/receiving-qc/types';

const WH = '11111111-1111-4111-8111-111111111111';
const WH_OTHER = '99999999-9999-4999-8999-999999999999';
const PO_ID = '22222222-2222-4222-8222-222222222222';
const GR_ID = '33333333-3333-4333-8333-333333333333';
const BATCH_ID = '88888888-8888-4888-8888-888888888888';
const NOW = new Date('2026-10-12T06:30:00Z');

const MAIN: WarehouseScope = {};
const SUB: WarehouseScope = { warehouseId: WH, warehouseName: 'Coonoor' };
const ALL = () => true;
const NONE = () => false;

const PO: PurchaseOrderDto = {
  id: PO_ID,
  poNumber: 'PO-2026-000031',
  farmerId: '55555555-5555-4555-8555-555555555555',
  warehouseId: WH,
  cropId: '77777777-7777-4777-8777-777777777777',
  grade: 'GRADE_1',
  quantityKg: '650.000',
  pricePerKg: '42.50' as never,
  totalAmount: '27625.00' as never,
  status: 'ISSUED',
};

function receipt(overrides: Partial<GoodsReceiptDto> = {}): GoodsReceiptDto {
  return {
    id: GR_ID,
    grnNumber: 'GRN-2026-000101',
    purchaseOrderId: PO_ID,
    warehouseId: WH,
    grossQtyKg: '480.000',
    acceptedQtyKg: '0.000',
    rejectedQtyKg: '0.000',
    status: 'AWAITING_QC',
    receivedAt: '2026-10-12T05:00:00Z',
    ...overrides,
  };
}

const NAMES: ReadonlyMap<string, string> = new Map([
  [WH, 'Coonoor'],
  [WH_OTHER, 'Ooty'],
]);

// ─── M2-03 Search & Filters ──────────────────────────────────────────────────

describe('M2-03 receiving filters: only what the list endpoints take', () => {
  it('Main gets the warehouse facet on both lists, and the result facet only on Receiving History', () => {
    expect(receivingFilterFacets(MAIN, ALL, 'Shipments')).toEqual({ warehouse: true, result: false });
    expect(receivingFilterFacets(MAIN, ALL, 'History')).toEqual({ warehouse: true, result: true });
  });

  it('BR-30: a Sub scope never gets a warehouse facet, so the filters are not offered to it', () => {
    expect(receivingFilterFacets(SUB, ALL, 'Shipments').warehouse).toBe(false);
    expect(receivingFilterFacets(SUB, ALL, 'History').warehouse).toBe(false);
    expect(offersReceivingFilters(SUB, ALL, 'Shipments')).toBe(false);
    expect(offersReceivingFilters(SUB, ALL, 'History')).toBe(false);
  });

  it('Main without warehouse.all.view cannot load the warehouse list, so nothing is offered', () => {
    expect(receivingFilterFacets(MAIN, NONE, 'History').warehouse).toBe(false);
    expect(offersReceivingFilters(MAIN, NONE, 'Shipments')).toBe(false);
    expect(offersReceivingFilters(MAIN, (code) => code === 'warehouse.all.view', 'Shipments')).toBe(true);
  });

  it('the filters hold no facet the API cannot apply (no search text, date, type, status, grade, source or product)', () => {
    expect(Object.keys(EMPTY_RECEIVING_FILTERS).sort()).toEqual(['result', 'warehouseId']);
    expect(EMPTY_RECEIVING_FILTERS).toEqual({ warehouseId: undefined, result: 'All' });
  });

  it('applied on Main: the picked warehouse uuid, and on History the result as the server status pill', () => {
    expect(receivingFilterParams(MAIN, { warehouseId: WH_OTHER, result: 'Partial' }, 'History')).toEqual({
      filterWarehouseId: WH_OTHER,
      historyFilter: 'Partial',
    });
    // The incoming list is purchase orders: a receipt result does not apply to it.
    expect(receivingFilterParams(MAIN, { warehouseId: WH_OTHER, result: 'Partial' }, 'Shipments')).toEqual({
      filterWarehouseId: WH_OTHER,
    });
    expect(receivingFilterParams(MAIN, EMPTY_RECEIVING_FILTERS, 'Shipments')).toEqual({ filterWarehouseId: undefined });
  });

  it('BR-30: applied on a Sub scope, a warehouse pick is dropped (the flow sends its own uuid)', () => {
    expect(receivingFilterParams(SUB, { warehouseId: WH_OTHER, result: 'Rejected' }, 'History')).toEqual({
      filterWarehouseId: undefined,
      historyFilter: 'Rejected',
    });
  });
});

// ─── Main destination / warehouse name ───────────────────────────────────────

describe('Main warehouse name resolved from GET /warehouses', () => {
  it('a Sub scope uses its own name; Main looks the uuid up; unknown stays undefined', () => {
    expect(warehouseNameFor(WH, { warehouseName: 'Coonoor' })).toBe('Coonoor');
    expect(warehouseNameFor(WH_OTHER, { warehouseNames: NAMES })).toBe('Ooty');
    expect(warehouseNameFor('not-listed', { warehouseNames: NAMES })).toBeUndefined();
    expect(warehouseNameFor(WH, {})).toBeUndefined();
  });

  it('a Main shipment names its destination from the order warehouse uuid (was blank)', () => {
    expect(toIncomingShipment({ ...PO, warehouseId: WH_OTHER }, { warehouseNames: NAMES }).to).toBe('Ooty');
  });

  it('a Main receipt names its warehouse from the receipt warehouse uuid (was blank)', () => {
    expect(toReceivingRecord(receipt({ warehouseId: WH_OTHER }), { now: NOW, warehouseNames: NAMES }).warehouseName).toBe('Ooty');
  });
});

// ─── Crop label (PurchaseOrder has no cropName) ──────────────────────────────

describe('crop label when the API sends no crop name', () => {
  it('a crop name the API sent is shown as is', () => {
    expect(receivingCropLabel('Beetroot', 'PO-2026-000031')).toBe('Beetroot');
  });

  it('without one, the label names the order, not "Unnamed crop" and not a made-up crop', () => {
    const label = receivingCropLabel(undefined, 'PO-2026-000031');
    expect(label).toBe(t('receiving.crop.ofOrder', { ref: 'PO-2026-000031' }));
    expect(label).toContain('PO-2026-000031');
    expect(label).not.toBe(t('inventory.crop.unnamed'));
  });

  it('a purchase order list row keeps cropName undefined and labels the produce by its poNumber', () => {
    const s = toIncomingShipment(PO, {});
    expect(s.cropName).toBeUndefined();
    expect(s.produce).toBe(t('receiving.crop.ofOrder', { ref: 'PO-2026-000031' }));
  });

  it('a receipt with no crop name is labelled by its order, else by its GRN', () => {
    expect(toReceivingRecord(receipt({ poNumber: 'PO-2026-000031' }), { now: NOW }).product).toBe(
      t('receiving.crop.ofOrder', { ref: 'PO-2026-000031' }),
    );
    expect(toReceivingRecord(receipt(), { now: NOW }).product).toBe(t('receiving.crop.ofOrder', { ref: 'GRN-2026-000101' }));
  });
});

// ─── M2-08B Mismatch Detail (grade) ──────────────────────────────────────────

describe('M2-08B grade verification, derived', () => {
  it('BR-106: a changed grade affects the whole received quantity (the batch takes the assigned grade)', () => {
    expect(gradeVerificationOf('GRADE_1', 'GRADE_2', 480_000)).toEqual({ status: 'mismatch', quantityAffectedGrams: 480_000 });
  });

  it('the same grade is a match with nothing affected', () => {
    expect(gradeVerificationOf('GRADE_1', 'GRADE_1', 480_000)).toEqual({ status: 'match', quantityAffectedGrams: null });
  });

  it('an order with no listed grade has nothing to compare (not shown as a match)', () => {
    expect(gradeVerificationOf(undefined, 'GRADE_2', 480_000)).toEqual({ status: 'noListedGrade', quantityAffectedGrams: null });
  });

  it('an unknown received weight stays unknown (null), never 0', () => {
    expect(gradeVerificationOf('GRADE_1', 'REJECT', null)).toEqual({ status: 'mismatch', quantityAffectedGrams: null });
  });
});

// ─── M2-12A Receipt Preview: View Batch, not Assign Batch ────────────────────

const BATCH: BatchDto = { id: BATCH_ID, batchCode: 'BATCH-2026-000123' } as BatchDto;

describe('M2-12A the batch a receipt was stocked as', () => {
  it('BR-106: a receipt row carries the batch id and code the API returns', () => {
    const r = toReceivingRecord(receipt({ status: 'ACCEPTED', batchId: BATCH_ID, batchCode: 'BATCH-2026-000123' }), { now: NOW });
    expect(r.batchId).toBe(BATCH_ID);
    expect(r.batchCode).toBe('BATCH-2026-000123');
  });

  it('BR-106: a receipt with no batch (null) has none to view', () => {
    const r = toReceivingRecord(receipt({ status: 'REJECTED', batchId: null, batchCode: null }), { now: NOW });
    expect(r.batchId).toBeUndefined();
    expect(r.batchCode).toBeUndefined();
  });

  it('BR-106: after submit, the batch is the one the quality check returned', () => {
    const qc = { qualityCheck: {} as never, batch: BATCH } as QualityCheckResultDto;
    expect(receiptBatchOf(receipt({ status: 'ACCEPTED' }), qc)).toEqual({ id: BATCH_ID, code: 'BATCH-2026-000123' });
  });

  it('BR-106: when the check answer was lost, the re-read receipt names the batch', () => {
    expect(receiptBatchOf(receipt({ status: 'ACCEPTED', batchId: BATCH_ID, batchCode: 'BATCH-2026-000123' }), null)).toEqual({
      id: BATCH_ID,
      code: 'BATCH-2026-000123',
    });
  });

  it('no batch from either: nothing to view (the action is hidden, never offered as "assign")', () => {
    expect(receiptBatchOf(receipt(), null)).toBeNull();
    expect(receiptBatchOf(receipt({ status: 'REJECTED' }), { qualityCheck: {} as never, batch: null })).toBeNull();
  });
});

// ─── Wiring (source checks) ──────────────────────────────────────────────────

const SRC = path.resolve(__dirname, '..');
const read = (rel: string) => fs.readFileSync(path.join(SRC, rel), 'utf8');
const code = (rel: string) =>
  read(rel)
    .split(/\r?\n/)
    .filter((l) => !/^\s*(\/\/|\*|\/\*|\{\/\*)/.test(l))
    .join('\n');

describe('receiving batch 2 wiring', () => {
  it('M2-03: the SearchFilters route renders the filters screen (it used to fall back to the shipment list)', () => {
    const flow = code('screens/warehouse/receiving-qc/ReceivingFlow.tsx');
    expect(flow).toMatch(/case 'SearchFilters':\s*return \(\s*<ReceivingSearchFiltersScreen/);
    expect(flow).toContain('onOpenFilters=');
  });

  it('M2-03: the filters screen draws no facet the endpoints cannot apply', () => {
    const screen = code('screens/warehouse/receiving-qc/ReceivingSearchFiltersScreen.tsx');
    for (const gone of ['SearchBar', 'TextInput', 'DATE_OPTIONS', 'TYPE_OPTIONS', 'STATUS_OPTIONS', 'GRADE_OPTIONS', 'SOURCE_OPTIONS']) {
      expect(screen, gone).not.toContain(gone);
    }
  });

  it('M2-12A: the Main shell opens the real batch detail from receiving (InventoryFlow M3S05)', () => {
    const shell = code('screens/dashboard/MainWarehouseAdminDashboardScreen.tsx');
    expect(shell).toMatch(/inventory_batch_detail:\s*'M3S05'/);
    expect(shell).toContain('onViewBatch={openReceivingBatch}');
  });

  it('M2-12A: no receiving screen offers to assign a batch after the receipt', () => {
    for (const f of ['GoodsReceivingWizardScreen.tsx', 'ReceivingHistoryDetailScreen.tsx']) {
      expect(code(`screens/warehouse/receiving-qc/${f}`), f).not.toMatch(/'Assign Batch'|>Assign Batch</);
    }
  });
});
