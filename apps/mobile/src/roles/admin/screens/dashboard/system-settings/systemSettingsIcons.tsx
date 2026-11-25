/**
 * Flow-specific icons, drawn as in the design (origin/Superadmin-main
 * SystemSettingsFlow.tsx). Back / chevrons / checkmark / info come from the
 * shared AdminIcons; everything here is only used by this flow.
 */
import React from 'react';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { adminColors, adminOverlay } from '../../../theme';
import type { AuditActionKind } from './systemSettingsLogic';

export {
  BackArrowIcon,
  CheckmarkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  InfoCircleIcon,
} from '../../../components/AdminIcons';

interface IconProps {
  size?: number;
  color?: string;
}

const PENCIL_A = 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7';
const PENCIL_B = 'M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z';
const DOWNLOAD = 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3';
const DOC = 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z';
const CHAT =
  'M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z';

export function PlusCircleWhiteIcon({ size = 36 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <Circle cx="18" cy="18" r="18" fill={adminOverlay.headerMoreButton} />
      <Path d="M18 11v14M11 18h14" stroke={adminColors.onBrand} strokeWidth="2.4" strokeLinecap="round" />
    </Svg>
  );
}

export function PencilIcon({ size = 20, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d={PENCIL_A} stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d={PENCIL_B} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ThreeDotsVerticalIcon({ size = 18, color = adminColors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="5" r="2" fill={color} />
      <Circle cx="12" cy="12" r="2" fill={color} />
      <Circle cx="12" cy="19" r="2" fill={color} />
    </Svg>
  );
}

export function CopyIcon({ size = 16, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="9" y="9" width="13" height="13" rx="2" stroke={color} strokeWidth="1.8" />
      <Path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

export function GlobeIcon({ size = 18, color = adminColors.muted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8" />
      <Path
        d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"
        stroke={color}
        strokeWidth="1.8"
      />
    </Svg>
  );
}

export function KeyIcon({ size = 18, color = adminColors.muted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="7.5" cy="15.5" r="4.5" stroke={color} strokeWidth="1.8" />
      <Path d="M11 12l8.5-8.5M16 6l3 3M14 8l2 2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function EyeOffIcon({ size = 18, color = adminColors.muted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function EyeIcon({ size = 18, color = adminColors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color} strokeWidth="1.8" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

export function ChatBubbleIcon({ size = 18, color = adminColors.muted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d={CHAT} stroke={color} strokeWidth="1.8" />
      <Path d="M9 10h.01M12 10h.01M15 10h.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

export function LinkChainIcon({ size = 18, color = adminColors.muted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function LockSecurityIcon({ size = 18, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth="1.8" />
      <Path d="M7 11V7a5 5 0 0110 0v4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function WarningTriangleIcon({ size = 22, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 9v4M12 17h.01" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </Svg>
  );
}

export function SignalWifiIcon({ size = 16, color = adminColors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function RegenerateIcon({ size = 16, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M23 4v6h-6M1 20v-6h6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Path
        d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function DownloadIcon({ size = 18, color = adminColors.ink, strokeWidth = '1.8' }: IconProps & { strokeWidth?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d={DOWNLOAD} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function DocumentIcon({ size = 18, color = adminColors.ink, lines = true }: IconProps & { lines?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d={DOC} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path
        d={lines ? 'M14 2v6h6M16 13H8M16 17H8M10 9H8' : 'M14 2v6h6'}
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function TrashIcon({ size = 18, color = adminColors.danger.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
        stroke={color}
        strokeWidth="1.8"
      />
    </Svg>
  );
}

export function SpinnerRingIcon({ size = 20, color = adminColors.success.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.5" strokeDasharray="30 15" />
    </Svg>
  );
}

export function DoneCircleIcon({ size = 18, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.2" />
      <Path d="M8 12l3 3 5-5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CalendarRangeIcon({ size = 18, color = adminColors.muted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="1.8" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

// ─── Hub icons ───────────────────────────────────────────────────────────────

const BRAND = adminColors.brand;

export function HubGearIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={BRAND} strokeWidth="2" />
      <Path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
        stroke={BRAND}
        strokeWidth="1.8"
      />
    </Svg>
  );
}

export function HubAuditLogIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="3" width="16" height="18" rx="2" stroke={BRAND} strokeWidth="2" />
      <Path d="M8 8h8M8 12h8M8 16h5" stroke={BRAND} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function HubExportIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d={DOC} stroke={BRAND} strokeWidth="1.8" />
      <Path d="M14 2v6h6M12 18v-6M9 15l3 3 3-3" stroke={BRAND} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function HubIntegrationIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M16 18l6-6-6-6M8 6l-6 6 6 6" stroke={BRAND} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function HubDatabaseIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Ellipse cx="12" cy="5" rx="9" ry="3" stroke={BRAND} strokeWidth="1.8" />
      <Path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" stroke={BRAND} strokeWidth="1.8" />
      <Path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" stroke={BRAND} strokeWidth="1.8" />
    </Svg>
  );
}

// ─── Integration type icons ──────────────────────────────────────────────────

export type IntegrationIconKind = 'sms' | 'email' | 'payment' | 'gst' | 'cloud' | 'api';

export function IntegrationTypeIcon({ kind }: { kind: IntegrationIconKind }) {
  if (kind === 'api') return <HubIntegrationIcon />;
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      {kind === 'sms' ? (
        <>
          <Path d={CHAT} stroke={BRAND} strokeWidth="1.8" />
          <Path d="M9 10h.01M12 10h.01M15 10h.01" stroke={BRAND} strokeWidth="2.5" strokeLinecap="round" />
        </>
      ) : null}
      {kind === 'email' ? (
        <>
          <Rect x="2" y="4" width="20" height="16" rx="2" stroke={BRAND} strokeWidth="1.8" />
          <Path d="M22 6l-10 7L2 6" stroke={BRAND} strokeWidth="1.8" />
        </>
      ) : null}
      {kind === 'payment' ? (
        <>
          <Rect x="2" y="5" width="20" height="14" rx="2" stroke={BRAND} strokeWidth="1.8" />
          <Path d="M2 10h20M6 15h4" stroke={BRAND} strokeWidth="1.8" />
        </>
      ) : null}
      {kind === 'gst' ? (
        <>
          <Path d="M14 2H6a2 2 0 00-2 2v16l3-2 3 2 3-2 3 2 3-2 3 2V8l-6-6z" stroke={BRAND} strokeWidth="1.8" />
          <Path d="M8 9h4M8 13h8" stroke={BRAND} strokeWidth="1.8" strokeLinecap="round" />
        </>
      ) : null}
      {kind === 'cloud' ? <Path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" stroke={BRAND} strokeWidth="1.8" /> : null}
    </Svg>
  );
}

// ─── Audit log row icon ──────────────────────────────────────────────────────

/** The design's per-action tints, on the nearest semantic pairs. */
export const AUDIT_KIND_TONE: Record<AuditActionKind, { bg: string; fg: string }> = {
  create: { bg: adminColors.success.bg, fg: adminColors.success.text },
  update: { bg: adminColors.danger.bg, fg: adminColors.danger.text },
  delete: { bg: adminColors.danger.bg, fg: adminColors.danger.text },
  generate: { bg: adminColors.warning.bg, fg: adminColors.warning.text },
  export: { bg: adminColors.dashboard.greenBadgeBg, fg: adminColors.dashboard.greenBadgeText },
};

export function AuditKindIcon({ kind }: { kind: AuditActionKind }) {
  const color = AUDIT_KIND_TONE[kind].fg;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      {kind === 'create' ? <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.5" strokeLinecap="round" /> : null}
      {kind === 'update' || kind === 'delete' ? (
        <>
          <Path d={PENCIL_A} stroke={color} strokeWidth="2" strokeLinecap="round" />
          <Path d={PENCIL_B} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : null}
      {kind === 'generate' ? (
        <>
          <Circle cx="7.5" cy="15.5" r="4.5" stroke={color} strokeWidth="2" />
          <Path d="M11 12l8.5-8.5M16 6l3 3M14 8l2 2" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </>
      ) : null}
      {kind === 'export' ? (
        <Path d={DOWNLOAD} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      ) : null}
    </Svg>
  );
}
