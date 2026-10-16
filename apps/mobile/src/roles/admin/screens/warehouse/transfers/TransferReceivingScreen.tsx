/**
 * Transfer Receiving: the live transfers in transit to the scope's warehouse
 * (Sub: its own, as destination; Main: every warehouse) and the counts.
 *
 * Gate: `transfer.inter_warehouse.view` for the list. Opening the receiving
 * inspection (the card tap) needs `transfer.inter_warehouse.receive` (all) on
 * an IN_TRANSIT transfer whose destination the scope covers. There is no
 * separate "arrived" state on the server: a transfer is IN_TRANSIT until it is
 * received.
 */
import React from 'react';
import { ScrollView } from 'react-native';

import { t } from '../../../i18n';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import {
  KpiRow,
  PermissionNote,
  ScopeHeader,
  SectionTitle,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { TRANSFER_CODES, transferActions } from './mappers';
import { TransferRow } from './TransferParts';
import { useTransferList, useTransferStatusCounts, useTransferWarehouses } from './useTransfersData';
import type { WarehouseScreenBaseProps } from './types';

export interface TransferReceivingScreenProps extends WarehouseScreenBaseProps {
  onStartTransferInspection?: ((transferId: string) => void) | undefined;
}

export function TransferReceivingScreen({ scope, can, onBack, onStartTransferInspection }: TransferReceivingScreenProps) {
  const canReceive = can(TRANSFER_CODES.receive);
  const { nameOf } = useTransferWarehouses(scope, can);
  const list = useTransferList(scope, 'IN_TRANSIT', nameOf);
  const counts = useTransferStatusCounts(scope);
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
        <KpiRow
          items={[
            { value: counts.IN_TRANSIT === undefined ? t('transfers.kpi.unknown') : String(counts.IN_TRANSIT), label: t('transfers.kpi.inTransit'), tone: 'info' },
            { value: counts.RECEIVED === undefined ? t('transfers.kpi.unknown') : String(counts.RECEIVED), label: t('transfers.kpi.received'), tone: 'success' },
          ]}
        />
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
