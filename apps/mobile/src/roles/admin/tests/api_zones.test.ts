/**
 * roles/admin/api/zones.ts: the read-only admin zone API (docs/openapi.yaml
 * tag Platform, BR-161):
 *
 *   GET /admin/zones        zone.view
 *   GET /admin/zones/{id}   zone.view
 *
 * Shell client is mocked (same pattern as api_learning.test.ts).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as ClientModule from '../../../shell/api/client';

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return { ...actual, request: vi.fn(async () => []) };
});

import { request } from '../../../shell/api/client';
import { ERROR_CODES, getAdminZone, listAdminZones, zoneKeys, ZONES_MODULE } from '../api/zones';
import * as zonesApi from '../api/zones';

const requestMock = vi.mocked(request);
const ID = '6f0c6a53-9d1e-4f6e-8a55-1f6b2d0f5a11';

function lastCall() {
  const call = requestMock.mock.calls[requestMock.mock.calls.length - 1];
  if (call === undefined) throw new Error('request was not called');
  return { path: call[0], init: call[1] };
}

describe('roles/admin/api/zones.ts (HTTP contract, BR-161)', () => {
  beforeEach(() => {
    requestMock.mockReset();
    requestMock.mockResolvedValue([]);
  });

  it('BR-161: lists every zone, active and inactive, from /admin/zones (never the public /zones)', async () => {
    await listAdminZones({ status: 'ALL' });
    const { path, init } = lastCall();
    expect(path.startsWith('/admin/zones')).toBe(true);
    expect(path).toContain('status=ALL');
    expect(init?.method).toBe('GET');
  });

  it('sends no query when no filter is given (the server defaults to ACTIVE)', async () => {
    await listAdminZones();
    expect(lastCall().path).toBe('/admin/zones');
  });

  it('passes the warehouse filter', async () => {
    await listAdminZones({ status: 'ACTIVE', warehouseId: ID });
    expect(lastCall().path).toContain(`warehouseId=${ID}`);
  });

  it('BR-161: reads one zone (with its manager) from /admin/zones/{id}', async () => {
    await getAdminZone(ID);
    expect(lastCall().path).toBe(`/admin/zones/${ID}`);
    expect(lastCall().init?.method).toBe('GET');
  });

  it('exports no write: the spec has no zone create, edit, status or location route', () => {
    const names = Object.keys(zonesApi);
    for (const name of names) expect(name, name).not.toMatch(/^(create|update|delete|archive|deactivate|assign|transfer)/i);
  });

  it('documents the problem codes these routes can answer', () => {
    expect(ERROR_CODES).toEqual(expect.arrayContaining(['UNAUTHENTICATED', 'FORBIDDEN', 'NOT_FOUND']));
  });

  it('keys list, detail, warehouses and farmers separately under one module', () => {
    expect(zoneKeys.list('ALL')[1]).toBe(ZONES_MODULE);
    expect(zoneKeys.list('ALL')).not.toEqual(zoneKeys.list('ACTIVE'));
    expect(zoneKeys.detail(ID)).not.toEqual(zoneKeys.detail(undefined));
    expect(zoneKeys.farmers(ID)).not.toEqual(zoneKeys.farmers(null));
    expect(zoneKeys.warehouses()).toEqual(zoneKeys.warehouses());
  });
});
