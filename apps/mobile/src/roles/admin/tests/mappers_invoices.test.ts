/**
 * screens/warehouse/billing-invoices/mappers.ts: the invoice API rows -> the
 * billing screens' types.
 *
 * Money is integer paise end to end (the API's Money strings go through
 * @tohfa/shared-types parseMoney/toPaise) and line quantities integer grams,
 * so no float touches either. The invoice status and invoice type enums each
 * have an exhaustive table with a fallback for a value the app does not know.
 *
 * What the server decides is shown as sent, never recomputed: the taxable
 * value, each tax component and the total come straight from the invoice; the
 * app adds nothing up (BR-36: the invoice is the server's record, and the
 * signed PDF is the document of record).
 */
import type { Money } from '@tohfa/shared-types';
import { describe, expect, it } from 'vitest';
import type { InvoiceDetailDto, InvoiceDto, InvoiceStatus, InvoiceType } from '../api/invoices';
import { t } from '../i18n';
import {
  INVOICE_STATUS_TABLE,
  INVOICE_TYPE_TABLE,
  groupInvoicesByDay,
  historyTypeFilter,
  invoiceIdParam,
  invoiceStatusOf,
  toInvoiceDetail,
  toInvoiceRow,
} from '../screens/warehouse/billing-invoices/mappers';

const INVOICE = '22222222-2222-4222-8222-222222222222';
const ORDER = '33333333-3333-4333-8333-333333333333';
const LINE = '44444444-4444-4444-8444-444444444444';

/** docs/openapi.yaml Invoice.status. */
const SPEC_STATUSES: readonly InvoiceStatus[] = ['DRAFT', 'ISSUED', 'CANCELLED', 'CREDIT_NOTED'];
/** docs/openapi.yaml InvoiceType. */
const SPEC_TYPES: readonly InvoiceType[] = ['SALE_RETAIL', 'SALE_B2B', 'PURCHASE_FARMER', 'PAYOUT', 'SUBSCRIPTION'];

function invoice(overrides: Partial<InvoiceDto> = {}): InvoiceDto {
  return {
    id: INVOICE,
    invoiceNumber: 'TOH/2026-27/R/004412',
    invoiceType: 'SALE_RETAIL',
    orderId: ORDER,
    purchaseOrderId: null,
    issueDate: '2026-10-13',
    taxableAmount: '950.50' as Money,
    totalAmount: '950.50' as Money,
    gstApplicable: false,
    status: 'ISSUED',
    pdfUrl: `/v1/invoices/${INVOICE}/download`,
    ...overrides,
  };
}

function detail(overrides: Partial<InvoiceDetailDto> = {}): InvoiceDetailDto {
  return {
    ...invoice(),
    placeOfSupply: 'Tamil Nadu',
    cgst: '0.00' as Money,
    sgst: '0.00' as Money,
    igst: '0.00' as Money,
    gstInclusive: false,
    lines: [
      {
        description: 'Carrot (Grade 1)',
        hsnCode: '0709',
        qty: '0.125',
        unitPrice: '0.10' as Money,
        gstRate: 0,
        taxable: '47.53' as Money,
        tax: '0.00' as Money,
        total: '47.53' as Money,
      },
      {
        description: 'Beans (Grade 2)',
        hsnCode: null,
        qty: '2.000',
        unitPrice: '451.49' as Money,
        gstRate: 0,
        taxable: '902.97' as Money,
        tax: '0.00' as Money,
        total: '902.97' as Money,
      },
    ],
    ...overrides,
  };
}

describe('status and type tables', () => {
  it('the status table is exhaustive over the spec Invoice.status enum', () => {
    expect(Object.keys(INVOICE_STATUS_TABLE).sort()).toEqual([...SPEC_STATUSES].sort());
  });

  it('maps each spec status 1:1 and never invents one', () => {
    expect(INVOICE_STATUS_TABLE).toEqual({
      DRAFT: 'draft',
      ISSUED: 'issued',
      CANCELLED: 'cancelled',
      CREDIT_NOTED: 'creditNoted',
    });
  });

  it('a status the app does not know falls back to unknown, with its own label', () => {
    expect(invoiceStatusOf('VOIDED')).toBe('unknown');
    const row = toInvoiceRow(invoice({ status: 'VOIDED' as InvoiceStatus }));
    expect(row.status).toBe('unknown');
    expect(row.statusLabel).toBe(t('billing.status.unknown'));
  });

  it('every status has a label and a tone', () => {
    for (const status of [...SPEC_STATUSES, 'VOIDED']) {
      const row = toInvoiceRow(invoice({ status: status as InvoiceStatus }));
      expect(row.statusLabel).not.toBe('');
      expect(row.tone).toBeTruthy();
    }
  });

  it('the type table is exhaustive over the spec InvoiceType enum, each with a label', () => {
    expect(Object.keys(INVOICE_TYPE_TABLE).sort()).toEqual([...SPEC_TYPES].sort());
    for (const type of SPEC_TYPES) expect(toInvoiceRow(invoice({ invoiceType: type })).typeLabel).toBe(t(INVOICE_TYPE_TABLE[type]));
  });

  it('an unknown invoice type shows as no value, not as the raw code', () => {
    expect(toInvoiceRow(invoice({ invoiceType: 'SALE_HORECA' as InvoiceType })).typeLabel).toBe(t('billing.noValue'));
  });
});

describe('toInvoiceRow', () => {
  it('keeps the uuid as the key and the invoice number as the label', () => {
    const row = toInvoiceRow(invoice());
    expect(row.id).toBe(INVOICE);
    expect(row.invoiceNumber).toBe('TOH/2026-27/R/004412');
  });

  it('turns the total into integer paise, read as text (no float drift)', () => {
    expect(toInvoiceRow(invoice({ totalAmount: '950.50' as Money })).amountPaise).toBe(95050);
    expect(toInvoiceRow(invoice({ totalAmount: '0.30' as Money })).amountPaise).toBe(30);
    expect(toInvoiceRow(invoice({ totalAmount: '10000.00' as Money })).amountLabel).toBe('₹10,000');
    expect(toInvoiceRow(invoice({ totalAmount: '1234.50' as Money })).amountLabel).toBe('₹1,234.50');
  });

  it('a total that is not a Money string shows as no value, never as 0', () => {
    const row = toInvoiceRow(invoice({ totalAmount: 'abc' as Money }));
    expect(row.amountPaise).toBeNull();
    expect(row.amountLabel).toBe(t('billing.noValue'));
  });

  it('shows the issue date as the IST calendar day it names', () => {
    const row = toInvoiceRow(invoice({ issueDate: '2026-10-13' }));
    expect(row.issueDate).toBe('2026-10-13');
    expect(row.issueDateLabel).toBe('13 Oct 2026');
  });

  it('BR-16: is an allow-list; a farm or customer field a future server adds never reaches the row', () => {
    const leaky = { ...invoice(), farmerId: 'f-1', farmName: 'Green Acres', customerMobile: '+919800000001' } as unknown as InvoiceDto;
    const row = toInvoiceRow(leaky) as unknown as Record<string, unknown>;
    expect(JSON.stringify(row)).not.toMatch(/Green Acres|f-1|9800000001/);
  });
});

describe('toInvoiceDetail', () => {
  it('maps every line with quantity in integer grams and money in integer paise', () => {
    const view = toInvoiceDetail(detail());
    expect(view.lines).toHaveLength(2);
    expect(view.lines[0]).toMatchObject({
      description: 'Carrot (Grade 1)',
      hsnCode: '0709',
      qtyGrams: 125,
      unitPricePaise: 10,
      totalPaise: 4753,
    });
    expect(view.lines[0]?.qtyLabel).toBe('0.125 kg');
    expect(view.lines[1]).toMatchObject({ qtyGrams: 2000, unitPricePaise: 45149, totalPaise: 90297, hsnCode: null });
    expect(view.lines[1]?.qtyLabel).toBe('2 kg');
  });

  it('reads a quantity the server sends as a JSON number through its text, never through float maths', () => {
    // The spec types a line qty as a Quantity string; the server sends parseFloat(qty) today.
    const view = toInvoiceDetail(detail({ lines: [{ ...detail().lines[0]!, qty: 1.25 as unknown as string }] }));
    expect(view.lines[0]?.qtyGrams).toBe(1250);
    const bad = toInvoiceDetail(detail({ lines: [{ ...detail().lines[0]!, qty: 1e-7 as unknown as string }] }));
    expect(bad.lines[0]?.qtyGrams).toBeNull();
    expect(bad.lines[0]?.qtyLabel).toBe(t('billing.noValue'));
  });

  it('BR-36: shows the taxable value, each tax and the total exactly as the server sent them', () => {
    const view = toInvoiceDetail(
      detail({
        taxableAmount: '1000.00' as Money,
        cgst: '25.01' as Money,
        sgst: '24.99' as Money,
        igst: '0.00' as Money,
        totalAmount: '1050.00' as Money,
      }),
    );
    expect(view.taxablePaise).toBe(100000);
    expect(view.totalPaise).toBe(105000);
    expect(view.taxRows.map((r) => [r.key, r.paise])).toEqual([
      ['cgst', 2501],
      ['sgst', 2499],
    ]);
    expect(view.taxRows.map((r) => r.label)).toEqual([t('billing.detail.cgst'), t('billing.detail.sgst')]);
  });

  it('an inter-state invoice shows IGST only', () => {
    const view = toInvoiceDetail(detail({ cgst: '0.00' as Money, sgst: '0.00' as Money, igst: '50.00' as Money }));
    expect(view.taxRows.map((r) => [r.key, r.paise])).toEqual([['igst', 5000]]);
  });

  it('an invoice with no tax shows no tax rows (nothing is invented as ₹0)', () => {
    expect(toInvoiceDetail(detail()).taxRows).toEqual([]);
  });

  it('a tax component that is not a Money string is left out, never shown as 0', () => {
    const view = toInvoiceDetail(detail({ cgst: 'x' as Money, sgst: '2.50' as Money }));
    expect(view.taxRows.map((r) => r.key)).toEqual(['sgst']);
  });

  it('keeps the place of supply and the GST flags as sent', () => {
    const view = toInvoiceDetail(detail({ placeOfSupply: null, gstInclusive: true, gstApplicable: true }));
    expect(view.placeOfSupply).toBeNull();
    expect(view.gstInclusive).toBe(true);
    expect(view.gstApplicable).toBe(true);
  });

  it('a detail with no lines array shows no lines', () => {
    expect(toInvoiceDetail(detail({ lines: undefined as unknown as InvoiceDetailDto['lines'] })).lines).toEqual([]);
  });
});

describe('route params and filters', () => {
  it('BR-36: only a uuid is an invoice id; a sample invoice number never reaches the API', () => {
    expect(invoiceIdParam(INVOICE)).toBe(INVOICE);
    expect(invoiceIdParam('INV-2026-001245')).toBeUndefined();
    expect(invoiceIdParam('INV-00251')).toBeUndefined();
    expect(invoiceIdParam(undefined)).toBeUndefined();
    expect(invoiceIdParam(LINE.toUpperCase())).toBe(LINE.toUpperCase());
  });

  it('the history chips are the server type filter', () => {
    expect(historyTypeFilter('All')).toBeUndefined();
    expect(historyTypeFilter('Retail')).toBe('SALE_RETAIL');
    expect(historyTypeFilter('B2B')).toBe('SALE_B2B');
  });

  it('groups rows by issue day, in the order the server sent them', () => {
    const rows = [
      toInvoiceRow(invoice({ id: 'a', issueDate: '2026-10-13' })),
      toInvoiceRow(invoice({ id: 'b', issueDate: '2026-10-13' })),
      toInvoiceRow(invoice({ id: 'c', issueDate: '2026-10-12' })),
    ];
    expect(groupInvoicesByDay(rows).map((g) => [g.label, g.rows.map((r) => r.id)])).toEqual([
      ['13 Oct 2026', ['a', 'b']],
      ['12 Oct 2026', ['c']],
    ]);
  });
});
