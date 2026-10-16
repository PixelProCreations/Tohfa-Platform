import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, SafeAreaView } from 'react-native';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import type { InventoryScreenBaseProps } from './types';
import { WarehouseSelector } from './WarehouseSelector';
import Svg, { Path } from 'react-native-svg';
import { SWAHeader } from '../../swa/components';
import { useFlowBack } from '../useFlowBack';

export interface StockListScreenProps extends InventoryScreenBaseProps {
  initialTab?: 'Stock' | 'Ledger' | 'Allocation' | 'Verify';
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

export type MainStockView = 'consolidated_list' | 'consolidated_detail' | 'distribution' | 'availability' | 'comparison' | 'warehouse_stock';

export function StockListScreen({
  scope,
  can,
  onNavigate,
  onBack,
  initialTab = 'Stock',
  warehouseOptions,
  routeParams,
}: StockListScreenProps) {
  const isSub = scope.warehouseId !== undefined;
  const initialMainView: MainStockView =
    routeParams?.view === 'warehouse' || (!!routeParams?.warehouseId && !isSub)
      ? 'warehouse_stock'
      : 'consolidated_list';
  const [mainView, setMainView] = useState<MainStockView>(initialMainView);

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
  // Main (no warehouseId) may pick a warehouse; Sub is locked to its own.
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(
    (routeParams?.warehouseId as string | undefined) || scope.warehouseId || (isSub ? undefined : 'WH-OOTY')
  );
  const canViewLedger = can('inventory.stock_ledger.view_own') || can('inventory.stock_ledger.view_all');
  const [searchQuery, setSearchQuery] = useState('');

  const stockItems = [
    {
      id: 'tomato',
      name: 'Tomato',
      grade: 'Grade 1',
      status: 'Healthy Stock',
      available: '245 KG',
      reserved: '50 KG',
      allocated: '120 KG',
      detailProduct: 'Tomato G1',
    },
    {
      id: 'carrot',
      name: 'Carrot',
      grade: 'Grade 1',
      status: 'Low Stock',
      available: '12 KG',
      reserved: '0 KG',
      allocated: '0 KG',
      detailProduct: 'Carrot G1',
    },
    {
      id: 'beetroot',
      name: 'Beetroot',
      grade: 'Grade 1',
      status: 'Healthy Stock',
      available: '60 KG',
      reserved: '5 KG',
      allocated: '15 KG',
    },
    {
      id: 'spinach',
      name: 'Spinach',
      grade: 'Grade 2',
      status: 'Out of Stock',
      available: '0 KG',
      reserved: '0 KG',
      allocated: '0 KG',
    },
  ];

  if (!isSub && mainView !== 'warehouse_stock') {
    const getHeaderTitle = () => {
      switch (mainView) {
        case 'consolidated_list':
          return 'Consolidated Stock';
        case 'consolidated_detail':
          return 'Consolidated Detail';
        case 'distribution':
          return 'Distribution';
        case 'availability':
          return 'Availability';
        case 'comparison':
          return 'Comparison';
      }
    };

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
              <Text style={styles.mainHeaderTitle}>{getHeaderTitle()}</Text>
              <View style={{ flex: 1 }} />
              <TouchableOpacity
                style={styles.mainFilterBtn}
                onPress={() => onNavigate?.('M3S16')}
                activeOpacity={0.7}
              >
                <MainFilterSlidersIcon color={adminColors.onBrand} />
              </TouchableOpacity>
            </View>
            <Text style={styles.mainHeaderSubtitle}>Same product across all four warehouses</Text>
          </View>

          {/* Content */}
          <ScrollView style={styles.mainScroll} contentContainerStyle={styles.mainContentContainer} showsVerticalScrollIndicator={false}>
            {mainView === 'consolidated_list' && (
              <View style={styles.tableCard}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.tableColHeader, { flex: 1.4 }]}>PRODUCT</Text>
                  <Text style={[styles.tableColHeader, { flex: 1, textAlign: 'center' }]}>OOTY/COO</Text>
                  <Text style={[styles.tableColHeader, { flex: 1, textAlign: 'center' }]}>KOT/GUD</Text>
                  <Text style={[styles.tableColHeader, { flex: 1, textAlign: 'right' }]}>TOTAL</Text>
                </View>
                <TouchableOpacity
                  style={styles.tableDataRow}
                  activeOpacity={0.7}
                  onPress={() => setMainView('consolidated_detail')}
                >
                  <Text style={[styles.tableCell, { flex: 1.4 }]}>Tomato G1</Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>120/80</Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>50/40</Text>
                  <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>290 KG</Text>
                </TouchableOpacity>
              </View>
            )}

            {mainView === 'consolidated_detail' && (
              <View>
                <Text style={styles.mainSectionTitle}>Consolidated Stock Detail — Tomato Grade 1</Text>
                <View style={styles.detailGrid}>
                  <TouchableOpacity
                    style={styles.detailCard}
                    activeOpacity={0.7}
                    onPress={() => setMainView('distribution')}
                  >
                    <DistributionIcon color={adminColors.brand} />
                    <Text style={styles.detailCardLabel}>Distribution</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.detailCard}
                    activeOpacity={0.7}
                    onPress={() => setMainView('availability')}
                  >
                    <AvailabilityIcon color={adminColors.brand} />
                    <Text style={styles.detailCardLabel}>Availability</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.detailCard}
                    activeOpacity={0.7}
                    onPress={() => setMainView('comparison')}
                  >
                    <ComparisonIcon color={adminColors.brand} />
                    <Text style={styles.detailCardLabel}>Comparison</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.detailCard}
                    activeOpacity={0.7}
                    onPress={() => onNavigate?.('M3S03', { product: 'Tomato G1' })}
                  >
                    <ProductDetailIcon color={adminColors.brand} />
                    <Text style={styles.detailCardLabel}>Product Detail</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.detailCard}
                    activeOpacity={0.7}
                    onPress={() => onNavigate?.('M3S04')}
                  >
                    <ViewBatchesIcon color={adminColors.brand} />
                    <Text style={styles.detailCardLabel}>View Batches</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.detailCard}
                    activeOpacity={0.7}
                    onPress={() => onNavigate?.('M3S06')}
                  >
                    <ViewLedgerIcon color={adminColors.brand} />
                    <Text style={styles.detailCardLabel}>View Ledger</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {mainView === 'distribution' && (
              <View>
                <Text style={styles.mainSectionTitle}>Warehouse Distribution — Tomato Grade 1</Text>
                <View style={styles.distListCard}>
                  <View style={styles.distRow}>
                    <Text style={styles.distWarehouseName}>Ooty</Text>
                    <Text style={styles.distWarehouseQty}>120 KG</Text>
                  </View>
                  <View style={styles.distRow}>
                    <Text style={styles.distWarehouseName}>Coonoor</Text>
                    <Text style={styles.distWarehouseQty}>80 KG</Text>
                  </View>
                  <View style={styles.distRow}>
                    <Text style={styles.distWarehouseName}>Kotagiri</Text>
                    <Text style={styles.distWarehouseQty}>50 KG</Text>
                  </View>
                  <View style={styles.distRow}>
                    <Text style={styles.distWarehouseName}>Gudalur Market</Text>
                    <Text style={styles.distWarehouseQty}>40 KG</Text>
                  </View>
                  <View style={[styles.distRow, styles.distRowLast]}>
                    <Text style={styles.distTotalLabel}>Total</Text>
                    <Text style={styles.distTotalQty}>290 KG</Text>
                  </View>
                </View>
              </View>
            )}

            {mainView === 'availability' && (
              <View>
                <Text style={styles.mainSectionTitle}>Stock Availability Detail</Text>
                <View style={styles.availCard}>
                  <View style={styles.availRow}>
                    <View style={styles.availCol}>
                      <Text style={styles.availLabel}>Total</Text>
                      <Text style={styles.availValue}>290 KG</Text>
                    </View>
                    <View style={styles.availCol}>
                      <Text style={styles.availLabel}>Available</Text>
                      <Text style={styles.availValue}>210 KG</Text>
                    </View>
                  </View>

                  <View style={styles.availRow}>
                    <View style={styles.availCol}>
                      <Text style={styles.availLabel}>Reserved</Text>
                      <Text style={styles.availValue}>40 KG</Text>
                    </View>
                    <View style={styles.availCol}>
                      <Text style={styles.availLabel}>Allocated</Text>
                      <Text style={styles.availValue}>30 KG</Text>
                    </View>
                  </View>

                  <View style={[styles.availRow, { marginBottom: 0 }]}>
                    <View style={styles.availCol}>
                      <Text style={styles.availLabel}>Consumed</Text>
                      <Text style={styles.availValue}>10 KG</Text>
                    </View>
                    <View style={styles.availCol} />
                  </View>
                </View>
              </View>
            )}

            {mainView === 'comparison' && (
              <View>
                <Text style={styles.mainSectionTitle}>Warehouse Comparison — Tomato Grade 1</Text>
                <View style={styles.compListCard}>
                  <View style={styles.compRow}>
                    <Text style={styles.compWarehouseName}>Ooty</Text>
                    <Text style={styles.compWarehouseStat}>120 KG · 82% cap</Text>
                  </View>
                  <View style={[styles.compRow, styles.compRowLast]}>
                    <Text style={styles.compWarehouseName}>Coonoor</Text>
                    <Text style={styles.compWarehouseStat}>80 KG · 68% cap</Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // Rows without a product-detail fixture (detailProduct) are not tappable, so
  // M3S03 never opens on a product it would have to render as someone else's.
  const query = searchQuery.trim().toLowerCase();
  const filteredItems = query
    ? stockItems.filter((item) => item.name.toLowerCase().includes(query) || item.grade.toLowerCase().includes(query))
    : stockItems;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <SWAHeader 
          title="Stock List"
          onBack={onBack}
          showFilter={true}
          onFilterPress={() => onNavigate?.('M3S16')}
          warehouseLocked={scope.warehouseId !== undefined}
          warehouseName={scope.warehouseName}
          bottomContent={
            <WarehouseSelector
              scope={scope}
              options={warehouseOptions}
              selectedId={selectedWarehouseId}
              onSelect={setSelectedWarehouseId}
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

          {/* Verify Tab */}
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
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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

          {/* Stock Items */}
          {filteredItems.map((item) => {
            const isHealthy = item.status === 'Healthy Stock';
            const detailProduct = item.detailProduct;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.stockCard}
                disabled={detailProduct === undefined}
                onPress={() => {
                  if (detailProduct !== undefined) onNavigate?.('M3S03', { product: detailProduct });
                }}
                activeOpacity={0.7}
              >
                <View style={styles.stockHeader}>
                  <View style={styles.stockTitleColumn}>
                    <Text style={styles.stockName}>{item.name}</Text>
                    <Text style={styles.stockGrade}>{item.grade}</Text>
                  </View>
                  <View style={[styles.statusBadge, isHealthy ? styles.healthyBadge : styles.alertBadge]}>
                    <Text style={[styles.statusBadgeText, isHealthy ? styles.healthyBadgeText : styles.alertBadgeText]}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                {/* Metrics on left, View > on right */}
                <View style={styles.stockBottomRow}>
                  <View style={styles.stockStatsGroup}>
                    <View style={styles.stockStat}>
                      <Text style={styles.stockStatLabel}>Available</Text>
                      <Text style={styles.stockStatValue}>{item.available}</Text>
                    </View>
                    <View style={styles.stockStat}>
                      <Text style={styles.stockStatLabel}>Reserved</Text>
                      <Text style={styles.stockStatValue}>{item.reserved}</Text>
                    </View>
                    <View style={styles.stockStat}>
                      <Text style={styles.stockStatLabel}>Allocated</Text>
                      <Text style={styles.stockStatValue}>{item.allocated}</Text>
                    </View>
                  </View>

                  {detailProduct !== undefined ? (
                    <View style={styles.viewLinkRow}>
                      <Text style={styles.viewLink}>View</Text>
                      <Text style={styles.viewChevron}>›</Text>
                    </View>
                  ) : null}
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

