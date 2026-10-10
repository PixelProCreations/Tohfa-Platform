/**
 * Mock data for the goods receiving & QC screens until they call the API.
 *
 * Nothing here is a business threshold: the receiving rules the server owns
 * (QC scales, rejection reason codes, counter-offer window) come from
 * system_config / reference data, and these screens show no number for them
 * (CLAUDE.md 2.7). No warehouse name is hard-coded into a screen either: the
 * wizard and the detail screen take the warehouse from `scope`, and each record
 * carries its own warehouse.
 */
import type {
  HistoryFilter,
  IncomingShipment,
  InspectionParameter,
  QcCriterion,
  QcResult,
  QualityIssue,
  ReceiptResult,
  ReceiptTimelineEvent,
  ReceivingFilters,
  ReceivingRecord,
  ShipmentFilterTab,
  ShipmentLineItem,
  ShipmentStatus,
  StorageBayOption,
  WarehouseScope,
  WizardShipmentData,
} from './types';

/** Main Warehouse view: no warehouseId means every warehouse. */
export function isMainScope(scope: WarehouseScope): boolean {
  return scope.warehouseId === undefined;
}

/** Warehouse id of the demo Sub warehouse (matches the Sub shell scope). */
const COONOOR_ID = 'WH-COON';

/** The shipment the wizard opens on when a shell passes none. */
export const DEMO_SHIPMENT: WizardShipmentData = {
  code: 'GR-1024',
  produce: 'Tomato',
  grade: 'Grade 1',
  expectedQty: 150,
  receivedQty: 145,
  rejectedQty: 5,
  receivedDate: '24 Sep 2026',
  receivedTime: '10:30 AM',
  reference: 'PO-2026-0024',
  from: 'Main Warehouse',
  vehicle: 'TN-43-E-8821 (Murugan)',
  arrival: '10:32 AM · Today',
  crateTareKg: 2,
};

/** Other product lines shown in the quantity table when a shipment carries more than one. */
export const DEMO_EXTRA_LINES: ShipmentLineItem[] = [];

/** The Quality step's criteria (scales are configured server-side; no numeric score is invented). */
export const QC_CRITERIA: QcCriterion[] = [
  { id: 'appearance', code: '01 — REQUIRED', title: 'Appearance', icon: 'eye' },
  { id: 'size', code: '02 — REQUIRED', title: 'Size Uniformity', icon: 'ruler' },
  { id: 'moisture', code: '03 — REQUIRED', title: 'Moisture', icon: 'drop' },
  { id: 'damage', code: '04 — REQUIRED', title: 'Damage / Pest', icon: 'bug' },
  { id: 'freshness', code: '05 — REQUIRED', title: 'Freshness', icon: 'leaf' },
];

/** Starting QC results of the demo shipment. */
export const DEMO_QC_RESULTS: Record<string, QcResult> = {
  appearance: 'pass',
  size: 'pass',
  moisture: 'pass',
  damage: 'attention',
  freshness: 'pass',
};

/** The review step's quick inspection checklist (absorbed from Review Receiving). */
export const INSPECTION_PARAMETERS: InspectionParameter[] = [
  {
    id: 'firmness',
    title: 'Physical Firmness & Skin Condition',
    description: 'Firm structure, no visible crushing or bruising',
  },
  { id: 'ripeness', title: 'Color & Ripeness Index', description: 'Standard 80-90% red turning grade' },
  { id: 'pestFree', title: 'Pest & Foreign Material Free', description: 'Clean crates with 0% infestation' },
];

/** Product options of the Grade & Product verification step. */
export const PRODUCT_OPTIONS = ['Tomato', 'Potato', 'Carrot', 'Spinach', 'Beans'];

/** Grade options of the Grade & Product verification step. */
export const GRADE_OPTIONS = ['Grade 1', 'Grade 2', 'Grade 3', 'Industrial'];

/** Issue types of the Damage / Mismatch step (reason codes are reference data server-side). */
export const ISSUE_TYPES = [
  'Quantity Mismatch',
  'Quality Mismatch',
  'Product Mismatch',
  'Grade Mismatch',
  'Damaged',
  'Missing',
  'Other (configured reason)',
];

/** Rejection reasons of the Partial Acceptance step. */
export const PARTIAL_REJECTION_REASONS = [
  'Damage / Pest',
  'Quality Below Grade',
  'Quantity Shortage',
  'Wrong Product',
  'Other (configured reason)',
];

/** Rejection reasons of the Rejected Goods step. */
export const REJECTED_GOODS_REASONS = [
  'Damaged',
  'Quantity Mismatch',
  'Quality Mismatch',
  'Missing Produce',
  'Other (configured reason)',
];

/** Handling / disposal methods of the Record Handling step. */
export const HANDLING_METHODS = ['Return to Vendor', 'Disposal', 'Quarantine'];

/** Storage bays offered by batch / storage assignment (per warehouse once the API serves them). */
export const STORAGE_BAYS: StorageBayOption[] = [
  { id: 'A-01', label: 'Bay A-01', zone: 'Dry Zone', availableKg: 620 },
  { id: 'A-03', label: 'Bay A-03', zone: 'Cold Zone (16°C)', availableKg: 480 },
  { id: 'B-02', label: 'Bay B-02', zone: 'Ambient Zone', availableKg: 300 },
];

/** Batch ids the demo confirmation shows (the server assigns real ones). */
export const DEMO_BATCH_IDS = { full: 'BAT-2026-00125', partial: 'BAT-2026-00126' } as const;

/** GRN the demo review step confirms (the server assigns real ones). */
export const DEMO_GRN = 'GRN-COO-2026-0924';

/** Draft progress of the "Receiving in Progress" step. */
export const DEMO_QC_PROGRESS = { done: 4, total: 5 } as const;

/** Rejection quantity a Partial Accept starts from when nothing was rejected yet (demo). */
export const DEMO_PARTIAL_REJECT_KG = 5;

const GR_1024_TIMELINE: ReceiptTimelineEvent[] = [
  { title: 'Dispatched', time: '23 Sep · 09:10 AM' },
  { title: 'Arrived', time: '24 Sep · 10:30 AM' },
  { title: 'Receiving Started', time: '24 Sep · 10:35 AM' },
  { title: 'Quantity Checked', time: '24 Sep · 10:42 AM' },
  { title: 'QC Completed', time: '24 Sep · 10:50 AM' },
  { title: 'Partial Acceptance Confirmed', time: '24 Sep · 10:54 AM' },
];

/**
 * Recorded goods receipts. GR-1024 is the wizard's own receipt (its old inline
 * receipt_detail step), the GRN-0008xx rows are the Receiving History rows the
 * Main shell used to compute inline per id, and GR-00245 is the absorbed Sub
 * GoodsReceiptDetail receipt (an open variance).
 */
export const RECEIVING_RECORDS: ReceivingRecord[] = [
  {
    receiptId: 'GR-1024',
    shipmentId: 'PO-2026-0024',
    warehouseId: COONOOR_ID,
    warehouseName: 'Coonoor',
    result: 'Partially Accepted',
    receivedBy: 'SWA-COO-01',
    date: '24 Sep 2026',
    product: 'Tomato',
    grade: 'Grade 1',
    expectedKg: 150,
    receivedKg: 145,
    acceptedKg: 140,
    rejectedKg: 5,
    rejectionReason: 'Damage/Pest',
    batchId: DEMO_BATCH_IDS.partial,
    timeline: GR_1024_TIMELINE,
    qcResults: { appearance: 'attention', size: 'pass', moisture: 'fail', damage: 'attention', freshness: 'pass' },
  },
  {
    receiptId: 'GR-1023',
    shipmentId: 'PO-2026-0023',
    warehouseId: COONOOR_ID,
    warehouseName: 'Coonoor',
    result: 'Accepted',
    receivedBy: 'SWA-COO-01',
    date: '24 Sep 2026',
    product: 'Carrot',
    grade: 'Grade 1',
    expectedKg: 80,
    receivedKg: 80,
    acceptedKg: 80,
    rejectedKg: 0,
  },
  {
    receiptId: 'GR-1018',
    shipmentId: 'PO-2026-0018',
    warehouseId: COONOOR_ID,
    warehouseName: 'Coonoor',
    result: 'Rejected',
    receivedBy: 'SWA-COO-01',
    date: '22 Sep 2026',
    product: 'Spinach',
    grade: 'Grade 2',
    expectedKg: 30,
    receivedKg: 30,
    acceptedKg: 0,
    rejectedKg: 30,
  },
  {
    receiptId: 'GRN-000842',
    shipmentId: 'SHP-000124',
    warehouseId: COONOOR_ID,
    warehouseName: 'Coonoor',
    result: 'Partially Accepted',
    receivedBy: 'Suresh',
    date: '25 Sep 2026',
    product: 'Tomato',
    grade: 'Grade 2',
    expectedKg: 480,
    receivedKg: 480,
    acceptedKg: 445,
    rejectedKg: 35,
  },
  {
    receiptId: 'GRN-000839',
    shipmentId: 'SHP-000121',
    warehouseId: COONOOR_ID,
    warehouseName: 'Coonoor',
    result: 'Accepted',
    receivedBy: 'Suresh',
    date: '25 Sep 2026',
    product: 'Potato',
    grade: 'Grade 1',
    expectedKg: 300,
    receivedKg: 300,
    acceptedKg: 300,
    rejectedKg: 0,
  },
  {
    receiptId: 'GRN-000831',
    shipmentId: 'SHP-000118',
    warehouseId: COONOOR_ID,
    warehouseName: 'Coonoor',
    result: 'Rejected',
    receivedBy: 'Suresh',
    date: '25 Sep 2026',
    product: 'Carrot',
    grade: 'Grade 3',
    expectedKg: 150,
    receivedKg: 150,
    acceptedKg: 0,
    rejectedKg: 150,
  },
  {
    receiptId: 'GR-00245',
    shipmentId: 'SHP-000126',
    warehouseId: COONOOR_ID,
    warehouseName: 'Coonoor',
    result: 'Open',
    receivedBy: 'Suresh',
    date: '25 Sep 2026 · 10:42 AM',
    product: 'Tomato',
    grade: 'Grade 1',
    expectedKg: 500,
    receivedKg: 460,
    acceptedKg: 0,
    rejectedKg: 0,
    supplier: 'ABC Farmers Co-op',
    notes: 'Quantity received is less than expected. Please review and take action.',
  },
];

/** The receipt the Sub "goods receipt" alert opens (was SubWarehouseGoodsReceiptDetail). */
export const ALERT_RECEIPT_ID = 'GR-00245';

/** Rows of the wizard's embedded history list (the shell's Receiving History is the full list). */
export const WIZARD_HISTORY_IDS = ['GR-1024', 'GR-1023', 'GR-1018'];

/** Find a record by id. Undefined when it does not exist. */
export function findReceivingRecord(
  receiptId: string | undefined,
  records: ReceivingRecord[] = RECEIVING_RECORDS,
): ReceivingRecord | undefined {
  return records.find((r) => r.receiptId === receiptId);
}

/**
 * Records a scope may see: a Sub scope only its own warehouse (BR-30,
 * inventory.batch.view = own), Main every warehouse. A cross-scope id resolves
 * to nothing rather than to a "forbidden" state, so it never leaks existence.
 */
export function recordsInScope(scope: WarehouseScope, records: ReceivingRecord[] = RECEIVING_RECORDS): ReceivingRecord[] {
  if (isMainScope(scope)) return records;
  return records.filter((r) => r.warehouseId === scope.warehouseId);
}

// ─── Receiving list screens ──────────────────────────────────────────────────

const OOTY_ID = 'WH-OOTY';
const KOTAGIRI_ID = 'WH-KOTA';

/**
 * Incoming shipments. The GR-10xx rows are the Sub shell's inline list
 * (Coonoor); the SHP-0001xx rows and GR-04512 are the Main IncomingShipments /
 * Incoming Goods rows (all four warehouses).
 */
export const INCOMING_SHIPMENTS: IncomingShipment[] = [
  {
    code: 'GR-1024',
    reference: 'PO-2026-0024',
    status: 'Awaiting QC',
    type: 'Inter-Warehouse Transfer',
    warehouseId: COONOOR_ID,
    from: 'Main Warehouse',
    to: 'Coonoor',
    produce: 'Tomato',
    grade: 'Grade 1',
    expectedQty: 150,
    receivedQty: 145,
    acceptedQty: 140,
    rejectedQty: 5,
    actualArrival: '24 Sep · 10:30 AM',
    dispatchDate: '23 Sep 2026',
    expectedArrival: '24 Sep 2026',
    batchSource: 'Internal only',
    vehicle: DEMO_SHIPMENT.vehicle,
    arrival: DEMO_SHIPMENT.arrival,
    crateTareKg: DEMO_SHIPMENT.crateTareKg,
  },
  {
    code: 'GR-1021',
    reference: 'PO-2026-0021',
    status: 'Mismatch',
    type: 'Inter-Warehouse Transfer',
    warehouseId: COONOOR_ID,
    from: 'Main Warehouse',
    to: 'Coonoor',
    produce: 'Carrot',
    grade: 'Grade 1',
    expectedQty: 100,
    receivedQty: 95,
    dispatchDate: '22 Sep 2026',
    expectedArrival: '23 Sep 2026',
    actualArrival: '23 Sep · 11:15 AM',
    batchSource: 'Internal only',
    hasReview: true,
  },
  {
    code: 'GR-1026',
    reference: 'PO-2026-0026',
    status: 'Expected',
    type: 'Inter-Warehouse Transfer',
    warehouseId: COONOOR_ID,
    from: 'Main Warehouse',
    to: 'Coonoor',
    produce: 'Beetroot',
    grade: 'Grade 1',
    expectedQty: 60,
    dispatchStatus: 'Today',
    dispatchDate: '24 Sep 2026',
    expectedArrival: '25 Sep 2026',
    actualArrival: 'Pending',
    batchSource: 'Internal only',
  },
  {
    code: 'GR-1023',
    reference: 'PO-2026-0023',
    status: 'Completed',
    type: 'Inter-Warehouse Transfer',
    warehouseId: COONOOR_ID,
    from: 'Main Warehouse',
    to: 'Coonoor',
    produce: 'Carrot',
    grade: 'Grade 1',
    expectedQty: 80,
    receivedQty: 80,
    acceptedQty: 80,
    dispatchDate: '22 Sep 2026',
    expectedArrival: '23 Sep 2026',
    actualArrival: '23 Sep · 09:00 AM',
    batchSource: 'Internal only',
  },
  {
    code: 'GR-1018',
    reference: 'PO-2026-0018',
    status: 'Rejected',
    type: 'Farmer/Admin',
    warehouseId: COONOOR_ID,
    from: 'Main Warehouse',
    to: 'Coonoor',
    produce: 'Spinach',
    grade: 'Grade 2',
    expectedQty: 30,
    receivedQty: 30,
    rejectedQty: 30,
    dispatchDate: '21 Sep 2026',
    expectedArrival: '22 Sep 2026',
    actualArrival: '22 Sep · 02:30 PM',
    batchSource: 'Purchase Order',
  },
  {
    code: 'SHP-000124',
    reference: 'CON-2026-0124',
    status: 'Arrived',
    type: 'Farmer/Admin',
    warehouseId: COONOOR_ID,
    from: 'Farmer Admin',
    to: 'Coonoor',
    produce: 'Tomato',
    grade: 'Grade 1',
    expectedQty: 500,
    dispatchDate: '24 Sep 2026',
    expectedArrival: '25 Sep 2026',
    actualArrival: '25 Sep · 09:15 AM',
    batchSource: 'Purchase Order',
    crates: 20,
  },
  {
    code: 'SHP-000119',
    reference: 'TRF-2026-0119',
    status: 'Receiving',
    type: 'Inter-Warehouse Transfer',
    warehouseId: OOTY_ID,
    from: 'Kotagiri',
    to: 'Ooty',
    produce: 'Carrot',
    grade: 'Grade 1',
    expectedQty: 200,
    dispatchDate: '24 Sep 2026',
    expectedArrival: '25 Sep 2026',
    actualArrival: '25 Sep · 08:40 AM',
    batchSource: 'Internal only',
  },
  {
    code: 'SHP-000120',
    reference: 'CON-2026-0120',
    status: 'Expected',
    type: 'Farmer/Admin',
    warehouseId: KOTAGIRI_ID,
    from: 'Farmer Admin',
    to: 'Kotagiri',
    produce: 'Cabbage',
    grade: 'Grade 1',
    expectedQty: 350,
    dispatchStatus: 'Today',
    dispatchDate: '25 Sep 2026',
    expectedArrival: '25 Sep 2026',
    batchSource: 'Purchase Order',
  },
  {
    code: 'SHP-000115',
    reference: 'TRF-2026-0115',
    status: 'Completed',
    type: 'Inter-Warehouse Transfer',
    warehouseId: COONOOR_ID,
    from: 'Ooty',
    to: 'Coonoor',
    produce: 'Potato Jyoti',
    grade: 'Grade 1',
    expectedQty: 600,
    receivedQty: 600,
    acceptedQty: 600,
    dispatchDate: '23 Sep 2026',
    expectedArrival: '24 Sep 2026',
    actualArrival: '24 Sep · 04:10 PM',
    batchSource: 'Internal only',
  },
  {
    code: 'GR-04512',
    reference: 'CON-2026-4512',
    status: 'Mismatch',
    type: 'Farmer/Admin',
    warehouseId: KOTAGIRI_ID,
    from: 'Farmer Admin',
    to: 'Kotagiri',
    produce: 'Beans',
    grade: 'Grade 1',
    expectedQty: 120,
    receivedQty: 112,
    dispatchDate: '24 Sep 2026',
    expectedArrival: '25 Sep 2026',
    actualArrival: '25 Sep · 09:45 AM',
    batchSource: 'Purchase Order',
    hasReview: true,
  },
];

/**
 * Quality / receiving issues. The QC-10xx rows are the Sub dashboard's Needs
 * Attention cards; QC-0914 is the Main Quality Issues incident and QC-4512 the
 * Main Incoming Goods discrepancy card.
 */
export const QUALITY_ISSUES: QualityIssue[] = [
  {
    id: 'QC-1024',
    kind: 'QC Pending',
    shipmentCode: 'GR-1024',
    produce: 'Tomato',
    detail: 'Received 145 KG, awaiting quality check',
    warehouseId: COONOOR_ID,
    time: '10:30 AM',
    target: 'wizard',
    wizardStep: 'quality_check',
  },
  {
    id: 'QC-1021',
    kind: 'Quantity Mismatch',
    shipmentCode: 'GR-1021',
    produce: 'Carrot',
    detail: 'Expected 100 KG, received 95 KG',
    warehouseId: COONOOR_ID,
    time: '11:15 AM',
    target: 'wizard',
    wizardStep: 'partial_acceptance',
  },
  {
    id: 'QC-1020',
    kind: 'Damage Reported',
    shipmentCode: 'GR-1020',
    produce: 'Beans',
    detail: '2 crates reported damaged',
    warehouseId: COONOOR_ID,
    time: '09:20 AM',
    target: 'operational_issue',
  },
  {
    id: 'QC-0914',
    kind: 'Damage Reported',
    shipmentCode: 'SHP-000120',
    produce: 'Cabbage',
    detail: 'Crushed crates',
    warehouseId: KOTAGIRI_ID,
    time: '08:30 AM',
    target: 'operational_issue',
  },
  {
    id: 'QC-4512',
    kind: 'Quantity Mismatch',
    shipmentCode: 'GR-04512',
    produce: 'Beans',
    detail: 'Discrepancy: qty mismatch',
    warehouseId: KOTAGIRI_ID,
    time: '09:45 AM',
    target: 'shipment',
  },
];

/** Average receiving turnaround in minutes per warehouse (Main KPI; a metric, not a threshold). */
export const RECEIVING_TURNAROUND_MIN: Record<string, number> = {
  [COONOOR_ID]: 34,
  [OOTY_ID]: 41,
  [KOTAGIRI_ID]: 39,
};

/** The receiving pipeline, in order (Main Receiving Activity card and shipment progress). */
export const RECEIVING_PIPELINE = [
  'Shipment Arrived',
  'Receiving Started',
  'Quantity Verification',
  'Quality Check',
  'Decision',
  'Batch Assignment',
  'Storage Assignment',
  'Receipt Completion',
] as const;

/** Pipeline stages a shipment has completed, by status. */
export function pipelineStagesDone(status: ShipmentStatus): number {
  switch (status) {
    case 'Expected':
      return 0;
    case 'Arrived':
      return 1;
    case 'Receiving':
      return 2;
    case 'Mismatch':
      return 3;
    case 'Awaiting QC':
      return 3;
    case 'Partially Accepted':
      return 5;
    default:
      return RECEIVING_PIPELINE.length;
  }
}

/** Filters that filter nothing. */
export const EMPTY_RECEIVING_FILTERS: ReceivingFilters = {
  search: '',
  status: 'All',
  date: 'All',
  grade: 'All',
  source: 'All',
  product: '',
  warehouseId: undefined,
  shipmentType: 'All',
  result: 'All',
};

/** True when a row owned by `warehouseId` is visible to `scope` (and the Main selector, if any). */
export function inReceivingScope(scope: WarehouseScope, warehouseId: string, selectedId?: string | undefined): boolean {
  if (!isMainScope(scope)) return warehouseId === scope.warehouseId;
  return selectedId === undefined || warehouseId === selectedId;
}

/** Shipments a scope may see; a cross-scope id resolves to nothing (no existence leak). */
export function shipmentsInScope(scope: WarehouseScope, shipments: IncomingShipment[] = INCOMING_SHIPMENTS): IncomingShipment[] {
  return shipments.filter((s) => inReceivingScope(scope, s.warehouseId));
}

/** Find a shipment within the scope. */
export function findShipment(
  scope: WarehouseScope,
  code: string | undefined,
  shipments: IncomingShipment[] = INCOMING_SHIPMENTS,
): IncomingShipment | undefined {
  return shipmentsInScope(scope, shipments).find((s) => s.code === code);
}

/** True when a shipment shows under a status pill (the Sub shell's pill mapping). */
export function matchesShipmentTab(status: ShipmentStatus, tab: ShipmentFilterTab): boolean {
  switch (tab) {
    case 'Expected':
      return status === 'Expected';
    case 'Arrived':
      return status === 'Arrived' || status === 'Awaiting QC';
    case 'Receiving':
      return status === 'Receiving' || status === 'Awaiting QC' || status === 'Mismatch' || status === 'Partially Accepted';
    case 'QC Pending':
      return status === 'Awaiting QC' || status === 'Partially Accepted';
    case 'Completed':
      return status === 'Completed';
    case 'Rejected':
      return status === 'Rejected' || status === 'Mismatch';
    default:
      return true;
  }
}

/** Search & Filters status facet -> shipment statuses ('Accepted' = completed; 'QC Pending' = awaiting QC). */
function matchesStatusFacet(status: ShipmentStatus, facet: string): boolean {
  if (facet === 'All') return true;
  if (facet === 'QC Pending') return status === 'Awaiting QC';
  if (facet === 'Accepted') return status === 'Completed';
  return status === facet;
}

/** Receiving Result facet (Main) -> shipment statuses. */
function matchesResultFacet(status: ShipmentStatus, facet: string): boolean {
  if (facet === 'All') return true;
  if (facet === 'Accepted') return status === 'Completed';
  if (facet === 'Partial') return status === 'Partially Accepted';
  return status === 'Rejected';
}

/**
 * Apply the Search & Filters facets to a shipment. The date facet is passed
 * to the API once shipments are served (the mock rows carry display dates
 * only), so it narrows nothing here.
 */
export function matchesReceivingFilters(s: IncomingShipment, f: ReceivingFilters): boolean {
  const q = f.search.trim().toLowerCase();
  if (q && ![s.code, s.reference, s.produce, s.from, s.to].some((v) => v.toLowerCase().includes(q))) return false;
  const p = f.product.trim().toLowerCase();
  if (p && !s.produce.toLowerCase().includes(p)) return false;
  if (!matchesStatusFacet(s.status, f.status)) return false;
  if (f.grade !== 'All' && s.grade !== f.grade) return false;
  if (f.source !== 'All' && (f.source === 'Purchase Order' ? s.batchSource !== 'Purchase Order' : s.from !== f.source)) return false;
  if (f.warehouseId !== undefined && s.warehouseId !== f.warehouseId) return false;
  if (f.shipmentType !== 'All' && s.type !== f.shipmentType) return false;
  return matchesResultFacet(s.status, f.result);
}

/** Number of facets that narrow the list (for the "filters applied" line). */
export function activeFilterCount(f: ReceivingFilters): number {
  return [
    f.search.trim() !== '',
    f.product.trim() !== '',
    f.status !== 'All',
    f.date !== 'All',
    f.grade !== 'All',
    f.source !== 'All',
    f.warehouseId !== undefined,
    f.shipmentType !== 'All',
    f.result !== 'All',
  ].filter(Boolean).length;
}

/** History pill -> receipt result. */
export function matchesHistoryFilter(result: ReceiptResult, filter: HistoryFilter): boolean {
  if (filter === 'All') return true;
  if (filter === 'Partial') return result === 'Partially Accepted';
  return result === filter;
}
