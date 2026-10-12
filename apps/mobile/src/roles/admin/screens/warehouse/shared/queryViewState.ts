/**
 * Which shared async state (./AsyncStates.tsx) a data screen shows. Pure, so
 * plain-Node vitest covers it; hooks and components only pass values through.
 *
 * Items already on screen win over everything else: a failed or in-flight
 * refresh must not blank a list the admin is reading. With nothing to show, a
 * fetch in flight shows loading (also while a Retry is running after an
 * error), a failure shows the error, and a successful empty result shows empty.
 */
export type QueryViewState = 'loading' | 'error' | 'empty' | 'ready';

export interface QueryViewInput {
  isLoading: boolean;
  /** null/undefined when the last fetch did not fail. */
  error: unknown;
  itemCount: number;
}

export function queryViewState({ isLoading, error, itemCount }: QueryViewInput): QueryViewState {
  if (itemCount > 0) return 'ready';
  if (isLoading) return 'loading';
  if (error !== null && error !== undefined) return 'error';
  return 'empty';
}
