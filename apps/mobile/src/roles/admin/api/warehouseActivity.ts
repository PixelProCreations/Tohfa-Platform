/**
 * The warehouse activity feed (docs/openapi.yaml, BR-104):
 *   GET /warehouses/{id}/activity   warehouse.activity.view (Sub = own)
 *
 * A read-only, newest-first merge of records other modules own: stock-ledger
 * movements, goods receipts, transfers, BR-103 issues, return requests and
 * BR-105 documents. There is no write route and no detail route: a screen
 * that shows one event shows the list row it already has.
 *
 * Filters are exactly what the server takes: `type` (one comma-separated
 * parameter, never repeated), `from`/`to` (inclusive IST calendar dates,
 * given together; the span cap is server config) and cursor paging (`limit`
 * 1-100). A screen must not offer a filter the API lacks (cash, QC, orders).
 *
 * An event carries no free text, no farmer and no customer (BR-104 item 5):
 * only the type, the source row id, the time, a reference, and status /
 * severity / signed kg / direction where they apply, plus the actor's uuid.
 *
 * No UI imports, so any admin area can reuse this module.
 */
import type { GenericProblemCode } from '@tohfa/shared-types';
import type { Page } from '../../../shell/api/pagination';
import { adminGet } from './http';
import type { IssueSeverityCode } from './warehouseIssues';

export const ACTIVITY_TYPES = ['STOCK_MOVEMENT', 'GOODS_RECEIPT', 'TRANSFER', 'ISSUE', 'RETURN', 'DOCUMENT'] as const;
export type ActivityTypeCode = (typeof ACTIVITY_TYPES)[number];

/** docs/openapi.yaml `WarehouseActivityEvent`. */
export interface WarehouseActivityEventDto {
  type: ActivityTypeCode;
  /** The source row's id (ledger row, goods receipt, transfer, issue, return request or document). */
  sourceId: string;
  /** UTC instant with microsecond precision. */
  occurredAt: string;
  /** Movement type, GRN number, transfer number, issue number, return id or document type. */
  reference: string;
  status: string | null;
  /** Only for an ISSUE. */
  severity: IssueSeverityCode | null;
  /** Signed kg (3 decimals) for a stock movement, gross kg for a goods receipt; else null. */
  qtyKg: string | null;
  /** Only for a TRANSFER, relative to the requested warehouse. */
  direction: 'OUTBOUND' | 'INBOUND' | null;
  /** A user uuid; the spec carries no name. */
  actorId: string | null;
}

export interface ListWarehouseActivityParams {
  /** Sent as one comma-separated value; empty or undefined = every type. */
  types?: readonly ActivityTypeCode[] | undefined;
  /** YYYY-MM-DD (IST), only together with `to`. */
  from?: string | undefined;
  to?: string | undefined;
  cursor?: string | undefined;
  /** 1-100, server default 20. */
  limit?: number | undefined;
}

/** 401, 403, 404 (warehouse out of scope), 422 (bad filter or cursor), 500. */
export const ERROR_CODES: readonly GenericProblemCode[] = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'VALIDATION_FAILED',
  'INTERNAL',
];

export function listWarehouseActivity(
  warehouseId: string,
  params: ListWarehouseActivityParams = {},
  signal?: AbortSignal,
): Promise<Page<WarehouseActivityEventDto>> {
  const types = params.types !== undefined && params.types.length > 0 ? [...new Set(params.types)].join(',') : undefined;
  // from/to travel together or not at all (the server refuses one without the other).
  const range = params.from !== undefined && params.to !== undefined ? { from: params.from, to: params.to } : {};
  return adminGet<Page<WarehouseActivityEventDto>>(
    `/warehouses/${encodeURIComponent(warehouseId)}/activity`,
    { type: types, ...range, cursor: params.cursor, limit: params.limit },
    signal,
  );
}
