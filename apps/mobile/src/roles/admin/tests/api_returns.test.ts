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
  RETURN_ITEM_CONDITIONS,
  RETURN_STATUSES,
  approveReturn,
  getReturn,
  getReturnHistory,
  inspectReturn,
  listReturns,
  refundReturnToWallet,
  rejectReturn,
  type ReturnRefundResultDto,
  type ReturnRequestDto,
} from '../api/returns';
import * as returnsApi from '../api/returns';

const requestMock = vi.mocked(request);

const openapi = fs.readFileSync(
  path.resolve(__dirname, '../../../../../../docs/openapi.yaml'),
  'utf8',
);

const RETURN_ID = '0a1b2c3d-4e5f-4061-8728-394a5b6c7d8e';
const ORDER_ITEM = '5d6e7f80-9a1b-4c2d-8e3f-4a5b6c7d8e9f';
const KEY = '0b7c1d2e-3f40-4152-8637-48495a6b7c8d';

const detail: ReturnRequestDto = {
  id: RETURN_ID,
  orderId: '1b2c3d4e-5f60-4172-8839-4a5b6c7d8e9f',
  customerId: '6f0c2d1e-1111-4222-8333-944455556666',
  warehouseId: '3f1b7c2e-2a44-4f0e-9b1a-6b0d2f0f1a01',
  status: 'APPROVED',
  reason: 'Leaves wilted',
  note: null,
  createdAt: '2026-10-12T05:30:00.000Z',
  updatedAt: '2026-10-12T07:00:00.000Z',
  items: [
    {
      id: '7e8f9a0b-1c2d-4e3f-8a4b-5c6d7e8f9a0b',
      orderItemId: ORDER_ITEM,
      requestedQty: '1.500',
      acceptedQty: '1.250',
      damagedQty: '0.250',
      condition: 'DAMAGED',
    },
  ],
};

beforeEach(() => {
  requestMock.mockReset();
  requestMock.mockResolvedValue({});
});

describe('api/returns — reads (rma.request.process, BR-30)', () => {
  it('GET /admin/returns sends only status/cursor/limit and never a warehouse id', async () => {
    requestMock.mockResolvedValueOnce({ items: [], page: { nextCursor: null, hasMore: false } });
    await listReturns(
      { status: 'PENDING', cursor: '2026-10-12T05:30:00.000Z', limit: 20, warehouseId: 'x' } as never,
    );
    const [p, opts] = requestMock.mock.calls[0]!;
    expect(opts?.method).toBe('GET');
    const url = new URL(`http://x${p}`);
    expect(url.pathname).toBe('/admin/returns');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      status: 'PENDING',
      cursor: '2026-10-12T05:30:00.000Z',
      limit: '20',
    });
  });

  it('GET /admin/returns with no filter sends no query string', async () => {
    await listReturns({});
    expect(requestMock.mock.calls[0]![0]).toBe('/admin/returns');
  });

  it('GET /admin/returns/{id} and /history are path-encoded GETs', async () => {
    await getReturn('a/b');
    await getReturnHistory('a/b');
    expect(requestMock.mock.calls[0]![0]).toBe('/admin/returns/a%2Fb');
    expect(requestMock.mock.calls[0]![1]?.method).toBe('GET');
    expect(requestMock.mock.calls[1]![0]).toBe('/admin/returns/a%2Fb/history');
    expect(requestMock.mock.calls[1]![1]?.method).toBe('GET');
  });
});

describe('api/returns — state transitions (BR-61)', () => {
  it('BR-61: inspect POSTs the ReturnInspectionCreate allow-list only', async () => {
    await inspectReturn(RETURN_ID, {
      items: [
        {
          orderItemId: ORDER_ITEM,
          condition: 'DAMAGED',
          acceptedQty: '1.250',
          damagedQty: '0.250',
          refundAmount: '999.00',
        } as never,
      ],
      status: 'APPROVED',
    } as never);
    const [p, opts] = requestMock.mock.calls[0]!;
    expect(p).toBe(`/admin/returns/${RETURN_ID}/inspect`);
    expect(opts?.method).toBe('POST');
    expect(opts?.body).toEqual({
      items: [{ orderItemId: ORDER_ITEM, condition: 'DAMAGED', acceptedQty: '1.250', damagedQty: '0.250' }],
    });
  });

  it('BR-61: approve POSTs /approve with no body (the server decides the transition)', async () => {
    await approveReturn(RETURN_ID);
    const [p, opts] = requestMock.mock.calls[0]!;
    expect(p).toBe(`/admin/returns/${RETURN_ID}/approve`);
    expect(opts?.method).toBe('POST');
    expect(opts?.body).toBeUndefined();
  });

  it('BR-61: reject POSTs { reason } only', async () => {
    await rejectReturn(RETURN_ID, { reason: 'Outside the return window', status: 'REJECTED' } as never);
    const [p, opts] = requestMock.mock.calls[0]!;
    expect(p).toBe(`/admin/returns/${RETURN_ID}/reject`);
    expect(opts?.method).toBe('POST');
    expect(opts?.body).toEqual({ reason: 'Outside the return window' });
  });
});

describe('api/returns — wallet refund (money write, BR-61, root CLAUDE.md §2.4)', () => {
  const result: ReturnRefundResultDto = {
    returnRequest: { ...detail, status: 'REFUNDED' },
    walletTransactionId: '9e8d7c6b-5a49-4382-8716-a5b4c3d2e1f0',
    amount: '112.50',
  };

  it('BR-61: POSTs /refund/wallet with the Idempotency-Key header and no body, returning the server result untouched', async () => {
    requestMock.mockResolvedValueOnce(result);
    const out = await refundReturnToWallet(RETURN_ID, KEY);
    const [p, opts] = requestMock.mock.calls[0]!;
    expect(p).toBe(`/admin/returns/${RETURN_ID}/refund/wallet`);
    expect(opts?.method).toBe('POST');
    expect(opts?.idempotencyKey).toBe(KEY);
    expect(opts?.body).toBeUndefined();
    expect(out).toEqual(result);
  });

  it('refuses to send without an Idempotency-Key — nothing reaches the wire', async () => {
    await expect(refundReturnToWallet(RETURN_ID, '')).rejects.toThrow();
    await expect(refundReturnToWallet(RETURN_ID, '  ')).rejects.toThrow();
    expect(requestMock).not.toHaveBeenCalled();
  });

  it('BR-61: an identical retry reuses the Idempotency-Key; another return gets a new one', async () => {
    const cache = createIdempotencyKeyCache();
    const keyFor = (b: unknown): string => cache.keyFor('screen', b);
    await refundReturnToWallet(RETURN_ID, keyFor({ returnId: RETURN_ID }));
    await refundReturnToWallet(RETURN_ID, keyFor({ returnId: RETURN_ID })); // retry after timeout
    const other = '0a1b2c3d-4e5f-4061-8728-000000000000';
    await refundReturnToWallet(other, keyFor({ returnId: other }));
    const keys = requestMock.mock.calls.map((c) => c[1]?.idempotencyKey);
    expect(keys[0]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(keys[1]).toBe(keys[0]);
    expect(keys[2]).not.toBe(keys[0]);
  });

  it('propagates the server error (e.g. 409 INVALID_STATE_TRANSITION) instead of swallowing it', async () => {
    const err = new Error('boom');
    requestMock.mockRejectedValueOnce(err);
    await expect(refundReturnToWallet(RETURN_ID, KEY)).rejects.toBe(err);
  });

  it('BR-61: there is NO bank-refund call — rma.refund.bank_process is none for MW/SW, so no UI path may exist', () => {
    const exported = Object.keys(returnsApi);
    expect(exported.some((name) => /bank/i.test(name))).toBe(false);
  });
});

describe('api/returns — contract mirrors docs/openapi.yaml', () => {
  it('every wrapped path exists in the spec', () => {
    for (const p of [
      '/admin/returns',
      '/admin/returns/{id}',
      '/admin/returns/{id}/history',
      '/admin/returns/{id}/inspect',
      '/admin/returns/{id}/approve',
      '/admin/returns/{id}/reject',
      '/admin/returns/{id}/refund/wallet',
    ]) {
      expect(openapi, p).toContain(`\n  ${p}:`);
    }
  });

  it('ReturnStatus and ReturnItemCondition mirror the spec enums', () => {
    expect(openapi).toMatch(
      new RegExp(`ReturnStatus:\\s+type: string\\s+enum: \\[${RETURN_STATUSES.join(', ')}\\]`),
    );
    expect(openapi).toMatch(
      new RegExp(`ReturnItemCondition:\\s+type: string\\s+enum: \\[${RETURN_ITEM_CONDITIONS.join(', ')}\\]`),
    );
  });

  it('ERROR_CODES lists what the returns endpoints answer with (documented + emitted by returnRequests/wallet services)', () => {
    expect([...ERROR_CODES].sort()).toEqual(
      [
        'FORBIDDEN',
        'IDEMPOTENCY_KEY_REUSED',
        'INTERNAL',
        'INVALID_STATE_TRANSITION',
        'NOT_FOUND',
        'UNAUTHENTICATED',
        'VALIDATION_FAILED',
      ].sort(),
    );
  });
});
