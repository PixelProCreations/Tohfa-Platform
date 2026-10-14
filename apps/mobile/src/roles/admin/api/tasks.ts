/**
 * Open work items for the caller's warehouse scope (docs/openapi.yaml tag
 * Platform), derived live by the server from existing records (BR-77, BR-78):
 *   GET  /admin/tasks                task.own.view   (BR-77)
 *   GET  /admin/tasks/summary        task.own.view   (BR-77)
 *   POST /admin/tasks/{itemKey}/done task.own.view   (BR-78)
 *
 * Task types: RETURN_INSPECTION, RETURN_APPROVAL, GOODS_RECEIPT_QC,
 * ORDER_PACK, ORDER_DISPATCH, ORDER_PICKUP_OTP.
 *
 * No UI imports, so the Main Warehouse admin can reuse this module.
 */
import type { ErrorCode, GenericProblemCode } from '@tohfa/shared-types';
import type { PageMeta } from '../../../shell/api/pagination';
import { adminGet, adminPost } from './http';

/** docs/openapi.yaml `TaskType`. */
export type TaskType =
  | 'RETURN_INSPECTION'
  | 'RETURN_APPROVAL'
  | 'GOODS_RECEIPT_QC'
  | 'ORDER_PACK'
  | 'ORDER_DISPATCH'
  | 'ORDER_PICKUP_OTP';

/** docs/openapi.yaml `WorklistRefType`. */
export type WorklistRefType =
  | 'RETURN_REQUEST'
  | 'GOODS_RECEIPT'
  | 'ORDER'
  | 'INVENTORY_BATCH'
  | 'WAREHOUSE';

/** docs/openapi.yaml `WorklistParams`. */
export type WorklistParams = Record<string, string | number | boolean | null>;

/** docs/openapi.yaml `TaskItem`. */
export interface TaskItemDto {
  itemKey: string;
  type: TaskType;
  titleKey: string;
  refType: WorklistRefType;
  refId: string;
  warehouseId: string;
  createdAt: string;
  dueOn: string | null;
  params: WorklistParams;
  state: 'OPEN' | 'DONE';
}

/** docs/openapi.yaml `TaskSummary`: every type present, 0 when none; `open` is their sum. */
export interface TaskSummaryDto {
  open: number;
  byType: Partial<Record<TaskType, number>> & Readonly<Record<string, number>>;
}

/** docs/openapi.yaml `TaskAlertState`. */
export interface TaskAlertStateDto {
  itemKey: string;
  state: 'DONE' | 'DISMISSED' | 'SNOOZED';
  snoozedUntil: string | null;
  updatedAt: string;
}

export interface ListTasksParams {
  type?: TaskType | undefined;
  warehouseId?: string | undefined;
  state?: 'open' | 'done' | undefined;
  cursor?: string | undefined;
  limit?: number | undefined;
}

export interface ListTasksResponseDto {
  items: TaskItemDto[];
  page: PageMeta;
}

export interface TaskSummaryParams {
  /** Narrows the caller's scope; a warehouse outside it is 404. */
  warehouseId?: string | undefined;
}

/** 401/403/404 (warehouse outside the scope)/409/422/500 error codes. */
export const ERROR_CODES: readonly (GenericProblemCode | ErrorCode)[] = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'VALIDATION_FAILED',
  'INTERNAL',
  'IDEMPOTENCY_KEY_REUSED',
] as const;

export function listTasks(params: ListTasksParams = {}, signal?: AbortSignal): Promise<ListTasksResponseDto> {
  return adminGet<ListTasksResponseDto>(
    '/admin/tasks',
    {
      type: params.type,
      warehouseId: params.warehouseId,
      state: params.state,
      cursor: params.cursor,
      limit: params.limit,
    },
    signal,
  );
}

export function getTaskSummary(params: TaskSummaryParams = {}, signal?: AbortSignal): Promise<TaskSummaryDto> {
  return adminGet<TaskSummaryDto>('/admin/tasks/summary', { warehouseId: params.warehouseId }, signal);
}

export function markTaskDone(
  itemKey: string,
  idempotencyKey?: string | undefined,
  signal?: AbortSignal,
): Promise<TaskAlertStateDto> {
  return adminPost<TaskAlertStateDto>(
    `/admin/tasks/${encodeURIComponent(itemKey)}/done`,
    undefined,
    {
      idempotencyKey,
      signal,
    },
  );
}
