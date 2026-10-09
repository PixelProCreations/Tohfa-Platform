/**
 * Mock data for the warehouse billing & invoice screens until the invoice
 * endpoints exist in docs/openapi.yaml (SPEC_GAPS W4g). Rows carry the seeded
 * warehouse ids (db/seed/001_reference.sql) so a Sub scope can be filtered to
 * its own warehouse and the Main selector has something to select.
 */
import type {
  InvoiceDetailRecord,
  InvoiceFilterState,
  InvoiceRecord,
  InvoiceTransactionRecord,
  WarehouseScope,
  WizardTransactionRecord,
} from './types';

/**
 * The four seeded warehouses. Main's invoice grants (`invoice.view_own` /
 * `invoice.generate` = all) cover every one of them (owner decision
 * 2026-10-09). There is no warehouse directory endpoint yet (SPEC_GAPS W4c-1).
 */
export const BILLING_WAREHOUSES: readonly WarehouseScope[] = [
  { warehouseId: 'WH-OOTY', warehouseName: 'Ooty Warehouse' },
  { warehouseId: 'WH-COON', warehouseName: 'Coonoor Warehouse' },
  { warehouseId: 'WH-KOTA', warehouseName: 'Kotagiri Warehouse' },
  { warehouseId: 'WH-GUDA', warehouseName: 'Gudalur Market Warehouse' },
];

export const DEFAULT_INVOICE_FILTERS: InvoiceFilterState = {
  searchQuery: '',
  status: 'All',
  invoiceType: 'All',
  datePreset: 'All Time',
  startDate: '',
  endDate: '',
  customer: '',
  orderId: '',
  minAmount: '',
  maxAmount: '',
  sortBy: 'Newest First',
  warehouseId: undefined,
};

export const INITIAL_INVOICES: readonly InvoiceRecord[] = [
  {
    id: 'INV-2026-001245',
    orderNumber: 'ORD-002154',
    customerName: 'Ravi Kumar',
    saleType: 'Retail Sale',
    amount: '₹2,450',
    date: '25 Sep 2026',
    time: '10:42 AM',
    status: 'Generated',
    warehouseId: 'WH-COON',
  },
  {
    id: 'INV-2026-001244',
    orderNumber: 'ORD-002151',
    customerName: 'Anitha',
    saleType: 'Market Sale',
    amount: '₹1,200',
    date: '25 Sep 2026',
    time: '10:10 AM',
    status: 'Generated',
    warehouseId: 'WH-COON',
  },
  {
    id: 'INV-2026-001242',
    orderNumber: 'ORD-2026-00982',
    customerName: 'Arun Kumar',
    saleType: 'Retail Sale',
    amount: '₹2,100',
    date: '25 Sep 2026',
    time: '9:30 AM',
    status: 'Generated',
    warehouseId: 'WH-OOTY',
  },
  {
    id: 'INV-2026-001240',
    orderNumber: 'ORD-002140',
    customerName: 'Ganesh K.',
    saleType: 'Retail Sale',
    amount: '₹640',
    date: '24 Sep 2026',
    time: '4:20 PM',
    status: 'Pending',
    warehouseId: 'WH-COON',
  },
  {
    id: 'INV-2026-001238',
    orderNumber: 'ORD-002133',
    customerName: 'Priya Stores',
    saleType: 'B2B Sale',
    amount: '₹1,100',
    date: '24 Sep 2026',
    time: '2:05 PM',
    status: 'Cancelled',
    warehouseId: 'WH-KOTA',
  },
];

/** Completed sales eligible for an invoice (Generate Invoice picker). */
export const INITIAL_INVOICE_TRANSACTIONS: readonly InvoiceTransactionRecord[] = [
  {
    id: 'ORD-002154',
    customerName: 'Ravi Kumar',
    amount: '₹2,450',
    status: 'Completed',
    saleType: 'Retail Sale',
    warehouseId: 'WH-COON',
  },
  {
    id: 'ORD-002150',
    customerName: 'Priya Stores',
    amount: '₹1,100',
    status: 'Invoice Exists',
    saleType: 'B2B Sale',
    warehouseId: 'WH-COON',
  },
  {
    id: 'ORD-2026-00982',
    customerName: 'Arun Kumar',
    amount: '₹2,100',
    status: 'Completed',
    saleType: 'Online Order',
    warehouseId: 'WH-OOTY',
  },
];

/** The sale the "Invoice Required" card and a deep link to the wizard fall back to. */
export const SAMPLE_WIZARD_TRANSACTION: WizardTransactionRecord = {
  id: 'ORD-002154',
  orderNumber: 'ORD-002154',
  customerName: 'Ravi Kumar',
  amount: '₹2,450',
  saleType: 'Direct Sale',
  status: 'Completed',
  date: '24 Sep 2026',
};

/** The sale on the hub's "Invoice Required" card. */
export const INVOICE_REQUIRED_TRANSACTION: WizardTransactionRecord & { warehouseId: string } = {
  id: 'ORD-002178',
  orderNumber: 'ORD-002178',
  customerName: 'Ravi Kumar',
  amount: '₹1,850',
  saleType: 'Retail Sale',
  status: 'Completed',
  date: '25 Sep 2026',
  warehouseId: 'WH-COON',
};

/** Invoice number the mock generate call "returns" (the server assigns it, never the client). */
export const SAMPLE_GENERATED_INVOICE_ID = 'INV-2026-001245';

/** Detail of one invoice; the screen overrides `invoiceId` with the one opened. */
export const SAMPLE_INVOICE_DETAIL: InvoiceDetailRecord = {
  invoiceId: 'INV-2026-001245',
  orderNumber: 'ORD-002154',
  date: '25 Sep 2026',
  salesChannel: 'Direct Sale',
  invoiceType: 'Retail Sale',
  status: 'Generated',
  warehouseId: 'WH-COON',
  warehouseName: 'Coonoor Warehouse',
  customerName: 'Ravi Kumar',
  customerId: 'CUS-001245',
  customerPhone: '+91 XXXXX XXXXX',
  items: [
    { name: 'Tomato', grade: 'Grade 1', unit: 'KG', quantity: '5 KG', unitPrice: '₹100', lineTotal: '₹500' },
    { name: 'Carrot', grade: 'Grade 1', unit: 'KG', quantity: '3 KG', unitPrice: '₹80', lineTotal: '₹240' },
  ],
  subtotal: '₹740',
  discount: '₹0',
  gst: '₹0',
  total: '₹740',
  paymentStatus: 'Paid',
  paymentMethod: 'Wallet',
  generatedBy: 'SWA – Suresh',
  generatedAt: '25 Sep 2026, 10:42 AM',
  linkedAt: '25 Sep 2026, 10:42 AM',
  downloadAvailable: true,
};
