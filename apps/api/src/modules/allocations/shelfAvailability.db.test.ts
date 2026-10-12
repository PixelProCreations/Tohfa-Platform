/**
 * BR-100: availability shown to customers and admins never exceeds the shelf.
 *
 * A DIRECT counter sale draws pooled batch stock without touching any allocation row (BR-95,
 * owner decision 2026-10-11), so the stored allocation `available_qty` can count stock that is no
 * longer there. These tests drive the real HTTP app: a DIRECT sale through POST /v1/admin/sales,
 * then the customer catalog, the cart, the admin allocation dashboard and the market-day screen.
 *
 * Isolation: the file creates its own warehouse (a market-day venue), crops, customers, admins and
 * farmer, and removes every committed row reachable from them in afterAll. Carts are not covered by
 * the shared cleanup helper, so they are removed here first.
 */
import { afterAll, beforeAll, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { RoleCode } from '@tohfa/shared-types';
import type { pool as poolInstance } from '../../db/pool.js';
import type { signAccessToken as signAccessTokenFn } from '../../auth/jwt.js';
import { databaseReady, describeIfDatabase, IDS, newId } from '../../test/factories.js';
import { ensureStandardUsers, insertCrop, insertFarmerWithPlot, randomMobile } from '../../test/dbFixtures.js';
import { removeCommittedFixtures } from '../../test/committedFixtureCleanup.js';

describeIfDatabase('BR-100 shelf-capped availability (PostgreSQL, real HTTP)', () => {
  let pool: typeof poolInstance;
  let app: Express;
  let warehouse = '';
  let today = '';
  let farmerId = '';
  const created = { warehouses: [] as string[], crops: [] as string[], customers: [] as string[], users: [] as string[], farmers: [] as string[] };
  const tokens: Record<string, string> = {};
  let signToken: typeof signAccessTokenFn;
  let seq = 0;
  const RUN_KEY_PREFIX = `ci-shelf-${newId().slice(0, 8)}-`;
  const key = (): string => `${RUN_KEY_PREFIX}${Date.now()}-${(seq += 1)}`;

  beforeAll(async () => {
    if (!(await databaseReady('sale_payments'))) throw new Error('sale_payments is missing: run the migrations');
    const [{ pool: p }, { signAccessToken }, { createApp }] = await Promise.all([
      import('../../db/pool.js'),
      import('../../auth/jwt.js'),
      import('../../app.js'),
    ]);
    pool = p;
    signToken = signAccessToken;
    app = createApp();

    warehouse = newId();
    await pool.query(
      `INSERT INTO warehouses (id, code, name, type, is_market_day_venue) VALUES ($1, $2, 'CI Shelf Cap', 'SUB', true)`,
      [warehouse, `WH-CI-SHELF-${warehouse.slice(0, 8)}`],
    );
    created.warehouses.push(warehouse);
    today = (await pool.query<{ d: string }>(`SELECT ((now() AT TIME ZONE 'Asia/Kolkata')::date)::text AS d`)).rows[0]!.d;
    await ensureStandardUsers(pool, 'userSuperAdmin');
    const sub = await pool.query<{ id: string }>(
      `INSERT INTO users (mobile, full_name, user_type, status) VALUES ($1, 'CI Shelf Sub', 'ADMIN', 'ACTIVE') RETURNING id`,
      [randomMobile()],
    );
    created.users.push(sub.rows[0]!.id);
    const farmer = await insertFarmerWithPlot(pool);
    farmerId = farmer.farmerId;
    created.farmers.push(farmer.farmerId);
    created.users.push(farmer.userId);

    const base = { farmerId: null, customerId: null };
    tokens['sa'] = signAccessToken({ sub: IDS.userSuperAdmin, roles: [{ code: RoleCode.SUPER_ADMIN }], ...base });
    tokens['sub'] = signAccessToken({ sub: sub.rows[0]!.id, roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: warehouse }], ...base });
  }, 60_000); // importing the whole app (createApp) is slow on a cold transform cache

  afterAll(async () => {
    const [{ closePool, withTransaction }, { closeRedis }] = await Promise.all([import('../../db/pool.js'), import('../../redis.js')]);
    try {
      if (pool === undefined) return;
      await pool.query(
        `DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE customer_id = ANY($1::uuid[]))`,
        [created.customers],
      );
      await pool.query(`DELETE FROM carts WHERE customer_id = ANY($1::uuid[])`, [created.customers]);
      await removeCommittedFixtures(withTransaction, {
        warehouseIds: created.warehouses,
        cropIds: created.crops,
        customerIds: created.customers,
        userIds: created.users,
        farmerIds: created.farmers,
        idempotencyKeyPrefix: RUN_KEY_PREFIX,
      });
    } finally {
      await Promise.allSettled([closePool(), closeRedis()]);
    }
  }, 60_000);

  // -------------------------------------------------------------------------
  // fixtures
  // -------------------------------------------------------------------------
  const auth = (token: string): string => `Bearer ${token}`;

  async function newCrop(): Promise<{ id: string; slug: string }> {
    const id = await insertCrop(pool);
    created.crops.push(id);
    await pool.query(
      `INSERT INTO fair_prices (crop_id, grade, ceiling_price, effective_from, set_by) VALUES ($1, 'GRADE_1', '10.00', $2::date - 1, $3)`,
      [id, today, IDS.userSuperAdmin],
    );
    const slug = (await pool.query<{ slug: string }>(`SELECT slug FROM crop_master WHERE id = $1`, [id])).rows[0]!.slug;
    return { id, slug };
  }

  /** 10 kg arriving through a RECEIPT ledger row (qty_available is trigger-maintained), split 7/1/1/1. */
  async function newBatch(crop: string): Promise<{ id: string; allocations: Record<string, string> }> {
    const id = newId();
    await pool.query(
      `INSERT INTO inventory_batches (id, batch_code, warehouse_id, crop_id, grade, source_farmer_id, qty_received, qty_available, expiry_on, status)
       VALUES ($1, $2, $3, $4, 'GRADE_1', $5, 10, 0, $6::date + 30, 'ACTIVE')`,
      [id, `B-CI-SH-${id.slice(0, 8)}`, warehouse, crop, farmerId, today],
    );
    await pool.query(
      `INSERT INTO stock_ledger (batch_id, warehouse_id, movement_type, qty_delta, balance_after, ref_type, remarks)
       VALUES ($1, $2, 'RECEIPT', 10, 0, 'TEST', 'fixture receipt')`,
      [id, warehouse],
    );
    const allocations: Record<string, string> = {};
    for (const [channel, qty] of Object.entries({ ONLINE: '7', LIVE_MARKET: '1', RESERVE: '1', BUFFER: '1' })) {
      const row = await pool.query<{ id: string }>(
        `INSERT INTO allocations (batch_id, warehouse_id, channel, allocated_qty) VALUES ($1, $2, $3, $4) RETURNING id`,
        [id, warehouse, channel, qty],
      );
      allocations[channel] = row.rows[0]!.id;
    }
    return { id, allocations };
  }

  async function newCustomerToken(): Promise<string> {
    const user = await pool.query<{ id: string }>(
      `INSERT INTO users (mobile, full_name, user_type, status) VALUES ($1, 'CI Shelf Customer', 'CUSTOMER', 'ACTIVE') RETURNING id`,
      [randomMobile()],
    );
    const customer = await pool.query<{ id: string }>(
      `INSERT INTO customers (user_id, customer_code, preferred_warehouse_id) VALUES ($1, $2, $3) RETURNING id`,
      [user.rows[0]!.id, `CUST-CI-SH-${newId().slice(0, 8)}`, warehouse],
    );
    created.users.push(user.rows[0]!.id);
    created.customers.push(customer.rows[0]!.id);
    return signToken({ sub: user.rows[0]!.id, roles: [{ code: RoleCode.CUSTOMER }], farmerId: null, customerId: customer.rows[0]!.id });
  }

  async function sell(channel: 'DIRECT' | 'MARKET', crop: string, qtyKg: string, method: 'CASH' | 'UPI' = 'CASH') {
    const total = (Number(qtyKg) * 10).toFixed(2);
    const payment = method === 'CASH' ? { method, amountReceived: total } : { method };
    const res = await request(app)
      .post('/v1/admin/sales')
      .set('Authorization', auth(tokens['sub']!))
      .set('Idempotency-Key', key())
      .send({ channel, walkIn: { name: 'Counter' }, items: [{ productId: crop, grade: 'GRADE_1', qtyKg }], expectedTotal: total, payment });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    return res;
  }

  async function addToCart(token: string, crop: string, qtyKg: string) {
    return request(app)
      .post('/v1/cart/items')
      .set('Authorization', auth(token))
      .send({ productId: crop, grade: 'GRADE_1', qtyKg, warehouseId: warehouse });
  }

  /** availableQty from each of the four catalog reads (undefined when the product is not listed). */
  async function catalogFigures(crop: { id: string; slug: string }): Promise<Record<string, string | number | undefined>> {
    const list = await request(app).get(`/v1/catalog/products?warehouseId=${warehouse}&limit=100`);
    const search = await request(app).get(`/v1/catalog/search?q=${crop.slug}&warehouseId=${warehouse}`);
    const home = await request(app).get(`/v1/catalog/home?warehouseId=${warehouse}`);
    const detail = await request(app).get(`/v1/catalog/products/${crop.id}`);
    for (const res of [list, search, home]) expect(res.status, JSON.stringify(res.body)).toBe(200);
    type P = { id: string; availableQty: string };
    return {
      list: (list.body.items as P[]).find((p) => p.id === crop.id)?.availableQty,
      search: (search.body.items as P[]).find((p) => p.id === crop.id)?.availableQty,
      featured: (home.body.featured as P[]).find((p) => p.id === crop.id)?.availableQty,
      detail: detail.status === 200 ? (detail.body as P).availableQty : detail.status,
    };
  }

  async function dashboard(batchId: string): Promise<Record<string, { allocatedQtyKg: string; consumedQtyKg: string; reservedQtyKg: string; availableQtyKg: string }>> {
    const res = await request(app).get(`/v1/admin/allocations?warehouseId=${warehouse}&limit=100`).set('Authorization', auth(tokens['sa']!));
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    const rows = (res.body.items as Array<{ batchId: string; channel: string; allocatedQtyKg: string; consumedQtyKg: string; reservedQtyKg: string; availableQtyKg: string }>).filter(
      (r) => r.batchId === batchId,
    );
    return Object.fromEntries(
      rows.map((r) => [r.channel, { allocatedQtyKg: r.allocatedQtyKg, consumedQtyKg: r.consumedQtyKg, reservedQtyKg: r.reservedQtyKg, availableQtyKg: r.availableQtyKg }]),
    );
  }

  async function marketRemaining(crop: string): Promise<string | undefined> {
    const res = await request(app).get(`/v1/admin/sales/market-day?warehouseId=${warehouse}`).set('Authorization', auth(tokens['sub']!));
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    return (res.body.allocation as Array<{ productId: string; remainingQtyKg: string }>).find((r) => r.productId === crop)?.remainingQtyKg;
  }

  const allocationRows = async (batchId: string): Promise<string> =>
    String(
      (
        await pool.query<{ v: string }>(
          `SELECT string_agg(channel || ':' || allocated_qty || '/' || consumed_qty || '/' || reserved_qty || '/' || coalesce(updated_at::text, '-'), ',' ORDER BY channel) AS v
             FROM allocations WHERE batch_id = $1`,
          [batchId],
        )
      ).rows[0]!.v,
    );

  // -------------------------------------------------------------------------
  // tests
  // -------------------------------------------------------------------------
  it('BR-100f: with no DIRECT sale, catalog, dashboard, market-day and cart figures equal the stored allocation available_qty', async () => {
    const crop = await newCrop();
    const batch = await newBatch(crop.id);
    expect(await catalogFigures(crop)).toEqual({ list: '7.000', search: '7.000', featured: '7.000', detail: '7.000' });
    const dash = await dashboard(batch.id);
    expect(dash['ONLINE']!.availableQtyKg).toBe('7.000');
    expect(dash['LIVE_MARKET']!.availableQtyKg).toBe('1.000');
    expect(dash['RESERVE']!.availableQtyKg).toBe('1.000');
    expect(await marketRemaining(crop.id)).toBe('1.000');

    const customer = await newCustomerToken();
    const over = await addToCart(customer, crop.id, '7.001');
    expect(over.status).toBe(409);
    expect(over.body.code).toBe('INSUFFICIENT_ALLOCATION');
    const ok = await addToCart(customer, crop.id, '7');
    expect(ok.status, JSON.stringify(ok.body)).toBe(201);
  });

  it('BR-100a / BR-100c / BR-100d: after a DIRECT sale of 9.5 of 10 kg, catalog, dashboard and market-day read 0.5 kg, and the reads write nothing', async () => {
    const crop = await newCrop();
    const batch = await newBatch(crop.id);
    await sell('DIRECT', crop.id, '9.5');
    const before = await allocationRows(batch.id);

    expect(await catalogFigures(crop)).toEqual({ list: '0.500', search: '0.500', featured: '0.500', detail: '0.500' });

    const dash = await dashboard(batch.id);
    expect(dash['ONLINE']).toEqual({ allocatedQtyKg: '7.000', consumedQtyKg: '0.000', reservedQtyKg: '0.000', availableQtyKg: '0.500' });
    expect(dash['LIVE_MARKET']!.availableQtyKg).toBe('0.500');
    expect(dash['RESERVE']!.availableQtyKg).toBe('0.500');
    expect(await marketRemaining(crop.id)).toBe('0.500');

    expect(await allocationRows(batch.id)).toBe(before);

    // The last 0.5 kg held by a pending UPI counter sale: nothing is free on the shelf, although the
    // batch is still ACTIVE and the ONLINE row still stores 7 kg available.
    await sell('DIRECT', crop.id, '0.5', 'UPI');
    expect(await catalogFigures(crop)).toEqual({ list: undefined, search: undefined, featured: undefined, detail: 404 });
    expect((await dashboard(batch.id))['ONLINE']!.availableQtyKg).toBe('0.000');
    expect(await marketRemaining(crop.id)).toBe('0.000');
  });

  it('BR-100b: after the DIRECT sale a cart cannot reserve more than the shelf: 1 kg is 409 STOCK_UNAVAILABLE, 0.5 kg reserves, one gram more is 409; above the ONLINE bucket is still INSUFFICIENT_ALLOCATION', async () => {
    const crop = await newCrop();
    const batch = await newBatch(crop.id);
    await sell('DIRECT', crop.id, '9.5');
    const reserved = async (): Promise<string> =>
      (await pool.query<{ r: string }>(`SELECT reserved_qty::text AS r FROM allocations WHERE id = $1`, [batch.allocations['ONLINE']])).rows[0]!.r;

    const first = await newCustomerToken();
    const tooMuch = await addToCart(first, crop.id, '1');
    expect(tooMuch.status).toBe(409);
    expect(tooMuch.body.code).toBe('STOCK_UNAVAILABLE');
    expect(await reserved()).toBe('0.000');

    const aboveBucket = await addToCart(first, crop.id, '7.5');
    expect(aboveBucket.status).toBe(409);
    expect(aboveBucket.body.code).toBe('INSUFFICIENT_ALLOCATION');

    const ok = await addToCart(first, crop.id, '0.5');
    expect(ok.status, JSON.stringify(ok.body)).toBe(201);
    expect(await reserved()).toBe('0.500');

    const second = await newCustomerToken();
    const gram = await addToCart(second, crop.id, '0.001');
    expect(gram.status).toBe(409);
    expect(gram.body.code).toBe('STOCK_UNAVAILABLE');
    expect(await reserved()).toBe('0.500');
    expect(await catalogFigures(crop)).toEqual({ list: undefined, search: undefined, featured: undefined, detail: 404 });
  });

  it('BR-100e: cart reservations and pending UPI holds are claims on the shelf; the cart breakdown summed over channels never exceeds it', async () => {
    const { cartRepo } = await import('../cart/cart.repo.js');
    const crop = await newCrop();
    const batch = await newBatch(crop.id);
    const customer = await newCustomerToken();
    expect((await addToCart(customer, crop.id, '2')).status).toBe(201); // ONLINE stores 5 available
    await sell('MARKET', crop.id, '1', 'UPI'); // pending: holds 1 kg of the batch
    await sell('DIRECT', crop.id, '6'); // shelf 10 -> 4; free = 4 - 2 (cart) - 1 (UPI hold) = 1

    expect(await catalogFigures(crop)).toEqual({ list: '1.000', search: '1.000', featured: '1.000', detail: '1.000' });
    const dash = await dashboard(batch.id);
    expect(dash['ONLINE']).toMatchObject({ reservedQtyKg: '2.000', availableQtyKg: '1.000' });
    const breakdown = await cartRepo.getAvailableStockBreakdown(pool, { cropId: crop.id, grade: 'GRADE_1', warehouseId: warehouse });
    expect(breakdown).toMatchObject({ totalAvailable: '1.000', onlineAvailable: '1.000' });

    const other = await newCustomerToken();
    const over = await addToCart(other, crop.id, '1.001');
    expect(over.status).toBe(409);
    expect(over.body.code).toBe('STOCK_UNAVAILABLE');
    expect((await addToCart(other, crop.id, '1')).status).toBe(201);
    const after = await cartRepo.getAvailableStockBreakdown(pool, { cropId: crop.id, grade: 'GRADE_1', warehouseId: warehouse });
    expect(after).toMatchObject({ totalAvailable: '0.000', onlineAvailable: '0.000' });
  });
});
