/**
 * The admin Learning Hub as an admin manages it (docs/openapi.yaml tag
 * Learning Hub, BR-59):
 *
 *   GET   /admin/learning/articles              learning.admin.manage  (BR-59l, BR-59n)
 *   POST  /admin/learning/articles              learning.admin.manage  (BR-59d)
 *   GET   /admin/learning/articles/{id}         learning.admin.manage  (BR-59m)
 *   PATCH /admin/learning/articles/{id}         learning.admin.manage  (BR-59d)
 *   DEL   /admin/learning/articles/{id}         learning.admin.manage  (BR-59d)
 *   ... videos, trainings and groups repeat the same five, with their own filters
 *   POST  /admin/learning/groups/{id}/archive   learning.admin.manage  (BR-59q)
 *   GET   /admin/learning-hub[/{id}]            farmer.learning.manage (BR-59)
 *
 * Two permissions, not one: everything under /admin/learning/* needs
 * `learning.admin.manage`, while /admin/learning-hub needs
 * `farmer.learning.manage`. Holding one does not imply the other, so the two
 * surfaces keep separate functions and separate query keys even though the
 * server answers both from the same article store (see below). The client
 * never assumes access; the server gates it (root CLAUDE.md 2.1).
 *
 * Paging is `page`/`limit`, not a cursor: every list answers
 * `{ items, total, page, limit }` (NumberedPage) with no `nextCursor` and no
 * `hasMore`. Whether another page exists is therefore a calculation from
 * `total`, which is why these lists use useNumberedList rather than
 * useCursorList. `total` is the server's count over the whole filtered set; a
 * count derived from the loaded rows is only honest once every page is in
 * (hookHelpers.countLoadedWhere).
 *
 * Headers: no write here moves money, so none takes an Idempotency-Key (root
 * CLAUDE.md 2.4). The one replay hazard the spec names is lowering a training's
 * capacity below its enrolled count, which the server refuses with 409 CONFLICT
 * (BR-59h) rather than a header.
 *
 * Admin reads deliberately omit the farmer-perspective flags: the shared spec
 * schemas carry `isEnrolled` (training) and `isJoined` (group), but the admin
 * handlers map them away — there is no "the admin" enrolled in anything. They
 * are typed optional here because a create response still passes through the
 * farmer mapper; a screen must treat them as absent, never as a fact.
 *
 * Wire types are duplicated from the spec here rather than shared with
 * roles/farmer, for the cross-role import reason in apps/mobile/CLAUDE.md.
 * No UI imports.
 */
import type { ErrorCode, GenericProblemCode } from '@tohfa/shared-types';
import type { NumberedPage } from '../../../shell/api/pagination';
import { adminDelete, adminGet, adminPatch, adminPost } from './http';

export { LEARNING_MODULE, learningKeys, type LearningListKeyFilters } from './queryKeys';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/** docs/openapi.yaml: the `language` of every learning resource and list filter. */
export type LearningLanguage = 'en' | 'ta';

/** docs/openapi.yaml LearningTraining.mode. */
export type LearningTrainingMode = 'IN_FIELD' | 'ONLINE_WEBINAR';

/**
 * BR-59t: where a piece of content is in the review workflow. This is its own
 * axis, INDEPENDENT of `isPublished`: content can be published and pending
 * review at the same time, a review decision never moves `isPublished`, and
 * publishing is never blocked by review state (owner decision). A screen must
 * not derive one from the other.
 */
export type LearningReviewStatus = 'NOT_SUBMITTED' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

/** The four resources the review endpoints address by path (`{type}`). */
export type LearningContentType = 'articles' | 'videos' | 'trainings' | 'groups';

/** The `sort` query of GET /admin/learning/groups (BR-59n); articles, videos and trainings take no sort. */
export type LearningGroupSort = 'members' | 'name';

// ---------------------------------------------------------------------------
// Response DTOs
// ---------------------------------------------------------------------------

/**
 * BR-59t review fields on every admin read of the four resources. Optional
 * because a farmer-facing mapper or an older response may omit them: absent is
 * not NOT_SUBMITTED, and a screen shows the dash for it.
 */
export interface LearningReviewFields {
  reviewStatus?: LearningReviewStatus;
  submittedForReviewAt?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
}

/**
 * docs/openapi.yaml LearningCropRef (BR-59r): a crop_master row an article or
 * video is tagged with. `nameTa` is null for a crop with no Tamil name.
 */
export interface LearningCropRef {
  id: string;
  name: string;
  nameTa: string | null;
}

/**
 * docs/openapi.yaml LearningArticleSummary: one row of the admin article list.
 * Carries the snippet only — the body comes from the detail read (BR-59f).
 */
export interface LearningArticleSummaryDto extends LearningReviewFields {
  id: string;
  title: string;
  /** Optional in the spec and nullable on the wire. */
  snippet?: string | null;
  /** Free text as the author typed it, e.g. "4 min read"; never a number. */
  readTime: string;
  author: string;
  tag: string;
  language: LearningLanguage;
  isPublished: boolean;
  /** BR-59r. Always present, ordered by name, `[]` when untagged. */
  crops: LearningCropRef[];
  createdAt: string;
  updatedAt: string;
}

/** docs/openapi.yaml LearningArticle: the summary plus the full body (BR-59m). */
export interface LearningArticleDto extends LearningArticleSummaryDto {
  content: string;
}

/** docs/openapi.yaml LearningVideo. The list returns the full object, not a summary. */
export interface LearningVideoDto extends LearningReviewFields {
  id: string;
  title: string;
  description?: string | null;
  /** Always an absolute https:// URL; anything else is 422 on write (BR-59j). */
  videoUrl: string;
  /** Free text, e.g. "6:10". */
  duration: string;
  author: string;
  language: LearningLanguage;
  isFeatured: boolean;
  isPublished: boolean;
  /** BR-59r. Always present, ordered by name, `[]` when untagged. */
  crops: LearningCropRef[];
  createdAt: string;
  updatedAt: string;
}

/** docs/openapi.yaml LearningTraining. */
export interface LearningTrainingDto extends LearningReviewFields {
  id: string;
  title: string;
  description?: string | null;
  /** YYYY-MM-DD. */
  trainingDate: string;
  /** Free text, e.g. "10:00". */
  startTime: string;
  endTime?: string | null;
  mode: LearningTrainingMode;
  location: string;
  instructor: string;
  /** null = no limit (BR-59h). */
  capacity?: number | null;
  enrolledCount: number;
  /**
   * Farmer-perspective, absent from every admin read. Present only because a
   * create response passes through the farmer mapper; never a fact for an admin.
   */
  isEnrolled?: boolean;
  language: LearningLanguage;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

/** docs/openapi.yaml LearningGroup. */
export interface LearningGroupDto extends LearningReviewFields {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  memberCount: number;
  /** Farmer-perspective, absent from every admin read (see LearningTrainingDto.isEnrolled). */
  isJoined?: boolean;
  /** BR-59q; absent on a create response. */
  isArchived?: boolean;
  archivedAt?: string | null;
  /** BR-59s: the parent community; null for a group that belongs to none, absent on an older response. */
  communityId?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** docs/openapi.yaml LearningArticlesListResponse. */
export type LearningArticlesPage = NumberedPage<LearningArticleSummaryDto>;
/** docs/openapi.yaml LearningVideosListResponse. */
export type LearningVideosPage = NumberedPage<LearningVideoDto>;
/** docs/openapi.yaml LearningTrainingsListResponse. */
export type LearningTrainingsPage = NumberedPage<LearningTrainingDto>;
/** docs/openapi.yaml LearningGroupsListResponse. */
export type LearningGroupsPage = NumberedPage<LearningGroupDto>;

// ---------------------------------------------------------------------------
// Request bodies
// ---------------------------------------------------------------------------

/** docs/openapi.yaml CreateLearningArticleRequest. Omitting `isPublished` leaves it to the server. */
export interface CreateLearningArticleBody {
  /** 1-200 characters. */
  title: string;
  /** 1-20000 characters. */
  content: string;
  /** Up to 300 characters. */
  snippet?: string | null;
  /** 1-20 characters. */
  readTime: string;
  /** 1-120 characters. */
  author: string;
  /** 1-80 characters. */
  tag: string;
  language?: LearningLanguage;
  isPublished?: boolean;
  /**
   * BR-59r: the complete set of crop_master ids (max 100). On an update, OMITTED
   * leaves the stored tags unchanged and `[]` clears them; an unknown or
   * soft-deleted id is 422 VALIDATION_FAILED.
   */
  cropIds?: string[];
}

/** docs/openapi.yaml UpdateLearningArticleRequest: every field optional, same bounds. */
export type UpdateLearningArticleBody = Partial<CreateLearningArticleBody>;

/** docs/openapi.yaml CreateLearningVideoRequest. */
export interface CreateLearningVideoBody {
  /** 1-200 characters. */
  title: string;
  /** Up to 2000 characters. */
  description?: string | null;
  /** Absolute https:// URL, up to 2048 characters; http/javascript/data/file are 422 (BR-59j). */
  videoUrl: string;
  /** 1-20 characters. */
  duration: string;
  /** 1-120 characters. */
  author: string;
  language?: LearningLanguage;
  isFeatured?: boolean;
  isPublished?: boolean;
  /**
   * BR-59r: the complete set of crop_master ids (max 100). On an update, OMITTED
   * leaves the stored tags unchanged and `[]` clears them; an unknown or
   * soft-deleted id is 422 VALIDATION_FAILED.
   */
  cropIds?: string[];
}

/** docs/openapi.yaml UpdateLearningVideoRequest. */
export type UpdateLearningVideoBody = Partial<CreateLearningVideoBody>;

/** docs/openapi.yaml CreateLearningTrainingRequest. */
export interface CreateLearningTrainingBody {
  /** 1-200 characters. */
  title: string;
  description?: string | null;
  /** A real calendar date, YYYY-MM-DD; anything else is 422 (BR-59j). */
  trainingDate: string;
  /** 1-20 characters. */
  startTime: string;
  endTime?: string | null;
  mode: LearningTrainingMode;
  /** 1-200 characters. */
  location: string;
  /** 1-120 characters. */
  instructor: string;
  /** >= 1, or null for no limit. */
  capacity?: number | null;
  language?: LearningLanguage;
  isPublished?: boolean;
}

/**
 * docs/openapi.yaml UpdateLearningTrainingRequest. Lowering `capacity` below the
 * enrolled count is 409 CONFLICT (BR-59h); equal is allowed, null removes the limit.
 */
export type UpdateLearningTrainingBody = Partial<CreateLearningTrainingBody>;

/** docs/openapi.yaml CreateLearningGroupRequest. */
export interface CreateLearningGroupBody {
  /** 1-120 characters. */
  name: string;
  description?: string | null;
  /** 1-80 characters. */
  category: string;
  /** BR-59s: the parent community; null or omitted leaves the group in none. */
  communityId?: string | null;
}

/** docs/openapi.yaml UpdateLearningGroupRequest. */
export type UpdateLearningGroupBody = Partial<CreateLearningGroupBody>;

// ---------------------------------------------------------------------------
// List params
// ---------------------------------------------------------------------------

/** The paging queries every learning list takes: page >= 1, limit 1-100 (server defaults 1 and 20). */
export interface LearningPageParams {
  page?: number | undefined;
  limit?: number | undefined;
}

/** BR-59t: every admin content list filters by review status. */
export interface LearningReviewFilter {
  reviewStatus?: LearningReviewStatus | undefined;
}

/** Every documented query of GET /admin/learning/articles (BR-59n). */
export interface ListLearningArticlesParams extends LearningPageParams, LearningReviewFilter {
  language?: LearningLanguage | undefined;
  tag?: string | undefined;
  /** Absent means both published and unpublished (BR-59l). */
  isPublished?: boolean | undefined;
  /** Case-insensitive title substring, 1-80 characters; longer is 422 (BR-59n). */
  q?: string | undefined;
}

/** Every documented query of GET /admin/learning/videos: articles' set without `tag`. */
export type ListLearningVideosParams = Omit<ListLearningArticlesParams, 'tag'>;

/** Every documented query of GET /admin/learning/trainings: the same set as videos. */
export type ListLearningTrainingsParams = ListLearningVideosParams;

/** Every documented query of GET /admin/learning/groups: no language, no isPublished (BR-59n). */
export interface ListLearningGroupsParams extends LearningPageParams, LearningReviewFilter {
  category?: string | undefined;
  /** BR-59s: only the groups of this community. */
  communityId?: string | undefined;
  /** Case-insensitive name substring, 1-80 characters. */
  q?: string | undefined;
  sort?: LearningGroupSort | undefined;
}

/**
 * Problem codes these endpoints document beyond the generic ones: none of
 * their own. CONFLICT covers both 409s the spec names — a capacity lowered
 * below the enrolled count (BR-59h) and a group deleted while it still has
 * members (BR-59q).
 */
export const ERROR_CODES: readonly (GenericProblemCode | ErrorCode)[] = [
  'BAD_REQUEST',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'VALIDATION_FAILED',
  'INTERNAL',
];

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

const ARTICLES = '/admin/learning/articles';
const VIDEOS = '/admin/learning/videos';
const TRAININGS = '/admin/learning/trainings';
const GROUPS = '/admin/learning/groups';
const HUB = '/admin/learning-hub';

function itemPath(base: string, id: string): string {
  return `${base}/${encodeURIComponent(id)}`;
}

// ── Articles ────────────────────────────────────────────────────────────────

/** One page of articles, published and unpublished (BR-59l). */
export function listLearningArticles(params: ListLearningArticlesParams = {}, signal?: AbortSignal): Promise<LearningArticlesPage> {
  return adminGet<LearningArticlesPage>(
    ARTICLES,
    {
      page: params.page,
      limit: params.limit,
      language: params.language,
      tag: params.tag,
      isPublished: params.isPublished,
      reviewStatus: params.reviewStatus,
      q: params.q,
    },
    signal,
  );
}

/** Create an article (201, the full article). */
export function createLearningArticle(body: CreateLearningArticleBody, signal?: AbortSignal): Promise<LearningArticleDto> {
  return adminPost<LearningArticleDto>(ARTICLES, body, { signal });
}

/** One article with its full body, published or not; 404 on an unknown id (BR-59m). */
export function getLearningArticle(id: string, signal?: AbortSignal): Promise<LearningArticleDto> {
  return adminGet<LearningArticleDto>(itemPath(ARTICLES, id), undefined, signal);
}

/** Edit an article, including publishing or unpublishing it. */
export function updateLearningArticle(id: string, body: UpdateLearningArticleBody, signal?: AbortSignal): Promise<LearningArticleDto> {
  return adminPatch<LearningArticleDto>(itemPath(ARTICLES, id), body, { signal });
}

/** Delete an article (204, no body). */
export function deleteLearningArticle(id: string, signal?: AbortSignal): Promise<void> {
  return adminDelete(itemPath(ARTICLES, id), { signal });
}

// ── Videos ──────────────────────────────────────────────────────────────────

/** One page of videos, published and unpublished (BR-59l). */
export function listLearningVideos(params: ListLearningVideosParams = {}, signal?: AbortSignal): Promise<LearningVideosPage> {
  return adminGet<LearningVideosPage>(
    VIDEOS,
    {
      page: params.page,
      limit: params.limit,
      language: params.language,
      isPublished: params.isPublished,
      reviewStatus: params.reviewStatus,
      q: params.q,
    },
    signal,
  );
}

/** Create a video entry (201). A non-https videoUrl is 422 (BR-59j). */
export function createLearningVideo(body: CreateLearningVideoBody, signal?: AbortSignal): Promise<LearningVideoDto> {
  return adminPost<LearningVideoDto>(VIDEOS, body, { signal });
}

/** One video entry, published or not; 404 on an unknown id (BR-59m). */
export function getLearningVideo(id: string, signal?: AbortSignal): Promise<LearningVideoDto> {
  return adminGet<LearningVideoDto>(itemPath(VIDEOS, id), undefined, signal);
}

/** Edit a video entry. */
export function updateLearningVideo(id: string, body: UpdateLearningVideoBody, signal?: AbortSignal): Promise<LearningVideoDto> {
  return adminPatch<LearningVideoDto>(itemPath(VIDEOS, id), body, { signal });
}

/** Delete a video entry (204, no body). */
export function deleteLearningVideo(id: string, signal?: AbortSignal): Promise<void> {
  return adminDelete(itemPath(VIDEOS, id), { signal });
}

// ── Trainings ───────────────────────────────────────────────────────────────

/** One page of training workshops, published and unpublished (BR-59l). */
export function listLearningTrainings(params: ListLearningTrainingsParams = {}, signal?: AbortSignal): Promise<LearningTrainingsPage> {
  return adminGet<LearningTrainingsPage>(
    TRAININGS,
    {
      page: params.page,
      limit: params.limit,
      language: params.language,
      isPublished: params.isPublished,
      reviewStatus: params.reviewStatus,
      q: params.q,
    },
    signal,
  );
}

/** Create a training workshop (201). A non-calendar trainingDate is 422 (BR-59j). */
export function createLearningTraining(body: CreateLearningTrainingBody, signal?: AbortSignal): Promise<LearningTrainingDto> {
  return adminPost<LearningTrainingDto>(TRAININGS, body, { signal });
}

/** One training workshop, published or not; 404 on an unknown id (BR-59m). */
export function getLearningTraining(id: string, signal?: AbortSignal): Promise<LearningTrainingDto> {
  return adminGet<LearningTrainingDto>(itemPath(TRAININGS, id), undefined, signal);
}

/** Edit a training workshop. Capacity below the enrolled count is 409 CONFLICT (BR-59h). */
export function updateLearningTraining(id: string, body: UpdateLearningTrainingBody, signal?: AbortSignal): Promise<LearningTrainingDto> {
  return adminPatch<LearningTrainingDto>(itemPath(TRAININGS, id), body, { signal });
}

/** Delete a training workshop (204, no body). */
export function deleteLearningTraining(id: string, signal?: AbortSignal): Promise<void> {
  return adminDelete(itemPath(TRAININGS, id), { signal });
}

// ── Community groups ────────────────────────────────────────────────────────

/** One page of community groups (BR-59n). */
export function listLearningGroups(params: ListLearningGroupsParams = {}, signal?: AbortSignal): Promise<LearningGroupsPage> {
  return adminGet<LearningGroupsPage>(
    GROUPS,
    {
      page: params.page,
      limit: params.limit,
      category: params.category,
      communityId: params.communityId,
      reviewStatus: params.reviewStatus,
      q: params.q,
      sort: params.sort,
    },
    signal,
  );
}

/** Create a community group (201). */
export function createLearningGroup(body: CreateLearningGroupBody, signal?: AbortSignal): Promise<LearningGroupDto> {
  return adminPost<LearningGroupDto>(GROUPS, body, { signal });
}

/** One community group; 404 on an unknown id (BR-59m). */
export function getLearningGroup(id: string, signal?: AbortSignal): Promise<LearningGroupDto> {
  return adminGet<LearningGroupDto>(itemPath(GROUPS, id), undefined, signal);
}

/** Edit a community group. */
export function updateLearningGroup(id: string, body: UpdateLearningGroupBody, signal?: AbortSignal): Promise<LearningGroupDto> {
  return adminPatch<LearningGroupDto>(itemPath(GROUPS, id), body, { signal });
}

/**
 * Delete a community group (204, no body). Allowed only while the group has no
 * members; with members it is 409 CONFLICT and the group should be archived
 * instead (BR-59q).
 */
export function deleteLearningGroup(id: string, signal?: AbortSignal): Promise<void> {
  return adminDelete(itemPath(GROUPS, id), { signal });
}

/** Archive a community group: the soft-delete that works whatever its membership (BR-59q). */
export function archiveLearningGroup(id: string, signal?: AbortSignal): Promise<LearningGroupDto> {
  return adminPost<LearningGroupDto>(`${itemPath(GROUPS, id)}/archive`, {}, { signal });
}

// ── Review workflow (BR-59t) ────────────────────────────────────────────────

/** What the two review writes answer: the updated row of whichever resource was addressed. */
export type LearningReviewedContent = LearningArticleSummaryDto | LearningVideoDto | LearningTrainingDto | LearningGroupDto;

/** docs/openapi.yaml ReviewContentRequest: the decision, and an optional note up to 1000 characters. */
export interface ReviewLearningContentBody {
  status: 'APPROVED' | 'REJECTED';
  note?: string;
}

function contentPath(type: LearningContentType, id: string): string {
  return `/admin/learning/${type}/${encodeURIComponent(id)}`;
}

/**
 * Submit content for review (learning.admin.manage): review status becomes
 * PENDING_REVIEW. `isPublished` is not touched, and publishing is not blocked
 * by the review state (BR-59t).
 */
export function submitLearningForReview(
  type: LearningContentType,
  id: string,
  note?: string,
  signal?: AbortSignal,
): Promise<LearningReviewedContent> {
  return adminPost<LearningReviewedContent>(`${contentPath(type, id)}/submit-review`, note === undefined ? {} : { note }, { signal });
}

/**
 * Record a review decision (learning.content.review, Super Admin): APPROVED or
 * REJECTED, with the reviewer and timestamp the server stamps. Like the submit,
 * it never moves `isPublished` (BR-59t).
 */
export function reviewLearningContent(
  type: LearningContentType,
  id: string,
  body: ReviewLearningContentBody,
  signal?: AbortSignal,
): Promise<LearningReviewedContent> {
  return adminPost<LearningReviewedContent>(`${contentPath(type, id)}/review`, body, { signal });
}

// ── /admin/learning-hub (farmer.learning.manage) ────────────────────────────

/**
 * The articles list behind `farmer.learning.manage`. The server answers it from
 * the same handler as GET /admin/learning/articles — identical query, identical
 * body — so it is typed identically here.
 *
 * SPEC GAP: docs/openapi.yaml declares this response as a bare `type: object`
 * and documents no query parameters, while the route validates the admin
 * article query and returns LearningArticlesListResponse. The type below
 * follows the implementation; the spec should be tightened to match. Flagged,
 * not silently fixed, because openapi.yaml is a ground-truth file.
 */
export function listLearningHubArticles(params: ListLearningArticlesParams = {}, signal?: AbortSignal): Promise<LearningArticlesPage> {
  return adminGet<LearningArticlesPage>(
    HUB,
    { page: params.page, limit: params.limit, language: params.language, tag: params.tag, isPublished: params.isPublished, q: params.q },
    signal,
  );
}

/** One article behind `farmer.learning.manage`; same body as GET /admin/learning/articles/{id}. See the spec gap above. */
export function getLearningHubArticle(id: string, signal?: AbortSignal): Promise<LearningArticleDto> {
  return adminGet<LearningArticleDto>(itemPath(HUB, id), undefined, signal);
}
