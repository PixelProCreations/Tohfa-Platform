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
import { authRepo } from '../auth/auth.repo.js';
import { subAdminsRepo } from '../warehouse-ops/sub-admins.repo.js';

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
    const roles = await db.query<AdminRoleRow>(
      `SELECT DISTINCT r.code, r.hierarchy_level::int AS level
         FROM user_roles ur
         JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = $1 AND ${LIVE_ROLE}
        ORDER BY level, r.code
        FOR UPDATE OF ur`,
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
    const result = await db.query<{ admin_code: string }>(
      `INSERT INTO admin_profiles (user_id, admin_code, created_by)
       VALUES ($1, 'ADM-' || lpad(nextval('admin_account_code_seq')::text, 3, '0'), $2)
       RETURNING admin_code`,
      [userId, createdBy],
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
};
