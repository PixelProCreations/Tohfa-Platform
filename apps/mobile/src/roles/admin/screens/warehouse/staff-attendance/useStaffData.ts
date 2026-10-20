/**
 * Live data for the staff & attendance screens. Thin TanStack Query wrappers
 * over roles/admin/api/staff.ts and api/attendance.ts; every decision (scope
 * filter, mapping, dates, request bodies) lives in ./mappers.ts, which is tested.
 *
 * Keys are adminKeys.scoped(module, warehouseId, ...), so one warehouse's rows
 * never answer another warehouse's query (BR-30). Each hook takes `enabled`,
 * so a caller without the permission never sends the request (Sub would 403).
 * A staff write invalidates staff and attendance (the roll call lists active
 * staff); an attendance write invalidates attendance.
 */
import { useCallback, useMemo } from 'react';
import type { QueryKey } from '@tanstack/react-query';
import {
  getAttendanceHistory,
  getAttendanceSummary,
  getRollCall,
  listAttendance,
  markAttendance,
  markAttendanceBulk,
  type AttendanceDto,
  type AttendanceListDto,
  type BulkAttendanceBody,
  type MarkAttendanceBody,
} from '../../../api/attendance';
import { useAdminMutation, useAdminQuery, useCursorList } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import {
  createStaff,
  deactivateStaff,
  getStaff,
  listStaff,
  updateStaff,
  type CreateStaffBody,
  type StaffDto,
  type StaffStatus,
  type UpdateStaffBody,
} from '../../../api/staff';
import { useWarehouseOptions } from '../shared/useWarehouseOptions';
import {
  makeWarehouseNameOf,
  STAFF_CODES,
  toAttendanceChanges,
  toHistoryEntry,
  toRollCallRows,
  toStaffMember,
  toSummaryRows,
  type WarehouseNameOf,
} from './mappers';
import type { PermissionCheck, WarehouseScope } from './types';

export const STAFF_MODULE = 'warehouseStaff';
export const ATTENDANCE_MODULE = 'staffAttendance';
const PAGE_LIMIT = 20;

const STAFF_WRITE_INVALIDATES: readonly QueryKey[] = [adminKeys.module(STAFF_MODULE), adminKeys.module(ATTENDANCE_MODULE)];
const ATTENDANCE_WRITE_INVALIDATES: readonly QueryKey[] = [adminKeys.module(ATTENDANCE_MODULE)];

/** Warehouse options and names. Only a holder of warehouse.all.view asks GET /warehouses. */
export function useStaffWarehouses(scope: WarehouseScope, can: PermissionCheck) {
  const list = useWarehouseOptions({ enabled: can(STAFF_CODES.warehouseList) });
  const nameOf = useMemo<WarehouseNameOf>(() => makeWarehouseNameOf(scope, list.options), [scope, list.options]);
  return { ...list, nameOf };
}

export function useStaffList(
  scope: WarehouseScope,
  filters: { warehouseId: string | undefined; status: StaffStatus | undefined; q: string },
  nameOf: WarehouseNameOf,
  enabled: boolean,
) {
  const map = useCallback((dto: StaffDto) => toStaffMember(dto, nameOf), [nameOf]);
  return useCursorList(
    adminKeys.scoped(STAFF_MODULE, scope.warehouseId, { resource: 'list', ...filters }),
    (cursor, signal) => listStaff({ ...filters, cursor, limit: PAGE_LIMIT }, signal),
    map,
    { enabled },
  );
}

export function useStaffDetail(scope: WarehouseScope, staffId: string | undefined, nameOf: WarehouseNameOf, enabled: boolean) {
  const on = enabled && staffId !== undefined;
  const query = useAdminQuery(
    adminKeys.scoped(STAFF_MODULE, scope.warehouseId, { resource: 'detail', id: staffId ?? '' }),
    (signal) => getStaff(staffId ?? '', signal),
    { enabled: on },
  );
  const member = useMemo(() => (query.data === undefined ? undefined : toStaffMember(query.data, nameOf)), [query.data, nameOf]);
  return {
    member,
    isLoading: on && query.isPending,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
  };
}

export function useRollCall(
  scope: WarehouseScope,
  date: string,
  warehouseId: string | undefined,
  nameOf: WarehouseNameOf,
  now: Date,
  enabled: boolean,
) {
  const query = useAdminQuery(
    adminKeys.scoped(ATTENDANCE_MODULE, scope.warehouseId, { resource: 'roll-call', date, warehouseId }),
    (signal) => getRollCall({ date, warehouseId }, signal),
    { enabled },
  );
  const rows = useMemo(() => (query.data === undefined ? [] : toRollCallRows(query.data, nameOf, now)), [query.data, nameOf, now]);
  return {
    rows,
    summary: query.data?.summary,
    isLoading: enabled && query.isPending,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
  };
}

export function useAttendanceSummary(
  scope: WarehouseScope,
  params: { staffId?: string | undefined; warehouseId?: string | undefined; month?: string | undefined; from?: string | undefined; to?: string | undefined },
  enabled: boolean,
) {
  const query = useAdminQuery(
    adminKeys.scoped(ATTENDANCE_MODULE, scope.warehouseId, { resource: 'summary', ...params }),
    (signal) => getAttendanceSummary(params, signal),
    { enabled },
  );
  const rows = useMemo(() => (query.data === undefined ? [] : toSummaryRows(query.data)), [query.data]);
  return {
    totals: query.data?.totals,
    rows,
    isLoading: enabled && query.isPending,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
  };
}

/** Attendance rows over a range, newest day first; `firstPage.summary` holds the exact counts. */
export function useAttendanceList(
  scope: WarehouseScope,
  params: { staffId?: string | undefined; warehouseId?: string | undefined; from: string; to: string },
  now: Date,
  enabled: boolean,
) {
  const map = useCallback((dto: AttendanceDto) => toHistoryEntry(dto, now), [now]);
  return useCursorList<AttendanceDto, ReturnType<typeof toHistoryEntry>, AttendanceListDto>(
    adminKeys.scoped(ATTENDANCE_MODULE, scope.warehouseId, { resource: 'list', ...params }),
    (cursor, signal) => listAttendance({ ...params, cursor, limit: PAGE_LIMIT }, signal),
    map,
    { enabled },
  );
}

/** One staff member's mark on one day (null when not marked). */
export function useAttendanceDay(scope: WarehouseScope, staffId: string, date: string, enabled: boolean) {
  const query = useAdminQuery(
    adminKeys.scoped(ATTENDANCE_MODULE, scope.warehouseId, { resource: 'day', staffId, date }),
    (signal) => listAttendance({ staffId, from: date, to: date, limit: 1 }, signal),
    { enabled },
  );
  return {
    row: query.data === undefined ? undefined : (query.data.items[0] ?? null),
    isLoading: enabled && query.isPending,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
  };
}

export function useAttendanceChanges(scope: WarehouseScope, staffId: string, date: string, now: Date, enabled: boolean) {
  const query = useAdminQuery(
    adminKeys.scoped(ATTENDANCE_MODULE, scope.warehouseId, { resource: 'history', staffId, date }),
    (signal) => getAttendanceHistory(staffId, date, signal),
    { enabled },
  );
  const changes = useMemo(() => (query.data === undefined ? [] : toAttendanceChanges(query.data, now)), [query.data, now]);
  return { changes, isLoading: enabled && query.isPending, error: query.error };
}

export function useCreateStaffMutation() {
  return useAdminMutation({
    mutationFn: (body: CreateStaffBody) => createStaff(body),
    invalidates: STAFF_WRITE_INVALIDATES,
  });
}

export function useUpdateStaffMutation() {
  return useAdminMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateStaffBody }) => updateStaff(id, body),
    invalidates: STAFF_WRITE_INVALIDATES,
  });
}

export function useDeactivateStaffMutation() {
  return useAdminMutation({
    mutationFn: (id: string) => deactivateStaff(id),
    invalidates: STAFF_WRITE_INVALIDATES,
  });
}

export function useMarkAttendanceMutation() {
  return useAdminMutation({
    mutationFn: ({ staffId, date, body }: { staffId: string; date: string; body: MarkAttendanceBody }) => markAttendance(staffId, date, body),
    invalidates: ATTENDANCE_WRITE_INVALIDATES,
  });
}

/** Sends each chunk in turn; a failed chunk stops the rest (each chunk is all-or-nothing). */
export function useBulkAttendanceMutation() {
  return useAdminMutation({
    mutationFn: async ({ date, chunks }: { date: string; chunks: readonly BulkAttendanceBody['entries'][] }) => {
      let created = 0;
      for (const entries of chunks) {
        const result = await markAttendanceBulk(date, { entries });
        created += result.created;
      }
      return created;
    },
    invalidates: ATTENDANCE_WRITE_INVALIDATES,
  });
}
