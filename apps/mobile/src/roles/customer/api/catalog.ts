/**
 * Customer catalog endpoints (docs/openapi.yaml tag Catalog + Reviews):
 *   GET /catalog/home, /catalog/categories, /catalog/products (cursor paged),
 *   GET /catalog/products/{id} (+ `variants`, BR-202),
 *   GET /catalog/products/{id}/reviews (PAGE-NUMBER paged, not cursor).
 *
 * Farm-anonymous (BR-16): no farmer/farm field exists on any of these shapes.
 * The products query is `.strict()` on the server: any key other than
 * cursor, limit, categoryId, grade, warehouseId, sort is 422, so this module
 * builds the query from an explicit allow-list.
 */
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { Money } from '@tohfa/shared-types';
import { api } from '../../../shell/api/client';
import { buildQueryString, nextPageParam, type Page } from '../../../shell/api/pagination';
import type { Quantity } from '../utils/money';

/** Sellable grades. `REJECT` exists in the DB enum but never reaches the customer surface. */
export type SellableGrade = 'GRADE_1' | 'GRADE_2' | 'GRADE_3';
/** docs/openapi.yaml `Grade` (REJECT never appears in the catalog). */
export type Grade = SellableGrade | 'REJECT';
export const SELLABLE_GRADES: readonly SellableGrade[] = ['GRADE_1', 'GRADE_2', 'GRADE_3'];

export type CertificationType = 'PGS' | 'NPOP' | 'OTHER';
export type FarmingType = 'ORGANIC' | 'NATURAL' | 'CONVENTIONAL';
export type PackUnit = 'KG' | 'G' | 'PIECE' | 'BUNCH' | 'DOZEN' | 'PACK';

/** docs/openapi.yaml `Product` (one product at one grade). */
export interface Product {
  id: string;
  name: string;
  categoryId: string;
  grade: SellableGrade;
  pricePerKg: Money;
  /** Pooled ONLINE availability in kg (note: `availableQty`, not `availableKg`). */
  availableQty: Quantity;
  unit: 'kg';
  /** Image URLs (strings, not objects). */
  photos: string[];
  certificationBadges: CertificationType[];
  warehouseIds: string[];
  tasteNotes: string | null;
  shelfLifeDays: number | null;
  harvestSeason: string | null;
  originRegion: string | null;
  farmingType: FarmingType | null;
  packSize: string | null;
  packUnit: PackUnit | null;
  /** MRP per kg (decimal string), display only. */
  compareAtPrice: string | null;
  discountPercent: number | null;
  isComingSoon: boolean;
  comingTomorrow: boolean;
  isUnsalable: boolean;
  /** 1..5, one decimal; null when unrated. */
  ratingAverage: number | null;
  ratingCount: number;
}

/** docs/openapi.yaml `ProductVariant` (BR-202). */
export interface ProductVariant {
  grade: SellableGrade;
  pricePerKg: Money;
  availableKg: Quantity;
  compareAtPrice: string | null;
  discountPercent: number | null;
  flags: { isComingSoon: boolean; comingTomorrow: boolean; isUnsalable: boolean };
}

/** `GET /catalog/products/{id}`: top-level = lowest sellable grade; `variants` = every grade. */
export interface ProductDetail extends Product {
  variants: ProductVariant[];
}

/** docs/openapi.yaml `Category`. */
export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  sortOrder?: number;
  productCount?: number;
}

export interface HeroBanner {
  id: string;
  imageUrl: string;
  title: string | null;
  /** `/categories/{id}`, `/products/{id}`, a URL, or null. */
  deeplink: string | null;
}

export interface HomeSection {
  id: string;
  title: string;
  subtitle: string | null;
  items: Product[];
}

/** docs/openapi.yaml `CatalogHome`. */
export interface CatalogHome {
  banners?: { id?: string; imageUrl?: string; deeplink?: string | null }[];
  heroBanners?: HeroBanner[];
  sections?: HomeSection[];
  categories: Category[];
  featured: Product[];
  nearestWarehouseId?: string | null;
}
/** @deprecated old name. */
export type CatalogHomeResponse = CatalogHome;

export type ProductSort = 'PRICE_ASC' | 'PRICE_DESC' | 'NAME_ASC' | 'NEWEST' | 'just_arrived';

/** Filters for `GET /catalog/products`. Only these keys are ever sent. */
export interface ProductFilters {
  categoryId?: string | undefined;
  grade?: SellableGrade | undefined;
  warehouseId?: string | undefined;
  /** Default NAME_ASC server-side. `just_arrived` is lowercase on purpose (BR-181). */
  sort?: ProductSort | undefined;
  /** 1..100, default 20. */
  limit?: number | undefined;
}
/** @deprecated old name; `sortBy`/`page` are gone (the server rejects them with 422). */
export type ListProductsQuery = ProductFilters;

export type ProductPage = Page<Product>;

/** docs/openapi.yaml `ProductReviews` (page-number paged). */
export interface ProductReviews {
  summary: {
    /** One decimal as a STRING here (e.g. "4.3"), unlike Product.ratingAverage (a number). */
    averageRating: string | null;
    ratingCount: number;
    distribution: Partial<Record<'1' | '2' | '3' | '4' | '5', number>>;
  };
  items: { id: string; rating: number; comment: string | null; createdAt: string }[];
  total: number;
  page: number;
  limit: number;
}

function normalizeFilters(f: ProductFilters): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  if (f.categoryId) out['categoryId'] = f.categoryId;
  if (f.grade) out['grade'] = f.grade;
  if (f.warehouseId) out['warehouseId'] = f.warehouseId;
  if (f.sort) out['sort'] = f.sort;
  if (f.limit !== undefined) out['limit'] = f.limit;
  return out;
}

export const catalogQueryKeys = {
  all: ['catalog'] as const,
  home: (warehouseId?: string) => ['catalog', 'home', warehouseId ?? null] as const,
  categories: ['catalog', 'categories'] as const,
  products: (filters: ProductFilters) => ['catalog', 'products', 'list', normalizeFilters(filters)] as const,
  product: (id: string) => ['catalog', 'products', 'detail', id] as const,
  reviews: (id: string, grade?: SellableGrade) => ['catalog', 'products', 'reviews', id, grade ?? null] as const,
};

/** `?cursor&limit&categoryId&grade&warehouseId&sort` -- the strict server allow-list, nothing else. */
export function buildProductsQuery(filters: ProductFilters, cursor?: string): string {
  return buildQueryString({
    cursor,
    limit: filters.limit,
    categoryId: filters.categoryId || undefined,
    grade: filters.grade,
    warehouseId: filters.warehouseId || undefined,
    sort: filters.sort,
  });
}

export function fetchCatalogHome(warehouseId?: string, signal?: AbortSignal): Promise<CatalogHome> {
  return api.get<CatalogHome>(`/catalog/home${buildQueryString({ warehouseId: warehouseId || undefined })}`, signal);
}

export async function fetchCategories(signal?: AbortSignal): Promise<Category[]> {
  const res = await api.get<{ items: Category[] }>('/catalog/categories', signal);
  return res.items;
}

export function fetchProducts(filters: ProductFilters, cursor?: string, signal?: AbortSignal): Promise<ProductPage> {
  return api.get<ProductPage>(`/catalog/products${buildProductsQuery(filters, cursor)}`, signal);
}

export function fetchProductDetail(id: string, signal?: AbortSignal): Promise<ProductDetail> {
  return api.get<ProductDetail>(`/catalog/products/${encodeURIComponent(id)}`, signal);
}

export function fetchProductReviews(
  id: string,
  params: { grade?: SellableGrade | undefined; page?: number | undefined; limit?: number | undefined } = {},
  signal?: AbortSignal,
): Promise<ProductReviews> {
  const qs = buildQueryString({ grade: params.grade, page: params.page, limit: params.limit });
  return api.get<ProductReviews>(`/catalog/products/${encodeURIComponent(id)}/reviews${qs}`, signal);
}

export const useCatalogHome = (warehouseId?: string) =>
  useQuery({
    queryKey: catalogQueryKeys.home(warehouseId),
    queryFn: ({ signal }) => fetchCatalogHome(warehouseId, signal),
    staleTime: 60_000,
  });

/** Resolves to the `items` array (the endpoint wraps it as `{ items }`). */
export const useCategories = () =>
  useQuery({
    queryKey: catalogQueryKeys.categories,
    queryFn: ({ signal }) => fetchCategories(signal),
    staleTime: 5 * 60_000,
  });

/** Cursor-paged products. Flatten with `data.pages.flatMap(p => p.items)`; call `fetchNextPage()` on end reached. */
export const useProducts = (filters: ProductFilters = {}) =>
  useInfiniteQuery({
    queryKey: catalogQueryKeys.products(filters),
    queryFn: ({ pageParam, signal }) => fetchProducts(filters, pageParam, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: ProductPage) => nextPageParam(last),
  });

export const useProductDetail = (id: string | null | undefined) =>
  useQuery({
    queryKey: catalogQueryKeys.product(id ?? ''),
    queryFn: ({ signal }) => fetchProductDetail(id as string, signal),
    enabled: typeof id === 'string' && id.length > 0,
  });

/** Page-number paged (`page`, `limit` <= 50); `pages[0].summary` holds the aggregate. */
export const useProductReviews = (id: string | null | undefined, grade?: SellableGrade, limit = 20) =>
  useInfiniteQuery({
    queryKey: catalogQueryKeys.reviews(id ?? '', grade),
    queryFn: ({ pageParam, signal }) => fetchProductReviews(id as string, { grade, page: pageParam, limit }, signal),
    initialPageParam: 1,
    getNextPageParam: (last: ProductReviews) => (last.page * last.limit < last.total ? last.page + 1 : undefined),
    enabled: typeof id === 'string' && id.length > 0,
  });

/** `${productId}:${grade}` -- the identity of a sellable SKU (cart, wishlist). */
export function productKey(p: { id?: string | undefined; productId?: string | undefined; grade: string }): string {
  return `${p.productId ?? p.id ?? ''}:${p.grade}`;
}

const GRADE_LABELS: Record<string, string> = {
  GRADE_1: 'Grade A',
  GRADE_2: 'Grade B',
  GRADE_3: 'Grade C',
  REJECT: 'Reject',
};

/** Display label of a grade (`GRADE_1` -> `Grade A`). Unknown values pass through. */
export function gradeLabel(grade: string): string {
  return GRADE_LABELS[grade] ?? grade;
}

/** Short badge label (`GRADE_1` -> `A`). */
export function gradeShortLabel(grade: string): string {
  return gradeLabel(grade).replace(/^Grade /, '');
}
