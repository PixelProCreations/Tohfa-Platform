import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type * as ClientModule from '../../../shell/api/client';

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return { ...actual, request: vi.fn() };
});

import { request } from '../../../shell/api/client';
import { createIdempotencyKeyCache } from '../../../shell/api/idempotency';
import {
  ERROR_CODES,
  WALLET_TRANSACTION_TYPES,
  processCashTopup,
  type CashTopupBody,
  type WalletTransactionDto,
} from '../api/wallet';

const requestMock = vi.mocked(request);

const openapi = fs.readFileSync(
  path.resolve(__dirname, '../../../../../../docs/openapi.yaml'),
  'utf8',
);

const CUSTOMER = '6f0c2d1e-1111-4222-8333-944455556666';
const WAREHOUSE = '3f1b7c2e-2a44-4f0e-9b1a-6b0d2f0f1a01';
const KEY = '0b7c1d2e-3f40-4152-8637-48495a6b7c8d';

const body: CashTopupBody = {
  amount: '5000.00' as CashTopupBody['amount'],
  warehouseId: WAREHOUSE,
  fiscalCashTag: 'COON-2026-10-13-0001',
};

const txn: WalletTransactionDto = {
  id: '9e8d7c6b-5a49-4382-8716-a5b4c3d2e1f0',
  walletId: '1a2b3c4d-5e6f-4708-8192-a3b4c5d6e7f8',
  txnType: 'TOPUP_CASH',
  amount: '5000.00',
  balanceAfter: '6250.50',
  refType: 'TOPUP',
  refId: '2b3c4d5e-6f70-4812-8934-5a6b7c8d9e0f',
  fiscalCashTag: 'COON-2026-10-13-0001',
  warehouseId: WAREHOUSE,
  performedBy: '7f6e5d4c-3b2a-4190-8f7e-6d5c4b3a2918',
  performedAt: '2026-10-13T10:15:00.000Z',
  remarks: null,
};

beforeEach(() => {
  requestMock.mockReset();
  requestMock.mockResolvedValue(txn);
});

describe('api/wallet — POST /admin/wallets/{customerId}/cash-topup', () => {
  it('BR-18: POSTs exactly /admin/wallets/{customerId}/cash-topup with the CashTopupCreate body and the Idempotency-Key', async () => {
    const result = await processCashTopup(CUSTOMER, body, KEY);
    expect(requestMock).toHaveBeenCalledTimes(1);
    const [p, opts] = requestMock.mock.calls[0]!;
    expect(p).toBe(`/admin/wallets/${CUSTOMER}/cash-topup`);
    expect(opts?.method).toBe('POST');
    expect(opts?.body).toEqual({
      amount: '5000.00',
      warehouseId: WAREHOUSE,
      fiscalCashTag: 'COON-2026-10-13-0001',
    });
    expect(opts?.idempotencyKey).toBe(KEY);
    // The server's ledger row is returned untouched: the screen shows ITS id.
    expect(result).toEqual(txn);
  });

  it('sends remarks only when given, and never a key outside CashTopupCreate even if smuggled', async () => {
    await processCashTopup(
      CUSTOMER,
      { ...body, remarks: 'Counter 2', customerId: 'x', balance: '99999.00', status: 'SUCCESS' } as never,
      KEY,
    );
    expect(requestMock.mock.calls[0]![1]?.body).toEqual({
      amount: '5000.00',
      warehouseId: WAREHOUSE,
      fiscalCashTag: 'COON-2026-10-13-0001',
      remarks: 'Counter 2',
    });
  });

  it('BR-30: the warehouse comes from the caller (scope), the customer id is path-encoded', async () => {
    await processCashTopup('a/b?c', body, KEY);
    expect(requestMock.mock.calls[0]![0]).toBe('/admin/wallets/a%2Fb%3Fc/cash-topup');
  });

  it('refuses to send without an Idempotency-Key (money-moving, root CLAUDE.md §2.4) — nothing reaches the wire', async () => {
    await expect(processCashTopup(CUSTOMER, body, '')).rejects.toThrow();
    await expect(processCashTopup(CUSTOMER, body, '   ')).rejects.toThrow();
    expect(requestMock).not.toHaveBeenCalled();
  });

  it('an identical retry reuses the Idempotency-Key; a changed body gets a new one', async () => {
    // The screens derive the key exactly this way (useIdempotencyKey wraps this cache).
    const cache = createIdempotencyKeyCache();
    const keyFor = (b: unknown): string => cache.keyFor('screen', b);

    const first = { customerId: CUSTOMER, ...body };
    await processCashTopup(CUSTOMER, body, keyFor(first));
    await processCashTopup(CUSTOMER, body, keyFor({ ...first })); // retry after timeout
    const changed = { ...body, amount: '5001.00' as CashTopupBody['amount'] };
    await processCashTopup(CUSTOMER, changed, keyFor({ customerId: CUSTOMER, ...changed }));
    const otherCustomer = '6f0c2d1e-1111-4222-8333-000000000000';
    await processCashTopup(otherCustomer, body, keyFor({ customerId: otherCustomer, ...body }));

    const keys = requestMock.mock.calls.map((c) => c[1]?.idempotencyKey);
    expect(keys[0]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(keys[1]).toBe(keys[0]);
    expect(keys[2]).not.toBe(keys[0]);
    expect(keys[3]).not.toBe(keys[2]);
    expect(keys[3]).not.toBe(keys[0]);
  });

  it('propagates the server error (e.g. 422 CASH_LIMIT_EXCEEDED) instead of swallowing it', async () => {
    const err = new Error('boom');
    requestMock.mockRejectedValueOnce(err);
    await expect(processCashTopup(CUSTOMER, body, KEY)).rejects.toBe(err);
  });
});

describe('api/wallet — contract mirrors docs/openapi.yaml', () => {
  it('the path and request schema exist in the spec', () => {
    expect(openapi).toContain('\n  /admin/wallets/{customerId}/cash-topup:');
    expect(openapi).toMatch(/CashTopupCreate:\s+type: object\s+required: \[amount, warehouseId, fiscalCashTag\]/);
  });

  it('WalletTransactionType mirrors the spec enum', () => {
    expect(openapi).toContain(
      `enum: [${WALLET_TRANSACTION_TYPES.join(', ')}]`,
    );
  });

  it('ERROR_CODES lists what the cash top-up endpoint answers with (documented + emitted by apps/api topup.service)', () => {
    expect([...ERROR_CODES].sort()).toEqual(
      [
        'CASH_LIMIT_EXCEEDED',
        'CONFLICT',
        'FISCAL_TAG_REQUIRED',
        'FORBIDDEN',
        'IDEMPOTENCY_KEY_REUSED',
        'INTERNAL',
        'NOT_FOUND',
        'UNAUTHENTICATED',
        'VALIDATION_FAILED',
        'WAREHOUSE_SCOPE_VIOLATION',
      ].sort(),
    );
  });
});
