import { describe, expect, it } from 'vitest';
import type { InvoiceDetailDto, InvoiceDto } from '../api/invoices';
import { INVOICE_STATUSES, INVOICE_TYPES } from '../api/invoices';
import { isTranslationKey } from '../i18n';
import {
  INVOICE_TYPE_FILTERS,
  invoiceStatusMeta,
  invoiceTypeLabelKey,
  toInvoiceDetail,
  toInvoiceRow,
} from '../screens/warehouse/billing-invoices/mappers';

const base: InvoiceDto = {
  id: '7d1f3c2a-1111-4222-8333-944455556666',
  invoiceNumber: 'TOH/2026-27/R/004412',
  invoiceType: 'SALE_RETAIL',
  orderId: '9a9a9a9a-1111-4222-8333-944455556666',
  purchaseOrderId: null,
  issueDate: '2026-10-11',
  taxableAmount: '1000.00',
  totalAmount: '1050.10',
  gstApplicable: true,
  status: 'ISSUED',
  pdfUrl: '/v1/invoices/7d1f3c2a-1111-4222-8333-944455556666/download',
};

const detail: InvoiceDetailDto = {
  ...base,
  placeOfSupply: 'Tamil Nadu',
  cgst: '25.05',
  sgst: '25.05',
  igst: '0.00',
  gstInclusive: false,
  lines: [
    {
      description: 'Carrots',
      hsnCode: '0706',
      qty: '2.500',
      unitPrice: '400.00',
      gstRate: 5,
      taxable: '1000.00',
      tax: '50.10',
      total: '1050.10',
    },
  ],
};

describe('billing-invoices mappers', () => {
  it('every API status has a UI status with a real catalogue key, and unknown falls back', () => {
    for (const status of INVOICE_STATUSES) {
      expect(isTranslationKey(invoiceStatusMeta(status).labelKey), status).toBe(true);
    }
    const fallback = invoiceStatusMeta('VOIDED_IN_FUTURE');
    expect(fallback.labelKey).toBe('admin.invoices.status.unknown');
    expect(invoiceStatusMeta('ISSUED').tone).toBe('success');
    expect(invoiceStatusMeta('CANCELLED').tone).toBe('danger');
  });

  it('every invoice type has a label, and unknown falls back', () => {
    for (const type of INVOICE_TYPES) expect(isTranslationKey(invoiceTypeLabelKey(type))).toBe(true);
    expect(invoiceTypeLabelKey('SOMETHING_NEW')).toBe('admin.invoices.type.unknown');
    expect(INVOICE_TYPE_FILTERS[0]).toBeUndefined(); // "All" = no `type` param
    expect(INVOICE_TYPE_FILTERS.slice(1)).toEqual([...INVOICE_TYPES]);
  });

  it('money strings become integer paise at the boundary, never floats', () => {
    const row = toInvoiceRow(base);
    expect(row.totalPaise).toBe(105010);
    expect(row.taxablePaise).toBe(100000);
    expect(Number.isInteger(row.totalPaise)).toBe(true);
    expect(row.issueDateLabel).toBe('11/10/2026');
  });

  it('optional money fields absent on the wire map to null, not zero', () => {
    const { taxableAmount: _omit, ...rest } = base;
    expect(toInvoiceRow(rest).taxablePaise).toBeNull();
  });

  it('a malformed amount is a contract bug and throws instead of being rounded', () => {
    expect(() => toInvoiceRow({ ...base, totalAmount: '10.005' })).toThrow();
  });

  it('detail maps GST components and lines to paise and grams', () => {
    const d = toInvoiceDetail(detail);
    expect(d.cgstPaise).toBe(2505);
    expect(d.sgstPaise).toBe(2505);
    expect(d.igstPaise).toBe(0);
    expect(d.placeOfSupply).toBe('Tamil Nadu');
    expect(d.lines).toEqual([
      {
        key: '0',
        description: 'Carrots',
        hsnCode: '0706',
        qtyGrams: 2500,
        unitPricePaise: 40000,
        gstRate: 5,
        taxablePaise: 100000,
        taxPaise: 5010,
        totalPaise: 105010,
      },
    ]);
  });

  it('line qty sent as a JSON number (server parseFloat, spec gap) still lands on exact grams', () => {
    const d = toInvoiceDetail({ ...detail, lines: [{ ...detail.lines![0]!, qty: 0.3 }] });
    expect(d.lines[0]!.qtyGrams).toBe(300);
  });

  it('BR-36: the row and detail are allow-lists — no order, owner or pdf link fields leak through', () => {
    const extra = { ...detail, customerId: 'c-1', farmerId: 'f-1', warehouseId: 'w-1' } as InvoiceDetailDto;
    const row = toInvoiceRow(extra);
    const d = toInvoiceDetail(extra);
    for (const obj of [row, d]) {
      expect(Object.keys(obj)).not.toContain('customerId');
      expect(Object.keys(obj)).not.toContain('farmerId');
      expect(Object.keys(obj)).not.toContain('warehouseId');
      expect(Object.keys(obj)).not.toContain('pdfUrl');
    }
  });
});
