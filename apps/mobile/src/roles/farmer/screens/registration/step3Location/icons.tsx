import React from 'react';
import Svg, { Path, Circle as SvgCircle, Line } from 'react-native-svg';

export const ChevronLeft = ({ size = 24, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="m15 18-6-6 6-6"/>
  </Svg>
);

// Mirror of ChevronLeft's own path (same viewBox/stroke), for the location-slider's "next" arrow.
export const ChevronRight = ({ size = 24, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="m9 18 6-6-6-6"/>
  </Svg>
);

export const Crosshair = ({ size = 24, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <SvgCircle cx="12" cy="12" r="10"/>
    <Line x1="12" y1="2" x2="12" y2="6"/>
    <Line x1="12" y1="18" x2="12" y2="22"/>
    <Line x1="4" y1="12" x2="2" y2="12"/>
    <Line x1="22" y1="12" x2="20" y2="12"/>
  </Svg>
);

export const PenIcon = ({ size = 24, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 20h9"/>
    <Path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
  </Svg>
);

export const PlusIcon = ({ size = 24, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Line x1="12" y1="5" x2="12" y2="19"/>
    <Line x1="5" y1="12" x2="19" y2="12"/>
  </Svg>
);

export const MinusIcon = ({ size = 24, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Line x1="5" y1="12" x2="19" y2="12"/>
  </Svg>
);

export const SearchIcon = ({ size = 20, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <SvgCircle cx="11" cy="11" r="8"/>
    <Line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </Svg>
);

export const CloseIcon = ({ size = 20, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Line x1="18" y1="6" x2="6" y2="18"/>
    <Line x1="6" y1="6" x2="18" y2="18"/>
  </Svg>
);

export const PinIcon = ({ size = 20, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <SvgCircle cx="12" cy="10" r="3"/>
  </Svg>
);

export const LeafIcon = ({ size = 24, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2v1c0 5.6-4.5 11.2-11 11.2V20Z"/>
  </Svg>
);

export const CheckIcon = ({ size = 24, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 6 9 17l-5-5"/>
  </Svg>
);

export const TrashIcon = ({ size = 24, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 6h18"/>
    <Path d="M8 6V4h8v2"/>
    <Path d="M19 6l-1 14H6L5 6"/>
    <Line x1="10" y1="11" x2="10" y2="17"/>
    <Line x1="14" y1="11" x2="14" y2="17"/>
  </Svg>
);

export const SolidDot = ({ size = 10, color = "currentColor" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <SvgCircle cx="12" cy="12" r="10"/>
  </Svg>
);
