/**
 * BR-103: warehouse operational issues.
 *
 *  a  create/update/comment/list body and query validation (fixed enums, lengths, strict, paging)
 *  b  scope: a Sub admin works its own warehouse; another and an unknown warehouse are the same 404;
 *     an issue addressed through the wrong warehouse is 404
 *  c  every legal transition succeeds, every illegal one is 409 INVALID_STATE_TRANSITION with nothing
 *     written; RESOLVED needs a note; reopen clears the resolver
 *  d  the assignee rule: Sub admin of another warehouse, a non-admin and an unknown user are 422; null unassigns
 *  e  comments are append-only and refused on a CLOSED issue
 *  f  one masked audit row per change in the same transaction (no free text); a no-op writes nothing
 *  g  401 without a token; 403 for farmer, customer and Farmer Admin on every route
 *
 * Layers: schema tests (no I/O); service unit tests against an in-memory repo and a fake transaction
 * that records the audit_log INSERT (these always run); service tests against real Postgres in a
 * rolled-back transaction and real-HTTP tests (both gated on DATABASE_URL).
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import type pg from 'pg';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { loadRbac } from '../../rbac/loadRbac.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { aScope, describeIfDatabase, newId } from '../../test/factories.js';
import { requireDatabaseTables } from '../../test/dbFixtures.js';
import {
  ISSUE_STATUSES,
  createWarehouseIssueBody,
  createWarehouseIssueCommentBody,
  listWarehouseIssuesQuery,
  updateWarehouseIssueBody,
  type CreateWarehouseIssueBody,
  type IssueStatus,
  type ListWarehouseIssuesQuery,
  type WarehouseIssue,
  type WarehouseIssueComment,
} from './warehouse-issues.schema.js';
import { createWarehouseIssuesService, LEGAL_TRANSITIONS } from './warehouse-issues.service.js';
import { warehouseIssuesRepo, type IssueUpdate, type WarehouseIssuesRepo } from './warehouse-issues.repo.js';
import {
  inRolledBackTx,
  loadWarehouseIds,
  startHttpHarness,
  type HttpHarness,
  type WarehouseIds,
} from './testkit.js';

const SECRET_TITLE = 'Compressor 2 leaking near Ravi Kumar desk';
const SECRET_DESCRIPTION = 'Call Ravi on +919876543210 about it';
const SECRET_NOTE = 'Replaced gasket; Ravi signed off';
const SECRET_COMMENT = 'Ravi says the vendor is late again';

/** Rejected promise -> the error; resolved -> null. */
async function failure(promise: Promise<unknown>): Promise<AppError> {
  const error = await promise.then(() => null, (e: unknown) => e);
  expect(error).toBeInstanceOf(AppError);
  return error as AppError;
}

// ===========================================================================
// 1. Schemas
// ===========================================================================
describe('warehouse issue schemas', () => {
  const good = { category: 'EQUIPMENT', severity: 'HIGH', title: '  Chiller down  ' };

  it('BR-103a: the create body takes fixed categories and severities, a 1-160 title, an optional 1-4000 description, and is strict', () => {
    expect(createWarehouseIssueBody.parse(good)).toEqual({ category: 'EQUIPMENT', severity: 'HIGH', title: 'Chiller down' });
    expect(createWarehouseIssueBody.safeParse({ ...good, title: 't'.repeat(160), description: 'd'.repeat(4000), assignedTo: newId() }).success).toBe(true);
    expect(createWarehouseIssueBody.safeParse({ ...good, description: null, assignedTo: null }).success).toBe(true);
    for (const bad of [
      {},
      { ...good, category: 'PLUMBING' },
      { ...good, category: 'equipment' },
      { ...good, severity: 'URGENT' },
      { ...good, title: '' },
      { ...good, title: '   ' },
      { ...good, title: 't'.repeat(161) },
      { ...good, description: '' },
      { ...good, description: 'd'.repeat(4001) },
      { ...good, assignedTo: 'not-a-uuid' },
      { ...good, status: 'RESOLVED' },
      { ...good, warehouseId: newId() },
      { ...good, reportedBy: newId() },
      { ...good, issueNumber: 'WI-000001' },
    ]) {
      expect(createWarehouseIssueBody.safeParse(bad).success, JSON.stringify(bad).slice(0, 80)).toBe(false);
    }
  });

  it('BR-103a: the update body needs at least one field, is strict, and allows null only for description and assignedTo', () => {
    expect(updateWarehouseIssueBody.safeParse({}).success).toBe(false);
    expect(updateWarehouseIssueBody.safeParse({ status: 'DONE' }).success).toBe(false);
    expect(updateWarehouseIssueBody.safeParse({ title: null }).success).toBe(false);
    expect(updateWarehouseIssueBody.safeParse({ resolutionNote: null }).success).toBe(false);
    expect(updateWarehouseIssueBody.safeParse({ resolutionNote: 'n'.repeat(2001) }).success).toBe(false);
    expect(updateWarehouseIssueBody.safeParse({ resolutionNote: '  ' }).success).toBe(false);
    expect(updateWarehouseIssueBody.safeParse({ warehouseId: newId() }).success).toBe(false);
    expect(updateWarehouseIssueBody.safeParse({ resolvedBy: newId() }).success).toBe(false);
    expect(updateWarehouseIssueBody.safeParse({ description: null, assignedTo: null }).success).toBe(true);
    expect(updateWarehouseIssueBody.safeParse({ status: 'RESOLVED', resolutionNote: 'n'.repeat(2000) }).success).toBe(true);
  });

  it('BR-103a: the comment body is 1-2000 characters after trimming and strict', () => {
    expect(createWarehouseIssueCommentBody.parse({ body: ' ok ' })).toEqual({ body: 'ok' });
    expect(createWarehouseIssueCommentBody.safeParse({ body: 'b'.repeat(2000) }).success).toBe(true);
    for (const bad of [{}, { body: '' }, { body: '   ' }, { body: 'b'.repeat(2001) }, { body: 'x', authorId: newId() }]) {
      expect(createWarehouseIssueCommentBody.safeParse(bad).success).toBe(false);
    }
  });

  it('BR-103a: the list query is strict, filters by the fixed enums and an assignee uuid, and pages at most 100', () => {
    expect(listWarehouseIssuesQuery.parse({})).toEqual({ page: 1, pageSize: 20 });
    expect(listWarehouseIssuesQuery.parse({ status: 'OPEN', severity: 'LOW', category: 'SAFETY', page: '2', pageSize: '100' })).toMatchObject({
      status: 'OPEN',
      severity: 'LOW',
      category: 'SAFETY',
      page: 2,
      pageSize: 100,
    });
    for (const bad of [
      { pageSize: '101' },
      { pageSize: '0' },
      { page: '0' },
      { status: 'open' },
      { severity: 'URGENT' },
      { category: 'X' },
      { assignedTo: 'me' },
      { warehouseId: newId() },
    ]) {
      expect(listWarehouseIssuesQuery.safeParse(bad).success, JSON.stringify(bad)).toBe(false);
    }
  });
});

// ===========================================================================
// 2. Service against an in-memory repo and a fake transaction
// ===========================================================================
const WH_A = '10000000-0000-4000-8000-0000000000a1';
const WH_B = '10000000-0000-4000-8000-0000000000b2';
const ACTOR = '00000000-0000-4000-8000-00000000a001';
const MAIN_ASSIGNEE = '00000000-0000-4000-8000-00000000a002';
const SUB_A_ASSIGNEE = '00000000-0000-4000-8000-00000000a003';
const SUB_B_ASSIGNEE = '00000000-0000-4000-8000-00000000a004';
const FARMER_USER = '00000000-0000-4000-8000-00000000a005';

interface AuditCall {
  actionCode: string;
  entityType: string;
  entityId: string;
  warehouseId: string | null;
  before: unknown;
  after: unknown;
  changedFields: string[] | null;
}

/** Records every audit_log INSERT and answers the warehouse existence check; anything else is a bug. */
function fakeTx(): Executor & { audits: AuditCall[] } {
  const audits: AuditCall[] = [];
  const result = <R extends pg.QueryResultRow>(rows: R[]): pg.QueryResult<R> =>
    ({ rows, rowCount: rows.length, command: 'SELECT', oid: 0, fields: [] }) as pg.QueryResult<R>;
  return {
    audits,
    async query<R extends pg.QueryResultRow>(sql: string, params: unknown[] = []): Promise<pg.QueryResult<R>> {
      if (/FROM warehouses/.test(sql)) {
        return result([WH_A, WH_B].includes(params[0] as string) ? ([{ '?column?': 1 }] as unknown as R[]) : []);
      }
      if (/INSERT INTO audit_log/.test(sql)) {
        audits.push({
          actionCode: params[3] as string,
          entityType: params[4] as string,
          entityId: params[5] as string,
          warehouseId: params[6] as string | null,
          before: params[8] === null ? null : JSON.parse(params[8] as string),
          after: params[9] === null ? null : JSON.parse(params[9] as string),
          changedFields: params[10] as string[] | null,
        });
        return result([{ id: newId() }] as unknown as R[]);
      }
      throw new Error(`unexpected SQL in the unit fake: ${sql}`);
    },
  };
}

/** In-memory repo with the same contract as warehouseIssuesRepo. Counts every write. */
class FakeRepo implements WarehouseIssuesRepo {
  issues = new Map<string, WarehouseIssue>();
  comments: Array<WarehouseIssueComment & { issueId: string }> = [];
  writes = 0;
  updates: IssueUpdate[] = [];
  private seq = 0;

  async list(_db: Executor, warehouseId: string, query: ListWarehouseIssuesQuery) {
    const all = [...this.issues.values()].filter(
      (issue) =>
        issue.warehouseId === warehouseId &&
        (query.status === undefined || issue.status === query.status) &&
        (query.severity === undefined || issue.severity === query.severity) &&
        (query.category === undefined || issue.category === query.category) &&
        (query.assignedTo === undefined || issue.assignedTo === query.assignedTo),
    );
    const start = (query.page - 1) * query.pageSize;
    return { items: all.slice(start, start + query.pageSize), total: all.length };
  }
  async findById(_db: Executor, warehouseId: string, id: string) {
    const issue = this.issues.get(id);
    return issue !== undefined && issue.warehouseId === warehouseId ? { ...issue } : null;
  }
  async lockById(db: Executor, warehouseId: string, id: string) {
    return this.findById(db, warehouseId, id);
  }
  async listComments(_db: Executor, issueId: string) {
    return this.comments.filter((c) => c.issueId === issueId).map(({ issueId: _ignored, ...comment }) => comment);
  }
  async insert(_db: Executor, input: { warehouseId: string; reportedBy: string; body: CreateWarehouseIssueBody }) {
    this.writes += 1;
    this.seq += 1;
    const issue: WarehouseIssue = {
      id: newId(),
      issueNumber: `WI-${String(this.seq).padStart(6, '0')}`,
      warehouseId: input.warehouseId,
      category: input.body.category,
      severity: input.body.severity,
      title: input.body.title,
      description: input.body.description ?? null,
      status: 'OPEN',
      reportedBy: input.reportedBy,
      assignedTo: input.body.assignedTo ?? null,
      resolutionNote: null,
      resolvedBy: null,
      resolvedAt: null,
      closedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: null,
    };
    this.issues.set(issue.id, issue);
    return { ...issue };
  }
  async update(_db: Executor, id: string, changes: IssueUpdate) {
    this.writes += 1;
    this.updates.push(changes);
    const current = this.issues.get(id)!;
    const now = new Date().toISOString();
    const next: WarehouseIssue = { ...current, updatedAt: now };
    if (changes.category !== undefined) next.category = changes.category;
    if (changes.severity !== undefined) next.severity = changes.severity;
    if (changes.title !== undefined) next.title = changes.title;
    if (changes.description !== undefined) next.description = changes.description;
    if (changes.assignedTo !== undefined) next.assignedTo = changes.assignedTo;
    if (changes.status !== undefined) next.status = changes.status;
    if (changes.resolutionNote !== undefined) next.resolutionNote = changes.resolutionNote;
    if (changes.resolvedBy !== undefined) {
      next.resolvedBy = changes.resolvedBy;
      next.resolvedAt = changes.resolvedBy === null ? null : now;
    }
    if (changes.close === true) next.closedAt = now;
    this.issues.set(id, next);
    return { ...next };
  }
  async insertComment(_db: Executor, input: { issueId: string; authorId: string; body: string }) {
    this.writes += 1;
    const comment = { id: newId(), authorId: input.authorId, body: input.body, createdAt: new Date().toISOString(), issueId: input.issueId };
    this.comments.push(comment);
    const { issueId: _ignored, ...rest } = comment;
    return rest;
  }
  async isEligibleAssignee(_db: Executor, userId: string, warehouseId: string, permissionCode: string) {
    // The service must ask about the permission that governs working an issue; any other code
    // makes nobody assignable, so every assignee test below also pins that code.
    if (permissionCode !== 'warehouse.issue.manage') return false;
    if (userId === MAIN_ASSIGNEE || userId === ACTOR) return true;
    if (userId === SUB_A_ASSIGNEE) return warehouseId === WH_A;
    if (userId === SUB_B_ASSIGNEE) return warehouseId === WH_B;
    return false;
  }

  /** Puts a row straight into the store (a fixture, not a counted write). */
  seed(warehouseId: string, status: IssueStatus, overrides: Partial<WarehouseIssue> = {}): WarehouseIssue {
    this.seq += 1;
    const resolved = status === 'RESOLVED' || status === 'CLOSED';
    const issue: WarehouseIssue = {
      id: newId(),
      issueNumber: `WI-${String(this.seq).padStart(6, '0')}`,
      warehouseId,
      category: 'EQUIPMENT',
      severity: 'HIGH',
      title: SECRET_TITLE,
      description: SECRET_DESCRIPTION,
      status,
      reportedBy: ACTOR,
      assignedTo: null,
      resolutionNote: resolved ? SECRET_NOTE : null,
      resolvedBy: resolved ? ACTOR : null,
      resolvedAt: resolved ? '2026-10-01T00:00:00.000Z' : null,
      closedAt: status === 'CLOSED' ? '2026-10-02T00:00:00.000Z' : null,
      createdAt: '2026-09-30T00:00:00.000Z',
      updatedAt: null,
      ...overrides,
    };
    this.issues.set(issue.id, issue);
    return { ...issue };
  }
}

const manage = (): ResolvedScope =>
  aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.MAIN_WH_ADMIN, permission: 'warehouse.issue.manage', userId: ACTOR });
const subOwn = (warehouseId: string, permission = 'warehouse.issue.manage'): ResolvedScope =>
  aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds: [warehouseId], permission, userId: ACTOR });

describe('warehouse issues service (in-memory repo)', () => {
  let repo: FakeRepo;
  let tx: ReturnType<typeof fakeTx>;
  let svc: ReturnType<typeof createWarehouseIssuesService>;

  beforeEach(() => {
    repo = new FakeRepo();
    tx = fakeTx();
    svc = createWarehouseIssuesService({ repo, db: tx, runTx: async (fn) => fn(tx) });
  });

  /** The note a move to RESOLVED needs; any other target is sent without one. */
  const bodyFor = (to: IssueStatus) => (to === 'RESOLVED' ? { status: to, resolutionNote: 'Fixed the seal' } : { status: to });

  it('BR-103b: a Sub admin creates, lists, reads, updates and comments in its own warehouse', async () => {
    const sub = subOwn(WH_A);
    const created = await svc.create(sub, WH_A, { category: 'STORAGE', severity: 'LOW', title: 'Shelf bent' });
    expect(created).toMatchObject({ warehouseId: WH_A, status: 'OPEN', reportedBy: ACTOR, assignedTo: null });
    expect((await svc.list(subOwn(WH_A, 'warehouse.issue.view'), WH_A, { page: 1, pageSize: 20 })).items.map((i) => i.id)).toEqual([created.id]);
    expect((await svc.get(subOwn(WH_A, 'warehouse.issue.view'), WH_A, created.id)).comments).toEqual([]);
    expect((await svc.update(sub, WH_A, created.id, { status: 'IN_PROGRESS' })).status).toBe('IN_PROGRESS');
    expect((await svc.addComment(sub, WH_A, created.id, { body: 'on it' })).body).toBe('on it');
  });

  it('BR-103b: another warehouse and an unknown warehouse are the SAME 404 on every operation, and nothing is written', async () => {
    const theirs = repo.seed(WH_B, 'OPEN');
    const sub = subOwn(WH_A);
    const messages = new Set<string>();
    for (const warehouseId of [WH_B, newId()]) {
      for (const call of [
        () => svc.list(sub, warehouseId, { page: 1, pageSize: 20 }),
        () => svc.get(sub, warehouseId, theirs.id),
        () => svc.create(sub, warehouseId, { category: 'OTHER', severity: 'LOW', title: 'x' }),
        () => svc.update(sub, warehouseId, theirs.id, { severity: 'LOW' }),
        () => svc.addComment(sub, warehouseId, theirs.id, { body: 'x' }),
      ]) {
        const error = await failure(call());
        expect(error.status).toBe(404);
        expect(error.code).toBe('NOT_FOUND');
        messages.add(error.message.replace(/[0-9a-f-]{36}/g, '<id>'));
      }
    }
    expect(messages.size, 'another and unknown warehouse must be indistinguishable').toBe(1);
    expect(repo.writes).toBe(0);
    expect(tx.audits).toEqual([]);
  });

  it('BR-103b: a Sub scope widened to `all` is still confined to its assigned warehouse', async () => {
    const wide = aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds: [WH_A], permission: 'warehouse.issue.manage', userId: ACTOR });
    const theirs = repo.seed(WH_B, 'OPEN');
    expect((await failure(svc.get(wide, WH_B, theirs.id))).status).toBe(404);
    expect((await failure(svc.create(wide, WH_B, { category: 'OTHER', severity: 'LOW', title: 'x' }))).status).toBe(404);
  });

  it('BR-103b: an issue addressed through the wrong (but reachable) warehouse, or an unknown issue id, is 404', async () => {
    const theirs = repo.seed(WH_B, 'OPEN');
    for (const call of [
      () => svc.get(manage(), WH_A, theirs.id),
      () => svc.update(manage(), WH_A, theirs.id, { severity: 'LOW' }),
      () => svc.addComment(manage(), WH_A, theirs.id, { body: 'x' }),
      () => svc.get(manage(), WH_A, newId()),
    ]) {
      const error = await failure(call());
      expect(error.status).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    }
    expect(repo.writes).toBe(0);
    expect(tx.audits).toEqual([]);
  });

  it('BR-103c: the transition table is exactly OPEN->IN_PROGRESS|RESOLVED, IN_PROGRESS->OPEN|RESOLVED, RESOLVED->CLOSED|IN_PROGRESS, CLOSED terminal', () => {
    expect(LEGAL_TRANSITIONS).toEqual({
      OPEN: ['IN_PROGRESS', 'RESOLVED'],
      IN_PROGRESS: ['OPEN', 'RESOLVED'],
      RESOLVED: ['CLOSED', 'IN_PROGRESS'],
      CLOSED: [],
    });
  });

  const legal: Array<[IssueStatus, IssueStatus]> = [
    ['OPEN', 'IN_PROGRESS'],
    ['OPEN', 'RESOLVED'],
    ['IN_PROGRESS', 'OPEN'],
    ['IN_PROGRESS', 'RESOLVED'],
    ['RESOLVED', 'CLOSED'],
    ['RESOLVED', 'IN_PROGRESS'],
  ];
  const illegal: Array<[IssueStatus, IssueStatus]> = [];
  for (const from of ISSUE_STATUSES) {
    for (const to of ISSUE_STATUSES) {
      if (from === to && from !== 'CLOSED') continue; // same status is a no-op, tested below
      if (!legal.some(([f, t]) => f === from && t === to)) illegal.push([from, to]);
    }
  }

  it('BR-103c: the matrix covers all 16 pairs (6 legal, 3 same-status no-ops, 7 illegal)', () => {
    expect(legal.length + illegal.length + 3).toBe(16);
    expect(illegal).toEqual([
      ['OPEN', 'CLOSED'],
      ['IN_PROGRESS', 'CLOSED'],
      ['RESOLVED', 'OPEN'],
      ['CLOSED', 'OPEN'],
      ['CLOSED', 'IN_PROGRESS'],
      ['CLOSED', 'RESOLVED'],
      ['CLOSED', 'CLOSED'],
    ]);
  });

  for (const [from, to] of legal) {
    it(`BR-103c: ${from} -> ${to} succeeds and writes one audit row`, async () => {
      const issue = repo.seed(WH_A, from);
      const updated = await svc.update(manage(), WH_A, issue.id, bodyFor(to));
      expect(updated.status).toBe(to);
      expect(repo.writes).toBe(1);
      expect(tx.audits).toHaveLength(1);
      expect(tx.audits[0]!.changedFields).toContain('status');
      if (to === 'RESOLVED') {
        expect(updated).toMatchObject({ resolutionNote: 'Fixed the seal', resolvedBy: ACTOR });
        expect(updated.resolvedAt).not.toBeNull();
      }
      if (to === 'CLOSED') {
        expect(updated.closedAt).not.toBeNull();
        // Closing keeps the record of how the issue was resolved (the table CHECK requires it).
        expect(updated).toMatchObject({ resolutionNote: SECRET_NOTE, resolvedBy: ACTOR });
      }
    });
  }

  for (const [from, to] of illegal) {
    it(`BR-103c: ${from} -> ${to} is 409 INVALID_STATE_TRANSITION and writes nothing`, async () => {
      const issue = repo.seed(WH_A, from);
      const error = await failure(svc.update(manage(), WH_A, issue.id, bodyFor(to)));
      expect(error.status).toBe(409);
      expect(error.code).toBe('INVALID_STATE_TRANSITION');
      expect(repo.writes).toBe(0);
      expect(tx.audits).toEqual([]);
      expect(repo.issues.get(issue.id)!.status).toBe(from);
    });
  }

  it('BR-103c: a CLOSED issue accepts no PATCH at all, not even a severity, title or assignee change', async () => {
    const issue = repo.seed(WH_A, 'CLOSED');
    for (const patch of [{ severity: 'LOW' as const }, { title: 'new' }, { assignedTo: MAIN_ASSIGNEE }, { description: null }]) {
      const error = await failure(svc.update(manage(), WH_A, issue.id, patch));
      expect(error.status).toBe(409);
      expect(error.code).toBe('INVALID_STATE_TRANSITION');
    }
    expect(repo.writes).toBe(0);
    expect(tx.audits).toEqual([]);
  });

  it('BR-103c: moving to RESOLVED without a resolutionNote in the body is 422 and writes nothing', async () => {
    for (const from of ['OPEN', 'IN_PROGRESS'] as const) {
      const issue = repo.seed(WH_A, from);
      const error = await failure(svc.update(manage(), WH_A, issue.id, { status: 'RESOLVED' }));
      expect(error.status).toBe(422);
      expect(error.code).toBe('VALIDATION_FAILED');
      expect(error.errors).toHaveProperty(['body.resolutionNote']);
    }
    expect(repo.writes).toBe(0);
    expect(tx.audits).toEqual([]);
  });

  it('BR-103c: a resolutionNote is refused when the issue is not (being) resolved, so an OPEN issue never carries one', async () => {
    const issue = repo.seed(WH_A, 'OPEN');
    for (const patch of [{ resolutionNote: 'x' }, { status: 'IN_PROGRESS' as const, resolutionNote: 'x' }]) {
      const error = await failure(svc.update(manage(), WH_A, issue.id, patch));
      expect(error.status).toBe(422);
      expect(error.errors).toHaveProperty(['body.resolutionNote']);
    }
    const reopenWithNote = repo.seed(WH_A, 'RESOLVED');
    expect((await failure(svc.update(manage(), WH_A, reopenWithNote.id, { status: 'IN_PROGRESS', resolutionNote: 'x' }))).status).toBe(422);
    expect(repo.writes).toBe(0);
  });

  it('BR-103c: a RESOLVED issue can have its note corrected without changing status', async () => {
    const issue = repo.seed(WH_A, 'RESOLVED');
    const updated = await svc.update(manage(), WH_A, issue.id, { resolutionNote: 'Gasket replaced' });
    expect(updated).toMatchObject({ status: 'RESOLVED', resolutionNote: 'Gasket replaced', resolvedBy: ACTOR });
    expect(tx.audits[0]!.changedFields).toEqual(['resolutionNote']);
  });

  it('BR-103c: reopening (RESOLVED -> IN_PROGRESS) clears resolvedBy, resolvedAt and the note; a re-resolve needs a fresh note', async () => {
    const issue = repo.seed(WH_A, 'RESOLVED');
    const reopened = await svc.update(manage(), WH_A, issue.id, { status: 'IN_PROGRESS' });
    expect(reopened).toMatchObject({ status: 'IN_PROGRESS', resolvedBy: null, resolvedAt: null, resolutionNote: null });
    expect([...tx.audits[0]!.changedFields!].sort()).toEqual(['resolutionNote', 'resolvedAt', 'resolvedBy', 'status']);
    expect((await failure(svc.update(manage(), WH_A, issue.id, { status: 'RESOLVED' }))).status).toBe(422);
    const again = await svc.update(manage(), WH_A, issue.id, { status: 'RESOLVED', resolutionNote: 'Second fix' });
    expect(again).toMatchObject({ status: 'RESOLVED', resolutionNote: 'Second fix', resolvedBy: ACTOR });
  });

  it('BR-103c/f: a same-status PATCH with nothing else changing is a no-op: nothing written, nothing audited', async () => {
    for (const status of ['OPEN', 'IN_PROGRESS', 'RESOLVED'] as const) {
      const issue = repo.seed(WH_A, status, { assignedTo: MAIN_ASSIGNEE });
      const same = await svc.update(manage(), WH_A, issue.id, {
        status,
        severity: issue.severity,
        category: issue.category,
        title: issue.title,
        description: issue.description,
        assignedTo: MAIN_ASSIGNEE,
        ...(status === 'RESOLVED' ? { resolutionNote: SECRET_NOTE } : {}),
      });
      expect(same).toEqual(issue);
    }
    expect(repo.writes).toBe(0);
    expect(tx.audits).toEqual([]);
  });

  it('BR-103c: a same-status PATCH that changes another field updates only that field', async () => {
    const issue = repo.seed(WH_A, 'IN_PROGRESS');
    const updated = await svc.update(manage(), WH_A, issue.id, { status: 'IN_PROGRESS', severity: 'CRITICAL' });
    expect(updated).toMatchObject({ status: 'IN_PROGRESS', severity: 'CRITICAL' });
    expect(tx.audits[0]!.changedFields).toEqual(['severity']);
    expect(repo.updates[0]).toEqual({ severity: 'CRITICAL' });
  });

  it('BR-103d: Main admin, a Sub admin of THIS warehouse and null are accepted as assignee on create and update', async () => {
    const a = await svc.create(manage(), WH_A, { category: 'SAFETY', severity: 'CRITICAL', title: 'x', assignedTo: SUB_A_ASSIGNEE });
    expect(a.assignedTo).toBe(SUB_A_ASSIGNEE);
    expect((await svc.update(manage(), WH_A, a.id, { assignedTo: MAIN_ASSIGNEE })).assignedTo).toBe(MAIN_ASSIGNEE);
    const unassigned = await svc.update(manage(), WH_A, a.id, { assignedTo: null });
    expect(unassigned.assignedTo).toBeNull();
    expect(tx.audits.at(-1)!.changedFields).toEqual(['assignedTo']);
    expect((await svc.create(manage(), WH_A, { category: 'OTHER', severity: 'LOW', title: 'y', assignedTo: null })).assignedTo).toBeNull();
  });

  it('BR-103d: a Sub admin of another warehouse, a non-admin and an unknown user are 422 on create and update, and nothing is written', async () => {
    const issue = repo.seed(WH_A, 'OPEN');
    for (const userId of [SUB_B_ASSIGNEE, FARMER_USER, newId()]) {
      for (const call of [
        () => svc.create(manage(), WH_A, { category: 'OTHER', severity: 'LOW', title: 'x', assignedTo: userId }),
        () => svc.update(manage(), WH_A, issue.id, { assignedTo: userId }),
      ]) {
        const error = await failure(call());
        expect(error.status).toBe(422);
        expect(error.code).toBe('VALIDATION_FAILED');
        expect(error.errors).toHaveProperty(['body.assignedTo']);
      }
    }
    expect(repo.writes).toBe(0);
    expect(tx.audits).toEqual([]);
    // The same Sub admin IS a valid assignee in its own warehouse.
    const b = repo.seed(WH_B, 'OPEN');
    expect((await svc.update(manage(), WH_B, b.id, { assignedTo: SUB_B_ASSIGNEE })).assignedTo).toBe(SUB_B_ASSIGNEE);
  });

  it('BR-103e: comments are added to OPEN, IN_PROGRESS and RESOLVED issues and returned oldest first on GET', async () => {
    const issue = repo.seed(WH_A, 'OPEN');
    await svc.addComment(manage(), WH_A, issue.id, { body: 'first' });
    await svc.addComment(manage(), WH_A, issue.id, { body: 'second' });
    for (const status of ['IN_PROGRESS', 'RESOLVED'] as const) {
      const other = repo.seed(WH_A, status);
      expect((await svc.addComment(manage(), WH_A, other.id, { body: 'ok' })).authorId).toBe(ACTOR);
    }
    const detail = await svc.get(manage(), WH_A, issue.id);
    expect(detail.comments.map((c) => c.body)).toEqual(['first', 'second']);
    expect(detail.id).toBe(issue.id);
  });

  it('BR-103e: a CLOSED issue takes no new comment (409 INVALID_STATE_TRANSITION) and nothing is written', async () => {
    const issue = repo.seed(WH_A, 'CLOSED');
    const error = await failure(svc.addComment(manage(), WH_A, issue.id, { body: 'late' }));
    expect(error.status).toBe(409);
    expect(error.code).toBe('INVALID_STATE_TRANSITION');
    expect(repo.writes).toBe(0);
    expect(tx.audits).toEqual([]);
  });

  it('BR-103f: create, update and comment each write ONE masked audit row (no title, description, note or comment body)', async () => {
    const created = await svc.create(manage(), WH_A, {
      category: 'EQUIPMENT',
      severity: 'HIGH',
      title: SECRET_TITLE,
      description: SECRET_DESCRIPTION,
      assignedTo: MAIN_ASSIGNEE,
    });
    await svc.update(manage(), WH_A, created.id, { title: `${SECRET_TITLE} (2)`, description: null, severity: 'CRITICAL' });
    await svc.update(manage(), WH_A, created.id, { status: 'RESOLVED', resolutionNote: SECRET_NOTE });
    await svc.addComment(manage(), WH_A, created.id, { body: SECRET_COMMENT });

    expect(tx.audits.map((a) => a.actionCode)).toEqual([
      'warehouse.issue.create',
      'warehouse.issue.update',
      'warehouse.issue.update',
      'warehouse.issue.comment',
    ]);
    for (const audit of tx.audits) {
      expect(audit).toMatchObject({ entityType: 'warehouse_issue', entityId: created.id, warehouseId: WH_A });
      for (const image of [audit.before, audit.after]) {
        if (image !== null) expect(Object.keys(image as object).sort()).toEqual(['assignedTo', 'category', 'issueNumber', 'severity', 'status']);
      }
    }
    const [createRow, editRow, resolveRow, commentRow] = tx.audits;
    expect(createRow!.before).toBeNull();
    expect(createRow!.after).toEqual({ issueNumber: created.issueNumber, category: 'EQUIPMENT', severity: 'HIGH', status: 'OPEN', assignedTo: MAIN_ASSIGNEE });
    expect([...editRow!.changedFields!].sort()).toEqual(['description', 'severity', 'title']);
    expect(editRow!.before).toMatchObject({ severity: 'HIGH' });
    expect(editRow!.after).toMatchObject({ severity: 'CRITICAL' });
    expect([...resolveRow!.changedFields!].sort()).toEqual(['resolutionNote', 'resolvedAt', 'resolvedBy', 'status']);
    expect(commentRow!.changedFields).toEqual(['comments']);
    const dump = JSON.stringify(tx.audits);
    for (const secret of [SECRET_TITLE, SECRET_DESCRIPTION, SECRET_NOTE, SECRET_COMMENT, 'Ravi']) {
      expect(dump).not.toContain(secret);
    }
  });

  it('BR-103f: a rejected change (404, 409, 422) writes no audit row', async () => {
    const closed = repo.seed(WH_A, 'CLOSED');
    const open = repo.seed(WH_A, 'OPEN');
    await failure(svc.update(manage(), WH_A, closed.id, { severity: 'LOW' }));
    await failure(svc.update(manage(), WH_A, open.id, { status: 'CLOSED' }));
    await failure(svc.update(manage(), WH_A, open.id, { assignedTo: FARMER_USER }));
    await failure(svc.update(manage(), WH_A, newId(), { severity: 'LOW' }));
    expect(tx.audits).toEqual([]);
    expect(repo.writes).toBe(0);
  });

  it('BR-103b: reads write nothing and the list returns the page envelope', async () => {
    repo.seed(WH_A, 'OPEN');
    repo.seed(WH_A, 'RESOLVED');
    repo.seed(WH_B, 'OPEN');
    const page = await svc.list(manage(), WH_A, { page: 1, pageSize: 1 });
    expect(page).toMatchObject({ page: 1, pageSize: 1, total: 2 });
    expect(page.items).toHaveLength(1);
    expect(tx.audits).toEqual([]);
    expect(repo.writes).toBe(0);
  });
});

// ===========================================================================
// 3. Service against real Postgres, in a rolled-back transaction
// ===========================================================================
describeIfDatabase('warehouse issues service (PostgreSQL)', () => {
  let ready = false;
  let wh: WarehouseIds;
  const tag = `CI-WI-SVC-${Date.now()}`;

  beforeAll(async () => {
    ready = await requireDatabaseTables('warehouse_issues', 'warehouse_issue_comments', 'warehouses', 'user_roles');
    if (ready) {
      const { pool } = await import('../../db/pool.js');
      wh = await loadWarehouseIds(pool);
    }
  });

  const dbTest = (name: string, fn: () => Promise<void>) =>
    it(name, async (context) => {
      if (!ready) context.skip();
      await fn();
    });

  let mobileSeq = 0;
  /** A user with an optional live (or ended) role assignment. */
  async function user(
    tx: Executor,
    options: { userType?: string; status?: string; role?: string; warehouseId?: string | null; ended?: boolean; deleted?: boolean } = {},
  ): Promise<string> {
    mobileSeq += 1;
    const mobile = `+9196${String(Date.now()).slice(-6)}${String(mobileSeq).padStart(2, '0')}`;
    const created = await tx.query<{ id: string }>(
      `INSERT INTO users (mobile, full_name, user_type, status, deleted_at)
       VALUES ($1, 'CI issue user', $2::user_type, $3, CASE WHEN $4::boolean THEN now() ELSE NULL END) RETURNING id`,
      [mobile, options.userType ?? 'ADMIN', options.status ?? 'ACTIVE', options.deleted === true],
    );
    const id = created.rows[0]!.id;
    if (options.role !== undefined) {
      await tx.query(
        `INSERT INTO user_roles (user_id, role_id, role_code, warehouse_id, valid_from, valid_to)
         SELECT $1, r.id, r.code, $2, now() - interval '2 days',
                CASE WHEN $3::boolean THEN now() - interval '1 day' ELSE NULL END
           FROM roles r WHERE r.code = $4`,
        [id, options.warehouseId ?? null, options.ended === true, options.role],
      );
    }
    return id;
  }

  const main = (userId: string) =>
    aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.MAIN_WH_ADMIN, permission: 'warehouse.issue.manage', userId });
  const sub = (userId: string, warehouseId: string) =>
    aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds: [warehouseId], permission: 'warehouse.issue.manage', userId });
  const service = (tx: Executor) => createWarehouseIssuesService({ repo: warehouseIssuesRepo, db: tx, runTx: async (fn) => fn(tx) });

  dbTest('BR-103a/b: create stores a WI-###### number, OPEN status and the reporter; list filters, searches (wildcards literal) and pages newest first', async () => {
    await inRolledBackTx(async (tx) => {
      await projectGrants(tx, ISSUE_MANAGE); // `second` below is assigned, and eligibility reads the grant
      const actorId = await user(tx, { role: 'MAIN_WH_ADMIN' });
      const svc = service(tx);
      const first = await svc.create(main(actorId), wh.ooty, { category: 'EQUIPMENT', severity: 'HIGH', title: 'Chiller 100% down', description: 'd' });
      const second = await svc.create(main(actorId), wh.ooty, { category: 'SAFETY', severity: 'LOW', title: 'Wet floor', assignedTo: actorId });
      await svc.create(main(actorId), wh.coonoor, { category: 'SAFETY', severity: 'LOW', title: 'Other warehouse' });
      expect(first.issueNumber).toMatch(/^WI-\d{6,}$/);
      expect(first).toMatchObject({ warehouseId: wh.ooty, status: 'OPEN', reportedBy: actorId, description: 'd', resolvedAt: null, closedAt: null, updatedAt: null });

      const scope = main(actorId);
      const all = await svc.list(scope, wh.ooty, { page: 1, pageSize: 100, q: 'Chiller 100% down' });
      expect(all.items.map((i) => i.id)).toEqual([first.id]);
      expect((await svc.list(scope, wh.ooty, { page: 1, pageSize: 100, q: 'Chiller 1_0' })).items).toEqual([]);
      expect((await svc.list(scope, wh.ooty, { page: 1, pageSize: 100, q: '%' })).items.map((i) => i.id)).toEqual([first.id]);
      expect((await svc.list(scope, wh.ooty, { page: 1, pageSize: 100, q: first.issueNumber.toLowerCase() })).items.map((i) => i.id)).toEqual([first.id]);
      expect((await svc.list(scope, wh.ooty, { page: 1, pageSize: 100, assignedTo: actorId })).items.map((i) => i.id)).toEqual([second.id]);
      const safety = await svc.list(scope, wh.ooty, { page: 1, pageSize: 100, category: 'SAFETY', severity: 'LOW', status: 'OPEN' });
      expect(safety.items.map((i) => i.id)).toContain(second.id);
      expect(safety.items.every((i) => i.warehouseId === wh.ooty && i.category === 'SAFETY')).toBe(true);

      // Newest first, paged. Both rows sit in one transaction, so this relies on the repo stamping
      // created_at with clock_timestamp() rather than the transaction's now().
      const tagged = await svc.create(scope, wh.ooty, { category: 'OTHER', severity: 'LOW', title: `${tag} older` });
      const newer = await svc.create(scope, wh.ooty, { category: 'OTHER', severity: 'LOW', title: `${tag} newer` });
      const page1 = await svc.list(scope, wh.ooty, { page: 1, pageSize: 1, q: tag });
      expect(page1.items.map((i) => i.id)).toEqual([newer.id]);
      expect(page1.total).toBe(2);
      const page2 = await svc.list(scope, wh.ooty, { page: 2, pageSize: 1, q: tag });
      expect(page2.items.map((i) => i.id)).toEqual([tagged.id]);
    });
  });

  dbTest('BR-103b: a Sub admin gets the same 404 for another and an unknown warehouse, and for an issue under the wrong warehouse', async () => {
    await inRolledBackTx(async (tx) => {
      const actorId = await user(tx, { role: 'MAIN_WH_ADMIN' });
      const svc = service(tx);
      const theirs = await svc.create(main(actorId), wh.coonoor, { category: 'OTHER', severity: 'LOW', title: 'Coonoor' });
      const s = sub(actorId, wh.ooty);
      for (const call of [
        () => svc.list(s, wh.coonoor, { page: 1, pageSize: 20 }),
        () => svc.get(s, wh.coonoor, theirs.id),
        () => svc.get(s, newId(), theirs.id),
        () => svc.get(s, wh.ooty, theirs.id),
        () => svc.update(main(actorId), wh.ooty, theirs.id, { severity: 'HIGH' }),
      ]) {
        expect((await failure(call())).status).toBe(404);
      }
    });
  });

  dbTest('BR-103c: resolve, reopen and close against the real table (CHECK constraints hold at every step)', async () => {
    await inRolledBackTx(async (tx) => {
      const actorId = await user(tx, { role: 'MAIN_WH_ADMIN' });
      const svc = service(tx);
      const issue = await svc.create(main(actorId), wh.ooty, { category: 'QUALITY', severity: 'MEDIUM', title: 'Mould' });
      expect((await svc.update(main(actorId), wh.ooty, issue.id, { status: 'IN_PROGRESS' })).status).toBe('IN_PROGRESS');
      const resolved = await svc.update(main(actorId), wh.ooty, issue.id, { status: 'RESOLVED', resolutionNote: 'Cleaned' });
      expect(resolved).toMatchObject({ status: 'RESOLVED', resolutionNote: 'Cleaned', resolvedBy: actorId });
      expect(resolved.resolvedAt).not.toBeNull();
      const reopened = await svc.update(main(actorId), wh.ooty, issue.id, { status: 'IN_PROGRESS' });
      expect(reopened).toMatchObject({ resolvedBy: null, resolvedAt: null, resolutionNote: null });
      await svc.update(main(actorId), wh.ooty, issue.id, { status: 'RESOLVED', resolutionNote: 'Cleaned again' });
      const closed = await svc.update(main(actorId), wh.ooty, issue.id, { status: 'CLOSED' });
      expect(closed.status).toBe('CLOSED');
      expect(closed.closedAt).not.toBeNull();
      expect(closed.resolutionNote).toBe('Cleaned again');
      const error = await failure(svc.update(main(actorId), wh.ooty, issue.id, { status: 'IN_PROGRESS' }));
      expect(error.code).toBe('INVALID_STATE_TRANSITION');
    });
  });

  /** Sets one role's grant on one permission, inside the caller's (rolled-back) transaction. */
  async function setGrant(tx: Executor, permissionCode: string, roleCode: string, scope: string): Promise<void> {
    await tx.query(
      `INSERT INTO role_permissions (role_id, permission_id, scope)
       SELECT r.id, p.id, $3 FROM roles r CROSS JOIN permissions p WHERE r.code = $1 AND p.code = $2
       ON CONFLICT (role_id, permission_id) DO UPDATE SET scope = EXCLUDED.scope`,
      [roleCode, permissionCode, scope],
    );
  }

  /**
   * Projects one permission and its grants from docs/rbac.json into the transaction, as
   * db/seed/002_permissions.js does, so these tests read the CURRENT rbac.json rather than whatever
   * the local database was last seeded with. Rolled back with everything else.
   */
  async function projectGrants(tx: Executor, permissionCode: string): Promise<void> {
    const permission = loadRbac().permission(permissionCode);
    await tx.query(
      `INSERT INTO permissions (code, module, description, predicate) VALUES ($1, $2, $3, $4)
       ON CONFLICT (code) DO UPDATE SET module = EXCLUDED.module, description = EXCLUDED.description, predicate = EXCLUDED.predicate`,
      [permissionCode, permission.module, permission.description ?? permissionCode, permission.predicate ?? null],
    );
    for (const [roleCode, scope] of Object.entries(permission.grants)) {
      await setGrant(tx, permissionCode, roleCode, scope);
    }
  }

  const ISSUE_MANAGE = 'warehouse.issue.manage';

  dbTest('BR-103d: the assignee query accepts live Super/Tohfa/Main and a Sub of THIS warehouse; refuses other Subs, ended, disabled, deleted, non-admin and unknown users', async () => {
    await inRolledBackTx(async (tx) => {
      await projectGrants(tx, ISSUE_MANAGE);
      const ok = {
        superAdmin: await user(tx, { role: 'SUPER_ADMIN' }),
        tohfa: await user(tx, { role: 'TOHFA_ADMIN' }),
        main: await user(tx, { role: 'MAIN_WH_ADMIN' }),
        subHere: await user(tx, { role: 'SUB_WH_ADMIN', warehouseId: wh.ooty }),
      };
      const refused = {
        subElsewhere: await user(tx, { role: 'SUB_WH_ADMIN', warehouseId: wh.coonoor }),
        ended: await user(tx, { role: 'MAIN_WH_ADMIN', ended: true }),
        disabled: await user(tx, { role: 'MAIN_WH_ADMIN', status: 'DISABLED' }),
        deleted: await user(tx, { role: 'MAIN_WH_ADMIN', deleted: true }),
        noRole: await user(tx),
        farmer: await user(tx, { userType: 'FARMER', role: 'FARMER' }),
        unknown: newId(),
      };
      for (const [name, id] of Object.entries(ok)) {
        expect(await warehouseIssuesRepo.isEligibleAssignee(tx, id, wh.ooty, ISSUE_MANAGE), name).toBe(true);
      }
      for (const [name, id] of Object.entries(refused)) {
        expect(await warehouseIssuesRepo.isEligibleAssignee(tx, id, wh.ooty, ISSUE_MANAGE), name).toBe(false);
      }
      const svc = service(tx);
      const issue = await svc.create(main(ok.main), wh.ooty, { category: 'STAFFING', severity: 'LOW', title: 'Rota', assignedTo: ok.subHere });
      const error = await failure(svc.update(main(ok.main), wh.ooty, issue.id, { assignedTo: refused.subElsewhere }));
      expect(error.status).toBe(422);
      expect((await svc.update(main(ok.main), wh.ooty, issue.id, { assignedTo: null })).assignedTo).toBeNull();
    });
  });

  dbTest('BR-103d: assignee eligibility follows the warehouse.issue.manage grant in role_permissions (docs/rbac.json), not a list of role names', async () => {
    await inRolledBackTx(async (tx) => {
      await projectGrants(tx, ISSUE_MANAGE);
      const mainAdmin = await user(tx, { role: 'MAIN_WH_ADMIN' });
      const subHere = await user(tx, { role: 'SUB_WH_ADMIN', warehouseId: wh.ooty });
      const subElsewhere = await user(tx, { role: 'SUB_WH_ADMIN', warehouseId: wh.coonoor });
      const farmerAdmin = await user(tx, { userType: 'FARMER', role: 'FARMER_ADMIN' });
      const eligible = (id: string, warehouseId: string = wh.ooty) =>
        warehouseIssuesRepo.isEligibleAssignee(tx, id, warehouseId, ISSUE_MANAGE);

      // As rbac.json grants it today: Main `all`, Sub `own` (its warehouse only), Farmer Admin `none`.
      expect(await eligible(mainAdmin)).toBe(true);
      expect(await eligible(subHere)).toBe(true);
      expect(await eligible(subElsewhere)).toBe(false);
      expect(await eligible(subElsewhere, wh.coonoor)).toBe(true);
      expect(await eligible(farmerAdmin)).toBe(false);

      // Withdraw the Sub grant: the same Sub of this very warehouse is no longer assignable.
      await setGrant(tx, ISSUE_MANAGE, 'SUB_WH_ADMIN', 'none');
      expect(await eligible(subHere)).toBe(false);

      // A read-only grant does not make anyone an assignee.
      await setGrant(tx, ISSUE_MANAGE, 'MAIN_WH_ADMIN', 'view');
      expect(await eligible(mainAdmin)).toBe(false);

      // Widening Sub to `all` still confines it to its assigned warehouse (scope dimension warehouse_id).
      await setGrant(tx, ISSUE_MANAGE, 'SUB_WH_ADMIN', 'all');
      expect(await eligible(subHere)).toBe(true);
      expect(await eligible(subElsewhere)).toBe(false);

      // A grant to a role that is not warehouse-shaped (Farmer Admin, zone_id) never reaches a warehouse.
      await setGrant(tx, ISSUE_MANAGE, 'FARMER_ADMIN', 'all');
      expect(await eligible(farmerAdmin)).toBe(false);
    });
  });

  dbTest('BR-103e: warehouse_issue_comments refuses UPDATE, DELETE and TRUNCATE; comments come back oldest first; a CLOSED issue takes none', async () => {
    await inRolledBackTx(async (tx) => {
      const actorId = await user(tx, { role: 'MAIN_WH_ADMIN' });
      const svc = service(tx);
      const issue = await svc.create(main(actorId), wh.ooty, { category: 'OTHER', severity: 'LOW', title: 'Thread' });
      const c1 = await svc.addComment(main(actorId), wh.ooty, issue.id, { body: 'one' });
      await svc.addComment(main(actorId), wh.ooty, issue.id, { body: 'two' });
      // Both comments share one transaction timestamp; the order must still be insertion order.
      expect((await svc.get(main(actorId), wh.ooty, issue.id)).comments.map((c) => c.body)).toEqual(['one', 'two']);

      for (const sql of [
        `UPDATE warehouse_issue_comments SET body = 'rewritten' WHERE id = '${c1.id}'`,
        `DELETE FROM warehouse_issue_comments WHERE id = '${c1.id}'`,
        `TRUNCATE warehouse_issue_comments`,
      ]) {
        await tx.query('SAVEPOINT br103e');
        let refused = false;
        try {
          await tx.query(sql);
        } catch {
          refused = true;
        }
        await tx.query('ROLLBACK TO SAVEPOINT br103e');
        expect(refused, sql).toBe(true);
      }
      const kept = await tx.query<{ body: string }>(`SELECT body FROM warehouse_issue_comments WHERE id = $1`, [c1.id]);
      expect(kept.rows[0]!.body).toBe('one');

      await svc.update(main(actorId), wh.ooty, issue.id, { status: 'RESOLVED', resolutionNote: 'done' });
      await svc.update(main(actorId), wh.ooty, issue.id, { status: 'CLOSED' });
      expect((await failure(svc.addComment(main(actorId), wh.ooty, issue.id, { body: 'late' }))).status).toBe(409);
    });
  });

  dbTest('BR-103f: audit rows land in the same transaction, masked, one per change; a no-op writes none', async () => {
    await inRolledBackTx(async (tx) => {
      const actorId = await user(tx, { role: 'MAIN_WH_ADMIN' });
      const svc = service(tx);
      const issue = await svc.create(main(actorId), wh.ooty, { category: 'EQUIPMENT', severity: 'HIGH', title: SECRET_TITLE, description: SECRET_DESCRIPTION });
      await svc.update(main(actorId), wh.ooty, issue.id, { status: 'RESOLVED', resolutionNote: SECRET_NOTE });
      await svc.update(main(actorId), wh.ooty, issue.id, { status: 'RESOLVED', title: SECRET_TITLE }); // no-op
      await svc.addComment(main(actorId), wh.ooty, issue.id, { body: SECRET_COMMENT });
      const rows = await tx.query<{ action_code: string; warehouse_id: string; before: unknown; after: unknown; changed_fields: string[] | null }>(
        `SELECT action_code, warehouse_id::text, before, after, changed_fields FROM audit_log
          WHERE entity_type = 'warehouse_issue' AND entity_id = $1 ORDER BY action_code`,
        [issue.id],
      );
      expect(rows.rows.map((r) => r.action_code).sort()).toEqual(['warehouse.issue.comment', 'warehouse.issue.create', 'warehouse.issue.update']);
      expect(rows.rows.every((r) => r.warehouse_id === wh.ooty)).toBe(true);
      const dump = JSON.stringify(rows.rows);
      for (const secret of [SECRET_TITLE, SECRET_DESCRIPTION, SECRET_NOTE, SECRET_COMMENT]) expect(dump).not.toContain(secret);
    });
  });
});

// ===========================================================================
// 4. Real HTTP through the real app router
// ===========================================================================
describeIfDatabase('warehouse issues routes (real app router, PostgreSQL)', () => {
  let ready = false;
  let harness: HttpHarness;
  const tag = `CI-WI-${Date.now()}`;

  beforeAll(async () => {
    ready = await requireDatabaseTables('warehouse_issues', 'warehouse_issue_comments', 'warehouses');
    if (ready) harness = await startHttpHarness();
  });

  afterAll(async () => {
    if (!ready) return;
    // Issues committed through HTTP are left in place on purpose: audit_log (append-only) references
    // them by id, and warehouse_issue_comments is append-only, so the titles carry a unique tag instead.
    await harness.stop();
  });

  const dbTest = (name: string, fn: () => Promise<void>) =>
    it(name, async (context) => {
      if (!ready) context.skip();
      await fn();
    });

  const base = (warehouseId: string): string => `/v1/warehouses/${warehouseId}/issues`;

  dbTest('BR-103g (HTTP): every route is 401 without a token and 403 for farmer, customer and Farmer Admin', async () => {
    const id = '99999999-9999-4999-8999-999999999999';
    const routes: Array<{ method: 'get' | 'post' | 'patch'; path: string; body?: object }> = [
      { method: 'get', path: base(harness.warehouse.ooty) },
      { method: 'post', path: base(harness.warehouse.ooty), body: { category: 'OTHER', severity: 'LOW', title: tag } },
      { method: 'get', path: `${base(harness.warehouse.ooty)}/${id}` },
      { method: 'patch', path: `${base(harness.warehouse.ooty)}/${id}`, body: { severity: 'LOW' } },
      { method: 'post', path: `${base(harness.warehouse.ooty)}/${id}/comments`, body: { body: 'x' } },
    ];
    for (const route of routes) {
      const anonymous = await request(harness.server)[route.method](route.path).send(route.body);
      expect(anonymous.status, `${route.method} ${route.path} anonymous`).toBe(401);
      for (const role of ['farmer', 'customer', 'farmerAdmin'] as const) {
        const res = await request(harness.server)[route.method](route.path).set('Authorization', harness.auth(role)).send(route.body);
        expect(res.status, `${route.method} ${route.path} as ${role}: ${JSON.stringify(res.body)}`).toBe(403);
        expect(res.headers['content-type']).toContain('application/problem+json');
      }
    }
  });

  dbTest('BR-103b/c/e (HTTP): a Sub admin reports, works, resolves, closes and comments on its own warehouse; another warehouse is 404', async () => {
    const created = await request(harness.server)
      .post(base(harness.warehouse.ooty))
      .set('Authorization', harness.auth('subOoty'))
      .send({ category: 'EQUIPMENT', severity: 'HIGH', title: `${tag} chiller` });
    expect(created.status, JSON.stringify(created.body)).toBe(201);
    expect(created.body).toMatchObject({ status: 'OPEN', warehouseId: harness.warehouse.ooty, reportedBy: harness.actorId });
    const path = `${base(harness.warehouse.ooty)}/${created.body.id as string}`;

    const comment = await request(harness.server).post(`${path}/comments`).set('Authorization', harness.auth('subOoty')).send({ body: 'looking' });
    expect(comment.status).toBe(201);
    expect(comment.body).toMatchObject({ authorId: harness.actorId, body: 'looking' });

    const noNote = await request(harness.server).patch(path).set('Authorization', harness.auth('subOoty')).send({ status: 'RESOLVED' });
    expect(noNote.status).toBe(422);
    const resolved = await request(harness.server).patch(path).set('Authorization', harness.auth('subOoty')).send({ status: 'RESOLVED', resolutionNote: 'fixed' });
    expect(resolved.status).toBe(200);
    expect(resolved.body.resolvedBy).toBe(harness.actorId);
    const closed = await request(harness.server).patch(path).set('Authorization', harness.auth('subOoty')).send({ status: 'CLOSED' });
    expect(closed.status).toBe(200);
    const again = await request(harness.server).patch(path).set('Authorization', harness.auth('subOoty')).send({ status: 'OPEN' });
    expect(again.status).toBe(409);
    expect(again.body.code).toBe('INVALID_STATE_TRANSITION');
    const late = await request(harness.server).post(`${path}/comments`).set('Authorization', harness.auth('subOoty')).send({ body: 'late' });
    expect(late.status).toBe(409);

    const detail = await request(harness.server).get(path).set('Authorization', harness.auth('subOoty'));
    expect(detail.status).toBe(200);
    expect(detail.body.comments.map((c: { body: string }) => c.body)).toEqual(['looking']);

    const listed = await request(harness.server).get(base(harness.warehouse.ooty)).query({ q: tag }).set('Authorization', harness.auth('subOoty'));
    expect(listed.status).toBe(200);
    expect(listed.body.items.map((i: { id: string }) => i.id)).toEqual([created.body.id]);

    const bodies = new Set<string>();
    for (const p of [base(harness.warehouse.coonoor), `${base(harness.warehouse.coonoor)}/${created.body.id as string}`, base(newId())]) {
      const res = await request(harness.server).get(p).set('Authorization', harness.auth('subOoty'));
      expect(res.status, p).toBe(404);
      bodies.add(JSON.stringify({ status: res.body.status, code: res.body.code, title: res.body.title }));
    }
    expect(bodies.size).toBe(1);
    const wrongWh = await request(harness.server).get(path).set('Authorization', harness.auth('subCoonoor'));
    expect(wrongWh.status).toBe(404);
  });

  dbTest('BR-103a (HTTP): malformed bodies and queries are 422 and write nothing; there is no DELETE route', async () => {
    for (const bad of [{}, { category: 'X', severity: 'LOW', title: `${tag}-bad` }, { category: 'OTHER', severity: 'LOW', title: `${tag}-bad`, status: 'CLOSED' }]) {
      const res = await request(harness.server).post(base(harness.warehouse.gudalur)).set('Authorization', harness.auth('main')).send(bad);
      expect(res.status, JSON.stringify(bad)).toBe(422);
    }
    const { pool } = await import('../../db/pool.js');
    expect((await pool.query(`SELECT 1 FROM warehouse_issues WHERE title = $1`, [`${tag}-bad`])).rowCount).toBe(0);
    expect((await request(harness.server).get(base(harness.warehouse.gudalur)).query({ pageSize: 101 }).set('Authorization', harness.auth('main'))).status).toBe(422);

    const created = await request(harness.server).post(base(harness.warehouse.gudalur)).set('Authorization', harness.auth('main')).send({ category: 'OTHER', severity: 'LOW', title: `${tag}-keep` });
    const path = `${base(harness.warehouse.gudalur)}/${created.body.id as string}`;
    expect((await request(harness.server).patch(path).set('Authorization', harness.auth('main')).send({})).status).toBe(422);
    const del = await request(harness.server).delete(path).set('Authorization', harness.auth('superAdmin'));
    expect([404, 405]).toContain(del.status);
    expect((await request(harness.server).get(path).set('Authorization', harness.auth('main'))).status).toBe(200);
  });
});
