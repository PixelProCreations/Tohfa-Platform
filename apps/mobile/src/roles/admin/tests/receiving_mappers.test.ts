/**
 * screens/warehouse/receiving-qc/mappers.ts and ./receivingViews.ts: API rows
 * -> the receiving screens' live types, the request bodies, and the figures
 * the dashboards derive. Weights are integer grams end to end; anything the
 * API does not carry stays null / undefined so the screen hides it.
 */
import { describe, expect, it } from 'vitest';
import { ApiError, NetworkError } from '../../../shell/api/client';
import type {
  GoodsReceiptDetailDto,
  GoodsReceiptDiscrepancyDto,
  GoodsReceiptDocumentDto,
  GoodsReceiptDto,
  PurchaseOrderDetailDto,
  PurchaseOrderDto,
} from '../api/receiving';
import type { StorageLocationDto } from '../api/warehouses';
import type { WarehouseTransferDto } from '../api/warehouseTransfers';
import { t } from '../i18n';
import {
  EMPTY_LIVE_FILTERS,
  HISTORY_RESULT_STATUS,
  activeFilterCount,
  buildCounterOfferBody,
  buildGoodsReceiptBody,
  buildQualityCheckBody,
  createReceivingKeyRing,
  gradeLabel,
  intakeFilterParams,
  isOutcomeUnknown,
  isReceivable,
  kgLabel,
  matchesShipmentTab,
  pendingReceiptOf,
  qcDraftProblem,
  qcPendingIssues,
  qualityOutcomeOf,
  receiptResultOf,
  receivingWarehouseFilter,
  shipmentStatusOf,
  toDiscrepancy,
  toLiveReceipt,
  toPurchaseOrderShipment,
  toReceiptDetail,
  toStorageOption,
  toTransferShipment,
  warehouseNameFor,
  type QcDraft,
} from '../screens/warehouse/receiving-qc/mappers';
import {
  deriveDiscrepancies,
  gradeVerificationOf,
  pendingQueueOf,
  quantityDetailOf,
  receiptDocumentRows,
  receivingOverviewOf,
  shipmentTimelineOf,
} from '../screens/warehouse/receiving-qc/receivingViews';

const WH = '11111111-1111-4111-8111-111111111111';
const WH2 = '12121212-1212-4121-8121-121212121212';
const PO_ID = '22222222-2222-4222-8222-222222222222';
const GR_OLD = '33333333-3333-4333-8333-333333333333';
const GR_NEW = '44444444-4444-4444-8444-444444444444';
const NOW = new Date('2026-10-12T06:30:00Z'); // 12:00 IST, 12 Oct
const NAMING = { warehouseNames: new Map([[WH, 'Coonoor'], [WH2, 'Ooty']]) };

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
  expectedDeliveryDate: '2026-10-12',
  issuedAt: '2026-10-11T04:00:00Z',
  cropName: 'Tomato',
  farmerName: 'Murugan K',
};

function receipt(overrides: Partial<GoodsReceiptDto> = {}): GoodsReceiptDto {
  return {
    id: GR_OLD,
    grnNumber: 'GRN-2026-000101',
    purchaseOrderId: PO_ID,
    warehouseId: WH,
    grossQtyKg: '250.000',
    acceptedQtyKg: '0.000',
    rejectedQtyKg: '0.000',
    status: 'AWAITING_QC',
    receivedAt: '2026-10-12T05:00:00Z',
    ...overrides,
  };
}

function draft(overrides: Partial<QcDraft> = {}): QcDraft {
  return {
    assignedGrade: 'GRADE_1',
    grossGrams: 250_000,
    acceptedGrams: 250_000,
    points: {
      appearance: { result: 'pass' },
      size: { result: 'pass' },
      moisture: { result: 'pass' },
      damage: { result: 'pass' },
      freshness: { result: 'pass' },
    },
    moisturePct: '',
    visualScore: '',
    defectNotes: '',
    ...overrides,
  };
}

// ─── Scope ───────────────────────────────────────────────────────────────────

describe('BR-30: receivingWarehouseFilter', () => {
  it('pins a Sub scope to its own warehouse uuid, whatever was selected', () => {
    expect(receivingWarehouseFilter({ warehouseId: WH, warehouseName: 'Coonoor' }, WH2)).toBe(WH);
  });
  it('Main sends its pick, or nothing for every warehouse', () => {
    expect(receivingWarehouseFilter({}, WH2)).toBe(WH2);
    expect(receivingWarehouseFilter({}, undefined)).toBeUndefined();
  });
  it('names a warehouse from the scope, else the live list, else not at all', () => {
    expect(warehouseNameFor(WH, { warehouseName: 'Own' })).toBe('Own');
    expect(warehouseNameFor(WH2, NAMING)).toBe('Ooty');
    expect(warehouseNameFor('other', NAMING)).toBeUndefined();
  });
});

// ─── Statuses ────────────────────────────────────────────────────────────────

describe('shipmentStatusOf', () => {
  it('maps every purchase-order status when no receipts are known', () => {
    expect(shipmentStatusOf(PO)).toBe('Expected');
    expect(shipmentStatusOf({ ...PO, status: 'PARTIALLY_RECEIVED' })).toBe('Receiving');
    expect(shipmentStatusOf({ ...PO, status: 'RECEIVED' })).toBe('Completed');
    expect(shipmentStatusOf({ ...PO, status: 'CANCELLED' })).toBe('Cancelled');
    expect(shipmentStatusOf({ ...PO, status: 'CLOSED' as never })).toBe('Unknown');
  });

  it('a receipt awaiting QC wins, so the admin resumes it instead of receiving again', () => {
    expect(shipmentStatusOf(PO, [receipt()])).toBe('Awaiting QC');
  });

  it('derives progress from the receipts (gross against ordered)', () => {
    expect(shipmentStatusOf(PO, [])).toBe('Expected');
    expect(shipmentStatusOf(PO, [receipt({ status: 'ACCEPTED' })])).toBe('Receiving');
    expect(
      shipmentStatusOf(PO, [receipt({ status: 'ACCEPTED', grossQtyKg: '400.000' }), receipt({ id: GR_NEW, status: 'PARTIALLY_ACCEPTED' })]),
    ).toBe('Completed');
  });

  it('an order whose every receipt was rejected is Rejected', () => {
    expect(shipmentStatusOf(PO, [receipt({ status: 'REJECTED' })])).toBe('Rejected');
  });

  it('a cancelled order stays cancelled whatever its receipts say', () => {
    expect(shipmentStatusOf({ ...PO, status: 'CANCELLED' }, [receipt()])).toBe('Cancelled');
  });

  it('only Expected and part-received orders can start a new receipt', () => {
    expect(isReceivable('Expected')).toBe(true);
    expect(isReceivable('Receiving')).toBe(true);
    for (const s of ['Awaiting QC', 'Completed', 'Rejected', 'Cancelled', 'Unknown'] as const) expect(isReceivable(s)).toBe(false);
  });

  it('maps the list pills; there is no arrival status, so Arrived means recorded and awaiting QC', () => {
    expect(matchesShipmentTab('Expected', 'Expected')).toBe(true);
    expect(matchesShipmentTab('Awaiting QC', 'Arrived')).toBe(true);
    expect(matchesShipmentTab('Expected', 'Arrived')).toBe(false);
    expect(matchesShipmentTab('Awaiting QC', 'QC Pending')).toBe(true);
    expect(matchesShipmentTab('Receiving', 'Receiving')).toBe(true);
    expect(matchesShipmentTab('Awaiting QC', 'Receiving')).toBe(true);
    expect(matchesShipmentTab('Completed', 'Completed')).toBe(true);
    expect(matchesShipmentTab('Rejected', 'Rejected')).toBe(true);
    expect(matchesShipmentTab('Cancelled', 'All')).toBe(true);
  });
});

describe('receiptResultOf', () => {
  it('maps every goods-receipt status, with a fallback', () => {
    expect(receiptResultOf('AWAITING_QC')).toBe('Awaiting QC');
    expect(receiptResultOf('ACCEPTED')).toBe('Accepted');
    expect(receiptResultOf('PARTIALLY_ACCEPTED')).toBe('Partially Accepted');
    expect(receiptResultOf('REJECTED')).toBe('Rejected');
    expect(receiptResultOf('COUNTER_OFFERED')).toBe('Counter-Offered');
    expect(receiptResultOf('NEW_THING')).toBe('Unknown');
  });
});

// ─── Rows ────────────────────────────────────────────────────────────────────

describe('toPurchaseOrderShipment (BR-119: cropName on the order)', () => {
  it('a list row carries the crop, farmer, warehouse and exact grams', () => {
    const s = toPurchaseOrderShipment(PO, { ...NAMING });
    expect(s).toMatchObject({
      kind: 'purchaseOrder',
      id: PO_ID,
      code: 'PO-2026-000031',
      type: 'Farmer/Admin',
      status: 'Expected',
      produce: 'Tomato',
      cropName: 'Tomato',
      from: 'Murugan K',
      to: 'Coonoor',
      grade: t('inventory.grade.GRADE_1'),
      apiGrade: 'GRADE_1',
      expectedGrams: 650_000,
      receivedGrams: null,
      acceptedGrams: null,
      expectedDeliveryDate: '2026-10-12',
    });
  });

  it('never "Unnamed crop": a missing crop name falls back to a label naming the order', () => {
    const s = toPurchaseOrderShipment({ ...PO, cropName: null }, NAMING);
    expect(s.cropName).toBeUndefined();
    expect(s.produce).toBe(t('receiving.crop.ofOrder', { ref: 'PO-2026-000031' }));
  });

  it('with receipts: sums received / accepted / rejected, the pending receipt, first arrival and packages', () => {
    const detail: PurchaseOrderDetailDto = {
      ...PO,
      tohfaFarmerId: 'TF-0042',
      goodsReceipts: [
        receipt({ id: GR_OLD, status: 'PARTIALLY_ACCEPTED', acceptedQtyKg: '240.000', rejectedQtyKg: '10.000', receivedAt: '2026-10-12T05:00:00Z' }),
        receipt({ id: GR_NEW, grossQtyKg: '100.500', receivedAt: '2026-10-12T06:00:00Z', packageCount: 4, packageUnit: 'CRATE' }),
      ],
    };
    const s = toPurchaseOrderShipment(detail, { ...NAMING, receipts: detail.goodsReceipts });
    expect(s.status).toBe('Awaiting QC');
    expect(s.receivedGrams).toBe(350_500);
    expect(s.acceptedGrams).toBe(240_000);
    expect(s.rejectedGrams).toBe(10_000);
    expect(s.pendingReceiptId).toBe(GR_NEW);
    expect(s.firstReceivedAt).toBe('2026-10-12T05:00:00Z');
    expect(s.packages).toMatchObject({ count: 4, unit: 'CRATE' });
    expect(s.farmerCode).toBe('TF-0042');
  });

  it('a quantity that is not an API Quantity stays unknown (null), never 0', () => {
    expect(toPurchaseOrderShipment({ ...PO, quantityKg: 'lots' }, NAMING).expectedGrams).toBeNull();
  });
});

describe('toTransferShipment', () => {
  const transfer: WarehouseTransferDto = {
    id: 'tr-1',
    transferNumber: 'TRF-000284',
    fromWarehouseId: WH2,
    toWarehouseId: WH,
    status: 'IN_TRANSIT',
    totalValue: '0.00' as never,
    hasUnvaluedLines: false,
    requiresApproval: false,
    hasDiscrepancy: false,
    vehicleNumber: null,
    notes: null,
    receiptNote: null,
    cancelReason: null,
    initiatedBy: 'u-1',
    approvedBy: null,
    approvedAt: null,
    dispatchedAt: '2026-10-11T04:00:00Z',
    receivedBy: null,
    receivedAt: null,
    cancelledBy: null,
    cancelledAt: null,
    createdAt: '2026-10-10T04:00:00Z',
    updatedAt: null,
  };

  it('an inbound transfer in transit is an Expected inter-warehouse shipment; the header carries no lines', () => {
    expect(toTransferShipment(transfer, NAMING)).toMatchObject({
      kind: 'transfer',
      id: 'tr-1',
      code: 'TRF-000284',
      type: 'Inter-Warehouse Transfer',
      status: 'Expected',
      from: 'Ooty',
      to: 'Coonoor',
      warehouseId: WH,
      produce: '',
      expectedGrams: null,
    });
    expect(toTransferShipment({ ...transfer, status: 'RECEIVED' }, NAMING).status).toBe('Completed');
    expect(toTransferShipment({ ...transfer, status: 'CANCELLED' }, NAMING).status).toBe('Cancelled');
  });
});

describe('toLiveReceipt (BR-119: receivedByName, cropName)', () => {
  it('maps a checked receipt', () => {
    const r = toLiveReceipt(
      receipt({
        status: 'PARTIALLY_ACCEPTED',
        acceptedQtyKg: '240.000',
        rejectedQtyKg: '10.000',
        poNumber: 'PO-2026-000031',
        cropName: 'Tomato',
        grade: 'GRADE_2',
        receivedByName: 'Suresh R',
        batchId: 'b-1',
        batchCode: 'BATCH-2026-000123',
        vehicleNumber: 'TN43AB1234',
      }),
      { ...NAMING, now: NOW },
    );
    expect(r).toMatchObject({
      id: GR_OLD,
      receiptId: 'GRN-2026-000101',
      shipmentId: 'PO-2026-000031',
      warehouseName: 'Coonoor',
      result: 'Partially Accepted',
      product: 'Tomato',
      grade: t('inventory.grade.GRADE_2'),
      receivedGrams: 250_000,
      acceptedGrams: 240_000,
      rejectedGrams: 10_000,
      receivedBy: 'Suresh R',
      batchId: 'b-1',
      batchCode: 'BATCH-2026-000123',
      vehicleNumber: 'TN43AB1234',
      day: '12 Oct 2026',
    });
  });

  it('before the QC the accepted / rejected figures are unknown, not 0', () => {
    const r = toLiveReceipt(receipt(), { now: NOW });
    expect(r.acceptedGrams).toBeNull();
    expect(r.rejectedGrams).toBeNull();
  });

  it('a receipt with no receiver name hides it instead of showing the uuid', () => {
    expect(toLiveReceipt(receipt({ receivedBy: 'uuid-1', receivedByName: null }), { now: NOW }).receivedBy).toBeUndefined();
  });
});

describe('toReceiptDetail (BR-120: the quality-check block)', () => {
  const detail: GoodsReceiptDetailDto = {
    ...receipt({ status: 'PARTIALLY_ACCEPTED', acceptedQtyKg: '220.000', rejectedQtyKg: '30.000' }),
    qualityCheck: {
      id: 'qc-1',
      goodsReceiptId: GR_OLD,
      assignedGrade: 'GRADE_2',
      listedGrade: 'GRADE_1',
      outcome: 'PARTIALLY_ACCEPTED',
      acceptedQtyKg: '220.000',
      rejectedQtyKg: '30.000',
      damagedQtyKg: '12.000',
      spoiledQtyKg: '8.000',
      rejectionReasonCode: 'PHYSICAL_DAMAGE',
      actualCropId: null,
      actualCropName: null,
      cropMismatchQtyKg: null,
      checkedByName: 'Anitha',
      checkedAt: '2026-10-12T05:30:00Z',
      moisturePct: 12.4,
      visualScore: 7,
      defectNotes: 'Bruising',
      items: [
        { parameter: 'FRESHNESS', passed: true, condition: 'GOOD', score: 8 },
        { parameter: 'APPEARANCE', passed: true, condition: 'EXCELLENT' },
        { parameter: 'SIZE_UNIFORMITY', passed: true },
        { parameter: 'MOISTURE', passed: true, measuredValue: '12.400', condition: 'FAIR' },
        { parameter: 'DAMAGE_PEST', passed: false, condition: 'POOR', remarks: 'Top layer bruised' },
      ],
    },
  };

  it('maps the check with its inspector, grades, breakdown and the five points in checklist order', () => {
    const d = toReceiptDetail(detail, { now: NOW });
    const qc = d.qualityCheck;
    expect(qc).not.toBeNull();
    expect(qc).toMatchObject({
      outcome: 'PARTIALLY_ACCEPTED',
      assignedGrade: t('inventory.grade.GRADE_2'),
      listedGrade: t('inventory.grade.GRADE_1'),
      checkedBy: 'Anitha',
      passedPoints: 4,
      damagedGrams: 12_000,
      spoiledGrams: 8_000,
      rejectionReasonCode: 'PHYSICAL_DAMAGE',
      cropMismatchGrams: null,
      moisturePct: 12.4,
      visualScore: 7,
    });
    expect(qc?.rejectionReasonLabel).toBe(t('receiving.rejectionReason.PHYSICAL_DAMAGE'));
    expect(qc?.points.map((p) => p.criterionId)).toEqual(['appearance', 'size', 'moisture', 'damage', 'freshness']);
    expect(qc?.points[3]).toMatchObject({ result: 'fail', condition: 'POOR', remarks: 'Top layer bruised' });
    expect(qc?.points[2]?.conditionLabel).toBe(t('receiving.condition.FAIR'));
  });

  it('a receipt not yet checked has a null quality check', () => {
    expect(toReceiptDetail({ ...receipt(), qualityCheck: null }, { now: NOW }).qualityCheck).toBeNull();
  });
});

describe('toDiscrepancy (BR-121)', () => {
  it('maps a persisted report with its creator and time', () => {
    const dto: GoodsReceiptDiscrepancyDto = {
      id: 'd-1',
      goodsReceiptId: GR_OLD,
      warehouseId: WH,
      type: 'QUANTITY',
      expected: '500 KG',
      actual: '480 KG',
      status: 'OPEN',
      note: null,
      createdBy: 'u-1',
      createdByName: 'Suresh',
      createdAt: '2026-10-12T04:55:00Z',
    };
    expect(toDiscrepancy(dto, NOW)).toMatchObject({
      id: 'd-1',
      type: 'QUANTITY',
      typeLabel: t('receiving.discrepancyType.QUANTITY'),
      statusLabel: t('receiving.discrepancyStatus.OPEN'),
      createdBy: 'Suresh',
      note: undefined,
    });
  });
});

describe('qcPendingIssues', () => {
  it('turns receipts awaiting QC into QC Pending issues', () => {
    const records = [toLiveReceipt(receipt({ poNumber: 'PO-1', cropName: 'Beans' }), { now: NOW }), toLiveReceipt(receipt({ id: GR_NEW, status: 'ACCEPTED' }), { now: NOW })];
    const issues = qcPendingIssues(records);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ id: GR_OLD, kind: 'QC Pending', shipmentCode: 'PO-1', receiptCode: 'GRN-2026-000101', produce: 'Beans' });
  });
});

describe('toStorageOption', () => {
  it('sends the code and shows the name, type and capacity', () => {
    const loc: StorageLocationDto = {
      id: 'l-1',
      warehouseId: WH,
      code: 'CS-A01',
      name: 'Cold Storage A',
      locationType: 'Cold Storage',
      capacityKg: '2000.000',
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: null,
    };
    expect(toStorageOption(loc)).toEqual({ id: 'l-1', code: 'CS-A01', label: 'Cold Storage A', zone: 'Cold Storage', capacityGrams: 2_000_000 });
    expect(toStorageOption({ ...loc, capacityKg: null, locationType: null }).capacityGrams).toBeNull();
  });
});

describe('labels', () => {
  it('grades and kg read as the screens already show them', () => {
    expect(gradeLabel(undefined)).toBe('');
    expect(gradeLabel('REJECT')).toBe(t('inventory.grade.REJECT'));
    expect(kgLabel(480_000)).toBe('480 KG');
    expect(kgLabel(12_350)).toBe('12.35 KG');
  });
});

// ─── Filters (BR-122) ────────────────────────────────────────────────────────

describe('intakeFilterParams', () => {
  it('nothing set sends nothing', () => {
    expect(intakeFilterParams(EMPTY_LIVE_FILTERS, NOW)).toEqual({});
  });
  it('search is trimmed and capped at 100 characters', () => {
    expect(intakeFilterParams({ ...EMPTY_LIVE_FILTERS, search: '  tomato ' }, NOW)).toEqual({ q: 'tomato' });
    expect(intakeFilterParams({ ...EMPTY_LIVE_FILTERS, search: 'x'.repeat(120) }, NOW).q).toHaveLength(100);
  });
  it('Today and Last 7 Days are IST days', () => {
    expect(intakeFilterParams({ ...EMPTY_LIVE_FILTERS, date: 'Today' }, NOW)).toEqual({ from: '2026-10-12', to: '2026-10-12' });
    expect(intakeFilterParams({ ...EMPTY_LIVE_FILTERS, date: 'Last 7 Days' }, NOW)).toEqual({ from: '2026-10-06', to: '2026-10-12' });
    // 00:30 IST on the 13th is already the 13th, though UTC still says the 12th
    expect(intakeFilterParams({ ...EMPTY_LIVE_FILTERS, date: 'Today' }, new Date('2026-10-12T19:00:00Z'))).toEqual({ from: '2026-10-13', to: '2026-10-13' });
  });
  it('Custom sends the typed days only when they are real dates in order', () => {
    expect(intakeFilterParams({ ...EMPTY_LIVE_FILTERS, date: 'Custom', customFrom: '2026-10-01', customTo: '2026-10-05' }, NOW)).toEqual({
      from: '2026-10-01',
      to: '2026-10-05',
    });
    expect(intakeFilterParams({ ...EMPTY_LIVE_FILTERS, date: 'Custom', customFrom: '2026-10-05', customTo: '2026-10-01' }, NOW)).toEqual({});
    expect(intakeFilterParams({ ...EMPTY_LIVE_FILTERS, date: 'Custom', customFrom: '2026-02-30' }, NOW)).toEqual({});
  });
  it('counts the facets that narrow a list and maps the result pill to a receipt status', () => {
    expect(activeFilterCount(EMPTY_LIVE_FILTERS)).toBe(0);
    expect(activeFilterCount({ ...EMPTY_LIVE_FILTERS, search: 'x', date: 'Today', warehouseId: WH, shipmentType: 'Farmer/Admin', result: 'Partial' })).toBe(5);
    expect(HISTORY_RESULT_STATUS.Partial).toBe('PARTIALLY_ACCEPTED');
    expect(HISTORY_RESULT_STATUS.All).toBeUndefined();
  });
});

// ─── Bodies ──────────────────────────────────────────────────────────────────

describe('buildGoodsReceiptBody (BR-123)', () => {
  it('writes the gross from grams; vehicle and packages only when given, packages as a pair', () => {
    expect(buildGoodsReceiptBody({ purchaseOrderId: PO_ID, warehouseId: WH, grossGrams: 480_250 })).toEqual({
      purchaseOrderId: PO_ID,
      warehouseId: WH,
      grossQtyKg: '480.250',
    });
    expect(
      buildGoodsReceiptBody({ purchaseOrderId: PO_ID, warehouseId: WH, grossGrams: 1, vehicleNumber: ' TN43 ', packageCount: 20, packageUnit: 'CRATE' }),
    ).toEqual({ purchaseOrderId: PO_ID, warehouseId: WH, grossQtyKg: '0.001', vehicleNumber: 'TN43', packageCount: 20, packageUnit: 'CRATE' });
    expect(buildGoodsReceiptBody({ purchaseOrderId: PO_ID, warehouseId: WH, grossGrams: 1, packageCount: 20 })).not.toHaveProperty('packageCount');
    expect(buildGoodsReceiptBody({ purchaseOrderId: PO_ID, warehouseId: WH, grossGrams: 1, packageCount: 0, packageUnit: 'BAG' })).not.toHaveProperty('packageUnit');
  });
});

describe('qualityOutcomeOf / buildQualityCheckBody (BR-106, BR-120)', () => {
  it('derives the outcome from the split', () => {
    expect(qualityOutcomeOf(10, 0)).toBe('ACCEPTED');
    expect(qualityOutcomeOf(5, 5)).toBe('PARTIALLY_ACCEPTED');
    expect(qualityOutcomeOf(0, 10)).toBe('REJECTED');
  });

  it('writes kg strings from grams, rejected = gross - accepted, and the five points in order', () => {
    const body = buildQualityCheckBody(draft({ acceptedGrams: 220_000, defectNotes: 'Bruised' }));
    expect(body).toMatchObject({ assignedGrade: 'GRADE_1', outcome: 'PARTIALLY_ACCEPTED', acceptedQtyKg: '220.000', rejectedQtyKg: '30.000' });
    expect(body.items.map((i) => i.parameter)).toEqual(['APPEARANCE', 'SIZE_UNIFORMITY', 'MOISTURE', 'DAMAGE_PEST', 'FRESHNESS']);
  });

  it('a point passes only when it passed: "needs attention" is not a pass', () => {
    const body = buildQualityCheckBody(
      draft({ points: { ...draft().points, damage: { result: 'attention', condition: 'FAIR', remarks: ' light ' }, size: { result: 'fail' } } }),
    );
    expect(body.items.find((i) => i.parameter === 'DAMAGE_PEST')).toEqual({ parameter: 'DAMAGE_PEST', passed: false, condition: 'FAIR', remarks: 'light' });
    expect(body.items.find((i) => i.parameter === 'SIZE_UNIFORMITY')?.passed).toBe(false);
  });

  it('sends the breakdown, reason code and storage location only when given', () => {
    const plain = buildQualityCheckBody(draft());
    for (const k of ['damagedQtyKg', 'spoiledQtyKg', 'rejectionReasonCode', 'storageLocation', 'moisturePct', 'visualScore', 'defectNotes']) {
      expect(plain).not.toHaveProperty(k);
    }
    const full = buildQualityCheckBody(
      draft({
        acceptedGrams: 220_000,
        damagedGrams: 12_000,
        spoiledGrams: 8_000,
        rejectionReasonCode: 'PHYSICAL_DAMAGE',
        storageLocationCode: 'CS-A01',
        moisturePct: '12.4',
        visualScore: '7',
      }),
    );
    expect(full).toMatchObject({
      damagedQtyKg: '12.000',
      spoiledQtyKg: '8.000',
      rejectionReasonCode: 'PHYSICAL_DAMAGE',
      storageLocation: 'CS-A01',
      moisturePct: 12.4,
      visualScore: 7,
    });
  });

  it('drops a reason code when nothing is rejected (the server needs a non-zero rejection for it)', () => {
    expect(buildQualityCheckBody(draft({ rejectionReasonCode: 'BELOW_GRADE' }))).not.toHaveProperty('rejectionReasonCode');
  });

  it('throws on a draft with a problem instead of sending it', () => {
    expect(() => buildQualityCheckBody(draft({ acceptedGrams: 300_000 }))).toThrow(RangeError);
  });
});

describe('qcDraftProblem', () => {
  it('flags quantities outside the gross', () => {
    expect(qcDraftProblem(draft({ acceptedGrams: 250_001 }))).toBe('quantities');
    expect(qcDraftProblem(draft({ grossGrams: null }))).toBe('quantities');
  });
  it('flags a breakdown above the rejected quantity', () => {
    expect(qcDraftProblem(draft({ acceptedGrams: 240_000, damagedGrams: 6_000, spoiledGrams: 5_000, defectNotes: 'x' }))).toBe('breakdown');
  });
  it('flags moisture and visual score out of range', () => {
    expect(qcDraftProblem(draft({ moisturePct: '101' }))).toBe('moisture');
    expect(qcDraftProblem(draft({ visualScore: '7.5' }))).toBe('visualScore');
  });
  it('a rejection needs a reason code, a note or defect notes', () => {
    expect(qcDraftProblem(draft({ acceptedGrams: 200_000 }))).toBe('rejectionReasonRequired');
    expect(qcDraftProblem(draft({ acceptedGrams: 200_000, rejectionReasonCode: 'SPOILAGE' }))).toBeNull();
    expect(qcDraftProblem(draft({ acceptedGrams: 200_000, defectNotes: 'Bruised' }))).toBeNull();
  });
});

describe('buildCounterOfferBody', () => {
  it('sends the price as Money and the quantity as kg from grams; refuses a bad price or quantity', () => {
    expect(buildCounterOfferBody({ priceInput: '42.5', quantityGrams: 220_000, message: ' grade 2 ' })).toEqual({
      pricePerKg: '42.50',
      quantityKg: '220.000',
      message: 'grade 2',
    });
    expect(buildCounterOfferBody({ priceInput: '0', quantityGrams: 1, message: '' })).toBeNull();
    expect(buildCounterOfferBody({ priceInput: '4.555', quantityGrams: 1, message: '' })).toBeNull();
    expect(buildCounterOfferBody({ priceInput: '4', quantityGrams: 0, message: '' })).toBeNull();
  });
});

describe('createReceivingKeyRing (BR-118: a retry replays, a changed body is a new request)', () => {
  function ring() {
    let n = 0;
    return createReceivingKeyRing(() => `key-${(n += 1)}`);
  }
  const create = { purchaseOrderId: PO_ID, warehouseId: WH, grossQtyKg: '250.000' };

  it('reuses a key for the same body, in any key order; a changed body gets a new key', () => {
    const keys = ring();
    const first = keys.createKey(create);
    expect(keys.createKey({ grossQtyKg: '250.000', warehouseId: WH, purchaseOrderId: PO_ID })).toBe(first);
    expect(keys.createKey({ ...create, grossQtyKg: '251.000' })).not.toBe(first);
  });

  it('every discrepancy body keeps its own key, so persisting several replays each one exactly', () => {
    const keys = ring();
    const a = { type: 'QUANTITY' as const, expected: '500 KG', actual: '480 KG' };
    const b = { type: 'QUALITY' as const, expected: 'Grade 1', actual: 'Grade 2' };
    const ka = keys.discrepancyKey(GR_OLD, a);
    const kb = keys.discrepancyKey(GR_OLD, b);
    expect(ka).not.toBe(kb);
    expect(keys.discrepancyKey(GR_OLD, a)).toBe(ka);
    expect(keys.discrepancyKey(GR_NEW, a)).not.toBe(ka);
  });

  it('create, QC, counter-offer and discrepancy never share a key', () => {
    const keys = ring();
    const all = [
      keys.createKey(create),
      keys.qcKey(GR_OLD, buildQualityCheckBody(draft())),
      keys.counterKey(GR_OLD, { pricePerKg: '1.00' as never, quantityKg: '1.000' }),
      keys.discrepancyKey(GR_OLD, { type: 'OTHER', expected: 'a', actual: 'b' }),
    ];
    expect(new Set(all).size).toBe(4);
  });
});

describe('isOutcomeUnknown', () => {
  it('a network failure or a 5xx may have been written; a 4xx was not', () => {
    expect(isOutcomeUnknown(new NetworkError(new Error('x')))).toBe(true);
    expect(isOutcomeUnknown(new ApiError({ type: 'about:blank', title: 'x', status: 502, code: 'INTERNAL' as never }))).toBe(true);
    expect(isOutcomeUnknown(new ApiError({ type: 'about:blank', title: 'x', status: 422, code: 'VALIDATION_FAILED' as never }))).toBe(false);
    expect(isOutcomeUnknown(new Error('x'))).toBe(false);
  });
});

describe('pendingReceiptOf', () => {
  it('picks the newest receipt still awaiting QC', () => {
    expect(
      pendingReceiptOf([
        receipt({ id: 'a', receivedAt: '2026-10-12T01:00:00Z' }),
        receipt({ id: 'b', receivedAt: '2026-10-12T02:00:00Z' }),
        receipt({ id: 'c', status: 'ACCEPTED', receivedAt: '2026-10-12T03:00:00Z' }),
      ])?.id,
    ).toBe('b');
    expect(pendingReceiptOf([])).toBeUndefined();
  });
});

// ─── Views ───────────────────────────────────────────────────────────────────

describe('receivingOverviewOf (M2-01)', () => {
  it('counts each tile from what it names, today by the IST day', () => {
    const shipments = [
      toPurchaseOrderShipment(PO, NAMING), // expected today, nothing received
      toPurchaseOrderShipment({ ...PO, id: 'p2', expectedDeliveryDate: '2026-10-13' }, NAMING),
      toPurchaseOrderShipment({ ...PO, id: 'p3' }, { ...NAMING, receipts: [receipt({ purchaseOrderId: 'p3', status: 'ACCEPTED' })] }),
    ];
    const records = [
      toLiveReceipt(receipt(), { now: NOW }),
      toLiveReceipt(receipt({ id: 'r2', status: 'PARTIALLY_ACCEPTED' }), { now: NOW }),
      toLiveReceipt(receipt({ id: 'r3', status: 'ACCEPTED', receivedAt: '2026-10-10T05:00:00Z' }), { now: NOW }),
    ];
    expect(receivingOverviewOf(shipments, records, NOW)).toEqual({
      expectedToday: 1,
      awaitingReceiving: 2,
      inProgress: 1,
      awaitingQc: 1,
      partiallyAccepted: 1,
      receivedToday: 2,
      completedToday: 1,
      issues: 1,
    });
  });
});

describe('pendingQueueOf', () => {
  it('groups the open orders: awaiting QC, part-received, nothing received', () => {
    const shipments = [
      toPurchaseOrderShipment(PO, NAMING),
      toPurchaseOrderShipment({ ...PO, id: 'q' }, { receipts: [receipt({ purchaseOrderId: 'q' })] }),
      toPurchaseOrderShipment({ ...PO, id: 'c', status: 'RECEIVED' }, NAMING),
    ];
    const groups = pendingQueueOf(shipments);
    expect(groups.map((g) => [g.group, g.shipments.length])).toEqual([
      ['awaitingQc', 1],
      ['partlyReceived', 0],
      ['notYetReceived', 1],
    ]);
  });
});

describe('quantityDetailOf / gradeVerificationOf', () => {
  it('Received - Expected, never typed', () => {
    expect(quantityDetailOf(500_000, 480_000)).toEqual({ status: 'Shortage', differenceGrams: -20_000, absGrams: 20_000 });
    expect(quantityDetailOf(500_000, 510_000).status).toBe('Excess');
    expect(quantityDetailOf(500_000, 500_000).status).toBe('Match');
    expect(quantityDetailOf(null, 1).status).toBeNull();
  });
  it('the assigned grade against the listed one', () => {
    expect(gradeVerificationOf('GRADE_1', 'GRADE_1', 480_000)).toEqual({ status: 'match', quantityAffectedGrams: null });
    expect(gradeVerificationOf('GRADE_1', 'GRADE_2', 480_000)).toEqual({ status: 'mismatch', quantityAffectedGrams: 480_000 });
    expect(gradeVerificationOf(undefined, 'GRADE_2', 1).status).toBe('noListedGrade');
  });
});

describe('deriveDiscrepancies (BR-121 bodies from what the admin recorded)', () => {
  it('a quantity variance, a grade mismatch and failed points each become one report', () => {
    const bodies = deriveDiscrepancies({
      product: 'Tomato',
      expectedGrams: 500_000,
      receivedGrams: 480_000,
      listedGrade: 'GRADE_1',
      assignedGrade: 'GRADE_2',
      failedPoints: ['damage'],
      damagedGrams: 30_000,
      spoiledGrams: null,
      note: ' crushed crates ',
    });
    expect(bodies).toEqual([
      { type: 'QUANTITY', expected: '500 KG', actual: '480 KG', note: 'crushed crates' },
      { type: 'QUALITY', expected: t('inventory.grade.GRADE_1'), actual: t('inventory.grade.GRADE_2'), note: 'crushed crates' },
      {
        type: 'DAMAGE',
        expected: t('receiving.discrepancy.expectedSound'),
        actual: t('receiving.discrepancy.damaged', { qty: '30 KG' }),
        note: 'crushed crates',
      },
    ]);
  });
  it('nothing to report when everything matches', () => {
    expect(
      deriveDiscrepancies({ product: 'x', expectedGrams: 1, receivedGrams: 1, listedGrade: 'GRADE_1', assignedGrade: 'GRADE_1', failedPoints: [], damagedGrams: null, spoiledGrams: null, note: '' }),
    ).toEqual([]);
  });
  it('failed points without a damaged weight still report the quality issue', () => {
    const [body] = deriveDiscrepancies({
      product: 'x',
      expectedGrams: null,
      receivedGrams: 1,
      listedGrade: undefined,
      assignedGrade: 'GRADE_1',
      failedPoints: ['freshness', 'moisture'],
      damagedGrams: null,
      spoiledGrams: null,
      note: '',
    });
    expect(body).toEqual({ type: 'QUALITY', expected: t('receiving.discrepancy.expectedPass'), actual: t('receiving.discrepancy.failedPoints', { count: 2 }) });
  });
});

describe('shipmentTimelineOf', () => {
  it('issued, then each receipt in time order; no invented stage times', () => {
    const records = [
      toLiveReceipt(receipt({ id: 'b', receivedAt: '2026-10-12T06:00:00Z' }), { now: NOW }),
      toLiveReceipt(receipt({ id: 'a', receivedAt: '2026-10-12T05:00:00Z' }), { now: NOW }),
    ];
    expect(shipmentTimelineOf('2026-10-11T04:00:00Z', records).map((e) => [e.kind, e.at])).toEqual([
      ['issued', '2026-10-11T04:00:00Z'],
      ['received', '2026-10-12T05:00:00Z'],
      ['received', '2026-10-12T06:00:00Z'],
    ]);
  });
});

describe('receiptDocumentRows (BR-124)', () => {
  it('the printable note, with no farm location or money field', () => {
    const doc: GoodsReceiptDocumentDto = {
      documentType: 'GOODS_RECEIPT_NOTE',
      goodsReceiptId: GR_OLD,
      grnNumber: 'GRN-2026-000101',
      status: 'ACCEPTED',
      purchaseOrder: { id: PO_ID, poNumber: 'PO-2026-000031' },
      warehouse: { id: WH, code: 'WH-COON', name: 'Coonoor' },
      farmer: { id: 'f', name: 'Murugan K' },
      crop: { id: 'c', name: 'Tomato' },
      grade: { listed: 'GRADE_1', assigned: 'GRADE_1' },
      quantities: { grossQtyKg: '250.000', acceptedQtyKg: '250.000', rejectedQtyKg: '0.000', damagedQtyKg: null, spoiledQtyKg: null },
      packages: { count: 10, unit: 'CRATE' },
      vehicleNumber: null,
      receivedBy: { id: 'u', name: 'Suresh' },
      receivedAt: '2026-10-12T05:00:00Z',
      batchCode: 'BATCH-2026-000123',
      qualityCheck: null,
      discrepancyCount: 0,
    };
    const rows = receiptDocumentRows(doc);
    const byKey = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    expect(byKey).toMatchObject({
      grn: 'GRN-2026-000101',
      purchaseOrder: 'PO-2026-000031',
      warehouse: 'Coonoor',
      farmer: 'Murugan K',
      crop: 'Tomato',
      gross: '250 KG',
      accepted: '250 KG',
      batch: 'BATCH-2026-000123',
      receivedBy: 'Suresh',
    });
    // unknown values are left out, never shown as blank or 0
    expect(byKey).not.toHaveProperty('vehicle');
    expect(byKey).not.toHaveProperty('damaged');
    expect(byKey).not.toHaveProperty('qualityPoints');
  });
});
