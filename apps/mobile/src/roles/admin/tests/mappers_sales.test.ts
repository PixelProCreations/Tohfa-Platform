/**
 * Pure mapper functions for the direct / channel sales screens (design module M6/M8).
 * No React, no network: plain-Node vitest.
 * Tests written first (CLAUDE.md 2.6); they FAIL until mappers.ts exists.
 */
import { describe, expect, it } from 'vitest';
import type { ChannelOrderListItemDto, SaleListItemDto } from '../api/sales';
import {
  channelOrderStatusLabel,
  toChannelOrderItem,
  toSaleRecord,
  saleChannelLabel,
  salePaymentMethodLabel,
} from '../screens/warehouse/sales-direct/mappers';

// ─── fixtures ─────────────────────────────────────────────────────────────────

const CHANNEL_ORDER: ChannelOrderListItemDto = {
  id: 'ord-001',
  orderNumber: 'B2B-00124',
  channel: 'B2B',
  status: 'CONFIRMED',
  paymentStatus: 'PENDING',
  warehouseId: 'wh-coon',
  customerCode: 'CUS-B00124',
  businessName: 'Nilgiri Fresh Stores',
  itemCount: 45,
  total: '18500.00',
  placedAt: '2026-09-24T04:00:00.000Z',
};

const SALE_LIST_ITEM: SaleListItemDto = {
  id: 'sale-001',
  saleNumber: 'SAL-00124',
  channel: 'DIRECT',
  status: 'PICKED_UP',
  paymentStatus: 'CONFIRMED',
  paymentMethod: 'CASH',
  warehouseId: 'wh-coon',
  buyer: {
    kind: 'CUSTOMER',
    customerId: 'cus-001',
    customerCode: 'CUS-001',
    name: 'Arun Kumar',
    mobileMasked: '******1234',
  },
  itemCount: 3,
  total: '850.00',
  invoiceNumber: 'INV-00124',
  createdAt: '2026-09-24T04:00:00.000Z',
  completedAt: '2026-09-24T04:30:00.000Z',
};

// ─── channelOrderStatusLabel ──────────────────────────────────────────────────

describe('channelOrderStatusLabel', () => {
  it('maps CONFIRMED to "Confirmed"', () => {
    expect(channelOrderStatusLabel('CONFIRMED')).toBe('Confirmed');
  });

  it('maps PICKED_UP to "Completed"', () => {
    expect(channelOrderStatusLabel('PICKED_UP')).toBe('Completed');
  });

  it('maps CANCELLED to "Cancelled"', () => {
    expect(channelOrderStatusLabel('CANCELLED')).toBe('Cancelled');
  });
});

// ─── toChannelOrderItem ───────────────────────────────────────────────────────

describe('toChannelOrderItem', () => {
  it('maps orderNumber to id', () => {
    const r = toChannelOrderItem(CHANNEL_ORDER, 'Coonoor');
    expect(r.id).toBe('B2B-00124');
  });

  it('maps businessName', () => {
    const r = toChannelOrderItem(CHANNEL_ORDER, 'Coonoor');
    expect(r.businessName).toBe('Nilgiri Fresh Stores');
  });

  it('maps warehouseName from argument', () => {
    const r = toChannelOrderItem(CHANNEL_ORDER, 'Coonoor');
    expect(r.warehouseName).toBe('Coonoor');
  });

  it('maps itemCount to itemCountText', () => {
    const r = toChannelOrderItem(CHANNEL_ORDER, 'Coonoor');
    expect(r.itemCountText).toContain('45');
  });

  it('maps total to amount in paise or float', () => {
    const r = toChannelOrderItem(CHANNEL_ORDER, 'Coonoor');
    expect(typeof r.amount).toBe('number');
  });
});

// ─── toSaleRecord ─────────────────────────────────────────────────────────────

describe('toSaleRecord', () => {
  it('maps saleNumber to id', () => {
    const r = toSaleRecord(SALE_LIST_ITEM, 'Coonoor');
    expect(r.id).toBe('SAL-00124');
  });

  it('maps buyer.name to customerName', () => {
    const r = toSaleRecord(SALE_LIST_ITEM, 'Coonoor');
    expect(r.customerName).toBe('Arun Kumar');
  });

  it('maps DIRECT channel to "Direct Sale"', () => {
    const r = toSaleRecord(SALE_LIST_ITEM, 'Coonoor');
    expect(r.channel).toBe('Direct Sale');
  });

  it('maps PICKED_UP status to "Completed"', () => {
    const r = toSaleRecord(SALE_LIST_ITEM, 'Coonoor');
    expect(r.status).toBe('Completed');
  });

  it('maps invoiceNo', () => {
    const r = toSaleRecord(SALE_LIST_ITEM, 'Coonoor');
    expect(r.invoiceNo).toBe('INV-00124');
  });
});

// ─── saleChannelLabel ─────────────────────────────────────────────────────────

describe('saleChannelLabel', () => {
  it('maps DIRECT to "Direct Sale"', () => {
    expect(saleChannelLabel('DIRECT')).toBe('Direct Sale');
  });

  it('maps MARKET to "Market Sale"', () => {
    expect(saleChannelLabel('MARKET')).toBe('Market Sale');
  });
});

// ─── salePaymentMethodLabel ───────────────────────────────────────────────────

describe('salePaymentMethodLabel', () => {
  it('maps CASH to "Cash"', () => {
    expect(salePaymentMethodLabel('CASH')).toBe('Cash');
  });

  it('maps UPI to "UPI"', () => {
    expect(salePaymentMethodLabel('UPI')).toBe('UPI');
  });

  it('maps WALLET to "Wallet"', () => {
    expect(salePaymentMethodLabel('WALLET')).toBe('Wallet');
  });
});
