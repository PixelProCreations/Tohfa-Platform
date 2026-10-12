import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { RoleCode } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { closePool, pool } from '../../db/pool.js';
import { describeIfDatabase } from '../../test/factories.js';
import { insertUser, requireDatabaseTables } from '../../test/dbFixtures.js';

/**
 * BR-82i-m: admin Help & Support. FAQ articles are admin-managed plain text
 * (nothing seeded, drafts invisible to readers), the contact channels come
 * from system_config (null until an administrator sets them) and every write
 * is SA/TA only, audited and masked.
 *
 * Real router, real database: the visibility rule (published only, by locale
 * and category), the role matrix and the audit rows are SQL and middleware
 * behaviour. Users stay behind (audit rows reference them and audit_log is
 * append-only); the articles and the contact config are cleaned up.
 */

const READERS = [
  RoleCode.SUPER_ADMIN,
  RoleCode.TOHFA_ADMIN,
  RoleCode.FARMER_ADMIN,
  RoleCode.MAIN_WH_ADMIN,
  RoleCode.SUB_WH_ADMIN,
] as const;
const WRITERS = [RoleCode.SUPER_ADMIN, RoleCode.TOHFA_ADMIN] as const;

const app = createApp();

function tokenFor(userId: string, role: RoleCode): string {
  return signAccessToken({ sub: userId, roles: [{ code: role }], farmerId: null, customerId: null });
}

interface Article {
  id: string;
  category: string;
  locale: string;
  title: string;
  body: string;
  sortOrder: number;
  isPublished?: boolean;
}
interface ReaderResponse {
  items: Article[];
  categories: string[];
  contact: { phone: string | null; email: string | null };
}

describe('BR-82i: Help & Support requires authentication', () => {
  it('BR-82i: no token is 401 on every route', async () => {
    expect((await request(app).get('/v1/admin/help')).status).toBe(401);
    expect((await request(app).get('/v1/admin/help/articles')).status).toBe(401);
    expect((await request(app).post('/v1/admin/help/articles').send({})).status).toBe(401);
    expect((await request(app).patch(`/v1/admin/help/articles/${randomUUID()}`).send({})).status).toBe(401);
    expect((await request(app).post(`/v1/admin/help/articles/${randomUUID()}/publish`)).status).toBe(401);
    expect((await request(app).post(`/v1/admin/help/articles/${randomUUID()}/unpublish`)).status).toBe(401);
    expect((await request(app).patch('/v1/admin/help/contact').send({})).status).toBe(401);
  });
});

describeIfDatabase('BR-82i-m: admin Help & Support (real database, real router)', () => {
  const userIds: string[] = [];
  let sa: { id: string; token: string };
  let ta: { id: string; token: string };

  async function actor(role: RoleCode, userType: 'ADMIN' | 'FARMER' | 'CUSTOMER' = 'ADMIN') {
    const id = await insertUser(pool, userType, `BR-82 ${role}`);
    userIds.push(id);
    return { id, token: tokenFor(id, role) };
  }

  const valid = (over: Record<string, unknown> = {}) => ({
    category: 'Orders',
    locale: 'en',
    title: 'BR-82 How do I view orders?',
    body: 'Open More > Customer Orders and use the filter chips.',
    ...over,
  });

  async function createArticle(token: string, over: Record<string, unknown> = {}): Promise<Article> {
    const res = await request(app).post('/v1/admin/help/articles').set('Authorization', `Bearer ${token}`).send(valid(over));
    expect(res.status).toBe(201);
    return res.body as Article;
  }

  async function publish(token: string, id: string): Promise<void> {
    const res = await request(app).post(`/v1/admin/help/articles/${id}/publish`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  }

  async function read(token: string, query = ''): Promise<ReaderResponse> {
    const res = await request(app).get(`/v1/admin/help${query}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    return res.body as ReaderResponse;
  }

  async function audit(entityId: string | null, action: string) {
    const result = await pool.query<{
      actor_role: string | null;
      entity_type: string;
      before: unknown;
      after: unknown;
      changed_fields: string[] | null;
    }>(
      `SELECT actor_role, entity_type, before, after, changed_fields FROM audit_log
        WHERE action_code = $1 AND entity_id IS NOT DISTINCT FROM $2 AND actor_id = ANY($3::uuid[])
        ORDER BY created_at`,
      [action, entityId, userIds],
    );
    return result.rows;
  }

  let seededArticles = -1;
  let seededContact: Array<{ key: string; value: unknown }> = [];

  beforeAll(async () => {
    expect(await requireDatabaseTables('users', 'audit_log', 'help_articles', 'system_config')).toBe(true);
    await pool.query("DELETE FROM help_articles WHERE title LIKE 'BR-82 %'");
    seededArticles = Number((await pool.query<{ n: string }>('SELECT count(*) AS n FROM help_articles')).rows[0]!.n);
    seededContact = (
      await pool.query<{ key: string; value: unknown }>(
        "SELECT key, value FROM system_config WHERE key LIKE 'help.contact.%' ORDER BY key",
      )
    ).rows;
    sa = await actor(RoleCode.SUPER_ADMIN);
    ta = await actor(RoleCode.TOHFA_ADMIN);
  });

  afterAll(async () => {
    await pool.query("DELETE FROM help_articles WHERE title LIKE 'BR-82 %'");
    await pool.query("UPDATE system_config SET value = 'null'::jsonb WHERE key LIKE 'help.contact.%'");
    await closePool();
  });

  describe('BR-82i: nothing is seeded and nothing is invented', () => {
    it('BR-82i: the migration seeds no article', () => {
      expect(seededArticles).toBe(0);
    });

    it('BR-82i: the contact channels are JSON null in system_config until an administrator sets them', () => {
      expect(seededContact).toEqual([
        { key: 'help.contact.email', value: null },
        { key: 'help.contact.phone', value: null },
      ]);
    });

    it('BR-82i: with nothing configured the reader response is empty articles and null contact', async () => {
      expect(await read(sa.token)).toEqual({ items: [], categories: [], contact: { phone: null, email: null } });
    });
  });

  describe('BR-82j: who may read and who may write (role matrix through the real router)', () => {
    it.each(READERS)('BR-82j: %s may read the published help', async (role) => {
      const { token } = await actor(role);
      const res = await request(app).get('/v1/admin/help').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    it.each([
      [RoleCode.FARMER, 'FARMER'],
      [RoleCode.CUSTOMER, 'CUSTOMER'],
    ] as const)('BR-82j: %s cannot read the admin help (403)', async (role, userType) => {
      const { token } = await actor(role, userType);
      expect((await request(app).get('/v1/admin/help').set('Authorization', `Bearer ${token}`)).status).toBe(403);
    });

    it.each(WRITERS)('BR-82j: %s may create, edit, publish and unpublish', async (role) => {
      const { token } = await actor(role);
      const created = await createArticle(token, { title: `BR-82 ${role} article` });
      const patched = await request(app)
        .patch(`/v1/admin/help/articles/${created.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: `BR-82 ${role} edited` });
      expect(patched.status).toBe(200);
      await publish(token, created.id);
      const unpublished = await request(app)
        .post(`/v1/admin/help/articles/${created.id}/unpublish`)
        .set('Authorization', `Bearer ${token}`);
      expect(unpublished.status).toBe(200);
      expect((unpublished.body as Article).isPublished).toBe(false);
    });

    it.each([
      [RoleCode.FARMER_ADMIN, 'ADMIN'],
      [RoleCode.MAIN_WH_ADMIN, 'ADMIN'],
      [RoleCode.SUB_WH_ADMIN, 'ADMIN'],
      [RoleCode.FARMER, 'FARMER'],
      [RoleCode.CUSTOMER, 'CUSTOMER'],
    ] as const)('BR-82j: %s cannot write or list drafts (403) and nothing is stored', async (role, userType) => {
      const { token } = await actor(role, userType);
      const untouchable = `BR-82 untouchable ${randomUUID()}`;
      const target = await createArticle(sa.token, { title: untouchable });
      const auth = { Authorization: `Bearer ${token}` };

      const sneaky = `BR-82 sneaky ${randomUUID()}`;
      const created = await request(app).post('/v1/admin/help/articles').set(auth).send(valid({ title: sneaky }));
      expect(created.status).toBe(403);
      expect((await request(app).get('/v1/admin/help/articles').set(auth)).status).toBe(403);
      expect((await request(app).patch(`/v1/admin/help/articles/${target.id}`).set(auth).send({ title: `${sneaky} hacked` })).status).toBe(403);
      expect((await request(app).post(`/v1/admin/help/articles/${target.id}/publish`).set(auth)).status).toBe(403);
      expect((await request(app).post(`/v1/admin/help/articles/${target.id}/unpublish`).set(auth)).status).toBe(403);
      expect((await request(app).patch('/v1/admin/help/contact').set(auth).send({ email: 'x@example.test' })).status).toBe(403);

      const rows = await pool.query<{ title: string; is_published: boolean }>(
        'SELECT title, is_published FROM help_articles WHERE title LIKE $1 OR title = $2',
        [`${sneaky}%`, untouchable],
      );
      expect(rows.rows).toEqual([{ title: untouchable, is_published: false }]);
    });
  });

  describe('BR-82k: visibility (published only, by locale and category)', () => {
    it('BR-82k: a new article is a draft, invisible to readers, until published; unpublishing hides it again', async () => {
      const created = await createArticle(sa.token, { category: 'BR-82 Draft Cat', title: 'BR-82 draft check' });
      expect(created.isPublished).toBe(false);
      const { token } = await actor(RoleCode.SUB_WH_ADMIN);

      expect((await read(token, '?category=BR-82%20Draft%20Cat')).items).toEqual([]);

      await publish(ta.token, created.id);
      const visible = await read(token, '?category=BR-82%20Draft%20Cat');
      expect(visible.items.map((i) => i.id)).toEqual([created.id]);
      expect(visible.items[0]).toEqual({
        id: created.id,
        category: 'BR-82 Draft Cat',
        locale: 'en',
        title: 'BR-82 draft check',
        body: created.body,
        sortOrder: 0,
      });

      await request(app).post(`/v1/admin/help/articles/${created.id}/unpublish`).set('Authorization', `Bearer ${sa.token}`);
      expect((await read(token, '?category=BR-82%20Draft%20Cat')).items).toEqual([]);
    });

    it('BR-82k: filters by locale (default en) and by category, and orders by sortOrder then id', async () => {
      const category = `BR-82 Filter ${randomUUID().slice(0, 8)}`;
      const second = await createArticle(sa.token, { category, title: 'BR-82 second', sortOrder: 20 });
      const first = await createArticle(sa.token, { category, title: 'BR-82 first', sortOrder: 10 });
      const tamil = await createArticle(sa.token, { category, title: 'BR-82 tamil', locale: 'ta', sortOrder: 5 });
      const other = await createArticle(sa.token, { category: `${category} other`, title: 'BR-82 other cat' });
      for (const a of [second, first, tamil, other]) await publish(sa.token, a.id);
      const { token } = await actor(RoleCode.MAIN_WH_ADMIN);
      const enc = encodeURIComponent(category);

      expect((await read(token, `?category=${enc}`)).items.map((i) => i.title)).toEqual(['BR-82 first', 'BR-82 second']);
      expect((await read(token, `?category=${enc}&locale=en`)).items.map((i) => i.title)).toEqual(['BR-82 first', 'BR-82 second']);
      expect((await read(token, `?category=${enc}&locale=ta`)).items.map((i) => i.title)).toEqual(['BR-82 tamil']);
      const all = await read(token, '?locale=en');
      expect(all.categories).toEqual(expect.arrayContaining([category, `${category} other`]));
      expect([...all.categories]).toEqual([...all.categories].sort());
    });

    it('BR-82k: rejects an unsupported locale (422)', async () => {
      const res = await request(app).get('/v1/admin/help?locale=fr').set('Authorization', `Bearer ${sa.token}`);
      expect(res.status).toBe(422);
    });

    it('BR-82k: managers list drafts too, filtered by isPublished', async () => {
      const category = `BR-82 Mgr ${randomUUID().slice(0, 8)}`;
      const draft = await createArticle(sa.token, { category, title: 'BR-82 mgr draft' });
      const live = await createArticle(sa.token, { category, title: 'BR-82 mgr live' });
      await publish(sa.token, live.id);
      const enc = encodeURIComponent(category);
      const auth = { Authorization: `Bearer ${ta.token}` };

      const all = await request(app).get(`/v1/admin/help/articles?category=${enc}`).set(auth);
      expect(all.status).toBe(200);
      const items = (all.body as { items: Article[] }).items;
      expect(items.map((i) => [i.id, i.isPublished])).toEqual(
        expect.arrayContaining([
          [draft.id, false],
          [live.id, true],
        ]),
      );
      const drafts = await request(app).get(`/v1/admin/help/articles?category=${enc}&isPublished=false`).set(auth);
      expect((drafts.body as { items: Article[] }).items.map((i) => i.id)).toEqual([draft.id]);
    });
  });

  describe('BR-82l: content writes', () => {
    it('BR-82l: accepts ">" in text (navigation paths) but rejects HTML-looking markup (plain text only)', async () => {
      const ok = await request(app)
        .post('/v1/admin/help/articles')
        .set('Authorization', `Bearer ${sa.token}`)
        .send(valid({ title: 'BR-82 arrows', body: 'Go to More > Finance > Add Expense, qty < 5 is fine.' }));
      expect(ok.status).toBe(201);

      for (const bad of ['<script>alert(1)</script>', 'hi <b>bold</b>', '<img src=x onerror=alert(1)>', '</p>', '<!-- x -->']) {
        const res = await request(app)
          .post('/v1/admin/help/articles')
          .set('Authorization', `Bearer ${sa.token}`)
          .send(valid({ title: 'BR-82 markup', body: bad }));
        expect(res.status).toBe(422);
        const inTitle = await request(app)
          .post('/v1/admin/help/articles')
          .set('Authorization', `Bearer ${sa.token}`)
          .send(valid({ title: `BR-82 ${bad}` }));
        expect(inTitle.status).toBe(422);
      }
      const stored = await pool.query("SELECT 1 FROM help_articles WHERE title = 'BR-82 markup'");
      expect(stored.rowCount).toBe(0);
    });

    it.each([
      ['a missing title', { title: undefined }],
      ['a blank title', { title: '   ' }],
      ['a 201 character title', { title: 'x'.repeat(201) }],
      ['a blank body', { body: '  ' }],
      ['a 4001 character body', { body: 'x'.repeat(4001) }],
      ['a 61 character category', { category: 'c'.repeat(61) }],
      ['an unsupported locale', { locale: 'fr' }],
      ['a negative sortOrder', { sortOrder: -1 }],
      ['a fractional sortOrder', { sortOrder: 1.5 }],
      ['an unknown key', { isPublished: true }],
    ])('BR-82l: create rejects %s (422)', async (_label, over) => {
      const res = await request(app)
        .post('/v1/admin/help/articles')
        .set('Authorization', `Bearer ${sa.token}`)
        .send(valid(over));
      expect(res.status).toBe(422);
    });

    it('BR-82l: PATCH changes only the fields sent and rejects empty bodies, unknown keys and bad ids', async () => {
      const created = await createArticle(sa.token, { title: 'BR-82 patch me', sortOrder: 3 });
      const auth = { Authorization: `Bearer ${sa.token}` };

      const res = await request(app).patch(`/v1/admin/help/articles/${created.id}`).set(auth).send({ sortOrder: 9, locale: 'ta' });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: created.id, title: 'BR-82 patch me', body: created.body, sortOrder: 9, locale: 'ta' });

      expect((await request(app).patch(`/v1/admin/help/articles/${created.id}`).set(auth).send({})).status).toBe(422);
      expect((await request(app).patch(`/v1/admin/help/articles/${created.id}`).set(auth).send({ isPublished: true })).status).toBe(422);
      expect((await request(app).patch('/v1/admin/help/articles/not-a-uuid').set(auth).send({ title: 'BR-82 x' })).status).toBe(422);
      expect((await request(app).patch(`/v1/admin/help/articles/${randomUUID()}`).set(auth).send({ title: 'BR-82 x' })).status).toBe(404);
      expect((await request(app).post(`/v1/admin/help/articles/${randomUUID()}/publish`).set(auth)).status).toBe(404);
      expect((await request(app).post(`/v1/admin/help/articles/${randomUUID()}/unpublish`).set(auth)).status).toBe(404);
    });

    it('BR-82l: publishing an already published article is a 200 no-op without a second audit row', async () => {
      const created = await createArticle(sa.token, { title: 'BR-82 twice' });
      await publish(sa.token, created.id);
      await publish(sa.token, created.id);
      expect(await audit(created.id, 'help.article.publish')).toHaveLength(1);
    });
  });

  describe('BR-82m: audit (masked, same transaction) and contact channels', () => {
    it('BR-82m: create, update, publish and unpublish each write one masked audit row (no title or body text)', async () => {
      const created = await createArticle(ta.token, {
        title: 'BR-82 SECRETTITLE one',
        body: 'SECRETBODY text',
        category: 'BR-82 Audit',
      });
      await request(app)
        .patch(`/v1/admin/help/articles/${created.id}`)
        .set('Authorization', `Bearer ${ta.token}`)
        .send({ title: 'BR-82 SECRETTITLE two', body: 'SECRETBODY changed' });
      await publish(ta.token, created.id);
      await request(app).post(`/v1/admin/help/articles/${created.id}/unpublish`).set('Authorization', `Bearer ${ta.token}`);

      const create = await audit(created.id, 'help.article.create');
      const update = await audit(created.id, 'help.article.update');
      const pub = await audit(created.id, 'help.article.publish');
      const unpub = await audit(created.id, 'help.article.unpublish');
      for (const rows of [create, update, pub, unpub]) {
        expect(rows).toHaveLength(1);
        expect(rows[0]!.entity_type).toBe('help_article');
        expect(rows[0]!.actor_role).toBe(RoleCode.TOHFA_ADMIN);
        expect(JSON.stringify(rows[0])).not.toContain('SECRET');
      }
      expect([...(update[0]!.changed_fields ?? [])].sort()).toEqual(['body', 'title']);
    });

    it('BR-82m: an update that changes nothing is a 200 no-op without an audit row', async () => {
      const created = await createArticle(sa.token, { title: 'BR-82 nothing changes' });
      const res = await request(app)
        .patch(`/v1/admin/help/articles/${created.id}`)
        .set('Authorization', `Bearer ${sa.token}`)
        .send({ title: 'BR-82 nothing changes' });
      expect(res.status).toBe(200);
      expect(await audit(created.id, 'help.article.update')).toHaveLength(0);
    });

    it('BR-82m: the audit row is in the same transaction (a failing audit insert leaves no article behind)', async () => {
      const writer = await actor(RoleCode.SUPER_ADMIN);
      await pool.query(`
        CREATE OR REPLACE FUNCTION br82_help_fail_audit() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          RAISE EXCEPTION 'br82 forced audit failure';
        END $$`);
      const trigger = `br82_help_fail_${writer.id.replace(/-/g, '')}`;
      await pool.query(
        `CREATE TRIGGER ${trigger} BEFORE INSERT ON audit_log
           FOR EACH ROW WHEN (NEW.actor_id = '${writer.id}') EXECUTE FUNCTION br82_help_fail_audit()`,
      );
      try {
        const res = await request(app)
          .post('/v1/admin/help/articles')
          .set('Authorization', `Bearer ${writer.token}`)
          .send(valid({ title: 'BR-82 must roll back' }));
        expect(res.status).toBe(500);
        const stored = await pool.query("SELECT 1 FROM help_articles WHERE title = 'BR-82 must roll back'");
        expect(stored.rowCount).toBe(0);
      } finally {
        await pool.query(`DROP TRIGGER IF EXISTS ${trigger} ON audit_log`);
        await pool.query('DROP FUNCTION IF EXISTS br82_help_fail_audit()');
      }
    });

    it('BR-82m: SA/TA set the contact channels, every admin reader then sees them, the audit row holds names only', async () => {
      const res = await request(app)
        .patch('/v1/admin/help/contact')
        .set('Authorization', `Bearer ${sa.token}`)
        .send({ phone: '+91 1800 000 0000', email: 'br82-help@example.test' });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ phone: '+91 1800 000 0000', email: 'br82-help@example.test' });

      const reader = await actor(RoleCode.SUB_WH_ADMIN);
      expect((await read(reader.token)).contact).toEqual({ phone: '+91 1800 000 0000', email: 'br82-help@example.test' });

      const rows = await audit(null, 'help.contact.update');
      expect(rows.length).toBeGreaterThanOrEqual(1);
      const last = rows[rows.length - 1]!;
      expect(last.entity_type).toBe('help_contact');
      expect([...(last.changed_fields ?? [])].sort()).toEqual(['email', 'phone']);
      expect(JSON.stringify(rows)).not.toContain('br82-help@example.test');
      expect(JSON.stringify(rows)).not.toContain('1800');
    });

    it('BR-82m: sending null clears a channel, and one channel can change alone', async () => {
      const auth = { Authorization: `Bearer ${ta.token}` };
      await request(app).patch('/v1/admin/help/contact').set(auth).send({ phone: '+91 1800 111 1111', email: 'br82-keep@example.test' });
      const cleared = await request(app).patch('/v1/admin/help/contact').set(auth).send({ phone: null });
      expect(cleared.status).toBe(200);
      expect(cleared.body).toEqual({ phone: null, email: 'br82-keep@example.test' });
    });

    it.each([
      ['an empty body', {}],
      ['an invalid email', { email: 'not-an-email' }],
      ['an invalid phone', { phone: 'call me' }],
      ['an unknown key', { fax: '1' }],
      ['markup in the phone', { phone: '<b>1</b>' }],
    ])('BR-82m: contact rejects %s (422)', async (_label, body) => {
      const res = await request(app).patch('/v1/admin/help/contact').set('Authorization', `Bearer ${sa.token}`).send(body);
      expect(res.status).toBe(422);
    });
  });
});
