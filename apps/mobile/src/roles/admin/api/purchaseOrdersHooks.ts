/**
 * Live data for the Purchase Orders screens. Thin wrappers over ./hooks.ts;
 * the view models are built in screens/purchase-orders/purchaseOrdersLogic.ts
 * (tested), so these hooks return the API's DTOs unchanged.
 *
 * Every hook takes `{ enabled }` so a screen skips the fetch when
 * `can('purchase.order.view')` denies. The server still decides
 * (root CLAUDE.md 2.1); `enabled` only avoids a request that would 403.
 */
import { getPurchaseOrderDetail, listPurchaseOrderRows, type PurchaseOrderDetailRowDto, type PurchaseOrderListItemDto, type PurchaseOrderListPage, type PurchaseOrderStatus } from './purchaseOrders';
import { useAdminQuery, useCursorList, type CursorList } from './hooks';
import { purchaseOrderKeys } from './queryKeys';

export interface PurchaseOrderHookOptions {
  /** false: nothing is fetched and nothing is loading. Default true. */
  enabled?: boolean | undefined;
}

export interface PurchaseOrderListFilters {
  status?: PurchaseOrderStatus | undefined;
  q?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
}

function keepRow(dto: PurchaseOrderListItemDto): PurchaseOrderListItemDto {
  return dto;
}

/** purchase.order.view: the scoped list, page by page (BR-30, BR-122). */
export function usePurchaseOrderList(
  warehouseId: string | undefined,
  filters: PurchaseOrderListFilters,
  options: PurchaseOrderHookOptions = {},
): CursorList<PurchaseOrderListItemDto, PurchaseOrderListPage> {
  return useCursorList<PurchaseOrderListItemDto, PurchaseOrderListItemDto, PurchaseOrderListPage>(
    purchaseOrderKeys.list(warehouseId, filters),
    (cursor, signal) => listPurchaseOrderRows({ ...filters, warehouseId, cursor }, signal),
    keepRow,
    { enabled: options.enabled ?? true },
  );
}

export interface PurchaseOrderDetailQuery {
  data: PurchaseOrderDetailRowDto | undefined;
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
}

/** purchase.order.view: one order with its receipts. Without an id nothing is fetched. */
export function usePurchaseOrderDetail(
  warehouseId: string | undefined,
  id: string | undefined,
  options: PurchaseOrderHookOptions = {},
): PurchaseOrderDetailQuery {
  const enabled = id !== undefined && (options.enabled ?? true);
  const query = useAdminQuery(purchaseOrderKeys.detail(warehouseId, id), (signal) => getPurchaseOrderDetail(id ?? '', signal), { enabled });
  return {
    data: query.data,
    isLoading: enabled && query.isLoading,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
  };
}
