/**
 * Warehouse documents (BR-105) -> what the Documents screen draws, and the
 * metadata edit form -> the PATCH body. Pure (no React), so plain-Node vitest
 * covers every rule here (../../../tests/mappers_documents.test.ts).
 *
 * The status is shown exactly as the server derived it (BR-105.3): the warning
 * window is system_config's, never a constant here (root CLAUDE.md 2.7). Every
 * enum goes through an exhaustive table with an explicit fallback, so a value
 * the app does not know yet still renders.
 */
import {
  WAREHOUSE_DOCUMENT_STATUSES,
  WAREHOUSE_DOCUMENT_TYPES,
  type UpdateWarehouseDocumentBody,
  type WarehouseDocumentDetailDto,
  type WarehouseDocumentDto,
  type WarehouseDocumentStatus,
  type WarehouseDocumentType,
} from '../../../api/warehouseDocuments';
import { t, type TranslationKey } from '../../../i18n';
import type { AdminTone } from '../../../theme';
import { formatAdminDay } from '../../../utils/datetime';

// ─── Labels ──────────────────────────────────────────────────────────────────

export const DOCUMENT_TYPE_LABEL: Readonly<Record<WarehouseDocumentType, TranslationKey>> = {
  LICENSE: 'warehouseDocs.type.LICENSE',
  FSSAI: 'warehouseDocs.type.FSSAI',
  FIRE_SAFETY: 'warehouseDocs.type.FIRE_SAFETY',
  LEASE: 'warehouseDocs.type.LEASE',
  INSURANCE: 'warehouseDocs.type.INSURANCE',
  OTHER: 'warehouseDocs.type.OTHER',
};

export const DOCUMENT_STATUS_LABEL: Readonly<Record<WarehouseDocumentStatus, TranslationKey>> = {
  ACTIVE: 'warehouseDocs.status.ACTIVE',
  EXPIRING_SOON: 'warehouseDocs.status.EXPIRING_SOON',
  EXPIRED: 'warehouseDocs.status.EXPIRED',
  ARCHIVED: 'warehouseDocs.status.ARCHIVED',
};

const DOCUMENT_STATUS_TONE: Readonly<Record<WarehouseDocumentStatus, AdminTone>> = {
  ACTIVE: 'success',
  EXPIRING_SOON: 'warning',
  EXPIRED: 'danger',
  ARCHIVED: 'info',
};

export function isDocumentType(value: unknown): value is WarehouseDocumentType {
  return typeof value === 'string' && (WAREHOUSE_DOCUMENT_TYPES as readonly string[]).includes(value);
}

export function isDocumentStatus(value: unknown): value is WarehouseDocumentStatus {
  return typeof value === 'string' && (WAREHOUSE_DOCUMENT_STATUSES as readonly string[]).includes(value);
}

export function documentTypeLabel(value: unknown): string {
  return isDocumentType(value) ? t(DOCUMENT_TYPE_LABEL[value]) : t('warehouseDocs.type.unknown');
}

export function documentStatusLabel(value: unknown): string {
  return isDocumentStatus(value) ? t(DOCUMENT_STATUS_LABEL[value]) : t('warehouseDocs.status.unknown');
}

export function documentStatusTone(value: unknown): AdminTone {
  return isDocumentStatus(value) ? DOCUMENT_STATUS_TONE[value] : 'info';
}

// ─── Filters ─────────────────────────────────────────────────────────────────

export type DocumentStatusFilter = 'ALL' | WarehouseDocumentStatus;
export type DocumentTypeFilter = 'ALL' | WarehouseDocumentType;

export const DOCUMENT_STATUS_FILTERS: readonly DocumentStatusFilter[] = ['ALL', ...WAREHOUSE_DOCUMENT_STATUSES];
export const DOCUMENT_TYPE_FILTERS: readonly DocumentTypeFilter[] = ['ALL', ...WAREHOUSE_DOCUMENT_TYPES];

export function statusFilterLabel(filter: DocumentStatusFilter): string {
  return filter === 'ALL' ? t('warehouseDocs.filter.allStatuses') : documentStatusLabel(filter);
}

export function typeFilterLabel(filter: DocumentTypeFilter): string {
  return filter === 'ALL' ? t('warehouseDocs.filter.allTypes') : documentTypeLabel(filter);
}

/** A chip value -> the list query param (undefined = no filter). */
export function filterParam<T extends string>(filter: 'ALL' | T): T | undefined {
  return filter === 'ALL' ? undefined : filter;
}

// ─── Rows ────────────────────────────────────────────────────────────────────

export interface WarehouseDocumentView {
  id: string;
  warehouseId: string;
  title: string;
  documentNumber: string | null;
  docType: WarehouseDocumentType | null;
  docTypeLabel: string;
  status: WarehouseDocumentStatus | null;
  statusLabel: string;
  statusTone: AdminTone;
  /** As sent (YYYY-MM-DD), for the edit form. */
  issueDate: string | null;
  expiryDate: string | null;
  /** '25 Sep 2026', or null when not set. */
  issueLabel: string | null;
  expiryLabel: string | null;
  /** 'Issued 01 Jan 2026 · Expires 31 Dec 2026', 'No expiry date', ... */
  dateLine: string;
  isArchived: boolean;
  /** When it was added (day only). */
  addedLabel: string | null;
}

function dayOrNull(date: string | null | undefined): string | null {
  if (date === null || date === undefined || date === '') return null;
  return formatAdminDay(date) || null;
}

function dateLineOf(issue: string | null, expiry: string | null): string {
  if (issue !== null && expiry !== null) return t('warehouseDocs.dates.issuedAndExpires', { issued: issue, expires: expiry });
  if (expiry !== null) return t('warehouseDocs.dates.expires', { expires: expiry });
  if (issue !== null) return t('warehouseDocs.dates.issuedNoExpiry', { issued: issue });
  return t('warehouseDocs.dates.none');
}

export function toDocumentView(dto: WarehouseDocumentDto): WarehouseDocumentView {
  const issueLabel = dayOrNull(dto.issueDate);
  const expiryLabel = dayOrNull(dto.expiryDate);
  const documentNumber = dto.documentNumber === null || dto.documentNumber.trim() === '' ? null : dto.documentNumber;
  return {
    id: dto.id,
    warehouseId: dto.warehouseId,
    title: dto.title,
    documentNumber,
    docType: isDocumentType(dto.docType) ? dto.docType : null,
    docTypeLabel: documentTypeLabel(dto.docType),
    status: isDocumentStatus(dto.status) ? dto.status : null,
    statusLabel: documentStatusLabel(dto.status),
    statusTone: documentStatusTone(dto.status),
    issueDate: dto.issueDate,
    expiryDate: dto.expiryDate,
    issueLabel,
    expiryLabel,
    dateLine: dateLineOf(issueLabel, expiryLabel),
    // The server's archive stamp is the truth; the derived status says the same.
    isArchived: dto.archivedAt !== null || dto.status === 'ARCHIVED',
    addedLabel: dayOrNull(dto.createdAt),
  };
}

export interface WarehouseDocumentDetailView extends WarehouseDocumentView {
  /** False when the backing upload was deleted (fileUrl null): nothing to open. */
  hasFile: boolean;
  mimeType: string | null;
}

export function toDocumentDetailView(dto: WarehouseDocumentDetailDto): WarehouseDocumentDetailView {
  return {
    ...toDocumentView(dto),
    hasFile: typeof dto.fileUrl === 'string' && dto.fileUrl !== '',
    mimeType: dto.mimeType,
  };
}

/** The signed URL to hand to the OS, or null when the file is gone. Never cached: it lives 15 minutes. */
export function openableFileUrl(dto: WarehouseDocumentDetailDto): string | null {
  return typeof dto.fileUrl === 'string' && dto.fileUrl !== '' ? dto.fileUrl : null;
}

/** Edit and archive are offered only with warehouse.document.manage, and never on an archived document (409). */
export function canManageDocument(view: WarehouseDocumentView, canManage: boolean): boolean {
  return canManage && !view.isArchived;
}

// ─── Metadata edit (PATCH) ───────────────────────────────────────────────────

export interface DocumentForm {
  docType: WarehouseDocumentType;
  title: string;
  documentNumber: string;
  /** YYYY-MM-DD or '' (= not set). */
  issueDate: string;
  expiryDate: string;
}

/**
 * docs/openapi.yaml WarehouseDocumentUpdate bounds (title 1..160, number
 * 1..80, real calendar dates, expiry on or after issue). Contract bounds of the
 * request schema, not business thresholds.
 */
export const DOCUMENT_TITLE_MAX = 160;
export const DOCUMENT_NUMBER_MAX = 80;

export function documentFormOf(view: WarehouseDocumentView): DocumentForm {
  return {
    docType: view.docType ?? 'OTHER',
    title: view.title,
    documentNumber: view.documentNumber ?? '',
    issueDate: view.issueDate ?? '',
    expiryDate: view.expiryDate ?? '',
  };
}

/** A real YYYY-MM-DD calendar day (rejects 2026-02-30). */
export function isCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match === null) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export type DocumentEditResult = { body: UpdateWarehouseDocumentBody } | { errorKey: TranslationKey };

function blankToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

/**
 * The PATCH body for an edit: only the fields that changed, after the same
 * checks the server makes. An unchanged form is an error here (the server
 * would 422 an empty body).
 */
export function documentEditBody(original: WarehouseDocumentView, form: DocumentForm): DocumentEditResult {
  const title = form.title.trim();
  if (title === '' || title.length > DOCUMENT_TITLE_MAX) return { errorKey: 'warehouseDocs.edit.error.title' };
  const documentNumber = blankToNull(form.documentNumber);
  if (documentNumber !== null && documentNumber.length > DOCUMENT_NUMBER_MAX) return { errorKey: 'warehouseDocs.edit.error.number' };
  const issueDate = blankToNull(form.issueDate);
  const expiryDate = blankToNull(form.expiryDate);
  if ((issueDate !== null && !isCalendarDate(issueDate)) || (expiryDate !== null && !isCalendarDate(expiryDate))) {
    return { errorKey: 'warehouseDocs.edit.error.date' };
  }
  if (issueDate !== null && expiryDate !== null && expiryDate < issueDate) {
    return { errorKey: 'warehouseDocs.edit.error.expiryBeforeIssue' };
  }
  if (!isDocumentType(form.docType)) return { errorKey: 'warehouseDocs.edit.error.type' };

  const body: UpdateWarehouseDocumentBody = {};
  if (form.docType !== original.docType) body.docType = form.docType;
  if (title !== original.title) body.title = title;
  if (documentNumber !== original.documentNumber) body.documentNumber = documentNumber;
  if (issueDate !== (original.issueDate ?? null)) body.issueDate = issueDate;
  if (expiryDate !== (original.expiryDate ?? null)) body.expiryDate = expiryDate;
  if (Object.keys(body).length === 0) return { errorKey: 'warehouseDocs.edit.error.noChanges' };
  return { body };
}
