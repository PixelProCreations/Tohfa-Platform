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
  minAmount: '',
  maxAmount: '',
  sortBy: 'Newest First',
  warehouseId: undefined,
};

export const INITIAL_INVOICES: readonly InvoiceRecord[] = [
  {
    id: 'inv-uuid-001245',
    invoiceNumber: 'INV-2026-001245',
    invoiceType: 'SALE_RETAIL',
    saleType: 'Retail Sale',
    orderId: 'ORD-002154',
    customerName: '',
    amount: '₹2,450',
    amountPaise: 245000,
    issueDate: '2026-09-25',
    date: '25 Sep 2026',
    status: 'Generated',
    statusLabel: 'Issued',
    warehouseId: 'WH-COON',
  },
  {
    id: 'inv-uuid-001244',
    invoiceNumber: 'INV-2026-001244',
    invoiceType: 'SALE_RETAIL',
    saleType: 'Retail Sale',
    orderId: 'ORD-002151',
    customerName: '',
    amount: '₹1,200',
    amountPaise: 120000,
    issueDate: '2026-09-25',
    date: '25 Sep 2026',
    status: 'Generated',
    statusLabel: 'Issued',
    warehouseId: 'WH-COON',
  },
  {
    id: 'inv-uuid-001242',
    invoiceNumber: 'INV-2026-001242',
    invoiceType: 'SALE_RETAIL',
    saleType: 'Retail Sale',
    orderId: 'ORD-2026-00982',
    customerName: '',
    amount: '₹2,100',
    amountPaise: 210000,
    issueDate: '2026-09-25',
    date: '25 Sep 2026',
    status: 'Generated',
    statusLabel: 'Issued',
    warehouseId: 'WH-OOTY',
  },
  {
    id: 'inv-uuid-001240',
    invoiceNumber: 'INV-2026-001240',
    invoiceType: 'SALE_RETAIL',
    saleType: 'Retail Sale',
    orderId: 'ORD-002140',
    customerName: '',
    amount: '₹640',
    amountPaise: 64000,
    issueDate: '2026-09-24',
    date: '24 Sep 2026',
    status: 'Pending',
    statusLabel: 'Draft',
    warehouseId: 'WH-COON',
  },
  {
    id: 'inv-uuid-001238',
    invoiceNumber: 'INV-2026-001238',
    invoiceType: 'SALE_B2B',
    saleType: 'B2B Sale',
    orderId: 'ORD-002133',
    customerName: '',
    amount: '₹1,100',
    amountPaise: 110000,
    issueDate: '2026-09-24',
    date: '24 Sep 2026',
    status: 'Cancelled',
    statusLabel: 'Cancelled',
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

/** Detail of one invoice used as a fallback until the invoice API is wired. */
export const SAMPLE_INVOICE_DETAIL: InvoiceDetailRecord = {
  id: 'inv-uuid-001245',
  invoiceNumber: 'INV-2026-001245',
  invoiceType: 'SALE_RETAIL',
  typeLabel: 'Retail Sale',
  date: '25 Sep 2026',
  status: 'Generated',
  statusLabel: 'Issued',
  orderId: 'ORD-002154',
  // BR-128: no buyer name on a retail walk-in invoice (null from API → undefined here)
  buyerName: undefined,
  buyerGstin: undefined,
  customerName: '',
  items: [
    { name: 'Tomato', hsn: 'HSN 0702', quantity: '5.000', unitPrice: '₹100', lineTotal: '₹500' },
    { name: 'Carrot', hsn: 'HSN 0706', quantity: '3.000', unitPrice: '₹80', lineTotal: '₹240' },
  ],
  taxable: '₹740',
  cgst: '—',
  sgst: '—',
  igst: '—',
  gst: '₹0',
  total: '₹740',
  downloadAvailable: true,
};
