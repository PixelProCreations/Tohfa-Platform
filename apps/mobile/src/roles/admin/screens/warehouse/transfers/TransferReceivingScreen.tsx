/**
 * Transfer Receiving: inter-warehouse arrivals at the destination (counts and
 * the incoming list).
 *
 * Gate (FINAL_LIST 145): Shared. Sub sees only arrivals whose destination is
 * its own warehouse; Main sees every warehouse's. Start Inspection (the card
 * tap and the bottom action) needs `transfer.inter_warehouse.receive` (all).
 * The header no longer names 'Coonoor ← Kotagiri': routes come from the rows.
 */
import React, { useMemo } from 'react';
import { ScrollView } from 'react-native';

import {
  EmptyState,
  KpiRow,
  PermissionNote,
  ScopeHeader,
  SectionTitle,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { TRANSFERS } from './fixtures';
import { PlayCircleIcon, TRANSFER_CODES, TransferRow, transferInScope } from './TransferParts';
import type { TransferItem, WarehouseScreenBaseProps } from './types';

export interface TransferReceivingScreenProps extends WarehouseScreenBaseProps {
  transfers?: readonly TransferItem[] | undefined;
  onStartTransferInspection?: ((transferId: string) => void) | undefined;
}

export function TransferReceivingScreen({
  scope,
  can,
  onBack,
  transfers = TRANSFERS,
  onStartTransferInspection,
}: TransferReceivingScreenProps) {
  const canReceive = can(TRANSFER_CODES.receive);
  const incoming = useMemo(
    () => transfers.filter((t) => transferInScope(scope, t) && t.status !== 'Pending SA Approval'),
    [transfers, scope],
  );
  const awaiting = incoming.filter((t) => t.status === 'In Transit' || t.status === 'Arrived');
  const firstArrived = incoming.find((t) => t.status === 'Arrived');
  const count = (pred: (t: TransferItem) => boolean) => String(incoming.filter(pred).length);

  const start = canReceive ? onStartTransferInspection : undefined;

  return (
    <WalletScreen
      title="Transfer Receiving"
      subtitle="Inter-warehouse arrivals"
      onBack={onBack}
      headerExtra={<ScopeHeader scope={scope} />}
      footer={
        start && firstArrived ? (
          <WalletFooter>
            <WalletButton label="Start Inspection" icon={<PlayCircleIcon />} onPress={() => start(firstArrived.id)} />
          </WalletFooter>
        ) : !canReceive ? (
          <WalletFooter>
            <PermissionNote>Receiving a transfer needs transfer receive permission.</PermissionNote>
          </WalletFooter>
        ) : undefined
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <KpiRow
          items={[
            { value: count((t) => t.status === 'In Transit'), label: 'IN TRANSIT', tone: 'info' },
            { value: count((t) => t.status === 'Arrived'), label: 'ARRIVED', tone: 'brandSoft' },
          ]}
        />
        <KpiRow
          items={[
            { value: count((t) => t.status === 'Completed'), label: 'RECEIVED', tone: 'success' },
            { value: count((t) => t.qtyMismatch === true), label: 'QTY MISMATCH', tone: 'danger' },
          ]}
        />
        <SectionTitle>Incoming Transfer List</SectionTitle>
        {awaiting.length === 0 ? (
          <EmptyState title="No incoming transfers" subtitle="Nothing is in transit to this warehouse." />
        ) : (
          awaiting.map((t) => (
            <TransferRow
              key={t.id}
              transfer={t}
              onPress={start && t.status === 'Arrived' ? () => start(t.id) : undefined}
            />
          ))
        )}
      </ScrollView>
    </WalletScreen>
  );
}
