import React, { useCallback, useEffect, useState } from 'react';
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
import { ErrorState, Skeleton } from '@tohfa/mobile-ui';
import { authPalette as P, colors, typography } from '../../../theme';
import { t } from '../../../../../i18n/farmer';
import {
  getAnimal,
  listProductionLogs,
  type AnimalGender,
  type AnimalResponse,
  type AnimalSource,
  type AnimalSpecies,
  type OrganicStatus,
  type ProductionLogResponse,
} from '../../../api/livestock';
import { type AnimalFormData } from './RegisterAnimalScreen';

// ── SVG Icons ────────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.deepGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PencilEditIcon({ size = 18, color = colors.brandGreen }: { size?: number; color?: string }) {
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

function HeaderTagIcon({ size = 18, color = P.twGray600 }: { size?: number; color?: string }) {
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

function PawPrintIcon({ size = 26, color = P.twAmber800 }: { size?: number; color?: string }) {
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

function TabHealthIcon({ size = 16, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="5" width="7" height="15" rx="1.5" stroke={color} strokeWidth="2" />
      <Line x1="7.5" y1="2" x2="7.5" y2="5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Rect x="13" y="8" width="7" height="12" rx="1.5" stroke={color} strokeWidth="2" />
      <Line x1="16.5" y1="5" x2="16.5" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function TabFeedIcon({ size = 16, color = P.twGray700 }: { size?: number; color?: string }) {
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

function TabBreedingIcon({ size = 16, color = P.twGray700 }: { size?: number; color?: string }) {
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

function TabProductionIcon({ size = 16, color = P.twGray700 }: { size?: number; color?: string }) {
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

function TabHousingIcon({ size = 16, color = P.twGray700 }: { size?: number; color?: string }) {
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

function LeafIcon({ size = 18, color = colors.brandGreen }: { size?: number; color?: string }) {
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

function ProhibitedCircleIcon({ size = 18, color = P.twRed600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Line x1="5.6" y1="5.6" x2="18.4" y2="18.4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function VaccineVialsIcon({ size = 18, color = colors.brandGreen }: { size?: number; color?: string }) {
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

function DewormingBottleIcon({ size = 18, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="6" width="14" height="15" rx="3" stroke={color} strokeWidth="2" />
      <Rect x="8" y="2" width="8" height="4" rx="1" stroke={color} strokeWidth="2" />
      <Line x1="12" y1="10" x2="12" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="9" y1="13" x2="15" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function StethoscopeIcon({ size = 20, color = P.twBlue700 }: { size?: number; color?: string }) {
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

function SproutFodderIcon({ size = 18, color = P.twAmber800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 21V10" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M12 10a5 5 0 0 0-5-5M12 10a5 5 0 0 1 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="21" x2="20" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ConcentrateMeshIcon({ size = 18, color = P.twAmber800 }: { size?: number; color?: string }) {
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

function LinkChainIcon({ size = 13, color = P.twBlue600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <Path
        d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ── Breeding Tab Icons ───────────────────────────────────────────────────────

function CalfCowIcon({ size = 18, color = P.twAmber800 }: { size?: number; color?: string }) {
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

function PlusCircleGreenIcon({ size = 17, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 8v8M8 12h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ── Production Tab Icons ─────────────────────────────────────────────────────

function MilkDropletIcon({ size = 18, color = P.twBlue600 }: { size?: number; color?: string }) {
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

function BarnOutlineIcon({ size = 18, color = P.twAmber800 }: { size?: number; color?: string }) {
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

function ShieldCheckBadgeIcon({ size = 20 }: { size?: number }) {
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

function BroomCleaningIcon({ size = 17, color = colors.brandGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3v10M7 17l5-4 5 4M6 21h12M5 18l1.5 3M19 18l-1.5 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Add Health Record Modal Icons ───────────────────────────────────────────

function GreenBackArrowIcon({ size = 22, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CowAvatarIcon({ size = 44 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <Circle cx="22" cy="22" r="21" fill={P.paleCreamBg} />
      {/* Ears */}
      <Path
        d="M10 16c-3 0-5 3-4 6 1 3 4 1 5-1l0-4c0-.6-.5-1-1-1z"
        fill={P.tanBrown}
      />
      <Path
        d="M34 16c3 0 5 3 4 6-1 3-4 1-5-1l0-4c0-.6.5-1 1-1z"
        fill={P.tanBrown}
      />
      {/* Horns */}
      <Path
        d="M14 12c-1.5-3-3-3-3-3s0 3 2 4M30 12c1.5-3 3-3 3-3s0 3-2 4"
        stroke={P.twAmber800}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Head */}
      <Circle cx="22" cy="23" r="11" fill={P.white} stroke={P.twGray200} strokeWidth="1" />
      {/* Brown eye patch */}
      <Path
        d="M14 18c2-2 5-1 4 3s-3 3-4 1z"
        fill={P.tanBrown}
      />
      {/* Eyes */}
      <Circle cx="17" cy="21" r="1.4" fill={P.nearBlack} />
      <Circle cx="27" cy="21" r="1.4" fill={P.nearBlack} />
      {/* Muzzle / Snout */}
      <Rect x="17" y="26" width="10" height="6.5" rx="3.2" fill={P.twRed200} />
      <Circle cx="20" cy="29" r="1" fill={P.twRed700} />
      <Circle cx="24" cy="29" r="1" fill={P.twRed700} />
    </Svg>
  );
}

function GenderSymbolIcon({ size = 12, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Circle cx="8" cy="6" r="4" stroke={color} strokeWidth="1.6" />
      <Line x1="8" y1="10" x2="8" y2="15" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="5.5" y1="12.5" x2="10.5" y2="12.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

function FormCalendarIcon({ size = 18, color = P.twGray500 }: { size?: number; color?: string }) {
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

function FormChevronDownIcon({ size = 18, color = P.twGray500 }: { size?: number; color?: string }) {
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

function FormCloseIcon({ size = 16, color = P.twGray600 }: { size?: number; color?: string }) {
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

function FormPlusIcon({ size = 16, color = P.white }: { size?: number; color?: string }) {
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

function ReceiptDocIcon({ size = 36 }: { size?: number }) {
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

// ── Enum display / API mapping ──────────────────────────────────────────────
// Explicit switches (not `.toUpperCase() as X`) so a future enum addition on
// either side fails to compile instead of silently mismatching.

function speciesLabel(v: AnimalSpecies): string {
  switch (v) {
    case 'CATTLE':
      return 'Cattle';
    case 'BUFFALO':
      return 'Buffalo';
    case 'GOAT':
      return 'Goat';
    case 'POULTRY':
      return 'Poultry';
    case 'SHEEP':
      return 'Sheep';
  }
}

function genderLabel(v: AnimalGender): 'Female' | 'Male' {
  return v === 'MALE' ? 'Male' : 'Female';
}

function sourceToFormValue(v: AnimalSource): 'born_on_farm' | 'purchased' {
  return v === 'PURCHASED' ? 'purchased' : 'born_on_farm';
}

function organicStatusToFormValue(v: OrganicStatus): 'Organic' | 'Transitioning' | 'Conventional' {
  switch (v) {
    case 'ORGANIC':
      return 'Organic';
    case 'TRANSITIONING':
      return 'Transitioning';
    case 'CONVENTIONAL':
      return 'Conventional';
  }
}

function statusBadgeLabelFor(animal: AnimalResponse): string {
  if (animal.organicStatus === 'ORGANIC') {
    return animal.source === 'BORN_ON_FARM'
      ? t('farmer.livestock.list.statusBornOrganic')
      : t('farmer.livestock.list.statusFullyOrganic');
  }
  if (animal.organicStatus === 'TRANSITIONING') {
    return t('farmer.livestock.list.statusTransitioning');
  }
  return t('farmer.livestock.list.statusConventional');
}

/** `YYYY-MM-DD` parsed as a LOCAL calendar date, never `new Date(iso)`. */
function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map((part) => parseInt(part, 10));
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function isWithdrawalActive(withdrawalUntil: string | null): boolean {
  return withdrawalUntil !== null && withdrawalUntil >= todayIso();
}

/** Short age label ("4 yr", "8 mo") computed client-side from `dateOfBirth`. */
function computeAgeShort(dateOfBirth: string | null): string {
  if (!dateOfBirth) return t('farmer.livestock.list.ageUnknown');
  const birth = parseIsoDate(dateOfBirth);
  const now = new Date();
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 0) return t('farmer.livestock.list.ageNewborn');
  if (months < 12) return t('farmer.livestock.list.ageMonths', { count: Math.max(months, 0) });
  return t('farmer.livestock.list.ageYears', { count: Math.floor(months / 12) });
}

function formatShortDate(iso: string): string {
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = parseIsoDate(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function daysUntil(iso: string): number {
  const target = parseIsoDate(iso).getTime();
  const today = parseIsoDate(todayIso()).getTime();
  return Math.max(0, Math.round((target - today) / (1000 * 60 * 60 * 24)));
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface AnimalDetailProps {
  animalId?: string;
  animalName?: string;
  animalCode?: string;
  species?: string;
  breed?: string;
  gender?: string;
  age?: string;
  statusBadge?: string;
  onBack?: () => void;
  onNavigateToEdit?: (animalData: any) => void;
  onNavigateToSale?: () => void;
  onNavigateToRegisterOffspring?: () => void;
}

type TabKey = 'Health' | 'Feed' | 'Breeding' | 'Production' | 'Housing';

export function AnimalDetailScreen({
  animalId = 'a1',
  animalName = 'Lakshmi',
  animalCode = 'C-014',
  species = 'Cattle',
  breed = 'Jersey cross',
  gender = 'Female',
  age = '4 yr',
  statusBadge = 'Fully Organic',
  onBack,
  onNavigateToEdit,
  onNavigateToSale,
  onNavigateToRegisterOffspring,
}: AnimalDetailProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabKey>('Health');

  const [animal, setAnimal] = useState<AnimalResponse | null>(null);
  const [productionLogs, setProductionLogs] = useState<ProductionLogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown | null>(null);

  // Health Records state & Add Health Record Modal
  const [isAddHealthModalVisible, setIsAddHealthModalVisible] = useState(false);
  const [recordType, setRecordType] = useState<'Vaccination' | 'Deworming' | 'Checkup' | 'Treatment'>('Vaccination');
  const [recordDate, setRecordDate] = useState('12 Jul 2026');
  const [veterinarian, setVeterinarian] = useState('Dr. Anand');
  const [isVetDropdownOpen, setIsVetDropdownOpen] = useState(false);
  const [vaccineName, setVaccineName] = useState('FMD vaccine');
  const [dose, setDose] = useState('2');
  const [doseUnit, setDoseUnit] = useState('ml');
  const [isDoseUnitDropdownOpen, setIsDoseUnitDropdownOpen] = useState(false);
  const [adminRoute, setAdminRoute] = useState('Injection (IM)');
  const [isAdminRouteDropdownOpen, setIsAdminRouteDropdownOpen] = useState(false);
  const [batchNumber, setBatchNumber] = useState('FMD-2026-001');
  const [nextVaccinationDate, setNextVaccinationDate] = useState('10 Oct 2026');
  const [notes, setNotes] = useState('Annual FMD vaccination.\nNo side effects observed.');
  const [attachment, setAttachment] = useState<{ name: string; size: string } | null>({
    name: 'vaccine_receipt.jpg',
    size: '240 KB',
  });

  const [vaccinations, setVaccinations] = useState<Array<{ id: string; name: string; date: string; nextDate?: string | undefined }>>([
    { id: 'v1', name: 'FMD vaccine', date: 'Given 10 Apr', nextDate: 'Next 10 Oct' },
    { id: 'v2', name: 'HS vaccine', date: 'Given 02 Feb', nextDate: 'Next 02 Aug' },
  ]);
  const [dewormings, setDewormings] = useState<Array<{ id: string; name: string; date: string; nextDate?: string | undefined }>>([
    { id: 'd1', name: 'Deworming dose', date: 'Given 01 Jul', nextDate: 'Next 01 Oct' },
  ]);
  const [checkups, setCheckups] = useState([
    {
      id: 'c1',
      title: 'Checkup · 12 Jul',
      doctor: 'Dr. Anand',
      description: 'Sub-clinical mastitis, left quarter. Advised herbal treatment.',
    },
  ]);

  const VET_OPTIONS = ['Dr. Anand', 'Dr. Rajesh Kumar', 'Dr. Meena Iyer', 'Self / Farm Worker'];
  const DOSE_UNIT_OPTIONS = ['ml', 'mg', 'tablet', 'dose', 'g', 'drop'];
  const ADMIN_ROUTE_OPTIONS = [
    'Injection (IM)',
    'Injection (SC)',
    'Oral',
    'Topical',
    'Nasal',
    'Intra-mammary',
  ];

  const handleSaveHealthRecord = () => {
    if (!vaccineName.trim()) {
      Alert.alert('Required Field', 'Please enter the vaccine / record name.');
      return;
    }
    if (!dose.trim()) {
      Alert.alert('Required Field', 'Please enter the dose amount.');
      return;
    }

    if (recordType === 'Vaccination') {
      const newVac = {
        id: `v_${Date.now()}`,
        name: vaccineName.trim(),
        date: `Given ${recordDate.trim()}`,
        ...(nextVaccinationDate.trim() ? { nextDate: `Next ${nextVaccinationDate.trim()}` } : {}),
      };
      setVaccinations((prev) => [newVac, ...prev]);
    } else if (recordType === 'Deworming') {
      const newDew = {
        id: `d_${Date.now()}`,
        name: vaccineName.trim() || 'Deworming dose',
        date: `Given ${recordDate.trim()}`,
        ...(nextVaccinationDate.trim() ? { nextDate: `Next ${nextVaccinationDate.trim()}` } : {}),
      };
      setDewormings((prev) => [newDew, ...prev]);
    } else {
      const newChk = {
        id: `c_${Date.now()}`,
        title: `${recordType} · ${recordDate.trim()}`,
        doctor: veterinarian,
        description: notes.trim() || `${vaccineName.trim()} (${dose.trim()} ${doseUnit})`,
      };
      setCheckups((prev) => [newChk, ...prev]);
    }

    Alert.alert(
      'Health Record Added',
      `Health record for ${displayName} has been saved successfully.`,
    );
    setIsAddHealthModalVisible(false);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [fetchedAnimal, logsResult] = await Promise.all([
        getAnimal(animalId),
        listProductionLogs({ animalId, productType: 'MILK' }),
      ]);
      setAnimal(fetchedAnimal);
      setProductionLogs(logsResult.items);
    } catch (err: unknown) {
      setLoadError(err);
    } finally {
      setLoading(false);
    }
  }, [animalId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Real, authoritative values once loaded; the route-param props above only
  // cover the brief window before the GET resolves.
  const displayName = animal?.name ?? animal?.tag ?? animalName;
  const displayCode = animal?.tag ?? animalCode;
  const displaySpecies = animal ? speciesLabel(animal.species) : species;
  const displayBreed = animal?.breed ?? breed;
  const displayGender = animal ? genderLabel(animal.gender) : gender;
  const displayAge = animal ? computeAgeShort(animal.dateOfBirth) : age;
  const displayStatusBadge = animal ? statusBadgeLabelFor(animal) : statusBadge;
  const withdrawalActive = animal ? isWithdrawalActive(animal.withdrawalUntil) : false;
  const todayLogs = productionLogs.filter((log) => log.loggedOn === todayIso());
  const todayYieldLiters = todayLogs.reduce((sum, log) => sum + log.quantity, 0);
  const todaySessionCount = todayLogs.reduce((sum, log) => sum + (log.sessions ?? 1), 0);

  const handleEdit = () => {
    if (!animal) return;
    if (onNavigateToEdit) {
      const formData: AnimalFormData = {
        id: animal.id,
        tag: animal.tag,
        name: animal.name ?? undefined,
        species: speciesLabel(animal.species),
        breed: animal.breed ?? '',
        gender: genderLabel(animal.gender),
        dob: animal.dateOfBirth ? formatShortDate(animal.dateOfBirth) : '',
        source: sourceToFormValue(animal.source),
        purchaseDate: animal.purchasedOn ? formatShortDate(animal.purchasedOn) : undefined,
        sourceFarm: animal.sourceFarm ?? undefined,
        organicStatus: organicStatusToFormValue(animal.organicStatus),
      };
      onNavigateToEdit(formData);
    } else {
      Alert.alert('Edit Animal', `Editing profile for ${displayName} (${displayCode})`);
    }
  };

  const handleMoreOptions = () => {
    if (onNavigateToSale) {
      onNavigateToSale();
    } else {
      Alert.alert('Animal Options', `Options for ${displayName} (${displayCode})`, [
        { text: 'Edit Profile', onPress: handleEdit },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const handleRegisterOffspring = () => {
    if (onNavigateToRegisterOffspring) {
      onNavigateToRegisterOffspring();
    } else if (onNavigateToEdit) {
      onNavigateToEdit({
        species,
        breed: `${breed} offspring`,
        gender: 'Female',
        dob: '14 Mar 2025',
        source: 'born_on_farm',
        organicStatus: 'Organic',
      });
    } else {
      Alert.alert('Register Offspring', 'Opening registration form for newborn calf.');
    }
  };

  // Compute slider thumb offset
  const getSliderThumbStyle = () => {
    switch (activeTab) {
      case 'Health':
        return { alignSelf: 'flex-start' as const };
      case 'Feed':
        return { alignSelf: 'center' as const, transform: [{ translateX: -20 }] };
      case 'Breeding':
        return { alignSelf: 'center' as const };
      case 'Production':
        return { alignSelf: 'center' as const, transform: [{ translateX: 20 }] };
      case 'Housing':
        return { alignSelf: 'flex-end' as const };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={P.white} />
        <View style={{ padding: 20, gap: 12 }}>
          <Skeleton width="100%" height={58} borderRadius={16} />
          <Skeleton width="100%" height={40} borderRadius={20} />
          <Skeleton width="100%" height={140} borderRadius={16} />
        </View>
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={P.white} />
        <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
          <ErrorState error={loadError} onRetry={() => void load()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />
      <View style={styles.container}>
        {/* ── Top Header Bar ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.circleHeaderBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ArrowBackIcon size={20} color={P.deepGreen} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{displayName}</Text>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.circleHeaderBtn}
              onPress={handleEdit}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Edit animal"
            >
              <PencilEditIcon size={18} color={colors.brandGreen} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.circleHeaderBtn}
              onPress={onNavigateToSale || handleMoreOptions}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Sale / Transfer / Cull"
            >
              <HeaderTagIcon size={18} color={P.twGray600} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Animal Profile Header Card ── */}
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarCircle}>
                <PawPrintIcon size={26} color={P.twAmber800} />
              </View>
              {withdrawalActive && <View style={styles.alertBadgeDot} />}
            </View>

            <View style={styles.profileInfoCol}>
              <Text style={styles.profileCode}>{displayCode}</Text>
              <Text style={styles.profileSubtitle}>
                {displaySpecies} · {displayBreed} · {displayGender} · {displayAge}
              </Text>
            </View>

            <View style={styles.statusBadgePill}>
              <Text style={styles.statusBadgeText}>{displayStatusBadge}</Text>
            </View>
          </View>

          {/* ── Horizontal Navigation Tabs ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScrollContent}
            style={styles.tabScrollView}
          >
            {/* Health Tab */}
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'Health' && styles.tabButtonActive]}
              onPress={() => setActiveTab('Health')}
              activeOpacity={0.8}
            >
              <TabHealthIcon size={16} color={activeTab === 'Health' ? P.white : P.twGray700} />
              <Text style={[styles.tabButtonText, activeTab === 'Health' && styles.tabButtonTextActive]}>
                Health
              </Text>
            </TouchableOpacity>

            {/* Feed Tab */}
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'Feed' && styles.tabButtonActive]}
              onPress={() => setActiveTab('Feed')}
              activeOpacity={0.8}
            >
              <TabFeedIcon size={16} color={activeTab === 'Feed' ? P.white : P.twGray700} />
              <Text style={[styles.tabButtonText, activeTab === 'Feed' && styles.tabButtonTextActive]}>
                Feed
              </Text>
            </TouchableOpacity>

            {/* Breeding Tab */}
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'Breeding' && styles.tabButtonActive]}
              onPress={() => setActiveTab('Breeding')}
              activeOpacity={0.8}
            >
              <TabBreedingIcon size={16} color={activeTab === 'Breeding' ? P.white : P.twGray700} />
              <Text
                style={[styles.tabButtonText, activeTab === 'Breeding' && styles.tabButtonTextActive]}
              >
                Breeding
              </Text>
            </TouchableOpacity>

            {/* Production Tab */}
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'Production' && styles.tabButtonActive]}
              onPress={() => setActiveTab('Production')}
              activeOpacity={0.8}
            >
              <TabProductionIcon
                size={16}
                color={activeTab === 'Production' ? P.white : P.twGray700}
              />
              <Text
                style={[styles.tabButtonText, activeTab === 'Production' && styles.tabButtonTextActive]}
              >
                Production
              </Text>
            </TouchableOpacity>

            {/* Housing Tab */}
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'Housing' && styles.tabButtonActive]}
              onPress={() => setActiveTab('Housing')}
              activeOpacity={0.8}
            >
              <TabHousingIcon size={16} color={activeTab === 'Housing' ? P.white : P.twGray700} />
              <Text
                style={[styles.tabButtonText, activeTab === 'Housing' && styles.tabButtonTextActive]}
              >
                Housing
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Carousel / Tab position scroll indicator */}
          <View style={styles.scrollIndicatorRow}>
            <View style={styles.arrowTriangleLeft} />
            <View style={styles.sliderTrack}>
              <View style={[styles.sliderThumb, getSliderThumbStyle()]} />
            </View>
            <View style={styles.arrowTriangleRight} />
          </View>

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB 1: HEALTH                                                      */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'Health' && (
            <View style={styles.tabContentContainer}>
              {/* Top Bar with Add Button */}
              <View style={styles.healthTopBar}>
                <View style={styles.healthTopBarTitleCol}>
                  <Text style={styles.healthTopBarTitle}>Health Records</Text>
                  <Text style={styles.healthTopBarSubtitle}>Clinical logs & vaccinations</Text>
                </View>
                <TouchableOpacity
                  style={styles.addHealthButton}
                  onPress={() => setIsAddHealthModalVisible(true)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Add Health Record"
                >
                  <FormPlusIcon size={15} color={P.white} />
                  <Text style={styles.addHealthButtonText}>Add</Text>
                </TouchableOpacity>
              </View>

              {/* Notice 1: Organic Standard */}
              <View style={styles.organicNoticeCard}>
                <View style={styles.organicNoticeIconCol}>
                  <LeafIcon size={18} color={colors.brandGreen} />
                </View>
                <Text style={styles.organicNoticeText}>
                  Organic standard — only herbal & homeopathic treatments permitted. Antibiotics are
                  restricted.
                </Text>
              </View>

              {/* Notice 2: Milk not sellable withdrawal alert — real, from animal.withdrawalUntil */}
              {withdrawalActive && animal?.withdrawalUntil && (
                <View style={styles.withdrawalAlertCard}>
                  <View style={styles.withdrawalLeftAccentBar} />
                  <View style={styles.withdrawalCardInner}>
                    <View style={styles.withdrawalHeaderRow}>
                      <ProhibitedCircleIcon size={19} color={P.twOrange700} />
                      <Text style={styles.withdrawalTitle}>Milk not sellable — withdrawal active</Text>
                    </View>
                    <Text style={styles.withdrawalBody}>
                      Clears <Text style={styles.boldText}>{formatShortDate(animal.withdrawalUntil)}</Text> ·{' '}
                      {daysUntil(animal.withdrawalUntil)} days left.
                    </Text>
                  </View>
                </View>
              )}

              {/* Section: VACCINATIONS */}
              <Text style={styles.sectionHeaderTitle}>VACCINATIONS</Text>
              <View style={styles.whiteCardContainer}>
                {vaccinations.map((vac, idx) => (
                  <React.Fragment key={vac.id}>
                    {idx > 0 && <View style={styles.dividerLine} />}
                    <View style={styles.itemRow}>
                      <View style={styles.greenIconSquare}>
                        <VaccineVialsIcon size={17} color={colors.brandGreen} />
                      </View>
                      <View style={styles.itemMainCol}>
                        <Text style={styles.itemTitle}>{vac.name}</Text>
                        <Text style={styles.itemSubtitle}>{vac.date}</Text>
                      </View>
                      {vac.nextDate ? (
                        <View style={styles.dueDateBadge}>
                          <Text style={styles.dueDateBadgeText}>{vac.nextDate}</Text>
                        </View>
                      ) : null}
                    </View>
                  </React.Fragment>
                ))}
              </View>

              {/* Section: DEWORMING */}
              <Text style={styles.sectionHeaderTitle}>DEWORMING</Text>
              <View style={styles.whiteCardContainer}>
                {dewormings.map((dew, idx) => (
                  <React.Fragment key={dew.id}>
                    {idx > 0 && <View style={styles.dividerLine} />}
                    <View style={styles.itemRow}>
                      <View style={styles.greenIconSquare}>
                        <DewormingBottleIcon size={17} color={colors.brandGreen} />
                      </View>
                      <View style={styles.itemMainCol}>
                        <Text style={styles.itemTitle}>{dew.name}</Text>
                        <Text style={styles.itemSubtitle}>{dew.date}</Text>
                      </View>
                      {dew.nextDate ? (
                        <View style={styles.dueDateBadge}>
                          <Text style={styles.dueDateBadgeText}>{dew.nextDate}</Text>
                        </View>
                      ) : null}
                    </View>
                  </React.Fragment>
                ))}
              </View>

              {/* Section: CHECKUP & TREATMENT */}
              <Text style={styles.sectionHeaderTitle}>CHECKUP & TREATMENT</Text>
              <View style={styles.whiteCardContainer}>
                {checkups.map((chk, idx) => (
                  <React.Fragment key={chk.id}>
                    {idx > 0 && <View style={styles.dividerLine} />}
                    <View style={styles.checkupCardContent}>
                      <View style={styles.checkupHeaderRow}>
                        <View style={styles.checkupTitleWithIcon}>
                          <StethoscopeIcon size={18} color={P.twBlue700} />
                          <Text style={styles.checkupTitle}>{chk.title}</Text>
                        </View>
                        <Text style={styles.checkupDoctor}>{chk.doctor}</Text>
                      </View>
                      <Text style={styles.checkupDescription}>{chk.description}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            </View>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB 2: FEED                                                        */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'Feed' && (
            <View style={styles.tabContentContainer}>
              {/* Section: FEED REFERENCE */}
              <Text style={styles.sectionHeaderTitle}>FEED REFERENCE</Text>
              <View style={styles.whiteCardContainer}>
                {/* Feed type */}
                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Feed type</Text>
                  <Text style={styles.tableValueBold}>Organic fodder + concentrate</Text>
                </View>
                <View style={styles.dividerLine} />

                {/* Source */}
                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Source</Text>
                  <Text style={styles.tableValueBold}>Own-farm grown</Text>
                </View>
                <View style={styles.dividerLine} />

                {/* Grazing */}
                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Grazing</Text>
                  <Text style={styles.tableValueBold}>Upper paddock · 5 h/day</Text>
                </View>
                <View style={styles.dividerLine} />

                {/* Water source */}
                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Water source</Text>
                  <View style={styles.waterSourceValRow}>
                    <Text style={styles.tableValueBold}>Borewell</Text>
                    <LinkChainIcon size={14} color={P.twBlue600} />
                  </View>
                </View>
              </View>

              {/* Water source helper caption */}
              <Text style={styles.footnoteCaption}>
                Water source read from Field Context (Screen 18) — not re-entered here.
              </Text>

              {/* Section: DAILY FEED LOG */}
              <Text style={styles.sectionHeaderTitle}>DAILY FEED LOG</Text>
              <View style={styles.whiteCardContainer}>
                {/* Log 1 */}
                <View style={styles.itemRow}>
                  <View style={styles.tanIconSquare}>
                    <SproutFodderIcon size={18} color={P.twAmber800} />
                  </View>
                  <View style={styles.itemMainCol}>
                    <Text style={styles.itemTitle}>Green fodder</Text>
                    <Text style={styles.itemSubtitle}>16 Jul</Text>
                  </View>
                  <Text style={styles.itemAmountBold}>18 kg</Text>
                </View>

                <View style={styles.dividerLine} />

                {/* Log 2 */}
                <View style={styles.itemRow}>
                  <View style={styles.tanIconSquare}>
                    <ConcentrateMeshIcon size={18} color={P.twAmber800} />
                  </View>
                  <View style={styles.itemMainCol}>
                    <Text style={styles.itemTitle}>Concentrate mix</Text>
                    <Text style={styles.itemSubtitle}>15 Jul</Text>
                  </View>
                  <Text style={styles.itemAmountBold}>3 kg</Text>
                </View>

                <View style={styles.dividerLine} />

                {/* Log 3 */}
                <View style={styles.itemRow}>
                  <View style={styles.tanIconSquare}>
                    <SproutFodderIcon size={18} color={P.twAmber800} />
                  </View>
                  <View style={styles.itemMainCol}>
                    <Text style={styles.itemTitle}>Green fodder</Text>
                    <Text style={styles.itemSubtitle}>14 Jul</Text>
                  </View>
                  <Text style={styles.itemAmountBold}>17 kg</Text>
                </View>
              </View>
            </View>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB 3: BREEDING                                                    */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'Breeding' && (
            <View style={styles.tabContentContainer}>
              {/* Section: CURRENT CYCLE */}
              <Text style={styles.sectionHeaderTitle}>CURRENT CYCLE</Text>
              <View style={styles.whiteCardContainer}>
                <View style={styles.cycleTopRow}>
                  <View style={styles.pregnantBadgePill}>
                    <Text style={styles.pregnantBadgeText}>Confirmed pregnant</Text>
                  </View>
                  <Text style={styles.cycleCountText}>Cycle 3</Text>
                </View>

                <View style={styles.cycleGridRow}>
                  {/* Left column: Bred */}
                  <View style={styles.cycleGridCol}>
                    <Text style={styles.cycleGridLabel}>Bred</Text>
                    <Text style={styles.cycleGridValBold}>12 Feb</Text>
                    <Text style={styles.cycleGridSubtext}>AI</Text>
                  </View>

                  {/* Right column: Expected delivery */}
                  <View style={styles.cycleGridCol}>
                    <Text style={styles.cycleGridLabel}>Expected delivery</Text>
                    <Text style={styles.cycleGridValBold}>20 Nov 2026</Text>
                    <Text style={styles.cycleGridCountdown}>≈ 4 months away</Text>
                  </View>
                </View>
              </View>

              {/* Section: CALVING HISTORY */}
              <Text style={styles.sectionHeaderTitle}>CALVING HISTORY</Text>
              <View style={styles.whiteCardContainer}>
                <View style={styles.calvingHeaderRow}>
                  <CalfCowIcon size={19} color={P.twAmber800} />
                  <Text style={styles.calvingTitle}>Delivered · 14 Mar 2025</Text>
                </View>

                <Text style={styles.calvingDescription}>
                  Female calf — not yet registered as an animal.
                </Text>

                <TouchableOpacity
                  style={styles.registerOffspringBtn}
                  onPress={handleRegisterOffspring}
                  activeOpacity={0.8}
                >
                  <PlusCircleGreenIcon size={18} color={colors.brandGreen} />
                  <Text style={styles.registerOffspringBtnText}>Register offspring</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB 4: PRODUCTION                                                  */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'Production' && (
            <View style={styles.tabContentContainer}>
              {/* Milk Yield Summary Card — real, from today's production logs */}
              <View style={styles.whiteCardContainer}>
                <View style={styles.yieldSummaryHeader}>
                  <Text style={styles.yieldSummaryLabel}>Milk yield · today</Text>
                  <View style={styles.gradeBadgePill}>
                    <Text style={styles.gradeBadgeText}>
                      {todaySessionCount} {todaySessionCount === 1 ? 'session' : 'sessions'}
                    </Text>
                  </View>
                </View>

                <View style={styles.yieldNumberRow}>
                  <Text style={styles.yieldBigNumber}>{todayYieldLiters.toFixed(1)}</Text>
                  <Text style={styles.yieldUnitText}>L</Text>
                </View>

                {/* Sparkline Chart — decorative; no per-day series in the schema */}
                <View style={styles.sparklineContainer}>
                  <Svg width="100%" height={36} viewBox="0 0 260 36">
                    <Path
                      d="M 10 24 Q 45 18, 80 20 T 140 13 T 200 11 T 250 15"
                      fill="none"
                      stroke={colors.brandGreen}
                      strokeWidth="2.4"
                      strokeLinecap="round"
                    />
                  </Svg>
                </View>

                <Text style={styles.last7DaysText}>Last 7 days</Text>
              </View>

              {/* Withdrawal Warning Alert */}
              {withdrawalActive && animal?.withdrawalUntil && (
                <View style={styles.productionAlertCard}>
                  <ProhibitedCircleIcon size={17} color={P.twOrange700} />
                  <Text style={styles.productionAlertText}>
                    Under withdrawal — not for sale until {formatShortDate(animal.withdrawalUntil)}.
                  </Text>
                </View>
              )}

              {/* Section: DAILY YIELD LOG — real, from listProductionLogs */}
              <Text style={styles.sectionHeaderTitle}>DAILY YIELD LOG</Text>
              {productionLogs.length === 0 ? (
                <View style={styles.whiteCardContainer}>
                  <Text style={styles.itemSubtitle}>No milk yield logged yet.</Text>
                </View>
              ) : (
                <View style={styles.whiteCardContainer}>
                  {productionLogs.map((log, idx) => (
                    <React.Fragment key={log.id}>
                      <View style={styles.itemRow}>
                        <View style={styles.blueIconSquare}>
                          <MilkDropletIcon size={17} color={P.twBlue600} />
                        </View>
                        <View style={styles.itemMainCol}>
                          <Text style={styles.itemTitle}>
                            {formatShortDate(log.loggedOn)}
                            {log.sessions ? ` · ${log.sessions} sessions` : ''}
                          </Text>
                          {log.notes ? <Text style={styles.itemSubtitle}>{log.notes}</Text> : null}
                        </View>
                        <Text style={styles.itemAmountBold}>{log.quantity} L</Text>
                      </View>
                      {idx < productionLogs.length - 1 && <View style={styles.dividerLine} />}
                    </React.Fragment>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB 5: HOUSING                                                     */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'Housing' && (
            <View style={styles.tabContentContainer}>
              {/* Section: HOUSING */}
              <Text style={styles.sectionHeaderTitle}>HOUSING</Text>
              <View style={styles.whiteCardContainer}>
                <View style={styles.housingHeaderRow}>
                  <BarnOutlineIcon size={18} color={P.twAmber800} />
                  <Text style={styles.housingHeaderTitle}>Barn (night) + grazing (day)</Text>
                </View>

                {/* 2 Stat metric boxes */}
                <View style={styles.housingBoxesRow}>
                  <View style={styles.housingMetricBox}>
                    <View style={styles.metricValRow}>
                      <Text style={styles.metricValNumber}>12</Text>
                      <Text style={styles.metricValUnit}>sq.ft</Text>
                    </View>
                    <Text style={styles.metricValLabel}>Per animal</Text>
                  </View>

                  <View style={styles.housingMetricBox}>
                    <View style={styles.metricValRow}>
                      <Text style={styles.metricValNumber}>≥ 11</Text>
                      <Text style={styles.metricValUnit}>sq.ft</Text>
                    </View>
                    <Text style={styles.metricValLabel}>NPOP minimum</Text>
                  </View>
                </View>
              </View>

              {/* Welfare standards compliance banner */}
              <View style={styles.welfareNoticeCard}>
                <ShieldCheckBadgeIcon size={20} />
                <View style={styles.welfareNoticeCol}>
                  <Text style={styles.welfareNoticeTitle}>Meets welfare & space standards</Text>
                  <Text style={styles.welfareNoticeSubtitle}>Above NPOP organic minimum for cattle.</Text>
                </View>
              </View>

              {/* Section: HYGIENE LOG */}
              <Text style={styles.sectionHeaderTitle}>HYGIENE LOG</Text>
              <View style={styles.whiteCardContainer}>
                <View style={styles.itemRow}>
                  <View style={styles.greenIconSquare}>
                    <BroomCleaningIcon size={17} color={colors.brandGreen} />
                  </View>
                  <View style={styles.itemMainCol}>
                    <Text style={styles.itemTitle}>Bedding replaced</Text>
                    <Text style={styles.itemSubtitle}>16 Jul</Text>
                  </View>
                </View>

                <View style={styles.dividerLine} />

                <View style={styles.itemRow}>
                  <View style={styles.greenIconSquare}>
                    <BroomCleaningIcon size={17} color={colors.brandGreen} />
                  </View>
                  <View style={styles.itemMainCol}>
                    <Text style={styles.itemTitle}>Barn washed</Text>
                    <Text style={styles.itemSubtitle}>14 Jul</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ADD HEALTH RECORD MODAL (Exact design from spec)                    */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={isAddHealthModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsAddHealthModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <StatusBar barStyle="dark-content" backgroundColor={P.white} />

          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalBackBtn}
              onPress={() => setIsAddHealthModalVisible(false)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <GreenBackArrowIcon size={24} color={P.twGreen700} />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Add Health Record</Text>
          </View>

          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Animal Summary Card */}
            <View style={styles.modalAnimalCard}>
              <View style={styles.modalAvatarContainer}>
                <CowAvatarIcon size={44} />
              </View>
              <View style={styles.modalAnimalInfoCol}>
                <Text style={styles.modalAnimalName}>{displayName}</Text>
                <View style={styles.modalAnimalSubtitleRow}>
                  <Text style={styles.modalAnimalSubtitle}>
                    {displayCode} · {displaySpecies} · {displayBreed} ·{' '}
                  </Text>
                  <GenderSymbolIcon size={12} color={P.twGray500} />
                  <Text style={styles.modalAnimalSubtitle}> · {displayAge}</Text>
                </View>
              </View>
            </View>

            {/* Field 1: Record type * */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                Record type <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={styles.recordTypeGrid}>
                <View style={styles.recordTypeRow}>
                  <TouchableOpacity
                    style={[
                      styles.recordTypePill,
                      recordType === 'Vaccination'
                        ? styles.recordTypePillActive
                        : styles.recordTypePillInactive,
                    ]}
                    onPress={() => setRecordType('Vaccination')}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.recordTypePillText,
                        recordType === 'Vaccination'
                          ? styles.recordTypePillTextActive
                          : styles.recordTypePillTextInactive,
                      ]}
                    >
                      Vaccination
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.recordTypePill,
                      recordType === 'Deworming'
                        ? styles.recordTypePillActive
                        : styles.recordTypePillInactive,
                    ]}
                    onPress={() => setRecordType('Deworming')}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.recordTypePillText,
                        recordType === 'Deworming'
                          ? styles.recordTypePillTextActive
                          : styles.recordTypePillTextInactive,
                      ]}
                    >
                      Deworming
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.recordTypeRow}>
                  <TouchableOpacity
                    style={[
                      styles.recordTypePill,
                      recordType === 'Checkup'
                        ? styles.recordTypePillActive
                        : styles.recordTypePillInactive,
                    ]}
                    onPress={() => setRecordType('Checkup')}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.recordTypePillText,
                        recordType === 'Checkup'
                          ? styles.recordTypePillTextActive
                          : styles.recordTypePillTextInactive,
                      ]}
                    >
                      Checkup
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.recordTypePill,
                      recordType === 'Treatment'
                        ? styles.recordTypePillActive
                        : styles.recordTypePillInactive,
                    ]}
                    onPress={() => setRecordType('Treatment')}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.recordTypePillText,
                        recordType === 'Treatment'
                          ? styles.recordTypePillTextActive
                          : styles.recordTypePillTextInactive,
                      ]}
                    >
                      Treatment
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Field 2: Record date * */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                Record date <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={styles.formInputContainer}>
                <FormCalendarIcon size={18} color={P.twGray500} />
                <TextInput
                  style={styles.formInputWithIcon}
                  value={recordDate}
                  onChangeText={setRecordDate}
                  placeholder="e.g. 12 Jul 2026"
                  placeholderTextColor={P.twGray400}
                />
              </View>
            </View>

            {/* Field 3: Veterinarian */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Veterinarian</Text>
              <TouchableOpacity
                style={styles.formDropdownTrigger}
                onPress={() => setIsVetDropdownOpen(!isVetDropdownOpen)}
                activeOpacity={0.8}
              >
                <Text style={styles.formDropdownSelectedText}>{veterinarian}</Text>
                <FormChevronDownIcon size={18} color={P.twGray500} />
              </TouchableOpacity>
              {isVetDropdownOpen && (
                <View style={styles.formDropdownMenu}>
                  {VET_OPTIONS.map((vet) => (
                    <TouchableOpacity
                      key={vet}
                      style={[
                        styles.formDropdownItem,
                        veterinarian === vet && styles.formDropdownItemActive,
                      ]}
                      onPress={() => {
                        setVeterinarian(vet);
                        setIsVetDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.formDropdownItemText,
                          veterinarian === vet && styles.formDropdownItemTextActive,
                        ]}
                      >
                        {vet}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Field 4: Vaccine name * */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                Vaccine name <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TextInput
                style={styles.formTextInput}
                value={vaccineName}
                onChangeText={setVaccineName}
                placeholder="e.g. FMD vaccine"
                placeholderTextColor={P.twGray400}
              />
            </View>

            {/* Field 5: Dose * */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                Dose <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={styles.doseRow}>
                <View style={styles.doseValueContainer}>
                  <TextInput
                    style={styles.formTextInput}
                    value={dose}
                    onChangeText={setDose}
                    keyboardType="decimal-pad"
                    placeholder="e.g. 2"
                    placeholderTextColor={P.twGray400}
                  />
                </View>
                <TouchableOpacity
                  style={styles.doseUnitContainer}
                  onPress={() => setIsDoseUnitDropdownOpen(!isDoseUnitDropdownOpen)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.formDropdownSelectedText}>{doseUnit}</Text>
                  <FormChevronDownIcon size={18} color={P.twGray500} />
                </TouchableOpacity>
              </View>
              {isDoseUnitDropdownOpen && (
                <View style={styles.formDropdownMenu}>
                  {DOSE_UNIT_OPTIONS.map((unit) => (
                    <TouchableOpacity
                      key={unit}
                      style={[
                        styles.formDropdownItem,
                        doseUnit === unit && styles.formDropdownItemActive,
                      ]}
                      onPress={() => {
                        setDoseUnit(unit);
                        setIsDoseUnitDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.formDropdownItemText,
                          doseUnit === unit && styles.formDropdownItemTextActive,
                        ]}
                      >
                        {unit}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Field 6: Administration route */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Administration route</Text>
              <TouchableOpacity
                style={styles.formDropdownTrigger}
                onPress={() => setIsAdminRouteDropdownOpen(!isAdminRouteDropdownOpen)}
                activeOpacity={0.8}
              >
                <Text style={styles.formDropdownSelectedText}>{adminRoute}</Text>
                <FormChevronDownIcon size={18} color={P.twGray500} />
              </TouchableOpacity>
              {isAdminRouteDropdownOpen && (
                <View style={styles.formDropdownMenu}>
                  {ADMIN_ROUTE_OPTIONS.map((route) => (
                    <TouchableOpacity
                      key={route}
                      style={[
                        styles.formDropdownItem,
                        adminRoute === route && styles.formDropdownItemActive,
                      ]}
                      onPress={() => {
                        setAdminRoute(route);
                        setIsAdminRouteDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.formDropdownItemText,
                          adminRoute === route && styles.formDropdownItemTextActive,
                        ]}
                      >
                        {route}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Field 7: Batch / Lot number */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Batch / Lot number</Text>
              <TextInput
                style={styles.formTextInput}
                value={batchNumber}
                onChangeText={setBatchNumber}
                placeholder="e.g. FMD-2026-001"
                placeholderTextColor={P.twGray400}
              />
            </View>

            {/* Field 8: Next vaccination date */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Next vaccination date</Text>
              <View style={styles.formInputContainer}>
                <FormCalendarIcon size={18} color={P.twGray500} />
                <TextInput
                  style={[styles.formInputWithIcon, { flex: 1, marginHorizontal: 8 }]}
                  value={nextVaccinationDate}
                  onChangeText={setNextVaccinationDate}
                  placeholder="e.g. 10 Oct 2026"
                  placeholderTextColor={P.twGray400}
                />
                <FormCalendarIcon size={18} color={P.twGray500} />
              </View>
            </View>

            {/* Field 9: Notes */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Notes</Text>
              <TextInput
                style={styles.formNotesInput}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                placeholder="Enter notes or observations..."
                placeholderTextColor={P.twGray400}
                textAlignVertical="top"
              />
            </View>

            {/* Field 10: Attachment (optional) */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Attachment (optional)</Text>
              {attachment ? (
                <View style={styles.attachmentCard}>
                  <View style={styles.attachmentLeft}>
                    <ReceiptDocIcon size={36} />
                    <View style={styles.attachmentMetaCol}>
                      <Text style={styles.attachmentFilename}>{attachment.name}</Text>
                      <Text style={styles.attachmentSize}>{attachment.size}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.attachmentRemoveBtn}
                    onPress={() => setAttachment(null)}
                    accessibilityRole="button"
                    accessibilityLabel="Remove Attachment"
                  >
                    <FormCloseIcon size={16} color={P.twGray600} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.attachmentUploadBox}
                  onPress={() => setAttachment({ name: 'vaccine_receipt.jpg', size: '240 KB' })}
                  activeOpacity={0.7}
                >
                  <Text style={styles.attachmentUploadText}>
                    + Attach receipt or prescription (JPG, PNG, PDF)
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Form Bottom Action Buttons */}
            <View style={styles.modalActionButtonsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsAddHealthModalVisible(false)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveHealthRecord}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Save"
              >
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  container: {
    flex: 1,
    backgroundColor: P.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
    backgroundColor: P.white,
  },
  circleHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: '700',
    color: P.nearBlack,
    letterSpacing: -0.2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // Profile Header Card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatarCircle: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: P.paleCreamBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBadgeDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: P.twOrange600,
    borderWidth: 2,
    borderColor: P.white,
  },
  profileInfoCol: {
    flex: 1,
  },
  profileCode: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.twGray700,
    marginBottom: 2,
  },
  profileSubtitle: {
    fontSize: typography.body,
    color: P.twGray500,
  },
  statusBadgePill: {
    backgroundColor: colors.brandGreenLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: colors.brandGreen,
  },

  // Horizontal Tabs
  tabScrollView: {
    marginBottom: 10,
  },
  tabScrollContent: {
    gap: 8,
    paddingVertical: 2,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: P.twGray100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  tabButtonActive: {
    backgroundColor: colors.brandGreen,
  },
  tabButtonText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: P.twGray700,
  },
  tabButtonTextActive: {
    color: P.white,
  },

  // Scroll Indicator Bar
  scrollIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  arrowTriangleLeft: {
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderRightWidth: 6,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: P.twGray400,
  },
  arrowTriangleRight: {
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderLeftWidth: 6,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: P.twGray400,
  },
  sliderTrack: {
    width: 140,
    height: 6,
    borderRadius: 3,
    backgroundColor: P.twGray200,
    overflow: 'hidden',
  },
  sliderThumb: {
    width: 80,
    height: 6,
    borderRadius: 3,
    backgroundColor: P.twGray500,
  },

  // Generic Containers
  tabContentContainer: {
    gap: 12,
  },
  sectionHeaderTitle: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.8,
    marginTop: 8,
  },
  whiteCardContainer: {
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  greenIconSquare: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.brandGreenLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tanIconSquare: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: P.paleCreamBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  blueIconSquare: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: P.blue50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemMainCol: {
    flex: 1,
  },
  itemTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.nearBlack,
  },
  itemSubtitle: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginTop: 2,
  },
  itemAmountBold: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.nearBlack,
  },
  dueDateBadge: {
    backgroundColor: P.twGray100,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  dueDateBadgeText: {
    fontSize: typography.bodySmall,
    fontWeight: '600',
    color: P.twGray600,
  },
  dividerLine: {
    height: 1,
    backgroundColor: P.twGray100,
    marginVertical: 8,
  },

  // ── Health Styles ──
  organicNoticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: P.sageTintBg,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: P.sageBorder,
  },
  organicNoticeIconCol: {
    marginTop: 1,
  },
  organicNoticeText: {
    flex: 1,
    fontSize: typography.bodySmall,
    lineHeight: 18,
    color: P.twGray700,
    fontWeight: '500',
  },
  withdrawalAlertCard: {
    flexDirection: 'row',
    backgroundColor: P.twOrange50,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: P.twOrange200,
  },
  withdrawalLeftAccentBar: {
    width: 4,
    backgroundColor: P.twOrange600,
  },
  withdrawalCardInner: {
    flex: 1,
    padding: 14,
    gap: 4,
  },
  withdrawalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  withdrawalTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.twOrange700,
  },
  withdrawalBody: {
    fontSize: typography.bodySmall,
    color: P.twGray600,
    lineHeight: 18,
    paddingLeft: 27,
  },
  boldText: {
    fontWeight: '700',
    color: P.nearBlack,
  },
  checkupCardContent: {
    paddingVertical: 4,
    gap: 6,
  },
  checkupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkupTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkupTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.nearBlack,
  },
  checkupDoctor: {
    fontSize: typography.bodySmall,
    color: P.twGray400,
  },
  checkupDescription: {
    fontSize: typography.bodySmall,
    color: P.twGray600,
    lineHeight: 18,
    marginTop: 2,
  },

  // ── Feed Styles ──
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  tableLabel: {
    fontSize: typography.body,
    color: P.twGray500,
  },
  tableValueBold: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.nearBlack,
  },
  waterSourceValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footnoteCaption: {
    fontSize: typography.bodySmall,
    color: P.twGray400,
    lineHeight: 16,
    paddingHorizontal: 4,
    marginTop: -2,
  },

  // ── Breeding Styles ──
  cycleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  pregnantBadgePill: {
    backgroundColor: colors.brandGreenLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  pregnantBadgeText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: colors.brandGreen,
  },
  cycleCountText: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    fontWeight: '500',
  },
  cycleGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cycleGridCol: {
    flex: 1,
    gap: 2,
  },
  cycleGridLabel: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
  },
  cycleGridValBold: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.nearBlack,
    marginTop: 2,
  },
  cycleGridSubtext: {
    fontSize: typography.bodySmall,
    color: P.twGray400,
  },
  cycleGridCountdown: {
    fontSize: typography.bodySmall,
    color: colors.brandGreen,
    fontWeight: '600',
  },
  calvingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  calvingTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.nearBlack,
  },
  calvingDescription: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginBottom: 14,
  },
  registerOffspringBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.brandGreen,
    borderRadius: 12,
    paddingVertical: 11,
    backgroundColor: P.white,
  },
  registerOffspringBtnText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.brandGreen,
  },

  // ── Production Styles ──
  yieldSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  yieldSummaryLabel: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
  },
  gradeBadgePill: {
    backgroundColor: colors.brandGreenLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  gradeBadgeText: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: colors.brandGreen,
  },
  yieldNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 8,
  },
  yieldBigNumber: {
    fontSize: typography.headline,
    fontWeight: '700',
    color: P.nearBlack,
  },
  yieldUnitText: {
    fontSize: typography.bodyLarge,
    fontWeight: '600',
    color: P.twGray500,
  },
  sparklineContainer: {
    height: 36,
    marginVertical: 4,
  },
  last7DaysText: {
    fontSize: typography.bodySmall,
    color: P.twGray400,
    marginTop: 4,
  },
  productionAlertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: P.twOrange50,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: P.twOrange200,
  },
  productionAlertText: {
    fontSize: typography.bodySmall,
    fontWeight: '600',
    color: P.twOrange700,
  },

  // ── Housing Styles ──
  housingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  housingHeaderTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.nearBlack,
  },
  housingBoxesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  housingMetricBox: {
    flex: 1,
    backgroundColor: P.twGray50,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: P.twGray100,
  },
  metricValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  metricValNumber: {
    fontSize: typography.title,
    fontWeight: '700',
    color: P.nearBlack,
  },
  metricValUnit: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    fontWeight: '500',
  },
  metricValLabel: {
    fontSize: typography.bodySmall,
    color: P.twGray400,
    marginTop: 4,
  },
  welfareNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: P.sageTintBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: P.sageBorder,
  },
  welfareNoticeCol: {
    flex: 1,
    gap: 2,
  },
  welfareNoticeTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.brandGreen,
  },
  welfareNoticeSubtitle: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
  },

  // ── Health Top Bar ──
  healthTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    marginBottom: 6,
  },
  healthTopBarTitleCol: {
    flex: 1,
  },
  healthTopBarTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.nearBlack,
  },
  healthTopBarSubtitle: {
    fontSize: typography.bodySmall,
    color: P.twGray500,
    marginTop: 1,
  },
  addHealthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.brandGreen,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: colors.brandGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  addHealthButtonText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.white,
  },

  // ── Add Health Record Modal Styles ──
  modalSafeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
    gap: 12,
  },
  modalBackBtn: {
    padding: 4,
    marginLeft: -4,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: P.twGray900,
  },
  modalScrollView: {
    flex: 1,
    backgroundColor: P.white,
  },
  modalScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 36,
    gap: 14,
  },
  modalAnimalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 16,
    padding: 12,
    gap: 12,
  },
  modalAvatarContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAnimalInfoCol: {
    flex: 1,
  },
  modalAnimalName: {
    fontSize: 16,
    fontWeight: '700',
    color: P.nearBlack,
    marginBottom: 2,
  },
  modalAnimalSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalAnimalSubtitle: {
    fontSize: 12,
    color: P.twGray500,
  },
  formGroup: {
    gap: 6,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: P.twGray700,
  },
  requiredAsterisk: {
    color: P.twRed600,
    fontWeight: '700',
  },
  recordTypeGrid: {
    gap: 8,
  },
  recordTypeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  recordTypePill: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordTypePillActive: {
    backgroundColor: colors.brandGreen,
  },
  recordTypePillInactive: {
    backgroundColor: P.twGray100,
    borderWidth: 1,
    borderColor: P.twGray200,
  },
  recordTypePillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  recordTypePillTextActive: {
    color: P.white,
    fontWeight: '700',
  },
  recordTypePillTextInactive: {
    color: P.twGray700,
  },
  formInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: P.twGray300,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: P.white,
  },
  formInputWithIcon: {
    flex: 1,
    fontSize: 15,
    color: P.nearBlack,
    paddingVertical: 0,
    paddingLeft: 8,
  },
  formTextInput: {
    height: 48,
    borderWidth: 1,
    borderColor: P.twGray300,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: P.nearBlack,
    backgroundColor: P.white,
  },
  formDropdownTrigger: {
    height: 48,
    borderWidth: 1,
    borderColor: P.twGray300,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: P.white,
  },
  formDropdownSelectedText: {
    fontSize: 15,
    color: P.nearBlack,
  },
  formDropdownMenu: {
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
    elevation: 3,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  formDropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  formDropdownItemActive: {
    backgroundColor: colors.brandGreenLight,
  },
  formDropdownItemText: {
    fontSize: 14,
    color: P.twGray800,
  },
  formDropdownItemTextActive: {
    color: colors.brandGreen,
    fontWeight: '700',
  },
  doseRow: {
    flexDirection: 'row',
    gap: 10,
  },
  doseValueContainer: {
    flex: 1.8,
  },
  doseUnitContainer: {
    flex: 1.2,
    height: 48,
    borderWidth: 1,
    borderColor: P.twGray300,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: P.white,
  },
  formNotesInput: {
    height: 80,
    borderWidth: 1,
    borderColor: P.twGray300,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: P.nearBlack,
    backgroundColor: P.white,
  },
  attachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: P.twGray50,
    borderWidth: 1,
    borderColor: P.twGray200,
    borderRadius: 12,
    padding: 10,
  },
  attachmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  attachmentMetaCol: {
    flex: 1,
  },
  attachmentFilename: {
    fontSize: 13,
    fontWeight: '600',
    color: P.nearBlack,
  },
  attachmentSize: {
    fontSize: 12,
    color: P.twGray500,
    marginTop: 2,
  },
  attachmentRemoveBtn: {
    padding: 8,
  },
  attachmentUploadBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: P.twGray300,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.twGray50,
  },
  attachmentUploadText: {
    fontSize: 13,
    color: colors.brandGreen,
    fontWeight: '600',
  },
  modalActionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    marginBottom: 16,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.brandGreen,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.white,
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.brandGreen,
  },
  saveBtn: {
    flex: 1,
    height: 48,
    backgroundColor: colors.brandGreen,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: P.white,
  },
});
