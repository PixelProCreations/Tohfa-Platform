import { describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import type { CatalogRepo, RawCatalogProductRow } from '../catalog/catalog.repo.js';
import { CatalogService } from '../catalog/catalog.service.js';
import { catalogHomeSchema } from '../catalog/catalog.schema.js';
import type { BannerFields, BannerRow, HomeContentRepo, SectionFields, SectionRow } from './home-content.repo.js';
import { createHomeContentService, statusOf } from './home-content.service.js';
import { createBannerBody, createSectionBody, homeBannerSchema, homeSectionSchema } from './home-content.schema.js';

const ADMIN = '90000000-0000-4000-8000-000000000001';
const CAT = '30000000-0000-4000-8000-000000000001';
const CARROT = '20000000-0000-4000-8000-000000000001';
const POTATO = '20000000-0000-4000-8000-000000000002';
const GONE = '20000000-0000-4000-8000-0000000000ff';
const NOW = new Date('2026-11-16T10:00:00Z');

const scope: ResolvedScope = {
  level: ScopeLevel.ALL, permission: 'catalog.home_content.manage', roleCode: RoleCode.TOHFA_ADMIN,
  warehouseIds: [], zoneIds: [], userId: ADMIN,
};

/** Records every statement so the audit row can be asserted to share the write's executor. */
function recordingTx(): Executor & { sql: string[] } {
  const sql: string[] = [];
  return {
    sql,
    async query(text: string) {
      sql.push(text);
      return { rows: [{ id: 'audit-1' }], rowCount: 1 } as never;
    },
  } as unknown as Executor & { sql: string[] };
}

class FakeRepo implements HomeContentRepo {
  banners: (BannerRow & { deleted?: boolean })[] = [];
  sections: (SectionRow & { deleted?: boolean })[] = [];
  writes: Executor[] = [];
  private n = 0;
  private id() { return `a0000000-0000-4000-8000-${String(++this.n).padStart(12, '0')}`; }
  async listActiveBanners() { return this.banners.filter((b) => !b.deleted && statusOf(b, NOW) === 'ACTIVE'); }
  async listActiveSections() { return this.sections.filter((s) => !s.deleted && statusOf(s, NOW) === 'ACTIVE'); }
  async listBanners() { return this.banners.filter((b) => !b.deleted); }
  async getBanner(_db: Executor, id: string) { return this.banners.find((b) => b.id === id && !b.deleted) ?? null; }
  async insertBanner(db: Executor, f: BannerFields) {
    this.writes.push(db);
    const row = { ...f, id: this.id(), created_at: NOW, updated_at: null };
    this.banners.push(row);
    return row;
  }
  async updateBanner(db: Executor, id: string, f: BannerFields) {
    this.writes.push(db);
    const i = this.banners.findIndex((b) => b.id === id);
    this.banners[i] = { ...this.banners[i]!, ...f, updated_at: NOW };
    return this.banners[i]!;
  }
  async softDeleteBanner(db: Executor, id: string) { this.writes.push(db); this.banners.find((b) => b.id === id)!.deleted = true; }
  async listSections() { return this.sections.filter((s) => !s.deleted); }
  async getSection(_db: Executor, id: string) { return this.sections.find((s) => s.id === id && !s.deleted) ?? null; }
  async insertSection(db: Executor, f: SectionFields) {
    this.writes.push(db);
    const row = { ...f, id: this.id(), created_at: NOW, updated_at: null };
    this.sections.push(row);
    return row;
  }
  async updateSection(db: Executor, id: string, f: SectionFields) {
    this.writes.push(db);
    const i = this.sections.findIndex((s) => s.id === id);
    this.sections[i] = { ...this.sections[i]!, ...f, updated_at: NOW };
    return this.sections[i]!;
  }
  async softDeleteSection(db: Executor, id: string) { this.writes.push(db); this.sections.find((s) => s.id === id)!.deleted = true; }
  async categoryExists(_db: Executor, id: string) { return id === CAT; }
  async existingProductIds(_db: Executor, ids: string[]) { return ids.filter((i) => i === CARROT || i === POTATO); }
}

function build() {
  const repo = new FakeRepo();
  const tx = recordingTx();
  const service = createHomeContentService({ repo, db: tx, runTx: (fn) => fn(tx), now: () => NOW });
  return { repo, tx, service };
}

const auditCount = (tx: { sql: string[] }) => tx.sql.filter((s) => s.includes('INSERT INTO audit_log')).length;

describe('home-content admin (BR-152)', () => {
  it('BR-152a: create writes the banner and one audit row on the same transaction', async () => {
    const { service, repo, tx } = build();
    const b = await service.createBanner(scope, createBannerBody.parse({
      title: 'Harvest', imageUrl: 'https://cdn.tohfa.in/b.jpg', targetType: 'CATEGORY', targetCategoryId: CAT,
    }));
    expect(homeBannerSchema.parse(b)).toBeTruthy();
    expect(b.status).toBe('ACTIVE');
    expect(repo.writes[0]).toBe(tx);
    expect(auditCount(tx)).toBe(1);
  });

  it('BR-152b: target fields must match targetType and exist (422), nothing is written', async () => {
    const { service, repo, tx } = build();
    const cases = [
      { targetType: 'CATEGORY' },
      { targetType: 'CATEGORY', targetCategoryId: '30000000-0000-4000-8000-0000000000ee' },
      { targetType: 'PRODUCT', targetProductId: GONE },
      { targetType: 'URL' },
      { targetType: 'NONE', startsAt: '2026-11-20T00:00:00Z', endsAt: '2026-11-19T00:00:00Z' },
    ];
    for (const c of cases) {
      await expect(
        service.createBanner(scope, createBannerBody.parse({ title: 't', imageUrl: 'https://x.in/a.jpg', ...c })),
      ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    }
    await expect(
      service.createSection(scope, createSectionBody.parse({ title: 't', targetType: 'PRODUCTS', productIds: [CARROT, GONE] })),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    expect(repo.banners).toHaveLength(0);
    expect(auditCount(tx)).toBe(0);
  });

  it('BR-152a: update merges, re-validates and audits before/after; unknown id is 404', async () => {
    const { service, tx } = build();
    const b = await service.createBanner(scope, createBannerBody.parse({ title: 'a', imageUrl: 'https://x.in/a.jpg' }));
    const u = await service.updateBanner(scope, b.id, { targetType: 'URL', targetUrl: '/offers', sortOrder: 3 });
    expect(u).toMatchObject({ targetType: 'URL', targetUrl: '/offers', sortOrder: 3, title: 'a' });
    expect(auditCount(tx)).toBe(2);
    await expect(service.updateBanner(scope, GONE, { title: 'x' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('BR-152a: delete is a soft delete with an audit row; a deleted banner is 404', async () => {
    const { service, tx } = build();
    const b = await service.createBanner(scope, createBannerBody.parse({ title: 'a', imageUrl: 'https://x.in/a.jpg' }));
    await service.deleteBanner(scope, b.id);
    expect(auditCount(tx)).toBe(2);
    await expect(service.getBanner(b.id)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(service.deleteBanner(scope, b.id)).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('BR-152c: status reflects the active window and the active flag; list filters by status', async () => {
    const { service } = build();
    await service.createBanner(scope, createBannerBody.parse({ title: 'live', imageUrl: 'https://x.in/a.jpg' }));
    await service.createBanner(scope, createBannerBody.parse({ title: 'soon', imageUrl: 'https://x.in/a.jpg', startsAt: '2026-12-01T00:00:00Z' }));
    await service.createBanner(scope, createBannerBody.parse({ title: 'old', imageUrl: 'https://x.in/a.jpg', endsAt: '2026-11-01T00:00:00Z' }));
    await service.createBanner(scope, createBannerBody.parse({ title: 'off', imageUrl: 'https://x.in/a.jpg', isActive: false }));
    const all = await service.listBanners({});
    expect(all.items.map((b) => [b.title, b.status])).toEqual([
      ['live', 'ACTIVE'], ['soon', 'SCHEDULED'], ['old', 'EXPIRED'], ['off', 'INACTIVE'],
    ]);
    expect((await service.listBanners({ status: 'SCHEDULED' })).items.map((b) => b.title)).toEqual(['soon']);
  });

  it('BR-152a: sections dedupe product ids, audit, and clear the unused target', async () => {
    const { service, tx } = build();
    const s = await service.createSection(scope, createSectionBody.parse({
      title: 'Picks', targetType: 'PRODUCTS', productIds: [POTATO, CARROT, POTATO], targetCategoryId: CAT,
    }));
    expect(homeSectionSchema.parse(s)).toBeTruthy();
    expect(s.productIds).toEqual([POTATO, CARROT]);
    expect(s.targetCategoryId).toBeNull();
    expect(auditCount(tx)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// GET /catalog/home extension
// ---------------------------------------------------------------------------
const DENYLIST = ['farmerid', 'farmer_id', 'farmname', 'farm_name', 'farmid', 'farm_id', 'village', 'gps', 'latitude', 'longitude', 'fmb', 'batchid', 'batch_id'];
function assertNoDenylistKeys(obj: unknown): void {
  if (obj === null || typeof obj !== 'object') return;
  if (Array.isArray(obj)) return obj.forEach(assertNoDenylistKeys);
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    expect(DENYLIST).not.toContain(k.toLowerCase());
    assertNoDenylistKeys(v);
  }
}

function product(id: string, name: string): RawCatalogProductRow {
  return {
    crop_id: id, name, category_id: CAT, grade: 'GRADE_1', price_per_kg: '60.00', available_qty: '5.000', unit: 'kg',
    icon_key: null, photo_url: null, certification_badges: [], warehouse_ids: [], created_at: NOW,
    ...({ farmer_id: 'f', farm_name: 'Hidden Farm', gps: '1,2' } as object),
  } as RawCatalogProductRow;
}

function catalogFake(): CatalogRepo {
  const rows = [product(CARROT, 'Carrot'), product(POTATO, 'Potato')];
  return {
    async listProducts(_db, f) { return { items: rows.filter((r) => r.category_id === f.categoryId).slice(0, f.limit), nextCursor: null, hasMore: false }; },
    async getProductById(_db, id) { return rows.find((r) => r.crop_id === id) ?? null; },
    async searchProducts() { return { items: [], nextCursor: null, hasMore: false }; },
    async listCategories() { return [{ id: CAT, name: 'Veg', slug: 'veg' }]; },
    async getFeaturedProducts() { return rows; },
  };
}

describe('GET /catalog/home with home content (BR-152)', () => {
  const db = {} as Executor;

  it('BR-152d: no live admin banner keeps the original static banners and adds no sections', async () => {
    const repo = new FakeRepo();
    const home = await new CatalogService(catalogFake(), repo).getCatalogHome(undefined, db);
    expect(home.banners).toHaveLength(2);
    expect(home.heroBanners!.map((b) => b.id)).toEqual(home.banners!.map((b) => b.id));
    expect(home.sections).toEqual([]);
    expect(() => catalogHomeSchema.parse(home)).not.toThrow();
  });

  it('BR-152c: only live banners show, in sort order, with derived deeplinks', async () => {
    const { service, repo } = build();
    await service.createBanner(scope, createBannerBody.parse({ title: 'B', imageUrl: 'https://x.in/b.jpg', sortOrder: 2, targetType: 'PRODUCT', targetProductId: CARROT }));
    await service.createBanner(scope, createBannerBody.parse({ title: 'A', imageUrl: 'https://x.in/a.jpg', sortOrder: 1, targetType: 'CATEGORY', targetCategoryId: CAT }));
    await service.createBanner(scope, createBannerBody.parse({ title: 'Later', imageUrl: 'https://x.in/c.jpg', startsAt: '2026-12-01T00:00:00Z' }));
    repo.banners.sort((x, y) => x.sort_order - y.sort_order);
    const home = await new CatalogService(catalogFake(), repo).getCatalogHome(undefined, db);
    expect(home.heroBanners).toEqual([
      { id: expect.any(String), imageUrl: 'https://x.in/a.jpg', title: 'A', deeplink: `/categories/${CAT}` },
      { id: expect.any(String), imageUrl: 'https://x.in/b.jpg', title: 'B', deeplink: `/products/${CARROT}` },
    ]);
    expect(home.banners).toEqual(home.heroBanners!.map(({ id, imageUrl, deeplink }) => ({ id, imageUrl, deeplink })));
  });

  it('BR-152e: section items are farm-anonymous, ordered, capped, unsellable skipped, empty rails omitted', async () => {
    const { service, repo } = build();
    await service.createSection(scope, createSectionBody.parse({ title: 'Picks', targetType: 'PRODUCTS', productIds: [POTATO, CARROT], maxItems: 1 }));
    await service.createSection(scope, createSectionBody.parse({ title: 'Veg', targetType: 'CATEGORY', targetCategoryId: CAT }));
    repo.sections.push({ ...repo.sections[0]!, id: 'b0000000-0000-4000-8000-000000000009', title: 'Gone', product_ids: [GONE] });
    const home = await new CatalogService(catalogFake(), repo).getCatalogHome(undefined, db);
    expect(home.sections!.map((s) => [s.title, s.items.map((i) => i.id)])).toEqual([
      ['Picks', [POTATO]],
      ['Veg', [CARROT, POTATO]],
    ]);
    assertNoDenylistKeys(home);
    expect(() => catalogHomeSchema.parse(home)).not.toThrow();
  });
});
