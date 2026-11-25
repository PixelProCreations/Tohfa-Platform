/**
 * Reports (Module 12): read-only, warehouse-scoped aggregates. BR-64.
 *
 * The service takes a `ResolvedScope`, never a `Request`. It decides which warehouses the report
 * may cover, rejects a range that is too wide, and turns the repo's exact sums into the response
 * (the average order value is derived here from the exact total and count, in integer paise).
 * It writes nothing and writes no audit row: a report is a read.
 */
import { fromPaise, parseMoney, ScopeLevel, toPaise } from '@tohfa/shared-types';
import { pool, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { warehouseVisible } from '../../rbac/warehouseScope.js';
import { farmerScopeFilter } from '../admin-farmers/admin-farmers.service.js';
import { reportsRepo, type ReportsRepo } from './reports.repo.js';
import type {
  CashTopupsReportResponse,
  ComplianceTiersQuery,
  ComplianceTiersReportResponse,
  CustomersReportResponse,
  FarmerPerformanceQuery,
  FarmerPerformanceReportResponse,
  InventoryQuery,
  InventoryReportResponse,
  RangeQuery,
  ReceivingReportResponse,
  ReturnsReportResponse,
  SalesQuery,
  SalesReportResponse,
  TimeSeriesQuery,
  TimeSeriesReportResponse,
} from './reports.schema.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface ReportsService {
  sales(scope: ResolvedScope, query: SalesQuery): Promise<SalesReportResponse>;
  receiving(scope: ResolvedScope, query: RangeQuery): Promise<ReceivingReportResponse>;
  inventory(scope: ResolvedScope, query: InventoryQuery): Promise<InventoryReportResponse>;
  returns(scope: ResolvedScope, query: RangeQuery): Promise<ReturnsReportResponse>;
  customers(scope: ResolvedScope, query: RangeQuery): Promise<CustomersReportResponse>;
  cashTopups(scope: ResolvedScope, query: RangeQuery): Promise<CashTopupsReportResponse>;
  timeSeries(scope: ResolvedScope, query: TimeSeriesQuery): Promise<TimeSeriesReportResponse>;
  farmerPerformance(scope: ResolvedScope, query: FarmerPerformanceQuery): Promise<FarmerPerformanceReportResponse>;
  complianceTiers(scope: ResolvedScope, query: ComplianceTiersQuery): Promise<ComplianceTiersReportResponse>;
}

export interface ReportsServiceDeps {
  repo: ReportsRepo;
  db: Executor;
}

/**
 * docs/rbac.json `scopeFilters` says every query of a warehouse-dimension admin is filtered by its
 * assigned warehouse, whatever level the permission grants. `warehouseScopeFilter` treats an `all`
 * grant as unfiltered, and three of the report gates are `all` for Sub warehouse admins
 * (rma.request.process, inventory.goods_receipt.record, wallet.cash_topup.process). So a scope
 * that carries assigned warehouses is narrowed to them here, by treating it as `own`.
 * A scope with no assigned warehouse (Main, Super, Tohfa admin) is left as it is.
 */
function confineToAssignedWarehouses(scope: ResolvedScope): ResolvedScope {
  const widened = scope.level === ScopeLevel.ALL || scope.level === ScopeLevel.CONDITIONAL;
  if (widened && scope.warehouseIds.length > 0) return { ...scope, level: ScopeLevel.OWN };
  return scope;
}

/** An unreachable warehouse is 404, not 403: a 403 would confirm that it exists (BR-30). */
function assertWarehouseVisible(scope: ResolvedScope, warehouseId: string | undefined): void {
  if (warehouseId !== undefined && !warehouseVisible(scope, warehouseId)) {
    throw new AppError('NOT_FOUND', { detail: 'No such warehouse.' });
  }
}

/** Half-up integer division of paise by an order count; both are exact integers. */
function averagePaise(totalPaise: number, count: number): number {
  const total = BigInt(totalPaise);
  const n = BigInt(count);
  return Number((2n * total + n) / (2n * n));
}

export function createReportsService(deps: ReportsServiceDeps): ReportsService {
  const { repo, db } = deps;

  /** BR-64e: the widest `to - from` span is system_config.report_max_range_days. */
  async function assertRangeAllowed(query: { from: string; to: string }): Promise<void> {
    const maxRangeDays = await repo.getMaxRangeDays(db);
    const spanDays = (Date.parse(`${query.to}T00:00:00Z`) - Date.parse(`${query.from}T00:00:00Z`)) / MS_PER_DAY;
    if (spanDays > maxRangeDays) {
      throw new AppError('VALIDATION_FAILED', {
        detail: 'One or more fields are invalid.',
        errors: { 'query.to': [`Date range cannot exceed ${maxRangeDays} days.`] },
      });
    }
  }

  /** Everything every ranged report does before it reads: visibility, then the range cap. */
  async function prepare(
    scope: ResolvedScope,
    query: { from: string; to: string; warehouseId?: string | undefined },
  ): Promise<{ scope: ResolvedScope; warehouseId: string | null }> {
    const confined = confineToAssignedWarehouses(scope);
    assertWarehouseVisible(confined, query.warehouseId);
    await assertRangeAllowed(query);
    return { scope: confined, warehouseId: query.warehouseId ?? null };
  }

  return {
    async sales(scope, query) {
      const { scope: confined, warehouseId } = await prepare(scope, query);
      const rows = await repo.sales(db, {
        from: query.from,
        to: query.to,
        scope: confined,
        warehouseId,
        channel: query.channel ?? null,
      });
      const total = parseMoney(rows.total);
      return {
        from: query.from,
        to: query.to,
        warehouseId,
        count: rows.count,
        total,
        averageOrderValue: rows.count === 0 ? parseMoney('0') : fromPaise(averagePaise(toPaise(total), rows.count)),
        byDay: rows.byDay.map((d) => ({ date: d.date, count: d.count, total: parseMoney(d.total) })),
        byChannel: rows.byChannel.map((c) => ({ channel: c.channel, count: c.count, total: parseMoney(c.total) })),
        byStatus: rows.byStatus,
      };
    },

    async receiving(scope, query) {
      const { scope: confined, warehouseId } = await prepare(scope, query);
      const byDay = await repo.receiving(db, { from: query.from, to: query.to, scope: confined, warehouseId });
      return { from: query.from, to: query.to, warehouseId, byDay };
    },

    async inventory(scope, query) {
      const confined = confineToAssignedWarehouses(scope);
      assertWarehouseVisible(confined, query.warehouseId);
      const warehouseId = query.warehouseId ?? null;
      const items = await repo.inventory(db, { scope: confined, warehouseId });
      return { from: query.from ?? null, to: query.to ?? null, warehouseId, items };
    },

    async returns(scope, query) {
      const { scope: confined, warehouseId } = await prepare(scope, query);
      const rows = await repo.returns(db, { from: query.from, to: query.to, scope: confined, warehouseId });
      return {
        from: query.from,
        to: query.to,
        warehouseId,
        byStatus: rows.byStatus,
        byDay: rows.byDay,
        refundedTotal: parseMoney(rows.refundedTotal),
      };
    },

    async customers(scope, query) {
      const { scope: confined, warehouseId } = await prepare(scope, query);
      const rows = await repo.customers(db, { from: query.from, to: query.to, scope: confined, warehouseId });
      return { from: query.from, to: query.to, warehouseId, ...rows };
    },

    async cashTopups(scope, query) {
      const { scope: confined, warehouseId } = await prepare(scope, query);
      const rows = await repo.cashTopups(db, { from: query.from, to: query.to, scope: confined, warehouseId });
      return {
        from: query.from,
        to: query.to,
        warehouseId,
        count: rows.count,
        total: parseMoney(rows.total),
        byDay: rows.byDay.map((d) => ({ date: d.date, count: d.count, total: parseMoney(d.total) })),
      };
    },

    async timeSeries(scope, query) {
      const { scope: confined, warehouseId } = await prepare(scope, query);
      const res = await repo.timeSeries(db, {
        from: query.from,
        to: query.to,
        scope: confined,
        warehouseId,
        metric: query.metric,
        period: query.period,
      });
      return {
        metric: query.metric,
        period: query.period,
        from: query.from,
        to: query.to,
        warehouseId,
        total: res.total,
        buckets: res.buckets,
      };
    },

    async farmerPerformance(scope, query) {
      const { scope: confined, warehouseId } = await prepare(scope, query);
      // prepare() used startIndex=1 on warehouseScope; farmerScopeFilter here uses startIndex=3 because
      // repo.farmerPerformance binds $1=from, $2=to first. Shift via scopedWhere or pass directly?
      // Wait: repo.farmerPerformance places farmerScope at $3..N: pass scoped filter starting at $3!
      const farmerScope = farmerScopeForWindowedParams(confined, 3);
      const res = await repo.farmerPerformance(db, {
        from: query.from,
        to: query.to,
        scope: confined,
        warehouseId,
        farmerScope,
        zoneId: query.zoneId ?? null,
      });
      return {
        from: query.from,
        to: query.to,
        warehouseId,
        zoneId: query.zoneId ?? null,
        ...res,
      };
    },

    async complianceTiers(scope, query) {
      const confined = confineToAssignedWarehouses(scope);
      assertWarehouseVisible(confined, query.warehouseId);
      const warehouseId = query.warehouseId ?? null;
      const farmerScope = farmerScopeFilter(confined);
      const res = await repo.complianceTiers(db, {
        farmerScope,
        warehouseId,
        zoneId: query.zoneId ?? null,
      });
      return {
        warehouseId,
        zoneId: query.zoneId ?? null,
        ...res,
      };
    },
  };
}

function farmerScopeForWindowedParams(scope: ResolvedScope, startIndex: number) {
  const base = farmerScopeFilter(scope);
  if (base.params.length === 0) return base;
  // base.sql uses $1..$k; shift each placeholder by (startIndex - 1) so it cleanly pairs with $1=from, $2=to
  const shift = startIndex - 1;
  const shiftedSql = base.sql.replace(/\$(\d+)/g, (_m, n) => `$${Number(n) + shift}`);
  return { sql: shiftedSql, params: base.params, nextIndex: base.nextIndex + shift };
}

export const reportsService: ReportsService = createReportsService({ repo: reportsRepo, db: pool });
