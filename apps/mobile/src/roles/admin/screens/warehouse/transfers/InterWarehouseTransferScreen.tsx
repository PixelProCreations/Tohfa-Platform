/**
 * Inter-Warehouse Transfer: the live transfer list (per-status counts, status
 * chips sent as the `status` filter, transfer cards, load more).
 *
 * Gate: `transfer.inter_warehouse.view`. Main (all warehouses) sees every
 * transfer; Sub sees the transfers arriving at its own warehouse
 * (warehouseId + direction INBOUND), and the server confines it to its
 * warehouse whatever is sent (BR-30). 'New Transfer' (header button and bottom
 * action) needs `transfer.inter_warehouse.initiate` (MAIN all, SUB none, BR-26).
 * The approval note carries no threshold: the server decides it from
 * system_config (high value or an unvalued line), the app does not guess it.
 */
import React, { useState } from 'react';
import { ScrollView } from 'react-native';

import { t } from '../../../i18n';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import {
  ChipGroup,
  HeaderIconButton,
  InfoNote,
  KpiRow,
  ScopeHeader,
  SectionTitle,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { PlusIcon } from '../storage-ops/StorageParts';
import { canInitiateTransfer, TRANSFER_FILTERS, transferFilterLabel, type TransferFilter } from './mappers';
import { TransferRow } from './TransferParts';
import { useTransferList, useTransferStatusCounts, useTransferWarehouses } from './useTransfersData';
import type { TransferListItem, WarehouseScreenBaseProps } from './types';

export interface InterWarehouseTransferScreenProps extends WarehouseScreenBaseProps {
  onNewTransfer?: (() => void) | undefined;
  onSelectTransfer?: ((transfer: TransferListItem) => void) | undefined;
}

function countText(value: number | undefined): string {
  return value === undefined ? t('transfers.kpi.unknown') : String(value);
}

export function InterWarehouseTransferScreen({ scope, can, onBack, onNewTransfer, onSelectTransfer }: InterWarehouseTransferScreenProps) {
  const [filter, setFilter] = useState<TransferFilter>('ALL');
  // Hidden without the code (BR-26); a host that passes no handler hides it too.
  const newTransfer = canInitiateTransfer(can) ? onNewTransfer : undefined;

  const { nameOf } = useTransferWarehouses(scope, can);
  const list = useTransferList(scope, filter === 'ALL' ? undefined : filter, nameOf);
  const counts = useTransferStatusCounts(scope);
  const view = queryViewState({ isLoading: list.isLoading, error: list.error, itemCount: list.items.length });
  const isMain = scope.warehouseId === undefined;

  return (
    <WalletScreen
      title={t('transfers.list.title')}
      subtitle={isMain ? t('transfers.list.subtitle.main') : t('transfers.list.subtitle.sub')}
      onBack={onBack}
      headerRight={
        newTransfer ? (
          <HeaderIconButton onPress={newTransfer} accessibilityLabel={t('transfers.list.new')}>
            <PlusIcon size={18} />
          </HeaderIconButton>
        ) : undefined
      }
      headerExtra={<ScopeHeader scope={scope} label={isMain ? t('transfers.scope.all') : undefined} />}
      footer={
        newTransfer ? (
          <WalletFooter>
            <WalletButton label={t('transfers.list.new')} icon={<PlusIcon size={18} />} onPress={newTransfer} />
          </WalletFooter>
        ) : undefined
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <KpiRow
          items={[
            { value: countText(counts.IN_TRANSIT), label: t('transfers.kpi.inTransit'), tone: 'info' },
            { value: countText(counts.PENDING_APPROVAL), label: t('transfers.kpi.pending'), tone: 'warning' },
            { value: countText(counts.RECEIVED), label: t('transfers.kpi.received'), tone: 'success' },
          ]}
        />
        <ChipGroup options={TRANSFER_FILTERS} value={filter} onChange={setFilter} labelOf={transferFilterLabel} />
        <SectionTitle>{t('transfers.list.section')}</SectionTitle>
        {view === 'loading' ? <AdminLoadingState /> : null}
        {view === 'error' ? <AdminErrorState error={list.error} onRetry={list.refresh} /> : null}
        {view === 'empty' ? <AdminEmptyState title={t('transfers.list.empty.title')} subtitle={t('transfers.list.empty.subtitle')} /> : null}
        {view === 'ready'
          ? list.items.map((item) => (
              <TransferRow key={item.id} transfer={item} onPress={onSelectTransfer ? () => onSelectTransfer(item) : undefined} />
            ))
          : null}
        {view === 'ready' && list.hasMore ? (
          <WalletButton label={t('transfers.list.loadMore')} variant="outline" onPress={list.loadMore} />
        ) : null}
        {newTransfer ? <InfoNote tone="brandSoft">{t('transfers.list.approvalNote')}</InfoNote> : null}
      </ScrollView>
    </WalletScreen>
  );
}
