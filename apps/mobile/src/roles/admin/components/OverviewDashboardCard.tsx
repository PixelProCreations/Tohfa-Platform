/**
 * The shared admin stat card: a figure with an icon badge, a title and a
 * subtitle, half a grid row wide. Ported from the UI team's
 * OverviewDashboardCard on the admin-theme branch with the same props and
 * layout, but every colour, size and spacing now comes from the admin theme
 * (../theme). The tone -> token mapping lives in ./overviewDashboardCardStyle.ts
 * so it is unit-tested; see that file for which token replaced which of the
 * reference card's literals.
 *
 * Differences from the reference, all forced by the theme having no matching
 * value: the type sizes are the nearest admin type styles (value 19 not 21,
 * title 13 not 13.5, subtitle 10.5 not 11.5) and the letter spacing is gone;
 * padding and grid gap are 12 (the reference used 14); the fixed 114 minimum
 * height is gone (cards in one grid row still stretch to the tallest).
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../theme';
import {
  overviewCardA11yLabel,
  overviewCardIconColors,
  overviewCardToneColors,
  type OverviewCardTone,
} from './overviewDashboardCardStyle';

export type OverviewCardIcon = 'orders' | 'pickup' | 'receiving' | 'inventory' | 'sales' | 'cash' | 'truck' | 'box' | 'alert';

export interface OverviewDashboardCardProps {
  /** Main figure, e.g. "12" or "1,200 kg"; the caller passes its placeholder until the figure has loaded. */
  value: string | number;
  /** Primary label, e.g. "Pending Orders". */
  title: string;
  /** Secondary line, e.g. "8 need action". */
  subtitle?: string | undefined;
  /** A built-in icon name, or any node for the top-right badge. */
  icon?: OverviewCardIcon | React.ReactNode;
  /** Icon tint; an admin theme colour. Defaults to Orange Deep. */
  iconColor?: string;
  /** Icon badge background; an admin theme colour. Defaults to Orange Tint. */
  iconBgColor?: string;
  /** Paints value and subtitle with a semantic pair's text colour. */
  tone?: OverviewCardTone;
  onPress?: (() => void) | undefined;
  /** Outer card style override. */
  style?: StyleProp<ViewStyle>;
  /** Value text style override. */
  valueStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  disabled?: boolean;
}

/** Drawing size of the built-in SVG icons (geometry, not a theme value). */
const ICON_SIZE = 18;
/** Pressed feedback of a tappable card, as the reference card had it. */
const PRESSED_OPACITY = 0.72;

function renderBuiltinIcon(type: OverviewCardIcon, color: string) {
  const fill = adminColors.card;
  switch (type) {
    case 'orders':
      return (
        <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
          <Path
            d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
            stroke={color}
            strokeWidth="1.9"
            strokeLinecap="round"
          />
          <Rect x="8" y="2" width="8" height="4" rx="1" stroke={color} strokeWidth="1.9" />
          <Circle cx="16" cy="16" r="4.5" stroke={color} strokeWidth="1.9" fill={fill} />
          <Path d="M16 14.5v1.8l1.3 1.3" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
        </Svg>
      );
    case 'pickup':
      return (
        <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
          <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
          <Path d="M16 11l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'receiving':
    case 'truck':
      return (
        <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
          <Rect x="1" y="4" width="14" height="12" rx="2" stroke={color} strokeWidth="2" />
          <Path d="M15 8h4l3 3v5h-7V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx="5.5" cy="19" r="2.5" stroke={color} strokeWidth="2" />
          <Circle cx="18.5" cy="19" r="2.5" stroke={color} strokeWidth="2" />
        </Svg>
      );
    case 'inventory':
    case 'box':
      return (
        <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="3" width="18" height="5" rx="1" stroke={color} strokeWidth="2" />
          <Path d="M5 8v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <Path d="M10 12h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </Svg>
      );
    case 'sales':
      return (
        <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
          <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="2" fill={fill} />
          <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
          <Path d="M6 12h.01M18 12h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <Path d="M4 6V4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10h-2" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </Svg>
      );
    case 'cash':
      return (
        <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
          <Path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M3 5v14a2 2 0 0 0 2 2h16v-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M18 12a2 2 0 0 0 0 4h4v-4Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'alert':
      return (
        <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
          <Path d="M12 8v5M12 16h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </Svg>
      );
    default:
      return null;
  }
}

function isBuiltinIcon(icon: unknown): icon is OverviewCardIcon {
  return typeof icon === 'string';
}

export function OverviewDashboardCard({
  value,
  title,
  subtitle,
  icon,
  iconColor,
  iconBgColor,
  tone = 'default',
  onPress,
  style,
  valueStyle,
  accessibilityLabel,
  disabled = false,
}: OverviewDashboardCardProps) {
  const colors = overviewCardToneColors(tone);
  const iconColors = overviewCardIconColors(iconColor, iconBgColor);
  const renderedIcon = isBuiltinIcon(icon) ? renderBuiltinIcon(icon, iconColors.icon) : icon;

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={onPress ? PRESSED_OPACITY : 1}
      disabled={disabled || !onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel ?? overviewCardA11yLabel(title, value, subtitle)}
    >
      <View style={styles.topRow}>
        <Text style={[styles.value, { color: colors.value }, valueStyle]} numberOfLines={1} adjustsFontSizeToFit>
          {String(value)}
        </Text>
        {renderedIcon ? <View style={[styles.iconBadge, { backgroundColor: iconColors.badge }]}>{renderedIcon}</View> : null}
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.subtitle }]} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

/** Two columns of OverviewDashboardCards. */
export function OverviewCardsGrid({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.grid, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: adminSpacing.md,
  },
  card: {
    width: '48.5%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.sm,
  },
  value: {
    ...adminType.kpiValue,
    flexShrink: 1,
  },
  iconBadge: {
    width: adminSpacing.xxl,
    height: adminSpacing.xxl,
    borderRadius: adminRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  subtitle: {
    ...adminType.rowMeta,
    marginTop: adminSpacing.xs,
  },
});
