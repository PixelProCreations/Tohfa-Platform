/**
 * What the receiving screens derive for display (design M2-01, 02, 04, 06, 07,
 * 10, 12B, 12C, 13, 14) from data the API already sends: the purchase order
 * and goods receipt lists, one order with its receipts, the quality check
 * answer and a batch. Nothing here fetches or invents; a figure the API does
 * not carry stays undefined / null so the screen hides it.
 *
 * Kept apart from ./mappers.ts (API rows -> UI types, request bodies) so each
 * file stays small. Pure, so plain-Node vitest covers it
 * (../../../tests/receiving_main_batch3.test.ts). Weights are integer grams.
 */
import type { Grade } from '../../../api/inventory';
import type { GoodsReceiptDto, QualityCheckResultDto } from '../../../api/receiving';
import { t } from '../../../i18n';
import { formatKg, parseKgToGrams } from '../../../money/quantity';
import { formatAdminDay } from '../../../utils/datetime';
import { gradeLabel } from '../inventory/mappers';
import { warehouseNameFor, type WarehouseNaming } from './mappers';
import type { IncomingShipment, QcCriterionId, QcResult, ReceivingRecord, StorageBayOption } from './types';

function present(value: string | null | undefined): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

// ─── M2-01 Receiving Dashboard ───────────────────────────────────────────────

/**
 * The overview tiles. Each one is labelled with exactly what it counts:
 * the purchase order list has no date filter, so the open-order figure is
 * every open order with nothing received yet, never "expected today". Only
 * completedToday is a today figure, by the IST calendar day of `now`.
 */
export interface ReceivingOverview {
  /** Open orders with nothing received yet (status Expected), whatever their date. */
  notYetReceived: number;
  /** Orders with part of their quantity received. */
  partlyReceived: number;
  /** Receipts waiting for their quality check. */
  awaitingQc: number;
  /** Receipts partially accepted, over the whole list. */
  partiallyAccepted: number;
  /** Receipts received today (IST) that have had their quality check. */
  completedToday: number;
}

export function receivingOverviewOf(
  shipments: readonly IncomingShipment[],
  records: readonly ReceivingRecord[],
  now: Date,
): ReceivingOverview {
  const today = formatAdminDay(now);
  return {
    notYetReceived: shipments.filter((s) => s.status === 'Expected').length,
    partlyReceived: shipments.filter((s) => s.status === 'Receiving').length,
    awaitingQc: records.filter((r) => r.result === 'Awaiting QC').length,
    partiallyAccepted: records.filter((r) => r.result === 'Partially Accepted').length,
    completedToday: records.filter(
      (r) => r.result !== 'Awaiting QC' && r.result !== 'Unknown' && formatAdminDay(r.receivedAt) === today,
    ).length,
  };
}

/**
 * Pending Receiving Queue groups, in the order they need action: a receipt
 * waiting for QC first, then partly received orders, then orders with nothing
 * received. There is no "Arrived" group: a purchase order has no arrival step
 * (owner decision), recording a receipt is the arrival.
 */
export type PendingQueueGroup = 'awaitingQc' | 'partlyReceived' | 'notYetReceived';

export interface PendingQueueSection {
  group: PendingQueueGroup;
  shipments: IncomingShipment[];
}

const QUEUE_STATUS: Record<PendingQueueGroup, IncomingShipment['status']> = {
  awaitingQc: 'Awaiting QC',
  partlyReceived: 'Receiving',
  notYetReceived: 'Expected',
};

const QUEUE_ORDER: readonly PendingQueueGroup[] = ['awaitingQc', 'partlyReceived', 'notYetReceived'];

/** The orders still to finish, grouped; finished, cancelled and unknown orders are left out. */
export function pendingQueueOf(shipments: readonly IncomingShipment[]): PendingQueueSection[] {
  return QUEUE_ORDER.map((group) => ({ group, shipments: shipments.filter((s) => s.status === QUEUE_STATUS[group]) }));
}

/** Receiving Activity: the receipts, newest received first (ISO instants compare as text). */
export function receivingActivityOf(records: readonly ReceivingRecord[]): ReceivingRecord[] {
  return [...records].sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : a.receivedAt > b.receivedAt ? -1 : 0));
}

/**
 * Quick Actions with a real destination. The design's Damage / Mismatch
 * Report has no API (not persisted) and Goods Receipt Summary is per receipt
 * (reached from Receiving History), so neither is offered.
 */
export type ReceivingQuickAction = 'transferReceiving' | 'receivingHistory';

export function receivingQuickActions(opts: { transferReceiving: boolean }): ReceivingQuickAction[] {
  return opts.transferReceiving ? ['transferReceiving', 'receivingHistory'] : ['receivingHistory'];
}

// ─── M2-02 Shipment Quick View ───────────────────────────────────────────────

export interface DetailRow {
  key: string;
  label: string;
  value: string;
}

/**
 * The Quick View rows: an allow-list of order fields, so a field added to the
 * order later cannot appear here by accident. No farmer name, farmer id or
 * TOHFA id (farm-anonymous glance view, the BR-99 / BR-16 allow-list rule);
 * the full detail is the place for internal traceability. Unknown values are
 * left out, never shown as 0 or a sample.
 */
export function shipmentQuickViewRows(s: IncomingShipment): DetailRow[] {
  const rows: (DetailRow | null)[] = [
    { key: 'shipmentId', label: t('receiving.quickView.shipmentId'), value: s.code },
    s.to !== '' ? { key: 'destination', label: t('receiving.quickView.destination'), value: s.to } : null,
    s.cropName !== undefined ? { key: 'product', label: t('receiving.quickView.product'), value: s.cropName } : null,
    s.grade !== '' ? { key: 'listedGrade', label: t('receiving.quickView.listedGrade'), value: s.grade } : null,
    s.expectedGrams !== null ? { key: 'quantity', label: t('receiving.quickView.quantity'), value: formatKg(s.expectedGrams) } : null,
    s.receivedGrams !== null && s.receivedGrams > 0
      ? { key: 'received', label: t('receiving.quickView.received'), value: formatKg(s.receivedGrams) }
      : null,
    { key: 'status', label: t('receiving.quickView.status'), value: s.statusLabel },
    s.expectedArrival !== '' ? { key: 'expectedOn', label: t('receiving.quickView.expectedOn'), value: s.expectedArrival } : null,
    s.issuedOn !== '' ? { key: 'issued', label: t('receiving.quickView.issued'), value: s.issuedOn } : null,
  ];
  return rows.filter((row): row is DetailRow => row !== null);
}

// ─── M2-04 Shipment Detail ───────────────────────────────────────────────────

/** Received against ordered, from the order's receipts (gross weights). */
export interface ShipmentProgress {
  orderedGrams: number | null;
  /** Sum of the receipts' gross; 0 with no receipts; null when a receipt weight is unreadable. */
  receivedGrams: number | null;
  /** What is still to come (never negative); null when either side is unknown. */
  remainingGrams: number | null;
  /** Received over the order; null when there is none (or it is unknown). */
  excessGrams: number | null;
  /** Display-only bar percentage, whole and capped at 100; null when it cannot be computed. */
  percent: number | null;
  receiptCount: number;
}

export function shipmentProgressOf(orderedGrams: number | null, records: readonly ReceivingRecord[]): ShipmentProgress {
  let received: number | null = 0;
  for (const r of records) {
    if (r.receivedGrams === null || received === null) {
      received = null;
      break;
    }
    received += r.receivedGrams;
  }
  if (orderedGrams === null || received === null) {
    return { orderedGrams, receivedGrams: received, remainingGrams: null, excessGrams: null, percent: null, receiptCount: records.length };
  }
  return {
    orderedGrams,
    receivedGrams: received,
    remainingGrams: Math.max(orderedGrams - received, 0),
    excessGrams: received > orderedGrams ? received - orderedGrams : null,
    // A display percentage from whole grams; never fed back into a weight.
    percent: orderedGrams > 0 ? Math.min(100, Math.floor((received * 100) / orderedGrams)) : null,
    receiptCount: records.length,
  };
}

/** Actual Arrival: when the first receipt of the order was recorded (goodsReceipts[].receivedAt). */
export function actualArrivalOf(records: readonly ReceivingRecord[]): string | undefined {
  let first: string | undefined;
  for (const r of records) if (first === undefined || r.receivedAt < first) first = r.receivedAt;
  return first;
}

export interface ShipmentTimelineEvent {
  kind: 'issued' | 'received';
  /** ISO instant. */
  at: string;
  grn?: string | undefined;
  grossGrams?: number | null | undefined;
}

/**
 * The order's timeline from what the API carries: the issue time, then each
 * receipt in the order it was received. No arrival, QC or batch stage times:
 * the API records none of them separately.
 */
export function shipmentTimelineOf(issuedAt: string | undefined, records: readonly ReceivingRecord[]): ShipmentTimelineEvent[] {
  const received = [...records]
    .sort((a, b) => (a.receivedAt < b.receivedAt ? -1 : a.receivedAt > b.receivedAt ? 1 : 0))
    .map((r): ShipmentTimelineEvent => ({ kind: 'received', at: r.receivedAt, grn: r.receiptId, grossGrams: r.receivedGrams }));
  const issued = present(issuedAt);
  return issued === undefined ? received : [{ kind: 'issued', at: issued }, ...received];
}

// ─── M2-06 Quantity detail ───────────────────────────────────────────────────

export interface QuantityDetail {
  /** null until a received weight is known. */
  status: 'Shortage' | 'Excess' | 'Match' | null;
  /** Received - Expected (the user never types it). */
  differenceGrams: number | null;
  absGrams: number | null;
}

export function quantityDetailOf(expectedGrams: number | null, receivedGrams: number | null): QuantityDetail {
  if (expectedGrams === null || receivedGrams === null) return { status: null, differenceGrams: null, absGrams: null };
  const diff = receivedGrams - expectedGrams;
  return { status: diff < 0 ? 'Shortage' : diff > 0 ? 'Excess' : 'Match', differenceGrams: diff, absGrams: Math.abs(diff) };
}

// ─── M2-07 Quality Summary ───────────────────────────────────────────────────

export interface QcSummary {
  /** The five checklist rows. */
  criteria: number;
  passed: number;
  attention: number;
  failed: number;
  /**
   * Rows the server records as failed. The quality check API takes only
   * pass / fail per row, so "Needs Attention" is sent as a fail (known data
   * gap, kept on purpose: it must not be sent as a pass).
   */
  sentAsFailed: number;
  /** One purchase order is one product, so the product counts are 1 / 0. */
  productsChecked: number;
  productsPassed: number;
  productsWithIssues: number;
}

export function qcSummaryOf(checklist: Record<QcCriterionId, QcResult>): QcSummary {
  const results = Object.values(checklist);
  const passed = results.filter((r) => r === 'pass').length;
  const attention = results.filter((r) => r === 'attention').length;
  const failed = results.filter((r) => r === 'fail').length;
  const issues = attention + failed > 0;
  return {
    criteria: results.length,
    passed,
    attention,
    failed,
    sentAsFailed: attention + failed,
    productsChecked: 1,
    productsPassed: issues ? 0 : 1,
    productsWithIssues: issues ? 1 : 0,
  };
}

// ─── M2-10 / M2-13 / M2-14 confirmation before the quality check POST ───────

/** BR-106: the quality check stocks a batch only for an accepted quantity above zero and a grade other than REJECT. */
export function stocksBatch(acceptedGrams: number | null, assignedGrade: Grade): boolean {
  return acceptedGrams !== null && acceptedGrams > 0 && assignedGrade !== 'REJECT';
}

export interface SubmitConfirmationInput {
  /** False: only the receipt is recorded; its quality check stays pending. */
  canQc: boolean;
  grossGrams: number | null;
  acceptedGrams: number | null;
  rejectedGrams: number | null;
  assignedGrade: Grade;
  product: string;
  warehouseName: string;
  /** The picked storage location, as shown; undefined when none was picked. */
  storageLabel?: string | undefined;
}

export interface SubmitConfirmation {
  title: string;
  body: string;
}

function kgOrNone(grams: number | null): string {
  return grams === null ? t('inventory.noValue') : formatKg(grams);
}

/**
 * The one dialog before the submit (design M2-10 "Confirm Acceptance?", M2-13
 * "Confirm Batch Assignment?", M2-14 "Confirm Location Assignment?"). The
 * three are one request here: BR-106 creates the batch inside the quality
 * check, with the storage location sent on it, so asking three times would
 * confirm the same POST three times. The copy promises a batch only when the
 * check will stock one.
 */
export function receivingSubmitConfirmation(input: SubmitConfirmationInput): SubmitConfirmation {
  if (!input.canQc) {
    return { title: t('receiving.confirm.recordTitle'), body: t('receiving.confirm.recordBody', { qty: kgOrNone(input.grossGrams) }) };
  }
  if (input.acceptedGrams === 0) {
    return { title: t('receiving.confirm.rejectTitle'), body: t('receiving.confirm.rejectBody', { qty: kgOrNone(input.grossGrams) }) };
  }
  const accepted = kgOrNone(input.acceptedGrams);
  const parts = [t('receiving.confirm.acceptBody', { accepted, rejected: kgOrNone(input.rejectedGrams) })];
  if (stocksBatch(input.acceptedGrams, input.assignedGrade)) {
    parts.push(t('receiving.confirm.batchBody', { accepted, product: input.product, warehouse: input.warehouseName }));
    if (input.storageLabel !== undefined) parts.push(t('receiving.confirm.batchLocation', { location: input.storageLabel }));
  } else if (input.assignedGrade === 'REJECT') {
    parts.push(t('receiving.confirm.noBatchRejectGrade'));
  }
  return { title: t('receiving.confirm.acceptTitle'), body: parts.join(' ') };
}

/** A storage location code as the admin knows it: "Name · CODE", or the code as sent when the list does not have it. */
export function storageLocationLabel(code: string, locations: readonly StorageBayOption[]): string {
  const loc = locations.find((l) => l.code === code);
  if (loc === undefined || loc.label === loc.code) return code;
  return `${loc.label} · ${loc.code}`;
}

/** The batch the quality check created, as the result card shows it. */
export interface BatchResult {
  id: string;
  code: string;
  warehouseName?: string | undefined;
  /** BR-106: the storage location copied onto the batch at the quality check. */
  storageLocation?: string | undefined;
  /** The batch grade label (the assigned grade). */
  grade?: string | undefined;
  quantityGrams: number | null;
}

/**
 * BR-106: the batch from the quality check answer (with its warehouse, storage
 * location, grade and quantity), else the one a re-read receipt names (id and
 * code only: the receipt carries nothing more). Null when neither names one.
 */
export function batchResultOf(
  receipt: GoodsReceiptDto,
  qc: QualityCheckResultDto | null,
  naming: WarehouseNaming,
  locations: readonly StorageBayOption[],
): BatchResult | null {
  const batch = qc?.batch ?? null;
  if (batch !== null) {
    const location = present(batch.storageLocation);
    return {
      id: batch.id,
      code: batch.batchCode,
      warehouseName: warehouseNameFor(batch.warehouseId, naming),
      storageLocation: location === undefined ? undefined : storageLocationLabel(location, locations),
      grade: gradeLabel(batch.grade),
      quantityGrams: typeof batch.qtyReceivedKg === 'string' ? parseKgToGrams(batch.qtyReceivedKg) : null,
    };
  }
  const id = present(receipt.batchId);
  if (id === undefined) return null;
  return {
    id,
    code: present(receipt.batchCode) ?? id,
    warehouseName: warehouseNameFor(receipt.warehouseId, naming),
    storageLocation: undefined,
    grade: undefined,
    quantityGrams: null,
  };
}

// ─── M2-12B / M2-12C receipt detail ──────────────────────────────────────────

export interface ReceiptGrades {
  /** The purchase order's grade (what the receipt row carries), '' when none. */
  listed: string;
  /** BR-106: the grade the quality check assigned, read from the batch; undefined without one. */
  assigned?: string | undefined;
}

export function receiptGradesOf(record: Pick<ReceivingRecord, 'grade'>, batch: { grade: Grade } | undefined): ReceiptGrades {
  return { listed: record.grade, assigned: batch === undefined ? undefined : gradeLabel(batch.grade) };
}

export interface ReceiptActivityEvent {
  key: 'received' | 'status' | 'batch';
  title: string;
  detail?: string | undefined;
  /** ISO instant; only the receipt time is known (the API keeps no QC or batch time on a receipt). */
  at?: string | undefined;
}

/** Receipt Activity (M2-12C): what the receipt itself carries, never a quality-check time. */
export function receiptActivityOf(record: ReceivingRecord): ReceiptActivityEvent[] {
  const events: ReceiptActivityEvent[] = [
    {
      key: 'received',
      title: t('receiving.activity.received', { grn: record.receiptId }),
      detail: record.receivedGrams === null ? undefined : formatKg(record.receivedGrams),
      at: record.receivedAt,
    },
    { key: 'status', title: t('receiving.activity.status', { status: record.resultLabel }) },
  ];
  const code = record.batchCode ?? record.batchId;
  if (code !== undefined) events.push({ key: 'batch', title: t('receiving.activity.batch', { code }) });
  return events;
}
