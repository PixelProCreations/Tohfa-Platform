/**
 * Icons for the Tohfa Admin Home tab, copied path-for-path from the design
 * (origin/tofhafarmfin-rbac TohfaAdminDashboardScreen: HomeHeaderIcon,
 * BellHeaderIcon, ProfileHeaderIcon, the Quick* action icons and the greeting /
 * search / date-chip icons). Colours are
 * the same admin theme tokens the design used.
 *
 * KpiClipboardIcon / KpiUsersIcon: the design's stat card drew 'clipboard'
 * and 'users' as built-in icons, which this branch's shared
 * OverviewDashboardCard does not have (it renders nothing for them). They are
 * passed to the card as custom nodes instead, with the design card's paths
 * and the card's default icon colour, so the card itself is not touched.
 */
import React from 'react';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { adminColors } from '../../theme';
import type { TohfaActionIcon } from './tohfaHomeLogic';

interface IconProps {
  size?: number;
  color?: string;
}

export function HomeHeaderIcon({ size = 20, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 21V12h6v9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function BellHeaderIcon({ size = 19, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ProfileHeaderIcon({ size = 20, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="1.8" />
      <Circle cx="12" cy="10" r="3.2" stroke={color} strokeWidth="1.8" />
      <Path d="M6.8 18.2a7 7 0 0 1 10.4 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function KpiClipboardIcon({ color = adminColors.brandDeep }: IconProps) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="17" rx="2.5" stroke={color} strokeWidth="1.9" />
      <Path d="M9 2.5h6a1 1 0 0 1 1 1V5H8V3.5a1 1 0 0 1 1-1z" stroke={color} strokeWidth="1.9" strokeLinejoin="round" />
      <Path d="M8.5 13l2.5 2.5 5-5" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function KpiUsersIcon({ color = adminColors.brandDeep }: IconProps) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Quick action icons (design size 26) ─────────────────────────────────────

function QuickUserSearchIcon({ size, color }: Required<IconProps>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Circle cx="18" cy="11" r="3" stroke={color} strokeWidth="2" />
      <Path d="M20.5 13.5L22 15" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function QuickCalendarActionIcon({ size, color }: Required<IconProps>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="8" cy="14" r="1.1" fill={color} />
      <Circle cx="12" cy="14" r="1.1" fill={color} />
      <Circle cx="16" cy="14" r="1.1" fill={color} />
      <Circle cx="8" cy="18" r="1.1" fill={color} />
      <Circle cx="12" cy="18" r="1.1" fill={color} />
      <Circle cx="16" cy="18" r="1.1" fill={color} />
    </Svg>
  );
}

function QuickGroupUsersIcon({ size, color }: Required<IconProps>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 21v-2a4 4 0 0 0-3-3.87" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 21v-2a4 4 0 0 1 3-3.87" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 21v-2a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="7" r="3.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="5" cy="10" r="2.2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="19" cy="10" r="2.2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function QuickReceiveGoodsIcon({ size, color }: Required<IconProps>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="3" stroke={color} strokeWidth="2" />
      <Path d="M12 7v8M8.5 11.5L12 15l3.5-3.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="7" y1="18" x2="17" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function QuickProduceListIcon({ size, color }: Required<IconProps>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="9" y1="6" x2="20" y2="6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="9" y1="12" x2="20" y2="12" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="9" y1="18" x2="20" y2="18" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="4.5" cy="6" r="1.5" fill={color} />
      <Circle cx="4.5" cy="12" r="1.5" fill={color} />
      <Circle cx="4.5" cy="18" r="1.5" fill={color} />
    </Svg>
  );
}

function QuickTransferStockIcon({ size, color }: Required<IconProps>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 8h14M15 5l3 3-3 3" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M20 16H6M9 13l-3 3 3 3" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function QuickTagIcon({ size, color }: Required<IconProps>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="7" cy="7" r="1.5" fill={color} />
    </Svg>
  );
}

function QuickCashTopUpIcon({ size, color }: Required<IconProps>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="17" height="12" rx="2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="10.5" cy="12" r="2.5" stroke={color} strokeWidth="2" />
      <Path d="M19 10v6a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 6V4a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function QuickReceiptIcon({ size, color }: Required<IconProps>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="8" y1="8" x2="16" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="12" x2="16" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="16" x2="12" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function QuickBagIcon({ size, color }: Required<IconProps>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="3" y1="6" x2="21" y2="6" stroke={color} strokeWidth="2" />
      <Path d="M16 10a4 4 0 0 1-8 0" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function QuickCutleryIcon({ size, color }: Required<IconProps>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5.5 4v6a2.8 2.8 0 0 0 2.8 2.8v7.2M8.3 4v6M11.1 4v6a2.8 2.8 0 0 1-2.8 2.8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M18.5 4v16M18.5 4c-3 0-5 2.5-5 6v4h5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const QUICK_ACTION_ICONS: Record<TohfaActionIcon, (p: Required<IconProps>) => React.JSX.Element> = {
  userSearch: QuickUserSearchIcon,
  calendar: QuickCalendarActionIcon,
  groupUsers: QuickGroupUsersIcon,
  receiveGoods: QuickReceiveGoodsIcon,
  produceList: QuickProduceListIcon,
  transfer: QuickTransferStockIcon,
  tag: QuickTagIcon,
  cashTopUp: QuickCashTopUpIcon,
  receipt: QuickReceiptIcon,
  bag: QuickBagIcon,
  cutlery: QuickCutleryIcon,
};

export function QuickActionIcon({ name }: { name: TohfaActionIcon }) {
  const Icon = QUICK_ACTION_ICONS[name];
  return <Icon size={26} color={adminColors.brand} />;
}

// ─── Greeting refresh, search bar and date-range chip (design: RefreshIcon,
// SearchIcon, FilterSlidersIcon, CalendarIcon, ChevronDownIcon) ─────────────

export function RefreshIcon({ size = 15, color = adminColors.brandDeep }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85.99 6.57 2.57L21 8" stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M21 3v5h-5" stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
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

export function FilterSlidersIcon({ size = 18, color = adminColors.brand }: IconProps) {
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

export function CalendarIcon({ size = 15, color = adminColors.brandDeep }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" />
      <Circle cx="8" cy="14" r="1.1" fill={color} />
      <Circle cx="12" cy="14" r="1.1" fill={color} />
      <Circle cx="16" cy="14" r="1.1" fill={color} />
      <Circle cx="8" cy="18" r="1.1" fill={color} />
      <Circle cx="12" cy="18" r="1.1" fill={color} />
    </Svg>
  );
}

export function ChevronDownIcon({ size = 14, color = adminColors.brandDeep }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
