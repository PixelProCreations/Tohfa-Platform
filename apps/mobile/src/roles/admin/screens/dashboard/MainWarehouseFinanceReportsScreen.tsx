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
import { MainWarehouseExpensesScreen } from './MainWarehouseExpensesScreen';
import { MainWarehouseDailyCashScreen } from './MainWarehouseDailyCashScreen';
import { MainWarehouseFinanceHistoryScreen } from './MainWarehouseFinanceHistoryScreen';
import { MainWarehouseVouchersScreen } from './MainWarehouseVouchersScreen';

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

  tabInactive:   '#786F66',
  tabBorder:     '#EAE4DB',
};

type MainWHTab = 'Home' | 'Receiving' | 'Inventory' | 'More';

export interface FinanceReportItem {
  id: string;
  title: string;
  subtitle: string;
  iconType: 'revenue' | 'expense' | 'daily' | 'monthly' | 'category' | 'voucher';
}

const FINANCE_REPORT_ITEMS: FinanceReportItem[] = [
  {
    id: 'daily_summary',
    title: 'Daily Finance Summary',
    subtitle: 'Opening, Revenue, Expenses, Closing',
    iconType: 'daily',
  },
  {
    id: 'monthly_summary',
    title: 'Monthly Finance Summary',
    subtitle: 'Monthly revenue, expenses, net movement',
    iconType: 'monthly',
  },
  {
    id: 'expense_category',
    title: 'Expense Category Report',
    subtitle: 'Transport, Loading, Unloading, Maintenance...',
    iconType: 'category',
  },
  {
    id: 'voucher_report',
    title: 'Voucher Report',
    subtitle: 'Voucher count, amount, type, date, status',
    iconType: 'voucher',
  },
];

export interface MainWarehouseFinanceReportsScreenProps {
  warehouseName?: string | undefined;
  onBack?: (() => void) | undefined;
  onTabChange?: ((tab: MainWHTab) => void) | undefined;
  onSelectReport?: ((reportId: string) => void) | undefined;
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

function ChevronRightIcon({ size = 18, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function RevenueReportIcon({ size = 20, color = '#8B5E3C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 6l-9.5 9.5-5-5L1 18"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M17 6h6v6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ExpenseReportIcon({ size = 20, color = '#8B5E3C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="2" width="16" height="20" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M8 6h8M8 10h8M8 14h5M8 18h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function DailySummaryIcon({ size = 20, color = '#8B5E3C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="15" r="1.5" fill={color} />
    </Svg>
  );
}

function MonthlySummaryIcon({ size = 20, color = '#8B5E3C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M8 14h2M14 14h2M8 18h2M14 18h2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ExpenseCategoryIcon({ size = 20, color = '#8B5E3C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="9" y="3" width="6" height="6" rx="1" stroke={color} strokeWidth="2" />
      <Rect x="3" y="15" width="6" height="6" rx="1" stroke={color} strokeWidth="2" />
      <Rect x="15" y="15" width="6" height="6" rx="1" stroke={color} strokeWidth="2" />
      <Path d="M12 9v3M6 12h12v3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function VoucherReportIcon({ size = 20, color = '#8B5E3C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M8 9h8M8 13h8M8 17h5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ProhibitedIcon({ size = 16, color = '#7A726C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M4.93 4.93l14.14 14.14" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Bottom Tab Icons ────────────────────────────────────────────────────────

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
      <Path d="M9 21V12h6v9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceivingTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
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

// ─── Main Component ──────────────────────────────────────────────────────────

export function MainWarehouseFinanceReportsScreen({
  warehouseName = 'Coonoor Warehouse',
  onBack,
  onTabChange,
  onSelectReport,
}: MainWarehouseFinanceReportsScreenProps) {
  const [activeSubScreen, setActiveSubScreen] = useState<
    'revenue' | 'expense' | 'daily' | 'monthly' | 'categories' | 'vouchers' | null
  >(null);

  const handleTabPress = (tab: MainWHTab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else if (onBack) {
      onBack();
    }
  };

  const handleReportPress = (report: FinanceReportItem) => {
    if (onSelectReport) {
      onSelectReport(report.id);
      return;
    }

    switch (report.id) {
      case 'revenue_report':
        setActiveSubScreen('revenue');
        break;
      case 'expense_report':
        setActiveSubScreen('expense');
        break;
      case 'daily_summary':
        setActiveSubScreen('daily');
        break;
      case 'monthly_summary':
        setActiveSubScreen('monthly');
        break;
      case 'expense_category':
        setActiveSubScreen('categories');
        break;
      case 'voucher_report':
        setActiveSubScreen('vouchers');
        break;
      default:
        Alert.alert(report.title, `Generating report: ${report.title} (${report.subtitle})...`);
    }
  };

  if (activeSubScreen === 'revenue') {
    return (
      <MainWarehouseRevenueScreen
        onBack={() => setActiveSubScreen(null)}
        onTabChange={onTabChange}
      />
    );
  }

  if (activeSubScreen === 'expense') {
    return (
      <MainWarehouseExpensesScreen
        onBack={() => setActiveSubScreen(null)}
        onTabChange={onTabChange}
      />
    );
  }

  if (activeSubScreen === 'daily') {
    return (
      <MainWarehouseDailyCashScreen
        warehouseName={warehouseName}
        date="25 Sep 2026"
        onBack={() => setActiveSubScreen(null)}
        onTabChange={onTabChange}
      />
    );
  }

  if (activeSubScreen === 'monthly') {
    return (
      <MainWarehouseFinanceHistoryScreen
        onBack={() => setActiveSubScreen(null)}
        onTabChange={onTabChange}
      />
    );
  }

  // if (activeSubScreen === 'categories') {
  //   return (
  //     <MainWarehouseExpenseCategoriesScreen
  //       onBack={() => setActiveSubScreen(null)}
  //       onTabChange={onTabChange}
  //     />
  //   );
  // }

  if (activeSubScreen === 'vouchers') {
    return (
      <MainWarehouseVouchersScreen
        onBack={() => setActiveSubScreen(null)}
        onVoucherPress={(id) => { console.log('Voucher press', id) }}
      />
    );
  }

  const renderReportIcon = (type: FinanceReportItem['iconType']) => {
    switch (type) {
      case 'revenue':
        return <RevenueReportIcon size={20} color={PALETTE.iconColor} />;
      case 'expense':
        return <ExpenseReportIcon size={20} color={PALETTE.iconColor} />;
      case 'daily':
        return <DailySummaryIcon size={20} color={PALETTE.iconColor} />;
      case 'monthly':
        return <MonthlySummaryIcon size={20} color={PALETTE.iconColor} />;
      case 'category':
        return <ExpenseCategoryIcon size={20} color={PALETTE.iconColor} />;
      case 'voucher':
        return <VoucherReportIcon size={20} color={PALETTE.iconColor} />;
      default:
        return <ExpenseReportIcon size={20} color={PALETTE.iconColor} />;
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Top Brand Header Banner ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.75}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Finance Reports</Text>
            <Text style={styles.headerSubtitle}>{warehouseName}</Text>
          </View>
        </View>
      </View>

      {/* ─── Scrollable Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Reports Menu Container Card ─── */}
        <View style={styles.cardContainer}>
          {FINANCE_REPORT_ITEMS.map((item, index) => (
            <React.Fragment key={item.id}>
              <TouchableOpacity
                style={styles.reportRow}
                onPress={() => handleReportPress(item)}
                activeOpacity={0.7}
              >
                {/* Icon Box */}
                <View style={styles.iconBox}>
                  {renderReportIcon(item.iconType)}
                </View>

                {/* Text Col */}
                <View style={styles.textCol}>
                  <Text style={styles.reportTitle}>{item.title}</Text>
                  <Text style={styles.reportSubtitle}>{item.subtitle}</Text>
                </View>

                {/* Right Arrow */}
                <ChevronRightIcon size={18} color="#9CA3AF" />
              </TouchableOpacity>

              {index < FINANCE_REPORT_ITEMS.length - 1 && <View style={styles.rowDivider} />}
            </React.Fragment>
          ))}
        </View>

        {/* ─── SWA Scope Restriction Notice Card ─── */}
        <View style={styles.restrictionCard}>
          <View style={styles.restrictionIconBox}>
            <ProhibitedIcon size={16} color="#7A726C" />
          </View>
          <Text style={styles.restrictionText}>
            No Tally/Zoho export, GST filing report, or company-wide P&L appears here — those capabilities are not granted to SWA.
          </Text>
        </View>

        {/* Screen Footer Code */}
        <Text style={styles.screenFooterCode}>M11-S10 · Finance Reports</Text>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ─── Bottom Navigation Bar ─── */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navTab}
          onPress={() => handleTabPress('Home')}
          activeOpacity={0.7}
        >
          <HomeTabIcon active={false} />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTab}
          onPress={() => handleTabPress('Receiving')}
          activeOpacity={0.7}
        >
          <ReceivingTabIcon active={false} />
          <Text style={styles.navLabel}>Receiving</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTab}
          onPress={() => handleTabPress('Inventory')}
          activeOpacity={0.7}
        >
          <InventoryTabIcon active={false} />
          <Text style={styles.navLabel}>Inventory</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTab}
          onPress={() => handleTabPress('More')}
          activeOpacity={0.7}
        >
          <MoreTabIcon active={true} />
          <Text style={[styles.navLabel, styles.navLabelActive]}>More</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Stylesheet ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.primary,
  },
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 2,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
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

  // Reports Menu Card Container
  cardContainer: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 4,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: PALETTE.peachBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textCol: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textDark,
  },
  reportSubtitle: {
    fontSize: 11.5,
    fontWeight: '600',
    color: PALETTE.textSecondary,
    marginTop: 3,
  },
  rowDivider: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginHorizontal: 16,
  },

  // Restriction Notice Card
  restrictionCard: {
    backgroundColor: '#FAF5EE',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFE6D8',
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  restrictionIconBox: {
    marginTop: 2,
  },
  restrictionText: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '600',
    color: PALETTE.textSecondary,
    lineHeight: 16,
  },

  // Screen Footer
  screenFooterCode: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.textMuted,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },

  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.tabBorder,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 4,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  navLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: PALETTE.tabInactive,
    marginTop: 3,
  },
  navLabelActive: {
    color: PALETTE.primary,
    fontWeight: '700',
  },
});
