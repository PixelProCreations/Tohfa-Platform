import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { pool, type Executor } from '../../db/pool.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { loadRbac } from '../../rbac/loadRbac.js';
import { aScope, databaseReady, describeIfDatabase, IDS, newId } from '../../test/factories.js';
import type {
  ArticleRow,
  ArticleSummaryRow,
  CropRefRow,
  EnrollmentRow,
  GroupRow,
  LearningHubRepo,
  MembershipRow,
  TrainingRow,
  VideoRow,
} from './learning-hub.repo.js';
import { createLearningHubService, learningHubService } from './learning-hub.service.js';

const FARMER_A = IDS.farmer;
const FARMER_B = '30000000-0000-4000-8000-000000000002';

/** The level docs/rbac.json really grants a FARMER for `permission` (own for participate_own). */
function farmerGrant(permission: string): Exclude<ScopeLevel, 'none'> {
  const level = loadRbac().permission(permission).grants[RoleCode.FARMER];
  if (level === undefined || level === ScopeLevel.NONE) throw new Error(`FARMER has no grant for ${permission}`);
  return level;
}

function farmerScope(farmerId: string, permission = 'farmer.learning.participate_own'): ResolvedScope {
  return aScope({
    level: farmerGrant(permission),
    farmerId,
    userId: newId(),
    roleCode: RoleCode.FARMER,
    permission,
  });
}

function adminScope(): ResolvedScope {
  return aScope({
    level: ScopeLevel.ALL,
    userId: newId(),
    roleCode: RoleCode.TOHFA_ADMIN,
    permission: 'learning.admin.manage',
  });
}

interface FakeDbState {
  articles: Map<string, ArticleRow>;
  videos: Map<string, VideoRow>;
  trainings: Map<string, TrainingRow>;
  enrollments: Map<string, EnrollmentRow>;
  groups: Map<string, GroupRow>;
  memberships: Map<string, MembershipRow>;
  /** BR-59r: the crop taxonomy. `deleted` stands in for `crop_master.deleted_at`. */
  crops: Map<string, { ref: CropRefRow; deleted: boolean }>;
  articleCrops: Map<string, string[]>;
  videoCrops: Map<string, string[]>;
  auditLogs: unknown[][];
}

function createFakeRepo(state: FakeDbState): LearningHubRepo {
  /** Mirrors the real `ORDER BY cm.name` and the "a deleted crop is not a chip" read rule. */
  const chipsFor = (ids: string[]): CropRefRow[] =>
    ids
      .map((id) => state.crops.get(id))
      .filter((c): c is { ref: CropRefRow; deleted: boolean } => c !== undefined && !c.deleted)
      .map((c) => c.ref)
      .sort((a, b) => a.name.localeCompare(b.name));

  return {
    async findLiveCropIds(_db, cropIds) {
      return cropIds.filter((id) => {
        const crop = state.crops.get(id);
        return crop !== undefined && !crop.deleted;
      });
    },

    async replaceArticleCrops(_db, articleId, cropIds) {
      state.articleCrops.set(articleId, [...cropIds]);
      return chipsFor(cropIds);
    },

    async replaceVideoCrops(_db, videoId, cropIds) {
      state.videoCrops.set(videoId, [...cropIds]);
      return chipsFor(cropIds);
    },

    async findArticles(_db, { page, limit, language, tag, publishedOnly = true, reviewStatus }) {
      let list = Array.from(state.articles.values());
      if (publishedOnly) list = list.filter((a) => a.is_published);
      if (reviewStatus) list = list.filter((a) => (a.review_status ?? 'NOT_SUBMITTED') === reviewStatus);
      if (language) list = list.filter((a) => a.language === language);
      if (tag) list = list.filter((a) => a.tag === tag);
      const total = list.length;
      const offset = (page - 1) * limit;
      const rows = list.slice(offset, offset + limit).map(({ content: _content, ...summary }): ArticleSummaryRow => summary);
      return { rows, total };
    },

    async findArticleById(_db, id, publishedOnly = true) {
      const art = state.articles.get(id);
      if (!art) return null;
      if (publishedOnly && !art.is_published) return null;
      return { ...art, crops: chipsFor(state.articleCrops.get(id) ?? []) };
    },

    async createArticle(_db, body) {
      const id = newId();
      const row: ArticleRow = {
        id,
        title: body.title,
        content: body.content,
        snippet: body.snippet ?? null,
        read_time: body.readTime,
        author: body.author,
        tag: body.tag,
        language: body.language ?? 'en',
        is_published: body.isPublished ?? true,
        review_status: 'NOT_SUBMITTED',
        submitted_for_review_at: null,
        reviewed_by: null,
        reviewed_at: null,
        review_note: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      state.articles.set(id, row);
      return { ...row };
    },

    async updateArticle(_db, id, patch) {
      const art = state.articles.get(id);
      if (!art) return null;
      if (patch.title !== undefined) art.title = patch.title;
      if (patch.content !== undefined) art.content = patch.content;
      if ('snippet' in patch) art.snippet = patch.snippet ?? null;
      if (patch.readTime !== undefined) art.read_time = patch.readTime;
      if (patch.author !== undefined) art.author = patch.author;
      if (patch.tag !== undefined) art.tag = patch.tag;
      if (patch.language !== undefined) art.language = patch.language;
      if (patch.isPublished !== undefined) art.is_published = patch.isPublished;
      art.updated_at = new Date().toISOString();
      // The real UPDATE ... RETURNING carries the crop chips as a column, so the
      // fake must too, or "omitted cropIds leaves the tags alone" cannot be seen.
      return { ...art, crops: chipsFor(state.articleCrops.get(id) ?? []) };
    },

    async deleteArticle(_db, id) {
      return state.articles.delete(id);
    },

    async findVideos(_db, { page, limit, language, publishedOnly = true, reviewStatus }) {
      let list = Array.from(state.videos.values());
      if (publishedOnly) list = list.filter((v) => v.is_published);
      if (reviewStatus) list = list.filter((v) => (v.review_status ?? 'NOT_SUBMITTED') === reviewStatus);
      if (language) list = list.filter((v) => v.language === language);
      const total = list.length;
      const offset = (page - 1) * limit;
      return { rows: list.slice(offset, offset + limit), total };
    },

    async findVideoById(_db, id) {
      const v = state.videos.get(id);
      return v ? { ...v, crops: chipsFor(state.videoCrops.get(id) ?? []) } : null;
    },

    async createVideo(_db, body) {
      const id = newId();
      const row: VideoRow = {
        id,
        title: body.title,
        description: body.description ?? null,
        video_url: body.videoUrl,
        duration: body.duration,
        author: body.author,
        language: body.language ?? 'en',
        is_featured: body.isFeatured ?? false,
        is_published: body.isPublished ?? true,
        review_status: 'NOT_SUBMITTED',
        submitted_for_review_at: null,
        reviewed_by: null,
        reviewed_at: null,
        review_note: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      state.videos.set(id, row);
      return { ...row };
    },

    async updateVideo(_db, id, patch) {
      const v = state.videos.get(id);
      if (!v) return null;
      if (patch.title !== undefined) v.title = patch.title;
      if ('description' in patch) v.description = patch.description ?? null;
      if (patch.videoUrl !== undefined) v.video_url = patch.videoUrl;
      if (patch.duration !== undefined) v.duration = patch.duration;
      if (patch.author !== undefined) v.author = patch.author;
      if (patch.language !== undefined) v.language = patch.language;
      if (patch.isFeatured !== undefined) v.is_featured = patch.isFeatured;
      if (patch.isPublished !== undefined) v.is_published = patch.isPublished;
      v.updated_at = new Date().toISOString();
      return { ...v, crops: chipsFor(state.videoCrops.get(id) ?? []) };
    },

    async deleteVideo(_db, id) {
      return state.videos.delete(id);
    },

    async findTrainings(_db, { page, limit, language, publishedOnly = true, farmerId, reviewStatus }) {
      let list = Array.from(state.trainings.values());
      if (publishedOnly) list = list.filter((t) => t.is_published);
      if (reviewStatus) list = list.filter((t) => (t.review_status ?? 'NOT_SUBMITTED') === reviewStatus);
      if (language) list = list.filter((t) => t.language === language);
      const total = list.length;
      const offset = (page - 1) * limit;
      const rows = list.slice(offset, offset + limit).map((t) => {
        const enrolled = Array.from(state.enrollments.values()).filter((e) => e.training_id === t.id);
        const isEnrolled = farmerId ? enrolled.some((e) => e.farmer_id === farmerId) : false;
        return {
          ...t,
          enrolled_count: enrolled.length,
          is_enrolled: isEnrolled,
        };
      });
      return { rows, total };
    },

    async findTrainingById(_db, id, farmerId) {
      const t = state.trainings.get(id);
      if (!t) return null;
      const enrolled = Array.from(state.enrollments.values()).filter((e) => e.training_id === t.id);
      const isEnrolled = farmerId ? enrolled.some((e) => e.farmer_id === farmerId) : false;
      return {
        ...t,
        enrolled_count: enrolled.length,
        is_enrolled: isEnrolled,
      };
    },

    async createTraining(_db, body) {
      const id = newId();
      const row: TrainingRow = {
        id,
        title: body.title,
        description: body.description ?? null,
        training_date: body.trainingDate,
        start_time: body.startTime,
        end_time: body.endTime ?? null,
        mode: body.mode,
        location: body.location,
        instructor: body.instructor,
        capacity: body.capacity ?? null,
        language: body.language ?? 'en',
        is_published: body.isPublished ?? true,
        review_status: 'NOT_SUBMITTED',
        submitted_for_review_at: null,
        reviewed_by: null,
        reviewed_at: null,
        review_note: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        enrolled_count: 0,
        is_enrolled: false,
      };
      state.trainings.set(id, row);
      return { ...row };
    },

    async updateTraining(_db, id, patch) {
      const t = state.trainings.get(id);
      if (!t) return null;
      if (patch.title !== undefined) t.title = patch.title;
      if ('description' in patch) t.description = patch.description ?? null;
      if (patch.trainingDate !== undefined) t.training_date = patch.trainingDate;
      if (patch.startTime !== undefined) t.start_time = patch.startTime;
      if ('endTime' in patch) t.end_time = patch.endTime ?? null;
      if (patch.mode !== undefined) t.mode = patch.mode;
      if (patch.location !== undefined) t.location = patch.location;
      if (patch.instructor !== undefined) t.instructor = patch.instructor;
      if ('capacity' in patch) t.capacity = patch.capacity ?? null;
      if (patch.language !== undefined) t.language = patch.language;
      if (patch.isPublished !== undefined) t.is_published = patch.isPublished;
      t.updated_at = new Date().toISOString();
      return { ...t };
    },

    async deleteTraining(_db, id) {
      return state.trainings.delete(id);
    },

    async countTrainingEnrollments(_db, trainingId) {
      return Array.from(state.enrollments.values()).filter((e) => e.training_id === trainingId).length;
    },

    async lockTraining(_db, trainingId) {
      const t = state.trainings.get(trainingId);
      return t ? { id: t.id, capacity: t.capacity, is_published: t.is_published } : null;
    },

    async findEnrollment(_db, trainingId, farmerId) {
      return state.enrollments.get(`${trainingId}:${farmerId}`) ?? null;
    },

    async enrollFarmerInTraining(_db, trainingId, farmerId) {
      const key = `${trainingId}:${farmerId}`;
      const row: EnrollmentRow = {
        id: newId(),
        training_id: trainingId,
        farmer_id: farmerId,
        enrolled_at: new Date().toISOString(),
      };
      state.enrollments.set(key, row);
      return row;
    },

    async unenrollFarmerFromTraining(_db, trainingId, farmerId) {
      const key = `${trainingId}:${farmerId}`;
      return state.enrollments.delete(key);
    },

    async findGroups(_db, { page, limit, category, farmerId, reviewStatus }) {
      let list = Array.from(state.groups.values());
      if (category) list = list.filter((g) => g.category === category);
      if (reviewStatus) list = list.filter((g) => (g.review_status ?? 'NOT_SUBMITTED') === reviewStatus);
      const total = list.length;
      const offset = (page - 1) * limit;
      const rows = list.slice(offset, offset + limit).map((g) => {
        const members = Array.from(state.memberships.values()).filter((m) => m.group_id === g.id);
        const isJoined = farmerId ? members.some((m) => m.farmer_id === farmerId) : false;
        return {
          ...g,
          member_count: members.length,
          is_joined: isJoined,
        };
      });
      return { rows, total };
    },

    async findGroupById(_db, id, farmerId) {
      const g = state.groups.get(id);
      if (!g) return null;
      const members = Array.from(state.memberships.values()).filter((m) => m.group_id === g.id);
      const isJoined = farmerId ? members.some((m) => m.farmer_id === farmerId) : false;
      return {
        ...g,
        member_count: members.length,
        is_joined: isJoined,
      };
    },

    async createGroup(_db, body) {
      const id = newId();
      const row: GroupRow = {
        id,
        name: body.name,
        description: body.description ?? null,
        category: body.category,
        review_status: 'NOT_SUBMITTED',
        submitted_for_review_at: null,
        reviewed_by: null,
        reviewed_at: null,
        review_note: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        member_count: 0,
        is_joined: false,
      };
      state.groups.set(id, row);
      return { ...row };
    },

    async updateGroup(_db, id, patch) {
      const g = state.groups.get(id);
      if (!g) return null;
      if (patch.name !== undefined) g.name = patch.name;
      if ('description' in patch) g.description = patch.description ?? null;
      if (patch.category !== undefined) g.category = patch.category;
      g.updated_at = new Date().toISOString();
      return { ...g };
    },

    async deleteGroup(_db, id) {
      return state.groups.delete(id);
    },

    async archiveGroup(_db, id) {
      const g = state.groups.get(id);
      if (!g) return null;
      const updated = { ...g, archived_at: new Date().toISOString() };
      state.groups.set(id, updated);
      return updated;
    },

    async countGroupMembers(_db, groupId) {
      let count = 0;
      for (const m of state.memberships.values()) {
        if (m.group_id === groupId) count += 1;
      }
      return count;
    },

    async joinGroup(_db, groupId, farmerId) {
      const key = `${groupId}:${farmerId}`;
      const existing = state.memberships.get(key);
      if (existing) return { membership: existing, created: false };
      const row: MembershipRow = {
        id: newId(),
        group_id: groupId,
        farmer_id: farmerId,
        joined_at: new Date().toISOString(),
      };
      state.memberships.set(key, row);
      return { membership: row, created: true };
    },

    async leaveGroup(_db, groupId, farmerId) {
      const key = `${groupId}:${farmerId}`;
      return state.memberships.delete(key);
    },

    async submitReview(_db, type, id, note) {
      const now = new Date().toISOString();
      if (type === 'articles') {
        const item = state.articles.get(id);
        if (!item) return null;
        item.review_status = 'PENDING_REVIEW';
        item.submitted_for_review_at = now;
        if (note !== undefined) item.review_note = note;
        item.updated_at = now;
        return { ...item, crops: chipsFor(state.articleCrops.get(id) ?? []) };
      }
      if (type === 'videos') {
        const item = state.videos.get(id);
        if (!item) return null;
        item.review_status = 'PENDING_REVIEW';
        item.submitted_for_review_at = now;
        if (note !== undefined) item.review_note = note;
        item.updated_at = now;
        return { ...item, crops: chipsFor(state.videoCrops.get(id) ?? []) };
      }
      if (type === 'trainings') {
        const item = state.trainings.get(id);
        if (!item) return null;
        item.review_status = 'PENDING_REVIEW';
        item.submitted_for_review_at = now;
        if (note !== undefined) item.review_note = note;
        item.updated_at = now;
        return { ...item };
      }
      const item = state.groups.get(id);
      if (!item) return null;
      item.review_status = 'PENDING_REVIEW';
      item.submitted_for_review_at = now;
      if (note !== undefined) item.review_note = note;
      item.updated_at = now;
      return { ...item };
    },

    async reviewContent(_db, type, id, status, reviewerId, note) {
      const now = new Date().toISOString();
      if (type === 'articles') {
        const item = state.articles.get(id);
        if (!item) return null;
        item.review_status = status;
        item.reviewed_by = reviewerId;
        item.reviewed_at = now;
        item.review_note = note ?? null;
        item.updated_at = now;
        return { ...item, crops: chipsFor(state.articleCrops.get(id) ?? []) };
      }
      if (type === 'videos') {
        const item = state.videos.get(id);
        if (!item) return null;
        item.review_status = status;
        item.reviewed_by = reviewerId;
        item.reviewed_at = now;
        item.review_note = note ?? null;
        item.updated_at = now;
        return { ...item, crops: chipsFor(state.videoCrops.get(id) ?? []) };
      }
      if (type === 'trainings') {
        const item = state.trainings.get(id);
        if (!item) return null;
        item.review_status = status;
        item.reviewed_by = reviewerId;
        item.reviewed_at = now;
        item.review_note = note ?? null;
        item.updated_at = now;
        return { ...item };
      }
      const item = state.groups.get(id);
      if (!item) return null;
      item.review_status = status;
      item.reviewed_by = reviewerId;
      item.reviewed_at = now;
      item.review_note = note ?? null;
      item.updated_at = now;
      return { ...item };
    },
  };
}

function createTestContext() {
  const state: FakeDbState = {
    articles: new Map(),
    videos: new Map(),
    trainings: new Map(),
    enrollments: new Map(),
    groups: new Map(),
    memberships: new Map(),
    crops: new Map(),
    articleCrops: new Map(),
    videoCrops: new Map(),
    auditLogs: [],
  };
  const repo = createFakeRepo(state);
  // Everything the service sends straight to the executor is an audit INSERT:
  // all other SQL lives in the repo, which is faked above.
  const fakeTx: Executor = {
    query: async (_sql: string, params?: unknown[]) => {
      state.auditLogs.push(params ?? []);
      return { rows: [{ id: newId() }], rowCount: 1 } as never;
    },
  };

  const service = createLearningHubService({
    repo,
    db: fakeTx,
    runTx: async (fn) => fn(fakeTx),
  });

  return { state, repo, service, audits: state.auditLogs };
}

const NOT_FOUND = { status: 404, code: 'NOT_FOUND' };

const baseTraining = {
  title: 'Terrace Drip Workshop',
  description: 'Hands on maintenance',
  trainingDate: '2026-10-25',
  startTime: '10:00 AM',
  endTime: '01:00 PM',
  mode: 'IN_FIELD' as const,
  location: 'Ooty Model Farm',
  instructor: 'Engineering Team',
  capacity: 1 as number | null,
  language: 'en' as const,
  isPublished: true,
};

describe('Learning Hub (BR-59)', () => {
  it('BR-59a: allows farmers to browse published articles and videos with language filtering', async () => {
    const { service, state } = createTestContext();

    const artEn = await service.createArticle(adminScope(), {
      title: 'Organic Compost Techniques',
      content: 'Step by step guide to aerated compost...',
      snippet: 'Guide to compost',
      readTime: '5 min read',
      author: 'Dr. Anand',
      tag: 'Soil Health',
      language: 'en',
      isPublished: true,
    });
    await service.createArticle(adminScope(), {
      title: 'இயற்கை உரம் தயாரிப்பு',
      content: 'உரம் தயாரிக்கும் வழிமுறைகள்...',
      snippet: 'உரம் வழிகாட்டி',
      readTime: '6 min read',
      author: 'முத்து',
      tag: 'Soil Health',
      language: 'ta',
      isPublished: true,
    });
    await service.createArticle(adminScope(), {
      title: 'Draft Article (Unpublished)',
      content: 'Draft content...',
      readTime: '3 min read',
      author: 'Editor',
      tag: 'General',
      language: 'en',
      isPublished: false,
    });

    const enArticles = await service.listArticles({ page: 1, limit: 10, language: 'en' });
    expect(enArticles.items).toHaveLength(1);
    expect(enArticles.items[0]?.title).toBe('Organic Compost Techniques');

    const taArticles = await service.listArticles({ page: 1, limit: 10, language: 'ta' });
    expect(taArticles.items).toHaveLength(1);
    expect(taArticles.items[0]?.title).toBe('இயற்கை உரம் தயாரிப்பு');

    const fetched = await service.getArticle(artEn.id);
    expect(fetched.content).toBe('Step by step guide to aerated compost...');

    const draftId = Array.from(state.articles.values()).find((a) => !a.is_published)!.id;
    await expect(service.getArticle(draftId)).rejects.toMatchObject(NOT_FOUND);
    await expect(service.getArticle(newId())).rejects.toMatchObject(NOT_FOUND);
  });

  it('BR-59b: enforces training capacity limits and handles enrollment/unenrollment', async () => {
    const { service } = createTestContext();
    const training = await service.createTraining(adminScope(), baseTraining);

    const scopeFarmerA = farmerScope(FARMER_A);
    const scopeFarmerB = farmerScope(FARMER_B);

    const enrA = await service.enrollTraining(scopeFarmerA, training.id);
    expect(enrA.trainingId).toBe(training.id);
    expect(enrA.farmerId).toBe(FARMER_A);

    await expect(service.enrollTraining(scopeFarmerB, training.id)).rejects.toMatchObject({
      status: 409,
      code: 'TRAINING_FULL',
    });

    await service.unenrollTraining(scopeFarmerA, training.id);

    const enrB = await service.enrollTraining(scopeFarmerB, training.id);
    expect(enrB.farmerId).toBe(FARMER_B);
  });

  it('BR-59b: enrolling in an unpublished or unknown training is 404 NOT_FOUND', async () => {
    const { service, state } = createTestContext();
    const draft = await service.createTraining(adminScope(), { ...baseTraining, isPublished: false });
    expect(state.trainings.get(draft.id)?.is_published).toBe(false);

    await expect(service.enrollTraining(farmerScope(FARMER_A), draft.id)).rejects.toMatchObject(NOT_FOUND);
    await expect(service.enrollTraining(farmerScope(FARMER_A), newId())).rejects.toMatchObject(NOT_FOUND);
  });

  it('BR-59c: allows joining and leaving community groups', async () => {
    const { service } = createTestContext();

    const group = await service.createGroup(adminScope(), {
      name: 'Nilgiris Carrot Cultivators',
      description: 'Exchange cultivation tips',
      category: 'Root Vegetables',
    });

    const scope = farmerScope(FARMER_A);

    const joined = await service.joinGroup(scope, group.id);
    expect(joined.groupId).toBe(group.id);
    expect(joined.farmerId).toBe(FARMER_A);

    const listAfterJoin = await service.listGroups({ page: 1, limit: 10 }, FARMER_A);
    expect(listAfterJoin.items[0]?.isJoined).toBe(true);
    expect(listAfterJoin.items[0]?.memberCount).toBe(1);

    await service.leaveGroup(scope, group.id);

    const listAfterLeave = await service.listGroups({ page: 1, limit: 10 }, FARMER_A);
    expect(listAfterLeave.items[0]?.isJoined).toBe(false);
    expect(listAfterLeave.items[0]?.memberCount).toBe(0);

    await expect(service.joinGroup(scope, newId())).rejects.toMatchObject(NOT_FOUND);
  });

  it('BR-59d: admin content mutations write audit logs', async () => {
    const { service, audits } = createTestContext();
    const admin = adminScope();

    const art = await service.createArticle(admin, {
      title: 'Neem Oil Spray Dilution',
      content: 'Correct ratio for pest control',
      readTime: '4 min read',
      author: 'Dr. Anand',
      tag: 'Pest Control',
      language: 'en',
      isPublished: true,
    });
    expect(audits.some((a) => a.includes('learning.article.create'))).toBe(true);

    await service.updateArticle(admin, art.id, { title: 'Neem Oil Spray - Updated' });
    expect(audits.some((a) => a.includes('learning.article.update'))).toBe(true);

    await service.deleteArticle(admin, art.id);
    expect(audits.some((a) => a.includes('learning.article.delete'))).toBe(true);
  });

  it('BR-59e: non-farmer actors cannot enroll in trainings or join groups', async () => {
    const { service } = createTestContext();
    const nonFarmerScope = aScope({
      level: ScopeLevel.ALL,
      userId: newId(),
      roleCode: RoleCode.TOHFA_ADMIN,
      permission: 'farmer.learning.participate_own',
    });

    await expect(service.enrollTraining(nonFarmerScope, newId())).rejects.toMatchObject({ status: 403 });
    await expect(service.joinGroup(nonFarmerScope, newId())).rejects.toMatchObject({ status: 403 });
  });

  it('BR-59f: the article list returns the snippet and never the full content', async () => {
    const { service } = createTestContext();
    await service.createArticle(adminScope(), {
      title: 'Mulching',
      content: 'LONG BODY '.repeat(50),
      snippet: 'Short teaser',
      readTime: '2 min read',
      author: 'Dr. Anand',
      tag: 'Soil Health',
      language: 'en',
      isPublished: true,
    });

    const list = await service.listArticles({ page: 1, limit: 10 });
    expect(list.items[0]).toMatchObject({ title: 'Mulching', snippet: 'Short teaser' });
    expect(list.items[0]).not.toHaveProperty('content');
  });

  it('BR-59h: lowering capacity below the enrolled count is refused with 409; equal is allowed', async () => {
    const { service } = createTestContext();
    const admin = adminScope();
    const training = await service.createTraining(admin, { ...baseTraining, capacity: 3 });
    await service.enrollTraining(farmerScope(FARMER_A), training.id);
    await service.enrollTraining(farmerScope(FARMER_B), training.id);

    await expect(service.updateTraining(admin, training.id, { capacity: 1 })).rejects.toMatchObject({
      status: 409,
      code: 'CONFLICT',
    });
    await expect(service.updateTraining(admin, newId(), { capacity: 1 })).rejects.toMatchObject(NOT_FOUND);

    const same = await service.updateTraining(admin, training.id, { capacity: 2 });
    expect(same.capacity).toBe(2);
    const unlimited = await service.updateTraining(admin, training.id, { capacity: null });
    expect(unlimited.capacity).toBeNull();
  });

  it('BR-59i: replaying enroll, join, unenroll and leave writes no extra audit row', async () => {
    const { service, audits } = createTestContext();
    const admin = adminScope();
    const training = await service.createTraining(admin, { ...baseTraining, capacity: 5 });
    const group = await service.createGroup(admin, { name: 'Tea Growers', category: 'Tea' });
    const farmer = farmerScope(FARMER_A);
    const count = (code: string): number => audits.filter((a) => a.includes(code)).length;

    const first = await service.enrollTraining(farmer, training.id);
    const replay = await service.enrollTraining(farmer, training.id);
    expect(replay).toEqual(first);
    expect(count('learning.training.enroll')).toBe(1);

    const joined = await service.joinGroup(farmer, group.id);
    expect(await service.joinGroup(farmer, group.id)).toEqual(joined);
    expect(count('learning.group.join')).toBe(1);

    await service.unenrollTraining(farmer, training.id);
    await service.unenrollTraining(farmer, training.id);
    expect(count('learning.training.unenroll')).toBe(1);

    await service.leaveGroup(farmer, group.id);
    await service.leaveGroup(farmer, group.id);
    expect(count('learning.group.leave')).toBe(1);
  });

  it('BR-59i: a replayed enroll on a FULL training still returns the existing enrollment', async () => {
    const { service } = createTestContext();
    const training = await service.createTraining(adminScope(), baseTraining);
    const farmer = farmerScope(FARMER_A);
    const first = await service.enrollTraining(farmer, training.id);
    await expect(service.enrollTraining(farmer, training.id)).resolves.toEqual(first);
  });
});

// ── Request validation (real routes, no database) ────────────────────────────
describe('Learning Hub request validation (BR-59j)', () => {
  const app = createApp();
  const admin = signAccessToken({
    sub: IDS.userSuperAdmin,
    roles: [{ code: 'SUPER_ADMIN' }] as never,
    farmerId: null,
    customerId: null,
  });
  const id = newId();

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const validVideo = { title: 'Drip', videoUrl: 'https://youtu.be/abc', duration: '4:30', author: 'Anand' };

  it.each(['javascript:alert(1)', 'file:///etc/passwd', 'http://example.com/v.mp4', 'data:text/html,<b>x</b>', 'not a url'])(
    'BR-59j: videoUrl %s is rejected with 422 on create and update',
    async (videoUrl) => {
      const create = vi.spyOn(learningHubService, 'createVideo');
      const update = vi.spyOn(learningHubService, 'updateVideo');

      const created = await request(app)
        .post('/v1/admin/learning/videos')
        .set('Authorization', `Bearer ${admin}`)
        .send({ ...validVideo, videoUrl });
      expect(created.status).toBe(422);
      expect(created.body.code).toBe('VALIDATION_FAILED');

      const updated = await request(app)
        .patch(`/v1/admin/learning/videos/${id}`)
        .set('Authorization', `Bearer ${admin}`)
        .send({ videoUrl });
      expect(updated.status).toBe(422);

      expect(create).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
    },
  );

  it('BR-59j: an https videoUrl reaches the service', async () => {
    const create = vi.spyOn(learningHubService, 'createVideo').mockResolvedValue({ id } as never);
    const res = await request(app)
      .post('/v1/admin/learning/videos')
      .set('Authorization', `Bearer ${admin}`)
      .send(validVideo);
    expect(res.status).toBe(201);
    expect(create).toHaveBeenCalledOnce();
  });

  it.each(['2026-02-30', '2026-13-01', '2026-1-5', '25-10-2026'])(
    'BR-59j: trainingDate %s is rejected with 422 on create and update',
    async (trainingDate) => {
      const created = await request(app)
        .post('/v1/admin/learning/trainings')
        .set('Authorization', `Bearer ${admin}`)
        .send({ ...baseTraining, trainingDate });
      expect(created.status).toBe(422);
      const updated = await request(app)
        .patch(`/v1/admin/learning/trainings/${id}`)
        .set('Authorization', `Bearer ${admin}`)
        .send({ trainingDate });
      expect(updated.status).toBe(422);
    },
  );

  it('BR-59j: over-long free text is rejected with 422 on every create route', async () => {
    const post = (path: string, body: object) =>
      request(app).post(path).set('Authorization', `Bearer ${admin}`).send(body);
    const article = { title: 'T', content: 'C', readTime: '1 min', author: 'A', tag: 'G' };

    expect((await post('/v1/admin/learning/articles', { ...article, title: 'x'.repeat(201) })).status).toBe(422);
    expect((await post('/v1/admin/learning/articles', { ...article, content: 'x'.repeat(20_001) })).status).toBe(422);
    expect((await post('/v1/admin/learning/articles', { ...article, snippet: 'x'.repeat(301) })).status).toBe(422);
    expect((await post('/v1/admin/learning/videos', { ...validVideo, description: 'x'.repeat(2001) })).status).toBe(422);
    expect(
      (await post('/v1/admin/learning/videos', { ...validVideo, videoUrl: `https://a.example/${'x'.repeat(2048)}` })).status,
    ).toBe(422);
    expect((await post('/v1/admin/learning/trainings', { ...baseTraining, location: 'x'.repeat(201) })).status).toBe(422);
    expect((await post('/v1/admin/learning/trainings', { ...baseTraining, capacity: 2_147_483_648 })).status).toBe(422);
    expect((await post('/v1/admin/learning/groups', { name: 'x'.repeat(121), category: 'c' })).status).toBe(422);
    expect((await post('/v1/admin/learning/groups', { name: 'n', category: 'x'.repeat(81) })).status).toBe(422);
  });
});

// ── Real PostgreSQL ──────────────────────────────────────────────────────────
describeIfDatabase('Learning Hub (integration, real SQL)', () => {
  let ready = false;
  const ts = Date.now();
  const service = learningHubService;
  const userIds: string[] = [];
  const farmerIds: string[] = [];
  const articleIds: string[] = [];
  const trainingIds: string[] = [];
  const groupIds: string[] = [];
  let admin: ResolvedScope;
  let farmers: ResolvedScope[] = [];

  beforeAll(async () => {
    ready = await databaseReady('learning_trainings');
    if (!ready) return;
    const adminUser = newId();
    userIds.push(adminUser);
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, 'LH Admin', 'ADMIN', 'ACTIVE')`,
      [adminUser, `+9175${String(ts).slice(-8)}`],
    );
    admin = aScope({
      level: ScopeLevel.ALL,
      permission: 'learning.admin.manage',
      roleCode: RoleCode.SUPER_ADMIN,
      userId: adminUser,
    });
    for (let i = 0; i < 3; i += 1) {
      const userId = newId();
      userIds.push(userId);
      await pool.query(
        `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, $3, 'FARMER', 'ACTIVE')`,
        [userId, `+9174${String(ts).slice(-7)}${i}`, `LH Farmer ${i}`],
      );
      const farmerId = (
        await pool.query<{ id: string }>(
          `INSERT INTO farmers (user_id, tohfa_farmer_id, application_status, approved_by, approved_at)
           VALUES ($1, $2, 'APPROVED', $3, now()) RETURNING id`,
          [userId, `TF-LH-${i}-${ts}`, adminUser],
        )
      ).rows[0]!.id;
      farmerIds.push(farmerId);
      farmers.push({
        ...farmerScope(farmerId),
        userId,
      });
    }
  });

  afterAll(async () => {
    if (!ready) return;
    // Enrolments/memberships cascade. Users stay: audit_log.actor_id references them
    // and audit_log is append-only.
    await pool.query(`DELETE FROM learning_articles WHERE id = ANY($1::uuid[])`, [articleIds]);
    await pool.query(`DELETE FROM learning_trainings WHERE id = ANY($1::uuid[])`, [trainingIds]);
    await pool.query(`DELETE FROM learning_groups WHERE id = ANY($1::uuid[])`, [groupIds]);
    await pool.query(`DELETE FROM farmers WHERE id = ANY($1::uuid[])`, [farmerIds]);
    farmers = [];
  });

  const makeTraining = async (overrides: Partial<typeof baseTraining> = {}) => {
    const t = await service.createTraining(admin, { ...baseTraining, ...overrides });
    trainingIds.push(t.id);
    return t;
  };

  it('BR-59g: two farmers racing for the last seat -> exactly one 200, the other 409 TRAINING_FULL, never a 500', async () => {
    if (!ready) return;
    for (let trial = 0; trial < 5; trial += 1) {
      const t = await makeTraining({ capacity: 1 });
      const results = await Promise.allSettled([
        service.enrollTraining(farmers[0]!, t.id),
        service.enrollTraining(farmers[1]!, t.id),
      ]);
      const ok = results.filter((r) => r.status === 'fulfilled');
      const failed = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
      expect(ok).toHaveLength(1);
      expect(failed).toHaveLength(1);
      expect(failed[0]!.reason).toMatchObject({ status: 409, code: 'TRAINING_FULL' });
      const { rows } = await pool.query<{ n: number }>(
        `SELECT count(*)::int AS n FROM learning_training_enrollments WHERE training_id = $1`,
        [t.id],
      );
      expect(rows[0]!.n).toBe(1);
    }
  });

  it('BR-59h: lowering capacity below the enrolled count is refused by the real SQL path; equal is allowed', async () => {
    if (!ready) return;
    const t = await makeTraining({ capacity: 3 });
    await service.enrollTraining(farmers[0]!, t.id);
    await service.enrollTraining(farmers[1]!, t.id);
    await expect(service.updateTraining(admin, t.id, { capacity: 1 })).rejects.toMatchObject({ status: 409 });
    const ok = await service.updateTraining(admin, t.id, { capacity: 2 });
    expect(ok).toMatchObject({ capacity: 2, enrolledCount: 2 });
  });

  it('BR-59i: replaying enroll twice writes exactly one audit row; replaying unenroll twice writes one', async () => {
    if (!ready) return;
    const t = await makeTraining({ capacity: 5 });
    const farmer = farmers[2]!;
    const first = await service.enrollTraining(farmer, t.id);
    const second = await service.enrollTraining(farmer, t.id);
    expect(second).toEqual(first);

    const auditCount = async (action: string): Promise<number> =>
      (
        await pool.query<{ n: number }>(
          `SELECT count(*)::int AS n FROM audit_log
            WHERE action_code = $1 AND actor_id = $2
              AND COALESCE(after->>'training_id', before->>'trainingId') = $3`,
          [action, farmer.userId, t.id],
        )
      ).rows[0]!.n;
    expect(await auditCount('learning.training.enroll')).toBe(1);

    await service.unenrollTraining(farmer, t.id);
    await service.unenrollTraining(farmer, t.id);
    expect(await auditCount('learning.training.unenroll')).toBe(1);
  });

  it('BR-59k: unpublished articles and trainings are invisible to farmers (404 / absent) via the real SQL', async () => {
    if (!ready) return;
    const article = await service.createArticle(admin, {
      title: `LH hidden ${ts}`,
      content: 'draft body',
      readTime: '1 min',
      author: 'Editor',
      tag: `hidden-${ts}`,
      language: 'en',
      isPublished: false,
    });
    articleIds.push(article.id);
    const training = await makeTraining({ isPublished: false, capacity: null });

    await expect(service.getArticle(article.id)).rejects.toMatchObject(NOT_FOUND);
    const list = await service.listArticles({ page: 1, limit: 100, tag: `hidden-${ts}` });
    expect(list.items).toEqual([]);
    expect(list.total).toBe(0);

    await expect(service.enrollTraining(farmers[0]!, training.id)).rejects.toMatchObject(NOT_FOUND);
    const trainings = await service.listTrainings({ page: 1, limit: 100 }, farmerIds[0]);
    expect(trainings.items.some((i) => i.id === training.id)).toBe(false);

    await service.updateArticle(admin, article.id, { isPublished: true });
    const published = await service.listArticles({ page: 1, limit: 100, tag: `hidden-${ts}` });
    expect(published.items).toHaveLength(1);
    expect(published.items[0]).not.toHaveProperty('content');
    expect((await service.getArticle(article.id)).content).toBe('draft body');
  });

  it('BR-59i: a replayed join writes one audit row and keeps one membership', async () => {
    if (!ready) return;
    const group = await service.createGroup(admin, { name: `LH group ${ts}`, category: 'Tea' });
    groupIds.push(group.id);
    const farmer = farmers[0]!;
    const a = await service.joinGroup(farmer, group.id);
    const b = await service.joinGroup(farmer, group.id);
    expect(b).toEqual(a);
    const audits = await pool.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM audit_log WHERE action_code = 'learning.group.join' AND after->>'group_id' = $1`,
      [group.id],
    );
    expect(audits.rows[0]!.n).toBe(1);
  });

  it('BR-59q: POST /admin/learning/groups/:id/archive archives group; DELETE refuses group with members (409 CONFLICT) and permits group with 0 members', async () => {
    if (!ready) return;
    const group = await service.createGroup(admin, { name: `LH group arch ${ts}`, category: 'Tea' });
    groupIds.push(group.id);
    const farmer = farmers[0]!;
    await service.joinGroup(farmer, group.id);

    // 1. Deleting a group with members throws 409 CONFLICT
    await expect(service.deleteGroup(admin, group.id)).rejects.toMatchObject({
      status: 409,
    });

    // 2. Archiving the group succeeds
    const archived = await (service as any).archiveGroup(admin, group.id);
    expect(archived).toHaveProperty('isArchived', true);

    // 3. Leaving the group allows delete to succeed
    await service.leaveGroup(farmer, group.id);
    await expect(service.deleteGroup(admin, group.id)).resolves.not.toThrow();
  });
});

// ── Crop tagging (BR-59r) ────────────────────────────────────────────────────
describe('Learning Hub crop tagging (BR-59r)', () => {
  const CARROT = '40000000-0000-4000-8000-00000000000a';
  const CABBAGE = '40000000-0000-4000-8000-00000000000b';
  const RETIRED = '40000000-0000-4000-8000-00000000000c';

  /** A context whose taxonomy holds two live crops and one soft-deleted one. */
  function cropContext() {
    const ctx = createTestContext();
    ctx.state.crops.set(CARROT, { ref: { id: CARROT, name: 'Carrot', nameTa: 'கேரட்' }, deleted: false });
    ctx.state.crops.set(CABBAGE, { ref: { id: CABBAGE, name: 'Cabbage', nameTa: null }, deleted: false });
    ctx.state.crops.set(RETIRED, { ref: { id: RETIRED, name: 'Retired Crop', nameTa: null }, deleted: true });
    return ctx;
  }

  const article = {
    title: 'Carrot Sowing Depth',
    content: 'How deep to sow in Nilgiris loam',
    readTime: '4 min read',
    author: 'Dr. Anand',
    tag: 'Agronomy',
    language: 'en' as const,
    isPublished: true,
  };

  const video = {
    title: 'Carrot Thinning',
    videoUrl: 'https://videos.tohfa.test/carrot-thinning',
    duration: '6:10',
    author: 'Field Team',
    language: 'en' as const,
    isFeatured: false,
    isPublished: true,
  };

  it('BR-59r: an article created with cropIds comes back with the matching chips, Tamil name included', async () => {
    const { service, state } = cropContext();

    const created = await service.createArticle(adminScope(), { ...article, cropIds: [CARROT, CABBAGE] });

    // Ordered by name, so the chip row is stable between requests.
    expect(created.crops).toEqual([
      { id: CABBAGE, name: 'Cabbage', nameTa: null },
      { id: CARROT, name: 'Carrot', nameTa: 'கேரட்' },
    ]);
    expect(state.articleCrops.get(created.id)).toEqual([CARROT, CABBAGE]);
  });

  it('BR-59r: an article created without cropIds has no tags and reports an empty chip list', async () => {
    const { service, state } = cropContext();

    const created = await service.createArticle(adminScope(), article);

    expect(created.crops).toEqual([]);
    expect(state.articleCrops.has(created.id)).toBe(false);
  });

  it('BR-59r: on update, omitted cropIds leaves the tags unchanged and [] clears them', async () => {
    const { service, state } = cropContext();
    const created = await service.createArticle(adminScope(), { ...article, cropIds: [CARROT] });

    // Omitted: the tags survive a patch that touches only the title.
    const renamed = await service.updateArticle(adminScope(), created.id, { title: 'Carrot Sowing Depth v2' });
    expect(renamed.crops).toEqual([{ id: CARROT, name: 'Carrot', nameTa: 'கேரட்' }]);
    expect(state.articleCrops.get(created.id)).toEqual([CARROT]);

    // Sent in full: the set is replaced, not merged.
    const retagged = await service.updateArticle(adminScope(), created.id, { cropIds: [CABBAGE] });
    expect(retagged.crops).toEqual([{ id: CABBAGE, name: 'Cabbage', nameTa: null }]);
    expect(state.articleCrops.get(created.id)).toEqual([CABBAGE]);

    // Empty: cleared.
    const cleared = await service.updateArticle(adminScope(), created.id, { cropIds: [] });
    expect(cleared.crops).toEqual([]);
    expect(state.articleCrops.get(created.id)).toEqual([]);
  });

  it('BR-59r: an unknown crop id is rejected with 422 naming it, and nothing is tagged', async () => {
    const { service, state } = cropContext();
    const ghost = newId();

    await expect(
      service.createArticle(adminScope(), { ...article, cropIds: [CARROT, ghost] }),
    ).rejects.toMatchObject({ status: 422, code: 'VALIDATION_FAILED' });

    await expect(
      service.createArticle(adminScope(), { ...article, cropIds: [ghost] }),
    ).rejects.toThrow(new RegExp(ghost));

    expect(state.articleCrops.size).toBe(0);
  });

  it('BR-59r: a soft-deleted crop id is rejected, never silently dropped', async () => {
    const { service } = cropContext();

    await expect(
      service.createArticle(adminScope(), { ...article, cropIds: [CARROT, RETIRED] }),
    ).rejects.toMatchObject({ status: 422, code: 'VALIDATION_FAILED' });

    const created = await service.createArticle(adminScope(), { ...article, cropIds: [CARROT] });
    await expect(
      service.updateArticle(adminScope(), created.id, { cropIds: [RETIRED] }),
    ).rejects.toMatchObject({ status: 422, code: 'VALIDATION_FAILED' });
  });

  it('BR-59r: an unknown crop id on update leaves the existing tags alone', async () => {
    const { service, state } = cropContext();
    const created = await service.createArticle(adminScope(), { ...article, cropIds: [CARROT] });

    await expect(
      service.updateArticle(adminScope(), created.id, { title: 'Ignored', cropIds: [newId()] }),
    ).rejects.toMatchObject({ status: 422 });

    expect(state.articleCrops.get(created.id)).toEqual([CARROT]);
  });

  it('BR-59r: the same crop picked twice is stored once', async () => {
    const { service, state } = cropContext();

    const created = await service.createArticle(adminScope(), { ...article, cropIds: [CARROT, CARROT] });

    expect(created.crops).toEqual([{ id: CARROT, name: 'Carrot', nameTa: 'கேரட்' }]);
    expect(state.articleCrops.get(created.id)).toEqual([CARROT]);
  });

  it('BR-59r: videos carry the same contract as articles', async () => {
    const { service, state } = cropContext();

    const created = await service.createVideo(adminScope(), { ...video, cropIds: [CARROT] });
    expect(created.crops).toEqual([{ id: CARROT, name: 'Carrot', nameTa: 'கேரட்' }]);

    const untouched = await service.updateVideo(adminScope(), created.id, { title: 'Carrot Thinning v2' });
    expect(untouched.crops).toEqual([{ id: CARROT, name: 'Carrot', nameTa: 'கேரட்' }]);

    const cleared = await service.updateVideo(adminScope(), created.id, { cropIds: [] });
    expect(cleared.crops).toEqual([]);
    expect(state.videoCrops.get(created.id)).toEqual([]);

    await expect(
      service.updateVideo(adminScope(), created.id, { cropIds: [RETIRED] }),
    ).rejects.toMatchObject({ status: 422, code: 'VALIDATION_FAILED' });
  });

  it('BR-59r: the crop set lands in the audit row, so a retag is attributable', async () => {
    const { service, audits } = cropContext();

    const created = await service.createArticle(adminScope(), { ...article, cropIds: [CARROT] });
    await service.updateArticle(adminScope(), created.id, { cropIds: [CABBAGE] });

    const updateAudit = audits.find((a) => a.includes('learning.article.update'));
    expect(JSON.stringify(updateAudit)).toContain(CABBAGE);
  });
});

describe('Learning Hub Content Review Workflow (BR-59t)', () => {
  const superAdmin = aScope({
    level: ScopeLevel.ALL,
    userId: newId(),
    roleCode: RoleCode.SUPER_ADMIN,
    permission: 'learning.content.review',
  });

  const baseArticle = {
    title: 'Reviewable Article',
    content: 'Reviewable Content',
    readTime: '3 min',
    author: 'Admin Team',
    tag: 'Agronomy',
    language: 'en' as const,
    isPublished: true,
  };

  it('initial state is NOT_SUBMITTED and isPublished can be true immediately', async () => {
    const { service } = createTestContext();
    const created = await service.createArticle(adminScope(), baseArticle);
    expect(created.reviewStatus).toBe('NOT_SUBMITTED');
    expect(created.submittedForReviewAt).toBeNull();
    expect(created.reviewedBy).toBeNull();
    expect(created.reviewedAt).toBeNull();
    expect(created.reviewNote).toBeNull();
    expect(created.isPublished).toBe(true);
  });

  it('submitting for review moves status to PENDING_REVIEW and leaves isPublished unchanged', async () => {
    const { service, audits } = createTestContext();
    const created = await service.createArticle(adminScope(), baseArticle);

    const submitted = await service.submitReview(adminScope(), 'articles', created.id, {
      note: 'Please review agronomy details',
    });
    expect(submitted.reviewStatus).toBe('PENDING_REVIEW');
    expect(submitted.submittedForReviewAt).toBeTruthy();
    expect(submitted.reviewNote).toBe('Please review agronomy details');
    if ('isPublished' in submitted) {
      expect(submitted.isPublished).toBe(true);
    }

    const submitAudit = audits.find((a) => a.includes('learning.article.submit_review'));
    expect(submitAudit).toBeDefined();
  });

  it('super admin can approve content and audit log is recorded', async () => {
    const { service, audits } = createTestContext();
    const created = await service.createArticle(adminScope(), baseArticle);
    await service.submitReview(adminScope(), 'articles', created.id, {});

    const reviewed = await service.reviewContent(superAdmin, 'articles', created.id, {
      status: 'APPROVED',
      note: 'Verified and approved',
    });
    expect(reviewed.reviewStatus).toBe('APPROVED');
    expect(reviewed.reviewedBy).toBe(superAdmin.userId);
    expect(reviewed.reviewedAt).toBeTruthy();
    expect(reviewed.reviewNote).toBe('Verified and approved');
    if ('isPublished' in reviewed) {
      expect(reviewed.isPublished).toBe(true);
    }

    const reviewAudit = audits.find((a) => a.includes('learning.article.review'));
    expect(reviewAudit).toBeDefined();
  });

  it('super admin rejection does NOT unpublish content (two independent axes)', async () => {
    const { service } = createTestContext();
    const created = await service.createArticle(adminScope(), baseArticle);
    await service.submitReview(adminScope(), 'articles', created.id, {});

    const rejected = await service.reviewContent(superAdmin, 'articles', created.id, {
      status: 'REJECTED',
      note: 'Factual corrections needed in section 2',
    });
    expect(rejected.reviewStatus).toBe('REJECTED');
    expect(rejected.reviewedBy).toBe(superAdmin.userId);
    expect(rejected.reviewNote).toBe('Factual corrections needed in section 2');
    // Independent axis: isPublished remains true!
    if ('isPublished' in rejected) {
      expect(rejected.isPublished).toBe(true);
    }
  });

  it('rejected content can be resubmitted for review', async () => {
    const { service } = createTestContext();
    const created = await service.createArticle(adminScope(), baseArticle);
    await service.submitReview(adminScope(), 'articles', created.id, {});
    await service.reviewContent(superAdmin, 'articles', created.id, { status: 'REJECTED' });

    const resubmitted = await service.submitReview(adminScope(), 'articles', created.id, {
      note: 'Corrections made as requested',
    });
    expect(resubmitted.reviewStatus).toBe('PENDING_REVIEW');
    expect(resubmitted.reviewNote).toBe('Corrections made as requested');
  });

  it('works symmetrically across videos, trainings, and groups', async () => {
    const { service } = createTestContext();

    // Video
    const vid = await service.createVideo(adminScope(), {
      title: 'Video 1',
      videoUrl: 'https://v.example/1',
      duration: '3:00',
      author: 'A',
      language: 'en',
      isFeatured: false,
      isPublished: true,
    });
    expect(vid.reviewStatus).toBe('NOT_SUBMITTED');
    const vidSub = await service.submitReview(adminScope(), 'videos', vid.id, {});
    expect(vidSub.reviewStatus).toBe('PENDING_REVIEW');
    const vidRev = await service.reviewContent(superAdmin, 'videos', vid.id, { status: 'APPROVED' });
    expect(vidRev.reviewStatus).toBe('APPROVED');

    // Training
    const trn = await service.createTraining(adminScope(), baseTraining);
    expect(trn.reviewStatus).toBe('NOT_SUBMITTED');
    const trnSub = await service.submitReview(adminScope(), 'trainings', trn.id, {});
    expect(trnSub.reviewStatus).toBe('PENDING_REVIEW');
    const trnRev = await service.reviewContent(superAdmin, 'trainings', trn.id, { status: 'APPROVED' });
    expect(trnRev.reviewStatus).toBe('APPROVED');

    // Group
    const grp = await service.createGroup(adminScope(), { name: 'Pest Group', category: 'General' });
    expect(grp.reviewStatus).toBe('NOT_SUBMITTED');
    const grpSub = await service.submitReview(adminScope(), 'groups', grp.id, {});
    expect(grpSub.reviewStatus).toBe('PENDING_REVIEW');
    const grpRev = await service.reviewContent(superAdmin, 'groups', grp.id, { status: 'APPROVED' });
    expect(grpRev.reviewStatus).toBe('APPROVED');
  });

  it('throws 404 for non-existent content on submitReview and reviewContent', async () => {
    const { service } = createTestContext();
    const missingId = newId();

    await expect(service.submitReview(adminScope(), 'articles', missingId, {})).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
    await expect(
      service.reviewContent(superAdmin, 'articles', missingId, { status: 'APPROVED' }),
    ).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
  });

  it('admin listing filters by reviewStatus query param', async () => {
    const { service } = createTestContext();
    const art1 = await service.createArticle(adminScope(), { ...baseArticle, title: 'Art 1' });
    const art2 = await service.createArticle(adminScope(), { ...baseArticle, title: 'Art 2' });
    await service.submitReview(adminScope(), 'articles', art2.id, {});

    const pendingOnly = await service.listAdminArticles({
      page: 1,
      limit: 10,
      reviewStatus: 'PENDING_REVIEW',
    });
    expect(pendingOnly.items).toHaveLength(1);
    expect(pendingOnly.items[0]!.id).toBe(art2.id);

    const notSubmittedOnly = await service.listAdminArticles({
      page: 1,
      limit: 10,
      reviewStatus: 'NOT_SUBMITTED',
    });
    expect(notSubmittedOnly.items).toHaveLength(1);
    expect(notSubmittedOnly.items[0]!.id).toBe(art1.id);
  });
});
