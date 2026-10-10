/**
 * Receiving History list (FINAL_LIST #90), shared by the Main and Sub
 * warehouse admins.
 *
 * Extracted from the Sub shell's inline Receiving "receiving_history" sub-view
 * (search, result pills, received / accepted / rejected figures, date) and
 * absorbs the Main ReceivingHistoryScreen: the warehouse in each row, the
 * all-warehouses selector (Main-only, scope.warehouseId undefined) and the
 * "Return to Receiving Dashboard" link. Rows come from the shared receipt
 * records (RECEIVING_RECORDS) instead of two inline lists, and a row opens
 * ReceivingHistoryDetailScreen. The wizard's "View receiving history" opens
 * this list too.
 *
 * Read-only. Gate: inventory.batch.view or inventory.goods_receipt.record; a
 * Sub scope sees only its own warehouse (BR-30).
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { WALLET_WAREHOUSES } from '../wallet-cashtopup/fixtures';
import {
  ChipGroup,
  EmptyState,
  ScopeHeader,
  SearchBar,
  StatusBadge,
  WalletButton,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { RECEIVING_RECORDS, inReceivingScope, isMainScope, matchesHistoryFilter } from './fixtures';
import { PermissionNote, canViewReceiving, receiptTone } from './ReceivingParts';
import type { HistoryFilter, ReceivingRecord, WarehouseScreenBaseProps } from './types';

const FILTERS: readonly HistoryFilter[] = ['All', 'Accepted', 'Partial', 'Rejected'];

export interface ReceivingHistoryScreenProps extends WarehouseScreenBaseProps {
  records?: ReceivingRecord[] | undefined;
  initialFilter?: HistoryFilter | undefined;
  onSelectRecord: (receiptId: string) => void;
}

export function ReceivingHistoryScreen({
  scope,
  can,
  onBack,
  records = RECEIVING_RECORDS,
  initialFilter = 'All',
  onSelectRecord,
}: ReceivingHistoryScreenProps) {
  const [filter, setFilter] = useState<HistoryFilter>(initialFilter);
  const [query, setQuery] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);
  const mainView = isMainScope(scope);

  const header = {
    title: 'Receiving History',
    onBack,
    headerExtra: (
      <ScopeHeader
        scope={scope}
        label={mainView ? undefined : scope.warehouseName ?? scope.warehouseId}
        warehouseOptions={WALLET_WAREHOUSES}
        selectedWarehouseId={selectedWarehouseId}
        onSelectWarehouse={mainView ? setSelectedWarehouseId : undefined}
      />
    ),
  };

  if (!canViewReceiving(can)) {
    return (
      <WalletScreen {...header}>
        <View style={walletLayout.scrollContent}>
          <PermissionNote message="You do not have permission to view goods receipts." />
        </View>
      </WalletScreen>
    );
  }

  const q = query.trim().toLowerCase();
  const rows = records.filter(
    (r) =>
      inReceivingScope(scope, r.warehouseId, selectedWarehouseId) &&
      matchesHistoryFilter(r.result, filter) &&
      (q === '' || r.receiptId.toLowerCase().includes(q) || r.product.toLowerCase().includes(q)),
  );

  return (
    <WalletScreen {...header}>
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search GR number / product" />
        <View style={styles.pills}>
          <ChipGroup options={FILTERS} value={filter} onChange={setFilter} />
        </View>

        {rows.length === 0 ? <EmptyState title="No receipts" subtitle="Nothing matches this filter." /> : null}

        {rows.map((r) => (
          <TouchableOpacity
            key={r.receiptId}
            style={styles.card}
            onPress={() => onSelectRecord(r.receiptId)}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <View style={styles.rowBetween}>
              <Text style={styles.code}>{r.receiptId}</Text>
              <StatusBadge label={r.result} tone={receiptTone(r.result)} />
            </View>
            <Text style={styles.produce}>
              {r.product} · {r.grade}
            </Text>
            <View style={styles.stats}>
              {(
                [
                  ['Received', r.receivedKg],
                  ['Accepted', r.acceptedKg],
                  ['Rejected', r.rejectedKg],
                ] as const
              ).map(([label, kg]) => (
                <View key={label} style={styles.statCol}>
                  <Text style={styles.meta}>{label}</Text>
                  <Text style={styles.statValue}>{kg} KG</Text>
                </View>
              ))}
            </View>
            <Text style={styles.meta}>
              {mainView ? `${r.warehouseName} · ` : ''}
              {r.date}
            </Text>
          </TouchableOpacity>
        ))}

        <View style={styles.spacer} />
        <WalletButton label="Return to Receiving Dashboard →" variant="outline" onPress={onBack} />
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  pills: { paddingVertical: adminSpacing.sm },
  spacer: { height: adminSpacing.sm },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  code: { ...adminType.rowTitle, color: adminColors.ink },
  produce: { ...adminType.sectionHead, color: adminColors.ink, marginTop: adminSpacing.xs },
  meta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },
  stats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    marginVertical: adminSpacing.sm,
    paddingTop: adminSpacing.sm,
  },
  statCol: { flex: 1 },
  statValue: { ...adminType.rowTitle, color: adminColors.ink, marginTop: 2 },
});
