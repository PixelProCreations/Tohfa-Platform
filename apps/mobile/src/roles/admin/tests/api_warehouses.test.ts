/**
 * roles/admin/api/warehouses.ts: GET /warehouses (docs/openapi.yaml
 * listWarehouses, x-permission warehouse.all.view, BR-23, BR-24, BR-66), the
 * Main admin's warehouse list. The shell client is mocked (same pattern as
 * api_inventory.test.ts), so these tests pin exactly what goes on the wire.
 *
 * The module is read-only: there is no write helper, so the tests also pin that
 * every call is a GET.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

vi.mock('../../../shell/api/client', () => ({
  request: vi.fn(async () => ({ items: [], page: 1, pageSize: 20, total: 0 })),
}));

import { request } from '../../../shell/api/client';
import { ADMIN_REQUEST_TIMEOUT_MS } from '../api/http';
import * as warehousesApi from '../api/warehouses';
import { getWarehouse, getWarehouseCapacity, listStorageLocations, listWarehouses } from '../api/warehouses';

const requestMock = vi.mocked(request);
const REPO_ROOT = path.join(__dirname, '..', '..', '..', '..', '..', '..');
const WH = '11111111-1111-4111-8111-111111111111';

beforeEach(() => {
  vi.clearAllMocks();
});

function lastCall(): [string, Record<string, unknown>] {
  const call = requestMock.mock.calls.at(-1);
  if (call === undefined) throw new Error('request() was not called');
  return [call[0], call[1] as Record<string, unknown>];
}

describe('listWarehouses', () => {
  it('GETs /warehouses with no query by default', async () => {
    await listWarehouses();
    expect(requestMock).toHaveBeenCalledWith('/warehouses', { method: 'GET', timeoutMs: ADMIN_REQUEST_TIMEOUT_MS });
  });

  it('sends q, type, isActive, page and pageSize in the spec order, isActive as the string the spec enumerates', async () => {
    await listWarehouses({ q: 'oot', type: 'SUB', isActive: true, page: 2, pageSize: 100 });
    expect(lastCall()[0]).toBe('/warehouses?q=oot&type=SUB&isActive=true&page=2&pageSize=100');
  });

  it('keeps isActive=false (a real filter value) and drops undefined filters', async () => {
    await listWarehouses({ isActive: false, type: undefined });
    expect(lastCall()[0]).toBe('/warehouses?isActive=false');
  });

  it('returns the OffsetPage shape the server sends (items, page, pageSize, total) untouched', async () => {
    const body = { items: [{ id: WH, code: 'WH-MAIN', name: 'Main', type: 'MAIN', isActive: true, createdAt: '2026-10-01T00:00:00Z' }], page: 1, pageSize: 20, total: 1 };
    requestMock.mockResolvedValueOnce(body);
    await expect(listWarehouses()).resolves.toEqual(body);
  });

  it('passes the caller signal through', async () => {
    const controller = new AbortController();
    await listWarehouses({}, controller.signal);
    expect(lastCall()[1]['signal']).toBe(controller.signal);
  });

  it('is documented in the spec as warehouse.all.view with a pageSize maximum of 100', () => {
    const spec = fs.readFileSync(path.join(REPO_ROOT, 'docs', 'openapi.yaml'), 'utf8');
    const block = spec.slice(spec.indexOf('  /warehouses:\n'), spec.indexOf('  /warehouses/{id}:\n'));
    expect(block).toContain('operationId: listWarehouses');
    expect(block).toContain('x-permission: warehouse.all.view');
    expect(block).toMatch(/pageSize[\s\S]*maximum: 100/);
  });
});

describe('the module is read-only', () => {
  it('every helper issues a GET and nothing else', async () => {
    await listWarehouses();
    await getWarehouse(WH);
    await getWarehouseCapacity(WH);
    await listStorageLocations(WH);
    expect(requestMock.mock.calls.map((c) => (c[1] as { method: string }).method)).toEqual(['GET', 'GET', 'GET', 'GET']);
  });

  it('exports no write helper (PATCH /warehouses is a later phase)', () => {
    expect(Object.keys(warehousesApi).filter((k) => /^(create|update|patch|set|delete|post)/i.test(k))).toEqual([]);
  });
});

describe('the sibling reads keep their paths', () => {
  it('GET /warehouses/{id}, /capacity and /storage-locations, with the id encoded as one segment', async () => {
    await getWarehouse(WH);
    expect(lastCall()[0]).toBe(`/warehouses/${WH}`);
    await getWarehouseCapacity('a/b');
    expect(lastCall()[0]).toBe('/warehouses/a%2Fb/capacity');
    await listStorageLocations(WH, { page: 3, pageSize: 50 });
    expect(lastCall()[0]).toBe(`/warehouses/${WH}/storage-locations?page=3&pageSize=50`);
  });
});
