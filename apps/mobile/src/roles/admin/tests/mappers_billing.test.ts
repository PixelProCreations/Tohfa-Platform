import { describe, expect, it } from 'vitest';
import type { InvoiceDetailDto, InvoiceDto } from '../api/invoices';
import {
  mapInvoiceDetailDtoToRecord,
  mapInvoiceDtoToRecord,
} from '../screens/warehouse/billing-invoices/mappers';
import type { Money } from '@tohfa/shared-types';

describe('billing-invoices mappers', () => {
  const sampleDto: InvoiceDto = {
    id: 'inv-uuid-1',
    invoiceNumber: 'INV-2026-001245',
    invoiceType: 'SALE_RETAIL',
    orderId: 'ORD-002154',
    purchaseOrderId: null,
    issueDate: '2026-09-25',
    totalAmount: '2450.00' as Money,
    taxableAmount: '2200.00' as Money,
    gstApplicable: false,
    status: 'ISSUED',
    pdfUrl: 'https://example.com/inv-1.pdf',
  };

  it('maps InvoiceDto to InvoiceRecord and enforces BR-16 (hides buyer name)', () => {
    const record = mapInvoiceDtoToRecord(sampleDto);
    // BR-36: id is the uuid for navigation; invoiceNumber is the display label
    expect(record.id).toBe('inv-uuid-1');
    expect(record.invoiceNumber).toBe('INV-2026-001245');
    expect(record.orderId).toBe('ORD-002154');
    // BR-16: Buyer name / GSTIN must be hidden; the list endpoint sends none
    expect(record.customerName).toBe('');
    expect(record.saleType).toBe('Retail Sale');
    expect(record.status).toBe('Generated');
    expect(record.date).toBe('25 Sep 2026');
    expect(record.amount).toContain('2,450');
  });

  it('maps InvoiceDetailDto to InvoiceDetailRecord and enforces BR-16 (hides customer details)', () => {
    const detailDto: InvoiceDetailDto = {
      ...sampleDto,
      placeOfSupply: 'TN',
      cgst: '125.00' as Money,
      sgst: '125.00' as Money,
      // BR-128: null buyer means no customer (walk-in or farmer-side)
      buyerName: null,
      buyerGstin: null,
      lines: [
        {
          description: 'Organic Carrots',
          hsnCode: '0706',
          qty: '10',
          unitPrice: '120.00' as Money,
          gstRate: 5,
          taxable: '1200.00' as Money,
          tax: '60.00' as Money,
          total: '1260.00' as Money,
        },
      ],
    };

    const record = mapInvoiceDetailDtoToRecord(detailDto);
    // BR-36: id is uuid; invoiceNumber is display-only
    expect(record.id).toBe('inv-uuid-1');
    expect(record.invoiceNumber).toBe('INV-2026-001245');
    expect(record.orderId).toBe('ORD-002154');
    // BR-16: Customer information not fabricated
    expect(record.customerName).toBe('');
    expect(record).not.toHaveProperty('customerId');
    expect(record).not.toHaveProperty('customerPhone');
    expect(record.items).toHaveLength(1);
    expect(record.items[0]?.name).toBe('Organic Carrots');
    expect(record.items[0]?.quantity).toContain('10');
    expect(record.total).toContain('2,450');
  });
});
