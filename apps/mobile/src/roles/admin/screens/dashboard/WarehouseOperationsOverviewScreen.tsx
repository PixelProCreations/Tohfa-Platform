/**
 * Warehouse & Operations Overview Screen
 * Exact implementation of Image 1 Left.
 * Reused across Super Admin, TOHFA Admin, and Main Warehouse Admin.
 */
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  adminColors,
  adminRadius,
  adminSpacing,
  adminType,
} from '../../theme';
import {
  BackArrowIcon,
  BuildingWarehouseIcon,
  ClipboardListIcon,
  FilterSlidersIcon,
  PackageBoxIcon,
  PieChartIcon,
  SwitchArrowsIcon,
} from '../../components/AdminIcons';
import {
  OverviewActionCard,
  OverviewCardsGrid,
  OverviewDashboardCard,
  OverviewSectionHeader,
} from '../../components/OverviewDashboardCard';
import { AdminStatusBadge } from '../../components';
import { t } from '../../i18n';

export interface WarehouseOperationsOverviewScreenProps {
  can?: (code: string) => boolean;
  onBack: () => void;
  onNavigateSubScreen?: (subscreen: string) => void;
}

const WAREHOUSE_LIST = [
  {
    id: 'wh-1',
    name: 'Ooty (WH-MAIN)',
    capacityMeta: '50,000 kg capacity · 42% used',
    status: 'Active' as const,
    tone: 'success' as const,
  },
  {
    id: 'wh-2',
    name: 'Coonoor (WH-SUB1)',
    capacityMeta: '40,000 kg capacity · 38% used',
    status: 'Active' as const,
    tone: 'success' as const,
  },
  {
    id: 'wh-3',
    name: 'Kotagiri (WH-SUB2)',
    capacityMeta: 'Activation in progress',
    status: 'Pending' as const,
    tone: 'warning' as const,
  },
  {
    id: 'wh-4',
    name: 'Gudalur Market (WH-SUB3)',
    capacityMeta: '20,000 kg capacity · 28% used',
    status: 'Active' as const,
    tone: 'success' as const,
  },
];

export function WarehouseOperationsOverviewScreen({
  can,
  onBack,
  onNavigateSubScreen,
}: WarehouseOperationsOverviewScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <BackArrowIcon size={20} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Warehouse & Operations</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 6 KPI Cards Grid */}
        <OverviewCardsGrid style={styles.kpiGrid}>
          <OverviewDashboardCard
            title="TOTAL WAREHOUSES"
            value="4"
            titlePosition="top"
            onPress={() => onNavigateSubScreen?.('warehouse_list')}
          />
          <OverviewDashboardCard
            title="INVENTORY (TOTAL)"
            value="130,000 kg"
            titlePosition="top"
            onPress={() => onNavigateSubScreen?.('inventory_flow')}
          />
          <OverviewDashboardCard
            title="PENDING RECEIPTS"
            value="3"
            titlePosition="top"
            onPress={() => onNavigateSubScreen?.('receiving_qc')}
          />
          <OverviewDashboardCard
            title="PENDING VERIFICATIONS"
            value="2"
            titlePosition="top"
            onPress={() => onNavigateSubScreen?.('verification_flow')}
          />
          <OverviewDashboardCard
            title="ACTIVE TRANSFERS"
            value="1"
            titlePosition="top"
            onPress={() => onNavigateSubScreen?.('transfers_flow')}
          />
          <OverviewDashboardCard
            title="EXCEPTIONS"
            value="2"
            titlePosition="top"
            onPress={() => onNavigateSubScreen?.('exceptions_flow')}
          />
        </OverviewCardsGrid>

        {/* Quick Access */}
        <OverviewSectionHeader title="Quick Access" />
        <OverviewCardsGrid style={styles.quickGrid}>
          <OverviewActionCard
            title="View All Warehouses"
            icon={<BuildingWarehouseIcon size={20} color={adminColors.brandDeep} />}
            onPress={() => onNavigateSubScreen?.('warehouse_list')}
          />
          <OverviewActionCard
            title="View Stock"
            icon={<PackageBoxIcon size={20} color={adminColors.brandDeep} />}
            onPress={() => onNavigateSubScreen?.('inventory_flow')}
          />
          <OverviewActionCard
            title="Review Verification"
            icon={<ClipboardListIcon size={20} color={adminColors.brandDeep} />}
            onPress={() => onNavigateSubScreen?.('verification_flow')}
          />
          {can ? (
            can('transfer.inter_warehouse.initiate') ? (
              <OverviewActionCard
                title="Initiate Transfer"
                icon={<SwitchArrowsIcon size={20} color={adminColors.brandDeep} />}
                onPress={() => onNavigateSubScreen?.('transfers_flow')}
              />
            ) : null
          ) : (
            <OverviewActionCard
              title="Initiate Transfer"
              icon={<SwitchArrowsIcon size={20} color={adminColors.brandDeep} />}
              onPress={() => onNavigateSubScreen?.('transfers_flow')}
            />
          )}
          <OverviewActionCard
            title="Review Adjustments"
            icon={<FilterSlidersIcon size={20} color={adminColors.brandDeep} />}
            onPress={() => onNavigateSubScreen?.('adjustments_flow')}
          />
          {can ? (
            can('allocation.channel_percentage.set') ? (
              <OverviewActionCard
                title="Configure Allocation"
                icon={<PieChartIcon size={20} color={adminColors.brandDeep} />}
                onPress={() => onNavigateSubScreen?.('allocation')}
              />
            ) : null
          ) : (
            <OverviewActionCard
              title="Configure Allocation"
              icon={<PieChartIcon size={20} color={adminColors.brandDeep} />}
              onPress={() => onNavigateSubScreen?.('allocation')}
            />
          )}
        </OverviewCardsGrid>

        {/* Warehouses Section */}
        <OverviewSectionHeader title="Warehouses" />
        <View style={styles.warehousesList}>
          {WAREHOUSE_LIST.map((wh) => (
            <View key={wh.id} style={styles.whCard}>
              <View style={styles.whCardLeft}>
                <Text style={styles.whName}>{wh.name}</Text>
                <Text style={styles.whMeta}>{wh.capacityMeta}</Text>
              </View>
              <AdminStatusBadge label={wh.status} tone={wh.tone} />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
  },
  kpiGrid: {
    marginBottom: adminSpacing.md,
  },
  quickGrid: {
    marginBottom: adminSpacing.md,
  },
  warehousesList: {
    gap: adminSpacing.sm,
  },
  whCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
  },
  whCardLeft: {
    flex: 1,
    gap: 2,
  },
  whName: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    fontWeight: '700',
  },
  whMeta: {
    ...adminType.caption,
    color: adminColors.muted,
  },
});

