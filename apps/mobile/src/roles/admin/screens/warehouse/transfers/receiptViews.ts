/**
 * Pure views behind Transfer Receiving (design M2-16), on what the
 * /warehouse-transfers API carries and nothing more (no React, so plain-Node
 * vitest covers them):
 *
 *   - the QTY MISMATCH tile: received transfers flagged `hasDiscrepancy`. The
 *     list takes no discrepancy filter, so the tally reads the RECEIVED pages
 *     and is shown only once every row is in (or as "n+" when the bounded read
 *     stops early), never as a partial figure passed off as the total;
 *   - the quantity verification: sent per line and in total (the lines), and
 *     received and difference from what the admin typed;
 *   - the one confirmation before the receive POST;
 *   - the summary after receiving, from the receive response (BR-102): sent,
 *     received, the shortfall, the receipt note and, per line received above
 *     zero, the batch the server created at the destination.
 *
 * Product names: a transfer line carries a crop id but no crop name. The only
 * read that names it is GET /admin/batches/{id} (inventory.batch.view: MAIN
 * all, SUB own), so a batch is read only where the scope reaches its warehouse
 * (BR-30): Main reads the source batches; a Sub admin at the destination
 * reads only the batches created at its own warehouse once received. Without
 * a read the batch code the transfer carries stands in. Batch facts are an
 * allow-list (code and crop name), never the batch's source farmer (BR-16).
 *
 * Not drawn, because the API has nothing behind them (owner decision): an
 * arrival step, per-line damage / spoilage / condition, a reject outcome, a
 * transfer receipt number, resolving the discrepancy, and the initiator's name.
 */
import type { BatchDto } from '../../../api/inventory';
import { t } from '../../../i18n';
import { formatKg, parseKgToGrams } from '../../../money/quantity';
import { TRANSFER_CODES } from './mappers';
import type { PermissionCheck, TransferDetailView, TransferLineView, WarehouseScope } from './types';

// ─── QTY MISMATCH tile ───────────────────────────────────────────────────────

/**
 * The most RECEIVED pages (of the API maximum, 100) the tile reads. A client
 * request bound, not a business threshold: past it the tile says "n+".
 */
export const TALLY_MAX_PAGES = 10;

export interface DiscrepancyTally {
  /** Received transfers flagged hasDiscrepancy among the loaded rows. */
  count: number;
  loaded: number;
  /** Every RECEIVED row is loaded, so `count` is the whole figure. */
  complete: boolean;
}

export function discrepancyTally(
  pages: readonly { items: readonly { hasDiscrepancy: boolean }[]; total: number }[],
): DiscrepancyTally {
  let count = 0;
  let loaded = 0;
  for (const page of pages) {
    loaded += page.items.length;
    for (const item of page.items) if (item.hasDiscrepancy) count += 1;
  }
  const total = pages[0]?.total;
  return { count, loaded, complete: total !== undefined && loaded >= total };
}

/** The tile figure: the count once complete; the placeholder while loading or after an error; "n+" when the read stopped at its bound. */
export function discrepancyTileValue(tally: DiscrepancyTally | undefined, state: { loading: boolean; error: boolean }): string {
  if (tally !== undefined && tally.complete) return String(tally.count);
  if (tally === undefined || state.loading || state.error) return t('transfers.kpi.unknown');
  return t('transfers.receiving.tile.atLeast', { count: tally.count });
}

// ─── Quantity verification and confirmation ──────────────────────────────────

export interface ReceiveTotals {
  sentGrams: number;
  /** Null until every line holds a valid quantity. */
  receivedGrams: number | null;
  /** received - sent (negative = short); null with receivedGrams. */
  differenceGrams: number | null;
}

export function receiveTotals(lines: readonly TransferLineView[], entered: Readonly<Record<string, string>>): ReceiveTotals {
  let sentGrams = 0;
  let receivedGrams: number | null = 0;
  for (const line of lines) {
    sentGrams += line.sentGrams;
    const grams = parseKgToGrams(entered[line.id] ?? '');
    if (receivedGrams !== null) receivedGrams = grams === null || grams < 0 ? null : receivedGrams + grams;
  }
  return { sentGrams, receivedGrams, differenceGrams: receivedGrams === null ? null : receivedGrams - sentGrams };
}

export interface ReceiveConfirmation {
  title: string;
  body: string;
}

/** The dialog before the receive POST: what is received of what was sent, where, and a shortfall to be recorded. */
export function receiveConfirmation(
  transfer: Pick<TransferDetailView, 'code' | 'destinationName' | 'sentGrams'>,
  receivedGrams: number,
): ReceiveConfirmation {
  const parts = [
    t('transfers.confirm.body', {
      code: transfer.code,
      received: formatKg(receivedGrams),
      sent: formatKg(transfer.sentGrams),
      warehouse: transfer.destinationName,
    }),
  ];
  const shortGrams = transfer.sentGrams - receivedGrams;
  if (shortGrams > 0) parts.push(t('transfers.confirm.short', { qty: formatKg(shortGrams) }));
  return { title: t('transfers.confirm.title'), body: parts.join(' ') };
}

// ─── Batch reads (product names, created batches) ────────────────────────────

function reaches(scope: WarehouseScope, warehouseId: string): boolean {
  return scope.warehouseId === undefined || scope.warehouseId === warehouseId;
}

/** The batch ids this scope may read for the transfer's lines (BR-30), sources first. */
export function transferBatchIdsToRead(scope: WarehouseScope, can: PermissionCheck, transfer: TransferDetailView): string[] {
  if (!can(TRANSFER_CODES.batchView)) return [];
  const ids: string[] = [];
  if (reaches(scope, transfer.sourceWarehouseId)) {
    for (const line of transfer.lines) ids.push(line.batchId);
  }
  if (transfer.status === 'RECEIVED' && reaches(scope, transfer.destinationWarehouseId)) {
    for (const line of transfer.lines) if (line.destBatchId !== null) ids.push(line.destBatchId);
  }
  return [...new Set(ids)];
}

/** What a batch read may show here (BR-16 allow-list). */
export interface BatchFacts {
  batchCode: string;
  cropName: string | undefined;
}

export function batchFacts(dto: BatchDto): BatchFacts {
  return { batchCode: dto.batchCode, cropName: dto.cropName };
}

/** The line's crop name from a source or destination batch read; undefined when no read carried one. */
export function lineProductName(line: TransferLineView, facts: ReadonlyMap<string, BatchFacts>): string | undefined {
  const fromSource = facts.get(line.batchId)?.cropName;
  if (fromSource !== undefined) return fromSource;
  return line.destBatchId === null ? undefined : facts.get(line.destBatchId)?.cropName;
}

// ─── Summary after receiving ─────────────────────────────────────────────────

export interface TransferReceiptLine {
  id: string;
  product: string | undefined;
  sourceBatchCode: string;
  gradeLabel: string;
  sentGrams: number;
  receivedGrams: number;
  /** The destination batch the receipt created (code only when a read carried it); null when 0 was received. */
  newBatch: { id: string; code: string | undefined } | null;
}

export interface TransferReceiptSummary {
  code: string;
  sourceName: string;
  destinationName: string;
  sentGrams: number;
  receivedGrams: number;
  /** Total short (positive grams), from the server's per-line variance; 0 for a full receipt. */
  discrepancyGrams: number;
  receiptNote: string | null;
  receivedAt: string | null;
  lines: TransferReceiptLine[];
}

/** The summary of a RECEIVED transfer; null for any other status. */
export function transferReceiptSummary(view: TransferDetailView, facts: ReadonlyMap<string, BatchFacts>): TransferReceiptSummary | null {
  if (view.status !== 'RECEIVED') return null;
  let receivedGrams = 0;
  let discrepancyGrams = 0;
  const lines: TransferReceiptLine[] = [];
  for (const line of view.lines) {
    const got = line.receivedGrams ?? 0;
    receivedGrams += got;
    if (line.varianceGrams !== null && line.varianceGrams < 0) discrepancyGrams -= line.varianceGrams;
    lines.push({
      id: line.id,
      product: lineProductName(line, facts),
      sourceBatchCode: line.batchCode,
      gradeLabel: line.gradeLabel,
      sentGrams: line.sentGrams,
      receivedGrams: got,
      newBatch: line.destBatchId === null ? null : { id: line.destBatchId, code: facts.get(line.destBatchId)?.batchCode },
    });
  }
  return {
    code: view.code,
    sourceName: view.sourceName,
    destinationName: view.destinationName,
    sentGrams: view.sentGrams,
    receivedGrams,
    discrepancyGrams,
    receiptNote: view.receiptNote,
    receivedAt: view.receivedAt,
    lines,
  };
}
