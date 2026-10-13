import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing } from '../../../theme';
import {
  LockIcon,
  SectionTitle,
  StatusBadge,
  WalletScreen,
} from '../wallet-cashtopup/WalletParts';
import type { WarehouseScreenBaseProps } from './types';

function BoxOutlineIcon({ size = 20, color = '#9A3412' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M3 10h18M10 14h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ClockOutlineIcon({ size = 20, color = '#9A3412' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 7v5l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface StorageLocationDetailScreenProps extends WarehouseScreenBaseProps {
  locationId?: string | undefined;
  onViewStock?: (() => void) | undefined;
  onViewActivity?: (() => void) | undefined;
}

export function StorageLocationDetailScreen({
  onBack,
  onViewStock,
  onViewActivity,
}: StorageLocationDetailScreenProps) {
  return (
    <WalletScreen
      title="Rack 02 · Shelf 03"
      onBack={onBack}
      headerRight={<StatusBadge label="Occupied" tone="danger" />}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <SectionTitle>Location Information</SectionTitle>
        <View style={styles.card}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Location ID</Text>
              <Text style={styles.fieldValue}>LOC-COO-A02-S03</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Storage Type</Text>
              <Text style={styles.fieldValue}>Cold Storage</Text>
            </View>
          </View>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Section</Text>
              <Text style={styles.fieldValue}>A</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Rack</Text>
              <Text style={styles.fieldValue}>02</Text>
            </View>
          </View>
          <View style={styles.gridRowSingle}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Shelf</Text>
              <Text style={styles.fieldValue}>03</Text>
            </View>
          </View>
        </View>

        <SectionTitle>Occupancy</SectionTitle>
        <View style={styles.card}>
          <View style={styles.occupancyHeader}>
            <Text style={styles.occupancyTitle}>Current</Text>
            <Text style={styles.occupancyPercent}>68%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '68%' }]} />
          </View>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Capacity</Text>
              <Text style={styles.fieldValue}>500 KG</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Available</Text>
              <Text style={styles.fieldValue}>160 KG</Text>
            </View>
          </View>
        </View>

        <SectionTitle>Stored Stock</SectionTitle>
        <View style={styles.stockCard}>
          <View style={styles.stockHeader}>
            <Text style={styles.stockTitle}>Tomato</Text>
            <Text style={styles.stockQty}>140 KG</Text>
          </View>
          <Text style={styles.stockSubtitle}>Grade 1</Text>
        </View>

        <View style={styles.stockCard}>
          <View style={styles.stockHeader}>
            <Text style={styles.stockTitle}>Carrot</Text>
            <Text style={styles.stockQty}>80 KG</Text>
          </View>
          <Text style={styles.stockSubtitle}>Grade 1</Text>
        </View>

        <SectionTitle>Actions</SectionTitle>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onViewStock}
          activeOpacity={0.75}
          accessibilityRole="button"
        >
          <BoxOutlineIcon size={20} color="#9A3412" />
          <Text style={styles.actionButtonText}>View Stock</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={onViewActivity}
          activeOpacity={0.75}
          accessibilityRole="button"
        >
          <ClockOutlineIcon size={20} color="#9A3412" />
          <Text style={styles.actionButtonText}>View Activity</Text>
        </TouchableOpacity>


      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: adminSpacing.lg,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    marginBottom: adminSpacing.lg,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  gridRowSingle: {
    flexDirection: 'row',
  },
  gridCol: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 13,
    color: adminColors.muted,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  occupancyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  occupancyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  occupancyPercent: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D97706',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#F3EFEA',
    borderRadius: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#D97706',
    borderRadius: 4,
  },
  stockCard: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 14,
    marginBottom: 10,
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  stockTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  stockQty: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  stockSubtitle: {
    fontSize: 13,
    color: adminColors.muted,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    backgroundColor: adminColors.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D97706',
    marginBottom: 10,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#9A3412',
  },
  noteCard: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 14,
    marginTop: 6,
    alignItems: 'flex-start',
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#92400E',
    fontWeight: '500',
  },
});
