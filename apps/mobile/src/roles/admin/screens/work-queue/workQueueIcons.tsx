/**
 * Icons for the Work Queue tab, copied path-for-path from the design
 * (origin/tofhafarmfin-rbac TohfaAdminDashboardScreen: BackArrowWhiteIcon,
 * SearchIcon, FilterSlidersIcon, ChevronDownIcon). Colours are always passed
 * in from adminColors by the caller.
 */
import React from 'react';
import Svg, { Circle, Line, Path } from 'react-native-svg';

interface IconProps {
  color: string;
  size: number;
}

export function BackArrowIcon({ color, size }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function SearchIcon({ color, size }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-4-4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function FilterSlidersIcon({ color, size }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="21" x2="4" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="10" x2="4" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="21" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="8" x2="12" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="20" y1="21" x2="20" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="20" y1="12" x2="20" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="1" y1="14" x2="7" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="9" y1="8" x2="15" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="17" y1="16" x2="23" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function ChevronDownIcon({ color, size }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** The design's icon sizes. */
export const WORK_QUEUE_ICON = { back: 22, search: 18, chevron: 16 } as const;
