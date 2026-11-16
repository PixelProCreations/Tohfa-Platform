/**
 * Admin account creation (docs/openapi.yaml `POST /admin/accounts`, BR-28, BR-112, BR-35):
 *   POST /admin/accounts   x-permission-any-of: admin.super_admin.create, admin.tohfa_admin.create,
 *                          admin.farmer_admin.create, admin.main_wh_admin.create, admin.sub_wh_admin.create
 *
 * The code that applies is the one for the requested `role`; a caller without
 * it is 403 (and one DENIED audit row is written). SUB_WH_ADMIN is refused
 * here with 422: a Sub Warehouse Admin is created by POST
 * /admin/sub-warehouse-admins (api/subAdmins.ts). FARMER_ADMIN needs exactly
 * one `zoneId`; every other role must not send one.
 *
 * The body is strict: role, fullName, mobile (E.164) and zoneId only. No
 * email, password, status or admin code: the account starts ACTIVE with no
 * password (set through forgot-password) and the code is generated. A taken
 * mobile is 409. The write moves no money, so no Idempotency-Key is declared
 * or sent.
 *
 * No UI imports, so any admin area can reuse it.
 */
import type { ErrorCode, GenericProblemCode } from '@tohfa/shared-types';
import { adminPost } from './http';

/** docs/openapi.yaml `AdminAccountCreate.role` minus SUB_WH_ADMIN (refused by this endpoint). */
export const ADMIN_ACCOUNT_ROLES = ['SUPER_ADMIN', 'TOHFA_ADMIN', 'FARMER_ADMIN', 'MAIN_WH_ADMIN'] as const;
export type AdminAccountRole = (typeof ADMIN_ACCOUNT_ROLES)[number];

/** docs/openapi.yaml `AdminAccountCreate`. */
export interface CreateAdminAccountBody {
  role: AdminAccountRole;
  /** 1-120 chars. */
  fullName: string;
  /** E.164, e.g. +919876500001. */
  mobile: string;
  /** Required for FARMER_ADMIN, refused for every other role. */
  zoneId?: string;
}

/** docs/openapi.yaml `AdminAccountCreated`. Never carries the mobile or a credential. */
export interface AdminAccountCreatedDto {
  userId: string;
  adminCode: string;
  fullName: string;
  role: AdminAccountRole;
  status: 'ACTIVE';
  zoneIds: string[];
  assignedAt: string;
}

/** Must match `AdminAccountCreate.mobile`. */
export const ADMIN_MOBILE_PATTERN = /^\+[1-9][0-9]{7,14}$/;
/** API validation limit, not a business threshold. */
export const ADMIN_NAME_MAX = 120;

/** 401, 403, 409 (mobile taken), 422, 500. */
export const ERROR_CODES: readonly (GenericProblemCode | ErrorCode)[] = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'CONFLICT',
  'VALIDATION_FAILED',
  'INTERNAL',
];

/** Only the documented fields are sent; zoneId only when given. */
export function createAdminAccount(body: CreateAdminAccountBody, signal?: AbortSignal): Promise<AdminAccountCreatedDto> {
  const payload: CreateAdminAccountBody = { role: body.role, fullName: body.fullName, mobile: body.mobile };
  if (body.zoneId !== undefined) payload.zoneId = body.zoneId;
  return adminPost<AdminAccountCreatedDto>('/admin/accounts', payload, { signal });
}
