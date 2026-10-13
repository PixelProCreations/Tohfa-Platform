/**
 * Admin screens' theme — a thin, typed view over @tohfa/design-tokens.
 *
 * Same structure as roles/customer/theme so screens read alike across roles;
 * every value is a token (root CLAUDE.md §2.7: no literal hex or spacing).
 * Admin adds the status colours (warning/info/success + light variants) that
 * warehouse lists use for status chips.
 */
import { neutral, semantic, tokens } from '@tohfa/design-tokens';

export const colors = {
  primary: semantic('primary'),
  primaryPressed: semantic('primaryPressed'),
  primaryPale: semantic('primaryPale'),
  secondary: semantic('secondary'),
  danger: semantic('danger'),
  error: semantic('error'),
  errorLight: semantic('errorLight'),
  success: semantic('success'),
  successLight: semantic('successLight'),
  warning: semantic('warning'),
  warningLight: semantic('warningLight'),
  info: semantic('info'),
  infoLight: semantic('infoLight'),
  surface: semantic('surface'),
  onSurface: semantic('onSurface'),
  onSurfaceVariant: semantic('onSurfaceVariant'),
  border: semantic('border'),
  white: neutral('white'),
} as const;

export const typography = {
  caption: tokens.typeScale.caption,
  bodySmall: tokens.typeScale.small,
  body: tokens.typeScale.body,
  bodyLarge: tokens.typeScale.bodyLarge,
  title: tokens.typeScale.h2,
  headline: tokens.typeScale.h1,
} as const;

export const weights = {
  regular: String(tokens.fontWeight.regular) as '400',
  medium: String(tokens.fontWeight.medium) as '500',
  semibold: String(tokens.fontWeight.semibold) as '600',
  bold: String(tokens.fontWeight.bold) as '700',
} as const;

export const adminTheme = {
  colors,
  typography,
  weights,
  lineHeights: tokens.lineHeight,
  spacing: tokens.spacing,
  radius: tokens.radius,
  minTouchTarget: tokens.size.minTouchTarget,
} as const;

export type AdminTheme = typeof adminTheme;
