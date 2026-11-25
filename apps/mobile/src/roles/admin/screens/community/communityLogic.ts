/**
 * Pure decisions for the Community & Knowledge READ screens. No React, so the
 * app's plain-Node vitest covers it (tests/community_logic.test.ts).
 *
 * What the Learning Hub API actually has (api/learning.ts, docs/openapi.yaml
 * tag "Learning Hub", BR-59) is four resources: articles, videos, trainings
 * and groups. Communities (api/communities.ts, BR-59s), the review workflow
 * (BR-59t, ./reviewLogic.ts) and Q&A (BR-59u, ./qaLogic.ts) have their own
 * modules. The designed screens show more than any of them supply, so this
 * module is mostly a record of which designed value the server can answer and
 * which it cannot:
 *
 *   - A community's per-community knowledge posts, announcements and "open"
 *     discussions have no count or link anywhere. Those elements are still
 *     drawn; every value in them is ADMIN_NO_VALUE.
 *   - There is NO author/creator identity. `author` and `instructor` are free
 *     text an admin typed into the form; the row carries no createdBy user, so
 *     every "published by" / "posted by" style field is a dash. The free-text
 *     author itself is real and is rendered as sent.
 *   - There are NO view, bookmark, comment, completion or engagement counts
 *     anywhere in the spec. Every one of them is a dash.
 *   - `readTime` ("4 min read") and `duration` ("6:10") are free-text strings.
 *     They are rendered verbatim and never parsed, compared or totalled.
 *   - `isJoined` / `isEnrolled` are mapped away by the admin handlers. They are
 *     absent, which is not the same as false, so nothing here reads them.
 *
 * Counts: a list answers `total` for the WHOLE filtered set, so `total` is
 * honest on the first page. Any count derived from the loaded rows (an "(N
 * active)" sub-count) must go through hookHelpers.countLoadedWhere, which is
 * null until every page is in, and null renders as the dash. A sub-count is
 * never guessed from a partial page.
 */
import type {
  CreateLearningArticleBody,
  CreateLearningGroupBody,
  CreateLearningVideoBody,
  LearningArticleSummaryDto,
  LearningCropRef,
  LearningGroupDto,
  LearningLanguage,
  LearningReviewStatus,
  LearningTrainingDto,
  LearningTrainingMode,
  LearningVideoDto,
  UpdateLearningArticleBody,
  UpdateLearningVideoBody,
} from '../../api/learning';
import { t, type TranslationKey } from '../../i18n';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { formatAdminDay } from '../../utils/datetime';

/** The permission behind every /admin/learning/* read (docs/rbac.json). */
export const LEARNING_MANAGE = 'learning.admin.manage';

/** Fails closed: no `can` means nothing is fetched and the screens say so. */
export function canManageLearning(can: ((code: string) => boolean) | undefined): boolean {
  return can === undefined ? false : can(LEARNING_MANAGE);
}

/** The separator the designed meta lines already use between fields. */
const META_SEPARATOR = ' · ';

/**
 * The permission behind GET /admin/crop-master, which feeds the "Related crops"
 * picker. It is NOT the learning permission: tagging content needs only
 * LEARNING_MANAGE (BR-59r), but browsing the crops to tag with needs this one.
 * Both go to the same two roles today; the picker must not assume it stays so.
 */
export const CROP_TAXONOMY_MANAGE = 'admin.crop_taxonomy.manage';

/**
 * A crop chip's label: the English name, then the Tamil name when there is one,
 * the same "English · Tamil" pairing the Crop Data screen draws. A crop with no
 * Tamil name shows the English name alone; the Tamil name is an addition to the
 * chip, not a designed element of its own, so nothing is fabricated for it.
 */
export function cropChipLabel(crop: LearningCropRef): string {
  return crop.nameTa !== null && crop.nameTa !== '' ? `${crop.name}${META_SEPARATOR}${crop.nameTa}` : crop.name;
}

/** The five states the crop picker can be in; each is drawn differently (see CropPicker). */
export type CropPickerState = 'denied' | 'loading' | 'error' | 'empty' | 'ready';

export interface CropPickerStateInput {
  /** Holds CROP_TAXONOMY_MANAGE, so the list was requested at all. */
  canBrowse: boolean;
  isPending: boolean;
  error: unknown;
  /** How many options the picker has to offer. */
  optionCount: number;
}

/**
 * Why the crop list is, or is not, on screen. Order matters: a request that was
 * never made (`denied`) is never "loading" and never "empty", and a failure is
 * never reported as an empty list.
 */
export function cropPickerState(input: CropPickerStateInput): CropPickerState {
  if (!input.canBrowse) return 'denied';
  if (input.error !== null && input.error !== undefined) return 'error';
  if (input.isPending) return 'loading';
  return input.optionCount === 0 ? 'empty' : 'ready';
}

/**
 * The crop list plus any crop the item is already tagged with that the list did
 * not return, so a tag can always be seen and removed. List order first, then
 * the extras; each id once.
 */
export function mergeCropOptions(listed: readonly LearningCropRef[], tagged: readonly LearningCropRef[]): LearningCropRef[] {
  const seen = new Set<string>();
  const merged: LearningCropRef[] = [];
  for (const crop of [...listed, ...tagged]) {
    if (seen.has(crop.id)) continue;
    seen.add(crop.id);
    merged.push({ id: crop.id, name: crop.name, nameTa: crop.nameTa });
  }
  return merged;
}

/** The dash every value the API cannot supply renders as. */
export function dash(): string {
  return ADMIN_NO_VALUE;
}

/** A string the server may not have sent; blank counts as absent. */
export function orDash(value: string | null | undefined): string {
  if (value === undefined || value === null) return ADMIN_NO_VALUE;
  const trimmed = value.trim();
  return trimmed === '' ? ADMIN_NO_VALUE : trimmed;
}

/** A server-reported `total`; undefined (nothing loaded yet) is the dash. */
export function totalText(total: number | undefined): string {
  return total === undefined ? ADMIN_NO_VALUE : String(total);
}

/**
 * Several server-reported totals added together. Every part must be loaded:
 * one undefined makes the sum a claim the screen cannot support, so the whole
 * thing is the dash rather than a total that silently omits a resource.
 */
export function sumTotalsText(...totals: readonly (number | undefined)[]): string {
  if (totals.length === 0 || totals.some((t) => t === undefined)) return ADMIN_NO_VALUE;
  return String(totals.reduce<number>((sum, t) => sum + (t ?? 0), 0));
}

/**
 * A count derived from the loaded rows. countLoadedWhere returns null while
 * pages remain, and that null is the whole point: a partial number would be a
 * claim the screen cannot support.
 */
export function subCountText(count: number | null | undefined): string {
  return count === undefined || count === null ? ADMIN_NO_VALUE : String(count);
}

/** The designed "8 (7 active)" tile value; either half may be the dash. */
export function totalWithActiveText(total: number | undefined, active: number | null): string {
  return t('community.value.withActive', { total: totalText(total), active: subCountText(active) });
}

/** A YYYY-MM-DD or instant as "1 Nov 2026"; absent or unreadable is the dash. */
export function dayText(iso: string | null | undefined): string {
  if (iso === undefined || iso === null || iso.trim() === '') return ADMIN_NO_VALUE;
  const text = formatAdminDay(iso);
  return text === '' ? ADMIN_NO_VALUE : text;
}

/** Joins the fields of a designed meta line, dashes included, never dropped. */
export function joinMeta(parts: readonly string[]): string {
  return parts.join(META_SEPARATOR);
}

export function languageLabel(language: LearningLanguage | undefined): string {
  if (language === undefined) return ADMIN_NO_VALUE;
  return t(`community.lang.${language}` as TranslationKey);
}

export function trainingModeLabel(mode: LearningTrainingMode | undefined): string {
  if (mode === undefined) return ADMIN_NO_VALUE;
  return t(`community.mode.${mode}` as TranslationKey);
}

// ─── Review status (BR-59t) ──────────────────────────────────────────────────

/** The review status the server sent for the opened item; undefined when it sent none. */
export function reviewStatusOf(content: ContentDto | undefined): LearningReviewStatus | undefined {
  return content === undefined ? undefined : content.dto.reviewStatus;
}

/**
 * The review status as the admin reads it. Absent is the dash, never
 * NOT_SUBMITTED: the server not having said is not the same as "not submitted".
 */
export function reviewStatusLabel(status: LearningReviewStatus | undefined): string {
  if (status === undefined) return ADMIN_NO_VALUE;
  return t(`community.review.status.${status}` as TranslationKey);
}

// ─── Status ──────────────────────────────────────────────────────────────────

/** The designed badge vocabulary. `unknown` draws the dash in the badge. */
export type CommunityStatus = 'Active' | 'Archived' | 'Published' | 'Draft' | 'unknown';

export function statusLabel(status: CommunityStatus): string {
  return status === 'unknown' ? ADMIN_NO_VALUE : t(`community.status.${status}` as TranslationKey);
}

/**
 * BR-59l: an admin list carries published and unpublished rows alike. This
 * badge is the PUBLISHED axis only. Review state (BR-59t) is a separate axis
 * with its own status (./reviewLogic.ts), so "Pending Review" is never folded
 * into this badge: a published item that is pending review is still Published.
 */
export function publishStatus(isPublished: boolean | undefined): CommunityStatus {
  if (isPublished === undefined) return 'unknown';
  return isPublished ? 'Published' : 'Draft';
}

/**
 * BR-59q: a group is archived rather than deleted once it has members.
 * `isArchived` is absent on a create response, and absent is not false.
 */
export function archiveStatus(isArchived: boolean | undefined): CommunityStatus {
  if (isArchived === undefined) return 'unknown';
  return isArchived ? 'Archived' : 'Active';
}

// ─── Groups list (GET /admin/learning/groups) ────────────────────────────────

/** The five swatch colours the design cycles through; decoration, not data. */
export const GROUP_SWATCHES = ['ochre', 'sage', 'purple', 'brand', 'info'] as const;
export type GroupSwatch = (typeof GROUP_SWATCHES)[number];

export function groupSwatch(index: number): GroupSwatch {
  const swatch = GROUP_SWATCHES[((index % GROUP_SWATCHES.length) + GROUP_SWATCHES.length) % GROUP_SWATCHES.length];
  return swatch ?? 'ochre';
}

export interface GroupRowView {
  id: string;
  name: string;
  /**
   * The design puts the owning community's NAME here. A group row carries only
   * the parent's `communityId`, no name, so the row itself shows the dash and
   * a screen that has the community list can resolve the name (BR-59s).
   */
  community: string;
  /** The parent community's id, or null for a group that belongs to none. */
  communityId: string | null;
  membersText: string;
  status: CommunityStatus;
  statusText: string;
  swatch: GroupSwatch;
  /** "<community> · N farmers", the designed subtitle, dash included. */
  subtitle: string;
}

export function toGroupRow(dto: LearningGroupDto, index: number): GroupRowView {
  const status = archiveStatus(dto.isArchived);
  const membersText = t('community.groups.members', { count: String(dto.memberCount) });
  return {
    id: dto.id,
    name: orDash(dto.name),
    community: ADMIN_NO_VALUE,
    communityId: dto.communityId ?? null,
    membersText,
    status,
    statusText: statusLabel(status),
    swatch: groupSwatch(index),
    subtitle: joinMeta([ADMIN_NO_VALUE, membersText]),
  };
}

/** The group `sort` the design's two sort chips map onto (BR-59n). */
export function groupSortParam(sortBy: 'farmers' | 'alphabetical'): 'members' | 'name' {
  return sortBy === 'farmers' ? 'members' : 'name';
}

/** The API takes `q` up to 80 characters; longer is a 422, so it is not sent. */
export function searchParam(query: string): string | undefined {
  const trimmed = query.trim();
  if (trimmed === '' || trimmed.length > 80) return undefined;
  return trimmed;
}

/** The archived/active chip has no server filter, so it narrows loaded rows. */
export function matchesStatusFilter(status: CommunityStatus, filter: 'All' | 'Active' | 'Archived'): boolean {
  if (filter === 'All') return true;
  return status === filter;
}

// ─── Knowledge library ───────────────────────────────────────────────────────

/** Which of the four resources a library row came from. */
export type ContentKind = 'article' | 'video' | 'training' | 'group';

export type LibraryTypeBadge = 'Article' | 'Video' | 'Training' | 'Group Post';

const TYPE_BADGE: Record<ContentKind, LibraryTypeBadge> = {
  article: 'Article',
  video: 'Video',
  training: 'Training',
  group: 'Group Post',
};

export function typeBadgeOf(kind: ContentKind): LibraryTypeBadge {
  return TYPE_BADGE[kind];
}

/** The in-module screens an item's Edit can open. */
export type EditRoute = 'create_content' | 'add_video' | 'create_group';

/**
 * Which form edits an opened item, or null when no form can. The article and
 * video forms PATCH their own resource and the group form PATCHes the group;
 * there is no training form in the designed screens, so a training has no Edit
 * rather than an Edit that opens someone else's (empty) form. Edit used to open
 * a blank article form for every kind, and Publish there created a duplicate.
 */
export function editRouteOf(kind: ContentKind | undefined): EditRoute | null {
  if (kind === 'article') return 'create_content';
  if (kind === 'video') return 'add_video';
  if (kind === 'group') return 'create_group';
  return null;
}

export interface LibraryRowView {
  id: string;
  kind: ContentKind;
  title: string;
  typeBadge: LibraryTypeBadge;
  status: CommunityStatus;
  statusText: string;
  /** BR-59t; undefined when the server sent none. Drives where a row opens, never the Published badge. */
  reviewStatus: LearningReviewStatus | undefined;
  /**
   * The designed five-field meta line. Its "crop" and "expert verification"
   * slots have no field in the spec at all, so they are always the dash; the
   * slots stay because removing a designed field to hide a gap is the habit
   * this codebase is trying to break.
   */
  subtitle: string;
}

export function articleRow(dto: LearningArticleSummaryDto): LibraryRowView {
  const status = publishStatus(dto.isPublished);
  return {
    id: dto.id,
    kind: 'article',
    title: orDash(dto.title),
    typeBadge: 'Article',
    status,
    statusText: statusLabel(status),
    reviewStatus: dto.reviewStatus,
    // tag · crop (none) · expert verification (none) · language · author
    subtitle: joinMeta([orDash(dto.tag), ADMIN_NO_VALUE, ADMIN_NO_VALUE, languageLabel(dto.language), orDash(dto.author)]),
  };
}

export function videoRow(dto: LearningVideoDto): LibraryRowView {
  const status = publishStatus(dto.isPublished);
  return {
    id: dto.id,
    kind: 'video',
    title: orDash(dto.title),
    typeBadge: 'Video',
    status,
    statusText: statusLabel(status),
    reviewStatus: dto.reviewStatus,
    // duration (verbatim) · crop (none) · expert verification (none) · language · author
    subtitle: joinMeta([orDash(dto.duration), ADMIN_NO_VALUE, ADMIN_NO_VALUE, languageLabel(dto.language), orDash(dto.author)]),
  };
}

export function trainingRow(dto: LearningTrainingDto): LibraryRowView {
  const status = publishStatus(dto.isPublished);
  return {
    id: dto.id,
    kind: 'training',
    title: orDash(dto.title),
    typeBadge: 'Training',
    status,
    statusText: statusLabel(status),
    reviewStatus: dto.reviewStatus,
    // mode · location · date · language · instructor
    subtitle: joinMeta([
      trainingModeLabel(dto.mode),
      orDash(dto.location),
      dayText(dto.trainingDate),
      languageLabel(dto.language),
      orDash(dto.instructor),
    ]),
  };
}

export function groupLibraryRow(dto: LearningGroupDto): LibraryRowView {
  const status = archiveStatus(dto.isArchived);
  return {
    id: dto.id,
    kind: 'group',
    title: orDash(dto.name),
    typeBadge: 'Group Post',
    status,
    statusText: statusLabel(status),
    reviewStatus: dto.reviewStatus,
    // members · category · author (none: a group has no creator field)
    subtitle: joinMeta([t('community.groups.members', { count: String(dto.memberCount) }), orDash(dto.category), ADMIN_NO_VALUE]),
  };
}

// ─── Content detail (the metadata cards) ─────────────────────────────────────

export interface MetaRow {
  /** i18n key of the designed row label. */
  labelKey: TranslationKey;
  value: string;
}

export interface ContentDetailView {
  title: string;
  status: CommunityStatus;
  statusText: string;
  typeBadge: LibraryTypeBadge;
  /** The designed subtitle under the title. */
  subtitle: string;
  description: string;
  /**
   * The full article body (BR-59m), which only the article DETAIL response
   * carries. `null` means the opened resource has no body field at all — a
   * video, training or group is not an article with a missing body — and the
   * section is not drawn. A loaded article with no `content` is the dash.
   */
  body: string | null;
  /** The long metadata card (ContentPendingReviewScreen). */
  metaRows: MetaRow[];
  /** The short metadata card (ContentItemDetailScreen). */
  shortMetaRows: MetaRow[];
  /**
   * The Video card, or `null` when the opened resource is not a video. A video
   * field on an article is not an unanswered field, it is not a field at all,
   * so the card is absent rather than four dashes.
   */
  videoRows: MetaRow[] | null;
  /** "13 Oct 2026" for the created row; the actor beside it is always a dash. */
  createdText: string;
}

export type ContentDto =
  | { kind: 'article'; dto: LearningArticleSummaryDto & { content?: string } }
  | { kind: 'video'; dto: LearningVideoDto }
  | { kind: 'training'; dto: LearningTrainingDto }
  | { kind: 'group'; dto: LearningGroupDto };

function contentTypeLabel(kind: ContentKind): string {
  return t(`community.type.${kind}` as TranslationKey);
}

/**
 * The designed metadata cards, filled from whichever of the four resources was
 * opened. The rows that have no field anywhere in docs/openapi.yaml — reviewer,
 * expert verification, related crops, farming types, season, published-on,
 * expiry, visibility, version — are kept and dashed.
 */
export function contentDetailView(content: ContentDto | undefined): ContentDetailView {
  const empty: ContentDetailView = {
    title: ADMIN_NO_VALUE,
    status: 'unknown',
    statusText: ADMIN_NO_VALUE,
    typeBadge: 'Article',
    subtitle: ADMIN_NO_VALUE,
    description: ADMIN_NO_VALUE,
    body: null,
    metaRows: longMetaRows(undefined),
    shortMetaRows: shortMetaRows(undefined),
    videoRows: null,
    createdText: ADMIN_NO_VALUE,
  };
  if (content === undefined) return empty;

  if (content.kind === 'article') {
    const dto = content.dto;
    const status = publishStatus(dto.isPublished);
    return {
      title: orDash(dto.title),
      status,
      statusText: statusLabel(status),
      typeBadge: 'Article',
      // tag · crop (none) · language · author
      subtitle: joinMeta([orDash(dto.tag), ADMIN_NO_VALUE, languageLabel(dto.language), orDash(dto.author)]),
      // The snippet is the summary line; the body below it is the article
      // itself (BR-59m). Showing only the snippet left the article unreadable.
      description: orDash(dto.snippet ?? dto.content ?? null),
      body: orDash(dto.content ?? null),
      metaRows: longMetaRows(content),
      shortMetaRows: shortMetaRows(content),
      videoRows: null,
      createdText: dayText(dto.createdAt),
    };
  }

  if (content.kind === 'video') {
    const dto = content.dto;
    const status = publishStatus(dto.isPublished);
    return {
      title: orDash(dto.title),
      status,
      statusText: statusLabel(status),
      typeBadge: 'Video',
      subtitle: joinMeta([orDash(dto.duration), ADMIN_NO_VALUE, languageLabel(dto.language), orDash(dto.author)]),
      description: orDash(dto.description ?? null),
      body: null,
      metaRows: longMetaRows(content),
      shortMetaRows: shortMetaRows(content),
      videoRows: videoMetaRows(content),
      createdText: dayText(dto.createdAt),
    };
  }

  if (content.kind === 'training') {
    const dto = content.dto;
    const status = publishStatus(dto.isPublished);
    return {
      title: orDash(dto.title),
      status,
      statusText: statusLabel(status),
      typeBadge: 'Training',
      subtitle: joinMeta([trainingModeLabel(dto.mode), orDash(dto.location), languageLabel(dto.language), orDash(dto.instructor)]),
      description: orDash(dto.description ?? null),
      body: null,
      metaRows: longMetaRows(content),
      shortMetaRows: shortMetaRows(content),
      videoRows: null,
      createdText: dayText(dto.createdAt),
    };
  }

  const dto = content.dto;
  const status = archiveStatus(dto.isArchived);
  return {
    title: orDash(dto.name),
    status,
    statusText: statusLabel(status),
    typeBadge: 'Group Post',
    subtitle: joinMeta([orDash(dto.category), t('community.groups.members', { count: String(dto.memberCount) }), ADMIN_NO_VALUE]),
    description: orDash(dto.description ?? null),
    body: null,
    metaRows: longMetaRows(content),
    shortMetaRows: shortMetaRows(content),
    videoRows: null,
    createdText: dayText(dto.createdAt),
  };
}

function idOf(content: ContentDto | undefined): string {
  if (content === undefined) return ADMIN_NO_VALUE;
  return orDash(content.dto.id);
}

function languageOf(content: ContentDto | undefined): string {
  if (content === undefined) return ADMIN_NO_VALUE;
  if (content.kind === 'group') return ADMIN_NO_VALUE;
  return languageLabel(content.dto.language);
}

function authorOf(content: ContentDto | undefined): string {
  if (content === undefined) return ADMIN_NO_VALUE;
  if (content.kind === 'article' || content.kind === 'video') return orDash(content.dto.author);
  if (content.kind === 'training') return orDash(content.dto.instructor);
  return ADMIN_NO_VALUE;
}

function categoryOf(content: ContentDto | undefined): string {
  if (content === undefined) return ADMIN_NO_VALUE;
  if (content.kind === 'article') return orDash(content.dto.tag);
  if (content.kind === 'group') return orDash(content.dto.category);
  return ADMIN_NO_VALUE;
}

function featuredOf(content: ContentDto | undefined): string {
  if (content === undefined || content.kind !== 'video') return ADMIN_NO_VALUE;
  return t(content.dto.isFeatured ? 'community.yes' : 'community.no');
}

function statusTextOf(content: ContentDto | undefined): string {
  if (content === undefined) return ADMIN_NO_VALUE;
  if (content.kind === 'group') return statusLabel(archiveStatus(content.dto.isArchived));
  return statusLabel(publishStatus(content.dto.isPublished));
}

/**
 * The long card of ContentPendingReviewScreen. Nine of its rows name a
 * concept the Learning Hub spec does not have; they stay, dashed.
 */
export function longMetaRows(content: ContentDto | undefined): MetaRow[] {
  return [
    // No version counter exists on any learning resource, so the id stands alone.
    { labelKey: 'community.meta.contentId', value: idOf(content) },
    { labelKey: 'community.meta.type', value: content === undefined ? ADMIN_NO_VALUE : contentTypeLabel(content.kind) },
    { labelKey: 'community.meta.status', value: statusTextOf(content) },
    // BR-59t: its own row, because it is its own axis — an item can be Published and Pending review.
    { labelKey: 'community.meta.reviewStatus', value: reviewStatusLabel(reviewStatusOf(content)) },
    { labelKey: 'community.meta.category', value: categoryOf(content) },
    { labelKey: 'community.meta.relatedCrops', value: ADMIN_NO_VALUE },
    { labelKey: 'community.meta.farmingTypes', value: ADMIN_NO_VALUE },
    { labelKey: 'community.meta.season', value: ADMIN_NO_VALUE },
    { labelKey: 'community.meta.language', value: languageOf(content) },
    // Free text the admin typed, not an account; there is no createdBy user.
    { labelKey: 'community.meta.author', value: authorOf(content) },
    // `reviewedBy` is a user id with no name beside it, so the reviewer stays the dash.
    { labelKey: 'community.meta.reviewer', value: ADMIN_NO_VALUE },
    { labelKey: 'community.meta.expertVerification', value: ADMIN_NO_VALUE },
    // isPublished is a flag, not a date: there is no publishedAt anywhere.
    { labelKey: 'community.meta.published', value: ADMIN_NO_VALUE },
    { labelKey: 'community.meta.expires', value: ADMIN_NO_VALUE },
    { labelKey: 'community.meta.visibility', value: ADMIN_NO_VALUE },
    { labelKey: 'community.meta.featured', value: featuredOf(content) },
  ];
}

/**
 * The short card at the top of ContentItemDetailScreen.
 *
 * Two of the four designed rows have gone, and the rule behind that is worth
 * stating once: a row whose field the API does not SUPPLY stays and carries the
 * dash; a row naming a concept the API does not HAVE is not a gap, it is a
 * field for a feature that does not exist, and it is removed.
 *
 *   - Expires: the Learning Hub has no expiry on any resource. Removed.
 *   - Visibility: there is no visibility or audience field either. Removed.
 *   - Published: the designed row wanted a date, and there is no `publishedAt`
 *     anywhere — but `isPublished` is real (BR-59l), so the row shows the
 *     status it can actually answer instead of a permanent dash.
 *   - Featured: real for a video (`isFeatured`); a dash on the other kinds,
 *     where the flag genuinely does not exist.
 */
export function shortMetaRows(content: ContentDto | undefined): MetaRow[] {
  return [
    { labelKey: 'community.meta.published', value: statusTextOf(content) },
    { labelKey: 'community.meta.reviewStatus', value: reviewStatusLabel(reviewStatusOf(content)) },
    { labelKey: 'community.meta.featured', value: featuredOf(content) },
  ];
}

/**
 * The Video card. `duration` is free text and is shown exactly as stored —
 * never parsed into minutes and seconds.
 *
 * "Source" and "Processing" have gone with the same rule: a video in this API
 * is a `videoUrl` and nothing else. There is no upload pipeline, so there is no
 * source to choose between and no processing state to report — those rows named
 * a feature that does not exist rather than a value the server withheld.
 */
export function videoMetaRows(content: ContentDto | undefined): MetaRow[] {
  const isVideo = content !== undefined && content.kind === 'video';
  return [
    { labelKey: 'community.meta.fileOrLink', value: isVideo && content.kind === 'video' ? orDash(content.dto.videoUrl) : ADMIN_NO_VALUE },
    { labelKey: 'community.meta.duration', value: isVideo && content.kind === 'video' ? orDash(content.dto.duration) : ADMIN_NO_VALUE },
  ];
}

// ─── The footer actions ──────────────────────────────────────────────────────

/**
 * What the footer's publish button may do, decided from the loaded item alone.
 *
 * `isPublished` is the only state articles, videos and trainings have
 * (BR-59l), and PATCH /admin/learning/{resource}/{id} is the only way to move
 * it (BR-59d). Three facts this encodes:
 *
 *   - absent is not false. A row whose `isPublished` the server did not send
 *     leaves the action disabled; publishing on a guess would be a write made
 *     on an unknown state.
 *   - a group has no published state at all. LearningGroup carries
 *     `isArchived`, and UpdateLearningGroupRequest has neither field — the
 *     only transition is POST .../archive, which is not "publish". So the
 *     button is disabled for a group and says why.
 *   - the label follows the state: an already-published item's action is
 *     Unpublish, never a second Publish that claims to do something.
 */
export interface PublishAction {
  /** i18n key of the button label. */
  labelKey: TranslationKey;
  /** True when nothing can be sent; the button stays, drawn unavailable. */
  disabled: boolean;
  /** Why it cannot be sent; null when it can. */
  noteKey: TranslationKey | null;
  /** The value `isPublished` would be PATCHed to; null when disabled. */
  nextIsPublished: boolean | null;
}

export const APPROVAL_ACTION: PublishAction = {
  labelKey: 'community.action.approval',
  disabled: true,
  noteKey: 'community.gap.approval.note',
  nextIsPublished: null,
};

export function publishAction(content: ContentDto | undefined): PublishAction {
  const blocked = (noteKey: TranslationKey): PublishAction => ({
    labelKey: 'community.action.publish',
    disabled: true,
    noteKey,
    nextIsPublished: null,
  });

  if (content === undefined) return blocked('community.gap.publish.unknown');
  if (content.kind === 'group') return blocked('community.gap.publish.group');

  const isPublished = content.dto.isPublished;
  if (isPublished === undefined) return blocked('community.gap.publish.unknown');

  return {
    labelKey: isPublished ? 'community.action.unpublish' : 'community.action.publish',
    disabled: false,
    noteKey: null,
    nextIsPublished: !isPublished,
  };
}

// ─── Article details ─────────────────────────────────────────────────────────

export interface ArticleDetailView {
  title: string;
  status: CommunityStatus;
  statusText: string;
  subtitle: string;
  /** "Submitted <day>", from createdAt. */
  submittedText: string;
  readTime: string;
}

export function articleDetailView(dto: (LearningArticleSummaryDto & { content?: string }) | undefined): ArticleDetailView {
  if (dto === undefined) {
    return {
      title: ADMIN_NO_VALUE,
      status: 'unknown',
      statusText: ADMIN_NO_VALUE,
      subtitle: ADMIN_NO_VALUE,
      submittedText: ADMIN_NO_VALUE,
      readTime: ADMIN_NO_VALUE,
    };
  }
  const status = publishStatus(dto.isPublished);
  return {
    title: orDash(dto.title),
    status,
    statusText: statusLabel(status),
    // tag · crop (none) · language · author
    subtitle: joinMeta([orDash(dto.tag), ADMIN_NO_VALUE, languageLabel(dto.language), orDash(dto.author)]),
    submittedText: t('community.article.submitted', { day: dayText(dto.createdAt) }),
    // Free text, rendered as stored.
    readTime: orDash(dto.readTime),
  };
}

// ─── Write bodies ────────────────────────────────────────────────────────────

/**
 * What a form build either gives the mutation or the reason it cannot. The
 * reason is an i18n key, never English: the screen prints it and sends nothing.
 */
export type BuiltBody<T> = { ok: true; body: T } | { ok: false; errorKey: TranslationKey };

const BAD = (errorKey: TranslationKey): { ok: false; errorKey: TranslationKey } => ({ ok: false, errorKey });

/** The app language a designed dropdown label stands for; anything else is not chosen. */
export function languageCode(label: string): LearningLanguage | undefined {
  if (label === 'English') return 'en';
  if (label === 'Tamil') return 'ta';
  return undefined;
}

/** Why a designed dropdown still says "Select": it is empty, not a value. */
function chosen(value: string): string {
  return value === 'Select' ? '' : value.trim();
}

/** The designed language dropdown label for a stored code; the inverse of languageCode. */
export function languageFormLabel(language: LearningLanguage | undefined): string {
  if (language === 'en') return 'English';
  if (language === 'ta') return 'Tamil';
  return 'Select';
}

export interface ArticleFormInput {
  title: string;
  summary: string;
  body: string;
  category: string;
  readTime: string;
  /** The signed-in administrator's name; undefined until it has loaded. */
  author: string | undefined;
  /**
   * BR-59r. Undefined means "send no cropIds" (on an update: leave the tags
   * alone); an array, even an empty one, is the complete set to store.
   */
  cropIds?: readonly string[] | undefined;
}

/** The `cropIds` fragment of a request body: absent unless the form chose to send it. */
function cropIdsField(cropIds: readonly string[] | undefined): { cropIds?: string[] } {
  return cropIds === undefined ? {} : { cropIds: [...new Set(cropIds)] };
}

/**
 * CreateLearningArticleRequest (BR-59d). The bounds are the spec's own; a form
 * that sends past them gets a 422 it could have explained itself. `isPublished`
 * is always true: the only save the designed footer still offers is Publish,
 * because "submitted for review" has no state to land in.
 */
export function buildArticleBody(input: ArticleFormInput): BuiltBody<CreateLearningArticleBody> {
  const title = input.title.trim();
  const category = chosen(input.category);
  const body = input.body.trim();
  const readTime = input.readTime.trim();
  if (title === '' || title.length > 200) return BAD('community.validation.title');
  if (category === '') return BAD('community.validation.category');
  if (body === '' || body.length > 20000) return BAD('community.validation.body');
  if (readTime === '' || readTime.length > 20) return BAD('community.validation.readTime');
  if (input.author === undefined) return BAD('community.gap.author.unknown');
  const summary = input.summary.trim();
  return {
    ok: true,
    body: {
      title,
      content: body,
      snippet: summary === '' ? null : summary.slice(0, 300),
      readTime,
      author: input.author.slice(0, 120),
      tag: category.slice(0, 80),
      isPublished: true,
      ...cropIdsField(input.cropIds),
    },
  };
}

/**
 * UpdateLearningArticleRequest, built from the same form and the same bounds as
 * a create. `isPublished` is dropped: an edit changes the words, and moving the
 * item between draft and published is the Publish / Unpublish action's job. The
 * author is the item's stored author (the caller passes it), not the editor.
 */
export function buildArticleUpdateBody(input: ArticleFormInput): BuiltBody<UpdateLearningArticleBody> {
  const built = buildArticleBody(input);
  if (!built.ok) return built;
  const body: UpdateLearningArticleBody = { ...built.body };
  delete body.isPublished;
  return { ok: true, body };
}

export interface VideoFormInput {
  title: string;
  description: string;
  videoUrl: string;
  duration: string;
  language: string;
  author: string | undefined;
  /** As ArticleFormInput.cropIds (BR-59r). */
  cropIds?: readonly string[] | undefined;
}

/** True for an absolute https:// URL, the only link the server accepts (BR-59j). */
export function isHttpsUrl(value: string): boolean {
  if (!/^https:\/\/[^\s]+$/i.test(value)) return false;
  return value.length <= 2048;
}

/** CreateLearningVideoRequest (BR-59d, BR-59j). */
export function buildVideoBody(input: VideoFormInput): BuiltBody<CreateLearningVideoBody> {
  const title = input.title.trim();
  const videoUrl = input.videoUrl.trim();
  const duration = input.duration.trim();
  const language = languageCode(input.language);
  if (title === '' || title.length > 200) return BAD('community.validation.title');
  if (language === undefined) return BAD('community.validation.language');
  if (!isHttpsUrl(videoUrl)) return BAD('community.validation.videoUrl');
  if (duration === '' || duration.length > 20) return BAD('community.validation.duration');
  if (input.author === undefined) return BAD('community.gap.author.unknown');
  const description = input.description.trim();
  return {
    ok: true,
    body: {
      title,
      description: description === '' ? null : description.slice(0, 2000),
      videoUrl,
      duration,
      author: input.author.slice(0, 120),
      language,
      isPublished: true,
      ...cropIdsField(input.cropIds),
    },
  };
}

/** UpdateLearningVideoRequest; as buildArticleUpdateBody, `isPublished` is left alone. */
export function buildVideoUpdateBody(input: VideoFormInput): BuiltBody<UpdateLearningVideoBody> {
  const built = buildVideoBody(input);
  if (!built.ok) return built;
  const body: UpdateLearningVideoBody = { ...built.body };
  delete body.isPublished;
  return { ok: true, body };
}

export interface GroupFormInput {
  name: string;
  description: string;
  category: string;
  /**
   * BR-59s: the parent community. Undefined means "send no communityId" (leave
   * it alone on an update); null is "no community" and clears it; an id files
   * the group under that community.
   */
  communityId?: string | null | undefined;
}

/** CreateLearningGroupRequest / UpdateLearningGroupRequest (BR-59d, BR-59s). */
export function buildGroupBody(input: GroupFormInput): BuiltBody<CreateLearningGroupBody> {
  const name = input.name.trim();
  const description = input.description.trim();
  const category = chosen(input.category);
  if (name === '' || name.length > 120) return BAD('community.validation.groupName');
  if (description === '') return BAD('community.validation.groupDescription');
  if (category === '') return BAD('community.validation.groupCategory');
  return {
    ok: true,
    body: {
      name,
      description,
      category: category.slice(0, 80),
      ...(input.communityId === undefined ? {} : { communityId: input.communityId }),
    },
  };
}
