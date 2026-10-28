/**
 * What the receiving screens derive for display from data the API already
 * sends (design M2-01, 04, 06, 08, 08B, 09, 12A): the dashboard counts, the
 * pending queue, the shipment timeline, quantity and grade verification, the
 * damage / mismatch report bodies and the printable receipt note rows.
 * Nothing here fetches or invents; a figure the API does not carry stays
 * null / out of the result so the screen hides it.
 *
 * Kept apart from ./mappers.ts (API rows -> live types, request bodies) so
 * each file stays readable. Pure, so plain-Node vitest covers it
 * (../../../tests/receiving_mappers.test.ts). Weights are integer grams.
 */
import type { Grade } from '../../../api/inventory';
import type { GoodsReceiptDiscrepancyCreate, GoodsReceiptDocumentDto } from '../../../api/receiving';
import { t } from '../../../i18n';
import { formatAdminDay, formatAdminTime, istDay, isOnIstDay } from '../../../utils/datetime';
import { gradeLabel, grams, kgLabel, packagesOf, receiptResultLabel, receiptResultOf, text } from './mappers';
import type { LiveReceipt, LiveShipment, QcCriterionId } from './liveTypes';

// ─── M2-01 Receiving Dashboard ───────────────────────────────────────────────

/** Each tile counts exactly what it names; "today" is the IST calendar day of `now`. */
export interface ReceivingOverview {
  /** Open orders due today (expectedDeliveryDate) with nothing received yet. */
  expectedToday: number;
  /** Open orders with nothing received yet, whatever their date. */
  awaitingReceiving: number;
  /** Orders with part of their quantity received. */
  inProgress: number;
  /** Receipts waiting for their quality check. */
  awaitingQc: number;
  /** Receipts partially accepted. */
  partiallyAccepted: number;
  /** Receipts recorded today (the goods that arrived at the gate today). */
  receivedToday: number;
  /** Receipts recorded today that have had their quality check. */
  completedToday: number;
  /** The receiving issues the API backs: receipts awaiting QC. */
  issues: number;
}

export function receivingOverviewOf(shipments: readonly LiveShipment[], records: readonly LiveReceipt[], now: Date): ReceivingOverview {
  const today = istDay(now);
  const todays = records.filter((r) => isOnIstDay(r.receivedAt, today));
  const awaitingQc = records.filter((r) => r.result === 'Awaiting QC').length;
  return {
    expectedToday: shipments.filter((s) => s.status === 'Expected' && s.expectedDeliveryDate === today).length,
    awaitingReceiving: shipments.filter((s) => s.status === 'Expected').length,
    inProgress: shipments.filter((s) => s.status === 'Receiving').length,
    awaitingQc,
    partiallyAccepted: records.filter((r) => r.result === 'Partially Accepted').length,
    receivedToday: todays.length,
    completedToday: todays.filter((r) => r.result !== 'Awaiting QC' && r.result !== 'Unknown').length,
    issues: awaitingQc,
  };
}

/** Pending Receiving Queue groups, in the order they need action. No "Arrived" group: there is no arrival status. */
export type PendingQueueGroup = 'awaitingQc' | 'partlyReceived' | 'notYetReceived';

export interface PendingQueueSection {
  group: PendingQueueGroup;
  shipments: LiveShipment[];
}

const QUEUE_STATUS: Record<PendingQueueGroup, LiveShipment['status']> = {
  awaitingQc: 'Awaiting QC',
  partlyReceived: 'Receiving',
  notYetReceived: 'Expected',
};

const QUEUE_ORDER: readonly PendingQueueGroup[] = ['awaitingQc', 'partlyReceived', 'notYetReceived'];

/** The orders still to finish, grouped; finished, cancelled and unknown orders are left out. */
export function pendingQueueOf(shipments: readonly LiveShipment[]): PendingQueueSection[] {
  return QUEUE_ORDER.map((group) => ({ group, shipments: shipments.filter((s) => s.status === QUEUE_STATUS[group]) }));
}

// ─── M2-04 Shipment Detail ───────────────────────────────────────────────────

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
export function shipmentTimelineOf(issuedAt: string | undefined, records: readonly LiveReceipt[]): ShipmentTimelineEvent[] {
  const received = [...records]
    .sort((a, b) => (a.receivedAt < b.receivedAt ? -1 : a.receivedAt > b.receivedAt ? 1 : 0))
    .map((r): ShipmentTimelineEvent => ({ kind: 'received', at: r.receivedAt, grn: r.receiptId, grossGrams: r.receivedGrams }));
  const issued = text(issuedAt);
  return issued === undefined ? received : [{ kind: 'issued', at: issued }, ...received];
}

// ─── M2-06 Quantity / M2-08 Grade ────────────────────────────────────────────

export interface QuantityDetail {
  /** null until both weights are known. */
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

export interface GradeVerification {
  /** noListedGrade: the order has no grade, so there is nothing to compare. */
  status: 'match' | 'mismatch' | 'noListedGrade';
  /** On a mismatch, the received weight (the assigned grade applies to the whole receipt, BR-106). */
  quantityAffectedGrams: number | null;
}

export function gradeVerificationOf(listed: Grade | undefined, assigned: Grade, grossGrams: number | null): GradeVerification {
  if (listed === undefined) return { status: 'noListedGrade', quantityAffectedGrams: null };
  if (listed === assigned) return { status: 'match', quantityAffectedGrams: null };
  return { status: 'mismatch', quantityAffectedGrams: grossGrams };
}

// ─── M2-09 Damage / Mismatch Report (BR-121) ─────────────────────────────────

export interface DiscrepancyInput {
  product: string;
  expectedGrams: number | null;
  receivedGrams: number | null;
  listedGrade: Grade | undefined;
  assignedGrade: Grade;
  /** Checklist rows that did not pass. */
  failedPoints: readonly QcCriterionId[];
  damagedGrams: number | null;
  spoiledGrams: number | null;
  /** What the admin typed about it, sent on every report. */
  note: string;
}

/**
 * The damage / mismatch reports what the admin recorded amounts to: a weight
 * variance, a grade different from the order's, and damage or failed checks.
 * The texts are what the report stores (`expected` / `actual`).
 */
export function deriveDiscrepancies(input: DiscrepancyInput): GoodsReceiptDiscrepancyCreate[] {
  const note = text(input.note);
  const withNote = (body: GoodsReceiptDiscrepancyCreate): GoodsReceiptDiscrepancyCreate => (note === undefined ? body : { ...body, note });
  const out: GoodsReceiptDiscrepancyCreate[] = [];
  if (input.expectedGrams !== null && input.receivedGrams !== null && input.expectedGrams !== input.receivedGrams) {
    out.push(withNote({ type: 'QUANTITY', expected: kgLabel(input.expectedGrams), actual: kgLabel(input.receivedGrams) }));
  }
  if (input.listedGrade !== undefined && input.listedGrade !== input.assignedGrade) {
    out.push(withNote({ type: 'QUALITY', expected: gradeLabel(input.listedGrade), actual: gradeLabel(input.assignedGrade) }));
  }
  const damaged = input.damagedGrams ?? 0;
  const spoiled = input.spoiledGrams ?? 0;
  if (damaged > 0 || spoiled > 0) {
    const actual =
      damaged > 0 && spoiled > 0
        ? t('receiving.discrepancy.damagedAndSpoiled', { damaged: kgLabel(damaged), spoiled: kgLabel(spoiled) })
        : damaged > 0
          ? t('receiving.discrepancy.damaged', { qty: kgLabel(damaged) })
          : t('receiving.discrepancy.spoiled', { qty: kgLabel(spoiled) });
    out.push(withNote({ type: 'DAMAGE', expected: t('receiving.discrepancy.expectedSound'), actual }));
  } else if (input.failedPoints.length > 0) {
    out.push(
      withNote({
        type: 'QUALITY',
        expected: t('receiving.discrepancy.expectedPass'),
        actual: t('receiving.discrepancy.failedPoints', { count: input.failedPoints.length }),
      }),
    );
  }
  return out;
}

// ─── M2-12A Receipt Preview (BR-124) ─────────────────────────────────────────

export interface DocumentRow {
  key: string;
  label: string;
  value: string;
}

/**
 * The printable goods receipt note as label / value rows. An allow-list of
 * the document's fields (it already carries no farm location, phone or
 * money); a value the document has as null is left out, never shown blank.
 */
export function receiptDocumentRows(doc: GoodsReceiptDocumentDto): DocumentRow[] {
  const row = (key: string, labelKey: Parameters<typeof t>[0], value: string | null | undefined): DocumentRow | null => {
    const v = text(value);
    return v === undefined ? null : { key, label: t(labelKey), value: v };
  };
  const kg = (value: string | null | undefined): string | undefined => {
    const g = grams(value);
    return g === null ? undefined : kgLabel(g);
  };
  const packages = doc.packages === null ? undefined : packagesOf(doc.packages.count, doc.packages.unit)?.label;
  const qc = doc.qualityCheck;
  // Before the check the server sends 0.000 accepted / rejected: undecided, not nothing.
  const decided = doc.status !== 'AWAITING_QC';
  const rows: (DocumentRow | null)[] = [
    row('grn', 'receiving.doc.grn', doc.grnNumber),
    row('status', 'receiving.doc.status', receiptResultLabel(receiptResultOf(doc.status))),
    row('purchaseOrder', 'receiving.doc.purchaseOrder', doc.purchaseOrder.poNumber),
    row('warehouse', 'receiving.doc.warehouse', doc.warehouse.name ?? doc.warehouse.code),
    row('farmer', 'receiving.doc.farmer', doc.farmer.name),
    row('crop', 'receiving.doc.crop', doc.crop.name),
    row('listedGrade', 'receiving.doc.listedGrade', gradeLabel(doc.grade.listed)),
    row('assignedGrade', 'receiving.doc.assignedGrade', gradeLabel(doc.grade.assigned)),
    row('gross', 'receiving.doc.gross', kg(doc.quantities.grossQtyKg)),
    row('accepted', 'receiving.doc.accepted', decided ? kg(doc.quantities.acceptedQtyKg) : undefined),
    row('rejected', 'receiving.doc.rejected', decided ? kg(doc.quantities.rejectedQtyKg) : undefined),
    row('damaged', 'receiving.doc.damaged', kg(doc.quantities.damagedQtyKg)),
    row('spoiled', 'receiving.doc.spoiled', kg(doc.quantities.spoiledQtyKg)),
    row('packages', 'receiving.doc.packages', packages),
    row('vehicle', 'receiving.doc.vehicle', doc.vehicleNumber),
    row('receivedBy', 'receiving.doc.receivedBy', doc.receivedBy.name),
    row('receivedAt', 'receiving.doc.receivedAt', t('datetime.dayAndTime', { day: formatAdminDay(doc.receivedAt), time: formatAdminTime(doc.receivedAt) })),
    row('batch', 'receiving.doc.batch', doc.batchCode),
    row(
      'qualityPoints',
      'receiving.doc.qualityPoints',
      qc === null ? undefined : t('receiving.doc.pointsValue', { passed: qc.passedPoints, total: qc.totalPoints }),
    ),
    row('checkedBy', 'receiving.doc.checkedBy', qc?.checkedBy.name),
    row('discrepancies', 'receiving.doc.discrepancies', String(doc.discrepancyCount)),
  ];
  return rows.filter((r): r is DocumentRow => r !== null);
}
