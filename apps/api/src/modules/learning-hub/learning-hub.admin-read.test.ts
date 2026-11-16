import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { RoleCode } from '@tohfa/shared-types';
import { signAccessToken } from '../../auth/jwt.js';
import { describeIfDatabase, IDS, newId } from '../../test/factories.js';
import { requireDatabaseTables, requireTestDatabaseName } from '../../test/dbFixtures.js';
import {
  cleanupLearningFixtures,
  emptyLearningFixtureIds,
  insertLearningArticle,
  insertLearningFarmer,
  insertLearningGroup,
  runSuffix,
} from '../../test/learningHubFixtures.js';
import { learningHubService, LearningHubService } from './learning-hub.service.js';
import type { LearningHubRepo } from './learning-hub.repo.js';
import { pool } from '../../db/pool.js';

// Mock token invalidation to avoid Redis timeouts during unit/route testing. Plain functions,
// not vi.fn(): the afterEach below restores every mock, and a restored vi.fn() would lose its
// resolved value.
vi.mock('../../auth/tokenInvalidation.js', () => ({
  isAccessTokenInvalidated: async () => false,
  markTokensInvalidBefore: async () => undefined,
}));

// The route tests spy on the SHARED learningHubService object. Without this restore the spies
// leak into the real-SQL block below, which then reads the mocked empty results instead of the
// database (that is how four real-SQL tests failed on CI).
afterEach(() => {
  vi.restoreAllMocks();
});

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
  farmerWithoutProfile: makeToken(RoleCode.FARMER, { farmerId: null }),
  customer: makeToken(RoleCode.CUSTOMER, { customerId: newId() }),
};

describe('Learning Hub Admin Reads & Farmer Group Detail (Unit / Route Tests)', () => {
  const app = createApp();
  const server = app.listen(0);

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  const testId = newId();

  describe('Authorization: learning.admin.manage on admin read routes and farmer.learning.view on group detail', () => {
    const adminReadPaths = [
      '/v1/admin/learning/articles',
      `/v1/admin/learning/articles/${testId}`,
      '/v1/admin/learning/videos',
      `/v1/admin/learning/videos/${testId}`,
      '/v1/admin/learning/trainings',
      `/v1/admin/learning/trainings/${testId}`,
      '/v1/admin/learning/groups',
      `/v1/admin/learning/groups/${testId}`,
    ];

    it('BR-learn-admin: learning-hub admin routes reject missing permission code', async () => {
      // Unauthenticated -> 401
      expect((await request(server).get('/v1/admin/learning-hub')).status).toBe(401);
      expect((await request(server).get(`/v1/admin/learning-hub/${testId}`)).status).toBe(401);

      // Authenticated user lacking farmer.learning.manage -> 403
      const resList403 = await request(server)
        .get('/v1/admin/learning-hub')
        .set('Authorization', `Bearer ${tokens.customer}`);
      expect(resList403.status).toBe(403);

      const resDetail403 = await request(server)
        .get(`/v1/admin/learning-hub/${testId}`)
        .set('Authorization', `Bearer ${tokens.customer}`);
      expect(resDetail403.status).toBe(403);

      // Authorized admin with farmer.learning.manage -> 200
      vi.spyOn(learningHubService, 'listAdminArticles').mockResolvedValue({ items: [], total: 0, page: 1, limit: 20 });
      vi.spyOn(learningHubService, 'getAdminArticle').mockResolvedValue({ id: testId } as never);

      const resList200 = await request(server)
        .get('/v1/admin/learning-hub')
        .set('Authorization', `Bearer ${tokens.tohfaAdmin}`);
      expect(resList200.status).toBe(200);

      const resDetail200 = await request(server)
        .get(`/v1/admin/learning-hub/${testId}`)
        .set('Authorization', `Bearer ${tokens.tohfaAdmin}`);
      expect(resDetail200.status).toBe(200);
    });

    it.each(adminReadPaths)('unauthenticated request to %s returns 401', async (path) => {
      const res = await request(server).get(path);
      expect(res.status).toBe(401);
    });

    it.each(adminReadPaths)('forbidden roles (FARMER_ADMIN, MAIN_WH_ADMIN, SUB_WH_ADMIN, FARMER, CUSTOMER) receive 403 on %s', async (path) => {
      for (const roleToken of [tokens.farmerAdmin, tokens.mainWhAdmin, tokens.subWhAdmin, tokens.farmer, tokens.customer]) {
        const res = await request(server).get(path).set('Authorization', `Bearer ${roleToken}`);
        expect(res.status).toBe(403);
      }
    });

    it.each(adminReadPaths)('authorized roles (SUPER_ADMIN, TOHFA_ADMIN) receive 200 on %s', async (path) => {
      vi.spyOn(learningHubService, 'listAdminArticles').mockResolvedValue({ items: [], total: 0, page: 1, limit: 20 });
      vi.spyOn(learningHubService, 'getAdminArticle').mockResolvedValue({ id: testId } as never);
      vi.spyOn(learningHubService, 'listAdminVideos').mockResolvedValue({ items: [], total: 0, page: 1, limit: 20 });
      vi.spyOn(learningHubService, 'getAdminVideo').mockResolvedValue({ id: testId } as never);
      vi.spyOn(learningHubService, 'listAdminTrainings').mockResolvedValue({ items: [], total: 0, page: 1, limit: 20 });
      vi.spyOn(learningHubService, 'getAdminTraining').mockResolvedValue({ id: testId } as never);
      vi.spyOn(learningHubService, 'listAdminGroups').mockResolvedValue({ items: [], total: 0, page: 1, limit: 20 });
      vi.spyOn(learningHubService, 'getAdminGroup').mockResolvedValue({ id: testId } as never);

      for (const roleToken of [tokens.superAdmin, tokens.tohfaAdmin]) {
        const res = await request(server).get(path).set('Authorization', `Bearer ${roleToken}`);
        expect(res.status).toBe(200);
      }
    });

    it('farmer group detail /v1/farmers/me/learning/groups/:id returns 401 unauthenticated and 403 for CUSTOMER', async () => {
      expect((await request(server).get(`/v1/farmers/me/learning/groups/${testId}`)).status).toBe(401);
      const res = await request(server)
        .get(`/v1/farmers/me/learning/groups/${testId}`)
        .set('Authorization', `Bearer ${tokens.customer}`);
      expect(res.status).toBe(403);
    });

    it('farmer group detail /v1/farmers/me/learning/groups/:id passes auth for FARMER and returns 200', async () => {
      vi.spyOn(learningHubService, 'getFarmerGroup').mockResolvedValue({ id: testId } as never);
      const res = await request(server)
        .get(`/v1/farmers/me/learning/groups/${testId}`)
        .set('Authorization', `Bearer ${tokens.farmer}`);
      expect(res.status).toBe(200);
    });

    it('BR-59o: farmer group detail is 403 for CUSTOMER, MAIN_WH_ADMIN and SUB_WH_ADMIN', async () => {
      const spy = vi.spyOn(learningHubService, 'getFarmerGroup').mockResolvedValue({ id: testId } as never);
      for (const roleToken of [tokens.customer, tokens.mainWhAdmin, tokens.subWhAdmin]) {
        const res = await request(server)
          .get(`/v1/farmers/me/learning/groups/${testId}`)
          .set('Authorization', `Bearer ${roleToken}`);
        expect(res.status).toBe(403);
      }
      expect(spy).not.toHaveBeenCalled();
    });

    it('BR-59o: a FARMER token with no farmer profile is 403 FORBIDDEN on group detail and never reaches the service', async () => {
      const spy = vi.spyOn(learningHubService, 'getFarmerGroup').mockResolvedValue({ id: testId } as never);
      const res = await request(server)
        .get(`/v1/farmers/me/learning/groups/${testId}`)
        .set('Authorization', `Bearer ${tokens.farmerWithoutProfile}`);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
      expect(spy).not.toHaveBeenCalled();
    });

    it('BR-59l: ?isPublished=false over HTTP reaches the admin list services as boolean false; true as true; absent as undefined', async () => {
      const page = { items: [], total: 0, page: 1, limit: 20 };
      const cases = [
        ['/v1/admin/learning/articles', vi.spyOn(learningHubService, 'listAdminArticles').mockResolvedValue(page)],
        ['/v1/admin/learning/videos', vi.spyOn(learningHubService, 'listAdminVideos').mockResolvedValue(page)],
        ['/v1/admin/learning/trainings', vi.spyOn(learningHubService, 'listAdminTrainings').mockResolvedValue(page)],
      ] as const;
      for (const [path, spy] of cases) {
        for (const [raw, parsed] of [['false', false], ['true', true]] as const) {
          spy.mockClear();
          const res = await request(server).get(`${path}?isPublished=${raw}`).set('Authorization', `Bearer ${tokens.superAdmin}`);
          expect(res.status).toBe(200);
          expect(spy).toHaveBeenCalledTimes(1);
          expect(spy.mock.calls[0]![0].isPublished).toBe(parsed);
        }
        spy.mockClear();
        await request(server).get(path).set('Authorization', `Bearer ${tokens.superAdmin}`);
        expect(spy.mock.calls[0]![0].isPublished).toBeUndefined();
      }
    });
  });

  describe('Validation: parameter limits and formats (BR-59n)', () => {
    it('BR-59n: q of 81 characters returns 422 VALIDATION_FAILED on admin and farmer list endpoints', async () => {
      const longQ = 'a'.repeat(81);
      const adminArticles = await request(server)
        .get(`/v1/admin/learning/articles?q=${longQ}`)
        .set('Authorization', `Bearer ${tokens.superAdmin}`);
      expect(adminArticles.status).toBe(422);

      const adminGroups = await request(server)
        .get(`/v1/admin/learning/groups?q=${longQ}`)
        .set('Authorization', `Bearer ${tokens.superAdmin}`);
      expect(adminGroups.status).toBe(422);

      const farmerGroups = await request(server)
        .get(`/v1/farmers/me/learning/groups?q=${longQ}`)
        .set('Authorization', `Bearer ${tokens.farmer}`);
      expect(farmerGroups.status).toBe(422);
    });

    it('BR-59n: q of 81 characters is 422 with code VALIDATION_FAILED on every admin list and the farmer group list', async () => {
      const longQ = 'a'.repeat(81);
      const cases = [
        ['/v1/admin/learning/articles', tokens.superAdmin],
        ['/v1/admin/learning/videos', tokens.superAdmin],
        ['/v1/admin/learning/trainings', tokens.superAdmin],
        ['/v1/admin/learning/groups', tokens.superAdmin],
        ['/v1/farmers/me/learning/groups', tokens.farmer],
      ] as const;
      for (const [path, token] of cases) {
        const res = await request(server).get(`${path}?q=${longQ}`).set('Authorization', `Bearer ${token}`);
        expect(res.status, path).toBe(422);
        expect(res.body.code, path).toBe('VALIDATION_FAILED');
      }
    });
  });

  describe('Service unit tests with mocked repository', () => {
    let mockRepo: Partial<LearningHubRepo>;
    let service: LearningHubService;

    beforeEach(() => {
      mockRepo = {
        findArticles: vi.fn(),
        findArticleById: vi.fn(),
        findVideos: vi.fn(),
        findVideoById: vi.fn(),
        findTrainings: vi.fn(),
        findTrainingById: vi.fn(),
        findGroups: vi.fn(),
        findGroupById: vi.fn(),
      };
      service = new LearningHubService({
        db: {} as never,
        runTx: async (fn) => fn({} as never),
        repo: mockRepo as LearningHubRepo,
      });
    });

    it('BR-59l: admin article list passes publishedOnly: false and filters by isPublished and q', async () => {
      const rows = [
        {
          id: testId,
          title: 'Draft Article',
          snippet: 'Snippet',
          read_time: '5 min',
          author: 'Author',
          tag: 'Tea',
          language: 'en' as const,
          is_published: false,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ];
      vi.mocked(mockRepo.findArticles!).mockResolvedValue({ rows, total: 1 });

      const res = await service.listAdminArticles({ page: 1, limit: 20, isPublished: false, q: 'draft' });
      expect(mockRepo.findArticles).toHaveBeenCalledWith(expect.anything(), {
        page: 1,
        limit: 20,
        publishedOnly: false,
        isPublished: false,
        q: 'draft',
      });
      expect(res.items[0]).toMatchObject({ id: testId, isPublished: false });
      expect(res.total).toBe(1);
    });

    it('BR-59l: admin video and training lists include unpublished rows and pass search queries', async () => {
      const videoRows = [
        {
          id: testId,
          title: 'Draft Video',
          description: null,
          video_url: 'https://youtu.be/test',
          duration: '3:00',
          author: 'Author',
          language: 'ta' as const,
          is_featured: false,
          is_published: false,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ];
      vi.mocked(mockRepo.findVideos!).mockResolvedValue({ rows: videoRows, total: 1 });
      const videoRes = await service.listAdminVideos({ page: 1, limit: 10, isPublished: false, q: 'video' });
      expect(mockRepo.findVideos).toHaveBeenCalledWith(expect.anything(), {
        page: 1,
        limit: 10,
        publishedOnly: false,
        isPublished: false,
        q: 'video',
      });
      expect(videoRes.items[0]!.isPublished).toBe(false);

      const trainingRows = [
        {
          id: testId,
          title: 'Draft Training',
          description: null,
          training_date: '2026-12-01',
          start_time: '10:00 AM',
          end_time: null,
          mode: 'IN_FIELD' as const,
          location: 'Field',
          instructor: 'Instructor',
          capacity: 20,
          language: 'en' as const,
          is_published: false,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
          enrolled_count: 5,
        },
      ];
      vi.mocked(mockRepo.findTrainings!).mockResolvedValue({ rows: trainingRows, total: 1 });
      const trainingRes = await service.listAdminTrainings({ page: 1, limit: 10, isPublished: false });
      expect(trainingRes.items[0]!).toMatchObject({ id: testId, enrolledCount: 5, isPublished: false });
      expect(trainingRes.items[0]!).not.toHaveProperty('isEnrolled');
    });

    it('BR-59l: admin group list returns memberCount without isJoined', async () => {
      const groupRows = [
        {
          id: testId,
          name: 'Group A',
          description: 'Desc',
          category: 'Tea',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
          member_count: 12,
        },
      ];
      vi.mocked(mockRepo.findGroups!).mockResolvedValue({ rows: groupRows, total: 1 });
      const groupRes = await service.listAdminGroups({ page: 1, limit: 20, sort: 'members' });
      expect(groupRes.items[0]!).toMatchObject({ id: testId, memberCount: 12 });
      expect(groupRes.items[0]!).not.toHaveProperty('isJoined');
    });

    it('BR-59m: admin detail reads return an unpublished article / training / video / group; unknown id is 404 NOT_FOUND', async () => {
      vi.mocked(mockRepo.findArticleById!).mockResolvedValue(null);
      await expect(service.getAdminArticle(testId)).rejects.toMatchObject({ code: 'NOT_FOUND' });
      expect(mockRepo.findArticleById).toHaveBeenCalledWith(expect.anything(), testId, false);

      vi.mocked(mockRepo.findVideoById!).mockResolvedValue(null);
      await expect(service.getAdminVideo(testId)).rejects.toMatchObject({ code: 'NOT_FOUND' });

      vi.mocked(mockRepo.findTrainingById!).mockResolvedValue(null);
      await expect(service.getAdminTraining(testId)).rejects.toMatchObject({ code: 'NOT_FOUND' });

      vi.mocked(mockRepo.findGroupById!).mockResolvedValue(null);
      await expect(service.getAdminGroup(testId)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('BR-59o: farmer reads single group detail with isJoined status, no other member identity returned', async () => {
      const groupRow = {
        id: testId,
        name: 'Nilgiris Tea Growers',
        description: 'Discussion for tea farmers',
        category: 'Tea',
        member_count: 5,
        is_joined: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      };
      vi.mocked(mockRepo.findGroupById!).mockResolvedValue(groupRow as never);

      const res = await service.getFarmerGroup(IDS.farmer, testId);
      expect(mockRepo.findGroupById).toHaveBeenCalledWith(expect.anything(), testId, IDS.farmer);
      expect(res).toEqual({
        id: testId,
        name: 'Nilgiris Tea Growers',
        description: 'Discussion for tea farmers',
        category: 'Tea',
        memberCount: 5,
        isJoined: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      });
      expect(res).not.toHaveProperty('farmerId');
      expect(res).not.toHaveProperty('members');
    });

    it('BR-59o: farmer group detail unknown id is 404 NOT_FOUND', async () => {
      vi.mocked(mockRepo.findGroupById!).mockResolvedValue(null);
      await expect(service.getFarmerGroup(IDS.farmer, testId)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });
});

// ── Real PostgreSQL (Integration tests when database is ready) ───────────────
// These rows are COMMITTED through the shared pool (the service opens its own
// transactions), so: the suite refuses a database whose name lacks "test", every fixture
// is created inside the try whose finally cleans it up, and every name / tag / category
// carries a per-run random suffix so reruns and parallel runs cannot collide.
describeIfDatabase('Learning Hub Admin Reads (Real SQL)', () => {
  let ready = false;
  const service = learningHubService;

  beforeAll(async () => {
    ready = await requireDatabaseTables('learning_articles', 'learning_groups', 'learning_group_memberships', 'farmers');
    if (!ready) return;
    await requireTestDatabaseName(pool);
  });

  it('BR-59l: admin article list includes unpublished articles; the farmer list still hides them', async (ctx) => {
    if (!ready) return ctx.skip();
    const sfx = runSuffix();
    const tag = `tag-${sfx}`;
    const ids = emptyLearningFixtureIds();
    try {
      await insertLearningArticle(pool, ids, { title: `Draft Article ${sfx}`, tag, isPublished: false });
      const pubId = await insertLearningArticle(pool, ids, { title: `Published Article ${sfx}`, tag, isPublished: true });

      const farmerList = await service.listArticles({ page: 1, limit: 10, tag });
      expect(farmerList.items).toHaveLength(1);
      expect(farmerList.items[0]!.id).toBe(pubId);

      const adminList = await service.listAdminArticles({ page: 1, limit: 10, tag });
      expect(adminList.items).toHaveLength(2);
      expect(adminList.total).toBe(2);
    } finally {
      await cleanupLearningFixtures(pool, ids);
    }
  });

  it('BR-59l: isPublished=false returns only unpublished rows; total equals the filtered count', async (ctx) => {
    if (!ready) return ctx.skip();
    const sfx = runSuffix();
    const tag = `tag-filter-${sfx}`;
    const ids = emptyLearningFixtureIds();
    try {
      const draftId = await insertLearningArticle(pool, ids, { title: `Draft ${sfx}`, tag, isPublished: false });
      await insertLearningArticle(pool, ids, { title: `Published ${sfx}`, tag, isPublished: true });

      const res = await service.listAdminArticles({ page: 1, limit: 10, tag, isPublished: false });
      expect(res.items).toHaveLength(1);
      expect(res.items[0]!.id).toBe(draftId);
      expect(res.total).toBe(1);
    } finally {
      await cleanupLearningFixtures(pool, ids);
    }
  });

  it('BR-59n: q matches case-insensitively and treats % and _ literally', async (ctx) => {
    if (!ready) return ctx.skip();
    const sfx = runSuffix();
    const tag = `tag-q-${sfx}`;
    const ids = emptyLearningFixtureIds();
    try {
      const matchId = await insertLearningArticle(pool, ids, { title: `Special 100% Organic_Tea ${sfx}`, tag, isPublished: true });
      await insertLearningArticle(pool, ids, { title: `Other 1000 Organic Tea ${sfx}`, tag, isPublished: true });

      // Searching literally for "100%"
      const resPercent = await service.listAdminArticles({ page: 1, limit: 10, tag, q: '100%' });
      expect(resPercent.items).toHaveLength(1);
      expect(resPercent.items[0]!.id).toBe(matchId);

      // Searching literally for "organic_tea" case-insensitively
      const resUnderscore = await service.listAdminArticles({ page: 1, limit: 10, tag, q: 'organic_tea' });
      expect(resUnderscore.items).toHaveLength(1);
      expect(resUnderscore.items[0]!.id).toBe(matchId);
    } finally {
      await cleanupLearningFixtures(pool, ids);
    }
  });

  it('BR-59n: groups sort=members orders by memberCount desc; sort=name orders alphabetically', async (ctx) => {
    if (!ready) return ctx.skip();
    const sfx = runSuffix();
    const category = `SortTest-${sfx}`;
    const ids = emptyLearningFixtureIds();
    try {
      const g1 = await insertLearningGroup(pool, ids, { name: `Zeta Group ${sfx}`, category });
      const g2 = await insertLearningGroup(pool, ids, { name: `Alpha Group ${sfx}`, category });
      const { farmerId } = await insertLearningFarmer(pool, ids, sfx);
      // Add membership to g1 so memberCount is 1
      await pool.query(`INSERT INTO learning_group_memberships (group_id, farmer_id) VALUES ($1, $2)`, [g1, farmerId]);

      const byMembers = await service.listAdminGroups({ page: 1, limit: 10, category, sort: 'members' });
      expect(byMembers.items[0]!.id).toBe(g1);
      expect(byMembers.items[1]!.id).toBe(g2);

      const byName = await service.listAdminGroups({ page: 1, limit: 10, category, sort: 'name' });
      expect(byName.items[0]!.id).toBe(g2);
      expect(byName.items[1]!.id).toBe(g1);
    } finally {
      await cleanupLearningFixtures(pool, ids);
    }
  });

  it('BR-59p: q filters the farmer group list by name; without q the list is unchanged', async (ctx) => {
    if (!ready) return ctx.skip();
    const sfx = runSuffix();
    const category = `QTest-${sfx}`;
    const ids = emptyLearningFixtureIds();
    try {
      const gMatch = await insertLearningGroup(pool, ids, { name: `Specific Mango Growers ${sfx}`, category });
      const gOther = await insertLearningGroup(pool, ids, { name: `Specific Banana Growers ${sfx}`, category });

      // Without q: exactly both groups, in the default order (created_at DESC), item for item.
      const all = await service.listGroups({ page: 1, limit: 10, category });
      expect(all.total).toBe(2);
      expect(all.items.map((g) => g.id)).toEqual([gOther, gMatch]);
      expect(all.items.map((g) => g.name)).toEqual([`Specific Banana Growers ${sfx}`, `Specific Mango Growers ${sfx}`]);
      // A q both names match returns exactly the unfiltered items, in the same order.
      const viaQ = await service.listGroups({ page: 1, limit: 10, category, q: 'specific' });
      expect(viaQ.items).toEqual(all.items);

      const filtered = await service.listGroups({ page: 1, limit: 10, category, q: 'mango' });
      expect(filtered.items).toHaveLength(1);
      expect(filtered.items[0]!.id).toBe(gMatch);
    } finally {
      await cleanupLearningFixtures(pool, ids);
    }
  });
});
