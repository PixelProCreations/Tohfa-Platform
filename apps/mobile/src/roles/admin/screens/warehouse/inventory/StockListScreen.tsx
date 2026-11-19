// Design id: M3S02
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from '@tohfa/mobile-ui';
import { t } from '../../../i18n';
import { formatKg } from '../../../money/quantity';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import { ADMIN_NO_VALUE } from '../../../utils/noValue';
import { warehouseShortName } from '../../dashboard/mappers_mainDashboard';
import { useFlowBack } from '../useFlowBack';
import { isAreaAvailable } from '../availability';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import type { InventoryLiveStateProps, InventoryScreenBaseProps, ProductStock, StockLevel } from './types';
import type { ConsolidatedStock } from './useInventoryData';
import { WarehouseSelector } from './WarehouseSelector';
import Svg, { Path } from 'react-native-svg';
import { SWAHeader } from '../../swa/components';

export interface StockListScreenProps extends InventoryScreenBaseProps, InventoryLiveStateProps {
  initialTab?: 'Stock' | 'Ledger' | 'Allocation' | 'Verify' | undefined;
  /** Stock per product (useStockSummary), most available first. */
  products?: readonly ProductStock[] | undefined;
  /** False when a walk stopped early or a quantity could not be read. */
  complete?: boolean | undefined;
  /** Main consolidated views: stock over every warehouse in scope (useConsolidatedStock). */
  consolidated?: ConsolidatedStock | undefined;
}

export type MainStockView = 'consolidated_list' | 'consolidated_detail' | 'distribution' | 'availability' | 'comparison' | 'warehouse_stock';

const MAIN_VIEW_TITLE = {
  consolidated_list: 'inventory.stockList.main.title.consolidatedList',
  consolidated_detail: 'inventory.stockList.main.title.consolidatedDetail',
  distribution: 'inventory.stockList.main.title.distribution',
  availability: 'inventory.stockList.main.title.availability',
  comparison: 'inventory.stockList.main.title.comparison',
} as const satisfies Record<Exclude<MainStockView, 'warehouse_stock'>, string>;

/** The design's table pairs two warehouses per column; a missing slot shows the dash. */
const CONSOLIDATED_MIN_SLOTS = 4;

type WarehouseSlot = { warehouseId: string; name: string } | undefined;

/** Warehouses of the Main selector as table slots, in pairs, padded to the design's four. */
function warehousePairs(options: readonly { warehouseId?: string | undefined; warehouseName?: string | undefined }[]): WarehouseSlot[][] {
  const slots: WarehouseSlot[] = [];
  for (const option of options) {
    if (option.warehouseId === undefined) continue;
    slots.push({ warehouseId: option.warehouseId, name: warehouseShortName(option.warehouseName ?? option.warehouseId) });
  }
  while (slots.length < CONSOLIDATED_MIN_SLOTS || slots.length % 2 !== 0) slots.push(undefined);
  const pairs: WarehouseSlot[][] = [];
  for (let i = 0; i < slots.length; i += 2) pairs.push([slots[i], slots[i + 1]]);
  return pairs;
}

const LEVEL_LABEL = {
  inStock: 'inventory.level.inStock',
  low: 'inventory.level.low',
  out: 'inventory.level.out',
} as const satisfies Record<StockLevel, string>;

/** Products whose name or grade contains the search text (case-insensitive). */
function matching(products: readonly ProductStock[], query: string): readonly ProductStock[] {
  const needle = query.trim().toLowerCase();
  if (needle === '') return products;
  return products.filter(
    (p) => p.productName.toLowerCase().includes(needle) || p.gradeLabel.toLowerCase().includes(needle),
  );
}

// ─── Main Warehouse Consolidated Stock Icons ────────────────────────────────

function MainBackArrowIcon({ color = adminColors.onBrand }: { color?: string }) {
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

function MainFilterSlidersIcon({ color = adminColors.onBrand }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M4 6h16M4 12h16M4 18h16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M8 4v4M16 10v4M10 16v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function DistributionIcon({ color = adminColors.brand }: { color?: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M6 20v-6M12 20V5M18 20v-9" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

function AvailabilityIcon({ color = adminColors.brand }: { color?: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5v1.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 9V7.5z"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path
        d="M5 10.5v7A1.5 1.5 0 0 0 6.5 19h11a1.5 1.5 0 0 0 1.5-1.5v-7"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path d="M10 13h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function ComparisonIcon({ color = adminColors.brand }: { color?: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M12 4v16M8 20h8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M5 8l7-3 7 3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 8l-2.5 5h5L5 8zM19 8l-2.5 5h5L19 8z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
    </Svg>
  );
}

function ProductDetailIcon({ color = adminColors.brand }: { color?: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20.5c-4.5 0-7.5-3.5-7.5-8a7.5 7.5 0 0 1 15 0c0 4.5-3 8-7.5 8z"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path
        d="M12 5V2.5M10.5 3.5c1.2-1 3.2-1 4 0"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ViewBatchesIcon({ color = adminColors.brand }: { color?: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 5.5A1.5 1.5 0 0 1 6.5 4h11A1.5 1.5 0 0 1 19 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 18.5v-13z"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path d="M8 8.5h1.5M8 12h1.5M8 15.5h1.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M12 8.5h4M12 12h4M12 15.5h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function ViewLedgerIcon({ color = adminColors.brand }: { color?: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 3.5h12a1 1 0 0 1 1 1v15.5l-2-1-2 1-2-1-2 1-2-1-2 1-2-1-1 1V4.5a1 1 0 0 1 1-1z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <Path d="M9 8h6M9 11.5h6M9 15h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Custom Icons matching Design Mockup (Pure Path - zero Hermes/SVG errors) ─

function StockTabBoxIcon({ color = adminColors.ink }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      {/* Top lid */}
      <Path
        d="M5 4.5A1.5 1.5 0 0 1 6.5 3h11A1.5 1.5 0 0 1 19 4.5v2A1.5 1.5 0 0 1 17.5 8h-11A1.5 1.5 0 0 1 5 6.5v-2z"
        stroke={color}
        strokeWidth="1.8"
      />
      {/* Bottom crate */}
      <Path
        d="M5.5 8h13a1 1 0 0 1 1 1v10.5a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 4.5 19.5V9a1 1 0 0 1 1-1z"
        stroke={color}
        strokeWidth="1.8"
      />
      {/* Handle slot */}
      <Path
        d="M9.5 13.5h5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function LedgerTabIcon({ color = adminColors.ink }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 3.5l2 1.5 2-1.5 2 1.5 2-1.5 2 1.5 2-1.5 2 1.5V20.5H6V3.5z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 9h6M9 12.5h6M9 16h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function AllocationTabIcon({ color = adminColors.ink }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20z"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path d="M12 2v20" stroke={color} strokeWidth="1.8" />
      <Path d="M12 12h10" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function VerifyTabIcon({ color = adminColors.ink }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      {/* Outer rounded card */}
      <Path
        d="M5 4.5A1.5 1.5 0 0 1 6.5 3h11A1.5 1.5 0 0 1 19 4.5v15a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-15z"
        stroke={color}
        strokeWidth="1.8"
      />
      {/* Checkbox box */}
      <Path
        d="M7 6.5h4.5v4.5H7z"
        stroke={color}
        strokeWidth="1.4"
      />
      {/* Checkmark inside checkbox */}
      <Path
        d="M8 8.8l1 1 2-2"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Text lines */}
      <Path d="M14 7.5h2.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Path d="M14 10h2.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Path d="M7 14.5h10" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Path d="M7 17.5h6" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

function SearchIcon({ color = adminColors.muted }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function StockListScreen({
  scope,
  can,
  onNavigate,
  onBack,
  initialTab = 'Stock',
  warehouseOptions,
  selectedWarehouseId,
  onSelectWarehouse,
  products = [],
  complete = true,
  isLoading = false,
  error,
  onRetry,
  onRefresh,
  isRefreshing = false,
  routeParams,
  consolidated,
}: StockListScreenProps) {
  const isSub = scope.warehouseId !== undefined;
  // Main opens on the consolidated table; a warehouse link (view 'warehouse' or a warehouseId) opens that warehouse's list.
  const paramWarehouseId: unknown = routeParams?.warehouseId;
  const initialMainView: MainStockView =
    routeParams?.view === 'warehouse' || (typeof paramWarehouseId === 'string' && paramWarehouseId !== '' && !isSub)
      ? 'warehouse_stock'
      : 'consolidated_list';
  const [mainView, setMainView] = useState<MainStockView>(initialMainView);
  const [selectedProductKey, setSelectedProductKey] = useState<string | undefined>(undefined);

  // A warehouse link from the Main dashboard picks that warehouse in the flow's selector.
  useEffect(() => {
    if (!isSub && typeof paramWarehouseId === 'string' && paramWarehouseId !== '') onSelectWarehouse?.(paramWarehouseId);
    // Once, for the link this screen was opened with.
  }, []);

  const handleMainBack = () => {
    if (mainView === 'distribution' || mainView === 'availability' || mainView === 'comparison') {
      setMainView('consolidated_detail');
    } else if (mainView === 'consolidated_detail') {
      setMainView('consolidated_list');
    } else {
      onBack?.();
    }
  };

  useFlowBack(() => {
    if (!isSub && mainView !== 'consolidated_list' && mainView !== 'warehouse_stock') {
      handleMainBack();
      return true;
    }
    return false;
  });

  const [activeTab, setActiveTab] = useState<'Stock' | 'Ledger' | 'Allocation' | 'Verify'>(initialTab);
  const canViewLedger = can('inventory.stock_ledger.view_own') || can('inventory.stock_ledger.view_all');
  // Stock counts (BR-107) are shown only with inventory.stock_verification.perform (availability.ts).
  const canVerify = isAreaAvailable('stockCounts', can);
  const [searchQuery, setSearchQuery] = useState('');

  const view = queryViewState({ isLoading, error, itemCount: products.length });
  const stockItems = matching(products, searchQuery);

  if (!isSub && mainView !== 'warehouse_stock') {
    const mainProducts = consolidated?.products ?? [];
    const mainState = queryViewState({
      isLoading: consolidated?.isLoading ?? isLoading,
      error: consolidated === undefined ? error : consolidated.error,
      itemCount: mainProducts.length,
    });
    const pairs = warehousePairs(warehouseOptions ?? []);
    const slots = pairs.flat().filter((slot): slot is NonNullable<WarehouseSlot> => slot !== undefined);
    const selected = mainProducts.find((p) => p.key === selectedProductKey);
    const selectedLabel = selected === undefined ? ADMIN_NO_VALUE : `${selected.productName} ${selected.gradeLabel}`;
    /** Available grams of a product in one warehouse; a warehouse with no ACTIVE batch of it holds 0. */
    const gramsIn = (productKey: string, slot: WarehouseSlot): number | null =>
      slot === undefined ? null : consolidated?.availableByWarehouse.get(productKey)?.get(slot.warehouseId) ?? 0;
    const kgOrDash = (grams: number | null) => (grams === null ? ADMIN_NO_VALUE : formatKg(grams));
    const slotName = (slot: WarehouseSlot) => (slot === undefined ? ADMIN_NO_VALUE : slot.name.toUpperCase());

    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.mainContainer}>
          {/* Header */}
          <View style={styles.mainHeader}>
            <View style={styles.mainHeaderTopRow}>
              <TouchableOpacity
                style={styles.mainBackBtn}
                onPress={handleMainBack}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                activeOpacity={0.7}
              >
                <MainBackArrowIcon color={adminColors.onBrand} />
              </TouchableOpacity>
              <Text style={styles.mainHeaderTitle}>{t(MAIN_VIEW_TITLE[mainView])}</Text>
              <View style={styles.mainHeaderSpacer} />
              <TouchableOpacity style={styles.mainFilterBtn} activeOpacity={0.7}>
                <MainFilterSlidersIcon color={adminColors.onBrand} />
              </TouchableOpacity>
            </View>
            <Text style={styles.mainHeaderSubtitle}>{t('inventory.stockList.main.subtitle')}</Text>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.mainScroll}
            contentContainerStyle={styles.mainContentContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              consolidated !== undefined ? (
                <RefreshControl
                  refreshing={consolidated.isRefreshing}
                  onRefresh={consolidated.refresh}
                  colors={[adminColors.brand]}
                  tintColor={adminColors.brand}
                />
              ) : undefined
            }
          >
            {mainView === 'consolidated_list' && mainState === 'loading' ? <AdminLoadingState /> : null}
            {mainView === 'consolidated_list' && mainState === 'error' ? (
              <AdminErrorState error={consolidated?.error ?? error} onRetry={consolidated?.refresh ?? onRetry} />
            ) : null}
            {mainView === 'consolidated_list' && mainState === 'ready' && consolidated?.complete === false ? (
              <Text style={styles.incompleteNote}>{t('inventory.totals.incomplete')}</Text>
            ) : null}
            {mainView === 'consolidated_list' && (mainState === 'ready' || mainState === 'empty') && (
              <View style={styles.tableCard}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.tableColHeader, styles.colProduct]}>{t('inventory.stockList.main.colProduct')}</Text>
                  {pairs.map((pair, index) => (
                    <Text key={index} style={[styles.tableColHeader, styles.colPair]}>
                      {`${slotName(pair[0])}/${slotName(pair[1])}`}
                    </Text>
                  ))}
                  <Text style={[styles.tableColHeader, styles.colTotal]}>{t('inventory.stockList.main.colTotal')}</Text>
                </View>
                {mainState === 'empty' ? <AdminEmptyState title={t('inventory.empty.stock')} /> : null}
                {mainProducts.map((product) => (
                  <TouchableOpacity
                    key={product.key}
                    style={styles.tableDataRow}
                    activeOpacity={0.7}
                    onPress={() => {
                      setSelectedProductKey(product.key);
                      setMainView('consolidated_detail');
                    }}
                  >
                    <Text style={[styles.tableCell, styles.colProduct]}>{`${product.productName} ${product.gradeLabel}`}</Text>
                    {pairs.map((pair, index) => (
                      <Text key={index} style={[styles.tableCell, styles.colPair]}>
                        {`${kgOrDash(gramsIn(product.key, pair[0]))}/${kgOrDash(gramsIn(product.key, pair[1]))}`}
                      </Text>
                    ))}
                    <Text style={[styles.tableCell, styles.colTotal]}>{formatKg(product.availableGrams)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {mainView === 'consolidated_detail' && (
              <View>
                <Text style={styles.mainSectionTitle}>
                  {t('inventory.stockList.main.detailTitle', { product: selectedLabel })}
                </Text>
                <View style={styles.detailGrid}>
                  <TouchableOpacity style={styles.detailCard} activeOpacity={0.7} onPress={() => setMainView('distribution')}>
                    <DistributionIcon color={adminColors.brand} />
                    <Text style={styles.detailCardLabel}>{t('inventory.stockList.main.card.distribution')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.detailCard} activeOpacity={0.7} onPress={() => setMainView('availability')}>
                    <AvailabilityIcon color={adminColors.brand} />
                    <Text style={styles.detailCardLabel}>{t('inventory.stockList.main.card.availability')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.detailCard} activeOpacity={0.7} onPress={() => setMainView('comparison')}>
                    <ComparisonIcon color={adminColors.brand} />
                    <Text style={styles.detailCardLabel}>{t('inventory.stockList.main.card.comparison')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.detailCard}
                    activeOpacity={0.7}
                    disabled={selected === undefined}
                    onPress={() => {
                      if (selected !== undefined) onNavigate?.('M3S03', { cropId: selected.cropId, grade: selected.grade });
                    }}
                  >
                    <ProductDetailIcon color={adminColors.brand} />
                    <Text style={styles.detailCardLabel}>{t('inventory.stockList.main.card.productDetail')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.detailCard}
                    activeOpacity={0.7}
                    disabled={selected === undefined}
                    onPress={() => {
                      if (selected !== undefined) onNavigate?.('M3S04', { cropId: selected.cropId, grade: selected.grade });
                    }}
                  >
                    <ViewBatchesIcon color={adminColors.brand} />
                    <Text style={styles.detailCardLabel}>{t('inventory.stockList.main.card.viewBatches')}</Text>
                  </TouchableOpacity>

                  {/* The ledger route needs a ledger grant; without one the card is drawn but inert. */}
                  <TouchableOpacity
                    style={styles.detailCard}
                    activeOpacity={0.7}
                    disabled={!canViewLedger}
                    onPress={() => onNavigate?.('M3S06')}
                  >
                    <ViewLedgerIcon color={adminColors.brand} />
                    <Text style={styles.detailCardLabel}>{t('inventory.stockList.main.card.viewLedger')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {mainView === 'distribution' && (
              <View>
                <Text style={styles.mainSectionTitle}>
                  {t('inventory.stockList.main.distributionTitle', { product: selectedLabel })}
                </Text>
                <View style={styles.distListCard}>
                  {(slots.length > 0 ? slots : [undefined]).map((slot, index) => (
                    <View key={slot?.warehouseId ?? index} style={styles.distRow}>
                      <Text style={styles.distWarehouseName}>{slot === undefined ? ADMIN_NO_VALUE : slot.name}</Text>
                      <Text style={styles.distWarehouseQty}>
                        {selected === undefined ? ADMIN_NO_VALUE : kgOrDash(gramsIn(selected.key, slot))}
                      </Text>
                    </View>
                  ))}
                  <View style={[styles.distRow, styles.distRowLast]}>
                    <Text style={styles.distTotalLabel}>{t('inventory.stockList.main.total')}</Text>
                    <Text style={styles.distTotalQty}>
                      {selected === undefined ? ADMIN_NO_VALUE : formatKg(selected.availableGrams)}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {mainView === 'availability' && (
              <View>
                <Text style={styles.mainSectionTitle}>{t('inventory.stockList.main.availabilityTitle')}</Text>
                <View style={styles.availCard}>
                  <View style={styles.availRow}>
                    <View style={styles.availCol}>
                      <Text style={styles.availLabel}>{t('inventory.stockList.main.total')}</Text>
                      <Text style={styles.availValue}>{ADMIN_NO_VALUE}</Text>
                    </View>
                    <View style={styles.availCol}>
                      <Text style={styles.availLabel}>{t('inventory.stockList.available')}</Text>
                      <Text style={styles.availValue}>
                        {selected === undefined ? ADMIN_NO_VALUE : formatKg(selected.availableGrams)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.availRow}>
                    <View style={styles.availCol}>
                      <Text style={styles.availLabel}>{t('inventory.stockList.reserved')}</Text>
                      <Text style={styles.availValue}>
                        {selected === undefined ? ADMIN_NO_VALUE : formatKg(selected.reservedGrams)}
                      </Text>
                    </View>
                    <View style={styles.availCol}>
                      <Text style={styles.availLabel}>{t('inventory.stockList.allocated')}</Text>
                      <Text style={styles.availValue}>{kgOrDash(selected?.allocatedGrams ?? null)}</Text>
                    </View>
                  </View>

                  <View style={[styles.availRow, styles.availRowLast]}>
                    <View style={styles.availCol}>
                      <Text style={styles.availLabel}>{t('inventory.stockList.main.consumed')}</Text>
                      <Text style={styles.availValue}>{ADMIN_NO_VALUE}</Text>
                    </View>
                    <View style={styles.availCol} />
                  </View>
                </View>
              </View>
            )}

            {mainView === 'comparison' && (
              <View>
                <Text style={styles.mainSectionTitle}>
                  {t('inventory.stockList.main.comparisonTitle', { product: selectedLabel })}
                </Text>
                <View style={styles.compListCard}>
                  {(slots.length > 0 ? slots : [undefined]).map((slot, index, all) => (
                    <View
                      key={slot?.warehouseId ?? index}
                      style={[styles.compRow, index === all.length - 1 && styles.compRowLast]}
                    >
                      <Text style={styles.compWarehouseName}>{slot === undefined ? ADMIN_NO_VALUE : slot.name}</Text>
                      <Text style={styles.compWarehouseStat}>
                        {t('inventory.stockList.main.comparisonStat', {
                          qty: selected === undefined ? ADMIN_NO_VALUE : kgOrDash(gramsIn(selected.key, slot)),
                          cap: ADMIN_NO_VALUE,
                        })}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <SWAHeader 
          title={t('inventory.stockList.title')}
          onBack={onBack}
          showFilter={true}
          warehouseLocked={scope.warehouseId !== undefined}
          warehouseName={scope.warehouseName}
          bottomContent={
            <WarehouseSelector
              scope={scope}
              options={warehouseOptions}
              selectedId={selectedWarehouseId}
              onSelect={(id) => onSelectWarehouse?.(id)}
            />
          }
        />

        {/* 4 Rounded Tab Cards (positioned UP, directly below header matching reference) */}
        <View style={styles.tabCardsRow}>
          {/* Stock Tab */}
          <TouchableOpacity 
            style={[styles.tabCard, activeTab === 'Stock' && styles.activeTabCard]}
            onPress={() => setActiveTab('Stock')}
            activeOpacity={0.7}
          >
            <StockTabBoxIcon color={activeTab === 'Stock' ? adminColors.onBrand : adminColors.ink} />
            <Text style={[styles.tabCardText, activeTab === 'Stock' && styles.activeTabCardText]}>{t('inventory.stockList.tab.stock')}</Text>
          </TouchableOpacity>

          {/* Ledger Tab (only with a ledger grant) */}
          {canViewLedger ? (
          <TouchableOpacity 
            style={[styles.tabCard, activeTab === 'Ledger' && styles.activeTabCard]}
            onPress={() => {
              setActiveTab('Ledger');
              onNavigate?.('M3S06');
            }}
            activeOpacity={0.7}
          >
            <LedgerTabIcon color={activeTab === 'Ledger' ? adminColors.onBrand : adminColors.ink} />
            <Text style={[styles.tabCardText, activeTab === 'Ledger' && styles.activeTabCardText]}>{t('inventory.stockList.tab.ledger')}</Text>
          </TouchableOpacity>
          ) : null}

          {/* Allocation Tab */}
          <TouchableOpacity 
            style={[styles.tabCard, activeTab === 'Allocation' && styles.activeTabCard]}
            onPress={() => {
              setActiveTab('Allocation');
              onNavigate?.('M3S07');
            }}
            activeOpacity={0.7}
          >
            <AllocationTabIcon color={activeTab === 'Allocation' ? adminColors.onBrand : adminColors.ink} />
            <Text style={[styles.tabCardText, activeTab === 'Allocation' && styles.activeTabCardText]}>{t('inventory.stockList.tab.allocation')}</Text>
          </TouchableOpacity>

          {/* Verify Tab (gated on stock counts, availability.ts) */}
          {canVerify ? (
          <TouchableOpacity 
            style={[styles.tabCard, activeTab === 'Verify' && styles.activeTabCard]}
            onPress={() => {
              setActiveTab('Verify');
              onNavigate?.('M3S10');
            }}
            activeOpacity={0.7}
          >
            <VerifyTabIcon color={activeTab === 'Verify' ? adminColors.onBrand : adminColors.ink} />
            <Text style={[styles.tabCardText, activeTab === 'Verify' && styles.activeTabCardText]}>{t('inventory.stockList.tab.verify')}</Text>
          </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                colors={[adminColors.brand]}
                tintColor={adminColors.brand}
              />
            ) : undefined
          }
        >
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <SearchIcon color={adminColors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('inventory.stockList.searchPlaceholder')}
              placeholderTextColor={adminColors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {view === 'loading' ? <AdminLoadingState /> : null}
          {view === 'error' ? <AdminErrorState error={error} onRetry={onRetry} /> : null}
          {view === 'empty' ? <AdminEmptyState title={t('inventory.empty.stock')} /> : null}
          {view === 'ready' && stockItems.length === 0 ? <AdminEmptyState title={t('inventory.empty.search')} /> : null}
          {view === 'ready' && !complete ? <Text style={styles.incompleteNote}>{t('inventory.totals.incomplete')}</Text> : null}

          {/* Stock Items */}
          {stockItems.map((item) => {
            const isHealthy = item.level === 'inStock';
            return (
              <TouchableOpacity
                key={item.key}
                style={styles.stockCard}
                onPress={() => onNavigate?.('M3S03', { cropId: item.cropId, grade: item.grade })}
                activeOpacity={0.7}
              >
                <View style={styles.stockHeader}>
                  <View style={styles.stockTitleColumn}>
                    <Text style={styles.stockName}>{item.productName}</Text>
                    <Text style={styles.stockGrade}>{item.gradeLabel}</Text>
                  </View>
                  <View style={[styles.statusBadge, isHealthy ? styles.healthyBadge : styles.alertBadge]}>
                    <Text style={[styles.statusBadgeText, isHealthy ? styles.healthyBadgeText : styles.alertBadgeText]}>
                      {t(LEVEL_LABEL[item.level])}
                    </Text>
                  </View>
                </View>

                {/* Metrics on left, View > on right */}
                <View style={styles.stockBottomRow}>
                  <View style={styles.stockStatsGroup}>
                    <View style={styles.stockStat}>
                      <Text style={styles.stockStatLabel}>{t('inventory.stockList.available')}</Text>
                      <Text style={styles.stockStatValue}>{formatKg(item.availableGrams)}</Text>
                    </View>
                    <View style={styles.stockStat}>
                      <Text style={styles.stockStatLabel}>{t('inventory.stockList.reserved')}</Text>
                      <Text style={styles.stockStatValue}>{formatKg(item.reservedGrams)}</Text>
                    </View>
                    <View style={styles.stockStat}>
                      <Text style={styles.stockStatLabel}>{t('inventory.stockList.allocated')}</Text>
                      <Text style={styles.stockStatValue}>
                        {item.allocatedGrams === null ? t('inventory.noValue') : formatKg(item.allocatedGrams)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.viewLinkRow}>
                    <Text style={styles.viewLink}>{t('inventory.stockList.view')}</Text>
                    <Text style={styles.viewChevron}>›</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  incompleteNote: {
    ...adminType.caption,
    color: adminColors.warning.text,
    marginBottom: adminSpacing.sm,
  },
  safeArea: {
    flex: 1,
    backgroundColor: adminColors.brand,
  },
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  tabCardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
    gap: 8,
  },
  tabCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    ...adminShadow.sm,
  },
  activeTabCard: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  tabCardText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  activeTabCardText: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 12,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  searchInput: {
    ...adminType.body,
    flex: 1,
    marginLeft: 10,
    color: adminColors.ink,
  },
  stockCard: {
    backgroundColor: adminColors.card,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stockTitleColumn: {
    flex: 1,
  },
  stockName: {
    ...adminType.title,
    color: adminColors.ink,
  },
  stockGrade: {
    ...adminType.body,
    color: adminColors.muted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    ...adminType.caption,
  },
  healthyBadge: {
    backgroundColor: adminColors.success.bg,
  },
  healthyBadgeText: {
    color: adminColors.success.text,
  },
  alertBadge: {
    backgroundColor: adminColors.danger.bg,
  },
  alertBadgeText: {
    color: adminColors.danger.text,
  },
  stockBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  stockStatsGroup: {
    flexDirection: 'row',
    gap: 20,
  },
  stockStat: {
    minWidth: 54,
  },
  stockStatLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: 3,
  },
  stockStatValue: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  viewLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingBottom: 2,
  },
  viewLink: {
    ...adminType.sectionHead,
    color: adminColors.brand,
  },
  viewChevron: {
    ...adminType.sectionHead,
    color: adminColors.brand,
    marginTop: -1,
  },
  // Main Warehouse Consolidated Stock styles
  mainContainer: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  mainHeader: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.lg,
  },
  mainHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  mainBackBtn: {
    marginRight: 10,
    padding: 2,
  },
  mainHeaderTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.3,
  },
  mainHeaderSpacer: {
    flex: 1,
  },
  mainFilterBtn: {
    width: 38,
    height: 38,
    borderRadius: adminRadius.sm,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: adminColors.onBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainHeaderSubtitle: {
    ...adminType.body,
    color: adminColors.onBrand,
    opacity: 0.92,
    fontWeight: '500',
    paddingLeft: 2,
  },
  mainScroll: {
    flex: 1,
  },
  mainContentContainer: {
    padding: adminSpacing.lg,
    paddingBottom: 32,
  },
  mainSectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.lg,
  },
  tableCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    overflow: 'hidden',
    ...adminShadow.sm,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: adminColors.brandTint,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.lg,
    alignItems: 'center',
  },
  tableColHeader: {
    ...adminType.caption,
    color: adminColors.muted,
    letterSpacing: 0.5,
  },
  tableDataRow: {
    flexDirection: 'row',
    paddingVertical: adminSpacing.lg,
    paddingHorizontal: adminSpacing.lg,
    alignItems: 'center',
    backgroundColor: adminColors.card,
  },
  tableCell: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  colProduct: {
    flex: 1.4,
  },
  colPair: {
    flex: 1,
    textAlign: 'center',
  },
  colTotal: {
    flex: 1,
    textAlign: 'right',
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: adminSpacing.md,
  },
  detailCard: {
    width: '48%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 22,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  detailCardLabel: {
    marginTop: 10,
    ...adminType.rowTitle,
    color: adminColors.ink,
    textAlign: 'center',
  },
  distListCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: 4,
    ...adminShadow.sm,
  },
  distRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  distRowLast: {
    borderBottomWidth: 0,
  },
  distWarehouseName: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  distWarehouseQty: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  distTotalLabel: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
  },
  distTotalQty: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
  },
  availCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.xl,
    ...adminShadow.sm,
  },
  availRow: {
    flexDirection: 'row',
    marginBottom: adminSpacing.lg,
  },
  availRowLast: {
    marginBottom: 0,
  },
  availCol: {
    flex: 1,
  },
  availLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: 4,
  },
  availValue: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  compListCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: 4,
    ...adminShadow.sm,
  },
  compRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  compRowLast: {
    borderBottomWidth: 0,
  },
  compWarehouseName: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  compWarehouseStat: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
});
