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
import { adminColors, adminRadius, adminSpacing, adminType, adminShadow, adminOverlay } from '../../theme';
import { t } from '../../i18n';
export * from './fixtures';
import {
  INSPECTION_SECTIONS,
  ALL_CROPS,
  ALL_PLOTS,
  ALL_WATER_SOURCES,
  ALL_STEP6_WATER_SOURCES,
  ALL_WATER_USE_PURPOSES,
  type Step6WaterSourceEntry,
  type Step7SectionKey,
  type Step7SectionData,
  STEP7_SECTIONS_CONFIG,
  STEP7_INSPECTION_RESULTS,
  STEP7_EXISTING_EVIDENCES,
  type Step8EvidenceEntry,
  STEP8_EVIDENCE_CATEGORIES,
  STEP8_DOCUMENT_TYPES,
  STEP8_VERIFICATION_STATUSES,
  STEP8_MISSING_REASONS,
  STEP8_RELATED_SECTIONS,
  type Step9ObservationEntry,
  STEP9_OBSERVATION_CATEGORIES,
  STEP9_FOLLOWUP_RECOMMENDATIONS,
  STEP9_FOLLOWUP_REQUIRED_OPTIONS,
  STEP10_OVERALL_ASSESSMENT_OPTIONS,
  STEP10_FOLLOWUP_REQUIRED_OPTIONS,
  STEP10_RECOMMENDATION_OPTIONS,
  STEP11_AUDIT_TYPES,
  type Step11RatingCategory,
  STEP11_RATING_CATEGORIES,
  type Step12RatingCategory,
  STEP12_RATING_CATEGORIES,
  type AuditScheduleRecord,
  INITIAL_SCHEDULE_RECORDS,
} from './fixtures';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

function CertCheckIcon({ size = 18, color = adminColors.success.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M8.5 12.5l2.5 2.5 4.5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PlusIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-3.5-3.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

function TimelineCalendarIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="1.8" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function TimelineInspectionIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="17" rx="3" stroke={color} strokeWidth="1.8" />
      <Path d="M9 2h6v3H9z" stroke={color} strokeWidth="1.6" />
      <Line x1="8" y1="11" x2="16" y2="11" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8" y1="15" x2="13" y2="15" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function TimelineCompletedIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path d="M8 12l2.5 2.5L16 9.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}


function PdfDocIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

function ChevronRightIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m9 18 6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronLeftIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m15 18-6-6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BanSlashIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Line x1="5.6" y1="5.6" x2="18.4" y2="18.4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function HeaderBellIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

function PendingCircleIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" fill="none" />
    </Svg>
  );
}


function VerifiedBadgeIcon({ size = 18, color = adminColors.success.text }: { size?: number; color?: string }) {
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
function FlagIcon({ size = 18, color = adminColors.danger.text }: { size?: number; color?: string }) {
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
function LockIcon({ size = 14, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect width="18" height="11" x="3" y="11" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

/** Exact Lucide chevron-down icon for dropdown selectors */
function ChevronDownIcon({ size = 16, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m6 9 6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Exact diagonal double-slash resize handle in bottom right of textarea */
function ResizeHandleIcon({ size = 12, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <Line x1="11" y1="5" x2="5" y2="11" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="11" y1="9" x2="9" y2="11" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

/** Exact Lucide circle-play (Circle with play arrow inside) */
function CirclePlayIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8" />
      <Path d="m10 8 6 4-6 4V8z" fill={color} />
    </Svg>
  );
}

/** Exact Lucide newspaper (Inspection card icon) */
function NewspaperIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
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
function ClipboardCheckIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
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
function HardHatIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
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
function FileTextIcon({ size = 19, color = adminColors.brand }: { size?: number; color?: string }) {
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
function UploadFileIcon({ size = 19, color = adminColors.brand }: { size?: number; color?: string }) {
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
function DownloadIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="m7 10 5 5 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 15V3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

/** Lucide x (close) icon for modal close button */
function CloseXIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6 6 18M6 6l12 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Lucide sliders-horizontal (for Crops Grown field trigger) */
function SlidersHorizontalIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
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
function CheckSquareIcon({ checked = false, size = 18, color = adminColors.brand }: { checked?: boolean; size?: number; color?: string }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: checked ? color : adminColors.border,
        backgroundColor: checked ? color : adminColors.card,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {checked && (
        <Svg width={size - 5} height={size - 5} viewBox="0 0 24 24" fill="none">
          <Path d="M20 6L9 17l-5-5" stroke={adminColors.onBrand} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      )}
    </View>
  );
}

/** Radio button dot component for single-select Plot/Zone and Water Source */
function RadioDotIcon({ selected = false, size = 18, color = adminColors.brand }: { selected?: boolean; size?: number; color?: string }) {
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
        backgroundColor: adminColors.card,
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
function CalendarIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
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
function ChevronUpIcon({ size = 16, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m18 15-6-6-6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Up arrow icon for calendar header navigation */
function ArrowUpIcon({ size = 16, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 19V5M12 5L6 11M12 5L18 11" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Down arrow icon for calendar header navigation */
function ArrowDownIcon({ size = 16, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5V19M12 19L6 13M12 19L18 13" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Solid downward triangle icon for dropdown selector */
function SolidTriangleDownIcon({ size = 10, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={Math.round(size * 0.7)} viewBox="0 0 10 7" fill="none">
      <Path d="M5 6.5L0.5 0.5H9.5L5 6.5Z" fill={color} />
    </Svg>
  );
}

/** Lucide info icon for banner */
function InfoIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8" />
      <Line x1="12" y1="16" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="8" x2="12.01" y2="8" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

/** Lucide ban/prohibited icon for read-only notice */
function ProhibitedIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8" />
      <Line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

/** Exact Lucide layers-2 icon for Soil & Land Management */
function LayersIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
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
function TractorIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
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
function LeafIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
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
  color = adminColors.brand,
  leafColor,
}: {
  size?: number;
  color?: string;
  leafColor?: string;
}) {
  const isWhite = color?.toLowerCase() === adminColors.onBrand.toLowerCase() || color?.toLowerCase() === 'white';
  const resolvedLeafColor = leafColor ?? (isWhite ? color : adminColors.muted);

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
function QrCodeIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
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
function UsersIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
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
function LandmarkIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
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
function StoreIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
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
function LightbulbIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M9 18h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M10 22h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function GreenLeafOutlineIcon({ size = 18, color = adminColors.success.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function GreenFileTextOutlineIcon({ size = 18, color = adminColors.success.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="16" y1="13" x2="8" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="16" y1="17" x2="8" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="10" y1="9" x2="8" y2="9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function GreenCloudUploadOutlineIcon({ size = 18, color = adminColors.success.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 12v9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="m16 16-4-4-4 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function GreenNotesOutlineIcon({ size = 18, color = adminColors.success.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
  const [showScheduleFilterModal, setShowScheduleFilterModal] = useState(false);

  // Filtered schedule records for List mode
  const filteredScheduleRecords = useMemo(() => {
    return records.filter((rec) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = rec.farmerName.toLowerCase().includes(q);
        const matchId = rec.id.toLowerCase().includes(q);
        const matchFarmerId = rec.farmerId ? rec.farmerId.toLowerCase().includes(q) : false;
        const matchFarm = rec.farm.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchFarmerId && !matchFarm) return false;
      }

      if (appliedAuditType !== 'All') {
        if (rec.type !== appliedAuditType) return false;
      }

      if (appliedStatus !== 'All') {
        if (rec.badge !== appliedStatus) return false;
      }

      if (appliedDate !== 'Today') {
        if (appliedDate === 'This Week') {
          if (rec.dateBucket !== 'This Week' && rec.dateBucket !== 'Today') return false;
        } else if (appliedDate === 'This Month') {
          if (rec.dateBucket !== 'This Month' && rec.dateBucket !== 'This Week' && rec.dateBucket !== 'Today') return false;
        }
      }

      return true;
    });
  }, [records, searchQuery, appliedAuditType, appliedStatus, appliedDate]);

  const getScheduleRecordBadge = (badge: string) => {
    switch (badge) {
      case 'Upcoming':
        return { wrap: styles.badgeUpcoming, text: styles.badgeUpcomingText };
      case 'Scheduled':
        return { wrap: styles.badgeScheduled, text: styles.badgeScheduledText };
      case 'In Progress':
        return { wrap: styles.badgeInProgress, text: styles.badgeInProgressText };
      case 'Completed':
      default:
        return { wrap: styles.badgeCompleted, text: styles.badgeCompletedText };
    }
  };

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

  // Step 11 Form state (Add External Audit - Screenshots 1 & 3)
  const [step11AuditType, setStep11AuditType] = useState<string>('Select Audit Type');
  const [step11AuditTypeOpen, setStep11AuditTypeOpen] = useState<boolean>(false);
  const [step11IssuingOrg, setStep11IssuingOrg] = useState<string>('');
  const [step11AuditDate, setStep11AuditDate] = useState<string>('');
  const [step11ReportExpiryDate, setStep11ReportExpiryDate] = useState<string>('');
  const [step11NextAuditDate, setStep11NextAuditDate] = useState<string>('');
  const [step11ActiveDateField, setStep11ActiveDateField] = useState<'auditDate' | 'expiryDate' | 'nextAuditDate' | null>(null);
  const [step11UploadedReport, setStep11UploadedReport] = useState<{ name: string; size: string } | null>(null);
  const [step11Remarks, setStep11Remarks] = useState<string>('');

  // Step 12 Form state (Farmer Rating - Screenshot 4)
  const [step12Scores, setStep12Scores] = useState<Record<string, number | null>>({
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
  const [step12ExpandedCategory, setStep12ExpandedCategory] = useState<string | null>(null);

  const step12RatedCount = useMemo(() => {
    return Object.values(step12Scores).filter((s) => s !== null).length;
  }, [step12Scores]);

  const step12TotalScore = useMemo(() => {
    return Object.values(step12Scores).reduce<number>((acc, s) => acc + (s || 0), 0);
  }, [step12Scores]);

  // Aliases for compatibility
  const step11Scores = step12Scores;
  const setStep11Scores = setStep12Scores;
  const step11ExpandedCategory = step12ExpandedCategory;
  const setStep11ExpandedCategory = setStep12ExpandedCategory;
  const step11RatedCount = step12RatedCount;
  const step11TotalScore = step12TotalScore;

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
          <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

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
                  <BackArrowIcon size={22} color={adminColors.onBrand} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Audit Schedule</Text>
              </View>

              <TouchableOpacity
                style={styles.headerFilterCircleBtn}
                onPress={() => {
                  setDraftAuditType(appliedAuditType);
                  setDraftStatus(appliedStatus);
                  setDraftDate(appliedDate);
                  setShowScheduleFilterModal(true);
                }}
                activeOpacity={0.8}
                accessibilityLabel="Filters"
              >
                <FilterSlidersIcon size={19} color={adminColors.onBrand} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Search Bar (Image 1 Center: "Farmer name, Farmer ID, Audit ID, Farm, Zone") ── */}
          <View style={styles.searchBarContainer}>
            <View style={styles.searchIconWrap}>
              <SearchIcon size={18} color={adminColors.muted} />
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Farmer name, Farmer ID, Audit ID, Farm, Zone"
              placeholderTextColor={adminColors.muted}
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
            {filteredScheduleRecords.map((rec) => {
              const badgeStyle = getScheduleRecordBadge(rec.badge);
              return (
                <TouchableOpacity
                  key={rec.id}
                  style={styles.scheduleRecordCard}
                  onPress={() => {
                    setSelectedRecord(rec);
                    setPreviousView('calendar');
                    setCurrentView('detail');
                  }}
                  activeOpacity={0.85}
                >
                  <View style={styles.scheduleRecordCardTopRow}>
                    <Text style={styles.scheduleRecordCardId}>{rec.id}</Text>
                    <View style={badgeStyle.wrap}>
                      <Text style={badgeStyle.text}>{rec.badge}</Text>
                    </View>
                  </View>
                  <Text style={styles.scheduleRecordCardSub}>
                    {rec.farmerName} · {rec.farm} · {rec.type}
                  </Text>
                  <Text style={styles.scheduleRecordCardMeta}>
                    {rec.date} · {rec.assignedText || 'Assigned Auditor'}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {filteredScheduleRecords.length === 0 && (
              <View style={[styles.infoNoteCard, { marginTop: 14, alignItems: 'center' }]}>
                <Text style={[styles.infoNoteText, { textAlign: 'center' }]}>
                  No audit schedules match the selected filters.
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setAppliedAuditType('All');
                    setAppliedStatus('All');
                    setAppliedDate('Today');
                    setSearchQuery('');
                  }}
                  style={{ marginTop: 8 }}
                >
                  <Text style={{ ...adminType.caption, fontWeight: '800', color: adminColors.brandDeep }}>
                    Reset Filters
                  </Text>
                </TouchableOpacity>
              </View>
            )}

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
                setCurrentView('detail');
              }}
              activeOpacity={0.85}
            >
              <PlusIcon size={18} color={adminColors.onBrand} />
              <Text style={styles.addScheduleVisitBtnText}>Schedule Field Visit</Text>
            </TouchableOpacity>
          </View>

          {/* ─── FILTERS BOTTOM SHEET MODAL (Image 1) ─── */}
          <Modal
            visible={showScheduleFilterModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowScheduleFilterModal(false)}
          >
            <View style={styles.filterModalOverlay}>
              <TouchableOpacity
                style={styles.filterModalDismissArea}
                onPress={() => setShowScheduleFilterModal(false)}
                activeOpacity={1}
              />
              <View style={styles.filterModalSheet}>
                {/* Header: Sliders icon + Filters */}
                <View style={styles.filterModalHeaderRow}>
                  <View style={styles.filterModalTitleWrap}>
                    <FilterSlidersIcon size={20} color={adminColors.brandDeep} />
                    <Text style={styles.filterModalTitleText}>Filters</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowScheduleFilterModal(false)}
                    activeOpacity={0.7}
                    accessibilityLabel="Close"
                  >
                    <CloseXIcon size={20} color={adminColors.ink} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.filterModalScroll} showsVerticalScrollIndicator={false}>
                  {/* Section 1: Audit Type */}
                  <Text style={styles.filterModalSectionLabel}>Audit Type</Text>
                  <View style={styles.filterModalPillsRow}>
                    {(['All', 'Internal', 'External', 'Field Visit'] as const).map((type) => {
                      const isSel = draftAuditType === type;
                      return (
                        <TouchableOpacity
                          key={type}
                          style={[
                            styles.filterModalPill,
                            isSel ? styles.filterModalPillActive : styles.filterModalPillInactive,
                          ]}
                          onPress={() => setDraftAuditType(type)}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.filterModalPillText,
                              isSel ? styles.filterModalPillTextActive : styles.filterModalPillTextInactive,
                            ]}
                          >
                            {type}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Section 2: Status */}
                  <Text style={styles.filterModalSectionLabel}>Status</Text>
                  <View style={styles.filterModalPillsRow}>
                    {(['All', 'Upcoming', 'Scheduled', 'In Progress'] as const).map((st) => {
                      const isSel = draftStatus === st;
                      return (
                        <TouchableOpacity
                          key={st}
                          style={[
                            styles.filterModalPill,
                            isSel ? styles.filterModalPillActive : styles.filterModalPillInactive,
                          ]}
                          onPress={() => setDraftStatus(st)}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.filterModalPillText,
                              isSel ? styles.filterModalPillTextActive : styles.filterModalPillTextInactive,
                            ]}
                          >
                            {st}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Section 3: Date */}
                  <Text style={styles.filterModalSectionLabel}>Date</Text>
                  <View style={styles.filterModalPillsRow}>
                    {(['Today', 'This Week', 'This Month', 'Custom'] as const).map((d) => {
                      const isSel = draftDate === d;
                      return (
                        <TouchableOpacity
                          key={d}
                          style={[
                            styles.filterModalPill,
                            isSel ? styles.filterModalPillActive : styles.filterModalPillInactive,
                          ]}
                          onPress={() => setDraftDate(d)}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.filterModalPillText,
                              isSel ? styles.filterModalPillTextActive : styles.filterModalPillTextInactive,
                            ]}
                          >
                            {d}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Bottom Action Buttons */}
                  <View style={styles.filterModalActionRow}>
                    <TouchableOpacity
                      style={styles.filterModalApplyBtn}
                      onPress={() => {
                        setAppliedAuditType(draftAuditType);
                        setAppliedStatus(draftStatus);
                        setAppliedDate(draftDate);
                        setShowScheduleFilterModal(false);
                      }}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.filterModalApplyBtnText}>Apply Filters</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.filterModalResetBtn}
                      onPress={() => {
                        setDraftAuditType('All');
                        setDraftStatus('All');
                        setDraftDate('Today');
                        setAppliedAuditType('All');
                        setAppliedStatus('All');
                        setAppliedDate('Today');
                        setShowScheduleFilterModal(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.filterModalResetBtnText}>Reset</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.filterModalCancelBtn}
                      onPress={() => setShowScheduleFilterModal(false)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.filterModalCancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.calRoot}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

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
                <BackArrowIcon size={22} color={adminColors.onBrand} />
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
              <HeaderBellIcon size={20} color={adminColors.onBrand} />
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
              <ChevronLeftIcon size={18} color={adminColors.muted} />
            </TouchableOpacity>

            <Text style={styles.calMonthNavTitle}>October 2026</Text>

            <TouchableOpacity
              style={styles.calMonthNavBtn}
              onPress={() => Alert.alert('Calendar', 'Showing November 2026')}
              activeOpacity={0.7}
            >
              <ChevronRightIcon size={18} color={adminColors.muted} />
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
                        <View style={[styles.calDotSingle, { backgroundColor: adminColors.card }]} />
                      ) : hasGreenDot ? (
                        <View style={[styles.calDotSingle, { backgroundColor: adminColors.success.text }]} />
                      ) : hasThreeDots ? (
                        <View style={styles.calDotsRow}>
                          <View style={styles.calDotMini} />
                          <View style={styles.calDotMini} />
                          <View style={styles.calDotMini} />
                        </View>
                      ) : hasOrangeDot ? (
                        <View style={[styles.calDotSingle, { backgroundColor: adminColors.brand }]} />
                      ) : hasGreyDot ? (
                        <View style={[styles.calDotSingle, { backgroundColor: adminColors.muted }]} />
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
              <View style={styles.calAuditCard}>
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
                    const targetRecord = INITIAL_SCHEDULE_RECORDS.find(r => r.id === 'AUD-2026-0042') ?? INITIAL_SCHEDULE_RECORDS[0]!;
                    setSelectedRecord(targetRecord);
                    setPreviousView('calendar');
                    setCurrentView('audit_details_m5');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.calViewDetailsText}>View Audit Details →</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN: AUDIT DETAILS (Image 1 Right Screen & Image 2)
  // ───────────────────────────────────────────────────────────────────────────
  if (currentView === 'audit_details_m5') {
    const record = selectedRecord ?? INITIAL_SCHEDULE_RECORDS[0]!;

    return (
      <SafeAreaView style={styles.rootOrange}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Solid Theme Orange Header */}
        <View style={styles.screenHeader}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() => {
              setCurrentView('calendar');
            }}
            activeOpacity={0.7}
            accessibilityLabel="Back"
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.screenHeaderTitle}>Audit Details</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Text style={{ ...adminType.caption, color: adminColors.onBrand, fontWeight: '600' }}>
                {record.type || 'Internal'}
              </Text>
              <Text style={{ color: adminColors.onBrand, fontWeight: '700' }}>·</Text>
              <View style={styles.auditDetailsHeaderPill}>
                <Text style={styles.auditDetailsHeaderPillText}>
                  {record.badge || 'Upcoming'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.detailScrollPad}
          showsVerticalScrollIndicator={false}
        >
          {/* Section 1: Farmer Information */}
          <Text style={styles.detailSectionTitle}>Farmer Information</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailGridRow}>
              <View style={styles.detailGridCol}>
                <Text style={styles.detailMetaLabel}>Farmer</Text>
                <Text style={styles.detailMetaValue}>{record.farmerName || 'Ramesh Kumar'}</Text>
              </View>
              <View style={styles.detailGridCol}>
                <Text style={styles.detailMetaLabel}>Farmer ID</Text>
                <Text style={styles.detailMetaValue}>{record.farmerId || 'FR-00124'}</Text>
              </View>
            </View>

            <View style={[styles.detailGridRow, { marginTop: 14 }]}>
              <View style={styles.detailGridCol}>
                <Text style={styles.detailMetaLabel}>Zone</Text>
                <Text style={styles.detailMetaValue}>{(record as any).zone || 'Ooty'}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.outlineOrangeBtn}
              onPress={() => onNavigateFarmerProfile?.(record.farmerId || 'FR-00124')}
              activeOpacity={0.8}
            >
              <Text style={styles.outlineOrangeBtnText}>View Farmer Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Section 2: Audit Information */}
          <Text style={styles.detailSectionTitle}>Audit Information</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailGridRow}>
              <View style={styles.detailGridCol}>
                <Text style={styles.detailMetaLabel}>Audit ID</Text>
                <Text style={styles.detailMetaValue}>{record.id || 'AUD-2026-0042'}</Text>
              </View>
              <View style={styles.detailGridCol}>
                <Text style={styles.detailMetaLabel}>Type</Text>
                <Text style={styles.detailMetaValue}>{record.type || 'Internal'}</Text>
              </View>
            </View>

            <View style={[styles.detailGridRow, { marginTop: 14 }]}>
              <View style={styles.detailGridCol}>
                <Text style={styles.detailMetaLabel}>Scheduled Date</Text>
                <Text style={styles.detailMetaValue}>{record.date || '15 Oct 2026'}</Text>
              </View>
              <View style={styles.detailGridCol}>
                <Text style={styles.detailMetaLabel}>Status</Text>
                <Text style={styles.detailMetaValue}>{record.badge || 'Upcoming'}</Text>
              </View>
            </View>

            <View style={[styles.detailGridRow, { marginTop: 14 }]}>
              <View style={styles.detailGridCol}>
                <Text style={styles.detailMetaLabel}>Auditor</Text>
                <Text style={styles.detailMetaValue}>{record.auditor || 'Priya'}</Text>
              </View>
            </View>
          </View>

          {/* Section 3: Farm */}
          <Text style={styles.detailSectionTitle}>Farm</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailGridRow}>
              <View style={styles.detailGridCol}>
                <Text style={styles.detailMetaLabel}>Farm Name</Text>
                <Text style={styles.detailMetaValue}>{record.farm || 'Ooty Farm 01'}</Text>
              </View>
              <View style={styles.detailGridCol}>
                <Text style={styles.detailMetaLabel}>Farming Method</Text>
                <Text style={styles.detailMetaValue}>{record.farmingType || 'Organic'}</Text>
              </View>
            </View>
          </View>

          {/* Section 4: Documents */}
          <Text style={styles.detailSectionTitle}>Documents</Text>
          <TouchableOpacity
            style={styles.documentRowCard}
            onPress={() => setCurrentView('pdf_viewer')}
            activeOpacity={0.8}
          >
            <PdfDocIcon size={20} color={adminColors.brand} />
            <Text style={styles.documentRowTitle}>Checklist.pdf</Text>
            <ChevronRightIcon size={18} color={adminColors.muted} />
          </TouchableOpacity>

          {/* Section 5: Audit Checklist */}
          <Text style={styles.detailSectionTitle}>Audit Checklist</Text>
          <View style={styles.checklistCard}>
            <View style={styles.checklistRow}>
              <Text style={styles.checklistLabel}>Farm Documentation</Text>
              <View style={styles.checklistPendingRow}>
                <View style={styles.pendingCircleOutline} />
                <Text style={styles.checklistPendingText}>Pending</Text>
              </View>
            </View>

            <View style={styles.checklistDivider} />

            <View style={styles.checklistRow}>
              <Text style={styles.checklistLabel}>Organic Practices</Text>
              <View style={styles.checklistPendingRow}>
                <View style={styles.pendingCircleOutline} />
                <Text style={styles.checklistPendingText}>Pending</Text>
              </View>
            </View>

            <View style={styles.checklistDivider} />

            <View style={styles.checklistRow}>
              <Text style={styles.checklistLabel}>Crop Management</Text>
              <View style={styles.checklistPendingRow}>
                <View style={styles.pendingCircleOutline} />
                <Text style={styles.checklistPendingText}>Pending</Text>
              </View>
            </View>

            <View style={styles.checklistDivider} />

            <View style={styles.checklistRow}>
              <Text style={styles.checklistLabel}>Input Usage</Text>
              <View style={styles.checklistPendingRow}>
                <View style={styles.pendingCircleOutline} />
                <Text style={styles.checklistPendingText}>Pending</Text>
              </View>
            </View>
          </View>



          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN: CHECKLIST PDF VIEWER (Image 3)
  // ───────────────────────────────────────────────────────────────────────────
  if (currentView === 'pdf_viewer') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: adminColors.canvas }}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* ── Terracotta Header (Image 3) ── */}
        <View style={styles.pdfHeader}>
          <TouchableOpacity
            onPress={() => setCurrentView('audit_details_m5')}
            activeOpacity={0.7}
            style={{ padding: 4 }}
          >
            <PdfDocIcon size={24} color={adminColors.onBrand} />
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
              <PdfDocIcon size={72} color={adminColors.muted} />
              <Text style={{ ...adminType.rowTitle, color: adminColors.muted, marginTop: 12 }}>
                Audit Checklist Document Preview
              </Text>
              <Text style={{ ...adminType.body, color: adminColors.muted, marginTop: 4 }}>
                AUD-2026-0042 · Official Inspection Checklist
              </Text>
            </View>

            {/* Simulated document lines */}
            <View style={{ gap: 10, opacity: 0.15 }}>
              <View style={{ height: 12, backgroundColor: adminColors.ink, borderRadius: 4, width: '90%' }} />
              <View style={{ height: 12, backgroundColor: adminColors.ink, borderRadius: 4, width: '100%' }} />
              <View style={{ height: 12, backgroundColor: adminColors.ink, borderRadius: 4, width: '75%' }} />
              <View style={{ height: 12, backgroundColor: adminColors.ink, borderRadius: 4, width: '85%' }} />
              <View style={{ height: 12, backgroundColor: adminColors.ink, borderRadius: 4, width: '60%' }} />
            </View>
          </ScrollView>
        </View>

        {/* ── Bottom Bar: Download + Close (Image 3) ── */}
        <View style={styles.pdfBottomBarRow}>
          <TouchableOpacity
            style={styles.pdfDownloadBtn}
            onPress={() => Alert.alert('Download', 'Downloading Checklist.pdf')}
            activeOpacity={0.8}
          >
            <Text style={styles.pdfDownloadBtnText}>Download</Text>
          </TouchableOpacity>

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
  // SCREEN: AUDIT AUD-2026-0042 DETAIL (Image 2 Right)
  // ───────────────────────────────────────────────────────────────────────────
  if (currentView === 'detail') {
    const record = selectedRecord ?? INITIAL_SCHEDULE_RECORDS[0]!;

    return (
      <SafeAreaView style={styles.rootOrange}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Solid Theme Orange Header */}
        <View style={styles.screenHeader}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() => {
              setCalendarViewMode('List');
              setCurrentView('calendar');
            }}
            activeOpacity={0.7}
            accessibilityLabel="Back"
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.screenHeaderTitle}>Audit {record.id || 'AUD-2026-0042'}</Text>
            <Text style={styles.screenHeaderSub}>Status: {record.badge || 'Upcoming'}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.detailScrollPad, { paddingBottom: 120 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Section 1: Audit Information */}
          <Text style={styles.detailSectionTitle}>Audit Information</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailGridRow}>
              <View style={styles.detailGridCol}>
                <Text style={styles.detailMetaLabel}>Audit ID</Text>
                <Text style={styles.auditSummaryValBold}>{record.id || 'AUD-2026-0042'}</Text>
              </View>
              <View style={styles.detailGridCol}>
                <Text style={styles.detailMetaLabel}>Audit Type</Text>
                <Text style={styles.auditSummaryValBold}>{record.type || 'Internal'}</Text>
              </View>
            </View>

            <View style={[styles.detailGridRow, { marginTop: 14 }]}>
              <View style={styles.detailGridCol}>
                <Text style={styles.detailMetaLabel}>Scheduled Date</Text>
                <Text style={styles.auditSummaryValBold}>{record.date || '15 Oct 2026'}</Text>
              </View>
              <View style={styles.detailGridCol}>
                <Text style={styles.detailMetaLabel}>Farm</Text>
                <Text style={styles.auditSummaryValBold}>{record.farm || 'Ooty Farm 01'}</Text>
              </View>
            </View>

            <View style={[styles.detailGridRow, { marginTop: 14 }]}>
              <View style={styles.detailGridCol}>
                <Text style={styles.detailMetaLabel}>Auditor</Text>
                <Text style={styles.auditSummaryValBold}>{record.assignedText || 'Assigned Auditor'}</Text>
              </View>
            </View>
          </View>

          {/* Section 2: Farmer Information */}
          <Text style={styles.detailSectionTitle}>Farmer Information</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailGridRow}>
              <View style={styles.detailGridCol}>
                <Text style={styles.detailMetaLabel}>Farmer Name</Text>
                <Text style={styles.auditSummaryValBold}>{record.farmerName || 'Ramesh Kumar'}</Text>
              </View>
              <View style={styles.detailGridCol}>
                <Text style={styles.detailMetaLabel}>Farmer ID</Text>
                <Text style={styles.auditSummaryValBold}>{record.farmerId || 'FR-00241'}</Text>
              </View>
            </View>

            <View style={[styles.detailGridRow, { marginTop: 14 }]}>
              <View style={styles.detailGridCol}>
                <Text style={styles.detailMetaLabel}>Farming Type</Text>
                <Text style={styles.auditSummaryValBold}>{record.farmingType || 'Organic'}</Text>
              </View>
              <View style={styles.detailGridCol}>
                <Text style={styles.detailMetaLabel}>Years Organic</Text>
                <Text style={styles.auditSummaryValBold}>{record.yearsOrganic || '6'}</Text>
              </View>
            </View>
          </View>

          {/* Section 3: Certification */}
          <Text style={styles.detailSectionTitle}>Certification</Text>
          <View style={{ gap: 12 }}>
            {/* Card 1: PGS Organic */}
            <View style={styles.detailCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <CertCheckIcon size={20} color={adminColors.success.text} />
                <Text style={{ ...adminType.rowTitle, color: adminColors.ink, marginLeft: 8, fontWeight: '700' }}>
                  PGS Organic
                </Text>
              </View>
              <View style={styles.detailGridRow}>
                <View style={styles.detailGridCol}>
                  <Text style={styles.detailMetaLabel}>Status</Text>
                  <Text style={[styles.auditSummaryValBold, { color: adminColors.success.text }]}>Active</Text>
                </View>
                <View style={styles.detailGridCol}>
                  <Text style={styles.detailMetaLabel}>Renewal Date</Text>
                  <Text style={styles.auditSummaryValBold}>12 Jun 2027</Text>
                </View>
              </View>
            </View>

            {/* Card 2: NPOP */}
            <View style={styles.detailCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <CertCheckIcon size={20} color={adminColors.success.text} />
                <Text style={{ ...adminType.rowTitle, color: adminColors.ink, marginLeft: 8, fontWeight: '700' }}>
                  NPOP
                </Text>
              </View>
              <View style={styles.detailGridRow}>
                <View style={styles.detailGridCol}>
                  <Text style={styles.detailMetaLabel}>Status</Text>
                  <Text style={[styles.auditSummaryValBold, { color: adminColors.success.text }]}>Active</Text>
                </View>
                <View style={styles.detailGridCol}>
                  <Text style={styles.detailMetaLabel}>Renewal Date</Text>
                  <Text style={styles.auditSummaryValBold}>01 Mar 2027</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Section 4: Previous Audit Summary matching Image 2 */}
          <Text style={styles.detailSectionTitle}>Previous Audit Summary</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailGridRow}>
              <View style={styles.detailGridCol}>
                <Text style={styles.detailMetaLabel}>Previous Date</Text>
                <Text style={styles.auditSummaryValBold}>15 Jul 2026</Text>
              </View>
              <View style={styles.detailGridCol}>
                <Text style={styles.detailMetaLabel}>Previous Score</Text>
                <Text style={styles.auditSummaryValBold}>80/100</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.outlineOrangeBtn}
              onPress={() => {
                setPreviousView('detail');
                setCurrentView('history');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.outlineOrangeBtnText}>View Audit History</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* Bottom Action Buttons: Support Audit & Schedule Field Visit (Image 2) */}
        <View style={styles.detailBottomActionRow}>
          <TouchableOpacity
            style={styles.primaryOrangeBtn}
            onPress={() => {
              setPreviousView('detail');
              setCurrentView('inspection');
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryOrangeBtnText}>Support Audit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryWhiteBtn, { borderColor: adminColors.brand }]}
            onPress={() => {
              setPreviousView('detail');
              setCurrentView('schedule_visit');
            }}
            activeOpacity={0.85}
          >
            <Text style={[styles.secondaryWhiteBtnText, { color: adminColors.brand, fontWeight: '700' }]}>
              Schedule Field Visit
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCREEN: AUDIT DETAIL SCREEN (History & Reports)
  // ───────────────────────────────────────────────────────────────────────────
  if (currentView === 'audit_detail') {
    return (
      <SafeAreaView style={styles.rootOrange}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

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
            <BackArrowIcon size={22} color={adminColors.onBrand} />
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
            <FilterSlidersIcon size={19} color={adminColors.onBrand} />
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
                <TimelineCalendarIcon size={18} color={adminColors.brand} />
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
                <TimelineInspectionIcon size={18} color={adminColors.brand} />
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
                <TimelineCompletedIcon size={18} color={adminColors.brand} />
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
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

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
            <BackArrowIcon size={22} color={adminColors.onBrand} />
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
            <DownloadIcon size={18} color={adminColors.onBrand} />
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
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

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
            <BackArrowIcon size={22} color={adminColors.onBrand} />
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
              placeholderTextColor={adminColors.muted}
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
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Solid Theme Orange Header */}
        <View style={styles.screenHeader}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() => {
              if (previousView === 'audit_details_m5') {
                setCurrentView('audit_details_m5');
              } else {
                setCurrentView('detail');
              }
            }}
            activeOpacity={0.7}
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
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

          {/* Red Flag Alert Banner (Shown when Red Flag mode is active, matching Image 3) */}
          {inspectionMode === 'Red Flag' && (
            <View style={styles.redFlagBanner}>
              <FlagIcon size={18} color={adminColors.danger.text} />
              <Text style={styles.redFlagBannerText}>
                Red Flag — major violation threshold breached.
              </Text>
            </View>
          )}

          {/* Section 1: Audit Information (Button removed per user request) */}
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
              <Text style={[styles.summaryKpiValueDark, { color: adminColors.danger.text }]}>1</Text>
            </View>
            <View style={styles.summaryKpiCard}>
              <Text style={styles.summaryKpiLabel}>MINOR FINDINGS</Text>
              <Text style={styles.summaryKpiValueAmber}>1</Text>
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

          <View style={[styles.findingCard, { marginTop: 10 }]}>
            <Text style={styles.findingTitle}>Certification issue</Text>
            <View style={styles.findingBadgesRow}>
              <View style={styles.majorBadge}>
                <Text style={styles.majorBadgeText}>Major</Text>
              </View>
              <View style={styles.resolvedBadge}>
                <Text style={styles.resolvedBadgeText}>Resolved</Text>
              </View>
            </View>
          </View>

          {/* Section 5: Violations */}
          <Text style={styles.detailSectionTitle}>Violations</Text>
          <View style={styles.findingCard}>
            <Text style={styles.findingTitle}>NPOP certification documentation</Text>
            <View style={styles.findingBadgesRow}>
              <View style={styles.majorBadge}>
                <Text style={styles.majorBadgeText}>Major</Text>
              </View>
              <View style={styles.openBadge}>
                <Text style={styles.openBadgeText}>Open</Text>
              </View>
            </View>
          </View>

          {/* Section 6: Audit Timeline */}
          <Text style={styles.detailSectionTitle}>Audit Timeline</Text>
          <View style={styles.timelineCard}>
            <View style={styles.timelineRow}>
              <View style={styles.timelineTileOrange}>
                <CirclePlayIcon size={16} color={adminColors.brand} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.timelineItemTitle}>Audit Started</Text>
                <Text style={styles.timelineItemMeta}>15 Oct 2026, 9:40 AM</Text>
              </View>
            </View>

            <View style={[styles.checklistDivider, { marginVertical: 12 }]} />

            <View style={styles.timelineRow}>
              <View style={styles.timelineTileOrange}>
                <TimelineInspectionIcon size={16} color={adminColors.brand} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.timelineItemTitle}>Inspection</Text>
                <Text style={styles.timelineItemMeta}>15 Oct 2026, 10:15 AM</Text>
              </View>
            </View>

            <View style={[styles.checklistDivider, { marginVertical: 12 }]} />

            <View style={styles.timelineRow}>
              <View style={styles.timelineTileGray}>
                <PendingCircleIcon size={16} color={adminColors.muted} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.timelineItemTitle}>Findings Recorded</Text>
                <Text style={styles.timelineItemMeta}>Pending</Text>
              </View>
            </View>
          </View>

          {/* Section 7: Supporting Evidence */}
          <Text style={styles.detailSectionTitle}>Supporting Evidence</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailGridRow}>
              <View style={styles.detailGridCol}>
                <Text style={styles.detailMetaLabel}>Photos</Text>
                <Text style={styles.detailMetaValue}>2 attached</Text>
              </View>
              <View style={styles.detailGridCol}>
                <Text style={styles.detailMetaLabel}>Documents</Text>
                <Text style={styles.detailMetaValue}>1 attached</Text>
              </View>
            </View>

            <View style={{ marginTop: 14 }}>
              <Text style={styles.detailMetaLabel}>Notes</Text>
              <Text style={[styles.detailMetaValue, { marginTop: 4, lineHeight: 20 }]}>
                Minor pest sighting noted on plot 2, farmer advised on organic treatment.
              </Text>
            </View>
            {/* Disclaimer note under Supporting Evidence matching Image 4 */}
            <View style={[styles.infoNoteCard, { marginTop: 14 }]}>
              <Text style={styles.infoNoteText}>
                Evidence shown here is read-only for this build — Add Evidence appears only if the backend explicitly grants upload permission.
              </Text>
            </View>
          </View>

          {/* Section 8: Audit Rating matching Image 4 */}
          <Text style={styles.detailSectionTitle}>Audit Rating</Text>
          <View style={styles.ratingCard}>
            <View style={styles.ratingNumberWrap}>
              <Text style={styles.ratingBigScore}>
                {completedInspectionScore !== null ? completedInspectionScore : 0}
              </Text>
              <Text style={styles.ratingTotal}> / 100</Text>
            </View>
            <Text style={styles.ratingCaption}>AUDIT SCORE — VIEW ONLY</Text>
          </View>

          {/* Disclaimer note under Audit Rating matching Image 4 */}
          <View style={[styles.infoNoteCard, { marginTop: 14 }]}>
            <Text style={styles.infoNoteText}>
              No Edit Score, Configure Score Categories, or Configure Rating Tiers — none are Farmer Admin permissions. Audit Score is a different system from Farm Rating (10 categories × 10 points), never merged here.
            </Text>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* Bottom Action matching Image 4 */}
        <View style={styles.singleBottomBar}>
          <TouchableOpacity
            style={styles.startResumeBtn}
            onPress={() => setCurrentView('audit_inspection')}
            activeOpacity={0.85}
          >
            <HardHatIcon size={18} color={adminColors.onBrand} />
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
    const totalSectionsCount = INSPECTION_SECTIONS.length;
    const missingCount = Math.max(0, totalSectionsCount - completedCount);

    return (
      <SafeAreaView style={styles.rootOrange}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Orange Header */}
        <View style={styles.screenHeader}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() => setCurrentView('inspection')}
            activeOpacity={0.7}
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
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
              {completedCount} of {totalSectionsCount} sections complete
            </Text>
            <Text style={styles.progressCardSub}>
              {completedCount === 0
                ? `${totalSectionsCount} required fields are still missing`
                : missingCount > 0
                ? `${missingCount} sections remaining`
                : 'All sections completed'}
            </Text>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${(completedCount / totalSectionsCount) * 100}%` }]} />
            </View>
          </View>

          {/* Section: Inspection sections */}
          <Text style={styles.inspectionSectionsTitle}>Inspection sections</Text>

          {INSPECTION_SECTIONS.map((sec) => {
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
                  <Text style={[styles.stepCardSub, isDone && { color: adminColors.success.text, fontWeight: '700' }]}>
                    {isDone ? 'Completed' : sec.requiredLeft}
                  </Text>
                </View>

                <Text style={[styles.stepCardStatus, isDone && styles.stepCardStatusDone]}>
                  {isDone ? 'Completed' : 'Not Started'}
                </Text>
              </TouchableOpacity>
            );
          })}

          <View style={{ height: 16 }} />
        </ScrollView>

        {/* Bottom Actions matching Image 1: Review & Submit and Save Draft */}
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
              Alert.alert('Draft Saved', 'Your audit inspection progress has been saved as draft.');
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
      if (currentStep < 12) {
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
        setStep11AuditTypeOpen(false);
        setStep11ActiveDateField(null);
        setStep12ExpandedCategory(null);
        setStepDropdownAOpen(false);
        setStepDropdownBOpen(false);
      } else {
        Alert.alert(
          'Inspection Completed',
          'All 12 sections have been successfully completed! Returning to Audit Inspection overview.',
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
                  <Path d="M1 1L5 5L9 1" stroke={adminColors.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
                <ArrowUpIcon size={16} color={adminColors.ink} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleNextMonth}
                style={styles.calendarNavBtn}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 8 }}
                activeOpacity={0.7}
              >
                <ArrowDownIcon size={16} color={adminColors.ink} />
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
                  <Path d="M1 1L5 5L9 1" stroke={adminColors.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
                <ArrowUpIcon size={16} color={adminColors.ink} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleNextMonth}
                style={styles.calendarNavBtn}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 8 }}
                activeOpacity={0.7}
              >
                <ArrowDownIcon size={16} color={adminColors.ink} />
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

    const renderStep11Calendar = () => {
      if (!step11ActiveDateField) return null;

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
        if (step11ActiveDateField === 'auditDate') setStep11AuditDate(formatted);
        else if (step11ActiveDateField === 'expiryDate') setStep11ReportExpiryDate(formatted);
        else if (step11ActiveDateField === 'nextAuditDate') setStep11NextAuditDate(formatted);

        setCalendarSelectedDay(d);
        setCalendarMonth(m);
        setCalendarYear(y);
        setStep11ActiveDateField(null);
      };

      const handleClear = () => {
        if (step11ActiveDateField === 'auditDate') setStep11AuditDate('');
        else if (step11ActiveDateField === 'expiryDate') setStep11ReportExpiryDate('');
        else if (step11ActiveDateField === 'nextAuditDate') setStep11NextAuditDate('');
        setStep11ActiveDateField(null);
      };

      const handleToday = () => {
        const d = 15;
        const m = 9; // October (0-indexed)
        const y = 2026;
        const formatted = '15-10-2026';
        if (step11ActiveDateField === 'auditDate') setStep11AuditDate(formatted);
        else if (step11ActiveDateField === 'expiryDate') setStep11ReportExpiryDate(formatted);
        else if (step11ActiveDateField === 'nextAuditDate') setStep11NextAuditDate(formatted);

        setCalendarSelectedDay(d);
        setCalendarMonth(m);
        setCalendarYear(y);
        setStep11ActiveDateField(null);
      };

      const matrix = getCalendarMatrix(calendarYear, calendarMonth);

      return (
        <View style={[styles.calendarDropdownCard, { marginTop: 10, marginBottom: 16 }]}>
          {/* Header: Month, Year and Navigation arrows */}
          <View style={styles.calendarHeaderRow}>
            <View style={styles.calendarMonthPickerBtn}>
              <Text style={styles.calendarMonthTitle}>
                {CALENDAR_MONTHS[calendarMonth]}, {calendarYear}
              </Text>
              <View style={{ marginLeft: 5, marginTop: 1 }}>
                <Svg width={8} height={5} viewBox="0 0 10 6" fill="none">
                  <Path d="M1 1L5 5L9 1" stroke={adminColors.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
                <ArrowUpIcon size={16} color={adminColors.ink} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleNextMonth}
                style={styles.calendarNavBtn}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 8 }}
                activeOpacity={0.7}
              >
                <ArrowDownIcon size={16} color={adminColors.ink} />
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

          {/* Day Grid */}
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
                    }
                  }}
                  activeOpacity={cell.isCurrentMonth ? 0.7 : 1}
                >
                  <View
                    style={[
                      styles.calendarDayInner,
                      isSelected && styles.calendarDaySelectedInner,
                    ]}
                  >
                    <Text
                      style={[
                        styles.calendarDayNumText,
                        !cell.isCurrentMonth && styles.calendarDayNumOtherMonth,
                        isSelected && styles.calendarDayNumSelected,
                      ]}
                    >
                      {cell.day}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Clear & Today Actions */}
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
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

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
              setStep11AuditTypeOpen(false);
              setStep11ActiveDateField(null);
              setStep12ExpandedCategory(null);
              setStepDropdownAOpen(false);
              setStepDropdownBOpen(false);
              setCurrentView('audit_inspection');
            }}
            activeOpacity={0.7}
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 4 }}>
              <Text style={[styles.screenHeaderTitle, { ...adminType.title, flex: 1 }]} numberOfLines={1}>
                {activeSec.title}
              </Text>
              <View style={styles.headerStepPill}>
                <Text style={styles.headerStepPillText}>
                  {`${currentStep}/12`}
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
                  <LockIcon size={13} color={adminColors.muted} />
                </View>
                <View style={styles.lockedInputBox}>
                  <Text style={styles.lockedInputText}>{selectedRecord.farmerName}</Text>
                </View>
              </View>

              {/* Farmer ID */}
              <View style={styles.formFieldGroup}>
                <View style={styles.labelWithLockRow}>
                  <Text style={styles.formLabel}>Farmer ID</Text>
                  <LockIcon size={13} color={adminColors.muted} />
                </View>
                <View style={styles.lockedInputBox}>
                  <Text style={styles.lockedInputText}>{selectedRecord.farmerId || 'FMR-00124'}</Text>
                </View>
              </View>

              {/* Phone Number */}
              <View style={styles.formFieldGroup}>
                <View style={styles.labelWithLockRow}>
                  <Text style={styles.formLabel}>Phone Number</Text>
                  <LockIcon size={13} color={adminColors.muted} />
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
                  <LockIcon size={13} color={adminColors.muted} />
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
                  <ChevronDownIcon size={16} color={adminColors.ink} />
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
                  Contact Verification Status <Text style={{ color: adminColors.danger.text }}>*</Text>
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
                  <ChevronDownIcon size={16} color={adminColors.ink} />
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
                    placeholderTextColor={adminColors.muted}
                    multiline
                    textAlignVertical="top"
                  />
                  <View style={styles.resizeHandleWrap}>
                    <ResizeHandleIcon size={12} color={adminColors.muted} />
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
                    <FileTextIcon size={19} color={adminColors.brand} />
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
                  <UploadFileIcon size={19} color={adminColors.brand} />
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
                  placeholderTextColor={adminColors.muted}
                />
                <Text style={styles.surveyHelperText}>
                  Not on record — enter it from the document.
                </Text>
              </View>

              {/* FMB Document Available * */}
              <View style={styles.formFieldGroup}>
                <Text style={styles.formLabel}>
                  FMB Document Available <Text style={{ color: adminColors.danger.text }}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.dropdownSelectorBox}
                  onPress={() =>
                    setStep2OpenDropdown(step2OpenDropdown === 'fmbDoc' ? null : 'fmbDoc')
                  }
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownSelectorText}>{fmbDocAvailable}</Text>
                  <ChevronDownIcon size={16} color={adminColors.ink} />
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
                  <ChevronDownIcon size={16} color={adminColors.ink} />
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
                  <ChevronDownIcon size={16} color={adminColors.ink} />
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
                  <ChevronDownIcon size={16} color={adminColors.ink} />
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
                  <ChevronDownIcon size={16} color={adminColors.ink} />
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
                  <ChevronDownIcon size={16} color={adminColors.ink} />
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
                    placeholderTextColor={adminColors.muted}
                    multiline
                    textAlignVertical="top"
                  />
                  <View style={styles.resizeHandleWrap}>
                    <ResizeHandleIcon size={12} color={adminColors.muted} />
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
                  <UploadFileIcon size={19} color={adminColors.brand} />
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
                  <LockIcon size={13} color={adminColors.muted} />
                </View>
                <View style={styles.lockedInputBox}>
                  <Text style={styles.lockedInputText}>Ramesh Organic Farm</Text>
                </View>
              </View>

              {/* Farm ID (Locked) */}
              <View style={styles.formFieldGroup}>
                <View style={styles.labelWithLockRow}>
                  <Text style={styles.formLabel}>Farm ID</Text>
                  <LockIcon size={13} color={adminColors.muted} />
                </View>
                <View style={styles.lockedInputBox}>
                  <Text style={styles.lockedInputText}>FRM-00124-01</Text>
                </View>
              </View>

              {/* Farm Location (Locked) */}
              <View style={styles.formFieldGroup}>
                <View style={styles.labelWithLockRow}>
                  <Text style={styles.formLabel}>Farm Location</Text>
                  <LockIcon size={13} color={adminColors.muted} />
                </View>
                <View style={styles.lockedInputBox}>
                  <Text style={styles.lockedInputText}>Coonoor, Nilgiris</Text>
                </View>
              </View>

              {/* GPS Coordinates (Locked) */}
              <View style={styles.formFieldGroup}>
                <View style={styles.labelWithLockRow}>
                  <Text style={styles.formLabel}>GPS Coordinates</Text>
                  <LockIcon size={13} color={adminColors.muted} />
                </View>
                <View style={styles.lockedInputBox}>
                  <Text style={styles.lockedInputText}>11.3530° N, 76.7959° E</Text>
                </View>
              </View>

              {/* Farm Area (Locked) */}
              <View style={styles.formFieldGroup}>
                <View style={styles.labelWithLockRow}>
                  <Text style={styles.formLabel}>Farm Area</Text>
                  <LockIcon size={13} color={adminColors.muted} />
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
                  <ChevronDownIcon size={16} color={adminColors.ink} />
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
                      selectedCrops.length === 0 && { color: adminColors.muted },
                    ]}
                    numberOfLines={1}
                  >
                    {selectedCrops.length > 0 ? selectedCrops.join(', ') : 'Select...'}
                  </Text>
                  <SlidersHorizontalIcon size={18} color={adminColors.brand} />
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
                      selectedPlotZone === 'Select...' && { color: adminColors.muted },
                    ]}
                  >
                    {selectedPlotZone}
                  </Text>
                  <SearchIcon size={18} color={adminColors.brand} />
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
                      selectedWaterSource === 'Select...' && { color: adminColors.muted },
                    ]}
                  >
                    {selectedWaterSource}
                  </Text>
                  <SearchIcon size={18} color={adminColors.brand} />
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
                  <ChevronDownIcon size={16} color={adminColors.ink} />
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
                  <ChevronDownIcon size={16} color={adminColors.ink} />
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
                  Farm Details Verification <Text style={{ color: adminColors.danger.text }}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.dropdownSelectorBox}
                  onPress={() =>
                    setStep3OpenDropdown(step3OpenDropdown === 'verification' ? null : 'verification')
                  }
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownSelectorText}>{farmDetailsVerification}</Text>
                  <ChevronDownIcon size={16} color={adminColors.ink} />
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
                    placeholderTextColor={adminColors.muted}
                    multiline
                    textAlignVertical="top"
                  />
                  <View style={styles.resizeHandleWrap}>
                    <ResizeHandleIcon size={12} color={adminColors.muted} />
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
                    <ChevronUpIcon size={18} color={adminColors.brandDeep} />
                  ) : (
                    <ChevronDownIcon size={18} color={adminColors.brandDeep} />
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
                        <LockIcon size={13} color={adminColors.muted} />
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
                        <ChevronDownIcon size={16} color={adminColors.ink} />
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
                          <FileTextIcon size={19} color={adminColors.brand} />
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
                        <UploadFileIcon size={19} color={adminColors.brand} />
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
                          placeholderTextColor={adminColors.muted}
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
                          <CalendarIcon size={18} color={adminColors.muted} />
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
                          placeholderTextColor={adminColors.muted}
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
                          <CalendarIcon size={18} color={adminColors.muted} />
                        </TouchableOpacity>
                      </TouchableOpacity>
                      {activeCalendarField === 'pgsExpiry' && renderCalendarDropdown('pgsExpiry')}
                    </View>

                    {/* Document Verification * */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>
                        Document Verification <Text style={{ color: adminColors.danger.text }}>*</Text>
                      </Text>
                      <TouchableOpacity
                        style={styles.dropdownSelectorBox}
                        onPress={() =>
                          setStep4OpenDropdown(step4OpenDropdown === 'pgsDocVerif' ? null : 'pgsDocVerif')
                        }
                        activeOpacity={0.8}
                      >
                        <Text style={styles.dropdownSelectorText}>{pgsDocVerification}</Text>
                        <ChevronDownIcon size={16} color={adminColors.ink} />
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
                          placeholderTextColor={adminColors.muted}
                          multiline
                          textAlignVertical="top"
                        />
                        <View style={styles.resizeHandleWrap}>
                          <ResizeHandleIcon size={12} color={adminColors.muted} />
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
                    <ChevronUpIcon size={18} color={adminColors.brandDeep} />
                  ) : (
                    <ChevronDownIcon size={18} color={adminColors.brandDeep} />
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
                        <LockIcon size={13} color={adminColors.muted} />
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
                        <ChevronDownIcon size={16} color={adminColors.ink} />
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
                          <FileTextIcon size={19} color={adminColors.brand} />
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
                        <UploadFileIcon size={19} color={adminColors.brand} />
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
                          placeholderTextColor={adminColors.muted}
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
                          <CalendarIcon size={18} color={adminColors.muted} />
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
                          placeholderTextColor={adminColors.muted}
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
                          <CalendarIcon size={18} color={adminColors.muted} />
                        </TouchableOpacity>
                      </TouchableOpacity>
                      {activeCalendarField === 'npopExpiry' && renderCalendarDropdown('npopExpiry')}
                    </View>

                    {/* Document Verification * */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>
                        Document Verification <Text style={{ color: adminColors.danger.text }}>*</Text>
                      </Text>
                      <TouchableOpacity
                        style={styles.dropdownSelectorBox}
                        onPress={() =>
                          setStep4OpenDropdown(step4OpenDropdown === 'npopDocVerif' ? null : 'npopDocVerif')
                        }
                        activeOpacity={0.8}
                      >
                        <Text style={styles.dropdownSelectorText}>{npopDocVerification}</Text>
                        <ChevronDownIcon size={16} color={adminColors.ink} />
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
                          placeholderTextColor={adminColors.muted}
                          multiline
                          textAlignVertical="top"
                        />
                        <View style={styles.resizeHandleWrap}>
                          <ResizeHandleIcon size={12} color={adminColors.muted} />
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
                  Soil Report Availability <Text style={{ color: adminColors.danger.text }}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.dropdownSelectorBox}
                  onPress={() => setStep5DropdownOpen(!step5DropdownOpen)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownSelectorText}>{soilReportAvailability}</Text>
                  <SolidTriangleDownIcon size={10} color={adminColors.ink} />
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
                          <Text style={{ ...adminType.rowMeta, color: adminColors.danger.text }}>Remove</Text>
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
                            entry.sourceName === 'Select...' && { color: adminColors.muted },
                          ]}
                        >
                          {entry.sourceName}
                        </Text>
                        <SearchIcon size={18} color={adminColors.brand} />
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
                        <ChevronDownIcon size={16} color={adminColors.ink} />
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
                        placeholderTextColor={adminColors.muted}
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
                            entry.usePurposes.length === 0 && { color: adminColors.muted },
                          ]}
                          numberOfLines={1}
                        >
                          {entry.usePurposes.length > 0 ? entry.usePurposes.join(', ') : 'Select...'}
                        </Text>
                        <SlidersHorizontalIcon size={18} color={adminColors.brand} />
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
                        <ChevronDownIcon size={16} color={adminColors.ink} />
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
                        <ChevronDownIcon size={16} color={adminColors.ink} />
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
                          placeholderTextColor={adminColors.muted}
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
                          <CalendarIcon size={18} color={adminColors.muted} />
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
                        <ChevronDownIcon size={16} color={adminColors.ink} />
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
                        <ChevronDownIcon size={16} color={adminColors.ink} />
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
                        <UploadFileIcon size={19} color={adminColors.brand} />
                        <Text style={styles.dashedUploadText}>
                          {entry.uploadedReport ? entry.uploadedReport : 'Upload file'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* 11. pH Measurement Status * */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>
                        pH Measurement Status <Text style={{ color: adminColors.danger.text }}>*</Text>
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
                        <ChevronDownIcon size={16} color={adminColors.ink} />
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
                        <ChevronDownIcon size={16} color={adminColors.ink} />
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
                          placeholderTextColor={adminColors.muted}
                          multiline
                          textAlignVertical="top"
                        />
                        <View style={styles.resizeHandleWrap}>
                          <ResizeHandleIcon size={12} color={adminColors.muted} />
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
                        Inspection Result <Text style={{ color: adminColors.danger.text }}>*</Text>
                      </Text>
                      <TouchableOpacity
                        style={styles.dropdownSelectorBox}
                        onPress={() => {
                          setStep7OpenDropdown(isDropdownOpen ? null : sec.key);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.dropdownSelectorText}>{data.inspectionResult}</Text>
                        <ChevronDownIcon size={16} color={adminColors.ink} />
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
                          placeholderTextColor={adminColors.muted}
                          multiline
                          textAlignVertical="top"
                        />
                        <View style={styles.resizeHandleWrap}>
                          <ResizeHandleIcon size={12} color={adminColors.muted} />
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
                              color: adminColors.muted,
                              fontWeight: '400',
                            },
                          ]}
                        >
                          {data.evidence || 'Select...'}
                        </Text>
                        <SearchIcon size={17} color={adminColors.brand} />
                      </TouchableOpacity>
                    </View>

                    {/* Upload evidence */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>Upload evidence</Text>
                      {data.uploadedFile ? (
                        <View style={styles.uploadedFileCard}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                            <FileTextIcon size={18} color={adminColors.brand} />
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
                            <CloseXIcon size={16} color={adminColors.danger.text} />
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
                          <UploadFileIcon size={19} color={adminColors.brand} />
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
                  <FileTextIcon size={20} color={adminColors.brand} />
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
                  <FileTextIcon size={20} color={adminColors.brand} />
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
                        Evidence Category <Text style={{ color: adminColors.danger.text }}>*</Text>
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
                        <ChevronDownIcon size={16} color={adminColors.ink} />
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
                        Related Inspection Section <Text style={{ color: adminColors.danger.text }}>*</Text>
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
                              color: adminColors.muted,
                              fontWeight: '400',
                            },
                          ]}
                        >
                          {entry.relatedSection || 'Select...'}
                        </Text>
                        <SearchIcon size={17} color={adminColors.brand} />
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
                        <ChevronDownIcon size={16} color={adminColors.ink} />
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
                            <FileTextIcon size={18} color={adminColors.brand} />
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
                            <CloseXIcon size={16} color={adminColors.danger.text} />
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
                          <UploadFileIcon size={19} color={adminColors.brand} />
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
                        <ChevronDownIcon size={16} color={adminColors.ink} />
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
                        Missing Document Reason <Text style={{ color: adminColors.danger.text }}>*</Text>
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
                        <ChevronDownIcon size={16} color={adminColors.ink} />
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
                          placeholderTextColor={adminColors.muted}
                          multiline
                          textAlignVertical="top"
                        />
                        <View style={styles.resizeHandleWrap}>
                          <ResizeHandleIcon size={12} color={adminColors.muted} />
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
                <InfoIcon size={18} color={adminColors.brand} />
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
                        Related Section <Text style={{ color: adminColors.danger.text }}>*</Text>
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
                              color: adminColors.muted,
                              fontWeight: '400',
                            },
                          ]}
                        >
                          {entry.relatedSection || 'Select...'}
                        </Text>
                        <SearchIcon size={17} color={adminColors.brand} />
                      </TouchableOpacity>
                    </View>

                    {/* Field 2: Observation Category * */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>
                        Observation Category <Text style={{ color: adminColors.danger.text }}>*</Text>
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
                        <ChevronDownIcon size={16} color={adminColors.ink} />
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
                        Observation <Text style={{ color: adminColors.danger.text }}>*</Text>
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
                          placeholderTextColor={adminColors.muted}
                          multiline
                          textAlignVertical="top"
                        />
                        <View style={styles.resizeHandleWrap}>
                          <ResizeHandleIcon size={12} color={adminColors.muted} />
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
                        <ChevronDownIcon size={16} color={adminColors.ink} />
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
                          placeholderTextColor={adminColors.muted}
                          multiline
                          textAlignVertical="top"
                        />
                        <View style={styles.resizeHandleWrap}>
                          <ResizeHandleIcon size={12} color={adminColors.muted} />
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
                              color: adminColors.muted,
                              fontWeight: '400',
                            },
                          ]}
                        >
                          {entry.evidenceReference || 'Select...'}
                        </Text>
                        <SearchIcon size={17} color={adminColors.brand} />
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
                        <ChevronDownIcon size={16} color={adminColors.ink} />
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
                <ProhibitedIcon size={18} color={adminColors.muted} />
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
                  Overall Assessment <Text style={{ color: adminColors.danger.text }}>*</Text>
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
                      step10OverallAssessment === 'Select...' && { color: adminColors.muted, fontWeight: '400' },
                    ]}
                  >
                    {step10OverallAssessment}
                  </Text>
                  <ChevronDownIcon size={16} color={adminColors.ink} />
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
                    placeholderTextColor={adminColors.muted}
                    multiline
                    textAlignVertical="top"
                  />
                  <View style={styles.resizeHandleWrap}>
                    <ResizeHandleIcon size={12} color={adminColors.muted} />
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
                      step10FollowUpRequired === 'Select...' && { color: adminColors.muted, fontWeight: '400' },
                    ]}
                  >
                    {step10FollowUpRequired}
                  </Text>
                  <ChevronDownIcon size={16} color={adminColors.ink} />
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
                      step10Recommendation === 'Select...' && { color: adminColors.muted, fontWeight: '400' },
                    ]}
                  >
                    {step10Recommendation}
                  </Text>
                  <ChevronDownIcon size={16} color={adminColors.ink} />
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
                    placeholderTextColor={adminColors.muted}
                    multiline
                    textAlignVertical="top"
                  />
                  <View style={styles.resizeHandleWrap}>
                    <ResizeHandleIcon size={12} color={adminColors.muted} />
                  </View>
                </View>
              </View>

              {/* Field 6: Official Audit Score (Locked) */}
              <View style={styles.formFieldGroup}>
                <View style={styles.labelWithLockRow}>
                  <Text style={styles.formLabel}>Official Audit Score</Text>
                  <LockIcon size={13} color={adminColors.brand} />
                </View>
                <View style={styles.step10ScoreCard}>
                  <Text style={styles.step10ScoreText}>Not scored yet</Text>
                </View>
                <Text style={styles.step10ScoreCaption}>
                  Audit Rating (max 100) is separate from the Farm Rating module and cannot be edited here.
                </Text>
              </View>
            </View>
          ) : currentStep === 11 ? (
            /* ─── Step 11: Add External Audit (Screenshots 1 & 3) ─── */
            <View>
              {/* Card 1: Farmer & Farm Details */}
              <View style={styles.step11SectionHeaderRow}>
                <GreenLeafOutlineIcon size={18} color={adminColors.success.text} />
                <Text style={styles.step11SectionHeaderTitle}>Farmer & Farm Details</Text>
              </View>

              <View style={styles.step11WhiteCard}>
                {/* Row 1: Farmer ID & Farmer Name */}
                <View style={styles.step11GridRow}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.step11FieldLabel}>Farmer ID</Text>
                    <View style={styles.step11ReadonlyBox}>
                      <Text style={styles.step11ReadonlyText}>{selectedRecord.farmerId || 'F-0256'}</Text>
                    </View>
                  </View>
                  <View style={{ flex: 1.4 }}>
                    <Text style={styles.step11FieldLabel}>Farmer Name</Text>
                    <View style={styles.step11ReadonlyBox}>
                      <Text style={styles.step11ReadonlyText}>{selectedRecord.farmerName || 'Ramesh Kumar'}</Text>
                    </View>
                  </View>
                </View>

                {/* Row 2: Zone, Farms, Total Area */}
                <View style={[styles.step11GridRow, { marginTop: 12 }]}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.step11FieldLabel}>Zone</Text>
                    <View style={styles.step11ReadonlyBox}>
                      <Text style={styles.step11ReadonlyText}>Coonoor</Text>
                    </View>
                  </View>
                  <View style={{ flex: 0.9, marginRight: 8 }}>
                    <Text style={styles.step11FieldLabel}>Farms</Text>
                    <View style={styles.step11ReadonlyBox}>
                      <Text style={styles.step11ReadonlyText}>3</Text>
                    </View>
                  </View>
                  <View style={{ flex: 1.2 }}>
                    <Text style={styles.step11FieldLabel}>Total Area</Text>
                    <View style={styles.step11ReadonlyBox}>
                      <Text style={styles.step11ReadonlyText}>4.25 Acre</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Card 2: External Audit Information */}
              <View style={styles.step11SectionHeaderRow}>
                <GreenFileTextOutlineIcon size={18} color={adminColors.success.text} />
                <Text style={styles.step11SectionHeaderTitle}>External Audit Information</Text>
              </View>

              {/* Field: Issuing Organization * */}
              <View style={styles.formFieldGroup}>
                <Text style={styles.formLabel}>
                  Issuing Organization <Text style={{ color: adminColors.danger.text }}>*</Text>
                </Text>
                <TextInput
                  style={styles.step11Input}
                  value={step11IssuingOrg}
                  onChangeText={setStep11IssuingOrg}
                  placeholder="Enter organization name"
                  placeholderTextColor={adminColors.muted}
                />
              </View>

              {/* Field Row: Audit Date * & Report Expiry Date * */}
              <View style={styles.step11GridRow}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.formLabel}>
                    Audit Date <Text style={{ color: adminColors.danger.text }}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.step11DateSelectorBox}
                    onPress={() =>
                      setStep11ActiveDateField(step11ActiveDateField === 'auditDate' ? null : 'auditDate')
                    }
                    activeOpacity={0.8}
                  >
                    <CalendarIcon size={16} color={adminColors.muted} />
                    <Text
                      style={[
                        styles.step11DateText,
                        !step11AuditDate && { color: adminColors.muted, fontWeight: '400' },
                      ]}
                      numberOfLines={1}
                    >
                      {step11AuditDate || 'Select audit date'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>
                    Report Expiry Date <Text style={{ color: adminColors.danger.text }}>*</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.step11DateSelectorBox}
                    onPress={() =>
                      setStep11ActiveDateField(step11ActiveDateField === 'expiryDate' ? null : 'expiryDate')
                    }
                    activeOpacity={0.8}
                  >
                    <CalendarIcon size={16} color={adminColors.muted} />
                    <Text
                      style={[
                        styles.step11DateText,
                        !step11ReportExpiryDate && { color: adminColors.muted, fontWeight: '400' },
                      ]}
                      numberOfLines={1}
                    >
                      {step11ReportExpiryDate || 'Select expiry date'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Field: Next Audit Date * */}
              <View style={[styles.formFieldGroup, { marginTop: 12 }]}>
                <Text style={styles.formLabel}>
                  Next Audit Date <Text style={{ color: adminColors.danger.text }}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.step11DateSelectorBox}
                  onPress={() =>
                    setStep11ActiveDateField(step11ActiveDateField === 'nextAuditDate' ? null : 'nextAuditDate')
                  }
                  activeOpacity={0.8}
                >
                  <CalendarIcon size={16} color={adminColors.muted} />
                  <Text
                    style={[
                      styles.step11DateText,
                      !step11NextAuditDate && { color: adminColors.muted, fontWeight: '400' },
                    ]}
                    numberOfLines={1}
                  >
                    {step11NextAuditDate || 'Select next audit date'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Calendar Popup Dropdown if active */}
              {renderStep11Calendar()}

              {/* Card 3: Audit Report Upload */}
              <View style={[styles.step11SectionHeaderRow, { marginTop: 8 }]}>
                <GreenCloudUploadOutlineIcon size={18} color={adminColors.success.text} />
                <Text style={styles.step11SectionHeaderTitle}>Audit Report Upload</Text>
              </View>

              <TouchableOpacity
                style={styles.step11UploadDashedBox}
                onPress={() => {
                  if (step11UploadedReport) {
                    Alert.alert('Report Attached', 'Do you want to replace or remove this audit report?', [
                      { text: 'Remove', style: 'destructive', onPress: () => setStep11UploadedReport(null) },
                      { text: 'Keep', style: 'cancel' },
                    ]);
                  } else {
                    setStep11UploadedReport({
                      name: 'External_Audit_Report_2026.pdf',
                      size: '2.4 MB',
                    });
                    Alert.alert('File Uploaded', 'External_Audit_Report_2026.pdf (2.4 MB) uploaded successfully.');
                  }
                }}
                activeOpacity={0.8}
              >
                {step11UploadedReport ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <GreenFileTextOutlineIcon size={24} color={adminColors.brand} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.step11UploadedFileName}>{step11UploadedReport.name}</Text>
                      <Text style={styles.step11UploadedFileSize}>{step11UploadedReport.size} · Tap to manage</Text>
                    </View>
                    <CertCheckIcon size={20} color={adminColors.success.text} />
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <GreenFileTextOutlineIcon size={28} color={adminColors.muted} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.step11UploadTitle}>Tap to upload audit report</Text>
                      <Text style={styles.step11UploadSub}>PDF, JPG, PNG (Max 10 MB)</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Card 4: Additional Details */}
              <View style={[styles.step11SectionHeaderRow, { marginTop: 14 }]}>
                <GreenNotesOutlineIcon size={18} color={adminColors.success.text} />
                <Text style={styles.step11SectionHeaderTitle}>Additional Details</Text>
              </View>

              <View style={styles.formFieldGroup}>
                <Text style={styles.formLabel}>Remarks / Notes</Text>
                <View style={styles.step11TextareaContainer}>
                  <TextInput
                    style={styles.step11TextareaInput}
                    value={step11Remarks}
                    onChangeText={(val) => {
                      if (val.length <= 500) setStep11Remarks(val);
                    }}
                    placeholder="Enter any remarks or notes (optional)"
                    placeholderTextColor={adminColors.muted}
                    multiline
                    maxLength={500}
                    textAlignVertical="top"
                  />
                  <Text style={styles.step11CounterText}>{step11Remarks.length}/500</Text>
                </View>
              </View>
            </View>
          ) : (
            /* ─── Step 12: Farmer Rating (Screenshot 4) ─── */
            <View>
              {/* 10 Category Cards */}
              {STEP12_RATING_CATEGORIES.map((cat) => {
                const score = step12Scores[cat.id];
                const isExpanded = step12ExpandedCategory === cat.id;

                const renderCategoryIcon = (iconName: Step12RatingCategory['iconName']) => {
                  switch (iconName) {
                    case 'verified':
                      return <VerifiedBadgeIcon size={18} color={adminColors.brand} />;
                    case 'layers':
                      return <LayersIcon size={18} color={adminColors.brand} />;
                    case 'tractor':
                      return <TractorIcon size={18} color={adminColors.brand} />;
                    case 'leaf':
                      return <LeafIcon size={18} color={adminColors.brand} />;
                    case 'fruit':
                      return <ProduceFruitIcon size={18} color={adminColors.brand} />;
                    case 'qr':
                      return <QrCodeIcon size={18} color={adminColors.brand} />;
                    case 'users':
                      return <UsersIcon size={18} color={adminColors.brand} />;
                    case 'landmark':
                      return <LandmarkIcon size={18} color={adminColors.brand} />;
                    case 'store':
                      return <StoreIcon size={18} color={adminColors.brand} />;
                    case 'lightbulb':
                      return <LightbulbIcon size={18} color={adminColors.brand} />;
                    default:
                      return <VerifiedBadgeIcon size={18} color={adminColors.brand} />;
                  }
                };

                return (
                  <View key={cat.id} style={styles.step11CategoryCard}>
                    <TouchableOpacity
                      style={styles.step11CategoryHeader}
                      onPress={() =>
                        setStep12ExpandedCategory(isExpanded ? null : cat.id)
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
                          <ChevronUpIcon size={16} color={adminColors.muted} />
                        ) : (
                          <ChevronDownIcon size={16} color={adminColors.muted} />
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
                                  setStep12Scores((prev) => ({
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
                                  setStep12Scores((prev) => ({
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
                <ProhibitedIcon size={18} color={adminColors.muted} />
                <Text style={styles.step9NoticeText}>
                  This is the farmer's Farm Rating. It is separate from the official Audit Score, which stays read-only.
                </Text>
              </View>
            </View>
          )}

        </ScrollView>

        {/* Fixed Bottom Save Action */}
        <View style={styles.stepBottomBar}>
          {currentStep === 12 ? (
            <TouchableOpacity
              style={styles.primaryOrangeBtn}
              onPress={() => {
                setCompletedSections((prev) => ({ ...prev, 12: true }));
                Alert.alert(
                  'Steps Completed',
                  'All 12 inspection sections have been completed successfully.',
                  [{ text: 'OK', onPress: () => setCurrentView('audit_inspection') }]
                );
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryOrangeBtnText}>Save</Text>
            </TouchableOpacity>
          ) : currentStep === 11 ? (
            <TouchableOpacity
              style={styles.primaryOrangeBtn}
              onPress={() => {
                setCompletedSections((prev) => ({ ...prev, 11: true }));
                setCurrentStep(12);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryOrangeBtnText}>Save</Text>
            </TouchableOpacity>
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
                    <FileTextIcon size={20} color={adminColors.brand} />
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
                  <CloseXIcon size={18} color={adminColors.muted} />
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
                    <Text style={[styles.fmbDocMetaVal, { color: adminColors.success.text }]}>Verified Copy</Text>
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
                    <Line x1="10" y1="35" x2="260" y2="35" stroke={adminColors.border} strokeWidth="1" strokeDasharray="4,4" />
                    <Line x1="10" y1="70" x2="260" y2="70" stroke={adminColors.border} strokeWidth="1" strokeDasharray="4,4" />
                    <Line x1="10" y1="105" x2="260" y2="105" stroke={adminColors.border} strokeWidth="1" strokeDasharray="4,4" />
                    <Line x1="70" y1="10" x2="70" y2="120" stroke={adminColors.border} strokeWidth="1" strokeDasharray="4,4" />
                    <Line x1="140" y1="10" x2="140" y2="120" stroke={adminColors.border} strokeWidth="1" strokeDasharray="4,4" />
                    <Line x1="210" y1="10" x2="210" y2="120" stroke={adminColors.border} strokeWidth="1" strokeDasharray="4,4" />

                    {/* Cadastral Polygon Boundaries */}
                    <Path
                      d="M 40 30 L 195 22 L 235 95 L 85 115 Z"
                      fill={adminColors.brandTint}
                      stroke={adminColors.brand}
                      strokeWidth="2.2"
                    />
                    <Path
                      d="M 120 27 L 155 105"
                      stroke={adminColors.warning.text}
                      strokeWidth="1.5"
                      strokeDasharray="5,3"
                    />

                    {/* Plot Points & Markers */}
                    <Circle cx="40" cy="30" r="4" fill={adminColors.brandDeep} />
                    <Circle cx="195" cy="22" r="4" fill={adminColors.brandDeep} />
                    <Circle cx="235" cy="95" r="4" fill={adminColors.brandDeep} />
                    <Circle cx="85" cy="115" r="4" fill={adminColors.brandDeep} />
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
                  <CloseXIcon size={18} color={adminColors.muted} />
                </TouchableOpacity>
              </View>

              {/* Search Box */}
              <View style={styles.pickerSearchBoxWrap}>
                <TextInput
                  style={styles.pickerSearchInput}
                  value={cropSearchQuery}
                  onChangeText={setCropSearchQuery}
                  placeholder="Search..."
                  placeholderTextColor={adminColors.muted}
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
                      <CheckSquareIcon checked={isChecked} size={18} color={adminColors.brand} />
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
                  <CloseXIcon size={14} color={adminColors.onBrand} />
                </TouchableOpacity>
              </View>

              {/* Search Box */}
              <View style={styles.pickerSearchBoxWrap}>
                <TextInput
                  style={styles.pickerSearchInput}
                  value={plotSearchQuery}
                  onChangeText={setPlotSearchQuery}
                  placeholder="Search..."
                  placeholderTextColor={adminColors.muted}
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
                      <RadioDotIcon selected={isSelected} size={18} color={adminColors.brand} />
                      <Text style={[styles.pickerRadioText, isSelected && { color: adminColors.brandDeep, fontWeight: '800' }]}>
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
                  <CloseXIcon size={14} color={adminColors.onBrand} />
                </TouchableOpacity>
              </View>

              {/* Search Box */}
              <View style={styles.pickerSearchBoxWrap}>
                <TextInput
                  style={styles.pickerSearchInput}
                  value={waterSearchQuery}
                  onChangeText={setWaterSearchQuery}
                  placeholder="Search..."
                  placeholderTextColor={adminColors.muted}
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
                      <RadioDotIcon selected={isSelected} size={18} color={adminColors.brand} />
                      <Text style={[styles.pickerRadioText, isSelected && { color: adminColors.brandDeep, fontWeight: '800' }]}>
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
                    <FileTextIcon size={20} color={adminColors.brand} />
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
                  <CloseXIcon size={18} color={adminColors.muted} />
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
                    <Text style={[styles.fmbDocMetaVal, { color: adminColors.success.text }]} numberOfLines={1}>
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
                  <CloseXIcon size={18} color={adminColors.muted} />
                </TouchableOpacity>
              </View>

              {/* Search Box */}
              <View style={styles.pickerSearchBoxWrap}>
                <TextInput
                  style={styles.pickerSearchInput}
                  value={waterSourceSearchText}
                  onChangeText={setWaterSourceSearchText}
                  placeholder="Search..."
                  placeholderTextColor={adminColors.muted}
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
                      <RadioDotIcon selected={isSelected} size={18} color={adminColors.brand} />
                      <Text style={[styles.pickerRadioText, isSelected && { color: adminColors.brandDeep, fontWeight: '800' }]}>
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
                  <CloseXIcon size={18} color={adminColors.muted} />
                </TouchableOpacity>
              </View>

              {/* Search Box */}
              <View style={styles.pickerSearchBoxWrap}>
                <TextInput
                  style={styles.pickerSearchInput}
                  value={purposeSearchText}
                  onChangeText={setPurposeSearchText}
                  placeholder="Search..."
                  placeholderTextColor={adminColors.muted}
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
                      <CheckSquareIcon checked={isChecked} size={18} color={adminColors.brand} />
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
                  <CloseXIcon size={18} color={adminColors.ink} />
                </TouchableOpacity>
              </View>

              {/* Search Box */}
              <View style={styles.step7EvidenceSearchBox}>
                <TextInput
                  style={styles.step7EvidenceSearchInput}
                  value={step7EvidenceSearchText}
                  onChangeText={setStep7EvidenceSearchText}
                  placeholder="Search..."
                  placeholderTextColor={adminColors.muted}
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
                        <RadioDotIcon selected={isSelected} size={20} color={adminColors.brand} />
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
                  <CloseXIcon size={18} color={adminColors.ink} />
                </TouchableOpacity>
              </View>

              {/* Search Box */}
              <View style={styles.step7EvidenceSearchBox}>
                <TextInput
                  style={styles.step7EvidenceSearchInput}
                  value={step8RelatedSearchText}
                  onChangeText={setStep8RelatedSearchText}
                  placeholder="Search..."
                  placeholderTextColor={adminColors.muted}
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
                        <RadioDotIcon selected={isSelected} size={20} color={adminColors.brand} />
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
                  <CloseXIcon size={18} color={adminColors.ink} />
                </TouchableOpacity>
              </View>

              {/* Search Box */}
              <View style={styles.step7EvidenceSearchBox}>
                <TextInput
                  style={styles.step7EvidenceSearchInput}
                  value={step9RelatedSearchText}
                  onChangeText={setStep9RelatedSearchText}
                  placeholder="Search..."
                  placeholderTextColor={adminColors.muted}
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
                        <RadioDotIcon selected={isSelected} size={20} color={adminColors.brand} />
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
                  <CloseXIcon size={18} color={adminColors.ink} />
                </TouchableOpacity>
              </View>

              {/* Search Box */}
              <View style={styles.step7EvidenceSearchBox}>
                <TextInput
                  style={styles.step7EvidenceSearchInput}
                  value={step9EvidenceRefSearchText}
                  onChangeText={setStep9EvidenceRefSearchText}
                  placeholder="Search..."
                  placeholderTextColor={adminColors.muted}
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
                        <RadioDotIcon selected={isSelected} size={20} color={adminColors.brand} />
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
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Solid Theme Orange Header */}
        <View style={styles.filterPageHeader}>
          <TouchableOpacity
            style={styles.filterBackBtn}
            onPress={() => setCurrentView('list')}
            activeOpacity={0.7}
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>

          <View style={styles.filterHeaderTitleWrap}>
            <FilterSlidersIcon size={22} color={adminColors.onBrand} />
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
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

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
              <BackArrowIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Audit History</Text>
          </View>

          <TouchableOpacity
            style={styles.headerFilterCircleBtn}
            onPress={() => setShowHistoryFilter((prev) => !prev)}
            activeOpacity={0.8}
            accessibilityLabel="Filters"
          >
            <FilterSlidersIcon size={19} color={adminColors.onBrand} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input Bar (Screenshot 1: "Farmer, Audit ID, Farm, Zone") */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchIconWrap}>
          <SearchIcon size={18} color={adminColors.muted} />
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Farmer, Audit ID, Farm, Zone"
          placeholderTextColor={adminColors.muted}
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
              <FilterSlidersIcon size={20} color={adminColors.brand} />
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
    backgroundColor: adminColors.brand,
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollCanvas: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },

  // Headers
  header: {
    backgroundColor: adminColors.brand,
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
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.3,
  },
  headerFilterBtn: {
    padding: 6,
  },
  headerFilterCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: adminOverlay.whitePill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Audit Schedule List Styles (Image 1 Center Screen) ───
  scheduleRecordCard: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
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
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  badgeUpcoming: {
    backgroundColor: adminColors.warning.bg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeUpcomingText: {
    ...adminType.caption,
    color: adminColors.warning.text,
  },
  badgeScheduled: {
    backgroundColor: adminColors.info.bg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeScheduledText: {
    ...adminType.caption,
    color: adminColors.info.text,
  },
  badgeInProgress: {
    backgroundColor: adminColors.purple.bg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeInProgressText: {
    ...adminType.caption,
    color: adminColors.purple.text,
  },
  badgeCompleted: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeCompletedText: {
    ...adminType.caption,
    color: adminColors.success.text,
  },

  // ─── Filter Bottom Sheet Modal (Image 1) ───
  filterModalOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'flex-end',
  },
  filterModalDismissArea: {
    flex: 1,
  },
  filterModalSheet: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    maxHeight: '80%',
    ...adminShadow.lg,
  },
  filterModalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  filterModalTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterModalTitleText: {
    ...adminType.sectionHead,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  filterModalScroll: {
    flexGrow: 0,
  },
  filterModalSectionLabel: {
    ...adminType.rowTitle,
    fontWeight: '800',
    color: adminColors.ink,
    marginTop: 14,
    marginBottom: 10,
  },
  filterModalPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterModalPill: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterModalPillActive: {
    backgroundColor: adminColors.brand,
    borderWidth: 1,
    borderColor: adminColors.brand,
  },
  filterModalPillInactive: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  filterModalPillText: {
    ...adminType.body,
    fontWeight: '700',
  },
  filterModalPillTextActive: {
    color: adminColors.onBrand,
  },
  filterModalPillTextInactive: {
    color: adminColors.ink,
  },
  filterModalActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
    marginBottom: 8,
  },
  filterModalApplyBtn: {
    flex: 2,
    height: 46,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterModalApplyBtnText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  filterModalResetBtn: {
    flex: 1,
    height: 46,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterModalResetBtnText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  filterModalCancelBtn: {
    flex: 1,
    height: 46,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterModalCancelBtnText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  scheduleRecordCardSub: {
    ...adminType.body,
    fontWeight: '500',
    color: adminColors.muted,
    marginBottom: 4,
  },
  scheduleRecordCardMeta: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  singleBottomBarFixed: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: adminColors.canvas,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  addScheduleVisitBtn: {
    height: 48,
    backgroundColor: adminColors.brand,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addScheduleVisitBtnText: {
    color: adminColors.onBrand,
    ...adminType.rowTitle,
  },
  inspectionChip: {
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  inspectionChipActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  inspectionChipInactive: {
    backgroundColor: adminColors.card,
    borderColor: adminColors.border,
  },
  inspectionChipText: {
    ...adminType.body,
  },
  inspectionChipTextActive: {
    color: adminColors.onBrand,
  },
  inspectionChipTextInactive: {
    color: adminColors.brand,
  },

  // ─── Audit History Styles (Screenshot 1) ───
  historyCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
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
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  historyBadgeCompleted: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  historyBadgeCompletedText: {
    ...adminType.caption,
    color: adminColors.success.text,
  },
  historyCardSubtitle: {
    ...adminType.body,
    fontWeight: '500',
    color: adminColors.muted,
    marginBottom: 4,
  },
  historyCardFootnote: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },

  // ─── Inline Filters Card Styles (Screenshot 5) ───
  inlineFilterCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    marginBottom: 12,
    ...adminShadow.sm,
  },
  inlineFilterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  inlineFilterTitle: {
    ...adminType.rowTitle,
    color: adminColors.warning.text,
  },
  inlineFilterSectionLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
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
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  inlineFilterPillActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  inlineFilterPillText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  inlineFilterPillTextActive: {
    color: adminColors.onBrand,
  },
  filterScrollIndicatorTrack: {
    height: 5,
    backgroundColor: adminColors.border,
    borderRadius: 3,
    marginTop: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  filterScrollIndicatorBar: {
    width: '60%',
    height: '100%',
    backgroundColor: adminColors.muted,
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
    borderColor: adminColors.brand,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineFilterApplyBtnText: {
    ...adminType.body,
    color: adminColors.brand,
  },
  inlineFilterClearBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineFilterClearBtnText: {
    ...adminType.body,
    color: adminColors.muted,
  },

  // ─── Audit Detail Styles (Screenshot 2) ───
  auditSummaryCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  auditSummaryValBold: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  timelineSectionTitle: {
    ...adminType.rowTitle,
    color: adminColors.warning.text,
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
    backgroundColor: adminColors.warning.bg,
    borderWidth: 1,
    borderColor: adminColors.warning.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineTextWrap: {
    flex: 1,
  },
  timelineTitleText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  timelineSubText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 2,
  },
  viewReportBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  viewReportBtnText: {
    ...adminType.rowTitle,
    color: adminColors.warning.text,
  },

  // ─── Farmer Audit Report Styles (Screenshots 3 & 4) ───
  reportScrollPad: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  reportSectionTitle: {
    ...adminType.rowTitle,
    color: adminColors.warning.text,
    marginTop: 14,
    marginBottom: 8,
  },
  reportCard: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  reportMetaValBold: {
    ...adminType.body,
    color: adminColors.ink,
  },
  findingsSummaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  findingsSummaryCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  findingsSummaryLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  findingsSummaryValDark: {
    ...adminType.title,
    fontWeight: '900',
    color: adminColors.ink,
  },
  findingsSummaryValAmber: {
    ...adminType.title,
    fontWeight: '900',
    color: adminColors.warning.text,
  },
  auditScoreCard: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auditScoreNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  auditScoreBigNum: {
    ...adminType.kpiValue,
    fontWeight: '900',
    color: adminColors.warning.text,
  },
  auditScoreTotalText: {
    ...adminType.title,
    color: adminColors.muted,
  },
  auditScoreCaption: {
    ...adminType.caption,
    color: adminColors.muted,
    letterSpacing: 0.8,
    marginTop: 6,
  },
  reportTextContent: {
    ...adminType.rowMeta,
    color: adminColors.ink,
    lineHeight: 18,
  },
  viewAuditHistoryOutlineBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAuditHistoryOutlineBtnText: {
    ...adminType.body,
    color: adminColors.warning.text,
  },
  reportBottomStickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
  },
  downloadPdfBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  downloadPdfBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },

  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.brand,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    gap: 12,
  },
  screenHeaderTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.3,
  },
  screenHeaderSub: {
    ...adminType.rowMeta,
    color: adminColors.onBrand,
    marginTop: 2,
  },

  // Search input
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
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
    ...adminType.body,
    color: adminColors.ink,
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
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
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
    ...adminType.rowTitle,
    color: adminColors.ink,
    letterSpacing: -0.2,
  },
  recordBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeOrange: {
    backgroundColor: adminColors.brandTint,
  },
  badgeBlue: {
    backgroundColor: adminColors.info.bg,
  },
  badgePurple: {
    backgroundColor: adminColors.purple.bg,
  },
  recordBadgeText: {
    ...adminType.caption,
  },
  badgeTextOrange: {
    color: adminColors.brand,
  },
  badgeTextBlue: {
    color: adminColors.info.text,
  },
  badgeTextPurple: {
    color: adminColors.purple.text,
  },
  recordMetaLine1: {
    ...adminType.rowMeta,
    fontWeight: '500',
    color: adminColors.muted,
    marginBottom: 4,
  },
  recordMetaLine2: {
    ...adminType.rowMeta,
    fontWeight: '500',
    color: adminColors.muted,
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: 4,
  },
  emptySub: {
    ...adminType.body,
    color: adminColors.muted,
  },

  // Bottom action
  bottomBarContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: adminColors.canvas,
  },
  scheduleFieldVisitBtn: {
    backgroundColor: adminColors.brand,
    height: 48,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleFieldVisitBtnText: {
    color: adminColors.onBrand,
    ...adminType.body,
  },

  // ─── Detail Screen Styles ───
  detailScrollPad: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  detailSectionTitle: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
    marginTop: 16,
    marginBottom: 10,
  },
  detailCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
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
    ...adminType.caption,
    fontWeight: '500',
    color: adminColors.muted,
    marginBottom: 4,
  },
  detailMetaValue: {
    ...adminType.body,
    color: adminColors.ink,
  },

  // Certifications
  certCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
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
    ...adminType.body,
    color: adminColors.ink,
  },
  certDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  certLabel: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  certValue: {
    ...adminType.body,
    color: adminColors.ink,
  },
  certValueGreen: {
    ...adminType.body,
    color: adminColors.success.text,
  },

  // Buttons
  outlineOrangeBtn: {
    height: 48,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  outlineOrangeBtnText: {
    ...adminType.body,
    color: adminColors.brandDeep,
  },
  detailBottomActionRow: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 10,
    backgroundColor: adminColors.canvas,
    gap: 10,
  },
  primaryOrangeBtn: {
    height: 48,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryOrangeBtnText: {
    color: adminColors.onBrand,
    ...adminType.rowTitle,
  },
  secondaryWhiteBtn: {
    height: 48,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryWhiteBtnText: {
    color: adminColors.ink,
    ...adminType.body,
  },

  // ─── Schedule Field Visit Screen ───
  fieldSectionLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
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
    backgroundColor: adminColors.brand,
  },
  smallPillInactive: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  smallPillText: {
    ...adminType.body,
  },
  smallPillTextActive: {
    color: adminColors.onBrand,
  },
  smallPillTextInactive: {
    color: adminColors.ink,
  },
  visitNotesCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 12,
    minHeight: 110,
  },
  visitNotesInput: {
    ...adminType.body,
    color: adminColors.ink,
    textAlignVertical: 'top',
    padding: 0,
  },

  // ─── Inspection / Findings Screen ───
  checklistCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
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
    ...adminType.body,
    color: adminColors.ink,
  },
  checklistDivider: {
    height: 1,
    backgroundColor: adminColors.border,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusChipGreen: {
    backgroundColor: adminColors.success.bg,
  },
  statusChipAmber: {
    backgroundColor: adminColors.warning.bg,
  },
  statusChipText: {
    ...adminType.caption,
  },
  statusChipTextGreen: {
    color: adminColors.success.text,
  },
  statusChipTextAmber: {
    color: adminColors.warning.text,
  },

  summaryKpiRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryKpiCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  summaryKpiLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  summaryKpiValueDark: {
    ...adminType.kpiValue,
    color: adminColors.ink,
  },
  summaryKpiValueAmber: {
    ...adminType.kpiValue,
    color: adminColors.brand,
  },

  findingCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  findingTitle: {
    ...adminType.body,
    color: adminColors.ink,
  },
  findingBadgesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  minorBadge: {
    backgroundColor: adminColors.warning.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  minorBadgeText: {
    ...adminType.caption,
    color: adminColors.warning.text,
  },
  openBadge: {
    backgroundColor: adminColors.canvas,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  openBadgeText: {
    ...adminType.caption,
    color: adminColors.ink,
  },
  majorBadge: {
    backgroundColor: adminColors.danger.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  majorBadgeText: {
    ...adminType.caption,
    color: adminColors.danger.text,
  },
  resolvedBadge: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  resolvedBadgeText: {
    ...adminType.caption,
    color: adminColors.success.text,
  },
  redFlagBanner: {
    backgroundColor: adminColors.danger.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.danger.bg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 4,
    marginBottom: 6,
  },
  redFlagBannerText: {
    flex: 1,
    ...adminType.rowMeta,
    color: adminColors.danger.text,
    lineHeight: 18,
  },

  infoNoteCard: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 12,
  },
  infoNoteText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    lineHeight: 17,
  },

  timelineCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
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
    backgroundColor: adminColors.warning.bg,
    borderWidth: 1,
    borderColor: adminColors.warning.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineTileGray: {
    width: 30,
    height: 30,
    borderRadius: 7,
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineItemTitle: {
    ...adminType.body,
    color: adminColors.ink,
  },
  timelineItemMeta: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
  },

  ratingCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingNumberWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  ratingBigScore: {
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '900',
    color: adminColors.brandDeep,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  ratingTotal: {
    ...adminType.title,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700',
    color: adminColors.muted,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  ratingCaption: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.muted,
    letterSpacing: 0.8,
    marginTop: 6,
  },

  singleBottomBar: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 10,
    backgroundColor: adminColors.canvas,
  },
  startResumeBtn: {
    height: 48,
    backgroundColor: adminColors.brand,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startResumeBtnText: {
    color: adminColors.onBrand,
    ...adminType.rowTitle,
  },

  // ─── Audit Details (Images 1 & 2) ───
  auditDetailsHeaderPill: {
    backgroundColor: adminColors.card,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  auditDetailsHeaderPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.brand,
  },
  documentRowCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  documentRowTitle: {
    flex: 1,
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
    marginLeft: 12,
  },
  checklistPendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pendingCircleOutline: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: adminColors.border,
  },
  checklistPendingText: {
    ...adminType.caption,
    color: adminColors.muted,
    fontWeight: '600',
  },
  infoNoteCardWithIcon: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  pdfBottomBarRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: adminColors.canvas,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  pdfDownloadBtn: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfDownloadBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.brand,
  },
  pdfCloseBtn: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfCloseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },

  // ─── Filter Page Styles (Screenshot 4) ───
  filterPageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: adminColors.brand,
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
    ...adminType.title,
    color: adminColors.onBrand,
  },
  filterBodyContainer: {
    flex: 1,
    backgroundColor: adminColors.card,
  },
  filterPageContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
    backgroundColor: adminColors.card,
  },
  filterSectionTitle: {
    ...adminType.body,
    color: adminColors.ink,
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
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
    borderWidth: 1,
  },
  pillButtonInactive: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  pillButtonText: {
    ...adminType.body,
  },
  pillButtonTextActive: {
    color: adminColors.onBrand,
  },
  pillButtonTextInactive: {
    color: adminColors.ink,
  },
  filterBottomActionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: adminColors.card,
    gap: 12,
  },
  applyBtn: {
    flex: 1,
    height: 48,
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    ...adminType.body,
    color: adminColors.brand,
  },
  clearBtn: {
    flex: 1,
    height: 48,
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    ...adminType.body,
    color: adminColors.muted,
  },

  // ─── Audit Inspection Styles (Screenshots 1 & 2) ───
  progressCardTitle: {
    ...adminType.body,
    color: adminColors.ink,
  },
  progressCardSub: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 3,
    marginBottom: 10,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: adminColors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    backgroundColor: adminColors.brand,
    borderRadius: 3,
  },
  inspectionSectionsTitle: {
    ...adminType.body,
    color: adminColors.brandDeep,
    marginTop: 18,
    marginBottom: 10,
  },
  inspectionSectionCard: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
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
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumCircleDone: {
    backgroundColor: adminColors.success.bg,
  },
  stepNumText: {
    ...adminType.body,
    color: adminColors.brandDeep,
  },
  stepNumTextDone: {
    color: adminColors.success.text,
  },
  stepCardTitle: {
    ...adminType.body,
    color: adminColors.ink,
  },
  stepCardSub: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
  },
  stepCardStatus: {
    ...adminType.caption,
    color: adminColors.ink,
  },
  stepCardStatusDone: {
    color: adminColors.success.text,
  },
  inspectionBottomBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    backgroundColor: adminColors.canvas,
  },
  saveDraftBtn: {
    height: 48,
    backgroundColor: adminColors.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveDraftBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },

  // ─── Step Detail Styles (Screenshots 3 & 4) ───
  headerStepPill: {
    backgroundColor: adminOverlay.whitePill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerStepPillText: {
    color: adminColors.onBrand,
    ...adminType.rowMeta,
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
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: 6,
  },
  lockedInputBox: {
    height: 46,
    backgroundColor: adminColors.canvas,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  lockedInputText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  reportCorrectionText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 4,
  },
  underlineLink: {
    color: adminColors.info.text,
    textDecorationLine: 'underline',
    fontWeight: '700',
  },
  dropdownSelectorBox: {
    height: 46,
    backgroundColor: adminColors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownSelectorText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  dropdownMenu: {
    backgroundColor: adminColors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: adminColors.muted,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownMenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dropdownMenuItemActive: {
    backgroundColor: adminColors.muted,
  },
  dropdownMenuText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  dropdownMenuTextActive: {
    color: adminColors.onBrand,
  },

  // ─── Step 2 Styles (FMB & Land Verification) ───
  fileCard: {
    backgroundColor: adminColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
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
    ...adminType.body,
    color: adminColors.ink,
  },
  viewOutlineBtn: {
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 6,
    backgroundColor: adminColors.card,
  },
  viewOutlineBtnText: {
    ...adminType.body,
    color: adminColors.brandDeep,
  },
  dashedUploadBox: {
    backgroundColor: adminColors.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: adminColors.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dashedUploadText: {
    ...adminType.body,
    color: adminColors.brandDeep,
  },
  whiteInputBox: {
    height: 46,
    backgroundColor: adminColors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 14,
    ...adminType.body,
    color: adminColors.ink,
  },
  surveyHelperText: {
    ...adminType.caption,
    color: adminColors.info.text,
    marginTop: 4,
  },

  notesTextareaContainer: {
    backgroundColor: adminColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    minHeight: 115,
    padding: 12,
    position: 'relative',
  },
  notesTextareaInput: {
    ...adminType.body,
    color: adminColors.ink,
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
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fmbModalCard: {
    width: '100%',
    maxWidth: 370,
    backgroundColor: adminColors.card,
    borderRadius: 16,
    padding: 18,
    ...adminShadow.md,
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
    backgroundColor: adminColors.warning.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fmbModalTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  fmbModalSub: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    fontWeight: '600',
    marginTop: 1,
  },
  fmbModalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: adminColors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fmbDocMetaBox: {
    backgroundColor: adminColors.canvas,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: adminColors.border,
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
    ...adminType.rowMeta,
    color: adminColors.ink,
    flex: 1,
  },
  fmbPdfBadge: {
    backgroundColor: adminColors.danger.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  fmbPdfBadgeText: {
    ...adminType.caption,
    color: adminColors.danger.text,
  },
  fmbDocMetaDivider: {
    height: 1,
    backgroundColor: adminColors.border,
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
    ...adminType.caption,
    color: adminColors.muted,
    fontWeight: '600',
    marginBottom: 2,
  },
  fmbDocMetaVal: {
    ...adminType.caption,
    color: adminColors.ink,
    fontWeight: '700',
  },
  fmbSketchPreviewContainer: {
    backgroundColor: adminColors.canvas,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
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
    ...adminType.caption,
    color: adminColors.muted,
    letterSpacing: 0.5,
  },
  fmbVerifiedPill: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  fmbVerifiedPillText: {
    ...adminType.caption,
    color: adminColors.success.text,
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
    backgroundColor: adminColors.card,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: adminColors.brand,
  },
  fmbPlotTagAText: {
    ...adminType.caption,
    color: adminColors.brandDeep,
  },
  fmbPlotTagB: {
    position: 'absolute',
    top: 50,
    right: 48,
    backgroundColor: adminColors.card,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: adminColors.warning.text,
  },
  fmbPlotTagBText: {
    ...adminType.caption,
    color: adminColors.warning.text,
  },
  fmbSketchFoot: {
    marginTop: 6,
    alignItems: 'center',
  },
  fmbSketchFootText: {
    ...adminType.caption,
    color: adminColors.muted,
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
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fmbCancelBtnText: {
    ...adminType.body,
    color: adminColors.muted,
  },
  fmbCloseFullBtn: {
    width: '100%',
    height: 46,
    borderRadius: 10,
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fmbCloseFullBtnText: {
    ...adminType.body,
    color: adminColors.muted,
  },
  fmbDownloadBtn: {
    flex: 1.3,
    height: 46,
    borderRadius: 10,
    backgroundColor: adminColors.brand,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  fmbDownloadBtnText: {
    ...adminType.body,
    color: adminColors.onBrand,
  },

  // ─── Step 3 Picker Modal Styles (Crops, Plot, Water) ───
  pickerModalCard: {
    width: '100%',
    maxWidth: 370,
    backgroundColor: adminColors.card,
    borderRadius: 16,
    padding: 18,
    ...adminShadow.md,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  pickerModalTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
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
    backgroundColor: adminColors.info.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerSearchBoxWrap: {
    marginBottom: 12,
  },
  pickerSearchInput: {
    height: 42,
    backgroundColor: adminColors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 12,
    ...adminType.body,
    color: adminColors.ink,
  },
  pickerCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  pickerCheckText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  pickerRadioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  pickerRadioText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  pickerDoneBtn: {
    height: 46,
    backgroundColor: adminColors.brand,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  pickerDoneBtnText: {
    ...adminType.body,
    color: adminColors.onBrand,
  },

  // ─── Step 4 Styles (Certification Verification) ───
  certAccordionCard: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: 14,
    overflow: 'hidden',
  },
  certAccordionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
  },
  certAccordionTitle: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
  certAccordionSub: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 3,
  },
  certAccordionBody: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    backgroundColor: adminColors.card,
  },
  certInfoText: {
    ...adminType.caption,
    color: adminColors.muted,
    lineHeight: 16,
    marginBottom: 12,
  },
  dateInputRow: {
    height: 46,
    backgroundColor: adminColors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateTextInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    padding: 0,
  },
  certGraphicCard: {
    backgroundColor: adminColors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 12,
    alignItems: 'center',
    marginVertical: 4,
  },
  certSealPill: {
    backgroundColor: adminColors.warning.bg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 6,
  },
  certSealPillText: {
    ...adminType.caption,
    color: adminColors.warning.text,
    letterSpacing: 0.5,
  },
  certSubjectText: {
    ...adminType.rowMeta,
    color: adminColors.ink,
    textAlign: 'center',
  },
  certStandardText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
    textAlign: 'center',
  },
  certScopeText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
    textAlign: 'center',
  },

  // ─── Step 4 Calendar Dropdown Styles (Screenshot 2) ───
  calendarDropdownCard: {
    position: 'absolute',
    top: 72,
    left: 0,
    width: 252,
    backgroundColor: adminColors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
    zIndex: 9999,
    ...adminShadow.md,
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
    ...adminType.body,
    color: adminColors.ink,
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
    ...adminType.caption,
    color: adminColors.ink,
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
    borderColor: adminColors.ink,
  },
  calendarDayText: {
    ...adminType.caption,
    fontWeight: '500',
    color: adminColors.ink,
  },
  calendarDayTextInactive: {
    color: adminColors.muted,
    fontWeight: '400',
  },
  calendarDayTextSelected: {
    fontWeight: '800',
    color: adminColors.ink,
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
    ...adminType.rowMeta,
    color: adminColors.info.text,
  },

  // ─── Step 6 Styles (Water Source & Water pH Testing) ───
  locationInputBox: {
    height: 46,
    backgroundColor: adminColors.canvas,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 14,
    ...adminType.body,
    color: adminColors.ink,
  },
  locationHelperText: {
    ...adminType.caption,
    color: adminColors.info.text,
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
    ...adminType.body,
    color: adminColors.warning.text,
    letterSpacing: 0.5,
  },
  addWaterSourceBtn: {
    height: 48,
    backgroundColor: adminColors.card,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  addWaterSourceBtnText: {
    ...adminType.body,
    color: adminColors.warning.text,
  },

  // ─── Step 7 Styles (Farm Practices Checklist - Screenshots 1 to 5) ───
  step7SectionHeader: {
    ...adminType.body,
    color: adminColors.brandDeep,
    letterSpacing: 0.4,
    marginBottom: 12,
  },
  step7DropdownMenu: {
    backgroundColor: adminColors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: adminColors.muted,
    marginTop: 4,
    overflow: 'hidden',
  },
  step7DropdownMenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  step7DropdownMenuItemActive: {
    backgroundColor: adminColors.muted,
  },
  step7DropdownMenuText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  step7DropdownMenuTextActive: {
    color: adminColors.onBrand,
  },
  step7SearchBox: {
    height: 46,
    backgroundColor: adminColors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  uploadEvidenceDashedBox: {
    height: 52,
    backgroundColor: adminColors.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
  },
  uploadEvidenceText: {
    ...adminType.body,
    color: adminColors.warning.text,
  },
  uploadedFileCard: {
    backgroundColor: adminColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  uploadedFileName: {
    ...adminType.body,
    color: adminColors.ink,
  },
  uploadedFileSize: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
  },
  step7BottomModalBackdrop: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'flex-end',
  },
  step7EvidenceBottomSheetCard: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
    ...adminShadow.md,
  },
  step7EvidenceModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  step7EvidenceModalTitle: {
    ...adminType.title,
    color: adminColors.ink,
  },
  step7EvidenceSearchBox: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: adminColors.ink,
    paddingHorizontal: 14,
    justifyContent: 'center',
    marginBottom: 8,
  },
  step7EvidenceSearchInput: {
    ...adminType.body,
    color: adminColors.ink,
    padding: 0,
  },
  step7EvidenceRadioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
  },
  step7EvidenceRadioText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  step7EvidenceDivider: {
    height: 1,
    backgroundColor: adminColors.canvas,
  },

  // ─── Step 8 Styles (Documents & Evidence - Screenshots 1 to 5) ───
  step8SectionHeader: {
    ...adminType.body,
    color: adminColors.brandDeep,
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  step8DocCard: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
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
    ...adminType.body,
    color: adminColors.ink,
  },
  step8DocSub: {
    ...adminType.rowMeta,
    color: adminColors.muted,
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
    borderColor: adminColors.warning.text,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  step8DocActionBtnText: {
    ...adminType.rowMeta,
    color: adminColors.warning.text,
  },
  step8AddEvidenceBtn: {
    height: 48,
    backgroundColor: adminColors.card,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  step8AddEvidenceBtnText: {
    ...adminType.body,
    color: adminColors.warning.text,
  },
  step8SubsequentEntryBox: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  step8EntryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  step8EntryHeaderTitle: {
    ...adminType.body,
    color: adminColors.warning.text,
  },
  step8RemoveText: {
    ...adminType.rowMeta,
    color: adminColors.danger.text,
  },

  // ─── Step 9 Styles (Inspection Observations & Findings) ───
  step9InfoBanner: {
    backgroundColor: adminColors.warning.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.warning.text,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  step9InfoBannerText: {
    ...adminType.rowMeta,
    color: adminColors.warning.text,
    lineHeight: 16.5,
    flex: 1,
  },
  step9EmptyHint: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    fontWeight: '600',
    marginTop: -4,
    marginBottom: 8,
  },
  step9FindingCard: {
    backgroundColor: adminColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  step9FindingText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  step9NoticeCard: {
    backgroundColor: adminColors.canvas,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  step9NoticeText: {
    ...adminType.caption,
    color: adminColors.muted,
    lineHeight: 16,
    flex: 1,
  },

  // ─── Step 10 Styles (Farmer Admin Assessment - Screenshots 1 to 5) ───
  step10ScoreCard: {
    backgroundColor: adminColors.canvas,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  step10ScoreText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  step10ScoreCaption: {
    ...adminType.rowMeta,
    color: adminColors.info.text,
    lineHeight: 16.5,
    marginTop: 6,
    marginBottom: 6,
  },

  // ─── Step 11 Styles (Add External Audit - Screenshots 1 & 3) ───
  step11SectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  step11SectionHeaderTitle: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  step11WhiteCard: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 14,
    marginBottom: 14,
  },
  step11GridRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  step11FieldLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: 6,
    fontWeight: '600',
  },
  step11ReadonlyBox: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.xs,
    height: 44,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  step11ReadonlyText: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '700',
    fontSize: 14,
  },
  step11SelectorBox: {
    backgroundColor: adminColors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: adminColors.border,
    height: 48,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  step11SelectorText: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 14,
  },
  step11Input: {
    backgroundColor: adminColors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: adminColors.border,
    height: 48,
    paddingHorizontal: 14,
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 14,
  },
  step11DateSelectorBox: {
    backgroundColor: adminColors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: adminColors.border,
    height: 48,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  step11DateText: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 13,
    flex: 1,
  },
  step11UploadDashedBox: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: adminColors.success.border,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  step11UploadTitle: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 2,
  },
  step11UploadSub: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 12,
  },
  step11UploadedFileName: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '700',
    fontSize: 14,
  },
  step11UploadedFileSize: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  step11TextareaContainer: {
    backgroundColor: adminColors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 12,
  },
  step11TextareaInput: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 14,
    minHeight: 88,
  },
  step11CounterText: {
    ...adminType.caption,
    color: adminColors.muted,
    textAlign: 'right',
    marginTop: 4,
    fontSize: 12,
  },

  // ─── Step 12 Styles (Farmer Rating - Screenshot 4) ───
  step11Breadcrumb: {
    ...adminType.rowMeta,
    color: adminColors.warning.text,
    marginBottom: 10,
  },
  step11MetaGridCard: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
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
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: 2,
  },
  step11MetaValue: {
    ...adminType.body,
    color: adminColors.ink,
  },
  step11OverallCard: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    marginBottom: 16,
  },
  step11OverallTitle: {
    ...adminType.caption,
    color: adminColors.muted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  step11OverallScoreText: {
    ...adminType.kpiValue,
    fontWeight: '900',
    color: adminColors.ink,
    marginBottom: 8,
  },
  step11OverallSubtext: {
    ...adminType.caption,
    color: adminColors.muted,
    lineHeight: 16,
    marginBottom: 8,
  },
  step11OverallSubtext2: {
    ...adminType.caption,
    color: adminColors.muted,
    lineHeight: 16,
  },
  step11CategoryCard: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
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
    ...adminType.body,
    color: adminColors.ink,
    flex: 1,
  },
  step11CategoryHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  step11PillNotAssessed: {
    backgroundColor: adminColors.canvas,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  step11PillNotAssessedText: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  step11PillAssessed: {
    backgroundColor: adminColors.canvas,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  step11PillAssessedText: {
    ...adminType.rowMeta,
    color: adminColors.ink,
  },
  step11CategoryBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: adminColors.canvas,
  },
  step11ScoreLabel: {
    ...adminType.rowMeta,
    color: adminColors.ink,
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
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  step11ScoreNumBtnActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  step11ScoreNumText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  step11ScoreNumTextActive: {
    color: adminColors.onBrand,
  },
  step11PrevAuditText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 6,
  },
  step11BackBtn: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  step11BackBtnText: {
    ...adminType.body,
    color: adminColors.warning.text,
  },

  stepBottomBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    backgroundColor: adminColors.canvas,
  },

  // ─── Module 5: Audit Calendar Styles (Image 1) ───
  calRoot: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  calHeader: {
    backgroundColor: adminColors.brand,
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
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.3,
  },
  calHeaderSubtitle: {
    ...adminType.body,
    fontWeight: '500',
    color: adminColors.onBrand,
    marginTop: 2,
  },
  calBellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: adminOverlay.whitePill,
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
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calTabActiveText: {
    ...adminType.body,
    color: adminColors.onBrand,
  },
  calTabInactive: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calTabInactiveText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  calFiltersRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  calFilterCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  calFilterLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    letterSpacing: 0.5,
  },
  calFilterValue: {
    ...adminType.body,
    color: adminColors.ink,
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
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calMonthNavTitle: {
    ...adminType.title,
    color: adminColors.ink,
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
    ...adminType.caption,
    color: adminColors.muted,
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
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
  },
  calGridDayCellSelected: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  calGridDayCellEmpty: {
    flex: 1,
    height: 48,
    marginHorizontal: 3,
  },
  calGridDayText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  calGridDayTextSelected: {
    color: adminColors.onBrand,
  },
  calendarDayInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDaySelectedInner: {
    backgroundColor: adminColors.brand,
  },
  calendarDayNumText: {
    ...adminType.body,
    fontWeight: '600',
    color: adminColors.ink,
  },
  calendarDayNumOtherMonth: {
    color: adminColors.muted,
    opacity: 0.4,
  },
  calendarDayNumSelected: {
    color: adminColors.onBrand,
    fontWeight: '800',
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
    backgroundColor: adminColors.brand,
  },
  calSelectedDateSection: {
    paddingHorizontal: 16,
    marginTop: 18,
    paddingBottom: 24,
  },
  calSelectedDateTitle: {
    ...adminType.title,
    color: adminColors.ink,
  },
  calSelectedDateCount: {
    ...adminType.body,
    fontWeight: '500',
    color: adminColors.muted,
    marginTop: 2,
  },
  calAuditCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    marginTop: 12,
  },
  calAuditCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calAuditCardTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  calAuditBadgeBlue: {
    backgroundColor: adminColors.info.bg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  calAuditBadgeBlueText: {
    ...adminType.caption,
    color: adminColors.info.text,
  },
  calAuditCardSubtitle: {
    ...adminType.body,
    fontWeight: '500',
    color: adminColors.muted,
    marginTop: 6,
  },
  calAuditCardMeta: {
    ...adminType.rowMeta,
    fontWeight: '500',
    color: adminColors.muted,
    marginTop: 3,
  },
  calViewDetailsBtn: {
    marginTop: 12,
  },
  calViewDetailsText: {
    ...adminType.body,
    color: adminColors.brand,
  },

  // ─── Module 5: Audit Details Styles (Images 2 & 3) ───
  detHeaderSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  detUpcomingBadge: {
    backgroundColor: adminColors.card,
    paddingHorizontal: 10,
    paddingVertical: 2.5,
    borderRadius: 12,
  },
  detUpcomingBadgeText: {
    ...adminType.caption,
    color: adminColors.warning.text,
  },
  detSectionHeader: {
    ...adminType.rowTitle,
    color: adminColors.warning.text,
    marginTop: 8,
    marginBottom: 8,
  },
  detCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
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
    ...adminType.caption,
    color: adminColors.muted,
  },
  detValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginTop: 3,
  },
  detViewProfileBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  detViewProfileBtnText: {
    ...adminType.body,
    color: adminColors.warning.text,
  },
  detDocCard: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
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
    ...adminType.body,
    color: adminColors.ink,
  },
  detChecklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  detChecklistTitle: {
    ...adminType.body,
    color: adminColors.ink,
  },
  detChecklistPendingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detChecklistPendingText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  detDivider: {
    height: 1,
    backgroundColor: adminColors.canvas,
  },
  detDisclaimerCard: {
    backgroundColor: adminColors.canvas,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 10,
    marginBottom: 30,
  },
  detDisclaimerText: {
    flex: 1,
    ...adminType.caption,
    color: adminColors.muted,
    lineHeight: 16,
    fontWeight: '500',
  },

  // ─── Module 5: Checklist PDF Viewer Styles (Image 4) ───
  pdfHeader: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pdfHeaderTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  pdfMetaCard: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    margin: 16,
    padding: 16,
    flexDirection: 'row',
  },
  pdfPreviewArea: {
    flex: 1,
    backgroundColor: adminColors.card,
  },

  // ─── Module 5: Audit Detail Double Bottom Bar Styles (Image 1 Right) ───
  doubleBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 10,
    ...adminShadow.sm,
  },
  primarySupportAuditBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primarySupportAuditBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
    letterSpacing: 0.2,
  },
  outlineScheduleVisitBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineScheduleVisitBtnText: {
    ...adminType.body,
    color: adminColors.ink,
  },
});
