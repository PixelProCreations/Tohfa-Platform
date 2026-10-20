/**
 * roles/admin/api/staff.ts and api/attendance.ts: the /admin/warehouse-staff
 * and /admin/staff-attendance clients (BR-83, BR-84). The shell client is
 * mocked, so these tests pin exactly what goes on the wire: paths, methods,
 * query strings and bodies, and that no Idempotency-Key is sent (the spec
 * declares none: the marks are upserts and the staff writes move no money).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as ClientModule from '../../../shell/api/client';

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return { ...actual, request: vi.fn(async () => ({ items: [], page: { nextCursor: null, hasMore: false } })) };
});

import { request } from '../../../shell/api/client';
import {
  ERROR_CODES as ATTENDANCE_ERROR_CODES,
  getAttendanceHistory,
  getAttendanceSummary,
  getRollCall,
  listAttendance,
  markAttendance,
  markAttendanceBulk,
} from '../api/attendance';
import { ADMIN_REQUEST_TIMEOUT_MS } from '../api/http';
import { ERROR_CODES as STAFF_ERROR_CODES, createStaff, deactivateStaff, getStaff, listStaff, updateStaff } from '../api/staff';
import { hasKey } from '../i18n';

const requestMock = vi.mocked(request);
const WH = '11111111-1111-4111-8111-111111111111';
const STAFF = '22222222-2222-4222-8222-222222222222';

function lastCall() {
  const call = requestMock.mock.calls.at(-1);
  if (call === undefined) throw new Error('no request');
  return { path: call[0], options: call[1] ?? {} };
}

beforeEach(() => requestMock.mockClear());

describe('staff roster client', () => {
  it('GETs /admin/warehouse-staff with no query by default', async () => {
    await listStaff();
    expect(lastCall().path).toBe('/admin/warehouse-staff');
    expect(lastCall().options).toMatchObject({ method: 'GET', timeoutMs: ADMIN_REQUEST_TIMEOUT_MS });
  });

  it('BR-83e: sends only the server filters (warehouseId, status, q, cursor, limit)', async () => {
    await listStaff({ warehouseId: WH, status: 'ACTIVE', q: ' Ravi ', cursor: 'c1', limit: 20 });
    expect(lastCall().path).toBe(`/admin/warehouse-staff?warehouseId=${WH}&status=ACTIVE&q=Ravi&cursor=c1&limit=20`);
  });

  it('drops a blank search (the server needs at least one character)', async () => {
    await listStaff({ q: '   ' });
    expect(lastCall().path).toBe('/admin/warehouse-staff');
  });

  it('GETs one member by encoded id', async () => {
    await getStaff(STAFF);
    expect(lastCall().path).toBe(`/admin/warehouse-staff/${STAFF}`);
  });

  it('BR-83c: create POSTs the documented body with no Idempotency-Key', async () => {
    const body = { fullName: 'Ravi', designation: 'Loader', joinedOn: '2026-10-01', warehouseId: WH, status: 'ACTIVE' as const };
    await createStaff(body);
    expect(lastCall().path).toBe('/admin/warehouse-staff');
    expect(lastCall().options).toMatchObject({ method: 'POST', body });
    expect(lastCall().options.idempotencyKey).toBeUndefined();
  });

  it('BR-83g: update PATCHes only the given fields; a null phone clears it', async () => {
    await updateStaff(STAFF, { phone: null });
    expect(lastCall().path).toBe(`/admin/warehouse-staff/${STAFF}`);
    expect(lastCall().options).toMatchObject({ method: 'PATCH', body: { phone: null } });
  });

  it('BR-83h: deactivate POSTs no body to /deactivate', async () => {
    await deactivateStaff(STAFF);
    expect(lastCall().path).toBe(`/admin/warehouse-staff/${STAFF}/deactivate`);
    expect(lastCall().options).toMatchObject({ method: 'POST' });
    expect(lastCall().options.body).toBeUndefined();
  });
});

describe('attendance client', () => {
  it('BR-84k: roll call GETs /roll-call with the date and warehouse', async () => {
    await getRollCall({ date: '2026-10-14', warehouseId: WH });
    expect(lastCall().path).toBe(`/admin/staff-attendance/roll-call?date=2026-10-14&warehouseId=${WH}`);
    expect(lastCall().options).toMatchObject({ method: 'GET' });
  });

  it('BR-84b: summary sends a month, or a from/to pair, never both', async () => {
    await getAttendanceSummary({ staffId: STAFF, month: '2026-10', from: '2026-10-01', to: '2026-10-14' });
    expect(lastCall().path).toBe(`/admin/staff-attendance/summary?staffId=${STAFF}&month=2026-10`);
    await getAttendanceSummary({ warehouseId: WH, from: '2026-10-01', to: '2026-10-14' });
    expect(lastCall().path).toBe(`/admin/staff-attendance/summary?warehouseId=${WH}&from=2026-10-01&to=2026-10-14`);
  });

  it('BR-84l: list sends staff, warehouse, status, range, cursor and limit', async () => {
    await listAttendance({ staffId: STAFF, warehouseId: WH, status: 'ABSENT', from: '2026-10-01', to: '2026-10-14', cursor: 'c', limit: 20 });
    expect(lastCall().path).toBe(
      `/admin/staff-attendance?staffId=${STAFF}&warehouseId=${WH}&status=ABSENT&from=2026-10-01&to=2026-10-14&cursor=c&limit=20`,
    );
  });

  it('BR-84e: history GETs the day history path', async () => {
    await getAttendanceHistory(STAFF, '2026-10-14');
    expect(lastCall().path).toBe(`/admin/staff-attendance/staff/${STAFF}/2026-10-14/history`);
  });

  it('BR-84d: mark PUTs the upsert with no Idempotency-Key (a replay is safe by itself)', async () => {
    const body = { status: 'PRESENT' as const, checkIn: '2026-10-14T03:30:00.000Z' };
    await markAttendance(STAFF, '2026-10-14', body);
    expect(lastCall().path).toBe(`/admin/staff-attendance/staff/${STAFF}/2026-10-14`);
    expect(lastCall().options).toMatchObject({ method: 'PUT', body });
    expect(lastCall().options.idempotencyKey).toBeUndefined();
  });

  it('BR-84j: bulk PUTs every entry for one date', async () => {
    const body = { entries: [{ staffId: STAFF, status: 'LEAVE' as const }] };
    await markAttendanceBulk('2026-10-14', body);
    expect(lastCall().path).toBe('/admin/staff-attendance/dates/2026-10-14');
    expect(lastCall().options).toMatchObject({ method: 'PUT', body });
    expect(lastCall().options.idempotencyKey).toBeUndefined();
  });
});

describe('ERROR_CODES', () => {
  it('every documented problem code has an admin-facing string', () => {
    for (const code of [...STAFF_ERROR_CODES, ...ATTENDANCE_ERROR_CODES]) {
      expect({ code, has: hasKey(`admin.error.${code}`) }).toEqual({ code, has: true });
    }
  });
});
