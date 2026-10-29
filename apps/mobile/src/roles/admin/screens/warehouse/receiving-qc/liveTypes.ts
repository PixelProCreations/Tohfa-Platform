/**
 * What the receiving screens (design M2) show once their data comes from the
 * API: purchase orders and inbound transfers as shipments, goods receipts as
 * receipts, a receipt's quality check, its damage / mismatch reports and the
 * storage locations a batch can be put away to. Produced by ./mappers.ts from
 * the rows in roles/admin/api/receiving.ts.
 *
 * Every weight is integer grams (never a float kg), and a value the API does
 * not carry is `null` / `undefined`, so a screen HIDES it instead of showing a
 * sample or a 0 that is not true (WIRE rule: never fake data).
 */
import type { Money } from '@tohfa/shared-types';
import type { Grade } from '../../../api/inventory';
import type {
  GoodsReceiptDiscrepancyStatus,
  GoodsReceiptDiscrepancyType,
  GoodsReceiptPackageUnit,
  QcConditionLevel,
  QcRejectionReasonCode,
  QualityCheckParameter,
  QualityOutcome,
} from '../../../api/receiving';

/**
 * A shipment's receiving status, derived from its purchase order and that
 * order's receipts (shipmentStatusOf), or from a transfer's status. There is
 * no "Arrived" (owner decision: no arrival status or endpoint; recording a
 * receipt is the arrival) and no "Mismatch" (a discrepancy is per receipt).
 */
export type LiveShipmentStatus = 'Expected' | 'Awaiting QC' | 'Receiving' | 'Completed' | 'Rejected' | 'Cancelled' | 'Unknown';

/** The two documented shipment contexts. */
export type LiveShipmentType = 'Farmer/Admin' | 'Inter-Warehouse Transfer';

/** BR-123: the packages counted at intake. */
export interface LivePackages {
  count: number;
  unit: GoodsReceiptPackageUnit;
  /** "12 crates", translated. */
  label: string;
}

/** A purchase order (or an inbound transfer) as the shipment screens show it. */
export interface LiveShipment {
  kind: 'purchaseOrder' | 'transfer';
  /** Purchase order uuid, or transfer uuid. */
  id: string;
  /** poNumber, or the transfer number. */
  code: string;
  type: LiveShipmentType;
  status: LiveShipmentStatus;
  statusLabel: string;
  /** The receiving warehouse. */
  warehouseId: string;
  /** Purchase order: the farmer's name (admin-only surface); transfer: the source warehouse. '' when unknown. */
  from: string;
  /** The receiving warehouse's name, '' when unknown. */
  to: string;
  /** The crop name, else a label naming the order ("Crop of PO-…"); '' for a transfer (its list row has no lines). */
  produce: string;
  /** The crop name the API sent (BR-119); undefined when it did not. */
  cropName?: string | undefined;
  /** The listed grade's label, '' when none. */
  grade: string;
  apiGrade?: Grade | undefined;
  cropId?: string | undefined;
  /** Ordered weight; null when unknown (a transfer list row). */
  expectedGrams: number | null;
  /** Sum of the receipts' gross; null when the receipts are not known. */
  receivedGrams: number | null;
  /** Sum accepted over the checked receipts; null when none is checked or unknown. */
  acceptedGrams: number | null;
  /** Sum rejected over the checked receipts; null when none is checked or unknown. */
  rejectedGrams: number | null;
  /** ISO instant the order was issued / the transfer created. */
  issuedAt?: string | undefined;
  /** "25 Sep 2026", '' when unknown. */
  issuedOn: string;
  /** Expected delivery day, "25 Sep 2026"; '' when the order has none. */
  expectedArrival: string;
  /** The same day as the API sends it ("YYYY-MM-DD"), for "expected today". */
  expectedDeliveryDate?: string | undefined;
  /** When the first receipt was recorded (the real "actual arrival"); undefined before any. */
  firstReceivedAt?: string | undefined;
  /** BR-123: the newest receipt's packages; undefined when none were counted. */
  packages?: LivePackages | undefined;
  /** The order's receipts (uuids), when known. */
  receiptIds: readonly string[];
  /** A receipt of this order still awaiting its quality check (resume it, never re-receive). */
  pendingReceiptId?: string | undefined;
  /** The farmer's TOHFA id (detail read only), '' otherwise. */
  farmerCode: string;
  pricePerKg?: Money | undefined;
  totalAmount?: Money | undefined;
}

/** A goods receipt's state, as the screens name it. */
export type LiveReceiptResult = 'Awaiting QC' | 'Accepted' | 'Partially Accepted' | 'Rejected' | 'Counter-Offered' | 'Unknown';

/** A goods receipt as Receiving History, the dashboards and the receipt screens show it. */
export interface LiveReceipt {
  /** Receipt uuid (for API calls). */
  id: string;
  /** grnNumber (what people read). */
  receiptId: string;
  purchaseOrderId: string;
  /** The order's poNumber, '' when unknown. */
  shipmentId: string;
  warehouseId: string;
  warehouseName: string;
  result: LiveReceiptResult;
  resultLabel: string;
  /** ISO instant. */
  receivedAt: string;
  /** "Today · 10:30 AM" / "25 Sep 2026 · 10:30 AM" (IST). */
  date: string;
  /** "25 Sep 2026" (IST). */
  day: string;
  product: string;
  cropName?: string | undefined;
  /** Listed grade label, '' when unknown. */
  grade: string;
  apiGrade?: Grade | undefined;
  /** The order's quantity, when the screen knows the order. */
  expectedGrams: number | null;
  receivedGrams: number | null;
  /** null until the quality check (the server sends 0.000 before it: "not decided", not "nothing"). */
  acceptedGrams: number | null;
  rejectedGrams: number | null;
  rejectionReason?: string | undefined;
  vehicleNumber?: string | undefined;
  /** BR-119: the receiver's name; undefined when the API has none. */
  receivedBy?: string | undefined;
  /** BR-106: the batch the receipt was stocked as. */
  batchId?: string | undefined;
  batchCode?: string | undefined;
  packages?: LivePackages | undefined;
}

/** One checklist row's state in the wizard and on a recorded check. */
export type LiveQcResult = 'pass' | 'attention' | 'fail';

/** The wizard's five checklist rows (one per QualityCheckParameter). */
export type QcCriterionId = 'appearance' | 'size' | 'moisture' | 'damage' | 'freshness';

/** One point of a recorded quality check (BR-120). */
export interface LiveQcPoint {
  criterionId: QcCriterionId;
  parameter: QualityCheckParameter;
  passed: boolean;
  /** pass when passed, else fail (the API stores pass / fail; the condition says how bad). */
  result: LiveQcResult;
  condition?: QcConditionLevel | undefined;
  conditionLabel?: string | undefined;
  score?: number | undefined;
  /** The stored measured value as sent ("12.500"). */
  measuredValue?: string | undefined;
  remarks?: string | undefined;
}

/** A receipt's latest quality check (BR-119, BR-120). */
export interface LiveQualityCheck {
  outcome: QualityOutcome;
  outcomeLabel: string;
  apiAssignedGrade: Grade;
  assignedGrade: string;
  listedGrade?: string | undefined;
  /** BR-119: the inspector's name. */
  checkedBy?: string | undefined;
  checkedAt: string;
  checkedOn: string;
  points: LiveQcPoint[];
  passedPoints: number;
  acceptedGrams: number | null;
  rejectedGrams: number | null;
  /** BR-120: parts of the rejected quantity. */
  damagedGrams: number | null;
  spoiledGrams: number | null;
  rejectionReasonCode?: QcRejectionReasonCode | undefined;
  rejectionReasonLabel?: string | undefined;
  actualCropName?: string | undefined;
  cropMismatchGrams: number | null;
  defectNotes?: string | undefined;
}

/** GET /admin/goods-receipts/{id}: the receipt with its quality check (null before one). */
export interface LiveReceiptDetail extends LiveReceipt {
  qualityCheck: LiveQualityCheck | null;
}

/** A persisted damage / mismatch report (BR-121). */
export interface LiveDiscrepancy {
  id: string;
  type: GoodsReceiptDiscrepancyType;
  typeLabel: string;
  expected: string;
  actual: string;
  status: GoodsReceiptDiscrepancyStatus;
  statusLabel: string;
  note?: string | undefined;
  createdBy?: string | undefined;
  createdAt: string;
  /** "25 Sep 2026 · 10:25 AM" (IST). */
  createdOn: string;
}

/** A receiving issue the API can back: a receipt still awaiting its quality check. */
export interface LiveQualityIssue {
  /** The receipt uuid. */
  id: string;
  purchaseOrderId: string;
  kind: 'QC Pending';
  /** The order's poNumber, else the GRN. */
  shipmentCode: string;
  receiptCode: string;
  produce: string;
  detail: string;
  warehouseId: string;
  time: string;
}

/** A storage location a batch can be put away to (the quality check sends its code, BR-106). */
export interface LiveStorageOption {
  id: string;
  code: string;
  /** The location's name, else its code. */
  label: string;
  /** Its free-text type, '' when none. */
  zone: string;
  /** Display-only capacity; null when none is set. */
  capacityGrams: number | null;
}

/** The Search & Filters facets the API can apply (BR-122 + the shipment type + the receipt result). */
export type LiveDatePreset = 'All' | 'Today' | 'Last 7 Days' | 'Custom';
export type LiveShipmentTypeFilter = 'All' | LiveShipmentType;
export type LiveResultFilter = 'All' | 'Awaiting QC' | 'Accepted' | 'Partial' | 'Rejected';

export interface LiveReceivingFilters {
  /** `q`: PO / GRN number, farmer or crop (trimmed; '' = none). */
  search: string;
  date: LiveDatePreset;
  /** Custom range, "YYYY-MM-DD" IST days. */
  customFrom?: string | undefined;
  customTo?: string | undefined;
  /** Main only (a Sub scope is pinned to its own warehouse, BR-30). */
  warehouseId?: string | undefined;
  shipmentType: LiveShipmentTypeFilter;
  /** Receiving History's receipt status. */
  result: LiveResultFilter;
}
