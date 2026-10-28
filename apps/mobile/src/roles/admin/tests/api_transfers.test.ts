/**
 * roles/admin/api/transfers.ts: one transfer with its lines and the receive
 * write (docs/openapi.yaml getWarehouseTransfer, receiveWarehouseTransfer;
 * BR-30, BR-102). The shell client is mocked (same pattern as
 * api_receiving.test.ts), so these tests pin exactly what goes on the wire:
 * the path, the body as kg strings, and the Idempotency-Key on the receive
 * (root CLAUDE.md 2.4: a stock-moving write is replay-safe).
 *
 * The list stays in api/warehouseTransfers.ts, which is read-only on purpose
 * (its own test asserts it exports no write helper).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as ClientModule from '../../../shell/api/client';

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return { ...actual, request: vi.fn(async () => ({})) };
});

import { request } from '../../../shell/api/client';
import { ADMIN_REQUEST_TIMEOUT_MS } from '../api/http';
import { ERROR_CODES, getWarehouseTransfer, receiveWarehouseTransfer } from '../api/transfers';
import { hasKey } from '../i18n';

const requestMock = vi.mocked(request);
const TRF = '33333333-3333-4333-8333-333333333333';
const ITEM_A = '55555555-5555-4555-8555-555555555555';
const ITEM_B = '66666666-6666-4666-8666-666666666666';

function lastCall() {
  const call = requestMock.mock.calls.at(-1);
  if (call === undefined) throw new Error('request() was not called');
  return { path: call[0], options: (call[1] ?? {}) as Record<string, unknown> };
}

beforeEach(() => requestMock.mockClear());

describe('getWarehouseTransfer (BR-30, BR-102)', () => {
  it('GETs /warehouse-transfers/{id} with the request timeout and no query', async () => {
    await getWarehouseTransfer(TRF);
    expect(lastCall().path).toBe(`/warehouse-transfers/${TRF}`);
    expect(lastCall().options).toMatchObject({ method: 'GET', timeoutMs: ADMIN_REQUEST_TIMEOUT_MS });
  });

  it('encodes the id, so a stray value can never reach another path', async () => {
    await getWarehouseTransfer('a/b');
    expect(lastCall().path).toBe('/warehouse-transfers/a%2Fb');
  });

  it('passes the caller signal through', async () => {
    const controller = new AbortController();
    await getWarehouseTransfer(TRF, controller.signal);
    expect(lastCall().options['signal']).toBe(controller.signal);
  });

  it('returns the transfer the server sends untouched (lines included)', async () => {
    const dto = { id: TRF, lines: [{ id: ITEM_A, qtySentKg: '200.000' }] };
    requestMock.mockResolvedValueOnce(dto);
    await expect(getWarehouseTransfer(TRF)).resolves.toBe(dto);
  });
});

describe('receiveWarehouseTransfer (BR-102)', () => {
  it('POSTs every line as kg strings and the receipt note, with the Idempotency-Key', async () => {
    const body = {
      lines: [
        { itemId: ITEM_A, qtyReceivedKg: '195.000' },
        { itemId: ITEM_B, qtyReceivedKg: '50.000' },
      ],
      receiptNote: 'Five kg short on arrival',
    };
    await receiveWarehouseTransfer(TRF, body, 'key-receive');
    expect(lastCall().path).toBe(`/warehouse-transfers/${TRF}/receive`);
    expect(lastCall().options).toMatchObject({
      method: 'POST',
      body,
      idempotencyKey: 'key-receive',
      timeoutMs: ADMIN_REQUEST_TIMEOUT_MS,
    });
  });

  it('sends a full receipt without a note (the note is only required when short)', async () => {
    const body = { lines: [{ itemId: ITEM_A, qtyReceivedKg: '200.000' }] };
    await receiveWarehouseTransfer(TRF, body, 'key-full');
    expect(lastCall().options['body']).toEqual({ lines: [{ itemId: ITEM_A, qtyReceivedKg: '200.000' }] });
  });
});

describe('ERROR_CODES', () => {
  it('lists the problems the two routes document, receive refusals included', () => {
    expect(ERROR_CODES).toEqual(
      expect.arrayContaining(['NOT_FOUND', 'INVALID_STATE_TRANSITION', 'IDEMPOTENCY_KEY_REUSED', 'WAREHOUSE_SCOPE_VIOLATION']),
    );
  });

  it('every documented problem code has an admin-facing string', () => {
    for (const code of ERROR_CODES) expect({ code, has: hasKey(`admin.error.${code}`) }).toEqual({ code, has: true });
  });
});
