/**
 * Shared types for the warehouse billing & invoice screens.
 *
 * SubWarehouseGenerateInvoiceScreen and SubWarehouseInvoiceWizardScreen each
 * declared their own `TransactionRecord` with different shapes, and the
 * dashboard barrel re-exported both with `export *`, so the name clashed
 * (TS2308). Each shape now has its own name here. The shapes are unchanged.
 */

/** One completed sale on the Generate Invoice picker list. */
export interface InvoiceTransactionRecord {
  id: string;
  customerName: string;
  amount: string;
  status: 'Completed' | 'Invoice Exists';
  saleType: string;
}

/** The sale the invoice wizard is generating an invoice for. */
export interface WizardTransactionRecord {
  id: string;
  orderNumber: string;
  customerName: string;
  amount: string;
  saleType: string;
  status: string;
  date: string;
}
