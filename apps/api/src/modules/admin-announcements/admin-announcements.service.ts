/**
 * Admin announcement authoring (BR-213). All of the module's business logic lives here.
 *
 * The service takes resolved scopes, never a Request, so it is callable from a job, a script or a
 * test. The route resolves ONE scope per create permission (`announcementAuthority`) and hands the
 * pair over; the target of the announcement — the body's for a create, the stored row's for an
 * edit or a retire — picks which of the two applies.
 *
 * Why not one permission: docs/rbac.json grants `announcement.system_wide.create` to SUPER_ADMIN
 * and TOHFA_ADMIN only, while `announcement.warehouse.create` reaches MAIN_WH_ADMIN (`all`) and
 * SUB_WH_ADMIN (`own`). A Sub Warehouse Admin may post to their own warehouse and nothing else;
 * that distinction is the point of the two codes, and it is never made by a role-name check.
 */
import { ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { pool, withTransaction } from '../../db/pool.js';
import { loadRbac } from '../../rbac/loadRbac.js';
import { changedFields, writeAuditLog } from '../../audit/auditLog.js';
import { AppError } from '../../http/problem.js';
import type { Actor } from '../../auth/requireAuth.js';
import { resolveScope, type ResolvedScope } from '../../rbac/requirePermission.js';
import { warehouseVisible } from '../../rbac/warehouseScope.js';
import {
  adminAnnouncementsRepo,
  type AdminAnnouncementAuthority,
  type AdminAnnouncementRow,
  type AdminAnnouncementsRepo,
  type UpdateAnnouncementPatch,
} from './admin-announcements.repo.js';
import {
  CREATE_PERMISSION_BY_TARGET,
  type AdminAnnouncement,
  type AnnouncementStatus,
  type CreateAdminAnnouncementBody,
  type ListAdminAnnouncementsQuery,
  type AdminAnnouncementListResponse,
  type RetireAdminAnnouncementBody,
  type UpdateAdminAnnouncementBody,
} from './admin-announcements.schema.js';

/**
 * The caller's authority over announcements, resolved once from docs/rbac.json. Exported so the
 * route can build it from `req.actor` without putting any decision in the handler, and so a job or
 * a test can build the same thing from an actor it made itself.
 */
export function announcementAuthority(actor: Actor): AdminAnnouncementAuthority {
  return {
    systemWide: resolveScope(actor, CREATE_PERMISSION_BY_TARGET.SYSTEM_WIDE),
    warehouse: usableWarehouseScope(resolveScope(actor, CREATE_PERMISSION_BY_TARGET.WAREHOUSE)),
  };
}

/**
 * Drops a warehouse-dimension grant that has no warehouse to be confined to.
 *
 * `warehouseScopeFilter` reads "restricted grant, no assigned warehouse" as "all four warehouses",
 * which is right for a Main Warehouse Admin (`scopeDimension: null`) and wrong for a Sub Warehouse
 * Admin whose assignment is missing — that is a provisioning bug, and widening it would let an
 * unassigned sub admin address every warehouse. `requirePermission` already rejects that caller at
 * the route with WAREHOUSE_SCOPE_VIOLATION; this closes the same hole for a job, a script or a test
 * that calls the service directly. Decided by the winning role's `scopeDimension` in
 * docs/rbac.json, never by a role name.
 */
function usableWarehouseScope(scope: ResolvedScope | null): ResolvedScope | null {
  if (scope === null) return null;
  const role = loadRbac().rolesByCode.get(scope.roleCode);
  const unconfined =
    role?.scopeDimension === 'warehouse_id' &&
    scope.level !== ScopeLevel.ALL &&
    scope.warehouseIds.length === 0;
  return unconfined ? null : scope;
}

/** Runs `fn` in one transaction. Injectable so tests can roll everything back. */
export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export interface AdminAnnouncementsServiceDeps {
  repo: AdminAnnouncementsRepo;
  db: Executor;
  transaction: TransactionRunner;
  /** Injectable clock; the database is still the authority for stored timestamps. */
  now: () => Date;
}

function iso(value: Date): string {
  return value.toISOString();
}

/** Derived, never stored. Order matters: a retired row reads RETIRED whatever its window says. */
function statusOf(row: AdminAnnouncementRow, now: Date): AnnouncementStatus {
  if (row.deleted_at !== null) return 'RETIRED';
  if (row.starts_at.getTime() > now.getTime()) return 'SCHEDULED';
  if (row.ends_at !== null && row.ends_at.getTime() <= now.getTime()) return 'EXPIRED';
  return 'ACTIVE';
}

function toApi(row: AdminAnnouncementRow, now: Date): AdminAnnouncement {
  return {
    id: row.id,
    target: row.scope,
    warehouseId: row.warehouse_id,
    zoneId: row.zone_id,
    roleId: row.role_id,
    type: row.type,
    title: row.title,
    body: row.body,
    locale: row.locale,
    startsAt: iso(row.starts_at),
    endsAt: row.ends_at === null ? null : iso(row.ends_at),
    status: statusOf(row, now),
    retiredAt: row.deleted_at === null ? null : iso(row.deleted_at),
    createdBy: row.created_by,
    createdAt: iso(row.created_at),
    updatedAt: row.updated_at === null ? null : iso(row.updated_at),
  };
}

/**
 * Who the audit row records. The gate guarantees at least one of the two grants, so this is only
 * null for a caller that reached the service without one (a job or a script); `writeAuditLog`
 * accepts a null actor for exactly that case.
 */
function actingScope(authority: AdminAnnouncementAuthority): ResolvedScope | null {
  return authority.systemWide ?? authority.warehouse;
}

/** The audit image: the fields an admin can actually change, never the whole row. */
function auditImage(row: AdminAnnouncementRow): Record<string, unknown> {
  return {
    target: row.scope,
    warehouseId: row.warehouse_id,
    type: row.type,
    title: row.title,
    body: row.body,
    locale: row.locale,
    startsAt: iso(row.starts_at),
    endsAt: row.ends_at === null ? null : iso(row.ends_at),
    retiredAt: row.deleted_at === null ? null : iso(row.deleted_at),
  };
}

export function createAdminAnnouncementsService(
  deps: Partial<AdminAnnouncementsServiceDeps> = {},
): AdminAnnouncementsService {
  const repo = deps.repo ?? adminAnnouncementsRepo;
  const db = deps.db ?? pool;
  const transaction: TransactionRunner = deps.transaction ?? ((fn) => withTransaction(fn));
  const now = deps.now ?? ((): Date => new Date());

  // 404, never 403, for a row the caller may not manage: a 403 confirms the row exists to someone
  // who is not allowed to know. The detail is identical for "unknown" and "not yours".
  function notFound(id: string): AppError {
    return new AppError('NOT_FOUND', {
      detail: `No announcement with id ${id} is visible to you.`,
    });
  }

  return {
    async list(authority, query): Promise<AdminAnnouncementListResponse> {
      const at = now();
      const { items, nextCursor, hasMore } = await repo.list(db, authority, query);
      return { items: items.map((row) => toApi(row, at)), page: { nextCursor, hasMore } };
    },

    async create(authority, body): Promise<AdminAnnouncement> {
      const permission = CREATE_PERMISSION_BY_TARGET[body.target];
      const createScope: ResolvedScope | null =
        body.target === 'SYSTEM_WIDE' ? authority.systemWide : authority.warehouse;

      // BR-213: the code for THIS target, from the caller's resolved grants (never a role-name
      // check). A refusal is recorded (BR-35b) in its own transaction, then nothing else happens.
      if (createScope === null) {
        const acting = actingScope(authority);
        await transaction(async (tx) => {
          await writeAuditLog(tx, {
            actorId: acting?.userId ?? null,
            ...(acting === null ? {} : { actorRole: acting.roleCode }),
            actionCode: permission,
            entityType: 'announcement',
            entityId: null,
            outcome: 'DENIED',
            after: { requestedTarget: body.target },
          });
        });
        throw new AppError('FORBIDDEN', {
          detail: `Your roles do not grant "${permission}".`,
          meta: { permission },
        });
      }

      const at = now();
      const startsAt = body.startsAt ?? null;
      const endsAt = body.endsAt ?? null;

      // `announcements_window_chk` compares against the stored starts_at, which is now() when the
      // caller named none. Refuse it here so the caller gets a 422, not the database's 500.
      if (endsAt !== null && Date.parse(endsAt) <= Date.parse(startsAt ?? iso(at))) {
        throw new AppError('VALIDATION_FAILED', {
          detail: 'endsAt must be after startsAt.',
          errors: { 'body.endsAt': ['endsAt must be after startsAt.'] },
        });
      }

      let warehouseId: string | null = null;
      if (body.target === 'WAREHOUSE') {
        // `body.warehouseId` is present: the schema refuses WAREHOUSE without it.
        const requested = body.warehouseId as string;

        // A `own` grant (SUB_WH_ADMIN) may publish only to its own warehouse. This is a WRITE, so
        // 403 is right — unlike a read, refusing it leaks nothing the caller did not already name.
        if (!warehouseVisible(createScope, requested)) {
          throw new AppError('WAREHOUSE_SCOPE_VIOLATION', {
            detail: 'You may only publish announcements for a warehouse you are assigned to.',
            meta: { warehouseId: requested },
          });
        }
        warehouseId = await repo.findWarehouseId(db, requested);
        if (warehouseId === null) {
          throw new AppError('VALIDATION_FAILED', {
            detail: 'warehouseId does not name a live warehouse.',
            errors: { 'body.warehouseId': ['Unknown warehouse.'] },
          });
        }
      }

      return transaction(async (tx) => {
        const row = await repo.insert(tx, {
          target: body.target,
          warehouseId,
          type: body.type,
          title: body.title,
          body: body.body,
          locale: body.locale,
          startsAt,
          endsAt,
          createdBy: createScope.userId,
        });

        await writeAuditLog(tx, {
          actorId: createScope.userId,
          actorRole: createScope.roleCode,
          actionCode: permission,
          entityType: 'announcement',
          entityId: row.id,
          ...(row.warehouse_id === null ? {} : { warehouseId: row.warehouse_id }),
          after: auditImage(row),
        });

        return toApi(row, at);
      });
    },

    async update(authority, id, body): Promise<AdminAnnouncement> {
      const at = now();
      const acting = actingScope(authority);

      return transaction(async (tx) => {
        const before = await repo.lockVisibleById(tx, authority, id);
        if (before === null) throw notFound(id);

        // A retired announcement is terminal; edit it and the reader-facing history would change
        // under a row that is no longer published.
        if (before.deleted_at !== null) {
          throw new AppError('INVALID_STATE_TRANSITION', {
            detail: 'A retired announcement cannot be edited. Publish a new one.',
            meta: { announcementId: id, status: 'RETIRED' },
          });
        }

        const nextStartsAt = body.startsAt ?? iso(before.starts_at);
        const nextEndsAt =
          body.endsAt === undefined
            ? before.ends_at === null
              ? null
              : iso(before.ends_at)
            : body.endsAt;
        if (nextEndsAt !== null && Date.parse(nextEndsAt) <= Date.parse(nextStartsAt)) {
          throw new AppError('VALIDATION_FAILED', {
            detail: 'endsAt must be after startsAt.',
            errors: { 'body.endsAt': ['endsAt must be after startsAt.'] },
          });
        }

        const patch: UpdateAnnouncementPatch = {
          ...(body.type === undefined ? {} : { type: body.type }),
          ...(body.title === undefined ? {} : { title: body.title }),
          ...(body.body === undefined ? {} : { body: body.body }),
          ...(body.locale === undefined ? {} : { locale: body.locale }),
          ...(body.startsAt === undefined ? {} : { startsAt: body.startsAt }),
          ...(body.endsAt === undefined ? {} : { endsAt: body.endsAt }),
        };

        const after = await repo.update(tx, id, patch);
        const beforeImage = auditImage(before);
        const afterImage = auditImage(after);

        await writeAuditLog(tx, {
          actorId: acting?.userId ?? null,
          ...(acting === null ? {} : { actorRole: acting.roleCode }),
          actionCode: 'announcement.update',
          entityType: 'announcement',
          entityId: id,
          ...(after.warehouse_id === null ? {} : { warehouseId: after.warehouse_id }),
          before: beforeImage,
          after: afterImage,
          changedFields: changedFields(beforeImage, afterImage),
        });

        return toApi(after, at);
      });
    },

    async retire(authority, id, body): Promise<AdminAnnouncement> {
      const at = now();
      const acting = actingScope(authority);

      return transaction(async (tx) => {
        const before = await repo.lockVisibleById(tx, authority, id);
        if (before === null) throw notFound(id);

        // Idempotent (same shape as the admin-account disable): a replay returns the row as it
        // stands, writes nothing and does not move `retiredAt`.
        if (before.deleted_at !== null) return toApi(before, at);

        const after = await repo.retire(tx, id);
        const beforeImage = auditImage(before);
        const afterImage = auditImage(after);

        await writeAuditLog(tx, {
          actorId: acting?.userId ?? null,
          ...(acting === null ? {} : { actorRole: acting.roleCode }),
          actionCode: 'announcement.retire',
          entityType: 'announcement',
          entityId: id,
          ...(after.warehouse_id === null ? {} : { warehouseId: after.warehouse_id }),
          before: beforeImage,
          after: { ...afterImage, ...(body.reason === undefined ? {} : { reason: body.reason }) },
          changedFields: changedFields(beforeImage, afterImage),
        });

        return toApi(after, at);
      });
    },
  };
}

export interface AdminAnnouncementsService {
  list(
    authority: AdminAnnouncementAuthority,
    query: ListAdminAnnouncementsQuery,
  ): Promise<AdminAnnouncementListResponse>;
  create(
    authority: AdminAnnouncementAuthority,
    body: CreateAdminAnnouncementBody,
  ): Promise<AdminAnnouncement>;
  update(
    authority: AdminAnnouncementAuthority,
    id: string,
    body: UpdateAdminAnnouncementBody,
  ): Promise<AdminAnnouncement>;
  retire(
    authority: AdminAnnouncementAuthority,
    id: string,
    body: RetireAdminAnnouncementBody,
  ): Promise<AdminAnnouncement>;
}

/** The production instance. */
export const adminAnnouncementsService: AdminAnnouncementsService = createAdminAnnouncementsService();
