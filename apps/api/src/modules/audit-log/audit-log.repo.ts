/**
 * Audit log (BR-35): SQL only, and every statement is a SELECT.
 *
 * `audit_log` is append-only at the database level (db/migrations/0008_platform.sql); this repo
 * has no write path on purpose. New rows are written only by `writeAuditLog` (src/audit), on the
 * transaction of the change they record.
 *
 * The scope fragment comes from the service (`scopedWhere` on `a.warehouse_id`); this file applies
 * it and decides nothing about who may see what.
 */
import type { Executor } from '../../db/pool.js';
import { CURSOR_TAGS, encodeKeysetCursor, requireKeysetCursor } from '../../http/keysetCursor.js';
import { MICRO_TS_SQL } from '../../http/microTimestamp.js';
import type { ScopedWhere } from '../../rbac/requirePermission.js';
import { reportExportsRepo } from '../report-exports/report-exports.repo.js';
import type { AuditLogEntry, AuditLogFilters } from './audit-log.schema.js';

/** Raw row shape as it comes out of Postgres. Never leaves this file. */
interface AuditLogRow {
  id: string;
  actor_id: string | null;
  actor_type: string;
  actor_role: string | null;
  action_code: string;
  entity_type: string;
  entity_id: string | null;
  warehouse_id: string | null;
  outcome: string;
  before: unknown;
  after: unknown;
  changed_fields: string[] | null;
  correlation_id: string | null;
  ip: string | null;
  created_at: Date;
}

function toEntry(row: AuditLogRow): AuditLogEntry {
  return {
    id: row.id,
    actorId: row.actor_id,
    actorType: row.actor_type as AuditLogEntry['actorType'],
    actorRole: row.actor_role,
    action: row.action_code,
    entityType: row.entity_type,
    entityId: row.entity_id,
    warehouseId: row.warehouse_id,
    outcome: row.outcome as AuditLogEntry['outcome'],
    before: row.before,
    after: row.after,
    changedFields: row.changed_fields,
    correlationId: row.correlation_id,
    ip: row.ip,
    at: row.created_at.toISOString(),
  };
}

const SELECT_COLUMNS = `
  a.id, a.actor_id, a.actor_type::text AS actor_type, a.actor_role, a.action_code, a.entity_type,
  a.entity_id, a.warehouse_id, a.outcome, a.before, a.after, a.changed_fields, a.correlation_id,
  host(a.ip) AS ip, a.created_at
`;

export interface ListArgs {
  filters: AuditLogFilters;
  /** Scope fragment from `scopedWhere(scope, { warehouseColumn: 'a.warehouse_id' })`. */
  scope: ScopedWhere;
  limit: number;
  /** Opaque cursor already validated by the route schema. */
  cursor?: string | undefined;
}

export interface ListResult {
  items: AuditLogEntry[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ExportArgs {
  filters: AuditLogFilters;
  scope: ScopedWhere;
  /** Maximum rows to read. The service passes cap + 1 so it can tell "over the cap" apart. */
  limit: number;
}

export interface AuditLogRepo {
  list(db: Executor, args: ListArgs): Promise<ListResult>;
  /** Every matching entry in list order, at most `limit` of them. */
  listForExport(db: Executor, args: ExportArgs): Promise<AuditLogEntry[]>;
  /** `system_config.export_max_rows`, the key the report exports already use. */
  getMaxRows(db: Executor): Promise<number>;
}

/** WHERE clause for the filters plus the scope, with positional params. */
function buildWhere(filters: AuditLogFilters, scope: ScopedWhere): { conditions: string[]; params: unknown[] } {
  const params: unknown[] = [];
  const conditions: string[] = [];

  const scoped = renumber(scope, 1);
  conditions.push(scoped.sql);
  params.push(...scoped.params);

  if (filters.actorId !== undefined) {
    params.push(filters.actorId);
    conditions.push(`a.actor_id = $${params.length}::uuid`);
  }
  if (filters.action !== undefined) {
    params.push(filters.action);
    conditions.push(`a.action_code = $${params.length}`);
  }
  if (filters.entityType !== undefined) {
    params.push(filters.entityType);
    conditions.push(`a.entity_type = $${params.length}`);
  }
  if (filters.entityId !== undefined) {
    params.push(filters.entityId);
    conditions.push(`a.entity_id = $${params.length}::uuid`);
  }
  if (filters.from !== undefined) {
    params.push(filters.from);
    conditions.push(`a.created_at >= $${params.length}::timestamptz`);
  }
  if (filters.to !== undefined) {
    params.push(filters.to);
    conditions.push(`a.created_at <= $${params.length}::timestamptz`);
  }
  return { conditions, params };
}

export const auditLogRepo: AuditLogRepo = {
  async list(db, { filters, scope, limit, cursor }): Promise<ListResult> {
    const { conditions, params } = buildWhere(filters, scope);

    if (cursor !== undefined && cursor.length > 0) {
      // Keyset on (created_at, id), matching the ORDER BY, so tied timestamps are neither skipped
      // nor repeated (same scheme as the stock ledger list).
      const after = requireKeysetCursor(CURSOR_TAGS.auditLog, cursor);
      params.push(after.ts, after.id);
      conditions.push(`(a.created_at, a.id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`);
    }

    params.push(limit + 1);
    const result = await db.query<AuditLogRow & { cursor_ts: string }>(
      `SELECT ${SELECT_COLUMNS}, ${MICRO_TS_SQL('a.created_at')} AS cursor_ts
         FROM audit_log a
        WHERE ${conditions.join(' AND ')}
        ORDER BY a.created_at DESC, a.id DESC
        LIMIT $${params.length}`,
      params,
    );

    const hasMore = result.rows.length > limit;
    const rows = hasMore ? result.rows.slice(0, limit) : result.rows;
    const last = rows[rows.length - 1];
    const nextCursor =
      hasMore && last !== undefined ? encodeKeysetCursor(CURSOR_TAGS.auditLog, { ts: last.cursor_ts, id: last.id }) : null;

    return { items: rows.map(toEntry), nextCursor, hasMore };
  },

  async listForExport(db, { filters, scope, limit }): Promise<AuditLogEntry[]> {
    const { conditions, params } = buildWhere(filters, scope);
    params.push(limit);
    const result = await db.query<AuditLogRow>(
      `SELECT ${SELECT_COLUMNS}
         FROM audit_log a
        WHERE ${conditions.join(' AND ')}
        ORDER BY a.created_at DESC, a.id DESC
        LIMIT $${params.length}`,
      params,
    );
    return result.rows.map(toEntry);
  },

  async getMaxRows(db): Promise<number> {
    // One key and one fallback for every CSV export in the API; see report-exports.repo.ts.
    return reportExportsRepo.getMaxRows(db);
  },
};

/** Shift a `scopedWhere` fragment so its placeholders start at `startIndex`. */
function renumber(scope: ScopedWhere, startIndex: number): ScopedWhere {
  if (scope.params.length === 0) return scope;
  let next = startIndex;
  const sql = scope.sql.replace(/\$(\d+)/g, () => `$${next++}`);
  return { sql, params: scope.params, nextIndex: next };
}
