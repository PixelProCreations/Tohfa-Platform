/**
 * Report exports (BR-76): CSV files of the reports and finance reports.
 *
 * The service takes a `ResolvedScope`, never a `Request`. An export is the SAME read as the report
 * or finance endpoint it exports (same filters, same warehouse scoping, same range cap, same SQL:
 * it calls the report and finance repos unchanged), flattened to rows, plus four things a file needs:
 *
 *  - a row cap, `system_config.export_max_rows`: an export over it is 422, never truncated;
 *  - a file name built only from safe characters;
 *  - the CSV injection guard and RFC 4180 quoting (csv.ts);
 *  - an `audit_log` row (`report.export`), written on the SAME transaction as the reads, with a
 *    masked image (report, warehouse, range, row count: never the data).
 *
 * Customer data: the customers export is the report's counts, nothing more. No export selects a
 * name, phone, e-mail, address or customer code; the expense list leaves out the vendor and
 * description free text, which can carry names and phone numbers (the finance audit rows are masked
 * for the same reason).
 */
import { fromPaise, parseMoney, ScopeLevel, toPaise, type Money } from '@tohfa/shared-types';
import { writeAuditLog } from '../../audit/auditLog.js';
import { withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { warehouseVisible } from '../../rbac/warehouseScope.js';
import type { ExpenseFilters, ExpenseRecord, FinanceRepo } from '../finance/finance.repo.js';
import { financeRepo } from '../finance/finance.repo.js';
import type { ReportsRepo } from '../reports/reports.repo.js';
import { reportsRepo } from '../reports/reports.repo.js';
import { toCsv, type CsvCell, type CsvColumn } from './csv.js';
import { reportExportsRepo, type ReportExportsRepo } from './report-exports.repo.js';
import type {
  ExpensesExportQuery,
  InventoryExportQuery,
  RangeExportQuery,
  SalesExportQuery,
} from './report-exports.schema.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

/** The only expense columns an export reads. Vendor and description are free text and stay out. */
export type ExpenseExportRow = Pick<
  ExpenseRecord,
  'id' | 'warehouseId' | 'expenseDate' | 'category' | 'amount' | 'paymentMethod' | 'status'
>;

/** The report and finance reads an export reuses, exactly as those modules expose them. */
export interface ReportExportsSources {
  reports: Pick<ReportsRepo, 'getMaxRangeDays' | 'sales' | 'receiving' | 'inventory' | 'returns' | 'customers' | 'cashTopups'>;
  finance: Pick<
    FinanceRepo,
    | 'getReportMaxRangeDays'
    | 'revenueByChannel'
    | 'revenueReportByDay'
    | 'revenueReportByPaymentMethod'
    | 'expenseReportByDay'
    | 'expenseReportByCategory'
    | 'expenseReportByPaymentMethod'
  > & {
    /** `FinanceRepo.listExpenses`, narrowed to the rows' export columns. */
    listExpenses(
      db: Executor,
      scope: ResolvedScope,
      filters: ExpenseFilters,
      limit: number,
    ): Promise<{ items: ExpenseExportRow[] }>;
  };
}

export interface ReportExportsDeps {
  sources: ReportExportsSources;
  repo: ReportExportsRepo;
  runTx: TransactionRunner;
}

/** One export: which report, and the validated query for it. */
export type ExportRequest =
  | { report: 'sales'; query: SalesExportQuery }
  | { report: 'inventory'; query: InventoryExportQuery }
  | { report: 'expenses'; query: ExpensesExportQuery }
  | {
      report: 'receiving' | 'returns' | 'customers' | 'cash-topups' | 'finance-revenue' | 'finance-expenses';
      query: RangeExportQuery;
    };

export interface ExportResult {
  filename: string;
  csv: string;
  /** Data rows, the header row not counted. */
  rowCount: number;
}

export interface ReportExportsService {
  exportReport(scope: ResolvedScope, request: ExportRequest): Promise<ExportResult>;
}

interface Table {
  columns: readonly CsvColumn[];
  rows: CsvCell[][];
}

const text = (name: string): CsvColumn => ({ name, kind: 'text' });
const number = (name: string): CsvColumn => ({ name, kind: 'number' });

const SECTION_COLUMNS = [text('section'), text('key')] as const;

/**
 * docs/rbac.json `scopeFilters` says every query of a warehouse-dimension admin is filtered by its
 * assigned warehouse, whatever level the permission grants, and several of the source permissions
 * are `all` for Sub warehouse admins. So a scope that carries assigned warehouses is narrowed to
 * them by treating it as `own`. (The same rule as reports.service.ts, which does not export it.)
 */
function confineToAssignedWarehouses(scope: ResolvedScope): ResolvedScope {
  const widened = scope.level === ScopeLevel.ALL || scope.level === ScopeLevel.CONDITIONAL;
  if (widened && scope.warehouseIds.length > 0) return { ...scope, level: ScopeLevel.OWN };
  return scope;
}

/** The finance report repos take no warehouse filter, only a scope: narrow the scope to the one asked for. */
function narrowToWarehouse(scope: ResolvedScope, warehouseId: string | null): ResolvedScope {
  return warehouseId === null ? scope : { ...scope, level: ScopeLevel.OWN, warehouseIds: [warehouseId] };
}

/** The warehouse a Sub admin is confined to, when it is exactly one: it names the file and the audit row. */
function soleAssignedWarehouse(scope: ResolvedScope): string | null {
  const confined = scope.level !== ScopeLevel.ALL && scope.level !== ScopeLevel.CONDITIONAL;
  return confined && scope.warehouseIds.length === 1 ? (scope.warehouseIds[0] as string) : null;
}

/** Exact integer-paise sum of 2dp money strings. */
function sumMoney(values: readonly string[]): Money {
  return fromPaise(values.reduce((sum, value) => sum + toPaise(parseMoney(value)), 0));
}

const sum = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0);

/** A file-name part: anything outside [A-Za-z0-9_-] becomes `-`. */
function safeNamePart(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]/g, '-');
}

export function createReportExportsService(deps: ReportExportsDeps): ReportExportsService {
  const { sources, repo, runTx } = deps;

  /** BR-76j: the widest `to - from` span is the one the exported report applies. */
  function assertSpanAllowed(query: { from: string; to: string }, maxRangeDays: number): void {
    const spanDays = (Date.parse(`${query.to}T00:00:00Z`) - Date.parse(`${query.from}T00:00:00Z`)) / MS_PER_DAY;
    if (spanDays > maxRangeDays) {
      throw new AppError('VALIDATION_FAILED', {
        detail: 'One or more fields are invalid.',
        errors: { 'query.to': [`Date range cannot exceed ${maxRangeDays} days.`] },
      });
    }
  }

  async function build(
    tx: Executor,
    scope: ResolvedScope,
    request: ExportRequest,
    warehouseId: string | null,
    cap: number,
  ): Promise<Table> {
    const { reports, finance } = sources;
    switch (request.report) {
      case 'sales': {
        const { query } = request;
        assertSpanAllowed(query, await reports.getMaxRangeDays(tx));
        const data = await reports.sales(tx, { from: query.from, to: query.to, scope, warehouseId, channel: query.channel ?? null });
        return {
          columns: [...SECTION_COLUMNS, number('order_count'), number('total_amount')],
          rows: [
            ['summary', 'all', String(data.count), parseMoney(data.total)],
            ...data.byDay.map((d): CsvCell[] => ['day', d.date, String(d.count), parseMoney(d.total)]),
            ...data.byChannel.map((c): CsvCell[] => ['channel', c.channel, String(c.count), parseMoney(c.total)]),
            ...data.byStatus.map((s): CsvCell[] => ['status', s.status, String(s.count), null]),
          ],
        };
      }
      case 'receiving': {
        const { query } = request;
        assertSpanAllowed(query, await reports.getMaxRangeDays(tx));
        const data = await reports.receiving(tx, { from: query.from, to: query.to, scope, warehouseId });
        return {
          columns: [text('date'), text('status'), number('grn_count')],
          rows: data.map((r): CsvCell[] => [r.date, r.status, String(r.count)]),
        };
      }
      case 'inventory': {
        const data = await reports.inventory(tx, { scope, warehouseId });
        return {
          columns: [text('crop_id'), text('crop_name'), number('total_qty_kg'), number('batch_count')],
          rows: data.map((r): CsvCell[] => [r.cropId, r.name, r.totalQty, String(r.batchCount)]),
        };
      }
      case 'returns': {
        const { query } = request;
        assertSpanAllowed(query, await reports.getMaxRangeDays(tx));
        const data = await reports.returns(tx, { from: query.from, to: query.to, scope, warehouseId });
        return {
          columns: [...SECTION_COLUMNS, number('return_count'), number('refunded_amount')],
          rows: [
            ['summary', 'all', String(sum(data.byStatus.map((s) => s.count))), parseMoney(data.refundedTotal)],
            ...data.byStatus.map((s): CsvCell[] => ['status', s.status, String(s.count), null]),
            ...data.byDay.map((d): CsvCell[] => ['day', d.date, String(d.count), null]),
          ],
        };
      }
      case 'customers': {
        const { query } = request;
        assertSpanAllowed(query, await reports.getMaxRangeDays(tx));
        const data = await reports.customers(tx, { from: query.from, to: query.to, scope, warehouseId });
        return {
          columns: [...SECTION_COLUMNS, number('customer_count')],
          rows: [
            ['summary', 'customers_with_orders', String(data.customersWithOrders)],
            ['summary', 'new_customers', String(data.newCustomers)],
            ...data.byDay.map((d): CsvCell[] => ['day', d.date, String(d.count)]),
          ],
        };
      }
      case 'cash-topups': {
        const { query } = request;
        assertSpanAllowed(query, await reports.getMaxRangeDays(tx));
        const data = await reports.cashTopups(tx, { from: query.from, to: query.to, scope, warehouseId });
        return {
          columns: [...SECTION_COLUMNS, number('topup_count'), number('total_amount')],
          rows: [
            ['summary', 'all', String(data.count), parseMoney(data.total)],
            ...data.byDay.map((d): CsvCell[] => ['day', d.date, String(d.count), parseMoney(d.total)]),
          ],
        };
      }
      case 'finance-revenue': {
        const { query } = request;
        assertSpanAllowed(query, await finance.getReportMaxRangeDays(tx));
        const narrowed = narrowToWarehouse(scope, warehouseId);
        const byChannel = await finance.revenueByChannel(tx, narrowed, { from: query.from, to: query.to });
        const byDay = await finance.revenueReportByDay(tx, narrowed, query.from, query.to);
        const byPaymentMethod = await finance.revenueReportByPaymentMethod(tx, narrowed, query.from, query.to);
        return {
          columns: [...SECTION_COLUMNS, number('order_count'), number('total_amount')],
          rows: [
            ['summary', 'all', String(sum(byChannel.map((c) => c.count))), sumMoney(byChannel.map((c) => c.total))],
            ...byDay.map((d): CsvCell[] => ['day', d.date, String(d.count), d.total]),
            ...byChannel.map((c): CsvCell[] => ['channel', c.channel, String(c.count), c.total]),
            ...byPaymentMethod.map((m): CsvCell[] => ['payment_method', m.paymentMethod, String(m.count), m.total]),
          ],
        };
      }
      case 'finance-expenses': {
        const { query } = request;
        assertSpanAllowed(query, await finance.getReportMaxRangeDays(tx));
        const narrowed = narrowToWarehouse(scope, warehouseId);
        const byDay = await finance.expenseReportByDay(tx, narrowed, query.from, query.to);
        const byCategory = await finance.expenseReportByCategory(tx, narrowed, query.from, query.to);
        const byPaymentMethod = await finance.expenseReportByPaymentMethod(tx, narrowed, query.from, query.to);
        return {
          columns: [...SECTION_COLUMNS, number('expense_count'), number('total_amount')],
          rows: [
            ['summary', 'all', String(sum(byDay.map((d) => d.count))), sumMoney(byDay.map((d) => d.total))],
            ...byDay.map((d): CsvCell[] => ['day', d.date, String(d.count), d.total]),
            ...byCategory.map((c): CsvCell[] => ['category', c.category, String(c.count), c.total]),
            // A null payment method (rows recorded before migration 0047) is an empty key, as in the report.
            ...byPaymentMethod.map((m): CsvCell[] => ['payment_method', m.paymentMethod, String(m.count), m.total]),
          ],
        };
      }
      case 'expenses': {
        const { query } = request;
        assertSpanAllowed(query, await finance.getReportMaxRangeDays(tx));
        // One row more than the cap: seeing it is how we know the file would be over the cap.
        const page = await finance.listExpenses(
          tx,
          scope,
          {
            from: query.from,
            to: query.to,
            categoryId: query.categoryId,
            paymentMethod: query.paymentMethod,
            status: query.status,
            ...(warehouseId === null ? {} : { warehouseId }),
          },
          cap + 1,
        );
        return {
          columns: [
            text('expense_id'),
            text('warehouse_id'),
            text('expense_date'),
            text('category'),
            number('amount'),
            text('payment_method'),
            text('status'),
          ],
          rows: page.items.map((e): CsvCell[] => [e.id, e.warehouseId, e.expenseDate, e.category, e.amount, e.paymentMethod, e.status]),
        };
      }
    }
  }

  return {
    async exportReport(scope, request) {
      // The warehouse-admin endpoints this exports are not for a farmer or a customer: a scope that
      // carries either id would read nothing, so say 403 rather than hand back an empty file.
      if (scope.farmerId !== undefined || scope.customerId !== undefined) {
        throw new AppError('FORBIDDEN', { detail: 'Report exports are for warehouse administrators.' });
      }

      const confined = confineToAssignedWarehouses(scope);
      const requested = request.query.warehouseId;
      // 404, not 403: a 403 would confirm that the other warehouse exists (BR-30).
      if (requested !== undefined && !warehouseVisible(confined, requested)) {
        throw new AppError('NOT_FOUND', { detail: 'No such warehouse.' });
      }
      const filterWarehouseId = requested ?? null;
      const effectiveWarehouseId = requested ?? soleAssignedWarehouse(confined);
      const range =
        request.report === 'inventory'
          ? request.query.from !== undefined && request.query.to !== undefined
            ? { from: request.query.from, to: request.query.to }
            : null
          : { from: request.query.from, to: request.query.to };

      return runTx(async (tx) => {
        let warehouseName = 'all';
        if (effectiveWarehouseId !== null) {
          const code = await repo.findWarehouseCode(tx, effectiveWarehouseId);
          if (code === null) throw new AppError('NOT_FOUND', { detail: 'No such warehouse.' });
          warehouseName = safeNamePart(code);
        }

        const cap = await repo.getMaxRows(tx);
        const table = await build(tx, confined, request, filterWarehouseId, cap);
        if (table.rows.length > cap) {
          const key = request.report === 'inventory' ? 'query.warehouseId' : 'query.to';
          const advice = request.report === 'inventory' ? 'Narrow the export to one warehouse.' : 'Narrow the date range or the filters.';
          throw new AppError('VALIDATION_FAILED', {
            detail: 'One or more fields are invalid.',
            errors: { [key]: [`This export has more than ${cap} rows. ${advice}`] },
          });
        }

        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'report.export',
          entityType: 'report_export',
          entityId: null,
          ...(effectiveWarehouseId === null ? {} : { warehouseId: effectiveWarehouseId }),
          // Masked image: which report, where, when and how big. Never a cell of the file.
          after: {
            report: request.report,
            warehouseId: effectiveWarehouseId,
            from: range === null ? null : range.from,
            to: range === null ? null : range.to,
            rowCount: table.rows.length,
          },
        });

        const period = range === null ? 'current' : `${range.from}_${range.to}`;
        return {
          filename: `${request.report}_${warehouseName}_${period}.csv`,
          csv: toCsv(table.columns, table.rows),
          rowCount: table.rows.length,
        };
      });
    },
  };
}

export const reportExportsService: ReportExportsService = createReportExportsService({
  sources: { reports: reportsRepo, finance: financeRepo },
  repo: reportExportsRepo,
  runTx: (fn) => withTransaction(fn),
});
