import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Server } from 'node:http';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { pool, type Executor } from '../../db/pool.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { aScope, databaseReady, describeIfDatabase, IDS, newId } from '../../test/factories.js';
import type {
  CreateAnswerParams,
  CreateQuestionParams,
  ModerateContentParams,
  QaAnswerRow,
  QaChatRepo,
  QaQuestionRow,
  UpdateAnswerParams,
  UpdateQuestionParams,
} from './qa-chat.repo.js';
import {
  BLOCKED_MASKED_CONTENT,
  createQaChatService,
  qaChatService,
} from './qa-chat.service.js';

// Mock token invalidation to avoid Redis timeouts in route tests
vi.mock('../../auth/tokenInvalidation.js', () => ({
  isAccessTokenInvalidated: async () => false,
  markTokensInvalidBefore: async () => undefined,
}));

function farmerScope(farmerId: string, userId = newId()): ResolvedScope {
  return aScope({
    level: ScopeLevel.OWN,
    farmerId,
    userId,
    roleCode: RoleCode.FARMER,
    permission: 'farmer.learning.qa_participate',
  });
}

function adminScope(userId = newId(), roleCode = RoleCode.SUPER_ADMIN): ResolvedScope {
  return aScope({
    level: ScopeLevel.ALL,
    userId,
    roleCode,
    permission: 'community.group.moderate',
  });
}

interface FakeDbState {
  questions: Map<string, QaQuestionRow>;
  answers: Map<string, QaAnswerRow>;
  auditLogs: unknown[];
}

function createFakeRepo(state: FakeDbState): QaChatRepo {
  return {
    async findQuestions(_db, { page, limit, communityId, contentType, contentId, q, authorUserId }) {
      let list = Array.from(state.questions.values()).filter((qRow) => qRow.deleted_at === null);
      if (communityId !== undefined) list = list.filter((qRow) => qRow.community_id === communityId);
      if (contentType !== undefined) list = list.filter((qRow) => qRow.content_type === contentType);
      if (contentId !== undefined) list = list.filter((qRow) => qRow.content_id === contentId);
      if (authorUserId !== undefined) list = list.filter((qRow) => qRow.author_user_id === authorUserId);
      if (q) {
        const query = q.toLowerCase();
        list = list.filter((qRow) => qRow.title.toLowerCase().includes(query) || qRow.content.toLowerCase().includes(query));
      }
      const total = list.length;
      const offset = (page - 1) * limit;
      return { rows: list.slice(offset, offset + limit), total };
    },

    async findQuestionById(_db, id) {
      const q = state.questions.get(id);
      if (!q || q.deleted_at !== null) return null;
      return { ...q };
    },

    async createQuestion(_db, data: CreateQuestionParams) {
      const id = newId();
      const row: QaQuestionRow = {
        id,
        community_id: data.communityId ?? null,
        content_type: data.contentType ?? null,
        content_id: data.contentId ?? null,
        title: data.title,
        content: data.content,
        author_user_id: data.authorUserId,
        author_name: 'Test Author',
        author_role: 'FARMER',
        is_blocked: false,
        blocked_by: null,
        blocked_at: null,
        block_reason: null,
        answer_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      };
      state.questions.set(id, row);
      return { ...row };
    },

    async updateQuestion(_db, id: string, patch: UpdateQuestionParams) {
      const q = state.questions.get(id);
      if (!q || q.deleted_at !== null) return null;
      if (patch.title !== undefined) q.title = patch.title;
      if (patch.content !== undefined) q.content = patch.content;
      q.updated_at = new Date().toISOString();
      return { ...q };
    },

    async softDeleteQuestion(_db, id: string) {
      const q = state.questions.get(id);
      if (!q || q.deleted_at !== null) return false;
      q.deleted_at = new Date().toISOString();
      return true;
    },

    async moderateQuestion(_db, id: string, patch: ModerateContentParams) {
      const q = state.questions.get(id);
      if (!q) return null;
      if (patch.isBlocked !== undefined) {
        q.is_blocked = patch.isBlocked;
        if (patch.isBlocked) {
          q.blocked_by = patch.moderatorUserId;
          q.blocked_at = new Date().toISOString();
          q.block_reason = patch.blockReason ?? null;
        } else {
          q.blocked_by = null;
          q.blocked_at = null;
          q.block_reason = null;
        }
      }
      if (patch.softDelete) {
        q.deleted_at = new Date().toISOString();
      }
      q.updated_at = new Date().toISOString();
      return { ...q };
    },

    async findAnswersByQuestionId(_db, questionId: string) {
      const list = Array.from(state.answers.values())
        .filter((a) => a.question_id === questionId && a.deleted_at === null)
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
      return list.map((a) => ({ ...a }));
    },

    async findAnswerById(_db, id: string) {
      const a = state.answers.get(id);
      if (!a || a.deleted_at !== null) return null;
      return { ...a };
    },

    async createAnswer(_db, data: CreateAnswerParams) {
      const id = newId();
      const row: QaAnswerRow = {
        id,
        question_id: data.questionId,
        content: data.content,
        author_user_id: data.authorUserId,
        author_name: 'Test Replier',
        author_role: 'FARMER',
        is_blocked: false,
        blocked_by: null,
        blocked_at: null,
        block_reason: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      };
      state.answers.set(id, row);
      const q = state.questions.get(data.questionId);
      if (q) q.answer_count = (q.answer_count ?? 0) + 1;
      return { ...row };
    },

    async updateAnswer(_db, id: string, patch: UpdateAnswerParams) {
      const a = state.answers.get(id);
      if (!a || a.deleted_at !== null) return null;
      a.content = patch.content;
      a.updated_at = new Date().toISOString();
      return { ...a };
    },

    async softDeleteAnswer(_db, id: string) {
      const a = state.answers.get(id);
      if (!a || a.deleted_at !== null) return false;
      a.deleted_at = new Date().toISOString();
      const q = state.questions.get(a.question_id);
      if (q && q.answer_count > 0) q.answer_count -= 1;
      return true;
    },

    async moderateAnswer(_db, id: string, patch: ModerateContentParams) {
      const a = state.answers.get(id);
      if (!a) return null;
      if (patch.isBlocked !== undefined) {
        a.is_blocked = patch.isBlocked;
        if (patch.isBlocked) {
          a.blocked_by = patch.moderatorUserId;
          a.blocked_at = new Date().toISOString();
          a.block_reason = patch.blockReason ?? null;
        } else {
          a.blocked_by = null;
          a.blocked_at = null;
          a.block_reason = null;
        }
      }
      if (patch.softDelete) {
        a.deleted_at = new Date().toISOString();
      }
      a.updated_at = new Date().toISOString();
      return { ...a };
    },
  };
}

function createTestContext() {
  const state: FakeDbState = {
    questions: new Map(),
    answers: new Map(),
    auditLogs: [],
  };
  const repo = createFakeRepo(state);
  const fakeTx: Executor = {
    query: async (_sql: string, params?: unknown[]) => {
      state.auditLogs.push(params ?? []);
      return { rows: [{ id: newId() }], rowCount: 1 } as never;
    },
  };

  const service = createQaChatService({
    repo,
    db: fakeTx,
    runTx: async (fn) => fn(fakeTx),
  });

  return { state, repo, service, audits: state.auditLogs };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Business Rules Unit Tests (BR-59u)
// ─────────────────────────────────────────────────────────────────────────────
describe('Q&A Chat service & business logic (BR-59u)', () => {
  const farmerA = farmerScope(IDS.farmer, newId());
  const farmerB = farmerScope('40000000-0000-4000-8000-000000000002', newId());
  const admin = adminScope(newId(), RoleCode.SUPER_ADMIN);

  it('anyone can answer: farmer asks, other farmer answers, admin answers', async () => {
    const { service } = createTestContext();

    // Farmer A asks a question
    const q = await service.askQuestion(farmerA, {
      title: 'How to tackle tomato blight in rainy season?',
      content: 'I noticed brown spots on lower leaves...',
      contentType: 'articles',
      contentId: newId(),
    });
    expect(q.title).toBe('How to tackle tomato blight in rainy season?');
    expect(q.author.id).toBe(farmerA.userId);
    expect(q.isBlocked).toBe(false);

    // Farmer B answers
    const ansFarmer = await service.postAnswer(farmerB, q.id, {
      content: 'Apply copper hydroxide spray and ensure good spacing.',
    });
    expect(ansFarmer.content).toBe('Apply copper hydroxide spray and ensure good spacing.');
    expect(ansFarmer.author.id).toBe(farmerB.userId);

    // Admin answers
    const ansAdmin = await service.postAnswer(admin, q.id, {
      content: 'Recommended organic fungicide schedule is detailed in our guide.',
    });
    expect(ansAdmin.author.id).toBe(admin.userId);

    // Detail includes both answers
    const detail = await service.getQuestion(farmerA, q.id);
    expect(detail.answers).toHaveLength(2);
  });

  it('authorship: farmer can edit own question; other farmer receives 403 FORBIDDEN', async () => {
    const { service } = createTestContext();

    const q = await service.askQuestion(farmerA, {
      title: 'Original Title',
      content: 'Original Content',
    });

    // Farmer A edits own question -> succeeds
    const updated = await service.updateQuestion(farmerA, q.id, {
      title: 'Updated Title',
      content: 'Updated Content',
    });
    expect(updated.title).toBe('Updated Title');

    // Farmer B attempts to edit Farmer A question -> 403 FORBIDDEN
    await expect(
      service.updateQuestion(farmerB, q.id, { title: 'Malicious Change' }),
    ).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
    });
  });

  it('authorship: farmer can delete own question; other farmer receives 403 FORBIDDEN', async () => {
    const { service } = createTestContext();

    const q = await service.askQuestion(farmerA, {
      title: 'Delete me',
      content: 'Content',
    });

    // Farmer B cannot delete Farmer A question
    await expect(service.deleteQuestion(farmerB, q.id)).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
    });

    // Farmer A can delete own question
    await service.deleteQuestion(farmerA, q.id);
    await expect(service.getQuestion(farmerA, q.id)).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
  });

  it('moderation: moderator blocks a question -> regular reader sees masked text; moderator sees original + reason', async () => {
    const { service, audits } = createTestContext();

    const q = await service.askQuestion(farmerA, {
      title: 'Suspicious promotion',
      content: 'Buy chemical X at 50% off call 9999999999',
    });

    // Moderator blocks question
    const moderated = await service.moderateQuestion(admin, q.id, {
      isBlocked: true,
      blockReason: 'Spam / Commercial solicitation',
    });
    expect(moderated.isBlocked).toBe(true);
    expect(moderated.blockReason).toBe('Spam / Commercial solicitation');

    // Audit log was recorded
    const modAudit = audits.find((a) => JSON.stringify(a).includes('qa.question.moderate'));
    expect(modAudit).toBeDefined();

    // Regular farmer reads question -> receives masked content and null blockReason
    const farmerView = await service.getQuestion(farmerB, q.id);
    expect(farmerView.content).toBe(BLOCKED_MASKED_CONTENT);
    expect(farmerView.blockReason).toBeNull();
    expect(farmerView.isBlocked).toBe(true);

    // Moderator reads question -> receives original content and blockReason
    const modView = await service.getQuestion(admin, q.id);
    expect(modView.content).toBe('Buy chemical X at 50% off call 9999999999');
    expect(modView.blockReason).toBe('Spam / Commercial solicitation');

    // Moderator unblocks question -> content restored for regular reader
    await service.moderateQuestion(admin, q.id, { isBlocked: false });
    const restoredFarmerView = await service.getQuestion(farmerB, q.id);
    expect(restoredFarmerView.content).toBe('Buy chemical X at 50% off call 9999999999');
    expect(restoredFarmerView.isBlocked).toBe(false);
  });

  it('moderator can soft-delete question and audit log is written', async () => {
    const { service, audits } = createTestContext();

    const q = await service.askQuestion(farmerA, {
      title: 'Offensive Post',
      content: 'Hate speech',
    });

    await service.deleteQuestion(admin, q.id);

    const deleteAudit = audits.find((a) => JSON.stringify(a).includes('qa.question.delete'));
    expect(deleteAudit).toBeDefined();

    await expect(service.getQuestion(farmerA, q.id)).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
  });

  it('answers: farmer edits own answer; non-author gets 403; moderator blocks answer with masking', async () => {
    const { service } = createTestContext();

    const q = await service.askQuestion(farmerA, { title: 'Q', content: 'C' });
    const ans = await service.postAnswer(farmerB, q.id, { content: 'Original Answer' });

    // Farmer B edits own answer
    const updated = await service.updateAnswer(farmerB, ans.id, { content: 'Corrected Answer' });
    expect(updated.content).toBe('Corrected Answer');

    // Farmer A cannot edit Farmer B answer
    await expect(service.updateAnswer(farmerA, ans.id, { content: 'Hacked Answer' })).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
    });

    // Moderator blocks answer
    await service.moderateAnswer(admin, ans.id, {
      isBlocked: true,
      blockReason: 'Misleading agronomy claim',
    });

    // Regular reader sees masked answer
    const detail = await service.getQuestion(farmerA, q.id);
    expect(detail.answers[0]?.content).toBe(BLOCKED_MASKED_CONTENT);
    expect(detail.answers[0]?.blockReason).toBeNull();

    // Moderator sees original
    const modDetail = await service.getQuestion(admin, q.id);
    expect(modDetail.answers[0]?.content).toBe('Corrected Answer');
    expect(modDetail.answers[0]?.blockReason).toBe('Misleading agronomy claim');
  });

  it('BR-16: author representation protects farm anonymity', async () => {
    const { service } = createTestContext();

    const q = await service.askQuestion(farmerA, { title: 'Organic Mulch', content: 'Best depth?' });
    expect(q.author).toEqual({
      id: farmerA.userId,
      displayName: 'Test Author',
      role: 'FARMER',
    });
    // Verify no farm, GPS, village, or financial properties leaked
    const rawKeys = Object.keys(q.author);
    expect(rawKeys).toEqual(['id', 'displayName', 'role']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. HTTP Routes & RBAC Tests
// ─────────────────────────────────────────────────────────────────────────────
describe('Q&A Chat HTTP routes & RBAC (BR-59u)', () => {
  let server: Server;

  const testId = newId();

  function makeToken(role: RoleCode, extra: { farmerId?: string | null; customerId?: string | null } = {}) {
    return signAccessToken({
      sub: newId(),
      roles: [{ code: role }],
      farmerId: extra.farmerId ?? null,
      customerId: extra.customerId ?? null,
    });
  }

  const tokens = {
    superAdmin: makeToken(RoleCode.SUPER_ADMIN),
    tohfaAdmin: makeToken(RoleCode.TOHFA_ADMIN),
    farmerAdmin: makeToken(RoleCode.FARMER_ADMIN),
    mainWhAdmin: makeToken(RoleCode.MAIN_WH_ADMIN),
    subWhAdmin: makeToken(RoleCode.SUB_WH_ADMIN),
    farmer: makeToken(RoleCode.FARMER, { farmerId: IDS.farmer }),
    customer: makeToken(RoleCode.CUSTOMER, { customerId: newId() }),
  };

  beforeAll(() => {
    server = createApp().listen(0);
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /v1/farmers/me/qa/questions is 401 unauth and 403 for CUSTOMER and WH admins', async () => {
    // 401 unauth
    expect((await request(server).get('/v1/farmers/me/qa/questions')).status).toBe(401);

    // 403 for unauthorized roles
    for (const token of [tokens.customer, tokens.mainWhAdmin, tokens.subWhAdmin]) {
      const res = await request(server).get('/v1/farmers/me/qa/questions').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    }

    // 200 for FARMER
    vi.spyOn(qaChatService, 'listQuestions').mockResolvedValue({ items: [], total: 0, page: 1, limit: 20 });
    const resFarmer = await request(server)
      .get('/v1/farmers/me/qa/questions')
      .set('Authorization', `Bearer ${tokens.farmer}`);
    expect(resFarmer.status).toBe(200);
  });

  it('POST /v1/farmers/me/qa/questions is 201 for FARMER and 403 for CUSTOMER', async () => {
    const dummySummary = {
      id: testId,
      communityId: null,
      contentType: null,
      contentId: null,
      title: 'Tomato query',
      content: 'Blight issue',
      author: { id: newId(), displayName: 'Farmer A', role: 'FARMER' as const },
      answerCount: 0,
      isBlocked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    vi.spyOn(qaChatService, 'askQuestion').mockResolvedValue(dummySummary);

    // 403 for CUSTOMER
    const resCust = await request(server)
      .post('/v1/farmers/me/qa/questions')
      .set('Authorization', `Bearer ${tokens.customer}`)
      .send({ title: 'Tomato query', content: 'Blight issue' });
    expect(resCust.status).toBe(403);

    // 201 for FARMER
    const resFarmer = await request(server)
      .post('/v1/farmers/me/qa/questions')
      .set('Authorization', `Bearer ${tokens.farmer}`)
      .send({ title: 'Tomato query', content: 'Blight issue' });
    expect(resFarmer.status).toBe(201);
  });

  it('admin routes /v1/admin/qa/questions reject non-admins with 403 and allow SUPER_ADMIN/TOHFA_ADMIN', async () => {
    vi.spyOn(qaChatService, 'listQuestions').mockResolvedValue({ items: [], total: 0, page: 1, limit: 20 });

    // 403 for FARMER and CUSTOMER
    for (const token of [tokens.farmer, tokens.customer, tokens.mainWhAdmin, tokens.subWhAdmin]) {
      const res = await request(server).get('/v1/admin/qa/questions').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    }

    // 200 for SUPER_ADMIN and TOHFA_ADMIN
    for (const token of [tokens.superAdmin, tokens.tohfaAdmin]) {
      const res = await request(server).get('/v1/admin/qa/questions').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    }
  });

  it('admin moderation route /v1/admin/qa/questions/:id/moderate is 403 for FARMER and 200 for SUPER_ADMIN', async () => {
    vi.spyOn(qaChatService, 'moderateQuestion').mockResolvedValue({ id: testId } as never);

    const resFarmer = await request(server)
      .patch(`/v1/admin/qa/questions/${testId}/moderate`)
      .set('Authorization', `Bearer ${tokens.farmer}`)
      .send({ isBlocked: true, blockReason: 'Inappropriate' });
    expect(resFarmer.status).toBe(403);

    const resAdmin = await request(server)
      .patch(`/v1/admin/qa/questions/${testId}/moderate`)
      .set('Authorization', `Bearer ${tokens.superAdmin}`)
      .send({ isBlocked: true, blockReason: 'Inappropriate' });
    expect(resAdmin.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. PostgreSQL Integration Tests (Real SQL)
// ─────────────────────────────────────────────────────────────────────────────
describeIfDatabase('Q&A Chat (Integration, real SQL)', () => {
  let ready = false;
  const ts = Date.now();
  const service = qaChatService;
  const userIds: string[] = [];
  const farmerIds: string[] = [];
  const questionIds: string[] = [];
  let admin: ResolvedScope;
  let farmer: ResolvedScope;

  beforeAll(async () => {
    ready = await databaseReady('qa_questions');
    if (!ready) return;

    const adminUser = newId();
    userIds.push(adminUser);
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, 'QA Admin', 'ADMIN', 'ACTIVE')`,
      [adminUser, `+9173${String(ts).slice(-8)}`],
    );
    admin = aScope({
      level: ScopeLevel.ALL,
      permission: 'community.group.moderate',
      roleCode: RoleCode.SUPER_ADMIN,
      userId: adminUser,
    });

    const farmerUser = newId();
    userIds.push(farmerUser);
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, 'QA Farmer', 'FARMER', 'ACTIVE')`,
      [farmerUser, `+9172${String(ts).slice(-8)}`],
    );
    const farmerId = (
      await pool.query<{ id: string }>(
        `INSERT INTO farmers (user_id, tohfa_farmer_id, application_status, approved_by, approved_at)
         VALUES ($1, $2, 'APPROVED', $3, now()) RETURNING id`,
        [farmerUser, `TF-QA-${ts}`, adminUser],
      )
    ).rows[0]!.id;
    farmerIds.push(farmerId);
    farmer = farmerScope(farmerId, farmerUser);
  });

  afterAll(async () => {
    if (!ready) return;
    await pool.query(`DELETE FROM qa_questions WHERE id = ANY($1::uuid[])`, [questionIds]);
    await pool.query(`DELETE FROM farmers WHERE id = ANY($1::uuid[])`, [farmerIds]);
  });

  it('persists a question and an answer, updates question answer_count, and cascades', async () => {
    if (!ready) return;

    const createdQ = await service.askQuestion(farmer, {
      title: `Real SQL Q&A test ${ts}`,
      content: 'Testing questions and answers in real PostgreSQL',
    });
    questionIds.push(createdQ.id);

    expect(createdQ.id).toBeTruthy();
    expect(createdQ.author.displayName).toBe('QA Farmer');

    const createdAns = await service.postAnswer(admin, createdQ.id, {
      content: 'Real SQL answer from admin',
    });
    expect(createdAns.author.displayName).toBe('QA Admin');

    const detail = await service.getQuestion(farmer, createdQ.id);
    expect(detail.answerCount).toBe(1);
    expect(detail.answers).toHaveLength(1);
    expect(detail.answers[0]?.content).toBe('Real SQL answer from admin');

    // Moderate block
    await service.moderateQuestion(admin, createdQ.id, {
      isBlocked: true,
      blockReason: 'Verified real block',
    });
    const farmerRead = await service.getQuestion(farmer, createdQ.id);
    expect(farmerRead.content).toBe(BLOCKED_MASKED_CONTENT);

    const adminRead = await service.getQuestion(admin, createdQ.id);
    expect(adminRead.content).toBe('Testing questions and answers in real PostgreSQL');
    expect(adminRead.blockReason).toBe('Verified real block');
  });
});
