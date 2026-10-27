/**
 * Pure mapper functions for the warehouse order screens (design module M5).
 * No React, no network: plain-Node vitest.
 * Tests written first (CLAUDE.md 2.6); they FAIL until mappers.ts exists.
 */
import { describe, expect, it } from 'vitest';
import type { Money } from '@tohfa/shared-types';
import type { AdminOrderDetailDto, OrderSummaryDto } from '../api/orders';
import {
  orderStatusLabel,
  orderStatusTone,
  fulfillmentTypeOf,
  paymentStatusLabel,
  toOrderRow,
  toOrderDetailLines,
  orderCategoryOf,
  channelLabel,
} from '../screens/warehouse/orders/mappers';

// ─── fixtures ─────────────────────────────────────────────────────────────────

const SUMMARY: OrderSummaryDto = {
  id: 'ord-001',
  orderNumber: 'ORD-1024',
  status: 'CONFIRMED',
  fulfillmentType: 'WAREHOUSE_PICKUP',
  warehouseId: 'wh-coon',
  itemCount: 4,
  totalAmount: '850.00' as Money,
  paymentStatus: 'PAID',
  deliveryDate: '2026-09-24',
  placedAt: '2026-09-24T04:32:00.000Z',
};

const DETAIL: AdminOrderDetailDto = {
  id: 'ord-001',
  orderNumber: 'ORD-1024',
  channel: 'ONLINE',
  status: 'CONFIRMED',
  fulfilmentType: 'PICKUP',
  paymentMethod: 'WALLET',
  paymentStatus: 'PAID',
  warehouse: { id: 'wh-coon', name: 'Coonoor' },
  buyer: {
    kind: 'CUSTOMER',
    customerId: 'cus-001',
    customerCode: 'CUS-001',
    name: 'Arun Kumar',
    mobileMasked: '******1234',
  },
  items: [
    {
      productId: 'prod-1',
      name: 'Tomato',
      grade: 'GRADE_1',
      qtyKg: '2.000',
      unitPrice: '100.00' as Money,
      gstRate: '5.00',
      gstAmount: '10.00' as Money,
      lineTotal: '210.00' as Money,
    },
  ],
  totals: {
    subtotal: '800.00' as Money,
    deliveryFee: '0.00' as Money,
    discount: '0.00' as Money,
    gst: '50.00' as Money,
    total: '850.00' as Money,
  },
  invoice: null,
  fulfilment: {
    deliveryDate: null,
    deliverySlot: null,
    otpRequired: false,
    otpVerifiedAt: null,
  },
  timeline: [
    { fromStatus: null, toStatus: 'CONFIRMED', at: '2026-09-24T04:32:00.000Z' },
    { fromStatus: 'CONFIRMED', toStatus: 'PACKED', at: '2026-09-24T05:00:00.000Z' },
  ],
  placedAt: '2026-09-24T04:32:00.000Z',
  packedAt: null,
  completedAt: null,
  cancelledAt: null,
};

// ─── orderStatusLabel ─────────────────────────────────────────────────────────

describe('orderStatusLabel', () => {
  it('maps CONFIRMED to "Confirmed"', () => {
    expect(orderStatusLabel('CONFIRMED')).toBe('Confirmed');
  });

  it('maps READY_FOR_PICKUP to "Ready for Pickup"', () => {
    expect(orderStatusLabel('READY_FOR_PICKUP')).toBe('Ready for Pickup');
  });

  it('maps PACKED to "Packing"', () => {
    expect(orderStatusLabel('PACKED')).toBe('Packing');
  });

  it('maps CANCELLED to "Cancelled"', () => {
    expect(orderStatusLabel('CANCELLED')).toBe('Cancelled');
  });

  it('maps DELIVERED / PICKED_UP to "Completed"', () => {
    expect(orderStatusLabel('DELIVERED')).toBe('Completed');
    expect(orderStatusLabel('PICKED_UP')).toBe('Completed');
  });
});

// ─── orderStatusTone ──────────────────────────────────────────────────────────

describe('orderStatusTone', () => {
  it('CONFIRMED returns "info"', () => {
    expect(orderStatusTone('CONFIRMED')).toBe('info');
  });

  it('READY_FOR_PICKUP returns "warning"', () => {
    expect(orderStatusTone('READY_FOR_PICKUP')).toBe('warning');
  });

  it('DELIVERED/PICKED_UP returns "success"', () => {
    expect(orderStatusTone('DELIVERED')).toBe('success');
    expect(orderStatusTone('PICKED_UP')).toBe('success');
  });

  it('CANCELLED returns "danger"', () => {
    expect(orderStatusTone('CANCELLED')).toBe('danger');
  });
});

// ─── fulfillmentTypeOf ────────────────────────────────────────────────────────

describe('fulfillmentTypeOf', () => {
  it('maps WAREHOUSE_PICKUP (summary) to "Pickup"', () => {
    expect(fulfillmentTypeOf('WAREHOUSE_PICKUP', undefined)).toBe('Pickup');
  });

  it('maps HOME_DELIVERY (summary) to "Delivery"', () => {
    expect(fulfillmentTypeOf('HOME_DELIVERY', undefined)).toBe('Delivery');
  });

  it('maps PICKUP (detail) to "Pickup"', () => {
    expect(fulfillmentTypeOf(undefined, 'PICKUP')).toBe('Pickup');
  });

  it('maps DELIVERY (detail) to "Delivery"', () => {
    expect(fulfillmentTypeOf(undefined, 'DELIVERY')).toBe('Delivery');
  });
});

// ─── orderCategoryOf ─────────────────────────────────────────────────────────

describe('orderCategoryOf', () => {
  it('CONFIRMED / PACKED / READY_FOR_PICKUP are "Pending"', () => {
    expect(orderCategoryOf('CONFIRMED')).toBe('Pending');
    expect(orderCategoryOf('PACKED')).toBe('Pending');
    expect(orderCategoryOf('READY_FOR_PICKUP')).toBe('Pending');
  });

  it('DELIVERED / PICKED_UP are "Completed"', () => {
    expect(orderCategoryOf('DELIVERED')).toBe('Completed');
    expect(orderCategoryOf('PICKED_UP')).toBe('Completed');
  });

  it('CANCELLED is "Cancelled"', () => {
    expect(orderCategoryOf('CANCELLED')).toBe('Cancelled');
  });
});

// ─── paymentStatusLabel ───────────────────────────────────────────────────────

describe('paymentStatusLabel', () => {
  it('maps PAID to "Paid"', () => {
    expect(paymentStatusLabel('PAID')).toBe('Paid');
  });

  it('maps PENDING to "Pending"', () => {
    expect(paymentStatusLabel('PENDING')).toBe('Pending');
  });

  it('maps REFUNDED to "Refunded"', () => {
    expect(paymentStatusLabel('REFUNDED')).toBe('Refunded');
  });
});

// ─── channelLabel ─────────────────────────────────────────────────────────────

describe('channelLabel', () => {
  it('maps ONLINE to "Online"', () => {
    expect(channelLabel('ONLINE')).toBe('Online');
  });

  it('maps MARKET to "Market Day"', () => {
    expect(channelLabel('MARKET')).toBe('Market Day');
  });

  it('maps DIRECT to "Direct"', () => {
    expect(channelLabel('DIRECT')).toBe('Direct');
  });
});

// ─── toOrderRow ───────────────────────────────────────────────────────────────

describe('toOrderRow', () => {
  it('maps orderNumber correctly', () => {
    const r = toOrderRow(SUMMARY, 'Coonoor');
    expect(r.id).toBe('ORD-1024');
  });

  it('maps CONFIRMED status and sets actionScreen M5S05 (stock check)', () => {
    const r = toOrderRow(SUMMARY, 'Coonoor');
    expect(r.status).toBe('Confirmed');
    expect(r.actionScreen).toBe('M5S05');
  });

  it('maps PACKED to Pack action on M5S07', () => {
    const r = toOrderRow({ ...SUMMARY, status: 'PACKED' }, 'Coonoor');
    expect(r.actionScreen).toBe('M5S07');
  });

  it('maps READY_FOR_PICKUP to Verify Pickup on M5S11', () => {
    const r = toOrderRow({ ...SUMMARY, status: 'CONFIRMED', fulfillmentType: 'WAREHOUSE_PICKUP' }, 'Coonoor');
    // CONFIRMED pickup: Check Stock first
    expect(r.actionScreen).toBe('M5S05');
  });

  it('BR-16: customer name is masked (buyer is anonymous in summary)', () => {
    const r = toOrderRow(SUMMARY, 'Coonoor');
    // No buyer name in OrderSummaryDto — should be '—' or 'Customer'
    expect(typeof r.customer).toBe('string');
  });

  it('formats fulfillment as "Pickup" for WAREHOUSE_PICKUP', () => {
    const r = toOrderRow(SUMMARY, 'Coonoor');
    expect(r.fulfillment).toBe('Pickup');
  });

  it('uses warehouseName from argument', () => {
    const r = toOrderRow(SUMMARY, 'Coonoor');
    expect(r.warehouseName).toBe('Coonoor');
  });
});

// ─── toOrderDetailLines ───────────────────────────────────────────────────────

describe('toOrderDetailLines', () => {
  it('maps product name, grade, qty and price', () => {
    const lines = toOrderDetailLines(DETAIL.items);
    expect(lines).toHaveLength(1);
    expect(lines[0]?.name).toBe('Tomato');
    expect(lines[0]?.grade).toBe('Grade 1');
    expect(lines[0]?.qtyDetail).toContain('2');
  });

  it('BR-99: maps NO farmerId or batchId', () => {
    const lines = toOrderDetailLines(DETAIL.items);
    lines.forEach((l) => {
      expect(Object.keys(l)).not.toContain('farmerId');
      expect(Object.keys(l)).not.toContain('batchId');
    });
  });
});
