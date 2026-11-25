/**
 * EmptyState (packages/mobile-ui) — the one "no data" UI every role's screens
 * render instead of their own ad-hoc empty Text/icon blocks.
 *
 * Imported by relative path on purpose: @tohfa/mobile-ui's index pulls in native
 * modules (mapbox, safe-area) that cannot load in this plain-Node test runner.
 */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestInstance } from 'react-test-renderer';
import { tokens } from '@tohfa/design-tokens';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Platform: { OS: 'android', select: (o: Record<string, unknown>) => o['android'] ?? o['default'] },
  StyleSheet: { create: <T,>(s: T) => s, flatten: (s: unknown) => s },
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));

import { EmptyState } from '../../../../packages/mobile-ui/src/EmptyState';
import { defaultMobileTheme } from '../../../../packages/mobile-ui/src/theme';

function flatStyle(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) return Object.assign({}, ...style.filter(Boolean).map(flatStyle));
  return (style as Record<string, unknown> | null | undefined) ?? {};
}

function textOf(node: ReactTestInstance | string): string {
  if (typeof node === 'string') return node;
  return node.children.map(textOf).join('');
}

async function render(el: React.ReactElement): Promise<renderer.ReactTestRenderer> {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(el);
  });
  return tree;
}

const host = (tree: renderer.ReactTestRenderer, type: string) =>
  tree.root.findAll((n) => (n.type as unknown) === type);

const rootView = (tree: renderer.ReactTestRenderer, testID: string) =>
  tree.root.find((n) => n.props.testID === testID && (n.type as unknown) === 'View');

/** The Icon renders one Text whose font is the Material Symbols family. */
const iconTexts = (tree: renderer.ReactTestRenderer) =>
  host(tree, 'Text').filter((n) => String(flatStyle(n.props.style).fontFamily ?? '').includes('MaterialSymbols'));

describe('EmptyState: backwards-compatible API (title / message / iconName)', () => {
  it('renders the title and message it is given', async () => {
    const tree = await render(<EmptyState title="No orders yet" message="Your orders will appear here." />);
    const all = host(tree, 'Text').map(textOf);
    expect(all).toContain('No orders yet');
    expect(all).toContain('Your orders will appear here.');
  });

  it('omits the message line when none is given', async () => {
    const tree = await render(<EmptyState title="No orders yet" />);
    const nonIcon = host(tree, 'Text').filter((n) => !iconTexts(tree).includes(n));
    expect(nonIcon.map(textOf)).toEqual(['No orders yet']);
  });

  it('shows the default icon at the full-size token, hidden from screen readers', async () => {
    const tree = await render(<EmptyState title="Empty" />);
    const icons = iconTexts(tree);
    expect(icons).toHaveLength(1);
    expect(flatStyle(icons[0]!.props.style).fontSize).toBe(tokens.size.emptyStateIcon);
    const hidden = tree.root.findAll((n) => n.props.importantForAccessibility === 'no-hide-descendants');
    expect(hidden).toHaveLength(1);
    expect(hidden[0]!.props.accessibilityElementsHidden).toBe(true);
  });

  it('draws the icon in the theme primary on a round primaryTint badge sized from tokens', async () => {
    const tree = await render(<EmptyState title="Empty" />);
    const badge = tree.root.find((n) => n.props.importantForAccessibility === 'no-hide-descendants');
    const b = flatStyle(badge.props.style);
    expect(b.width).toBe(tokens.size.emptyStateBadge);
    expect(b.height).toBe(tokens.size.emptyStateBadge);
    expect(b.borderRadius).toBe(defaultMobileTheme.radius.pill);
    expect(b.backgroundColor).toBe(defaultMobileTheme.colors.primaryTint);
    expect(flatStyle(iconTexts(tree)[0]!.props.style).color).toBe(defaultMobileTheme.colors.primary);
  });

  it('caps the screen title and message at the readable max width token', async () => {
    const tree = await render(<EmptyState title="T" message="M" />);
    for (const s of ['T', 'M']) {
      const node = host(tree, 'Text').find((n) => textOf(n) === s)!;
      expect(flatStyle(node.props.style).maxWidth).toBe(tokens.size.emptyStateTextMaxWidth);
    }
  });

  it('hides the icon entirely when iconName is null', async () => {
    const tree = await render(<EmptyState title="Empty" iconName={null} />);
    expect(iconTexts(tree)).toHaveLength(0);
  });

  it('takes its text colours from the theme, not literals', async () => {
    const tree = await render(<EmptyState title="T" message="M" />);
    const title = host(tree, 'Text').find((n) => textOf(n) === 'T')!;
    const message = host(tree, 'Text').find((n) => textOf(n) === 'M')!;
    expect(flatStyle(title.props.style).color).toBe(defaultMobileTheme.colors.onSurface);
    expect(flatStyle(message.props.style).color).toBe(defaultMobileTheme.colors.textMuted);
  });
});

describe('EmptyState: action', () => {
  it('renders no button without an action', async () => {
    const tree = await render(<EmptyState title="Empty" testID="e" />);
    expect(host(tree, 'TouchableOpacity')).toHaveLength(0);
  });

  it('renders a labelled primary button that calls onPress', async () => {
    const onPress = vi.fn();
    const tree = await render(
      <EmptyState title="No listings" action={{ label: 'Create listing', onPress, testID: 'create' }} />,
    );
    const btn = tree.root.find((n) => n.props.testID === 'create' && (n.type as unknown) === 'TouchableOpacity');
    expect(textOf(btn)).toBe('Create listing');
    await act(async () => btn.props.onPress());
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('derives the button testID from the root testID when the action has none', async () => {
    const tree = await render(<EmptyState title="Empty" testID="cart-empty" action={{ label: 'Shop', onPress: vi.fn() }} />);
    expect(
      tree.root.findAll((n) => n.props.testID === 'cart-empty-action' && (n.type as unknown) === 'TouchableOpacity'),
    ).toHaveLength(1);
  });
});

describe('EmptyState: variants and testID', () => {
  it('puts testID on the root view so tests of replaced ad-hoc blocks keep finding it', async () => {
    const tree = await render(<EmptyState title="Empty" testID="orders-empty" />);
    expect(textOf(rootView(tree, 'orders-empty'))).toContain('Empty');
  });

  it('screen (default) uses the large padding and full icon size', async () => {
    const tree = await render(<EmptyState title="Empty" testID="s" />);
    const style = flatStyle(rootView(tree, 's').props.style);
    expect(style.paddingVertical).toBe(defaultMobileTheme.spacing.xxl);
    expect(style.paddingHorizontal).toBe(defaultMobileTheme.spacing.xxl);
    expect(style.alignItems).toBe('center');
  });

  it('compact uses tighter padding, the compact icon token and a smaller title', async () => {
    const tree = await render(<EmptyState title="Nothing yet" variant="compact" testID="c" />);
    const style = flatStyle(rootView(tree, 'c').props.style);
    // Was spacing.xl, then spacing.lg, vertically; the compact variant is now
    // a tight horizontal inset panel (md vertical, lg horizontal).
    expect(style.paddingVertical).toBe(defaultMobileTheme.spacing.md);
    expect(style.paddingHorizontal).toBe(defaultMobileTheme.spacing.lg);
    expect(flatStyle(iconTexts(tree)[0]!.props.style).fontSize).toBe(tokens.size.emptyStateIconCompact);
    const title = host(tree, 'Text').find((n) => textOf(n) === 'Nothing yet')!;
    expect(flatStyle(title.props.style).fontSize).toBe(defaultMobileTheme.typography.body);
  });

  it('compact is a rounded inset panel: badge on the left, text left-aligned', async () => {
    const tree = await render(<EmptyState title="Nothing yet" message="Add one" variant="compact" testID="c" />);
    const style = flatStyle(rootView(tree, 'c').props.style);
    expect(style.flexDirection).toBe('row');
    expect(style.backgroundColor).toBe(defaultMobileTheme.colors.surfaceVariant);
    expect(style.borderRadius).toBe(defaultMobileTheme.radius.lg);
    const title = host(tree, 'Text').find((n) => textOf(n) === 'Nothing yet')!;
    expect(flatStyle(title.props.style).textAlign).toBe('left');
  });

  it('compact top-aligns the badge and uses a small action button', async () => {
    const tree = await render(
      <EmptyState title="Nothing yet" message="Add one" variant="compact" testID="c" action={{ label: 'Add', onPress: () => {} }} />,
    );
    expect(flatStyle(rootView(tree, 'c').props.style).alignItems).toBe('flex-start');
    const btn = tree.root.find((n) => n.props.testID === 'c-action' && (n.type as unknown) === 'TouchableOpacity');
    const b = flatStyle(btn.props.style);
    expect(b.minHeight).toBe(tokens.size.buttonSmallHeight);
    expect(b.paddingHorizontal).toBe(defaultMobileTheme.spacing.md);
    expect(b.alignSelf).toBe('flex-start');
    expect(b.marginTop).toBe(defaultMobileTheme.spacing.sm);
    expect(btn.props.hitSlop.top).toBe(Math.ceil((tokens.size.minTouchTarget - tokens.size.buttonSmallHeight) / 2));
  });

  it('screen action button keeps the default md size', async () => {
    const tree = await render(<EmptyState title="Empty" testID="s" action={{ label: 'Go', onPress: () => {} }} />);
    const btn = tree.root.find((n) => n.props.testID === 's-action' && (n.type as unknown) === 'TouchableOpacity');
    expect(flatStyle(btn.props.style).minHeight).toBe(tokens.size.minTouchTarget);
  });

  it('merges a caller layout style last', async () => {
    const tree = await render(<EmptyState title="Empty" testID="s" style={{ flex: 1 }} />);
    expect(flatStyle(rootView(tree, 's').props.style).flex).toBe(1);
  });
});
