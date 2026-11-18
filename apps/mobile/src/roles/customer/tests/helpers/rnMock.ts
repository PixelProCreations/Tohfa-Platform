/**
 * Shared `react-native` / svg / image stubs for the flow-B screen tests:
 *   vi.mock('react-native', async () => (await import('./helpers/rnMock')).rnMock());
 *   vi.mock('react-native-svg', async () => (await import('./helpers/rnMock')).svgMock());
 * Host components render as plain string elements so trees can be inspected;
 * Modal renders children only while `visible`.
 */
import React from 'react';
import { vi } from 'vitest';

export function rnMock(): Record<string, unknown> {
  class AnimatedValue {
    constructor(public v: number) {}
    interpolate() {
      return this;
    }
    setValue(v: number) {
      this.v = v;
    }
  }
  const anim = () => ({ start: (cb?: () => void) => cb?.(), stop: () => undefined });
  return {
    ActivityIndicator: 'ActivityIndicator',
    Alert: { alert: vi.fn() },
    Animated: {
      View: 'Animated.View',
      ScrollView: 'Animated.ScrollView',
      Text: 'Animated.Text',
      Value: AnimatedValue,
      timing: anim,
      spring: anim,
      loop: anim,
      sequence: anim,
      parallel: anim,
      event: () => () => undefined,
    },
    Dimensions: { get: () => ({ width: 390, height: 844 }) },
    FlatList: (props: { data?: unknown[]; renderItem?: (a: { item: unknown; index: number }) => React.ReactNode; keyExtractor?: (i: unknown, n: number) => string; ListFooterComponent?: React.ReactNode }) =>
      React.createElement(
        'FlatList',
        null,
        (props.data ?? []).map((item, index) =>
          React.createElement(React.Fragment, { key: props.keyExtractor ? props.keyExtractor(item, index) : String(index) }, props.renderItem?.({ item, index })),
        ),
        props.ListFooterComponent ?? null,
      ),
    Image: 'Image',
    Keyboard: { dismiss: vi.fn(), addListener: vi.fn(() => ({ remove: vi.fn() })) },
    KeyboardAvoidingView: 'KeyboardAvoidingView',
    Linking: { openURL: vi.fn(async () => true) },
    Modal: (props: { visible?: boolean; children?: React.ReactNode }) => (props.visible ? React.createElement('Modal', null, props.children) : null),
    Platform: { OS: 'ios', select: (o: Record<string, unknown>) => o['ios'] ?? o['default'] },
    Pressable: 'Pressable',
    RefreshControl: 'RefreshControl',
    SafeAreaView: 'SafeAreaView',
    ScrollView: 'ScrollView',
    Share: { share: vi.fn(async () => ({ action: 'sharedAction' })) },
    StatusBar: Object.assign(() => null, { currentHeight: 24 }),
    StyleSheet: { create: <T,>(s: T) => s, hairlineWidth: 1, absoluteFill: {}, absoluteFillObject: {}, flatten: (s: unknown) => s },
    Switch: 'Switch',
    Text: 'Text',
    TextInput: 'TextInput',
    TouchableOpacity: 'TouchableOpacity',
    TouchableWithoutFeedback: 'TouchableWithoutFeedback',
    View: 'View',
  };
}

export function svgMock(): Record<string, unknown> {
  return { default: 'Svg', Svg: 'Svg', Path: 'Path', Circle: 'Circle', Rect: 'Rect', G: 'G', Line: 'Line', Defs: 'Defs', LinearGradient: 'LinearGradient', Stop: 'Stop', Polyline: 'Polyline', Ellipse: 'Ellipse' };
}

/** All visible text in a rendered tree, joined. */
export function treeText(node: unknown): string {
  if (node == null) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(treeText).join(' ');
  const n = node as { children?: unknown };
  return treeText(n.children ?? null);
}
