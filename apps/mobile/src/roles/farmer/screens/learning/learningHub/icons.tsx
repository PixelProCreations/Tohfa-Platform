import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors, authPalette as P } from '../../../theme';

export function SearchIcon({ size = 18, color = P.greyMid2 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20L16 16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function PlayTriangleOutlineIcon({ size = 22, color = P.greenDeep1 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 5.14v13.72a1 1 0 001.55.83l11-6.86a1 1 0 000-1.66l-11-6.86A1 1 0 008 5.14z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PlayCircleMiniIcon({ size = 26, color = P.weatherCloudWhite }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8" />
      <Path
        d="M10 8.5L16 12L10 15.5V8.5Z"
        fill={color}
      />
    </Svg>
  );
}

export function VerifiedBadgeIcon({ size = 15, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path
        d="M8 12.2L10.8 15L16.2 9.5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CloseIcon({ size = 20, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

export function BookOpenIcon({ size = 20, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function GroupUsersIcon({ size = 22, color = P.greenDeep1 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="8" r="3.2" stroke={color} strokeWidth="2" />
      <Path d="M3.5 19c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M15 6.5a3 3 0 0 1 0 5.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M16.5 14.2c2 .4 3.5 2 3.5 4.3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function MedalRibbonIcon({ size = 22, color = P.sky600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8.5" r="5.5" stroke={color} strokeWidth="2" />
      <Path d="M12 6.5l.8 1.6 1.7.3-1.2 1.2.3 1.8-1.6-.8-1.6.8.3-1.8-1.2-1.2 1.7-.3.8-1.6z" fill={color} />
      <Path d="M8.5 13.5L7 21l5-2.5 5 2.5-1.5-7.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PestBugIcon({ size = 22, color = P.twOrange600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="8" y="8" width="8" height="10" rx="4" stroke={color} strokeWidth="2" />
      <Path d="M12 4v4M12 12v6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M5 10l3 2M19 10l-3 2M5 16l3-1M19 16l-3-1M8 5l-2-2M16 5l2-2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function MountainTerraceIcon({ size = 22, color = P.brownDeep1 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 19l6.5-10L14 16l3.5-5 3.5 8H3z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function BanknotesCashIcon({ size = 22, color = P.twViolet600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="16" height="12" rx="2.5" stroke={color} strokeWidth="2" />
      <Circle cx="10" cy="12" r="2.5" stroke={color} strokeWidth="2" />
      <Path d="M18 9h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function CalendarCheckIcon({ size = 20, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M9 16l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
