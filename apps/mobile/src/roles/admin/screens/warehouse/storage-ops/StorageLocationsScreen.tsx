import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useAdminQuery } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { listStorageLocations, type StorageLocationDto } from '../../../api/warehouses';
import { formatKg, parseKgToGrams } from '../../../money/quantity';
import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import {
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingState,
} from '../shared/AsyncStates';
import { useWarehouseOptions } from '../shared/useWarehouseOptions';
import {
  isAllWarehouses,
  ScopeHeader,
  SearchBar,
  SectionTitle,
  StatusBadge,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { STORAGE_CODES, WarehouseIcon } from './StorageParts';
import type { WarehouseScreenBaseProps } from './types';

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

export interface StorageLocationsScreenProps extends WarehouseScreenBaseProps {
  onSelectLocation?: ((locationId: string) => void) | undefined;
}

export function StorageLocationsScreen({ scope, can, onBack, onSelectLocation }: StorageLocationsScreenProps) {
  const [query, setQuery] = useState('');
  const [collapsedWarehouses, setCollapsedWarehouses] = useState<Record<string, boolean>>({});

  const isMain = isAllWarehouses(scope);
  const canView = can(STORAGE_CODES.batchView);
  const { options } = useWarehouseOptions();

  // Sub warehouse locations
  const subWarehouseId = scope.warehouseId;
  const subLocationsQuery = useAdminQuery(
    adminKeys.scoped('storageLocations', subWarehouseId, { pageSize: 100 }),
    (signal) => listStorageLocations(subWarehouseId as string, { pageSize: 100 }, signal),
    { enabled: !isMain && !!subWarehouseId && canView },
  );

  const toggleWarehouse = (id: string) => {
    setCollapsedWarehouses((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const q = query.toLowerCase().trim();

  // Sub view: group by locationType
  const subLocations = subLocationsQuery.data?.items ?? [];
  const filteredSubLocations = useMemo(() => {
    return subLocations.filter((item) => {
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        (item.locationType && item.locationType.toLowerCase().includes(q))
      );
    });
  }, [subLocations, q]);

  const subGroups = useMemo(() => {
    const map = new Map<string, StorageLocationDto[]>();
    for (const loc of filteredSubLocations) {
      const type = loc.locationType || 'Other';
      const existing = map.get(type) ?? [];
      existing.push(loc);
      map.set(type, existing);
    }
    return Array.from(map.entries()).map(([type, items]) => ({ type, items }));
  }, [filteredSubLocations]);

  if (!canView) {
    return (
      <WalletScreen title={t('storageOps.locations.title')} onBack={onBack}>
        <AdminEmptyState
          title={t('storageOps.locations.notAvailable.title')}
          subtitle={t('storageOps.locations.notAvailable.subtitle')}
        />
      </WalletScreen>
    );
  }

  return (
    <WalletScreen
      title={t('storageOps.locations.title')}
      onBack={onBack}
      headerExtra={!isMain && scope.warehouseName ? <ScopeHeader scope={scope} label={scope.warehouseName} /> : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.searchWrap}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder={t('storageOps.locations.searchPlaceholder')}
          />
        </View>

        {isMain ? (
          <>
            <SectionTitle>{t('storageOps.locations.title')}</SectionTitle>
            {options.map((opt) => (
              <MainWarehouseAccordion
                key={opt.warehouseId}
                warehouseId={opt.warehouseId}
                warehouseName={opt.warehouseName}
                isCollapsed={!!collapsedWarehouses[opt.warehouseId]}
                onToggle={() => toggleWarehouse(opt.warehouseId)}
                query={q}
                onSelectLocation={onSelectLocation}
              />
            ))}
          </>
        ) : subLocationsQuery.isLoading ? (
          <AdminLoadingState />
        ) : subLocationsQuery.error ? (
          <AdminErrorState error={subLocationsQuery.error} onRetry={() => subLocationsQuery.refetch()} />
        ) : subGroups.length === 0 ? (
          <AdminEmptyState
            title={t('storageOps.locations.empty')}
            subtitle={t('storageOps.locations.emptyHint')}
          />
        ) : (
          subGroups.map((group) => (
            <View key={group.type} style={styles.sectionWrap}>
              <View style={styles.groupHeaderRow}>
                <WarehouseIcon size={18} color={adminColors.brand} />
                <Text style={styles.groupHeaderText}>{group.type}</Text>
                <Text style={styles.groupCountText}>{group.items.length}</Text>
              </View>
              <View style={styles.itemsCard}>
                {group.items.map((item, index) => (
                  <LocationItemRow
                    key={item.id}
                    item={item}
                    isLast={index === group.items.length - 1}
                    onPress={() => onSelectLocation?.(item.id)}
                  />
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </WalletScreen>
  );
}

interface MainWarehouseAccordionProps {
  warehouseId: string;
  warehouseName: string;
  isCollapsed: boolean;
  onToggle: () => void;
  query: string;
  onSelectLocation?: ((locationId: string) => void) | undefined;
}

function MainWarehouseAccordion({
  warehouseId,
  warehouseName,
  isCollapsed,
  onToggle,
  query,
  onSelectLocation,
}: MainWarehouseAccordionProps) {
  const queryResult = useAdminQuery(
    adminKeys.scoped('storageLocations', warehouseId, { pageSize: 100 }),
    (signal) => listStorageLocations(warehouseId, { pageSize: 100 }, signal),
    { enabled: !isCollapsed },
  );

  const items = queryResult.data?.items ?? [];
  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (!query) return true;
      return (
        item.name.toLowerCase().includes(query) ||
        item.code.toLowerCase().includes(query) ||
        (item.locationType && item.locationType.toLowerCase().includes(query)) ||
        warehouseName.toLowerCase().includes(query)
      );
    });
  }, [items, query, warehouseName]);

  return (
    <View style={styles.accordionCard}>
      <TouchableOpacity
        style={styles.accordionHeader}
        onPress={onToggle}
        activeOpacity={0.75}
        accessibilityRole="button"
      >
        <View style={styles.accordionTitleRow}>
          <WarehouseIcon size={18} color={adminColors.brand} />
          <Text style={styles.accordionTitle}>{warehouseName}</Text>
        </View>
        <View style={styles.accordionRightRow}>
          <Text style={styles.locationsCountText}>
            {t('storageOps.locations.count', { count: items.length })}
          </Text>
          {isCollapsed ? <ChevronDownIcon size={16} /> : <ChevronUpIcon size={16} />}
        </View>
      </TouchableOpacity>

      {!isCollapsed && (
        <View style={styles.nestedCardsColumn}>
          {queryResult.isLoading ? (
            <AdminLoadingState />
          ) : queryResult.error ? (
            <AdminErrorState error={queryResult.error} onRetry={() => queryResult.refetch()} />
          ) : filtered.length === 0 ? (
            <AdminEmptyState
              title={t('storageOps.locations.empty')}
              subtitle={t('storageOps.locations.emptyHint')}
            />
          ) : (
            filtered.map((item, index) => (
              <LocationItemRow
                key={item.id}
                item={item}
                isLast={index === filtered.length - 1}
                onPress={() => onSelectLocation?.(item.id)}
              />
            ))
          )}
        </View>
      )}
    </View>
  );
}

function LocationItemRow({
  item,
  isLast,
  onPress,
}: {
  item: StorageLocationDto;
  isLast: boolean;
  onPress: () => void;
}) {
  const usedG = parseKgToGrams(item.usedKg) ?? 0;
  const capG = item.capacityKg ? (parseKgToGrams(item.capacityKg) ?? 0) : 0;
  const weightInfo = `${formatKg(usedG)} / ${formatKg(capG)}`;
  const batchInfo = t('storageOps.locations.batches', { count: item.batchCount });
  const statusTone = item.isActive ? 'success' : 'danger';
  const statusLabel = item.isActive
    ? t('storageOps.locations.active')
    : t('storageOps.locations.inactive');

  return (
    <TouchableOpacity
      style={[styles.itemRow, !isLast && styles.itemRowDivider]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
    >
      <View style={styles.itemIconWrap}>
        <WarehouseIcon size={20} color={adminColors.brand} />
      </View>
      <View style={styles.itemTextWrap}>
        <Text style={styles.itemTitle}>{item.name}</Text>
        <Text style={styles.itemSub}>
          {item.code} · {weightInfo} · {batchInfo}
        </Text>
      </View>
      <StatusBadge label={statusLabel} tone={statusTone} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.xl,
  },
  searchWrap: {
    marginBottom: adminSpacing.md,
  },
  sectionWrap: {
    marginBottom: adminSpacing.lg,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
    marginBottom: adminSpacing.xs,
  },
  groupHeaderText: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    flex: 1,
  },
  groupCountText: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  itemsCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  itemRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  itemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTextWrap: {
    flex: 1,
  },
  itemTitle: {
    ...adminType.body,
    fontWeight: '600',
    color: adminColors.ink,
    marginBottom: 2,
  },
  itemSub: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  accordionCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: adminSpacing.md,
    backgroundColor: adminColors.card,
  },
  accordionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    flex: 1,
  },
  accordionTitle: {
    ...adminType.body,
    fontWeight: '600',
    color: adminColors.ink,
  },
  accordionRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
  },
  locationsCountText: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  nestedCardsColumn: {
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingBottom: adminSpacing.sm,
  },
});