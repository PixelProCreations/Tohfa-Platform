/**
 * roles/admin/api/roles.ts (GET /roles, BR-109) and api/adminAccounts.ts
 * (POST /admin/accounts, BR-112). Shell client is mocked (same pattern as api_subAdmins.test.ts).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as ClientModule from '../../../shell/api/client';

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return { ...actual, request: vi.fn() };
});

import { request } from '../../../shell/api/client';
import { createAdminAccount } from '../api/adminAccounts';
import { getRole, listRoles } from '../api/roles';

const requestMock = vi.mocked(request);

describe('roles/admin/api/roles.ts', () => {
  beforeEach(() => requestMock.mockReset());

  it('BR-109: GET /roles with no query', async () => {
    requestMock.mockResolvedValue({ items: [] });
    await listRoles();
    const [p, init] = requestMock.mock.calls[0]!;
    expect(p).toBe('/roles');
    expect(init?.method).toBe('GET');
  });

  it('BR-109: GET /roles/{code} encodes the code', async () => {
    requestMock.mockResolvedValue({});
    await getRole('MAIN WH');
    expect(requestMock.mock.calls[0]![0]).toBe('/roles/MAIN%20WH');
  });
});

describe('roles/admin/api/adminAccounts.ts', () => {
  beforeEach(() => requestMock.mockReset());

  it('BR-112: POSTs exactly role, fullName and mobile', async () => {
    requestMock.mockResolvedValue({});
    await createAdminAccount({ role: 'TOHFA_ADMIN', fullName: 'Meena V', mobile: '+919876500001' });
    const [p, init] = requestMock.mock.calls[0]!;
    expect(p).toBe('/admin/accounts');
    expect(init?.method).toBe('POST');
    expect(init?.body).toEqual({ role: 'TOHFA_ADMIN', fullName: 'Meena V', mobile: '+919876500001' });
  });

  it('BR-112: sends zoneId only when given', async () => {
    requestMock.mockResolvedValue({});
    await createAdminAccount({ role: 'FARMER_ADMIN', fullName: 'A', mobile: '+919876500001', zoneId: 'z1' });
    expect(requestMock.mock.calls[0]![1]?.body).toMatchObject({ zoneId: 'z1' });
  });
});
