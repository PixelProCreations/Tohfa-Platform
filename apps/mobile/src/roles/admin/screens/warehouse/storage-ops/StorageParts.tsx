/**
 * Building blocks shared by the storage-ops screens (design module M4), on the
 * admin theme. The frame, cards, chips and buttons come from
 * wallet-cashtopup/WalletParts like the other warehouse areas; this file only
 * adds the storage-specific icons, the action tile and the permission codes.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Polyline, Rect } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';

/** docs/rbac.json codes the storage-ops screens check (MAIN / SUB grants in types.ts). */
export const STORAGE_CODES = {
  /** Add Material, Add Stock, Receive, Issue. MAIN all, SUB own. */
  materialManage: 'inventory.material_handling.manage',
  /** Storage location detail 'View Stock' link. MAIN all, SUB own. */
  batchView: 'inventory.batch.view',
  /** Confirm Location Assignment. MAIN all, SUB all. */
  batchAssign: 'inventory.batch.assign',
  /** Manage Capacity Limits link (the edit itself lives in Warehouse Settings). MAIN all, SUB none. */
  capacitySet: 'warehouse.capacity.set',
  /** Consolidated all-warehouse views: Warehouse Performance, the capacity comparison. MAIN all, SUB none. */
  allWarehousesView: 'warehouse.all.view',
  /** The warehouse workforce roster (Top Performing Staff). MAIN all, SUB own. */
  staffRoster: 'warehouse.staff.list_view',
} as const;

interface IconProps {
  size?: number;
  color?: string;
}

export function ReceiveIcon({ size = 24, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 4v16h16V4H4z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 8v8M8 12l4 4 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IssueIcon({ size = 24, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 4v16h16V4H4z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 16V8M8 12l4-4 4 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function HistoryIcon({ size = 24, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 8v4l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PlusIcon({ size = 20, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function MinusIcon({ size = 16, color = adminColors.muted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </Svg>
  );
}

export function ChevronDownIcon({ size = 20, color = adminColors.muted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ClipboardIcon({ size = 20, color = adminColors.warning.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Rect x="8" y="2" width="8" height="4" rx="1" stroke={color} strokeWidth="2" />
      <Path d="M9 14l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function TrendingDownIcon({ size = 20, color = adminColors.danger.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="23 18 13.5 8.5 8.5 13.5 1 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="17 18 23 18 23 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function TrendingUpIcon({ size = 18, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M23 6l-9.5 9.5-5-5L1 18" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M17 6h6v6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function BoxIcon({ size = 20, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function WarningTriangleIcon({ size = 18, color = adminColors.danger.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L1 21h22L12 2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 9v4M12 17h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function WarehouseIcon({ size = 20, color = adminColors.warning.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 21V9l9-6 9 6v12H3z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 21v-6h6v6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CheckCircleIcon({ size = 14, color = adminColors.success.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M8 12l2.5 2.5L16 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** One square action tile (Receive / Issue / History). Several share a row. */
export function ActionTile({ label, icon, onPress }: { label: string; icon: React.ReactNode; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.actionTile} onPress={onPress} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={label}>
      {icon}
      <Text style={styles.actionTileText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function ActionTileRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.actionRow}>{children}</View>;
}

/** Thin occupancy bar; `percent` is clamped to 0-100. */
export function ProgressBar({ percent, tone = 'brand' }: { percent: number; tone?: 'brand' | 'success' | 'warning' | 'danger' }) {
  const width = `${Math.max(0, Math.min(100, percent))}%` as const;
  const fill = tone === 'brand' ? adminColors.brand : adminColors[tone].text;
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width, backgroundColor: fill }]} />
    </View>
  );
}

/** Occupancy percent of a location / warehouse, rounded; 0 when the capacity is unknown. */
export function occupancyPercent(currentKg: number, capacityKg: number): number {
  return capacityKg > 0 ? Math.round((currentKg / capacityKg) * 100) : 0;
}

/** '2,000 kg' */
export function formatKg(kg: number): string {
  return `${kg.toLocaleString('en-IN')} kg`;
}

const styles = StyleSheet.create({
  actionRow: { flexDirection: 'row', gap: adminSpacing.md, marginBottom: adminSpacing.lg },
  actionTile: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...adminShadow.sm,
  },
  actionTileText: { ...adminType.rowTitle, color: adminColors.ink },
  track: { height: 8, borderRadius: adminRadius.full, backgroundColor: adminColors.canvas, overflow: 'hidden' },
  fill: { height: 8, borderRadius: adminRadius.full },
});
