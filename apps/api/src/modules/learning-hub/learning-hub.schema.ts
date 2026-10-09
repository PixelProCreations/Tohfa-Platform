import { z } from 'zod';
import { isCalendarDate } from '../certifications/certifications.schema.js';

export const languageEnum = z.enum(['en', 'ta']);
export type Language = z.infer<typeof languageEnum>;

export const trainingModeEnum = z.enum(['IN_FIELD', 'ONLINE_WEBINAR']);
export type TrainingMode = z.infer<typeof trainingModeEnum>;

/**
 * Field-length limits. Chosen to match the closest existing fields in this repo
 * (calendar events: title 200 / description 2000 / time 20 / location 200;
 * farm-diary worker name 120; certifications issuer 160/number 80) so a client
 * cannot park megabytes of text in a row that is served to every farmer.
 * Article bodies have no precedent: 20000 characters is a long-form article.
 */
const L = {
  title: 200,
  description: 2000,
  content: 20_000,
  snippet: 300,
  shortLabel: 20, // readTime, duration, startTime, endTime
  person: 120, // author, instructor, group name
  tag: 80, // tag, category
  location: 200,
  url: 2048,
  /** The largest value the INT `capacity` column can hold. */
  capacity: 2_147_483_647,
} as const;

const requiredText = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

/**
 * Zod keeps running `.refine` after `.url()` has failed, so the parse must not
 * throw on a string that is not a URL at all (that would surface as a 500).
 */
function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Video links are rendered by the mobile app and opened in a player/browser, so
 * only https is accepted: `javascript:`, `data:` and `file:` URLs would be a
 * stored-XSS / local-file vector, and plain http is a mixed-content downgrade.
 */
const httpsUrl = z
  .string()
  .trim()
  .max(L.url)
  .url()
  .refine(isHttpsUrl, { message: 'Must be an https:// URL' });

const calendarDate = z
  .string()
  .refine(isCalendarDate, { message: 'Must be a real calendar date in YYYY-MM-DD format' });

const capacity = z.coerce.number().int().positive().max(L.capacity).nullable().optional();

export const learningIdParams = z.object({
  id: z.string().uuid(),
}).strict();
export type LearningIdParams = z.infer<typeof learningIdParams>;

// ── Articles ─────────────────────────────────────────────────────────────────

export const listArticlesQuery = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  language: languageEnum.optional(),
  tag: z.string().trim().max(L.tag).optional(),
}).strict();
export type ListArticlesQuery = z.infer<typeof listArticlesQuery>;

export const createArticleBody = z.object({
  title: requiredText(L.title),
  content: requiredText(L.content),
  snippet: optionalText(L.snippet),
  readTime: requiredText(L.shortLabel),
  author: requiredText(L.person),
  tag: requiredText(L.tag),
  language: languageEnum.default('en'),
  isPublished: z.boolean().default(true),
}).strict();
export type CreateArticleBody = z.infer<typeof createArticleBody>;

export const updateArticleBody = z.object({
  title: requiredText(L.title).optional(),
  content: requiredText(L.content).optional(),
  snippet: optionalText(L.snippet),
  readTime: requiredText(L.shortLabel).optional(),
  author: requiredText(L.person).optional(),
  tag: requiredText(L.tag).optional(),
  language: languageEnum.optional(),
  isPublished: z.boolean().optional(),
}).strict();
export type UpdateArticleBody = z.infer<typeof updateArticleBody>;

export const learningArticleResponse = z.object({
  id: z.string().uuid(),
  title: z.string(),
  content: z.string(),
  snippet: z.string().nullable(),
  readTime: z.string(),
  author: z.string(),
  tag: z.string(),
  language: languageEnum,
  isPublished: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type LearningArticleResponse = z.infer<typeof learningArticleResponse>;

/** List rows carry the snippet only; the full body is served by the detail endpoint. */
export const learningArticleSummaryResponse = learningArticleResponse.omit({ content: true });
export type LearningArticleSummaryResponse = z.infer<typeof learningArticleSummaryResponse>;

// ── Videos ───────────────────────────────────────────────────────────────────

export const listVideosQuery = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  language: languageEnum.optional(),
}).strict();
export type ListVideosQuery = z.infer<typeof listVideosQuery>;

export const createVideoBody = z.object({
  title: requiredText(L.title),
  description: optionalText(L.description),
  videoUrl: httpsUrl,
  duration: requiredText(L.shortLabel),
  author: requiredText(L.person),
  language: languageEnum.default('en'),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(true),
}).strict();
export type CreateVideoBody = z.infer<typeof createVideoBody>;

export const updateVideoBody = z.object({
  title: requiredText(L.title).optional(),
  description: optionalText(L.description),
  videoUrl: httpsUrl.optional(),
  duration: requiredText(L.shortLabel).optional(),
  author: requiredText(L.person).optional(),
  language: languageEnum.optional(),
  isFeatured: z.boolean().optional(),
  isPublished: z.boolean().optional(),
}).strict();
export type UpdateVideoBody = z.infer<typeof updateVideoBody>;

export const learningVideoResponse = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  videoUrl: z.string(),
  duration: z.string(),
  author: z.string(),
  language: languageEnum,
  isFeatured: z.boolean(),
  isPublished: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type LearningVideoResponse = z.infer<typeof learningVideoResponse>;

// ── Trainings ────────────────────────────────────────────────────────────────

export const listTrainingsQuery = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  language: languageEnum.optional(),
}).strict();
export type ListTrainingsQuery = z.infer<typeof listTrainingsQuery>;

export const createTrainingBody = z.object({
  title: requiredText(L.title),
  description: optionalText(L.description),
  trainingDate: calendarDate,
  startTime: requiredText(L.shortLabel),
  endTime: optionalText(L.shortLabel),
  mode: trainingModeEnum,
  location: requiredText(L.location),
  instructor: requiredText(L.person),
  capacity,
  language: languageEnum.default('en'),
  isPublished: z.boolean().default(true),
}).strict();
export type CreateTrainingBody = z.infer<typeof createTrainingBody>;

export const updateTrainingBody = z.object({
  title: requiredText(L.title).optional(),
  description: optionalText(L.description),
  trainingDate: calendarDate.optional(),
  startTime: requiredText(L.shortLabel).optional(),
  endTime: optionalText(L.shortLabel),
  mode: trainingModeEnum.optional(),
  location: requiredText(L.location).optional(),
  instructor: requiredText(L.person).optional(),
  capacity,
  language: languageEnum.optional(),
  isPublished: z.boolean().optional(),
}).strict();
export type UpdateTrainingBody = z.infer<typeof updateTrainingBody>;

export const learningTrainingResponse = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  trainingDate: z.string(),
  startTime: z.string(),
  endTime: z.string().nullable(),
  mode: trainingModeEnum,
  location: z.string(),
  instructor: z.string(),
  capacity: z.number().nullable(),
  enrolledCount: z.number(),
  isEnrolled: z.boolean().optional(),
  language: languageEnum,
  isPublished: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type LearningTrainingResponse = z.infer<typeof learningTrainingResponse>;

// ── Groups ───────────────────────────────────────────────────────────────────

export const listGroupsQuery = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.string().trim().max(L.tag).optional(),
}).strict();
export type ListGroupsQuery = z.infer<typeof listGroupsQuery>;

export const createGroupBody = z.object({
  name: requiredText(L.person),
  description: optionalText(L.description),
  category: requiredText(L.tag),
}).strict();
export type CreateGroupBody = z.infer<typeof createGroupBody>;

export const updateGroupBody = z.object({
  name: requiredText(L.person).optional(),
  description: optionalText(L.description),
  category: requiredText(L.tag).optional(),
}).strict();
export type UpdateGroupBody = z.infer<typeof updateGroupBody>;

export const learningGroupResponse = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  category: z.string(),
  memberCount: z.number(),
  isJoined: z.boolean().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type LearningGroupResponse = z.infer<typeof learningGroupResponse>;
