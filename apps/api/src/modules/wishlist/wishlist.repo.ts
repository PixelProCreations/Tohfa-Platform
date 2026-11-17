/** SQL only. `wishlist_items` (0100): one row per (customer, crop, grade). */
import type { Executor } from '../../db/pool.js';
import type { ProductGrade } from '../catalog/catalog.schema.js';

export interface WishlistRow {
  id: string;
  crop_id: string;
  grade: ProductGrade;
  name: string;
  created_at: Date;
}

/** Bound on one response, a technical limit (a wishlist is a short personal list). */
export const WISHLIST_LIST_LIMIT = 100;

export interface WishlistRepo {
  /** True when the crop exists, is active and not deleted. */
  cropExists(db: Executor, cropId: string): Promise<boolean>;
  /** Idempotent insert; `created` is false when the row already existed. */
  add(db: Executor, customerId: string, cropId: string, grade: ProductGrade): Promise<{ id: string; created: boolean }>;
  findOne(db: Executor, customerId: string, cropId: string, grade: ProductGrade): Promise<WishlistRow | null>;
  list(db: Executor, customerId: string): Promise<WishlistRow[]>;
  /** Idempotent: deleting a row that is not there changes nothing. */
  remove(db: Executor, customerId: string, cropId: string, grade: ProductGrade): Promise<void>;
}

const SELECT = `SELECT w.id, w.crop_id, w.grade::text AS grade, cm.name, w.created_at
                  FROM wishlist_items w
                  JOIN crop_master cm ON cm.id = w.crop_id`;

export const wishlistRepo: WishlistRepo = {
  async cropExists(db, cropId) {
    const res = await db.query(
      `SELECT 1 FROM crop_master WHERE id = $1 AND is_active = true AND deleted_at IS NULL`,
      [cropId],
    );
    return res.rows.length > 0;
  },

  async add(db, customerId, cropId, grade) {
    const inserted = await db.query<{ id: string }>(
      `INSERT INTO wishlist_items (customer_id, crop_id, grade)
       VALUES ($1, $2, $3::produce_grade)
       ON CONFLICT (customer_id, crop_id, grade) DO NOTHING
       RETURNING id`,
      [customerId, cropId, grade],
    );
    if (inserted.rows[0] !== undefined) return { id: inserted.rows[0].id, created: true };
    const existing = await db.query<{ id: string }>(
      `SELECT id FROM wishlist_items WHERE customer_id = $1 AND crop_id = $2 AND grade = $3::produce_grade`,
      [customerId, cropId, grade],
    );
    return { id: existing.rows[0]!.id, created: false };
  },

  async findOne(db, customerId, cropId, grade) {
    const res = await db.query<WishlistRow>(
      `${SELECT} WHERE w.customer_id = $1 AND w.crop_id = $2 AND w.grade = $3::produce_grade`,
      [customerId, cropId, grade],
    );
    return res.rows[0] ?? null;
  },

  async list(db, customerId) {
    const res = await db.query<WishlistRow>(
      `${SELECT} WHERE w.customer_id = $1 ORDER BY w.created_at DESC, w.id DESC LIMIT ${WISHLIST_LIST_LIMIT}`,
      [customerId],
    );
    return res.rows;
  },

  async remove(db, customerId, cropId, grade) {
    await db.query(
      `DELETE FROM wishlist_items WHERE customer_id = $1 AND crop_id = $2 AND grade = $3::produce_grade`,
      [customerId, cropId, grade],
    );
  },
};
