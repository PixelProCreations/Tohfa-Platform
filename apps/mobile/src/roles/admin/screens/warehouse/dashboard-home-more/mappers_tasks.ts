/**
 * Domain mappers and route resolution for warehouse tasks (BR-77, BR-78).
 */
import type { TaskItemDto, TaskSummaryDto, TaskType } from '../../../api/tasks';

export interface TaskDestination {
  module: 'orders' | 'receiving' | 'returns';
  refId: string;
}

/**
 * Maps a task type to the appropriate warehouse screen module (BR-77).
 * RETURN_* -> returns screens
 * GOODS_RECEIPT_QC -> receiving screens
 * ORDER_* -> orders screens
 */
export function mapTaskDestination(task: TaskItemDto): TaskDestination {
  switch (task.type) {
    case 'RETURN_INSPECTION':
    case 'RETURN_APPROVAL':
      return { module: 'returns', refId: task.refId };
    case 'GOODS_RECEIPT_QC':
      return { module: 'receiving', refId: task.refId };
    case 'ORDER_PACK':
    case 'ORDER_DISPATCH':
    case 'ORDER_PICKUP_OTP':
      return { module: 'orders', refId: task.refId };
  }
}

/**
 * Returns human-readable status badge label for each task type.
 */
export function mapTaskBadgeLabel(type: TaskType): string {
  switch (type) {
    case 'GOODS_RECEIPT_QC':
      return 'QC Pending';
    case 'ORDER_PACK':
      return 'Packing';
    case 'ORDER_DISPATCH':
      return 'Dispatch';
    case 'ORDER_PICKUP_OTP':
      return 'Pickup OTP';
    case 'RETURN_INSPECTION':
      return 'Return Inspection';
    case 'RETURN_APPROVAL':
      return 'Return Approval';
  }
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/**
 * Formats due date if present, never invents one when null (BR-77).
 */
export function formatTaskDue(dueOn: string | null): string | null {
  if (!dueOn) return null;
  const parts = dueOn.split('-');
  if (parts.length === 3) {
    const day = parseInt(parts[2] ?? '', 10);
    const monthIdx = parseInt(parts[1] ?? '', 10) - 1;
    const month = MONTH_NAMES[monthIdx];
    if (!isNaN(day) && month) {
      return `Due ${day} ${month}`;
    }
  }
  return `Due ${dueOn}`;
}

export interface SummarizedTaskCounts {
  ordersActionable: number;
  readyForPickup: number;
  qcPending: number;
  returnsPending: number;
}

/**
 * Aggregates task type counts into dashboard KPI buckets (BR-77).
 */
export function summarizeTaskCounts(summary: TaskSummaryDto | null | undefined): SummarizedTaskCounts {
  if (!summary) {
    return {
      ordersActionable: 0,
      readyForPickup: 0,
      qcPending: 0,
      returnsPending: 0,
    };
  }

  const byType = summary.byType;
  const orderPack = byType['ORDER_PACK'] ?? 0;
  const orderDispatch = byType['ORDER_DISPATCH'] ?? 0;
  const orderPickupOtp = byType['ORDER_PICKUP_OTP'] ?? 0;
  const qcPending = byType['GOODS_RECEIPT_QC'] ?? 0;
  const returnInspection = byType['RETURN_INSPECTION'] ?? 0;
  const returnApproval = byType['RETURN_APPROVAL'] ?? 0;

  return {
    ordersActionable: orderPack + orderDispatch + orderPickupOtp,
    readyForPickup: orderPickupOtp,
    qcPending,
    returnsPending: returnInspection + returnApproval,
  };
}
