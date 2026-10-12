/**
 * Live data for the customer-order area. Thin wrappers over the admin hooks
 * (../../../api/hooks.ts); every decision lives in ./mappers.ts,
 * ./orderActions.ts or the API modules, which are tested.
 *
 * Every hook takes the warehouseId to send, which the flow computes once with
 * ordersWarehouseFilter (a Sub scope is always its own warehouse, BR-30 /
 * BR-101). It is part of every query key, so one warehouse's orders never
 * answer another's.
 */
import { useCallback, useMemo, useRef } from 'react';
import { useAdminMutation, useAdminQuery, useCursorList, type CursorList } from '../../../api/hooks';
import {
  dispatchOrder,
  getAdminOrder,
  listAdminOrders,
  packOrder,
  verifyPickupOtp,
  type OrderDto,
  type OrderListStatusFilter,
  type OrderSummaryDto,
  type PackOrderBody,
  type VerifyOtpBody,
} from '../../../api/orders';
import { adminKeys } from '../../../api/queryKeys';
import { getTaskSummary } from '../../../api/tasks';
import { createOrderActionKeyRing, orderTaskCounts, toOrderDetail, toOrderListRow, type OrderActionKeyRing } from './mappers';
import { INITIAL_ORDER_ACTION_STATE, performOrderAction, type OrderActionOutcome, type OrderActionState } from './orderActions';
import type { OrderAction, OrderDetailView, OrderListRow, OrderTaskCounts } from './types';

const ORDERS = 'orders';
const TASKS = 'tasks';
const INVENTORY = 'inventory';

/** What a data screen needs to pick an AsyncState and to refresh. */
export interface LiveQueryState {
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
  isRefreshing: boolean;
}

function queryState(query: { isPending: boolean; error: unknown; refetch: () => unknown; isRefetching: boolean }): LiveQueryState {
  return {
    isLoading: query.isPending,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
    isRefreshing: query.isRefetching,
  };
}

/** The order queue, page by page; `status` is the server-side filter. */
export function useOrderList(warehouseId: string | undefined, status?: OrderListStatusFilter | undefined): CursorList<OrderListRow> {
  // The clock is read when a page is mapped, so "Today" is fresh after every fetch.
  const map = useCallback((dto: OrderSummaryDto) => toOrderListRow(dto, new Date()), []);
  return useCursorList(
    adminKeys.scoped(ORDERS, warehouseId, { resource: 'orders', status: status ?? null }),
    (cursor, signal) => listAdminOrders({ cursor, warehouseId, status }, signal),
    map,
  );
}

export interface LiveOrder extends LiveQueryState {
  order: OrderDetailView | undefined;
}

/** One order; nothing while `orderId` is undefined. 404 outside the caller's scope (BR-30). */
export function useOrder(warehouseId: string | undefined, orderId: string | undefined): LiveOrder {
  const query = useAdminQuery(
    adminKeys.scoped(ORDERS, warehouseId, { resource: 'order', id: orderId ?? null }),
    (signal) => getAdminOrder(orderId ?? '', signal),
    { enabled: orderId !== undefined },
  );
  const order = useMemo(() => (query.data === undefined ? undefined : toOrderDetail(query.data, new Date())), [query.data]);
  return { ...queryState(query), isLoading: orderId !== undefined && query.isPending, order };
}

export interface LiveOrderTaskCounts extends LiveQueryState {
  /** null until the summary loads (shown as no value, never 0). */
  counts: OrderTaskCounts | null;
}

/** The open order task counts (GET /admin/tasks/summary). */
export function useOrderTaskCounts(warehouseId: string | undefined): LiveOrderTaskCounts {
  const query = useAdminQuery(adminKeys.scoped(TASKS, warehouseId, { resource: 'summary' }), (signal) =>
    getTaskSummary({ warehouseId }, signal),
  );
  return { ...queryState(query), counts: orderTaskCounts(query.data) };
}

function postFor(action: OrderAction, orderId: string, body: unknown, key: string): Promise<OrderDto> {
  switch (action) {
    case 'pack':
      return packOrder(orderId, body as PackOrderBody, key);
    case 'markReady':
      // A pickup order goes PACKED -> READY_FOR_PICKUP on this route (see api/orders.ts).
      return dispatchOrder(orderId, {}, key);
    case 'verifyOtp':
      return verifyPickupOtp(orderId, body as VerifyOtpBody, key);
  }
}

export interface LiveOrderAction<TBody> {
  /** Runs the write; `onDone` fires once it has landed (directly or found on a re-read). */
  run: (body: TBody, onDone?: () => void) => void;
  isPending: boolean;
  /** The last failure, for adminErrorKey; null after a success or reset(). */
  error: unknown;
  reset: () => void;
}

/**
 * One order write for the lifetime of the screen: a key ring (same body, same
 * key), the retry state of orderActions.ts, and a mutation whose success
 * refetches every order, task and inventory query, so lists and counts move.
 */
export function useOrderAction<TBody>(action: OrderAction, orderId: string | undefined): LiveOrderAction<TBody> {
  const ringRef = useRef<OrderActionKeyRing | null>(null);
  if (ringRef.current === null) ringRef.current = createOrderActionKeyRing();
  const ring = ringRef.current;
  const stateRef = useRef<OrderActionState>(INITIAL_ORDER_ACTION_STATE);
  const mutation = useAdminMutation<TBody, OrderActionOutcome>({
    mutationFn: async (body) => {
      if (orderId === undefined) throw new Error('No order to act on.');
      const key = ring.keyFor(orderId, action, body);
      const outcome = await performOrderAction(stateRef.current, action, {
        post: () => postFor(action, orderId, body, key),
        currentStatus: async () => (await getAdminOrder(orderId)).status,
      });
      stateRef.current = outcome.state;
      if (outcome.kind === 'failed') throw outcome.error;
      return outcome;
    },
    invalidates: [adminKeys.module(ORDERS), adminKeys.module(TASKS), adminKeys.module(INVENTORY)],
  });
  const { mutate, isPending, error, reset } = mutation;
  return useMemo(
    () => ({
      run: (body: TBody, onDone?: () => void) => {
        if (isPending) return;
        if (onDone === undefined) mutate(body);
        else mutate(body, { onSuccess: () => onDone() });
      },
      isPending,
      error,
      reset,
    }),
    [mutate, isPending, error, reset],
  );
}
