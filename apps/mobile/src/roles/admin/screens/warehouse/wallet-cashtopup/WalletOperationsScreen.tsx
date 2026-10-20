// Design id: M8-S01
/**
 * Wallet Operations: the wallet module's hub, shared by Main and Sub.
 *
 * Live. The only numbers are GET /admin/reports/cash-topups, month to date
 * (useCashTopupKpis; successful CASH top-ups, BR-64): today's count and total
 * (its byDay entry) and the month's. Gated by wallet.cash_topup.process, the
 * report's (interim) code. A Sub admin's report is its own warehouse
 * (scope.warehouseId, BR-64a); the Main admin sees all warehouses or picks one
 * from GET /warehouses (useWarehouseOptions, warehouse.all.view), uuids only.
 *
 * Entry points: Cash Top-Up and Customer Wallet (both wallet.cash_topup.process,
 * the lookup's code), and Daily Cash Summary only when the flow passes it
 * (finance.cash_close.manage). Hiding is presentation only; the server
 * re-checks every code (CLAUDE.md 2.1).
 *
 * Top-Up History and Needs Attention are entries to two sample screens (no
 * endpoint lists top-up rows or feeds wallet issues). By the owner decision of
 * 2026-10-14 nothing is hidden for having no server API, so both are always
 * offered; the hub shows no number from them. Removed with the fixture data they
 * drew: the recent top-ups list, the per-warehouse wallet summaries, the
 * per-category attention counts, and the Alert-only Export and Select Date
 * actions.
 */
import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { t } from '../../../i18n';
import { formatPaise } from '../../../money/paise';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { financeWarehouseFilter } from '../finance-expenses/mappers';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import type { AttentionCategory, WarehouseScreenBaseProps } from './types';
import { useCashTopupKpis, useWalletWarehouseScopes } from './useWalletData';
import {
  BellRingIcon,
  Card,
  CashIcon,
  HeaderIconButton,
  InfoIcon,
  InfoNote,
  KpiRow,
  ReceiptIcon,
  ScopeHeader,
  SearchIcon,
  SectionTitle,
  WalletScreen,
  WarehouseTabBar,
  walletLayout,
} from './WalletParts';

export interface WalletOperationsScreenProps extends WarehouseScreenBaseProps {
  onNavigateToNotifications?: (() => void) | undefined;
  onNavigateToProfile?: (() => void) | undefined;
  onNavigateToCashTopUp: () => void;
  onNavigateToCustomerSearch: () => void;
  /** Daily Cash Summary; undefined hides the entry (the flow passes it only with finance.cash_close.manage). */
  onNavigateToDailySummary?: (() => void) | undefined;
  /** Top-Up History (sample screen, no backend). */
  onNavigateToTopUpHistory: () => void;
  /** Wallet Needs Attention (sample screen, no backend), opened on a category. */
  onNavigateToAttention: (category: AttentionCategory) => void;
}

function ActionRow({ icon, title, hint, onPress }: { icon: React.ReactNode; title: string; hint: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.actionRow} onPress={onPress} activeOpacity={0.75} accessibilityRole="button" accessibilityLabel={title}>
      <View style={styles.actionIcon}>{icon}</View>
      <View style={styles.actionText}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionHint}>{hint}</Text>
      </View>
    </TouchableOpacity>
  );
}

export function WalletOperationsScreen({
  scope,
  can,
  onBack,
  onTabChange,
  onNavigateToNotifications,
  onNavigateToCashTopUp,
  onNavigateToCustomerSearch,
  onNavigateToDailySummary,
  onNavigateToTopUpHistory,
  onNavigateToAttention,
}: WalletOperationsScreenProps) {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);
  const canTopUp = can('wallet.cash_topup.process');
  const warehouseOptions = useWalletWarehouseScopes(scope, can);
  // BR-30 / BR-64a: Sub is pinned to its own warehouse; Main sends a picked uuid or nothing (all).
  const warehouseId = financeWarehouseFilter(scope, selectedWarehouseId);
  const report = useCashTopupKpis(warehouseId, canTopUp);
  const noValue = t('customers.noValue');
  const money = (paise: number | null) => (paise === null ? noValue : formatPaise(paise));

  return (
    <WalletScreen
      title={t('wallet.hub.title')}
      subtitle={t('wallet.hub.subtitle')}
      onBack={onBack}
      headerRight={
        onNavigateToNotifications === undefined ? undefined : (
          <HeaderIconButton onPress={onNavigateToNotifications} accessibilityLabel={t('wallet.hub.notifications')}>
            <BellRingIcon color={adminColors.onBrand} />
          </HeaderIconButton>
        )
      }
      headerExtra={
        <ScopeHeader
          scope={scope}
          label={scope.warehouseId === undefined && warehouseOptions.length === 0 ? t('wallet.hub.allWarehouses') : undefined}
          warehouseOptions={warehouseOptions}
          selectedWarehouseId={selectedWarehouseId}
          onSelectWarehouse={warehouseOptions.length === 0 ? undefined : setSelectedWarehouseId}
        />
      }
      footer={<WarehouseTabBar onTabChange={onTabChange} onBack={onBack} />}
    >
      <ScrollView
        contentContainerStyle={walletLayout.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          canTopUp ? (
            <RefreshControl refreshing={false} onRefresh={report.refresh} colors={[adminColors.brand]} tintColor={adminColors.brand} />
          ) : undefined
        }
      >
        {canTopUp ? (
          <>
            <SectionTitle>{t('wallet.hub.summary')}</SectionTitle>
            {report.isLoading ? (
              <AdminLoadingState />
            ) : report.error !== null && report.error !== undefined ? (
              <AdminErrorState error={report.error} onRetry={report.refresh} />
            ) : report.kpis === undefined ? null : (
              <>
                <KpiRow
                  items={[
                    { value: String(report.kpis.todayCount), label: t('wallet.hub.kpi.todayCount') },
                    { value: money(report.kpis.todayTotalPaise), label: t('wallet.hub.kpi.todayTotal'), tone: 'success' },
                  ]}
                />
                <KpiRow
                  items={[
                    { value: String(report.kpis.monthCount), label: t('wallet.hub.kpi.monthCount') },
                    { value: money(report.kpis.monthTotalPaise), label: t('wallet.hub.kpi.monthTotal'), tone: 'success' },
                  ]}
                />
                <InfoNote>{t('wallet.hub.kpiNote')}</InfoNote>
              </>
            )}
          </>
        ) : null}

        <SectionTitle>{t('wallet.hub.actions')}</SectionTitle>
        <Card>
          {canTopUp ? (
            <>
              <ActionRow
                icon={<CashIcon color={adminColors.brand} />}
                title={t('wallet.hub.action.cashTopUp')}
                hint={t('wallet.hub.action.cashTopUpHint')}
                onPress={onNavigateToCashTopUp}
              />
              <View style={styles.divider} />
              <ActionRow
                icon={<SearchIcon color={adminColors.brand} />}
                title={t('wallet.hub.action.customerWallet')}
                hint={t('wallet.hub.action.customerWalletHint')}
                onPress={onNavigateToCustomerSearch}
              />
              <View style={styles.divider} />
            </>
          ) : null}
          {onNavigateToDailySummary === undefined ? null : (
            <>
              <ActionRow
                icon={<CashIcon color={adminColors.brandDeep} />}
                title={t('wallet.hub.action.dailyCash')}
                hint={t('wallet.hub.action.dailyCashHint')}
                onPress={onNavigateToDailySummary}
              />
              <View style={styles.divider} />
            </>
          )}
          <ActionRow
            icon={<ReceiptIcon color={adminColors.brand} />}
            title={t('wallet.hub.action.topUpHistory')}
            hint={t('wallet.hub.action.topUpHistoryHint')}
            onPress={onNavigateToTopUpHistory}
          />
          <View style={styles.divider} />
          <ActionRow
            icon={<InfoIcon color={adminColors.warning.text} />}
            title={t('wallet.hub.action.attention')}
            hint={t('wallet.hub.action.attentionHint')}
            onPress={() => onNavigateToAttention('all')}
          />
        </Card>
      </ScrollView>
    </WalletScreen>
  );
}

const ACTION_ICON = 40;

const styles = StyleSheet.create({
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.md, paddingVertical: adminSpacing.sm },
  actionIcon: {
    width: ACTION_ICON,
    height: ACTION_ICON,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { flex: 1 },
  actionTitle: { ...adminType.rowTitle, color: adminColors.ink },
  actionHint: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs },
  divider: { height: 1, backgroundColor: adminColors.border, marginVertical: adminSpacing.xs },
});
