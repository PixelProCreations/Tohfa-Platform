/**
 * roles/admin/api/sales.ts: the warehouse direct & market sales API (docs/openapi.yaml tag Sales):
 *   GET  /admin/sales/products                     sales.sale.create (BR-89, BR-95)
 *   GET  /admin/sales/customers/lookup             sales.sale.create (BR-91, BR-92)
 *   POST /admin/sales/quote                        sales.sale.create (BR-89, BR-98)
 *   POST /admin/sales                              sales.sale.create (BR-86, BR-88, BR-89; Idempotency-Key)
 *   GET  /admin/sales                              sales.history.view (BR-85, BR-90; cursor)
 *   GET  /admin/sales/{saleId}                     sales.history.view (BR-90, BR-92)
 *   GET  /admin/sales/summary                      sales.dashboard.view (BR-96)
 *   GET  /admin/sales/market-day                   sales.market_day.view (BR-95, BR-96)
 *   GET  /admin/sales/horeca                       sales.horeca.view (BR-85h, BR-13; read-only)
 *   GET  /admin/sales/b2b                          sales.b2b.view (BR-85h, BR-13; read-only)
 *   POST /admin/sales/{saleId}/payments/upi/confirm payment.record (BR-94, BR-88g; Idempotency-Key)
 *   POST /admin/sales/{saleId}/cancel              sales.sale.cancel (BR-94i; Idempotency-Key)
 *
 * Shell client is mocked (same pattern as api_orders.test.ts and api_finance.test.ts).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as ClientModule from '../../../shell/api/client';

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return {
    ...actual,
    request: vi.fn(async () => ({ items: [], page: { nextCursor: null, hasMore: false } })),
  };
});

import { request } from '../../../shell/api/client';
import {
  ERROR_CODES,
  cancelSale,
  confirmSaleUpiPayment,
  createSale,
  getSale,
  getSalesMarketDay,
  getSalesSummary,
  listSaleProducts,
  listSales,
  listSalesB2b,
  listSalesHoreca,
  lookupSaleCustomer,
  quoteSale,
  type SaleCreateDto,
  type SaleQuoteRequestDto,
} from '../api/sales';
import { hasKey } from '../i18n';
import { salesWarehouseFilter } from '../screens/warehouse/sales-direct/mappers';

const requestMock = vi.mocked(request);

const OWN_WAREHOUSE = '11111111-1111-4111-8111-111111111111';
const FOREIGN_WAREHOUSE = '99999999-9999-4999-8999-999999999999';
const SALE_ID = '22222222-2222-4222-8222-222222222222';
const PRODUCT_ID = '33333333-3333-4333-8333-333333333333';
const CUSTOMER_ID = '44444444-4444-4444-8444-444444444444';
const SUB_SCOPE = { warehouseId: OWN_WAREHOUSE, warehouseCode: 'WH-COON', warehouseName: 'Coonoor' };
const MAIN_SCOPE = {};

describe('roles/admin/api/sales.ts (HTTP contract)', () => {
  beforeEach(() => {
    requestMock.mockReset();
    requestMock.mockResolvedValue({ items: [], page: { nextCursor: null, hasMore: false } });
  });

  describe('GET /admin/sales/products (BR-89, BR-95)', () => {
    it('BR-95: sends the required channel with warehouseId, q and cursor', async () => {
      await listSaleProducts({ channel: 'MARKET', warehouseId: OWN_WAREHOUSE, q: 'carrot', cursor: 'c-1' });
      expect(requestMock).toHaveBeenCalledTimes(1);
      const [path, init] = requestMock.mock.calls[0]!;
      expect(path).toContain('/admin/sales/products');
      expect(path).toContain('channel=MARKET');
      expect(path).toContain(`warehouseId=${OWN_WAREHOUSE}`);
      expect(path).toContain('q=carrot');
      expect(path).toContain('cursor=c-1');
      expect(init?.method).toBe('GET');
    });
  });

  describe('GET /admin/sales/customers/lookup (BR-91, BR-92)', () => {
    it('BR-91: sends exactly one of mobile / code / q and no warehouseId (the server scopes it)', async () => {
      await lookupSaleCustomer({ mobile: '9876543210' });
      await lookupSaleCustomer({ q: 'Priya' });
      expect(requestMock).toHaveBeenCalledTimes(2);
      const [mobilePath, init] = requestMock.mock.calls[0]!;
      expect(mobilePath).toContain('/admin/sales/customers/lookup');
      expect(mobilePath).toContain('mobile=9876543210');
      expect(mobilePath).not.toContain('phone=');
      expect(mobilePath).not.toContain('warehouseId=');
      expect(mobilePath).not.toContain('q=');
      expect(init?.method).toBe('GET');
      const [qPath] = requestMock.mock.calls[1]!;
      expect(qPath).toContain('q=Priya');
      expect(qPath).not.toContain('mobile=');
    });
  });

  describe('POST /admin/sales/quote (BR-89, BR-98)', () => {
    it('sends POST /admin/sales/quote with channel, items, and warehouseId', async () => {
      const quoteBody: SaleQuoteRequestDto = {
        channel: 'DIRECT',
        warehouseId: OWN_WAREHOUSE,
        items: [{ productId: PRODUCT_ID, grade: 'GRADE_1', qtyKg: '2.500' }],
      };
      await quoteSale(quoteBody);
      expect(requestMock).toHaveBeenCalledTimes(1);
      const [path, init] = requestMock.mock.calls[0]!;
      expect(path).toBe('/admin/sales/quote');
      expect(init?.method).toBe('POST');
      expect(init?.body).toEqual(quoteBody);
    });
  });

  describe('POST /admin/sales (BR-86, BR-88, BR-89)', () => {
    it('sends POST /admin/sales with Idempotency-Key and expectedTotal (BR-88a, BR-89)', async () => {
      const saleBody: SaleCreateDto = {
        channel: 'DIRECT',
        warehouseId: OWN_WAREHOUSE,
        walkIn: { name: 'Asha' },
        items: [{ productId: PRODUCT_ID, grade: 'GRADE_1', qtyKg: '2.500' }],
        expectedTotal: '225.00',
        payment: { method: 'CASH', amountReceived: '250.00' },
      };
      const key = 'idem-sale-key-1';
      await createSale(saleBody, key);
      expect(requestMock).toHaveBeenCalledTimes(1);
      const [path, init] = requestMock.mock.calls[0]!;
      expect(path).toBe('/admin/sales');
      expect(init?.method).toBe('POST');
      expect(init?.body).toEqual(saleBody);
      expect(init?.idempotencyKey).toBe(key);
    });

    it('sends customer object for registered customer sale (BR-86)', async () => {
      const saleBody: SaleCreateDto = {
        channel: 'DIRECT',
        warehouseId: OWN_WAREHOUSE,
        customer: { customerId: CUSTOMER_ID },
        items: [{ productId: PRODUCT_ID, grade: 'GRADE_1', qtyKg: '1.000' }],
        expectedTotal: '90.00',
        payment: { method: 'WALLET' },
      };
      await createSale(saleBody, 'idem-key-2');
      const [, init] = requestMock.mock.calls[0]!;
      expect(init?.body).toEqual(saleBody);
    });
  });

  describe('GET /admin/sales (cursor pagination) (BR-85, BR-90)', () => {
    it('sends GET /admin/sales with cursor, channel, status and warehouseId', async () => {
      await listSales({
        warehouseId: OWN_WAREHOUSE,
        channel: 'DIRECT',
        status: 'PICKED_UP',
        cursor: 'cur-1',
        limit: 20,
      });
      expect(requestMock).toHaveBeenCalledTimes(1);
      const [path, init] = requestMock.mock.calls[0]!;
      expect(path).toContain('/admin/sales');
      expect(path).toContain(`warehouseId=${OWN_WAREHOUSE}`);
      expect(path).toContain('channel=DIRECT');
      expect(path).toContain('status=PICKED_UP');
      expect(path).toContain('cursor=cur-1');
      expect(path).toContain('limit=20');
      expect(init?.method).toBe('GET');
    });
  });

  describe('GET /admin/sales/{saleId} (BR-90, BR-92)', () => {
    it('sends GET /admin/sales/{saleId}', async () => {
      await getSale(SALE_ID);
      expect(requestMock).toHaveBeenCalledTimes(1);
      const [path, init] = requestMock.mock.calls[0]!;
      expect(path).toBe(`/admin/sales/${SALE_ID}`);
      expect(init?.method).toBe('GET');
    });
  });

  describe('GET /admin/sales/summary (BR-96)', () => {
    it('sends GET /admin/sales/summary with from, to, and warehouseId', async () => {
      await getSalesSummary({ from: '2026-10-01', to: '2026-10-13', warehouseId: OWN_WAREHOUSE });
      expect(requestMock).toHaveBeenCalledTimes(1);
      const [path, init] = requestMock.mock.calls[0]!;
      expect(path).toContain('/admin/sales/summary');
      expect(path).toContain('from=2026-10-01');
      expect(path).toContain('to=2026-10-13');
      expect(path).toContain(`warehouseId=${OWN_WAREHOUSE}`);
      expect(init?.method).toBe('GET');
    });
  });

  describe('GET /admin/sales/market-day (BR-95, BR-96)', () => {
    it('sends GET /admin/sales/market-day with date and warehouseId', async () => {
      await getSalesMarketDay({ date: '2026-10-13', warehouseId: OWN_WAREHOUSE, cursor: 'cur-2' });
      expect(requestMock).toHaveBeenCalledTimes(1);
      const [path, init] = requestMock.mock.calls[0]!;
      expect(path).toContain('/admin/sales/market-day');
      expect(path).toContain('date=2026-10-13');
      expect(path).toContain(`warehouseId=${OWN_WAREHOUSE}`);
      expect(path).toContain('cursor=cur-2');
      expect(init?.method).toBe('GET');
    });
  });

  describe('GET /admin/sales/horeca & /admin/sales/b2b (BR-85h, BR-13)', () => {
    it('sends GET /admin/sales/horeca with cursor and limit', async () => {
      await listSalesHoreca({ cursor: 'h-1', limit: 15 });
      expect(requestMock).toHaveBeenCalledTimes(1);
      const [path, init] = requestMock.mock.calls[0]!;
      expect(path).toContain('/admin/sales/horeca');
      expect(path).toContain('cursor=h-1');
      expect(path).toContain('limit=15');
      expect(init?.method).toBe('GET');
    });

    it('sends GET /admin/sales/b2b with cursor and limit', async () => {
      await listSalesB2b({ cursor: 'b-1', limit: 15 });
      expect(requestMock).toHaveBeenCalledTimes(1);
      const [path, init] = requestMock.mock.calls[0]!;
      expect(path).toContain('/admin/sales/b2b');
      expect(path).toContain('cursor=b-1');
      expect(path).toContain('limit=15');
      expect(init?.method).toBe('GET');
    });
  });

  describe('POST /admin/sales/{saleId}/payments/upi/confirm (BR-94, BR-88g)', () => {
    it('sends POST /admin/sales/{saleId}/payments/upi/confirm with Idempotency-Key and upiTxnRef', async () => {
      const key = 'idem-upi-confirm-1';
      await confirmSaleUpiPayment(SALE_ID, { upiTxnRef: 'UPI123456789' }, key);
      expect(requestMock).toHaveBeenCalledTimes(1);
      const [path, init] = requestMock.mock.calls[0]!;
      expect(path).toBe(`/admin/sales/${SALE_ID}/payments/upi/confirm`);
      expect(init?.method).toBe('POST');
      expect(init?.body).toEqual({ upiTxnRef: 'UPI123456789' });
      expect(init?.idempotencyKey).toBe(key);
    });
  });

  describe('POST /admin/sales/{saleId}/cancel (BR-94i, BR-94l)', () => {
    it('sends POST /admin/sales/{saleId}/cancel with its own Idempotency-Key', async () => {
      await cancelSale(SALE_ID, { reason: 'Customer left' }, 'idem-cancel-1');
      expect(requestMock).toHaveBeenCalledTimes(1);
      const [path, init] = requestMock.mock.calls[0]!;
      expect(path).toBe(`/admin/sales/${SALE_ID}/cancel`);
      expect(init?.method).toBe('POST');
      expect(init?.body).toEqual({ reason: 'Customer left' });
      expect(init?.idempotencyKey).toBe('idem-cancel-1');
    });
  });

  describe('GET /admin/sales filters', () => {
    it('sends paymentStatus, paymentMethod and q when given', async () => {
      await listSales({ paymentStatus: 'PAID', paymentMethod: 'UPI', q: 'SALE-1' });
      const [path] = requestMock.mock.calls[0]!;
      expect(path).toContain('paymentStatus=PAID');
      expect(path).toContain('paymentMethod=UPI');
      expect(path).toContain('q=SALE-1');
    });
  });

  describe('ERROR_CODES (i18n completeness)', () => {
    it('every declared ERROR_CODE exists in roles/admin/i18n error dictionary', () => {
      for (const code of ERROR_CODES) {
        expect(hasKey(`admin.error.${code}`)).toBe(true);
      }
    });
  });

  describe('salesWarehouseFilter (BR-30 warehouse scoping)', () => {
    it('Sub Warehouse scope pins the warehouseId to scope.warehouseId', () => {
      expect(salesWarehouseFilter(SUB_SCOPE, FOREIGN_WAREHOUSE)).toBe(OWN_WAREHOUSE);
      expect(salesWarehouseFilter(SUB_SCOPE, undefined)).toBe(OWN_WAREHOUSE);
    });

    it('Main Warehouse scope permits the selected warehouse or undefined', () => {
      expect(salesWarehouseFilter(MAIN_SCOPE, FOREIGN_WAREHOUSE)).toBe(FOREIGN_WAREHOUSE);
      expect(salesWarehouseFilter(MAIN_SCOPE, undefined)).toBeUndefined();
    });
  });
});
