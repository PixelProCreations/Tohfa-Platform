/**
 * screens/warehouse/receiving-qc/submission.ts: the wizard's two writes.
 *
 * Phase 1 records the goods receipt (POST /admin/goods-receipts) once the
 * received weight is known; phase 2 records its quality check, which stocks
 * the batch with its storage location in the same call (BR-106).
 *
 * BR-118: the server honours the Idempotency-Key, so a replay of the same key
 * and body moves nothing twice. A retry is therefore safe ONLY if it sends the
 * same body (the key ring gives the same body the same key). After an
 * outcome that may have been written (timeout, network, 5xx) the submission
 * HOLDS the body it sent and replays that exact body, even if the admin has
 * edited the form meanwhile; a refused write (4xx) is not held.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, NetworkError } from '../../../shell/api/client';
import type { GoodsReceiptCreate, GoodsReceiptDto, QualityCheckCreate, QualityCheckResultDto } from '../api/receiving';
import {
  ensureReceipt,
  initialSubmissionState,
  recordReceiptQc,
  type SubmissionDeps,
} from '../screens/warehouse/receiving-qc/submission';

const WH = '11111111-1111-4111-8111-111111111111';
const PO_ID = '22222222-2222-4222-8222-222222222222';
const GR = '44444444-4444-4444-8444-444444444444';

const CREATE: GoodsReceiptCreate = { purchaseOrderId: PO_ID, warehouseId: WH, grossQtyKg: '250.000' };
const EDITED: GoodsReceiptCreate = { ...CREATE, grossQtyKg: '251.000' };

const QC: QualityCheckCreate = {
  assignedGrade: 'GRADE_1',
  outcome: 'ACCEPTED',
  acceptedQtyKg: '250.000',
  rejectedQtyKg: '0.000',
  items: [
    { parameter: 'APPEARANCE', passed: true },
    { parameter: 'SIZE_UNIFORMITY', passed: true },
    { parameter: 'MOISTURE', passed: true },
    { parameter: 'DAMAGE_PEST', passed: true },
    { parameter: 'FRESHNESS', passed: true },
  ],
};

function receipt(overrides: Partial<GoodsReceiptDto> = {}): GoodsReceiptDto {
  return {
    id: GR,
    grnNumber: 'GRN-2026-000102',
    purchaseOrderId: PO_ID,
    warehouseId: WH,
    grossQtyKg: '250.000',
    status: 'AWAITING_QC',
    receivedAt: '2026-10-12T05:00:00Z',
    ...overrides,
  };
}

const QC_RESULT: QualityCheckResultDto = {
  qualityCheck: { id: 'qc-1', goodsReceiptId: GR, assignedGrade: 'GRADE_1', outcome: 'ACCEPTED', checkedAt: '2026-10-12T06:00:00Z' },
  batch: null,
};

function problem(code: string, status: number): ApiError {
  return new ApiError({ type: 'about:blank', title: code, status, code: code as never });
}

let deps: { [K in keyof SubmissionDeps]: ReturnType<typeof vi.fn> };

beforeEach(() => {
  deps = {
    createReceipt: vi.fn(async () => receipt()),
    getReceipt: vi.fn(async () => receipt()),
    recordQualityCheck: vi.fn(async () => QC_RESULT),
  };
});

const d = () => deps as unknown as SubmissionDeps;

describe('ensureReceipt (phase 1)', () => {
  it('creates the receipt once and keeps it', async () => {
    const out = await ensureReceipt(initialSubmissionState(), CREATE, d());
    expect(out).toMatchObject({ kind: 'done', receipt: { id: GR } });
    const again = await ensureReceipt(out.state, EDITED, d());
    expect(again.kind).toBe('done');
    expect(deps.createReceipt).toHaveBeenCalledTimes(1);
  });

  it('an order with a receipt already awaiting QC resumes it: no create at all', async () => {
    const out = await ensureReceipt(initialSubmissionState(receipt()), CREATE, d());
    expect(out.kind).toBe('done');
    expect(deps.createReceipt).not.toHaveBeenCalled();
  });

  it('BR-118: after a timeout the retry replays the SAME body (so the same key), even if the form changed', async () => {
    deps.createReceipt.mockRejectedValueOnce(new NetworkError(new Error('timeout')));
    const failed = await ensureReceipt(initialSubmissionState(), CREATE, d());
    expect(failed).toMatchObject({ kind: 'failed', unknown: true });
    expect(failed.state.heldCreate).toEqual(CREATE);

    const retried = await ensureReceipt(failed.state, EDITED, d());
    expect(deps.createReceipt).toHaveBeenLastCalledWith(CREATE);
    expect(retried.kind).toBe('done');
    expect(retried.state.heldCreate).toBeNull();
  });

  it('a 5xx may have been written too, so it is held the same way', async () => {
    deps.createReceipt.mockRejectedValueOnce(problem('INTERNAL', 503));
    const failed = await ensureReceipt(initialSubmissionState(), CREATE, d());
    expect(failed.state.heldCreate).toEqual(CREATE);
  });

  it('a refused create (4xx) is not held: the corrected body is sent', async () => {
    deps.createReceipt.mockRejectedValueOnce(problem('VALIDATION_FAILED', 422));
    const failed = await ensureReceipt(initialSubmissionState(), CREATE, d());
    expect(failed).toMatchObject({ kind: 'failed', unknown: false });
    expect(failed.state.heldCreate).toBeNull();
    await ensureReceipt(failed.state, EDITED, d());
    expect(deps.createReceipt).toHaveBeenLastCalledWith(EDITED);
  });
});

describe('recordReceiptQc (phase 2, BR-106)', () => {
  it('needs a receipt first', async () => {
    await expect(recordReceiptQc(initialSubmissionState(), QC, d())).rejects.toThrow();
  });

  it('records the check on the kept receipt and returns the batch answer', async () => {
    const out = await recordReceiptQc(initialSubmissionState(receipt()), QC, d());
    expect(deps.recordQualityCheck).toHaveBeenCalledWith(GR, QC);
    expect(out).toMatchObject({ kind: 'done', qc: QC_RESULT });
    expect(out.state.qc).toEqual(QC_RESULT);
  });

  it('a recorded check is never sent twice', async () => {
    const first = await recordReceiptQc(initialSubmissionState(receipt()), QC, d());
    const second = await recordReceiptQc(first.state, QC, d());
    expect(second.kind).toBe('done');
    expect(deps.recordQualityCheck).toHaveBeenCalledTimes(1);
  });

  it('BR-118: a timed-out check is replayed with the held body', async () => {
    deps.recordQualityCheck.mockRejectedValueOnce(new NetworkError(new Error('timeout')));
    const failed = await recordReceiptQc(initialSubmissionState(receipt()), QC, d());
    expect(failed).toMatchObject({ kind: 'failed', unknown: true });
    const changed = { ...QC, assignedGrade: 'GRADE_2' as const };
    await recordReceiptQc(failed.state, changed, d());
    expect(deps.recordQualityCheck).toHaveBeenLastCalledWith(GR, QC);
  });

  it('409 CONFLICT (checked elsewhere) re-reads the receipt and finishes without a second check', async () => {
    deps.recordQualityCheck.mockRejectedValueOnce(problem('CONFLICT', 409));
    deps.getReceipt.mockResolvedValueOnce(receipt({ status: 'ACCEPTED', batchId: 'b-1', batchCode: 'BATCH-2026-000001' }));
    const out = await recordReceiptQc(initialSubmissionState(receipt()), QC, d());
    expect(deps.getReceipt).toHaveBeenCalledWith(GR);
    expect(out).toMatchObject({ kind: 'done', qc: null, receipt: { status: 'ACCEPTED', batchCode: 'BATCH-2026-000001' } });
  });

  it('a 409 on a receipt still awaiting QC is a real failure', async () => {
    const conflict = problem('CONFLICT', 409);
    deps.recordQualityCheck.mockRejectedValueOnce(conflict);
    const out = await recordReceiptQc(initialSubmissionState(receipt()), QC, d());
    expect(out).toMatchObject({ kind: 'failed', unknown: false, error: conflict });
  });
});
