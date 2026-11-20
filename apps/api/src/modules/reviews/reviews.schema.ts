/**
 * Customer reviews (`POST/GET /v1/orders/{id}/review`, `GET /v1/catalog/products/{id}/reviews`,
 * `GET /v1/admin/reviews`): Zod schemas, `.strict()`, matching docs/openapi.yaml.
 *
 * Every response shape is an allow-list. No shape carries a farmer, farm, batch or village (BR-16);
 * the public product shapes also carry no customer, order or order-line identity (anonymised).
 */
import { z } from 'zod';
import { productGradeEnum } from '../catalog/catalog.schema.js';

export const REVIEW_COMMENT_MAX = 1000;
export const REVIEW_ITEM_COMMENT_MAX = 500;
/** Technical bound on lines per request, not a business threshold (an order has few lines). */
export const REVIEW_MAX_ITEMS = 100;

/**
 * Aspect tags. UNCONFIRMED implementer proposal (no requirement lists them); deliberately has no
 * farm or farmer aspect. Mirrors the CHECK on order_reviews.tags (0101).
 */
export const reviewTagEnum = z.enum(['FRESHNESS', 'QUALITY', 'PACKAGING', 'DELIVERY', 'VALUE_FOR_MONEY', 'TASTE', 'SERVICE']);
export type ReviewTag = z.infer<typeof reviewTagEnum>;

const rating = z.number().int().min(1).max(5);

export const orderIdParams = z.object({ id: z.string().uuid() }).strict();

export const createReviewBody = z
  .object({
    rating,
    tags: z.array(reviewTagEnum).max(7).default([]).refine((t) => new Set(t).size === t.length, { message: 'Tags must be unique.' }),
    comment: z.string().trim().min(1).max(REVIEW_COMMENT_MAX).optional(),
    items: z
      .array(
        z
          .object({
            orderItemId: z.string().uuid(),
            rating,
            comment: z.string().trim().min(1).max(REVIEW_ITEM_COMMENT_MAX).optional(),
          })
          .strict(),
      )
      .max(REVIEW_MAX_ITEMS)
      .default([]),
  })
  .strict();
export type CreateReviewBody = z.infer<typeof createReviewBody>;

export const orderReviewItemResponse = z
  .object({
    orderItemId: z.string().uuid(),
    productId: z.string().uuid(),
    name: z.string(),
    grade: productGradeEnum.or(z.literal('REJECT')),
    rating,
    comment: z.string().nullable(),
  })
  .strict();

export const orderReviewResponse = z
  .object({
    id: z.string().uuid(),
    orderId: z.string().uuid(),
    rating,
    tags: z.array(reviewTagEnum),
    comment: z.string().nullable(),
    items: z.array(orderReviewItemResponse),
    createdAt: z.string(),
  })
  .strict();
export type OrderReview = z.infer<typeof orderReviewResponse>;

export const productIdParams = z.object({ id: z.string().uuid() }).strict();

export const productReviewsQuery = z
  .object({
    grade: productGradeEnum.optional(),
    page: z.coerce.number().int().min(1).max(10000).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();
export type ProductReviewsQuery = z.infer<typeof productReviewsQuery>;

/** Anonymised: no customer, order, order line or farm reference; just the rating and words. */
export const productReviewResponse = z
  .object({
    id: z.string().uuid(),
    rating,
    comment: z.string().nullable(),
    createdAt: z.string(),
  })
  .strict();

export const productReviewsResponse = z
  .object({
    summary: z
      .object({
        /** One decimal place as a string, e.g. "4.3"; null when there are no ratings yet. */
        averageRating: z.string().nullable(),
        ratingCount: z.number().int(),
        distribution: z.object({ '1': z.number().int(), '2': z.number().int(), '3': z.number().int(), '4': z.number().int(), '5': z.number().int() }).strict(),
      })
      .strict(),
    items: z.array(productReviewResponse),
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int(),
  })
  .strict();
export type ProductReviews = z.infer<typeof productReviewsResponse>;

export const adminReviewsQuery = z
  .object({
    rating: z.coerce.number().int().min(1).max(5).optional(),
    orderId: z.string().uuid().optional(),
    page: z.coerce.number().int().min(1).max(10000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export type AdminReviewsQuery = z.infer<typeof adminReviewsQuery>;

export const adminReviewResponse = orderReviewResponse
  .extend({ orderNumber: z.string(), customerId: z.string().uuid() })
  .strict();
export type AdminReview = z.infer<typeof adminReviewResponse>;

export const adminReviewsResponse = z
  .object({
    items: z.array(adminReviewResponse),
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int(),
  })
  .strict();
export type AdminReviews = z.infer<typeof adminReviewsResponse>;
