import { describe, expect, it } from 'vitest';
import { queryViewState } from '../screens/warehouse/shared/queryViewState';

describe('queryViewState', () => {
  it('is loading only before the first data arrives', () => {
    expect(queryViewState({ isPending: true, isError: false, data: undefined })).toBe('loading');
  });

  it('keeps showing data during a background refetch error (stale data beats a blank screen)', () => {
    expect(queryViewState({ isPending: false, isError: true, data: [1] })).toBe('ready');
  });

  it('is error when the first load failed', () => {
    expect(queryViewState({ isPending: false, isError: true, data: undefined })).toBe('error');
  });

  it('is empty for an empty list or a custom empty predicate', () => {
    expect(queryViewState({ isPending: false, isError: false, data: [] })).toBe('empty');
    expect(
      queryViewState(
        { isPending: false, isError: false, data: { items: [] as number[] } },
        (d) => d.items.length === 0,
      ),
    ).toBe('empty');
  });

  it('is ready otherwise', () => {
    expect(queryViewState({ isPending: false, isError: false, data: { a: 1 } })).toBe('ready');
  });
});
