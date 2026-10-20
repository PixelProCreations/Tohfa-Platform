// Design id: M11-S02
/**
 * Revenue list (BR-63): GET /admin/finance/revenue, cursor-paged, gated on
 * finance.sales_income.view. Revenue is the server's definition (completed,
 * paid orders); nothing is summed or derived here.
 *
 * No warehouse filter: the endpoint takes no warehouse. The server scopes it
 * to the caller (Sub = own warehouse, Main = all four), so a Main picker here
 * would be a control the API cannot apply. Filters are channel and payment
 * method, which it does take.
 */
import React, { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { RevenuePaymentMethod } from '../../../api/finance';
import { t } from '../../../i18n';
import { formatPaise } from '../../../money/paise';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { ChipGroup, ScopeHeader, WalletScreen } from '../wallet-cashtopup/WalletParts';
import { FINANCE_CODES, FinanceNotAvailable, scopeLabel } from './FinanceParts';
import { REVENUE_CHANNELS, revenueChannelLabel, revenuePaymentMethodLabel } from './mappers';
import type { RevenueRecord, WarehouseScreenBaseProps } from './types';
import { useRevenueList } from './useFinanceData';

export interface RevenueScreenProps extends WarehouseScreenBaseProps {
  onSelectRevenue: (orderId: string) => void;
}

const ALL = '';
const PAYMENT_METHODS: readonly RevenuePaymentMethod[] = ['WALLET', 'UPI', 'CARD', 'NETBANKING', 'CASH'];

export function RevenueScreen(props: RevenueScreenProps) {
  if (!props.can(FINANCE_CODES.salesIncome)) {
    return (
      <FinanceNotAvailable title={t('finance.revenue.title')} message={t('finance.notAvailable.message')} onBack={props.onBack} />
    );
  }
  return <RevenueBody {...props} />;
}

function RevenueBody({ scope, onBack, onSelectRevenue }: RevenueScreenProps) {
  const [channel, setChannel] = useState<string>(ALL);
  const [paymentMethod, setPaymentMethod] = useState<string>(ALL);
  const list = useRevenueList(scope.warehouseId, {
    channel: REVENUE_CHANNELS.find((c) => c === channel),
    paymentMethod: PAYMENT_METHODS.find((m) => m === paymentMethod),
  });
  const view = queryViewState({ isLoading: list.isLoading, error: list.error, itemCount: list.items.length });

  return (
    <WalletScreen title={t('finance.revenue.title')} onBack={onBack} headerExtra={<ScopeHeader scope={scope} label={scopeLabel(scope)} />}>
      <FlatList
        data={view === 'ready' ? list.items : []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.filters}>
            <Text style={styles.filterLabel}>{t('finance.revenue.filter.channel')}</Text>
            <ChipGroup<string>
              options={[ALL, ...REVENUE_CHANNELS]}
              value={channel}
              onChange={setChannel}
              labelOf={(c) => {
                const known = REVENUE_CHANNELS.find((x) => x === c);
                return known === undefined ? t('finance.revenue.filter.all') : revenueChannelLabel(known);
              }}
            />
            <Text style={styles.filterLabel}>{t('finance.revenue.filter.paymentMethod')}</Text>
            <ChipGroup<string>
              options={[ALL, ...PAYMENT_METHODS]}
              value={paymentMethod}
              onChange={setPaymentMethod}
              labelOf={(m) => {
                const known = PAYMENT_METHODS.find((x) => x === m);
                return known === undefined ? t('finance.revenue.filter.all') : revenuePaymentMethodLabel(known);
              }}
            />
          </View>
        }
        ListEmptyComponent={
          view === 'loading' ? (
            <AdminLoadingState />
          ) : view === 'error' ? (
            <AdminErrorState error={list.error} onRetry={list.refresh} />
          ) : (
            <AdminEmptyState title={t('finance.revenue.empty.title')} subtitle={t('finance.revenue.empty.subtitle')} />
          )
        }
        renderItem={({ item }) => <RevenueRow record={item} onPress={() => onSelectRevenue(item.id)} />}
        onEndReached={() => {
          if (list.hasMore) list.loadMore();
        }}
        onEndReachedThreshold={0.4}
        refreshControl={<RefreshControl refreshing={list.isRefreshing} onRefresh={list.refresh} tintColor={adminColors.brand} />}
      />
    </WalletScreen>
  );
}

function RevenueRow({ record, onPress }: { record: RevenueRecord; onPress: () => void }) {
  const amount = formatPaise(record.amountPaise);
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={t('finance.revenue.row.a11y', { channel: record.channelLabel, amount })}
    >
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{record.channelLabel}</Text>
        <Text style={styles.rowMeta}>
          {record.dateLabel} · {record.paymentMethodLabel}
        </Text>
      </View>
      <View style={styles.side}>
        <Text style={styles.amount}>{amount}</Text>
        <Text style={styles.rowMeta}>{t('finance.revenue.row.gst', { amount: formatPaise(record.gstPaise) })}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  list: { padding: adminSpacing.lg, gap: adminSpacing.sm, flexGrow: 1 },
  filters: { gap: adminSpacing.xs, marginBottom: adminSpacing.sm },
  filterLabel: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    gap: adminSpacing.md,
  },
  rowText: { flex: 1 },
  rowTitle: { ...adminType.rowTitle, color: adminColors.ink },
  rowMeta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs },
  side: { alignItems: 'flex-end' },
  amount: { ...adminType.rowTitle, color: adminColors.success.text },
});
