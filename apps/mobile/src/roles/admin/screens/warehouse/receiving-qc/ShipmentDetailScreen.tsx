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

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
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

export interface ShipmentDetailScreenProps extends WarehouseScreenBaseProps {
  shipmentId: string | undefined;
  shipments?: IncomingShipment[] | undefined;
  /** Start Receiving (or resume one in progress); the host opens the wizard. */
  onStartReceiving: (shipment: IncomingShipment, resume: boolean) => void;
  /** Main: Product Summary "Detail" (wizard quantity verification). */
  onViewProductDetail?: ((shipment: IncomingShipment) => void) | undefined;
  /** Main: Receiving Progress "Timeline" (wizard receipt summary). */
  onViewTimeline?: ((shipment: IncomingShipment) => void) | undefined;
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

  return (
    <WalletScreen
      title={s.code}
      subtitle={`${s.status} · ${s.from} → ${s.to}`}
      onBack={onBack}
      headerExtra={<ScopeHeader scope={scope} label={warehouseLabel} />}
      footer={
        closed ? undefined : (
          <WalletFooter>
            {canRecord ? (
              <WalletButton
                label={resume ? 'Receiving in Progress' : 'Start Receiving'}
                icon={<RightArrowIcon size={18} />}
                onPress={() => onStartReceiving(s, resume)}
              />
            ) : (
              <PermissionNote message="Recording a goods receipt needs the goods receipt permission." />
            )}
          </WalletFooter>
        )
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.routeCard}>
          <View style={styles.flex}>
            <Text style={styles.routeTag}>SOURCE</Text>
            <Text style={styles.routeName}>{s.from}</Text>
          </View>
          <RightArrowIcon size={18} color={adminColors.muted} />
          <View style={[styles.flex, styles.alignEnd]}>
            <Text style={styles.routeTag}>DESTINATION</Text>
            <Text style={styles.routeName}>{warehouseNameOf(s.warehouseId)}</Text>
          </View>
        </View>

        <SectionTitle>Shipment Information</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Shipment ID', value: s.code },
              { label: 'Reference', value: s.reference },
            ],
            [
              { label: 'Type', value: s.type },
              { label: 'Batch / Source', value: s.batchSource },
            ],
            [
              { label: 'Dispatch Date', value: s.dispatchDate },
              { label: 'Expected Arrival', value: s.expectedArrival },
            ],
            [{ label: 'Actual Arrival', value: s.actualArrival ?? 'Pending' }],
          ]}
        />

        <SectionTitle
          right={
            mainView && canRecord && onViewProductDetail ? (
              <TouchableOpacity onPress={() => onViewProductDetail(s)} accessibilityRole="button">
                <Text style={styles.link}>Detail →</Text>
              </TouchableOpacity>
            ) : undefined
          }
        >
          Items
        </SectionTitle>
        <View style={styles.itemCard}>
          <View style={styles.flex}>
            <Text style={styles.itemTitle}>{s.produce}</Text>
            <Text style={styles.meta}>
              {s.grade}
              {s.crates !== undefined ? ` · ${s.crates} crates` : ''}
            </Text>
          </View>
          <Text style={styles.itemQty}>{s.expectedQty} KG</Text>
        </View>

        {mainView ? (
          <>
            <SectionTitle
              right={
                canRecord && onViewTimeline ? (
                  <TouchableOpacity onPress={() => onViewTimeline(s)} accessibilityRole="button">
                    <Text style={styles.link}>Timeline →</Text>
                  </TouchableOpacity>
                ) : undefined
              }
            >
              Receiving Progress
            </SectionTitle>
            <View style={styles.progressCard}>
              {RECEIVING_PIPELINE.map((stage, index) => {
                const complete = index < done;
                return (
                  <View key={stage} style={styles.progressRow}>
                    <View style={[styles.stepCircle, complete && styles.stepCircleDone]}>
                      {complete ? <StepperCheckIcon size={11} /> : <View style={styles.stepDash} />}
                    </View>
                    <Text style={complete ? styles.stepTextDone : styles.stepText}>{stage}</Text>
                  </View>
                );
              })}
            </View>
            <InfoNote tone="brandSoft">
              Shipment Documents only appears when the system actually supplies documents — none are invented as mandatory.
            </InfoNote>
          </>
        ) : null}
      </ScrollView>
    </WalletScreen>
  );
}

const STEP = 20;

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
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm },
  stepCircle: {
    width: STEP,
    height: STEP,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleDone: { backgroundColor: adminColors.success.text, borderColor: adminColors.success.text },
  stepDash: { width: 8, height: 2, backgroundColor: adminColors.muted },
  stepText: { ...adminType.body, color: adminColors.muted },
  stepTextDone: { ...adminType.sectionHead, color: adminColors.ink },
});
