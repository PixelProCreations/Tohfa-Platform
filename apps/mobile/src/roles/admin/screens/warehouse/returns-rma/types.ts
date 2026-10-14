/**
 * Shared types for the warehouse returns (RMA) screens (design module M10).
 *
 * One set of screens serves both warehouse roles. As in finance-expenses and
 * orders, the role difference is carried by `scope` (warehouseId undefined =
 * all warehouses, the Main Warehouse view) and `can` (a docs/rbac.json code
 * check that only decides what to render; the server enforces every action
 * again, CLAUDE.md 2.1).
 *
 * Live since plan phase 10: the screens draw the views below, built from the
 * returns API by ./mappers.ts. The sample RmaRecord / ReturnHistoryRecord
 * shapes are gone with their fixtures.
 */
import type { WarehouseScreenBaseProps } from '../finance-expenses/types';

export type {
  PermissionCheck,
  WarehouseNavigate,
  WarehouseScope,
  WarehouseScreenBaseProps,
  WarehouseTab,
} from '../finance-expenses/types';

/** Product condition picked on the inspection form (the API's GOOD / DAMAGED / SPOILED). */
export type InspectionCondition = 'Acceptable' | 'Damaged' | 'Spoiled';

/** InspectProductScreen steps (M10-S03 form, then the folded "Inspection Saved" page). */
export type InspectStep = 'form' | 'saved';

// ─── Live views (./mappers.ts) ───────────────────────────────────────────────

/** One return of the queue (GET /admin/returns). */
export interface ReturnRowView {
  /** The return uuid. */
  id: string;
  /** 'RET-7A7A7A7A': a display label (docs/rules.md BR-91h), not a key. */
  reference: string;
  orderId: string;
  /** The API status, kept as sent (unknown values included) for returnActions. */
  status: string;
  statusLabel: string;
  statusTone: 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'brandSoft';
  reason: string;
  note: string | null;
  created: string;
}

/** One returned order item in integer grams. accepted / damaged / condition are null until inspected. */
export interface ReturnItemView {
  orderItemId: string;
  requestedGrams: number;
  acceptedGrams: number | null;
  damagedGrams: number | null;
  condition: InspectionCondition | null;
}

/** One return with its items (GET /admin/returns/{id}). */
export interface ReturnDetailView extends ReturnRowView {
  customerId: string;
  items: readonly ReturnItemView[];
}

/** One status change (GET /admin/returns/{id}/history), oldest first. */
export interface ReturnTimelineEntry {
  id: string;
  title: string;
  time: string;
  note: string | null;
}

/** What a live screen needs to pick an AsyncState and to refresh. */
export interface ReturnsLiveStateProps {
  isLoading?: boolean | undefined;
  error?: unknown;
  onRetry?: (() => void) | undefined;
  onRefresh?: (() => void) | undefined;
  isRefreshing?: boolean | undefined;
}

/** A write in flight on a screen: its pending flag and last failure (shown with returnWriteErrorKey). */
export interface ReturnsWriteStateProps {
  isSubmitting?: boolean | undefined;
  submitError?: unknown;
}

/**
 * Route keys of ReturnsFlow. They are the old App.tsx keys without the
 * 'SubWarehouse' prefix, so App.tsx maps a legacy key by stripping it. There
 * is no bank refund route: rma.refund.bank_process is `none` for both
 * warehouse roles (BR-61).
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

/** The refund the server confirmed, carried to the Refund Completed page. */
export interface ReturnRefundParams {
  /** Integer paise; null when the server amount was not Money. */
  amountPaise: number | null;
  amountLabel: string | null;
  walletTransactionId: string | null;
  reference: string;
}

/** Params carried between ReturnsFlow routes. All optional: a deep link may carry none. */
export interface ReturnsRouteParams {
  /** The return uuid; anything else shows "not found" without a request. */
  returnId?: string | undefined;
  refund?: ReturnRefundParams | undefined;
  step?: InspectStep | undefined;
}

/** Props every live RMA screen takes. */
export type ReturnsScreenBaseProps = WarehouseScreenBaseProps;
