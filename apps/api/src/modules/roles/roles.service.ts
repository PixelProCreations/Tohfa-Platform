/**
 * Role definitions (BR-109). Read-only.
 *
 * SCOPE. `role.definition.view` is `all` for SUPER/TOHFA and `view` for the three warehouse/zone
 * admin roles. Role definitions are not warehouse, zone or farmer rows, so there is nothing to
 * narrow: every caller holding the code reads the same list (`view` already forbids writes in the
 * middleware, and this module has no write route). The scope is still taken so the service keeps
 * the module contract (callable from a job or a test without a Request).
 */
import type { Executor } from '../../db/pool.js';
import { pool } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { rolesRepo, type GrantRow, type RoleRow, type RolesRepo } from './roles.repo.js';
import type { RoleDefinition, RoleListResponse } from './roles.schema.js';

export interface RolesServiceDeps {
  repo: RolesRepo;
  db: Executor;
}

export interface RolesService {
  list(scope: ResolvedScope): Promise<RoleListResponse>;
  get(scope: ResolvedScope, code: string): Promise<RoleDefinition>;
}

function assemble(roles: RoleRow[], grants: GrantRow[]): RoleDefinition[] {
  const byRole = new Map<string, RoleDefinition['permissions']>();
  for (const { roleCode, ...grant } of grants) {
    const list = byRole.get(roleCode) ?? [];
    list.push(grant);
    byRole.set(roleCode, list);
  }
  return roles.map((role) => ({
    code: role.code,
    name: role.name,
    level: role.level,
    scopeDimension: role.scopeDimension,
    summary: role.summary,
    permissions: byRole.get(role.code) ?? [],
  }));
}

export function createRolesService(deps: Partial<RolesServiceDeps> = {}): RolesService {
  const repo = deps.repo ?? rolesRepo;
  const db = deps.db ?? pool;

  return {
    async list(_scope) {
      // Sequential on purpose: `db` may be a single transaction client.
      const roles = await repo.listRoles(db);
      const grants = await repo.listGrants(db);
      return { items: assemble(roles, grants) };
    },

    async get(_scope, code) {
      const roles = await repo.listRoles(db, code);
      if (roles.length === 0) {
        throw new AppError('NOT_FOUND', { detail: `No role with code "${code}".` });
      }
      const grants = await repo.listGrants(db, code);
      return assemble(roles, grants)[0]!;
    },
  };
}

export const rolesService: RolesService = createRolesService();
