/**
 * The design's inline SVG icons for the Purchase Orders screens, unchanged
 * apart from their default colours coming from the admin theme.
 */
import React from 'react';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { adminColors } from '../../theme';

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

export function FilterSlidersIcon({ size = 20, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="18" x2="20" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="15" cy="6" r="2.5" fill={adminColors.brand} stroke={color} strokeWidth="2" />
      <Circle cx="9" cy="12" r="2.5" fill={adminColors.brand} stroke={color} strokeWidth="2" />
      <Circle cx="16" cy="18" r="2.5" fill={adminColors.brand} stroke={color} strokeWidth="2" />
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

export function CloseIcon({ size = 20, color = adminColors.muted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function TargetPlusIcon({ size = 16, color = adminColors.brandDeep }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Line x1="12" y1="8" x2="12" y2="16" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8" y1="12" x2="16" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function CheckCircleIcon({ size = 16, color = adminColors.brandDeep }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path d="M8.5 12l2.5 2.5 4.5-5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ReceiptIcon({ size = 16, color = adminColors.brandDeep }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 2v18l2.5-1.5L9 20l2.5-1.5L14 20l2.5-1.5L19 20l2.5-1.5V2H4z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="8" y1="6" x2="16" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8" y1="10" x2="16" y2="10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function HourglassIcon({ size = 16, color = adminColors.brandDeep }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CheckmarkIcon({ size = 12, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 13l4 4L19 7" stroke={color} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
