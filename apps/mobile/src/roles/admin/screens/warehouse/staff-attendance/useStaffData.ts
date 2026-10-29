/**
 * Live data for the staff & attendance screens. Thin wrappers over the admin
 * hooks (../../../api/hooks.ts); every decision lives in ./mappers.ts,
 * ./attendanceDates.ts or ./staffAccess.ts, which are tested.
 *
 * Errors are passed through untouched (`error: unknown`) so a screen renders
 * them with AdminErrorState, which maps the problem code to its i18n message
 * (adminErrorKey). The hand-rolled `err.message` strings this file used to keep
 * dropped the code and showed the server's developer `detail`.
 *
 * The roster and the attendance list walk the cursor to the end (collectPages)
 * instead of stopping at the first 100 rows. The page cap is a guard against a
 * looping cursor, not a business limit; when it trips the result says
 * `complete: false` and the screen says the list may be partial.
 *
 * Every hook takes `enabled`, so a screen the viewer's role cannot use (see
 * ./staffAccess.ts) sends no request instead of collecting a 403.
 */
import { useMemo } from 'react';
import {
  getAttendanceSummary,
  getRollCall,
  listAttendance,
  type AttendanceSummaryDto,
  type RollCallDto,
} from '../../../api/attendance';
import { useAdminMutation, useAdminQuery } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { getStaff, listStaff, STAFF_LIST_MAX_LIMIT, updateStaff, type StaffDto, type UpdateStaffBody } from '../../../api/staff';
import { collectPages } from '../../../../../shell/api/pagination';
import { istMonth } from './attendanceDates';
import {
  mapAttendanceDtoToHistoryEntry,
  mapRollCallItemDtoToRecord,
  mapStaffAttendanceCountsToMonthSummary,
  mapStaffDtoToMember,
  rollCallStatusByStaffId,
} from './mappers';
import type { AttendanceHistoryEntry, AttendanceRecord, AttendanceStatus, StaffMember, StaffMonthSummary, WarehouseScope } from './types';

const STAFF = 'warehouse-staff';
const ATTENDANCE = 'staff-attendance';
/** Guard against a server cursor that never ends; not a business limit. */
const WALK_MAX_PAGES = 50;
const NO_ATTENDANCE: ReadonlyMap<string, AttendanceStatus> = new Map();

export interface StaffQueryState {
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
}

function queryState(query: { isPending: boolean; error: unknown; refetch: () => unknown }, enabled: boolean): StaffQueryState {
  return {
    isLoading: enabled && query.isPending,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
  };
}

/** A Sub scope is always its own warehouse; Main sends the selector's choice (undefined = all). */
function targetWarehouse(scope: WarehouseScope, selectedWarehouseId: string | undefined): string | undefined {
  return scope.warehouseId ?? selectedWarehouseId;
}

/**
 * The whole roster of the warehouse(s) in scope, each card carrying today's
 * roll-call status from `attendanceByStaffId` (BR-84k).
 */
export function useStaffList(
  scope: WarehouseScope,
  selectedWarehouseId: string | undefined,
  attendanceByStaffId: ReadonlyMap<string, AttendanceStatus> | undefined,
  enabled: boolean,
): StaffQueryState & { staff: StaffMember[]; complete: boolean } {
  const warehouseId = targetWarehouse(scope, selectedWarehouseId);
  const query = useAdminQuery(
    adminKeys.scoped(STAFF, warehouseId, { walk: 'all' }),
    (signal) => collectPages((cursor) => listStaff({ warehouseId, cursor, limit: STAFF_LIST_MAX_LIMIT }, signal), WALK_MAX_PAGES),
    { enabled },
  );
  const byStaff = attendanceByStaffId ?? NO_ATTENDANCE;
  const staff = useMemo(() => (query.data?.items ?? []).map((dto: StaffDto) => mapStaffDtoToMember(dto, byStaff)), [query.data, byStaff]);
  return { ...queryState(query, enabled), staff, complete: query.data?.complete ?? true };
}

/** One day's roll call (default: today in IST, decided by the server). */
export function useRollCall(
  scope: WarehouseScope,
  selectedWarehouseId: string | undefined,
  date: string | undefined,
  enabled: boolean,
): StaffQueryState & {
  records: AttendanceRecord[];
  summary: RollCallDto['summary'] | null;
  byStaffId: ReadonlyMap<string, AttendanceStatus> | undefined;
} {
  const warehouseId = targetWarehouse(scope, selectedWarehouseId);
  const query = useAdminQuery(
    adminKeys.scoped(ATTENDANCE, warehouseId, { resource: 'roll-call', date: date ?? 'today' }),
    (signal) => getRollCall({ warehouseId, date }, signal),
    { enabled },
  );
  const records = useMemo(() => (query.data?.items ?? []).map(mapRollCallItemDtoToRecord), [query.data]);
  const byStaffId = useMemo(() => (query.data ? rollCallStatusByStaffId(query.data.items) : undefined), [query.data]);
  return { ...queryState(query, enabled), records, summary: query.data?.summary ?? null, byStaffId };
}

export function useStaffDetail(staffId: string | undefined, enabled: boolean): StaffQueryState & { staff: StaffMember | null } {
  const on = enabled && staffId !== undefined && staffId !== '';
  const query = useAdminQuery(adminKeys.detail(STAFF, staffId ?? ''), (signal) => getStaff(staffId ?? '', signal), { enabled: on });
  const staff = useMemo(() => (query.data ? mapStaffDtoToMember(query.data) : null), [query.data]);
  return { ...queryState(query, on), staff };
}

/** `month` (YYYY-MM) or a from/to span; neither = the current IST month. */
export interface AttendanceSpan {
  month?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
}

export function useAttendanceSummary(
  scope: WarehouseScope,
  selectedWarehouseId: string | undefined,
  span: AttendanceSpan,
  staffId: string | undefined,
  enabled: boolean,
): StaffQueryState & { summaries: StaffMonthSummary[]; totals: AttendanceSummaryDto['totals'] | null } {
  const warehouseId = targetWarehouse(scope, selectedWarehouseId);
  const byRange = span.from !== undefined && span.to !== undefined;
  // The IST month, never toISOString(): that is the UTC month until 05:30 IST on the 1st.
  const month = byRange ? undefined : (span.month ?? istMonth(new Date()));
  const params = { staffId, warehouseId, month, from: byRange ? span.from : undefined, to: byRange ? span.to : undefined };
  const query = useAdminQuery(
    adminKeys.scoped(ATTENDANCE, warehouseId, { resource: 'summary', staffId, month, from: params.from, to: params.to }),
    (signal) => getAttendanceSummary(params, signal),
    { enabled },
  );
  const label = month ?? `${params.from ?? ''} – ${params.to ?? ''}`;
  const summaries = useMemo(
    () => (query.data?.byStaff ?? []).map((s) => mapStaffAttendanceCountsToMonthSummary(s, label)),
    [query.data, label],
  );
  return { ...queryState(query, enabled), summaries, totals: query.data?.totals ?? null };
}

/** Every attendance row from `from` to `to` (inclusive), newest day first. */
export function useAttendanceHistoryList(
  scope: WarehouseScope,
  selectedWarehouseId: string | undefined,
  from: string,
  to: string,
  enabled: boolean,
): StaffQueryState & { entries: AttendanceHistoryEntry[]; complete: boolean } {
  const warehouseId = targetWarehouse(scope, selectedWarehouseId);
  const query = useAdminQuery(
    adminKeys.scoped(ATTENDANCE, warehouseId, { resource: 'list', from, to, walk: 'all' }),
    (signal) =>
      collectPages(
        async (cursor) => {
          const page = await listAttendance({ warehouseId, from, to, cursor, limit: STAFF_LIST_MAX_LIMIT }, signal);
          return { items: page.items, page: page.page };
        },
        WALK_MAX_PAGES,
      ),
    { enabled },
  );
  const entries = useMemo(() => (query.data?.items ?? []).map(mapAttendanceDtoToHistoryEntry), [query.data]);
  return { ...queryState(query, enabled), entries, complete: query.data?.complete ?? true };
}

/** PATCH a staff record (admin.staff.manage); a success refetches every roster and attendance query. */
export function useUpdateStaff() {
  const mutation = useAdminMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateStaffBody }) => updateStaff(id, body),
    invalidates: [adminKeys.module(STAFF), adminKeys.module(ATTENDANCE)],
  });
  return {
    update: async (id: string, body: UpdateStaffBody): Promise<StaffMember> => mapStaffDtoToMember(await mutation.mutateAsync({ id, body })),
    isSaving: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
