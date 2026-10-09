/**
 * Building blocks shared by the notifications list, the notification detail
 * and the approval / exception alerts screens (design module M13 + M1-S06).
 *
 * The frame (orange header, warehouse pill / selector, cards, KPI tiles,
 * buttons, empty state) is the wallet area's WalletParts, already on the admin
 * theme. This file adds what is notification-specific: the rbac codes the
 * screens check, the action-target gates, the category look (icon + tone), the
 * horizontally scrolling filter tabs and the mark-all confirmation.
 *
 * `can` only decides what is worth rendering; the server re-checks every code
 * (CLAUDE.md 2.1).
 */
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType, type AdminTone } from '../../../theme';
import { WalletButton } from '../wallet-cashtopup/WalletParts';
import type {
  AlertRecordTarget,
  NotificationCategory,
  NotificationFilter,
  NotificationItem,
  NotificationTarget,
  PermissionCheck,
} from './types';

/** docs/rbac.json codes the notification screens check (each one exists there). */
export const NOTIFICATION_CODES = {
  /** List, detail and alerts. `all` for MAIN_WH_ADMIN and SUB_WH_ADMIN (own notifications). */
  view: 'notification.own.view',
  /** Mark one / all read (and clear). `all` for both warehouse roles. */
  markRead: 'notification.own.mark_read',
} as const;

/**
 * The code of the screen each action target opens. An action button is shown
 * only when the viewer may open its target (FINAL_LIST #61: e.g. the wallet
 * report needs wallet.cash_topup.process). Stock accepts either ledger code:
 * MAIN holds view_all, SUB holds view_own.
 */
const TARGET_CODES: Record<NotificationTarget, readonly string[]> = {
  ReviewReceiving: ['inventory.quality_check.perform'],
  Receiving: ['inventory.goods_receipt.record'],
  Stock: ['inventory.stock_ledger.view_all', 'inventory.stock_ledger.view_own'],
  Orders: ['order.list.view_all'],
  Wallet: ['wallet.cash_topup.process'],
  Returns: ['rma.request.process'],
};

/** True when the viewer may open the screen a notification action leads to. */
export function canOpenTarget(can: PermissionCheck, target: NotificationTarget | undefined): boolean {
  if (target === undefined) return false;
  return TARGET_CODES[target].some((code) => can(code));
}

/** Action button label on a list row (the Sub list's CTAs). */
export const TARGET_ROW_LABEL: Record<NotificationTarget, string> = {
  ReviewReceiving: 'Review',
  Receiving: 'View Receiving',
  Stock: 'View Stock',
  Orders: 'View Order',
  Wallet: 'View Wallet',
  Returns: 'View Return',
};

/** Primary button label on the detail screen (the Sub / Main detail designs). */
export const TARGET_DETAIL_LABEL: Record<NotificationTarget, string> = {
  ReviewReceiving: 'Review Receiving',
  Receiving: 'View Receiving',
  Stock: 'View Stock',
  Orders: 'View Order',
  Wallet: 'View Wallet Report',
  Returns: 'View Return',
};

/**
 * Code of the record an alert's "Open record" link opens. Viewing a record is
 * not approving it: approve / snooze / dismiss have no code (SPEC_GAPS W4k-2)
 * and are not rendered. Transfer accepts either inter-warehouse transfer code.
 */
const ALERT_RECORD_CODES: Record<AlertRecordTarget, readonly string[]> = {
  ExpenseRecord: ['finance.expense.log'],
  GoodsReceipt: ['inventory.goods_receipt.record'],
  LowStock: ['inventory.stock_ledger.view_all', 'inventory.stock_ledger.view_own'],
  Transfer: ['transfer.inter_warehouse.initiate', 'transfer.inter_warehouse.receive'],
};

export function canOpenAlertRecord(can: PermissionCheck, record: AlertRecordTarget | undefined): boolean {
  if (record === undefined) return false;
  return ALERT_RECORD_CODES[record].some((code) => can(code));
}

// ─── Filters ─────────────────────────────────────────────────────────────────

/** Categories behind each category filter tab (the base's tabs + the Sub list's). */
const FILTER_CATEGORIES: Record<Exclude<NotificationFilter, 'All' | 'Unread'>, readonly NotificationCategory[]> = {
  Receiving: ['shipment', 'received'],
  Quality: ['quality', 'mismatch'],
  Orders: ['order'],
  Inventory: ['inventory'],
  Finance: ['wallet'],
  Returns: ['returns'],
  System: ['system'],
  Messages: ['message'],
};

export const NOTIFICATION_FILTERS: readonly NotificationFilter[] = [
  'All',
  'Unread',
  'Receiving',
  'Quality',
  'Orders',
  'Inventory',
  'Finance',
  'Returns',
  'System',
  'Messages',
];

export function matchesFilter(item: NotificationItem, filter: NotificationFilter): boolean {
  if (filter === 'All') return true;
  if (filter === 'Unread') return !item.isRead;
  return FILTER_CATEGORIES[filter].includes(item.category);
}

/** Horizontally scrolling filter tabs with counts ("Unread (3)"). */
export function FilterTabs<T extends string>({
  options,
  value,
  onChange,
  countOf,
}: {
  options: readonly T[];
  value: T;
  onChange: (next: T) => void;
  countOf?: ((option: T) => number) | undefined;
}) {
  return (
    <View style={styles.filterBar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
        {options.map((option) => {
          const active = option === value;
          return (
            <TouchableOpacity
              key={option}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => onChange(option)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {countOf ? `${option} (${countOf(option)})` : option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Category look ───────────────────────────────────────────────────────────

/** Tone of each category's icon chip and tag (status pairs from the admin theme). */
export const CATEGORY_TONE: Record<NotificationCategory, AdminTone> = {
  shipment: 'info',
  received: 'success',
  quality: 'warning',
  mismatch: 'danger',
  inventory: 'purple',
  order: 'brandSoft',
  wallet: 'success',
  returns: 'warning',
  system: 'info',
  message: 'brandSoft',
};

interface IconProps {
  size?: number;
  color?: string;
}

function TruckIcon({ size = 20, color = adminColors.info.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function ClipboardIcon({ size = 20, color = adminColors.warning.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="4" width="14" height="17" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M9 2h6a1 1 0 0 1 1 1v2H8V3a1 1 0 0 1 1-1z" stroke={color} strokeWidth="2" />
      <Path d="M9 11h6M9 15h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function AlertTriangleIcon({ size = 20, color = adminColors.danger.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3L2 20h20L12 3z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="17" r="1" fill={color} />
    </Svg>
  );
}

function BoxIcon({ size = 20, color = adminColors.purple.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
        stroke={color}
        strokeWidth="2"
      />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckCircleIcon({ size = 20, color = adminColors.success.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M8 12l2.5 2.5L16 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BagIcon({ size = 20, color = adminColors.brandDeep }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 6h18M16 10a4 4 0 01-8 0" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WalletIcon({ size = 20, color = adminColors.success.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M2 10h20" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function ReturnIcon({ size = 20, color = adminColors.warning.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 14L4 9l5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 9h10.5a5.5 5.5 0 010 11H11" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WrenchIcon({ size = 20, color = adminColors.info.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.9 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DocumentIcon({ size = 20, color = adminColors.brandDeep }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function BellIcon({ size = 22, color = adminColors.muted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function DoubleCheckIcon({ size = 18, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L7 17l-5-5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M22 10l-7.5 7.5-2-2" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronRightIcon({ size = 18, color = adminColors.muted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** The category's icon in its tone colour. */
export function CategoryIcon({ category, size = 20 }: { category: NotificationCategory; size?: number }) {
  const color = adminColors[CATEGORY_TONE[category]].text;
  switch (category) {
    case 'shipment':
      return <TruckIcon size={size} color={color} />;
    case 'received':
      return <CheckCircleIcon size={size} color={color} />;
    case 'quality':
      return <ClipboardIcon size={size} color={color} />;
    case 'mismatch':
      return <AlertTriangleIcon size={size} color={color} />;
    case 'inventory':
      return <BoxIcon size={size} color={color} />;
    case 'order':
      return <BagIcon size={size} color={color} />;
    case 'wallet':
      return <WalletIcon size={size} color={color} />;
    case 'returns':
      return <ReturnIcon size={size} color={color} />;
    case 'system':
      return <WrenchIcon size={size} color={color} />;
    default:
      return <DocumentIcon size={size} color={color} />;
  }
}

/** Round icon chip in the category's soft tone. */
export function CategoryBadge({ category, size = ICON_CHIP }: { category: NotificationCategory; size?: number }) {
  return (
    <View
      style={[
        styles.iconChip,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: adminColors[CATEGORY_TONE[category]].bg },
      ]}
    >
      <CategoryIcon category={category} />
    </View>
  );
}

// ─── Confirmation ────────────────────────────────────────────────────────────

/**
 * Centered confirmation card (the Main "Mark All Notifications as Read?" step).
 * Same pattern as CancelOrderScreen: no translucent scrim token exists, so the
 * backdrop is the solid canvas and the card is raised with adminShadow.lg.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <DoubleCheckIcon color={adminColors.brandDeep} />
            <Text style={styles.modalTitle}>{title}</Text>
          </View>
          <View style={styles.modalMessageBox}>
            <Text style={styles.modalMessage}>{message}</Text>
          </View>
          <View style={styles.modalActions}>
            <WalletButton label={confirmLabel} onPress={onConfirm} />
            <WalletButton label="Cancel" variant="neutral" onPress={onCancel} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Icon chip diameter: an icon size, not spacing.
const ICON_CHIP = 42;

const styles = StyleSheet.create({
  filterBar: {
    backgroundColor: adminColors.card,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    paddingVertical: adminSpacing.sm,
  },
  filterScroll: { paddingHorizontal: adminSpacing.lg, gap: adminSpacing.sm },
  filterChip: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
  },
  filterChipActive: { backgroundColor: adminColors.brand, borderColor: adminColors.brand },
  filterChipText: { ...adminType.caption, color: adminColors.muted },
  filterChipTextActive: { color: adminColors.onBrand },

  iconChip: { alignItems: 'center', justifyContent: 'center' },

  // Was a translucent overlay; no translucent token, so a solid canvas scrim with the card raised by adminShadow.lg.
  modalBackdrop: {
    flex: 1,
    backgroundColor: adminColors.canvas,
    justifyContent: 'center',
    padding: adminSpacing.lg,
  },
  modalCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.brand,
    padding: adminSpacing.lg,
    ...adminShadow.lg,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm, marginBottom: adminSpacing.lg },
  modalTitle: { ...adminType.sectionHead, color: adminColors.brandDeep, flex: 1 },
  modalMessageBox: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.xs,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.lg,
  },
  modalMessage: { ...adminType.body, color: adminColors.ink },
  modalActions: { gap: adminSpacing.md },
});
