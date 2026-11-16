/**
 * Role definitions (docs/openapi.yaml `/roles`, BR-109):
 *   GET /roles          role.definition.view  (SA/TOHFA all; FARMER_ADMIN, MAIN, SUB view; FARMER, CUSTOMER 403)
 *   GET /roles/{code}   role.definition.view  (404 for an unknown code)
 *
 * Read-only. The rows come from the roles / role_permissions tables, synced
 * from docs/rbac.json. There is no write route: editing a grant would be
 * `role.permission.edit`, which the server has not built, so this module
 * exports no write call.
 *
 * No UI imports, so any admin area can reuse it.
 */
import type { ErrorCode, GenericProblemCode } from '@tohfa/shared-types';
import { adminGet } from './http';

/** docs/openapi.yaml `RolePermissionGrant`. A `none` grant is omitted by the server. */
export interface RolePermissionGrantDto {
  code: string;
  module: string;
  description: string;
  scope: 'all' | 'own' | 'view' | 'conditional';
  /** The predicate of a `conditional` grant; null otherwise. */
  predicate: string | null;
}

/** docs/openapi.yaml `RoleDefinition`. */
export interface RoleDefinitionDto {
  code: string;
  name: string;
  /** 1 is the highest authority. */
  level: number;
  scopeDimension: 'warehouse_id' | 'zone_id' | 'farmer_id' | 'customer_id' | null;
  summary: string | null;
  /** Granted permissions only, ordered by code. */
  permissions: RolePermissionGrantDto[];
}

export interface RoleListDto {
  items: RoleDefinitionDto[];
}

/** 401, 403, 404 (unknown code), 422, 500. */
export const ERROR_CODES: readonly (GenericProblemCode | ErrorCode)[] = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'VALIDATION_FAILED',
  'INTERNAL',
];

const BASE = '/roles';

/** Every role, ordered by level then code, each with its granted permissions. */
export function listRoles(signal?: AbortSignal): Promise<RoleListDto> {
  return adminGet<RoleListDto>(BASE, undefined, signal);
}

export function getRole(code: string, signal?: AbortSignal): Promise<RoleDefinitionDto> {
  return adminGet<RoleDefinitionDto>(`${BASE}/${encodeURIComponent(code)}`, undefined, signal);
}
