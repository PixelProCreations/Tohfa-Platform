/**
 * Mock data for the warehouse customer screens until the customer API is
 * wired (SPEC_GAPS W4h-2). Rows carry the seeded warehouse ids (seed
 * 001_reference.sql) so a Sub scope can filter to its own warehouse while the
 * Main scope sees all four.
 *
 * The Sub and Main twins each had their own sample customers; both sets are
 * here (Main's Ooty/Coonoor rows give the multi-warehouse list something to show).
 */
import type {
  CustomerIssueRecord,
  CustomerOrderRecord,
  CustomerRecord,
  OrderFilterState,
  PurchaseFilterState,
  PurchaseRecord,
  SupportTicketRecord,
  WarehouseScope,
} from './types';

/** The four warehouses (seed 001). Main's customer.list.view `own` covers all of them. */
export const CUSTOMER_WAREHOUSES: readonly WarehouseScope[] = [
  { warehouseId: 'WH-OOTY', warehouseName: 'Ooty Warehouse' },
  { warehouseId: 'WH-COON', warehouseName: 'Coonoor Warehouse' },
  { warehouseId: 'WH-KOTA', warehouseName: 'Kotagiri Warehouse' },
  { warehouseId: 'WH-GUDA', warehouseName: 'Gudalur Market Warehouse' },
];

export const INITIAL_CUSTOMERS: readonly CustomerRecord[] = [
  {
    id: 'CUS-00291',
    name: 'Rajesh Kumar',
    code: 'CUS-00291',
    phone: '+91 XXXXX XXXXX',
    email: 'customer@example.com',
    status: 'Active',
    warehouseId: 'WH-COON',
    warehouseName: 'Coonoor Warehouse',
    ordersCount: 12,
    lastPurchase: '24 Sep 2026',
    totalPurchases: '₹8,450',
    walletBalance: '₹1,250',
    openIssues: 2,
    completedOrders: 10,
    cancelledOrders: 1,
    regDate: '12 Jan 2026',
  },
  {
    id: 'CUS-00152',
    name: 'Priya Stores',
    code: 'CUS-00152',
    phone: '+91 XXXXX XXXXX',
    email: 'priyastores@example.com',
    status: 'Active',
    warehouseId: 'WH-COON',
    warehouseName: 'Coonoor Warehouse',
    ordersCount: 8,
    lastPurchase: '22 Sep 2026',
    totalPurchases: '₹5,320',
    walletBalance: '₹800',
    openIssues: 0,
    completedOrders: 8,
    cancelledOrders: 0,
    regDate: '04 Mar 2026',
  },
  {
    id: 'CUS-00087',
    name: 'Ganesh K.',
    code: 'CUS-00087',
    phone: '+91 XXXXX XXXXX',
    email: 'ganesh.k@example.com',
    status: 'Inactive',
    warehouseId: 'WH-COON',
    warehouseName: 'Coonoor Warehouse',
    ordersCount: 3,
    lastPurchase: '2 months ago',
    totalPurchases: '₹1,950',
    walletBalance: '₹120',
    openIssues: 1,
    completedOrders: 2,
    cancelledOrders: 1,
    regDate: '18 Nov 2025',
  },
  {
    id: 'CUS-001246',
    name: 'Anand Verma',
    code: 'CUS-001246',
    phone: '+91 98451 22340',
    status: 'Active',
    warehouseId: 'WH-OOTY',
    warehouseName: 'Ooty Warehouse',
    ordersCount: 8,
    lastPurchase: '21 Sep 2026',
    totalPurchases: '₹6,120',
  },
  {
    id: 'CUS-001247',
    name: 'Priya Sundaram',
    code: 'CUS-001247',
    phone: '+91 97410 88921',
    status: 'Active',
    warehouseId: 'WH-OOTY',
    warehouseName: 'Ooty Warehouse',
    ordersCount: 15,
    lastPurchase: '23 Sep 2026',
    totalPurchases: '₹11,350',
  },
];

/** Customer used when a deep link names no customer (the old screens defaulted to the same one). */
export const DEFAULT_CUSTOMER: CustomerRecord = INITIAL_CUSTOMERS[0] as CustomerRecord;

/**
 * Header KPI tiles of the customers list. Sub showed three tiles for its own
 * warehouse; the Main twin showed four across all warehouses.
 */
export const SUB_CUSTOMER_KPIS = [
  { label: 'TOTAL CUSTOMERS', value: '1,248' },
  { label: 'ACTIVE', value: '1,105' },
  { label: 'NEW', value: '24' },
] as const;
export const MAIN_CUSTOMER_KPIS = [
  { label: 'TOTAL CUSTOMERS', value: '1,248' },
  { label: 'ACTIVE', value: '1,102' },
  { label: 'WITH ORDERS', value: '864' },
  { label: 'WITH ISSUES', value: '23' },
] as const;

export const INITIAL_CUSTOMER_ORDERS: readonly CustomerOrderRecord[] = [
  {
    id: 'ord-1',
    orderNo: 'ORD-00251',
    date: '24 Sep 2026',
    items: '3 Items',
    products: 'Tomato Grade 1, Potato, Onion',
    type: 'Pickup',
    paymentStatus: 'Paid',
    price: '₹850',
    status: 'Ready for Pickup',
    statusCategory: 'Active',
    warehouseId: 'WH-COON',
  },
  {
    id: 'ord-2',
    orderNo: 'ORD-00238',
    date: '20 Sep 2026',
    items: '2 Items',
    products: 'Fresh Apple, Banana Robusta',
    type: 'Pickup',
    paymentStatus: 'Paid',
    price: '₹420',
    status: 'Completed',
    statusCategory: 'Completed',
    warehouseId: 'WH-COON',
  },
  {
    id: 'ord-3',
    orderNo: 'ORD-00230',
    date: '18 Sep 2026',
    items: '4 Items',
    products: 'Carrots, Beetroot, Cabbage, Green Peas',
    type: 'Pickup',
    paymentStatus: 'Paid',
    price: '₹680',
    status: 'Ready for Pickup',
    statusCategory: 'Active',
    warehouseId: 'WH-OOTY',
  },
  {
    id: 'ord-4',
    orderNo: 'ORD-00215',
    date: '14 Sep 2026',
    items: '5 Items',
    products: 'Basmati Rice 5kg, Cooking Oil 1L, Spices',
    type: 'Delivery',
    paymentStatus: 'Paid',
    price: '₹1,350',
    status: 'Completed',
    statusCategory: 'Completed',
    warehouseId: 'WH-COON',
  },
  {
    id: 'ord-5',
    orderNo: 'ORD-00198',
    date: '08 Sep 2026',
    items: '1 Item',
    products: 'Organic Honey 500g',
    type: 'Pickup',
    paymentStatus: 'Refunded',
    price: '₹550',
    status: 'Cancelled',
    statusCategory: 'Cancelled',
    warehouseId: 'WH-COON',
  },
];

export const INITIAL_CUSTOMER_ISSUES: readonly CustomerIssueRecord[] = [
  {
    id: 'iss1',
    issueNo: 'ISSUE-00231',
    category: 'Quality',
    orderNo: 'ORD-00251',
    dateText: '24 Sep 2026',
    status: 'In Review',
    product: 'Tomato Grade 1',
    quantity: '2 KG',
    description: 'Customer reported quality issue.',
  },
];

/** Issue counts per status for the issues header tiles. */
export const CUSTOMER_ISSUE_KPIS = [
  { label: 'OPEN', value: '2' },
  { label: 'IN REVIEW', value: '1' },
  { label: 'RESOLVED', value: '8' },
] as const;

export const INITIAL_SUPPORT_TICKETS: readonly SupportTicketRecord[] = [
  {
    id: 's1',
    ticketNo: 'SUP-00182',
    subject: 'Pickup Issue',
    orderRef: 'ORD-00251',
    dateText: '24 Sep 2026',
    status: 'Resolved',
    resolvedBy: 'Admin',
  },
];

export const SUPPORT_KPIS = [
  { label: 'TOTAL', value: '12' },
  { label: 'OPEN', value: '1' },
  { label: 'RESOLVED', value: '11' },
] as const;

export const INITIAL_PURCHASES: readonly PurchaseRecord[] = [
  {
    id: 'p1',
    invoiceNo: 'INV-00251',
    dateText: '24 Sep 2026',
    itemsSummary: 'Tomato Grade 1 · 2 KG',
    amount: '₹200',
    status: 'Paid',
    channel: 'Direct Sale',
    orderNo: 'ORD-00251',
  },
  {
    id: 'p2',
    invoiceNo: 'INV-00238',
    dateText: '20 Sep 2026 · 3 Items',
    itemsSummary: 'Tomato — 2 KG · Carrot — 1 KG · Beans — 2 KG',
    items: ['Tomato — 2 KG', 'Carrot — 1 KG', 'Beans — 2 KG'],
    amount: '₹650',
    status: 'Paid',
    channel: 'Direct Sale',
    orderNo: 'ORD-00238',
  },
];

export const PURCHASE_KPIS = [
  { label: 'TOTAL PURCHASES', value: '₹8,450' },
  { label: 'PURCHASES', value: '24' },
  { label: 'LAST PURCHASE', value: '24 Sep' },
] as const;

export const DEFAULT_ORDER_FILTERS: OrderFilterState = {
  searchQuery: '',
  orderStatus: 'All',
  orderType: 'All',
  channel: 'All',
  paymentStatus: 'All',
  datePreset: 'All Time',
  startDate: '',
  endDate: '',
  customer: '',
  warehouseId: undefined,
};

export const DEFAULT_PURCHASE_FILTERS: PurchaseFilterState = {
  searchQuery: '',
  datePreset: 'All Time',
  startDate: '',
  endDate: '',
  purchaseStatus: 'All',
  productCrop: '',
  grade: 'All',
  sortBy: 'Newest First',
  warehouseId: undefined,
};
