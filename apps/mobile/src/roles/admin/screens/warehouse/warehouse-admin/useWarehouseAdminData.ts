/**
 * Live data for the Main warehouse-admin screens. Thin TanStack Query
 * wrappers: every decision lives in ./mappers.ts or the API modules, which
 * are tested (hooks cannot be in this app's plain-Node vitest).
 *
 *   GET /warehouses                       warehouse.all.view       (useWarehouseOptions, shared/)
 *   GET /warehouses/{id}                  warehouse.own.view       (Main = all)
 *   GET /warehouses/{id}/capacity         warehouse.own.view       (BR-66b)
 *   GET /warehouses/{id}/issues?status=   warehouse.issue.view     (BR-103; `total` is the count)
 *   GET /admin/sub-warehouse-admins       admin.sub_wh_admin.create
 *   POST /admin/sub-warehouse-admins      admin.sub_wh_admin.create (BR-25, BR-81)
 *   GET /warehouses/{id}/storage-locations inventory.batch.view    (BR-79; `total` is the count)
 *   GET /admin/staff-attendance/roll-call  admin.staff.attendance.view (BR-84; staff count)
 *   GET /admin/alerts?type=CAPACITY_NEAR_FULL alert.own.view       (BR-77; near-capacity)
 *   GET /admin/orders?status=&warehouseId= order.list.view_all     (Pending Orders; one page per status)
 *   GET /warehouses/{id}/documents         warehouse.document.view  (BR-105; the first row)
 *   GET /warehouses/{id}/activity          warehouse.activity.view  (BR-104; the newest rows)
 *
 * Each hook takes `enabled`, so a caller without the code fetches nothing and
 * gets no 403. Issue counts ask for one row and read `total`: the list's exact
 * count over every matching row, not a page length.
 */
import { useQueries } from '@tanstack/react-query';
import { listAlerts } from '../../../api/alerts';
import { useAdminMutation, useAdminQuery } from '../../../api/hooks';
import { listAdminOrders } from '../../../api/orders';
import { adminKeys } from '../../../api/queryKeys';
import { createSubAdmin, listAllSubAdmins, type CreateSubAdminBody, type CreatedSubAdminDto, type SubAdminDto } from '../../../api/subAdmins';
import { listWarehouseActivity } from '../../../api/warehouseActivity';
import { listWarehouseDocuments } from '../../../api/warehouseDocuments';
import { listWarehouseIssues, type IssueStatusCode } from '../../../api/warehouseIssues';
import { getRollCall } from '../../../api/attendance';
import {
  getWarehouse,
  getWarehouseCapacity,
  listStorageLocations,
  type WarehouseCapacityDto,
  type WarehouseDto,
} from '../../../api/warehouses';
import { istDay } from '../../../utils/datetime';
import { toDocumentView, type WarehouseDocumentView } from '../profile-settings/mappers_documents';
import { WAREHOUSE_DOCUMENTS_MODULE } from '../profile-settings/useWarehouseDocuments';
import type { ActivityRow } from '../storage-ops/mappers';
import { STORAGE_OPS } from '../storage-ops/useStorageData';
import { ATTENDANCE_MODULE } from '../staff-attendance/useStaffData';
import { collectPages, DASHBOARD_PAGE_LIMIT } from '../../dashboard/mappers_mainDashboard';
import {
  DETAIL_ACTIVITY_ROWS,
  FIRST_DOCUMENT_PAGE,
  PENDING_ORDER_STATUSES,
  pendingOrdersFigure,
  pendingOrdersRequests,
  recentActivityRows,
  type PendingOrdersFigure,
} from './detailFigures';
import { activeStaffCount, nearFullSignalOf, sumStorageAreas, type NearFullSignal } from './overviewFigures';

/** One module for this area's reads, told apart by `resource`, so no other area's key can collide. */
const AREA = 'warehouseAdmin';
const SUB_ADMINS = 'subAdmins';
/**
 * The orders area's module (orders/useOrdersData.ts): Pending Orders is keyed
 * under it so packing or handing over an order, which invalidates that module,
 * refreshes the figure too.
 */
const ORDERS = 'orders';

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

/**
 * Storage areas over `warehouseIds`: the active storage locations of each, from
 * a one-row page's exact `total` (one small request per warehouse; there are
 * four, BR-23). Active only: a deactivated location is out of service, and the
 * Sub snapshot counts storage the same way.
 */
export function useStorageAreaTotal(warehouseIds: readonly string[], enabled: boolean) {
  const ids = [...warehouseIds].sort();
  return useAdminQuery(
    adminKeys.scoped(AREA, undefined, { resource: 'storageAreaTotal', ids: ids.join(',') }),
    async (signal) => {
      const totals = await Promise.all(
        ids.map((id) => listStorageLocations(id, { isActive: true, page: 1, pageSize: COUNT_PAGE_SIZE }, signal).then((p) => p.total)),
      );
      return sumStorageAreas(totals);
    },
    { enabled: enabled && ids.length > 0 },
  );
}

/**
 * Staff count per warehouse uuid, derived from today's (IST) roll call of each
 * warehouse. One request per warehouse rather than one for all: a Main admin
 * confined to one warehouse gets 404 for the others, and that must hide their
 * count, not read as zero staff. The key is the Staff screens' own roll-call
 * key (useRollCall with the Main scope), so both share the cache and an
 * attendance write refreshes the count.
 */
export function useStaffCounts(warehouseIds: readonly string[], enabled: boolean): Map<string, LiveResult<number>> {
  const date = istDay(new Date());
  const results = useQueries({
    queries: warehouseIds.map((id) => ({
      queryKey: adminKeys.scoped(ATTENDANCE_MODULE, undefined, { resource: 'roll-call', date, warehouseId: id }),
      queryFn: ({ signal }: { signal: AbortSignal }) => getRollCall({ date, warehouseId: id }, signal),
      select: (dto: Awaited<ReturnType<typeof getRollCall>>) => activeStaffCount(dto, id),
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

/**
 * The server's near-full warehouses (CAPACITY_NEAR_FULL, the caller's active
 * alerts across its scope). Keyed under the 'alerts' module, so dismissing or
 * snoozing an alert elsewhere refreshes it. `data` stays undefined while the
 * walk is incomplete: an alert missing from a cut-short list must not read as
 * "not near full".
 */
export function useNearFullAlerts(enabled: boolean): LiveResult<NearFullSignal> {
  const query = useAdminQuery(
    adminKeys.scoped('alerts', undefined, { resource: 'list', state: 'active', type: 'CAPACITY_NEAR_FULL' }),
    (signal) =>
      collectPages((cursor) => listAlerts({ type: 'CAPACITY_NEAR_FULL', state: 'active', limit: DASHBOARD_PAGE_LIMIT, cursor }, signal)),
    { enabled },
  );
  const result = live(query, enabled);
  return { ...result, data: nearFullSignalOf(query.data) ?? undefined };
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
}

export interface WarehouseDetailGates {
  issues: boolean;
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
  return {
    warehouse: live(warehouse, has),
    capacity: live(capacity, has),
    openIssues: live(open, issuesOn),
    inProgressIssues: live(inProgress, issuesOn),
  };
}

/**
 * Pending Orders of one warehouse: one page per pending status, read together.
 * GET /admin/orders has no `total` and takes one status per call, so this is
 * three requests and never a walk; past one full page a status makes the
 * figure a lower bound (./detailFigures.ts).
 */
export function usePendingOrders(warehouseId: string | undefined, enabled: boolean): LiveResult<PendingOrdersFigure> {
  const on = enabled && warehouseId !== undefined;
  const id = warehouseId ?? '';
  const query = useAdminQuery(
    adminKeys.scoped(ORDERS, warehouseId, { resource: 'pendingCount', statuses: PENDING_ORDER_STATUSES.join(',') }),
    async (signal) => pendingOrdersFigure(await Promise.all(pendingOrdersRequests(id).map((params) => listAdminOrders(params, signal)))),
    { enabled: on },
  );
  return live(query, on);
}

export interface FirstWarehouseDocument {
  /** Null when the warehouse has no (unarchived) document. */
  document: WarehouseDocumentView | null;
  total: number;
}

/**
 * The first document of one warehouse's list (soonest expiry first, BR-105).
 * Keyed under the documents module, so a document change elsewhere refreshes it.
 */
export function useFirstWarehouseDocument(warehouseId: string | undefined, enabled: boolean): LiveResult<FirstWarehouseDocument> {
  const on = enabled && warehouseId !== undefined;
  const id = warehouseId ?? '';
  const query = useAdminQuery(
    adminKeys.scoped(WAREHOUSE_DOCUMENTS_MODULE, warehouseId, { resource: 'first' }),
    (signal) =>
      listWarehouseDocuments(id, FIRST_DOCUMENT_PAGE, signal).then((p) => {
        const first = p.items[0];
        return { document: first === undefined ? null : toDocumentView(first), total: p.total };
      }),
    { enabled: on },
  );
  return live(query, on);
}

/**
 * The newest activity of one warehouse (BR-104): one page of
 * DETAIL_ACTIVITY_ROWS, keyed under storage-ops like the full feed.
 */
export function useRecentWarehouseActivity(warehouseId: string | undefined, enabled: boolean): LiveResult<ActivityRow[]> {
  const on = enabled && warehouseId !== undefined;
  const id = warehouseId ?? '';
  const query = useAdminQuery(
    adminKeys.scoped(STORAGE_OPS, warehouseId, { resource: 'activity-recent', limit: DETAIL_ACTIVITY_ROWS }),
    (signal) => listWarehouseActivity(id, { limit: DETAIL_ACTIVITY_ROWS }, signal).then((p) => recentActivityRows(p.items, new Date())),
    { enabled: on },
  );
  return live(query, on);
}

/** POST /admin/sub-warehouse-admins; refetches every Sub Warehouse Admin list on success. */
export function useCreateSubAdmin() {
  return useAdminMutation<CreateSubAdminBody, CreatedSubAdminDto>({
    mutationFn: (body) => createSubAdmin(body),
    invalidates: [adminKeys.module(SUB_ADMINS)],
  });
}
