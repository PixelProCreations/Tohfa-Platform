/**
 * Role definitions (BR-109). SQL only.
 *
 * Reads the `roles`, `permissions` and `role_permissions` tables that db/seed/002_permissions.js
 * syncs from docs/rbac.json, so the response is the same data the seed's drift check guards. A
 * grant of `none` is an explicit row in role_permissions; it is filtered out here.
 */
import type { Executor } from '../../db/pool.js';
import type { RolePermissionGrant } from './roles.schema.js';

export interface RoleRow {
  code: string;
  name: string;
  level: number;
  scopeDimension: 'warehouse_id' | 'zone_id' | 'farmer_id' | 'customer_id' | null;
  summary: string | null;
}

export interface GrantRow extends RolePermissionGrant {
  roleCode: string;
}

export interface RolesRepo {
  /** Every role (or the one with `code`), ordered by hierarchy level then code. */
  listRoles(db: Executor, code?: string): Promise<RoleRow[]>;
  /** Granted (non-`none`) permissions of every role (or of `code`), ordered by permission code. */
  listGrants(db: Executor, code?: string): Promise<GrantRow[]>;
}

export const rolesRepo: RolesRepo = {
  async listRoles(db, code) {
    const result = await db.query<RoleRow>(
      `SELECT r.code, r.name, r.hierarchy_level::int AS level, r.scope_dimension AS "scopeDimension", r.summary
         FROM roles r
        WHERE ($1::text IS NULL OR r.code = $1)
        ORDER BY r.hierarchy_level, r.code`,
      [code ?? null],
    );
    return result.rows;
  },

  async listGrants(db, code) {
    const result = await db.query<GrantRow>(
      `SELECT r.code AS "roleCode", p.code, p.module, p.description, rp.scope, rp.predicate
         FROM role_permissions rp
         JOIN roles r ON r.id = rp.role_id
         JOIN permissions p ON p.id = rp.permission_id
        WHERE rp.scope <> 'none'
          AND ($1::text IS NULL OR r.code = $1)
        ORDER BY r.code, p.code`,
      [code ?? null],
    );
    return result.rows;
  },
};
