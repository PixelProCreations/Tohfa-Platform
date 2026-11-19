import { fromPaise, GenericProblemCode, parseMoney, toPaise } from '@tohfa/shared-types';
import { pool, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import {
  catalogRepo,
  type CatalogRepo,
  type RawCatalogProductRow,
} from './catalog.repo.js';
import type {
  BannerView,
  CatalogHomeView,
  CategoryView,
  HeroBannerView,
  HomeSectionView,
  ListProductsQuery,
  ProductDetailView,
  ProductVariantView,
  ProductView,
  SearchCatalogQuery,
} from './catalog.schema.js';
import { productImageUrl } from './catalog.image.js';
import { homeContentRepo, type HomeContentSource } from '../home-content/home-content.repo.js';
import { bannerDeeplink } from '../home-content/home-content.service.js';

/**
 * BR-16: FARM-ANONYMOUS SERIALIZER (ALLOW-LIST).
 * Positively constructs every Product with exactly the permitted allow-list fields.
 * NO object spread (...row), NO key deletion (delete row.x).
 */
export function serializeProduct(row: RawCatalogProductRow): ProductView {
  const photos = row.photo_url
    ? [row.photo_url]
    : [productImageUrl(row.icon_key, row.crop_id)];

  // Money stays exact: pg numeric(12,2) text -> Money -> integer paise. No Number() on money (CLAUDE.md §2.2).
  const price = parseMoney(row.price_per_kg);
  const priceP = toPaise(price);
  const mrp = row.compare_at_price == null ? null : toPaise(parseMoney(row.compare_at_price));

  return {
    id: row.crop_id,
    name: row.name,
    categoryId: row.category_id,
    grade: row.grade,
    pricePerKg: price,
    availableQty: Number(row.available_qty).toFixed(3),
    unit: 'kg',
    photos,
    certificationBadges: row.certification_badges ?? [],
    warehouseIds: row.warehouse_ids ?? [],
    tasteNotes: row.taste_notes ?? null,
    shelfLifeDays: row.shelf_life_days ?? null,
    harvestSeason: row.harvest_season ?? null,
    originRegion: row.origin_region ?? null,
    farmingType: (row.farming_type as ProductView['farmingType']) ?? null,
    packSize: row.pack_size === null || row.pack_size === undefined ? null : Number(row.pack_size).toString(),
    packUnit: (row.pack_unit as ProductView['packUnit']) ?? null,
    compareAtPrice: mrp === null ? null : fromPaise(mrp),
    discountPercent: discountPercent(priceP, mrp),
    isComingSoon: row.is_coming_soon ?? false,
    comingTomorrow: row.coming_tomorrow ?? false,
    isUnsalable: row.is_unsalable ?? false,
    ratingAverage: row.rating_average == null ? null : Number(row.rating_average),
    ratingCount: row.rating_count ?? 0,
  };
}

/**
 * BR-202 / BR-16: variants through the same allow-listed serializer as the product, keeping only
 * the per-grade fields. Sorted by grade (GRADE_1 first), one entry per grade.
 */
export function serializeVariants(rows: RawCatalogProductRow[]): ProductVariantView[] {
  const byGrade = new Map<string, ProductVariantView>();
  for (const row of rows) {
    const p = serializeProduct(row);
    if (byGrade.has(p.grade)) continue;
    byGrade.set(p.grade, {
      grade: p.grade,
      pricePerKg: p.pricePerKg,
      availableKg: p.availableQty,
      compareAtPrice: p.compareAtPrice,
      discountPercent: p.discountPercent,
      flags: { isComingSoon: p.isComingSoon, comingTomorrow: p.comingTomorrow, isUnsalable: p.isUnsalable },
    });
  }
  return [...byGrade.values()].sort((a, b) => a.grade.localeCompare(b.grade));
}

/** BR-181: floor((mrp - price) / mrp * 100) in integer paise; null unless MRP > price. */
export function discountPercent(pricePaise: number | null, mrpPaise: number | null): number | null {
  if (pricePaise === null || mrpPaise === null || mrpPaise <= pricePaise) return null;
  return Math.floor(((mrpPaise - pricePaise) * 100) / mrpPaise);
}

/** The placeholder banners served before any admin banner is live (pre-BR-152 behaviour). */
const STATIC_BANNERS: BannerView[] = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    imageUrl: 'https://cdn.tohfa.in/banners/fresh-nilgiris-harvest.jpg',
    deeplink: '/categories/vegetables',
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    imageUrl: 'https://cdn.tohfa.in/banners/organic-carrots-special.jpg',
    deeplink: '/products',
  },
];

export class CatalogService {
  /**
   * `homeContent` (BR-152) is optional so a service built with only a catalog repo (unit tests)
   * keeps the original home payload: static banners and no sections.
   */
  constructor(
    private readonly repo: CatalogRepo = catalogRepo,
    private readonly homeContent?: HomeContentSource,
  ) {}

  /** BR-152: live admin banners, or the static placeholders when none is live. */
  private async heroBanners(db: Executor): Promise<HeroBannerView[]> {
    const rows = this.homeContent ? await this.homeContent.listActiveBanners(db) : [];
    if (rows.length === 0) {
      return STATIC_BANNERS.map((b) => ({ id: b.id, imageUrl: b.imageUrl, title: null, deeplink: b.deeplink ?? null }));
    }
    return rows.map((r) => ({ id: r.id, imageUrl: r.image_url, title: r.title, deeplink: bannerDeeplink(r) }));
  }

  /** BR-152: live curated rails, items through the BR-16 serializer; empty rails omitted. */
  private async homeSections(db: Executor, warehouseId?: string): Promise<HomeSectionView[]> {
    if (!this.homeContent) return [];
    const rows = await this.homeContent.listActiveSections(db);
    const out: HomeSectionView[] = [];
    for (const s of rows) {
      let items: ProductView[] = [];
      if (s.target_type === 'CATEGORY' && s.target_category_id !== null) {
        const res = await this.repo.listProducts(db, {
          categoryId: s.target_category_id,
          limit: s.max_items,
          sort: 'NAME_ASC',
          ...(warehouseId !== undefined ? { warehouseId } : {}),
        });
        items = res.items.slice(0, s.max_items).map(serializeProduct);
      } else {
        for (const id of s.product_ids) {
          if (items.length >= s.max_items) break;
          const row = await this.repo.getProductById(db, id);
          if (row !== null) items.push(serializeProduct(row));
        }
      }
      if (items.length > 0) out.push({ id: s.id, title: s.title, subtitle: s.subtitle, items });
    }
    return out;
  }

  async listProducts(
    filters: ListProductsQuery,
    db: Executor = pool,
  ): Promise<{ items: ProductView[]; page: { nextCursor: string | null; hasMore: boolean } }> {
    const { items, nextCursor, hasMore } = await this.repo.listProducts(db, filters);
    return {
      items: items.map(serializeProduct),
      page: {
        nextCursor,
        hasMore,
      },
    };
  }

  async getProductById(id: string, db: Executor = pool): Promise<ProductDetailView> {
    const row = await this.repo.getProductById(db, id);
    if (row === null) {
      throw new AppError(GenericProblemCode.NOT_FOUND, {
        detail: 'Product not found or currently unavailable.',
      });
    }
    // BR-202: every sellable grade; a repo without the method (test fakes) yields the one row.
    const grades = this.repo.listProductGrades ? await this.repo.listProductGrades(db, id) : [row];
    return { ...serializeProduct(row), variants: serializeVariants(grades.length > 0 ? grades : [row]) };
  }

  async searchCatalog(
    filters: SearchCatalogQuery,
    db: Executor = pool,
  ): Promise<{ items: ProductView[]; page: { nextCursor: string | null; hasMore: boolean } }> {
    const { items, nextCursor, hasMore } = await this.repo.searchProducts(db, filters);
    return {
      items: items.map(serializeProduct),
      page: {
        nextCursor,
        hasMore,
      },
    };
  }

  async listCategories(db: Executor = pool): Promise<{ items: CategoryView[] }> {
    const categories = await this.repo.listCategories(db);
    return { items: categories };
  }

  async getCatalogHome(
    warehouseId?: string,
    db: Executor = pool,
  ): Promise<CatalogHomeView> {
    const [categories, featuredRows, heroBanners, sections] = await Promise.all([
      this.repo.listCategories(db),
      this.repo.getFeaturedProducts(db, warehouseId),
      this.heroBanners(db),
      this.homeSections(db, warehouseId),
    ]);

    // `banners` keeps its original {id, imageUrl, deeplink} shape for existing clients.
    const banners: BannerView[] = heroBanners.map((b) => ({ id: b.id, imageUrl: b.imageUrl, deeplink: b.deeplink }));

    return {
      banners,
      heroBanners,
      sections,
      categories,
      featured: featuredRows.map(serializeProduct),
      nearestWarehouseId: warehouseId ?? null,
    };
  }
}

export const catalogService = new CatalogService(catalogRepo, homeContentRepo);
