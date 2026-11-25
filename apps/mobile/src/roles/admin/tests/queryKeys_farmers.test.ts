/**
 * roles/admin/api/queryKeys.ts farmerKeys: the Farmers Management query keys.
 * Every key sits under its module prefix (so a mutation's invalidation reaches
 * it) and carries the caller's warehouse like every admin key (BR-30); the
 * farmer scope itself is server-side (BR-108a).
 */
import { describe, expect, it } from 'vitest';
import { adminKeys, applicationKeys, farmerKeys, FARMERS_MODULE, FARMER_APPLICATIONS_MODULE } from '../api/queryKeys';

const FARMER = '33333333-3333-4333-8333-333333333333';

function startsWith(key: readonly unknown[], prefix: readonly unknown[]): boolean {
  return prefix.every((part, i) => key[i] === part);
}

describe('farmerKeys', () => {
  it('every farmer key starts with the farmers module prefix', () => {
    const prefix = adminKeys.module(FARMERS_MODULE);
    for (const key of [
      farmerKeys.list('wh-a', { q: 'mur' }),
      farmerKeys.detail('wh-a', FARMER),
      farmerKeys.documents('wh-a', FARMER),
      farmerKeys.bankAccounts('wh-a', FARMER),
      farmerKeys.subscription('wh-a', FARMER),
      farmerKeys.rating('wh-a', FARMER),
    ]) {
      expect(startsWith(key, prefix)).toBe(true);
    }
  });

  it('the list key changes with every filter, and undefined filters are null', () => {
    expect(farmerKeys.list(undefined, {})).toEqual([
      'admin',
      FARMERS_MODULE,
      'all',
      { resource: 'list', q: null, status: null, zoneId: null, ratingTier: null },
    ]);
    expect(farmerKeys.list('wh-a', { status: 'ACTIVE' })).not.toEqual(farmerKeys.list('wh-a', { status: 'DISABLED' }));
  });

  it('BR-30: two warehouses never share a farmer key', () => {
    expect(farmerKeys.detail('wh-a', FARMER)).not.toEqual(farmerKeys.detail('wh-b', FARMER));
  });

  it('per-farmer keys differ by resource', () => {
    expect(farmerKeys.detail('wh-a', FARMER)).not.toEqual(farmerKeys.documents('wh-a', FARMER));
  });
});

describe('applicationKeys', () => {
  it('every application key starts with the applications module prefix', () => {
    const prefix = adminKeys.module(FARMER_APPLICATIONS_MODULE);
    expect(startsWith(applicationKeys.list('wh-a', { status: 'SUBMITTED' }), prefix)).toBe(true);
    expect(startsWith(applicationKeys.detail('wh-a', 'app-1'), prefix)).toBe(true);
  });

  it('the list key carries its filters', () => {
    expect(applicationKeys.list(undefined, {})).toEqual([
      'admin',
      FARMER_APPLICATIONS_MODULE,
      'all',
      { resource: 'list', status: null, zoneId: null, submittedAfter: null },
    ]);
  });
});
