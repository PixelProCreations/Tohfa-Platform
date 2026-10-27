import { z } from 'zod';
import type { InvoiceType, InvoiceStatus, Money } from '@tohfa/shared-types';

export const listInvoicesQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(['SALE_RETAIL', 'SALE_B2B', 'PURCHASE_FARMER', 'PAYOUT', 'SUBSCRIPTION']).optional(),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
});
export type ListInvoicesQuery = z.infer<typeof listInvoicesQuery>;

/**
 * GET /v1/invoices/summary: the list's filters, without paging (openapi `summarizeInvoices`). The
 * same fields and formats as `listInvoicesQuery`, so a screen can pass one filter set to both.
 */
export const invoiceSummaryQuery = listInvoicesQuery.pick({ type: true, fromDate: true, toDate: true });
export type InvoiceSummaryQuery = z.infer<typeof invoiceSummaryQuery>;

export const invoiceStatuses = ['DRAFT', 'ISSUED', 'CANCELLED', 'CREDIT_NOTED'] as const;
export const invoiceTypes = ['SALE_RETAIL', 'SALE_B2B', 'PURCHASE_FARMER', 'PAYOUT', 'SUBSCRIPTION'] as const;

const summaryMoney = z.string().regex(/^[0-9]{1,14}\.[0-9]{2}$/);
const summaryCount = z.number().int().min(0);

/** openapi `InvoiceSummary`. Strict: the tests parse every response with it. */
export const invoiceSummaryResponse = z
  .object({
    count: summaryCount,
    totalAmount: summaryMoney,
    byStatus: z.array(z.object({ status: z.enum(invoiceStatuses), count: summaryCount, totalAmount: summaryMoney }).strict()),
    byType: z.array(z.object({ type: z.enum(invoiceTypes), count: summaryCount, totalAmount: summaryMoney }).strict()),
  })
  .strict();
export type InvoiceSummary = z.infer<typeof invoiceSummaryResponse>;

export const invoiceIdParams = z.object({
  id: z.string().uuid(),
});
export type InvoiceIdParams = z.infer<typeof invoiceIdParams>;

export const downloadInvoiceQuery = z.object({
  redirect: z
    .union([z.boolean(), z.enum(['true', 'false'])])
    .transform((val) => val === true || val === 'true')
    .default(false),
  token: z.string().optional(),
  expires: z.coerce.number().int().optional(),
});
export type DownloadInvoiceQuery = z.infer<typeof downloadInvoiceQuery>;

export interface InvoiceLineItem {
  id?: string;
  lineNo: number;
  description: string;
  hsnCode: string | null;
  qty: number;
  unitPrice: Money;
  gstRate: number;
  taxable: Money;
  tax: Money;
  total: Money;
}

export interface InvoiceSummaryResponse {
  id: string;
  invoiceNumber: string;
  invoiceType: InvoiceType;
  orderId: string | null;
  purchaseOrderId: string | null;
  payoutId?: string | null;
  issueDate: string;
  taxableAmount: Money;
  totalAmount: Money;
  gstApplicable: boolean;
  status: InvoiceStatus;
  pdfUrl: string | null;
}

export interface InvoiceDetailResponse extends InvoiceSummaryResponse {
  placeOfSupply: string | null;
  cgst: Money;
  sgst: Money;
  igst: Money;
  gstInclusive: boolean;
  lines: InvoiceLineItem[];
}

/**
 * GET /invoices/{id} (openapi `InvoiceDetail`, BR-128): the detail plus the buyer. `invoices` has
 * no buyer snapshot column, so both are read live when the detail is served (UNCONFIRMED): the
 * invoice's customer (`users.full_name`, `customers.gstin`), else the walk-in name on its order;
 * null for an invoice with no buyer here (a farmer purchase or payout invoice). Only `findById`
 * builds this; `createInvoice` keeps returning `InvoiceDetailResponse`.
 */
export interface InvoiceDetailView extends InvoiceDetailResponse {
  buyerName: string | null;
  buyerGstin: string | null;
}
