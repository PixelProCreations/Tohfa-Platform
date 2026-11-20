import type { Executor } from '../../db/pool.js';

export interface RecentSearchRow {
  query: string;
  searched_at: Date;
}

export interface TrendingQueryRow {
  query: string;
  searchers: number;
}

/** The three BR-151 system_config values; null when a key is missing. */
export interface SearchConfigRaw {
  recentMax: unknown;
  trendingMinSearchers: unknown;
  trendingWindowDays: unknown;
}

export interface CatalogSearchRepo {
  getConfig(db: Executor): Promise<SearchConfigRaw>;
  listRecent(db: Executor, customerId: string, limit: number): Promise<RecentSearchRow[]>;
  /** Upsert by (customer, normalized query); returns the stored row. */
  upsertRecent(db: Executor, customerId: string, query: string, normalized: string): Promise<RecentSearchRow>;
  /** Delete everything beyond the newest `keep` rows of this customer. */
  pruneRecent(db: Executor, customerId: string, keep: number): Promise<void>;
  deleteRecent(db: Executor, customerId: string, normalized?: string): Promise<void>;
  /** Queries searched by >= minSearchers DISTINCT customers in the window. Never returns ids. */
  trendingQueries(db: Executor, windowDays: number, minSearchers: number, limit: number): Promise<TrendingQueryRow[]>;
  /** Crop ids most ordered (by qty) in the window, excluding cancelled orders. */
  mostOrderedCropIds(db: Executor, windowDays: number, limit: number): Promise<string[]>;
}

export const catalogSearchRepo: CatalogSearchRepo = {
  async getConfig(db) {
    const res = await db.query<{ key: string; value: unknown }>(
      `SELECT key, value FROM system_config
        WHERE key IN ('catalog.recent_searches_max', 'catalog.trending_min_searchers', 'catalog.trending_window_days')`,
    );
    const byKey = new Map(res.rows.map((r) => [r.key, r.value]));
    return {
      recentMax: byKey.get('catalog.recent_searches_max') ?? null,
      trendingMinSearchers: byKey.get('catalog.trending_min_searchers') ?? null,
      trendingWindowDays: byKey.get('catalog.trending_window_days') ?? null,
    };
  },

  async listRecent(db, customerId, limit) {
    const res = await db.query<RecentSearchRow>(
      `SELECT query, searched_at
         FROM customer_recent_searches
        WHERE customer_id = $1
        ORDER BY searched_at DESC, id DESC
        LIMIT $2`,
      [customerId, limit],
    );
    return res.rows;
  },

  async upsertRecent(db, customerId, query, normalized) {
    const res = await db.query<RecentSearchRow>(
      `INSERT INTO customer_recent_searches (customer_id, query, normalized_query)
       VALUES ($1, $2, $3)
       ON CONFLICT (customer_id, normalized_query) DO UPDATE
         SET query = EXCLUDED.query, searched_at = now()
       RETURNING query, searched_at`,
      [customerId, query, normalized],
    );
    return res.rows[0]!;
  },

  async pruneRecent(db, customerId, keep) {
    await db.query(
      `DELETE FROM customer_recent_searches
        WHERE customer_id = $1
          AND id NOT IN (
            SELECT id FROM customer_recent_searches
             WHERE customer_id = $1
             ORDER BY searched_at DESC, id DESC
             LIMIT $2
          )`,
      [customerId, keep],
    );
  },

  async deleteRecent(db, customerId, normalized) {
    if (normalized === undefined) {
      await db.query(`DELETE FROM customer_recent_searches WHERE customer_id = $1`, [customerId]);
      return;
    }
    await db.query(
      `DELETE FROM customer_recent_searches WHERE customer_id = $1 AND normalized_query = $2`,
      [customerId, normalized],
    );
  },

  async trendingQueries(db, windowDays, minSearchers, limit) {
    const res = await db.query<{ query: string; searchers: string }>(
      `SELECT normalized_query AS query, COUNT(DISTINCT customer_id)::text AS searchers
         FROM customer_recent_searches
        WHERE searched_at >= now() - make_interval(days => $1::int)
        GROUP BY normalized_query
       HAVING COUNT(DISTINCT customer_id) >= $2::int
        ORDER BY COUNT(DISTINCT customer_id) DESC, normalized_query ASC
        LIMIT $3`,
      [windowDays, minSearchers, limit],
    );
    return res.rows.map((r) => ({ query: r.query, searchers: Number(r.searchers) }));
  },

  async mostOrderedCropIds(db, windowDays, limit) {
    const res = await db.query<{ crop_id: string }>(
      `SELECT oi.crop_id
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
        WHERE o.created_at >= now() - make_interval(days => $1::int)
          AND o.status NOT IN ('CANCELLED', 'PENDING_PAYMENT')
          AND oi.status <> 'CANCELLED'
        GROUP BY oi.crop_id
        ORDER BY SUM(oi.qty_kg) DESC, oi.crop_id ASC
        LIMIT $2`,
      [windowDays, limit],
    );
    return res.rows.map((r) => r.crop_id);
  },
};
