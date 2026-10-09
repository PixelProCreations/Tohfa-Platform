/**
 * Finance Reports: the menu of finance reports for a warehouse.
 *
 * Serves both Main Warehouse admins (scope.warehouseId undefined = all
 * warehouses) and Sub Warehouse admins (one warehouse). Which report cards are
 * listed is gated by the docs/rbac.json code of the data behind them
 * ('finance.sales_income.view' for revenue, 'finance.expense.log' for expenses;
 * reports mixing both need either). Generating/exporting is a separate
 * decision, see `canExport` below. This is presentation only; the server
 * re-checks every code and scope (CLAUDE.md 2.1).
 */
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

import { SubWarehouseRevenueScreen } from '../../../../subwarehouse/screens/SubWarehouseRevenueScreen';
import { SubWarehouseDailyCashScreen } from '../../../../subwarehouse/screens/SubWarehouseDailyCashScreen';
import { SubWarehouseExpenseCategoriesScreen } from '../../../../subwarehouse/screens/SubWarehouseExpenseCategoriesScreen';
import { SubWarehouseVouchersScreen } from '../../../../subwarehouse/screens/SubWarehouseVouchersScreen';
import { adminColors, adminType, adminRadius, adminSpacing, adminShadow } from '../../../theme';
import { FinanceHistoryScreen } from './FinanceHistoryScreen';
import { WarehouseExpensesScreen } from './WarehouseExpensesScreen';
import type { FinanceReportItem, WarehouseScreenBaseProps, WarehouseTab } from './types';

/** Which rbac code(s) unlock a report: any one of `codes` is enough. */
interface GatedReport {
  item: FinanceReportItem;
  codes: readonly string[];
}

const REVENUE_CODE = 'finance.sales_income.view';
const EXPENSE_CODE = 'finance.expense.log';

const FINANCE_REPORTS: GatedReport[] = [
  {
    item: {
      id: 'revenue_report',
      title: 'Revenue Report',
      subtitle: 'By date, sales channel, payment method',
      iconType: 'revenue',
    },
    codes: [REVENUE_CODE],
  },
  {
    item: {
      id: 'expense_report',
      title: 'Expense Report',
      subtitle: 'By date, category, payment method',
      iconType: 'expense',
    },
    codes: [EXPENSE_CODE],
  },
  {
    item: {
      id: 'daily_summary',
      title: 'Daily Finance Summary',
      subtitle: 'Opening, Revenue, Expenses, Closing',
      iconType: 'daily',
    },
    codes: [REVENUE_CODE, EXPENSE_CODE],
  },
  {
    item: {
      id: 'monthly_summary',
      title: 'Monthly Finance Summary',
      subtitle: 'Monthly revenue, expenses, net movement',
      iconType: 'monthly',
    },
    codes: [REVENUE_CODE, EXPENSE_CODE],
  },
  {
    item: {
      id: 'expense_category',
      title: 'Expense Category Report',
      subtitle: 'Transport, Loading, Unloading, Maintenance...',
      iconType: 'category',
    },
    codes: [EXPENSE_CODE],
  },
  {
    item: {
      id: 'voucher_report',
      title: 'Voucher Report',
      subtitle: 'Voucher count, amount, type, date, status',
      iconType: 'voucher',
    },
    codes: [EXPENSE_CODE],
  },
];

export interface FinanceReportsScreenProps extends WarehouseScreenBaseProps {
  /**
   * Whether Generate/Export is offered. rbac.json grants report.export.file as MAIN_WH_ADMIN=view (read-only)
   * and SUB_WH_ADMIN=own, but /auth/me returns codes without their scope, so can() cannot tell view from own.
   * The host passes this explicitly; undefined falls back to can('report.export.file').
   */
  canExport?: boolean | undefined;
  onSelectReport?: ((reportId: string) => void) | undefined;
  onNavigateToCustomerOrders?: (() => void) | undefined;
  onNavigateToInvoiceList?: (() => void) | undefined;
  onNavigateToHistory?: (() => void) | undefined;
}

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

function ChevronRightIcon({ size = 18, color = adminColors.placeholder }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function RevenueReportIcon({ size = 20, color = adminColors.brandDeep }: { size?: number; color?: string }) {
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

function ExpenseReportIcon({ size = 20, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="2" width="16" height="20" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M8 6h8M8 10h8M8 14h5M8 18h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function DailySummaryIcon({ size = 20, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="15" r="1.5" fill={color} />
    </Svg>
  );
}

function MonthlySummaryIcon({ size = 20, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M8 14h2M14 14h2M8 18h2M14 18h2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ExpenseCategoryIcon({ size = 20, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="9" y="3" width="6" height="6" rx="1" stroke={color} strokeWidth="2" />
      <Rect x="3" y="15" width="6" height="6" rx="1" stroke={color} strokeWidth="2" />
      <Rect x="15" y="15" width="6" height="6" rx="1" stroke={color} strokeWidth="2" />
      <Path d="M12 9v3M6 12h12v3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function VoucherReportIcon({ size = 20, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M8 9h8M8 13h8M8 17h5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ProhibitedIcon({ size = 16, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M4.93 4.93l14.14 14.14" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Bottom Tab Icons ────────────────────────────────────────────────────────

function HomeTabIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
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
  const color = active ? adminColors.brand : adminColors.muted;
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
  const color = active ? adminColors.brand : adminColors.muted;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M3 10h18M10 14h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function MoreTabIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
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

export function FinanceReportsScreen({
  scope,
  can,
  canExport,
  onBack,
  onTabChange,
  onSelectReport,
}: FinanceReportsScreenProps) {
  const [activeSubScreen, setActiveSubScreen] = useState<
    'revenue' | 'expense' | 'daily' | 'monthly' | 'categories' | 'vouchers' | null
  >(null);

  const warehouseLabel = scope.warehouseId === undefined ? 'All Warehouses' : (scope.warehouseName ?? '');
  const exportAllowed = canExport ?? can('report.export.file');
  const visibleReports = FINANCE_REPORTS.filter((r) => r.codes.some((code) => can(code))).map((r) => r.item);

  const handleTabPress = (tab: WarehouseTab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
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
        // Only a viewer allowed to export gets the generate action; everyone
        // else can open a report but not produce a file from it.
        if (exportAllowed) {
          Alert.alert(report.title, `Generating report: ${report.title} (${report.subtitle})...`);
        }
    }
  };

  const closeSubScreen = () => setActiveSubScreen(null);

  if (activeSubScreen === 'revenue') {
    return <SubWarehouseRevenueScreen onBack={closeSubScreen} onTabChange={onTabChange} />;
  }

  if (activeSubScreen === 'expense') {
    return (
      <WarehouseExpensesScreen
        scope={scope}
        can={can}
        onBack={closeSubScreen}
        onTabChange={onTabChange}
      />
    );
  }

  if (activeSubScreen === 'daily') {
    return (
      <SubWarehouseDailyCashScreen
        warehouseName={warehouseLabel}
        date="25 Sep 2026"
        onBack={closeSubScreen}
        onTabChange={onTabChange}
      />
    );
  }

  if (activeSubScreen === 'monthly') {
    return (
      <FinanceHistoryScreen
        scope={scope}
        can={can}
        onBack={closeSubScreen}
        onTabChange={onTabChange}
      />
    );
  }

  if (activeSubScreen === 'categories') {
    return <SubWarehouseExpenseCategoriesScreen onBack={closeSubScreen} onTabChange={onTabChange} />;
  }

  if (activeSubScreen === 'vouchers') {
    return (
      <SubWarehouseVouchersScreen
        warehouseName={warehouseLabel}
        onBack={closeSubScreen}
        onTabChange={onTabChange}
      />
    );
  }

  const renderReportIcon = (type: FinanceReportItem['iconType']) => {
    switch (type) {
      case 'revenue':
        return <RevenueReportIcon size={20} color={adminColors.brandDeep} />;
      case 'expense':
        return <ExpenseReportIcon size={20} color={adminColors.brandDeep} />;
      case 'daily':
        return <DailySummaryIcon size={20} color={adminColors.brandDeep} />;
      case 'monthly':
        return <MonthlySummaryIcon size={20} color={adminColors.brandDeep} />;
      case 'category':
        return <ExpenseCategoryIcon size={20} color={adminColors.brandDeep} />;
      case 'voucher':
        return <VoucherReportIcon size={20} color={adminColors.brandDeep} />;
      default:
        return <ExpenseReportIcon size={20} color={adminColors.brandDeep} />;
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Top Brand Header Banner ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.75}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Finance Reports</Text>
            <Text style={styles.headerSubtitle}>{warehouseLabel}</Text>
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
          {visibleReports.length === 0 && (
            <Text style={styles.emptyText}>You do not have access to any finance reports.</Text>
          )}
          {visibleReports.map((item, index) => (
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
                <ChevronRightIcon size={18} color={adminColors.placeholder} />
              </TouchableOpacity>

              {index < visibleReports.length - 1 && <View style={styles.rowDivider} />}
            </React.Fragment>
          ))}
        </View>

        {/* ─── Scope Restriction Notice Card ─── */}
        {/* Only the single-warehouse view carries the restriction; the all-warehouses
            (Main) view is not described by this limit. */}
        {scope.warehouseId !== undefined && (
          <View style={styles.restrictionCard}>
            <View style={styles.restrictionIconBox}>
              <ProhibitedIcon size={16} color={adminColors.muted} />
            </View>
            <Text style={styles.restrictionText}>
              No Tally/Zoho export, GST filing report, or company-wide P&L appears here — those capabilities are not granted to sub warehouse admins.
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ─── Bottom Navigation Bar ─── */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navTab} onPress={() => handleTabPress('Home')} activeOpacity={0.7}>
          <HomeTabIcon active={false} />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navTab} onPress={() => handleTabPress('Receiving')} activeOpacity={0.7}>
          <ReceivingTabIcon active={false} />
          <Text style={styles.navLabel}>Receiving</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navTab} onPress={() => handleTabPress('Inventory')} activeOpacity={0.7}>
          <InventoryTabIcon active={false} />
          <Text style={styles.navLabel}>Inventory</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navTab} onPress={() => handleTabPress('More')} activeOpacity={0.7}>
          <MoreTabIcon active />
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
    backgroundColor: adminColors.brand,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.input,
    paddingTop: 10,
    paddingBottom: adminSpacing.lg,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: adminSpacing.md,
    padding: 2,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  headerSubtitle: {
    ...adminType.rowMeta,
    color: adminColors.onBrand,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
  },
  bottomSpacer: {
    height: adminSpacing.input,
  },

  // Reports Menu Card Container
  cardContainer: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.xs,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: 14,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textCol: {
    flex: 1,
  },
  reportTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  reportSubtitle: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 3,
  },
  rowDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginHorizontal: adminSpacing.lg,
  },
  emptyText: {
    ...adminType.body,
    color: adminColors.muted,
    textAlign: 'center',
    padding: adminSpacing.lg,
  },

  // Restriction Notice Card
  restrictionCard: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  restrictionIconBox: {
    marginTop: 2,
  },
  restrictionText: {
    flex: 1,
    ...adminType.rowMeta,
    color: adminColors.muted,
  },

  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingVertical: adminSpacing.sm,
    paddingHorizontal: adminSpacing.md,
    ...adminShadow.sm,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  navLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 3,
  },
  navLabelActive: {
    color: adminColors.brand,
    fontWeight: '700',
  },
});
