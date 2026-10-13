/**
 * roles/admin/api/invoices.ts: the invoice list, the invoice detail and the
 * PDF download (docs/openapi.yaml tag "Payouts & Invoices"). The shell client
 * is mocked (same pattern as roles/farmer/tests/admin_auth_api.test.ts), so
 * these tests pin exactly what goes on the wire.
 *
 * BR-36 / BR-30: the server scopes every invoice route to the caller
 * (`invoice.view_own`; a Sub Warehouse Admin sees invoices of orders placed at
 * its own warehouse). No invoice route takes a warehouseId, so the module never
 * sends one, whatever a caller passes, and an invoice outside the scope is 404
 * on the detail AND the download (never 403, never PDF bytes).
 *
 * There is no create-invoice route: an invoice is issued by the sale or order
 * that needs it. The module exports no write at all.
 *
 * The download needs the bearer token, which a PDF viewer opened by Linking
 * would never send, so the module asks for `redirect=true` itself and hands
 * back the short-lived signed URL the 302 landed on (same pattern as the
 * farmer audit report, roles/farmer/api/audits.ts).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as ClientModule from '../../../shell/api/client';

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return {
    ...actual,
    request: vi.fn(async () => ({ items: [], page: { nextCursor: null, hasMore: false } })),
    getAccessToken: vi.fn(() => 'token-sub-coonoor'),
    refreshAuthTokens: vi.fn(async () => null),
  };
});

import { ApiError, NetworkError, getAccessToken, refreshAuthTokens, request } from '../../../shell/api/client';
import { adminErrorKey } from '../api/errors';
import { ADMIN_REQUEST_TIMEOUT_MS } from '../api/http';
import * as invoicesApi from '../api/invoices';
import { ERROR_CODES, getInvoice, getInvoiceDownloadUrl, listInvoices } from '../api/invoices';
import { hasKey } from '../i18n';

const requestMock = vi.mocked(request);
const tokenMock = vi.mocked(getAccessToken);
const refreshMock = vi.mocked(refreshAuthTokens);

const INVOICE = '22222222-2222-4222-8222-222222222222';
const FOREIGN_WH = '99999999-9999-4999-8999-999999999999';
const GET = { method: 'GET', timeoutMs: ADMIN_REQUEST_TIMEOUT_MS };
const SIGNED = `http://localhost:3000/v1/invoices/${INVOICE}/download?token=abc&expires=1760000000000`;

const realFetch = global.fetch;

beforeEach(() => {
  vi.clearAllMocks();
  tokenMock.mockReturnValue('token-sub-coonoor');
  refreshMock.mockResolvedValue(null);
});

afterEach(() => {
  global.fetch = realFetch;
});

function lastCall(): [string, Record<string, unknown>] {
  const call = requestMock.mock.calls.at(-1);
  if (call === undefined) throw new Error('request() was not called');
  return [call[0], call[1] as Record<string, unknown>];
}

/** A fetch Response whose `url` is where the (followed) redirect landed. */
function landedOn(url: string, status = 200, body = '%PDF-1.4'): Response {
  const res = new Response(body, { status, headers: { 'Content-Type': 'application/pdf' } });
  Object.defineProperty(res, 'url', { value: url });
  return res;
}

function problemResponse(code: string, status: number, url: string): Response {
  const res = new Response(JSON.stringify({ type: 'about:blank', title: code, status, code }), {
    status,
    headers: { 'Content-Type': 'application/problem+json' },
  });
  Object.defineProperty(res, 'url', { value: url });
  return res;
}

describe('listInvoices', () => {
  it('GETs /invoices with no query by default', async () => {
    await listInvoices();
    expect(requestMock).toHaveBeenCalledWith('/invoices', GET);
  });

  it('sends cursor, limit, type, fromDate and toDate, in that order', async () => {
    await listInvoices({ cursor: 'c-1', limit: 20, type: 'SALE_RETAIL', fromDate: '2026-10-01', toDate: '2026-10-13' });
    expect(lastCall()[0]).toBe('/invoices?cursor=c-1&limit=20&type=SALE_RETAIL&fromDate=2026-10-01&toDate=2026-10-13');
  });

  it('BR-30: never sends a warehouseId, even when a caller passes one', async () => {
    await listInvoices({ type: 'SALE_B2B', warehouseId: FOREIGN_WH } as unknown as Parameters<typeof listInvoices>[0]);
    expect(lastCall()[0]).toBe('/invoices?type=SALE_B2B');
    expect(lastCall()[0]).not.toContain('warehouseId');
  });

  it('BR-36: sends no status, search or customer filter the spec does not define', async () => {
    const leaky = { status: 'ISSUED', q: 'Ravi', customerId: FOREIGN_WH, cursor: 'c-2' } as unknown as Parameters<typeof listInvoices>[0];
    await listInvoices(leaky);
    expect(lastCall()[0]).toBe('/invoices?cursor=c-2');
  });

  it('passes the caller signal through', async () => {
    const controller = new AbortController();
    await listInvoices({}, controller.signal);
    expect(lastCall()[1]['signal']).toBe(controller.signal);
  });
});

describe('getInvoice', () => {
  it('GETs /invoices/{id}, encoded as one path segment', async () => {
    await getInvoice(INVOICE);
    expect(requestMock).toHaveBeenCalledWith(`/invoices/${INVOICE}`, GET);
    await getInvoice('a/b?c');
    expect(lastCall()[0]).toBe('/invoices/a%2Fb%3Fc');
  });

  it('BR-36: an invoice outside the caller scope surfaces as not found (404, never 403)', async () => {
    requestMock.mockRejectedValueOnce(
      new ApiError({ type: 'about:blank', title: 'Not Found', status: 404, code: 'NOT_FOUND' }),
    );
    const error = await getInvoice(INVOICE).catch((e: unknown) => e);
    expect(adminErrorKey(error)).toBe('admin.error.NOT_FOUND');
  });
});

describe('getInvoiceDownloadUrl', () => {
  it('BR-36: asks for redirect=true with the bearer token and returns the signed URL the 302 landed on', async () => {
    let requested = '';
    let headers: Record<string, string> = {};
    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      requested = String(input);
      headers = (init?.headers ?? {}) as Record<string, string>;
      return landedOn(SIGNED);
    }) as typeof fetch;

    await expect(getInvoiceDownloadUrl(INVOICE)).resolves.toBe(SIGNED);
    expect(requested).toBe(`http://localhost:3000/v1/invoices/${INVOICE}/download?redirect=true`);
    expect(headers['Authorization']).toBe('Bearer token-sub-coonoor');
    expect(init(global.fetch).method).toBe('GET');
  });

  it('encodes the id as one path segment', async () => {
    let requested = '';
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      requested = String(input);
      return landedOn(SIGNED);
    }) as typeof fetch;
    await getInvoiceDownloadUrl('a/b?c');
    expect(requested).toBe('http://localhost:3000/v1/invoices/a%2Fb%3Fc/download?redirect=true');
  });

  it("BR-36: another warehouse's invoice PDF is 404 (ApiError NOT_FOUND), never a link", async () => {
    global.fetch = vi.fn(async (input: RequestInfo | URL) => problemResponse('NOT_FOUND', 404, String(input))) as typeof fetch;
    const error = await getInvoiceDownloadUrl(INVOICE).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(adminErrorKey(error)).toBe('admin.error.NOT_FOUND');
  });

  it('refreshes the token once on a 401 and retries with the new one', async () => {
    refreshMock.mockResolvedValueOnce('token-refreshed');
    const seen: string[] = [];
    global.fetch = vi.fn(async (input: RequestInfo | URL, request?: RequestInit) => {
      const auth = ((request?.headers ?? {}) as Record<string, string>)['Authorization'] ?? '';
      seen.push(auth);
      if (seen.length === 1) return problemResponse('UNAUTHENTICATED', 401, String(input));
      return landedOn(SIGNED);
    }) as typeof fetch;
    tokenMock.mockReturnValueOnce('token-sub-coonoor').mockReturnValueOnce('token-refreshed');

    await expect(getInvoiceDownloadUrl(INVOICE)).resolves.toBe(SIGNED);
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(seen).toEqual(['Bearer token-sub-coonoor', 'Bearer token-refreshed']);
  });

  it('fails loudly (never a fake link) when the server streamed the PDF instead of redirecting', async () => {
    global.fetch = vi.fn(async (input: RequestInfo | URL) => landedOn(String(input))) as typeof fetch;
    await expect(getInvoiceDownloadUrl(INVOICE)).rejects.toBeInstanceOf(ApiError);
  });

  it('a transport failure is a NetworkError the screen can offer a retry for', async () => {
    global.fetch = vi.fn(async () => {
      throw new TypeError('Network request failed');
    }) as typeof fetch;
    const error = await getInvoiceDownloadUrl(INVOICE).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(NetworkError);
    expect(adminErrorKey(error)).toBe('admin.error.network');
  });
});

describe('the invoices module issues no invoice', () => {
  it('exports no create, generate, issue, cancel or credit-note function (invoices are issued by sales and orders)', () => {
    const names = Object.keys(invoicesApi).filter((name) => typeof (invoicesApi as Record<string, unknown>)[name] === 'function');
    expect(names.filter((name) => /create|generate|issue|cancel|credit|post|update|delete/i.test(name))).toEqual([]);
  });

  it('every request() it makes is a GET', async () => {
    requestMock.mockClear();
    await listInvoices();
    await getInvoice(INVOICE);
    expect(requestMock.mock.calls.map((call) => (call[1] as { method?: string }).method)).toEqual(['GET', 'GET']);
  });
});

describe('ERROR_CODES', () => {
  it('lists the codes the invoice routes document, each with an admin message', () => {
    expect([...ERROR_CODES].sort()).toEqual(['FORBIDDEN', 'INTERNAL', 'NOT_FOUND', 'UNAUTHENTICATED', 'VALIDATION_FAILED'].sort());
    for (const code of ERROR_CODES) expect({ code, hasKey: hasKey(`admin.error.${code}`) }).toEqual({ code, hasKey: true });
  });
});

/** The RequestInit of the last fetch call. */
function init(fetchFn: typeof fetch): RequestInit {
  const calls = vi.mocked(fetchFn).mock.calls;
  return (calls.at(-1)?.[1] ?? {}) as RequestInit;
}
