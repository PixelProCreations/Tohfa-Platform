/**
 * FormAlert (packages/mobile-ui) — the shared inline field error / action-error banner
 * that replaced the full-screen ErrorState on form screens.
 *
 * Imported by relative path on purpose: @tohfa/mobile-ui's index pulls in native
 * modules (mapbox, safe-area) that cannot load in this plain-Node test runner.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestInstance } from 'react-test-renderer';
import { semantic } from '@tohfa/design-tokens';

const rn = vi.hoisted(() => {
  class AnimatedValue {
    constructor(public v: number) {}
    interpolate() {
      return this;
    }
    setValue(v: number) {
      this.v = v;
    }
  }
  return {
    AnimatedValue,
    timing: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
    reduceMotion: false,
  };
});

vi.mock('react-native', () => ({
  AccessibilityInfo: {
    isReduceMotionEnabled: () => Promise.resolve(rn.reduceMotion),
    addEventListener: () => ({ remove: () => undefined }),
  },
  Animated: { View: 'Animated.View', Value: rn.AnimatedValue, timing: rn.timing },
  Platform: { OS: 'android', select: (o: Record<string, unknown>) => o['android'] ?? o['default'] },
  StyleSheet: { create: <T,>(s: T) => s, flatten: (s: unknown) => s },
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));

import { FormAlert } from '../../../../packages/mobile-ui/src/FormAlert';

function flatStyle(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flatStyle));
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

const buttons = (tree: renderer.ReactTestRenderer) =>
  tree.root.findAll((n) => (n.type as unknown) === 'TouchableOpacity');

const alertNode = (tree: renderer.ReactTestRenderer) =>
  tree.root.find((n) => typeof n.type === 'string' && n.props.accessibilityRole === 'alert');

beforeEach(() => {
  rn.timing.mockClear();
  rn.reduceMotion = false;
});

describe('FormAlert: inline (field validation)', () => {
  it('announces the message as a polite alert with no buttons', async () => {
    const tree = await render(<FormAlert message="Enter a valid 10-digit mobile number." />);
    const alert = alertNode(tree);
    expect(alert.props.accessibilityLiveRegion).toBe('polite');
    expect(alert.props.accessibilityLabel).toBe('Enter a valid 10-digit mobile number.');
    expect(textOf(alert)).toContain('Enter a valid 10-digit mobile number.');
    expect(buttons(tree)).toHaveLength(0);
  });

  it('never shows Retry for a validation error, even if a handler is passed', async () => {
    const tree = await render(<FormAlert message="Invalid" onRetry={vi.fn()} retryLabel="Retry" />);
    expect(buttons(tree)).toHaveLength(0);
  });

  it('uses the danger token for text and the error tint token for its background', async () => {
    const tree = await render(<FormAlert message="Invalid" testID="f" />);
    const container = tree.root.find((n) => n.props.testID === 'f' && typeof n.type === 'string');
    expect(flatStyle(container.props.style).backgroundColor).toBe(semantic('errorLight'));
    const text = tree.root.find((n) => (n.type as unknown) === 'Text' && textOf(n) === 'Invalid');
    expect(flatStyle(text.props.style).color).toBe(semantic('danger'));
  });

  it('hides the decorative icon from the accessibility tree', async () => {
    const tree = await render(<FormAlert message="Invalid" />);
    const hidden = tree.root.findAll((n) => n.props.importantForAccessibility === 'no-hide-descendants');
    expect(hidden).toHaveLength(1);
    expect(hidden[0]!.props.accessibilityElementsHidden).toBe(true);
  });
});

describe('FormAlert: banner (action / server error)', () => {
  it('shows title + message and a Retry text button only when retryable', async () => {
    const onRetry = vi.fn();
    const tree = await render(
      <FormAlert
        variant="banner"
        title="Couldn't send the code"
        message="We couldn't send the SMS code."
        onRetry={onRetry}
        retryLabel="Retry"
        testID="b"
      />,
    );
    expect(textOf(alertNode(tree))).toContain("Couldn't send the code");
    const retry = tree.root.find((n) => n.props.testID === 'b-retry' && (n.type as unknown) === 'TouchableOpacity');
    expect(textOf(retry)).toBe('Retry');
    await act(async () => retry.props.onPress());
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('has no Retry when no retry handler is given', async () => {
    const tree = await render(<FormAlert variant="banner" message="Wrong password" retryLabel="Retry" testID="b" />);
    expect(tree.root.findAll((n) => n.props.testID === 'b-retry')).toHaveLength(0);
  });

  it('is dismissible through a labelled close button', async () => {
    const onDismiss = vi.fn();
    const tree = await render(
      <FormAlert variant="banner" message="Oops" onDismiss={onDismiss} dismissLabel="Close" testID="b" />,
    );
    const close = tree.root.find((n) => n.props.testID === 'b-dismiss' && (n.type as unknown) === 'TouchableOpacity');
    expect(close.props.accessibilityLabel).toBe('Close');
    await act(async () => close.props.onPress());
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('warning tone uses the warning tint token', async () => {
    const tree = await render(<FormAlert variant="banner" tone="warning" message="Wait" testID="b" />);
    const card = tree.root.find((n) => n.props.testID === 'b' && typeof n.type === 'string');
    expect(flatStyle(card.props.style).backgroundColor).toBe(semantic('warningLight'));
    expect(flatStyle(card.props.style).borderLeftColor).toBe(semantic('warning'));
  });
});

describe('FormAlert: motion', () => {
  it('fades/slides in with the native driver', async () => {
    await render(<FormAlert message="Invalid" />);
    expect(rn.timing).toHaveBeenCalled();
    const calls = rn.timing.mock.calls as unknown as Array<[unknown, { useNativeDriver: boolean; toValue: number }]>;
    expect(calls[0]![1]).toMatchObject({ toValue: 1, useNativeDriver: true });
  });

  it('skips the animation when the OS reduce-motion setting is on', async () => {
    rn.reduceMotion = true;
    // Once the async reduce-motion lookup has resolved, a new message must not animate.
    const tree = await render(<FormAlert message="A" />);
    rn.timing.mockClear();
    await act(async () => tree.update(<FormAlert message="B" />));
    expect(rn.timing).not.toHaveBeenCalled();
  });
});
