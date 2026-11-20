import { z } from 'zod';

export const productGradeEnum = z.enum(['GRADE_1', 'GRADE_2', 'GRADE_3']);
export type ProductGrade = z.infer<typeof productGradeEnum>;

export const productSortEnum = z.enum(['PRICE_ASC', 'PRICE_DESC', 'NAME_ASC', 'NEWEST', 'just_arrived']);
export type ProductSort = z.infer<typeof productSortEnum>;

export const listProductsQuery = z
  .object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    categoryId: z.string().uuid().optional(),
    grade: productGradeEnum.optional(),
    warehouseId: z.string().uuid().optional(),
    sort: productSortEnum.default('NAME_ASC'),
  })
  .strict();
export type ListProductsQuery = z.infer<typeof listProductsQuery>;

export const searchCatalogQuery = z
  .object({
    q: z.string().min(1).max(80),
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    warehouseId: z.string().uuid().optional(),
  })
  .strict();
export type SearchCatalogQuery = z.infer<typeof searchCatalogQuery>;

export const getCatalogHomeQuery = z
  .object({
    warehouseId: z.string().uuid().optional(),
  })
  .strict();
export type GetCatalogHomeQuery = z.infer<typeof getCatalogHomeQuery>;

export const productIdParam = z
  .object({
    id: z.string().uuid(),
  })
  .strict();
export type ProductIdParam = z.infer<typeof productIdParam>;

/**
 * FARM-ANONYMOUS Product schema.
 * Strict allow-list per OpenAPI spec (BR-16): the original 10 fields plus the BR-181 display
 * metadata. `unit` stays 'kg' (the ordering unit); the sales-unit label is packSize + packUnit.
 */
export const productSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    categoryId: z.string().uuid(),
    grade: productGradeEnum,
    pricePerKg: z.string(),
    availableQty: z.string(),
    unit: z.literal('kg'),
    photos: z.array(z.string()),
    certificationBadges: z.array(z.string()),
    warehouseIds: z.array(z.string().uuid()),
    // BR-181 display metadata (all nullable / false until an admin sets them).
    tasteNotes: z.string().nullable(),
    shelfLifeDays: z.number().int().nullable(),
    harvestSeason: z.string().nullable(),
    originRegion: z.string().nullable(),
    farmingType: z.enum(['ORGANIC', 'NATURAL', 'CONVENTIONAL']).nullable(),
    packSize: z.string().nullable(),
    packUnit: z.enum(['KG', 'G', 'PIECE', 'BUNCH', 'DOZEN', 'PACK']).nullable(),
    compareAtPrice: z.string().nullable(),
    discountPercent: z.number().int().nullable(),
    isComingSoon: z.boolean(),
    comingTomorrow: z.boolean(),
    isUnsalable: z.boolean(),
    ratingAverage: z.number().nullable(),
    ratingCount: z.number().int(),
  })
  .strict();
export type ProductView = z.infer<typeof productSchema>;

/**
 * BR-202: one sellable grade of a product, as shown on the product detail. Same allow-list
 * discipline as `productSchema` (BR-16): quantities and prices only, never a farm field.
 */
export const productVariantSchema = z
  .object({
    grade: productGradeEnum,
    pricePerKg: z.string(),
    availableKg: z.string(),
    compareAtPrice: z.string().nullable(),
    discountPercent: z.number().int().nullable(),
    flags: z
      .object({
        isComingSoon: z.boolean(),
        comingTomorrow: z.boolean(),
        isUnsalable: z.boolean(),
      })
      .strict(),
  })
  .strict();
export type ProductVariantView = z.infer<typeof productVariantSchema>;

/**
 * GET /catalog/products/{id}: the original Product (its lowest sellable grade, unchanged for
 * existing clients) plus `variants`, every sellable grade sorted by grade (BR-202). The crop master
 * has no variety grouping field, so no `variety` is exposed (farm_crops.seed_variety is farm-side
 * data and must not reach a customer, BR-16).
 */
export const productDetailSchema = productSchema.extend({ variants: z.array(productVariantSchema) }).strict();
export type ProductDetailView = z.infer<typeof productDetailSchema>;

export const categorySchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    imageUrl: z.string().nullable().optional(),
    sortOrder: z.number().int().optional(),
    productCount: z.number().int().optional(),
  })
  .strict();
export type CategoryView = z.infer<typeof categorySchema>;

export const bannerSchema = z
  .object({
    id: z.string().uuid(),
    imageUrl: z.string(),
    deeplink: z.string().nullable().optional(),
  })
  .strict();
export type BannerView = z.infer<typeof bannerSchema>;

/** BR-152: admin-managed hero banner as the customer sees it. */
export const heroBannerSchema = z
  .object({
    id: z.string().uuid(),
    imageUrl: z.string(),
    title: z.string().nullable(),
    deeplink: z.string().nullable(),
  })
  .strict();
export type HeroBannerView = z.infer<typeof heroBannerSchema>;

/** BR-152: curated home rail; items go through the BR-16 allow-list serializer. */
export const homeSectionViewSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string(),
    subtitle: z.string().nullable(),
    items: z.array(productSchema),
  })
  .strict();
export type HomeSectionView = z.infer<typeof homeSectionViewSchema>;

export const catalogHomeSchema = z
  .object({
    banners: z.array(bannerSchema).optional(),
    heroBanners: z.array(heroBannerSchema).optional(),
    sections: z.array(homeSectionViewSchema).optional(),
    categories: z.array(categorySchema),
    featured: z.array(productSchema),
    nearestWarehouseId: z.string().uuid().nullable().optional(),
  })
  .strict();
export type CatalogHomeView = z.infer<typeof catalogHomeSchema>;

export const pageMetaSchema = z.object({
  nextCursor: z.string().nullable(),
  hasMore: boolean(),
});

function boolean() {
  return z.boolean();
}
