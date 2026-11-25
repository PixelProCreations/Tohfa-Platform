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
 * Learning Hub (api/learning.ts). One module for all four resources, so a
 * write to any of them refetches the whole module — the screens show them
 * side by side and a stale tab is worse than a refetch. No warehouse takes
 * part: learning content is platform-wide, so every key carries `undefined`
 * (which the key renders as 'all'), not a warehouse id.
 *
 * `page` is deliberately NOT in any key: useNumberedList accumulates the pages
 * of one query, so putting the page number in the key would start a new list
 * on every load-more.
 */
export const LEARNING_MODULE = 'learning';

export interface LearningListKeyFilters {
  language?: string | undefined;
  tag?: string | undefined;
  isPublished?: boolean | undefined;
  category?: string | undefined;
  sort?: string | undefined;
  q?: string | undefined;
  limit?: number | undefined;
  /** BR-59t: the review-status filter of the four content lists. */
  reviewStatus?: string | undefined;
  /** BR-59s: the community filter of the groups list. */
  communityId?: string | undefined;
}

function learningList(resource: string) {
  return (filters: LearningListKeyFilters = {}) =>
    adminKeys.scoped(LEARNING_MODULE, undefined, {
      resource,
      language: filters.language ?? null,
      tag: filters.tag ?? null,
      isPublished: filters.isPublished ?? null,
      category: filters.category ?? null,
      sort: filters.sort ?? null,
      q: filters.q ?? null,
      limit: filters.limit ?? null,
      reviewStatus: filters.reviewStatus ?? null,
      communityId: filters.communityId ?? null,
    });
}

function learningDetail(resource: string) {
  return (id: string | undefined) => adminKeys.scoped(LEARNING_MODULE, undefined, { resource, id: id ?? null });
}

export const learningKeys = {
  articles: learningList('articles'),
  article: learningDetail('article'),
  videos: learningList('videos'),
  video: learningDetail('video'),
  trainings: learningList('trainings'),
  training: learningDetail('training'),
  groups: learningList('groups'),
  group: learningDetail('group'),
  /** The farmer.learning.manage surface: its own keys, because a caller may hold one permission and not the other. */
  hubArticles: learningList('hubArticles'),
  hubArticle: learningDetail('hubArticle'),
};

/**
 * Communities (api/communities.ts, BR-59s). Platform-wide like the Learning Hub,
 * so no warehouse takes part. `page` is NOT in any key, for the reason given on
 * LEARNING_MODULE. The nested lists (a community's groups and members) are keyed
 * by the community id so two communities never share a cache entry.
 */
export const COMMUNITIES_MODULE = 'communities';

export interface CommunityListKeyFilters {
  category?: string | undefined;
  isArchived?: boolean | undefined;
  q?: string | undefined;
  sort?: string | undefined;
  limit?: number | undefined;
}

export const communityKeys = {
  list: (filters: CommunityListKeyFilters = {}) =>
    adminKeys.scoped(COMMUNITIES_MODULE, undefined, {
      resource: 'list',
      category: filters.category ?? null,
      isArchived: filters.isArchived ?? null,
      q: filters.q ?? null,
      sort: filters.sort ?? null,
      limit: filters.limit ?? null,
    }),
  detail: (id: string | undefined) => adminKeys.scoped(COMMUNITIES_MODULE, undefined, { resource: 'detail', id: id ?? null }),
  groups: (id: string | undefined, limit?: number) =>
    adminKeys.scoped(COMMUNITIES_MODULE, undefined, { resource: 'groups', id: id ?? null, limit: limit ?? null }),
  members: (id: string | undefined, q?: string, limit?: number) =>
    adminKeys.scoped(COMMUNITIES_MODULE, undefined, { resource: 'members', id: id ?? null, q: q ?? null, limit: limit ?? null }),
};

/**
 * Community Q&A (api/qa.ts, BR-59u). Platform-wide; `page` stays out of the key.
 */
export const QA_MODULE = 'qa';

export interface QaListKeyFilters {
  communityId?: string | undefined;
  contentType?: string | undefined;
  contentId?: string | undefined;
  q?: string | undefined;
  authorUserId?: string | undefined;
  limit?: number | undefined;
}

export const qaKeys = {
  list: (filters: QaListKeyFilters = {}) =>
    adminKeys.scoped(QA_MODULE, undefined, {
      resource: 'list',
      communityId: filters.communityId ?? null,
      contentType: filters.contentType ?? null,
      contentId: filters.contentId ?? null,
      q: filters.q ?? null,
      authorUserId: filters.authorUserId ?? null,
      limit: filters.limit ?? null,
    }),
  detail: (id: string | undefined) => adminKeys.scoped(QA_MODULE, undefined, { resource: 'detail', id: id ?? null }),
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

/**
 * Zone Management (api/zones.ts). Zones are reference data the server does not
 * scope by warehouse for the roles that open this screen, so the warehouse is
 * left out of the key (it lands in the 'all' slot of adminKeys.scoped).
 */
export const ZONES_MODULE = 'zones';

export const zoneKeys = {
  list: (status: string | undefined) => adminKeys.scoped(ZONES_MODULE, undefined, { resource: 'list', status: status ?? null }),
  detail: (id: string | undefined) => adminKeys.scoped(ZONES_MODULE, undefined, { resource: 'detail', id: id ?? null }),
  warehouses: () => adminKeys.scoped(ZONES_MODULE, undefined, { resource: 'warehouses' }),
  farmers: (zoneId: string | null) => adminKeys.scoped(ZONES_MODULE, undefined, { resource: 'farmers', zoneId }),
};
