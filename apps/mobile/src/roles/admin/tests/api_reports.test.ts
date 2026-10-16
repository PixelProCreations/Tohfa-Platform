/**
 * roles/admin/api/reports.ts: the warehouse reports API (docs/openapi.yaml tag Reports):
 *   GET /admin/reports/sales        order.list.view_all           (BR-64; requires from & to)
 *   GET /admin/reports/receiving    inventory.goods_receipt.record (BR-64; requires from & to)
 *   GET /admin/reports/inventory    inventory.batch.view          (BR-64; snapshot)
 *   GET /admin/reports/returns      rma.request.process           (BR-64; requires from & to)
 *   GET /admin/reports/customers    customer.list.view            (BR-64; counts only, requires from & to)
 *   GET /admin/reports/cash-topups  wallet.cash_topup.process     (BR-64; requires from & to)
 *
 * Shell client is mocked (same pattern as api_orders.test.ts and api_finance.test.ts).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as ClientModule from '../../../shell/api/client';

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return {
    ...actual,
    request: vi.fn(async () => ({ items: [], byDay: [], count: 0, total: '0.00' })),
  };
});

import { request } from '../../../shell/api/client';
import {
  ERROR_CODES,
  getCashTopupsReport,
  getCustomersReport,
  getInventoryReport,
  getReceivingReport,
  getReturnsReport,
  getSalesReport,
} from '../api/reports';
import { hasKey } from '../i18n';
import { reportsWarehouseFilter } from '../screens/warehouse/reports/mappers';

const requestMock = vi.mocked(request);

const OWN_WAREHOUSE = '11111111-1111-4111-8111-111111111111';
const FOREIGN_WAREHOUSE = '99999999-9999-4999-8999-999999999999';
const SUB_SCOPE = { warehouseId: OWN_WAREHOUSE, warehouseCode: 'WH-COON', warehouseName: 'Coonoor' };
const MAIN_SCOPE = {};

describe('roles/admin/api/reports.ts (HTTP contract, BR-64)', () => {
  beforeEach(() => {
    requestMock.mockReset();
    requestMock.mockResolvedValue({ items: [], byDay: [], count: 0, total: '0.00' });
  });

  describe('GET /admin/reports/sales (BR-64)', () => {
    it('sends GET /admin/reports/sales with required from, to, and warehouseId', async () => {
      await getSalesReport({
        from: '2026-10-01',
        to: '2026-10-13',
        warehouseId: OWN_WAREHOUSE,
        channel: 'DIRECT',
      });
      expect(requestMock).toHaveBeenCalledTimes(1);
      const [path, init] = requestMock.mock.calls[0]!;
      expect(path).toContain('/admin/reports/sales');
      expect(path).toContain('from=2026-10-01');
      expect(path).toContain('to=2026-10-13');
      expect(path).toContain(`warehouseId=${OWN_WAREHOUSE}`);
      expect(path).toContain('channel=DIRECT');
      expect(init?.method).toBe('GET');
    });
  });

  describe('GET /admin/reports/receiving (BR-64)', () => {
    it('sends GET /admin/reports/receiving with from, to, and warehouseId', async () => {
      await getReceivingReport({
        from: '2026-10-01',
        to: '2026-10-13',
        warehouseId: OWN_WAREHOUSE,
      });
      expect(requestMock).toHaveBeenCalledTimes(1);
      const [path, init] = requestMock.mock.calls[0]!;
      expect(path).toContain('/admin/reports/receiving');
      expect(path).toContain('from=2026-10-01');
      expect(path).toContain('to=2026-10-13');
      expect(path).toContain(`warehouseId=${OWN_WAREHOUSE}`);
      expect(init?.method).toBe('GET');
    });
  });

  describe('GET /admin/reports/inventory (BR-64)', () => {
    it('sends GET /admin/reports/inventory with optional dates and warehouseId', async () => {
      await getInventoryReport({
        warehouseId: OWN_WAREHOUSE,
      });
      expect(requestMock).toHaveBeenCalledTimes(1);
      const [path, init] = requestMock.mock.calls[0]!;
      expect(path).toContain('/admin/reports/inventory');
      expect(path).toContain(`warehouseId=${OWN_WAREHOUSE}`);
      expect(init?.method).toBe('GET');
    });

    it('sends GET /admin/reports/inventory with from and to when provided (BR-64)', async () => {
      await getInventoryReport({
        from: '2026-10-01',
        to: '2026-10-13',
        warehouseId: OWN_WAREHOUSE,
      });
      expect(requestMock).toHaveBeenCalledTimes(1);
      const [path, init] = requestMock.mock.calls[0]!;
      expect(path).toContain('/admin/reports/inventory');
      expect(path).toContain('from=2026-10-01');
      expect(path).toContain('to=2026-10-13');
      expect(path).toContain(`warehouseId=${OWN_WAREHOUSE}`);
      expect(init?.method).toBe('GET');
    });
  });

  describe('GET /admin/reports/returns (BR-64)', () => {
    it('sends GET /admin/reports/returns with from, to, and warehouseId', async () => {
      await getReturnsReport({
        from: '2026-10-01',
        to: '2026-10-13',
        warehouseId: OWN_WAREHOUSE,
      });
      expect(requestMock).toHaveBeenCalledTimes(1);
      const [path, init] = requestMock.mock.calls[0]!;
      expect(path).toContain('/admin/reports/returns');
      expect(path).toContain('from=2026-10-01');
      expect(path).toContain('to=2026-10-13');
      expect(path).toContain(`warehouseId=${OWN_WAREHOUSE}`);
      expect(init?.method).toBe('GET');
    });
  });

  describe('GET /admin/reports/customers (BR-64d: counts only)', () => {
    it('sends GET /admin/reports/customers with from, to, and warehouseId', async () => {
      await getCustomersReport({
        from: '2026-10-01',
        to: '2026-10-13',
        warehouseId: OWN_WAREHOUSE,
      });
      expect(requestMock).toHaveBeenCalledTimes(1);
      const [path, init] = requestMock.mock.calls[0]!;
      expect(path).toContain('/admin/reports/customers');
      expect(path).toContain('from=2026-10-01');
      expect(path).toContain('to=2026-10-13');
      expect(path).toContain(`warehouseId=${OWN_WAREHOUSE}`);
      expect(init?.method).toBe('GET');
    });
  });

  describe('GET /admin/reports/cash-topups (BR-64)', () => {
    it('sends GET /admin/reports/cash-topups with from, to, and warehouseId', async () => {
      await getCashTopupsReport({
        from: '2026-10-01',
        to: '2026-10-13',
        warehouseId: OWN_WAREHOUSE,
      });
      expect(requestMock).toHaveBeenCalledTimes(1);
      const [path, init] = requestMock.mock.calls[0]!;
      expect(path).toContain('/admin/reports/cash-topups');
      expect(path).toContain('from=2026-10-01');
      expect(path).toContain('to=2026-10-13');
      expect(path).toContain(`warehouseId=${OWN_WAREHOUSE}`);
      expect(init?.method).toBe('GET');
    });
  });

  describe('ERROR_CODES (i18n completeness)', () => {
    it('every declared ERROR_CODE exists in roles/admin/i18n error dictionary', () => {
      for (const code of ERROR_CODES) {
        expect(hasKey(`admin.error.${code}`)).toBe(true);
      }
    });
  });

  describe('reportsWarehouseFilter (BR-30 warehouse scoping)', () => {
    it('Sub Warehouse scope pins the warehouseId to scope.warehouseId', () => {
      expect(reportsWarehouseFilter(SUB_SCOPE, FOREIGN_WAREHOUSE)).toBe(OWN_WAREHOUSE);
      expect(reportsWarehouseFilter(SUB_SCOPE, undefined)).toBe(OWN_WAREHOUSE);
    });

    it('Main Warehouse scope permits the selected warehouse or undefined', () => {
      expect(reportsWarehouseFilter(MAIN_SCOPE, FOREIGN_WAREHOUSE)).toBe(FOREIGN_WAREHOUSE);
      expect(reportsWarehouseFilter(MAIN_SCOPE, undefined)).toBeUndefined();
    });

    it('BR-64b: a fixture id selection is never sent (no warehouseId query param, so no 400)', async () => {
      vi.mocked(request).mockResolvedValueOnce({} as never);
      await getSalesReport({ from: '2026-10-01', to: '2026-10-13', warehouseId: reportsWarehouseFilter(MAIN_SCOPE, 'WH-OOTY') });
      const path = String(vi.mocked(request).mock.calls.at(-1)?.[0] ?? '');
      expect(path).not.toContain('warehouseId');
      expect(path).not.toContain('WH-OOTY');
    });
  });
});
