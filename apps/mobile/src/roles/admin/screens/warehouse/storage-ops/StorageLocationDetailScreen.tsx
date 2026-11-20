import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import {
  LockIcon,
  StatusBadge,
  WalletScreen,
} from '../wallet-cashtopup/WalletParts';
import type { WarehouseScreenBaseProps } from './types';

function BoxOutlineIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="1.8" />
      <Path d="M3 10h18M10 14h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function ClockOutlineIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path d="M12 7v5l3 2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export interface StorageLocationDetailScreenProps extends WarehouseScreenBaseProps {
  locationId?: string | undefined;
  onViewStock?: (() => void) | undefined;
  onViewActivity?: (() => void) | undefined;
}

export function StorageLocationDetailScreen({
  locationId = 'LOC-COO-A02-S03',
  onBack,
  onViewStock,
  onViewActivity,
}: StorageLocationDetailScreenProps) {
  const isOccupied = true;

  const stockRows = [
    { name: 'Tomato', grade: 'Grade 1', qty: '140 KG' },
    { name: 'Carrot', grade: 'Grade 1', qty: '80 KG' },
  ];

  return (
    <WalletScreen
      title="Rack 02 - Shelf 03"
      onBack={onBack}
      headerRight={<StatusBadge label="Occupied" tone="danger" />}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── 1. Location Information ─── */}
        <Text style={styles.sectionHeading}>Location Information</Text>
        <View style={styles.card}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.label}>Location ID</Text>
              <Text style={styles.value}>LOC-COO-A02-S03</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.label}>Storage Type</Text>
              <Text style={styles.value}>Cold Storage</Text>
            </View>
          </View>

          <View style={[styles.gridRow, styles.gridRowSpacing]}>
            <View style={styles.gridCol}>
              <Text style={styles.label}>Section</Text>
              <Text style={styles.value}>A</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.label}>Rack</Text>
              <Text style={styles.value}>02</Text>
            </View>
          </View>

          <View style={[styles.gridRow, styles.gridRowSpacing]}>
            <View style={styles.gridCol}>
              <Text style={styles.label}>Shelf</Text>
              <Text style={styles.value}>03</Text>
            </View>
            <View style={styles.gridCol} />
          </View>
        </View>

        {/* ─── 2. Occupancy ─── */}
        <Text style={styles.sectionHeading}>Occupancy</Text>
        <View style={styles.card}>
          <View style={styles.occupancyHeaderRow}>
            <Text style={styles.occupancyLabel}>Current</Text>
            <Text style={styles.occupancyValue}>68%</Text>
          </View>

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '68%' }]} />
          </View>

          <View style={[styles.gridRow, { marginTop: 14 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.label}>Capacity</Text>
              <Text style={styles.value}>500 KG</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.label}>Available</Text>
              <Text style={styles.value}>160 KG</Text>
            </View>
          </View>
        </View>

        {/* ─── 3. Stored Stock ─── */}
        <Text style={styles.sectionHeading}>Stored Stock</Text>
        <View style={styles.card}>
          {stockRows.map((stock, idx) => (
            <React.Fragment key={stock.name}>
              {idx > 0 && <View style={styles.divider} />}
              <View style={styles.stockRow}>
                <View>
                  <Text style={styles.stockName}>{stock.name}</Text>
                  <Text style={styles.stockGrade}>{stock.grade}</Text>
                </View>
                <Text style={styles.stockQty}>{stock.qty}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* ─── 4. Actions ─── */}
        <Text style={styles.sectionHeading}>Actions</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.outlineActionBtn}
            onPress={onViewStock}
            activeOpacity={0.75}
            accessibilityRole="button"
          >
            <BoxOutlineIcon size={18} color={adminColors.brand} />
            <Text style={styles.outlineActionBtnText}>View Stock</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.outlineActionBtn}
            onPress={onViewActivity}
            activeOpacity={0.75}
            accessibilityRole="button"
          >
            <ClockOutlineIcon size={18} color={adminColors.brand} />
            <Text style={styles.outlineActionBtnText}>View Activity</Text>
          </TouchableOpacity>
        </View>

        {/* ─── 5. Bottom Notice ─── */}
        <View style={styles.noticeContainer}>
          <LockIcon size={14} color={adminColors.brand} />
          <Text style={styles.noticeText}>
            SWA views this location's stock and activity here — this is a deep-link into inventory data, not a second stock-
          </Text>
        </View>
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: adminSpacing.lg,
    paddingBottom: 40,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 10,
    marginTop: 4,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    marginBottom: 18,
    ...adminShadow.sm,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridRowSpacing: {
    marginTop: 14,
  },
  gridCol: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: adminColors.muted,
    marginBottom: 3,
  },
  value: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
  occupancyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  occupancyLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: adminColors.ink,
  },
  occupancyValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D97706',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#F3F0EA',
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#D97706',
    borderRadius: 3,
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  stockName: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
  stockGrade: {
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 2,
  },
  stockQty: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: adminColors.border,
  },
  actionsContainer: {
    gap: 10,
    marginBottom: 20,
  },
  outlineActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    height: 48,
    gap: 8,
    ...adminShadow.sm,
  },
  outlineActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
  noticeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  noticeText: {
    fontSize: 11,
    color: adminColors.muted,
    flex: 1,
    lineHeight: 16,
  },
});
