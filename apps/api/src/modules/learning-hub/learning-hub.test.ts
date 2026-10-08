import { describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { aScope, IDS, newId } from '../../test/factories.js';
import type {
  ArticleRow,
  EnrollmentRow,
  GroupRow,
  LearningHubRepo,
  MembershipRow,
  TrainingRow,
  VideoRow,
} from './learning-hub.repo.js';
import { createLearningHubService } from './learning-hub.service.js';

const FARMER_A = IDS.farmer;
const FARMER_B = '30000000-0000-4000-8000-000000000002';

function farmerScope(farmerId: string, permission = 'farmer.learning.view'): ResolvedScope {
  return aScope({
    level: ScopeLevel.ALL,
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
  auditLogs: unknown[][];
}

function createFakeRepo(state: FakeDbState): LearningHubRepo {
  return {
    async findArticles(_db, { page, limit, language, tag, publishedOnly = true }) {
      let list = Array.from(state.articles.values());
      if (publishedOnly) list = list.filter((a) => a.is_published);
      if (language) list = list.filter((a) => a.language === language);
      if (tag) list = list.filter((a) => a.tag === tag);
      const total = list.length;
      const offset = (page - 1) * limit;
      return { rows: list.slice(offset, offset + limit), total };
    },

    async findArticleById(_db, id, publishedOnly = true) {
      const art = state.articles.get(id);
      if (!art) return null;
      if (publishedOnly && !art.is_published) return null;
      return { ...art };
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
      return { ...art };
    },

    async deleteArticle(_db, id) {
      return state.articles.delete(id);
    },

    async findVideos(_db, { page, limit, language, publishedOnly = true }) {
      let list = Array.from(state.videos.values());
      if (publishedOnly) list = list.filter((v) => v.is_published);
      if (language) list = list.filter((v) => v.language === language);
      const total = list.length;
      const offset = (page - 1) * limit;
      return { rows: list.slice(offset, offset + limit), total };
    },

    async findVideoById(_db, id) {
      const v = state.videos.get(id);
      return v ? { ...v } : null;
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
      return { ...v };
    },

    async deleteVideo(_db, id) {
      return state.videos.delete(id);
    },

    async findTrainings(_db, { page, limit, language, publishedOnly = true, farmerId }) {
      let list = Array.from(state.trainings.values());
      if (publishedOnly) list = list.filter((t) => t.is_published);
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

    async isFarmerEnrolled(_db, trainingId, farmerId) {
      return Array.from(state.enrollments.values()).some(
        (e) => e.training_id === trainingId && e.farmer_id === farmerId,
      );
    },

    async enrollFarmerInTraining(_db, trainingId, farmerId) {
      const key = `${trainingId}:${farmerId}`;
      const existing = state.enrollments.get(key);
      if (existing) return existing;
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

    async findGroups(_db, { page, limit, category, farmerId }) {
      let list = Array.from(state.groups.values());
      if (category) list = list.filter((g) => g.category === category);
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

    async isFarmerInGroup(_db, groupId, farmerId) {
      return Array.from(state.memberships.values()).some(
        (m) => m.group_id === groupId && m.farmer_id === farmerId,
      );
    },

    async joinGroup(_db, groupId, farmerId) {
      const key = `${groupId}:${farmerId}`;
      const existing = state.memberships.get(key);
      if (existing) return existing;
      const row: MembershipRow = {
        id: newId(),
        group_id: groupId,
        farmer_id: farmerId,
        joined_at: new Date().toISOString(),
      };
      state.memberships.set(key, row);
      return row;
    },

    async leaveGroup(_db, groupId, farmerId) {
      const key = `${groupId}:${farmerId}`;
      return state.memberships.delete(key);
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
    auditLogs: [],
  };
  const repo = createFakeRepo(state);
  const fakeTx: Executor = {
    query: async (sql: string, params?: unknown[]) => {
      // Row lock mock for training capacity
      if (sql.includes('SELECT id, capacity, is_published FROM learning_trainings')) {
        const trainingId = params?.[0] as string;
        const t = state.trainings.get(trainingId);
        return {
          rows: t ? [{ id: t.id, capacity: t.capacity, is_published: t.is_published }] : [],
          rowCount: t ? 1 : 0,
        } as never;
      }
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

describe('Learning Hub (BR-59)', () => {
  it('BR-59a allows farmers to browse published articles and videos with language filtering', async () => {
    const { service, state } = createTestContext();

    // Populate mock articles
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

    // Farmer lists English articles
    const enArticles = await service.listArticles({ page: 1, limit: 10, language: 'en' });
    expect(enArticles.items).toHaveLength(1);
    expect(enArticles.items[0]?.title).toBe('Organic Compost Techniques');

    // Farmer lists Tamil articles
    const taArticles = await service.listArticles({ page: 1, limit: 10, language: 'ta' });
    expect(taArticles.items).toHaveLength(1);
    expect(taArticles.items[0]?.title).toBe('இயற்கை உரம் தயாரிப்பு');

    // Get article by id
    const fetched = await service.getArticle(artEn.id);
    expect(fetched.content).toBe('Step by step guide to aerated compost...');

    // Unpublished article returns 404
    const draftId = Array.from(state.articles.values()).find((a) => !a.is_published)!.id;
    await expect(service.getArticle(draftId)).rejects.toThrow(AppError);
  });

  it('BR-59b enforces training capacity limits and handles enrollment/unenrollment', async () => {
    const { service } = createTestContext();

    // Create a training workshop with capacity 1
    const training = await service.createTraining(adminScope(), {
      title: 'Terrace Drip Workshop',
      description: 'Hands on maintenance',
      trainingDate: '2026-10-25',
      startTime: '10:00 AM',
      endTime: '01:00 PM',
      mode: 'IN_FIELD',
      location: 'Ooty Model Farm',
      instructor: 'Engineering Team',
      capacity: 1,
      language: 'en',
      isPublished: true,
    });

    const scopeFarmerA = farmerScope(FARMER_A, 'farmer.learning.participate_own');
    const scopeFarmerB = farmerScope(FARMER_B, 'farmer.learning.participate_own');

    // Farmer A enrolls successfully
    const enrA = await service.enrollTraining(scopeFarmerA, training.id);
    expect(enrA.trainingId).toBe(training.id);
    expect(enrA.farmerId).toBe(FARMER_A);

    // Farmer B attempts to enroll -> capacity 1 is full, throws 409 TRAINING_FULL
    await expect(service.enrollTraining(scopeFarmerB, training.id)).rejects.toThrow(
      expect.objectContaining({
        status: 409,
        code: 'TRAINING_FULL',
      }),
    );

    // Farmer A unenrolls
    await service.unenrollTraining(scopeFarmerA, training.id);

    // Now Farmer B can enroll successfully
    const enrB = await service.enrollTraining(scopeFarmerB, training.id);
    expect(enrB.farmerId).toBe(FARMER_B);
  });

  it('BR-59c allows joining and leaving community groups', async () => {
    const { service } = createTestContext();

    const group = await service.createGroup(adminScope(), {
      name: 'Nilgiris Carrot Cultivators',
      description: 'Exchange cultivation tips',
      category: 'Root Vegetables',
    });

    const scope = farmerScope(FARMER_A, 'farmer.learning.participate_own');

    // Farmer joins group
    const joined = await service.joinGroup(scope, group.id);
    expect(joined.groupId).toBe(group.id);
    expect(joined.farmerId).toBe(FARMER_A);

    // List groups shows isJoined = true, memberCount = 1
    const listAfterJoin = await service.listGroups({ page: 1, limit: 10 }, FARMER_A);
    expect(listAfterJoin.items[0]?.isJoined).toBe(true);
    expect(listAfterJoin.items[0]?.memberCount).toBe(1);

    // Farmer leaves group
    await service.leaveGroup(scope, group.id);

    // List groups shows isJoined = false, memberCount = 0
    const listAfterLeave = await service.listGroups({ page: 1, limit: 10 }, FARMER_A);
    expect(listAfterLeave.items[0]?.isJoined).toBe(false);
    expect(listAfterLeave.items[0]?.memberCount).toBe(0);
  });

  it('BR-59d admin content mutations write audit logs', async () => {
    const { service, audits } = createTestContext();
    const admin = adminScope();

    // 1. Create Article
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

    // 2. Update Article
    await service.updateArticle(admin, art.id, { title: 'Neem Oil Spray - Updated' });
    expect(audits.some((a) => a.includes('learning.article.update'))).toBe(true);

    // 3. Delete Article
    await service.deleteArticle(admin, art.id);
    expect(audits.some((a) => a.includes('learning.article.delete'))).toBe(true);
  });

  it('BR-59e non-farmer actors cannot enroll in trainings or join groups', async () => {
    const { service } = createTestContext();
    const nonFarmerScope = aScope({
      level: ScopeLevel.ALL,
      userId: newId(),
      roleCode: RoleCode.TOHFA_ADMIN,
      permission: 'farmer.learning.participate_own',
    });

    await expect(service.enrollTraining(nonFarmerScope, newId())).rejects.toThrow(
      expect.objectContaining({ status: 403 }),
    );

    await expect(service.joinGroup(nonFarmerScope, newId())).rejects.toThrow(
      expect.objectContaining({ status: 403 }),
    );
  });
});
