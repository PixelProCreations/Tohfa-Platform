import React from 'react';
import Svg, { Line, Path } from 'react-native-svg';
import { authPalette as P } from '../../../../theme';

export function CloudOutlineIcon({ size = 22, color = P.twAmber800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6.5 19a4.5 4.5 0 0 1-.4-8.98A7.002 7.002 0 0 1 19.5 12a4.5 4.5 0 0 1-2 8.5H6.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function BarChartIcon({ size = 20, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="18" y1="20" x2="18" y2="10" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <Line x1="12" y1="20" x2="12" y2="4" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <Line x1="6" y1="20" x2="6" y2="14" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </Svg>
  );
}
