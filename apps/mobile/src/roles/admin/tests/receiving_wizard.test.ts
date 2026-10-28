/**
 * screens/warehouse/receiving-qc/wizardDraft.ts: the Goods Receiving wizard's
 * own decisions (design M2-05 … M2-14), kept out of the screen so plain-Node
 * vitest covers them:
 *   - what the five checklist buttons send (QualityCheckItemCreate points);
 *   - the decision (accept / partial / reject) and WHERE phase 2 (the quality
 *     check, which stocks the batch with its storage location, BR-106) runs;
 *   - resuming a receipt that already exists (no second create, BR-118);
 *   - the damage / mismatch reports of the session (BR-121): derived ones,
 *     the grade note, the admin's own report, what is already persisted;
 *   - the result views after the submit (batch code only once the server
 *     assigned one) and the receipt activity (real times only).
 */
import { describe, expect, it } from 'vitest';
import type { GoodsReceiptDto, QualityCheckResultDto } from '../api/receiving';
import type { LiveDiscrepancy, LiveReceiptDetail } from '../screens/warehouse/receiving-qc/liveTypes';
import { gradeLabel, kgLabel } from '../screens/warehouse/receiving-qc/mappers';
import { initialSubmissionState } from '../screens/warehouse/receiving-qc/submission';
import {
  ALL_PASS,
  counterQuantityGrams,
  discrepancyRows,
  gradeSummaryOf,
  isValidPartial,
  manualDiscrepancyBody,
  outcomeOf,
  pendingBodies,
  phase2Placement,
  qcIssueCountOf,
  qcPointsOf,
  receiptActivity,
  reviewQcResults,
  seedSubmission,
  sessionDiscrepancyBodies,
  shortId,
  wizardQcCriteria,
  wizardQcDraft,
  wizardResultOf,
} from '../screens/warehouse/receiving-qc/wizardDraft';

const WH = '11111111-1111-4111-8111-111111111111';
const PO = '22222222-2222-4222-8222-222222222222';
const GR = '44444444-4444-4444-8444-444444444444';

function receipt(over: Partial<GoodsReceiptDto> = {}): GoodsReceiptDto {
  return {
    id: GR,
    grnNumber: 'GRN-2026-000042',
    purchaseOrderId: PO,
    warehouseId: WH,
    grossQtyKg: '480.000',
    acceptedQtyKg: '0.000',
    rejectedQtyKg: '0.000',
    status: 'AWAITING_QC',
    receivedAt: '2026-10-26T04:45:00.000Z',
    ...over,
  };
}

function detail(over: Partial<LiveReceiptDetail> = {}): LiveReceiptDetail {
  return {
    id: GR,
    receiptId: 'GRN-2026-000042',
    purchaseOrderId: PO,
    shipmentId: 'PO-2026-000007',
    warehouseId: WH,
    warehouseName: 'Coonoor',
    result: 'Awaiting QC',
    resultLabel: 'Awaiting QC',
    receivedAt: '2026-10-26T04:45:00.000Z',
    date: 'Today · 10:15 AM',
    day: '26 Oct 2026',
    product: 'Tomato',
    grade: 'Grade 1',
    expectedGrams: 500_000,
    receivedGrams: 480_000,
    acceptedGrams: null,
    rejectedGrams: null,
    qualityCheck: null,
    ...over,
  };
}

const QC_RESULT: QualityCheckResultDto = {
  qualityCheck: {
    id: 'qc-1',
    goodsReceiptId: GR,
    assignedGrade: 'GRADE_2',
    outcome: 'PARTIALLY_ACCEPTED',
    acceptedQtyKg: '445.000',
    rejectedQtyKg: '35.000',
    rejectionReasonCode: 'PHYSICAL_DAMAGE',
    checkedAt: '2026-10-26T05:00:00.000Z',
    items: [
      { parameter: 'APPEARANCE', passed: true },
      { parameter: 'SIZE_UNIFORMITY', passed: true },
      { parameter: 'MOISTURE', passed: true },
      { parameter: 'DAMAGE_PEST', passed: false, condition: 'POOR' },
      { parameter: 'FRESHNESS', passed: true },
    ],
  },
  batch: {
    id: 'batch-uuid',
    batchCode: 'BATCH-2026-000512',
    warehouseId: WH,
    cropId: 'crop-1',
    grade: 'GRADE_2',
    qtyAvailableKg: '445.000',
    storageLocation: 'COLD-A-02',
    status: 'ACTIVE',
  } as QualityCheckResultDto['batch'],
};

describe('M2-07 quality checklist', () => {
  it('lists the five checklist rows in the API order (QC_ORDER) with their titles', () => {
    const rows = wizardQcCriteria();
    expect(rows.map((r) => r.id)).toEqual(['appearance', 'size', 'moisture', 'damage', 'freshness']);
    expect(rows.map((r) => r.title)).toEqual(['Appearance', 'Size Uniformity', 'Moisture', 'Damage / Pest', 'Freshness']);
    expect(rows[0]?.code).toBe('01 — REQUIRED');
    expect(rows[4]?.code).toBe('05 — REQUIRED');
    expect(rows.map((r) => r.icon)).toEqual(['eye', 'ruler', 'drop', 'bug', 'leaf']);
  });

  it('BR-120: Pass sends a passed point; Needs Attention and Fail send a failed point with the condition the admin picked', () => {
    const points = qcPointsOf({ ...ALL_PASS, damage: 'attention', freshness: 'fail' });
    expect(points.appearance).toEqual({ result: 'pass' });
    expect(points.damage).toEqual({ result: 'attention', condition: 'FAIR' });
    expect(points.freshness).toEqual({ result: 'fail', condition: 'POOR' });
  });

  it('counts the rows that did not pass', () => {
    expect(qcIssueCountOf(ALL_PASS)).toBe(0);
    expect(qcIssueCountOf({ ...ALL_PASS, size: 'attention', moisture: 'fail' })).toBe(2);
  });

  it('the review step checklist: a ticked parameter passes, an unticked one fails', () => {
    expect(reviewQcResults({ appearance: true, size: false, moisture: true, damage: true, freshness: false })).toEqual({
      appearance: 'pass',
      size: 'fail',
      moisture: 'pass',
      damage: 'pass',
      freshness: 'fail',
    });
  });
});

describe('M2-10 / M2-11 decision', () => {
  it('the outcome follows the split; nothing decided is null', () => {
    expect(outcomeOf(480_000, null)).toBeNull();
    expect(outcomeOf(null, 0)).toBeNull();
    expect(outcomeOf(480_000, 480_000)).toBe('Accept');
    expect(outcomeOf(480_000, 0)).toBe('Reject');
    expect(outcomeOf(480_000, 445_000)).toBe('Partial Accept');
  });

  it('a partial acceptance is more than nothing and less than the received weight', () => {
    expect(isValidPartial(480_000, 445_000)).toBe(true);
    expect(isValidPartial(480_000, 0)).toBe(false);
    expect(isValidPartial(480_000, 480_000)).toBe(false);
    expect(isValidPartial(480_000, 500_000)).toBe(false);
    expect(isValidPartial(null, 1)).toBe(false);
    expect(isValidPartial(480_000, null)).toBe(false);
  });

  it('BR-106: phase 2 runs at the storage confirm only when a batch will be stocked and the admin may place it', () => {
    const base = { canQc: true, canBatch: true, acceptedGrams: 445_000, assignedGrade: 'GRADE_2' as const };
    expect(phase2Placement(base)).toBe('storage');
    expect(phase2Placement({ ...base, acceptedGrams: 0 })).toBe('summary');
    expect(phase2Placement({ ...base, assignedGrade: 'REJECT' })).toBe('summary');
    expect(phase2Placement({ ...base, canBatch: false })).toBe('summary');
    expect(phase2Placement({ ...base, acceptedGrams: null })).toBe('summary');
  });

  it('without inventory.quality_check.perform there is no phase 2 at all (the receipt stays awaiting QC)', () => {
    expect(phase2Placement({ canQc: false, canBatch: true, acceptedGrams: 445_000, assignedGrade: 'GRADE_1' })).toBe('none');
  });

  it('builds the QC draft: points from the checklist, the reason only with a rejected weight, the location code', () => {
    const draft = wizardQcDraft({
      assignedGrade: 'GRADE_2',
      grossGrams: 480_000,
      acceptedGrams: 445_000,
      results: { ...ALL_PASS, damage: 'attention' },
      rejectionReasonCode: 'PHYSICAL_DAMAGE',
      rejectionNote: '  bruised crates ',
      storageLocationCode: 'COLD-A-02',
    });
    expect(draft.assignedGrade).toBe('GRADE_2');
    expect(draft.grossGrams).toBe(480_000);
    expect(draft.acceptedGrams).toBe(445_000);
    expect(draft.points.damage).toEqual({ result: 'attention', condition: 'FAIR' });
    expect(draft.rejectionReasonCode).toBe('PHYSICAL_DAMAGE');
    expect(draft.rejectionNote).toBe('  bruised crates ');
    expect(draft.storageLocationCode).toBe('COLD-A-02');
    expect(draft.moisturePct).toBe('');
    expect(draft.visualScore).toBe('');

    const full = wizardQcDraft({
      assignedGrade: 'GRADE_1',
      grossGrams: 480_000,
      acceptedGrams: 480_000,
      results: ALL_PASS,
      rejectionReasonCode: 'BELOW_GRADE',
      rejectionNote: 'x',
    });
    expect(full.rejectionReasonCode).toBeUndefined();
    expect(full.rejectionNote).toBeUndefined();
  });

  it('the counter-offer is for the accepted weight once known, else the received weight', () => {
    expect(counterQuantityGrams(null, null, 480_000)).toBe(480_000);
    expect(counterQuantityGrams(null, 445_000, 480_000)).toBe(445_000);
    const result = wizardResultOf(QC_RESULT, undefined);
    expect(counterQuantityGrams(result, 1, 480_000)).toBe(445_000);
    expect(counterQuantityGrams(null, null, null)).toBeNull();
  });
});

describe('resume (BR-118: an order with a receipt awaiting QC is never received twice)', () => {
  it('seeds a fresh session with the receipt to resume, else the order’s pending receipt', () => {
    const fresh = initialSubmissionState();
    const resume = receipt();
    expect(seedSubmission(fresh, resume, undefined)).toEqual(initialSubmissionState(resume));
    const pending = receipt({ id: 'other', grnNumber: 'GRN-2' });
    expect(seedSubmission(fresh, undefined, pending)).toEqual(initialSubmissionState(pending));
    expect(seedSubmission(fresh, resume, pending)?.receipt?.id).toBe(GR);
  });

  it('a receipt that already has its check is seeded as done (no second check is sent)', () => {
    const done = receipt({ status: 'ACCEPTED', acceptedQtyKg: '480.000' });
    const seeded = seedSubmission(initialSubmissionState(), done, undefined);
    expect(seeded?.receipt).toEqual(done);
    expect(seeded?.qcDone).toBe(true);
  });

  it('never replaces a receipt the session already has or a create it may have sent', () => {
    const own = { ...initialSubmissionState(), receipt: receipt({ id: 'mine' }) };
    expect(seedSubmission(own, receipt(), undefined)).toBeNull();
    const held = { ...initialSubmissionState(), heldCreate: { purchaseOrderId: PO, warehouseId: WH, grossQtyKg: '1.000' } };
    expect(seedSubmission(held, undefined, receipt())).toBeNull();
    expect(seedSubmission(initialSubmissionState(), undefined, undefined)).toBeNull();
  });
});

describe('M2-09 damage / mismatch reports (BR-121)', () => {
  const ctx = {
    product: 'Tomato',
    expectedGrams: 500_000,
    receivedGrams: 480_000,
    listedGrade: 'GRADE_1' as const,
    assignedGrade: 'GRADE_2' as const,
    failedPoints: [] as const,
    damagedGrams: null,
    spoiledGrams: null,
    note: '',
  };

  it('derives the quantity and grade reports and puts the grade-mismatch note on the grade report only', () => {
    const bodies = sessionDiscrepancyBodies(ctx, ' grade 2 on inspection ', null);
    expect(bodies).toEqual([
      { type: 'QUANTITY', expected: kgLabel(500_000), actual: kgLabel(480_000) },
      { type: 'QUALITY', expected: gradeLabel('GRADE_1'), actual: gradeLabel('GRADE_2'), note: 'grade 2 on inspection' },
    ]);
  });

  it('the admin’s own report joins a derived report of the same type, else it is added', () => {
    const manualQty = manualDiscrepancyBody({ type: 'QUANTITY', description: 'two crates short' }, ctx);
    const merged = sessionDiscrepancyBodies(ctx, '', manualQty);
    expect(merged).toHaveLength(2);
    expect(merged[0]).toEqual({ type: 'QUANTITY', expected: kgLabel(500_000), actual: kgLabel(480_000), note: 'two crates short' });

    const manualDamage = manualDiscrepancyBody({ type: 'DAMAGE', description: 'wet crates' }, ctx);
    const added = sessionDiscrepancyBodies(ctx, '', manualDamage);
    expect(added).toHaveLength(3);
    expect(added[2]).toEqual({ type: 'DAMAGE', expected: 'No damage', actual: 'wet crates', note: 'wet crates' });
  });

  it('a report the admin did not describe is not created', () => {
    expect(manualDiscrepancyBody({ type: 'OTHER', description: '   ' }, ctx)).toBeNull();
  });

  it('builds each report type from what the order and the receipt say', () => {
    expect(manualDiscrepancyBody({ type: 'QUANTITY', description: 'short' }, ctx)).toEqual({
      type: 'QUANTITY',
      expected: kgLabel(500_000),
      actual: kgLabel(480_000),
      note: 'short',
    });
    expect(manualDiscrepancyBody({ type: 'QUALITY', description: 'soft' }, ctx)).toEqual({
      type: 'QUALITY',
      expected: gradeLabel('GRADE_1'),
      actual: gradeLabel('GRADE_2'),
      note: 'soft',
    });
    expect(manualDiscrepancyBody({ type: 'CROP_MISMATCH', description: 'potatoes' }, ctx)).toEqual({
      type: 'CROP_MISMATCH',
      expected: 'Tomato',
      actual: 'potatoes',
      note: 'potatoes',
    });
    // Without the weights a quantity report says what the admin wrote.
    expect(manualDiscrepancyBody({ type: 'QUANTITY', description: 'short' }, { ...ctx, receivedGrams: null })).toEqual({
      type: 'QUANTITY',
      expected: kgLabel(500_000),
      actual: 'short',
      note: 'short',
    });
    // The API bounds: expected / actual 1-200 characters, note 1-500.
    const long = 'x'.repeat(600);
    const body = manualDiscrepancyBody({ type: 'OTHER', description: long }, ctx);
    expect(body?.actual).toHaveLength(200);
    expect(body?.note).toHaveLength(500);
  });

  const persistedQty: LiveDiscrepancy = {
    id: 'd1d1d1d1-0000-4000-8000-000000000001',
    type: 'QUANTITY',
    typeLabel: 'Quantity',
    expected: kgLabel(500_000),
    actual: kgLabel(480_000),
    status: 'OPEN',
    statusLabel: 'Open',
    createdBy: 'Suresh',
    createdAt: '2026-10-26T04:55:00.000Z',
    createdOn: 'Today · 10:25 AM',
  };

  it('persists each report once: a report already on the receipt (same type, expected and actual) is not sent again', () => {
    const bodies = sessionDiscrepancyBodies(ctx, '', null);
    const todo = pendingBodies(bodies, [persistedQty]);
    expect(todo).toEqual([{ type: 'QUALITY', expected: gradeLabel('GRADE_1'), actual: gradeLabel('GRADE_2') }]);
    expect(pendingBodies(bodies, [])).toEqual(bodies);
  });

  it('lists the persisted reports (GET, then what this session created) and the reports still to send', () => {
    const created: LiveDiscrepancy = { ...persistedQty, id: 'd2', type: 'DAMAGE', typeLabel: 'Damage', actual: 'wet', expected: 'No damage' };
    const rows = discrepancyRows([persistedQty], [persistedQty, created], [
      { type: 'QUALITY', expected: 'Grade 1', actual: 'Grade 2', note: 'n' },
    ]);
    expect(rows.map((r) => r.id)).toEqual([persistedQty.id, 'd2', undefined]);
    expect(rows[0]).toMatchObject({ typeLabel: 'Quantity', createdBy: 'Suresh', createdOn: 'Today · 10:25 AM', statusLabel: 'Open' });
    expect(rows[2]).toMatchObject({ type: 'QUALITY', typeLabel: 'Quality', expected: 'Grade 1', actual: 'Grade 2', note: 'n', statusLabel: 'Open' });
    expect(rows[2]?.createdBy).toBeUndefined();
    expect(rows[2]?.createdOn).toBeUndefined();
    expect(new Set(rows.map((r) => r.key)).size).toBe(3);
  });

  it('a short form of a report id is the start of the real id', () => {
    expect(shortId('d1d1d1d1-0000-4000-8000-000000000001')).toBe('d1d1d1d1');
  });
});

describe('M2-08B grade summary', () => {
  it('says match, mismatch or that the order has no grade', () => {
    expect(gradeSummaryOf({ status: 'match', quantityAffectedGrams: null })).toEqual({ text: 'Grade Match — Confirmed', tone: 'success' });
    expect(gradeSummaryOf({ status: 'mismatch', quantityAffectedGrams: 480_000 })).toEqual({
      text: 'Grade Mismatch — 1 product affected',
      tone: 'warning',
    });
    expect(gradeSummaryOf({ status: 'noListedGrade', quantityAffectedGrams: null }).tone).toBe('muted');
  });
});

describe('results after the submit (M2-13 / M2-14 complete, receipt confirmation)', () => {
  it('nothing to show before there is a receipt', () => {
    expect(wizardResultOf(null, undefined)).toBeNull();
  });

  it('a receipt still awaiting its check shows the "recorded, QC pending" outcome without a batch', () => {
    expect(wizardResultOf(null, detail())).toEqual({
      variant: 'awaiting',
      acceptedGrams: null,
      rejectedGrams: null,
      failedPoints: null,
    });
  });

  it('BR-106: the batch code and its storage location come from the quality check answer', () => {
    expect(wizardResultOf(QC_RESULT, detail())).toEqual({
      variant: 'partial',
      acceptedGrams: 445_000,
      rejectedGrams: 35_000,
      batchId: 'batch-uuid',
      batchCode: 'BATCH-2026-000512',
      storageLocation: 'COLD-A-02',
      reasonLabel: 'Physical Damage',
      failedPoints: 1,
    });
  });

  it('a checked receipt read back (resumed, or another session checked it) carries its own figures and batch', () => {
    const read = detail({
      result: 'Accepted',
      acceptedGrams: 480_000,
      rejectedGrams: 0,
      batchId: 'b2',
      batchCode: 'BATCH-2026-000600',
      qualityCheck: {
        outcome: 'ACCEPTED',
        outcomeLabel: 'Accepted',
        apiAssignedGrade: 'GRADE_1',
        assignedGrade: 'Grade 1',
        checkedBy: 'Meena',
        checkedAt: '2026-10-26T05:00:00.000Z',
        checkedOn: '26 Oct 2026',
        points: [],
        passedPoints: 5,
        acceptedGrams: 480_000,
        rejectedGrams: 0,
        damagedGrams: null,
        spoiledGrams: null,
        cropMismatchGrams: null,
      },
    });
    expect(wizardResultOf(null, read)).toEqual({
      variant: 'accept',
      acceptedGrams: 480_000,
      rejectedGrams: 0,
      batchId: 'b2',
      batchCode: 'BATCH-2026-000600',
      failedPoints: 0,
    });
    const rejected = detail({ result: 'Rejected', acceptedGrams: 0, rejectedGrams: 480_000, rejectionReason: 'mouldy' });
    expect(wizardResultOf(null, rejected)).toMatchObject({ variant: 'reject', reasonLabel: 'mouldy', failedPoints: null });
  });

  it('M2-12C: only events the API recorded, at their recorded times', () => {
    const now = new Date('2026-10-26T08:00:00.000Z');
    expect(receiptActivity(undefined, null, now)).toEqual([]);
    expect(receiptActivity(detail(), null, now)).toEqual([{ key: 'recorded', title: 'Quantity Verified', time: 'Today · 10:15 AM' }]);
    // The answer of this session's check, before the read comes back: no inspector name is invented.
    const events = receiptActivity(detail(), wizardResultOf(QC_RESULT, undefined), now, QC_RESULT.qualityCheck.checkedAt);
    expect(events).toEqual([
      { key: 'recorded', title: 'Quantity Verified', time: 'Today · 10:15 AM' },
      { key: 'checked', title: 'Quality Checked', time: 'Today · 10:30 AM' },
      { key: 'decision', title: 'Decision: Partial Accept', time: 'Today · 10:30 AM' },
      { key: 'batch', title: 'Batch BATCH-2026-000512', time: 'Today · 10:30 AM' },
    ]);
  });

  it('M2-12C: the check, its inspector, the decision and the batch from the read and the answer', () => {
    const now = new Date('2026-10-26T08:00:00.000Z');
    const read = detail({
      result: 'Partially Accepted',
      qualityCheck: {
        outcome: 'PARTIALLY_ACCEPTED',
        outcomeLabel: 'Partially Accepted',
        apiAssignedGrade: 'GRADE_2',
        assignedGrade: 'Grade 2',
        checkedBy: 'Meena',
        checkedAt: '2026-10-26T05:00:00.000Z',
        checkedOn: '26 Oct 2026',
        points: [],
        passedPoints: 4,
        acceptedGrams: 445_000,
        rejectedGrams: 35_000,
        damagedGrams: null,
        spoiledGrams: null,
        cropMismatchGrams: null,
      },
    });
    expect(receiptActivity(read, wizardResultOf(QC_RESULT, read), now)).toEqual([
      { key: 'recorded', title: 'Quantity Verified', time: 'Today · 10:15 AM' },
      { key: 'checked', title: 'Quality Checked · Meena', time: 'Today · 10:30 AM' },
      { key: 'decision', title: 'Decision: Partial Accept', time: 'Today · 10:30 AM' },
      { key: 'batch', title: 'Batch BATCH-2026-000512', time: 'Today · 10:30 AM' },
    ]);
  });
});
