/**
 * GET /v1/invoices/summary - the KPI tiles over the invoices the caller may list.
 *
 * BR-30 / BR-36: the summary covers EXACTLY the invoices `GET /invoices` returns the same caller
 * (one `invoiceVisibility`, one `visibilitySql`), so a Sub Warehouse Admin's tiles count only
 * invoices of orders placed at its warehouse, a customer's only its own, and a scope that reaches
 * nothing is an all-zero summary with 200, never 403 (a 403 would confirm another warehouse has
 * invoices). Amounts are summed in integer paise and returned as `Money` strings (CLAUDE.md §2.2).
 *
 * 1. service against a fake repo (visibility handed down, zero-filled buckets, paise sums);
 * 2. route table: `/summary` is registered before `/:id`, so it is never parsed as an invoice id;
 * 3. repo against PostgreSQL inside a transaction that is rolled back;
 * 4. real HTTP through createApp() for the status codes (no committed fixtures: an empty window).
 */
import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { RoleCode, type Money } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { anActor, aRole, describeIfDatabase, IDS, newId } from '../../test/factories.js';
import { insertUser, requireDatabaseTables } from '../../test/dbFixtures.js';
import { invoicesRepo, type InvoicesRepo, type InvoiceVisibility } from './invoices.repo.js';
import { invoicesRouter } from './invoices.routes.js';
import { invoiceSummaryResponse } from './invoices.schema.js';
import { createInvoicesService } from './invoices.service.js';

const STATUSES = ['DRAFT', 'ISSUED', 'CANCELLED', 'CREDIT_NOTED'];
const TYPES = ['SALE_RETAIL', 'SALE_B2B', 'PURCHASE_FARMER', 'PAYOUT', 'SUBSCRIPTION'];

// ===========================================================================
// 1. Service (fake repo)
// ===========================================================================
describe('invoice summary service (fake repo)', () => {
  function fakeRepo(groups: Array<{ status: string; invoiceType: string; count: number; totalPaise: string }>): InvoicesRepo {
    return { summarizeInvoices: vi.fn(async () => groups) } as unknown as InvoicesRepo;
  }

  it('BR-30: a Sub Warehouse Admin hands its warehouse visibility (the list predicate) and the filters to the repo', async () => {
    const repo = fakeRepo([]);
    const service = createInvoicesService(repo);
    const actor = anActor({ roles: [aRole(RoleCode.SUB_WH_ADMIN, { warehouseId: IDS.warehouseOoty })] });
    const query = { fromDate: '2026-10-01', toDate: '2026-10-31' };
    await service.summarizeInvoices(actor, query);
    const call = vi.mocked(repo.summarizeInvoices).mock.calls[0]!;
    expect(call[1]).toEqual({ kind: 'warehouses', warehouseIds: [IDS.warehouseOoty] } satisfies InvoiceVisibility);
    expect(call[2]).toBe(query);
  });

  it('BR-36: every status and every type has a tile (zero-filled), and totals are summed in integer paise', async () => {
    const service = createInvoicesService(
      fakeRepo([
        { status: 'ISSUED', invoiceType: 'SALE_RETAIL', count: 2, totalPaise: '10501' },
        { status: 'ISSUED', invoiceType: 'PURCHASE_FARMER', count: 1, totalPaise: '30025' },
        { status: 'CANCELLED', invoiceType: 'SALE_RETAIL', count: 1, totalPaise: '21050' },
      ]),
    );
    const summary = await service.summarizeInvoices(anActor({ roles: [aRole(RoleCode.SUPER_ADMIN)] }), {});
    expect(invoiceSummaryResponse.parse(summary)).toEqual(summary);
    expect(summary.count).toBe(4);
    expect(summary.totalAmount).toBe('615.76' as Money);
    expect(summary.byStatus.map((s) => s.status)).toEqual(STATUSES);
    expect(summary.byType.map((t) => t.type)).toEqual(TYPES);
    expect(summary.byStatus.find((s) => s.status === 'ISSUED')).toEqual({ status: 'ISSUED', count: 3, totalAmount: '405.26' });
    expect(summary.byStatus.find((s) => s.status === 'DRAFT')).toEqual({ status: 'DRAFT', count: 0, totalAmount: '0.00' });
    expect(summary.byType.find((t) => t.type === 'SALE_RETAIL')).toEqual({ type: 'SALE_RETAIL', count: 3, totalAmount: '315.51' });
    expect(summary.byType.find((t) => t.type === 'PAYOUT')).toEqual({ type: 'PAYOUT', count: 0, totalAmount: '0.00' });
  });

  it('BR-30: a caller whose visibility reaches nothing gets an all-zero summary, not an error', async () => {
    const service = createInvoicesService(fakeRepo([]));
    // A Sub admin with no warehouse resolves to visibility `none`.
    const summary = await service.summarizeInvoices(anActor({ roles: [aRole(RoleCode.SUB_WH_ADMIN)] }), {});
    expect(summary.count).toBe(0);
    expect(summary.totalAmount).toBe('0.00');
    expect(summary.byStatus.every((s) => s.count === 0 && s.totalAmount === '0.00')).toBe(true);
    expect(summary.byType.every((t) => t.count === 0 && t.totalAmount === '0.00')).toBe(true);
  });
});

// ===========================================================================
// 2. Route table
// ===========================================================================
describe('invoice routes', () => {
  it('BR-30: GET /summary is registered before GET /:id, so "summary" is never parsed as an invoice id', () => {
    const paths = (invoicesRouter.stack as unknown as Array<{ route?: { path: string; methods: Record<string, boolean> } }>)
      .filter((layer) => layer.route?.methods['get'] === true)
      .map((layer) => layer.route!.path);
    expect(paths).toContain('/summary');
    expect(paths.indexOf('/summary')).toBeLessThan(paths.indexOf('/:id'));
  });
});

// ===========================================================================
// 3. Repo against PostgreSQL (rolled-back transaction)
// ===========================================================================
class Rollback extends Error {}

describeIfDatabase('invoice summary repo (PostgreSQL, rolled back)', () => {
  it('BR-30 / BR-36: counts and paise totals by status and type cover exactly the list scope; another warehouse is zero; the date and type filters narrow', async (ctx) => {
    if (!(await requireDatabaseTables('invoices', 'orders', 'customers', 'farmers', 'warehouses'))) return ctx.skip();
    const { withTransaction } = await import('../../db/pool.js');
    // A day no other fixture issues on, so the summary sees this test's rows only.
    const DAY = '2017-02-11';
    await withTransaction(async (tx: Executor) => {
      const warehouse = async (): Promise<string> => {
        const id = newId();
        await tx.query(`INSERT INTO warehouses (id, code, name) VALUES ($1, $2, 'Summary Fixture')`, [id, `WH-IS-${id.slice(0, 8)}`]);
        return id;
      };
      const [whA, whB, whEmpty] = [await warehouse(), await warehouse(), await warehouse()];
      const customerUser = await insertUser(tx, 'CUSTOMER', 'Summary Customer');
      const customerId = newId();
      await tx.query(`INSERT INTO customers (id, user_id, customer_code) VALUES ($1, $2, $3)`, [customerId, customerUser, `IS-${customerId.slice(0, 8)}`]);
      const farmerUser = await insertUser(tx, 'FARMER', 'Summary Farmer');
      const farmerId = newId();
      await tx.query(`INSERT INTO farmers (id, user_id, tohfa_farmer_id) VALUES ($1, $2, $3)`, [farmerId, farmerUser, `TOHFA-IS-${farmerId.slice(0, 8)}`]);
      const order = async (warehouseId: string): Promise<string> => {
        const id = newId();
        await tx.query(`INSERT INTO orders (id, order_number, customer_id, warehouse_id) VALUES ($1, $2, $3, $4)`, [id, `ORD-IS-${id.slice(0, 8)}`, customerId, warehouseId]);
        return id;
      };
      const invoice = async (
        type: string,
        status: string,
        total: string,
        owner: { customerId?: string; farmerId?: string; orderId?: string },
      ): Promise<void> => {
        const id = newId();
        await tx.query(
          `INSERT INTO invoices (id, invoice_number, invoice_type, customer_id, farmer_id, order_id, issue_date, fiscal_year,
                                 taxable_amount, total_amount, gst_inclusive, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, '2016-17', $8, $8, true, $9)`,
          [id, `TOH/IS/${id.slice(0, 8)}`, type, owner.customerId ?? null, owner.farmerId ?? null, owner.orderId ?? null, DAY, total, status],
        );
      };
      await invoice('SALE_RETAIL', 'ISSUED', '105.01', { customerId, orderId: await order(whA) });
      await invoice('SALE_RETAIL', 'ISSUED', '0.10', { customerId, orderId: await order(whA) });
      await invoice('SALE_RETAIL', 'CANCELLED', '210.50', { customerId, orderId: await order(whB) });
      await invoice('PURCHASE_FARMER', 'ISSUED', '300.25', { farmerId });

      const service = createInvoicesService(invoicesRepo);
      const window = { fromDate: DAY, toDate: DAY };
      const summarize = async (visibility: InvoiceVisibility, query: Record<string, string> = window) => {
        const groups = await invoicesRepo.summarizeInvoices(tx, visibility, query);
        return service.toInvoiceSummary(groups);
      };

      const all = await summarize({ kind: 'all' });
      expect(all.count).toBe(4);
      expect(all.totalAmount).toBe('615.86');
      expect(all.byStatus.find((s) => s.status === 'ISSUED')).toEqual({ status: 'ISSUED', count: 3, totalAmount: '405.36' });
      expect(all.byStatus.find((s) => s.status === 'CANCELLED')).toEqual({ status: 'CANCELLED', count: 1, totalAmount: '210.50' });
      expect(all.byType.find((t) => t.type === 'PURCHASE_FARMER')).toEqual({ type: 'PURCHASE_FARMER', count: 1, totalAmount: '300.25' });

      // Sub admin of A: the two invoices of orders at A, nothing of B, not the order-less purchase invoice.
      const subA = await summarize({ kind: 'warehouses', warehouseIds: [whA] });
      expect(subA.count).toBe(2);
      expect(subA.totalAmount).toBe('105.11');
      expect(subA.byType.find((t) => t.type === 'PURCHASE_FARMER')?.count).toBe(0);
      // A warehouse with no invoices (or one outside the scope) is all zeros, not an error.
      const empty = await summarize({ kind: 'warehouses', warehouseIds: [whEmpty] });
      expect(empty.count).toBe(0);
      expect(empty.totalAmount).toBe('0.00');

      // The owner dimensions the list uses (BR-36).
      expect((await summarize({ kind: 'customer', customerId })).count).toBe(3);
      expect((await summarize({ kind: 'farmer', farmerId })).totalAmount).toBe('300.25');
      expect((await summarize({ kind: 'none' })).count).toBe(0);

      // Filters narrow like the list's: the type, and a window that excludes the day.
      expect((await summarize({ kind: 'all' }, { ...window, type: 'PURCHASE_FARMER' })).count).toBe(1);
      expect((await summarize({ kind: 'all' }, { fromDate: '2017-02-12', toDate: '2017-02-12' })).count).toBe(0);

      // Same rows as the list for the same caller and filters.
      const listed = await invoicesRepo.listInvoices(tx, { kind: 'warehouses', warehouseIds: [whA] }, { limit: 100, ...window });
      expect(listed.items).toHaveLength(subA.count);

      throw new Rollback();
    }).catch((error: unknown) => {
      if (!(error instanceof Rollback)) throw error;
    });
  });
});

// ===========================================================================
// 4. Real HTTP through createApp()
// ===========================================================================
describeIfDatabase('GET /v1/invoices/summary (HTTP)', () => {
  let ready = false;
  let server: Server;
  const tokens: Record<string, string> = {};
  // No invoice is issued on this day by any fixture, so every tile is zero.
  const EMPTY = { fromDate: '2016-01-02', toDate: '2016-01-02' };

  beforeAll(async () => {
    ready = await requireDatabaseTables('invoices', 'orders');
    if (!ready) return;
    const [{ createApp }, { signAccessToken }] = await Promise.all([import('../../app.js'), import('../../auth/jwt.js')]);
    const sign = (roles: Parameters<typeof signAccessToken>[0]['roles']): string =>
      signAccessToken({ sub: IDS.userSuperAdmin, roles, farmerId: null, customerId: null });
    tokens['super'] = sign([{ code: RoleCode.SUPER_ADMIN }]);
    tokens['sub'] = sign([{ code: RoleCode.SUB_WH_ADMIN, warehouseId: IDS.warehouseOoty }]);
    tokens['farmerAdmin'] = sign([{ code: RoleCode.FARMER_ADMIN, zoneId: IDS.zoneNorth }]);
    server = createApp().listen(0);
  });

  // Closes the pool for the whole file (the repo suite above runs first and leaves it open).
  afterAll(async () => {
    const [{ closePool }, { closeRedis }] = await Promise.all([import('../../db/pool.js'), import('../../redis.js')]);
    if (ready) await new Promise<void>((resolve) => server.close(() => resolve()));
    await Promise.allSettled([closePool(), closeRedis()]);
  });

  const get = (who?: string, query: Record<string, string> = EMPTY) => {
    const req = request(server).get('/v1/invoices/summary').query(query);
    return who === undefined ? req : req.set('Authorization', `Bearer ${tokens[who]!}`);
  };

  it('BR-30: 200 with the documented shape for an admin and for a Sub admin (zero tiles, never 403); 401 anonymous; 403 without invoice.view_own', async (ctx) => {
    if (!ready) return ctx.skip();
    for (const who of ['super', 'sub']) {
      const res = await get(who);
      expect(res.status, `${who} ${JSON.stringify(res.body)}`).toBe(200);
      expect(invoiceSummaryResponse.parse(res.body)).toEqual(res.body);
      expect(res.body.count).toBe(0);
    }
    expect((await get()).status).toBe(401);
    const forbidden = await get('farmerAdmin');
    expect(forbidden.status).toBe(403);
    expect(forbidden.body.code).toBe('FORBIDDEN');
    const bad = await get('super', { fromDate: 'yesterday' });
    expect(bad.status).toBe(422);
    expect(bad.body.code).toBe('VALIDATION_FAILED');
  });
});
