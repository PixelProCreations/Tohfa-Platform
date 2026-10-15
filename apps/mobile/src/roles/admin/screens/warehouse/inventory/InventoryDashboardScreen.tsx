// Design id: M3S01
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import { OverviewDashboardCard } from '../../../components';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { SWABottomNav } from '../../swa/components';
import { WALLET_WAREHOUSES } from '../wallet-cashtopup/fixtures';
import type { InventoryScreenBaseProps } from './types';
import { WarehouseSelector } from './WarehouseSelector';

export interface InventoryDashboardScreenProps extends InventoryScreenBaseProps {
  onInitiateTransfer?: (() => void) | undefined;
}

// ─── Pixel-Perfect Custom SVGs matching Design Mockup ─────────────────────────

function HeaderBoxIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5.5 4A2.5 2.5 0 0 0 3 6.5v11A2.5 2.5 0 0 0 5.5 20h13a2.5 2.5 0 0 0 2.5-2.5v-11A2.5 2.5 0 0 0 18.5 4h-13z" stroke={color} strokeWidth="2.2" />
      <Path d="M3 9.5h18" stroke={color} strokeWidth="2.2" />
      <Path d="M10 13.5h4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
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

function BellIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 15V10a6 6 0 0 0-12 0v5l-2 3h16l-2-3z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 18v1a2 2 0 0 0 4 0v-1"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LockBadgeIcon({ size = 12, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke={color} strokeWidth="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// Stat Card 1: Available (Clipboard with checkmark)
function StatAvailableIcon({ size = 22, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 3h6a1 1 0 0 1 1 1v1H8V4a1 1 0 0 1 1-1z" stroke={color} strokeWidth="1.8" />
      <Path d="M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" stroke={color} strokeWidth="1.8" />
      <Path d="M8.5 13l2.5 2.5 4.5-4.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Stat Card 2: Reserved (Padlock with mini-clock dial on bottom right)
function StatReservedIcon({ size = 22, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 10h8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z" stroke={color} strokeWidth="1.8" />
      <Path d="M7 10V6.5a3 3 0 0 1 6 0V10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M17.5 12.5a4.5 4.5 0 1 0 0 9a4.5 4.5 0 0 0 0-9z" fill={adminColors.card} stroke={color} strokeWidth="1.8" />
      <Path d="M17.5 15v2l1.2 1" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

// Stat Card 3: Allocated (Circle divided into pie sections)
function StatAllocatedIcon({ size = 22, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20z" stroke={color} strokeWidth="1.8" />
      <Path d="M12 2v20" stroke={color} strokeWidth="1.8" />
      <Path d="M12 12h10" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

// Stat Card 4: Low Stock (Diagonal downward zig-zag arrow with arrowhead, BROWN outline)
function StatLowStockIcon({ size = 22, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 8l6 6 4-4 7 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M15 17h5v-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Stat Card 5: Verification Pending (Checklist box with checkmark and lines)
function StatVerificationPendingIcon({ size = 22, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11A2.5 2.5 0 0 1 6.5 4z" stroke={color} strokeWidth="1.8" />
      <Path d="M7.5 10l2 2 3.5-3.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 15h10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

// Stat Card 6: Stock Ledger (Receipt ticket with serrated/jagged zigzag top edge)
function StatStockLedgerIcon({ size = 22, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 20V5.5L7.5 3.5 10 5.5l2-2 2 2 2-2 3 2V20H5z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M8 9h8M8 13h8M8 16.5h5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function InfoCircleIcon({ size = 18, color = adminColors.warning.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 16v-4M12 8h.01" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ArrowUpSmallIcon({ size = 18, color = adminColors.warning.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 19V5M5 12l7-7 7 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function Grid4SquaresIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="9" rx="1.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="14" y="3" width="7" height="5" rx="1.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="14" y="12" width="7" height="9" rx="1.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="3" y="16" width="7" height="5" rx="1.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ConsolidatedStockIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L2 7l10 5 10-5-10-5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2 17l10 5 10-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2 12l10 5 10-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WarehouseStockIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 21V8l8-4 8 4v13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 10.5h.01M15 10.5h.01M9 14.5h.01M15 14.5h.01M9 18.5h.01M15 18.5h.01" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 21h18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function StockVerificationQuickIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="8" y="2" width="8" height="4" rx="1" stroke={color} strokeWidth="2" />
      <Path d="M9 13.5l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function AllocationQuickIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 3v9h9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 12l-6.36 6.36" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LowStockQuickIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 7l6 6 4-4 8 8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M21 12v5h-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CreateTransferQuickIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 8h14M15 5l3 3-3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M20 16H6M9 13l-3 3 3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const MAIN_KPIS = [
  { key: 'total_stock', label: 'Total Stock', value: '12,840 KG', unit: 'KG across warehouses', icon: 'inventory', screen: 'M3S02' },
  { key: 'available_stock', label: 'Available Stock', value: '9,240 KG', unit: 'Ready to allocate', icon: 'box', screen: 'M3S02' },
  { key: 'allocated', label: 'Allocated Stock', value: '2,100 KG', unit: 'Customer orders', icon: 'orders', screen: 'M3S07' },
  { key: 'reserved', label: 'Reserved Stock', value: '1,500 KG', unit: 'In reservations', icon: 'pickup', screen: 'M3S02' },
  { key: 'low_stock', label: 'Low Stock Items', value: '14', unit: 'Needs attention', icon: 'alert', tone: 'danger', screen: 'M3S09' },
  { key: 'pending_verification', label: 'Verification Pending', value: '6', unit: 'Items pending', icon: 'receiving', screen: 'M3S10' },
  { key: 'variance_detected', label: 'Variance Detected', value: '2', unit: 'Needs review', icon: 'alert', tone: 'danger', screen: 'M3S12' },
  { key: 'pending_adjustments', label: 'Pending Adjustments', value: '3', unit: 'Requests active', icon: 'truck', screen: 'M3S14' },
];

const WAREHOUSE_OVERVIEW_ROWS = [
  { name: 'Ooty', stock: '3,420 KG', warehouseId: 'WH-OOTY' },
  { name: 'Coonoor', stock: '3,180 KG', warehouseId: 'WH-COON' },
  { name: 'Kotagiri', stock: '2,940 KG', warehouseId: 'WH-KOTA' },
  { name: 'Gudalur Market', stock: '3,300 KG', warehouseId: 'WH-GUDA' },
];

const PENDING_ACTION_ROWS = [
  { label: 'Verification', count: 6, screen: 'M3S10' },
  { label: 'Adjustment', count: 3, screen: 'M3S14' },
  { label: 'Transfer Receiving', count: 2, screen: 'transfers' },
  { label: 'Stock Exception', count: 1, screen: 'M3S12' },
];

const RECENT_MOVEMENT = {
  id: 'MV-000928',
  type: 'RECEIPT',
  warehouse: 'Ooty',
  produce: 'Tomato',
  batch: 'BT-000128',
  qty: '+100 KG',
};

export function InventoryDashboardScreen({
  scope,
  can,
  onBack,
  onNavigate,
  onTabChange,
  warehouseOptions,
  onInitiateTransfer,
}: InventoryDashboardScreenProps) {
  // Main (no warehouseId) gets the all-warehouses selector; Sub is locked to its own.
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(scope.warehouseId);
  // The ledger tile needs at least the own-warehouse ledger grant (rbac: MAIN all, SUB own).
  const canViewLedger = can('inventory.stock_ledger.view_own') || can('inventory.stock_ledger.view_all');
  const isSub = scope.warehouseId !== undefined;

  const renderStatCard = (
    key: string,
    icon: React.ReactNode,
    value: string,
    label: string,
    screenKey: string,
    isAlert?: boolean,
  ) => {
    return (
      <OverviewDashboardCard
        key={key}
        value={value}
        title={label}
        subtitle={isAlert ? 'Needs attention' : undefined}
        icon={icon}
        tone={isAlert ? 'danger' : 'default'}
        onPress={onNavigate ? () => onNavigate(screenKey) : undefined}
      />
    );
  };

  const quickActions = [
    { key: 'consolidated', label: 'Consolidated Stock', icon: <ConsolidatedStockIcon size={24} color={adminColors.brand} />, screen: 'M3S02' },
    { key: 'warehouse', label: 'Warehouse Stock', icon: <WarehouseStockIcon size={24} color={adminColors.brand} />, screen: 'M3S02' },
    { key: 'verification', label: 'Stock Verification', icon: <StockVerificationQuickIcon size={24} color={adminColors.brand} />, screen: 'M3S10' },
    { key: 'allocation', label: 'Allocation', icon: <AllocationQuickIcon size={24} color={adminColors.brand} />, screen: 'M3S07' },
    { key: 'low_stock', label: 'Low Stock', icon: <LowStockQuickIcon size={24} color={adminColors.brand} />, screen: 'M3S09' },
    { key: 'transfer', label: 'Create Transfer', icon: <CreateTransferQuickIcon size={24} color={adminColors.brand} />, isTransfer: true },
  ];

  if (isSub) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Custom Header matching Design Mockup Exactly */}
          <View style={styles.headerBand}>
            <View style={styles.header}>
              <View style={styles.headerTopRow}>
                <View style={styles.headerTitleGroup}>
                  {onBack && (
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={onBack}
                      activeOpacity={0.7}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      accessibilityLabel="Back to Dashboard"
                    >
                      <BackArrowIcon size={22} color={adminColors.onBrand} />
                    </TouchableOpacity>
                  )}
                  <HeaderBoxIcon size={24} color={adminColors.onBrand} />
                  <Text style={styles.headerTitle}>Inventory & Stock</Text>
                </View>
                <TouchableOpacity 
                  style={styles.notificationButton} 
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <BellIcon size={19} color={adminColors.onBrand} />
                </TouchableOpacity>
              </View>

              <View style={styles.warehousePill}>
                <LockBadgeIcon size={12} color={adminColors.onBrand} />
                <Text style={styles.warehouseText}>
                  {`${(scope.warehouseName ?? 'Coonoor Warehouse').includes('Warehouse') ? (scope.warehouseName ?? 'Coonoor Warehouse') : `${scope.warehouseName} Warehouse`} · Assigned Warehouse`}
                </Text>
              </View>
            </View>
          </View>
          
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Total Available Stock - White Card with Brown Text */}
            <View style={styles.totalStockCard}>
              <Text style={styles.totalStockValue}>1,245 KG</Text>
              <Text style={styles.totalStockLabel}>TOTAL AVAILABLE STOCK</Text>
            </View>

            {/* 6 Stats Grid - 2 columns x 3 rows */}
            <View style={styles.statsGrid}>
              {renderStatCard('available', <StatAvailableIcon size={22} color={adminColors.brandDeep} />, '1,245 KG', 'Available', 'M3S02')}
              {renderStatCard('reserved', <StatReservedIcon size={22} color={adminColors.brandDeep} />, '320 KG', 'Reserved', 'M3S02')}
              {renderStatCard('allocated', <StatAllocatedIcon size={22} color={adminColors.brandDeep} />, '580 KG', 'Allocated', 'M3S07')}
              {renderStatCard('low_stock', <StatLowStockIcon size={22} color={adminColors.brandDeep} />, '05', 'Low Stock', 'M3S09', true)}
              {renderStatCard('verification_pending', <StatVerificationPendingIcon size={22} color={adminColors.brandDeep} />, '02', 'Verification Pending', 'M3S10')}
              {canViewLedger || isSub ? (
                renderStatCard('stock_ledger', <StatStockLedgerIcon size={22} color={adminColors.brandDeep} />, 'View', 'Stock Ledger', 'M3S06')
              ) : null}
            </View>

            {/* Top Stock Products Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Top Stock Products</Text>
                <TouchableOpacity onPress={() => onNavigate?.('M3S02')} activeOpacity={0.7}>
                  <Text style={styles.viewAllLink}>View All Stock</Text>
                </TouchableOpacity>
              </View>

              {/* Tomato - Available */}
              <TouchableOpacity 
                style={styles.productCard}
                onPress={() => onNavigate?.('M3S03')}
                activeOpacity={0.7}
              >
                <View style={styles.productHeader}>
                  <View>
                    <Text style={styles.productName}>Tomato</Text>
                    <Text style={styles.productGrade}>Grade 1</Text>
                  </View>
                  <View style={styles.availableBadge}>
                    <Text style={styles.availableBadgeText}>Available</Text>
                  </View>
                </View>
                <View style={styles.productStats}>
                  <View style={styles.productStat}>
                    <Text style={styles.productStatLabel}>Available</Text>
                    <Text style={styles.productStatValue}>245 KG</Text>
                  </View>
                  <View style={styles.productStat}>
                    <Text style={styles.productStatLabel}>Reserved</Text>
                    <Text style={styles.productStatValue}>50 KG</Text>
                  </View>
                  <View style={styles.productStat}>
                    <Text style={styles.productStatLabel}>Allocated</Text>
                    <Text style={styles.productStatValue}>120 KG</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Carrot - Available */}
              <TouchableOpacity 
                style={styles.productCard}
                onPress={() => onNavigate?.('M3S03')}
                activeOpacity={0.7}
              >
                <View style={styles.productHeader}>
                  <View>
                    <Text style={styles.productName}>Carrot</Text>
                    <Text style={styles.productGrade}>Grade 1</Text>
                  </View>
                  <View style={styles.availableBadge}>
                    <Text style={styles.availableBadgeText}>Available</Text>
                  </View>
                </View>
                <View style={styles.productStats}>
                  <View style={styles.productStat}>
                    <Text style={styles.productStatLabel}>Available</Text>
                    <Text style={styles.productStatValue}>180 KG</Text>
                  </View>
                  <View style={styles.productStat}>
                    <Text style={styles.productStatLabel}>Reserved</Text>
                    <Text style={styles.productStatValue}>20 KG</Text>
                  </View>
                  <View style={styles.productStat}>
                    <Text style={styles.productStatLabel}>Allocated</Text>
                    <Text style={styles.productStatValue}>80 KG</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Beans - Low Stock */}
              <TouchableOpacity 
                style={styles.productCard}
                onPress={() => onNavigate?.('M3S09')}
                activeOpacity={0.7}
              >
                <View style={styles.productHeader}>
                  <View>
                    <Text style={styles.productName}>Beans</Text>
                    <Text style={styles.productGrade}>Grade 1</Text>
                  </View>
                  <View style={styles.lowStockBadge}>
                    <Text style={styles.lowStockBadgeText}>Low Stock</Text>
                  </View>
                </View>
                <View style={styles.productStats}>
                  <View style={styles.productStat}>
                    <Text style={styles.productStatLabel}>Available</Text>
                    <Text style={styles.productStatValue}>95 KG</Text>
                  </View>
                  <View style={styles.productStat}>
                    <Text style={styles.productStatLabel}>Reserved</Text>
                    <Text style={styles.productStatValue}>10 KG</Text>
                  </View>
                  <View style={styles.productStat}>
                    <Text style={styles.productStatLabel}>Allocated</Text>
                    <Text style={styles.productStatValue}>30 KG</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <SWABottomNav activeTab="Inventory" onTabChange={onTabChange} />
        </View>
      </SafeAreaView>
    );
  }

  // ─── Main Warehouse View (All Warehouses) matching Reference Exactly ──────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerBand}>
          <View style={styles.header}>
            <View style={styles.headerTopRow}>
              <View style={styles.headerTitleGroup}>
                {onBack && (
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={onBack}
                    activeOpacity={0.7}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    accessibilityLabel="Back to Dashboard"
                  >
                    <BackArrowIcon size={22} color={adminColors.onBrand} />
                  </TouchableOpacity>
                )}
                <Grid4SquaresIcon size={22} color={adminColors.onBrand} />
                <Text style={styles.mainHeaderTitle}>Inventory & Stock</Text>
              </View>
            </View>

            <WarehouseSelector
              scope={scope}
              options={warehouseOptions ?? WALLET_WAREHOUSES}
              selectedId={selectedWarehouseId}
              onSelect={setSelectedWarehouseId}
            />
          </View>
        </View>

        <ScrollView style={styles.mainContent} contentContainerStyle={styles.mainScrollPad} showsVerticalScrollIndicator={false}>
          {/* 8 KPI Cards Grid (2x4) */}
          <View style={styles.mainKpiGrid}>
            {MAIN_KPIS.map((kpi) => (
              <OverviewDashboardCard
                key={kpi.key}
                value={kpi.value}
                title={kpi.label}
                subtitle={kpi.unit}
                icon={kpi.icon}
                tone={(kpi as any).tone ?? 'default'}
                onPress={() => onNavigate?.(kpi.screen)}
              />
            ))}
          </View>

          {/* Info Banner */}
          <View style={styles.mainInfoBanner}>
            <InfoCircleIcon size={18} color={adminColors.warning.text} />
            <Text style={styles.mainInfoBannerText}>
              Low-stock thresholds always come from backend configuration — never hard-coded percentages.
            </Text>
          </View>

          {/* Warehouse Overview */}
          <View style={styles.mainSectionHeaderRow}>
            <Text style={styles.mainSectionTitle}>Warehouse Overview</Text>
          </View>
          <View style={styles.mainListCard}>
            {WAREHOUSE_OVERVIEW_ROWS.map((item, idx) => (
              <TouchableOpacity
                key={item.name}
                style={[styles.mainListItemRow, idx > 0 && styles.mainListItemDivider]}
                onPress={() => onNavigate?.('M3S02', { warehouseId: item.warehouseId })}
                activeOpacity={0.7}
              >
                <Text style={styles.mainListItemLabel}>{item.name}</Text>
                <Text style={styles.mainListItemValue}>{item.stock}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Inventory Health */}
          <View style={styles.mainSectionHeaderRow}>
            <Text style={styles.mainSectionTitle}>Inventory Health</Text>
          </View>
          <View style={styles.healthCard}>
            <View style={styles.healthGrid}>
              <View style={styles.healthCell}>
                <Text style={styles.healthCellLabel}>Normal</Text>
                <Text style={[styles.healthCellValue, { color: adminColors.success.text }]}>62 products</Text>
              </View>
              <View style={styles.healthCell}>
                <Text style={styles.healthCellLabel}>Low</Text>
                <Text style={[styles.healthCellValue, { color: adminColors.warning.text }]}>14 products</Text>
              </View>
              <View style={styles.healthCell}>
                <Text style={styles.healthCellLabel}>Critical</Text>
                <Text style={[styles.healthCellValue, { color: adminColors.danger.text }]}>3 products</Text>
              </View>
              <View style={styles.healthCell}>
                <Text style={styles.healthCellLabel}>Verification Pending</Text>
                <Text style={[styles.healthCellValue, { color: adminColors.ink }]}>6</Text>
              </View>
            </View>
          </View>

          {/* Recent Stock Movements */}
          <View style={styles.mainSectionHeaderRow}>
            <Text style={styles.mainSectionTitle}>Recent Stock Movements</Text>
            <TouchableOpacity onPress={() => onNavigate?.('M3S06')} activeOpacity={0.7}>
              <Text style={styles.mainSectionLink}>View →</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.recentMovementCard}
            onPress={() => onNavigate?.('M3S15', { movementId: RECENT_MOVEMENT.id })}
            activeOpacity={0.8}
          >
            <View style={styles.recentMovementBadge}>
              <ArrowUpSmallIcon size={18} color={adminColors.warning.text} />
            </View>
            <View style={styles.recentMovementInfo}>
              <Text style={styles.recentMovementTitle}>{`${RECENT_MOVEMENT.id} · ${RECENT_MOVEMENT.type}`}</Text>
              <Text style={styles.recentMovementSub}>{`${RECENT_MOVEMENT.warehouse} · ${RECENT_MOVEMENT.produce} · ${RECENT_MOVEMENT.batch}`}</Text>
            </View>
            <Text style={styles.recentMovementQty}>{RECENT_MOVEMENT.qty}</Text>
          </TouchableOpacity>

          {/* Pending Actions */}
          <View style={styles.mainSectionHeaderRow}>
            <Text style={styles.mainSectionTitle}>Pending Actions</Text>
            <TouchableOpacity onPress={() => onNavigate?.('M3S10')} activeOpacity={0.7}>
              <Text style={styles.mainSectionLink}>View →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.mainListCard}>
            {PENDING_ACTION_ROWS.map((item, idx) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.mainListItemRow, idx > 0 && styles.mainListItemDivider]}
                onPress={() => {
                  if (item.screen === 'transfers') {
                    if (onInitiateTransfer) onInitiateTransfer();
                    else onNavigate?.('M3S02');
                  } else {
                    onNavigate?.(item.screen);
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.mainListItemLabel}>{item.label}</Text>
                <Text style={styles.mainListItemValue}>{item.count}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Actions */}
          <View style={styles.mainSectionHeaderRow}>
            <Text style={styles.mainSectionTitle}>Quick Actions</Text>
          </View>
          <View style={styles.mainQuickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.key}
                style={styles.mainQuickActionCard}
                onPress={() => {
                  if (action.isTransfer) {
                    if (onInitiateTransfer) onInitiateTransfer();
                    else onNavigate?.('M3S09');
                  } else if (action.screen) {
                    onNavigate?.(action.screen);
                  }
                }}
                activeOpacity={0.8}
              >
                {action.icon}
                <Text style={styles.mainQuickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <SWABottomNav activeTab="Inventory" onTabChange={onTabChange} />
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
  // Dashboard Header matching Design Mockup
  headerBand: {
    backgroundColor: adminColors.brand,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  notificationButton: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.headerIcon.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: adminColors.headerPill.bg,
    borderWidth: 1,
    borderColor: adminColors.headerPill.border,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: adminRadius.full,
    marginTop: 10,
    gap: 6,
  },
  warehouseText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },
  content: {
    flex: 1,
  },
  // Total Stock Card - WHITE background with BROWN text, 20px radius
  totalStockCard: {
    backgroundColor: adminColors.card,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 12,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  totalStockValue: {
    ...adminType.kpiValue,
    color: adminColors.brandDeep,
    marginBottom: 4,
  },
  totalStockLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    letterSpacing: 1.4,
  },
  // Stats Grid - 2 columns x 3 rows - WHITE background with subtle borders, LEFT-ALIGNED
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    rowGap: 12,
    columnGap: 10,
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: adminColors.card,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'flex-start',
    minHeight: 104,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: 10,
  },
  statValue: {
    ...adminType.kpiValue,
    color: adminColors.ink,
    marginTop: 4,
    marginBottom: 2,
  },
  lowStockValue: {
    ...adminType.kpiValue,
    color: adminColors.danger.text,
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  // Section
  section: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  viewAllLink: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
  },
  // Product Cards
  productCard: {
    backgroundColor: adminColors.card,
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productName: {
    ...adminType.title,
    color: adminColors.ink,
  },
  productGrade: {
    ...adminType.body,
    color: adminColors.muted,
    marginTop: 2,
  },
  availableBadge: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availableBadgeText: {
    ...adminType.rowTitle,
    color: adminColors.success.text,
  },
  lowStockBadge: {
    backgroundColor: adminColors.danger.bg,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lowStockBadgeText: {
    ...adminType.rowTitle,
    color: adminColors.danger.text,
  },
  productStats: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 14,
  },
  productStat: {
    minWidth: 64,
  },
  productStatLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: 3,
  },
  productStatValue: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  // Main Warehouse Styles (Matching Mockup Exactly)
  mainContent: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  mainScrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xxl,
  },
  mainHeaderTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  mainKpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: adminSpacing.md,
  },
  mainKpiCard: {
    width: '48.2%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    gap: 2,
    ...adminShadow.sm,
  },
  mainKpiLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    letterSpacing: 0.3,
  },
  mainKpiValue: {
    ...adminType.kpiValue,
    color: adminColors.ink,
    marginTop: 4,
  },
  mainKpiUnit: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  mainInfoBanner: {
    backgroundColor: adminColors.warning.bg,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.warning.border,
    padding: adminSpacing.md,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mainInfoBannerText: {
    ...adminType.caption,
    color: adminColors.warning.text,
    flex: 1,
    lineHeight: 18,
  },
  mainSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 10,
  },
  mainSectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
  },
  mainSectionLink: {
    ...adminType.rowTitle,
    color: adminColors.brand,
  },
  mainListCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: 2,
    ...adminShadow.sm,
  },
  mainListItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  mainListItemDivider: {
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  mainListItemLabel: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  mainListItemValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  healthCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    ...adminShadow.sm,
  },
  healthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
  },
  healthCell: {
    width: '48%',
  },
  healthCellLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: 4,
  },
  healthCellValue: {
    ...adminType.rowTitle,
  },
  recentMovementCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...adminShadow.sm,
  },
  recentMovementBadge: {
    width: 38,
    height: 38,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.warning.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentMovementInfo: {
    flex: 1,
  },
  recentMovementTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  recentMovementSub: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
  },
  recentMovementQty: {
    ...adminType.rowTitle,
    color: adminColors.success.text,
  },
  mainQuickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: adminSpacing.md,
    marginBottom: adminSpacing.lg,
  },
  mainQuickActionCard: {
    width: '48.2%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 18,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...adminShadow.sm,
  },
  mainQuickActionLabel: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    textAlign: 'center',
  },
});
