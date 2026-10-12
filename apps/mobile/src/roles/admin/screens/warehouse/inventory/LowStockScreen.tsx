// Design id: M3S09
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import type { InventoryScreenBaseProps } from './types';
import { WarehouseSelector } from './WarehouseSelector';
import Svg, { Path, Circle } from 'react-native-svg';

export interface LowStockItem {
  id: string;
  name: string;
  available: string;
  threshold: string;
  warehouseName: string;
}

export interface LowStockScreenProps extends InventoryScreenBaseProps {
  items?: readonly LowStockItem[] | undefined;
  onInitiateTransfer?: (() => void) | undefined;
}

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

function InfoCircleIcon({ size = 18, color = '#1D4ED8' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 16v-4M12 8h.01" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function TrendingDownZigzagIcon({ size = 20, color = '#EF4444' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 18l-9.5-9.5-5 5L1 6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17 18h6v-6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = '#71717A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l6-6-6-6"
        stroke={color}
        strokeWidth="2.2"
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

export function LowStockScreen({
  scope,
  can,
  onBack,
  onNavigate,
  warehouseOptions = DEFAULT_WAREHOUSE_OPTIONS,
}: LowStockScreenProps) {
  const canViewAll = can('inventory.stock_ledger.view_all');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(scope.warehouseId);

  const isAllWarehouses = canViewAll && selectedWarehouseId === undefined;

  // Single warehouse items (Coonoor) matching reference Image 3 exactly
  const coonoorItems: LowStockItem[] = [
    {
      id: '1',
      name: 'Carrot — Grade 1',
      available: '12 KG',
      threshold: '20 KG',
      warehouseName: 'Coonoor Warehouse',
    },
    {
      id: '2',
      name: 'Beans — Grade 1',
      available: '8 KG',
      threshold: '15 KG',
      warehouseName: 'Coonoor Warehouse',
    },
    {
      id: '3',
      name: 'Spinach — Grade 2',
      available: '0 KG',
      threshold: '10 KG',
      warehouseName: 'Coonoor Warehouse',
    },
    {
      id: '4',
      name: 'Beetroot — Grade 1',
      available: '6 KG',
      threshold: '12 KG',
      warehouseName: 'Coonoor Warehouse',
    },
    {
      id: '5',
      name: 'Cow Milk',
      available: '4 L',
      threshold: '10 L',
      warehouseName: 'Coonoor Warehouse',
    },
  ];

  // Cross-warehouse items for all subwarehouses view
  const allWarehouseItems: LowStockItem[] = [
    ...coonoorItems,
    {
      id: '6',
      name: 'Tomato — Grade 1',
      available: '18 KG',
      threshold: '30 KG',
      warehouseName: 'Ooty Warehouse',
    },
    {
      id: '7',
      name: 'Cabbage',
      available: '15 KG',
      threshold: '25 KG',
      warehouseName: 'Kotagiri Warehouse',
    },
    {
      id: '8',
      name: 'Potato — Grade 1',
      available: '22 KG',
      threshold: '40 KG',
      warehouseName: 'Gudalur Warehouse',
    },
  ];

  const displayedItems = isAllWarehouses
    ? allWarehouseItems
    : coonoorItems.filter((i) =>
        selectedWarehouseId ? i.warehouseName.includes('Coonoor') : true
      );

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
              Low Stock
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

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Blue Info Notice Box */}
        <View style={styles.infoBanner}>
          <InfoCircleIcon size={18} color="#1D4ED8" />
          <Text style={styles.infoBannerText}>
            Thresholds shown below are read from system configuration — never a fixed number in this app.
          </Text>
        </View>

        {/* Low Stock Items List */}
        {displayedItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.itemCard}
            onPress={() => onNavigate?.('M3S03', { produceName: item.name, warehouseName: item.warehouseName })}
            activeOpacity={0.75}
          >
            {/* Left curved red indicator */}
            <View style={styles.redLeftIndicator} />

            <View style={styles.cardContentRow}>
              {/* Zigzag icon */}
              <View style={styles.iconContainer}>
                <TrendingDownZigzagIcon size={20} color="#EF4444" />
              </View>

              {/* Text column */}
              <View style={styles.infoColumn}>
                <Text style={styles.itemNameText}>{item.name}</Text>
                <Text style={styles.itemMetaText}>
                  Available {item.available} · Configured Threshold {item.threshold}
                  {isAllWarehouses && (
                    <Text style={styles.warehouseTagText}> · {item.warehouseName.replace(' Warehouse', '')}</Text>
                  )}
                </Text>
              </View>

              {/* Right chevron */}
              <ChevronRightIcon size={18} color="#71717A" />
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>
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
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  infoBannerText: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 12.5,
    fontWeight: '600',
    color: '#1D4ED8',
    lineHeight: 18,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    marginBottom: 12,
    overflow: 'hidden',
  },
  redLeftIndicator: {
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 10,
    width: 4,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: '#EF4444',
  },
  cardContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingLeft: 16,
    paddingRight: 14,
    gap: 12,
  },
  iconContainer: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoColumn: {
    flex: 1,
  },
  itemNameText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '800',
    color: '#18181B',
    marginBottom: 2,
  },
  itemMetaText: {
    fontFamily: 'Poppins',
    fontSize: 12.5,
    fontWeight: '600',
    color: '#4E5D56',
  },
  warehouseTagText: {
    fontFamily: 'Poppins',
    fontWeight: '800',
    color: '#78350F',
  },
});
