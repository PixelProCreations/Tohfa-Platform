import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import {
  MainWarehouseCashTopUpScreen,
  type CashTopUpData,
} from './MainWarehouseCashTopUpScreen';
import {
  MainWarehouseConfirmCashTopUpScreen,
  type ConfirmTopUpDetails,
} from './MainWarehouseConfirmCashTopUpScreen';
import { MainWarehouseFinalConfirmScreen } from './MainWarehouseFinalConfirmScreen';
import { MainWarehouseTopUpSuccessfulScreen } from './MainWarehouseTopUpSuccessfulScreen';
import { MainWarehouseCustomerSearchScreen } from './MainWarehouseCustomerSearchScreen';
import { MainWarehouseCustomerWalletScreen } from './MainWarehouseCustomerWalletScreen';
import { MainWarehouseFiscalTagScreen } from './MainWarehouseFiscalTagScreen';
import { MainWarehouseTopUpHistoryScreen } from './MainWarehouseTopUpHistoryScreen';
import { MainWarehouseDailyCashSummaryScreen } from './MainWarehouseDailyCashSummaryScreen';
import {
  MainWarehouseWalletAttentionScreen,
  type AttentionCategory,
} from './MainWarehouseWalletAttentionScreen';

// ─── Design Tokens (#F0562A Tohfa Brand Palette) ─────────────────────────
const PALETTE = {
  primary: '#F0562A',
  primaryDark: '#F0562A',
  primaryLight: '#FFF2E8',
  primarySoft: '#FEF1EC',
  primaryBorder: '#F5C6A0',

  pageBg: '#FAF7F2',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#7A726C',
  textMuted: '#9E9690',
  border: '#EBE5DC',
  divider: '#F4EFE9',

  // Status & Badges
  greenBadge: '#DCFCE7',
  greenText: '#15803D',
  greenDot: '#10B981',

  amberBadge: '#FFF0EB',
  amberText: '#F0562A',
  amberAccent: '#F0562A',

  redBadge: '#FEE2E2',
  redText: '#DC2626',
  redAccent: '#EF4444',

  tabInactive: '#827A74',
  tabBorder: '#EAE4DB',
};

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

function WalletHeaderIcon({ size = 24, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="3" stroke={color} strokeWidth="2.2" />
      <Path d="M2 10h20" stroke={color} strokeWidth="2" />
      <Circle cx="16" cy="14" r="1.5" fill={color} />
    </Svg>
  );
}

function BellIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
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

function LockBadgeIcon({ size = 12, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CalendarIcon({ size = 20, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CashIcon({ size = 20, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Path d="M6 12h.01M18 12h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function EllipsisPendingIcon({ size = 20, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Circle cx="8" cy="12" r="1" fill={color} />
      <Circle cx="12" cy="12" r="1" fill={color} />
      <Circle cx="16" cy="12" r="1" fill={color} />
    </Svg>
  );
}

function ExclamationFailedIcon({ size = 20, color = '#EF4444' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 8v4M12 16h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function PlusIcon({ size = 20, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UserSearchIcon({ size = 20, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Circle cx="19" cy="11" r="3" stroke={color} strokeWidth="2" />
      <Path d="M21 13l2 2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function HistoryClockIcon({ size = 20, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 3v5h5M12 7v5l4 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ScalesIcon({ size = 20, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3v18M6 7l6-3 6 3M6 7l-3 7h6l-3-7zM18 7l-3 7h6l-3-7zM4 21h16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TagIcon({ size = 18, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRight({ size = 16, color = '#9E9690' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
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

// ─── Interfaces ──────────────────────────────────────────────────────────────
export interface MainWarehouseWalletOperationsScreenProps {
  warehouseName?: string;
  onBack?: () => void;
  onTabChange?: (tab: 'Home' | 'Receiving' | 'Inventory' | 'More') => void;
  onNavigateToNotifications?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToCashTopUp?: () => void;
  onNavigateToCustomerSearch?: () => void;
  onNavigateToTopUpHistory?: () => void;
  onNavigateToDailySummary?: () => void;
}

export function MainWarehouseWalletOperationsScreen({
  warehouseName = 'Coonoor Warehouse',
  onBack,
  onTabChange,
  onNavigateToNotifications,
  onNavigateToProfile,
  onNavigateToCashTopUp,
  onNavigateToCustomerSearch,
  onNavigateToTopUpHistory,
  onNavigateToDailySummary,
}: MainWarehouseWalletOperationsScreenProps) {
  const [activeSubScreen, setActiveSubScreen] = useState<
    'operations' | 'customer_wallet' | 'cash_top_up' | 'fiscal_tag' | 'confirm_top_up' | 'final_confirm_top_up' | 'top_up_successful' | 'customer_search' | 'top_up_history' | 'daily_summary' | 'needs_attention'
  >('operations');
  const [attentionCategory, setAttentionCategory] = useState<AttentionCategory>('all');
  const [currentFiscalTag, setCurrentFiscalTag] = useState<string>('FC-20260925-0012');
  const [topUpData, setTopUpData] = useState<CashTopUpData | null>(null);
  const [todayTopUpsCount, setTodayTopUpsCount] = useState<number>(24);
  const [cashCollectedTotal, setCashCollectedTotal] = useState<number>(18500);

  // Cash Top-Up form state
  const [custSearch, setCustSearch] = useState('');
  const [topUpAmount, setTopUpAmount] = useState('2000');
  const [selectedCustomer, setSelectedCustomer] = useState({
    name: 'Ravi Kumar',
    code: 'CUS-001245',
    phone: '+91 98765 43210',
    currentBalance: '₹4,500',
  });

  // ─── Sub-Screen Redirection: Customer Wallet (Screenshots 1 & 2) ───
  if (activeSubScreen === 'customer_wallet') {
    return (
      <MainWarehouseCustomerWalletScreen
        customer={{
          name: selectedCustomer.name,
          id: selectedCustomer.code,
          mobile: selectedCustomer.phone,
          balance: selectedCustomer.currentBalance.includes('.00')
            ? selectedCustomer.currentBalance
            : `${selectedCustomer.currentBalance}.00`,
          totalCredited: '₹25,000',
          totalUsed: '₹20,500',
        }}
        onBack={() => setActiveSubScreen('customer_search')}
        onNavigateToCashTopUp={() => {
          setActiveSubScreen('cash_top_up');
        }}
      />
    );
  }

  // ─── Sub-Screen Redirection: Cash Top-Up ───
  if (activeSubScreen === 'cash_top_up') {
    return (
      <MainWarehouseCashTopUpScreen
        initialCustomer={{
          name: selectedCustomer.name || 'Ravi Kumar',
          code: selectedCustomer.code || 'CUS-001245',
          currentBalance: 4500,
        }}
        onBack={() => setActiveSubScreen(selectedCustomer ? 'customer_wallet' : 'operations')}
        onContinue={(data) => {
          setTopUpData(data);
          setActiveSubScreen('fiscal_tag');
        }}
      />
    );
  }

  // ─── Sub-Screen Redirection: Fiscal Cash Tag (Screenshot 4 - in between Cash Top-Up and Confirm) ───
  if (activeSubScreen === 'fiscal_tag') {
    return (
      <MainWarehouseFiscalTagScreen
        initialData={{
          customerName: topUpData?.customerName || selectedCustomer.name,
          customerId: topUpData?.customerCode || selectedCustomer.code,
          currentBalance: topUpData?.currentBalance ?? 4500,
          topUpAmount: topUpData?.topUpAmount ?? 2000,
          fiscalCashTag: currentFiscalTag,
        }}
        onBack={() => setActiveSubScreen('cash_top_up')}
        onReviewTopUp={(tagData) => {
          if (tagData.fiscalCashTag) {
            setCurrentFiscalTag(tagData.fiscalCashTag);
          }
          setActiveSubScreen('confirm_top_up');
        }}
      />
    );
  }

  // ─── Sub-Screen Redirection: Confirm Cash Top-Up (Screenshot 3) ───
  if (activeSubScreen === 'confirm_top_up') {
    return (
      <MainWarehouseConfirmCashTopUpScreen
        details={{
          customerName: topUpData?.customerName || selectedCustomer.name || 'Ravi Kumar',
          customerCode: topUpData?.customerCode || selectedCustomer.code || 'CUS-001245',
          currentBalance: topUpData?.currentBalance ?? 4500,
          topUpAmount: topUpData?.topUpAmount ?? 2000,
          fiscalCashTag: currentFiscalTag || 'FC-20260925-0012',
          warehouseName: warehouseName,
        }}
        onBack={() => setActiveSubScreen('fiscal_tag')}
        onSuccess={() => {
          setActiveSubScreen('final_confirm_top_up');
        }}
      />
    );
  }

  // ─── Sub-Screen Redirection: Final Confirm Cash Top-Up (Screenshot 4) ───
  if (activeSubScreen === 'final_confirm_top_up') {
    return (
      <MainWarehouseFinalConfirmScreen
        details={{
          customerName: topUpData?.customerName || selectedCustomer.name || 'Ravi Kumar',
          topUpAmount: topUpData?.topUpAmount ?? 2000,
        }}
        onBack={() => setActiveSubScreen('confirm_top_up')}
        onConfirm={() => {
          setTodayTopUpsCount((prev) => prev + 1);
          setCashCollectedTotal((prev) => prev + (topUpData?.topUpAmount || 2000));
          setActiveSubScreen('top_up_successful');
        }}
      />
    );
  }

  // ─── Sub-Screen Redirection: Top-Up Successful (Screenshot 1) ───
  if (activeSubScreen === 'top_up_successful') {
    return (
      <MainWarehouseTopUpSuccessfulScreen
        details={{
          topUpAmount: topUpData?.topUpAmount ?? 2000,
          newBalance: (topUpData?.currentBalance ?? 4500) + (topUpData?.topUpAmount ?? 2000),
        }}
        onBack={() => setActiveSubScreen('operations')}
        onViewTransaction={() => setActiveSubScreen('top_up_history')}
        onDone={() => setActiveSubScreen('operations')}
      />
    );
  }

  // ─── Sub-Screen Redirection: Customer Search ───
  if (activeSubScreen === 'customer_search') {
    return (
      <MainWarehouseCustomerSearchScreen
        onBack={() => setActiveSubScreen('operations')}
        onNavigateToWallet={(cust) => {
          setSelectedCustomer({
            name: cust.name,
            code: cust.code,
            phone: cust.phone || '+91 98765 43210',
            currentBalance: cust.balance,
          });
          setActiveSubScreen('customer_wallet');
        }}
        onSelectCustomer={(cust: any) => {
          setSelectedCustomer({
            name: cust.name,
            code: cust.code,
            phone: cust.phone || '+91 98765 43210',
            currentBalance: cust.balance,
          });
          setActiveSubScreen('customer_wallet');
        }}
        onNavigateToCashTopUp={() => {
          setActiveSubScreen('cash_top_up');
        }}
      />
    );
  }

  // ─── Sub-Screen Redirection: Top-Up History (Screenshot 2) ───
  if (activeSubScreen === 'top_up_history') {
    return (
      <MainWarehouseTopUpHistoryScreen
        onBack={() => setActiveSubScreen('operations')}
      />
    );
  }

  // ─── Sub-Screen Redirection: Daily Cash Summary (Screenshots 3 & 4) ───
  if (activeSubScreen === 'daily_summary') {
    return (
      <MainWarehouseDailyCashSummaryScreen
        onBack={() => setActiveSubScreen('operations')}
      />
    );
  }

  // ─── Sub-Screen Redirection: Needs Attention (Full Screen) ───
  if (activeSubScreen === 'needs_attention') {
    return (
      <MainWarehouseWalletAttentionScreen
        initialCategory={attentionCategory}
        onBack={() => setActiveSubScreen('operations')}
        onNavigateToCashTopUp={() => setActiveSubScreen('cash_top_up')}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#F0562A" />

      {/* ─── Top Brand Header Banner (#F0562A) ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleRow}>
            {onBack && (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={onBack}
                activeOpacity={0.75}
              >
                <ArrowBackIcon size={22} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <WalletHeaderIcon size={24} color="#FFFFFF" />
            <Text style={styles.headerTitleText}>Wallet Operations</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        decelerationRate={0.985}
        bounces={true}
      >
        <View style={styles.mainContainer}>
          {/* 1. KPI Overview Grid (2x2) */}
          <View style={styles.kpiGrid}>
            {/* Today's Top-Ups */}
            <TouchableOpacity style={styles.kpiCard} activeOpacity={0.8} onPress={() => {}}>
              <Text style={styles.kpiLabel}>TODAY'S TOP-UPS</Text>
              <Text style={styles.kpiValue}>₹18,500</Text>
            </TouchableOpacity>

            {/* Transactions */}
            <TouchableOpacity style={styles.kpiCard} activeOpacity={0.8} onPress={() => {}}>
              <Text style={styles.kpiLabel}>TRANSACTIONS</Text>
              <Text style={styles.kpiValue}>12</Text>
            </TouchableOpacity>

            {/* Customers Served */}
            <TouchableOpacity style={styles.kpiCard} activeOpacity={0.8} onPress={() => {}}>
              <Text style={styles.kpiLabel}>CUSTOMERS SERVED</Text>
              <Text style={styles.kpiValue}>10</Text>
            </TouchableOpacity>

            {/* Attention */}
            <TouchableOpacity style={styles.kpiCard} activeOpacity={0.8} onPress={() => {}}>
              <Text style={styles.kpiLabel}>ATTENTION</Text>
              <Text style={styles.kpiValue}>2</Text>
            </TouchableOpacity>
          </View>

          {/* 2. Quick Actions Section */}
          <Text style={styles.sectionHeading}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            {/* Find Customer */}
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => {
                if (onNavigateToCustomerSearch) onNavigateToCustomerSearch();
                else setActiveSubScreen('customer_search');
              }}
              activeOpacity={0.75}
            >
              <View style={styles.quickActionIconWrap}>
                <UserSearchIcon size={22} color={PALETTE.primary} />
              </View>
              <Text style={styles.quickActionLabel}>Customer Search</Text>
            </TouchableOpacity>

            {/* Top-Up History */}
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => {
                if (onNavigateToTopUpHistory) onNavigateToTopUpHistory();
                else setActiveSubScreen('top_up_history');
              }}
              activeOpacity={0.75}
            >
              <View style={styles.quickActionIconWrap}>
                <HistoryClockIcon size={22} color={PALETTE.primary} />
              </View>
              <Text style={styles.quickActionLabel}>Top-Up History</Text>
            </TouchableOpacity>
          </View>

          {/* Full Width Action: Daily Summary */}
          <TouchableOpacity
            style={styles.dailySummaryCard}
            onPress={() => {
              if (onNavigateToDailySummary) onNavigateToDailySummary();
              else setActiveSubScreen('daily_summary');
            }}
            activeOpacity={0.75}
          >
            <View style={styles.dailySummaryIconWrap}>
              <ScalesIcon size={22} color={PALETTE.primary} />
            </View>
            <Text style={styles.dailySummaryLabel}>Daily Cash Summary</Text>
          </TouchableOpacity>

          {/* Notice Banner */}
          <View style={styles.noticeBanner}>
            <Text style={styles.noticeBannerText}>
              Cash Top-Up always opens Customer Search first — a top-up can never begin without identifying the customer.
            </Text>
          </View>

          {/* Needs Attention Section */}
          <View style={styles.needsAttentionHeadingRow}>
            <Text style={styles.needsAttentionHeading}>Needs Attention</Text>
            <TouchableOpacity
              onPress={() => {
                setAttentionCategory('all');
                setActiveSubScreen('needs_attention');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.needsAttentionList}>
            {/* Failed transaction */}
            <TouchableOpacity
              style={[styles.attentionRowCard, { borderLeftColor: PALETTE.amberAccent }]}
              onPress={() => {
                setAttentionCategory('failed');
                setActiveSubScreen('needs_attention');
              }}
              activeOpacity={0.75}
            >
              <View style={styles.attentionLeftWrap}>
                <ExclamationFailedIcon size={20} color={PALETTE.amberAccent} />
                <View style={styles.attentionTextWrap}>
                  <Text style={styles.attentionTitle}>1 failed top-up</Text>
                  <Text style={styles.attentionSub}>Requires review</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ─── Bottom Navigation Tab Bar ─── */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onTabChange?.('Home')}
          accessibilityRole="tab"
        >
          <HomeTabIcon active={false} />
          <Text style={styles.tabLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onTabChange?.('Receiving')}
          accessibilityRole="tab"
        >
          <ReceivingTabIcon active={false} />
          <Text style={styles.tabLabel}>Receiving</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onTabChange?.('Inventory')}
          accessibilityRole="tab"
        >
          <InventoryTabIcon active={false} />
          <Text style={styles.tabLabel}>Inventory</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onTabChange?.('More')}
          accessibilityRole="tab"
        >
          <MoreTabIcon active={true} />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>More</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

// ─── Stylesheet ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.primary,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  mainContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },

  // ─── Top Brand Header Banner (#F0562A) ──────────────────────────────────────
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 18,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  backBtn: {
    padding: 6,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: '#DC2626',
    borderRadius: 8,
    minWidth: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: PALETTE.primary,
  },
  notifBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },


  // ─── KPI 2x2 Grid ──────────────────────────────────────────────────────────
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    marginBottom: 20,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: PALETTE.textInk,
  },

  // ─── Section Headings ──────────────────────────────────────────────────────
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#8B5E3C', // A brown/orange shade for the title
    marginBottom: 12,
  },

  // ─── Quick Actions ─────────────────────────────────────────────────────────
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  quickActionIconWrap: {
    marginBottom: 10,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
    textAlign: 'center',
  },
  dailySummaryCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  dailySummaryIconWrap: {
    marginBottom: 10,
  },
  dailySummaryLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
  },

  // ─── Notice Banner ────────────────────────────────────────────────────────
  noticeBanner: {
    backgroundColor: '#FFEDD5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  noticeBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9A3412',
    lineHeight: 18,
  },

  // ─── Needs Attention ───────────────────────────────────────────────────────
  needsAttentionHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  needsAttentionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#8B5E3C',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.primary,
  },
  needsAttentionList: {
    marginBottom: 20,
  },
  attentionRowCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  attentionLeftWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  attentionTextWrap: {
    flex: 1,
  },
  attentionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  attentionSub: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    marginTop: 4,
  },

  // ─── Bottom Navigation Bar ──────────────────────────────────────────────────
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: PALETTE.tabBorder,
    paddingVertical: 8,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: PALETTE.tabInactive,
    marginTop: 3,
  },
  tabLabelActive: {
    color: PALETTE.primary,
    fontWeight: '800',
  },

  // ─── Modal Styles ──────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  modalCloseText: {
    fontSize: 18,
    color: PALETTE.textSecondary,
    padding: 4,
  },
  modalSub: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    marginBottom: 14,
  },
  customerBox: {
    backgroundColor: PALETTE.primaryLight,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  customerBoxName: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  customerBoxSub: {
    fontSize: 11,
    color: PALETTE.textSecondary,
    marginTop: 2,
  },
  balanceBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  balanceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.primary,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 8,
  },
  quickAmountRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  amtChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    backgroundColor: '#FAF7F2',
  },
  amtChipActive: {
    borderColor: PALETTE.primary,
    backgroundColor: PALETTE.primarySoft,
  },
  amtChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textSecondary,
  },
  amtChipTextActive: {
    color: PALETTE.primary,
    fontWeight: '800',
  },
  amountInput: {
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 16,
  },
  confirmBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 8,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: PALETTE.textInk,
  },
  searchedCustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.divider,
  },
  custRowName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  custRowCode: {
    fontSize: 11,
    color: PALETTE.textSecondary,
  },
  custRowBal: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.primary,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.divider,
  },
  historyName: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  historyTag: {
    fontSize: 11,
    color: PALETTE.textMuted,
  },
  historyAmt: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  historyStatus: {
    fontSize: 10.5,
    fontWeight: '700',
    color: PALETTE.greenText,
  },
  summaryBreakdown: {
    backgroundColor: '#FAF7F2',
    borderRadius: 12,
    padding: 14,
    gap: 8,
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12.5,
    color: PALETTE.textSecondary,
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  attentionModalBody: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    lineHeight: 19,
    marginVertical: 14,
  },
});
