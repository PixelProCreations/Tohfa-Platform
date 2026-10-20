/**
 * Live data for the Main warehouse-admin screens. Thin TanStack Query
 * wrappers: every decision lives in ./mappers.ts or the API modules, which
 * are tested (hooks cannot be in this app's plain-Node vitest).
 *
 *   GET /warehouses                       warehouse.all.view       (useWarehouseOptions, shared/)
 *   GET /warehouses/{id}                  warehouse.own.view       (Main = all)
 *   GET /warehouses/{id}/capacity         warehouse.own.view       (BR-66b)
 *   GET /warehouses/{id}/issues?status=   warehouse.issue.view     (BR-103; `total` is the count)
 *   GET /admin/tasks/summary?warehouseId= task.own.view            (BR-77; `open`)
 *   GET /admin/sub-warehouse-admins       admin.sub_wh_admin.create
 *   POST /admin/sub-warehouse-admins      admin.sub_wh_admin.create (BR-25, BR-81)
 *
 * Each hook takes `enabled`, so a caller without the code fetches nothing and
 * gets no 403. Issue counts ask for one row and read `total`: the list's exact
 * count over every matching row, not a page length.
 */
import { useQueries } from '@tanstack/react-query';
import { useAdminMutation, useAdminQuery } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { createSubAdmin, listAllSubAdmins, type CreateSubAdminBody, type CreatedSubAdminDto, type SubAdminDto } from '../../../api/subAdmins';
import { getTaskSummary, type TaskSummaryDto } from '../../../api/tasks';
import { listWarehouseIssues, type IssueStatusCode } from '../../../api/warehouseIssues';
import { getWarehouse, getWarehouseCapacity, type WarehouseCapacityDto, type WarehouseDto } from '../../../api/warehouses';

/** One module for this area's reads, told apart by `resource`, so no other area's key can collide. */
const AREA = 'warehouseAdmin';
const SUB_ADMINS = 'subAdmins';

/** One row is enough: the count is the response's `total`. */
const COUNT_PAGE_SIZE = 1;

export interface LiveResult<T> {
  data: T | undefined;
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
}

function live<T>(
  query: { data: T | undefined; isPending: boolean; error: unknown; refetch: () => unknown },
  enabled: boolean,
): LiveResult<T> {
  return {
    data: query.data,
    isLoading: enabled && query.isPending,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
  };
}

function countIssues(warehouseId: string, status: IssueStatusCode, signal: AbortSignal): Promise<number> {
  return listWarehouseIssues(warehouseId, { status, page: 1, pageSize: COUNT_PAGE_SIZE }, signal).then((p) => p.total);
}

/** Capacity per warehouse uuid, one request each (the platform has four, BR-23). */
export function useWarehouseCapacities(warehouseIds: readonly string[], enabled: boolean): Map<string, LiveResult<WarehouseCapacityDto>> {
  const results = useQueries({
    queries: warehouseIds.map((id) => ({
      queryKey: adminKeys.scoped(AREA, id, { resource: 'capacity' }),
      queryFn: ({ signal }: { signal: AbortSignal }) => getWarehouseCapacity(id, signal),
      enabled,
    })),
  });
  const out = new Map<string, LiveResult<WarehouseCapacityDto>>();
  warehouseIds.forEach((id, i) => {
    const q = results[i];
    if (q !== undefined) out.set(id, live(q, enabled));
  });
  return out;
}

/** OPEN issue count per warehouse uuid. */
export function useOpenIssueCounts(warehouseIds: readonly string[], enabled: boolean): Map<string, LiveResult<number>> {
  const results = useQueries({
    queries: warehouseIds.map((id) => ({
      queryKey: adminKeys.scoped(AREA, id, { resource: 'issueCount', status: 'OPEN' }),
      queryFn: ({ signal }: { signal: AbortSignal }) => countIssues(id, 'OPEN', signal),
      enabled,
    })),
  });
  const out = new Map<string, LiveResult<number>>();
  warehouseIds.forEach((id, i) => {
    const q = results[i];
    if (q !== undefined) out.set(id, live(q, enabled));
  });
  return out;
}

/** Every live Sub Warehouse Admin assignment in scope. */
export function useSubAdmins(enabled: boolean): LiveResult<SubAdminDto[]> {
  const query = useAdminQuery(adminKeys.scoped(SUB_ADMINS, undefined), (signal) => listAllSubAdmins({}, signal), { enabled });
  return live(query, enabled);
}

/** The Sub Warehouse Admins of one warehouse. */
export function useWarehouseSubAdmins(warehouseId: string | undefined, enabled: boolean): LiveResult<SubAdminDto[]> {
  const on = enabled && warehouseId !== undefined;
  const query = useAdminQuery(
    adminKeys.scoped(SUB_ADMINS, warehouseId),
    (signal) => listAllSubAdmins({ warehouseId }, signal),
    { enabled: on },
  );
  return live(query, on);
}

export interface WarehouseDetailData {
  warehouse: LiveResult<WarehouseDto>;
  capacity: LiveResult<WarehouseCapacityDto>;
  openIssues: LiveResult<number>;
  inProgressIssues: LiveResult<number>;
  tasks: LiveResult<TaskSummaryDto>;
}

export interface WarehouseDetailGates {
  issues: boolean;
  tasks: boolean;
}

/** One warehouse's own figures; nothing is fetched without a uuid. */
export function useWarehouseDetail(warehouseId: string | undefined, gates: WarehouseDetailGates): WarehouseDetailData {
  const has = warehouseId !== undefined;
  const id = warehouseId ?? '';
  const warehouse = useAdminQuery(adminKeys.scoped(AREA, warehouseId, { resource: 'warehouse' }), (signal) => getWarehouse(id, signal), {
    enabled: has,
  });
  const capacity = useAdminQuery(adminKeys.scoped(AREA, warehouseId, { resource: 'capacity' }), (signal) => getWarehouseCapacity(id, signal), {
    enabled: has,
  });
  const issuesOn = has && gates.issues;
  const open = useAdminQuery(
    adminKeys.scoped(AREA, warehouseId, { resource: 'issueCount', status: 'OPEN' }),
    (signal) => countIssues(id, 'OPEN', signal),
    { enabled: issuesOn },
  );
  const inProgress = useAdminQuery(
    adminKeys.scoped(AREA, warehouseId, { resource: 'issueCount', status: 'IN_PROGRESS' }),
    (signal) => countIssues(id, 'IN_PROGRESS', signal),
    { enabled: issuesOn },
  );
  const tasksOn = has && gates.tasks;
  const tasks = useAdminQuery(
    adminKeys.scoped(AREA, warehouseId, { resource: 'taskSummary' }),
    (signal) => getTaskSummary({ warehouseId: id }, signal),
    { enabled: tasksOn },
  );
  return {
    warehouse: live(warehouse, has),
    capacity: live(capacity, has),
    openIssues: live(open, issuesOn),
    inProgressIssues: live(inProgress, issuesOn),
    tasks: live(tasks, tasksOn),
  };
}

/** POST /admin/sub-warehouse-admins; refetches every Sub Warehouse Admin list on success. */
export function useCreateSubAdmin() {
  return useAdminMutation<CreateSubAdminBody, CreatedSubAdminDto>({
    mutationFn: (body) => createSubAdmin(body),
    invalidates: [adminKeys.module(SUB_ADMINS)],
  });
}
