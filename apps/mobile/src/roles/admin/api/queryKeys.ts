/**
 * React Query key factory for admin data.
 *
 * Every key starts `['admin', 'wh', <warehouseId | '*'>]`. Scoping the cache
 * by warehouse means a device that changes hands between two Sub Warehouse
 * Admins (BR-30) can never render one warehouse's cached rows to the other,
 * and invalidating a resource prefix refreshes its lists and details at once.
 */
import type { QueryParams } from '../../../shell/api/pagination';

const ALL = ['admin'] as const;

function cleanParams(params: QueryParams | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (params === undefined) return out;
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

export const adminKeys = {
  all: ALL,
  /** `null` = an HQ admin with no assigned warehouse. */
  scope: (warehouseId: string | null) => [...ALL, 'wh', warehouseId ?? '*'] as const,
  resource: (warehouseId: string | null, resource: string) =>
    [...adminKeys.scope(warehouseId), resource] as const,
  list: (warehouseId: string | null, resource: string, params?: QueryParams) =>
    [...adminKeys.resource(warehouseId, resource), 'list', cleanParams(params)] as const,
  detail: (warehouseId: string | null, resource: string, id: string) =>
    [...adminKeys.resource(warehouseId, resource), 'detail', id] as const,
};
