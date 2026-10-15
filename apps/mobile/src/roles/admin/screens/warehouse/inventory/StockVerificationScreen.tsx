/**
 * Stock Verification (design M3S10): the stock count hub. Lists the scope's
 * recent physical counts (GET /admin/stock-verifications, BR-106) and opens
 * a new count, the variance review and the adjustment history.
 *
 * Gate: the flow opens this route only with inventory.stock_verification.perform
 * (availability.ts 'stockCounts'). The history link needs
 * inventory.stock_adjustment.create, which the server also uses for reads.
 * A `batchId` route param (from Batch Detail) is handed to the count screen.
 */
import React from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';
import { t } from '../../../i18n';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import {
  EmptyState,
  InfoNote,
  ScopeHeader,
  SectionTitle,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { STOCK_CODES } from './adjustmentMappers';
import { StockListRow, stockStyles } from './StockParts';
import type { InventoryScreenBaseProps } from './types';
import { useVerificationList } from './useStockAdjustmentData';

export interface StockVerificationScreenProps extends InventoryScreenBaseProps {
  /** The warehouse every request sends (InventoryFlow, BR-30). */
  warehouseId: string | undefined;
}

export function StockVerificationScreen({
  scope,
  can,
  onNavigate,
  onBack,
  routeParams,
  warehouseId,
  warehouseOptions,
  selectedWarehouseId,
  onSelectWarehouse,
}: StockVerificationScreenProps) {
  const canCount = can(STOCK_CODES.verificationPerform);
  const canAdjust = can(STOCK_CODES.adjustmentCreate);
  const list = useVerificationList(warehouseId, undefined);
  const state = queryViewState({ isLoading: list.isLoading, error: list.error, itemCount: list.items.length });
  const batchId: unknown = routeParams?.['batchId'];

  return (
    <WalletScreen
      title={t('stockCount.hub.title')}
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
        canCount ? (
          <WalletFooter>
            <WalletButton
              label={t('stockCount.hub.start')}
              onPress={() => onNavigate?.('M3S11', typeof batchId === 'string' ? { batchId } : undefined)}
            />
          </WalletFooter>
        ) : undefined
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <InfoNote tone="info">{t('stockCount.hub.note')}</InfoNote>

        <TouchableOpacity style={stockStyles.linkRow} onPress={() => onNavigate?.('M3S12')} accessibilityRole="button">
          <Text style={stockStyles.linkText}>{t('stockCount.hub.varianceLink')}</Text>
          <Text style={stockStyles.link}>{t('stockShared.open')}</Text>
        </TouchableOpacity>
        {canAdjust ? (
          <TouchableOpacity style={stockStyles.linkRow} onPress={() => onNavigate?.('M3S14')} accessibilityRole="button">
            <Text style={stockStyles.linkText}>{t('stockCount.hub.historyLink')}</Text>
            <Text style={stockStyles.link}>{t('stockShared.open')}</Text>
          </TouchableOpacity>
        ) : null}

        <SectionTitle>{t('stockCount.hub.recent')}</SectionTitle>
        {state === 'loading' ? <AdminLoadingState /> : null}
        {state === 'error' ? <AdminErrorState error={list.error} onRetry={list.refresh} /> : null}
        {state === 'empty' ? <EmptyState title={t('stockCount.list.empty')} /> : null}
        {list.items.map((item) => (
          <StockListRow
            key={item.id}
            title={item.batchCode}
            meta={t('stockShared.pair', { first: item.productLabel, second: item.verifiedAt })}
            detail={t('stockCount.row.detail', { system: item.systemText, counted: item.countedText, variance: item.varianceText })}
            badge={{ label: item.statusLabel, tone: item.statusTone }}
            onPress={() => onNavigate?.('M3S12', { verificationId: item.id })}
          />
        ))}
        {list.hasMore ? <WalletButton label={t('stockShared.loadMore')} variant="outline" onPress={list.loadMore} /> : null}
      </ScrollView>
    </WalletScreen>
  );
}
