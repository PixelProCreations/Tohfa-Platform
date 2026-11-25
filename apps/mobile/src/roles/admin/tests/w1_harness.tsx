/**
 * Shared render harness for the W1 (brief 07) finance render tests. Not a test
 * file itself: the w1_*.test.tsx files declare their own vi.mock calls (vitest
 * hoists those per file) and use these helpers to mount and read a screen.
 */
import React from 'react';
import renderer, { act, type ReactTestRendererJSON } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// react-test-renderer + TanStack Query: let act() know it is in a test environment.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** 25 Nov 2026, 12:00 IST: the day every expected report range below is computed from. */
export const W1_NOW = new Date('2026-11-25T06:30:00Z');
export const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function textOf(node: ReactTestRendererJSON | ReactTestRendererJSON[] | string | null): string[] {
  if (node === null) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(textOf);
  return (node.children ?? []).flatMap(textOf);
}

export const allText = (tree: renderer.ReactTestRenderer) => textOf(tree.toJSON()).join('\n');

export const byId = (tree: renderer.ReactTestRenderer, id: string) =>
  tree.root.findAll((n) => typeof n.type === 'string' && n.props.testID === id);

export async function flush() {
  for (let i = 0; i < 6; i += 1) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
  }
}

export async function mount(el: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(<QueryClientProvider client={client}>{el}</QueryClientProvider>);
  });
  await flush();
  return tree;
}

/** A designed control drawn as unavailable: disabled, announced as disabled, nothing to press. */
export function expectUnavailable(tree: renderer.ReactTestRenderer, id: string) {
  const nodes = byId(tree, id);
  if (nodes.length === 0) throw new Error(`no element with testID ${id}`);
  for (const node of nodes) {
    if (node.props.disabled !== true) throw new Error(`${id} is not disabled`);
    if (node.props.accessibilityState?.disabled !== true) throw new Error(`${id} does not announce disabled`);
    if (typeof node.props.onPress === 'function') throw new Error(`${id} still has an onPress`);
  }
}

/** Every from/to pair a report mock was called with. */
export function rangesOf(mock: { mock: { calls: unknown[][] } }): { from: string; to: string }[] {
  return mock.mock.calls.map((c) => c[0] as { from: string; to: string });
}
