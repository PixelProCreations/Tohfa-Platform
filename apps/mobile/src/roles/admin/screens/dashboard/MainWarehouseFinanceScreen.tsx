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

import { MainWarehouseRevenueScreen } from './MainWarehouseRevenueScreen';
import { MainWarehouseVouchersScreen } from './MainWarehouseVouchersScreen';
import { MainWarehouseExpenseCategoriesScreen } from './MainWarehouseExpenseCategoriesScreen';
import { MainWarehouseRevenueDetailScreen } from './MainWarehouseRevenueDetailScreen';
import { MainWarehouseVoucherDetailScreen } from './MainWarehouseVoucherDetailScreen';
import {
  ExpenseDetailScreen,
  FinanceHistoryScreen,
  FinanceReportsScreen,
  WarehouseAddExpenseScreen,
  WarehouseExpensesScreen,
  type PermissionCheck,
  type WarehouseScope,
} from '../warehouse/finance-expenses';
import { DailyCashScreen } from '../warehouse/wallet-cashtopup';

// ─── Design Tokens (#F0562A Brand Palette) ──────────────────────────────────
const PALETTE = {
  primary:       '#F0562A',
  primaryDark:   '#D4451B',
  primaryLight:  '#FFF0EB',
  peachBg:       '#FDF0EB',
  iconColor:     '#8B5E3C',

  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textDark:      '#1E1612',
  textSecondary: '#7A726C',
  textMuted:     '#9CA3AF',
  border:        '#EBE5DC',
  divider:       '#F4EFE9',

  green:         '#059669',
  greenBg:       '#ECFDF5',
  red:           '#DC2626',
  redBg:         '#FEE2E2',
  blue:          '#2563EB',
  blueBg:        '#EFF6FF',
  blueBorder:    '#BFDBFE',
  blueText:      '#1E40AF',
  amber:         '#D97706',
  amberBg:       '#FFFBEB',
  amberBorder:   '#FDE68A',
  amberText:     '#92400E',

  tabInactive:   '#786F66',
  tabBorder:     '#EAE4DB',
};

type SubWHTab = 'Home' | 'Receiving' | 'Inventory' | 'More';

export interface MainWarehouseFinanceScreenProps {
  /** Warehouse scope of the viewer; Main = all warehouses (warehouseId undefined). */
  scope: WarehouseScope;
  /** docs/rbac.json permission check for the signed-in admin (see roles/admin/permissions/can.ts). */
  can: PermissionCheck;
  onBack?: (() => void) | undefined;
  onTabChange?: ((tab: SubWHTab) => void) | undefined;
  onNavigateToNotifications?: (() => void) | undefined;
  onNavigateToReports?: (() => void) | undefined;
  onNavigateToRevenue?: (() => void) | undefined;
  onNavigateToExpenses?: (() => void) | undefined;
  onNavigateToAddExpense?: (() => void) | undefined;
  onNavigateToVouchers?: (() => void) | undefined;
  onNavigateToDailyCash?: (() => void) | undefined;
  onNavigateToHistory?: (() => void) | undefined;
  onNavigateToCategories?: (() => void) | undefined;
}

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

function GridMenuIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="2" stroke={color} strokeWidth="2.2" />
      <Rect x="14" y="3" width="7" height="7" rx="2" stroke={color} strokeWidth="2.2" />
      <Rect x="3" y="14" width="7" height="7" rx="2" stroke={color} strokeWidth="2.2" />
      <Rect x="14" y="14" width="7" height="7" rx="2" stroke={color} strokeWidth="2.2" />
    </Svg>
  );
}

function BellIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
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

function LockIcon({ size = 12, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 12, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DocumentLedgerIcon({ size = 16, color = '#2563EB' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M7 8h10M7 12h10M7 16h6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ShieldLockIcon({ size = 16, color = '#D97706' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TrendingUpIcon({ size = 18, color = '#059669' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 6l-9.5 9.5-5-5L1 18"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17 6h6v6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TruckExpenseIcon({ size = 18, color = '#D97706' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="1" y="4" width="14" height="12" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M15 8h4l3 3v5h-7V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="5.5" cy="19" r="2" stroke={color} strokeWidth="2" />
      <Circle cx="18.5" cy="19" r="2" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

// ── Quick Action Icons ──
function PlusCircleIcon({ size = 20, color = '#8B5E3C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 8v8M8 12h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ViewRevenueIcon({ size = 20, color = '#8B5E3C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 7l-7 7-4-4-7 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M15 7h6v6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ViewExpensesIcon({ size = 20, color = '#8B5E3C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M8 7h8M8 11h8M8 15h5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function VoucherIcon({ size = 20, color = '#8B5E3C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="5" width="18" height="14" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M7 9h10M7 13h10M7 17h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function DailyCashIcon({ size = 20, color = '#8B5E3C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Path d="M6 12h.01M18 12h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ReportsFileIcon({ size = 20, color = '#8B5E3C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Tab Bar Icons ──
function HomeTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 21v-7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ReceivingTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Path
        d="M12 8v8M8 12l4 4 4-4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InventoryTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M3 10h18M10 14h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
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

export function MainWarehouseFinanceScreen({
  scope,
  can,
  onBack,
  onTabChange,
  onNavigateToNotifications,
  onNavigateToReports,
  onNavigateToRevenue,
  onNavigateToExpenses,
  onNavigateToAddExpense,
  onNavigateToVouchers,
  onNavigateToDailyCash,
  onNavigateToHistory,
  onNavigateToCategories,
}: MainWarehouseFinanceScreenProps) {
  const [activeTrendTab, setActiveTrendTab] = useState<'Revenue' | 'Expenses' | 'Net'>('Revenue');
  const [showRevenueScreen, setShowRevenueScreen] = useState(false);
  const [showExpensesScreen, setShowExpensesScreen] = useState(false);
  const [showAddExpenseScreen, setShowAddExpenseScreen] = useState(false);
  const [showExpenseDetailScreen, setShowExpenseDetailScreen] = useState(false);
  const [showVouchersScreen, setShowVouchersScreen] = useState(false);
  const [showRevenueDetailScreen, setShowRevenueDetailScreen] = useState(false);
  const [detailSourceIsHistory, setDetailSourceIsHistory] = useState(false);
  const [showDailyCashScreen, setShowDailyCashScreen] = useState(false);
  const [showFinanceReportsScreen, setShowFinanceReportsScreen] = useState(false);
  const [showFinanceHistoryScreen, setShowFinanceHistoryScreen] = useState(false);
  const [showExpenseCategoriesScreen, setShowExpenseCategoriesScreen] = useState(false);
  const [showVoucherDetailScreen, setShowVoucherDetailScreen] = useState(false);

  const handleTabPress = (tab: SubWHTab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else if (tab === 'More' && onBack) {
      onBack();
    } else if (tab === 'Home' && onBack) {
      onBack();
    }
  };

  const handleOpenRevenue = () => {
    if (onNavigateToRevenue) {
      onNavigateToRevenue();
    } else {
      setShowRevenueScreen(true);
    }
  };

  const handleOpenExpenses = () => {
    if (onNavigateToExpenses) {
      onNavigateToExpenses();
    } else {
      setShowExpensesScreen(true);
    }
  };

  const handleOpenAddExpense = () => {
    if (onNavigateToAddExpense) {
      onNavigateToAddExpense();
    } else {
      setShowAddExpenseScreen(true);
    }
  };

  const handleOpenVouchers = () => {
    if (onNavigateToVouchers) {
      onNavigateToVouchers();
    } else {
      setShowVouchersScreen(true);
    }
  };

  const handleOpenDailyCash = () => {
    if (onNavigateToDailyCash) {
      onNavigateToDailyCash();
    } else {
      setShowDailyCashScreen(true);
    }
  };

  const handleOpenReports = () => {
    setShowFinanceReportsScreen(true);
  };

  const handleOpenFinanceHistory = () => {
    if (onNavigateToHistory) {
      onNavigateToHistory();
    } else {
      setShowFinanceHistoryScreen(true);
    }
  };

  const handleOpenCategories = () => {
    if (onNavigateToCategories) {
      onNavigateToCategories();
    } else {
      setShowExpenseCategoriesScreen(true);
    }
  };

  const handleQuickAction = (actionName: string) => {
    switch (actionName) {
      case 'Add Expense':
        handleOpenAddExpense();
        break;
      case 'View Revenue':
        handleOpenRevenue();
        break;
      case 'View Expenses':
        handleOpenExpenses();
        break;
      case 'Add Voucher':
        handleOpenVouchers();
        break;
      case 'Daily Cash':
        handleOpenDailyCash();
        break;
      case 'Reports':
        handleOpenReports();
        break;
      case 'History':
        handleOpenFinanceHistory();
        break;
      case 'Categories':
        handleOpenCategories();
        break;
      default:
        Alert.alert(actionName, `Executing ${actionName}...`);
    }
  };

  if (showExpenseDetailScreen) {
    return (
      <ExpenseDetailScreen
        scope={scope}
        can={can}
        isShortVersion={detailSourceIsHistory}
        onTabChange={onTabChange}
        onViewVouchers={() => {
          setShowExpenseDetailScreen(false);
          setDetailSourceIsHistory(false);
          setShowVouchersScreen(true);
        }}
        onBack={() => {
          setShowExpenseDetailScreen(false);
          setDetailSourceIsHistory(false);
        }}
      />
    );
  }

  if (showRevenueDetailScreen) {
    return (
      <MainWarehouseRevenueDetailScreen
        revenueId="REV-000845"
        customer="Ravi Kumar"
        finalAmount="3,450"
        paymentMethod="Wallet"
        isShortVersion={detailSourceIsHistory}
        onBack={() => {
          setShowRevenueDetailScreen(false);
          setDetailSourceIsHistory(false);
        }}
      />
    );
  }

  if (showFinanceHistoryScreen) {
    return (
      <FinanceHistoryScreen
        scope={scope}
        can={can}
        onBack={() => setShowFinanceHistoryScreen(false)}
        onTabChange={onTabChange}
        onSelectItem={(item) => {
          setDetailSourceIsHistory(true);
          if (item.type === 'Expense') {
            setShowExpenseDetailScreen(true);
          } else if (item.type === 'Revenue') {
            setShowRevenueDetailScreen(true);
          } else {
            // fallback
            setShowExpenseDetailScreen(true);
          }
        }}
      />
    );
  }

  if (showFinanceReportsScreen) {
    return (
      <FinanceReportsScreen
        scope={scope}
        can={can}
        // docs/rbac.json grants report.export.file to MAIN_WH_ADMIN as 'view'
        // (read-only), and this hub is only mounted for the Main Warehouse
        // admin. /auth/me returns codes without scope, so can() alone would
        // say yes; keep Generate/Export off here. SPEC_GAPS.md section 1 #11.
        canExport={false}
        onBack={() => setShowFinanceReportsScreen(false)}
        onTabChange={onTabChange}
      />
    );
  }

  if (showDailyCashScreen) {
    return (
      <DailyCashScreen
        scope={scope}
        can={can}
        date="25 Sep 2026"
        onBack={() => setShowDailyCashScreen(false)}
        onTabChange={onTabChange}
      />
    );
  }

  if (showVouchersScreen) {
    return (
      <MainWarehouseVouchersScreen
        onBack={() => setShowVouchersScreen(false)}
        onVoucherPress={(id) => {
          setShowVouchersScreen(false);
          setShowVoucherDetailScreen(true);
        }}
      />
    );
  }

  if (showVoucherDetailScreen) {
    return (
      <MainWarehouseVoucherDetailScreen
        onBack={() => {
          setShowVoucherDetailScreen(false);
          setShowVouchersScreen(true);
        }}
      />
    );
  }

  if (showAddExpenseScreen) {
    return (
      <WarehouseAddExpenseScreen
        scope={scope}
        can={can}
        onTabChange={onTabChange}
        onBack={() => setShowAddExpenseScreen(false)}
        onSaveSuccess={() => setShowAddExpenseScreen(false)}
      />
    );
  }

  if (showRevenueScreen) {
    return (
      <MainWarehouseRevenueScreen
        onBack={() => setShowRevenueScreen(false)}
        onTabChange={onTabChange}
      />
    );
  }

  if (showExpensesScreen) {
    return (
      <WarehouseExpensesScreen
        scope={scope}
        can={can}
        onBack={() => setShowExpensesScreen(false)}
        onTabChange={onTabChange}
        onAddExpense={() => setShowAddExpenseScreen(true)}
      />
    );
  }

  if (showExpenseCategoriesScreen) {
    return (
      <MainWarehouseExpenseCategoriesScreen
        onBack={() => setShowExpenseCategoriesScreen(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Top Brand Header Banner ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeftGroup}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                if (onBack) onBack();
                else if (onTabChange) onTabChange('Home');
              }}
              activeOpacity={0.75}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Warehouse Finance</Text>
          </View>

          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => {
              if (onNavigateToNotifications) onNavigateToNotifications();
              else Alert.alert('Notifications', '3 unread finance notifications.');
            }}
            activeOpacity={0.75}
          >
            <BellIcon size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* All Warehouses Pill */}
        <TouchableOpacity
          style={styles.warehousePill}
          onPress={() => Alert.alert('Filter Period', 'Current filter: All Warehouses')}
          activeOpacity={0.8}
        >
          <LockIcon size={11} color="#FFFFFF" />
          <Text style={styles.warehousePillText}>All Warehouses</Text>
          <ChevronDownIcon size={10} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* ─── Main Content Scroll ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 4 Top KPI Metric Cards (2x2 Grid) ─── */}
        <View style={styles.kpiGrid}>
          {/* Row 1: Revenue & Expenses */}
          <View style={styles.kpiRow}>
            <TouchableOpacity
              style={styles.kpiCard}
              onPress={handleOpenRevenue}
              activeOpacity={0.75}
            >
              <Text style={styles.kpiLabel}>REVENUE</Text>
              <Text style={styles.kpiValue}>₹24,850</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.kpiCard}
              onPress={handleOpenExpenses}
              activeOpacity={0.75}
            >
              <Text style={styles.kpiLabel}>EXPENSES</Text>
              <Text style={styles.kpiValue}>₹6,420</Text>
            </TouchableOpacity>
          </View>

          {/* Row 2: Net Movement & Cash Balance */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>NET MOVEMENT</Text>
              <Text style={[styles.kpiValue]}>₹18,430</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>CASH BALANCE</Text>
              <Text style={styles.kpiValue}>₹22,080</Text>
            </View>
          </View>
        </View>

        {/* ─── Quick Actions ─── */}
        <Text style={{ fontFamily: 'Poppins', fontSize: 14, fontWeight: '800', color: '#8B5E3C', marginBottom: 12, marginTop: 4 }}>Quick Actions</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          {/* Action Cards */}
          <TouchableOpacity style={{ width: '48%', backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#EBE5DC' }} onPress={handleOpenRevenue}>
            <TrendingUpIcon size={24} color="#D97706" />
            <Text style={{ marginTop: 8, fontSize: 12, fontWeight: '700', color: '#1E1612' }}>Revenue</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ width: '48%', backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#EBE5DC' }} onPress={handleOpenExpenses}>
            <TrendingUpIcon size={24} color="#D97706" />
            <Text style={{ marginTop: 8, fontSize: 12, fontWeight: '700', color: '#1E1612' }}>Expenses</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ width: '48%', backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#EBE5DC' }} onPress={handleOpenAddExpense}>
            <PlusCircleIcon size={24} color="#D97706" />
            <Text style={{ marginTop: 8, fontSize: 12, fontWeight: '700', color: '#1E1612' }}>Add Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ width: '48%', backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#EBE5DC' }} onPress={handleOpenCategories}>
            <GridMenuIcon size={24} color="#D97706" />
            <Text style={{ marginTop: 8, fontSize: 12, fontWeight: '700', color: '#1E1612' }}>Categories</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ width: '48%', backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#EBE5DC' }} onPress={handleOpenVouchers}>
            <VoucherIcon size={24} color="#D97706" />
            <Text style={{ marginTop: 8, fontSize: 12, fontWeight: '700', color: '#1E1612' }}>Vouchers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ width: '48%', backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#EBE5DC' }} onPress={handleOpenDailyCash}>
            <DailyCashIcon size={24} color="#D97706" />
            <Text style={{ marginTop: 8, fontSize: 12, fontWeight: '700', color: '#1E1612' }}>Daily Cash</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ width: '48%', backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#EBE5DC' }} onPress={handleOpenFinanceHistory}>
            <DocumentLedgerIcon size={24} color="#D97706" />
            <Text style={{ marginTop: 8, fontSize: 12, fontWeight: '700', color: '#1E1612' }}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ width: '48%', backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#EBE5DC' }} onPress={handleOpenReports}>
            <ReportsFileIcon size={24} color="#D97706" />
            <Text style={{ marginTop: 8, fontSize: 12, fontWeight: '700', color: '#1E1612' }}>Reports</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Expense Breakdown ─── */}
        <View style={styles.sectionWrap}>
          <TouchableOpacity
            style={styles.sectionHeadingRow}
            onPress={handleOpenExpenses}
            activeOpacity={0.75}
          >
            <Text style={styles.sectionHeading}>Expense Breakdown</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.breakdownCard}
            onPress={handleOpenExpenses}
            activeOpacity={0.8}
          >
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Transport</Text>
              <Text style={styles.tableValue}>₹2,400</Text>
            </View>
            <View style={styles.tableDivider} />

            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Loading / Unloading</Text>
              <Text style={styles.tableValue}>₹1,800</Text>
            </View>
            <View style={styles.tableDivider} />

            <View style={styles.tableRow}>
              <Text style={styles.totalLabel}>Total Expenses</Text>
              <Text style={styles.totalValue}>₹6,420</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ─── Callout 2: Expense Categories Note ─── */}
        <TouchableOpacity
          style={styles.orangeCallout}
          onPress={handleOpenCategories}
          activeOpacity={0.8}
        >
          <Text style={styles.orangeCalloutText}>
            Categories mirror Expense Categories (S06) exactly — never invented independently on this dashboard.
          </Text>
        </TouchableOpacity>

        {/* ─── Financial Trend ─── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Financial Trend</Text>
            <TouchableOpacity
              onPress={handleOpenFinanceHistory}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.sectionActionText}>History ›</Text>
            </TouchableOpacity>
          </View>

          {/* Segmented Filter Pills */}
          <View style={styles.trendPillsRow}>
            <TouchableOpacity
              style={[
                styles.trendPill,
                activeTrendTab === 'Revenue' && styles.trendPillActive,
              ]}
              onPress={() => {
                setActiveTrendTab('Revenue');
                handleOpenRevenue();
              }}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.trendPillText,
                  activeTrendTab === 'Revenue' && styles.trendPillTextActive,
                ]}
              >
                Revenue
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.trendPill,
                activeTrendTab === 'Expenses' && styles.trendPillActive,
              ]}
              onPress={() => {
                setActiveTrendTab('Expenses');
                handleOpenExpenses();
              }}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.trendPillText,
                  activeTrendTab === 'Expenses' && styles.trendPillTextActive,
                ]}
              >
                Expenses
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.trendPill,
                activeTrendTab === 'Net' && styles.trendPillActive,
              ]}
              onPress={() => {
                setActiveTrendTab('Net');
                handleOpenFinanceHistory();
              }}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.trendPillText,
                  activeTrendTab === 'Net' && styles.trendPillTextActive,
                ]}
              >
                Net
              </Text>
            </TouchableOpacity>
          </View>

          {/* Trend Chart Card */}
          <TouchableOpacity
            style={styles.chartCard}
            onPress={handleOpenFinanceHistory}
            activeOpacity={0.85}
          >
            <Text style={styles.chartPlaceholderText}>
              Daily revenue trend — 7-day view
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Screen Subtitle */}
        <Text style={styles.screenFooterCode}>M11-S01 · Finance Dashboard</Text>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ─── Bottom Navigation Bar ─── */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleTabPress('Home')}
          activeOpacity={0.75}
        >
          <HomeTabIcon active={false} />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleTabPress('More')}
          activeOpacity={0.75}
        >
          <MoreTabIcon active={true} />
          <Text style={[styles.navLabel, styles.navLabelActive]}>More</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.primary,
  },
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 10,
    padding: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    alignSelf: 'flex-start',
    gap: 6,
  },
  warehousePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // ─── KPI Grid ───
  kpiGrid: {
    gap: 10,
    marginBottom: 12,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  kpiLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#5C544E',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: PALETTE.textDark,
  },
  kpiSubGreen: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.green,
    marginTop: 3,
  },

  // ─── Blue Callout ───
  blueCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.blueBg,
    borderWidth: 1,
    borderColor: PALETTE.blueBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 16,
  },
  // ─── Orange Callout ───
  orangeCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF3E7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  orangeCalloutText: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#8B5E3C',
    lineHeight: 16,
  },
  blueCalloutText: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '600',
    color: PALETTE.blueText,
    lineHeight: 16,
  },

  // ─── Sections & Tables ───
  sectionWrap: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textDark,
  },
  sectionActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.primary,
  },
  breakdownCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
  },
  tableLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textDark,
  },
  tableValue: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textDark,
  },
  tableDivider: {
    height: 1,
    backgroundColor: PALETTE.divider,
  },
  totalLabel: {
    fontSize: 13.5,
    fontWeight: '800',
    color: PALETTE.textDark,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.primaryDark,
  },

  // ─── Financial Trend ───
  trendPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  trendPill: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  trendPillActive: {
    borderColor: PALETTE.primary,
    backgroundColor: PALETTE.peachBg,
  },
  trendPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.textSecondary,
  },
  trendPillTextActive: {
    color: PALETTE.primaryDark,
  },
  chartCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  chartBarsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 14,
    height: 60,
    marginBottom: 14,
    width: '80%',
  },
  barCol: {
    flex: 1,
    backgroundColor: '#FCD9CE',
    borderRadius: 4,
  },
  chartPlaceholderText: {
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    textAlign: 'center',
  },

  // ─── Activity Section ───
  activityCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
  },
  activityIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityCode: {
    fontSize: 13.5,
    fontWeight: '800',
    color: PALETTE.textDark,
  },
  activitySub: {
    fontSize: 11.5,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    marginTop: 2,
  },
  activityRight: {
    alignItems: 'flex-end',
  },
  activityAmount: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  activityTime: {
    fontSize: 10.5,
    fontWeight: '500',
    color: PALETTE.textMuted,
    marginTop: 2,
  },

  // ─── Quick Actions Grid ───
  quickActionsGrid: {
    gap: 10,
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.textDark,
    textAlign: 'center',
  },

  // ─── Amber Callout ───
  amberCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: PALETTE.amberBg,
    borderWidth: 1,
    borderColor: PALETTE.amberBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 16,
  },
  amberCalloutText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.amberText,
    lineHeight: 16,
  },

  // ─── Screen Footer Code ───
  screenFooterCode: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.textMuted,
    textAlign: 'center',
    marginVertical: 4,
  },

  // ─── Bottom Navigation ───
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
