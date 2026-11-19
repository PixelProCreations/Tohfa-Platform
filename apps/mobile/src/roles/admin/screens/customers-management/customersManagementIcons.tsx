/**
 * Icons of the Customers Management screen, ported from the design's
 * "Customer Module Icons" block (origin/tofhafarmfin-rbac
 * TohfaAdminDashboardScreen) plus the back arrow and search glyph the design
 * shares from its common icon set. Colours are admin theme tokens.
 *
 * `UsersMetricIcon` and `ClipboardMetricIcon` are the card badges for the
 * design's `users` and `clipboard` icon names, which the shared
 * OverviewDashboardCard does not draw by name; the card accepts a node.
 */
import React from 'react';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { adminColors } from '../../theme';

export interface IconProps {
  size?: number;
  color?: string;
}

export function BackArrowWhiteIcon({ size = 20, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function SearchIcon({ size = 18, color = adminColors.muted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-4-4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function CustomersManagementHeaderIcon({ size = 22, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2.2" />
      <Rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2.2" />
      <Rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2.2" />
      <Rect x="14" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2.2" />
    </Svg>
  );
}

/** The header's round filter button glyph: three lines with sliders. */
export function FilterSlidersCircleIcon({ size = 18, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="18" x2="20" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="15" cy="6" r="2.2" fill={color} />
      <Circle cx="9" cy="12" r="2.2" fill={color} />
      <Circle cx="16" cy="18" r="2.2" fill={color} />
    </Svg>
  );
}

export function CustomerDirectoryActionIcon({ size = 26, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function GstBuildingActionIcon({ size = 26, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="2" width="16" height="20" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="9" y1="6" x2="9" y2="6.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="15" y1="6" x2="15" y2="6.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="9" y1="10" x2="9" y2="10.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="15" y1="10" x2="15" y2="10.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="9" y1="14" x2="9" y2="14.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="15" y1="14" x2="15" y2="14.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M10 22v-4h4v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

/** Card badge for the design's `users` icon name (the card is 18px, 24 viewBox, 2 stroke). */
export function UsersMetricIcon({ size = 18, color = adminColors.brandDeep }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

/** Filter sliders icon (plain, not in circle) for the directory search bar. */
export function FilterSlidersIcon({ size = 18, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="18" x2="20" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="15" cy="6" r="2.2" fill={color} />
      <Circle cx="9" cy="12" r="2.2" fill={color} />
      <Circle cx="16" cy="18" r="2.2" fill={color} />
    </Svg>
  );
}

/** Plus icon for the circular header + button. */
export function PlusIcon({ size = 18, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

/** Card badge for the design's `clipboard` icon name. */
export function ClipboardMetricIcon({ size = 18, color = adminColors.brandDeep }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Rect x="8" y="2" width="8" height="4" rx="1" stroke={color} strokeWidth="2" />
    </Svg>
  );
}
