import { z } from 'zod';

export const legalSlugs = ['privacy-policy', 'terms'] as const;
export const legalSlug = z.enum(legalSlugs);
export type LegalSlug = z.infer<typeof legalSlug>;

const language = z.string().trim().regex(/^[a-z]{2}(-[A-Z]{2})?$/, 'language must look like en or ta-IN');

export const publicLegalQuery = z.object({ language: language.default('en') }).strict();
export type PublicLegalQuery = z.infer<typeof publicLegalQuery>;

export const legalSlugParams = z.object({ slug: legalSlug }).strict();

/** PUT /v1/admin/legal/{slug}: publishes a NEW version; old versions are never edited. */
export const putLegalBody = z
  .object({
    title: z.string().trim().min(1).max(200),
    body: z.string().trim().min(20).max(200_000),
    language: language.default('en'),
  })
  .strict();
export type PutLegalBody = z.infer<typeof putLegalBody>;

export const legalContentSchema = z
  .object({
    title: z.string(),
    version: z.number().int().min(1),
    lastUpdated: z.string(),
    body: z.string(),
    language: z.string(),
  })
  .strict();
export type LegalContent = z.infer<typeof legalContentSchema>;
