/**
 * TanStack Query keys for admin data: `['admin', module, warehouseId, params]`.
 *
 * The warehouse is always part of the key ('all' for the Main all-warehouses
 * view), so one warehouse's cached rows can never answer another warehouse's
 * query (BR-30). `module(m)` is a prefix of every key of that module, which is
 * what `useAdminMutation({ invalidates })` passes to invalidateQueries.
 */
export type AdminQueryParams = Readonly<Record<string, unknown>>;

export const adminKeys = {
  all: ['admin'] as const,
  module: (module: string) => ['admin', module] as const,
  scoped: (module: string, warehouseId: string | undefined, params: AdminQueryParams = {}) =>
    ['admin', module, warehouseId ?? 'all', params] as const,
};
