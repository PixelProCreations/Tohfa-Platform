import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../theme';

export interface OverviewDashboardCardProps {
  /** Main stat/number, e.g. "12", "08", "03", "05", "₹24,850" */
  value: string | number;
  /** Primary label/title, e.g. "Pending Orders", "Ready for Pickup" */
  title: string;
  /** Secondary subtitle / counter, e.g. "8 need action", "3 customers expected" */
  subtitle?: string | undefined;
  /** Built-in icon name or custom React node for the top-right icon badge */
  icon?: 'orders' | 'pickup' | 'receiving' | 'inventory' | 'sales' | 'cash' | 'truck' | 'box' | 'alert' | React.ReactNode;
  /** Optional custom icon tint or defaults to warm brown/tan from admin theme */
  iconColor?: string;
  /** Optional custom icon badge background or defaults to warm peach/cream from admin theme */
  iconBgColor?: string;
  /** If true or 'danger', highlights the value and subtitle with red/coral tone */
  tone?: 'default' | 'danger' | 'warning' | 'success';
  /** Title placement: 'bottom' (default: value top, title bottom) or 'top' (title top, value middle, subtitle bottom) */
  titlePosition?: 'top' | 'bottom';
  /** Press handler */
  onPress?: (() => void) | undefined;
  /** Custom outer card container style override */
  style?: StyleProp<ViewStyle>;
  /** Custom value style override */
  valueStyle?: StyleProp<TextStyle>;
  /** Custom title style override */
  titleStyle?: StyleProp<TextStyle>;
  /** If true, keeps title exactly as passed without sentence-casing */
  preserveCase?: boolean;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Whether the card is disabled */
  disabled?: boolean;
}

function renderBuiltinIcon(type: string, color: string) {
  switch (type) {
    case 'orders':
      return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path
            d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
            stroke={color}
            strokeWidth="1.9"
            strokeLinecap="round"
          />
          <Rect x="8" y="2" width="8" height="4" rx="1" stroke={color} strokeWidth="1.9" />
          <Circle cx="16" cy="16" r="4.5" stroke={color} strokeWidth="1.9" fill={adminColors.card} />
          <Path d="M16 14.5v1.8l1.3 1.3" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
        </Svg>
      );
    case 'pickup':
      return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path
            d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
          <Path
            d="M16 11l2 2 4-4"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'receiving':
    case 'truck':
      return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Rect x="1" y="4" width="14" height="12" rx="2" stroke={color} strokeWidth="2" />
          <Path
            d="M15 8h4l3 3v5h-7V8z"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx="5.5" cy="19" r="2.5" stroke={color} strokeWidth="2" />
          <Circle cx="18.5" cy="19" r="2.5" stroke={color} strokeWidth="2" />
        </Svg>
      );
    case 'inventory':
    case 'box':
      return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="3" width="18" height="5" rx="1" stroke={color} strokeWidth="2" />
          <Path
            d="M5 8v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <Path d="M10 12h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </Svg>
      );
    case 'sales':
      return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="2" fill={adminColors.card} />
          <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
          <Path d="M6 12h.01M18 12h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <Path d="M4 6V4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10h-2" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </Svg>
      );
    case 'cash':
      return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M3 5v14a2 2 0 0 0 2 2h16v-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M18 12a2 2 0 0 0 0 4h4v-4Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'alert':
      return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
          <Path d="M12 8v5M12 16h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </Svg>
      );
    default:
      return null;
  }
}

export interface OverviewSectionHeaderProps {
  title?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Reusable section header matching the reference image ("Today's Overview" / "View All")
 */
export function OverviewSectionHeader({
  title = "Today's Overview",
  actionLabel = 'View All',
  onAction,
  style,
}: OverviewSectionHeaderProps) {
  return (
    <View style={[styles.sectionHeaderRow, style]}>
      <Text style={styles.sectionHeaderTitle}>{title}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity
          onPress={onAction}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={styles.sectionHeaderAction}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function toSentenceCase(str?: string): string {
  if (!str) return '';
  const trimmed = str.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

/**
 * Reusable Overview Dashboard Card designed strictly following the TOHFA Admin design system
 * and the exact design reference image:
 * - 2-column card layout with pure white background, subtle warm border, smooth 18px corners
 * - Top row: Prominent bold KPI statistic on left, warm peach rounded icon badge on right
 * - Bottom block: Clean title (13.5px bold) and subtitle / meta (11.5px) grouped together
 * - Tone support: 'danger' highlights the stat value & subtitle in red/coral (matching "Low Stock Items")
 */
export function OverviewDashboardCard({
  value,
  title,
  subtitle,
  icon,
  iconColor,
  iconBgColor,
  tone = 'default',
  titlePosition = 'bottom',
  onPress,
  style,
  valueStyle,
  titleStyle,
  preserveCase = false,
  accessibilityLabel,
  disabled = false,
}: OverviewDashboardCardProps) {
  const effectiveIconColor = iconColor ?? adminColors.brandDeep;
  const effectiveIconBg = iconBgColor ?? adminColors.brandTint;

  const isDanger = tone === 'danger';
  const isWarning = tone === 'warning';
  const isSuccess = tone === 'success';

  const toneValueColor = isDanger
    ? adminColors.danger.text
    : isWarning
    ? adminColors.warning.text
    : isSuccess
    ? adminColors.success.text
    : adminColors.ink;

  const toneSubColor = isDanger
    ? adminColors.danger.text
    : isWarning
    ? adminColors.warning.text
    : isSuccess
    ? adminColors.success.text
    : adminColors.muted;

  const renderedIcon = typeof icon === 'string'
    ? renderBuiltinIcon(icon, effectiveIconColor)
    : icon;

  const valStr = String(value);
  const isCurrency = valStr.includes('₹') || valStr.length > 5;
  const displayTitle = preserveCase ? title : toSentenceCase(title);

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.72 : 1}
      disabled={disabled || !onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel || `${displayTitle}: ${value}${subtitle ? `, ${subtitle}` : ''}`}
    >
      {titlePosition === 'top' ? (
        <>
          <View style={[styles.topRow, !renderedIcon && styles.topRowWithoutIcon]}>
            <Text style={[styles.title, titleStyle]} numberOfLines={2}>
              {displayTitle}
            </Text>
            {renderedIcon ? (
              <View style={[styles.iconBadge, { backgroundColor: effectiveIconBg }]}>
                {renderedIcon}
              </View>
            ) : null}
          </View>

          <Text
            style={[
              styles.value,
              isCurrency && styles.currencyValue,
              { color: toneValueColor },
              valueStyle,
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {valStr}
          </Text>

          {subtitle ? (
            <Text style={[styles.subtitle, { color: toneSubColor }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </>
      ) : (
        <>
          {/* Top row: Value on left, warm rounded Icon Badge on right */}
          <View style={styles.topRow}>
            <Text
              style={[
                styles.value,
                isCurrency && styles.currencyValue,
                { color: toneValueColor },
                valueStyle,
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {valStr}
            </Text>

            {renderedIcon ? (
              <View style={[styles.iconBadge, { backgroundColor: effectiveIconBg }]}>
                {renderedIcon}
              </View>
            ) : null}
          </View>

          {/* Group title and subtitle cleanly below */}
          <View style={styles.bottomBlock}>
            <Text style={[styles.title, titleStyle]} numberOfLines={2}>
              {displayTitle}
            </Text>

            {subtitle ? (
              <Text style={[styles.subtitle, { color: toneSubColor }]} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </>
      )}
    </TouchableOpacity>
  );
}

/**
 * Responsive 2-column Grid container helper for OverviewDashboardCards
 */
export function OverviewCardsGrid({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.grid, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.sm,
  },
  sectionHeaderTitle: {
    ...adminType.title,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
    color: adminColors.ink,
    letterSpacing: -0.3,
  },
  sectionHeaderAction: {
    ...adminType.rowTitle,
    fontSize: 13.5,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    columnGap: 10,
  },
  card: {
    width: '48.5%',
    backgroundColor: adminColors.card,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
    justifyContent: 'space-between',
    minHeight: 112,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    minHeight: 36,
  },
  topRowWithoutIcon: {
    minHeight: 0,
    marginBottom: 2,
  },
  value: {
    ...adminType.kpiValue,
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '800',
    color: adminColors.ink,
    letterSpacing: -0.4,
    flex: 1,
    paddingRight: 6,
  },
  currencyValue: {
    fontSize: 21,
    lineHeight: 26,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBlock: {
    marginTop: 10,
  },
  title: {
    ...adminType.rowTitle,
    fontSize: 13.5,
    lineHeight: 17,
    fontWeight: '700',
    color: adminColors.ink,
    letterSpacing: -0.1,
  },
  subtitle: {
    ...adminType.rowMeta,
    fontSize: 11.5,
    lineHeight: 15,
    color: adminColors.muted,
    marginTop: 2.5,
  },
});
