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
  SubWarehouseCashTopUpScreen,
  type CashTopUpData,
} from './SubWarehouseCashTopUpScreen';
import {
  SubWarehouseConfirmCashTopUpScreen,
  type ConfirmTopUpDetails,
} from './SubWarehouseConfirmCashTopUpScreen';
import { SubWarehouseCustomerSearchScreen } from './SubWarehouseCustomerSearchScreen';
import { SubWarehouseCustomerWalletScreen } from './SubWarehouseCustomerWalletScreen';
import { SubWarehouseFiscalTagScreen } from './SubWarehouseFiscalTagScreen';
import { SubWarehouseTopUpHistoryScreen } from './SubWarehouseTopUpHistoryScreen';
import { SubWarehouseDailyCashSummaryScreen } from './SubWarehouseDailyCashSummaryScreen';
import {
  SubWarehouseWalletAttentionScreen,
  type AttentionCategory,
} from './SubWarehouseWalletAttentionScreen';

// ─── Design Tokens (#F0562A Tohfa Brand Palette) ─────────────────────────
const PALETTE = {
  primary: '#F0562A',
  primaryDark: '#D4451B',
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
export interface SubWarehouseWalletOperationsScreenProps {
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

export function SubWarehouseWalletOperationsScreen({
  warehouseName = 'Coonoor Warehouse',
  onBack,
  onTabChange,
  onNavigateToNotifications,
  onNavigateToProfile,
  onNavigateToCashTopUp,
  onNavigateToCustomerSearch,
  onNavigateToTopUpHistory,
  onNavigateToDailySummary,
}: SubWarehouseWalletOperationsScreenProps) {
  const [activeSubScreen, setActiveSubScreen] = useState<
    'operations' | 'customer_wallet' | 'cash_top_up' | 'fiscal_tag' | 'confirm_top_up' | 'customer_search' | 'top_up_history' | 'daily_summary' | 'needs_attention'
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
      <SubWarehouseCustomerWalletScreen
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
      <SubWarehouseCashTopUpScreen
        warehouseName={warehouseName}
        processedBy="SWA Name"
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
      <SubWarehouseFiscalTagScreen
        initialData={{
          customerName: topUpData?.customerName || selectedCustomer.name,
          customerId: topUpData?.customerCode || selectedCustomer.code,
          currentBalance: topUpData?.currentBalance ?? 4500,
          topUpAmount: topUpData?.topUpAmount ?? 2000,
          fiscalCashTag: currentFiscalTag,
          warehouseName: warehouseName,
          processedBy: 'SWA – Suresh',
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
      <SubWarehouseConfirmCashTopUpScreen
        details={{
          customerName: topUpData?.customerName || selectedCustomer.name || 'Ravi Kumar',
          customerCode: topUpData?.customerCode || selectedCustomer.code || 'CUS-001245',
          currentBalance: topUpData?.currentBalance ?? 4500,
          topUpAmount: topUpData?.topUpAmount ?? 2000,
          warehouseName: warehouseName,
          processedBy: 'SWA – Suresh',
          fiscalCashTag: currentFiscalTag || 'FC-20260925-0012',
          dateStr: '25 Sep 2026',
          timeStr: '10:42 AM',
        }}
        onBack={() => setActiveSubScreen('fiscal_tag')}
        onSuccess={(confirmed) => {
          setTodayTopUpsCount((prev) => prev + 1);
          setCashCollectedTotal((prev) => prev + (confirmed.topUpAmount || 2000));
          setActiveSubScreen('operations');
        }}
      />
    );
  }

  // ─── Sub-Screen Redirection: Customer Search ───
  if (activeSubScreen === 'customer_search') {
    return (
      <SubWarehouseCustomerSearchScreen
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
      <SubWarehouseTopUpHistoryScreen
        onBack={() => setActiveSubScreen('operations')}
        {...(onTabChange ? { onTabChange } : {})}
      />
    );
  }

  // ─── Sub-Screen Redirection: Daily Cash Summary (Screenshots 3 & 4) ───
  if (activeSubScreen === 'daily_summary') {
    return (
      <SubWarehouseDailyCashSummaryScreen
        onBack={() => setActiveSubScreen('operations')}
        onViewTopUpHistory={() => setActiveSubScreen('top_up_history')}
        {...(onTabChange ? { onTabChange } : {})}
      />
    );
  }

  // ─── Sub-Screen Redirection: Needs Attention (Full Screen) ───
  if (activeSubScreen === 'needs_attention') {
    return (
      <SubWarehouseWalletAttentionScreen
        initialCategory={attentionCategory}
        onBack={() => setActiveSubScreen('operations')}
        onNavigateToCashTopUp={() => setActiveSubScreen('cash_top_up')}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        decelerationRate={0.985}
        bounces={true}
      >
        {/* ─── Top Brand Header Banner (#F0562A) ─── */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => {
                if (onBack) onBack();
                else if (onTabChange) onTabChange('Home');
              }}
              activeOpacity={0.8}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ArrowBackIcon size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerTitleRow}>
              <WalletHeaderIcon size={24} color="#FFFFFF" />
              <Text style={styles.headerTitleText}>Wallet Operations</Text>
            </View>

            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => {
                if (onNavigateToNotifications) onNavigateToNotifications();
                else Alert.alert('Notifications', '3 unread wallet and inventory notifications.');
              }}
              activeOpacity={0.8}
            >
              <BellIcon />
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>3</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Locked Active Warehouse Pill */}
          <View style={styles.assignedWarehousePill}>
            <LockBadgeIcon size={12} color="#FFFFFF" />
            <Text style={styles.assignedWarehouseText}>{warehouseName} · Active</Text>
          </View>
        </View>

        {/* ─── Main Content Body ─── */}
        <View style={styles.mainContainer}>
          {/* 1. KPI Overview Grid (2x2) */}
          <View style={styles.kpiGrid}>
            {/* Today's Top-Ups */}
            <TouchableOpacity
              style={styles.kpiCard}
              activeOpacity={0.8}
              onPress={() => {
                if (onNavigateToTopUpHistory) onNavigateToTopUpHistory();
                else setActiveSubScreen('top_up_history');
              }}
            >
              <View style={styles.kpiIconWrap}>
                <CalendarIcon size={19} color={PALETTE.primary} />
              </View>
              <Text style={styles.kpiValue}>{todayTopUpsCount}</Text>
              <Text style={styles.kpiLabel}>Today's Top-Ups</Text>
            </TouchableOpacity>

            {/* Cash Collected */}
            <TouchableOpacity
              style={styles.kpiCard}
              activeOpacity={0.8}
              onPress={() => {
                if (onNavigateToDailySummary) onNavigateToDailySummary();
                else setActiveSubScreen('daily_summary');
              }}
            >
              <View style={styles.kpiIconWrap}>
                <CashIcon size={19} color={PALETTE.primary} />
              </View>
              <Text style={styles.kpiValue}>₹{cashCollectedTotal.toLocaleString('en-IN')}</Text>
              <Text style={styles.kpiLabel}>Cash Collected</Text>
            </TouchableOpacity>

            {/* Pending */}
            <TouchableOpacity
              style={styles.kpiCard}
              activeOpacity={0.8}
              onPress={() => {
                setAttentionCategory('pending');
                setActiveSubScreen('needs_attention');
              }}
            >
              <View style={styles.kpiIconWrap}>
                <EllipsisPendingIcon size={19} color={PALETTE.amberAccent} />
              </View>
              <Text style={styles.kpiValue}>2</Text>
              <Text style={styles.kpiLabel}>Pending</Text>
            </TouchableOpacity>

            {/* Failed */}
            <TouchableOpacity
              style={styles.kpiCard}
              activeOpacity={0.8}
              onPress={() => {
                setAttentionCategory('failed');
                setActiveSubScreen('needs_attention');
              }}
            >
              <View style={styles.kpiIconWrap}>
                <ExclamationFailedIcon size={19} color={PALETTE.redAccent} />
              </View>
              <Text style={[styles.kpiValue, { color: PALETTE.redText }]}>1</Text>
              <Text style={styles.kpiLabel}>Failed</Text>
            </TouchableOpacity>
          </View>

          {/* 2. Quick Actions Section */}
          <Text style={styles.sectionHeading}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            {/* Cash Top-Up */}
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => {
                if (onNavigateToCashTopUp) {
                  onNavigateToCashTopUp();
                } else {
                  setActiveSubScreen('cash_top_up');
                }
              }}
              activeOpacity={0.75}
            >
              <View style={styles.quickActionIconWrap}>
                <PlusIcon size={22} color={PALETTE.primary} />
              </View>
              <Text style={styles.quickActionLabel}>Cash Top-Up</Text>
            </TouchableOpacity>

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
              <Text style={styles.quickActionLabel}>Find Customer</Text>
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
            <Text style={styles.dailySummaryLabel}>Daily Summary</Text>
          </TouchableOpacity>

          {/* 3. Recent Top-Ups Section */}
          <Text style={styles.sectionHeading}>Recent Top-Ups</Text>
          <TouchableOpacity
            style={styles.recentTopUpCard}
            onPress={() => {
              setSelectedCustomer({
                name: 'Ravi Kumar',
                code: 'CUS-001245',
                phone: '+91 98765 43210',
                currentBalance: '₹4,500',
              });
              setActiveSubScreen('customer_wallet');
            }}
            activeOpacity={0.8}
          >
            <View style={styles.recentTopUpTopRow}>
              <Text style={styles.recentCustomerName}>Ravi Kumar</Text>
              <View style={styles.completedBadge}>
                <Text style={styles.completedBadgeText}>Completed</Text>
              </View>
            </View>

            <Text style={styles.recentCustCode}>CUS-001245</Text>

            <View style={styles.recentTagAndAmountRow}>
              <Text style={styles.recentFiscalTag}>Fiscal Tag: FC-20260925-0012</Text>
              <Text style={styles.recentAmount}>₹2,000</Text>
            </View>

            <View style={styles.recentBottomRow}>
              <Text style={styles.recentTypeAndDate}>Cash Top-Up</Text>
              <Text style={styles.recentDateText}>Today, 10:42 AM</Text>
            </View>
          </TouchableOpacity>

          {/* 4. Needs Attention Section (⚠️ Needs Attention) */}
          <TouchableOpacity
            style={styles.needsAttentionHeadingRow}
            onPress={() => {
              setAttentionCategory('all');
              setActiveSubScreen('needs_attention');
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.needsAttentionHeading}>⚠️ Needs Attention</Text>
          </TouchableOpacity>

          <View style={styles.needsAttentionList}>
            {/* 1. Pending top-up */}
            <TouchableOpacity
              style={[styles.attentionRowCard, { borderLeftColor: PALETTE.amberAccent }]}
              onPress={() => {
                setAttentionCategory('pending');
                setActiveSubScreen('needs_attention');
              }}
              activeOpacity={0.75}
            >
              <View style={styles.attentionLeftWrap}>
                <EllipsisPendingIcon size={20} color={PALETTE.amberAccent} />
                <View style={styles.attentionTextWrap}>
                  <Text style={styles.attentionTitle}>Pending top-up</Text>
                  <Text style={styles.attentionSub}>1 transaction awaiting verification</Text>
                </View>
              </View>
              <ChevronRight size={18} color={PALETTE.textMuted} />
            </TouchableOpacity>

            {/* 2. Failed transaction */}
            <TouchableOpacity
              style={[styles.attentionRowCard, { borderLeftColor: PALETTE.redAccent }]}
              onPress={() => {
                setAttentionCategory('failed');
                setActiveSubScreen('needs_attention');
              }}
              activeOpacity={0.75}
            >
              <View style={styles.attentionLeftWrap}>
                <ExclamationFailedIcon size={20} color={PALETTE.redAccent} />
                <View style={styles.attentionTextWrap}>
                  <Text style={styles.attentionTitle}>Failed transaction</Text>
                  <Text style={styles.attentionSub}>1 top-up did not complete</Text>
                </View>
              </View>
              <ChevronRight size={18} color={PALETTE.textMuted} />
            </TouchableOpacity>

            {/* 3. Missing fiscal tag */}
            <TouchableOpacity
              style={[styles.attentionRowCard, { borderLeftColor: PALETTE.amberAccent }]}
              onPress={() => {
                setAttentionCategory('fiscal');
                setActiveSubScreen('needs_attention');
              }}
              activeOpacity={0.75}
            >
              <View style={styles.attentionLeftWrap}>
                <TagIcon size={18} color={PALETTE.amberAccent} />
                <View style={styles.attentionTextWrap}>
                  <Text style={styles.attentionTitle}>Missing fiscal tag</Text>
                  <Text style={styles.attentionSub}>1 transaction needs review</Text>
                </View>
              </View>
              <ChevronRight size={18} color={PALETTE.textMuted} />
            </TouchableOpacity>

            {/* 4. Reconciliation discrepancy */}
            <TouchableOpacity
              style={[styles.attentionRowCard, { borderLeftColor: PALETTE.amberAccent }]}
              onPress={() => {
                setAttentionCategory('reconciliation');
                setActiveSubScreen('needs_attention');
              }}
              activeOpacity={0.75}
            >
              <View style={styles.attentionLeftWrap}>
                <ScalesIcon size={18} color={PALETTE.amberAccent} />
                <View style={styles.attentionTextWrap}>
                  <Text style={styles.attentionTitle}>Reconciliation discrepancy</Text>
                  <Text style={styles.attentionSub}>Yesterday's cash count</Text>
                </View>
              </View>
              <ChevronRight size={18} color={PALETTE.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ─── Bottom Navigation Bar ─── */}
      <View style={styles.bottomTabBar}>
        <Pressable
          style={styles.tabItem}
          onPress={() => {
            if (onTabChange) onTabChange('Home');
            else if (onBack) onBack();
          }}
          accessibilityRole="tab"
        >
          <HomeTabIcon active={false} />
          <Text style={styles.tabLabel}>Home</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => {
            if (onTabChange) onTabChange('Receiving');
          }}
          accessibilityRole="tab"
        >
          <ReceivingTabIcon active={false} />
          <Text style={styles.tabLabel}>Receiving</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => {
            if (onTabChange) onTabChange('Inventory');
          }}
          accessibilityRole="tab"
        >
          <InventoryTabIcon active={false} />
          <Text style={styles.tabLabel}>Inventory</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => {
            if (onTabChange) onTabChange('More');
          }}
          accessibilityRole="tab"
        >
          <MoreTabIcon active={true} />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>More</Text>
        </Pressable>
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
    flex: 1,
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
  assignedWarehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    paddingHorizontal: 11,
    paddingVertical: 4.5,
  },
  assignedWarehouseText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ─── KPI 2x2 Grid ──────────────────────────────────────────────────────────
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  kpiIconWrap: {
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '800',
    color: PALETTE.textInk,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.textSecondary,
  },

  // ─── Section Headings ──────────────────────────────────────────────────────
  sectionHeading: {
    fontSize: 15.5,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 10,
    letterSpacing: -0.2,
  },

  // ─── Quick Actions ─────────────────────────────────────────────────────────
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 6,
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
    marginBottom: 6,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.textInk,
    textAlign: 'center',
  },
  dailySummaryCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  dailySummaryIconWrap: {},
  dailySummaryLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
  },

  // ─── Recent Top-Ups ────────────────────────────────────────────────────────
  recentTopUpCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  recentTopUpTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  recentCustomerName: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  completedBadge: {
    backgroundColor: PALETTE.greenBadge,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.greenText,
  },
  recentCustCode: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    marginBottom: 4,
  },
  recentTagAndAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  recentFiscalTag: {
    fontSize: 11.5,
    color: PALETTE.textSecondary,
  },
  recentAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  recentBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentTypeAndDate: {
    fontSize: 11.5,
    color: PALETTE.textSecondary,
  },
  recentDateText: {
    fontSize: 11,
    color: PALETTE.textSecondary,
  },

  // ─── Needs Attention ───────────────────────────────────────────────────────
  needsAttentionHeadingRow: {
    marginBottom: 10,
  },
  needsAttentionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
    letterSpacing: -0.2,
  },
  needsAttentionList: {
    gap: 10,
    marginBottom: 20,
  },
  attentionRowCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    padding: 12,
    paddingLeft: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderLeftWidth: 4.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  attentionLeftWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  attentionTextWrap: {
    flex: 1,
  },
  attentionTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 2,
  },
  attentionSub: {
    fontSize: 11.5,
    color: PALETTE.textSecondary,
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
