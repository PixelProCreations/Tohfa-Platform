/**
 * M5-18 Order Invoice (design 072): the invoice of an order shows its Order
 * No. and Customer. GET /invoices/{id} carries neither (only the order uuid),
 * but the order invoice screen already holds the admin order detail
 * (GET /admin/orders/{id}), which names both. The two are joined only when the
 * invoice says it belongs to that order (Invoice.orderId), so a stale or
 * mismatched order can never label someone else's invoice.
 *
 * Only the buyer's name is passed on. The order detail's mobile is already
 * masked (BR-92), and the invoice never shows it at all.
 */
import type { Money } from '@tohfa/shared-types';
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { InvoiceDetailDto } from '../api/invoices';
import { invoiceOrderContext, toInvoiceDetail } from '../screens/warehouse/billing-invoices/mappers';

const SRC = path.join(__dirname, '..', '..', '..');
const read = (rel: string) => fs.readFileSync(path.join(SRC, rel), 'utf8');
const code = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const SCREEN = read('roles/admin/screens/warehouse/orders/OrderInvoiceScreen.tsx');
const FLOW = read('roles/admin/screens/warehouse/billing-invoices/BillingFlow.tsx');
const DETAIL = code(read('roles/admin/screens/warehouse/billing-invoices/InvoiceDetailScreen.tsx'));

function functionBody(source: string, name: string): string {
  const start = source.indexOf(`function ${name}(`);
  expect(start, `function ${name} not found`).toBeGreaterThanOrEqual(0);
  const rest = source.slice(start + 1);
  const next = rest.search(/\n(export )?(function|const|interface|type) /);
  return next === -1 ? rest : rest.slice(0, next);
}

const INVOICE = '22222222-2222-4222-8222-222222222222';
const ORDER = '33333333-3333-4333-8333-333333333333';
const OTHER_ORDER = '55555555-5555-4555-8555-555555555555';

function detail(overrides: Partial<InvoiceDetailDto> = {}): InvoiceDetailDto {
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
    placeOfSupply: 'Tamil Nadu',
    lines: [],
    ...overrides,
  };
}

const order = { id: ORDER, orderNumber: 'TOH-2026-0084412', buyerName: 'Meena S.' };

describe('toInvoiceDetail keeps the order uuid the invoice names', () => {
  it('keeps Invoice.orderId when it is a uuid', () => {
    expect(toInvoiceDetail(detail()).orderId).toBe(ORDER);
  });

  it('is null when the invoice names no order, or not a usable one', () => {
    expect(toInvoiceDetail(detail({ orderId: null })).orderId).toBeNull();
    const { orderId: _omitted, ...withoutOrder } = detail();
    expect(toInvoiceDetail(withoutOrder).orderId).toBeNull();
    expect(toInvoiceDetail(detail({ orderId: 'ORD-1024' })).orderId).toBeNull();
  });
});

describe('invoiceOrderContext (M5-18): Order No. and Customer from the order detail', () => {
  it('names the order number and the customer when the invoice belongs to the order', () => {
    expect(invoiceOrderContext(toInvoiceDetail(detail()), order)).toEqual({
      orderNumber: 'TOH-2026-0084412',
      customerName: 'Meena S.',
    });
  });

  it('BR-36: shows nothing for an invoice of another order, or one that names no order', () => {
    expect(invoiceOrderContext(toInvoiceDetail(detail({ orderId: OTHER_ORDER })), order)).toBeNull();
    expect(invoiceOrderContext(toInvoiceDetail(detail({ orderId: null })), order)).toBeNull();
  });

  it('shows nothing without an order (the billing area\'s own invoice detail)', () => {
    expect(invoiceOrderContext(toInvoiceDetail(detail()), undefined)).toBeNull();
  });

  it('hides a blank customer name instead of drawing an empty row', () => {
    expect(invoiceOrderContext(toInvoiceDetail(detail()), { ...order, buyerName: '  ' })).toEqual({
      orderNumber: 'TOH-2026-0084412',
      customerName: null,
    });
  });

  it('BR-92: passes the name only, never a mobile, whatever the order object holds', () => {
    const withMobile = { ...order, buyerMobileMasked: '******3210', mobile: '9876543210' };
    const context = invoiceOrderContext(toInvoiceDetail(detail()), withMobile);
    expect(Object.keys(context ?? {})).toEqual(['orderNumber', 'customerName']);
    expect(JSON.stringify(context)).not.toMatch(/3210/);
  });
});

describe('wiring: the order invoice passes its order into the invoice view', () => {
  it('OrderInvoiceScreen hands the order it already holds to LiveInvoiceDetail', () => {
    expect(SCREEN).toMatch(/<LiveInvoiceDetail scope=\{scope\} can=\{can\} invoiceId=\{invoiceId\} order=\{order\}/);
  });

  it('LiveInvoiceDetail forwards it to the detail screen', () => {
    expect(functionBody(FLOW, 'LiveInvoiceDetail')).toMatch(/order=\{order\}/);
  });

  it('the detail draws Order No. and Customer only through invoiceOrderContext', () => {
    expect(DETAIL).toMatch(/invoiceOrderContext\(record, order\)/);
    expect(DETAIL).toMatch(/t\('billing\.detail\.orderNumber'\)/);
    expect(DETAIL).toMatch(/t\('billing\.detail\.customer'\)/);
  });

  it('BR-92: the detail never reads a mobile', () => {
    expect(DETAIL).not.toMatch(/mobile|phone/i);
  });
});
