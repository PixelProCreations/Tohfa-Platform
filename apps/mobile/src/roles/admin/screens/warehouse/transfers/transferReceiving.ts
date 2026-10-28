/**
 * Pure decisions behind Transfer Receiving (design M2-16) and the transfer
 * detail / inspection screens it opens, on what the /warehouse-transfers API
 * carries and nothing more. No React, so plain-Node vitest covers every branch
 * (../../../tests/transfer_receiving_m216.test.ts).
 *
 * Weights are integer grams: the API's kg strings are read as text
 * (parseKgToGrams) and written back with gramsToKgString, never through
 * parseFloat. A value the API does not carry is left undefined / null so the
 * screen hides it; it is never a sample value or a 0.
 *
 * Scope (BR-30): a Sub admin lists only the transfers INBOUND to its own
 * warehouse (the ones it can receive) and can name only its own warehouse
 * (GET /warehouses needs warehouse.all.view, which Sub does not hold). Main
 * lists every warehouse's transfers and names them from GET /warehouses.
 *
 * Not modelled, because the API has nothing behind them (owner decision):
 * an ARRIVED status or arrival step, a "receiving pending" state distinct
 * from IN_TRANSIT, a quality check, accept / partial accept / reject, and a
 * discrepancy resolution. The BR-126 receive details (receipt number,
 * initiator name, per-line damage / spoilage / condition / actual grade and
 * product, storage location) exist on the newest contract but are not wired
 * yet (orchestrator decision).
 */
import { bodyFingerprint } from '../../../api/hookHelpers';
import type { Grade } from '../../../api/inventory';
import type { WarehouseTransferDetailDto, WarehouseTransferReceive } from '../../../api/transfers';
import type { TransferStatus, WarehouseTransferDto } from '../../../api/warehouseTransfers';
import { t, type TranslationKey } from '../../../i18n';
import { formatKg, gramsToKgString, parseKgToGrams } from '../../../money/quantity';
import type { AdminTone } from '../../../theme';
import { createIdempotencyKeyCache, newIdempotencyKey } from '../../../../../shell/api/idempotency';
import { gradeLabel, isOutcomeUnknown } from '../receiving-qc/mappers';
import type { PermissionCheck, WarehouseScope } from './types';

/** docs/rbac.json codes the receiving side of the transfer screens checks. */
export const TRANSFER_RECEIVING_CODES = {
  /** List and read transfers. SA/TOHFA/MAIN all, SUB own. */
  view: 'transfer.inter_warehouse.view',
  /** Receive at the destination. SA, TOHFA, MAIN, SUB all (the server confines it to the destination). */
  receive: 'transfer.inter_warehouse.receive',
  /** GET /admin/batches/{id}, for a line's crop name and a created batch's code. MAIN all, SUB own. */
  batchView: 'inventory.batch.view',
  /** GET /warehouses, for warehouse names. MAIN all, SUB none. */
  warehouseList: 'warehouse.all.view',
} as const;

/** API validation limit of `receiptNote` (WarehouseTransferReceive), not a business threshold. */
export const RECEIPT_NOTE_MAX = 1000;

// ─── Scope and naming ────────────────────────────────────────────────────────

/**
 * What the incoming list sends (BR-30). Sub: its own warehouse as the
 * destination. Main: nothing (every warehouse); `direction` without a
 * `warehouseId` is a 422, so it is never sent alone.
 */
export function inboundTransferScopeParams(scope: WarehouseScope): { warehouseId?: string; direction?: 'INBOUND' } {
  if (scope.warehouseId === undefined) return {};
  return { warehouseId: scope.warehouseId, direction: 'INBOUND' };
}

/** Where a warehouse name can come from for this viewer. */
export interface TransferNaming {
  /** Main: every warehouse from GET /warehouses. */
  names: ReadonlyMap<string, string>;
  /** Sub: its own warehouse only. */
  ownId?: string | undefined;
  ownName?: string | undefined;
}

export function transferNamingOf(
  scope: WarehouseScope,
  options: readonly { warehouseId?: string | undefined; warehouseName?: string | undefined }[],
): TransferNaming {
  const names = new Map<string, string>();
  for (const o of options) if (o.warehouseId && o.warehouseName) names.set(o.warehouseId, o.warehouseName);
  return { names, ownId: scope.warehouseId, ownName: scope.warehouseName };
}

/** A warehouse's name, or undefined when this viewer cannot know it (the screen hides it). */
export function transferWarehouseName(warehouseId: string, naming: TransferNaming): string | undefined {
  const known = naming.names.get(warehouseId);
  if (known !== undefined) return known;
  return naming.ownId !== undefined && naming.ownId === warehouseId && naming.ownName ? naming.ownName : undefined;
}

// ─── Status ──────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<TransferStatus, TranslationKey> = {
  PENDING_APPROVAL: 'transfers.status.PENDING_APPROVAL',
  IN_TRANSIT: 'transfers.status.IN_TRANSIT',
  RECEIVED: 'transfers.status.RECEIVED',
  CANCELLED: 'transfers.status.CANCELLED',
};

const STATUS_TONE: Record<TransferStatus, AdminTone> = {
  PENDING_APPROVAL: 'warning',
  IN_TRANSIT: 'info',
  RECEIVED: 'success',
  CANCELLED: 'danger',
};

function knownStatus(status: string): status is TransferStatus {
  return Object.prototype.hasOwnProperty.call(STATUS_LABEL, status);
}

export function transferStatusLabel(status: string): string {
  return knownStatus(status) ? t(STATUS_LABEL[status]) : t('transfers.status.unknown');
}

export function transferStatusTone(status: string): AdminTone {
  return knownStatus(status) ? STATUS_TONE[status] : 'info';
}

// ─── API -> view ─────────────────────────────────────────────────────────────

/** One transfer header as the receiving screens show it. */
export interface LiveTransferRow {
  id: string;
  /** e.g. TRF-000284. */
  code: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  /** Undefined when the viewer cannot name it (Sub: any warehouse but its own). */
  sourceName: string | undefined;
  destinationName: string | undefined;
  status: TransferStatus;
  statusLabel: string;
  statusTone: AdminTone;
  /** Some line was received short (set by the server on receipt). */
  hasDiscrepancy: boolean;
  vehicleNumber: string | undefined;
}

export function toLiveTransferRow(dto: WarehouseTransferDto, naming: TransferNaming): LiveTransferRow {
  return {
    id: dto.id,
    code: dto.transferNumber,
    sourceWarehouseId: dto.fromWarehouseId,
    destinationWarehouseId: dto.toWarehouseId,
    sourceName: transferWarehouseName(dto.fromWarehouseId, naming),
    destinationName: transferWarehouseName(dto.toWarehouseId, naming),
    status: dto.status,
    statusLabel: transferStatusLabel(dto.status),
    statusTone: transferStatusTone(dto.status),
    hasDiscrepancy: dto.hasDiscrepancy,
    vehicleNumber: dto.vehicleNumber?.trim() ? dto.vehicleNumber.trim() : undefined,
  };
}

export interface LiveTransferLine {
  id: string;
  batchId: string;
  batchCode: string;
  gradeLabel: string;
  /** Null only for a value that is not a Quantity (never seen from the server). */
  sentGrams: number | null;
  receivedGrams: number | null;
  varianceGrams: number | null;
  destBatchId: string | null;
}

export interface LiveTransferDetail extends LiveTransferRow {
  lines: LiveTransferLine[];
  /** Sum of the lines; null when any is unknown. */
  sentGrams: number | null;
  /** Sum of the lines once every line is received; null before. */
  receivedGrams: number | null;
  /** Sum of the server's per-line variance (zero or negative); null until received. */
  varianceGrams: number | null;
  requiresApproval: boolean;
  approvedAt: string | undefined;
  dispatchedAt: string | undefined;
  receivedAt: string | undefined;
}

function gramsOf(value: string | null): number | null {
  return value === null ? null : parseKgToGrams(value);
}

function sumOrNull(values: readonly (number | null)[]): number | null {
  let total = 0;
  for (const v of values) {
    if (v === null) return null;
    total += v;
  }
  return total;
}

function present(value: string | null): string | undefined {
  return value === null || value === '' ? undefined : value;
}

export function toLiveTransferDetail(dto: WarehouseTransferDetailDto, naming: TransferNaming): LiveTransferDetail {
  const lines: LiveTransferLine[] = dto.lines.map((l) => ({
    id: l.id,
    batchId: l.batchId,
    batchCode: l.batchCode,
    gradeLabel: gradeLabel(l.grade as Grade),
    sentGrams: gramsOf(l.qtySentKg),
    receivedGrams: gramsOf(l.qtyReceivedKg),
    varianceGrams: gramsOf(l.varianceKg),
    destBatchId: l.destBatchId,
  }));
  return {
    ...toLiveTransferRow(dto, naming),
    lines,
    sentGrams: lines.length === 0 ? null : sumOrNull(lines.map((l) => l.sentGrams)),
    receivedGrams: lines.length === 0 ? null : sumOrNull(lines.map((l) => l.receivedGrams)),
    varianceGrams: lines.length === 0 ? null : sumOrNull(lines.map((l) => l.varianceGrams)),
    requiresApproval: dto.requiresApproval,
    approvedAt: present(dto.approvedAt),
    dispatchedAt: present(dto.dispatchedAt),
    receivedAt: present(dto.receivedAt),
  };
}

/** A transfer card's meta line "TRF-000284 · Carrot Grade 1 — 200 kg"; an unknown product or quantity is left out. */
export function transferRowMeta(code: string, product: string | undefined, sentGrams: number | undefined): string {
  let out = code;
  if (product !== undefined) out += ` · ${product}`;
  if (sentGrams !== undefined) out += ` — ${formatKg(sentGrams)}`;
  return out;
}

/** "Kotagiri → Coonoor", or undefined when either side cannot be named. */
export function transferRouteText(row: Pick<LiveTransferRow, 'sourceName' | 'destinationName'>): string | undefined {
  if (row.sourceName === undefined || row.destinationName === undefined) return undefined;
  return t('transfers.route', { source: row.sourceName, destination: row.destinationName });
}

/**
 * Receive gate (display only; the server enforces it again): the receive
 * code, an IN_TRANSIT transfer, and a destination the scope covers (a Sub
 * admin of the source is refused with WAREHOUSE_SCOPE_VIOLATION).
 */
export function canReceiveTransfer(
  scope: WarehouseScope,
  can: PermissionCheck,
  transfer: { status: TransferStatus; destinationWarehouseId: string },
): boolean {
  return (
    transfer.status === 'IN_TRANSIT' &&
    can(TRANSFER_RECEIVING_CODES.receive) &&
    (scope.warehouseId === undefined || scope.warehouseId === transfer.destinationWarehouseId)
  );
}

// ─── KPI strip ───────────────────────────────────────────────────────────────

export interface MismatchTally {
  count: number;
  /** Every RECEIVED row was read, so `count` is the whole figure. */
  complete: boolean;
}

/** QTY MISMATCH: RECEIVED transfers flagged hasDiscrepancy (the list takes no discrepancy filter). */
export function mismatchTally(items: readonly { hasDiscrepancy: boolean }[], total: number): MismatchTally {
  let count = 0;
  for (const item of items) if (item.hasDiscrepancy) count += 1;
  return { count, complete: items.length >= total };
}

/** The tile figure: blank while unknown, the count when complete, "n+" when the bounded read stopped early. */
export function mismatchTileLabel(tally: MismatchTally | undefined): string {
  if (tally === undefined) return '';
  return tally.complete ? String(tally.count) : t('transfers.receiving.tile.atLeast', { count: tally.count });
}

/** A count tile: blank while unknown (loading or failed), never a 0 that is not known. */
export function kpiCountLabel(count: number | undefined): string {
  return count === undefined ? '' : String(count);
}

/** The Main header line "Coonoor ← Kotagiri, and other …" from the first arrival both of whose sides are known. */
export function receivingRouteSubtitle(rows: readonly LiveTransferRow[]): string | undefined {
  const named = rows.find((r) => r.sourceName !== undefined && r.destinationName !== undefined);
  if (named === undefined || named.sourceName === undefined || named.destinationName === undefined) return undefined;
  return t('transfers.receiving.routeSubtitle', { destination: named.destinationName, source: named.sourceName });
}

// ─── Product names (BR-16 allow-list, BR-30 reads) ───────────────────────────

/**
 * A line carries a crop id but no crop name. The only read that names it is
 * GET /admin/batches/{id} (inventory.batch.view: MAIN all, SUB own), so a
 * source batch is read only when the scope reaches the source warehouse:
 * Main does; a Sub admin at the destination does not (it would be a 404).
 */
export function sourceBatchIdsToRead(scope: WarehouseScope, can: PermissionCheck, detail: LiveTransferDetail): string[] {
  if (!can(TRANSFER_RECEIVING_CODES.batchView)) return [];
  if (scope.warehouseId !== undefined && scope.warehouseId !== detail.sourceWarehouseId) return [];
  return [...new Set(detail.lines.map((l) => l.batchId))];
}

/** The batches the receipt created at the destination, readable by a scope that reaches it. */
export function destBatchIdsToRead(scope: WarehouseScope, can: PermissionCheck, detail: LiveTransferDetail): string[] {
  if (!can(TRANSFER_RECEIVING_CODES.batchView) || detail.status !== 'RECEIVED') return [];
  if (scope.warehouseId !== undefined && scope.warehouseId !== detail.destinationWarehouseId) return [];
  const ids: string[] = [];
  for (const l of detail.lines) if (l.destBatchId !== null) ids.push(l.destBatchId);
  return [...new Set(ids)];
}

/** "Carrot Grade 1, Beetroot Grade 2" when every line's crop is known; undefined (hidden) otherwise. */
export function transferProductLabel(detail: Pick<LiveTransferDetail, 'lines'>, cropNames: ReadonlyMap<string, string>): string | undefined {
  if (detail.lines.length === 0) return undefined;
  const labels: string[] = [];
  for (const l of detail.lines) {
    const crop = cropNames.get(l.batchId);
    if (crop === undefined) return undefined;
    const label = l.gradeLabel === '' ? crop : `${crop} ${l.gradeLabel}`;
    if (!labels.includes(label)) labels.push(label);
  }
  return labels.join(', ');
}

// ─── Quantity verification and the receive body (BR-102) ─────────────────────

/** Grams as editable kg text without trailing zeros: 200000 -> "200", 12500 -> "12.5". */
function kgInputText(grams: number): string {
  return gramsToKgString(grams).replace(/\.?0+$/, '');
}

/** Each line starts at the quantity sent (the existing screen pre-filled the sent quantity). */
export function initialReceivedEntries(lines: readonly LiveTransferLine[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const l of lines) out[l.id] = l.sentGrams === null ? '' : kgInputText(l.sentGrams);
  return out;
}

export interface ReceiveFigures {
  sentGrams: number | null;
  /** Null until every line holds a valid quantity. */
  receivedGrams: number | null;
  /** received - sent (negative = short); null with receivedGrams. */
  differenceGrams: number | null;
  /** Total short across the lines typed so far (positive grams). */
  shortGrams: number;
}

export function receiveFigures(lines: readonly LiveTransferLine[], entered: Readonly<Record<string, string>>): ReceiveFigures {
  const sentGrams = sumOrNull(lines.map((l) => l.sentGrams));
  let receivedGrams: number | null = 0;
  let shortGrams = 0;
  for (const l of lines) {
    const got = parseKgToGrams(entered[l.id] ?? '');
    const valid = got !== null && got >= 0;
    if (valid && l.sentGrams !== null && got < l.sentGrams) shortGrams += l.sentGrams - got;
    receivedGrams = receivedGrams !== null && valid ? receivedGrams + got : null;
  }
  return {
    sentGrams,
    receivedGrams,
    differenceGrams: receivedGrams === null || sentGrams === null ? null : receivedGrams - sentGrams,
    shortGrams,
  };
}

export type ReceiveProblem = 'QTY_INVALID' | 'QTY_ABOVE_SENT' | 'NOTE_REQUIRED' | 'NOTE_TOO_LONG';

export const RECEIVE_PROBLEM_KEY: Record<ReceiveProblem, TranslationKey> = {
  QTY_INVALID: 'transfers.inspection.problem.QTY_INVALID',
  QTY_ABOVE_SENT: 'transfers.inspection.problem.QTY_ABOVE_SENT',
  NOTE_REQUIRED: 'transfers.inspection.problem.NOTE_REQUIRED',
  NOTE_TOO_LONG: 'transfers.inspection.problem.NOTE_TOO_LONG',
};

export type ReceiveDraftResult =
  | { ok: true; body: WarehouseTransferReceive; shortGrams: number }
  | { ok: false; problem: ReceiveProblem; lineId?: string };

/**
 * POST .../receive body: EVERY line exactly once, 0 to the quantity sent, as
 * a kg string; and a receipt note as soon as any line is short (BR-102: the
 * shortfall is recorded, not written off). These checks only stop a body the
 * server would refuse with 422; the server is the authority.
 */
export function buildTransferReceiveBody(
  lines: readonly LiveTransferLine[],
  entered: Readonly<Record<string, string>>,
  receiptNote: string,
): ReceiveDraftResult {
  const out: WarehouseTransferReceive['lines'] = [];
  let shortGrams = 0;
  for (const l of lines) {
    const got = parseKgToGrams(entered[l.id] ?? '');
    if (got === null || got < 0 || l.sentGrams === null) return { ok: false, problem: 'QTY_INVALID', lineId: l.id };
    if (got > l.sentGrams) return { ok: false, problem: 'QTY_ABOVE_SENT', lineId: l.id };
    shortGrams += l.sentGrams - got;
    out.push({ itemId: l.id, qtyReceivedKg: gramsToKgString(got) });
  }
  const note = receiptNote.trim();
  if (note.length > RECEIPT_NOTE_MAX) return { ok: false, problem: 'NOTE_TOO_LONG' };
  if (shortGrams > 0 && note === '') return { ok: false, problem: 'NOTE_REQUIRED' };
  return { ok: true, body: note === '' ? { lines: out } : { lines: out, receiptNote: note }, shortGrams };
}

// ─── Idempotency and replay (BR-118, root CLAUDE.md 2.4) ─────────────────────

export interface TransferReceiveKeys {
  /** The same transfer and body reuse their key; a changed body gets a new one. */
  keyFor: (transferId: string, body: WarehouseTransferReceive) => string;
  reset: () => void;
}

export function createTransferReceiveKeys(generate: () => string = newIdempotencyKey): TransferReceiveKeys {
  const cache = createIdempotencyKeyCache(generate);
  return {
    keyFor: (transferId, body) => cache.keyFor(bodyFingerprint({ transferId, body })),
    reset: () => cache.reset(),
  };
}

export interface ReceiveSessionState {
  /** A receive whose outcome is unknown (timeout, no answer, 5xx): replayed exactly as sent. */
  held: { transferId: string; body: WarehouseTransferReceive } | null;
}

export type ReceiveOutcome =
  | { kind: 'done'; state: ReceiveSessionState; transfer: WarehouseTransferDetailDto }
  | { kind: 'failed'; state: ReceiveSessionState; error: unknown; unknown: boolean };

/**
 * One receive attempt. WHY the held body: the server replays a key only for
 * the SAME body (another body under the key is 409 IDEMPOTENCY_KEY_REUSED),
 * so after an outcome that may have been written the exact body is resent
 * with its key, even if the admin edited the form in between. A refused write
 * (4xx) wrote nothing and is not held.
 */
export async function submitTransferReceive(
  state: ReceiveSessionState,
  transferId: string,
  body: WarehouseTransferReceive,
  deps: { receive: (id: string, body: WarehouseTransferReceive, idempotencyKey: string) => Promise<WarehouseTransferDetailDto> },
  keys: TransferReceiveKeys,
): Promise<ReceiveOutcome> {
  const held = state.held !== null && state.held.transferId === transferId ? state.held : null;
  const sent = held?.body ?? body;
  try {
    const transfer = await deps.receive(transferId, sent, keys.keyFor(transferId, sent));
    keys.reset();
    return { kind: 'done', state: { held: null }, transfer };
  } catch (error) {
    const unknown = isOutcomeUnknown(error);
    return { kind: 'failed', state: { held: unknown ? { transferId, body: sent } : null }, error, unknown };
  }
}

// ─── Summary after receiving ─────────────────────────────────────────────────

export interface TransferReceiptSummary {
  code: string;
  sourceName: string | undefined;
  destinationName: string | undefined;
  sentGrams: number | null;
  receivedGrams: number | null;
  /** Total short (positive grams) from the server's variance; null when unknown. */
  discrepancyGrams: number | null;
  /** Codes of the destination batches, only those a batch read returned. */
  batchCodes: string[];
}

/** The summary of a RECEIVED transfer; null for any other status. */
export function transferReceiptSummary(
  detail: LiveTransferDetail,
  destBatchCodes: ReadonlyMap<string, string>,
): TransferReceiptSummary | null {
  if (detail.status !== 'RECEIVED') return null;
  const batchCodes: string[] = [];
  for (const l of detail.lines) {
    const code = l.destBatchId === null ? undefined : destBatchCodes.get(l.destBatchId);
    if (code !== undefined) batchCodes.push(code);
  }
  return {
    code: detail.code,
    sourceName: detail.sourceName,
    destinationName: detail.destinationName,
    sentGrams: detail.sentGrams,
    receivedGrams: detail.receivedGrams,
    discrepancyGrams: detail.varianceGrams === null ? null : -detail.varianceGrams,
    batchCodes,
  };
}

/** One text line per known figure, for the confirmation shown after the receive. */
export function receiptSummaryLines(summary: TransferReceiptSummary): string[] {
  const out = [t('transfers.summary.transfer', { value: summary.code })];
  if (summary.sourceName !== undefined && summary.destinationName !== undefined) {
    out.push(t('transfers.summary.route', { source: summary.sourceName, destination: summary.destinationName }));
  }
  if (summary.sentGrams !== null) out.push(t('transfers.summary.sent', { value: formatKg(summary.sentGrams) }));
  if (summary.receivedGrams !== null) out.push(t('transfers.summary.received', { value: formatKg(summary.receivedGrams) }));
  if (summary.discrepancyGrams !== null) {
    out.push(t('transfers.summary.discrepancy', { value: formatKg(summary.discrepancyGrams) }));
  }
  if (summary.batchCodes.length > 0) out.push(t('transfers.summary.batch', { value: summary.batchCodes.join(', ') }));
  return out;
}

// ─── Progress steps (from the server's timestamps) ───────────────────────────

export type MainTrackingKey = 'created' | 'dispatched' | 'inTransit' | 'receiving' | 'quantityVerification' | 'completed';

const MAIN_TRACKING_LABEL: Record<MainTrackingKey, TranslationKey> = {
  created: 'transfers.tracking.created',
  dispatched: 'transfers.tracking.dispatched',
  inTransit: 'transfers.tracking.inTransit',
  receiving: 'transfers.tracking.receiving',
  quantityVerification: 'transfers.tracking.quantityVerification',
  completed: 'transfers.tracking.completed',
};

/**
 * The Main detail's Tracking list. The design's Arrived, Quality Check and
 * Accept / Partial / Reject steps are left out: the API has no arrival
 * status, no transfer quality check and no decision (receiving records the
 * quantities). Receiving and Quantity Verification are the receive itself.
 */
export function mainTrackingSteps(detail: LiveTransferDetail): { key: MainTrackingKey; label: string; completed: boolean }[] {
  const dispatched = detail.dispatchedAt !== undefined;
  const received = detail.receivedAt !== undefined || detail.status === 'RECEIVED';
  const done: Record<MainTrackingKey, boolean> = {
    created: true,
    dispatched,
    inTransit: dispatched,
    receiving: received,
    quantityVerification: received,
    completed: detail.status === 'RECEIVED',
  };
  return (Object.keys(MAIN_TRACKING_LABEL) as MainTrackingKey[]).map((key) => ({
    key,
    label: t(MAIN_TRACKING_LABEL[key]),
    completed: done[key],
  }));
}

export type SubProgressKey = 'requested' | 'approval' | 'dispatched' | 'inTransit' | 'received';

const SUB_PROGRESS_LABEL: Record<SubProgressKey, TranslationKey> = {
  requested: 'transfers.progress.requested',
  approval: 'transfers.progress.approval',
  dispatched: 'transfers.progress.dispatched',
  inTransit: 'transfers.progress.inTransit',
  received: 'transfers.progress.received',
};

/** The Sub detail's Transfer Progress. The approval step only when the transfer needed one; no arrival step (no API). */
export function subProgressSteps(detail: LiveTransferDetail): { key: SubProgressKey; label: string; done: boolean }[] {
  const dispatched = detail.dispatchedAt !== undefined;
  const steps: { key: SubProgressKey; done: boolean }[] = [{ key: 'requested', done: true }];
  if (detail.requiresApproval) steps.push({ key: 'approval', done: detail.approvedAt !== undefined });
  steps.push({ key: 'dispatched', done: dispatched });
  steps.push({ key: 'inTransit', done: dispatched });
  steps.push({ key: 'received', done: detail.receivedAt !== undefined || detail.status === 'RECEIVED' });
  return steps.map((s) => ({ ...s, label: t(SUB_PROGRESS_LABEL[s.key]) }));
}
