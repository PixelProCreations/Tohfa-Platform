/**
 * Inline SVG icons of the Audit Schedule screen, copied verbatim from the
 * design (origin/Superadmin-main dashboard/AuditScheduleScreen.tsx). Only the
 * icons this screen draws are kept.
 */
import React from 'react';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { adminColors } from '../../../theme';

export function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

export function CloseIcon({ size = 20, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CertCheckIcon({ size = 18, color = adminColors.success.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M8.5 12.5l2.5 2.5 4.5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function SearchIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-3.5-3.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

export function FilterSlidersIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Top track */}
      <Line x1="4" y1="6.5" x2="8" y2="6.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="12" y1="6.5" x2="20" y2="6.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="10" y1="4" x2="10" y2="9" stroke={color} strokeWidth="2.4" strokeLinecap="round" />

      {/* Middle track */}
      <Line x1="4" y1="12" x2="14" y2="12" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="18" y1="12" x2="20" y2="12" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="16" y1="9.5" x2="16" y2="14.5" stroke={color} strokeWidth="2.4" strokeLinecap="round" />

      {/* Bottom track */}
      <Line x1="4" y1="17.5" x2="8" y2="17.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="12" y1="17.5" x2="20" y2="17.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="10" y1="15" x2="10" y2="20" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </Svg>
  );
}

export function HeaderCalendarIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="2.2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

export function ClockHistoryIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 7v5l3 2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function ReportDocIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function TimelineCalendarIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="1.8" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

export function TimelineInspectionIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="17" rx="3" stroke={color} strokeWidth="1.8" />
      <Path d="M9 2h6v3H9z" stroke={color} strokeWidth="1.6" />
      <Line x1="8" y1="11" x2="16" y2="11" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8" y1="15" x2="13" y2="15" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function TimelineCompletedIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path d="M8 12l2.5 2.5L16 9.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PdfDocIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="16" y1="13" x2="8" y2="13" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="16" y1="17" x2="8" y2="17" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="10" y1="9" x2="8" y2="9" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function ChevronRightIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m9 18 6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronLeftIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m15 18-6-6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function HeaderBellIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function DownloadIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="m7 10 5 5 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 15V3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function CloseXIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6 6 18M6 6l12 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
