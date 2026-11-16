/**
 * The Market & Pricing icons, drawn as in the team design
 * (origin/tofhafarmfin-rbac MarketPricingHomeScreen / FairPriceCeilingScreen /
 * PriceHistoryScreen). Colours default to admin theme tokens; callers pass a
 * token, never a literal.
 */
import React from 'react';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { adminColors } from '../../../theme';

interface IconProps {
  size?: number;
  color?: string;
}

export function BackArrowIcon({ size = 22, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function BellIcon({ size = 19, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PriceTagHeaderIcon({ size = 22, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="7" y1="7" x2="7.01" y2="7" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

export function HorizontalSlidersIcon({ size = 18, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="18" x2="20" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="8" cy="6" r="2.2" fill={color} />
      <Circle cx="16" cy="12" r="2.2" fill={color} />
      <Circle cx="10" cy="18" r="2.2" fill={color} />
    </Svg>
  );
}

export function SearchIcon({ size = 18, color = adminColors.muted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function ChevronDownIcon({ size = 18, color = adminColors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CalendarEventIcon({ size = 18, color = adminColors.muted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="1.8" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.8" />
      <Rect x="7" y="13" width="2" height="2" fill={color} />
      <Rect x="11" y="13" width="2" height="2" fill={color} />
      <Rect x="15" y="13" width="2" height="2" fill={color} />
      <Rect x="7" y="17" width="2" height="2" fill={color} />
      <Rect x="11" y="17" width="2" height="2" fill={color} />
    </Svg>
  );
}

export function RetailPricingIcon({ size = 26, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function BanknotesIcon({ size = 26, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2.5" y="6" width="19" height="12" rx="2.5" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="12" r="3.2" stroke={color} strokeWidth="2" />
      <Line x1="6" y1="9" x2="6" y2="15" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="18" y1="9" x2="18" y2="15" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function FairPriceIcon({ size = 26, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 3.5v2.2m0 8.8v2M13.5 7A2.2 2.2 0 0 0 11 5c-1.6 0-2.5.9-2.5 2 0 2 4.8 1.6 4.8 4 0 1.4-1 2.2-2.3 2.2a2.8 2.8 0 0 1-2.2-.9"
        stroke={color}
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14.5 14l2.2 2.2 4.3-4.3" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CategoryShapesIcon({ size = 26, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3l4.5 7.5h-9L12 3zM6 15a3 3 0 100 6 3 3 0 000-6zM15 15h5v5h-5v-5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PriceHistoryIcon({ size = 26, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 8v4l3 3M3.05 11a9 9 0 11.5 4m-.5 5v-5h5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
