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

/**
 * Certifications (api/certifications.ts). Its own module, not a farmer
 * sub-resource: `GET /admin/certifications` is admin-wide and filtered by
 * `farmerId`, so a farmer write must not silently invalidate it.
 */
export const CERTIFICATIONS_MODULE = 'certifications';

export const certificationKeys = {
  list: (warehouseId: string | undefined, filters: { farmerId?: string | undefined; status?: string | undefined }) =>
    adminKeys.scoped(CERTIFICATIONS_MODULE, warehouseId, {
      resource: 'list',
      farmerId: filters.farmerId ?? null,
      status: filters.status ?? null,
    }),
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

/**
 * Market & Pricing (api/pricing.ts). Ceilings and retail prices are separate
 * modules so a retail write refetches the retail list only; the ceiling list
 * is read-only from these screens. Unset filters are null so the key shape is
 * stable.
 */
/**
 * Market day (api/marketDay.ts). Two resources under one module: the recurring
 * venue flags read from GET /warehouses, and the dated schedule from GET
 * /admin/market-days. Its own module key so a refetch here does not disturb
 * the warehouse screens' caches, and so a create or patch on the schedule
 * refetches both resources (they describe the same thing from two angles).
 * Unset filters are null so the key shape is stable.
 */
export const MARKET_DAY_MODULE = 'marketDay';

export interface MarketDayListKeyFilters {
  warehouseId?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
}

export const marketDayKeys = {
  /** The warehouses flagged as market day venues (GET /warehouses). */
  venues: () => adminKeys.scoped(MARKET_DAY_MODULE, undefined, { resource: 'venues' }),
  /** The dated schedule (GET /admin/market-days). */
  schedule: (warehouseId: string | undefined, filters: MarketDayListKeyFilters = {}) =>
    adminKeys.scoped(MARKET_DAY_MODULE, warehouseId, {
      resource: 'schedule',
      warehouseId: filters.warehouseId ?? null,
      from: filters.from ?? null,
      to: filters.to ?? null,
    }),
};

export const PRICING_FAIR_MODULE = 'pricingFair';
export const PRICING_RETAIL_MODULE = 'pricingRetail';

export interface FairPriceListKeyFilters {
  cropId?: string | undefined;
  grade?: string | undefined;
  effectiveOn?: string | undefined;
}

export interface FairPriceHistoryKeyFilters {
  cropId: string | undefined;
  grade?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
}

export interface RetailPriceListKeyFilters {
  cropId?: string | undefined;
  grade?: string | undefined;
}

export const pricingKeys = {
  fairList: (warehouseId: string | undefined, filters: FairPriceListKeyFilters) =>
    adminKeys.scoped(PRICING_FAIR_MODULE, warehouseId, {
      resource: 'list',
      cropId: filters.cropId ?? null,
      grade: filters.grade ?? null,
      effectiveOn: filters.effectiveOn ?? null,
    }),
  fairHistory: (warehouseId: string | undefined, filters: FairPriceHistoryKeyFilters) =>
    adminKeys.scoped(PRICING_FAIR_MODULE, warehouseId, {
      resource: 'history',
      cropId: filters.cropId ?? null,
      grade: filters.grade ?? null,
      from: filters.from ?? null,
      to: filters.to ?? null,
    }),
  retailList: (warehouseId: string | undefined, filters: RetailPriceListKeyFilters) =>
    adminKeys.scoped(PRICING_RETAIL_MODULE, warehouseId, {
      resource: 'list',
      cropId: filters.cropId ?? null,
      grade: filters.grade ?? null,
    }),
};

/**
 * Listing approval (api/listings.ts). Every approve / reject / counter
 * refetches the whole module, since each one takes the row out of the
 * pending queue. Unset filters are null so the key shape is stable.
 */
export const LISTINGS_MODULE = 'listings';

export interface ListingQueueKeyFilters {
  status?: string | undefined;
  cropId?: string | undefined;
  zoneId?: string | undefined;
}

export const listingKeys = {
  queue: (warehouseId: string | undefined, filters: ListingQueueKeyFilters) =>
    adminKeys.scoped(LISTINGS_MODULE, warehouseId, {
      resource: 'queue',
      status: filters.status ?? null,
      cropId: filters.cropId ?? null,
      zoneId: filters.zoneId ?? null,
    }),
};

/**
 * Purchase Orders (api/purchaseOrders.ts), read-only. Unset filters are null
 * so the key shape is stable.
 */
export const PURCHASE_ORDERS_MODULE = 'purchaseOrders';

export interface PurchaseOrderListKeyFilters {
  status?: string | undefined;
  q?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
}

export const purchaseOrderKeys = {
  list: (warehouseId: string | undefined, filters: PurchaseOrderListKeyFilters) =>
    adminKeys.scoped(PURCHASE_ORDERS_MODULE, warehouseId, {
      resource: 'list',
      status: filters.status ?? null,
      q: filters.q ?? null,
      from: filters.from ?? null,
      to: filters.to ?? null,
    }),
  detail: (warehouseId: string | undefined, id: string | undefined) =>
    adminKeys.scoped(PURCHASE_ORDERS_MODULE, warehouseId, { resource: 'detail', id: id ?? null }),
};
