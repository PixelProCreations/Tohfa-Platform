/**
 * roles/admin/api/stockAdjustments.ts (BR-37) and stockVerifications.ts
 * (BR-107). The shell client is mocked (same pattern as api_transfers.test.ts),
 * so these tests pin exactly what goes on the wire: paths, query, bodies as kg
 * strings, and the Idempotency-Key on every write that needs one.
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
  ERROR_CODES as ADJUSTMENT_ERROR_CODES,
  approveStockAdjustment,
  createStockAdjustment,
  getStockAdjustment,
  listStockAdjustments,
  rejectStockAdjustment,
} from '../api/stockAdjustments';
import {
  ERROR_CODES as VERIFICATION_ERROR_CODES,
  createStockVerification,
  getStockVerification,
  listStockVerifications,
  raiseVerificationAdjustment,
} from '../api/stockVerifications';
import { hasKey } from '../i18n';

const requestMock = vi.mocked(request);
const WH = '11111111-1111-4111-8111-111111111111';
const BATCH = '22222222-2222-4222-8222-222222222222';
const ADJ = '33333333-3333-4333-8333-333333333333';
const VER = '44444444-4444-4444-8444-444444444444';

function lastCall() {
  const call = requestMock.mock.calls.at(-1);
  if (call === undefined) throw new Error('no request');
  return { path: call[0], options: call[1] ?? {} };
}

beforeEach(() => requestMock.mockClear());

describe('stock adjustments client (BR-37)', () => {
  it('lists with no query when no filter is given', async () => {
    await listStockAdjustments();
    expect(lastCall().path).toBe('/admin/stock-adjustments');
    expect(lastCall().options).toMatchObject({ method: 'GET', timeoutMs: ADMIN_REQUEST_TIMEOUT_MS });
  });

  it('BR-30: sends status, warehouseId, batchId, adjustmentType, page and pageSize', async () => {
    await listStockAdjustments({ status: 'PENDING', warehouseId: WH, batchId: BATCH, adjustmentType: 'DAMAGE', page: 2, pageSize: 20 });
    expect(lastCall().path).toBe(
      `/admin/stock-adjustments?status=PENDING&warehouseId=${WH}&batchId=${BATCH}&adjustmentType=DAMAGE&page=2&pageSize=20`,
    );
  });

  it('GETs one adjustment by id', async () => {
    await getStockAdjustment(ADJ);
    expect(lastCall().path).toBe(`/admin/stock-adjustments/${ADJ}`);
  });

  it('BR-37: creates with a signed kg string and an Idempotency-Key', async () => {
    const body = { batchId: BATCH, adjustmentType: 'DAMAGE' as const, qtyDeltaKg: '-5.000', reason: 'Crushed crates' };
    await createStockAdjustment(body, 'key-1');
    expect(lastCall().path).toBe('/admin/stock-adjustments');
    expect(lastCall().options).toMatchObject({ method: 'POST', body, idempotencyKey: 'key-1' });
  });

  it('BR-37b: approves with no body and an Idempotency-Key', async () => {
    await approveStockAdjustment(ADJ, 'key-2');
    expect(lastCall().path).toBe(`/admin/stock-adjustments/${ADJ}/approve`);
    expect(lastCall().options).toMatchObject({ method: 'POST', idempotencyKey: 'key-2' });
    expect(lastCall().options.body).toBeUndefined();
  });

  it('rejects with a reason and no Idempotency-Key (moves no stock)', async () => {
    await rejectStockAdjustment(ADJ, { reason: 'Recount first' });
    expect(lastCall().path).toBe(`/admin/stock-adjustments/${ADJ}/reject`);
    expect(lastCall().options).toMatchObject({ method: 'POST', body: { reason: 'Recount first' } });
    expect(lastCall().options).not.toHaveProperty('idempotencyKey');
  });

  it('every documented error code has an admin message', () => {
    for (const code of ADJUSTMENT_ERROR_CODES) expect({ code, has: hasKey(`admin.error.${code}`) }).toEqual({ code, has: true });
  });
});

describe('stock verifications client (BR-107)', () => {
  it('lists counts with hasVariance sent as the string the server enum expects', async () => {
    await listStockVerifications({ warehouseId: WH, hasVariance: true, page: 1, pageSize: 20 });
    expect(lastCall().path).toBe(`/admin/stock-verifications?warehouseId=${WH}&hasVariance=true&page=1&pageSize=20`);
    await listStockVerifications({ hasVariance: false });
    expect(lastCall().path).toBe('/admin/stock-verifications?hasVariance=false');
    await listStockVerifications();
    expect(lastCall().path).toBe('/admin/stock-verifications');
  });

  it('GETs one count by id', async () => {
    await getStockVerification(VER);
    expect(lastCall().path).toBe(`/admin/stock-verifications/${VER}`);
  });

  it('BR-107: records only the counted kg (the server snapshots the system quantity), with an Idempotency-Key', async () => {
    await createStockVerification({ batchId: BATCH, countedQtyKg: '95.000' }, 'key-3');
    expect(lastCall().path).toBe('/admin/stock-verifications');
    expect(lastCall().options).toMatchObject({ method: 'POST', body: { batchId: BATCH, countedQtyKg: '95.000' }, idempotencyKey: 'key-3' });
    expect(lastCall().options.body).not.toHaveProperty('systemQtyKg');
  });

  it('BR-107: raises the adjustment for a count with an Idempotency-Key', async () => {
    await raiseVerificationAdjustment(VER, {}, 'key-4');
    expect(lastCall().path).toBe(`/admin/stock-verifications/${VER}/adjustment`);
    expect(lastCall().options).toMatchObject({ method: 'POST', body: {}, idempotencyKey: 'key-4' });
  });

  it('every documented error code has an admin message', () => {
    for (const code of VERIFICATION_ERROR_CODES) expect({ code, has: hasKey(`admin.error.${code}`) }).toEqual({ code, has: true });
  });
});
