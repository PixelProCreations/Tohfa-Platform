import React from 'react';
import Svg, { Circle, Ellipse, Line, Path, Rect } from 'react-native-svg';
import { adminColors } from '../theme';

export interface AdminIconProps {
  size?: number;
  color?: string;
}

// ─── Navigation & Arrow Icons ────────────────────────────────────────────────

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

export function BackArrowWhiteIcon({ size = 20, color = adminColors.onBrand }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ArrowBackIcon({ size = 22, color = adminColors.onBrand }: AdminIconProps) {
  return <BackArrowIcon size={size} color={color} />;
}

export function ArrowRightIcon({ size = 20, color = adminColors.brand }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12h14M12 5l7 7-7 7"
        stroke={color}
        strokeWidth="2.2"
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

export function ChevronRightIcon({ size = 18, color = adminColors.muted }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l6-6-6-6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChevronUpIcon({ size = 18, color = adminColors.muted }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 15l-6-6-6 6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function BackChevronIcon({ size = 20, color = adminColors.onBrand }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18l-6-6 6-6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Search, Filter & Actions ────────────────────────────────────────────────

export function SearchIcon({ size = 18, color = adminColors.muted }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
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

// ─── Status, Utility & Common Icons ──────────────────────────────────────────

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

export function CheckCircleIcon({ size = 20, color = adminColors.brand }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path
        d="M8 12l2.5 2.5L16 9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function WarningTriangleIcon({ size = 20, color = adminColors.brand }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="17" r="1" fill={color} />
    </Svg>
  );
}

export function InfoCircleIcon({ size = 20, color = adminColors.brand }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Line x1="12" y1="16" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="8" r="1" fill={color} />
    </Svg>
  );
}

export function BellIcon({ size = 20, color = adminColors.onBrand }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
        stroke={color}
        strokeWidth="2"
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

export function LockIcon({ size = 20, color = adminColors.muted }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function EyeIcon({ size = 20, color = adminColors.brand }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
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

export function HistoryClockIcon({ size = 20, color = adminColors.brand }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 7v5l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function BuildingWarehouseIcon({ size = 20, color = adminColors.brand }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 21h18M3 7l9-4 9 4v14H3V7z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 21v-8h6v8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function StoreIcon({ size = 20, color = adminColors.brand }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9l2-5h14l2 5M3 9a3 3 0 006 0 3 3 0 006 0 3 3 0 006 0M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M9 21v-7h6v7"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SwitchArrowsIcon({ size = 20, color = adminColors.brand }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 7h16M16 3l4 4-4 4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20 17H4M8 13l-4 4 4 4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Super Admin Dashboard & Nav Icons ───────────────────────────────────────

export function ShieldIcon({ size = 20, color = adminColors.onBrand }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function UserAvatarIcon({ size = 22, color = adminColors.onBrand }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" />
      <Path
        d="M20 21a8 8 0 1 0-16 0"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function PauseCircleIcon({ size = 18, color = adminColors.danger.text }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Line x1="10" y1="9" x2="10" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="14" y1="9" x2="14" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function MoreVerticalIcon({ size = 18, color = adminColors.muted }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="6" r="1.5" fill={color} />
      <Circle cx="12" cy="12" r="1.5" fill={color} />
      <Circle cx="12" cy="18" r="1.5" fill={color} />
    </Svg>
  );
}

export function PieChartIcon({ size = 20, color = adminColors.brand }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21.21 15.89A10 10 0 1 1 8 2.83"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M22 12A10 10 0 0 0 12 2v10z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function InboxTrayIcon({ size = 20, color = adminColors.brand }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M22 13h-4l-2 3H8l-2-3H2"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ClipboardListIcon({ size = 20, color = adminColors.brand }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="17" rx="2" stroke={color} strokeWidth="1.9" />
      <Path d="M9 2h6a1 1 0 0 1 1 1v2H8V3a1 1 0 0 1 1-1z" stroke={color} strokeWidth="1.9" />
      <Line x1="8" y1="10" x2="16" y2="10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8" y1="14" x2="16" y2="14" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8" y1="18" x2="13" y2="18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function UserPlusIcon({ size = 20, color = adminColors.brand }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <Circle cx="8.5" cy="7" r="4" stroke={color} strokeWidth="1.9" />
      <Line x1="20" y1="8" x2="20" y2="14" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <Line x1="23" y1="11" x2="17" y2="11" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </Svg>
  );
}

export function FairPriceIcon({ size = 20, color = adminColors.brand }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Dollar sign on top */}
      <Path
        d="M11 2v2m0 9v2M13.5 5.5c0-1.1-.9-2-2.5-2s-2.5.9-2.5 2c0 2 5 1.5 5 4s-1 2.5-2.5 2.5-2.5-.9-2.5-2"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Checkmark underneath */}
      <Path
        d="M13 18l2.5 2.5 5-5"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function RupeeTagIcon({ size = 20, color = adminColors.brand }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 4h10M6 8h7M6 4v16M6 12h5a3.5 3.5 0 0 0 0-7H6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M11 12l6 8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CashBillIcon({ size = 20, color = adminColors.brand }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="1.9" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.9" />
      <Line x1="6" y1="12" x2="6.01" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="18" y1="12" x2="18.01" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Bottom Navigation Icons ─────────────────────────────────────────────────

export function NavOverviewIcon({ size = 20, color = adminColors.brand }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Rect x="14" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

export function NavFarmersIcon({ size = 20, color = adminColors.muted }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="1.9" />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function NavWarehouseIcon({ size = 20, color = adminColors.muted }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 21h18M3 7l9-4 9 4v14H3V7z" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 21v-8h6v8" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function NavFinanceIcon({ size = 20, color = adminColors.muted }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="3" y1="21" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M3 10h18M5 10v7M9 10v7M15 10v7M19 10v7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M12 3l9 5H3l9-5z" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function NavMenuIcon({ size = 20, color = adminColors.muted }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="5" cy="5" r="1.5" fill={color} />
      <Circle cx="12" cy="5" r="1.5" fill={color} />
      <Circle cx="19" cy="5" r="1.5" fill={color} />
      <Circle cx="5" cy="12" r="1.5" fill={color} />
      <Circle cx="12" cy="12" r="1.5" fill={color} />
      <Circle cx="19" cy="12" r="1.5" fill={color} />
      <Circle cx="5" cy="19" r="1.5" fill={color} />
      <Circle cx="12" cy="19" r="1.5" fill={color} />
      <Circle cx="19" cy="19" r="1.5" fill={color} />
    </Svg>
  );
}

export function RepeatIcon({ size = 20, color = adminColors.brand }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 1l4 4-4 4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21 13v2a4 4 0 01-4 4H3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PackageBoxIcon({ size = 20, color = adminColors.brand }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ShoppingCartIcon({ size = 20, color = adminColors.brand }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="21" r="1" stroke={color} strokeWidth="2" />
      <Circle cx="20" cy="21" r="1" stroke={color} strokeWidth="2" />
      <Path
        d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function GearSettingsIcon({ size = 20, color = adminColors.brand }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8" />
      <Path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke={color}
        strokeWidth="1.8"
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

export function TrendChartIcon({ size = 20, color = adminColors.brand }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 3v18h18" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M18 9l-5 5-4-4-6 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 9h4v4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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

export function PencilEditIcon({ size = 20, color = adminColors.brand }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function FlagAlertIcon({ size = 20, color = adminColors.brand }: AdminIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}




