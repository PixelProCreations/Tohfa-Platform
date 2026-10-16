/**
 * roles/admin/api/warehouseList.ts: GET /warehouses (warehouse.all.view, BR-23, BR-24, BR-66)
 * and the picker mapping. Shell client is mocked (same pattern as api_tasks.test.ts).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as ClientModule from '../../../shell/api/client';

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return { ...actual, request: vi.fn() };
});

import { request } from '../../../shell/api/client';
import {
  listAllWarehouses,
  listWarehouses,
  toWarehouseOptions,
  warehouseOptionName,
  WAREHOUSE_LIST_MAX_PAGE_SIZE,
} from '../api/warehouseList';
import type { WarehouseDto } from '../api/warehouses';

const requestMock = vi.mocked(request);

function wh(over: Partial<WarehouseDto>): WarehouseDto {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    code: 'WH-X',
    name: 'X',
    type: 'SUB',
    city: null,
    capacityKg: null,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    ...over,
  };
}

describe('roles/admin/api/warehouseList.ts', () => {
  beforeEach(() => {
    requestMock.mockReset();
  });

  it('BR-23: GET /warehouses sends the filters as query params', async () => {
    requestMock.mockResolvedValue({ items: [], page: 1, pageSize: 20, total: 0 });
    await listWarehouses({ q: 'oot', type: 'SUB', isActive: true, page: 2, pageSize: 10 });
    const [path, init] = requestMock.mock.calls[0]!;
    expect(path).toMatch(/^\/warehouses\?/);
    expect(path).toContain('q=oot');
    expect(path).toContain('type=SUB');
    expect(path).toContain('isActive=true');
    expect(path).toContain('page=2');
    expect(path).toContain('pageSize=10');
    expect(init?.method).toBe('GET');
  });

  it('sends no query string for no params', async () => {
    requestMock.mockResolvedValue({ items: [], page: 1, pageSize: 20, total: 0 });
    await listWarehouses();
    expect(requestMock.mock.calls[0]![0]).toBe('/warehouses');
  });

  it('listAllWarehouses follows total across pages at the max page size', async () => {
    const a = wh({ id: 'a1111111-1111-4111-8111-111111111111' });
    const b = wh({ id: 'b1111111-1111-4111-8111-111111111111' });
    requestMock
      .mockResolvedValueOnce({ items: [a], page: 1, pageSize: 100, total: 2 })
      .mockResolvedValueOnce({ items: [b], page: 2, pageSize: 100, total: 2 });
    const all = await listAllWarehouses();
    expect(all.map((w) => w.id)).toEqual([a.id, b.id]);
    expect(requestMock).toHaveBeenCalledTimes(2);
    expect(requestMock.mock.calls[0]![0]).toContain(`pageSize=${WAREHOUSE_LIST_MAX_PAGE_SIZE}`);
    expect(requestMock.mock.calls[1]![0]).toContain('page=2');
  });

  it('listAllWarehouses stops on an empty page even if total is larger', async () => {
    requestMock.mockResolvedValueOnce({ items: [], page: 1, pageSize: 100, total: 5 });
    expect(await listAllWarehouses()).toEqual([]);
    expect(requestMock).toHaveBeenCalledTimes(1);
  });

  it('toWarehouseOptions keys by uuid and sorts active, MAIN first, then name', () => {
    const rows = [
      wh({ id: 'c1111111-1111-4111-8111-111111111111', name: 'Kotagiri', code: 'WH-KOT' }),
      wh({ id: 'd1111111-1111-4111-8111-111111111111', name: 'Coonoor', code: 'WH-COO' }),
      wh({ id: 'e1111111-1111-4111-8111-111111111111', name: 'Ooty', code: 'WH-OOT', type: 'MAIN', city: 'Ooty' }),
      wh({ id: 'f1111111-1111-4111-8111-111111111111', name: 'Aardvark', isActive: false }),
    ];
    const opts = toWarehouseOptions(rows);
    expect(opts.map((o) => o.warehouseName)).toEqual(['Ooty', 'Coonoor', 'Kotagiri', 'Aardvark']);
    expect(opts[0]).toEqual({
      warehouseId: 'e1111111-1111-4111-8111-111111111111',
      warehouseName: 'Ooty',
      warehouseCode: 'WH-OOT',
      type: 'MAIN',
      city: 'Ooty',
      isActive: true,
    });
    for (const o of opts) expect(o.warehouseId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('warehouseOptionName finds by uuid only', () => {
    const opts = toWarehouseOptions([wh({ name: 'Ooty' })]);
    expect(warehouseOptionName(opts, '11111111-1111-4111-8111-111111111111')).toBe('Ooty');
    expect(warehouseOptionName(opts, 'WH-OOTY')).toBeUndefined();
    expect(warehouseOptionName(opts, undefined)).toBeUndefined();
  });
});
