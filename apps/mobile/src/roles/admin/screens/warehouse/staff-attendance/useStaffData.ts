import { useCallback, useEffect, useState } from 'react';
import {
  getStaff,
  listStaff,
  updateStaff,
  type CreateStaffBody,
  type StaffDto,
  type StaffStatus,
  type UpdateStaffBody,
  STAFF_LIST_MAX_LIMIT,
} from '../../../api/staff';
import {
  getAttendanceHistory,
  getAttendanceSummary,
  getRollCall,
  listAttendance,
  markAttendance,
  type AttendanceDto,
  type AttendanceHistoryDto,
  type AttendanceStatusCode,
  type AttendanceSummaryDto,
  type MarkAttendanceBody,
  type RollCallDto,
} from '../../../api/attendance';
import {
  mapAttendanceDtoToHistoryEntry,
  mapAttendanceDtoToRecord,
  mapRollCallItemDtoToRecord,
  mapStaffAttendanceCountsToMonthSummary,
  mapStaffDtoToMember,
} from './mappers';
import type {
  AttendanceHistoryEntry,
  AttendanceRecord,
  StaffMember,
  StaffMonthSummary,
  WarehouseScope,
} from './types';

/** Formats date in YYYY-MM-DD for IST. */
export function getTodayIstDateString(): string {
  try {
    const d = new Date();
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  } catch {
    return new Date().toISOString().split('T')[0] ?? '';
  }
}

/** Formats current month as YYYY-MM for IST. */
export function getCurrentIstMonthString(): string {
  const full = getTodayIstDateString();
  return full.slice(0, 7);
}

function resolveWarehouseId(scope?: WarehouseScope, selectedWarehouseId?: string): string | undefined {
  if (scope?.warehouseId) {
    return scope.warehouseId;
  }
  if (!selectedWarehouseId || selectedWarehouseId === 'ALL') {
    return undefined;
  }
  return selectedWarehouseId;
}

export function useStaffList(
  scope?: WarehouseScope,
  selectedWarehouseId?: string,
  status?: StaffStatus,
  q?: string,
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<StaffMember[]>([]);

  const warehouseId = resolveWarehouseId(scope, selectedWarehouseId);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listStaff({
        warehouseId,
        status,
        q: q?.trim() || undefined,
        limit: STAFF_LIST_MAX_LIMIT,
      });
      const mapped = (res.items ?? []).map(mapStaffDtoToMember);
      setMembers(mapped);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load staff list');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [warehouseId, status, q]);

  useEffect(() => {
    void fetchStaff();
  }, [fetchStaff]);

  return { members, loading, error, refetch: fetchStaff };
}

export function useStaffDetail(staffId?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staff, setStaff] = useState<StaffMember | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!staffId) {
      setStaff(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getStaff(staffId);
      setStaff(mapStaffDtoToMember(res));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load staff member');
      setStaff(null);
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  return { staff, loading, error, refetch: fetchDetail };
}

export function useRollCall(
  scope?: WarehouseScope,
  selectedWarehouseId?: string,
  date?: string,
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rollCall, setRollCall] = useState<RollCallDto | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  const warehouseId = resolveWarehouseId(scope, selectedWarehouseId);

  const fetchRollCall = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getRollCall({
        warehouseId,
        date: date || undefined,
      });
      setRollCall(res);
      const mapped = (res.items ?? []).map(mapRollCallItemDtoToRecord);
      setRecords(mapped);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load roll call');
      setRollCall(null);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [warehouseId, date]);

  useEffect(() => {
    void fetchRollCall();
  }, [fetchRollCall]);

  const summary = rollCall?.summary ?? {
    present: 0,
    absent: 0,
    leave: 0,
    notMarked: 0,
    total: 0,
  };

  // Enforces negative rule: staffCount as own field -> derive from attendance roll-call summary.total
  const staffCount = summary.total;

  return {
    rollCall,
    records,
    summary,
    staffCount,
    loading,
    error,
    refetch: fetchRollCall,
  };
}

export function useAttendanceSummary(
  scope?: WarehouseScope,
  selectedWarehouseId?: string,
  month?: string,
  staffId?: string,
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<AttendanceSummaryDto | null>(null);
  const [staffSummaries, setStaffSummaries] = useState<StaffMonthSummary[]>([]);

  const warehouseId = resolveWarehouseId(scope, selectedWarehouseId);
  const effectiveMonth = month ?? getCurrentIstMonthString();

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAttendanceSummary({
        warehouseId,
        month: effectiveMonth,
        staffId,
      });
      setSummary(res);
      const label = effectiveMonth;
      const mapped = (res.byStaff ?? []).map((s) => mapStaffAttendanceCountsToMonthSummary(s, label));
      setStaffSummaries(mapped);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load attendance summary');
      setSummary(null);
      setStaffSummaries([]);
    } finally {
      setLoading(false);
    }
  }, [warehouseId, effectiveMonth, staffId]);

  useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  return { summary, staffSummaries, loading, error, refetch: fetchSummary };
}

export function useAttendanceHistoryList(
  scope?: WarehouseScope,
  selectedWarehouseId?: string,
  staffId?: string,
  from?: string,
  to?: string,
  status?: AttendanceStatusCode,
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<AttendanceHistoryEntry[]>([]);

  const warehouseId = resolveWarehouseId(scope, selectedWarehouseId);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listAttendance({
        warehouseId,
        staffId,
        from,
        to,
        status,
        limit: 100,
      });
      const mapped = (res.items ?? []).map(mapAttendanceDtoToHistoryEntry);
      setEntries(mapped);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load attendance history');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [warehouseId, staffId, from, to, status]);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  return { entries, loading, error, refetch: fetchHistory };
}

export function useUpdateStaff() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (id: string, body: UpdateStaffBody) => {
    setLoading(true);
    setError(null);
    try {
      const res = await updateStaff(id, body);
      return res;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update staff';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { update, loading, error };
}

export function useMarkAttendance() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mark = useCallback(async (staffId: string, date: string, body: MarkAttendanceBody) => {
    setLoading(true);
    setError(null);
    try {
      const res = await markAttendance(staffId, date, body);
      return res;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to mark attendance';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { mark, loading, error };
}
