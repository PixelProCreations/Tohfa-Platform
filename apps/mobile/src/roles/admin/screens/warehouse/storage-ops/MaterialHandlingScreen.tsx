/**
 * Material Handling: the warehouse materials list (packaging, crates, labels).
 *
 * Gate (FINAL_LIST 131): viewing has no code of its own; Add Material and the
 * Receive / Issue actions need `inventory.material_handling.manage` (MAIN all,
 * SUB own). Without it the screen is read-only and says so.
 *
 * Absorbs Main MaterialHandlingScreen (pair M4-S05): the Material Actions row
 * (Receive / Issue / History) and the Warehouse field on each card for the Main
 * view. Main's Receive and Issue jumped to a hard-coded MAT-0021; here Receive
 * opens the Add Material form (it records received stock) and Issue opens the
 * first material in view, where Issue is confirmed. History hands off to the
 * host (warehouse activity, storage-ops part B).
 *
 * Scope: Sub sees its own warehouse's materials behind the locked pill; Main
 * sees all four with the warehouse selector.
 */
// Design id: M4-S05
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import {
  ChipGroup,
  EmptyState,
  inScope,
  isAllWarehouses,
  KpiRow,
  PermissionNote,
  ScopeHeader,
  SearchBar,
  SectionTitle,
  StatusBadge,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { MATERIAL_DAY_SUMMARY, MATERIALS, STORAGE_WAREHOUSES, storageWarehouseName } from './fixtures';
import { ActionTile, ActionTileRow, HistoryIcon, IssueIcon, PlusIcon, ReceiveIcon, STORAGE_CODES } from './StorageParts';
import type { MaterialFilter, MaterialItem, MaterialStatus, WarehouseScreenBaseProps } from './types';

const FILTERS: readonly MaterialFilter[] = ['All', 'Available', 'Low Stock', 'Out of Stock'];

const STATUS_TONE: Record<MaterialStatus, 'success' | 'warning' | 'danger'> = {
  Available: 'success',
  'Low Stock': 'danger',
  'Out of Stock': 'danger',
};

export interface MaterialHandlingScreenProps extends WarehouseScreenBaseProps {
  materials?: readonly MaterialItem[] | undefined;
  onSelectMaterial: (materialId: string) => void;
  onAddMaterial?: (() => void) | undefined;
  /** Receive action (Main's Material Actions): record received stock. */
  onReceiveMaterial?: (() => void) | undefined;
  /** Issue action: opens the material to issue from. */
  onIssueMaterial?: ((materialId: string) => void) | undefined;
  /** History action: material movement history (host: warehouse activity). */
  onViewHistory?: (() => void) | undefined;
}

export function MaterialHandlingScreen({
  scope,
  can,
  onBack,
  materials = MATERIALS,
  onSelectMaterial,
  onAddMaterial,
  onReceiveMaterial,
  onIssueMaterial,
  onViewHistory,
}: MaterialHandlingScreenProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<MaterialFilter>('All');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);

  const canManage = can(STORAGE_CODES.materialManage);
  const allWarehouses = isAllWarehouses(scope);

  const scoped = useMemo(
    () => materials.filter((m) => inScope(scope, m.warehouseId, selectedWarehouseId)),
    [materials, scope, selectedWarehouseId],
  );
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scoped.filter(
      (m) =>
        (filter === 'All' || m.status === filter) &&
        (q === '' || m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q)),
    );
  }, [scoped, filter, query]);

  const day = MATERIAL_DAY_SUMMARY.filter((d) => inScope(scope, d.warehouseId, selectedWarehouseId));
  const issuedToday = day.reduce((sum, d) => sum + d.issuedToday, 0);
  const receivedToday = day.reduce((sum, d) => sum + d.receivedToday, 0);
  const lowCount = scoped.filter((m) => m.status !== 'Available').length;

  const firstVisible = visible[0];
  // Material Actions (Receive / Issue / History) are Main-only: the Sub warehouse
  // (scope.warehouseId defined) does not show the section at all.
  const showReceive = allWarehouses && canManage && onReceiveMaterial !== undefined;
  const showIssue = allWarehouses && canManage && onIssueMaterial !== undefined && firstVisible !== undefined;
  const showHistory = allWarehouses && onViewHistory !== undefined;

  return (
    <WalletScreen
      title="Material Handling"
      onBack={onBack}
      headerExtra={
        <ScopeHeader
          scope={scope}
          warehouseOptions={STORAGE_WAREHOUSES}
          selectedWarehouseId={selectedWarehouseId}
          onSelectWarehouse={setSelectedWarehouseId}
        />
      }
      footer={
        canManage && onAddMaterial ? (
          <WalletFooter>
            <WalletButton label="Add Material" icon={<PlusIcon />} onPress={onAddMaterial} />
          </WalletFooter>
        ) : undefined
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <KpiRow
          items={[
            { value: String(scoped.length), label: 'TOTAL MATERIALS' },
            { value: String(lowCount), label: 'LOW MATERIAL', tone: lowCount > 0 ? 'danger' : undefined },
          ]}
        />
        <KpiRow
          items={[
            { value: String(issuedToday), label: 'ISSUED TODAY' },
            { value: String(receivedToday), label: 'RECEIVED TODAY' },
          ]}
        />

        {showReceive || showIssue || showHistory ? (
          <>
            <SectionTitle>Material Actions</SectionTitle>
            <ActionTileRow>
              {showReceive ? <ActionTile label="Receive" icon={<ReceiveIcon />} onPress={() => onReceiveMaterial?.()} /> : null}
              {showIssue ? (
                <ActionTile label="Issue" icon={<IssueIcon />} onPress={() => onIssueMaterial?.(firstVisible.id)} />
              ) : null}
              {showHistory ? <ActionTile label="History" icon={<HistoryIcon />} onPress={() => onViewHistory?.()} /> : null}
            </ActionTileRow>
          </>
        ) : null}
        {!canManage ? (
          <PermissionNote>View only. Adding, receiving and issuing materials needs material handling access.</PermissionNote>
        ) : null}

        <SearchBar value={query} onChangeText={setQuery} placeholder="Search materials" />
        <ChipGroup options={FILTERS} value={filter} onChange={setFilter} />

        {visible.length === 0 ? (
          <EmptyState title="No materials found" subtitle="Try another filter or search." />
        ) : (
          visible.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              activeOpacity={0.7}
              onPress={() => onSelectMaterial(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`${item.name} ${item.code}`}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardMeta}>{item.code}</Text>
                </View>
                <StatusBadge label={item.status} tone={STATUS_TONE[item.status]} />
              </View>
              <View style={styles.cardRow}>
                {allWarehouses ? (
                  <View>
                    <Text style={styles.cardMeta}>Warehouse</Text>
                    <Text style={styles.cardValue}>{storageWarehouseName(item.warehouseId)}</Text>
                  </View>
                ) : null}
                <View style={allWarehouses ? styles.alignEnd : undefined}>
                  <Text style={styles.cardMeta}>Available</Text>
                  <Text style={styles.cardValue}>
                    {item.current - item.reserved} {item.unit}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardMeta}>Last Updated · {item.lastUpdated}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: adminSpacing.md },
  cardHeaderText: { flex: 1, marginRight: adminSpacing.sm },
  cardTitle: { ...adminType.sectionHead, color: adminColors.ink },
  cardMeta: { ...adminType.rowMeta, color: adminColors.muted },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: adminSpacing.md },
  cardValue: { ...adminType.rowTitle, color: adminColors.ink, marginTop: 2 },
  alignEnd: { alignItems: 'flex-end' },
});
