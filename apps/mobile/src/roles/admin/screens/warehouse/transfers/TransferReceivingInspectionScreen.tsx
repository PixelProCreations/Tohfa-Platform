/**
 * Transfer Receiving Inspection: verify the received quantity of an arrived
 * transfer and complete the receipt.
 *
 * Gate (FINAL_LIST 146): Shared and scope-locked; for Sub the transfer's
 * destination must be scope.warehouseId, otherwise "not found" (no 403 leak).
 * Complete Transfer Receipt needs `transfer.inter_warehouse.receive` (all).
 * The source / destination come from the transfer row, not the old
 * 'Kotagiri' / 'Coonoor Warehouse' defaults.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import {
  CheckIcon,
  EmptyState,
  InfoCard,
  InfoNote,
  PermissionNote,
  ScopeHeader,
  SectionTitle,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { TRANSFERS } from './fixtures';
import { warehouseNameOf } from '../wallet-cashtopup/fixtures';
import { formatTransferKg, TRANSFER_CODES, transferInScope, transferRouteLabel } from './TransferParts';
import type { TransferItem, WarehouseScreenBaseProps } from './types';

export interface TransferReceivingInspectionScreenProps extends WarehouseScreenBaseProps {
  transferId?: string | undefined;
  transfers?: readonly TransferItem[] | undefined;
  /** Receipt confirmed with the verified quantity in kg. */
  onCompleteTransfer?: ((transferId: string, receivedKg: number) => void) | undefined;
}

export function TransferReceivingInspectionScreen({
  scope,
  can,
  onBack,
  transferId,
  transfers = TRANSFERS,
  onCompleteTransfer,
}: TransferReceivingInspectionScreenProps) {
  const transfer = transfers.find((t) => t.id === transferId && transferInScope(scope, t));
  const [receivedVal, setReceivedVal] = useState(transfer ? String(transfer.quantityKg) : '');

  if (transfer === undefined) {
    return (
      <WalletScreen title="Transfer Inspection" onBack={onBack} headerExtra={<ScopeHeader scope={scope} />}>
        <EmptyState title="Transfer not found" subtitle="This transfer is not arriving at your warehouse." />
      </WalletScreen>
    );
  }

  const canReceive = can(TRANSFER_CODES.receive);
  const receivedKg = parseInt(receivedVal, 10);
  const valid = Number.isFinite(receivedKg) && receivedKg >= 0;
  const mismatch = valid && receivedKg !== transfer.quantityKg;

  return (
    <WalletScreen
      title="Transfer Inspection"
      subtitle={`${transfer.code} · ${transferRouteLabel(transfer)}`}
      onBack={onBack}
      headerExtra={<ScopeHeader scope={scope} />}
      footer={
        <WalletFooter>
          {canReceive ? (
            <WalletButton
              label="Complete Transfer Receipt"
              icon={<CheckIcon />}
              disabled={!valid || transfer.status !== 'Arrived'}
              onPress={() => onCompleteTransfer?.(transfer.id, receivedKg)}
            />
          ) : (
            <PermissionNote>Completing a transfer receipt needs transfer receive permission.</PermissionNote>
          )}
        </WalletFooter>
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <SectionTitle>Transfer Details</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Transfer ID', value: transfer.code },
              { label: 'Source', value: warehouseNameOf(transfer.sourceWarehouseId) },
            ],
            [
              { label: 'Destination', value: warehouseNameOf(transfer.destinationWarehouseId) },
              { label: 'Sent Quantity', value: `${transfer.produce} (${formatTransferKg(transfer.quantityKg)})` },
            ],
          ]}
        />

        <SectionTitle>Verification</SectionTitle>
        <Text style={styles.fieldLabel}>Verified Received Quantity</Text>
        <View style={styles.inputBox}>
          <TextInput
            style={styles.input}
            value={receivedVal}
            onChangeText={setReceivedVal}
            keyboardType="numeric"
            editable={canReceive}
            placeholderTextColor={adminColors.placeholder}
            accessibilityLabel="Verified received quantity in kg"
          />
          <Text style={styles.unit}>KG</Text>
        </View>
        {mismatch ? (
          <InfoNote tone="warning">
            Received quantity differs from the {formatTransferKg(transfer.quantityKg)} sent; the difference is recorded
            as a quantity mismatch.
          </InfoNote>
        ) : null}
        <InfoNote tone="brandSoft">
          Inter-warehouse receipts update the destination stock ledger and close the transit manifest.
        </InfoNote>
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  fieldLabel: { ...adminType.rowTitle, color: adminColors.muted, marginBottom: adminSpacing.xs },
  inputBox: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    height: ADMIN_BUTTON_HEIGHT,
    paddingHorizontal: adminSpacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: { ...adminType.sectionHead, color: adminColors.ink, flex: 1, padding: 0 },
  unit: { ...adminType.sectionHead, color: adminColors.muted },
});
