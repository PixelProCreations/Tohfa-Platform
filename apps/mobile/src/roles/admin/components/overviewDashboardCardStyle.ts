/**
 * The pure half of OverviewDashboardCard (./OverviewDashboardCard.tsx): which
 * admin theme token paints each tone, the default icon badge, and the spoken
 * label. No react-native here, so plain-Node vitest covers it
 * (tests/overviewDashboardCard.test.ts).
 *
 * The admin-theme branch's card carried its own hex values (#C93B2B, #D97706,
 * #16A34A, #8C5835, #FCEFE7 ...). Each one is replaced by the nearest admin
 * token rather than kept, because the admin theme guard is a ratchet: a raw
 * colour here would have to be baselined and could never leave again.
 */
import { adminColors } from '../theme';

export const OVERVIEW_CARD_TONES = ['default', 'danger', 'warning', 'success'] as const;
export type OverviewCardTone = (typeof OVERVIEW_CARD_TONES)[number];

export interface OverviewCardToneColors {
  value: string;
  subtitle: string;
}

/**
 * Value and subtitle colours for a tone. An attention tone paints both with the
 * pair's text colour, as the reference card did; an unknown tone draws as the
 * default rather than in no colour at all.
 */
export function overviewCardToneColors(tone: OverviewCardTone): OverviewCardToneColors {
  switch (tone) {
    case 'danger':
      return { value: adminColors.danger.text, subtitle: adminColors.danger.text };
    case 'warning':
      return { value: adminColors.warning.text, subtitle: adminColors.warning.text };
    case 'success':
      return { value: adminColors.success.text, subtitle: adminColors.success.text };
    default:
      return { value: adminColors.ink, subtitle: adminColors.muted };
  }
}

/** The icon badge: the reference card's warm brown on peach is Orange Deep on Orange Tint here. */
export function overviewCardIconColors(
  iconColor: string | undefined,
  iconBgColor: string | undefined,
): { icon: string; badge: string } {
  return { icon: iconColor ?? adminColors.brandDeep, badge: iconBgColor ?? adminColors.brandTint };
}

/** "Title: value, subtitle", the subtitle only when there is one. */
export function overviewCardA11yLabel(title: string, value: string | number, subtitle: string | undefined): string {
  const base = `${title}: ${String(value)}`;
  return subtitle !== undefined && subtitle !== '' ? `${base}, ${subtitle}` : base;
}
