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

export interface OverviewDashboardCardProps {
  /** Main stat/number, e.g. "12", "08", "03", "05", "₹24,850" */
  value: string | number;
  /** Primary label/title, e.g. "Pending Orders", "Ready for Pickup" */
  title: string;
  /** Secondary subtitle / counter, e.g. "8 need action", "3 customers expected" */
  subtitle?: string | undefined;
  /** Built-in icon name or custom React node for the top-right icon badge */
  icon?: 'orders' | 'pickup' | 'receiving' | 'inventory' | 'sales' | 'cash' | 'truck' | 'box' | 'alert' | React.ReactNode;
  /** Optional custom icon tint or defaults to warm brown/tan #8C5835 */
  iconColor?: string;
  /** Optional custom icon badge background or defaults to warm peach/cream #FCEFE7 */
  iconBgColor?: string;
  /** If true or 'danger', highlights the value and subtitle with red/coral tone (#C93B2B / #E11D48) */
  tone?: 'default' | 'danger' | 'warning' | 'success';
  /** Press handler */
  onPress?: (() => void) | undefined;
  /** Custom outer card container style override */
  style?: StyleProp<ViewStyle>;
  /** Custom value style override */
  valueStyle?: StyleProp<TextStyle>;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Whether the card is disabled */
  disabled?: boolean;
}

const DEFAULT_ICON_COLOR = '#8C5835';
const DEFAULT_ICON_BG = '#FCEFE7';

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
          <Circle cx="16" cy="16" r="4.5" stroke={color} strokeWidth="1.9" fill="#FFF" />
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
          <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="2" fill="#FFF" />
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

/**
 * Reusable Overview Dashboard Card designed exactly after the reference design:
 * - Crisp white rounded container (#FFFFFF, 16px radius, subtle border #EBE5DF)
 * - Prominent bold statistic / count (19px, weight 800)
 * - Rounded square top-right icon badge with pastel warm tint (#FCEFE7) and warm icon tone (#8C5835)
 * - Clean title (13px, weight 700, #3E3834)
 * - Subtitle / counter (11.5px, #7A726C / danger highlight)
 */
export function OverviewDashboardCard({
  value,
  title,
  subtitle,
  icon,
  iconColor = DEFAULT_ICON_COLOR,
  iconBgColor = DEFAULT_ICON_BG,
  tone = 'default',
  onPress,
  style,
  valueStyle,
  accessibilityLabel,
  disabled = false,
}: OverviewDashboardCardProps) {
  const isDanger = tone === 'danger';
  const isWarning = tone === 'warning';
  const isSuccess = tone === 'success';

  const toneValueColor = isDanger
    ? '#C93B2B'
    : isWarning
    ? '#D97706'
    : isSuccess
    ? '#16A34A'
    : '#1A1817';

  const toneSubColor = isDanger
    ? '#C93B2B'
    : isWarning
    ? '#D97706'
    : isSuccess
    ? '#16A34A'
    : '#7A726C';

  const renderedIcon = typeof icon === 'string'
    ? renderBuiltinIcon(icon, iconColor)
    : icon;

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.72 : 1}
      disabled={disabled || !onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel || `${title}: ${value}${subtitle ? `, ${subtitle}` : ''}`}
    >
      {/* Top row: Value on left, warm rounded Icon Badge on right */}
      <View style={styles.topRow}>
        <Text
          style={[styles.value, { color: toneValueColor }, valueStyle]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {String(value)}
        </Text>

        {renderedIcon ? (
          <View style={[styles.iconBadge, { backgroundColor: iconBgColor }]}>
            {renderedIcon}
          </View>
        ) : null}
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      {/* Subtitle / micro text */}
      {subtitle ? (
        <Text style={[styles.subtitle, { color: toneSubColor }]} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  card: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
    borderWidth: 1,
    borderColor: '#ECE7E1',
    shadowColor: '#1A1817',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 3.5,
    elevation: 2,
    justifyContent: 'space-between',
    minHeight: 114,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  value: {
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '800',
    color: '#1A1817',
    letterSpacing: -0.4,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '700',
    color: '#38322E',
    letterSpacing: -0.1,
  },
  subtitle: {
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: '500',
    color: '#7A726C',
    marginTop: 3,
  },
});
