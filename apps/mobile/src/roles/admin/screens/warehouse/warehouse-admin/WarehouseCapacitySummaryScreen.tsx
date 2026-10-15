import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import { WalletScreen } from '../wallet-cashtopup/WalletParts';
import type { WarehouseScreenBaseProps } from './types';

export interface WarehouseCapacitySummaryProps extends WarehouseScreenBaseProps {}

export function WarehouseCapacitySummaryScreen({ onBack }: WarehouseCapacitySummaryProps) {
  return (
    <WalletScreen title="Capacity Summary" onBack={onBack}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeading}>Warehouse Capacity Summary</Text>

        <View style={styles.metricsGridCard}>
          <View style={styles.twoByTwoRow}>
            <View style={styles.twoByTwoCol}>
              <Text style={styles.twoByTwoLabel}>Used Capacity</Text>
              <Text style={styles.twoByTwoVal}>12,840 KG</Text>
            </View>
            <View style={styles.twoByTwoCol}>
              <Text style={styles.twoByTwoLabel}>Available Capacity</Text>
              <Text style={styles.twoByTwoVal}>4,160 KG</Text>
            </View>
          </View>
          <View style={[styles.twoByTwoRow, { marginTop: adminSpacing.lg }]}>
            <View style={styles.twoByTwoCol}>
              <Text style={styles.twoByTwoLabel}>Storage Areas</Text>
              <Text style={styles.twoByTwoVal}>28</Text>
            </View>
            <View style={styles.twoByTwoCol}>
              <Text style={styles.twoByTwoLabel}>Utilization</Text>
              <Text style={styles.twoByTwoVal}>75.5%</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: 40,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.md,
  },
  metricsGridCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  twoByTwoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  twoByTwoCol: {
    flex: 1,
  },
  twoByTwoLabel: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  twoByTwoVal: {
    ...adminType.kpiValue,
    color: adminColors.ink,
    marginTop: adminSpacing.xs,
  },
  noticeBox: {
    backgroundColor: adminColors.brandSoft.bg,
    borderWidth: 1,
    borderColor: adminColors.brandSoft.border,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    marginTop: adminSpacing.lg,
    marginBottom: adminSpacing.xl,
  },
  noticeText: {
    ...adminType.caption,
    color: adminColors.brandSoft.text,
    lineHeight: 18,
    fontWeight: '500',
  },
});

