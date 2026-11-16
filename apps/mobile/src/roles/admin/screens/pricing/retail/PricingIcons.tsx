/**
 * The Market & Pricing icons as drawn in the team design
 * (origin/tofhafarmfin-rbac RetailPricingScreen / CategoriesGradesScreen /
 * MarkupPricingBreakdownScreen). Colours default to admin theme tokens;
 * callers pass a token, never a literal. Shared by retail/, categories/ and
 * markup/.
 */
import React from 'react';
import Svg, { Circle, Line, Path } from 'react-native-svg';
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
