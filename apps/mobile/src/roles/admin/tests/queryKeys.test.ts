/**
 * roles/admin/api/queryKeys.ts: TanStack Query keys for admin data.
 * Every key carries the warehouse it was fetched for, so one warehouse's
 * cached rows can never answer another warehouse's query (BR-30).
 */
import { describe, expect, it } from 'vitest';
import { adminKeys } from '../api/queryKeys';

describe('adminKeys', () => {
  it("builds ['admin', module, warehouseId, params]", () => {
    expect(adminKeys.scoped('orders', 'wh-uuid-1', { status: 'PACKED' })).toEqual([
      'admin',
      'orders',
      'wh-uuid-1',
      { status: 'PACKED' },
    ]);
  });

  it("uses 'all' for the Main (all-warehouses) view and {} for no params", () => {
    expect(adminKeys.scoped('orders', undefined)).toEqual(['admin', 'orders', 'all', {}]);
  });

  it('BR-30: two warehouses never share a key', () => {
    expect(adminKeys.scoped('orders', 'wh-a', {})).not.toEqual(adminKeys.scoped('orders', 'wh-b', {}));
    expect(adminKeys.scoped('orders', 'wh-a', {})).not.toEqual(adminKeys.scoped('orders', undefined, {}));
  });

  it('module(m) is a prefix of every key of that module, for invalidation', () => {
    const prefix = adminKeys.module('orders');
    expect(prefix).toEqual(['admin', 'orders']);
    expect(adminKeys.scoped('orders', 'wh-a', { page: 2 }).slice(0, prefix.length)).toEqual([...prefix]);
  });

  it("all is the root of every admin key", () => {
    expect(adminKeys.all).toEqual(['admin']);
  });
});
