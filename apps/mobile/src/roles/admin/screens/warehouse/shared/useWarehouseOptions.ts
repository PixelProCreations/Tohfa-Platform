/**
 * The real warehouse list for a Main-admin warehouse picker, from GET
 * /warehouses (warehouse.all.view). Replaces the fixture pickers keyed by
 * 'WH-OOTY'-style ids, which are not uuids and which the server rejects.
 *
 * Pass `enabled: false` for a caller without warehouse.all.view (a Sub admin
 * gets 403 here; its only warehouse is scope.warehouseId, BR-30). Every
 * decision lives in api/warehouseList.ts, which is tested; this is only the
 * TanStack Query wrapper.
 *
 * Usage:
 *   const { options, isLoading, error, refresh } = useWarehouseOptions({ enabled: can('warehouse.all.view') });
 */
import { useMemo } from 'react';
import { useAdminQuery } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { listAllWarehouses, toWarehouseOptions, type WarehouseOption } from '../../../api/warehouseList';

export const WAREHOUSE_LIST_MODULE = 'warehouseList';

export interface WarehouseOptionsResult {
  options: WarehouseOption[];
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
}

export function useWarehouseOptions(opts: { enabled?: boolean | undefined; activeOnly?: boolean | undefined } = {}): WarehouseOptionsResult {
  const enabled = opts.enabled ?? true;
  const activeOnly = opts.activeOnly ?? false;
  const query = useAdminQuery(
    adminKeys.scoped(WAREHOUSE_LIST_MODULE, undefined, { activeOnly }),
    (signal) => listAllWarehouses(activeOnly ? { isActive: true } : {}, signal),
    { enabled },
  );
  const options = useMemo(() => (query.data === undefined ? [] : toWarehouseOptions(query.data)), [query.data]);
  return {
    options,
    isLoading: enabled && query.isPending,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
  };
}
