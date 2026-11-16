/**
 * Purchase Orders, read-only (docs/openapi.yaml tag Purchase):
 *   GET /admin/purchase-orders        purchase.order.view   (BR-30, BR-122)
 *   GET /admin/purchase-orders/{id}   purchase.order.view   (BR-30, BR-119)
 *
 * The DTO types are reused from ./receiving.ts (the goods-receiving wizard
 * already reads these endpoints). This file adds what that client does not
 * carry: the list row's `farmerName` / `cropName` (openapi
 * `PurchaseOrderListItem`), the detail's `cropName`, and the BR-122 search and
 * date-range params `q`, `from`, `to`. There is no purchase-order write in the
 * API, so there is none here.
 *
 * Known server drift (not worked around here, reported): the server's zod
 * enum for `status` is ISSUED / PARTIALLY_RECEIVED / FULLY_RECEIVED /
 * CANCELLED / CLOSED, while the spec and the database say RECEIVED. This
 * client sends the spec's value. `totalAmount` is computed with floats on the
 * server today (another team is fixing it); a value that is not a Money string
 * renders as the dash, never a rounded float.
 */
import type { Page } from '../../../shell/api/pagination';
import { adminGet } from './http';
import type { PurchaseOrderDetailDto, PurchaseOrderDto, PurchaseOrderStatus } from './receiving';

export type { PurchaseOrderStatus };

/** openapi `PurchaseOrderListItem`: the order plus the farmer's and crop's names (null when missing). */
export interface PurchaseOrderListItemDto extends PurchaseOrderDto {
  farmerName: string | null;
  cropName: string | null;
}

/** openapi `PurchaseOrderDetail` plus `cropName` (BR-119). */
export interface PurchaseOrderDetailRowDto extends PurchaseOrderDetailDto {
  cropName?: string | null;
}

export type PurchaseOrderListPage = Page<PurchaseOrderListItemDto>;

export interface PurchaseOrderListParams {
  cursor?: string | undefined;
  /** 1-100, server default 20. */
  limit?: number | undefined;
  status?: PurchaseOrderStatus | undefined;
  warehouseId?: string | undefined;
  /** BR-122: literal, case-insensitive substring of PO number, farmer name or crop name; 1-100 chars. */
  q?: string | undefined;
  /** BR-122: first IST day of `issuedAt`, inclusive (YYYY-MM-DD). */
  from?: string | undefined;
  /** BR-122: last IST day of `issuedAt`, inclusive; not before `from`. */
  to?: string | undefined;
}

export function listPurchaseOrderRows(params: PurchaseOrderListParams = {}, signal?: AbortSignal): Promise<PurchaseOrderListPage> {
  return adminGet<PurchaseOrderListPage>(
    '/admin/purchase-orders',
    {
      cursor: params.cursor,
      limit: params.limit,
      status: params.status,
      warehouseId: params.warehouseId,
      q: params.q,
      from: params.from,
      to: params.to,
    },
    signal,
  );
}

/** One order with its farmer and receipts; 404 when it is outside the caller's scope. */
export function getPurchaseOrderDetail(id: string, signal?: AbortSignal): Promise<PurchaseOrderDetailRowDto> {
  return adminGet<PurchaseOrderDetailRowDto>(`/admin/purchase-orders/${encodeURIComponent(id)}`, undefined, signal);
}
