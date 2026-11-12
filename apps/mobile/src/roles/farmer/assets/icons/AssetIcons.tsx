import React from 'react';
import { Image, type ImageStyle, type StyleProp } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { authPalette as P, colors } from '../../theme';
import backButtonSource from './backbuton.png';
import googleIconSource from './googleee.png';
import facebookIconSource from './facebook.png';

export interface SvgIconProps {
  size?: number;
  color?: string;
  style?: StyleProp<any>;
}

export interface ImageIconProps {
  size?: number;
  style?: StyleProp<ImageStyle>;
}

export { backButtonSource, googleIconSource, facebookIconSource };

/**
 * BackButton icon using assets/icons/backbuton.png
 */
export const BackButtonIcon: React.FC<ImageIconProps & { color?: string }> = ({ size = 20, color = colors.brandGreen, style }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
    <Path
      d="M15 18L9 12L15 6"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Call/Phone icon using path from assets/icons/call.svg
 */
export const CallIcon: React.FC<SvgIconProps> = ({ size = 20, color = colors.twGray400, style }) => (
  <Svg width={size} height={size} viewBox="0 -960 960 960" fill={color} style={style}>
    <Path d="M796-120q-119 0-240-55.5T333-333Q231-435 175.5-556T120-796q0-18.86 12.57-31.43T164-840h147.33q14 0 24.34 9.83Q346-820.33 349.33-806l26.62 130.43q2.05 14.9-.62 26.24-2.66 11.33-10.82 19.48L265.67-530q24 41.67 52.5 78.5T381-381.33q35 35.66 73.67 65.5Q493.33-286 536-262.67l94.67-96.66q9.66-10.34 23.26-14.5 13.61-4.17 26.74-2.17L806-349.33q14.67 4 24.33 15.53Q840-322.27 840-308v144q0 18.86-12.57 31.43T796-120ZM233-592l76-76.67-21-104.66H187q3 41.66 13.67 86Q211.33-643 233-592Zm365.33 361.33q40.34 18.34 85.84 29.67 45.5 11.33 89.16 13.67V-288l-100-20.33-75 77.66ZM233-592Zm365.33 361.33Z" />
  </Svg>
);

/**
 * Lock/Security icon using path from assets/icons/lock.svg
 */
export const LockIcon: React.FC<SvgIconProps> = ({ size = 20, color = colors.twGray300, style }) => (
  <Svg width={size} height={size} viewBox="0 -960 960 960" fill={color} style={style}>
    <Path d="M226.67-80q-27.5 0-47.09-19.58Q160-119.17 160-146.67v-422.66q0-27.5 19.58-47.09Q199.17-636 226.67-636h60v-90.67q0-80.23 56.57-136.78T480.07-920q80.26 0 136.76 56.55 56.5 56.55 56.5 136.78V-636h60q27.5 0 47.09 19.58Q800-596.83 800-569.33v422.66q0 27.5-19.58 47.09Q760.83-80 733.33-80H226.67Zm0-66.67h506.66v-422.66H226.67v422.66Zm308.5-155.85Q558-325.04 558-356.67q0-31-22.95-55.16Q512.11-436 479.89-436t-55.06 24.17Q402-387.67 402-356.33q0 31.33 22.95 53.83 22.94 22.5 55.16 22.5t55.06-22.52ZM353.33-636h253.34v-90.67q0-52.77-36.92-89.72-36.93-36.94-89.67-36.94-52.75 0-89.75 36.94-37 36.95-37 89.72V-636ZM226.67-146.67v-422.66 422.66Z" />
  </Svg>
);

/**
 * Home icon using path from assets/icons/home.svg
 */
export const HomeIcon: React.FC<SvgIconProps> = ({ size = 24, color = colors.twGreen500, style }) => (
  <Svg width={size} height={size} viewBox="0 -960 960 960" fill={color} style={style}>
    <Path d="M226.67-186.67h140v-246.66h226.66v246.66h140v-380L480-756.67l-253.33 190v380ZM160-120v-480l320-240 320 240v480H526.67v-246.67h-93.34V-120H160Zm320-352Z" />
  </Svg>
);

/**
 * Google Icon using assets/icons/googleee.png
 */
export const GoogleIcon: React.FC<ImageIconProps> = ({ size = 24, style }) => (
  <Image
    source={googleIconSource}
    style={[{ width: size, height: size }, style]}
    resizeMode="contain"
  />
);

/**
 * Facebook Icon using assets/icons/facebook.png
 */
export const FacebookIcon: React.FC<ImageIconProps> = ({ size = 24, style }) => (
  <Image
    source={facebookIconSource}
    style={[{ width: size, height: size }, style]}
    resizeMode="contain"
  />
);

// ── Livestock animal-detail icons (moved verbatim from AnimalDetailScreen) ──

export function ArrowBackIcon({ size = 20, color = P.deepGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18L9 12L15 6"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PencilEditIcon({ size = 18, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function HeaderTagIcon({ size = 18, color = P.twGray600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="7" cy="7" r="1.5" fill={color} />
    </Svg>
  );
}

export function PawPrintIcon({ size = 26, color = P.twAmber800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="14.5" r="4.5" fill={color} />
      <Circle cx="6.5" cy="10" r="2.2" fill={color} />
      <Circle cx="17.5" cy="10" r="2.2" fill={color} />
      <Circle cx="9.5" cy="6" r="2" fill={color} />
      <Circle cx="14.5" cy="6" r="2" fill={color} />
    </Svg>
  );
}

// ── Tab Bar Icons ────────────────────────────────────────────────────────────

export function TabHealthIcon({ size = 16, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="5" width="7" height="15" rx="1.5" stroke={color} strokeWidth="2" />
      <Line x1="7.5" y1="2" x2="7.5" y2="5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Rect x="13" y="8" width="7" height="12" rx="1.5" stroke={color} strokeWidth="2" />
      <Line x1="16.5" y1="5" x2="16.5" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function TabFeedIcon({ size = 16, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function TabBreedingIcon({ size = 16, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function TabProductionIcon({ size = 16, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 6l-9.5 9.5-5-5L1 18"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M17 6h6v6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function TabHousingIcon({ size = 16, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Health Tab Icons ─────────────────────────────────────────────────────────

export function LeafIcon({ size = 18, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M2 21c0-3 1.85-5.36 5.08-6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function ProhibitedCircleIcon({ size = 18, color = P.twRed600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Line x1="5.6" y1="5.6" x2="18.4" y2="18.4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function VaccineVialsIcon({ size = 18, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="7" width="6" height="13" rx="1.5" stroke={color} strokeWidth="2" />
      <Line x1="7" y1="3" x2="7" y2="7" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Rect x="14" y="9" width="6" height="11" rx="1.5" stroke={color} strokeWidth="2" />
      <Line x1="17" y1="5" x2="17" y2="9" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="12" x2="10" y2="12" stroke={color} strokeWidth="1.5" />
      <Line x1="14" y1="14" x2="20" y2="14" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

export function DewormingBottleIcon({ size = 18, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="6" width="14" height="15" rx="3" stroke={color} strokeWidth="2" />
      <Rect x="8" y="2" width="8" height="4" rx="1" stroke={color} strokeWidth="2" />
      <Line x1="12" y1="10" x2="12" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="9" y1="13" x2="15" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function StethoscopeIcon({ size = 20, color = P.twBlue700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.5 3v5a5.5 5.5 0 0 0 11 0V3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 13.5v3.5a3 3 0 0 0 6 0V15"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="16" cy="13" r="2" stroke={color} strokeWidth="2" />
      <Path d="M3 3h3M14 3h3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ── Feed Tab Icons ───────────────────────────────────────────────────────────

export function SproutFodderIcon({ size = 18, color = P.twAmber800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 21V10" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M12 10a5 5 0 0 0-5-5M12 10a5 5 0 0 1 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="21" x2="20" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function ConcentrateMeshIcon({ size = 18, color = P.twAmber800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="8" cy="8" r="1.5" fill={color} />
      <Circle cx="12" cy="8" r="1.5" fill={color} />
      <Circle cx="16" cy="8" r="1.5" fill={color} />
      <Circle cx="8" cy="12" r="1.5" fill={color} />
      <Circle cx="12" cy="12" r="1.5" fill={color} />
      <Circle cx="16" cy="12" r="1.5" fill={color} />
      <Circle cx="8" cy="16" r="1.5" fill={color} />
      <Circle cx="12" cy="16" r="1.5" fill={color} />
      <Circle cx="16" cy="16" r="1.5" fill={color} />
    </Svg>
  );
}

export function CalfCowIcon({ size = 18, color = P.twAmber800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 5l2 3h6l2-3M6 9a6 6 0 0 0 12 0V8H6v1zM9 13h.01M15 13h.01M10 17h4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PlusCircleGreenIcon({ size = 17, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 8v8M8 12h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ── Production Tab Icons ─────────────────────────────────────────────────────

export function MilkDropletIcon({ size = 18, color = P.twBlue600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ── Housing Tab Icons ────────────────────────────────────────────────────────

export function BarnOutlineIcon({ size = 18, color = P.twAmber800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 22V13h6v9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ShieldCheckBadgeIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2l2.4 2 3.1-.3 1.2 2.9 3 1-.5 3.1 1.8 2.6-2 2.4.3 3.1-2.9 1.2-1 3-3.1-.5-2.6 1.8-2.4-2-3.1.3-1.2-2.9-3-1 .5-3.1-1.8-2.6 2-2.4-.3-3.1 2.9-1.2 1-3 3.1.5L12 2z"
        stroke={colors.brandGreen}
        strokeWidth="1.8"
      />
      <Path d="M8.5 12l2.5 2.5 5-5" stroke={colors.brandGreen} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function BroomCleaningIcon({ size = 17, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3v10M7 17l5-4 5 4M6 21h12M5 18l1.5 3M19 18l-1.5 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Add Health Record Modal Icons ───────────────────────────────────────────

export function GreenBackArrowIcon({ size = 22, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18L9 12L15 6"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function GenderSymbolIcon({ size = 12, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Circle cx="8" cy="6" r="4" stroke={color} strokeWidth="1.6" />
      <Line x1="8" y1="10" x2="8" y2="15" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="5.5" y1="12.5" x2="10.5" y2="12.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

export function FormCalendarIcon({ size = 18, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="2" />
      <Line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth="2" />
      <Line x1="8" y1="2" x2="8" y2="5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="16" y1="2" x2="16" y2="5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="8" cy="14" r="1" fill={color} />
      <Circle cx="12" cy="14" r="1" fill={color} />
      <Circle cx="16" cy="14" r="1" fill={color} />
    </Svg>
  );
}

export function FormChevronDownIcon({ size = 18, color = P.twGray500 }: { size?: number; color?: string }) {
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

export function FormCloseIcon({ size = 16, color = P.twGray600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function FormPlusIcon({ size = 16, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5v14M5 12h14"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function FormClockIcon({ size = 18, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 7v5l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function AttachmentPaperclipIcon({ size = 18, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ReceiptDocIcon({ size = 36 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <Rect width="36" height="36" rx="8" fill={P.twRed100} />
      <Path
        d="M11 9h10l4 4v14H11V9z"
        fill={P.twRed200}
        stroke={P.twRed600}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <Path d="M21 9v4h4" stroke={P.twRed600} strokeWidth="1.2" strokeLinejoin="round" />
      <Line x1="14" y1="17" x2="22" y2="17" stroke={P.twRed600} strokeWidth="1.2" strokeLinecap="round" />
      <Line x1="14" y1="20" x2="22" y2="20" stroke={P.twRed600} strokeWidth="1.2" strokeLinecap="round" />
      <Line x1="14" y1="23" x2="19" y2="23" stroke={P.twRed600} strokeWidth="1.2" strokeLinecap="round" />
    </Svg>
  );
}

export function FormCheckmarkIcon({ size = 18, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function BandaidCrossIcon({ size = 16, color = P.twOrange600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.657 6.343a4 4 0 0 1 0 5.657L12 17.657l-5.657-5.657a4 4 0 0 1 5.657-5.657l5.657 5.657z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6.343 6.343a4 4 0 0 0 0 5.657L12 17.657l5.657-5.657a4 4 0 0 0-5.657-5.657L6.343 6.343z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="1.5" fill={color} />
    </Svg>
  );
}

export function MedicalCrossIcon({ size = 16, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="4" stroke={color} strokeWidth="1.8" />
      <Path d="M12 7v10M7 12h10" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function TrashIcon({ size = 18, color = P.twRed500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="10" y1="11" x2="10" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="14" y1="11" x2="14" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function PlusCircleOutlineIcon({ size = 18, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 8v8M8 12h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function PeopleGroupIcon({ size = 16, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="7" r="3.5" stroke={color} strokeWidth="1.8" />
      <Path d="M2 20v-1.5a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4V20" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="17" cy="9" r="2.5" stroke={color} strokeWidth="1.8" />
      <Path d="M21 20v-1a3 3 0 0 0-2.5-3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}
