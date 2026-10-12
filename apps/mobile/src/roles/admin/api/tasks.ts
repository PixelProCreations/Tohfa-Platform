/**
 * Open work items for the caller's warehouse scope (docs/openapi.yaml tag
 * Platform), derived live by the server from existing records (BR-77):
 *   GET /admin/tasks/summary   task.own.view   (Sub = own)
 *
 * The order screens read three counts from it: ORDER_PACK (orders CONFIRMED),
 * ORDER_DISPATCH (orders PACKED) and ORDER_PICKUP_OTP (orders READY_FOR_PICKUP).
 * The task list and "mark done" are the home dashboard's (a later phase).
 *
 * No UI imports, so the Main Warehouse admin can reuse this module.
 */
import type { ErrorCode, GenericProblemCode } from '@tohfa/shared-types';
import { adminGet } from './http';

/** docs/openapi.yaml `TaskType`. */
export type TaskType =
  | 'RETURN_INSPECTION'
  | 'RETURN_APPROVAL'
  | 'GOODS_RECEIPT_QC'
  | 'ORDER_PACK'
  | 'ORDER_DISPATCH'
  | 'ORDER_PICKUP_OTP';

/** docs/openapi.yaml `TaskSummary`: every type present, 0 when none; `open` is their sum. */
export interface TaskSummaryDto {
  open: number;
  byType: Partial<Record<TaskType, number>> & Readonly<Record<string, number>>;
}

export interface TaskSummaryParams {
  /** Narrows the caller's scope; a warehouse outside it is 404. */
  warehouseId?: string | undefined;
}

/** 401/403/404 (warehouse outside the scope)/422/500. */
export const ERROR_CODES: readonly (GenericProblemCode | ErrorCode)[] = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'VALIDATION_FAILED',
  'INTERNAL',
];

export function getTaskSummary(params: TaskSummaryParams = {}, signal?: AbortSignal): Promise<TaskSummaryDto> {
  return adminGet<TaskSummaryDto>('/admin/tasks/summary', { warehouseId: params.warehouseId }, signal);
}
