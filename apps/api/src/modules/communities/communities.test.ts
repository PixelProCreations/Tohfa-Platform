import { describe, expect, it, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { Server } from 'node:http';
import type { PoolClient } from 'pg';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { withTransaction } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { aScope, describeIfDatabase, IDS, newId } from '../../test/factories.js';
import type { GroupRow } from '../learning-hub/learning-hub.repo.js';
import {
  communitiesRepo,
  type CommunitiesRepo,
  type CommunityRow,
} from './communities.repo.js';
import { CommunitiesService } from './communities.service.js';
import type {
  CreateCommunityBody,
  ListCommunitiesQuery,
  UpdateCommunityBody,
} from './communities.schema.js';

function adminScope(roleCode: RoleCode = RoleCode.SUPER_ADMIN, userId: string = IDS.userSuperAdmin): ResolvedScope {
  return aScope({
    level: ScopeLevel.ALL,
    userId,
    roleCode,
    permission: 'community.group.moderate',
  });
}

function dummyCommunity(overrides: Partial<CommunityRow> = {}): CommunityRow {
  return {
    id: overrides.id ?? newId(),
    name: overrides.name ?? 'Nilgiris Organic Tea Community',
    description: overrides.description ?? 'A collaborative community for tea farmers.',
    category: overrides.category ?? 'Tea',
    rules: overrides.rules ?? 'Be respectful and share verified practices.',
    is_archived: overrides.is_archived ?? false,
    archived_at: overrides.archived_at ?? null,
    created_by: overrides.created_by ?? IDS.userSuperAdmin,
    created_at: overrides.created_at ?? new Date().toISOString(),
    updated_at: overrides.updated_at ?? new Date().toISOString(),
    deleted_at: overrides.deleted_at ?? null,
    group_count: overrides.group_count ?? 2,
    member_count: overrides.member_count ?? 15,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Unit Tests (Mocked Repo)
// ─────────────────────────────────────────────────────────────────────────────
describe('CommunitiesService unit tests (BR-59s)', () => {
  const noopDb = {
    query: vi.fn().mockResolvedValue({ rows: [{ id: '00000000-0000-4000-8000-000000000099' }] }),
  } as unknown as PoolClient;
  const directTx: typeof withTransaction = async (fn) => fn(noopDb);

  it('listCommunities delegates to repo and returns mapped response', async () => {
    const row = dummyCommunity();
    const repo: CommunitiesRepo = {
      findCommunities: vi.fn().mockResolvedValue({ rows: [row], total: 1 }),
      findCommunityById: vi.fn(),
      createCommunity: vi.fn(),
      updateCommunity: vi.fn(),
      archiveCommunity: vi.fn(),
      findCommunityGroups: vi.fn(),
      findCommunityMembers: vi.fn(),
    };

    const service = new CommunitiesService({ db: noopDb, runTx: directTx, repo });
    const query: ListCommunitiesQuery = { page: 1, limit: 20, category: 'Tea' };
    const res = await service.listCommunities(query);

    expect(repo.findCommunities).toHaveBeenCalledWith(noopDb, query);
    expect(res.total).toBe(1);
    expect(res.items).toHaveLength(1);
    expect(res.items[0]?.name).toBe(row.name);
    expect(res.items[0]?.groupCount).toBe(row.group_count);
    expect(res.items[0]?.memberCount).toBe(row.member_count);
  });

  it('getCommunity returns mapped community or throws NOT_FOUND', async () => {
    const row = dummyCommunity();
    const repo: CommunitiesRepo = {
      findCommunities: vi.fn(),
      findCommunityById: vi.fn().mockImplementation(async (_db, id) => (id === row.id ? row : null)),
      createCommunity: vi.fn(),
      updateCommunity: vi.fn(),
      archiveCommunity: vi.fn(),
      findCommunityGroups: vi.fn(),
      findCommunityMembers: vi.fn(),
    };

    const service = new CommunitiesService({ db: noopDb, runTx: directTx, repo });
    const found = await service.getCommunity(row.id);
    expect(found.id).toBe(row.id);
    expect(found.name).toBe(row.name);

    await expect(service.getCommunity(newId())).rejects.toThrow(AppError);
  });

  it('createCommunity writes community and runs inside transaction', async () => {
    const row = dummyCommunity();
    const repo: CommunitiesRepo = {
      findCommunities: vi.fn(),
      findCommunityById: vi.fn(),
      createCommunity: vi.fn().mockResolvedValue(row),
      updateCommunity: vi.fn(),
      archiveCommunity: vi.fn(),
      findCommunityGroups: vi.fn(),
      findCommunityMembers: vi.fn(),
    };

    let txRan = false;
    const testTx: typeof withTransaction = async (fn) => {
      txRan = true;
      return fn(noopDb);
    };

    const service = new CommunitiesService({ db: noopDb, runTx: testTx, repo });
    const scope = adminScope();
    const body: CreateCommunityBody = {
      name: row.name,
      description: row.description,
      category: row.category,
      rules: row.rules,
    };

    const created = await service.createCommunity(scope, body);
    expect(txRan).toBe(true);
    expect(repo.createCommunity).toHaveBeenCalledWith(noopDb, body, scope.userId);
    expect(created.name).toBe(row.name);
  });

  it('updateCommunity verifies existence and writes changes', async () => {
    const before = dummyCommunity();
    const updated = { ...before, name: 'Updated Community Name' };
    const repo: CommunitiesRepo = {
      findCommunities: vi.fn(),
      findCommunityById: vi.fn().mockResolvedValue(before),
      createCommunity: vi.fn(),
      updateCommunity: vi.fn().mockResolvedValue(updated),
      archiveCommunity: vi.fn(),
      findCommunityGroups: vi.fn(),
      findCommunityMembers: vi.fn(),
    };

    const service = new CommunitiesService({ db: noopDb, runTx: directTx, repo });
    const scope = adminScope();
    const patch: UpdateCommunityBody = { name: 'Updated Community Name' };

    const result = await service.updateCommunity(scope, before.id, patch);
    expect(result.name).toBe('Updated Community Name');
    expect(repo.updateCommunity).toHaveBeenCalledWith(noopDb, before.id, patch);
  });

  it('archiveCommunity marks community as archived', async () => {
    const before = dummyCommunity({ is_archived: false, archived_at: null });
    const nowIso = new Date().toISOString();
    const updated = { ...before, is_archived: true, archived_at: nowIso };
    const repo: CommunitiesRepo = {
      findCommunities: vi.fn(),
      findCommunityById: vi.fn().mockResolvedValue(before),
      createCommunity: vi.fn(),
      updateCommunity: vi.fn(),
      archiveCommunity: vi.fn().mockResolvedValue(updated),
      findCommunityGroups: vi.fn(),
      findCommunityMembers: vi.fn(),
    };

    const service = new CommunitiesService({ db: noopDb, runTx: directTx, repo });
    const scope = adminScope();

    const result = await service.archiveCommunity(scope, before.id);
    expect(result.isArchived).toBe(true);
    expect(result.archivedAt).toBe(nowIso);
    expect(repo.archiveCommunity).toHaveBeenCalledWith(noopDb, before.id);
  });

  it('listCommunityGroups throws NOT_FOUND when community does not exist', async () => {
    const repo: CommunitiesRepo = {
      findCommunities: vi.fn(),
      findCommunityById: vi.fn().mockResolvedValue(null),
      createCommunity: vi.fn(),
      updateCommunity: vi.fn(),
      archiveCommunity: vi.fn(),
      findCommunityGroups: vi.fn(),
      findCommunityMembers: vi.fn(),
    };

    const service = new CommunitiesService({ db: noopDb, runTx: directTx, repo });
    await expect(service.listCommunityGroups(newId(), { page: 1, limit: 20 })).rejects.toThrow(
      AppError,
    );
  });

  it('listCommunityMembers throws NOT_FOUND when community does not exist', async () => {
    const repo: CommunitiesRepo = {
      findCommunities: vi.fn(),
      findCommunityById: vi.fn().mockResolvedValue(null),
      createCommunity: vi.fn(),
      updateCommunity: vi.fn(),
      archiveCommunity: vi.fn(),
      findCommunityGroups: vi.fn(),
      findCommunityMembers: vi.fn(),
    };

    const service = new CommunitiesService({ db: noopDb, runTx: directTx, repo });
    await expect(service.listCommunityMembers(newId(), { page: 1, limit: 20 })).rejects.toThrow(
      AppError,
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. HTTP Route / RBAC Tests
// ─────────────────────────────────────────────────────────────────────────────
describe('admin communities HTTP routes & RBAC (BR-59s)', () => {
  let server: Server;
  const token = (role: RoleCode): string =>
    `Bearer ${signAccessToken({
      sub: IDS.userSuperAdmin,
      roles: [{ code: role }],
      farmerId: role === RoleCode.FARMER ? IDS.farmer : null,
      customerId: role === RoleCode.CUSTOMER ? IDS.customer : null,
    })}`;

  beforeAll(() => {
    server = createApp().listen(0);
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('GET /v1/admin/communities is 401 without token', async () => {
    const res = await request(server).get('/v1/admin/communities');
    expect(res.status).toBe(401);
  });

  it('GET /v1/admin/communities is 403 for FARMER and CUSTOMER', async () => {
    const resFarmer = await request(server)
      .get('/v1/admin/communities')
      .set('Authorization', token(RoleCode.FARMER));
    expect(resFarmer.status).toBe(403);

    const resCustomer = await request(server)
      .get('/v1/admin/communities')
      .set('Authorization', token(RoleCode.CUSTOMER));
    expect(resCustomer.status).toBe(403);
  });

  it('GET /v1/admin/communities is 403 for MAIN_WH_ADMIN and SUB_WH_ADMIN', async () => {
    const resMain = await request(server)
      .get('/v1/admin/communities')
      .set('Authorization', token(RoleCode.MAIN_WH_ADMIN));
    expect(resMain.status).toBe(403);

    const resSub = await request(server)
      .get('/v1/admin/communities')
      .set('Authorization', token(RoleCode.SUB_WH_ADMIN));
    expect(resSub.status).toBe(403);
  });

  it('GET /v1/admin/communities is allowed for SUPER_ADMIN, TOHFA_ADMIN, and FARMER_ADMIN', async () => {
    for (const role of [RoleCode.SUPER_ADMIN, RoleCode.TOHFA_ADMIN, RoleCode.FARMER_ADMIN]) {
      const res = await request(server)
        .get('/v1/admin/communities')
        .set('Authorization', token(role));
      expect(res.status).not.toBe(401);
      expect(res.status).not.toBe(403);
    }
  });

  it('POST /v1/admin/communities validates request body (422 on empty body)', async () => {
    const res = await request(server)
      .post('/v1/admin/communities')
      .set('Authorization', token(RoleCode.SUPER_ADMIN))
      .send({});
    expect(res.status).toBe(422);
  });

  it('GET /v1/admin/communities/:id validates UUID param (422 on non-UUID)', async () => {
    const res = await request(server)
      .get('/v1/admin/communities/not-a-uuid')
      .set('Authorization', token(RoleCode.SUPER_ADMIN));
    expect(res.status).toBe(422);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Integration Against PostgreSQL (BR-59s)
// ─────────────────────────────────────────────────────────────────────────────
describeIfDatabase('Communities Integration against PostgreSQL (BR-59s)', () => {
  let server: Server;

  beforeAll(() => {
    server = createApp().listen(0);
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('BR-59s: Full lifecycle — create community, assign groups, derive members, archive, and verify ON DELETE SET NULL', async () => {
    await withTransaction(async (tx) => {
      const txService = new CommunitiesService({
        db: tx,
        runTx: async (fn) => fn(tx),
        repo: communitiesRepo,
      });

      // 1. Create a community
      const commBody: CreateCommunityBody = {
        name: `Test Community ${Date.now()}`,
        description: 'Integration test community container',
        category: 'Spices',
        rules: 'Follow organic spice guidelines.',
      };
      const createdComm = await txService.createCommunity(adminScope(), commBody);
      expect(createdComm.id).toBeDefined();
      expect(createdComm.name).toBe(commBody.name);
      expect(createdComm.groupCount).toBe(0);
      expect(createdComm.memberCount).toBe(0);
      expect(createdComm.isArchived).toBe(false);

      // 2. Read community via service
      const fetchedComm = await txService.getCommunity(createdComm.id);
      expect(fetchedComm.id).toBe(createdComm.id);

      // 3. Create two learning groups inside this community
      const g1 = await tx.query<GroupRow>(
        `INSERT INTO learning_groups (name, description, category, community_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, description, category, archived_at, community_id, created_at, updated_at`,
        ['Black Pepper Growers', 'Pepper group', 'Spices', createdComm.id],
      );
      const g2 = await tx.query<GroupRow>(
        `INSERT INTO learning_groups (name, description, category, community_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, description, category, archived_at, community_id, created_at, updated_at`,
        ['Cardamom Collective', 'Cardamom group', 'Spices', createdComm.id],
      );
      const group1Id = g1.rows[0]!.id;
      const group2Id = g2.rows[0]!.id;

      // 4. Enroll farmer in both groups
      await tx.query(
        `INSERT INTO learning_group_memberships (group_id, farmer_id)
         VALUES ($1, $2), ($3, $2)
         ON CONFLICT DO NOTHING`,
        [group1Id, IDS.farmer, group2Id],
      );

      // 5. Verify community groups endpoint returns both groups
      const commGroups = await txService.listCommunityGroups(createdComm.id, {
        page: 1,
        limit: 10,
      });
      expect(commGroups.total).toBe(2);
      expect(commGroups.items.map((g) => g.id).sort()).toEqual([group1Id, group2Id].sort());

      // 6. Verify community members endpoint derives the farmer
      const commMembers = await txService.listCommunityMembers(createdComm.id, {
        page: 1,
        limit: 10,
      });
      expect(commMembers.total).toBe(1);
      expect(commMembers.items[0]?.farmerId).toBe(IDS.farmer);
      expect(commMembers.items[0]?.groupCount).toBe(2);
      expect(commMembers.items[0]?.groups).toHaveLength(2);

      // 7. Verify list & detail reflect groupCount=2, memberCount=1
      const commList = await txService.listCommunities({
        page: 1,
        limit: 10,
        category: 'Spices',
      });
      const listed = commList.items.find((c) => c.id === createdComm.id);
      expect(listed).toBeDefined();
      expect(listed?.groupCount).toBe(2);
      expect(listed?.memberCount).toBe(1);

      // 8. Archive community (BR-59q mirror)
      const archived = await txService.archiveCommunity(adminScope(), createdComm.id);
      expect(archived.isArchived).toBe(true);
      expect(archived.archivedAt).toBeTruthy();

      // 9. Verify ON DELETE SET NULL on learning_groups.community_id
      await tx.query(`DELETE FROM communities WHERE id = $1`, [createdComm.id]);
      const g1After = await tx.query<{ community_id: string | null }>(
        `SELECT community_id FROM learning_groups WHERE id = $1`,
        [group1Id],
      );
      expect(g1After.rows[0]?.community_id).toBeNull();

      // Groups still survive!
      const g2After = await tx.query<{ id: string }>(
        `SELECT id FROM learning_groups WHERE id = $1`,
        [group2Id],
      );
      expect(g2After.rows[0]?.id).toBe(group2Id);

      // Throw to rollback everything
      throw new Error('ROLLBACK_TEST_TX');
    }).catch((err) => {
      if (err instanceof Error && err.message === 'ROLLBACK_TEST_TX') return;
      throw err;
    });
  });
});
