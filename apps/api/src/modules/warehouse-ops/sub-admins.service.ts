/**
 * BR-81: Sub Warehouse Admin staffing (list and create).
 *
 * Who may create is decided by the permission (`admin.sub_wh_admin.create`: Super, Tohfa and Main admin;
 * docs/rbac.json `creationRules` for SUB_WH_ADMIN lists the same three, BR-28) and is tested against both.
 * This service decides the rest:
 *  - BR-25: the assignment names exactly one warehouse; a missing one is `WAREHOUSE_REQUIRED` (422);
 *  - the warehouse must exist and be active (422) and be inside the creator's scope (404, BR-30);
 *  - a warehouse holds at most `system_config.sub_wh_admin_max_per_warehouse` live admins (409). The
 *    warehouse row is locked first, so two concurrent creates cannot both squeeze under the cap;
 *  - the account, the admin profile, the assignment and ONE masked audit row are one transaction.
 *    The audit image names the role, warehouse and admin code only: never the name or the mobile.
 *  - a taken mobile is 409 and the message never echoes it: an admin is never attached to an
 *    existing account.
 */
import type { Executor } from '../../db/pool.js';
import { pool, withTransaction } from '../../db/pool.js';
import { writeAuditLog } from '../../audit/auditLog.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { warehouseScopeFilter, warehouseVisible } from '../../rbac/warehouseScope.js';
import { confineToAssignedWarehouses, warehouseExists, warehouseNotFound } from './scope.js';
import { subAdminsRepo, type SubAdminsRepo } from './sub-admins.repo.js';
import type {
  CreateSubAdminBody,
  CreatedSubAdmin,
  ListSubAdminsQuery,
  ListSubAdminsResponse,
} from './sub-admins.schema.js';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export interface SubAdminsServiceDeps {
  repo: SubAdminsRepo;
  db: Executor;
  runTx: TransactionRunner;
}

export interface SubAdminsService {
  create(scope: ResolvedScope, body: CreateSubAdminBody): Promise<CreatedSubAdmin>;
  list(scope: ResolvedScope, query: ListSubAdminsQuery): Promise<ListSubAdminsResponse>;
}

function isMobileTaken(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === '23505' &&
    (error as { constraint?: unknown }).constraint === 'uq_users_mobile_live'
  );
}

const invalidWarehouse = (detail: string): AppError =>
  new AppError('VALIDATION_FAILED', { detail: 'One or more fields are invalid.', errors: { 'body.warehouseId': [detail] } });

export function createSubAdminsService(deps: Partial<SubAdminsServiceDeps> = {}): SubAdminsService {
  const repo = deps.repo ?? subAdminsRepo;
  const db = deps.db ?? pool;
  const runTx: TransactionRunner = deps.runTx ?? ((fn) => withTransaction(fn));

  return {
    async create(scope, body) {
      const warehouseId = body.warehouseId ?? null;
      if (warehouseId === null) {
        // BR-25a: a SUB_WH_ADMIN assignment without a warehouse is invalid, and says so by code.
        throw new AppError('WAREHOUSE_REQUIRED', {
          detail: 'A Sub Warehouse Admin must be assigned to exactly one warehouse.',
          errors: { 'body.warehouseId': ['Required.'] },
        });
      }

      return runTx(async (tx) => {
        if (!warehouseVisible(confineToAssignedWarehouses(scope), warehouseId)) throw warehouseNotFound(warehouseId);

        const warehouse = await repo.lockWarehouse(tx, warehouseId);
        if (warehouse === null) throw invalidWarehouse('No such warehouse.');
        if (!warehouse.isActive) throw invalidWarehouse('This warehouse is not active.');

        const max = await repo.maxPerWarehouse(tx);
        if ((await repo.countLive(tx, warehouseId)) >= max) {
          throw new AppError('CONFLICT', {
            detail: `This warehouse already has the maximum of ${max} Sub Warehouse Admins.`,
          });
        }

        let userId: string;
        try {
          userId = await repo.insertUser(tx, { fullName: body.fullName, mobile: body.mobile });
        } catch (error) {
          if (isMobileTaken(error)) {
            throw new AppError('CONFLICT', {
              detail: 'That mobile number is already registered.',
              errors: { 'body.mobile': ['Already registered.'] },
            });
          }
          throw error;
        }
        const adminCode = await repo.insertProfile(tx, { userId, createdBy: scope.userId });
        const assignedAt = await repo.insertAssignment(tx, { userId, warehouseId, assignedBy: scope.userId });

        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'admin.sub_wh_admin.create',
          entityType: 'user',
          entityId: userId,
          warehouseId,
          after: { role: 'SUB_WH_ADMIN', warehouseId, adminCode },
        });

        return {
          userId,
          adminCode,
          fullName: body.fullName,
          status: 'ACTIVE',
          warehouseId,
          assignedAt: assignedAt.toISOString(),
        };
      });
    },

    async list(scope, query) {
      const confined = confineToAssignedWarehouses(scope);
      if (query.warehouseId !== undefined) {
        if (!warehouseVisible(confined, query.warehouseId) || !(await warehouseExists(db, query.warehouseId))) {
          throw warehouseNotFound(query.warehouseId);
        }
      }
      const { items, total } = await repo.list(db, {
        scope: warehouseScopeFilter(confined, 'ur.warehouse_id', 1),
        warehouseId: query.warehouseId ?? null,
        page: query.page,
        pageSize: query.pageSize,
      });
      return { items, page: query.page, pageSize: query.pageSize, total };
    },
  };
}

export const subAdminsService: SubAdminsService = createSubAdminsService();
