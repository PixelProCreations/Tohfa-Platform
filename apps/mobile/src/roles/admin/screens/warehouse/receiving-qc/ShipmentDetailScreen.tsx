/**
 * Shipment Detail, shared by the Main and Sub warehouse admins.
 *
 * Extracted from the Sub shell's inline Receiving "shipment_detail" sub-view
 * (route card, shipment fields, items, Start Receiving / Receiving in
 * Progress) and absorbs the Main ShipmentDetailScreen: the shipment type, the
 * crate count, the Receiving Progress pipeline with its Product "Detail" and
 * "Timeline" links, and the shipment-documents note (Main-only,
 * scope.warehouseId undefined).
 *
 * Scope: a shipment of another warehouse resolves to "not found", never to a
 * forbidden state (CLAUDE.md 2.1). Gates: viewing needs inventory.batch.view
 * or inventory.goods_receipt.record; Start Receiving and the wizard links need
 * inventory.goods_receipt.record.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import { warehouseNameOf } from '../wallet-cashtopup/fixtures';
import {
  InfoCard,
  InfoNote,
  ScopeHeader,
  SectionTitle,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { RECEIVING_PIPELINE, findShipment, isMainScope, pipelineStagesDone } from './fixtures';
import { PermissionNote, RECEIVING_CODES, RightArrowIcon, StepperCheckIcon, canViewReceiving } from './ReceivingParts';
import type { IncomingShipment, WarehouseScreenBaseProps } from './types';

const SUB_PROGRESS_STAGES = [
  'Shipment Arrived',
  'Receiving Started',
  'Quantity Verification',
  'Quality Check',
  'Decision',
  'Storage Assignment',
  'Receipt Completion',
] as const;

export interface ShipmentDetailScreenProps extends WarehouseScreenBaseProps {
  shipmentId: string | undefined;
  shipments?: IncomingShipment[] | undefined;
  /** Start Receiving (or resume one in progress); the host opens the wizard. */
  onStartReceiving: (shipment: IncomingShipment, resume: boolean) => void;
  /** Main: Product Summary "Detail" (wizard quantity verification). */
  onViewProductDetail?: ((shipment: IncomingShipment) => void) | undefined;
  /** Main: Receiving Progress "Timeline" (wizard receipt summary). */
  onViewTimeline?: ((shipment: IncomingShipment) => void) | undefined;
  /** When a receiving progress stage is pressed. */
  onSelectStage?: ((stage: string, shipment: IncomingShipment) => void) | undefined;
}

export function ShipmentDetailScreen({
  scope,
  can,
  onBack,
  shipmentId,
  shipments,
  onStartReceiving,
  onViewProductDetail,
  onViewTimeline,
  onSelectStage,
}: ShipmentDetailScreenProps) {
  const mainView = isMainScope(scope);
  const canView = canViewReceiving(can);
  const canRecord = can(RECEIVING_CODES.receiptRecord);
  const s = findShipment(scope, shipmentId, shipments);
  const warehouseLabel = s ? warehouseNameOf(s.warehouseId) : scope.warehouseName;

  if (!canView || s === undefined) {
    return (
      <WalletScreen title="Shipment Detail" onBack={onBack} headerExtra={<ScopeHeader scope={scope} label={warehouseLabel} />}>
        <View style={walletLayout.scrollContent}>
          <PermissionNote message={!canView ? 'You do not have permission to view shipments.' : 'Shipment not found.'} />
        </View>
      </WalletScreen>
    );
  }

  const resume = s.status === 'Awaiting QC' || s.status === 'Receiving';
  const closed = s.status === 'Completed' || s.status === 'Rejected';
  const done = pipelineStagesDone(s.status);

  const isMain = mainView || can(RECEIVING_CODES.batchAssign) || can('inventory.batch.create');
  const stagesList = isMain ? RECEIVING_PIPELINE : SUB_PROGRESS_STAGES;

  const headerBadge = (
    <View style={styles.headerStatusBadge}>
      <Text style={styles.headerStatusBadgeText}>
        {s.status === 'Awaiting QC' ? 'Arrived' : s.status}
      </Text>
    </View>
  );

  return (
    <WalletScreen
      title={s.code}
      headerRight={headerBadge}
      headerExtra={<ScopeHeader scope={scope} />}
      onBack={onBack}
      footer={
        closed ? undefined : (
          <WalletFooter>
            {canRecord ? (
              <TouchableOpacity
                style={styles.startReceivingBtn}
                activeOpacity={0.85}
                onPress={() => onStartReceiving(s, resume)}
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
        {/* Source -> Destination Overview Card matching Image 2 */}
        <View style={styles.overviewCard}>
          <View style={styles.routeHeaderRow}>
            <View style={styles.routeHeaderCol}>
              <Text style={styles.routeHeaderLabel}>SOURCE</Text>
              <Text style={styles.routeHeaderValue}>{s.from}</Text>
            </View>
            <View style={styles.routeArrowCol}>
              <RightArrowIcon size={16} color={adminColors.brand} />
            </View>
            <View style={styles.routeHeaderCol}>
              <Text style={styles.routeHeaderLabel}>DESTINATION</Text>
              <Text style={styles.routeHeaderValue}>{s.to.includes('Warehouse') ? s.to : `${s.to} Warehouse`}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Shipment ID</Text>
              <Text style={styles.gridValue}>{s.code}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Reference</Text>
              <Text style={styles.gridValue}>{s.reference ?? 'PO-2026-0024'}</Text>
            </View>
          </View>

          <View style={[styles.gridRow, styles.gridRowGap]}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Dispatch Date</Text>
              <Text style={styles.gridValue}>{s.dispatchDate}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Expected Arrival</Text>
              <Text style={styles.gridValue}>{s.expectedArrival}</Text>
            </View>
          </View>

          <View style={[styles.gridRow, styles.gridRowGap]}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Actual Arrival</Text>
              <Text style={styles.gridValue}>{s.actualArrival ?? '24 Sep · 10:30 AM'}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Batch / Source</Text>
              <Text style={styles.gridValue}>{s.batchSource ?? 'Internal only'}</Text>
            </View>
          </View>
        </View>

        {/* Items Section matching Image 2 */}
        <SectionTitle>Items</SectionTitle>
        <View style={styles.itemCard}>
          <View style={styles.flex}>
            <Text style={styles.itemTitle}>{s.produce}</Text>
            <Text style={styles.meta}>{s.grade}</Text>
          </View>
          <Text style={styles.itemQty}>{s.expectedQty} KG</Text>
        </View>

        {/* Receiving Progress matching Image 2 */}
        <SectionTitle
          right={
            mainView && canRecord && onViewTimeline ? (
              <TouchableOpacity onPress={() => onViewTimeline(s)} accessibilityRole="button">
                <Text style={styles.link}>Timeline →</Text>
              </TouchableOpacity>
            ) : undefined
          }
        >
          Receiving Progress
        </SectionTitle>
        <View style={styles.progressCard}>
          {stagesList.map((stage, index) => {
            const complete = !isMain ? index === 0 : index < done;
            return (
              <TouchableOpacity
                key={stage}
                style={styles.progressRow}
                onPress={() => onSelectStage?.(stage, s)}
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
  headerStatusBadge: {
    backgroundColor: '#FFF4EE',
    borderRadius: adminRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  headerStatusBadgeText: {
    ...adminType.caption,
    color: adminColors.brand,
    fontWeight: '700',
  },
  overviewCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    marginBottom: 8,
    ...adminShadow.sm,
  },
  routeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  routeHeaderCol: {
    flex: 1,
  },
  routeHeaderLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  routeHeaderValue: {
    ...adminType.rowTitle,
    fontWeight: '800',
    color: adminColors.ink,
  },
  routeArrowCol: {
    paddingHorizontal: 12,
  },
  divider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: 14,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridRowGap: {
    marginTop: 12,
  },
  gridCol: {
    flex: 1,
  },
  gridLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 12,
    marginBottom: 2,
  },
  gridValue: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  link: { ...adminType.caption, color: adminColors.brand },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    ...adminShadow.sm,
  },
  itemTitle: { ...adminType.sectionHead, fontWeight: '800', color: adminColors.ink },
  meta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },
  itemQty: { ...adminType.sectionHead, fontWeight: '800', color: adminColors.ink },
  progressCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
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
    fontWeight: '700',
    color: adminColors.onBrand,
  },
});

