/**
 * Live sales screens hook integration tests (BR-17, BR-86, BR-88, BR-89, BR-94, BR-98).
 */
import { describe, expect, it, vi } from 'vitest';
import type * as ApiClient from '../../../shell/api/client';

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ApiClient>();
  return {
    ...actual,
    request: vi.fn(async (path: string) => {
      if (path.includes('/products')) {
        return {
          items: [
            {
              productId: 'p-1',
              name: 'Ooty Carrot',
              categoryId: 'c-1',
              grade: 'Grade 1',
              unitPrice: '45.00',
              availableQtyKg: '25.000',
              unit: 'kg',
              photos: [],
              certificationBadges: [],
              batchCode: 'BTH-1',
              storageLocation: 'BIN-1',
            },
          ],
        };
      }
      if (path.includes('/quote')) {
        return {
          channel: 'DIRECT',
          lines: [],
          totals: { subtotal: '90.00', gst: '4.50', total: '94.50' },
          gstRatePercent: '5.00',
          quotedAt: '2026-10-13T10:00:00Z',
        };
      }
      if (path.includes('/summary')) {
        return {
          from: '2026-10-01',
          to: '2026-10-13',
          count: 15,
          revenue: '12450.00',
          byChannel: [],
          byPaymentMethod: [],
          needsAttention: { paymentPending: 1, stockIssues: 0, failedSales: 0, invoiceIssues: 0 },
        };
      }
      return { items: [], page: { nextCursor: null, hasMore: false } };
    }),
  };
});

import { request } from '../../../shell/api/client';
import {
  createSale,
  confirmSaleUpiPayment,
  getSalesSummary,
  listSaleProducts,
  quoteSale,
} from '../api/sales';
import { mapSaleProduct, mapSaleQuote } from '../screens/warehouse/sales-direct/mappers';

const requestMock = vi.mocked(request);

describe('Sales module hook & mapper wiring', () => {
  it('loads products and maps quantity and paise without float drift', async () => {
    const res = await listSaleProducts({ warehouseId: 'wh-1' });
    expect(res.items.length).toBe(1);
    const mapped = mapSaleProduct(res.items[0]!);
    expect(mapped.availableGrams).toBe(25000);
    expect(mapped.unitPricePaise).toBe(4500);
    expect(mapped.pricePerKgText).toBe('₹45');
  });

  it('quotes sale and preserves server calculated GST (BR-89, BR-98)', async () => {
    const quoteRes = await quoteSale({
      channel: 'DIRECT',
      warehouseId: 'wh-1',
      items: [{ productId: 'p-1', grade: 'Grade 1', qtyKg: '2.000' }],
    });
    const mapped = mapSaleQuote(quoteRes);
    expect(mapped.subtotalPaise).toBe(9000);
    expect(mapped.gstPaise).toBe(450);
    expect(mapped.totalPaise).toBe(9450);
  });

  it('creates sale with Idempotency-Key (BR-88)', async () => {
    await createSale(
      {
        channel: 'DIRECT',
        warehouseId: 'wh-1',
        walkIn: { name: 'Customer A' },
        items: [{ productId: 'p-1', grade: 'Grade 1', qtyKg: '2.000' }],
        expectedTotal: '94.50',
        payment: { method: 'CASH', amountReceived: '100.00' },
      },
      'key-sale-1',
    );
    expect(requestMock).toHaveBeenCalledWith(
      '/admin/sales',
      expect.objectContaining({
        method: 'POST',
        idempotencyKey: 'key-sale-1',
      }),
    );
  });

  it('confirms UPI payment with separate Idempotency-Key (BR-94, BR-88g)', async () => {
    await confirmSaleUpiPayment('sale-123', { upiTxnRef: 'UPI-987' }, 'key-upi-1');
    expect(requestMock).toHaveBeenCalledWith(
      '/admin/sales/sale-123/payments/upi/confirm',
      expect.objectContaining({
        method: 'POST',
        idempotencyKey: 'key-upi-1',
        body: { upiTxnRef: 'UPI-987' },
      }),
    );
  });

  it('fetches sales summary for dashboard (BR-96)', async () => {
    const summary = await getSalesSummary({ from: '2026-10-01', to: '2026-10-13', warehouseId: 'wh-1' });
    expect(summary.count).toBe(15);
    expect(summary.revenue).toBe('12450.00');
    expect(summary.needsAttention.paymentPending).toBe(1);
  });
});
