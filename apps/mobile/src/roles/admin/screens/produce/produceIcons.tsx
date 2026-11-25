/**
 * The design's inline SVG icons used by the produce screens
 * (origin/Superadmin-main components/AdminIcons.tsx), on admin theme colours only.
 */
import React from 'react';
import Svg, { Circle, Ellipse, Line, Path, Rect } from 'react-native-svg';
import { adminColors } from '../../theme';

export interface AdminIconProps {
  size?: number;
  color?: string;
}

export function BackArrowIcon({ size = 22, color = adminColors.onBrand }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChevronDownIcon({ size = 18, color = adminColors.muted }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9l6 6 6-6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CloseIcon({ size = 20, color = adminColors.ink }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function DatabaseCylinderIcon({ size = 20, color = adminColors.brand }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Ellipse cx="12" cy="5" rx="9" ry="3" stroke={color} strokeWidth="1.8" />
      <Path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" stroke={color} strokeWidth="1.8" />
      <Path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

export function FilterSlidersIcon({ size = 18, color = adminColors.onBrand }: AdminIconProps) {
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

export function HistoryClockIcon({ size = 20, color = adminColors.brand }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 7v5l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function LeafIcon({ size = 20, color = adminColors.brand }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SearchIcon({ size = 18, color = adminColors.muted }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function TractorIcon({ size = 20, color = adminColors.brand }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="7" cy="15" r="4" stroke={color} strokeWidth="1.8" />
      <Circle cx="18" cy="16" r="2" stroke={color} strokeWidth="1.8" />
      <Path
        d="M10 17h6M14 9h4l2 4M3 15h1M7 9v2M12 9V5h-3v4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function TrendChartIcon({ size = 20, color = adminColors.brand }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 3v18h18" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M18 9l-5 5-4-4-6 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 9h4v4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PlusIcon({ size = 20, color = adminColors.brand }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5v14M5 12h14"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CheckmarkIcon({ size = 18, color = adminColors.brand }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 13l4 4L19 7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CalendarIcon({ size = 20, color = adminColors.brand }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M8 2v4M16 2v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function DownloadIcon({ size = 20, color = adminColors.brand }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function Grid4Icon({ size = 20, color = adminColors.onBrand }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Rect x="14" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

export function CheckCircleIcon({ size = 18 }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={adminColors.success.text} strokeWidth="2" fill={adminColors.success.bg} />
      <Path d="M8 12.5l2.5 2.5 5.5-5.5" stroke={adminColors.success.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CurrentStageIcon({ size = 18 }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={adminColors.brand} strokeWidth="2" fill={adminColors.brandTint} />
      <Circle cx="12" cy="12" r="4" fill={adminColors.brand} />
    </Svg>
  );
}

export function CompareIcon({ size = 18, color = adminColors.brandDeep }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="7" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Rect x="14" y="4" width="7" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M10 8h4M10 12h4M10 16h4" stroke={color} strokeWidth="1.5" strokeDasharray="1 1" />
    </Svg>
  );
}

export function MoneyNotAvailableIcon({ size = 32, color = adminColors.muted }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2.5" stroke={color} strokeWidth="1.8" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8" />
      <Path d="M6 6v12M18 6v12" stroke={color} strokeWidth="1.5" strokeDasharray="2 2" />
    </Svg>
  );
}

