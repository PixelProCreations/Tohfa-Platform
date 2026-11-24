/**
 * roles/admin/api/communities.ts (docs/openapi.yaml tag Communities, BR-59s),
 * the review additions to roles/admin/api/learning.ts (BR-59t), and
 * roles/admin/api/qa.ts + announcements.ts (BR-59u, BR-213).
 *
 *   GET|POST       /admin/communities                    community.group.moderate
 *   GET|PATCH      /admin/communities/{id}               community.group.moderate
 *   POST           /admin/communities/{id}/archive       community.group.moderate
 *   GET            /admin/communities/{id}/groups        community.group.moderate
 *   GET            /admin/communities/{id}/members       community.group.moderate
 *   POST           /admin/learning/{type}/{id}/submit-review   learning.admin.manage
 *   POST           /admin/learning/{type}/{id}/review          learning.content.review
 *   GET|POST       /admin/qa/questions                   learning.admin.manage / farmer.learning.qa_participate
 *   POST           /admin/qa/questions/{id}/answers      farmer.learning.qa_participate
 *   PATCH          /admin/qa/questions/{id}/moderate     community.group.moderate
 *   GET|POST       /admin/announcements                  announcement.*.create
 *
 * Shell client is mocked (same pattern as api_learning.test.ts).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as ClientModule from '../../../shell/api/client';

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return {
    ...actual,
    request: vi.fn(async () => ({ items: [], total: 0, page: 1, limit: 20 })),
  };
});

import { ApiError, request } from '../../../shell/api/client';
import {
  archiveCommunity,
  communityKeys,
  createCommunity,
  getCommunity,
  listCommunities,
  listCommunityGroups,
  listCommunityMembers,
  updateCommunity,
} from '../api/communities';
import {
  createLearningGroup,
  listLearningArticles,
  listLearningGroups,
  reviewLearningContent,
  submitLearningForReview,
  updateLearningGroup,
} from '../api/learning';
import {
  askAdminQaQuestion,
  getAdminQaQuestion,
  listAdminQaQuestions,
  moderateAdminQaQuestion,
  postAdminQaAnswer,
  qaKeys,
  updateAdminQaAnswer,
} from '../api/qa';
import { createAdminAnnouncement } from '../api/announcements';

const requestMock = vi.mocked(request);
const ID = '6f0c6a53-9d1e-4f6e-8a55-1f6b2d0f5a11';

function lastCall() {
  const call = requestMock.mock.calls[requestMock.mock.calls.length - 1];
  if (call === undefined) throw new Error('request was not called');
  return { path: call[0], init: call[1] };
}

describe('roles/admin/api/communities.ts (BR-59s)', () => {
  beforeEach(() => {
    requestMock.mockReset();
    requestMock.mockResolvedValue({ items: [], total: 0, page: 1, limit: 20 });
  });

  it('BR-59s: lists with page/limit and the documented filters', async () => {
    await listCommunities({ page: 2, limit: 50, category: 'Organic & Bio-Dynamic', isArchived: false, q: 'tea', sort: 'members' });
    const { path, init } = lastCall();
    expect(path).toContain('/admin/communities?');
    expect(path).toContain('page=2');
    expect(path).toContain('limit=50');
    expect(path).toContain('isArchived=false');
    expect(path).toContain('q=tea');
    expect(path).toContain('sort=members');
    expect(init?.method).toBe('GET');
  });

  it('sends no query when no filter is set', async () => {
    await listCommunities();
    expect(lastCall().path).toBe('/admin/communities');
  });

  it('BR-59s: creates with POST carrying exactly the body it was given', async () => {
    await createCommunity({ name: 'Nilgiris Tea', category: 'Regional', description: null, rules: 'Be kind' });
    const { path, init } = lastCall();
    expect(path).toBe('/admin/communities');
    expect(init?.method).toBe('POST');
    expect(init?.body).toEqual({ name: 'Nilgiris Tea', category: 'Regional', description: null, rules: 'Be kind' });
  });

  it('BR-59s: reads and PATCHes one community by id', async () => {
    await getCommunity(ID);
    expect(lastCall().path).toBe(`/admin/communities/${ID}`);
    expect(lastCall().init?.method).toBe('GET');
    await updateCommunity(ID, { name: 'Renamed' });
    expect(lastCall().path).toBe(`/admin/communities/${ID}`);
    expect(lastCall().init?.method).toBe('PATCH');
    expect(lastCall().init?.body).toEqual({ name: 'Renamed' });
  });

  it('BR-59s: archive is POST .../archive, never a DELETE', async () => {
    await archiveCommunity(ID);
    expect(lastCall().path).toBe(`/admin/communities/${ID}/archive`);
    expect(lastCall().init?.method).toBe('POST');
  });

  it('BR-59s: lists a community’s groups and derived members, paged by number', async () => {
    await listCommunityGroups(ID, { page: 3, limit: 10 });
    expect(lastCall().path).toBe(`/admin/communities/${ID}/groups?page=3&limit=10`);
    await listCommunityMembers(ID, { page: 1, limit: 20, q: 'ravi' });
    expect(lastCall().path).toBe(`/admin/communities/${ID}/members?page=1&limit=20&q=ravi`);
  });

  it('no community write sends an Idempotency-Key: none of them moves money', async () => {
    await createCommunity({ name: 'N', category: 'C' });
    await updateCommunity(ID, { name: 'M' });
    await archiveCommunity(ID);
    for (const call of requestMock.mock.calls) expect(call[1]?.idempotencyKey).toBeUndefined();
  });

  it('keys carry the filters but never the page, so load-more stays one list', () => {
    expect(JSON.stringify(communityKeys.list({ q: 'a', isArchived: false }))).not.toContain('page');
    expect(communityKeys.list({ q: 'a' })).not.toEqual(communityKeys.list({ q: 'b' }));
    expect(communityKeys.detail(ID)).not.toEqual(communityKeys.detail('other'));
    expect(communityKeys.groups(ID)).not.toEqual(communityKeys.members(ID));
  });
});

describe('learning.ts: the review workflow and communityId (BR-59t, BR-59s)', () => {
  beforeEach(() => {
    requestMock.mockReset();
    requestMock.mockResolvedValue({ items: [], total: 0, page: 1, limit: 20 });
  });

  it('BR-59t: submit-for-review is POST /admin/learning/{type}/{id}/submit-review with an optional note', async () => {
    await submitLearningForReview('articles', ID, 'please check the dose');
    expect(lastCall().path).toBe(`/admin/learning/articles/${ID}/submit-review`);
    expect(lastCall().init?.method).toBe('POST');
    expect(lastCall().init?.body).toEqual({ note: 'please check the dose' });

    await submitLearningForReview('videos', ID);
    expect(lastCall().path).toBe(`/admin/learning/videos/${ID}/submit-review`);
    expect(lastCall().init?.body).toEqual({});
  });

  it('BR-59t: a review decision is POST .../review with status APPROVED or REJECTED', async () => {
    await reviewLearningContent('trainings', ID, { status: 'APPROVED' });
    expect(lastCall().path).toBe(`/admin/learning/trainings/${ID}/review`);
    expect(lastCall().init?.method).toBe('POST');
    expect(lastCall().init?.body).toEqual({ status: 'APPROVED' });

    await reviewLearningContent('groups', ID, { status: 'REJECTED', note: 'unverified claim' });
    expect(lastCall().path).toBe(`/admin/learning/groups/${ID}/review`);
    expect(lastCall().init?.body).toEqual({ status: 'REJECTED', note: 'unverified claim' });
  });

  it('BR-59t: the review and submit writes never touch isPublished', async () => {
    await submitLearningForReview('articles', ID);
    await reviewLearningContent('articles', ID, { status: 'APPROVED' });
    for (const call of requestMock.mock.calls) {
      expect(JSON.stringify(call[1]?.body ?? {})).not.toContain('isPublished');
    }
  });

  it('BR-59t: the admin lists accept a reviewStatus filter', async () => {
    await listLearningArticles({ reviewStatus: 'PENDING_REVIEW' });
    expect(lastCall().path).toContain('reviewStatus=PENDING_REVIEW');
    await listLearningGroups({ reviewStatus: 'APPROVED', communityId: ID });
    expect(lastCall().path).toContain('reviewStatus=APPROVED');
    expect(lastCall().path).toContain(`communityId=${ID}`);
  });

  it('BR-59s: a group is created and updated with an optional communityId', async () => {
    await createLearningGroup({ name: 'G', category: 'Crops', communityId: ID });
    expect(lastCall().init?.body).toEqual({ name: 'G', category: 'Crops', communityId: ID });
    await updateLearningGroup(ID, { communityId: null });
    expect(lastCall().init?.body).toEqual({ communityId: null });
  });
});

describe('roles/admin/api/qa.ts (BR-59u)', () => {
  beforeEach(() => {
    requestMock.mockReset();
    requestMock.mockResolvedValue({ items: [], total: 0, page: 1, limit: 20 });
  });

  it('BR-59u: lists questions on the ADMIN surface with its filters', async () => {
    await listAdminQaQuestions({ page: 1, limit: 20, communityId: ID, contentType: 'articles', contentId: ID, q: 'dose' });
    const { path, init } = lastCall();
    expect(path).toContain('/admin/qa/questions?');
    expect(path).not.toContain('/farmers/');
    expect(path).toContain(`communityId=${ID}`);
    expect(path).toContain('contentType=articles');
    expect(init?.method).toBe('GET');
  });

  it('BR-59u: reads one question with its answers', async () => {
    await getAdminQaQuestion(ID);
    expect(lastCall().path).toBe(`/admin/qa/questions/${ID}`);
  });

  it('BR-59u: anyone with qa_participate answers — the reply is POST .../answers with content only', async () => {
    await postAdminQaAnswer(ID, 'Use well-rotted compost.');
    expect(lastCall().path).toBe(`/admin/qa/questions/${ID}/answers`);
    expect(lastCall().init?.method).toBe('POST');
    expect(lastCall().init?.body).toEqual({ content: 'Use well-rotted compost.' });
  });

  it('BR-59u: asks a question with POST /admin/qa/questions', async () => {
    await askAdminQaQuestion({ title: 'T', content: 'C', communityId: ID });
    expect(lastCall().path).toBe('/admin/qa/questions');
    expect(lastCall().init?.method).toBe('POST');
  });

  it('BR-59u: block and unblock are PATCH .../moderate with isBlocked', async () => {
    await moderateAdminQaQuestion(ID, { isBlocked: true, blockReason: 'off-topic' });
    expect(lastCall().path).toBe(`/admin/qa/questions/${ID}/moderate`);
    expect(lastCall().init?.method).toBe('PATCH');
    expect(lastCall().init?.body).toEqual({ isBlocked: true, blockReason: 'off-topic' });
    await moderateAdminQaQuestion(ID, { isBlocked: false });
    expect(lastCall().init?.body).toEqual({ isBlocked: false });
  });

  it('BR-59u: editing is the author’s act — another participant’s edit is refused by the server and the refusal is not swallowed', async () => {
    requestMock.mockRejectedValueOnce(new ApiError({ type: 'about:blank', title: 'Forbidden', status: 403, code: 'FORBIDDEN' } as never));
    await expect(updateAdminQaAnswer(ID, 'rewritten')).rejects.toMatchObject({ status: 403 });
    expect(lastCall().path).toBe(`/admin/qa/answers/${ID}`);
    expect(lastCall().init?.method).toBe('PATCH');
  });

  it('keys separate the list from the detail', () => {
    expect(qaKeys.list({ communityId: ID })).not.toEqual(qaKeys.list({ communityId: 'x' }));
    expect(qaKeys.detail(ID)).not.toEqual(qaKeys.list({}));
  });
});

describe('roles/admin/api/announcements.ts (BR-213)', () => {
  beforeEach(() => {
    requestMock.mockReset();
    requestMock.mockResolvedValue({});
  });

  it('BR-213: publishes a SYSTEM_WIDE announcement with POST /admin/announcements', async () => {
    await createAdminAnnouncement({ target: 'SYSTEM_WIDE', type: 'GENERAL', title: 'T', body: 'B', locale: 'en' });
    expect(lastCall().path).toBe('/admin/announcements');
    expect(lastCall().init?.method).toBe('POST');
    expect(lastCall().init?.body).toEqual({ target: 'SYSTEM_WIDE', type: 'GENERAL', title: 'T', body: 'B', locale: 'en' });
  });
});
