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
  InspectionParameter,
  QcCriterion,
  QcResult,
  ReceiptTimelineEvent,
  ReceivingRecord,
  ShipmentLineItem,
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
