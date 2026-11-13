import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

export const BackArrowSvg = () => (
  <Svg width={36} height={36} viewBox="0 0 36 36" fill="none">
    <Circle cx={18} cy={18} r={17} stroke="#1A2E1A" strokeWidth={1.5} />
    <Path d="M20 12l-6 6 6 6" stroke="#1A2E1A" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const SupportAgentSvg = () => (
  <Svg width={58} height={58} viewBox="0 0 64 64" fill="none">
    <Circle cx={32} cy={32} r={30} fill="#FDE68A" />
    <Path d="M20 54c0-6.627 5.373-12 12-12s12 5.373 12 12" fill="#D97706" />
    <Circle cx={32} cy={27} r={10} fill="#FCD34D" />
    <Path d="M22 25c0-5.523 4.477-10 10-10s10 4.477 10 10v4c0 1-2 2-4 2s-4-2-6-2-4 2-6 2-4-1-4-2v-4z" fill="#92400E" />
    <Circle cx={28.5} cy={26} r={1.2} fill="#78350F" />
    <Circle cx={35.5} cy={26} r={1.2} fill="#78350F" />
    <Path d="M29 30c1 1.2 5 1.2 6 0" stroke="#78350F" strokeWidth={1.2} strokeLinecap="round" />
    <Path d="M21 27a11 11 0 0122 0" stroke="#1F2937" strokeWidth={2} strokeLinecap="round" />
    <Rect x={19} y={24} width={4} height={7} rx={2} fill="#1F2937" />
    <Rect x={41} y={24} width={4} height={7} rx={2} fill="#1F2937" />
    <Path d="M22 30c0 4 3 6 8 6" stroke="#1F2937" strokeWidth={1.5} strokeLinecap="round" />
    <Circle cx={31} cy={36} r={2} fill="#10B981" />
  </Svg>
);

export const BoxSvg = ({ color = '#6B7280', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const CartSvg = ({ color = '#6B7280', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={9} cy={20} r={1.2} stroke={color} strokeWidth={1.8} />
    <Circle cx={19} cy={20} r={1.2} stroke={color} strokeWidth={1.8} />
    <Path d="M1 2h3.5l2.6 12a1.8 1.8 0 001.8 1.4h9.8a1.8 1.8 0 001.8-1.4L22 6H6" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const GridSvg = ({ color = '#6B7280', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={3} y={3} width={7} height={7} rx={1.5} stroke={color} strokeWidth={1.8} />
    <Rect x={14} y={3} width={7} height={7} rx={1.5} stroke={color} strokeWidth={1.8} />
    <Rect x={14} y={14} width={7} height={7} rx={1.5} stroke={color} strokeWidth={1.8} />
    <Rect x={3} y={14} width={7} height={7} rx={1.5} stroke={color} strokeWidth={1.8} />
  </Svg>
);

export const ShoppingBagSvg = ({ color = '#2E7D32', size = 20 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6zM3 6h18" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M16 10a4 4 0 01-8 0" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ChevronDownSvg = ({ color = '#4B5563', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const TruckSvg = ({ color = '#6B7280', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={1} y={3} width={15} height={13} rx={1} stroke={color} strokeWidth={1.8} />
    <Path d="M16 8h4l3 4v4h-7V8z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    <Circle cx={5.5} cy={18.5} r={2.5} stroke={color} strokeWidth={1.8} />
    <Circle cx={18.5} cy={18.5} r={2.5} stroke={color} strokeWidth={1.8} />
  </Svg>
);

export const CreditCardSvg = ({ color = '#6B7280', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={2} y={5} width={20} height={14} rx={2} stroke={color} strokeWidth={1.8} />
    <Path d="M2 10h20M6 15h4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

export const RepeatSvg = ({ color = '#6B7280', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const MapPinSvg = ({ color = '#6B7280', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx={12} cy={10} r={3} stroke={color} strokeWidth={1.8} />
  </Svg>
);

export const CameraPlusSvg = () => (
  <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
    <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="#059669" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx={12} cy={13} r={3.5} stroke="#059669" strokeWidth={1.8} />
    <Path d="M19 4v3M17.5 5.5h3" stroke="#059669" strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

export const QualitySvg = ({ color = '#6B7280', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={9} r={6} stroke={color} strokeWidth={1.8} />
    <Path d="M8 14.5L5 22l7-3.5 7 3.5-3-7.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 6.5l.8 1.8 1.9.3-1.4 1.3.3 1.9-1.6-.9-1.6.9.3-1.9-1.4-1.3 1.9-.3.8-1.8z" fill={color} />
  </Svg>
);

export const DamagedSvg = ({ color = '#6B7280', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={4} y={3} width={16} height={18} rx={2} stroke={color} strokeWidth={1.8} />
    <Path d="M12 3v5l2 2-3 3 2 3-1 5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const WrongItemSvg = ({ color = '#6B7280', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M17 14.5l4 4M21 14.5l-4 4" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export const MissingItemSvg = ({ color = '#6B7280', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16V8z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M3.3 7L12 12l8.7-5M12 22V12" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ScaleSvg = ({ color = '#6B7280', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={3} y={4} width={18} height={16} rx={3} stroke={color} strokeWidth={1.8} />
    <Circle cx={12} cy={9} r={3} stroke={color} strokeWidth={1.8} />
    <Path d="M12 9l1.5-1.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    <Path d="M7 16h10" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

export const CheckCircleSvg = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} fill="#2E7D32" stroke="#2E7D32" strokeWidth={1.5} />
    <Path d="M8 12l2.5 2.5L16 9" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const EmptyCircleSvg = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={8.5} stroke="#D1D5DB" strokeWidth={1.5} />
  </Svg>
);

export const RadioSelectedSvg = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={8.5} stroke="#2E7D32" strokeWidth={2} />
    <Circle cx={12} cy={12} r={4.5} fill="#2E7D32" />
  </Svg>
);

export const CloseSmallSvg = () => (
  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke="#4B5563" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const UserSvg = ({ color = '#6B7280', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx={12} cy={7} r={4} stroke={color} strokeWidth={1.8} />
  </Svg>
);

export const BellSvg = ({ color = '#6B7280', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const GearSvg = ({ color = '#6B7280', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={1.8} />
    <Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ShieldCheckSvg = ({ color = '#6B7280', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const InfoCircleSvg = ({ color = '#6B7280', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={1.8} />
    <Path d="M12 16v-4M12 8h.01" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export const TicketSvg = ({ color = '#2E7D32', size = 20 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M2 9a3 3 0 013-3h14a3 3 0 013 3v2a2 2 0 000 4v2a3 3 0 01-3 3H5a3 3 0 01-3-3v-2a2 2 0 000-4V9z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
    <Path d="M9 7v10M9 10h.01M9 14h.01" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeDasharray="2 2" />
  </Svg>
);

export const DashedCircleSvg = ({ size = 20, color = '#9CA3AF' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.8} strokeDasharray="3 3" />
  </Svg>
);

export const ActiveStepSvg = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={9} stroke="#2E7D32" strokeWidth={2} />
    <Circle cx={12} cy={12} r={5} fill="#2E7D32" />
  </Svg>
);

export const HeadsetSvg = ({ color = '#2E7D32', size = 20 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 18v-6a9 9 0 0118 0v6"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3v5zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3v5z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
  </Svg>
);

export const StarSvg = ({
  filled = true,
  size = 16,
  color,
}: {
  filled?: boolean;
  size?: number;
  color?: string;
}) => {
  const starColor = color || (filled ? '#F59E0B' : '#D1D5DB');
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? starColor : 'none'}>
      <Path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke={starColor}
        strokeWidth={filled ? 0 : 1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const StarTabSvg = ({ color = '#6B7280', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const CheckboxSvg = ({
  checked = false,
  size = 18,
}: {
  checked?: boolean;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x={3}
      y={3}
      width={18}
      height={18}
      rx={4}
      stroke={checked ? '#2E7D32' : '#D1D5DB'}
      strokeWidth={2}
      fill={checked ? '#2E7D32' : 'none'}
    />
    {checked && (
      <Path
        d="M7 12l3.5 3.5L17 8.5"
        stroke="#FFFFFF"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )}
  </Svg>
);

export const ProduceCrateSvg = ({ size = 58 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <Circle cx={24} cy={26} r={10} fill="#EF4444" />
    <Circle cx={20} cy={24} r={3} fill="#F87171" opacity={0.6} />
    <Path d="M24 16c0-3 3-5 5-5" stroke="#16A34A" strokeWidth={2} strokeLinecap="round" />
    <Path d="M38 18c-3 0-6 4-6 9 0 6 6 8 10 5s2-10-1-12c-1-1-2-2-3-2z" fill="#22C55E" />
    <Path d="M42 22c3-4 6-6 10-6" stroke="#15803D" strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M32 28c2-3 8-1 12 3" stroke="#F97316" strokeWidth={5} strokeLinecap="round" />
    <Rect x={10} y={32} width={44} height={22} rx={3} fill="#D97706" />
    <Rect x={12} y={34} width={40} height={5} rx={1} fill="#B45309" />
    <Rect x={12} y={41} width={40} height={5} rx={1} fill="#B45309" />
    <Rect x={12} y={48} width={40} height={4} rx={1} fill="#B45309" />
    <Rect x={10} y={32} width={5} height={22} rx={1} fill="#92400E" />
    <Rect x={49} y={32} width={5} height={22} rx={1} fill="#92400E" />
  </Svg>
);

export const MedalRibbonSvg = ({ size = 56 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <Path d="M32 4v6M50 12l-4 4M58 28h-6M14 12l4 4M6 28h6" stroke="#FBBF24" strokeWidth={2} strokeLinecap="round" />
    <Path d="M12 36c4-8 12-8 12-8s0 8-8 12c-2 2-4-2-4-4z" fill="#86EFAC" />
    <Path d="M52 36c-4-8-12-8-12-8s0 8 8 12c2 2 4-2 4-4z" fill="#86EFAC" />
    <Circle cx={32} cy={30} r={18} fill="#22C55E" />
    <Circle cx={32} cy={30} r={14} fill="#16A34A" />
    <Path
      d="M32 20l2.5 5 5.5.8-4 3.9 1 5.3-5-2.6-5 2.6 1-5.3-4-3.9 5.5-.8z"
      fill="#FFFFFF"
    />
    <Path d="M26 44l-4 12 10-4" fill="#15803D" />
    <Path d="M38 44l4 12-10-4" fill="#15803D" />
  </Svg>
);

export const ReturnBoxIllustrationSvg = ({ size = 58 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <Path d="M26 12c-3 0-5 4-5 8 0 5 5 7 8 4s2-9-1-11c-1-1-1-1-2-1z" fill="#22C55E" />
    <Path d="M22 14c-2-3-4-5-7-5" stroke="#15803D" strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M34 16c2-4 5-6 9-6" stroke="#15803D" strokeWidth={1.8} strokeLinecap="round" />
    <Circle cx={36} cy={22} r={7} fill="#EF4444" />
    <Circle cx={34} cy={20} r={2} fill="#F87171" opacity={0.6} />
    <Path d="M14 30l18-8 18 8v16l-18 8-18-8V30z" fill="#D97706" />
    <Path d="M14 30l18 8 18-8" stroke="#B45309" strokeWidth={1.5} />
    <Path d="M32 38v16" stroke="#B45309" strokeWidth={1.5} />
    <Path d="M14 30l8-8 10 5-8 3z" fill="#F59E0B" />
    <Path d="M50 30l-8-8-10 5 8 3z" fill="#B45309" />
    <Circle cx={46} cy={46} r={11} fill="#166534" />
    <Path
      d="M50 46h-6m0 0l2.5-2.5m-2.5 2.5l2.5 2.5"
      stroke="#FFFFFF"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ReturnTicketSvg = ({ color = '#166534', size = 20 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={3} y={4} width={18} height={16} rx={3} stroke={color} strokeWidth={1.8} />
    <Path d="M7 8h10M7 12h5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Path
      d="M16 16l-2-2m0 0l2-2m-2 2h3a1.5 1.5 0 011.5 1.5V16"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ReturnsMenuSvg = ({ color = '#1A2E1A', size = 20 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 8l8-4 8 4v8l-8 4-8-4V8z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M15 13l-3 3-3-3"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 9v7"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </Svg>
);
