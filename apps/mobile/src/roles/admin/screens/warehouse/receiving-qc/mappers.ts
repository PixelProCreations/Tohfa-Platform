/**
 * API rows -> the receiving UI types (./types.ts), and the draft -> request
 * bodies of the goods receipt, the quality check and the counter-offer.
 *
 * Pure, so plain-Node vitest covers every branch
 * (../../../tests/mappers_receiving.test.ts). Every weight is integer grams:
 * the API's kg strings are read as text (parseKgToGrams) and written back with
 * gramsToKgString, never through parseFloat. Money stays the API's string.
 *
 * What the server decides is shown as the server sends it; what the API does
 * not carry is not invented: a purchase order has no crop or farmer name on a
 * list row (the detail adds the farmer; a crop name only comes on a receipt),
 * so the produce is labelled by its order code until known (server gap:
 * `cropName` on PurchaseOrder). The Main view's scope names no warehouse, so
 * its rows are named from GET /warehouses (warehouseNameFor).
 *
 * Statuses go through exhaustive tables with a fallback for a value the app
 * does not know yet. The server never advances a purchase order past ISSUED
 * today (server gap), so a shipment's receiving progress is derived from its
 * receipts when they are known (shipmentStatusOf).
 */
import { fromPaise } from '@tohfa/shared-types';
import { bodyFingerprint } from '../../../api/hookHelpers';
import type { Grade } from '../../../api/inventory';
import type {
  CounterOfferCreate,
  GoodsReceiptCreate,
  GoodsReceiptDto,
  GoodsReceiptStatus,
  PurchaseOrderDetailDto,
  PurchaseOrderDto,
  PurchaseOrderStatus,
  QualityCheckCreate,
  QualityCheckResultDto,
  QualityCheckParameter,
  QualityOutcome,
} from '../../../api/receiving';
import type { StorageLocationDto } from '../../../api/warehouses';
import { t, type TranslationKey } from '../../../i18n';
import { parseRupeesToPaise } from '../../../money/paise';
import { formatKg, gramsToKgString, parseKgToGrams } from '../../../money/quantity';
import { formatAdminDate, formatAdminDay } from '../../../utils/datetime';
import { ApiError, NetworkError } from '../../../../../shell/api/client';
import { createIdempotencyKeyCache, newIdempotencyKey } from '../../../../../shell/api/idempotency';
import { gradeLabel } from '../inventory/mappers';
import type {
  HistoryFilter,
  IncomingShipment,
  PermissionCheck,
  QcCriterionId,
  QcResult,
  QualityIssue,
  ReceiptResult,
  ReceivingFilters,
  ReceivingFilterTarget,
  ReceivingRecord,
  ReceivingRouteParams,
  ShipmentFilterTab,
  ShipmentStatus,
  StorageBayOption,
  WarehouseScope,
} from './types';

function has<K extends string>(table: Record<K, unknown>, value: string): value is K {
  return Object.prototype.hasOwnProperty.call(table, value);
}

/** A Quantity string as grams; null for an absent value or one that is not a Quantity. */
function grams(value: string | null | undefined): number | null {
  return typeof value === 'string' ? parseKgToGrams(value) : null;
}

/** Sum of grams; null when any part is unknown. */
function sumGrams(values: readonly (number | null)[]): number | null {
  let total = 0;
  for (const value of values) {
    if (value === null) return null;
    total += value;
  }
  return total;
}

function text(value: string | null | undefined): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

// ─── Scope and keys ──────────────────────────────────────────────────────────

/** Main Warehouse view: no warehouseId means every warehouse. */
export function isMainScope(scope: WarehouseScope): boolean {
  return scope.warehouseId === undefined;
}

/** Filters that filter nothing. */
export const EMPTY_RECEIVING_FILTERS: ReceivingFilters = { warehouseId: undefined, result: 'All' };

/** docs/rbac.json: the code GET /warehouses needs (MAIN all, SUB none). */
const WAREHOUSE_LIST_CODE = 'warehouse.all.view';

export interface ReceivingFilterFacets {
  /** The warehouse picker (GET /warehouses -> `warehouseId` on the list). */
  warehouse: boolean;
  /** The receipt result (GET /admin/goods-receipts `status`). */
  result: boolean;
}

/**
 * The Search & Filters facets a list can apply. The warehouse facet is Main
 * only, and only with the code that loads the warehouse list; a Sub scope is
 * pinned to its own warehouse (BR-30). The result is a goods receipt status,
 * so it narrows Receiving History, not the purchase order list.
 */
export function receivingFilterFacets(scope: WarehouseScope, can: PermissionCheck, target: ReceivingFilterTarget): ReceivingFilterFacets {
  return { warehouse: isMainScope(scope) && can(WAREHOUSE_LIST_CODE), result: target === 'History' };
}

/**
 * True when the screen adds a facet the list does not already have: only the
 * warehouse (Receiving History already has the result as its pills).
 */
export function offersReceivingFilters(scope: WarehouseScope, can: PermissionCheck, target: ReceivingFilterTarget): boolean {
  return receivingFilterFacets(scope, can, target).warehouse;
}

/**
 * The route params an Apply sets on the list it narrows. A Sub scope never
 * carries a warehouse pick (BR-30; the flow sends its own uuid regardless).
 */
export function receivingFilterParams(
  scope: WarehouseScope,
  filters: ReceivingFilters,
  target: ReceivingFilterTarget,
): Pick<ReceivingRouteParams, 'filterWarehouseId' | 'historyFilter'> {
  const filterWarehouseId = isMainScope(scope) ? filters.warehouseId : undefined;
  return target === 'History' ? { filterWarehouseId, historyFilter: filters.result } : { filterWarehouseId };
}

/** Where a row's warehouse name comes from: a Sub scope's own, or the Main view's GET /warehouses list. */
export interface WarehouseNaming {
  warehouseName?: string | undefined;
  /** Main: warehouse uuid -> name, from GET /warehouses. */
  warehouseNames?: ReadonlyMap<string, string> | undefined;
}

/** A warehouse's name, or undefined when neither source knows it. */
export function warehouseNameFor(warehouseId: string, naming: WarehouseNaming): string | undefined {
  return naming.warehouseName ?? naming.warehouseNames?.get(warehouseId);
}

/** True when a shipment shows under an Incoming Shipments status pill. */
export function matchesShipmentTab(status: ShipmentStatus, tab: ShipmentFilterTab): boolean {
  switch (tab) {
    case 'Expected':
      return status === 'Expected';
    case 'Receiving':
      return status === 'Receiving';
    case 'QC Pending':
      return status === 'Awaiting QC';
    case 'Completed':
      return status === 'Completed';
    default:
      return true;
  }
}

/**
 * The warehouseId a receiving request sends (BR-30). A Sub scope always sends
 * its own warehouse uuid, whatever a picker says; the Main view sends the
 * warehouse it picked, or nothing for all of them.
 */
export function receivingWarehouseFilter(scope: WarehouseScope, selectedId: string | undefined): string | undefined {
  return scope.warehouseId !== undefined ? scope.warehouseId : selectedId;
}

/** The Idempotency-Keys of one receiving session in the wizard. */
export interface ReceivingKeyRing {
  createKey: (body: GoodsReceiptCreate) => string;
  qcKey: (receiptId: string, body: QualityCheckCreate) => string;
  counterKey: (receiptId: string, body: CounterOfferCreate) => string;
}

/**
 * One key cache per write (root CLAUDE.md 2.4): the same body reuses its key
 * on a retry, a changed body gets a new one, and the three writes never share
 * a key. The QC and counter-offer keys include the receipt id, so the same
 * body on another receipt is another request.
 */
export function createReceivingKeyRing(generate: () => string = newIdempotencyKey): ReceivingKeyRing {
  const create = createIdempotencyKeyCache(generate);
  const qc = createIdempotencyKeyCache(generate);
  const counter = createIdempotencyKeyCache(generate);
  return {
    createKey: (body) => create.keyFor(bodyFingerprint(body)),
    qcKey: (receiptId, body) => qc.keyFor(bodyFingerprint({ receiptId, body })),
    counterKey: (receiptId, body) => counter.keyFor(bodyFingerprint({ receiptId, body })),
  };
}

// ─── Statuses ────────────────────────────────────────────────────────────────

const PO_STATUS: Record<PurchaseOrderStatus, ShipmentStatus> = {
  ISSUED: 'Expected',
  PARTIALLY_RECEIVED: 'Receiving',
  RECEIVED: 'Completed',
  CANCELLED: 'Cancelled',
};

const SHIPMENT_STATUS_LABEL: Record<ShipmentStatus, TranslationKey> = {
  Expected: 'receiving.shipmentStatus.expected',
  'Awaiting QC': 'receiving.shipmentStatus.awaitingQc',
  Receiving: 'receiving.shipmentStatus.receiving',
  Completed: 'receiving.shipmentStatus.completed',
  Cancelled: 'receiving.shipmentStatus.cancelled',
  Unknown: 'receiving.shipmentStatus.unknown',
};

/**
 * A purchase order's receiving status. With its receipts known: a receipt
 * awaiting QC wins (resume it, do not receive again), then the gross received
 * against the ordered quantity; without them, the order's own status.
 */
export function shipmentStatusOf(
  po: Pick<PurchaseOrderDto, 'status' | 'quantityKg'>,
  receipts?: readonly GoodsReceiptDto[] | undefined,
): ShipmentStatus {
  const own: ShipmentStatus = has(PO_STATUS, po.status) ? PO_STATUS[po.status] : 'Unknown';
  if (own === 'Cancelled' || own === 'Unknown' || receipts === undefined) return own;
  if (receipts.some((r) => r.status === 'AWAITING_QC')) return 'Awaiting QC';
  if (own === 'Completed' || receipts.length === 0) return own;
  const received = sumGrams(receipts.map((r) => grams(r.grossQtyKg)));
  const ordered = grams(po.quantityKg);
  if (received !== null && ordered !== null && received >= ordered) return 'Completed';
  return 'Receiving';
}

export function shipmentStatusLabel(status: ShipmentStatus): string {
  return t(SHIPMENT_STATUS_LABEL[status]);
}

/** True when a new receipt may be started on an order in this status. */
export function isReceivable(status: ShipmentStatus): boolean {
  return status === 'Expected' || status === 'Receiving';
}

const RECEIPT_RESULT: Record<GoodsReceiptStatus, Exclude<ReceiptResult, 'Unknown'>> = {
  AWAITING_QC: 'Awaiting QC',
  ACCEPTED: 'Accepted',
  PARTIALLY_ACCEPTED: 'Partially Accepted',
  REJECTED: 'Rejected',
  COUNTER_OFFERED: 'Counter-Offered',
};

const RECEIPT_RESULT_LABEL: Record<ReceiptResult, TranslationKey> = {
  'Awaiting QC': 'receiving.receiptResult.awaitingQc',
  Accepted: 'receiving.receiptResult.accepted',
  'Partially Accepted': 'receiving.receiptResult.partiallyAccepted',
  Rejected: 'receiving.receiptResult.rejected',
  'Counter-Offered': 'receiving.receiptResult.counterOffered',
  Unknown: 'receiving.receiptResult.unknown',
};

export function receiptResultOf(status: string): ReceiptResult {
  return has(RECEIPT_RESULT, status) ? RECEIPT_RESULT[status] : 'Unknown';
}

export function receiptResultLabel(result: ReceiptResult): string {
  return t(RECEIPT_RESULT_LABEL[result]);
}

/** The server status a Receiving History pill filters on (undefined = all). */
export const HISTORY_FILTER_STATUS = {
  All: undefined,
  'Awaiting QC': 'AWAITING_QC',
  Accepted: 'ACCEPTED',
  Partial: 'PARTIALLY_ACCEPTED',
  Rejected: 'REJECTED',
} as const satisfies Record<HistoryFilter, GoodsReceiptStatus | undefined>;

/** The Receiving History pills, in order (each one a server-side status). */
export const HISTORY_FILTERS: readonly HistoryFilter[] = ['All', 'Awaiting QC', 'Accepted', 'Partial', 'Rejected'];

const HISTORY_FILTER_LABEL: Record<HistoryFilter, TranslationKey> = {
  All: 'receiving.historyFilter.all',
  'Awaiting QC': 'receiving.historyFilter.awaitingQc',
  Accepted: 'receiving.historyFilter.accepted',
  Partial: 'receiving.historyFilter.partial',
  Rejected: 'receiving.historyFilter.rejected',
};

export function historyFilterLabel(filter: HistoryFilter): string {
  return t(HISTORY_FILTER_LABEL[filter]);
}

// ─── Rows ────────────────────────────────────────────────────────────────────

/**
 * The crop name the API sent, else a label naming the order (or receipt) it
 * belongs to. Never "Unnamed crop", which reads as if the crop had no name,
 * and never a guessed crop.
 */
export function receivingCropLabel(cropName: string | null | undefined, ref: string): string {
  return text(cropName) ?? t('receiving.crop.ofOrder', { ref });
}

/** The newest receipt still awaiting its quality check. */
export function pendingReceiptOf(receipts: readonly GoodsReceiptDto[]): GoodsReceiptDto | undefined {
  let newest: GoodsReceiptDto | undefined;
  for (const receipt of receipts) {
    if (receipt.status !== 'AWAITING_QC') continue;
    if (newest === undefined || receipt.receivedAt > newest.receivedAt) newest = receipt;
  }
  return newest;
}

export interface ShipmentContext extends WarehouseNaming {
  /** The order's receipts, when known (the detail carries them). */
  receipts?: readonly GoodsReceiptDto[] | undefined;
}

/** A purchase order (list row or detail) as the shipment the screens show. */
export function toIncomingShipment(po: PurchaseOrderDto | PurchaseOrderDetailDto, ctx: ShipmentContext): IncomingShipment {
  const detail = po as PurchaseOrderDetailDto;
  const receipts = ctx.receipts;
  const status = shipmentStatusOf(po, receipts);
  const named = receipts?.find((r) => text(r.cropName) !== undefined);
  return {
    purchaseOrderId: po.id,
    code: po.poNumber,
    produce: receivingCropLabel(named?.cropName, po.poNumber),
    cropName: text(named?.cropName),
    grade: po.grade === undefined ? '' : gradeLabel(po.grade),
    apiGrade: po.grade,
    expectedGrams: grams(po.quantityKg),
    from: text(detail.farmerName) ?? '',
    farmerCode: text(detail.tohfaFarmerId) ?? '',
    to: warehouseNameFor(po.warehouseId, ctx) ?? '',
    warehouseId: po.warehouseId,
    receiptIds: receipts?.map((r) => r.id) ?? [],
    pendingReceiptId: receipts === undefined ? undefined : pendingReceiptOf(receipts)?.id,
    status,
    statusLabel: shipmentStatusLabel(status),
    pricePerKg: po.pricePerKg,
    totalAmount: po.totalAmount,
    expectedArrival: typeof po.expectedDeliveryDate === 'string' ? formatAdminDay(po.expectedDeliveryDate) : '',
    issuedOn: po.issuedAt === undefined ? '' : formatAdminDay(po.issuedAt),
    receivedGrams: receipts === undefined ? null : sumGrams(receipts.map((r) => grams(r.grossQtyKg))),
  };
}

export interface RecordContext extends WarehouseNaming {
  /** Clock for "Today · 10:30 AM"; passed in so the mapper stays pure. */
  now: Date;
  /** The order's quantity, when the screen knows the order. */
  expectedGrams?: number | null | undefined;
  /** The order's poNumber, when the row does not carry it. */
  poNumber?: string | undefined;
}

/** A goods receipt as Receiving History, its detail and the dashboard show it. */
export function toReceivingRecord(gr: GoodsReceiptDto, ctx: RecordContext): ReceivingRecord {
  const result = receiptResultOf(gr.status);
  // Before the quality check the server sends 0.000 accepted: that is "not
  // decided yet", not "nothing accepted".
  const checked = result !== 'Awaiting QC';
  const poNumber = text(gr.poNumber) ?? ctx.poNumber;
  return {
    id: gr.id,
    receiptId: gr.grnNumber,
    purchaseOrderId: gr.purchaseOrderId,
    shipmentId: poNumber ?? '',
    warehouseId: gr.warehouseId,
    warehouseName: warehouseNameFor(gr.warehouseId, ctx) ?? '',
    result,
    resultLabel: receiptResultLabel(result),
    receivedAt: gr.receivedAt,
    date: formatAdminDate(gr.receivedAt, ctx.now),
    product: receivingCropLabel(gr.cropName, poNumber ?? gr.grnNumber),
    grade: gr.grade === undefined ? '' : gradeLabel(gr.grade),
    expectedGrams: ctx.expectedGrams ?? null,
    receivedGrams: grams(gr.grossQtyKg),
    acceptedGrams: checked ? grams(gr.acceptedQtyKg) : null,
    rejectedGrams: checked ? grams(gr.rejectedQtyKg) : null,
    rejectionReason: text(gr.rejectionReason),
    vehicleNumber: text(gr.vehicleNumber),
    batchId: text(gr.batchId),
    batchCode: text(gr.batchCode),
  };
}

/** The batch a receipt was stocked as: an id to open and a code to show. */
export interface ReceiptBatch {
  id: string;
  code: string;
}

/**
 * The batch to offer after a submit (BR-106: the quality check creates it, so
 * it is viewed, never assigned afterwards): the one the check returned, else
 * the one a re-read receipt names (the check's answer was lost). Null when
 * neither names one (a rejection, or no quality check yet).
 */
export function receiptBatchOf(receipt: GoodsReceiptDto, qc: QualityCheckResultDto | null): ReceiptBatch | null {
  const batch = qc?.batch ?? null;
  if (batch !== null) return { id: batch.id, code: batch.batchCode };
  const id = text(receipt.batchId);
  return id === undefined ? null : { id, code: text(receipt.batchCode) ?? id };
}

// ─── Grade verification (design M2-08B) ──────────────────────────────────────

export interface GradeVerification {
  /** noListedGrade: the order has no grade, so there is nothing to compare. */
  status: 'match' | 'mismatch' | 'noListedGrade';
  /** On a mismatch, the received weight (the assigned grade applies to the whole receipt, BR-106); else null. */
  quantityAffectedGrams: number | null;
}

/**
 * The order's listed grade against the grade the check assigns. A purchase
 * order is one crop, and the batch takes the assigned grade for everything
 * received, so a mismatch affects the whole received weight. The product
 * itself cannot change on a receipt (QualityCheckCreate has no product), so
 * there is no product mismatch to derive.
 */
export function gradeVerificationOf(listed: Grade | undefined, assigned: Grade, grossGrams: number | null): GradeVerification {
  if (listed === undefined) return { status: 'noListedGrade', quantityAffectedGrams: null };
  if (listed === assigned) return { status: 'match', quantityAffectedGrams: null };
  return { status: 'mismatch', quantityAffectedGrams: grossGrams };
}

/**
 * The receiving issues the API can back: receipts still awaiting their
 * quality check. Opening one resumes the wizard at the quality check.
 */
export function qcPendingIssues(records: readonly ReceivingRecord[]): QualityIssue[] {
  return records
    .filter((r) => r.result === 'Awaiting QC')
    .map((r) => ({
      id: r.id,
      purchaseOrderId: r.purchaseOrderId,
      kind: 'QC Pending' as const,
      shipmentCode: r.shipmentId !== '' ? r.shipmentId : r.receiptId,
      produce: r.product,
      detail: r.receivedGrams === null ? t('receiving.issue.qcPendingNoQty') : t('receiving.issue.qcPending', { qty: formatKg(r.receivedGrams) }),
      warehouseId: r.warehouseId,
      time: r.date,
      target: 'wizard' as const,
      wizardStep: 'quality_check' as const,
    }));
}

/** A storage location as a putaway choice; the quality check sends its code. */
export function toStorageLocationOption(loc: StorageLocationDto): StorageBayOption {
  return {
    id: loc.id,
    code: loc.code,
    label: text(loc.name) ?? loc.code,
    zone: text(loc.locationType) ?? '',
    capacityGrams: grams(loc.capacityKg),
  };
}

// ─── Quantities ──────────────────────────────────────────────────────────────

/**
 * The server rule (docs/openapi.yaml GoodsReceiptCreate; enforced at the
 * quality check): accepted + rejected must not exceed the gross. Every figure
 * is whole grams and not negative, and the gross is more than zero. The wizard
 * always makes rejected = gross - accepted, so its split adds up exactly.
 */
export function receiptQuantitiesValid(gross: number | null, accepted: number | null, rejected: number | null): boolean {
  if (gross === null || accepted === null || rejected === null) return false;
  if (![gross, accepted, rejected].every((n) => Number.isSafeInteger(n))) return false;
  if (gross <= 0 || accepted < 0 || rejected < 0) return false;
  return accepted + rejected <= gross;
}

/** The outcome a split means: nothing accepted = rejected, nothing rejected = accepted. */
export function qualityOutcomeOf(acceptedGrams: number, rejectedGrams: number): QualityOutcome {
  if (acceptedGrams === 0) return 'REJECTED';
  if (rejectedGrams === 0) return 'ACCEPTED';
  return 'PARTIALLY_ACCEPTED';
}

// ─── The quality check ───────────────────────────────────────────────────────

/** The wizard checklist rows -> the five parameters the server requires. */
export const QC_PARAMETER: Record<QcCriterionId, QualityCheckParameter> = {
  appearance: 'APPEARANCE',
  size: 'SIZE_UNIFORMITY',
  moisture: 'MOISTURE',
  damage: 'DAMAGE_PEST',
  freshness: 'FRESHNESS',
};

const QC_ORDER: readonly QcCriterionId[] = ['appearance', 'size', 'moisture', 'damage', 'freshness'];

/** What the wizard collected for the quality check. Typed inputs stay as typed text. */
export interface QcDraft {
  assignedGrade: Grade;
  /** Gross of the receipt. */
  grossGrams: number | null;
  acceptedGrams: number | null;
  checklist: Partial<Record<QcCriterionId, QcResult>>;
  /** Typed percentage, '' when not measured. */
  moisturePct: string;
  /** Typed whole number 0-10, '' when not scored. */
  visualScore: string;
  defectNotes: string;
  /** A storage location code, when one was picked. */
  storageLocation?: string | undefined;
}

export type QcDraftProblem = 'quantities' | 'moisture' | 'visualScore' | 'defectNotesRequired';

const MOISTURE_RE = /^\d{1,3}(\.\d{1,2})?$/;
const SCORE_RE = /^\d{1,2}$/;

function moistureOf(input: string): number | null | undefined {
  const value = input.trim();
  if (value === '') return undefined;
  if (!MOISTURE_RE.test(value)) return null;
  // A measured percentage, not money or weight: a number is what the API takes.
  const pct = Number(value);
  return pct >= 0 && pct <= 100 ? pct : null;
}

function scoreOf(input: string): number | null | undefined {
  const value = input.trim();
  if (value === '') return undefined;
  if (!SCORE_RE.test(value)) return null;
  const score = Number(value);
  return score >= 0 && score <= 10 ? score : null;
}

function rejectedOf(draft: QcDraft): number | null {
  return draft.grossGrams === null || draft.acceptedGrams === null ? null : draft.grossGrams - draft.acceptedGrams;
}

/** The first thing wrong with the draft, or null when it can be sent. */
export function qcDraftProblem(draft: QcDraft): QcDraftProblem | null {
  const rejected = rejectedOf(draft);
  if (!receiptQuantitiesValid(draft.grossGrams, draft.acceptedGrams, rejected)) return 'quantities';
  if (moistureOf(draft.moisturePct) === null) return 'moisture';
  if (scoreOf(draft.visualScore) === null) return 'visualScore';
  // The server refuses a rejected quantity without a reason.
  if ((rejected ?? 0) > 0 && text(draft.defectNotes) === undefined) return 'defectNotesRequired';
  return null;
}

export const QC_DRAFT_PROBLEM_MESSAGE: Record<QcDraftProblem, TranslationKey> = {
  quantities: 'receiving.qc.problem.quantities',
  moisture: 'receiving.qc.problem.moisture',
  visualScore: 'receiving.qc.problem.visualScore',
  defectNotesRequired: 'receiving.qc.problem.defectNotesRequired',
};

/** The QualityCheckCreate body; throws on a draft qcDraftProblem() refuses. */
export function buildQualityCheckBody(draft: QcDraft): QualityCheckCreate {
  const problem = qcDraftProblem(draft);
  if (problem !== null) throw new RangeError(`quality check draft is not valid: ${problem}`);
  const accepted = draft.acceptedGrams ?? 0;
  const rejected = rejectedOf(draft) ?? 0;
  const moisture = moistureOf(draft.moisturePct);
  const score = scoreOf(draft.visualScore);
  const notes = text(draft.defectNotes);
  const location = text(draft.storageLocation);
  return {
    assignedGrade: draft.assignedGrade,
    outcome: qualityOutcomeOf(accepted, rejected),
    acceptedQtyKg: gramsToKgString(accepted),
    rejectedQtyKg: gramsToKgString(rejected),
    ...(typeof moisture === 'number' ? { moisturePct: moisture } : {}),
    ...(typeof score === 'number' ? { visualScore: score } : {}),
    ...(notes === undefined ? {} : { defectNotes: notes }),
    ...(location === undefined ? {} : { storageLocation: location }),
    // A row passes only when it passed; "needs attention" is not a pass.
    items: QC_ORDER.map((id) => ({ parameter: QC_PARAMETER[id], passed: (draft.checklist[id] ?? 'pass') === 'pass' })),
  };
}

// ─── Create and counter-offer bodies ─────────────────────────────────────────

export interface GoodsReceiptDraft {
  purchaseOrderId: string;
  warehouseId: string;
  grossGrams: number;
  vehicleNumber?: string | undefined;
}

export function buildGoodsReceiptBody(draft: GoodsReceiptDraft): GoodsReceiptCreate {
  const vehicle = text(draft.vehicleNumber);
  return {
    purchaseOrderId: draft.purchaseOrderId,
    warehouseId: draft.warehouseId,
    grossQtyKg: gramsToKgString(draft.grossGrams),
    ...(vehicle === undefined ? {} : { vehicleNumber: vehicle }),
  };
}

export interface CounterOfferDraft {
  /** Rupees per kg as typed. */
  priceInput: string;
  quantityGrams: number;
  message: string;
}

/** The CounterOfferCreate body, or null when the price or quantity cannot be sent. */
export function buildCounterOfferBody(draft: CounterOfferDraft): CounterOfferCreate | null {
  const paise = parseRupeesToPaise(draft.priceInput);
  if (paise === null || paise <= 0) return null;
  if (!Number.isSafeInteger(draft.quantityGrams) || draft.quantityGrams <= 0) return null;
  const message = text(draft.message);
  return {
    pricePerKg: fromPaise(paise),
    quantityKg: gramsToKgString(draft.quantityGrams),
    ...(message === undefined ? {} : { message }),
  };
}

// ─── Resume after an unknown outcome ─────────────────────────────────────────

/**
 * True when a failed write may still have been written: the request timed out
 * or never got an answer (NetworkError), or a 5xx came back (a gateway may
 * answer 5xx after the server committed). A 4xx means it was refused.
 */
export function isOutcomeUnknown(err: unknown): boolean {
  if (err instanceof NetworkError) return true;
  if (err instanceof ApiError) return err.problem.status >= 500;
  return false;
}

/**
 * The receipt our create wrote, found after an unknown outcome: one the order
 * did not have before the attempt, for the same order and warehouse, with the
 * same gross weight. The server ignores the Idempotency-Key here, so this
 * re-read is what stops a retry from recording the delivery twice.
 */
export function findCreatedReceipt(
  knownReceiptIds: readonly string[],
  receipts: readonly GoodsReceiptDto[],
  body: GoodsReceiptCreate,
): GoodsReceiptDto | undefined {
  const wanted = grams(body.grossQtyKg);
  const fresh = receipts.filter(
    (r) =>
      !knownReceiptIds.includes(r.id) &&
      r.purchaseOrderId === body.purchaseOrderId &&
      r.warehouseId === body.warehouseId &&
      wanted !== null &&
      grams(r.grossQtyKg) === wanted,
  );
  return fresh.reduce<GoodsReceiptDto | undefined>((newest, r) => (newest === undefined || r.receivedAt > newest.receivedAt ? r : newest), undefined);
}
