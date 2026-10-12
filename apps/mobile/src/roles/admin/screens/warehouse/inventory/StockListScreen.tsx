// Design id: M3S02
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, SafeAreaView } from 'react-native';
import { adminColors, adminShadow, adminType } from '../../../theme';
import type { InventoryScreenBaseProps } from './types';
import { WarehouseSelector } from './WarehouseSelector';
import Svg, { Path } from 'react-native-svg';
import { SWAHeader } from '../../swa/components';

export interface StockListScreenProps extends InventoryScreenBaseProps {
  initialTab?: 'Stock' | 'Ledger' | 'Allocation' | 'Verify';
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
}: StockListScreenProps) {
  const [activeTab, setActiveTab] = useState<'Stock' | 'Ledger' | 'Allocation' | 'Verify'>(initialTab);
  // Main (no warehouseId) may pick a warehouse; Sub is locked to its own.
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(scope.warehouseId);
  const canViewLedger = can('inventory.stock_ledger.view_own') || can('inventory.stock_ledger.view_all');
  const [searchQuery, setSearchQuery] = useState('');

  const stockItems = [
    {
      name: 'Tomato',
      grade: 'Grade 1',
      status: 'Healthy Stock',
      available: '245 KG',
      reserved: '50 KG',
      allocated: '120 KG',
    },
    {
      name: 'Carrot',
      grade: 'Grade 1',
      status: 'Low Stock',
      available: '12 KG',
      reserved: '0 KG',
      allocated: '0 KG',
    },
    {
      name: 'Beetroot',
      grade: 'Grade 1',
      status: 'Healthy Stock',
      available: '60 KG',
      reserved: '5 KG',
      allocated: '15 KG',
    },
    {
      name: 'Spinach',
      grade: 'Grade 2',
      status: 'Out of Stock',
      available: '0 KG',
      reserved: '0 KG',
      allocated: '0 KG',
    },
  ];

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
          {stockItems.map((item, index) => {
            const isHealthy = item.status === 'Healthy Stock';
            return (
              <TouchableOpacity
                key={index}
                style={styles.stockCard}
                onPress={() => onNavigate?.('M3S03', { product: item })}
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

