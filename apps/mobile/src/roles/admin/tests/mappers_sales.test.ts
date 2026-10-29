/**
 * Pure mapper functions for the direct / channel sales screens (design module M6/M8).
 * No React, no network: plain-Node vitest.
 *
 * Money stays integer paise end to end (root CLAUDE.md 2.2, BR-98): the mappers
 * parse the API's Money strings with parseMoney/toPaise and format with
 * formatPaise, never Number()/parseFloat. Navigation keys are the server UUIDs;
 * sale and order numbers are display fields only.
 */
import { describe, expect, it } from 'vitest';
import type { ChannelOrderListItemDto, SaleDto, SaleListItemDto, SaleProductDto } from '../api/sales';
import { t } from '../i18n';
import {
  channelOrderStatusLabel,
  formatSaleMoney,
  gradeLabel,
  gramsToQtyKg,
  parseQtyGrams,
  saleChannelLabel,
  salePaymentMethodLabel,
  salePaymentStatusLabel,
  toApiGrade,
  toChannelOrderItem,
  toSaleProduct,
  toSaleRecord,
  toSaleRecordFromDto,
} from '../screens/warehouse/sales-direct/mappers';

// ─── fixtures ─────────────────────────────────────────────────────────────────

const ORDER_ID = '0b7f6d2e-1a2b-4c3d-8e9f-001122334455';
const SALE_ID = '9c1d2e3f-4a5b-4c6d-8e7f-aabbccddeeff';
const SALE_ID_2 = '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d';
const WH = '7e57d00d-0000-4000-8000-000000000001';
const PRODUCT = '5f0c3b1a-2222-4333-8444-555566667777';
const INVOICE_ID = '3d4e5f60-7182-4394-a5b6-c7d8e9f00112';

const CHANNEL_ORDER: ChannelOrderListItemDto = {
  id: ORDER_ID,
  orderNumber: 'B2B-00124',
  channel: 'B2B',
  status: 'CONFIRMED',
  paymentStatus: 'PENDING',
  warehouseId: WH,
  customerCode: 'CUS-B00124',
  businessName: 'Nilgiri Fresh Stores',
  itemCount: 45,
  total: '18500.50',
  placedAt: '2026-09-24T04:00:00.000Z',
};

const SALE_LIST_ITEM: SaleListItemDto = {
  id: SALE_ID,
  saleNumber: 'SAL-00124',
  channel: 'DIRECT',
  status: 'PICKED_UP',
  paymentStatus: 'PAID',
  paymentMethod: 'CASH',
  warehouseId: WH,
  buyer: {
    kind: 'CUSTOMER',
    customerId: 'cus-001',
    customerCode: 'CUS-001',
    name: 'Arun Kumar',
    mobileMasked: '******1234',
  },
  itemCount: 3,
  total: '850.10',
  invoiceNumber: 'INV-00124',
  createdAt: '2026-09-24T04:00:00.000Z',
  completedAt: '2026-09-24T04:30:00.000Z',
};

const PRODUCT_DTO: SaleProductDto = {
  productId: PRODUCT,
  name: 'Tomato',
  categoryId: 'cat-veg',
  grade: 'GRADE_1',
  unitPrice: '100.10',
  availableQtyKg: '48.250',
  unit: 'kg',
  photos: [],
  certificationBadges: [],
  batchCode: 'BTH-001',
  storageLocation: 'Cold Storage A1',
};

const SALE_DTO: SaleDto = {
  id: SALE_ID_2,
  saleNumber: 'SAL-00200',
  channel: 'DIRECT',
  status: 'PICKED_UP',
  paymentStatus: 'PAID',
  warehouseId: WH,
  buyer: {
    kind: 'CUSTOMER',
    customerId: 'cus-1',
    customerCode: 'CUS-100',
    name: 'Ravi',
    mobileMasked: '******9999',
  },
  items: [
    { productId: PRODUCT, name: 'Tomato', grade: 'GRADE_1', qtyKg: '3.000', unitPrice: '100.10', lineTotal: '300.30' },
  ],
  totals: { subtotal: '300.30', gst: '15.02', total: '315.32', changeGiven: '4.68' },
  payment: {
    method: 'CASH',
    status: 'CONFIRMED',
    amount: '315.32',
    amountReceived: '320.00',
    cardRef: null,
    upiTxnRef: null,
    confirmedAt: '2026-09-24T05:00:00.000Z',
  },
  invoiceNumber: 'INV-00200',
  invoiceId: INVOICE_ID,
  timeline: [{ fromStatus: null, toStatus: 'PICKED_UP', at: '2026-09-24T05:00:00.000Z' }],
  createdAt: '2026-09-24T04:00:00.000Z',
  completedAt: '2026-09-24T05:00:00.000Z',
};

// ─── money and quantity helpers ──────────────────────────────────────────────

describe('formatSaleMoney / parseQtyGrams / gramsToQtyKg', () => {
  it('BR-98: formats an API Money string through integer paise (no float drift)', () => {
    expect(formatSaleMoney('0.30')).toBe('₹0.30');
    expect(formatSaleMoney('24850.00')).toBe('₹24,850');
    expect(formatSaleMoney('1999.95')).toBe('₹1,999.95');
  });

  it('shows a dash for a missing or malformed amount instead of ₹0 or NaN', () => {
    expect(formatSaleMoney(null)).toBe('—');
    expect(formatSaleMoney('abc')).toBe('—');
  });

  it('parses a Quantity string to integer grams and back', () => {
    expect(parseQtyGrams('48.250')).toBe(48250);
    expect(parseQtyGrams('0.001')).toBe(1);
    expect(parseQtyGrams('12')).toBe(12000);
    expect(parseQtyGrams('-1')).toBeNull();
    expect(parseQtyGrams('1.2345')).toBeNull();
    expect(gramsToQtyKg(2500)).toBe('2.500');
    expect(gramsToQtyKg(1)).toBe('0.001');
  });
});

// ─── grades ───────────────────────────────────────────────────────────────────

describe('gradeLabel & toApiGrade', () => {
  it('labels every API grade, including REJECT', () => {
    expect(gradeLabel('GRADE_1')).toBe(t('salesDirect.grade.GRADE_1'));
    expect(gradeLabel('GRADE_2')).toBe(t('salesDirect.grade.GRADE_2'));
    expect(gradeLabel('GRADE_3')).toBe(t('salesDirect.grade.GRADE_3'));
    expect(gradeLabel('REJECT')).toBe(t('salesDirect.grade.REJECT'));
    expect(gradeLabel('GRADE_1')).not.toBe('GRADE_1');
  });

  it('accepts only the API grade enum and never defaults an unknown value to GRADE_1', () => {
    expect(toApiGrade('GRADE_2')).toBe('GRADE_2');
    expect(toApiGrade('REJECT')).toBe('REJECT');
    expect(toApiGrade('Grade 1')).toBeNull();
    expect(toApiGrade('')).toBeNull();
    expect(toApiGrade('A+')).toBeNull();
  });
});

// ─── labels ───────────────────────────────────────────────────────────────────

describe('labels', () => {
  it('maps channels, methods and statuses to catalogue strings', () => {
    expect(saleChannelLabel('DIRECT')).toBe(t('salesDirect.channel.DIRECT'));
    expect(saleChannelLabel('MARKET')).toBe(t('salesDirect.channel.MARKET'));
    expect(salePaymentMethodLabel('CASH')).toBe(t('salesDirect.method.CASH'));
    expect(salePaymentMethodLabel('WALLET')).toBe(t('salesDirect.method.WALLET'));
    expect(channelOrderStatusLabel('PICKED_UP')).toBe(t('salesDirect.orderStatus.PICKED_UP'));
  });

  it('labels every payment status the API sends (PAID, PARTIALLY_PAID, REFUNDED, REFUND_DUE...)', () => {
    for (const s of ['PENDING', 'PAID', 'PARTIALLY_PAID', 'REFUNDED', 'FAILED', 'REFUND_DUE'] as const) {
      expect(salePaymentStatusLabel(s)).toBe(t(`salesDirect.paymentStatus.${s}`));
    }
  });
});

// ─── toChannelOrderItem ───────────────────────────────────────────────────────

describe('toChannelOrderItem', () => {
  it('keeps the order UUID as the id and the order number for display', () => {
    const r = toChannelOrderItem(CHANNEL_ORDER, 'Coonoor');
    expect(r.id).toBe(ORDER_ID);
    expect(r.orderNumber).toBe('B2B-00124');
    expect(r.businessName).toBe('Nilgiri Fresh Stores');
    expect(r.warehouseName).toBe('Coonoor');
    expect(r.warehouseId).toBe(WH);
    expect(r.itemCountText).toContain('45');
  });

  it('BR-98: carries the total as integer paise and a paise-formatted label', () => {
    const r = toChannelOrderItem(CHANNEL_ORDER, 'Coonoor');
    expect(r.totalPaise).toBe(1850050);
    expect(r.totalText).toBe('₹18,500.50');
  });
});

// ─── toSaleRecord ─────────────────────────────────────────────────────────────

describe('toSaleRecord', () => {
  it('keeps the sale UUID as the id (detail fetch and navigation) and the number for display', () => {
    const r = toSaleRecord(SALE_LIST_ITEM, 'Coonoor');
    expect(r.id).toBe(SALE_ID);
    expect(r.saleNumber).toBe('SAL-00124');
  });

  it('maps buyer, channel, status, payment status and invoice', () => {
    const r = toSaleRecord(SALE_LIST_ITEM, 'Coonoor');
    expect(r.customerName).toBe('Arun Kumar');
    expect(r.channel).toBe(t('salesDirect.channel.DIRECT'));
    expect(r.channelCode).toBe('DIRECT');
    expect(r.statusCode).toBe('PICKED_UP');
    expect(r.status).toBe(t('salesDirect.saleStatus.PICKED_UP'));
    expect(r.paymentStatusCode).toBe('PAID');
    expect(r.paymentStatus).toBe(t('salesDirect.paymentStatus.PAID'));
    expect(r.invoiceNo).toBe('INV-00124');
    expect(r.warehouseName).toBe('Coonoor');
  });

  it('BR-98: total is integer paise, never a float', () => {
    const r = toSaleRecord(SALE_LIST_ITEM, 'Coonoor');
    expect(r.totalPaise).toBe(85010);
    expect(Number.isInteger(r.totalPaise)).toBe(true);
    expect(r.totalText).toBe('₹850.10');
  });
});

// ─── toSaleRecordFromDto ──────────────────────────────────────────────────────

describe('toSaleRecordFromDto', () => {
  it('maps the detail with the UUID id, the invoice UUID and server totals', () => {
    const r = toSaleRecordFromDto(SALE_DTO, 'Coonoor Warehouse');
    expect(r.id).toBe(SALE_ID_2);
    expect(r.saleNumber).toBe('SAL-00200');
    expect(r.invoiceId).toBe(INVOICE_ID);
    expect(r.invoiceNo).toBe('INV-00200');
    expect(r.customerCode).toBe('CUS-100');
    expect(r.paymentMethod).toBe(t('salesDirect.method.CASH'));
    expect(r.warehouseName).toBe('Coonoor Warehouse');
  });

  it('BR-98: subtotal, GST, total and change come from the server totals in paise', () => {
    const r = toSaleRecordFromDto(SALE_DTO, 'Coonoor');
    expect(r.totalPaise).toBe(31532);
    expect(r.subtotalText).toBe('₹300.30');
    expect(r.gstText).toBe('₹15.02');
    expect(r.totalText).toBe('₹315.32');
    expect(r.changeGivenText).toBe('₹4.68');
  });

  it('maps lines with a grade label and paise-formatted amounts', () => {
    const r = toSaleRecordFromDto(SALE_DTO, 'Coonoor');
    expect(r.items).toHaveLength(1);
    const line = r.items?.[0];
    expect(line?.name).toBe('Tomato');
    expect(line?.grade).toBe(t('salesDirect.grade.GRADE_1'));
    expect(line?.lineTotalText).toBe('₹300.30');
    expect(line?.unitPriceText).toBe('₹100.10');
    expect(line?.qtyText).toContain('3');
  });

  it('maps the server timeline (no invented steps)', () => {
    const r = toSaleRecordFromDto(SALE_DTO, 'Coonoor');
    expect(r.timeline).toHaveLength(1);
    expect(r.timeline?.[0]?.label).toBe(t('salesDirect.saleStatus.PICKED_UP'));
  });
});

// ─── toSaleProduct ────────────────────────────────────────────────────────────

describe('toSaleProduct', () => {
  it('maps the product with a product+grade key, integer paise price and grams', () => {
    const p = toSaleProduct(PRODUCT_DTO, WH);
    expect(p.key).toBe(`${PRODUCT}|GRADE_1`);
    expect(p.productId).toBe(PRODUCT);
    expect(p.grade).toBe('GRADE_1');
    expect(p.gradeLabel).toBe(t('salesDirect.grade.GRADE_1'));
    expect(p.unitPrice).toBe('100.10');
    expect(p.unitPricePaise).toBe(10010);
    expect(p.availableGrams).toBe(48250);
    expect(p.batch).toBe('BTH-001');
    expect(p.location).toBe('Cold Storage A1');
    expect(p.warehouseId).toBe(WH);
  });

  it('does not invent a "Low Stock" label from a hard-coded kg threshold (root CLAUDE.md 2.7)', () => {
    const p = toSaleProduct({ ...PRODUCT_DTO, availableQtyKg: '5.000' });
    expect(Object.keys(p)).not.toContain('status');
  });

  it('BR-90: the screen product is an allow-list (no farm identity key can pass through)', () => {
    const leaky = { ...PRODUCT_DTO, farmerId: 'f-1', farmName: 'Green Acres', gps: '11.4,76.7' } as SaleProductDto;
    const p = toSaleProduct(leaky);
    const keys = Object.keys(p);
    expect(keys).not.toContain('farmerId');
    expect(keys).not.toContain('farmName');
    expect(keys).not.toContain('gps');
  });
});
