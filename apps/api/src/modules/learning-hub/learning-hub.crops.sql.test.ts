/**
 * Learning Hub crop tagging through the REAL SQL path (BR-59r).
 *
 * A sibling of learning-hub.test.ts, which covers the same contract against a
 * mocked repo. This file exists because the interesting parts are in SQL that a
 * fake cannot reproduce: the correlated `json_agg` that builds the chip list,
 * the `deleted_at IS NULL` join that hides a crop retired after it was tagged,
 * and the ON DELETE CASCADE from the content row to its tags.
 *
 * Rows are COMMITTED through the shared pool (the service owns its own
 * transactions), so the suite refuses a database whose name lacks "test",
 * creates every fixture inside the try whose finally removes it, and suffixes
 * every name and slug with a per-run random value.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { pool } from '../../db/pool.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { aScope, describeIfDatabase, newId } from '../../test/factories.js';
import { randomMobile, requireDatabaseTables, requireTestDatabaseName } from '../../test/dbFixtures.js';
import {
  cleanupLearningFixtures,
  emptyLearningFixtureIds,
  runSuffix,
} from '../../test/learningHubFixtures.js';
import { learningHubService } from './learning-hub.service.js';

describeIfDatabase('Learning Hub crop tagging (Real SQL, BR-59r)', () => {
  let ready = false;
  const service = learningHubService;
  let admin: ResolvedScope;

  beforeAll(async () => {
    ready = await requireDatabaseTables(
      'learning_articles',
      'learning_videos',
      'learning_article_crops',
      'learning_video_crops',
      'crop_master',
      'categories',
    );
    if (!ready) return;
    await requireTestDatabaseName(pool);
    // A real user row: every mutation below writes an audit_log row whose
    // actor_id references users(id). The user is left behind on purpose —
    // audit_log is append-only and its FK forbids removing a named actor.
    const adminUser = newId();
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status)
       VALUES ($1, $2, 'LH Crop Tagging Admin', 'ADMIN', 'ACTIVE')`,
      [adminUser, randomMobile()],
    );
    admin = aScope({
      level: ScopeLevel.ALL,
      permission: 'learning.admin.manage',
      roleCode: RoleCode.SUPER_ADMIN,
      userId: adminUser,
    });
  });

  /** A crop_master row of this suite's own. `code` is filled in by the 0090 trigger. */
  async function insertCrop(
    cropIds: string[],
    row: { name: string; nameTa: string | null; slug: string; deleted?: boolean },
  ): Promise<string> {
    const res = await pool.query<{ id: string }>(
      `INSERT INTO crop_master (slug, name, name_ta, category_id, deleted_at)
       VALUES ($1, $2, $3, (SELECT id FROM categories ORDER BY id LIMIT 1), $4)
       RETURNING id`,
      [row.slug, row.name, row.nameTa, row.deleted === true ? new Date().toISOString() : null],
    );
    const id = res.rows[0]!.id;
    cropIds.push(id);
    return id;
  }

  const article = (sfx: string) => ({
    title: `Crop tagging article ${sfx}`,
    content: `body ${sfx}`,
    readTime: '4 min read',
    author: 'Agronomy Desk',
    tag: `tag-crops-${sfx}`,
    language: 'en' as const,
    isPublished: true,
  });

  const video = (sfx: string) => ({
    title: `Crop tagging video ${sfx}`,
    videoUrl: 'https://videos.tohfa.test/crop-tagging',
    duration: '5:00',
    author: 'Field Team',
    language: 'en' as const,
    isFeatured: false,
    isPublished: true,
  });

  it('BR-59r: an article round-trips its crop chips through create, detail, list and admin list', async (ctx) => {
    if (!ready) return ctx.skip();
    const sfx = runSuffix();
    const ids = emptyLearningFixtureIds();
    const cropIds: string[] = [];
    try {
      const carrot = await insertCrop(cropIds, { name: `Carrot ${sfx}`, nameTa: 'கேரட்', slug: `carrot-${sfx}` });
      const beet = await insertCrop(cropIds, { name: `Beetroot ${sfx}`, nameTa: null, slug: `beet-${sfx}` });

      const created = await service.createArticle(admin, { ...article(sfx), cropIds: [carrot, beet] });
      ids.articles.push(created.id);

      // Ordered by crop name: Beetroot before Carrot.
      const expected = [
        { id: beet, name: `Beetroot ${sfx}`, nameTa: null },
        { id: carrot, name: `Carrot ${sfx}`, nameTa: 'கேரட்' },
      ];
      expect(created.crops).toEqual(expected);

      // Every read path carries the chips, not just the one that wrote them.
      expect((await service.getAdminArticle(created.id)).crops).toEqual(expected);
      expect((await service.getArticle(created.id)).crops).toEqual(expected);

      const adminList = await service.listAdminArticles({ page: 1, limit: 10, tag: `tag-crops-${sfx}` });
      expect(adminList.items).toHaveLength(1);
      expect(adminList.items[0]!.crops).toEqual(expected);

      const farmerList = await service.listArticles({ page: 1, limit: 10, tag: `tag-crops-${sfx}` });
      expect(farmerList.items[0]!.crops).toEqual(expected);
    } finally {
      await cleanupLearningFixtures(pool, ids);
      await pool.query(`DELETE FROM crop_master WHERE id = ANY($1::uuid[])`, [cropIds]);
    }
  });

  it('BR-59r: omitted cropIds leaves the tags, a new array replaces them, [] clears them', async (ctx) => {
    if (!ready) return ctx.skip();
    const sfx = runSuffix();
    const ids = emptyLearningFixtureIds();
    const cropIds: string[] = [];
    try {
      const carrot = await insertCrop(cropIds, { name: `Carrot ${sfx}`, nameTa: 'கேரட்', slug: `carrot-${sfx}` });
      const cabbage = await insertCrop(cropIds, { name: `Cabbage ${sfx}`, nameTa: null, slug: `cabbage-${sfx}` });

      const created = await service.createArticle(admin, { ...article(sfx), cropIds: [carrot] });
      ids.articles.push(created.id);

      const renamed = await service.updateArticle(admin, created.id, { title: `Renamed ${sfx}` });
      expect(renamed.crops.map((c) => c.id)).toEqual([carrot]);

      // Replace, not merge: carrot is gone.
      const retagged = await service.updateArticle(admin, created.id, { cropIds: [cabbage] });
      expect(retagged.crops.map((c) => c.id)).toEqual([cabbage]);

      const cleared = await service.updateArticle(admin, created.id, { cropIds: [] });
      expect(cleared.crops).toEqual([]);

      const { rows } = await pool.query<{ n: string }>(
        `SELECT count(*)::text AS n FROM learning_article_crops WHERE article_id = $1`,
        [created.id],
      );
      expect(rows[0]!.n).toBe('0');
    } finally {
      await cleanupLearningFixtures(pool, ids);
      await pool.query(`DELETE FROM crop_master WHERE id = ANY($1::uuid[])`, [cropIds]);
    }
  });

  it('BR-59r: an unknown or soft-deleted crop id is 422 and writes nothing', async (ctx) => {
    if (!ready) return ctx.skip();
    const sfx = runSuffix();
    const ids = emptyLearningFixtureIds();
    const cropIds: string[] = [];
    try {
      const carrot = await insertCrop(cropIds, { name: `Carrot ${sfx}`, nameTa: null, slug: `carrot-${sfx}` });
      const retired = await insertCrop(cropIds, {
        name: `Retired ${sfx}`,
        nameTa: null,
        slug: `retired-${sfx}`,
        deleted: true,
      });
      const ghost = newId();

      await expect(
        service.createArticle(admin, { ...article(sfx), cropIds: [carrot, ghost] }),
      ).rejects.toMatchObject({ status: 422, code: 'VALIDATION_FAILED' });

      await expect(
        service.createArticle(admin, { ...article(sfx), cropIds: [retired] }),
      ).rejects.toMatchObject({ status: 422, code: 'VALIDATION_FAILED' });

      // The rejected creates rolled back: no article carries this run's tag.
      const leftovers = await service.listAdminArticles({ page: 1, limit: 10, tag: `tag-crops-${sfx}` });
      expect(leftovers.total).toBe(0);

      const created = await service.createArticle(admin, { ...article(sfx), cropIds: [carrot] });
      ids.articles.push(created.id);
      await expect(
        service.updateArticle(admin, created.id, { title: `Nope ${sfx}`, cropIds: [ghost] }),
      ).rejects.toMatchObject({ status: 422, code: 'VALIDATION_FAILED' });

      // Neither the title nor the tags moved.
      const after = await service.getAdminArticle(created.id);
      expect(after.title).toBe(`Crop tagging article ${sfx}`);
      expect(after.crops.map((c) => c.id)).toEqual([carrot]);
    } finally {
      await cleanupLearningFixtures(pool, ids);
      await pool.query(`DELETE FROM crop_master WHERE id = ANY($1::uuid[])`, [cropIds]);
    }
  });

  it('BR-59r: a crop retired AFTER tagging drops out of the chips instead of rendering nameless', async (ctx) => {
    if (!ready) return ctx.skip();
    const sfx = runSuffix();
    const ids = emptyLearningFixtureIds();
    const cropIds: string[] = [];
    try {
      const carrot = await insertCrop(cropIds, { name: `Carrot ${sfx}`, nameTa: null, slug: `carrot-${sfx}` });
      const leek = await insertCrop(cropIds, { name: `Leek ${sfx}`, nameTa: null, slug: `leek-${sfx}` });

      const created = await service.createArticle(admin, { ...article(sfx), cropIds: [carrot, leek] });
      ids.articles.push(created.id);
      expect(created.crops).toHaveLength(2);

      await pool.query(`UPDATE crop_master SET deleted_at = now() WHERE id = $1`, [leek]);

      const after = await service.getAdminArticle(created.id);
      expect(after.crops.map((c) => c.id)).toEqual([carrot]);

      // The join row survives — only the read hides it, so un-deleting the crop
      // restores the chip rather than losing the admin's choice.
      const { rows } = await pool.query<{ n: string }>(
        `SELECT count(*)::text AS n FROM learning_article_crops WHERE article_id = $1`,
        [created.id],
      );
      expect(rows[0]!.n).toBe('2');
    } finally {
      await cleanupLearningFixtures(pool, ids);
      await pool.query(`DELETE FROM crop_master WHERE id = ANY($1::uuid[])`, [cropIds]);
    }
  });

  it('BR-59r: videos tag the same way, and deleting the content cascades its tags away', async (ctx) => {
    if (!ready) return ctx.skip();
    const sfx = runSuffix();
    const ids = emptyLearningFixtureIds();
    const cropIds: string[] = [];
    try {
      const carrot = await insertCrop(cropIds, { name: `Carrot ${sfx}`, nameTa: 'கேரட்', slug: `carrot-${sfx}` });

      const created = await service.createVideo(admin, { ...video(sfx), cropIds: [carrot] });
      ids.videos.push(created.id);
      expect(created.crops).toEqual([{ id: carrot, name: `Carrot ${sfx}`, nameTa: 'கேரட்' }]);
      expect((await service.getAdminVideo(created.id)).crops).toHaveLength(1);

      await service.deleteVideo(admin, created.id);

      const { rows } = await pool.query<{ n: string }>(
        `SELECT count(*)::text AS n FROM learning_video_crops WHERE video_id = $1`,
        [created.id],
      );
      expect(rows[0]!.n).toBe('0');

      // The crop itself is untouched by the content delete.
      const crop = await pool.query(`SELECT 1 FROM crop_master WHERE id = $1`, [carrot]);
      expect(crop.rowCount).toBe(1);
    } finally {
      await cleanupLearningFixtures(pool, ids);
      await pool.query(`DELETE FROM crop_master WHERE id = ANY($1::uuid[])`, [cropIds]);
    }
  });

  it('BR-59r: a crop that content still points at cannot be hard-deleted', async (ctx) => {
    if (!ready) return ctx.skip();
    const sfx = runSuffix();
    const ids = emptyLearningFixtureIds();
    const cropIds: string[] = [];
    try {
      const carrot = await insertCrop(cropIds, { name: `Carrot ${sfx}`, nameTa: null, slug: `carrot-${sfx}` });
      const created = await service.createArticle(admin, { ...article(sfx), cropIds: [carrot] });
      ids.articles.push(created.id);

      await expect(
        pool.query(`DELETE FROM crop_master WHERE id = $1`, [carrot]),
      ).rejects.toThrow(/learning_article_crops/);
    } finally {
      await cleanupLearningFixtures(pool, ids);
      await pool.query(`DELETE FROM crop_master WHERE id = ANY($1::uuid[])`, [cropIds]);
    }
  });
});

describe('BR-59r migration shape', () => {
  it('BR-59r: the join tables are a new numbered migration with a Down section', async () => {
    const { readFile } = await import('node:fs/promises');
    const { MIGRATIONS_DIR } = await import('../../paths.js');
    const sql = await readFile(`${MIGRATIONS_DIR}/0190_learning_content_crops.sql`, 'utf8');
    expect(sql).toContain('-- +migrate Up');
    expect(sql).toContain('-- +migrate Down');
    expect(sql).toContain('DROP TABLE learning_video_crops');
    expect(sql).toContain('DROP TABLE learning_article_crops');
  });
});
