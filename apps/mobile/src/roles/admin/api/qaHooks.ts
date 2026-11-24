/**
 * Live data for the Q&A chat screens. Thin wrappers over ./hooks.ts; requests
 * and types live in ./qa.ts, keys in ./queryKeys.ts. No decisions here: anything
 * with a branch belongs in screens/community/qaLogic.ts (tested).
 *
 * Reading needs `learning.admin.manage`, answering `farmer.learning.qa_participate`
 * and blocking `community.group.moderate`; a caller may hold any subset, so each
 * hook takes `{ enabled }` and the server still decides (root CLAUDE.md 2.1).
 */
import { adminKeys } from './queryKeys';
import { useAdminMutation, useAdminQuery, useNumberedList, type AdminQueryOptions, type NumberedList } from './hooks';
import {
  QA_MODULE,
  askAdminQaQuestion,
  getAdminQaQuestion,
  listAdminQaQuestions,
  moderateAdminQaQuestion,
  postAdminQaAnswer,
  qaKeys,
  type AskQuestionBody,
  type ListQaQuestionsParams,
  type ModerateBody,
  type QaQuestionSummaryDto,
} from './qa';

function identity<T>(dto: T): T {
  return dto;
}

export function useAdminQaQuestions(params: ListQaQuestionsParams = {}, options: AdminQueryOptions = {}): NumberedList<QaQuestionSummaryDto> {
  return useNumberedList(
    qaKeys.list(params),
    (page, signal) => listAdminQaQuestions({ ...params, page }, signal),
    identity<QaQuestionSummaryDto>,
    options,
  );
}

/** One thread: the question and every answer. Disabled until a question id is known. */
export function useAdminQaQuestion(id: string | undefined, options: AdminQueryOptions = {}) {
  return useAdminQuery(qaKeys.detail(id), (signal) => getAdminQaQuestion(id ?? '', signal), {
    enabled: (options.enabled ?? true) && id !== undefined,
  });
}

/** Every Q&A write refetches the whole module: a reply changes `answerCount` on the list as well as the thread. */
const QA_INVALIDATES = [adminKeys.module(QA_MODULE)] as const;

export function useAskAdminQaQuestion() {
  return useAdminMutation({
    mutationFn: (body: AskQuestionBody) => askAdminQaQuestion(body),
    invalidates: QA_INVALIDATES,
  });
}

export function usePostAdminQaAnswer() {
  return useAdminMutation({
    mutationFn: (vars: { questionId: string; content: string }) => postAdminQaAnswer(vars.questionId, vars.content),
    invalidates: QA_INVALIDATES,
  });
}

export function useModerateAdminQaQuestion() {
  return useAdminMutation({
    mutationFn: (vars: { id: string; body: ModerateBody }) => moderateAdminQaQuestion(vars.id, vars.body),
    invalidates: QA_INVALIDATES,
  });
}
