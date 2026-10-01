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

import { SubWarehouseNewSaleScreen } from './SubWarehouseNewSaleScreen';
import { SubWarehouseSalesHistoryScreen } from './SubWarehouseSalesHistoryScreen';
import { SubWarehouseMarketDaySalesScreen } from './SubWarehouseMarketDaySalesScreen';
import { SubWarehouseHorecaSalesScreen } from './SubWarehouseHorecaSalesScreen';
import { SubWarehouseB2BSalesScreen } from './SubWarehouseB2BSalesScreen';
import { SubWarehouseNeedsAttentionScreen } from './SubWarehouseNeedsAttentionScreen';

// ─── Design Tokens (#F0562A Brand Palette) ──────────────────────────────────
const PALETTE = {
  primary:       '#F0562A',
  primaryDark:   '#D4451B',
  primaryLight:  '#FFF0EB',
  primarySoft:   '#FEF1EC',
  primaryBorder: '#FCD9CE',

  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textInk:       '#1E1612',
  textSecondary: '#6B7280',
  textMuted:     '#9CA3AF',
  border:        '#EBE5DC',
  divider:       '#F3EFEA',

  amberText:     '#B45309',
  redText:       '#DC2626',
  tabInactive:   '#786F66',
  tabBorder:     '#EAE4DB',
};

type SubWHTab = 'Home' | 'Receiving' | 'Inventory' | 'More';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
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

function CashRegisterHeaderIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
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
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke="#FFFFFF" strokeWidth="2.2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function BellHeaderIcon() {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MoneyCardIcon({ color = '#8B5E3C' }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Path d="M6 12h.01M18 12h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function StorefrontCardIcon({ color = '#8B5E3C' }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l1-5h16l1 5M4 9h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 21V13h6v8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CutleryCardIcon({ color = '#8B5E3C' }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M18 2v20M21 2v6a3 3 0 0 1-3 3M18 11v11M6 2v7a3 3 0 0 0 3 3v10M9 2v7M3 2v7a3 3 0 0 0 3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BuildingCardIcon({ color = '#8B5E3C' }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h4a2 2 0 0 1 2 2v10M4 21h18M9 7h2M9 11h2M9 15h2M18 13h1M18 17h1" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ExclamationCircleCardIcon({ color = '#DC2626' }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 8v4M12 16h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ShoppingCartActionIcon({ size = 22, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="21" r="1.5" stroke={color} strokeWidth="2" />
      <Circle cx="19" cy="21" r="1.5" stroke={color} strokeWidth="2" />
      <Path d="M2.5 3h3.2l2.4 12.2a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6l1.8-8.2H6.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function StoreActionIcon({ size = 22, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l1-5h16l1 5M4 9h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 21V13h6v8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function HistoryClockActionIcon({ size = 22, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 6v6l4 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WarningTriangleIcon({ size = 18, color = '#D97706' }: { size?: number; color?: string }) {
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

function StockBoxIcon({ size = 20, color = '#DC2626' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InvoiceDocumentIcon({ size = 20, color = '#B45309' }: { size?: number; color?: string }) {
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

function ChevronRightIcon({ size = 18, color = '#9E9690' }: { size?: number; color?: string }) {
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

function HomeTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceivingTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 10l5 5 5-5M12 15V3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InventoryTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MoreTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="5" cy="5" r="2" fill={color} />
      <Circle cx="12" cy="5" r="2" fill={color} />
      <Circle cx="19" cy="5" r="2" fill={color} />
      <Circle cx="5" cy="12" r="2" fill={color} />
      <Circle cx="12" cy="12" r="2" fill={color} />
      <Circle cx="19" cy="12" r="2" fill={color} />
      <Circle cx="5" cy="19" r="2" fill={color} />
      <Circle cx="12" cy="19" r="2" fill={color} />
      <Circle cx="19" cy="19" r="2" fill={color} />
    </Svg>
  );
}

export interface SubWarehouseSalesScreenProps {
  onBack?: (() => void) | undefined;
  onTabChange?: ((tab: SubWHTab) => void) | undefined;
  onNavigateToNotifications?: (() => void) | undefined;
  onNavigateToNewSale?: (() => void) | undefined;
  onNavigateToSalesHistory?: (() => void) | undefined;
  onNavigateToMarketDaySales?: (() => void) | undefined;
  onNavigateToHorecaSales?: (() => void) | undefined;
  onNavigateToB2BSales?: (() => void) | undefined;
  onNavigateToNeedsAttention?: ((category?: 'all' | 'payment_pending' | 'stock_issue' | 'failed_sale' | 'invoice_issue') => void) | undefined;
}

export function SubWarehouseSalesScreen({
  onBack,
  onTabChange,
  onNavigateToNotifications,
  onNavigateToNewSale,
  onNavigateToSalesHistory,
  onNavigateToMarketDaySales,
  onNavigateToHorecaSales,
  onNavigateToB2BSales,
  onNavigateToNeedsAttention,
}: SubWarehouseSalesScreenProps) {
  const [activeTab, setActiveTab] = useState<SubWHTab>('More');
  const [showNewSaleScreen, setShowNewSaleScreen] = useState(false);
  const [showSalesHistoryScreen, setShowSalesHistoryScreen] = useState(false);
  const [showMarketDaySalesScreen, setShowMarketDaySalesScreen] = useState(false);
  const [showHorecaSalesScreen, setShowHorecaSalesScreen] = useState(false);
  const [showB2BSalesScreen, setShowB2BSalesScreen] = useState(false);
  const [showNeedsAttentionScreen, setShowNeedsAttentionScreen] = useState(false);
  const [attentionCategory, setAttentionCategory] = useState<'all' | 'payment_pending' | 'stock_issue' | 'failed_sale' | 'invoice_issue'>('all');

  const handleTabPress = (tab: SubWHTab) => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    } else if (tab === 'Home' && onBack) {
      onBack();
    }
  };

  const handleOpenNewSale = () => {
    if (onNavigateToNewSale) {
      onNavigateToNewSale();
    } else {
      setShowNewSaleScreen(true);
    }
  };

  const handleOpenSalesHistory = () => {
    if (onNavigateToSalesHistory) {
      onNavigateToSalesHistory();
    } else {
      setShowSalesHistoryScreen(true);
    }
  };

  const handleOpenMarketDaySales = () => {
    if (onNavigateToMarketDaySales) {
      onNavigateToMarketDaySales();
    } else {
      setShowMarketDaySalesScreen(true);
    }
  };

  const handleOpenHorecaSales = () => {
    if (onNavigateToHorecaSales) {
      onNavigateToHorecaSales();
    } else {
      setShowHorecaSalesScreen(true);
    }
  };

  const handleOpenB2BSales = () => {
    if (onNavigateToB2BSales) {
      onNavigateToB2BSales();
    } else {
      setShowB2BSalesScreen(true);
    }
  };

  const handleOpenNeedsAttention = (cat: 'all' | 'payment_pending' | 'stock_issue' | 'failed_sale' | 'invoice_issue' = 'all') => {
    if (onNavigateToNeedsAttention) {
      onNavigateToNeedsAttention(cat);
    } else {
      setAttentionCategory(cat);
      setShowNeedsAttentionScreen(true);
    }
  };

  if (showNeedsAttentionScreen) {
    return (
      <SubWarehouseNeedsAttentionScreen
        initialCategory={attentionCategory}
        onBack={() => setShowNeedsAttentionScreen(false)}
      />
    );
  }

  if (showHorecaSalesScreen) {
    return (
      <SubWarehouseHorecaSalesScreen
        onBack={() => setShowHorecaSalesScreen(false)}
        onTabChange={handleTabPress}
      />
    );
  }

  if (showB2BSalesScreen) {
    return (
      <SubWarehouseB2BSalesScreen
        onBack={() => setShowB2BSalesScreen(false)}
        onTabChange={handleTabPress}
      />
    );
  }

  if (showMarketDaySalesScreen) {
    return (
      <SubWarehouseMarketDaySalesScreen
        onBack={() => setShowMarketDaySalesScreen(false)}
        onNavigateToNewMarketSale={handleOpenNewSale}
        onNavigateToSalesHistory={handleOpenSalesHistory}
        onTabChange={handleTabPress}
      />
    );
  }

  if (showSalesHistoryScreen) {
    return (
      <SubWarehouseSalesHistoryScreen
        onBack={() => setShowSalesHistoryScreen(false)}
        onTabChange={handleTabPress}
      />
    );
  }

  if (showNewSaleScreen) {
    return (
      <SubWarehouseNewSaleScreen
        onBack={() => setShowNewSaleScreen(false)}
        onSelectProducts={() => {
          Alert.alert('Products', 'Select produce batches from Coonoor inventory.');
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

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
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerTitleRow}>
              <CashRegisterHeaderIcon size={24} color="#FFFFFF" />
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
            <Text style={styles.warehouseBadgeText}>Coonoor Warehouse</Text>
          </View>
        </View>
      </View>

      {/* ─── Main Scrollable Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
            onPress={() => Alert.alert('Direct Sales', '₹8,450 from 18 direct walk-in customer sales.')}
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
            onPress={() => Alert.alert('Market Sales', '₹7,200 from 15 market stall transactions.')}
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
              <BuildingCardIcon />
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
              <ExclamationCircleCardIcon />
            </View>
            <Text style={[styles.cardAmount, { color: PALETTE.redText }]}>5</Text>
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
            <ShoppingCartActionIcon size={24} />
            <Text style={styles.actionBtnLabel}>New Direct Sale</Text>
          </TouchableOpacity>

          {/* Action 2: Market Day Sales */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleOpenMarketDaySales}
            activeOpacity={0.75}
          >
            <StoreActionIcon size={24} />
            <Text style={styles.actionBtnLabel}>Market Day Sales</Text>
          </TouchableOpacity>

          {/* Action 3: Sales History */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleOpenSalesHistory}
            activeOpacity={0.75}
          >
            <HistoryClockActionIcon size={24} />
            <Text style={styles.actionBtnLabel}>Sales History</Text>
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
          onPress={() => Alert.alert('SALE-00251', 'Customer: Rajesh Kumar\nItems: 2 Items\nType: Direct Sale\nTime: Today · 6:35 PM\nAmount: ₹500 (Paid)')}
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
          <WarningTriangleIcon size={18} color={PALETTE.textInk} />
          <Text style={styles.sectionTitle}>Needs Attention</Text>
        </View>

        <View style={styles.alertsContainer}>
          {/* Alert 1: Payment Pending */}
          <TouchableOpacity
            style={[styles.alertCardItem, { borderLeftColor: '#D97706' }]}
            onPress={() => handleOpenNeedsAttention('payment_pending')}
            activeOpacity={0.75}
          >
            <View style={styles.alertIconBox}>
              <MoneyCardIcon color="#D97706" />
            </View>
            <View style={styles.alertTextBox}>
              <Text style={styles.alertTitle}>Payment Pending</Text>
              <Text style={styles.alertSub}>2 sales awaiting payment</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>

          {/* Alert 2: Stock Issue */}
          <TouchableOpacity
            style={[styles.alertCardItem, { borderLeftColor: '#EF4444' }]}
            onPress={() => handleOpenNeedsAttention('stock_issue')}
            activeOpacity={0.75}
          >
            <View style={styles.alertIconBox}>
              <StockBoxIcon color="#EF4444" />
            </View>
            <View style={styles.alertTextBox}>
              <Text style={styles.alertTitle}>Stock Issue</Text>
              <Text style={styles.alertSub}>1 sale affected</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>

          {/* Alert 3: Failed Sale */}
          <TouchableOpacity
            style={[styles.alertCardItem, { borderLeftColor: '#DC2626' }]}
            onPress={() => handleOpenNeedsAttention('failed_sale')}
            activeOpacity={0.75}
          >
            <View style={styles.alertIconBox}>
              <ExclamationCircleCardIcon color="#DC2626" />
            </View>
            <View style={styles.alertTextBox}>
              <Text style={styles.alertTitle}>Failed Sale</Text>
              <Text style={styles.alertSub}>1 payment failure</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>

          {/* Alert 4: Invoice Issue */}
          <TouchableOpacity
            style={[styles.alertCardItem, { borderLeftColor: '#D97706' }]}
            onPress={() => handleOpenNeedsAttention('invoice_issue')}
            activeOpacity={0.75}
          >
            <View style={styles.alertIconBox}>
              <InvoiceDocumentIcon color="#D97706" />
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

      {/* ─── Bottom Navigation Bar ─── */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleTabPress('Home')}
          activeOpacity={0.75}
        >
          <HomeTabIcon active={activeTab === 'Home'} />
          <Text style={[styles.navLabel, activeTab === 'Home' && styles.navLabelActive]}>
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleTabPress('Receiving')}
          activeOpacity={0.75}
        >
          <ReceivingTabIcon active={activeTab === 'Receiving'} />
          <Text style={[styles.navLabel, activeTab === 'Receiving' && styles.navLabelActive]}>
            Receiving
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleTabPress('Inventory')}
          activeOpacity={0.75}
        >
          <InventoryTabIcon active={activeTab === 'Inventory'} />
          <Text style={[styles.navLabel, activeTab === 'Inventory' && styles.navLabelActive]}>
            Inventory
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleTabPress('More')}
          activeOpacity={0.75}
        >
          <MoreTabIcon active={activeTab === 'More'} />
          <Text style={[styles.navLabel, activeTab === 'More' && styles.navLabelActive, { color: PALETTE.primary }]}>
            More
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  headerBanner: {
    backgroundColor: PALETTE.primary,
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
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
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
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  warehouseBadgeRow: {
    marginTop: 2,
  },
  warehouseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  warehouseBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  headerBellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
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
    backgroundColor: '#FFFFFF',
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
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textInk,
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
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    minHeight: 96,
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardIconWrap: {
    marginBottom: 8,
  },
  cardAmount: {
    fontSize: 19,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 3,
  },
  cardSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: PALETTE.textSecondary,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 18,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 88,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  actionBtnLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.textInk,
    textAlign: 'center',
    marginTop: 8,
  },
  summaryCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: PALETTE.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.divider,
  },
  dividerThick: {
    height: 1.5,
    backgroundColor: PALETTE.divider,
    marginVertical: 2,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 10,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.primary,
  },
  recentSaleCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 10,
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  recentSaleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  recentSaleId: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  paidBadge: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  paidBadgeText: {
    color: '#137333',
    fontSize: 12,
    fontWeight: '700',
  },
  recentSaleCustomer: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    fontWeight: '500',
    marginBottom: 10,
  },
  recentSaleBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 80,
  },
  recentSaleType: {
    fontSize: 12,
    color: PALETTE.textMuted,
    fontWeight: '500',
  },
  recentSaleTime: {
    fontSize: 12,
    color: PALETTE.textMuted,
    fontWeight: '500',
  },
  recentSaleAmount: {
    position: 'absolute',
    right: 16,
    bottom: 14,
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.textInk,
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
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderLeftWidth: 4,
    paddingVertical: 14,
    paddingHorizontal: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
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
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 2,
  },
  alertSub: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    fontWeight: '500',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.tabBorder,
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
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.tabInactive,
    marginTop: 3,
  },
  navLabelActive: {
    color: PALETTE.primary,
    fontWeight: '700',
  },
});
