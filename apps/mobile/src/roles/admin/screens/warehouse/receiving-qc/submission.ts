/**
 * The Goods Receiving wizard's two writes, in two phases:
 *
 *   1. ensureReceipt   POST /admin/goods-receipts once the received weight is
 *                      known. The receipt starts AWAITING_QC and its GRN is
 *                      real from here on (Summary, Preview, Discrepancies).
 *   2. recordReceiptQc POST /admin/goods-receipts/{id}/quality-check. BR-106:
 *                      this one call stocks the accepted goods as ONE batch
 *                      and copies the storage location onto it, so there is
 *                      no batch or location write after it.
 *
 * WHY the "held" bodies: the server honours the Idempotency-Key (BR-118), so a
 * replay of the same key and body returns the original answer and writes
 * nothing. That protects a retry only when the retry sends the SAME body (the
 * key ring keys by body). So after an outcome that may have been written
 * (timeout, no answer, 5xx) the exact body is held and replayed, even if the
 * admin edited the form in between; a refused write (4xx) wrote nothing and
 * is not held. A receipt this order already has awaiting QC is resumed, never
 * recorded again.
 *
 * Pure apart from the injected calls (`deps`, which carry the keys), so
 * plain-Node vitest drives every path (../../../tests/receiving_submission.test.ts).
 */
import { ApiError } from '../../../../../shell/api/client';
import type { GoodsReceiptCreate, GoodsReceiptDto, QualityCheckCreate, QualityCheckResultDto } from '../../../api/receiving';
import { isOutcomeUnknown } from './mappers';

export interface SubmissionState {
  /** The receipt this session created or resumed; null until there is one. */
  receipt: GoodsReceiptDto | null;
  /** A create whose outcome is unknown: replayed as is. */
  heldCreate: GoodsReceiptCreate | null;
  /** A quality check whose outcome is unknown: replayed as is. */
  heldQc: QualityCheckCreate | null;
  /** The recorded check's answer (with the batch, BR-106); null until recorded. */
  qc: QualityCheckResultDto | null;
  /** True once the receipt has its quality check (also when it was recorded elsewhere). */
  qcDone: boolean;
}

/** Start state; a receipt of the order still awaiting QC is resumed. */
export function initialSubmissionState(pendingReceipt?: GoodsReceiptDto | undefined): SubmissionState {
  return { receipt: pendingReceipt ?? null, heldCreate: null, heldQc: null, qc: null, qcDone: false };
}

export interface SubmissionDeps {
  createReceipt: (body: GoodsReceiptCreate) => Promise<GoodsReceiptDto>;
  getReceipt: (id: string) => Promise<GoodsReceiptDto>;
  recordQualityCheck: (receiptId: string, body: QualityCheckCreate) => Promise<QualityCheckResultDto>;
}

export type ReceiptOutcome =
  | { kind: 'done'; state: SubmissionState; receipt: GoodsReceiptDto }
  | { kind: 'failed'; state: SubmissionState; error: unknown; unknown: boolean };

export async function ensureReceipt(state: SubmissionState, body: GoodsReceiptCreate, deps: Pick<SubmissionDeps, 'createReceipt'>): Promise<ReceiptOutcome> {
  if (state.receipt !== null) return { kind: 'done', state, receipt: state.receipt };
  const sent = state.heldCreate ?? body;
  try {
    const receipt = await deps.createReceipt(sent);
    const next = { ...state, receipt, heldCreate: null };
    return { kind: 'done', state: next, receipt };
  } catch (error) {
    const unknown = isOutcomeUnknown(error);
    return { kind: 'failed', state: { ...state, heldCreate: unknown ? sent : null }, error, unknown };
  }
}

export type QcOutcome =
  | { kind: 'done'; state: SubmissionState; receipt: GoodsReceiptDto; qc: QualityCheckResultDto | null }
  | { kind: 'failed'; state: SubmissionState; error: unknown; unknown: boolean };

function isConflict(error: unknown): boolean {
  return error instanceof ApiError && error.problem.status === 409 && error.problem.code === 'CONFLICT';
}

/** Phase 2; throws when there is no receipt yet (a caller bug, not a server answer). */
export async function recordReceiptQc(state: SubmissionState, body: QualityCheckCreate, deps: SubmissionDeps): Promise<QcOutcome> {
  const receipt = state.receipt;
  if (receipt === null) throw new Error('recordReceiptQc: no receipt yet; call ensureReceipt first');
  if (state.qcDone) return { kind: 'done', state, receipt, qc: state.qc };
  const sent = state.heldQc ?? body;
  try {
    const qc = await deps.recordQualityCheck(receipt.id, sent);
    return { kind: 'done', state: { ...state, heldQc: null, qc, qcDone: true }, receipt, qc };
  } catch (error) {
    if (isConflict(error)) {
      // The receipt already has a check (another session): read what it is now.
      try {
        const current = await deps.getReceipt(receipt.id);
        if (current.status !== 'AWAITING_QC') {
          return { kind: 'done', state: { ...state, receipt: current, heldQc: null, qcDone: true }, receipt: current, qc: null };
        }
      } catch {
        // Fall through: report the conflict itself.
      }
      return { kind: 'failed', state: { ...state, heldQc: null }, error, unknown: false };
    }
    const unknown = isOutcomeUnknown(error);
    return { kind: 'failed', state: { ...state, heldQc: unknown ? sent : null }, error, unknown };
  }
}
