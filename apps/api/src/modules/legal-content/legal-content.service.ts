/**
 * Versioned legal content (BR-172). Reads are public; a publish appends a new version in one
 * transaction with its audit row and never mutates an earlier version.
 */
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { writeAuditLog } from '../../audit/auditLog.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { legalContentRepo, type LegalContentRepo, type LegalRow } from './legal-content.repo.js';
import type { LegalContent, LegalSlug, PutLegalBody } from './legal-content.schema.js';

export function toLegalContent(r: LegalRow): LegalContent {
  return { title: r.title, version: r.version, lastUpdated: r.created_at.toISOString(), body: r.body, language: r.language };
}

export interface LegalContentService {
  get(slug: LegalSlug, language: string): Promise<LegalContent>;
  publish(scope: ResolvedScope, slug: LegalSlug, body: PutLegalBody): Promise<LegalContent>;
}

export function createLegalContentService(
  deps: { repo?: LegalContentRepo; db?: Executor; runTx?: <T>(fn: (tx: Executor) => Promise<T>) => Promise<T> } = {},
): LegalContentService {
  const repo = deps.repo ?? legalContentRepo;
  const db = deps.db ?? pool;
  const runTx = deps.runTx ?? withTransaction;

  return {
    async get(slug, language) {
      const row = await repo.getCurrent(db, slug, language);
      if (row === null) throw new AppError('NOT_FOUND', { detail: 'Content not found.' });
      return toLegalContent(row);
    },

    async publish(scope, slug, body) {
      return runTx(async (tx) => {
        await repo.lock(tx, slug, body.language);
        const current = await repo.getCurrent(tx, slug, body.language);
        // Re-publishing identical text writes nothing: no phantom version, no audit row.
        if (current !== null && current.title === body.title && current.body === body.body) {
          return toLegalContent(current);
        }
        const row = await repo.insertVersion(tx, slug, body.language, body.title, body.body, scope.userId);
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'legal.content.manage',
          entityType: 'legal_content',
          entityId: row.id,
          before: current === null ? undefined : { slug, language: body.language, version: current.version, title: current.title },
          after: { slug, language: body.language, version: row.version, title: row.title, bodyLength: row.body.length },
          changedFields: ['version', ...(current?.title !== row.title ? ['title'] : []), 'body'],
        });
        return toLegalContent(row);
      });
    },
  };
}

export const legalContentService: LegalContentService = createLegalContentService();
