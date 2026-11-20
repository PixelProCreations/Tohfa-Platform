/**
 * Customer reviews. Takes a ResolvedScope, never a Request.
 *  - create: own order only (cross-customer is 404), order must be DELIVERED or PICKED_UP (409
 *    INVALID_STATE_TRANSITION), one review per order (409 CONFLICT, also under a race via the UNIQUE
 *    constraint), every rated line must belong to that order (422).
 *  - BR-16 / BR-97: comments naming a farmer or farm are refused 422.
 *  - product reads are public and anonymised; admin reads carry no farm identity either.
 */
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { buildFarmerRedactor, refuseFarmerIdentity, type FarmerIdentityLookup } from '../customer-support/farmerRedaction.js';
import { reviewsRepo, type ReviewItemRow, type ReviewRow, type ReviewsRepo } from './reviews.repo.js';
import type {
  AdminReview,
  AdminReviews,
  AdminReviewsQuery,
  CreateReviewBody,
  OrderReview,
  ProductReviews,
  ProductReviewsQuery,
  ReviewTag,
} from './reviews.schema.js';

export interface ReviewsService {
  createReview(scope: ResolvedScope, orderId: string, body: CreateReviewBody): Promise<OrderReview>;
  getOrderReview(scope: ResolvedScope, orderId: string): Promise<OrderReview>;
  getProductReviews(cropId: string, query: ProductReviewsQuery): Promise<ProductReviews>;
  listAdmin(query: AdminReviewsQuery): Promise<AdminReviews>;
  getAdmin(reviewId: string): Promise<AdminReview>;
}

/** Order statuses a customer may review (completed orders only). */
const REVIEWABLE = new Set(['DELIVERED', 'PICKED_UP']);

function requireCustomerId(scope: ResolvedScope): string {
  if (scope.customerId === undefined) {
    throw new AppError('FORBIDDEN', { detail: 'Reviews are available to customers only.' });
  }
  return scope.customerId;
}

const notFound = (what: string): AppError => new AppError('NOT_FOUND', { detail: `No ${what} with that id.` });
const alreadyReviewed = (): AppError => new AppError('CONFLICT', { detail: 'This order has already been reviewed.' });

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === '23505';
}

export function createReviewsService(
  deps: {
    repo?: ReviewsRepo;
    db?: Executor;
    transaction?: <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;
    identityLookup?: FarmerIdentityLookup;
  } = {},
): ReviewsService {
  const repo = deps.repo ?? reviewsRepo;
  const db = deps.db ?? pool;
  const transaction = deps.transaction ?? ((fn) => withTransaction(fn));

  function shape(row: ReviewRow, items: ReviewItemRow[]): AdminReview {
    return {
      id: row.id,
      orderId: row.order_id,
      orderNumber: row.order_number,
      customerId: row.customer_id,
      rating: row.rating,
      tags: row.tags as ReviewTag[],
      comment: row.comment,
      items: items
        .filter((i) => i.review_id === row.id)
        .map((i) => ({
          orderItemId: i.order_item_id,
          productId: i.crop_id,
          name: i.name,
          grade: i.grade as OrderReview['items'][number]['grade'],
          rating: i.rating,
          comment: i.comment,
        })),
      createdAt: row.created_at.toISOString(),
    };
  }

  /** Customer shape: the admin shape minus order number and customer id. */
  function ownShape(row: ReviewRow, items: ReviewItemRow[]): OrderReview {
    const { orderNumber: _n, customerId: _c, ...rest } = shape(row, items);
    return rest;
  }

  return {
    async createReview(scope, orderId, body) {
      const customerId = requireCustomerId(scope);
      try {
        return await transaction(async (tx) => {
          const order = await repo.findOwnOrder(tx, customerId, orderId);
          if (order === null) throw notFound('order');
          if (!REVIEWABLE.has(order.status)) {
            throw new AppError('INVALID_STATE_TRANSITION', {
              detail: 'Only a delivered or picked-up order can be reviewed.',
            });
          }
          if ((await repo.findByOrder(tx, orderId, customerId)) !== null) throw alreadyReviewed();

          const lines = new Set((await repo.listOrderLines(tx, orderId)).map((l) => l.id));
          const seen = new Set<string>();
          body.items.forEach((item, index) => {
            if (!lines.has(item.orderItemId) || seen.has(item.orderItemId)) {
              throw new AppError('VALIDATION_FAILED', {
                detail: 'Each rated item must be a distinct line of this order.',
                errors: { [`body.items.${index}.orderItemId`]: ['Not a distinct line of this order.'] },
              });
            }
            seen.add(item.orderItemId);
          });

          const redactor = await buildFarmerRedactor(tx, customerId, [orderId], deps.identityLookup);
          const texts: Record<string, string | undefined> = { 'body.comment': body.comment };
          body.items.forEach((item, index) => {
            texts[`body.items.${index}.comment`] = item.comment;
          });
          refuseFarmerIdentity(redactor, texts);

          const reviewId = await repo.insertReview(tx, {
            orderId,
            customerId,
            rating: body.rating,
            tags: body.tags,
            comment: body.comment ?? null,
          });
          await repo.insertReviewItems(
            tx,
            reviewId,
            body.items.map((i) => ({ orderItemId: i.orderItemId, rating: i.rating, comment: i.comment ?? null })),
          );
          const row = await repo.findById(tx, reviewId);
          return ownShape(row!, await repo.listItems(tx, [reviewId]));
        });
      } catch (error) {
        if (isUniqueViolation(error)) throw alreadyReviewed();
        throw error;
      }
    },

    async getOrderReview(scope, orderId) {
      const customerId = requireCustomerId(scope);
      const row = await repo.findByOrder(db, orderId, customerId);
      if (row === null) throw notFound('review for that order');
      return ownShape(row, await repo.listItems(db, [row.id]));
    },

    async getProductReviews(cropId, query) {
      if (!(await repo.cropExists(db, cropId))) throw notFound('product');
      const grade = query.grade ?? null;
      const [summary, rows] = await Promise.all([
        repo.productSummary(db, cropId, grade),
        repo.listProductReviews(db, cropId, query),
      ]);
      const d = summary.distribution;
      return {
        summary: {
          averageRating: summary.average,
          ratingCount: summary.count,
          distribution: { '1': d[1] ?? 0, '2': d[2] ?? 0, '3': d[3] ?? 0, '4': d[4] ?? 0, '5': d[5] ?? 0 },
        },
        items: rows.map((r) => ({ id: r.id, rating: r.rating, comment: r.comment, createdAt: r.created_at.toISOString() })),
        total: summary.count,
        page: query.page,
        limit: query.limit,
      };
    },

    async listAdmin(query) {
      const { rows, total } = await repo.listAdmin(db, query);
      const items = await repo.listItems(db, rows.map((r) => r.id));
      return { items: rows.map((r) => shape(r, items)), total, page: query.page, limit: query.limit };
    },

    async getAdmin(reviewId) {
      const row = await repo.findById(db, reviewId);
      if (row === null) throw notFound('review');
      return shape(row, await repo.listItems(db, [row.id]));
    },
  };
}

export const reviewsService = createReviewsService();
