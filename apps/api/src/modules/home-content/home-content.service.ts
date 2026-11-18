/**
 * Admin-managed home banners and curated sections (BR-152).
 *
 * Every mutation runs in one transaction with its audit_log row (CLAUDE.md "Transactions"): a
 * write that rolls back leaves no audit claim. Targets are checked against categories / crop_master
 * so a banner never deep-links to nothing; the DB CHECKs (0114/0115) are the backstop.
 */
import { withTransaction, pool, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { writeAuditLog, changedFields } from '../../audit/auditLog.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import {
  homeContentRepo,
  type BannerFields,
  type BannerRow,
  type HomeContentRepo,
  type SectionFields,
  type SectionRow,
} from './home-content.repo.js';
import type {
  CreateBannerBody,
  CreateSectionBody,
  HomeBanner,
  HomeContentStatus,
  HomeSection,
  ListHomeContentQuery,
  UpdateBannerBody,
  UpdateSectionBody,
} from './home-content.schema.js';

export function statusOf(
  row: { is_active: boolean; starts_at: Date | null; ends_at: Date | null },
  now: Date,
): HomeContentStatus {
  if (!row.is_active) return 'INACTIVE';
  if (row.ends_at !== null && row.ends_at.getTime() <= now.getTime()) return 'EXPIRED';
  if (row.starts_at !== null && row.starts_at.getTime() > now.getTime()) return 'SCHEDULED';
  return 'ACTIVE';
}

const iso = (d: Date | null): string | null => (d === null ? null : d.toISOString());

export function toHomeBanner(r: BannerRow, now: Date): HomeBanner {
  return {
    id: r.id,
    title: r.title,
    imageUrl: r.image_url,
    targetType: r.target_type,
    targetCategoryId: r.target_category_id,
    targetProductId: r.target_product_id,
    targetUrl: r.target_url,
    sortOrder: r.sort_order,
    startsAt: iso(r.starts_at),
    endsAt: iso(r.ends_at),
    isActive: r.is_active,
    status: statusOf(r, now),
    createdAt: r.created_at.toISOString(),
    updatedAt: iso(r.updated_at),
  };
}

export function toHomeSection(r: SectionRow, now: Date): HomeSection {
  return {
    id: r.id,
    title: r.title,
    subtitle: r.subtitle,
    targetType: r.target_type,
    targetCategoryId: r.target_category_id,
    productIds: [...r.product_ids],
    maxItems: r.max_items,
    sortOrder: r.sort_order,
    startsAt: iso(r.starts_at),
    endsAt: iso(r.ends_at),
    isActive: r.is_active,
    status: statusOf(r, now),
    createdAt: r.created_at.toISOString(),
    updatedAt: iso(r.updated_at),
  };
}

/** Customer deeplink for a banner target (BR-152c). */
export function bannerDeeplink(r: Pick<BannerRow, 'target_type' | 'target_category_id' | 'target_product_id' | 'target_url'>): string | null {
  switch (r.target_type) {
    case 'CATEGORY': return `/categories/${r.target_category_id}`;
    case 'PRODUCT': return `/products/${r.target_product_id}`;
    case 'URL': return r.target_url;
    default: return null;
  }
}

function invalid(field: string, message: string): AppError {
  return new AppError('VALIDATION_FAILED', { detail: message, errors: { [`body.${field}`]: [message] } });
}

function checkWindow(starts: Date | null, ends: Date | null): void {
  if (starts !== null && ends !== null && ends.getTime() <= starts.getTime()) {
    throw invalid('endsAt', 'endsAt must be after startsAt.');
  }
}

const toDate = (v: string | null | undefined): Date | null => (v === null || v === undefined ? null : new Date(v));

export interface HomeContentService {
  listBanners(q: ListHomeContentQuery): Promise<{ items: HomeBanner[] }>;
  getBanner(id: string): Promise<HomeBanner>;
  createBanner(scope: ResolvedScope, body: CreateBannerBody): Promise<HomeBanner>;
  updateBanner(scope: ResolvedScope, id: string, body: UpdateBannerBody): Promise<HomeBanner>;
  deleteBanner(scope: ResolvedScope, id: string): Promise<void>;
  listSections(q: ListHomeContentQuery): Promise<{ items: HomeSection[] }>;
  getSection(id: string): Promise<HomeSection>;
  createSection(scope: ResolvedScope, body: CreateSectionBody): Promise<HomeSection>;
  updateSection(scope: ResolvedScope, id: string, body: UpdateSectionBody): Promise<HomeSection>;
  deleteSection(scope: ResolvedScope, id: string): Promise<void>;
}

export function createHomeContentService(
  deps: {
    repo?: HomeContentRepo;
    db?: Executor;
    runTx?: <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;
    now?: () => Date;
  } = {},
): HomeContentService {
  const repo = deps.repo ?? homeContentRepo;
  const db = deps.db ?? pool;
  const runTx = deps.runTx ?? withTransaction;
  const now = deps.now ?? (() => new Date());

  async function validateBanner(tx: Executor, f: BannerFields): Promise<void> {
    checkWindow(f.starts_at, f.ends_at);
    switch (f.target_type) {
      case 'NONE':
        f.target_category_id = null; f.target_product_id = null; f.target_url = null;
        break;
      case 'CATEGORY':
        if (f.target_category_id === null) throw invalid('targetCategoryId', 'targetCategoryId is required for a CATEGORY banner.');
        if (!(await repo.categoryExists(tx, f.target_category_id))) throw invalid('targetCategoryId', 'Unknown category.');
        f.target_product_id = null; f.target_url = null;
        break;
      case 'PRODUCT':
        if (f.target_product_id === null) throw invalid('targetProductId', 'targetProductId is required for a PRODUCT banner.');
        if ((await repo.existingProductIds(tx, [f.target_product_id])).length !== 1) throw invalid('targetProductId', 'Unknown product.');
        f.target_category_id = null; f.target_url = null;
        break;
      case 'URL':
        if (f.target_url === null) throw invalid('targetUrl', 'targetUrl is required for a URL banner.');
        f.target_category_id = null; f.target_product_id = null;
        break;
    }
  }

  async function validateSection(tx: Executor, f: SectionFields): Promise<void> {
    checkWindow(f.starts_at, f.ends_at);
    if (f.target_type === 'CATEGORY') {
      if (f.target_category_id === null) throw invalid('targetCategoryId', 'targetCategoryId is required for a CATEGORY section.');
      if (!(await repo.categoryExists(tx, f.target_category_id))) throw invalid('targetCategoryId', 'Unknown category.');
      f.product_ids = [];
    } else {
      const ids = [...new Set(f.product_ids)];
      if (ids.length === 0) throw invalid('productIds', 'productIds must list at least one product for a PRODUCTS section.');
      const existing = new Set(await repo.existingProductIds(tx, ids));
      const missing = ids.filter((id) => !existing.has(id));
      if (missing.length > 0) throw invalid('productIds', `Unknown products: ${missing.join(', ')}.`);
      f.product_ids = ids;
      f.target_category_id = null;
    }
  }

  function filterStatus<T extends { status: HomeContentStatus }>(items: T[], q: ListHomeContentQuery): T[] {
    return q.status === undefined ? items : items.filter((i) => i.status === q.status);
  }

  return {
    async listBanners(q) {
      const t = now();
      return { items: filterStatus((await repo.listBanners(db)).map((r) => toHomeBanner(r, t)), q) };
    },
    async getBanner(id) {
      const row = await repo.getBanner(db, id);
      if (row === null) throw new AppError('NOT_FOUND', { detail: 'Banner not found.' });
      return toHomeBanner(row, now());
    },
    async createBanner(scope, body) {
      return runTx(async (tx) => {
        const f: BannerFields = {
          title: body.title,
          image_url: body.imageUrl,
          target_type: body.targetType,
          target_category_id: body.targetCategoryId ?? null,
          target_product_id: body.targetProductId ?? null,
          target_url: body.targetUrl ?? null,
          sort_order: body.sortOrder,
          starts_at: toDate(body.startsAt),
          ends_at: toDate(body.endsAt),
          is_active: body.isActive,
        };
        await validateBanner(tx, f);
        const row = await repo.insertBanner(tx, f, scope.userId);
        const view = toHomeBanner(row, now());
        await writeAuditLog(tx, {
          actorId: scope.userId, actorRole: scope.roleCode, actionCode: 'catalog.banner.create',
          entityType: 'home_banner', entityId: row.id, after: view,
        });
        return view;
      });
    },
    async updateBanner(scope, id, body) {
      return runTx(async (tx) => {
        const cur = await repo.getBanner(tx, id);
        if (cur === null) throw new AppError('NOT_FOUND', { detail: 'Banner not found.' });
        const f: BannerFields = {
          title: body.title ?? cur.title,
          image_url: body.imageUrl ?? cur.image_url,
          target_type: body.targetType ?? cur.target_type,
          target_category_id: body.targetCategoryId !== undefined ? body.targetCategoryId : cur.target_category_id,
          target_product_id: body.targetProductId !== undefined ? body.targetProductId : cur.target_product_id,
          target_url: body.targetUrl !== undefined ? body.targetUrl : cur.target_url,
          sort_order: body.sortOrder ?? cur.sort_order,
          starts_at: body.startsAt !== undefined ? toDate(body.startsAt) : cur.starts_at,
          ends_at: body.endsAt !== undefined ? toDate(body.endsAt) : cur.ends_at,
          is_active: body.isActive ?? cur.is_active,
        };
        await validateBanner(tx, f);
        const row = await repo.updateBanner(tx, id, f, scope.userId);
        const t = now();
        const before = toHomeBanner(cur, t);
        const after = toHomeBanner(row, t);
        await writeAuditLog(tx, {
          actorId: scope.userId, actorRole: scope.roleCode, actionCode: 'catalog.banner.update',
          entityType: 'home_banner', entityId: id, before, after,
          changedFields: changedFields(before as unknown as Record<string, unknown>, after as unknown as Record<string, unknown>),
        });
        return after;
      });
    },
    async deleteBanner(scope, id) {
      await runTx(async (tx) => {
        const cur = await repo.getBanner(tx, id);
        if (cur === null) throw new AppError('NOT_FOUND', { detail: 'Banner not found.' });
        await repo.softDeleteBanner(tx, id, scope.userId);
        await writeAuditLog(tx, {
          actorId: scope.userId, actorRole: scope.roleCode, actionCode: 'catalog.banner.delete',
          entityType: 'home_banner', entityId: id, before: toHomeBanner(cur, now()),
        });
      });
    },

    async listSections(q) {
      const t = now();
      return { items: filterStatus((await repo.listSections(db)).map((r) => toHomeSection(r, t)), q) };
    },
    async getSection(id) {
      const row = await repo.getSection(db, id);
      if (row === null) throw new AppError('NOT_FOUND', { detail: 'Home section not found.' });
      return toHomeSection(row, now());
    },
    async createSection(scope, body) {
      return runTx(async (tx) => {
        const f: SectionFields = {
          title: body.title,
          subtitle: body.subtitle ?? null,
          target_type: body.targetType,
          target_category_id: body.targetCategoryId ?? null,
          product_ids: body.productIds ?? [],
          max_items: body.maxItems,
          sort_order: body.sortOrder,
          starts_at: toDate(body.startsAt),
          ends_at: toDate(body.endsAt),
          is_active: body.isActive,
        };
        await validateSection(tx, f);
        const row = await repo.insertSection(tx, f, scope.userId);
        const view = toHomeSection(row, now());
        await writeAuditLog(tx, {
          actorId: scope.userId, actorRole: scope.roleCode, actionCode: 'catalog.home_section.create',
          entityType: 'home_section', entityId: row.id, after: view,
        });
        return view;
      });
    },
    async updateSection(scope, id, body) {
      return runTx(async (tx) => {
        const cur = await repo.getSection(tx, id);
        if (cur === null) throw new AppError('NOT_FOUND', { detail: 'Home section not found.' });
        const f: SectionFields = {
          title: body.title ?? cur.title,
          subtitle: body.subtitle !== undefined ? body.subtitle : cur.subtitle,
          target_type: body.targetType ?? cur.target_type,
          target_category_id: body.targetCategoryId !== undefined ? body.targetCategoryId : cur.target_category_id,
          product_ids: body.productIds ?? cur.product_ids,
          max_items: body.maxItems ?? cur.max_items,
          sort_order: body.sortOrder ?? cur.sort_order,
          starts_at: body.startsAt !== undefined ? toDate(body.startsAt) : cur.starts_at,
          ends_at: body.endsAt !== undefined ? toDate(body.endsAt) : cur.ends_at,
          is_active: body.isActive ?? cur.is_active,
        };
        await validateSection(tx, f);
        const row = await repo.updateSection(tx, id, f, scope.userId);
        const t = now();
        const before = toHomeSection(cur, t);
        const after = toHomeSection(row, t);
        await writeAuditLog(tx, {
          actorId: scope.userId, actorRole: scope.roleCode, actionCode: 'catalog.home_section.update',
          entityType: 'home_section', entityId: id, before, after,
          changedFields: changedFields(before as unknown as Record<string, unknown>, after as unknown as Record<string, unknown>),
        });
        return after;
      });
    },
    async deleteSection(scope, id) {
      await runTx(async (tx) => {
        const cur = await repo.getSection(tx, id);
        if (cur === null) throw new AppError('NOT_FOUND', { detail: 'Home section not found.' });
        await repo.softDeleteSection(tx, id, scope.userId);
        await writeAuditLog(tx, {
          actorId: scope.userId, actorRole: scope.roleCode, actionCode: 'catalog.home_section.delete',
          entityType: 'home_section', entityId: id, before: toHomeSection(cur, now()),
        });
      });
    },
  };
}

export const homeContentService: HomeContentService = createHomeContentService();
