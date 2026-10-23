/**
 * components/overviewDashboardCardStyle.ts: the pure half of the shared stat
 * card (OverviewDashboardCard, ported from the admin-theme branch). Every
 * colour it hands the card is an admin theme token, never a literal, so the
 * card cannot add a raw colour that the admin theme guard would have to
 * baseline.
 */
import { describe, expect, it } from 'vitest';
import { adminColors } from '../theme';
import {
  OVERVIEW_CARD_TONES,
  overviewCardA11yLabel,
  overviewCardIconColors,
  overviewCardToneColors,
} from '../components/overviewDashboardCardStyle';

describe('overviewCardToneColors', () => {
  it('draws the default card in ink with a muted subtitle', () => {
    expect(overviewCardToneColors('default')).toEqual({ value: adminColors.ink, subtitle: adminColors.muted });
  });

  it('paints value and subtitle with the semantic text token of an attention tone', () => {
    expect(overviewCardToneColors('danger')).toEqual({ value: adminColors.danger.text, subtitle: adminColors.danger.text });
    expect(overviewCardToneColors('warning')).toEqual({ value: adminColors.warning.text, subtitle: adminColors.warning.text });
    expect(overviewCardToneColors('success')).toEqual({ value: adminColors.success.text, subtitle: adminColors.success.text });
  });

  it('falls back to the default colours for a tone it does not know', () => {
    expect(overviewCardToneColors('loud' as never)).toEqual(overviewCardToneColors('default'));
  });

  it('offers exactly the four tones of the admin-theme card', () => {
    expect([...OVERVIEW_CARD_TONES]).toEqual(['default', 'danger', 'warning', 'success']);
  });

  it('never returns a colour outside the admin theme', () => {
    const themeColours = new Set<string>(
      Object.values(adminColors).flatMap((v) => (typeof v === 'string' ? [v] : Object.values(v as Record<string, string>))),
    );
    for (const tone of OVERVIEW_CARD_TONES) {
      const { value, subtitle } = overviewCardToneColors(tone);
      expect(themeColours.has(value)).toBe(true);
      expect(themeColours.has(subtitle)).toBe(true);
    }
  });
});

describe('overviewCardIconColors', () => {
  it('defaults the icon badge to the brand tint with a deep brand icon', () => {
    expect(overviewCardIconColors(undefined, undefined)).toEqual({ icon: adminColors.brandDeep, badge: adminColors.brandTint });
  });

  it('keeps colours the caller passes (they come from the theme too)', () => {
    expect(overviewCardIconColors(adminColors.info.text, adminColors.info.bg)).toEqual({
      icon: adminColors.info.text,
      badge: adminColors.info.bg,
    });
  });
});

describe('overviewCardA11yLabel', () => {
  it('reads title, value and subtitle', () => {
    expect(overviewCardA11yLabel('Total Stock', '1,200 kg', 'All warehouses')).toBe('Total Stock: 1,200 kg, All warehouses');
  });

  it('leaves out a missing or blank subtitle', () => {
    expect(overviewCardA11yLabel('Pending', 3, undefined)).toBe('Pending: 3');
    expect(overviewCardA11yLabel('Pending', 3, '')).toBe('Pending: 3');
  });
});
