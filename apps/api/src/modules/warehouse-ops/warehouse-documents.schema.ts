/**
 * BR-105: warehouse documents. Schemas must match docs/openapi.yaml
 * (/warehouses/{id}/documents). Request bodies and the query are `.strict()`.
 *
 * The document STATUS is never stored: it is derived at read time from the expiry date, the archive
 * stamp and the configured warning window (`deriveDocumentStatus` below, and the identical SQL CASE in
 * warehouse-documents.repo.ts used for the list filter). A stored status would go stale overnight and a
 * lapsed fire-safety certificate would keep showing as valid.
 */
import { z } from 'zod';
import { isCalendarDate } from '../certifications/certifications.schema.js';

/** Fixed list (BR-105.1, UNCONFIRMED); mirrors the CHECK on warehouse_documents.doc_type. */
export const warehouseDocumentTypes = ['LICENSE', 'FSSAI', 'FIRE_SAFETY', 'LEASE', 'INSURANCE', 'OTHER'] as const;
export type WarehouseDocumentType = (typeof warehouseDocumentTypes)[number];

export const warehouseDocumentStatuses = ['ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'ARCHIVED'] as const;
export type WarehouseDocumentStatus = (typeof warehouseDocumentStatuses)[number];

export const warehouseDocumentsParams = z.object({ id: z.string().uuid('warehouse id must be a UUID') }).strict();
export const warehouseDocumentParams = z
  .object({
    id: z.string().uuid('warehouse id must be a UUID'),
    documentId: z.string().uuid('document id must be a UUID'),
  })
  .strict();

const calendarDate = z
  .string()
  .refine(isCalendarDate, { message: 'Must be a real calendar date in YYYY-MM-DD format' });
const docType = z.enum(warehouseDocumentTypes);
const title = z.string().trim().min(1).max(160);
const documentNumber = z.string().trim().min(1).max(80);
const uploadId = z.string().uuid('uploadId must be a UUID');

const EXPIRY_BEFORE_ISSUE = 'expiryDate must be on or after issueDate';

/** True when both dates are present and the expiry precedes the issue (ISO dates compare as strings). */
export function expiryBeforeIssue(issueDate: string | null | undefined, expiryDate: string | null | undefined): boolean {
  return typeof issueDate === 'string' && typeof expiryDate === 'string' && expiryDate < issueDate;
}
export const expiryBeforeIssueMessage = EXPIRY_BEFORE_ISSUE;

/** POST /v1/warehouses/{id}/documents */
export const createWarehouseDocumentBody = z
  .object({
    docType,
    title,
    documentNumber: documentNumber.nullable().optional(),
    issueDate: calendarDate.nullable().optional(),
    expiryDate: calendarDate.nullable().optional(),
    uploadId,
  })
  .strict()
  .refine((value) => !expiryBeforeIssue(value.issueDate, value.expiryDate), {
    message: EXPIRY_BEFORE_ISSUE,
    path: ['expiryDate'],
  });
export type CreateWarehouseDocumentBody = z.infer<typeof createWarehouseDocumentBody>;

/**
 * PATCH /v1/warehouses/{id}/documents/{documentId}. At least one field. The pair check here only sees
 * the request; the service re-checks the MERGED result against the stored row.
 */
export const updateWarehouseDocumentBody = z
  .object({
    docType: docType.optional(),
    title: title.optional(),
    documentNumber: documentNumber.nullable().optional(),
    issueDate: calendarDate.nullable().optional(),
    expiryDate: calendarDate.nullable().optional(),
    uploadId: uploadId.optional(),
  })
  .strict()
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: 'At least one field must be provided',
  })
  .refine((value) => !expiryBeforeIssue(value.issueDate, value.expiryDate), {
    message: EXPIRY_BEFORE_ISSUE,
    path: ['expiryDate'],
  });
export type UpdateWarehouseDocumentBody = z.infer<typeof updateWarehouseDocumentBody>;

/** GET /v1/warehouses/{id}/documents */
export const listWarehouseDocumentsQuery = z
  .object({
    docType: docType.optional(),
    /** Derived status; archived documents are excluded unless `ARCHIVED` is asked for. */
    status: z.enum(warehouseDocumentStatuses).optional(),
    /** Free-text match on title or document number (wildcards are matched literally). */
    q: z.string().trim().min(1).max(120).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export type ListWarehouseDocumentsQuery = z.infer<typeof listWarehouseDocumentsQuery>;

/** Wire representation of one document (list item). Keep aligned with docs/openapi.yaml. */
export const warehouseDocumentResponse = z.object({
  id: z.string().uuid(),
  warehouseId: z.string().uuid(),
  docType,
  title: z.string(),
  documentNumber: z.string().nullable(),
  issueDate: z.string().nullable(),
  expiryDate: z.string().nullable(),
  status: z.enum(warehouseDocumentStatuses),
  uploadId: z.string().uuid(),
  uploadedBy: z.string().uuid(),
  archivedAt: z.string().nullable(),
  archivedBy: z.string().uuid().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});
export type WarehouseDocument = z.infer<typeof warehouseDocumentResponse>;

/**
 * GET one document: adds a short-lived signed read URL and the file's MIME type. Both are null when
 * the backing uploads row is no longer live (it was deleted after the document was attached).
 */
export const warehouseDocumentDetailResponse = warehouseDocumentResponse.extend({
  fileUrl: z.string().nullable(),
  mimeType: z.string().nullable(),
});
export type WarehouseDocumentDetail = z.infer<typeof warehouseDocumentDetailResponse>;

export const listWarehouseDocumentsResponse = z.object({
  items: z.array(warehouseDocumentResponse),
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
  /** The warning window the statuses were derived with. */
  expiryWarningDays: z.number().int(),
});
export type ListWarehouseDocumentsResponse = z.infer<typeof listWarehouseDocumentsResponse>;

// ---------------------------------------------------------------------------
// Derived status (BR-105.3)
// ---------------------------------------------------------------------------

const MS_PER_DAY = 24 * 60 * 60 * 1000;
/** Asia/Kolkata is UTC+05:30 all year (no daylight saving), so a fixed offset is exact. */
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

/** The Asia/Kolkata calendar day of an instant, as YYYY-MM-DD. */
export function istDate(instant: Date): string {
  return new Date(instant.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** `date` + `days` calendar days, both YYYY-MM-DD. */
export function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

/**
 * ARCHIVED when archived; otherwise EXPIRED when the expiry is before today; EXPIRING_SOON when it is
 * within `windowDays` of today, the boundary day included; otherwise ACTIVE (also with no expiry).
 * `today` is the Asia/Kolkata calendar day. The SQL twin is `statusSql` in the repo.
 */
export function deriveDocumentStatus(
  document: { archivedAt: string | null; expiryDate: string | null },
  today: string,
  windowDays: number,
): WarehouseDocumentStatus {
  if (document.archivedAt !== null) return 'ARCHIVED';
  if (document.expiryDate === null) return 'ACTIVE';
  if (document.expiryDate < today) return 'EXPIRED';
  if (document.expiryDate <= addDays(today, windowDays)) return 'EXPIRING_SOON';
  return 'ACTIVE';
}
