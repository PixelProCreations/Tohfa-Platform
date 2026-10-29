/**
 * Live data for the returns/RMA screens (ReturnsIssues, detail, inspect, approve, reject, refund).
 *
 * Hooks over useCursorList, useAdminQuery, and useAdminMutation; DTO→screen mapping
 * is in ./mappers.ts (unit-tested).
 */
import { useCallback } from 'react';
import {
  approveReturn,
  getReturn,
  getReturnHistory,
  inspectReturn,
  listReturns,
  refundReturnToWallet,
  rejectReturn,
  type ReturnHistoryDto,
  type ReturnInspectionBody,
  type ReturnRefundResultDto,
  type ReturnRequestDto,
  type ReturnStatus,
  type ReturnSummaryDto,
} from '../../../api/returns';
import { useAdminMutation, useAdminQuery, useCursorList, type CursorList } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { toRmaRecord } from './mappers';
import type { PermissionCheck, RmaRecord, WarehouseScope } from './types';

export { RmaRecord };

/** RBAC code that gates the returns list (docs/rbac.json, BR-61). */
export const RETURN_LIST_VIEW_CODE = 'rma.request.process';

/**
 * Live cursor-paginated returns list for the current scope.
 */
export function useReturnList(
  scope: WarehouseScope,
  can: PermissionCheck,
  selectedWarehouseId?: string | undefined,
  status?: ReturnStatus | undefined,
): CursorList<RmaRecord> {
  const effectiveWarehouseId = scope.warehouseId ?? selectedWarehouseId;

  const map = useCallback(
    (dto: ReturnSummaryDto) => toRmaRecord(dto),
    [],
  );

  return useCursorList(
    adminKeys.scoped('returns', effectiveWarehouseId, { resource: 'list', status }),
    // warehouseId is not a param; server scopes by the auth token (BR-30).
    (cursor, signal) => listReturns({ cursor, status }, signal),
    map,
    { enabled: can(RETURN_LIST_VIEW_CODE) },
  );
}

/** One return with its items; 404 outside the caller's scope. */
export function useReturn(returnId: string | undefined) {
  return useAdminQuery<ReturnRequestDto>(
    adminKeys.detail('returns', returnId ?? ''),
    (signal) => getReturn(returnId!, signal),
    { enabled: Boolean(returnId) },
  );
}

/** The append-only status trail, oldest first. */
export function useReturnHistory(returnId: string | undefined) {
  return useAdminQuery<ReturnHistoryDto>(
    adminKeys.detail('returns-history', returnId ?? ''),
    (signal) => getReturnHistory(returnId!, signal),
    { enabled: Boolean(returnId) },
  );
}

/** Records the inspection (PENDING -> INSPECTED). */
export function useInspectReturn() {
  return useAdminMutation<{ id: string; body: ReturnInspectionBody }, ReturnRequestDto>({
    mutationFn: ({ id, body }) => inspectReturn(id, body),
    invalidates: [adminKeys.module('returns')],
  });
}

/** INSPECTED -> APPROVED (BR-61a: 409 from any other state). */
export function useApproveReturn() {
  return useAdminMutation<string, ReturnRequestDto>({
    mutationFn: (id) => approveReturn(id),
    invalidates: [adminKeys.module('returns')],
  });
}

/** PENDING / INSPECTED -> REJECTED, with a reason of 1..300 characters. */
export function useRejectReturn() {
  return useAdminMutation<{ id: string; reason: string }, ReturnRequestDto>({
    mutationFn: ({ id, reason }) => rejectReturn(id, { reason }),
    invalidates: [adminKeys.module('returns')],
  });
}

/** APPROVED -> REFUNDED with an instant wallet credit (BR-61). */
export function useRefundReturnToWallet() {
  return useAdminMutation<{ id: string; idempotencyKey: string }, ReturnRefundResultDto>({
    mutationFn: ({ id, idempotencyKey }) => refundReturnToWallet(id, idempotencyKey),
    invalidates: [adminKeys.module('returns')],
  });
}
