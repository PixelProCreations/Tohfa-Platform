import React from 'react';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { authPalette as P, colors } from '../../../../theme';
import type { DairyProductType } from './model';

// ─────────────────────────────────────────────
// Inline SVG Icons
// ─────────────────────────────────────────────

export function ArrowBackIcon({ size = 20, color = P.twGray800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18L9 12L15 6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function DropIcon({ size = 20, color = colors.brandGreen, fill }: { size?: number; color?: string; fill?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill || 'none'}
      />
    </Svg>
  );
}

export function EggIcon({ size = 20, color = P.twAmber700, fill }: { size?: number; color?: string; fill?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3C8.5 3 5.5 8.5 5.5 14.5a6.5 6.5 0 0 0 13 0C18.5 8.5 15.5 3 12 3z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill || 'none'}
      />
    </Svg>
  );
}

export function CurdIcon({ size = 20, color = P.twBlue600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 10c0 5 3.5 9 8 9s8-4 8-9H4z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M7 6c1.5 2 3.5 2 5 0s3.5-2 5 0" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="10" x2="20" y2="10" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

export function PaneerIcon({ size = 20, color = P.twAmber600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="5" width="16" height="14" rx="3" stroke={color} strokeWidth="2" />
      <Path d="M4 12h16M12 5v14" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function ButterIcon({ size = 20, color = P.amberDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 13l4-7h10l4 7v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M7 6v7M17 6v7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function GheeIcon({ size = 20, color = P.twOrange600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9c0-2.2 2.7-4 6-4s6 1.8 6 4v9a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V9z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path d="M8 5V3h8v2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="14" r="2.5" fill={color} />
    </Svg>
  );
}

export function ButtermilkIcon({ size = 20, color = P.sky600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 3h10l-1.5 15a3 3 0 0 1-3 2.8h-1a3 3 0 0 1-3-2.8L7 3z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 8h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="12" cy="13" r="1.5" fill={color} />
    </Svg>
  );
}

export function CheeseIcon({ size = 20, color = P.pink800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 18h16a1 1 0 0 0 1-1V8.5L12 4 3 11v6a1 1 0 0 0 1 1z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="8" cy="13" r="1.5" fill={color} />
      <Circle cx="14" cy="11" r="1.2" fill={color} />
      <Circle cx="16" cy="15" r="1.5" fill={color} />
    </Svg>
  );
}

export function CowIcon({ size = 22, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M7 10h.01M17 10h.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M9 14h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M3 6L1 4M21 6l2-2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="10" cy="14" r="1" fill={color} />
      <Circle cx="14" cy="14" r="1" fill={color} />
    </Svg>
  );
}

export function PawIcon({ size = 20, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="15" r="4.2" fill={color} />
      <Circle cx="6.5" cy="10" r="2" fill={color} />
      <Circle cx="10" cy="5.5" r="2" fill={color} />
      <Circle cx="14" cy="5.5" r="2" fill={color} />
      <Circle cx="17.5" cy="10" r="2" fill={color} />
    </Svg>
  );
}

export function InfoCircleIcon({ size = 18, color = P.sky600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Line x1="12" y1="16" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="8" r="1" fill={color} />
    </Svg>
  );
}

export function ChevronDownIcon({ size = 16, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronRightIcon({ size = 16, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CheckIcon({ size = 18, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PlusIcon({ size = 18, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Icon for any dairy/produce product id. */
export function renderProductIcon(prod: DairyProductType, size: number = 20): React.JSX.Element {
  switch (prod) {
    case 'milk':
      return <DropIcon size={size} color={colors.brandGreen} fill={colors.brandGreen} />;
    case 'curd':
      return <CurdIcon size={size} color={P.twBlue600} />;
    case 'paneer':
      return <PaneerIcon size={size} color={P.twAmber600} />;
    case 'butter':
      return <ButterIcon size={size} color={P.amberDeep} />;
    case 'ghee':
      return <GheeIcon size={size} color={P.twOrange600} />;
    case 'buttermilk':
      return <ButtermilkIcon size={size} color={P.sky600} />;
    case 'cheese':
      return <CheeseIcon size={size} color={P.pink800} />;
    case 'eggs':
      return <EggIcon size={size} color={P.twAmber700} fill={P.twAmber700} />;
    default:
      return <DropIcon size={size} color={colors.brandGreen} />;
  }
}
