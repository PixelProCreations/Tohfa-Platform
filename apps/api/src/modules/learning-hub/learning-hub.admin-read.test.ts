import { describe, expect, it, vi, beforeEach, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { RoleCode } from '@tohfa/shared-types';
import { signAccessToken } from '../../auth/jwt.js';
import { databaseReady, describeIfDatabase, IDS, newId } from '../../test/factories.js';
import { learningHubService, LearningHubService } from './learning-hub.service.js';
import type { LearningHubRepo } from './learning-hub.repo.js';
import { pool } from '../../db/pool.js';

// Mock token invalidation to avoid Redis timeouts during unit/route testing
vi.mock('../../auth/tokenInvalidation.js', () => ({
  isAccessTokenInvalidated: vi.fn().mockResolvedValue(false),
  markTokensInvalidBefore: vi.fn().mockResolvedValue(undefined),
}));

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

describe('Learning Hub Admin Reads & Farmer Group Detail (Unit / Route Tests)', () => {
  const app = createApp();
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

    it.each(adminReadPaths)('unauthenticated request to %s returns 401', async (path) => {
      const res = await request(app).get(path);
      expect(res.status).toBe(401);
    });

    it.each(adminReadPaths)('forbidden roles (FARMER_ADMIN, MAIN_WH_ADMIN, SUB_WH_ADMIN, FARMER, CUSTOMER) receive 403 on %s', async (path) => {
      for (const roleToken of [tokens.farmerAdmin, tokens.mainWhAdmin, tokens.subWhAdmin, tokens.farmer, tokens.customer]) {
        const res = await request(app).get(path).set('Authorization', `Bearer ${roleToken}`);
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
        const res = await request(app).get(path).set('Authorization', `Bearer ${roleToken}`);
        expect(res.status).toBe(200);
      }
    });

    it('farmer group detail /v1/farmers/me/learning/groups/:id returns 401 unauthenticated and 403 for CUSTOMER', async () => {
      expect((await request(app).get(`/v1/farmers/me/learning/groups/${testId}`)).status).toBe(401);
      const res = await request(app)
        .get(`/v1/farmers/me/learning/groups/${testId}`)
        .set('Authorization', `Bearer ${tokens.customer}`);
      expect(res.status).toBe(403);
    });

    it('farmer group detail /v1/farmers/me/learning/groups/:id passes auth for FARMER and returns 200', async () => {
      vi.spyOn(learningHubService, 'getFarmerGroup').mockResolvedValue({ id: testId } as never);
      const res = await request(app)
        .get(`/v1/farmers/me/learning/groups/${testId}`)
        .set('Authorization', `Bearer ${tokens.farmer}`);
      expect(res.status).toBe(200);
    });
  });

  describe('Validation: parameter limits and formats (BR-59n)', () => {
    it('BR-59n: q of 81 characters returns 422 VALIDATION_FAILED on admin and farmer list endpoints', async () => {
      const longQ = 'a'.repeat(81);
      const adminArticles = await request(app)
        .get(`/v1/admin/learning/articles?q=${longQ}`)
        .set('Authorization', `Bearer ${tokens.superAdmin}`);
      expect(adminArticles.status).toBe(422);

      const adminGroups = await request(app)
        .get(`/v1/admin/learning/groups?q=${longQ}`)
        .set('Authorization', `Bearer ${tokens.superAdmin}`);
      expect(adminGroups.status).toBe(422);

      const farmerGroups = await request(app)
        .get(`/v1/farmers/me/learning/groups?q=${longQ}`)
        .set('Authorization', `Bearer ${tokens.farmer}`);
      expect(farmerGroups.status).toBe(422);
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
describeIfDatabase('Learning Hub Admin Reads (Real SQL)', () => {
  let ready = false;
  const ts = Date.now();
  const service = learningHubService;

  beforeAll(async () => {
    ready = await databaseReady('learning_articles');
  });

  it('BR-59l: admin article list includes unpublished articles; the farmer list still hides them', async () => {
    if (!ready) return;
    const tag = `tag-${ts}`;
    const draft = await pool.query<{ id: string }>(
      `INSERT INTO learning_articles (title, content, snippet, read_time, author, tag, language, is_published)
       VALUES ($1, 'content', 'snippet', '3 min', 'Admin', $2, 'en', false) RETURNING id`,
      [`Draft Article ${ts}`, tag],
    );
    const pub = await pool.query<{ id: string }>(
      `INSERT INTO learning_articles (title, content, snippet, read_time, author, tag, language, is_published)
       VALUES ($1, 'content', 'snippet', '3 min', 'Admin', $2, 'en', true) RETURNING id`,
      [`Published Article ${ts}`, tag],
    );

    try {
      const farmerList = await service.listArticles({ page: 1, limit: 10, tag });
      expect(farmerList.items).toHaveLength(1);
      expect(farmerList.items[0]!.id).toBe(pub.rows[0]!.id);

      const adminList = await service.listAdminArticles({ page: 1, limit: 10, tag });
      expect(adminList.items).toHaveLength(2);
      expect(adminList.total).toBe(2);
    } finally {
      await pool.query(`DELETE FROM learning_articles WHERE id = ANY($1::uuid[])`, [
        [draft.rows[0]!.id, pub.rows[0]!.id],
      ]);
    }
  });

  it('BR-59l: isPublished=false returns only unpublished rows; total equals the filtered count', async () => {
    if (!ready) return;
    const tag = `tag-filter-${ts}`;
    const draft = await pool.query<{ id: string }>(
      `INSERT INTO learning_articles (title, content, snippet, read_time, author, tag, language, is_published)
       VALUES ($1, 'content', 'snippet', '3 min', 'Admin', $2, 'en', false) RETURNING id`,
      [`Draft ${ts}`, tag],
    );
    const pub = await pool.query<{ id: string }>(
      `INSERT INTO learning_articles (title, content, snippet, read_time, author, tag, language, is_published)
       VALUES ($1, 'content', 'snippet', '3 min', 'Admin', $2, 'en', true) RETURNING id`,
      [`Published ${ts}`, tag],
    );

    try {
      const res = await service.listAdminArticles({ page: 1, limit: 10, tag, isPublished: false });
      expect(res.items).toHaveLength(1);
      expect(res.items[0]!.id).toBe(draft.rows[0]!.id);
      expect(res.total).toBe(1);
    } finally {
      await pool.query(`DELETE FROM learning_articles WHERE id = ANY($1::uuid[])`, [
        [draft.rows[0]!.id, pub.rows[0]!.id],
      ]);
    }
  });

  it('BR-59n: q matches case-insensitively and treats % and _ literally', async () => {
    if (!ready) return;
    const tag = `tag-q-${ts}`;
    const match = await pool.query<{ id: string }>(
      `INSERT INTO learning_articles (title, content, snippet, read_time, author, tag, language, is_published)
       VALUES ($1, 'content', 'snippet', '3 min', 'Admin', $2, 'en', true) RETURNING id`,
      [`Special 100% Organic_Tea ${ts}`, tag],
    );
    const other = await pool.query<{ id: string }>(
      `INSERT INTO learning_articles (title, content, snippet, read_time, author, tag, language, is_published)
       VALUES ($1, 'content', 'snippet', '3 min', 'Admin', $2, 'en', true) RETURNING id`,
      [`Other 1000 Organic Tea ${ts}`, tag],
    );

    try {
      // Searching literally for "100%"
      const resPercent = await service.listAdminArticles({ page: 1, limit: 10, tag, q: '100%' });
      expect(resPercent.items).toHaveLength(1);
      expect(resPercent.items[0]!.id).toBe(match.rows[0]!.id);

      // Searching literally for "organic_tea" case-insensitively
      const resUnderscore = await service.listAdminArticles({ page: 1, limit: 10, tag, q: 'organic_tea' });
      expect(resUnderscore.items).toHaveLength(1);
      expect(resUnderscore.items[0]!.id).toBe(match.rows[0]!.id);
    } finally {
      await pool.query(`DELETE FROM learning_articles WHERE id = ANY($1::uuid[])`, [
        [match.rows[0]!.id, other.rows[0]!.id],
      ]);
    }
  });

  it('BR-59n: groups sort=members orders by memberCount desc; sort=name orders alphabetically', async () => {
    if (!ready) return;
    const g1 = (
      await pool.query<{ id: string }>(
        `INSERT INTO learning_groups (name, category) VALUES ($1, 'SortTest') RETURNING id`,
        [`Zeta Group ${ts}`],
      )
    ).rows[0]!.id;
    const g2 = (
      await pool.query<{ id: string }>(
        `INSERT INTO learning_groups (name, category) VALUES ($1, 'SortTest') RETURNING id`,
        [`Alpha Group ${ts}`],
      )
    ).rows[0]!.id;

    // Insert dummy farmer user for membership
    const u = newId();
    await pool.query(`INSERT INTO users (id, mobile, full_name, user_type) VALUES ($1, $2, 'Sort Farmer', 'FARMER')`, [
      u,
      `+9179${String(ts).slice(-8)}`,
    ]);
    const f = (
      await pool.query<{ id: string }>(
        `INSERT INTO farmers (user_id, tohfa_farmer_id, application_status) VALUES ($1, $2, 'APPROVED') RETURNING id`,
        [u, `TF-SORT-${ts}`],
      )
    ).rows[0]!.id;

    // Add membership to g1 so memberCount is 1
    await pool.query(`INSERT INTO learning_group_memberships (group_id, farmer_id) VALUES ($1, $2)`, [g1, f]);

    try {
      const byMembers = await service.listAdminGroups({ page: 1, limit: 10, category: 'SortTest', sort: 'members' });
      expect(byMembers.items[0]!.id).toBe(g1);
      expect(byMembers.items[1]!.id).toBe(g2);

      const byName = await service.listAdminGroups({ page: 1, limit: 10, category: 'SortTest', sort: 'name' });
      expect(byName.items[0]!.id).toBe(g2);
      expect(byName.items[1]!.id).toBe(g1);
    } finally {
      await pool.query(`DELETE FROM learning_groups WHERE id = ANY($1::uuid[])`, [[g1, g2]]);
      await pool.query(`DELETE FROM farmers WHERE id = $1`, [f]);
      await pool.query(`DELETE FROM users WHERE id = $1`, [u]);
    }
  });

  it('BR-59p: q filters the farmer group list by name; without q the list is unchanged', async () => {
    if (!ready) return;
    const gMatch = (
      await pool.query<{ id: string }>(
        `INSERT INTO learning_groups (name, category) VALUES ($1, 'QTest') RETURNING id`,
        [`Specific Mango Growers ${ts}`],
      )
    ).rows[0]!.id;
    const gOther = (
      await pool.query<{ id: string }>(
        `INSERT INTO learning_groups (name, category) VALUES ($1, 'QTest') RETURNING id`,
        [`Specific Banana Growers ${ts}`],
      )
    ).rows[0]!.id;

    try {
      const all = await service.listGroups({ page: 1, limit: 10, category: 'QTest' });
      expect(all.items).toHaveLength(2);

      const filtered = await service.listGroups({ page: 1, limit: 10, category: 'QTest', q: 'mango' });
      expect(filtered.items).toHaveLength(1);
      expect(filtered.items[0]!.id).toBe(gMatch);
    } finally {
      await pool.query(`DELETE FROM learning_groups WHERE id = ANY($1::uuid[])`, [[gMatch, gOther]]);
    }
  });
});
