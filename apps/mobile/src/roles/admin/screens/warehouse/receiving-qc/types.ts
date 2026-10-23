/**
 * Shared types for the warehouse goods receiving & QC screens (design module
 * M2): the Goods Receiving wizard and the Receiving History Detail.
 *
 * The receiving flow used to exist three times: the wizard (Sub shell), a chain
 * of ten standalone screens in the Main shell (StartReceiving, Quantity,
 * Quality, Grade & Product, Damage / Mismatch, Acceptance Decision, Partial
 * Acceptance, Goods Receipt Summary, Batch Assignment) and the Sub "Review
 * Receiving" one-pager. They are all steps of ONE wizard now, and one receipt
 * detail screen serves both shells (it absorbed SubWarehouseGoodsReceiptDetail).
 *
 * As in the other warehouse areas the role difference is carried by `scope`
 * (warehouseId undefined = all warehouses, the Main view; owner decision: Main
 * `own` = all four warehouses) and `can` (a docs/rbac.json code check that only
 * decides what to render; the server enforces every action again, CLAUDE.md
 * 2.1). The record types below are declared once, here.
 */
import type { Money } from '@tohfa/shared-types';
import type { Grade } from '../../../api/inventory';

export type {
  PermissionCheck,
  WarehouseNavigate,
  WarehouseScope,
  WarehouseScreenBaseProps,
  WarehouseTab,
} from '../finance-expenses/types';

/**
 * Every step of the Goods Receiving wizard. The first fifteen are the original
 * wizard steps; the rest were absorbed from standalone screens:
 *   grade_verification  <- GradeProductVerificationScreen
 *   batch_assignment    <- BatchAssignmentScreen + the Review
 *                          Receiving putaway bay
 *   counter_offer       <- new: the rbac code inventory.quality.counter_offer
 *                          had no surface (see SPEC_GAPS W4n-2)
 *   review_receiving    <- SubWarehouseReviewReceivingScreen (one-page review)
 */
export type ReceivingWizardStep =
  | 'start_receiving'
  | 'quantity_verification'
  | 'quality_check'
  | 'damage_mismatch'
  | 'receiving_decision'
  | 'partial_acceptance'
  | 'receipt_summary'
  | 'receiving_history'
  | 'receipt_detail'
  | 'rejected_goods'
  | 'record_handling'
  | 'receiving_in_progress'
  | 'continue_receiving'
  | 'receipt_confirmation'
  | 'submission_error'
  | 'grade_verification'
  | 'batch_assignment'
  | 'counter_offer'
  | 'review_receiving';

/**
 * One product line of a shipment, for the quantity verification table.
 * Weights are integer grams (roles/admin/money/quantity.ts), never floats;
 * null is "not known yet" (no received weight typed), never zero.
 */
export interface ShipmentLineItem {
  product: string;
  expectedGrams: number | null;
  receivedGrams: number | null;
}

/**
 * The purchase order being received, as the wizard needs it. Built from
 * GET /admin/purchase-orders/{id} by ./mappers.ts (toIncomingShipment).
 */
export interface WizardShipmentData {
  /** Purchase order uuid (what the API takes). */
  purchaseOrderId: string;
  /** Human code: the poNumber. */
  code: string;
  /** Crop name, or a neutral label naming the order when the API sent none. */
  produce: string;
  /** The crop name the API sent; undefined when it sent none (a purchase order carries none). */
  cropName?: string | undefined;
  /** Grade label ("Grade 1"), '' when the order has no grade. */
  grade: string;
  /** The order's listed grade, the default the QC grade picker starts on. */
  apiGrade?: Grade | undefined;
  /** Ordered quantity. */
  expectedGrams: number | null;
  /** Farmer name (from the detail; '' on a list row). Internal traceability only (BR-16). */
  from: string;
  /** Receiving warehouse name. */
  to: string;
  /** Receiving warehouse uuid. */
  warehouseId: string;
  /** Receipts already recorded against the order (their uuids). */
  receiptIds: readonly string[];
  /** A receipt of this order still awaiting QC: the wizard resumes it instead of creating another. */
  pendingReceiptId?: string | undefined;
}

/** Quality check result of one criterion. */
export type QcResult = 'pass' | 'attention' | 'fail';

/** One quality check criterion of the wizard's Quality step. */
export type QcCriterionId = 'appearance' | 'size' | 'moisture' | 'damage' | 'freshness';

export interface QcCriterion {
  id: QcCriterionId;
  code: string;
  title: string;
  icon: 'eye' | 'ruler' | 'drop' | 'bug' | 'leaf';
}

/** One row of the review step's inspection checklist. */
export interface InspectionParameter {
  id: string;
  title: string;
  description: string;
}

/** A storage location a received lot can be put away to (GET /warehouses/{id}/storage-locations). */
export interface StorageBayOption {
  id: string;
  /** What the quality check sends as `storageLocation` (free text on the batch). */
  code: string;
  label: string;
  /** The location type, '' when none. */
  zone: string;
  /** Display-only capacity; null when the location has none. */
  capacityGrams: number | null;
}

/** The three documented receiving outcomes (no other outcome is invented). */
export type ReceivingOutcome = 'Accept' | 'Partial Accept' | 'Reject';

/** Result of a recorded goods receipt, one per GoodsReceipt.status, plus a fallback. */
export type ReceiptResult =
  | 'Awaiting QC'
  | 'Accepted'
  | 'Partially Accepted'
  | 'Rejected'
  | 'Counter-Offered'
  | 'Unknown';

/** One timeline event of a receipt. */
export interface ReceiptTimelineEvent {
  title: string;
  time: string;
}

/**
 * One recorded goods receipt (GET /admin/goods-receipts), as Receiving
 * History, its detail screen and the dashboard show it. Weights are integer
 * grams; null is "not known" (e.g. accepted before the quality check), never 0.
 */
export interface ReceivingRecord {
  /** Goods receipt uuid (what the API and the routes take). */
  id: string;
  /** Human code: the grnNumber. */
  receiptId: string;
  purchaseOrderId: string;
  /** The order's poNumber, '' when the row did not carry it. */
  shipmentId: string;
  /** Owning warehouse. A Sub scope only sees its own (BR-30). */
  warehouseId: string;
  warehouseName: string;
  result: ReceiptResult;
  resultLabel: string;
  /** When it was received (ISO instant), for day comparisons. */
  receivedAt: string;
  date: string;
  product: string;
  grade: string;
  /** The order's quantity, when the screen knows the order. */
  expectedGrams: number | null;
  receivedGrams: number | null;
  acceptedGrams: number | null;
  rejectedGrams: number | null;
  rejectionReason?: string | undefined;
  vehicleNumber?: string | undefined;
  /** BR-106: the batch the receipt was stocked as, when the API returns one (GoodsReceipt.batchId). */
  batchId?: string | undefined;
  /** That batch's code (GoodsReceipt.batchCode). */
  batchCode?: string | undefined;
}

// ─── Receiving list screens (dashboard, shipments, filters, history, QC issues) ───

/**
 * Receiving status of a purchase order (./mappers.ts shipmentStatusOf):
 * Expected = nothing received yet; Awaiting QC = a receipt waits for its
 * quality check; Receiving = part of the order has arrived; Completed = all of
 * it; Cancelled; Unknown = a status the app does not know (not receivable).
 */
export type ShipmentStatus = 'Expected' | 'Awaiting QC' | 'Receiving' | 'Completed' | 'Cancelled' | 'Unknown';

/**
 * One purchase order expected at the warehouse, as the shipment list, its
 * detail and the wizard show it (./mappers.ts toIncomingShipment).
 */
export interface IncomingShipment extends WizardShipmentData {
  status: ShipmentStatus;
  statusLabel: string;
  /** The farmer's TOHFA id (detail only). Internal traceability only (BR-16). */
  farmerCode: string;
  /** Price per kg and order total, as the API's Money strings. */
  pricePerKg: Money;
  totalAmount: Money;
  /** "20 Oct 2026", '' when the order has no expected date. */
  expectedArrival: string;
  /** "12 Oct 2026", '' when unknown. */
  issuedOn: string;
  /** Gross received over the order's receipts; null when the receipts are not known. */
  receivedGrams: number | null;
}

/** Status pills of the Incoming Shipments list. */
export type ShipmentFilterTab = 'All' | 'Expected' | 'Receiving' | 'QC Pending' | 'Completed';

/** Result pills of Receiving History (each is a server-side status filter). */
export type HistoryFilter = 'All' | 'Awaiting QC' | 'Accepted' | 'Partial' | 'Rejected';

/**
 * Facets of Receiving Search & Filters (design M2-03), reduced to what the two
 * list endpoints take: `warehouseId` (GET /admin/purchase-orders and
 * /admin/goods-receipts) and the receipt `status` (GET /admin/goods-receipts,
 * the Receiving History pills). Search text, date and shipment type have no
 * query parameter, so they are not facets.
 */
export interface ReceivingFilters {
  /** A Main pick from GET /warehouses; undefined = all warehouses. Never set for a Sub scope (BR-30). */
  warehouseId?: string | undefined;
  result: HistoryFilter;
}

/** The list a Search & Filters screen narrows. */
export type ReceivingFilterTarget = 'Shipments' | 'History';

/** What opening a QC issue leads to. */
export type QualityIssueTarget = 'wizard' | 'shipment' | 'operational_issue';

/** One quality / receiving issue (read-only list; Needs Attention on the dashboard). */
export interface QualityIssue {
  /** The goods receipt uuid the issue is about. */
  id: string;
  /** Its purchase order (the wizard resumes on it). */
  purchaseOrderId: string;
  kind: 'QC Pending' | 'Quantity Mismatch' | 'Damage Reported';
  shipmentCode: string;
  produce: string;
  detail: string;
  warehouseId: string;
  time: string;
  target: QualityIssueTarget;
  /** Wizard step a 'wizard' issue opens. */
  wizardStep?: ReceivingWizardStep | undefined;
}

/** Routes of the receiving flow (ReceivingFlow). */
export type ReceivingRoute =
  | 'Dashboard'
  | 'Shipments'
  | 'SearchFilters'
  | 'ShipmentDetail'
  | 'History'
  | 'HistoryDetail'
  | 'QualityIssues'
  | 'Wizard'
  | 'StorageAssignment';

export interface ReceivingRouteParams {
  /** Purchase order uuid. */
  shipmentId?: string | undefined;
  /** Goods receipt uuid. */
  receiptId?: string | undefined;
  statusTab?: ShipmentFilterTab | undefined;
  historyFilter?: HistoryFilter | undefined;
  wizardStep?: ReceivingWizardStep | undefined;
  /** Main: the warehouse the lists are narrowed to (Search & Filters); ignored for a Sub scope (BR-30). */
  filterWarehouseId?: string | undefined;
  /** Search & Filters: the list it was opened from, which its Apply narrows. */
  filterTarget?: ReceivingFilterTarget | undefined;
}

/** What an API-backed receiving screen gets from the flow to pick its async state and refresh. */
export interface ReceivingLiveStateProps {
  isLoading?: boolean | undefined;
  error?: unknown;
  onRetry?: (() => void) | undefined;
  onRefresh?: (() => void) | undefined;
  isRefreshing?: boolean | undefined;
}
