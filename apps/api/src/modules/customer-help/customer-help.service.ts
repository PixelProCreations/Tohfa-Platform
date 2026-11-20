/**
 * Customer Help & FAQ: a read-only view over the admin-managed `help_articles` (BR-82). Reuses the
 * help-support repo's reader queries, so a customer can only ever see what an admin has published.
 */
import { pool, type Executor } from '../../db/pool.js';
import { helpSupportRepo } from '../help-support/help-support.repo.js';
import type { ContactResponse, ReaderArticleResponse, ReadHelpQuery } from '../help-support/help-support.schema.js';

type HelpSupportRepo = typeof helpSupportRepo;

export interface CustomerHelpService {
  listArticles(query: ReadHelpQuery): Promise<{ items: ReaderArticleResponse[]; categories: string[]; contact: ContactResponse }>;
  listCategories(locale: ReadHelpQuery['locale']): Promise<{ items: string[] }>;
}

export function createCustomerHelpService(
  repo: Pick<HelpSupportRepo, 'listPublished' | 'listPublishedCategories' | 'getContact'> = helpSupportRepo,
  db: Executor = pool,
): CustomerHelpService {
  return {
    async listArticles(query) {
      const [items, categories, contact] = await Promise.all([
        repo.listPublished(db, { locale: query.locale, category: query.category }),
        repo.listPublishedCategories(db, query.locale),
        repo.getContact(db),
      ]);
      return { items, categories, contact };
    },
    async listCategories(locale) {
      return { items: await repo.listPublishedCategories(db, locale) };
    },
  };
}

export const customerHelpService = createCustomerHelpService();
