import React, { useState, useMemo } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { adminColors, adminRadius, adminSpacing } from '../../theme';

// ─── Theme Colors ────────────────────────────────────────────────────────────
const THEME = {
  headerBg: adminColors.brand, // #F0562A Admin Theme Orange
  white: adminColors.onBrand,

  // Canvas & Surfaces
  canvas: adminColors.canvas, // #F3EFE9 Soft cream
  card: adminColors.card, // #FFFFFF Crisp card
  border: adminColors.border, // #EEDCD3
  borderLight: '#F3ECE4',
  borderGrey: '#D1D5DB',

  // Typography
  titleRustDark: adminColors.brandDeep, // #7A2E14
  sectionTitle: adminColors.brandDeep, // #7A2E14
  ink: adminColors.ink, // #1A1A1A
  muted: adminColors.muted, // #5F5E5A
  labelDark: '#374151',

  // Actions & Highlights — Unified Admin Theme Orange
  brandOrange: adminColors.brand, // #F0562A
  brandOrangeActive: adminColors.brand,
  orangeBadgeText: adminColors.brand,
  orangeBadgeBg: adminColors.brandTint, // #FDF3F0
  blueText: '#0369A1',
  blueBg: '#E0F2FE',
  purpleText: '#3C3489',
  purpleBg: '#EEEDFE',
  greenText: '#15803D',
  greenBg: '#EAF7EE',
  amberText: '#B45309',
  amberBg: '#FEF3E2',
};

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = THEME.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CertCheckIcon({ size = 18, color = '#15803D' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M8.5 12.5l2.5 2.5 4.5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PlusIcon({ size = 18, color = THEME.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-3.5-3.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 20, color = THEME.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Top track */}
      <Line x1="4" y1="6.5" x2="8" y2="6.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="12" y1="6.5" x2="20" y2="6.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="10" y1="4" x2="10" y2="9" stroke={color} strokeWidth="2.4" strokeLinecap="round" />

      {/* Middle track */}
      <Line x1="4" y1="12" x2="14" y2="12" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="18" y1="12" x2="20" y2="12" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="16" y1="9.5" x2="16" y2="14.5" stroke={color} strokeWidth="2.4" strokeLinecap="round" />

      {/* Bottom track */}
      <Line x1="4" y1="17.5" x2="8" y2="17.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="12" y1="17.5" x2="20" y2="17.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="10" y1="15" x2="10" y2="20" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </Svg>
  );
}

function TimelineCalendarIcon({ size = 18, color = '#854F0B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="1.8" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function TimelineInspectionIcon({ size = 18, color = '#854F0B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="17" rx="3" stroke={color} strokeWidth="1.8" />
      <Path d="M9 2h6v3H9z" stroke={color} strokeWidth="1.6" />
      <Line x1="8" y1="11" x2="16" y2="11" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8" y1="15" x2="13" y2="15" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function TimelineCompletedIcon({ size = 18, color = '#854F0B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path d="M8 12l2.5 2.5L16 9.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}


function PdfDocIcon({ size = 20, color = THEME.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="16" y1="13" x2="8" y2="13" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="16" y1="17" x2="8" y2="17" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="10" y1="9" x2="8" y2="9" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m9 18 6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronLeftIcon({ size = 18, color = '#4B5563' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m15 18-6-6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BanSlashIcon({ size = 18, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Line x1="5.6" y1="5.6" x2="18.4" y2="18.4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function HeaderBellIcon({ size = 20, color = THEME.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PendingCircleIcon({ size = 18, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" fill="none" />
    </Svg>
  );
}


function VerifiedBadgeIcon({ size = 18, color = '#15803D' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="m9 12 2 2 4-4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Exact Lucide flag icon for Red Flag banner */
function FlagIcon({ size = 18, color = '#DC2626' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="4" y1="22" x2="4" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

/** Exact Lucide lock icon for read-only fields */
function LockIcon({ size = 14, color = '#78716C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect width="18" height="11" x="3" y="11" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

/** Exact Lucide chevron-down icon for dropdown selectors */
function ChevronDownIcon({ size = 16, color = '#1F2937' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m6 9 6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Exact diagonal double-slash resize handle in bottom right of textarea */
function ResizeHandleIcon({ size = 12, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <Line x1="11" y1="5" x2="5" y2="11" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="11" y1="9" x2="9" y2="11" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

/** Exact Lucide circle-play (Circle with play arrow inside) */
function CirclePlayIcon({ size = 18, color = '#C05621' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8" />
      <Path d="m10 8 6 4-6 4V8z" fill={color} />
    </Svg>
  );
}

/** Exact Lucide newspaper (Inspection card icon) */
function NewspaperIcon({ size = 18, color = '#854F0B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1 2-2h2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect x="10" y="6" width="8" height="4" rx="1" stroke={color} strokeWidth="1.8" />
      <Path d="M18 14h-8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M15 18h-5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

/** Exact Lucide clipboard-check (Findings recorded) */
function ClipboardCheckIcon({ size = 18, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect width="8" height="4" x="8" y="2" rx="1" stroke={color} strokeWidth="1.8" />
      <Path
        d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="m9 14 2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Exact Lucide hard-hat (Safety helmet on Start / Resume button) */
function HardHatIcon({ size = 20, color = THEME.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 6a6 6 0 0 1 6 6v3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 15v-3a6 6 0 0 1 6-6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect
        x="2"
        y="15"
        width="20"
        height="4"
        rx="1"
        stroke={color}
        strokeWidth="2"
      />
    </Svg>
  );
}

/** Lucide file-text (FMB Sketch card icon) */
function FileTextIcon({ size = 19, color = '#854F0B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 2v4a2 2 0 0 0 2 2h4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M10 9H8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 13H8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 17H8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Lucide file-up (Upload file dashed box icon) */
function UploadFileIcon({ size = 19, color = '#854F0B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 2v4a2 2 0 0 0 2 2h4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 12v6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="m9 15 3-3 3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Lucide download icon for popup download action */
function DownloadIcon({ size = 18, color = THEME.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="m7 10 5 5 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 15V3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

/** Lucide x (close) icon for modal close button */
function CloseXIcon({ size = 18, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6 6 18M6 6l12 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Lucide sliders-horizontal (for Crops Grown field trigger) */
function SlidersHorizontalIcon({ size = 18, color = '#854F0B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="8" x2="20" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="16" x2="20" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="9" y1="5" x2="9" y2="11" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="15" y1="13" x2="15" y2="19" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

/** Checkbox component for multi-select crops list */
function CheckSquareIcon({ checked = false, size = 18, color = '#F0562A' }: { checked?: boolean; size?: number; color?: string }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: checked ? color : '#D1D5DB',
        backgroundColor: checked ? color : '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {checked && (
        <Svg width={size - 5} height={size - 5} viewBox="0 0 24 24" fill="none">
          <Path d="M20 6L9 17l-5-5" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      )}
    </View>
  );
}

/** Radio button dot component for single-select Plot/Zone and Water Source */
function RadioDotIcon({ selected = false, size = 18, color = '#F0562A' }: { selected?: boolean; size?: number; color?: string }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1.8,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
      }}
    >
      {selected && (
        <View
          style={{
            width: size - 8,
            height: size - 8,
            borderRadius: (size - 8) / 2,
            backgroundColor: color,
          }}
        />
      )}
    </View>
  );
}

/** Lucide calendar icon for date fields */
function CalendarIcon({ size = 18, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="1.8" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

/** Lucide chevron-up icon for accordion expanded state */
function ChevronUpIcon({ size = 16, color = '#1F2937' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m18 15-6-6-6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Up arrow icon for calendar header navigation */
function ArrowUpIcon({ size = 16, color = '#374151' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 19V5M12 5L6 11M12 5L18 11" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Down arrow icon for calendar header navigation */
function ArrowDownIcon({ size = 16, color = '#374151' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5V19M12 19L6 13M12 19L18 13" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Solid downward triangle icon for dropdown selector */
function SolidTriangleDownIcon({ size = 10, color = '#111827' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={Math.round(size * 0.7)} viewBox="0 0 10 7" fill="none">
      <Path d="M5 6.5L0.5 0.5H9.5L5 6.5Z" fill={color} />
    </Svg>
  );
}

/** Lucide info icon for banner */
function InfoIcon({ size = 18, color = '#854F0B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8" />
      <Line x1="12" y1="16" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="8" x2="12.01" y2="8" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

/** Lucide ban/prohibited icon for read-only notice */
function ProhibitedIcon({ size = 18, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8" />
      <Line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

/** Exact Lucide layers-2 icon for Soil & Land Management */
function LayersIcon({ size = 18, color = '#854F0B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M13 13.74a2 2 0 0 1-2 0L2.5 8.87a1 1 0 0 1 0-1.74L11 2.26a2 2 0 0 1 2 0l8.5 4.87a1 1 0 0 1 0 1.74z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="m20 14.285 1.5.845a1 1 0 0 1 0 1.74L13 21.74a2 2 0 0 1-2 0l-8.5-4.87a1 1 0 0 1 0-1.74l1.5-.845"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Exact Lucide tractor icon for Farming Practices */
function TractorIcon({ size = 18, color = '#854F0B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m10 11 11 .9a1 1 0 0 1 .8 1.1l-.665 4.158a1 1 0 0 1-.988.842H20" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 18h-5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M18 5a1 1 0 0 0-1 1v5.573" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M3 4h8.129a1 1 0 0 1 .99.863L13 11.246" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 11V4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M7 15h.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M8 10.1V4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="18" cy="18" r="2" stroke={color} strokeWidth="1.8" />
      <Circle cx="7" cy="15" r="5" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

/** Exact Lucide leaf icon for Environmental Sustainability */
function LeafIcon({ size = 18, color = '#854F0B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.5 19.5C4 12 11 4.5 19.5 4.5c0 8.5-7.5 15.5-15 15Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4.5 19.5C9 15 13.5 11 18 6.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Exact Produce Fruit icon matching user mockup (circular outline with top-left tilted solid leaf) */
function ProduceFruitIcon({
  size = 18,
  color = '#854F0B',
  leafColor,
}: {
  size?: number;
  color?: string;
  leafColor?: string;
}) {
  const isWhite = color?.toLowerCase() === '#ffffff' || color?.toLowerCase() === '#fff';
  const resolvedLeafColor = leafColor ?? (isWhite ? color : '#5C6B63');

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="14" r="5.8" stroke={color} strokeWidth="2.2" />
      <Path
        d="M12 8.2c.3-1.8 1.1-3 2.3-3.6"
        stroke={resolvedLeafColor}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Path
        d="M11.8 8.2C11.6 5.8 9.6 4.2 7.8 4.8c-.3 2.1 1.5 3.6 4 3.4z"
        fill={resolvedLeafColor}
      />
    </Svg>
  );
}

/** Exact Lucide qr-code icon for Traceability & Transparency */
function QrCodeIcon({ size = 18, color = '#854F0B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect width="5" height="5" x="3" y="3" rx="1" stroke={color} strokeWidth="1.8" />
      <Rect width="5" height="5" x="16" y="3" rx="1" stroke={color} strokeWidth="1.8" />
      <Rect width="5" height="5" x="3" y="16" rx="1" stroke={color} strokeWidth="1.8" />
      <Path d="M21 16h-3a2 2 0 0 0-2 2v3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M21 21v.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M12 7v3a2 2 0 0 1-2 2H7" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 12v3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M12 19h1" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M16 12h5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

/** Exact solid 3-person group icon for Social & Labor Practices */
function UsersIcon({ size = 18, color = '#854F0B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Center Person */}
      <Circle cx="12" cy="7.5" r="2.4" fill={color} />
      <Path d="M7.8 17.5c0-2.3 1.9-4.2 4.2-4.2s4.2 1.9 4.2 4.2v.5H7.8v-.5Z" fill={color} />
      {/* Left Person */}
      <Circle cx="5.5" cy="9.5" r="1.9" fill={color} />
      <Path d="M2.5 17.5c0-1.8 1.4-3.3 3.2-3.3.8 0 1.5.3 2 .8-.7.8-1.2 1.7-1.2 2.7v.3H2.5v-.5Z" fill={color} />
      {/* Right Person */}
      <Circle cx="18.5" cy="9.5" r="1.9" fill={color} />
      <Path d="M21.5 17.5c0-1.8-1.4-3.3-3.2-3.3-.8 0-1.5.3-2 .8.7.8 1.2 1.7 1.2 2.7v.3h4v-.5Z" fill={color} />
    </Svg>
  );
}

/** Exact Lucide landmark icon for Financial & Operational */
function LandmarkIcon({ size = 18, color = '#854F0B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="3" y1="22" x2="21" y2="22" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="6" y1="18" x2="6" y2="11" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="10" y1="18" x2="10" y2="11" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="14" y1="18" x2="14" y2="11" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="18" y1="18" x2="18" y2="11" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="m12 2 8 5H4Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

/** Exact Lucide store icon for Market & Buyer Relations */
function StoreIcon({ size = 18, color = '#854F0B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2 7h20" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 10V7" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Exact Lucide lightbulb icon for Innovation & Improvement */
function LightbulbIcon({ size = 18, color = '#854F0B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M9 18h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M10 22h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

const CALENDAR_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function getCalendarMatrix(year: number, month: number) {
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: { day: number; isCurrentMonth: boolean; monthOffset: number }[] = [];

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    cells.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      monthOffset: -1,
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      day: d,
      isCurrentMonth: true,
      monthOffset: 0,
    });
  }

  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({
      day: d,
      isCurrentMonth: false,
      monthOffset: 1,
    });
  }

  return cells;
}

// ─── Data Types & Initial Records ───────────────────────────────────────────

export interface InspectionSectionItem {
  id: number;
  title: string;
  requiredLeft: string;
}

export const INSPECTION_SECTIONS: InspectionSectionItem[] = [
  { id: 1, title: 'Farmer Contact Verification', requiredLeft: '1 required field left' },
  { id: 2, title: 'FMB & Land Verification', requiredLeft: '1 required field left' },
  { id: 3, title: 'Farm Details Verification', requiredLeft: '1 required field left' },
  { id: 4, title: 'Certification Verification', requiredLeft: '2 required fields left' },
  { id: 5, title: 'Soil Testing & Soil Report', requiredLeft: '1 required field left' },
  { id: 6, title: 'Water Source & Water pH Testing', requiredLeft: '1 required field left' },
  { id: 7, title: 'Farm Practices Checklist', requiredLeft: '4 required fields left' },
  { id: 8, title: 'Documents & Evidence', requiredLeft: 'Not started' },
  { id: 9, title: 'Inspection Observations & Findings', requiredLeft: 'Not started' },
  { id: 10, title: 'Farmer Admin Assessment', requiredLeft: '1 required field left' },
  { id: 11, title: 'Farmer Rating', requiredLeft: 'Rate the farmer based on the audit inspection.' },
];

export const ALL_CROPS = [
  'Beans',
  'Beetroot',
  'Cabbage',
  'Carrot',
  'Cauliflower',
  'Garlic',
  'Peas',
  'Potato',
  'Radish',
  'Tomato',
];

export const ALL_PLOTS = ['Plot A', 'Plot B', 'Plot C'];

export const ALL_WATER_SOURCES = ['Open Well', 'Borewell'];

export const ALL_STEP6_WATER_SOURCES = ['Open Well 1', 'Borewell 1'];
export const ALL_WATER_USE_PURPOSES = ['Drinking', 'Irrigation', 'Livestock', 'Processing'];

export interface Step6WaterSourceEntry {
  id: string;
  sourceName: string;
  sourceType: string;
  location: string;
  usePurposes: string[];
  verification: string;
  condition: string;
  testDate: string;
  testingMethod: string;
  testingDevice: string;
  uploadedReport: string | null;
  phMeasurementStatus: string;
  testVerificationStatus: string;
  notes: string;
}

export type Step7SectionKey = 'farmDoc' | 'organicPractices' | 'cropMgmt' | 'inputUsage';

export interface Step7SectionData {
  inspectionResult: string;
  notes: string;
  evidence: string;
  uploadedFile: { name: string; size: string } | null;
}

export const STEP7_SECTIONS_CONFIG: {
  key: Step7SectionKey;
  title: string;
}[] = [
  { key: 'farmDoc', title: 'FARM DOCUMENTATION' },
  { key: 'organicPractices', title: 'ORGANIC PRACTICES' },
  { key: 'cropMgmt', title: 'CROP MANAGEMENT' },
  { key: 'inputUsage', title: 'INPUT USAGE' },
];

export const STEP7_INSPECTION_RESULTS = [
  'Select...',
  'Compliant',
  'Non-Compliant',
  'Not Applicable',
] as const;

export const STEP7_EXISTING_EVIDENCES = [
  'FMB Sketch (on file)',
  'PGS Organic Certificate (on file)',
];

export interface Step8EvidenceEntry {
  id: string;
  category: string;
  relatedSection: string;
  documentType: string;
  uploadedFile: { name: string; size: string } | null;
  verificationStatus: string;
  missingReason: string;
  notes: string;
}

export const STEP8_EVIDENCE_CATEGORIES = [
  'Select...',
  'Documentation',
  'Photo Evidence',
  'Test Report',
  'Other',
] as const;

export const STEP8_DOCUMENT_TYPES = [
  'Select...',
  'PDF',
  'Image',
  'Scanned Copy',
] as const;

export const STEP8_VERIFICATION_STATUSES = [
  'Select...',
  'Verified',
  'Could Not Verify',
] as const;

export const STEP8_MISSING_REASONS = [
  'Select...',
  'Not Applicable',
  'Farmer Did Not Provide',
  'Lost / Misplaced',
] as const;

export const STEP8_RELATED_SECTIONS = [
  'Farmer Contact Verification',
  'FMB & Land Verification',
  'Farm Details Verification',
  'Certification Verification',
  'Soil Testing & Soil Report',
  'Water Source & Water pH Testing',
  'Farm Practices Checklist',
  'Documents & Evidence',
  'Inspection Observations & Findings',
  'Farmer Admin Assessment',
];

export interface Step9ObservationEntry {
  id: string;
  relatedSection: string;
  category: string;
  observation: string;
  followUpRecommendation: string;
  recommendationNotes: string;
  evidenceReference: string;
  followUpRequired: string;
}

export const STEP9_OBSERVATION_CATEGORIES = [
  'Select...',
  'Documentation Gap',
  'Practice Concern',
  'Positive Observation',
  'Other',
] as const;

export const STEP9_FOLLOWUP_RECOMMENDATIONS = [
  'Select...',
  'Re-visit Recommended',
  'Farmer Guidance Needed',
  'No Action Needed',
] as const;

export const STEP9_FOLLOWUP_REQUIRED_OPTIONS = [
  'Select...',
  'Yes',
  'No',
] as const;

// ─── Step 10 Constants (Farmer Admin Assessment - Screenshots 1 to 5) ───
export const STEP10_OVERALL_ASSESSMENT_OPTIONS = [
  'Select...',
  'Satisfactory',
  'Needs Improvement',
  'Unsatisfactory',
] as const;

export const STEP10_FOLLOWUP_REQUIRED_OPTIONS = [
  'Select...',
  'Yes',
  'No',
] as const;

export const STEP10_RECOMMENDATION_OPTIONS = [
  'Select...',
  'Continue Certification',
  'Re-audit Required',
  'Escalate to Senior Auditor',
] as const;

// ─── Step 11 Constants (Farmer Rating - Screenshots 1 to 4) ───
export interface Step11RatingCategory {
  id: string;
  title: string;
  iconName: 'verified' | 'layers' | 'tractor' | 'leaf' | 'fruit' | 'qr' | 'users' | 'landmark' | 'store' | 'lightbulb';
  previousAudit: string;
}

export const STEP11_RATING_CATEGORIES: Step11RatingCategory[] = [
  { id: 'cert', title: 'Certification & Compliance', iconName: 'verified', previousAudit: '8/10' },
  { id: 'soil', title: 'Soil & Land Management', iconName: 'layers', previousAudit: '7/10' },
  { id: 'farm', title: 'Farming Practices', iconName: 'tractor', previousAudit: '7/10' },
  { id: 'env', title: 'Environmental Sustainability', iconName: 'leaf', previousAudit: '6/10' },
  { id: 'yield', title: 'Produce Quality & Yield', iconName: 'fruit', previousAudit: '8/10' },
  { id: 'trace', title: 'Traceability & Transparency', iconName: 'qr', previousAudit: '7/10' },
  { id: 'social', title: 'Social & Labor Practices', iconName: 'users', previousAudit: '6/10' },
  { id: 'financial', title: 'Financial & Operational', iconName: 'landmark', previousAudit: '8/10' },
  { id: 'market', title: 'Market & Buyer Relations', iconName: 'store', previousAudit: '6/10' },
  { id: 'innovation', title: 'Innovation & Improvement', iconName: 'lightbulb', previousAudit: '5/10' },
];

export interface AuditScheduleRecord {
  id: string;
  badge: 'Completed' | 'Upcoming' | 'Scheduled' | 'In Progress' | 'Cancelled' | 'Rescheduled';
  farmerName: string;
  farmerId?: string | undefined;
  farmingType?: string | undefined;
  yearsOrganic?: number | undefined;
  farm: string;
  type: 'Internal' | 'External' | 'Field Visit';
  date: string;
  assignedText?: string | undefined;
  auditor?: string | undefined;
  dateBucket?: 'Today' | 'This Week' | 'This Month' | 'Custom' | undefined;
  score?: string | undefined;
  majorFindings?: number | undefined;
  minorFindings?: number | undefined;
  redFlags?: number | undefined;
  year?: '2026' | '2025' | '2024' | undefined;
  remarks?: string | undefined;
  inference?: string | undefined;
  timeline?: Array<{ title: string; date: string; iconType: 'calendar' | 'inspection' | 'completed' }> | undefined;
  pgsOrganic?: { status: string; renewalDate: string } | undefined;
  npop?: { status: string; renewalDate: string } | undefined;
  previousSummary?: { date: string; score: string } | undefined;
}

const INITIAL_SCHEDULE_RECORDS: AuditScheduleRecord[] = [
  {
    id: 'AUD-2026-0042',
    badge: 'Upcoming',
    farmerName: 'Ramesh Kumar',
    farmerId: 'FR-00241',
    farmingType: 'Organic',
    yearsOrganic: 6,
    farm: 'Ooty Farm 01',
    type: 'Internal',
    date: '15 Oct 2026',
    score: '0/100',
    majorFindings: 0,
    minorFindings: 1,
    redFlags: 0,
    year: '2026',
    assignedText: 'Assigned Auditor',
    auditor: 'Suresh Kumar',
    dateBucket: 'Today',
    remarks: 'Minor pest-management notation on plot 2; farmer advised on organic treatment and has since addressed it.',
    inference: 'Farm continues to meet organic certification standards. Recommended for continued certification with routine follow-up at next quarterly audit.',
    timeline: [
      { title: 'Audit Started', date: '15 Oct 2026, 9:40 AM', iconType: 'calendar' },
      { title: 'Inspection', date: '15 Oct 2026, 10:15 AM', iconType: 'inspection' },
      { title: 'Findings Recorded', date: 'Pending', iconType: 'completed' },
    ],
    pgsOrganic: { status: 'Active', renewalDate: '12 Jun 2027' },
    npop: { status: 'Active', renewalDate: '01 Mar 2027' },
    previousSummary: { date: '15 Jul 2026', score: '0/100' },
  },
  {
    id: 'AUD-2026-0035',
    badge: 'Completed',
    farmerName: 'Selvi',
    farmerId: 'FR-00192',
    farmingType: 'Organic',
    yearsOrganic: 4,
    farm: 'Coonoor Farm',
    type: 'External',
    date: '10 Apr 2026',
    score: '91/100',
    majorFindings: 0,
    minorFindings: 0,
    redFlags: 0,
    year: '2026',
    assignedText: 'External',
    auditor: 'External Inspector',
    dateBucket: 'Today',
    remarks: 'Full bio-input and documentation compliance maintained on all plots.',
    inference: 'Annual organic compliance audit completed with high rating.',
    timeline: [
      { title: 'Audit Scheduled', date: '25 Mar 2026', iconType: 'calendar' },
      { title: 'Inspection', date: '10 Apr 2026, 9:30 AM', iconType: 'inspection' },
      { title: 'Audit Completed', date: '10 Apr 2026, 12:00 PM', iconType: 'completed' },
    ],
    pgsOrganic: { status: 'Active', renewalDate: '24 Sep 2027' },
    npop: { status: 'Active', renewalDate: '15 Nov 2026' },
    previousSummary: { date: '10 Apr 2026', score: '91/100' },
  },
  {
    id: 'FV-2026-0018',
    badge: 'Scheduled',
    farmerName: 'Selvi',
    farmerId: 'FR-00192',
    farmingType: 'Organic',
    yearsOrganic: 4,
    farm: 'Coonoor Farm',
    type: 'Field Visit',
    date: '08 Oct 2026',
    dateBucket: 'Today',
    year: '2026',
    assignedText: 'Assigned Auditor',
    auditor: 'Selvi / Field Officer',
    score: '85/100',
    majorFindings: 0,
    minorFindings: 0,
    redFlags: 0,
    remarks: 'Routine pre-harvest inspection.',
    inference: 'Satisfactory adherence.',
    timeline: [
      { title: 'Audit Scheduled', date: '01 Oct 2026', iconType: 'calendar' },
      { title: 'Inspection', date: '08 Oct 2026, 10:00 AM', iconType: 'inspection' },
      { title: 'Audit Completed', date: 'Pending', iconType: 'completed' },
    ],
    pgsOrganic: { status: 'Active', renewalDate: '24 Sep 2027' },
    npop: { status: 'Active', renewalDate: '15 Nov 2026' },
    previousSummary: { date: '10 Aug 2026', score: '85/100' },
  },
  {
    id: 'AUD-2026-0039',
    badge: 'Upcoming',
    farmerName: 'Kumar',
    farmerId: 'FR-00318',
    farmingType: 'Organic',
    yearsOrganic: 5,
    farm: 'Ooty Farm 03',
    type: 'External',
    date: '20 Oct 2026',
    assignedText: 'Assigned Auditor',
    auditor: 'External Inspector',
    dateBucket: 'This Week',
    year: '2026',
    score: '78/100',
    majorFindings: 0,
    minorFindings: 2,
    redFlags: 0,
    remarks: 'Pre-audit documentation verification required.',
    inference: 'Recommended for follow-up review.',
    timeline: [
      { title: 'Audit Scheduled', date: '10 Oct 2026', iconType: 'calendar' },
      { title: 'Inspection', date: '20 Oct 2026, 11:00 AM', iconType: 'inspection' },
      { title: 'Audit Completed', date: 'Pending', iconType: 'completed' },
    ],
    pgsOrganic: { status: 'Active', renewalDate: '18 May 2027' },
    npop: { status: 'Active', renewalDate: '12 Aug 2027' },
    previousSummary: { date: '02 Jun 2026', score: '78/100' },
  },
  {
    id: 'FV-2026-0022',
    badge: 'Scheduled',
    farmerName: 'Vijay Anand',
    farmerId: 'FR-00288',
    farmingType: 'Natural',
    yearsOrganic: 3,
    farm: 'Kotagiri Farm',
    type: 'Field Visit',
    date: '24 Oct 2026',
    assignedText: 'Assigned Auditor',
    auditor: 'Field Officer',
    dateBucket: 'This Week',
    year: '2026',
    score: '82/100',
    majorFindings: 0,
    minorFindings: 1,
    redFlags: 0,
    remarks: 'Soil conservation practice assessment scheduled.',
    inference: 'On track for regular certification.',
    timeline: [
      { title: 'Audit Scheduled', date: '14 Oct 2026', iconType: 'calendar' },
      { title: 'Inspection', date: '24 Oct 2026, 2:00 PM', iconType: 'inspection' },
      { title: 'Audit Completed', date: 'Pending', iconType: 'completed' },
    ],
    pgsOrganic: { status: 'Active', renewalDate: '10 Jan 2027' },
    npop: { status: 'Active', renewalDate: '05 Apr 2027' },
    previousSummary: { date: '14 May 2026', score: '82/100' },
  },
  {
    id: 'AUD-2026-0045',
    badge: 'In Progress',
    farmerName: 'Meena Krishnan',
    farmerId: 'FR-00412',
    farmingType: 'Organic',
    yearsOrganic: 7,
    farm: 'Coonoor Farm 02',
    type: 'Internal',
    date: '28 Oct 2026',
    assignedText: 'Assigned Auditor',
    auditor: 'Assigned Auditor',
    dateBucket: 'This Month',
    year: '2026',
    score: '90/100',
    majorFindings: 0,
    minorFindings: 0,
    redFlags: 0,
    remarks: 'Field audit in progress.',
    inference: 'High adherence to standards.',
    timeline: [
      { title: 'Audit Scheduled', date: '18 Oct 2026', iconType: 'calendar' },
      { title: 'Inspection', date: '28 Oct 2026, 10:00 AM', iconType: 'inspection' },
      { title: 'Audit Completed', date: 'Pending', iconType: 'completed' },
    ],
    pgsOrganic: { status: 'Active', renewalDate: '19 Oct 2027' },
    npop: { status: 'Active', renewalDate: '22 Feb 2027' },
    previousSummary: { date: '21 Jun 2026', score: '90/100' },
  },
];

// ─── Props ───────────────────────────────────────────────────────────────────

export interface AuditScheduleScreenProps {
  onBack: () => void;
  initialTypeFilter?: 'all' | 'field_visit' | 'history' | 'calendar' | 'report' | undefined;
  initialAuditId?: string | undefined;
  initialView?:
    | 'history'
    | 'audit_detail'
    | 'audit_report'
    | 'list'
    | 'detail'
    | 'schedule_visit'
    | 'inspection'
    | 'calendar'
    | 'audit_details_m5'
    | 'pdf_viewer'
    | undefined;
  onNavigateFarmerProfile?: ((farmerId: string) => void) | undefined;
  onOpenNotifications?: (() => void) | undefined;
}

export function AuditScheduleScreen({
  onBack,
  initialTypeFilter = 'calendar',
  initialAuditId,
  initialView,
  onNavigateFarmerProfile,
  onOpenNotifications,
}: AuditScheduleScreenProps) {
  // Navigation views: 'calendar' | 'audit_details_m5' | 'pdf_viewer' | 'history' | 'audit_detail' | 'audit_report' | 'list' | 'filters' | 'detail' | 'schedule_visit' | 'inspection' | 'audit_inspection' | 'inspection_step'
  const [currentView, setCurrentView] = useState<
    | 'calendar'
    | 'audit_details_m5'
    | 'pdf_viewer'
    | 'history'
    | 'audit_detail'
    | 'audit_report'
    | 'list'
    | 'filters'
    | 'detail'
    | 'schedule_visit'
    | 'inspection'
    | 'audit_inspection'
    | 'inspection_step'
  >(
    initialView ||
      (initialTypeFilter === 'report'
        ? 'audit_report'
        : initialTypeFilter === 'field_visit'
        ? 'calendar'
        : initialAuditId
        ? 'audit_details_m5'
        : initialTypeFilter === 'history'
        ? 'history'
        : 'calendar')
  );

  const [previousView, setPreviousView] = useState<string>('calendar');

  // Calendar State (Image 1)
  const [calendarViewMode, setCalendarViewMode] = useState<'Month' | 'Week' | 'List'>(() => {
    if (initialTypeFilter === 'field_visit') return 'List';
    return 'Month';
  });
  const [calAuditType, setCalAuditType] = useState<'All Types' | 'Internal' | 'External' | 'Field Visit'>('All Types');
  const [calStatus, setCalStatus] = useState<'All Status' | 'Upcoming' | 'Scheduled' | 'In Progress'>('All Status');
  const [calZone, setCalZone] = useState<'All Zones' | 'Ooty' | 'Kotagiri' | 'Coonoor'>('All Zones');
  const [selectedCalDay, setSelectedCalDay] = useState<number>(8);

  const [records, setRecords] = useState<AuditScheduleRecord[]>(INITIAL_SCHEDULE_RECORDS);
  const [selectedRecord, setSelectedRecord] = useState<AuditScheduleRecord>(() => {
    const defaultRec = INITIAL_SCHEDULE_RECORDS[0]!;
    if (initialAuditId) {
      return INITIAL_SCHEDULE_RECORDS.find((r) => r.id === initialAuditId) ?? defaultRec;
    }
    if (initialTypeFilter === 'field_visit') {
      return INITIAL_SCHEDULE_RECORDS.find((r) => r.id === 'AUD-2026-0042') ?? defaultRec;
    }
    return defaultRec;
  });

  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Inline Filter state for Audit History (Screenshot 5)
  const [showHistoryFilter, setShowHistoryFilter] = useState(false);
  const [historyDraftType, setHistoryDraftType] = useState<'All' | 'Internal' | 'External' | 'Field Visit'>('All');
  const [historyDraftYear, setHistoryDraftYear] = useState<'2026' | '2025' | '2024'>('2026');
  const [historyDraftStatus, setHistoryDraftStatus] = useState<'All' | 'Completed' | 'Cancelled' | 'Rescheduled'>('All');

  const [historyAppliedType, setHistoryAppliedType] = useState<'All' | 'Internal' | 'External' | 'Field Visit'>('All');
  const [historyAppliedYear, setHistoryAppliedYear] = useState<'2026' | '2025' | '2024'>('2026');
  const [historyAppliedStatus, setHistoryAppliedStatus] = useState<'All' | 'Completed' | 'Cancelled' | 'Rescheduled'>('All');

  // Applied Filters
  const [appliedAuditType, setAppliedAuditType] = useState<
    'All' | 'Internal' | 'External' | 'Field Visit'
  >(initialTypeFilter === 'field_visit' ? 'Field Visit' : 'All');
  const [appliedStatus, setAppliedStatus] = useState<
    'All' | 'Upcoming' | 'Scheduled' | 'In Progress'
  >('All');
  const [appliedDate, setAppliedDate] = useState<
    'Today' | 'This Week' | 'This Month' | 'Custom'
  >('Today');

  // Draft Filters in Filter Page
  const [draftAuditType, setDraftAuditType] = useState<'All' | 'Internal' | 'External' | 'Field Visit'>(appliedAuditType);
  const [draftStatus, setDraftStatus] = useState<'All' | 'Upcoming' | 'Scheduled' | 'In Progress'>(appliedStatus);
  const [draftDate, setDraftDate] = useState<'Today' | 'This Week' | 'This Month' | 'Custom'>(appliedDate);

  // Schedule Field Visit State
  const [visitDate, setVisitDate] = useState<'08 Oct' | '09 Oct' | '10 Oct'>('08 Oct');
  const [visitTime, setVisitTime] = useState<'10:00 AM' | '2:00 PM'>('10:00 AM');
  const [visitNotes, setVisitNotes] = useState('');

  // Inspection / Findings Screen State
  const [inspectionMode, setInspectionMode] = useState<'Normal' | 'Red Flag'>('Normal');
  const [completedInspectionScore, setCompletedInspectionScore] = useState<number | null>(null);

  // 11 Sections Audit State
  const [completedSections, setCompletedSections] = useState<Record<number, boolean>>({});
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1 Form state (Screenshots 3 & 4)
  const [preferredContact, setPreferredContact] = useState<'Select...' | 'WhatsApp' | 'SMS' | 'Phone'>('SMS');
  const [contactDropdownOpen, setContactDropdownOpen] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'Select...' | 'Verified' | 'Need Correction' | 'Not Verified'>('Select...');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  // Step 2 Form state (FMB & Land Verification)
  const [surveyRefNumber, setSurveyRefNumber] = useState<string>('');
  const [fmbDocAvailable, setFmbDocAvailable] = useState<string>('Select...');
  const [docLegibility, setDocLegibility] = useState<string>('Select...');
  const [boundaryVerification, setBoundaryVerification] = useState<string>('Select...');
  const [farmLocationVerification, setFarmLocationVerification] = useState<string>('Select...');
  const [plotMappingStatus, setPlotMappingStatus] = useState<string>('Select...');
  const [landBoundaryStatus, setLandBoundaryStatus] = useState<string>('Select...');
  const [step2Notes, setStep2Notes] = useState<string>('');
  const [step2OpenDropdown, setStep2OpenDropdown] = useState<
    'fmbDoc' | 'legibility' | 'boundary' | 'location' | 'mapping' | 'landBoundary' | null
  >(null);
  const [fmbUploadedFile, setFmbUploadedFile] = useState<string | null>(null);
  const [evidenceUploadedFile, setEvidenceUploadedFile] = useState<string | null>(null);
  const [fmbModalVisible, setFmbModalVisible] = useState(false);

  // Step 3 Form state (Farm Details Verification)
  const [farmingType, setFarmingType] = useState<string>('Select...');
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [cropsModalVisible, setCropsModalVisible] = useState(false);
  const [cropSearchQuery, setCropSearchQuery] = useState('');
  const [selectedPlotZone, setSelectedPlotZone] = useState<string>('Select...');
  const [plotModalVisible, setPlotModalVisible] = useState(false);
  const [plotSearchQuery, setPlotSearchQuery] = useState('');
  const [selectedWaterSource, setSelectedWaterSource] = useState<string>('Select...');
  const [waterModalVisible, setWaterModalVisible] = useState(false);
  const [waterSearchQuery, setWaterSearchQuery] = useState('');
  const [irrigationType, setIrrigationType] = useState<string>('Select...');
  const [farmRecordsAvailability, setFarmRecordsAvailability] = useState<string>('Select...');
  const [farmDetailsVerification, setFarmDetailsVerification] = useState<string>('Select...');
  const [step3Notes, setStep3Notes] = useState<string>('');
  const [step3OpenDropdown, setStep3OpenDropdown] = useState<
    'farmingType' | 'irrigation' | 'records' | 'verification' | null
  >(null);

  // Step 4 Form state (Certification Verification)
  const [pgsExpanded, setPgsExpanded] = useState<boolean>(true);
  const [npopExpanded, setNpopExpanded] = useState<boolean>(false);
  const [pgsCertStatus, setPgsCertStatus] = useState<string>('Select...');
  const [pgsCertifiedDate, setPgsCertifiedDate] = useState<string>('');
  const [pgsExpiryDate, setPgsExpiryDate] = useState<string>('');
  const [pgsDocVerification, setPgsDocVerification] = useState<string>('Select...');
  const [pgsVerificationNotes, setPgsVerificationNotes] = useState<string>('');
  const [npopCertStatus, setNpopCertStatus] = useState<string>('Select...');
  const [npopCertifiedDate, setNpopCertifiedDate] = useState<string>('');
  const [npopExpiryDate, setNpopExpiryDate] = useState<string>('');
  const [npopDocVerification, setNpopDocVerification] = useState<string>('Select...');
  const [npopVerificationNotes, setNpopVerificationNotes] = useState<string>('');
  const [step4OpenDropdown, setStep4OpenDropdown] = useState<
    'pgsStatus' | 'pgsDocVerif' | 'npopStatus' | 'npopDocVerif' | null
  >(null);
  const [activeCalendarField, setActiveCalendarField] = useState<
    'pgsCertified' | 'pgsExpiry' | 'npopCertified' | 'npopExpiry' | null
  >(null);
  const [calendarMonth, setCalendarMonth] = useState<number>(9); // 0-indexed: 9 = October
  const [calendarYear, setCalendarYear] = useState<number>(2026);
  const [calendarSelectedDay, setCalendarSelectedDay] = useState<number>(13);
  const [certPdfModalDoc, setCertPdfModalDoc] = useState<{
    title: string;
    fileName: string;
    certNumber: string;
    validThrough: string;
    agency: string;
  } | null>(null);

  // Step 5 Form state (Soil Testing & Soil Report)
  const [soilReportAvailability, setSoilReportAvailability] = useState<'Select...' | 'Available' | 'Not Available'>('Select...');
  const [step5DropdownOpen, setStep5DropdownOpen] = useState(false);

  // Step 6 Form state (Water Source & Water pH Testing)
  const [waterSourcesList, setWaterSourcesList] = useState<Step6WaterSourceEntry[]>([
    {
      id: '1',
      sourceName: 'Select...',
      sourceType: 'Select...',
      location: '',
      usePurposes: [],
      verification: 'Select...',
      condition: 'Select...',
      testDate: '',
      testingMethod: 'Select...',
      testingDevice: 'Select...',
      uploadedReport: null,
      phMeasurementStatus: 'Select...',
      testVerificationStatus: 'Select...',
      notes: '',
    },
  ]);
  const [step6OpenDropdown, setStep6OpenDropdown] = useState<{
    entryIndex: number;
    field: 'sourceType' | 'verification' | 'condition' | 'testingMethod' | 'testingDevice' | 'phStatus' | 'testVerification';
  } | null>(null);
  const [activeWaterSourcePickerIndex, setActiveWaterSourcePickerIndex] = useState<number | null>(null);
  const [waterSourceSearchText, setWaterSourceSearchText] = useState('');
  const [activePurposePickerIndex, setActivePurposePickerIndex] = useState<number | null>(null);
  const [purposeSearchText, setPurposeSearchText] = useState('');
  const [activeWaterCalendarIndex, setActiveWaterCalendarIndex] = useState<number | null>(null);

  // Step 7 Form state (Farm Practices Checklist)
  const [step7Data, setStep7Data] = useState<Record<Step7SectionKey, Step7SectionData>>({
    farmDoc: {
      inspectionResult: 'Select...',
      notes: '',
      evidence: 'Select...',
      uploadedFile: null,
    },
    organicPractices: {
      inspectionResult: 'Select...',
      notes: '',
      evidence: 'Select...',
      uploadedFile: null,
    },
    cropMgmt: {
      inspectionResult: 'Select...',
      notes: '',
      evidence: 'Select...',
      uploadedFile: null,
    },
    inputUsage: {
      inspectionResult: 'Select...',
      notes: '',
      evidence: 'Select...',
      uploadedFile: null,
    },
  });
  const [step7OpenDropdown, setStep7OpenDropdown] = useState<Step7SectionKey | null>(null);
  const [step7EvidenceModalSection, setStep7EvidenceModalSection] = useState<Step7SectionKey | null>(null);
  const [step7EvidenceSearchText, setStep7EvidenceSearchText] = useState('');

  // Step 8 Form state (Documents & Evidence)
  const [step8EvidenceList, setStep8EvidenceList] = useState<Step8EvidenceEntry[]>([
    {
      id: '1',
      category: 'Select...',
      relatedSection: 'Select...',
      documentType: 'Select...',
      uploadedFile: null,
      verificationStatus: 'Select...',
      missingReason: 'Select...',
      notes: '',
    },
  ]);
  const [step8OpenDropdown, setStep8OpenDropdown] = useState<{
    entryIndex: number;
    field: 'category' | 'documentType' | 'verificationStatus' | 'missingReason';
  } | null>(null);
  const [step8RelatedModalIndex, setStep8RelatedModalIndex] = useState<number | null>(null);
  const [step8RelatedSearchText, setStep8RelatedSearchText] = useState('');

  // Step 9 Form state (Inspection Observations & Findings)
  const [step9ObservationsList, setStep9ObservationsList] = useState<Step9ObservationEntry[]>([
    {
      id: '1',
      relatedSection: 'Select...',
      category: 'Select...',
      observation: '',
      followUpRecommendation: 'Select...',
      recommendationNotes: '',
      evidenceReference: 'Select...',
      followUpRequired: 'Select...',
    },
  ]);
  const [step9OpenDropdown, setStep9OpenDropdown] = useState<{
    entryIndex: number;
    field: 'category' | 'recommendation' | 'followUp';
  } | null>(null);
  const [step9RelatedModalIndex, setStep9RelatedModalIndex] = useState<number | null>(null);
  const [step9RelatedSearchText, setStep9RelatedSearchText] = useState('');
  const [step9EvidenceRefModalIndex, setStep9EvidenceRefModalIndex] = useState<number | null>(null);
  const [step9EvidenceRefSearchText, setStep9EvidenceRefSearchText] = useState('');

  // Step 10 Form state (Farmer Admin Assessment - Screenshots 1 to 5)
  const [step10OverallAssessment, setStep10OverallAssessment] = useState<string>('Select...');
  const [step10StrengthsObserved, setStep10StrengthsObserved] = useState<string>('');
  const [step10FollowUpRequired, setStep10FollowUpRequired] = useState<string>('Select...');
  const [step10Recommendation, setStep10Recommendation] = useState<string>('Select...');
  const [step10SupportingRemarks, setStep10SupportingRemarks] = useState<string>('');
  const [step10OpenDropdown, setStep10OpenDropdown] = useState<'overall' | 'followUp' | 'recommendation' | null>(null);

  // Step 11 Form state (Farmer Rating - Screenshots 1 to 4)
  const [step11Scores, setStep11Scores] = useState<Record<string, number | null>>({
    cert: null,
    soil: null,
    farm: null,
    env: null,
    yield: null,
    trace: null,
    social: null,
    financial: null,
    market: null,
    innovation: null,
  });
  const [step11ExpandedCategory, setStep11ExpandedCategory] = useState<string | null>(null);

  const step11RatedCount = useMemo(() => {
    return Object.values(step11Scores).filter((s) => s !== null).length;
  }, [step11Scores]);

  const step11TotalScore = useMemo(() => {
    return Object.values(step11Scores).reduce<number>((acc, s) => acc + (s || 0), 0);
  }, [step11Scores]);

  // Generic Step form state (Steps 10 to 11)
  const [stepFieldA, setStepFieldA] = useState<string>('Select...');
  const [stepDropdownAOpen, setStepDropdownAOpen] = useState(false);
  const [stepFieldB, setStepFieldB] = useState<string>('Select...');
  const [stepDropdownBOpen, setStepDropdownBOpen] = useState(false);
  const [stepNotes, setStepNotes] = useState<string>('');

  // Open Filters page
  const openFiltersPage = () => {
    setDraftAuditType(appliedAuditType);
    setDraftStatus(appliedStatus);
    setDraftDate(appliedDate);
    setCurrentView('filters');
  };

  // Apply filters from Filter Page
  const handleApplyFilters = () => {
    setAppliedAuditType(draftAuditType);
    setAppliedStatus(draftStatus);
    setAppliedDate(draftDate);
    setCurrentView('list');
  };

  // Clear filters
  const handleClearFilters = () => {
    setDraftAuditType('All');
    setDraftStatus('All');
    setDraftDate('Today');
    setAppliedAuditType('All');
    setAppliedStatus('All');
    setAppliedDate('Today');
  };

  // Filtered Records calculation
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      if (appliedAuditType !== 'All' && rec.type !== appliedAuditType) return false;
      if (appliedStatus !== 'All' && rec.badge !== appliedStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = rec.id.toLowerCase().includes(q);
        const matchesFarmer = rec.farmerName.toLowerCase().includes(q);
        const matchesFarm = rec.farm.toLowerCase().includes(q);
        const matchesType = rec.type.toLowerCase().includes(q);
        return matchesId || matchesFarmer || matchesFarm || matchesType;
      }

      return true;
    });
  }, [records, appliedAuditType, appliedStatus, searchQuery]);

  // Filtered History Records calculation for Audit History (Screenshots 1 & 5)
  const filteredHistoryRecords = useMemo(() => {
    return records.filter((rec) => {
      if (historyAppliedType !== 'All' && rec.type !== historyAppliedType) return false;
      if (historyAppliedStatus !== 'All' && rec.badge !== historyAppliedStatus) return false;
      if (rec.year && rec.year !== historyAppliedYear) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = rec.id.toLowerCase().includes(q);
        const matchesFarmer = rec.farmerName.toLowerCase().includes(q);
        const matchesFarm = rec.farm.toLowerCase().includes(q);
        const matchesType = rec.type.toLowerCase().includes(q);
        return matchesId || matchesFarmer || matchesFarm || matchesType;
      }

      return true;
    });
  }, [records, historyAppliedType, historyAppliedStatus, historyAppliedYear, searchQuery]);

  // Handle Confirm Schedule Field Visit
  const handleConfirmScheduleVisit = () => {
    const newRecord: AuditScheduleRecord = {
      id: `FV-2026-00${records.length + 20}`,
      badge: 'Scheduled',
      farmerName: selectedRecord.farmerName,
      farmerId: selectedRecord.farmerId,
      farmingType: selectedRecord.farmingType,
      yearsOrganic: selectedRecord.yearsOrganic,
      farm: selectedRecord.farm,
      type: 'Field Visit',
      date: visitDate,
      dateBucket: 'Today',
      assignedText: 'Assigned Auditor',
    };
    setRecords([newRecord, ...records]);
    Alert.alert('Field Visit Scheduled', `Visit on ${visitDate} at ${visitTime} has been confirmed.`);
    setCurrentView('detail');
  };

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN: AUDIT CALENDAR (Image 1)
  // ───────────────────────────────────────────────────────────────────────────
  if (currentView === 'calendar') {
    // Days in October 2026: 31 days. Oct 1 is Thursday (index 3, Mon=0, Tue=1, Wed=2, Thu=3)
    const calendarWeeks: (number | null)[][] = [
      [null, null, null, 1, 2, 3, 4],
      [5, 6, 7, 8, 9, 10, 11],
      [12, 13, 14, 15, 16, 17, 18],
      [19, 20, 21, 22, 23, 24, 25],
      [26, 27, 28, 29, 30, 31, null],
    ];

    const cycleAuditType = () => {
      const types: ('All Types' | 'Internal' | 'External' | 'Field Visit')[] = [
        'All Types',
        'Internal',
        'External',
        'Field Visit',
      ];
      const nextIndex = (types.indexOf(calAuditType) + 1) % types.length;
      const nextVal = types[nextIndex];
      if (nextVal) setCalAuditType(nextVal);
    };

    const cycleStatus = () => {
      const statuses: ('All Status' | 'Upcoming' | 'Scheduled' | 'In Progress')[] = [
        'All Status',
        'Upcoming',
        'Scheduled',
        'In Progress',
      ];
      const nextIndex = (statuses.indexOf(calStatus) + 1) % statuses.length;
      const nextVal = statuses[nextIndex];
      if (nextVal) setCalStatus(nextVal);
    };

    const cycleZone = () => {
      const zones: ('All Zones' | 'Ooty' | 'Kotagiri' | 'Coonoor')[] = [
        'All Zones',
        'Ooty',
        'Kotagiri',
        'Coonoor',
      ];
      const nextIndex = (zones.indexOf(calZone) + 1) % zones.length;
      const nextVal = zones[nextIndex];
      if (nextVal) setCalZone(nextVal);
    };

    if (calendarViewMode === 'List') {
      return (
        <SafeAreaView style={styles.rootOrange}>
          <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

          {/* ── Terracotta Header (Image 1 Center Screen: M5_002 Audit Schedule) ── */}
          <View style={styles.header}>
            <View style={styles.headerTopRow}>
              <View style={styles.headerTitleWrap}>
                <TouchableOpacity
                  style={styles.headerBackBtn}
                  onPress={onBack}
                  activeOpacity={0.7}
                  accessibilityLabel="Back"
                >
                  <BackArrowIcon size={22} color={THEME.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Audit Schedule</Text>
              </View>

              <TouchableOpacity
                style={styles.headerFilterCircleBtn}
                onPress={() => setShowHistoryFilter((prev) => !prev)}
                activeOpacity={0.8}
                accessibilityLabel="Filters"
              >
                <FilterSlidersIcon size={19} color={THEME.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Search Bar (Image 1 Center: "Farmer name, Farmer ID, Audit ID, Farm, Zone") ── */}
          <View style={styles.searchBarContainer}>
            <View style={styles.searchIconWrap}>
              <SearchIcon size={18} color="#9CA3AF" />
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Farmer name, Farmer ID, Audit ID, Farm, Zone"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* ── Body ── */}
          <ScrollView
            style={styles.scrollCanvas}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 110 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Card 1: AUD-2026-0042 */}
            <TouchableOpacity
              style={styles.scheduleRecordCard}
              onPress={() => {
                const rec = records.find((r) => r.id === 'AUD-2026-0042') || records[0]!;
                setSelectedRecord(rec);
                setPreviousView('calendar');
                setCurrentView('audit_details_m5');
              }}
              activeOpacity={0.85}
            >
              <View style={styles.scheduleRecordCardTopRow}>
                <Text style={styles.scheduleRecordCardId}>AUD-2026-0042</Text>
                <View style={styles.badgeUpcoming}>
                  <Text style={styles.badgeUpcomingText}>Upcoming</Text>
                </View>
              </View>
              <Text style={styles.scheduleRecordCardSub}>
                Ramesh Kumar · Ooty Farm 01 · Internal
              </Text>
              <Text style={styles.scheduleRecordCardMeta}>
                15 Oct 2026 · Assigned Auditor
              </Text>
            </TouchableOpacity>

            {/* Card 2: FV-2026-0018 */}
            <TouchableOpacity
              style={styles.scheduleRecordCard}
              onPress={() => {
                const rec = records.find((r) => r.id === 'FV-2026-0018') || records[2]!;
                setSelectedRecord(rec);
                setPreviousView('calendar');
                setCurrentView('audit_details_m5');
              }}
              activeOpacity={0.85}
            >
              <View style={styles.scheduleRecordCardTopRow}>
                <Text style={styles.scheduleRecordCardId}>FV-2026-0018</Text>
                <View style={styles.badgeScheduled}>
                  <Text style={styles.badgeScheduledText}>Scheduled</Text>
                </View>
              </View>
              <Text style={styles.scheduleRecordCardSub}>
                Selvi · Coonoor Farm · Field Visit
              </Text>
              <Text style={styles.scheduleRecordCardMeta}>
                08 Oct 2026
              </Text>
            </TouchableOpacity>

            {/* Card 3: AUD-2026-0039 */}
            <TouchableOpacity
              style={styles.scheduleRecordCard}
              onPress={() => {
                const rec = records.find((r) => r.id === 'AUD-2026-0039') || records[3]!;
                setSelectedRecord(rec);
                setPreviousView('calendar');
                setCurrentView('audit_details_m5');
              }}
              activeOpacity={0.85}
            >
              <View style={styles.scheduleRecordCardTopRow}>
                <Text style={styles.scheduleRecordCardId}>AUD-2026-0039</Text>
                <View style={styles.badgeUpcoming}>
                  <Text style={styles.badgeUpcomingText}>Upcoming</Text>
                </View>
              </View>
              <Text style={styles.scheduleRecordCardSub}>
                Kumar · Ooty Farm 03 · External
              </Text>
              <Text style={styles.scheduleRecordCardMeta}>
                20 Oct 2026 · Assigned Auditor
              </Text>
            </TouchableOpacity>

            {/* Info Card (Image 1 Center) */}
            <View style={[styles.infoNoteCard, { marginTop: 14 }]}>
              <Text style={styles.infoNoteText}>
                Schedule Audit and Assign Auditor are not Farmer Admin permissions — not shown anywhere here, not even disabled.
              </Text>
            </View>
          </ScrollView>

          {/* ── Sticky Bottom Button: + Schedule Field Visit (Image 1 Center) ── */}
          <View style={styles.singleBottomBarFixed}>
            <TouchableOpacity
              style={styles.addScheduleVisitBtn}
              onPress={() => {
                const rec = records.find((r) => r.id === 'AUD-2026-0042') || records[0]!;
                setSelectedRecord(rec);
                setPreviousView('calendar');
                setCurrentView('audit_details_m5');
              }}
              activeOpacity={0.85}
            >
              <PlusIcon size={18} color={THEME.white} />
              <Text style={styles.addScheduleVisitBtnText}>Schedule Field Visit</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.calRoot}>
        <StatusBar barStyle="light-content" backgroundColor={THEME.brandOrange} />

        {/* ── Terracotta Header (Image 1) ── */}
        <View style={styles.calHeader}>
          <View style={styles.calHeaderTopRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity
                onPress={onBack}
                style={styles.headerBackBtn}
                activeOpacity={0.7}
                accessibilityLabel="Back"
              >
                <BackArrowIcon size={22} color={THEME.white} />
              </TouchableOpacity>
              <View>
                <Text style={styles.calHeaderTitle}>Audit Calendar</Text>
                <Text style={styles.calHeaderSubtitle}>Audit Management</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.calBellBtn}
              onPress={onOpenNotifications || (() => Alert.alert('Notifications', 'No new notifications'))}
              activeOpacity={0.8}
              accessibilityLabel="Notifications"
            >
              <HeaderBellIcon size={20} color={THEME.white} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* ── View Switcher: Month | Week | List ── */}
          <View style={styles.calTabsRow}>
            <TouchableOpacity
              style={calendarViewMode === 'Month' ? styles.calTabActive : styles.calTabInactive}
              onPress={() => setCalendarViewMode('Month')}
              activeOpacity={0.8}
            >
              <Text
                style={calendarViewMode === 'Month' ? styles.calTabActiveText : styles.calTabInactiveText}
              >
                Month
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={calendarViewMode === 'Week' ? styles.calTabActive : styles.calTabInactive}
              onPress={() => setCalendarViewMode('Week')}
              activeOpacity={0.8}
            >
              <Text
                style={calendarViewMode === 'Week' ? styles.calTabActiveText : styles.calTabInactiveText}
              >
                Week
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={(calendarViewMode as string) === 'List' ? styles.calTabActive : styles.calTabInactive}
              onPress={() => {
                setCalendarViewMode('List');
              }}
              activeOpacity={0.8}
            >
              <Text
                style={(calendarViewMode as string) === 'List' ? styles.calTabActiveText : styles.calTabInactiveText}
              >
                List
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Filter Cards: Audit Type | Status | Zone ── */}
          <View style={styles.calFiltersRow}>
            <TouchableOpacity style={styles.calFilterCard} onPress={cycleAuditType} activeOpacity={0.8}>
              <Text style={styles.calFilterLabel}>AUDIT TYPE</Text>
              <Text style={styles.calFilterValue} numberOfLines={1}>
                {calAuditType}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.calFilterCard} onPress={cycleStatus} activeOpacity={0.8}>
              <Text style={styles.calFilterLabel}>STATUS</Text>
              <Text style={styles.calFilterValue} numberOfLines={1}>
                {calStatus}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.calFilterCard} onPress={cycleZone} activeOpacity={0.8}>
              <Text style={styles.calFilterLabel}>ZONE</Text>
              <Text style={styles.calFilterValue} numberOfLines={1}>
                {calZone}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Month Navigation: < October 2026 > ── */}
          <View style={styles.calMonthNav}>
            <TouchableOpacity
              style={styles.calMonthNavBtn}
              onPress={() => Alert.alert('Calendar', 'Showing September 2026')}
              activeOpacity={0.7}
            >
              <ChevronLeftIcon size={18} color="#4B5563" />
            </TouchableOpacity>

            <Text style={styles.calMonthNavTitle}>October 2026</Text>

            <TouchableOpacity
              style={styles.calMonthNavBtn}
              onPress={() => Alert.alert('Calendar', 'Showing November 2026')}
              activeOpacity={0.7}
            >
              <ChevronRightIcon size={18} color="#4B5563" />
            </TouchableOpacity>
          </View>

          {/* ── Weekday Labels Row ── */}
          <View style={styles.calWeekdaysRow}>
            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((dayName) => (
              <Text key={dayName} style={styles.calWeekdayText}>
                {dayName}
              </Text>
            ))}
          </View>

          {/* ── Calendar Grid ── */}
          <View style={styles.calGridContainer}>
            {calendarWeeks.map((week, wIdx) => (
              <View key={`week-${wIdx}`} style={styles.calGridWeekRow}>
                {week.map((day, dIdx) => {
                  if (day === null) {
                    return <View key={`empty-${wIdx}-${dIdx}`} style={styles.calGridDayCellEmpty} />;
                  }

                  const isSelected = selectedCalDay === day;
                  const hasGreenDot = day === 3;
                  const hasThreeDots = day === 15;
                  const hasOrangeDot = day === 20;
                  const hasGreyDot = day === 22;

                  return (
                    <TouchableOpacity
                      key={`day-${day}`}
                      style={[styles.calGridDayCell, isSelected && styles.calGridDayCellSelected]}
                      onPress={() => setSelectedCalDay(day)}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[styles.calGridDayText, isSelected && styles.calGridDayTextSelected]}
                      >
                        {day}
                      </Text>

                      {/* Dots indicators matching Image 1 */}
                      {isSelected ? (
                        <View style={[styles.calDotSingle, { backgroundColor: '#FFFFFF' }]} />
                      ) : hasGreenDot ? (
                        <View style={[styles.calDotSingle, { backgroundColor: '#15803D' }]} />
                      ) : hasThreeDots ? (
                        <View style={styles.calDotsRow}>
                          <View style={styles.calDotMini} />
                          <View style={styles.calDotMini} />
                          <View style={styles.calDotMini} />
                        </View>
                      ) : hasOrangeDot ? (
                        <View style={[styles.calDotSingle, { backgroundColor: THEME.brandOrange }]} />
                      ) : hasGreyDot ? (
                        <View style={[styles.calDotSingle, { backgroundColor: '#9CA3AF' }]} />
                      ) : (
                        <View style={{ height: 6 }} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          {/* ── Selected Date Section (Image 1) ── */}
          <View style={styles.calSelectedDateSection}>
            <Text style={styles.calSelectedDateTitle}>{selectedCalDay} October 2026</Text>
            <Text style={styles.calSelectedDateCount}>
              {selectedCalDay === 8 || selectedCalDay === 15 || selectedCalDay === 3 || selectedCalDay === 20
                ? '1 Audit on this date'
                : 'No scheduled audits on this date'}
            </Text>

            {/* Audit Card matching Image 1 */}
            {(selectedCalDay === 8 || selectedCalDay === 15 || selectedCalDay === 3 || selectedCalDay === 20) && (
              <TouchableOpacity
                style={styles.calAuditCard}
                onPress={() => {
                  setPreviousView('calendar');
                  setCurrentView('audit_details_m5');
                }}
                activeOpacity={0.9}
              >
                <View style={styles.calAuditCardTopRow}>
                  <Text style={styles.calAuditCardTitle}>
                    {selectedCalDay === 8
                      ? 'Internal Audit'
                      : selectedCalDay === 15
                      ? 'Quarterly Farm Audit'
                      : selectedCalDay === 3
                      ? 'Organic Practice Audit'
                      : 'Soil & Water Audit'}
                  </Text>
                  <View style={styles.calAuditBadgeBlue}>
                    <Text style={styles.calAuditBadgeBlueText}>
                      {selectedCalDay === 8 ? 'In Progress' : 'Upcoming'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.calAuditCardSubtitle}>
                  {selectedCalDay === 15
                    ? 'Ramesh Kumar · Ooty Farm 01'
                    : 'Vijay · Vijay Terrace Farm'}
                </Text>
                <Text style={styles.calAuditCardMeta}>
                  Internal Audit · {selectedCalDay} Oct 2026 · 09:30 AM
                </Text>
                <Text style={styles.calAuditCardMeta}>
                  Auditor: {selectedCalDay === 15 ? 'Priya · Ooty' : 'Priya Nair · Kotagiri'}
                </Text>

                <TouchableOpacity
                  style={styles.calViewDetailsBtn}
                  onPress={() => {
                    setPreviousView('calendar');
                    setCurrentView('audit_details_m5');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.calViewDetailsText}>View Audit Details →</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN: AUDIT DETAILS (Images 2 & 3)
  // ───────────────────────────────────────────────────────────────────────────
  if (currentView === 'audit_details_m5') {
    const record = selectedRecord ?? INITIAL_SCHEDULE_RECORDS[0]!;

    return (
      <SafeAreaView style={styles.calRoot}>
        <StatusBar barStyle="light-content" backgroundColor={THEME.brandOrange} />

        {/* ── Terracotta Header (Image 1 Right Screen: M5_003 Audit / Field Visit Detail) ── */}
        <View style={styles.calHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity
              onPress={() => {
                setCalendarViewMode('List');
                setCurrentView('calendar');
              }}
              style={styles.headerBackBtn}
              activeOpacity={0.7}
              accessibilityLabel="Back"
            >
              <BackArrowIcon size={22} color={THEME.white} />
            </TouchableOpacity>

            <View>
              <Text style={styles.calHeaderTitle}>Audit {record.id}</Text>
              <Text style={styles.calHeaderSubtitle}>Status: {record.badge || 'Upcoming'}</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 150 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Card 1: Farmer & Farm Info (Image 1 Right) ── */}
          <View style={styles.detCard}>
            <View style={styles.detRow}>
              <View style={styles.detCol}>
                <Text style={styles.detLabel}>Farmer Name</Text>
                <Text style={styles.detValue}>{record.farmerName}</Text>
              </View>
              <View style={styles.detCol}>
                <Text style={styles.detLabel}>Farmer ID</Text>
                <Text style={styles.detValue}>{record.farmerId || 'FR-00241'}</Text>
              </View>
            </View>

            <View style={[styles.detRow, { marginTop: 14 }]}>
              <View style={styles.detCol}>
                <Text style={styles.detLabel}>Farming Type</Text>
                <Text style={styles.detValue}>{record.farmingType || 'Organic'}</Text>
              </View>
              <View style={styles.detCol}>
                <Text style={styles.detLabel}>Years Organic</Text>
                <Text style={styles.detValue}>{record.yearsOrganic || 6}</Text>
              </View>
            </View>
          </View>

          {/* ── Card 2: Certification (Image 1 Right) ── */}
          <Text style={[styles.detSectionHeader, { marginTop: 16 }]}>Certification</Text>
          <View style={styles.detCard}>
            {/* PGS Organic */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <CertCheckIcon size={18} color="#15803D" />
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>PGS Organic</Text>
            </View>
            <View style={[styles.detRow, { marginTop: 10 }]}>
              <View style={styles.detCol}>
                <Text style={styles.detLabel}>Status</Text>
                <Text style={[styles.detValue, { color: '#15803D' }]}>{record.pgsOrganic?.status || 'Active'}</Text>
              </View>
              <View style={styles.detCol}>
                <Text style={styles.detLabel}>Renewal Date</Text>
                <Text style={styles.detValue}>{record.pgsOrganic?.renewalDate || '12 Jun 2027'}</Text>
              </View>
            </View>

            <View style={[styles.detDivider, { marginVertical: 14 }]} />

            {/* NPOP */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <CertCheckIcon size={18} color="#15803D" />
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>NPOP</Text>
            </View>
            <View style={[styles.detRow, { marginTop: 10 }]}>
              <View style={styles.detCol}>
                <Text style={styles.detLabel}>Status</Text>
                <Text style={[styles.detValue, { color: '#15803D' }]}>{record.npop?.status || 'Active'}</Text>
              </View>
              <View style={styles.detCol}>
                <Text style={styles.detLabel}>Renewal Date</Text>
                <Text style={styles.detValue}>{record.npop?.renewalDate || '01 Mar 2027'}</Text>
              </View>
            </View>
          </View>

          {/* ── Card 3: Previous Audit Summary (Score kept as 0/100 until completed) ── */}
          <Text style={[styles.detSectionHeader, { marginTop: 16 }]}>Previous Audit Summary</Text>
          <View style={styles.detCard}>
            <View style={styles.detRow}>
              <View style={styles.detCol}>
                <Text style={styles.detLabel}>Previous Date</Text>
                <Text style={styles.detValue}>{record.previousSummary?.date || '15 Jul 2026'}</Text>
              </View>
              <View style={styles.detCol}>
                <Text style={styles.detLabel}>Previous Score</Text>
                <Text style={[styles.detValue, { color: THEME.brandOrange, fontWeight: '800' }]}>
                  {completedInspectionScore !== null ? `${completedInspectionScore}/100` : '0/100'}
                </Text>
              </View>
            </View>

            {/* Outline Button: View Audit History */}
            <TouchableOpacity
              style={[styles.detViewProfileBtn, { marginTop: 16, marginBottom: 0 }]}
              onPress={() => setCurrentView('history')}
              activeOpacity={0.8}
            >
              <Text style={styles.detViewProfileBtnText}>View Audit History</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* ── Sticky Bottom Actions (Image 1 Right) ── */}
        <View style={styles.doubleBottomBar}>
          <TouchableOpacity
            style={styles.primarySupportAuditBtn}
            onPress={() => {
              setPreviousView('audit_details_m5');
              setCurrentView('inspection');
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.primarySupportAuditBtnText}>Support Audit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.outlineScheduleVisitBtn}
            onPress={() => {
              setPreviousView('audit_details_m5');
              setCurrentView('schedule_visit');
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.outlineScheduleVisitBtnText}>Schedule Field Visit</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN: CHECKLIST PDF VIEWER (Image 4)
  // ───────────────────────────────────────────────────────────────────────────
  if (currentView === 'pdf_viewer') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <StatusBar barStyle="light-content" backgroundColor={THEME.brandOrange} />

        {/* ── Terracotta Header (Image 4) ── */}
        <View style={styles.pdfHeader}>
          <TouchableOpacity
            onPress={() => setCurrentView('audit_details_m5')}
            activeOpacity={0.7}
            style={{ padding: 4 }}
          >
            <PdfDocIcon size={24} color={THEME.white} />
          </TouchableOpacity>
          <Text style={styles.pdfHeaderTitle}>Checklist.pdf</Text>
        </View>

        {/* ── Body: Type & Audit Card ── */}
        <View style={styles.pdfMetaCard}>
          <View style={styles.detCol}>
            <Text style={styles.detLabel}>Type</Text>
            <Text style={styles.detValue}>PDF</Text>
          </View>
          <View style={styles.detCol}>
            <Text style={styles.detLabel}>Audit</Text>
            <Text style={styles.detValue}>AUD-2026-0042</Text>
          </View>
        </View>

        {/* ── PDF Preview Content Area ── */}
        <View style={styles.pdfPreviewArea}>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ alignItems: 'center', marginVertical: 30, opacity: 0.25 }}>
              <PdfDocIcon size={72} color="#4B5563" />
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#4B5563', marginTop: 12 }}>
                Audit Checklist Document Preview
              </Text>
              <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                AUD-2026-0042 · Official Inspection Checklist
              </Text>
            </View>

            {/* Simulated document lines */}
            <View style={{ gap: 10, opacity: 0.15 }}>
              <View style={{ height: 12, backgroundColor: '#111827', borderRadius: 4, width: '90%' }} />
              <View style={{ height: 12, backgroundColor: '#111827', borderRadius: 4, width: '100%' }} />
              <View style={{ height: 12, backgroundColor: '#111827', borderRadius: 4, width: '75%' }} />
              <View style={{ height: 12, backgroundColor: '#111827', borderRadius: 4, width: '85%' }} />
              <View style={{ height: 12, backgroundColor: '#111827', borderRadius: 4, width: '60%' }} />
            </View>
          </ScrollView>
        </View>

        {/* ── Bottom Bar: Close ── */}
        <View style={styles.pdfBottomBar}>
          <TouchableOpacity
            style={styles.pdfCloseBtn}
            onPress={() => setCurrentView('audit_details_m5')}
            activeOpacity={0.8}
          >
            <Text style={styles.pdfCloseBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN: AUDIT DETAIL SCREEN (Screenshot 2)
  // ───────────────────────────────────────────────────────────────────────────
  if (currentView === 'audit_detail' || currentView === 'detail') {
    return (
      <SafeAreaView style={styles.rootOrange}>
        <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

        {/* Solid Theme Orange Header */}
        <View style={styles.screenHeader}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() => {
              if (initialView === 'detail' || initialView === 'audit_detail') {
                onBack();
              } else if (previousView === 'history') {
                setCurrentView('history');
              } else if (previousView === 'calendar') {
                setCurrentView('calendar');
              } else {
                onBack();
              }
            }}
            activeOpacity={0.7}
            accessibilityLabel="Back"
          >
            <BackArrowIcon size={22} color={THEME.white} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.screenHeaderTitle}>Audit Detail</Text>
          </View>
          <TouchableOpacity
            style={styles.headerFilterCircleBtn}
            onPress={() => {
              setShowHistoryFilter(true);
              setCurrentView('history');
            }}
            activeOpacity={0.8}
            accessibilityLabel="Filters"
          >
            <FilterSlidersIcon size={19} color={THEME.white} />
          </TouchableOpacity>
        </View>

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.detailScrollPad}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Audit Summary Card (Screenshot 2) */}
          <View style={styles.auditSummaryCard}>
            <View style={styles.detailGridRow}>
              <View style={styles.detailGridCol}>
                <Text style={styles.detailMetaLabel}>Audit ID</Text>
                <Text style={styles.auditSummaryValBold}>{selectedRecord.id}</Text>
              </View>
              <View style={styles.detailGridCol}>
                <Text style={styles.detailMetaLabel}>Farmer</Text>
                <Text style={styles.auditSummaryValBold}>{selectedRecord.farmerName}</Text>
              </View>
            </View>

            <View style={[styles.detailGridRow, { marginTop: 14 }]}>
              <View style={styles.detailGridCol}>
                <Text style={styles.detailMetaLabel}>Date</Text>
                <Text style={styles.auditSummaryValBold}>{selectedRecord.date}</Text>
              </View>
              <View style={styles.detailGridCol}>
                <Text style={styles.detailMetaLabel}>Score</Text>
                <Text style={styles.auditSummaryValBold}>{selectedRecord.score || '80/100'}</Text>
              </View>
            </View>
          </View>

          {/* Section: Audit Timeline (Screenshot 2) */}
          <Text style={styles.timelineSectionTitle}>Audit Timeline</Text>
          <View style={styles.timelineListContainer}>
            {/* Timeline item 1: Audit Scheduled */}
            <View style={styles.timelineItemRow}>
              <View style={styles.timelineIconTile}>
                <TimelineCalendarIcon size={18} color="#854F0B" />
              </View>
              <View style={styles.timelineTextWrap}>
                <Text style={styles.timelineTitleText}>Audit Scheduled</Text>
                <Text style={styles.timelineSubText}>
                  {selectedRecord.timeline?.[0]?.date || '01 Jul 2026'}
                </Text>
              </View>
            </View>

            {/* Timeline item 2: Inspection */}
            <View style={styles.timelineItemRow}>
              <View style={styles.timelineIconTile}>
                <TimelineInspectionIcon size={18} color="#854F0B" />
              </View>
              <View style={styles.timelineTextWrap}>
                <Text style={styles.timelineTitleText}>Inspection</Text>
                <Text style={styles.timelineSubText}>
                  {selectedRecord.timeline?.[1]?.date || `${selectedRecord.date}, 10:30 AM`}
                </Text>
              </View>
            </View>

            {/* Timeline item 3: Audit Completed */}
            <View style={styles.timelineItemRow}>
              <View style={styles.timelineIconTile}>
                <TimelineCompletedIcon size={18} color="#854F0B" />
              </View>
              <View style={styles.timelineTextWrap}>
                <Text style={styles.timelineTitleText}>Audit Completed</Text>
                <Text style={styles.timelineSubText}>
                  {selectedRecord.timeline?.[2]?.date || `${selectedRecord.date}, 1:00 PM`}
                </Text>
              </View>
            </View>
          </View>

          {/* Bottom Button: View Report (Screenshot 2) */}
          <TouchableOpacity
            style={styles.viewReportBtn}
            onPress={() => {
              setPreviousView('audit_detail');
              setCurrentView('audit_report');
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.viewReportBtnText}>View Report</Text>
          </TouchableOpacity>

          <View style={{ height: 28 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN: FARMER AUDIT REPORT SCREEN (Screenshots 3 & 4)
  // Note: "View Farmer" button is REMOVED per user request
  // ───────────────────────────────────────────────────────────────────────────
  if (currentView === 'audit_report') {
    return (
      <SafeAreaView style={styles.rootOrange}>
        <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

        {/* Solid Theme Orange Header */}
        <View style={styles.screenHeader}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() => {
              if (initialView === 'audit_report' || initialTypeFilter === 'report') {
                onBack();
              } else if (previousView === 'history') {
                setCurrentView('history');
              } else {
                setCurrentView('audit_detail');
              }
            }}
            activeOpacity={0.7}
            accessibilityLabel="Back"
          >
            <BackArrowIcon size={22} color={THEME.white} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.screenHeaderTitle}>Farmer Audit Report</Text>
            <Text style={styles.screenHeaderSub}>{selectedRecord.id}</Text>
          </View>
        </View>

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.reportScrollPad}
          showsVerticalScrollIndicator={false}
        >
          {/* Card 1: Farmer Details */}
          <Text style={styles.reportSectionTitle}>Farmer Details</Text>
          <View style={styles.reportCard}>
            <View style={styles.detailGridRow}>
              <View style={styles.detailGridCol}>
                <Text style={styles.detailMetaLabel}>Farmer</Text>
                <Text style={styles.reportMetaValBold}>{selectedRecord.farmerName}</Text>
              </View>
              <View style={styles.detailGridCol}>
                <Text style={styles.detailMetaLabel}>Farm</Text>
                <Text style={styles.reportMetaValBold}>{selectedRecord.farm}</Text>
              </View>
            </View>
            <View style={[styles.detailGridRow, { marginTop: 12 }]}>
              <View style={styles.detailGridCol}>
                <Text style={styles.detailMetaLabel}>Farming Type</Text>
                <Text style={styles.reportMetaValBold}>{selectedRecord.farmingType || 'Organic'}</Text>
              </View>
            </View>
          </View>

          {/* Card 2: Audit Details */}
          <Text style={styles.reportSectionTitle}>Audit Details</Text>
          <View style={styles.reportCard}>
            <View style={styles.detailGridRow}>
              <View style={styles.detailGridCol}>
                <Text style={styles.detailMetaLabel}>Audit Type</Text>
                <Text style={styles.reportMetaValBold}>{selectedRecord.type}</Text>
              </View>
              <View style={styles.detailGridCol}>
                <Text style={styles.detailMetaLabel}>Audit Date</Text>
                <Text style={styles.reportMetaValBold}>{selectedRecord.date}</Text>
              </View>
            </View>
            <View style={[styles.detailGridRow, { marginTop: 12 }]}>
              <View style={styles.detailGridCol}>
                <Text style={styles.detailMetaLabel}>Auditor</Text>
                <Text style={styles.reportMetaValBold}>{selectedRecord.auditor || 'Assigned Auditor'}</Text>
              </View>
              <View style={styles.detailGridCol}>
                <Text style={styles.detailMetaLabel}>Status</Text>
                <Text style={styles.reportMetaValBold}>{selectedRecord.badge}</Text>
              </View>
            </View>
          </View>

          {/* Card 3: Findings Summary */}
          <Text style={styles.reportSectionTitle}>Findings Summary</Text>
          <View style={styles.findingsSummaryRow}>
            <View style={styles.findingsSummaryCard}>
              <Text style={styles.findingsSummaryLabel}>MAJOR</Text>
              <Text style={styles.findingsSummaryValDark}>{selectedRecord.majorFindings ?? 0}</Text>
            </View>
            <View style={styles.findingsSummaryCard}>
              <Text style={styles.findingsSummaryLabel}>MINOR</Text>
              <Text style={styles.findingsSummaryValAmber}>{selectedRecord.minorFindings ?? 1}</Text>
            </View>
            <View style={styles.findingsSummaryCard}>
              <Text style={styles.findingsSummaryLabel}>RED FLAGS</Text>
              <Text style={styles.findingsSummaryValDark}>{selectedRecord.redFlags ?? 0}</Text>
            </View>
          </View>

          {/* Card 4: Audit Score */}
          <Text style={styles.reportSectionTitle}>Audit Score</Text>
          <View style={styles.auditScoreCard}>
            <View style={styles.auditScoreNumberRow}>
              <Text style={styles.auditScoreBigNum}>
                {selectedRecord.score ? selectedRecord.score.split('/')[0] : '80'}
              </Text>
              <Text style={styles.auditScoreTotalText}>
                /{selectedRecord.score ? selectedRecord.score.split('/')[1] : '100'}
              </Text>
            </View>
            <Text style={styles.auditScoreCaption}>
              SHOWN AS INFORMATION — NOT EDITABLE HERE
            </Text>
          </View>

          {/* Card 5: Remarks */}
          <Text style={styles.reportSectionTitle}>Remarks</Text>
          <View style={styles.reportCard}>
            <Text style={styles.reportTextContent}>
              {selectedRecord.remarks ||
                'Minor pest-management notation on plot 2; farmer advised on organic treatment and has since addressed it.'}
            </Text>
          </View>

          {/* Card 6: Inference */}
          <Text style={styles.reportSectionTitle}>Inference</Text>
          <View style={styles.reportCard}>
            <Text style={styles.reportTextContent}>
              {selectedRecord.inference ||
                'Farm continues to meet organic certification standards. Recommended for continued certification with routine follow-up at next quarterly audit.'}
            </Text>
          </View>

          {/* Actions: ONLY View Audit History (View Farmer button is REMOVED per user request!) */}
          <View style={{ marginTop: 14 }}>
            <TouchableOpacity
              style={styles.viewAuditHistoryOutlineBtn}
              onPress={() => {
                setPreviousView('audit_report');
                setCurrentView('history');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.viewAuditHistoryOutlineBtnText}>View Audit History</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 90 }} />
        </ScrollView>

        {/* Pinned Bottom Bar: Download PDF Button (Screenshots 3 & 4) */}
        <View style={styles.reportBottomStickyBar}>
          <TouchableOpacity
            style={styles.downloadPdfBtn}
            onPress={() =>
              Alert.alert('Download Started', `Downloading audit report for ${selectedRecord.id} as PDF.`)
            }
            activeOpacity={0.85}
          >
            <DownloadIcon size={18} color="#FFFFFF" />
            <Text style={styles.downloadPdfBtnText}>Download PDF</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN 2: SCHEDULE FIELD VISIT SCREEN (Screenshot 3)
  // ───────────────────────────────────────────────────────────────────────────
  if (currentView === 'schedule_visit') {
    return (
      <SafeAreaView style={styles.rootOrange}>
        <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

        {/* Solid Theme Orange Header */}
        <View style={styles.screenHeader}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() => {
              if (initialView === 'schedule_visit' || initialTypeFilter === 'field_visit') {
                onBack();
              } else if (previousView === 'calendar') {
                setCurrentView('calendar');
              } else {
                setCurrentView('detail');
              }
            }}
            activeOpacity={0.7}
          >
            <BackArrowIcon size={22} color={THEME.white} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.screenHeaderTitle}>Schedule Field Visit</Text>
            <Text style={styles.screenHeaderSub}>Status: Upcoming</Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.detailScrollPad} showsVerticalScrollIndicator={false}>
          <Text style={styles.detailSectionTitle}>Schedule Field Visit</Text>

          {/* Select Available Date */}
          <Text style={styles.fieldSectionLabel}>Select Available Date</Text>
          <View style={styles.pillsRow}>
            {(['08 Oct', '09 Oct', '10 Oct'] as const).map((d) => {
              const active = visitDate === d;
              return (
                <TouchableOpacity
                  key={d}
                  style={[styles.smallPill, active ? styles.smallPillActive : styles.smallPillInactive]}
                  onPress={() => setVisitDate(d)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.smallPillText, active ? styles.smallPillTextActive : styles.smallPillTextInactive]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Select Time */}
          <Text style={[styles.fieldSectionLabel, { marginTop: 16 }]}>Select Time</Text>
          <View style={styles.pillsRow}>
            {(['10:00 AM', '2:00 PM'] as const).map((t) => {
              const active = visitTime === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.smallPill, active ? styles.smallPillActive : styles.smallPillInactive]}
                  onPress={() => setVisitTime(t)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.smallPillText, active ? styles.smallPillTextActive : styles.smallPillTextInactive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Visit Notes */}
          <Text style={[styles.fieldSectionLabel, { marginTop: 16 }]}>Visit Notes</Text>
          <View style={styles.visitNotesCard}>
            <TextInput
              style={styles.visitNotesInput}
              placeholder="Optional notes"
              placeholderTextColor="#9CA3AF"
              value={visitNotes}
              onChangeText={setVisitNotes}
              multiline
            />
          </View>
        </ScrollView>

        {/* Sticky Bottom Actions */}
        <View style={styles.detailBottomActionRow}>
          <TouchableOpacity
            style={styles.primaryOrangeBtn}
            onPress={handleConfirmScheduleVisit}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryOrangeBtnText}>Confirm</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryWhiteBtn}
            onPress={() => setCurrentView('detail')}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryWhiteBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN 3: INSPECTION / FINDINGS SCREEN (Screenshots 4 & 5)
  // ───────────────────────────────────────────────────────────────────────────
  if (currentView === 'inspection') {
    const record = selectedRecord ?? INITIAL_SCHEDULE_RECORDS[0]!;

    return (
      <SafeAreaView style={styles.rootOrange}>
        <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

        {/* Solid Theme Orange Header */}
        <View style={styles.screenHeader}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() => {
              if (previousView === 'audit_details_m5') {
                setCurrentView('audit_details_m5');
              } else {
                setCalendarViewMode('List');
                setCurrentView('calendar');
              }
            }}
            activeOpacity={0.7}
          >
            <BackArrowIcon size={22} color={THEME.white} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.screenHeaderTitle}>Inspection / Findings</Text>
            <Text style={styles.screenHeaderSub}>
              {record.id} · {record.farmerName}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.detailScrollPad}
          showsVerticalScrollIndicator={false}
        >
          {/* Normal / Red Flag Filter Pills (Image 2 Left) */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            <TouchableOpacity
              style={[
                styles.inspectionChip,
                inspectionMode === 'Normal' ? styles.inspectionChipActive : styles.inspectionChipInactive,
              ]}
              onPress={() => setInspectionMode('Normal')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.inspectionChipText,
                  inspectionMode === 'Normal' ? styles.inspectionChipTextActive : styles.inspectionChipTextInactive,
                ]}
              >
                Normal
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.inspectionChip,
                inspectionMode === 'Red Flag' ? styles.inspectionChipActive : styles.inspectionChipInactive,
              ]}
              onPress={() => setInspectionMode('Red Flag')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.inspectionChipText,
                  inspectionMode === 'Red Flag' ? styles.inspectionChipTextActive : styles.inspectionChipTextInactive,
                ]}
              >
                Red Flag
              </Text>
            </TouchableOpacity>
          </View>

          {inspectionMode === 'Normal' ? (
            <>
              {/* Section 1: Audit Information */}
              <Text style={styles.detailSectionTitle}>Audit Information</Text>
              <View style={styles.detailCard}>
                <View style={styles.detailGridRow}>
                  <View style={styles.detailGridCol}>
                    <Text style={styles.detailMetaLabel}>Audit ID</Text>
                    <Text style={styles.detailMetaValue}>{record.id}</Text>
                  </View>
                  <View style={styles.detailGridCol}>
                    <Text style={styles.detailMetaLabel}>Farm</Text>
                    <Text style={styles.detailMetaValue}>{record.farm}</Text>
                  </View>
                </View>

                <View style={[styles.detailGridRow, { marginTop: 14 }]}>
                  <View style={styles.detailGridCol}>
                    <Text style={styles.detailMetaLabel}>Audit Type</Text>
                    <Text style={styles.detailMetaValue}>{record.type}</Text>
                  </View>
                  <View style={styles.detailGridCol}>
                    <Text style={styles.detailMetaLabel}>Date</Text>
                    <Text style={styles.detailMetaValue}>{record.date}</Text>
                  </View>
                </View>

                {/* Outline Button: View Inspection Sections */}
                <TouchableOpacity
                  style={styles.outlineOrangeBtn}
                  onPress={() => setCurrentView('audit_inspection')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.outlineOrangeBtnText}>View Inspection Sections</Text>
                </TouchableOpacity>
              </View>

              {/* Section 2: Checklist Results */}
              <Text style={styles.detailSectionTitle}>Checklist Results</Text>
              <View style={styles.checklistCard}>
                <View style={styles.checklistRow}>
                  <Text style={styles.checklistLabel}>Farm Documentation</Text>
                  <View style={[styles.statusChip, styles.statusChipGreen]}>
                    <Text style={[styles.statusChipText, styles.statusChipTextGreen]}>Completed</Text>
                  </View>
                </View>

                <View style={styles.checklistDivider} />

                <View style={styles.checklistRow}>
                  <Text style={styles.checklistLabel}>Organic Practices</Text>
                  <View style={[styles.statusChip, styles.statusChipGreen]}>
                    <Text style={[styles.statusChipText, styles.statusChipTextGreen]}>Completed</Text>
                  </View>
                </View>

                <View style={styles.checklistDivider} />

                <View style={styles.checklistRow}>
                  <Text style={styles.checklistLabel}>Crop Management</Text>
                  <View style={[styles.statusChip, styles.statusChipAmber]}>
                    <Text style={[styles.statusChipText, styles.statusChipTextAmber]}>Pending</Text>
                  </View>
                </View>

                <View style={styles.checklistDivider} />

                <View style={styles.checklistRow}>
                  <Text style={styles.checklistLabel}>Input Usage</Text>
                  <View style={[styles.statusChip, styles.statusChipAmber]}>
                    <Text style={[styles.statusChipText, styles.statusChipTextAmber]}>Pending</Text>
                  </View>
                </View>
              </View>

              {/* Section 3: Inspection Summary */}
              <Text style={styles.detailSectionTitle}>Inspection Summary</Text>
              <View style={styles.summaryKpiRow}>
                <View style={styles.summaryKpiCard}>
                  <Text style={styles.summaryKpiLabel}>MAJOR FINDINGS</Text>
                  <Text style={styles.summaryKpiValueDark}>{record.majorFindings ?? 0}</Text>
                </View>
                <View style={styles.summaryKpiCard}>
                  <Text style={styles.summaryKpiLabel}>MINOR FINDINGS</Text>
                  <Text style={styles.summaryKpiValueAmber}>{record.minorFindings ?? 1}</Text>
                </View>
              </View>

              {/* Section 4: Findings */}
              <Text style={styles.detailSectionTitle}>Findings</Text>
              <View style={styles.findingCard}>
                <Text style={styles.findingTitle}>Pest management issue</Text>
                <View style={styles.findingBadgesRow}>
                  <View style={styles.minorBadge}>
                    <Text style={styles.minorBadgeText}>Minor</Text>
                  </View>
                  <View style={styles.openBadge}>
                    <Text style={styles.openBadgeText}>Open</Text>
                  </View>
                </View>
              </View>
            </>
          ) : (
            <View style={{ marginTop: 10 }}>
              <View style={styles.redFlagBanner}>
                <InfoIcon size={20} color="#B91C1C" />
                <Text style={styles.redFlagBannerText}>
                  No active red flags escalated for this audit cycle. All minor notations are managed in the checklist section.
                </Text>
              </View>
            </View>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* Sticky Bottom Action */}
        <View style={styles.singleBottomBar}>
          <TouchableOpacity
            style={styles.startResumeBtn}
            onPress={() => setCurrentView('audit_inspection')}
            activeOpacity={0.85}
          >
            <HardHatIcon size={18} color={THEME.white} />
            <Text style={styles.startResumeBtnText}>Start / Resume</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN 5: AUDIT INSPECTION SCREEN (Screenshots 1 & 2)
  // ───────────────────────────────────────────────────────────────────────────
  if (currentView === 'audit_inspection') {
    const completedCount = Object.values(completedSections).filter(Boolean).length;
    const missingCount = 10 - completedCount;

    return (
      <SafeAreaView style={styles.rootOrange}>
        <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

        {/* Orange Header */}
        <View style={styles.screenHeader}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() => setCurrentView('inspection')}
            activeOpacity={0.7}
          >
            <BackArrowIcon size={22} color={THEME.white} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.screenHeaderTitle}>Audit Inspection</Text>
            <Text style={styles.screenHeaderSub}>
              {selectedRecord?.id || 'AUD-2026-0042'} · {selectedRecord?.farmerName || 'Ramesh Kumar'}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.detailScrollPad}
          showsVerticalScrollIndicator={false}
        >
          {/* Audit ID & Farmer Info Card (2x3 Grid) */}
          <View style={styles.detailCard}>
            <View style={styles.detailGridRow}>
              <View style={styles.detailGridCol}>
                <Text style={styles.detailMetaLabel}>Audit ID</Text>
                <Text style={styles.detailMetaValue}>{selectedRecord?.id || 'AUD-2026-0042'}</Text>
              </View>
              <View style={styles.detailGridCol}>
                <Text style={styles.detailMetaLabel}>Type</Text>
                <Text style={styles.detailMetaValue}>Internal Audit</Text>
              </View>
            </View>

            <View style={[styles.detailGridRow, { marginTop: 14 }]}>
              <View style={styles.detailGridCol}>
                <Text style={styles.detailMetaLabel}>Farmer</Text>
                <Text style={styles.detailMetaValue}>{selectedRecord?.farmerName || 'Ramesh Kumar'}</Text>
              </View>
              <View style={styles.detailGridCol}>
                <Text style={styles.detailMetaLabel}>Farm</Text>
                <Text style={styles.detailMetaValue}>{selectedRecord?.farm || 'Ramesh Organic Farm'}</Text>
              </View>
            </View>

            <View style={[styles.detailGridRow, { marginTop: 14 }]}>
              <View style={styles.detailGridCol}>
                <Text style={styles.detailMetaLabel}>Date</Text>
                <Text style={styles.detailMetaValue}>{selectedRecord?.date || '15 Oct 2026'}</Text>
              </View>
              <View style={styles.detailGridCol}>
                <Text style={styles.detailMetaLabel}>Auditor</Text>
                <Text style={styles.detailMetaValue}>{selectedRecord?.auditor || 'Suresh Kumar'}</Text>
              </View>
            </View>
          </View>

          {/* Progress Card */}
          <View style={[styles.detailCard, { marginTop: 12 }]}>
            <Text style={styles.progressCardTitle}>
              {completedCount} of 10 sections complete
            </Text>
            <Text style={styles.progressCardSub}>
              {completedCount === 0
                ? '12 required fields are still missing'
                : missingCount > 0
                ? `${missingCount} sections remaining`
                : 'All sections completed'}
            </Text>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${(completedCount / 10) * 100}%` }]} />
            </View>
          </View>

          {/* Section: Inspection sections */}
          <Text style={styles.inspectionSectionsTitle}>Inspection sections</Text>

          {INSPECTION_SECTIONS.slice(0, 10).map((sec) => {
            const isDone = !!completedSections[sec.id];
            return (
              <TouchableOpacity
                key={sec.id}
                style={styles.inspectionSectionCard}
                onPress={() => {
                  setCurrentStep(sec.id);
                  setCurrentView('inspection_step');
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.stepNumCircle, isDone && styles.stepNumCircleDone]}>
                  <Text style={[styles.stepNumText, isDone && styles.stepNumTextDone]}>{sec.id}</Text>
                </View>

                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.stepCardTitle}>{sec.title}</Text>
                  <Text style={[styles.stepCardSub, isDone && { color: THEME.greenText, fontWeight: '700' }]}>
                    {isDone ? 'Completed' : sec.requiredLeft}
                  </Text>
                </View>

                <Text style={[styles.stepCardStatus, isDone && styles.stepCardStatusDone]}>
                  {isDone ? 'Completed' : 'Not Started'}
                </Text>
              </TouchableOpacity>
            );
          })}

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Sticky Bottom Actions */}
        <View style={styles.inspectionBottomBar}>
          <TouchableOpacity
            style={styles.primaryOrangeBtn}
            onPress={() => {
              setCompletedInspectionScore(82);
              setSelectedRecord((prev) => ({
                ...prev,
                score: '82/100',
                previousSummary: {
                  date: prev.previousSummary?.date || '15 Oct 2026',
                  score: '82/100',
                },
              }));
              Alert.alert('Audit Inspection', 'Inspection form submitted successfully! Audit rating generated: 82/100.', [
                { text: 'View Summary', onPress: () => setCurrentView('audit_details_m5') },
              ]);
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryOrangeBtnText}>Review & Submit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveDraftBtn}
            onPress={() => {
              Alert.alert('Draft Saved', 'Your audit inspection progress has been saved as draft. Rating remains 0/100 until form is submitted.');
              setCurrentView('inspection');
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.saveDraftBtnText}>Save Draft</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN 6: INSPECTION STEP DETAIL SCREEN (Screenshots 3 & 4)
  // ───────────────────────────────────────────────────────────────────────────
  if (currentView === 'inspection_step') {
    const activeSec = INSPECTION_SECTIONS.find((s) => s.id === currentStep) ?? INSPECTION_SECTIONS[0]!;

    const handleSaveStep = () => {
      setCompletedSections((prev) => ({ ...prev, [currentStep]: true }));
      if (currentStep < 11) {
        setCurrentStep((prev) => prev + 1);
        setContactDropdownOpen(false);
        setStatusDropdownOpen(false);
        setStep2OpenDropdown(null);
        setStep3OpenDropdown(null);
        setCropsModalVisible(false);
        setPlotModalVisible(false);
        setWaterModalVisible(false);
        setStep4OpenDropdown(null);
        setActiveCalendarField(null);
        setStep5DropdownOpen(false);
        setStep6OpenDropdown(null);
        setActiveWaterSourcePickerIndex(null);
        setActivePurposePickerIndex(null);
        setActiveWaterCalendarIndex(null);
        setCertPdfModalDoc(null);
        setStep7OpenDropdown(null);
        setStep7EvidenceModalSection(null);
        setStep8OpenDropdown(null);
        setStep8RelatedModalIndex(null);
        setStep9OpenDropdown(null);
        setStep9RelatedModalIndex(null);
        setStep9EvidenceRefModalIndex(null);
        setStep10OpenDropdown(null);
        setStep11ExpandedCategory(null);
        setStepDropdownAOpen(false);
        setStepDropdownBOpen(false);
      } else {
        Alert.alert(
          'Inspection Completed',
          'All 11 sections have been successfully completed! Returning to Audit Inspection overview.',
          [{ text: 'OK', onPress: () => setCurrentView('audit_inspection') }]
        );
      }
    };

    const renderCalendarDropdown = (field: 'pgsCertified' | 'pgsExpiry' | 'npopCertified' | 'npopExpiry') => {
      const handlePrevMonth = () => {
        if (calendarMonth === 0) {
          setCalendarMonth(11);
          setCalendarYear((y) => y - 1);
        } else {
          setCalendarMonth((m) => m - 1);
        }
      };

      const handleNextMonth = () => {
        if (calendarMonth === 11) {
          setCalendarMonth(0);
          setCalendarYear((y) => y + 1);
        } else {
          setCalendarMonth((m) => m + 1);
        }
      };

      const handleSelectDate = (d: number, m: number, y: number) => {
        const formatted = `${String(d).padStart(2, '0')}-${String(m + 1).padStart(2, '0')}-${y}`;
        if (field === 'pgsCertified') setPgsCertifiedDate(formatted);
        else if (field === 'pgsExpiry') setPgsExpiryDate(formatted);
        else if (field === 'npopCertified') setNpopCertifiedDate(formatted);
        else if (field === 'npopExpiry') setNpopExpiryDate(formatted);

        setCalendarSelectedDay(d);
        setCalendarMonth(m);
        setCalendarYear(y);
        setActiveCalendarField(null);
      };

      const handleClear = () => {
        if (field === 'pgsCertified') setPgsCertifiedDate('');
        else if (field === 'pgsExpiry') setPgsExpiryDate('');
        else if (field === 'npopCertified') setNpopCertifiedDate('');
        else if (field === 'npopExpiry') setNpopExpiryDate('');
        setActiveCalendarField(null);
      };

      const handleToday = () => {
        const d = 13;
        const m = 9; // October (0-indexed)
        const y = 2026;
        const formatted = '13-10-2026';
        if (field === 'pgsCertified') setPgsCertifiedDate(formatted);
        else if (field === 'pgsExpiry') setPgsExpiryDate(formatted);
        else if (field === 'npopCertified') setNpopCertifiedDate(formatted);
        else if (field === 'npopExpiry') setNpopExpiryDate(formatted);

        setCalendarSelectedDay(d);
        setCalendarMonth(m);
        setCalendarYear(y);
        setActiveCalendarField(null);
      };

      const matrix = getCalendarMatrix(calendarYear, calendarMonth);

      return (
        <View style={styles.calendarDropdownCard}>
          {/* Header: Month, Year and Navigation arrows */}
          <View style={styles.calendarHeaderRow}>
            <View style={styles.calendarMonthPickerBtn}>
              <Text style={styles.calendarMonthTitle}>
                {CALENDAR_MONTHS[calendarMonth]}, {calendarYear}
              </Text>
              <View style={{ marginLeft: 5, marginTop: 1 }}>
                <Svg width={8} height={5} viewBox="0 0 10 6" fill="none">
                  <Path d="M1 1L5 5L9 1" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>
            </View>

            <View style={styles.calendarNavArrows}>
              <TouchableOpacity
                onPress={handlePrevMonth}
                style={styles.calendarNavBtn}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                activeOpacity={0.7}
              >
                <ArrowUpIcon size={16} color="#374151" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleNextMonth}
                style={styles.calendarNavBtn}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 8 }}
                activeOpacity={0.7}
              >
                <ArrowDownIcon size={16} color="#374151" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Weekday Labels: Su Mo Tu We Th Fr Sa */}
          <View style={styles.calendarWeekDaysRow}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <View key={d} style={styles.calendarWeekDayCell}>
                <Text style={styles.calendarWeekDayText}>{d}</Text>
              </View>
            ))}
          </View>

          {/* Days Grid (6 rows x 7 cols) */}
          <View style={styles.calendarGridWrap}>
            {matrix.map((cell, idx) => {
              const isSelected = cell.isCurrentMonth && cell.day === calendarSelectedDay;
              return (
                <TouchableOpacity
                  key={idx}
                  style={styles.calendarDayCell}
                  onPress={() => {
                    if (cell.isCurrentMonth) {
                      handleSelectDate(cell.day, calendarMonth, calendarYear);
                    } else if (cell.monthOffset === -1) {
                      const pm = calendarMonth === 0 ? 11 : calendarMonth - 1;
                      const py = calendarMonth === 0 ? calendarYear - 1 : calendarYear;
                      handleSelectDate(cell.day, pm, py);
                    } else {
                      const nm = calendarMonth === 11 ? 0 : calendarMonth + 1;
                      const ny = calendarMonth === 11 ? calendarYear + 1 : calendarYear;
                      handleSelectDate(cell.day, nm, ny);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.calendarDayBox, isSelected && styles.calendarDayBoxSelected]}>
                    <Text
                      style={[
                        styles.calendarDayText,
                        !cell.isCurrentMonth && styles.calendarDayTextInactive,
                        isSelected && styles.calendarDayTextSelected,
                      ]}
                    >
                      {cell.day}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Footer: Clear & Today */}
          <View style={styles.calendarBottomRow}>
            <TouchableOpacity onPress={handleClear} activeOpacity={0.7} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Text style={styles.calendarBlueActionText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleToday} activeOpacity={0.7} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Text style={styles.calendarBlueActionText}>Today</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    };

    const renderWaterCalendarDropdown = (entryIdx: number) => {
      const handlePrevMonth = () => {
        if (calendarMonth === 0) {
          setCalendarMonth(11);
          setCalendarYear((y) => y - 1);
        } else {
          setCalendarMonth((m) => m - 1);
        }
      };

      const handleNextMonth = () => {
        if (calendarMonth === 11) {
          setCalendarMonth(0);
          setCalendarYear((y) => y + 1);
        } else {
          setCalendarMonth((m) => m + 1);
        }
      };

      const handleSelectDate = (d: number, m: number, y: number) => {
        const formatted = `${String(d).padStart(2, '0')}-${String(m + 1).padStart(2, '0')}-${y}`;
        setWaterSourcesList((prev) =>
          prev.map((item, i) => (i === entryIdx ? { ...item, testDate: formatted } : item))
        );
        setCalendarSelectedDay(d);
        setCalendarMonth(m);
        setCalendarYear(y);
        setActiveWaterCalendarIndex(null);
      };

      const handleClear = () => {
        setWaterSourcesList((prev) =>
          prev.map((item, i) => (i === entryIdx ? { ...item, testDate: '' } : item))
        );
        setActiveWaterCalendarIndex(null);
      };

      const handleToday = () => {
        const formatted = '13-10-2026';
        setWaterSourcesList((prev) =>
          prev.map((item, i) => (i === entryIdx ? { ...item, testDate: formatted } : item))
        );
        setCalendarSelectedDay(13);
        setCalendarMonth(9);
        setCalendarYear(2026);
        setActiveWaterCalendarIndex(null);
      };

      const matrix = getCalendarMatrix(calendarYear, calendarMonth);

      return (
        <View style={styles.calendarDropdownCard}>
          {/* Header */}
          <View style={styles.calendarHeaderRow}>
            <View style={styles.calendarMonthPickerBtn}>
              <Text style={styles.calendarMonthTitle}>
                {CALENDAR_MONTHS[calendarMonth]}, {calendarYear}
              </Text>
              <View style={{ marginLeft: 5, marginTop: 1 }}>
                <Svg width={8} height={5} viewBox="0 0 10 6" fill="none">
                  <Path d="M1 1L5 5L9 1" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>
            </View>

            <View style={styles.calendarNavArrows}>
              <TouchableOpacity
                onPress={handlePrevMonth}
                style={styles.calendarNavBtn}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                activeOpacity={0.7}
              >
                <ArrowUpIcon size={16} color="#374151" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleNextMonth}
                style={styles.calendarNavBtn}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 8 }}
                activeOpacity={0.7}
              >
                <ArrowDownIcon size={16} color="#374151" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Weekdays */}
          <View style={styles.calendarWeekDaysRow}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <View key={d} style={styles.calendarWeekDayCell}>
                <Text style={styles.calendarWeekDayText}>{d}</Text>
              </View>
            ))}
          </View>

          {/* Grid */}
          <View style={styles.calendarGridWrap}>
            {matrix.map((cell, idx) => {
              const isSelected = cell.isCurrentMonth && cell.day === calendarSelectedDay;
              return (
                <TouchableOpacity
                  key={idx}
                  style={styles.calendarDayCell}
                  onPress={() => {
                    if (cell.isCurrentMonth) {
                      handleSelectDate(cell.day, calendarMonth, calendarYear);
                    } else if (cell.monthOffset === -1) {
                      const pm = calendarMonth === 0 ? 11 : calendarMonth - 1;
                      const py = calendarMonth === 0 ? calendarYear - 1 : calendarYear;
                      handleSelectDate(cell.day, pm, py);
                    } else {
                      const nm = calendarMonth === 11 ? 0 : calendarMonth + 1;
                      const ny = calendarMonth === 11 ? calendarYear + 1 : calendarYear;
                      handleSelectDate(cell.day, nm, ny);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.calendarDayBox, isSelected && styles.calendarDayBoxSelected]}>
                    <Text
                      style={[
                        styles.calendarDayText,
                        !cell.isCurrentMonth && styles.calendarDayTextInactive,
                        isSelected && styles.calendarDayTextSelected,
                      ]}
                    >
                      {cell.day}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Footer */}
          <View style={styles.calendarBottomRow}>
            <TouchableOpacity onPress={handleClear} activeOpacity={0.7} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Text style={styles.calendarBlueActionText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleToday} activeOpacity={0.7} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Text style={styles.calendarBlueActionText}>Today</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    };

    return (
      <SafeAreaView style={styles.rootOrange}>
        <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

        {/* Orange Header with Step Pill */}
        <View style={styles.screenHeader}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() => {
              setContactDropdownOpen(false);
              setStatusDropdownOpen(false);
              setStep2OpenDropdown(null);
              setStep3OpenDropdown(null);
              setCropsModalVisible(false);
              setPlotModalVisible(false);
              setWaterModalVisible(false);
              setStep4OpenDropdown(null);
              setActiveCalendarField(null);
              setStep5DropdownOpen(false);
              setStep6OpenDropdown(null);
              setActiveWaterSourcePickerIndex(null);
              setActivePurposePickerIndex(null);
              setActiveWaterCalendarIndex(null);
              setCertPdfModalDoc(null);
              setStep7OpenDropdown(null);
              setStep7EvidenceModalSection(null);
              setStep8OpenDropdown(null);
              setStep8RelatedModalIndex(null);
              setStep9OpenDropdown(null);
              setStep9RelatedModalIndex(null);
              setStep9EvidenceRefModalIndex(null);
              setStep10OpenDropdown(null);
              setStep11ExpandedCategory(null);
              setStepDropdownAOpen(false);
              setStepDropdownBOpen(false);
              setCurrentView('audit_inspection');
            }}
            activeOpacity={0.7}
          >
            <BackArrowIcon size={22} color={THEME.white} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 4 }}>
              <Text style={[styles.screenHeaderTitle, { fontSize: 17, flex: 1 }]} numberOfLines={1}>
                {activeSec.title}
              </Text>
              <View style={styles.headerStepPill}>
                <Text style={styles.headerStepPillText}>
                  {currentStep === 11 ? 'STEP 11' : `${currentStep}/10`}
                </Text>
              </View>
            </View>
            <Text style={styles.screenHeaderSub}>{selectedRecord.id} · {selectedRecord.farmerName}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.detailScrollPad, { paddingBottom: 28 }]}
          showsVerticalScrollIndicator={false}
        >
          {currentStep === 1 ? (
            /* ─── Step 1: Farmer Contact Verification (Screenshots 3 & 4) ─── */
            <View>
              {/* Farmer Name */}
              <View style={styles.formFieldGroup}>
                <View style={styles.labelWithLockRow}>
                  <Text style={styles.formLabel}>Farmer Name</Text>
                  <LockIcon size={13} color="#78716C" />
                </View>
                <View style={styles.lockedInputBox}>
                  <Text style={styles.lockedInputText}>{selectedRecord.farmerName}</Text>
                </View>
              </View>

              {/* Farmer ID */}
              <View style={styles.formFieldGroup}>
                <View style={styles.labelWithLockRow}>
                  <Text style={styles.formLabel}>Farmer ID</Text>
                  <LockIcon size={13} color="#78716C" />
                </View>
                <View style={styles.lockedInputBox}>
                  <Text style={styles.lockedInputText}>{selectedRecord.farmerId || 'FMR-00124'}</Text>
                </View>
              </View>

              {/* Phone Number */}
              <View style={styles.formFieldGroup}>
                <View style={styles.labelWithLockRow}>
                  <Text style={styles.formLabel}>Phone Number</Text>
                  <LockIcon size={13} color="#78716C" />
                </View>
                <View style={styles.lockedInputBox}>
                  <Text style={styles.lockedInputText}>+91 98XXX XX011</Text>
                </View>
                <Text style={styles.reportCorrectionText}>
                  Report correction · the profile is not edited{' '}
                  <Text style={styles.underlineLink} onPress={() => Alert.alert('Report Correction', 'Profile correction request logged.')}>
                    here
                  </Text>
                  .
                </Text>
              </View>

              {/* Address */}
              <View style={styles.formFieldGroup}>
                <View style={styles.labelWithLockRow}>
                  <Text style={styles.formLabel}>Address</Text>
                  <LockIcon size={13} color="#78716C" />
                </View>
                <View style={styles.lockedInputBox}>
                  <Text style={styles.lockedInputText}>12, Hill View Road, Coonoor, Nilgiris</Text>
                </View>
                <Text style={styles.reportCorrectionText}>
                  Report correction · the profile is not edited{' '}
                  <Text style={styles.underlineLink} onPress={() => Alert.alert('Report Correction', 'Profile correction request logged.')}>
                    here
                  </Text>
                  .
                </Text>
              </View>

              {/* Preferred Contact Method */}
              <View style={styles.formFieldGroup}>
                <Text style={styles.formLabel}>Preferred Contact Method</Text>
                <TouchableOpacity
                  style={styles.dropdownSelectorBox}
                  onPress={() => {
                    setContactDropdownOpen(!contactDropdownOpen);
                    setStatusDropdownOpen(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownSelectorText}>{preferredContact}</Text>
                  <ChevronDownIcon size={16} color="#1F2937" />
                </TouchableOpacity>

                {contactDropdownOpen && (
                  <View style={styles.dropdownMenu}>
                    {(['Select...', 'WhatsApp', 'SMS', 'Phone'] as const).map((opt) => {
                      const isSelected = preferredContact === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                          onPress={() => {
                            setPreferredContact(opt);
                            setContactDropdownOpen(false);
                          }}
                        >
                          <Text style={[styles.dropdownMenuText, isSelected && styles.dropdownMenuTextActive]}>
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Contact Verification Status * */}
              <View style={styles.formFieldGroup}>
                <Text style={styles.formLabel}>
                  Contact Verification Status <Text style={{ color: '#DC2626' }}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.dropdownSelectorBox}
                  onPress={() => {
                    setStatusDropdownOpen(!statusDropdownOpen);
                    setContactDropdownOpen(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownSelectorText}>{verificationStatus}</Text>
                  <ChevronDownIcon size={16} color="#1F2937" />
                </TouchableOpacity>

                {statusDropdownOpen && (
                  <View style={styles.dropdownMenu}>
                    {(['Select...', 'Verified', 'Need Correction', 'Not Verified'] as const).map((opt) => {
                      const isSelected = verificationStatus === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                          onPress={() => {
                            setVerificationStatus(opt);
                            setStatusDropdownOpen(false);
                          }}
                        >
                          <Text style={[styles.dropdownMenuText, isSelected && styles.dropdownMenuTextActive]}>
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Additional Notes */}
              <View style={styles.formFieldGroup}>
                <Text style={styles.formLabel}>Additional Notes</Text>
                <View style={styles.notesTextareaContainer}>
                  <TextInput
                    style={styles.notesTextareaInput}
                    value={stepNotes}
                    onChangeText={setStepNotes}
                    placeholder=""
                    placeholderTextColor="#9CA3AF"
                    multiline
                    textAlignVertical="top"
                  />
                  <View style={styles.resizeHandleWrap}>
                    <ResizeHandleIcon size={12} color="#9CA3AF" />
                  </View>
                </View>
              </View>
            </View>
          ) : currentStep === 2 ? (
            /* ─── Step 2: FMB & Land Verification (Screenshots 1 - 5) ─── */
            <View>
              {/* FMB Sketch Card */}
              <View style={styles.formFieldGroup}>
                <Text style={styles.formLabel}>FMB Sketch</Text>
                <TouchableOpacity
                  style={styles.fileCard}
                  onPress={() => setFmbModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <View style={styles.fileCardLeft}>
                    <FileTextIcon size={19} color="#854F0B" />
                    <Text style={styles.fileCardTitle}>FMB Sketch</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.viewOutlineBtn}
                    onPress={() => setFmbModalVisible(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.viewOutlineBtnText}>View</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              </View>

              {/* Upload / replace FMB sketch */}
              <View style={styles.formFieldGroup}>
                <Text style={styles.formLabel}>Upload / replace FMB sketch</Text>
                <TouchableOpacity
                  style={styles.dashedUploadBox}
                  onPress={() => {
                    setFmbUploadedFile('fmb_sketch_new.pdf');
                    Alert.alert('Upload File', 'File selected: fmb_sketch_new.pdf');
                  }}
                  activeOpacity={0.7}
                >
                  <UploadFileIcon size={19} color="#854F0B" />
                  <Text style={styles.dashedUploadText}>
                    {fmbUploadedFile ? fmbUploadedFile : 'Upload file'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Survey Reference Number */}
              <View style={styles.formFieldGroup}>
                <Text style={styles.formLabel}>Survey Reference Number</Text>
                <TextInput
                  style={styles.whiteInputBox}
                  value={surveyRefNumber}
                  onChangeText={setSurveyRefNumber}
                  placeholder=""
                  placeholderTextColor="#9CA3AF"
                />
                <Text style={styles.surveyHelperText}>
                  Not on record — enter it from the document.
                </Text>
              </View>

              {/* FMB Document Available * */}
              <View style={styles.formFieldGroup}>
                <Text style={styles.formLabel}>
                  FMB Document Available <Text style={{ color: '#DC2626' }}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.dropdownSelectorBox}
                  onPress={() =>
                    setStep2OpenDropdown(step2OpenDropdown === 'fmbDoc' ? null : 'fmbDoc')
                  }
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownSelectorText}>{fmbDocAvailable}</Text>
                  <ChevronDownIcon size={16} color="#1F2937" />
                </TouchableOpacity>

                {step2OpenDropdown === 'fmbDoc' && (
                  <View style={styles.dropdownMenu}>
                    {(['Select...', 'Yes', 'No'] as const).map((opt) => {
                      const isSelected = fmbDocAvailable === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                          onPress={() => {
                            setFmbDocAvailable(opt);
                            setStep2OpenDropdown(null);
                          }}
                        >
                          <Text style={[styles.dropdownMenuText, isSelected && styles.dropdownMenuTextActive]}>
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Document Legibility */}
              <View style={styles.formFieldGroup}>
                <Text style={styles.formLabel}>Document Legibility</Text>
                <TouchableOpacity
                  style={styles.dropdownSelectorBox}
                  onPress={() =>
                    setStep2OpenDropdown(step2OpenDropdown === 'legibility' ? null : 'legibility')
                  }
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownSelectorText}>{docLegibility}</Text>
                  <ChevronDownIcon size={16} color="#1F2937" />
                </TouchableOpacity>

                {step2OpenDropdown === 'legibility' && (
                  <View style={styles.dropdownMenu}>
                    {(['Select...', 'Clear', 'Partially Legible', 'Illegible'] as const).map((opt) => {
                      const isSelected = docLegibility === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                          onPress={() => {
                            setDocLegibility(opt);
                            setStep2OpenDropdown(null);
                          }}
                        >
                          <Text style={[styles.dropdownMenuText, isSelected && styles.dropdownMenuTextActive]}>
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Boundary Verification */}
              <View style={styles.formFieldGroup}>
                <Text style={styles.formLabel}>Boundary Verification</Text>
                <TouchableOpacity
                  style={styles.dropdownSelectorBox}
                  onPress={() =>
                    setStep2OpenDropdown(step2OpenDropdown === 'boundary' ? null : 'boundary')
                  }
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownSelectorText}>{boundaryVerification}</Text>
                  <ChevronDownIcon size={16} color="#1F2937" />
                </TouchableOpacity>

                {step2OpenDropdown === 'boundary' && (
                  <View style={styles.dropdownMenu}>
                    {(['Select...', 'Matches FMB', 'Discrepancy Found'] as const).map((opt) => {
                      const isSelected = boundaryVerification === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                          onPress={() => {
                            setBoundaryVerification(opt);
                            setStep2OpenDropdown(null);
                          }}
                        >
                          <Text style={[styles.dropdownMenuText, isSelected && styles.dropdownMenuTextActive]}>
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Farm Location Verification */}
              <View style={styles.formFieldGroup}>
                <Text style={styles.formLabel}>Farm Location Verification</Text>
                <TouchableOpacity
                  style={styles.dropdownSelectorBox}
                  onPress={() =>
                    setStep2OpenDropdown(step2OpenDropdown === 'location' ? null : 'location')
                  }
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownSelectorText}>{farmLocationVerification}</Text>
                  <ChevronDownIcon size={16} color="#1F2937" />
                </TouchableOpacity>

                {step2OpenDropdown === 'location' && (
                  <View style={styles.dropdownMenu}>
                    {(['Select...', 'Confirmed On-Site', 'Could Not Confirm'] as const).map((opt) => {
                      const isSelected = farmLocationVerification === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                          onPress={() => {
                            setFarmLocationVerification(opt);
                            setStep2OpenDropdown(null);
                          }}
                        >
                          <Text style={[styles.dropdownMenuText, isSelected && styles.dropdownMenuTextActive]}>
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Plot / Zone Mapping Status */}
              <View style={styles.formFieldGroup}>
                <Text style={styles.formLabel}>Plot / Zone Mapping Status</Text>
                <TouchableOpacity
                  style={styles.dropdownSelectorBox}
                  onPress={() =>
                    setStep2OpenDropdown(step2OpenDropdown === 'mapping' ? null : 'mapping')
                  }
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownSelectorText}>{plotMappingStatus}</Text>
                  <ChevronDownIcon size={16} color="#1F2937" />
                </TouchableOpacity>

                {step2OpenDropdown === 'mapping' && (
                  <View style={styles.dropdownMenu}>
                    {(['Select...', 'Mapped', 'Not Mapped'] as const).map((opt) => {
                      const isSelected = plotMappingStatus === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                          onPress={() => {
                            setPlotMappingStatus(opt);
                            setStep2OpenDropdown(null);
                          }}
                        >
                          <Text style={[styles.dropdownMenuText, isSelected && styles.dropdownMenuTextActive]}>
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Land Boundary Status */}
              <View style={styles.formFieldGroup}>
                <Text style={styles.formLabel}>Land Boundary Status</Text>
                <TouchableOpacity
                  style={styles.dropdownSelectorBox}
                  onPress={() =>
                    setStep2OpenDropdown(step2OpenDropdown === 'landBoundary' ? null : 'landBoundary')
                  }
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownSelectorText}>{landBoundaryStatus}</Text>
                  <ChevronDownIcon size={16} color="#1F2937" />
                </TouchableOpacity>

                {step2OpenDropdown === 'landBoundary' && (
                  <View style={styles.dropdownMenu}>
                    {(['Select...', 'Undisputed', 'Disputed'] as const).map((opt) => {
                      const isSelected = landBoundaryStatus === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                          onPress={() => {
                            setLandBoundaryStatus(opt);
                            setStep2OpenDropdown(null);
                          }}
                        >
                          <Text style={[styles.dropdownMenuText, isSelected && styles.dropdownMenuTextActive]}>
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Notes */}
              <View style={styles.formFieldGroup}>
                <Text style={styles.formLabel}>Notes</Text>
                <View style={styles.notesTextareaContainer}>
                  <TextInput
                    style={styles.notesTextareaInput}
                    value={step2Notes}
                    onChangeText={setStep2Notes}
                    placeholder=""
                    placeholderTextColor="#9CA3AF"
                    multiline
                    textAlignVertical="top"
                  />
                  <View style={styles.resizeHandleWrap}>
                    <ResizeHandleIcon size={12} color="#9CA3AF" />
                  </View>
                </View>
              </View>

              {/* Supporting Evidence */}
              <View style={styles.formFieldGroup}>
                <Text style={styles.formLabel}>Supporting Evidence</Text>
                <TouchableOpacity
                  style={styles.dashedUploadBox}
                  onPress={() => {
                    setEvidenceUploadedFile('evidence_land_boundary.jpg');
                    Alert.alert('Upload File', 'File selected: evidence_land_boundary.jpg');
                  }}
                  activeOpacity={0.7}
                >
                  <UploadFileIcon size={19} color="#854F0B" />
                  <Text style={styles.dashedUploadText}>
                    {evidenceUploadedFile ? evidenceUploadedFile : 'Upload file'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : currentStep === 3 ? (
            /* ─── Step 3: Farm Details Verification (Screenshots 1 - 5) ─── */
            <View>
              {/* Farm Name (Locked) */}
              <View style={styles.formFieldGroup}>
                <View style={styles.labelWithLockRow}>
                  <Text style={styles.formLabel}>Farm Name</Text>
                  <LockIcon size={13} color="#78716C" />
                </View>
                <View style={styles.lockedInputBox}>
                  <Text style={styles.lockedInputText}>Ramesh Organic Farm</Text>
                </View>
              </View>

              {/* Farm ID (Locked) */}
              <View style={styles.formFieldGroup}>
                <View style={styles.labelWithLockRow}>
                  <Text style={styles.formLabel}>Farm ID</Text>
                  <LockIcon size={13} color="#78716C" />
                </View>
                <View style={styles.lockedInputBox}>
                  <Text style={styles.lockedInputText}>FRM-00124-01</Text>
                </View>
              </View>

              {/* Farm Location (Locked) */}
              <View style={styles.formFieldGroup}>
                <View style={styles.labelWithLockRow}>
                  <Text style={styles.formLabel}>Farm Location</Text>
                  <LockIcon size={13} color="#78716C" />
                </View>
                <View style={styles.lockedInputBox}>
                  <Text style={styles.lockedInputText}>Coonoor, Nilgiris</Text>
                </View>
              </View>

              {/* GPS Coordinates (Locked) */}
              <View style={styles.formFieldGroup}>
                <View style={styles.labelWithLockRow}>
                  <Text style={styles.formLabel}>GPS Coordinates</Text>
                  <LockIcon size={13} color="#78716C" />
                </View>
                <View style={styles.lockedInputBox}>
                  <Text style={styles.lockedInputText}>11.3530° N, 76.7959° E</Text>
                </View>
              </View>

              {/* Farm Area (Locked) */}
              <View style={styles.formFieldGroup}>
                <View style={styles.labelWithLockRow}>
                  <Text style={styles.formLabel}>Farm Area</Text>
                  <LockIcon size={13} color="#78716C" />
                </View>
                <View style={styles.lockedInputBox}>
                  <Text style={styles.lockedInputText}>2.4 acres</Text>
                </View>
              </View>

              {/* Farming Type (Dropdown) */}
              <View style={styles.formFieldGroup}>
                <Text style={styles.formLabel}>Farming Type</Text>
                <TouchableOpacity
                  style={styles.dropdownSelectorBox}
                  onPress={() =>
                    setStep3OpenDropdown(step3OpenDropdown === 'farmingType' ? null : 'farmingType')
                  }
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownSelectorText}>{farmingType}</Text>
                  <ChevronDownIcon size={16} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.surveyHelperText}>
                  Recorded on profile: Organic
                </Text>

                {step3OpenDropdown === 'farmingType' && (
                  <View style={styles.dropdownMenu}>
                    {(['Select...', 'Organic', 'Transition', 'Conventional'] as const).map((opt) => {
                      const isSelected = farmingType === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                          onPress={() => {
                            setFarmingType(opt);
                            setStep3OpenDropdown(null);
                          }}
                        >
                          <Text style={[styles.dropdownMenuText, isSelected && styles.dropdownMenuTextActive]}>
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Crops Grown */}
              <View style={styles.formFieldGroup}>
                <Text style={styles.formLabel}>Crops Grown</Text>
                <TouchableOpacity
                  style={styles.dropdownSelectorBox}
                  onPress={() => {
                    setStep3OpenDropdown(null);
                    setCropsModalVisible(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.dropdownSelectorText,
                      selectedCrops.length === 0 && { color: '#9CA3AF' },
                    ]}
                    numberOfLines={1}
                  >
                    {selectedCrops.length > 0 ? selectedCrops.join(', ') : 'Select...'}
                  </Text>
                  <SlidersHorizontalIcon size={18} color="#854F0B" />
                </TouchableOpacity>
              </View>

              {/* Plot / Zone */}
              <View style={styles.formFieldGroup}>
                <Text style={styles.formLabel}>Plot / Zone</Text>
                <TouchableOpacity
                  style={styles.dropdownSelectorBox}
                  onPress={() => {
                    setStep3OpenDropdown(null);
                    setPlotModalVisible(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.dropdownSelectorText,
                      selectedPlotZone === 'Select...' && { color: '#9CA3AF' },
                    ]}
                  >
                    {selectedPlotZone}
                  </Text>
                  <SearchIcon size={18} color="#854F0B" />
                </TouchableOpacity>
              </View>

              {/* Water Source */}
              <View style={styles.formFieldGroup}>
                <Text style={styles.formLabel}>Water Source</Text>
                <TouchableOpacity
                  style={styles.dropdownSelectorBox}
                  onPress={() => {
                    setStep3OpenDropdown(null);
                    setWaterModalVisible(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.dropdownSelectorText,
                      selectedWaterSource === 'Select...' && { color: '#9CA3AF' },
                    ]}
                  >
                    {selectedWaterSource}
                  </Text>
                  <SearchIcon size={18} color="#854F0B" />
                </TouchableOpacity>
              </View>

              {/* Irrigation Type */}
              <View style={styles.formFieldGroup}>
                <Text style={styles.formLabel}>Irrigation Type</Text>
                <TouchableOpacity
                  style={styles.dropdownSelectorBox}
                  onPress={() =>
                    setStep3OpenDropdown(step3OpenDropdown === 'irrigation' ? null : 'irrigation')
                  }
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownSelectorText}>{irrigationType}</Text>
                  <ChevronDownIcon size={16} color="#1F2937" />
                </TouchableOpacity>

                {step3OpenDropdown === 'irrigation' && (
                  <View style={styles.dropdownMenu}>
                    {(['Select...', 'Drip', 'Sprinkler', 'Flood', 'Rain-fed'] as const).map((opt) => {
                      const isSelected = irrigationType === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                          onPress={() => {
                            setIrrigationType(opt);
                            setStep3OpenDropdown(null);
                          }}
                        >
                          <Text style={[styles.dropdownMenuText, isSelected && styles.dropdownMenuTextActive]}>
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Farm Records Availability */}
              <View style={styles.formFieldGroup}>
                <Text style={styles.formLabel}>Farm Records Availability</Text>
                <TouchableOpacity
                  style={styles.dropdownSelectorBox}
                  onPress={() =>
                    setStep3OpenDropdown(step3OpenDropdown === 'records' ? null : 'records')
                  }
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownSelectorText}>{farmRecordsAvailability}</Text>
                  <ChevronDownIcon size={16} color="#1F2937" />
                </TouchableOpacity>

                {step3OpenDropdown === 'records' && (
                  <View style={styles.dropdownMenu}>
                    {(['Select...', 'Available', 'Partially Available', 'Not Available'] as const).map((opt) => {
                      const isSelected = farmRecordsAvailability === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                          onPress={() => {
                            setFarmRecordsAvailability(opt);
                            setStep3OpenDropdown(null);
                          }}
                        >
                          <Text style={[styles.dropdownMenuText, isSelected && styles.dropdownMenuTextActive]}>
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Farm Details Verification * */}
              <View style={styles.formFieldGroup}>
                <Text style={styles.formLabel}>
                  Farm Details Verification <Text style={{ color: '#DC2626' }}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.dropdownSelectorBox}
                  onPress={() =>
                    setStep3OpenDropdown(step3OpenDropdown === 'verification' ? null : 'verification')
                  }
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownSelectorText}>{farmDetailsVerification}</Text>
                  <ChevronDownIcon size={16} color="#1F2937" />
                </TouchableOpacity>

                {step3OpenDropdown === 'verification' && (
                  <View style={styles.dropdownMenu}>
                    {(['Select...', 'Verified', 'Discrepancy Found'] as const).map((opt) => {
                      const isSelected = farmDetailsVerification === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                          onPress={() => {
                            setFarmDetailsVerification(opt);
                            setStep3OpenDropdown(null);
                          }}
                        >
                          <Text style={[styles.dropdownMenuText, isSelected && styles.dropdownMenuTextActive]}>
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Notes */}
              <View style={styles.formFieldGroup}>
                <Text style={styles.formLabel}>Notes</Text>
                <View style={styles.notesTextareaContainer}>
                  <TextInput
                    style={styles.notesTextareaInput}
                    value={step3Notes}
                    onChangeText={setStep3Notes}
                    placeholder=""
                    placeholderTextColor="#9CA3AF"
                    multiline
                    textAlignVertical="top"
                  />
                  <View style={styles.resizeHandleWrap}>
                    <ResizeHandleIcon size={12} color="#9CA3AF" />
                  </View>
                </View>
              </View>
            </View>
          ) : currentStep === 4 ? (
            /* ─── Step 4: Certification Verification (Screenshots 1 - 5) ─── */
            <View>
              {/* Accordion 1: PGS Organic */}
              <View style={styles.certAccordionCard}>
                <TouchableOpacity
                  style={styles.certAccordionHeader}
                  onPress={() => setPgsExpanded(!pgsExpanded)}
                  activeOpacity={0.8}
                >
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.certAccordionTitle}>PGS Organic</Text>
                    <Text style={styles.certAccordionSub}>
                      certified 2026-06-12 · renewal 2027-06-12
                    </Text>
                  </View>
                  {pgsExpanded ? (
                    <ChevronUpIcon size={18} color="#7A2E14" />
                  ) : (
                    <ChevronDownIcon size={18} color="#7A2E14" />
                  )}
                </TouchableOpacity>

                {pgsExpanded && (
                  <View style={styles.certAccordionBody}>
                    {/* Informational Profile Subtext */}
                    <Text style={styles.certInfoText}>
                      Recorded on profile: Active · certified 2026-06-12 · renewal 2027-06-12.{'\n'}
                      The inspection does not declare a certificate valid or expired.
                    </Text>

                    {/* Certification Type (Locked) */}
                    <View style={styles.formFieldGroup}>
                      <View style={styles.labelWithLockRow}>
                        <Text style={styles.formLabel}>Certification Type</Text>
                        <LockIcon size={13} color="#78716C" />
                      </View>
                      <View style={styles.lockedInputBox}>
                        <Text style={styles.lockedInputText}>PGS Organic</Text>
                      </View>
                    </View>

                    {/* Certification Status */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>Certification Status</Text>
                      <TouchableOpacity
                        style={styles.dropdownSelectorBox}
                        onPress={() =>
                          setStep4OpenDropdown(step4OpenDropdown === 'pgsStatus' ? null : 'pgsStatus')
                        }
                        activeOpacity={0.8}
                      >
                        <Text style={styles.dropdownSelectorText}>{pgsCertStatus}</Text>
                        <ChevronDownIcon size={16} color="#1F2937" />
                      </TouchableOpacity>

                      {step4OpenDropdown === 'pgsStatus' && (
                        <View style={styles.dropdownMenu}>
                          {(['Select...', 'Valid', 'Expired', 'Not Found'] as const).map((opt) => {
                            const isSelected = pgsCertStatus === opt;
                            return (
                              <TouchableOpacity
                                key={opt}
                                style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                                onPress={() => {
                                  setPgsCertStatus(opt);
                                  setStep4OpenDropdown(null);
                                }}
                              >
                                <Text style={[styles.dropdownMenuText, isSelected && styles.dropdownMenuTextActive]}>
                                  {opt}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>

                    {/* Certificate Document */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>Certificate Document</Text>
                      <View style={styles.fileCard}>
                        <View style={styles.fileCardLeft}>
                          <FileTextIcon size={19} color="#854F0B" />
                          <Text style={styles.fileCardTitle}>PGS Organic Certificate</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.viewOutlineBtn}
                          onPress={() =>
                            setCertPdfModalDoc({
                              title: 'PGS Organic Certificate',
                              fileName: 'PGS_Organic_Certificate_2026.pdf',
                              certNumber: 'PGS-IND-2026-0042',
                              validThrough: '12 Jun 2027',
                              agency: 'PGS-India National Council',
                            })
                          }
                          activeOpacity={0.7}
                        >
                          <Text style={styles.viewOutlineBtnText}>View</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Upload certificate */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>Upload certificate</Text>
                      <TouchableOpacity
                        style={styles.dashedUploadBox}
                        onPress={() => {
                          Alert.alert('Upload File', 'File selected: pgs_organic_cert_renewed.pdf');
                        }}
                        activeOpacity={0.7}
                      >
                        <UploadFileIcon size={19} color="#854F0B" />
                        <Text style={styles.dashedUploadText}>Upload file</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Certified Date */}
                    <View style={[styles.formFieldGroup, activeCalendarField === 'pgsCertified' && { zIndex: 100 }]}>
                      <Text style={styles.formLabel}>Certified Date</Text>
                      <TouchableOpacity
                        style={styles.dateInputRow}
                        onPress={() => {
                          setStep4OpenDropdown(null);
                          setActiveCalendarField(activeCalendarField === 'pgsCertified' ? null : 'pgsCertified');
                        }}
                        activeOpacity={0.85}
                      >
                        <TextInput
                          style={styles.dateTextInput}
                          value={pgsCertifiedDate}
                          onChangeText={setPgsCertifiedDate}
                          placeholder="dd-mm-yyyy"
                          placeholderTextColor="#9CA3AF"
                          onFocus={() => {
                            setStep4OpenDropdown(null);
                            setActiveCalendarField('pgsCertified');
                          }}
                        />
                        <TouchableOpacity
                          onPress={() => {
                            setStep4OpenDropdown(null);
                            setActiveCalendarField(activeCalendarField === 'pgsCertified' ? null : 'pgsCertified');
                          }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          activeOpacity={0.7}
                        >
                          <CalendarIcon size={18} color="#6B7280" />
                        </TouchableOpacity>
                      </TouchableOpacity>
                      {activeCalendarField === 'pgsCertified' && renderCalendarDropdown('pgsCertified')}
                    </View>

                    {/* Renewal / Expiry Date */}
                    <View style={[styles.formFieldGroup, activeCalendarField === 'pgsExpiry' && { zIndex: 90 }]}>
                      <Text style={styles.formLabel}>Renewal / Expiry Date</Text>
                      <TouchableOpacity
                        style={styles.dateInputRow}
                        onPress={() => {
                          setStep4OpenDropdown(null);
                          setActiveCalendarField(activeCalendarField === 'pgsExpiry' ? null : 'pgsExpiry');
                        }}
                        activeOpacity={0.85}
                      >
                        <TextInput
                          style={styles.dateTextInput}
                          value={pgsExpiryDate}
                          onChangeText={setPgsExpiryDate}
                          placeholder="dd-mm-yyyy"
                          placeholderTextColor="#9CA3AF"
                          onFocus={() => {
                            setStep4OpenDropdown(null);
                            setActiveCalendarField('pgsExpiry');
                          }}
                        />
                        <TouchableOpacity
                          onPress={() => {
                            setStep4OpenDropdown(null);
                            setActiveCalendarField(activeCalendarField === 'pgsExpiry' ? null : 'pgsExpiry');
                          }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          activeOpacity={0.7}
                        >
                          <CalendarIcon size={18} color="#6B7280" />
                        </TouchableOpacity>
                      </TouchableOpacity>
                      {activeCalendarField === 'pgsExpiry' && renderCalendarDropdown('pgsExpiry')}
                    </View>

                    {/* Document Verification * */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>
                        Document Verification <Text style={{ color: '#DC2626' }}>*</Text>
                      </Text>
                      <TouchableOpacity
                        style={styles.dropdownSelectorBox}
                        onPress={() =>
                          setStep4OpenDropdown(step4OpenDropdown === 'pgsDocVerif' ? null : 'pgsDocVerif')
                        }
                        activeOpacity={0.8}
                      >
                        <Text style={styles.dropdownSelectorText}>{pgsDocVerification}</Text>
                        <ChevronDownIcon size={16} color="#1F2937" />
                      </TouchableOpacity>

                      {step4OpenDropdown === 'pgsDocVerif' && (
                        <View style={styles.dropdownMenu}>
                          {(['Select...', 'Verified', 'Could Not Verify', 'Discrepancy Found'] as const).map((opt) => {
                            const isSelected = pgsDocVerification === opt;
                            return (
                              <TouchableOpacity
                                key={opt}
                                style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                                onPress={() => {
                                  setPgsDocVerification(opt);
                                  setStep4OpenDropdown(null);
                                }}
                              >
                                <Text style={[styles.dropdownMenuText, isSelected && styles.dropdownMenuTextActive]}>
                                  {opt}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>

                    {/* Verification Notes */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>Verification Notes</Text>
                      <View style={styles.notesTextareaContainer}>
                        <TextInput
                          style={styles.notesTextareaInput}
                          value={pgsVerificationNotes}
                          onChangeText={setPgsVerificationNotes}
                          placeholder=""
                          placeholderTextColor="#9CA3AF"
                          multiline
                          textAlignVertical="top"
                        />
                        <View style={styles.resizeHandleWrap}>
                          <ResizeHandleIcon size={12} color="#9CA3AF" />
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </View>

              {/* Accordion 2: NPOP */}
              <View style={styles.certAccordionCard}>
                <TouchableOpacity
                  style={styles.certAccordionHeader}
                  onPress={() => setNpopExpanded(!npopExpanded)}
                  activeOpacity={0.8}
                >
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.certAccordionTitle}>NPOP</Text>
                    <Text style={styles.certAccordionSub}>
                      certified 2026-03-01 · renewal 2027-03-01
                    </Text>
                  </View>
                  {npopExpanded ? (
                    <ChevronUpIcon size={18} color="#7A2E14" />
                  ) : (
                    <ChevronDownIcon size={18} color="#7A2E14" />
                  )}
                </TouchableOpacity>

                {npopExpanded && (
                  <View style={styles.certAccordionBody}>
                    {/* Informational Profile Subtext */}
                    <Text style={styles.certInfoText}>
                      Recorded on profile: Active · certified 2026-03-01 · renewal 2027-03-01.{'\n'}
                      The inspection does not declare a certificate valid or expired.
                    </Text>

                    {/* Certification Type (Locked) */}
                    <View style={styles.formFieldGroup}>
                      <View style={styles.labelWithLockRow}>
                        <Text style={styles.formLabel}>Certification Type</Text>
                        <LockIcon size={13} color="#78716C" />
                      </View>
                      <View style={styles.lockedInputBox}>
                        <Text style={styles.lockedInputText}>NPOP</Text>
                      </View>
                    </View>

                    {/* Certification Status */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>Certification Status</Text>
                      <TouchableOpacity
                        style={styles.dropdownSelectorBox}
                        onPress={() =>
                          setStep4OpenDropdown(step4OpenDropdown === 'npopStatus' ? null : 'npopStatus')
                        }
                        activeOpacity={0.8}
                      >
                        <Text style={styles.dropdownSelectorText}>{npopCertStatus}</Text>
                        <ChevronDownIcon size={16} color="#1F2937" />
                      </TouchableOpacity>

                      {step4OpenDropdown === 'npopStatus' && (
                        <View style={styles.dropdownMenu}>
                          {(['Select...', 'Valid', 'Expired', 'Not Found'] as const).map((opt) => {
                            const isSelected = npopCertStatus === opt;
                            return (
                              <TouchableOpacity
                                key={opt}
                                style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                                onPress={() => {
                                  setNpopCertStatus(opt);
                                  setStep4OpenDropdown(null);
                                }}
                              >
                                <Text style={[styles.dropdownMenuText, isSelected && styles.dropdownMenuTextActive]}>
                                  {opt}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>

                    {/* Certificate Document */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>Certificate Document</Text>
                      <View style={styles.fileCard}>
                        <View style={styles.fileCardLeft}>
                          <FileTextIcon size={19} color="#854F0B" />
                          <Text style={styles.fileCardTitle}>NPOP Certificate</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.viewOutlineBtn}
                          onPress={() =>
                            setCertPdfModalDoc({
                              title: 'NPOP Certificate',
                              fileName: 'NPOP_Certificate_2026.pdf',
                              certNumber: 'NPOP-NAB-2026-0042',
                              validThrough: '01 Mar 2027',
                              agency: 'APEDA National Accreditation Board',
                            })
                          }
                          activeOpacity={0.7}
                        >
                          <Text style={styles.viewOutlineBtnText}>View</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Upload certificate */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>Upload certificate</Text>
                      <TouchableOpacity
                        style={styles.dashedUploadBox}
                        onPress={() => {
                          Alert.alert('Upload File', 'File selected: npop_cert_renewed.pdf');
                        }}
                        activeOpacity={0.7}
                      >
                        <UploadFileIcon size={19} color="#854F0B" />
                        <Text style={styles.dashedUploadText}>Upload file</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Certified Date */}
                    <View style={[styles.formFieldGroup, activeCalendarField === 'npopCertified' && { zIndex: 100 }]}>
                      <Text style={styles.formLabel}>Certified Date</Text>
                      <TouchableOpacity
                        style={styles.dateInputRow}
                        onPress={() => {
                          setStep4OpenDropdown(null);
                          setActiveCalendarField(activeCalendarField === 'npopCertified' ? null : 'npopCertified');
                        }}
                        activeOpacity={0.85}
                      >
                        <TextInput
                          style={styles.dateTextInput}
                          value={npopCertifiedDate}
                          onChangeText={setNpopCertifiedDate}
                          placeholder="dd-mm-yyyy"
                          placeholderTextColor="#9CA3AF"
                          onFocus={() => {
                            setStep4OpenDropdown(null);
                            setActiveCalendarField('npopCertified');
                          }}
                        />
                        <TouchableOpacity
                          onPress={() => {
                            setStep4OpenDropdown(null);
                            setActiveCalendarField(activeCalendarField === 'npopCertified' ? null : 'npopCertified');
                          }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          activeOpacity={0.7}
                        >
                          <CalendarIcon size={18} color="#6B7280" />
                        </TouchableOpacity>
                      </TouchableOpacity>
                      {activeCalendarField === 'npopCertified' && renderCalendarDropdown('npopCertified')}
                    </View>

                    {/* Renewal / Expiry Date */}
                    <View style={[styles.formFieldGroup, activeCalendarField === 'npopExpiry' && { zIndex: 90 }]}>
                      <Text style={styles.formLabel}>Renewal / Expiry Date</Text>
                      <TouchableOpacity
                        style={styles.dateInputRow}
                        onPress={() => {
                          setStep4OpenDropdown(null);
                          setActiveCalendarField(activeCalendarField === 'npopExpiry' ? null : 'npopExpiry');
                        }}
                        activeOpacity={0.85}
                      >
                        <TextInput
                          style={styles.dateTextInput}
                          value={npopExpiryDate}
                          onChangeText={setNpopExpiryDate}
                          placeholder="dd-mm-yyyy"
                          placeholderTextColor="#9CA3AF"
                          onFocus={() => {
                            setStep4OpenDropdown(null);
                            setActiveCalendarField('npopExpiry');
                          }}
                        />
                        <TouchableOpacity
                          onPress={() => {
                            setStep4OpenDropdown(null);
                            setActiveCalendarField(activeCalendarField === 'npopExpiry' ? null : 'npopExpiry');
                          }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          activeOpacity={0.7}
                        >
                          <CalendarIcon size={18} color="#6B7280" />
                        </TouchableOpacity>
                      </TouchableOpacity>
                      {activeCalendarField === 'npopExpiry' && renderCalendarDropdown('npopExpiry')}
                    </View>

                    {/* Document Verification * */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>
                        Document Verification <Text style={{ color: '#DC2626' }}>*</Text>
                      </Text>
                      <TouchableOpacity
                        style={styles.dropdownSelectorBox}
                        onPress={() =>
                          setStep4OpenDropdown(step4OpenDropdown === 'npopDocVerif' ? null : 'npopDocVerif')
                        }
                        activeOpacity={0.8}
                      >
                        <Text style={styles.dropdownSelectorText}>{npopDocVerification}</Text>
                        <ChevronDownIcon size={16} color="#1F2937" />
                      </TouchableOpacity>

                      {step4OpenDropdown === 'npopDocVerif' && (
                        <View style={styles.dropdownMenu}>
                          {(['Select...', 'Verified', 'Could Not Verify', 'Discrepancy Found'] as const).map((opt) => {
                            const isSelected = npopDocVerification === opt;
                            return (
                              <TouchableOpacity
                                key={opt}
                                style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                                onPress={() => {
                                  setNpopDocVerification(opt);
                                  setStep4OpenDropdown(null);
                                }}
                              >
                                <Text style={[styles.dropdownMenuText, isSelected && styles.dropdownMenuTextActive]}>
                                  {opt}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>

                    {/* Verification Notes */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>Verification Notes</Text>
                      <View style={styles.notesTextareaContainer}>
                        <TextInput
                          style={styles.notesTextareaInput}
                          value={npopVerificationNotes}
                          onChangeText={setNpopVerificationNotes}
                          placeholder=""
                          placeholderTextColor="#9CA3AF"
                          multiline
                          textAlignVertical="top"
                        />
                        <View style={styles.resizeHandleWrap}>
                          <ResizeHandleIcon size={12} color="#9CA3AF" />
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </View>
          ) : currentStep === 5 ? (
            /* ─── Step 5: Soil Testing & Soil Report (Screenshot) ─── */
            <View>
              {/* Soil Report Availability * */}
              <View style={styles.formFieldGroup}>
                <Text style={styles.formLabel}>
                  Soil Report Availability <Text style={{ color: '#DC2626' }}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.dropdownSelectorBox}
                  onPress={() => setStep5DropdownOpen(!step5DropdownOpen)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownSelectorText}>{soilReportAvailability}</Text>
                  <SolidTriangleDownIcon size={10} color="#111827" />
                </TouchableOpacity>

                {step5DropdownOpen && (
                  <View style={styles.dropdownMenu}>
                    {(['Select...', 'Available', 'Not Available'] as const).map((opt) => {
                      const isSelected = soilReportAvailability === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                          onPress={() => {
                            setSoilReportAvailability(opt);
                            setStep5DropdownOpen(false);
                          }}
                        >
                          <Text style={[styles.dropdownMenuText, isSelected && styles.dropdownMenuTextActive]}>
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>
          ) : currentStep === 6 ? (
            /* ─── Step 6: Water Source & Water pH Testing (Screenshots 1-5) ─── */
            <View>
              {waterSourcesList.map((entry, idx) => {
                const isCalendarOpen = activeWaterCalendarIndex === idx;

                const isTypeDropdownOpen =
                  step6OpenDropdown?.entryIndex === idx && step6OpenDropdown?.field === 'sourceType';
                const isVerifDropdownOpen =
                  step6OpenDropdown?.entryIndex === idx && step6OpenDropdown?.field === 'verification';
                const isConditionDropdownOpen =
                  step6OpenDropdown?.entryIndex === idx && step6OpenDropdown?.field === 'condition';
                const isMethodDropdownOpen =
                  step6OpenDropdown?.entryIndex === idx && step6OpenDropdown?.field === 'testingMethod';
                const isDeviceDropdownOpen =
                  step6OpenDropdown?.entryIndex === idx && step6OpenDropdown?.field === 'testingDevice';
                const isPhStatusDropdownOpen =
                  step6OpenDropdown?.entryIndex === idx && step6OpenDropdown?.field === 'phStatus';
                const isTestVerifDropdownOpen =
                  step6OpenDropdown?.entryIndex === idx && step6OpenDropdown?.field === 'testVerification';

                return (
                  <View key={entry.id || idx} style={{ marginBottom: 16 }}>
                    {/* Section Header: WATER SOURCE {idx + 1} */}
                    <View style={styles.waterSourceSectionHeaderRow}>
                      <Text style={styles.waterSourceSectionTitle}>WATER SOURCE {idx + 1}</Text>
                      {waterSourcesList.length > 1 && (
                        <TouchableOpacity
                          onPress={() => {
                            setWaterSourcesList((prev) => prev.filter((_, i) => i !== idx));
                          }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#DC2626' }}>Remove</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* 1. Water Source */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>Water Source</Text>
                      <TouchableOpacity
                        style={styles.dropdownSelectorBox}
                        onPress={() => {
                          setStep6OpenDropdown(null);
                          setActiveWaterCalendarIndex(null);
                          setWaterSourceSearchText('');
                          setActiveWaterSourcePickerIndex(idx);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.dropdownSelectorText,
                            entry.sourceName === 'Select...' && { color: '#9CA3AF' },
                          ]}
                        >
                          {entry.sourceName}
                        </Text>
                        <SearchIcon size={18} color="#854F0B" />
                      </TouchableOpacity>
                    </View>

                    {/* 2. Water Source Type */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>Water Source Type</Text>
                      <TouchableOpacity
                        style={styles.dropdownSelectorBox}
                        onPress={() => {
                          setActiveWaterCalendarIndex(null);
                          setStep6OpenDropdown(
                            isTypeDropdownOpen ? null : { entryIndex: idx, field: 'sourceType' }
                          );
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.dropdownSelectorText}>{entry.sourceType}</Text>
                        <ChevronDownIcon size={16} color="#1F2937" />
                      </TouchableOpacity>

                      {isTypeDropdownOpen && (
                        <View style={styles.dropdownMenu}>
                          {['Select...', 'Borewell', 'Open Well', 'Canal', 'River', 'Rainwater Harvesting'].map(
                            (opt) => {
                              const isSelected = entry.sourceType === opt;
                              return (
                                <TouchableOpacity
                                  key={opt}
                                  style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                                  onPress={() => {
                                    setWaterSourcesList((prev) =>
                                      prev.map((item, i) => (i === idx ? { ...item, sourceType: opt } : item))
                                    );
                                    setStep6OpenDropdown(null);
                                  }}
                                >
                                  <Text style={[styles.dropdownMenuText, isSelected && styles.dropdownMenuTextActive]}>
                                    {opt}
                                  </Text>
                                </TouchableOpacity>
                              );
                            }
                          )}
                        </View>
                      )}
                    </View>

                    {/* 3. Water Source Location */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>Water Source Location</Text>
                      <TextInput
                        style={styles.locationInputBox}
                        value={entry.location}
                        onChangeText={(txt) =>
                          setWaterSourcesList((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, location: txt } : item))
                          )
                        }
                        placeholder=""
                        placeholderTextColor="#9CA3AF"
                      />
                      <Text style={styles.locationHelperText}>
                        No location is recorded for this source — enter it if you are authorized to.
                      </Text>
                    </View>

                    {/* 4. Water Use Purpose */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>Water Use Purpose</Text>
                      <TouchableOpacity
                        style={styles.dropdownSelectorBox}
                        onPress={() => {
                          setStep6OpenDropdown(null);
                          setActiveWaterCalendarIndex(null);
                          setPurposeSearchText('');
                          setActivePurposePickerIndex(idx);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.dropdownSelectorText,
                            entry.usePurposes.length === 0 && { color: '#9CA3AF' },
                          ]}
                          numberOfLines={1}
                        >
                          {entry.usePurposes.length > 0 ? entry.usePurposes.join(', ') : 'Select...'}
                        </Text>
                        <SlidersHorizontalIcon size={18} color="#854F0B" />
                      </TouchableOpacity>
                    </View>

                    {/* 5. Water Source Verification */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>Water Source Verification</Text>
                      <TouchableOpacity
                        style={styles.dropdownSelectorBox}
                        onPress={() => {
                          setActiveWaterCalendarIndex(null);
                          setStep6OpenDropdown(
                            isVerifDropdownOpen ? null : { entryIndex: idx, field: 'verification' }
                          );
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.dropdownSelectorText}>{entry.verification}</Text>
                        <ChevronDownIcon size={16} color="#1F2937" />
                      </TouchableOpacity>

                      {isVerifDropdownOpen && (
                        <View style={styles.dropdownMenu}>
                          {['Select...', 'Confirmed On-Site', 'Could Not Confirm'].map((opt) => {
                            const isSelected = entry.verification === opt;
                            return (
                              <TouchableOpacity
                                key={opt}
                                style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                                onPress={() => {
                                  setWaterSourcesList((prev) =>
                                    prev.map((item, i) => (i === idx ? { ...item, verification: opt } : item))
                                  );
                                  setStep6OpenDropdown(null);
                                }}
                              >
                                <Text style={[styles.dropdownMenuText, isSelected && styles.dropdownMenuTextActive]}>
                                  {opt}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>

                    {/* 6. Water Source Condition */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>Water Source Condition</Text>
                      <TouchableOpacity
                        style={styles.dropdownSelectorBox}
                        onPress={() => {
                          setActiveWaterCalendarIndex(null);
                          setStep6OpenDropdown(
                            isConditionDropdownOpen ? null : { entryIndex: idx, field: 'condition' }
                          );
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.dropdownSelectorText}>{entry.condition}</Text>
                        <ChevronDownIcon size={16} color="#1F2937" />
                      </TouchableOpacity>

                      {isConditionDropdownOpen && (
                        <View style={styles.dropdownMenu}>
                          {['Select...', 'Clean', 'Contaminated', 'Needs Maintenance'].map((opt) => {
                            const isSelected = entry.condition === opt;
                            return (
                              <TouchableOpacity
                                key={opt}
                                style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                                onPress={() => {
                                  setWaterSourcesList((prev) =>
                                    prev.map((item, i) => (i === idx ? { ...item, condition: opt } : item))
                                  );
                                  setStep6OpenDropdown(null);
                                }}
                              >
                                <Text style={[styles.dropdownMenuText, isSelected && styles.dropdownMenuTextActive]}>
                                  {opt}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>

                    {/* 7. Test Date */}
                    <View style={[styles.formFieldGroup, isCalendarOpen && { zIndex: 100 }]}>
                      <Text style={styles.formLabel}>Test Date</Text>
                      <TouchableOpacity
                        style={styles.dateInputRow}
                        onPress={() => {
                          setStep6OpenDropdown(null);
                          setActiveWaterCalendarIndex(isCalendarOpen ? null : idx);
                        }}
                        activeOpacity={0.85}
                      >
                        <TextInput
                          style={styles.dateTextInput}
                          value={entry.testDate}
                          onChangeText={(txt) =>
                            setWaterSourcesList((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, testDate: txt } : item))
                            )
                          }
                          placeholder="dd-mm-yyyy"
                          placeholderTextColor="#9CA3AF"
                          onFocus={() => {
                            setStep6OpenDropdown(null);
                            setActiveWaterCalendarIndex(idx);
                          }}
                        />
                        <TouchableOpacity
                          onPress={() => {
                            setStep6OpenDropdown(null);
                            setActiveWaterCalendarIndex(isCalendarOpen ? null : idx);
                          }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          activeOpacity={0.7}
                        >
                          <CalendarIcon size={18} color="#6B7280" />
                        </TouchableOpacity>
                      </TouchableOpacity>
                      {isCalendarOpen && renderWaterCalendarDropdown(idx)}
                    </View>

                    {/* 8. Testing Method */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>Testing Method</Text>
                      <TouchableOpacity
                        style={styles.dropdownSelectorBox}
                        onPress={() => {
                          setActiveWaterCalendarIndex(null);
                          setStep6OpenDropdown(
                            isMethodDropdownOpen ? null : { entryIndex: idx, field: 'testingMethod' }
                          );
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.dropdownSelectorText}>{entry.testingMethod}</Text>
                        <ChevronDownIcon size={16} color="#1F2937" />
                      </TouchableOpacity>

                      {isMethodDropdownOpen && (
                        <View style={styles.dropdownMenu}>
                          {['Select...', 'pH Strip', 'Digital Meter', 'Laboratory Test'].map((opt) => {
                            const isSelected = entry.testingMethod === opt;
                            return (
                              <TouchableOpacity
                                key={opt}
                                style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                                onPress={() => {
                                  setWaterSourcesList((prev) =>
                                    prev.map((item, i) => (i === idx ? { ...item, testingMethod: opt } : item))
                                  );
                                  setStep6OpenDropdown(null);
                                }}
                              >
                                <Text style={[styles.dropdownMenuText, isSelected && styles.dropdownMenuTextActive]}>
                                  {opt}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>

                    {/* 9. Testing Device */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>Testing Device</Text>
                      <TouchableOpacity
                        style={styles.dropdownSelectorBox}
                        onPress={() => {
                          setActiveWaterCalendarIndex(null);
                          setStep6OpenDropdown(
                            isDeviceDropdownOpen ? null : { entryIndex: idx, field: 'testingDevice' }
                          );
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.dropdownSelectorText}>{entry.testingDevice}</Text>
                        <ChevronDownIcon size={16} color="#1F2937" />
                      </TouchableOpacity>

                      {isDeviceDropdownOpen && (
                        <View style={styles.dropdownMenu}>
                          {['Select...', 'Handheld pH Meter', 'Litmus Strips', 'Lab Equipment'].map((opt) => {
                            const isSelected = entry.testingDevice === opt;
                            return (
                              <TouchableOpacity
                                key={opt}
                                style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                                onPress={() => {
                                  setWaterSourcesList((prev) =>
                                    prev.map((item, i) => (i === idx ? { ...item, testingDevice: opt } : item))
                                  );
                                  setStep6OpenDropdown(null);
                                }}
                              >
                                <Text style={[styles.dropdownMenuText, isSelected && styles.dropdownMenuTextActive]}>
                                  {opt}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>

                    {/* 10. Water Test Report */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>Water Test Report</Text>
                      <TouchableOpacity
                        style={styles.dashedUploadBox}
                        onPress={() => {
                          setWaterSourcesList((prev) =>
                            prev.map((item, i) =>
                              i === idx
                                ? { ...item, uploadedReport: `water_test_report_source_${idx + 1}.pdf` }
                                : item
                            )
                          );
                          Alert.alert('Upload File', `File selected: water_test_report_source_${idx + 1}.pdf`);
                        }}
                        activeOpacity={0.7}
                      >
                        <UploadFileIcon size={19} color="#854F0B" />
                        <Text style={styles.dashedUploadText}>
                          {entry.uploadedReport ? entry.uploadedReport : 'Upload file'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* 11. pH Measurement Status * */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>
                        pH Measurement Status <Text style={{ color: '#DC2626' }}>*</Text>
                      </Text>
                      <TouchableOpacity
                        style={styles.dropdownSelectorBox}
                        onPress={() => {
                          setActiveWaterCalendarIndex(null);
                          setStep6OpenDropdown(
                            isPhStatusDropdownOpen ? null : { entryIndex: idx, field: 'phStatus' }
                          );
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.dropdownSelectorText}>{entry.phMeasurementStatus}</Text>
                        <ChevronDownIcon size={16} color="#1F2937" />
                      </TouchableOpacity>

                      {isPhStatusDropdownOpen && (
                        <View style={styles.dropdownMenu}>
                          {['Select...', 'Within Range', 'Out of Range', 'Not Tested'].map((opt) => {
                            const isSelected = entry.phMeasurementStatus === opt;
                            return (
                              <TouchableOpacity
                                key={opt}
                                style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                                onPress={() => {
                                  setWaterSourcesList((prev) =>
                                    prev.map((item, i) => (i === idx ? { ...item, phMeasurementStatus: opt } : item))
                                  );
                                  setStep6OpenDropdown(null);
                                }}
                              >
                                <Text style={[styles.dropdownMenuText, isSelected && styles.dropdownMenuTextActive]}>
                                  {opt}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>

                    {/* 12. Test Verification Status */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>Test Verification Status</Text>
                      <TouchableOpacity
                        style={styles.dropdownSelectorBox}
                        onPress={() => {
                          setActiveWaterCalendarIndex(null);
                          setStep6OpenDropdown(
                            isTestVerifDropdownOpen ? null : { entryIndex: idx, field: 'testVerification' }
                          );
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.dropdownSelectorText}>{entry.testVerificationStatus}</Text>
                        <ChevronDownIcon size={16} color="#1F2937" />
                      </TouchableOpacity>

                      {isTestVerifDropdownOpen && (
                        <View style={styles.dropdownMenu}>
                          {['Select...', 'Verified', 'Could Not Verify'].map((opt) => {
                            const isSelected = entry.testVerificationStatus === opt;
                            return (
                              <TouchableOpacity
                                key={opt}
                                style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                                onPress={() => {
                                  setWaterSourcesList((prev) =>
                                    prev.map((item, i) =>
                                      i === idx ? { ...item, testVerificationStatus: opt } : item
                                    )
                                  );
                                  setStep6OpenDropdown(null);
                                }}
                              >
                                <Text style={[styles.dropdownMenuText, isSelected && styles.dropdownMenuTextActive]}>
                                  {opt}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>

                    {/* 13. Notes */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>Notes</Text>
                      <View style={styles.notesTextareaContainer}>
                        <TextInput
                          style={styles.notesTextareaInput}
                          value={entry.notes}
                          onChangeText={(txt) =>
                            setWaterSourcesList((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, notes: txt } : item))
                            )
                          }
                          placeholder=""
                          placeholderTextColor="#9CA3AF"
                          multiline
                          textAlignVertical="top"
                        />
                        <View style={styles.resizeHandleWrap}>
                          <ResizeHandleIcon size={12} color="#9CA3AF" />
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}

              {/* + Add another water source */}
              <TouchableOpacity
                style={styles.addWaterSourceBtn}
                onPress={() => {
                  setWaterSourcesList((prev) => [
                    ...prev,
                    {
                      id: String(prev.length + 1),
                      sourceName: 'Select...',
                      sourceType: 'Select...',
                      location: '',
                      usePurposes: [],
                      verification: 'Select...',
                      condition: 'Select...',
                      testDate: '',
                      testingMethod: 'Select...',
                      testingDevice: 'Select...',
                      uploadedReport: null,
                      phMeasurementStatus: 'Select...',
                      testVerificationStatus: 'Select...',
                      notes: '',
                    },
                  ]);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.addWaterSourceBtnText}>+ Add another water source</Text>
              </TouchableOpacity>
            </View>
          ) : currentStep === 7 ? (
            /* ─── Step 7: Farm Practices Checklist (Screenshots 1-5) ─── */
            <View>
              {STEP7_SECTIONS_CONFIG.map((sec, secIndex) => {
                const data = step7Data[sec.key];
                const isDropdownOpen = step7OpenDropdown === sec.key;

                return (
                  <View key={sec.key} style={{ marginTop: secIndex === 0 ? 2 : 20 }}>
                    {/* Section Title */}
                    <Text style={styles.step7SectionHeader}>{sec.title}</Text>

                    {/* Inspection Result * */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>
                        Inspection Result <Text style={{ color: '#DC2626' }}>*</Text>
                      </Text>
                      <TouchableOpacity
                        style={styles.dropdownSelectorBox}
                        onPress={() => {
                          setStep7OpenDropdown(isDropdownOpen ? null : sec.key);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.dropdownSelectorText}>{data.inspectionResult}</Text>
                        <ChevronDownIcon size={16} color="#111827" />
                      </TouchableOpacity>

                      {isDropdownOpen && (
                        <View style={styles.step7DropdownMenu}>
                          {STEP7_INSPECTION_RESULTS.map((opt) => {
                            const isSelected = data.inspectionResult === opt;
                            return (
                              <TouchableOpacity
                                key={opt}
                                style={[
                                  styles.step7DropdownMenuItem,
                                  isSelected && styles.step7DropdownMenuItemActive,
                                ]}
                                onPress={() => {
                                  setStep7Data((prev) => ({
                                    ...prev,
                                    [sec.key]: { ...prev[sec.key], inspectionResult: opt },
                                  }));
                                  setStep7OpenDropdown(null);
                                }}
                              >
                                <Text
                                  style={[
                                    styles.step7DropdownMenuText,
                                    isSelected && styles.step7DropdownMenuTextActive,
                                  ]}
                                >
                                  {opt}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>

                    {/* Notes */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>Notes</Text>
                      <View style={styles.notesTextareaContainer}>
                        <TextInput
                          style={styles.notesTextareaInput}
                          value={data.notes}
                          onChangeText={(txt) => {
                            setStep7Data((prev) => ({
                              ...prev,
                              [sec.key]: { ...prev[sec.key], notes: txt },
                            }));
                          }}
                          placeholder=""
                          placeholderTextColor="#9CA3AF"
                          multiline
                          textAlignVertical="top"
                        />
                        <View style={styles.resizeHandleWrap}>
                          <ResizeHandleIcon size={12} color="#9CA3AF" />
                        </View>
                      </View>
                    </View>

                    {/* Evidence (existing) */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>Evidence (existing)</Text>
                      <TouchableOpacity
                        style={styles.step7SearchBox}
                        onPress={() => {
                          setStep7EvidenceModalSection(sec.key);
                          setStep7EvidenceSearchText('');
                        }}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.dropdownSelectorText,
                            (!data.evidence || data.evidence === 'Select...') && {
                              color: '#9CA3AF',
                              fontWeight: '400',
                            },
                          ]}
                        >
                          {data.evidence || 'Select...'}
                        </Text>
                        <SearchIcon size={17} color="#854F0B" />
                      </TouchableOpacity>
                    </View>

                    {/* Upload evidence */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>Upload evidence</Text>
                      {data.uploadedFile ? (
                        <View style={styles.uploadedFileCard}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                            <FileTextIcon size={18} color="#854F0B" />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.uploadedFileName} numberOfLines={1}>
                                {data.uploadedFile.name}
                              </Text>
                              <Text style={styles.uploadedFileSize}>{data.uploadedFile.size}</Text>
                            </View>
                          </View>
                          <TouchableOpacity
                            onPress={() => {
                              setStep7Data((prev) => ({
                                ...prev,
                                [sec.key]: { ...prev[sec.key], uploadedFile: null },
                              }));
                            }}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <CloseXIcon size={16} color="#DC2626" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.uploadEvidenceDashedBox}
                          onPress={() => {
                            const defaultName = `${sec.title.toLowerCase().replace(/\s+/g, '_')}_evidence.pdf`;
                            setStep7Data((prev) => ({
                              ...prev,
                              [sec.key]: {
                                ...prev[sec.key],
                                uploadedFile: { name: defaultName, size: '1.2 MB' },
                              },
                            }));
                            Alert.alert('File Uploaded', `${defaultName} attached successfully.`);
                          }}
                          activeOpacity={0.75}
                        >
                          <UploadFileIcon size={19} color="#854F0B" />
                          <Text style={styles.uploadEvidenceText}>Upload file</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : currentStep === 8 ? (
            /* ─── Step 8: Documents & Evidence (Screenshots 1 to 5) ─── */
            <View>
              {/* Existing documents & evidence */}
              <Text style={styles.step8SectionHeader}>Existing documents & evidence</Text>

              {/* FMB Sketch Card */}
              <View style={styles.step8DocCard}>
                <View style={styles.step8DocCardLeft}>
                  <FileTextIcon size={20} color="#854F0B" />
                  <View>
                    <Text style={styles.step8DocTitle}>FMB Sketch</Text>
                    <Text style={styles.step8DocSub}>On file</Text>
                  </View>
                </View>
                <View style={styles.step8DocActionsRow}>
                  <TouchableOpacity
                    style={styles.step8DocActionBtn}
                    onPress={() => {
                      setCertPdfModalDoc({
                        title: 'FMB Sketch Survey Document',
                        fileName: 'FMB_Sketch_Survey_42_Nilgiris.pdf',
                        certNumber: 'FMB-2026-NIL-42',
                        validThrough: 'Permanent Record',
                        agency: 'Dept of Survey & Land Records, TN',
                      });
                    }}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.step8DocActionBtnText}>View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.step8DocActionBtn}
                    onPress={() => {
                      Alert.alert(
                        'Download Complete',
                        'FMB_Sketch_Survey_42_Nilgiris.pdf downloaded successfully to your device storage.'
                      );
                    }}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.step8DocActionBtnText}>Download</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* PGS Organic Certificate Card */}
              <View style={styles.step8DocCard}>
                <View style={styles.step8DocCardLeft}>
                  <FileTextIcon size={20} color="#854F0B" />
                  <View>
                    <Text style={styles.step8DocTitle}>PGS Organic Certificate</Text>
                    <Text style={styles.step8DocSub}>On file</Text>
                  </View>
                </View>
                <View style={styles.step8DocActionsRow}>
                  <TouchableOpacity
                    style={styles.step8DocActionBtn}
                    onPress={() => {
                      setCertPdfModalDoc({
                        title: 'PGS Organic Certificate',
                        fileName: 'PGS_India_Green_Certificate_2026.pdf',
                        certNumber: 'PGS-IND-2026-0892',
                        validThrough: '31-12-2027',
                        agency: 'PGS-India Regional Council',
                      });
                    }}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.step8DocActionBtnText}>View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.step8DocActionBtn}
                    onPress={() => {
                      Alert.alert(
                        'Download Complete',
                        'PGS_India_Green_Certificate_2026.pdf downloaded successfully to your device storage.'
                      );
                    }}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.step8DocActionBtnText}>Download</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Add evidence Header */}
              <Text style={[styles.step8SectionHeader, { marginTop: 18 }]}>Add evidence</Text>

              {/* Evidence Entries List */}
              {step8EvidenceList.map((entry, idx) => {
                const isCatOpen =
                  step8OpenDropdown?.entryIndex === idx && step8OpenDropdown.field === 'category';
                const isDocTypeOpen =
                  step8OpenDropdown?.entryIndex === idx && step8OpenDropdown.field === 'documentType';
                const isVerifOpen =
                  step8OpenDropdown?.entryIndex === idx && step8OpenDropdown.field === 'verificationStatus';
                const isMissingOpen =
                  step8OpenDropdown?.entryIndex === idx && step8OpenDropdown.field === 'missingReason';

                return (
                  <View key={entry.id} style={idx > 0 ? styles.step8SubsequentEntryBox : undefined}>
                    {step8EvidenceList.length > 1 && (
                      <View style={styles.step8EntryHeaderRow}>
                        <Text style={styles.step8EntryHeaderTitle}>Evidence #{idx + 1}</Text>
                        <TouchableOpacity
                          onPress={() => {
                            setStep8EvidenceList((prev) => prev.filter((_, i) => i !== idx));
                          }}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Text style={styles.step8RemoveText}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Field 1: Evidence Category * */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>
                        Evidence Category <Text style={{ color: '#DC2626' }}>*</Text>
                      </Text>
                      <TouchableOpacity
                        style={styles.dropdownSelectorBox}
                        onPress={() => {
                          setStep8OpenDropdown(
                            isCatOpen ? null : { entryIndex: idx, field: 'category' }
                          );
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.dropdownSelectorText}>{entry.category}</Text>
                        <ChevronDownIcon size={16} color="#111827" />
                      </TouchableOpacity>

                      {isCatOpen && (
                        <View style={styles.step7DropdownMenu}>
                          {STEP8_EVIDENCE_CATEGORIES.map((opt) => {
                            const isSelected = entry.category === opt;
                            return (
                              <TouchableOpacity
                                key={opt}
                                style={[
                                  styles.step7DropdownMenuItem,
                                  isSelected && styles.step7DropdownMenuItemActive,
                                ]}
                                onPress={() => {
                                  setStep8EvidenceList((prev) =>
                                    prev.map((item, i) =>
                                      i === idx ? { ...item, category: opt } : item
                                    )
                                  );
                                  setStep8OpenDropdown(null);
                                }}
                              >
                                <Text
                                  style={[
                                    styles.step7DropdownMenuText,
                                    isSelected && styles.step7DropdownMenuTextActive,
                                  ]}
                                >
                                  {opt}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>

                    {/* Field 2: Related Inspection Section * */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>
                        Related Inspection Section <Text style={{ color: '#DC2626' }}>*</Text>
                      </Text>
                      <TouchableOpacity
                        style={styles.step7SearchBox}
                        onPress={() => {
                          setStep8RelatedModalIndex(idx);
                          setStep8RelatedSearchText('');
                        }}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.dropdownSelectorText,
                            (!entry.relatedSection || entry.relatedSection === 'Select...') && {
                              color: '#9CA3AF',
                              fontWeight: '400',
                            },
                          ]}
                        >
                          {entry.relatedSection || 'Select...'}
                        </Text>
                        <SearchIcon size={17} color="#854F0B" />
                      </TouchableOpacity>
                    </View>

                    {/* Field 3: Document Type */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>Document Type</Text>
                      <TouchableOpacity
                        style={styles.dropdownSelectorBox}
                        onPress={() => {
                          setStep8OpenDropdown(
                            isDocTypeOpen ? null : { entryIndex: idx, field: 'documentType' }
                          );
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.dropdownSelectorText}>{entry.documentType}</Text>
                        <ChevronDownIcon size={16} color="#111827" />
                      </TouchableOpacity>

                      {isDocTypeOpen && (
                        <View style={styles.step7DropdownMenu}>
                          {STEP8_DOCUMENT_TYPES.map((opt) => {
                            const isSelected = entry.documentType === opt;
                            return (
                              <TouchableOpacity
                                key={opt}
                                style={[
                                  styles.step7DropdownMenuItem,
                                  isSelected && styles.step7DropdownMenuItemActive,
                                ]}
                                onPress={() => {
                                  setStep8EvidenceList((prev) =>
                                    prev.map((item, i) =>
                                      i === idx ? { ...item, documentType: opt } : item
                                    )
                                  );
                                  setStep8OpenDropdown(null);
                                }}
                              >
                                <Text
                                  style={[
                                    styles.step7DropdownMenuText,
                                    isSelected && styles.step7DropdownMenuTextActive,
                                  ]}
                                >
                                  {opt}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>

                    {/* Field 4: Evidence File */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>Evidence File</Text>
                      {entry.uploadedFile ? (
                        <View style={styles.uploadedFileCard}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                            <FileTextIcon size={18} color="#854F0B" />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.uploadedFileName} numberOfLines={1}>
                                {entry.uploadedFile.name}
                              </Text>
                              <Text style={styles.uploadedFileSize}>{entry.uploadedFile.size}</Text>
                            </View>
                          </View>
                          <TouchableOpacity
                            onPress={() => {
                              setStep8EvidenceList((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, uploadedFile: null } : item
                                )
                              );
                            }}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <CloseXIcon size={16} color="#DC2626" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.uploadEvidenceDashedBox}
                          onPress={() => {
                            const defaultName = `evidence_doc_${idx + 1}.pdf`;
                            setStep8EvidenceList((prev) =>
                              prev.map((item, i) =>
                                i === idx
                                  ? {
                                      ...item,
                                      uploadedFile: { name: defaultName, size: '2.1 MB' },
                                    }
                                  : item
                              )
                            );
                            Alert.alert('File Uploaded', `${defaultName} attached successfully.`);
                          }}
                          activeOpacity={0.75}
                        >
                          <UploadFileIcon size={19} color="#854F0B" />
                          <Text style={styles.uploadEvidenceText}>Upload file</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Field 5: Evidence Verification Status */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>Evidence Verification Status</Text>
                      <TouchableOpacity
                        style={styles.dropdownSelectorBox}
                        onPress={() => {
                          setStep8OpenDropdown(
                            isVerifOpen ? null : { entryIndex: idx, field: 'verificationStatus' }
                          );
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.dropdownSelectorText}>{entry.verificationStatus}</Text>
                        <ChevronDownIcon size={16} color="#111827" />
                      </TouchableOpacity>

                      {isVerifOpen && (
                        <View style={styles.step7DropdownMenu}>
                          {STEP8_VERIFICATION_STATUSES.map((opt) => {
                            const isSelected = entry.verificationStatus === opt;
                            return (
                              <TouchableOpacity
                                key={opt}
                                style={[
                                  styles.step7DropdownMenuItem,
                                  isSelected && styles.step7DropdownMenuItemActive,
                                ]}
                                onPress={() => {
                                  setStep8EvidenceList((prev) =>
                                    prev.map((item, i) =>
                                      i === idx ? { ...item, verificationStatus: opt } : item
                                    )
                                  );
                                  setStep8OpenDropdown(null);
                                }}
                              >
                                <Text
                                  style={[
                                    styles.step7DropdownMenuText,
                                    isSelected && styles.step7DropdownMenuTextActive,
                                  ]}
                                >
                                  {opt}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>

                    {/* Field 6: Missing Document Reason * */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>
                        Missing Document Reason <Text style={{ color: '#DC2626' }}>*</Text>
                      </Text>
                      <TouchableOpacity
                        style={styles.dropdownSelectorBox}
                        onPress={() => {
                          setStep8OpenDropdown(
                            isMissingOpen ? null : { entryIndex: idx, field: 'missingReason' }
                          );
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.dropdownSelectorText}>{entry.missingReason}</Text>
                        <ChevronDownIcon size={16} color="#111827" />
                      </TouchableOpacity>

                      {isMissingOpen && (
                        <View style={styles.step7DropdownMenu}>
                          {STEP8_MISSING_REASONS.map((opt) => {
                            const isSelected = entry.missingReason === opt;
                            return (
                              <TouchableOpacity
                                key={opt}
                                style={[
                                  styles.step7DropdownMenuItem,
                                  isSelected && styles.step7DropdownMenuItemActive,
                                ]}
                                onPress={() => {
                                  setStep8EvidenceList((prev) =>
                                    prev.map((item, i) =>
                                      i === idx ? { ...item, missingReason: opt } : item
                                    )
                                  );
                                  setStep8OpenDropdown(null);
                                }}
                              >
                                <Text
                                  style={[
                                    styles.step7DropdownMenuText,
                                    isSelected && styles.step7DropdownMenuTextActive,
                                  ]}
                                >
                                  {opt}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>

                    {/* Field 7: Notes */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>Notes</Text>
                      <View style={styles.notesTextareaContainer}>
                        <TextInput
                          style={styles.notesTextareaInput}
                          value={entry.notes}
                          onChangeText={(txt) => {
                            setStep8EvidenceList((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, notes: txt } : item
                              )
                            );
                          }}
                          placeholder=""
                          placeholderTextColor="#9CA3AF"
                          multiline
                          textAlignVertical="top"
                        />
                        <View style={styles.resizeHandleWrap}>
                          <ResizeHandleIcon size={12} color="#9CA3AF" />
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}

              {/* + Add Evidence Button */}
              <TouchableOpacity
                style={styles.step8AddEvidenceBtn}
                onPress={() => {
                  setStep8EvidenceList((prev) => [
                    ...prev,
                    {
                      id: String(Date.now()),
                      category: 'Select...',
                      relatedSection: 'Select...',
                      documentType: 'Select...',
                      uploadedFile: null,
                      verificationStatus: 'Select...',
                      missingReason: 'Select...',
                      notes: '',
                    },
                  ]);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.step8AddEvidenceBtnText}>+ Add Evidence</Text>
              </TouchableOpacity>
            </View>
          ) : currentStep === 9 ? (
            /* ─── Step 9: Inspection Observations & Findings (Screenshots 1 to 5) ─── */
            <View>
              {/* Header */}
              <Text style={styles.step8SectionHeader}>Add a supporting observation</Text>

              {/* Info Banner */}
              <View style={styles.step9InfoBanner}>
                <InfoIcon size={18} color="#854F0B" />
                <Text style={styles.step9InfoBannerText}>
                  These are Farmer Admin supporting observations. They are kept separate from the official audit findings.
                </Text>
              </View>

              {/* Observation Entries List */}
              {step9ObservationsList.map((entry, idx) => {
                const isCatOpen =
                  step9OpenDropdown?.entryIndex === idx && step9OpenDropdown.field === 'category';
                const isRecOpen =
                  step9OpenDropdown?.entryIndex === idx && step9OpenDropdown.field === 'recommendation';
                const isFollowUpOpen =
                  step9OpenDropdown?.entryIndex === idx && step9OpenDropdown.field === 'followUp';

                return (
                  <View key={entry.id} style={idx > 0 ? styles.step8SubsequentEntryBox : { marginTop: 14 }}>
                    {step9ObservationsList.length > 1 && (
                      <View style={styles.step8EntryHeaderRow}>
                        <Text style={styles.step8EntryHeaderTitle}>Observation #{idx + 1}</Text>
                        <TouchableOpacity
                          onPress={() => {
                            setStep9ObservationsList((prev) => prev.filter((_, i) => i !== idx));
                          }}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Text style={styles.step8RemoveText}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Field 1: Related Section * */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>
                        Related Section <Text style={{ color: '#DC2626' }}>*</Text>
                      </Text>
                      <TouchableOpacity
                        style={styles.step7SearchBox}
                        onPress={() => {
                          setStep9RelatedModalIndex(idx);
                          setStep9RelatedSearchText('');
                        }}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.dropdownSelectorText,
                            (!entry.relatedSection || entry.relatedSection === 'Select...') && {
                              color: '#9CA3AF',
                              fontWeight: '400',
                            },
                          ]}
                        >
                          {entry.relatedSection || 'Select...'}
                        </Text>
                        <SearchIcon size={17} color="#854F0B" />
                      </TouchableOpacity>
                    </View>

                    {/* Field 2: Observation Category * */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>
                        Observation Category <Text style={{ color: '#DC2626' }}>*</Text>
                      </Text>
                      <TouchableOpacity
                        style={styles.dropdownSelectorBox}
                        onPress={() => {
                          setStep9OpenDropdown(
                            isCatOpen ? null : { entryIndex: idx, field: 'category' }
                          );
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.dropdownSelectorText}>{entry.category}</Text>
                        <ChevronDownIcon size={16} color="#111827" />
                      </TouchableOpacity>

                      {isCatOpen && (
                        <View style={styles.step7DropdownMenu}>
                          {STEP9_OBSERVATION_CATEGORIES.map((opt) => {
                            const isSelected = entry.category === opt;
                            return (
                              <TouchableOpacity
                                key={opt}
                                style={[
                                  styles.step7DropdownMenuItem,
                                  isSelected && styles.step7DropdownMenuItemActive,
                                ]}
                                onPress={() => {
                                  setStep9ObservationsList((prev) =>
                                    prev.map((item, i) =>
                                      i === idx ? { ...item, category: opt } : item
                                    )
                                  );
                                  setStep9OpenDropdown(null);
                                }}
                              >
                                <Text
                                  style={[
                                    styles.step7DropdownMenuText,
                                    isSelected && styles.step7DropdownMenuTextActive,
                                  ]}
                                >
                                  {opt}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>

                    {/* Field 3: Observation * */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>
                        Observation <Text style={{ color: '#DC2626' }}>*</Text>
                      </Text>
                      <View style={styles.notesTextareaContainer}>
                        <TextInput
                          style={styles.notesTextareaInput}
                          value={entry.observation}
                          onChangeText={(txt) => {
                            setStep9ObservationsList((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, observation: txt } : item
                              )
                            );
                          }}
                          placeholder=""
                          placeholderTextColor="#9CA3AF"
                          multiline
                          textAlignVertical="top"
                        />
                        <View style={styles.resizeHandleWrap}>
                          <ResizeHandleIcon size={12} color="#9CA3AF" />
                        </View>
                      </View>
                    </View>

                    {/* Field 4: Follow-up Recommendation */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>Follow-up Recommendation</Text>
                      <TouchableOpacity
                        style={styles.dropdownSelectorBox}
                        onPress={() => {
                          setStep9OpenDropdown(
                            isRecOpen ? null : { entryIndex: idx, field: 'recommendation' }
                          );
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.dropdownSelectorText}>{entry.followUpRecommendation}</Text>
                        <ChevronDownIcon size={16} color="#111827" />
                      </TouchableOpacity>

                      {isRecOpen && (
                        <View style={styles.step7DropdownMenu}>
                          {STEP9_FOLLOWUP_RECOMMENDATIONS.map((opt) => {
                            const isSelected = entry.followUpRecommendation === opt;
                            return (
                              <TouchableOpacity
                                key={opt}
                                style={[
                                  styles.step7DropdownMenuItem,
                                  isSelected && styles.step7DropdownMenuItemActive,
                                ]}
                                onPress={() => {
                                  setStep9ObservationsList((prev) =>
                                    prev.map((item, i) =>
                                      i === idx ? { ...item, followUpRecommendation: opt } : item
                                    )
                                  );
                                  setStep9OpenDropdown(null);
                                }}
                              >
                                <Text
                                  style={[
                                    styles.step7DropdownMenuText,
                                    isSelected && styles.step7DropdownMenuTextActive,
                                  ]}
                                >
                                  {opt}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>

                    {/* Field 5: Recommendation Notes (optional) */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>Recommendation Notes (optional)</Text>
                      <View style={styles.notesTextareaContainer}>
                        <TextInput
                          style={styles.notesTextareaInput}
                          value={entry.recommendationNotes}
                          onChangeText={(txt) => {
                            setStep9ObservationsList((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, recommendationNotes: txt } : item
                              )
                            );
                          }}
                          placeholder=""
                          placeholderTextColor="#9CA3AF"
                          multiline
                          textAlignVertical="top"
                        />
                        <View style={styles.resizeHandleWrap}>
                          <ResizeHandleIcon size={12} color="#9CA3AF" />
                        </View>
                      </View>
                    </View>

                    {/* Field 6: Evidence Reference */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>Evidence Reference</Text>
                      <TouchableOpacity
                        style={styles.step7SearchBox}
                        onPress={() => {
                          setStep9EvidenceRefModalIndex(idx);
                          setStep9EvidenceRefSearchText('');
                        }}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.dropdownSelectorText,
                            (!entry.evidenceReference || entry.evidenceReference === 'Select...') && {
                              color: '#9CA3AF',
                              fontWeight: '400',
                            },
                          ]}
                        >
                          {entry.evidenceReference || 'Select...'}
                        </Text>
                        <SearchIcon size={17} color="#854F0B" />
                      </TouchableOpacity>
                    </View>

                    {/* Field 7: Follow-up Required (Yes / No) */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>Follow-up Required</Text>
                      <TouchableOpacity
                        style={styles.dropdownSelectorBox}
                        onPress={() => {
                          setStep9OpenDropdown(
                            isFollowUpOpen ? null : { entryIndex: idx, field: 'followUp' }
                          );
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.dropdownSelectorText}>{entry.followUpRequired}</Text>
                        <ChevronDownIcon size={16} color="#111827" />
                      </TouchableOpacity>

                      {isFollowUpOpen && (
                        <View style={styles.step7DropdownMenu}>
                          {STEP9_FOLLOWUP_REQUIRED_OPTIONS.map((opt) => {
                            const isSelected = entry.followUpRequired === opt;
                            return (
                              <TouchableOpacity
                                key={opt}
                                style={[
                                  styles.step7DropdownMenuItem,
                                  isSelected && styles.step7DropdownMenuItemActive,
                                ]}
                                onPress={() => {
                                  setStep9ObservationsList((prev) =>
                                    prev.map((item, i) =>
                                      i === idx ? { ...item, followUpRequired: opt } : item
                                    )
                                  );
                                  setStep9OpenDropdown(null);
                                }}
                              >
                                <Text
                                  style={[
                                    styles.step7DropdownMenuText,
                                    isSelected && styles.step7DropdownMenuTextActive,
                                  ]}
                                >
                                  {opt}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}

              {/* + Add Observation Button */}
              <TouchableOpacity
                style={styles.step8AddEvidenceBtn}
                onPress={() => {
                  setStep9ObservationsList((prev) => [
                    ...prev,
                    {
                      id: String(Date.now()),
                      relatedSection: 'Select...',
                      category: 'Select...',
                      observation: '',
                      followUpRecommendation: 'Select...',
                      recommendationNotes: '',
                      evidenceReference: 'Select...',
                      followUpRequired: 'Select...',
                    },
                  ]);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.step8AddEvidenceBtnText}>+ Add Observation</Text>
              </TouchableOpacity>

              {/* Status Hint */}
              <Text style={styles.step9EmptyHint}>
                {step9ObservationsList.length === 1 && !step9ObservationsList[0]?.observation
                  ? 'No supporting observations added yet.'
                  : `${step9ObservationsList.length} supporting observation(s) added.`}
              </Text>

              {/* Official audit findings (read-only) */}
              <Text style={[styles.step8SectionHeader, { marginTop: 18 }]}>
                Official audit findings (read-only)
              </Text>

              <View style={styles.step9FindingCard}>
                <Text style={styles.step9FindingText}>No official findings recorded yet</Text>
              </View>

              <View style={styles.step9NoticeCard}>
                <ProhibitedIcon size={18} color="#6B7280" />
                <Text style={styles.step9NoticeText}>
                  Official findings, severity, status, red-flag state and audit completion are set by the authorized audit workflow. Farmer Admin cannot change them.
                </Text>
              </View>
            </View>
          ) : currentStep === 10 ? (
            /* ─── Step 10: Farmer Admin Assessment (Screenshots 1 to 5) ─── */
            <View>
              {/* Field 1: Overall Assessment * */}
              <View style={styles.formFieldGroup}>
                <Text style={styles.formLabel}>
                  Overall Assessment <Text style={{ color: '#DC2626' }}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.dropdownSelectorBox}
                  onPress={() =>
                    setStep10OpenDropdown(step10OpenDropdown === 'overall' ? null : 'overall')
                  }
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.dropdownSelectorText,
                      step10OverallAssessment === 'Select...' && { color: '#9CA3AF', fontWeight: '400' },
                    ]}
                  >
                    {step10OverallAssessment}
                  </Text>
                  <ChevronDownIcon size={16} color="#111827" />
                </TouchableOpacity>

                {step10OpenDropdown === 'overall' && (
                  <View style={styles.step7DropdownMenu}>
                    {STEP10_OVERALL_ASSESSMENT_OPTIONS.map((opt) => {
                      const isSelected = step10OverallAssessment === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[
                            styles.step7DropdownMenuItem,
                            isSelected && styles.step7DropdownMenuItemActive,
                          ]}
                          onPress={() => {
                            setStep10OverallAssessment(opt);
                            setStep10OpenDropdown(null);
                          }}
                        >
                          <Text
                            style={[
                              styles.step7DropdownMenuText,
                              isSelected && styles.step7DropdownMenuTextActive,
                            ]}
                          >
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Field 2: Strengths Observed */}
              <View style={styles.formFieldGroup}>
                <Text style={styles.formLabel}>Strengths Observed</Text>
                <View style={styles.notesTextareaContainer}>
                  <TextInput
                    style={styles.notesTextareaInput}
                    value={step10StrengthsObserved}
                    onChangeText={setStep10StrengthsObserved}
                    placeholder=""
                    placeholderTextColor="#9CA3AF"
                    multiline
                    textAlignVertical="top"
                  />
                  <View style={styles.resizeHandleWrap}>
                    <ResizeHandleIcon size={12} color="#9CA3AF" />
                  </View>
                </View>
              </View>

              {/* Field 3: Follow-up Required */}
              <View style={styles.formFieldGroup}>
                <Text style={styles.formLabel}>Follow-up Required</Text>
                <TouchableOpacity
                  style={styles.dropdownSelectorBox}
                  onPress={() =>
                    setStep10OpenDropdown(step10OpenDropdown === 'followUp' ? null : 'followUp')
                  }
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.dropdownSelectorText,
                      step10FollowUpRequired === 'Select...' && { color: '#9CA3AF', fontWeight: '400' },
                    ]}
                  >
                    {step10FollowUpRequired}
                  </Text>
                  <ChevronDownIcon size={16} color="#111827" />
                </TouchableOpacity>

                {step10OpenDropdown === 'followUp' && (
                  <View style={styles.step7DropdownMenu}>
                    {STEP10_FOLLOWUP_REQUIRED_OPTIONS.map((opt) => {
                      const isSelected = step10FollowUpRequired === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[
                            styles.step7DropdownMenuItem,
                            isSelected && styles.step7DropdownMenuItemActive,
                          ]}
                          onPress={() => {
                            setStep10FollowUpRequired(opt);
                            setStep10OpenDropdown(null);
                          }}
                        >
                          <Text
                            style={[
                              styles.step7DropdownMenuText,
                              isSelected && styles.step7DropdownMenuTextActive,
                            ]}
                          >
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Field 4: Recommendation */}
              <View style={styles.formFieldGroup}>
                <Text style={styles.formLabel}>Recommendation</Text>
                <TouchableOpacity
                  style={styles.dropdownSelectorBox}
                  onPress={() =>
                    setStep10OpenDropdown(step10OpenDropdown === 'recommendation' ? null : 'recommendation')
                  }
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.dropdownSelectorText,
                      step10Recommendation === 'Select...' && { color: '#9CA3AF', fontWeight: '400' },
                    ]}
                  >
                    {step10Recommendation}
                  </Text>
                  <ChevronDownIcon size={16} color="#111827" />
                </TouchableOpacity>

                {step10OpenDropdown === 'recommendation' && (
                  <View style={styles.step7DropdownMenu}>
                    {STEP10_RECOMMENDATION_OPTIONS.map((opt) => {
                      const isSelected = step10Recommendation === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[
                            styles.step7DropdownMenuItem,
                            isSelected && styles.step7DropdownMenuItemActive,
                          ]}
                          onPress={() => {
                            setStep10Recommendation(opt);
                            setStep10OpenDropdown(null);
                          }}
                        >
                          <Text
                            style={[
                              styles.step7DropdownMenuText,
                              isSelected && styles.step7DropdownMenuTextActive,
                            ]}
                          >
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Field 5: Supporting Remarks */}
              <View style={styles.formFieldGroup}>
                <Text style={styles.formLabel}>Supporting Remarks</Text>
                <View style={styles.notesTextareaContainer}>
                  <TextInput
                    style={styles.notesTextareaInput}
                    value={step10SupportingRemarks}
                    onChangeText={setStep10SupportingRemarks}
                    placeholder=""
                    placeholderTextColor="#9CA3AF"
                    multiline
                    textAlignVertical="top"
                  />
                  <View style={styles.resizeHandleWrap}>
                    <ResizeHandleIcon size={12} color="#9CA3AF" />
                  </View>
                </View>
              </View>

              {/* Field 6: Official Audit Score (Locked) */}
              <View style={styles.formFieldGroup}>
                <View style={styles.labelWithLockRow}>
                  <Text style={styles.formLabel}>Official Audit Score</Text>
                  <LockIcon size={13} color="#854F0B" />
                </View>
                <View style={styles.step10ScoreCard}>
                  <Text style={styles.step10ScoreText}>Not scored yet</Text>
                </View>
                <Text style={styles.step10ScoreCaption}>
                  Audit Rating (max 100) is separate from the Farm Rating module and cannot be edited here.
                </Text>
              </View>
            </View>
          ) : (
            /* ─── Step 11: Farmer Rating (Screenshots 1 to 4) ─── */
            <View>
              {/* Breadcrumb path */}
              <Text style={styles.step11Breadcrumb}>Audit Inspection → Farmer Rating</Text>

              {/* Top Reference Card */}
              <View style={styles.step11MetaGridCard}>
                <View style={styles.step11MetaGridRow}>
                  <View style={styles.step11MetaGridCol}>
                    <Text style={styles.step11MetaLabel}>Audit</Text>
                    <Text style={styles.step11MetaValue}>{selectedRecord.id}</Text>
                  </View>
                  <View style={styles.step11MetaGridCol}>
                    <Text style={styles.step11MetaLabel}>Audit Date</Text>
                    <Text style={styles.step11MetaValue}>{selectedRecord.date}</Text>
                  </View>
                </View>

                <View style={[styles.step11MetaGridRow, { marginTop: 12 }]}>
                  <View style={styles.step11MetaGridCol}>
                    <Text style={styles.step11MetaLabel}>Farmer</Text>
                    <Text style={styles.step11MetaValue}>{selectedRecord.farmerName}</Text>
                  </View>
                  <View style={styles.step11MetaGridCol}>
                    <Text style={styles.step11MetaLabel}>Farmer ID</Text>
                    <Text style={styles.step11MetaValue}>{selectedRecord.farmerId || 'FMR-00124'}</Text>
                  </View>
                </View>

                <View style={[styles.step11MetaGridRow, { marginTop: 12 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.step11MetaLabel}>Farm</Text>
                    <Text style={styles.step11MetaValue}>
                      {selectedRecord.farm} · Coonoor, Nilgiris
                    </Text>
                  </View>
                </View>
              </View>

              {/* OVERALL RATING Card */}
              <View style={styles.step11OverallCard}>
                <Text style={styles.step11OverallTitle}>OVERALL RATING</Text>
                <Text style={[styles.step11OverallScoreText, step11RatedCount === 10 && { color: THEME.brandOrange }]}>
                  {step11RatedCount === 10 ? `${step11TotalScore} / 100` : 'Pending'}
                </Text>
                <Text style={styles.step11OverallSubtext}>
                  {step11RatedCount === 10
                    ? 'All 10 categories rated. Previous overall: 68 / 100.'
                    : `${step11RatedCount} of 10 categories rated — the overall score appears once all 10 are rated. Previous overall: 68 / 100.`}
                </Text>
                <Text style={styles.step11OverallSubtext2}>
                  Overall = the sum of the category scores. No weights, penalties or thresholds are applied.
                </Text>
              </View>

              {/* Section Header */}
              <Text style={styles.step8SectionHeader}>Rating categories</Text>

              {/* 10 Category Cards */}
              {STEP11_RATING_CATEGORIES.map((cat) => {
                const score = step11Scores[cat.id];
                const isExpanded = step11ExpandedCategory === cat.id;

                const renderCategoryIcon = (iconName: Step11RatingCategory['iconName']) => {
                  switch (iconName) {
                    case 'verified':
                      return <VerifiedBadgeIcon size={18} color="#854F0B" />;
                    case 'layers':
                      return <LayersIcon size={18} color="#854F0B" />;
                    case 'tractor':
                      return <TractorIcon size={18} color="#854F0B" />;
                    case 'leaf':
                      return <LeafIcon size={18} color="#854F0B" />;
                    case 'fruit':
                      return <ProduceFruitIcon size={18} color="#854F0B" />;
                    case 'qr':
                      return <QrCodeIcon size={18} color="#854F0B" />;
                    case 'users':
                      return <UsersIcon size={18} color="#854F0B" />;
                    case 'landmark':
                      return <LandmarkIcon size={18} color="#854F0B" />;
                    case 'store':
                      return <StoreIcon size={18} color="#854F0B" />;
                    case 'lightbulb':
                      return <LightbulbIcon size={18} color="#854F0B" />;
                    default:
                      return <VerifiedBadgeIcon size={18} color="#854F0B" />;
                  }
                };

                return (
                  <View key={cat.id} style={styles.step11CategoryCard}>
                    <TouchableOpacity
                      style={styles.step11CategoryHeader}
                      onPress={() =>
                        setStep11ExpandedCategory(isExpanded ? null : cat.id)
                      }
                      activeOpacity={0.8}
                    >
                      <View style={styles.step11CategoryHeaderLeft}>
                        {renderCategoryIcon(cat.iconName)}
                        <Text style={styles.step11CategoryTitle}>{cat.title}</Text>
                      </View>

                      <View style={styles.step11CategoryHeaderRight}>
                        {score === null ? (
                          <View style={styles.step11PillNotAssessed}>
                            <Text style={styles.step11PillNotAssessedText}>Not assessed</Text>
                          </View>
                        ) : (
                          <View style={styles.step11PillAssessed}>
                            <Text style={styles.step11PillAssessedText}>{score}/10</Text>
                          </View>
                        )}
                        {isExpanded ? (
                          <ChevronUpIcon size={16} color="#6B7280" />
                        ) : (
                          <ChevronDownIcon size={16} color="#6B7280" />
                        )}
                      </View>
                    </TouchableOpacity>

                    {/* Accordion Body */}
                    {isExpanded && (
                      <View style={styles.step11CategoryBody}>
                        <Text style={styles.step11ScoreLabel}>Score (1-10)</Text>

                        {/* Row 1: 1 - 5 */}
                        <View style={styles.step11ScoreGridRow}>
                          {[1, 2, 3, 4, 5].map((num) => {
                            const isSelected = score === num;
                            return (
                              <TouchableOpacity
                                key={num}
                                style={[
                                  styles.step11ScoreNumBtn,
                                  isSelected && styles.step11ScoreNumBtnActive,
                                ]}
                                onPress={() => {
                                  setStep11Scores((prev) => ({
                                    ...prev,
                                    [cat.id]: prev[cat.id] === num ? null : num,
                                  }));
                                }}
                                activeOpacity={0.75}
                              >
                                <Text
                                  style={[
                                    styles.step11ScoreNumText,
                                    isSelected && styles.step11ScoreNumTextActive,
                                  ]}
                                >
                                  {num}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>

                        {/* Row 2: 6 - 10 */}
                        <View style={styles.step11ScoreGridRow}>
                          {[6, 7, 8, 9, 10].map((num) => {
                            const isSelected = score === num;
                            return (
                              <TouchableOpacity
                                key={num}
                                style={[
                                  styles.step11ScoreNumBtn,
                                  isSelected && styles.step11ScoreNumBtnActive,
                                ]}
                                onPress={() => {
                                  setStep11Scores((prev) => ({
                                    ...prev,
                                    [cat.id]: prev[cat.id] === num ? null : num,
                                  }));
                                }}
                                activeOpacity={0.75}
                              >
                                <Text
                                  style={[
                                    styles.step11ScoreNumText,
                                    isSelected && styles.step11ScoreNumTextActive,
                                  ]}
                                >
                                  {num}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>

                        {/* Previous Audit Subtext */}
                        <Text style={styles.step11PrevAuditText}>
                          Previous audit (AUD-2026-0031, 15 Jul 2026): {cat.previousAudit}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}

              {/* Read-only Farm Rating notice */}
              <View style={[styles.step9NoticeCard, { marginTop: 6, marginBottom: 12 }]}>
                <ProhibitedIcon size={18} color="#6B7280" />
                <Text style={styles.step9NoticeText}>
                  This is the farmer's Farm Rating. It is separate from the official Audit Score, which stays read-only.
                </Text>
              </View>
            </View>
          )}

        </ScrollView>

        {/* Fixed Bottom Save Action */}
        <View style={styles.stepBottomBar}>
          {currentStep === 11 ? (
            <View style={{ gap: 10 }}>
              <TouchableOpacity
                style={styles.primaryOrangeBtn}
                onPress={() => {
                  setCompletedSections((prev) => ({ ...prev, 11: true }));
                  Alert.alert('Draft Saved', 'Farmer ratings draft saved successfully.');
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryOrangeBtnText}>Save Draft</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.step11BackBtn}
                onPress={() => setCurrentView('audit_inspection')}
                activeOpacity={0.85}
              >
                <Text style={styles.step11BackBtnText}>Back to Audit Inspection</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.primaryOrangeBtn}
              onPress={handleSaveStep}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryOrangeBtnText}>Save</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* FMB Sketch Document Preview Popup Modal */}
        <Modal
          visible={fmbModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setFmbModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.fmbModalCard}>
              {/* Modal Header */}
              <View style={styles.fmbModalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <View style={styles.fmbModalIconWrap}>
                    <FileTextIcon size={20} color="#854F0B" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fmbModalTitle}>FMB Sketch Document</Text>
                    <Text style={styles.fmbModalSub}>
                      {selectedRecord.id} · Survey No. 42
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.fmbModalCloseBtn}
                  onPress={() => setFmbModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <CloseXIcon size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Document Metadata Card */}
              <View style={styles.fmbDocMetaBox}>
                <View style={styles.fmbDocMetaRow}>
                  <Text style={styles.fmbDocMetaFileName} numberOfLines={1}>
                    FMB_Sketch_Survey_42_Nilgiris.pdf
                  </Text>
                  <View style={styles.fmbPdfBadge}>
                    <Text style={styles.fmbPdfBadgeText}>PDF · 1.8 MB</Text>
                  </View>
                </View>
                <View style={styles.fmbDocMetaDivider} />
                <View style={styles.fmbDocMetaGrid}>
                  <View style={styles.fmbDocMetaCol}>
                    <Text style={styles.fmbDocMetaLabel}>Survey Ref No.</Text>
                    <Text style={styles.fmbDocMetaVal}>SR-2026-NIL-042</Text>
                  </View>
                  <View style={styles.fmbDocMetaCol}>
                    <Text style={styles.fmbDocMetaLabel}>Record Date</Text>
                    <Text style={styles.fmbDocMetaVal}>14 Sep 2026</Text>
                  </View>
                  <View style={styles.fmbDocMetaCol}>
                    <Text style={styles.fmbDocMetaLabel}>Status</Text>
                    <Text style={[styles.fmbDocMetaVal, { color: '#15803D' }]}>Verified Copy</Text>
                  </View>
                </View>
              </View>

              {/* Visual Cadastral Schematic Preview */}
              <View style={styles.fmbSketchPreviewContainer}>
                <View style={styles.fmbBlueprintHeader}>
                  <Text style={styles.fmbBlueprintTitle}>FIELD MEASUREMENT BOOK SKETCH</Text>
                  <View style={styles.fmbVerifiedPill}>
                    <Text style={styles.fmbVerifiedPillText}>Govt Land Records</Text>
                  </View>
                </View>

                {/* SVG Blueprint Graphic representing Cadastral FMB Sketch */}
                <View style={styles.fmbBlueprintGraphic}>
                  <Svg width={270} height={130} viewBox="0 0 270 130">
                    {/* Background grid markings */}
                    <Line x1="10" y1="35" x2="260" y2="35" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4,4" />
                    <Line x1="10" y1="70" x2="260" y2="70" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4,4" />
                    <Line x1="10" y1="105" x2="260" y2="105" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4,4" />
                    <Line x1="70" y1="10" x2="70" y2="120" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4,4" />
                    <Line x1="140" y1="10" x2="140" y2="120" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4,4" />
                    <Line x1="210" y1="10" x2="210" y2="120" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4,4" />

                    {/* Cadastral Polygon Boundaries */}
                    <Path
                      d="M 40 30 L 195 22 L 235 95 L 85 115 Z"
                      fill="rgba(240, 86, 42, 0.08)"
                      stroke="#F0562A"
                      strokeWidth="2.2"
                    />
                    <Path
                      d="M 120 27 L 155 105"
                      stroke="#B45309"
                      strokeWidth="1.5"
                      strokeDasharray="5,3"
                    />

                    {/* Plot Points & Markers */}
                    <Circle cx="40" cy="30" r="4" fill="#7A2E14" />
                    <Circle cx="195" cy="22" r="4" fill="#7A2E14" />
                    <Circle cx="235" cy="95" r="4" fill="#7A2E14" />
                    <Circle cx="85" cy="115" r="4" fill="#7A2E14" />
                  </Svg>

                  {/* Plot tags */}
                  <View style={styles.fmbPlotTagA}>
                    <Text style={styles.fmbPlotTagAText}>Plot 42/1 (2.4 Ac)</Text>
                  </View>
                  <View style={styles.fmbPlotTagB}>
                    <Text style={styles.fmbPlotTagBText}>Plot 42/2 (1.8 Ac)</Text>
                  </View>
                </View>

                <View style={styles.fmbSketchFoot}>
                  <Text style={styles.fmbSketchFootText}>
                    Survey District: Nilgiris · Village: Coonoor
                  </Text>
                </View>
              </View>

              {/* Action Button: Close */}
              <TouchableOpacity
                style={styles.fmbCloseFullBtn}
                onPress={() => setFmbModalVisible(false)}
                activeOpacity={0.75}
              >
                <Text style={styles.fmbCloseFullBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Crops Grown Multi-Select Modal (Screenshot 3) */}
        <Modal
          visible={cropsModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setCropsModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.pickerModalCard}>
              {/* Header */}
              <View style={styles.pickerModalHeader}>
                <Text style={styles.pickerModalTitle}>Crops Grown</Text>
                <TouchableOpacity
                  style={styles.pickerModalCloseBtn}
                  onPress={() => setCropsModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <CloseXIcon size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Search Box */}
              <View style={styles.pickerSearchBoxWrap}>
                <TextInput
                  style={styles.pickerSearchInput}
                  value={cropSearchQuery}
                  onChangeText={setCropSearchQuery}
                  placeholder="Search..."
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Checkbox List */}
              <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
                {ALL_CROPS.filter((c) =>
                  c.toLowerCase().includes(cropSearchQuery.toLowerCase().trim())
                ).map((crop) => {
                  const isChecked = selectedCrops.includes(crop);
                  return (
                    <TouchableOpacity
                      key={crop}
                      style={styles.pickerCheckRow}
                      onPress={() => {
                        setSelectedCrops((prev) =>
                          prev.includes(crop) ? prev.filter((item) => item !== crop) : [...prev, crop]
                        );
                      }}
                      activeOpacity={0.7}
                    >
                      <CheckSquareIcon checked={isChecked} size={18} color="#F0562A" />
                      <Text style={styles.pickerCheckText}>{crop}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Done Button */}
              <TouchableOpacity
                style={styles.pickerDoneBtn}
                onPress={() => setCropsModalVisible(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.pickerDoneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Plot / Zone Single-Select Modal (Screenshot 4) */}
        <Modal
          visible={plotModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPlotModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.pickerModalCard}>
              {/* Header */}
              <View style={styles.pickerModalHeader}>
                <Text style={styles.pickerModalTitle}>Plot / Zone</Text>
                <TouchableOpacity
                  style={styles.blueSquareCloseBtn}
                  onPress={() => setPlotModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <CloseXIcon size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Search Box */}
              <View style={styles.pickerSearchBoxWrap}>
                <TextInput
                  style={styles.pickerSearchInput}
                  value={plotSearchQuery}
                  onChangeText={setPlotSearchQuery}
                  placeholder="Search..."
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Radio List */}
              <ScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator={false}>
                {ALL_PLOTS.filter((p) =>
                  p.toLowerCase().includes(plotSearchQuery.toLowerCase().trim())
                ).map((plot) => {
                  const isSelected = selectedPlotZone === plot;
                  return (
                    <TouchableOpacity
                      key={plot}
                      style={styles.pickerRadioRow}
                      onPress={() => {
                        setSelectedPlotZone(plot);
                        setPlotModalVisible(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <RadioDotIcon selected={isSelected} size={18} color="#F0562A" />
                      <Text style={[styles.pickerRadioText, isSelected && { color: '#7A2E14', fontWeight: '800' }]}>
                        {plot}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Water Source Single-Select Modal */}
        <Modal
          visible={waterModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setWaterModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.pickerModalCard}>
              {/* Header */}
              <View style={styles.pickerModalHeader}>
                <Text style={styles.pickerModalTitle}>Water Source</Text>
                <TouchableOpacity
                  style={styles.blueSquareCloseBtn}
                  onPress={() => setWaterModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <CloseXIcon size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Search Box */}
              <View style={styles.pickerSearchBoxWrap}>
                <TextInput
                  style={styles.pickerSearchInput}
                  value={waterSearchQuery}
                  onChangeText={setWaterSearchQuery}
                  placeholder="Search..."
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Radio List */}
              <ScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator={false}>
                {ALL_WATER_SOURCES.filter((w) =>
                  w.toLowerCase().includes(waterSearchQuery.toLowerCase().trim())
                ).map((source) => {
                  const isSelected = selectedWaterSource === source;
                  return (
                    <TouchableOpacity
                      key={source}
                      style={styles.pickerRadioRow}
                      onPress={() => {
                        setSelectedWaterSource(source);
                        setWaterModalVisible(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <RadioDotIcon selected={isSelected} size={18} color="#F0562A" />
                      <Text style={[styles.pickerRadioText, isSelected && { color: '#7A2E14', fontWeight: '800' }]}>
                        {source}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Certificate PDF Document Preview Modal (User requested download and close) */}
        <Modal
          visible={certPdfModalDoc !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setCertPdfModalDoc(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.fmbModalCard}>
              {/* Modal Header */}
              <View style={styles.fmbModalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <View style={styles.fmbModalIconWrap}>
                    <FileTextIcon size={20} color="#854F0B" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fmbModalTitle}>{certPdfModalDoc?.title || 'Certificate Document'}</Text>
                    <Text style={styles.fmbModalSub}>
                      {selectedRecord.id} · Official Certification
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.fmbModalCloseBtn}
                  onPress={() => setCertPdfModalDoc(null)}
                  activeOpacity={0.7}
                >
                  <CloseXIcon size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Document Metadata Card */}
              <View style={styles.fmbDocMetaBox}>
                <View style={styles.fmbDocMetaRow}>
                  <Text style={styles.fmbDocMetaFileName} numberOfLines={1}>
                    {certPdfModalDoc?.fileName}
                  </Text>
                  <View style={styles.fmbPdfBadge}>
                    <Text style={styles.fmbPdfBadgeText}>PDF · 1.4 MB</Text>
                  </View>
                </View>
                <View style={styles.fmbDocMetaDivider} />
                <View style={styles.fmbDocMetaGrid}>
                  <View style={styles.fmbDocMetaCol}>
                    <Text style={styles.fmbDocMetaLabel}>Cert Number</Text>
                    <Text style={styles.fmbDocMetaVal}>{certPdfModalDoc?.certNumber}</Text>
                  </View>
                  <View style={styles.fmbDocMetaCol}>
                    <Text style={styles.fmbDocMetaLabel}>Valid Through</Text>
                    <Text style={styles.fmbDocMetaVal}>{certPdfModalDoc?.validThrough}</Text>
                  </View>
                  <View style={styles.fmbDocMetaCol}>
                    <Text style={styles.fmbDocMetaLabel}>Authority</Text>
                    <Text style={[styles.fmbDocMetaVal, { color: '#15803D' }]} numberOfLines={1}>
                      Accredited
                    </Text>
                  </View>
                </View>
              </View>

              {/* Visual Certificate Graphic Preview */}
              <View style={styles.fmbSketchPreviewContainer}>
                <View style={styles.fmbBlueprintHeader}>
                  <Text style={styles.fmbBlueprintTitle}>ORGANIC CERTIFICATE OF CONFORMITY</Text>
                  <View style={styles.fmbVerifiedPill}>
                    <Text style={styles.fmbVerifiedPillText}>Govt Certified</Text>
                  </View>
                </View>

                <View style={styles.certGraphicCard}>
                  <View style={styles.certSealPill}>
                    <Text style={styles.certSealPillText}>NATIONAL ACCREDITATION SEAL</Text>
                  </View>
                  <Text style={styles.certSubjectText}>Ramesh Organic Farm · Coonoor, Nilgiris</Text>
                  <Text style={styles.certStandardText}>
                    Standard: {certPdfModalDoc?.agency}
                  </Text>
                  <Text style={styles.certScopeText}>Scope: Organic Production & Processing</Text>
                </View>

                <View style={styles.fmbSketchFoot}>
                  <Text style={styles.fmbSketchFootText}>
                    Digital Verification Stamp · QR Code Linked
                  </Text>
                </View>
              </View>

              {/* Action Button: Close */}
              <TouchableOpacity
                style={styles.fmbCloseFullBtn}
                onPress={() => setCertPdfModalDoc(null)}
                activeOpacity={0.75}
              >
                <Text style={styles.fmbCloseFullBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Step 6 Water Source Single-Select Modal */}
        <Modal
          visible={activeWaterSourcePickerIndex !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setActiveWaterSourcePickerIndex(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.pickerModalCard}>
              {/* Header */}
              <View style={styles.pickerModalHeader}>
                <Text style={styles.pickerModalTitle}>Water Source</Text>
                <TouchableOpacity
                  style={styles.pickerModalCloseBtn}
                  onPress={() => setActiveWaterSourcePickerIndex(null)}
                  activeOpacity={0.7}
                >
                  <CloseXIcon size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Search Box */}
              <View style={styles.pickerSearchBoxWrap}>
                <TextInput
                  style={styles.pickerSearchInput}
                  value={waterSourceSearchText}
                  onChangeText={setWaterSourceSearchText}
                  placeholder="Search..."
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Radio List */}
              <ScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator={false}>
                {ALL_STEP6_WATER_SOURCES.filter((s) =>
                  s.toLowerCase().includes(waterSourceSearchText.toLowerCase().trim())
                ).map((source) => {
                  const currentSelected =
                    activeWaterSourcePickerIndex !== null
                      ? waterSourcesList[activeWaterSourcePickerIndex]?.sourceName
                      : '';
                  const isSelected = currentSelected === source;
                  return (
                    <TouchableOpacity
                      key={source}
                      style={styles.pickerRadioRow}
                      onPress={() => {
                        if (activeWaterSourcePickerIndex !== null) {
                          setWaterSourcesList((prev) =>
                            prev.map((item, i) =>
                              i === activeWaterSourcePickerIndex ? { ...item, sourceName: source } : item
                            )
                          );
                        }
                        setActiveWaterSourcePickerIndex(null);
                      }}
                      activeOpacity={0.7}
                    >
                      <RadioDotIcon selected={isSelected} size={18} color="#F0562A" />
                      <Text style={[styles.pickerRadioText, isSelected && { color: '#7A2E14', fontWeight: '800' }]}>
                        {source}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Step 6 Water Use Purpose Multi-Select Modal (Screenshot 2) */}
        <Modal
          visible={activePurposePickerIndex !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setActivePurposePickerIndex(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.pickerModalCard}>
              {/* Header */}
              <View style={styles.pickerModalHeader}>
                <Text style={styles.pickerModalTitle}>Water Use Purpose</Text>
                <TouchableOpacity
                  style={styles.pickerModalCloseBtn}
                  onPress={() => setActivePurposePickerIndex(null)}
                  activeOpacity={0.7}
                >
                  <CloseXIcon size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Search Box */}
              <View style={styles.pickerSearchBoxWrap}>
                <TextInput
                  style={styles.pickerSearchInput}
                  value={purposeSearchText}
                  onChangeText={setPurposeSearchText}
                  placeholder="Search..."
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Checkbox List */}
              <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
                {ALL_WATER_USE_PURPOSES.filter((p) =>
                  p.toLowerCase().includes(purposeSearchText.toLowerCase().trim())
                ).map((purpose) => {
                  const currentSelectedList =
                    activePurposePickerIndex !== null
                      ? waterSourcesList[activePurposePickerIndex]?.usePurposes || []
                      : [];
                  const isChecked = currentSelectedList.includes(purpose);
                  return (
                    <TouchableOpacity
                      key={purpose}
                      style={styles.pickerCheckRow}
                      onPress={() => {
                        if (activePurposePickerIndex !== null) {
                          setWaterSourcesList((prev) =>
                            prev.map((item, i) => {
                              if (i !== activePurposePickerIndex) return item;
                              const updatedPurposes = item.usePurposes.includes(purpose)
                                ? item.usePurposes.filter((p) => p !== purpose)
                                : [...item.usePurposes, purpose];
                              return { ...item, usePurposes: updatedPurposes };
                            })
                          );
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <CheckSquareIcon checked={isChecked} size={18} color="#F0562A" />
                      <Text style={styles.pickerCheckText}>{purpose}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Done Button */}
              <TouchableOpacity
                style={styles.pickerDoneBtn}
                onPress={() => setActivePurposePickerIndex(null)}
                activeOpacity={0.85}
              >
                <Text style={styles.pickerDoneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Step 7 Evidence (existing) Bottom Sheet Modal (Screenshot 5) */}
        <Modal
          visible={step7EvidenceModalSection !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setStep7EvidenceModalSection(null)}
        >
          <View style={styles.step7BottomModalBackdrop}>
            <View style={styles.step7EvidenceBottomSheetCard}>
              {/* Header */}
              <View style={styles.step7EvidenceModalHeader}>
                <Text style={styles.step7EvidenceModalTitle}>Evidence (existing)</Text>
                <TouchableOpacity
                  onPress={() => setStep7EvidenceModalSection(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.7}
                >
                  <CloseXIcon size={18} color="#111827" />
                </TouchableOpacity>
              </View>

              {/* Search Box */}
              <View style={styles.step7EvidenceSearchBox}>
                <TextInput
                  style={styles.step7EvidenceSearchInput}
                  value={step7EvidenceSearchText}
                  onChangeText={setStep7EvidenceSearchText}
                  placeholder="Search..."
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Radio list of options */}
              <View style={{ marginTop: 4 }}>
                {STEP7_EXISTING_EVIDENCES.filter((ev) =>
                  ev.toLowerCase().includes(step7EvidenceSearchText.toLowerCase().trim())
                ).map((evItem, evIdx) => {
                  const currentSelected =
                    step7EvidenceModalSection !== null
                      ? step7Data[step7EvidenceModalSection]?.evidence
                      : '';
                  const isSelected = currentSelected === evItem;

                  return (
                    <View key={evItem}>
                      <TouchableOpacity
                        style={styles.step7EvidenceRadioRow}
                        onPress={() => {
                          if (step7EvidenceModalSection !== null) {
                            setStep7Data((prev) => ({
                              ...prev,
                              [step7EvidenceModalSection]: {
                                ...prev[step7EvidenceModalSection],
                                evidence: evItem,
                              },
                            }));
                          }
                          setStep7EvidenceModalSection(null);
                        }}
                        activeOpacity={0.7}
                      >
                        <RadioDotIcon selected={isSelected} size={20} color="#F0562A" />
                        <Text style={styles.step7EvidenceRadioText}>{evItem}</Text>
                      </TouchableOpacity>
                      {evIdx < STEP7_EXISTING_EVIDENCES.length - 1 && (
                        <View style={styles.step7EvidenceDivider} />
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </Modal>

        {/* Step 8 Related Inspection Section Bottom Sheet Modal (Screenshot 4) */}
        <Modal
          visible={step8RelatedModalIndex !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setStep8RelatedModalIndex(null)}
        >
          <View style={styles.step7BottomModalBackdrop}>
            <View style={styles.step7EvidenceBottomSheetCard}>
              {/* Header */}
              <View style={styles.step7EvidenceModalHeader}>
                <Text style={styles.step7EvidenceModalTitle}>Related Inspection Section</Text>
                <TouchableOpacity
                  onPress={() => setStep8RelatedModalIndex(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.7}
                >
                  <CloseXIcon size={18} color="#111827" />
                </TouchableOpacity>
              </View>

              {/* Search Box */}
              <View style={styles.step7EvidenceSearchBox}>
                <TextInput
                  style={styles.step7EvidenceSearchInput}
                  value={step8RelatedSearchText}
                  onChangeText={setStep8RelatedSearchText}
                  placeholder="Search..."
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Radio list of 10 Inspection Sections */}
              <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                {STEP8_RELATED_SECTIONS.filter((sec) =>
                  sec.toLowerCase().includes(step8RelatedSearchText.toLowerCase().trim())
                ).map((secName, secIdx) => {
                  const currentSelected =
                    step8RelatedModalIndex !== null
                      ? step8EvidenceList[step8RelatedModalIndex]?.relatedSection
                      : '';
                  const isSelected = currentSelected === secName;

                  return (
                    <View key={secName}>
                      <TouchableOpacity
                        style={styles.step7EvidenceRadioRow}
                        onPress={() => {
                          if (step8RelatedModalIndex !== null) {
                            setStep8EvidenceList((prev) =>
                              prev.map((item, i) =>
                                i === step8RelatedModalIndex ? { ...item, relatedSection: secName } : item
                              )
                            );
                          }
                          setStep8RelatedModalIndex(null);
                        }}
                        activeOpacity={0.7}
                      >
                        <RadioDotIcon selected={isSelected} size={20} color="#F0562A" />
                        <Text style={styles.step7EvidenceRadioText}>{secName}</Text>
                      </TouchableOpacity>
                      {secIdx < STEP8_RELATED_SECTIONS.length - 1 && (
                        <View style={styles.step7EvidenceDivider} />
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Step 9 Related Section Bottom Sheet Modal (Screenshot 3) */}
        <Modal
          visible={step9RelatedModalIndex !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setStep9RelatedModalIndex(null)}
        >
          <View style={styles.step7BottomModalBackdrop}>
            <View style={styles.step7EvidenceBottomSheetCard}>
              {/* Header */}
              <View style={styles.step7EvidenceModalHeader}>
                <Text style={styles.step7EvidenceModalTitle}>Related Section</Text>
                <TouchableOpacity
                  onPress={() => setStep9RelatedModalIndex(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.7}
                >
                  <CloseXIcon size={18} color="#111827" />
                </TouchableOpacity>
              </View>

              {/* Search Box */}
              <View style={styles.step7EvidenceSearchBox}>
                <TextInput
                  style={styles.step7EvidenceSearchInput}
                  value={step9RelatedSearchText}
                  onChangeText={setStep9RelatedSearchText}
                  placeholder="Search..."
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Radio list of 10 Inspection Sections */}
              <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                {STEP8_RELATED_SECTIONS.filter((sec) =>
                  sec.toLowerCase().includes(step9RelatedSearchText.toLowerCase().trim())
                ).map((secName, secIdx) => {
                  const currentSelected =
                    step9RelatedModalIndex !== null
                      ? step9ObservationsList[step9RelatedModalIndex]?.relatedSection
                      : '';
                  const isSelected = currentSelected === secName;

                  return (
                    <View key={secName}>
                      <TouchableOpacity
                        style={styles.step7EvidenceRadioRow}
                        onPress={() => {
                          if (step9RelatedModalIndex !== null) {
                            setStep9ObservationsList((prev) =>
                              prev.map((item, i) =>
                                i === step9RelatedModalIndex ? { ...item, relatedSection: secName } : item
                              )
                            );
                          }
                          setStep9RelatedModalIndex(null);
                        }}
                        activeOpacity={0.7}
                      >
                        <RadioDotIcon selected={isSelected} size={20} color="#F0562A" />
                        <Text style={styles.step7EvidenceRadioText}>{secName}</Text>
                      </TouchableOpacity>
                      {secIdx < STEP8_RELATED_SECTIONS.length - 1 && (
                        <View style={styles.step7EvidenceDivider} />
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Step 9 Evidence Reference Bottom Sheet Modal */}
        <Modal
          visible={step9EvidenceRefModalIndex !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setStep9EvidenceRefModalIndex(null)}
        >
          <View style={styles.step7BottomModalBackdrop}>
            <View style={styles.step7EvidenceBottomSheetCard}>
              {/* Header */}
              <View style={styles.step7EvidenceModalHeader}>
                <Text style={styles.step7EvidenceModalTitle}>Evidence Reference</Text>
                <TouchableOpacity
                  onPress={() => setStep9EvidenceRefModalIndex(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.7}
                >
                  <CloseXIcon size={18} color="#111827" />
                </TouchableOpacity>
              </View>

              {/* Search Box */}
              <View style={styles.step7EvidenceSearchBox}>
                <TextInput
                  style={styles.step7EvidenceSearchInput}
                  value={step9EvidenceRefSearchText}
                  onChangeText={setStep9EvidenceRefSearchText}
                  placeholder="Search..."
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Radio list of Evidence Options */}
              <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
                {STEP7_EXISTING_EVIDENCES.filter((ev) =>
                  ev.toLowerCase().includes(step9EvidenceRefSearchText.toLowerCase().trim())
                ).map((evName, evIdx) => {
                  const currentSelected =
                    step9EvidenceRefModalIndex !== null
                      ? step9ObservationsList[step9EvidenceRefModalIndex]?.evidenceReference
                      : '';
                  const isSelected = currentSelected === evName;

                  return (
                    <View key={evName}>
                      <TouchableOpacity
                        style={styles.step7EvidenceRadioRow}
                        onPress={() => {
                          if (step9EvidenceRefModalIndex !== null) {
                            setStep9ObservationsList((prev) =>
                              prev.map((item, i) =>
                                i === step9EvidenceRefModalIndex ? { ...item, evidenceReference: evName } : item
                              )
                            );
                          }
                          setStep9EvidenceRefModalIndex(null);
                        }}
                        activeOpacity={0.7}
                      >
                        <RadioDotIcon selected={isSelected} size={20} color="#F0562A" />
                        <Text style={styles.step7EvidenceRadioText}>{evName}</Text>
                      </TouchableOpacity>
                      {evIdx < STEP7_EXISTING_EVIDENCES.length - 1 && (
                        <View style={styles.step7EvidenceDivider} />
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN 4: FULL-PAGE FILTERS VIEW (Screenshot 4)
  // ───────────────────────────────────────────────────────────────────────────
  if (currentView === 'filters') {
    return (
      <SafeAreaView style={styles.rootOrange}>
        <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

        {/* Solid Theme Orange Header */}
        <View style={styles.filterPageHeader}>
          <TouchableOpacity
            style={styles.filterBackBtn}
            onPress={() => setCurrentView('list')}
            activeOpacity={0.7}
          >
            <BackArrowIcon size={22} color={THEME.white} />
          </TouchableOpacity>

          <View style={styles.filterHeaderTitleWrap}>
            <FilterSlidersIcon size={22} color={THEME.white} />
            <Text style={styles.filterPageTitle}>Filters</Text>
          </View>
        </View>

        {/* White Body Container */}
        <View style={styles.filterBodyContainer}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.filterPageContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Section 1: Audit Type */}
            <Text style={styles.filterSectionTitle}>Audit Type</Text>
            <View style={styles.filterPillsContainer}>
              {(['All', 'Internal', 'External', 'Field Visit'] as const).map((type) => {
                const isActive = draftAuditType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.pillButton,
                      isActive ? styles.pillButtonActive : styles.pillButtonInactive,
                    ]}
                    onPress={() => setDraftAuditType(type)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.pillButtonText,
                        isActive ? styles.pillButtonTextActive : styles.pillButtonTextInactive,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Section 2: Status */}
            <Text style={styles.filterSectionTitle}>Status</Text>
            <View style={styles.filterPillsContainer}>
              {(['All', 'Upcoming', 'Scheduled', 'In Progress'] as const).map((st) => {
                const isActive = draftStatus === st;
                return (
                  <TouchableOpacity
                    key={st}
                    style={[
                      styles.pillButton,
                      isActive ? styles.pillButtonActive : styles.pillButtonInactive,
                    ]}
                    onPress={() => setDraftStatus(st)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.pillButtonText,
                        isActive ? styles.pillButtonTextActive : styles.pillButtonTextInactive,
                      ]}
                    >
                      {st}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Section 3: Date */}
            <Text style={styles.filterSectionTitle}>Date</Text>
            <View style={styles.filterPillsContainer}>
              {(['Today', 'This Week', 'This Month', 'Custom'] as const).map((d) => {
                const isActive = draftDate === d;
                return (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.pillButton,
                      isActive ? styles.pillButtonActive : styles.pillButtonInactive,
                    ]}
                    onPress={() => setDraftDate(d)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.pillButtonText,
                        isActive ? styles.pillButtonTextActive : styles.pillButtonTextInactive,
                      ]}
                    >
                      {d}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Bottom Actions Row: Apply (Left, Orange border) & Clear (Right, Grey border) */}
          <View style={styles.filterBottomActionRow}>
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={handleApplyFilters}
              activeOpacity={0.85}
            >
              <Text style={styles.applyBtnText}>Apply</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.clearBtn}
              onPress={handleClearFilters}
              activeOpacity={0.85}
            >
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN 5: AUDIT HISTORY SCREEN (Screenshots 1 & 5)
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.rootOrange}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

      {/* Terracotta Header with Back button and Circular Sliders button */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleWrap}>
            <TouchableOpacity
              style={styles.headerBackBtn}
              onPress={() => {
                if (initialTypeFilter === 'history' || initialView === 'history') {
                  onBack();
                } else if (previousView === 'audit_report') {
                  setCurrentView('audit_report');
                } else if (previousView === 'calendar') {
                  setCurrentView('calendar');
                } else {
                  onBack();
                }
              }}
              activeOpacity={0.7}
              accessibilityLabel="Back"
            >
              <BackArrowIcon size={22} color={THEME.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Audit History</Text>
          </View>

          <TouchableOpacity
            style={styles.headerFilterCircleBtn}
            onPress={() => setShowHistoryFilter((prev) => !prev)}
            activeOpacity={0.8}
            accessibilityLabel="Filters"
          >
            <FilterSlidersIcon size={19} color={THEME.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input Bar (Screenshot 1: "Farmer, Audit ID, Farm, Zone") */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchIconWrap}>
          <SearchIcon size={18} color="#9CA3AF" />
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Farmer, Audit ID, Farm, Zone"
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Scrollable Body */}
      <ScrollView
        style={styles.scrollCanvas}
        contentContainerStyle={styles.recordsListPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Inline Filter Card (Screenshot 5) - toggled without popup/new page */}
        {showHistoryFilter && (
          <View style={styles.inlineFilterCard}>
            {/* Header: Sliders icon + "Filters" */}
            <View style={styles.inlineFilterHeaderRow}>
              <FilterSlidersIcon size={20} color="#854F0B" />
              <Text style={styles.inlineFilterTitle}>Filters</Text>
            </View>

            {/* Section 1: Audit Type */}
            <Text style={styles.inlineFilterSectionLabel}>Audit Type</Text>
            <View style={styles.inlineFilterPillsRow}>
              {(['All', 'Internal', 'External', 'Field Visit'] as const).map((type) => {
                const isSel = historyDraftType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.inlineFilterPill, isSel && styles.inlineFilterPillActive]}
                    onPress={() => setHistoryDraftType(type)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.inlineFilterPillText, isSel && styles.inlineFilterPillTextActive]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Section 2: Year */}
            <Text style={styles.inlineFilterSectionLabel}>Year</Text>
            <View style={styles.inlineFilterPillsRow}>
              {(['2026', '2025', '2024'] as const).map((yr) => {
                const isSel = historyDraftYear === yr;
                return (
                  <TouchableOpacity
                    key={yr}
                    style={[styles.inlineFilterPill, isSel && styles.inlineFilterPillActive]}
                    onPress={() => setHistoryDraftYear(yr)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.inlineFilterPillText, isSel && styles.inlineFilterPillTextActive]}>
                      {yr}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Section 3: Status */}
            <Text style={styles.inlineFilterSectionLabel}>Status</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.inlineFilterStatusScroll}
            >
              {(['All', 'Completed', 'Cancelled', 'Rescheduled'] as const).map((st) => {
                const isSel = historyDraftStatus === st;
                return (
                  <TouchableOpacity
                    key={st}
                    style={[styles.inlineFilterPill, isSel && styles.inlineFilterPillActive]}
                    onPress={() => setHistoryDraftStatus(st)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.inlineFilterPillText, isSel && styles.inlineFilterPillTextActive]}>
                      {st}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {/* Custom slider bar indicator (Screenshot 5) */}
            <View style={styles.filterScrollIndicatorTrack}>
              <View style={styles.filterScrollIndicatorBar} />
            </View>

            {/* Action Buttons: Apply & Clear (Screenshot 5) */}
            <View style={styles.inlineFilterActionsRow}>
              <TouchableOpacity
                style={styles.inlineFilterApplyBtn}
                onPress={() => {
                  setHistoryAppliedType(historyDraftType);
                  setHistoryAppliedYear(historyDraftYear);
                  setHistoryAppliedStatus(historyDraftStatus);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.inlineFilterApplyBtnText}>Apply</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.inlineFilterClearBtn}
                onPress={() => {
                  setHistoryDraftType('All');
                  setHistoryDraftYear('2026');
                  setHistoryDraftStatus('All');
                  setHistoryAppliedType('All');
                  setHistoryAppliedYear('2026');
                  setHistoryAppliedStatus('All');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.inlineFilterClearBtnText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Audit Cards List (Screenshot 1) */}
        {filteredHistoryRecords.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No audits found</Text>
            <Text style={styles.emptySub}>Try adjusting your search or filters.</Text>
          </View>
        ) : (
          filteredHistoryRecords.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.historyCard}
              onPress={() => {
                setSelectedRecord(item);
                setCurrentView('audit_detail');
              }}
              activeOpacity={0.85}
            >
              <View style={styles.historyCardTopRow}>
                <Text style={styles.historyCardId}>{item.id}</Text>
                <View style={styles.historyBadgeCompleted}>
                  <Text style={styles.historyBadgeCompletedText}>
                    {item.badge}
                  </Text>
                </View>
              </View>

              <Text style={styles.historyCardSubtitle}>
                {item.farmerName} · {item.type}
              </Text>

              <Text style={styles.historyCardFootnote}>
                {item.date} · Major {item.majorFindings ?? 0} · Minor {item.minorFindings ?? 0} · Score {item.score || '80/100'}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  rootOrange: {
    flex: 1,
    backgroundColor: THEME.headerBg,
  },
  scroll: {
    flex: 1,
    backgroundColor: THEME.canvas,
  },
  scrollCanvas: {
    flex: 1,
    backgroundColor: THEME.canvas,
  },

  // Headers
  header: {
    backgroundColor: THEME.headerBg,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerBackBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: THEME.white,
    letterSpacing: -0.3,
  },
  headerFilterBtn: {
    padding: 6,
  },
  headerFilterCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Audit Schedule List Styles (Image 1 Center Screen) ───
  scheduleRecordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  scheduleRecordCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  scheduleRecordCardId: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  badgeUpcoming: {
    backgroundColor: '#FEF3E2',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeUpcomingText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#D97706',
  },
  badgeScheduled: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeScheduledText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0369A1',
  },
  scheduleRecordCardSub: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 4,
  },
  scheduleRecordCardMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  singleBottomBarFixed: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: THEME.canvas,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  addScheduleVisitBtn: {
    height: 48,
    backgroundColor: THEME.brandOrange,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addScheduleVisitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  inspectionChip: {
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  inspectionChipActive: {
    backgroundColor: THEME.brandOrange,
    borderColor: THEME.brandOrange,
  },
  inspectionChipInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  inspectionChipText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  inspectionChipTextActive: {
    color: '#FFFFFF',
  },
  inspectionChipTextInactive: {
    color: THEME.brandOrange,
  },

  // ─── Audit History Styles (Screenshot 1) ───
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  historyCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  historyCardId: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  historyBadgeCompleted: {
    backgroundColor: '#EAF7EE',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  historyBadgeCompletedText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#15803D',
  },
  historyCardSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 4,
  },
  historyCardFootnote: {
    fontSize: 12,
    color: '#6B7280',
  },

  // ─── Inline Filters Card Styles (Screenshot 5) ───
  inlineFilterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEDCD3',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  inlineFilterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  inlineFilterTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#854F0B',
  },
  inlineFilterSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    marginTop: 6,
    marginBottom: 8,
  },
  inlineFilterPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  inlineFilterStatusScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  inlineFilterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  inlineFilterPillActive: {
    backgroundColor: '#F0562A',
    borderColor: '#F0562A',
  },
  inlineFilterPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  inlineFilterPillTextActive: {
    color: '#FFFFFF',
  },
  filterScrollIndicatorTrack: {
    height: 5,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginTop: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  filterScrollIndicatorBar: {
    width: '60%',
    height: '100%',
    backgroundColor: '#9CA3AF',
    borderRadius: 3,
  },
  inlineFilterActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inlineFilterApplyBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#F0562A',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineFilterApplyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F0562A',
  },
  inlineFilterClearBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineFilterClearBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },

  // ─── Audit Detail Styles (Screenshot 2) ───
  auditSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  auditSummaryValBold: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  timelineSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#854F0B',
    marginBottom: 12,
  },
  timelineListContainer: {
    backgroundColor: 'transparent',
    gap: 14,
    marginBottom: 24,
  },
  timelineItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  timelineIconTile: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEF3E2',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineTextWrap: {
    flex: 1,
  },
  timelineTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  timelineSubText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  viewReportBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F0562A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  viewReportBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#854F0B',
  },

  // ─── Farmer Audit Report Styles (Screenshots 3 & 4) ───
  reportScrollPad: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  reportSectionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#854F0B',
    marginTop: 14,
    marginBottom: 8,
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  reportMetaValBold: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  findingsSummaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  findingsSummaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  findingsSummaryLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  findingsSummaryValDark: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },
  findingsSummaryValAmber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#D97706',
  },
  auditScoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auditScoreNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  auditScoreBigNum: {
    fontSize: 34,
    fontWeight: '900',
    color: '#854F0B',
  },
  auditScoreTotalText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B7280',
  },
  auditScoreCaption: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.8,
    marginTop: 6,
  },
  reportTextContent: {
    fontSize: 12.5,
    color: '#1F2937',
    lineHeight: 18,
  },
  viewAuditHistoryOutlineBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F0562A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAuditHistoryOutlineBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#854F0B',
  },
  reportBottomStickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
  },
  downloadPdfBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F0562A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  downloadPdfBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.headerBg,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    gap: 12,
  },
  screenHeaderTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: THEME.white,
    letterSpacing: -0.3,
  },
  screenHeaderSub: {
    fontSize: 12.5,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },

  // Search input
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: THEME.border,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIconWrap: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: THEME.ink,
    height: 40,
    padding: 0,
  },

  // Records list
  recordsListPad: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 12,
  },
  recordCard: {
    backgroundColor: THEME.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  recordCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  recordId: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.ink,
    letterSpacing: -0.2,
  },
  recordBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeOrange: {
    backgroundColor: THEME.orangeBadgeBg,
  },
  badgeBlue: {
    backgroundColor: THEME.blueBg,
  },
  badgePurple: {
    backgroundColor: THEME.purpleBg,
  },
  recordBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextOrange: {
    color: THEME.orangeBadgeText,
  },
  badgeTextBlue: {
    color: THEME.blueText,
  },
  badgeTextPurple: {
    color: THEME.purpleText,
  },
  recordMetaLine1: {
    fontSize: 12.5,
    fontWeight: '500',
    color: THEME.muted,
    marginBottom: 4,
  },
  recordMetaLine2: {
    fontSize: 12,
    fontWeight: '500',
    color: THEME.muted,
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.ink,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: THEME.muted,
  },

  // Bottom action
  bottomBarContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: THEME.canvas,
  },
  scheduleFieldVisitBtn: {
    backgroundColor: THEME.brandOrangeActive,
    height: 48,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleFieldVisitBtnText: {
    color: THEME.white,
    fontSize: 14,
    fontWeight: '700',
  },

  // ─── Detail Screen Styles ───
  detailScrollPad: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  detailSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.sectionTitle,
    marginTop: 16,
    marginBottom: 10,
  },
  detailCard: {
    backgroundColor: THEME.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  detailGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailGridCol: {
    flex: 1,
  },
  detailMetaLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: THEME.muted,
    marginBottom: 4,
  },
  detailMetaValue: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.ink,
  },

  // Certifications
  certCard: {
    backgroundColor: THEME.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  certHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  certName: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.ink,
  },
  certDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  certLabel: {
    fontSize: 11,
    color: THEME.muted,
  },
  certValue: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.ink,
  },
  certValueGreen: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.greenText,
  },

  // Buttons
  outlineOrangeBtn: {
    height: 48,
    backgroundColor: THEME.card,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: THEME.brandOrange,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  outlineOrangeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.sectionTitle,
  },
  detailBottomActionRow: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 10,
    backgroundColor: THEME.canvas,
    gap: 10,
  },
  primaryOrangeBtn: {
    height: 48,
    backgroundColor: THEME.brandOrangeActive,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryOrangeBtnText: {
    color: THEME.white,
    fontSize: 14.5,
    fontWeight: '700',
  },
  secondaryWhiteBtn: {
    height: 48,
    backgroundColor: THEME.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryWhiteBtnText: {
    color: THEME.ink,
    fontSize: 14,
    fontWeight: '700',
  },

  // ─── Schedule Field Visit Screen ───
  fieldSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.muted,
    marginBottom: 8,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  smallPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallPillActive: {
    backgroundColor: THEME.brandOrangeActive,
  },
  smallPillInactive: {
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.borderGrey,
  },
  smallPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  smallPillTextActive: {
    color: THEME.white,
  },
  smallPillTextInactive: {
    color: THEME.ink,
  },
  visitNotesCard: {
    backgroundColor: THEME.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 12,
    minHeight: 110,
  },
  visitNotesInput: {
    fontSize: 13,
    color: THEME.ink,
    textAlignVertical: 'top',
    padding: 0,
  },

  // ─── Inspection / Findings Screen ───
  checklistCard: {
    backgroundColor: THEME.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  checklistLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: THEME.ink,
  },
  checklistDivider: {
    height: 1,
    backgroundColor: THEME.borderLight,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusChipGreen: {
    backgroundColor: THEME.greenBg,
  },
  statusChipAmber: {
    backgroundColor: THEME.amberBg,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusChipTextGreen: {
    color: THEME.greenText,
  },
  statusChipTextAmber: {
    color: THEME.amberText,
  },

  summaryKpiRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryKpiCard: {
    flex: 1,
    backgroundColor: THEME.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  summaryKpiLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: THEME.muted,
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  summaryKpiValueDark: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.ink,
  },
  summaryKpiValueAmber: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.brandOrange,
  },

  findingCard: {
    backgroundColor: THEME.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  findingTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: THEME.ink,
  },
  findingBadgesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  minorBadge: {
    backgroundColor: THEME.amberBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  minorBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.amberText,
  },
  openBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  openBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },
  majorBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  majorBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  resolvedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  resolvedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  redFlagBanner: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 4,
    marginBottom: 6,
  },
  redFlagBannerText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#B91C1C',
    lineHeight: 18,
  },

  infoNoteCard: {
    backgroundColor: '#F7F5F0',
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: THEME.borderLight,
    padding: 12,
  },
  infoNoteText: {
    fontSize: 12,
    color: THEME.muted,
    lineHeight: 17,
  },

  timelineCard: {
    backgroundColor: THEME.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineTileOrange: {
    width: 30,
    height: 30,
    borderRadius: 7,
    backgroundColor: '#FEF3E2',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineTileGray: {
    width: 30,
    height: 30,
    borderRadius: 7,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineItemTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: THEME.ink,
  },
  timelineItemMeta: {
    fontSize: 11.5,
    color: THEME.muted,
    marginTop: 2,
  },

  ratingCard: {
    backgroundColor: THEME.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingNumberWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  ratingBigScore: {
    fontSize: 36,
    fontWeight: '900',
    color: '#854F0B',
  },
  ratingTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.muted,
  },
  ratingCaption: {
    fontSize: 10.5,
    fontWeight: '800',
    color: THEME.muted,
    letterSpacing: 0.8,
    marginTop: 6,
  },

  singleBottomBar: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 10,
    backgroundColor: THEME.canvas,
  },
  startResumeBtn: {
    height: 48,
    backgroundColor: THEME.brandOrangeActive,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startResumeBtnText: {
    color: THEME.white,
    fontSize: 15,
    fontWeight: '700',
  },

  // ─── Filter Page Styles (Screenshot 4) ───
  filterPageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: THEME.headerBg,
    gap: 12,
  },
  filterBackBtn: {
    padding: 4,
  },
  filterHeaderTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterPageTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: THEME.white,
  },
  filterBodyContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  filterPageContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
    backgroundColor: '#FFFFFF',
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.ink,
    marginTop: 18,
    marginBottom: 12,
  },
  filterPillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pillButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillButtonActive: {
    backgroundColor: THEME.brandOrangeActive,
    borderColor: THEME.brandOrangeActive,
    borderWidth: 1,
  },
  pillButtonInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pillButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  pillButtonTextActive: {
    color: '#FFFFFF',
  },
  pillButtonTextInactive: {
    color: '#1F2937',
  },
  filterBottomActionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  applyBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: THEME.brandOrangeActive,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.brandOrangeActive,
  },
  clearBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },

  // ─── Audit Inspection Styles (Screenshots 1 & 2) ───
  progressCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.ink,
  },
  progressCardSub: {
    fontSize: 12,
    color: THEME.muted,
    marginTop: 3,
    marginBottom: 10,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#F3ECE4',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    backgroundColor: THEME.brandOrangeActive,
    borderRadius: 3,
  },
  inspectionSectionsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.sectionTitle,
    marginTop: 18,
    marginBottom: 10,
  },
  inspectionSectionCard: {
    backgroundColor: THEME.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepNumCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FDF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumCircleDone: {
    backgroundColor: '#DCFCE7',
  },
  stepNumText: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.sectionTitle,
  },
  stepNumTextDone: {
    color: THEME.greenText,
  },
  stepCardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: THEME.ink,
  },
  stepCardSub: {
    fontSize: 11.5,
    color: THEME.muted,
    marginTop: 2,
  },
  stepCardStatus: {
    fontSize: 11.5,
    fontWeight: '700',
    color: THEME.ink,
  },
  stepCardStatusDone: {
    color: THEME.greenText,
  },
  inspectionBottomBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    backgroundColor: THEME.canvas,
  },
  saveDraftBtn: {
    height: 48,
    backgroundColor: THEME.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: THEME.brandOrangeActive,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveDraftBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: THEME.sectionTitle,
  },

  // ─── Step Detail Styles (Screenshots 3 & 4) ───
  headerStepPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerStepPillText: {
    color: THEME.white,
    fontSize: 12,
    fontWeight: '800',
  },
  formFieldGroup: {
    marginBottom: 14,
  },
  labelWithLockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 6,
  },
  lockedInputBox: {
    height: 46,
    backgroundColor: '#F5F2EB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5DFD5',
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  lockedInputText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: THEME.ink,
  },
  reportCorrectionText: {
    fontSize: 11.5,
    color: '#78716C',
    marginTop: 4,
  },
  underlineLink: {
    color: '#1E40AF',
    textDecorationLine: 'underline',
    fontWeight: '700',
  },
  dropdownSelectorBox: {
    height: 46,
    backgroundColor: THEME.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownSelectorText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: THEME.ink,
  },
  dropdownMenu: {
    backgroundColor: THEME.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4B5563',
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownMenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dropdownMenuItemActive: {
    backgroundColor: '#6B7280',
  },
  dropdownMenuText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.ink,
  },
  dropdownMenuTextActive: {
    color: THEME.white,
  },

  // ─── Step 2 Styles (FMB & Land Verification) ───
  fileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fileCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fileCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  viewOutlineBtn: {
    borderWidth: 1.5,
    borderColor: THEME.brandOrange,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  viewOutlineBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.titleRustDark,
  },
  dashedUploadBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#C7A28E',
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dashedUploadText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: THEME.titleRustDark,
  },
  whiteInputBox: {
    height: 46,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 14,
    fontSize: 13.5,
    color: THEME.ink,
  },
  surveyHelperText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E40AF',
    marginTop: 4,
  },

  notesTextareaContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    minHeight: 115,
    padding: 12,
    position: 'relative',
  },
  notesTextareaInput: {
    fontSize: 13.5,
    color: THEME.ink,
    padding: 0,
    minHeight: 85,
    textAlignVertical: 'top',
  },
  resizeHandleWrap: {
    position: 'absolute',
    bottom: 5,
    right: 5,
  },
  // ─── FMB Sketch Preview Modal Styles ───
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fmbModalCard: {
    width: '100%',
    maxWidth: 370,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 10,
  },
  fmbModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  fmbModalIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEF3E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fmbModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  fmbModalSub: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 1,
  },
  fmbModalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fmbDocMetaBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    marginBottom: 12,
  },
  fmbDocMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  fmbDocMetaFileName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  fmbPdfBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  fmbPdfBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#DC2626',
  },
  fmbDocMetaDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  fmbDocMetaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fmbDocMetaCol: {
    flex: 1,
  },
  fmbDocMetaLabel: {
    fontSize: 10.5,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 2,
  },
  fmbDocMetaVal: {
    fontSize: 11.5,
    color: '#111827',
    fontWeight: '700',
  },
  fmbSketchPreviewContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 16,
  },
  fmbBlueprintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  fmbBlueprintTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  fmbVerifiedPill: {
    backgroundColor: '#EAF7EE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  fmbVerifiedPillText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#15803D',
  },
  fmbBlueprintGraphic: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  fmbPlotTagA: {
    position: 'absolute',
    top: 50,
    left: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#F0562A',
  },
  fmbPlotTagAText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#7A2E14',
  },
  fmbPlotTagB: {
    position: 'absolute',
    top: 50,
    right: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#B45309',
  },
  fmbPlotTagBText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#854F0B',
  },
  fmbSketchFoot: {
    marginTop: 6,
    alignItems: 'center',
  },
  fmbSketchFootText: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '600',
  },
  fmbModalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  fmbCancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fmbCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },
  fmbCloseFullBtn: {
    width: '100%',
    height: 46,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fmbCloseFullBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },
  fmbDownloadBtn: {
    flex: 1.3,
    height: 46,
    borderRadius: 10,
    backgroundColor: THEME.brandOrange,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  fmbDownloadBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.white,
  },

  // ─── Step 3 Picker Modal Styles (Crops, Plot, Water) ───
  pickerModalCard: {
    width: '100%',
    maxWidth: 370,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 10,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  pickerModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  pickerModalCloseBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blueSquareCloseBtn: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerSearchBoxWrap: {
    marginBottom: 12,
  },
  pickerSearchInput: {
    height: 42,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    fontSize: 13.5,
    color: THEME.ink,
  },
  pickerCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pickerCheckText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  pickerRadioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3ECE4',
  },
  pickerRadioText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  pickerDoneBtn: {
    height: 46,
    backgroundColor: THEME.brandOrange,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  pickerDoneBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.white,
  },

  // ─── Step 4 Styles (Certification Verification) ───
  certAccordionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEDCD3',
    marginBottom: 14,
    overflow: 'hidden',
  },
  certAccordionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  certAccordionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#7A2E14',
  },
  certAccordionSub: {
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 3,
  },
  certAccordionBody: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
    borderTopWidth: 1,
    borderTopColor: '#F3ECE4',
    backgroundColor: '#FFFFFF',
  },
  certInfoText: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: 12,
  },
  dateInputRow: {
    height: 46,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateTextInput: {
    flex: 1,
    fontSize: 13.5,
    color: THEME.ink,
    padding: 0,
  },
  certGraphicCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 12,
    alignItems: 'center',
    marginVertical: 4,
  },
  certSealPill: {
    backgroundColor: '#FEF3E2',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 6,
  },
  certSealPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#854F0B',
    letterSpacing: 0.5,
  },
  certSubjectText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  certStandardText: {
    fontSize: 11,
    color: '#4B5563',
    marginTop: 2,
    textAlign: 'center',
  },
  certScopeText: {
    fontSize: 10.5,
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'center',
  },

  // ─── Step 4 Calendar Dropdown Styles (Screenshot 2) ───
  calendarDropdownCard: {
    position: 'absolute',
    top: 72,
    left: 0,
    width: 252,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
    zIndex: 9999,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  calendarMonthPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarMonthTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#111827',
  },
  calendarNavArrows: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  calendarNavBtn: {
    padding: 2,
  },
  calendarWeekDaysRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  calendarWeekDayCell: {
    width: '14.28%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarWeekDayText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#1F2937',
  },
  calendarGridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  calendarDayCell: {
    width: '14.28%',
    height: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayBox: {
    width: 23,
    height: 23,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayBoxSelected: {
    borderWidth: 1.8,
    borderColor: '#111827',
  },
  calendarDayText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#111827',
  },
  calendarDayTextInactive: {
    color: '#9CA3AF',
    fontWeight: '400',
  },
  calendarDayTextSelected: {
    fontWeight: '800',
    color: '#111827',
  },
  calendarBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 6,
    paddingHorizontal: 4,
  },
  calendarBlueActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },

  // ─── Step 6 Styles (Water Source & Water pH Testing) ───
  locationInputBox: {
    height: 46,
    backgroundColor: '#F5F2EB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5DFD5',
    paddingHorizontal: 14,
    fontSize: 13.5,
    color: THEME.ink,
  },
  locationHelperText: {
    fontSize: 11.5,
    color: '#1E40AF',
    marginTop: 4,
  },
  waterSourceSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 8,
  },
  waterSourceSectionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#854F0B',
    letterSpacing: 0.5,
  },
  addWaterSourceBtn: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: THEME.brandOrange,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  addWaterSourceBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#854F0B',
  },

  // ─── Step 7 Styles (Farm Practices Checklist - Screenshots 1 to 5) ───
  step7SectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#7A2E14',
    letterSpacing: 0.4,
    marginBottom: 12,
  },
  step7DropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4B5563',
    marginTop: 4,
    overflow: 'hidden',
  },
  step7DropdownMenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  step7DropdownMenuItemActive: {
    backgroundColor: '#6B7280',
  },
  step7DropdownMenuText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#111827',
  },
  step7DropdownMenuTextActive: {
    color: '#FFFFFF',
  },
  step7SearchBox: {
    height: 46,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  uploadEvidenceDashedBox: {
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
  },
  uploadEvidenceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#854F0B',
  },
  uploadedFileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  uploadedFileName: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.ink,
  },
  uploadedFileSize: {
    fontSize: 11,
    color: THEME.muted,
    marginTop: 2,
  },
  step7BottomModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  step7EvidenceBottomSheetCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 12,
  },
  step7EvidenceModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  step7EvidenceModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  step7EvidenceSearchBox: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#111827',
    paddingHorizontal: 14,
    justifyContent: 'center',
    marginBottom: 8,
  },
  step7EvidenceSearchInput: {
    fontSize: 14,
    color: '#111827',
    padding: 0,
  },
  step7EvidenceRadioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
  },
  step7EvidenceRadioText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  step7EvidenceDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },

  // ─── Step 8 Styles (Documents & Evidence - Screenshots 1 to 5) ───
  step8SectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#7A2E14',
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  step8DocCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  step8DocCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  step8DocTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  step8DocSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  step8DocActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  step8DocActionBtn: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#B45309',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  step8DocActionBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#854F0B',
  },
  step8AddEvidenceBtn: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: THEME.brandOrange,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  step8AddEvidenceBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#854F0B',
  },
  step8SubsequentEntryBox: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5DFD5',
  },
  step8EntryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  step8EntryHeaderTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#854F0B',
  },
  step8RemoveText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#DC2626',
  },

  // ─── Step 9 Styles (Inspection Observations & Findings) ───
  step9InfoBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D97706',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  step9InfoBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#854F0B',
    lineHeight: 16.5,
    flex: 1,
  },
  step9EmptyHint: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: -4,
    marginBottom: 8,
  },
  step9FindingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  step9FindingText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#374151',
  },
  step9NoticeCard: {
    backgroundColor: '#FBF9F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  step9NoticeText: {
    fontSize: 11.5,
    color: '#4B5563',
    lineHeight: 16,
    flex: 1,
  },

  // ─── Step 10 Styles (Farmer Admin Assessment - Screenshots 1 to 5) ───
  step10ScoreCard: {
    backgroundColor: '#ECEAE4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2DDD4',
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  step10ScoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  step10ScoreCaption: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E65A6',
    lineHeight: 16.5,
    marginTop: 6,
    marginBottom: 6,
  },

  // ─── Step 11 Styles (Farmer Rating - Screenshots 1 to 4) ───
  step11Breadcrumb: {
    fontSize: 12,
    fontWeight: '700',
    color: '#854F0B',
    marginBottom: 10,
  },
  step11MetaGridCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 12,
  },
  step11MetaGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  step11MetaGridCol: {
    flex: 1,
  },
  step11MetaLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2,
  },
  step11MetaValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#111827',
  },
  step11OverallCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 16,
  },
  step11OverallTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  step11OverallScoreText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#374151',
    marginBottom: 8,
  },
  step11OverallSubtext: {
    fontSize: 11.5,
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: 8,
  },
  step11OverallSubtext2: {
    fontSize: 11.5,
    color: '#6B7280',
    lineHeight: 16,
  },
  step11CategoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
    overflow: 'hidden',
  },
  step11CategoryHeader: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  step11CategoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 6,
  },
  step11CategoryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    flex: 1,
  },
  step11CategoryHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  step11PillNotAssessed: {
    backgroundColor: '#ECEAE4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  step11PillNotAssessedText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#6B7280',
  },
  step11PillAssessed: {
    backgroundColor: '#ECEAE4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  step11PillAssessedText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1F2937',
  },
  step11CategoryBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3EFE9',
  },
  step11ScoreLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 10,
  },
  step11ScoreGridRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  step11ScoreNumBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  step11ScoreNumBtnActive: {
    backgroundColor: THEME.brandOrange,
    borderColor: THEME.brandOrange,
  },
  step11ScoreNumText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  step11ScoreNumTextActive: {
    color: '#FFFFFF',
  },
  step11PrevAuditText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 6,
  },
  step11BackBtn: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  step11BackBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#854F0B',
  },

  stepBottomBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    backgroundColor: THEME.canvas,
  },

  // ─── Module 5: Audit Calendar Styles (Image 1) ───
  calRoot: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  calHeader: {
    backgroundColor: THEME.brandOrange,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  calHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  calHeaderSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  calBellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calTabsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  calTabActive: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: THEME.brandOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calTabActiveText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  calTabInactive: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calTabInactiveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  calFiltersRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  calFilterCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  calFilterLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  calFilterValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
    marginTop: 4,
  },
  calMonthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 18,
  },
  calMonthNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calMonthNavTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  calWeekdaysRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  calWeekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
  },
  calGridContainer: {
    paddingHorizontal: 12,
  },
  calGridWeekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  calGridDayCell: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
  },
  calGridDayCellSelected: {
    backgroundColor: THEME.brandOrange,
    borderColor: THEME.brandOrange,
  },
  calGridDayCellEmpty: {
    flex: 1,
    height: 48,
    marginHorizontal: 3,
  },
  calGridDayText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  calGridDayTextSelected: {
    color: '#FFFFFF',
  },
  calDotSingle: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  calDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    gap: 2,
  },
  calDotMini: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: THEME.brandOrange,
  },
  calSelectedDateSection: {
    paddingHorizontal: 16,
    marginTop: 18,
    paddingBottom: 24,
  },
  calSelectedDateTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  calSelectedDateCount: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
  },
  calAuditCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginTop: 12,
  },
  calAuditCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calAuditCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  calAuditBadgeBlue: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  calAuditBadgeBlueText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2563EB',
  },
  calAuditCardSubtitle: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#4B5563',
    marginTop: 6,
  },
  calAuditCardMeta: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 3,
  },
  calViewDetailsBtn: {
    marginTop: 12,
  },
  calViewDetailsText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: THEME.brandOrange,
  },

  // ─── Module 5: Audit Details Styles (Images 2 & 3) ───
  detHeaderSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  detUpcomingBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 2.5,
    borderRadius: 12,
  },
  detUpcomingBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#B45309',
  },
  detSectionHeader: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#854F0B',
    marginTop: 8,
    marginBottom: 8,
  },
  detCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 12,
  },
  detRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  detCol: {
    flex: 1,
  },
  detLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  detValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginTop: 3,
  },
  detViewProfileBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: THEME.brandOrange,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  detViewProfileBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#854F0B',
  },
  detDocCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detDocCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detDocCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  detChecklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  detChecklistTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  detChecklistPendingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detChecklistPendingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  detDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  detDisclaimerCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E2D9',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 10,
    marginBottom: 30,
  },
  detDisclaimerText: {
    flex: 1,
    fontSize: 11.5,
    color: '#6B7280',
    lineHeight: 16,
    fontWeight: '500',
  },

  // ─── Module 5: Checklist PDF Viewer Styles (Image 4) ───
  pdfHeader: {
    backgroundColor: THEME.brandOrange,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pdfHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  pdfMetaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    margin: 16,
    padding: 16,
    flexDirection: 'row',
  },
  pdfPreviewArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  pdfBottomBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 28,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  pdfDownloadBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: THEME.brandOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfDownloadBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.brandOrange,
  },
  pdfCloseBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfCloseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },

  // ─── Module 5: Audit Detail Double Bottom Bar Styles (Image 1 Right) ───
  doubleBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 8,
  },
  primarySupportAuditBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: THEME.brandOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primarySupportAuditBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  outlineScheduleVisitBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineScheduleVisitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
});
