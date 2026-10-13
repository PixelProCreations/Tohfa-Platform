/**
 * BR-103: SQL for warehouse operational issues. Every function takes an `Executor` so the service can
 * join its transaction; no authorization decision lives here (the service has already established that
 * the caller may reach the warehouse). Rows are mapped here, so snake_case never escapes this file.
 *
 * `created_at` is stamped with clock_timestamp() rather than the column default now(): two issues or
 * two comments written in one transaction (a script, a test) would otherwise share a timestamp and the
 * "newest first" / "oldest first" orders would fall back to the random uuid tie-break.
 */
import type { Executor } from '../../db/pool.js';
import type {
  CreateWarehouseIssueBody,
  IssueCategory,
  IssueSeverity,
  IssueStatus,
  ListWarehouseIssuesQuery,
  WarehouseIssue,
  WarehouseIssueComment,
} from './warehouse-issues.schema.js';

interface Row {
  id: string;
  issue_number: string;
  warehouse_id: string;
  category: IssueCategory;
  severity: IssueSeverity;
  title: string;
  description: string | null;
  status: IssueStatus;
  reported_by: string;
  assigned_to: string | null;
  resolution_note: string | null;
  resolved_by: string | null;
  resolved_at: Date | null;
  closed_at: Date | null;
  created_at: Date;
  updated_at: Date | null;
}

interface CommentRow {
  id: string;
  author_id: string;
  body: string;
  created_at: Date;
}

const COLUMNS = `
  id, issue_number, warehouse_id, category, severity, title, description, status, reported_by,
  assigned_to, resolution_note, resolved_by, resolved_at, closed_at, created_at, updated_at
`;

const iso = (value: Date | null): string | null => (value === null ? null : value.toISOString());

function toIssue(row: Row): WarehouseIssue {
  return {
    id: row.id,
    issueNumber: row.issue_number,
    warehouseId: row.warehouse_id,
    category: row.category,
    severity: row.severity,
    title: row.title,
    description: row.description,
    status: row.status,
    reportedBy: row.reported_by,
    assignedTo: row.assigned_to,
    resolutionNote: row.resolution_note,
    resolvedBy: row.resolved_by,
    resolvedAt: iso(row.resolved_at),
    closedAt: iso(row.closed_at),
    createdAt: row.created_at.toISOString(),
    updatedAt: iso(row.updated_at),
  };
}

function toComment(row: CommentRow): WarehouseIssueComment {
  return { id: row.id, authorId: row.author_id, body: row.body, createdAt: row.created_at.toISOString() };
}

/** Escapes LIKE wildcards so a search for "100%" or "a_b" matches those characters literally. */
function likePattern(value: string): string {
  return `%${value.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

/**
 * The columns a PATCH resolves to. The service decides every value; the repo only writes it.
 *  - `resolvedBy`: a user id sets resolved_by and resolved_at = now(); `null` clears both (reopen).
 *  - `close`: sets closed_at = now().
 */
export interface IssueUpdate {
  category?: IssueCategory;
  severity?: IssueSeverity;
  title?: string;
  description?: string | null;
  assignedTo?: string | null;
  status?: IssueStatus;
  resolutionNote?: string | null;
  resolvedBy?: string | null;
  close?: true;
}

export interface WarehouseIssuesRepo {
  list(db: Executor, warehouseId: string, query: ListWarehouseIssuesQuery): Promise<{ items: WarehouseIssue[]; total: number }>;
  findById(db: Executor, warehouseId: string, id: string): Promise<WarehouseIssue | null>;
  /** Row-locks the issue: the before image of an update, and serialises a comment against a close. */
  lockById(db: Executor, warehouseId: string, id: string): Promise<WarehouseIssue | null>;
  /** Oldest first. */
  listComments(db: Executor, issueId: string): Promise<WarehouseIssueComment[]>;
  insert(db: Executor, input: { warehouseId: string; reportedBy: string; body: CreateWarehouseIssueBody }): Promise<WarehouseIssue>;
  update(db: Executor, id: string, changes: IssueUpdate): Promise<WarehouseIssue>;
  insertComment(db: Executor, input: { issueId: string; authorId: string; body: string }): Promise<WarehouseIssueComment>;
  /**
   * BR-103 rule 4: an active, non-deleted user with a LIVE assignment that reaches this warehouse:
   * Super/Tohfa/Main anywhere, or a Sub admin of exactly this warehouse. "Live" is the same window the
   * login path uses (started, and not ended).
   */
  isEligibleAssignee(db: Executor, userId: string, warehouseId: string): Promise<boolean>;
}

export const warehouseIssuesRepo: WarehouseIssuesRepo = {
  async list(db, warehouseId, query) {
    const params: unknown[] = [warehouseId];
    const conditions = ['warehouse_id = $1'];
    const add = (sql: (at: string) => string, value: unknown): void => {
      params.push(value);
      conditions.push(sql(`$${params.length}`));
    };
    if (query.status !== undefined) add((at) => `status = ${at}`, query.status);
    if (query.severity !== undefined) add((at) => `severity = ${at}`, query.severity);
    if (query.category !== undefined) add((at) => `category = ${at}`, query.category);
    if (query.assignedTo !== undefined) add((at) => `assigned_to = ${at}`, query.assignedTo);
    if (query.q !== undefined) {
      add((at) => `(title ILIKE ${at} ESCAPE '\\' OR issue_number ILIKE ${at} ESCAPE '\\')`, likePattern(query.q));
    }
    const where = conditions.join(' AND ');

    const count = await db.query<{ total: string }>(`SELECT count(*)::text AS total FROM warehouse_issues WHERE ${where}`, params);
    const rows = await db.query<Row>(
      `SELECT ${COLUMNS} FROM warehouse_issues WHERE ${where}
        ORDER BY created_at DESC, id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, query.pageSize, (query.page - 1) * query.pageSize],
    );
    return { items: rows.rows.map(toIssue), total: Number(count.rows[0]?.total ?? '0') };
  },

  async findById(db, warehouseId, id) {
    const result = await db.query<Row>(`SELECT ${COLUMNS} FROM warehouse_issues WHERE id = $1 AND warehouse_id = $2`, [id, warehouseId]);
    const row = result.rows[0];
    return row === undefined ? null : toIssue(row);
  },

  async lockById(db, warehouseId, id) {
    const result = await db.query<Row>(
      `SELECT ${COLUMNS} FROM warehouse_issues WHERE id = $1 AND warehouse_id = $2 FOR UPDATE`,
      [id, warehouseId],
    );
    const row = result.rows[0];
    return row === undefined ? null : toIssue(row);
  },

  async listComments(db, issueId) {
    const result = await db.query<CommentRow>(
      `SELECT id, author_id, body, created_at FROM warehouse_issue_comments WHERE issue_id = $1 ORDER BY created_at, id`,
      [issueId],
    );
    return result.rows.map(toComment);
  },

  async insert(db, { warehouseId, reportedBy, body }) {
    const result = await db.query<Row>(
      `INSERT INTO warehouse_issues
         (issue_number, warehouse_id, category, severity, title, description, reported_by, assigned_to, created_at)
       VALUES ('WI-' || lpad(nextval('warehouse_issue_number_seq')::text, 6, '0'), $1, $2, $3, $4, $5, $6, $7, clock_timestamp())
       RETURNING ${COLUMNS}`,
      [warehouseId, body.category, body.severity, body.title, body.description ?? null, reportedBy, body.assignedTo ?? null],
    );
    return toIssue(result.rows[0]!);
  },

  async update(db, id, changes) {
    const sets: string[] = ['updated_at = now()'];
    const params: unknown[] = [id];
    const set = (column: string, value: unknown): void => {
      params.push(value);
      sets.push(`${column} = $${params.length}`);
    };
    if (changes.category !== undefined) set('category', changes.category);
    if (changes.severity !== undefined) set('severity', changes.severity);
    if (changes.title !== undefined) set('title', changes.title);
    if (changes.description !== undefined) set('description', changes.description);
    if (changes.assignedTo !== undefined) set('assigned_to', changes.assignedTo);
    if (changes.status !== undefined) set('status', changes.status);
    if (changes.resolutionNote !== undefined) set('resolution_note', changes.resolutionNote);
    if (changes.resolvedBy !== undefined) {
      set('resolved_by', changes.resolvedBy);
      sets.push(changes.resolvedBy === null ? 'resolved_at = NULL' : 'resolved_at = now()');
    }
    if (changes.close === true) sets.push('closed_at = now()');

    const result = await db.query<Row>(`UPDATE warehouse_issues SET ${sets.join(', ')} WHERE id = $1 RETURNING ${COLUMNS}`, params);
    return toIssue(result.rows[0]!);
  },

  async insertComment(db, { issueId, authorId, body }) {
    const result = await db.query<CommentRow>(
      `INSERT INTO warehouse_issue_comments (issue_id, author_id, body, created_at)
       VALUES ($1, $2, $3, clock_timestamp())
       RETURNING id, author_id, body, created_at`,
      [issueId, authorId, body],
    );
    return toComment(result.rows[0]!);
  },

  async isEligibleAssignee(db, userId, warehouseId) {
    const result = await db.query<{ eligible: boolean }>(
      `SELECT EXISTS (
         SELECT 1
           FROM users u
           JOIN user_roles ur ON ur.user_id = u.id
          WHERE u.id = $1
            AND u.deleted_at IS NULL
            AND u.status = 'ACTIVE'
            AND ur.valid_from <= now()
            AND (ur.valid_to IS NULL OR ur.valid_to > now())
            AND (ur.role_code IN ('SUPER_ADMIN', 'TOHFA_ADMIN', 'MAIN_WH_ADMIN')
                 OR (ur.role_code = 'SUB_WH_ADMIN' AND ur.warehouse_id = $2))
       ) AS eligible`,
      [userId, warehouseId],
    );
    return result.rows[0]?.eligible === true;
  },
};
