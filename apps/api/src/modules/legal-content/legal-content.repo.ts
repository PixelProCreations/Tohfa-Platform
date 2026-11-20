import type { Executor } from '../../db/pool.js';

export interface LegalRow {
  id: string;
  slug: string;
  language: string;
  version: number;
  title: string;
  body: string;
  created_at: Date;
}

export interface LegalContentRepo {
  getCurrent(db: Executor, slug: string, language: string): Promise<LegalRow | null>;
  /** Serialises concurrent publishes of the same (slug, language) inside the caller's transaction. */
  lock(tx: Executor, slug: string, language: string): Promise<void>;
  insertVersion(tx: Executor, slug: string, language: string, title: string, body: string, userId: string): Promise<LegalRow>;
}

const COLS = 'id, slug, language, version, title, body, created_at';

export const legalContentRepo: LegalContentRepo = {
  async getCurrent(db, slug, language) {
    const res = await db.query<LegalRow>(
      `SELECT ${COLS} FROM legal_content_versions
        WHERE slug = $1 AND language = $2 ORDER BY version DESC LIMIT 1`,
      [slug, language],
    );
    return res.rows[0] ?? null;
  },

  async lock(tx, slug, language) {
    await tx.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`legal:${slug}:${language}`]);
  },

  async insertVersion(tx, slug, language, title, body, userId) {
    const res = await tx.query<LegalRow>(
      `INSERT INTO legal_content_versions (slug, language, version, title, body, created_by)
       SELECT $1, $2, COALESCE(MAX(version), 0) + 1, $3, $4, $5
         FROM legal_content_versions WHERE slug = $1 AND language = $2
       RETURNING ${COLS}`,
      [slug, language, title, body, userId],
    );
    return res.rows[0] as LegalRow;
  },
};
