import React, { useEffect, useRef, useSyncExternalStore } from 'react';
import { StatusBar, View } from 'react-native';
import type { StatusBarStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Status-bar and navigation-bar insets for Android edge-to-edge.
 *
 * Why this exists: React Native 0.88 runs every Android app edge-to-edge
 * (Android 15+ enforces it at targetSdk 35+), so the app draws underneath
 * the status bar and the gesture/navigation bar. Before the 0.88 upgrade,
 * screens declared `<StatusBar backgroundColor={...} />`; Android then painted
 * an opaque bar in that colour and laid the app out *below* it. 0.88 removed
 * `backgroundColor` and `translucent`, and RN's own `SafeAreaView` is a no-op
 * on Android, so content started drawing under the clock and battery icons.
 *
 * This module restores the pre-0.88 behaviour without redesigning anything:
 *
 * - `ScreenStatusBar` is a drop-in for the old `<StatusBar barStyle
 *   backgroundColor translucent />`. It forwards `barStyle` to RN's
 *   `StatusBar` and records `backgroundColor` / `translucent` on a stack with
 *   the same semantics RN's StatusBar used for those props: the most recently
 *   mounted entry wins, an entry that leaves a prop undefined inherits it from
 *   the entries below, and unmounting pops the entry.
 * - `StatusBarInset`, mounted once at the app root, is a View exactly as tall
 *   as the status bar, painted in the colour the stack resolves to. Because it
 *   lives at the root (not inside each screen), it can never end up inside a
 *   ScrollView or under an absolutely positioned child.
 * - `NavigationBarInset`, also mounted once at the root, reserves the
 *   gesture/3-button navigation bar's height at the bottom.
 *
 * A screen that is deliberately full-bleed (a photo behind the status bar)
 * passes `translucent`; the root then reserves nothing at the top and the
 * screen pads its own foreground content with `useSafeAreaInsets()`.
 *
 * Modals render in their own Android window, outside the root, so these root
 * insets do not reach them; a modal that needs an inset reads
 * `useSafeAreaInsets()` itself.
 */

interface StatusBarEntry {
  readonly id: number;
  readonly backgroundColor: string | undefined;
  readonly translucent: boolean | undefined;
}

export interface ResolvedStatusBar {
  readonly backgroundColor: string | undefined;
  readonly translucent: boolean;
}

let entries: ReadonlyArray<StatusBarEntry> = [];
let nextId = 1;
const listeners = new Set<() => void>();

function setEntries(next: ReadonlyArray<StatusBarEntry>): void {
  entries = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getEntries(): ReadonlyArray<StatusBarEntry> {
  return entries;
}

/**
 * Pure merge of the stack, newest entry last. Exported for unit tests.
 * Each prop comes from the newest entry that defines it, as RN's StatusBar
 * merged its own prop stack.
 */
export function resolveStatusBar(
  stack: ReadonlyArray<Pick<StatusBarEntry, 'backgroundColor' | 'translucent'>>,
): ResolvedStatusBar {
  let backgroundColor: string | undefined;
  let translucent: boolean | undefined;
  for (let i = stack.length - 1; i >= 0; i -= 1) {
    const entry = stack[i];
    if (entry === undefined) continue;
    if (backgroundColor === undefined && entry.backgroundColor !== undefined) {
      backgroundColor = entry.backgroundColor;
    }
    if (translucent === undefined && entry.translucent !== undefined) {
      translucent = entry.translucent;
    }
  }
  return { backgroundColor, translucent: translucent ?? false };
}

export interface ScreenStatusBarProps {
  barStyle?: StatusBarStyle;
  /** Colour of the strip behind the status bar while this screen is on top. */
  backgroundColor?: string;
  /** Full-bleed screen: the root reserves no status-bar strip at all. */
  translucent?: boolean;
}

export function ScreenStatusBar({
  barStyle,
  backgroundColor,
  translucent,
}: ScreenStatusBarProps): React.ReactElement {
  const idRef = useRef<number | null>(null);

  // Push on mount, pop on unmount. Kept separate from the update effect below
  // so that a prop change replaces the entry in place instead of moving it to
  // the top of the stack (RN's StatusBar did the same).
  useEffect(() => {
    const id = nextId;
    nextId += 1;
    idRef.current = id;
    setEntries([...getEntries(), { id, backgroundColor: undefined, translucent: undefined }]);
    return () => {
      idRef.current = null;
      setEntries(getEntries().filter((entry) => entry.id !== id));
    };
  }, []);

  useEffect(() => {
    const id = idRef.current;
    if (id === null) return;
    setEntries(
      getEntries().map((entry) => (entry.id === id ? { id, backgroundColor, translucent } : entry)),
    );
  }, [backgroundColor, translucent]);

  return <StatusBar barStyle={barStyle} />;
}

export interface SystemBarInsetProps {
  /** Colour used when no mounted ScreenStatusBar has set one. */
  defaultColor: string;
}

export function StatusBarInset({ defaultColor }: SystemBarInsetProps): React.ReactElement | null {
  const insets = useSafeAreaInsets();
  const stack = useSyncExternalStore(subscribe, getEntries, getEntries);
  const resolved = resolveStatusBar(stack);
  if (resolved.translucent) return null;
  return (
    <View
      style={{ height: insets.top, backgroundColor: resolved.backgroundColor ?? defaultColor }}
    />
  );
}

export interface NavigationBarInsetProps {
  backgroundColor: string;
}

export function NavigationBarInset({
  backgroundColor,
}: NavigationBarInsetProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  return <View style={{ height: insets.bottom, backgroundColor }} />;
}
