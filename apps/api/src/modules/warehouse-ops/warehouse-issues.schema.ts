/**
 * BR-103: warehouse operational issues. Schemas must match docs/openapi.yaml
 * (/warehouses/{id}/issues). Request bodies and the list query are `.strict()` so an unknown field
 * (a `warehouseId`, an `issueNumber`, a `reportedBy`) is a 422 rather than silently ignored.
 *
 * Categories and severities are fixed lists (BR-103 rule 1, UNCONFIRMED) mirrored by the CHECK
 * constraints in db/migrations/0067_warehouse_operations.sql; the lengths below mirror the same CHECKs.
 */
import { z } from 'zod';

export const ISSUE_CATEGORIES = ['EQUIPMENT', 'STORAGE', 'QUALITY', 'SAFETY', 'STAFFING', 'OTHER'] as const;
export const ISSUE_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export const ISSUE_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;

export const issueCategory = z.enum(ISSUE_CATEGORIES);
export const issueSeverity = z.enum(ISSUE_SEVERITIES);
export const issueStatus = z.enum(ISSUE_STATUSES);
export type IssueCategory = z.infer<typeof issueCategory>;
export type IssueSeverity = z.infer<typeof issueSeverity>;
export type IssueStatus = z.infer<typeof issueStatus>;

export const warehouseIssuesParams = z.object({ id: z.string().uuid('warehouse id must be a UUID') }).strict();
export const warehouseIssueParams = z
  .object({
    id: z.string().uuid('warehouse id must be a UUID'),
    issueId: z.string().uuid('issue id must be a UUID'),
  })
  .strict();

const title = z.string().trim().min(1).max(160);
const description = z.string().trim().min(1).max(4000);
const resolutionNote = z.string().trim().min(1).max(2000);
const assignee = z.string().uuid('assignedTo must be a user id (UUID)');

/** POST /v1/warehouses/{id}/issues. The reporter is the caller; the status always starts OPEN. */
export const createWarehouseIssueBody = z
  .object({
    category: issueCategory,
    severity: issueSeverity,
    title,
    description: description.nullable().optional(),
    assignedTo: assignee.nullable().optional(),
  })
  .strict();
export type CreateWarehouseIssueBody = z.infer<typeof createWarehouseIssueBody>;

/**
 * PATCH /v1/warehouses/{id}/issues/{issueId}. `null` clears `description` and unassigns `assignedTo`.
 * Whether a status move is legal and whether a resolution note is required depend on the stored row,
 * so they are decided by the service, not here.
 */
export const updateWarehouseIssueBody = z
  .object({
    status: issueStatus.optional(),
    severity: issueSeverity.optional(),
    category: issueCategory.optional(),
    title: title.optional(),
    description: description.nullable().optional(),
    assignedTo: assignee.nullable().optional(),
    resolutionNote: resolutionNote.optional(),
  })
  .strict()
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: 'At least one field must be provided',
  });
export type UpdateWarehouseIssueBody = z.infer<typeof updateWarehouseIssueBody>;

/** POST /v1/warehouses/{id}/issues/{issueId}/comments */
export const createWarehouseIssueCommentBody = z
  .object({ body: z.string().trim().min(1).max(2000) })
  .strict();
export type CreateWarehouseIssueCommentBody = z.infer<typeof createWarehouseIssueCommentBody>;

/** GET /v1/warehouses/{id}/issues */
export const listWarehouseIssuesQuery = z
  .object({
    status: issueStatus.optional(),
    severity: issueSeverity.optional(),
    category: issueCategory.optional(),
    assignedTo: assignee.optional(),
    /** Case-insensitive substring of the title or the issue number (LIKE wildcards are literal). */
    q: z.string().trim().min(1).max(160).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export type ListWarehouseIssuesQuery = z.infer<typeof listWarehouseIssuesQuery>;

/** Wire representation of one issue. Keep aligned with docs/openapi.yaml `WarehouseIssue`. */
export const warehouseIssueResponse = z.object({
  id: z.string().uuid(),
  issueNumber: z.string(),
  warehouseId: z.string().uuid(),
  category: issueCategory,
  severity: issueSeverity,
  title: z.string(),
  description: z.string().nullable(),
  status: issueStatus,
  reportedBy: z.string().uuid(),
  assignedTo: z.string().uuid().nullable(),
  resolutionNote: z.string().nullable(),
  resolvedBy: z.string().uuid().nullable(),
  resolvedAt: z.string().nullable(),
  closedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});
export type WarehouseIssue = z.infer<typeof warehouseIssueResponse>;

export const warehouseIssueCommentResponse = z.object({
  id: z.string().uuid(),
  authorId: z.string().uuid(),
  body: z.string(),
  createdAt: z.string(),
});
export type WarehouseIssueComment = z.infer<typeof warehouseIssueCommentResponse>;

/** GET one: the issue plus its comment thread, oldest first. */
export const warehouseIssueDetailResponse = warehouseIssueResponse.extend({
  comments: z.array(warehouseIssueCommentResponse),
});
export type WarehouseIssueDetail = z.infer<typeof warehouseIssueDetailResponse>;

export const listWarehouseIssuesResponse = z.object({
  items: z.array(warehouseIssueResponse),
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
});
export type ListWarehouseIssuesResponse = z.infer<typeof listWarehouseIssuesResponse>;
