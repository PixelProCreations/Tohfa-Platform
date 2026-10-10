/**
 * Inter-Warehouse Transfer: the transfer list (KPI counts, status chips,
 * transfer cards).
 *
 * Gate (FINAL_LIST 143): Shared. Main (all warehouses) sees every transfer;
 * Sub sees only transfers arriving at its own warehouse (destination =
 * scope.warehouseId), the ones it may receive. No `transfer.view` code exists
 * (SPEC_GAPS W4w-2). 'New Transfer' (header button and bottom action) and the
 * high-value policy note need `transfer.inter_warehouse.initiate` (MAIN all,
 * SUB none, BR-26).
 */
import React, { useMemo, useState } from 'react';
import { ScrollView } from 'react-native';

import { formatTransferThreshold } from '../../../config/businessThresholds';
import {
  ChipGroup,
  EmptyState,
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
import { TRANSFERS } from './fixtures';
import { TRANSFER_CODES, TransferRow, transferInScope } from './TransferParts';
import type { TransferItem, TransferStatus, WarehouseScreenBaseProps } from './types';

type FilterKey = 'All' | TransferStatus;

const FILTERS: readonly FilterKey[] = ['All', 'In Transit', 'Arrived', 'Pending SA Approval', 'Completed'];
const FILTER_LABEL: Record<FilterKey, string> = {
  All: 'All',
  'In Transit': 'In Transit',
  Arrived: 'Arrived',
  'Pending SA Approval': 'Pending Approval',
  Completed: 'Completed',
};

export interface InterWarehouseTransferScreenProps extends WarehouseScreenBaseProps {
  transfers?: readonly TransferItem[] | undefined;
  onNewTransfer?: (() => void) | undefined;
  onSelectTransfer?: ((transfer: TransferItem) => void) | undefined;
}

export function InterWarehouseTransferScreen({
  scope,
  can,
  onBack,
  transfers = TRANSFERS,
  onNewTransfer,
  onSelectTransfer,
}: InterWarehouseTransferScreenProps) {
  const [filter, setFilter] = useState<FilterKey>('All');
  // Hidden without the code (BR-26); a host that passes no handler hides it too.
  const newTransfer = can(TRANSFER_CODES.initiate) ? onNewTransfer : undefined;

  const visible = useMemo(() => transfers.filter((t) => transferInScope(scope, t)), [transfers, scope]);
  const filtered = filter === 'All' ? visible : visible.filter((t) => t.status === filter);
  const count = (status: TransferStatus) => visible.filter((t) => t.status === status).length;

  return (
    <WalletScreen
      title="Inter-Warehouse Transfer"
      subtitle={scope.warehouseId === undefined ? 'Rebalancing stock across locations' : 'Incoming transfers to your warehouse'}
      onBack={onBack}
      headerRight={
        newTransfer ? (
          <HeaderIconButton onPress={newTransfer} accessibilityLabel="Initiate new transfer">
            <PlusIcon size={18} />
          </HeaderIconButton>
        ) : undefined
      }
      headerExtra={<ScopeHeader scope={scope} />}
      footer={
        newTransfer ? (
          <WalletFooter>
            <WalletButton label="Initiate New Transfer" icon={<PlusIcon size={18} />} onPress={newTransfer} />
          </WalletFooter>
        ) : undefined
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <KpiRow
          items={[
            { value: String(count('In Transit')), label: 'IN TRANSIT', tone: 'info' },
            { value: String(count('Pending SA Approval')), label: 'PENDING APPROVAL', tone: 'warning' },
            { value: String(count('Completed')), label: 'COMPLETED', tone: 'success' },
          ]}
        />
        <ChipGroup options={FILTERS} value={filter} onChange={setFilter} labelOf={(f) => FILTER_LABEL[f]} />
        <SectionTitle>Transfers</SectionTitle>
        {filtered.length === 0 ? (
          <EmptyState title="No transfers" subtitle="No transfers in this status." />
        ) : (
          filtered.map((item) => (
            <TransferRow
              key={item.id}
              transfer={item}
              onPress={onSelectTransfer ? () => onSelectTransfer(item) : undefined}
            />
          ))
        )}
        {newTransfer ? (
          <InfoNote tone="brandSoft">
            Transfers of {formatTransferThreshold()} or more can&apos;t dispatch without Super Admin sign-off, consistent
            with dual approval on large actions.
          </InfoNote>
        ) : null}
      </ScrollView>
    </WalletScreen>
  );
}
