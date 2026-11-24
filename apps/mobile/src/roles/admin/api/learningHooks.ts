/**
 * Live data for the Learning Hub screens. Thin wrappers over ./hooks.ts;
 * requests and types live in ./learning.ts, keys in ./queryKeys.ts. No
 * decisions here — hooks cannot be rendered in this app's plain-Node vitest,
 * so anything with a branch belongs in ./hookHelpers.ts (tested).
 *
 * Every hook takes `{ enabled }` so a screen can skip a request its `can()`
 * denies. The server still decides (root CLAUDE.md 2.1): /admin/learning/*
 * needs `learning.admin.manage`, /admin/learning-hub needs
 * `farmer.learning.manage`, and a caller may hold one without the other.
 *
 * The lists page by number, so they return NumberedList (items, total,
 * allPagesLoaded), not CursorList. `total` is the server's count over the
 * whole filtered set; any count a screen derives from `items` must go through
 * hookHelpers.countLoadedWhere, which is null until allPagesLoaded.
 */
import { adminKeys, COMMUNITIES_MODULE } from './queryKeys';
import { useAdminMutation, useAdminQuery, useNumberedList, type AdminQueryOptions, type NumberedList } from './hooks';
import {
  LEARNING_MODULE,
  archiveLearningGroup,
  createLearningArticle,
  createLearningGroup,
  createLearningTraining,
  createLearningVideo,
  deleteLearningArticle,
  deleteLearningGroup,
  deleteLearningTraining,
  deleteLearningVideo,
  getLearningArticle,
  getLearningGroup,
  getLearningHubArticle,
  getLearningTraining,
  getLearningVideo,
  learningKeys,
  reviewLearningContent,
  submitLearningForReview,
  listLearningArticles,
  listLearningGroups,
  listLearningHubArticles,
  listLearningTrainings,
  listLearningVideos,
  updateLearningArticle,
  updateLearningGroup,
  updateLearningTraining,
  updateLearningVideo,
  type CreateLearningArticleBody,
  type CreateLearningGroupBody,
  type CreateLearningTrainingBody,
  type CreateLearningVideoBody,
  type LearningArticleSummaryDto,
  type LearningContentType,
  type LearningGroupDto,
  type LearningTrainingDto,
  type LearningVideoDto,
  type ListLearningArticlesParams,
  type ListLearningGroupsParams,
  type ListLearningTrainingsParams,
  type ListLearningVideosParams,
  type ReviewLearningContentBody,
  type UpdateLearningArticleBody,
  type UpdateLearningGroupBody,
  type UpdateLearningTrainingBody,
  type UpdateLearningVideoBody,
} from './learning';

/** The rows reach the screens as the server sent them; there is nothing to derive yet. */
function identity<T>(dto: T): T {
  return dto;
}

// ── Lists ───────────────────────────────────────────────────────────────────

export function useLearningArticles(
  params: ListLearningArticlesParams = {},
  options: AdminQueryOptions = {},
): NumberedList<LearningArticleSummaryDto> {
  return useNumberedList(
    learningKeys.articles(params),
    (page, signal) => listLearningArticles({ ...params, page }, signal),
    identity<LearningArticleSummaryDto>,
    options,
  );
}

export function useLearningVideos(params: ListLearningVideosParams = {}, options: AdminQueryOptions = {}): NumberedList<LearningVideoDto> {
  return useNumberedList(
    learningKeys.videos(params),
    (page, signal) => listLearningVideos({ ...params, page }, signal),
    identity<LearningVideoDto>,
    options,
  );
}

export function useLearningTrainings(
  params: ListLearningTrainingsParams = {},
  options: AdminQueryOptions = {},
): NumberedList<LearningTrainingDto> {
  return useNumberedList(
    learningKeys.trainings(params),
    (page, signal) => listLearningTrainings({ ...params, page }, signal),
    identity<LearningTrainingDto>,
    options,
  );
}

export function useLearningGroups(params: ListLearningGroupsParams = {}, options: AdminQueryOptions = {}): NumberedList<LearningGroupDto> {
  return useNumberedList(
    learningKeys.groups(params),
    (page, signal) => listLearningGroups({ ...params, page }, signal),
    identity<LearningGroupDto>,
    options,
  );
}

/** The /admin/learning-hub articles list (farmer.learning.manage). */
export function useLearningHubArticles(
  params: ListLearningArticlesParams = {},
  options: AdminQueryOptions = {},
): NumberedList<LearningArticleSummaryDto> {
  return useNumberedList(
    learningKeys.hubArticles(params),
    (page, signal) => listLearningHubArticles({ ...params, page }, signal),
    identity<LearningArticleSummaryDto>,
    options,
  );
}

// ── Details ─────────────────────────────────────────────────────────────────

export function useLearningArticle(id: string | undefined, options: AdminQueryOptions = {}) {
  return useAdminQuery(learningKeys.article(id), (signal) => getLearningArticle(id ?? '', signal), {
    enabled: (options.enabled ?? true) && id !== undefined,
  });
}

export function useLearningVideo(id: string | undefined, options: AdminQueryOptions = {}) {
  return useAdminQuery(learningKeys.video(id), (signal) => getLearningVideo(id ?? '', signal), {
    enabled: (options.enabled ?? true) && id !== undefined,
  });
}

export function useLearningTraining(id: string | undefined, options: AdminQueryOptions = {}) {
  return useAdminQuery(learningKeys.training(id), (signal) => getLearningTraining(id ?? '', signal), {
    enabled: (options.enabled ?? true) && id !== undefined,
  });
}

export function useLearningGroup(id: string | undefined, options: AdminQueryOptions = {}) {
  return useAdminQuery(learningKeys.group(id), (signal) => getLearningGroup(id ?? '', signal), {
    enabled: (options.enabled ?? true) && id !== undefined,
  });
}

/** One /admin/learning-hub article (farmer.learning.manage). */
export function useLearningHubArticle(id: string | undefined, options: AdminQueryOptions = {}) {
  return useAdminQuery(learningKeys.hubArticle(id), (signal) => getLearningHubArticle(id ?? '', signal), {
    enabled: (options.enabled ?? true) && id !== undefined,
  });
}

// ── Writes ──────────────────────────────────────────────────────────────────

/**
 * One module prefix for every learning write: the four resources share their
 * screens, and a stale neighbouring tab is worse than one extra refetch. The
 * communities module rides along because a group write changes a community's
 * `groupCount` and `memberCount` (BR-59s).
 */
const LEARNING_INVALIDATES = [adminKeys.module(LEARNING_MODULE), adminKeys.module(COMMUNITIES_MODULE)] as const;

export function useCreateLearningArticle() {
  return useAdminMutation({
    mutationFn: (body: CreateLearningArticleBody) => createLearningArticle(body),
    invalidates: LEARNING_INVALIDATES,
  });
}

export function useUpdateLearningArticle() {
  return useAdminMutation({
    mutationFn: (vars: { id: string; body: UpdateLearningArticleBody }) => updateLearningArticle(vars.id, vars.body),
    invalidates: LEARNING_INVALIDATES,
  });
}

export function useDeleteLearningArticle() {
  return useAdminMutation({
    mutationFn: (id: string) => deleteLearningArticle(id),
    invalidates: LEARNING_INVALIDATES,
  });
}

export function useCreateLearningVideo() {
  return useAdminMutation({
    mutationFn: (body: CreateLearningVideoBody) => createLearningVideo(body),
    invalidates: LEARNING_INVALIDATES,
  });
}

export function useUpdateLearningVideo() {
  return useAdminMutation({
    mutationFn: (vars: { id: string; body: UpdateLearningVideoBody }) => updateLearningVideo(vars.id, vars.body),
    invalidates: LEARNING_INVALIDATES,
  });
}

export function useDeleteLearningVideo() {
  return useAdminMutation({
    mutationFn: (id: string) => deleteLearningVideo(id),
    invalidates: LEARNING_INVALIDATES,
  });
}

export function useCreateLearningTraining() {
  return useAdminMutation({
    mutationFn: (body: CreateLearningTrainingBody) => createLearningTraining(body),
    invalidates: LEARNING_INVALIDATES,
  });
}

/** Lowering capacity below the enrolled count throws a 409 CONFLICT the screen must show (BR-59h). */
export function useUpdateLearningTraining() {
  return useAdminMutation({
    mutationFn: (vars: { id: string; body: UpdateLearningTrainingBody }) => updateLearningTraining(vars.id, vars.body),
    invalidates: LEARNING_INVALIDATES,
  });
}

export function useDeleteLearningTraining() {
  return useAdminMutation({
    mutationFn: (id: string) => deleteLearningTraining(id),
    invalidates: LEARNING_INVALIDATES,
  });
}

export function useCreateLearningGroup() {
  return useAdminMutation({
    mutationFn: (body: CreateLearningGroupBody) => createLearningGroup(body),
    invalidates: LEARNING_INVALIDATES,
  });
}

export function useUpdateLearningGroup() {
  return useAdminMutation({
    mutationFn: (vars: { id: string; body: UpdateLearningGroupBody }) => updateLearningGroup(vars.id, vars.body),
    invalidates: LEARNING_INVALIDATES,
  });
}

/** Deleting a group that still has members is 409 CONFLICT; archive it instead (BR-59q). */
export function useDeleteLearningGroup() {
  return useAdminMutation({
    mutationFn: (id: string) => deleteLearningGroup(id),
    invalidates: LEARNING_INVALIDATES,
  });
}

export function useArchiveLearningGroup() {
  return useAdminMutation({
    mutationFn: (id: string) => archiveLearningGroup(id),
    invalidates: LEARNING_INVALIDATES,
  });
}

// ── Review workflow (BR-59t) ────────────────────────────────────────────────

/**
 * Submit content for review. The review axis is independent of publishing: this
 * leaves `isPublished` alone, and the screen must not gate Publish on it.
 */
export function useSubmitLearningForReview() {
  return useAdminMutation({
    mutationFn: (vars: { type: LearningContentType; id: string; note?: string }) =>
      submitLearningForReview(vars.type, vars.id, vars.note),
    invalidates: LEARNING_INVALIDATES,
  });
}

/** Record a review decision (learning.content.review). Never moves `isPublished`. */
export function useReviewLearningContent() {
  return useAdminMutation({
    mutationFn: (vars: { type: LearningContentType; id: string } & ReviewLearningContentBody) =>
      reviewLearningContent(vars.type, vars.id, vars.note === undefined ? { status: vars.status } : { status: vars.status, note: vars.note }),
    invalidates: LEARNING_INVALIDATES,
  });
}
