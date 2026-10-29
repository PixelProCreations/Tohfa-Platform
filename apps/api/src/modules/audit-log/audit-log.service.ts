/**
 * Audit log read and export (BR-35) with warehouse scoping (BR-30).
 *
 * Scope comes from docs/rbac.json `auditlog.view`: SUPER_ADMIN and TOHFA_ADMIN hold `all`,
 * MAIN_WH_ADMIN and SUB_WH_ADMIN hold `own`. `own` is applied as a WHERE clause on
 * `audit_log.warehouse_id` via `scopedWhere`, so another warehouse's entry is ABSENT from the page
 * rather than refused: a 403 would confirm it exists (requirePermission.ts, contract item 4).
 * An entry tied to no warehouse (`warehouse_id IS NULL`) never matches an `own` scope.
 *
 * MAIN_WH_ADMIN with no assigned warehouse: `scopedWhere` fails closed (FALSE), so the page is
 * empty. That is deliberate and owner-confirmed 2026-10-23: for the audit log a Main admin's `own`
 * is ONLY its assigned warehouse (docs/rbac.json conflict "Audit log scope for Main Warehouse
 * Admin", resolved). The 2026-10-11 decision that reads Main's `own` as "all four warehouses"
 * (apps/api/src/rbac/warehouseScope.ts) covers four other permissions only; do not route
 * `auditlog.view` through it.
 *
 * Export (`auditlog.export`, SUPER_ADMIN only): the read and the export's own audit row share one
 * transaction (BR-35, root CLAUDE.md section 6). The row is written AFTER the read, so the file never
 * contains it, and a refused export (over the row cap) rolls back with nothing written.
 */
import type { Executor } from '../../db/pool.js';
import { pool, withTransaction } from '../../db/pool.js';
import { writeAuditLog } from '../../audit/auditLog.js';
import { AppError } from '../../http/problem.js';
import { scopedWhere, type ResolvedScope } from '../../rbac/requirePermission.js';
import { toCsv, type CsvCell, type CsvColumn } from '../report-exports/csv.js';
import { auditLogRepo, type AuditLogRepo } from './audit-log.repo.js';
import type { AuditLogEntry, ExportAuditLogQuery, ListAuditLogQuery, ListAuditLogResponse } from './audit-log.schema.js';

/** Runs `fn` in one transaction. Injectable so tests can run on a rolled-back client. */
export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export interface AuditLogServiceDeps {
  repo: AuditLogRepo;
  db: Executor;
  transaction: TransactionRunner;
}

export interface AuditLogExport {
  filename: string;
  csv: string;
  rowCount: number;
}

export interface AuditLogService {
  list(scope: ResolvedScope, query: ListAuditLogQuery): Promise<ListAuditLogResponse>;
  exportCsv(scope: ResolvedScope, query: ExportAuditLogQuery): Promise<AuditLogExport>;
}

/** Fixed name: it carries no filter text, so it needs no escaping in Content-Disposition. */
const EXPORT_FILENAME = 'audit-log.csv';

/** Column order is the contract in docs/openapi.yaml `exportAuditLogCsv`. Every column is text. */
const EXPORT_COLUMNS: readonly CsvColumn[] = [
  'id',
  'at',
  'actor_id',
  'actor_type',
  'actor_role',
  'action',
  'entity_type',
  'entity_id',
  'warehouse_id',
  'outcome',
  'changed_fields',
  'correlation_id',
  'ip',
  'before',
  'after',
].map((name) => ({ name, kind: 'text' as const }));

function jsonCell(value: unknown): CsvCell {
  return value === null || value === undefined ? null : JSON.stringify(value);
}

function toRow(entry: AuditLogEntry): CsvCell[] {
  return [
    entry.id,
    entry.at,
    entry.actorId,
    entry.actorType,
    entry.actorRole,
    entry.action,
    entry.entityType,
    entry.entityId,
    entry.warehouseId,
    entry.outcome,
    entry.changedFields === null ? null : entry.changedFields.join(';'),
    entry.correlationId,
    entry.ip,
    jsonCell(entry.before),
    jsonCell(entry.after),
  ];
}

/** The single place a scope becomes SQL for this module. */
function scopeFilter(scope: ResolvedScope) {
  return scopedWhere(scope, { warehouseColumn: 'a.warehouse_id' });
}

export function createAuditLogService(deps: Partial<AuditLogServiceDeps> = {}): AuditLogService {
  const repo = deps.repo ?? auditLogRepo;
  const db = deps.db ?? pool;
  const transaction: TransactionRunner = deps.transaction ?? ((fn) => withTransaction(fn));

  return {
    async list(scope, query): Promise<ListAuditLogResponse> {
      const { cursor, limit, ...filters } = query;
      const result = await repo.list(db, { filters, scope: scopeFilter(scope), limit, cursor });
      return { items: result.items, page: { nextCursor: result.nextCursor, hasMore: result.hasMore } };
    },

    async exportCsv(scope, filters): Promise<AuditLogExport> {
      return transaction(async (tx) => {
        // The cap is `system_config.export_max_rows` (the report exports' key), never a literal.
        const cap = await repo.getMaxRows(tx);
        // Read one past the cap so "over" is detectable without counting the whole table.
        const entries = await repo.listForExport(tx, { filters, scope: scopeFilter(scope), limit: cap + 1 });
        if (entries.length > cap) {
          // Never truncated: a partial audit export would look complete and be wrong.
          throw new AppError('VALIDATION_FAILED', {
            detail: 'One or more fields are invalid.',
            errors: { 'query.to': [`This export has more than ${cap} rows. Narrow the date range or the filters.`] },
          });
        }

        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'auditlog.export',
          entityType: 'audit_log',
          entityId: null,
          after: { filters, rowCount: entries.length },
        });

        return { filename: EXPORT_FILENAME, csv: toCsv(EXPORT_COLUMNS, entries.map(toRow)), rowCount: entries.length };
      });
    },
  };
}

/** The production instance. */
export const auditLogService: AuditLogService = createAuditLogService();
