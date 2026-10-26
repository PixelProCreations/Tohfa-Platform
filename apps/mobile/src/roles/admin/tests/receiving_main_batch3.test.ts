/**
 * Receiving batch 3 (Main warehouse admin, design M2-01 / 02 / 04 / 06 / 07 /
 * 10 / 12B / 12C / 13 / 14 / 15), built only on APIs that exist today:
 *
 *  - M2-01: the overview tiles say exactly what they count (no "today" claim
 *    on a figure that is not a today figure), the Pending Queue and Receiving
 *    Activity come from the two lists the dashboard already walks, the Main
 *    warehouse pick is sent on both lists and a Sub scope never widens (BR-30),
 *    and Quick Actions holds only actions whose destination exists.
 *  - M2-02: the Shipment Quick View is an allow-list of what a purchase order
 *    row carries, with no farm or farmer identity (BR-99 / BR-16 principle).
 *  - M2-04: Type, Actual Arrival, the timeline and the receiving progress are
 *    derived from the order and its receipts (goodsReceipts[].receivedAt).
 *  - M2-06 / 07: the quantity detail and the Quality Summary are derived from
 *    what the wizard already holds; "Needs Attention" is sent as a fail.
 *  - M2-10 / 13 / 14: one confirmation before the quality check POST, whose
 *    copy promises a batch only when BR-106 creates one; the result card shows
 *    the warehouse and storage location the quality check answered with.
 *  - M2-12B / 12C: the assigned grade comes from the batch, the order's grade
 *    is the "Listed grade"; the receipt activity has no quality-check times.
 *
 * Pure functions (plain-Node vitest) plus source checks for wiring a function
 * test cannot see.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { BatchDto } from '../api/inventory';
import type { GoodsReceiptDto, PurchaseOrderDto, QualityCheckResultDto } from '../api/receiving';
import { t } from '../i18n';
import { formatKg } from '../money/quantity';
import { receivingWarehouseFilter, toIncomingShipment, toReceivingRecord } from '../screens/warehouse/receiving-qc/mappers';
import {
  actualArrivalOf,
  batchResultOf,
  pendingQueueOf,
  qcSummaryOf,
  quantityDetailOf,
  receiptActivityOf,
  receiptGradesOf,
  receivingActivityOf,
  receivingOverviewOf,
  receivingQuickActions,
  receivingSubmitConfirmation,
  shipmentProgressOf,
  shipmentQuickViewRows,
  shipmentTimelineOf,
  stocksBatch,
  storageLocationLabel,
} from '../screens/warehouse/receiving-qc/receivingViews';
import type { IncomingShipment, ReceivingRecord, StorageBayOption, WarehouseScope } from '../screens/warehouse/receiving-qc/types';

const WH = '11111111-1111-4111-8111-111111111111';
const WH_OTHER = '99999999-9999-4999-8999-999999999999';
const PO_ID = '22222222-2222-4222-8222-222222222222';
const FARMER_ID = '55555555-5555-4555-8555-555555555555';
const BATCH_ID = '88888888-8888-4888-8888-888888888888';
// 12:00 IST on 12 Oct 2026.
const NOW = new Date('2026-10-12T06:30:00Z');

const MAIN: WarehouseScope = {};
const SUB: WarehouseScope = { warehouseId: WH, warehouseName: 'Coonoor' };
const NAMES: ReadonlyMap<string, string> = new Map([
  [WH, 'Coonoor'],
  [WH_OTHER, 'Ooty'],
]);

const PO: PurchaseOrderDto = {
  id: PO_ID,
  poNumber: 'PO-2026-000031',
  farmerId: FARMER_ID,
  warehouseId: WH,
  grade: 'GRADE_1',
  quantityKg: '500.000',
  pricePerKg: '42.50' as never,
  totalAmount: '21250.00' as never,
  status: 'ISSUED',
  expectedDeliveryDate: '2026-10-20',
  issuedAt: '2026-10-10T08:40:00Z',
};

let seq = 0;
function receipt(overrides: Partial<GoodsReceiptDto> = {}): GoodsReceiptDto {
  seq += 1;
  return {
    id: `33333333-3333-4333-8333-${String(seq).padStart(12, '0')}`,
    grnNumber: `GRN-2026-0001${String(seq).padStart(2, '0')}`,
    purchaseOrderId: PO_ID,
    warehouseId: WH,
    grossQtyKg: '200.000',
    acceptedQtyKg: '0.000',
    rejectedQtyKg: '0.000',
    status: 'AWAITING_QC',
    receivedAt: '2026-10-12T05:00:00Z',
    ...overrides,
  };
}

function record(overrides: Partial<GoodsReceiptDto> = {}): ReceivingRecord {
  return toReceivingRecord(receipt(overrides), { now: NOW, warehouseNames: NAMES });
}

function shipment(po: Partial<PurchaseOrderDto> = {}, receipts?: GoodsReceiptDto[]): IncomingShipment {
  return toIncomingShipment({ ...PO, ...po }, { warehouseNames: NAMES, receipts });
}

// ─── M2-01 Receiving Dashboard ───────────────────────────────────────────────

describe('M2-01 overview figures say exactly what they count', () => {
  it('"Not yet received" counts every open order with nothing received, whatever its expected date (no "today" claim)', () => {
    const shipments = [
      shipment({ id: 'a', expectedDeliveryDate: '2026-10-12' }, []),
      shipment({ id: 'b', expectedDeliveryDate: '2025-01-01' }, []),
      shipment({ id: 'c', expectedDeliveryDate: null }, []),
      shipment({ id: 'd' }, [receipt({ status: 'ACCEPTED', grossQtyKg: '100.000' })]),
      shipment({ id: 'e', status: 'CANCELLED' }, []),
    ];
    const o = receivingOverviewOf(shipments, [], NOW);
    expect(o.notYetReceived).toBe(3);
    expect(o.partlyReceived).toBe(1);
  });

  it('"Completed today" counts only receipts received on the IST calendar day of `now` that have their quality check', () => {
    const records = [
      record({ status: 'ACCEPTED', receivedAt: '2026-10-11T19:00:00Z' }), // 00:30 IST on the 12th: today
      record({ status: 'PARTIALLY_ACCEPTED', receivedAt: '2026-10-12T05:00:00Z' }),
      record({ status: 'ACCEPTED', receivedAt: '2026-10-11T18:00:00Z' }), // 23:30 IST on the 11th: yesterday
      record({ status: 'AWAITING_QC', receivedAt: '2026-10-12T05:00:00Z' }), // not checked yet
    ];
    const o = receivingOverviewOf([], records, NOW);
    expect(o.completedToday).toBe(2);
    expect(o.awaitingQc).toBe(1);
    expect(o.partiallyAccepted).toBe(1);
  });

  it('the dashboard labels the open-order tile without "today" and has no Arrived / Avg Turnaround figure', () => {
    expect(t('receiving.overview.notYetReceived').toLowerCase()).not.toContain('today');
    expect(t('receiving.overview.notYetReceivedSub').toLowerCase()).not.toContain('today');
    const dashboard = code('screens/warehouse/receiving-qc/ReceivingDashboardScreen.tsx');
    expect(dashboard).not.toMatch(/Today's Receiving Overview|Avg Turnaround|Shipment Arrived|RECEIVING_PIPELINE/);
    expect(dashboard).toContain('receivingOverviewOf(');
    expect(dashboard).toContain('<OverviewDashboardCard');
  });
});

describe('M2-01 Pending Queue and Receiving Activity from the two existing lists', () => {
  it('the queue holds only orders still to finish, QC first, then partly received, then not yet received', () => {
    const qc = shipment({ id: 'qc' }, [receipt({ status: 'AWAITING_QC' })]);
    const part = shipment({ id: 'part' }, [receipt({ status: 'ACCEPTED', grossQtyKg: '100.000' })]);
    const open = shipment({ id: 'open' }, []);
    const done = shipment({ id: 'done', status: 'RECEIVED' }, [receipt({ status: 'ACCEPTED', grossQtyKg: '500.000' })]);
    const cancelled = shipment({ id: 'x', status: 'CANCELLED' }, []);
    const sections = pendingQueueOf([open, done, part, cancelled, qc]);
    expect(sections.map((s) => s.group)).toEqual(['awaitingQc', 'partlyReceived', 'notYetReceived']);
    expect(sections.map((s) => s.shipments.map((x) => x.purchaseOrderId))).toEqual([['qc'], ['part'], ['open']]);
  });

  it('an empty list gives three empty sections (the screen shows its empty state, never a sample row)', () => {
    expect(pendingQueueOf([]).every((s) => s.shipments.length === 0)).toBe(true);
  });

  it('Receiving Activity is the receipts, newest received first', () => {
    const older = record({ receivedAt: '2026-10-10T05:00:00Z' });
    const newest = record({ receivedAt: '2026-10-12T05:00:00Z' });
    const middle = record({ receivedAt: '2026-10-11T05:00:00Z' });
    expect(receivingActivityOf([older, newest, middle]).map((r) => r.id)).toEqual([newest.id, middle.id, older.id]);
  });

  it('Quick Actions only offers destinations that exist: no Damage / Mismatch Report, no Goods Receipt Summary', () => {
    expect(receivingQuickActions({ transferReceiving: true })).toEqual(['transferReceiving', 'receivingHistory']);
    expect(receivingQuickActions({ transferReceiving: false })).toEqual(['receivingHistory']);
  });
});

describe('M2-01 warehouse selector (BR-30)', () => {
  it('BR-30: the dashboard lists send the Main pick, and a Sub scope always sends its own warehouse', () => {
    expect(receivingWarehouseFilter(MAIN, WH_OTHER)).toBe(WH_OTHER);
    expect(receivingWarehouseFilter(MAIN, undefined)).toBeUndefined();
    expect(receivingWarehouseFilter(SUB, WH_OTHER)).toBe(WH);
  });

  it('BR-30: the flow feeds the dashboard the list warehouse (the pick) and the dashboard offers the existing selector only to Main', () => {
    const flow = code('screens/warehouse/receiving-qc/ReceivingFlow.tsx');
    expect(flow).toMatch(/<DashboardRoute[\s\S]{0,200}\{\.\.\.listLive\}/);
    expect(flow).toContain("case 'ReceivingActivity':");
    expect(flow).toContain("case 'PendingQueue':");
    const dashboard = code('screens/warehouse/receiving-qc/ReceivingDashboardScreen.tsx');
    expect(dashboard).toMatch(/onSelectWarehouse=\{mainView \? onSelectWarehouse : undefined\}/);
  });
});

// ─── M2-02 Incoming Shipments: Quick View ────────────────────────────────────

describe('M2-02 Shipment Quick View', () => {
  it('shows the fields a purchase order row carries, labelled, and hides what is unknown', () => {
    const rows = shipmentQuickViewRows(shipment({}, []));
    const byKey = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    expect(byKey.shipmentId).toBe('PO-2026-000031');
    expect(byKey.destination).toBe('Coonoor');
    expect(byKey.listedGrade).toBe('Grade 1');
    expect(byKey.quantity).toBe(formatKg(500_000));
    expect(byKey.status).toBe(t('receiving.shipmentStatus.expected'));
    expect(byKey.expectedOn).toBe('20 Oct 2026');
    // No crop name on a purchase order row: no product row rather than a guess.
    expect(byKey.product).toBeUndefined();
    // Nothing received yet: no "received so far" row.
    expect(byKey.received).toBeUndefined();
  });

  it('BR-99: the quick view is an allow-list with no farmer identity, even when the shipment carries it', () => {
    const s = { ...shipment({}, []), from: 'Ravi Kumar', farmerCode: 'TF-000123' };
    const text = JSON.stringify(shipmentQuickViewRows(s));
    expect(text).not.toContain('Ravi Kumar');
    expect(text).not.toContain('TF-000123');
    expect(text).not.toContain(FARMER_ID);
  });

  it('a list row opens the quick view (bottom sheet), whose View Details opens the shipment', () => {
    const screen = code('screens/warehouse/receiving-qc/IncomingShipmentsScreen.tsx');
    expect(screen).toContain('shipmentQuickViewRows(');
    expect(screen).toContain('<Modal');
    expect(screen).toMatch(/onPress=\{\(\) => setQuickView\(s\)\}/);
  });
});

// ─── M2-04 Shipment Detail ───────────────────────────────────────────────────

describe('M2-04 Shipment Detail derived from the order and its receipts', () => {
  const first = record({ receivedAt: '2026-10-11T04:00:00Z', grossQtyKg: '200.000', status: 'ACCEPTED' });
  const second = record({ receivedAt: '2026-10-12T04:00:00Z', grossQtyKg: '150.000', status: 'AWAITING_QC' });

  it('Actual Arrival is the first receipt received (goodsReceipts[].receivedAt); none before a receipt', () => {
    expect(actualArrivalOf([second, first])).toBe('2026-10-11T04:00:00Z');
    expect(actualArrivalOf([])).toBeUndefined();
  });

  it('the timeline is the order issue, then each receipt by its received time', () => {
    expect(shipmentTimelineOf(PO.issuedAt, [second, first])).toEqual([
      { kind: 'issued', at: '2026-10-10T08:40:00Z' },
      { kind: 'received', at: '2026-10-11T04:00:00Z', grn: first.receiptId, grossGrams: 200_000 },
      { kind: 'received', at: '2026-10-12T04:00:00Z', grn: second.receiptId, grossGrams: 150_000 },
    ]);
    // An order with no issue time starts at its first receipt.
    expect(shipmentTimelineOf(undefined, [first])[0]?.kind).toBe('received');
  });

  it('receiving progress is received against ordered grams, never a float', () => {
    expect(shipmentProgressOf(500_000, [first, second])).toEqual({
      orderedGrams: 500_000,
      receivedGrams: 350_000,
      remainingGrams: 150_000,
      excessGrams: null,
      percent: 70,
      receiptCount: 2,
    });
  });

  it('an over-delivery shows the excess and a full bar; nothing received is 0, not unknown', () => {
    const big = record({ grossQtyKg: '600.000' });
    expect(shipmentProgressOf(500_000, [big])).toMatchObject({ remainingGrams: 0, excessGrams: 100_000, percent: 100 });
    expect(shipmentProgressOf(500_000, [])).toMatchObject({ receivedGrams: 0, remainingGrams: 500_000, percent: 0 });
  });

  it('an unknown ordered quantity gives no percentage (never a made-up bar)', () => {
    expect(shipmentProgressOf(null, [first])).toMatchObject({ orderedGrams: null, percent: null, remainingGrams: null });
  });

  it('the shipment keeps the raw issue instant for the timeline', () => {
    expect(shipment({}, []).issuedAt).toBe('2026-10-10T08:40:00Z');
  });

  it('the detail screen uses the derived fields and no longer claims there is no API for them', () => {
    const src = read('screens/warehouse/receiving-qc/ShipmentDetailScreen.tsx');
    expect(src).not.toMatch(/no per-stage progress|has no API|no API behind/i);
    const screen = code('screens/warehouse/receiving-qc/ShipmentDetailScreen.tsx');
    for (const fn of ['actualArrivalOf(', 'shipmentTimelineOf(', 'shipmentProgressOf(']) expect(screen).toContain(fn);
    expect(screen).toContain("t('receiving.detail.typePurchaseOrder')");
    const flow = read('screens/warehouse/receiving-qc/ReceivingFlow.tsx');
    expect(flow).not.toMatch(/API has no receipt timeline|receipt timeline and the discrepancy/);
  });
});

// ─── M2-06 / M2-07 wizard sub-views ──────────────────────────────────────────

describe('M2-06 quantity detail and M2-07 Quality Summary', () => {
  it('difference is Received - Expected: shortage, excess or match; unknown until a weight is typed', () => {
    expect(quantityDetailOf(500_000, 480_000)).toEqual({ status: 'Shortage', differenceGrams: -20_000, absGrams: 20_000 });
    expect(quantityDetailOf(300_000, 310_000)).toEqual({ status: 'Excess', differenceGrams: 10_000, absGrams: 10_000 });
    expect(quantityDetailOf(300_000, 300_000)).toEqual({ status: 'Match', differenceGrams: 0, absGrams: 0 });
    expect(quantityDetailOf(300_000, null)).toEqual({ status: null, differenceGrams: null, absGrams: null });
  });

  it('the Quality Summary counts the five rows; "Needs Attention" is sent as a fail (the API takes pass/fail only)', () => {
    const s = qcSummaryOf({ appearance: 'pass', size: 'attention', moisture: 'pass', damage: 'fail', freshness: 'pass' });
    expect(s).toEqual({
      criteria: 5,
      passed: 3,
      attention: 1,
      failed: 1,
      sentAsFailed: 2,
      productsChecked: 1,
      productsPassed: 0,
      productsWithIssues: 1,
    });
    const clean = qcSummaryOf({ appearance: 'pass', size: 'pass', moisture: 'pass', damage: 'pass', freshness: 'pass' });
    expect(clean).toMatchObject({ sentAsFailed: 0, productsPassed: 1, productsWithIssues: 0 });
  });

  it('the wizard offers both sub-views and the translated "sent as a fail" note', () => {
    const wizard = code('screens/warehouse/receiving-qc/GoodsReceivingWizardScreen.tsx');
    expect(wizard).toContain("currentStep === 'quantity_detail'");
    expect(wizard).toContain("currentStep === 'quality_summary'");
    expect(wizard).toContain("t('receiving.qc.attentionSentAsFail')");
    expect(t('receiving.qc.attentionSentAsFail')).not.toBe('receiving.qc.attentionSentAsFail');
  });

  it('M2-05: the arrival confirmation is a required gate for Continue (design: "confirm the physical shipment has arrived first")', () => {
    const wizard = code('screens/warehouse/receiving-qc/GoodsReceivingWizardScreen.tsx');
    expect(wizard).toMatch(/disabled=\{!arrivalConfirmed\}/);
    expect(wizard).not.toMatch(/Starting receiving session/);
  });
});

// ─── M2-10 / M2-13 / M2-14 confirmation and result ──────────────────────────

describe('M2-10 / M2-13 / M2-14 one confirmation before the quality check POST', () => {
  const base = {
    canQc: true,
    grossGrams: 480_000,
    acceptedGrams: 445_000,
    rejectedGrams: 35_000,
    assignedGrade: 'GRADE_2' as const,
    product: 'Tomato',
    warehouseName: 'Coonoor',
  };

  it('BR-106: an acceptance that stocks names the batch, the accepted quantity, product and warehouse', () => {
    const c = receivingSubmitConfirmation({ ...base, storageLabel: 'Cold Room A · A-04' });
    expect(c.title).toBe(t('receiving.confirm.acceptTitle'));
    expect(c.body).toContain(formatKg(445_000));
    expect(c.body).toContain(formatKg(35_000));
    expect(c.body).toContain(t('receiving.confirm.batchBody', { accepted: formatKg(445_000), product: 'Tomato', warehouse: 'Coonoor' }));
    expect(c.body).toContain('Cold Room A · A-04');
  });

  it('BR-106: a REJECT grade is never stocked, so the dialog promises no batch', () => {
    const c = receivingSubmitConfirmation({ ...base, assignedGrade: 'REJECT' });
    expect(c.body).not.toContain(t('receiving.confirm.batchBody', { accepted: formatKg(445_000), product: 'Tomato', warehouse: 'Coonoor' }));
    expect(c.body).toContain(t('receiving.confirm.noBatchRejectGrade'));
    expect(stocksBatch(445_000, 'REJECT')).toBe(false);
    expect(stocksBatch(0, 'GRADE_1')).toBe(false);
    expect(stocksBatch(445_000, 'GRADE_2')).toBe(true);
  });

  it('BR-106: a full rejection stocks nothing; without the QC permission only the receipt is recorded', () => {
    expect(receivingSubmitConfirmation({ ...base, acceptedGrams: 0, rejectedGrams: 480_000 }).title).toBe(t('receiving.confirm.rejectTitle'));
    const recordOnly = receivingSubmitConfirmation({ ...base, canQc: false, acceptedGrams: null, rejectedGrams: null });
    expect(recordOnly.title).toBe(t('receiving.confirm.recordTitle'));
    expect(recordOnly.body).toContain(formatKg(480_000));
  });

  it('the wizard asks before every submit and disables the button while one is pending', () => {
    const wizard = code('screens/warehouse/receiving-qc/GoodsReceivingWizardScreen.tsx');
    expect(wizard).toContain('receivingSubmitConfirmation(');
    expect(wizard).toMatch(/Alert\.alert\(\s*confirmation\.title/);
    // The two submit buttons ask first; only Retry (already confirmed) submits directly.
    expect(wizard.match(/onPress=\{\(\) => void handleConfirmGoodsReceipt\(\)\}/g) ?? []).toHaveLength(1);
    expect(wizard).toContain("currentStep === 'batch_review'");
  });

  const locations: StorageBayOption[] = [{ id: 'l1', code: 'A-04', label: 'Cold Room A', zone: 'COLD', capacityGrams: null }];

  it('BR-106: the result card shows the warehouse and storage location the quality check answered with', () => {
    const batch = { id: BATCH_ID, batchCode: 'BATCH-2026-000123', warehouseId: WH_OTHER, grade: 'GRADE_2', storageLocation: 'A-04', qtyReceivedKg: '445.000' } as BatchDto;
    const qc = { qualityCheck: {} as never, batch } as QualityCheckResultDto;
    expect(batchResultOf(receipt({ status: 'PARTIALLY_ACCEPTED' }), qc, { warehouseNames: NAMES }, locations)).toEqual({
      id: BATCH_ID,
      code: 'BATCH-2026-000123',
      warehouseName: 'Ooty',
      storageLocation: 'Cold Room A · A-04',
      grade: 'Grade 2',
      quantityGrams: 445_000,
    });
  });

  it('BR-106: a location the list does not know is shown as sent; a lost answer falls back to the receipt (no location)', () => {
    expect(storageLocationLabel('Z-99', locations)).toBe('Z-99');
    const r = receipt({ status: 'ACCEPTED', batchId: BATCH_ID, batchCode: 'BATCH-2026-000123' });
    expect(batchResultOf(r, null, { warehouseNames: NAMES }, locations)).toEqual({
      id: BATCH_ID,
      code: 'BATCH-2026-000123',
      warehouseName: 'Coonoor',
      storageLocation: undefined,
      grade: undefined,
      quantityGrams: null,
    });
    expect(batchResultOf(receipt({ status: 'REJECTED' }), { qualityCheck: {} as never, batch: null }, {}, locations)).toBeNull();
  });
});

// ─── M2-12B / M2-12C receipt detail ──────────────────────────────────────────

describe('M2-12B grades and M2-12C receipt activity', () => {
  it('BR-106: the assigned grade is the batch grade; the order grade is the listed grade', () => {
    expect(receiptGradesOf({ grade: 'Grade 1' }, { grade: 'GRADE_2' })).toEqual({ listed: 'Grade 1', assigned: 'Grade 2' });
    // No batch (rejected, or not loaded): no assigned grade is shown, never the listed one in its place.
    expect(receiptGradesOf({ grade: 'Grade 1' }, undefined)).toEqual({ listed: 'Grade 1', assigned: undefined });
  });

  it('the activity holds what the receipt carries: received (with its time), status and batch, and no quality-check time', () => {
    const r = record({ status: 'ACCEPTED', receivedAt: '2026-10-12T04:45:00Z', grossQtyKg: '480.000', batchId: BATCH_ID, batchCode: 'BATCH-2026-000123' });
    const events = receiptActivityOf(r);
    expect(events.map((e) => e.key)).toEqual(['received', 'status', 'batch']);
    expect(events[0]?.at).toBe('2026-10-12T04:45:00Z');
    // Only the receipt time is known; the status and batch carry no time (no QC time on a receipt).
    expect(events.filter((e) => e.at !== undefined)).toHaveLength(1);
    expect(events[1]?.title).toContain(t('receiving.receiptResult.accepted'));
    expect(events[2]?.title).toContain('BATCH-2026-000123');
  });

  it('a receipt with no batch has no batch event', () => {
    expect(receiptActivityOf(record({ status: 'AWAITING_QC' })).map((e) => e.key)).toEqual(['received', 'status']);
  });

  it('the detail shows the listed and assigned grades, and its Timeline tile opens the activity', () => {
    const detail = code('screens/warehouse/receiving-qc/ReceivingHistoryDetailScreen.tsx');
    expect(detail).toContain("t('receiving.receipt.listedGrade')");
    expect(detail).toContain("t('receiving.receipt.assignedGrade')");
    expect(detail).toContain('receiptActivityOf(');
    expect(detail).not.toMatch(/10:15|10:22|10:30/);
    const flow = code('screens/warehouse/receiving-qc/ReceivingFlow.tsx');
    expect(flow).toContain("case 'ReceiptActivity':");
    expect(flow).toMatch(/onNavigateTimeline=/);
    expect(flow).toContain('useReceiptBatch(');
  });
});

// ─── M2-15 history cards ─────────────────────────────────────────────────────

describe('M2-15 Receiving History cards', () => {
  it('a card names the receipt warehouse (Main sees all four)', () => {
    const history = code('screens/warehouse/receiving-qc/ReceivingHistoryScreen.tsx');
    expect(history).toContain('r.warehouseName');
  });
});

// ─── helpers ─────────────────────────────────────────────────────────────────

function read(rel: string): string {
  return fs.readFileSync(path.join(path.resolve(__dirname, '..'), rel), 'utf8');
}

function code(rel: string): string {
  return read(rel)
    .split(/\r?\n/)
    .filter((l) => !/^\s*(\/\/|\*|\/\*|\{\/\*)/.test(l))
    .join('\n');
}
