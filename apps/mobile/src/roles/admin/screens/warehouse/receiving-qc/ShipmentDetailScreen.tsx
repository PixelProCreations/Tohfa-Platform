/**
 * Shipment Detail, shared by the Main and Sub warehouse admins.
 *
 * Scope: a shipment of another warehouse resolves to "not found", never to a
 * forbidden state (CLAUDE.md 2.1). Gates: viewing needs inventory.batch.view
 * or inventory.goods_receipt.record; Start Receiving and the wizard links need
 * inventory.goods_receipt.record.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import { warehouseNameOf } from '../wallet-cashtopup/fixtures';
import {
  WalletFooter,
  WalletScreen,
} from '../wallet-cashtopup/WalletParts';
import { RECEIVING_PIPELINE, findShipment, pipelineStagesDone, receivingPipelineFor } from './fixtures';
import { PermissionNote, RECEIVING_CODES, canViewReceiving } from './ReceivingParts';
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

function ProgressCheckIcon({ size = 26 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Circle cx="14" cy="14" r="14" fill="#E57B36" />
      <Path
        d="M8.5 14.5l3.5 3.5 7.5-7.5"
        stroke="#FFFFFF"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ProgressPendingCircle({ size = 26 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Circle cx="14" cy="14" r="14" fill="#E2DDD5" />
      <Circle cx="14" cy="14" r="3.5" stroke="#7E8B83" strokeWidth="1.6" fill="none" />
    </Svg>
  );
}

function PlayCircleIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="2" />
      <Path d="M10 8.5l6 3.5-6 3.5V8.5z" fill={color} />
    </Svg>
  );
}

export function ShipmentDetailScreen({
  scope,
  can,
  onBack,
  shipmentId,
  shipments,
  onStartReceiving,
  onViewTimeline,
}: ShipmentDetailScreenProps) {
  const canView = canViewReceiving(can);
  const canRecord = can(RECEIVING_CODES.receiptRecord);
  const s = findShipment(scope, shipmentId, shipments);

  if (!canView || s === undefined) {
    return (
      <WalletScreen title="Shipment Detail" onBack={onBack}>
        <View style={styles.scrollContent}>
          <PermissionNote message={!canView ? 'You do not have permission to view shipments.' : 'Shipment not found.'} />
        </View>
      </WalletScreen>
    );
  }

  const resume = s.status === 'Awaiting QC' || s.status === 'Receiving';
  const closed = s.status === 'Completed' || s.status === 'Rejected';
  const pipeline = receivingPipelineFor(scope);
  const done = pipelineStagesDone(s.status, scope);

  return (
    <WalletScreen
      title="Shipment Detail"
      subtitle={`${s.code} · ${s.status} · ${s.from} → ${s.to}`}
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
                <PlayCircleIcon size={22} color="#FFFFFF" />
                <Text style={styles.startReceivingBtnText}>
                  {resume ? 'Receiving in Progress' : 'Start Receiving'}
                </Text>
              </TouchableOpacity>
            ) : (
              <PermissionNote message="Recording a goods receipt needs the goods receipt permission." />
            )}
          </WalletFooter>
        )
      }
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Shipment Information Section */}
        <Text style={styles.sectionTitle}>Shipment Information</Text>
        <View style={styles.card}>
          <View style={styles.metaRow}>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Shipment ID</Text>
              <Text style={styles.metaVal}>{s.code}</Text>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Type</Text>
              <Text style={styles.metaVal}>
                {s.type.includes('Consolidated') ? s.type : `${s.type}\nConsolidated`}
              </Text>
            </View>
          </View>

          <View style={[styles.metaRow, { marginTop: adminSpacing.md }]}>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Source</Text>
              <Text style={styles.metaVal}>{s.from}</Text>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Destination</Text>
              <Text style={styles.metaVal}>{s.to ?? warehouseNameOf(s.warehouseId)}</Text>
            </View>
          </View>

          <View style={[styles.metaRow, { marginTop: adminSpacing.md }]}>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Created Date</Text>
              <Text style={styles.metaVal}>{s.dispatchDate}</Text>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Actual Arrival</Text>
              <Text style={styles.metaVal}>
                {s.actualArrival ? s.actualArrival.replace(/\s*·\s*/, ', ') : 'Pending'}
              </Text>
            </View>
          </View>
        </View>

        {/* Product Summary Section */}
        <Text style={styles.sectionTitle}>Product Summary</Text>
        <View style={styles.card}>
          <Text style={styles.productName}>{s.produce}</Text>
          <Text style={styles.productMeta}>
            {`${s.expectedQty} KG · ${s.grade}${s.crates !== undefined ? ` · ${s.crates} crates` : ''}`}
          </Text>
        </View>

        {/* Receiving Progress Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Receiving Progress</Text>
          {onViewTimeline ? (
            <TouchableOpacity onPress={() => onViewTimeline(s)} activeOpacity={0.7}>
              <Text style={styles.timelineLink}>Timeline →</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.card}>
          {pipeline.map((stage, index) => {
            const complete = index < done;
            return (
              <View
                key={stage}
                style={[
                  styles.progressRow,
                  index < pipeline.length - 1 && styles.progressRowSpacing,
                ]}
              >
                {complete ? <ProgressCheckIcon size={26} /> : <ProgressPendingCircle size={26} />}
                <Text style={complete ? styles.stageTextComplete : styles.stageTextPending}>
                  {stage}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: adminSpacing.md,
    paddingBottom: adminSpacing.xxl,
  },
  sectionTitle: {
    ...adminType.sectionHead,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.sm,
  },
  timelineLink: {
    ...adminType.caption,
    fontSize: 13.5,
    fontWeight: '700',
    color: adminColors.brand,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    ...adminType.caption,
    fontSize: 13,
    fontWeight: '500',
    color: adminColors.muted,
    marginBottom: 4,
  },
  metaVal: {
    ...adminType.rowTitle,
    fontSize: 15.5,
    fontWeight: '800',
    color: adminColors.ink,
    lineHeight: 20,
  },
  productName: {
    ...adminType.rowTitle,
    fontSize: 15.5,
    fontWeight: '800',
    color: adminColors.ink,
  },
  productMeta: {
    ...adminType.rowTitle,
    fontSize: 15.5,
    fontWeight: '800',
    color: adminColors.ink,
    marginTop: 4,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
  },
  progressRowSpacing: {
    marginBottom: 16,
  },
  stageTextComplete: {
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.ink,
  },
  stageTextPending: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#55655D',
  },
  startReceivingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.sm,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.lg,
    height: 52,
    width: '100%',
  },
  startReceivingBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
});
