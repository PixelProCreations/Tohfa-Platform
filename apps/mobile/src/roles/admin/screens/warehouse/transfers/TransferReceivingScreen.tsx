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
        <StatusBar barStyle="light-content" backgroundColor="#F0562A" />

        {/* Top Header Banner (Screenshot 2) */}
        <View style={mainStyles.header}>
          <View style={mainStyles.headerRow}>
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={mainStyles.backBtn}>
              <BackArrowIcon color="#FFFFFF" size={22} />
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
    backgroundColor: '#FAF5EF',
  },
  header: {
    backgroundColor: '#F0562A',
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  backBtn: {
    padding: 2,
    marginRight: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.95)',
    marginTop: 2,
    paddingLeft: 2,
  },
  scroll: {
    flex: 1,
    backgroundColor: '#FAF5EF',
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  kpiTile: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  kpiLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  kpiVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  sectionHeading: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 10,
    letterSpacing: -0.1,
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    paddingVertical: 6,
    paddingHorizontal: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableColHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.3,
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  tableValBold: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1F2937',
  },
  tableValNormal: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
  },
  arrivedBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  arrivedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
});
