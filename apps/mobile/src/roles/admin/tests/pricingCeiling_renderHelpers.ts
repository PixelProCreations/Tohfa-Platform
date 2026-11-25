/**
 * Shared helpers for the Market & Pricing render tests (pricingHome_*,
 * pricingCeiling_*, pricingHistory_*). Not a test file itself. The vi.mock
 * calls stay in each test file (vitest hoists them per file).
 */
import { expect, vi } from 'vitest';
import type React from 'react';
import renderer, { act, type ReactTestInstance, type ReactTestRendererJSON } from 'react-test-renderer';
import type { FairPriceDto, RetailPriceDto } from '../api/pricing';

export function textOf(node: ReactTestRendererJSON | ReactTestRendererJSON[] | string | null): string[] {
  if (node === null) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(textOf);
  return (node.children ?? []).flatMap(textOf);
}

/** Every text node joined; adjacent JSX strings of one Text are joined without a separator first. */
export function allText(tree: renderer.ReactTestRenderer): string {
  const texts = tree.root.findAll((n) => (n.type as unknown) === 'Text');
  const joined = texts.map((n) => flat(n.props.children as unknown)).join('\n');
  return `${textOf(tree.toJSON()).join('\n')}\n${joined}`;
}

function flat(children: unknown): string {
  if (children === null || children === undefined || typeof children === 'boolean') return '';
  if (Array.isArray(children)) return children.map(flat).join('');
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  return '';
}

/** The text inside one rendered node (e.g. a card found by testID). */
export function textIn(node: ReactTestInstance): string {
  return node
    .findAll((n) => (n.type as unknown) === 'Text')
    .map((n) => flat(n.props.children as unknown))
    .join('\n');
}

export async function mount(element: React.ReactElement): Promise<renderer.ReactTestRenderer> {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(element);
  });
  return tree;
}

export function byTestId(tree: renderer.ReactTestRenderer, id: string): ReactTestInstance[] {
  return tree.root.findAll((n) => typeof n.type === 'string' && n.props.testID === id);
}

export async function press(tree: renderer.ReactTestRenderer, id: string): Promise<void> {
  const [node] = byTestId(tree, id);
  expect(node, `no pressable with testID ${id}`).toBeDefined();
  await act(async () => {
    (node!.props.onPress as () => void)();
  });
}

export async function typeInto(tree: renderer.ReactTestRenderer, id: string, text: string): Promise<void> {
  const [node] = byTestId(tree, id);
  expect(node, `no input with testID ${id}`).toBeDefined();
  await act(async () => {
    (node!.props.onChangeText as (v: string) => void)(text);
  });
}

export interface ListOver<T> {
  items?: T[];
  hasMore?: boolean;
  isLoading?: boolean;
  error?: unknown;
}

export function cursorList<T>(over: ListOver<T> = {}) {
  return {
    items: over.items ?? [],
    firstPage: undefined,
    loadMore: vi.fn(),
    hasMore: over.hasMore ?? false,
    isLoading: over.isLoading ?? false,
    error: over.error ?? null,
    refresh: vi.fn(),
    isRefreshing: false,
  };
}

export const TODAY = '2026-11-10';

export function fairDto(over: Partial<FairPriceDto> = {}): FairPriceDto {
  return {
    id: 'fp-1',
    cropId: 'crop-okra',
    cropName: 'Okra Live',
    grade: 'GRADE_1',
    ceilingPrice: '61.25',
    frequency: 'DAILY',
    effectiveFrom: '2026-11-01',
    effectiveTo: null,
    setBy: 'user-uuid-1',
    notes: null,
    ...over,
  };
}

export function retailDto(over: Partial<RetailPriceDto> = {}): RetailPriceDto {
  return {
    id: 'rp-1',
    cropId: 'crop-okra',
    cropName: 'Okra Live',
    grade: 'GRADE_1',
    price: '58.00',
    ceilingPrice: '61.25',
    markupPct: 12,
    gstInclusive: true,
    effectiveFrom: '2026-11-02',
    effectiveTo: null,
    ...over,
  };
}

/** Names, prices and ids from the design branch's fixtures; none may ever render. */
export const DESIGN_SAMPLES = [
  'Tomato',
  'Carrot',
  'Cabbage',
  'Beans',
  'Capsicum',
  'Potato',
  'Demo Super Admin',
  'Priya Nair',
  'Suresh Admin',
  'FP-0001',
  'FP-0013',
  'PH-0034',
  'CO-0001',
  'LST-2004',
  'AUD-134',
  '10 / 11',
  '2 / 4',
  'Not used',
  '₹100/kg',
  '₹120/kg',
  'Weekly',
];
