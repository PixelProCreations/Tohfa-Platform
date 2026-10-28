/**
 * Pure decisions behind the transfer screens (no React, no react-native), so
 * plain-Node vitest covers them: API -> view mapping, the permission gating of
 * every action, the list scope, and the two request bodies (initiate, receive)
 * with their client-side checks.
 *
 * Quantities: the API speaks kg decimal strings; everything here is integer
 * grams (money/quantity.ts), and money integer paise. The bodies sent back are
 * kg strings again (gramsToKgString), never a float.
 *
 * The client checks only stop a form the server would refuse with 422; the
 * server (warehouse-transfers.schema.ts / .service.ts) is the authority on
 * every one of them, and on free shelf (409 STOCK_UNAVAILABLE).
 */
import { toPaise, type Money, type Paise } from '@tohfa/shared-types';
import type { BatchDto } from '../../../api/inventory';
import type {
  ListWarehouseTransfersParams,
  WarehouseTransferCreate,
  WarehouseTransferDto,
  WarehouseTransferReceive,
  WarehouseTransferStatus,
  WarehouseTransferSummaryDto,
} from '../../../api/transfers';
import { MAX_TRANSFER_LINES } from '../../../api/transfers';
import { t, type TranslationKey } from '../../../i18n';
import { gramsToKgString, parseKgToGrams } from '../../../money/quantity';
import type { AdminTone } from '../../../theme';
import { gradeLabel } from '../inventory/mappers';
import type {
  PermissionCheck,
  TransferDetailView,
  TransferLineView,
  TransferListItem,
  TransferRoute,
  TransferTimelineStep,
  WarehouseScope,
} from './types';

/** docs/rbac.json codes the transfer screens check. */
export const TRANSFER_CODES = {
  /** List and detail. SA/TOHFA/MAIN all, SUB own. */
  view: 'transfer.inter_warehouse.view',
  /** Initiate and cancel. SA all, MAIN all, SUB none (BR-26). */
  initiate: 'transfer.inter_warehouse.initiate',
  /** Receive at the destination. SA, TOHFA, MAIN, SUB all. */
  receive: 'transfer.inter_warehouse.receive',
  /** Approve (and so dispatch) a PENDING_APPROVAL transfer. SA only. */
  highValueApprove: 'transfer.high_value.approve',
  /** The warehouse master list (Main pickers and names). SUB none. */
  warehouseList: 'warehouse.all.view',
  /** One batch (GET /admin/batches/{id}) for a line's product name. MAIN all, SUB own (BR-30). */
  batchView: 'inventory.batch.view',
} as const;

// API validation limits (warehouse-transfers.schema.ts), not business thresholds.
export const VEHICLE_NUMBER_MAX = 20;
export const TRANSFER_NOTES_MAX = 1000;
export const RECEIPT_NOTE_MAX = 1000;
export const CANCEL_REASON_MAX = 500;

// ─── Status ──────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<WarehouseTransferStatus, TranslationKey> = {
  PENDING_APPROVAL: 'transfers.status.PENDING_APPROVAL',
  IN_TRANSIT: 'transfers.status.IN_TRANSIT',
  RECEIVED: 'transfers.status.RECEIVED',
  CANCELLED: 'transfers.status.CANCELLED',
};

const STATUS_TONE: Record<WarehouseTransferStatus, AdminTone> = {
  PENDING_APPROVAL: 'warning',
  IN_TRANSIT: 'info',
  RECEIVED: 'success',
  CANCELLED: 'danger',
};

export function transferStatusLabel(status: WarehouseTransferStatus): string {
  return t(STATUS_LABEL[status]);
}

export function transferStatusTone(status: WarehouseTransferStatus): AdminTone {
  return STATUS_TONE[status];
}

/** The list's filter chips, 'ALL' first. Each other value is sent as `status`. */
export type TransferFilter = 'ALL' | WarehouseTransferStatus;
export const TRANSFER_FILTERS: readonly TransferFilter[] = ['ALL', 'PENDING_APPROVAL', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED'];

export function transferFilterLabel(filter: TransferFilter): string {
  return filter === 'ALL' ? t('transfers.filter.all') : transferStatusLabel(filter);
}

// ─── Scope ───────────────────────────────────────────────────────────────────

/**
 * What a list sends for the viewer's scope. Main (no warehouseId) sees every
 * transfer. Sub sees the transfers arriving at its own warehouse (INBOUND),
 * the ones it can act on; the server would also return its outgoing ones
 * (BR-30), and confines it to its warehouse whatever is sent.
 */
export function transferListScopeParams(scope: WarehouseScope): Pick<ListWarehouseTransfersParams, 'warehouseId' | 'direction'> {
  if (scope.warehouseId === undefined) return {};
  return { warehouseId: scope.warehouseId, direction: 'INBOUND' };
}

/** True when the transfer arrives at a warehouse the scope covers (Main: every one). */
export function isInboundForScope(scope: WarehouseScope, destinationWarehouseId: string): boolean {
  return scope.warehouseId === undefined || scope.warehouseId === destinationWarehouseId;
}

/** Display name for a warehouse id, given the options the viewer can read. */
export type WarehouseNameOf = (warehouseId: string) => string;

/**
 * Main reads every warehouse's name from GET /warehouses. Sub cannot (no
 * warehouse.all.view), so it knows only its own name; the other side of an
 * incoming transfer reads "Another warehouse", never a fixture name.
 */
export function makeWarehouseNameOf(
  scope: WarehouseScope,
  options: readonly { warehouseId: string; warehouseName: string }[],
): WarehouseNameOf {
  const byId = new Map(options.map((o) => [o.warehouseId, o.warehouseName]));
  return (warehouseId) => {
    const known = byId.get(warehouseId);
    if (known !== undefined) return known;
    if (scope.warehouseId !== undefined && warehouseId === scope.warehouseId && scope.warehouseName) return scope.warehouseName;
    return t('transfers.warehouse.other');
  };
}

// ─── Permission gating (display only; the server enforces every action) ──────

export function canInitiateTransfer(can: PermissionCheck): boolean {
  return can(TRANSFER_CODES.initiate);
}

/** True when `can` allows opening `route` (Initiate needs transfer.inter_warehouse.initiate). */
export function canOpenTransferRoute(route: TransferRoute, can: PermissionCheck): boolean {
  return route !== 'InitiateNewTransfer' || canInitiateTransfer(can);
}

export interface TransferActions {
  /** SA only (transfer.high_value.approve), on PENDING_APPROVAL. */
  approve: boolean;
  /** transfer.inter_warehouse.initiate, on PENDING_APPROVAL (no stock has moved). */
  cancel: boolean;
  /** transfer.inter_warehouse.receive, on IN_TRANSIT, at a destination the scope covers. */
  receive: boolean;
}

export function transferActions(
  scope: WarehouseScope,
  can: PermissionCheck,
  transfer: { status: WarehouseTransferStatus; destinationWarehouseId: string },
): TransferActions {
  const pending = transfer.status === 'PENDING_APPROVAL';
  return {
    approve: pending && can(TRANSFER_CODES.highValueApprove),
    cancel: pending && can(TRANSFER_CODES.initiate),
    receive:
      transfer.status === 'IN_TRANSIT' &&
      can(TRANSFER_CODES.receive) &&
      isInboundForScope(scope, transfer.destinationWarehouseId),
  };
}

// ─── API -> view ─────────────────────────────────────────────────────────────

/** A Quantity string as grams; 0 for a value that is not one (never seen from the server). */
function gramsOf(kg: string): number {
  return parseKgToGrams(kg) ?? 0;
}

function gramsOrNull(kg: string | null): number | null {
  return kg === null ? null : parseKgToGrams(kg);
}

function paiseOf(money: Money | null): Paise | null {
  if (money === null) return null;
  try {
    return toPaise(money);
  } catch {
    return null;
  }
}

export function toTransferListItem(dto: WarehouseTransferSummaryDto, nameOf: WarehouseNameOf): TransferListItem {
  return {
    id: dto.id,
    code: dto.transferNumber,
    sourceWarehouseId: dto.fromWarehouseId,
    destinationWarehouseId: dto.toWarehouseId,
    sourceName: nameOf(dto.fromWarehouseId),
    destinationName: nameOf(dto.toWarehouseId),
    status: dto.status,
    statusLabel: transferStatusLabel(dto.status),
    statusTone: transferStatusTone(dto.status),
    totalValuePaise: paiseOf(dto.totalValue) ?? (0 as Paise),
    hasUnvaluedLines: dto.hasUnvaluedLines,
    requiresApproval: dto.requiresApproval,
    hasDiscrepancy: dto.hasDiscrepancy,
    vehicleNumber: dto.vehicleNumber,
    createdAt: dto.createdAt,
  };
}

export function toTransferLine(line: WarehouseTransferDto['lines'][number]): TransferLineView {
  return {
    id: line.id,
    batchId: line.batchId,
    batchCode: line.batchCode,
    gradeLabel: gradeLabel(line.grade),
    sentGrams: gramsOf(line.qtySentKg),
    receivedGrams: gramsOrNull(line.qtyReceivedKg),
    varianceGrams: gramsOrNull(line.varianceKg),
    destBatchId: line.destBatchId,
    lineValuePaise: paiseOf(line.lineValue),
  };
}

/** The progress steps of a transfer, from the server's timestamps (no ETA: the API has none). */
export function transferTimeline(dto: WarehouseTransferSummaryDto): TransferTimelineStep[] {
  const requested: TransferTimelineStep = { key: 'requested', label: t('transfers.timeline.requested'), done: true, at: dto.createdAt };
  if (dto.status === 'CANCELLED') {
    return [requested, { key: 'cancelled', label: t('transfers.timeline.cancelled'), done: true, at: dto.cancelledAt }];
  }
  const steps: TransferTimelineStep[] = [requested];
  if (dto.requiresApproval) {
    steps.push({ key: 'approved', label: t('transfers.timeline.approved'), done: dto.approvedAt !== null, at: dto.approvedAt });
  }
  steps.push({ key: 'dispatched', label: t('transfers.timeline.dispatched'), done: dto.dispatchedAt !== null, at: dto.dispatchedAt });
  steps.push({ key: 'received', label: t('transfers.timeline.received'), done: dto.receivedAt !== null, at: dto.receivedAt });
  return steps;
}

export function toTransferDetail(dto: WarehouseTransferDto, nameOf: WarehouseNameOf): TransferDetailView {
  const lines = dto.lines.map(toTransferLine);
  return {
    ...toTransferListItem(dto, nameOf),
    notes: dto.notes,
    receiptNote: dto.receiptNote,
    cancelReason: dto.cancelReason,
    receivedAt: dto.receivedAt,
    lines,
    sentGrams: lines.reduce((sum, l) => sum + l.sentGrams, 0),
    timeline: transferTimeline(dto),
  };
}

/** What the initiator is told after a create: dispatched now, or waiting for Super Admin. */
export function createdOutcomeKey(status: WarehouseTransferStatus): TranslationKey {
  return status === 'PENDING_APPROVAL' ? 'transfers.initiate.result.pending' : 'transfers.initiate.result.dispatched';
}

/** Next page number of an offset-paged list, or undefined after the last page. */
export function nextOffsetPage(last: { page: number; pageSize: number; total: number; items: readonly unknown[] }): number | undefined {
  if (last.items.length === 0) return undefined;
  return last.page * last.pageSize < last.total ? last.page + 1 : undefined;
}

// ─── Initiate ────────────────────────────────────────────────────────────────

/** One source batch the initiator can pick. */
export interface TransferBatchOption {
  batchId: string;
  batchCode: string;
  cropName: string | null;
  gradeLabel: string;
  availableGrams: number;
}

/** ACTIVE batches with stock on the shelf; anything else cannot be transferred. */
export function toTransferBatchOptions(batches: readonly BatchDto[]): TransferBatchOption[] {
  const out: TransferBatchOption[] = [];
  for (const b of batches) {
    const availableGrams = parseKgToGrams(b.qtyAvailableKg) ?? 0;
    if (b.status !== 'ACTIVE' || availableGrams <= 0) continue;
    out.push({
      batchId: b.id,
      batchCode: b.batchCode,
      cropName: b.cropName ?? null,
      gradeLabel: gradeLabel(b.grade),
      availableGrams,
    });
  }
  return out;
}

export interface InitiateDraftLine {
  batchId: string;
  /** What the admin typed, kg. */
  qtyText: string;
  availableGrams: number;
}

export interface InitiateDraft {
  fromWarehouseId: string | undefined;
  toWarehouseId: string | undefined;
  lines: readonly InitiateDraftLine[];
  vehicleNumber: string;
  notes: string;
}

export type InitiateError =
  | 'SOURCE_REQUIRED'
  | 'DESTINATION_REQUIRED'
  | 'SAME_WAREHOUSE'
  | 'NO_LINES'
  | 'TOO_MANY_LINES'
  | 'QTY_INVALID'
  | 'QTY_ABOVE_AVAILABLE'
  | 'VEHICLE_TOO_LONG'
  | 'NOTES_TOO_LONG';

export type InitiateResult =
  | { ok: true; body: WarehouseTransferCreate }
  | { ok: false; error: InitiateError; batchId?: string | undefined };

export const INITIATE_ERROR_KEY: Record<InitiateError, TranslationKey> = {
  SOURCE_REQUIRED: 'transfers.initiate.error.source',
  DESTINATION_REQUIRED: 'transfers.initiate.error.destination',
  SAME_WAREHOUSE: 'transfers.initiate.error.sameWarehouse',
  NO_LINES: 'transfers.initiate.error.noLines',
  TOO_MANY_LINES: 'transfers.initiate.error.tooManyLines',
  QTY_INVALID: 'transfers.initiate.error.qtyInvalid',
  QTY_ABOVE_AVAILABLE: 'transfers.initiate.error.qtyAboveAvailable',
  VEHICLE_TOO_LONG: 'transfers.initiate.error.vehicleTooLong',
  NOTES_TOO_LONG: 'transfers.initiate.error.notesTooLong',
};

/**
 * The POST /warehouse-transfers body, or the first problem. Quantities go out
 * as kg strings with 3 decimals; empty vehicle / notes are left out (the
 * schema refuses an empty string).
 */
export function buildCreateTransferBody(draft: InitiateDraft): InitiateResult {
  if (!draft.fromWarehouseId) return { ok: false, error: 'SOURCE_REQUIRED' };
  if (!draft.toWarehouseId) return { ok: false, error: 'DESTINATION_REQUIRED' };
  if (draft.fromWarehouseId === draft.toWarehouseId) return { ok: false, error: 'SAME_WAREHOUSE' };
  if (draft.lines.length === 0) return { ok: false, error: 'NO_LINES' };
  if (draft.lines.length > MAX_TRANSFER_LINES) return { ok: false, error: 'TOO_MANY_LINES' };
  const lines: WarehouseTransferCreate['lines'] = [];
  for (const line of draft.lines) {
    const grams = parseKgToGrams(line.qtyText);
    if (grams === null || grams <= 0) return { ok: false, error: 'QTY_INVALID', batchId: line.batchId };
    if (grams > line.availableGrams) return { ok: false, error: 'QTY_ABOVE_AVAILABLE', batchId: line.batchId };
    lines.push({ batchId: line.batchId, qtyKg: gramsToKgString(grams) });
  }
  const vehicleNumber = draft.vehicleNumber.trim();
  const notes = draft.notes.trim();
  if (vehicleNumber.length > VEHICLE_NUMBER_MAX) return { ok: false, error: 'VEHICLE_TOO_LONG' };
  if (notes.length > TRANSFER_NOTES_MAX) return { ok: false, error: 'NOTES_TOO_LONG' };
  return {
    ok: true,
    body: {
      fromWarehouseId: draft.fromWarehouseId,
      toWarehouseId: draft.toWarehouseId,
      lines,
      ...(vehicleNumber === '' ? {} : { vehicleNumber }),
      ...(notes === '' ? {} : { notes }),
    },
  };
}

/** Grams as an editable kg string without trailing zeros: 300000 -> "300", 12500 -> "12.5". */
export function kgInputText(grams: number): string {
  return gramsToKgString(grams).replace(/\.?0+$/, '');
}

// ─── Receive ─────────────────────────────────────────────────────────────────

export type ReceiveError = 'QTY_INVALID' | 'QTY_ABOVE_SENT' | 'NOTE_REQUIRED' | 'NOTE_TOO_LONG';

export type ReceiveResult =
  | { ok: true; body: WarehouseTransferReceive; shortGrams: number }
  | { ok: false; error: ReceiveError; lineId?: string | undefined };

export const RECEIVE_ERROR_KEY: Record<ReceiveError, TranslationKey> = {
  QTY_INVALID: 'transfers.inspection.error.qtyInvalid',
  QTY_ABOVE_SENT: 'transfers.inspection.error.qtyAboveSent',
  NOTE_REQUIRED: 'transfers.inspection.error.noteRequired',
  NOTE_TOO_LONG: 'transfers.inspection.error.noteTooLong',
};

/** Total grams short across the lines, from what was typed (lines not yet valid count as 0 short). */
export function receiveShortfallGrams(lines: readonly TransferLineView[], entered: Readonly<Record<string, string>>): number {
  let short = 0;
  for (const line of lines) {
    const grams = parseKgToGrams(entered[line.id] ?? '');
    if (grams !== null && grams >= 0 && grams < line.sentGrams) short += line.sentGrams - grams;
  }
  return short;
}

/**
 * The POST .../receive body: every line exactly once, 0 to the sent quantity,
 * and a receipt note whenever any line is short (BR-102; the shortfall is
 * recorded, not written off).
 */
export function buildReceiveTransferBody(
  lines: readonly TransferLineView[],
  entered: Readonly<Record<string, string>>,
  receiptNote: string,
): ReceiveResult {
  const out: WarehouseTransferReceive['lines'] = [];
  let shortGrams = 0;
  for (const line of lines) {
    const grams = parseKgToGrams(entered[line.id] ?? '');
    if (grams === null || grams < 0) return { ok: false, error: 'QTY_INVALID', lineId: line.id };
    if (grams > line.sentGrams) return { ok: false, error: 'QTY_ABOVE_SENT', lineId: line.id };
    shortGrams += line.sentGrams - grams;
    out.push({ itemId: line.id, qtyReceivedKg: gramsToKgString(grams) });
  }
  const note = receiptNote.trim();
  if (note.length > RECEIPT_NOTE_MAX) return { ok: false, error: 'NOTE_TOO_LONG' };
  if (shortGrams > 0 && note === '') return { ok: false, error: 'NOTE_REQUIRED' };
  return { ok: true, body: { lines: out, ...(note === '' ? {} : { receiptNote: note }) }, shortGrams };
}

/** A cancel reason the server accepts (1-500 characters after trimming), or null. */
export function cancelReasonOf(input: string): string | null {
  const reason = input.trim();
  return reason.length === 0 || reason.length > CANCEL_REASON_MAX ? null : reason;
}
