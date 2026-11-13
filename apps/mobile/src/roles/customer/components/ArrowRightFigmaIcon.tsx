import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface ArrowRightFigmaIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/**
 * Exact Figma SVG arrow icon matching the Tohfa circular action buttons
 * and "Get Started →" pills. Replaces Android system font unicode arrows.
 */
export const ArrowRightFigmaIcon: React.FC<ArrowRightFigmaIconProps> = ({
  size = 22,
  color = '#FFFFFF',
  strokeWidth = 2.4,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 12H19M13 6L19 12L13 18"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

