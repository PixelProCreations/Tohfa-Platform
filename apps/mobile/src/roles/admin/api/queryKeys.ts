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

/**
 * Farmers Management (api/farmers.ts, api/farmerApplications.ts). The farmer
 * scope itself is server-side (BR-108a); the warehouse is still in every key,
 * as for every admin key. Unset filters are null so the key shape is stable.
 */
export const FARMERS_MODULE = 'farmers';
export const FARMER_APPLICATIONS_MODULE = 'farmerApplications';

export interface FarmerListKeyFilters {
  q?: string | undefined;
  status?: string | undefined;
  zoneId?: string | undefined;
  ratingTier?: string | undefined;
}

export interface ApplicationListKeyFilters {
  status?: string | undefined;
  zoneId?: string | undefined;
  submittedAfter?: string | undefined;
}

function perFarmer(resource: string) {
  return (warehouseId: string | undefined, farmerId: string | undefined) =>
    adminKeys.scoped(FARMERS_MODULE, warehouseId, { resource, farmerId: farmerId ?? null });
}

export const farmerKeys = {
  list: (warehouseId: string | undefined, filters: FarmerListKeyFilters) =>
    adminKeys.scoped(FARMERS_MODULE, warehouseId, {
      resource: 'list',
      q: filters.q ?? null,
      status: filters.status ?? null,
      zoneId: filters.zoneId ?? null,
      ratingTier: filters.ratingTier ?? null,
    }),
  detail: perFarmer('detail'),
  documents: perFarmer('documents'),
  bankAccounts: perFarmer('bankAccounts'),
  subscription: perFarmer('subscription'),
  rating: perFarmer('rating'),
};

export const applicationKeys = {
  list: (warehouseId: string | undefined, filters: ApplicationListKeyFilters) =>
    adminKeys.scoped(FARMER_APPLICATIONS_MODULE, warehouseId, {
      resource: 'list',
      status: filters.status ?? null,
      zoneId: filters.zoneId ?? null,
      submittedAfter: filters.submittedAfter ?? null,
    }),
  detail: (warehouseId: string | undefined, applicationId: string | undefined) =>
    adminKeys.scoped(FARMER_APPLICATIONS_MODULE, warehouseId, { resource: 'detail', applicationId: applicationId ?? null }),
};
