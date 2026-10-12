/**
 * The wizard's submit: record the goods receipt, then its quality check, so
 * that no retry can record the same delivery twice.
 *
 * WHY this is more than two calls: docs/openapi.yaml asks for an
 * Idempotency-Key on both writes and the app sends one, but the server ignores
 * it today (server gap). A create that times out may still have been written,
 * and a blind retry would then make a second receipt for the same lorry. So:
 *  - the created receipt is kept in the state, and a failed quality check
 *    retries only the quality check on that receipt;
 *  - after a create whose outcome is unknown (timeout, network, 5xx) the next
 *    attempt first re-reads the order's receipts and resumes a receipt that now
 *    exists (findCreatedReceipt), and only creates when there is none;
 *  - after a quality check whose outcome is unknown the next attempt re-reads
 *    the receipt, and stops if it is no longer awaiting QC (the check landed);
 *  - an order that already has a receipt awaiting QC (another session, or a
 *    crash after the create) starts from that receipt and never creates.
 *
 * Pure apart from the injected calls (`deps`), so plain-Node vitest drives
 * every path (../../../tests/mappers_receiving.test.ts). The wizard holds the
 * state between attempts and passes calls that carry its Idempotency-Keys.
 */
import type { GoodsReceiptCreate, GoodsReceiptDto, QualityCheckCreate, QualityCheckResultDto } from '../../../api/receiving';
import { findCreatedReceipt, isOutcomeUnknown } from './mappers';

export interface SubmissionState {
  /** The receipt this session created or resumed; null until there is one. */
  receipt: GoodsReceiptDto | null;
  /** Receipts the order had before our first create, so a re-read can tell ours apart. */
  knownReceiptIds: readonly string[];
  /** The last create failed in a way that may still have written it. */
  createUnknown: boolean;
  /** The last quality check failed in a way that may still have written it. */
  qcUnknown: boolean;
}

/** Start state: the order's existing receipt ids, and a receipt awaiting QC to resume, if any. */
export function initialSubmissionState(
  knownReceiptIds: readonly string[],
  pendingReceipt?: GoodsReceiptDto | undefined,
): SubmissionState {
  return { receipt: pendingReceipt ?? null, knownReceiptIds, createUnknown: false, qcUnknown: false };
}

export interface SubmissionDeps {
  createReceipt: (body: GoodsReceiptCreate) => Promise<GoodsReceiptDto>;
  receiptsOfPurchaseOrder: (purchaseOrderId: string) => Promise<readonly GoodsReceiptDto[]>;
  getReceipt: (id: string) => Promise<GoodsReceiptDto>;
  recordQualityCheck: (receiptId: string, body: QualityCheckCreate) => Promise<QualityCheckResultDto>;
}

export interface SubmissionInput {
  purchaseOrderId: string;
  createBody: GoodsReceiptCreate;
  /** null when the admin may record the receipt but not its quality check. */
  qcBody: QualityCheckCreate | null;
}

export type SubmissionStage = 'create' | 'verify' | 'qc';

export type SubmissionOutcome =
  | { kind: 'done'; state: SubmissionState; receipt: GoodsReceiptDto; qc: QualityCheckResultDto | null }
  | { kind: 'failed'; state: SubmissionState; stage: SubmissionStage; error: unknown };

export async function submitReceiving(
  initial: SubmissionState,
  input: SubmissionInput,
  deps: SubmissionDeps,
): Promise<SubmissionOutcome> {
  let state = initial;

  if (state.receipt === null) {
    if (state.createUnknown) {
      let receipts: readonly GoodsReceiptDto[];
      try {
        receipts = await deps.receiptsOfPurchaseOrder(input.purchaseOrderId);
      } catch (error) {
        // Still unknown: creating now could duplicate, so nothing is written.
        return { kind: 'failed', state, stage: 'verify', error };
      }
      const found = findCreatedReceipt(state.knownReceiptIds, receipts, input.createBody);
      state = { ...state, receipt: found ?? null, createUnknown: false };
    }
    if (state.receipt === null) {
      try {
        const created = await deps.createReceipt(input.createBody);
        state = { ...state, receipt: created, createUnknown: false };
      } catch (error) {
        return { kind: 'failed', state: { ...state, createUnknown: isOutcomeUnknown(error) }, stage: 'create', error };
      }
    }
  }

  const receipt = state.receipt;
  if (receipt === null) throw new Error('unreachable: no receipt after create');
  if (input.qcBody === null) return { kind: 'done', state, receipt, qc: null };

  if (state.qcUnknown) {
    let current: GoodsReceiptDto;
    try {
      current = await deps.getReceipt(receipt.id);
    } catch (error) {
      return { kind: 'failed', state, stage: 'verify', error };
    }
    state = { ...state, receipt: current, qcUnknown: false };
    if (current.status !== 'AWAITING_QC') return { kind: 'done', state, receipt: current, qc: null };
  }

  try {
    const qc = await deps.recordQualityCheck(receipt.id, input.qcBody);
    return { kind: 'done', state, receipt, qc };
  } catch (error) {
    return { kind: 'failed', state: { ...state, qcUnknown: isOutcomeUnknown(error) }, stage: 'qc', error };
  }
}
