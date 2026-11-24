/**
 * The admin side of community Q&A (docs/openapi.yaml tag Q&A Chat, BR-59u):
 *
 *   GET    /admin/qa/questions                  learning.admin.manage
 *   POST   /admin/qa/questions                  farmer.learning.qa_participate
 *   GET    /admin/qa/questions/{id}             learning.admin.manage
 *   PATCH  /admin/qa/questions/{id}             farmer.learning.qa_participate (author only)
 *   DEL    /admin/qa/questions/{id}             community.group.moderate
 *   POST   /admin/qa/questions/{id}/answers     farmer.learning.qa_participate
 *   PATCH  /admin/qa/answers/{id}               farmer.learning.qa_participate (author only)
 *   DEL    /admin/qa/answers/{id}               community.group.moderate
 *   PATCH  /admin/qa/questions/{id}/moderate    community.group.moderate
 *   PATCH  /admin/qa/answers/{id}/moderate      community.group.moderate
 *
 * Anyone holding `farmer.learning.qa_participate` can answer — a farmer or an
 * administrator — so replying is NOT an admin-only act, and an answer's
 * `author.role` says which of the two wrote it. Editing is author-only on the
 * server: a participant who is not the author is refused, and the client does
 * not try to route around that. The /farmers/me/qa/* mirror of these routes
 * belongs to the farmer app (roles/farmer), not here.
 *
 * Blocking is a moderation write: it records `isBlocked` and a reason, and the
 * admin read returns the blocked text unmasked with that reason (a farmer read
 * masks it). Paging is `page`/`limit` (NumberedPage). Nothing here moves money.
 *
 * Wire types are duplicated from the spec here rather than shared with
 * roles/farmer, for the cross-role import reason in apps/mobile/CLAUDE.md.
 * No UI imports.
 */
import type { ErrorCode, GenericProblemCode } from '@tohfa/shared-types';
import type { NumberedPage } from '../../../shell/api/pagination';
import type { LearningContentType } from './learning';
import { adminDelete, adminGet, adminPatch, adminPost } from './http';

export { QA_MODULE, qaKeys, type QaListKeyFilters } from './queryKeys';

// ---------------------------------------------------------------------------
// Response DTOs
// ---------------------------------------------------------------------------

/** docs/openapi.yaml QaAuthor. `displayName` is what the server chose to show. */
export interface QaAuthorDto {
  id: string;
  displayName: string;
  role: 'FARMER' | 'ADMIN';
}

/** docs/openapi.yaml QaAnswer. */
export interface QaAnswerDto {
  id: string;
  questionId: string;
  content: string;
  author: QaAuthorDto;
  isBlocked: boolean;
  blockReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** docs/openapi.yaml QaQuestionSummary: a list row. */
export interface QaQuestionSummaryDto {
  id: string;
  communityId?: string | null;
  contentType?: LearningContentType | null;
  contentId?: string | null;
  title: string;
  content: string;
  author: QaAuthorDto;
  answerCount: number;
  isBlocked: boolean;
  blockReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** docs/openapi.yaml QaQuestionDetail: the summary plus every answer. */
export interface QaQuestionDetailDto extends QaQuestionSummaryDto {
  answers: QaAnswerDto[];
}

/** docs/openapi.yaml ListQuestionsResponse. */
export type QaQuestionsPage = NumberedPage<QaQuestionSummaryDto>;

// ---------------------------------------------------------------------------
// Request bodies
// ---------------------------------------------------------------------------

/** docs/openapi.yaml AskQuestionRequest. */
export interface AskQuestionBody {
  communityId?: string | null;
  contentType?: LearningContentType | null;
  contentId?: string | null;
  /** 1-200 characters. */
  title: string;
  /** 1-10000 characters. */
  content: string;
}

/** docs/openapi.yaml UpdateQuestionRequest. */
export interface UpdateQuestionBody {
  title?: string;
  content?: string;
}

/** docs/openapi.yaml PostAnswerRequest / UpdateAnswerRequest: 1-10000 characters. */
export interface AnswerBody {
  content: string;
}

/** docs/openapi.yaml ModerateContentRequest. `blockReason` is up to 500 characters. */
export interface ModerateBody {
  isBlocked?: boolean;
  blockReason?: string | null;
  softDelete?: boolean;
}

// ---------------------------------------------------------------------------
// List params
// ---------------------------------------------------------------------------

/** Every documented query of GET /admin/qa/questions. */
export interface ListQaQuestionsParams {
  page?: number | undefined;
  limit?: number | undefined;
  communityId?: string | undefined;
  contentType?: LearningContentType | undefined;
  contentId?: string | undefined;
  /** 1-80 characters; longer is 422. */
  q?: string | undefined;
  authorUserId?: string | undefined;
}

/** These endpoints document no problem codes of their own beyond the generic ones. */
export const ERROR_CODES: readonly (GenericProblemCode | ErrorCode)[] = [
  'BAD_REQUEST',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'VALIDATION_FAILED',
  'INTERNAL',
];

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

const QUESTIONS = '/admin/qa/questions';
const ANSWERS = '/admin/qa/answers';

function itemPath(base: string, id: string): string {
  return `${base}/${encodeURIComponent(id)}`;
}

/** One page of questions across every community and content item, blocked ones unmasked. */
export function listAdminQaQuestions(params: ListQaQuestionsParams = {}, signal?: AbortSignal): Promise<QaQuestionsPage> {
  return adminGet<QaQuestionsPage>(
    QUESTIONS,
    {
      page: params.page,
      limit: params.limit,
      communityId: params.communityId,
      contentType: params.contentType,
      contentId: params.contentId,
      q: params.q,
      authorUserId: params.authorUserId,
    },
    signal,
  );
}

/** Ask a question (201). */
export function askAdminQaQuestion(body: AskQuestionBody, signal?: AbortSignal): Promise<QaQuestionSummaryDto> {
  return adminPost<QaQuestionSummaryDto>(QUESTIONS, body, { signal });
}

/** One question with every answer, unmasked, with block reasons; 404 on an unknown id. */
export function getAdminQaQuestion(id: string, signal?: AbortSignal): Promise<QaQuestionDetailDto> {
  return adminGet<QaQuestionDetailDto>(itemPath(QUESTIONS, id), undefined, signal);
}

/** Edit the caller's OWN question; anyone else's is refused by the server. */
export function updateAdminQaQuestion(id: string, body: UpdateQuestionBody, signal?: AbortSignal): Promise<QaQuestionSummaryDto> {
  return adminPatch<QaQuestionSummaryDto>(itemPath(QUESTIONS, id), body, { signal });
}

/** Moderator delete of a question (204, no body). */
export function deleteAdminQaQuestion(id: string, signal?: AbortSignal): Promise<void> {
  return adminDelete(itemPath(QUESTIONS, id), { signal });
}

/** Post an answer (201). Any participant may answer, not only an administrator. */
export function postAdminQaAnswer(questionId: string, content: string, signal?: AbortSignal): Promise<QaAnswerDto> {
  const body: AnswerBody = { content };
  return adminPost<QaAnswerDto>(`${itemPath(QUESTIONS, questionId)}/answers`, body, { signal });
}

/** Edit the caller's OWN answer; anyone else's is refused by the server. */
export function updateAdminQaAnswer(id: string, content: string, signal?: AbortSignal): Promise<QaAnswerDto> {
  const body: AnswerBody = { content };
  return adminPatch<QaAnswerDto>(itemPath(ANSWERS, id), body, { signal });
}

/** Moderator delete of an answer (204, no body). */
export function deleteAdminQaAnswer(id: string, signal?: AbortSignal): Promise<void> {
  return adminDelete(itemPath(ANSWERS, id), { signal });
}

/** Block or unblock a question, with an optional reason (moderator). */
export function moderateAdminQaQuestion(id: string, body: ModerateBody, signal?: AbortSignal): Promise<QaQuestionSummaryDto> {
  return adminPatch<QaQuestionSummaryDto>(`${itemPath(QUESTIONS, id)}/moderate`, body, { signal });
}

/** Block or unblock an answer, with an optional reason (moderator). */
export function moderateAdminQaAnswer(id: string, body: ModerateBody, signal?: AbortSignal): Promise<QaAnswerDto> {
  return adminPatch<QaAnswerDto>(`${itemPath(ANSWERS, id)}/moderate`, body, { signal });
}
