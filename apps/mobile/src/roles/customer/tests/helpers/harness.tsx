/**
 * Flow-B test harness: route `api.get` by path prefix, render inside a fresh
 * QueryClient, flush pending queries, find nodes by testID.
 */
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as client from '../../../../shell/api/client';
import { treeText } from './rnMock';

export type Routes = Record<string, unknown>;

/** Longest matching prefix wins; a function value is called with the path; an Error is thrown. */
export function mockGet(routes: Routes) {
  return vi.spyOn(client.api, 'get').mockImplementation(async (path: string) => {
    const key = Object.keys(routes)
      .sort((a, b) => b.length - a.length)
      .find((k) => path.startsWith(k));
    if (key === undefined) throw problem(404, 'NOT_FOUND');
    const v = routes[key];
    const out = typeof v === 'function' ? (v as (p: string) => unknown)(path) : v;
    if (out instanceof Error) throw out;
    return out as never;
  });
}

export function problem(status: number, code: string, extra: Record<string, unknown> = {}): client.ApiError {
  return new client.ApiError({ type: 'about:blank', title: code, status, code, detail: `${code} detail`, ...extra } as never);
}

export function newQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
}

export async function flush(times = 4): Promise<void> {
  for (let i = 0; i < times; i++) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
  }
}

export async function renderWith(qc: QueryClient, ui: React.ReactElement): Promise<renderer.ReactTestRenderer> {
  let root!: renderer.ReactTestRenderer;
  await act(async () => {
    root = renderer.create(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
  });
  await flush();
  return root;
}

export const byTestId = (root: renderer.ReactTestRenderer, id: string) => root.root.find((n) => n.props.testID === id);
export const hasTestId = (root: renderer.ReactTestRenderer, id: string) => root.root.findAll((n) => n.props.testID === id).length > 0;
export const textOf = (root: renderer.ReactTestRenderer) => treeText(root.toJSON());

export async function press(root: renderer.ReactTestRenderer, id: string): Promise<void> {
  await act(async () => {
    await byTestId(root, id).props.onPress();
  });
  await flush();
}
