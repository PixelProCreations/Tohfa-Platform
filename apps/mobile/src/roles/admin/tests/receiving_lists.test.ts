/**
 * The receiving LIST screens' display decisions (design M2-01, 02, 03, 04,
 * 15): which live figure each dashboard tile / KPI / queue row shows, the
 * pending queue tabs, the shipment card figures, which lists a shipment-type
 * facet reads, the shipment progress stages the API can prove, the receipt
 * timeline, and the flow's navigation targets when no purchase order is known.
 * Pure (screens/warehouse/receiving-qc/receivingLists.ts, receivingNav.ts).
 */
import { describe, expect, it } from 'vitest';
import { ApiError, NetworkError } from '../../../shell/api/client';
import { t } from '../i18n';
import type { LiveReceipt, LiveReceiptDetail, LiveShipment } from '../screens/warehouse/receiving-qc/liveTypes';
import {
  MAIN_PROGRESS_STAGES,
  PENDING_QUEUE_TABS,
  SUB_PROGRESS_STAGES,
  filterHistoryRows,
  historyRowStats,
  intakeListsFor,
  isNotFoundError,
  liveReceiptTone,
  liveShipmentTone,
  mainKpiValues,
  mainQueueValues,
  mergeShipments,
  pendingQueueRows,
  progressStagesDone,
  receiptTimelineOf,
  shipmentCardStats,
  shipmentProduceLine,
  shipmentRouteText,
  subTileValues,
  transferMatchesIntake,
} from '../screens/warehouse/receiving-qc/receivingLists';
import {
  activityStepTarget,
  historyResultFilter,
  progressStageTarget,
  receivingRouteFor,
} from '../screens/warehouse/receiving-qc/receivingNav';
import { pendingQueueOf, type ReceivingOverview } from '../screens/warehouse/receiving-qc/receivingViews';

const NOW = new Date('2026-10-26T06:30:00.000Z'); // 12:00 IST

const OVERVIEW: ReceivingOverview = {
  expectedToday: 1,
  awaitingReceiving: 2,
  inProgress: 3,
  awaitingQc: 4,
  partiallyAccepted: 5,
  receivedToday: 6,
  completedToday: 7,
  issues: 8,
};

function shipment(over: Partial<LiveShipment> = {}): LiveShipment {
  return {
    kind: 'purchaseOrder',
    id: 'po-1',
    code: 'PO-2026-000001',
    type: 'Farmer/Admin',
    status: 'Expected',
    statusLabel: 'Expected',
    warehouseId: 'wh-1',
    from: 'Ravi Kumar',
    to: 'Coonoor',
    produce: 'Tomato',
    cropName: 'Tomato',
    grade: 'Grade 1',
    expectedGrams: 480_000,
    receivedGrams: null,
    acceptedGrams: null,
    rejectedGrams: null,
    issuedAt: '2026-10-20T08:00:00.000Z',
    issuedOn: '20 Oct 2026',
    expectedArrival: '',
    receiptIds: [],
    farmerCode: '',
    ...over,
  };
}

function receipt(over: Partial<LiveReceipt> = {}): LiveReceipt {
  return {
    id: 'gr-1',
    receiptId: 'GRN-2026-000001',
    purchaseOrderId: 'po-1',
    shipmentId: 'PO-2026-000001',
    warehouseId: 'wh-1',
    warehouseName: 'Coonoor',
    result: 'Accepted',
    resultLabel: 'Accepted',
    receivedAt: '2026-10-26T04:00:00.000Z',
    date: 'Today · 09:30 AM',
    day: '26 Oct 2026',
    product: 'Tomato',
    grade: 'Grade 1',
    expectedGrams: null,
    receivedGrams: 480_000,
    acceptedGrams: 445_000,
    rejectedGrams: 35_000,
    ...over,
  };
}

describe('M2-01 dashboard figures: each tile shows the live figure its label names', () => {
  it('Sub tiles map one to one onto the overview', () => {
    expect(subTileValues(OVERVIEW)).toEqual({ expected: 1, awaiting: 2, qc: 4, partial: 5, completed: 7, issues: 8 });
  });

  it('Main KPIs: Expected Today, Arrived = receipts recorded today, In Progress, Completed today; no Discrepancies / Avg Turnaround (no API)', () => {
    expect(mainKpiValues(OVERVIEW)).toEqual([
      { key: 'expected', value: 1 },
      { key: 'arrived', value: 6 },
      { key: 'in_progress', value: 3 },
      { key: 'completed', value: 7 },
    ]);
    const keys = mainKpiValues(OVERVIEW).map((k) => k.key as string);
    expect(keys).not.toContain('discrepancies');
    expect(keys).not.toContain('turnaround');
  });

  it('Main queue rows: Arrived and QC Pending = receipts awaiting QC, In Progress = partly received; Decision/Batch/Storage Pending have no API (one QC call, BR-106)', () => {
    expect(mainQueueValues(OVERVIEW)).toEqual([
      { key: 'arrived', value: 4 },
      { key: 'in_progress', value: 3 },
      { key: 'qc_pending', value: 4 },
    ]);
  });
});

describe('Pending Receiving Queue tabs', () => {
  const ships = [
    shipment({ id: 'a', status: 'Awaiting QC' }),
    shipment({ id: 'b', status: 'Receiving' }),
    shipment({ id: 'c', status: 'Expected' }),
    shipment({ id: 'd', status: 'Completed' }),
  ];
  const sections = pendingQueueOf(ships);

  it('has no Decision Pending tab (no API)', () => {
    expect(PENDING_QUEUE_TABS).toEqual(['Arrived', 'In Progress', 'QC Pending']);
  });

  it('Arrived and QC Pending list the orders with a receipt awaiting QC; In Progress the partly received ones', () => {
    expect(pendingQueueRows(sections, 'Arrived').map((s) => s.id)).toEqual(['a']);
    expect(pendingQueueRows(sections, 'QC Pending').map((s) => s.id)).toEqual(['a']);
    expect(pendingQueueRows(sections, 'In Progress').map((s) => s.id)).toEqual(['b']);
  });
});

describe('M2-02 shipment card figures', () => {
  it('Expected: the ordered weight only (no dispatch data in the API, so no Dispatch figure)', () => {
    expect(shipmentCardStats(shipment(), NOW)).toEqual([{ key: 'expected', label: t('receiving.stat.expected'), value: '480 KG' }]);
  });

  it('Completed: Received and Accepted from the live grams', () => {
    const s = shipment({ status: 'Completed', receivedGrams: 480_000, acceptedGrams: 445_000 });
    expect(shipmentCardStats(s, NOW)).toEqual([
      { key: 'received', label: t('receiving.stat.received'), value: '480 KG' },
      { key: 'accepted', label: t('receiving.stat.accepted'), value: '445 KG' },
    ]);
  });

  it('Rejected: Received and Rejected', () => {
    const s = shipment({ status: 'Rejected', receivedGrams: 100_000, rejectedGrams: 100_000 });
    expect(shipmentCardStats(s, NOW).map((x) => [x.key, x.value])).toEqual([
      ['received', '100 KG'],
      ['rejected', '100 KG'],
    ]);
  });

  it('in progress: Expected and Arrived = when the first receipt was recorded', () => {
    const s = shipment({ status: 'Awaiting QC', firstReceivedAt: '2026-10-26T04:00:00.000Z' });
    expect(shipmentCardStats(s, NOW)).toEqual([
      { key: 'expected', label: t('receiving.stat.expected'), value: '480 KG' },
      { key: 'arrived', label: t('receiving.stat.arrived'), value: 'Today · 09:30 AM' },
    ]);
  });

  it('a figure the API does not carry is hidden, never 0 (transfer list rows have no weights)', () => {
    const s = shipment({ kind: 'transfer', type: 'Inter-Warehouse Transfer', expectedGrams: null, produce: '', grade: '' });
    expect(shipmentCardStats(s, NOW)).toEqual([]);
    expect(shipmentCardStats(shipment({ status: 'Completed', receivedGrams: null, acceptedGrams: null }), NOW)).toEqual([]);
  });

  it('English labels equal the design copy they replace', () => {
    expect([t('receiving.stat.expected'), t('receiving.stat.received'), t('receiving.stat.accepted'), t('receiving.stat.rejected'), t('receiving.stat.arrived')]).toEqual([
      'Expected',
      'Received',
      'Accepted',
      'Rejected',
      'Arrived',
    ]);
  });

  it('route and produce lines skip what is unknown', () => {
    expect(shipmentRouteText(shipment())).toBe('→ Ravi Kumar → Coonoor');
    expect(shipmentRouteText(shipment({ from: '' }))).toBe('→ Coonoor');
    expect(shipmentProduceLine(shipment())).toBe('Tomato · Grade 1');
    expect(shipmentProduceLine(shipment({ grade: '' }))).toBe('Tomato');
    expect(shipmentProduceLine(shipment({ produce: '', grade: '' }))).toBeNull();
  });
});

describe('M2-02 / M2-03 which lists a facet reads', () => {
  it('Shipment Type picks purchase orders (and their receipts) or inbound transfers', () => {
    expect(intakeListsFor('All')).toEqual({ purchaseOrders: true, transfers: true, receipts: true });
    expect(intakeListsFor('Farmer/Admin')).toEqual({ purchaseOrders: true, transfers: false, receipts: true });
    expect(intakeListsFor('Inter-Warehouse Transfer')).toEqual({ purchaseOrders: false, transfers: true, receipts: false });
  });

  it('transfers (no server q/from/to) are narrowed client side by the same q and IST days', () => {
    const tr = shipment({ kind: 'transfer', code: 'TRF-2026-000007', from: 'Ooty', to: 'Coonoor', issuedAt: '2026-10-25T05:00:00.000Z' });
    expect(transferMatchesIntake(tr, {})).toBe(true);
    expect(transferMatchesIntake(tr, { q: 'trf-2026' })).toBe(true);
    expect(transferMatchesIntake(tr, { q: 'ooty' })).toBe(true);
    expect(transferMatchesIntake(tr, { q: 'carrot' })).toBe(false);
    expect(transferMatchesIntake(tr, { from: '2026-10-25', to: '2026-10-25' })).toBe(true);
    expect(transferMatchesIntake(tr, { from: '2026-10-26' })).toBe(false);
    expect(transferMatchesIntake(tr, { to: '2026-10-24' })).toBe(false);
    expect(transferMatchesIntake(shipment({ kind: 'transfer', issuedAt: undefined }), { from: '2026-10-01' })).toBe(false);
  });

  it('merges orders and transfers newest first', () => {
    const a = shipment({ id: 'a', issuedAt: '2026-10-20T00:00:00.000Z' });
    const b = shipment({ id: 'b', kind: 'transfer', issuedAt: '2026-10-22T00:00:00.000Z' });
    const c = shipment({ id: 'c', issuedAt: '2026-10-21T00:00:00.000Z' });
    expect(mergeShipments([a, c], [b]).map((s) => s.id)).toEqual(['b', 'c', 'a']);
  });
});

describe('M2-04 receiving progress: only stages the API can prove', () => {
  it('stage lists keep the design copy', () => {
    expect(MAIN_PROGRESS_STAGES).toEqual([
      'Shipment Arrived',
      'Receiving Started',
      'Quantity Verification',
      'Quality Check',
      'Decision',
      'Batch Assignment',
      'Storage Assignment',
      'Receipt Completion',
    ]);
    expect(SUB_PROGRESS_STAGES).toEqual([
      'Shipment Arrived',
      'Receiving Started',
      'Quantity Verification',
      'Quality Check',
      'Decision',
      'Storage Assignment',
      'Receipt Completion',
    ]);
  });

  it('no receipt: nothing is done', () => {
    expect(progressStagesDone(MAIN_PROGRESS_STAGES, undefined)).toEqual(MAIN_PROGRESS_STAGES.map(() => false));
  });

  it('a receipt awaiting QC: arrival, start and quantity are done', () => {
    expect(progressStagesDone(MAIN_PROGRESS_STAGES, { result: 'Awaiting QC' })).toEqual([true, true, true, false, false, false, false, false]);
  });

  it('a checked receipt: QC, decision and completion done; batch only with a batch; storage never provable (no location on the read)', () => {
    expect(progressStagesDone(MAIN_PROGRESS_STAGES, { result: 'Rejected' })).toEqual([true, true, true, true, true, false, false, true]);
    expect(progressStagesDone(MAIN_PROGRESS_STAGES, { result: 'Accepted', batchCode: 'BATCH-2026-000001' })).toEqual([
      true,
      true,
      true,
      true,
      true,
      true,
      false,
      true,
    ]);
    expect(progressStagesDone(SUB_PROGRESS_STAGES, { result: 'Partially Accepted', batchId: 'b-1' })).toEqual([true, true, true, true, true, false, true]);
  });

  it('an unknown receipt status proves only that a receipt exists', () => {
    expect(progressStagesDone(SUB_PROGRESS_STAGES, { result: 'Unknown' })).toEqual([true, true, true, false, false, false, false]);
  });
});

describe('M2-15 Receiving History rows', () => {
  it('Received / Accepted / Rejected, each hidden when unknown (awaiting QC has no decision yet)', () => {
    expect(historyRowStats(receipt()).map((s) => [s.key, s.label, s.value])).toEqual([
      ['received', t('receiving.stat.received'), '480 KG'],
      ['accepted', t('receiving.stat.accepted'), '445 KG'],
      ['rejected', t('receiving.stat.rejected'), '35 KG'],
    ]);
    expect(historyRowStats(receipt({ result: 'Awaiting QC', acceptedGrams: null, rejectedGrams: null })).map((s) => s.key)).toEqual(['received']);
  });

  it('the search box narrows the loaded rows by GRN, order, product or warehouse (no refetch per keystroke)', () => {
    const rows = [receipt(), receipt({ id: 'gr-2', receiptId: 'GRN-2026-000002', shipmentId: 'PO-2026-000009', product: 'Carrot', warehouseName: 'Ooty' })];
    expect(filterHistoryRows(rows, '').length).toBe(2);
    expect(filterHistoryRows(rows, ' carrot ').map((r) => r.id)).toEqual(['gr-2']);
    expect(filterHistoryRows(rows, 'grn-2026-000001').map((r) => r.id)).toEqual(['gr-1']);
    expect(filterHistoryRows(rows, 'po-2026-000009').map((r) => r.id)).toEqual(['gr-2']);
    expect(filterHistoryRows(rows, 'ooty').map((r) => r.id)).toEqual(['gr-2']);
  });

  it('the Receiving Result facet applies when the pill is All; a picked pill wins', () => {
    expect(historyResultFilter('All', 'All')).toBe('All');
    expect(historyResultFilter('All', 'Rejected')).toBe('Rejected');
    expect(historyResultFilter('Partial', 'Rejected')).toBe('Partial');
  });
});

describe('Receipt History Detail timeline: real events only', () => {
  const base: LiveReceiptDetail = { ...receipt(), qualityCheck: null };

  it('a receipt awaiting QC has only its arrival (recording the receipt is the arrival)', () => {
    expect(receiptTimelineOf({ ...base, result: 'Awaiting QC' }, NOW)).toEqual([
      { key: 'received', title: t('receiving.timeline.arrived'), at: base.receivedAt, time: 'Today · 09:30 AM' },
    ]);
  });

  it('a checked receipt adds Quality Checked at checkedAt', () => {
    const detail: LiveReceiptDetail = {
      ...base,
      qualityCheck: {
        outcome: 'ACCEPTED',
        outcomeLabel: 'Accepted',
        apiAssignedGrade: 'GRADE_1',
        assignedGrade: 'Grade 1',
        checkedAt: '2026-10-26T05:00:00.000Z',
        checkedOn: '26 Oct 2026',
        points: [],
        passedPoints: 0,
        acceptedGrams: 445_000,
        rejectedGrams: 35_000,
        damagedGrams: null,
        spoiledGrams: null,
        cropMismatchGrams: null,
      },
    };
    expect(receiptTimelineOf(detail, NOW).map((e) => [e.key, e.time])).toEqual([
      ['received', 'Today · 09:30 AM'],
      ['checked', 'Today · 10:30 AM'],
    ]);
    expect([t('receiving.timeline.arrived'), t('receiving.timeline.qualityChecked')]).toEqual(['Arrived', 'Quality Checked']);
  });
});

describe('badge tones for the live statuses', () => {
  it('shipments', () => {
    expect(liveShipmentTone('Expected')).toBe('brandSoft');
    expect(liveShipmentTone('Completed')).toBe('success');
    expect(liveShipmentTone('Receiving')).toBe('info');
    expect(liveShipmentTone('Awaiting QC')).toBe('warning');
    expect(liveShipmentTone('Rejected')).toBe('danger');
    expect(liveShipmentTone('Cancelled')).toBe('danger');
    expect(liveShipmentTone('Unknown')).toBe('brandSoft');
  });

  it('receipts', () => {
    expect(liveReceiptTone('Accepted')).toBe('success');
    expect(liveReceiptTone('Rejected')).toBe('danger');
    expect(liveReceiptTone('Partially Accepted')).toBe('warning');
    expect(liveReceiptTone('Awaiting QC')).toBe('warning');
    expect(liveReceiptTone('Counter-Offered')).toBe('info');
    expect(liveReceiptTone('Unknown')).toBe('brandSoft');
  });
});

describe('navigation without a known purchase order never opens the wizard on a made-up shipment', () => {
  it('old shell sub-view keys for wizard steps open the list to pick an order', () => {
    expect(receivingRouteFor('start_receiving')).toEqual({ screen: 'Shipments', params: { statusTab: 'Expected' } });
    expect(receivingRouteFor('quantity_verification')).toEqual({ screen: 'Shipments', params: { statusTab: 'Expected' } });
    for (const key of ['quality_check', 'grade_product_verification', 'acceptance_decision', 'partial_acceptance', 'batch_assignment', 'storage_location_assignment']) {
      expect(receivingRouteFor(key)).toEqual({ screen: 'Shipments', params: { statusTab: 'QC Pending' } });
    }
    expect(receivingRouteFor('damage_mismatch_report')).toEqual({ screen: 'History' });
    expect(receivingRouteFor('goods_receipt_summary')).toEqual({ screen: 'History' });
  });

  it('detail keys without an id open their list; the rest keep their route', () => {
    expect(receivingRouteFor('shipment_detail')).toEqual({ screen: 'Shipments' });
    expect(receivingRouteFor('receiving_history_detail')).toEqual({ screen: 'History' });
    expect(receivingRouteFor('incoming_shipments')).toEqual({ screen: 'Shipments' });
    expect(receivingRouteFor('search_filters')).toEqual({ screen: 'SearchFilters' });
    expect(receivingRouteFor('quality_issues_ops')).toEqual({ screen: 'QualityIssues' });
    expect(receivingRouteFor('receiving_activity')).toEqual({ screen: 'ActivityTimeline' });
    expect(receivingRouteFor('pending_queue')).toEqual({ screen: 'PendingQueue' });
    expect(receivingRouteFor(undefined)).toEqual({ screen: 'Dashboard' });
    expect(receivingRouteFor('nope')).toEqual({ screen: 'Dashboard' });
  });

  it('activity timeline steps open the list where that stage is worked on', () => {
    expect(activityStepTarget('shipment_detail')).toEqual({ screen: 'Shipments' });
    expect(activityStepTarget('start_receiving')).toEqual({ screen: 'Shipments', params: { statusTab: 'Expected' } });
    expect(activityStepTarget('quantity_verification')).toEqual({ screen: 'Shipments', params: { statusTab: 'Expected' } });
    for (const step of ['quality_check', 'receiving_decision', 'batch_assignment', 'storage_assignment']) {
      expect(activityStepTarget(step)).toEqual({ screen: 'Shipments', params: { statusTab: 'QC Pending' } });
    }
    expect(activityStepTarget('receipt_confirmation')).toEqual({ screen: 'History' });
  });
});

describe('Shipment Detail progress stage presses', () => {
  const po = 'po-uuid';

  it('a pending receipt resumes it at that stage (storage is the batch step, BR-106)', () => {
    const ctx = { purchaseOrderId: po, receivable: false, pendingReceiptId: 'gr-p', newestReceiptId: 'gr-p' };
    expect(progressStageTarget('Quality Check', ctx)).toEqual({
      screen: 'Wizard',
      params: { wizardStep: 'quality_check', shipmentId: po, receiptId: 'gr-p' },
    });
    expect(progressStageTarget('Storage Assignment', ctx)?.params?.wizardStep).toBe('batch_assignment');
    expect(progressStageTarget('Decision', ctx)?.params?.wizardStep).toBe('receiving_decision');
    expect(progressStageTarget('Receipt Completion', ctx)?.params?.wizardStep).toBe('receipt_confirmation');
  });

  it('a receivable order without a pending receipt starts a new receipt (a later stage needs one first)', () => {
    const ctx = { purchaseOrderId: po, receivable: true };
    expect(progressStageTarget('Quantity Verification', ctx)).toEqual({
      screen: 'Wizard',
      params: { wizardStep: 'quantity_verification', shipmentId: po, receiptId: undefined },
    });
    expect(progressStageTarget('Quality Check', ctx)).toEqual({
      screen: 'Wizard',
      params: { wizardStep: 'start_receiving', shipmentId: po, receiptId: undefined },
    });
  });

  it('a closed order opens its newest receipt, or nothing', () => {
    expect(progressStageTarget('Decision', { purchaseOrderId: po, receivable: false, newestReceiptId: 'gr-9' })).toEqual({
      screen: 'HistoryDetail',
      params: { receiptId: 'gr-9' },
    });
    expect(progressStageTarget('Decision', { purchaseOrderId: po, receivable: false })).toBeNull();
  });
});

describe('a detail read outside the scope or for an unknown id is "not found", never an error to retry', () => {
  it('404 / NOT_FOUND is not found; anything else is an error', () => {
    expect(isNotFoundError(new ApiError({ type: 'about:blank', title: 'Not found', status: 404, code: 'NOT_FOUND' }))).toBe(true);
    expect(isNotFoundError(new ApiError({ type: 'about:blank', title: 'Boom', status: 500, code: 'INTERNAL' }))).toBe(false);
    expect(isNotFoundError(new NetworkError('offline'))).toBe(false);
    expect(isNotFoundError(null)).toBe(false);
  });
});
