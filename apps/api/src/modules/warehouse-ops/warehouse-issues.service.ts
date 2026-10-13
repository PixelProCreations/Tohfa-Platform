/**
 * BR-103: warehouse operational issues.
 *
 * All business logic lives here; the service takes a `ResolvedScope`, never a Request.
 *  - Scope first: another warehouse and an unknown warehouse are the same 404 (BR-30), then the issue
 *    is looked up INSIDE that warehouse, so an issue id under the wrong warehouse is 404 too.
 *  - Status moves only along LEGAL_TRANSITIONS. Every rejection (409 / 422) is decided before the first
 *    write, so a refused change writes nothing and audits nothing.
 *  - Every change writes one audit row in the same transaction. The image is masked on purpose: issue
 *    number, category, severity, status and assignee id only. Title, description, resolution note and
 *    comment bodies are free text that can carry names and phone numbers, so they never reach
 *    audit_log; `changedFields` still names them so the trail shows that they were edited.
 *  - A change that alters nothing writes nothing and audits nothing. Nothing is ever deleted.
 */
import type { Executor } from '../../db/pool.js';
import { pool, withTransaction } from '../../db/pool.js';
import { writeAuditLog } from '../../audit/auditLog.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { requireReachableWarehouse } from './scope.js';
import { warehouseIssuesRepo, type IssueUpdate, type WarehouseIssuesRepo } from './warehouse-issues.repo.js';
import type {
  CreateWarehouseIssueBody,
  CreateWarehouseIssueCommentBody,
  IssueStatus,
  ListWarehouseIssuesQuery,
  ListWarehouseIssuesResponse,
  UpdateWarehouseIssueBody,
  WarehouseIssue,
  WarehouseIssueComment,
  WarehouseIssueDetail,
} from './warehouse-issues.schema.js';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

/** BR-103 rule 3. CLOSED is terminal. */
export const LEGAL_TRANSITIONS: Readonly<Record<IssueStatus, readonly IssueStatus[]>> = {
  OPEN: ['IN_PROGRESS', 'RESOLVED'],
  IN_PROGRESS: ['OPEN', 'RESOLVED'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: [],
};

export interface WarehouseIssuesServiceDeps {
  repo: WarehouseIssuesRepo;
  db: Executor;
  runTx: TransactionRunner;
}

export interface WarehouseIssuesService {
  list(scope: ResolvedScope, warehouseId: string, query: ListWarehouseIssuesQuery): Promise<ListWarehouseIssuesResponse>;
  get(scope: ResolvedScope, warehouseId: string, issueId: string): Promise<WarehouseIssueDetail>;
  create(scope: ResolvedScope, warehouseId: string, body: CreateWarehouseIssueBody): Promise<WarehouseIssue>;
  update(scope: ResolvedScope, warehouseId: string, issueId: string, patch: UpdateWarehouseIssueBody): Promise<WarehouseIssue>;
  addComment(
    scope: ResolvedScope,
    warehouseId: string,
    issueId: string,
    body: CreateWarehouseIssueCommentBody,
  ): Promise<WarehouseIssueComment>;
}

/** The masked audit image: no free text (title, description, resolution note). */
function image(issue: WarehouseIssue): Record<string, unknown> {
  return {
    issueNumber: issue.issueNumber,
    category: issue.category,
    severity: issue.severity,
    status: issue.status,
    assignedTo: issue.assignedTo,
  };
}

function issueNotFound(issueId: string): AppError {
  return new AppError('NOT_FOUND', { detail: `No issue with id ${issueId} in this warehouse.` });
}

function closedIssue(): AppError {
  return new AppError('INVALID_STATE_TRANSITION', { detail: 'A CLOSED issue is terminal: it cannot be changed or commented on.' });
}

function invalidField(field: string, message: string): AppError {
  return new AppError('VALIDATION_FAILED', { detail: message, errors: { [`body.${field}`]: [message] } });
}

export function createWarehouseIssuesService(deps: Partial<WarehouseIssuesServiceDeps> = {}): WarehouseIssuesService {
  const repo = deps.repo ?? warehouseIssuesRepo;
  const db = deps.db ?? pool;
  const runTx: TransactionRunner = deps.runTx ?? ((fn) => withTransaction(fn));

  async function requireAssignable(tx: Executor, userId: string, warehouseId: string): Promise<void> {
    if (!(await repo.isEligibleAssignee(tx, userId, warehouseId))) {
      // One message for "unknown", "not an admin" and "cannot reach this warehouse": the caller learns
      // only that this id is not assignable here, not which of the three it is.
      throw invalidField(
        'assignedTo',
        'The assignee must be an active admin with a live assignment that reaches this warehouse.',
      );
    }
  }

  return {
    async list(scope, warehouseId, query) {
      await requireReachableWarehouse(db, scope, warehouseId);
      const { items, total } = await repo.list(db, warehouseId, query);
      return { items, page: query.page, pageSize: query.pageSize, total };
    },

    async get(scope, warehouseId, issueId) {
      await requireReachableWarehouse(db, scope, warehouseId);
      const issue = await repo.findById(db, warehouseId, issueId);
      if (issue === null) throw issueNotFound(issueId);
      const comments = await repo.listComments(db, issueId);
      return { ...issue, comments };
    },

    async create(scope, warehouseId, body) {
      return runTx(async (tx) => {
        await requireReachableWarehouse(tx, scope, warehouseId);
        if (body.assignedTo !== undefined && body.assignedTo !== null) await requireAssignable(tx, body.assignedTo, warehouseId);
        const created = await repo.insert(tx, { warehouseId, reportedBy: scope.userId, body });
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'warehouse.issue.create',
          entityType: 'warehouse_issue',
          entityId: created.id,
          warehouseId,
          after: image(created),
        });
        return created;
      });
    },

    async update(scope, warehouseId, issueId, patch) {
      return runTx(async (tx) => {
        await requireReachableWarehouse(tx, scope, warehouseId);
        const current = await repo.lockById(tx, warehouseId, issueId);
        if (current === null) throw issueNotFound(issueId);
        // CLOSED is terminal for every field, not only the status: a closed record stays as it was closed.
        if (current.status === 'CLOSED') throw closedIssue();

        const target = patch.status ?? current.status;
        const moving = target !== current.status;
        if (moving && !LEGAL_TRANSITIONS[current.status].includes(target)) {
          throw new AppError('INVALID_STATE_TRANSITION', {
            detail: `An issue cannot move from ${current.status} to ${target}.`,
          });
        }
        // A move to RESOLVED must say how in THIS request (a reopened issue has had its note cleared).
        if (moving && target === 'RESOLVED' && patch.resolutionNote === undefined) {
          throw invalidField('resolutionNote', 'A resolutionNote is required to resolve an issue.');
        }
        // A note only belongs to a resolved issue; accepting one elsewhere would leave an OPEN issue
        // carrying a "resolution", or a reopen that silently keeps the old one.
        if (patch.resolutionNote !== undefined && target !== 'RESOLVED') {
          throw invalidField('resolutionNote', 'A resolutionNote can only be set when the issue is, or is being, RESOLVED.');
        }

        const changes: IssueUpdate = {};
        const changed: string[] = [];
        if (patch.category !== undefined && patch.category !== current.category) {
          changes.category = patch.category;
          changed.push('category');
        }
        if (patch.severity !== undefined && patch.severity !== current.severity) {
          changes.severity = patch.severity;
          changed.push('severity');
        }
        if (patch.title !== undefined && patch.title !== current.title) {
          changes.title = patch.title;
          changed.push('title');
        }
        if (patch.description !== undefined && patch.description !== current.description) {
          changes.description = patch.description;
          changed.push('description');
        }
        if (patch.assignedTo !== undefined && patch.assignedTo !== current.assignedTo) {
          // An unchanged assignee is not re-validated: a no-op must stay a no-op even if that admin
          // has since lost the assignment.
          if (patch.assignedTo !== null) await requireAssignable(tx, patch.assignedTo, warehouseId);
          changes.assignedTo = patch.assignedTo;
          changed.push('assignedTo');
        }
        if (patch.resolutionNote !== undefined && patch.resolutionNote !== current.resolutionNote) {
          changes.resolutionNote = patch.resolutionNote;
          changed.push('resolutionNote');
        }
        if (moving) {
          changes.status = target;
          changed.push('status');
          if (target === 'RESOLVED') {
            changes.resolvedBy = scope.userId;
            changed.push('resolvedBy', 'resolvedAt');
          } else if (target === 'CLOSED') {
            changes.close = true;
            changed.push('closedAt');
          } else if (current.status === 'RESOLVED') {
            // Reopen (RESOLVED -> IN_PROGRESS): the resolver, the time AND the note are cleared, so the
            // next resolve records a fresh note instead of inheriting one that proved wrong.
            changes.resolvedBy = null;
            changes.resolutionNote = null;
            changed.push('resolvedBy', 'resolvedAt', 'resolutionNote');
          }
        }

        if (changed.length === 0) return current;

        const updated = await repo.update(tx, issueId, changes);
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'warehouse.issue.update',
          entityType: 'warehouse_issue',
          entityId: issueId,
          warehouseId,
          before: image(current),
          after: image(updated),
          changedFields: changed,
        });
        return updated;
      });
    },

    async addComment(scope, warehouseId, issueId, body) {
      return runTx(async (tx) => {
        await requireReachableWarehouse(tx, scope, warehouseId);
        // The row lock serialises a comment against a concurrent close.
        const issue = await repo.lockById(tx, warehouseId, issueId);
        if (issue === null) throw issueNotFound(issueId);
        if (issue.status === 'CLOSED') throw closedIssue();
        const comment = await repo.insertComment(tx, { issueId, authorId: scope.userId, body: body.body });
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'warehouse.issue.comment',
          entityType: 'warehouse_issue',
          entityId: issueId,
          warehouseId,
          after: image(issue),
          changedFields: ['comments'],
        });
        return comment;
      });
    },
  };
}

export const warehouseIssuesService: WarehouseIssuesService = createWarehouseIssuesService();
