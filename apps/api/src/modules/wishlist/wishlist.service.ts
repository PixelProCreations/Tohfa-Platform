/**
 * Wishlist. Own rows only (`scope.customerId`); no id of another customer's is ever addressable
 * because rows are found by (customer, crop, grade), never by wishlist-row id.
 * Enrichment goes through the catalog repo and its BR-16 allow-list serializer, so price and
 * availability are always the catalog's current ones and no farm data can leak.
 */
import { pool, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { catalogRepo, type CatalogRepo } from '../catalog/catalog.repo.js';
import type { ProductGrade } from '../catalog/catalog.schema.js';
import { serializeProduct } from '../catalog/catalog.service.js';
import { wishlistRepo, type WishlistRepo, type WishlistRow } from './wishlist.repo.js';
import type { AddWishlistBody, WishlistItem, WishlistResponse } from './wishlist.schema.js';

export interface WishlistService {
  list(scope: ResolvedScope): Promise<WishlistResponse>;
  /** `created` tells the route whether to answer 201 (new) or 200 (already there). */
  add(scope: ResolvedScope, body: AddWishlistBody): Promise<{ item: WishlistItem; created: boolean }>;
  remove(scope: ResolvedScope, productId: string, grade: ProductGrade): Promise<void>;
}

function requireCustomerId(scope: ResolvedScope): string {
  if (scope.customerId === undefined) {
    throw new AppError('FORBIDDEN', { detail: 'The wishlist is available to customers only.' });
  }
  return scope.customerId;
}

export function createWishlistService(
  deps: { repo?: WishlistRepo; catalog?: Pick<CatalogRepo, 'getProductById'>; db?: Executor } = {},
): WishlistService {
  const repo = deps.repo ?? wishlistRepo;
  const catalog = deps.catalog ?? catalogRepo;
  const db = deps.db ?? pool;

  async function enrich(row: WishlistRow): Promise<WishlistItem> {
    const live = await catalog.getProductById(db, row.crop_id, row.grade);
    return {
      id: row.id,
      productId: row.crop_id,
      grade: row.grade,
      name: row.name,
      available: live !== null,
      product: live === null ? null : serializeProduct(live),
      addedAt: row.created_at.toISOString(),
    };
  }

  return {
    async list(scope) {
      const customerId = requireCustomerId(scope);
      const rows = await repo.list(db, customerId);
      return { items: await Promise.all(rows.map(enrich)) };
    },

    async add(scope, body) {
      const customerId = requireCustomerId(scope);
      if (!(await repo.cropExists(db, body.productId))) {
        throw new AppError('NOT_FOUND', { detail: 'Product not found.' });
      }
      const { created } = await repo.add(db, customerId, body.productId, body.grade);
      const row = await repo.findOne(db, customerId, body.productId, body.grade);
      return { item: await enrich(row!), created };
    },

    async remove(scope, productId, grade) {
      const customerId = requireCustomerId(scope);
      await repo.remove(db, customerId, productId, grade);
    },
  };
}

export const wishlistService = createWishlistService();
