/**
 * Admin promotion requests: approve (BR-114); create, list, read and reject (BR-117).
 *
 * APPROVE, ORDER OF CHECKS (each refusal writes nothing):
 *   1. The request is locked and loaded. Missing -> 404.
 *   2. Not PENDING -> 409 INVALID_STATE_TRANSITION (a decided request is never decided again).
 *   3. The actor is the target -> 403 (nobody approves their own promotion; also a table CHECK).
 *   4. An actor whose grant is not `all` may not promote into a role above its own (403). Only
 *      SUPER_ADMIN holds `admin.promotion.approve`, at `all`, so this is a defence in depth.
 *   5. The target is locked; it must be a live admin still holding a live `from_role` assignment,
 *      otherwise the request is stale -> 409 CONFLICT.
 *
 * The role change, the request's decision, the session and refresh-token revocation and the audit
 * row share one transaction (BR-35). The access-token invalidation stamp lives in Redis, outside that
 * transaction, so it is written only after the commit (as admin-accounts disable does, BR-110e).
 *
 * CREATE (BR-117), ORDER OF CHECKS (each refusal writes nothing):
 *   1. The caller is the target -> 403 (before any SQL).
 *   2. The target is locked; it must be a live admin with at least one live admin role, else 404.
 *      `fromRole` is its highest-authority live role, derived here and never taken from the client;
 *      two live roles tied at that level are ambiguous -> 409 CONFLICT.
 *   3. `toRole` must be strictly higher than `fromRole` (the table's upward CHECK) -> 422 on body.toRole.
 *   4. LOWER_ROLES_ONLY sanity check against the requester's own role, whatever its grant level (TOHFA
 *      holds `all` too): the target must sit strictly below the requester and `toRole` may not be above
 *      it -> 403. UNCONFIRMED default (BR-117).
 *   5. One PENDING request per target -> 409 CONFLICT. The target row lock serialises concurrent creates;
 *      the partial unique index is the backstop and its violation is also mapped to 409.
 * The insert and its audit row share one transaction. Nothing about the target's roles or sessions
 * changes until approval.
 *
 * Levels come from docs/rbac.json (loadRbac), the same numbers migration 0074's CHECKs mirror.
 *
 * READS: `admin.promotion.view` has no `own` dimension, so a scope that is not `all` reads an empty page
 * and 404 by id without touching SQL: never a 403 that would confirm a row exists (CLAUDE.md 2.1).
 */
import { ScopeLevel, type RoleCode } from '@tohfa/shared-types';
import { changedFields, writeAuditLog } from '../../audit/auditLog.js';
import { markTokensInvalidBefore } from '../../auth/tokenInvalidation.js';
import type { Executor } from '../../db/pool.js';
import { pool, withTransaction } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { loadRbac } from '../../rbac/loadRbac.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { adminPromotionsRepo, type AdminPromotionsRepo, type PromotionRow } from './admin-promotions.repo.js';
import {
  PROMOTION_FROM_ROLES,
  type ApprovePromotionBody,
  type CreatePromotionBody,
  type ListPromotionsQuery,
  type ListPromotionsResponse,
  type PromotionRequest,
  type RejectPromotionBody,
} from './admin-promotions.schema.js';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export interface AdminPromotionsServiceDeps {
  repo: AdminPromotionsRepo;
  /** Executor for the reads (list, get). */
  db: Executor;
  transaction: TransactionRunner;
  /** Reject access tokens issued before now for this user. Called only after commit. */
  invalidateAccessTokens: (userId: string) => Promise<void>;
}

export interface AdminPromotionsService {
  approve(scope: ResolvedScope, id: string, body: ApprovePromotionBody): Promise<PromotionRequest>;
  create(scope: ResolvedScope, body: CreatePromotionBody): Promise<PromotionRequest>;
  list(scope: ResolvedScope, query: ListPromotionsQuery): Promise<ListPromotionsResponse>;
  get(scope: ResolvedScope, id: string): Promise<PromotionRequest>;
  reject(scope: ResolvedScope, id: string, body: RejectPromotionBody): Promise<PromotionRequest>;
}

const ADMIN_ROLES: ReadonlySet<string> = new Set(PROMOTION_FROM_ROLES);

function notFound(id: string): AppError {
  return new AppError('NOT_FOUND', { detail: `No promotion request with id "${id}".` });
}

/** Postgres unique violation of the one-PENDING-per-target index (migration 0074). */
function isOnePendingViolation(error: unknown): boolean {
  const e = error as { code?: unknown; constraint?: unknown } | null;
  return e !== null && typeof e === 'object' && e.code === '23505' && e.constraint === 'uq_promotion_requests_one_pending';
}

function pendingConflict(): AppError {
  return new AppError('CONFLICT', { detail: 'This account already has a pending promotion request.' });
}

function toResponse(row: PromotionRow): PromotionRequest {
  return {
    id: row.id,
    targetUserId: row.targetUserId,
    fromRole: row.fromRole,
    toRole: row.toRole,
    requestedBy: row.requestedBy,
    reason: row.reason,
    status: row.status,
    decidedBy: row.decidedBy,
    decidedAt: row.decidedAt === null ? null : row.decidedAt.toISOString(),
    decisionNote: row.decisionNote,
    createdAt: row.createdAt.toISOString(),
  };
}

/** The request-state image for the audit row. */
function image(row: PromotionRow): Record<string, unknown> {
  const { createdAt: _createdAt, ...rest } = toResponse(row);
  return rest;
}

export function createAdminPromotionsService(deps: Partial<AdminPromotionsServiceDeps> = {}): AdminPromotionsService {
  const repo = deps.repo ?? adminPromotionsRepo;
  const db = deps.db ?? pool;
  const transaction: TransactionRunner = deps.transaction ?? ((fn) => withTransaction(fn));
  const invalidateAccessTokens = deps.invalidateAccessTokens ?? ((userId: string) => markTokensInvalidBefore(userId));

  return {
    async approve(scope, id, body) {
      const approved = await transaction(async (tx) => {
        const request = await repo.findForUpdate(tx, id);
        if (request === null) throw new AppError('NOT_FOUND', { detail: `No promotion request with id "${id}".` });

        if (request.status !== 'PENDING') {
          throw new AppError('INVALID_STATE_TRANSITION', {
            detail: `This promotion request is already ${request.status}.`,
            meta: { from: request.status, to: 'APPROVED' },
          });
        }

        if (request.targetUserId === scope.userId) {
          throw new AppError('FORBIDDEN', { detail: 'You cannot approve a promotion of your own account.' });
        }

        const levels = loadRbac().rolesByCode;
        const actorLevel = levels.get(scope.roleCode)?.level;
        const toLevel = levels.get(request.toRole)?.level;
        if (scope.level !== ScopeLevel.ALL && (actorLevel === undefined || toLevel === undefined || toLevel < actorLevel)) {
          throw new AppError('FORBIDDEN', { detail: 'You may not promote an account into a role above your own.' });
        }

        const targetRoles = await repo.lockTargetRoles(tx, request.targetUserId);
        if (targetRoles === null || !targetRoles.includes(request.fromRole)) {
          throw new AppError('CONFLICT', {
            detail: `The target account no longer holds ${request.fromRole}; this request is stale.`,
          });
        }

        await repo.endRoleAssignments(tx, request.targetUserId, request.fromRole);
        if (!targetRoles.includes(request.toRole)) {
          await repo.addRoleAssignment(tx, { userId: request.targetUserId, roleCode: request.toRole, assignedBy: scope.userId });
        }
        const updated = await repo.markApproved(tx, id, scope.userId, body.note ?? null);
        await repo.revokeSessions(tx, request.targetUserId, scope.userId);
        await repo.revokeRefreshTokens(tx, request.targetUserId);

        const before = image(request);
        const after = image(updated);
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'admin.promotion.approve',
          entityType: 'promotion_request',
          entityId: id,
          before,
          after,
          changedFields: changedFields(before, after),
        });
        return updated;
      });

      await invalidateAccessTokens(approved.targetUserId);
      return toResponse(approved);
    },

    async create(scope, body) {
      if (body.targetUserId === scope.userId) {
        throw new AppError('FORBIDDEN', { detail: 'You cannot request a promotion of your own account.' });
      }

      const created = await transaction(async (tx) => {
        const levels = loadRbac().rolesByCode;
        // Role codes read from user_roles are plain strings; only admin roles known to rbac.json count.
        const levelOf = (code: string): number | undefined => levels.get(code as RoleCode)?.level;
        const targetRoles = (await repo.lockTargetRoles(tx, body.targetUserId)) ?? [];
        const adminRoles = targetRoles.filter((code) => ADMIN_ROLES.has(code) && levelOf(code) !== undefined);
        if (adminRoles.length === 0) {
          throw new AppError('NOT_FOUND', { detail: `No admin account with id "${body.targetUserId}".` });
        }

        const fromLevel = Math.min(...adminRoles.map((code) => levelOf(code)!));
        const highest = adminRoles.filter((code) => levelOf(code) === fromLevel);
        if (highest.length !== 1) {
          throw new AppError('CONFLICT', {
            detail: `The target account holds ${highest.join(' and ')} at the same level; the role to promote from is ambiguous.`,
          });
        }
        const fromRole = highest[0] as PromotionRow['fromRole'];

        const toLevel = levels.get(body.toRole)?.level;
        if (toLevel === undefined || toLevel >= fromLevel) {
          throw new AppError('VALIDATION_FAILED', {
            detail: 'One or more fields are invalid.',
            errors: { 'body.toRole': [`${body.toRole} is not higher than the account's current role ${fromRole}.`] },
          });
        }

        const actorLevel = levels.get(scope.roleCode)?.level;
        if (actorLevel === undefined || fromLevel <= actorLevel || toLevel < actorLevel) {
          throw new AppError('FORBIDDEN', {
            detail: 'You may only request a promotion for an account below your own role, into a role no higher than your own.',
          });
        }

        if (await repo.hasPendingForTarget(tx, body.targetUserId)) throw pendingConflict();

        let row: PromotionRow;
        try {
          row = await repo.insertRequest(tx, {
            targetUserId: body.targetUserId,
            fromRole,
            toRole: body.toRole,
            requestedBy: scope.userId,
            reason: body.reason,
          });
        } catch (error) {
          if (isOnePendingViolation(error)) throw pendingConflict();
          throw error;
        }

        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'admin.promotion.request',
          entityType: 'promotion_request',
          entityId: row.id,
          after: image(row),
        });
        return row;
      });
      return toResponse(created);
    },

    async list(scope, query) {
      if (scope.level !== ScopeLevel.ALL) return { items: [], page: { nextCursor: null, hasMore: false } };
      const result = await repo.list(db, query);
      return { items: result.items.map(toResponse), page: { nextCursor: result.nextCursor, hasMore: result.hasMore } };
    },

    async get(scope, id) {
      if (scope.level !== ScopeLevel.ALL) throw notFound(id);
      const row = await repo.findById(db, id);
      if (row === null) throw notFound(id);
      return toResponse(row);
    },

    async reject(scope, id, body) {
      const rejected = await transaction(async (tx) => {
        const request = await repo.findForUpdate(tx, id);
        if (request === null) throw notFound(id);

        if (request.status !== 'PENDING') {
          throw new AppError('INVALID_STATE_TRANSITION', {
            detail: `This promotion request is already ${request.status}.`,
            meta: { from: request.status, to: 'REJECTED' },
          });
        }

        if (request.targetUserId === scope.userId) {
          throw new AppError('FORBIDDEN', { detail: 'You cannot decide a promotion of your own account.' });
        }

        // Defence in depth, as approve: only SUPER_ADMIN holds the code, at `all`.
        const levels = loadRbac().rolesByCode;
        const actorLevel = levels.get(scope.roleCode)?.level;
        const toLevel = levels.get(request.toRole)?.level;
        if (scope.level !== ScopeLevel.ALL && (actorLevel === undefined || toLevel === undefined || toLevel < actorLevel)) {
          throw new AppError('FORBIDDEN', { detail: 'You may not decide a promotion into a role above your own.' });
        }

        const updated = await repo.markRejected(tx, id, scope.userId, body.note ?? null);
        const before = image(request);
        const after = image(updated);
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'admin.promotion.reject',
          entityType: 'promotion_request',
          entityId: id,
          before,
          after,
          changedFields: changedFields(before, after),
        });
        return updated;
      });
      return toResponse(rejected);
    },
  };
}

export const adminPromotionsService: AdminPromotionsService = createAdminPromotionsService();
