import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import { OverviewDashboardCard, OverviewCardsGrid } from '../../../components';
import { WalletScreen } from '../wallet-cashtopup/WalletParts';
import type { WarehouseScreenBaseProps } from './types';

export interface WarehouseCapacitySummaryProps extends WarehouseScreenBaseProps {}

export function WarehouseCapacitySummaryScreen({ onBack }: WarehouseCapacitySummaryProps) {
  return (
    <WalletScreen title="Capacity Summary" onBack={onBack}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeading}>Warehouse Capacity Summary</Text>

        <OverviewCardsGrid style={{ marginBottom: adminSpacing.lg }}>
          <OverviewDashboardCard
            value="12,840 KG"
            title="Used Capacity"
            icon="inventory"
            titlePosition="bottom"
          />
          <OverviewDashboardCard
            value="4,160 KG"
            title="Available Capacity"
            icon="box"
            titlePosition="bottom"
          />
          <OverviewDashboardCard
            value="28"
            title="Storage Areas"
            icon="receiving"
            titlePosition="bottom"
          />
          <OverviewDashboardCard
            value="75.5%"
            title="Utilization"
            icon="truck"
            titlePosition="bottom"
          />
        </OverviewCardsGrid>
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

