/**
 * Live data for the warehouse Home screens (tasks, alerts, stock & transfer,
 * snapshot, activity) and the Main dashboard. Thin TanStack Query wrappers over
 * the admin hooks (../../../api/hooks.ts); every decision lives in
 * ./mappers_dashboardHome.ts or the API modules, which are tested.
 *
 * Keys follow adminKeys.scoped(module, warehouseId, params): the warehouse is
 * part of every key (BR-30), and the 'tasks' / 'alerts' module prefixes match
 * what the Sub dashboard and the notifications area already invalidate.
 */
import { useCallback } from 'react';
import { dismissAlert, listAlerts, snoozeAlert, type AlertItemDto, type AlertType } from '../../../api/alerts';
import { getTransferStatusCounts, getWarehouseCapacities } from '../../../api/dashboardFeeds';
import { useAdminMutation, useAdminQuery, useCursorList, type CursorList } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { getTaskSummary, listTasks, markTaskDone, type TaskItemDto } from '../../../api/tasks';
import { listWarehouseTransfers } from '../../../api/transfers';
import { listWarehouseActivity, type ActivityTypeCode, type WarehouseActivityEventDto } from '../../../api/warehouseActivity';
import { getWarehousePerformance } from '../../../api/warehouseOps';
import { getWarehouse, getWarehouseCapacity, listStorageLocations } from '../../../api/warehouses';
import {
  toActivityRow,
  toAttentionAlert,
  toTaskRow,
  todayRange,
  type ActivityRow,
  type AlertStateFilter,
  type AttentionAlert,
  type TaskRow,
  type TaskStateFilter,
} from './mappers_dashboardHome';
import type { WarehouseScope } from './types';

const TASKS = 'tasks';
const ALERTS = 'alerts';
const DASHBOARD = 'dashboardHome';
/** One page of recent transfers for the tracking list; a list length, not a business limit. */
const RECENT_TRANSFERS_PAGE_SIZE = 20;

/** Open or done tasks in the scope, page by page (GET /admin/tasks). */
export function useTaskRows(scope: WarehouseScope, state: TaskStateFilter): CursorList<TaskRow> {
  const warehouseId = scope.warehouseId;
  const map = useCallback((dto: TaskItemDto) => toTaskRow(dto, new Date()), []);
  return useCursorList(
    adminKeys.scoped(TASKS, warehouseId, { state }),
    (cursor, signal) => listTasks({ state, warehouseId, cursor }, signal),
    map,
  );
}

/** Per-type open counts (GET /admin/tasks/summary). Same key as the Sub dashboard's summary. */
export function useTaskSummary(scope: WarehouseScope) {
  return useAdminQuery(adminKeys.scoped(TASKS, scope.warehouseId, { resource: 'summary' }), (signal) =>
    getTaskSummary({ warehouseId: scope.warehouseId }, signal),
  );
}

/** POST /admin/tasks/{itemKey}/done with the caller's Idempotency-Key (BR-78); every task query refetches. */
export function useMarkTaskDone() {
  return useAdminMutation({
    mutationFn: ({ itemKey, idempotencyKey }: { itemKey: string; idempotencyKey: string }) => markTaskDone(itemKey, idempotencyKey),
    invalidates: [adminKeys.module(TASKS)],
  });
}

/** Live alerts (GET /admin/alerts): Sub sends its own warehouse, Main none (whole scope). */
export function useAttentionAlerts(scope: WarehouseScope, state: AlertStateFilter, type?: AlertType | undefined): CursorList<AttentionAlert> {
  const warehouseId = scope.warehouseId;
  const map = useCallback((dto: AlertItemDto) => toAttentionAlert(dto, new Date()), []);
  return useCursorList(
    adminKeys.scoped(ALERTS, warehouseId, { state, type: type ?? null, view: 'attention' }),
    (cursor, signal) => listAlerts({ warehouseId, state, type, cursor }, signal),
    map,
  );
}

/** Dismiss one alert in the viewer's own list (BR-78). */
export function useDismissAttentionAlert() {
  return useAdminMutation({ mutationFn: (itemKey: string) => dismissAlert(itemKey), invalidates: [adminKeys.module(ALERTS)] });
}

/** Snooze one alert in the viewer's own list until `until` (BR-78; the server caps the length). */
export function useSnoozeAttentionAlert() {
  return useAdminMutation({
    mutationFn: ({ itemKey, until }: { itemKey: string; until: Date }) => snoozeAlert(itemKey, until),
    invalidates: [adminKeys.module(ALERTS)],
  });
}

/** Capacity of several warehouses (Main overview); disabled until ids are known. */
export function useWarehouseCapacities(warehouseIds: readonly string[], enabled = true) {
  return useAdminQuery(
    adminKeys.scoped(DASHBOARD, undefined, { resource: 'capacities', ids: [...warehouseIds].sort().join(',') }),
    (signal) => getWarehouseCapacities(warehouseIds, signal),
    { enabled: enabled && warehouseIds.length > 0 },
  );
}

/** One warehouse's capacity (GET /warehouses/{id}/capacity). */
export function useWarehouseCapacity(warehouseId: string | undefined) {
  return useAdminQuery(
    adminKeys.scoped(DASHBOARD, warehouseId, { resource: 'capacity' }),
    (signal) => getWarehouseCapacity(warehouseId ?? '', signal),
    { enabled: warehouseId !== undefined },
  );
}

/** One warehouse's profile (GET /warehouses/{id}). */
export function useWarehouseProfile(warehouseId: string | undefined) {
  return useAdminQuery(
    adminKeys.scoped(DASHBOARD, warehouseId, { resource: 'warehouse' }),
    (signal) => getWarehouse(warehouseId ?? '', signal),
    { enabled: warehouseId !== undefined },
  );
}

/** Storage location totals: all and active (two one-row pages, reading `total`). */
export function useStorageLocationTotals(warehouseId: string | undefined, enabled = true) {
  return useAdminQuery(
    adminKeys.scoped(DASHBOARD, warehouseId, { resource: 'storage-totals' }),
    async (signal) => {
      const id = warehouseId ?? '';
      const [all, active] = await Promise.all([
        listStorageLocations(id, { page: 1, pageSize: 1 }, signal),
        listStorageLocations(id, { isActive: true, page: 1, pageSize: 1 }, signal),
      ]);
      return { total: all.total, active: active.total };
    },
    { enabled: enabled && warehouseId !== undefined },
  );
}

/** Today's exact counts (GET /warehouses/{id}/performance, warehouse.all.view: Main only). */
export function useTodayPerformance(warehouseId: string | undefined, enabled: boolean) {
  const range = todayRange(new Date());
  return useAdminQuery(
    adminKeys.scoped(DASHBOARD, warehouseId, { resource: 'performance', ...range }),
    (signal) => getWarehousePerformance(warehouseId ?? '', range, signal),
    { enabled: enabled && warehouseId !== undefined },
  );
}

/** Transfer totals per status (GET /warehouse-transfers, transfer.inter_warehouse.view). */
export function useTransferStatusCounts(warehouseId: string | undefined, enabled = true) {
  return useAdminQuery(
    adminKeys.scoped('transfers', warehouseId, { resource: 'status-counts' }),
    (signal) => getTransferStatusCounts(warehouseId, signal),
    { enabled },
  );
}

/** The newest transfers (first page), for the tracking list. */
export function useRecentTransfers(enabled = true) {
  return useAdminQuery(
    adminKeys.scoped('transfers', undefined, { resource: 'recent', pageSize: RECENT_TRANSFERS_PAGE_SIZE }),
    (signal) => listWarehouseTransfers({ page: 1, pageSize: RECENT_TRANSFERS_PAGE_SIZE }, signal),
    { enabled },
  );
}

/** The activity feed of one warehouse (GET /warehouses/{id}/activity, BR-104). */
export function useWarehouseActivityFeed(
  warehouseId: string | undefined,
  type: ActivityTypeCode | undefined,
  range: { from?: string; to?: string },
): CursorList<ActivityRow> {
  const map = useCallback((dto: WarehouseActivityEventDto) => toActivityRow(dto, new Date()), []);
  return useCursorList(
    adminKeys.scoped('warehouseActivity', warehouseId, { type: type ?? null, from: range.from ?? null, to: range.to ?? null }),
    (cursor, signal) =>
      listWarehouseActivity(
        warehouseId ?? '',
        { types: type === undefined ? undefined : [type], from: range.from, to: range.to, cursor },
        signal,
      ),
    map,
    { enabled: warehouseId !== undefined },
  );
}
