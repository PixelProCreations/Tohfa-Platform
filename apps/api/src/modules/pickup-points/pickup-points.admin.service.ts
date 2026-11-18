/**
 * Admin management of public pickup points (BR-185). Scope via scopedWhere (out-of-scope is 404),
 * one transaction for the change + audit row (before/after hold only the pickup-point fields).
 */
import { changedFields, writeAuditLog } from '../../audit/auditLog.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { scopedWhere, type ResolvedScope } from '../../rbac/requirePermission.js';
import {
  adminPickupPointsRepo,
  type AdminPickupPointRow,
  type AdminPickupPointsRepo,
  type PickupPointPatch,
} from './pickup-points.admin.repo.js';
import type { AdminPickupPoint, UpdatePickupPointBody } from './pickup-points.admin.schema.js';

export const PICKUP_POINT_MANAGE = 'pickup_point.manage';

export function toAdminPickupPoint(r: AdminPickupPointRow): AdminPickupPoint {
  return {
    id: r.id,
    name: r.name,
    address: r.address,
    publicPhone: r.public_phone,
    isPublic: r.is_public,
    isActive: r.is_active,
    openingHours: r.operating_hours ?? null,
  };
}

/** Audit image: the editable fields only. */
function image(p: AdminPickupPoint): Record<string, unknown> {
  return { publicPhone: p.publicPhone, isPublic: p.isPublic, openingHours: p.openingHours };
}

export interface AdminPickupPointsService {
  list(scope: ResolvedScope): Promise<{ items: AdminPickupPoint[] }>;
  update(scope: ResolvedScope, id: string, body: UpdatePickupPointBody): Promise<AdminPickupPoint>;
}

export function createAdminPickupPointsService(
  deps: {
    repo?: AdminPickupPointsRepo;
    db?: Executor;
    transaction?: <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;
  } = {},
): AdminPickupPointsService {
  const repo = deps.repo ?? adminPickupPointsRepo;
  const db = deps.db ?? pool;
  const transaction = deps.transaction ?? (<T>(fn: (tx: Executor) => Promise<T>) => withTransaction(fn));

  return {
    async list(scope) {
      const f = scopedWhere(scope, { warehouseColumn: 'id', startIndex: 1 });
      return { items: (await repo.list(db, f)).map(toAdminPickupPoint) };
    },

    async update(scope, id, body) {
      const f = scopedWhere(scope, { warehouseColumn: 'id', startIndex: 2 });
      return transaction(async (tx) => {
        const current = await repo.lockOne(tx, id, f);
        // 404 for unknown and for out-of-scope alike (never confirm existence).
        if (current === null) {
          throw new AppError('NOT_FOUND', { detail: `No pickup point with id ${id} is visible to you.` });
        }
        const before = toAdminPickupPoint(current);

        const nextPhone = body.publicPhone !== undefined ? body.publicPhone : before.publicPhone;
        const nextPublic = body.isPublic ?? before.isPublic;
        // BR-185: a customer-visible pickup point must have a customer-facing phone.
        if (nextPublic && (nextPhone === null || nextPhone === '')) {
          throw new AppError('VALIDATION_FAILED', {
            detail: 'A public pickup point needs a publicPhone.',
            errors: { publicPhone: ['required while isPublic is true'] },
          });
        }

        const patch: PickupPointPatch = {};
        if (body.publicPhone !== undefined) patch.public_phone = body.publicPhone;
        if (body.isPublic !== undefined) patch.is_public = body.isPublic;
        if (body.openingHours !== undefined) patch.operating_hours = body.openingHours;

        const after = toAdminPickupPoint(await repo.update(tx, id, patch));
        const b = image(before);
        const a = image(after);
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: PICKUP_POINT_MANAGE,
          entityType: 'warehouse',
          entityId: id,
          warehouseId: id,
          before: b,
          after: a,
          changedFields: changedFields(b, a),
        });
        return after;
      });
    },
  };
}

export const adminPickupPointsService: AdminPickupPointsService = createAdminPickupPointsService();
