/**
 * Admin announcement SQL (BR-213). SQL only — no business decisions, no AppError.
 *
 * Every function takes an `Executor` so the service can run several of them inside one
 * transaction with the audit row.
 *
 * Table: `announcements` (db/migrations/0008_platform.sql, + `type` from 0081).
 *   id, scope, warehouse_id, zone_id, role_id, title, body, locale,
 *   starts_at, ends_at, created_by, created_at, updated_at, deleted_at, type
 */
import type { Executor } from '../../db/pool.js';
import { CURSOR_TAGS, encodeKeysetCursor, requireKeysetCursor } from '../../http/keysetCursor.js';
import { MICRO_TS_SQL } from '../../http/microTimestamp.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { warehouseScopeFilter } from '../../rbac/warehouseScope.js';
import type {
  AdminAnnouncement,
  AnnouncementTarget,
  ListAdminAnnouncementsQuery,
} from './admin-announcements.schema.js';

/**
 * What the caller may see and touch, one entry per create permission.
 *
 * `systemWide` is the scope resolved for `announcement.system_wide.create` (null when the caller
 * does not hold it), `warehouse` the one for `announcement.warehouse.create`. Visibility is
 * derived from the create grants on purpose: there is no separate announcement read or manage
 * code in docs/rbac.json, and "may publish it" is the narrowest honest reading of "may manage it".
 */
export interface AdminAnnouncementAuthority {
  systemWide: ResolvedScope | null;
  warehouse: ResolvedScope | null;
}

export interface AdminAnnouncementRow {
  id: string;
  scope: AnnouncementTarget;
  warehouse_id: string | null;
  zone_id: string | null;
  role_id: string | null;
  type: AdminAnnouncement['type'];
  title: string;
  body: string;
  locale: AdminAnnouncement['locale'];
  starts_at: Date;
  ends_at: Date | null;
  deleted_at: Date | null;
  created_by: string;
  created_at: Date;
  updated_at: Date | null;
}

interface CursorRow extends AdminAnnouncementRow {
  cursor_ts: string;
}

export interface InsertAnnouncementInput {
  target: 'SYSTEM_WIDE' | 'WAREHOUSE';
  warehouseId: string | null;
  type: AdminAnnouncement['type'];
  title: string;
  body: string;
  locale: AdminAnnouncement['locale'];
  /** null means "the column default", i.e. now(). */
  startsAt: string | null;
  endsAt: string | null;
  createdBy: string;
}

export interface UpdateAnnouncementPatch {
  type?: AdminAnnouncement['type'];
  title?: string;
  body?: string;
  locale?: AdminAnnouncement['locale'];
  startsAt?: string;
  endsAt?: string | null;
}

export interface AdminAnnouncementsRepo {
  list(
    db: Executor,
    authority: AdminAnnouncementAuthority,
    query: ListAdminAnnouncementsQuery,
  ): Promise<{ items: AdminAnnouncementRow[]; nextCursor: string | null; hasMore: boolean }>;
  /** `SELECT ... FOR UPDATE`, so a concurrent edit and retire cannot interleave. */
  lockVisibleById(
    db: Executor,
    authority: AdminAnnouncementAuthority,
    id: string,
  ): Promise<AdminAnnouncementRow | null>;
  insert(db: Executor, input: InsertAnnouncementInput): Promise<AdminAnnouncementRow>;
  update(db: Executor, id: string, patch: UpdateAnnouncementPatch): Promise<AdminAnnouncementRow>;
  /** Sets `deleted_at = now()`. The caller has already checked it is not retired. */
  retire(db: Executor, id: string): Promise<AdminAnnouncementRow>;
  /** Null when the warehouse does not exist or is soft-deleted. */
  findWarehouseId(db: Executor, warehouseId: string): Promise<string | null>;
}

const COLUMNS = `a.id, a.scope, a.warehouse_id, a.zone_id, a.role_id, a.type, a.title, a.body,
       a.locale, a.starts_at, a.ends_at, a.deleted_at, a.created_by, a.created_at, a.updated_at`;

interface Clause {
  sql: string;
  params: unknown[];
  nextIndex: number;
}

/**
 * The one visibility clause, shared by list, get and lock so they cannot drift.
 *
 * A system-wide grant (`all` for SUPER_ADMIN and TOHFA_ADMIN) carries every non-warehouse target:
 * ZONE and ROLE rows have no create code of their own, and only a holder of the system-wide `all`
 * grant could have produced or can read them. A warehouse grant carries WAREHOUSE rows confined by
 * `warehouseScopeFilter` — `own` (SUB_WH_ADMIN) means its assigned warehouses, `all` means every
 * warehouse. Out-of-scope rows fall out of the WHERE clause, so they come back EMPTY rather than
 * 403: a 403 would confirm the row exists (see rbac/requirePermission.ts).
 *
 * With neither grant the clause is FALSE. The route gate already rejects that caller; keeping it
 * fail-closed means a service called from a job or a script cannot leak by forgetting the gate.
 */
function visibleClause(authority: AdminAnnouncementAuthority, startIndex: number): Clause {
  const parts: string[] = [];
  const params: unknown[] = [];
  let index = startIndex;

  if (authority.systemWide !== null) {
    parts.push(`a.scope <> 'WAREHOUSE'`);
  }
  if (authority.warehouse !== null) {
    const filter = warehouseScopeFilter(authority.warehouse, 'a.warehouse_id', index);
    parts.push(`(a.scope = 'WAREHOUSE' AND ${filter.sql})`);
    params.push(...filter.params);
    index = filter.nextIndex;
  }

  return { sql: parts.length === 0 ? 'FALSE' : `(${parts.join(' OR ')})`, params, nextIndex: index };
}

/** The status filter, expressed over the stored columns (see ANNOUNCEMENT_STATUSES). */
function statusClause(status: NonNullable<ListAdminAnnouncementsQuery['status']>): string {
  switch (status) {
    case 'RETIRED':
      return 'a.deleted_at IS NOT NULL';
    case 'SCHEDULED':
      return 'a.deleted_at IS NULL AND a.starts_at > now()';
    case 'EXPIRED':
      return 'a.deleted_at IS NULL AND a.starts_at <= now() AND a.ends_at IS NOT NULL AND a.ends_at <= now()';
    case 'ACTIVE':
      return 'a.deleted_at IS NULL AND a.starts_at <= now() AND (a.ends_at IS NULL OR a.ends_at > now())';
  }
}

export const adminAnnouncementsRepo: AdminAnnouncementsRepo = {
  async list(db, authority, query) {
    const visible = visibleClause(authority, 1);
    const params: unknown[] = [...visible.params];
    const filters: string[] = [visible.sql];
    let index = visible.nextIndex;

    if (query.target !== undefined) {
      params.push(query.target);
      filters.push(`a.scope = $${index++}`);
    }
    if (query.type !== undefined) {
      params.push(query.type);
      filters.push(`a.type = $${index++}`);
    }
    if (query.warehouseId !== undefined) {
      params.push(query.warehouseId);
      filters.push(`a.warehouse_id = $${index++}`);
    }
    if (query.status !== undefined) {
      filters.push(`(${statusClause(query.status)})`);
    }
    if (query.cursor !== undefined) {
      const key = requireKeysetCursor(CURSOR_TAGS.adminAnnouncements, query.cursor);
      params.push(key.ts, key.id);
      filters.push(`(a.created_at, a.id) < ($${index++}::timestamptz, $${index++}::uuid)`);
    }
    params.push(query.limit + 1);

    const result = await db.query<CursorRow>(
      `SELECT ${COLUMNS}, ${MICRO_TS_SQL('a.created_at')} AS cursor_ts
         FROM announcements a
        WHERE ${filters.join('\n          AND ')}
        ORDER BY a.created_at DESC, a.id DESC
        LIMIT $${index}`,
      params,
    );

    const hasMore = result.rows.length > query.limit;
    const page = hasMore ? result.rows.slice(0, query.limit) : result.rows;
    const last = page[page.length - 1];
    return {
      items: page,
      hasMore,
      nextCursor:
        hasMore && last !== undefined
          ? encodeKeysetCursor(CURSOR_TAGS.adminAnnouncements, { ts: last.cursor_ts, id: last.id })
          : null,
    };
  },

  async lockVisibleById(db, authority, id) {
    const visible = visibleClause(authority, 1);
    const result = await db.query<AdminAnnouncementRow>(
      `SELECT ${COLUMNS}
         FROM announcements a
        WHERE ${visible.sql}
          AND a.id = $${visible.nextIndex}
        FOR UPDATE`,
      [...visible.params, id],
    );
    return result.rows[0] ?? null;
  },

  async insert(db, input) {
    // `starts_at` is passed as NULL when the caller did not name one, and COALESCE falls back to
    // now() — the column default cannot be used from a parameterised list of columns.
    const result = await db.query<AdminAnnouncementRow>(
      `INSERT INTO announcements
         (scope, warehouse_id, type, title, body, locale, starts_at, ends_at, created_by)
       VALUES
         ($1, $2::uuid, $3, $4, $5, $6, COALESCE($7::timestamptz, now()), $8::timestamptz, $9::uuid)
       RETURNING id, scope, warehouse_id, zone_id, role_id, type, title, body, locale,
                 starts_at, ends_at, deleted_at, created_by, created_at, updated_at`,
      [
        input.target,
        input.warehouseId,
        input.type,
        input.title,
        input.body,
        input.locale,
        input.startsAt,
        input.endsAt,
        input.createdBy,
      ],
    );
    const row = result.rows[0];
    if (row === undefined) throw new Error('announcements insert returned no row');
    return row;
  },

  async update(db, id, patch) {
    const sets: string[] = [];
    const params: unknown[] = [];
    let index = 1;

    if (patch.type !== undefined) {
      params.push(patch.type);
      sets.push(`type = $${index++}`);
    }
    if (patch.title !== undefined) {
      params.push(patch.title);
      sets.push(`title = $${index++}`);
    }
    if (patch.body !== undefined) {
      params.push(patch.body);
      sets.push(`body = $${index++}`);
    }
    if (patch.locale !== undefined) {
      params.push(patch.locale);
      sets.push(`locale = $${index++}`);
    }
    if (patch.startsAt !== undefined) {
      params.push(patch.startsAt);
      sets.push(`starts_at = $${index++}::timestamptz`);
    }
    if (patch.endsAt !== undefined) {
      params.push(patch.endsAt);
      sets.push(`ends_at = $${index++}::timestamptz`);
    }
    sets.push('updated_at = now()');
    params.push(id);

    const result = await db.query<AdminAnnouncementRow>(
      `UPDATE announcements
          SET ${sets.join(', ')}
        WHERE id = $${index}
       RETURNING id, scope, warehouse_id, zone_id, role_id, type, title, body, locale,
                 starts_at, ends_at, deleted_at, created_by, created_at, updated_at`,
      params,
    );
    const row = result.rows[0];
    if (row === undefined) throw new Error('announcements update returned no row');
    return row;
  },

  async retire(db, id) {
    const result = await db.query<AdminAnnouncementRow>(
      `UPDATE announcements
          SET deleted_at = now(), updated_at = now()
        WHERE id = $1 AND deleted_at IS NULL
       RETURNING id, scope, warehouse_id, zone_id, role_id, type, title, body, locale,
                 starts_at, ends_at, deleted_at, created_by, created_at, updated_at`,
      [id],
    );
    const row = result.rows[0];
    if (row === undefined) throw new Error('announcements retire returned no row');
    return row;
  },

  async findWarehouseId(db, warehouseId) {
    const result = await db.query<{ id: string }>(
      `SELECT id FROM warehouses WHERE id = $1 AND deleted_at IS NULL`,
      [warehouseId],
    );
    return result.rows[0]?.id ?? null;
  },
};
