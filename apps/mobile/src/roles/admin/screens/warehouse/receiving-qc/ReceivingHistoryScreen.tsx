/**
 * Receiving History list (FINAL_LIST #90), shared by the Main and Sub
 * warehouse admins.
 *
 * Extracted from the Sub shell's inline Receiving "receiving_history"
 * sub-view (search, result pills, received / accepted / rejected figures, date)
 * and absorbs the Main ReceivingHistoryScreen. Live since integration phase 4:
 * GET /admin/goods-receipts, paged, each pill a server-side status filter
 * (ReceivingFlow fetches). The search narrows what is loaded. A row opens
 * ReceivingHistoryDetailScreen. The Main warehouse is picked in Search &
 * Filters (onOpenFilters, real GET /warehouses uuids), sent to the server as
 * `warehouseId` and named in the header pill.
 *
 * Read-only. Gate: inventory.batch.view or inventory.goods_receipt.record; a
 * Sub scope sees only its own warehouse (BR-30).
 */
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { t } from '../../../i18n';
import { formatKg } from '../../../money/quantity';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import {
  ChipGroup,
  HeaderIconButton,
  ScopeHeader,
  SearchBar,
  SlidersIcon,
  StatusBadge,
  WalletButton,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { HISTORY_FILTERS, historyFilterLabel, isMainScope } from './mappers';
import { PermissionNote, canViewReceiving, receiptTone } from './ReceivingParts';
import type { HistoryFilter, ReceivingLiveStateProps, ReceivingRecord, WarehouseScreenBaseProps } from './types';

export interface ReceivingHistoryScreenProps extends WarehouseScreenBaseProps, ReceivingLiveStateProps {
  /** Receipts for the selected pill, page by page. */
  records?: readonly ReceivingRecord[] | undefined;
  onLoadMore?: (() => void) | undefined;
  hasMore?: boolean | undefined;
  /** The selected pill; the flow fetches for it. */
  filter: HistoryFilter;
  onChangeFilter: (filter: HistoryFilter) => void;
  /** Main: the warehouse Search & Filters picked, for the header pill (undefined = all). */
  scopeLabel?: string | undefined;
  /** Opens Search & Filters; not offered when undefined. */
  onOpenFilters?: (() => void) | undefined;
  /** Opens a receipt by its uuid. */
  onSelectRecord: (receiptId: string) => void;
}

function kg(value: number | null): string {
  return value === null ? t('inventory.noValue') : formatKg(value);
}

export function ReceivingHistoryScreen({
  scope,
  can,
  onBack,
  records = [],
  isLoading = false,
  error,
  onRetry,
  onRefresh,
  isRefreshing = false,
  onLoadMore,
  hasMore = false,
  filter,
  onChangeFilter,
  scopeLabel,
  onOpenFilters,
  onSelectRecord,
}: ReceivingHistoryScreenProps) {
  const [query, setQuery] = useState('');
  const mainView = isMainScope(scope);

  const header = {
    title: t('receiving.history.title'),
    onBack,
    headerRight: onOpenFilters ? (
      <HeaderIconButton onPress={onOpenFilters} accessibilityLabel={t('receiving.filters.open')}>
        <SlidersIcon />
      </HeaderIconButton>
    ) : undefined,
    headerExtra: <ScopeHeader scope={scope} label={mainView ? scopeLabel : scope.warehouseName ?? scope.warehouseId} />,
  };

  if (!canViewReceiving(can)) {
    return (
      <WalletScreen {...header}>
        <View style={walletLayout.scrollContent}>
          <PermissionNote message="You do not have permission to view goods receipts." />
        </View>
      </WalletScreen>
    );
  }

  const view = queryViewState({ isLoading, error, itemCount: records.length });
  const q = query.trim().toLowerCase();
  const rows = records.filter(
    (r) =>
      q === '' ||
      r.receiptId.toLowerCase().includes(q) ||
      r.shipmentId.toLowerCase().includes(q) ||
      r.product.toLowerCase().includes(q),
  );

  const renderRecord = ({ item: r }: { item: ReceivingRecord }) => (
    <TouchableOpacity style={styles.card} onPress={() => onSelectRecord(r.id)} activeOpacity={0.8} accessibilityRole="button">
      <View style={styles.rowBetween}>
        <Text style={styles.code}>{r.receiptId}</Text>
        <StatusBadge label={r.resultLabel} tone={receiptTone(r.result)} />
      </View>
      <Text style={styles.produce}>
        {r.product}
        {r.grade !== '' ? ` · ${r.grade}` : ''}
      </Text>
      <View style={styles.stats}>
        {(
          [
            ['Received', r.receivedGrams],
            ['Accepted', r.acceptedGrams],
            ['Rejected', r.rejectedGrams],
          ] as const
        ).map(([label, grams]) => (
          <View key={label} style={styles.statCol}>
            <Text style={styles.meta}>{label}</Text>
            <Text style={styles.statValue}>{kg(grams)}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.meta}>
        {r.shipmentId !== '' ? `${r.shipmentId} · ` : ''}
        {r.date}
      </Text>
    </TouchableOpacity>
  );

  return (
    <WalletScreen {...header}>
      <View style={styles.flex}>
        <View style={styles.controls}>
          <SearchBar value={query} onChangeText={setQuery} placeholder="Search GR number / product" />
          <View style={styles.pills}>
            <ChipGroup options={HISTORY_FILTERS} value={filter} onChange={onChangeFilter} labelOf={historyFilterLabel} />
          </View>
        </View>

        {view === 'loading' ? (
          <AdminLoadingState />
        ) : view === 'error' ? (
          <AdminErrorState error={error} onRetry={onRetry} />
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(r) => r.id}
            renderItem={renderRecord}
            contentContainerStyle={walletLayout.scrollContent}
            showsVerticalScrollIndicator={false}
            onEndReached={hasMore ? onLoadMore : undefined}
            onEndReachedThreshold={0.5}
            refreshControl={
              onRefresh ? (
                <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[adminColors.brand]} tintColor={adminColors.brand} />
              ) : undefined
            }
            ListEmptyComponent={<AdminEmptyState title={t('receiving.empty.receipts')} />}
            ListFooterComponent={
              <>
                {hasMore ? <ActivityIndicator color={adminColors.brand} /> : null}
                <View style={styles.spacer} />
                <WalletButton label="Return to Receiving Dashboard →" variant="outline" onPress={onBack} />
              </>
            }
          />
        )}
      </View>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  controls: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.sm },
  pills: { paddingVertical: adminSpacing.sm },
  spacer: { height: adminSpacing.sm },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  code: { ...adminType.rowTitle, color: adminColors.ink },
  produce: { ...adminType.sectionHead, color: adminColors.ink, marginTop: adminSpacing.xs },
  meta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },
  stats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    marginVertical: adminSpacing.sm,
    paddingTop: adminSpacing.sm,
  },
  statCol: { flex: 1 },
  statValue: { ...adminType.rowTitle, color: adminColors.ink, marginTop: 2 },
});
