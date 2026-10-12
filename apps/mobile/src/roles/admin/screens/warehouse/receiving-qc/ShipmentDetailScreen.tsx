/**
 * Shipment Detail, shared by the Main and Sub warehouse admins.
 *
 * Extracted from the Sub shell's inline Receiving "shipment_detail" sub-view
 * (route card, shipment fields, items, Start Receiving / Receiving in
 * Progress) and absorbs the Main ShipmentDetailScreen. Live since integration
 * phase 4: one purchase order (GET /admin/purchase-orders/{id}) with its
 * farmer, price and receipts, fetched by ReceivingFlow.
 *
 * The footer starts a new receipt while the order is open (Expected / partly
 * received), or resumes the receipt awaiting its quality check, so a delivery
 * is never recorded twice. The Main-only stage pipeline and documents note are
 * gone: the API has no per-stage progress or shipment documents.
 *
 * Scope: an order of another warehouse is a 404, shown as "not found", never as
 * a forbidden state (CLAUDE.md 2.1). Gates: viewing needs inventory.batch.view
 * or inventory.goods_receipt.record; Start Receiving needs
 * inventory.goods_receipt.record, resuming also inventory.quality_check.perform.
 */
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { format } from '@tohfa/shared-types';

import { t } from '../../../i18n';
import { formatKg } from '../../../money/quantity';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import {
  InfoCard,
  ScopeHeader,
  SectionTitle,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { isReceivable } from './mappers';
import { PermissionNote, RECEIVING_CODES, RightArrowIcon, canViewReceiving } from './ReceivingParts';
import type { IncomingShipment, ReceivingLiveStateProps, WarehouseScreenBaseProps } from './types';

export interface ShipmentDetailScreenProps extends WarehouseScreenBaseProps, ReceivingLiveStateProps {
  /** The purchase order, once loaded. */
  shipment?: IncomingShipment | undefined;
  /** Start Receiving, or resume the receipt awaiting QC (`resume`); the host opens the wizard. */
  onStartReceiving: (shipment: IncomingShipment, resume: boolean) => void;
}

function kg(value: number | null): string {
  return value === null ? t('inventory.noValue') : formatKg(value);
}

function orNone(value: string): string {
  return value === '' ? t('inventory.noValue') : value;
}

export function ShipmentDetailScreen({
  scope,
  can,
  onBack,
  shipment: s,
  isLoading = false,
  error,
  onRetry,
  onRefresh,
  isRefreshing = false,
  onStartReceiving,
}: ShipmentDetailScreenProps) {
  const canView = canViewReceiving(can);
  const canRecord = can(RECEIVING_CODES.receiptRecord);
  const canQc = can(RECEIVING_CODES.qualityCheck);
  const header = { title: 'Shipment Detail', onBack, headerExtra: <ScopeHeader scope={scope} label={scope.warehouseName} /> };

  if (!canView) {
    return (
      <WalletScreen {...header}>
        <View style={walletLayout.scrollContent}>
          <PermissionNote message="You do not have permission to view shipments." />
        </View>
      </WalletScreen>
    );
  }
  if (s === undefined) {
    return (
      <WalletScreen {...header}>
        {isLoading ? <AdminLoadingState /> : <AdminErrorState error={error} onRetry={onRetry} />}
      </WalletScreen>
    );
  }

  const resume = s.status === 'Awaiting QC' && s.pendingReceiptId !== undefined;
  const canAct = resume ? canRecord && canQc : canRecord && isReceivable(s.status);
  const closed = !resume && !isReceivable(s.status);
  const unnamed = t('inventory.crop.unnamed');

  return (
    <WalletScreen
      title={s.code}
      subtitle={s.from !== '' ? `${s.statusLabel} · ${s.from} → ${s.to}` : s.statusLabel}
      onBack={onBack}
      headerExtra={<ScopeHeader scope={scope} label={s.to !== '' ? s.to : scope.warehouseName} />}
      footer={
        closed ? undefined : (
          <WalletFooter>
            {canAct ? (
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
      <ScrollView
        contentContainerStyle={walletLayout.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[adminColors.brand]} tintColor={adminColors.brand} />
          ) : undefined
        }
      >
        <View style={styles.routeCard}>
          <View style={styles.flex}>
            <Text style={styles.routeTag}>SOURCE</Text>
            <Text style={styles.routeName}>{orNone(s.from)}</Text>
          </View>
          <RightArrowIcon size={18} color={adminColors.muted} />
          <View style={[styles.flex, styles.alignEnd]}>
            <Text style={styles.routeTag}>DESTINATION</Text>
            <Text style={styles.routeName}>{orNone(s.to !== '' ? s.to : scope.warehouseName ?? '')}</Text>
          </View>
        </View>

        <SectionTitle>Shipment Information</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: t('receiving.detail.purchaseOrder'), value: s.code },
              { label: t('receiving.detail.farmerId'), value: orNone(s.farmerCode) },
            ],
            [
              { label: t('receiving.detail.issued'), value: orNone(s.issuedOn) },
              { label: 'Expected Arrival', value: orNone(s.expectedArrival) },
            ],
            [
              { label: t('receiving.detail.pricePerKg'), value: format(s.pricePerKg) },
              { label: t('receiving.detail.orderTotal'), value: format(s.totalAmount) },
            ],
          ]}
        />

        <SectionTitle>Items</SectionTitle>
        <View style={styles.itemCard}>
          <View style={styles.flex}>
            <Text style={styles.itemTitle}>{s.produce === unnamed && s.grade !== '' ? s.grade : s.produce}</Text>
            <Text style={styles.meta}>
              {[
                s.produce === unnamed ? '' : s.grade,
                s.receivedGrams !== null && s.receivedGrams > 0 ? t('receiving.detail.receivedSoFar', { qty: kg(s.receivedGrams) }) : '',
              ]
                .filter((part) => part !== '')
                .join(' · ')}
            </Text>
          </View>
          <Text style={styles.itemQty}>{kg(s.expectedGrams)}</Text>
        </View>
      </ScrollView>
    </WalletScreen>
  );
}

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
});
