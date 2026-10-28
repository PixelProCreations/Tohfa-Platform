/**
 * Sub Warehouse Admin staffing (docs/openapi.yaml `/admin/sub-warehouse-admins`, BR-81):
 *   GET  /admin/sub-warehouse-admins   admin.sub_wh_admin.create   (BR-25, BR-28, BR-30)
 *   POST /admin/sub-warehouse-admins   admin.sub_wh_admin.create   (BR-25, BR-28, BR-81)
 *
 * Both routes use the create code: the Manage Sub Warehouse Admins screen is
 * gated on it (Super, Tohfa and Main admin; Sub none).
 *
 * There is NO update, deactivate or delete route (the server's sub-admins
 * routes say so: deactivation is not built and `admin.account.disable` is
 * none for Main), so this module exports no such call and the screen offers no
 * edit / deactivate / status action.
 *
 * The create body is exactly `fullName`, `mobile` (E.164) and `warehouseId`;
 * the server body is strict, so nothing else is ever sent. The account starts
 * ACTIVE with no password (the admin sets one through forgot-password). A
 * missing warehouse is WAREHOUSE_REQUIRED (BR-25a); a taken mobile or a
 * warehouse at its `system_config.sub_wh_admin_max_per_warehouse` cap is 409
 * CONFLICT. The write moves no money, so no Idempotency-Key is declared or sent.
 *
 * The list pages by number (`items, page, pageSize, total`), not by cursor,
 * and carries no mobile or email: it is not a contact directory.
 *
 * No UI imports, so any admin area can reuse it.
 */
import type { ErrorCode, GenericProblemCode } from '@tohfa/shared-types';
import type { OffsetPage } from '../../../shell/api/pagination';
import { adminGet, adminPost } from './http';

/** docs/openapi.yaml `SubWarehouseAdmin`: one live assignment. */
export interface SubAdminDto {
  userId: string;
  /** Null only for a legacy row; a created admin always has one. */
  adminCode: string | null;
  fullName: string;
  status: 'PENDING' | 'ACTIVE' | 'DISABLED';
  warehouseId: string;
  assignedAt: string;
}

/** The POST answer: the same row, with the generated admin code. */
export interface CreatedSubAdminDto extends SubAdminDto {
  adminCode: string;
}

/** docs/openapi.yaml `SubWarehouseAdminCreate`. */
export interface CreateSubAdminBody {
  /** 1-120 chars after trim. */
  fullName: string;
  /** E.164, e.g. +919876543210. */
  mobile: string;
  /** Warehouse uuid. Required by BR-25; the server answers WAREHOUSE_REQUIRED without it. */
  warehouseId: string;
}

export interface ListSubAdminsParams {
  /** Narrow to one warehouse (uuid); outside the caller's scope is 404. */
  warehouseId?: string | undefined;
  /** From 1. */
  page?: number | undefined;
  /** 1-100, server default 20. */
  pageSize?: number | undefined;
}

/** 401, 403, 404 (warehouse outside scope), 409 (mobile taken / warehouse full), 422, 500. */
export const ERROR_CODES: readonly (GenericProblemCode | ErrorCode)[] = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'VALIDATION_FAILED',
  'WAREHOUSE_REQUIRED',
  'INTERNAL',
];

/** The largest page the server accepts. */
export const SUB_ADMIN_LIST_MAX_PAGE_SIZE = 100;

const PATH = '/admin/sub-warehouse-admins';

export function listSubAdmins(params: ListSubAdminsParams = {}, signal?: AbortSignal): Promise<OffsetPage<SubAdminDto>> {
  return adminGet<OffsetPage<SubAdminDto>>(
    PATH,
    { warehouseId: params.warehouseId, page: params.page, pageSize: params.pageSize },
    signal,
  );
}

/** Every live assignment in scope, following `total` page by page (normally one request). */
export async function listAllSubAdmins(
  params: Omit<ListSubAdminsParams, 'page' | 'pageSize'> = {},
  signal?: AbortSignal,
): Promise<SubAdminDto[]> {
  const out: SubAdminDto[] = [];
  for (let page = 1; ; page += 1) {
    const res = await listSubAdmins({ ...params, page, pageSize: SUB_ADMIN_LIST_MAX_PAGE_SIZE }, signal);
    out.push(...res.items);
    if (res.items.length === 0 || out.length >= res.total) return out;
  }
}

/** Creates one SUB_WH_ADMIN bound to one warehouse. Only the three documented fields are sent. */
export function createSubAdmin(body: CreateSubAdminBody, signal?: AbortSignal): Promise<CreatedSubAdminDto> {
  return adminPost<CreatedSubAdminDto>(
    PATH,
    { fullName: body.fullName, mobile: body.mobile, warehouseId: body.warehouseId },
    { signal },
  );
}
