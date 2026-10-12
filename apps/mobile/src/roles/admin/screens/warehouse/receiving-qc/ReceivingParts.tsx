/**
 * Building blocks of the goods receiving & QC screens: the rbac codes they
 * check, the wizard's stepper, a permission note, and the icons (moved here
 * unchanged from the wizard, now coloured by admin theme tokens).
 *
 * `can` only decides what is worth rendering; the server re-checks every code
 * (CLAUDE.md 2.1).
 */
import React from 'react';
import { Alert, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType, type AdminTone } from '../../../theme';
import type { QcCriterion, QualityIssue, ReceiptResult, ShipmentStatus } from './types';

/** Badge tone of a shipment status (the old per-row hex pairs, by meaning). */
export function shipmentTone(status: ShipmentStatus): AdminTone {
  switch (status) {
    case 'Expected':
      return 'brandSoft';
    case 'Arrived':
    case 'Completed':
      return 'success';
    case 'Receiving':
      return 'info';
    case 'Awaiting QC':
    case 'Partially Accepted':
      return 'warning';
    default:
      return 'danger';
  }
}

/** Badge tone of a receipt result. */
export function receiptTone(result: ReceiptResult): AdminTone {
  if (result === 'Accepted') return 'success';
  if (result === 'Rejected') return 'danger';
  if (result === 'Open') return 'brandSoft';
  return 'warning';
}

/** Accent tone of a QC issue. */
export function qualityIssueTone(kind: QualityIssue['kind']): AdminTone {
  return kind === 'QC Pending' ? 'warning' : 'danger';
}

/** True when the admin may see receiving data (as ReceivingHistoryDetailScreen gates it). */
export function canViewReceiving(can: (code: string) => boolean): boolean {
  return can(RECEIVING_CODES.batchView) || can(RECEIVING_CODES.receiptRecord);
}

/** docs/rbac.json codes the receiving screens check (each one exists there; MAIN=all, SUB=all unless noted). */
export const RECEIVING_CODES = {
  /** Record a goods receipt (the wizard itself, and the Accept action). */
  receiptRecord: 'inventory.goods_receipt.record',
  /** Perform the quality check (Quality step, QC checklist, QC summary). */
  qualityCheck: 'inventory.quality_check.perform',
  /** Reject incoming produce with reason codes (Reject / Partial Accept, Rejected Goods, Record Handling). */
  rejectIncoming: 'inventory.produce.reject_incoming',
  /** Quality counter-offer at goods receipt (Counter-Offer step). */
  counterOffer: 'inventory.quality.counter_offer',
  /** Create the batch and assign its storage bay (Batch & Storage step, review putaway). */
  batchAssign: 'inventory.batch.assign',
  /** View batches / receipts. MAIN=all, SUB=own (BR-30). */
  batchView: 'inventory.batch.view',
} as const;

// ─── Stepper ─────────────────────────────────────────────────────────────────

export interface StepperHeaderProps {
  /** Labels of the visible stepper stages, in order (gated stages already removed). */
  labels: string[];
  /** Index (0-based) of the current stage in `labels`. */
  current: number;
}

/** The wizard's progress stepper. Stages a user may not perform are not passed in. */
export function StepperHeader({ labels, current }: StepperHeaderProps) {
  const n = labels.length;
  const progressPercent = n > 1 ? Math.min(100, Math.max(0, (current / (n - 1)) * 100)) : 0;
  const inset = `${50 / Math.max(n, 1)}%` as const;
  return (
    <View style={partStyles.stepperCard}>
      <View style={partStyles.stepperRow}>
        <View style={[partStyles.stepperTrackContainer, { left: inset, right: inset }]}>
          <View style={partStyles.stepperTrackBg} />
          <View style={[partStyles.stepperTrackProgress, { width: `${progressPercent}%` }]} />
        </View>
        {labels.map((label, idx) => {
          const isDone = idx < current;
          const isCurrent = idx === current;
          return (
            <View key={label} style={partStyles.stepItem}>
              <View
                style={[
                  partStyles.stepCircle,
                  isDone && partStyles.stepCircleDone,
                  isCurrent && partStyles.stepCircleCurrent,
                ]}
              >
                {isDone ? (
                  <StepperCheckIcon />
                ) : (
                  <Text style={[partStyles.stepNumberText, isCurrent && partStyles.stepNumberTextCurrent]}>
                    {idx + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[partStyles.stepLabel, isDone && partStyles.stepLabelDone, isCurrent && partStyles.stepLabelCurrent]}
                numberOfLines={2}
              >
                {label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/** Shown in place of a step or screen the signed-in admin may not use. */
export function PermissionNote({ message }: { message: string }) {
  return (
    <View style={partStyles.noteCard}>
      <AlertCircleOutlineIcon color={adminColors.muted} size={20} />
      <Text style={partStyles.noteText}>{message}</Text>
    </View>
  );
}

/** Orange-tint notice box (business-rule reminders absorbed from the standalone screens). */
export function NoticeBox({ text }: { text: string }) {
  return (
    <View style={partStyles.noticeBox}>
      <Text style={partStyles.noticeText}>{text}</Text>
    </View>
  );
}

/** Icon of a QC criterion. */
export function QcCriterionIcon({ icon }: { icon: QcCriterion['icon'] }) {
  switch (icon) {
    case 'eye':
      return <EyeIcon />;
    case 'ruler':
      return <RulerIcon />;
    case 'drop':
      return <DropIcon />;
    case 'bug':
      return <BugIcon />;
    default:
      return <LeafIcon />;
  }
}

// ─── Icons ───────────────────────────────────────────────────────────────────

export function BackArrowIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={adminColors.onBrand}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CheckmarkIcon({ color = adminColors.onBrand, size = 12 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CameraPlusIcon({ color = adminColors.muted, size = 28 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth="1.8" />
      <Path d="M19 10v3M17.5 11.5h3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function WarningTriangleIcon({ color = adminColors.warning.text, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function AlertCircleOutlineIcon({ color = adminColors.brand, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 8v4M12 16h.01" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

export function EyeIcon({ color = adminColors.warning.text, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

export function RulerIcon({ color = adminColors.warning.text }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21.3 8.7l-6-6a2 2 0 0 0-2.8 0L3.2 12a2 2 0 0 0 0 2.8l6 6a2 2 0 0 0 2.8 0l9.3-9.3a2 2 0 0 0 0-2.8zM7.5 10.5l2-2M10.5 13.5l2-2M13.5 16.5l2-2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function DropIcon({ color = adminColors.warning.text }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
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

export function BugIcon({ color = adminColors.warning.text }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 4a3 3 0 0 0-3 3v2h6V7a3 3 0 0 0-3-3zM8 12a4 4 0 0 0 8 0v4a4 4 0 0 1-8 0v-4zM6 10l-3-2M18 10l3-2M5 14H2M22 14h-3M6 18l-3 2M18 18l3 2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function LeafIcon({ color = adminColors.warning.text }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10zM2 21c0-3 1.85-5.36 5.08-6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PictureIcon({ color = adminColors.muted }: { color?: string }) {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="1.8" />
      <Circle cx="8.5" cy="8.5" r="1.5" stroke={color} strokeWidth="1.8" />
      <Path d="M21 15l-5-5L5 21" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CheckmarkCircleOutlineIcon({ color = adminColors.success.text, size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M8 12l2.5 2.5L16 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function NotEqualIcon({ color = adminColors.warning.text, size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Top row: horizontal bar and checkmark */}
      <Path d="M4 8h5.5" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
      <Path d="M13 8l2 2 4.5-4.5" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      {/* Bottom row: horizontal bar and cross */}
      <Path d="M4 16h5.5" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
      <Path d="M14 13.5l4.5 4.5M18.5 13.5l-4.5 4.5" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CrossCircleIcon({ color = adminColors.danger.text, size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M15 9l-6 6M9 9l6 6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function SearchIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="8" stroke={adminColors.muted} strokeWidth="2" />
      <Path d="M21 21l-4.35-4.35" stroke={adminColors.muted} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function BoxStorageIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
        stroke={adminColors.onBrand}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ClipboardChecklistIcon({ color = adminColors.onBrand, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Rect x="8" y="2" width="8" height="4" rx="1" stroke={color} strokeWidth="2" />
      <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function SendPaperAirplaneIcon({ color = adminColors.onBrand, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function RightArrowIcon({ color = adminColors.onBrand, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12h14M12 5l7 7-7 7"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChevronRightSmall({ color = adminColors.muted, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronDownIcon({ color = adminColors.muted, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9l6 6 6-6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ClockSmallIcon({ color = adminColors.warning.text, size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 7v5l3 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CheckboxSquareIcon({ checked = false, color = adminColors.brand }: { checked?: boolean; color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        fill={checked ? color : adminColors.card}
        stroke={checked ? color : adminColors.border}
        strokeWidth="2"
      />
      {checked && (
        <Path
          d="M7 12l3.5 3.5L17 8"
          stroke={adminColors.onBrand}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </Svg>
  );
}

export function PencilDraftIcon({ color = adminColors.warning.text, size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ReceiptPaperIcon({ color = adminColors.onBrand, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1 2-1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M8 7h8M8 11h8M8 15h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function QrCodeIcon({ color = adminColors.ink, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 20h2M19 15v2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function TruckDeliveryIcon({ color = adminColors.ink, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

export function TrashOutlineRedIcon({ color = adminColors.danger.text, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 11v6M14 11v6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function CrateInventoryIcon({ color = adminColors.warning.text, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M3 10h18M10 4v6M14 4v6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function RefreshRetryIcon({ color = adminColors.onBrand, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 4v6h-6M1 20v-6h6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ErrorExclamationCircleIcon({ color = adminColors.danger.text, size = 32 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 7v6" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <Circle cx="12" cy="16.5" r="1.2" fill={color} />
    </Svg>
  );
}

export function RedCrossBadgeIcon({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={adminColors.danger.text} strokeWidth="2" />
      <Path d="M15 9l-6 6M9 9l6 6" stroke={adminColors.danger.text} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function TransferArrowsIcon({ color = adminColors.brand, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 8h15M15 4l4 4-4 4M20 16H5M9 12l-4 4 4 4" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function StepperCheckIcon({ size = 15, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 13l4 4L19 7"
        stroke={color}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}


const partStyles = StyleSheet.create({
  stepperCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingVertical: 18,
    paddingHorizontal: 4,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    position: 'relative',
  },
  stepperTrackContainer: {
    position: 'absolute',
    top: 15.5,
    height: 3,
    zIndex: 0,
  },
  stepperTrackBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: adminColors.border,
    borderRadius: 1.5,
  },
  stepperTrackProgress: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 3,
    backgroundColor: adminColors.success.text,
    borderRadius: 1.5,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    zIndex: 1,
  },
  stepCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.sm,
  },
  stepCircleCurrent: {
    backgroundColor: adminColors.brand,
  },
  stepCircleDone: {
    backgroundColor: adminColors.success.text,
  },
  stepNumberText: {
    ...adminType.sectionHead,
    fontWeight: '700',
    color: adminColors.muted,
  },
  stepNumberTextCurrent: {
    color: adminColors.onBrand,
  },
  stepLabel: {
    ...adminType.rowMeta,
    fontSize: 8,
    lineHeight: 10,
    fontWeight: '500',
    color: adminColors.muted,
    textAlign: 'center',
  },
  stepLabelDone: {
    color: adminColors.muted,
    fontWeight: '600',
  },
  stepLabelCurrent: {
    color: adminColors.brand,
    fontWeight: '700',
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.lg,
  },
  noteText: {
    ...adminType.body,
    flex: 1,
    color: adminColors.muted,
  },
  noticeBox: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.brandSoft.border,
    padding: 14,
    marginBottom: adminSpacing.lg,
  },
  noticeText: {
    ...adminType.body,
    fontWeight: '600',
    color: adminColors.brandDeep,
  },
});

// ─── Goods Receipt Summary & Sub-Screens ────────────────────────────────────

export const RECEIPT_PALETTE = {
  primary: '#F0562A',
  btnOrange: '#E07026',
  headerBg: '#F0562A',
  headerText: '#FFFFFF',
  orangeDeep: '#7A2E14',
  noticeBgOrange: '#FDF3F0',
  noticeBorderOrange: '#F7CFC4',
  pageBg: '#F3EFE9',
  textInk: '#1A1A1A',
  textSecondary: '#5F5E5A',
  border: '#EEDCD3',
  borderRow: '#F2ECE5',
  cardBg: '#FFFFFF',
};

export function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function FileTextIcon({ size = 18, color = RECEIPT_PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="2" />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function HistoryIcon({ size = 18, color = RECEIPT_PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 7v5l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface GoodsReceiptSummaryScreenProps {
  grnId?: string;
  shipmentId?: string;
  source?: string;
  destination?: string;
  date?: string;
  expectedQty?: string;
  receivedQty?: string;
  acceptedQty?: string;
  rejectedQty?: string;
  onBack?: () => void;
  onAssignBatch?: () => void;
  onViewPreview?: () => void;
  onViewDetail?: () => void;
  onViewActivity?: () => void;
}

export function GoodsReceiptSummaryScreen({
  grnId = 'GRN-000842',
  shipmentId = 'SHP-000124',
  source = 'Farmer Admin',
  destination = 'Coonoor',
  date = '25 Sep 2026',
  expectedQty = '500 KG',
  receivedQty = '480 KG',
  acceptedQty = '445 KG',
  rejectedQty = '55 KG',
  onBack,
  onAssignBatch,
  onViewPreview,
  onViewDetail,
  onViewActivity,
}: GoodsReceiptSummaryScreenProps) {
  return (
    <View style={receiptStyles.root}>
      <StatusBar barStyle="light-content" backgroundColor={RECEIPT_PALETTE.primary} />
      <View style={receiptStyles.header}>
        <View style={receiptStyles.headerRow}>
          <TouchableOpacity style={receiptStyles.backBtn} onPress={onBack} activeOpacity={0.7} accessibilityLabel="Back">
            <ArrowBackIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={receiptStyles.headerTitle}>Goods Receipt Summary</Text>
        </View>
        <Text style={receiptStyles.headerSubtitle}>{grnId}</Text>
      </View>

      <ScrollView style={receiptStyles.scroll} contentContainerStyle={receiptStyles.scrollPad} showsVerticalScrollIndicator={false}>
        {/* 1. Shipment Section */}
        <View style={receiptStyles.sectionHeaderRow}>
          <Text style={receiptStyles.sectionTitle}>Shipment</Text>
        </View>
        <View style={receiptStyles.infoCard}>
          <View style={receiptStyles.gridRow}>
            <View style={receiptStyles.gridCol}>
              <Text style={receiptStyles.gridLabel}>Shipment ID</Text>
              <Text style={receiptStyles.gridValue}>{shipmentId}</Text>
            </View>
            <View style={receiptStyles.gridCol}>
              <Text style={receiptStyles.gridLabel}>Source</Text>
              <Text style={receiptStyles.gridValue}>{source}</Text>
            </View>
          </View>
          <View style={[receiptStyles.gridRow, { marginBottom: 0 }]}>
            <View style={receiptStyles.gridCol}>
              <Text style={receiptStyles.gridLabel}>Destination</Text>
              <Text style={receiptStyles.gridValue}>{destination}</Text>
            </View>
            <View style={receiptStyles.gridCol}>
              <Text style={receiptStyles.gridLabel}>Date</Text>
              <Text style={receiptStyles.gridValue}>{date}</Text>
            </View>
          </View>
        </View>

        {/* 2. Quantity Section */}
        <View style={receiptStyles.sectionHeaderRow}>
          <Text style={receiptStyles.sectionTitle}>Quantity</Text>
        </View>
        <View style={receiptStyles.listCard}>
          <View style={receiptStyles.listRow}>
            <Text style={receiptStyles.listLabel}>Expected</Text>
            <Text style={receiptStyles.listValue}>{expectedQty}</Text>
          </View>
          <View style={receiptStyles.listRow}>
            <Text style={receiptStyles.listLabel}>Received</Text>
            <Text style={receiptStyles.listValue}>{receivedQty}</Text>
          </View>
          <View style={receiptStyles.listRow}>
            <Text style={receiptStyles.listLabel}>Accepted</Text>
            <Text style={receiptStyles.listValue}>{acceptedQty}</Text>
          </View>
          <View style={[receiptStyles.listRow, { borderBottomWidth: 0 }]}>
            <Text style={receiptStyles.listLabel}>Rejected</Text>
            <Text style={receiptStyles.listValue}>{rejectedQty}</Text>
          </View>
        </View>

        {/* 3. Decision Section */}
        <View style={receiptStyles.sectionHeaderRow}>
          <Text style={receiptStyles.sectionTitle}>Decision</Text>
        </View>
        <View style={receiptStyles.decisionCard}>
          <Text style={receiptStyles.decisionValue}>PARTIAL ACCEPT</Text>
        </View>

        {/* 4. Next Steps Section */}
        <View style={receiptStyles.sectionHeaderRow}>
          <Text style={receiptStyles.sectionTitle}>Next Steps</Text>
        </View>
        <TouchableOpacity style={receiptStyles.nextStepCard} onPress={onAssignBatch} activeOpacity={0.8}>
          <Text style={receiptStyles.nextStepTitle}>Assign Batch →</Text>
        </TouchableOpacity>

        <View style={receiptStyles.actionGridRow}>
          <TouchableOpacity
            style={receiptStyles.actionGridCard}
            activeOpacity={0.8}
            onPress={onViewPreview || onAssignBatch}
          >
            <EyeIcon size={18} color={RECEIPT_PALETTE.primary} />
            <Text style={receiptStyles.actionGridLabel}>Preview</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={receiptStyles.actionGridCard}
            activeOpacity={0.8}
            onPress={onViewDetail || onAssignBatch}
          >
            <FileTextIcon size={18} color={RECEIPT_PALETTE.primary} />
            <Text style={receiptStyles.actionGridLabel}>Full Detail</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={receiptStyles.actionGridCard}
            activeOpacity={0.8}
            onPress={onViewActivity || onAssignBatch}
          >
            <HistoryIcon size={18} color={RECEIPT_PALETTE.primary} />
            <Text style={receiptStyles.actionGridLabel}>Activity</Text>
          </TouchableOpacity>
        </View>

        {/* 5. Receipt Reference */}
        <View style={receiptStyles.sectionHeaderRow}>
          <Text style={receiptStyles.sectionTitle}>Receipt Reference</Text>
        </View>
        <TouchableOpacity
          style={receiptStyles.referenceCard}
          onPress={() => Alert.alert('Receipt Reference', `${grnId} for Shipment ${shipmentId} is recorded in warehouse ledger.`)}
          activeOpacity={0.8}
        >
          <Text style={receiptStyles.referenceText}>{grnId}</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>

      <View style={receiptStyles.bottomBar}>
        <TouchableOpacity style={receiptStyles.actionBtn} onPress={onAssignBatch} activeOpacity={0.8}>
          <QrCodeIcon size={20} color="#FFFFFF" />
          <Text style={receiptStyles.actionBtnText}>Assign Batch</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export interface ReceiptPreviewScreenProps {
  grnId?: string;
  onBack?: () => void;
  onAssignBatch?: () => void;
  actionLabel?: string;
}

export function ReceiptPreviewScreen({
  grnId = 'GRN-000842',
  onBack,
  onAssignBatch,
  actionLabel,
}: ReceiptPreviewScreenProps) {
  return (
    <View style={receiptStyles.root}>
      <StatusBar barStyle="light-content" backgroundColor={RECEIPT_PALETTE.primary} />
      <View style={receiptStyles.header}>
        <View style={receiptStyles.headerRow}>
          <TouchableOpacity style={receiptStyles.backBtn} onPress={onBack} activeOpacity={0.7} accessibilityLabel="Back">
            <ArrowBackIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={receiptStyles.headerTitle}>Receipt Preview</Text>
        </View>
        <Text style={receiptStyles.headerSubtitle}>{grnId}</Text>
      </View>

      <ScrollView style={receiptStyles.scroll} contentContainerStyle={receiptStyles.scrollPad} showsVerticalScrollIndicator={false}>
        <View style={receiptStyles.sectionHeaderRow}>
          <Text style={receiptStyles.sectionTitle}>Receipt Preview</Text>
        </View>
        <View style={receiptStyles.previewNoteCard}>
          <Text style={receiptStyles.previewNoteLabel}>Goods Receipt Note</Text>
          <Text style={receiptStyles.previewNoteCode}>{grnId}</Text>
        </View>
        <View style={receiptStyles.previewNoticeCard}>
          <Text style={receiptStyles.previewNoticeText}>Printable/view-only representation — not editable from here.</Text>
        </View>

        <View style={receiptStyles.sectionHeaderRow}>
          <Text style={receiptStyles.sectionTitle}>Receipt Reference</Text>
        </View>
        <View style={receiptStyles.referenceCard}>
          <Text style={receiptStyles.referenceText}>{grnId}</Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      <View style={receiptStyles.bottomBar}>
        <TouchableOpacity style={receiptStyles.actionBtn} onPress={onAssignBatch} activeOpacity={0.8}>
          <QrCodeIcon size={20} color="#FFFFFF" />
          <Text style={receiptStyles.actionBtnText}>{actionLabel ?? 'Assign Batch'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export interface ReceiptDetailScreenProps {
  grnId?: string;
  onBack?: () => void;
  onAssignBatch?: () => void;
  actionLabel?: string;
}

export function ReceiptDetailScreen({
  grnId = 'GRN-000842',
  onBack,
  onAssignBatch,
  actionLabel,
}: ReceiptDetailScreenProps) {
  return (
    <View style={receiptStyles.root}>
      <StatusBar barStyle="light-content" backgroundColor={RECEIPT_PALETTE.primary} />
      <View style={receiptStyles.header}>
        <View style={receiptStyles.headerRow}>
          <TouchableOpacity style={receiptStyles.backBtn} onPress={onBack} activeOpacity={0.7} accessibilityLabel="Back">
            <ArrowBackIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={receiptStyles.headerTitle}>Receipt Detail</Text>
        </View>
        <Text style={receiptStyles.headerSubtitle}>{grnId}</Text>
      </View>

      <ScrollView style={receiptStyles.scroll} contentContainerStyle={receiptStyles.scrollPad} showsVerticalScrollIndicator={false}>
        <View style={receiptStyles.sectionHeaderRow}>
          <Text style={receiptStyles.sectionTitle}>Receipt Detail</Text>
        </View>
        <View style={receiptStyles.detailTextCard}>
          <Text style={receiptStyles.detailParagraph}>
            Complete finalized receipt — every field above (Shipment, Quantity, Quality, Grade & Product, Decision) merged into one read-only record referenced as {grnId}.
          </Text>
        </View>

        <View style={receiptStyles.sectionHeaderRow}>
          <Text style={receiptStyles.sectionTitle}>Receipt Reference</Text>
        </View>
        <View style={receiptStyles.referenceCard}>
          <Text style={receiptStyles.referenceText}>{grnId}</Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      <View style={receiptStyles.bottomBar}>
        <TouchableOpacity style={receiptStyles.actionBtn} onPress={onAssignBatch} activeOpacity={0.8}>
          <QrCodeIcon size={20} color="#FFFFFF" />
          <Text style={receiptStyles.actionBtnText}>{actionLabel ?? 'Assign Batch'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export interface ReceiptActivityScreenProps {
  grnId?: string;
  onBack?: () => void;
  onAssignBatch?: () => void;
  actionLabel?: string;
}

export function ReceiptActivityScreen({
  grnId = 'GRN-000842',
  onBack,
  onAssignBatch,
  actionLabel,
}: ReceiptActivityScreenProps) {
  return (
    <View style={receiptStyles.root}>
      <StatusBar barStyle="light-content" backgroundColor={RECEIPT_PALETTE.primary} />
      <View style={receiptStyles.header}>
        <View style={receiptStyles.headerRow}>
          <TouchableOpacity style={receiptStyles.backBtn} onPress={onBack} activeOpacity={0.7} accessibilityLabel="Back">
            <ArrowBackIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={receiptStyles.headerTitle}>Receipt Activity</Text>
        </View>
        <Text style={receiptStyles.headerSubtitle}>{grnId}</Text>
      </View>

      <ScrollView style={receiptStyles.scroll} contentContainerStyle={receiptStyles.scrollPad} showsVerticalScrollIndicator={false}>
        <View style={receiptStyles.sectionHeaderRow}>
          <Text style={receiptStyles.sectionTitle}>Receipt Activity</Text>
        </View>
        <View style={receiptStyles.activityCard}>
          <View style={receiptStyles.activityRow}>
            <Text style={receiptStyles.activityTitle}>Quantity Verified</Text>
            <Text style={receiptStyles.activityTime}>10:15 AM</Text>
          </View>
          <View style={receiptStyles.activityDashedDivider} />
          <View style={receiptStyles.activityRow}>
            <Text style={receiptStyles.activityTitle}>Quality Checked</Text>
            <Text style={receiptStyles.activityTime}>10:22 AM</Text>
          </View>
          <View style={receiptStyles.activityDashedDivider} />
          <View style={receiptStyles.activityRow}>
            <Text style={receiptStyles.activityTitle}>Decision: Partial Accept</Text>
            <Text style={receiptStyles.activityTime}>10:30 AM</Text>
          </View>
        </View>

        <View style={receiptStyles.sectionHeaderRow}>
          <Text style={receiptStyles.sectionTitle}>Receipt Reference</Text>
        </View>
        <View style={receiptStyles.referenceCard}>
          <Text style={receiptStyles.referenceText}>{grnId}</Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      <View style={receiptStyles.bottomBar}>
        <TouchableOpacity style={receiptStyles.actionBtn} onPress={onAssignBatch} activeOpacity={0.8}>
          <QrCodeIcon size={20} color="#FFFFFF" />
          <Text style={receiptStyles.actionBtnText}>{actionLabel ?? 'Assign Batch'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export const receiptStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: RECEIPT_PALETTE.pageBg,
  },
  header: {
    backgroundColor: RECEIPT_PALETTE.headerBg,
    paddingTop: Platform.OS === 'ios' ? 8 : 10,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  backBtn: {
    padding: 2,
    marginRight: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.95)',
    marginTop: 2,
    paddingLeft: 2,
  },
  scroll: {
    flex: 1,
    backgroundColor: RECEIPT_PALETTE.pageBg,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  sectionHeaderRow: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: RECEIPT_PALETTE.orangeDeep,
    letterSpacing: -0.2,
  },
  infoCard: {
    backgroundColor: RECEIPT_PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: RECEIPT_PALETTE.border,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  gridCol: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: RECEIPT_PALETTE.textSecondary,
    marginBottom: 5,
  },
  gridValue: {
    fontSize: 15,
    fontWeight: '800',
    color: RECEIPT_PALETTE.textInk,
  },
  listCard: {
    backgroundColor: RECEIPT_PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: RECEIPT_PALETTE.border,
    paddingHorizontal: 18,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: RECEIPT_PALETTE.borderRow,
  },
  listLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: RECEIPT_PALETTE.textInk,
  },
  listValue: {
    fontSize: 14.5,
    fontWeight: '800',
    color: RECEIPT_PALETTE.textInk,
  },
  decisionCard: {
    backgroundColor: RECEIPT_PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: RECEIPT_PALETTE.border,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  decisionValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#B86B14',
    letterSpacing: 0.5,
  },
  nextStepCard: {
    backgroundColor: RECEIPT_PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: RECEIPT_PALETTE.border,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  nextStepTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: RECEIPT_PALETTE.textInk,
  },
  actionGridRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  actionGridCard: {
    flex: 1,
    backgroundColor: RECEIPT_PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: RECEIPT_PALETTE.border,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  actionGridLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: RECEIPT_PALETTE.textInk,
  },
  referenceCard: {
    backgroundColor: RECEIPT_PALETTE.noticeBgOrange,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: RECEIPT_PALETTE.noticeBorderOrange,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  referenceText: {
    fontSize: 18,
    fontWeight: '900',
    color: RECEIPT_PALETTE.orangeDeep,
    letterSpacing: 1,
  },
  previewNoteCard: {
    backgroundColor: RECEIPT_PALETTE.noticeBgOrange,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: RECEIPT_PALETTE.noticeBorderOrange,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  previewNoteLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: RECEIPT_PALETTE.orangeDeep,
    marginBottom: 4,
  },
  previewNoteCode: {
    fontSize: 16.5,
    fontWeight: '900',
    color: RECEIPT_PALETTE.orangeDeep,
    letterSpacing: 0.5,
  },
  previewNoticeCard: {
    backgroundColor: RECEIPT_PALETTE.noticeBgOrange,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: RECEIPT_PALETTE.noticeBorderOrange,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  previewNoticeText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: RECEIPT_PALETTE.orangeDeep,
    textAlign: 'center',
    lineHeight: 18,
  },
  detailTextCard: {
    backgroundColor: RECEIPT_PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: RECEIPT_PALETTE.border,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  detailParagraph: {
    fontSize: 13.5,
    fontWeight: '700',
    color: RECEIPT_PALETTE.textInk,
    lineHeight: 21,
  },
  activityCard: {
    backgroundColor: RECEIPT_PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: RECEIPT_PALETTE.border,
    paddingHorizontal: 18,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  activityTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: RECEIPT_PALETTE.textInk,
  },
  activityTime: {
    fontSize: 12.5,
    fontWeight: '600',
    color: RECEIPT_PALETTE.textSecondary,
  },
  activityDashedDivider: {
    borderTopWidth: 1,
    borderTopColor: '#D9D3C7',
    borderStyle: 'dashed',
  },
  bottomBar: {
    backgroundColor: RECEIPT_PALETTE.pageBg,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
  },
  actionBtn: {
    backgroundColor: RECEIPT_PALETTE.btnOrange,
    borderRadius: 15,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: RECEIPT_PALETTE.btnOrange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  actionBtnText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
