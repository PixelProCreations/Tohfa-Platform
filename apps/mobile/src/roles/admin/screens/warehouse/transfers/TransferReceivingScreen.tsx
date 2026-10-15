/**
 * Transfer Receiving: inter-warehouse arrivals at the destination (counts and
 * the incoming list).
 *
 * Gate (FINAL_LIST 145): Shared. Sub sees only arrivals whose destination is
 * its own warehouse; Main sees every warehouse's. Start Inspection (the card
 * tap and the bottom action) needs `transfer.inter_warehouse.receive` (all).
 * The header no longer names 'Coonoor ← Kotagiri': routes come from the rows.
 */
import React, { useMemo } from 'react';
import { Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
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
import { TRANSFERS } from './fixtures';
import { PlayCircleIcon, TRANSFER_CODES, TransferRow, transferInScope } from './TransferParts';
import type { TransferItem, WarehouseScreenBaseProps } from './types';

export interface TransferReceivingScreenProps extends WarehouseScreenBaseProps {
  transfers?: readonly TransferItem[] | undefined;
  onStartTransferInspection?: ((transferId: string) => void) | undefined;
  onSelectTransfer?: ((transferId: string) => void) | undefined;
}

export function TransferReceivingScreen({
  scope,
  can,
  onBack,
  transfers = TRANSFERS,
  onStartTransferInspection,
  onSelectTransfer,
}: TransferReceivingScreenProps) {
  const isMain = scope.warehouseId === undefined;

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
          <Text style={mainStyles.headerSubtitle}>Coonoor ← Kotagiri, and other inter-warehouse arrivals</Text>
        </View>

        <ScrollView style={mainStyles.scroll} contentContainerStyle={mainStyles.scrollPad} showsVerticalScrollIndicator={false}>
          {/* 6 KPI Tiles (Screenshot 2) */}
          <View style={mainStyles.kpiGrid}>
            <View style={mainStyles.kpiTile}>
              <Text style={mainStyles.kpiLabel}>IN TRANSIT</Text>
              <Text style={mainStyles.kpiVal}>2</Text>
            </View>
            <View style={mainStyles.kpiTile}>
              <Text style={mainStyles.kpiLabel}>ARRIVED</Text>
              <Text style={mainStyles.kpiVal}>1</Text>
            </View>
            <View style={mainStyles.kpiTile}>
              <Text style={mainStyles.kpiLabel}>RECEIVING PENDING</Text>
              <Text style={mainStyles.kpiVal}>1</Text>
            </View>
            <View style={mainStyles.kpiTile}>
              <Text style={mainStyles.kpiLabel}>QTY MISMATCH</Text>
              <Text style={mainStyles.kpiVal}>1</Text>
            </View>
            <View style={mainStyles.kpiTile}>
              <Text style={mainStyles.kpiLabel}>QUALITY ISSUE</Text>
              <Text style={mainStyles.kpiVal}>0</Text>
            </View>
            <View style={mainStyles.kpiTile}>
              <Text style={mainStyles.kpiLabel}>COMPLETED</Text>
              <Text style={mainStyles.kpiVal}>4</Text>
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
            <TouchableOpacity
              style={mainStyles.tableDataRow}
              activeOpacity={0.75}
              onPress={() => (onSelectTransfer ? onSelectTransfer('00284') : onStartTransferInspection?.('00284'))}
            >
              <Text style={[mainStyles.tableValBold, { flex: 1.2 }]}>TRF-00284</Text>
              <Text style={[mainStyles.tableValNormal, { flex: 1.2 }]}>Kotagiri</Text>
              <Text style={[mainStyles.tableValNormal, { flex: 1 }]}>200 KG</Text>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <View style={mainStyles.arrivedBadge}>
                  <Text style={mainStyles.arrivedBadgeText}>Arrived</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }
  const canReceive = can(TRANSFER_CODES.receive);
  const incoming = useMemo(
    () => transfers.filter((t) => transferInScope(scope, t) && t.status !== 'Pending SA Approval'),
    [transfers, scope],
  );
  const awaiting = incoming.filter((t) => t.status === 'In Transit' || t.status === 'Arrived');
  const firstArrived = incoming.find((t) => t.status === 'Arrived');
  const count = (pred: (t: TransferItem) => boolean) => String(incoming.filter(pred).length);

  const start = canReceive ? onStartTransferInspection : undefined;

  return (
    <WalletScreen
      title="Transfer Receiving"
      subtitle="Inter-warehouse arrivals"
      onBack={onBack}
      headerExtra={<ScopeHeader scope={scope} />}
      footer={
        start && firstArrived ? (
          <WalletFooter>
            <WalletButton label="Start Inspection" icon={<PlayCircleIcon />} onPress={() => start(firstArrived.id)} />
          </WalletFooter>
        ) : !canReceive ? (
          <WalletFooter>
            <PermissionNote>Receiving a transfer needs transfer receive permission.</PermissionNote>
          </WalletFooter>
        ) : undefined
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <KpiRow
          items={[
            { value: count((t) => t.status === 'In Transit'), label: 'IN TRANSIT', tone: 'info' },
            { value: count((t) => t.status === 'Arrived'), label: 'ARRIVED', tone: 'brandSoft' },
          ]}
        />
        <KpiRow
          items={[
            { value: count((t) => t.status === 'Completed'), label: 'RECEIVED', tone: 'success' },
            { value: count((t) => t.qtyMismatch === true), label: 'QTY MISMATCH', tone: 'danger' },
          ]}
        />
        <SectionTitle>Incoming Transfer List</SectionTitle>
        {awaiting.length === 0 ? (
          <EmptyState title="No incoming transfers" subtitle="Nothing is in transit to this warehouse." />
        ) : (
          awaiting.map((t) => (
            <TransferRow
              key={t.id}
              transfer={t}
              onPress={start && t.status === 'Arrived' ? () => start(t.id) : undefined}
            />
          ))
        )}
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
