/**
 * roles/admin/api/learning.ts: the admin Learning Hub API (docs/openapi.yaml
 * tag Learning Hub, BR-59).
 *
 *   GET|POST            /admin/learning/articles            learning.admin.manage
 *   GET|PATCH|DELETE    /admin/learning/articles/{id}       learning.admin.manage
 *   GET|POST            /admin/learning/videos              learning.admin.manage
 *   GET|PATCH|DELETE    /admin/learning/videos/{id}         learning.admin.manage
 *   GET|POST            /admin/learning/trainings           learning.admin.manage
 *   GET|PATCH|DELETE    /admin/learning/trainings/{id}      learning.admin.manage
 *   GET|POST            /admin/learning/groups              learning.admin.manage
 *   GET|PATCH|DELETE    /admin/learning/groups/{id}         learning.admin.manage
 *   POST                /admin/learning/groups/{id}/archive learning.admin.manage
 *   GET                 /admin/learning-hub[/{id}]          farmer.learning.manage
 *
 * Shell client is mocked (same pattern as api_tasks.test.ts).
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

import { request } from '../../../shell/api/client';
import { nextNumberedPage } from '../../../shell/api/pagination';
import { countLoadedWhere, flattenNumberedPages } from '../api/hookHelpers';
import {
  ERROR_CODES,
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
  listLearningArticles,
  listLearningGroups,
  listLearningHubArticles,
  listLearningTrainings,
  listLearningVideos,
  updateLearningArticle,
  updateLearningGroup,
  updateLearningTraining,
  updateLearningVideo,
} from '../api/learning';
import { hasKey } from '../i18n';

const requestMock = vi.mocked(request);

const ID = '6f0c6a53-9d1e-4f6e-8a55-1f6b2d0f5a11';

function lastCall() {
  const call = requestMock.mock.calls[requestMock.mock.calls.length - 1];
  if (call === undefined) throw new Error('request was not called');
  return { path: call[0], init: call[1] };
}

describe('roles/admin/api/learning.ts (HTTP contract, BR-59)', () => {
  beforeEach(() => {
    requestMock.mockReset();
    requestMock.mockResolvedValue({ items: [], total: 0, page: 1, limit: 20 });
  });

  describe('articles', () => {
    it('BR-59l: lists with page/limit and the documented admin filters', async () => {
      await listLearningArticles({ page: 2, limit: 50, language: 'ta', tag: 'soil', isPublished: false, q: 'mulch' });
      const { path, init } = lastCall();
      expect(path).toContain('/admin/learning/articles');
      expect(path).toContain('page=2');
      expect(path).toContain('limit=50');
      expect(path).toContain('language=ta');
      expect(path).toContain('tag=soil');
      expect(path).toContain('isPublished=false');
      expect(path).toContain('q=mulch');
      expect(init?.method).toBe('GET');
    });

    it('sends no query at all when no filter is set (the server defaults page=1, limit=20)', async () => {
      await listLearningArticles();
      expect(lastCall().path).toBe('/admin/learning/articles');
    });

    it('creates, reads, updates and deletes one article', async () => {
      await createLearningArticle({ title: 'T', content: 'C', readTime: '4 min', author: 'A', tag: 'soil' });
      expect(lastCall().path).toBe('/admin/learning/articles');
      expect(lastCall().init?.method).toBe('POST');

      await getLearningArticle(ID);
      expect(lastCall().path).toBe(`/admin/learning/articles/${ID}`);
      expect(lastCall().init?.method).toBe('GET');

      await updateLearningArticle(ID, { isPublished: true });
      expect(lastCall().path).toBe(`/admin/learning/articles/${ID}`);
      expect(lastCall().init?.method).toBe('PATCH');

      await deleteLearningArticle(ID);
      expect(lastCall().path).toBe(`/admin/learning/articles/${ID}`);
      expect(lastCall().init?.method).toBe('DELETE');
    });

    it('no learning write sends an Idempotency-Key: none of them moves money', async () => {
      await createLearningArticle({ title: 'T', content: 'C', readTime: '4 min', author: 'A', tag: 'soil' });
      await updateLearningArticle(ID, { isPublished: true });
      for (const call of requestMock.mock.calls) expect(call[1]?.idempotencyKey).toBeUndefined();
    });
  });

  describe('videos', () => {
    it('BR-59n: lists with the documented filters (no tag filter on videos)', async () => {
      await listLearningVideos({ page: 1, limit: 20, language: 'en', isPublished: true, q: 'drip' });
      const { path } = lastCall();
      expect(path).toContain('/admin/learning/videos');
      expect(path).toContain('language=en');
      expect(path).toContain('isPublished=true');
      expect(path).toContain('q=drip');
      expect(path).not.toContain('tag=');
    });

    it('creates, reads, updates and deletes one video', async () => {
      await createLearningVideo({ title: 'T', videoUrl: 'https://example.org/v', duration: '6:10', author: 'A' });
      expect(lastCall().init?.method).toBe('POST');
      await getLearningVideo(ID);
      expect(lastCall().path).toBe(`/admin/learning/videos/${ID}`);
      await updateLearningVideo(ID, { isFeatured: true });
      expect(lastCall().init?.method).toBe('PATCH');
      await deleteLearningVideo(ID);
      expect(lastCall().init?.method).toBe('DELETE');
    });
  });

  describe('trainings', () => {
    it('BR-59n: lists with the documented filters', async () => {
      await listLearningTrainings({ page: 3, language: 'ta', isPublished: false, q: 'compost' });
      const { path } = lastCall();
      expect(path).toContain('/admin/learning/trainings');
      expect(path).toContain('page=3');
      expect(path).toContain('language=ta');
      expect(path).toContain('isPublished=false');
      expect(path).toContain('q=compost');
    });

    it('BR-59h: capacity is sent as the server takes it, null included (null removes the limit)', async () => {
      await updateLearningTraining(ID, { capacity: null });
      const { path, init } = lastCall();
      expect(path).toBe(`/admin/learning/trainings/${ID}`);
      expect(init?.method).toBe('PATCH');
      expect(init?.body).toEqual({ capacity: null });
    });

    it('creates, reads and deletes one training', async () => {
      await createLearningTraining({
        title: 'T',
        trainingDate: '2026-12-01',
        startTime: '10:00',
        mode: 'IN_FIELD',
        location: 'Ooty',
        instructor: 'I',
      });
      expect(lastCall().path).toBe('/admin/learning/trainings');
      expect(lastCall().init?.method).toBe('POST');
      await getLearningTraining(ID);
      expect(lastCall().path).toBe(`/admin/learning/trainings/${ID}`);
      await deleteLearningTraining(ID);
      expect(lastCall().init?.method).toBe('DELETE');
    });
  });

  describe('groups', () => {
    it('BR-59n: lists with category, q and sort, and no language or isPublished filter', async () => {
      await listLearningGroups({ page: 1, limit: 10, category: 'Soil', q: 'tea', sort: 'members' });
      const { path } = lastCall();
      expect(path).toContain('/admin/learning/groups');
      expect(path).toContain('category=Soil');
      expect(path).toContain('q=tea');
      expect(path).toContain('sort=members');
      expect(path).not.toContain('language=');
      expect(path).not.toContain('isPublished=');
    });

    it('BR-59q: archive is its own POST, separate from DELETE', async () => {
      await archiveLearningGroup(ID);
      expect(lastCall().path).toBe(`/admin/learning/groups/${ID}/archive`);
      expect(lastCall().init?.method).toBe('POST');

      await deleteLearningGroup(ID);
      expect(lastCall().path).toBe(`/admin/learning/groups/${ID}`);
      expect(lastCall().init?.method).toBe('DELETE');
    });

    it('creates, reads and updates one group', async () => {
      await createLearningGroup({ name: 'N', category: 'Soil' });
      expect(lastCall().init?.method).toBe('POST');
      await getLearningGroup(ID);
      expect(lastCall().path).toBe(`/admin/learning/groups/${ID}`);
      await updateLearningGroup(ID, { category: 'Water' });
      expect(lastCall().init?.method).toBe('PATCH');
    });
  });

  describe('/admin/learning-hub (the farmer.learning.manage surface)', () => {
    it('is a separate path from /admin/learning/articles, same shape', async () => {
      await listLearningHubArticles({ page: 2 });
      expect(lastCall().path).toContain('/admin/learning-hub');
      expect(lastCall().path).not.toContain('/admin/learning/articles');
      await getLearningHubArticle(ID);
      expect(lastCall().path).toBe(`/admin/learning-hub/${ID}`);
    });
  });

  describe('ids are encoded, never interpolated raw', () => {
    it('encodes a path id', async () => {
      await getLearningArticle('a/b');
      expect(lastCall().path).toBe('/admin/learning/articles/a%2Fb');
    });
  });

  describe('query keys', () => {
    it('every learning key is under the learning module prefix, so one write refetches the module', () => {
      const keys = [
        learningKeys.articles({}),
        learningKeys.article(ID),
        learningKeys.videos({}),
        learningKeys.video(ID),
        learningKeys.trainings({}),
        learningKeys.training(ID),
        learningKeys.groups({}),
        learningKeys.group(ID),
        learningKeys.hubArticles({}),
        learningKeys.hubArticle(ID),
      ];
      for (const key of keys) expect(key.slice(0, 2)).toEqual(['admin', LEARNING_MODULE]);
    });

    it('unset filters are null, so the key shape is stable', () => {
      expect(learningKeys.articles({})).toEqual(learningKeys.articles({ language: undefined }));
      expect(learningKeys.articles({ q: 'a' })).not.toEqual(learningKeys.articles({ q: 'b' }));
    });

    it('the page number is not part of a list key: load-more accumulates one query, it does not start a new list', () => {
      expect(Object.keys(learningKeys.articles({ q: 'a' })[3])).not.toContain('page');
    });

    it('a list key and a detail key of the same resource never collide', () => {
      expect(learningKeys.articles({})).not.toEqual(learningKeys.article(ID));
      expect(learningKeys.article(ID)).not.toEqual(learningKeys.video(ID));
    });
  });

  describe('ERROR_CODES (i18n completeness)', () => {
    it('every declared ERROR_CODE exists in roles/admin/i18n error dictionary', () => {
      for (const code of ERROR_CODES) {
        expect(hasKey(`admin.error.${code}`)).toBe(true);
      }
    });
  });
});

describe('page/limit paging helpers (learning lists are not cursor-paged)', () => {
  const page = (p: number, items: number[], total: number) => ({ items, total, page: p, limit: 2 });

  it('asks for the next page while loaded rows are short of total', () => {
    expect(nextNumberedPage(page(1, [1, 2], 5))).toBe(2);
    expect(nextNumberedPage(page(2, [3, 4], 5))).toBe(3);
  });

  it('stops on the last page', () => {
    expect(nextNumberedPage(page(3, [5], 5))).toBeUndefined();
    expect(nextNumberedPage(page(1, [1, 2], 2))).toBeUndefined();
  });

  it('stops on an empty page, whatever total claims (a server that over-reports must not loop us)', () => {
    expect(nextNumberedPage(page(2, [], 99))).toBeUndefined();
  });

  it('flattens every loaded page in order', () => {
    expect(flattenNumberedPages([page(1, [1, 2], 3), page(2, [3], 3)], (n: number) => `#${n}`)).toEqual(['#1', '#2', '#3']);
    expect(flattenNumberedPages(undefined, (n: number) => n)).toEqual([]);
  });

  it('BR-59l: a count derived from the loaded rows is null while pages remain, never a partial number', () => {
    const rows = [{ isPublished: true }, { isPublished: false }];
    const isPublished = (r: { isPublished: boolean }) => r.isPublished;
    expect(countLoadedWhere(rows, isPublished, false)).toBeNull();
    expect(countLoadedWhere(rows, isPublished, true)).toBe(1);
  });

  it('BR-59l: an empty fully-loaded list counts zero, which is a fact, not an unknown', () => {
    expect(countLoadedWhere([], () => true, true)).toBe(0);
  });
});
