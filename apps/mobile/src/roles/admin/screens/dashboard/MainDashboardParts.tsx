/**
 * The loading / error / empty gate the Main Warehouse dashboard puts around
 * every section that reads a query. It draws the shared states
 * (screens/warehouse/shared/AsyncStates.tsx); which one is chosen is pure, in
 * ./mappers_mainDashboard.ts. Kept out of the screen file so that file only
 * wires data to sections.
 */
import React from 'react';
import { AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import { combineSources, sectionStatus, type Derived, type QueryLike, type SectionStatus } from './mappers_mainDashboard';

/** One query a section depends on: its status, what it threw, and how to run it again. */
export interface SectionSource {
  status: SectionStatus;
  error: unknown;
  retry: () => void;
}

/** A TanStack query result as a gate source; Retry refetches that query. */
export function sourceOf(query: QueryLike & { refetch: () => unknown }): SectionSource {
  return {
    status: sectionStatus(query),
    error: query.error,
    retry: () => {
      void query.refetch();
    },
  };
}

/**
 * A failed derivation (a malformed quantity or amount from the server) as a
 * source: error, like a failed request, so the figure is never shown as 0.
 * `retry` reloads the data the figure came from.
 */
export function derivedSource(derived: Derived<unknown> | null, retry: () => void): SectionSource {
  return {
    status: derived !== null && !derived.ok ? 'error' : 'ready',
    // Not an ApiError or NetworkError, so adminErrorKey words it as the generic admin error.
    error: derived !== null && !derived.ok ? new Error('dashboard data') : null,
    retry,
  };
}

/** Several sources as one: ready when all are, error when one failed, Retry on the failed ones. */
export function mergeSources(...sources: SectionSource[]): SectionSource {
  return {
    status: statusOf(sources),
    error: sources.find((s) => s.status === 'error')?.error ?? null,
    retry: () => retryFailed(sources),
  };
}

/** Status of a group of sources (ready only when all are). */
export function statusOf(sources: readonly SectionSource[]): SectionStatus {
  return combineSources(sources.map((s) => s.status));
}

/** Runs Retry on the sources that failed, not on the ones that are fine. */
export function retryFailed(sources: readonly SectionSource[]): void {
  for (const source of sources) if (source.status === 'error') source.retry();
}

export interface SectionGateProps {
  sources: readonly SectionSource[];
  children: React.ReactNode;
}

/**
 * Loading indicator while any source is loading, an error with Retry when one
 * failed, and the children only once every source has answered. Empty is the
 * caller's: whether "no rows" is a valid result depends on the section.
 */
export function SectionGate({ sources, children }: SectionGateProps) {
  const status = statusOf(sources);
  if (status === 'loading') return <AdminLoadingState />;
  if (status === 'error') {
    const failed = sources.find((s) => s.status === 'error');
    return <AdminErrorState error={failed?.error} onRetry={() => retryFailed(sources)} />;
  }
  return <>{children}</>;
}
