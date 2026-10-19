/**
 * roles/admin/screens/warehouse/sales-direct/mappers.ts:
 * Domain mappers between OpenAPI DTOs and warehouse sales UI types.
 *
 * Rules:
 *   - Money is NEVER a float. Every amount is integer paise (BR-98).
 *   - Quantities are integer grams (kgToGrams).
 *   - No float drift (0.1 kg + 0.2 kg === 300 grams exactly).
 *   - Status enums go through exhaustive Record with explicit fallback.
 *   - Server-calculated totals and GST are preserved, never computed client-side (BR-89).
 */
import { describe, expect, it } from 'vitest';
import type {
  ChannelOrderListItemDto,
  SaleCustomerMatchDto,
  SaleDto,
  SaleListItemDto,
  SaleProductDto,
  SaleQuoteDto,
  SalesMarketDayDto,
} from '../api/sales';
import {
  mapChannelOrderListItem,
  mapSale,
  mapSaleCustomerMatch,
  mapSaleListItem,
  mapSaleProduct,
  mapSaleQuote,
  mapSalesMarketDay,
  salesWarehouseFilter,
} from '../screens/warehouse/sales-direct/mappers';

describe('roles/admin/screens/warehouse/sales-direct/mappers.ts', () => {
  describe('mapSaleProduct (quantities and money)', () => {
    it('maps availableQtyKg to integer grams without float drift (0.1 + 0.2 kg === 300g)', () => {
      const dto: SaleProductDto = {
        productId: 'prod-1',
        name: 'Ooty Carrot',
        categoryId: 'cat-1',
        grade: 'Grade 1',
        unitPrice: '45.00',
        availableQtyKg: '0.300',
        unit: 'kg',
        photos: [],
        certificationBadges: [],
        batchCode: 'BTH-001',
        storageLocation: 'A-01',
      };
      const mapped = mapSaleProduct(dto);
      expect(mapped.availableGrams).toBe(300);
      expect(mapped.unitPricePaise).toBe(4500);
      expect(mapped.pricePerKgText).toBe('₹45');
    });

    it('handles fractional paise and multi-digit kg quantities safely', () => {
      const dto: SaleProductDto = {
        productId: 'prod-2',
        name: 'Potato',
        categoryId: 'cat-1',
        grade: 'Grade 2',
        unitPrice: '22.50',
        availableQtyKg: '125.750',
        unit: 'kg',
        photos: [],
        certificationBadges: [],
        batchCode: null,
        storageLocation: null,
      };
      const mapped = mapSaleProduct(dto);
      expect(mapped.availableGrams).toBe(125750);
      expect(mapped.unitPricePaise).toBe(2250);
      expect(mapped.pricePerKgText).toBe('₹22.50');
    });
  });

  describe('mapSaleCustomerMatch (BR-91, BR-92)', () => {
    it('maps customer match and formats walletBalance in integer paise', () => {
      const dto: SaleCustomerMatchDto = {
        customerId: 'cus-1',
        customerCode: 'CUS-001',
        name: 'Ramesh Kumar',
        mobileMasked: '+91 ****** 4321',
        walletBalance: '1500.00',
      };
      const mapped = mapSaleCustomerMatch(dto);
      expect(mapped.walletBalancePaise).toBe(150000);
      expect(mapped.walletBalanceText).toBe('₹1,500');
      expect(mapped.mobileMasked).toBe('+91 ****** 4321');
    });
  });

  describe('mapSaleQuote (BR-89, BR-98: GST & Totals from server)', () => {
    it('maps quote lines and totals without modifying server-provided GST', () => {
      const dto: SaleQuoteDto = {
        channel: 'DIRECT',
        lines: [
          {
            productId: 'prod-1',
            name: 'Tomato',
            grade: 'Grade 1',
            qtyKg: '2.000',
            unitPrice: '50.00',
            lineTotal: '100.00',
          },
        ],
        totals: {
          subtotal: '100.00',
          gst: '5.00',
          total: '105.00',
          changeGiven: null,
        },
        gstRatePercent: '5.00',
        quotedAt: '2026-10-13T10:00:00.000Z',
      };
      const mapped = mapSaleQuote(dto);
      expect(mapped.lines[0]?.qtyGrams).toBe(2000);
      expect(mapped.lines[0]?.unitPricePaise).toBe(5000);
      expect(mapped.lines[0]?.lineTotalPaise).toBe(10000);
      expect(mapped.subtotalPaise).toBe(10000);
      expect(mapped.gstPaise).toBe(500);
      expect(mapped.totalPaise).toBe(10500);
      expect(mapped.gstRatePercent).toBe('5.00');
    });
  });

  describe('mapSale (BR-86, BR-94: full sale record)', () => {
    it('maps sale record with exhaustive status mapping and change given', () => {
      const dto: SaleDto = {
        id: 'sale-1',
        saleNumber: 'ORD-00123',
        channel: 'DIRECT',
        status: 'PICKED_UP',
        paymentStatus: 'CONFIRMED',
        warehouseId: 'wh-1',
        buyer: {
          kind: 'CUSTOMER',
          customerId: 'cus-1',
          customerCode: 'CUS-001',
          name: 'Anand',
          mobileMasked: '+91 ****** 9999',
        },
        items: [
          {
            productId: 'p-1',
            name: 'Beans',
            grade: 'Grade 1',
            qtyKg: '1.500',
            unitPrice: '80.00',
            lineTotal: '120.00',
          },
        ],
        totals: {
          subtotal: '120.00',
          gst: '6.00',
          total: '126.00',
          changeGiven: '74.00',
        },
        payment: {
          method: 'CASH',
          status: 'CONFIRMED',
          amount: '126.00',
          amountReceived: '200.00',
          cardRef: null,
          upiTxnRef: null,
          confirmedAt: '2026-10-13T10:05:00.000Z',
        },
        invoiceNumber: 'INV-00123',
        invoiceId: 'inv-uuid-1',
        createdAt: '2026-10-13T10:00:00.000Z',
        completedAt: '2026-10-13T10:05:00.000Z',
      };
      const mapped = mapSale(dto);
      expect(mapped.id).toBe('sale-1');
      expect(mapped.status).toBe('Completed');
      expect(mapped.paymentStatus).toBe('Paid');
      expect(mapped.paymentMethod).toBe('Cash');
      expect(mapped.totalPaise).toBe(12600);
      expect(mapped.subtotalPaise).toBe(12000);
      expect(mapped.gstPaise).toBe(600);
      expect(mapped.changeGivenPaise).toBe(7400);
      expect(mapped.invoiceNo).toBe('INV-00123');
    });

    it('falls back safely on unknown enum values without throwing', () => {
      const dto = {
        id: 'sale-2',
        saleNumber: 'ORD-00124',
        channel: 'DIRECT',
        status: 'UNKNOWN_STATUS_XYZ',
        paymentStatus: 'UNKNOWN_PAY_XYZ',
        warehouseId: 'wh-1',
        buyer: {
          kind: 'WALK_IN',
          customerId: null,
          customerCode: null,
          name: 'Walk-in',
          mobileMasked: null,
        },
        items: [],
        totals: {
          subtotal: '0.00',
          gst: '0.00',
          total: '0.00',
          changeGiven: null,
        },
        payment: {
          method: 'UNKNOWN_METHOD_XYZ',
          status: 'PENDING',
          amount: '0.00',
          amountReceived: null,
          cardRef: null,
          upiTxnRef: null,
          confirmedAt: null,
        },
        invoiceNumber: null,
        invoiceId: null,
        createdAt: '2026-10-13T10:00:00.000Z',
        completedAt: null,
      } as unknown as SaleDto;

      const mapped = mapSale(dto);
      expect(mapped.status).toBe('Pending Payment');
      expect(mapped.paymentStatus).toBe('Pending');
      expect(mapped.paymentMethod).toBe('Cash');
    });
  });

  describe('mapSaleListItem', () => {
    it('maps list item fields accurately', () => {
      const dto: SaleListItemDto = {
        id: 'sale-3',
        saleNumber: 'ORD-00125',
        channel: 'MARKET',
        status: 'PICKED_UP',
        paymentStatus: 'CONFIRMED',
        paymentMethod: 'UPI',
        warehouseId: 'wh-1',
        buyer: {
          kind: 'WALK_IN',
          customerId: null,
          customerCode: null,
          name: 'Market Buyer',
          mobileMasked: null,
        },
        itemCount: 3,
        total: '350.00',
        invoiceNumber: 'INV-00125',
        createdAt: '2026-10-13T09:00:00.000Z',
        completedAt: '2026-10-13T09:05:00.000Z',
      };
      const mapped = mapSaleListItem(dto);
      expect(mapped.id).toBe('sale-3');
      expect(mapped.totalPaise).toBe(35000);
      expect(mapped.paymentMethod).toBe('UPI');
    });
  });

  describe('mapSalesMarketDay (BR-95, BR-96)', () => {
    it('maps allocation quantities to integer grams without float drift', () => {
      const dto: SalesMarketDayDto = {
        date: '2026-10-13',
        warehouseId: 'wh-1',
        totals: { count: 10, revenue: '4500.00' },
        byPaymentMethod: [{ method: 'CASH', count: 10, revenue: '4500.00' }],
        allocation: [
          {
            productId: 'p-1',
            name: 'Cabbage',
            grade: 'Grade 1',
            allocatedQtyKg: '100.500',
            soldQtyKg: '40.200',
            remainingQtyKg: '60.300',
          },
        ],
        items: [],
        page: { nextCursor: null, hasMore: false },
      };
      const mapped = mapSalesMarketDay(dto);
      expect(mapped.revenuePaise).toBe(450000);
      expect(mapped.allocation[0]?.allocatedGrams).toBe(100500);
      expect(mapped.allocation[0]?.soldGrams).toBe(40200);
      expect(mapped.allocation[0]?.remainingGrams).toBe(60300);
    });
  });

  describe('mapChannelOrderListItem (BR-85h)', () => {
    it('maps B2B / HORECA order item to UI type with integer paise total', () => {
      const dto: ChannelOrderListItemDto = {
        id: 'ord-b2b-1',
        orderNumber: 'B2B-00100',
        channel: 'B2B',
        status: 'CONFIRMED',
        paymentStatus: 'CONFIRMED',
        warehouseId: 'wh-1',
        customerCode: 'CUS-B01',
        businessName: 'Green Hotels',
        itemCount: 5,
        total: '15400.00',
        placedAt: '2026-10-13T08:00:00.000Z',
      };
      const mapped = mapChannelOrderListItem(dto);
      expect(mapped.id).toBe('ord-b2b-1');
      expect(mapped.totalPaise).toBe(1540000);
      expect(mapped.status).toBe('Confirmed');
      expect(mapped.channel).toBe('B2B');
    });
  });

  describe('salesWarehouseFilter (BR-30)', () => {
    it('pins to scope.warehouseId when defined (Sub Warehouse)', () => {
      expect(salesWarehouseFilter({ warehouseId: 'wh-sub' }, 'wh-other')).toBe('wh-sub');
    });

    it('allows selected warehouseId for Main Warehouse', () => {
      expect(salesWarehouseFilter({}, 'wh-other')).toBe('wh-other');
    });
  });
});
