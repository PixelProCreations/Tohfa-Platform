// Design id: M3S16
import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { adminColors, adminSpacing, adminType } from '../../../theme';
import { t, type TranslationKey } from '../../../i18n';
import { ADMIN_NO_VALUE } from '../../../utils/noValue';
import {
  EMPTY_FILTER_CRITERIA,
  FILTER_GRADES,
  FILTER_LEVELS,
  batchOptions,
  filterMovements,
  locationOptions,
  productOptions,
  type FilterOption,
  type InventoryFilterCriteria,
} from './inventoryFilters';
import { gradeLabel } from './mappers';
import { movementReference } from './movementDetailMappers';
import type { BatchRow, InventoryScreenBaseProps, ProductStock, StockLevel, StockMovementRow } from './types';
import Svg, { Path } from 'react-native-svg';
import { Icon, SafeAreaView } from '@tohfa/mobile-ui';
import { SWAHeader } from '../../swa/components';

export interface InventoryFiltersScreenProps extends InventoryScreenBaseProps {
  /** Ledger rows to filter (the results list). Undefined = none loaded: the count shows the dash. */
  movements?: readonly StockMovementRow[] | undefined;
  /** Loaded batches, for the Product / Batch / Storage Location options. */
  batches?: readonly BatchRow[] | undefined;
  /** Product stock rows; the Stock Status filter reads their level. */
  products?: readonly ProductStock[] | undefined;
  /** Called with the selection on Apply Filters; without it Apply does nothing. */
  onApply?: ((criteria: InventoryFilterCriteria) => void) | undefined;
}

const LEVEL_LABEL: Record<StockLevel, TranslationKey> = {
  inStock: 'inventory.level.inStock',
  low: 'inventory.level.low',
  out: 'inventory.level.out',
};

function WarehouseIcon({ size = 16, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 21V9l9-6 9 6v12H3z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 21V12h6v9" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CropIcon({ size = 16, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2a9 9 0 0 1 9 9v1a9 9 0 0 1-9 9 9 9 0 0 1-9-9v-1a9 9 0 0 1 9-9z" stroke={color} strokeWidth="1.8" />
      <Path d="M12 6v12M8 10l4-4 4 4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function StarIcon({ size = 16, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FlagIcon({ size = 16, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1v18" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function QrIcon({ size = 16, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 3h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke={color} strokeWidth="1.8" />
      <Path d="M15 3h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke={color} strokeWidth="1.8" />
      <Path d="M4 14h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1z" stroke={color} strokeWidth="1.8" />
      <Path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 19h2v2h-2z" fill={color} />
    </Svg>
  );
}

function PinIcon({ size = 16, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke={color} strokeWidth="1.8" />
      <Path d="M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function LockIcon({ size = 14, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FunnelFilterIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const PAGE_SIZE = 10;

type OpenDropdown = 'product' | 'batch' | 'location' | undefined;

/** A design dropdown: the closed field plus, when open, its real options (or the dash when there are none). */
function FilterDropdown({
  placeholder,
  options,
  value,
  open,
  onToggle,
  onSelect,
}: {
  placeholder: string;
  options: readonly FilterOption[];
  value: string | undefined;
  open: boolean;
  onToggle: () => void;
  onSelect: (value: string | undefined) => void;
}) {
  const selected = options.find((option) => option.value === value);
  return (
    <>
      <TouchableOpacity style={styles.dropdown} activeOpacity={0.7} onPress={onToggle}>
        <Text style={selected ? styles.dateInputValue : styles.dropdownPlaceholder}>{selected?.label ?? placeholder}</Text>
        <Icon name="expand_more" size={20} color={adminColors.muted} />
      </TouchableOpacity>
      {open ? (
        <View style={[styles.chipGroup, styles.optionList]}>
          {options.length === 0 ? (
            <Text style={styles.dropdownPlaceholder}>{ADMIN_NO_VALUE}</Text>
          ) : (
            options.map((option) => {
              const isActive = option.value === value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.chip, isActive && styles.activeChip]}
                  onPress={() => onSelect(isActive ? undefined : option.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, isActive && styles.activeChipText]}>{option.label}</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      ) : null}
    </>
  );
}

export function InventoryFiltersScreen({
  scope,
  onBack,
  warehouseOptions,
  selectedWarehouseId,
  movements,
  batches = [],
  products = [],
  onApply,
}: InventoryFiltersScreenProps) {
  const [criteria, setCriteria] = useState<InventoryFilterCriteria>(EMPTY_FILTER_CRITERIA);
  const [openDropdown, setOpenDropdown] = useState<OpenDropdown>(undefined);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const rows = movements ?? [];
  const productChoices = useMemo(() => productOptions(rows, batches, products), [rows, batches, products]);
  const batchChoices = useMemo(() => batchOptions(rows, batches), [rows, batches]);
  const locationChoices = useMemo(() => locationOptions(rows, batches), [rows, batches]);
  const results = useMemo(() => filterMovements(rows, criteria, products), [rows, criteria, products]);
  const shown = results.slice(0, visibleCount);
  const hasMore = results.length > shown.length;

  const update = (patch: Partial<InventoryFilterCriteria>) => {
    setCriteria((current) => ({ ...current, ...patch }));
    setVisibleCount(PAGE_SIZE);
  };
  const clearAll = () => {
    setCriteria(EMPTY_FILTER_CRITERIA);
    setOpenDropdown(undefined);
    setVisibleCount(PAGE_SIZE);
  };
  const toggle = (which: Exclude<OpenDropdown, undefined>) =>
    setOpenDropdown((current) => (current === which ? undefined : which));

  // A Sub admin is locked to its own warehouse (BR-30); the Main view names
  // the warehouse picked in the dashboard selector, or all of them.
  const isLocked = scope.warehouseId !== undefined;
  const warehouseName = isLocked
    ? scope.warehouseName ?? ADMIN_NO_VALUE
    : selectedWarehouseId === undefined
      ? t('inventory.filters.allWarehouses')
      : warehouseOptions?.find((option) => option.warehouseId === selectedWarehouseId)?.warehouseName ?? ADMIN_NO_VALUE;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <SWAHeader 
          title={t('inventory.filters.title')}
          onBack={onBack}
          rightAction={
            <TouchableOpacity 
              onPress={clearAll} 
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.headerClearAll}>{t('inventory.filters.clearAll')}</Text>
            </TouchableOpacity>
          }
        />
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Icon name="search" size={18} color={adminColors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('inventory.filters.searchPlaceholder')}
              placeholderTextColor={adminColors.muted}
              value={criteria.search}
              onChangeText={(search) => update({ search })}
            />
          </View>

          {/* Warehouse */}
          <View style={styles.filterSection}>
            <View style={styles.sectionHeaderRow}>
              <WarehouseIcon size={16} color={adminColors.ink} />
              <Text style={styles.sectionTitle}>{t('inventory.filters.section.warehouse')}</Text>
            </View>
            <View style={styles.warehouseBox}>
              <View style={styles.warehouseLockIcon}>
                <LockIcon size={14} color={adminColors.brandDeep} />
              </View>
              <Text style={styles.warehouseText}>
                <Text style={styles.warehouseTextBold}>
                  {t(isLocked ? 'inventory.filters.warehouseAssigned' : 'inventory.filters.warehouseSelected', {
                    name: warehouseName,
                  })}
                </Text>{' '}
                {t(isLocked ? 'inventory.filters.warehouseAssignedNote' : 'inventory.filters.warehouseSelectedNote')}
              </Text>
            </View>
          </View>

          {/* Product / Crop */}
          <View style={styles.filterSection}>
            <View style={styles.sectionHeaderRow}>
              <CropIcon size={16} color={adminColors.ink} />
              <Text style={styles.sectionTitle}>{t('inventory.filters.section.product')}</Text>
            </View>
            <FilterDropdown
              placeholder={t('inventory.filters.productPlaceholder')}
              options={productChoices}
              value={criteria.productKey}
              open={openDropdown === 'product'}
              onToggle={() => toggle('product')}
              onSelect={(productKey) => update({ productKey })}
            />
          </View>

          {/* Grade */}
          <View style={styles.filterSection}>
            <View style={styles.sectionHeaderRow}>
              <StarIcon size={16} color={adminColors.ink} />
              <Text style={styles.sectionTitle}>{t('inventory.filters.section.grade')}</Text>
            </View>
            <View style={styles.chipGroup}>
              {[undefined, ...FILTER_GRADES].map((grade) => {
                const isActive = criteria.grade === grade;
                return (
                  <TouchableOpacity 
                    key={grade ?? 'all'} 
                    style={[styles.chip, isActive && styles.activeChip]}
                    onPress={() => update({ grade })}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, isActive && styles.activeChipText]}>
                      {grade === undefined ? t('inventory.filters.allGrades') : gradeLabel(grade)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Stock Status */}
          <View style={styles.filterSection}>
            <View style={styles.sectionHeaderRow}>
              <FlagIcon size={16} color={adminColors.ink} />
              <Text style={styles.sectionTitle}>{t('inventory.filters.section.status')}</Text>
            </View>
            <View style={styles.chipGroup}>
              {[undefined, ...FILTER_LEVELS].map((level) => {
                const isActive = criteria.level === level;
                return (
                  <TouchableOpacity 
                    key={level ?? 'all'} 
                    style={[styles.chip, isActive && styles.activeChip]}
                    onPress={() => update({ level })}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, isActive && styles.activeChipText]}>
                      {level === undefined ? t('inventory.filters.allStatuses') : t(LEVEL_LABEL[level])}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Batch */}
          <View style={styles.filterSection}>
            <View style={styles.sectionHeaderRow}>
              <QrIcon size={16} color={adminColors.ink} />
              <Text style={styles.sectionTitle}>{t('inventory.filters.section.batch')}</Text>
            </View>
            <FilterDropdown
              placeholder={t('inventory.filters.batchPlaceholder')}
              options={batchChoices}
              value={criteria.batchId}
              open={openDropdown === 'batch'}
              onToggle={() => toggle('batch')}
              onSelect={(batchId) => update({ batchId })}
            />
          </View>

          {/* Storage Location */}
          <View style={styles.filterSection}>
            <View style={styles.sectionHeaderRow}>
              <PinIcon size={16} color={adminColors.ink} />
              <Text style={styles.sectionTitle}>{t('inventory.filters.section.location')}</Text>
            </View>
            <FilterDropdown
              placeholder={t('inventory.filters.locationPlaceholder')}
              options={locationChoices}
              value={criteria.storageLocation}
              open={openDropdown === 'location'}
              onToggle={() => toggle('location')}
              onSelect={(storageLocation) => update({ storageLocation })}
            />
          </View>

          {/* Results Count */}
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsText}>{t('inventory.filters.results')}</Text>
            <Text style={styles.resultsCount}>
              {movements === undefined ? ADMIN_NO_VALUE : t('inventory.filters.resultsCount', { count: results.length })}
            </Text>
          </View>

          {/* Result cards: the matching ledger rows; one card of dashes when there are none. */}
          {shown.length === 0 ? (
            <ResultCard movement={undefined} />
          ) : (
            shown.map((movement) => <ResultCard key={movement.id} movement={movement} />)
          )}

          {/* Load More Link */}
          <TouchableOpacity
            style={styles.loadMoreBtn}
            activeOpacity={0.7}
            disabled={!hasMore}
            onPress={() => setVisibleCount((count) => count + PAGE_SIZE)}
          >
            <Text style={styles.loadMoreText}>
              {hasMore ? t('inventory.filters.loadMore') : t('inventory.filters.noMore')}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 16 }} />
        </ScrollView>

        {/* Sticky Action Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.applyButton}
            onPress={() => onApply?.(criteria)}
            activeOpacity={0.8}
          >
            <FunnelFilterIcon size={18} color={adminColors.onBrand} />
            <Text style={styles.applyButtonText}>{t('inventory.filters.apply')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.clearButton}
            onPress={clearAll}
            activeOpacity={0.8}
          >
            <Text style={styles.clearButtonText}>{t('inventory.filters.clearAll')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

/** One result card in the design's layout; every field the row lacks shows the dash. */
function ResultCard({ movement }: { movement: StockMovementRow | undefined }) {
  const incoming = movement?.direction === 'in';
  const subtitle =
    movement === undefined
      ? ADMIN_NO_VALUE
      : t('inventory.filters.rowSubtitle', {
          grade: movement.gradeLabel ?? ADMIN_NO_VALUE,
          batch: movement.batchCode ?? ADMIN_NO_VALUE,
        });
  return (
    <View style={styles.resultCard}>
      <View style={styles.resultCardTop}>
        <Text style={styles.resultItemName}>{movement?.productName ?? ADMIN_NO_VALUE}</Text>
        <View style={[styles.receiptBadge, !incoming && { backgroundColor: adminColors.info.bg }]}>
          <Text style={[styles.receiptBadgeText, !incoming && { color: adminColors.info.text }]}>
            {movement === undefined ? ADMIN_NO_VALUE : movement.typeLabel.toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={styles.resultItemSubtitle}>{subtitle}</Text>

      <View style={styles.resultStatsRow}>
        <View style={styles.resultStatCol}>
          <Text style={styles.resultStatLabel}>{t('inventory.filters.quantity')}</Text>
          <Text style={styles.resultStatQuantity}>{nonEmpty(movement?.deltaText)}</Text>
        </View>
        <View style={styles.resultStatCol}>
          <Text style={styles.resultStatLabel}>{t('inventory.filters.ref')}</Text>
          <Text style={styles.resultStatRef}>
            {movement === undefined ? ADMIN_NO_VALUE : movementReference(movement.refType, movement.refId) ?? ADMIN_NO_VALUE}
          </Text>
        </View>
      </View>

      <View style={styles.resultTimeRow}>
        <Text style={styles.resultTimeText}>{nonEmpty(movement?.performedAt)}</Text>
      </View>
    </View>
  );
}

function nonEmpty(value: string | undefined): string {
  return value === undefined || value === '' ? ADMIN_NO_VALUE : value;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: adminColors.brand,
  },
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  content: {
    flex: 1,
    paddingTop: 8,
  },
  headerClearAll: {
    ...adminType.sectionHead,
    color: adminColors.onBrand,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  searchInput: {
    ...adminType.body,
    flex: 1,
    marginLeft: 8,
    color: adminColors.ink,
  },
  filterSection: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginLeft: 6,
  },
  // Warehouse Box - soft peach tint with orange border
  warehouseBox: {
    backgroundColor: adminColors.brandTint,
    borderWidth: 1,
    borderColor: adminColors.brand,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  warehouseLockIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  warehouseText: {
    ...adminType.rowMeta,
    flex: 1,
    lineHeight: 16,
    color: adminColors.brandDeep,
  },
  warehouseTextBold: {
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  dropdown: {
    backgroundColor: adminColors.card,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  optionList: {
    marginTop: adminSpacing.sm,
  },
  dropdownPlaceholder: {
    ...adminType.body,
    color: adminColors.muted,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: adminColors.card,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  activeChip: {
    backgroundColor: adminColors.brandTint,
    borderColor: adminColors.brand,
    borderWidth: 1.5,
  },
  chipText: {
    ...adminType.rowTitle,
    color: adminColors.muted,
  },
  activeChipText: {
    color: adminColors.brand,
    fontWeight: '700',
  },
  dateLabel: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: 8,
  },
  dateInput: {
    backgroundColor: adminColors.card,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  dateInputValue: {
    ...adminType.body,
    color: adminColors.ink,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 16,
  },
  resultsText: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  resultsCount: {
    ...adminType.body,
    color: adminColors.muted,
  },
  resultCard: {
    backgroundColor: adminColors.card,
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    marginBottom: 12,
  },
  resultCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  resultItemName: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  receiptBadge: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  receiptBadgeText: {
    ...adminType.caption,
    color: adminColors.success.text,
    letterSpacing: 0.5,
  },
  resultItemSubtitle: {
    ...adminType.body,
    color: adminColors.muted,
    marginBottom: 14,
  },
  resultStatsRow: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 8,
  },
  resultStatCol: {},
  resultStatLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: 2,
  },
  resultStatQuantity: {
    ...adminType.sectionHead,
    color: adminColors.success.text,
  },
  resultStatRef: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  resultTimeRow: {
    alignItems: 'flex-end',
    marginTop: 2,
  },
  resultTimeText: {
    ...adminType.rowMeta,
    color: adminColors.brandDeep,
  },
  loadMoreBtn: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  loadMoreText: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    gap: 10,
  },
  applyButton: {
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    gap: 8,
  },
  applyButtonText: {
    ...adminType.sectionHead,
    color: adminColors.onBrand,
  },
  clearButton: {
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
  },
  clearButtonText: {
    ...adminType.sectionHead,
    color: adminColors.brand,
  },
});

