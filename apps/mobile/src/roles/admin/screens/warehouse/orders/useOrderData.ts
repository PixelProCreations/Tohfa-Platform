/**
 * Live data for the order list screen (M5S02).
 *
 * A thin cursor-list hook over listAdminOrders; all DTO→screen mapping is in
 * ./mappers.ts, which is unit-tested. BR-30: a Sub scope sends its own
 * warehouseId; Main can send undefined (all) or a narrowed id.
 *
 * Only the order LIST is wired. Order detail and action screens (StockCheck,
 * Packing, ReadyForPickup, etc.) get their data from the detail endpoint and
 * from mutations. Those are not connected to this hook.
 */
import { useCallback, useMemo } from 'react';
import { listAdminOrders } from '../../../api/orders';
import { useCursorList, type CursorList } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { useWarehouseOptions } from '../shared/useWarehouseOptions';
import { toOrderRow } from './mappers';
import type { OrderRow } from './OrdersListScreen';
import type { PermissionCheck, WarehouseScope } from './types';

export { OrderRow };

/** RBAC code for the order list (order.list.view). */
export const ORDER_LIST_VIEW_CODE = 'order.list.view';
/** RBAC code for the warehouse picker (Main-only). */
export const ORDER_WAREHOUSE_LIST_CODE = 'warehouse.all.view';

/**
 * Live cursor-paginated order list for the current scope + optional narrowing
 * warehouse. The mapper resolves warehouse names from the live warehouse list.
 */
export function useOrderList(
  scope: WarehouseScope,
  can: PermissionCheck,
  selectedWarehouseId: string | undefined,
): CursorList<OrderRow> {
  const effectiveWarehouseId = scope.warehouseId ?? selectedWarehouseId;

  // Warehouse names for the mapper (warehouseName comes from the warehouse list,
  // not from OrderSummaryDto which only has warehouseId).
  const warehouses = useWarehouseOptions({
    enabled: can(ORDER_WAREHOUSE_LIST_CODE),
    activeOnly: true,
  });

  const warehouseNames = useMemo((): ReadonlyMap<string, string> => {
    const m = new Map<string, string>();
    for (const o of warehouses.options) m.set(o.warehouseId, o.warehouseName);
    // For a Sub scope, add its own warehouse name from the scope.
    if (scope.warehouseId && scope.warehouseName) {
      m.set(scope.warehouseId, scope.warehouseName);
    }
    return m;
  }, [warehouses.options, scope.warehouseId, scope.warehouseName]);

  const map = useCallback(
    (dto: Parameters<typeof toOrderRow>[0]) =>
      toOrderRow(dto, warehouseNames.get(dto.warehouseId ?? '') ?? dto.warehouseId ?? ''),
    [warehouseNames],
  );

  return useCursorList(
    adminKeys.scoped('orders', effectiveWarehouseId, { resource: 'list' }),
    (cursor, signal) => listAdminOrders({ cursor, warehouseId: effectiveWarehouseId }, signal),
    map,
    { enabled: can(ORDER_LIST_VIEW_CODE) },
  );
}
