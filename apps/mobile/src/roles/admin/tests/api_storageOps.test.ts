/**
 * The storage-ops API modules: roles/admin/api/warehouseIssues.ts (BR-103),
 * warehouseActivity.ts (BR-104), storageLocations.ts (BR-79) and
 * warehouseOps.ts (BR-80 performance, BR-66b capacity write). The shell
 * client is mocked (same pattern as api_profile.test.ts), so these pin exactly
 * what goes on the wire: paths, query strings and request bodies.
 *
 * None of these routes moves money, so none sends an Idempotency-Key. Every
 * route takes the warehouse uuid in the path (BR-30: a Sub screen only ever
 * sends scope.warehouseId; storageWarehouseId pins it, see
 * mappers_storageOps.test.ts).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as ClientModule from '../../../shell/api/client';

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return { ...actual, request: vi.fn(async () => ({})) };
});

import { request } from '../../../shell/api/client';
import { ADMIN_REQUEST_TIMEOUT_MS } from '../api/http';
import { createStorageLocation, getStorageLocation, updateStorageLocation } from '../api/storageLocations';
import { listWarehouseActivity } from '../api/warehouseActivity';
import {
  addWarehouseIssueComment,
  createWarehouseIssue,
  getWarehouseIssue,
  listWarehouseIssues,
  updateWarehouseIssue,
  ERROR_CODES as ISSUE_ERROR_CODES,
} from '../api/warehouseIssues';
import { getWarehousePerformance, updateWarehouseCapacity } from '../api/warehouseOps';
import { hasKey } from '../i18n';

const requestMock = vi.mocked(request);

const WH = '3f1b7c2e-2a44-4f0e-9b1a-6b0d2f0f1a01';
const ISSUE = '5a1b7c2e-2a44-4f0e-9b1a-6b0d2f0f1a02';
const LOC = '6a1b7c2e-2a44-4f0e-9b1a-6b0d2f0f1a03';
const GET = { method: 'GET', timeoutMs: ADMIN_REQUEST_TIMEOUT_MS };

beforeEach(() => {
  vi.clearAllMocks();
});

function lastCall(): [string, Record<string, unknown>] {
  const call = requestMock.mock.calls.at(-1);
  if (call === undefined) throw new Error('request() was not called');
  return [call[0], call[1] as Record<string, unknown>];
}

describe('warehouseIssues (BR-103)', () => {
  it('BR-103: lists a warehouse\'s issues by uuid with the server filters and number paging', async () => {
    await listWarehouseIssues(WH, { status: 'OPEN', severity: 'HIGH', page: 2, pageSize: 50 });
    expect(requestMock).toHaveBeenCalledWith(`/warehouses/${WH}/issues?status=OPEN&severity=HIGH&page=2&pageSize=50`, GET);
  });

  it('sends no query string when no filter is given', async () => {
    await listWarehouseIssues(WH);
    expect(requestMock).toHaveBeenCalledWith(`/warehouses/${WH}/issues`, GET);
  });

  it('reads one issue (with its comments) under its warehouse', async () => {
    await getWarehouseIssue(WH, ISSUE);
    expect(requestMock).toHaveBeenCalledWith(`/warehouses/${WH}/issues/${ISSUE}`, GET);
  });

  it('BR-103: creates an issue with only the documented fields and no Idempotency-Key', async () => {
    await createWarehouseIssue(WH, {
      category: 'EQUIPMENT',
      severity: 'HIGH',
      title: 'Scale drift',
      description: 'Bay 2',
      ...({ warehouseId: 'x', reportedBy: 'y' } as object),
    } as Parameters<typeof createWarehouseIssue>[1]);
    const [path, init] = lastCall();
    expect(path).toBe(`/warehouses/${WH}/issues`);
    expect(init['method']).toBe('POST');
    expect(init['idempotencyKey']).toBeUndefined();
    expect(JSON.parse(JSON.stringify(init['body']))).toEqual({
      category: 'EQUIPMENT',
      severity: 'HIGH',
      title: 'Scale drift',
      description: 'Bay 2',
    });
  });

  it('BR-103: resolving is a PATCH to RESOLVED with the resolution note (there is no /resolve route)', async () => {
    await updateWarehouseIssue(WH, ISSUE, { status: 'RESOLVED', resolutionNote: 'Recalibrated' });
    const [path, init] = lastCall();
    expect(path).toBe(`/warehouses/${WH}/issues/${ISSUE}`);
    expect(init['method']).toBe('PATCH');
    expect(JSON.parse(JSON.stringify(init['body']))).toEqual({ status: 'RESOLVED', resolutionNote: 'Recalibrated' });
  });

  it('BR-103: a comment is POST .../comments with { body }', async () => {
    await addWarehouseIssueComment(WH, ISSUE, 'Technician booked');
    const [path, init] = lastCall();
    expect(path).toBe(`/warehouses/${WH}/issues/${ISSUE}/comments`);
    expect(init['method']).toBe('POST');
    expect(init['body']).toEqual({ body: 'Technician booked' });
  });

  it('every documented problem code has an admin error string', () => {
    for (const code of ISSUE_ERROR_CODES) expect({ code, has: hasKey(`admin.error.${code}`) }).toEqual({ code, has: true });
  });
});

describe('warehouseActivity (BR-104)', () => {
  it('BR-104: sends type as ONE comma-separated parameter, de-duplicated', async () => {
    await listWarehouseActivity(WH, { types: ['ISSUE', 'RETURN', 'ISSUE'] });
    expect(requestMock).toHaveBeenCalledWith(`/warehouses/${WH}/activity?type=ISSUE%2CRETURN`, GET);
  });

  it('BR-104: sends from and to only together', async () => {
    await listWarehouseActivity(WH, { from: '2026-10-14' });
    expect(requestMock).toHaveBeenLastCalledWith(`/warehouses/${WH}/activity`, GET);
    await listWarehouseActivity(WH, { from: '2026-10-14', to: '2026-10-14', cursor: 'abc', limit: 100 });
    expect(requestMock).toHaveBeenLastCalledWith(`/warehouses/${WH}/activity?from=2026-10-14&to=2026-10-14&cursor=abc&limit=100`, GET);
  });

  it('an empty type list sends no type filter', async () => {
    await listWarehouseActivity(WH, { types: [] });
    expect(requestMock).toHaveBeenLastCalledWith(`/warehouses/${WH}/activity`, GET);
  });
});

describe('storageLocations (BR-79)', () => {
  it('reads one location under its warehouse', async () => {
    await getStorageLocation(WH, LOC);
    expect(requestMock).toHaveBeenCalledWith(`/warehouses/${WH}/storage-locations/${LOC}`, GET);
  });

  it('BR-79: creates a location with a kg STRING capacity', async () => {
    await createStorageLocation(WH, { code: 'CS-A', name: 'Cold A', locationType: 'COLD', capacityKg: '500.000' });
    const [path, init] = lastCall();
    expect(path).toBe(`/warehouses/${WH}/storage-locations`);
    expect(init['method']).toBe('POST');
    expect(init['body']).toEqual({ code: 'CS-A', name: 'Cold A', locationType: 'COLD', capacityKg: '500.000' });
  });

  it('BR-79: a PATCH never sends the (immutable) code', async () => {
    await updateStorageLocation(WH, LOC, { isActive: false, ...({ code: 'X' } as object) });
    const [path, init] = lastCall();
    expect(path).toBe(`/warehouses/${WH}/storage-locations/${LOC}`);
    expect(init['method']).toBe('PATCH');
    expect(JSON.parse(JSON.stringify(init['body']))).toEqual({ isActive: false });
  });
});

describe('warehouseOps (BR-80, BR-66b)', () => {
  it('BR-80: reads performance for an inclusive date range', async () => {
    await getWarehousePerformance(WH, { from: '2026-10-08', to: '2026-10-14' });
    expect(requestMock).toHaveBeenCalledWith(`/warehouses/${WH}/performance?from=2026-10-08&to=2026-10-14`, GET);
  });

  it('BR-66b: sets capacity with a kg string body', async () => {
    await updateWarehouseCapacity(WH, '12000.000');
    const [path, init] = lastCall();
    expect(path).toBe(`/warehouses/${WH}/capacity`);
    expect(init['method']).toBe('PATCH');
    expect(init['body']).toEqual({ capacityKg: '12000.000' });
  });
});
