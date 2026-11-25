/**
 * Bottom tab bar icons for the Tohfa Admin shell, copied path-for-path from
 * the design (origin/tofhafarmfin-rbac TohfaAdminDashboardScreen: TabHomeIcon,
 * TabWorkQueueIcon, TabInventoryIcon, TabFinanceIcon, TabMoreIcon). The
 * colour is always passed in by the bar (active `brand`, inactive `muted`).
 */
import React from 'react';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import type { TohfaShellTab } from './tohfaShellRoutes';

interface TabIconProps {
  color: string;
  size?: number;
}

/** The design's icon size for every tab. */
const TAB_ICON_SIZE = 20;

function TabHomeIcon({ color, size = TAB_ICON_SIZE }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 21V12h6v9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TabWorkQueueIcon({ color, size = TAB_ICON_SIZE }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M8 6h13M8 12h13M8 18h13M3 6l1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TabInventoryIcon({ color, size = TAB_ICON_SIZE }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="m3.3 7 8.7 5 8.7-5M12 22V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TabFinanceIcon({ color, size = TAB_ICON_SIZE }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="12" r="2.5" stroke={color} strokeWidth="2" />
      <Line x1="6" y1="12" x2="6.01" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="18" y1="12" x2="18.01" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function TabMoreIcon({ color, size = TAB_ICON_SIZE }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="5" cy="5" r="2" fill={color} />
      <Circle cx="12" cy="5" r="2" fill={color} />
      <Circle cx="19" cy="5" r="2" fill={color} />
      <Circle cx="5" cy="12" r="2" fill={color} />
      <Circle cx="12" cy="12" r="2" fill={color} />
      <Circle cx="19" cy="12" r="2" fill={color} />
      <Circle cx="5" cy="19" r="2" fill={color} />
      <Circle cx="12" cy="19" r="2" fill={color} />
      <Circle cx="19" cy="19" r="2" fill={color} />
    </Svg>
  );
}

export const TOHFA_TAB_ICONS: Record<TohfaShellTab, (props: TabIconProps) => React.JSX.Element> = {
  Home: TabHomeIcon,
  WorkQueue: TabWorkQueueIcon,
  Inventory: TabInventoryIcon,
  Finance: TabFinanceIcon,
  More: TabMoreIcon,
};
