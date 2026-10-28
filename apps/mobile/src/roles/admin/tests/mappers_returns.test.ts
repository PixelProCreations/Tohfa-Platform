/**
 * Pure mapper functions for the warehouse returns (RMA) screens (design module M10).
 * No React, no network: plain-Node vitest.
 * Tests written first (CLAUDE.md 2.6); they FAIL until mappers.ts exists.
 */
import { describe, expect, it } from 'vitest';
import type { ReturnSummaryDto, ReturnRequestDto, ReturnHistoryEntryDto } from '../api/returns';
import {
  returnStatusLabel,
  returnStatusToRmaStatus,
  toRmaRecord,
  toReturnHistoryRecord,
  toReturnTimeline,
  conditionLabel,
} from '../screens/warehouse/returns-rma/mappers';

// ─── fixtures ─────────────────────────────────────────────────────────────────

const SUMMARY: ReturnSummaryDto = {
  id: 'ret-001',
  orderId: 'ord-001',
  customerId: 'cus-001',
  warehouseId: 'wh-coon',
  status: 'PENDING',
  reason: 'Damaged produce after pickup',
  note: null,
  createdAt: '2026-09-25T10:30:00.000Z',
};

const REQUEST: ReturnRequestDto = {
  ...SUMMARY,
  items: [
    {
      id: 'ritem-001',
      orderItemId: 'oitem-001',
      requestedQty: '2.000',
      acceptedQty: null,
      damagedQty: null,
      condition: null,
    },
  ],
};

const HISTORY_ENTRY: ReturnHistoryEntryDto = {
  id: 'hist-001',
  returnRequestId: 'ret-001',
  fromStatus: null,
  toStatus: 'PENDING',
  changedBy: null,
  note: 'Request submitted',
  createdAt: '2026-09-25T10:30:00.000Z',
};

// ─── returnStatusLabel ────────────────────────────────────────────────────────

describe('returnStatusLabel', () => {
  it('maps PENDING to "New"', () => {
    expect(returnStatusLabel('PENDING')).toBe('New');
  });

  it('maps INSPECTED to "Under Review"', () => {
    expect(returnStatusLabel('INSPECTED')).toBe('Under Review');
  });

  it('maps APPROVED to "Approved"', () => {
    expect(returnStatusLabel('APPROVED')).toBe('Approved');
  });

  it('maps REJECTED to "Rejected"', () => {
    expect(returnStatusLabel('REJECTED')).toBe('Rejected');
  });

  it('maps REFUNDED to "Refunded"', () => {
    expect(returnStatusLabel('REFUNDED')).toBe('Refunded');
  });
});

// ─── returnStatusToRmaStatus ──────────────────────────────────────────────────

describe('returnStatusToRmaStatus', () => {
  it('PENDING is "New"', () => {
    expect(returnStatusToRmaStatus('PENDING')).toBe('New');
  });

  it('INSPECTED is "Under Review"', () => {
    expect(returnStatusToRmaStatus('INSPECTED')).toBe('Under Review');
  });

  it('APPROVED / REFUND_PENDING_BANK / REFUNDED is "Approved"', () => {
    expect(returnStatusToRmaStatus('APPROVED')).toBe('Approved');
    expect(returnStatusToRmaStatus('REFUND_PENDING_BANK')).toBe('Approved');
    expect(returnStatusToRmaStatus('REFUNDED')).toBe('Approved');
  });

  it('REJECTED is "Pending Resolution"', () => {
    expect(returnStatusToRmaStatus('REJECTED')).toBe('Pending Resolution');
  });
});

// ─── conditionLabel ───────────────────────────────────────────────────────────

describe('conditionLabel', () => {
  it('maps GOOD, DAMAGED, SPOILED', () => {
    expect(conditionLabel('GOOD')).toBe('Good');
    expect(conditionLabel('DAMAGED')).toBe('Damaged');
    expect(conditionLabel('SPOILED')).toBe('Spoiled');
  });

  it('returns "—" for null', () => {
    expect(conditionLabel(null)).toBe('—');
  });
});

// ─── toRmaRecord ──────────────────────────────────────────────────────────────

describe('toRmaRecord', () => {
  it('maps id and generates rmaId from id', () => {
    const r = toRmaRecord(REQUEST);
    expect(r.id).toBe('ret-001');
    expect(r.rmaId).toContain('RMA');
  });

  it('maps orderId', () => {
    const r = toRmaRecord(REQUEST);
    expect(r.orderId).toBe('ord-001');
  });

  it('maps status to RmaStatus', () => {
    const r = toRmaRecord(REQUEST);
    expect(r.status).toBe('New');
  });

  it('sets customerName to "—" (not in returns API, BR-92)', () => {
    const r = toRmaRecord(REQUEST);
    expect(r.customerName).toBe('—');
  });

  it('sets customerPhone to "—" (masked, BR-92)', () => {
    const r = toRmaRecord(REQUEST);
    expect(r.customerPhone).toBe('—');
  });

  it('sets requestedQuantity from first item', () => {
    const r = toRmaRecord(REQUEST);
    expect(r.requestedQuantity).toContain('2');
  });

  it('maps warehouseId', () => {
    const r = toRmaRecord(REQUEST);
    expect(r.warehouseId).toBe('wh-coon');
  });
});

// ─── toReturnHistoryRecord ────────────────────────────────────────────────────

describe('toReturnHistoryRecord', () => {
  it('maps rmaId from id', () => {
    const r = toReturnHistoryRecord(SUMMARY);
    expect(r.rmaId).toContain('RMA');
  });

  it('maps PENDING to Completed-ish history entry', () => {
    // A history record is for closed RMAs; REFUNDED maps to Completed
    const r = toReturnHistoryRecord({ ...SUMMARY, status: 'REFUNDED' });
    expect(r.status).toBe('Completed');
  });

  it('maps REJECTED to "Rejected"', () => {
    const r = toReturnHistoryRecord({ ...SUMMARY, status: 'REJECTED' });
    expect(r.status).toBe('Rejected');
  });
});

// ─── toReturnTimeline ─────────────────────────────────────────────────────────

describe('toReturnTimeline', () => {
  it('converts history entries to timeline items', () => {
    const items = toReturnTimeline([HISTORY_ENTRY]);
    expect(items).toHaveLength(1);
    expect(items[0]?.title).toContain('New');
  });

  it('returns empty array for empty history', () => {
    const items = toReturnTimeline([]);
    expect(items).toHaveLength(0);
  });
});
