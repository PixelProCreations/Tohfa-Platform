/**
 * BR-105: warehouse documents (licences, FSSAI, fire safety, lease, insurance ...).
 *
 * All business logic lives here; the service takes a `ResolvedScope`, never a Request.
 *  - Scope first: another or an unknown warehouse is the same 404 (BR-30); the document is then looked
 *    up INSIDE that warehouse, so a document id under the wrong warehouse is 404 as well.
 *  - The file is an uploads row the CALLER uploaded and that is not deleted. Unknown, deleted and
 *    someone else's upload all get the same 422 so the response never confirms that an id exists or
 *    whose it is. One upload backs at most one live document (the partial unique index; 409).
 *  - The status is derived at read time from the Asia/Kolkata day of the injected clock and the
 *    configured warning window; the list hands the same day and window to SQL for its filter.
 *  - Every change writes one audit row in the same transaction. The image is masked on purpose: doc
 *    type, dates, upload id and the archived flag, never the free-text title or document number
 *    (BR-35); the changed field names still say that they were edited. A no-op audits nothing.
 *  - Archive, never delete: there is no delete and no un-archive.
 */
import type { Executor } from '../../db/pool.js';
import { pool, withTransaction } from '../../db/pool.js';
import { writeAuditLog } from '../../audit/auditLog.js';
import { AppError } from '../../http/problem.js';
import { logger } from '../../logger.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { defaultBlobStorage, type BlobStorage } from '../../storage/blobStorage.js';
import { requireReachableWarehouse } from './scope.js';
import {
  warehouseDocumentsRepo,
  type DocumentPatch,
  type WarehouseDocumentRecord,
  type WarehouseDocumentsRepo,
} from './warehouse-documents.repo.js';
import {
  deriveDocumentStatus,
  expiryBeforeIssue,
  expiryBeforeIssueMessage,
  istDate,
  type CreateWarehouseDocumentBody,
  type ListWarehouseDocumentsQuery,
  type ListWarehouseDocumentsResponse,
  type UpdateWarehouseDocumentBody,
  type WarehouseDocument,
  type WarehouseDocumentDetail,
} from './warehouse-documents.schema.js';

/**
 * BR-105.3: the documented fallback when `system_config.warehouse_document_expiry_warning_days` is
 * missing or not a non-negative integer. The configured value always wins while it is usable.
 */
export const DEFAULT_DOCUMENT_EXPIRY_WARNING_DAYS = 30;

/** BR-105.2: a signed read URL for a document's file lives this long (same TTL as farmer documents). */
const READ_URL_TTL_MINUTES = 15;

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export interface WarehouseDocumentsServiceDeps {
  repo: WarehouseDocumentsRepo;
  db: Executor;
  runTx: TransactionRunner;
  storage: BlobStorage;
  /** Injectable clock so "today" is deterministic in tests. */
  now: () => Date;
  /** Warning sink for the window fallback. */
  log: (message: string, context: Record<string, unknown>) => void;
}

export interface WarehouseDocumentsService {
  list(scope: ResolvedScope, warehouseId: string, query: ListWarehouseDocumentsQuery): Promise<ListWarehouseDocumentsResponse>;
  get(scope: ResolvedScope, warehouseId: string, id: string): Promise<WarehouseDocumentDetail>;
  create(scope: ResolvedScope, warehouseId: string, body: CreateWarehouseDocumentBody): Promise<WarehouseDocument>;
  update(scope: ResolvedScope, warehouseId: string, id: string, patch: UpdateWarehouseDocumentBody): Promise<WarehouseDocument>;
  archive(scope: ResolvedScope, warehouseId: string, id: string): Promise<WarehouseDocument>;
}

/** The masked audit image: never the title or the document number. */
function image(document: WarehouseDocumentRecord): Record<string, unknown> {
  return {
    docType: document.docType,
    issueDate: document.issueDate,
    expiryDate: document.expiryDate,
    uploadId: document.uploadId,
    archived: document.archivedAt !== null,
  };
}

function documentNotFound(id: string): AppError {
  return new AppError('NOT_FOUND', { detail: `No document with id ${id} in this warehouse.` });
}

/** One message for unknown, deleted and foreign uploads, so the response leaks nothing about the id. */
function unusableUpload(): AppError {
  return new AppError('VALIDATION_FAILED', {
    detail: 'The uploaded file cannot be used for this document.',
    errors: { 'body.uploadId': ['Must be a file you uploaded that has not been deleted.'] },
  });
}

function expiryBeforeIssueError(): AppError {
  return new AppError('VALIDATION_FAILED', {
    detail: expiryBeforeIssueMessage,
    errors: { 'body.expiryDate': [expiryBeforeIssueMessage] },
  });
}

function uploadInUse(): AppError {
  return new AppError('CONFLICT', {
    detail: 'This file already backs another live document.',
    errors: { 'body.uploadId': ['Already attached to a live document.'] },
  });
}

function isUploadTaken(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === '23505' &&
    (error as { constraint?: unknown }).constraint === 'uq_warehouse_documents_upload'
  );
}

/** The fields of a patch that would really change, as a repo patch plus their names. */
function diff(current: WarehouseDocumentRecord, patch: UpdateWarehouseDocumentBody): { changes: DocumentPatch; names: string[] } {
  const changes: DocumentPatch = {};
  const names: string[] = [];
  if (patch.docType !== undefined && patch.docType !== current.docType) {
    changes.docType = patch.docType;
    names.push('docType');
  }
  if (patch.title !== undefined && patch.title !== current.title) {
    changes.title = patch.title;
    names.push('title');
  }
  if (patch.documentNumber !== undefined && patch.documentNumber !== current.documentNumber) {
    changes.documentNumber = patch.documentNumber;
    names.push('documentNumber');
  }
  if (patch.issueDate !== undefined && patch.issueDate !== current.issueDate) {
    changes.issueDate = patch.issueDate;
    names.push('issueDate');
  }
  if (patch.expiryDate !== undefined && patch.expiryDate !== current.expiryDate) {
    changes.expiryDate = patch.expiryDate;
    names.push('expiryDate');
  }
  if (patch.uploadId !== undefined && patch.uploadId !== current.uploadId) {
    changes.uploadId = patch.uploadId;
    names.push('uploadId');
  }
  return { changes, names };
}

export function createWarehouseDocumentsService(deps: Partial<WarehouseDocumentsServiceDeps> = {}): WarehouseDocumentsService {
  const repo = deps.repo ?? warehouseDocumentsRepo;
  const db = deps.db ?? pool;
  const runTx: TransactionRunner = deps.runTx ?? ((fn) => withTransaction(fn));
  const storage = deps.storage ?? defaultBlobStorage;
  const now = deps.now ?? (() => new Date());
  const log = deps.log ?? ((message, context) => logger.warn(context, message));

  async function windowDays(executor: Executor): Promise<number> {
    const configured = await repo.readExpiryWarningDays(executor);
    if (configured !== null) return configured;
    log('system_config.warehouse_document_expiry_warning_days is missing or invalid; using the documented default', {
      fallback: DEFAULT_DOCUMENT_EXPIRY_WARNING_DAYS,
    });
    return DEFAULT_DOCUMENT_EXPIRY_WARNING_DAYS;
  }

  async function withStatus(executor: Executor, record: WarehouseDocumentRecord): Promise<WarehouseDocument> {
    return { ...record, status: deriveDocumentStatus(record, istDate(now()), await windowDays(executor)) };
  }

  async function assertOwnUpload(executor: Executor, scope: ResolvedScope, uploadId: string): Promise<void> {
    const owner = await repo.findUploadOwner(executor, uploadId);
    if (owner === undefined || owner === null || owner !== scope.userId) throw unusableUpload();
  }

  async function translateUploadTaken<T>(write: () => Promise<T>): Promise<T> {
    try {
      return await write();
    } catch (error) {
      if (isUploadTaken(error)) throw uploadInUse();
      throw error;
    }
  }

  async function lockLive(tx: Executor, warehouseId: string, id: string): Promise<WarehouseDocumentRecord> {
    const current = await repo.lockById(tx, warehouseId, id);
    if (current === null) throw documentNotFound(id);
    return current;
  }

  return {
    async list(scope, warehouseId, query) {
      await requireReachableWarehouse(db, scope, warehouseId);
      const today = istDate(now());
      const days = await windowDays(db);
      const { items, total } = await repo.list(db, warehouseId, { ...query, today, windowDays: days });
      return {
        items: items.map((record) => ({ ...record, status: deriveDocumentStatus(record, today, days) })),
        page: query.page,
        pageSize: query.pageSize,
        total,
        expiryWarningDays: days,
      };
    },

    async get(scope, warehouseId, id) {
      await requireReachableWarehouse(db, scope, warehouseId);
      const record = await repo.findById(db, warehouseId, id);
      if (record === null) throw documentNotFound(id);
      const file = await repo.findLiveFile(db, record.uploadId);
      return {
        ...(await withStatus(db, record)),
        fileUrl: file === null ? null : await storage.generateReadUrl(file.storageKey, READ_URL_TTL_MINUTES),
        mimeType: file?.mimeType ?? null,
      };
    },

    async create(scope, warehouseId, body) {
      return runTx(async (tx) => {
        await requireReachableWarehouse(tx, scope, warehouseId);
        await assertOwnUpload(tx, scope, body.uploadId);
        const created = await translateUploadTaken(() =>
          repo.insert(tx, {
            warehouseId,
            docType: body.docType,
            title: body.title,
            documentNumber: body.documentNumber ?? null,
            issueDate: body.issueDate ?? null,
            expiryDate: body.expiryDate ?? null,
            uploadId: body.uploadId,
            uploadedBy: scope.userId,
          }),
        );
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'warehouse.document.create',
          entityType: 'warehouse_document',
          entityId: created.id,
          warehouseId,
          after: image(created),
        });
        return withStatus(tx, created);
      });
    },

    async update(scope, warehouseId, id, patch) {
      return runTx(async (tx) => {
        await requireReachableWarehouse(tx, scope, warehouseId);
        const current = await lockLive(tx, warehouseId, id);
        if (current.archivedAt !== null) {
          throw new AppError('INVALID_STATE_TRANSITION', { detail: 'An archived document cannot be edited.' });
        }

        // The body was checked alone; the stored row may hold the other date of the pair.
        const issueDate = patch.issueDate !== undefined ? patch.issueDate : current.issueDate;
        const expiryDate = patch.expiryDate !== undefined ? patch.expiryDate : current.expiryDate;
        if (expiryBeforeIssue(issueDate, expiryDate)) throw expiryBeforeIssueError();

        const { changes, names } = diff(current, patch);
        if (names.length === 0) return withStatus(tx, current);

        if (changes.uploadId !== undefined) {
          await assertOwnUpload(tx, scope, changes.uploadId);
          // A renewal's file was uploaded by the caller, so the caller becomes the uploader of record.
          changes.uploadedBy = scope.userId;
        }

        const updated = await translateUploadTaken(() => repo.update(tx, id, changes));
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'warehouse.document.update',
          entityType: 'warehouse_document',
          entityId: id,
          warehouseId,
          before: image(current),
          after: image(updated),
          changedFields: names,
        });
        return withStatus(tx, updated);
      });
    },

    async archive(scope, warehouseId, id) {
      return runTx(async (tx) => {
        await requireReachableWarehouse(tx, scope, warehouseId);
        const current = await lockLive(tx, warehouseId, id);
        // Archive is once: a repeat changes nothing and therefore writes and audits nothing.
        if (current.archivedAt !== null) return withStatus(tx, current);

        const archived = await repo.archive(tx, id, scope.userId);
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'warehouse.document.archive',
          entityType: 'warehouse_document',
          entityId: id,
          warehouseId,
          before: image(current),
          after: image(archived),
          changedFields: ['archived'],
        });
        return withStatus(tx, archived);
      });
    },
  };
}

export const warehouseDocumentsService: WarehouseDocumentsService = createWarehouseDocumentsService();
