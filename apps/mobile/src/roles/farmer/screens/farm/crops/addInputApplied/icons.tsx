import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { authPalette as P } from '../../../../theme';

// The shared FormCloseIcon uses a different size and stroke, so this screen
// keeps its own close glyph to stay pixel-identical.
export function CloseIcon({ size = 18, color = P.twGray800 }: { size?: number; color?: string }) {
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
