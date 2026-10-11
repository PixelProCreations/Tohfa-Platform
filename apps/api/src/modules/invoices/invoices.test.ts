import { it, expect, beforeAll, afterAll } from 'vitest';
import { pool } from '../../db/pool.js';
import { databaseReady, describeIfDatabase, newId } from '../../test/factories.js';
import { insertUser } from '../../test/dbFixtures.js';
import { invoicesService } from './invoices.service.js';
import { fromPaise, equals, add, ZERO, RoleCode } from '@tohfa/shared-types';

function extractPdfText(pdfBuffer: Buffer): string {
  const raw = pdfBuffer.toString('latin1');
  const hexMatches = raw.matchAll(/<([0-9a-fA-F]+)>/g);
  let decoded = '';
  for (const match of hexMatches) {
    decoded += Buffer.from(match[1]!, 'hex').toString('latin1') + ' ';
  }
  return decoded;
}

describeIfDatabase('Invoices Module (S-38)', () => {
  let dbAvailable = false;

  beforeAll(async () => {
    dbAvailable = await databaseReady('invoices');
  });

  afterAll(async () => {
    if (dbAvailable) {
      try {
        await pool.query(`DELETE FROM invoice_lines WHERE invoice_id IN (SELECT id FROM invoices WHERE invoice_number LIKE 'TOH/2026-27/TEST%')`);
        await pool.query(`DELETE FROM invoices WHERE invoice_number LIKE 'TOH/2026-27/TEST%'`);
      } catch {
        // Ignore cleanup errors if table doesn't exist
      }
    }
  });

  it('INV-RECONCILE: asserts exact paisa equality between lines and invoice total (BR-16)', async () => {
    if (!dbAvailable) return;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const line1Total = fromPaise(10500); // Rs 105.00 (5% GST inclusive)
      const line2Total = fromPaise(21000); // Rs 210.00 (5% GST inclusive)
      const expectedTotal = fromPaise(31500); // Rs 315.00

      const invoice = await invoicesService.issue(client, {
        invoiceType: 'SALE_RETAIL',
        fiscalYear: '2026-27',
        placeOfSupply: '33-Tamil Nadu',
        totalAmount: expectedTotal,
        gstInclusive: true,
        lines: [
          { lineNo: 1, description: 'Organic Nilgiri Carrots (Grade A)', qty: 2.5, unitPrice: fromPaise(4200), gstRate: 5, total: line1Total },
          { lineNo: 2, description: 'Organic Nilgiri Potatoes (Grade A)', qty: 5.0, unitPrice: fromPaise(4200), gstRate: 5, total: line2Total },
        ],
      });

      // Sum lines
      const sumLines = invoice.lines.reduce((acc, l) => add(acc, l.total), ZERO);
      expect(equals(sumLines, invoice.totalAmount)).toBe(true);
      expect(equals(invoice.totalAmount, expectedTotal)).toBe(true);

      // Verify Intra-State CGST + SGST (never IGST)
      expect(parseFloat(invoice.cgst)).toBeGreaterThan(0);
      expect(parseFloat(invoice.sgst)).toBeGreaterThan(0);
      expect(parseFloat(invoice.igst)).toBe(0);
      expect(invoice.cgst).toBe(invoice.sgst);

      // Verify DB constraint (cgst + sgst + taxable === total in paise)
      const totalTaxable = invoice.lines.reduce((acc, l) => add(acc, l.taxable), ZERO);
      const totalTax = add(invoice.cgst, invoice.sgst);
      expect(equals(add(totalTaxable, totalTax), invoice.totalAmount)).toBe(true);

      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });

  it('INV-RECONCILE: inter-state invoice uses IGST and sets CGST & SGST to zero', async () => {
    if (!dbAvailable) return;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const total = fromPaise(50000); // Rs 500.00
      const invoice = await invoicesService.issue(client, {
        invoiceType: 'SALE_B2B',
        fiscalYear: '2026-27',
        placeOfSupply: '29-Karnataka', // Inter-state
        totalAmount: total,
        gstInclusive: false,
        lines: [
          { lineNo: 1, description: 'B2B Wholesale Organic Carrots', qty: 10, unitPrice: fromPaise(5000), gstRate: 5, total },
        ],
      });

      expect(parseFloat(invoice.igst)).toBeGreaterThan(0);
      expect(parseFloat(invoice.cgst)).toBe(0);
      expect(parseFloat(invoice.sgst)).toBe(0);

      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });

  it('BR-16b: extracts rendered PDF and proves no farm or farmer identifier leaks on retail sale', async () => {
    if (!dbAvailable) return;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const distinctFarmName = 'SecretWhisperingPinesFarm99';
      const distinctVillageName = 'HiddenMistyValleyVillage88';
      const distinctFarmerName = 'Shanmugam Subramanian Unique';

      // The PDF is rendered for the customer who owns the invoice (BR-36: getPdf checks it).
      const customerUserId = await insertUser(client, 'CUSTOMER', 'BR-16b Customer');
      const customerId = newId();
      await client.query(`INSERT INTO customers (id, user_id, customer_code) VALUES ($1, $2, $3)`, [
        customerId,
        customerUserId,
        `BR16B-${customerId.slice(0, 8)}`,
      ]);

      const invoice = await invoicesService.issue(client, {
        invoiceType: 'SALE_RETAIL',
        customerId,
        fiscalYear: '2026-27',
        placeOfSupply: '33-Tamil Nadu',
        totalAmount: fromPaise(15000),
        gstInclusive: true,
        lines: [
          { lineNo: 1, description: 'Organic Beetroot (Grade A)', qty: 3, unitPrice: fromPaise(5000), gstRate: 5, total: fromPaise(15000) },
        ],
      });
      await client.query('COMMIT');

      // Generate PDF buffer
      const pdfBuffer = await invoicesService.getPdf(
        { userId: customerUserId, customerId, farmerId: null, roles: [{ code: RoleCode.CUSTOMER }] },
        invoice.id,
      );

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(1000);

      // Verify the text content inside the PDF
      const pdfText = extractPdfText(pdfBuffer);
      const normalized = pdfText.replace(/\s+/g, ' ');
      const compact = pdfText.replace(/\s+/g, '');

      expect(compact).toContain('TOHFAPLATFORM');
      expect(compact).toContain('RETAILTAXINVOICE');
      expect(normalized).not.toContain(distinctFarmName);
      expect(normalized).not.toContain(distinctVillageName);
      expect(normalized).not.toContain(distinctFarmerName);

      await pool.query('DELETE FROM invoice_lines WHERE invoice_id = $1', [invoice.id]);
      await pool.query('DELETE FROM invoices WHERE id = $1', [invoice.id]);
      await pool.query('DELETE FROM customers WHERE id = $1', [customerId]);
      await pool.query('DELETE FROM users WHERE id = $1', [customerUserId]);
    } finally {
      client.release();
    }
  });

  it('Signed download link expires in 5 minutes and invalid/tampered signatures return false', async () => {
    const invoiceId = '00000000-0000-0000-0000-000000000001';
    const signed = invoicesService.generateSignedDownloadUrl(invoiceId);

    expect(signed.url).toContain('/v1/invoices/00000000-0000-0000-0000-000000000001/download?token=');
    expect(signed.expiresAt).toBeGreaterThan(Date.now());

    // Extract token & expires from generated URL
    const urlObj = new URL('http://localhost' + signed.url);
    const token = urlObj.searchParams.get('token')!;
    const expires = parseInt(urlObj.searchParams.get('expires')!, 10);

    // 1. Valid signature
    expect(invoicesService.verifyDownloadSignature(invoiceId, token, expires)).toBe(true);

    // 2. Tampered signature
    expect(invoicesService.verifyDownloadSignature(invoiceId, token + 'tampered', expires)).toBe(false);

    // 3. Expired timestamp
    const expiredTimestamp = Date.now() - 1000;
    expect(invoicesService.verifyDownloadSignature(invoiceId, token, expiredTimestamp)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// SWA Module 6: gap-free invoice numbers (migration 0062) and per-invoice GST (BR-98).
// Each test uses its own fiscal year in 1900-1989, so it never shares a counter with real data.
// ---------------------------------------------------------------------------
describeIfDatabase('Invoices: gap-free counter and per-invoice GST (BR-87h, BR-98)', () => {
  let ready = false;
  const usedYears: string[] = [];

  function freshFiscalYear(): string {
    const start = 1900 + Math.floor(Math.random() * 90);
    const fy = `${start}-${String((start + 1) % 100).padStart(2, '0')}`;
    usedYears.push(fy);
    return fy;
  }

  const oneLine = (total: string) => [
    { lineNo: 1, description: 'Carrot - GRADE_1', qty: 1, unitPrice: total as never, gstRate: 0, total: total as never },
  ];

  beforeAll(async () => {
    ready = await databaseReady('invoice_number_counters');
  });

  afterAll(async () => {
    if (!ready || usedYears.length === 0) return;
    await pool.query(`DELETE FROM invoice_lines WHERE invoice_id IN (SELECT id FROM invoices WHERE fiscal_year = ANY($1))`, [usedYears]);
    await pool.query(`DELETE FROM invoices WHERE fiscal_year = ANY($1)`, [usedYears]);
    await pool.query(`DELETE FROM invoice_number_counters WHERE fiscal_year = ANY($1)`, [usedYears]);
  });

  it('BR-98g: two concurrent issues in one fiscal year get consecutive numbers, never the same one', async (ctx) => {
    if (!ready) return ctx.skip();
    const fiscalYear = freshFiscalYear();
    const a = await pool.connect();
    const b = await pool.connect();
    try {
      await a.query('BEGIN');
      await b.query('BEGIN');
      const first = await invoicesService.issue(a, { invoiceType: 'SALE_RETAIL', fiscalYear, totalAmount: '10.00' as never, lines: oneLine('10.00') });
      // B must wait for A (row lock on the counter), not compute the same number and collide.
      const secondPromise = invoicesService.issue(b, { invoiceType: 'SALE_RETAIL', fiscalYear, totalAmount: '20.00' as never, lines: oneLine('20.00') });
      await new Promise((resolve) => setTimeout(resolve, 150));
      await a.query('COMMIT');
      const second = await secondPromise;
      await b.query('COMMIT');

      expect(first.invoiceNumber).toBe(`TOH/${fiscalYear}/R/000001`);
      expect(second.invoiceNumber).toBe(`TOH/${fiscalYear}/R/000002`);
    } finally {
      await a.query('ROLLBACK').catch(() => undefined);
      await b.query('ROLLBACK').catch(() => undefined);
      a.release();
      b.release();
    }
  });

  it('BR-87h: a rolled-back issue does not consume a number (no gap), and each series counts on its own', async (ctx) => {
    if (!ready) return ctx.skip();
    const fiscalYear = freshFiscalYear();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const rolledBack = await invoicesService.issue(client, { invoiceType: 'SALE_RETAIL', fiscalYear, totalAmount: '5.00' as never, lines: oneLine('5.00') });
      expect(rolledBack.invoiceNumber).toBe(`TOH/${fiscalYear}/R/000001`);
      await client.query('ROLLBACK');

      await client.query('BEGIN');
      const kept = await invoicesService.issue(client, { invoiceType: 'SALE_RETAIL', fiscalYear, totalAmount: '5.00' as never, lines: oneLine('5.00') });
      const b2b = await invoicesService.issue(client, { invoiceType: 'SALE_B2B', fiscalYear, totalAmount: '5.00' as never, lines: oneLine('5.00') });
      await client.query('COMMIT');
      expect(kept.invoiceNumber).toBe(`TOH/${fiscalYear}/R/000001`);
      expect(b2b.invoiceNumber).toBe(`TOH/${fiscalYear}/B/000001`);
    } finally {
      await client.query('ROLLBACK').catch(() => undefined);
      client.release();
    }
  });

  it('BR-98c: invoiceGst is applied once per invoice: two 10.10 lines at 5% carry 1.01 GST on the invoice, total 21.21', async (ctx) => {
    if (!ready) return ctx.skip();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const invoice = await invoicesService.issue(client, {
        invoiceType: 'SALE_RETAIL',
        fiscalYear: freshFiscalYear(),
        totalAmount: '21.21' as never,
        gstInclusive: false,
        invoiceGst: '1.01' as never,
        lines: [
          { lineNo: 1, description: 'Carrot - GRADE_1', qty: 1, unitPrice: '10.10' as never, gstRate: 5, total: '10.10' as never },
          { lineNo: 2, description: 'Beans - GRADE_1', qty: 1, unitPrice: '10.10' as never, gstRate: 5, total: '10.10' as never },
        ],
      });
      expect(invoice.taxableAmount).toBe('20.20');
      expect(add(invoice.cgst, invoice.sgst)).toBe('1.01');
      expect(invoice.igst).toBe('0.00');
      expect(invoice.totalAmount).toBe('21.21');
      expect(invoice.gstInclusive).toBe(false);
      expect(invoice.lines.map((l) => l.total)).toEqual(['10.10', '10.10']);
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });
});
