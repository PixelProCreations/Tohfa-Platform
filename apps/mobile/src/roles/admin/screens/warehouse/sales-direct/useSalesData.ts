/**
 * Live data for the sales history screen (SalesHistory).
 *
 * Thin hook over useCursorList; all DTO→screen mapping is in ./mappers.ts
 * (unit-tested). BR-30: a Sub scope sends its own warehouseId; Main sends
 * undefined (all) or a narrowed id. BR-92: buyer name comes from the API's
 * SaleBuyerDto.name (masked phone for WALK_IN — never recover it).
 *
 * ListSalesResponseDto is structurally identical to Page<SaleListItemDto>
 * (same { items, page: PageMeta } shape), so useCursorList accepts it directly.
 *
 * Only the sales LIST is wired here. Sale detail, new-sale, payment and channel
 * screens are not in scope for this wiring pass.
 */
import { useCallback, useMemo } from 'react';
import { listSales, type ListSalesResponseDto, type SaleListItemDto } from '../../../api/sales';
import { useCursorList, type CursorList } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { useWarehouseOptions } from '../shared/useWarehouseOptions';
import { toSaleRecord } from './mappers';
import type { SaleRecord, PermissionCheck, WarehouseScope } from './types';

export { SaleRecord };

/** RBAC code that gates the sales history list. */
export const SALE_LIST_VIEW_CODE = 'sales.history.view';
/** RBAC code for the warehouse picker (Main-only). */
export const SALE_WAREHOUSE_LIST_CODE = 'warehouse.all.view';

/**
 * Live cursor-paginated sales list for the current scope + optional narrowing
 * warehouse. The mapper resolves warehouse names from the live warehouse list.
 */
export function useSalesList(
  scope: WarehouseScope,
  can: PermissionCheck,
  selectedWarehouseId: string | undefined,
): CursorList<SaleRecord> {
  const effectiveWarehouseId = scope.warehouseId ?? selectedWarehouseId;

  // Warehouse names for the mapper (warehouseName comes from the warehouse list,
  // not from SaleListItemDto which only has warehouseId).
  const warehouses = useWarehouseOptions({
    enabled: can(SALE_WAREHOUSE_LIST_CODE),
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
    (dto: SaleListItemDto) =>
      toSaleRecord(dto, warehouseNames.get(dto.warehouseId) ?? dto.warehouseId),
    [warehouseNames],
  );

  return useCursorList<SaleListItemDto, SaleRecord, ListSalesResponseDto>(
    adminKeys.scoped('sales', effectiveWarehouseId, { resource: 'list' }),
    (cursor, signal) =>
      listSales({ cursor, warehouseId: effectiveWarehouseId }, signal),
    map,
    { enabled: can(SALE_LIST_VIEW_CODE) },
  );
}
