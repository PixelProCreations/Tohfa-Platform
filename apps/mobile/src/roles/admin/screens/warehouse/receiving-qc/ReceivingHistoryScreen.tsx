/**
 * Receiving History list (design M2-15, FINAL_LIST #90), shared by the Main
 * and Sub warehouse admins.
 *
 * Extracted from the Sub shell's inline Receiving "receiving_history" sub-view
 * and absorbs the Main ReceivingHistoryScreen (the warehouse in each row and
 * the all-warehouses selector, Main-only: scope.warehouseId undefined). A row
 * opens ReceivingHistoryDetailScreen with the receipt's uuid.
 *
 * Live data: GET goods receipts page by page (useReceiptHistory). The result
 * pill (or, on "All", the Search & Filters Receiving Result) is the server
 * `status`; the Search & Filters search and date are the server q / from / to
 * (BR-122). The search box on this screen narrows the rows already loaded (no
 * refetch per keystroke). A figure the API does not carry is hidden: a
 * receipt awaiting QC has no accepted / rejected weight yet.
 *
 * Read-only. Gate: inventory.batch.view or inventory.goods_receipt.record; a
 * Sub scope reads only its own warehouse (BR-30).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import {
  ChipGroup,
  EmptyState,
  ScopeHeader,
  SearchBar,
  StatusBadge,
  WalletButton,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { PermissionNote, canViewReceiving } from './ReceivingParts';
import type { LiveReceivingFilters } from './liveTypes';
import { EMPTY_LIVE_FILTERS, HISTORY_RESULT_STATUS, intakeFilterParams, isMainScope, receivingWarehouseFilter } from './mappers';
import { filterHistoryRows, historyRowStats, intakeListsFor, liveReceiptTone } from './receivingLists';
import { historyResultFilter } from './receivingNav';
import { useReceiptHistory, useReceivingNaming } from './useReceivingData';
import type { HistoryFilter, WarehouseScreenBaseProps } from './types';

const FILTERS: readonly HistoryFilter[] = ['All', 'Accepted', 'Partial', 'Rejected'];

/** Distance from the end of the list (px) at which the next page is fetched. */
const LOAD_MORE_EDGE = 240;
/** How often (ms) the list reports its scroll position, to fetch the next page near the end. */
const LOAD_MORE_THROTTLE_MS = 200;

export interface ReceivingHistoryScreenProps extends WarehouseScreenBaseProps {
  initialFilter?: HistoryFilter | undefined;
  /** Facets applied in Search & Filters. */
  filters?: LiveReceivingFilters | undefined;
  /** A receipt (its uuid). */
  onSelectRecord: (receiptId: string) => void;
  onOpenFilters?: (() => void) | undefined;
}

export function ReceivingHistoryScreen({
  scope,
  can,
  onBack,
  initialFilter = 'All',
  filters = EMPTY_LIVE_FILTERS,
  onSelectRecord,
  onOpenFilters,
}: ReceivingHistoryScreenProps) {
  const [filter, setFilter] = useState<HistoryFilter>(initialFilter);
  const [query, setQuery] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(filters.warehouseId);
  const mainView = isMainScope(scope);
  const canView = canViewReceiving(can);

  const naming = useReceivingNaming(scope, can);
  // BR-30: a Sub scope always reads its own warehouse whatever the selector says.
  const warehouseId = receivingWarehouseFilter(scope, selectedWarehouseId);
  const lists = intakeListsFor(filters.shipmentType);
  const params = useMemo(() => intakeFilterParams(filters, new Date()), [filters]);
  const status = HISTORY_RESULT_STATUS[historyResultFilter(filter, filters.result)];
  const history = useReceiptHistory(warehouseId, status, naming.naming, params, canView && lists.receipts);
  const rows = useMemo(() => filterHistoryRows(history.items, query), [history.items, query]);
  const morePending = lists.receipts && history.hasMore && (history.error === null || history.error === undefined);
  const view = queryViewState({ isLoading: history.isLoading || (rows.length === 0 && morePending), error: history.error, itemCount: rows.length });
  const loadMore = history.loadMore;
  useEffect(() => {
    // A search with no match on the loaded pages keeps reading until a match or the end.
    if (rows.length === 0 && morePending) loadMore();
    // loadMore is a new function every render; the inputs that matter are listed.
  }, [rows.length, morePending, history.items.length]);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    if (morePending && layoutMeasurement.height + contentOffset.y >= contentSize.height - LOAD_MORE_EDGE) loadMore();
  };

  const header = {
    title: 'Receiving History',
    onBack,
    headerExtra: (
      <ScopeHeader
        scope={scope}
        label={mainView ? undefined : scope.warehouseName ?? scope.warehouseId}
        warehouseOptions={naming.options}
        selectedWarehouseId={selectedWarehouseId}
        onSelectWarehouse={mainView ? setSelectedWarehouseId : undefined}
      />
    ),
  };

  if (!canView) {
    return (
      <WalletScreen {...header}>
        <View style={walletLayout.scrollContent}>
          <PermissionNote message="You do not have permission to view goods receipts." />
        </View>
      </WalletScreen>
    );
  }

  return (
    <WalletScreen {...header}>
      <ScrollView
        contentContainerStyle={walletLayout.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={LOAD_MORE_THROTTLE_MS}
      >
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search GR number / product"
          onFilterPress={onOpenFilters}
        />
        <View style={styles.pills}>
          <ChipGroup options={FILTERS} value={filter} onChange={setFilter} />
        </View>

        {view === 'loading' ? <AdminLoadingState /> : null}
        {view === 'error' ? <AdminErrorState error={history.error} onRetry={history.refresh} /> : null}
        {view === 'empty' ? <EmptyState title="No receipts" subtitle="Nothing matches this filter." /> : null}

        {rows.map((r) => {
          const stats = historyRowStats(r);
          return (
            <TouchableOpacity
              key={r.id}
              style={styles.card}
              onPress={() => onSelectRecord(r.id)}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <View style={styles.rowBetween}>
                <Text style={styles.code}>{r.receiptId}</Text>
                <StatusBadge label={r.resultLabel} tone={liveReceiptTone(r.result)} />
              </View>
              <Text style={styles.produce}>
                {r.grade !== '' ? `${r.product} · ${r.grade}` : r.product}
              </Text>
              {stats.length > 0 ? (
                <View style={styles.stats}>
                  {stats.map((stat) => (
                    <View key={stat.key} style={styles.statCol}>
                      <Text style={styles.meta}>{stat.label}</Text>
                      <Text style={styles.statValue}>{stat.value}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
              <Text style={styles.meta}>
                {mainView && r.warehouseName !== '' ? `${r.warehouseName} · ` : ''}
                {r.date}
              </Text>
            </TouchableOpacity>
          );
        })}

        <View style={styles.spacer} />
        <WalletButton label="Return to Receiving Dashboard →" variant="outline" onPress={onBack} />
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
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
