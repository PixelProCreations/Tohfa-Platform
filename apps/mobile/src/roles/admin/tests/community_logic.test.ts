/**
 * Community & Knowledge READ screens: what the Learning Hub API (BR-59) can
 * answer and, mostly, what it cannot.
 *
 * The rule under test throughout: a value the API cannot supply renders an
 * em-dash and the designed element stays. The sharp edge is the sub-count — a
 * count derived from the loaded rows is only honest once every page is in, so
 * it must be the dash until then, never a partial number.
 */
import { describe, expect, it } from 'vitest';
import { countLoadedWhere } from '../api/hookHelpers';
import type {
  LearningArticleSummaryDto,
  LearningGroupDto,
  LearningTrainingDto,
  LearningVideoDto,
} from '../api/learning';
import { makeCan } from '../permissions/can';
import { ADMIN_NO_VALUE } from '../utils/noValue';
import {
  LEARNING_MANAGE,
  archiveStatus,
  articleDetailView,
  articleRow,
  canManageLearning,
  contentDetailView,
  groupLibraryRow,
  groupSortParam,
  groupSwatch,
  longMetaRows,
  publishAction,
  publishStatus,
  searchParam,
  shortMetaRows,
  subCountText,
  toGroupRow,
  sumTotalsText,
  totalText,
  totalWithActiveText,
  trainingRow,
  videoMetaRows,
  videoRow,
} from '../screens/community/communityLogic';

const DASH = ADMIN_NO_VALUE;

function article(over: Partial<LearningArticleSummaryDto> = {}): LearningArticleSummaryDto {
  return {
    id: 'art-1',
    title: 'Mulching for water retention',
    snippet: 'Keep the soil covered.',
    readTime: '4 min read',
    author: 'Demo TOHFA Admin',
    tag: 'Guide',
    language: 'en',
    isPublished: true,
    crops: [],
    createdAt: '2026-10-10T03:30:00.000Z',
    updatedAt: '2026-10-10T03:30:00.000Z',
    ...over,
  };
}

function video(over: Partial<LearningVideoDto> = {}): LearningVideoDto {
  return {
    id: 'vid-1',
    title: 'Organic practices',
    description: 'A demonstration of organic practices.',
    videoUrl: 'https://video.example.org/organic',
    duration: '6:10',
    author: 'Demo TOHFA Admin',
    language: 'en',
    isFeatured: false,
    isPublished: false,
    crops: [],
    createdAt: '2026-10-10T03:30:00.000Z',
    updatedAt: '2026-10-10T03:30:00.000Z',
    ...over,
  };
}

function training(over: Partial<LearningTrainingDto> = {}): LearningTrainingDto {
  return {
    id: 'trn-1',
    title: 'Composting workshop',
    trainingDate: '2026-11-01',
    startTime: '10:00',
    mode: 'IN_FIELD',
    location: 'Coonoor',
    instructor: 'Selvi',
    capacity: 20,
    enrolledCount: 4,
    language: 'en',
    isPublished: true,
    createdAt: '2026-10-10T03:30:00.000Z',
    updatedAt: '2026-10-10T03:30:00.000Z',
    ...over,
  };
}

function group(over: Partial<LearningGroupDto> = {}): LearningGroupDto {
  return {
    id: 'grp-1',
    name: 'Tomato Growers Circle',
    description: null,
    category: 'Crops',
    memberCount: 24,
    isArchived: false,
    archivedAt: null,
    createdAt: '2026-10-10T03:30:00.000Z',
    updatedAt: '2026-10-10T03:30:00.000Z',
    ...over,
  };
}

describe('access', () => {
  it('fails closed when there is no permission list at all', () => {
    expect(canManageLearning(undefined)).toBe(false);
  });

  it('reads the Learning Hub only with learning.admin.manage', () => {
    expect(canManageLearning(makeCan([]))).toBe(false);
    expect(canManageLearning(makeCan(['farmer.learning.manage']))).toBe(false);
    expect(canManageLearning(makeCan([LEARNING_MANAGE]))).toBe(true);
  });
});

describe('counts', () => {
  it("shows the server's total, and a dash before the first page arrives", () => {
    expect(totalText(8)).toBe('8');
    expect(totalText(0)).toBe('0');
    expect(totalText(undefined)).toBe(DASH);
  });

  it('sums server totals, but dashes the whole sum if any part has not loaded', () => {
    // Content items = articles + videos. Both totals known: a real figure.
    expect(sumTotalsText(8, 6)).toBe('14');
    expect(sumTotalsText(0, 0)).toBe('0');
    // One part missing would make the sum silently omit a resource, so it is
    // the dash rather than a total that understates what exists.
    expect(sumTotalsText(8, undefined)).toBe(DASH);
    expect(sumTotalsText(undefined, 6)).toBe(DASH);
    expect(sumTotalsText()).toBe(DASH);
  });

  it('BR-59n: a sub-count is a DASH while pages remain, never a partial number', () => {
    const loaded = [group({ id: 'a', isArchived: false }), group({ id: 'b', isArchived: false })];
    // Page one of a larger set: two active rows are loaded, the server says 8 exist.
    const partial = countLoadedWhere(loaded, (g) => g.isArchived === false, false);
    expect(partial).toBeNull();
    expect(subCountText(partial)).toBe(DASH);
    expect(totalWithActiveText(8, partial)).toBe(`8 (${DASH} active)`);
    expect(totalWithActiveText(8, partial)).not.toContain('2');
  });

  it('states the sub-count only once every page is loaded', () => {
    const loaded = [group({ id: 'a', isArchived: false }), group({ id: 'b', isArchived: true })];
    const complete = countLoadedWhere(loaded, (g) => g.isArchived === false, true);
    expect(complete).toBe(1);
    expect(totalWithActiveText(2, complete)).toBe('2 (1 active)');
  });

  it('dashes both halves when nothing has loaded', () => {
    expect(totalWithActiveText(undefined, null)).toBe(`${DASH} (${DASH} active)`);
  });
});

describe('status', () => {
  it('BR-59l: isPublished is the only state these resources have', () => {
    expect(publishStatus(true)).toBe('Published');
    expect(publishStatus(false)).toBe('Draft');
  });

  it('BR-59q: an absent isArchived is unknown, never false', () => {
    expect(archiveStatus(false)).toBe('Active');
    expect(archiveStatus(true)).toBe('Archived');
    expect(archiveStatus(undefined)).toBe('unknown');
  });

  it('BR-59l: a missing isPublished is unknown, never Draft', () => {
    expect(publishStatus(undefined)).toBe('unknown');
  });
});

describe('groups list', () => {
  it('maps memberCount and isArchived, and dashes the community it has no field for', () => {
    const row = toGroupRow(group(), 0);
    expect(row.name).toBe('Tomato Growers Circle');
    expect(row.membersText).toBe('24 farmers');
    expect(row.statusText).toBe('Active');
    expect(row.community).toBe(DASH);
    expect(row.subtitle).toBe(`${DASH} · 24 farmers`);
  });

  it('keeps the designed swatch cycle as decoration, not data', () => {
    expect(groupSwatch(0)).toBe('ochre');
    expect(groupSwatch(5)).toBe('ochre');
    expect(groupSwatch(1)).not.toBe(groupSwatch(0));
  });

  it('BR-59n: maps the design sort chips onto the documented sort values', () => {
    expect(groupSortParam('farmers')).toBe('members');
    expect(groupSortParam('alphabetical')).toBe('name');
  });

  it('BR-59n: does not send a search longer than the documented 80 characters', () => {
    expect(searchParam('  tomato ')).toBe('tomato');
    expect(searchParam('   ')).toBeUndefined();
    expect(searchParam('x'.repeat(81))).toBeUndefined();
    expect(searchParam('x'.repeat(80))).toHaveLength(80);
  });
});

describe('knowledge library rows', () => {
  it('keeps the crop and expert-verification slots as dashes rather than dropping them', () => {
    const row = articleRow(article());
    expect(row.typeBadge).toBe('Article');
    expect(row.statusText).toBe('Published');
    expect(row.subtitle).toBe(`Guide · ${DASH} · ${DASH} · English · Demo TOHFA Admin`);
  });

  it('renders a video duration verbatim and never parses it', () => {
    const row = videoRow(video({ duration: '6:10' }));
    expect(row.subtitle.startsWith('6:10 · ')).toBe(true);
    expect(row.statusText).toBe('Draft');
  });

  it('uses the training fields the spec has, and the instructor as free text', () => {
    const row = trainingRow(training());
    expect(row.typeBadge).toBe('Training');
    expect(row.subtitle).toContain('In field');
    expect(row.subtitle).toContain('Coonoor');
    expect(row.subtitle).toContain('Selvi');
  });

  it('dashes the author of a group, which records no creator', () => {
    const row = groupLibraryRow(group());
    expect(row.typeBadge).toBe('Group Post');
    expect(row.subtitle).toBe(`24 farmers · Crops · ${DASH}`);
  });

  it('never reads the farmer-perspective flags the admin mappers drop', () => {
    // isEnrolled / isJoined are absent from every admin read, and absent is
    // not false: nothing derived from them may appear in a row.
    const row = trainingRow(training());
    const groupRow = groupLibraryRow(group());
    expect('isEnrolled' in training()).toBe(false);
    expect('isJoined' in group()).toBe(false);
    expect(JSON.stringify(row)).not.toContain('Enrolled');
    expect(JSON.stringify(groupRow)).not.toContain('Joined');
  });
});

describe('content detail metadata', () => {
  it('keeps every designed row and dashes the nine with no field in the spec', () => {
    const rows = longMetaRows({ kind: 'video', dto: video() });
    const byKey = new Map(rows.map((r) => [r.labelKey, r.value]));
    expect(rows).toHaveLength(16);
    for (const key of [
      'community.meta.relatedCrops',
      'community.meta.farmingTypes',
      'community.meta.season',
      'community.meta.reviewer',
      'community.meta.expertVerification',
      'community.meta.published',
      'community.meta.expires',
      'community.meta.visibility',
    ] as const) {
      expect(byKey.get(key)).toBe(DASH);
    }
    // The rows that are real.
    expect(byKey.get('community.meta.contentId')).toBe('vid-1');
    expect(byKey.get('community.meta.language')).toBe('English');
    expect(byKey.get('community.meta.author')).toBe('Demo TOHFA Admin');
    expect(byKey.get('community.meta.featured')).toBe('No');
  });

  it('dashes "Featured" for anything that is not a video, which is the only resource with the flag', () => {
    const rows = shortMetaRows({ kind: 'article', dto: article() });
    expect(rows.find((r) => r.labelKey === 'community.meta.featured')?.value).toBe(DASH);
    expect(shortMetaRows({ kind: 'video', dto: video({ isFeatured: true }) }).at(-1)?.value).toBe('Yes');
  });

  /**
   * BR-59l: a row for a field the API does not SUPPLY keeps the dash; a row for
   * a concept the API does not HAVE is a field for a feature that does not
   * exist and is removed. Expiry and visibility appear nowhere in the Learning
   * Hub spec, so neither row survives; `isPublished` does, so the Published row
   * now answers with the real status instead of a permanent dash.
   */
  it('BR-59l: the short card drops Expires and Visibility and states the real published status', () => {
    const keys = shortMetaRows({ kind: 'article', dto: article() }).map((r) => r.labelKey);
    expect(keys).not.toContain('community.meta.expires');
    expect(keys).not.toContain('community.meta.visibility');
    expect(keys).toEqual(['community.meta.published', 'community.meta.reviewStatus', 'community.meta.featured']);

    const published = shortMetaRows({ kind: 'article', dto: article({ isPublished: true }) });
    expect(published[0]?.value).toBe('Published');
    const draft = shortMetaRows({ kind: 'article', dto: article({ isPublished: false }) });
    expect(draft[0]?.value).toBe('Draft');
    // Absent is not false: nothing loaded says nothing about the state.
    expect(shortMetaRows(undefined)[0]?.value).toBe(DASH);
  });

  it('shows a video URL and its free-text duration, and no longer names a source or a processing state', () => {
    const rows = videoMetaRows({ kind: 'video', dto: video() });
    const byKey = new Map(rows.map((r) => [r.labelKey, r.value]));
    expect(byKey.get('community.meta.fileOrLink')).toBe('https://video.example.org/organic');
    expect(byKey.get('community.meta.duration')).toBe('6:10');
    // A video is a URL: there is no upload pipeline to choose a source from or
    // to report progress on, so both rows are gone rather than dashed.
    expect(rows.map((r) => r.labelKey)).toEqual(['community.meta.fileOrLink', 'community.meta.duration']);
  });

  it('dashes the whole video card for a non-video', () => {
    expect(videoMetaRows({ kind: 'article', dto: article() }).every((r) => r.value === DASH)).toBe(true);
  });

  it('renders every value as a dash before anything is loaded', () => {
    const view = contentDetailView(undefined);
    expect(view.title).toBe(DASH);
    expect(view.description).toBe(DASH);
    expect(view.statusText).toBe(DASH);
    expect(view.metaRows.every((r) => r.value === DASH)).toBe(true);
  });

  it('BR-59m: fills a group detail from the group resource', () => {
    const view = contentDetailView({ kind: 'group', dto: group({ isArchived: true }) });
    expect(view.title).toBe('Tomato Growers Circle');
    expect(view.statusText).toBe('Archived');
  });

  it('BR-59m: keeps the snippet as the summary and the full content as the body', () => {
    const view = contentDetailView({
      kind: 'article',
      dto: { ...article({ snippet: 'Keep the soil covered.' }), content: 'The whole article, several paragraphs long.' },
    });
    expect(view.description).toBe('Keep the soil covered.');
    expect(view.body).toBe('The whole article, several paragraphs long.');
  });

  it('BR-59m: dashes the article body the detail response did not carry, and keeps the section', () => {
    expect(contentDetailView({ kind: 'article', dto: article() }).body).toBe(DASH);
  });

  it('has no body section for a resource with no body field', () => {
    expect(contentDetailView({ kind: 'video', dto: video() }).body).toBeNull();
    expect(contentDetailView({ kind: 'training', dto: training() }).body).toBeNull();
    expect(contentDetailView({ kind: 'group', dto: group() }).body).toBeNull();
  });

  it('drops the video card for a resource that has no video, and keeps it for a video', () => {
    expect(contentDetailView({ kind: 'article', dto: article() }).videoRows).toBeNull();
    expect(contentDetailView({ kind: 'training', dto: training() }).videoRows).toBeNull();
    expect(contentDetailView({ kind: 'group', dto: group() }).videoRows).toBeNull();
    expect(contentDetailView(undefined).videoRows).toBeNull();
    expect(contentDetailView({ kind: 'video', dto: video() }).videoRows).toHaveLength(2);
  });
});

describe('footer actions', () => {
  it('BR-59l: offers Publish for an unpublished item and Unpublish for a published one', () => {
    const draft = publishAction({ kind: 'video', dto: video({ isPublished: false }) });
    expect(draft.labelKey).toBe('community.action.publish');
    expect(draft.disabled).toBe(false);
    expect(draft.nextIsPublished).toBe(true);

    const live = publishAction({ kind: 'training', dto: training({ isPublished: true }) });
    expect(live.labelKey).toBe('community.action.unpublish');
    expect(live.disabled).toBe(false);
    expect(live.nextIsPublished).toBe(false);
  });

  it('disables the action when the published flag is absent rather than assuming false', () => {
    const unknown = publishAction({
      kind: 'article',
      dto: { ...article(), isPublished: undefined as unknown as boolean },
    });
    expect(unknown.disabled).toBe(true);
    expect(unknown.nextIsPublished).toBeNull();
    expect(unknown.noteKey).toBe('community.gap.publish.unknown');
  });

  it('disables the action before anything is loaded', () => {
    expect(publishAction(undefined).disabled).toBe(true);
    expect(publishAction(undefined).nextIsPublished).toBeNull();
  });

  it('BR-59q: a group has no published state, so the action is disabled and says so', () => {
    const action = publishAction({ kind: 'group', dto: group() });
    expect(action.disabled).toBe(true);
    expect(action.nextIsPublished).toBeNull();
    expect(action.noteKey).toBe('community.gap.publish.group');
  });

  // The designed Approval button used to be pinned disabled here because the API
  // had no review state. It has one now (BR-59t); the review button, and its
  // independence from publishing, are pinned in community_wiring_logic.test.ts.
});

describe('article details', () => {
  it('shows the stored read time verbatim and the created day as "Submitted"', () => {
    const view = articleDetailView(article());
    expect(view.readTime).toBe('4 min read');
    expect(view.title).toBe('Mulching for water retention');
    expect(view.submittedText).toContain('Oct 2026');
    expect(view.subtitle).toBe(`Guide · ${DASH} · English · Demo TOHFA Admin`);
  });

  it('dashes everything when there is no article to read', () => {
    const view = articleDetailView(undefined);
    expect(view.title).toBe(DASH);
    expect(view.readTime).toBe(DASH);
    expect(view.submittedText).toBe(DASH);
  });

  it('dashes a blank author rather than rendering an empty byline', () => {
    expect(articleDetailView(article({ author: '   ' })).subtitle).toContain(DASH);
  });
});
