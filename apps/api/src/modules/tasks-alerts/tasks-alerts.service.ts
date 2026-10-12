/**
 * Tasks and alerts: all business logic (BR-77, BR-78).
 *
 * Takes a `ResolvedScope`, never a `Request`. Tasks and alerts are derived live from existing
 * records for the caller's warehouse scope; the only thing stored is the caller's own state for an
 * item (done / dismissed / snoozed). Both lists answer with machine keys plus parameters: the
 * client translates, no user-facing English leaves this module.
 *
 * Scoping follows src/rbac/warehouseScope.ts. An item outside the scope, never derived, or whose
 * condition has since cleared is 404 for every action on it, so an action never confirms that
 * another warehouse's item exists. A `warehouseId` filter naming a warehouse the caller cannot see
 * is 404 too (not an empty list), and so is one that does not exist.
 *
 * Unconfirmed defaults are listed on each endpoint in docs/openapi.yaml.
 */
import { pool, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { warehouseVisible } from '../../rbac/warehouseScope.js';
import {
  NO_THRESHOLDS,
  tasksAlertsRepo,
  type AlertThresholds,
  type DerivedItem,
  type ItemCursor,
  type StateRow,
  type TasksAlertsRepo,
} from './tasks-alerts.repo.js';
import {
  ALERT_TYPES,
  isAlertItemKey,
  isAnyItemKey,
  isTaskItemKey,
  itemKeyType,
  TASK_TYPES,
  type AlertListResponse,
  type AlertResponse,
  type AlertType,
  type ItemStateResponse,
  type ListAlertsQuery,
  type ListTasksQuery,
  type SnoozeAlertBody,
  type TaskListResponse,
  type TaskResponse,
  type TaskSummaryQuery,
  type TaskSummaryResponse,
  type TaskType,
} from './tasks-alerts.schema.js';

/**
 * Used when system_config has no usable `alert_snooze_max_hours`. The value is the one the task
 * brief names for that case; it is still an unconfirmed default, not a client rule.
 */
const DEFAULT_SNOOZE_MAX_HOURS = 168;
const MS_PER_HOUR = 60 * 60 * 1000;

export interface TasksAlertsService {
  listTasks(scope: ResolvedScope, query: ListTasksQuery): Promise<TaskListResponse>;
  taskSummary(scope: ResolvedScope, query: TaskSummaryQuery): Promise<TaskSummaryResponse>;
  markTaskDone(scope: ResolvedScope, itemKey: string): Promise<ItemStateResponse>;
  listAlerts(scope: ResolvedScope, query: ListAlertsQuery): Promise<AlertListResponse>;
  dismissAlert(scope: ResolvedScope, itemKey: string): Promise<ItemStateResponse>;
  snoozeAlert(scope: ResolvedScope, itemKey: string, body: SnoozeAlertBody): Promise<ItemStateResponse>;
}

export interface TasksAlertsServiceDeps {
  repo?: TasksAlertsRepo;
  db?: Executor;
  now?: () => Date;
}

const SORT_AT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/;

function encodeCursor(cursor: ItemCursor): string {
  return Buffer.from(JSON.stringify([cursor.sortAt, cursor.itemKey]), 'utf8').toString('base64url');
}

// Strict on purpose: both parts are bound into SQL, so only the exact shape the repo emits is accepted back.
function decodeCursor(raw: string): ItemCursor {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    if (
      Array.isArray(parsed) &&
      parsed.length === 2 &&
      typeof parsed[0] === 'string' &&
      SORT_AT.test(parsed[0]) &&
      typeof parsed[1] === 'string' &&
      isAnyItemKey(parsed[1])
    ) {
      return { sortAt: parsed[0], itemKey: parsed[1] };
    }
  } catch {
    // fall through to the single error below
  }
  throw new AppError('VALIDATION_FAILED', { detail: 'cursor is not a value returned by this endpoint.' });
}

const notFound = (what: string): AppError => new AppError('NOT_FOUND', { detail: `${what} not found.` });

function invalidKey(): AppError {
  return new AppError('VALIDATION_FAILED', {
    detail: 'itemKey is not a key this endpoint accepts.',
    errors: { 'params.itemKey': ['itemKey is not a key this endpoint accepts.'] },
  });
}

function mapTask(item: DerivedItem): TaskResponse {
  const type = item.type as TaskType;
  if (item.createdAt === null) throw new Error(`task ${item.itemKey} was derived without a creation time`);
  return {
    itemKey: item.itemKey,
    type,
    titleKey: `task.${type.toLowerCase()}.title`,
    refType: item.refType,
    refId: item.refId,
    warehouseId: item.warehouseId,
    createdAt: item.createdAt.toISOString(),
    dueOn: item.dueOn,
    params: item.params,
    state: item.userState === 'DONE' ? 'DONE' : 'OPEN',
  };
}

function mapAlert(item: DerivedItem): AlertResponse {
  const type = item.type as AlertType;
  return {
    itemKey: item.itemKey,
    type,
    messageKey: `alert.${type.toLowerCase()}.message`,
    refType: item.refType,
    refId: item.refId,
    warehouseId: item.warehouseId,
    since: item.since?.toISOString() ?? null,
    params: item.params,
    state: item.snoozedNow ? 'SNOOZED' : 'ACTIVE',
    snoozedUntil: item.snoozedNow ? (item.snoozedUntil?.toISOString() ?? null) : null,
  };
}

function mapState(row: StateRow): ItemStateResponse {
  return {
    itemKey: row.itemKey,
    state: row.state,
    snoozedUntil: row.snoozedUntil?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function createTasksAlertsService(deps: TasksAlertsServiceDeps = {}): TasksAlertsService {
  const repo = deps.repo ?? tasksAlertsRepo;
  const db = deps.db ?? pool;
  const now = deps.now ?? ((): Date => new Date());

  /** A warehouse filter must name a warehouse the caller can see, and that exists. */
  async function assertWarehouseFilter(scope: ResolvedScope, warehouseId: string | undefined): Promise<void> {
    if (warehouseId === undefined) return;
    if (!warehouseVisible(scope, warehouseId) || !(await repo.warehouseExists(db, warehouseId))) {
      throw notFound('Warehouse');
    }
  }

  const alertThresholds = (): Promise<AlertThresholds> => repo.getAlertThresholds(db);

  return {
    async listTasks(scope, query) {
      await assertWarehouseFilter(scope, query.warehouseId);
      const cursor = query.cursor === undefined ? undefined : decodeCursor(query.cursor);
      // State whose condition has cleared is forgotten first, whatever filter this call carries.
      await repo.pruneCleared(db, { kind: 'TASK', userId: scope.userId, scope, types: TASK_TYPES, thresholds: NO_THRESHOLDS });
      const { items, next } = await repo.list(db, {
        kind: 'TASK',
        userId: scope.userId,
        scope,
        types: query.type === undefined ? TASK_TYPES : [query.type],
        thresholds: NO_THRESHOLDS,
        warehouseId: query.warehouseId,
        state: query.state,
        cursor,
        limit: query.limit,
      });
      return {
        items: items.map(mapTask),
        page: { nextCursor: next === null ? null : encodeCursor(next), hasMore: next !== null },
      };
    },

    async taskSummary(scope, query) {
      await assertWarehouseFilter(scope, query.warehouseId);
      const counts = await repo.countOpenTasks(db, { userId: scope.userId, scope, warehouseId: query.warehouseId });
      const byType = Object.fromEntries(TASK_TYPES.map((type) => [type, counts[type] ?? 0])) as Record<TaskType, number>;
      return { open: Object.values(byType).reduce((sum, n) => sum + n, 0), byType };
    },

    async markTaskDone(scope, itemKey) {
      if (!isTaskItemKey(itemKey)) throw invalidKey();
      const item = await repo.findVisible(db, {
        kind: 'TASK',
        userId: scope.userId,
        scope,
        type: itemKeyType(itemKey),
        itemKey,
        thresholds: NO_THRESHOLDS,
      });
      if (item === null) throw notFound('Task');
      return mapState(await repo.upsertState(db, { userId: scope.userId, kind: 'TASK', itemKey, state: 'DONE', snoozedUntil: null }));
    },

    async listAlerts(scope, query) {
      await assertWarehouseFilter(scope, query.warehouseId);
      const cursor = query.cursor === undefined ? undefined : decodeCursor(query.cursor);
      const thresholds = await alertThresholds();
      await repo.pruneCleared(db, { kind: 'ALERT', userId: scope.userId, scope, types: ALERT_TYPES, thresholds });
      const { items, next } = await repo.list(db, {
        kind: 'ALERT',
        userId: scope.userId,
        scope,
        types: query.type === undefined ? ALERT_TYPES : [query.type],
        thresholds,
        warehouseId: query.warehouseId,
        state: query.state,
        cursor,
        limit: query.limit,
      });
      return {
        items: items.map(mapAlert),
        page: { nextCursor: next === null ? null : encodeCursor(next), hasMore: next !== null },
      };
    },

    async dismissAlert(scope, itemKey) {
      if (!isAlertItemKey(itemKey)) throw invalidKey();
      await requireVisibleAlert(scope, itemKey);
      return mapState(await repo.upsertState(db, { userId: scope.userId, kind: 'ALERT', itemKey, state: 'DISMISSED', snoozedUntil: null }));
    },

    async snoozeAlert(scope, itemKey, body) {
      if (!isAlertItemKey(itemKey)) throw invalidKey();
      await requireVisibleAlert(scope, itemKey);
      const until = new Date(body.until);
      const maxHours = (await repo.getSnoozeMaxHours(db)) ?? DEFAULT_SNOOZE_MAX_HOURS;
      const latest = now().getTime() + maxHours * MS_PER_HOUR;
      if (until.getTime() <= now().getTime()) {
        throw new AppError('VALIDATION_FAILED', {
          detail: 'until must be in the future.',
          errors: { 'body.until': ['until must be in the future.'] },
        });
      }
      if (until.getTime() > latest) {
        throw new AppError('VALIDATION_FAILED', {
          detail: `until may be at most ${maxHours} hours from now.`,
          errors: { 'body.until': [`until may be at most ${maxHours} hours from now (latest ${new Date(latest).toISOString()}).`] },
        });
      }
      return mapState(await repo.upsertState(db, { userId: scope.userId, kind: 'ALERT', itemKey, state: 'SNOOZED', snoozedUntil: until }));
    },
  };

  async function requireVisibleAlert(scope: ResolvedScope, itemKey: string): Promise<void> {
    const item = await repo.findVisible(db, {
      kind: 'ALERT',
      userId: scope.userId,
      scope,
      type: itemKeyType(itemKey),
      itemKey,
      thresholds: await alertThresholds(),
    });
    if (item === null) throw notFound('Alert');
  }
}

export const tasksAlertsService = createTasksAlertsService();
