/**
 * Shared types for the warehouse returns (RMA) screens (design module M10).
 *
 * One set of screens serves both warehouse roles. As in finance-expenses and
 * orders, the role difference is carried by `scope` (warehouseId undefined =
 * all warehouses, the Main Warehouse view) and `can` (a docs/rbac.json code
 * check that only decides what to render; the server enforces every action
 * again, CLAUDE.md 2.1).
 *
 * RmaRecord / ReturnHistoryRecord used to be declared inside the Sub screens
 * (SubWarehouseReturnsIssuesScreen / SubWarehouseReturnHistoryDetailScreen) and
 * imported sideways by every other RMA screen; they live here now.
 *
 * Folded designs (W3b's ReturnResultScreen and its `variant` prop are gone):
 *   - The Main "Inspection Saved" page (MainWarehouseInspectionSavedScreen, then
 *     ReturnResultScreen variant 'INSPECTION_SAVED') is InspectProductScreen
 *     step 'saved'.
 *   - The Main "Return Approved" page (MainWarehouseReturnApprovedScreen, then
 *     ReturnResultScreen variant 'RETURN_APPROVED') is ReturnApprovedScreen.
 */
import type { WarehouseScreenBaseProps } from '../finance-expenses/types';

export type {
  PermissionCheck,
  WarehouseNavigate,
  WarehouseScope,
  WarehouseScreenBaseProps,
  WarehouseTab,
} from '../finance-expenses/types';

/** Issue category a customer picks when reporting a problem. */
export type RmaIssueCategory = 'Damaged' | 'Quality' | 'Quantity' | 'Missing' | 'Wrong' | 'Late';

/** Workflow status of an open RMA. */
export type RmaStatus = 'New' | 'Under Review' | 'Approved' | 'Pending Resolution';

/** One return (RMA) request. Mock until the RMA endpoints are wired (SPEC_GAPS W4e). */
export interface RmaRecord {
  id: string;
  rmaId: string;
  orderId: string;
  customerName: string;
  customerId: string;
  customerPhone: string;
  orderDate: string;
  salesChannel: string;
  paymentStatus: string;
  productName: string;
  grade: string;
  quantityPurchased: string;
  unitPrice: string;
  lineTotal: string;
  issueCategory: RmaIssueCategory;
  reportedDate: string;
  timestampText: string;
  description: string;
  ticketId: string;
  requestedQuantity: string;
  requestedResolution: string;
  status: RmaStatus;
  /**
   * Warehouse that owns the order. Optional until the API returns it; when set,
   * a Sub scope only lists / approves RMAs of its own warehouse.
   */
  warehouseId?: string | undefined;
  warehouseName?: string | undefined;
}

/** One step of an RMA / refund timeline. */
export interface ReturnTimelineItem {
  id: string;
  title: string;
  time?: string | undefined;
}

/** A closed RMA in the return history. */
export interface ReturnHistoryRecord {
  rmaId: string;
  orderId: string;
  customerName: string;
  reasonTag: string;
  status: 'Completed' | 'Rejected' | 'Approved';
  date: string;
  refundAmount?: string | undefined;
  inspectionResult?: string | undefined;
  returnedQuantity?: string | undefined;
  inspectionNotes?: string | undefined;
  decision?: string | undefined;
  decisionDate?: string | undefined;
  processedBy?: string | undefined;
  refundStatus?: string | undefined;
  refundMethod?: string | undefined;
  refundReference?: string | undefined;
  timeline?: ReturnTimelineItem[] | undefined;
  warehouseId?: string | undefined;
}

/** Product condition picked on the inspection form. */
export type InspectionCondition = 'Acceptable' | 'Damaged' | 'Spoiled';

/** What InspectProductScreen hands to the review step. */
export interface InspectionResultData {
  rma: RmaRecord;
  receivedQty: string;
  condition: InspectionCondition;
  result: string;
  notes: string;
}

/** InspectProductScreen steps (M10-S03 form, then the folded "Inspection Saved" page). */
export type InspectStep = 'form' | 'saved';

/** Props every RMA screen that works on one request takes. */
export interface RmaScreenBaseProps extends WarehouseScreenBaseProps {
  rma: RmaRecord;
}

/**
 * Route keys of ReturnsFlow. They are the old App.tsx keys without the
 * 'SubWarehouse' prefix, so App.tsx maps a legacy key by stripping it.
 */
export type ReturnsRoute =
  | 'ReturnsIssues'
  | 'RmaDetail'
  | 'InspectProduct'
  | 'ReviewReturnRequest'
  | 'ApproveReturn'
  | 'RejectReturnRequest'
  | 'RequestRejected'
  | 'ReturnApproved'
  | 'RefundStatus'
  | 'RefundFailed'
  | 'RefundCompleted'
  | 'ReturnHistory'
  | 'ReturnHistoryDetail';

/** Params carried between ReturnsFlow routes. All optional: a deep link may carry none. */
export interface ReturnsRouteParams {
  rma?: RmaRecord | undefined;
  record?: ReturnHistoryRecord | undefined;
  inspectedQty?: string | undefined;
  notes?: string | undefined;
  reason?: string | undefined;
  refundAmount?: string | undefined;
  transactionId?: string | undefined;
  step?: InspectStep | undefined;
}
