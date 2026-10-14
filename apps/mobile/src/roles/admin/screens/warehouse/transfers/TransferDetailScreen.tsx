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
import React, { useState } from 'react';
import { Alert, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

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
  BackArrowIcon,
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
import { useFlowBack } from '../useFlowBack';

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

function TrackingTrendIcon({ size = 24, color = '#D97706' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 17l6-6 4 4 8-8"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DiscrepancyAlertIcon({ size = 24, color = '#D97706' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth="2" />
      <Path d="M12 7.5v5.5M12 16v.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CompletedCheckIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Circle cx={10} cy={10} r={10} fill="#15803D" />
      <Path d="M6 10.2l2.8 2.8 5.6-5.6" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PendingCircleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Circle cx={10} cy={10} r={9} stroke="#D1D5DB" strokeWidth="1.8" />
      <Circle cx={10} cy={10} r={3} fill="#D1D5DB" />
    </Svg>
  );
}

const TRACKING_STEPS = [
  { label: 'Transfer Created', completed: true },
  { label: 'Dispatched', completed: true },
  { label: 'In Transit', completed: true },
  { label: 'Arrived', completed: false },
  { label: 'Receiving', completed: false },
  { label: 'Quantity Verification', completed: false },
  { label: 'Quality Check', completed: false },
  { label: 'Accept / Partial / Reject', completed: false },
  { label: 'Completed', completed: false },
];

export interface TransferDetailScreenProps extends WarehouseScreenBaseProps {
  transferId?: string | undefined;
  transfers?: readonly TransferItem[] | undefined;
  /** Open Transfer Receiving for this transfer. */
  onTrackReceiving?: ((transferId: string) => void) | undefined;
  /** The request was cancelled (the host removes it / returns to the list). */
  onCancelTransfer?: ((transferId: string) => void) | undefined;
  onBackToTransfers?: (() => void) | undefined;
}

type MainSubView = 'detail' | 'tracking' | 'discrepancy';

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
  const isMain = scope.warehouseId === undefined;
  const [mainSubView, setMainSubView] = useState<MainSubView>('detail');

  useFlowBack(() => {
    if (isMain && mainSubView !== 'detail') {
      setMainSubView('detail');
      return true;
    }
    return false;
  });

  const transfer = transfers.find((t) => (t.id === transferId || t.code === transferId) && (isMain || transferInScope(scope, t))) ?? (isMain ? transfers.find((t) => t.code === 'TRF-00284' || t.id === '00284') : undefined);

  if (isMain) {
    if (mainSubView === 'tracking') {
      return (
        <SafeAreaView style={mainStyles.safeArea}>
          <StatusBar barStyle="light-content" backgroundColor="#F0562A" />
          <View style={mainStyles.container}>
            {/* Header */}
            <View style={mainStyles.header}>
              <TouchableOpacity
                onPress={() => setMainSubView('detail')}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={mainStyles.backBtn}
              >
                <BackArrowIcon color="#FFFFFF" size={22} />
              </TouchableOpacity>
              <Text style={mainStyles.headerTitle}>Tracking</Text>
            </View>

            <ScrollView style={mainStyles.scroll} contentContainerStyle={mainStyles.scrollPad} showsVerticalScrollIndicator={false}>
              <Text style={mainStyles.sectionHeading}>Transfer Tracking</Text>
              <View style={mainStyles.trackingList}>
                {TRACKING_STEPS.map((step) => (
                  <View key={step.label} style={mainStyles.trackingRow}>
                    {step.completed ? <CompletedCheckIcon size={20} /> : <PendingCircleIcon size={20} />}
                    <Text style={[mainStyles.trackingText, step.completed ? mainStyles.trackingTextDone : mainStyles.trackingTextPending]}>
                      {step.label}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      );
    }

    if (mainSubView === 'discrepancy') {
      return (
        <SafeAreaView style={mainStyles.safeArea}>
          <StatusBar barStyle="light-content" backgroundColor="#F0562A" />
          <View style={mainStyles.container}>
            {/* Header */}
            <View style={mainStyles.header}>
              <TouchableOpacity
                onPress={() => setMainSubView('detail')}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={mainStyles.backBtn}
              >
                <BackArrowIcon color="#FFFFFF" size={22} />
              </TouchableOpacity>
              <Text style={mainStyles.headerTitle}>Discrepancy</Text>
            </View>

            <ScrollView style={mainStyles.scroll} contentContainerStyle={mainStyles.scrollPad} showsVerticalScrollIndicator={false}>
              <Text style={mainStyles.sectionHeading}>Transfer Discrepancy</Text>
              <View style={mainStyles.infoCard}>
                <View style={mainStyles.gridRow}>
                  <View style={mainStyles.gridCol}>
                    <Text style={mainStyles.gridLabel}>Sent</Text>
                    <Text style={mainStyles.gridValBold}>200 KG</Text>
                  </View>
                  <View style={mainStyles.gridCol}>
                    <Text style={mainStyles.gridLabel}>Received</Text>
                    <Text style={mainStyles.gridValBold}>195 KG</Text>
                  </View>
                </View>
                <View style={[mainStyles.gridRow, { marginBottom: 0, marginTop: 4 }]}>
                  <View style={mainStyles.gridCol}>
                    <Text style={mainStyles.gridLabel}>Variance</Text>
                    <Text style={[mainStyles.gridValBold, { color: adminColors.danger.text }]}>-5 KG</Text>
                  </View>
                </View>
              </View>

              <View style={mainStyles.discrepancyAlert}>
                <Text style={mainStyles.discrepancyAlertText}>
                  Possible mismatch types: Quantity, Quality, Grade, Product, Damage — none is auto-resolved from this screen.
                </Text>
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      );
    }

    // Default: detail
    return (
      <SafeAreaView style={mainStyles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#F0562A" />
        <View style={mainStyles.container}>
          {/* Header */}
          <View style={mainStyles.header}>
            <TouchableOpacity onPress={onBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={mainStyles.backBtn}>
              <BackArrowIcon color="#FFFFFF" size={22} />
            </TouchableOpacity>
            <Text style={mainStyles.headerTitle}>Transfer Detail</Text>
          </View>

          <ScrollView style={mainStyles.scroll} contentContainerStyle={mainStyles.scrollPad} showsVerticalScrollIndicator={false}>
            <Text style={mainStyles.sectionHeading}>Transfer Detail — TRF-00284</Text>

            <View style={mainStyles.infoCard}>
              <View style={mainStyles.gridRow}>
                <View style={mainStyles.gridCol}>
                  <Text style={mainStyles.gridLabel}>Source</Text>
                  <Text style={mainStyles.gridValBold}>Coonoor</Text>
                </View>
                <View style={mainStyles.gridCol}>
                  <Text style={mainStyles.gridLabel}>Destination</Text>
                  <Text style={mainStyles.gridValBold}>Ooty</Text>
                </View>
              </View>

              <View style={mainStyles.gridRow}>
                <View style={mainStyles.gridCol}>
                  <Text style={mainStyles.gridLabel}>Product</Text>
                  <Text style={mainStyles.gridValBold}>Carrot G1</Text>
                </View>
                <View style={mainStyles.gridCol}>
                  <Text style={mainStyles.gridLabel}>Quantity</Text>
                  <Text style={mainStyles.gridValBold}>200 KG</Text>
                </View>
              </View>

              <View style={[mainStyles.gridRow, { marginBottom: 0 }]}>
                <View style={mainStyles.gridCol}>
                  <Text style={mainStyles.gridLabel}>Status</Text>
                  <Text style={mainStyles.gridValBold}>In Transit</Text>
                </View>
              </View>
            </View>

            {/* Action cards row */}
            <View style={mainStyles.actionCardsRow}>
              <TouchableOpacity
                style={mainStyles.actionCard}
                activeOpacity={0.7}
                onPress={() => setMainSubView('tracking')}
              >
                <TrackingTrendIcon size={24} color="#D97706" />
                <Text style={mainStyles.actionCardText}>Tracking</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={mainStyles.actionCard}
                activeOpacity={0.7}
                onPress={() => setMainSubView('discrepancy')}
              >
                <DiscrepancyAlertIcon size={24} color="#D97706" />
                <Text style={mainStyles.actionCardText}>Discrepancy</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

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

const mainStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0562A',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAF5EE',
  },
  header: {
    backgroundColor: '#F0562A',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 12,
    padding: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  scroll: {
    flex: 1,
    backgroundColor: '#FAF5EE',
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  sectionHeading: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#78350F',
    marginBottom: 12,
    letterSpacing: -0.1,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFEAE2',
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  gridCol: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  gridValBold: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1C1917',
  },
  actionCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEAE2',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  actionCardText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1C1917',
    marginTop: 8,
  },
  trackingList: {
    paddingTop: 4,
  },
  trackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  trackingText: {
    fontSize: 13.5,
  },
  trackingTextDone: {
    fontWeight: '700',
    color: '#1C1917',
  },
  trackingTextPending: {
    fontWeight: '600',
    color: '#6B7280',
  },
  discrepancyAlert: {
    marginTop: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  discrepancyAlertText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#EF4444',
    lineHeight: 18,
  },
});
