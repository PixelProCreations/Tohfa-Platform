/**
 * BR-81: SQL for Sub Warehouse Admin staffing. Every function takes an `Executor` so the service can
 * run create as ONE transaction (account + admin profile + assignment + audit row).
 *
 * "Live" means the same thing the login path means (auth.repo `getUserRoles`): the assignment has no
 * end, or ends in the future. A soft-deleted user never counts; for the CAP a DISABLED user does not
 * count either (a disabled admin must not block a replacement), while the list still shows it.
 */
import type { Executor } from '../../db/pool.js';
import type { WarehouseScopeFilter } from '../../rbac/warehouseScope.js';
import type { SubAdmin } from './sub-admins.schema.js';

/** BR-25 / Assumption 1: "5 admins including standby". Used only when system_config has no usable row. */
export const FALLBACK_MAX_SUB_ADMINS_PER_WAREHOUSE = 5;

const LIVE = `(ur.valid_to IS NULL OR ur.valid_to > now())`;

interface ListRow {
  user_id: string;
  admin_code: string | null;
  full_name: string;
  status: SubAdmin['status'];
  warehouse_id: string;
  assigned_at: Date;
}

export interface SubAdminsRepo {
  /** Row-locks an existing, non-deleted warehouse so concurrent creates serialise on its cap check. */
  lockWarehouse(db: Executor, warehouseId: string): Promise<{ isActive: boolean } | null>;
  /** `system_config.sub_wh_admin_max_per_warehouse`, or the BR-25 figure when missing or unusable. */
  maxPerWarehouse(db: Executor): Promise<number>;
  countLive(db: Executor, warehouseId: string): Promise<number>;
  /** Throws the raw pg unique violation (23505, `uq_users_mobile_live`) when the mobile is taken. */
  insertUser(db: Executor, input: { fullName: string; mobile: string }): Promise<string>;
  insertProfile(db: Executor, input: { userId: string; createdBy: string }): Promise<string>;
  insertAssignment(db: Executor, input: { userId: string; warehouseId: string; assignedBy: string }): Promise<Date>;
  list(
    db: Executor,
    args: { scope: WarehouseScopeFilter; warehouseId: string | null; page: number; pageSize: number },
  ): Promise<{ items: SubAdmin[]; total: number }>;
}

function toSubAdmin(row: ListRow): SubAdmin {
  return {
    userId: row.user_id,
    adminCode: row.admin_code,
    fullName: row.full_name,
    status: row.status,
    warehouseId: row.warehouse_id,
    assignedAt: row.assigned_at.toISOString(),
  };
}

export const subAdminsRepo: SubAdminsRepo = {
  async lockWarehouse(db, warehouseId) {
    const result = await db.query<{ is_active: boolean }>(
      `SELECT is_active FROM warehouses WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`,
      [warehouseId],
    );
    const row = result.rows[0];
    return row === undefined ? null : { isActive: row.is_active };
  },

  async maxPerWarehouse(db) {
    const result = await db.query<{ value: unknown }>(
      `SELECT value FROM system_config WHERE key = 'sub_wh_admin_max_per_warehouse' LIMIT 1`,
    );
    const value = result.rows[0]?.value;
    const parsed =
      typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
    return Number.isInteger(parsed) && parsed > 0 ? parsed : FALLBACK_MAX_SUB_ADMINS_PER_WAREHOUSE;
  },

  async countLive(db, warehouseId) {
    const result = await db.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n
         FROM user_roles ur JOIN users u ON u.id = ur.user_id
        WHERE ur.role_code = 'SUB_WH_ADMIN' AND ur.warehouse_id = $1 AND ${LIVE}
          AND u.deleted_at IS NULL AND u.status <> 'DISABLED'`,
      [warehouseId],
    );
    return result.rows[0]!.n;
  },

  async insertUser(db, { fullName, mobile }) {
    // ACTIVE with NO password hash, like an approved farmer: the account signs in only after the
    // existing forgot-password / reset-password flow sets a password.
    const result = await db.query<{ id: string }>(
      `INSERT INTO users (mobile, full_name, user_type, status) VALUES ($1, $2, 'ADMIN', 'ACTIVE') RETURNING id`,
      [mobile, fullName],
    );
    return result.rows[0]!.id;
  },

  async insertProfile(db, { userId, createdBy }) {
    const result = await db.query<{ admin_code: string }>(
      `INSERT INTO admin_profiles (user_id, admin_code, created_by)
       VALUES ($1, 'SWA-' || lpad(nextval('sub_wh_admin_code_seq')::text, 3, '0'), $2)
       RETURNING admin_code`,
      [userId, createdBy],
    );
    return result.rows[0]!.admin_code;
  },

  async insertAssignment(db, { userId, warehouseId, assignedBy }) {
    // role_code is re-filled and BR-25 re-validated by trg_user_roles_scope_guard.
    const result = await db.query<{ valid_from: Date }>(
      `INSERT INTO user_roles (user_id, role_id, role_code, warehouse_id, assigned_by)
       SELECT $1, r.id, r.code, $2, $3 FROM roles r WHERE r.code = 'SUB_WH_ADMIN'
       RETURNING valid_from`,
      [userId, warehouseId, assignedBy],
    );
    const row = result.rows[0];
    if (row === undefined) throw new Error('role SUB_WH_ADMIN is missing: run the reference seed');
    return row.valid_from;
  },

  async list(db, { scope, warehouseId, page, pageSize }) {
    const params: unknown[] = [...scope.params];
    let where = `ur.role_code = 'SUB_WH_ADMIN' AND ${LIVE} AND u.deleted_at IS NULL AND ${scope.sql}`;
    if (warehouseId !== null) {
      params.push(warehouseId);
      where += ` AND ur.warehouse_id = $${params.length}`;
    }
    const from = `user_roles ur
                  JOIN users u ON u.id = ur.user_id
                  LEFT JOIN admin_profiles ap ON ap.user_id = u.id`;

    const count = await db.query<{ total: string }>(`SELECT COUNT(*)::text AS total FROM ${from} WHERE ${where}`, params);
    const rows = await db.query<ListRow>(
      `SELECT u.id AS user_id, ap.admin_code, u.full_name, u.status, ur.warehouse_id, ur.valid_from AS assigned_at
         FROM ${from} WHERE ${where}
        ORDER BY ap.admin_code NULLS LAST, u.id
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, pageSize, (page - 1) * pageSize],
    );
    return { items: rows.rows.map(toSubAdmin), total: Number(count.rows[0]?.total ?? '0') };
  },
};
