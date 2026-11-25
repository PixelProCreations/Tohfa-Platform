/**
 * Role-scoped Poppins font injection for Farmer and Admin screens, applied centrally instead of
 * editing hundreds of screens.
 *
 * How:
 * - In React Native 0.88+ / React 19, `Text` and `TextInput` are plain function components rather
 *   than `React.forwardRef` objects.
 * - In older RN versions (and some test mocks), `Text`/`TextInput` are `React.forwardRef` objects
 *   carrying their component function on `.render`.
 *
 * `patchTextComponent` handles both shapes (patching `.render` in place on forwardRef objects, or
 * wrapping function components and reinstalling the property descriptor on the container module),
 * reading `FarmerFontContext` on every render and injecting `applyPoppins(props.style)` whenever
 * enabled. Imported first in `apps/mobile/index.js` before any screen evaluates `react-native`.
 *
 * Customer screens render with `FarmerFontProvider enabled={false}` so Customer typography stays
 * on its own fonts (`System`/`sans-serif` + `ArchitectsDaughter-Regular`).
 */
import React, { createContext, useContext } from 'react';
import * as RN from 'react-native';
import { applyPoppins } from './fonts';

export { isFarmerFontScreen } from './farmerFontScreens';

const FarmerFontContext = createContext(false);

export function FarmerFontProvider(props: {
  enabled: boolean;
  children?: React.ReactNode;
}): React.JSX.Element {
  return <FarmerFontContext.Provider value={props.enabled}>{props.children}</FarmerFontContext.Provider>;
}

/** True when rendered under an enabled FarmerFontProvider. */
export function useFarmerFont(): boolean {
  return useContext(FarmerFontContext);
}

type RenderFn = (props: Record<string, unknown>, ref: unknown) => unknown;
type PatchedFlagged = { __tohfaFarmerFont?: boolean };
interface ForwardRefLike {
  render?: RenderFn & PatchedFlagged;
}
type FunctionComponentLike = ((props: Record<string, unknown>) => unknown) & PatchedFlagged;

/** Wraps a `React.forwardRef` object's `.render` in place. Safe to call twice. */
export function patchForwardRef(target: unknown): boolean {
  const t = target as ForwardRefLike | null | undefined;
  const original = t?.render;
  if (!t || typeof original !== 'function' || original.__tohfaFarmerFont) return false;
  const patched = function patchedRender(
    this: unknown,
    props: Record<string, unknown>,
    ref: unknown,
  ): unknown {
    // The hook runs on every render, enabled or not, so hook order never changes.
    const enabled = useContext(FarmerFontContext);
    if (!enabled) return original.call(this, props, ref);
    return original.call(this, { ...props, style: applyPoppins(props['style']) }, ref);
  } as RenderFn & PatchedFlagged;
  patched.__tohfaFarmerFont = true;
  t.render = patched;
  return true;
}

/**
 * Wraps a React 19 / RN 0.88+ function component (e.g. `TextImpl`, `TextInput`) or a
 * `React.forwardRef` object on `container[key]`. Returns true when a patch was installed.
 */
export function patchTextComponent(container: Record<string, unknown>, key: string): boolean {
  let target: unknown;
  try {
    target = container[key];
  } catch {
    return false;
  }
  if (!target) return false;

  if (typeof target === 'object') {
    return patchForwardRef(target);
  }

  if (typeof target !== 'function') return false;
  const original = target as FunctionComponentLike;
  if (original.__tohfaFarmerFont) return false;

  const wrapped = function patchedTextComponent(
    this: unknown,
    props: Record<string, unknown>,
  ): unknown {
    const enabled = useContext(FarmerFontContext);
    if (!enabled) return original.call(this, props);
    return original.call(this, { ...props, style: applyPoppins(props['style']) });
  } as FunctionComponentLike;

  // Preserve static fields like `displayName` and `TextInput.State`.
  try {
    Object.assign(wrapped, original);
  } catch {
    // ignore non-assignable statics
  }
  wrapped.__tohfaFarmerFont = true;

  try {
    Object.defineProperty(container, key, {
      configurable: true,
      enumerable: true,
      get: () => wrapped,
    });
    return true;
  } catch {
    return false;
  }
}

export function installFarmerFontPatch(): void {
  const ns = RN as unknown as Record<string, unknown>;
  let rn: Record<string, unknown> = ns;
  try {
    const def = ns['default'];
    if (typeof def === 'object' && def !== null) {
      rn = def as Record<string, unknown>;
    }
  } catch {
    // mocked react-native without default export (vitest)
  }
  for (const name of ['Text', 'TextInput'] as const) {
    patchTextComponent(rn, name);
  }
}

installFarmerFontPatch();
