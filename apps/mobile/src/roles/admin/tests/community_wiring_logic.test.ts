/**
 * The pure decisions behind the Community & Knowledge screens that were wired
 * once their backends existed: communities (BR-59s), the content review
 * workflow (BR-59t), Q&A (BR-59u) and announcements (BR-213). Plain Node, no
 * React; the screens themselves are rendered in community_wiring_screens.test.tsx.
 */
import { describe, expect, it } from 'vitest';
import type { CommunityDto, CommunityMemberDto } from '../api/communities';
import type { LearningArticleDto, LearningReviewStatus } from '../api/learning';
import type { QaQuestionDetailDto } from '../api/qa';
import { makeCan } from '../permissions/can';
import { en } from '../i18n';
import { ADMIN_NO_VALUE } from '../utils/noValue';
import { publishAction, type ContentDto } from '../screens/community/communityLogic';
import {
  LEARNING_REVIEW,
  canReviewLearning,
  contentTypeOf,
  reviewAction,
  reviewStatusLabel,
} from '../screens/community/reviewLogic';
import {
  buildCommunityBody,
  communityCountText,
  communityDetailView,
  communityOptions,
  communityRow,
  memberRow,
} from '../screens/community/communitiesLogic';
import { COMMUNITY_MODERATE, buildAnswerBody, canModerate, canSendAnswer, qaThreadView, threadSubtitle } from '../screens/community/qaLogic';
import {
  ANNOUNCEMENT_AUDIENCES,
  announcementTypeFor,
  buildAnnouncementBody,
  canPublishAnnouncement,
} from '../screens/community/announcementLogic';

const DASH = ADMIN_NO_VALUE;
const ID = '6f0c6a53-9d1e-4f6e-8a55-1f6b2d0f5a11';

function article(over: Partial<LearningArticleDto> = {}): ContentDto {
  return {
    kind: 'article',
    dto: {
      id: 'a1',
      title: 'Mulching',
      snippet: null,
      content: 'Body',
      readTime: '4 min',
      author: 'A',
      tag: 'Guide',
      language: 'en',
      isPublished: false,
      reviewStatus: 'NOT_SUBMITTED',
      crops: [],
      createdAt: '2026-10-10T03:30:00.000Z',
      updatedAt: '2026-10-10T03:30:00.000Z',
      ...over,
    },
  };
}

function community(over: Partial<CommunityDto> = {}): CommunityDto {
  return {
    id: ID,
    name: 'Nilgiris Tea Growers',
    description: 'Tea',
    category: 'Regional Farmer Communities',
    rules: null,
    isArchived: false,
    archivedAt: null,
    groupCount: 3,
    memberCount: 41,
    createdBy: null,
    createdAt: '2026-10-10T03:30:00.000Z',
    updatedAt: '2026-10-10T03:30:00.000Z',
    ...over,
  };
}

describe('review workflow (BR-59t)', () => {
  const manage = makeCan(['learning.admin.manage']);
  const reviewer = makeCan(['learning.admin.manage', LEARNING_REVIEW]);

  it('BR-59t: only a holder of learning.content.review can decide', () => {
    expect(canReviewLearning(reviewer)).toBe(true);
    expect(canReviewLearning(manage)).toBe(false);
    expect(canReviewLearning(undefined)).toBe(false);
  });

  it('BR-59t: unsubmitted or rejected content offers Submit for review to a manager', () => {
    for (const status of ['NOT_SUBMITTED', 'REJECTED'] as LearningReviewStatus[]) {
      const action = reviewAction(article({ reviewStatus: status }), manage);
      expect(action).toMatchObject({ kind: 'submit', disabled: false, labelKey: 'community.action.submitReview' });
    }
  });

  it('BR-59t: pending content offers the decision to a reviewer, and is only a status to anyone else', () => {
    expect(reviewAction(article({ reviewStatus: 'PENDING_REVIEW' }), reviewer)).toMatchObject({ kind: 'decide', disabled: false });
    expect(reviewAction(article({ reviewStatus: 'PENDING_REVIEW' }), manage)).toMatchObject({
      kind: 'none',
      disabled: true,
      labelKey: 'community.review.status.PENDING_REVIEW',
    });
  });

  it('BR-59t: approved content has nothing left to send', () => {
    expect(reviewAction(article({ reviewStatus: 'APPROVED' }), reviewer)).toMatchObject({ kind: 'none', disabled: true });
  });

  it('BR-59t: a missing item, a missing status or a missing permission sends nothing', () => {
    expect(reviewAction(undefined, reviewer).disabled).toBe(true);
    const { reviewStatus: _omit, ...rest } = (article().dto as LearningArticleDto);
    expect(reviewAction({ kind: 'article', dto: rest as LearningArticleDto }, reviewer).disabled).toBe(true);
    expect(reviewAction(article({ reviewStatus: 'NOT_SUBMITTED' }), undefined).disabled).toBe(true);
    expect(reviewAction(article({ reviewStatus: 'NOT_SUBMITTED' }), makeCan([])).disabled).toBe(true);
  });

  it('BR-59t: review state and published state are independent axes — neither decision reads the other', () => {
    for (const isPublished of [true, false]) {
      // Whatever the published flag, the review action is the same...
      expect(reviewAction(article({ isPublished, reviewStatus: 'PENDING_REVIEW' }), reviewer)).toMatchObject({ kind: 'decide', disabled: false });
      expect(reviewAction(article({ isPublished, reviewStatus: 'NOT_SUBMITTED' }), manage)).toMatchObject({ kind: 'submit', disabled: false });
    }
    // ...and whatever the review status, publishing is neither blocked nor relabelled.
    for (const reviewStatus of ['NOT_SUBMITTED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED'] as LearningReviewStatus[]) {
      expect(publishAction(article({ isPublished: false, reviewStatus }))).toMatchObject({
        disabled: false,
        labelKey: 'community.action.publish',
        nextIsPublished: true,
      });
      expect(publishAction(article({ isPublished: true, reviewStatus }))).toMatchObject({
        disabled: false,
        labelKey: 'community.action.unpublish',
        nextIsPublished: false,
      });
    }
  });

  it('BR-59t: published AND pending review is a valid state and both are reported', () => {
    const both = article({ isPublished: true, reviewStatus: 'PENDING_REVIEW' });
    expect(publishAction(both).labelKey).toBe('community.action.unpublish');
    expect(reviewAction(both, reviewer).kind).toBe('decide');
  });

  it('addresses the four resources by their plural path segment', () => {
    expect(contentTypeOf('article')).toBe('articles');
    expect(contentTypeOf('video')).toBe('videos');
    expect(contentTypeOf('training')).toBe('trainings');
    expect(contentTypeOf('group')).toBe('groups');
  });

  it('a status the server did not send is the dash, never NOT_SUBMITTED', () => {
    expect(reviewStatusLabel(undefined)).toBe(DASH);
    expect(reviewStatusLabel('PENDING_REVIEW')).toBe(en['community.review.status.PENDING_REVIEW']);
  });
});

describe('communities (BR-59s)', () => {
  it('BR-59s: a create body carries name, description, category and rules, trimmed, with an empty rule as null', () => {
    expect(buildCommunityBody({ name: ' Tea ', description: ' D ', category: 'Regional', rules: '  ' })).toEqual({
      ok: true,
      body: { name: 'Tea', description: 'D', category: 'Regional', rules: null },
    });
    expect(buildCommunityBody({ name: 'Tea', description: 'D', category: 'Regional', rules: ' Be kind ' })).toMatchObject({
      ok: true,
      body: { rules: 'Be kind' },
    });
  });

  it('BR-59s: the spec bounds and the unchosen dropdown are refused before anything is sent', () => {
    const ok = { name: 'N', description: 'D', category: 'C', rules: '' };
    expect(buildCommunityBody({ ...ok, name: '' })).toEqual({ ok: false, errorKey: 'community.validation.communityName' });
    expect(buildCommunityBody({ ...ok, name: 'x'.repeat(121) })).toEqual({ ok: false, errorKey: 'community.validation.communityName' });
    expect(buildCommunityBody({ ...ok, description: '' })).toEqual({ ok: false, errorKey: 'community.validation.communityDescription' });
    expect(buildCommunityBody({ ...ok, description: 'x'.repeat(2001) })).toEqual({ ok: false, errorKey: 'community.validation.communityDescription' });
    expect(buildCommunityBody({ ...ok, category: 'Select' })).toEqual({ ok: false, errorKey: 'community.validation.communityCategory' });
    expect(buildCommunityBody({ ...ok, rules: 'x'.repeat(4001) })).toEqual({ ok: false, errorKey: 'community.validation.communityRules' });
  });

  it('BR-59s: a row shows the server name and status, the dash for what no field answers, and the real member count', () => {
    const row = communityRow(community(), 0);
    expect(row.name).toBe('Nilgiris Tea Growers');
    expect(row.status).toBe('Active');
    expect(row.subtitle).toBe(`${DASH} · ${DASH} · 41 farmers`);
    expect(communityRow(community({ isArchived: true }), 1).status).toBe('Archived');
  });

  it('BR-59s: the detail view fills what the server counted and dashes the rest', () => {
    const view = communityDetailView(community());
    expect(view.name).toBe('Nilgiris Tea Growers');
    expect(view.statusText).toBe(en['community.status.Active']);
    expect(view.summary.map((r) => r.value)).toEqual(['41', '3', DASH, DASH, DASH, '10 Oct 2026']);
    const empty = communityDetailView(undefined);
    expect(empty.name).toBe(DASH);
    expect(empty.statusText).toBe(DASH);
    expect(empty.summary.every((r) => r.value === DASH)).toBe(true);
  });

  it('the count caption: server total, and an active sub-count that is a dash until every page is in', () => {
    expect(communityCountText(8, null)).toBe(`8 communities (${DASH} active)`);
    expect(communityCountText(8, 7)).toBe('8 communities (7 active)');
    expect(communityCountText(undefined, null)).toBe(`${DASH} communities (${DASH} active)`);
  });

  it('BR-59s: a member row is a derived farmer, never an account', () => {
    const dto: CommunityMemberDto = {
      farmerId: 'f1',
      farmerName: 'Ravi',
      phone: '+919876543210',
      village: null,
      joinedAt: '2026-10-10T03:30:00.000Z',
      groupCount: 2,
      groups: [{ id: 'g1', name: 'G' }],
    };
    const row = memberRow(dto);
    expect(row.id).toBe('f1');
    expect(row.name).toBe('Ravi');
    expect(row.subtitle).toBe(`+919876543210 · ${DASH} · 2 groups`);
  });

  it('BR-59s: the group form offers active communities only, and a community the server did not return is not invented', () => {
    const options = communityOptions([community(), community({ id: 'c2', name: 'Old', isArchived: true })]);
    expect(options).toEqual([{ id: ID, name: 'Nilgiris Tea Growers' }]);
  });

  it('community.group.moderate is the permission, not the learning one', () => {
    expect(canModerate(makeCan([COMMUNITY_MODERATE]))).toBe(true);
    expect(canModerate(makeCan(['learning.admin.manage']))).toBe(false);
    expect(canModerate(undefined)).toBe(false);
  });
});

describe('Q&A (BR-59u)', () => {
  function thread(over: Partial<QaQuestionDetailDto> = {}): QaQuestionDetailDto {
    return {
      id: 'q1',
      communityId: ID,
      contentType: 'articles',
      contentId: 'a1',
      title: 'Is neem oil safe?',
      content: 'On tomato flowers?',
      author: { id: 'u1', displayName: 'Selvi', role: 'FARMER' },
      answerCount: 1,
      isBlocked: false,
      blockReason: null,
      createdAt: '2026-10-10T03:30:00.000Z',
      updatedAt: '2026-10-10T03:30:00.000Z',
      answers: [
        {
          id: 'an1',
          questionId: 'q1',
          content: 'Spray in the evening.',
          author: { id: 'u2', displayName: 'Admin', role: 'ADMIN' },
          isBlocked: false,
          blockReason: null,
          createdAt: '2026-10-11T03:30:00.000Z',
          updatedAt: '2026-10-11T03:30:00.000Z',
        },
      ],
      ...over,
    };
  }

  it('BR-59u: the thread is the question first, then every answer, each on its author’s side', () => {
    const rows = qaThreadView(thread());
    expect(rows.map((r) => [r.kind, r.author, r.side])).toEqual([
      ['question', 'Selvi', 'farmer'],
      ['answer', 'Admin', 'admin'],
    ]);
    expect(rows[1]?.content).toBe('Spray in the evening.');
  });

  it('BR-59u: a farmer’s answer is a farmer bubble — anyone can answer, so the side follows the author, not the viewer', () => {
    const rows = qaThreadView(
      thread({
        answers: [
          {
            id: 'an2',
            questionId: 'q1',
            content: 'Dilute it first.',
            author: { id: 'u3', displayName: 'Muthu', role: 'FARMER' },
            isBlocked: false,
            createdAt: '2026-10-11T03:30:00.000Z',
            updatedAt: '2026-10-11T03:30:00.000Z',
          },
        ],
      }),
    );
    expect(rows[1]).toMatchObject({ kind: 'answer', side: 'farmer', author: 'Muthu' });
  });

  it('BR-59u: a blocked message keeps its text for the moderator and says why it is blocked', () => {
    const rows = qaThreadView(thread({ isBlocked: true, blockReason: 'off-topic' }));
    expect(rows[0]?.content).toBe('On tomato flowers?');
    expect(rows[0]?.blockedNote).toContain('off-topic');
    expect(rows[1]?.blockedNote).toBeNull();
  });

  it('an absent author name is the dash', () => {
    const rows = qaThreadView(thread({ author: { id: 'u1', displayName: '  ', role: 'FARMER' } }));
    expect(rows[0]?.author).toBe(DASH);
  });

  it('BR-59u: a reply body is trimmed, must be non-empty and at most 10000 characters', () => {
    expect(buildAnswerBody('  Use compost.  ')).toEqual({ ok: true, body: { content: 'Use compost.' } });
    expect(buildAnswerBody('   ')).toEqual({ ok: false, errorKey: 'community.validation.answer' });
    expect(buildAnswerBody('x'.repeat(10001))).toEqual({ ok: false, errorKey: 'community.validation.answer' });
  });

  it('BR-59u: replying needs farmer.learning.qa_participate and nothing else — it is not admin-only', () => {
    expect(canSendAnswer(makeCan(['farmer.learning.qa_participate']))).toBe(true);
    expect(canSendAnswer(makeCan(['learning.admin.manage']))).toBe(false);
    expect(canSendAnswer(undefined)).toBe(false);
  });

  it('the header subtitle is the question title and its content type, or the dash', () => {
    expect(threadSubtitle(thread())).toBe('Is neem oil safe? · Article');
    expect(threadSubtitle(thread({ contentType: null }))).toBe('Is neem oil safe?');
    expect(threadSubtitle(undefined)).toBe(DASH);
  });
});

describe('announcements (BR-213)', () => {
  const base = { title: ' Rain alert ', summary: 'Heavy rain', description: 'Cover the nursery.', category: 'Weather Alert', audience: 'All' };

  it('BR-213: only the audience that maps to a target that can be authored is offered live', () => {
    const live = ANNOUNCEMENT_AUDIENCES.filter((a) => a.target !== null);
    expect(live.map((a) => a.target)).toEqual(['SYSTEM_WIDE']);
    // ZONE and ROLE are refused by the API (422), and there is no designed warehouse option.
    expect(ANNOUNCEMENT_AUDIENCES.map((a) => a.target as string | null)).not.toContain('ZONE');
    expect(ANNOUNCEMENT_AUDIENCES.map((a) => a.target as string | null)).not.toContain('ROLE');
    expect(ANNOUNCEMENT_AUDIENCES.map((a) => a.target as string | null)).not.toContain('SYSTEM');
    expect(ANNOUNCEMENT_AUDIENCES.filter((a) => a.target === null).length).toBeGreaterThan(0);
  });

  it('BR-213: publishes SYSTEM_WIDE — never "SYSTEM" — with the title, both texts and the mapped type', () => {
    const built = buildAnnouncementBody(base);
    expect(built).toEqual({
      ok: true,
      body: { target: 'SYSTEM_WIDE', type: 'ALERT', title: 'Rain alert', body: 'Heavy rain\n\nCover the nursery.' },
    });
    expect(JSON.stringify(built)).not.toContain('"SYSTEM"');
  });

  it('BR-213: an audience with no live target sends nothing', () => {
    expect(buildAnnouncementBody({ ...base, audience: 'All Farmers' })).toEqual({
      ok: false,
      errorKey: 'community.validation.announcementAudience',
    });
  });

  it('BR-213: the spec bounds are checked before anything is sent', () => {
    expect(buildAnnouncementBody({ ...base, title: '' })).toEqual({ ok: false, errorKey: 'community.validation.announcementTitle' });
    expect(buildAnnouncementBody({ ...base, title: 'x'.repeat(201) })).toEqual({ ok: false, errorKey: 'community.validation.announcementTitle' });
    expect(buildAnnouncementBody({ ...base, description: '' })).toEqual({ ok: false, errorKey: 'community.validation.announcementBody' });
    expect(buildAnnouncementBody({ ...base, description: 'x'.repeat(5000) })).toEqual({
      ok: false,
      errorKey: 'community.validation.announcementBody',
    });
    expect(buildAnnouncementBody({ ...base, category: 'Select' })).toEqual({ ok: false, errorKey: 'community.validation.category' });
  });

  it('the category maps onto the API type: only a weather alert is an ALERT, everything else is GENERAL', () => {
    expect(announcementTypeFor('Weather Alert')).toBe('ALERT');
    expect(announcementTypeFor('General Announcement')).toBe('GENERAL');
    expect(announcementTypeFor('Scheme & Policy')).toBe('GENERAL');
  });

  it('BR-213: publishing a system-wide announcement needs announcement.system_wide.create', () => {
    expect(canPublishAnnouncement(makeCan(['announcement.system_wide.create']))).toBe(true);
    expect(canPublishAnnouncement(makeCan(['announcement.warehouse.create']))).toBe(false);
    expect(canPublishAnnouncement(undefined)).toBe(false);
  });
});
