/**
 * Invoices as the warehouse admin reads them (docs/openapi.yaml tag
 * "Payouts & Invoices"):
 *   GET /invoices                  invoice.view_own (BR-16, BR-30, BR-36)
 *   GET /invoices/summary          invoice.view_own (BR-30, BR-36)
 *   GET /invoices/{id}             invoice.view_own (BR-16, BR-30, BR-36, BR-128)
 *   GET /invoices/{id}/download    invoice.view_own (BR-16, BR-30, BR-36)
 *
 * Scope is the server's: a Sub Warehouse Admin (`own`) sees the invoices of
 * orders placed at its assigned warehouse, the Main Warehouse Admin (`all`)
 * every invoice. The detail and the download answer for exactly the invoices
 * the list returns, and 404 (never 403) for any other id (BR-36). No invoice
 * route takes a warehouseId, so this module never sends one (BR-30).
 *
 * There is NO create-invoice route. An invoice is issued by the sale or the
 * order that needs it; this module exports no write.
 *
 * The download: the PDF route needs the bearer token, and a PDF viewer opened
 * through Linking never sends it. So getInvoiceDownloadUrl asks for
 * `redirect=true` itself, lets fetch follow the 302, and returns the signed
 * URL it landed on (valid 5 minutes, needs no token). The PDF body is dropped
 * unread. Same pattern as the farmer audit report (roles/farmer/api/audits.ts),
 * which the cross-role guard does not let this module import.
 *
 * Money stays as the API's decimal string (`Money`) and a line quantity as the
 * API sends it; the billing mappers turn them into integer paise and grams.
 *
 * No UI imports, so the Main Warehouse admin can reuse this module.
 */
import type { GenericProblemCode, Money, Problem } from '@tohfa/shared-types';
import { ApiError, NetworkError, getAccessToken, refreshAuthTokens, resolveUrl } from '../../../shell/api/client';
import type { Page } from '../../../shell/api/pagination';
import { ADMIN_REQUEST_TIMEOUT_MS, adminGet } from './http';

/** docs/openapi.yaml InvoiceType. */
export type InvoiceType = 'SALE_RETAIL' | 'SALE_B2B' | 'PURCHASE_FARMER' | 'PAYOUT' | 'SUBSCRIPTION';

/** docs/openapi.yaml Invoice.status. */
export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'CANCELLED' | 'CREDIT_NOTED';

/** docs/openapi.yaml Invoice: one row of the list (no customer, farm or warehouse field). */
export interface InvoiceDto {
  id: string;
  invoiceNumber: string;
  invoiceType: InvoiceType;
  orderId?: string | null;
  purchaseOrderId?: string | null;
  /** Sent by the API (invoices.schema.ts InvoiceSummaryResponse); not yet in docs/openapi.yaml Invoice. */
  payoutId?: string | null;
  /** A calendar date, `YYYY-MM-DD`. */
  issueDate: string;
  taxableAmount?: Money;
  totalAmount: Money;
  /** True only for B2B and Horeca (BR-15). */
  gstApplicable?: boolean;
  status: InvoiceStatus;
  pdfUrl?: string | null;
}

/** One line of docs/openapi.yaml InvoiceDetail.lines. */
export interface InvoiceLineDto {
  description: string;
  hsnCode: string | null;
  /**
   * docs/openapi.yaml types this as `Quantity` (a kg string). The server sends
   * `parseFloat(qty)`, a JSON number, today (spec gap); the mapper reads either
   * through its text.
   */
  qty: string | number;
  unitPrice: Money;
  gstRate: number;
  taxable: Money;
  tax: Money;
  total: Money;
}

/** docs/openapi.yaml InvoiceDetail. */
export interface InvoiceDetailDto extends InvoiceDto {
  placeOfSupply?: string | null;
  cgst?: Money;
  sgst?: Money;
  igst?: Money;
  gstInclusive?: boolean;
  /**
   * BR-128: the customer's name, else the walk-in name on the order; null for a
   * farmer-side invoice (purchase or payout). Required by docs/openapi.yaml.
   */
  buyerName: string | null;
  /** BR-128: the customer's GSTIN as stored; null when none, for a walk-in, and farmer-side. */
  buyerGstin: string | null;
  lines: InvoiceLineDto[];
}

/** docs/openapi.yaml InvoiceSummary: counts and paise-summed totals, zero-filled per status and type. */
export interface InvoiceSummaryDto {
  count: number;
  totalAmount: Money;
  byStatus: { status: InvoiceStatus; count: number; totalAmount: Money }[];
  byType: { type: InvoiceType; count: number; totalAmount: Money }[];
}

/** The list's filters without paging (docs/openapi.yaml summarizeInvoices). */
export type InvoiceSummaryParams = Pick<ListInvoicesParams, 'type' | 'fromDate' | 'toDate'>;

export interface ListInvoicesParams {
  cursor?: string | undefined;
  limit?: number | undefined;
  type?: InvoiceType | undefined;
  /** Issue date from, `YYYY-MM-DD`, inclusive. */
  fromDate?: string | undefined;
  /** Issue date to, `YYYY-MM-DD`, inclusive. */
  toDate?: string | undefined;
}

/** Every problem code the three invoice routes document (401, 403, 404, 422 on a bad query, 500). */
export const ERROR_CODES: readonly GenericProblemCode[] = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'VALIDATION_FAILED',
  'INTERNAL',
];

function invoicePath(id: string): string {
  return `/invoices/${encodeURIComponent(id)}`;
}

/** The caller's invoices, newest first. Only the spec's filters are sent (never a warehouse). */
export function listInvoices(params: ListInvoicesParams = {}, signal?: AbortSignal): Promise<Page<InvoiceDto>> {
  return adminGet<Page<InvoiceDto>>(
    '/invoices',
    {
      cursor: params.cursor,
      limit: params.limit,
      type: params.type,
      fromDate: params.fromDate,
      toDate: params.toDate,
    },
    signal,
  );
}

/**
 * KPI counts over exactly the invoices the list returns this caller (BR-30):
 * a scope with none gets zeros, never 403.
 */
export function getInvoiceSummary(params: InvoiceSummaryParams = {}, signal?: AbortSignal): Promise<InvoiceSummaryDto> {
  return adminGet<InvoiceSummaryDto>(
    '/invoices/summary',
    { type: params.type, fromDate: params.fromDate, toDate: params.toDate },
    signal,
  );
}

/**
 * One invoice with its lines; 404 outside the caller's scope (BR-36). `id` is
 * the invoice uuid: the route 422s an invoice number.
 */
export function getInvoice(id: string, signal?: AbortSignal): Promise<InvoiceDetailDto> {
  return adminGet<InvoiceDetailDto>(invoicePath(id), undefined, signal);
}

/**
 * The invoice PDF as a short-lived signed URL the OS can open (see the module
 * docblock). Errors follow the shared client: problem+json -> ApiError (404
 * for an invoice outside the scope, BR-36), transport failure or timeout ->
 * NetworkError. A 401 gets one silent refresh and retry, as request() does.
 */
export async function getInvoiceDownloadUrl(id: string): Promise<string> {
  const requestUrl = resolveUrl(`${invoicePath(id)}/download?redirect=true`);

  const attempt = async (): Promise<Response> => {
    const headers: Record<string, string> = { Accept: 'application/pdf, application/problem+json' };
    const token = getAccessToken();
    if (token !== null) headers['Authorization'] = `Bearer ${token}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ADMIN_REQUEST_TIMEOUT_MS);
    try {
      return await fetch(requestUrl, { method: 'GET', headers, signal: controller.signal });
    } catch (error) {
      throw new NetworkError(error);
    } finally {
      clearTimeout(timer);
    }
  };

  let response = await attempt();
  if (response.status === 401) {
    const refreshed = await refreshAuthTokens();
    if (refreshed !== null) response = await attempt();
  }

  if (!response.ok) throw new ApiError(await readProblem(response));

  const finalUrl = response.url;
  // Only where the redirect landed matters; the PDF bytes are not read.
  void response.body?.cancel().catch(() => undefined);

  if (!finalUrl || finalUrl === requestUrl) {
    // The server answered with the PDF itself instead of a redirect. The app
    // has no viewer for raw bytes, so this is a failure the screen shows,
    // never a link that would open without the token.
    throw new ApiError({ type: 'about:blank', title: 'Invoice link unavailable', status: response.status, code: 'INTERNAL' });
  }
  return finalUrl;
}

async function readProblem(response: Response): Promise<Problem> {
  try {
    const payload: unknown = await response.json();
    if (typeof payload === 'object' && payload !== null && 'code' in payload && 'status' in payload && 'title' in payload) {
      return payload as Problem;
    }
  } catch {
    // Not problem+json: fall through to a generic problem for the status.
  }
  return {
    type: 'about:blank',
    title: 'Request failed',
    status: response.status,
    code: response.status === 404 ? 'NOT_FOUND' : 'INTERNAL',
  };
}
