/**
 * The order invoice (M5S18) is live: the admin order detail (GET
 * /admin/orders/{orderId}) names the order's invoice, and the page renders it
 * through the billing area's LiveInvoiceDetail (GET /invoices/{id}, download
 * through the signed link of GET /invoices/{id}/download). The entry is
 * offered only when the order has an invoice and the caller holds
 * invoice.view_own (BR-36 scopes the invoice on the server).
 *
 * The pure parts (the invoice id the mapper keeps, the entry rule) are tested
 * directly. Hooks and JSX cannot render in this plain-Node vitest, so the
 * wiring is pinned by reading the sources, as billing_wiring.test.ts does.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { AdminOrderDetailDto } from '../api/orders';
import { makeCan } from '../permissions/can';
import { DEMO_ROLE_PERMISSIONS } from '../permissions/demoGrants';
import { orderInvoiceEntry, toOrderDetail } from '../screens/warehouse/orders/mappers';

const SRC = path.join(__dirname, '..', '..', '..');
const read = (rel: string) => fs.readFileSync(path.join(SRC, rel), 'utf8');
/** The source without comments, so the "never drawn" checks read code only. */
const code = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const ORDERS = 'roles/admin/screens/warehouse/orders';
const SCREEN = read(`${ORDERS}/OrderInvoiceScreen.tsx`);
const FLOW = read(`${ORDERS}/OrdersFlow.tsx`);
const FIXTURES = read(`${ORDERS}/fixtures.ts`);

const WH = '11111111-1111-4111-8111-111111111111';
const ORDER = '22222222-2222-4222-8222-222222222222';
const INVOICE = '33333333-3333-4333-8333-333333333333';
const NOW = new Date('2026-10-13T06:30:00Z');

const subCan = makeCan(DEMO_ROLE_PERMISSIONS.SUB_WH_ADMIN);
const mainCan = makeCan(DEMO_ROLE_PERMISSIONS.MAIN_WH_ADMIN);
const noInvoiceCan = (code: string) => code !== 'invoice.view_own';

function detail(invoice: AdminOrderDetailDto['invoice']): AdminOrderDetailDto {
  return {
    id: ORDER,
    orderNumber: 'TOH-2026-0084412',
    channel: 'ONLINE',
    status: 'DELIVERED',
    fulfilmentType: 'PICKUP',
    paymentMethod: 'WALLET',
    paymentStatus: 'PAID',
    warehouse: { id: WH, name: 'Coonoor' },
    buyer: { kind: 'CUSTOMER', customerId: null, customerCode: null, name: 'Meena S.', mobileMasked: null },
    items: [],
    totals: {
      subtotal: '0.00' as never,
      deliveryFee: '0.00' as never,
      discount: '0.00' as never,
      gst: '0.00' as never,
      total: '0.00' as never,
    },
    invoice,
    fulfilment: { deliveryDate: null, deliverySlot: null, otpRequired: false, otpVerifiedAt: null },
    timeline: [],
    placedAt: '2026-10-13T04:35:00Z',
    packedAt: null,
    completedAt: null,
    cancelledAt: null,
  } as AdminOrderDetailDto;
}

describe('toOrderDetail: the order invoice id', () => {
  it('keeps the invoice uuid the order detail names', () => {
    const view = toOrderDetail(detail({ id: INVOICE, invoiceNumber: 'INV-2026-000001', status: 'ISSUED' }), NOW);
    expect(view.invoiceId).toBe(INVOICE);
  });

  it('is null when the order has no invoice, or the server sent no usable id', () => {
    expect(toOrderDetail(detail(null), NOW).invoiceId).toBeNull();
    expect(toOrderDetail(detail({ id: 'INV-2026-000001', invoiceNumber: 'INV-2026-000001', status: 'ISSUED' }), NOW).invoiceId).toBeNull();
    expect(toOrderDetail({ ...detail(null), invoice: undefined } as unknown as AdminOrderDetailDto, NOW).invoiceId).toBeNull();
  });
});

describe('orderInvoiceEntry: when the order detail offers View Invoice', () => {
  it('BR-36: opens the order invoice for both warehouse admins (invoice.view_own: Main all, Sub own)', () => {
    expect(orderInvoiceEntry({ invoiceId: INVOICE }, subCan)).toBe(INVOICE);
    expect(orderInvoiceEntry({ invoiceId: INVOICE }, mainCan)).toBe(INVOICE);
  });

  it('is hidden when the order has no invoice', () => {
    expect(orderInvoiceEntry({ invoiceId: null }, mainCan)).toBeUndefined();
    expect(orderInvoiceEntry({ invoiceId: null }, () => true)).toBeUndefined();
  });

  it('BR-36: is hidden without invoice.view_own, and before permissions load', () => {
    expect(orderInvoiceEntry({ invoiceId: INVOICE }, noInvoiceCan)).toBeUndefined();
    expect(orderInvoiceEntry({ invoiceId: INVOICE }, makeCan(null))).toBeUndefined();
  });
});

describe('OrderInvoiceScreen (M5S18) is live', () => {
  it('reads no sample data and fakes no download or share', () => {
    expect(SCREEN).not.toMatch(/from '\.\/fixtures'/);
    expect(code(SCREEN)).not.toMatch(/SAMPLE_|Alert|INV-2026-|ORD-1024|Arun Kumar|₹/);
    expect(FIXTURES).not.toMatch(/SAMPLE_INVOICE_NO/);
  });

  it('renders the billing LiveInvoiceDetail (live invoice + signed-link download) for the id orderInvoiceEntry allows', () => {
    expect(SCREEN).toMatch(/import \{ LiveInvoiceDetail \} from '\.\.\/billing-invoices';/);
    expect(SCREEN).toMatch(/orderInvoiceEntry\(order, can\)/);
    expect(SCREEN).toMatch(/<LiveInvoiceDetail scope=\{scope\} can=\{can\} invoiceId=\{invoiceId\}/);
  });

  it('shows loading, error, not found and "no invoice" states instead of an invoice', () => {
    const body = code(SCREEN);
    expect(body).toMatch(/<AdminLoadingState \/>/);
    expect(body).toMatch(/<AdminErrorState error=\{error\} onRetry=\{onRetry\} \/>/);
    expect(body).toMatch(/t\('orders\.empty\.notFound'\)/);
    expect(body).toMatch(/t\('orders\.invoice\.none'\)/);
  });

  it('OrdersFlow feeds the route from the live order detail, not a sample', () => {
    expect(FLOW).toMatch(/case 'M5S18_OrderInvoice':\s*return <LiveInvoiceRoute \{\.\.\.live\} \/>;/);
    const route = FLOW.slice(FLOW.indexOf('function LiveInvoiceRoute('));
    expect(route).toMatch(/^function LiveInvoiceRoute\(\{ base, warehouseId, params \}: LiveRouteProps\) \{\s*const live = useOrder\(warehouseId, orderIdParam\(params\)\);/);
    expect(FLOW).not.toMatch(/<OrderInvoiceScreen \{\.\.\.common\}/);
  });
});
