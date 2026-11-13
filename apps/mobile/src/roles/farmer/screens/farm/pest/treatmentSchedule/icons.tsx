import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { authPalette as P, colors } from '../../../../theme';

// Icons not already provided by ../pestManagement/icons.tsx.

export function CheckCircleIcon({ size = 22, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M8.5 12.5l2.5 2.5 5-5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Empty/unchecked circle -- the visible "tap here to mark done" affordance for an Upcoming reminder. */
export function CircleOutlineIcon({ size = 22, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    </Svg>
  );
}
