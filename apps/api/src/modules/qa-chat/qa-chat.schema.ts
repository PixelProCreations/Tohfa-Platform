/**
 * Q&A Chat schemas (Antigravity Brief 03 / BR-59u).
 * Single source of truth for Q&A questions, answers, and moderation.
 */
import { z } from 'zod';

export const QA_CONTENT_TYPES = ['articles', 'videos', 'trainings', 'groups'] as const;
export type QaContentType = (typeof QA_CONTENT_TYPES)[number];

export const questionIdParams = z
  .object({
    id: z.string().uuid('Question id must be a UUID'),
  })
  .strict();
export type QuestionIdParams = z.infer<typeof questionIdParams>;

export const answerIdParams = z
  .object({
    id: z.string().uuid('Answer id must be a UUID'),
  })
  .strict();
export type AnswerIdParams = z.infer<typeof answerIdParams>;

export const listQuestionsQuery = z
  .object({
    page: z.coerce.number().int().min(1).max(10000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    communityId: z.string().uuid().optional(),
    contentType: z.enum(QA_CONTENT_TYPES).optional(),
    contentId: z.string().uuid().optional(),
    q: z.string().trim().min(1).max(80).optional(),
    authorUserId: z.string().uuid().optional(),
  })
  .strict();
export type ListQuestionsQuery = z.infer<typeof listQuestionsQuery>;

export const askQuestionBody = z
  .object({
    communityId: z.string().uuid().nullable().optional(),
    contentType: z.enum(QA_CONTENT_TYPES).nullable().optional(),
    contentId: z.string().uuid().nullable().optional(),
    title: z.string().trim().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters'),
    content: z.string().trim().min(1, 'Content is required').max(10000, 'Content cannot exceed 10000 characters'),
  })
  .strict();
export type AskQuestionBody = z.infer<typeof askQuestionBody>;

export const updateQuestionBody = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    content: z.string().trim().min(1).max(10000).optional(),
  })
  .strict();
export type UpdateQuestionBody = z.infer<typeof updateQuestionBody>;

export const postAnswerBody = z
  .object({
    content: z.string().trim().min(1, 'Content is required').max(10000, 'Content cannot exceed 10000 characters'),
  })
  .strict();
export type PostAnswerBody = z.infer<typeof postAnswerBody>;

export const updateAnswerBody = z
  .object({
    content: z.string().trim().min(1, 'Content is required').max(10000, 'Content cannot exceed 10000 characters'),
  })
  .strict();
export type UpdateAnswerBody = z.infer<typeof updateAnswerBody>;

export const moderateContentBody = z
  .object({
    isBlocked: z.boolean().optional(),
    blockReason: z.string().trim().max(500).nullable().optional(),
    softDelete: z.boolean().optional(),
  })
  .strict();
export type ModerateContentBody = z.infer<typeof moderateContentBody>;

export const qaAuthorResponse = z.object({
  id: z.string().uuid(),
  displayName: z.string(),
  role: z.enum(['FARMER', 'ADMIN']),
});
export type QaAuthorResponse = z.infer<typeof qaAuthorResponse>;

export const qaAnswerResponse = z.object({
  id: z.string().uuid(),
  questionId: z.string().uuid(),
  content: z.string(),
  author: qaAuthorResponse,
  isBlocked: z.boolean(),
  blockReason: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type QaAnswerResponse = z.infer<typeof qaAnswerResponse>;

export const qaQuestionSummaryResponse = z.object({
  id: z.string().uuid(),
  communityId: z.string().uuid().nullable(),
  contentType: z.enum(QA_CONTENT_TYPES).nullable(),
  contentId: z.string().uuid().nullable(),
  title: z.string(),
  content: z.string(),
  author: qaAuthorResponse,
  answerCount: z.number().int().nonnegative(),
  isBlocked: z.boolean(),
  blockReason: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type QaQuestionSummaryResponse = z.infer<typeof qaQuestionSummaryResponse>;

export const qaQuestionDetailResponse = qaQuestionSummaryResponse.extend({
  answers: z.array(qaAnswerResponse),
});
export type QaQuestionDetailResponse = z.infer<typeof qaQuestionDetailResponse>;

export const listQuestionsResponse = z.object({
  items: z.array(qaQuestionSummaryResponse),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
});
export type ListQuestionsResponse = z.infer<typeof listQuestionsResponse>;
