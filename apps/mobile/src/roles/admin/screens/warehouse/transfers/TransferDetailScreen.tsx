/**
 * Transfer Detail: route, transfer information and the progress timeline of
 * one transfer.
 *
 * Gate (FINAL_LIST 144): Shared and scope-locked; a transfer outside the
 * scope (Sub: not arriving at its warehouse) renders "not found", no 403 leak.
 * 'Cancel Transfer Request' needs `transfer.inter_warehouse.initiate` (MAIN
 * all, SUB none); 'Receive at Destination' (Track Receiving) needs
 * `transfer.inter_warehouse.receive` (all).
 */
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import { formatTransferThreshold } from '../../../config/businessThresholds';
import {
  EmptyState,
  InfoCard,
  InfoNote,
  ScopeHeader,
  SectionTitle,
  StatusBadge,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
  CheckIcon,
} from '../wallet-cashtopup/WalletParts';
import { TRANSFERS, transferWarehouseLabel } from './fixtures';
import {
  formatTransferKg,
  RouteArrowIcon,
  TRANSFER_CODES,
  TRANSFER_STATUS_TONE,
  transferInScope,
  transferRouteLabel,
} from './TransferParts';
import type { TransferItem, TransferStatus, WarehouseScreenBaseProps } from './types';

const STEPS = [
  'Transfer Requested',
  'Super Admin Approval',
  'Dispatched from Source',
  'In Transit',
  'Arrived at Destination',
  'Received & Ledger Updated',
] as const;

/** Last completed step of the timeline for each status. */
const STEP_INDEX: Record<TransferStatus, number> = {
  'Pending SA Approval': 1,
  'In Transit': 3,
  Arrived: 4,
  Completed: 5,
};

export interface TransferDetailScreenProps extends WarehouseScreenBaseProps {
  transferId?: string | undefined;
  transfers?: readonly TransferItem[] | undefined;
  /** Open Transfer Receiving for this transfer. */
  onTrackReceiving?: ((transferId: string) => void) | undefined;
  /** The request was cancelled (the host removes it / returns to the list). */
  onCancelTransfer?: ((transferId: string) => void) | undefined;
  onBackToTransfers?: (() => void) | undefined;
}

export function TransferDetailScreen({
  scope,
  can,
  onBack,
  transferId,
  transfers = TRANSFERS,
  onTrackReceiving,
  onCancelTransfer,
  onBackToTransfers,
}: TransferDetailScreenProps) {
  const transfer = transfers.find((t) => t.id === transferId && transferInScope(scope, t));

  if (transfer === undefined) {
    return (
      <WalletScreen title="Transfer Detail" onBack={onBack} headerExtra={<ScopeHeader scope={scope} />}>
        <EmptyState title="Transfer not found" subtitle="This transfer is not available in your warehouse." />
      </WalletScreen>
    );
  }

  const stepIndex = STEP_INDEX[transfer.status];
  const canCancel = can(TRANSFER_CODES.initiate) && transfer.status === 'Pending SA Approval';
  const canTrack =
    can(TRANSFER_CODES.receive) &&
    onTrackReceiving !== undefined &&
    (transfer.status === 'In Transit' || transfer.status === 'Arrived');

  const handleCancel = () => {
    Alert.alert('Cancel Transfer', `Cancel ${transfer.code}? This request will be withdrawn.`, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel Transfer',
        style: 'destructive',
        onPress: () => {
          onCancelTransfer?.(transfer.id);
          (onBackToTransfers ?? onBack)();
        },
      },
    ]);
  };

  return (
    <WalletScreen
      title="Transfer Detail"
      subtitle={`${transfer.code} · ${transferRouteLabel(transfer)}`}
      onBack={onBack}
      headerExtra={<ScopeHeader scope={scope} />}
      footer={
        <WalletFooter>
          {canTrack ? (
            <WalletButton label="Receive at Destination" onPress={() => onTrackReceiving?.(transfer.id)} />
          ) : null}
          {canCancel ? (
            <TouchableOpacity
              style={styles.dangerButton}
              onPress={handleCancel}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Text style={styles.dangerButtonText}>Cancel Transfer Request</Text>
            </TouchableOpacity>
          ) : null}
          <WalletButton label="Back to All Transfers" variant="outline" onPress={onBackToTransfers ?? onBack} />
        </WalletFooter>
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.routeRow}>
            <View style={styles.routeCol}>
              <Text style={styles.routeLabel}>FROM</Text>
              <Text style={styles.routeValue}>{transferWarehouseLabel(transfer.sourceWarehouseId)}</Text>
            </View>
            <View style={styles.routeArrow}>
              <RouteArrowIcon size={18} />
            </View>
            <View style={[styles.routeCol, styles.routeColEnd]}>
              <Text style={styles.routeLabel}>TO</Text>
              <Text style={styles.routeValue}>{transferWarehouseLabel(transfer.destinationWarehouseId)}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.statusRow}>
            <StatusBadge label={transfer.status} tone={TRANSFER_STATUS_TONE[transfer.status]} />
            {transfer.eta ? <Text style={styles.eta}>{transfer.eta}</Text> : null}
          </View>
        </View>

        <SectionTitle>Transfer Information</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Transfer ID', value: transfer.code },
              { label: 'Produce', value: `${transfer.produce} — ${formatTransferKg(transfer.quantityKg)}` },
            ],
            [
              { label: 'Vehicle', value: transfer.vehicle ?? 'Not dispatched' },
              { label: 'Initiated By', value: transfer.initiatedBy ?? '—' },
            ],
          ]}
        />

        <SectionTitle>Transfer Progress</SectionTitle>
        <View style={styles.card}>
          {STEPS.map((label, idx) => {
            const done = idx <= stepIndex;
            const isLast = idx === STEPS.length - 1;
            return (
              <View key={label} style={styles.stepRow}>
                <View style={styles.stepRail}>
                  <View style={[styles.stepDot, done ? styles.stepDotDone : styles.stepDotPending]}>
                    {done ? <CheckIcon size={11} /> : null}
                  </View>
                  {!isLast ? <View style={[styles.stepLine, done && idx < stepIndex && styles.stepLineDone]} /> : null}
                </View>
                <Text style={[styles.stepText, done && styles.stepTextDone]}>{label}</Text>
              </View>
            );
          })}
        </View>

        {transfer.status === 'Pending SA Approval' ? (
          <InfoNote tone="brandSoft">
            This transfer is at or above {formatTransferThreshold()} and is awaiting Super Admin dual-key sign-off before a
            dispatch manifest is issued.
          </InfoNote>
        ) : null}
      </ScrollView>
    </WalletScreen>
  );
}

const ROUTE_ARROW = 34;
const STEP_DOT = 20;
const STEP_LINE = 22;

const styles = StyleSheet.create({
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginTop: adminSpacing.sm,
  },
  divider: { height: 1, backgroundColor: adminColors.border, marginVertical: adminSpacing.md },
  routeRow: { flexDirection: 'row', alignItems: 'center' },
  routeCol: { flex: 1 },
  routeColEnd: { alignItems: 'flex-end' },
  routeArrow: {
    width: ROUTE_ARROW,
    height: ROUTE_ARROW,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeLabel: { ...adminType.caption, color: adminColors.muted },
  routeValue: { ...adminType.title, color: adminColors.ink, marginTop: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm },
  eta: { ...adminType.rowMeta, color: adminColors.muted },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start' },
  stepRail: { alignItems: 'center', width: STEP_DOT + 2, marginRight: adminSpacing.md },
  stepDot: { width: STEP_DOT, height: STEP_DOT, borderRadius: adminRadius.full, alignItems: 'center', justifyContent: 'center' },
  stepDotDone: { backgroundColor: adminColors.brand },
  stepDotPending: { backgroundColor: adminColors.card, borderWidth: 2, borderColor: adminColors.border },
  stepLine: { width: 2, height: STEP_LINE, backgroundColor: adminColors.border },
  stepLineDone: { backgroundColor: adminColors.brand },
  stepText: { ...adminType.body, color: adminColors.muted, paddingTop: 1 },
  stepTextDone: { ...adminType.sectionHead, color: adminColors.ink },
  dangerButton: {
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.danger.bg,
    borderWidth: 1,
    borderColor: adminColors.danger.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButtonText: { ...adminType.sectionHead, color: adminColors.danger.text },
});
