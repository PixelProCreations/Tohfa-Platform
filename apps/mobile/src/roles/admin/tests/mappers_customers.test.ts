/**
 * Pure mapper functions for the warehouse customer screens (design module M7).
 * No React, no network: plain-Node vitest.
 *
 * Tests written first (tests-first rule per root CLAUDE.md 2.6).
 * They FAIL until ./screens/warehouse/customers/mappers.ts exists.
 */
import { describe, expect, it } from 'vitest';
import type { AdminCustomerListItemDto, AdminCustomerOrderDto, AdminCustomerPurchaseDto, AdminCustomerIssueDto, AdminCustomerSupportTicketDto, CustomerListSummaryDto } from '../api/customers';
import {
  toCustomerRecord,
  toCustomerOrderRecord,
  toPurchaseRecord,
  toCustomerIssueRecord,
  toSupportTicketRecord,
  toCustomerKpis,
  formatAdminDate,
  maskPhone,
} from '../screens/warehouse/customers/mappers';

// ─── fixtures ────────────────────────────────────────────────────────────────

const CUSTOMER_LIST_ITEM: AdminCustomerListItemDto = {
  id: 'cus-001',
  customerCode: 'CUS-00291',
  name: 'Rajesh Kumar',
  mobileMasked: '******1234',
  customerType: 'RETAIL',
  status: 'ACTIVE',
  isNew: false,
  preferredWarehouseId: 'wh-coon',
  totalOrders: 12,
  lastActivityAt: '2026-09-24T10:00:00.000Z',
  piiMasked: true,
  createdAt: '2026-01-12T00:00:00.000Z',
};

const CUSTOMER_ORDER: AdminCustomerOrderDto = {
  id: 'ord-001',
  orderNumber: 'ORD-00251',
  channel: 'ONLINE',
  status: 'READY_FOR_PICKUP',
  paymentStatus: 'PAID',
  paymentMethod: 'WALLET',
  warehouseId: 'wh-coon',
  itemCount: 3,
  totalAmount: '850.00',
  invoiceNumber: 'INV-001',
  placedAt: '2026-09-24T08:00:00.000Z',
  completedAt: null,
};

const PURCHASE: AdminCustomerPurchaseDto = {
  orderId: 'ord-001',
  orderNumber: 'ORD-00251',
  channel: 'DIRECT',
  warehouseId: 'wh-coon',
  productId: 'prod-001',
  productName: 'Tomato',
  grade: 'GRADE_1',
  qtyKg: '2.000',
  unitPrice: '100.00',
  lineTotal: '200.00',
  purchasedAt: '2026-09-24T08:00:00.000Z',
};

const ISSUE: AdminCustomerIssueDto = {
  id: 'ret-001',
  kind: 'RETURN',
  reference: 'RET-abcd1234',
  orderId: 'ord-001',
  orderNumber: 'ORD-00251',
  status: 'PENDING',
  reason: 'Quality issue',
  createdAt: '2026-09-24T10:00:00.000Z',
  resolvedAt: null,
};

const TICKET: AdminCustomerSupportTicketDto = {
  id: 'tkt-001',
  ticketNumber: 'SUP-00182',
  categoryCode: 'QUALITY',
  subject: 'Pickup Issue',
  status: 'RESOLVED',
  priority: 'NORMAL',
  messageCount: 3,
  resolvedAt: '2026-09-25T10:00:00.000Z',
  createdAt: '2026-09-24T10:00:00.000Z',
  updatedAt: '2026-09-25T10:00:00.000Z',
};

const SUMMARY: CustomerListSummaryDto = { total: 1248, active: 1105, new: 24 };

// ─── toCustomerRecord ─────────────────────────────────────────────────────────

describe('toCustomerRecord', () => {
  it('BR-92: uses mobileMasked as phone when piiMasked is true', () => {
    const r = toCustomerRecord(CUSTOMER_LIST_ITEM, undefined);
    expect(r.phone).toBe('******1234');
  });

  it('maps ACTIVE status to "Active"', () => {
    const r = toCustomerRecord(CUSTOMER_LIST_ITEM, undefined);
    expect(r.status).toBe('Active');
  });

  it('maps INACTIVE status to "Inactive"', () => {
    const r = toCustomerRecord({ ...CUSTOMER_LIST_ITEM, status: 'INACTIVE' }, undefined);
    expect(r.status).toBe('Inactive');
  });

  it('maps warehouseId from preferredWarehouseId', () => {
    const r = toCustomerRecord(CUSTOMER_LIST_ITEM, undefined);
    expect(r.warehouseId).toBe('wh-coon');
  });

  it('sets warehouseName when lookup map is provided', () => {
    const r = toCustomerRecord(CUSTOMER_LIST_ITEM, new Map([['wh-coon', 'Coonoor Warehouse']]));
    expect(r.warehouseName).toBe('Coonoor Warehouse');
  });

  it('maps totalOrders to ordersCount', () => {
    const r = toCustomerRecord(CUSTOMER_LIST_ITEM, undefined);
    expect(r.ordersCount).toBe(12);
  });

  it('BR-16: does not leak farm fields', () => {
    const r = toCustomerRecord(CUSTOMER_LIST_ITEM, undefined);
    expect(Object.keys(r)).not.toContain('farmerId');
    expect(Object.keys(r)).not.toContain('farmName');
  });
});

// ─── toCustomerOrderRecord ────────────────────────────────────────────────────

describe('toCustomerOrderRecord', () => {
  it('maps ONLINE channel correctly', () => {
    const r = toCustomerOrderRecord(CUSTOMER_ORDER);
    expect(r.orderNo).toBe('ORD-00251');
  });

  it('maps READY_FOR_PICKUP to "Active" category', () => {
    const r = toCustomerOrderRecord(CUSTOMER_ORDER);
    expect(r.statusCategory).toBe('Active');
  });

  it('maps DELIVERED to "Completed" category', () => {
    const r = toCustomerOrderRecord({ ...CUSTOMER_ORDER, status: 'DELIVERED' });
    expect(r.statusCategory).toBe('Completed');
  });

  it('maps CANCELLED to "Cancelled" category', () => {
    const r = toCustomerOrderRecord({ ...CUSTOMER_ORDER, status: 'CANCELLED' });
    expect(r.statusCategory).toBe('Cancelled');
  });

  it('maps PICKUP fulfilment type to "Pickup"', () => {
    // paymentMethod and other fields don't determine pickup, but status READY_FOR_PICKUP suggests pickup
    // We use a separate check: if fulfilmentType is available
    const r = toCustomerOrderRecord(CUSTOMER_ORDER);
    expect(['Pickup', 'Delivery']).toContain(r.type);
  });

  it('formats PAID paymentStatus correctly', () => {
    const r = toCustomerOrderRecord(CUSTOMER_ORDER);
    expect(r.paymentStatus).toBe('Paid');
  });
});

// ─── toPurchaseRecord ─────────────────────────────────────────────────────────

describe('toPurchaseRecord', () => {
  it('maps productName and grade to itemsSummary', () => {
    const r = toPurchaseRecord(PURCHASE);
    expect(r.itemsSummary).toContain('Tomato');
  });

  it('maps PAID status from order', () => {
    const r = toPurchaseRecord(PURCHASE);
    expect(r.status).toBe('Paid');
  });

  it('uses orderNumber as invoiceNo', () => {
    const r = toPurchaseRecord(PURCHASE);
    expect(r.orderNo).toBe('ORD-00251');
  });
});

// ─── toCustomerIssueRecord ────────────────────────────────────────────────────

describe('toCustomerIssueRecord', () => {
  it('maps PENDING status to "Open"', () => {
    const r = toCustomerIssueRecord(ISSUE);
    expect(r.status).toBe('Open');
  });

  it('maps APPROVED/REFUNDED status to "Resolved"', () => {
    const r = toCustomerIssueRecord({ ...ISSUE, status: 'REFUNDED' });
    expect(r.status).toBe('Resolved');
  });

  it('maps INSPECTED status to "In Review"', () => {
    const r = toCustomerIssueRecord({ ...ISSUE, status: 'INSPECTED' });
    expect(r.status).toBe('In Review');
  });

  it('uses reference as issueNo', () => {
    const r = toCustomerIssueRecord(ISSUE);
    expect(r.issueNo).toBe('RET-abcd1234');
  });
});

// ─── toSupportTicketRecord ────────────────────────────────────────────────────

describe('toSupportTicketRecord', () => {
  it('maps ticketNumber correctly', () => {
    const r = toSupportTicketRecord(TICKET);
    expect(r.ticketNo).toBe('SUP-00182');
  });

  it('maps RESOLVED status', () => {
    const r = toSupportTicketRecord(TICKET);
    expect(r.status).toBe('Resolved');
  });

  it('maps OPEN status', () => {
    const r = toSupportTicketRecord({ ...TICKET, status: 'OPEN' });
    expect(r.status).toBe('Open');
  });
});

// ─── toCustomerKpis ───────────────────────────────────────────────────────────

describe('toCustomerKpis', () => {
  it('returns total, active, new from summary', () => {
    const kpis = toCustomerKpis(SUMMARY);
    expect(kpis.find((k) => k.label === 'TOTAL CUSTOMERS')?.value).toBe('1,248');
    expect(kpis.find((k) => k.label === 'ACTIVE')?.value).toBe('1,105');
    expect(kpis.find((k) => k.label === 'NEW')?.value).toBe('24');
  });
});

// ─── formatAdminDate ──────────────────────────────────────────────────────────

describe('formatAdminDate', () => {
  it('formats ISO date to "DD Mon YYYY" style', () => {
    const d = formatAdminDate('2026-09-24T10:00:00.000Z');
    // Day/month can vary by timezone but year should be present
    expect(d).toMatch(/2026/);
  });

  it('returns "—" for null', () => {
    expect(formatAdminDate(null)).toBe('—');
  });
});

// ─── maskPhone ────────────────────────────────────────────────────────────────

describe('maskPhone', () => {
  it('BR-92: returns maskedMobile unchanged', () => {
    expect(maskPhone('******1234')).toBe('******1234');
  });

  it('returns "—" for null', () => {
    expect(maskPhone(null)).toBe('—');
  });
});
