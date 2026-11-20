import { describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { errorHandler, notFoundHandler } from '../../http/errorHandler.js';
import { signAccessToken } from '../../auth/jwt.js';
import { aScope, newId } from '../../test/factories.js';
import type { RawCatalogProductRow } from '../catalog/catalog.repo.js';
import { productSchema, type ProductGrade } from '../catalog/catalog.schema.js';
import type { WishlistRepo, WishlistRow } from './wishlist.repo.js';
import { createWishlistRouter } from './wishlist.routes.js';
import { createWishlistService, type WishlistService } from './wishlist.service.js';

const db = {} as Executor;
const CUSTOMER = newId();
const scope = aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.CUSTOMER, customerId: CUSTOMER });
const CROP = newId();

function build(opts: { live?: boolean } = {}) {
  const rows = new Map<string, WishlistRow>();
  const key = (c: string, crop: string, g: string) => `${c}|${crop}|${g}`;
  const repo: WishlistRepo = {
    async cropExists(_d, id) { return id === CROP; },
    async add(_d, c, crop, g) {
      const k = key(c, crop, g);
      const had = rows.has(k);
      if (!had) rows.set(k, { id: newId(), crop_id: crop, grade: g, name: 'Carrot', created_at: new Date() });
      return { id: rows.get(k)!.id, created: !had };
    },
    async findOne(_d, c, crop, g) { return rows.get(key(c, crop, g)) ?? null; },
    async list(_d, c) { return [...rows.entries()].filter(([k]) => k.startsWith(c)).map(([, v]) => v); },
    async remove(_d, c, crop, g) { rows.delete(key(c, crop, g)); },
  };
  const live: RawCatalogProductRow = {
    crop_id: CROP, name: 'Carrot', category_id: newId(), grade: 'GRADE_1', price_per_kg: '40', available_qty: '12', unit: 'kg',
    icon_key: null, photo_url: null, certification_badges: [], warehouse_ids: [newId()], created_at: new Date(),
    // a farm-identifying column the serializer must not pass through
    ...({ farmer_id: 'F-SECRET', farm_name: 'Secret Farm' } as object),
  };
  const catalog = { async getProductById(_d: Executor, _c: string, _g?: ProductGrade) { return opts.live === false ? null : live; } };
  return { service: createWishlistService({ repo, catalog, db }), rows };
}

describe('wishlist service', () => {
  it('add is idempotent: second add reports created=false and keeps one row', async () => {
    const { service, rows } = build();
    expect((await service.add(scope, { productId: CROP, grade: 'GRADE_1' })).created).toBe(true);
    expect((await service.add(scope, { productId: CROP, grade: 'GRADE_1' })).created).toBe(false);
    expect(rows.size).toBe(1);
  });

  it('enriches with current catalog price/availability through the BR-16 allow-list', async () => {
    const { service } = build();
    await service.add(scope, { productId: CROP, grade: 'GRADE_1' });
    const { items } = await service.list(scope);
    expect(items[0]).toMatchObject({ available: true });
    expect(items[0]!.product).toMatchObject({ pricePerKg: '40.00', availableQty: '12.000' });
    expect(productSchema.safeParse(items[0]!.product).success).toBe(true);
    expect(JSON.stringify(items)).not.toMatch(/F-SECRET|Secret Farm/);
  });

  it('an unsellable product stays listed with available=false and no product', async () => {
    const { service } = build({ live: false });
    await service.add(scope, { productId: CROP, grade: 'GRADE_1' });
    const { items } = await service.list(scope);
    expect(items[0]).toMatchObject({ available: false, product: null, name: 'Carrot' });
  });

  it('unknown product is 404; delete is idempotent; lists are per customer', async () => {
    const { service } = build();
    await expect(service.add(scope, { productId: newId(), grade: 'GRADE_1' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await service.add(scope, { productId: CROP, grade: 'GRADE_1' });
    const other = aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.CUSTOMER, customerId: newId() });
    expect((await service.list(other)).items).toHaveLength(0);
    await service.remove(scope, CROP, 'GRADE_1');
    await service.remove(scope, CROP, 'GRADE_1');
    expect((await service.list(scope)).items).toHaveLength(0);
  });
});

describe('wishlist routes', () => {
  const stub = new Proxy({} as WishlistService, {
    get: (_t, name: string) => async () => (name === 'add' ? { item: { ok: true }, created: false } : { ok: true }),
  });
  const app = express();
  app.use(express.json());
  app.use('/v1/wishlist', createWishlistRouter(stub));
  app.use(notFoundHandler);
  app.use(errorHandler);
  const tok = (code: RoleCode) => `Bearer ${signAccessToken({ sub: newId(), roles: [{ code }], farmerId: null, customerId: newId() } as never)}`;

  it('permission matrix and status codes', async () => {
    const c = tok(RoleCode.CUSTOMER);
    expect((await request(app).get('/v1/wishlist')).status).toBe(401);
    expect((await request(app).get('/v1/wishlist').set('Authorization', tok(RoleCode.FARMER))).status).toBe(403);
    expect((await request(app).get('/v1/wishlist').set('Authorization', c)).status).toBe(200);
    expect((await request(app).post('/v1/wishlist').set('Authorization', c).send({ productId: CROP, grade: 'GRADE_1' })).status).toBe(200);
    expect((await request(app).post('/v1/wishlist').set('Authorization', c).send({ productId: CROP, grade: 'REJECT' })).status).toBe(422);
    expect((await request(app).delete(`/v1/wishlist/${CROP}?grade=GRADE_1`).set('Authorization', c)).status).toBe(204);
    expect((await request(app).delete(`/v1/wishlist/${CROP}`).set('Authorization', c)).status).toBe(422);
  });
});
