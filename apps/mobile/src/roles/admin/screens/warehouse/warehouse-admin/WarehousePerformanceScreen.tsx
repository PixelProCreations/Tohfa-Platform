import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import { WalletScreen } from '../wallet-cashtopup/WalletParts';
import type { WarehouseScreenBaseProps } from './types';

export interface WarehousePerformanceProps extends WarehouseScreenBaseProps {}

export function WarehousePerformanceScreen({ onBack }: WarehousePerformanceProps) {
  return (
    <WalletScreen title="Warehouse Performance" onBack={onBack}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeading}>Warehouse Performance</Text>

        <View style={styles.metricsGridCard}>
          <View style={styles.twoByTwoRow}>
            <View style={styles.twoByTwoCol}>
              <Text style={styles.twoByTwoLabel}>Receipts (MTD)</Text>
              <Text style={styles.twoByTwoVal}>68,400 KG</Text>
            </View>
            <View style={styles.twoByTwoCol}>
              <Text style={styles.twoByTwoLabel}>Sales (MTD)</Text>
              <Text style={styles.twoByTwoVal}>₹1,45,10,000</Text>
            </View>
          </View>
          <View style={[styles.twoByTwoRow, { marginTop: adminSpacing.lg }]}>
            <View style={styles.twoByTwoCol}>
              <Text style={styles.twoByTwoLabel}>Quality Issues</Text>
              <Text style={styles.twoByTwoVal}>18</Text>
            </View>
            <View style={styles.twoByTwoCol}>
              <Text style={styles.twoByTwoLabel}>Avg Turnaround</Text>
              <Text style={styles.twoByTwoVal}>2.4 days</Text>
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

