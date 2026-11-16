/**
 * Finance & Business Overview Screen (SA-M2-S10), ported from the Super Admin
 * design (origin/Superadmin-main screens/dashboard/FinanceBusinessOverviewScreen.tsx).
 * Shared by the Super Admin and TOHFA Admin shells; every query is gated by its
 * own route's code, so a role without the code gets the dash, not a 403.
 *
 * Real figures (the others are the dash until an endpoint exists):
 *   Sales revenue    GET /admin/finance/reports/revenue   finance.sales_income.view   last 30 IST days
 *   Expenses         GET /admin/finance/reports/expenses  finance.expense.log         last 30 IST days
 *   Outstanding dues GET /admin/payout-dues (totals)      payout.dues.view
 * Purchase value, pending payouts and awaiting-SA-approval have no source, and
 * the API has no payout read, so the payout card is drawn with dashes unless
 * the host passes `awaitingPayout`. The Approve and Reject buttons are always
 * drawn; they act only through the host's callbacks (the approval is a
 * money-moving write that needs the host's Idempotency-Key).
 */
import React, { useMemo } from 'react';
import { Alert, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT } from '../../theme';
import {
  BackArrowIcon,
  BuildingWarehouseIcon,
  CashBillIcon,
  ClipboardListIcon,
  PieChartIcon,
  RupeeTagIcon,
  ShoppingCartIcon,
} from '../../components/AdminIcons';
import { OverviewCardsGrid, OverviewDashboardCard, OverviewSectionHeader } from '../../components/OverviewDashboardCard';
import { OverviewActionCard } from '../../components/OverviewSuperAdminCards';
import { AdminStatusBadge } from '../../components/AdminStatusBadge';
import { useAdminQuery } from '../../api/hooks';
import { adminKeys } from '../../api/queryKeys';
import { listPayoutDues } from '../../api/payoutDues';
import type { Can } from '../../permissions/can';
import { t } from '../../i18n';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { istToday } from '../warehouse/finance-expenses/mappers';
import { useFinanceReports } from '../warehouse/finance-expenses/useFinanceData';
import { financeHubRange } from '../finance-hub/financeHubLogic';
import { moneyText, paiseText } from './saOverviewFormat';

/** A payout waiting on the Super Admin's second approval, as the host knows it. */
export interface AwaitingPayout {
  id: string;
  /** Human payout number, e.g. what the card shows as the title. */
  number: string | null;
  farmerName: string | null;
  /** API Money string. */
  amount: string | null;
}

export interface FinanceBusinessOverviewScreenProps {
  /** Permission check from /auth/me. Missing denies every read and the payout actions (fail closed). */
  can?: Can | undefined;
  onBack: () => void;
  onSelectPayout?: ((payoutId: string) => void) | undefined;
  onNavigateSubScreen?: ((subscreen: string) => void) | undefined;
  /** The payout the card is about. The API has no payout read yet, so the card shows dashes without it. */
  awaitingPayout?: AwaitingPayout | undefined;
  /** Money-moving: the host owns the approve call and its Idempotency-Key. */
  onApprovePayout?: ((payoutId: string) => void) | undefined;
  onRejectPayout?: ((payoutId: string) => void) | undefined;
}

/** docs/rbac.json codes (also the API routes' own codes). */
const CODES = {
  revenue: 'finance.sales_income.view',
  expenses: 'finance.expense.log',
  dues: 'payout.dues.view',
  approvePayout: 'payout.approve_above_10k',
} as const;

const MODULE = 'saFinance';
const BACK_SIZE = adminSpacing.xxl + adminSpacing.xs;
const BACK_ICON_SIZE = adminSpacing.lg + adminSpacing.xs + adminSpacing.xs;
const QUICK_ICON_SIZE = adminSpacing.lg + adminSpacing.xs;
const PAYOUT_BORDER = 1.5;

export function FinanceBusinessOverviewScreen({
  can,
  onBack,
  onSelectPayout,
  onNavigateSubScreen,
  awaitingPayout,
  onApprovePayout,
  onRejectPayout,
}: FinanceBusinessOverviewScreenProps) {
  const has = (code: string): boolean => typeof can === 'function' && can(code);
  const range = useMemo(() => financeHubRange(istToday()), []);
  const reports = useFinanceReports(undefined, range, { revenue: has(CODES.revenue), expenses: has(CODES.expenses) });
  const dues = useAdminQuery(
    adminKeys.scoped(MODULE, undefined, { resource: 'dues' }),
    (signal) => listPayoutDues({ limit: 1 }, signal),
    { enabled: has(CODES.dues) },
  );

  const sales = reports.revenue.report ? paiseText(reports.revenue.report.totalPaise) : ADMIN_NO_VALUE;
  const expenses = reports.expenses.report ? paiseText(reports.expenses.report.totalPaise) : ADMIN_NO_VALUE;
  const outstanding = dues.data ? moneyText(dues.data.totals.totalDue) : ADMIN_NO_VALUE;

  const nav = (id: string): (() => void) | undefined => (onNavigateSubScreen ? () => onNavigateSubScreen(id) : undefined);

  const payoutId = awaitingPayout?.id;
  const canDecide = has(CODES.approvePayout) && payoutId !== undefined;
  const payoutTitle = t('saFinance.payout.title', {
    number: awaitingPayout?.number ?? ADMIN_NO_VALUE,
    farmer: awaitingPayout?.farmerName ?? ADMIN_NO_VALUE,
  });
  const amount = moneyText(awaitingPayout?.amount);

  const handleApprove = () => {
    if (!canDecide || payoutId === undefined || onApprovePayout === undefined) return;
    Alert.alert(t('saFinance.approve.title'), t('saFinance.approve.body', { title: payoutTitle, amount }), [
      { text: t('saFinance.cancel'), style: 'cancel' },
      { text: t('saFinance.approve.confirm'), onPress: () => onApprovePayout(payoutId) },
    ]);
  };

  const handleReject = () => {
    if (!canDecide || payoutId === undefined || onRejectPayout === undefined) return;
    Alert.alert(t('saFinance.reject.title'), t('saFinance.reject.body', { title: payoutTitle }), [
      { text: t('saFinance.cancel'), style: 'cancel' },
      { text: t('saFinance.reject.confirm'), style: 'destructive', onPress: () => onRejectPayout(payoutId) },
    ]);
  };

  const approveEnabled = canDecide && onApprovePayout !== undefined;
  const rejectEnabled = canDecide && onRejectPayout !== undefined;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          testID="saFinance.back"
          onPress={onBack}
          style={styles.backButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('saFinance.back')}
        >
          <BackArrowIcon size={BACK_ICON_SIZE} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('saFinance.title')}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 6 KPI Cards Grid */}
        <OverviewCardsGrid style={styles.kpiGrid}>
          <OverviewDashboardCard
            title={t('saFinance.kpi.purchaseValue')}
            value={ADMIN_NO_VALUE}
            titlePosition="top"
            onPress={nav('purchase_dues')}
          />
          <OverviewDashboardCard
            title={t('saFinance.kpi.salesRevenue')}
            value={sales}
            subtitle={t('saFinance.period')}
            titlePosition="top"
            onPress={nav('sales_flow')}
          />
          <OverviewDashboardCard
            title={t('saFinance.kpi.pendingPayouts')}
            value={ADMIN_NO_VALUE}
            titlePosition="top"
            onPress={nav('payout_processing')}
          />
          <OverviewDashboardCard
            title={t('saFinance.kpi.awaitingApproval')}
            value={ADMIN_NO_VALUE}
            titlePosition="top"
            tone="danger"
            onPress={payoutId !== undefined && onSelectPayout ? () => onSelectPayout(payoutId) : undefined}
          />
          <OverviewDashboardCard
            title={t('saFinance.kpi.outstandingDues')}
            value={outstanding}
            titlePosition="top"
            onPress={nav('purchase_dues')}
          />
          <OverviewDashboardCard
            title={t('saFinance.kpi.expenses')}
            value={expenses}
            subtitle={t('saFinance.period')}
            titlePosition="top"
            onPress={nav('finance_flow')}
          />
        </OverviewCardsGrid>

        {/* Quick Access */}
        <OverviewSectionHeader title={t('saFinance.quick.heading')} actionLabel="" />
        <OverviewCardsGrid style={styles.quickGrid}>
          <OverviewActionCard
            title={t('saFinance.quick.payouts')}
            icon={<CashBillIcon size={QUICK_ICON_SIZE} color={adminColors.brandDeep} />}
            onPress={nav('payout_processing')}
          />
          <OverviewActionCard
            title={t('saFinance.quick.purchases')}
            icon={<ClipboardListIcon size={QUICK_ICON_SIZE} color={adminColors.brandDeep} />}
            onPress={nav('purchase_dues')}
          />
          <OverviewActionCard
            title={t('saFinance.quick.sales')}
            icon={<ShoppingCartIcon size={QUICK_ICON_SIZE} color={adminColors.brandDeep} />}
            onPress={nav('sales_flow')}
          />
          <OverviewActionCard
            title={t('saFinance.quick.finance')}
            icon={<BuildingWarehouseIcon size={QUICK_ICON_SIZE} color={adminColors.brandDeep} />}
            onPress={nav('finance_flow')}
          />
          <OverviewActionCard
            title={t('saFinance.quick.wallet')}
            icon={<RupeeTagIcon size={QUICK_ICON_SIZE} color={adminColors.brandDeep} />}
            onPress={nav('wallet_flow')}
          />
          <OverviewActionCard
            title={t('saFinance.quick.reports')}
            icon={<PieChartIcon size={QUICK_ICON_SIZE} color={adminColors.brandDeep} />}
            onPress={nav('reports_main')}
          />
        </OverviewCardsGrid>

        {/* Payout Card (Awaiting SA approval) */}
        <TouchableOpacity
          testID="saFinance.payoutCard"
          style={styles.payoutCard}
          onPress={payoutId !== undefined && onSelectPayout ? () => onSelectPayout(payoutId) : undefined}
          disabled={payoutId === undefined || onSelectPayout === undefined}
          activeOpacity={0.8}
        >
          <View style={styles.payoutHeaderRow}>
            <Text style={styles.payoutTitle}>{payoutTitle}</Text>
            <AdminStatusBadge label={t('saFinance.payout.badge')} tone="info" />
          </View>
          <Text style={styles.payoutSubtitle}>{t('saFinance.payout.subtitle', { amount })}</Text>

          <View style={styles.payoutButtonsRow}>
            <TouchableOpacity
              testID="saFinance.approve"
              style={[styles.approveBtn, !approveEnabled && styles.btnDisabled]}
              onPress={handleApprove}
              disabled={!approveEnabled}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ disabled: !approveEnabled }}
            >
              <Text style={styles.approveBtnText}>{t('saFinance.approve.confirm')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="saFinance.reject"
              style={[styles.rejectBtn, !rejectEnabled && styles.btnDisabled]}
              onPress={handleReject}
              disabled={!rejectEnabled}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ disabled: !rejectEnabled }}
            >
              <Text style={styles.rejectBtnText}>{t('saFinance.reject.confirm')}</Text>
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
    width: BACK_SIZE,
    height: BACK_SIZE,
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
    borderWidth: PAYOUT_BORDER,
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
    flex: 1,
    paddingRight: adminSpacing.xs,
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
    height: ADMIN_BUTTON_HEIGHT,
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
    height: ADMIN_BUTTON_HEIGHT,
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
  btnDisabled: {
    opacity: 0.5,
  },
});
