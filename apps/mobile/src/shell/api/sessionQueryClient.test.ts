/**
 * The per-session TanStack Query client (SessionQueryProvider). App.tsx never
 * unmounts, so a single long-lived cache would show one signed-in admin's
 * rows to the next person who signs in on the same device. The provider builds
 * a new client for every session key (App's sign-out counter) and clears the
 * old one; these tests pin the pure pieces it is built from.
 */
import { describe, expect, it } from 'vitest';
import {
  SESSION_QUERY_STALE_TIME_MS,
  createSessionClientHolder,
  createSessionQueryClient,
} from './sessionQueryClient';

describe('createSessionQueryClient', () => {
  it('queries: about 30 s stale time and one retry; mutations: no retry', () => {
    const defaults = createSessionQueryClient().getDefaultOptions();
    expect(SESSION_QUERY_STALE_TIME_MS).toBe(30_000);
    expect(defaults.queries?.staleTime).toBe(SESSION_QUERY_STALE_TIME_MS);
    expect(defaults.queries?.retry).toBe(1);
    expect(defaults.mutations?.retry).toBe(0);
  });

  it('every call is a separate cache', () => {
    const a = createSessionQueryClient();
    const b = createSessionQueryClient();
    a.setQueryData(['admin', 'orders', 'wh-a', {}], ['row']);
    expect(b.getQueryData(['admin', 'orders', 'wh-a', {}])).toBeUndefined();
  });
});

describe('createSessionClientHolder', () => {
  it('keeps the same client for the same session', () => {
    const holder = createSessionClientHolder();
    expect(holder.clientFor(1)).toBe(holder.clientFor(1));
  });

  it('BR-30: a new session gets a new client and the old cache is cleared', () => {
    const holder = createSessionClientHolder();
    const first = holder.clientFor(1);
    first.setQueryData(['admin', 'orders', 'wh-a', {}], ['previous admin row']);

    const second = holder.clientFor(2);
    expect(second).not.toBe(first);
    expect(second.getQueryData(['admin', 'orders', 'wh-a', {}])).toBeUndefined();
    expect(first.getQueryData(['admin', 'orders', 'wh-a', {}])).toBeUndefined();
  });

  it('dispose() clears the current client', () => {
    const holder = createSessionClientHolder();
    const client = holder.clientFor(1);
    client.setQueryData(['k'], 1);
    holder.dispose();
    expect(client.getQueryData(['k'])).toBeUndefined();
  });
});
