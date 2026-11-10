/**
 * Finance & Business Overview Screen (SA-M2-S10)
 * Exact implementation of Image 1 Right.
 * Reused across Super Admin and TOHFA Admin shells.
 */
import React from 'react';
import {
  Alert,
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
  CashBillIcon,
  ClipboardListIcon,
  PieChartIcon,
  RupeeTagIcon,
  ShoppingCartIcon,
} from '../../components/AdminIcons';
import {
  OverviewActionCard,
  OverviewCardsGrid,
  OverviewDashboardCard,
  OverviewSectionHeader,
} from '../../components/OverviewDashboardCard';
import { AdminStatusBadge } from '../../components';
import { t } from '../../i18n';

export interface FinanceBusinessOverviewScreenProps {
  can?: (code: string) => boolean;
  onBack: () => void;
  onSelectPayout?: (payoutId: string) => void;
  onNavigateSubScreen?: (subscreen: string) => void;
}

export function FinanceBusinessOverviewScreen({
  can,
  onBack,
  onSelectPayout,
  onNavigateSubScreen,
}: FinanceBusinessOverviewScreenProps) {
  const canApproveHighPayout = can ? can('payout.approve_above_10k') : true;

  const handleQuickApprove = () => {
    if (!canApproveHighPayout) {
      Alert.alert('Permission Denied', 'Payouts above Rs 10,000 require Super Admin dual approval.');
      return;
    }
    Alert.alert(
      'Approve Payout',
      'Approve payout PY-0002 for Kumar (₹18,000.00)?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => Alert.alert('Success', 'Payout PY-0002 approved.'),
        },
      ]
    );
  };

  const handleQuickReject = () => {
    Alert.alert(
      'Reject Payout',
      'Reject payout PY-0002 for Kumar?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => Alert.alert('Rejected', 'Payout PY-0002 rejected.'),
        },
      ]
    );
  };

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
        <Text style={styles.headerTitle}>Finance & Business</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 6 KPI Cards Grid */}
        <OverviewCardsGrid style={styles.kpiGrid}>
          <OverviewDashboardCard
            title="PURCHASE VALUE"
            value="₹1,38,900.00"
            titlePosition="top"
            onPress={() => onNavigateSubScreen?.('purchase_dues')}
          />
          <OverviewDashboardCard
            title="SALES REVENUE"
            value="₹2,14,600.00"
            titlePosition="top"
            onPress={() => onNavigateSubScreen?.('sales_flow')}
          />
          <OverviewDashboardCard
            title="PENDING PAYOUTS"
            value="6"
            titlePosition="top"
            onPress={() => onNavigateSubScreen?.('payout_processing')}
          />
          <OverviewDashboardCard
            title="AWAITING SA APPROVAL"
            value="2"
            titlePosition="top"
            tone="danger"
            onPress={() => onSelectPayout?.('PAY-0002')}
          />
          <OverviewDashboardCard
            title="OUTSTANDING DUES"
            value="₹32,450.00"
            titlePosition="top"
            onPress={() => onNavigateSubScreen?.('purchase_dues')}
          />
          <OverviewDashboardCard
            title="EXPENSES"
            value="₹18,200.00"
            titlePosition="top"
            onPress={() => onNavigateSubScreen?.('finance_flow')}
          />
        </OverviewCardsGrid>

        {/* Quick Access */}
        <OverviewSectionHeader title="Quick Access" />
        <OverviewCardsGrid style={styles.quickGrid}>
          <OverviewActionCard
            title="Review Payouts"
            icon={<CashBillIcon size={20} color={adminColors.brandDeep} />}
            onPress={() => onNavigateSubScreen?.('payout_processing')}
          />
          <OverviewActionCard
            title="View Purchases"
            icon={<ClipboardListIcon size={20} color={adminColors.brandDeep} />}
            onPress={() => onNavigateSubScreen?.('purchase_dues')}
          />
          <OverviewActionCard
            title="View Sales"
            icon={<ShoppingCartIcon size={20} color={adminColors.brandDeep} />}
            onPress={() => onNavigateSubScreen?.('sales_flow')}
          />
          <OverviewActionCard
            title="View Finance"
            icon={<BuildingWarehouseIcon size={20} color={adminColors.brandDeep} />}
            onPress={() => onNavigateSubScreen?.('finance_flow')}
          />
          <OverviewActionCard
            title="View Wallet Activity"
            icon={<RupeeTagIcon size={20} color={adminColors.brandDeep} />}
            onPress={() => onNavigateSubScreen?.('wallet_flow')}
          />
          <OverviewActionCard
            title="View Reports"
            icon={<PieChartIcon size={20} color={adminColors.brandDeep} />}
            onPress={() => onNavigateSubScreen?.('reports_main')}
          />
        </OverviewCardsGrid>

        {/* Payout Card (Awaiting SA approval) */}
        <TouchableOpacity
          style={styles.payoutCard}
          onPress={() => onSelectPayout?.('PAY-0002')}
          activeOpacity={0.8}
        >
          <View style={styles.payoutHeaderRow}>
            <Text style={styles.payoutTitle}>PY-0002 · Kumar</Text>
            <AdminStatusBadge label="Awaiting SA approval" tone="info" />
          </View>
          <Text style={styles.payoutSubtitle}>₹18,000.00 · above ₹10,000, needs SA review</Text>

          <View style={styles.payoutButtonsRow}>
            <TouchableOpacity
              style={styles.approveBtn}
              onPress={handleQuickApprove}
              activeOpacity={0.8}
            >
              <Text style={styles.approveBtnText}>Approve</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={handleQuickReject}
              activeOpacity={0.7}
            >
              <Text style={styles.rejectBtnText}>Reject</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
  payoutCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1.5,
    borderColor: adminColors.danger.border,
    padding: adminSpacing.md,
    gap: adminSpacing.xs,
  },
  payoutHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payoutTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    fontWeight: '700',
  },
  payoutSubtitle: {
    ...adminType.body,
    color: adminColors.muted,
  },
  payoutButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
    marginTop: adminSpacing.sm,
  },
  approveBtn: {
    flex: 1,
    height: 42,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtnText: {
    ...adminType.body,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  rejectBtn: {
    flex: 1,
    height: 42,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtnText: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '600',
  },
});

