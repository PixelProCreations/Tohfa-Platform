import { z } from 'zod';

export const languageEnum = z.enum(['en', 'ta']);
export type Language = z.infer<typeof languageEnum>;

export const trainingModeEnum = z.enum(['IN_FIELD', 'ONLINE_WEBINAR']);
export type TrainingMode = z.infer<typeof trainingModeEnum>;

export const learningIdParams = z.object({
  id: z.string().uuid(),
}).strict();
export type LearningIdParams = z.infer<typeof learningIdParams>;

// ── Articles ─────────────────────────────────────────────────────────────────

export const listArticlesQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  language: languageEnum.optional(),
  tag: z.string().trim().optional(),
}).strict();
export type ListArticlesQuery = z.infer<typeof listArticlesQuery>;

export const createArticleBody = z.object({
  title: z.string().trim().min(1),
  content: z.string().trim().min(1),
  snippet: z.string().trim().nullable().optional(),
  readTime: z.string().trim().min(1),
  author: z.string().trim().min(1),
  tag: z.string().trim().min(1),
  language: languageEnum.default('en'),
  isPublished: z.boolean().default(true),
}).strict();
export type CreateArticleBody = z.infer<typeof createArticleBody>;

export const updateArticleBody = z.object({
  title: z.string().trim().min(1).optional(),
  content: z.string().trim().min(1).optional(),
  snippet: z.string().trim().nullable().optional(),
  readTime: z.string().trim().min(1).optional(),
  author: z.string().trim().min(1).optional(),
  tag: z.string().trim().min(1).optional(),
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

// ── Videos ───────────────────────────────────────────────────────────────────

export const listVideosQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  language: languageEnum.optional(),
}).strict();
export type ListVideosQuery = z.infer<typeof listVideosQuery>;

export const createVideoBody = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().nullable().optional(),
  videoUrl: z.string().trim().min(1),
  duration: z.string().trim().min(1),
  author: z.string().trim().min(1),
  language: languageEnum.default('en'),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(true),
}).strict();
export type CreateVideoBody = z.infer<typeof createVideoBody>;

export const updateVideoBody = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().nullable().optional(),
  videoUrl: z.string().trim().min(1).optional(),
  duration: z.string().trim().min(1).optional(),
  author: z.string().trim().min(1).optional(),
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
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  language: languageEnum.optional(),
}).strict();
export type ListTrainingsQuery = z.infer<typeof listTrainingsQuery>;

export const createTrainingBody = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().nullable().optional(),
  trainingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  startTime: z.string().trim().min(1),
  endTime: z.string().trim().nullable().optional(),
  mode: trainingModeEnum,
  location: z.string().trim().min(1),
  instructor: z.string().trim().min(1),
  capacity: z.coerce.number().int().positive().nullable().optional(),
  language: languageEnum.default('en'),
  isPublished: z.boolean().default(true),
}).strict();
export type CreateTrainingBody = z.infer<typeof createTrainingBody>;

export const updateTrainingBody = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().nullable().optional(),
  trainingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
  startTime: z.string().trim().min(1).optional(),
  endTime: z.string().trim().nullable().optional(),
  mode: trainingModeEnum.optional(),
  location: z.string().trim().min(1).optional(),
  instructor: z.string().trim().min(1).optional(),
  capacity: z.coerce.number().int().positive().nullable().optional(),
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
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.string().trim().optional(),
}).strict();
export type ListGroupsQuery = z.infer<typeof listGroupsQuery>;

export const createGroupBody = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().nullable().optional(),
  category: z.string().trim().min(1),
}).strict();
export type CreateGroupBody = z.infer<typeof createGroupBody>;

export const updateGroupBody = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().nullable().optional(),
  category: z.string().trim().min(1).optional(),
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
