/**
 * Shipment Detail (design M2-04), shared by the Main and Sub warehouse admins.
 *
 * Extracted from the Sub shell's inline Receiving "shipment_detail" sub-view
 * and absorbs the Main ShipmentDetailScreen. One purchase order (GET
 * /admin/purchase-orders/{id}) with its farmer, price and goods receipts,
 * fetched by ReceivingFlow. Three views, each its own route so hardware back
 * works (`view`):
 *   main      Shipment Information (Type, Actual Arrival = the first
 *             goodsReceipts[].receivedAt), Product Summary and the Receiving
 *             Progress (received against ordered grams, from the receipts)
 *   product   Shipment Product Detail (the order's crop, listed grade,
 *             quantities and price)
 *   timeline  Shipment Timeline: issuedAt, then each receipt's receivedAt
 * Everything is derived in receivingViews.ts. Type is "Farmer purchase order":
 * every row this screen opens is one (transfers are another flow).
 *
 * Not drawn: an Arrived stage (a purchase order has no arrival step, owner
 * decision), per-stage QC / decision / batch times (BR-106 records them in the
 * one quality check and the receipt does not carry its time), Packages and
 * Shipment Documents (the order carries neither).
 *
 * The footer starts a new receipt while the order is open (Expected / partly
 * received), or resumes the receipt awaiting its quality check, so a delivery
 * is never recorded twice.
 *
 * Scope: an order of another warehouse is a 404, shown as "not found", never as
 * a forbidden state (CLAUDE.md 2.1). Gates: viewing needs inventory.batch.view
 * or inventory.goods_receipt.record; Start Receiving needs
 * inventory.goods_receipt.record, resuming also inventory.quality_check.perform.
 */
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { format } from '@tohfa/shared-types';

import { t } from '../../../i18n';
import { formatKg } from '../../../money/quantity';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { formatAdminDate } from '../../../utils/datetime';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import {
  InfoCard,
  ScopeHeader,
  SectionTitle,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
  type InfoField,
} from '../wallet-cashtopup/WalletParts';
import { isReceivable } from './mappers';
import { PermissionNote, RECEIVING_CODES, RightArrowIcon, canViewReceiving } from './ReceivingParts';
import { actualArrivalOf, shipmentProgressOf, shipmentTimelineOf } from './receivingViews';
import type { IncomingShipment, ReceivingLiveStateProps, ReceivingRecord, WarehouseScreenBaseProps } from './types';

export type ShipmentDetailView = 'main' | 'product' | 'timeline';

export interface ShipmentDetailScreenProps extends WarehouseScreenBaseProps, ReceivingLiveStateProps {
  /** The purchase order, once loaded. */
  shipment?: IncomingShipment | undefined;
  /** Its goods receipts (from the order detail). */
  records?: readonly ReceivingRecord[] | undefined;
  /** Which view of the order to draw (default main). */
  view?: ShipmentDetailView | undefined;
  /** Opens the Shipment Product Detail view. */
  onOpenProduct?: (() => void) | undefined;
  /** Opens the Shipment Timeline view. */
  onOpenTimeline?: (() => void) | undefined;
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
  records = [],
  view = 'main',
  isLoading = false,
  error,
  onRetry,
  onRefresh,
  isRefreshing = false,
  onOpenProduct,
  onOpenTimeline,
  onStartReceiving,
}: ShipmentDetailScreenProps) {
  const canView = canViewReceiving(can);
  const canRecord = can(RECEIVING_CODES.receiptRecord);
  const canQc = can(RECEIVING_CODES.qualityCheck);
  const title = t(view === 'product' ? 'receiving.detail.productTitle' : view === 'timeline' ? 'receiving.detail.timelineTitle' : 'receiving.detail.title');
  const header = { title, onBack, headerExtra: <ScopeHeader scope={scope} label={scope.warehouseName} /> };

  if (!canView) {
    return (
      <WalletScreen {...header}>
        <View style={walletLayout.scrollContent}>
          <PermissionNote message={t('receiving.detail.noViewPermission')} />
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

  const now = new Date();
  const resume = s.status === 'Awaiting QC' && s.pendingReceiptId !== undefined;
  const canAct = resume ? canRecord && canQc : canRecord && isReceivable(s.status);
  const closed = !resume && !isReceivable(s.status);
  const destination = s.to !== '' ? s.to : scope.warehouseName ?? '';
  const productName = s.cropName ?? s.produce;
  const progress = shipmentProgressOf(s.expectedGrams, records);
  const arrival = actualArrivalOf(records);

  const subtitle = [s.code, s.statusLabel, s.from !== '' ? `${s.from} → ${destination}` : destination].filter((part) => part !== '').join(' · ');
  const refresh = onRefresh ? (
    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[adminColors.brand]} tintColor={adminColors.brand} />
  ) : undefined;
  const link = (label: string, onPress: (() => void) | undefined) =>
    onPress ? (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} accessibilityRole="button">
        <Text style={styles.link}>{label}</Text>
      </TouchableOpacity>
    ) : undefined;

  if (view === 'product') {
    const rows: InfoField[][] = [
      [
        { label: t('receiving.detail.crop'), value: productName },
        { label: t('receiving.detail.listedGrade'), value: orNone(s.grade) },
      ],
      [
        { label: t('receiving.detail.expectedQty'), value: kg(s.expectedGrams) },
        { label: t('receiving.detail.receivedQty'), value: kg(progress.receivedGrams) },
      ],
      [{ label: t('receiving.detail.pricePerKg'), value: format(s.pricePerKg) }],
    ];
    return (
      <WalletScreen title={title} subtitle={s.code} onBack={onBack} headerExtra={<ScopeHeader scope={scope} label={destination || undefined} />}>
        <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false} refreshControl={refresh}>
          <InfoCard rows={rows} />
        </ScrollView>
      </WalletScreen>
    );
  }

  if (view === 'timeline') {
    const events = shipmentTimelineOf(s.issuedAt, records);
    return (
      <WalletScreen title={title} subtitle={s.code} onBack={onBack} headerExtra={<ScopeHeader scope={scope} label={destination || undefined} />}>
        <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false} refreshControl={refresh}>
          <View style={styles.card}>
            {events.length === 0 ? <Text style={styles.meta}>{t('receiving.detail.timelineEmpty')}</Text> : null}
            {events.map((event, index) => (
              <View key={`${event.kind}-${event.at}-${index}`} style={[styles.timelineRow, index > 0 && styles.divider]}>
                <View style={styles.flex}>
                  <Text style={styles.rowTitle}>
                    {event.kind === 'issued' ? t('receiving.timeline.issued') : t('receiving.timeline.received', { grn: event.grn ?? '' })}
                  </Text>
                  {event.kind === 'received' && event.grossGrams !== undefined ? (
                    <Text style={styles.meta}>{t('receiving.timeline.receivedQty', { qty: kg(event.grossGrams) })}</Text>
                  ) : null}
                </View>
                <Text style={styles.meta}>{formatAdminDate(event.at, now)}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.meta}>{t('receiving.detail.timelineNote')}</Text>
        </ScrollView>
      </WalletScreen>
    );
  }

  const infoRows: InfoField[][] = [
    [
      { label: t('receiving.detail.purchaseOrder'), value: s.code },
      { label: t('receiving.detail.type'), value: t('receiving.detail.typePurchaseOrder') },
    ],
    [
      { label: t('receiving.detail.farmerId'), value: orNone(s.farmerCode) },
      { label: t('receiving.detail.issued'), value: orNone(s.issuedOn) },
    ],
    [
      { label: t('receiving.detail.expectedArrival'), value: orNone(s.expectedArrival) },
      // Actual Arrival exists only once a receipt was recorded; before that the row is not drawn.
      ...(arrival === undefined ? [] : [{ label: t('receiving.detail.actualArrival'), value: formatAdminDate(arrival, now) }]),
    ],
    [
      { label: t('receiving.detail.pricePerKg'), value: format(s.pricePerKg) },
      { label: t('receiving.detail.orderTotal'), value: format(s.totalAmount) },
    ],
  ];

  return (
    <WalletScreen
      title={title}
      subtitle={subtitle}
      onBack={onBack}
      headerExtra={<ScopeHeader scope={scope} label={destination || undefined} />}
      footer={
        closed ? undefined : (
          <WalletFooter>
            {canAct ? (
              <WalletButton
                label={t(resume ? 'receiving.detail.resumeReceiving' : 'receiving.dashboard.startReceiving')}
                icon={<RightArrowIcon size={18} />}
                onPress={() => onStartReceiving(s, resume)}
              />
            ) : (
              <PermissionNote message={t('receiving.dashboard.noRecordPermission')} />
            )}
          </WalletFooter>
        )
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false} refreshControl={refresh}>
        <View style={styles.routeCard}>
          <View style={styles.flex}>
            <Text style={styles.routeTag}>{t('receiving.detail.source')}</Text>
            <Text style={styles.routeName}>{orNone(s.from)}</Text>
          </View>
          <RightArrowIcon size={18} color={adminColors.muted} />
          <View style={[styles.flex, styles.alignEnd]}>
            <Text style={styles.routeTag}>{t('receiving.detail.destination')}</Text>
            <Text style={styles.routeName}>{orNone(destination)}</Text>
          </View>
        </View>

        <SectionTitle>{t('receiving.detail.info')}</SectionTitle>
        <InfoCard rows={infoRows} />

        <SectionTitle right={link(t('receiving.detail.detailLink'), onOpenProduct)}>{t('receiving.detail.productSummary')}</SectionTitle>
        <View style={styles.itemCard}>
          <View style={styles.flex}>
            <Text style={styles.itemTitle}>{productName}</Text>
            {s.grade !== '' ? <Text style={styles.meta}>{t('receiving.detail.listedGradeValue', { grade: s.grade })}</Text> : null}
          </View>
          <Text style={styles.itemQty}>{kg(s.expectedGrams)}</Text>
        </View>

        <SectionTitle right={link(t('receiving.detail.timelineLink'), onOpenTimeline)}>{t('receiving.detail.progress')}</SectionTitle>
        <View style={styles.card}>
          <Text style={styles.rowTitle}>
            {t('receiving.detail.progressLine', { received: kg(progress.receivedGrams), ordered: kg(progress.orderedGrams) })}
          </Text>
          {progress.percent !== null ? (
            <View style={styles.barTrack} accessibilityLabel={t('receiving.detail.progressPercent', { pct: String(progress.percent) })}>
              <View style={[styles.barFill, { width: `${progress.percent}%` }]} />
            </View>
          ) : null}
          <View style={styles.progressStats}>
            {progress.excessGrams !== null ? (
              <Text style={styles.meta}>{t('receiving.detail.excess', { qty: kg(progress.excessGrams) })}</Text>
            ) : progress.remainingGrams !== null ? (
              <Text style={styles.meta}>{t('receiving.detail.remaining', { qty: kg(progress.remainingGrams) })}</Text>
            ) : null}
            <Text style={styles.meta}>{t('receiving.detail.receiptCount', { count: String(progress.receiptCount) })}</Text>
          </View>
        </View>
      </ScrollView>
    </WalletScreen>
  );
}

const BAR_HEIGHT = 8;

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
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.sm,
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
  rowTitle: { ...adminType.rowTitle, color: adminColors.ink },
  meta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },
  itemQty: { ...adminType.kpiValue, color: adminColors.ink },
  link: { ...adminType.caption, color: adminColors.brand, fontWeight: '700' },
  barTrack: {
    height: BAR_HEIGHT,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.border,
    overflow: 'hidden',
    marginTop: adminSpacing.sm,
  },
  barFill: { height: BAR_HEIGHT, backgroundColor: adminColors.brand },
  progressStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: adminSpacing.xs },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: adminSpacing.md, paddingVertical: adminSpacing.sm },
  divider: { borderTopWidth: 1, borderTopColor: adminColors.border },
});
