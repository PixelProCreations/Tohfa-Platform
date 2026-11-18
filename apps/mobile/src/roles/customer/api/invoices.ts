/**
 * Customer invoices (docs/openapi.yaml tag "Payouts & Invoices"):
 *   GET /invoices?type&cursor&limit&fromDate&toDate (own SALE invoices),
 *   GET /invoices/{id} (InvoiceDetail with lines),
 *   GET /invoices/{id}/download[?redirect=true] (PDF, or 302 to a 5-minute signed URL).
 *
 * The JSON client cannot hand a PDF to the OS, so download asks for the
 * redirect with the bearer token and reads the FINAL url of the followed
 * redirect (`Response.url`): that signed link needs no token and is opened
 * with Linking.openURL by the caller.
 */
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { Money, Problem } from '@tohfa/shared-types';
import { ApiError, api, getAccessToken, resolveUrl } from '../../../shell/api/client';
import { buildQueryString, nextPageParam, type Page } from '../../../shell/api/pagination';
import type { Quantity } from '../utils/money';

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'CANCELLED' | 'CREDIT_NOTED';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceType: string;
  orderId?: string | null;
  issueDate: string;
  taxableAmount?: Money;
  totalAmount: Money;
  /** True only for B2B/Horeca (BR-15); false for retail. */
  gstApplicable?: boolean;
  status: InvoiceStatus;
  pdfUrl?: string | null;
}

export interface InvoiceLine {
  description?: string;
  hsnCode?: string | null;
  qty?: Quantity;
  unitPrice?: Money;
  gstRate?: number;
  taxable?: Money;
  tax?: Money;
  total?: Money;
}

export interface InvoiceDetail extends Invoice {
  buyerName: string | null;
  buyerGstin: string | null;
  placeOfSupply?: string | null;
  cgst?: Money;
  sgst?: Money;
  igst?: Money;
  gstInclusive?: boolean;
  lines?: InvoiceLine[];
}

export interface InvoiceFilters {
  type?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
}

export const invoiceQueryKeys = {
  all: ['invoices'] as const,
  list: (f: InvoiceFilters) => ['invoices', 'list', f] as const,
  detail: (id: string) => ['invoices', 'detail', id] as const,
};

export function fetchInvoice(id: string, signal?: AbortSignal): Promise<InvoiceDetail> {
  return api.get<InvoiceDetail>(`/invoices/${encodeURIComponent(id)}`, signal);
}

export function fetchInvoices(f: InvoiceFilters, cursor?: string, signal?: AbortSignal): Promise<Page<Invoice>> {
  return api.get<Page<Invoice>>(
    `/invoices${buildQueryString({ cursor, limit: f.limit, type: f.type, fromDate: f.fromDate, toDate: f.toDate })}`,
    signal,
  );
}

export const useInvoice = (id: string | null | undefined) =>
  useQuery({
    queryKey: invoiceQueryKeys.detail(id ?? ''),
    queryFn: ({ signal }) => fetchInvoice(id as string, signal),
    enabled: !!id && !!getAccessToken(),
  });

export const useInvoices = (filters: InvoiceFilters = {}) =>
  useInfiniteQuery({
    queryKey: invoiceQueryKeys.list(filters),
    queryFn: ({ pageParam, signal }) => fetchInvoices(filters, pageParam, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: Page<Invoice>) => nextPageParam(last),
    enabled: !!getAccessToken(),
  });

type FetchLike = (input: string, init?: { headers?: Record<string, string>; signal?: AbortSignal }) => Promise<{
  ok: boolean;
  status: number;
  url: string;
  json: () => Promise<unknown>;
}>;

/**
 * Resolves the short-lived signed PDF link of an invoice (valid ~5 minutes).
 * Throws ApiError (404 not found / not ready, 401, 403) like the JSON client.
 */
export async function getInvoiceDownloadUrl(
  id: string,
  fetchImpl: FetchLike = fetch as unknown as FetchLike,
  signal?: AbortSignal,
): Promise<string> {
  const token = getAccessToken();
  const url = resolveUrl(`/invoices/${encodeURIComponent(id)}/download?redirect=true`);
  const res = await fetchImpl(url, {
    headers: { Accept: 'application/pdf', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(signal ? { signal } : {}),
  });
  if (!res.ok) {
    let problem: Problem | null = null;
    try {
      problem = (await res.json()) as Problem;
    } catch {
      problem = null;
    }
    throw new ApiError(
      problem && typeof problem === 'object' && 'code' in problem
        ? problem
        : ({ type: 'about:blank', title: 'Invoice download failed', status: res.status, code: res.status === 404 ? 'NOT_FOUND' : 'INTERNAL' } as unknown as Problem),
    );
  }
  // A followed 302 leaves the signed link in `res.url`; an inline 200 leaves the request url.
  return res.url && res.url !== url ? res.url : url;
}
