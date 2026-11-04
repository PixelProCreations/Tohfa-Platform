import React, { useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { adminColors, adminType, adminShadow } from '../../../theme';
import { OverviewCardsGrid, OverviewDashboardCard } from '../../../components';

import { SALE_WAREHOUSES, isAllWarehouses } from './SalesParts';
import { WarehouseSelector } from '../inventory';
import type { SalesChannel, WarehouseScreenBaseProps } from './types';
import { BellRingIcon, HeaderIconButton } from '../wallet-cashtopup/WalletParts';

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

function MoneyCardIcon({ color = adminColors.warning.text }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Path d="M6 12h.01M18 12h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function StorefrontCardIcon({ color = adminColors.brand }: { color?: string }) {
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

function CalendarActionIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CutleryCardIcon({ color = adminColors.brand }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M6 3v6a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3M8 11v10M17 3v18M14 3v5a3 3 0 0 0 3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BuildingCardIcon({ color = adminColors.brand }: { color?: string }) {
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
        d="M3 9a2.2 2.2 0 0 0 4.4 0 2.2 2.2 0 0 0 4.4 0 2.2 2.2 0 0 0 4.4 0V5H3v4z"
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

function CutleryActionIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5.5 4v6a2.8 2.8 0 0 0 2.8 2.8v7.2M8.3 4v6M11.1 4v6a2.8 2.8 0 0 1-2.8 2.8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

function BuildingActionIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 21h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path
        d="M4 21V5a1.5 1.5 0 0 1 1.5-1.5h7A1.5 1.5 0 0 1 14 5v16"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 10h5a1.5 1.5 0 0 1 1.5 1.5V21"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M7 8h3M7 12h3M7 16h3" stroke={color} strokeWidth="2" strokeLinecap="round" />
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

function ListLinesActionIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PlusCircleActionIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 8v8M8 12h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function HistoryActionIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 8v4l3 3" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BillingInvoicesActionIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth="1.9" />
      <Path d="M8 8h8M8 12h8M8 16h4" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InvoicesCountCardIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16l3-2 3 2 3-2 3 2 3-2 3 2V8z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6M8 13h8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InvoiceValueCardIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="3" stroke={color} strokeWidth="1.8" />
      <Path d="M2 10h20M6 15h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
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

export interface SalesScreenProps extends WarehouseScreenBaseProps {
  role?: string | undefined;
  onNavigateToNotifications?: (() => void) | undefined;
  onNavigateToNewSale: () => void;
  onNavigateToSalesHistory: () => void;
  onNavigateToMarketDaySales: () => void;
  onNavigateToChannelSales: (channel: SalesChannel) => void;
  /** Needs Attention is the shared dashboard-home-more queue (HomeFlow); the host opens it. Card hidden without it. */
  onNavigateToNeedsAttention?: ((category?: AttentionCategory) => void) | undefined;
  onNavigateToSaleDetail: (saleId?: string) => void;
  onNavigateToBilling?: (() => void) | undefined;
  onNavigateToPurchaseOrderDetail?: ((poId: string) => void) | undefined;
  onNavigateToPurchaseOrderReceipt?: ((poId: string) => void) | undefined;
  onNavigateToPurchaseOrderPayout?: ((poId: string) => void) | undefined;
  onNavigateToPurchaseOrdersList?: (() => void) | undefined;
  onNavigateToInvoiceDetail?: ((invId: string) => void) | undefined;
}

export function SalesScreen({
  scope,
  role,
  onBack,
  onTabChange,
  onNavigateToNotifications,
  onNavigateToNewSale,
  onNavigateToSalesHistory,
  onNavigateToMarketDaySales,
  onNavigateToChannelSales,
  onNavigateToNeedsAttention,
  onNavigateToSaleDetail,
  onNavigateToBilling,
  onNavigateToPurchaseOrderDetail,
  onNavigateToPurchaseOrderReceipt,
  onNavigateToPurchaseOrderPayout,
  onNavigateToPurchaseOrdersList,
  onNavigateToInvoiceDetail,
}: SalesScreenProps) {
  const isMain = isAllWarehouses(scope);
  const [pickedWarehouse, setPickedWarehouse] = useState<string | undefined>(undefined);

  const isTohfaAdmin = role === 'TOHFA_ADMIN';

  const headerWarehouse =
    scope.warehouseName ??
    SALE_WAREHOUSES.find((w) => w.warehouseId === pickedWarehouse)?.warehouseName ??
    'All warehouses';

  const handleOpenNewSale = () => onNavigateToNewSale();
  const handleOpenSalesHistory = () => onNavigateToSalesHistory();
  const handleOpenMarketDaySales = () => onNavigateToMarketDaySales();
  const handleOpenHorecaSales = () => onNavigateToChannelSales('HORECA');
  const handleOpenB2BSales = () => onNavigateToChannelSales('B2B');
  const handleOpenPurchaseOrdersList = () =>
    onNavigateToPurchaseOrdersList ? onNavigateToPurchaseOrdersList() : onNavigateToSalesHistory();
  const handleOpenBilling = () => onNavigateToBilling ? onNavigateToBilling() : Alert.alert('Billing', 'Opening Billing & Invoices...');
  const handleOpenNeedsAttention = (cat: AttentionCategory = 'all') => onNavigateToNeedsAttention?.(cat);
  const handleOpenSaleDetail = (saleId: string = 'SALE-00251') => onNavigateToSaleDetail(saleId);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Top Brand Header Banner ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerLeftGroup}>
            {onBack ? (
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                activeOpacity={0.75}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Back"
              >
                <ArrowBackIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>
            ) : null}
            <CashRegisterHeaderIcon size={24} color={adminColors.onBrand} />
            <Text style={styles.headerTitleText}>Purchase & Sales Orders</Text>
          </View>

          <HeaderIconButton
            accessibilityLabel="Notifications"
            onPress={() => {
              if (onNavigateToNotifications) {
                onNavigateToNotifications();
              } else {
                Alert.alert('Notifications', 'You have 3 unread notifications.');
              }
            }}
          >
            <BellRingIcon size={20} color={adminColors.onBrand} />
          </HeaderIconButton>
        </View>

        <View style={styles.warehouseBadgeRow}>
          {scope.warehouseId === undefined ? (
            <WarehouseSelector
              scope={scope}
              options={SALE_WAREHOUSES}
              selectedId={pickedWarehouse}
              onSelect={setPickedWarehouse}
            />
          ) : (
            <View style={styles.warehouseBadge}>
              <LockBadgeIcon />
              <Text style={styles.warehouseBadgeText}>{headerWarehouse}</Text>
            </View>
          )}
        </View>
      </View>

      {/* ─── Main Scrollable Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 1. Today's Sales by Channel Grid (8 Cards for Sub/Main Warehouse, 6 for Tohfa Admin) ─── */}
        <Text style={styles.sectionHeading}>Today's Sales by Channel</Text>
        <OverviewCardsGrid style={styles.kpiCardsGrid}>
          {/* Card 1: Today's Sales */}
          <OverviewDashboardCard
            value="₹24,850"
            title="Today's Sales"
            subtitle="Today's Sales · 42 txns"
            icon="sales"
          />

          {/* Card 2: Direct */}
          <OverviewDashboardCard
            value="₹8,450"
            title="Direct"
            subtitle="Direct · 18 sales"
            icon="direct"
          />

          {/* Card 3: Market */}
          <OverviewDashboardCard
            value="₹7,200"
            title="Market"
            subtitle="Market · 15 sales"
            icon="market"
          />

          {/* Card 4: HORECA */}
          <OverviewDashboardCard
            value="₹4,800"
            title="HORECA"
            subtitle="HORECA · 5 orders"
            icon="horeca"
            preserveCase
            onPress={handleOpenHorecaSales}
          />

          {/* Cards 5 & 6 (Sub Warehouse & Main Warehouse: Invoices metrics) */}
          {!isTohfaAdmin ? (
            <>
              <OverviewDashboardCard
                value="24"
                title="Today's Invoices"
                subtitle="Today's Invoices"
                icon="invoice"
              />

              <OverviewDashboardCard
                value="₹42,850"
                title="Invoice Value"
                subtitle="Invoice Value"
                icon="card"
              />
            </>
          ) : null}

          {/* Card: B2B */}
          <OverviewDashboardCard
            value="₹4,400"
            title="B2B"
            subtitle="B2B · 4 orders"
            icon="b2b"
            preserveCase
            onPress={handleOpenB2BSales}
          />

          {/* Card: Needs Attention */}
          <OverviewDashboardCard
            value="5"
            title="Needs Attention"
            subtitle="Needs Attention"
            icon="alert"
            tone="danger"
            onPress={() => handleOpenNeedsAttention('all')}
          />
        </OverviewCardsGrid>

        {/* ─── 2. Quick Actions (6 Buttons Grid) ─── */}
        <Text style={styles.sectionHeading}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {/* Tile 1: New Sale */}
          <TouchableOpacity
            style={styles.quickActionTile}
            onPress={handleOpenNewSale}
            activeOpacity={0.75}
          >
            <ShoppingCartActionIcon size={22} color={adminColors.brand} />
            <Text style={styles.quickActionLabel}>New Sale</Text>
          </TouchableOpacity>

          {/* Tile 2: Market Day Sales */}
          <TouchableOpacity
            style={styles.quickActionTile}
            onPress={handleOpenMarketDaySales}
            activeOpacity={0.75}
          >
            <StoreActionIcon size={22} color={adminColors.brand} />
            <Text style={styles.quickActionLabel}>Market Day Sales</Text>
          </TouchableOpacity>

          {/* Tile 3: Purchase & Sales (Tohfa Admin) vs Sales History (Sub & Main Warehouse) */}
          {isTohfaAdmin ? (
            <TouchableOpacity
              style={styles.quickActionTile}
              onPress={handleOpenPurchaseOrdersList}
              activeOpacity={0.75}
            >
              <ListLinesActionIcon size={22} color={adminColors.brand} />
              <Text style={styles.quickActionLabel}>Purchase & Sales</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.quickActionTile}
              onPress={handleOpenSalesHistory}
              activeOpacity={0.75}
            >
              <HistoryActionIcon size={22} color={adminColors.brand} />
              <Text style={styles.quickActionLabel}>Sales History</Text>
            </TouchableOpacity>
          )}

          {/* Tile 4: HORECA Sale */}
          <TouchableOpacity
            style={styles.quickActionTile}
            onPress={handleOpenHorecaSales}
            activeOpacity={0.75}
          >
            <CutleryActionIcon size={22} color={adminColors.brand} />
            <Text style={styles.quickActionLabel}>HORECA Sale</Text>
          </TouchableOpacity>

          {/* Tile 5: B2B Sale */}
          <TouchableOpacity
            style={styles.quickActionTile}
            onPress={handleOpenB2BSales}
            activeOpacity={0.75}
          >
            <BuildingActionIcon size={22} color={adminColors.brand} />
            <Text style={styles.quickActionLabel}>B2B Sale</Text>
          </TouchableOpacity>

          {/* Tile 6: Generate Invoice (Tohfa Admin) vs Billing & Invoices (Sub & Main Warehouse) */}
          {isTohfaAdmin ? (
            <TouchableOpacity
              style={styles.quickActionTile}
              onPress={handleOpenBilling}
              activeOpacity={0.75}
            >
              <PlusCircleActionIcon size={22} color={adminColors.brand} />
              <Text style={styles.quickActionLabel}>Generate Invoice</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.quickActionTile}
              onPress={handleOpenBilling}
              activeOpacity={0.75}
            >
              <BillingInvoicesActionIcon size={22} color={adminColors.brand} />
              <Text style={styles.quickActionLabel}>Billing & Invoices</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ─── 3. Today's Sales Summary ─── */}
        <Text style={styles.sectionHeading}>Today's Sales Summary</Text>
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
          <Text style={styles.sectionHeading}>Recent Sales</Text>
          <TouchableOpacity
            onPress={handleOpenSalesHistory}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>View all</Text>
          </TouchableOpacity>
        </View>

        {/* Card 1: SALE-00251 */}
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

        {/* Card 2: PO-0009 */}
        <View style={styles.recentSaleCard}>
          <View style={styles.recentSaleTopRow}>
            <Text style={styles.recentSaleId}>PO-0009</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <View style={styles.closedBadge}>
                <Text style={styles.closedBadgeText}>Closed</Text>
              </View>
              <View style={styles.paidBadge}>
                <Text style={styles.paidBadgeText}>Completed</Text>
              </View>
            </View>
          </View>
          <Text style={styles.recentSaleCustomer}>Listing LST-2909 · Kumar</Text>
          <Text style={styles.poSubLine}>Beans · Grade 2 · 60 kg</Text>
          <Text style={styles.poSubLine}>Unit price ₹55.00/kg · Total ₹3,300.00</Text>
          <Text style={styles.poSubWarehouse}>Main Warehouse, Ooty · 30 Sep 2026</Text>

          {/* Action Links Row (Tohfa Admin only) */}
          {isTohfaAdmin ? (
            <View style={styles.poLinksRow}>
              <TouchableOpacity
                onPress={() => onNavigateToPurchaseOrderDetail?.('PO-0009')}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <Text style={styles.poLinkText}>View PO</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => onNavigateToPurchaseOrderReceipt?.('PO-0009')}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <Text style={styles.poLinkText}>Open Receipt</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => onNavigateToPurchaseOrderPayout?.('PO-0009')}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <Text style={styles.poLinkText}>View Payout</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* ─── Recent Invoices (Sub & Main Warehouse only - Image 1) ─── */}
        {!isTohfaAdmin ? (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Recent Invoices</Text>
              <TouchableOpacity
                onPress={handleOpenBilling}
                activeOpacity={0.7}
              >
                <Text style={styles.viewAllText}>View all</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.recentInvoiceCard}>
              <View style={styles.recentSaleTopRow}>
                <Text style={styles.recentSaleId}>INV-2026-001245</Text>
                <View style={styles.generatedBadge}>
                  <Text style={styles.generatedBadgeText}>Generated</Text>
                </View>
              </View>
              <Text style={styles.recentSaleCustomer}>Ravi Kumar · ORD-002154</Text>
              <View style={styles.invoiceMidRow}>
                <Text style={styles.invoiceDateText}>25 Sep 2026, 10:42 AM</Text>
                <Text style={styles.invoiceAmountText}>₹2,450</Text>
              </View>

              <View style={styles.invoiceActionsRow}>
                <TouchableOpacity
                  style={styles.invoiceActionPill}
                  onPress={() => onNavigateToInvoiceDetail?.('INV-2026-001245')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.invoiceActionPillText}>View</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.invoiceActionPill}
                  onPress={() => Alert.alert('Download Invoice', 'Downloading invoice INV-2026-001245...')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.invoiceActionPillText}>Download</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : null}

        {/* ─── 5. Needs Attention ─── */}
        <View style={styles.needsAttentionHeader}>
          <WarningTriangleIcon size={18} color={adminColors.warning.text} />
          <Text style={styles.sectionHeading}>Needs Attention</Text>
        </View>

        <View style={styles.alertsContainer}>
          <TouchableOpacity
            style={styles.alertCardItem}
            onPress={() => handleOpenNeedsAttention('payment_pending')}
            activeOpacity={0.75}
          >
            <View style={[styles.alertAccentBar, { backgroundColor: '#EAB308' }]} />
            <View style={styles.alertIconBox}>
              <MoneyCardIcon color={adminColors.warning.text} />
            </View>
            <View style={styles.alertTextBox}>
              <Text style={styles.alertTitle}>Payment Pending</Text>
              <Text style={styles.alertSub}>2 sales awaiting payment</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.alertCardItem}
            onPress={() => handleOpenNeedsAttention('stock_issue')}
            activeOpacity={0.75}
          >
            <View style={[styles.alertAccentBar, { backgroundColor: '#EF4444' }]} />
            <View style={styles.alertIconBox}>
              <StockBoxIcon color={adminColors.danger.text} />
            </View>
            <View style={styles.alertTextBox}>
              <Text style={styles.alertTitle}>Stock Issue</Text>
              <Text style={styles.alertSub}>1 sale affected</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.alertCardItem}
            onPress={() => handleOpenNeedsAttention('failed_sale')}
            activeOpacity={0.75}
          >
            <View style={[styles.alertAccentBar, { backgroundColor: '#EF4444' }]} />
            <View style={styles.alertIconBox}>
              <ExclamationCircleCardIcon color={adminColors.danger.text} />
            </View>
            <View style={styles.alertTextBox}>
              <Text style={styles.alertTitle}>Failed Sale</Text>
              <Text style={styles.alertSub}>1 payment failure</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.alertCardItem}
            onPress={() => handleOpenNeedsAttention('invoice_issue')}
            activeOpacity={0.75}
          >
            <View style={[styles.alertAccentBar, { backgroundColor: '#EAB308' }]} />
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
    paddingBottom: 16,
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
    gap: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleText: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: 0.2,
  },
  warehouseBadgeRow: {
    marginTop: 4,
  },
  warehouseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  warehouseBadgeText: {
    color: adminColors.onBrand,
    ...adminType.caption,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginTop: 14,
    marginBottom: 10,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  viewAllText: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '600',
    color: adminColors.brand,
  },
  // ── KPI Cards Grid ──
  kpiCardsGrid: {
    marginBottom: 12,
  },
  // ── Quick Actions Grid ──
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  quickActionTile: {
    width: '31.5%',
    backgroundColor: adminColors.card,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
    minHeight: 88,
    gap: 8,
    ...adminShadow.sm,
  },
  quickActionLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: adminColors.ink,
    textAlign: 'center',
  },
  // ── Summary Card ──
  summaryCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: 14,
    ...adminShadow.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  summaryLabel: {
    ...adminType.body,
    color: adminColors.muted,
  },
  summaryValue: {
    ...adminType.body,
    fontWeight: '600',
    color: adminColors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: adminColors.border,
  },
  dividerThick: {
    height: 1.5,
    backgroundColor: adminColors.ink,
    marginVertical: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  totalLabel: {
    ...adminType.sectionHead,
    fontWeight: '700',
    color: adminColors.ink,
  },
  totalValue: {
    ...adminType.sectionHead,
    fontWeight: '700',
    color: adminColors.ink,
  },
  // ── Recent Sales Cards ──
  recentSaleCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: 10,
    ...adminShadow.sm,
  },
  recentSaleTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentSaleId: {
    fontSize: 15,
    fontWeight: '700',
    color: adminColors.ink,
  },
  paidBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  paidBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
  },
  closedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  closedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
  },
  recentSaleCustomer: {
    fontSize: 13.5,
    fontWeight: '600',
    color: adminColors.ink,
    marginBottom: 6,
  },
  recentSaleBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  recentSaleType: {
    fontSize: 12,
    color: adminColors.muted,
  },
  recentSaleTime: {
    fontSize: 12,
    color: adminColors.muted,
  },
  recentSaleAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: 6,
  },
  poSubLine: {
    fontSize: 12,
    color: adminColors.muted,
    marginTop: 2,
  },
  poSubWarehouse: {
    fontSize: 11.5,
    color: adminColors.muted,
    marginTop: 4,
  },
  poLinksRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F4EFEA',
  },
  poLinkText: {
    ...adminType.rowMeta,
    color: '#D97706',
    fontWeight: '700',
  },
  // ── Recent Invoices ──
  recentInvoiceCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: 12,
    ...adminShadow.sm,
  },
  generatedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  generatedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
  },
  invoiceMidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  invoiceDateText: {
    fontSize: 12,
    color: adminColors.muted,
  },
  invoiceAmountText: {
    fontSize: 16,
    fontWeight: '700',
    color: adminColors.ink,
  },
  invoiceActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  invoiceActionPill: {
    flex: 1,
    backgroundColor: '#FDE8CD',
    borderWidth: 1,
    borderColor: '#E8D5BC',
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  invoiceActionPillText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#8A4A00',
  },
  // ── Needs Attention ──
  needsAttentionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    marginBottom: 6,
  },
  alertsContainer: {
    gap: 8,
    marginBottom: 12,
  },
  alertCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    overflow: 'hidden',
    position: 'relative',
    ...adminShadow.sm,
  },
  alertAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  alertIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: adminColors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginLeft: 4,
  },
  alertTextBox: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: adminColors.ink,
  },
  alertSub: {
    fontSize: 11.5,
    color: adminColors.muted,
    marginTop: 2,
  },
});
