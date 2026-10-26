/**
 * Transfer Receiving (design M2-16): inter-warehouse arrivals at the
 * destination, live (GET /warehouse-transfers): the counts and the incoming
 * list.
 *
 * Gate: the list needs `transfer.inter_warehouse.view` (SUB own). Sub sees only
 * transfers INBOUND to its own warehouse (BR-30); Main sees every warehouse's.
 * Start Inspection (the card tap and the bottom action) needs
 * `transfer.inter_warehouse.receive` on an IN_TRANSIT transfer whose
 * destination the scope covers (the server confines the receive to the
 * destination).
 *
 * Tiles: IN TRANSIT is the IN_TRANSIT total, COMPLETED the RECEIVED total and
 * QTY MISMATCH the RECEIVED transfers flagged hasDiscrepancy. The design's
 * ARRIVED, RECEIVING PENDING and QUALITY ISSUE tiles are not drawn: the API
 * has no arrival status (owner decision), "receiving pending" is the same
 * IN_TRANSIT figure, and a transfer receipt records no quality check. The
 * header route ('Coonoor ← Kotagiri') comes from the first arrival; the Sent
 * column from each transfer's lines (the list carries none), hidden until read.
 */
import React, { useMemo } from 'react';
import { Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { t } from '../../../i18n';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import { kgLabel } from '../receiving-qc/mappers';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import {
  EmptyState,
  KpiRow,
  PermissionNote,
  ScopeHeader,
  SectionTitle,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
  BackArrowIcon,
} from '../wallet-cashtopup/WalletParts';
import { LiveTransferRowCard, PlayCircleIcon, TRANSFER_CODES } from './TransferParts';
import { canReceiveTransfer, kpiCountLabel, mismatchTileLabel, receivingRouteSubtitle } from './transferReceiving';
import { useIncomingTransfers, useReceivedTransfers, useTransferNaming, useTransferSentTotals } from './useTransferReceiving';
import type { WarehouseScreenBaseProps } from './types';

export interface TransferReceivingScreenProps extends WarehouseScreenBaseProps {
  /** Open the inspection of a transfer (its uuid). */
  onStartTransferInspection?: ((transferId: string) => void) | undefined;
  /** Open a transfer's detail (its uuid). */
  onSelectTransfer?: ((transferId: string) => void) | undefined;
}

export function TransferReceivingScreen({
  scope,
  can,
  onBack,
  onStartTransferInspection,
  onSelectTransfer,
}: TransferReceivingScreenProps) {
  const isMain = scope.warehouseId === undefined;
  const naming = useTransferNaming(scope, can);
  const incoming = useIncomingTransfers(scope, can, naming);
  const received = useReceivedTransfers(scope, can);
  const incomingIds = useMemo(() => incoming.rows.map((row) => row.id), [incoming.rows]);
  const sentTotals = useTransferSentTotals(scope, incomingIds);
  const view = queryViewState({ isLoading: incoming.isLoading, error: incoming.error, itemCount: incoming.rows.length });
  const routeSubtitle = receivingRouteSubtitle(incoming.rows);

  const loadState =
    view === 'loading' ? (
      <AdminLoadingState />
    ) : view === 'error' ? (
      <AdminErrorState error={incoming.error} onRetry={incoming.refresh} />
    ) : null;

  if (isMain) {
    return (
      <View style={mainStyles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Top Header Banner (Screenshot 2) */}
        <View style={mainStyles.header}>
          <View style={mainStyles.headerRow}>
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={mainStyles.backBtn}>
              <BackArrowIcon color={adminColors.onBrand} size={22} />
            </TouchableOpacity>
            <Text style={mainStyles.headerTitle}>Transfer Receiving</Text>
          </View>
          {routeSubtitle !== undefined ? <Text style={mainStyles.headerSubtitle}>{routeSubtitle}</Text> : null}
        </View>

        <ScrollView style={mainStyles.scroll} contentContainerStyle={mainStyles.scrollPad} showsVerticalScrollIndicator={false}>
          {/* KPI Tiles (Screenshot 2); ARRIVED, RECEIVING PENDING and QUALITY ISSUE have no API (see the header) */}
          <View style={mainStyles.kpiGrid}>
            <View style={mainStyles.kpiTile}>
              <Text style={mainStyles.kpiLabel}>{t('transfers.receiving.tile.inTransit')}</Text>
              <Text style={mainStyles.kpiVal}>{kpiCountLabel(incoming.total)}</Text>
            </View>
            <View style={mainStyles.kpiTile}>
              <Text style={mainStyles.kpiLabel}>{t('transfers.receiving.tile.qtyMismatch')}</Text>
              <Text style={mainStyles.kpiVal}>{mismatchTileLabel(received.mismatch)}</Text>
            </View>
            <View style={mainStyles.kpiTile}>
              <Text style={mainStyles.kpiLabel}>{t('transfers.receiving.tile.completed')}</Text>
              <Text style={mainStyles.kpiVal}>{kpiCountLabel(received.completed)}</Text>
            </View>
          </View>

          {/* Section Heading */}
          <Text style={mainStyles.sectionHeading}>Incoming Transfer List (16-A)</Text>

          {/* Table Card */}
          <View style={mainStyles.tableCard}>
            <View style={mainStyles.tableHeaderRow}>
              <Text style={[mainStyles.tableColHeader, { flex: 1.2 }]}>TRANSFER</Text>
              <Text style={[mainStyles.tableColHeader, { flex: 1.2 }]}>SOURCE</Text>
              <Text style={[mainStyles.tableColHeader, { flex: 1 }]}>SENT</Text>
              <Text style={[mainStyles.tableColHeader, { flex: 1, textAlign: 'right' }]}>STATUS</Text>
            </View>
            {loadState}
            {view === 'empty' ? (
              <AdminEmptyState title={t('transfers.receiving.empty.title')} subtitle={t('transfers.receiving.empty.subtitle')} />
            ) : null}
            {view === 'ready'
              ? incoming.rows.map((row) => {
                  const sent = sentTotals.get(row.id);
                  return (
                    <TouchableOpacity
                      key={row.id}
                      style={mainStyles.tableDataRow}
                      activeOpacity={0.75}
                      onPress={() => (onSelectTransfer ? onSelectTransfer(row.id) : onStartTransferInspection?.(row.id))}
                    >
                      <Text style={[mainStyles.tableValBold, { flex: 1.2 }]}>{row.code}</Text>
                      <Text style={[mainStyles.tableValNormal, { flex: 1.2 }]}>{row.sourceName ?? ''}</Text>
                      <Text style={[mainStyles.tableValNormal, { flex: 1 }]}>{sent === undefined ? '' : kgLabel(sent)}</Text>
                      <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <View style={mainStyles.arrivedBadge}>
                          <Text style={mainStyles.arrivedBadgeText}>{row.statusLabel}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              : null}
          </View>
        </ScrollView>
      </View>
    );
  }
  const canReceive = can(TRANSFER_CODES.receive);
  const firstReceivable = incoming.rows.find((row) => canReceiveTransfer(scope, can, row));

  const start = canReceive ? onStartTransferInspection : undefined;

  return (
    <WalletScreen
      title={t('transfers.receiving.title')}
      subtitle={t('transfers.receiving.subtitle')}
      onBack={onBack}
      headerExtra={<ScopeHeader scope={scope} />}
      footer={
        start && firstReceivable ? (
          <WalletFooter>
            <WalletButton
              label={t('transfers.receiving.startInspection')}
              icon={<PlayCircleIcon />}
              onPress={() => start(firstReceivable.id)}
            />
          </WalletFooter>
        ) : !canReceive ? (
          <WalletFooter>
            <PermissionNote>Receiving a transfer needs transfer receive permission.</PermissionNote>
          </WalletFooter>
        ) : undefined
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ARRIVED is not drawn: the API has no arrival status (owner decision). */}
        <KpiRow items={[{ value: kpiCountLabel(incoming.total), label: t('transfers.receiving.tile.inTransit'), tone: 'info' }]} />
        <KpiRow
          items={[
            { value: kpiCountLabel(received.completed), label: t('transfers.receiving.tile.received'), tone: 'success' },
            { value: mismatchTileLabel(received.mismatch), label: t('transfers.receiving.tile.qtyMismatch'), tone: 'danger' },
          ]}
        />
        <SectionTitle>Incoming Transfer List</SectionTitle>
        {loadState}
        {view === 'empty' ? (
          <EmptyState title={t('transfers.receiving.empty.title')} subtitle={t('transfers.receiving.empty.subtitle')} />
        ) : null}
        {view === 'ready'
          ? incoming.rows.map((row) => (
              <LiveTransferRowCard
                key={row.id}
                transfer={row}
                sentGrams={sentTotals.get(row.id)}
                onPress={start && canReceiveTransfer(scope, can, row) ? () => start(row.id) : undefined}
              />
            ))
          : null}
      </ScrollView>
    </WalletScreen>
  );
}

const mainStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
    paddingBottom: adminSpacing.lg,
    paddingHorizontal: adminSpacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    marginBottom: 4,
  },
  backBtn: {
    padding: 2,
    marginRight: 4,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    ...adminType.caption,
    color: adminColors.onBrand,
    marginTop: 2,
    paddingLeft: 2,
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.lg,
  },
  kpiTile: {
    width: '48.5%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    ...adminShadow.sm,
  },
  kpiLabel: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.muted,
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  kpiVal: {
    ...adminType.kpiValue,
    color: adminColors.ink,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: 10,
    letterSpacing: -0.1,
  },
  tableCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 6,
    paddingHorizontal: adminSpacing.md,
    ...adminShadow.sm,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  tableColHeader: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.muted,
    letterSpacing: 0.3,
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  tableValBold: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  tableValNormal: {
    ...adminType.body,
    color: adminColors.muted,
  },
  arrivedBadge: {
    backgroundColor: adminColors.brandSoft.bg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: adminRadius.xs,
  },
  arrivedBadgeText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.brandSoft.text,
  },
});
