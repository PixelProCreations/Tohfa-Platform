import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { adminColors, adminType, adminShadow } from '../../../theme';

import { SALE_WAREHOUSES, WarehouseChips } from './SalesParts';
import type { SalesChannel, WarehouseScreenBaseProps } from './types';


// ─── SVG Icons ───────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

function CashRegisterHeaderIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 7h16M7 3h10v4H7zM3 11h18v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9zM7 15h2M11 15h2M15 15h2M7 18h10"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LockBadgeIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke={adminColors.onBrand} strokeWidth="2.2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={adminColors.onBrand} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function BellHeaderIcon() {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
        stroke={adminColors.onBrand}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MoneyCardIcon({ color = adminColors.warning.text }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Path d="M6 12h.01M18 12h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function StorefrontCardIcon({ color = adminColors.warning.text }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 8a2.2 2.2 0 0 0 4.4 0 2.2 2.2 0 0 0 4.4 0 2.2 2.2 0 0 0 4.4 0 2.2 2.2 0 0 0 4.4 0V4H3v4z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M4 10.2V20a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9.8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 21v-6h6v6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CutleryCardIcon({ color = adminColors.warning.text }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M6 3v6a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3M8 11v10M17 3v18M14 3v5a3 3 0 0 0 3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BuildingCardIcon({ color = adminColors.warning.text }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M15 10h4a2 2 0 0 1 2 2v9M9 7h2M9 11h2M9 15h2M18 14h1M18 17h1" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ExclamationCircleCardIcon({ color = adminColors.danger.text }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 8v4M12 16h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ShoppingCartActionIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="20" r="1.5" stroke={color} strokeWidth="2" />
      <Circle cx="18" cy="20" r="1.5" stroke={color} strokeWidth="2" />
      <Path
        d="M2 4h3l2.2 10.5a1.8 1.8 0 0 0 1.8 1.5h8.5a1.8 1.8 0 0 0 1.8-1.5L21 8H6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M13 2v4M11 4h4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function StoreActionIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9a2.2 2.2 0 0 0 4.4 0 2.2 2.2 0 0 0 4.4 0 2.2 2.2 0 0 0 4.4 0 2.2 2.2 0 0 0 4.4 0V5H3v4z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M4 11.2V20a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8.8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 21v-6h6v6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 5V3M12 5V3M17 5V3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function HistoryClockActionIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 3v5h5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 7v5l3 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CutleryActionIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Fork: 3 prongs, neck and handle */}
      <Path
        d="M5.5 4v6a2.8 2.8 0 0 0 2.8 2.8v7.2M8.3 4v6M11.1 4v6a2.8 2.8 0 0 1-2.8 2.8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Knife: contoured blade and handle */}
      <Path
        d="M18.5 4v16M18.5 4c-3 0-5 2.5-5 6v4h5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BuildingActionIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Ground baseline */}
      <Path d="M3 21h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Main Building Body */}
      <Path
        d="M4 21V5a1.5 1.5 0 0 1 1.5-1.5h7A1.5 1.5 0 0 1 14 5v16"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Side Wing */}
      <Path
        d="M14 10h5a1.5 1.5 0 0 1 1.5 1.5V21"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Windows - Main Tower */}
      <Path d="M7 8h3M7 12h3M7 16h3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Windows - Side Wing */}
      <Path d="M17 14h1M17 17h1" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function WarningTriangleIcon({ size = 18, color = adminColors.warning.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 9v4M12 17h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function StockBoxIcon({ size = 20, color = adminColors.danger.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 8h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 8l3-5h12l3 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 12h4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InvoiceDocumentIcon({ size = 20, color = adminColors.warning.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
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

type AttentionCategory = 'all' | 'payment_pending' | 'stock_issue' | 'failed_sale' | 'invoice_issue';

// Design id: M6-S01
// HORECA / B2B cards: the role matrix says MW=view / SW=none but no per-channel
// code exists in docs/rbac.json, so they stay ungated (SPEC_GAPS #5).
export interface SalesScreenProps extends WarehouseScreenBaseProps {
  onNavigateToNotifications?: (() => void) | undefined;
  onNavigateToNewSale: () => void;
  onNavigateToSalesHistory: () => void;
  onNavigateToMarketDaySales: () => void;
  onNavigateToChannelSales: (channel: SalesChannel) => void;
  /** Needs Attention is a Sub screen not yet in an area folder; the host opens it. Card hidden without it. */
  onNavigateToNeedsAttention?: ((category?: AttentionCategory) => void) | undefined;
  onNavigateToSaleDetail: (saleId?: string) => void;
}

export function SalesScreen({
  scope,
  onBack,
  onTabChange,
  onNavigateToNotifications,
  onNavigateToNewSale,
  onNavigateToSalesHistory,
  onNavigateToMarketDaySales,
  onNavigateToChannelSales,
  onNavigateToNeedsAttention,
  onNavigateToSaleDetail,
}: SalesScreenProps) {
  // Main only: the warehouse the hub totals are for (undefined = all four).
  const [pickedWarehouse, setPickedWarehouse] = useState<string | undefined>(undefined);
  const headerWarehouse =
    scope.warehouseName ??
    SALE_WAREHOUSES.find((w) => w.warehouseId === pickedWarehouse)?.warehouseName ??
    'All warehouses';

  const handleOpenNewSale = () => onNavigateToNewSale();
  const handleOpenSalesHistory = () => onNavigateToSalesHistory();
  const handleOpenMarketDaySales = () => onNavigateToMarketDaySales();
  const handleOpenHorecaSales = () => onNavigateToChannelSales('HORECA');
  const handleOpenB2BSales = () => onNavigateToChannelSales('B2B');
  const handleOpenNeedsAttention = (cat: AttentionCategory = 'all') => onNavigateToNeedsAttention?.(cat);
  const handleOpenSaleDetail = (saleId: string = 'SALE-00251') => onNavigateToSaleDetail(saleId);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Top Brand Header Banner ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerLeftGroup}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                if (onBack) onBack();
                else if (onTabChange) onTabChange('Home');
              }}
              activeOpacity={0.75}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ArrowBackIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <View style={styles.headerTitleRow}>
              <CashRegisterHeaderIcon size={24} color={adminColors.onBrand} />
              <Text style={styles.headerTitleText}>Sales</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.headerBellBtn}
            onPress={() => {
              if (onNavigateToNotifications) {
                onNavigateToNotifications();
              } else {
                Alert.alert('Notifications', 'You have 3 unread notifications.');
              }
            }}
            activeOpacity={0.8}
          >
            <BellHeaderIcon />
            <View style={styles.notifBadgeDot} />
          </TouchableOpacity>
        </View>

        <View style={styles.warehouseBadgeRow}>
          <View style={styles.warehouseBadge}>
            <LockBadgeIcon />
            <Text style={styles.warehouseBadgeText}>{headerWarehouse}</Text>
          </View>
        </View>
      </View>

      {/* ─── Main Scrollable Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <WarehouseChips scope={scope} selected={pickedWarehouse} onSelect={setPickedWarehouse} />

        {/* ─── 1. Today's Sales by Channel ─── */}
        <Text style={styles.sectionTitle}>Today's Sales by Channel</Text>

        <View style={styles.channelGrid}>
          {/* Card 1: Today's Sales */}
          <TouchableOpacity
            style={styles.channelCard}
            onPress={() => Alert.alert("Today's Sales", '₹24,850 total revenue across 42 transactions today.')}
            activeOpacity={0.75}
          >
            <View style={styles.cardIconWrap}>
              <MoneyCardIcon />
            </View>
            <Text style={styles.cardAmount}>₹24,850</Text>
            <Text style={styles.cardSubtitle}>Today's Sales · 42 txns</Text>
          </TouchableOpacity>

          {/* Card 2: Direct */}
          <TouchableOpacity
            style={styles.channelCard}
            onPress={handleOpenNewSale}
            activeOpacity={0.75}
          >
            <View style={styles.cardIconWrap}>
              <StorefrontCardIcon />
            </View>
            <Text style={styles.cardAmount}>₹8,450</Text>
            <Text style={styles.cardSubtitle}>Direct · 18 sales</Text>
          </TouchableOpacity>

          {/* Card 3: Market */}
          <TouchableOpacity
            style={styles.channelCard}
            onPress={handleOpenMarketDaySales}
            activeOpacity={0.75}
          >
            <View style={styles.cardIconWrap}>
              <StorefrontCardIcon />
            </View>
            <Text style={styles.cardAmount}>₹7,200</Text>
            <Text style={styles.cardSubtitle}>Market · 15 sales</Text>
          </TouchableOpacity>

          {/* Card 4: HORECA */}
          <TouchableOpacity
            style={styles.channelCard}
            onPress={handleOpenHorecaSales}
            activeOpacity={0.75}
          >
            <View style={styles.cardIconWrap}>
              <CutleryCardIcon />
            </View>
            <Text style={styles.cardAmount}>₹4,800</Text>
            <Text style={styles.cardSubtitle}>HORECA · 5 orders</Text>
          </TouchableOpacity>

          {/* Card 5: B2B */}
          <TouchableOpacity
            style={styles.channelCard}
            onPress={handleOpenB2BSales}
            activeOpacity={0.75}
          >
            <View style={styles.cardIconWrap}>
              <BuildingCardIcon color={adminColors.brand} />
            </View>
            <Text style={styles.cardAmount}>₹4,400</Text>
            <Text style={styles.cardSubtitle}>B2B · 4 orders</Text>
          </TouchableOpacity>

          {/* Card 6: Needs Attention */}
          <TouchableOpacity
            style={styles.channelCard}
            onPress={() => handleOpenNeedsAttention('all')}
            activeOpacity={0.75}
          >
            <View style={styles.cardIconWrap}>
              <ExclamationCircleCardIcon color={adminColors.danger.text} />
            </View>
            <Text style={[styles.cardAmount, { color: adminColors.danger.text }]}>5</Text>
            <Text style={styles.cardSubtitle}>Needs Attention</Text>
          </TouchableOpacity>
        </View>

        {/* ─── 2. Quick Actions ─── */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.quickActionsRow}>
          {/* Action 1: New Direct Sale */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleOpenNewSale}
            activeOpacity={0.75}
          >
            <ShoppingCartActionIcon size={24} color={adminColors.brand} />
            <Text style={styles.actionBtnLabel}>New Direct Sale</Text>
          </TouchableOpacity>

          {/* Action 2: Market Day Sales */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleOpenMarketDaySales}
            activeOpacity={0.75}
          >
            <StoreActionIcon size={24} color={adminColors.brand} />
            <Text style={styles.actionBtnLabel}>Market Day Sales</Text>
          </TouchableOpacity>

          {/* Action 3: Sales History */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleOpenSalesHistory}
            activeOpacity={0.75}
          >
            <HistoryClockActionIcon size={24} color={adminColors.brand} />
            <Text style={styles.actionBtnLabel}>Sales History</Text>
          </TouchableOpacity>
        </View>

        {/* Row 2: HORECA Sale & B2B Sale (Circled in red in Screenshot 2) */}
        <View style={[styles.quickActionsRow, { marginTop: 10 }]}>
          {/* Action 4: HORECA Sale */}
          <TouchableOpacity
            style={styles.actionBtnHalf}
            onPress={handleOpenHorecaSales}
            activeOpacity={0.75}
          >
            <CutleryActionIcon size={24} color={adminColors.brand} />
            <Text style={styles.actionBtnLabel}>HORECA Sale</Text>
          </TouchableOpacity>

          {/* Action 5: B2B Sale */}
          <TouchableOpacity
            style={styles.actionBtnHalf}
            onPress={handleOpenB2BSales}
            activeOpacity={0.75}
          >
            <BuildingActionIcon size={24} color={adminColors.brand} />
            <Text style={styles.actionBtnLabel}>B2B Sale</Text>
          </TouchableOpacity>
        </View>

        {/* ─── 3. Today's Sales Summary ─── */}
        <Text style={styles.sectionTitle}>Today's Sales Summary</Text>

        <View style={styles.summaryCard}>
          <TouchableOpacity
            style={styles.summaryRow}
            onPress={handleOpenNewSale}
            activeOpacity={0.7}
          >
            <Text style={styles.summaryLabel}>Direct</Text>
            <Text style={styles.summaryValue}>₹8,450</Text>
          </TouchableOpacity>
          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.summaryRow}
            onPress={handleOpenMarketDaySales}
            activeOpacity={0.7}
          >
            <Text style={styles.summaryLabel}>Market</Text>
            <Text style={styles.summaryValue}>₹7,200</Text>
          </TouchableOpacity>
          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.summaryRow}
            onPress={handleOpenHorecaSales}
            activeOpacity={0.7}
          >
            <Text style={styles.summaryLabel}>HORECA</Text>
            <Text style={styles.summaryValue}>₹4,800</Text>
          </TouchableOpacity>
          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.summaryRow}
            onPress={handleOpenB2BSales}
            activeOpacity={0.7}
          >
            <Text style={styles.summaryLabel}>B2B</Text>
            <Text style={styles.summaryValue}>₹4,400</Text>
          </TouchableOpacity>
          <View style={styles.dividerThick} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹24,850</Text>
          </View>
        </View>

        {/* ─── 4. Recent Sales ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Sales</Text>
          <TouchableOpacity
            onPress={handleOpenSalesHistory}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>View all</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.recentSaleCard}
          onPress={() => handleOpenSaleDetail('SALE-00251')}
          activeOpacity={0.8}
        >
          <View style={styles.recentSaleTopRow}>
            <Text style={styles.recentSaleId}>SALE-00251</Text>
            <View style={styles.paidBadge}>
              <Text style={styles.paidBadgeText}>Paid</Text>
            </View>
          </View>
          <Text style={styles.recentSaleCustomer}>Rajesh Kumar · 2 Items</Text>
          <View style={styles.recentSaleBottomRow}>
            <Text style={styles.recentSaleType}>Direct Sale</Text>
            <Text style={styles.recentSaleTime}>Today · 6:35 PM</Text>
          </View>
          <Text style={styles.recentSaleAmount}>₹500</Text>
        </TouchableOpacity>

        {/* ─── 5. Needs Attention ─── */}
        <View style={styles.needsAttentionHeader}>
          <WarningTriangleIcon size={18} color={adminColors.ink} />
          <Text style={styles.sectionTitle}>Needs Attention</Text>
        </View>

        <View style={styles.alertsContainer}>
          {/* Alert 1: Payment Pending */}
          <TouchableOpacity
            style={styles.alertCardItem}
            onPress={() => handleOpenNeedsAttention('payment_pending')}
            activeOpacity={0.75}
          >
            <View style={[styles.alertAccentBar, { backgroundColor: adminColors.warning.text }]} />
            <View style={styles.alertIconBox}>
              <MoneyCardIcon color={adminColors.warning.text} />
            </View>
            <View style={styles.alertTextBox}>
              <Text style={styles.alertTitle}>Payment Pending</Text>
              <Text style={styles.alertSub}>2 sales awaiting payment</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>

          {/* Alert 2: Stock Issue */}
          <TouchableOpacity
            style={styles.alertCardItem}
            onPress={() => handleOpenNeedsAttention('stock_issue')}
            activeOpacity={0.75}
          >
            <View style={[styles.alertAccentBar, { backgroundColor: adminColors.danger.text }]} />
            <View style={styles.alertIconBox}>
              <StockBoxIcon color={adminColors.danger.text} />
            </View>
            <View style={styles.alertTextBox}>
              <Text style={styles.alertTitle}>Stock Issue</Text>
              <Text style={styles.alertSub}>1 sale affected</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>

          {/* Alert 3: Failed Sale */}
          <TouchableOpacity
            style={styles.alertCardItem}
            onPress={() => handleOpenNeedsAttention('failed_sale')}
            activeOpacity={0.75}
          >
            <View style={[styles.alertAccentBar, { backgroundColor: adminColors.danger.text }]} />
            <View style={styles.alertIconBox}>
              <ExclamationCircleCardIcon color={adminColors.danger.text} />
            </View>
            <View style={styles.alertTextBox}>
              <Text style={styles.alertTitle}>Failed Sale</Text>
              <Text style={styles.alertSub}>1 payment failure</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>

          {/* Alert 4: Invoice Issue */}
          <TouchableOpacity
            style={styles.alertCardItem}
            onPress={() => handleOpenNeedsAttention('invoice_issue')}
            activeOpacity={0.75}
          >
            <View style={[styles.alertAccentBar, { backgroundColor: adminColors.warning.text }]} />
            <View style={styles.alertIconBox}>
              <InvoiceDocumentIcon color={adminColors.warning.text} />
            </View>
            <View style={styles.alertTextBox}>
              <Text style={styles.alertTitle}>Invoice Issue</Text>
              <Text style={styles.alertSub}>1 invoice needs review</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>
        </View>

        <View style={{ height: 28 }} />
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    // Was translucent white over the orange header; no overlay token exists, so a solid deep-orange fill.
    backgroundColor: adminColors.brandDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitleText: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: 0.2,
  },
  warehouseBadgeRow: {
    marginTop: 2,
  },
  warehouseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    // Was translucent white over the orange header; no overlay token exists, so a solid deep-orange fill.
    backgroundColor: adminColors.brandDeep,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  warehouseBadgeText: {
    color: adminColors.onBrand,
    ...adminType.rowTitle,
  },
  headerBellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    // Was translucent white over the orange header; no overlay token exists, so a solid deep-orange fill.
    backgroundColor: adminColors.brandDeep,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadgeDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: adminColors.card,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 32,
  },
  sectionTitle: {
    ...adminType.title,
    color: adminColors.ink,
    marginBottom: 12,
    marginTop: 6,
  },
  channelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 18,
  },
  channelCard: {
    width: '48.5%',
    backgroundColor: adminColors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    minHeight: 96,
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  cardIconWrap: {
    marginBottom: 8,
  },
  cardAmount: {
    ...adminType.title,
    color: adminColors.ink,
    marginBottom: 3,
  },
  cardSubtitle: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 18,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 88,
    ...adminShadow.sm,
  },
  actionBtnHalf: {
    width: '48%',
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 88,
    ...adminShadow.sm,
  },
  actionBtnLabel: {
    ...adminType.caption,
    color: adminColors.ink,
    textAlign: 'center',
    marginTop: 8,
  },
  summaryCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 6,
    ...adminShadow.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
  },
  summaryLabel: {
    ...adminType.body,
    color: adminColors.muted,
  },
  summaryValue: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: adminColors.border,
  },
  dividerThick: {
    height: 1.5,
    backgroundColor: adminColors.border,
    marginVertical: 2,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  totalLabel: {
    ...adminType.title,
    color: adminColors.ink,
  },
  totalValue: {
    ...adminType.title,
    color: adminColors.ink,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 10,
  },
  viewAllText: {
    ...adminType.sectionHead,
    color: adminColors.brand,
  },
  recentSaleCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    marginBottom: 10,
    position: 'relative',
    ...adminShadow.sm,
  },
  recentSaleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  recentSaleId: {
    ...adminType.title,
    color: adminColors.ink,
  },
  paidBadge: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  paidBadgeText: {
    color: adminColors.success.text,
    ...adminType.rowTitle,
  },
  recentSaleCustomer: {
    ...adminType.body,
    color: adminColors.muted,
    marginBottom: 10,
  },
  recentSaleBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 80,
  },
  recentSaleType: {
    ...adminType.body,
    color: adminColors.muted,
  },
  recentSaleTime: {
    ...adminType.body,
    color: adminColors.muted,
  },
  recentSaleAmount: {
    position: 'absolute',
    right: 16,
    bottom: 14,
    ...adminType.title,
    color: adminColors.ink,
  },
  needsAttentionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
    marginBottom: 4,
  },
  alertsContainer: {
    gap: 10,
    marginTop: 8,
  },
  alertCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 14,
    paddingHorizontal: 14,
    paddingLeft: 18,
    position: 'relative',
    overflow: 'hidden',
    ...adminShadow.sm,
  },
  alertAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  alertIconBox: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertTextBox: {
    flex: 1,
  },
  alertTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: 2,
  },
  alertSub: {
    ...adminType.body,
    color: adminColors.muted,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingVertical: 8,
    paddingBottom: 14,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    minWidth: 60,
  },
  navLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 3,
  },
  navLabelActive: {
    color: adminColors.brand,
    fontWeight: '700',
  },
});
