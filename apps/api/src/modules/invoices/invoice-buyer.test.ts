/**
 * GET /v1/invoices/{id}: the buyer's name and GSTIN on the invoice detail (BR-128, owner request
 * 2026-10-26, "Group D" D2).
 *
 * The invoice has no buyer snapshot column (migration 0007 `invoices`), so the buyer is read LIVE
 * when the detail is served: the invoice's customer (`users.full_name`, `customers.gstin`), else the
 * walk-in buyer named on the invoice's order (name only; a walk-in has no GSTIN). A farmer purchase
 * or payout invoice has no buyer here: both fields are null, and no farmer name is ever put in them.
 * The detail is the same endpoint for every role (`invoice.view_own`); its visibility is unchanged,
 * so a customer reads only their own invoice (and so only their own name and GSTIN), and every
 * other id is still 404 with the unknown-id body (BR-30, BR-36).
 *
 * Real HTTP through the real app router. Fixture rows are committed (the server reads through its
 * own pool), tagged with this run and deleted in afterAll; none lives in an append-only table.
 */
import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { RoleCode } from '@tohfa/shared-types';
import type { RoleAssignment } from '../../auth/jwt.js';
import { IDS, newId } from '../../test/factories.js';
import { insertUser, requireDatabaseTables } from '../../test/dbFixtures.js';

/** The detail's documented keys (openapi `InvoiceDetail`), now with the two buyer keys. */
const DETAIL_KEYS = [
  'buyerGstin', 'buyerName', 'cgst', 'gstApplicable', 'gstInclusive', 'id', 'igst', 'invoiceNumber', 'invoiceType',
  'issueDate', 'lines', 'orderId', 'payoutId', 'pdfUrl', 'placeOfSupply', 'purchaseOrderId', 'sgst', 'status',
  'taxableAmount', 'totalAmount',
].sort();

/** Any key that could carry a farm identity (BR-16). */
const FARM_KEY = /farm|village|gps|fmb|latitude|longitude|^lat$|^lng$|batch|source|allocation|plot/i;

function keysMatching(pattern: RegExp, value: unknown, path = '$'): string[] {
  if (Array.isArray(value)) return value.flatMap((item, i) => keysMatching(pattern, item, `${path}[${i}]`));
  if (value !== null && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => [
      ...(pattern.test(key) ? [`${path}.${key}`] : []),
      ...keysMatching(pattern, child, `${path}.${key}`),
    ]);
  }
  return [];
}

/** A GSTIN the `customers_gstin_format_chk` CHECK accepts, unique per run. */
function randomGstin(): string {
  const letters = Array.from({ length: 5 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
  const digits = String(Math.floor(Math.random() * 10_000)).padStart(4, '0');
  return `33${letters}${digits}Z1Z5`;
}

type Key = 'gst' | 'noGst' | 'walkIn' | 'farmer';

describe('invoice detail buyer name and GSTIN (real router) — BR-128', () => {
  let ready = false;
  const httpIt = (name: string, fn: () => Promise<void>): void => {
    it(name, async (ctx) => {
      if (!ready) return ctx.skip();
      await fn();
    });
  };

  let server: Server;
  const tokens: Record<string, string> = {};
  const tag = `br128-${Date.now()}`;
  const gstin = randomGstin();
  const users: string[] = [];
  const customers: Record<'gst' | 'noGst', string> = { gst: '', noGst: '' };
  let farmerId = '';
  const orders: string[] = [];
  const invoice: Record<Key, string> = { gst: '', noGst: '', walkIn: '', farmer: '' };
  let ootyId = '';
  let coonoorId = '';

  beforeAll(async () => {
    ready = await requireDatabaseTables('invoices', 'invoice_lines', 'orders', 'customers', 'farmers', 'warehouses');
    if (!ready) return;
    const [{ createApp }, { signAccessToken }, { pool }] = await Promise.all([
      import('../../app.js'),
      import('../../auth/jwt.js'),
      import('../../db/pool.js'),
    ]);

    const wh = await pool.query<{ id: string; code: string }>(`SELECT id, code FROM warehouses WHERE code IN ('WH-OOTY', 'WH-COON')`);
    ootyId = wh.rows.find((w) => w.code === 'WH-OOTY')!.id;
    coonoorId = wh.rows.find((w) => w.code === 'WH-COON')!.id;

    const gstUser = await insertUser(pool, 'CUSTOMER', 'Nilgiri Hotels Buyer');
    const plainUser = await insertUser(pool, 'CUSTOMER', 'Plain Retail Buyer');
    const farmerUser = await insertUser(pool, 'FARMER', 'Ravi Farmer Seller');
    users.push(gstUser, plainUser, farmerUser);
    customers.gst = newId();
    customers.noGst = newId();
    await pool.query(`INSERT INTO customers (id, user_id, customer_code, gstin) VALUES ($1, $2, $3, $4)`, [customers.gst, gstUser, `${tag}-G`, gstin]);
    await pool.query(`INSERT INTO customers (id, user_id, customer_code) VALUES ($1, $2, $3)`, [customers.noGst, plainUser, `${tag}-N`]);
    farmerId = newId();
    await pool.query(`INSERT INTO farmers (id, user_id, tohfa_farmer_id) VALUES ($1, $2, $3)`, [farmerId, farmerUser, `TOHFA-${tag}`]);

    const order = async (customerId: string | null, warehouseId: string): Promise<string> => {
      const id = newId();
      if (customerId === null) {
        await pool.query(
          `INSERT INTO orders (id, order_number, customer_id, walk_in_name, walk_in_mobile, warehouse_id, channel, payment_method)
           VALUES ($1, $2, NULL, 'Counter Walk-in Buyer', '+919800055566', $3, 'DIRECT', 'CASH')`,
          [id, `ORD-${tag}-${orders.length}`, warehouseId],
        );
      } else {
        await pool.query(`INSERT INTO orders (id, order_number, customer_id, warehouse_id) VALUES ($1, $2, $3, $4)`, [id, `ORD-${tag}-${orders.length}`, customerId, warehouseId]);
      }
      orders.push(id);
      return id;
    };
    const issue = async (key: Key, type: 'SALE_RETAIL' | 'SALE_B2B' | 'PURCHASE_FARMER', owner: { customerId?: string; farmerId?: string; orderId?: string }): Promise<void> => {
      invoice[key] = newId();
      await pool.query(
        `INSERT INTO invoices (id, invoice_number, invoice_type, customer_id, farmer_id, order_id, issue_date, fiscal_year,
                               taxable_amount, cgst, sgst, total_amount, gst_inclusive, place_of_supply, status)
         VALUES ($1, $2, $3, $4, $5, $6, '2019-03-18', '2018-19', 100.00, 2.50, 2.50, 105.00, true, '33-Tamil Nadu', 'ISSUED')`,
        [invoice[key], `TOH/${tag}/${key}`, type, owner.customerId ?? null, owner.farmerId ?? null, owner.orderId ?? null],
      );
      await pool.query(
        `INSERT INTO invoice_lines (invoice_id, line_no, description, hsn_code, qty, unit_price, gst_rate, taxable, tax, total)
         VALUES ($1, 1, 'Organic carrots', '0706', 1, 105.00, 5, 100.00, 5.00, 105.00)`,
        [invoice[key]],
      );
    };
    await issue('gst', 'SALE_B2B', { customerId: customers.gst, orderId: await order(customers.gst, ootyId) });
    await issue('noGst', 'SALE_RETAIL', { customerId: customers.noGst, orderId: await order(customers.noGst, coonoorId) });
    await issue('walkIn', 'SALE_RETAIL', { orderId: await order(null, ootyId) });
    await issue('farmer', 'PURCHASE_FARMER', { farmerId });

    const sign = (roles: RoleAssignment[], ids: { farmerId?: string; customerId?: string } = {}, sub: string = IDS.userSuperAdmin): string =>
      signAccessToken({ sub, roles, farmerId: ids.farmerId ?? null, customerId: ids.customerId ?? null });
    tokens['customerGst'] = sign([{ code: RoleCode.CUSTOMER }], { customerId: customers.gst }, gstUser);
    tokens['customerPlain'] = sign([{ code: RoleCode.CUSTOMER }], { customerId: customers.noGst }, plainUser);
    tokens['farmer'] = sign([{ code: RoleCode.FARMER }], { farmerId }, farmerUser);
    tokens['subOoty'] = sign([{ code: RoleCode.SUB_WH_ADMIN, warehouseId: ootyId }], {}, IDS.userSubWhAdmin);
    tokens['superAdmin'] = sign([{ code: RoleCode.SUPER_ADMIN }]);
    tokens['main'] = sign([{ code: RoleCode.MAIN_WH_ADMIN }]);

    server = createApp().listen(0);
  }, 60_000);

  afterAll(async () => {
    if (!ready) return;
    const [{ withTransaction, closePool }, { closeRedis }] = await Promise.all([import('../../db/pool.js'), import('../../redis.js')]);
    await withTransaction(async (tx) => {
      const ids = Object.values(invoice).filter((id) => id !== '');
      await tx.query(`DELETE FROM invoice_lines WHERE invoice_id = ANY($1::uuid[])`, [ids]);
      await tx.query(`DELETE FROM invoices WHERE id = ANY($1::uuid[])`, [ids]);
      // As invoice-access.test.ts: these orders never had a history row (asserted), and replica mode
      // only lets the orders DELETE skip the append-only statement trigger's cascade.
      const history = await tx.query(`SELECT 1 FROM order_status_history WHERE order_id = ANY($1::uuid[])`, [orders]);
      if (history.rowCount !== 0) throw new Error('fixture orders unexpectedly have order_status_history rows; refusing to delete them');
      await tx.query(`SET LOCAL session_replication_role = replica`);
      await tx.query(`DELETE FROM orders WHERE id = ANY($1::uuid[])`, [orders]);
      await tx.query(`SET LOCAL session_replication_role = origin`);
      await tx.query(`DELETE FROM customers WHERE id = ANY($1::uuid[])`, [Object.values(customers).filter((id) => id !== '')]);
      if (farmerId !== '') await tx.query(`DELETE FROM farmers WHERE id = $1`, [farmerId]);
      await tx.query(`DELETE FROM users WHERE id = ANY($1::uuid[])`, [users]);
    });
    if (server !== undefined) await new Promise<void>((resolve) => server.close(() => resolve()));
    await Promise.allSettled([closePool(), closeRedis()]);
  });

  const detail = (key: Key, who: string) => request(server).get(`/v1/invoices/${invoice[key]}`).set('Authorization', `Bearer ${tokens[who]!}`);

  httpIt('BR-128a: an admin reads the registered buyer\'s name and GSTIN, as stored; the detail key set is the documented one', async () => {
    for (const who of ['superAdmin', 'main', 'subOoty']) {
      const res = await detail('gst', who);
      expect(res.status, who).toBe(200);
      expect(Object.keys(res.body).sort(), who).toEqual(DETAIL_KEYS);
      expect(res.body.buyerName, who).toBe('Nilgiri Hotels Buyer');
      expect(res.body.buyerGstin, who).toBe(gstin);
    }
    // A customer with no GSTIN: the name, and null (never '').
    const plain = await detail('noGst', 'superAdmin');
    expect(plain.status).toBe(200);
    expect(plain.body.buyerName).toBe('Plain Retail Buyer');
    expect(plain.body.buyerGstin).toBeNull();
  });

  httpIt('BR-128b: a customer reads their own name and GSTIN on their own invoice; nothing farm-identifying is added', async () => {
    const own = await detail('gst', 'customerGst');
    expect(own.status).toBe(200);
    expect(Object.keys(own.body).sort()).toEqual(DETAIL_KEYS);
    expect(own.body.buyerName).toBe('Nilgiri Hotels Buyer');
    expect(own.body.buyerGstin).toBe(gstin);
    expect(keysMatching(FARM_KEY, own.body)).toEqual([]);
    expect(own.text).not.toContain('Ravi Farmer Seller');
  });

  httpIt('BR-128c: another customer\'s invoice is still 404, and the 404 names neither buyer nor GSTIN', async () => {
    const res = await detail('gst', 'customerPlain');
    expect(res.status).toBe(404);
    expect(res.text).not.toContain('Nilgiri Hotels Buyer');
    expect(res.text).not.toContain(gstin);
    // A Sub admin of Ooty cannot read the Coonoor customer's invoice either.
    const sub = await detail('noGst', 'subOoty');
    expect(sub.status).toBe(404);
    expect(sub.text).not.toContain('Plain Retail Buyer');
  });

  httpIt('BR-128d: a walk-in counter-sale invoice names the walk-in buyer (no GSTIN); the walk-in mobile never appears', async () => {
    const res = await detail('walkIn', 'subOoty');
    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual(DETAIL_KEYS);
    expect(res.body.buyerName).toBe('Counter Walk-in Buyer');
    expect(res.body.buyerGstin).toBeNull();
    expect(res.text).not.toContain('9800055566');
  });

  httpIt('BR-128e: a farmer purchase invoice has no buyer here (both null) for the farmer and for an admin; no farmer name is put in buyerName', async () => {
    for (const who of ['farmer', 'superAdmin']) {
      const res = await detail('farmer', who);
      expect(res.status, who).toBe(200);
      expect(Object.keys(res.body).sort(), who).toEqual(DETAIL_KEYS);
      expect(res.body.buyerName, who).toBeNull();
      expect(res.body.buyerGstin, who).toBeNull();
      expect(res.text, who).not.toContain('Ravi Farmer Seller');
    }
  });

  httpIt('BR-128f: with no snapshot column the buyer is read live: a GSTIN added after issue shows on the next read (UNCONFIRMED: snapshot needs a migration)', async () => {
    const { pool } = await import('../../db/pool.js');
    const later = randomGstin();
    await pool.query(`UPDATE customers SET gstin = $1 WHERE id = $2`, [later, customers.noGst]);
    try {
      const res = await detail('noGst', 'customerPlain');
      expect(res.status).toBe(200);
      expect(res.body.buyerGstin).toBe(later);
    } finally {
      await pool.query(`UPDATE customers SET gstin = NULL WHERE id = $1`, [customers.noGst]);
    }
  });
});
