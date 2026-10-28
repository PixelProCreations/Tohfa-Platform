/**
 * What the receiving LIST screens (design M2-01 dashboard, M2-02 Incoming
 * Shipments, M2-04 Shipment Detail, M2-15 Receiving History and its detail)
 * show from the live data: which figure each tile names, the shipment card
 * figures, which lists a Shipment Type facet reads, the progress stages the
 * API can prove and a receipt's real timeline.
 *
 * Nothing here fetches or invents. A figure the API does not carry is left
 * out of the result so the screen renders nothing in its place (WIRE rule:
 * never a sample, never a 0 for "unknown"). Pure, so plain-Node vitest covers
 * it (../../../tests/receiving_lists.test.ts). Weights are integer grams.
 */
import { ApiError } from '../../../../../shell/api/client';
import { t } from '../../../i18n';
import type { AdminTone } from '../../../theme';
import { formatAdminDate, istDay } from '../../../utils/datetime';
import { kgLabel, type IntakeFilterParams } from './mappers';
import type { LiveReceipt, LiveReceiptDetail, LiveReceiptResult, LiveShipment, LiveShipmentStatus, LiveShipmentTypeFilter } from './liveTypes';
import type { PendingQueueSection, ReceivingOverview } from './receivingViews';

const NOT_FOUND_STATUS = 404;

// ─── M2-01 dashboard figures ─────────────────────────────────────────────────

export type SubTileKey = 'expected' | 'awaiting' | 'qc' | 'partial' | 'completed' | 'issues';

/** The Sub tiles, each the overview figure its label names. */
export function subTileValues(o: ReceivingOverview): Record<SubTileKey, number> {
  return {
    expected: o.expectedToday,
    awaiting: o.awaitingReceiving,
    qc: o.awaitingQc,
    partial: o.partiallyAccepted,
    completed: o.completedToday,
    issues: o.issues,
  };
}

export type MainKpiKey = 'expected' | 'arrived' | 'in_progress' | 'completed';

/**
 * The Main KPI cards the API backs. "Arrived" is the receipts recorded today:
 * there is no arrival status (owner decision), recording the receipt at the
 * gate is the arrival. Discrepancies (no network-wide list) and Avg
 * Turnaround (no metric) have no source, so they are not in the list.
 */
export function mainKpiValues(o: ReceivingOverview): { key: MainKpiKey; value: number }[] {
  return [
    { key: 'expected', value: o.expectedToday },
    { key: 'arrived', value: o.receivedToday },
    { key: 'in_progress', value: o.inProgress },
    { key: 'completed', value: o.completedToday },
  ];
}

export type MainQueueKey = 'arrived' | 'in_progress' | 'qc_pending';

/**
 * The Main Pending Receiving Queue rows the API backs. A receipt is decided,
 * batched and located in ONE quality-check call (BR-106), so Decision / Batch
 * / Storage Pending have nothing to count and are not in the list.
 */
export function mainQueueValues(o: ReceivingOverview): { key: MainQueueKey; value: number }[] {
  return [
    { key: 'arrived', value: o.awaitingQc },
    { key: 'in_progress', value: o.inProgress },
    { key: 'qc_pending', value: o.awaitingQc },
  ];
}

// ─── Pending Receiving Queue screen ──────────────────────────────────────────

export type PendingQueueTab = 'Arrived' | 'In Progress' | 'QC Pending';

/** No "Decision Pending": the decision is part of the quality check (BR-106). */
export const PENDING_QUEUE_TABS: readonly PendingQueueTab[] = ['Arrived', 'In Progress', 'QC Pending'];

/** Arrived and QC Pending are the orders with a receipt awaiting QC (the receipt is the arrival). */
export function pendingQueueRows(sections: readonly PendingQueueSection[], tab: PendingQueueTab): LiveShipment[] {
  const group = tab === 'In Progress' ? 'partlyReceived' : 'awaitingQc';
  return sections.find((s) => s.group === group)?.shipments ?? [];
}

// ─── M2-02 shipment cards ────────────────────────────────────────────────────

export interface CardStat {
  key: string;
  label: string;
  value: string;
}

function gramsStat(key: 'expected' | 'received' | 'accepted' | 'rejected', grams: number | null): CardStat | null {
  return grams === null ? null : { key, label: t(`receiving.stat.${key}`), value: kgLabel(grams) };
}

function present(stats: (CardStat | null)[]): CardStat[] {
  return stats.filter((s): s is CardStat => s !== null);
}

/**
 * The two figures a card shows, by status. Expected orders have no dispatch
 * data in the API, so only the ordered weight; "Arrived" is when the first
 * receipt was recorded.
 */
export function shipmentCardStats(s: LiveShipment, now: Date): CardStat[] {
  switch (s.status) {
    case 'Completed':
      return present([gramsStat('received', s.receivedGrams), gramsStat('accepted', s.acceptedGrams)]);
    case 'Rejected':
      return present([gramsStat('received', s.receivedGrams), gramsStat('rejected', s.rejectedGrams)]);
    case 'Expected':
      return present([gramsStat('expected', s.expectedGrams)]);
    default: {
      const arrived = s.firstReceivedAt === undefined ? '' : formatAdminDate(s.firstReceivedAt, now);
      return present([
        gramsStat('expected', s.expectedGrams),
        arrived === '' ? null : { key: 'arrived', label: t('receiving.stat.arrived'), value: arrived },
      ]);
    }
  }
}

/** "→ source → destination", skipping a side the API did not name. */
export function shipmentRouteText(s: LiveShipment): string {
  return `→ ${[s.from, s.to].filter((p) => p !== '').join(' → ')}`;
}

/** "Tomato · Grade 1"; null when neither is known (a transfer list row). */
export function shipmentProduceLine(s: LiveShipment): string | null {
  const parts = [s.produce, s.grade].filter((p) => p !== '');
  return parts.length === 0 ? null : parts.join(' · ');
}

// ─── Facets → lists ──────────────────────────────────────────────────────────

export interface IntakeLists {
  purchaseOrders: boolean;
  transfers: boolean;
  /** Goods receipts (Receiving History) belong to purchase orders only. */
  receipts: boolean;
}

export function intakeListsFor(type: LiveShipmentTypeFilter): IntakeLists {
  const orders = type !== 'Inter-Warehouse Transfer';
  return { purchaseOrders: orders, transfers: type !== 'Farmer/Admin', receipts: orders };
}

/**
 * The transfer list has no q / from / to, so its rows are narrowed here by
 * the same facets: q against number and warehouses, the IST day of creation.
 */
export function transferMatchesIntake(s: LiveShipment, params: IntakeFilterParams): boolean {
  const q = params.q?.trim().toLowerCase();
  if (q !== undefined && q !== '' && ![s.code, s.from, s.to].some((v) => v.toLowerCase().includes(q))) return false;
  if (params.from === undefined && params.to === undefined) return true;
  if (s.issuedAt === undefined) return false;
  const ms = Date.parse(s.issuedAt);
  if (Number.isNaN(ms)) return false;
  const day = istDay(new Date(ms));
  return (params.from === undefined || day >= params.from) && (params.to === undefined || day <= params.to);
}

/** Orders and inbound transfers in one list, newest first. */
export function mergeShipments(orders: readonly LiveShipment[], transfers: readonly LiveShipment[]): LiveShipment[] {
  const at = (s: LiveShipment) => s.issuedAt ?? '';
  return [...orders, ...transfers].sort((a, b) => (at(a) < at(b) ? 1 : at(a) > at(b) ? -1 : 0));
}

// ─── M2-04 receiving progress ────────────────────────────────────────────────

/** The Main stage list (design copy). */
export const MAIN_PROGRESS_STAGES = [
  'Shipment Arrived',
  'Receiving Started',
  'Quantity Verification',
  'Quality Check',
  'Decision',
  'Batch Assignment',
  'Storage Assignment',
  'Receipt Completion',
] as const;

/** The Sub stage list (design copy). */
export const SUB_PROGRESS_STAGES = [
  'Shipment Arrived',
  'Receiving Started',
  'Quantity Verification',
  'Quality Check',
  'Decision',
  'Storage Assignment',
  'Receipt Completion',
] as const;

export type ProgressStage = (typeof MAIN_PROGRESS_STAGES)[number];

/**
 * Which stages the newest receipt proves done. A receipt proves arrival,
 * start and quantity; its quality check proves QC, decision and completion
 * (one call, BR-106); a batch on it proves the batch. Storage is never proven:
 * the location is optional on the check and no read returns it.
 */
export function progressStagesDone(
  stages: readonly string[],
  newest: Pick<LiveReceipt, 'result' | 'batchId' | 'batchCode'> | undefined,
): boolean[] {
  const received = newest !== undefined;
  const checked = received && newest.result !== 'Awaiting QC' && newest.result !== 'Unknown';
  const batched = received && (newest.batchId !== undefined || newest.batchCode !== undefined);
  return stages.map((stage) => {
    switch (stage) {
      case 'Shipment Arrived':
      case 'Receiving Started':
      case 'Quantity Verification':
        return received;
      case 'Quality Check':
      case 'Decision':
      case 'Receipt Completion':
        return checked;
      case 'Batch Assignment':
        return batched;
      default:
        return false;
    }
  });
}

// ─── M2-15 Receiving History ─────────────────────────────────────────────────

/** Received / Accepted / Rejected; a receipt awaiting QC has no decision yet, so those are left out. */
export function historyRowStats(r: LiveReceipt): CardStat[] {
  return present([gramsStat('received', r.receivedGrams), gramsStat('accepted', r.acceptedGrams), gramsStat('rejected', r.rejectedGrams)]);
}

/** The history search box narrows the rows already loaded (the server `q` comes from Search & Filters). */
export function filterHistoryRows(rows: readonly LiveReceipt[], query: string): LiveReceipt[] {
  const q = query.trim().toLowerCase();
  if (q === '') return [...rows];
  return rows.filter((r) => [r.receiptId, r.shipmentId, r.product, r.warehouseName].some((v) => v.toLowerCase().includes(q)));
}

export interface ReceiptTimelineEntry {
  key: 'received' | 'checked';
  title: string;
  /** ISO instant. */
  at: string;
  /** "Today · 10:30 AM" (IST). */
  time: string;
}

/** The events the API records for a receipt: received (the arrival) and, once done, the quality check. */
export function receiptTimelineOf(r: LiveReceiptDetail, now: Date): ReceiptTimelineEntry[] {
  const out: ReceiptTimelineEntry[] = [
    { key: 'received', title: t('receiving.timeline.arrived'), at: r.receivedAt, time: formatAdminDate(r.receivedAt, now) },
  ];
  if (r.qualityCheck !== null) {
    out.push({
      key: 'checked',
      title: t('receiving.timeline.qualityChecked'),
      at: r.qualityCheck.checkedAt,
      time: formatAdminDate(r.qualityCheck.checkedAt, now),
    });
  }
  return out;
}

// ─── Errors ──────────────────────────────────────────────────────────────────

/**
 * A detail read answered 404: an id outside the caller's scope (the server
 * answers not found, never 403, CLAUDE.md 2.1) or one that does not exist.
 * The screen shows its "not found" note, not an error to retry.
 */
export function isNotFoundError(error: unknown): boolean {
  return error instanceof ApiError && (error.is('NOT_FOUND') || error.problem.status === NOT_FOUND_STATUS);
}

// ─── Badge tones ─────────────────────────────────────────────────────────────

export function liveShipmentTone(status: LiveShipmentStatus): AdminTone {
  switch (status) {
    case 'Expected':
    case 'Unknown':
      return 'brandSoft';
    case 'Completed':
      return 'success';
    case 'Receiving':
      return 'info';
    case 'Awaiting QC':
      return 'warning';
    default:
      return 'danger';
  }
}

export function liveReceiptTone(result: LiveReceiptResult): AdminTone {
  switch (result) {
    case 'Accepted':
      return 'success';
    case 'Rejected':
      return 'danger';
    case 'Counter-Offered':
      return 'info';
    case 'Unknown':
      return 'brandSoft';
    default:
      return 'warning';
  }
}
