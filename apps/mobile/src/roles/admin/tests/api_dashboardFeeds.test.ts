/**
 * roles/admin/api/dashboardFeeds.ts: the reads the Main Warehouse dashboard
 * (D01-D05) composes from existing endpoints. Shell client mocked (same
 * pattern as api_tasks.test.ts); every request is checked for its path, its
 * query and that it is a GET.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as ClientModule from '../../../shell/api/client';

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return { ...actual, request: vi.fn() };
});

import { request } from '../../../shell/api/client';
import {
  DASHBOARD_MAX_PAGES,
  countGoodsReceiptsWithStatus,
  countOrdersWithStatus,
  getActiveAlerts,
  getActiveBatches,
  getGoodsReceiptsOnDay,
  getOpenIssueCounts,
  getOpenPurchaseOrders,
  getRecentActivityPages,
  getUnreadNotificationCount,
  getWarehouseCapacities,
  getWarehousePerformances,
} from '../api/dashboardFeeds';

const requestMock = vi.mocked(request);
const WH_A = '11111111-1111-4111-8111-111111111111';
const WH_B = '22222222-2222-4222-8222-222222222222';

function cursorPage<T>(items: T[], nextCursor: string | null) {
  return { items, page: { nextCursor, hasMore: nextCursor !== null } };
}

describe('roles/admin/api/dashboardFeeds.ts', () => {
  beforeEach(() => {
    requestMock.mockReset();
  });

  it('BR-66: reads each warehouse capacity once and keys it by uuid', async () => {
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
    for (const [, init] of requestMock.mock.calls) expect(init?.method).toBe('GET');
  });

  it('fails the whole capacity read when one warehouse fails (one error state)', async () => {
    requestMock.mockResolvedValueOnce({ warehouseId: WH_A, capacityKg: null, usedKg: '0.000', availableKg: null, utilizationPercent: null });
    requestMock.mockRejectedValueOnce(new Error('boom'));
    await expect(getWarehouseCapacities([WH_A, WH_B])).rejects.toThrow('boom');
  });

  it('BR-103: counts open issues per warehouse from the exact list total (OPEN plus IN_PROGRESS), one 1-row page per status', async () => {
    requestMock.mockImplementation(async (path: string) => {
      const open = path.includes('status=OPEN');
      const mine = path.includes(WH_A);
      return { items: [], page: 1, pageSize: 1, total: mine ? (open ? 2 : 3) : open ? 0 : 4 };
    });
    const counts = await getOpenIssueCounts([WH_A, WH_B, WH_A]);
    expect(counts).toEqual({ [WH_A]: 5, [WH_B]: 4 });
    expect(requestMock).toHaveBeenCalledTimes(4);
    for (const [path, init] of requestMock.mock.calls) {
      expect(path).toMatch(/\/warehouses\/[0-9a-f-]+\/issues/);
      expect(path).toContain('pageSize=1');
      expect(init?.method).toBe('GET');
    }
    expect(requestMock.mock.calls.some(([path]) => path.includes('status=RESOLVED') || path.includes('status=CLOSED'))).toBe(false);
  });

  it('no warehouses is no request and no counts', async () => {
    expect(await getOpenIssueCounts([])).toEqual({});
    expect(await getWarehouseCapacities([])).toEqual(new Map());
    expect(await getRecentActivityPages([], 5)).toEqual([]);
    expect(await getWarehousePerformances([], { from: '2026-10-26', to: '2026-10-26' })).toEqual([]);
    expect(requestMock).not.toHaveBeenCalled();
  });

  it('fails the whole issue count when one read fails (one error state, never a partial total)', async () => {
    requestMock.mockResolvedValueOnce({ items: [], page: 1, pageSize: 1, total: 1 });
    requestMock.mockRejectedValue(new Error('boom'));
    await expect(getOpenIssueCounts([WH_A])).rejects.toThrow('boom');
  });

  it('BR-104: reads the first activity page of each warehouse with the given limit, keyed by warehouse', async () => {
    requestMock.mockImplementation(async (path: string) =>
      cursorPage([{ type: 'GOODS_RECEIPT', sourceId: path.includes(WH_A) ? 'a' : 'b' }], 'next'),
    );
    const pages = await getRecentActivityPages([WH_A, WH_B], 3);
    expect(pages.map((p) => p.warehouseId)).toEqual([WH_A, WH_B]);
    expect(pages[0]?.items[0]).toMatchObject({ sourceId: 'a' });
    expect(requestMock).toHaveBeenCalledTimes(2);
    for (const [path, init] of requestMock.mock.calls) {
      expect(path).toMatch(/\/warehouses\/[0-9a-f-]+\/activity\?limit=3$/);
      expect(init?.method).toBe('GET');
    }
  });

  it('BR-80: reads each warehouse performance for the IST range', async () => {
    requestMock.mockImplementation(async (path: string) => ({ warehouseId: path.includes(WH_A) ? WH_A : WH_B }));
    const rows = await getWarehousePerformances([WH_A, WH_B], { from: '2026-10-26', to: '2026-10-26' });
    expect(rows.map((r) => r.warehouseId)).toEqual([WH_A, WH_B]);
    for (const [path] of requestMock.mock.calls) {
      expect(path).toMatch(/\/warehouses\/[0-9a-f-]+\/performance\?from=2026-10-26&to=2026-10-26$/);
    }
  });

  it("walks today's goods receipts newest first and stops at the first page that reaches an earlier IST day", async () => {
    const today = '2026-10-26';
    requestMock
      .mockResolvedValueOnce(
        cursorPage(
          [
            { id: 'g1', receivedAt: '2026-10-26T06:00:00.000Z' },
            { id: 'g2', receivedAt: '2026-10-25T20:00:00.000Z' },
          ],
          'c2',
        ),
      )
      .mockResolvedValueOnce(cursorPage([{ id: 'g3', receivedAt: '2026-10-25T10:00:00.000Z' }], 'c3'));
    const result = await getGoodsReceiptsOnDay(WH_A, today);
    // 20:00 UTC on the 25th is 01:30 IST on the 26th: still today.
    expect(result.items.map((g) => g.id)).toEqual(['g1', 'g2']);
    expect(result.complete).toBe(true);
    // Page 1 is all today, so page 2 is read; it reaches the 25th, so the walk ends there.
    expect(requestMock).toHaveBeenCalledTimes(2);
    expect(requestMock.mock.calls[0]?.[0]).toBe(`/admin/goods-receipts?limit=100&warehouseId=${WH_A}`);
    expect(requestMock.mock.calls[1]?.[0]).toBe(`/admin/goods-receipts?cursor=c2&limit=100&warehouseId=${WH_A}`);
  });

  it('says a walk is not complete when the page cap stops it with more on the server', async () => {
    requestMock.mockImplementation(async () => cursorPage([{ id: 'x', receivedAt: '2026-10-26T06:00:00.000Z' }], 'more'));
    const result = await getGoodsReceiptsOnDay(undefined, '2026-10-26');
    expect(result.complete).toBe(false);
    expect(requestMock).toHaveBeenCalledTimes(DASHBOARD_MAX_PAGES);
  });

  it('reads every page of the ISSUED and the PARTIALLY_RECEIVED purchase orders', async () => {
    requestMock.mockImplementation(async (path: string) => {
      if (path.includes('status=ISSUED') && !path.includes('cursor=')) return cursorPage([{ id: 'p1' }], 'c2');
      if (path.includes('status=ISSUED')) return cursorPage([{ id: 'p2' }], null);
      return cursorPage([{ id: 'p3' }], null);
    });
    const result = await getOpenPurchaseOrders(WH_B);
    expect(result.items.map((p) => p.id).sort()).toEqual(['p1', 'p2', 'p3']);
    expect(result.complete).toBe(true);
    const paths = requestMock.mock.calls.map(([path]) => path);
    expect(paths).toContain(`/admin/purchase-orders?limit=100&status=ISSUED&warehouseId=${WH_B}`);
    expect(paths).toContain(`/admin/purchase-orders?cursor=c2&limit=100&status=ISSUED&warehouseId=${WH_B}`);
    expect(paths).toContain(`/admin/purchase-orders?limit=100&status=PARTIALLY_RECEIVED&warehouseId=${WH_B}`);
  });

  it('counts every order of one status across all pages (READY_FOR_PICKUP), exact only when the walk finished', async () => {
    requestMock
      .mockResolvedValueOnce(cursorPage([{ id: 'o1' }, { id: 'o2' }], 'c2'))
      .mockResolvedValueOnce(cursorPage([{ id: 'o3' }], null));
    expect(await countOrdersWithStatus('READY_FOR_PICKUP', undefined)).toEqual({ count: 3, exact: true });
    expect(requestMock.mock.calls[0]?.[0]).toBe('/admin/orders?limit=100&status=READY_FOR_PICKUP');
  });

  it('counts every goods receipt of one status across all pages (AWAITING_QC)', async () => {
    requestMock.mockResolvedValueOnce(cursorPage([{ id: 'g1' }], null));
    expect(await countGoodsReceiptsWithStatus('AWAITING_QC', WH_A)).toEqual({ count: 1, exact: true });
    expect(requestMock.mock.calls[0]?.[0]).toBe(`/admin/goods-receipts?limit=100&warehouseId=${WH_A}&status=AWAITING_QC`);
  });

  it('BR-77: reads every page of the active alerts', async () => {
    requestMock
      .mockResolvedValueOnce(cursorPage([{ itemKey: 'a' }], 'c2'))
      .mockResolvedValueOnce(cursorPage([{ itemKey: 'b' }], null));
    const result = await getActiveAlerts(undefined);
    expect(result).toEqual({ items: [{ itemKey: 'a' }, { itemKey: 'b' }], complete: true });
    expect(requestMock.mock.calls[0]?.[0]).toBe('/admin/alerts?state=active&limit=100');
    expect(requestMock.mock.calls[1]?.[0]).toBe('/admin/alerts?state=active&cursor=c2&limit=100');
  });

  it('reads every page of the ACTIVE batches', async () => {
    requestMock.mockResolvedValueOnce(cursorPage([{ id: 'b1' }], null));
    const result = await getActiveBatches(WH_A);
    expect(result.items).toEqual([{ id: 'b1' }]);
    expect(requestMock.mock.calls[0]?.[0]).toBe(`/admin/batches?limit=100&warehouseId=${WH_A}&status=ACTIVE`);
  });

  it("BR-65: the bell badge is the server's unread total, read from a one-row page", async () => {
    requestMock.mockResolvedValueOnce({ items: [], page: { nextCursor: null, hasMore: false }, unreadCount: 7 });
    expect(await getUnreadNotificationCount()).toBe(7);
    expect(requestMock.mock.calls[0]?.[0]).toBe('/notifications?limit=1');
  });

  it('an unread total that is not a whole number fails the read instead of showing a wrong badge', async () => {
    requestMock.mockResolvedValueOnce({ items: [], page: { nextCursor: null, hasMore: false }, unreadCount: 'x' });
    await expect(getUnreadNotificationCount()).rejects.toThrow();
  });
});
