/**
 * Customer app theme.
 *
 * Identical in structure AND in palette to the farmer app's theme. The customer
 * app used to lead with Deep Blue against the farmer app's TOHFA Teal; the
 * approved design system dropped per-app brand colours in favour of one
 * universal primary, so there is no longer any colour difference between the two
 * roles. Everything comes from @tohfa/design-tokens, so a token change lands in
 * both at once.
 */
import { tokens, neutral, semantic } from '@tohfa/design-tokens';

export const colors = {
  /** The one TOHFA brand colour — same in every app and for every role. */
  primary: semantic('primary'),
  primaryPressed: semantic('primaryPressed'),
  secondary: semantic('secondary'),
  danger: semantic('danger'),
  success: semantic('success'),
  info: semantic('info'),
  surface: semantic('surface'),
  onSurface: semantic('onSurface'),
  accent: semantic('accent'),
  white: neutral('white'),
  /** Used only on "grown by TOHFA farmers" trust badges. */
  farmerBrand: semantic('primary'),
} as const;

export const typography = {
  caption: tokens.typeScale.caption,
  footnote: tokens.typeScale.caption,
  bodySmall: tokens.typeScale.small,
  body: tokens.typeScale.body,
  bodyLarge: tokens.typeScale.bodyLarge,
  title: tokens.typeScale.h2,
  headline: tokens.typeScale.h1,
  display: tokens.typeScale.display,
} as const;

export const weights = {
  regular: String(tokens.fontWeight.regular) as '400',
  medium: String(tokens.fontWeight.medium) as '500',
  semibold: String(tokens.fontWeight.semibold) as '600',
  bold: String(tokens.fontWeight.bold) as '700',
} as const;

export const lineHeights = tokens.lineHeight;
export const spacing = tokens.spacing;
export const radius = tokens.radius;
export const MIN_TOUCH_TARGET = tokens.size.minTouchTarget;

export const customerFonts: Record<string, any> = Object.assign(
  {},
  typography,
  weights,
  {
    regular: 'Manrope-Regular',
    medium: 'Manrope-Medium',
    semibold: 'Manrope-SemiBold',
    bold: 'Manrope-Bold',
    heading: 'Manrope-Bold',
    subheading: 'Manrope-Medium',
    body: 'Manrope-Regular',
    caption: 'Manrope-Regular',
  }
);

export const customerShadow: Record<string, any> = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
};

export const theme = {
  colors,
  typography,
  weights,
  lineHeights,
  spacing,
  radius,
  minTouchTarget: MIN_TOUCH_TARGET,
} as const;

export type Theme = typeof theme;

export function useTheme() {
  return {
    ...theme,
    colors: {
      ...colors,
      // Legacy ramp names, repointed at the nearest step of the new 50→950 scale.
      grey100: neutral('neutral300'),
      grey300: neutral('neutral400'),
      grey500: neutral('neutral500'),
      grey700: neutral('neutral700'),
    },
  };
}
