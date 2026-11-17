/**
 * Catalog search extras (BR-151): suggestions, per-customer recent searches, k-anonymous trending.
 *
 * Farm-anonymous (BR-16): suggestions carry only {type, id, name} built field by field; trending
 * products go through the catalog's allow-list serializer. Trending never returns a customer id,
 * and a query only trends once K distinct customers searched it, so one person's search text
 * (which can be personal) is never broadcast.
 */
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { catalogRepo, type CatalogRepo } from '../catalog/catalog.repo.js';
import { serializeProduct } from '../catalog/catalog.service.js';
import type { ProductView } from '../catalog/catalog.schema.js';
import { catalogSearchRepo, type CatalogSearchRepo } from './catalog-search.repo.js';
import type {
  RecentSearch,
  RecentSearchesResponse,
  SearchSuggestion,
  SuggestionsQuery,
  SuggestionsResponse,
  TrendingQuery,
  TrendingResponse,
} from './catalog-search.schema.js';

/** lower(trim(q)) with internal whitespace runs collapsed: the dedupe key. */
export function normalizeSearchQuery(q: string): string {
  return q.trim().replace(/\s+/g, ' ').toLowerCase();
}

function positiveInt(key: string, value: unknown): number {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value;
  throw new AppError('INTERNAL', {
    detail: `system_config.${key} is missing or is not a positive integer (BR-151).`,
  });
}

export interface CatalogSearchService {
  suggestions(query: SuggestionsQuery): Promise<SuggestionsResponse>;
  listRecent(customerId: string | null): Promise<RecentSearchesResponse>;
  recordRecent(customerId: string | null, query: string): Promise<RecentSearch>;
  deleteRecent(customerId: string | null, q?: string): Promise<void>;
  trending(query: TrendingQuery): Promise<TrendingResponse>;
}

export function createCatalogSearchService(
  deps: {
    repo?: CatalogSearchRepo;
    catalog?: CatalogRepo;
    db?: Executor;
    runTx?: <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;
  } = {},
): CatalogSearchService {
  const repo = deps.repo ?? catalogSearchRepo;
  const catalog = deps.catalog ?? catalogRepo;
  const db = deps.db ?? pool;
  const runTx = deps.runTx ?? withTransaction;

  return {
    async suggestions({ q, limit }) {
      const needle = q.trim().toLowerCase();
      const [products, categories] = await Promise.all([
        catalog.searchProducts(db, { q: q.trim(), limit: limit * 3 }),
        catalog.listCategories(db),
      ]);
      const items: SearchSuggestion[] = [];
      const seen = new Set<string>();
      for (const row of products.items) {
        if (seen.has(row.crop_id)) continue; // one entry per product, not per grade
        seen.add(row.crop_id);
        items.push({ type: 'PRODUCT', id: row.crop_id, name: row.name });
      }
      for (const c of categories) {
        if (c.name.toLowerCase().includes(needle)) items.push({ type: 'CATEGORY', id: c.id, name: c.name });
      }
      return { items: items.slice(0, limit) };
    },

    async listRecent(customerId) {
      if (customerId === null) return { items: [] };
      const cfg = await repo.getConfig(db);
      const max = positiveInt('catalog.recent_searches_max', cfg.recentMax);
      const rows = await repo.listRecent(db, customerId, max);
      return { items: rows.map((r) => ({ query: r.query, searchedAt: r.searched_at.toISOString() })) };
    },

    async recordRecent(customerId, query) {
      if (customerId === null) {
        throw new AppError('FORBIDDEN', { detail: 'Only a customer account keeps recent searches.' });
      }
      const display = query.trim().replace(/\s+/g, ' ');
      const normalized = normalizeSearchQuery(query);
      return runTx(async (tx) => {
        const cfg = await repo.getConfig(tx);
        const max = positiveInt('catalog.recent_searches_max', cfg.recentMax);
        const row = await repo.upsertRecent(tx, customerId, display, normalized);
        await repo.pruneRecent(tx, customerId, max);
        return { query: row.query, searchedAt: row.searched_at.toISOString() };
      });
    },

    async deleteRecent(customerId, q) {
      if (customerId === null) return; // nothing of theirs to delete
      await repo.deleteRecent(db, customerId, q === undefined ? undefined : normalizeSearchQuery(q));
    },

    async trending({ limit }) {
      const cfg = await repo.getConfig(db);
      const minSearchers = positiveInt('catalog.trending_min_searchers', cfg.trendingMinSearchers);
      const windowDays = positiveInt('catalog.trending_window_days', cfg.trendingWindowDays);
      const [queries, cropIds] = await Promise.all([
        repo.trendingQueries(db, windowDays, minSearchers, limit),
        repo.mostOrderedCropIds(db, windowDays, limit),
      ]);
      const products: ProductView[] = [];
      for (const id of cropIds) {
        const row = await catalog.getProductById(db, id);
        if (row !== null) products.push(serializeProduct(row));
      }
      return {
        queries: queries.map((r) => ({ query: r.query, searchers: r.searchers })),
        products,
      };
    },
  };
}

export const catalogSearchService: CatalogSearchService = createCatalogSearchService();
