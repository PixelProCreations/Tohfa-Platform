/**
 * Live data for the returns (RMA) area. Thin wrappers over the admin hooks
 * (../../../api/hooks.ts); every decision lives in ./mappers.ts or the API
 * module, which are tested.
 *
 * No returns route takes a warehouse: the server scopes the caller by the
 * linked order's warehouse (BR-30; another warehouse's return is 404). The
 * scope's warehouse is still part of every query key, so one warehouse's
 * cached returns never answer another warehouse's screen. Hooks that need a
 * return take its uuid (returnIdParam); without one nothing is fetched.
 *
 * Every write refetches the returns queries, and the customers' (a customer's
 * issues list shows the return's status and accepted value). The wallet refund
 * also refetches the wallet queries, and sends an Idempotency-Key from
 * useIdempotencyKey keyed on the return, so a retry replays its key (BR-61d).
 */
import { useCallback, useMemo } from 'react';
import { useAdminMutation, useAdminQuery, useCursorList, useIdempotencyKey, type CursorList } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import {
  approveReturn,
  getReturn,
  getReturnHistory,
  inspectReturn,
  listReturns,
  refundReturnToWallet,
  rejectReturn,
  type ReturnInspectionBody,
  type ReturnStatus,
  type ReturnSummaryDto,
} from '../../../api/returns';
import { refundIdempotencyFingerprint, toRefundResult, toReturnDetail, toReturnRow, toReturnTimeline, type RefundResultView } from './mappers';
import type { ReturnDetailView, ReturnRowView, ReturnTimelineEntry } from './types';

const RETURNS = 'returns';
const CUSTOMERS = 'customers';
const WALLET = 'wallet';

/** The caller's returns, newest first; `status` is the server-side filter. */
export function useReturnList(warehouseId: string | undefined, status: ReturnStatus | undefined): CursorList<ReturnRowView> {
  // The clock is read when a page is mapped, so "Today" is fresh after every fetch.
  const map = useCallback((dto: ReturnSummaryDto) => toReturnRow(dto, new Date()), []);
  return useCursorList(
    adminKeys.scoped(RETURNS, warehouseId, { resource: 'list', status: status ?? null }),
    (cursor, signal) => listReturns({ status, cursor }, signal),
    map,
  );
}

export interface LiveReturn {
  detail: ReturnDetailView | undefined;
  /** The status trail, oldest first; empty until it loads (a failure there does not hide the detail). */
  timeline: readonly ReturnTimelineEntry[];
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
  isRefreshing: boolean;
}

/** One return with its status trail; 404 outside the caller's scope (BR-30). */
export function useReturn(warehouseId: string | undefined, returnId: string | undefined): LiveReturn {
  const enabled = returnId !== undefined;
  const detailQuery = useAdminQuery(
    adminKeys.scoped(RETURNS, warehouseId, { resource: 'return', returnId: returnId ?? null }),
    (signal) => getReturn(returnId ?? '', signal),
    { enabled },
  );
  const historyQuery = useAdminQuery(
    adminKeys.scoped(RETURNS, warehouseId, { resource: 'history', returnId: returnId ?? null }),
    (signal) => getReturnHistory(returnId ?? '', signal),
    { enabled },
  );
  const detail = useMemo(() => (detailQuery.data === undefined ? undefined : toReturnDetail(detailQuery.data, new Date())), [detailQuery.data]);
  const timeline = useMemo(() => (historyQuery.data === undefined ? [] : toReturnTimeline(historyQuery.data, new Date())), [historyQuery.data]);
  const { refetch: refetchDetail } = detailQuery;
  const { refetch: refetchHistory } = historyQuery;
  return {
    detail,
    timeline,
    isLoading: enabled && detailQuery.isPending,
    error: detailQuery.error,
    refresh: () => {
      void refetchDetail();
      void refetchHistory();
    },
    isRefreshing: detailQuery.isRefetching,
  };
}

export interface LiveReturnWrite<TVariables, TResult> {
  /** Runs the write; `onDone` gets the server's answer. Ignored while one is in flight. */
  run: (variables: TVariables, onDone?: (result: TResult) => void) => void;
  isPending: boolean;
  /** The last failure, for returnWriteErrorKey / returnRefundErrorKey; null after a success or reset(). */
  error: unknown;
  reset: () => void;
}

function useReturnWrite<TVariables, TResult>(
  mutationFn: (variables: TVariables) => Promise<TResult>,
  invalidates: readonly string[],
): LiveReturnWrite<TVariables, TResult> {
  const mutation = useAdminMutation<TVariables, TResult>({
    mutationFn,
    invalidates: invalidates.map((module) => adminKeys.module(module)),
  });
  const { mutate, isPending, error, reset } = mutation;
  return useMemo(
    () => ({
      run: (variables: TVariables, onDone?: (result: TResult) => void) => {
        if (isPending) return;
        if (onDone === undefined) mutate(variables);
        else mutate(variables, { onSuccess: (result) => onDone(result) });
      },
      isPending,
      error,
      reset,
    }),
    [mutate, isPending, error, reset],
  );
}

function requireId(returnId: string | undefined): string {
  if (returnId === undefined) throw new Error('No return to act on.');
  return returnId;
}

/** PENDING -> INSPECTED with the per-item condition and quantities (built by inspectionBody). */
export function useInspectReturn(returnId: string | undefined): LiveReturnWrite<ReturnInspectionBody, unknown> {
  return useReturnWrite((body: ReturnInspectionBody) => inspectReturn(requireId(returnId), body), [RETURNS, CUSTOMERS]);
}

/** INSPECTED -> APPROVED (BR-61a: 409 from any other state). */
export function useApproveReturn(returnId: string | undefined): LiveReturnWrite<void, unknown> {
  return useReturnWrite(() => approveReturn(requireId(returnId)), [RETURNS, CUSTOMERS]);
}

/** PENDING / INSPECTED -> REJECTED with a reason (validated by validateRejectReason). */
export function useRejectReturn(returnId: string | undefined): LiveReturnWrite<string, unknown> {
  return useReturnWrite((reason: string) => rejectReturn(requireId(returnId), { reason }), [RETURNS, CUSTOMERS]);
}

/**
 * APPROVED -> REFUNDED with an instant wallet credit. The key is the screen's
 * useIdempotencyKey for this return: a Try Again after a dropped connection
 * sends the same key (root CLAUDE.md 2.4, BR-61d).
 */
export function useWalletRefund(returnId: string | undefined): LiveReturnWrite<void, RefundResultView> {
  const idempotency = useIdempotencyKey();
  return useReturnWrite(async () => {
    if (returnId === undefined) throw new Error('No return to refund.');
    const key = idempotency.keyFor(refundIdempotencyFingerprint(returnId));
    return toRefundResult(await refundReturnToWallet(returnId, key));
  }, [RETURNS, CUSTOMERS, WALLET]);
}
