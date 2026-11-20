import { z } from 'zod';
import { productSchema } from '../catalog/catalog.schema.js';

/** GET /v1/catalog/search/suggestions (docs/openapi.yaml `SearchSuggestion`). */
export const suggestionsQuery = z
  .object({
    q: z.string().trim().min(1).max(80),
    limit: z.coerce.number().int().min(1).max(20).default(8),
  })
  .strict();
export type SuggestionsQuery = z.infer<typeof suggestionsQuery>;

export const searchSuggestionSchema = z
  .object({
    type: z.enum(['PRODUCT', 'CATEGORY']),
    id: z.string().uuid(),
    name: z.string(),
  })
  .strict();
export type SearchSuggestion = z.infer<typeof searchSuggestionSchema>;

export const suggestionsResponse = z.object({ items: z.array(searchSuggestionSchema) }).strict();
export type SuggestionsResponse = z.infer<typeof suggestionsResponse>;

/** POST /v1/catalog/search/recent body. */
export const recentSearchBody = z
  .object({
    query: z.string().trim().min(1).max(80),
  })
  .strict();
export type RecentSearchBody = z.infer<typeof recentSearchBody>;

/** DELETE /v1/catalog/search/recent query: `q` removes one entry, absent clears all. */
export const deleteRecentQuery = z
  .object({
    q: z.string().trim().min(1).max(80).optional(),
  })
  .strict();
export type DeleteRecentQuery = z.infer<typeof deleteRecentQuery>;

export const recentSearchSchema = z
  .object({
    query: z.string(),
    searchedAt: z.string(),
  })
  .strict();
export type RecentSearch = z.infer<typeof recentSearchSchema>;

export const recentSearchesResponse = z.object({ items: z.array(recentSearchSchema) }).strict();
export type RecentSearchesResponse = z.infer<typeof recentSearchesResponse>;

/** GET /v1/catalog/search/trending (docs/openapi.yaml `TrendingSearches`). */
export const trendingQuery = z
  .object({
    limit: z.coerce.number().int().min(1).max(20).default(10),
  })
  .strict();
export type TrendingQuery = z.infer<typeof trendingQuery>;

export const trendingQuerySchema = z
  .object({
    query: z.string(),
    searchers: z.number().int(),
  })
  .strict();

export const trendingResponse = z
  .object({
    queries: z.array(trendingQuerySchema),
    products: z.array(productSchema),
  })
  .strict();
export type TrendingResponse = z.infer<typeof trendingResponse>;
