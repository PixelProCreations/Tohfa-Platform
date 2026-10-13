/**
 * `GET /admin/help` — docs/openapi.yaml `readAdminHelp`, `help.article.view`
 * (all five admin roles), BR-82.
 *
 * Published plain-text articles for one locale (server default `en`),
 * optionally one category, plus the contact channels. Not paginated (capped
 * at 500 by the server). Nothing is seeded: a fresh system returns empty
 * `items`/`categories` and a `null` phone and e-mail, and the app must not
 * invent either. Admin support tickets are NOT built server-side, so there is
 * no ticket call here.
 */
import { adminGet } from './http';
import type { LocaleDto } from './profile';

/** Problem codes this endpoint can answer with (docs/openapi.yaml responses). */
export const ERROR_CODES = ['UNAUTHENTICATED', 'FORBIDDEN', 'VALIDATION_FAILED', 'INTERNAL'] as const;

/** docs/openapi.yaml `HelpArticleReader`. */
export interface HelpArticleDto {
  id: string;
  category: string;
  locale: LocaleDto;
  title: string;
  /** Plain text. */
  body: string;
  sortOrder: number;
}

/** docs/openapi.yaml `HelpContact`: null while not configured. */
export interface HelpContactDto {
  phone: string | null;
  email: string | null;
}

/** docs/openapi.yaml `HelpResponse`. */
export interface HelpResponseDto {
  items: HelpArticleDto[];
  categories: string[];
  contact: HelpContactDto;
}

export interface GetAdminHelpParams {
  locale?: LocaleDto | undefined;
  /** 1..60 characters. */
  category?: string | undefined;
}

export function getAdminHelp(params: GetAdminHelpParams, signal?: AbortSignal): Promise<HelpResponseDto> {
  return adminGet<HelpResponseDto>('/admin/help', {
    query: { locale: params.locale, category: params.category },
    signal,
  });
}
