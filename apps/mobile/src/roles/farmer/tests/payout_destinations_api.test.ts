/**
 * The bank account and UPI screens used to show a success message without calling the
 * server. These pin the HTTP contract of the client they now use (docs/openapi.yaml,
 * BR-53): own-data /farmers/me routes, the right verbs and bodies, and no Idempotency-Key
 * (none of these endpoints move money).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setAccessToken } from '../../../shell/api/client';
import {
  createMyBankAccount,
  getMyUpiPreference,
  listMyBankAccounts,
  setMyUpiPreference,
  updateMyBankAccount,
} from '../api/payoutDestinations';

interface Captured {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
}

function captureFetch(respond: () => Response): Captured[] {
  const calls: Captured[] = [];
  global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({
      url: String(input),
      method: init?.method ?? 'GET',
      headers: (init?.headers ?? {}) as Record<string, string>,
      body: typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
    });
    return respond();
  }) as typeof fetch;
  return calls;
}

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': status >= 400 ? 'application/problem+json' : 'application/json' },
  });

const ACCOUNT = {
  id: 'acc-1',
  accountHolderName: 'Murugan R',
  accountNumberLast4: '4821',
  ifsc: 'HDFC0001234',
  bankName: 'HDFC Bank',
  branchName: null,
  upiVpa: null,
  isVerified: false,
  isDefault: true,
  createdAt: '2026-11-01T00:00:00Z',
};

describe('Farmer payout destinations: api client wiring', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setAccessToken('token-farmer');
  });
  afterEach(() => setAccessToken(null));

  it('BR-53: listMyBankAccounts() GETs the own bank-accounts route and returns the array', async () => {
    const calls = captureFetch(() => json([ACCOUNT]));
    const list = await listMyBankAccounts();
    expect(calls[0]?.url).toMatch(/\/farmers\/me\/bank-accounts$/);
    expect(calls[0]?.method).toBe('GET');
    expect(list).toEqual([ACCOUNT]);
  });

  it('BR-53: createMyBankAccount() POSTs the body and sends no Idempotency-Key', async () => {
    const calls = captureFetch(() => json(ACCOUNT, 201));
    const input = {
      accountHolderName: 'Murugan R',
      accountNumber: '123456784821',
      ifsc: 'HDFC0001234',
      bankName: 'HDFC Bank',
    };
    await createMyBankAccount(input);
    expect(calls[0]?.url).toMatch(/\/farmers\/me\/bank-accounts$/);
    expect(calls[0]?.method).toBe('POST');
    expect(calls[0]?.body).toEqual(input);
    expect(calls[0]?.headers['Idempotency-Key']).toBeUndefined();
  });

  it('BR-53: updateMyBankAccount() PATCHes only the given fields to the account id', async () => {
    const calls = captureFetch(() => json(ACCOUNT));
    await updateMyBankAccount('acc-1', { ifsc: 'SBIN0000123' });
    expect(calls[0]?.url).toMatch(/\/farmers\/me\/bank-accounts\/acc-1$/);
    expect(calls[0]?.method).toBe('PATCH');
    expect(calls[0]?.body).toEqual({ ifsc: 'SBIN0000123' });
  });

  it('BR-53: getMyUpiPreference() GETs /farmers/me/upi and rejects on 404', async () => {
    const calls = captureFetch(() =>
      json({ type: 'about:blank', title: 'Not found', status: 404, code: 'NOT_FOUND' }, 404),
    );
    await expect(getMyUpiPreference()).rejects.toMatchObject({ problem: { status: 404 } });
    expect(calls[0]?.url).toMatch(/\/farmers\/me\/upi$/);
    expect(calls[0]?.method).toBe('GET');
  });

  it('BR-53: setMyUpiPreference() PUTs the VPA and omits isDefault when not given', async () => {
    const calls = captureFetch(() =>
      json({ id: 'upi-1', upiVpa: 'a@okhdfcbank', isVerified: false, isDefault: true }),
    );
    await setMyUpiPreference({ upiVpa: 'a@okhdfcbank' });
    expect(calls[0]?.url).toMatch(/\/farmers\/me\/upi$/);
    expect(calls[0]?.method).toBe('PUT');
    expect(calls[0]?.body).toEqual({ upiVpa: 'a@okhdfcbank' });
    expect(calls[0]?.headers['Idempotency-Key']).toBeUndefined();
  });
});
