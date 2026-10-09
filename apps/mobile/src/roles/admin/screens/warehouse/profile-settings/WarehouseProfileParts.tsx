/**
 * Building blocks shared by the warehouse-facing profile screens (part B):
 * Warehouse Profile, Storage Information, Operating Information, Contact,
 * Documents and Warehouse Settings.
 *
 * The frame (orange header, cards, field grid, badges, buttons, tab bar) is
 * the wallet area's WalletParts; the account screens' menu rows are
 * ProfileParts. This file adds what the warehouse screens share: resolving
 * which warehouse a scope is looking at, the header for screens that show ONE
 * warehouse (Main picks it, Sub is locked to its own), a label/value row, a
 * fill bar and the icons.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { isAllWarehouses, LockIcon } from '../wallet-cashtopup/WalletParts';
import type { WarehouseScope } from './types';
import { PROFILE_WAREHOUSES } from './warehouseFixtures';

/** docs/rbac.json codes the warehouse-facing screens check (each one exists there). */
export const WAREHOUSE_PROFILE_CODES = {
  /** Set warehouse capacity limits. MAIN_WH_ADMIN all, SUB_WH_ADMIN none (reqs Ch.6 precedence). */
  capacitySet: 'warehouse.capacity.set',
} as const;

// ─── Scope helpers ───────────────────────────────────────────────────────────

/**
 * The ONE warehouse a single-warehouse screen shows: a Sub scope its own, Main
 * its selector pick, or the first option when Main has not picked one.
 */
export function singleWarehouseId(
  scope: WarehouseScope,
  selectedWarehouseId: string | undefined,
  options: readonly WarehouseScope[] = PROFILE_WAREHOUSES,
): string | undefined {
  if (!isAllWarehouses(scope)) return scope.warehouseId;
  return selectedWarehouseId ?? options[0]?.warehouseId;
}

/** The record of `warehouseId` in a list keyed by warehouse. */
export function recordFor<T extends { warehouseId: string }>(rows: readonly T[], warehouseId: string | undefined): T | undefined {
  return rows.find((row) => row.warehouseId === warehouseId);
}

/** Display name of a warehouse id from the scope or the options. */
export function warehouseNameOf(
  scope: WarehouseScope,
  warehouseId: string | undefined,
  options: readonly WarehouseScope[] = PROFILE_WAREHOUSES,
): string {
  if (warehouseId !== undefined && warehouseId === scope.warehouseId && scope.warehouseName) return scope.warehouseName;
  const option = options.find((o) => o.warehouseId === warehouseId);
  return option?.warehouseName ?? warehouseId ?? '';
}

/** '7,420 kg' from kilograms. */
export function formatKg(kg: number): string {
  return `${kg.toLocaleString('en-IN')} kg`;
}

// ─── Header ──────────────────────────────────────────────────────────────────

/**
 * Header content for a screen that shows one warehouse: Main picks one of the
 * options (no "All Warehouses" chip, since a profile of all warehouses means
 * nothing), Sub sees its own warehouse on the locked pill.
 */
export function SingleWarehouseHeader({
  scope,
  warehouseId,
  options = PROFILE_WAREHOUSES,
  onSelect,
}: {
  scope: WarehouseScope;
  warehouseId: string | undefined;
  options?: readonly WarehouseScope[] | undefined;
  onSelect?: ((warehouseId: string | undefined) => void) | undefined;
}) {
  if (!isAllWarehouses(scope) || onSelect === undefined) {
    return (
      <View style={styles.lockedPill}>
        {isAllWarehouses(scope) ? null : <LockIcon />}
        <Text style={styles.lockedPillText}>{warehouseNameOf(scope, warehouseId, options)}</Text>
      </View>
    );
  }
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
      {options.map((option) => {
        const active = option.warehouseId === warehouseId;
        return (
          <TouchableOpacity
            key={option.warehouseId ?? 'none'}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(option.warehouseId)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.warehouseName ?? option.warehouseId}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ─── Content pieces ──────────────────────────────────────────────────────────

/** Label on the left, value on the right, hairline above all but the first row. */
export function DetailRow({
  label,
  value,
  first = false,
  highlight = false,
  valueTone,
}: {
  label: string;
  value: string;
  first?: boolean | undefined;
  /** Today's row in the operating hours. */
  highlight?: boolean | undefined;
  valueTone?: 'muted' | 'danger' | 'success' | undefined;
}) {
  return (
    <View style={[styles.detailRow, !first && styles.detailRowDivider, highlight && styles.detailRowHighlight]}>
      <Text style={[styles.detailLabel, highlight && styles.detailHighlightText]}>{label}</Text>
      <Text
        style={[
          styles.detailValue,
          highlight && styles.detailHighlightText,
          valueTone === 'muted' && styles.valueMuted,
          valueTone === 'danger' && styles.valueDanger,
          valueTone === 'success' && styles.valueSuccess,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

/** Horizontal fill bar (capacity used, section fill). */
export function FillBar({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${clamped}%` }]} />
    </View>
  );
}

/** Tappable card row: icon chip, title, trailing label (map preview, document link). */
export function LinkCard({
  icon,
  title,
  actionLabel,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  actionLabel: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.linkCard} onPress={onPress} activeOpacity={0.75} accessibilityRole="button" accessibilityLabel={title}>
      <View style={styles.linkLeft}>
        {icon}
        <Text style={styles.linkTitle}>{title}</Text>
      </View>
      <Text style={styles.linkAction}>{actionLabel}</Text>
    </TouchableOpacity>
  );
}

// ─── Icons ───────────────────────────────────────────────────────────────────

interface IconProps {
  size?: number;
  color?: string;
}

export function WarehouseBuildingIcon({ size = 22, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 3l9 7H3l9-7z" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function RefreshIcon({ size = 18, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function MapPinIcon({ size = 18, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

export function MapFoldedIcon({ size = 18, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M1 6v15l7-4 8 4 7-4V2l-7 4-8-4-7 4zM8 2v15M16 6v15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function StorageRackIcon({ size = 20, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 21v-7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v7M10 17h4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ClockIcon({ size = 20, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 7v5l3 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PhoneIcon({ size = 20, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function MailIcon({ size = 16, color = adminColors.brandDeep }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="4" width="20" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M22 6l-10 7L2 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function DirectionsIcon({ size = 16, color = adminColors.brandDeep }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 11l19-9-9 19-2-8-8-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function DocumentIcon({ size = 20, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function WarningTriangleIcon({ size = 12, color = adminColors.warning.text }: IconProps) {
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

export function CloseIcon({ size = 20, color = adminColors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Fill bar height: a bar thickness, not spacing.
const TRACK_HEIGHT = 8;

const styles = StyleSheet.create({
  lockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: adminSpacing.xs,
    marginTop: adminSpacing.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandDeep,
  },
  lockedPillText: { ...adminType.rowTitle, color: adminColors.onBrand },
  chipRow: { gap: adminSpacing.sm, marginTop: adminSpacing.md },
  chip: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandDeep,
  },
  chipActive: { backgroundColor: adminColors.card },
  chipText: { ...adminType.rowTitle, color: adminColors.onBrand },
  chipTextActive: { color: adminColors.brand },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.sm,
    borderRadius: adminRadius.xs,
  },
  detailRowDivider: { borderTopWidth: 1, borderTopColor: adminColors.border },
  detailRowHighlight: { backgroundColor: adminColors.brandTint },
  detailLabel: { ...adminType.body, color: adminColors.muted, flex: 1 },
  detailValue: { ...adminType.rowTitle, color: adminColors.ink, textAlign: 'right', flexShrink: 1 },
  detailHighlightText: { color: adminColors.brandDeep, fontWeight: '800' },
  valueMuted: { color: adminColors.muted },
  valueDanger: { color: adminColors.danger.text },
  valueSuccess: { color: adminColors.success.text },

  track: {
    height: TRACK_HEIGHT,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.canvas,
    overflow: 'hidden',
    marginTop: adminSpacing.sm,
  },
  fill: { height: TRACK_HEIGHT, borderRadius: adminRadius.full, backgroundColor: adminColors.brand },

  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
  },
  linkLeft: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm },
  linkTitle: { ...adminType.rowTitle, color: adminColors.ink },
  linkAction: { ...adminType.rowTitle, color: adminColors.brand },
});

/** Shared layout for the warehouse screens' scroll content and section spacing. */
export const warehouseProfileLayout = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.xxl,
  },
  gap: { height: adminSpacing.md },
});
