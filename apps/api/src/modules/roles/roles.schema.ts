/**
 * Role definitions (BR-109). Zod schemas only, matching docs/openapi.yaml `listRoles`, `getRole`,
 * `RoleDefinition` and `RolePermissionGrant`.
 */
import { z } from 'zod';

export const roleCodeParams = z.object({ code: z.string().trim().min(1).max(64) }).strict();

export const rolePermissionGrant = z.object({
  code: z.string(),
  module: z.string(),
  description: z.string(),
  scope: z.enum(['all', 'own', 'view', 'conditional']),
  predicate: z.string().nullable(),
});
export type RolePermissionGrant = z.infer<typeof rolePermissionGrant>;

export const roleDefinition = z.object({
  code: z.string(),
  name: z.string(),
  level: z.number().int().min(1),
  scopeDimension: z.enum(['warehouse_id', 'zone_id', 'farmer_id', 'customer_id']).nullable(),
  summary: z.string().nullable(),
  permissions: z.array(rolePermissionGrant),
});
export type RoleDefinition = z.infer<typeof roleDefinition>;

export const roleListResponse = z.object({ items: z.array(roleDefinition) });
export type RoleListResponse = z.infer<typeof roleListResponse>;
