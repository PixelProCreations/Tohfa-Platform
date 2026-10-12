/**
 * roles/admin/api/customers.ts: the warehouse admin's read-only view of a
 * customer (docs/openapi.yaml tag Customers) and the one write it has, the
 * support-ticket reply. The shell client is mocked (same pattern as
 * roles/farmer/tests/admin_auth_api.test.ts), so these tests pin exactly what
 * goes on the wire.
 *
 * BR-30 / BR-91: no customers route takes a warehouseId. The server confines an
 * `own` actor to the customers visible at its warehouse and returns 404 for any
 * other id; the list query is strict, so a warehouseId would be a 422. The
 * module therefore never sends one, whatever a caller passes.
 * BR-93: the wallet under /admin/customers is GET-only; the module exports no
 * wallet write, and none of its reads uses another method.
 * BR-97: a reply sends the reply body only (`message`, and `attachmentUrl`
 * when given), with no Idempotency-Key: the spec defines none for this route.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as ClientModule from '../../../shell/api/client';

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return {
    ...actual,
    request: vi.fn(async () => ({ items: [], page: { nextCursor: null, hasMore: false } })),
  };
});

import { request } from '../../../shell/api/client';
import * as customersApi from '../api/customers';
import {
  ERROR_CODES,
  getCustomer,
  getCustomerSupportTicket,
  getCustomerWallet,
  getCustomerWalletTxn,
  listCustomerIssues,
  listCustomerOrders,
  listCustomerPurchases,
  listCustomerSupportTickets,
  listCustomerWalletTxns,
  listCustomers,
  replyToSupportTicket,
} from '../api/customers';
import { ADMIN_REQUEST_TIMEOUT_MS } from '../api/http';
import { hasKey } from '../i18n';

const requestMock = vi.mocked(request);

const CUSTOMER = '55555555-5555-4555-8555-555555555555';
const TXN = '66666666-6666-4666-8666-666666666666';
const TICKET = '77777777-7777-4777-8777-777777777777';
const FOREIGN_WH = '99999999-9999-4999-8999-999999999999';
const GET = { method: 'GET', timeoutMs: ADMIN_REQUEST_TIMEOUT_MS };

beforeEach(() => {
  vi.clearAllMocks();
});

function lastCall(): [string, Record<string, unknown>] {
  const call = requestMock.mock.calls.at(-1);
  if (call === undefined) throw new Error('request() was not called');
  return [call[0], call[1] as Record<string, unknown>];
}

describe('listCustomers', () => {
  it('GETs /admin/customers with no query by default', async () => {
    await listCustomers();
    expect(requestMock).toHaveBeenCalledWith('/admin/customers', GET);
  });

  it('sends q, status, cursor and limit, in that order', async () => {
    await listCustomers({ q: 'Ravi', status: 'ACTIVE', cursor: 'c-1', limit: 50 });
    expect(lastCall()[0]).toBe('/admin/customers?q=Ravi&status=ACTIVE&cursor=c-1&limit=50');
  });

  it('encodes q as one query value', async () => {
    await listCustomers({ q: 'CUS-00 1&x=y' });
    expect(lastCall()[0]).toBe('/admin/customers?q=CUS-00%201%26x%3Dy');
  });

  it('BR-30: never sends a warehouseId, even when a caller passes one', async () => {
    await listCustomers({ q: 'Ravi', warehouseId: FOREIGN_WH } as unknown as Parameters<typeof listCustomers>[0]);
    expect(lastCall()[0]).toBe('/admin/customers?q=Ravi');
    expect(lastCall()[0]).not.toContain('warehouseId');
  });

  it('passes the caller signal through', async () => {
    const controller = new AbortController();
    await listCustomers({}, controller.signal);
    expect(lastCall()[1]['signal']).toBe(controller.signal);
  });
});

describe('customer reads', () => {
  it('GETs /admin/customers/{id}, encoded as one path segment', async () => {
    await getCustomer(CUSTOMER);
    expect(requestMock).toHaveBeenCalledWith(`/admin/customers/${CUSTOMER}`, GET);
    await getCustomer('a/b?c');
    expect(lastCall()[0]).toBe('/admin/customers/a%2Fb%3Fc');
  });

  it('GETs the paged sub-resources with cursor and limit only', async () => {
    const page = { cursor: 'c-2', limit: 10 };
    await listCustomerPurchases(CUSTOMER, page);
    expect(lastCall()[0]).toBe(`/admin/customers/${CUSTOMER}/purchases?cursor=c-2&limit=10`);
    await listCustomerOrders(CUSTOMER, page);
    expect(lastCall()[0]).toBe(`/admin/customers/${CUSTOMER}/orders?cursor=c-2&limit=10`);
    await listCustomerWalletTxns(CUSTOMER, page);
    expect(lastCall()[0]).toBe(`/admin/customers/${CUSTOMER}/wallet/transactions?cursor=c-2&limit=10`);
    await listCustomerIssues(CUSTOMER, page);
    expect(lastCall()[0]).toBe(`/admin/customers/${CUSTOMER}/issues?cursor=c-2&limit=10`);
    await listCustomerSupportTickets(CUSTOMER, page);
    expect(lastCall()[0]).toBe(`/admin/customers/${CUSTOMER}/support-tickets?cursor=c-2&limit=10`);
  });

  it('sends no query on a sub-resource by default', async () => {
    await listCustomerOrders(CUSTOMER);
    expect(requestMock).toHaveBeenCalledWith(`/admin/customers/${CUSTOMER}/orders`, GET);
  });

  it('BR-30: a sub-resource never sends a warehouseId either', async () => {
    const leaky = { cursor: 'c-3', warehouseId: FOREIGN_WH } as unknown as { cursor: string };
    for (const list of [listCustomerPurchases, listCustomerOrders, listCustomerWalletTxns, listCustomerIssues, listCustomerSupportTickets]) {
      await list(CUSTOMER, leaky);
      expect(lastCall()[0]).not.toContain('warehouseId');
      expect(lastCall()[0].endsWith('?cursor=c-3')).toBe(true);
    }
  });

  it('GETs the wallet summary and one wallet transaction', async () => {
    await getCustomerWallet(CUSTOMER);
    expect(requestMock).toHaveBeenCalledWith(`/admin/customers/${CUSTOMER}/wallet`, GET);
    await getCustomerWalletTxn(CUSTOMER, TXN);
    expect(requestMock).toHaveBeenCalledWith(`/admin/customers/${CUSTOMER}/wallet/transactions/${TXN}`, GET);
  });

  it('GETs one support ticket thread', async () => {
    await getCustomerSupportTicket(CUSTOMER, TICKET);
    expect(requestMock).toHaveBeenCalledWith(`/admin/customers/${CUSTOMER}/support-tickets/${TICKET}`, GET);
  });
});

describe('replyToSupportTicket (BR-97)', () => {
  it('POSTs {message} to .../support-tickets/{ticketId}/replies with no Idempotency-Key', async () => {
    await replyToSupportTicket(CUSTOMER, TICKET, { message: 'We have refunded the tomatoes.' });
    expect(requestMock).toHaveBeenCalledWith(`/admin/customers/${CUSTOMER}/support-tickets/${TICKET}/replies`, {
      method: 'POST',
      body: { message: 'We have refunded the tomatoes.' },
      timeoutMs: ADMIN_REQUEST_TIMEOUT_MS,
    });
    expect(lastCall()[1]).not.toHaveProperty('idempotencyKey');
  });

  it('BR-97: sends only the reply body, whatever else the caller passes', async () => {
    const leaky = {
      message: 'Sorry for the delay.',
      customerId: CUSTOMER,
      farmerId: '88888888-8888-4888-8888-888888888888',
      farmName: 'Green Acres Estate',
      isInternal: true,
    } as unknown as { message: string };
    await replyToSupportTicket(CUSTOMER, TICKET, leaky);
    expect(lastCall()[1]['body']).toEqual({ message: 'Sorry for the delay.' });
  });

  it('sends attachmentUrl only when one is given', async () => {
    await replyToSupportTicket(CUSTOMER, TICKET, { message: 'See photo.', attachmentUrl: 'support/abc.jpg' });
    expect(lastCall()[1]['body']).toEqual({ message: 'See photo.', attachmentUrl: 'support/abc.jpg' });
  });
});

describe('BR-93: the customers module moves no money', () => {
  it('exports no wallet write (no top-up, credit, debit or adjustment function)', () => {
    const names = Object.keys(customersApi).filter((name) => typeof (customersApi as Record<string, unknown>)[name] === 'function');
    expect(names.filter((name) => /topup|top_up|credit|debit|adjust|refund|transfer|payout/i.test(name))).toEqual([]);
  });

  it('every export except the ticket reply is a GET', async () => {
    const fns = customersApi as unknown as Record<string, unknown>;
    const writes: string[] = [];
    for (const [name, fn] of Object.entries(fns)) {
      if (typeof fn !== 'function') continue;
      requestMock.mockClear();
      await (fn as (...args: unknown[]) => Promise<unknown>)(CUSTOMER, TXN, { message: 'x' });
      for (const call of requestMock.mock.calls) {
        const method = (call[1] as { method?: string } | undefined)?.method;
        if (method !== 'GET') writes.push(`${name}:${String(method)}:${call[0]}`);
      }
    }
    expect(writes).toEqual([`replyToSupportTicket:POST:/admin/customers/${CUSTOMER}/support-tickets/${TXN}/replies`]);
  });
});

describe('ERROR_CODES', () => {
  it('lists the codes the customers routes document, each with an admin message', () => {
    expect([...ERROR_CODES].sort()).toEqual(
      ['CONFLICT', 'FORBIDDEN', 'INTERNAL', 'NOT_FOUND', 'UNAUTHENTICATED', 'VALIDATION_FAILED'].sort(),
    );
    for (const code of ERROR_CODES) expect({ code, hasKey: hasKey(`admin.error.${code}`) }).toEqual({ code, hasKey: true });
  });
});
