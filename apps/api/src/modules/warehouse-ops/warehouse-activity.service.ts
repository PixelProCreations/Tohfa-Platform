/**
 * BR-104: the warehouse activity feed (read-only).
 *
 *  - Scope first: another or an unknown warehouse is the same 404 (BR-30), and the feed is not queried.
 *  - The optional span `to - from` is capped by system_config.report_max_range_days (fallback 366), the
 *    same cap and the same 422 on `query.to` as the warehouse performance read (BR-80h).
 *  - A malformed cursor is a 422 on `query.cursor`; the schema already refuses it at the HTTP edge, the
 *    service checks again so a job or script calling it directly gets the same answer.
 *  - Nothing is written: no audit row, no table of its own.
 */
import type { Executor } from '../../db/pool.js';
import { pool } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { requireReachableWarehouse } from './scope.js';
import { warehouseActivityRepo, type ActivityFilter, type WarehouseActivityRepo } from './warehouse-activity.repo.js';
import {
  activityTypes,
  decodeActivityCursor,
  encodeActivityCursor,
  type ActivityPage,
  type ActivityQuery,
} from './warehouse-activity.schema.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface WarehouseActivityServiceDeps {
  repo: WarehouseActivityRepo;
  db: Executor;
}

export interface WarehouseActivityService {
  list(scope: ResolvedScope, warehouseId: string, query: ActivityQuery): Promise<ActivityPage>;
}

export function createWarehouseActivityService(deps: Partial<WarehouseActivityServiceDeps> = {}): WarehouseActivityService {
  const repo = deps.repo ?? warehouseActivityRepo;
  const db = deps.db ?? pool;

  return {
    async list(scope, warehouseId, query) {
      await requireReachableWarehouse(db, scope, warehouseId);

      const filter: ActivityFilter = { warehouseId, types: query.type ?? [...activityTypes], limit: query.limit };

      if (query.cursor !== undefined) {
        const cursor = decodeActivityCursor(query.cursor);
        if (cursor === null) {
          throw new AppError('VALIDATION_FAILED', {
            detail: 'One or more fields are invalid.',
            errors: { 'query.cursor': ['cursor is not a value returned by this endpoint.'] },
          });
        }
        filter.cursor = cursor;
      }

      if (query.from !== undefined && query.to !== undefined) {
        const max = await repo.maxRangeDays(db);
        const spanDays = (Date.parse(`${query.to}T00:00:00Z`) - Date.parse(`${query.from}T00:00:00Z`)) / MS_PER_DAY;
        if (spanDays > max) {
          throw new AppError('VALIDATION_FAILED', {
            detail: 'One or more fields are invalid.',
            errors: { 'query.to': [`Date range cannot exceed ${max} days.`] },
          });
        }
        filter.from = query.from;
        filter.to = query.to;
      }

      const rows = await repo.page(db, filter);
      const items = rows.slice(0, query.limit);
      const last = items[items.length - 1];
      const hasMore = rows.length > query.limit && last !== undefined;
      return {
        items,
        page: {
          nextCursor: hasMore ? encodeActivityCursor({ occurredAt: last.occurredAt, type: last.type, sourceId: last.sourceId }) : null,
          hasMore,
        },
      };
    },
  };
}

export const warehouseActivityService: WarehouseActivityService = createWarehouseActivityService();
