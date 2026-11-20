/**
 * Help & FAQ (public): GET /help/articles?locale -> {items, categories, contact}.
 * Articles are admin-managed free text; `category` is free text too, so groups
 * are built client-side in the order of the `categories` array.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../shell/api/client';
import { getLocale } from '../../../i18n/customer';

export interface HelpArticle {
  id: string;
  category: string;
  locale: 'en' | 'ta';
  title: string;
  body: string;
  sortOrder: number;
}

export interface HelpResponse {
  items: HelpArticle[];
  categories: string[];
  contact: { phone?: string | null; email?: string | null };
}

export interface HelpGroup {
  category: string;
  articles: HelpArticle[];
}

export const helpQueryKeys = {
  articles: (locale: string) => ['help', locale] as const,
};

/** Groups by category (API `categories` order first, then unseen ones), articles by sortOrder. */
export function groupHelpArticles(data: Pick<HelpResponse, 'items' | 'categories'>): HelpGroup[] {
  const order = [...data.categories];
  for (const a of data.items) if (!order.includes(a.category)) order.push(a.category);
  return order
    .map((category) => ({
      category,
      articles: data.items.filter((a) => a.category === category).sort((a, b) => a.sortOrder - b.sortOrder),
    }))
    .filter((g) => g.articles.length > 0);
}

/** Case-insensitive search over category, title and body. A category match keeps all its articles. */
export function searchHelpGroups(groups: HelpGroup[], query: string): HelpGroup[] {
  const q = query.trim().toLowerCase();
  if (q === '') return groups;
  return groups.flatMap((g) => {
    if (g.category.toLowerCase().includes(q)) return [g];
    const articles = g.articles.filter((a) => a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q));
    return articles.length > 0 ? [{ ...g, articles }] : [];
  });
}

export function useHelpArticles() {
  const locale = getLocale() === 'ta' ? 'ta' : 'en';
  return useQuery({
    queryKey: helpQueryKeys.articles(locale),
    staleTime: 10 * 60_000,
    queryFn: ({ signal }) => api.get<HelpResponse>(`/help/articles?locale=${locale}`, signal),
  });
}
