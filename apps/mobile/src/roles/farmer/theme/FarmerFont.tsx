/**
 * Farmer-role Poppins, applied centrally instead of editing ~120 screens.
 *
 * How: react-native's `Text` and `TextInput` are React.forwardRef objects (Libraries/Text/Text.js,
 * Libraries/Components/TextInput/TextInput.js, both `module.exports` a forwardRef). A forwardRef
 * object carries its component function in `.render`, which React calls on every render, so
 * replacing `.render` once intercepts every <Text>/<TextInput> in the bundle.
 *
 * Why it is NOT global: this binary also renders the customer and admin roles from farmer/App.tsx,
 * and they keep their own typography. The patched render reads FarmerFontContext and does nothing
 * unless an ancestor FarmerFontProvider says `enabled`. App.tsx enables it only for farmer-owned
 * screens (see farmerFontScreens.ts); CustomerMain and all admin screens render with it off.
 *
 * Importing this module installs the patch (idempotent).
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
interface ForwardRefLike {
  render?: RenderFn & { __tohfaFarmerFont?: boolean };
}

/** Wraps `target.render` so style gets Poppins when the context is on. Safe to call twice. */
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
  } as RenderFn & { __tohfaFarmerFont?: boolean };
  patched.__tohfaFarmerFont = true;
  t.render = patched;
  return true;
}

export function installFarmerFontPatch(): void {
  // Read inside try: `Text` is a lazy getter on the RN index, and tests that mock react-native
  // without these components throw on access instead of returning undefined.
  for (const name of ['Text', 'TextInput'] as const) {
    try {
      patchForwardRef((RN as Record<string, unknown>)[name]);
    } catch {
      // component not available (mocked react-native): nothing to patch
    }
  }
}

installFarmerFontPatch();
