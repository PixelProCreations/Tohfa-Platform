/**
 * roles/admin/screens/warehouse/sales-direct/mappers.ts: DTO -> view model
 * mapping, request builders and the counter's payment checks.
 *
 *   - Money is never a float: amounts are integer paise, bodies carry Money
 *     strings, the quote's total is echoed verbatim as expectedTotal (BR-89, BR-98).
 *   - Quantities are integer grams; bodies carry 3-dp kg strings.
 *   - Codes stay codes (grade, status, method); the screens translate them.
 */
import { describe, expect, it } from 'vitest';
import type {
  ChannelOrderListItemDto,
  SaleCustomerMatchDto,
  SaleDto,
  SaleListItemDto,
  SaleProductDto,
  SaleQuoteDto,
  SalesDashboardSummaryDto,
  SalesMarketDayDto,
} from '../api/sales';
import type { AdminOrderDetailDto } from '../api/orders';
import { en } from '../i18n';
import {
  buildQuoteRequest,
  buildSaleCreateRequest,
  cartItemRequests,
  checkSalePayment,
  customerLookupParams,
  isPendingUpiSale,
  mapChannelOrderDetail,
  mapChannelOrderListItem,
  mapSale,
  mapSaleCustomerMatch,
  mapSaleListItem,
  mapSaleProduct,
  mapSaleQuote,
  mapSalesMarketDay,
  mapSalesSummary,
  normalizeWalkInMobile,
  salesWarehouseFilter,
  setCartQty,
  tallyChannelOrders,
  upiTxnRefInput,
  type CartLine,
  type SaleCustomerView,
  type SaleQuoteView,
} from '../screens/warehouse/sales-direct/mappers';
import {
  CHANNEL_GROUP_KEY,
  CHANNEL_ORDER_STATUS_KEY,
  GRADE_KEY,
  PAYMENT_BLOCK_KEY,
  PAYMENT_METHOD_KEY,
  PAYMENT_ROW_STATUS_KEY,
  PAYMENT_STATUS_KEY,
  SALE_CHANNEL_KEY,
  SALE_STATUS_KEY,
} from '../screens/warehouse/sales-direct/salesLabels';

const WH = '11111111-1111-4111-8111-111111111111';
const PRODUCT = '33333333-3333-4333-8333-333333333333';
const CUSTOMER = '44444444-4444-4444-8444-444444444444';
const SALE = '22222222-2222-4222-8222-222222222222';
const INVOICE = '55555555-5555-4555-8555-555555555555';

const productDto: SaleProductDto = {
  productId: PRODUCT,
  name: 'Ooty Carrot',
  categoryId: '66666666-6666-4666-8666-666666666666',
  grade: 'GRADE_1',
  unitPrice: '45.50',
  availableQtyKg: '12.345',
  unit: 'kg',
  photos: [],
  certificationBadges: [],
  batchCode: 'BTH-001',
  storageLocation: null,
};

const customer: SaleCustomerView = {
  customerId: CUSTOMER,
  customerCode: 'CUS-0001',
  name: 'Priya',
  mobileMasked: '******3210',
  walletBalancePaise: 10000,
};

function quoteOf(total: string): SaleQuoteView {
  return mapSaleQuote({
    channel: 'DIRECT',
    lines: [],
    totals: { subtotal: total, gst: '0.00', total },
    gstRatePercent: '5',
    quotedAt: '2026-10-14T10:00:00Z',
  });
}

function cartOf(qtyGrams: number): CartLine[] {
  return setCartQty([], mapSaleProduct(productDto), qtyGrams);
}

const saleDto: SaleDto = {
  id: SALE,
  saleNumber: 'SO-1001',
  channel: 'DIRECT',
  status: 'PICKED_UP',
  paymentStatus: 'PAID',
  warehouseId: WH,
  buyer: { kind: 'WALK_IN', customerId: null, customerCode: null, name: 'Asha', mobileMasked: '******9876' },
  items: [
    { productId: PRODUCT, name: 'Ooty Carrot', grade: 'GRADE_1', qtyKg: '0.300', unitPrice: '45.50', lineTotal: '13.65' },
  ],
  totals: { subtotal: '13.65', gst: '0.68', total: '14.33', changeGiven: '5.67' },
  payment: {
    method: 'CASH',
    status: 'CONFIRMED',
    amount: '14.33',
    amountReceived: '20.00',
    cardRef: null,
    upiTxnRef: null,
    confirmedAt: '2026-10-14T10:01:00Z',
  },
  invoiceNumber: 'INV-0001',
  invoiceId: INVOICE,
  timeline: [{ fromStatus: null, toStatus: 'PICKED_UP', at: '2026-10-14T10:01:00Z' }],
  createdAt: '2026-10-14T10:00:00Z',
  completedAt: '2026-10-14T10:01:00Z',
};

describe('sales mappers: products, cart and quote', () => {
  it('maps a product to integer paise and grams, keeping the grade code', () => {
    const p = mapSaleProduct(productDto);
    expect(p.unitPricePaise).toBe(4550);
    expect(p.availableGrams).toBe(12345);
    expect(p.grade).toBe('GRADE_1');
    expect(p.storageLocation).toBeNull();
  });

  it('BR-89: cart lines become one request per productId + grade with exact 3-dp kg', () => {
    const product = mapSaleProduct(productDto);
    let cart = setCartQty([], product, 100);
    cart = setCartQty(cart, product, 300); // same product + grade replaces, never duplicates
    expect(cart).toHaveLength(1);
    expect(cartItemRequests(cart)).toEqual([{ productId: PRODUCT, grade: 'GRADE_1', qtyKg: '0.300' }]);
  });

  it('clamps a quantity to the available stock and removes a line at 0', () => {
    const product = mapSaleProduct(productDto);
    expect(setCartQty([], product, 999999)[0]?.qtyGrams).toBe(12345);
    expect(setCartQty(setCartQty([], product, 500), product, 0)).toEqual([]);
  });

  it('builds the quote body with the sale warehouse uuid and omits it for a Sub admin', () => {
    expect(buildQuoteRequest('MARKET', cartOf(1500), WH)).toEqual({
      channel: 'MARKET',
      items: [{ productId: PRODUCT, grade: 'GRADE_1', qtyKg: '1.500' }],
      warehouseId: WH,
    });
    expect(buildQuoteRequest('DIRECT', cartOf(1500), undefined)).not.toHaveProperty('warehouseId');
  });

  it('BR-98: keeps the server totals and echoes totals.total verbatim as expectedTotal', () => {
    const dto: SaleQuoteDto = {
      channel: 'DIRECT',
      lines: [{ productId: PRODUCT, name: 'Ooty Carrot', grade: 'GRADE_1', qtyKg: '0.300', unitPrice: '45.50', lineTotal: '13.65' }],
      totals: { subtotal: '13.65', gst: '0.68', total: '14.33' },
      gstRatePercent: '5',
      quotedAt: '2026-10-14T10:00:00Z',
    };
    const q = mapSaleQuote(dto);
    expect(q.subtotalPaise + q.gstPaise).toBe(q.totalPaise);
    expect(q.totalPaise).toBe(1433);
    expect(q.expectedTotal).toBe('14.33');
    expect(q.lines[0]?.qtyGrams).toBe(300);
  });
});

describe('sales mappers: customers', () => {
  it('BR-92: maps a lookup hit keeping only the masked mobile', () => {
    const dto: SaleCustomerMatchDto = {
      customerId: CUSTOMER,
      customerCode: 'CUS-0001',
      name: 'Priya',
      mobileMasked: '******3210',
      walletBalance: '1250.75',
    };
    const c = mapSaleCustomerMatch(dto);
    expect(c.walletBalancePaise).toBe(125075);
    expect(c.mobileMasked).toBe('******3210');
  });

  it('BR-91: lookup params are exactly one of mobile or q, and nothing for 0-1 chars', () => {
    expect(customerLookupParams('98765 43210')).toEqual({ mobile: '9876543210' });
    expect(customerLookupParams('+919876543210')).toEqual({ mobile: '+919876543210' });
    expect(customerLookupParams('CUS-0001')).toEqual({ q: 'CUS-0001' });
    expect(customerLookupParams('  P ')).toBeNull();
    expect(customerLookupParams('')).toBeNull();
  });

  it('normalises a walk-in mobile to E.164 or reports it invalid', () => {
    expect(normalizeWalkInMobile('')).toBeUndefined();
    expect(normalizeWalkInMobile('98765 43210')).toBe('+919876543210');
    expect(normalizeWalkInMobile('+447700900123')).toBe('+447700900123');
    expect(normalizeWalkInMobile('12345')).toBeNull();
  });
});

describe('sales mappers: payment checks and the create body', () => {
  const walkIn = { kind: 'WALK_IN' as const, name: 'Asha' };
  const registered = { kind: 'CUSTOMER' as const, customer };

  it('BR-86: a walk-in cannot pay by wallet', () => {
    const check = checkSalePayment({ cart: cartOf(300), quote: quoteOf('14.33'), buyer: walkIn, payment: { method: 'WALLET' } });
    expect(check.block).toBe('WALKIN_WALLET_NOT_ALLOWED');
    expect(
      buildSaleCreateRequest({ channel: 'DIRECT', warehouseId: WH, cart: cartOf(300), quote: quoteOf('14.33'), buyer: walkIn, payment: { method: 'WALLET' } }),
    ).toBeNull();
  });

  it('BR-88: a wallet that does not cover the total blocks, with the exact paise shortfall', () => {
    const check = checkSalePayment({ cart: cartOf(300), quote: quoteOf('100.01'), buyer: registered, payment: { method: 'WALLET' } });
    expect(check.block).toBe('WALLET_INSUFFICIENT');
    expect(check.shortfallPaise).toBe(1);
    expect(checkSalePayment({ cart: cartOf(300), quote: quoteOf('100.00'), buyer: registered, payment: { method: 'WALLET' } }).block).toBeNull();
  });

  it('BR-94: cash must cover the total; change is exact integer paise (no float drift)', () => {
    const quote = quoteOf('0.30');
    expect(checkSalePayment({ cart: cartOf(300), quote, buyer: walkIn, payment: { method: 'CASH', receivedInput: '0.29' } }).block).toBe(
      'CASH_AMOUNT_INSUFFICIENT',
    );
    expect(checkSalePayment({ cart: cartOf(300), quote, buyer: walkIn, payment: { method: 'CASH', receivedInput: 'abc' } }).block).toBe(
      'CASH_AMOUNT_INVALID',
    );
    const ok = checkSalePayment({ cart: cartOf(300), quote, buyer: walkIn, payment: { method: 'CASH', receivedInput: '0.50' } });
    expect(ok.block).toBeNull();
    expect(ok.changePaise).toBe(20);
  });

  it('BR-94: a card sale needs a non-blank reference', () => {
    expect(checkSalePayment({ cart: cartOf(300), quote: quoteOf('1.00'), buyer: walkIn, payment: { method: 'CARD', cardRef: '  ' } }).block).toBe(
      'CARD_REF_REQUIRED',
    );
  });

  it('blocks an empty cart, a missing quote and a nameless walk-in', () => {
    expect(checkSalePayment({ cart: [], quote: quoteOf('1.00'), buyer: walkIn, payment: { method: 'UPI' } }).block).toBe('EMPTY_CART');
    expect(checkSalePayment({ cart: cartOf(300), quote: null, buyer: walkIn, payment: { method: 'UPI' } }).block).toBe('NO_QUOTE');
    expect(
      checkSalePayment({ cart: cartOf(300), quote: quoteOf('1.00'), buyer: { kind: 'WALK_IN', name: ' ' }, payment: { method: 'UPI' } }).block,
    ).toBe('WALK_IN_NAME_REQUIRED');
  });

  it('BR-89, BR-86: the create body echoes expectedTotal, has exactly one buyer and Money amounts', () => {
    const body = buildSaleCreateRequest({
      channel: 'DIRECT',
      warehouseId: WH,
      cart: cartOf(300),
      quote: quoteOf('14.33'),
      buyer: { kind: 'WALK_IN', name: ' Asha ', mobile: '9876543210' },
      payment: { method: 'CASH', receivedInput: '20' },
    });
    expect(body).toEqual({
      channel: 'DIRECT',
      warehouseId: WH,
      items: [{ productId: PRODUCT, grade: 'GRADE_1', qtyKg: '0.300' }],
      expectedTotal: '14.33',
      walkIn: { name: 'Asha', mobile: '+919876543210' },
      payment: { method: 'CASH', amountReceived: '20.00' },
    });
    expect(body).not.toHaveProperty('customer');
  });

  it('BR-86: a registered-customer body carries only customer.customerId', () => {
    const body = buildSaleCreateRequest({
      channel: 'MARKET',
      warehouseId: undefined,
      cart: cartOf(300),
      quote: quoteOf('14.33'),
      buyer: registered,
      payment: { method: 'CARD', cardRef: ' TXN-9 ' },
    });
    expect(body?.customer).toEqual({ customerId: CUSTOMER });
    expect(body).not.toHaveProperty('walkIn');
    expect(body).not.toHaveProperty('warehouseId');
    expect(body?.payment).toEqual({ method: 'CARD', cardRef: 'TXN-9' });
  });

  it('BR-94: a UPI reference is what the cashier typed, trimmed, 1-120 chars; never generated', () => {
    expect(upiTxnRefInput('  412345678901 ')).toBe('412345678901');
    expect(upiTxnRefInput('   ')).toBeNull();
    expect(upiTxnRefInput('x'.repeat(121))).toBeNull();
  });
});

describe('sales mappers: sales, summary, market day, channel orders', () => {
  it('maps a sale detail with invoice uuid, payment and timeline in paise', () => {
    const s = mapSale(saleDto);
    expect(s.totalPaise).toBe(1433);
    expect(s.changeGivenPaise).toBe(567);
    expect(s.payment.amountReceivedPaise).toBe(2000);
    expect(s.invoiceId).toBe(INVOICE);
    expect(s.items[0]).toMatchObject({ grade: 'GRADE_1', qtyGrams: 300, lineTotalPaise: 1365 });
    expect(s.timeline).toHaveLength(1);
    expect(isPendingUpiSale(s)).toBe(false);
  });

  it('BR-94: a UPI sale created PENDING has no invoice and needs a confirm', () => {
    const pending = mapSale({
      ...saleDto,
      status: 'PENDING_PAYMENT',
      paymentStatus: 'PENDING',
      invoiceId: null,
      invoiceNumber: null,
      totals: { subtotal: '13.65', gst: '0.68', total: '14.33', changeGiven: null },
      payment: { ...saleDto.payment, method: 'UPI', status: 'PENDING', amountReceived: null, confirmedAt: null },
    });
    expect(isPendingUpiSale(pending)).toBe(true);
    expect(pending.invoiceId).toBeNull();
    expect(pending.changeGivenPaise).toBeNull();
  });

  it('maps a sales list row', () => {
    const dto: SaleListItemDto = {
      id: SALE,
      saleNumber: 'SO-1001',
      channel: 'MARKET',
      status: 'PICKED_UP',
      paymentStatus: 'PAID',
      paymentMethod: 'UPI',
      warehouseId: WH,
      buyer: saleDto.buyer,
      itemCount: 3,
      total: '1250.50',
      invoiceNumber: null,
      createdAt: '2026-10-14T10:00:00Z',
      completedAt: null,
    };
    expect(mapSaleListItem(dto)).toMatchObject({ totalPaise: 125050, channel: 'MARKET', itemCount: 3, paymentMethod: 'UPI' });
  });

  it('BR-96: zero-fills every channel and method and does not double-count stock issues', () => {
    const dto: SalesDashboardSummaryDto = {
      from: '2026-10-14',
      to: '2026-10-14',
      warehouseId: WH,
      count: 2,
      revenue: '300.30',
      byChannel: [{ channel: 'DIRECT', count: 2, revenue: '300.30' }],
      byPaymentMethod: [{ method: 'CASH', count: 2, revenue: '300.30' }],
      needsAttention: { paymentPending: 1, stockIssues: 2, failedSales: 3, invoiceIssues: 4 },
    };
    const s = mapSalesSummary(dto);
    expect(s.revenuePaise).toBe(30030);
    expect(s.byChannel.MARKET).toEqual({ count: 0, revenuePaise: 0 });
    expect(s.byMethod.WALLET).toEqual({ count: 0, revenuePaise: 0 });
    expect(s.byMethod.CASH.revenuePaise).toBe(30030);
    expect(s.needsAttentionTotal).toBe(8);
  });

  it('BR-95: maps the market-day allocation in grams', () => {
    const dto: SalesMarketDayDto = {
      date: '2026-10-14',
      warehouseId: WH,
      totals: { count: 1, revenue: '45.50' },
      byPaymentMethod: [],
      allocation: [
        { productId: PRODUCT, name: 'Ooty Carrot', grade: 'GRADE_2', allocatedQtyKg: '10.000', soldQtyKg: '0.100', remainingQtyKg: '9.900' },
      ],
      items: [],
      page: { nextCursor: null, hasMore: false },
    };
    const m = mapSalesMarketDay(dto);
    expect(m.allocation[0]).toMatchObject({ allocatedGrams: 10000, soldGrams: 100, remainingGrams: 9900, grade: 'GRADE_2' });
    expect(m.revenuePaise).toBe(4550);
    expect(m.byMethod.UPI).toEqual({ count: 0, revenuePaise: 0 });
  });

  it('BR-85h: channel orders map read-only and tally over the loaded rows, excluding cancelled value', () => {
    const base: ChannelOrderListItemDto = {
      id: SALE,
      orderNumber: 'HO-1',
      channel: 'HORECA',
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      warehouseId: WH,
      customerCode: null,
      businessName: null,
      itemCount: 2,
      total: '100.10',
      placedAt: '2026-10-14T10:00:00Z',
    };
    const rows = [
      mapChannelOrderListItem(base),
      mapChannelOrderListItem({ ...base, status: 'DELIVERED', total: '0.20' }),
      mapChannelOrderListItem({ ...base, status: 'CANCELLED', total: '999.00' }),
    ];
    expect(rows[0]?.businessName).toBeNull();
    const tally = tallyChannelOrders(rows);
    expect(tally.orders).toBe(3);
    expect(tally.byGroup).toEqual({ PENDING: 1, IN_PROGRESS: 0, COMPLETED: 1, CLOSED: 1 });
    expect(tally.valuePaise).toBe(10030);
  });

  it('BR-99: a channel order detail carries its real invoice uuid or null', () => {
    const dto = {
      id: SALE,
      orderNumber: 'B2B-1',
      channel: 'B2B',
      status: 'DELIVERED',
      fulfilmentType: 'DELIVERY',
      paymentMethod: 'UPI',
      paymentStatus: 'PAID',
      warehouse: { id: WH, name: 'Coonoor' },
      buyer: { kind: 'CUSTOMER', customerId: CUSTOMER, customerCode: 'CUS-1', name: 'Hotel', mobileMasked: null },
      items: [
        { productId: PRODUCT, name: 'Carrot', grade: 'GRADE_1', qtyKg: '2.000', unitPrice: '40.00', gstRate: '5.00', gstAmount: '4.00', lineTotal: '80.00' },
      ],
      totals: { subtotal: '80.00', deliveryFee: '0.00', discount: '0.00', gst: '4.00', total: '84.00' },
      invoice: { id: INVOICE, invoiceNumber: 'INV-9', status: 'ISSUED' },
      fulfilment: { deliveryDate: null, deliverySlot: null, otpRequired: false, otpVerifiedAt: null },
      timeline: [],
      placedAt: '2026-10-14T10:00:00Z',
      packedAt: null,
      completedAt: null,
      cancelledAt: null,
    } as unknown as AdminOrderDetailDto;
    const d = mapChannelOrderDetail(dto);
    expect(d.invoiceId).toBe(INVOICE);
    expect(d.totalPaise).toBe(8400);
    expect(d.items[0]?.qtyGrams).toBe(2000);
    expect(mapChannelOrderDetail({ ...dto, invoice: null }).invoiceId).toBeNull();
  });

  it('BR-30: a Sub scope pins the warehouse filter to its own warehouse', () => {
    expect(salesWarehouseFilter({ warehouseId: WH }, 'other')).toBe(WH);
    expect(salesWarehouseFilter({}, 'other')).toBe('other');
    expect(salesWarehouseFilter({}, undefined)).toBeUndefined();
  });
});

describe('sales labels: every code has an English string', () => {
  it('maps every enum code to an existing admin i18n key', () => {
    const maps = [
      GRADE_KEY,
      SALE_STATUS_KEY,
      PAYMENT_STATUS_KEY,
      PAYMENT_ROW_STATUS_KEY,
      PAYMENT_METHOD_KEY,
      SALE_CHANNEL_KEY,
      CHANNEL_ORDER_STATUS_KEY,
      CHANNEL_GROUP_KEY,
      PAYMENT_BLOCK_KEY,
    ];
    for (const m of maps) {
      for (const key of Object.values(m)) expect(en).toHaveProperty([key]);
    }
  });
});
