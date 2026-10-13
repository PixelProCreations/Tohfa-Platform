import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../shell/api/client')>();
  return { ...actual, request: vi.fn() };
});

import { ApiError, request } from '../../../shell/api/client';
import { adminErrorKey } from '../api/errors';
import {
  ERROR_CODES,
  INVOICE_STATUSES,
  INVOICE_TYPES,
  getInvoice,
  listInvoices,
} from '../api/invoices';

const requestMock = vi.mocked(request);
const ID = '7d1f3c2a-1111-4222-8333-944455556666';

beforeEach(() => {
  requestMock.mockReset();
  requestMock.mockResolvedValue({ items: [], page: { nextCursor: null, hasMore: false } });
});

describe('api/invoices', () => {
  it('listInvoices GETs /invoices with only the OpenAPI query params', async () => {
    await listInvoices({ cursor: 'c-1', limit: 20, type: 'SALE_RETAIL', fromDate: '2026-10-01' });
    const [path, opts] = requestMock.mock.calls[0]!;
    expect(path).toBe('/invoices?cursor=c-1&limit=20&type=SALE_RETAIL&fromDate=2026-10-01');
    expect(opts?.method).toBe('GET');
    expect(opts?.idempotencyKey).toBeUndefined();
  });

  it('listInvoices omits unset filters and passes the cursor back verbatim', async () => {
    await listInvoices({ cursor: 'opaque/+=cursor' });
    expect(requestMock.mock.calls[0]![0]).toBe('/invoices?cursor=opaque%2F%2B%3Dcursor');
    await listInvoices({});
    expect(requestMock.mock.calls[1]![0]).toBe('/invoices');
  });

  it('BR-36: the list never sends an owner or warehouse override — scope is server-derived', async () => {
    // Even if a caller smuggles extra keys in, only the documented params go out.
    const params = { type: 'SALE_RETAIL', warehouseId: 'w-other', customerId: 'c-other' } as never;
    await listInvoices(params);
    const path = requestMock.mock.calls[0]![0];
    expect(path).toBe('/invoices?type=SALE_RETAIL');
    expect(path).not.toContain('warehouseId');
    expect(path).not.toContain('customerId');
  });

  it('BR-36: getInvoice GETs exactly /invoices/{id} with no query string', async () => {
    requestMock.mockResolvedValue({ id: ID });
    await getInvoice(ID);
    const [path, opts] = requestMock.mock.calls[0]!;
    expect(path).toBe(`/invoices/${ID}`);
    expect(opts?.method).toBe('GET');
    expect(opts?.signal).toBeInstanceOf(AbortSignal);
  });

  it('getInvoice encodes the id so it cannot change the path', async () => {
    requestMock.mockResolvedValue({});
    await getInvoice('a/../b');
    expect(requestMock.mock.calls[0]![0]).toBe('/invoices/a%2F..%2Fb');
  });

  it('BR-36: an invoice outside scope is a 404 and renders as not-found, not forbidden', async () => {
    requestMock.mockRejectedValue(
      new ApiError({ type: 'about:blank', title: 'Not Found', status: 404, code: 'NOT_FOUND' } as never),
    );
    const error = await getInvoice(ID).catch((e: unknown) => e);
    expect(adminErrorKey(error)).toBe('admin.errors.NOT_FOUND');
  });

  it('exports the enums from docs/openapi.yaml and the error codes these endpoints return', () => {
    expect([...INVOICE_STATUSES]).toEqual(['DRAFT', 'ISSUED', 'CANCELLED', 'CREDIT_NOTED']);
    expect([...INVOICE_TYPES]).toEqual([
      'SALE_RETAIL',
      'SALE_B2B',
      'PURCHASE_FARMER',
      'PAYOUT',
      'SUBSCRIPTION',
    ]);
    expect([...ERROR_CODES].sort()).toEqual(
      ['FORBIDDEN', 'INTERNAL', 'NOT_FOUND', 'UNAUTHENTICATED', 'VALIDATION_FAILED'].sort(),
    );
  });
});
