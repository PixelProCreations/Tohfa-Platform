/**
 * BR-202: product detail lists every sellable grade as `variants`, sorted by grade, through the
 * BR-16 allow-list; the original detail fields are unchanged; list rows keep (id, grade) identity;
 * ratingAverage / ratingCount are on list items and detail (BR-06: product ratings only).
 */
import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { pool, type Executor } from '../../db/pool.js';
import { databaseReady, describeIfDatabase, newId } from '../../test/factories.js';
import type { CatalogRepo, RawCatalogProductRow } from './catalog.repo.js';
import { CatalogService } from './catalog.service.js';

const CROP = '11111111-2222-4333-8444-555555555555';
const WH = '11111111-2222-4333-8444-666666666666';

function row(grade: 'GRADE_1' | 'GRADE_2' | 'GRADE_3', price: string, qty: string): RawCatalogProductRow {
  return {
    crop_id: CROP, name: 'Carrot', category_id: '11111111-2222-4333-8444-777777777777', grade,
    price_per_kg: price, available_qty: qty, unit: 'kg', icon_key: 'carrot', photo_url: null,
    certification_badges: [], warehouse_ids: [WH], created_at: new Date(), compare_at_price: '100.00',
    is_coming_soon: false, coming_tomorrow: grade === 'GRADE_3', is_unsalable: false,
    rating_average: '4.5', rating_count: 2,
    // a smuggled internal column must never reach the response (allow-list, BR-16)
    ...({ farmer_id: 'leak', farm_name: 'leak' } as object),
  };
}

function fakeRepo(rows: RawCatalogProductRow[]): CatalogRepo {
  return {
    async listProducts() { return { items: rows, nextCursor: null, hasMore: false }; },
    async getProductById() { return rows.slice().sort((a, b) => a.grade.localeCompare(b.grade))[0] ?? null; },
    async listProductGrades() { return rows; },
    async searchProducts() { return { items: [], nextCursor: null, hasMore: false }; },
    async listCategories() { return []; },
    async getFeaturedProducts() { return []; },
  };
}

const db = {} as Executor;

describe('BR-202: product detail variants', () => {
  it('BR-202a: variants hold every grade, sorted, with per-grade price, availability and discount', async () => {
    const svc = new CatalogService(fakeRepo([row('GRADE_3', '40.00', '5.000'), row('GRADE_1', '80.00', '10.500'), row('GRADE_2', '60.00', '0.750')]));
    const detail = await svc.getProductById(CROP, db);
    expect(detail.variants.map((v) => v.grade)).toEqual(['GRADE_1', 'GRADE_2', 'GRADE_3']);
    expect(detail.variants[0]).toEqual({
      grade: 'GRADE_1', pricePerKg: '80.00', availableKg: '10.500', compareAtPrice: '100.00', discountPercent: 20,
      flags: { isComingSoon: false, comingTomorrow: false, isUnsalable: false },
    });
    expect(detail.variants[2]!.flags.comingTomorrow).toBe(true);
  });

  it('BR-202b: the original detail fields are unchanged (lowest grade) and ratings are present', async () => {
    const svc = new CatalogService(fakeRepo([row('GRADE_2', '60.00', '0.750'), row('GRADE_1', '80.00', '10.500')]));
    const detail = await svc.getProductById(CROP, db);
    expect(detail).toMatchObject({ id: CROP, grade: 'GRADE_1', pricePerKg: '80.00', availableQty: '10.500', ratingAverage: 4.5, ratingCount: 2 });
  });

  it('BR-16: neither the detail nor its variants carry a farm field', async () => {
    const svc = new CatalogService(fakeRepo([row('GRADE_1', '80.00', '1.000')]));
    const text = JSON.stringify(await svc.getProductById(CROP, db));
    expect(text).not.toMatch(/farmer|farm_name|leak/i);
  });

  it('BR-202c: list rows keep (id, grade) identity and carry ratingAverage / ratingCount', async () => {
    const svc = new CatalogService(fakeRepo([row('GRADE_1', '80.00', '1.000'), row('GRADE_2', '60.00', '1.000')]));
    const list = await svc.listProducts({ limit: 20, sort: 'NAME_ASC' }, db);
    expect(list.items.map((i) => `${i.id}:${i.grade}`)).toEqual([`${CROP}:GRADE_1`, `${CROP}:GRADE_2`]);
    for (const i of list.items) expect(i).toMatchObject({ ratingAverage: 4.5, ratingCount: 2 });
  });

  it('BR-202d: a repo without listProductGrades still returns one variant (the detail row)', async () => {
    const repo = fakeRepo([row('GRADE_1', '80.00', '1.000')]);
    delete (repo as { listProductGrades?: unknown }).listProductGrades;
    const detail = await new CatalogService(repo).getProductById(CROP, db);
    expect(detail.variants).toHaveLength(1);
  });
});

describeIfDatabase('BR-202: GET /v1/catalog/products/{id} variants (integration)', () => {
  const app = createApp();
  let ready = false;
  let cropId = '';

  beforeAll(async () => {
    ready = await databaseReady('crop_master');
    if (!ready) return;
    const rand = Math.floor(100000 + Math.random() * 900000);
    const wh = newId();
    const farmerUserId = newId();
    const farmerId = newId();
    const adminId = newId();
    cropId = newId();
    await pool.query(`INSERT INTO warehouses (id, code, name, type, address, city, pincode) VALUES ($1, $2, 'Var WH', 'MAIN', '1 Rd', 'Ooty', '643001')`, [wh, `WH-VAR-${rand}`]);
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, 'Var F', 'FARMER', 'ACTIVE'), ($3, $4, 'Var A', 'ADMIN', 'ACTIVE')`,
      [farmerUserId, `+919899${rand}`, adminId, `+919800${rand}`],
    );
    await pool.query(`INSERT INTO farmers (id, user_id, tohfa_farmer_id, application_status) VALUES ($1, $2, $3, 'APPROVED')`, [farmerId, farmerUserId, `FARM-VAR-${rand}`]);
    const cat = await pool.query<{ id: string }>(`SELECT id FROM categories LIMIT 1`);
    await pool.query(`INSERT INTO crop_master (id, category_id, slug, name) VALUES ($1, $2, $3, $4)`, [cropId, cat.rows[0]!.id, `var-${rand}`, `Variant Beans ${rand}`]);
    for (const [grade, price, qty] of [['GRADE_1', '90.00', '10.000'], ['GRADE_2', '70.00', '4.000']] as const) {
      await pool.query(`INSERT INTO retail_prices (crop_id, grade, price, effective_from, set_by) VALUES ($1, $2, $3, CURRENT_DATE - interval '1 day', $4)`, [cropId, grade, price, adminId]);
      const b = newId();
      await pool.query(
        `INSERT INTO inventory_batches (id, batch_code, warehouse_id, crop_id, grade, source_farmer_id, qty_received, qty_available, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $7, 'ACTIVE')`,
        [b, `B-VAR-${grade}-${rand}`, wh, cropId, grade, farmerId, qty],
      );
      await pool.query(`INSERT INTO allocations (batch_id, warehouse_id, channel, allocated_qty, consumed_qty, reserved_qty) VALUES ($1, $2, 'ONLINE', $3, 0, 0)`, [b, wh, qty]);
    }
  });

  it('BR-202: the detail returns both grades as variants and stays farm-anonymous', async () => {
    if (!ready) return;
    const res = await request(app).get(`/v1/catalog/products/${cropId}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: cropId, grade: 'GRADE_1', pricePerKg: '90.00', ratingCount: 0 });
    expect(res.body.variants).toEqual([
      expect.objectContaining({ grade: 'GRADE_1', pricePerKg: '90.00', availableKg: '10.000' }),
      expect.objectContaining({ grade: 'GRADE_2', pricePerKg: '70.00', availableKg: '4.000' }),
    ]);
    expect(JSON.stringify(res.body)).not.toMatch(/farmer|FARM-VAR/i);
  });
});
