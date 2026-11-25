/**
 * Pure decisions for the Q&A chat screens (BR-59u). No React, so the app's
 * plain-Node vitest covers it (tests/community_wiring_logic.test.ts).
 *
 * Anyone with `farmer.learning.qa_participate` answers — a farmer or an
 * administrator — so a bubble's side follows the AUTHOR's role, never the
 * viewer: a farmer's answer is a farmer bubble even though an admin is reading.
 * Editing an answer is author-only on the server and there is no edit control
 * on this screen, so nothing here offers one.
 *
 * Moderation reads are unmasked: the admin read returns a blocked message's
 * text with its reason, so the moderator sees what was blocked and why.
 */
import type { QaAnswerDto, QaQuestionDetailDto, QaQuestionSummaryDto } from '../../api/qa';
import { t } from '../../i18n';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { COMMUNITY_MODERATE } from './communitiesLogic';
import { dayText, joinMeta, orDash, typeBadgeOf, type BuiltBody, type ContentKind } from './communityLogic';

export { COMMUNITY_MODERATE };

/** The permission behind POST /admin/qa/questions/{id}/answers (docs/rbac.json). */
export const QA_PARTICIPATE = 'farmer.learning.qa_participate';

/** Replying needs the participate permission and nothing else; it is not admin-only. */
export function canSendAnswer(can: ((code: string) => boolean) | undefined): boolean {
  return can === undefined ? false : can(QA_PARTICIPATE);
}

/** Blocking a question or archiving its community needs the moderate permission. */
export function canModerate(can: ((code: string) => boolean) | undefined): boolean {
  return can === undefined ? false : can(COMMUNITY_MODERATE);
}

const ANSWER_MAX = 10000;

/** PostAnswerRequest: 1-10000 characters, trimmed. A blank reply is not sent. */
export function buildAnswerBody(text: string): BuiltBody<{ content: string }> {
  const content = text.trim();
  if (content === '' || content.length > ANSWER_MAX) return { ok: false, errorKey: 'community.validation.answer' };
  return { ok: true, body: { content } };
}

const CONTENT_KIND: Record<string, ContentKind> = {
  articles: 'article',
  videos: 'video',
  trainings: 'training',
  groups: 'group',
};

/** "Article", "Video", ... for the content a question hangs off; undefined for a community-level question. */
export function contentTypeLabel(contentType: string | null | undefined): string | undefined {
  if (contentType === undefined || contentType === null) return undefined;
  const kind = CONTENT_KIND[contentType];
  return kind === undefined ? undefined : typeBadgeOf(kind);
}

/** The header subtitle: the question title, then what it is about. The dash when there is no thread. */
export function threadSubtitle(thread: QaQuestionSummaryDto | undefined): string {
  if (thread === undefined) return ADMIN_NO_VALUE;
  const title = thread.title.trim();
  const label = contentTypeLabel(thread.contentType);
  const parts = [title === '' ? undefined : title, label].filter((part): part is string => part !== undefined);
  return parts.length === 0 ? ADMIN_NO_VALUE : parts.join(' · ');
}

export interface MessageView {
  id: string;
  kind: 'question' | 'answer';
  author: string;
  /** Which bubble: the author's role, not the viewer's. */
  side: 'farmer' | 'admin';
  /** The question's title; null on an answer, which has none. */
  title: string | null;
  content: string;
  timestamp: string;
  /** "Blocked: <reason>" for a blocked message, else null. */
  blockedNote: string | null;
}

function blockedNote(isBlocked: boolean, reason: string | null | undefined): string | null {
  if (!isBlocked) return null;
  const trimmed = reason === undefined || reason === null ? '' : reason.trim();
  return trimmed === '' ? t('community.chat.blockedNoReason') : t('community.chat.blocked', { reason: trimmed });
}

function answerView(answer: QaAnswerDto): MessageView {
  return {
    id: answer.id,
    kind: 'answer',
    author: orDash(answer.author.displayName),
    side: answer.author.role === 'ADMIN' ? 'admin' : 'farmer',
    title: null,
    content: answer.content,
    timestamp: dayText(answer.createdAt),
    blockedNote: blockedNote(answer.isBlocked, answer.blockReason),
  };
}

/** The thread in reading order: the question, then every answer as the server ordered them. */
export function qaThreadView(thread: QaQuestionDetailDto): MessageView[] {
  const question: MessageView = {
    id: thread.id,
    kind: 'question',
    author: orDash(thread.author.displayName),
    side: thread.author.role === 'ADMIN' ? 'admin' : 'farmer',
    title: orDash(thread.title),
    content: thread.content,
    timestamp: dayText(thread.createdAt),
    blockedNote: blockedNote(thread.isBlocked, thread.blockReason),
  };
  return [question, ...thread.answers.map(answerView)];
}

export interface QuestionRowView {
  id: string;
  sender: string;
  title: string;
  preview: string;
  timestamp: string;
  /** True once at least one answer exists; "unread" has no field, so it is never claimed. */
  replied: boolean;
  /** "N answers", the server's own count. */
  meta: string;
}

/** One question in a list (a content item's Replies, a community's Discussions). */
export function questionRow(dto: QaQuestionSummaryDto): QuestionRowView {
  return {
    id: dto.id,
    sender: orDash(dto.author.displayName),
    title: orDash(dto.title),
    preview: orDash(dto.content),
    timestamp: dayText(dto.createdAt),
    replied: dto.answerCount > 0,
    meta: joinMeta([t('community.discussions.answers', { count: String(dto.answerCount) })]),
  };
}
