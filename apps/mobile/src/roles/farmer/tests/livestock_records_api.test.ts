/**
 * The per-animal record client (api/livestock.ts): paths, query strings, POST
 * bodies passed through untouched, the fail-closed housing standard (BR-141c)
 * and the dairy/non-dairy product split DairyProduceScreen relies on.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiGet = vi.hoisted(() => vi.fn());
const apiPost = vi.hoisted(() => vi.fn());
vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, api: { get: apiGet, post: apiPost } };
});

import {
  createHygieneLog,
  isDairyProductType,
  listBreedingRecords,
  listFeedLogs,
  listFeedPlans,
  listHealthRecords,
  listHousingRecords,
  listHygieneLogs,
} from '../api/livestock';

const ID = 'a0000000-0000-4000-8000-000000000001';
const BASE = `/farmers/me/livestock/animals/${ID}`;
const empty = { items: [], page: { nextCursor: null, hasMore: false } };

beforeEach(() => {
  apiGet.mockReset();
  apiPost.mockReset();
  apiGet.mockResolvedValue(empty);
  apiPost.mockResolvedValue({ id: 'x' });
});

describe('per-animal record client', () => {
  it('BR-137: lists hit the animal-scoped paths with cursor and limit', async () => {
    await listHealthRecords(ID, { limit: 20, cursor: 'c1' });
    await listBreedingRecords(ID, { limit: 50 });
    await listFeedPlans(ID, { limit: 1 });
    await listFeedLogs(ID, { limit: 20 });
    await listHygieneLogs(ID, { limit: 20 });
    expect(apiGet.mock.calls.map((c) => c[0])).toEqual([
      `${BASE}/health-records?cursor=c1&limit=20`,
      `${BASE}/breeding-records?limit=50`,
      `${BASE}/feed-plans?limit=1`,
      `${BASE}/feed-logs?limit=20`,
      `${BASE}/hygiene-logs?limit=20`,
    ]);
  });

  it('encodes the animal id in the path', async () => {
    await listFeedPlans('a/b', {});
    expect(apiGet.mock.calls[0]![0]).toBe('/farmers/me/livestock/animals/a%2Fb/feed-plans');
  });

  it('a POST sends the body untouched to the resource path', async () => {
    await createHygieneLog(ID, { activity: 'Floor scrubbed', performedOn: '2026-07-14' });
    expect(apiPost).toHaveBeenCalledWith(`${BASE}/hygiene-logs`, { activity: 'Floor scrubbed', performedOn: '2026-07-14' });
  });

  it('BR-141c: a housing list without a usable spaceStandard reads as not configured (null), never a default number', async () => {
    for (const bad of [undefined, null, { minIndoorSqFtPerAnimal: 0 }, { minIndoorSqFtPerAnimal: -1 }, { minIndoorSqFtPerAnimal: '11' }, {}]) {
      apiGet.mockResolvedValueOnce({ ...empty, ...(bad === undefined ? {} : { spaceStandard: bad }) });
      expect((await listHousingRecords(ID, { limit: 1 })).spaceStandard).toBeNull();
    }
  });

  it('BR-141: a housing list with the server standard passes through', async () => {
    apiGet.mockResolvedValueOnce({ ...empty, spaceStandard: { minIndoorSqFtPerAnimal: 12.5 } });
    const result = await listHousingRecords(ID, { limit: 1 });
    expect(result.spaceStandard?.minIndoorSqFtPerAnimal).toBe(12.5);
  });

  it('DairyProduceScreen only keeps dairy products (MEAT / WOOL / MANURE are filtered out)', () => {
    expect(isDairyProductType('MILK')).toBe(true);
    expect(isDairyProductType('EGGS')).toBe(true);
    expect(isDairyProductType('MEAT')).toBe(false);
    expect(isDairyProductType('WOOL')).toBe(false);
    expect(isDairyProductType('MANURE')).toBe(false);
  });
});
