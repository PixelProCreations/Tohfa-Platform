/**
 * `GET /invoices`, `GET /invoices/{id}` — docs/openapi.yaml `listInvoices`,
 * `getInvoice`; gated by `invoice.view_own` (docs/rbac.json; SUB_WH_ADMIN
 * `own` = invoices of orders placed at its warehouse, BR-30).
 *
 * BR-36: scope is decided by the server from the bearer token. The client
 * never sends a warehouse/owner id here, and the list builds its query from
 * an explicit allow-list so a stray key cannot reach the wire. An id outside
 * scope is 404 `NOT_FOUND` (never 403), which the screens render as
 * not-found.
 *
 * There is NO create/generate endpoint (`invoice.generate` has no path), so
 * this module is read-only.
 *
 * `GET /invoices/{id}/download` is deliberately not wrapped: it answers
 * `application/pdf` bytes or a 302 to a signed link, and the shared JSON
 * client can consume neither (see screens/warehouse/availability.ts
 * `invoiceDownload`).
 *
 * DTOs mirror the OpenAPI schemas exactly (`Invoice`, `InvoiceDetail`).
 * Money fields are wire `Money` strings; convert to paise in the mappers.
 */
import type { Page } from '../../../shell/api/pagination';
import { adminGet } from './http';

export const INVOICE_TYPES = [
  'SALE_RETAIL',
  'SALE_B2B',
  'PURCHASE_FARMER',
  'PAYOUT',
  'SUBSCRIPTION',
] as const;
export type InvoiceTypeDto = (typeof INVOICE_TYPES)[number];

export const INVOICE_STATUSES = ['DRAFT', 'ISSUED', 'CANCELLED', 'CREDIT_NOTED'] as const;
export type InvoiceStatusDto = (typeof INVOICE_STATUSES)[number];

/** Problem codes these endpoints can answer with (docs/openapi.yaml responses). */
export const ERROR_CODES = [
  'VALIDATION_FAILED',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'INTERNAL',
] as const;

/** docs/openapi.yaml `Invoice`. */
export interface InvoiceDto {
  id: string;
  invoiceNumber: string;
  invoiceType: InvoiceTypeDto;
  orderId?: string | null | undefined;
  purchaseOrderId?: string | null | undefined;
  /** `format: date` (YYYY-MM-DD). */
  issueDate: string;
  taxableAmount?: string | undefined;
  totalAmount: string;
  gstApplicable?: boolean | undefined;
  status: InvoiceStatusDto;
  pdfUrl?: string | null | undefined;
}

/** One element of `InvoiceDetail.lines`. */
export interface InvoiceLineDto {
  description?: string | undefined;
  hsnCode?: string | null | undefined;
  /**
   * `Quantity` (kg decimal string) per the spec. SPEC GAP: the server's repo
   * sends `parseFloat(row.qty)`, a JSON number, so both are accepted.
   */
  qty?: string | number | undefined;
  unitPrice?: string | undefined;
  gstRate?: number | undefined;
  taxable?: string | undefined;
  tax?: string | undefined;
  total?: string | undefined;
}

/** docs/openapi.yaml `InvoiceDetail`. */
export interface InvoiceDetailDto extends InvoiceDto {
  placeOfSupply?: string | null | undefined;
  cgst?: string | undefined;
  sgst?: string | undefined;
  igst?: string | undefined;
  gstInclusive?: boolean | undefined;
  lines?: InvoiceLineDto[] | undefined;
}

export interface ListInvoicesParams {
  cursor?: string | undefined;
  /** 1..100, server default 20. */
  limit?: number | undefined;
  type?: InvoiceTypeDto | undefined;
  /** YYYY-MM-DD */
  fromDate?: string | undefined;
  /** YYYY-MM-DD */
  toDate?: string | undefined;
}

export function listInvoices(
  params: ListInvoicesParams,
  signal?: AbortSignal,
): Promise<Page<InvoiceDto>> {
  return adminGet<Page<InvoiceDto>>('/invoices', {
    query: {
      cursor: params.cursor,
      limit: params.limit,
      type: params.type,
      fromDate: params.fromDate,
      toDate: params.toDate,
    },
    signal,
  });
}

export function getInvoice(id: string, signal?: AbortSignal): Promise<InvoiceDetailDto> {
  return adminGet<InvoiceDetailDto>(`/invoices/${encodeURIComponent(id)}`, { signal });
}
