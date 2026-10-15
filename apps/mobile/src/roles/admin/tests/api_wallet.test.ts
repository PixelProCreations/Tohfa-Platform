/**
 * roles/admin/api/wallet.ts: the warehouse cash top-up and the counter
 * customer lookup (docs/openapi.yaml operations createCashTopup and
 * lookupCashTopupCustomer). The shell client is mocked (same pattern as
 * api_orders.test.ts), so these tests pin exactly what goes on the wire.
 *
 * BR-18 / BR-19: the top-up body is the CashTopupCreate allow-list (amount as
 * the openapi Money decimal string, warehouseId, fiscalCashTag, optional
 * remarks); nothing else a caller holds can ride along. Root CLAUDE.md 2.4:
 * the top-up moves money, so it never leaves without an Idempotency-Key.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Money } from '@tohfa/shared-types';
import type * as ClientModule from '../../../shell/api/client';

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return {
    ...actual,
    request: vi.fn(async () => ({ items: [] })),
  };
});

import { request } from '../../../shell/api/client';
import { ADMIN_REQUEST_TIMEOUT_MS } from '../api/http';
import {
  ERROR_CODES,
  MissingIdempotencyKeyError,
  createCashTopup,
  lookupCustomers,
  type CashTopupCreate,
} from '../api/wallet';
import { hasKey } from '../i18n';

const requestMock = vi.mocked(request);

const WAREHOUSE = '11111111-1111-4111-8111-111111111111';
const CUSTOMER = '22222222-2222-4222-8222-222222222222';
const KEY = '33333333-3333-4333-8333-333333333333';

function body(over: Partial<CashTopupCreate> = {}): CashTopupCreate {
  return { amount: '5000.00' as Money, warehouseId: WAREHOUSE, fiscalCashTag: 'OOTY-2026-0042', ...over };
}

beforeEach(() => {
  requestMock.mockClear();
});

describe('createCashTopup: POST /admin/wallets/{customerId}/cash-topup', () => {
  it('BR-18: posts the exact CashTopupCreate body with the Idempotency-Key and the admin timeout', async () => {
    await createCashTopup(CUSTOMER, body(), KEY);
    expect(requestMock).toHaveBeenCalledTimes(1);
    const [path, options] = requestMock.mock.calls[0] ?? [];
    expect(path).toBe(`/admin/wallets/${CUSTOMER}/cash-topup`);
    expect(options).toEqual({
      method: 'POST',
      body: { amount: '5000.00', warehouseId: WAREHOUSE, fiscalCashTag: 'OOTY-2026-0042' },
      idempotencyKey: KEY,
      timeoutMs: ADMIN_REQUEST_TIMEOUT_MS,
    });
  });

  it('BR-19: the amount goes on the wire as the exact paise decimal string, never a number', async () => {
    await createCashTopup(CUSTOMER, body({ amount: '10000.00' as Money }), KEY);
    const sent = (requestMock.mock.calls[0]?.[1] as { body: { amount: unknown } }).body.amount;
    expect(sent).toBe('10000.00');
    expect(typeof sent).toBe('string');
  });

  it('sends remarks only when given', async () => {
    await createCashTopup(CUSTOMER, body({ remarks: 'Counter 2' }), KEY);
    expect((requestMock.mock.calls[0]?.[1] as { body: unknown }).body).toEqual({
      amount: '5000.00',
      warehouseId: WAREHOUSE,
      fiscalCashTag: 'OOTY-2026-0042',
      remarks: 'Counter 2',
    });
  });

  it('is an allow-list: a stray key on the caller object never reaches the wire', async () => {
    const withExtra = { ...body(), customerId: CUSTOMER, balance: '99.00', farmerId: 'x' } as unknown as CashTopupCreate;
    await createCashTopup(CUSTOMER, withExtra, KEY);
    expect(Object.keys((requestMock.mock.calls[0]?.[1] as { body: object }).body).sort()).toEqual([
      'amount',
      'fiscalCashTag',
      'warehouseId',
    ]);
  });

  it('encodes the customer id into the path', async () => {
    await createCashTopup('a/b', body(), KEY);
    expect(requestMock.mock.calls[0]?.[0]).toBe('/admin/wallets/a%2Fb/cash-topup');
  });

  it('refuses to send without an Idempotency-Key (root CLAUDE.md 2.4)', async () => {
    await expect(createCashTopup(CUSTOMER, body(), '')).rejects.toBeInstanceOf(MissingIdempotencyKeyError);
    await expect(createCashTopup(CUSTOMER, body(), '   ')).rejects.toBeInstanceOf(MissingIdempotencyKeyError);
    expect(requestMock).not.toHaveBeenCalled();
  });
});

describe('lookupCustomers: GET /admin/wallets/cash-topup/customers/lookup (BR-91i)', () => {
  it('BR-91i: sends exactly one of mobile / code to the cash top-up lookup, as given', async () => {
    await lookupCustomers({ mobile: '9876543210' });
    await lookupCustomers({ code: 'CUS-00291' });
    expect(requestMock.mock.calls.map((c) => c[0])).toEqual([
      '/admin/wallets/cash-topup/customers/lookup?mobile=9876543210',
      '/admin/wallets/cash-topup/customers/lookup?code=CUS-00291',
    ]);
    for (const call of requestMock.mock.calls) expect(call[1]).toMatchObject({ method: 'GET' });
  });

  it('never calls the sales counter lookup (sales.sale.create, which MAIN_WH_ADMIN does not hold)', async () => {
    await lookupCustomers({ mobile: '9876543210' });
    expect(String(requestMock.mock.calls[0]?.[0])).not.toMatch(/\/admin\/sales\//);
  });

  it('sends no q (422 on this lookup) and nothing else the caller object carries', async () => {
    await lookupCustomers({ code: 'CUS-1', q: 'ravi', warehouseId: 'x' } as unknown as { code: string });
    expect(requestMock.mock.calls[0]?.[0]).toBe('/admin/wallets/cash-topup/customers/lookup?code=CUS-1');
  });

  it('sends no warehouseId: the server scopes the caller itself', async () => {
    await lookupCustomers({ code: 'CUS-1' });
    expect(String(requestMock.mock.calls[0]?.[0])).not.toMatch(/warehouse/i);
  });

  it('returns the items the server sent', async () => {
    requestMock.mockResolvedValueOnce({
      items: [{ customerId: CUSTOMER, customerCode: 'CUS-1', name: 'Ravi', mobileMasked: '******3210', walletBalance: '450.00' }],
    });
    const res = await lookupCustomers({ code: 'CUS-1' });
    expect(res.items).toHaveLength(1);
  });
});

describe('ERROR_CODES', () => {
  it('lists the codes the top-up and lookup answer with, and each has an admin message', () => {
    for (const code of ['CASH_LIMIT_EXCEEDED', 'FISCAL_TAG_REQUIRED', 'CONFLICT', 'NOT_FOUND', 'WAREHOUSE_SCOPE_VIOLATION']) {
      expect(ERROR_CODES).toContain(code);
    }
    for (const code of ERROR_CODES) {
      expect({ code, known: hasKey(`admin.error.${code}`) }).toEqual({ code, known: true });
    }
  });
});
