/**
 * Per-channel copy and mock data for the channel sales screens.
 *
 * Everything that differed between the old SubWarehouseB2B* and
 * SubWarehouseHoreca* twins is here, keyed by channel, so the screens hold no
 * channel-specific literals. The orders and KPI counts are placeholders until
 * the channel-orders endpoint exists (no API route yet, see SPEC_GAPS.md #5).
 */
import type { ChannelOrderItem, SalesChannel } from './types';

export interface ChannelCopy {
  /** Prefix of the order id; stripped to derive the invoice number. */
  orderIdPrefix: string;
  salesTitle: string;
  detailTitle: string;
  monitoringNotice: string;
  searchPlaceholder: string;
  businessSection: string;
  businessLabel: string;
  contactLabel: string;
  orderSection: string;
  itemsSection: string;
  amountSection: string;
}

export const CHANNEL_COPY: Record<SalesChannel, ChannelCopy> = {
  B2B: {
    orderIdPrefix: 'B2B-',
    salesTitle: 'B2B Sales',
    detailTitle: 'B2B Detail',
    monitoringNotice: 'View / monitoring access only — no unrestricted B2B management is built here.',
    searchPlaceholder: 'Search B2B order',
    businessSection: 'Business Information',
    businessLabel: 'Company',
    contactLabel: 'Contact Person',
    orderSection: 'Order Information',
    itemsSection: 'Product Items',
    amountSection: 'Amount',
  },
  HORECA: {
    orderIdPrefix: 'HORECA-',
    salesTitle: 'HORECA Sales',
    detailTitle: 'HORECA Detail',
    monitoringNotice: 'View / monitoring access only — no HORECA create/edit authority is built here.',
    searchPlaceholder: 'Search order / business',
    businessSection: 'Business',
    businessLabel: 'Business',
    contactLabel: 'Contact',
    orderSection: 'Order',
    itemsSection: 'Items',
    amountSection: 'Total',
  },
};

export interface ChannelKpis {
  orders: number;
  pending: number;
  processing: number;
  completed: number;
  salesValue: number;
}

/** Mock KPI tiles (not derived from the mock list, which is a 3-row sample). */
export const CHANNEL_KPIS: Record<SalesChannel, ChannelKpis> = {
  B2B: { orders: 8, pending: 2, processing: 3, completed: 3, salesValue: 124500 },
  HORECA: { orders: 12, pending: 3, processing: 4, completed: 5, salesValue: 48500 },
};

export const CHANNEL_ORDERS: Record<SalesChannel, ChannelOrderItem[]> = {
  B2B: [
    {
      id: 'B2B-00124',
      channel: 'B2B',
      businessName: 'Nilgiri Fresh Stores',
      customerCode: 'CUS-B00124',
      status: 'Processing',
      itemCountText: '45 Items',
      dateText: '24 Sep · 11:30 AM',
      amount: 18500,
      items: [
        { name: 'Potato', grade: 'Grade 1', batch: 'BTH-00204', qtyText: '200 KG @ ₹45', pricePerUnit: 45, lineTotal: 9000 },
        { name: 'Tomato', grade: 'Grade 1', batch: 'BTH-00231', qtyText: '100 KG @ ₹95', pricePerUnit: 95, lineTotal: 9500 },
      ],
    },
    {
      id: 'B2B-00123',
      channel: 'B2B',
      businessName: 'Apex Grocers Wholesalers',
      customerCode: 'CUS-B00123',
      status: 'Completed',
      itemCountText: '80 Items',
      dateText: '23 Sep · 02:15 PM',
      amount: 42000,
      items: [
        { name: 'Carrot', grade: 'Grade 1', batch: 'BTH-00189', qtyText: '300 KG @ ₹100', pricePerUnit: 100, lineTotal: 30000 },
        { name: 'Beans', grade: 'Grade 1', batch: 'BTH-00155', qtyText: '120 KG @ ₹100', pricePerUnit: 100, lineTotal: 12000 },
      ],
    },
    {
      id: 'B2B-00122',
      channel: 'B2B',
      businessName: 'Hilltop Supermarket Chain',
      customerCode: 'CUS-B00122',
      status: 'Pending',
      itemCountText: '120 Items',
      dateText: '23 Sep · 11:00 AM',
      amount: 64000,
      items: [
        { name: 'Cabbage', grade: 'Grade 1', batch: 'BTH-00162', qtyText: '800 KG @ ₹40', pricePerUnit: 40, lineTotal: 32000 },
        { name: 'Potato', grade: 'Grade 1', batch: 'BTH-00204', qtyText: '700 KG @ ₹45', pricePerUnit: 45, lineTotal: 31500 },
      ],
    },
  ],
  HORECA: [
    {
      id: 'HORECA-0021',
      channel: 'HORECA',
      businessName: 'Green Valley Restaurant',
      customerCode: 'CUS-H0021',
      status: 'Confirmed',
      itemCountText: '12 Items',
      dateText: '24 Sep · 10:20 AM',
      amount: 8500,
      items: [
        { name: 'Tomato', grade: 'Grade 1', batch: 'BTH-00231', qtyText: '50 KG @ ₹80', pricePerUnit: 80, lineTotal: 4000 },
        { name: 'Carrot', grade: 'Grade 1', batch: 'BTH-00189', qtyText: '45 KG @ ₹100', pricePerUnit: 100, lineTotal: 4500 },
      ],
    },
    {
      id: 'HORECA-0020',
      channel: 'HORECA',
      businessName: 'Highland Residency Hotel',
      customerCode: 'CUS-H0020',
      status: 'Processing',
      itemCountText: '18 Items',
      dateText: '24 Sep · 09:15 AM',
      amount: 14200,
      items: [
        { name: 'Potato', grade: 'Grade 1', batch: 'BTH-00204', qtyText: '100 KG @ ₹45', pricePerUnit: 45, lineTotal: 4500 },
        { name: 'Onion', grade: 'Grade 1', batch: 'BTH-00177', qtyText: '100 KG @ ₹45', pricePerUnit: 45, lineTotal: 4500 },
        { name: 'Cabbage', grade: 'Grade 1', batch: 'BTH-00162', qtyText: '130 KG @ ₹40', pricePerUnit: 40, lineTotal: 5200 },
      ],
    },
    {
      id: 'HORECA-0019',
      channel: 'HORECA',
      businessName: 'Nilgiri Tea & Dine',
      customerCode: 'CUS-H0019',
      status: 'Completed',
      itemCountText: '8 Items',
      dateText: '23 Sep · 04:45 PM',
      amount: 6800,
      items: [
        { name: 'Tomato', grade: 'Grade 1', batch: 'BTH-00231', qtyText: '40 KG @ ₹80', pricePerUnit: 80, lineTotal: 3200 },
        { name: 'Beans', grade: 'Grade 1', batch: 'BTH-00155', qtyText: '40 KG @ ₹90', pricePerUnit: 90, lineTotal: 3600 },
      ],
    },
  ],
};

/** Shown when the detail screen is opened without an order (direct route). */
export const CHANNEL_FALLBACK_ORDER: Record<SalesChannel, ChannelOrderItem> = {
  B2B: {
    id: 'B2B-00124',
    channel: 'B2B',
    businessName: 'Nilgiri Fresh Stores',
    customerCode: 'CUS-B00124',
    status: 'Processing',
    itemCountText: '45 Items',
    dateText: '24 Sep 2026',
    amount: 18500,
    items: [
      { name: 'Tomato Grade 1', grade: 'Grade 1', batch: 'BTH-00204', qtyText: '100 KG', pricePerUnit: 100, lineTotal: 10000 },
      { name: 'Carrot Grade 1', grade: 'Grade 1', batch: 'BTH-00177', qtyText: '50 KG', pricePerUnit: 150, lineTotal: 7500 },
    ],
  },
  HORECA: {
    id: 'HORECA-0021',
    channel: 'HORECA',
    businessName: 'Green Valley Restaurant',
    customerCode: 'CUS-H0021',
    status: 'Confirmed',
    itemCountText: '12 Items',
    dateText: '24 Sep 2026',
    amount: 8500,
    items: [
      { name: 'Tomato', grade: 'Grade 1', batch: 'BTH-00231', qtyText: '20 KG', pricePerUnit: 80, lineTotal: 4000 },
      { name: 'Carrot', grade: 'Grade 1', batch: 'BTH-00189', qtyText: '15 KG', pricePerUnit: 100, lineTotal: 2500 },
      { name: 'Beans', grade: 'Grade 1', batch: 'BTH-00145', qtyText: '10 KG', pricePerUnit: 100, lineTotal: 1500 },
    ],
  },
};

/** Invoice number for an order: the order id with its channel prefix replaced by `INV-`. */
export function invoiceIdForOrder(order: ChannelOrderItem): string {
  return `INV-${order.id.replace(CHANNEL_COPY[order.channel].orderIdPrefix, '')}`;
}
