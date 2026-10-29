/**
 * Inter-Warehouse Transfer: the transfer list (status chips, live transfer cards).
 *
 * Gate: Shared. Main sees every transfer; Sub sees only incoming transfers to its warehouse.
 */
import React, { useState } from 'react';
import { ScrollView } from 'react-native';

import { t } from '../../../i18n';
import type { TransferStatus } from '../../../api/warehouseTransfers';
import {
  ChipGroup,
  EmptyState,
  ScopeHeader,
  SectionTitle,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { LiveTransferRowCard } from './TransferParts';
import type { WarehouseScreenBaseProps } from './types';
import { useTransferList } from './useTransferReceiving';

type FilterKey = 'All' | 'In Transit' | 'Pending Approval' | 'Completed';

const FILTERS: readonly FilterKey[] = ['All', 'In Transit', 'Pending Approval', 'Completed'];
const FILTER_MAP: Record<FilterKey, TransferStatus | undefined> = {
  All: undefined,
  'In Transit': 'IN_TRANSIT',
  'Pending Approval': 'PENDING_APPROVAL',
  Completed: 'RECEIVED',
};

export interface InterWarehouseTransferScreenProps extends WarehouseScreenBaseProps {
  onNewTransfer?: (() => void) | undefined;
  onSelectTransfer?: ((transfer: { id: string }) => void) | undefined;
}

export function InterWarehouseTransferScreen({
  scope,
  can,
  onBack,
  onSelectTransfer,
}: InterWarehouseTransferScreenProps) {
  const [filter, setFilter] = useState<FilterKey>('All');
  const selectedStatus = FILTER_MAP[filter];

  const { items, isLoading, error, refresh } = useTransferList(scope, can, { status: selectedStatus });

  return (
    <WalletScreen
      title="Inter-Warehouse Transfer"
      subtitle={scope.warehouseId === undefined ? 'Rebalancing stock across locations' : 'Incoming transfers to your warehouse'}
      onBack={onBack}
      headerExtra={<ScopeHeader scope={scope} />}
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <ChipGroup options={FILTERS} value={filter} onChange={setFilter} labelOf={(f) => f} />
        <SectionTitle>Transfers</SectionTitle>

        {isLoading ? (
          <AdminLoadingState />
        ) : error ? (
          <AdminErrorState error={error} onRetry={refresh} />
        ) : items.length === 0 ? (
          <EmptyState title={t('transfers.empty.title')} subtitle={t('transfers.empty.subtitle')} />
        ) : (
          items.map((item) => (
            <LiveTransferRowCard
              key={item.id}
              transfer={item}
              onPress={onSelectTransfer ? () => onSelectTransfer({ id: item.id }) : undefined}
            />
          ))
        )}
      </ScrollView>
    </WalletScreen>
  );
}
