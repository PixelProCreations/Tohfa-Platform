/**
 * Invoice ownership on the detail and the PDF download (QA defect 2026-10-11).
 *
 * QA proved on a running server that ANY logged-in user (a freshly registered customer) could
 * GET /v1/invoices/{id} (200, full body) and GET /v1/invoices/{id}/download (200, the PDF) for an
 * invoice that belongs to somebody else, while GET /v1/invoices (the list) was scoped. The
 * contract pinned here:
 *
 *   For every role, the detail and the download answer 200 for exactly the invoices the list
 *   returns, and 404 - with the same body as an id that does not exist - for every other id.
 *
 * BR-36 = a customer or farmer reaches only their own invoices, the PDF included (BR-36b).
 * BR-30 = a Sub Warehouse Admin reaches only invoices of orders placed at its assigned warehouse.
 *
 * Real HTTP through the real app router on ONE listening server. The fixtures are committed rows
 * (the server reads through its own pool, so rows inside a test transaction would be invisible to
 * it), tagged with this run and deleted in afterAll. None of them lives in an append-only table,
 * and no request here writes audit_log or order_status_history.
 */
import { createHmac } from 'node:crypto';
import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { RoleCode } from '@tohfa/shared-types';
import type { Actor } from '../../auth/requireAuth.js';
import type { RoleAssignment } from '../../auth/jwt.js';
import { anActor, aRole, IDS, newId } from '../../test/factories.js';
import { insertUser, requireDatabaseTables } from '../../test/dbFixtures.js';
import { invoiceVisibility } from './invoices.service.js';

// ===========================================================================
// 1. Visibility mapping (pure)
// ===========================================================================
describe('invoiceVisibility', () => {
  const customerId = newId();
  const farmerId = newId();
  const ooty = newId();

  it('BR-36: maps the invoice.view_own grant to one owner dimension per role (all-scoped admins see everything)', () => {
    for (const code of [RoleCode.SUPER_ADMIN, RoleCode.TOHFA_ADMIN, RoleCode.MAIN_WH_ADMIN]) {
      expect(invoiceVisibility(anActor({ roles: [aRole(code)] })), code).toEqual({ kind: 'all' });
    }
    // MAIN_WH_ADMIN's grant is `all`, so an assigned warehouse does not narrow it.
    expect(invoiceVisibility(anActor({ roles: [aRole(RoleCode.MAIN_WH_ADMIN, { warehouseId: ooty })] }))).toEqual({ kind: 'all' });
    expect(invoiceVisibility(anActor({ roles: [aRole(RoleCode.CUSTOMER)], customerId }))).toEqual({ kind: 'customer', customerId });
    expect(invoiceVisibility(anActor({ roles: [aRole(RoleCode.FARMER)], farmerId }))).toEqual({ kind: 'farmer', farmerId });
    // A customer or farmer token without its profile row owns nothing.
    expect(invoiceVisibility(anActor({ roles: [aRole(RoleCode.CUSTOMER)] }))).toEqual({ kind: 'none' });
    expect(invoiceVisibility(anActor({ roles: [aRole(RoleCode.FARMER)] }))).toEqual({ kind: 'none' });
    // FARMER_ADMIN has no grant (the route answers 403 before this is reached).
    expect(invoiceVisibility(anActor({ roles: [aRole(RoleCode.FARMER_ADMIN, { zoneId: IDS.zoneNorth })], farmerId }))).toEqual({ kind: 'none' });
  });

  it('BR-36: an actor holding FARMER and CUSTOMER keeps the farmer view the list always gave, in either role order', () => {
    const both = (roles: RoleAssignment[]): Actor => anActor({ roles, farmerId, customerId });
    expect(invoiceVisibility(both([aRole(RoleCode.FARMER), aRole(RoleCode.CUSTOMER)]))).toEqual({ kind: 'farmer', farmerId });
    expect(invoiceVisibility(both([aRole(RoleCode.CUSTOMER), aRole(RoleCode.FARMER)]))).toEqual({ kind: 'farmer', farmerId });
  });

  it('BR-30: a Sub Warehouse Admin sees its assigned warehouse(s) only', () => {
    expect(invoiceVisibility(anActor({ roles: [aRole(RoleCode.SUB_WH_ADMIN, { warehouseId: ooty })] }))).toEqual({
      kind: 'warehouses',
      warehouseIds: [ooty],
    });
    // No warehouse assigned: nothing (requirePermission already refuses this account).
    expect(invoiceVisibility(anActor({ roles: [aRole(RoleCode.SUB_WH_ADMIN)] }))).toEqual({ kind: 'none' });
  });
});

// ===========================================================================
// 2. Real HTTP, real router, real database
// ===========================================================================
type InvoiceKey = 'A' | 'B' | 'F';
const ALL_KEYS: InvoiceKey[] = ['A', 'B', 'F'];

interface Download {
  status: number;
  type: string;
  bytes: Buffer;
  location: string | undefined;
}

describe('invoice detail and download ownership (real router)', () => {
  let ready = false;
  /** Skips visibly (never silently passes) when no migrated database is configured. */
  const httpIt = (name: string, fn: () => Promise<void>): void => {
    it(name, async (ctx) => {
      if (!ready) return ctx.skip();
      await fn();
    });
  };

  let server: Server;
  let jwtSecret = '';
  const tokens: Record<string, string> = {};
  const tag = `h1-inv-${Date.now()}`;
  // A day no other fixture issues on, so a dated list query sees this run's rows only.
  const ISSUE_DATE = '2019-03-17';
  const RANDOM_ID = '99999999-9999-4999-8999-999999999999';

  const users: string[] = [];
  const customers: Record<'A' | 'B', string> = { A: '', B: '' };
  let farmerF = '';
  const orders: string[] = [];
  const invoice: Record<InvoiceKey, string> = { A: '', B: '', F: '' };
  const invoiceNumber: Record<InvoiceKey, string> = { A: '', B: '', F: '' };
  let ootyId = '';
  let coonoorId = '';

  beforeAll(async () => {
    ready = await requireDatabaseTables('invoices', 'invoice_lines', 'orders', 'customers', 'farmers', 'warehouses');
    if (!ready) return;
    const [{ createApp }, { signAccessToken }, { pool }, { config }] = await Promise.all([
      import('../../app.js'),
      import('../../auth/jwt.js'),
      import('../../db/pool.js'),
      import('../../config.js'),
    ]);
    jwtSecret = config.JWT_SECRET;

    const wh = await pool.query<{ id: string; code: string }>(`SELECT id, code FROM warehouses WHERE code IN ('WH-OOTY', 'WH-COON')`);
    const ooty = wh.rows.find((w) => w.code === 'WH-OOTY');
    const coonoor = wh.rows.find((w) => w.code === 'WH-COON');
    if (ooty === undefined || coonoor === undefined) throw new Error('seeded warehouses WH-OOTY and WH-COON are missing: run db/seed first');
    ootyId = ooty.id;
    coonoorId = coonoor.id;

    for (const key of ['A', 'B'] as const) {
      const userId = await insertUser(pool, 'CUSTOMER', `Invoice Customer ${key}`);
      users.push(userId);
      customers[key] = newId();
      await pool.query(`INSERT INTO customers (id, user_id, customer_code) VALUES ($1, $2, $3)`, [customers[key], userId, `${tag}-${key}`]);
    }
    const farmerUser = await insertUser(pool, 'FARMER', 'Invoice Farmer');
    users.push(farmerUser);
    farmerF = newId();
    await pool.query(`INSERT INTO farmers (id, user_id, tohfa_farmer_id) VALUES ($1, $2, $3)`, [farmerF, farmerUser, `TOHFA-${tag}`]);

    const order = async (key: 'A' | 'B', warehouseId: string): Promise<string> => {
      const id = newId();
      await pool.query(`INSERT INTO orders (id, order_number, customer_id, warehouse_id) VALUES ($1, $2, $3, $4)`, [id, `ORD-${tag}-${key}`, customers[key], warehouseId]);
      orders.push(id);
      return id;
    };
    const issue = async (
      key: InvoiceKey,
      type: 'SALE_RETAIL' | 'PURCHASE_FARMER',
      owner: { customerId?: string; farmerId?: string; orderId?: string },
    ): Promise<void> => {
      invoice[key] = newId();
      invoiceNumber[key] = `TOH/${tag}/${key}`;
      await pool.query(
        `INSERT INTO invoices (id, invoice_number, invoice_type, customer_id, farmer_id, order_id, issue_date, fiscal_year,
                               taxable_amount, cgst, sgst, total_amount, gst_inclusive, place_of_supply, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, '2018-19', 100.00, 2.50, 2.50, 105.00, true, '33-Tamil Nadu', 'ISSUED')`,
        [invoice[key], invoiceNumber[key], type, owner.customerId ?? null, owner.farmerId ?? null, owner.orderId ?? null, ISSUE_DATE],
      );
      await pool.query(
        `INSERT INTO invoice_lines (invoice_id, line_no, description, hsn_code, qty, unit_price, gst_rate, taxable, tax, total)
         VALUES ($1, 1, $2, '0706', 1, 105.00, 5, 100.00, 5.00, 105.00)`,
        [invoice[key], `Organic carrots ${key}`],
      );
    };
    // A: customer A's retail invoice for an Ooty order. B: customer B's, Coonoor. F: farmer F's
    // purchase invoice, which has no order and therefore no warehouse.
    await issue('A', 'SALE_RETAIL', { customerId: customers.A, orderId: await order('A', ootyId) });
    await issue('B', 'SALE_RETAIL', { customerId: customers.B, orderId: await order('B', coonoorId) });
    await issue('F', 'PURCHASE_FARMER', { farmerId: farmerF });

    const sign = (roles: RoleAssignment[], ids: { farmerId?: string; customerId?: string } = {}, sub: string = IDS.userSuperAdmin): string =>
      signAccessToken({ sub, roles, farmerId: ids.farmerId ?? null, customerId: ids.customerId ?? null });
    tokens['customerA'] = sign([{ code: RoleCode.CUSTOMER }], { customerId: customers.A }, users[0]);
    tokens['customerB'] = sign([{ code: RoleCode.CUSTOMER }], { customerId: customers.B }, users[1]);
    tokens['customerNoProfile'] = sign([{ code: RoleCode.CUSTOMER }]);
    tokens['farmerF'] = sign([{ code: RoleCode.FARMER }], { farmerId: farmerF }, farmerUser);
    tokens['farmerOther'] = sign([{ code: RoleCode.FARMER }], { farmerId: newId() });
    tokens['farmerAdmin'] = sign([{ code: RoleCode.FARMER_ADMIN, zoneId: IDS.zoneNorth }]);
    tokens['subOoty'] = sign([{ code: RoleCode.SUB_WH_ADMIN, warehouseId: ootyId }], {}, IDS.userSubWhAdmin);
    tokens['subCoonoor'] = sign([{ code: RoleCode.SUB_WH_ADMIN, warehouseId: coonoorId }], {}, IDS.userSubWhAdmin);
    tokens['main'] = sign([{ code: RoleCode.MAIN_WH_ADMIN }]);
    tokens['mainOoty'] = sign([{ code: RoleCode.MAIN_WH_ADMIN, warehouseId: ootyId }]);
    tokens['superAdmin'] = sign([{ code: RoleCode.SUPER_ADMIN }]);
    tokens['tohfaAdmin'] = sign([{ code: RoleCode.TOHFA_ADMIN }], {}, IDS.userTohfaAdmin);

    server = createApp().listen(0);
  });

  afterAll(async () => {
    if (!ready) return;
    const [{ withTransaction, closePool }, { closeRedis }] = await Promise.all([import('../../db/pool.js'), import('../../redis.js')]);
    await withTransaction(async (tx) => {
      const ids = Object.values(invoice).filter((id) => id !== '');
      await tx.query(`DELETE FROM invoice_lines WHERE invoice_id = ANY($1::uuid[])`, [ids]);
      await tx.query(`DELETE FROM invoices WHERE id = ANY($1::uuid[])`, [ids]);
      // Deleting an order cascades a DELETE statement to order_status_history, whose append-only
      // statement trigger refuses it even when no row matches. These orders never had a history
      // row (asserted, so no ledger row is ever removed here); replica mode lets this CI-only
      // cleanup (superuser test database) skip that cascade for the orders delete only.
      const history = await tx.query(`SELECT 1 FROM order_status_history WHERE order_id = ANY($1::uuid[])`, [orders]);
      if (history.rowCount !== 0) throw new Error('fixture orders unexpectedly have order_status_history rows; refusing to delete them');
      await tx.query(`SET LOCAL session_replication_role = replica`);
      await tx.query(`DELETE FROM orders WHERE id = ANY($1::uuid[])`, [orders]);
      await tx.query(`SET LOCAL session_replication_role = origin`);
      await tx.query(`DELETE FROM customers WHERE id = ANY($1::uuid[])`, [Object.values(customers).filter((id) => id !== '')]);
      if (farmerF !== '') await tx.query(`DELETE FROM farmers WHERE id = $1`, [farmerF]);
      await tx.query(`DELETE FROM users WHERE id = ANY($1::uuid[])`, [users]);
    });
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await Promise.allSettled([closePool(), closeRedis()]);
  });

  const bearer = (who: string): string => `Bearer ${tokens[who]!}`;

  async function detail(id: string, who?: string): Promise<request.Response> {
    const req = request(server).get(`/v1/invoices/${id}`);
    return who === undefined ? req : req.set('Authorization', bearer(who));
  }

  /** Fetches a download as raw bytes, whatever the content type (PDF or problem+json). */
  async function download(path: string, who?: string): Promise<Download> {
    let req = request(server)
      .get(path)
      .buffer(true)
      .parse((res, done) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => done(null, Buffer.concat(chunks)));
      });
    if (who !== undefined) req = req.set('Authorization', bearer(who));
    const res = await req;
    return {
      status: res.status,
      type: String(res.headers['content-type'] ?? ''),
      bytes: res.body as Buffer,
      location: res.headers['location'] as string | undefined,
    };
  }

  const pdfPath = (id: string): string => `/v1/invoices/${id}/download`;

  /** The problem body minus the per-request traceId, with the requested id masked out of `instance`. */
  function normalisedProblem(body: unknown, id: string): Record<string, unknown> {
    const copy = { ...(body as Record<string, unknown>) };
    delete copy['traceId'];
    if (typeof copy['instance'] === 'string') copy['instance'] = copy['instance'].replace(id, '{id}');
    return copy;
  }

  function expectNoInvoiceLeak(raw: string, key: InvoiceKey): void {
    expect(raw).not.toContain('%PDF');
    expect(raw).not.toContain(invoiceNumber[key]);
    expect(raw).not.toContain('105.00');
    expect(raw).not.toContain('Organic carrots');
    expect(raw).not.toContain(customers.A);
    expect(raw).not.toContain(customers.B);
  }

  async function listedKeys(who: string): Promise<InvoiceKey[]> {
    const res = await request(server)
      .get('/v1/invoices')
      .query({ fromDate: ISSUE_DATE, toDate: ISSUE_DATE, limit: 100 })
      .set('Authorization', bearer(who));
    expect(res.status, `${who} list ${JSON.stringify(res.body)}`).toBe(200);
    const ids = new Set((res.body.items as Array<{ id: string }>).map((item) => item.id));
    return ALL_KEYS.filter((key) => ids.has(invoice[key]));
  }

  httpIt("BR-36: customer B cannot read or download customer A's invoice: 404 with the same body as an unknown id, no PDF bytes and no invoice fields", async () => {
    const unknownDetail = await detail(RANDOM_ID, 'customerB');
    expect(unknownDetail.status).toBe(404);

    const res = await detail(invoice.A, 'customerB');
    expect(res.status, JSON.stringify(res.body)).toBe(404);
    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(normalisedProblem(res.body, invoice.A)).toEqual(normalisedProblem(unknownDetail.body, RANDOM_ID));
    expect(res.body).toMatchObject({ code: 'NOT_FOUND', status: 404 });
    expectNoInvoiceLeak(res.text, 'A');

    const unknownPdf = await download(pdfPath(RANDOM_ID), 'customerB');
    const pdf = await download(pdfPath(invoice.A), 'customerB');
    expect(pdf.status).toBe(404);
    expect(pdf.type).toContain('application/problem+json');
    const pdfText = pdf.bytes.toString('latin1');
    expectNoInvoiceLeak(pdfText, 'A');
    expect(unknownPdf.status).toBe(404);
    expect(normalisedProblem(JSON.parse(pdfText), invoice.A)).toEqual(normalisedProblem(JSON.parse(unknownPdf.bytes.toString('utf8')), RANDOM_ID));
  });

  httpIt('BR-36: a customer reads and downloads their own invoice (200 JSON detail with lines, 200 application/pdf)', async () => {
    const res = await detail(invoice.A, 'customerA');
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body).toMatchObject({ id: invoice.A, invoiceNumber: invoiceNumber.A, orderId: orders[0], totalAmount: '105.00' });
    expect(res.body.lines).toHaveLength(1);

    const pdf = await download(pdfPath(invoice.A), 'customerA');
    expect(pdf.status).toBe(200);
    expect(pdf.type).toContain('application/pdf');
    expect(pdf.bytes.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  });

  httpIt('BR-36: redirect=true mints a signed link only for an invoice the caller may see; the link then works without a bearer token', async () => {
    const unknown = await download(`${pdfPath(RANDOM_ID)}?redirect=true`, 'customerB');
    const refused = await download(`${pdfPath(invoice.A)}?redirect=true`, 'customerB');
    expect(refused.status).toBe(404);
    expect(refused.location).toBeUndefined();
    const refusedText = refused.bytes.toString('utf8');
    expectNoInvoiceLeak(refusedText, 'A');
    expect(normalisedProblem(JSON.parse(refusedText), invoice.A)).toEqual(normalisedProblem(JSON.parse(unknown.bytes.toString('utf8')), RANDOM_ID));

    const minted = await download(`${pdfPath(invoice.A)}?redirect=true`, 'customerA');
    expect(minted.status).toBe(302);
    expect(minted.location).toMatch(new RegExp(`^/v1/invoices/${invoice.A}/download\\?token=[0-9a-f]{64}&expires=\\d+$`));

    const followed = await download(minted.location!);
    expect(followed.status).toBe(200);
    expect(followed.type).toContain('application/pdf');
    expect(followed.bytes.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  });

  httpIt('BR-36: the signed link is refused with 403 when tampered, expired, bound to another invoice or missing its expiry', async () => {
    const minted = await download(`${pdfPath(invoice.A)}?redirect=true`, 'superAdmin');
    expect(minted.status).toBe(302);
    const link = new URL(`http://local${minted.location!}`);
    const token = link.searchParams.get('token')!;
    const expires = link.searchParams.get('expires')!;
    const flipped = `${token.slice(0, -1)}${token.endsWith('0') ? '1' : '0'}`;
    // Correctly signed, but for a moment that has already passed: only the expiry check refuses it.
    const past = String(Date.now() - 60_000);
    const expiredToken = createHmac('sha256', jwtSecret).update(`${invoice.A}:${past}`).digest('hex');

    for (const [label, path] of [
      ['tampered token', `${pdfPath(invoice.A)}?token=${flipped}&expires=${expires}`],
      ['expired link', `${pdfPath(invoice.A)}?token=${expiredToken}&expires=${past}`],
      ['link for invoice A used on invoice B', `${pdfPath(invoice.B)}?token=${token}&expires=${expires}`],
      ['token without expires', `${pdfPath(invoice.A)}?token=${token}`],
    ] as const) {
      const res = await download(path);
      expect(res.status, label).toBe(403);
      const text = res.bytes.toString('utf8');
      expect(JSON.parse(text), label).toMatchObject({ code: 'FORBIDDEN' });
      expect(text, label).not.toContain('%PDF');
    }
  });

  httpIt('BR-36: without a bearer token and without a signed link the detail, the download and redirect=true are 401', async () => {
    const res = await detail(invoice.A);
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ code: 'UNAUTHENTICATED' });
    for (const path of [pdfPath(invoice.A), `${pdfPath(invoice.A)}?redirect=true`]) {
      const pdf = await download(path);
      expect(pdf.status, path).toBe(401);
      expect(JSON.parse(pdf.bytes.toString('utf8')), path).toMatchObject({ code: 'UNAUTHENTICATED' });
      expect(pdf.location, path).toBeUndefined();
    }
  });

  httpIt("BR-30: a Sub Warehouse Admin reads and downloads invoices of its own warehouse's orders; another warehouse's invoice is 404 with the same body as an unknown id", async () => {
    expect(await listedKeys('subOoty')).toEqual(['A']);
    expect((await detail(invoice.A, 'subOoty')).status).toBe(200);
    expect((await download(pdfPath(invoice.A), 'subOoty')).status).toBe(200);

    const unknown = await detail(RANDOM_ID, 'subOoty');
    const other = await detail(invoice.B, 'subOoty');
    expect(other.status).toBe(404);
    expect(normalisedProblem(other.body, invoice.B)).toEqual(normalisedProblem(unknown.body, RANDOM_ID));
    expectNoInvoiceLeak(other.text, 'B');
    const otherPdf = await download(pdfPath(invoice.B), 'subOoty');
    expect(otherPdf.status).toBe(404);
    expectNoInvoiceLeak(otherPdf.bytes.toString('latin1'), 'B');
    // An invoice with no order (a farmer purchase invoice) has no warehouse, so no Sub admin sees it.
    expect((await detail(invoice.F, 'subOoty')).status).toBe(404);
  });

  const matrix: Array<{ who: string; expected: InvoiceKey[] | 403 }> = [
    { who: 'customerA', expected: ['A'] },
    { who: 'customerB', expected: ['B'] },
    { who: 'customerNoProfile', expected: [] },
    { who: 'farmerF', expected: ['F'] },
    { who: 'farmerOther', expected: [] },
    { who: 'subOoty', expected: ['A'] },
    { who: 'subCoonoor', expected: ['B'] },
    { who: 'main', expected: ['A', 'B', 'F'] },
    { who: 'mainOoty', expected: ['A', 'B', 'F'] },
    { who: 'superAdmin', expected: ['A', 'B', 'F'] },
    { who: 'tohfaAdmin', expected: ['A', 'B', 'F'] },
    { who: 'farmerAdmin', expected: 403 },
  ];

  httpIt('BR-36: list, detail and download return the same invoices for every role (customer, farmer, farmer admin 403, sub per warehouse, main, super and tohfa admin)', async () => {
    for (const { who, expected } of matrix) {
      if (expected === 403) {
        const list = await request(server).get('/v1/invoices').set('Authorization', bearer(who));
        expect(list.status, `${who} list`).toBe(403);
        for (const key of ALL_KEYS) {
          expect((await detail(invoice[key], who)).status, `${who} detail ${key}`).toBe(403);
          expect((await download(pdfPath(invoice[key]), who)).status, `${who} download ${key}`).toBe(403);
          expect((await download(`${pdfPath(invoice[key])}?redirect=true`, who)).status, `${who} redirect ${key}`).toBe(403);
        }
        continue;
      }
      const listed = await listedKeys(who);
      expect(listed, `${who} list`).toEqual(expected);
      for (const key of ALL_KEYS) {
        const visible = listed.includes(key);
        const res = await detail(invoice[key], who);
        expect(res.status, `${who} detail ${key}`).toBe(visible ? 200 : 404);
        if (visible) expect(res.body.id, `${who} detail ${key}`).toBe(invoice[key]);
        else expectNoInvoiceLeak(res.text, key);
        const pdf = await download(pdfPath(invoice[key]), who);
        expect(pdf.status, `${who} download ${key}`).toBe(visible ? 200 : 404);
        expect(pdf.type, `${who} download ${key}`).toContain(visible ? 'application/pdf' : 'application/problem+json');
        const redirect = await download(`${pdfPath(invoice[key])}?redirect=true`, who);
        expect(redirect.status, `${who} redirect ${key}`).toBe(visible ? 302 : 404);
      }
    }
  });
});
