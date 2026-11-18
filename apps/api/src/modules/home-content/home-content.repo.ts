import type { Executor } from '../../db/pool.js';
import type { BannerTargetType, SectionTargetType } from './home-content.schema.js';

export interface BannerRow {
  id: string;
  title: string;
  image_url: string;
  target_type: BannerTargetType;
  target_category_id: string | null;
  target_product_id: string | null;
  target_url: string | null;
  sort_order: number;
  starts_at: Date | null;
  ends_at: Date | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date | null;
}

export interface SectionRow {
  id: string;
  title: string;
  subtitle: string | null;
  target_type: SectionTargetType;
  target_category_id: string | null;
  product_ids: string[];
  max_items: number;
  sort_order: number;
  starts_at: Date | null;
  ends_at: Date | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date | null;
}

/** The mutable columns, written whole on create and on (merged) update. */
export type BannerFields = Omit<BannerRow, 'id' | 'created_at' | 'updated_at'>;
export type SectionFields = Omit<SectionRow, 'id' | 'created_at' | 'updated_at'>;

/** What GET /catalog/home reads. Narrow so the catalog service can be tested with a fake. */
export interface HomeContentSource {
  listActiveBanners(db: Executor): Promise<BannerRow[]>;
  listActiveSections(db: Executor): Promise<SectionRow[]>;
}

export interface HomeContentRepo extends HomeContentSource {
  listBanners(db: Executor): Promise<BannerRow[]>;
  getBanner(db: Executor, id: string): Promise<BannerRow | null>;
  insertBanner(db: Executor, f: BannerFields, actorId: string): Promise<BannerRow>;
  updateBanner(db: Executor, id: string, f: BannerFields, actorId: string): Promise<BannerRow>;
  softDeleteBanner(db: Executor, id: string, actorId: string): Promise<void>;
  listSections(db: Executor): Promise<SectionRow[]>;
  getSection(db: Executor, id: string): Promise<SectionRow | null>;
  insertSection(db: Executor, f: SectionFields, actorId: string): Promise<SectionRow>;
  updateSection(db: Executor, id: string, f: SectionFields, actorId: string): Promise<SectionRow>;
  softDeleteSection(db: Executor, id: string, actorId: string): Promise<void>;
  categoryExists(db: Executor, id: string): Promise<boolean>;
  /** The subset of `ids` that are live crop_master rows. */
  existingProductIds(db: Executor, ids: string[]): Promise<string[]>;
}

const BANNER_COLS = `id, title, image_url, target_type, target_category_id, target_product_id, target_url,
  sort_order, starts_at, ends_at, is_active, created_at, updated_at`;
const SECTION_COLS = `id, title, subtitle, target_type, target_category_id, product_ids::text[] AS product_ids,
  max_items, sort_order, starts_at, ends_at, is_active, created_at, updated_at`;
const LIVE = `deleted_at IS NULL AND is_active AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at > now())`;

function bannerParams(f: BannerFields): unknown[] {
  return [f.title, f.image_url, f.target_type, f.target_category_id, f.target_product_id, f.target_url,
    f.sort_order, f.starts_at, f.ends_at, f.is_active];
}
function sectionParams(f: SectionFields): unknown[] {
  return [f.title, f.subtitle, f.target_type, f.target_category_id, f.product_ids, f.max_items,
    f.sort_order, f.starts_at, f.ends_at, f.is_active];
}

export const homeContentRepo: HomeContentRepo = {
  async listActiveBanners(db) {
    const r = await db.query<BannerRow>(`SELECT ${BANNER_COLS} FROM home_banners WHERE ${LIVE} ORDER BY sort_order, created_at, id`);
    return r.rows;
  },
  async listActiveSections(db) {
    const r = await db.query<SectionRow>(`SELECT ${SECTION_COLS} FROM home_sections WHERE ${LIVE} ORDER BY sort_order, created_at, id`);
    return r.rows;
  },
  async listBanners(db) {
    const r = await db.query<BannerRow>(`SELECT ${BANNER_COLS} FROM home_banners WHERE deleted_at IS NULL ORDER BY sort_order, created_at, id`);
    return r.rows;
  },
  async getBanner(db, id) {
    const r = await db.query<BannerRow>(`SELECT ${BANNER_COLS} FROM home_banners WHERE id = $1 AND deleted_at IS NULL`, [id]);
    return r.rows[0] ?? null;
  },
  async insertBanner(db, f, actorId) {
    const r = await db.query<BannerRow>(
      `INSERT INTO home_banners (title, image_url, target_type, target_category_id, target_product_id, target_url,
         sort_order, starts_at, ends_at, is_active, created_by, updated_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11) RETURNING ${BANNER_COLS}`,
      [...bannerParams(f), actorId],
    );
    return r.rows[0]!;
  },
  async updateBanner(db, id, f, actorId) {
    const r = await db.query<BannerRow>(
      `UPDATE home_banners SET title=$1, image_url=$2, target_type=$3, target_category_id=$4, target_product_id=$5,
         target_url=$6, sort_order=$7, starts_at=$8, ends_at=$9, is_active=$10, updated_by=$11, updated_at=now()
       WHERE id=$12 AND deleted_at IS NULL RETURNING ${BANNER_COLS}`,
      [...bannerParams(f), actorId, id],
    );
    return r.rows[0]!;
  },
  async softDeleteBanner(db, id, actorId) {
    await db.query(`UPDATE home_banners SET deleted_at = now(), updated_at = now(), updated_by = $2 WHERE id = $1 AND deleted_at IS NULL`, [id, actorId]);
  },
  async listSections(db) {
    const r = await db.query<SectionRow>(`SELECT ${SECTION_COLS} FROM home_sections WHERE deleted_at IS NULL ORDER BY sort_order, created_at, id`);
    return r.rows;
  },
  async getSection(db, id) {
    const r = await db.query<SectionRow>(`SELECT ${SECTION_COLS} FROM home_sections WHERE id = $1 AND deleted_at IS NULL`, [id]);
    return r.rows[0] ?? null;
  },
  async insertSection(db, f, actorId) {
    const r = await db.query<SectionRow>(
      `INSERT INTO home_sections (title, subtitle, target_type, target_category_id, product_ids, max_items,
         sort_order, starts_at, ends_at, is_active, created_by, updated_by)
       VALUES ($1,$2,$3,$4,$5::uuid[],$6,$7,$8,$9,$10,$11,$11) RETURNING ${SECTION_COLS}`,
      [...sectionParams(f), actorId],
    );
    return r.rows[0]!;
  },
  async updateSection(db, id, f, actorId) {
    const r = await db.query<SectionRow>(
      `UPDATE home_sections SET title=$1, subtitle=$2, target_type=$3, target_category_id=$4, product_ids=$5::uuid[],
         max_items=$6, sort_order=$7, starts_at=$8, ends_at=$9, is_active=$10, updated_by=$11, updated_at=now()
       WHERE id=$12 AND deleted_at IS NULL RETURNING ${SECTION_COLS}`,
      [...sectionParams(f), actorId, id],
    );
    return r.rows[0]!;
  },
  async softDeleteSection(db, id, actorId) {
    await db.query(`UPDATE home_sections SET deleted_at = now(), updated_at = now(), updated_by = $2 WHERE id = $1 AND deleted_at IS NULL`, [id, actorId]);
  },
  async categoryExists(db, id) {
    const r = await db.query(`SELECT 1 FROM categories WHERE id = $1`, [id]);
    return (r.rowCount ?? 0) > 0;
  },
  async existingProductIds(db, ids) {
    if (ids.length === 0) return [];
    const r = await db.query<{ id: string }>(
      `SELECT id::text AS id FROM crop_master WHERE id = ANY($1::uuid[]) AND deleted_at IS NULL`,
      [ids],
    );
    return r.rows.map((x) => x.id);
  },
};
