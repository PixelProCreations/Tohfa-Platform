/**
 * Adjustment History (design M3S14): the scope's stock adjustments, newest
 * first, filtered by status and paged by number
 * (GET /admin/stock-adjustments, BR-37). A Sub admin's request is confined
 * to its own warehouse by the server (BR-30); the flow also sends it.
 *
 * Rows open the adjustment (M3S17). "New adjustment" opens the request form
 * (M3S13). Gate: inventory.stock_adjustment.create, which the server reuses
 * for reads (the flow refuses the route without it).
 */
import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { t } from '../../../i18n';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import {
  ChipGroup,
  EmptyState,
  ScopeHeader,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { ADJUSTMENT_FILTERS, adjustmentFilterLabel, STOCK_CODES, type AdjustmentFilter } from './adjustmentMappers';
import { StockListRow } from './StockParts';
import type { InventoryScreenBaseProps } from './types';
import { useAdjustmentList } from './useStockAdjustmentData';

export interface AdjustmentHistoryScreenProps extends InventoryScreenBaseProps {
  /** The warehouse every request sends (InventoryFlow, BR-30). */
  warehouseId: string | undefined;
  /** The status the list opens on (the approval queue opens on PENDING). */
  initialFilter?: AdjustmentFilter | undefined;
}

export function AdjustmentHistoryScreen({
  scope,
  can,
  onNavigate,
  onBack,
  warehouseId,
  initialFilter = 'ALL',
  warehouseOptions,
  selectedWarehouseId,
  onSelectWarehouse,
}: AdjustmentHistoryScreenProps) {
  const [filter, setFilter] = useState<AdjustmentFilter>(initialFilter);
  const list = useAdjustmentList(warehouseId, filter === 'ALL' ? undefined : filter);
  const state = queryViewState({ isLoading: list.isLoading, error: list.error, itemCount: list.items.length });
  const canCreate = can(STOCK_CODES.adjustmentCreate);

  return (
    <WalletScreen
      title={t('stockAdj.history.title')}
      onBack={onBack}
      headerExtra={
        <ScopeHeader
          scope={scope}
          warehouseOptions={warehouseOptions}
          selectedWarehouseId={selectedWarehouseId}
          onSelectWarehouse={onSelectWarehouse}
        />
      }
      footer={
        canCreate ? (
          <WalletFooter>
            <WalletButton label={t('stockAdj.history.new')} onPress={() => onNavigate?.('M3S13')} />
          </WalletFooter>
        ) : undefined
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <ChipGroup options={ADJUSTMENT_FILTERS} value={filter} onChange={setFilter} labelOf={adjustmentFilterLabel} />
        {state === 'loading' ? <AdminLoadingState /> : null}
        {state === 'error' ? <AdminErrorState error={list.error} onRetry={list.refresh} /> : null}
        {state === 'empty' ? <EmptyState title={t('stockAdj.history.empty')} /> : null}
        {list.items.map((item) => (
          <StockListRow
            key={item.id}
            title={t('stockShared.pair', { first: item.batchCode, second: item.deltaText })}
            meta={t('stockShared.pair', { first: item.typeLabel, second: item.createdAt })}
            detail={item.productLabel}
            badge={{ label: item.statusLabel, tone: item.statusTone }}
            onPress={() => onNavigate?.('M3S17', { adjustmentId: item.id })}
          />
        ))}
        {list.hasMore ? <WalletButton label={t('stockShared.loadMore')} variant="outline" onPress={list.loadMore} /> : null}
      </ScrollView>
    </WalletScreen>
  );
}
