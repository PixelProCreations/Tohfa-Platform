/**
 * screens/warehouse/receiving-qc/mappers.ts and ./submission.ts: purchase
 * orders and goods receipts -> the receiving UI types, the quality-check body,
 * and the create-then-QC submission that resumes instead of re-creating.
 *
 * Quantities are integer grams end to end: the API's kg strings are read as
 * text (parseKgToGrams) and written back with gramsToKgString, so no float
 * ever touches a weight.
 *
 * Why the resume tests matter: the server ignores the Idempotency-Key on
 * POST /admin/goods-receipts and on the quality check (server gap), so a retry
 * after a timeout would record the same delivery twice. The submission keeps
 * the created receipt id, re-reads the purchase order's receipts after an
 * unknown outcome, and picks up a receipt that now exists.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, NetworkError } from '../../../shell/api/client';
import type {
  GoodsReceiptCreate,
  GoodsReceiptDto,
  PurchaseOrderDetailDto,
  PurchaseOrderDto,
  QualityCheckCreate,
  QualityCheckResultDto,
} from '../api/receiving';
import { t } from '../i18n';
import {
  buildCounterOfferBody,
  buildGoodsReceiptBody,
  buildQualityCheckBody,
  findCreatedReceipt,
  isOutcomeUnknown,
  pendingReceiptOf,
  qcDraftProblem,
  qcPendingIssues,
  qualityOutcomeOf,
  receiptQuantitiesValid,
  receiptResultOf,
  shipmentStatusOf,
  toIncomingShipment,
  toReceivingRecord,
  toStorageLocationOption,
  type QcDraft,
} from '../screens/warehouse/receiving-qc/mappers';
import { initialSubmissionState, submitReceiving, type SubmissionDeps } from '../screens/warehouse/receiving-qc/submission';

const WH = '11111111-1111-4111-8111-111111111111';
const PO_ID = '22222222-2222-4222-8222-222222222222';
const GR_OLD = '33333333-3333-4333-8333-333333333333';
const GR_NEW = '44444444-4444-4444-8444-444444444444';
const NOW = new Date('2026-10-12T06:30:00Z'); // 12:00 IST

const PO: PurchaseOrderDto = {
  id: PO_ID,
  poNumber: 'PO-2026-000031',
  farmerId: '55555555-5555-4555-8555-555555555555',
  listingId: '66666666-6666-4666-8666-666666666666',
  warehouseId: WH,
  cropId: '77777777-7777-4777-8777-777777777777',
  grade: 'GRADE_1',
  quantityKg: '650.000',
  pricePerKg: '42.50' as never,
  totalAmount: '27625.00' as never,
  status: 'ISSUED',
  expectedDeliveryDate: '2026-10-20',
  issuedAt: '2026-10-12T04:00:00Z',
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

const CREATE_BODY: GoodsReceiptCreate = { purchaseOrderId: PO_ID, warehouseId: WH, grossQtyKg: '250.000' };

function draft(overrides: Partial<QcDraft> = {}): QcDraft {
  return {
    assignedGrade: 'GRADE_1',
    grossGrams: 250_000,
    acceptedGrams: 250_000,
    checklist: { appearance: 'pass', size: 'pass', moisture: 'pass', damage: 'pass', freshness: 'pass' },
    moisturePct: '',
    visualScore: '',
    defectNotes: '',
    ...overrides,
  };
}

function problem(code: string, status: number): ApiError {
  return new ApiError({ type: 'about:blank', title: code, status, code: code as never });
}

// ─── Statuses ────────────────────────────────────────────────────────────────

describe('shipmentStatusOf', () => {
  it('maps every purchase-order status when no receipts are known', () => {
    expect(shipmentStatusOf(PO)).toBe('Expected');
    expect(shipmentStatusOf({ ...PO, status: 'PARTIALLY_RECEIVED' })).toBe('Receiving');
    expect(shipmentStatusOf({ ...PO, status: 'RECEIVED' })).toBe('Completed');
    expect(shipmentStatusOf({ ...PO, status: 'CANCELLED' })).toBe('Cancelled');
  });

  it('an unknown status falls back to Unknown, never to a receivable state', () => {
    expect(shipmentStatusOf({ ...PO, status: 'CLOSED' as never })).toBe('Unknown');
  });

  it('a receipt awaiting QC wins, so the admin resumes it instead of receiving again', () => {
    expect(shipmentStatusOf(PO, [receipt()])).toBe('Awaiting QC');
  });

  it('derives progress from the receipts, since the server never advances the PO status', () => {
    expect(shipmentStatusOf(PO, [])).toBe('Expected');
    expect(shipmentStatusOf(PO, [receipt({ status: 'ACCEPTED', acceptedQtyKg: '250.000' })])).toBe('Receiving');
    expect(
      shipmentStatusOf(PO, [
        receipt({ status: 'ACCEPTED', grossQtyKg: '400.000' }),
        receipt({ id: GR_NEW, status: 'PARTIALLY_ACCEPTED', grossQtyKg: '250.000' }),
      ]),
    ).toBe('Completed');
  });

  it('a cancelled order stays cancelled whatever its receipts say', () => {
    expect(shipmentStatusOf({ ...PO, status: 'CANCELLED' }, [receipt()])).toBe('Cancelled');
  });
});

describe('receiptResultOf', () => {
  it('maps every goods-receipt status, with a fallback', () => {
    expect(receiptResultOf('AWAITING_QC')).toBe('Awaiting QC');
    expect(receiptResultOf('ACCEPTED')).toBe('Accepted');
    expect(receiptResultOf('PARTIALLY_ACCEPTED')).toBe('Partially Accepted');
    expect(receiptResultOf('REJECTED')).toBe('Rejected');
    expect(receiptResultOf('COUNTER_OFFERED')).toBe('Counter-Offered');
    expect(receiptResultOf('SOMETHING_NEW')).toBe('Unknown');
  });
});

// ─── Rows ────────────────────────────────────────────────────────────────────

describe('toIncomingShipment', () => {
  it('a list row shows the poNumber and has no farmer or crop name yet', () => {
    const s = toIncomingShipment(PO, { warehouseName: 'Coonoor' });
    expect(s.purchaseOrderId).toBe(PO_ID);
    expect(s.code).toBe('PO-2026-000031');
    expect(s.from).toBe('');
    expect(s.produce).toBe(t('inventory.crop.unnamed'));
    expect(s.grade).toBe('Grade 1');
    expect(s.apiGrade).toBe('GRADE_1');
    expect(s.to).toBe('Coonoor');
    expect(s.status).toBe('Expected');
    expect(s.statusLabel).toBe(t('receiving.shipmentStatus.expected'));
  });

  it('quantities are exact integer grams', () => {
    const s = toIncomingShipment({ ...PO, quantityKg: '0.300' }, {
      receipts: [receipt({ grossQtyKg: '0.100' }), receipt({ id: GR_NEW, grossQtyKg: '0.200' })],
    });
    expect(s.expectedGrams).toBe(300);
    // 0.1 + 0.2 kg is exactly 300 g, not 0.30000000000000004 kg.
    expect(s.receivedGrams).toBe(300);
  });

  it('the detail adds the farmer, the receipts and the pending receipt', () => {
    const detail: PurchaseOrderDetailDto = {
      ...PO,
      farmerName: 'Ramesh',
      tohfaFarmerId: 'TF-0001',
      goodsReceipts: [receipt({ cropName: 'Beetroot' })],
    };
    const s = toIncomingShipment(detail, { receipts: detail.goodsReceipts, warehouseName: 'Coonoor' });
    expect(s.from).toBe('Ramesh');
    expect(s.farmerCode).toBe('TF-0001');
    expect(s.produce).toBe('Beetroot');
    expect(s.receiptIds).toEqual([GR_OLD]);
    expect(s.pendingReceiptId).toBe(GR_OLD);
    expect(s.status).toBe('Awaiting QC');
  });

  it('a quantity that is not an API Quantity stays unknown (null), never 0', () => {
    expect(toIncomingShipment({ ...PO, quantityKg: '1e3' }, {}).expectedGrams).toBeNull();
  });
});

describe('toReceivingRecord', () => {
  it('maps a receipt with its grnNumber, uuid and grams', () => {
    const r = toReceivingRecord(
      receipt({ status: 'PARTIALLY_ACCEPTED', acceptedQtyKg: '220.000', rejectedQtyKg: '30.000', poNumber: 'PO-2026-000031', cropName: 'Beetroot', grade: 'GRADE_2', rejectionReason: 'Bruised' }),
      { now: NOW, warehouseName: 'Coonoor' },
    );
    expect(r.id).toBe(GR_OLD);
    expect(r.receiptId).toBe('GRN-2026-000101');
    expect(r.purchaseOrderId).toBe(PO_ID);
    expect(r.shipmentId).toBe('PO-2026-000031');
    expect(r.result).toBe('Partially Accepted');
    expect(r.resultLabel).toBe(t('receiving.receiptResult.partiallyAccepted'));
    expect(r.product).toBe('Beetroot');
    expect(r.grade).toBe('Grade 2');
    expect(r.receivedGrams).toBe(250_000);
    expect(r.acceptedGrams).toBe(220_000);
    expect(r.rejectedGrams).toBe(30_000);
    expect(r.rejectionReason).toBe('Bruised');
    expect(r.warehouseName).toBe('Coonoor');
    expect(r.date).toContain(t('datetime.today'));
  });

  it('a receipt awaiting QC has no accepted / rejected figures yet', () => {
    const r = toReceivingRecord(receipt(), { now: NOW });
    expect(r.acceptedGrams).toBeNull();
    expect(r.rejectedGrams).toBeNull();
    expect(r.product).toBe(t('inventory.crop.unnamed'));
    expect(r.grade).toBe('');
  });

  it('carries no batch id: the API returns none for a receipt', () => {
    expect(toReceivingRecord(receipt({ status: 'ACCEPTED' }), { now: NOW }).batchId).toBeUndefined();
  });
});

describe('qcPendingIssues', () => {
  it('turns receipts awaiting QC into QC Pending issues that resume the wizard at the quality check', () => {
    const records = [
      toReceivingRecord(receipt({ poNumber: 'PO-2026-000031', cropName: 'Beetroot' }), { now: NOW }),
      toReceivingRecord(receipt({ id: GR_NEW, status: 'ACCEPTED' }), { now: NOW }),
    ];
    const issues = qcPendingIssues(records);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      id: GR_OLD,
      kind: 'QC Pending',
      purchaseOrderId: PO_ID,
      target: 'wizard',
      wizardStep: 'quality_check',
      produce: 'Beetroot',
    });
  });
});

describe('toStorageLocationOption', () => {
  it('sends the location code (free text on the batch) and shows name, type and capacity', () => {
    const option = toStorageLocationOption({
      id: '88888888-8888-4888-8888-888888888888',
      warehouseId: WH,
      code: 'CS-A01',
      name: 'Cold Storage A',
      locationType: 'Cold Storage',
      capacityKg: '2000.000',
      isActive: true,
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: null,
    });
    expect(option).toEqual({ id: '88888888-8888-4888-8888-888888888888', code: 'CS-A01', label: 'Cold Storage A', zone: 'Cold Storage', capacityGrams: 2_000_000 });
  });
});

// ─── Quantities and the QC body ──────────────────────────────────────────────

describe('receiptQuantitiesValid (grams; the server rule is accepted + rejected <= gross)', () => {
  it('accepts a full, a partial and a rejected split that add up to the gross', () => {
    expect(receiptQuantitiesValid(250_000, 250_000, 0)).toBe(true);
    expect(receiptQuantitiesValid(250_000, 220_000, 30_000)).toBe(true);
    expect(receiptQuantitiesValid(250_000, 0, 250_000)).toBe(true);
  });

  it('refuses more than the gross, a zero gross, negatives, fractions of a gram and unknowns', () => {
    expect(receiptQuantitiesValid(250_000, 220_000, 30_001)).toBe(false);
    expect(receiptQuantitiesValid(0, 0, 0)).toBe(false);
    expect(receiptQuantitiesValid(250_000, -1, 1)).toBe(false);
    expect(receiptQuantitiesValid(250_000, 0.5, 0)).toBe(false);
    expect(receiptQuantitiesValid(null, 0, 0)).toBe(false);
    expect(receiptQuantitiesValid(250_000, null, 0)).toBe(false);
  });

  it('is exact where floats are not: 0.1 kg + 0.2 kg accepted/rejected of 0.3 kg', () => {
    expect(receiptQuantitiesValid(300, 100, 200)).toBe(true);
  });
});

describe('qualityOutcomeOf', () => {
  it('derives the outcome from the split', () => {
    expect(qualityOutcomeOf(250_000, 0)).toBe('ACCEPTED');
    expect(qualityOutcomeOf(220_000, 30_000)).toBe('PARTIALLY_ACCEPTED');
    expect(qualityOutcomeOf(0, 250_000)).toBe('REJECTED');
  });
});

describe('buildQualityCheckBody', () => {
  it('writes quantities as kg strings built from integer grams, rejected = gross - accepted', () => {
    const body = buildQualityCheckBody(draft({ acceptedGrams: 220_100, defectNotes: 'Bruised crates' }));
    expect(body.acceptedQtyKg).toBe('220.100');
    expect(body.rejectedQtyKg).toBe('29.900');
    expect(body.outcome).toBe('PARTIALLY_ACCEPTED');
    expect(body.assignedGrade).toBe('GRADE_1');
    expect(body.defectNotes).toBe('Bruised crates');
  });

  it('sends the five checklist rows the server requires, a row passing only when it passed', () => {
    const body = buildQualityCheckBody(
      draft({ checklist: { appearance: 'pass', size: 'attention', moisture: 'pass', damage: 'fail', freshness: 'pass' } }),
    );
    expect(body.items).toEqual([
      { parameter: 'APPEARANCE', passed: true },
      { parameter: 'SIZE_UNIFORMITY', passed: false },
      { parameter: 'MOISTURE', passed: true },
      { parameter: 'DAMAGE_PEST', passed: false },
      { parameter: 'FRESHNESS', passed: true },
    ]);
  });

  it('sends moisture, visual score and the storage location only when given', () => {
    const plain = buildQualityCheckBody(draft());
    expect(plain).not.toHaveProperty('moisturePct');
    expect(plain).not.toHaveProperty('visualScore');
    expect(plain).not.toHaveProperty('storageLocation');
    expect(plain).not.toHaveProperty('defectNotes');
    const full = buildQualityCheckBody(draft({ moisturePct: '12.4', visualScore: '7', storageLocation: 'CS-A01' }));
    expect(full.moisturePct).toBe(12.4);
    expect(full.visualScore).toBe(7);
    expect(full.storageLocation).toBe('CS-A01');
  });

  it('throws on a draft with a problem instead of sending it', () => {
    expect(() => buildQualityCheckBody(draft({ acceptedGrams: 300_000 }))).toThrow();
  });
});

describe('qcDraftProblem', () => {
  it('flags quantities outside the gross', () => {
    expect(qcDraftProblem(draft({ acceptedGrams: 250_001 }))).toBe('quantities');
    expect(qcDraftProblem(draft({ grossGrams: null }))).toBe('quantities');
  });

  it('flags a moisture outside 0-100 and a visual score outside 0-10 or not whole', () => {
    expect(qcDraftProblem(draft({ moisturePct: '100.1' }))).toBe('moisture');
    expect(qcDraftProblem(draft({ moisturePct: 'abc' }))).toBe('moisture');
    expect(qcDraftProblem(draft({ visualScore: '11' }))).toBe('visualScore');
    expect(qcDraftProblem(draft({ visualScore: '6.5' }))).toBe('visualScore');
    expect(qcDraftProblem(draft({ moisturePct: '0', visualScore: '10' }))).toBeNull();
  });

  it('a rejection needs defect notes (the server refuses a rejected quantity without a reason)', () => {
    expect(qcDraftProblem(draft({ acceptedGrams: 200_000 }))).toBe('defectNotesRequired');
    expect(qcDraftProblem(draft({ acceptedGrams: 200_000, defectNotes: '   ' }))).toBe('defectNotesRequired');
    expect(qcDraftProblem(draft({ acceptedGrams: 200_000, defectNotes: 'Bruised' }))).toBeNull();
  });
});

describe('buildGoodsReceiptBody', () => {
  it('writes the gross as a kg string from grams and adds the vehicle only when typed', () => {
    expect(buildGoodsReceiptBody({ purchaseOrderId: PO_ID, warehouseId: WH, grossGrams: 250_500 })).toEqual({
      purchaseOrderId: PO_ID,
      warehouseId: WH,
      grossQtyKg: '250.500',
    });
    expect(
      buildGoodsReceiptBody({ purchaseOrderId: PO_ID, warehouseId: WH, grossGrams: 1, vehicleNumber: ' TN43AB1234 ' }),
    ).toEqual({ purchaseOrderId: PO_ID, warehouseId: WH, grossQtyKg: '0.001', vehicleNumber: 'TN43AB1234' });
  });
});

describe('buildCounterOfferBody', () => {
  it('sends the price as a Money string and the quantity as kg from grams', () => {
    expect(buildCounterOfferBody({ priceInput: '42.5', quantityGrams: 220_000, message: ' Grade 2 at receipt ' })).toEqual({
      pricePerKg: '42.50',
      quantityKg: '220.000',
      message: 'Grade 2 at receipt',
    });
  });

  it('refuses a zero or malformed price and a zero quantity', () => {
    expect(buildCounterOfferBody({ priceInput: '0', quantityGrams: 1000, message: '' })).toBeNull();
    expect(buildCounterOfferBody({ priceInput: '4.555', quantityGrams: 1000, message: '' })).toBeNull();
    expect(buildCounterOfferBody({ priceInput: '40', quantityGrams: 0, message: '' })).toBeNull();
  });
});

// ─── Resume after an unknown outcome ─────────────────────────────────────────

describe('isOutcomeUnknown', () => {
  it('a network failure or a 5xx may have been written; a 4xx was not', () => {
    expect(isOutcomeUnknown(new NetworkError(new Error('timeout')))).toBe(true);
    expect(isOutcomeUnknown(problem('INTERNAL', 500))).toBe(true);
    expect(isOutcomeUnknown(problem('VALIDATION_FAILED', 422))).toBe(false);
    expect(isOutcomeUnknown(problem('NOT_FOUND', 404))).toBe(false);
    expect(isOutcomeUnknown(new Error('boom'))).toBe(false);
  });
});

describe('pendingReceiptOf / findCreatedReceipt', () => {
  it('pendingReceiptOf picks the newest receipt still awaiting QC', () => {
    const older = receipt({ receivedAt: '2026-10-12T04:00:00Z' });
    const newer = receipt({ id: GR_NEW, receivedAt: '2026-10-12T05:30:00Z' });
    expect(pendingReceiptOf([older, newer, receipt({ id: 'x', status: 'ACCEPTED' })])?.id).toBe(GR_NEW);
    expect(pendingReceiptOf([receipt({ status: 'ACCEPTED' })])).toBeUndefined();
  });

  it('findCreatedReceipt finds the receipt our create wrote: new, same order, warehouse and gross', () => {
    const ours = receipt({ id: GR_NEW });
    expect(findCreatedReceipt([GR_OLD], [receipt(), ours], CREATE_BODY)?.id).toBe(GR_NEW);
  });

  it('ignores receipts that existed before, and ones for another gross or warehouse', () => {
    expect(findCreatedReceipt([GR_OLD], [receipt()], CREATE_BODY)).toBeUndefined();
    expect(findCreatedReceipt([], [receipt({ grossQtyKg: '249.999' })], CREATE_BODY)).toBeUndefined();
    expect(findCreatedReceipt([], [receipt({ warehouseId: 'other' })], CREATE_BODY)).toBeUndefined();
    expect(findCreatedReceipt([], [receipt({ grossQtyKg: '250' })], CREATE_BODY)?.id).toBe(GR_OLD);
  });
});

describe('submitReceiving: create once, then QC, resuming after a timeout', () => {
  const QC: QualityCheckCreate = buildQualityCheckBody(draft());
  const QC_RESULT: QualityCheckResultDto = {
    qualityCheck: { id: 'qc-1', goodsReceiptId: GR_NEW, assignedGrade: 'GRADE_1', outcome: 'ACCEPTED', checkedAt: '2026-10-12T06:00:00Z' },
    batch: null,
  };
  let deps: { [K in keyof SubmissionDeps]: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    deps = {
      createReceipt: vi.fn(async () => receipt({ id: GR_NEW, grnNumber: 'GRN-2026-000102' })),
      receiptsOfPurchaseOrder: vi.fn(async () => [] as GoodsReceiptDto[]),
      getReceipt: vi.fn(async () => receipt({ id: GR_NEW, status: 'AWAITING_QC' })),
      recordQualityCheck: vi.fn(async () => QC_RESULT),
    };
  });

  const run = (state: ReturnType<typeof initialSubmissionState>, qc: QualityCheckCreate | null = QC) =>
    submitReceiving(state, { purchaseOrderId: PO_ID, createBody: CREATE_BODY, qcBody: qc }, deps as unknown as SubmissionDeps);

  it('the happy path creates the receipt, then records the QC on it', async () => {
    const outcome = await run(initialSubmissionState([]));
    expect(deps.createReceipt).toHaveBeenCalledTimes(1);
    expect(deps.recordQualityCheck).toHaveBeenCalledWith(GR_NEW, QC);
    expect(outcome).toMatchObject({ kind: 'done', receipt: { id: GR_NEW, grnNumber: 'GRN-2026-000102' }, qc: QC_RESULT });
  });

  it('a failed QC keeps the receipt, so the retry records the QC and never creates again', async () => {
    deps.recordQualityCheck.mockRejectedValueOnce(problem('VALIDATION_FAILED', 422));
    const failed = await run(initialSubmissionState([]));
    expect(failed).toMatchObject({ kind: 'failed', stage: 'qc' });
    expect(failed.state.receipt?.id).toBe(GR_NEW);

    const retried = await run(failed.state);
    expect(deps.createReceipt).toHaveBeenCalledTimes(1);
    expect(deps.recordQualityCheck).toHaveBeenCalledTimes(2);
    expect(retried.kind).toBe('done');
  });

  it('a timeout on create re-reads the order and resumes the receipt that now exists instead of creating another', async () => {
    deps.createReceipt.mockRejectedValueOnce(new NetworkError(new Error('timeout')));
    const failed = await run(initialSubmissionState([GR_OLD]));
    expect(failed).toMatchObject({ kind: 'failed', stage: 'create' });
    expect(failed.state.receipt).toBeNull();
    expect(failed.state.createUnknown).toBe(true);

    // The create did reach the server: the order now has our receipt.
    deps.receiptsOfPurchaseOrder.mockResolvedValueOnce([receipt(), receipt({ id: GR_NEW, grnNumber: 'GRN-2026-000102' })]);
    const retried = await run(failed.state);
    expect(deps.receiptsOfPurchaseOrder).toHaveBeenCalledWith(PO_ID);
    expect(deps.createReceipt).toHaveBeenCalledTimes(1);
    expect(deps.recordQualityCheck).toHaveBeenCalledWith(GR_NEW, QC);
    expect(retried).toMatchObject({ kind: 'done', receipt: { id: GR_NEW } });
  });

  it('a timeout on create that did not reach the server creates on retry (with the same body)', async () => {
    deps.createReceipt.mockRejectedValueOnce(new NetworkError(new Error('timeout')));
    const failed = await run(initialSubmissionState([GR_OLD]));
    deps.receiptsOfPurchaseOrder.mockResolvedValueOnce([receipt()]);
    const retried = await run(failed.state);
    expect(deps.createReceipt).toHaveBeenCalledTimes(2);
    expect(deps.createReceipt).toHaveBeenLastCalledWith(CREATE_BODY);
    expect(retried.kind).toBe('done');
  });

  it('when the re-read itself fails, nothing is created and the outcome stays unknown', async () => {
    deps.createReceipt.mockRejectedValueOnce(new NetworkError(new Error('timeout')));
    const failed = await run(initialSubmissionState([]));
    deps.receiptsOfPurchaseOrder.mockRejectedValueOnce(new NetworkError(new Error('offline')));
    const again = await run(failed.state);
    expect(again).toMatchObject({ kind: 'failed', stage: 'verify' });
    expect(again.state.createUnknown).toBe(true);
    expect(deps.createReceipt).toHaveBeenCalledTimes(1);
  });

  it('a refused create (4xx) is not unknown: the retry creates without a re-read', async () => {
    deps.createReceipt.mockRejectedValueOnce(problem('VALIDATION_FAILED', 422));
    const failed = await run(initialSubmissionState([]));
    expect(failed.state.createUnknown).toBe(false);
    await run(failed.state);
    expect(deps.receiptsOfPurchaseOrder).not.toHaveBeenCalled();
    expect(deps.createReceipt).toHaveBeenCalledTimes(2);
  });

  it('an order that already has a receipt awaiting QC resumes it: no create at all', async () => {
    const state = initialSubmissionState([GR_OLD], receipt());
    const outcome = await run(state);
    expect(deps.createReceipt).not.toHaveBeenCalled();
    expect(deps.recordQualityCheck).toHaveBeenCalledWith(GR_OLD, QC);
    expect(outcome.kind).toBe('done');
  });

  it('a timeout on QC re-reads the receipt; if the QC landed, it is done without a second QC', async () => {
    deps.recordQualityCheck.mockRejectedValueOnce(new NetworkError(new Error('timeout')));
    const failed = await run(initialSubmissionState([]));
    expect(failed).toMatchObject({ kind: 'failed', stage: 'qc' });
    expect(failed.state.qcUnknown).toBe(true);

    deps.getReceipt.mockResolvedValueOnce(receipt({ id: GR_NEW, status: 'ACCEPTED', acceptedQtyKg: '250.000' }));
    const retried = await run(failed.state);
    expect(deps.getReceipt).toHaveBeenCalledWith(GR_NEW);
    expect(deps.recordQualityCheck).toHaveBeenCalledTimes(1);
    expect(retried).toMatchObject({ kind: 'done', qc: null, receipt: { id: GR_NEW, status: 'ACCEPTED' } });
  });

  it('a timeout on QC that did not land records the QC again', async () => {
    deps.recordQualityCheck.mockRejectedValueOnce(new NetworkError(new Error('timeout')));
    const failed = await run(initialSubmissionState([]));
    const retried = await run(failed.state);
    expect(deps.recordQualityCheck).toHaveBeenCalledTimes(2);
    expect(retried.kind).toBe('done');
  });

  it('without the QC permission it only records the receipt', async () => {
    const outcome = await run(initialSubmissionState([]), null);
    expect(deps.createReceipt).toHaveBeenCalledTimes(1);
    expect(deps.recordQualityCheck).not.toHaveBeenCalled();
    expect(outcome).toMatchObject({ kind: 'done', qc: null });
  });
});
