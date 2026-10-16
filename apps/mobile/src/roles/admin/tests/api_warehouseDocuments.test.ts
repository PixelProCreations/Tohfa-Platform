/**
 * roles/admin/api/warehouseDocuments.ts (BR-105) and roles/admin/api/warehouseSettings.ts
 * (BR-66, BR-80). The shell client is mocked (same pattern as api_profile.test.ts), so these
 * tests pin exactly what goes on the wire. Ids are uuids; capacity is a decimal string.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as ClientModule from '../../../shell/api/client';

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return { ...actual, request: vi.fn(async () => ({})) };
});

import { request } from '../../../shell/api/client';
import {
  archiveWarehouseDocument,
  createWarehouseDocument,
  getWarehouseDocument,
  listWarehouseDocuments,
  updateWarehouseDocument,
} from '../api/warehouseDocuments';
import { setWarehouseCapacity, updateWarehouseProfile, type OperatingHoursDto } from '../api/warehouseSettings';

const requestMock = vi.mocked(request);
const WH = '3f1b7c2e-2a44-4f0e-9b1a-6b0d2f0f1a01';
const DOC = '9a8b7c6d-1111-4222-8333-444455556666';
const UPLOAD = '0f0e0d0c-aaaa-4bbb-8ccc-dddddddddddd';

function lastCall(): [string, Record<string, unknown>] {
  const call = requestMock.mock.calls[requestMock.mock.calls.length - 1]!;
  return [call[0] as string, call[1] as unknown as Record<string, unknown>];
}

beforeEach(() => {
  requestMock.mockReset();
  requestMock.mockResolvedValue({});
});

describe('warehouse documents (BR-105)', () => {
  it('BR-105: lists one warehouse by its uuid with the server filters as query params', async () => {
    await listWarehouseDocuments(WH, { status: 'EXPIRING_SOON', docType: 'FSSAI', q: '  fire  ', page: 2, pageSize: 50 });
    const [path, init] = lastCall();
    expect(path.startsWith(`/warehouses/${WH}/documents?`)).toBe(true);
    expect(path).toContain('status=EXPIRING_SOON');
    expect(path).toContain('docType=FSSAI');
    expect(path).toContain('q=fire');
    expect(path).toContain('page=2');
    expect(path).toContain('pageSize=50');
    expect(init['method']).toBe('GET');
  });

  it('sends no blank search and no unset filter', async () => {
    await listWarehouseDocuments(WH, { q: '   ' });
    expect(lastCall()[0]).toBe(`/warehouses/${WH}/documents`);
  });

  it('BR-105: reads one document (the detail carries the signed file URL)', async () => {
    await getWarehouseDocument(WH, DOC);
    const [path, init] = lastCall();
    expect(path).toBe(`/warehouses/${WH}/documents/${DOC}`);
    expect(init['method']).toBe('GET');
  });

  it('BR-105: PATCH sends only the given fields, null clears, no stray key', async () => {
    await updateWarehouseDocument(WH, DOC, { title: 'Fire NOC', expiryDate: null });
    const [path, init] = lastCall();
    expect(path).toBe(`/warehouses/${WH}/documents/${DOC}`);
    expect(init['method']).toBe('PATCH');
    expect(init['body']).toEqual({ title: 'Fire NOC', expiryDate: null });
    expect(init['idempotencyKey']).toBeUndefined();
  });

  it('refuses an empty edit before the server 422', async () => {
    await expect(updateWarehouseDocument(WH, DOC, {})).rejects.toBeInstanceOf(RangeError);
    expect(requestMock).not.toHaveBeenCalled();
  });

  it('BR-105: archive is a POST to .../archive', async () => {
    await archiveWarehouseDocument(WH, DOC);
    const [path, init] = lastCall();
    expect(path).toBe(`/warehouses/${WH}/documents/${DOC}/archive`);
    expect(init['method']).toBe('POST');
  });

  it('create posts the metadata with the upload id', async () => {
    await createWarehouseDocument(WH, { docType: 'LEASE', title: 'Lease', uploadId: UPLOAD });
    const [path, init] = lastCall();
    expect(path).toBe(`/warehouses/${WH}/documents`);
    expect(init['method']).toBe('POST');
    expect(init['body']).toEqual({ docType: 'LEASE', title: 'Lease', uploadId: UPLOAD });
  });
});

describe('warehouse settings writes (BR-66, BR-80)', () => {
  it('BR-66: capacity is PATCHed as the decimal string, never a number', async () => {
    await setWarehouseCapacity(WH, '30000.5');
    const [path, init] = lastCall();
    expect(path).toBe(`/warehouses/${WH}/capacity`);
    expect(init['method']).toBe('PATCH');
    expect(init['body']).toEqual({ capacityKg: '30000.5' });
    expect(typeof (init['body'] as { capacityKg: unknown }).capacityKg).toBe('string');
  });

  it('BR-66: refuses a zero, negative or over-precise capacity before any request', async () => {
    for (const bad of ['0', '0.000', '-5', '1.2345', '1234567890', 'abc', '']) {
      await expect(setWarehouseCapacity(WH, bad)).rejects.toBeInstanceOf(RangeError);
    }
    expect(requestMock).not.toHaveBeenCalled();
  });

  it('BR-80: the profile PATCH carries contactPhone and operatingHours only, whatever is passed', async () => {
    const hours: OperatingHoursDto = {
      mon: { closed: false, open: '09:00', close: '18:00' },
      tue: { closed: true },
      wed: { closed: true },
      thu: { closed: true },
      fri: { closed: true },
      sat: { closed: true },
      sun: { closed: true },
    };
    await updateWarehouseProfile(WH, { contactPhone: '+919442180010', operatingHours: hours, name: 'x', capacityKg: '1' } as never);
    const [path, init] = lastCall();
    expect(path).toBe(`/warehouses/${WH}`);
    expect(init['method']).toBe('PATCH');
    expect(init['body']).toEqual({ contactPhone: '+919442180010', operatingHours: hours });
  });

  it('BR-80: null clears the phone; an empty edit is refused', async () => {
    await updateWarehouseProfile(WH, { contactPhone: null });
    expect(lastCall()[1]['body']).toEqual({ contactPhone: null });
    requestMock.mockClear();
    await expect(updateWarehouseProfile(WH, {})).rejects.toBeInstanceOf(RangeError);
    expect(requestMock).not.toHaveBeenCalled();
  });
});
