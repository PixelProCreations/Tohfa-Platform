/**
 * roles/admin/api/dashboardFeeds.ts: transfer status totals and multi-warehouse
 * capacity, composed from GET /warehouse-transfers and GET /warehouses/{id}/capacity.
 * Shell client mocked (same pattern as api_tasks.test.ts).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as ClientModule from '../../../shell/api/client';

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return { ...actual, request: vi.fn() };
});

import { request } from '../../../shell/api/client';
import { getTransferStatusCounts, getWarehouseCapacities } from '../api/dashboardFeeds';

const requestMock = vi.mocked(request);
const WH_A = '11111111-1111-4111-8111-111111111111';
const WH_B = '22222222-2222-4222-8222-222222222222';

describe('roles/admin/api/dashboardFeeds.ts', () => {
  beforeEach(() => {
    requestMock.mockReset();
  });

  it('BR-102: counts transfers per status from the list total, one 1-row page per status', async () => {
    const totals: Record<string, number> = { PENDING_APPROVAL: 2, IN_TRANSIT: 5, RECEIVED: 40, CANCELLED: 1 };
    requestMock.mockImplementation(async (path: string) => {
      const status = /status=([A-Z_]+)/.exec(path)?.[1] ?? '';
      return { items: [], page: 1, pageSize: 1, total: totals[status] ?? 0 };
    });
    const counts = await getTransferStatusCounts();
    expect(counts).toEqual(totals);
    expect(requestMock).toHaveBeenCalledTimes(4);
    for (const [path, init] of requestMock.mock.calls) {
      expect(path).toContain('/warehouse-transfers');
      expect(path).toContain('pageSize=1');
      expect(path).not.toContain('warehouseId=');
      expect(init?.method).toBe('GET');
    }
  });

  it('BR-30: narrows the transfer counts to one warehouse when given', async () => {
    requestMock.mockResolvedValue({ items: [], page: 1, pageSize: 1, total: 0 });
    await getTransferStatusCounts(WH_A);
    for (const [path] of requestMock.mock.calls) expect(path).toContain(`warehouseId=${WH_A}`);
  });

  it('reads each warehouse capacity once and keys it by uuid', async () => {
    requestMock.mockImplementation(async (path: string) => ({
      warehouseId: path.includes(WH_A) ? WH_A : WH_B,
      capacityKg: '1000.000',
      usedKg: path.includes(WH_A) ? '820.000' : '100.000',
      availableKg: '0.000',
      utilizationPercent: 50,
    }));
    const map = await getWarehouseCapacities([WH_A, WH_B, WH_A]);
    expect(requestMock).toHaveBeenCalledTimes(2);
    expect(map.get(WH_A)?.usedKg).toBe('820.000');
    expect(map.get(WH_B)?.usedKg).toBe('100.000');
    expect(requestMock.mock.calls[0]?.[0]).toContain(`/warehouses/${WH_A}/capacity`);
  });

  it('fails the whole capacity read when one warehouse fails (one error state)', async () => {
    requestMock.mockResolvedValueOnce({ warehouseId: WH_A, capacityKg: null, usedKg: '0.000', availableKg: null, utilizationPercent: null });
    requestMock.mockRejectedValueOnce(new Error('boom'));
    await expect(getWarehouseCapacities([WH_A, WH_B])).rejects.toThrow('boom');
  });
});
