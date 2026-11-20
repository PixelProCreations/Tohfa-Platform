import { describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import type { LegalContentRepo, LegalRow } from './legal-content.repo.js';
import { legalContentSchema, legalSlugParams, putLegalBody } from './legal-content.schema.js';
import { createLegalContentService } from './legal-content.service.js';

const ADMIN = '90000000-0000-4000-8000-000000000001';
const scope: ResolvedScope = {
  level: ScopeLevel.ALL, permission: 'legal.content.manage', roleCode: RoleCode.TOHFA_ADMIN,
  warehouseIds: [], zoneIds: [], userId: ADMIN,
};

class FakeRepo implements LegalContentRepo {
  rows: LegalRow[] = [
    { id: 'r1', slug: 'privacy-policy', language: 'en', version: 1, title: 'Privacy Policy', body: 'Original privacy text body.', created_at: new Date('2026-09-09T00:00:00Z') },
  ];
  txWrites: Executor[] = [];
  async getCurrent(_d: Executor, slug: string, language: string) {
    return this.rows.filter((r) => r.slug === slug && r.language === language).sort((a, b) => b.version - a.version)[0] ?? null;
  }
  async lock() {}
  async insertVersion(tx: Executor, slug: string, language: string, title: string, body: string) {
    this.txWrites.push(tx);
    const v = (await this.getCurrent(tx, slug, language))?.version ?? 0;
    const row: LegalRow = { id: `r${this.rows.length + 1}`, slug, language, version: v + 1, title, body, created_at: new Date('2026-11-17T00:00:00Z') };
    this.rows.push(row);
    return row;
  }
}

function setup() {
  const repo = new FakeRepo();
  const sql: string[] = [];
  const tx = { async query(text: string) { sql.push(text); return { rows: [{ id: 'audit-1' }], rowCount: 1 }; } } as unknown as Executor;
  const svc = createLegalContentService({ repo, db: tx, runTx: (fn) => fn(tx) });
  return { repo, sql, tx, svc };
}

describe('BR-172: legal content', () => {
  it('serves the current version in the documented shape', async () => {
    const out = await setup().svc.get('privacy-policy', 'en');
    expect(() => legalContentSchema.parse(out)).not.toThrow();
    expect(out).toMatchObject({ title: 'Privacy Policy', version: 1, language: 'en', lastUpdated: '2026-09-09T00:00:00.000Z' });
  });

  it('404s for a slug or language with no content', async () => {
    const { svc } = setup();
    await expect(svc.get('terms', 'en')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(svc.get('privacy-policy', 'ta')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('publish appends version n+1, keeps the old row and writes one audit row on the same executor', async () => {
    const { repo, svc, sql } = setup();
    const out = await svc.publish(scope, 'privacy-policy', { title: 'Privacy Policy', body: 'Brand new privacy text here.', language: 'en' });
    expect(out.version).toBe(2);
    expect(repo.rows).toHaveLength(2);
    expect(repo.rows[0]?.body).toBe('Original privacy text body.');
    expect(sql.filter((s) => /INSERT INTO audit_log/i.test(s))).toHaveLength(1);
  });

  it('publishing identical text is a no-op: no new version, no audit row', async () => {
    const { repo, svc, sql } = setup();
    const out = await svc.publish(scope, 'privacy-policy', { title: 'Privacy Policy', body: 'Original privacy text body.', language: 'en' });
    expect(out.version).toBe(1);
    expect(repo.rows).toHaveLength(1);
    expect(sql).toHaveLength(0);
  });

  it('a first publish for a new slug starts at version 1', async () => {
    const { svc } = setup();
    const out = await svc.publish(scope, 'terms', { title: 'Terms', body: 'The real terms of service text.', language: 'en' });
    expect(out.version).toBe(1);
  });

  it('only known slugs and strict bodies are accepted', () => {
    expect(legalSlugParams.safeParse({ slug: 'cookies' }).success).toBe(false);
    expect(putLegalBody.safeParse({ title: 't', body: 'short' }).success).toBe(false);
    expect(putLegalBody.safeParse({ title: 't', body: 'long enough body text here', x: 1 }).success).toBe(false);
    expect(putLegalBody.parse({ title: 't', body: 'long enough body text here' }).language).toBe('en');
  });
});
