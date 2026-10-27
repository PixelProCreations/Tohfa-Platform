/**
 * Pure mapping functions for the warehouse returns (RMA) screens (design module M10).
 *
 * Translates API DTOs (api/returns.ts) into the screen types in ./types.ts.
 * No React, no network. Unit-tested in tests/mappers_returns.test.ts.
 *
 * BR-92: Customer name and phone are NOT available in the returns API. The server
 * returns customerId only; cross-referencing with the customers API is not done
 * at this layer (it would require a separate request per return). Customer fields
 * show '—' until the caller provides them (e.g. from a CustomerRef in nav params).
 *
 * The transfer per-line damage/spoilage/condition and initiatedByName fields
 * are hidden per the instructions.
 */
import type {
  ReturnHistoryEntryDto,
  ReturnItemCondition,
  ReturnRequestDto,
  ReturnSummaryDto,
  ReturnStatus,
} from '../../../api/returns';
import type { ReturnHistoryRecord, ReturnTimelineItem, RmaRecord } from './types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format an ISO timestamp to "DD Mon YYYY · hh:mm AM/PM" for RMA display. */
export function formatRmaTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const date = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${date} · ${time}`;
}

/** Format an ISO date-only string to "DD Mon YYYY". */
export function formatRmaDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Derive a display-friendly RMA ID from the UUID. */
function deriveRmaId(id: string): string {
  // Use the first 8 chars of the uuid for the display code
  const short = id.replace(/-/g, '').substring(0, 8).toUpperCase();
  return `RMA-${short}`;
}

// ─── Status display ───────────────────────────────────────────────────────────

/** Human display label for a return status. */
export function returnStatusLabel(status: string): string {
  const MAP: Record<string, string> = {
    PENDING: 'New',
    INSPECTED: 'Under Review',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    REFUND_PENDING_BANK: 'Refund Pending',
    REFUNDED: 'Refunded',
  };
  return MAP[status] ?? status;
}

/** Map an API ReturnStatus to the screen's RmaStatus type. */
export function returnStatusToRmaStatus(status: ReturnStatus): 'New' | 'Under Review' | 'Approved' | 'Pending Resolution' {
  switch (status) {
    case 'PENDING':
      return 'New';
    case 'INSPECTED':
      return 'Under Review';
    case 'APPROVED':
    case 'REFUND_PENDING_BANK':
    case 'REFUNDED':
      return 'Approved';
    case 'REJECTED':
      return 'Pending Resolution';
  }
}

/** Map condition enum to display text. */
export function conditionLabel(condition: ReturnItemCondition | null | undefined): string {
  if (!condition) return '—';
  const MAP: Record<ReturnItemCondition, string> = {
    GOOD: 'Good',
    DAMAGED: 'Damaged',
    SPOILED: 'Spoiled',
  };
  return MAP[condition] ?? condition;
}

// ─── toRmaRecord ──────────────────────────────────────────────────────────────

/**
 * Map a `ReturnRequestDto` to the screen's `RmaRecord`.
 *
 * Spec-gap fields (not in returns API) show '—':
 *   customerName, customerPhone  — BR-92, no PII in returns list/detail
 *   productName, grade, unitPrice, lineTotal — come from the linked order items;
 *     they are NOT in ReturnRequestDto (only item ids and quantities)
 *   issueCategory, salesChannel, paymentStatus — not in the returns schema
 *   requestedResolution — not structured in the API (only reason text)
 */
export function toRmaRecord(dto: ReturnRequestDto): RmaRecord {
  const firstItem = dto.items[0];
  return {
    id: dto.id,
    rmaId: deriveRmaId(dto.id),
    orderId: dto.orderId,
    // BR-92: customer name/phone not in returns API
    customerName: '—',
    customerId: dto.customerId,
    customerPhone: '—',
    orderDate: '—',
    salesChannel: '—',
    paymentStatus: '—',
    // Product details come from the linked order; not in ReturnRequestDto
    productName: '—',
    grade: '—',
    quantityPurchased: '—',
    unitPrice: '—',
    lineTotal: '—',
    issueCategory: 'Damaged', // default; no structured category in API
    reportedDate: formatRmaDate(dto.createdAt),
    timestampText: formatRmaTimestamp(dto.createdAt),
    description: dto.reason,
    ticketId: '—',
    requestedQuantity: firstItem ? `${firstItem.requestedQty} KG` : '—',
    requestedResolution: '—',
    status: returnStatusToRmaStatus(dto.status),
    warehouseId: dto.warehouseId ?? undefined,
  };
}

// ─── toReturnHistoryRecord ────────────────────────────────────────────────────

/** Map a `ReturnSummaryDto` (list item) to the history screen's `ReturnHistoryRecord`. */
export function toReturnHistoryRecord(dto: ReturnSummaryDto): ReturnHistoryRecord {
  const historyStatus = (): 'Completed' | 'Rejected' | 'Approved' => {
    if (dto.status === 'REJECTED') return 'Rejected';
    if (dto.status === 'REFUNDED') return 'Completed';
    return 'Approved';
  };

  return {
    rmaId: deriveRmaId(dto.id),
    orderId: dto.orderId,
    customerName: '—', // BR-92: not in returns API
    reasonTag: dto.reason.substring(0, 40),
    status: historyStatus(),
    date: formatRmaDate(dto.createdAt),
    customerId: dto.customerId,
  };
}

// ─── toReturnTimeline ─────────────────────────────────────────────────────────

/** Map a list of history entries to the timeline items shown on detail/review screens. */
export function toReturnTimeline(entries: ReturnHistoryEntryDto[]): ReturnTimelineItem[] {
  return entries.map((entry, i) => ({
    id: entry.id,
    title: returnStatusLabel(entry.toStatus),
    time: formatRmaTimestamp(entry.createdAt),
  }));
}
