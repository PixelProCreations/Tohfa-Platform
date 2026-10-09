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
 *   grade_verification  <- GradeProductVerificationScreen (M2-S08)
 *   batch_assignment    <- BatchAssignmentScreen (M2-S14) + the Review
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

/** One product line of a shipment, for the quantity verification table. */
export interface ShipmentLineItem {
  product: string;
  expectedKg: number;
  receivedKg: number;
}

/** The shipment being received. Shell shipment rows are structurally compatible. */
export interface WizardShipmentData {
  code: string;
  produce: string;
  grade?: string | undefined;
  expectedQty: number;
  receivedQty?: number | undefined;
  acceptedQty?: number | undefined;
  rejectedQty?: number | undefined;
  receivedDate?: string | undefined;
  receivedTime?: string | undefined;
  reference?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
  batchSource?: string | undefined;
  /** Other product lines on the same shipment (quantity verification table). */
  lines?: ShipmentLineItem[] | undefined;
  /** Vehicle and driver as recorded at the gate (review step). */
  vehicle?: string | undefined;
  /** Arrival time as recorded at the gate (review step). */
  arrival?: string | undefined;
  /** Tare of one crate in KG. Shipment data (crate type), not a business threshold. */
  crateTareKg?: number | undefined;
}

/** Quality check result of one criterion. */
export type QcResult = 'pass' | 'attention' | 'fail';

/** One quality check criterion of the wizard's Quality step. */
export interface QcCriterion {
  id: string;
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

/** A storage bay a batch can be put away to (batch / storage assignment). */
export interface StorageBayOption {
  id: string;
  label: string;
  zone: string;
  /** Free capacity in KG. */
  availableKg: number;
}

/** The three documented receiving outcomes (no other outcome is invented). */
export type ReceivingOutcome = 'Accept' | 'Partial Accept' | 'Reject';

/** Result of a recorded goods receipt. 'Open' = variance still under review. */
export type ReceiptResult = 'Accepted' | 'Partially Accepted' | 'Rejected' | 'Open';

/** One timeline event of a receipt. */
export interface ReceiptTimelineEvent {
  title: string;
  time: string;
}

/**
 * One recorded goods receipt, as Receiving History, its detail screen and the
 * wizard's receipt_detail step show it. Declared once here (it was three
 * inline shapes: the wizard history list, the Main shell's per-id props and
 * the Sub GoodsReceiptDetail constants).
 */
export interface ReceivingRecord {
  receiptId: string;
  shipmentId: string;
  /** Owning warehouse. A Sub scope only sees its own (inventory.batch.view = own). */
  warehouseId: string;
  warehouseName: string;
  result: ReceiptResult;
  receivedBy: string;
  date: string;
  product: string;
  grade: string;
  expectedKg: number;
  receivedKg: number;
  acceptedKg: number;
  rejectedKg: number;
  rejectionReason?: string | undefined;
  /** Supplier as recorded on the receipt. Internal traceability only (BR-16). */
  supplier?: string | undefined;
  notes?: string | undefined;
  batchId?: string | undefined;
  timeline?: ReceiptTimelineEvent[] | undefined;
  qcResults?: Partial<Record<string, QcResult>> | undefined;
}
