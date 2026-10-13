import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as ClientModule from '../../../shell/api/client';

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return { ...actual, request: vi.fn() };
});

import { ApiError, request } from '../../../shell/api/client';
import { adminErrorKey } from '../api/errors';
import {
  ERROR_CODES,
  WAREHOUSE_TYPES,
  getWarehouse,
  getWarehouseCapacity,
  listStorageLocations,
} from '../api/warehouseInfo';

const requestMock = vi.mocked(request);
const WH = '3f1b7c2e-2a44-4f0e-9b1a-6b0d2f0f1a01';

beforeEach(() => {
  requestMock.mockReset();
  requestMock.mockResolvedValue({});
});

describe('api/warehouseInfo', () => {
  it('BR-66: getWarehouse GETs exactly /warehouses/{id}', async () => {
    await getWarehouse(WH);
    const [p, opts] = requestMock.mock.calls[0]!;
    expect(p).toBe(`/warehouses/${WH}`);
    expect(opts?.method).toBe('GET');
    expect(opts?.signal).toBeInstanceOf(AbortSignal);
  });

  it('BR-66: getWarehouseCapacity GETs exactly /warehouses/{id}/capacity', async () => {
    await getWarehouseCapacity(WH);
    const [p, opts] = requestMock.mock.calls[0]!;
    expect(p).toBe(`/warehouses/${WH}/capacity`);
    expect(opts?.method).toBe('GET');
  });

  it('listStorageLocations sends only q / isActive / page / pageSize', async () => {
    requestMock.mockResolvedValue({ items: [], page: 1, pageSize: 20, total: 0 });
    const params = { q: 'cold', isActive: true, page: 2, pageSize: 20, warehouseId: 'other' } as never;
    await listStorageLocations(WH, params);
    const [p, opts] = requestMock.mock.calls[0]!;
    expect(p).toBe(`/warehouses/${WH}/storage-locations?q=cold&isActive=true&page=2&pageSize=20`);
    expect(opts?.method).toBe('GET');
  });

  it('listStorageLocations omits unset filters', async () => {
    requestMock.mockResolvedValue({ items: [], page: 1, pageSize: 20, total: 0 });
    await listStorageLocations(WH, {});
    expect(requestMock.mock.calls[0]![0]).toBe(`/warehouses/${WH}/storage-locations`);
  });

  it('encodes the warehouse id so it cannot change the path', async () => {
    await getWarehouse('a/../b');
    expect(requestMock.mock.calls[0]![0]).toBe('/warehouses/a%2F..%2Fb');
  });

  it('BR-66: another warehouse is 404 NOT_FOUND (never 403) and renders as not-found', async () => {
    requestMock.mockRejectedValue(
      new ApiError({ type: 'about:blank', title: 'Not Found', status: 404, code: 'NOT_FOUND' } as never),
    );
    const error = await getWarehouse(WH).catch((e: unknown) => e);
    expect(adminErrorKey(error)).toBe('admin.errors.NOT_FOUND');
  });

  it('exports the OpenAPI warehouse type enum and the error codes these GETs return', () => {
    expect([...WAREHOUSE_TYPES]).toEqual(['MAIN', 'SUB']);
    expect([...ERROR_CODES].sort()).toEqual(
      ['FORBIDDEN', 'INTERNAL', 'NOT_FOUND', 'UNAUTHENTICATED', 'VALIDATION_FAILED'].sort(),
    );
  });
});
