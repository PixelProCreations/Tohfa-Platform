/**
 * Provides a TanStack Query client that lives exactly as long as one signed-in
 * session. Pass App's sign-out counter as `sessionKey`: when it changes the
 * provider switches to a fresh client and clears the old cache, so one
 * account's data never renders for the next (see ./sessionQueryClient.ts).
 *
 * A role that mounts its own QueryClientProvider underneath (the customer
 * app) keeps using its own client: the nearest provider wins.
 */
import React, { useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createSessionClientHolder } from './sessionQueryClient';

export { createSessionQueryClient } from './sessionQueryClient';

export interface SessionQueryProviderProps {
  sessionKey: unknown;
  children: React.ReactNode;
}

export function SessionQueryProvider({ sessionKey, children }: SessionQueryProviderProps) {
  const [holder] = useState(createSessionClientHolder);
  // Switching happens during render on purpose: the first render of a new
  // session must already read from the new, empty cache. Idempotent for a
  // given key, so a repeated render does not swap clients again.
  const client = holder.clientFor(sessionKey);
  useEffect(() => () => holder.dispose(), [holder]);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
