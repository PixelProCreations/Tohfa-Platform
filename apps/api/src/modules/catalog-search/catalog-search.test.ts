import { describe, expect, it } from 'vitest';
import { AppError } from '../../http/problem.js';
import type { Executor } from '../../db/pool.js';
import type { CatalogRepo, RawCatalogProductRow } from '../catalog/catalog.repo.js';
import type { CategoryView } from '../catalog/catalog.schema.js';
import type { CatalogSearchRepo, RecentSearchRow, SearchConfigRaw } from './catalog-search.repo.js';
import { createCatalogSearchService, normalizeSearchQuery } from './catalog-search.service.js';
import { suggestionsResponse, trendingResponse } from './catalog-search.schema.js';

const CUST_A = '70000000-0000-4000-8000-00000000000a';
const CUST_B = '70000000-0000-4000-8000-00000000000b';
const CARROT = '20000000-0000-4000-8000-000000000001';
const POTATO = '20000000-0000-4000-8000-000000000002';
const VEG = '30000000-0000-4000-8000-000000000001';

const DENYLIST = ['farmerid', 'farmer_id', 'farmname', 'farm_name', 'farmid', 'farm_id', 'village', 'gps', 'latitude', 'longitude', 'fmb', 'batchid', 'batch_id', 'customerid', 'customer_id'];

function assertNoDenylistKeys(obj: unknown): void {
  if (obj === null || typeof obj !== 'object') return;
  if (Array.isArray(obj)) return obj.forEach(assertNoDenylistKeys);
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    expect(DENYLIST).not.toContain(k.toLowerCase());
    assertNoDenylistKeys(v);
  }
}

function productRow(id: string, name: string): RawCatalogProductRow {
  // Extra internal columns a careless serializer would leak.
  return {
    crop_id: id,
    name,
    category_id: VEG,
    grade: 'GRADE_1',
    price_per_kg: '69.00',
    available_qty: '10.000',
    unit: 'kg',
    icon_key: null,
    photo_url: null,
    certification_badges: ['PGS'],
    warehouse_ids: [],
    created_at: new Date(),
    ...({ farmer_id: 'f1', farm_name: 'Secret Farm', gps: '11.4,76.7' } as object),
  } as RawCatalogProductRow;
}

function fakeCatalogRepo(): CatalogRepo {
  const products = [productRow(CARROT, 'Nilgiris Carrot'), productRow(POTATO, 'Ooty Potato')];
  const categories: CategoryView[] = [{ id: VEG, name: 'Vegetables', slug: 'vegetables' }];
  return {
    async listProducts() { return { items: products, nextCursor: null, hasMore: false }; },
    async getProductById(_db, id) { return products.find((p) => p.crop_id === id) ?? null; },
    async searchProducts(_db, f) {
      const q = f.q.toLowerCase();
      const items = products.filter((p) => p.name.toLowerCase().includes(q));
      // Two grades of the same crop come back as two rows.
      return { items: [...items, ...items], nextCursor: null, hasMore: false };
    },
    async listCategories() { return categories; },
    async getFeaturedProducts() { return []; },
  };
}

interface Stored { customerId: string; query: string; normalized: string; searchedAt: Date }

class FakeSearchRepo implements CatalogSearchRepo {
  rows: Stored[] = [];
  config: SearchConfigRaw = { recentMax: 3, trendingMinSearchers: 2, trendingWindowDays: 7 };
  orderedCropIds: string[] = [];
  private tick = 0;

  async getConfig() { return this.config; }
  async listRecent(_db: Executor, customerId: string, limit: number): Promise<RecentSearchRow[]> {
    return this.rows
      .filter((r) => r.customerId === customerId)
      .sort((a, b) => b.searchedAt.getTime() - a.searchedAt.getTime())
      .slice(0, limit)
      .map((r) => ({ query: r.query, searched_at: r.searchedAt }));
  }
  async upsertRecent(_db: Executor, customerId: string, query: string, normalized: string) {
    const at = new Date(Date.UTC(2026, 10, 16, 0, 0, this.tick++));
    const existing = this.rows.find((r) => r.customerId === customerId && r.normalized === normalized);
    if (existing) { existing.query = query; existing.searchedAt = at; }
    else this.rows.push({ customerId, query, normalized, searchedAt: at });
    return { query, searched_at: at };
  }
  async pruneRecent(_db: Executor, customerId: string, keep: number) {
    const mine = this.rows.filter((r) => r.customerId === customerId).sort((a, b) => b.searchedAt.getTime() - a.searchedAt.getTime());
    const drop = new Set(mine.slice(keep));
    this.rows = this.rows.filter((r) => !drop.has(r));
  }
  async deleteRecent(_db: Executor, customerId: string, normalized?: string) {
    this.rows = this.rows.filter((r) => !(r.customerId === customerId && (normalized === undefined || r.normalized === normalized)));
  }
  async trendingQueries(_db: Executor, _w: number, minSearchers: number, limit: number) {
    const by = new Map<string, Set<string>>();
    for (const r of this.rows) {
      const s = by.get(r.normalized) ?? new Set<string>();
      s.add(r.customerId);
      by.set(r.normalized, s);
    }
    return [...by.entries()]
      .filter(([, s]) => s.size >= minSearchers)
      .map(([query, s]) => ({ query, searchers: s.size }))
      .sort((a, b) => b.searchers - a.searchers || a.query.localeCompare(b.query))
      .slice(0, limit);
  }
  async mostOrderedCropIds() { return this.orderedCropIds; }
}

const db = {} as Executor;
function build(repo = new FakeSearchRepo()) {
  const service = createCatalogSearchService({ repo, catalog: fakeCatalogRepo(), db, runTx: (fn) => fn(db) });
  return { service, repo };
}

describe('catalog-search (BR-151)', () => {
  it('normalizes case and whitespace', () => {
    expect(normalizeSearchQuery('  Ooty   POTATO ')).toBe('ooty potato');
  });

  it('BR-151a: re-searching the same text (any case/spacing) keeps one entry, moved to the top', async () => {
    const { service } = build();
    await service.recordRecent(CUST_A, 'carrot');
    await service.recordRecent(CUST_A, 'potato');
    await service.recordRecent(CUST_A, '  CARROT ');
    const res = await service.listRecent(CUST_A);
    expect(res.items.map((i) => i.query)).toEqual(['CARROT', 'potato']);
  });

  it('BR-151a: the list is capped at system_config catalog.recent_searches_max (oldest pruned)', async () => {
    const { service, repo } = build();
    for (const q of ['a1', 'b2', 'c3', 'd4', 'e5']) await service.recordRecent(CUST_A, q);
    const res = await service.listRecent(CUST_A);
    expect(res.items.map((i) => i.query)).toEqual(['e5', 'd4', 'c3']);
    expect(repo.rows.filter((r) => r.customerId === CUST_A)).toHaveLength(3);
  });

  it('BR-151c: recent searches are per customer; a non-customer actor sees an empty list', async () => {
    const { service } = build();
    await service.recordRecent(CUST_A, 'carrot');
    expect((await service.listRecent(CUST_B)).items).toEqual([]);
    expect((await service.listRecent(null)).items).toEqual([]);
  });

  it('BR-151c: DELETE with q removes one entry, without q clears only the caller', async () => {
    const { service } = build();
    await service.recordRecent(CUST_A, 'carrot');
    await service.recordRecent(CUST_A, 'potato');
    await service.recordRecent(CUST_B, 'carrot');
    await service.deleteRecent(CUST_A, ' Carrot');
    expect((await service.listRecent(CUST_A)).items.map((i) => i.query)).toEqual(['potato']);
    await service.deleteRecent(CUST_A);
    expect((await service.listRecent(CUST_A)).items).toEqual([]);
    expect((await service.listRecent(CUST_B)).items).toHaveLength(1);
  });

  it('BR-151c: recording without a customer profile is 403 FORBIDDEN', async () => {
    const { service } = build();
    await expect(service.recordRecent(null, 'carrot')).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('BR-151d: a missing or invalid config value fails closed (INTERNAL), never a silent default', async () => {
    for (const bad of [null, '10', 0, -1, 2.5, true]) {
      const repo = new FakeSearchRepo();
      repo.config = { ...repo.config, recentMax: bad };
      const { service } = build(repo);
      const err = await service.recordRecent(CUST_A, 'x').catch((e: unknown) => e);
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).code).toBe('INTERNAL');
    }
  });

  it('BR-151b: a query searched by fewer than K distinct customers never trends', async () => {
    const { service } = build();
    await service.recordRecent(CUST_A, 'carrot');
    await service.recordRecent(CUST_B, 'Carrot');
    await service.recordRecent(CUST_A, 'my secret allergy');
    const res = await service.trending({ limit: 10 });
    expect(res.queries).toEqual([{ query: 'carrot', searchers: 2 }]);
    expect(trendingResponse.parse(res)).toBeTruthy();
    assertNoDenylistKeys(res);
  });

  it('BR-151b: trending products are the most ordered sellable products, farm-anonymous', async () => {
    const repo = new FakeSearchRepo();
    repo.orderedCropIds = [POTATO, '20000000-0000-4000-8000-0000000000ff', CARROT];
    const { service } = build(repo);
    const res = await service.trending({ limit: 10 });
    expect(res.products.map((p) => p.id)).toEqual([POTATO, CARROT]);
    assertNoDenylistKeys(res);
    expect(() => trendingResponse.parse(res)).not.toThrow();
  });

  it('BR-151e: suggestions are names only from sellable products and categories, deduped, allow-listed', async () => {
    const { service } = build();
    const res = await service.suggestions({ q: 'o', limit: 8 });
    expect(res.items).toEqual([
      { type: 'PRODUCT', id: CARROT, name: 'Nilgiris Carrot' },
      { type: 'PRODUCT', id: POTATO, name: 'Ooty Potato' },
    ]);
    const cat = await service.suggestions({ q: 'veg', limit: 8 });
    expect(cat.items).toEqual([{ type: 'CATEGORY', id: VEG, name: 'Vegetables' }]);
    assertNoDenylistKeys(res);
    expect(() => suggestionsResponse.parse(res)).not.toThrow();
  });

  it('BR-151e: suggestions respect the limit', async () => {
    const { service } = build();
    const res = await service.suggestions({ q: 'o', limit: 1 });
    expect(res.items).toHaveLength(1);
  });
});
