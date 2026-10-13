/**
 * BR-105: SQL for warehouse documents. Every function takes an `Executor` so the service can join its
 * transaction; no authorization decision lives here (the service has already established that the
 * caller may reach the warehouse). Rows are mapped here, so snake_case never escapes this file.
 *
 * Dates leave as `::text` (YYYY-MM-DD): a `date` parsed into a JS Date would be shifted by the
 * server's time zone and could land on the previous day.
 */
import type { Executor } from '../../db/pool.js';
import type { ListWarehouseDocumentsQuery, WarehouseDocument, WarehouseDocumentType } from './warehouse-documents.schema.js';

/** A stored document; the status is derived by the service, never stored. */
export type WarehouseDocumentRecord = Omit<WarehouseDocument, 'status'>;

export interface ListDocumentsFilter extends ListWarehouseDocumentsQuery {
  /** The Asia/Kolkata calendar day the statuses are derived against (YYYY-MM-DD). */
  today: string;
  /** The EXPIRING_SOON window in days. */
  windowDays: number;
}

export interface InsertDocumentValues {
  warehouseId: string;
  docType: WarehouseDocumentType;
  title: string;
  documentNumber: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  uploadId: string;
  uploadedBy: string;
}

export interface DocumentPatch {
  docType?: WarehouseDocumentType;
  title?: string;
  documentNumber?: string | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  uploadId?: string;
  /** Set together with `uploadId`: whoever attaches the new file becomes its uploader. */
  uploadedBy?: string;
}

export interface DocumentFile {
  storageKey: string;
  mimeType: string;
}

interface Row {
  id: string;
  warehouse_id: string;
  doc_type: WarehouseDocumentType;
  title: string;
  document_number: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  upload_id: string;
  uploaded_by: string;
  archived_at: Date | null;
  archived_by: string | null;
  created_at: Date;
  updated_at: Date | null;
}

const COLUMNS = `
  id, warehouse_id, doc_type, title, document_number, issue_date::text AS issue_date,
  expiry_date::text AS expiry_date, upload_id, uploaded_by, archived_at, archived_by, created_at, updated_at
`;

function toRecord(row: Row): WarehouseDocumentRecord {
  return {
    id: row.id,
    warehouseId: row.warehouse_id,
    docType: row.doc_type,
    title: row.title,
    documentNumber: row.document_number,
    issueDate: row.issue_date,
    expiryDate: row.expiry_date,
    uploadId: row.upload_id,
    uploadedBy: row.uploaded_by,
    archivedAt: row.archived_at === null ? null : row.archived_at.toISOString(),
    archivedBy: row.archived_by,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at === null ? null : row.updated_at.toISOString(),
  };
}

/**
 * The SQL twin of `deriveDocumentStatus` (warehouse-documents.schema.ts). `today` and `window` are
 * bind parameters supplied by the service, so the filter and the status in the response are derived
 * from the very same day and window (a DB clock and an app clock could disagree around midnight).
 */
const statusSql = (today: string, window: string): string => `
  CASE
    WHEN archived_at IS NOT NULL THEN 'ARCHIVED'
    WHEN expiry_date IS NULL THEN 'ACTIVE'
    WHEN expiry_date < ${today}::date THEN 'EXPIRED'
    WHEN expiry_date <= ${today}::date + ${window}::int THEN 'EXPIRING_SOON'
    ELSE 'ACTIVE'
  END`;

/** `q` is matched literally: `%`, `_` and `\` in the search text are not wildcards. */
const likeEscape = (term: string): string => term.replace(/[\\%_]/g, (c) => `\\${c}`);

export interface WarehouseDocumentsRepo {
  /** `system_config.warehouse_document_expiry_warning_days`, or null when missing or not a non-negative integer. */
  readExpiryWarningDays(db: Executor): Promise<number | null>;
  list(db: Executor, warehouseId: string, filter: ListDocumentsFilter): Promise<{ items: WarehouseDocumentRecord[]; total: number }>;
  findById(db: Executor, warehouseId: string, id: string): Promise<WarehouseDocumentRecord | null>;
  /** Row-locks the document (the before image of a change). */
  lockById(db: Executor, warehouseId: string, id: string): Promise<WarehouseDocumentRecord | null>;
  /** undefined: no live upload with that id; null: a live upload with no recorded uploader; else the uploader. */
  findUploadOwner(db: Executor, uploadId: string): Promise<string | null | undefined>;
  /** The storage key and MIME type of a live (non-deleted) upload, else null. */
  findLiveFile(db: Executor, uploadId: string): Promise<DocumentFile | null>;
  /** Throws the raw pg unique violation (23505, `uq_warehouse_documents_upload`) when the file backs a live document. */
  insert(db: Executor, values: InsertDocumentValues): Promise<WarehouseDocumentRecord>;
  /** Same 23505 as `insert` when a replacement file already backs another live document. */
  update(db: Executor, id: string, patch: DocumentPatch): Promise<WarehouseDocumentRecord>;
  archive(db: Executor, id: string, userId: string): Promise<WarehouseDocumentRecord>;
}

export const warehouseDocumentsRepo: WarehouseDocumentsRepo = {
  async readExpiryWarningDays(db) {
    const res = await db.query<{ value: unknown }>(
      `SELECT value FROM system_config WHERE key = 'warehouse_document_expiry_warning_days' LIMIT 1`,
    );
    const value = res.rows[0]?.value;
    const parsed =
      typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : Number.NaN;
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
  },

  async list(db, warehouseId, filter) {
    const params: unknown[] = [warehouseId];
    const conditions = ['warehouse_id = $1'];
    if (filter.status === 'ARCHIVED') {
      conditions.push('archived_at IS NOT NULL');
    } else {
      conditions.push('archived_at IS NULL');
      if (filter.status !== undefined) {
        params.push(filter.today, filter.windowDays, filter.status);
        const n = params.length;
        conditions.push(`(${statusSql(`$${n - 2}`, `$${n - 1}`)}) = $${n}`);
      }
    }
    if (filter.docType !== undefined) {
      params.push(filter.docType);
      conditions.push(`doc_type = $${params.length}`);
    }
    if (filter.q !== undefined) {
      params.push(`%${likeEscape(filter.q)}%`);
      const at = `$${params.length}`;
      conditions.push(`(title ILIKE ${at} ESCAPE '\\' OR document_number ILIKE ${at} ESCAPE '\\')`);
    }
    const where = conditions.join(' AND ');

    const count = await db.query<{ total: string }>(`SELECT count(*)::text AS total FROM warehouse_documents WHERE ${where}`, params);
    const rows = await db.query<Row>(
      `SELECT ${COLUMNS} FROM warehouse_documents
        WHERE ${where}
        ORDER BY expiry_date ASC NULLS LAST, lower(title), id
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, filter.pageSize, (filter.page - 1) * filter.pageSize],
    );
    return { items: rows.rows.map(toRecord), total: Number(count.rows[0]?.total ?? '0') };
  },

  async findById(db, warehouseId, id) {
    const result = await db.query<Row>(`SELECT ${COLUMNS} FROM warehouse_documents WHERE id = $1 AND warehouse_id = $2`, [id, warehouseId]);
    const row = result.rows[0];
    return row === undefined ? null : toRecord(row);
  },

  async lockById(db, warehouseId, id) {
    const result = await db.query<Row>(
      `SELECT ${COLUMNS} FROM warehouse_documents WHERE id = $1 AND warehouse_id = $2 FOR UPDATE`,
      [id, warehouseId],
    );
    const row = result.rows[0];
    return row === undefined ? null : toRecord(row);
  },

  async findUploadOwner(db, uploadId) {
    const result = await db.query<{ uploaded_by: string | null }>(
      `SELECT uploaded_by FROM uploads WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
      [uploadId],
    );
    if (result.rows.length === 0) return undefined;
    return result.rows[0]?.uploaded_by ?? null;
  },

  async findLiveFile(db, uploadId) {
    const result = await db.query<{ storage_key: string; mime_type: string }>(
      `SELECT storage_key, mime_type FROM uploads WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
      [uploadId],
    );
    const row = result.rows[0];
    return row === undefined ? null : { storageKey: row.storage_key, mimeType: row.mime_type };
  },

  async insert(db, values) {
    const result = await db.query<Row>(
      `INSERT INTO warehouse_documents
         (warehouse_id, doc_type, title, document_number, issue_date, expiry_date, upload_id, uploaded_by)
       VALUES ($1, $2, $3, $4, $5::date, $6::date, $7, $8)
       RETURNING ${COLUMNS}`,
      [
        values.warehouseId,
        values.docType,
        values.title,
        values.documentNumber,
        values.issueDate,
        values.expiryDate,
        values.uploadId,
        values.uploadedBy,
      ],
    );
    return toRecord(result.rows[0]!);
  },

  async update(db, id, patch) {
    const sets: string[] = ['updated_at = now()'];
    const params: unknown[] = [id];
    const set = (column: string, value: unknown, cast = ''): void => {
      params.push(value);
      sets.push(`${column} = $${params.length}${cast}`);
    };
    if (patch.docType !== undefined) set('doc_type', patch.docType);
    if (patch.title !== undefined) set('title', patch.title);
    if (patch.documentNumber !== undefined) set('document_number', patch.documentNumber);
    if (patch.issueDate !== undefined) set('issue_date', patch.issueDate, '::date');
    if (patch.expiryDate !== undefined) set('expiry_date', patch.expiryDate, '::date');
    if (patch.uploadId !== undefined) set('upload_id', patch.uploadId, '::uuid');
    if (patch.uploadedBy !== undefined) set('uploaded_by', patch.uploadedBy, '::uuid');

    const result = await db.query<Row>(
      `UPDATE warehouse_documents SET ${sets.join(', ')} WHERE id = $1 RETURNING ${COLUMNS}`,
      params,
    );
    return toRecord(result.rows[0]!);
  },

  async archive(db, id, userId) {
    const result = await db.query<Row>(
      `UPDATE warehouse_documents SET archived_at = now(), archived_by = $2, updated_at = now()
        WHERE id = $1 AND archived_at IS NULL
        RETURNING ${COLUMNS}`,
      [id, userId],
    );
    return toRecord(result.rows[0]!);
  },
};
