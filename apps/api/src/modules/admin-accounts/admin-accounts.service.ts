/**
 * Admin accounts: disable (BR-110) and create (BR-28, BR-112).
 *
 * CREATE. The route admits any caller holding one of the `admin.*.create` codes and resolves the
 * code for the REQUESTED role; this service refuses (403, one DENIED audit row, BR-28b) when the
 * caller lacks it. SUB_WH_ADMIN is refused 422 (BR-112a: POST /admin/sub-warehouse-admins owns it).
 * A FARMER_ADMIN names exactly one live, active zone. The account is created exactly as BR-81a does
 * (ACTIVE, no password; the forgot-password flow sets one): no credential is generated or returned.
 *
 * ZONES (BR-113). The zone set of a Farmer Admin is replaced as a whole under a lock on the user and
 * its live assignments; an identical set is a no-op; access tokens are invalidated after commit.
 *
 * DISABLE.
 * ORDER OF CHECKS (each refusal writes nothing):
 *   1. Self-disable is refused before any SQL (BR-110a), whatever the grant: an admin locking
 *      themselves out is never a legitimate admin action.
 *   2. The target is locked and loaded. Not an admin account -> 404.
 *   3. `LOWER_ROLES_ONLY` (docs/rbac.json) via `assertPredicate`, with the actor's level taken from
 *      the role that WON the scope resolution and the target's level as its highest-authority live
 *      role. Only `conditional` scopes are checked; SUPER_ADMIN holds `all` (BR-110b).
 *   4. Already DISABLED -> return it unchanged, no audit row (BR-110d). Checked after the predicate
 *      so a 200 never confirms anything to an actor who could not have disabled the account.
 *   5. Last ACTIVE SUPER_ADMIN -> 409 (BR-110c).
 *
 * The disable, the session and refresh-token revocation and the audit row share one transaction
 * (BR-35). The access-token invalidation stamp lives in Redis, which is not part of that
 * transaction, so it is written only after the commit (as auth.service.ts does for a password
 * change).
 */
import { RoleCode } from '@tohfa/shared-types';
import { changedFields, writeAuditLog } from '../../audit/auditLog.js';
import { markTokensInvalidBefore } from '../../auth/tokenInvalidation.js';
import type { Executor } from '../../db/pool.js';
import { withTransaction } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { loadRbac } from '../../rbac/loadRbac.js';
import { assertPredicate, type ResolvedScope } from '../../rbac/requirePermission.js';
import { adminAccountsRepo, type AdminAccountRow, type AdminAccountsRepo } from './admin-accounts.repo.js';
import {
  CREATE_PERMISSION_BY_ROLE,
  type AdminAccountCreated,
  type AdminAccountStatus,
  type CreateAdminAccountBody,
  type DisableAdminAccountBody,
  type FarmerAdminZones,
  type SetFarmerAdminZonesBody,
} from './admin-accounts.schema.js';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export interface AdminAccountsServiceDeps {
  repo: AdminAccountsRepo;
  transaction: TransactionRunner;
  /** Reject access tokens issued before now for this user. Called only after commit. */
  invalidateAccessTokens: (userId: string) => Promise<void>;
}

export interface AdminAccountsService {
  disable(scope: ResolvedScope, userId: string, body: DisableAdminAccountBody): Promise<AdminAccountStatus>;
  /**
   * BR-28 / BR-112. `gateScope` is what the route's any-of gate attached (who is acting); `createScope`
   * is the caller's resolved grant on the requested role's create code, or null when it holds none.
   */
  create(gateScope: ResolvedScope, createScope: ResolvedScope | null, body: CreateAdminAccountBody): Promise<AdminAccountCreated>;
  /** BR-113: replace the zone set of a live Farmer Admin (SUPER_ADMIN / TOHFA_ADMIN only, by permission). */
  setZones(scope: ResolvedScope, userId: string, body: SetFarmerAdminZonesBody): Promise<FarmerAdminZones>;
}

function isMobileTaken(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === '23505' &&
    (error as { constraint?: unknown }).constraint === 'uq_users_mobile_live'
  );
}

const invalidField = (field: string, message: string): AppError =>
  new AppError('VALIDATION_FAILED', { detail: 'One or more fields are invalid.', errors: { [field]: [message] } });

function notFound(userId: string): AppError {
  return new AppError('NOT_FOUND', { detail: `No admin account with id "${userId}".` });
}

function toStatus(row: AdminAccountRow, roles: string[]): AdminAccountStatus {
  return {
    id: row.id,
    fullName: row.fullName,
    status: row.status,
    roles,
    disabledAt: row.disabledAt === null ? null : row.disabledAt.toISOString(),
    disabledBy: row.disabledBy,
    disabledReason: row.disabledReason,
  };
}

/** The account-state image for the audit row: never the mobile, email or password hash. */
function image(row: AdminAccountRow, roles: string[]): Record<string, unknown> {
  return {
    status: row.status,
    disabledAt: row.disabledAt === null ? null : row.disabledAt.toISOString(),
    disabledBy: row.disabledBy,
    disabledReason: row.disabledReason,
    roles,
  };
}

export function createAdminAccountsService(deps: Partial<AdminAccountsServiceDeps> = {}): AdminAccountsService {
  const repo = deps.repo ?? adminAccountsRepo;
  const transaction: TransactionRunner = deps.transaction ?? ((fn) => withTransaction(fn));
  const invalidateAccessTokens = deps.invalidateAccessTokens ?? ((userId: string) => markTokensInvalidBefore(userId));

  return {
    async disable(scope, userId, body) {
      if (userId === scope.userId) {
        throw new AppError('FORBIDDEN', { detail: 'You cannot disable your own account.' });
      }

      const outcome = await transaction(async (tx) => {
        const target = await repo.findAdminForUpdate(tx, userId);
        if (target === null) throw notFound(userId);
        const roleCodes = target.roles.map((role) => role.code);

        const actorRoleLevel = loadRbac().rolesByCode.get(scope.roleCode)?.level;
        const targetRoleLevel = Math.min(...target.roles.map((role) => role.level));
        assertPredicate(scope, { actorRoleLevel, targetRoleLevel });

        // BR-110d: a replay records nothing and keeps the original disable.
        if (target.account.status === 'DISABLED') {
          return { changed: false, status: toStatus(target.account, roleCodes) };
        }

        if (roleCodes.includes(RoleCode.SUPER_ADMIN) && (await repo.countOtherActiveSuperAdmins(tx, userId)) === 0) {
          throw new AppError('CONFLICT', { detail: 'This is the last active Super Admin account; it cannot be disabled.' });
        }

        const updated = await repo.markDisabled(tx, userId, scope.userId, body.reason ?? null);
        await repo.revokeSessions(tx, userId, scope.userId);
        await repo.revokeRefreshTokens(tx, userId);

        const before = image(target.account, roleCodes);
        const after = image(updated, roleCodes);
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'admin.account.disable',
          entityType: 'user',
          entityId: userId,
          before,
          after,
          changedFields: changedFields(before, after),
        });
        return { changed: true, status: toStatus(updated, roleCodes) };
      });

      if (outcome.changed) await invalidateAccessTokens(userId);
      return outcome.status;
    },

    async create(gateScope, createScope, body) {
      const permission = CREATE_PERMISSION_BY_ROLE[body.role];

      // BR-28: the code for THIS role, from the caller's resolved grants (never a role-name check).
      // A refusal is recorded (BR-28b, BR-35b) in its own transaction, then nothing else happens.
      if (createScope === null) {
        await transaction(async (tx) => {
          await writeAuditLog(tx, {
            actorId: gateScope.userId,
            actorRole: gateScope.roleCode,
            actionCode: permission,
            entityType: 'user',
            entityId: null,
            outcome: 'DENIED',
            after: { requestedRole: body.role },
          });
        });
        throw new AppError('FORBIDDEN', {
          detail: `Your roles do not grant "${permission}".`,
          meta: { permission },
        });
      }

      // Every create grant in docs/rbac.json is `all`, so this is a no-op today; it bites only if a
      // create grant ever becomes `conditional` with LOWER_ROLES_ONLY.
      const levels = loadRbac().rolesByCode;
      assertPredicate(createScope, {
        actorRoleLevel: levels.get(createScope.roleCode)?.level,
        targetRoleLevel: levels.get(body.role)?.level,
      });

      // BR-112a: one path per role. Sub Warehouse Admins carry a warehouse binding and a cap (BR-81).
      if (body.role === RoleCode.SUB_WH_ADMIN) {
        throw invalidField(
          'body.role',
          'Sub Warehouse Admins are created with POST /admin/sub-warehouse-admins.',
        );
      }

      // BR-112b (owner decision 2026-10-23): a Farmer Admin is bound to exactly one zone at creation.
      const zoneId = body.zoneId ?? null;
      const role = body.role;
      if (role === RoleCode.FARMER_ADMIN && zoneId === null) {
        throw invalidField('body.zoneId', 'Required: a Farmer Admin is bound to exactly one zone.');
      }
      if (role !== RoleCode.FARMER_ADMIN && zoneId !== null) {
        throw invalidField('body.zoneId', 'Only a Farmer Admin is bound to a zone.');
      }

      return transaction(async (tx) => {
        if (zoneId !== null) {
          const zone = await repo.findZone(tx, zoneId);
          if (zone === null) throw invalidField('body.zoneId', 'No such zone.');
          if (!zone.isActive) throw invalidField('body.zoneId', 'This zone is not active.');
        }

        let userId: string;
        try {
          userId = await repo.insertAdminUser(tx, { fullName: body.fullName, mobile: body.mobile });
        } catch (error) {
          if (isMobileTaken(error)) {
            throw new AppError('CONFLICT', {
              detail: 'That mobile number is already registered.',
              errors: { 'body.mobile': ['Already registered.'] },
            });
          }
          throw error;
        }
        const adminCode = await repo.insertAdminProfile(tx, { userId, createdBy: createScope.userId });
        const assignedAt = await repo.insertRoleAssignment(tx, { userId, roleCode: role, zoneId, assignedBy: createScope.userId });
        const zoneIds = zoneId === null ? [] : [zoneId];

        // Masked image: role, zones and admin code only, never the name or the mobile (as BR-81e).
        await writeAuditLog(tx, {
          actorId: createScope.userId,
          actorRole: createScope.roleCode,
          actionCode: permission,
          entityType: 'user',
          entityId: userId,
          after: { role, zoneIds, adminCode },
        });

        return { userId, adminCode, fullName: body.fullName, role, status: 'ACTIVE' as const, zoneIds, assignedAt: assignedAt.toISOString() };
      });
    },

    async setZones(scope, userId, body) {
      const wanted = [...body.zoneIds].sort();

      const outcome = await transaction(async (tx) => {
        const target = await repo.findFarmerAdminForUpdate(tx, userId);
        if (target === null) throw new AppError('NOT_FOUND', { detail: `No Farmer Admin account with id "${userId}".` });

        const zones = await repo.findZones(tx, wanted);
        const found = new Map(zones.map((zone) => [zone.id, zone]));
        const missing = wanted.filter((id) => !found.has(id));
        if (missing.length > 0) throw invalidField('body.zoneIds', `No such zone: ${missing.join(', ')}.`);
        const inactive = wanted.filter((id) => found.get(id)?.isActive !== true);
        if (inactive.length > 0) throw invalidField('body.zoneIds', `Zone not active: ${inactive.join(', ')}.`);

        const current = target.zoneIds;
        const currentZones = current.filter((id): id is string => id !== null).sort();
        const unchanged = !current.includes(null) && currentZones.length === wanted.length && currentZones.every((id, i) => id === wanted[i]);
        // BR-113d: a replay records nothing.
        if (unchanged) return { changed: false };

        await repo.endZoneAssignments(tx, userId, wanted);
        for (const zoneId of wanted.filter((id) => !currentZones.includes(id))) {
          await repo.insertRoleAssignment(tx, { userId, roleCode: RoleCode.FARMER_ADMIN, zoneId, assignedBy: scope.userId });
        }

        const before = { zoneIds: currentZones };
        const after = { zoneIds: wanted };
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'admin.farmer_admin.assign_zones',
          entityType: 'user',
          entityId: userId,
          before,
          after,
          changedFields: changedFields(before, after),
        });
        return { changed: true };
      });

      // The token carries the zones; after commit, force the next refresh to re-read them.
      if (outcome.changed) await invalidateAccessTokens(userId);
      return { userId, zoneIds: wanted };
    },
  };
}

export const adminAccountsService: AdminAccountsService = createAdminAccountsService();
