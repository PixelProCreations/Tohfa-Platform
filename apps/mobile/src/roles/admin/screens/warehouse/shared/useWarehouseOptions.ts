/**
 * Real warehouse options for Main admin pickers from GET /warehouses.
 */
import { useMemo } from 'react';
import { useAdminQuery } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { listAllWarehouses, toWarehouseOptions, type WarehouseOption } from '../../../api/warehouseList';
import type { WarehouseScope } from '../finance-expenses/types';

export const WAREHOUSE_LIST_MODULE = 'warehouseList';

export interface WarehouseOptionsResult {
  options: WarehouseOption[];
  scopes: WarehouseScope[];
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
  const scopes = useMemo(
    () => options.map((o) => ({ warehouseId: o.warehouseId, warehouseName: o.warehouseName })),
    [options],
  );
  return {
    options,
    scopes,
    isLoading: enabled && query.isPending,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
  };
}
