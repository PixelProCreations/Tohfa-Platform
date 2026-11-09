import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import {
  isAllWarehouses,
  ScopeHeader,
  SearchBar,
  SectionTitle,
  StatusBadge,
  WalletScreen,
} from '../wallet-cashtopup/WalletParts';
import { WarehouseIcon } from './StorageParts';
import type { WarehouseScreenBaseProps } from './types';

function SnowflakeIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M12 6l-2-2m4 0l-2 2M12 18l-2 2m4 0l-2-2M6 12l-2-2m0 4l2-2M18 12l2-2m0 4l-2-2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function StorageBoxIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M3 10h18M10 14h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function LayersIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronUpIcon({ size = 16, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 15l-6-6-6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 16, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 16, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

interface LocationItem {
  id: string;
  title: string;
  code?: string;
  section: string;
  status: 'Occupied' | 'Empty';
  statusTone: 'danger' | 'success' | 'warning';
  stockItems?: number;
  capacityKg?: number;
  currentKg?: number;
}

interface StorageGroup {
  type: string;
  icon: React.ReactNode;
  items: LocationItem[];
}

const STORAGE_GROUPS: StorageGroup[] = [
  {
    type: 'Cold Storage',
    icon: <SnowflakeIcon size={18} color={adminColors.brand} />,
    items: [
      {
        id: 'CS-A01',
        title: 'Cold Storage A',
        code: 'CS-A01',
        section: 'Rack 02 · Shelf 03 (Section A)',
        status: 'Occupied',
        statusTone: 'danger',
        stockItems: 12,
        capacityKg: 2000,
        currentKg: 1850,
      },
      {
        id: 'CS-C01',
        title: 'Cold Storage C',
        code: 'CS-C01',
        section: 'Rack 01 · Shelf 02 (Section C)',
        status: 'Occupied',
        statusTone: 'warning',
        stockItems: 8,
        capacityKg: 1500,
        currentKg: 1120,
      },
      {
        id: 'cs-3',
        title: 'Cold Storage B (Reserve)',
        code: 'CS-B02',
        section: 'Rack 03 · Shelf 02 (Section B)',
        status: 'Empty',
        statusTone: 'success',
        capacityKg: 1500,
        currentKg: 0,
      },
    ],
  },
  {
    type: 'Dry Storage',
    icon: <StorageBoxIcon size={18} color={adminColors.brand} />,
    items: [
      {
        id: 'DS-B01',
        title: 'Dry Storage B',
        code: 'DS-B01',
        section: 'Rack 01 · Shelf 01 (Section B)',
        status: 'Occupied',
        statusTone: 'success',
        stockItems: 15,
        capacityKg: 3000,
        currentKg: 2200,
      },
    ],
  },
  {
    type: 'Bulk Storage',
    icon: <LayersIcon size={18} color={adminColors.brand} />,
    items: [
      {
        id: 'BS-D01',
        title: 'Bulk Storage D',
        code: 'BS-D01',
        section: 'Bulk Pallet Area (Section D)',
        status: 'Occupied',
        statusTone: 'warning',
        stockItems: 20,
        capacityKg: 2500,
        currentKg: 1650,
      },
    ],
  },
];

interface MainWarehouseGroup {
  warehouseId: string;
  warehouseName: string;
  items: LocationItem[];
}

const MAIN_WAREHOUSE_LOCATIONS: MainWarehouseGroup[] = [
  {
    warehouseId: 'WH-OOTY',
    warehouseName: 'Ooty Warehouse',
    items: [
      {
        id: 'OCS-A01',
        title: 'Cold Storage A · OCS-A01',
        section: 'Rack 02 · Shelf 03 · Section A',
        status: 'Occupied',
        statusTone: 'danger',
        stockItems: 12,
        capacityKg: 4000,
        currentKg: 3100,
      },
      {
        id: 'ODS-B01',
        title: 'Dry Storage B · ODS-B01',
        section: 'Rack 01 · Shelf 01 · Section B',
        status: 'Occupied',
        statusTone: 'success',
        stockItems: 18,
        capacityKg: 6000,
        currentKg: 4400,
      },
    ],
  },
  {
    warehouseId: 'WH-COON',
    warehouseName: 'Coonoor Warehouse',
    items: [
      {
        id: 'CS-A01',
        title: 'Cold Storage A · CS-A01',
        section: 'Rack 02 · Shelf 03 · Section A',
        status: 'Occupied',
        statusTone: 'danger',
        stockItems: 12,
        capacityKg: 2000,
        currentKg: 1850,
      },
      {
        id: 'DS-B01',
        title: 'Dry Storage B · DS-B01',
        section: 'Rack 01 · Shelf 01 · Section B',
        status: 'Occupied',
        statusTone: 'success',
        stockItems: 15,
        capacityKg: 3000,
        currentKg: 2200,
      },
      {
        id: 'BS-D01',
        title: 'Bulk Storage D · BS-D01',
        section: 'Bulk Pallet Area · Section D',
        status: 'Occupied',
        statusTone: 'warning',
        stockItems: 20,
        capacityKg: 2500,
        currentKg: 1650,
      },
    ],
  },
  {
    warehouseId: 'WH-KOTA',
    warehouseName: 'Kotagiri Warehouse',
    items: [
      {
        id: 'KCS-A01',
        title: 'Cold Storage A · KCS-A01',
        section: 'Rack 01 · Shelf 01 · Section A',
        status: 'Occupied',
        statusTone: 'warning',
        stockItems: 6,
        capacityKg: 1500,
        currentKg: 900,
      },
      {
        id: 'KDS-B01',
        title: 'Dry Storage B · KDS-B01',
        section: 'Rack 02 · Shelf 02 · Section B',
        status: 'Empty',
        statusTone: 'success',
        capacityKg: 2000,
        currentKg: 0,
      },
    ],
  },
  {
    warehouseId: 'WH-GUDA',
    warehouseName: 'Gudalur Market Warehouse',
    items: [
      {
        id: 'GDS-A01',
        title: 'Dry Storage A · GDS-A01',
        section: 'Rack 01 · Shelf 01 · Section A',
        status: 'Occupied',
        statusTone: 'warning',
        stockItems: 10,
        capacityKg: 2500,
        currentKg: 1700,
      },
    ],
  },
];

export interface StorageLocationsScreenProps extends WarehouseScreenBaseProps {
  onSelectLocation?: ((locationId: string) => void) | undefined;
}

export function StorageLocationsScreen({ scope, onBack, onSelectLocation }: StorageLocationsScreenProps) {
  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Cold Storage' | 'Dry Storage' | 'Bulk Storage'>('All');
  const [collapsedWarehouses, setCollapsedWarehouses] = useState<Record<string, boolean>>({});

  const isMain = isAllWarehouses(scope);
  const q = query.toLowerCase().trim();

  const toggleWarehouse = (id: string) => {
    setCollapsedWarehouses((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredGroups = STORAGE_GROUPS
    .filter((group) => selectedFilter === 'All' || group.type === selectedFilter)
    .map((group) => {
      const items = group.items.filter((item) => {
        if (!q) return true;
        return (
          item.title.toLowerCase().includes(q) ||
          (item.code && item.code.toLowerCase().includes(q)) ||
          item.section.toLowerCase().includes(q) ||
          group.type.toLowerCase().includes(q)
        );
      });
      return { ...group, items };
    })
    .filter((group) => group.items.length > 0);

  const filteredMainGroups = MAIN_WAREHOUSE_LOCATIONS.map((group) => {
    const items = group.items.filter((item) => {
      if (selectedFilter !== 'All' && !item.section.toLowerCase().includes(selectedFilter.toLowerCase())) {
        return false;
      }
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.section.toLowerCase().includes(q) ||
        group.warehouseName.toLowerCase().includes(q)
      );
    });
    return { ...group, items };
  }).filter((group) => group.items.length > 0);

  // Compute stats
  const allSubItems = STORAGE_GROUPS.flatMap((g) => g.items);
  const totalSubCapacity = allSubItems.reduce((acc, i) => acc + (i.capacityKg ?? 0), 0);
  const totalSubCurrent = allSubItems.reduce((acc, i) => acc + (i.currentKg ?? 0), 0);
  const overallFillPercent = totalSubCapacity > 0 ? Math.round((totalSubCurrent / totalSubCapacity) * 100) : 74;

  return (
    <WalletScreen
      title="Storage Locations"
      onBack={onBack}
      headerExtra={isMain ? undefined : <ScopeHeader scope={scope} label={scope.warehouseName ?? 'Coonoor Warehouse'} />}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── Top Summary Metrics Card ─── */}
        <View style={styles.metricsCard}>
          <View style={styles.metricCol}>
            <Text style={styles.metricVal}>{isMain ? '10' : allSubItems.length}</Text>
            <Text style={styles.metricLbl}>Locations</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricCol}>
            <Text style={styles.metricVal}>{overallFillPercent}%</Text>
            <Text style={styles.metricLbl}>Occupancy</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricCol}>
            <Text style={[styles.metricVal, { color: adminColors.brand }]}>
              {isMain ? '15.5T' : (totalSubCurrent / 1000).toFixed(1) + 'T'}
            </Text>
            <Text style={styles.metricLbl}>Utilized</Text>
          </View>
        </View>

        {/* ─── Search Bar ─── */}
        <View style={styles.searchWrap}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder={isMain ? 'Search location, warehouse, rack, shelf' : 'Search location, rack, shelf or code'}
          />
        </View>

        {/* ─── Filter Pills ─── */}
        <View style={styles.filterPillsRow}>
          {(['All', 'Cold Storage', 'Dry Storage', 'Bulk Storage'] as const).map((filter) => {
            const active = selectedFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterPill, active && styles.filterPillActive]}
                onPress={() => setSelectedFilter(filter)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{filter}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── Main Warehouse Accordion View ─── */}
        {isMain ? (
          <>
            <SectionTitle>Warehouse Storage Locations</SectionTitle>
            {filteredMainGroups.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No storage locations found</Text>
                <Text style={styles.emptySub}>Try searching with different keywords or clearing your filter.</Text>
              </View>
            ) : (
              filteredMainGroups.map((group) => {
                const isCollapsed = !!collapsedWarehouses[group.warehouseId];
                return (
                  <View key={group.warehouseId} style={styles.accordionCard}>
                    <TouchableOpacity
                      style={styles.accordionHeader}
                      onPress={() => toggleWarehouse(group.warehouseId)}
                      activeOpacity={0.75}
                      accessibilityRole="button"
                    >
                      <View style={styles.accordionTitleRow}>
                        <View style={styles.warehouseIconBadge}>
                          <WarehouseIcon size={18} color={adminColors.brand} />
                        </View>
                        <View>
                          <Text style={styles.accordionTitle}>{group.warehouseName}</Text>
                          <Text style={styles.locationsCountText}>{group.items.length} storage locations</Text>
                        </View>
                      </View>
                      <View style={styles.accordionRightRow}>
                        {isCollapsed ? <ChevronDownIcon size={18} /> : <ChevronUpIcon size={18} />}
                      </View>
                    </TouchableOpacity>

                    {!isCollapsed && (
                      <View style={styles.nestedCardsColumn}>
                        {group.items.map((item) => {
                          const fillPct =
                            item.capacityKg && item.capacityKg > 0
                              ? Math.round(((item.currentKg ?? 0) / item.capacityKg) * 100)
                              : item.status === 'Occupied'
                              ? 80
                              : 0;

                          return (
                            <TouchableOpacity
                              key={item.id}
                              style={styles.cardEnhanced}
                              onPress={() => onSelectLocation?.(item.id)}
                              activeOpacity={0.8}
                              accessibilityRole="button"
                              accessibilityLabel={item.title}
                            >
                              <View style={styles.cardHeaderRow}>
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.cardMainTitle}>{item.title}</Text>
                                  <Text style={styles.cardSubtitle}>{item.section}</Text>
                                </View>
                                <StatusBadge label={item.status} tone={item.statusTone} />
                              </View>

                              {/* Capacity Progress Bar */}
                              {item.capacityKg ? (
                                <View style={styles.progressContainer}>
                                  <View style={styles.progressBarTrack}>
                                    <View
                                      style={[
                                        styles.progressBarFill,
                                        {
                                          width: `${fillPct}%` as any,
                                          backgroundColor:
                                            fillPct > 85 ? '#DC2626' : fillPct > 50 ? '#D97706' : '#16A34A',
                                        },
                                      ]}
                                    />
                                  </View>
                                  <View style={styles.progressLabelRow}>
                                    <Text style={styles.progressText}>
                                      {item.currentKg ?? 0} / {item.capacityKg} kg ({fillPct}%)
                                    </Text>
                                    {item.stockItems !== undefined && (
                                      <Text style={styles.stockBadgeText}>{item.stockItems} batches</Text>
                                    )}
                                  </View>
                                </View>
                              ) : null}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </>
        ) : (
          /* ─── Sub Warehouse Grouped View ─── */
          filteredGroups.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No storage locations found</Text>
              <Text style={styles.emptySub}>Try searching with different keywords or clearing your filter.</Text>
            </View>
          ) : (
            filteredGroups.map((group) => (
              <View key={group.type} style={styles.groupContainer}>
                <View style={styles.groupHeader}>
                  <View style={styles.groupIconBox}>{group.icon}</View>
                  <Text style={styles.groupTitle}>{group.type}</Text>
                  <View style={styles.groupCountBadge}>
                    <Text style={styles.groupCountBadgeText}>{group.items.length}</Text>
                  </View>
                </View>

                <View style={styles.cardsColumn}>
                  {group.items.map((item) => {
                    const fillPct =
                      item.capacityKg && item.capacityKg > 0
                        ? Math.round(((item.currentKg ?? 0) / item.capacityKg) * 100)
                        : item.status === 'Occupied'
                        ? 85
                        : 0;

                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.cardEnhanced}
                        onPress={() => onSelectLocation?.(item.id)}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel={item.title}
                      >
                        <View style={styles.cardHeaderRow}>
                          <View style={{ flex: 1 }}>
                            <View style={styles.titleWithCodeRow}>
                              <Text style={styles.cardMainTitle}>{item.title}</Text>
                              {item.code ? (
                                <View style={styles.codePill}>
                                  <Text style={styles.codePillText}>{item.code}</Text>
                                </View>
                              ) : null}
                            </View>
                            <Text style={styles.cardSubtitle}>{item.section}</Text>
                          </View>
                          <View style={styles.rightActionCol}>
                            <StatusBadge label={item.status} tone={item.statusTone} />
                            <ChevronRightIcon size={16} />
                          </View>
                        </View>

                        {/* Capacity Progress Bar */}
                        {item.capacityKg ? (
                          <View style={styles.progressContainer}>
                            <View style={styles.progressBarTrack}>
                              <View
                                style={[
                                  styles.progressBarFill,
                                  {
                                    width: `${fillPct}%` as any,
                                    backgroundColor:
                                      fillPct > 85 ? '#DC2626' : fillPct > 50 ? '#D97706' : '#16A34A',
                                  },
                                ]}
                              />
                            </View>
                            <View style={styles.progressLabelRow}>
                              <Text style={styles.progressText}>
                                {item.currentKg ?? 0} / {item.capacityKg} kg ({fillPct}%)
                              </Text>
                              {item.stockItems !== undefined && (
                                <Text style={styles.stockBadgeText}>{item.stockItems} batches</Text>
                              )}
                            </View>
                          </View>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))
          )
        )}
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: adminSpacing.lg,
    paddingBottom: 40,
  },
  // Metrics Card
  metricsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    ...adminType.kpiValue,
    fontSize: 20,
    fontWeight: '800',
    color: adminColors.ink,
  },
  metricLbl: {
    ...adminType.caption,
    fontSize: 11.5,
    fontWeight: '600',
    color: adminColors.muted,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: adminColors.border,
  },
  searchWrap: {
    marginBottom: 12,
  },
  // Filter Pills
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  filterPillActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  filterPillText: {
    ...adminType.rowMeta,
    fontSize: 12,
    fontWeight: '600',
    color: adminColors.muted,
  },
  filterPillTextActive: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  // Accordion Card (Main)
  accordionCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  accordionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  warehouseIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accordionTitle: {
    ...adminType.sectionHead,
    fontSize: 15,
    fontWeight: '700',
    color: adminColors.ink,
  },
  accordionRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
  },
  locationsCountText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
  },
  nestedCardsColumn: {
    marginTop: 14,
    gap: 10,
  },
  // Group Header
  groupContainer: {
    marginBottom: 20,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  groupIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupTitle: {
    ...adminType.sectionHead,
    fontSize: 14.5,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  groupCountBadge: {
    backgroundColor: adminColors.border,
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 10,
  },
  groupCountBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.muted,
  },
  cardsColumn: {
    gap: 10,
  },
  // Enhanced Card (Both Sub & Main)
  cardEnhanced: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 14,
    ...adminShadow.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleWithCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  cardMainTitle: {
    ...adminType.rowTitle,
    fontSize: 14.5,
    fontWeight: '700',
    color: adminColors.ink,
  },
  codePill: {
    backgroundColor: adminColors.brandTint,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  codePillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: adminColors.brand,
  },
  cardSubtitle: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 4,
  },
  rightActionCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  // Progress bar
  progressContainer: {
    marginTop: 12,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: adminColors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  progressText: {
    ...adminType.caption,
    fontSize: 11.5,
    fontWeight: '600',
    color: adminColors.ink,
  },
  stockBadgeText: {
    ...adminType.caption,
    fontSize: 11,
    fontWeight: '600',
    color: adminColors.brand,
  },
  // Empty state
  emptyCard: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
    marginTop: 8,
  },
  emptyTitle: {
    ...adminType.sectionHead,
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },
  emptySub: {
    ...adminType.caption,
    color: adminColors.muted,
    textAlign: 'center',
    marginTop: 4,
  },
});
