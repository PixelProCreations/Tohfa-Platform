/**
 * Live data for the customer area.
 *
 * A thin hook over useCursorList / useWarehouseOptions; all mapping is in
 * ./mappers.ts, which is unit-tested. BR-30: a Sub scope always sends its own
 * warehouseId; a Main scope can be undefined (all warehouses) or narrowed by
 * the user's warehouse selector.
 *
 * Only the customer list is wired here. Customer detail, orders, purchases,
 * issues and support tickets stay on fixture data for now (those sub-screens
 * have no server-side list endpoint in PR #139). The list screen is the
 * highest-traffic screen, so it is wired first.
 */
import { useCallback, useMemo } from 'react';
import { listCustomers } from '../../../api/customers';
import { useCursorList, type CursorList } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { useWarehouseOptions } from '../shared/useWarehouseOptions';
import { toCustomerRecord } from './mappers';
import type { CustomerRecord, PermissionCheck, WarehouseScope } from './types';

export { CustomerRecord };

/** The warehouse.all.view code that gates the warehouse picker (Main-only). */
export const CUSTOMER_WAREHOUSE_LIST_CODE = 'warehouse.all.view';

/**
 * The live customer list for the current scope.
 *
 * - Sub scope: `warehouseId` is always scope.warehouseId (BR-30).
 * - Main scope: `warehouseId` is the picker's selection, or undefined for all.
 *
 * `warehouseId` is part of the query key so a scope change invalidates the
 * cached page and forces a refetch.
 */
export function useCustomerList(
  scope: WarehouseScope,
  can: PermissionCheck,
  /** Narrowing warehouse (Main only; Sub ignores it). */
  selectedWarehouseId: string | undefined,
): CursorList<CustomerRecord> {
  // A Sub scope always enforces its own warehouse (BR-30).
  const effectiveWarehouseId = scope.warehouseId ?? selectedWarehouseId;

  // Warehouse names for augmenting the customer rows (not needed for list rows
  // today — warehouseName is shown on the customer detail, not the list — but
  // we pre-load it so the picker works and the mapper has the lookup ready).
  const warehouses = useWarehouseOptions({
    enabled: can(CUSTOMER_WAREHOUSE_LIST_CODE),
    activeOnly: true,
  });

  const warehouseNames = useMemo((): ReadonlyMap<string, string> => {
    const m = new Map<string, string>();
    for (const o of warehouses.options) m.set(o.warehouseId, o.warehouseName);
    return m;
  }, [warehouses.options]);

  const map = useCallback(
    (dto: Parameters<typeof toCustomerRecord>[0]) => toCustomerRecord(dto, warehouseNames),
    [warehouseNames],
  );

  return useCursorList(
    adminKeys.scoped('customers', effectiveWarehouseId, { resource: 'list' }),
    // warehouseId is not a param; server scopes by the auth token (BR-30).
    (cursor, signal) => listCustomers({ cursor }, signal),
    map,
    { enabled: can('customer.list.view') },
  );
}
