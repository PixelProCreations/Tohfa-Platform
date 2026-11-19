/**
 * Poppins family selection for the farmer role.
 *
 * Why family-per-weight instead of `fontWeight`: React Native cannot pick a weight out of a single
 * custom family on Android -- it needs one family name per weight file, and leaving `fontWeight` on
 * the style as well causes synthetic bolding on top of the already-bold file. The names live in
 * @tohfa/design-tokens (`fontFamily`) and are the file / PostScript names, so they resolve
 * identically on Android (assets/fonts) and iOS (UIAppFonts). Poppins italics are not bundled, so
 * `fontStyle` is deliberately ignored.
 *
 * Pure on purpose (no react-native import) so it is unit-testable.
 */
import { tokens } from '@tohfa/design-tokens';

export type FontWeightInput = string | number | null | undefined;

export function poppinsFamilyForWeight(weight?: FontWeightInput): string {
  const f = tokens.fontFamily;
  if (weight === undefined || weight === null || weight === 'normal') return f.regular;
  if (weight === 'bold') return f.bold;
  const n = typeof weight === 'number' ? weight : parseInt(weight, 10);
  if (!Number.isFinite(n) || n <= 400) return f.regular;
  if (n < 600) return f.medium;
  if (n < 700) return f.semibold;
  if (n < 800) return f.bold;
  return f.extrabold;
}

type StyleLike = Record<string, unknown> | false | null | undefined | readonly StyleLike[];

/** Same semantics as StyleSheet.flatten (later entries win), without importing react-native. */
export function flattenStyle(style: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const walk = (s: StyleLike): void => {
    if (!s) return;
    if (Array.isArray(s)) {
      for (const x of s) walk(x as StyleLike);
    } else {
      Object.assign(out, s);
    }
  };
  walk(style as StyleLike);
  return out;
}

/**
 * Returns the style with a Poppins fontFamily chosen from its fontWeight, and fontWeight removed.
 * An explicit fontFamily (an icon font, say) is never overridden and the style is returned as is.
 */
export function applyPoppins(style: unknown): Record<string, unknown> {
  const flat = flattenStyle(style);
  if (flat['fontFamily']) return flat;
  const { fontWeight, ...rest } = flat;
  return { ...rest, fontFamily: poppinsFamilyForWeight(fontWeight as FontWeightInput) };
}
