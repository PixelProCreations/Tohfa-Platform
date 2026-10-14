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

import { SALE_WAREHOUSES, WarehouseChips, isAllWarehouses } from './SalesParts';
import { WarehouseSelector } from '../inventory';
import type { SalesChannel, WarehouseScreenBaseProps } from './types';
import { WarehouseTabBar } from '../wallet-cashtopup/WalletParts';


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

function GridSquareIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2.2" />
      <Rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2.2" />
      <Rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2.2" />
      <Rect x="14" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2.2" />
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

function BellHeaderIcon({ color = adminColors.onBrand }: { color?: string }) {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronDownIcon({ size = 16, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckmarkIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
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
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
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

function CalendarActionIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CutleryCardIcon({ color = adminColors.brand }: { color?: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M6 3v6a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3M8 11v10M17 3v18M14 3v5a3 3 0 0 0 3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BuildingCardIcon({ color = adminColors.brand }: { color?: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
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

function BuildingActionIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
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

const WAREHOUSE_OPTIONS = [
  { id: undefined, name: 'All Warehouses' },
  { id: 'OOTY', name: 'Ooty' },
  { id: 'COONOOR', name: 'Coonoor' },
  { id: 'KOTAGIRI', name: 'Kotagiri' },
  { id: 'GUDALUR', name: 'Gudalur' },
] as const;

// Design id: M6-S01 & M6-01 Sales Dashboard
export interface SalesScreenProps extends WarehouseScreenBaseProps {
  onNavigateToNotifications?: (() => void) | undefined;
  onNavigateToNewSale: () => void;
  onNavigateToSalesHistory: () => void;
  onNavigateToMarketDaySales: () => void;
  onNavigateToChannelSales: (channel: SalesChannel) => void;
  /** Needs Attention is the shared dashboard-home-more queue (HomeFlow); the host opens it. Card hidden without it. */
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
  const isMain = isAllWarehouses(scope);
  // Main only: the warehouse the hub totals are for (undefined = all warehouses).
  const [pickedWarehouse, setPickedWarehouse] = useState<string | undefined>(undefined);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);

  const pickedWarehouseObj = WAREHOUSE_OPTIONS.find((w) => w.id === pickedWarehouse);
  const pickedWarehouseName = pickedWarehouseObj?.name ?? 'All Warehouses';

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

  // Computed data based on picked warehouse
  const kpiData = {
    todaySales: pickedWarehouse === 'OOTY' ? '₹6,200' : pickedWarehouse === 'COONOOR' ? '₹8,450' : '₹24,850',
    todayTxns: pickedWarehouse === 'OOTY' ? '12 transactions' : pickedWarehouse === 'COONOOR' ? '16 transactions' : '42 transactions',
    directSales: pickedWarehouse === 'OOTY' ? '₹3,100' : pickedWarehouse === 'COONOOR' ? '₹4,250' : '₹8,450',
    directTxns: pickedWarehouse === 'OOTY' ? '6 sales' : pickedWarehouse === 'COONOOR' ? '8 sales' : '18 sales',
    marketSales: pickedWarehouse === 'OOTY' ? '₹2,100' : pickedWarehouse === 'COONOOR' ? '₹2,800' : '₹7,200',
    marketTxns: pickedWarehouse === 'OOTY' ? '4 sales' : pickedWarehouse === 'COONOOR' ? '5 sales' : '15 sales',
    horecaSales: pickedWarehouse === 'OOTY' ? '₹600' : pickedWarehouse === 'COONOOR' ? '₹800' : '₹4,800',
    horecaOrders: pickedWarehouse === 'OOTY' ? '1 orders' : pickedWarehouse === 'COONOOR' ? '2 orders' : '5 orders',
    b2bSales: pickedWarehouse === 'OOTY' ? '₹400' : pickedWarehouse === 'COONOOR' ? '₹600' : '₹4,400',
    b2bOrders: pickedWarehouse === 'OOTY' ? '1 orders' : pickedWarehouse === 'COONOOR' ? '1 orders' : '4 orders',
    needsAttentionCount: pickedWarehouse === 'OOTY' ? '2' : pickedWarehouse === 'COONOOR' ? '1' : '5',
  };

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
            {isMain ? (
              <GridSquareIcon size={24} color={adminColors.onBrand} />
            ) : (
              <CashRegisterHeaderIcon size={24} color={adminColors.onBrand} />
            )}
            <Text style={styles.headerTitleText}>{isMain ? 'New Direct Sale' : 'Sales'}</Text>
          </View>

          <TouchableOpacity
            style={isMain ? styles.headerBellBtnWhite : styles.headerBellBtn}
            onPress={() => {
              if (onNavigateToNotifications) {
                onNavigateToNotifications();
              } else {
                Alert.alert('Notifications', 'You have 3 unread notifications.');
              }
            }}
            activeOpacity={0.8}
          >
            <BellHeaderIcon color={isMain ? adminColors.brand : adminColors.onBrand} />
          </TouchableOpacity>
        </View>

        {isMain ? (
          <View style={styles.warehouseDropdownRow}>
            <TouchableOpacity
              style={styles.warehouseDropdownPill}
              onPress={() => setShowWarehouseModal(true)}
              activeOpacity={0.85}
            >
              <BuildingCardIcon color={adminColors.brand} />
              <Text style={styles.warehouseDropdownText}>{pickedWarehouseName}</Text>
              <ChevronDownIcon size={16} color={adminColors.brand} />
            </TouchableOpacity>
          </View>
        ) : (
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
        )}
      </View>

      {/* ─── Main Warehouse Selection Modal ─── */}
      {isMain ? (
        <Modal
          visible={showWarehouseModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowWarehouseModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowWarehouseModal(false)}>
            <View style={styles.modalBackdrop}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Select Warehouse</Text>
                  {WAREHOUSE_OPTIONS.map((item) => {
                    const isSelected = pickedWarehouse === item.id;
                    return (
                      <TouchableOpacity
                        key={item.name}
                        style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                        onPress={() => {
                          setPickedWarehouse(item.id);
                          setShowWarehouseModal(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>
                          {item.name}
                        </Text>
                        {isSelected ? <CheckmarkIcon size={18} color={adminColors.brand} /> : null}
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setShowWarehouseModal(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      ) : null}

      {/* ─── Main Scrollable Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isMain ? (
          /* ═══════════════════════════════════════════════════════════════════════
             MAIN WAREHOUSE VIEW (M6-01 Sales Dashboard)
             ═══════════════════════════════════════════════════════════════════════ */
          <>
            {/* 6 Top KPI Cards */}
            <View style={styles.mainKpiGrid}>
              {/* Card 1: TODAY'S SALES */}
              <TouchableOpacity
                style={styles.mainKpiCard}
                onPress={() => Alert.alert("Today's Sales", `${kpiData.todaySales} across ${kpiData.todayTxns}.`)}
                activeOpacity={0.75}
              >
                <Text style={styles.mainKpiLabel}>TODAY'S SALES</Text>
                <Text style={styles.mainKpiValue}>{kpiData.todaySales}</Text>
                <Text style={styles.mainKpiSub}>{kpiData.todayTxns}</Text>
              </TouchableOpacity>

              {/* Card 2: DIRECT SALES */}
              <TouchableOpacity
                style={styles.mainKpiCard}
                onPress={handleOpenNewSale}
                activeOpacity={0.75}
              >
                <Text style={styles.mainKpiLabel}>DIRECT SALES</Text>
                <Text style={styles.mainKpiValue}>{kpiData.directSales}</Text>
                <Text style={styles.mainKpiSub}>{kpiData.directTxns}</Text>
              </TouchableOpacity>

              {/* Card 3: MARKET SALES */}
              <TouchableOpacity
                style={styles.mainKpiCard}
                onPress={handleOpenMarketDaySales}
                activeOpacity={0.75}
              >
                <Text style={styles.mainKpiLabel}>MARKET SALES</Text>
                <Text style={styles.mainKpiValue}>{kpiData.marketSales}</Text>
                <Text style={styles.mainKpiSub}>{kpiData.marketTxns}</Text>
              </TouchableOpacity>

              {/* Card 4: HORECA */}
              <TouchableOpacity
                style={styles.mainKpiCard}
                onPress={handleOpenHorecaSales}
                activeOpacity={0.75}
              >
                <Text style={styles.mainKpiLabel}>HORECA</Text>
                <Text style={styles.mainKpiValue}>{kpiData.horecaSales}</Text>
                <Text style={styles.mainKpiSub}>{kpiData.horecaOrders}</Text>
              </TouchableOpacity>

              {/* Card 5: B2B */}
              <TouchableOpacity
                style={styles.mainKpiCard}
                onPress={handleOpenB2BSales}
                activeOpacity={0.75}
              >
                <Text style={styles.mainKpiLabel}>B2B</Text>
                <Text style={styles.mainKpiValue}>{kpiData.b2bSales}</Text>
                <Text style={styles.mainKpiSub}>{kpiData.b2bOrders}</Text>
              </TouchableOpacity>

              {/* Card 6: NEEDS ATTENTION */}
              <TouchableOpacity
                style={styles.mainKpiCard}
                onPress={() => handleOpenNeedsAttention('all')}
                activeOpacity={0.75}
              >
                <Text style={styles.mainKpiLabel}>NEEDS ATTENTION</Text>
                <Text style={styles.mainKpiValue}>{kpiData.needsAttentionCount}</Text>
              </TouchableOpacity>
            </View>

            {/* Warehouse Sales Summary */}
            <Text style={styles.mainSectionHeading}>Warehouse Sales Summary</Text>

            {pickedWarehouse === undefined || pickedWarehouse === 'OOTY' ? (
              <TouchableOpacity
                style={styles.whSummaryCard}
                onPress={() => setPickedWarehouse(pickedWarehouse === 'OOTY' ? undefined : 'OOTY')}
                activeOpacity={0.8}
              >
                <View style={styles.whSummaryTopRow}>
                  <Text style={styles.whSummaryName}>Ooty</Text>
                  <View style={styles.whSummaryBadge}>
                    <Text style={styles.whSummaryBadgeText}>₹6,200</Text>
                  </View>
                </View>
                <Text style={styles.whSummarySub}>12 transactions</Text>
              </TouchableOpacity>
            ) : null}

            {pickedWarehouse === undefined || pickedWarehouse === 'COONOOR' ? (
              <TouchableOpacity
                style={styles.whSummaryCard}
                onPress={() => setPickedWarehouse(pickedWarehouse === 'COONOOR' ? undefined : 'COONOOR')}
                activeOpacity={0.8}
              >
                <View style={styles.whSummaryTopRow}>
                  <Text style={styles.whSummaryName}>Coonoor</Text>
                  <View style={styles.whSummaryBadge}>
                    <Text style={styles.whSummaryBadgeText}>₹8,450</Text>
                  </View>
                </View>
                <Text style={styles.whSummarySub}>16 transactions</Text>
              </TouchableOpacity>
            ) : null}

            {/* Sales Channel Summary */}
            <Text style={styles.mainSectionHeading}>Sales Channel Summary</Text>
            <View style={styles.channelGrid2x2}>
              <TouchableOpacity
                style={styles.channelCardBtn}
                onPress={handleOpenNewSale}
                activeOpacity={0.75}
              >
                <View style={styles.channelIconBox}>
                  <StorefrontCardIcon color={adminColors.brand} />
                </View>
                <Text style={styles.channelCardBtnTitle}>Direct</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.channelCardBtn}
                onPress={handleOpenMarketDaySales}
                activeOpacity={0.75}
              >
                <View style={styles.channelIconBox}>
                  <CalendarActionIcon size={24} color={adminColors.brand} />
                </View>
                <Text style={styles.channelCardBtnTitle}>Market</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.channelCardBtn}
                onPress={handleOpenHorecaSales}
                activeOpacity={0.75}
              >
                <View style={styles.channelIconBox}>
                  <CutleryCardIcon color={adminColors.brand} />
                </View>
                <Text style={styles.channelCardBtnTitle}>HORECA</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.channelCardBtn}
                onPress={handleOpenB2BSales}
                activeOpacity={0.75}
              >
                <View style={styles.channelIconBox}>
                  <BuildingCardIcon color={adminColors.brand} />
                </View>
                <Text style={styles.channelCardBtnTitle}>B2B</Text>
              </TouchableOpacity>
            </View>

            {/* Needs Attention */}
            <View style={styles.mainSectionHeaderRow}>
              <Text style={styles.mainSectionHeading}>Needs Attention</Text>
              <TouchableOpacity
                onPress={() => handleOpenNeedsAttention('all')}
                activeOpacity={0.7}
              >
                <Text style={styles.mainSectionLink}>View →</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.mainAlertCard}
              onPress={() => handleOpenNeedsAttention('stock_issue')}
              activeOpacity={0.8}
            >
              <View style={styles.mainAlertIconWrap}>
                <WarningTriangleIcon size={22} color={adminColors.warning.text} />
              </View>
              <View style={styles.mainAlertTextWrap}>
                <Text style={styles.mainAlertTitle}>Stock Updated — 2 sales in cart</Text>
                <Text style={styles.mainAlertSub}>Requires review before payment</Text>
              </View>
            </TouchableOpacity>

            {/* Recent Sales */}
            <View style={styles.mainSectionHeaderRow}>
              <Text style={styles.mainSectionHeading}>Recent Sales</Text>
              <TouchableOpacity
                onPress={handleOpenSalesHistory}
                activeOpacity={0.7}
              >
                <Text style={styles.mainSectionLink}>View History →</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.mainRecentSaleCard}
              onPress={() => handleOpenSaleDetail('SALE-00251')}
              activeOpacity={0.8}
            >
              <View style={styles.mainRecentTopRow}>
                <Text style={styles.mainRecentId}>SALE-00251</Text>
                <View style={styles.paidBadge}>
                  <Text style={styles.paidBadgeText}>Paid</Text>
                </View>
              </View>
              <Text style={styles.mainRecentItems}>Tomato · 2 KG</Text>
              <View style={styles.mainRecentDivider} />
              <View style={styles.mainRecentBottomRow}>
                <Text style={styles.mainRecentWarehouse}>Direct · Coonoor</Text>
                <Text style={styles.mainRecentAmount}>₹200</Text>
              </View>
            </TouchableOpacity>
          </>
        ) : (
          /* ═══════════════════════════════════════════════════════════════════════
             SUBWAREHOUSE VIEW (Existing Layout)
             ═══════════════════════════════════════════════════════════════════════ */
          <>
            <WarehouseChips scope={scope} selected={pickedWarehouse} onSelect={setPickedWarehouse} />

            {/* 1. Today's Sales by Channel */}
            <Text style={styles.sectionTitle}>Today's Sales by Channel</Text>

            <View style={styles.channelGrid}>
              {/* Card 1: Today's Sales */}
              <View style={styles.channelCard}>
                <View style={styles.cardIconWrap}>
                  <MoneyCardIcon />
                </View>
                <Text style={styles.cardAmount}>₹24,850</Text>
                <Text style={styles.cardSubtitle}>Today's Sales · 42 txns</Text>
              </View>

              {/* Card 2: Direct */}
              <View style={styles.channelCard}>
                <View style={styles.cardIconWrap}>
                  <StorefrontCardIcon />
                </View>
                <Text style={styles.cardAmount}>₹8,450</Text>
                <Text style={styles.cardSubtitle}>Direct · 18 sales</Text>
              </View>

              {/* Card 3: Market */}
              <View style={styles.channelCard}>
                <View style={styles.cardIconWrap}>
                  <StorefrontCardIcon />
                </View>
                <Text style={styles.cardAmount}>₹7,200</Text>
                <Text style={styles.cardSubtitle}>Market · 15 sales</Text>
              </View>

              {/* Card 4: HORECA */}
              <View style={styles.channelCard}>
                <View style={styles.cardIconWrap}>
                  <CutleryCardIcon />
                </View>
                <Text style={styles.cardAmount}>₹4,800</Text>
                <Text style={styles.cardSubtitle}>HORECA · 5 orders</Text>
              </View>

              {/* Card 5: B2B */}
              <View style={styles.channelCard}>
                <View style={styles.cardIconWrap}>
                  <BuildingCardIcon color={adminColors.brand} />
                </View>
                <Text style={styles.cardAmount}>₹4,400</Text>
                <Text style={styles.cardSubtitle}>B2B · 4 orders</Text>
              </View>

              {/* Card 6: Needs Attention */}
              <View style={styles.channelCard}>
                <View style={styles.cardIconWrap}>
                  <ExclamationCircleCardIcon color={adminColors.danger.text} />
                </View>
                <Text style={[styles.cardAmount, { color: adminColors.danger.text }]}>5</Text>
                <Text style={styles.cardSubtitle}>Needs Attention</Text>
              </View>
            </View>

            {/* 2. Quick Actions */}
            <Text style={styles.sectionTitle}>Quick Actions</Text>

            <View style={styles.quickActionsRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleOpenNewSale}
                activeOpacity={0.75}
              >
                <ShoppingCartActionIcon size={24} color={adminColors.brand} />
                <Text style={styles.actionBtnLabel}>New Direct Sale</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleOpenMarketDaySales}
                activeOpacity={0.75}
              >
                <StoreActionIcon size={24} color={adminColors.brand} />
                <Text style={styles.actionBtnLabel}>Market Day Sales</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleOpenSalesHistory}
                activeOpacity={0.75}
              >
                <HistoryClockActionIcon size={24} color={adminColors.brand} />
                <Text style={styles.actionBtnLabel}>Sales History</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.quickActionsRow, { marginTop: 10 }]}>
              <TouchableOpacity
                style={styles.actionBtnHalf}
                onPress={handleOpenHorecaSales}
                activeOpacity={0.75}
              >
                <CutleryActionIcon size={24} color={adminColors.brand} />
                <Text style={styles.actionBtnLabel}>HORECA Sale</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtnHalf}
                onPress={handleOpenB2BSales}
                activeOpacity={0.75}
              >
                <BuildingActionIcon size={24} color={adminColors.brand} />
                <Text style={styles.actionBtnLabel}>B2B Sale</Text>
              </TouchableOpacity>
            </View>

            {/* 3. Today's Sales Summary */}
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

            {/* 4. Recent Sales */}
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
                <View style={styles.recentSaleRight}>
                  <Text style={styles.recentSaleTime}>Today · 6:35 PM</Text>
                  <Text style={styles.recentSaleAmount}>₹500</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* 5. Needs Attention */}
            <View style={styles.needsAttentionHeader}>
              <WarningTriangleIcon size={18} color={adminColors.ink} />
              <Text style={styles.sectionTitle}>Needs Attention</Text>
            </View>

            <View style={styles.alertsContainer}>
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
          </>
        )}

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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleText: {
    fontSize: 22,
    fontWeight: '800',
    color: adminColors.onBrand,
    letterSpacing: 0.2,
  },
  warehouseDropdownRow: {
    marginTop: 6,
  },
  warehouseDropdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 8,
    ...adminShadow.sm,
  },
  warehouseDropdownText: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: 16,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
  },
  modalItemSelected: {
    backgroundColor: adminColors.brandSoft.bg,
  },
  modalItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: adminColors.ink,
  },
  modalItemTextSelected: {
    color: adminColors.brandDeep,
    fontWeight: '700',
  },
  modalCancelBtn: {
    marginTop: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: adminColors.canvas,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.muted,
  },
  warehouseBadgeRow: {
    marginTop: 2,
  },
  warehouseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  warehouseBadgeText: {
    color: adminColors.onBrand,
    fontSize: 13,
    fontWeight: '600',
  },
  headerBellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBellBtnWhite: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },

  /* Main Warehouse (M6-01) Styles */
  mainKpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  mainKpiCard: {
    width: '48%',
    backgroundColor: adminColors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    minHeight: 92,
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  mainKpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.muted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  mainKpiValue: {
    fontSize: 22,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: 3,
  },
  mainKpiSub: {
    fontSize: 12,
    fontWeight: '500',
    color: adminColors.muted,
  },
  mainSectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: 12,
    marginTop: 8,
  },
  mainSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 10,
  },
  mainSectionLink: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  whSummaryCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    ...adminShadow.sm,
  },
  whSummaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  whSummaryName: {
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.ink,
  },
  whSummaryBadge: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  whSummaryBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.success.text,
  },
  whSummarySub: {
    fontSize: 13,
    fontWeight: '500',
    color: adminColors.muted,
  },
  channelGrid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  channelCardBtn: {
    width: '48%',
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  channelIconBox: {
    marginBottom: 10,
  },
  channelCardBtnTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },
  mainAlertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderLeftWidth: 4,
    borderLeftColor: adminColors.brand,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
    ...adminShadow.sm,
  },
  mainAlertIconWrap: {
    marginRight: 12,
  },
  mainAlertTextWrap: {
    flex: 1,
  },
  mainAlertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 3,
  },
  mainAlertSub: {
    fontSize: 12,
    fontWeight: '500',
    color: adminColors.muted,
  },
  mainRecentSaleCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    marginBottom: 16,
    ...adminShadow.sm,
  },
  mainRecentTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  mainRecentId: {
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.ink,
  },
  mainRecentItems: {
    fontSize: 13,
    fontWeight: '500',
    color: adminColors.muted,
    marginBottom: 10,
  },
  mainRecentDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginBottom: 10,
  },
  mainRecentBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainRecentWarehouse: {
    fontSize: 13,
    fontWeight: '500',
    color: adminColors.muted,
  },
  mainRecentAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.ink,
  },

  /* Subwarehouse Styles */
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
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
    backgroundColor: adminColors.ink,
    marginVertical: 3,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: adminColors.ink,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
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
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  recentSaleCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    marginBottom: 10,
    ...adminShadow.sm,
  },
  recentSaleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  recentSaleId: {
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  paidBadge: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 9,
    paddingVertical: 2.5,
    borderRadius: 12,
  },
  paidBadgeText: {
    color: adminColors.success.text,
    fontSize: 12,
    fontWeight: '700',
  },
  recentSaleCustomer: {
    fontSize: 14,
    fontWeight: '500',
    color: adminColors.muted,
    marginBottom: 10,
  },
  recentSaleBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  recentSaleType: {
    fontSize: 13,
    fontWeight: '500',
    color: adminColors.muted,
  },
  recentSaleRight: {
    alignItems: 'flex-end',
  },
  recentSaleTime: {
    fontSize: 12,
    fontWeight: '400',
    color: adminColors.muted,
    marginBottom: 2,
  },
  recentSaleAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: adminColors.ink,
  },
  needsAttentionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
    marginBottom: 10,
  },
  alertsContainer: {
    gap: 10,
  },
  alertCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    paddingLeft: 20,
    position: 'relative',
    overflow: 'hidden',
    ...adminShadow.sm,
  },
  alertAccentBar: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 4,
    borderRadius: 2,
  },
  alertIconBox: {
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertTextBox: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 2,
  },
  alertSub: {
    fontSize: 13,
    fontWeight: '400',
    color: adminColors.muted,
  },
});
