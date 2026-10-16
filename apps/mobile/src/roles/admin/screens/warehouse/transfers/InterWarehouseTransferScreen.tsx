/**
 * Inter-Warehouse Transfer: the transfer list (KPI counts, status chips,
 * transfer cards).
 *
 * Gate (FINAL_LIST 143): Shared. Main (all warehouses) sees every transfer;
 * Sub sees only transfers arriving at its own warehouse (destination =
 * scope.warehouseId), the ones it may receive. No `transfer.view` code exists
 * (SPEC_GAPS W4w-2). 'New Transfer' (header button and bottom action) and the
 * high-value policy note need `transfer.inter_warehouse.initiate` (MAIN all,
 * SUB none, BR-26).
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import { formatTransferThreshold } from '../../../config/businessThresholds';
import {
  ChipGroup,
  EmptyState,
  HeaderIconButton,
  InfoNote,
  KpiRow,
  ScopeHeader,
  SectionTitle,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { PlusIcon } from '../storage-ops/StorageParts';
import { TRANSFERS } from './fixtures';
import { TRANSFER_CODES, TransferRow, transferInScope } from './TransferParts';
import type { TransferItem, TransferStatus, WarehouseScreenBaseProps } from './types';

type FilterKey = 'All' | TransferStatus;

const FILTERS: readonly FilterKey[] = ['All', 'In Transit', 'Arrived', 'Pending SA Approval', 'Completed'];
const FILTER_LABEL: Record<FilterKey, string> = {
  All: 'All',
  'In Transit': 'In Transit',
  Arrived: 'Arrived',
  'Pending SA Approval': 'Pending Approval',
  Completed: 'Completed',
};

function BackArrowIcon({ color = adminColors.onBrand }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface InterWarehouseTransferScreenProps extends WarehouseScreenBaseProps {
  transfers?: readonly TransferItem[] | undefined;
  onNewTransfer?: (() => void) | undefined;
  onSelectTransfer?: ((transfer: TransferItem) => void) | undefined;
}

export function InterWarehouseTransferScreen({
  scope,
  can,
  onBack,
  transfers = TRANSFERS,
  onNewTransfer,
  onSelectTransfer,
}: InterWarehouseTransferScreenProps) {
  const isSub = scope.warehouseId !== undefined;
  const [filter, setFilter] = useState<FilterKey>('All');
  const [mainFilter, setMainFilter] = useState<'All' | 'In Transit' | 'Discrepancy'>('All');
  // Hidden without the code (BR-26); a host that passes no handler hides it too.
  const newTransfer = can(TRANSFER_CODES.initiate) ? onNewTransfer : undefined;

  const visible = useMemo(() => transfers.filter((t) => transferInScope(scope, t)), [transfers, scope]);
  const filtered = filter === 'All' ? visible : visible.filter((t) => t.status === filter);
  const count = (status: TransferStatus) => visible.filter((t) => t.status === status).length;

  if (!isSub) {
    return (
      <SafeAreaView style={mainStyles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={mainStyles.container}>
          {/* Header */}
          <View style={mainStyles.header}>
            <TouchableOpacity onPress={onBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={mainStyles.backBtn}>
              <BackArrowIcon color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={mainStyles.headerTitle}>Inter-Warehouse Transfer</Text>
          </View>

          {/* Chips */}
          <View style={mainStyles.chipsRow}>
            {(['All', 'In Transit', 'Discrepancy'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[mainStyles.chip, mainFilter === tab && mainStyles.activeChip]}
                onPress={() => setMainFilter(tab)}
                activeOpacity={0.7}
              >
                <Text style={[mainStyles.chipText, mainFilter === tab && mainStyles.activeChipText]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Content */}
          <ScrollView style={mainStyles.content} contentContainerStyle={mainStyles.scrollContent} showsVerticalScrollIndicator={false}>
            {mainFilter !== 'Discrepancy' && (
              <TouchableOpacity
                style={mainStyles.transferCard}
                activeOpacity={0.7}
                onPress={() => {
                  const item = visible.find((t) => t.code === 'TRF-00284') ?? visible[0] ?? {
                    id: '00284',
                    code: 'TRF-00284',
                    sourceWarehouseId: 'WH-COON',
                    destinationWarehouseId: 'WH-OOTY',
                    produce: 'Carrot G1',
                    quantityKg: 200,
                    status: 'In Transit',
                  };
                  if (onSelectTransfer) onSelectTransfer(item);
                }}
              >
                <View style={mainStyles.cardTopRow}>
                  <Text style={mainStyles.transferCode}>TRF-00284</Text>
                  <View style={mainStyles.statusBadge}>
                    <Text style={mainStyles.statusBadgeText}>In Transit</Text>
                  </View>
                </View>
                <Text style={mainStyles.transferRoute}>Coonoor → Ooty · 200 KG</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={mainStyles.footer}>
            <TouchableOpacity
              style={mainStyles.createBtn}
              activeOpacity={0.8}
              onPress={onNewTransfer}
            >
              <Text style={mainStyles.createBtnText}>+ Create Transfer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <WalletScreen
      title="Inter-Warehouse Transfer"
      subtitle={scope.warehouseId === undefined ? 'Rebalancing stock across locations' : 'Incoming transfers to your warehouse'}
      onBack={onBack}
      headerRight={
        newTransfer ? (
          <HeaderIconButton onPress={newTransfer} accessibilityLabel="Initiate new transfer">
            <PlusIcon size={18} />
          </HeaderIconButton>
        ) : undefined
      }
      headerExtra={<ScopeHeader scope={scope} />}
      footer={
        newTransfer ? (
          <WalletFooter>
            <WalletButton label="Initiate New Transfer" icon={<PlusIcon size={18} />} onPress={newTransfer} />
          </WalletFooter>
        ) : undefined
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <KpiRow
          items={[
            { value: String(count('In Transit')), label: 'IN TRANSIT', tone: 'info' },
            { value: String(count('Pending SA Approval')), label: 'PENDING APPROVAL', tone: 'warning' },
            { value: String(count('Completed')), label: 'COMPLETED', tone: 'success' },
          ]}
        />
        <ChipGroup options={FILTERS} value={filter} onChange={setFilter} labelOf={(f) => FILTER_LABEL[f]} />
        <SectionTitle>Transfers</SectionTitle>
        {filtered.length === 0 ? (
          <EmptyState title="No transfers" subtitle="No transfers in this status." />
        ) : (
          filtered.map((item) => (
            <TransferRow
              key={item.id}
              transfer={item}
              onPress={onSelectTransfer ? () => onSelectTransfer(item) : undefined}
            />
          ))
        )}
        {newTransfer ? (
          <InfoNote tone="brandSoft">
            Transfers of {formatTransferThreshold()} or more can&apos;t dispatch without Super Admin sign-off, consistent
            with dual approval on large actions.
          </InfoNote>
        ) : null}
      </ScrollView>
    </WalletScreen>
  );
}

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
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 12,
    padding: 2,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.3,
  },
  chipsRow: {
    flexDirection: 'row',
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.sm,
    gap: adminSpacing.sm,
  },
  chip: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
    borderRadius: adminRadius.sm,
  },
  activeChip: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  chipText: {
    ...adminType.rowMeta,
    fontWeight: '700',
    color: adminColors.ink,
  },
  activeChipText: {
    color: adminColors.onBrand,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.xl,
  },
  transferCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    ...adminShadow.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  transferCode: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  statusBadge: {
    backgroundColor: adminColors.info.bg,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 3,
    borderRadius: adminRadius.xs,
  },
  statusBadgeText: {
    color: adminColors.info.text,
    ...adminType.caption,
    fontWeight: '700',
  },
  transferRoute: {
    color: adminColors.muted,
    ...adminType.caption,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.xl,
    backgroundColor: adminColors.canvas,
  },
  createBtn: {
    backgroundColor: adminColors.brand,
    height: 48,
    borderRadius: adminRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...adminShadow.sm,
  },
  createBtnText: {
    color: adminColors.onBrand,
    ...adminType.rowTitle,
    fontWeight: '700',
  },
});

