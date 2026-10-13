/**
 * Which of the four states a data screen is in, from a React Query result.
 *
 * Pure so it is testable without rendering. The one non-obvious rule: once
 * data has loaded, a failed background refetch keeps showing that data
 * ('ready') — a warehouse admin mid-task is better served by slightly stale
 * rows than by a full-screen error. The refetch error is still available to
 * the screen for a non-blocking notice.
 */
export type ViewState = 'loading' | 'error' | 'empty' | 'ready';

export interface QueryLike<T> {
  isPending: boolean;
  isError: boolean;
  data: T | undefined;
}

export function queryViewState<T>(
  query: QueryLike<T>,
  isEmpty: (data: T) => boolean = (data) => Array.isArray(data) && data.length === 0,
): ViewState {
  if (query.data === undefined) {
    if (query.isError) return 'error';
    return 'loading';
  }
  return isEmpty(query.data) ? 'empty' : 'ready';
}
