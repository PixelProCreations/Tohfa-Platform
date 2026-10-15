/**
 * roles/admin/api/transfers.ts: the /warehouse-transfers client (BR-102). The
 * shell client is mocked (same pattern as api_receiving.test.ts), so these
 * tests pin exactly what goes on the wire: paths, query, bodies as kg/Money
 * strings, and the Idempotency-Key on create, approve and receive.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as ClientModule from '../../../shell/api/client';

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return { ...actual, request: vi.fn(async () => ({ items: [], page: 1, pageSize: 20, total: 0 })) };
});

import { request } from '../../../shell/api/client';
import { ADMIN_REQUEST_TIMEOUT_MS } from '../api/http';
import {
  ERROR_CODES,
  approveWarehouseTransfer,
  cancelWarehouseTransfer,
  createWarehouseTransfer,
  getWarehouseTransfer,
  listWarehouseTransfers,
  receiveWarehouseTransfer,
} from '../api/transfers';
import { hasKey } from '../i18n';

const requestMock = vi.mocked(request);
const WH_A = '11111111-1111-4111-8111-111111111111';
const WH_B = '22222222-2222-4222-8222-222222222222';
const TRF = '33333333-3333-4333-8333-333333333333';
const BATCH = '44444444-4444-4444-8444-444444444444';
const ITEM = '55555555-5555-4555-8555-555555555555';

function lastCall() {
  const call = requestMock.mock.calls.at(-1);
  if (call === undefined) throw new Error('no request');
  return { path: call[0], options: call[1] ?? {} };
}

beforeEach(() => requestMock.mockClear());

describe('listWarehouseTransfers', () => {
  it('GETs /warehouse-transfers with no query when no filter is given', async () => {
    await listWarehouseTransfers();
    expect(lastCall().path).toBe('/warehouse-transfers');
    expect(lastCall().options).toMatchObject({ method: 'GET', timeoutMs: ADMIN_REQUEST_TIMEOUT_MS });
  });

  it('BR-30: sends status, warehouseId, direction, page and pageSize', async () => {
    await listWarehouseTransfers({ status: 'IN_TRANSIT', warehouseId: WH_A, direction: 'INBOUND', page: 2, pageSize: 20 });
    expect(lastCall().path).toBe(`/warehouse-transfers?status=IN_TRANSIT&warehouseId=${WH_A}&direction=INBOUND&page=2&pageSize=20`);
  });

  it('drops a direction without a warehouseId (the server answers 422 for it)', async () => {
    await listWarehouseTransfers({ direction: 'OUTBOUND' });
    expect(lastCall().path).toBe('/warehouse-transfers');
  });
});

describe('getWarehouseTransfer', () => {
  it('GETs one transfer by encoded id', async () => {
    await getWarehouseTransfer(TRF);
    expect(lastCall().path).toBe(`/warehouse-transfers/${TRF}`);
    expect(lastCall().options).toMatchObject({ method: 'GET' });
  });
});

describe('writes', () => {
  it('BR-102: create POSTs kg strings with an Idempotency-Key', async () => {
    const body = { fromWarehouseId: WH_A, toWarehouseId: WH_B, lines: [{ batchId: BATCH, qtyKg: '12.500' }], vehicleNumber: 'TN43E1234' };
    await createWarehouseTransfer(body, 'key-create');
    expect(lastCall().path).toBe('/warehouse-transfers');
    expect(lastCall().options).toMatchObject({ method: 'POST', body, idempotencyKey: 'key-create' });
    expect(typeof body.lines[0]?.qtyKg).toBe('string');
  });

  it('BR-102: approve POSTs no body with an Idempotency-Key', async () => {
    await approveWarehouseTransfer(TRF, 'key-approve');
    expect(lastCall().path).toBe(`/warehouse-transfers/${TRF}/approve`);
    expect(lastCall().options).toMatchObject({ method: 'POST', idempotencyKey: 'key-approve' });
    expect(lastCall().options.body).toBeUndefined();
  });

  it('BR-102: receive POSTs every line and the receipt note with an Idempotency-Key', async () => {
    const body = { lines: [{ itemId: ITEM, qtyReceivedKg: '10.000' }], receiptNote: 'Two crates damaged' };
    await receiveWarehouseTransfer(TRF, body, 'key-receive');
    expect(lastCall().path).toBe(`/warehouse-transfers/${TRF}/receive`);
    expect(lastCall().options).toMatchObject({ method: 'POST', body, idempotencyKey: 'key-receive' });
  });

  it('cancel POSTs the reason (the spec asks no Idempotency-Key)', async () => {
    await cancelWarehouseTransfer(TRF, { reason: 'Stock needed here' });
    expect(lastCall().path).toBe(`/warehouse-transfers/${TRF}/cancel`);
    expect(lastCall().options).toMatchObject({ method: 'POST', body: { reason: 'Stock needed here' } });
    expect(lastCall().options.idempotencyKey).toBeUndefined();
  });
});

describe('ERROR_CODES', () => {
  it('every documented problem code has an admin-facing string', () => {
    for (const code of ERROR_CODES) expect({ code, has: hasKey(`admin.error.${code}`) }).toEqual({ code, has: true });
  });
});
