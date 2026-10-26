/**
 * Tier threshold configuration (BR-04, BR-111). SQL only.
 *
 * `rating_tier_config` is versioned by `effective_from`: readers (farm-ratings.repo.ts
 * `resolveTierForScore`, admin-farmers.repo.ts, the audits tier lookup) use the generation with the
 * latest `effective_from <= CURRENT_DATE`. A write here is a generation effective today; rows of
 * earlier days are never touched. Today's rows are upserted (UNIQUE (tier_code, effective_from)),
 * so a second change on the same day replaces today's generation.
 */
import type { Executor } from '../../db/pool.js';

export interface TierRow {
  code: string;
  label: string;
  minScore: number;
  maxScore: number | null;
  colorHex: string | null;
  sortOrder: number;
}

export interface Generation {
  /** YYYY-MM-DD, or null when the table holds no generation effective today or earlier. */
  effectiveFrom: string | null;
  tiers: TierRow[];
}

export interface NewTierRow {
  code: string;
  label: string;
  minScore: number;
  maxScore: number | null;
  colorHex: string | null;
  sortOrder: number;
}

export interface TierConfigRepo {
  /** Serialise concurrent writers; readers are not blocked. */
  lock(db: Executor): Promise<void>;
  currentGeneration(db: Executor): Promise<Generation>;
  /** Upsert the generation effective today. */
  writeTodaysGeneration(db: Executor, rows: NewTierRow[], setBy: string): Promise<void>;
}

export const tierConfigRepo: TierConfigRepo = {
  async lock(db) {
    await db.query('LOCK TABLE rating_tier_config IN SHARE ROW EXCLUSIVE MODE');
  },

  async currentGeneration(db) {
    const gen = await db.query<{ gen: string | null }>(
      `SELECT to_char(MAX(effective_from), 'YYYY-MM-DD') AS gen FROM rating_tier_config WHERE effective_from <= CURRENT_DATE`,
    );
    const effectiveFrom = gen.rows[0]?.gen ?? null;
    if (effectiveFrom === null) return { effectiveFrom, tiers: [] };
    const rows = await db.query<TierRow>(
      `SELECT tier_code AS code, label, min_score::float8 AS "minScore", max_score::float8 AS "maxScore",
              color_hex AS "colorHex", sort_order::int AS "sortOrder"
         FROM rating_tier_config
        WHERE effective_from = $1::date
        ORDER BY sort_order, tier_code`,
      [effectiveFrom],
    );
    return { effectiveFrom, tiers: rows.rows };
  },

  async writeTodaysGeneration(db, rows, setBy) {
    for (const row of rows) {
      await db.query(
        `INSERT INTO rating_tier_config (tier_code, label, min_score, max_score, color_hex, sort_order, effective_from, set_by)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, $7)
         ON CONFLICT (tier_code, effective_from) DO UPDATE SET
           label = EXCLUDED.label,
           min_score = EXCLUDED.min_score,
           max_score = EXCLUDED.max_score,
           color_hex = EXCLUDED.color_hex,
           sort_order = EXCLUDED.sort_order,
           set_by = EXCLUDED.set_by,
           updated_at = now()`,
        [row.code, row.label, row.minScore, row.maxScore, row.colorHex, row.sortOrder, setBy],
      );
    }
  },
};
