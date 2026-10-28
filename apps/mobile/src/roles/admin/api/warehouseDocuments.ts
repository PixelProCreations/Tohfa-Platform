/**
 * Warehouse compliance and property documents (docs/openapi.yaml tag Inventory, BR-105):
 *   GET   /warehouses/{id}/documents                          warehouse.document.view   (Sub = own)
 *   POST  /warehouses/{id}/documents                          warehouse.document.manage (Sub = none)
 *   GET   /warehouses/{id}/documents/{documentId}             warehouse.document.view   (Sub = own)
 *   PATCH /warehouses/{id}/documents/{documentId}             warehouse.document.manage (Sub = none)
 *   POST  /warehouses/{id}/documents/{documentId}/archive     warehouse.document.manage (Sub = none)
 *
 * Every route takes the warehouse uuid in the path. A Sub Warehouse Admin
 * asking for another warehouse (or an unknown id) gets the same 404, never 403
 * (BR-30). Screens pass scope.warehouseId for a Sub scope, never a picked id.
 *
 * `status` is DERIVED by the server at read time from the expiry date, the
 * archive stamp and system_config's warning window (BR-105.3); the app shows it
 * as sent and never computes it (that window is a business threshold, root
 * CLAUDE.md 2.7).
 *
 * The file is never public: only the detail carries `fileUrl`, a signed read
 * URL that lives 15 minutes, so a caller asks for the detail again right before
 * opening the file instead of caching the link.
 *
 * Creating a document needs an `uploadId` from POST /uploads/sign (purpose
 * WAREHOUSE_DOCUMENT) and a PUT of the bytes to the signed target. The admin
 * app has no file picker or uploader (the only one is the farmer role's, which
 * the cross-role guard keeps out of admin), so `createWarehouseDocument` is
 * exported for completeness but no admin screen calls it yet.
 *
 * None of these routes moves money or declares an Idempotency-Key; none is sent.
 *
 * No UI imports, so any admin area can reuse this module.
 */
import type { ErrorCode, GenericProblemCode } from '@tohfa/shared-types';
import type { OffsetPage } from '../../../shell/api/pagination';
import { adminGet, adminPatch, adminPost } from './http';

/** docs/openapi.yaml WarehouseDocument.docType (BR-105.1), in screen order. */
export const WAREHOUSE_DOCUMENT_TYPES = ['LICENSE', 'FSSAI', 'FIRE_SAFETY', 'LEASE', 'INSURANCE', 'OTHER'] as const;
export type WarehouseDocumentType = (typeof WAREHOUSE_DOCUMENT_TYPES)[number];

/** docs/openapi.yaml WarehouseDocument.status, derived server-side (BR-105.3). */
export const WAREHOUSE_DOCUMENT_STATUSES = ['ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'ARCHIVED'] as const;
export type WarehouseDocumentStatus = (typeof WAREHOUSE_DOCUMENT_STATUSES)[number];

/** docs/openapi.yaml WarehouseDocument (a list item: no file URL). Dates are YYYY-MM-DD. */
export interface WarehouseDocumentDto {
  id: string;
  warehouseId: string;
  docType: WarehouseDocumentType;
  title: string;
  documentNumber: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  status: WarehouseDocumentStatus;
  uploadId: string;
  uploadedBy: string;
  archivedAt: string | null;
  archivedBy: string | null;
  createdAt: string;
  updatedAt: string | null;
}

/** docs/openapi.yaml WarehouseDocumentDetail: both extras are null when the backing upload was deleted. */
export interface WarehouseDocumentDetailDto extends WarehouseDocumentDto {
  /** Signed read URL, valid 15 minutes. */
  fileUrl: string | null;
  mimeType: string | null;
}

/** docs/openapi.yaml WarehouseDocumentList. */
export interface WarehouseDocumentListDto extends OffsetPage<WarehouseDocumentDto> {
  /** The warning window the statuses were derived with (system_config). */
  expiryWarningDays: number;
}

export interface ListWarehouseDocumentsParams {
  docType?: WarehouseDocumentType | undefined;
  /** Archived documents are left out unless ARCHIVED is asked for. */
  status?: WarehouseDocumentStatus | undefined;
  /** Title or document number, 1-120 characters. */
  q?: string | undefined;
  /** From 1. */
  page?: number | undefined;
  /** 1-100, server default 20. */
  pageSize?: number | undefined;
}

/** docs/openapi.yaml WarehouseDocumentCreate. */
export interface CreateWarehouseDocumentBody {
  docType: WarehouseDocumentType;
  title: string;
  documentNumber?: string | null | undefined;
  issueDate?: string | null | undefined;
  expiryDate?: string | null | undefined;
  /** From POST /uploads/sign with purpose WAREHOUSE_DOCUMENT, uploaded by the caller. */
  uploadId: string;
}

/** docs/openapi.yaml WarehouseDocumentUpdate: at least one field; null clears the last three. */
export interface UpdateWarehouseDocumentBody {
  docType?: WarehouseDocumentType | undefined;
  title?: string | undefined;
  documentNumber?: string | null | undefined;
  issueDate?: string | null | undefined;
  expiryDate?: string | null | undefined;
  uploadId?: string | undefined;
}

/** Every problem code the document routes document (401, 403, 404, 409 incl. INVALID_STATE_TRANSITION, 422, 500). */
export const ERROR_CODES: readonly (GenericProblemCode | ErrorCode)[] = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'INVALID_STATE_TRANSITION',
  'VALIDATION_FAILED',
  'INTERNAL',
];

/** The largest page the server accepts. */
export const WAREHOUSE_DOCUMENTS_MAX_PAGE_SIZE = 100;

const UPDATE_KEYS = ['docType', 'title', 'documentNumber', 'issueDate', 'expiryDate', 'uploadId'] as const;

function documentsPath(warehouseId: string): string {
  return `/warehouses/${encodeURIComponent(warehouseId)}/documents`;
}

function documentPath(warehouseId: string, documentId: string): string {
  return `${documentsPath(warehouseId)}/${encodeURIComponent(documentId)}`;
}

export function listWarehouseDocuments(
  warehouseId: string,
  params: ListWarehouseDocumentsParams = {},
  signal?: AbortSignal,
): Promise<WarehouseDocumentListDto> {
  const q = params.q?.trim();
  return adminGet<WarehouseDocumentListDto>(
    documentsPath(warehouseId),
    {
      docType: params.docType,
      status: params.status,
      q: q === undefined || q === '' ? undefined : q.slice(0, 120),
      page: params.page,
      pageSize: params.pageSize,
    },
    signal,
  );
}

/** One document with a fresh signed file URL (15 minutes). */
export function getWarehouseDocument(warehouseId: string, documentId: string, signal?: AbortSignal): Promise<WarehouseDocumentDetailDto> {
  return adminGet<WarehouseDocumentDetailDto>(documentPath(warehouseId, documentId), undefined, signal);
}

export function createWarehouseDocument(warehouseId: string, body: CreateWarehouseDocumentBody): Promise<WarehouseDocumentDto> {
  return adminPost<WarehouseDocumentDto>(documentsPath(warehouseId), {
    docType: body.docType,
    title: body.title,
    ...(body.documentNumber === undefined ? {} : { documentNumber: body.documentNumber }),
    ...(body.issueDate === undefined ? {} : { issueDate: body.issueDate }),
    ...(body.expiryDate === undefined ? {} : { expiryDate: body.expiryDate }),
    uploadId: body.uploadId,
  });
}

/**
 * Edits the metadata (or replaces the file). The body is strict on the server,
 * so it is built from an allow-list: undefined keys are left out, null is sent.
 * An empty edit is refused here, before the server's 422.
 */
export function updateWarehouseDocument(
  warehouseId: string,
  documentId: string,
  body: UpdateWarehouseDocumentBody,
): Promise<WarehouseDocumentDto> {
  const allowed: Record<string, unknown> = {};
  for (const key of UPDATE_KEYS) {
    if (body[key] !== undefined) allowed[key] = body[key];
  }
  if (Object.keys(allowed).length === 0) return Promise.reject(new RangeError('a document edit needs at least one field'));
  return adminPatch<WarehouseDocumentDto>(documentPath(warehouseId, documentId), allowed);
}

/** Archives once; a repeat is a 200 no-op. There is no delete and no un-archive. */
export function archiveWarehouseDocument(warehouseId: string, documentId: string): Promise<WarehouseDocumentDto> {
  return adminPost<WarehouseDocumentDto>(`${documentPath(warehouseId, documentId)}/archive`, {});
}
