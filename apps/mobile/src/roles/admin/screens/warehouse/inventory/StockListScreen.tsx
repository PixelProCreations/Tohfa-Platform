// Design id: M3S02
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, SafeAreaView, RefreshControl } from 'react-native';
import { t } from '../../../i18n';
import { formatKg } from '../../../money/quantity';
import { adminColors, adminShadow, adminSpacing, adminType } from '../../../theme';
import { isAreaAvailable } from '../availability';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import type { InventoryLiveStateProps, InventoryScreenBaseProps, ProductStock, StockLevel } from './types';
import { WarehouseSelector } from './WarehouseSelector';
import Svg, { Path } from 'react-native-svg';
import { SWAHeader } from '../../swa/components';

export interface StockListScreenProps extends InventoryScreenBaseProps, InventoryLiveStateProps {
  initialTab?: 'Stock' | 'Ledger' | 'Allocation' | 'Verify' | undefined;
  /** Stock per product (useStockSummary), most available first. */
  products?: readonly ProductStock[] | undefined;
  /** False when a walk stopped early or a quantity could not be read. */
  complete?: boolean | undefined;
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
}: StockListScreenProps) {
  const [activeTab, setActiveTab] = useState<'Stock' | 'Ledger' | 'Allocation' | 'Verify'>(initialTab);
  const canViewLedger = can('inventory.stock_ledger.view_own') || can('inventory.stock_ledger.view_all');
  // Stock counts (BR-107) are shown only with inventory.stock_verification.perform (availability.ts).
  const canVerify = isAreaAvailable('stockCounts', can);
  const [searchQuery, setSearchQuery] = useState('');

  const view = queryViewState({ isLoading, error, itemCount: products.length });
  const stockItems = matching(products, searchQuery);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <SWAHeader 
          title="Stock List"
          onBack={onBack}
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
            <Text style={[styles.tabCardText, activeTab === 'Stock' && styles.activeTabCardText]}>Stock</Text>
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
            <Text style={[styles.tabCardText, activeTab === 'Ledger' && styles.activeTabCardText]}>Ledger</Text>
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
            <Text style={[styles.tabCardText, activeTab === 'Allocation' && styles.activeTabCardText]}>Allocation</Text>
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
            <Text style={[styles.tabCardText, activeTab === 'Verify' && styles.activeTabCardText]}>Verify</Text>
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
              placeholder="Search product, crop or batch"
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
                      <Text style={styles.stockStatLabel}>Available</Text>
                      <Text style={styles.stockStatValue}>{formatKg(item.availableGrams)}</Text>
                    </View>
                    <View style={styles.stockStat}>
                      <Text style={styles.stockStatLabel}>Reserved</Text>
                      <Text style={styles.stockStatValue}>{formatKg(item.reservedGrams)}</Text>
                    </View>
                    <View style={styles.stockStat}>
                      <Text style={styles.stockStatLabel}>Allocated</Text>
                      <Text style={styles.stockStatValue}>
                        {item.allocatedGrams === null ? t('inventory.noValue') : formatKg(item.allocatedGrams)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.viewLinkRow}>
                    <Text style={styles.viewLink}>View</Text>
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
});

