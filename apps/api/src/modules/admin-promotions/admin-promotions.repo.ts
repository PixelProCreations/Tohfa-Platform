/**
 * Admin promotion requests (BR-114 approve, BR-117 create/list/read/reject). SQL only; every function
 * takes an `Executor` so the service runs each write as ONE transaction.
 *
 * Reuse, so there is one definition of each operation: the role assignment insert is the admin-accounts
 * one (BR-112), session revocation is the auth module's `revokeAllUserSessions` and refresh-token
 * revocation is the admin-accounts disable one (BR-110e).
 */
import type { Executor } from '../../db/pool.js';
import { CURSOR_TAGS, encodeKeysetCursor, requireKeysetCursor } from '../../http/keysetCursor.js';
import { MICRO_TS_SQL } from '../../http/microTimestamp.js';
import { adminAccountsRepo } from '../admin-accounts/admin-accounts.repo.js';
import { authRepo } from '../auth/auth.repo.js';
import type { PROMOTION_FROM_ROLES, PROMOTION_STATUSES, PROMOTION_TO_ROLES } from './admin-promotions.schema.js';

export interface PromotionRow {
  id: string;
  targetUserId: string;
  fromRole: (typeof PROMOTION_FROM_ROLES)[number];
  toRole: (typeof PROMOTION_TO_ROLES)[number];
  requestedBy: string;
  reason: string | null;
  status: (typeof PROMOTION_STATUSES)[number];
  decidedBy: string | null;
  decidedAt: Date | null;
  decisionNote: string | null;
  createdAt: Date;
}

export interface ListPromotionsInput {
  status?: (typeof PROMOTION_STATUSES)[number] | undefined;
  targetUserId?: string | undefined;
  limit: number;
  /** Opaque cursor already validated by the route schema. */
  cursor?: string | undefined;
}

export interface ListPromotionsResult {
  items: PromotionRow[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface NewPromotionRequest {
  targetUserId: string;
  fromRole: PromotionRow['fromRole'];
  toRole: PromotionRow['toRole'];
  requestedBy: string;
  reason: string;
}

export interface AdminPromotionsRepo {
  /** Lock and load one request. Null when it does not exist. */
  findForUpdate(db: Executor, id: string): Promise<PromotionRow | null>;
  /** Load one request without a lock. Null when it does not exist. */
  findById(db: Executor, id: string): Promise<PromotionRow | null>;
  /** Newest first, keyset-paged on (created_at, id). */
  list(db: Executor, input: ListPromotionsInput): Promise<ListPromotionsResult>;
  /** True when the target already has a PENDING request (uq_promotion_requests_one_pending). */
  hasPendingForTarget(db: Executor, targetUserId: string): Promise<boolean>;
  insertRequest(db: Executor, input: NewPromotionRequest): Promise<PromotionRow>;
  /**
   * Lock a live ADMIN user and return the codes of its live role assignments (possibly empty).
   * Null when the user is missing, deleted or not an admin.
   */
  lockTargetRoles(db: Executor, userId: string): Promise<string[] | null>;
  /** End every live assignment of `roleCode` held by the user. */
  endRoleAssignments(db: Executor, userId: string, roleCode: string): Promise<number>;
  /** One live assignment of `roleCode`, with no warehouse and no zone. */
  addRoleAssignment(db: Executor, input: { userId: string; roleCode: string; assignedBy: string }): Promise<void>;
  markApproved(db: Executor, id: string, decidedBy: string, note: string | null): Promise<PromotionRow>;
  markRejected(db: Executor, id: string, decidedBy: string, note: string | null): Promise<PromotionRow>;
  revokeSessions(db: Executor, userId: string, revokedBy: string): Promise<void>;
  revokeRefreshTokens(db: Executor, userId: string): Promise<number>;
}

const COLUMNS = `
  id, target_user_id AS "targetUserId", from_role AS "fromRole", to_role AS "toRole",
  requested_by AS "requestedBy", reason, status, decided_by AS "decidedBy", decided_at AS "decidedAt",
  decision_note AS "decisionNote", created_at AS "createdAt"`;

/** A live assignment: started, not ended (the same definition as admin-accounts and the login path). */
const LIVE_ROLE = `ur.valid_from <= now() AND (ur.valid_to IS NULL OR ur.valid_to > now())`;

export const adminPromotionsRepo: AdminPromotionsRepo = {
  async findForUpdate(db, id) {
    const result = await db.query<PromotionRow>(`SELECT ${COLUMNS} FROM promotion_requests WHERE id = $1 FOR UPDATE`, [id]);
    return result.rows[0] ?? null;
  },

  async findById(db, id) {
    const result = await db.query<PromotionRow>(`SELECT ${COLUMNS} FROM promotion_requests WHERE id = $1`, [id]);
    return result.rows[0] ?? null;
  },

  async list(db, { status, targetUserId, limit, cursor }) {
    const conditions: string[] = ['TRUE'];
    const params: unknown[] = [];
    if (status !== undefined) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }
    if (targetUserId !== undefined) {
      params.push(targetUserId);
      conditions.push(`target_user_id = $${params.length}::uuid`);
    }
    if (cursor !== undefined && cursor.length > 0) {
      // Keyset on (created_at, id), matching the ORDER BY, so tied timestamps are neither skipped
      // nor repeated (same scheme as the audit log list).
      const after = requireKeysetCursor(CURSOR_TAGS.promotionRequests, cursor);
      params.push(after.ts, after.id);
      conditions.push(`(created_at, id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`);
    }
    params.push(limit + 1);
    const result = await db.query<PromotionRow & { cursorTs: string }>(
      `SELECT ${COLUMNS}, ${MICRO_TS_SQL('created_at')} AS "cursorTs"
         FROM promotion_requests
        WHERE ${conditions.join(' AND ')}
        ORDER BY created_at DESC, id DESC
        LIMIT $${params.length}`,
      params,
    );
    const hasMore = result.rows.length > limit;
    const rows = hasMore ? result.rows.slice(0, limit) : result.rows;
    const last = rows[rows.length - 1];
    const nextCursor =
      hasMore && last !== undefined ? encodeKeysetCursor(CURSOR_TAGS.promotionRequests, { ts: last.cursorTs, id: last.id }) : null;
    return { items: rows.map(({ cursorTs: _cursorTs, ...row }) => row), nextCursor, hasMore };
  },

  async hasPendingForTarget(db, targetUserId) {
    const result = await db.query(`SELECT 1 FROM promotion_requests WHERE target_user_id = $1 AND status = 'PENDING' LIMIT 1`, [targetUserId]);
    return result.rows.length > 0;
  },

  async insertRequest(db, { targetUserId, fromRole, toRole, requestedBy, reason }) {
    const result = await db.query<PromotionRow>(
      `INSERT INTO promotion_requests (target_user_id, from_role, to_role, requested_by, reason)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${COLUMNS}`,
      [targetUserId, fromRole, toRole, requestedBy, reason],
    );
    return result.rows[0]!;
  },

  async lockTargetRoles(db, userId) {
    const user = await db.query(
      `SELECT 1 FROM users u WHERE u.id = $1 AND u.deleted_at IS NULL AND u.user_type = 'ADMIN' FOR UPDATE`,
      [userId],
    );
    if (user.rows.length === 0) return null;
    const roles = await db.query<{ role_code: string }>(
      `SELECT DISTINCT ur.role_code FROM user_roles ur WHERE ur.user_id = $1 AND ${LIVE_ROLE} ORDER BY ur.role_code`,
      [userId],
    );
    return roles.rows.map((row) => row.role_code);
  },

  async endRoleAssignments(db, userId, roleCode) {
    // valid_to = now() ends it for this transaction too; the microsecond floor keeps
    // user_roles_validity_chk (valid_to > valid_from) for a row created in the same transaction.
    const result = await db.query(
      `UPDATE user_roles ur
          SET valid_to = GREATEST(now(), ur.valid_from + interval '1 microsecond')
        WHERE ur.user_id = $1 AND ur.role_code = $2 AND ${LIVE_ROLE}`,
      [userId, roleCode],
    );
    return result.rowCount ?? 0;
  },

  async addRoleAssignment(db, { userId, roleCode, assignedBy }) {
    await adminAccountsRepo.insertRoleAssignment(db, { userId, roleCode, zoneId: null, assignedBy });
  },

  async markApproved(db, id, decidedBy, note) {
    const result = await db.query<PromotionRow>(
      `UPDATE promotion_requests
          SET status = 'APPROVED', decided_by = $2, decided_at = now(), decision_note = $3, updated_at = now()
        WHERE id = $1
        RETURNING ${COLUMNS}`,
      [id, decidedBy, note],
    );
    return result.rows[0]!;
  },

  async markRejected(db, id, decidedBy, note) {
    const result = await db.query<PromotionRow>(
      `UPDATE promotion_requests
          SET status = 'REJECTED', decided_by = $2, decided_at = now(), decision_note = $3, updated_at = now()
        WHERE id = $1
        RETURNING ${COLUMNS}`,
      [id, decidedBy, note],
    );
    return result.rows[0]!;
  },

  async revokeSessions(db, userId, revokedBy) {
    await authRepo.revokeAllUserSessions(db, userId, revokedBy, 'ROLE_CHANGED');
  },

  async revokeRefreshTokens(db, userId) {
    return adminAccountsRepo.revokeRefreshTokens(db, userId);
  },
};
