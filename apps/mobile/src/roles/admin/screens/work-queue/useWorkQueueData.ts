/**
 * Live data for the Work Queue tab: thin TanStack Query wrappers over
 * api/tasks.ts (BR-77). Every decision lives in ./workQueueLogic.ts.
 *
 * Keys use the 'tasks' module prefix the warehouse Home screens use too
 * (useDashboardHomeData).
 * Nothing is fetched while `enabled` is false (no task.own.view, or a design
 * category with no task source).
 */
import { useCallback } from 'react';
import { useAdminQuery, useCursorList } from '../../api/hooks';
import { adminKeys } from '../../api/queryKeys';
import { getTaskSummary, listTasks, type TaskItemDto, type TaskType } from '../../api/tasks';
import { toWorkQueueCard } from './workQueueLogic';

const TASKS = 'tasks';

export interface WorkQueueQuery {
  type: TaskType | undefined;
  warehouseId: string | undefined;
}

export function useWorkQueueTasks(query: WorkQueueQuery, enabled: boolean) {
  const map = useCallback((dto: TaskItemDto) => toWorkQueueCard(dto, new Date()), []);
  return useCursorList(
    adminKeys.scoped(TASKS, query.warehouseId, { view: 'workQueue', state: 'open', type: query.type ?? null }),
    (cursor, signal) => listTasks({ type: query.type, state: 'open', warehouseId: query.warehouseId, cursor }, signal),
    map,
    { enabled },
  );
}

export function useWorkQueueSummary(warehouseId: string | undefined, enabled: boolean) {
  return useAdminQuery(
    adminKeys.scoped(TASKS, warehouseId, { resource: 'summary' }),
    (signal) => getTaskSummary({ warehouseId }, signal),
    { enabled },
  );
}
