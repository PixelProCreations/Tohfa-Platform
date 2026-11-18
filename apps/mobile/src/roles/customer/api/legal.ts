/** Legal documents (BR-172): Markdown bodies, public endpoints. */
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../shell/api/client';

export type LegalSlug = 'privacy-policy' | 'terms';
export interface LegalContent {
  title: string;
  version: number;
  lastUpdated: string;
  body: string;
  language: string;
}

/** Falls back to English when the requested language has no published content (404). */
export async function fetchLegal(slug: LegalSlug, language: string, signal?: AbortSignal): Promise<LegalContent> {
  try {
    return await api.get<LegalContent>(`/legal/${slug}?language=${encodeURIComponent(language)}`, signal);
  } catch (err) {
    if (language !== 'en' && (err as { status?: number }).status === 404) {
      return api.get<LegalContent>(`/legal/${slug}?language=en`, signal);
    }
    throw err;
  }
}

export function useLegal(slug: LegalSlug, language: string) {
  return useQuery({
    queryKey: ['legal', slug, language],
    queryFn: ({ signal }) => fetchLegal(slug, language, signal),
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });
}

/** `2026-11-12T..Z` -> `12/11/2026`. */
export function formatLegalDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}

export type MarkdownBlock =
  | { kind: 'heading'; level: 1 | 2 | 3; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'bullet'; text: string }
  | { kind: 'numbered'; index: number; text: string };

function stripInline(s: string): string {
  return s
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/`([^`]+)`/g, '$1')
    .trim();
}

// Small Markdown subset: # headings (levels 1-3), dash/star bullets, `1.` lists, paragraphs. Inline markers stripped.
export function parseMarkdown(md: string): MarkdownBlock[] {
  const out: MarkdownBlock[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) out.push({ kind: 'paragraph', text: stripInline(para.join(' ')) });
    para = [];
  };
  for (const raw of md.replace(/\r/g, '').split('\n')) {
    const line = raw.trim();
    let m: RegExpExecArray | null;
    if (line === '') flush();
    else if ((m = /^(#{1,6})\s+(.*)$/.exec(line))) {
      flush();
      out.push({ kind: 'heading', level: Math.min(m[1]!.length, 3) as 1 | 2 | 3, text: stripInline(m[2]!) });
    } else if ((m = /^[-*•]\s+(.*)$/.exec(line))) {
      flush();
      out.push({ kind: 'bullet', text: stripInline(m[1]!) });
    } else if ((m = /^(\d+)[.)]\s+(.*)$/.exec(line))) {
      flush();
      out.push({ kind: 'numbered', index: Number(m[1]), text: stripInline(m[2]!) });
    } else para.push(line);
  }
  flush();
  return out;
}
