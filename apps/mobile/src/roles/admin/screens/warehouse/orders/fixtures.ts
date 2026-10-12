/**
 * Design sample data for the warehouse customer-order screens (design module
 * M5), moved out of the screen bodies unchanged. Each screen that reads from
 * here is moved to live data (GET /admin/orders, /admin/orders/{id}) in its own
 * change; screens with no API yet keep reading their samples from here.
 *
 * No colours here: status tones stay with the screens, on the admin theme.
 */
import type {
  OrderWarehouseOption,
  SampleOrderDetail,
  SampleOrderRow,
  SamplePackingItem,
  SampleReadyOrder,
  SampleStatusEvent,
  SampleWarehouseOrderCount,
} from './types';

/** The order every sample screen opened when no order was passed. */
export const SAMPLE_ORDER_ID = 'ORD-1024';
export const SAMPLE_CUSTOMER = 'Arun Kumar';
/** The sample delivery order (delivery preparation and dispatch). */
export const SAMPLE_DELIVERY_ORDER_ID = 'ORD-1021';

/** Neutral placeholder until the host passes the real warehouse list (same ids as the sample orders). */
export const SAMPLE_LIST_WAREHOUSES: OrderWarehouseOption[] = [
  { id: 'WH-COON', name: 'Coonoor' },
  { id: 'WH-OOTY', name: 'Ooty' },
  { id: 'WH-2', name: 'Ooty' },
  { id: 'WH-3', name: 'Kotagiri' },
  { id: 'WH-4', name: 'Gudalur' },
];

/** The Main dashboard's warehouse selector placeholder. */
export const SAMPLE_DASHBOARD_WAREHOUSES: OrderWarehouseOption[] = [
  { id: 'WH-COON', name: 'Coonoor' },
  { id: 'WH-OOTY', name: 'Ooty' },
  { id: 'WH-KOTA', name: 'Kotagiri' },
  { id: 'WH-GUDA', name: 'Gudalur' },
];

/** Sample per-warehouse order summary (Main dashboard). */
export const SAMPLE_WAREHOUSE_SUMMARY: SampleWarehouseOrderCount[] = [
  { id: 'WH-COON', name: 'Coonoor', orders: 16 },
  { id: 'WH-OOTY', name: 'Ooty', orders: 12 },
];

/** The sample dashboard figures, as the design drew them. */
export const SAMPLE_DASHBOARD_COUNTS = {
  mainTotal: 48,
  mainNew: 8,
  mainReady: 9,
  mainIssues: 2,
  subNew: 12,
  subConfirmed: 8,
  subPacking: 5,
  subReady: 7,
  subDelivery: 3,
  subIssues: 2,
  todayOrders: 24,
  todayCompleted: 16,
  todayPending: 8,
};

/** The sample order list (M5S02). */
export const SAMPLE_ORDERS: SampleOrderRow[] = [
  {
    id: 'ORD-1024',
    warehouseId: 'WH-COON',
    warehouseName: 'Coonoor',
    customer: 'Arun Kumar',
    status: 'Confirmed',
    items: '4 Items',
    amount: '₹850',
    fulfillment: 'Pickup',
    time: 'Today · 10:32 AM',
    action: 'Check Stock',
    actionScreen: 'M5S05',
  },
  {
    id: 'ORD-1023',
    warehouseId: 'WH-COON',
    warehouseName: 'Coonoor',
    customer: 'Priya',
    status: 'Ready for Pickup',
    items: '5 Items',
    amount: '₹1,240',
    fulfillment: 'Pickup',
    time: 'Today · 09:45 AM',
    action: 'Verify Pickup',
    // Was M5S10, now the 'verify' step of the pickup wizard.
    actionScreen: 'M5S11',
    actionStep: 'verify',
  },
  {
    id: 'ORD-1022',
    warehouseId: 'WH-OOTY',
    warehouseName: 'Ooty',
    customer: 'Ganesh K.',
    status: 'Packing',
    items: '2 Items',
    amount: '₹420',
    fulfillment: 'Pickup',
    time: 'Today · 09:10 AM',
    action: 'Pack',
    actionScreen: 'M5S07',
  },
  {
    id: 'ORD-1021',
    warehouseId: 'WH-COON',
    warehouseName: 'Coonoor',
    customer: 'Divya R.',
    status: 'Confirmed',
    items: '4 Items',
    amount: '₹960',
    fulfillment: 'Delivery',
    time: 'Today · 08:55 AM',
    action: 'Prepare Delivery',
    actionScreen: 'M5S13',
  },
  {
    id: 'ORD-1019',
    warehouseId: 'WH-COON',
    warehouseName: 'Warehouse 1',
    customer: 'Kavitha M.',
    status: 'Packing',
    items: '3 Items',
    amount: '₹720',
    fulfillment: 'Delivery',
    time: 'Today · 08:30 AM',
    action: 'Prepare Delivery',
    actionScreen: 'M5S13',
  },
  {
    id: 'ORD-1015',
    warehouseId: 'WH-COON',
    warehouseName: 'Warehouse 1',
    customer: 'Suresh R.',
    status: 'Confirmed',
    items: '5 Items',
    amount: '₹1,450',
    fulfillment: 'Delivery',
    time: 'Today · 08:15 AM',
    action: 'Prepare Delivery',
    actionScreen: 'M5S13',
  },
  {
    id: 'ORD-1012',
    warehouseId: 'WH-COON',
    warehouseName: 'Warehouse 1',
    customer: 'Ananya S.',
    status: 'Confirmed',
    items: '2 Items',
    amount: '₹580',
    fulfillment: 'Delivery',
    time: 'Today · 07:45 AM',
    action: 'Prepare Delivery',
    actionScreen: 'M5S13',
  },
  {
    id: 'ORD-1018',
    warehouseId: 'WH-3',
    warehouseName: 'Kotagiri',
    customer: 'Meena S.',
    status: 'Quantity Issue',
    items: '2 Items',
    amount: '₹310',
    fulfillment: 'Pickup',
    time: 'Yesterday · 4:20 PM',
    action: 'Review Shortage',
    // Was M5S06, now the 'shortage' step of the stock check.
    actionScreen: 'M5S05',
    actionStep: 'shortage',
  },
  {
    id: 'ORD-1010',
    warehouseId: 'WH-COON',
    warehouseName: 'Coonoor',
    customer: 'Rahul Kumar',
    status: 'Completed',
    items: '3 Items',
    amount: '₹850',
    fulfillment: 'Pickup',
    time: 'Yesterday · 2:10 PM',
    action: 'View Invoice',
    actionScreen: 'M5S18',
  },
];

/** Sample orders waiting at the counter (M5S09). */
export const SAMPLE_READY_ORDERS: SampleReadyOrder[] = [
  {
    id: 'ORD-1024',
    customer: 'Arun Kumar',
    items: '4 Items',
    amount: '₹850',
    time: 'Ready for 2h 15m',
    packed: 'Packed 11:15 AM',
  },
  {
    id: 'ORD-1023',
    customer: 'Priya',
    items: '5 Items',
    amount: '₹1,240',
    time: 'Ready for 3h 40m',
    packed: 'Packed 09:45 AM',
  },
];

/** The design's fixed "7 Orders" subtitle on Ready for Pickup. */
export const SAMPLE_READY_COUNT_LABEL = '7 Orders';

// The old M5S15B received date and performer as fixed values for every event;
// they are kept per event here.
const SAMPLE_EVENT_DATE = '24 Sep 2026';
const SAMPLE_PERFORMER = 'Warehouse Admin';

/** The sample status timeline, as hard-coded by the old M5S15 screen. */
export const SAMPLE_STATUS_EVENTS: SampleStatusEvent[] = [
  { id: '1', title: 'Order Placed', time: '24 Sep · 10:32 AM' },
  { id: '2', title: 'Order Confirmed', time: '10:34 AM' },
  { id: '3', title: 'Stock Checked', time: '10:40 AM' },
  { id: '4', title: 'Packed', time: '11:15 AM' },
  { id: '5', title: 'Ready for Pickup', time: '11:20 AM' },
  { id: '6', title: 'Customer Arrived', time: '12:18 PM' },
  { id: '7', title: 'OTP Verified', time: '12:19 PM' },
  { id: '8', title: 'Picked Up', time: '12:20 PM' },
].map((e) => ({ ...e, date: SAMPLE_EVENT_DATE, performedBy: SAMPLE_PERFORMER }));

/** The sample order detail, keyed off two demo invoice ids exactly as the old M5S04 did. */
export function sampleOrderDetail(orderId: string, customerName: string): SampleOrderDetail {
  const isInv251 = orderId === 'INV-00251' || orderId === 'ORD-00251';
  const isInv238 = orderId === 'INV-00238' || orderId === 'ORD-00238';
  return {
    displayDate: isInv251 ? '24 Sep, 10:42 AM' : isInv238 ? '20 Sep, 11:15 AM' : '24 Sep, 10:32 AM',
    displayCustomer: customerName || (isInv251 || isInv238 ? 'Rajesh Kumar' : SAMPLE_CUSTOMER),
    displayStatus: isInv251 || isInv238 ? 'Paid · Completed' : 'Confirmed',
    phone: '+91 98765 43210',
    items: isInv251
      ? [{ name: 'Tomato', grade: 'Grade 1', qtyDetail: '2 KG × ₹100', price: '₹200' }]
      : isInv238
        ? [
            { name: 'Tomato', grade: 'Grade 1', qtyDetail: '2 KG × ₹100', price: '₹200' },
            { name: 'Carrot', grade: 'Grade 1', qtyDetail: '1 KG × ₹150', price: '₹150' },
            { name: 'Beans', grade: 'Grade 1', qtyDetail: '2 KG × ₹150', price: '₹300' },
          ]
        : [
            { name: 'Tomato', grade: 'Grade 1', qtyDetail: '2 KG × ₹100', price: '₹200' },
            { name: 'Carrot', grade: 'Grade 1', qtyDetail: '3 KG × ₹120', price: '₹360' },
          ],
    subtotal: isInv251 ? '₹200' : isInv238 ? '₹650' : '₹560',
    gst: isInv251 || isInv238 ? '₹0' : '₹28',
    total: isInv251 ? '₹200' : isInv238 ? '₹650' : '₹588',
  };
}

/** The sample packing checklist (M5S07). */
export const SAMPLE_PACKING_CHECKLIST: SamplePackingItem[] = [
  { id: '1', name: 'Tomato · 2 KG', checked: true },
  { id: '2', name: 'Carrot · 3 KG', checked: true },
  { id: '3', name: 'Beans · 1 KG', checked: false },
  { id: '4', name: 'Cabbage · 2 KG', checked: false },
];

/** The packed sample's figures (M5S07 confirm step). */
export const SAMPLE_PACKING_SUMMARY = {
  packedAt: '11:15 AM',
  items: '4 / 4',
  totalQuantity: '8 KG',
  customer: SAMPLE_CUSTOMER,
};

/** The pickup wizard's sample order (M5S11). */
export const SAMPLE_PICKUP = {
  customer: SAMPLE_CUSTOMER,
  phone: '+91 XXXXX XXXXX',
  items: '4 Items',
  itemCount: '4',
  total: '₹850',
  completedAt: '24 Sep · 12:20 PM',
  /** The design drew the OTP boxes already filled with this code. */
  otpDigits: ['4', '8', '2', '1'],
};

export const SAMPLE_PARTNER_PLACEHOLDER = 'Select delivery person';

/** Sample delivery partners (M5S14). */
export const SAMPLE_DELIVERY_PARTNERS = [
  SAMPLE_PARTNER_PLACEHOLDER,
  'Ramesh Kumar (Van #04)',
  'Suresh M. (Bike #12)',
  'Anand P. (Runner #02)',
  'Karthik S. (Van #08)',
];

/** The dispatch sample order (M5S14). Slot codes come from configuration/API; this is the sample's slot. */
export const SAMPLE_DISPATCH = {
  customer: 'Divya R.',
  itemCount: 4,
  deliveryAddress: 'Ooty Road',
  deliverySlot: 'AFTERNOON_12_4',
};

/** The delivery preparation sample (M5S13). */
export const SAMPLE_DELIVERY_PREP = {
  configuredAddress: 'Configured address — Divya R., Ooty Road, Coonoor',
  deliveryDate: '25 Sep 2026',
  deliverySlot: 'AFTERNOON_12_4',
};

/** The sample invoice number (M5S18). */
export const SAMPLE_INVOICE_NO = 'INV-2026-001024';

/** The id the old M5S16 handed to M5S16B on submit. */
export const SAMPLE_NEW_ISSUE_ID = 'ISS-0028';

/** The cancellation sample's figures (M5S17). */
export const SAMPLE_CANCELLATION = {
  customer: SAMPLE_CUSTOMER,
  total: '₹850',
};
