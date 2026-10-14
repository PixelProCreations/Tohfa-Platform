/**
 * Building blocks shared by the warehouse-admin screens, on the admin theme.
 * The frame, cards, chips and buttons come from wallet-cashtopup/WalletParts
 * like the other warehouse areas; this file adds the permission codes, the
 * icons, the "More Views" tile and the capacity bar.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';

/** docs/rbac.json codes the warehouse-admin screens check (grants in types.ts). */
export const WAREHOUSE_ADMIN_CODES = {
  /** Warehouse Overview, City Detail, Performance. MAIN all, SUB none. */
  allView: 'warehouse.all.view',
  /** Manage Sub Warehouse Admins + Create SWA wizard, the Manage Warehouses tile. MAIN all, SUB none. */
  swaCreate: 'admin.sub_wh_admin.create',
  /** Warehouse Settings (route-guarded by profile-settings on the same code). MAIN all, SUB none. */
  capacitySet: 'warehouse.capacity.set',
} as const;

interface IconProps {
  size?: number;
  color?: string;
}

export function ScaleIcon({ size = 22, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 21h10M12 3v18M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function TrendIcon({ size = 22, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m22 7-8.5 8.5-5-5L2 17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 7h6v6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function RefreshIcon({ size = 22, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function GearIcon({ size = 22, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 7.18 19.73l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3.18 14H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.18-2.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 10 3.18V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 2.82 1.18l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 20.82 10H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke={color}
        strokeWidth="2"
      />
    </Svg>
  );
}

export function ManageUsersIcon({ size = 22, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Path d="M17 11v6M14 14h6M9 14c-4.42 0-8 2.24-8 5v2h10" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function UserIcon({ size = 24, color = adminColors.brandDeep, crossed = false }: IconProps & { crossed?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" />
      <Path d="M20 21c0-4-3-7-8-7s-8 3-8 7" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {crossed ? <Path d="M4 4l16 16" stroke={color} strokeWidth="2" strokeLinecap="round" /> : null}
    </Svg>
  );
}

export function AddUserIcon({ size = 20, color = adminColors.onBrand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="8" r="4" stroke={color} strokeWidth="2" />
      <Path d="M17 21c0-4-3-7-8-7s-8 3-8 7M19 8v6M16 11h6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function DocumentIcon({ size = 20, color = adminColors.brand }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function EyeIcon({ size = 16, color = adminColors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

export function CapacityIcon({ size = 16, color = adminColors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M3 10h18M10 14h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

/** Square tile of the "More Views" grid. */
export function ViewTile({ label, icon, onPress }: { label: string; icon: React.ReactNode; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.tile} onPress={onPress} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={label}>
      {icon}
      <Text style={styles.tileLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export function ViewTileGrid({ children }: { children: React.ReactNode }) {
  return <View style={styles.tileGrid}>{children}</View>;
}

/** Occupancy percent, rounded; 0 when the capacity is unknown. */
export function utilizationPercent(stockKg: number, capacityKg: number): number {
  return capacityKg > 0 ? Math.round((stockKg / capacityKg) * 100) : 0;
}

/** '3,420 kg' */
export function formatAdminKg(kg: number): string {
  return `${kg.toLocaleString('en-IN')} kg`;
}

/** Capacity bar; the warning tone marks a warehouse whose data says it is near capacity. */
export function CapacityBar({ percent, warning = false }: { percent: number; warning?: boolean }) {
  const width = `${Math.max(0, Math.min(100, percent))}%` as const;
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width, backgroundColor: warning ? adminColors.warning.text : adminColors.brand }]} />
    </View>
  );
}

const TRACK_HEIGHT = 8;

const styles = StyleSheet.create({
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpacing.md },
  tile: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.lg,
    alignItems: 'center',
    gap: adminSpacing.sm,
    ...adminShadow.sm,
  },
  tileLabel: { ...adminType.rowTitle, color: adminColors.ink, textAlign: 'center' },
  track: { height: TRACK_HEIGHT, borderRadius: adminRadius.full, backgroundColor: adminColors.canvas, overflow: 'hidden' },
  fill: { height: TRACK_HEIGHT, borderRadius: adminRadius.full },
});
