/**
 * Transfer Receiving: the live transfers in transit to the scope's warehouse
 * (Sub: its own, as destination; Main: every warehouse) and the counts.
 *
 * Gate: `transfer.inter_warehouse.view` for the list. Opening the receiving
 * inspection (the card tap) needs `transfer.inter_warehouse.receive` (all) on
 * an IN_TRANSIT transfer whose destination the scope covers. There is no
 * separate "arrived" state on the server: a transfer is IN_TRANSIT until it is
 * received.
 *
 * Tiles (design M2-16), on the shared OverviewDashboardCard: In Transit and
 * Completed are the list's `total` for IN_TRANSIT and RECEIVED; Qty Mismatch
 * counts the RECEIVED transfers flagged `hasDiscrepancy` (receiptViews.ts).
 * The design's Arrived, Receiving Pending and Quality Issue tiles are not
 * drawn: the API has no arrival step (owner decision), "receiving pending" is
 * the same IN_TRANSIT figure, and a transfer receipt records no quality check.
 */
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { OverviewCardsGrid, OverviewDashboardCard } from '../../../components';
import { t } from '../../../i18n';
import { adminSpacing } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import {
  PermissionNote,
  ScopeHeader,
  SectionTitle,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { TRANSFER_CODES, transferActions } from './mappers';
import { discrepancyTileValue } from './receiptViews';
import { TransferRow } from './TransferParts';
import { useTransferDiscrepancyTally, useTransferList, useTransferStatusCounts, useTransferWarehouses } from './useTransfersData';
import type { WarehouseScreenBaseProps } from './types';

export interface TransferReceivingScreenProps extends WarehouseScreenBaseProps {
  onStartTransferInspection?: ((transferId: string) => void) | undefined;
}

export function TransferReceivingScreen({ scope, can, onBack, onStartTransferInspection }: TransferReceivingScreenProps) {
  const canReceive = can(TRANSFER_CODES.receive);
  const { nameOf } = useTransferWarehouses(scope, can);
  const list = useTransferList(scope, 'IN_TRANSIT', nameOf);
  const counts = useTransferStatusCounts(scope);
  const mismatch = useTransferDiscrepancyTally(scope);
  const countOrUnknown = (n: number | undefined) => (n === undefined ? t('transfers.kpi.unknown') : String(n));
  const view = queryViewState({ isLoading: list.isLoading, error: list.error, itemCount: list.items.length });
  const start = canReceive ? onStartTransferInspection : undefined;

  return (
    <WalletScreen
      title={t('transfers.receiving.title')}
      subtitle={t('transfers.receiving.subtitle')}
      onBack={onBack}
      headerExtra={<ScopeHeader scope={scope} label={scope.warehouseId === undefined ? t('transfers.scope.all') : undefined} />}
      footer={
        !canReceive ? (
          <WalletFooter>
            <PermissionNote>{t('transfers.receiving.noPermission')}</PermissionNote>
          </WalletFooter>
        ) : undefined
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <OverviewCardsGrid style={styles.grid}>
          <OverviewDashboardCard
            value={countOrUnknown(counts.IN_TRANSIT)}
            title={t('transfers.receiving.tile.inTransit')}
            subtitle={t('transfers.receiving.tile.inTransitSub')}
            icon="truck"
          />
          <OverviewDashboardCard
            value={discrepancyTileValue(mismatch.tally, { loading: mismatch.isLoading, error: mismatch.error })}
            title={t('transfers.receiving.tile.qtyMismatch')}
            subtitle={t('transfers.receiving.tile.qtyMismatchSub')}
            icon="alert"
            tone="warning"
          />
          <OverviewDashboardCard
            value={countOrUnknown(counts.RECEIVED)}
            title={t('transfers.receiving.tile.completed')}
            subtitle={t('transfers.receiving.tile.completedSub')}
            icon="box"
            tone="success"
          />
        </OverviewCardsGrid>
        <SectionTitle>{t('transfers.receiving.section')}</SectionTitle>
        {view === 'loading' ? <AdminLoadingState /> : null}
        {view === 'error' ? <AdminErrorState error={list.error} onRetry={list.refresh} /> : null}
        {view === 'empty' ? (
          <AdminEmptyState title={t('transfers.receiving.empty.title')} subtitle={t('transfers.receiving.empty.subtitle')} />
        ) : null}
        {view === 'ready'
          ? list.items.map((item) => (
              <TransferRow
                key={item.id}
                transfer={item}
                onPress={start && transferActions(scope, can, item).receive ? () => start(item.id) : undefined}
              />
            ))
          : null}
        {view === 'ready' && list.hasMore ? (
          <WalletButton label={t('transfers.list.loadMore')} variant="outline" onPress={list.loadMore} />
        ) : null}
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  grid: { marginBottom: adminSpacing.md },
});
