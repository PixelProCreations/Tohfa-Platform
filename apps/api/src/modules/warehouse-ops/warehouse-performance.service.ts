/**
 * BR-80: warehouse performance (read-only).
 *
 *  - Scope first: another or an unknown warehouse is the same 404 (BR-30).
 *  - The span `to - from` is capped by system_config.report_max_range_days (fallback 366 when the row
 *    is missing), read through the reports repo so both modules answer the same question the same way.
 *  - The service only assembles exact figures; it computes no rate, score or ranking.
 */
import type { Executor } from '../../db/pool.js';
import { pool } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { reportsRepo } from '../reports/reports.repo.js';
import { requireReachableWarehouse } from './scope.js';
import { warehousePerformanceRepo, type WarehousePerformanceRepo } from './warehouse-performance.repo.js';
import type { PerformanceQuery, WarehousePerformance } from './warehouse-performance.schema.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface WarehousePerformanceServiceDeps {
  repo: WarehousePerformanceRepo;
  db: Executor;
}

export interface WarehousePerformanceService {
  get(scope: ResolvedScope, warehouseId: string, query: PerformanceQuery): Promise<WarehousePerformance>;
}

export function createWarehousePerformanceService(
  deps: Partial<WarehousePerformanceServiceDeps> = {},
): WarehousePerformanceService {
  const repo = deps.repo ?? warehousePerformanceRepo;
  const db = deps.db ?? pool;

  return {
    async get(scope, warehouseId, query) {
      await requireReachableWarehouse(db, scope, warehouseId);

      const max = await reportsRepo.getMaxRangeDays(db);
      const spanDays = (Date.parse(`${query.to}T00:00:00Z`) - Date.parse(`${query.from}T00:00:00Z`)) / MS_PER_DAY;
      if (spanDays > max) {
        throw new AppError('VALIDATION_FAILED', {
          detail: 'One or more fields are invalid.',
          errors: { 'query.to': [`Date range cannot exceed ${max} days.`] },
        });
      }

      const figures = await repo.figures(db, { warehouseId, from: query.from, to: query.to });
      return { warehouseId, from: query.from, to: query.to, ...figures };
    },
  };
}

export const warehousePerformanceService: WarehousePerformanceService = createWarehousePerformanceService();
