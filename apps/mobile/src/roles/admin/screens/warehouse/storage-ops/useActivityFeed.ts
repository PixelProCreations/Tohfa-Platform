/**
 * Data for Warehouse Activity (D03): the live warehouse list (Main only, for
 * the selector and the all-warehouses merge) and the first activity page of
 * each warehouse being viewed, merged newest first. Thin on purpose: every
 * decision is in ./mappers_activity.ts (tests/storageOps_activity.test.ts).
 *
 *   GET /warehouses                  warehouse.all.view       (Main)
 *   GET /warehouses/{id}/activity    warehouse.activity.view  (BR-104; Sub = own, BR-30)
 */
import { useMemo } from 'react';
import { useAdminQuery } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { listWarehouseActivity } from '../../../api/warehouseActivity';
import { listWarehouses } from '../../../api/warehouses';
import {
  ACTIVITY_FEED_LIMIT,
  ACTIVITY_VIEW_CODE,
  ALL_WAREHOUSES_VIEW_CODE,
  activityFetchTargets,
  activityRange,
  activityTypesFor,
  mergeActivityPages,
  toActivityRow,
  type ActivityChip,
  type ActivityFeedPage,
  type ActivityRow,
  type ActivityWarehouse,
} from './mappers_activity';
import type { ActivityPreset, PermissionCheck, WarehouseScope } from './types';

/** The same key the Main dashboard uses, so its cached list is reused. */
const WAREHOUSES_KEY = adminKeys.scoped('warehouses', undefined, { pageSize: 100, isActive: true });

export interface ActivityFeed {
  /** False when the role cannot read the feed (or, for Main, the warehouse list). */
  canView: boolean;
  rows: ActivityRow[];
  /** Live warehouses for the Main selector (empty for a Sub scope). */
  warehouses: ActivityWarehouse[];
  isLoading: boolean;
  error: unknown;
  retry: () => void;
}

export function useActivityFeed(
  scope: WarehouseScope,
  can: PermissionCheck,
  preset: ActivityPreset | undefined,
  chip: ActivityChip,
  selectedWarehouseId: string | undefined,
  now: Date,
): ActivityFeed {
  const isMain = scope.warehouseId === undefined;
  const canView = can(ACTIVITY_VIEW_CODE) && (!isMain || can(ALL_WAREHOUSES_VIEW_CODE));

  const warehousesQuery = useAdminQuery(
    WAREHOUSES_KEY,
    (signal) => listWarehouses({ isActive: true, pageSize: 100 }, signal),
    { enabled: canView && isMain },
  );
  const live = useMemo(
    () => warehousesQuery.data?.items.map((w): ActivityWarehouse => ({ id: w.id, name: w.name })),
    [warehousesQuery.data],
  );

  const targets = useMemo(
    () => activityFetchTargets({ warehouseId: scope.warehouseId, warehouseName: scope.warehouseName }, selectedWarehouseId, live),
    [scope.warehouseId, scope.warehouseName, selectedWarehouseId, live],
  );
  const types = activityTypesFor(chip);
  const range = activityRange(preset, now);
  const feedKey = adminKeys.scoped('warehouseActivity', isMain ? selectedWarehouseId : scope.warehouseId, {
    types: types ?? [],
    ...range,
    limit: ACTIVITY_FEED_LIMIT,
    // The Main merge reads several feeds; the ids belong in the key so a changed list refetches.
    warehouseIds: targets.map((w) => w.id),
  });
  const feedQuery = useAdminQuery(
    feedKey,
    (signal) =>
      Promise.all(
        targets.map(async (w): Promise<ActivityFeedPage> => {
          const page = await listWarehouseActivity(w.id, { types, ...range, limit: ACTIVITY_FEED_LIMIT }, signal);
          return { warehouseId: w.id, items: page.items, hasMore: page.page.hasMore };
        }),
      ),
    { enabled: canView && targets.length > 0 },
  );

  const rows = useMemo(() => {
    const byId = new Map(targets.map((w) => [w.id, w]));
    return mergeActivityPages(feedQuery.data ?? []).map(({ warehouseId, event }) =>
      toActivityRow(event, byId.get(warehouseId) ?? { id: warehouseId, name: '' }, now),
    );
  }, [feedQuery.data, targets, now]);

  return {
    canView,
    rows,
    warehouses: live ?? [],
    isLoading: warehousesQuery.isLoading || feedQuery.isLoading,
    error: warehousesQuery.error ?? feedQuery.error,
    retry: () => {
      if (warehousesQuery.error) void warehousesQuery.refetch();
      if (feedQuery.error) void feedQuery.refetch();
    },
  };
}
