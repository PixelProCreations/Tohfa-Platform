/**
 * The Main Warehouse dashboard's data derivation, as pure functions (no React,
 * no react-native import) so plain-Node vitest covers every figure it shows
 * (tests/mappers_mainDashboard.test.ts). The screen only passes query results
 * in and draws what comes out.
 *
 * Rule for every figure here: a number is drawn only from data the server has
 * actually returned. While a source query is loading or has failed the screen
 * shows FIGURE_PLACEHOLDER or an error with Retry (sectionStatus below), never
 * a zero, "All Warehouses Normal" or "No alerts" that the server did not say.
 */
import { queryViewState } from '../warehouse/shared/queryViewState';

// ─── View states ─────────────────────────────────────────────────────────────

/** What a dashboard section draws: its data is not here yet, it failed, or it is here. */
export type SectionStatus = 'loading' | 'error' | 'ready';

/** The slice of a TanStack query result `sectionStatus` reads. */
export interface QueryLike {
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  data: unknown;
}

/**
 * Built on the shared queryViewState so the dashboard behaves like every other
 * live screen. `data` being defined is the "item on screen" (an empty list is
 * still data: it is a real, successful "none"). A Retry running after an error
 * counts as loading, and a failed refresh never blanks data already shown.
 */
export function sectionStatus(query: QueryLike): SectionStatus {
  const view = queryViewState({
    isLoading: query.isLoading || (query.isFetching && query.data === undefined),
    error: query.error,
    itemCount: query.data === undefined ? 0 : 1,
  });
  if (view === 'ready') return 'ready';
  if (view === 'error') return 'error';
  // 'loading', or 'empty' with no data at all (a query that has not started): not ready.
  return 'loading';
}

/**
 * The status of a section fed by several queries: ready only when all are. An
 * error wins over loading, so one failed source is not hidden behind a slow one.
 */
export function combineSources(statuses: readonly SectionStatus[]): SectionStatus {
  if (statuses.includes('error')) return 'error';
  if (statuses.includes('loading')) return 'loading';
  return 'ready';
}

/** Shown in place of a figure whose source is not ready (an em dash, not a word). */
export const FIGURE_PLACEHOLDER = '—';

/** `format()` once `status` is ready, FIGURE_PLACEHOLDER before that (format is not called). */
export function figureOrPlaceholder(status: SectionStatus, format: () => string): string {
  return status === 'ready' ? format() : FIGURE_PLACEHOLDER;
}
