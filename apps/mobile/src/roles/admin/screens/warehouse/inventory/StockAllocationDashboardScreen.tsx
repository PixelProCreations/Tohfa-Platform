// Design id: M3S07
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import type { InventoryScreenBaseProps } from './types';
import { WarehouseSelector } from './WarehouseSelector';
import Svg, { Path, Rect } from 'react-native-svg';

export type StockAllocationDashboardScreenProps = InventoryScreenBaseProps;

// ─── Custom Icons matching Reference Mockup Exactly ─────────────────────────

function BackArrowIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LockSmallIcon({ size = 13, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z"
        stroke={color}
        strokeWidth="2.2"
      />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function StockTabBoxIcon({ color = '#5C6B62' }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v1.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-1.5z"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path
        d="M5 9v9.5A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V9"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path d="M10 13.5h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function LedgerTabIcon({ color = '#5C6B62' }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 4.5l2 1.5 2-1.5 2 1.5 2-1.5 2 1.5 2-1.5 2 1.5V20H6V4.5z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9.5 10.5h5M9.5 14h5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function AllocationTabIcon({ color = '#FFFFFF' }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20z" stroke={color} strokeWidth="1.8" />
      <Path d="M12 2v20" stroke={color} strokeWidth="1.8" />
      <Path d="M12 12h10" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function VerifyTabIcon({ color = '#5C6B62' }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="16" rx="3" stroke={color} strokeWidth="1.8" />
      <Path d="M7 8.5h3.5M7 12h3.5M7 15.5h3.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Path
        d="M12.5 12l1.8 1.8 3.5-3.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const DEFAULT_WAREHOUSE_OPTIONS = [
  { warehouseId: 'WH-COON', warehouseName: 'Coonoor Warehouse' },
  { warehouseId: 'WH-OOTY', warehouseName: 'Ooty Warehouse' },
  { warehouseId: 'WH-KTYM', warehouseName: 'Kotagiri Warehouse' },
  { warehouseId: 'WH-GDLR', warehouseName: 'Gudalur Warehouse' },
];

export function StockAllocationDashboardScreen({
  scope,
  can,
  onBack,
  onNavigate,
  warehouseOptions = DEFAULT_WAREHOUSE_OPTIONS,
}: StockAllocationDashboardScreenProps) {
  const canViewAll = can('inventory.stock_ledger.view_all');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(scope.warehouseId);

  const isAllWarehouses = canViewAll && selectedWarehouseId === undefined;

  // Single warehouse data (Coonoor) matching reference Image 2 exactly
  const singleCards = [
    {
      title: 'ONLINE',
      color: '#EA580C',
      allocated: '420 KG',
      consumed: '180 KG',
      reserved: '120 KG',
      available: '120 KG',
      allocatedVal: 420,
    },
    {
      title: 'LIVE MARKET',
      color: '#0F766E',
      allocated: '120 KG',
      consumed: '40 KG',
      reserved: '30 KG',
      available: '50 KG',
      allocatedVal: 120,
    },
    {
      title: 'RESERVE',
      color: '#2563EB',
      allocated: '80 KG',
      consumed: '20 KG',
      reserved: '20 KG',
      available: '40 KG',
      allocatedVal: 80,
    },
    {
      title: 'BUFFER',
      color: '#CA8A04',
      allocated: '60 KG',
      consumed: '10 KG',
      reserved: '10 KG',
      available: '40 KG',
      allocatedVal: 60,
    },
  ];

  // Consolidated / All Warehouses data (4x aggregated)
  const allCards = [
    {
      title: 'ONLINE',
      color: '#EA580C',
      allocated: '1,680 KG',
      consumed: '720 KG',
      reserved: '480 KG',
      available: '480 KG',
      allocatedVal: 1680,
    },
    {
      title: 'LIVE MARKET',
      color: '#0F766E',
      allocated: '480 KG',
      consumed: '160 KG',
      reserved: '120 KG',
      available: '200 KG',
      allocatedVal: 480,
    },
    {
      title: 'RESERVE',
      color: '#2563EB',
      allocated: '320 KG',
      consumed: '80 KG',
      reserved: '80 KG',
      available: '160 KG',
      allocatedVal: 320,
    },
    {
      title: 'BUFFER',
      color: '#CA8A04',
      allocated: '240 KG',
      consumed: '40 KG',
      reserved: '40 KG',
      available: '160 KG',
      allocatedVal: 240,
    },
  ];

  const cards = isAllWarehouses ? allCards : singleCards;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#F0562A" />
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.headerBand}>
          <View style={styles.headerTopRow}>
            {onBack && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Back"
              >
                <BackArrowIcon size={22} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <Text style={styles.headerTitle} numberOfLines={1}>
              Stock Allocation
            </Text>
          </View>

          {/* Role-based Warehouse Pill / Selector */}
          {!canViewAll || scope.warehouseId !== undefined ? (
            <View style={styles.warehousePill}>
              <LockSmallIcon size={13} color="#FFFFFF" />
              <Text style={styles.warehousePillText}>{scope.warehouseName ?? 'Coonoor Warehouse'}</Text>
            </View>
          ) : (
            <View style={{ marginTop: 10 }}>
              <WarehouseSelector
                scope={scope}
                options={warehouseOptions}
                selectedId={selectedWarehouseId}
                onSelect={setSelectedWarehouseId}
              />
            </View>
          )}
        </View>
      </SafeAreaView>

      <View style={styles.container}>
        {/* 4 Tab Cards Row */}
        <View style={styles.tabCardsRow}>
          <TouchableOpacity
            style={styles.tabCard}
            onPress={() => onNavigate?.('M3S02')}
            activeOpacity={0.7}
          >
            <StockTabBoxIcon color="#5C6B62" />
            <Text style={styles.tabCardText}>Stock</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabCard}
            onPress={() => onNavigate?.('M3S06')}
            activeOpacity={0.7}
          >
            <LedgerTabIcon color="#5C6B62" />
            <Text style={styles.tabCardText}>Ledger</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabCard, styles.activeTabCard]}
            activeOpacity={0.9}
          >
            <AllocationTabIcon color="#FFFFFF" />
            <Text style={[styles.tabCardText, styles.activeTabCardText]}>Allocation</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabCard}
            onPress={() => onNavigate?.('M3S10')}
            activeOpacity={0.7}
          >
            <VerifyTabIcon color="#5C6B62" />
            <Text style={styles.tabCardText}>Verify</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Total Stock Split */}
          <View style={styles.splitHeaderRow}>
            <Text style={styles.splitHeaderTitle}>Total Stock Split</Text>
            <Text style={styles.splitHeaderSub}>Values from config</Text>
          </View>

          {/* Segmented Horizontal Bar */}
          <View style={styles.splitBar}>
            <View style={[styles.barSegment, { flex: cards[0]?.allocatedVal ?? 1, backgroundColor: '#EA580C' }]} />
            <View style={[styles.barSegment, { flex: cards[1]?.allocatedVal ?? 1, backgroundColor: '#0F766E' }]} />
            <View style={[styles.barSegment, { flex: cards[2]?.allocatedVal ?? 1, backgroundColor: '#2563EB' }]} />
            <View style={[styles.barSegment, { flex: cards[3]?.allocatedVal ?? 1, backgroundColor: '#CA8A04' }]} />
          </View>

          {/* 4 Channel Allocation Cards */}
          {cards.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.channelCard, { borderLeftColor: item.color }]}
              onPress={() => onNavigate?.('M3S02')}
              activeOpacity={0.75}
            >
              <Text style={styles.channelTitle}>{item.title}</Text>

              <View style={styles.statGrid}>
                <View style={styles.statPill}>
                  <Text style={styles.statValue}>{item.allocated}</Text>
                  <Text style={styles.statLabel}>ALLOCATED</Text>
                </View>

                <View style={styles.statPill}>
                  <Text style={styles.statValue}>{item.consumed}</Text>
                  <Text style={styles.statLabel}>CONSUMED</Text>
                </View>

                <View style={styles.statPill}>
                  <Text style={styles.statValue}>{item.reserved}</Text>
                  <Text style={styles.statLabel}>RESERVED</Text>
                </View>

                <View style={styles.statPill}>
                  <Text style={styles.statValue}>{item.available}</Text>
                  <Text style={styles.statLabel}>AVAILABLE</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F0562A',
  },
  headerSafeArea: {
    backgroundColor: '#F0562A',
  },
  headerBand: {
    backgroundColor: '#F0562A',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  warehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginTop: 10,
    gap: 6,
  },
  warehousePillText: {
    fontFamily: 'Poppins',
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  tabCardsRow: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    gap: 10,
  },
  tabCard: {
    flex: 1,
    height: 74,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  activeTabCard: {
    backgroundColor: '#F0562A',
    borderColor: '#F0562A',
  },
  tabCardText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '700',
    color: '#5C6B62',
  },
  activeTabCardText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  splitHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  splitHeaderTitle: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '800',
    color: '#18181B',
  },
  splitHeaderSub: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '600',
    color: '#71717A',
  },
  splitBar: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: 16,
  },
  barSegment: {
    height: '100%',
  },
  channelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    borderLeftWidth: 5,
    paddingHorizontal: 14,
    paddingVertical: 16,
    marginBottom: 14,
  },
  channelTitle: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '800',
    color: '#78350F',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  statGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  statPill: {
    flex: 1,
    backgroundColor: '#F5F3EF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '800',
    color: '#18181B',
    marginBottom: 3,
  },
  statLabel: {
    fontFamily: 'Poppins',
    fontSize: 9.5,
    fontWeight: '800',
    color: '#71717A',
    letterSpacing: 0.4,
  },
});
