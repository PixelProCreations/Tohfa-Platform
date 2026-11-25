/**
 * Learning Hub admin reads and farmer group detail through the REAL SQL path (BR-59m, BR-59n,
 * BR-59o). A sibling of learning-hub.admin-read.test.ts, split out to keep both files under
 * 800 lines. Rows are COMMITTED through the shared pool, so the suite refuses a database whose
 * name lacks "test", creates every fixture inside the try whose finally removes it, and suffixes
 * every name / category with a per-run random value.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { pool } from '../../db/pool.js';
import { aScope, describeIfDatabase, newId } from '../../test/factories.js';
import { requireDatabaseTables, requireTestDatabaseName } from '../../test/dbFixtures.js';
import {
  cleanupLearningFixtures,
  emptyLearningFixtureIds,
  insertLearningArticle,
  insertLearningFarmer,
  insertLearningGroup,
  insertLearningTraining,
  insertLearningVideo,
  runSuffix,
} from '../../test/learningHubFixtures.js';
import { learningHubService } from './learning-hub.service.js';

describe('requireTestDatabaseName (guard for suites that commit rows)', () => {
  const fakeDb = (name: string): Executor => ({ query: async () => ({ rows: [{ name }] }) }) as unknown as Executor;

  it('refuses a database whose name does not contain "test"', async () => {
    await expect(requireTestDatabaseName(fakeDb('tohfa'))).rejects.toThrow(/refusing to commit fixture rows into database "tohfa"/);
  });

  it('accepts a test database', async () => {
    await expect(requireTestDatabaseName(fakeDb('tohfa_test'))).resolves.toBeUndefined();
  });
});

describeIfDatabase('Learning Hub admin reads and farmer group detail (Real SQL, part 2)', () => {
  let ready = false;
  const service = learningHubService;

  beforeAll(async () => {
    ready = await requireDatabaseTables(
      'learning_articles',
      'learning_videos',
      'learning_trainings',
      'learning_groups',
      'learning_group_memberships',
      'farmers',
    );
    if (!ready) return;
    await requireTestDatabaseName(pool);
  });

  it('BR-59m: an admin reads an UNPUBLISHED article, video and training by id with full content; the farmer read is 404', async (ctx) => {
    if (!ready) return ctx.skip();
    const sfx = runSuffix();
    const ids = emptyLearningFixtureIds();
    try {
      const articleId = await insertLearningArticle(pool, ids, {
        title: `Draft detail ${sfx}`,
        tag: `tag-detail-${sfx}`,
        isPublished: false,
        content: `full body ${sfx}`,
      });
      const videoId = await insertLearningVideo(pool, ids, { title: `Draft video ${sfx}`, isPublished: false });
      const trainingId = await insertLearningTraining(pool, ids, { title: `Draft training ${sfx}`, isPublished: false });

      const article = await service.getAdminArticle(articleId);
      expect(article).toMatchObject({ id: articleId, isPublished: false, content: `full body ${sfx}` });

      const video = await service.getAdminVideo(videoId);
      expect(video).toMatchObject({ id: videoId, isPublished: false, title: `Draft video ${sfx}` });

      const training = await service.getAdminTraining(trainingId);
      expect(training).toMatchObject({ id: trainingId, isPublished: false, title: `Draft training ${sfx}` });

      // The same unpublished article is invisible on the farmer read (BR-59k), so the admin
      // read above really is the unpublished path, not a published row.
      await expect(service.getArticle(articleId)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    } finally {
      await cleanupLearningFixtures(pool, ids);
    }
  });

  it('BR-59o: a farmer reads one group with isJoined true after joining and false after leaving; no member identity', async (ctx) => {
    if (!ready) return ctx.skip();
    const sfx = runSuffix();
    const ids = emptyLearningFixtureIds();
    try {
      const groupId = await insertLearningGroup(pool, ids, { name: `Detail Group ${sfx}`, category: `detail-${sfx}` });
      const me = await insertLearningFarmer(pool, ids, sfx);
      const other = await insertLearningFarmer(pool, ids, sfx);
      const scope = aScope({
        level: ScopeLevel.OWN,
        permission: 'farmer.learning.participate_own',
        roleCode: RoleCode.FARMER,
        userId: me.userId,
        farmerId: me.farmerId,
      });

      expect(await service.getFarmerGroup(me.farmerId, groupId)).toMatchObject({ id: groupId, isJoined: false, memberCount: 0 });

      await service.joinGroup(scope, groupId);
      const joined = await service.getFarmerGroup(me.farmerId, groupId);
      expect(joined).toMatchObject({ id: groupId, isJoined: true, memberCount: 1 });
      // Membership is per farmer: another farmer sees the count but is not joined.
      expect(await service.getFarmerGroup(other.farmerId, groupId)).toMatchObject({ isJoined: false, memberCount: 1 });
      const wire = JSON.stringify(joined);
      expect(wire).not.toContain(me.farmerId);
      expect(wire).not.toContain(me.userId);
      expect(joined).not.toHaveProperty('members');

      await service.leaveGroup(scope, groupId);
      expect(await service.getFarmerGroup(me.farmerId, groupId)).toMatchObject({ id: groupId, isJoined: false, memberCount: 0 });
    } finally {
      await cleanupLearningFixtures(pool, ids);
    }
  });

  it('BR-59n: q on admin videos, trainings and groups matches case-insensitively and treats % and _ literally', async (ctx) => {
    if (!ready) return ctx.skip();
    const sfx = runSuffix();
    const category = `q-${sfx}`;
    const ids = emptyLearningFixtureIds();
    try {
      // Each pair: a title that matches literally, and one that would match only if % or _
      // were treated as wildcards.
      const videoPct = await insertLearningVideo(pool, ids, { title: `${sfx} 100% pure`, isPublished: false });
      await insertLearningVideo(pool, ids, { title: `${sfx} 1000 pure`, isPublished: true });
      const videoUnd = await insertLearningVideo(pool, ids, { title: `${sfx} Pure_Tea`, isPublished: true });
      await insertLearningVideo(pool, ids, { title: `${sfx} PureXTea`, isPublished: true });

      const trainPct = await insertLearningTraining(pool, ids, { title: `${sfx} 100% field`, isPublished: false });
      await insertLearningTraining(pool, ids, { title: `${sfx} 1000 field`, isPublished: true });
      const trainUnd = await insertLearningTraining(pool, ids, { title: `${sfx} Field_Day`, isPublished: true });
      await insertLearningTraining(pool, ids, { title: `${sfx} FieldXDay`, isPublished: true });

      const groupPct = await insertLearningGroup(pool, ids, { name: `${sfx} 100% growers`, category });
      await insertLearningGroup(pool, ids, { name: `${sfx} 1000 growers`, category });
      const groupUnd = await insertLearningGroup(pool, ids, { name: `${sfx} Tea_Club`, category });
      await insertLearningGroup(pool, ids, { name: `${sfx} TeaXClub`, category });

      const only = (r: { items: Array<{ id: string }>; total: number }) => ({ ids: r.items.map((i) => i.id), total: r.total });
      const page = { page: 1, limit: 50 };

      expect(only(await service.listAdminVideos({ ...page, q: `${sfx} 100%` }))).toEqual({ ids: [videoPct], total: 1 });
      expect(only(await service.listAdminVideos({ ...page, q: `${sfx} PURE_TEA`.toUpperCase() }))).toEqual({ ids: [videoUnd], total: 1 });

      expect(only(await service.listAdminTrainings({ ...page, q: `${sfx} 100%` }))).toEqual({ ids: [trainPct], total: 1 });
      expect(only(await service.listAdminTrainings({ ...page, q: `${sfx} field_day`.toLowerCase() }))).toEqual({ ids: [trainUnd], total: 1 });

      expect(only(await service.listAdminGroups({ ...page, category, q: `${sfx} 100%` }))).toEqual({ ids: [groupPct], total: 1 });
      expect(only(await service.listAdminGroups({ ...page, category, q: `${sfx} TEA_CLUB`.toUpperCase() }))).toEqual({ ids: [groupUnd], total: 1 });
    } finally {
      await cleanupLearningFixtures(pool, ids);
    }
  });

  it('BR-59n: group sorts compare names case-insensitively in both sort=name and sort=members, with a final id tie-break', async (ctx) => {
    if (!ready) return ctx.skip();
    const sfx = runSuffix();
    const category = `sort-${sfx}`;
    const ids = emptyLearningFixtureIds();
    try {
      // The test database collates with "C", where 'Beta' < 'alpha'. A case-sensitive name
      // comparison would therefore put Beta first; LOWER() puts alpha first.
      const alpha = await insertLearningGroup(pool, ids, { name: `alpha ${sfx}`, category });
      const beta = await insertLearningGroup(pool, ids, { name: `Beta ${sfx}`, category });
      // Two groups whose names are equal ignoring case: only the id can order them. The larger
      // id is inserted first so that physical (insertion) order disagrees with id order.
      // uuid ordering in PostgreSQL is byte order, which equals the order of the lowercase hex text.
      const [lowId, highId] = [newId(), newId()].sort() as [string, string];
      await insertLearningGroup(pool, ids, { id: highId, name: `Gamma ${sfx}`, category });
      await insertLearningGroup(pool, ids, { id: lowId, name: `GAMMA ${sfx}`, category });

      const expected = [alpha, beta, lowId, highId];
      const byName = await service.listAdminGroups({ page: 1, limit: 10, category, sort: 'name' });
      expect(byName.items.map((g) => g.id)).toEqual(expected);

      // Every group has 0 members, so sort=members falls through to the name and id tie-breaks.
      const byMembers = await service.listAdminGroups({ page: 1, limit: 10, category, sort: 'members' });
      expect(byMembers.items.map((g) => g.id)).toEqual(expected);
    } finally {
      await cleanupLearningFixtures(pool, ids);
    }
  });
});
