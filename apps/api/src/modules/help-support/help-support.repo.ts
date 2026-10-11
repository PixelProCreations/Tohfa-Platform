/**
 * SQL only. Every function takes an Executor so the service can put the write
 * and its audit row in one transaction.
 *
 * `HELP_LIST_LIMIT` is a technical bound, not a business threshold: help
 * content is a small curated set, so lists are not paginated; the bound only
 * stops a pathological table from producing an unbounded response.
 */
import type { Executor } from '../../db/pool.js';
import type { ManagerArticleResponse, ReaderArticleResponse } from './help-support.schema.js';

export const HELP_LIST_LIMIT = 500;

export const CONTACT_PHONE_KEY = 'help.contact.phone';
export const CONTACT_EMAIL_KEY = 'help.contact.email';

interface ArticleRow {
  id: string;
  category: string;
  locale: 'en' | 'ta';
  title: string;
  body: string;
  sort_order: number;
  is_published: boolean;
  created_at: Date;
  updated_at: Date | null;
}

const COLUMNS = 'id, category, locale, title, body, sort_order, is_published, created_at, updated_at';

function toManager(row: ArticleRow): ManagerArticleResponse {
  return {
    id: row.id,
    category: row.category,
    locale: row.locale,
    title: row.title,
    body: row.body,
    sortOrder: row.sort_order,
    isPublished: row.is_published,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at === null ? null : row.updated_at.toISOString(),
  };
}

/** Allow-list for readers: no draft flag, no timestamps, no author. */
function toReader(row: ArticleRow): ReaderArticleResponse {
  return {
    id: row.id,
    category: row.category,
    locale: row.locale,
    title: row.title,
    body: row.body,
    sortOrder: row.sort_order,
  };
}

export interface ArticleFields {
  category: string;
  locale: 'en' | 'ta';
  title: string;
  body: string;
  sortOrder: number;
}

export const helpSupportRepo = {
  async listPublished(
    db: Executor,
    filter: { locale: 'en' | 'ta'; category?: string | undefined },
  ): Promise<ReaderArticleResponse[]> {
    const result = await db.query<ArticleRow>(
      `SELECT ${COLUMNS}
         FROM help_articles
        WHERE is_published
          AND locale = $1
          AND ($2::text IS NULL OR category = $2)
        ORDER BY category COLLATE "C", sort_order, id
        LIMIT ${HELP_LIST_LIMIT}`,
      [filter.locale, filter.category ?? null],
    );
    return result.rows.map(toReader);
  },

  async listPublishedCategories(db: Executor, locale: 'en' | 'ta'): Promise<string[]> {
    const result = await db.query<{ category: string }>(
      `SELECT category
         FROM help_articles
        WHERE is_published AND locale = $1
        GROUP BY category
        ORDER BY category COLLATE "C"
        LIMIT ${HELP_LIST_LIMIT}`,
      [locale],
    );
    return result.rows.map((row) => row.category);
  },

  async listAll(
    db: Executor,
    filter: { locale?: 'en' | 'ta' | undefined; category?: string | undefined; isPublished?: boolean | undefined },
  ): Promise<ManagerArticleResponse[]> {
    const result = await db.query<ArticleRow>(
      `SELECT ${COLUMNS}
         FROM help_articles
        WHERE ($1::text IS NULL OR locale = $1)
          AND ($2::text IS NULL OR category = $2)
          AND ($3::boolean IS NULL OR is_published = $3)
        ORDER BY category COLLATE "C", sort_order, id
        LIMIT ${HELP_LIST_LIMIT}`,
      [filter.locale ?? null, filter.category ?? null, filter.isPublished ?? null],
    );
    return result.rows.map(toManager);
  },

  async findForUpdate(db: Executor, id: string): Promise<ManagerArticleResponse | null> {
    const result = await db.query<ArticleRow>(`SELECT ${COLUMNS} FROM help_articles WHERE id = $1 FOR UPDATE`, [id]);
    const row = result.rows[0];
    return row === undefined ? null : toManager(row);
  },

  async insert(db: Executor, fields: ArticleFields, userId: string): Promise<ManagerArticleResponse> {
    const result = await db.query<ArticleRow>(
      `INSERT INTO help_articles (category, locale, title, body, sort_order, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $6)
       RETURNING ${COLUMNS}`,
      [fields.category, fields.locale, fields.title, fields.body, fields.sortOrder, userId],
    );
    return toManager(result.rows[0]!);
  },

  async update(db: Executor, id: string, fields: Partial<ArticleFields>, userId: string): Promise<ManagerArticleResponse> {
    const result = await db.query<ArticleRow>(
      `UPDATE help_articles
          SET category   = COALESCE($2, category),
              locale     = COALESCE($3, locale),
              title      = COALESCE($4, title),
              body       = COALESCE($5, body),
              sort_order = COALESCE($6, sort_order),
              updated_by = $7
        WHERE id = $1
        RETURNING ${COLUMNS}`,
      [id, fields.category ?? null, fields.locale ?? null, fields.title ?? null, fields.body ?? null, fields.sortOrder ?? null, userId],
    );
    return toManager(result.rows[0]!);
  },

  async setPublished(db: Executor, id: string, isPublished: boolean, userId: string): Promise<ManagerArticleResponse> {
    const result = await db.query<ArticleRow>(
      `UPDATE help_articles SET is_published = $2, updated_by = $3 WHERE id = $1 RETURNING ${COLUMNS}`,
      [id, isPublished, userId],
    );
    return toManager(result.rows[0]!);
  },

  /** A JSON null, an empty string or anything that is not a string reads as "not configured". */
  async getContact(db: Executor): Promise<{ phone: string | null; email: string | null }> {
    const result = await db.query<{ key: string; value: unknown }>(
      'SELECT key, value FROM system_config WHERE key = ANY($1::text[])',
      [[CONTACT_PHONE_KEY, CONTACT_EMAIL_KEY]],
    );
    const byKey = new Map(result.rows.map((row) => [row.key, row.value]));
    const asChannel = (value: unknown): string | null =>
      typeof value === 'string' && value.trim() !== '' ? value : null;
    return { phone: asChannel(byKey.get(CONTACT_PHONE_KEY)), email: asChannel(byKey.get(CONTACT_EMAIL_KEY)) };
  },

  /** Upsert, so a deleted config row can never turn a save into a silent no-op. */
  async setContactChannel(db: Executor, key: string, value: string | null, userId: string): Promise<void> {
    await db.query(
      `INSERT INTO system_config (key, value, data_type, updated_by)
       VALUES ($1, $2::jsonb, 'string', $3)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by`,
      [key, JSON.stringify(value), userId],
    );
  },
};
