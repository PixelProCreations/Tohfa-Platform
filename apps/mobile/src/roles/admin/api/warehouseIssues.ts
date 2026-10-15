/**
 * Warehouse operational issues (docs/openapi.yaml, BR-103):
 *   GET   /warehouses/{id}/issues                     warehouse.issue.view   (Sub = own)
 *   POST  /warehouses/{id}/issues                     warehouse.issue.manage (Sub = own)
 *   GET   /warehouses/{id}/issues/{issueId}           warehouse.issue.view
 *   PATCH /warehouses/{id}/issues/{issueId}           warehouse.issue.manage
 *   POST  /warehouses/{id}/issues/{issueId}/comments  warehouse.issue.manage
 *
 * Every route takes the warehouse uuid in the path. Another warehouse, an
 * unknown warehouse and an issue that is not in the named warehouse are the
 * same 404 (BR-103 rule 2), so a screen passes scope.warehouseId for a Sub
 * admin, never a picked id (BR-30).
 *
 * There is no resolve route: resolving is a PATCH to status RESOLVED with a
 * `resolutionNote` (422 without it). Which status moves are legal is decided by
 * the server (409 INVALID_STATE_TRANSITION otherwise). There is no DELETE and
 * no attachment endpoint: issues carry no photos.
 *
 * The list pages by number (`items, page, pageSize, total`), not by cursor.
 * Request bodies are strict on the server, so only the documented fields are
 * ever sent. None of these routes moves money, so none sends an Idempotency-Key.
 *
 * No UI imports, so any admin area can reuse this module.
 */
import type { ErrorCode, GenericProblemCode } from '@tohfa/shared-types';
import type { OffsetPage } from '../../../shell/api/pagination';
import { adminGet, adminPatch, adminPost } from './http';

export const ISSUE_CATEGORIES = ['EQUIPMENT', 'STORAGE', 'QUALITY', 'SAFETY', 'STAFFING', 'OTHER'] as const;
export const ISSUE_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export const ISSUE_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;

export type IssueCategoryCode = (typeof ISSUE_CATEGORIES)[number];
export type IssueSeverityCode = (typeof ISSUE_SEVERITIES)[number];
export type IssueStatusCode = (typeof ISSUE_STATUSES)[number];

/** docs/openapi.yaml `WarehouseIssue`. People are user uuids only; the spec carries no names. */
export interface WarehouseIssueDto {
  id: string;
  /** `WI-000001`. */
  issueNumber: string;
  warehouseId: string;
  category: IssueCategoryCode;
  severity: IssueSeverityCode;
  title: string;
  description: string | null;
  status: IssueStatusCode;
  reportedBy: string;
  assignedTo: string | null;
  resolutionNote: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

/** docs/openapi.yaml `WarehouseIssueComment`. */
export interface WarehouseIssueCommentDto {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
}

/** GET one: the issue plus its comment thread, oldest first. */
export interface WarehouseIssueDetailDto extends WarehouseIssueDto {
  comments: WarehouseIssueCommentDto[];
}

export interface ListWarehouseIssuesParams {
  status?: IssueStatusCode | undefined;
  severity?: IssueSeverityCode | undefined;
  category?: IssueCategoryCode | undefined;
  /** A user uuid. */
  assignedTo?: string | undefined;
  /** Title or issue number substring, 1-160 chars. */
  q?: string | undefined;
  /** From 1. */
  page?: number | undefined;
  /** 1-100, server default 20. */
  pageSize?: number | undefined;
}

/** POST body. The reporter is the caller and the status always starts OPEN. */
export interface CreateWarehouseIssueBody {
  category: IssueCategoryCode;
  severity: IssueSeverityCode;
  /** 1-160 chars. */
  title: string;
  /** Up to 4000 chars. */
  description?: string | null | undefined;
  assignedTo?: string | null | undefined;
}

/** PATCH body: at least one field. `null` clears description / unassigns. */
export interface UpdateWarehouseIssueBody {
  status?: IssueStatusCode | undefined;
  severity?: IssueSeverityCode | undefined;
  category?: IssueCategoryCode | undefined;
  title?: string | undefined;
  description?: string | null | undefined;
  assignedTo?: string | null | undefined;
  /** Required when moving to RESOLVED; 1-2000 chars. */
  resolutionNote?: string | undefined;
}

/** 401, 403, 404, 409 (illegal status move / closed issue), 422, 500. */
export const ERROR_CODES: readonly (GenericProblemCode | ErrorCode)[] = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'VALIDATION_FAILED',
  'INVALID_STATE_TRANSITION',
  'INTERNAL',
];

function issuesPath(warehouseId: string): string {
  return `/warehouses/${encodeURIComponent(warehouseId)}/issues`;
}

function issuePath(warehouseId: string, issueId: string): string {
  return `${issuesPath(warehouseId)}/${encodeURIComponent(issueId)}`;
}

export function listWarehouseIssues(
  warehouseId: string,
  params: ListWarehouseIssuesParams = {},
  signal?: AbortSignal,
): Promise<OffsetPage<WarehouseIssueDto>> {
  return adminGet<OffsetPage<WarehouseIssueDto>>(
    issuesPath(warehouseId),
    {
      status: params.status,
      severity: params.severity,
      category: params.category,
      assignedTo: params.assignedTo,
      q: params.q,
      page: params.page,
      pageSize: params.pageSize,
    },
    signal,
  );
}

export function getWarehouseIssue(warehouseId: string, issueId: string, signal?: AbortSignal): Promise<WarehouseIssueDetailDto> {
  return adminGet<WarehouseIssueDetailDto>(issuePath(warehouseId, issueId), undefined, signal);
}

/** Only the documented fields are sent; undefined ones drop out of the JSON. */
export function createWarehouseIssue(warehouseId: string, body: CreateWarehouseIssueBody): Promise<WarehouseIssueDto> {
  return adminPost<WarehouseIssueDto>(issuesPath(warehouseId), {
    category: body.category,
    severity: body.severity,
    title: body.title,
    description: body.description,
    assignedTo: body.assignedTo,
  });
}

export function updateWarehouseIssue(
  warehouseId: string,
  issueId: string,
  body: UpdateWarehouseIssueBody,
): Promise<WarehouseIssueDto> {
  return adminPatch<WarehouseIssueDto>(issuePath(warehouseId, issueId), {
    status: body.status,
    severity: body.severity,
    category: body.category,
    title: body.title,
    description: body.description,
    assignedTo: body.assignedTo,
    resolutionNote: body.resolutionNote,
  });
}

export function addWarehouseIssueComment(
  warehouseId: string,
  issueId: string,
  body: string,
): Promise<WarehouseIssueCommentDto> {
  return adminPost<WarehouseIssueCommentDto>(`${issuePath(warehouseId, issueId)}/comments`, { body });
}
