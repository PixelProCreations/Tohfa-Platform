import { useCallback, useEffect, useState } from 'react';
import {
  type AttendanceCounts,
  type AttendanceHistoryDto,
  type AttendanceStatusCode,
  type MarkAttendanceBody,
  type RollCallDto,
  getAttendanceHistory,
  getAttendanceSummary,
  getRollCall,
  listAttendance,
  markAttendance,
} from '../../../api/attendance';
import {
  type CreateStaffBody,
  type StaffDto,
  type StaffStatus,
  type UpdateStaffBody,
  createStaff,
  deactivateStaff,
  getStaff,
  listStaff,
  updateStaff,
} from '../../../api/staff';
import {
  mapAttendanceDtoToHistoryEntry,
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

export function useStaffList(
  scope: WarehouseScope,
  selectedWarehouseId?: string,
  status?: StaffStatus,
  searchQuery?: string,
) {
  const targetWarehouseId = scope.warehouseId ?? selectedWarehouseId;
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await listStaff({
        warehouseId: targetWarehouseId,
        status,
        q: searchQuery,
        limit: 100,
      });
      setStaff(page.items.map(mapStaffDtoToMember));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch staff');
    } finally {
      setLoading(false);
    }
  }, [targetWarehouseId, status, searchQuery]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  return { staff, loading, error, refresh: fetchStaff };
}

export function useRollCall(
  scope: WarehouseScope,
  selectedWarehouseId?: string,
  date?: string,
) {
  const targetWarehouseId = scope.warehouseId ?? selectedWarehouseId;
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<RollCallDto['summary'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRollCall = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getRollCall({
        warehouseId: targetWarehouseId,
        date,
      });
      setSummary(res.summary);
      setRecords(res.items.map(mapRollCallItemDtoToRecord));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch roll call');
    } finally {
      setLoading(false);
    }
  }, [targetWarehouseId, date]);

  useEffect(() => {
    fetchRollCall();
  }, [fetchRollCall]);

  return {
    records,
    summary,
    // Negative rule: derive staffCount from attendance roll-call summary total
    staffCount: summary?.total ?? 0,
    loading,
    error,
    refresh: fetchRollCall,
  };
}

export function useStaffDetail(staffId?: string) {
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!staffId) {
      setStaff(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const dto = await getStaff(staffId);
      setStaff(mapStaffDtoToMember(dto));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch staff details');
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { staff, loading, error, refresh: fetchDetail };
}

export function useAttendanceSummary(
  scope: WarehouseScope,
  selectedWarehouseId?: string,
  month?: string,
  staffId?: string,
) {
  const targetWarehouseId = scope.warehouseId ?? selectedWarehouseId;
  const [summaries, setSummaries] = useState<StaffMonthSummary[]>([]);
  const [totals, setTotals] = useState<AttendanceCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const effectiveMonth = month ?? new Date().toISOString().slice(0, 7);
      const res = await getAttendanceSummary({
        warehouseId: targetWarehouseId,
        month: effectiveMonth,
        staffId,
      });
      setTotals(res.totals);
      setSummaries(
        res.byStaff.map((s) => mapStaffAttendanceCountsToMonthSummary(s, effectiveMonth)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch attendance summary');
    } finally {
      setLoading(false);
    }
  }, [targetWarehouseId, month, staffId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summaries, totals, loading, error, refresh: fetchSummary };
}

export function useAttendanceHistory(
  scope: WarehouseScope,
  staffId?: string,
  date?: string,
) {
  const [history, setHistory] = useState<AttendanceHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (staffId && date) {
        // Individual day history
        const dto: AttendanceHistoryDto = await getAttendanceHistory(staffId, date);
        // Map individual history items if available, or list attendance for that day
        const res = await listAttendance({
          staffId,
          warehouseId: scope.warehouseId,
          from: date,
          to: date,
        });
        setHistory(res.items.map(mapAttendanceDtoToHistoryEntry));
      } else {
        const res = await listAttendance({
          staffId,
          warehouseId: scope.warehouseId,
          limit: 100,
        });
        setHistory(res.items.map(mapAttendanceDtoToHistoryEntry));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch attendance history');
    } finally {
      setLoading(false);
    }
  }, [scope.warehouseId, staffId, date]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { history, loading, error, refresh: fetchHistory };
}

export function useStaffMutations() {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const mutateUpdate = async (id: string, body: UpdateStaffBody): Promise<StaffMember> => {
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateStaff(id, body);
      return mapStaffDtoToMember(updated);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update staff';
      setSaveError(msg);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const mutateDeactivate = async (id: string): Promise<StaffMember> => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await deactivateStaff(id);
      return mapStaffDtoToMember(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to deactivate staff';
      setSaveError(msg);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const mutateMarkAttendance = async (
    staffId: string,
    date: string,
    body: MarkAttendanceBody,
  ) => {
    setSaving(true);
    setSaveError(null);
    try {
      return await markAttendance(staffId, date, body);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to mark attendance';
      setSaveError(msg);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return {
    saving,
    saveError,
    updateStaff: mutateUpdate,
    deactivateStaff: mutateDeactivate,
    markAttendance: mutateMarkAttendance,
  };
}

export function useUpdateStaff() {
  const { updateStaff, saving, saveError } = useStaffMutations();
  return { update: updateStaff, loading: saving, error: saveError };
}

export function useMarkAttendance() {
  const { markAttendance, saving, saveError } = useStaffMutations();
  return { mark: markAttendance, loading: saving, error: saveError };
}

export function useAttendanceHistoryList(scope: WarehouseScope, selectedWarehouseId?: string) {
  const targetWarehouseId = scope.warehouseId ?? selectedWarehouseId;
  const { history, loading, error, refresh } = useAttendanceHistory({ warehouseId: targetWarehouseId });
  return { entries: history, loading, error, refresh };
}


