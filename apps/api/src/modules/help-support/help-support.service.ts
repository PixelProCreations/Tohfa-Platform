/**
 * BR-82: admin Help & Support.
 *
 * Readers (every admin role) only ever see PUBLISHED articles, filtered by
 * locale and category. Writers (SA/TA, enforced by the route's permission, not
 * by a role check here) create/edit/publish/unpublish articles and set the
 * contact channels. Every write and its audit row share one transaction, and
 * the audit image is masked: field NAMES and ids only, never title, body,
 * phone or e-mail text.
 *
 * A write that changes nothing (same values, already published, already a
 * draft) is a successful no-op: no UPDATE, no audit row.
 */
import { writeAuditLog } from '../../audit/auditLog.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import {
  CONTACT_EMAIL_KEY,
  CONTACT_PHONE_KEY,
  helpSupportRepo,
  type ArticleFields,
} from './help-support.repo.js';
import type {
  ContactResponse,
  CreateArticleBody,
  ListArticlesQuery,
  ManagerArticleResponse,
  ReadHelpQuery,
  ReadHelpResponse,
  UpdateArticleBody,
  UpdateContactBody,
} from './help-support.schema.js';

export type HelpSupportRepo = typeof helpSupportRepo;

export interface HelpSupportService {
  read(query: ReadHelpQuery): Promise<ReadHelpResponse>;
  listArticles(query: ListArticlesQuery): Promise<{ items: ManagerArticleResponse[] }>;
  createArticle(scope: ResolvedScope, body: CreateArticleBody): Promise<ManagerArticleResponse>;
  updateArticle(scope: ResolvedScope, id: string, body: UpdateArticleBody): Promise<ManagerArticleResponse>;
  setPublished(scope: ResolvedScope, id: string, isPublished: boolean): Promise<ManagerArticleResponse>;
  updateContact(scope: ResolvedScope, body: UpdateContactBody): Promise<ContactResponse>;
}

function notFound(): AppError {
  return new AppError('NOT_FOUND', { detail: 'Help article not found.' });
}

export function createHelpSupportService(repo: HelpSupportRepo = helpSupportRepo, db: Executor = pool): HelpSupportService {
  return {
    async read(query) {
      const [items, categories, contact] = await Promise.all([
        repo.listPublished(db, { locale: query.locale, category: query.category }),
        repo.listPublishedCategories(db, query.locale),
        repo.getContact(db),
      ]);
      return { items, categories, contact };
    },

    async listArticles(query) {
      return { items: await repo.listAll(db, query) };
    },

    async createArticle(scope, body) {
      return withTransaction(async (tx) => {
        const fields: ArticleFields = {
          category: body.category,
          locale: body.locale,
          title: body.title,
          body: body.body,
          sortOrder: body.sortOrder,
        };
        const created = await repo.insert(tx, fields, scope.userId);
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'help.article.create',
          entityType: 'help_article',
          entityId: created.id,
          // Masked image: no title or body text.
          after: { id: created.id, category: created.category, locale: created.locale, isPublished: false },
        });
        return created;
      });
    },

    async updateArticle(scope, id, body) {
      return withTransaction(async (tx) => {
        const current = await repo.findForUpdate(tx, id);
        if (current === null) throw notFound();

        const changes: Partial<ArticleFields> = {};
        const changed: string[] = [];
        for (const key of ['category', 'locale', 'title', 'body', 'sortOrder'] as const) {
          const wanted = body[key];
          if (wanted !== undefined && wanted !== current[key]) {
            Object.assign(changes, { [key]: wanted });
            changed.push(key);
          }
        }
        if (changed.length === 0) return current;

        const updated = await repo.update(tx, id, changes, scope.userId);
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'help.article.update',
          entityType: 'help_article',
          entityId: id,
          changedFields: changed,
        });
        return updated;
      });
    },

    async setPublished(scope, id, isPublished) {
      return withTransaction(async (tx) => {
        const current = await repo.findForUpdate(tx, id);
        if (current === null) throw notFound();
        if (current.isPublished === isPublished) return current;

        const updated = await repo.setPublished(tx, id, isPublished, scope.userId);
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: isPublished ? 'help.article.publish' : 'help.article.unpublish',
          entityType: 'help_article',
          entityId: id,
          after: { id, isPublished },
        });
        return updated;
      });
    },

    async updateContact(scope, body) {
      return withTransaction(async (tx) => {
        const current = await repo.getContact(tx);
        const changed: string[] = [];
        if (body.phone !== undefined && body.phone !== current.phone) {
          await repo.setContactChannel(tx, CONTACT_PHONE_KEY, body.phone, scope.userId);
          changed.push('phone');
        }
        if (body.email !== undefined && body.email !== current.email) {
          await repo.setContactChannel(tx, CONTACT_EMAIL_KEY, body.email, scope.userId);
          changed.push('email');
        }
        if (changed.length > 0) {
          await writeAuditLog(tx, {
            actorId: scope.userId,
            actorRole: scope.roleCode,
            actionCode: 'help.contact.update',
            entityType: 'help_contact',
            entityId: null,
            // Names only: a phone number or an address is never copied into the audit log.
            changedFields: changed,
          });
        }
        return repo.getContact(tx);
      });
    },
  };
}

export const helpSupportService: HelpSupportService = createHelpSupportService();
