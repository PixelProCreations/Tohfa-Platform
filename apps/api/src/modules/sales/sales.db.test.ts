/**
 * SWA Module 6 (Direct / Market sales), write side: integration tests against a migrated Postgres,
 * through a local Express app that mounts only `salesRouter` (app.ts is not edited by this module).
 *
 * Every test creates its own crop, so stock, prices and sales of one test never meet another's.
 * Sales are committed (that is what is under test), so isolation from OTHER files is twofold:
 *   - the two warehouses are created by this file (never the seeded WH-OOTY / WH-COON), so no
 *     batch or sale of ours can appear in another file's per-warehouse read while this file runs;
 *   - afterAll removes every committed row reachable from the warehouses, crops, customers, users
 *     and farmer created here (src/test/committedFixtureCleanup.ts). Before this, ACTIVE
 *     'Fixture Crop' batches stayed at WH-COON and broke reports.test.ts BR-64a in a full run.
 */
import { afterAll, beforeAll, expect, it } from 'vitest';
import express, { type Express } from 'express';
import request from 'supertest';
import type { Server } from 'node:http';
import { RoleCode, ScopeLevel, parseMoney } from '@tohfa/shared-types';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import type { pool as poolInstance } from '../../db/pool.js';
import { databaseReady, describeIfDatabase, IDS, newId } from '../../test/factories.js';
import { ensureStandardUsers, insertCrop, insertFarmerWithPlot, randomMobile } from '../../test/dbFixtures.js';
import { removeCommittedFixtures } from '../../test/committedFixtureCleanup.js';
import { listSaleProductsResponse, saleQuoteResponse, saleResponse, customerLookupResponse } from './sales.schema.js';


/** BR-90a: no key from the farmer-identity list at any depth. */
const FARM_KEYS = /^(farmer|farmerId|farmer_id|sourceFarmerId|source_farmer_id|tohfaFarmerId|farmName|farm|farmId|village|gps|lat|lng|latitude|longitude|fmb|fmbNumber|grnFarmerId)$/i;
function farmKeys(value: unknown, path = '$'): string[] {
  if (Array.isArray(value)) return value.flatMap((v, i) => farmKeys(v, `${path}[${i}]`));
  if (value !== null && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) => [
      ...(FARM_KEYS.test(k) ? [`${path}.${k}`] : []),
      ...farmKeys(v, `${path}.${k}`),
    ]);
  }
  return [];
}

describeIfDatabase('Sales write side (PostgreSQL, real HTTP)', () => {
  let pool: typeof poolInstance;
  let app: Express;
  let server: Server;
  let ooty = '';
  let coonoor = '';
  let today = '';
  let farmerId = '';
  const created = { warehouses: [] as string[], crops: [] as string[], customers: [] as string[], users: [] as string[], farmers: [] as string[] };
  const users = { subOoty: '', subCoonoor: '', ta: '' };
  const tokens: Record<string, string> = {};
  let seq = 0;
  // One run id in every Idempotency-Key, so afterAll removes this run's idempotency rows only.
  const RUN_KEY_PREFIX = `ci-sale-${newId().slice(0, 8)}-`;
  const key = (label: string): string => `${RUN_KEY_PREFIX}${Date.now()}-${label}-${(seq += 1)}`;

  beforeAll(async () => {
    if (!(await databaseReady('sale_payments'))) throw new Error('sale_payments is missing: run the migrations (0058-0063)');
    const [{ pool: p }, { signAccessToken }, { salesRouter }, { errorHandler, notFoundHandler }] = await Promise.all([
      import('../../db/pool.js'),
      import('../../auth/jwt.js'),
      import('./sales.routes.js'),
      import('../../http/errorHandler.js'),
    ]);
    pool = p;
    app = express();
    app.use(express.json());
    app.use('/v1/admin/sales', salesRouter);
    app.use(notFoundHandler);
    app.use(errorHandler);
    server = app.listen(0);

    // Private warehouses (names kept: "ooty" is the acting Sub admin's, "coonoor" another one).
    for (const label of ['ooty', 'coonoor'] as const) {
      const id = newId();
      await pool.query(`INSERT INTO warehouses (id, code, name, type) VALUES ($1, $2, $3, 'SUB')`, [
        id,
        `WH-CI-SALE-${id.slice(0, 8)}`,
        `CI Sales ${label}`,
      ]);
      created.warehouses.push(id);
      if (label === 'ooty') ooty = id;
      else coonoor = id;
    }
    today = (await pool.query<{ d: string }>(`SELECT ((now() AT TIME ZONE 'Asia/Kolkata')::date)::text AS d`)).rows[0]!.d;
    await ensureStandardUsers(pool, 'userSuperAdmin');
    for (const field of ['subOoty', 'subCoonoor', 'ta'] as const) {
      const row = await pool.query<{ id: string }>(
        `INSERT INTO users (mobile, full_name, user_type, status) VALUES ($1, $2, 'ADMIN', 'ACTIVE') RETURNING id`,
        [randomMobile(), `CI Sales ${field}`],
      );
      users[field] = row.rows[0]!.id;
      created.users.push(row.rows[0]!.id);
    }
    const farmer = await insertFarmerWithPlot(pool);
    farmerId = farmer.farmerId;
    created.farmers.push(farmer.farmerId);
    created.users.push(farmer.userId);

    const base = { farmerId: null, customerId: null };
    tokens['sa'] = signAccessToken({ sub: IDS.userSuperAdmin, roles: [{ code: RoleCode.SUPER_ADMIN }], ...base });
    tokens['ta'] = signAccessToken({ sub: users.ta, roles: [{ code: RoleCode.TOHFA_ADMIN }], ...base });
    tokens['main'] = signAccessToken({ sub: users.ta, roles: [{ code: RoleCode.MAIN_WH_ADMIN }], ...base });
    tokens['subOoty'] = signAccessToken({ sub: users.subOoty, roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: ooty }], ...base });
    tokens['subCoonoor'] = signAccessToken({ sub: users.subCoonoor, roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: coonoor }], ...base });
    tokens['farmer'] = signAccessToken({ sub: users.ta, roles: [{ code: RoleCode.FARMER }], farmerId: newId(), customerId: null });
    tokens['customer'] = signAccessToken({ sub: users.ta, roles: [{ code: RoleCode.CUSTOMER }], farmerId: null, customerId: newId() });
    tokens['farmerAdmin'] = signAccessToken({ sub: users.ta, roles: [{ code: RoleCode.FARMER_ADMIN, zoneId: newId() }], ...base });
  });

  afterAll(async () => {
    const [{ closePool, withTransaction }, { closeRedis }] = await Promise.all([import('../../db/pool.js'), import('../../redis.js')]);
    await new Promise<void>((resolve) => server.close(() => resolve()));
    try {
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
  });

  // -------------------------------------------------------------------------
  // fixtures
  // -------------------------------------------------------------------------
  const auth = (name: string): string => `Bearer ${tokens[name]!}`;

  async function newCrop(opts: { ceiling?: string; retail?: string; grade?: string } = {}): Promise<string> {
    const crop = await insertCrop(pool);
    created.crops.push(crop);
    const grade = opts.grade ?? 'GRADE_1';
    if (opts.ceiling !== undefined) {
      await pool.query(
        `INSERT INTO fair_prices (crop_id, grade, ceiling_price, effective_from, set_by) VALUES ($1, $2, $3, $4::date - 1, $5)`,
        [crop, grade, opts.ceiling, today, IDS.userSuperAdmin],
      );
    }
    if (opts.retail !== undefined) {
      await pool.query(
        `INSERT INTO retail_prices (crop_id, grade, price, effective_from, set_by) VALUES ($1, $2, $3, $4::date - 1, $5)`,
        [crop, grade, opts.retail, today, IDS.userSuperAdmin],
      );
    }
    return crop;
  }

  interface BatchOptions {
    crop: string;
    qty: string;
    warehouse?: string;
    expiryOffsetDays?: number | null;
    status?: string;
    allocations?: Partial<Record<'ONLINE' | 'LIVE_MARKET' | 'RESERVE' | 'BUFFER', string>>;
  }

  /** A batch whose stock arrives through a RECEIPT ledger row, as in production (qty_available is trigger-maintained). */
  async function newBatch(opts: BatchOptions): Promise<{ id: string; code: string; allocations: Record<string, string> }> {
    const id = newId();
    const code = `B-CI-${id.slice(0, 8)}`;
    const warehouse = opts.warehouse ?? ooty;
    await pool.query(
      `INSERT INTO inventory_batches (id, batch_code, warehouse_id, crop_id, grade, source_farmer_id, qty_received, qty_available,
                                      storage_location, expiry_on, status)
       VALUES ($1, $2, $3, $4, 'GRADE_1', $5, $6, 0, 'Cold room 2', CASE WHEN $7::int IS NULL THEN NULL ELSE $8::date + $7::int END, $9)`,
      [id, code, warehouse, opts.crop, farmerId, opts.qty, opts.expiryOffsetDays ?? null, today, opts.status ?? 'ACTIVE'],
    );
    await pool.query(
      `INSERT INTO stock_ledger (batch_id, warehouse_id, movement_type, qty_delta, balance_after, ref_type, remarks)
       VALUES ($1, $2, 'RECEIPT', $3, 0, 'TEST', 'fixture receipt')`,
      [id, warehouse, opts.qty],
    );
    const allocations: Record<string, string> = {};
    for (const [channel, qty] of Object.entries(opts.allocations ?? {})) {
      const row = await pool.query<{ id: string }>(
        `INSERT INTO allocations (batch_id, warehouse_id, channel, allocated_qty) VALUES ($1, $2, $3, $4) RETURNING id`,
        [id, warehouse, channel, qty],
      );
      allocations[channel] = row.rows[0]!.id;
    }
    return { id, code, allocations };
  }

  async function newCustomer(opts: { preferred?: string | null; balance?: string } = {}): Promise<{ id: string; code: string; mobile: string; walletId: string | null }> {
    const mobile = randomMobile();
    const user = await pool.query<{ id: string }>(
      `INSERT INTO users (mobile, full_name, user_type, status) VALUES ($1, 'CI Sale Customer', 'CUSTOMER', 'ACTIVE') RETURNING id`,
      [mobile],
    );
    const code = `CUST-CI-${newId().slice(0, 8)}`;
    const customer = await pool.query<{ id: string }>(
      `INSERT INTO customers (user_id, customer_code, preferred_warehouse_id) VALUES ($1, $2, $3) RETURNING id`,
      [user.rows[0]!.id, code, opts.preferred === undefined ? ooty : opts.preferred],
    );
    const id = customer.rows[0]!.id;
    created.customers.push(id);
    created.users.push(user.rows[0]!.id);
    let walletId: string | null = null;
    if (opts.balance !== undefined) {
      const { walletService } = await import('../wallet/wallet.service.js');
      const txn = await walletService.move(
        { level: ScopeLevel.ALL, permission: 'test', roleCode: RoleCode.SUPER_ADMIN, warehouseIds: [], zoneIds: [], userId: IDS.userSuperAdmin },
        { customerId: id, direction: 'CREDIT', type: 'TOPUP_DIGITAL', amount: parseMoney(opts.balance), idempotencyKey: `ci-sale-seed-${newId()}` },
      );
      walletId = txn.walletId;
    }
    return { id, code, mobile, walletId };
  }

  const item = (crop: string, qtyKg: string) => ({ productId: crop, grade: 'GRADE_1', qtyKg });

  async function quote(token: string, channel: string, items: unknown[]) {
    return request(server).post('/v1/admin/sales/quote').set('Authorization', auth(token)).send({ channel, items });
  }

  async function sell(token: string, body: Record<string, unknown>, idempotencyKey: string = key('sale')) {
    return request(server).post('/v1/admin/sales').set('Authorization', auth(token)).set('Idempotency-Key', idempotencyKey).send(body);
  }

  const one = async (sql: string, params: unknown[] = []): Promise<string> =>
    String(Object.values((await pool.query(sql, params)).rows[0] ?? { v: null })[0]);

  const orderCountForCrop = (crop: string): Promise<string> =>
    one(`SELECT count(DISTINCT order_id)::text FROM order_items WHERE crop_id = $1`, [crop]);
  const attemptCount = (): Promise<string> => one(`SELECT count(*)::text FROM sale_attempts`);
  const qtyAvailable = (batch: string): Promise<string> => one(`SELECT qty_available::text FROM inventory_batches WHERE id = $1`, [batch]);
  const ledgerSum = (batch: string): Promise<string> => one(`SELECT COALESCE(sum(qty_delta), 0)::text FROM stock_ledger WHERE batch_id = $1`, [batch]);

  function subScope(warehouse: string, userId: string, permission = 'sales.sale.create'): ResolvedScope {
    return { level: ScopeLevel.OWN, permission, roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds: [warehouse], zoneIds: [], userId };
  }

  // -------------------------------------------------------------------------
  // authorization
  // -------------------------------------------------------------------------
  it('BR-85b: POST /sales, POST /sales/quote, GET /sales/products and GET /sales/customers/lookup: 401 anonymous; 403 FARMER, FARMER_ADMIN, CUSTOMER, MAIN_WH_ADMIN; Sub, TOHFA and Super Admin reach the handler', async () => {
    const routes: Array<{ method: 'get' | 'post'; path: string; body?: object }> = [
      { method: 'get', path: '/v1/admin/sales/products?channel=DIRECT' },
      { method: 'get', path: '/v1/admin/sales/customers/lookup?code=NOPE' },
      { method: 'post', path: '/v1/admin/sales/quote', body: { channel: 'DIRECT', items: [item(newId(), '1')] } },
      { method: 'post', path: '/v1/admin/sales', body: { channel: 'DIRECT', walkIn: { name: 'x' }, items: [item(newId(), '1')], expectedTotal: '1.00', payment: { method: 'CASH', amountReceived: '1.00' } } },
    ];
    for (const { method, path, body } of routes) {
      expect((await request(server)[method](path).send(body)).status, `${path} anonymous`).toBe(401);
      for (const role of ['farmer', 'farmerAdmin', 'customer', 'main']) {
        const res = await request(server)[method](path).set('Authorization', auth(role)).set('Idempotency-Key', key('deny')).send(body);
        expect(res.status, `${method} ${path} as ${role}`).toBe(403);
        expect(res.headers['content-type']).toContain('application/problem+json');
      }
      for (const role of ['subOoty', 'ta', 'sa']) {
        const res = await request(server)[method](path).set('Authorization', auth(role)).set('Idempotency-Key', key('reach')).send(body);
        expect([401, 403], `${method} ${path} as ${role}: ${JSON.stringify(res.body)}`).not.toContain(res.status);
      }
    }
  });

  it('BR-94h: POST /sales/{id}/payments/upi/confirm: 401 anonymous; 403 MAIN_WH_ADMIN, FARMER, FARMER_ADMIN, CUSTOMER; another warehouse\'s sale is 404 for a Sub admin', async () => {
    const path = `/v1/admin/sales/${newId()}/payments/upi/confirm`;
    expect((await request(server).post(path).send({ upiTxnRef: 'x' })).status).toBe(401);
    for (const role of ['main', 'farmer', 'farmerAdmin', 'customer']) {
      expect((await request(server).post(path).set('Authorization', auth(role)).set('Idempotency-Key', key('d')).send({ upiTxnRef: 'x' })).status, role).toBe(403);
    }
    const crop = await newCrop({ ceiling: '20.00' });
    await newBatch({ crop, qty: '5' });
    const sale = await sell('subOoty', { channel: 'DIRECT', walkIn: { name: 'UPI Buyer' }, items: [item(crop, '1')], expectedTotal: '20.00', payment: { method: 'UPI' } });
    expect(sale.status, JSON.stringify(sale.body)).toBe(201);
    const cross = await request(server)
      .post(`/v1/admin/sales/${sale.body.id as string}/payments/upi/confirm`)
      .set('Authorization', auth('subCoonoor'))
      .set('Idempotency-Key', key('cross'))
      .send({ upiTxnRef: 'pay_cross' });
    expect(cross.status).toBe(404);
    const unknown = await request(server).post(path).set('Authorization', auth('subOoty')).set('Idempotency-Key', key('u')).send({ upiTxnRef: 'x' });
    expect(unknown.status).toBe(404);
    // Same code and same wording for "not yours" and "does not exist" (BR-30).
    expect(cross.body.code).toBe(unknown.body.code);
    expect(cross.body.detail).toBe(`No sale with id ${sale.body.id as string} is visible to you.`);
  });

  // -------------------------------------------------------------------------
  // products and quote
  // -------------------------------------------------------------------------
  it('BR-95a / BR-90a: products?channel=MARKET is the LIVE_MARKET allocation; channel=DIRECT is ALL pooled ACTIVE stock (not bucket-limited); no farm identity anywhere', async () => {
    const crop = await newCrop({ ceiling: '30.00', retail: '25.00' });
    const batch = await newBatch({ crop, qty: '10', allocations: { ONLINE: '6', LIVE_MARKET: '2', RESERVE: '1', BUFFER: '1' } });
    const all: unknown[] = [];
    const find = async (channel: string) => {
      for (let cursor: string | null = null, page = 0; page < 50; page += 1) {
        const res = await request(server)
          .get('/v1/admin/sales/products')
          .query({ channel, limit: 100, ...(cursor === null ? {} : { cursor }) })
          .set('Authorization', auth('subOoty'));
        expect(res.status, JSON.stringify(res.body)).toBe(200);
        expect(listSaleProductsResponse.safeParse(res.body).success, JSON.stringify(res.body).slice(0, 400)).toBe(true);
        all.push(res.body);
        const hit = (res.body.items as Array<{ productId: string }>).find((p) => p.productId === crop);
        if (hit !== undefined) return hit as Record<string, unknown>;
        cursor = res.body.page.nextCursor as string | null;
        if (cursor === null) return undefined;
      }
      return undefined;
    };
    const market = await find('MARKET');
    expect(market).toMatchObject({ availableQtyKg: '2.000', unitPrice: '25.00', grade: 'GRADE_1', unit: 'kg', batchCode: batch.code, storageLocation: 'Cold room 2' });
    const direct = await find('DIRECT');
    // Owner decision 2026-10-11: DIRECT is the whole batch, not what is left after ONLINE/LIVE_MARKET.
    expect(direct).toMatchObject({ availableQtyKg: '10.000', unitPrice: '25.00' });
    // Another warehouse's Sub admin does not see this warehouse's stock.
    const other = await request(server).get('/v1/admin/sales/products').query({ channel: 'DIRECT', q: 'Fixture', limit: 100 }).set('Authorization', auth('subCoonoor'));
    expect((other.body.items as Array<{ productId: string }>).some((p) => p.productId === crop)).toBe(false);
    for (const body of all) expect(farmKeys(body)).toEqual([]);
    expect(JSON.stringify(all)).not.toContain(farmerId);
    expect(JSON.stringify(all)).not.toContain('Fixture Farm');
    // BR-95g on the real route.
    for (const channel of ['HORECA', 'B2B', 'nope']) {
      expect((await request(server).get('/v1/admin/sales/products').query({ channel }).set('Authorization', auth('subOoty'))).status).toBe(422);
    }
  });

  it('BR-89a / BR-89f / BR-90a: a quote above stock is 409 SALE_STOCK_CHANGED; a valid quote is integer-paise lines and total; quoting writes nothing', async () => {
    const crop = await newCrop({ ceiling: '45.50' });
    await newBatch({ crop, qty: '2.5' });
    const before = { attempts: await attemptCount(), orders: await orderCountForCrop(crop) };
    const tooMuch = await quote('subOoty', 'DIRECT', [item(crop, '2.501')]);
    expect(tooMuch.status).toBe(409);
    expect(tooMuch.body.code).toBe('SALE_STOCK_CHANGED');
    expect(tooMuch.body.meta.lines).toEqual([{ productId: crop, grade: 'GRADE_1', requestedQtyKg: '2.501', availableQtyKg: '2.500' }]);
    const ok = await quote('subOoty', 'DIRECT', [item(crop, '1.25')]);
    expect(ok.status, JSON.stringify(ok.body)).toBe(200);
    expect(saleQuoteResponse.safeParse(ok.body).success).toBe(true);
    expect(ok.body.lines).toEqual([{ productId: crop, name: 'Fixture Crop', grade: 'GRADE_1', qtyKg: '1.250', unitPrice: '45.50', lineTotal: '56.88' }]);
    expect(ok.body.totals).toEqual({ subtotal: '56.88', gst: '0.00', total: '56.88', changeGiven: null });
    expect(farmKeys(ok.body)).toEqual([]);
    // A successful quote and a refused one both leave orders and sale_attempts untouched.
    expect(await attemptCount()).toBe(before.attempts);
    expect(await orderCountForCrop(crop)).toBe(before.orders);
  });

  it('BR-95h / BR-85f: a product this warehouse never stocked is 404; a Sub admin naming another warehouse is 404, never 403', async () => {
    const crop = await newCrop({ ceiling: '10.00' });
    await newBatch({ crop, qty: '5', warehouse: coonoor });
    expect((await quote('subOoty', 'DIRECT', [item(crop, '1')])).status).toBe(404);
    const res = await request(server)
      .post('/v1/admin/sales/quote')
      .set('Authorization', auth('subOoty'))
      .send({ channel: 'DIRECT', items: [item(crop, '1')], warehouseId: coonoor });
    expect(res.status).toBe(404);
    const created = await sell('subOoty', { channel: 'DIRECT', walkIn: { name: 'X' }, items: [item(crop, '1')], expectedTotal: '10.00', payment: { method: 'CASH', amountReceived: '10.00' }, warehouseId: coonoor });
    expect(created.status).toBe(404);
    expect(await orderCountForCrop(crop)).toBe('0');
    // Super Admin (scope all) must name the warehouse, and may sell at any.
    const sa = await request(server).post('/v1/admin/sales/quote').set('Authorization', auth('sa')).send({ channel: 'DIRECT', items: [item(crop, '1')], warehouseId: coonoor });
    expect(sa.status, JSON.stringify(sa.body)).toBe(200);
  });

  // -------------------------------------------------------------------------
  // creating sales
  // -------------------------------------------------------------------------
  it('BR-85d / BR-95e / BR-95f / BR-89e / BR-87d / BR-94b: a DIRECT CASH sale is PICKED_UP/PAID at insert, draws FEFO across two batches, skips expired and non-ACTIVE batches, writes SALE ledger rows, an invoice and one PII-free audit row', async () => {
    const crop = await newCrop({ ceiling: '123.45' });
    const later = await newBatch({ crop, qty: '2', expiryOffsetDays: 5 });
    const sooner = await newBatch({ crop, qty: '0.4', expiryOffsetDays: 2 });
    const expired = await newBatch({ crop, qty: '5', expiryOffsetDays: -1 });
    const writtenOff = await newBatch({ crop, qty: '5', expiryOffsetDays: 1, status: 'WRITTEN_OFF' });
    const q = await quote('subOoty', 'DIRECT', [item(crop, '1')]);
    expect(q.body.totals.total).toBe('123.45');

    const res = await sell('subOoty', {
      channel: 'DIRECT',
      walkIn: { name: 'Lakshmi Counter', mobile: '+919812300011' },
      items: [item(crop, '1')],
      expectedTotal: q.body.totals.total,
      payment: { method: 'CASH', amountReceived: '200.00' },
    });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    expect(saleResponse.safeParse(res.body).success, JSON.stringify(res.body)).toBe(true);
    expect(farmKeys(res.body)).toEqual([]);
    expect(res.body).toMatchObject({
      channel: 'DIRECT',
      status: 'PICKED_UP',
      paymentStatus: 'PAID',
      warehouseId: ooty,
      buyer: { kind: 'WALK_IN', customerId: null, name: 'Lakshmi Counter', mobileMasked: '*********0011' },
      items: [{ productId: crop, qtyKg: '1.000', unitPrice: '123.45', lineTotal: '123.45' }],
      totals: { subtotal: '123.45', gst: '0.00', total: '123.45', changeGiven: '76.55' },
      payment: { method: 'CASH', status: 'CONFIRMED', amount: '123.45', amountReceived: '200.00' },
    });
    expect(res.body.completedAt).not.toBeNull();
    expect(res.body.invoiceNumber).toMatch(/^TOH\/\d{4}-\d{2}\/R\/\d{6,}$/);
    expect(JSON.stringify(res.body)).not.toContain('9812300011');
    const orderId = res.body.id as string;

    const ledger = await pool.query<{ batch_id: string; qty_delta: string }>(
      `SELECT batch_id, qty_delta::text FROM stock_ledger WHERE ref_type = 'ORDER' AND ref_id = $1 AND movement_type = 'SALE' ORDER BY qty_delta`,
      [orderId],
    );
    expect(ledger.rows).toEqual(
      expect.arrayContaining([
        { batch_id: sooner.id, qty_delta: '-0.400' },
        { batch_id: later.id, qty_delta: '-0.600' },
      ]),
    );
    expect(ledger.rows).toHaveLength(2);
    expect(await qtyAvailable(sooner.id)).toBe('0.000');
    expect(await qtyAvailable(later.id)).toBe('1.400');
    for (const b of [sooner, later, expired, writtenOff]) expect(await qtyAvailable(b.id)).toBe(await ledgerSum(b.id));
    expect(await qtyAvailable(expired.id)).toBe('5.000');
    expect(await qtyAvailable(writtenOff.id)).toBe('5.000');

    const items = await pool.query(`SELECT batch_id, allocation_id, status, fulfilled_qty_kg::text AS f FROM order_items WHERE order_id = $1`, [orderId]);
    expect(items.rows.every((r) => r.batch_id !== null && r.allocation_id === null && r.status === 'FULFILLED')).toBe(true);
    const order = await pool.query(`SELECT status::text, payment_status, completed_at, customer_id, walk_in_name, fulfilment_type::text FROM orders WHERE id = $1`, [orderId]);
    expect(order.rows[0]).toMatchObject({ status: 'PICKED_UP', payment_status: 'PAID', customer_id: null, walk_in_name: 'Lakshmi Counter', fulfilment_type: 'PICKUP' });
    expect(order.rows[0].completed_at).not.toBeNull();
    expect(await one(`SELECT count(*)::text FROM order_status_history WHERE order_id = $1 AND to_status = 'PICKED_UP'`, [orderId])).toBe('1');
    expect(await one(`SELECT change_given::text FROM sale_payments WHERE order_id = $1`, [orderId])).toBe('76.55');
    expect(await one(`SELECT count(*)::text FROM invoices WHERE order_id = $1 AND invoice_type = 'SALE_RETAIL'`, [orderId])).toBe('1');

    const audit = await pool.query<{ after: Record<string, unknown>; actor_id: string; warehouse_id: string }>(
      `SELECT after, actor_id, warehouse_id FROM audit_log WHERE entity_id = $1 AND action_code = 'sales.sale.create'`,
      [orderId],
    );
    expect(audit.rows).toHaveLength(1);
    expect(audit.rows[0]).toMatchObject({ actor_id: users.subOoty, warehouse_id: ooty });
    expect(audit.rows[0]!.after).toMatchObject({ orderId, total: '123.45', paymentMethod: 'CASH' });
    expect(JSON.stringify(audit.rows[0]!.after)).not.toMatch(/Lakshmi|9812300011/);
  });

  it('BR-95b / BR-95c: a MARKET sale consumes the LIVE_MARKET allocation and the batch; above the allocation is 409 although pooled stock exists; a DIRECT sale leaves the LIVE_MARKET allocation untouched', async () => {
    const crop = await newCrop({ ceiling: '10.00' });
    const batch = await newBatch({ crop, qty: '10', allocations: { ONLINE: '6', LIVE_MARKET: '2', RESERVE: '1', BUFFER: '1' } });
    const lm = batch.allocations['LIVE_MARKET']!;
    const consumed = (): Promise<string> => one(`SELECT consumed_qty::text FROM allocations WHERE id = $1`, [lm]);

    const market = await sell('subOoty', { channel: 'MARKET', walkIn: { name: 'Market Buyer' }, items: [item(crop, '1.5')], expectedTotal: '15.00', payment: { method: 'CASH', amountReceived: '15.00' } });
    expect(market.status, JSON.stringify(market.body)).toBe(201);
    expect(market.body.totals.changeGiven).toBe('0.00');
    expect(await consumed()).toBe('1.500');
    expect(await one(`SELECT allocation_id::text FROM order_items WHERE order_id = $1`, [market.body.id])).toBe(lm);
    expect(await qtyAvailable(batch.id)).toBe('8.500');

    const before = await attemptCount();
    const over = await sell('subOoty', { channel: 'MARKET', walkIn: { name: 'Market Buyer' }, items: [item(crop, '1')], expectedTotal: '10.00', payment: { method: 'CASH', amountReceived: '10.00' } });
    expect(over.status).toBe(409);
    expect(over.body.code).toBe('SALE_STOCK_CHANGED');
    expect(Number(await attemptCount())).toBe(Number(before) + 1);
    expect(await qtyAvailable(batch.id)).toBe('8.500');

    const direct = await sell('subOoty', { channel: 'DIRECT', walkIn: { name: 'Counter' }, items: [item(crop, '2')], expectedTotal: '20.00', payment: { method: 'CARD', cardRef: 'POS-1' } });
    expect(direct.status, JSON.stringify(direct.body)).toBe(201);
    expect(await consumed()).toBe('1.500');
    expect(await qtyAvailable(batch.id)).toBe('6.500');
    // DIRECT is not bucket-limited (owner decision 2026-10-11): the remaining 6.5 kg is all sellable
    // at the counter although ONLINE (6) and the rest of LIVE_MARKET (0.5) were allocated; one gram
    // more is refused.
    const overDirect = await quote('subOoty', 'DIRECT', [item(crop, '6.501')]);
    expect(overDirect.status).toBe(409);
    expect(overDirect.body.meta.lines[0].availableQtyKg).toBe('6.500');
    expect((await quote('subOoty', 'DIRECT', [item(crop, '6.5')])).status).toBe(200);
    expect(await one(`SELECT consumed_qty::text FROM allocations WHERE id = $1`, [batch.allocations['ONLINE']!])).toBe('0.000');
  });

  it('BR-95i: a DIRECT sale draws beyond the 20% non-online share up to total pooled stock minus pending UPI holds (DIRECT and MARKET), never beyond, never negative; no allocation row moves', async () => {
    const crop = await newCrop({ ceiling: '10.00' });
    const batch = await newBatch({ crop, qty: '10', allocations: { ONLINE: '7', LIVE_MARKET: '1', RESERVE: '1', BUFFER: '1' } });
    const allocationRows = (): Promise<string> =>
      one(`SELECT string_agg(channel || ':' || consumed_qty::text || '/' || reserved_qty::text, ',' ORDER BY channel) FROM allocations WHERE batch_id = $1`, [batch.id]);
    // A pending MARKET UPI sale holds 1 kg of the batch (through its LIVE_MARKET allocation).
    const held = await sell('subOoty', { channel: 'MARKET', walkIn: { name: 'Market UPI' }, items: [item(crop, '1')], expectedTotal: '10.00', payment: { method: 'UPI' } });
    expect(held.status, JSON.stringify(held.body)).toBe(201);
    const before = await allocationRows();

    const q = await quote('subOoty', 'DIRECT', [item(crop, '9.001')]);
    expect(q.status).toBe(409);
    expect(q.body.meta.lines[0].availableQtyKg).toBe('9.000');

    // 8 kg: four times the 20% (2 kg) that is not allocated to ONLINE.
    const big = await sell('subOoty', { channel: 'DIRECT', walkIn: { name: 'Function order' }, items: [item(crop, '8')], expectedTotal: '80.00', payment: { method: 'CASH', amountReceived: '80.00' } });
    expect(big.status, JSON.stringify(big.body)).toBe(201);
    expect(await qtyAvailable(batch.id)).toBe('2.000');
    expect(await allocationRows()).toBe(before);

    // 2 kg left on the shelf, 1 kg of it held by the pending UPI: 1 kg sellable, 1.001 is not.
    const over = await sell('subOoty', { channel: 'DIRECT', walkIn: { name: 'Counter' }, items: [item(crop, '1.001')], expectedTotal: '10.01', payment: { method: 'CASH', amountReceived: '10.01' } });
    expect(over.status).toBe(409);
    expect(over.body.code).toBe('SALE_STOCK_CHANGED');
    expect(await qtyAvailable(batch.id)).toBe('2.000');
    expect(await ledgerSum(batch.id)).toBe('2.000');
  });

  it('BR-95j: two concurrent DIRECT sales for the last kilogram beyond the allocation share: one 201, one 409; stock never negative', async () => {
    const crop = await newCrop({ ceiling: '10.00' });
    const batch = await newBatch({ crop, qty: '10', allocations: { ONLINE: '7', LIVE_MARKET: '1', RESERVE: '1', BUFFER: '1' } });
    const first = await sell('subOoty', { channel: 'DIRECT', walkIn: { name: 'Counter' }, items: [item(crop, '9')], expectedTotal: '90.00', payment: { method: 'CASH', amountReceived: '90.00' } });
    expect(first.status, JSON.stringify(first.body)).toBe(201);
    const body = { channel: 'DIRECT', walkIn: { name: 'Race' }, items: [item(crop, '1')], expectedTotal: '10.00', payment: { method: 'CASH', amountReceived: '10.00' } };
    const results = await Promise.all([sell('subOoty', body), sell('subOoty', body)]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(results.find((r) => r.status === 409)!.body.code).toBe('SALE_STOCK_CHANGED');
    expect(await qtyAvailable(batch.id)).toBe('0.000');
    expect(await ledgerSum(batch.id)).toBe('0.000');
  });

  it('BR-95k: after DIRECT sales drew the stock an ONLINE allocation was counting on, the ONLINE checkout ledger movement fails with 409 STOCK_UNAVAILABLE (never negative stock, nothing written); MARKET is capped by the shelf', async () => {
    const [{ ordersRepo }, { withTransaction }] = await Promise.all([import('../orders/orders.repo.js'), import('../../db/pool.js')]);
    const crop = await newCrop({ ceiling: '10.00' });
    const batch = await newBatch({ crop, qty: '10', allocations: { ONLINE: '7', LIVE_MARKET: '1', RESERVE: '1', BUFFER: '1' } });
    const online = batch.allocations['ONLINE']!;
    const sold = await sell('subOoty', { channel: 'DIRECT', walkIn: { name: 'Counter' }, items: [item(crop, '9.5')], expectedTotal: '95.00', payment: { method: 'CASH', amountReceived: '95.00' } });
    expect(sold.status, JSON.stringify(sold.body)).toBe(201);
    expect(await qtyAvailable(batch.id)).toBe('0.500');
    // A DIRECT sale writes no allocation row, so the STORED ONLINE figure is still 7 kg; every
    // availability read caps it by the shelf (BR-100), so what is offered online is the 0.5 kg left.
    expect(await one(`SELECT available_qty::text FROM allocations WHERE id = $1`, [online])).toBe('7.000');
    const { allocationsRepo } = await import('../allocations/allocations.repo.js');
    expect(await allocationsRepo.getAvailableQuantityForChannel(pool, ooty, crop, 'ONLINE')).toBe('0.500');
    // MARKET reads the shelf as well as its allocation, so it offers 0.5 kg, not 1.
    const market = await quote('subOoty', 'MARKET', [item(crop, '1')]);
    expect(market.status).toBe(409);
    expect(market.body.meta.lines[0].availableQtyKg).toBe('0.500');

    // The online checkout's stock step for 2 kg against the 0.5 kg remainder.
    const error = await withTransaction((tx) =>
      ordersRepo.convertAllocationsAndAppendStockLedger(
        tx,
        [{ id: newId(), cartId: newId(), productId: crop, name: 'Fixture Crop', grade: 'GRADE_1', qtyKg: '2.000', unitPrice: '10.00', lineTotal: '20.00', allocationId: online, batchId: batch.id }],
        newId(),
        ooty,
        users.subOoty,
      ),
    ).catch((e: unknown) => e as { status?: number; code?: string });
    expect(error).toMatchObject({ status: 409, code: 'STOCK_UNAVAILABLE' });
    expect(await qtyAvailable(batch.id)).toBe('0.500');
    expect(await ledgerSum(batch.id)).toBe('0.500');
    expect(await one(`SELECT consumed_qty::text FROM allocations WHERE id = $1`, [online])).toBe('0.000');
  });

  it('BR-88b / BR-88c / BR-88f: a WALLET sale debits once inside the sale; a replay returns the same sale and moves no money; a reused key with another body is 409; balance equals the ledger', async () => {
    const crop = await newCrop({ ceiling: '45.50' });
    await newBatch({ crop, qty: '10' });
    const customer = await newCustomer({ balance: '100.00' });
    const body = { channel: 'DIRECT', customer: { customerId: customer.id }, items: [item(crop, '1')], expectedTotal: '45.50', payment: { method: 'WALLET' } };
    const k = key('wallet');
    const first = await sell('subOoty', body, k);
    expect(first.status, JSON.stringify(first.body)).toBe(201);
    expect(first.body.buyer).toMatchObject({ kind: 'CUSTOMER', customerId: customer.id, customerCode: customer.code });
    expect(first.body.buyer.mobileMasked).toBe(`${'*'.repeat(customer.mobile.length - 4)}${customer.mobile.slice(-4)}`);
    const replay = await sell('subOoty', body, k);
    expect(replay.status).toBe(201);
    expect(replay.body).toEqual(first.body);
    const reused = await sell('subOoty', { ...body, items: [item(crop, '2')], expectedTotal: '91.00' }, k);
    expect(reused.status).toBe(409);
    expect(reused.body.code).toBe('IDEMPOTENCY_KEY_REUSED');

    const debits = await pool.query(`SELECT amount::text, type::text FROM wallet_transactions WHERE wallet_id = $1 AND direction = 'DEBIT'`, [customer.walletId]);
    expect(debits.rows).toEqual([{ amount: '45.50', type: 'ORDER_DEBIT' }]);
    expect(await one(`SELECT balance::text FROM wallets WHERE id = $1`, [customer.walletId])).toBe('54.50');
    expect(await one(`SELECT (SELECT balance FROM wallets WHERE id = $1) = COALESCE(sum(CASE WHEN direction = 'CREDIT' THEN amount ELSE -amount END), 0) FROM wallet_transactions WHERE wallet_id = $1`, [customer.walletId])).toBe('true');
    expect(await orderCountForCrop(crop)).toBe('1');
  });

  it('BR-88d: concurrent requests with the same key create one sale and move money once', async () => {
    const crop = await newCrop({ ceiling: '10.00' });
    await newBatch({ crop, qty: '10' });
    const customer = await newCustomer({ balance: '50.00' });
    const body = { channel: 'DIRECT', customer: { customerId: customer.id }, items: [item(crop, '1')], expectedTotal: '10.00', payment: { method: 'WALLET' } };
    const k = key('concurrent');
    const [a, b] = await Promise.all([sell('subOoty', body, k), sell('subOoty', body, k)]);
    expect([a.status, b.status]).toEqual([201, 201]);
    expect(a.body.id).toBe(b.body.id);
    expect(await one(`SELECT count(*)::text FROM wallet_transactions WHERE wallet_id = $1 AND direction = 'DEBIT'`, [customer.walletId])).toBe('1');
    expect(await one(`SELECT balance::text FROM wallets WHERE id = $1`, [customer.walletId])).toBe('40.00');
    expect(await orderCountForCrop(crop)).toBe('1');
  });

  it('BR-88e: insufficient wallet balance is 422 WALLET_INSUFFICIENT; balance, ledger, stock and orders unchanged; one sale_attempts row', async () => {
    const crop = await newCrop({ ceiling: '45.50' });
    const batch = await newBatch({ crop, qty: '10' });
    const customer = await newCustomer({ balance: '10.00' });
    const before = await attemptCount();
    const res = await sell('subOoty', { channel: 'DIRECT', customer: { customerId: customer.id }, items: [item(crop, '1')], expectedTotal: '45.50', payment: { method: 'WALLET' } });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('WALLET_INSUFFICIENT');
    expect(await one(`SELECT balance::text FROM wallets WHERE id = $1`, [customer.walletId])).toBe('10.00');
    expect(await one(`SELECT count(*)::text FROM wallet_transactions WHERE wallet_id = $1 AND direction = 'DEBIT'`, [customer.walletId])).toBe('0');
    expect(await qtyAvailable(batch.id)).toBe('10.000');
    expect(await orderCountForCrop(crop)).toBe('0');
    expect(Number(await attemptCount())).toBe(Number(before) + 1);
    expect(await one(`SELECT reason_code FROM sale_attempts ORDER BY created_at DESC LIMIT 1`)).toBe('WALLET_INSUFFICIENT');
  });

  it('BR-86c / BR-86d / BR-86f / BR-94c: a walk-in paying by WALLET is 422 and logged; a walk-in may pay CASH, CARD (reference stored) and UPI; no wallet row is touched', async () => {
    const crop = await newCrop({ ceiling: '10.00' });
    await newBatch({ crop, qty: '10' });
    const wallets = await one(`SELECT count(*)::text FROM wallets`);
    const walletTxns = await one(`SELECT count(*)::text FROM wallet_transactions`);
    const before = await attemptCount();
    const base = { channel: 'DIRECT', walkIn: { name: 'Walk In', mobile: '+919800011122' }, items: [item(crop, '1')], expectedTotal: '10.00' };
    const wallet = await sell('subOoty', { ...base, payment: { method: 'WALLET' } });
    expect(wallet.status).toBe(422);
    expect(wallet.body.code).toBe('WALKIN_WALLET_NOT_ALLOWED');
    expect(wallet.headers['content-type']).toContain('application/problem+json');
    expect(Number(await attemptCount())).toBe(Number(before) + 1);
    const attempt = await pool.query<{ payload: unknown; actor_id: string; warehouse_id: string }>(`SELECT payload, actor_id, warehouse_id FROM sale_attempts ORDER BY created_at DESC LIMIT 1`);
    expect(attempt.rows[0]).toMatchObject({ actor_id: users.subOoty, warehouse_id: ooty });
    expect(JSON.stringify(attempt.rows[0]!.payload)).not.toMatch(/9800011122|Walk In/);
    expect(await orderCountForCrop(crop)).toBe('0');

    const cash = await sell('subOoty', { ...base, payment: { method: 'CASH', amountReceived: '10.00' } });
    const card = await sell('subOoty', { ...base, payment: { method: 'CARD', cardRef: 'POS-REF-9' } });
    const upi = await sell('subOoty', { ...base, payment: { method: 'UPI' } });
    for (const res of [cash, card, upi]) expect(res.status, JSON.stringify(res.body)).toBe(201);
    expect(card.body).toMatchObject({ paymentStatus: 'PAID', payment: { method: 'CARD', status: 'CONFIRMED', cardRef: 'POS-REF-9' } });
    expect(await one(`SELECT card_ref FROM sale_payments WHERE order_id = $1`, [card.body.id])).toBe('POS-REF-9');
    expect(upi.body).toMatchObject({ status: 'PENDING_PAYMENT', paymentStatus: 'PENDING' });
    expect(await one(`SELECT count(*)::text FROM wallets`)).toBe(wallets);
    expect(await one(`SELECT count(*)::text FROM wallet_transactions`)).toBe(walletTxns);
  });

  it('BR-89b / BR-89c / BR-98h: stock reduced after a quote is 409 SALE_STOCK_CHANGED; a price changed after a quote is 409 SALE_PRICE_CHANGED with the fresh total; unchanged, the sale total equals the quote total', async () => {
    const crop = await newCrop({ ceiling: '40.00' });
    const batch = await newBatch({ crop, qty: '3' });
    const q = await quote('subOoty', 'DIRECT', [item(crop, '2')]);
    expect(q.body.totals.total).toBe('80.00');
    // Another counter sells 2 kg first.
    expect((await sell('subOoty', { channel: 'DIRECT', walkIn: { name: 'A' }, items: [item(crop, '2')], expectedTotal: '80.00', payment: { method: 'CASH', amountReceived: '80.00' } })).status).toBe(201);
    const stale = await sell('subOoty', { channel: 'DIRECT', walkIn: { name: 'B' }, items: [item(crop, '2')], expectedTotal: q.body.totals.total, payment: { method: 'CASH', amountReceived: '80.00' } });
    expect(stale.status).toBe(409);
    expect(stale.body.code).toBe('SALE_STOCK_CHANGED');
    expect(await qtyAvailable(batch.id)).toBe('1.000');

    const q2 = await quote('subOoty', 'DIRECT', [item(crop, '1')]);
    expect(q2.body.totals.total).toBe('40.00');
    await pool.query(`INSERT INTO retail_prices (crop_id, grade, price, effective_from, set_by) VALUES ($1, 'GRADE_1', '38.00', $2::date, $3)`, [crop, today, IDS.userSuperAdmin]);
    const before = await attemptCount();
    const changed = await sell('subOoty', { channel: 'DIRECT', walkIn: { name: 'B' }, items: [item(crop, '1')], expectedTotal: q2.body.totals.total, payment: { method: 'CASH', amountReceived: '40.00' } });
    expect(changed.status).toBe(409);
    expect(changed.body.code).toBe('SALE_PRICE_CHANGED');
    expect(changed.body.meta).toMatchObject({ expectedTotal: '40.00', currentTotal: '38.00' });
    expect(Number(await attemptCount())).toBe(Number(before) + 1);
    expect(await qtyAvailable(batch.id)).toBe('1.000');
    const q3 = await quote('subOoty', 'DIRECT', [item(crop, '1')]);
    const ok = await sell('subOoty', { channel: 'DIRECT', walkIn: { name: 'B' }, items: [item(crop, '1')], expectedTotal: q3.body.totals.total, payment: { method: 'CASH', amountReceived: '40.00' } });
    expect(ok.status).toBe(201);
    expect(ok.body.totals.total).toBe(q3.body.totals.total);
  });

  it('BR-98d: changing system_config.retail_gst_rate_percent changes the next quote and sale with no redeploy (GST once per invoice)', async () => {
    const crop = await newCrop({ ceiling: '10.10' });
    const crop2 = await newCrop({ ceiling: '10.10' });
    await newBatch({ crop, qty: '5' });
    await newBatch({ crop: crop2, qty: '5' });
    await pool.query(`UPDATE system_config SET value = '5'::jsonb WHERE key = 'retail_gst_rate_percent'`);
    try {
      const q = await quote('subOoty', 'DIRECT', [item(crop, '1'), item(crop2, '1')]);
      expect(q.body.gstRatePercent).toBe('5');
      expect(q.body.totals).toMatchObject({ subtotal: '20.20', gst: '1.01', total: '21.21' });
      const res = await sell('subOoty', { channel: 'DIRECT', walkIn: { name: 'G' }, items: [item(crop, '1'), item(crop2, '1')], expectedTotal: '21.21', payment: { method: 'CASH', amountReceived: '25.00' } });
      expect(res.status, JSON.stringify(res.body)).toBe(201);
      expect(res.body.totals).toEqual({ subtotal: '20.20', gst: '1.01', total: '21.21', changeGiven: '3.79' });
      const invoice = await pool.query(`SELECT total_amount::text AS t, (cgst + sgst)::text AS tax FROM invoices WHERE order_id = $1`, [res.body.id]);
      expect(invoice.rows[0]).toEqual({ t: '21.21', tax: '1.01' });
    } finally {
      await pool.query(`UPDATE system_config SET value = '0'::jsonb WHERE key = 'retail_gst_rate_percent'`);
    }
  });

  // -------------------------------------------------------------------------
  // atomicity and concurrency
  // -------------------------------------------------------------------------
  it('BR-87a / BR-87b / BR-87f: a failure in the invoice step rolls back order, items, ledger, payment, wallet debit and audit; the invoice counter does not move; one PII-free sale_attempts row survives', async () => {
    const { createSalesService } = await import('./sales.service.js');
    const crop = await newCrop({ ceiling: '45.50' });
    const batch = await newBatch({ crop, qty: '10' });
    const customer = await newCustomer({ balance: '100.00' });
    const counter = (): Promise<string> => one(`SELECT COALESCE(sum(last_value), 0)::text FROM invoice_number_counters`);
    const before = {
      counter: await counter(),
      attempts: await attemptCount(),
      audits: await one(`SELECT count(*)::text FROM audit_log WHERE action_code = 'sales.sale.create'`),
      payments: await one(`SELECT count(*)::text FROM sale_payments`),
    };
    let ledgerWrittenBeforeFailure = false;
    const service = createSalesService({
      invoices: {
        issue: async (tx) => {
          ledgerWrittenBeforeFailure = (await tx.query(`SELECT 1 FROM stock_ledger WHERE batch_id = $1 AND movement_type = 'SALE'`, [batch.id])).rowCount === 1;
          throw new Error('forced invoice failure');
        },
      },
    });
    const scope = subScope(ooty, users.subOoty);
    const k = key('rollback');
    await expect(
      service.create(scope, subScope(ooty, users.subOoty, 'payment.record'), k, {
        channel: 'DIRECT',
        customer: { customerId: customer.id },
        items: [{ productId: crop, grade: 'GRADE_1', qtyKg: '1' }],
        expectedTotal: '45.50',
        payment: { method: 'WALLET' },
      }),
    ).rejects.toThrow('forced invoice failure');
    expect(ledgerWrittenBeforeFailure).toBe(true);

    expect(await orderCountForCrop(crop)).toBe('0');
    expect(await one(`SELECT count(*)::text FROM stock_ledger WHERE batch_id = $1 AND movement_type = 'SALE'`, [batch.id])).toBe('0');
    expect(await qtyAvailable(batch.id)).toBe('10.000');
    expect(await one(`SELECT count(*)::text FROM sale_payments`)).toBe(before.payments);
    expect(await one(`SELECT balance::text FROM wallets WHERE id = $1`, [customer.walletId])).toBe('100.00');
    expect(await one(`SELECT count(*)::text FROM wallet_transactions WHERE idempotency_key = $1`, [`sale_debit:${users.subOoty}:${k}`])).toBe('0');
    expect(await one(`SELECT count(*)::text FROM audit_log WHERE action_code = 'sales.sale.create'`)).toBe(before.audits);
    expect(await counter()).toBe(before.counter);
    expect(await one(`SELECT count(*)::text FROM idempotency_keys WHERE idempotency_key = $1`, [k])).toBe('0');

    expect(Number(await attemptCount())).toBe(Number(before.attempts) + 1);
    const attempt = await pool.query<{ reason_code: string; actor_id: string; warehouse_id: string; payload: Record<string, unknown> }>(
      `SELECT reason_code, actor_id, warehouse_id, payload FROM sale_attempts ORDER BY created_at DESC LIMIT 1`,
    );
    expect(attempt.rows[0]).toMatchObject({ reason_code: 'INTERNAL', actor_id: users.subOoty, warehouse_id: ooty });
    expect(attempt.rows[0]!.payload).toHaveProperty('traceId');
    expect(JSON.stringify(attempt.rows[0]!.payload)).not.toContain(customer.mobile.slice(-10));
  });

  it('BR-87c: sale_attempts refuses UPDATE, DELETE and TRUNCATE', async () => {
    for (const sql of ['UPDATE sale_attempts SET reason_code = reason_code', 'DELETE FROM sale_attempts', 'TRUNCATE sale_attempts']) {
      await expect(pool.query(sql)).rejects.toThrow();
    }
  });

  it('BR-87g: two concurrent sales for the last kilogram: one 201, one 409 SALE_STOCK_CHANGED; stock never goes negative', async () => {
    const crop = await newCrop({ ceiling: '10.00' });
    const batch = await newBatch({ crop, qty: '1' });
    const body = { channel: 'DIRECT', walkIn: { name: 'Race' }, items: [item(crop, '1')], expectedTotal: '10.00', payment: { method: 'CASH', amountReceived: '10.00' } };
    const results = await Promise.all([sell('subOoty', body), sell('subOoty', body)]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(results.find((r) => r.status === 409)!.body.code).toBe('SALE_STOCK_CHANGED');
    expect(await qtyAvailable(batch.id)).toBe('0.000');
    expect(await ledgerSum(batch.id)).toBe('0.000');
    expect(await orderCountForCrop(crop)).toBe('1');
  });

  it('BR-87h / BR-98g: parallel sales draw distinct, consecutive invoice numbers', async () => {
    const crop = await newCrop({ ceiling: '1.00' });
    await newBatch({ crop, qty: '100' });
    const body = { channel: 'DIRECT', walkIn: { name: 'Seq' }, items: [item(crop, '1')], expectedTotal: '1.00', payment: { method: 'CASH', amountReceived: '1.00' } };
    const results = await Promise.all([1, 2, 3, 4].map(() => sell('subOoty', body)));
    for (const r of results) expect(r.status, JSON.stringify(r.body)).toBe(201);
    const numbers = results.map((r) => r.body.invoiceNumber as string);
    expect(new Set(numbers).size).toBe(4);
    const seqs = numbers.map((n) => Number(n.split('/').pop())).sort((a, b) => a - b);
    expect(seqs[3]! - seqs[0]!).toBe(3);
  });

  // -------------------------------------------------------------------------
  // UPI
  // -------------------------------------------------------------------------
  it('BR-94d / BR-94e / BR-88g: a UPI sale is created pending with its stock held and no ledger or invoice; the confirm completes it once; replays (same or new key) change nothing', async () => {
    const crop = await newCrop({ ceiling: '20.00' });
    const batch = await newBatch({ crop, qty: '3' });
    const created = await sell('subOoty', { channel: 'DIRECT', walkIn: { name: 'UPI' }, items: [item(crop, '2')], expectedTotal: '40.00', payment: { method: 'UPI' } });
    expect(created.status, JSON.stringify(created.body)).toBe(201);
    expect(created.body).toMatchObject({ status: 'PENDING_PAYMENT', paymentStatus: 'PENDING', completedAt: null, invoiceNumber: null, payment: { method: 'UPI', status: 'PENDING' } });
    const saleId = created.body.id as string;
    expect(await one(`SELECT count(*)::text FROM stock_ledger WHERE ref_id = $1`, [saleId])).toBe('0');
    expect(await qtyAvailable(batch.id)).toBe('3.000');
    // The held 2 kg cannot be sold again while the UPI is pending.
    const q = await quote('subOoty', 'DIRECT', [item(crop, '1.5')]);
    expect(q.status).toBe(409);
    expect(q.body.meta.lines[0].availableQtyKg).toBe('1.000');

    const confirm = (k: string, ref = 'pay_ci_upi_1') =>
      request(server).post(`/v1/admin/sales/${saleId}/payments/upi/confirm`).set('Authorization', auth('subOoty')).set('Idempotency-Key', k).send({ upiTxnRef: ref });
    const k = key('upi');
    const done = await confirm(k);
    expect(done.status, JSON.stringify(done.body)).toBe(200);
    expect(saleResponse.safeParse(done.body).success).toBe(true);
    expect(done.body).toMatchObject({ status: 'PICKED_UP', paymentStatus: 'PAID', payment: { status: 'CONFIRMED', upiTxnRef: 'pay_ci_upi_1' } });
    expect(done.body.completedAt).not.toBeNull();
    expect(done.body.invoiceNumber).toMatch(/^TOH\//);
    expect(await qtyAvailable(batch.id)).toBe('1.000');
    expect(await one(`SELECT count(*)::text FROM stock_ledger WHERE ref_id = $1 AND movement_type = 'SALE'`, [saleId])).toBe('1');

    const sameKey = await confirm(k);
    const newKey = await confirm(key('upi-again'), 'pay_other');
    expect(sameKey.status).toBe(200);
    expect(newKey.status).toBe(200);
    expect(sameKey.body).toEqual(done.body);
    expect(newKey.body.invoiceNumber).toBe(done.body.invoiceNumber);
    expect(await one(`SELECT count(*)::text FROM stock_ledger WHERE ref_id = $1`, [saleId])).toBe('1');
    expect(await one(`SELECT count(*)::text FROM invoices WHERE order_id = $1`, [saleId])).toBe('1');
    expect(await one(`SELECT count(*)::text FROM sale_payments WHERE order_id = $1`, [saleId])).toBe('1');
    expect(await one(`SELECT count(*)::text FROM order_status_history WHERE order_id = $1`, [saleId])).toBe('2');
    expect(await one(`SELECT count(*)::text FROM audit_log WHERE entity_id = $1 AND action_code = 'payment.record'`, [saleId])).toBe('1');
  });

  it('BR-94f: an unverified gateway result leaves the UPI sale pending (no stock, no invoice), is 422 and is logged without the reference', async () => {
    const { createSalesService } = await import('./sales.service.js');
    const crop = await newCrop({ ceiling: '20.00' });
    const batch = await newBatch({ crop, qty: '3' });
    const created = await sell('subOoty', { channel: 'DIRECT', walkIn: { name: 'UPI' }, items: [item(crop, '1')], expectedTotal: '20.00', payment: { method: 'UPI' } });
    expect(created.status).toBe(201);
    const saleId = created.body.id as string;
    const before = await attemptCount();
    const service = createSalesService({ verifyUpi: async () => false });
    const error = await service
      .confirmUpi(subScope(ooty, users.subOoty, 'payment.record'), saleId, key('upi-fail'), { upiTxnRef: 'pay_secret_ref_123' })
      .catch((e: unknown) => e as { status: number; code: string });
    expect(error).toMatchObject({ status: 422, code: 'VALIDATION_FAILED' });
    expect(await one(`SELECT status::text FROM orders WHERE id = $1`, [saleId])).toBe('PENDING_PAYMENT');
    expect(await one(`SELECT status FROM sale_payments WHERE order_id = $1`, [saleId])).toBe('PENDING');
    expect(await one(`SELECT count(*)::text FROM invoices WHERE order_id = $1`, [saleId])).toBe('0');
    expect(await qtyAvailable(batch.id)).toBe('3.000');
    expect(Number(await attemptCount())).toBe(Number(before) + 1);
    expect(JSON.stringify((await pool.query(`SELECT payload FROM sale_attempts ORDER BY created_at DESC LIMIT 1`)).rows[0])).not.toContain('pay_secret_ref_123');
  });

  // -------------------------------------------------------------------------
  // customer lookup
  // -------------------------------------------------------------------------
  it('BR-92g / BR-91: the counter lookup returns masked mobiles only, confined to the warehouse\'s customers; no match is an empty list, not 403', async () => {
    const mine = await newCustomer({ preferred: ooty, balance: '12.34' });
    const elsewhere = await newCustomer({ preferred: null });
    const lookup = (token: string, query: Record<string, string>) => request(server).get('/v1/admin/sales/customers/lookup').query(query).set('Authorization', auth(token));

    const byCode = await lookup('subOoty', { code: mine.code });
    expect(byCode.status).toBe(200);
    expect(customerLookupResponse.safeParse(byCode.body).success).toBe(true);
    expect(byCode.body.items).toEqual([
      { customerId: mine.id, customerCode: mine.code, name: 'CI Sale Customer', mobileMasked: `${'*'.repeat(mine.mobile.length - 4)}${mine.mobile.slice(-4)}`, walletBalance: '12.34' },
    ]);
    expect(JSON.stringify(byCode.body)).not.toContain(mine.mobile.slice(-8));
    expect(JSON.stringify(byCode.body)).not.toMatch(/email|address/i);
    const byMobile = await lookup('subOoty', { mobile: mine.mobile.slice(-10) });
    expect(byMobile.body.items.map((c: { customerId: string }) => c.customerId)).toEqual([mine.id]);

    expect((await lookup('subCoonoor', { code: mine.code })).body).toEqual({ items: [] });
    expect((await lookup('subOoty', { code: elsewhere.code })).body).toEqual({ items: [] });
    expect((await lookup('sa', { code: elsewhere.code })).body.items).toHaveLength(1);

    // A customer outside the scope cannot be sold to either (404, not 403).
    const crop = await newCrop({ ceiling: '1.00' });
    await newBatch({ crop, qty: '5' });
    const res = await sell('subOoty', { channel: 'DIRECT', customer: { customerId: elsewhere.id }, items: [item(crop, '1')], expectedTotal: '1.00', payment: { method: 'CASH', amountReceived: '1.00' } });
    expect(res.status).toBe(404);
  });

  it('BR-85e (HTTP): HORECA and B2B sale creation is 501 and writes nothing; a missing Idempotency-Key is 422 (BR-88a)', async () => {
    const crop = await newCrop({ ceiling: '1.00' });
    await newBatch({ crop, qty: '5' });
    const before = await attemptCount();
    for (const channel of ['HORECA', 'B2B']) {
      const res = await sell('subOoty', { channel, walkIn: { name: 'H' }, items: [item(crop, '1')], expectedTotal: '1.00', payment: { method: 'CASH', amountReceived: '1.00' } });
      expect(res.status).toBe(501);
      expect(res.body.code).toBe('SALE_CHANNEL_NOT_SUPPORTED');
    }
    const noKey = await request(server)
      .post('/v1/admin/sales')
      .set('Authorization', auth('subOoty'))
      .send({ channel: 'DIRECT', walkIn: { name: 'H' }, items: [item(crop, '1')], expectedTotal: '1.00', payment: { method: 'CASH', amountReceived: '1.00' } });
    expect(noKey.status).toBe(422);
    expect(await orderCountForCrop(crop)).toBe('0');
    expect(await attemptCount()).toBe(before);
  });
});
