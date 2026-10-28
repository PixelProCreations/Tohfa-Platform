/**
 * Shipment Detail (design M2-04), shared by the Main and Sub warehouse admins.
 *
 * Extracted from the Sub shell's inline Receiving "shipment_detail" sub-view
 * and absorbs the Main ShipmentDetailScreen (the Receiving Progress pipeline
 * and its "Timeline" link, Main-only: scope.warehouseId undefined).
 *
 * Live data: the purchase order with its receipts (usePurchaseOrder) and the
 * newest receipt's full read (useReceipt: its packages and batch). Shipment
 * Information, Product Summary and the progress marks show only what those
 * reads carry; the Actual Arrival is the first receipt (no arrival status,
 * owner decision) and is hidden before one. A progress stage is marked done
 * only when the API proves it (progressStagesDone); Storage Assignment never
 * is (the location is not on any read).
 *
 * Scope: an order of another warehouse answers 404 and resolves to "not
 * found", never to a forbidden state (CLAUDE.md 2.1). Gates: viewing needs
 * inventory.batch.view or inventory.goods_receipt.record; Start Receiving
 * needs inventory.goods_receipt.record, and shows only for an order that can
 * still be received or has a receipt awaiting its quality check (resumed).
 */
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { t } from '../../../i18n';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import { formatAdminDate } from '../../../utils/datetime';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import {
  InfoCard,
  ScopeHeader,
  SectionTitle,
  WalletFooter,
  WalletScreen,
  walletLayout,
  type InfoField,
} from '../wallet-cashtopup/WalletParts';
import { PermissionNote, RECEIVING_CODES, RightArrowIcon, StepperCheckIcon, canViewReceiving } from './ReceivingParts';
import type { LiveShipment } from './liveTypes';
import { isMainScope, isReceivable, kgLabel, receivingWarehouseFilter } from './mappers';
import { MAIN_PROGRESS_STAGES, SUB_PROGRESS_STAGES, isNotFoundError, progressStagesDone } from './receivingLists';
import type { StageContext } from './receivingNav';
import { shipmentTimelineOf } from './receivingViews';
import { usePurchaseOrder, useReceipt, useReceivingNaming } from './useReceivingData';
import type { WarehouseScreenBaseProps } from './types';

export interface ShipmentDetailScreenProps extends WarehouseScreenBaseProps {
  /** The purchase order (uuid). */
  shipmentId: string | undefined;
  /** Start Receiving, or resume the receipt awaiting QC (its uuid); the host opens the wizard. */
  onStartReceiving: (shipment: LiveShipment, resumeReceiptId: string | undefined) => void;
  /** Main: Receiving Progress "Timeline" (the newest receipt's detail, by uuid). */
  onViewTimeline?: ((receiptId: string) => void) | undefined;
  /** When a receiving progress stage is pressed. */
  onSelectStage?: ((stage: string, context: StageContext) => void) | undefined;
}

/** Drops a field the API did not carry (WIRE rule: hide, never a placeholder). */
function known(fields: InfoField[]): InfoField[] {
  return fields.filter((f) => f.value !== '');
}

export function ShipmentDetailScreen({
  scope,
  can,
  onBack,
  shipmentId,
  onStartReceiving,
  onViewTimeline,
  onSelectStage,
}: ShipmentDetailScreenProps) {
  const mainView = isMainScope(scope);
  const canView = canViewReceiving(can);
  const canRecord = can(RECEIVING_CODES.receiptRecord);

  const naming = useReceivingNaming(scope, can);
  const warehouseId = receivingWarehouseFilter(scope, undefined);
  const order = usePurchaseOrder(warehouseId, canView ? shipmentId : undefined, naming.naming);
  // Newest first: its full read carries the packages and the batch the nested rows lack.
  const newest = order.records[0];
  const newestRead = useReceipt(warehouseId, newest?.id, naming.naming);
  const s = order.shipment;
  const now = useMemo(() => new Date(), [order.detail]);
  const arrivedAt = useMemo(() => shipmentTimelineOf(s?.issuedAt, order.records).find((e) => e.kind === 'received')?.at, [s, order.records]);
  const warehouseLabel = s !== undefined && s.to !== '' ? s.to : scope.warehouseName;

  const notFound = s === undefined && (shipmentId === undefined || isNotFoundError(order.error));
  if (canView && !notFound && s === undefined) {
    return (
      <WalletScreen title="Shipment Detail" onBack={onBack} headerExtra={<ScopeHeader scope={scope} label={warehouseLabel} />}>
        {order.isLoading ? <AdminLoadingState /> : <AdminErrorState error={order.error} onRetry={order.refresh} />}
      </WalletScreen>
    );
  }

  if (!canView || s === undefined) {
    return (
      <WalletScreen title="Shipment Detail" onBack={onBack} headerExtra={<ScopeHeader scope={scope} label={warehouseLabel} />}>
        <View style={walletLayout.scrollContent}>
          <PermissionNote message={!canView ? 'You do not have permission to view shipments.' : 'Shipment not found.'} />
        </View>
      </WalletScreen>
    );
  }

  // A pending receipt is resumed (never received twice); a closed order offers nothing.
  const startable = isReceivable(s.status) || s.pendingReceiptId !== undefined;
  const newestReceipt = newestRead.receipt ?? newest;
  const stageContext: StageContext = {
    purchaseOrderId: s.id,
    receivable: isReceivable(s.status),
    pendingReceiptId: s.pendingReceiptId,
    newestReceiptId: newest?.id,
  };

  const headerTitle = 'Shipment Detail';
  const route = [s.from, s.to].filter((p) => p !== '').join(' → ');
  const headerSubtitle = [s.code, s.statusLabel, route].filter((p) => p !== '').join(' · ');

  const isMain = mainView || can(RECEIVING_CODES.batchAssign) || can('inventory.batch.create');
  const stagesList = isMain ? MAIN_PROGRESS_STAGES : SUB_PROGRESS_STAGES;
  const done = progressStagesDone(stagesList, newestReceipt);
  const packages = newestRead.receipt?.packages;
  const productDetails = [s.expectedGrams === null ? '' : kgLabel(s.expectedGrams), s.grade, packages?.label ?? ''].filter((p) => p !== '');
  const infoRows = [
    known([
      { label: t('receiving.shipment.shipmentId'), value: s.code },
      { label: t('receiving.shipment.type'), value: s.type === 'Farmer/Admin' ? t('receiving.shipment.typeFarmerAdmin') : t('receiving.shipment.typeTransfer') },
    ]),
    known([
      { label: t('receiving.shipment.source'), value: s.from },
      { label: t('receiving.shipment.destination'), value: s.to },
    ]),
    known([
      { label: t('receiving.shipment.createdDate'), value: s.issuedOn },
      { label: t('receiving.shipment.actualArrival'), value: arrivedAt === undefined ? '' : formatAdminDate(arrivedAt, now) },
    ]),
  ].filter((row) => row.length > 0);

  return (
    <WalletScreen
      title={headerTitle}
      subtitle={headerSubtitle}
      onBack={onBack}
      footer={
        !startable ? undefined : (
          <WalletFooter>
            {canRecord ? (
              <TouchableOpacity
                style={styles.startReceivingBtn}
                activeOpacity={0.85}
                onPress={() => onStartReceiving(s, s.pendingReceiptId)}
              >
                <View style={styles.playCircleIcon}>
                  <RightArrowIcon size={14} color={adminColors.brand} />
                </View>
                <Text style={styles.startReceivingBtnText}>Start Receiving</Text>
              </TouchableOpacity>
            ) : (
              <PermissionNote message="Recording a goods receipt needs the goods receipt permission." />
            )}
          </WalletFooter>
        )
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <SectionTitle>Shipment Information</SectionTitle>
        <InfoCard rows={infoRows} />

        <SectionTitle>Product Summary</SectionTitle>
        <View style={styles.productSummaryCard}>
          <Text style={styles.productNameText}>{s.produce}</Text>
          {productDetails.length > 0 ? <Text style={styles.productDetailsText}>{productDetails.join(' · ')}</Text> : null}
        </View>

        <SectionTitle
          right={
            mainView && onViewTimeline && newest !== undefined ? (
              <TouchableOpacity onPress={() => onViewTimeline(newest.id)} accessibilityRole="button">
                <Text style={styles.link}>{t('receiving.shipment.timelineLink')}</Text>
              </TouchableOpacity>
            ) : undefined
          }
        >
          Receiving Progress
        </SectionTitle>
        <View style={styles.progressCard}>
          {stagesList.map((stage, index) => {
            const complete = done[index] === true;
            return (
              <TouchableOpacity
                key={stage}
                style={styles.progressRow}
                onPress={() => onSelectStage?.(stage, stageContext)}
                activeOpacity={0.7}
              >
                <View style={[styles.stepCircle, complete && styles.stepCircleDone]}>
                  {complete ? (
                    <StepperCheckIcon size={11} color={adminColors.onBrand} />
                  ) : (
                    <View style={styles.stepDash} />
                  )}
                </View>
                <Text style={complete ? styles.stepTextDone : styles.stepText}>{stage}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </WalletScreen>
  );
}

const STEP = 22;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  alignEnd: { alignItems: 'flex-end' },
  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginTop: adminSpacing.sm,
  },
  routeTag: { ...adminType.caption, color: adminColors.muted },
  routeName: { ...adminType.rowTitle, color: adminColors.ink, marginTop: 2 },
  link: { ...adminType.caption, color: adminColors.brand },
  productSummaryCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    gap: 4,
  },
  productNameText: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  productDetailsText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
  },
  itemTitle: { ...adminType.sectionHead, color: adminColors.ink },
  meta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },
  itemQty: { ...adminType.kpiValue, color: adminColors.ink },
  progressCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
    marginBottom: adminSpacing.md,
  },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepCircle: {
    width: STEP,
    height: STEP,
    borderRadius: adminRadius.full,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    backgroundColor: adminColors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleDone: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  stepDash: { width: 6, height: 2, backgroundColor: adminColors.muted },
  stepText: { ...adminType.caption, color: adminColors.muted },
  stepTextDone: { ...adminType.rowTitle, color: adminColors.ink },
  startReceivingBtn: {
    height: ADMIN_BUTTON_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: adminColors.brand,
    borderRadius: 14,
    ...adminShadow.sm,
  },
  playCircleIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: adminColors.onBrand,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
  },
  startReceivingBtnText: {
    ...adminType.sectionHead,
    color: adminColors.onBrand,
  },
});

