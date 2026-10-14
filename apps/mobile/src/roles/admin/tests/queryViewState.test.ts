/**
 * queryViewState: which of the shared async states (AsyncStates.tsx) a list
 * screen shows. Pure, so it runs in plain-Node vitest; the components only
 * render whatever this returns.
 */
import { describe, expect, it } from 'vitest';
import { queryViewState } from '../screens/warehouse/shared/queryViewState';

describe('queryViewState', () => {
  it('is loading on the first fetch, before anything is shown', () => {
    expect(queryViewState({ isLoading: true, error: null, itemCount: 0 })).toBe('loading');
  });

  it('is error when the fetch failed and there is nothing to show', () => {
    expect(queryViewState({ isLoading: false, error: new Error('boom'), itemCount: 0 })).toBe('error');
  });

  it('is empty when the fetch succeeded with no items', () => {
    expect(queryViewState({ isLoading: false, error: null, itemCount: 0 })).toBe('empty');
    expect(queryViewState({ isLoading: false, error: undefined, itemCount: 0 })).toBe('empty');
  });

  it('is ready when there are items', () => {
    expect(queryViewState({ isLoading: false, error: null, itemCount: 3 })).toBe('ready');
  });

  it('keeps showing items already on screen when a refresh fails', () => {
    expect(queryViewState({ isLoading: false, error: new Error('boom'), itemCount: 2 })).toBe('ready');
  });

  it('keeps showing items already on screen while they reload', () => {
    expect(queryViewState({ isLoading: true, error: null, itemCount: 2 })).toBe('ready');
  });

  it('prefers loading over a stale error while a retry is in flight', () => {
    expect(queryViewState({ isLoading: true, error: new Error('old'), itemCount: 0 })).toBe('loading');
  });
});
