/**
 * Sales wiring: the client -> mapper -> request-builder chain the screens use
 * (BR-86, BR-88, BR-89, BR-94, BR-98), plus a static guard that the sales area
 * no longer carries the fixtures and fabricated fallbacks it used to.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type * as ShellClient from '../../../shell/api/client';

const PRODUCT = '33333333-3333-4333-8333-333333333333';
const SALE = '22222222-2222-4222-8222-222222222222';

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ShellClient>();
  return {
    ...actual,
    request: vi.fn(async (p: string) => {
      if (p.includes('/products')) {
        return {
          items: [
            {
              productId: PRODUCT,
              name: 'Ooty Carrot',
              categoryId: '66666666-6666-4666-8666-666666666666',
              grade: 'GRADE_1',
              unitPrice: '45.00',
              availableQtyKg: '25.000',
              unit: 'kg',
              photos: [],
              certificationBadges: [],
              batchCode: 'BTH-1',
              storageLocation: 'BIN-1',
            },
          ],
          page: { nextCursor: null, hasMore: false },
        };
      }
      if (p.includes('/quote')) {
        return {
          channel: 'DIRECT',
          lines: [{ productId: PRODUCT, name: 'Ooty Carrot', grade: 'GRADE_1', qtyKg: '2.000', unitPrice: '45.00', lineTotal: '90.00' }],
          totals: { subtotal: '90.00', gst: '4.50', total: '94.50' },
          gstRatePercent: '5',
          quotedAt: '2026-10-13T10:00:00Z',
        };
      }
      return { items: [], page: { nextCursor: null, hasMore: false } };
    }),
  };
});

import { request } from '../../../shell/api/client';
import { createSale, listSaleProducts, quoteSale } from '../api/sales';
import {
  buildQuoteRequest,
  buildSaleCreateRequest,
  mapSaleProduct,
  mapSaleQuote,
  setCartQty,
} from '../screens/warehouse/sales-direct/mappers';

const requestMock = vi.mocked(request);

describe('sales wiring: products -> cart -> quote -> create', () => {
  it('BR-89, BR-98: the create body echoes the server quote total and carries Money, never floats', async () => {
    const products = await listSaleProducts({ channel: 'DIRECT' });
    const product = mapSaleProduct(products.items[0]!);
    const cart = setCartQty([], product, 2000);

    const quote = mapSaleQuote(await quoteSale(buildQuoteRequest('DIRECT', cart, undefined)));
    expect(quote.totalPaise).toBe(9450);

    const body = buildSaleCreateRequest({
      channel: 'DIRECT',
      warehouseId: undefined,
      cart,
      quote,
      buyer: { kind: 'WALK_IN', name: 'Asha' },
      payment: { method: 'CASH', receivedInput: '100' },
    });
    expect(body).not.toBeNull();
    await createSale(body!, 'idem-1');
    const call = requestMock.mock.calls.find(([p]) => p === '/admin/sales');
    expect(call?.[1]).toMatchObject({
      method: 'POST',
      idempotencyKey: 'idem-1',
      body: {
        expectedTotal: '94.50',
        items: [{ productId: PRODUCT, grade: 'GRADE_1', qtyKg: '2.000' }],
        payment: { method: 'CASH', amountReceived: '100.00' },
        walkIn: { name: 'Asha' },
      },
    });
  });

  it('BR-94: a UPI sale is created without any reference; the confirm needs the typed one', () => {
    const product = mapSaleProduct({
      productId: PRODUCT,
      name: 'x',
      categoryId: SALE,
      grade: 'GRADE_2',
      unitPrice: '1.00',
      availableQtyKg: '1.000',
      unit: 'kg',
      photos: [],
      certificationBadges: [],
      batchCode: null,
      storageLocation: null,
    });
    const body = buildSaleCreateRequest({
      channel: 'MARKET',
      warehouseId: undefined,
      cart: setCartQty([], product, 500),
      quote: mapSaleQuote({
        channel: 'MARKET',
        lines: [],
        totals: { subtotal: '0.50', gst: '0.00', total: '0.50' },
        gstRatePercent: '0',
        quotedAt: '2026-10-13T10:00:00Z',
      }),
      buyer: { kind: 'WALK_IN', name: 'Asha' },
      payment: { method: 'UPI' },
    });
    expect(body?.payment).toEqual({ method: 'UPI' });
  });
});

describe('sales area carries no fixtures or fabricated fallbacks', () => {
  const dir = path.resolve(__dirname, '../screens/warehouse/sales-direct');
  const files = fs.readdirSync(dir).filter((n) => /\.tsx?$/.test(n));
  const FORBIDDEN: readonly [RegExp, string][] = [
    [/SALE-00251|INV-00251/, 'sample sale / invoice number'],
    [/'WH-[A-Z]+'|'prod-1'|'CUS-WALKIN'/, 'fixture id that is not a uuid'],
    [/Walk-in Customer/, 'fabricated walk-in name'],
    [/UPI-\$\{Date\.now\(\)\}/, 'fabricated UPI reference'],
    [/\.toFixed\(/, 'float money / quantity formatting'],
    [/from '\.\/fixtures'|from '\.\/salesMath'|WALLET_WAREHOUSES|MOCK_[A-Z_]+|SAMPLE_CART|INITIAL_SALES_DATA|CHANNEL_(?:ORDERS|KPIS|FALLBACK_ORDER)/, 'fixture data'],
  ];

  it('has no fixture module left', () => {
    expect(files).not.toContain('fixtures.ts');
    expect(files).not.toContain('salesMath.ts');
  });

  for (const [re, what] of FORBIDDEN) {
    it(`no ${what}`, () => {
      const hits: string[] = [];
      for (const f of files) {
        fs.readFileSync(path.join(dir, f), 'utf8')
          .split('\n')
          .forEach((line, i) => {
            const trimmed = line.trim();
            if (trimmed.startsWith('*') || trimmed.startsWith('//')) return;
            if (re.test(line)) hits.push(`${f}:${i + 1} ${trimmed}`);
          });
      }
      expect(hits).toEqual([]);
    });
  }
});
