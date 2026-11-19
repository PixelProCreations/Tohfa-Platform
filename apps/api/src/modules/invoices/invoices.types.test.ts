import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { RoleCode } from '@tohfa/shared-types';
import { signAccessToken } from '../../auth/jwt.js';
import { IDS, newId } from '../../test/factories.js';
import { pool } from '../../db/pool.js';

describe('BR-169: invoice types support (GET /invoices/:id)', () => {
  const app = createApp();
  const superAdminToken = signAccessToken({
    sub: IDS.userSuperAdmin,
    roles: [{ code: RoleCode.SUPER_ADMIN }],
    farmerId: null,
    customerId: null,
  });

  const createInvoiceOfType = async (type: string, number: string) => {
    const res = await pool.query<{ id: string }>(
      `INSERT INTO invoices (
        id, invoice_number, invoice_type, fiscal_year, issue_date,
        taxable_amount, cgst, sgst, igst, total_amount,
        status, place_of_supply, gst_inclusive, created_at
      ) VALUES (
        $1, $2, $3::invoice_type, '2026-27', CURRENT_DATE,
        100.00, 2.50, 2.50, 0.00, 105.00,
        'ISSUED', '33-Tamil Nadu', false, now()
      ) RETURNING id`,
      [newId(), number, type],
    );
    return res.rows[0]!.id;
  };

  const invoiceTypes = ['SALE_RETAIL', 'SALE_B2B', 'PURCHASE_FARMER', 'PAYOUT', 'SUBSCRIPTION'];

  for (const type of invoiceTypes) {
    it(`BR-169: GET /invoices/:id returns invoiceType = ${type}`, async () => {
      const invNum = `INV-TEST-${type}-${Date.now()}`;
      const invId = await createInvoiceOfType(type, invNum);

      try {
        const res = await request(app)
          .get(`/v1/invoices/${invId}`)
          .set('Authorization', `Bearer ${superAdminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.invoiceType).toBe(type);
        expect(res.body.invoiceNumber).toBe(invNum);
        expect(res.body).toHaveProperty('taxableAmount');
        expect(res.body).toHaveProperty('totalAmount');
      } finally {
        await pool.query('DELETE FROM invoices WHERE id = $1', [invId]);
      }
    });
  }
});
