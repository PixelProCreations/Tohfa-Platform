/**
 * Admin accounts: disable (BR-110), create (BR-28, BR-112) and Farmer Admin zones (BR-113). SQL only.
 *
 * Create reuses the Sub Warehouse Admin repo's `insertUser` on purpose: the owner decided (2026-10-23)
 * that a new admin account gets exactly the BR-81 credential mechanism (ACTIVE, NO password; the
 * existing forgot-password flow sets one), so there is one definition of "create an admin login".
 *
 * Session revocation reuses the auth module's `revokeAllUserSessions` so there is one definition of
 * "revoke a user's sessions"; refresh tokens are revoked here because the auth repo only revokes
 * them per session family.
 */
import type { Executor } from '../../db/pool.js';
import { CURSOR_TAGS, encodeKeysetCursor, requireKeysetCursor } from '../../http/keysetCursor.js';
import { MICRO_TS_SQL } from '../../http/microTimestamp.js';
import { authRepo } from '../auth/auth.repo.js';
import { subAdminsRepo } from '../warehouse-ops/sub-admins.repo.js';
import type {
  AdminAccountDetail,
  AdminAccountListItem,
  AdminAccountZone,
  ListAdminAccountsQuery,
  ListAdminAccountsResponse,
} from './admin-accounts.schema.js';

export interface AdminAccountRow {
  id: string;
  fullName: string;
  status: 'PENDING' | 'ACTIVE' | 'DISABLED';
  disabledAt: Date | null;
  disabledBy: string | null;
  disabledReason: string | null;
}

export interface AdminRoleRow {
  code: string;
  /** roles.hierarchy_level: 1 is the highest authority. */
  level: number;
}

export interface AdminAccount {
  account: AdminAccountRow;
  /** Live assignments only; never empty for an admin account. */
  roles: AdminRoleRow[];
}

export interface AdminAccountsRepo {
  /**
   * Lock and load an admin account: a live ADMIN user with at least one live role assignment.
   * Null for anything else (missing, deleted, not an admin, no live role).
   */
  findAdminForUpdate(db: Executor, userId: string): Promise<AdminAccount | null>;
  /** ACTIVE, live users holding a live SUPER_ADMIN assignment other than `userId`, locked. */
  countOtherActiveSuperAdmins(db: Executor, userId: string): Promise<number>;
  markDisabled(db: Executor, userId: string, disabledBy: string, reason: string | null): Promise<AdminAccountRow>;
  revokeSessions(db: Executor, userId: string, revokedBy: string): Promise<void>;
  /** Revoke every unrevoked refresh token of the user. Returns how many were revoked. */
  revokeRefreshTokens(db: Executor, userId: string): Promise<number>;

  /** A live (not deleted) zone, share-locked so it cannot be deleted under the create. Null if none. */
  findZone(db: Executor, zoneId: string): Promise<{ isActive: boolean } | null>;
  /** ACTIVE ADMIN user with NO password. Throws the raw pg 23505 (`uq_users_mobile_live`) on a taken mobile. */
  insertAdminUser(db: Executor, input: { fullName: string; mobile: string }): Promise<string>;
  /** Admin profile with a generated `ADM-nnn` code and the accountable creator (BR-28). */
  insertAdminProfile(db: Executor, input: { userId: string; createdBy: string }): Promise<string>;
  /** One live role assignment; `zoneId` only for FARMER_ADMIN (the table CHECK refuses it otherwise). */
  insertRoleAssignment(
    db: Executor,
    input: { userId: string; roleCode: string; zoneId: string | null; assignedBy: string },
  ): Promise<Date>;

  /**
   * Lock a live ADMIN user and return the zones of its live FARMER_ADMIN assignments (a null entry
   * is an assignment with no zone). Null when the user is not a live Farmer Admin.
   */
  findFarmerAdminForUpdate(db: Executor, userId: string): Promise<{ zoneIds: Array<string | null> } | null>;
  /** The live (not deleted) zones among `zoneIds`, share-locked. */
  findZones(db: Executor, zoneIds: string[]): Promise<Array<{ id: string; isActive: boolean }>>;
  /** End every live FARMER_ADMIN assignment of the user whose zone is not in `keepZoneIds`. */
  endZoneAssignments(db: Executor, userId: string, keepZoneIds: string[]): Promise<number>;

  /** List admin accounts with keyset pagination and filtering. */
  listAdminAccounts(db: Executor, query: ListAdminAccountsQuery): Promise<ListAdminAccountsResponse>;
  /** Fetch a single live ADMIN user's safe detail without credentials or mobile. */
  getAdminAccountById(db: Executor, userId: string): Promise<AdminAccountDetail | null>;
}

const ACCOUNT_COLUMNS = `
  u.id, u.full_name AS "fullName", u.status, u.disabled_at AS "disabledAt",
  u.disabled_by AS "disabledBy", u.disabled_reason AS "disabledReason"`;

/** A live assignment: started, not ended. */
const LIVE_ROLE = `ur.valid_from <= now() AND (ur.valid_to IS NULL OR ur.valid_to > now())`;

export const adminAccountsRepo: AdminAccountsRepo = {
  async findAdminForUpdate(db, userId) {
    const account = await db.query<AdminAccountRow>(
      `SELECT ${ACCOUNT_COLUMNS}
         FROM users u
        WHERE u.id = $1 AND u.deleted_at IS NULL AND u.user_type = 'ADMIN'
        FOR UPDATE`,
      [userId],
    );
    const row = account.rows[0];
    if (row === undefined) return null;
    // Lock user_roles alongside the users row so the hierarchy level cannot be
    // changed between this read and the assertPredicate call (TOCTOU fix).
    // The lock sits in a sub-select and DISTINCT outside it: PostgreSQL rejects a locking clause
    // combined with DISTINCT at the same query level (0A000), but allows it inside a sub-SELECT.
    const roles = await db.query<AdminRoleRow>(
      `SELECT DISTINCT s.code, s.level
         FROM (SELECT r.code, r.hierarchy_level::int AS level
                 FROM user_roles ur
                 JOIN roles r ON r.id = ur.role_id
                WHERE ur.user_id = $1 AND ${LIVE_ROLE}
                  FOR UPDATE OF ur) s
        ORDER BY s.level, s.code`,
      [userId],
    );
    if (roles.rows.length === 0) return null;
    return { account: row, roles: roles.rows };
  },

  async countOtherActiveSuperAdmins(db, userId) {
    // FOR UPDATE on the other Super Admins' user rows: two Super Admins disabling each other at the
    // same moment serialise here (or one is aborted as a deadlock), so both cannot pass the check.
    const result = await db.query<{ id: string }>(
      `SELECT u.id
         FROM users u
        WHERE u.id <> $1
          AND u.deleted_at IS NULL
          AND u.status = 'ACTIVE'
          AND EXISTS (
                SELECT 1 FROM user_roles ur
                 WHERE ur.user_id = u.id AND ur.role_code = 'SUPER_ADMIN' AND ${LIVE_ROLE})
        ORDER BY u.id
        FOR UPDATE`,
      [userId],
    );
    return result.rows.length;
  },

  async markDisabled(db, userId, disabledBy, reason) {
    const result = await db.query<AdminAccountRow>(
      `UPDATE users u
          SET status = 'DISABLED', disabled_at = now(), disabled_by = $2, disabled_reason = $3, updated_at = now()
        WHERE u.id = $1
        RETURNING ${ACCOUNT_COLUMNS}`,
      [userId, disabledBy, reason],
    );
    return result.rows[0]!;
  },

  async revokeSessions(db, userId, revokedBy) {
    await authRepo.revokeAllUserSessions(db, userId, revokedBy, 'ACCOUNT_DISABLED');
  },

  async findZone(db, zoneId) {
    const result = await db.query<{ is_active: boolean }>(
      `SELECT is_active FROM zones WHERE id = $1 AND deleted_at IS NULL FOR SHARE`,
      [zoneId],
    );
    const row = result.rows[0];
    return row === undefined ? null : { isActive: row.is_active };
  },

  async insertAdminUser(db, input) {
    return subAdminsRepo.insertUser(db, input);
  },

  async insertAdminProfile(db, { userId, createdBy }) {
    await db.query(`SELECT pg_advisory_xact_lock(hashtextextended('admin_profiles.admin_code', 0))`);
    const maxRes = await db.query<{ max_seq: string }>(
      `SELECT COALESCE(MAX(substring(admin_code FROM '^ADM-([0-9]+)$')::bigint), 0)::text AS max_seq FROM admin_profiles`,
    );
    const seqRes = await db.query<{ val: string }>(`SELECT nextval('admin_account_code_seq')::text AS val`);
    const nextNum = Math.max(Number(maxRes.rows[0]?.max_seq ?? 0) + 1, Number(seqRes.rows[0]?.val ?? 1));
    const adminCode = `ADM-${String(nextNum).padStart(3, '0')}`;

    const result = await db.query<{ admin_code: string }>(
      `INSERT INTO admin_profiles (user_id, admin_code, created_by)
       VALUES ($1, $2, $3)
       RETURNING admin_code`,
      [userId, adminCode, createdBy],
    );
    return result.rows[0]!.admin_code;
  },

  async insertRoleAssignment(db, { userId, roleCode, zoneId, assignedBy }) {
    // role_code is re-filled from roles by trg_user_roles_scope_guard.
    const result = await db.query<{ valid_from: Date }>(
      `INSERT INTO user_roles (user_id, role_id, role_code, zone_id, assigned_by)
       SELECT $1, r.id, r.code, $3, $4 FROM roles r WHERE r.code = $2
       RETURNING valid_from`,
      [userId, roleCode, zoneId, assignedBy],
    );
    const row = result.rows[0];
    if (row === undefined) throw new Error(`role ${roleCode} is missing: run the reference seed`);
    return row.valid_from;
  },

  async findFarmerAdminForUpdate(db, userId) {
    const user = await db.query(
      `SELECT 1 FROM users u WHERE u.id = $1 AND u.deleted_at IS NULL AND u.user_type = 'ADMIN' FOR UPDATE`,
      [userId],
    );
    if (user.rows.length === 0) return null;
    const roles = await db.query<{ zone_id: string | null }>(
      `SELECT ur.zone_id
         FROM user_roles ur
        WHERE ur.user_id = $1 AND ur.role_code = 'FARMER_ADMIN' AND ${LIVE_ROLE}
        ORDER BY ur.zone_id NULLS FIRST
        FOR UPDATE`,
      [userId],
    );
    if (roles.rows.length === 0) return null;
    return { zoneIds: roles.rows.map((row) => row.zone_id) };
  },

  async findZones(db, zoneIds) {
    const result = await db.query<{ id: string; is_active: boolean }>(
      `SELECT id, is_active FROM zones WHERE id = ANY($1::uuid[]) AND deleted_at IS NULL ORDER BY id FOR SHARE`,
      [zoneIds],
    );
    return result.rows.map((row) => ({ id: row.id, isActive: row.is_active }));
  },

  async endZoneAssignments(db, userId, keepZoneIds) {
    // valid_to = now() ends the assignment for this transaction too (LIVE_ROLE needs valid_to > now()).
    // An assignment created earlier in the SAME transaction has valid_from = now(), and
    // user_roles_validity_chk needs valid_to > valid_from, hence the microsecond floor.
    const result = await db.query(
      `UPDATE user_roles ur
          SET valid_to = GREATEST(now(), ur.valid_from + interval '1 microsecond')
        WHERE ur.user_id = $1 AND ur.role_code = 'FARMER_ADMIN' AND ${LIVE_ROLE}
          AND (ur.zone_id IS NULL OR NOT (ur.zone_id = ANY($2::uuid[])))`,
      [userId, keepZoneIds],
    );
    return result.rowCount ?? 0;
  },

  async revokeRefreshTokens(db, userId) {
    const result = await db.query(
      `UPDATE refresh_tokens SET revoked_at = now(), updated_at = now() WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId],
    );
    return result.rowCount ?? 0;
  },

  async listAdminAccounts(db, query) {
    const conditions: string[] = ["u.user_type = 'ADMIN'", 'u.deleted_at IS NULL'];
    const params: unknown[] = [];

    if (query.status !== undefined) {
      params.push(query.status);
      conditions.push(`u.status = $${params.length}`);
    }

    if (query.role !== undefined) {
      params.push(query.role);
      conditions.push(
        `EXISTS (
          SELECT 1 FROM user_roles ur
          JOIN roles r ON r.id = ur.role_id
          WHERE ur.user_id = u.id
            AND ${LIVE_ROLE}
            AND r.code = $${params.length}
        )`,
      );
    }

    if (query.q !== undefined && query.q.length > 0) {
      params.push(`%${query.q}%`);
      conditions.push(`(u.full_name ILIKE $${params.length} OR (u.email IS NOT NULL AND u.email ILIKE $${params.length}))`);
    }

    const filterWhereClause = `WHERE ${conditions.join(' AND ')}`;
    const filterParams = [...params];

    if (query.cursor !== undefined && query.cursor.length > 0) {
      const after = requireKeysetCursor(CURSOR_TAGS.adminAccounts, query.cursor);
      params.push(after.ts, after.id);
      conditions.push(`(u.created_at, u.id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const limit = query.limit ?? 20;
    params.push(limit + 1);

    const result = await db.query<{
      id: string;
      fullName: string;
      email: string | null;
      status: 'PENDING' | 'ACTIVE' | 'DISABLED';
      roleCode: string;
      roles: string[] | null;
      zones: AdminAccountZone[];
      cursor_ts: string;
    }>(
      `SELECT
         u.id,
         u.full_name AS "fullName",
         u.email,
         u.status,
         COALESCE(
           (SELECT r.code
              FROM user_roles ur
              JOIN roles r ON r.id = ur.role_id
             WHERE ur.user_id = u.id
               AND ${LIVE_ROLE}
             ORDER BY r.hierarchy_level ASC, r.code ASC
             LIMIT 1),
           (SELECT r.code
              FROM user_roles ur
              JOIN roles r ON r.id = ur.role_id
             WHERE ur.user_id = u.id
             ORDER BY ur.valid_from DESC
             LIMIT 1),
           'ADMIN'
         ) AS "roleCode",
         COALESCE(
           (SELECT array_agg(s.code ORDER BY s.hierarchy_level ASC, s.code ASC)
              FROM (
                SELECT DISTINCT r.code, r.hierarchy_level
                  FROM user_roles ur
                  JOIN roles r ON r.id = ur.role_id
                 WHERE ur.user_id = u.id
                   AND ${LIVE_ROLE}
              ) s),
           ARRAY[]::text[]
         ) AS roles,
         COALESCE(
           (SELECT json_agg(json_build_object('id', z.id, 'code', z.code, 'name', z.name) ORDER BY z.name)
              FROM (
                SELECT DISTINCT z.id, z.code, z.name
                  FROM user_roles ur
                  JOIN zones z ON z.id = ur.zone_id
                 WHERE ur.user_id = u.id
                   AND ${LIVE_ROLE}
                   AND z.deleted_at IS NULL
              ) z),
           '[]'::json
         ) AS zones,
         ${MICRO_TS_SQL('u.created_at')} AS cursor_ts
        FROM users u
       ${whereClause}
       ORDER BY u.created_at DESC, u.id DESC
       LIMIT $${params.length}`,
      params,
    );

    const summaryRes = await db.query<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM users u ${filterWhereClause}`,
      filterParams,
    );

    const hasMore = result.rows.length > limit;
    const rows = hasMore ? result.rows.slice(0, limit) : result.rows;
    const last = rows[rows.length - 1];
    const nextCursor =
      hasMore && last !== undefined ? encodeKeysetCursor(CURSOR_TAGS.adminAccounts, { ts: last.cursor_ts, id: last.id }) : null;

    const items: AdminAccountListItem[] = rows.map((r) => ({
      id: r.id,
      fullName: r.fullName,
      email: r.email,
      roleCode: r.roleCode,
      roles: Array.isArray(r.roles) ? r.roles : [],
      status: r.status,
      zones: Array.isArray(r.zones) ? r.zones : [],
    }));

    return {
      items,
      summary: { total: summaryRes.rows[0]?.total ?? 0 },
      page: { nextCursor, hasMore },
      nextCursor,
      hasMore,
    };
  },

  async getAdminAccountById(db, userId) {
    const res = await db.query<{
      id: string;
      fullName: string;
      email: string | null;
      adminCode: string | null;
      status: 'PENDING' | 'ACTIVE' | 'DISABLED';
      roleCode: string;
      roles: string[] | null;
      zones: AdminAccountZone[];
      createdAt: Date;
      disabledAt: Date | null;
      disabledBy: string | null;
      disabledReason: string | null;
    }>(
      `SELECT
         u.id,
         u.full_name AS "fullName",
         u.email,
         ap.admin_code AS "adminCode",
         u.status,
         COALESCE(
           (SELECT r.code
              FROM user_roles ur
              JOIN roles r ON r.id = ur.role_id
             WHERE ur.user_id = u.id
               AND ${LIVE_ROLE}
             ORDER BY r.hierarchy_level ASC, r.code ASC
             LIMIT 1),
           (SELECT r.code
              FROM user_roles ur
              JOIN roles r ON r.id = ur.role_id
             WHERE ur.user_id = u.id
             ORDER BY ur.valid_from DESC
             LIMIT 1),
           'ADMIN'
         ) AS "roleCode",
         COALESCE(
           (SELECT array_agg(s.code ORDER BY s.hierarchy_level ASC, s.code ASC)
              FROM (
                SELECT DISTINCT r.code, r.hierarchy_level
                  FROM user_roles ur
                  JOIN roles r ON r.id = ur.role_id
                 WHERE ur.user_id = u.id
                   AND ${LIVE_ROLE}
              ) s),
           ARRAY[]::text[]
         ) AS roles,
         COALESCE(
           (SELECT json_agg(json_build_object('id', z.id, 'code', z.code, 'name', z.name) ORDER BY z.name)
              FROM (
                SELECT DISTINCT z.id, z.code, z.name
                  FROM user_roles ur
                  JOIN zones z ON z.id = ur.zone_id
                 WHERE ur.user_id = u.id
                   AND ${LIVE_ROLE}
                   AND z.deleted_at IS NULL
              ) z),
           '[]'::json
         ) AS zones,
         u.created_at AS "createdAt",
         u.disabled_at AS "disabledAt",
         u.disabled_by AS "disabledBy",
         u.disabled_reason AS "disabledReason"
        FROM users u
        LEFT JOIN admin_profiles ap ON ap.user_id = u.id AND ap.deleted_at IS NULL
       WHERE u.id = $1 AND u.deleted_at IS NULL AND u.user_type = 'ADMIN'`,
      [userId],
    );
    const row = res.rows[0];
    if (row === undefined) return null;
    return {
      id: row.id,
      fullName: row.fullName,
      email: row.email,
      adminCode: row.adminCode,
      roleCode: row.roleCode,
      roles: Array.isArray(row.roles) ? row.roles : [],
      status: row.status,
      zones: Array.isArray(row.zones) ? row.zones : [],
      createdAt: row.createdAt.toISOString(),
      disabledAt: row.disabledAt === null ? null : row.disabledAt.toISOString(),
      disabledBy: row.disabledBy,
      disabledReason: row.disabledReason,
    };
  },
};
