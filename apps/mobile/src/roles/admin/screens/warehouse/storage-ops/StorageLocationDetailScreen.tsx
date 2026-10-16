import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import {
  LockIcon,
  WalletScreen,
} from '../wallet-cashtopup/WalletParts';
import { STORAGE_LOCATIONS } from '../profile-settings/warehouseFixtures';
import type { WarehouseScreenBaseProps } from './types';

function BoxOutlineIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M3 10h18M10 14h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export interface StorageLocationDetailScreenProps extends WarehouseScreenBaseProps {
  locationId?: string | undefined;
  onViewStock?: (() => void) | undefined;
  onViewActivity?: (() => void) | undefined;
}

export function StorageLocationDetailScreen({
  scope,
  locationId = 'CS-A01',
  onBack,
  onViewStock,
}: StorageLocationDetailScreenProps) {
  const fallbackLoc = {
    id: 'CS-A01',
    warehouseId: 'WH-COON',
    name: 'Cold Storage A',
    code: 'CS-A01',
    type: 'Cold Storage',
    status: 'Active',
    capacityKg: 2000,
    currentKg: 1850,
  };
  const loc = STORAGE_LOCATIONS.find((l) => l.id === locationId) ?? STORAGE_LOCATIONS[0] ?? fallbackLoc;
  const whName = scope?.warehouseName ?? 'Coonoor Warehouse';

  const usageItems = [
    { name: 'Carrot', qty: '420 kg' },
    { name: 'Cabbage', qty: '320 kg' },
    { name: 'Beans', qty: '210 kg' },
  ];

  const capacityText = `${loc.capacityKg.toLocaleString('en-IN')} kg`;
  const occupancyText = `${loc.currentKg.toLocaleString('en-IN')} kg`;
  const availableKg = Math.max(0, loc.capacityKg - loc.currentKg);
  const availableText = `${availableKg.toLocaleString('en-IN')} kg`;

  return (
    <WalletScreen
      title="Storage Location"
      onBack={onBack}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.scopeRow}>
          <LockIcon size={14} color={adminColors.muted} />
          <Text style={styles.scopeText}>{whName}</Text>
        </View>

        <Text style={styles.locationTitle}>{`${loc.name} — ${loc.code}`}</Text>

        <View style={styles.card}>
          <View style={styles.infoGridRow}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={styles.infoValue}>{loc.status}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Capacity</Text>
              <Text style={styles.infoValue}>{capacityText}</Text>
            </View>
          </View>
          <View style={[styles.infoGridRow, styles.infoGridRowSpaced]}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Current Occupancy</Text>
              <Text style={styles.infoValue}>{occupancyText}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>Available</Text>
              <Text style={styles.infoValue}>{availableText}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Location Usage</Text>
        <View style={styles.usageCard}>
          {usageItems.map((item, idx) => (
            <React.Fragment key={item.name}>
              {idx > 0 ? <View style={styles.usageDivider} /> : null}
              <View style={styles.usageRow}>
                <Text style={styles.usageItemName}>{item.name}</Text>
                <Text style={styles.usageItemQty}>{item.qty}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        <TouchableOpacity
          style={styles.viewStockButton}
          onPress={onViewStock}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="View Stock"
        >
          <BoxOutlineIcon size={20} color={adminColors.onBrand} />
          <Text style={styles.viewStockButtonText}>View Stock</Text>
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
  scopeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  scopeText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  locationTitle: {
    ...adminType.title,
    color: adminColors.ink,
    marginBottom: adminSpacing.lg,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.xl,
  },
  infoGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoGridRowSpaced: {
    marginTop: 16,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: 4,
  },
  infoValue: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.md,
  },
  usageCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: 4,
    marginBottom: adminSpacing.xl,
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  usageDivider: {
    height: 1,
    backgroundColor: adminColors.border,
  },
  usageItemName: {
    ...adminType.body,
    color: adminColors.ink,
  },
  usageItemQty: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  viewStockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.lg,
    height: 50,
    gap: adminSpacing.xs,
  },
  viewStockButtonText: {
    ...adminType.sectionHead,
    color: adminColors.onBrand,
  },
});
