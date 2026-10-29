/**
 * Invoice mappers against the real API shapes (docs/openapi.yaml Invoice,
 * InvoiceDetail, InvoiceSummary; apps/api/src/modules/invoices/invoices.schema.ts).
 *
 * The rules pinned here are the ones the admin screens can break on the client:
 *   - BR-36: GET /invoices/{id} and /download take the invoice uuid (the API
 *     422s anything else), so navigation must carry `id`, never the number.
 *   - BR-128: the detail names the buyer and GSTIN the server sends; a farmer
 *     purchase or payout invoice has none, and the client must not invent one.
 *   - BR-16 / BR-16b: the screens add no farm identity; only fields the API
 *     sends are shown, and no field the API lacks is fabricated.
 *   - BR-30: KPI tiles come from GET /invoices/summary (server-scoped), not
 *     from constants.
 */
import { describe, expect, it } from 'vitest';
import type { Money } from '@tohfa/shared-types';
import type { InvoiceDetailDto, InvoiceDto, InvoiceSummaryDto, InvoiceType } from '../api/invoices';
import {
  filterAndSortInvoices,
  formatMoneyAmount,
  invoiceKpis,
  invoiceListQuery,
  invoiceTypeLabel,
  mapInvoiceDetailDtoToRecord,
  mapInvoiceDtoToRecord,
} from '../screens/warehouse/billing-invoices/mappers';
import { DEFAULT_INVOICE_FILTERS } from '../screens/warehouse/billing-invoices/fixtures';

const INVOICE_UUID = '0b8f4a52-6f0e-4a8e-9a4b-2f3c9d1e7a10';
const ORDER_UUID = '7c1d2e3f-4a5b-4c6d-8e9f-0a1b2c3d4e5f';

function listDto(overrides: Partial<InvoiceDto> = {}): InvoiceDto {
  return {
    id: INVOICE_UUID,
    invoiceNumber: 'TOH/2026-27/R/004412',
    invoiceType: 'SALE_RETAIL',
    orderId: ORDER_UUID,
    purchaseOrderId: null,
    issueDate: '2026-09-25',
    taxableAmount: '2200.00' as Money,
    totalAmount: '2450.00' as Money,
    gstApplicable: false,
    status: 'ISSUED',
    pdfUrl: null,
    ...overrides,
  };
}

function detailDto(overrides: Partial<InvoiceDetailDto> = {}): InvoiceDetailDto {
  return {
    ...listDto(),
    placeOfSupply: 'Tamil Nadu',
    cgst: '125.00' as Money,
    sgst: '125.00' as Money,
    igst: '0.00' as Money,
    gstInclusive: false,
    buyerName: 'Priya Stores',
    buyerGstin: '33ABCDE1234F1Z5',
    lines: [
      {
        description: 'Organic Carrots',
        hsnCode: '0706',
        qty: '10.000',
        unitPrice: '120.00' as Money,
        gstRate: 5,
        taxable: '1200.00' as Money,
        tax: '60.00' as Money,
        total: '1260.00' as Money,
      },
    ],
    ...overrides,
  };
}

describe('invoice list row (GET /invoices)', () => {
  it('BR-36: the list row carries the invoice uuid for navigation and API calls, and the invoice number only for display', () => {
    const row = mapInvoiceDtoToRecord(listDto());
    expect(row.id).toBe(INVOICE_UUID);
    expect(row.invoiceNumber).toBe('TOH/2026-27/R/004412');
  });

  it('BR-16: the list row has no buyer (GET /invoices sends none) and never fabricates one', () => {
    const row = mapInvoiceDtoToRecord(listDto());
    expect(row.customerName).toBe('');
  });

  it('shows no order number: the invoice carries only the order uuid, kept as a reference', () => {
    const row = mapInvoiceDtoToRecord(listDto());
    expect(row.orderId).toBe(ORDER_UUID);
    expect(row).not.toHaveProperty('orderNumber');
  });

  it('formats the total from integer paise and keeps the paise for filtering', () => {
    const row = mapInvoiceDtoToRecord(listDto({ totalAmount: '2450.50' as Money }));
    expect(row.amount).toBe('₹2,450.50');
    expect(row.amountPaise).toBe(245050);
  });
});

describe('invoice type and status labels', () => {
  const cases: [InvoiceType, string][] = [
    ['SALE_RETAIL', 'Retail Sale'],
    ['SALE_B2B', 'B2B Sale'],
    ['PURCHASE_FARMER', 'Farmer Purchase'],
    ['PAYOUT', 'Payout'],
    ['SUBSCRIPTION', 'Subscription'],
  ];
  it.each(cases)('labels %s as its own type (%s), never as another type', (type, label) => {
    expect(invoiceTypeLabel(type)).toBe(label);
    const row = mapInvoiceDtoToRecord(listDto({ invoiceType: type }));
    expect(row.invoiceType).toBe(type);
    expect(row.saleType).toBe(label);
  });

  it('keeps CREDIT_NOTED distinct from CANCELLED', () => {
    const credit = mapInvoiceDtoToRecord(listDto({ status: 'CREDIT_NOTED' }));
    const cancelled = mapInvoiceDtoToRecord(listDto({ status: 'CANCELLED' }));
    expect(credit.status).not.toBe(cancelled.status);
    expect(credit.statusLabel).toBe('Credit Noted');
    expect(cancelled.statusLabel).toBe('Cancelled');
  });

  it('labels DRAFT and ISSUED from the billing.status keys', () => {
    expect(mapInvoiceDtoToRecord(listDto({ status: 'DRAFT' })).statusLabel).toBe('Draft');
    expect(mapInvoiceDtoToRecord(listDto({ status: 'ISSUED' })).statusLabel).toBe('Issued');
  });
});

describe('invoice detail (GET /invoices/{id})', () => {
  it('BR-36: the detail carries the uuid for the download call and the number for display', () => {
    const detail = mapInvoiceDetailDtoToRecord(detailDto());
    expect(detail.id).toBe(INVOICE_UUID);
    expect(detail.invoiceNumber).toBe('TOH/2026-27/R/004412');
  });

  it('BR-128: the detail shows buyerName and buyerGstin from the DTO', () => {
    const detail = mapInvoiceDetailDtoToRecord(detailDto());
    expect(detail.buyerName).toBe('Priya Stores');
    expect(detail.buyerGstin).toBe('33ABCDE1234F1Z5');
  });

  it('BR-128: a walk-in buyer has a name and no GSTIN', () => {
    const detail = mapInvoiceDetailDtoToRecord(detailDto({ buyerName: 'Walk-in Ravi', buyerGstin: null }));
    expect(detail.buyerName).toBe('Walk-in Ravi');
    expect(detail.buyerGstin).toBeUndefined();
  });

  it('BR-128: a PURCHASE_FARMER invoice with null buyer shows no buyer (never a farmer name)', () => {
    const detail = mapInvoiceDetailDtoToRecord(
      detailDto({ invoiceType: 'PURCHASE_FARMER', orderId: null, buyerName: null, buyerGstin: null }),
    );
    expect(detail.buyerName).toBeUndefined();
    expect(detail.buyerGstin).toBeUndefined();
    expect(detail.typeLabel).toBe('Farmer Purchase');
  });

  it('BR-16: fabricates no payment status, payment method, discount, customer id or phone (no such API field)', () => {
    const detail = mapInvoiceDetailDtoToRecord(detailDto());
    for (const key of ['paymentStatus', 'paymentMethod', 'discount', 'customerId', 'customerPhone']) {
      expect(detail).not.toHaveProperty(key);
    }
  });

  it('sums CGST + SGST + IGST in integer paise and shows each component', () => {
    const detail = mapInvoiceDetailDtoToRecord(
      detailDto({ cgst: '0.10' as Money, sgst: '0.20' as Money, igst: '0.00' as Money }),
    );
    expect(detail.gst).toBe('₹0.30');
    expect(detail.cgst).toBe('₹0.10');
    expect(detail.sgst).toBe('₹0.20');
    expect(detail.taxable).toBe('₹2,200');
    expect(detail.total).toBe('₹2,450');
  });

  it('shows a line quantity as the API sent it (string or number), with no float math', () => {
    const asString = mapInvoiceDetailDtoToRecord(detailDto());
    expect(asString.items[0]?.quantity).toContain('10.000');
    const numberQty = detailDto();
    // The server sends a JSON number today (spec gap noted in api/invoices.ts).
    (numberQty.lines[0] as { qty: unknown }).qty = 2.5;
    expect(mapInvoiceDetailDtoToRecord(numberQty).items[0]?.quantity).toContain('2.5');
  });

  it('offers the download for any invoice the detail returned (the route serves every visible invoice)', () => {
    expect(mapInvoiceDetailDtoToRecord(detailDto({ pdfUrl: null })).downloadAvailable).toBe(true);
  });
});

describe('money display', () => {
  it('renders unparseable or missing money as an em dash, never as raw text with a rupee sign', () => {
    expect(formatMoneyAmount('abc')).toBe('—');
    expect(formatMoneyAmount('12.345')).toBe('—');
    expect(formatMoneyAmount(undefined)).toBe('—');
    expect(formatMoneyAmount(null)).toBe('—');
    expect(formatMoneyAmount('')).toBe('—');
  });

  it('formats valid money through integer paise', () => {
    expect(formatMoneyAmount('1250.25')).toBe('₹1,250.25');
    expect(formatMoneyAmount('300.00')).toBe('₹300');
  });
});

describe('list filters and sort (client side, on the loaded rows)', () => {
  const rows = [
    mapInvoiceDtoToRecord(listDto({ id: 'a', invoiceNumber: 'INV-1', issueDate: '2026-09-20', totalAmount: '100.00' as Money })),
    mapInvoiceDtoToRecord(listDto({ id: 'b', invoiceNumber: 'INV-2', issueDate: '2026-09-25', totalAmount: '1000.50' as Money, status: 'DRAFT' })),
    mapInvoiceDtoToRecord(listDto({ id: 'c', invoiceNumber: 'INV-3', issueDate: '2026-09-22', totalAmount: '500.00' as Money })),
  ];

  it('sorts newest first by issue date, not by id', () => {
    expect(filterAndSortInvoices(rows, DEFAULT_INVOICE_FILTERS, '').map((r) => r.id)).toEqual(['b', 'c', 'a']);
  });

  it('compares amount bounds in integer paise', () => {
    const out = filterAndSortInvoices(rows, { ...DEFAULT_INVOICE_FILTERS, minAmount: '500', maxAmount: '1000.50' }, '');
    expect(out.map((r) => r.id).sort()).toEqual(['b', 'c']);
  });

  it('searches by invoice number and filters by status', () => {
    expect(filterAndSortInvoices(rows, DEFAULT_INVOICE_FILTERS, 'inv-3').map((r) => r.id)).toEqual(['c']);
    expect(filterAndSortInvoices(rows, { ...DEFAULT_INVOICE_FILTERS, status: 'Pending' }, '').map((r) => r.id)).toEqual(['b']);
  });

  it('sends the type and date preset to the server as the spec query (YYYY-MM-DD)', () => {
    const today = new Date(2026, 9, 29);
    expect(invoiceListQuery({ ...DEFAULT_INVOICE_FILTERS, invoiceType: 'SALE_B2B', datePreset: 'Today' }, today)).toEqual({
      type: 'SALE_B2B',
      fromDate: '2026-10-29',
      toDate: '2026-10-29',
    });
    expect(invoiceListQuery({ ...DEFAULT_INVOICE_FILTERS, datePreset: 'This Month' }, today)).toEqual({
      type: undefined,
      fromDate: '2026-10-01',
      toDate: '2026-10-29',
    });
    expect(
      invoiceListQuery({ ...DEFAULT_INVOICE_FILTERS, datePreset: 'Custom', startDate: '01/09/2026', endDate: 'bad' }, today),
    ).toEqual({ type: undefined, fromDate: '2026-09-01', toDate: undefined });
  });
});

describe('hub KPI tiles (GET /invoices/summary)', () => {
  function summary(count: number, issued: number, draft: number, cancelled: number): InvoiceSummaryDto {
    return {
      count,
      totalAmount: '0.00' as Money,
      byStatus: [
        { status: 'DRAFT', count: draft, totalAmount: '0.00' as Money },
        { status: 'ISSUED', count: issued, totalAmount: '0.00' as Money },
        { status: 'CANCELLED', count: cancelled, totalAmount: '0.00' as Money },
        { status: 'CREDIT_NOTED', count: 0, totalAmount: '0.00' as Money },
      ],
      byType: [],
    };
  }

  it('BR-30: tiles come from the server-scoped summary, and show a dash until it loads', () => {
    expect(invoiceKpis(summary(4, 0, 0, 0), summary(40, 31, 6, 3))).toEqual({
      today: '4',
      issued: '31',
      draft: '6',
      cancelled: '3',
    });
    expect(invoiceKpis(undefined, undefined)).toEqual({ today: '—', issued: '—', draft: '—', cancelled: '—' });
  });
});
