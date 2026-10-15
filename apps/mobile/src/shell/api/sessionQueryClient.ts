/**
 * A TanStack Query client per signed-in session.
 *
 * roles/farmer/App.tsx never unmounts, so one long-lived cache would show the
 * previous account's data to whoever signs in next on the device. The
 * SessionQueryProvider asks a holder for the client of the current session
 * key (App's `sessionEpoch`, bumped on every sign-out); a new key gets a new
 * client and the old cache is cleared. Pure (no React) so plain-Node vitest
 * can pin it; see ./sessionQueryClient.test.ts.
 */
import { QueryClient } from '@tanstack/react-query';

/**
 * How long fetched data counts as fresh before a remount refetches it. A UX
 * caching window, not a business threshold: it only saves a refetch when the
 * admin steps back and forth between screens.
 */
export const SESSION_QUERY_STALE_TIME_MS = 30_000;

export function createSessionQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: SESSION_QUERY_STALE_TIME_MS,
        // One quiet retry for a flaky connection; after that the screen shows
        // its error state with a Retry the admin can see.
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        // Never replay a write on its own: the screen decides, with the same
        // Idempotency-Key (root CLAUDE.md 2.4).
        retry: 0,
      },
    },
  });
}

export interface SessionClientHolder {
  /** The client for `sessionKey`; a new key replaces (and clears) the previous client. */
  clientFor: (sessionKey: unknown) => QueryClient;
  /**
   * Clears the current client's cache (the provider unmounting). The client
   * itself is kept, so a remount of the same session (React StrictMode's
   * double effect run) keeps using the client its provider already holds.
   */
  dispose: () => void;
}

export function createSessionClientHolder(create: () => QueryClient = createSessionQueryClient): SessionClientHolder {
  let current: { sessionKey: unknown; client: QueryClient } | null = null;
  return {
    clientFor(sessionKey: unknown): QueryClient {
      if (current === null || current.sessionKey !== sessionKey) {
        current?.client.clear();
        current = { sessionKey, client: create() };
      }
      return current.client;
    },
    dispose(): void {
      current?.client.clear();
    },
  };
}
