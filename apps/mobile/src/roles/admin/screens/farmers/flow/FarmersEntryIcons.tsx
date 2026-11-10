/**
 * The Farmers Management entry icons, ported as drawn in the team design
 * (origin/tofhafarmfin-rbac): the Farmer Admin tab bar's people-group icon,
 * and the people icon of the Sub warehouse Home "Farmers" tile and the
 * warehouse More menu's "Farmers Management" row. The host passes the colour
 * so each icon matches the bar or grid it sits in; nothing is hard-coded here.
 */
import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

interface IconProps {
  color: string;
  size?: number | undefined;
}

/** Farmer Admin tab bar (design FarmerAdminDashboardScreen PeopleGroupIcon). */
export function FarmersPeopleGroupIcon({ color, size = 21 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="7" r="2.2" stroke={color} strokeWidth="1.8" />
      <Path d="M8.5 17.5c0-2.2 1.55-3.8 3.5-3.8s3.5 1.6 3.5 3.8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="6" cy="9" r="1.8" stroke={color} strokeWidth="1.8" />
      <Path d="M3 17.5c0-1.8 1.4-3.2 3.2-3.2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="18" cy="9" r="1.8" stroke={color} strokeWidth="1.8" />
      <Path d="M21 17.5c0-1.8-1.4-3.2-3.2-3.2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

/** Sub warehouse Home tile and More row (design FarmersActionIcon / FarmManagementIcon). */
export function FarmersPeopleIcon({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
