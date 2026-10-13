import { describe, expect, it } from 'vitest';
import { adminKeys } from '../api/queryKeys';

describe('adminKeys', () => {
  it('BR-30: every key is namespaced by warehouseId so one warehouse never reads another one\'s cache', () => {
    const a = adminKeys.list('wh-a', 'returns', { status: 'PENDING' });
    const b = adminKeys.list('wh-b', 'returns', { status: 'PENDING' });
    expect(a).not.toEqual(b);
    expect(a.slice(0, 3)).toEqual(['admin', 'wh', 'wh-a']);
  });

  it('a resource key is a prefix of its list and detail keys (so one invalidate covers both)', () => {
    const resource = adminKeys.resource('wh-a', 'returns');
    const list = adminKeys.list('wh-a', 'returns', { status: 'PENDING' });
    const detail = adminKeys.detail('wh-a', 'returns', 'r1');
    expect(list.slice(0, resource.length)).toEqual(resource);
    expect(detail.slice(0, resource.length)).toEqual(resource);
  });

  it('drops undefined params so equivalent filters share a cache entry', () => {
    expect(adminKeys.list('w', 'invoices', { status: undefined, q: 'x' })).toEqual(
      adminKeys.list('w', 'invoices', { q: 'x' }),
    );
  });

  it('keys work with no warehouse (HQ admins) without colliding with a warehouse id', () => {
    expect(adminKeys.scope(null)).toEqual(['admin', 'wh', '*']);
  });
});
