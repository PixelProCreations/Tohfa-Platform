// Design id: M4-S03
/**
 * Storage Information for the Main and Sub warehouse admins (FINAL_LIST #85).
 *
 * Was roles/subwarehouse SubWarehouseStorageInfoScreen. Absorbs:
 *   - swa/inventory/M3S08_StorageLocationStock (section fill levels by storage
 *     type): the "Storage Sections" block, for both roles. InventoryFlow's
 *     'M3S08' route renders this screen now.
 *   - warehouse/StorageLocationsScreen (the Main storage hierarchy browser,
 *     pair_table M4-S03): the "Storage Hierarchy" card, Main only
 *     (scope.warehouseId undefined), for the selected warehouse or all four.
 *
 * Gate: none. Read-only for both roles: capacity numbers are display-only
 * here (warehouse.capacity.set is none for SUB; Main sets capacity in
 * Warehouse Settings). There is no rbac code or endpoint for storage-location
 * master data (SPEC_GAPS W4m-2).
 *
 * Sub sees its own warehouse (locked pill); Main sees all four with the
 * all-warehouses selector and a warehouse line on each location card. The
 * location detail (SubWarehouseStorageLocationDetailScreen, storage-ops wave)
 * stays with the host: cards are tappable only when it passes onSelectLocation.
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import {
  Card,
  ChipGroup,
  EmptyState,
  inScope,
  InfoNote,
  isAllWarehouses,
  KpiRow,
  ScopeHeader,
  SearchBar,
  SectionTitle,
  StatusBadge,
  WalletScreen,
  WarehouseTabBar,
} from '../wallet-cashtopup/WalletParts';
import type {
  StorageHierarchyNode,
  StorageLocationItem,
  StorageSectionItem,
  StorageType,
  WarehouseScreenBaseProps,
  WarehouseSelectionProps,
} from './types';
import { PROFILE_WAREHOUSES, STORAGE_HIERARCHY, STORAGE_LOCATIONS, STORAGE_SECTIONS } from './warehouseFixtures';
import { FillBar, formatKg, warehouseNameOf, warehouseProfileLayout } from './WarehouseProfileParts';

type StatusFilter = 'All' | 'Active' | 'Inactive';
const STATUS_FILTERS: readonly StatusFilter[] = ['All', 'Active', 'Inactive'];

export interface StorageInfoScreenProps extends WarehouseScreenBaseProps, WarehouseSelectionProps {
  /** Open a location's detail (host-owned). Without it the cards are not tappable. */
  onSelectLocation?: ((locationId: string) => void) | undefined;
  locations?: readonly StorageLocationItem[] | undefined;
  sections?: readonly StorageSectionItem[] | undefined;
  hierarchy?: Readonly<Record<string, readonly StorageHierarchyNode[]>> | undefined;
}

export function StorageInfoScreen({
  scope,
  onBack,
  onTabChange,
  onSelectLocation,
  warehouseOptions = PROFILE_WAREHOUSES,
  selectedWarehouseId,
  onSelectWarehouse,
  locations = STORAGE_LOCATIONS,
  sections = STORAGE_SECTIONS,
  hierarchy = STORAGE_HIERARCHY,
}: StorageInfoScreenProps) {
  const isMain = isAllWarehouses(scope);
  // Main keeps its own pick when the host does not control it.
  const [localSelection, setLocalSelection] = useState<string | undefined>(undefined);
  const selected = onSelectWarehouse ? selectedWarehouseId : localSelection;
  const select = onSelectWarehouse ?? setLocalSelection;

  const [filter, setFilter] = useState<StatusFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const visibleLocations = useMemo(
    () => locations.filter((loc) => inScope(scope, loc.warehouseId, selected)),
    [locations, scope, selected],
  );
  const visibleSections = sections.filter((section) => inScope(scope, section.warehouseId, selected));

  const filteredLocations = visibleLocations.filter((loc) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesFilter = filter === 'All' || loc.status === filter;
    const matchesSearch =
      !q || loc.name.toLowerCase().includes(q) || loc.code.toLowerCase().includes(q) || loc.type.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const totalKg = visibleLocations.reduce((sum, loc) => sum + loc.capacityKg, 0);
  const usedKg = visibleLocations.reduce((sum, loc) => sum + loc.currentKg, 0);
  const usedPercent = totalKg > 0 ? (usedKg / totalKg) * 100 : 0;
  const activeCount = visibleLocations.filter((loc) => loc.status === 'Active').length;
  const occupiedCount = visibleLocations.filter((loc) => loc.currentKg > 0).length;

  const sectionTypes = Array.from(new Set(visibleSections.map((s) => s.type))) as StorageType[];
  const hierarchyWarehouses = warehouseOptions.filter(
    (o) => o.warehouseId !== undefined && (selected === undefined || o.warehouseId === selected),
  );

  return (
    <WalletScreen
      title="Storage Information"
      onBack={onBack}
      headerExtra={
        <ScopeHeader
          scope={scope}
          warehouseOptions={warehouseOptions}
          selectedWarehouseId={selected}
          onSelectWarehouse={select}
        />
      }
      footer={onTabChange ? <WarehouseTabBar onTabChange={onTabChange} onBack={onBack} /> : undefined}
    >
      <ScrollView
        contentContainerStyle={warehouseProfileLayout.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <KpiRow
          items={[
            { value: String(visibleLocations.length), label: 'STORAGE LOCATIONS' },
            { value: String(activeCount), label: 'ACTIVE LOCATIONS' },
          ]}
        />
        <View style={warehouseProfileLayout.gap} />
        <KpiRow
          items={[
            { value: String(occupiedCount), label: 'OCCUPIED' },
            { value: String(visibleLocations.length - occupiedCount), label: 'EMPTY' },
          ]}
        />

        <SectionTitle>Storage Capacity</SectionTitle>
        <Card>
          <View style={styles.capacityHead}>
            <Text style={styles.capacityLabel}>Capacity Used</Text>
            <Text style={styles.capacityPercent}>{usedPercent.toFixed(1)}%</Text>
          </View>
          <FillBar percent={usedPercent} />
          <View style={styles.capacityGrid}>
            <CapacityCell label="Total Capacity" value={formatKg(totalKg)} />
            <CapacityCell label="Current Occupancy" value={formatKg(usedKg)} />
            <CapacityCell label="Available Capacity" value={formatKg(Math.max(0, totalKg - usedKg))} />
          </View>
        </Card>
        <View style={warehouseProfileLayout.gap} />
        <InfoNote>
          {isMain
            ? 'Capacity is displayed here, not edited. Capacity limits are set in Warehouse Settings.'
            : 'Capacity is displayed, never editable by SWA.'}
        </InfoNote>

        {isMain ? (
          <>
            <SectionTitle>Storage Hierarchy</SectionTitle>
            <Card>
              {hierarchyWarehouses.map((wh, index) => (
                <View key={wh.warehouseId} style={index > 0 ? styles.treeBlockSpaced : undefined}>
                  <Text style={styles.treeRoot}>{warehouseNameOf(scope, wh.warehouseId, warehouseOptions)}</Text>
                  <HierarchyLevel nodes={hierarchy[wh.warehouseId ?? ''] ?? []} depth={1} />
                </View>
              ))}
            </Card>
          </>
        ) : null}

        {visibleSections.length > 0 ? (
          <>
            <SectionTitle>Storage Sections</SectionTitle>
            {sectionTypes.map((type) => (
              <View key={type}>
                <Text style={styles.sectionType}>{type}</Text>
                {visibleSections
                  .filter((s) => s.type === type)
                  .map((section) => (
                    <View key={section.id} style={styles.sectionCard}>
                      <View style={styles.cardTop}>
                        <Text style={styles.cardTitle}>{section.name}</Text>
                        <StatusBadge
                          label={section.fillPercent > 0 ? `${section.fillPercent}% Full` : 'Empty'}
                          tone={section.fillPercent > 0 ? 'brandSoft' : 'danger'}
                        />
                      </View>
                      <Text style={styles.cardMeta}>
                        {isMain ? `${warehouseNameOf(scope, section.warehouseId, warehouseOptions)} · ` : ''}
                        {section.meta}
                      </Text>
                      <FillBar percent={section.fillPercent} />
                    </View>
                  ))}
              </View>
            ))}
            <InfoNote>
              Capacity and occupancy figures are read from the warehouse's storage configuration, not entered here.
            </InfoNote>
          </>
        ) : null}

        <SectionTitle>Storage Locations</SectionTitle>
        <ChipGroup options={STATUS_FILTERS} value={filter} onChange={setFilter} />
        <View style={warehouseProfileLayout.gap} />
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Location name, code, storage type" />
        <View style={warehouseProfileLayout.gap} />
        {filteredLocations.length === 0 ? (
          <EmptyState title="No storage locations" subtitle="Try another filter or search." />
        ) : (
          filteredLocations.map((loc) => {
            const content = (
              <>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle}>{loc.name}</Text>
                  <StatusBadge label={loc.status} tone={loc.status === 'Active' ? 'success' : 'warning'} />
                </View>
                <Text style={styles.cardMeta}>
                  {loc.code}
                  {isMain ? ` · ${warehouseNameOf(scope, loc.warehouseId, warehouseOptions)}` : ''}
                </Text>
                <View style={styles.locStats}>
                  <CapacityCell label="Capacity" value={formatKg(loc.capacityKg)} />
                  <CapacityCell label="Current" value={formatKg(loc.currentKg)} />
                </View>
              </>
            );
            return onSelectLocation ? (
              <TouchableOpacity
                key={loc.id}
                style={styles.sectionCard}
                onPress={() => onSelectLocation(loc.id)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={loc.name}
              >
                {content}
              </TouchableOpacity>
            ) : (
              <View key={loc.id} style={styles.sectionCard}>
                {content}
              </View>
            );
          })
        )}
      </ScrollView>
    </WalletScreen>
  );
}

function CapacityCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.capacityCell}>
      <Text style={styles.cellLabel}>{label}</Text>
      <Text style={styles.cellValue}>{value}</Text>
    </View>
  );
}

/** One indented level of the storage hierarchy tree. */
function HierarchyLevel({ nodes, depth }: { nodes: readonly StorageHierarchyNode[]; depth: number }) {
  return (
    <View style={styles.treeIndent}>
      {nodes.map((node) => (
        <View key={node.label}>
          <Text style={node.children ? styles.treeBranch : styles.treeLeaf}>{node.label}</Text>
          {node.children ? <HierarchyLevel nodes={node.children} depth={depth + 1} /> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  capacityHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  capacityLabel: { ...adminType.rowTitle, color: adminColors.ink },
  capacityPercent: { ...adminType.sectionHead, color: adminColors.brand },
  capacityGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: adminSpacing.md, rowGap: adminSpacing.md },
  capacityCell: { minWidth: '50%', flexGrow: 1 },
  cellLabel: { ...adminType.rowMeta, color: adminColors.muted },
  cellValue: { ...adminType.rowTitle, color: adminColors.ink, marginTop: 2 },

  treeBlockSpaced: { marginTop: adminSpacing.md, paddingTop: adminSpacing.md, borderTopWidth: 1, borderTopColor: adminColors.border },
  treeRoot: { ...adminType.sectionHead, color: adminColors.brandDeep },
  treeIndent: { paddingLeft: adminSpacing.md, marginTop: adminSpacing.xs, borderLeftWidth: 1, borderLeftColor: adminColors.border },
  treeBranch: { ...adminType.rowTitle, color: adminColors.ink, marginTop: adminSpacing.xs },
  treeLeaf: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },

  sectionType: { ...adminType.rowTitle, color: adminColors.brandDeep, marginBottom: adminSpacing.sm },
  sectionCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: adminSpacing.sm },
  cardTitle: { ...adminType.rowTitle, color: adminColors.ink, flex: 1 },
  cardMeta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs },
  locStats: { flexDirection: 'row', marginTop: adminSpacing.md },
});
