/**
 * roles/admin/api/inventory.ts: batches, the append-only stock ledger and the
 * channel allocations (docs/openapi.yaml /admin/batches, /admin/stock-ledger,
 * /admin/allocations). The shell client is mocked (same pattern as
 * roles/farmer/tests/admin_auth_api.test.ts), so these tests pin exactly what
 * goes on the wire.
 *
 * BR-30: the functions send a warehouseId only when the caller passes one, and
 * the screens pass inventoryWarehouseFilter(scope, selected), which pins a Sub
 * scope to its own warehouse whatever was selected.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../shell/api/client', () => ({
  request: vi.fn(async () => ({ items: [], page: { nextCursor: null, hasMore: false } })),
}));

import { request } from '../../../shell/api/client';
import { ADMIN_REQUEST_TIMEOUT_MS } from '../api/http';
import { ERROR_CODES, getBatch, listAllocations, listBatches, listStockLedger } from '../api/inventory';
import { inventoryWarehouseFilter } from '../screens/warehouse/inventory/mappers';

const requestMock = vi.mocked(request);

const OWN = '11111111-1111-4111-8111-111111111111';
const FOREIGN = '99999999-9999-4999-8999-999999999999';
const CROP = '22222222-2222-4222-8222-222222222222';
const BATCH = '33333333-3333-4333-8333-333333333333';
const SUB_SCOPE = { warehouseId: OWN, warehouseCode: 'WH-COON', warehouseName: 'Coonoor' };
const MAIN_SCOPE = {};

beforeEach(() => {
  vi.clearAllMocks();
});

function lastCall(): [string, Record<string, unknown>] {
  const call = requestMock.mock.calls.at(-1);
  if (call === undefined) throw new Error('request() was not called');
  return [call[0], call[1] as Record<string, unknown>];
}

describe('listBatches', () => {
  it('GETs /admin/batches with no query by default', async () => {
    await listBatches();
    expect(requestMock).toHaveBeenCalledWith('/admin/batches', { method: 'GET', timeoutMs: ADMIN_REQUEST_TIMEOUT_MS });
  });

  it('sends cursor, limit, warehouseId, cropId, grade and status', async () => {
    await listBatches({ cursor: 'c-1', limit: 100, warehouseId: OWN, cropId: CROP, grade: 'GRADE_1', status: 'ACTIVE' });
    expect(lastCall()[0]).toBe(
      `/admin/batches?cursor=c-1&limit=100&warehouseId=${OWN}&cropId=${CROP}&grade=GRADE_1&status=ACTIVE`,
    );
  });

  it('passes the caller signal through', async () => {
    const controller = new AbortController();
    await listBatches({}, controller.signal);
    expect(lastCall()[1]['signal']).toBe(controller.signal);
  });
});

describe('getBatch', () => {
  it('GETs /admin/batches/{id}', async () => {
    await getBatch(BATCH);
    expect(requestMock).toHaveBeenCalledWith(`/admin/batches/${BATCH}`, { method: 'GET', timeoutMs: ADMIN_REQUEST_TIMEOUT_MS });
  });

  it('encodes the id so it stays one path segment', async () => {
    await getBatch('a/b?c');
    expect(lastCall()[0]).toBe('/admin/batches/a%2Fb%3Fc');
  });
});

describe('listStockLedger', () => {
  it('GETs /admin/stock-ledger with no query by default', async () => {
    await listStockLedger();
    expect(lastCall()[0]).toBe('/admin/stock-ledger');
  });

  it('sends cursor, limit, batchId, warehouseId, txnType, from and to', async () => {
    await listStockLedger({
      cursor: 'c-2',
      limit: 20,
      batchId: BATCH,
      warehouseId: OWN,
      txnType: 'RECEIPT',
      from: '2026-10-01T00:00:00Z',
      to: '2026-10-12T00:00:00Z',
    });
    expect(lastCall()[0]).toBe(
      `/admin/stock-ledger?cursor=c-2&limit=20&batchId=${BATCH}&warehouseId=${OWN}&txnType=RECEIPT` +
        '&from=2026-10-01T00%3A00%3A00Z&to=2026-10-12T00%3A00%3A00Z',
    );
  });
});

describe('listAllocations', () => {
  it('GETs /admin/allocations with no query by default', async () => {
    await listAllocations();
    expect(lastCall()[0]).toBe('/admin/allocations');
  });

  it('sends cursor, limit, warehouseId, allocationDate and channel', async () => {
    await listAllocations({ cursor: 'c-3', limit: 100, warehouseId: OWN, allocationDate: '2026-10-12', channel: 'LIVE_MARKET' });
    expect(lastCall()[0]).toBe(
      `/admin/allocations?cursor=c-3&limit=100&warehouseId=${OWN}&allocationDate=2026-10-12&channel=LIVE_MARKET`,
    );
  });
});

describe('BR-30: a Sub scope never sends a foreign warehouseId', () => {
  it('inventoryWarehouseFilter pins a Sub scope to its own warehouse uuid, whatever was selected', () => {
    expect(inventoryWarehouseFilter(SUB_SCOPE, FOREIGN)).toBe(OWN);
    expect(inventoryWarehouseFilter(SUB_SCOPE, undefined)).toBe(OWN);
  });

  it('the Sub filter is the warehouse uuid, never the human code', () => {
    expect(inventoryWarehouseFilter(SUB_SCOPE, undefined)).not.toBe('WH-COON');
  });

  it('Main sends the selected warehouse, or none for all warehouses', () => {
    expect(inventoryWarehouseFilter(MAIN_SCOPE, FOREIGN)).toBe(FOREIGN);
    expect(inventoryWarehouseFilter(MAIN_SCOPE, undefined)).toBeUndefined();
  });

  it('every list call made through the filter carries only the Sub warehouse', async () => {
    const warehouseId = inventoryWarehouseFilter(SUB_SCOPE, FOREIGN);
    await listBatches({ warehouseId });
    await listStockLedger({ warehouseId });
    await listAllocations({ warehouseId });
    const paths = requestMock.mock.calls.map((c) => c[0]);
    expect(paths).toEqual([
      `/admin/batches?warehouseId=${OWN}`,
      `/admin/stock-ledger?warehouseId=${OWN}`,
      `/admin/allocations?warehouseId=${OWN}`,
    ]);
    for (const path of paths) expect(path).not.toContain(FOREIGN);
  });

  it('with no filter the functions send no warehouseId at all', async () => {
    await listBatches({ status: 'ACTIVE' });
    expect(lastCall()[0]).toBe('/admin/batches?status=ACTIVE');
  });
});

describe('ERROR_CODES', () => {
  it('lists the problem codes the four endpoints document (401, 403, 404, 500)', () => {
    expect([...ERROR_CODES].sort()).toEqual(['FORBIDDEN', 'INTERNAL', 'NOT_FOUND', 'UNAUTHENTICATED']);
  });
});
