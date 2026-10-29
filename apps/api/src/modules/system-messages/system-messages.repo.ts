import { ScopeLevel, type RoleCode } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { warehouseScopeFilter } from '../../rbac/warehouseScope.js';
import type { ListSystemMessagesQuery, SystemMessageType } from './system-messages.schema.js';

/** Who is asking: the visibility rule needs the user, every role they hold and their warehouses. */
export interface SystemMessageViewer {
  userId: string;
  roleCodes: RoleCode[];
  scope: ResolvedScope;
}

export interface SystemMessageRow {
  id: string;
  /** Never ZONE: the visibility clause does not match zone announcements. */
  scope: 'SYSTEM_WIDE' | 'WAREHOUSE' | 'ROLE';
  /** BR-134: never null; the column defaults to GENERAL and a CHECK keeps it inside the set. */
  type: SystemMessageType;
  title: string;
  body: string;
  locale: 'en' | 'ta';
  starts_at: Date;
  ends_at: Date | null;
  created_at: Date;
  read_at: Date | null;
}

/**
 * `startsAt` is the database's own text rendering of the timestamp, to microseconds. A JS Date
 * only holds milliseconds, and round-tripping through it makes rows that differ by less than
 * a millisecond skip or repeat across a page boundary.
 */
export interface SystemMessageCursor {
  startsAt: string;
  id: string;
}

export interface ListSystemMessagesOptions {
  limit: number;
  status: ListSystemMessagesQuery['status'];
  cursor?: SystemMessageCursor | undefined;
}

export interface SystemMessagesRepo {
  list(
    db: Executor,
    viewer: SystemMessageViewer,
    options: ListSystemMessagesOptions,
  ): Promise<{ items: SystemMessageRow[]; next: SystemMessageCursor | null }>;
  findVisibleById(db: Executor, viewer: SystemMessageViewer, id: string): Promise<SystemMessageRow | null>;
  /** Idempotent: inserts the read marker if the message is visible and not yet read; otherwise does nothing. */
  markRead(db: Executor, viewer: SystemMessageViewer, id: string): Promise<void>;
}

interface Row extends SystemMessageRow {
  starts_at_cursor: string;
}

const COLUMNS = `a.id, a.scope, a.type, a.title, a.body, a.locale, a.starts_at, a.ends_at, a.created_at,
       ar.read_at,
       to_char(a.starts_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS starts_at_cursor`;

const FROM = `announcements a
       LEFT JOIN announcement_reads ar ON ar.announcement_id = a.id AND ar.user_id = $1`;

interface Clause {
  sql: string;
  params: unknown[];
}

/**
 * The one visibility rule (BR-65), shared by list, get and mark-read so they cannot drift.
 * `$1` is always the viewer's user id (used by the read-state join); this clause takes
 * placeholders from `$2`.
 *
 * `warehouseScopeFilter` is given a copy of the scope narrowed to `own`: the grant for
 * notification.own.view is `all` for every role in docs/rbac.json (a user always has "all" of
 * their OWN notifications), and an `all` scope would make the helper return TRUE and show a
 * Sub Warehouse admin every warehouse's messages. `own` gives the intended result: assigned
 * warehouses only, no assigned warehouse (Main Warehouse admin) means all, and a farmer or
 * customer is never widened.
 *
 * ZONE messages are deliberately not matched: no zone semantics are defined for these viewers.
 */
function visibleClause(viewer: SystemMessageViewer): Clause {
  const warehouse = warehouseScopeFilter({ ...viewer.scope, level: ScopeLevel.OWN }, 'a.warehouse_id', 2);
  const rolesIndex = warehouse.nextIndex;
  return {
    sql: `a.deleted_at IS NULL
       AND a.starts_at <= now()
       AND (a.ends_at IS NULL OR a.ends_at > now())
       AND (
            a.scope = 'SYSTEM_WIDE'
         OR (a.scope = 'WAREHOUSE' AND ${warehouse.sql})
         OR (a.scope = 'ROLE' AND a.role_id IN (SELECT r.id FROM roles r WHERE r.code = ANY($${rolesIndex}::text[])))
       )`,
    params: [...warehouse.params, viewer.roleCodes],
  };
}

function toRow(row: Row): SystemMessageRow {
  return {
    id: row.id,
    scope: row.scope,
    type: row.type,
    title: row.title,
    body: row.body,
    locale: row.locale,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    created_at: row.created_at,
    read_at: row.read_at,
  };
}

export const systemMessagesRepo: SystemMessagesRepo = {
  async list(db, viewer, options) {
    const visible = visibleClause(viewer);
    const params: unknown[] = [viewer.userId, ...visible.params];
    const filters: string[] = [visible.sql];

    if (options.status === 'unread') filters.push('ar.announcement_id IS NULL');
    if (options.status === 'read') filters.push('ar.announcement_id IS NOT NULL');
    if (options.cursor !== undefined) {
      params.push(options.cursor.startsAt, options.cursor.id);
      filters.push(`(a.starts_at, a.id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`);
    }
    params.push(options.limit + 1);

    const result = await db.query<Row>(
      `SELECT ${COLUMNS}
         FROM ${FROM}
        WHERE ${filters.join('\n          AND ')}
        ORDER BY a.starts_at DESC, a.id DESC
        LIMIT $${params.length}`,
      params,
    );

    const hasMore = result.rows.length > options.limit;
    const page = hasMore ? result.rows.slice(0, options.limit) : result.rows;
    const last = page[page.length - 1];
    return {
      items: page.map(toRow),
      next: hasMore && last !== undefined ? { startsAt: last.starts_at_cursor, id: last.id } : null,
    };
  },

  async findVisibleById(db, viewer, id) {
    const visible = visibleClause(viewer);
    const result = await db.query<Row>(
      `SELECT ${COLUMNS}
         FROM ${FROM}
        WHERE a.id = $${visible.params.length + 2}
          AND ${visible.sql}`,
      [viewer.userId, ...visible.params, id],
    );
    const row = result.rows[0];
    return row === undefined ? null : toRow(row);
  },

  async markRead(db, viewer, id) {
    const visible = visibleClause(viewer);
    // ON CONFLICT DO NOTHING keeps the first read time on a replay.
    await db.query(
      `INSERT INTO announcement_reads (announcement_id, user_id)
       SELECT a.id, $1::uuid
         FROM announcements a
        WHERE a.id = $${visible.params.length + 2}
          AND ${visible.sql}
       ON CONFLICT (announcement_id, user_id) DO NOTHING`,
      [viewer.userId, ...visible.params, id],
    );
  },
};
