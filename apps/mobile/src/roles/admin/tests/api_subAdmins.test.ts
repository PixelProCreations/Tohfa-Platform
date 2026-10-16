/**
 * roles/admin/api/subAdmins.ts: GET/POST /admin/sub-warehouse-admins (admin.sub_wh_admin.create,
 * BR-25, BR-28, BR-81). Shell client is mocked (same pattern as api_warehouseList.test.ts).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as ClientModule from '../../../shell/api/client';

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return { ...actual, request: vi.fn() };
});

import { request } from '../../../shell/api/client';
import {
  createSubAdmin,
  ERROR_CODES,
  listAllSubAdmins,
  listSubAdmins,
  SUB_ADMIN_LIST_MAX_PAGE_SIZE,
  type SubAdminDto,
} from '../api/subAdmins';

const requestMock = vi.mocked(request);
const WH = '11111111-1111-4111-8111-111111111111';

function row(over: Partial<SubAdminDto> = {}): SubAdminDto {
  return {
    userId: '22222222-2222-4222-8222-222222222222',
    adminCode: 'SWA-0001',
    fullName: 'Arun',
    status: 'ACTIVE',
    warehouseId: WH,
    assignedAt: '2026-10-01T00:00:00Z',
    ...over,
  };
}

describe('roles/admin/api/subAdmins.ts', () => {
  beforeEach(() => {
    requestMock.mockReset();
  });

  it('BR-81: GET /admin/sub-warehouse-admins sends warehouseId, page and pageSize', async () => {
    requestMock.mockResolvedValue({ items: [], page: 2, pageSize: 10, total: 0 });
    await listSubAdmins({ warehouseId: WH, page: 2, pageSize: 10 });
    const [path, init] = requestMock.mock.calls[0]!;
    expect(path).toMatch(/^\/admin\/sub-warehouse-admins\?/);
    expect(path).toContain(`warehouseId=${WH}`);
    expect(path).toContain('page=2');
    expect(path).toContain('pageSize=10');
    expect(init?.method).toBe('GET');
  });

  it('sends no query string for no params', async () => {
    requestMock.mockResolvedValue({ items: [], page: 1, pageSize: 20, total: 0 });
    await listSubAdmins();
    expect(requestMock.mock.calls[0]![0]).toBe('/admin/sub-warehouse-admins');
  });

  it('listAllSubAdmins follows total across pages at the max page size', async () => {
    requestMock
      .mockResolvedValueOnce({ items: [row({ userId: 'a' })], page: 1, pageSize: 100, total: 2 })
      .mockResolvedValueOnce({ items: [row({ userId: 'b' })], page: 2, pageSize: 100, total: 2 });
    const all = await listAllSubAdmins();
    expect(all.map((r) => r.userId)).toEqual(['a', 'b']);
    expect(requestMock).toHaveBeenCalledTimes(2);
    expect(requestMock.mock.calls[0]![0]).toContain(`pageSize=${SUB_ADMIN_LIST_MAX_PAGE_SIZE}`);
    expect(requestMock.mock.calls[1]![0]).toContain('page=2');
  });

  it('listAllSubAdmins stops on an empty page even if total says more', async () => {
    requestMock.mockResolvedValueOnce({ items: [], page: 1, pageSize: 100, total: 5 });
    expect(await listAllSubAdmins()).toEqual([]);
    expect(requestMock).toHaveBeenCalledTimes(1);
  });

  it('BR-25: POST sends exactly fullName, mobile and warehouseId, with no Idempotency-Key', async () => {
    requestMock.mockResolvedValue(row());
    const extra = { fullName: 'Arun', mobile: '+919876543210', warehouseId: WH, role: 'MAIN_WH_ADMIN' };
    await createSubAdmin(extra);
    const [path, init] = requestMock.mock.calls[0]!;
    expect(path).toBe('/admin/sub-warehouse-admins');
    expect(init?.method).toBe('POST');
    expect(init?.body).toEqual({ fullName: 'Arun', mobile: '+919876543210', warehouseId: WH });
    expect(init).not.toHaveProperty('idempotencyKey');
  });

  it('documents WAREHOUSE_REQUIRED and CONFLICT among its error codes', () => {
    expect(ERROR_CODES).toContain('WAREHOUSE_REQUIRED');
    expect(ERROR_CODES).toContain('CONFLICT');
  });
});
