/** SQL only. `order_reviews` / `order_review_items` (0101). */
import type { Executor } from '../../db/pool.js';
import type { AdminReviewsQuery, ProductReviewsQuery } from './reviews.schema.js';

export interface OrderForReview {
  id: string;
  status: string;
}

export interface OrderLine {
  id: string;
}

export interface ReviewRow {
  id: string;
  order_id: string;
  order_number: string;
  customer_id: string;
  rating: number;
  tags: string[];
  comment: string | null;
  created_at: Date;
}

export interface ReviewItemRow {
  review_id: string;
  order_item_id: string;
  crop_id: string;
  name: string;
  grade: string;
  rating: number;
  comment: string | null;
}

export interface ProductReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  created_at: Date;
}

export interface ReviewsRepo {
  /** Own order only: a cross-customer id finds nothing (404, never 403). */
  findOwnOrder(db: Executor, customerId: string, orderId: string): Promise<OrderForReview | null>;
  listOrderLines(db: Executor, orderId: string): Promise<OrderLine[]>;
  insertReview(
    db: Executor,
    input: { orderId: string; customerId: string; rating: number; tags: string[]; comment: string | null },
  ): Promise<string>;
  insertReviewItems(
    db: Executor,
    reviewId: string,
    items: Array<{ orderItemId: string; rating: number; comment: string | null }>,
  ): Promise<void>;
  /** BR-187: always the caller's own customer id; no unscoped variant (fail closed). */
  findByOrder(db: Executor, orderId: string, customerId: string): Promise<ReviewRow | null>;
  findById(db: Executor, reviewId: string): Promise<ReviewRow | null>;
  listItems(db: Executor, reviewIds: string[]): Promise<ReviewItemRow[]>;
  listAdmin(db: Executor, query: AdminReviewsQuery): Promise<{ rows: ReviewRow[]; total: number }>;
  /** Item-level ratings of one product (crop), optionally one grade. */
  productSummary(
    db: Executor,
    cropId: string,
    grade: string | null,
  ): Promise<{ count: number; average: string | null; distribution: Record<number, number> }>;
  listProductReviews(
    db: Executor,
    cropId: string,
    query: ProductReviewsQuery,
  ): Promise<ProductReviewRow[]>;
  cropExists(db: Executor, cropId: string): Promise<boolean>;
}

const REVIEW_COLUMNS = `r.id, r.order_id, o.order_number, r.customer_id, r.rating, r.tags, r.comment, r.created_at`;
const REVIEW_FROM = `FROM order_reviews r JOIN orders o ON o.id = r.order_id`;

export const reviewsRepo: ReviewsRepo = {
  async findOwnOrder(db, customerId, orderId) {
    const res = await db.query<{ id: string; status: string }>(
      `SELECT id, status::text AS status FROM orders WHERE id = $1 AND customer_id = $2`,
      [orderId, customerId],
    );
    return res.rows[0] ?? null;
  },

  async listOrderLines(db, orderId) {
    const res = await db.query<{ id: string }>(`SELECT id FROM order_items WHERE order_id = $1`, [orderId]);
    return res.rows;
  },

  async insertReview(db, input) {
    const res = await db.query<{ id: string }>(
      `INSERT INTO order_reviews (order_id, customer_id, rating, tags, comment)
       VALUES ($1, $2, $3, $4::text[], $5)
       RETURNING id`,
      [input.orderId, input.customerId, input.rating, input.tags, input.comment],
    );
    return res.rows[0]!.id;
  },

  async insertReviewItems(db, reviewId, items) {
    for (const item of items) {
      await db.query(
        `INSERT INTO order_review_items (review_id, order_item_id, rating, comment) VALUES ($1, $2, $3, $4)`,
        [reviewId, item.orderItemId, item.rating, item.comment],
      );
    }
  },

  async findByOrder(db, orderId, customerId) {
    if (!customerId) return null;
    const res = await db.query<ReviewRow>(
      `SELECT ${REVIEW_COLUMNS} ${REVIEW_FROM} WHERE r.order_id = $1 AND r.customer_id = $2`,
      [orderId, customerId],
    );
    return res.rows[0] ?? null;
  },

  async findById(db, reviewId) {
    const res = await db.query<ReviewRow>(`SELECT ${REVIEW_COLUMNS} ${REVIEW_FROM} WHERE r.id = $1`, [reviewId]);
    return res.rows[0] ?? null;
  },

  async listItems(db, reviewIds) {
    if (reviewIds.length === 0) return [];
    const res = await db.query<ReviewItemRow>(
      `SELECT ri.review_id, ri.order_item_id, oi.crop_id, cm.name, oi.grade::text AS grade, ri.rating, ri.comment
         FROM order_review_items ri
         JOIN order_items oi ON oi.id = ri.order_item_id
         JOIN crop_master cm ON cm.id = oi.crop_id
        WHERE ri.review_id = ANY($1::uuid[])
        ORDER BY ri.created_at, ri.id`,
      [reviewIds],
    );
    return res.rows;
  },

  async listAdmin(db, { rating, orderId, page, limit }) {
    const where = `WHERE ($1::int IS NULL OR r.rating = $1) AND ($2::uuid IS NULL OR r.order_id = $2)`;
    const count = await db.query<{ total: number }>(
      `SELECT count(*)::int AS total ${REVIEW_FROM} ${where}`,
      [rating ?? null, orderId ?? null],
    );
    const res = await db.query<ReviewRow>(
      `SELECT ${REVIEW_COLUMNS} ${REVIEW_FROM} ${where}
        ORDER BY r.created_at DESC, r.id DESC LIMIT $3 OFFSET $4`,
      [rating ?? null, orderId ?? null, limit, (page - 1) * limit],
    );
    return { rows: res.rows, total: count.rows[0]?.total ?? 0 };
  },

  async productSummary(db, cropId, grade) {
    const res = await db.query<{ rating: number; n: number }>(
      `SELECT ri.rating::int AS rating, count(*)::int AS n
         FROM order_review_items ri
         JOIN order_items oi ON oi.id = ri.order_item_id
        WHERE oi.crop_id = $1 AND ($2::text IS NULL OR oi.grade::text = $2)
        GROUP BY ri.rating`,
      [cropId, grade],
    );
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let count = 0;
    let sum = 0;
    for (const row of res.rows) {
      distribution[row.rating] = row.n;
      count += row.n;
      sum += row.rating * row.n;
    }
    return { count, average: count === 0 ? null : (sum / count).toFixed(1), distribution };
  },

  async listProductReviews(db, cropId, { grade, page, limit }) {
    const res = await db.query<ProductReviewRow>(
      `SELECT ri.id, ri.rating::int AS rating, ri.comment, ri.created_at
         FROM order_review_items ri
         JOIN order_items oi ON oi.id = ri.order_item_id
        WHERE oi.crop_id = $1 AND ($2::text IS NULL OR oi.grade::text = $2)
        ORDER BY ri.created_at DESC, ri.id DESC
        LIMIT $3 OFFSET $4`,
      [cropId, grade ?? null, limit, (page - 1) * limit],
    );
    return res.rows;
  },

  async cropExists(db, cropId) {
    const res = await db.query(`SELECT 1 FROM crop_master WHERE id = $1 AND deleted_at IS NULL`, [cropId]);
    return res.rows.length > 0;
  },
};
