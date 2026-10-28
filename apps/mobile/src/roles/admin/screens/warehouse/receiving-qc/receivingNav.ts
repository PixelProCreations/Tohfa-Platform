/**
 * Where the receiving flow goes when a screen or a host asks for a step. The
 * wizard reads its purchase order (and the receipt it resumes) by uuid, so an
 * entry that knows no order never opens it on a made-up shipment: it opens
 * the list to pick one (Incoming Shipments, on the tab where that stage is
 * worked on), or Receiving History for a receipt-scoped action.
 *
 * Pure, so plain-Node vitest covers it (../../../tests/receiving_lists.test.ts).
 */
import type { LiveResultFilter } from './liveTypes';
import type { HistoryFilter, ReceivingRoute, ReceivingRouteParams, ReceivingWizardStep } from './types';

export interface ReceivingStackEntry {
  screen: ReceivingRoute;
  params?: ReceivingRouteParams | undefined;
}

const PICK_TO_RECEIVE: ReceivingStackEntry = { screen: 'Shipments', params: { statusTab: 'Expected' } };
/** Quality check, decision, batch and storage are one call on a receipt awaiting QC (BR-106). */
const PICK_TO_CHECK: ReceivingStackEntry = { screen: 'Shipments', params: { statusTab: 'QC Pending' } };

/** Old shell sub-view keys (Sub receivingSubView, Main receivingSubView / whSubView) -> route. */
const SUB_VIEW_ROUTE: Record<string, ReceivingStackEntry> = {
  overview: { screen: 'Dashboard' },
  dashboard: { screen: 'Dashboard' },
  incoming_goods_ops: { screen: 'Dashboard' },
  incoming_shipments: { screen: 'Shipments' },
  search_filters: { screen: 'SearchFilters' },
  // No id comes with these keys: open the list to pick one.
  shipment_detail: { screen: 'Shipments' },
  receiving_history: { screen: 'History' },
  receiving_history_detail: { screen: 'History' },
  quality_issues_ops: { screen: 'QualityIssues' },
  storage_location_assignment: PICK_TO_CHECK,
  start_receiving: PICK_TO_RECEIVE,
  quantity_verification: PICK_TO_RECEIVE,
  quality_check: PICK_TO_CHECK,
  grade_product_verification: PICK_TO_CHECK,
  acceptance_decision: PICK_TO_CHECK,
  partial_acceptance: PICK_TO_CHECK,
  batch_assignment: PICK_TO_CHECK,
  damage_mismatch_report: { screen: 'History' },
  goods_receipt_summary: { screen: 'History' },
  receiving_activity: { screen: 'ActivityTimeline' },
  pending_queue: { screen: 'PendingQueue' },
};

/** Route and params for an old shell sub-view key; unknown keys open the dashboard. */
export function receivingRouteFor(subView: string | undefined): ReceivingStackEntry {
  return (subView !== undefined ? SUB_VIEW_ROUTE[subView] : undefined) ?? { screen: 'Dashboard' };
}

/** The Receiving Activity Timeline is navigation: each step opens the list where that stage is worked on. */
export function activityStepTarget(step: string): ReceivingStackEntry {
  switch (step) {
    case 'start_receiving':
    case 'quantity_verification':
      return PICK_TO_RECEIVE;
    case 'quality_check':
    case 'receiving_decision':
    case 'batch_assignment':
    case 'storage_assignment':
      return PICK_TO_CHECK;
    case 'receipt_confirmation':
      return { screen: 'History' };
    default:
      return { screen: 'Shipments' };
  }
}

const STAGE_STEP: Record<string, ReceivingWizardStep> = {
  'Shipment Arrived': 'start_receiving',
  'Receiving Started': 'start_receiving',
  'Quantity Verification': 'quantity_verification',
  'Quality Check': 'quality_check',
  Decision: 'receiving_decision',
  'Batch Assignment': 'batch_assignment',
  // The wizard renders the putaway inside its batch step (one call, BR-106).
  'Storage Assignment': 'batch_assignment',
  'Receipt Completion': 'receipt_confirmation',
};

/** Steps a new receipt can open on; later ones need a recorded receipt first. */
const BEFORE_RECEIPT: readonly ReceivingWizardStep[] = ['start_receiving', 'quantity_verification'];

export interface StageContext {
  purchaseOrderId: string;
  /** isReceivable(status): a new receipt may be started. */
  receivable: boolean;
  /** A receipt of this order awaiting its quality check. */
  pendingReceiptId?: string | undefined;
  newestReceiptId?: string | undefined;
}

/**
 * A Receiving Progress stage press: resume the pending receipt at that stage;
 * else on a receivable order start a new receipt; else show the newest
 * receipt (the stage is history); else nothing.
 */
export function progressStageTarget(stage: string, ctx: StageContext): ReceivingStackEntry | null {
  const step = STAGE_STEP[stage] ?? 'start_receiving';
  if (ctx.pendingReceiptId !== undefined) {
    return { screen: 'Wizard', params: { wizardStep: step, shipmentId: ctx.purchaseOrderId, receiptId: ctx.pendingReceiptId } };
  }
  if (ctx.receivable) {
    const first = BEFORE_RECEIPT.includes(step) ? step : 'start_receiving';
    return { screen: 'Wizard', params: { wizardStep: first, shipmentId: ctx.purchaseOrderId, receiptId: undefined } };
  }
  if (ctx.newestReceiptId !== undefined) return { screen: 'HistoryDetail', params: { receiptId: ctx.newestReceiptId } };
  return null;
}

/** Receiving History's result: a pill the admin picked wins; on "All" the Search & Filters facet applies. */
export function historyResultFilter(pill: HistoryFilter, facet: LiveResultFilter): LiveResultFilter {
  return pill !== 'All' ? pill : facet;
}
