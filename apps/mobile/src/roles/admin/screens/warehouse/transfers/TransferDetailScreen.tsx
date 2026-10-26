/**
 * Transfer Detail: route, transfer information and the progress of one
 * transfer, live (GET /warehouse-transfers/{id}, transfer.inter_warehouse.view).
 *
 * Gate: scope-locked. The server answers 404 for a transfer outside the scope
 * (BR-30), and a Sub admin is shown only transfers arriving at its own
 * warehouse; anything else renders "not found", never a 403 leak. 'Receive at
 * Destination' (Track Receiving) needs `transfer.inter_warehouse.receive` on an
 * IN_TRANSIT transfer whose destination the scope covers.
 *
 * Main (all warehouses) keeps its own layout: the detail grid, Tracking and
 * Discrepancy. Product is the crop name from a source batch read (Main holds
 * inventory.batch.view for every warehouse) with the line's grade; hidden
 * until every line is named. Tracking leaves out the design's Arrived, Quality
 * Check and Accept / Partial / Reject steps (no API: no arrival status, no
 * transfer quality check, no decision). Discrepancy shows sent, received and
 * the variance from the lines; received and variance only once received.
 *
 * Sub: the route card (a warehouse it cannot name, i.e. any but its own, is
 * left out), the information card (vehicle when the API has one; no
 * initiator name on this contract) and the progress steps from the server's
 * timestamps. Cancelling is not offered here: Sub never holds
 * `transfer.inter_warehouse.initiate`, and no cancel write is wired.
 */
import React, { useMemo, useState } from 'react';
import { Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { ApiError } from '../../../../../shell/api/client';
import { t } from '../../../i18n';
import { formatKg } from '../../../money/quantity';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import { kgLabel } from '../receiving-qc/mappers';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import {
  EmptyState,
  InfoCard,
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
import { RouteArrowIcon } from './TransferParts';
import {
  canReceiveTransfer,
  mainTrackingSteps,
  sourceBatchIdsToRead,
  subProgressSteps,
  TRANSFER_RECEIVING_CODES,
  transferProductLabel,
  transferRouteText,
} from './transferReceiving';
import { useTransferBatchFacts, useTransferDetail, useTransferNaming } from './useTransferReceiving';
import type { WarehouseScreenBaseProps } from './types';
import { useFlowBack } from '../useFlowBack';

function TrackingTrendIcon({ size = 24, color = adminColors.warning.text }: { size?: number; color?: string }) {
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

function DiscrepancyAlertIcon({ size = 24, color = adminColors.warning.text }: { size?: number; color?: string }) {
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
      <Circle cx={10} cy={10} r={10} fill={adminColors.success.text} />
      <Path d="M6 10.2l2.8 2.8 5.6-5.6" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PendingCircleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Circle cx={10} cy={10} r={9} stroke={adminColors.border} strokeWidth="1.8" />
      <Circle cx={10} cy={10} r={3} fill={adminColors.border} />
    </Svg>
  );
}

export interface TransferDetailScreenProps extends WarehouseScreenBaseProps {
  /** The transfer's uuid. */
  transferId?: string | undefined;
  /** Open Transfer Receiving / the inspection for this transfer. */
  onTrackReceiving?: ((transferId: string) => void) | undefined;
  onBackToTransfers?: (() => void) | undefined;
}

type MainSubView = 'detail' | 'tracking' | 'discrepancy';

function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.problem.status === 404;
}

export function TransferDetailScreen({
  scope,
  can,
  onBack,
  transferId,
  onTrackReceiving,
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

  const naming = useTransferNaming(scope, can);
  const detail = useTransferDetail(scope, can, transferId, naming);
  // A Sub admin is shown only transfers arriving at its own warehouse (the old transferInScope rule).
  const transfer =
    detail.transfer !== undefined && (isMain || detail.transfer.destinationWarehouseId === scope.warehouseId)
      ? detail.transfer
      : undefined;
  const batchIds = useMemo(() => (transfer === undefined ? [] : sourceBatchIdsToRead(scope, can, transfer)), [scope, can, transfer]);
  const facts = useTransferBatchFacts(scope, batchIds);
  const product = transfer === undefined ? undefined : transferProductLabel(transfer, facts.cropNames);
  const notFound =
    transferId === undefined ||
    !can(TRANSFER_RECEIVING_CODES.view) ||
    isNotFound(detail.error) ||
    (detail.transfer !== undefined && transfer === undefined);

  /** Loading, not found or error, in place of the content (no transfer yet). */
  const missingState = detail.isLoading ? (
    <AdminLoadingState />
  ) : notFound ? (
    <EmptyState title={t('transfers.detail.notFound.title')} subtitle={t('transfers.detail.notFound.subtitle')} />
  ) : (
    <AdminErrorState error={detail.error} onRetry={detail.refresh} />
  );

  if (isMain) {
    if (mainSubView === 'tracking' && transfer !== undefined) {
      return (
        <SafeAreaView style={mainStyles.safeArea}>
          <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
          <View style={mainStyles.container}>
            {/* Header */}
            <View style={mainStyles.header}>
              <TouchableOpacity
                onPress={() => setMainSubView('detail')}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={mainStyles.backBtn}
              >
                <BackArrowIcon color={adminColors.onBrand} size={22} />
              </TouchableOpacity>
              <Text style={mainStyles.headerTitle}>Tracking</Text>
            </View>

            <ScrollView style={mainStyles.scroll} contentContainerStyle={mainStyles.scrollPad} showsVerticalScrollIndicator={false}>
              <Text style={mainStyles.sectionHeading}>Transfer Tracking</Text>
              <View style={mainStyles.trackingList}>
                {mainTrackingSteps(transfer).map((step) => (
                  <View key={step.key} style={mainStyles.trackingRow}>
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

    if (mainSubView === 'discrepancy' && transfer !== undefined) {
      return (
        <SafeAreaView style={mainStyles.safeArea}>
          <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
          <View style={mainStyles.container}>
            {/* Header */}
            <View style={mainStyles.header}>
              <TouchableOpacity
                onPress={() => setMainSubView('detail')}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={mainStyles.backBtn}
              >
                <BackArrowIcon color={adminColors.onBrand} size={22} />
              </TouchableOpacity>
              <Text style={mainStyles.headerTitle}>Discrepancy</Text>
            </View>

            <ScrollView style={mainStyles.scroll} contentContainerStyle={mainStyles.scrollPad} showsVerticalScrollIndicator={false}>
              <Text style={mainStyles.sectionHeading}>Transfer Discrepancy</Text>
              <View style={mainStyles.infoCard}>
                <View style={mainStyles.gridRow}>
                  {transfer.sentGrams !== null ? (
                    <View style={mainStyles.gridCol}>
                      <Text style={mainStyles.gridLabel}>{t('transfers.detail.sent')}</Text>
                      <Text style={mainStyles.gridValBold}>{kgLabel(transfer.sentGrams)}</Text>
                    </View>
                  ) : (
                    <View style={mainStyles.gridCol} />
                  )}
                  {transfer.receivedGrams !== null ? (
                    <View style={mainStyles.gridCol}>
                      <Text style={mainStyles.gridLabel}>{t('transfers.detail.received')}</Text>
                      <Text style={mainStyles.gridValBold}>{kgLabel(transfer.receivedGrams)}</Text>
                    </View>
                  ) : (
                    <View style={mainStyles.gridCol} />
                  )}
                </View>
                {transfer.varianceGrams !== null ? (
                  <View style={[mainStyles.gridRow, { marginBottom: 0, marginTop: 4 }]}>
                    <View style={mainStyles.gridCol}>
                      <Text style={mainStyles.gridLabel}>{t('transfers.detail.variance')}</Text>
                      <Text style={[mainStyles.gridValBold, { color: adminColors.danger.text }]}>{kgLabel(transfer.varianceGrams)}</Text>
                    </View>
                  </View>
                ) : null}
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
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={mainStyles.container}>
          {/* Header */}
          <View style={mainStyles.header}>
            <TouchableOpacity onPress={onBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={mainStyles.backBtn}>
              <BackArrowIcon color={adminColors.onBrand} size={22} />
            </TouchableOpacity>
            <Text style={mainStyles.headerTitle}>Transfer Detail</Text>
          </View>

          <ScrollView style={mainStyles.scroll} contentContainerStyle={mainStyles.scrollPad} showsVerticalScrollIndicator={false}>
            {transfer === undefined ? (
              missingState
            ) : (
              <>
                <Text style={mainStyles.sectionHeading}>{t('transfers.detail.heading', { code: transfer.code })}</Text>

                <View style={mainStyles.infoCard}>
                  <View style={mainStyles.gridRow}>
                    {transfer.sourceName !== undefined ? (
                      <View style={mainStyles.gridCol}>
                        <Text style={mainStyles.gridLabel}>{t('transfers.detail.source')}</Text>
                        <Text style={mainStyles.gridValBold}>{transfer.sourceName}</Text>
                      </View>
                    ) : (
                      <View style={mainStyles.gridCol} />
                    )}
                    {transfer.destinationName !== undefined ? (
                      <View style={mainStyles.gridCol}>
                        <Text style={mainStyles.gridLabel}>{t('transfers.detail.destination')}</Text>
                        <Text style={mainStyles.gridValBold}>{transfer.destinationName}</Text>
                      </View>
                    ) : (
                      <View style={mainStyles.gridCol} />
                    )}
                  </View>

                  <View style={mainStyles.gridRow}>
                    {product !== undefined ? (
                      <View style={mainStyles.gridCol}>
                        <Text style={mainStyles.gridLabel}>{t('transfers.detail.product')}</Text>
                        <Text style={mainStyles.gridValBold}>{product}</Text>
                      </View>
                    ) : (
                      <View style={mainStyles.gridCol} />
                    )}
                    {transfer.sentGrams !== null ? (
                      <View style={mainStyles.gridCol}>
                        <Text style={mainStyles.gridLabel}>{t('transfers.detail.quantity')}</Text>
                        <Text style={mainStyles.gridValBold}>{kgLabel(transfer.sentGrams)}</Text>
                      </View>
                    ) : (
                      <View style={mainStyles.gridCol} />
                    )}
                  </View>

                  <View style={[mainStyles.gridRow, { marginBottom: 0 }]}>
                    <View style={mainStyles.gridCol}>
                      <Text style={mainStyles.gridLabel}>{t('transfers.detail.status')}</Text>
                      <Text style={mainStyles.gridValBold}>{transfer.statusLabel}</Text>
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
                    <TrackingTrendIcon size={24} color={adminColors.warning.text} />
                    <Text style={mainStyles.actionCardText}>Tracking</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={mainStyles.actionCard}
                    activeOpacity={0.7}
                    onPress={() => setMainSubView('discrepancy')}
                  >
                    <DiscrepancyAlertIcon size={24} color={adminColors.warning.text} />
                    <Text style={mainStyles.actionCardText}>Discrepancy</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  if (transfer === undefined) {
    return (
      <WalletScreen title={t('transfers.detail.title')} onBack={onBack} headerExtra={<ScopeHeader scope={scope} />}>
        {missingState}
      </WalletScreen>
    );
  }

  const steps = subProgressSteps(transfer);
  const canTrack = canReceiveTransfer(scope, can, transfer) && onTrackReceiving !== undefined;
  const route = transferRouteText(transfer);
  const sentText = transfer.sentGrams === null ? undefined : formatKg(transfer.sentGrams);
  const produceValue =
    product !== undefined && sentText !== undefined
      ? t('transfers.detail.produceQty', { product, qty: sentText })
      : product ?? sentText;
  const infoFirstRow = [{ label: t('transfers.detail.transferId'), value: transfer.code }];
  if (produceValue !== undefined) infoFirstRow.push({ label: t('transfers.detail.produce'), value: produceValue });
  const infoRows = [infoFirstRow];
  // No initiator name on this contract (initiatedByName not wired), so only the vehicle, when the API has one.
  if (transfer.vehicleNumber !== undefined) infoRows.push([{ label: t('transfers.detail.vehicle'), value: transfer.vehicleNumber }]);

  return (
    <WalletScreen
      title={t('transfers.detail.title')}
      subtitle={route === undefined ? transfer.code : t('transfers.detail.subtitle', { code: transfer.code, route })}
      onBack={onBack}
      headerExtra={<ScopeHeader scope={scope} />}
      footer={
        <WalletFooter>
          {canTrack ? (
            <WalletButton label={t('transfers.detail.receiveAtDestination')} onPress={() => onTrackReceiving?.(transfer.id)} />
          ) : null}
          <WalletButton label={t('transfers.detail.backToAll')} variant="outline" onPress={onBackToTransfers ?? onBack} />
        </WalletFooter>
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.routeRow}>
            <View style={styles.routeCol}>
              <Text style={styles.routeLabel}>FROM</Text>
              {transfer.sourceName !== undefined ? <Text style={styles.routeValue}>{transfer.sourceName}</Text> : null}
            </View>
            <View style={styles.routeArrow}>
              <RouteArrowIcon size={18} />
            </View>
            <View style={[styles.routeCol, styles.routeColEnd]}>
              <Text style={styles.routeLabel}>TO</Text>
              {transfer.destinationName !== undefined ? <Text style={styles.routeValue}>{transfer.destinationName}</Text> : null}
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.statusRow}>
            <StatusBadge label={transfer.statusLabel} tone={transfer.statusTone} />
          </View>
        </View>

        <SectionTitle>Transfer Information</SectionTitle>
        <InfoCard rows={infoRows} />

        <SectionTitle>Transfer Progress</SectionTitle>
        <View style={styles.card}>
          {steps.map((step, idx) => {
            const isLast = idx === steps.length - 1;
            const nextDone = steps[idx + 1]?.done === true;
            return (
              <View key={step.key} style={styles.stepRow}>
                <View style={styles.stepRail}>
                  <View style={[styles.stepDot, step.done ? styles.stepDotDone : styles.stepDotPending]}>
                    {step.done ? <CheckIcon size={11} /> : null}
                  </View>
                  {!isLast ? <View style={[styles.stepLine, step.done && nextDone && styles.stepLineDone]} /> : null}
                </View>
                <Text style={[styles.stepText, step.done && styles.stepTextDone]}>{step.label}</Text>
              </View>
            );
          })}
        </View>
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
    backgroundColor: adminColors.brand,
  },
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: Platform.OS === 'ios' ? adminSpacing.sm : adminSpacing.md,
    paddingBottom: adminSpacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: adminSpacing.md,
    padding: adminSpacing.xs,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xxl,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.md,
  },
  infoCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    ...adminShadow.sm,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.md,
  },
  gridCol: {
    flex: 1,
  },
  gridLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: adminSpacing.xs,
  },
  gridValBold: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  actionCardsRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginTop: adminSpacing.lg,
  },
  actionCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  actionCardText: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginTop: adminSpacing.sm,
  },
  trackingList: {
    paddingTop: adminSpacing.xs,
  },
  trackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
    marginBottom: adminSpacing.lg,
  },
  trackingText: {
    ...adminType.body,
  },
  trackingTextDone: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  trackingTextPending: {
    ...adminType.body,
    color: adminColors.muted,
  },
  discrepancyAlert: {
    marginTop: adminSpacing.lg,
    backgroundColor: adminColors.danger.bg,
    borderRadius: adminRadius.md,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.danger.border,
  },
  discrepancyAlertText: {
    ...adminType.rowTitle,
    color: adminColors.danger.text,
    lineHeight: 18,
  },
});
