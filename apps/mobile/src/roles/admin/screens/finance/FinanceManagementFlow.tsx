import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { ScreenStatusBar } from '@tohfa/mobile-ui';

import {
  OverviewCardsGrid,
  OverviewDashboardCard,
} from '../../components/OverviewDashboardCard';
import { adminColors, adminOverlay, adminRadius, adminSpacing, adminType } from '../../theme';
import { FinanceFlow } from '../warehouse/finance-expenses';
import { SalesFlow } from '../warehouse/sales-direct';
import { WalletFlow } from '../warehouse/wallet-cashtopup';

import { InvoicesGstBillingScreen } from './InvoicesGstBillingScreen';
import { PaymentMethodsScreen } from './PaymentMethodsScreen';
import { ProfitLossScreen } from './ProfitLossScreen';
import { PurchaseDuesPayoutsScreen } from './PurchaseDuesPayoutsScreen';
import { ReportsExportScreen } from './ReportsExportScreen';
import { ReturnsRmaRefundsScreen } from './ReturnsRmaRefundsScreen';
import { SalesIncomeRevenueScreen } from './SalesIncomeRevenueScreen';
import { TransactionHistoryScreen } from './TransactionHistoryScreen';
import { WalletDeductionFlow } from './WalletDeductionFlow';
import { PayoutTransactionsListScreen } from './PayoutTransactionsListScreen';
import { PayoutBatchListScreen } from './PayoutBatchListScreen';
import { useAdminQuery } from '../../api/hooks';
import {
  getFinanceRevenueReport,
  getFinanceExpenseReport,
  listFinanceRevenue,
  type FinanceRevenueItemDto,
} from '../../api/finance';
import { listPayoutDues } from '../../api/payoutDues';
import { listAllWarehouses } from '../../api/warehouseList';
import { t } from '../../i18n';
import { formatAdminDay } from '../../utils/datetime';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { countText, moneyText } from '../dashboard/saOverviewFormat';
import { istToday } from '../warehouse/finance-expenses/mappers';
import { addDays, type ReportRange } from '../warehouse/finance-expenses/reportRanges';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';

/** The header's range choices. Only those whose label fixes a span are wired; see the filter modal. */
type FlowRangeKey = 'last7' | 'last30';

/** "Last 7 Days" and "Last 30 Days" each include today (IST). */
function flowRange(key: FlowRangeKey, today: string): ReportRange {
  return { from: addDays(today, key === 'last7' ? -6 : -29), to: today };
}

/** Badge colours for a revenue row's payment status. */
function paymentTone(status: string): { bg: string; text: string } {
  if (status === 'PAID') return adminColors.success;
  if (status === 'FAILED') return adminColors.danger;
  return adminColors.warning;
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BankBuildingWhiteIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9.5L12 4l9 5.5v1H3v-1z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 10.5v6.5M9 10.5v6.5M15 10.5v6.5M19 10.5v6.5M3 17.5h18M2 20.5h20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DownloadWhiteIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3v13M7 11l5 5 5-5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="21" x2="4" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="10" x2="4" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="21" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="8" x2="12" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="20" y1="21" x2="20" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="20" y1="12" x2="20" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="4" cy="12" r="2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="10" r="2" stroke={color} strokeWidth="2" />
      <Circle cx="20" cy="14" r="2" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function GoToProfitLossIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 3v18h18" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M19 9l-5 5-4-4-3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function GoToPurchaseSalesIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 2h9l5 5v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6M8 12h8M8 16h6" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </Svg>
  );
}

function GoToDuesPayoutsIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="1.9" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.9" />
      <Path d="M6 9h.01M18 15h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function GoToSalesIncomeIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 17l6-6 4 4 8-8" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 7h7v7" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function GoToExpensesIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="2.5" stroke={color} strokeWidth="1.9" />
      <Circle cx="8" cy="12" r="1.5" fill={color} />
      <Circle cx="16" cy="12" r="1.5" fill={color} />
      <Rect x="10.5" y="9.5" width="3" height="5" rx="0.8" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

function GoToCustomerWalletIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="13" rx="2.5" stroke={color} strokeWidth="1.9" />
      <Path d="M2 10h20M17 14h3" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <Circle cx="15.5" cy="14" r="1" fill={color} />
    </Svg>
  );
}

function GoToInvoiceIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6M8 13h4M8 17h8" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function GoToReviewReturnsIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth="1.9" />
      <Path d="M15 12h-6m0 0l2.5-2.5M9 12l2.5 2.5" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function GoToTransactionHistoryIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 3v5h5M12 7v5l3 3" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function GoToReportExportIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3v11M8 10l4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function GoToPaymentMethodsIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="1.9" />
      <Path d="M2 10h20M6 15h4" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </Svg>
  );
}

function GoToPayoutTransactionsIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 8h13m0 0l-3.5-3.5M17 8l-3.5 3.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M20 16H7m0 0l3.5-3.5M7 16l3.5 3.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function GoToPayoutBatchIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6M8 12h8M8 16h5" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Local OverviewActionCard ───────────────────────────────────────────────

function OverviewActionCard({
  title,
  icon,
  onPress,
}: {
  title: string;
  icon: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.actionCard}
      onPress={onPress}
      activeOpacity={0.72}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.actionIconWrap}>{icon}</View>
      <Text style={styles.actionTitle} numberOfLines={2}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type FinanceSubScreen =
  | 'overview'
  | 'profitLoss'
  | 'salesIncome'
  | 'expenses'
  | 'purchaseSales'
  | 'duesPayouts'
  | 'customerWallet'
  | 'walletDeduction'
  | 'invoicesGst'
  | 'reviewReturns'
  | 'payoutTransactions'
  | 'payoutBatch'
  | 'transactionHistory'
  | 'reportExport'
  | 'paymentMethods';

export interface FinanceManagementFlowProps {
  role?: 'SUPER_ADMIN' | 'TOHFA_ADMIN' | string | undefined;
  can?: ((perm: string) => boolean) | undefined;
  initialSubScreen?: FinanceSubScreen | undefined;
  showBackButton?: boolean | undefined;
  onBack: () => void;
  onTabChange?: ((tab: string) => void) | undefined;
  onSubScreenChange?: ((subScreen: FinanceSubScreen) => void) | undefined;
}

/** Recent transactions shown on the overview. */
const RECENT_COUNT = 3;

export function FinanceManagementFlow({
  role = 'SUPER_ADMIN',
  can = () => true,
  initialSubScreen = 'overview',
  showBackButton = false,
  onBack,
  onTabChange,
  onSubScreenChange,
}: FinanceManagementFlowProps) {
  const [subScreen, setSubScreenState] = useState<FinanceSubScreen>(initialSubScreen);
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  // The header states the range ("Last 30 Days"), so the reports are asked for exactly that
  // (BR-63 reports need real YYYY-MM-DD dates; a blank date is a 422).
  const [rangeKey, setRangeKey] = useState<FlowRangeKey>('last30');
  const range = flowRange(rangeKey, istToday());

  const { data: revReport } = useAdminQuery(['admin', 'finance', 'revenue-report', range.from, range.to], (signal) =>
    getFinanceRevenueReport(range, signal),
  );
  const { data: expReport } = useAdminQuery(['admin', 'finance', 'expense-report', range.from, range.to], (signal) =>
    getFinanceExpenseReport(range, signal),
  );
  const recentQuery = useAdminQuery(['admin', 'finance', 'revenue-recent', RECENT_COUNT], (signal) =>
    listFinanceRevenue({ limit: RECENT_COUNT }, signal),
  );
  // Payout dues totals cover every due, whatever page is asked for; one row is enough.
  const { data: duesData } = useAdminQuery(['admin', 'payout-dues', 'totals'], (signal) => listPayoutDues({ limit: 1 }, signal));
  const warehousesQuery = useAdminQuery(['admin', 'warehouses', 'all'], (signal) => listAllWarehouses({}, signal));

  const salesTotalText = moneyText(revReport?.summary.total);
  const expTotalText = moneyText(expReport?.summary.total);
  const duesTotalText = moneyText(duesData?.totals.totalDue);
  // Revenue is completed PAID orders (BR-63), so its count is the collected count.
  const collectedCountText = countText(revReport?.summary.count);
  const warehouses = warehousesQuery.data ?? [];
  const recent = recentQuery.data?.items ?? [];

  const setSubScreen = (newSub: FinanceSubScreen) => {
    setSubScreenState(newSub);
    onSubScreenChange?.(newSub);
  };

  React.useEffect(() => {
    onSubScreenChange?.(subScreen);
  }, [subScreen, onSubScreenChange]);

  // RBAC checks
  const canConfigurePayments = can('payment.method.configure') || role === 'SUPER_ADMIN';

  // Subscreen routers
  if (subScreen === 'profitLoss') {
    return <ProfitLossScreen onBack={() => setSubScreen('overview')} can={can} />;
  }

  if (subScreen === 'walletDeduction') {
    return (
      <WalletDeductionFlow
        role={role}
        onBack={() => setSubScreen('customerWallet')}
        onSuccess={() => setSubScreen('customerWallet')}
      />
    );
  }

  if (subScreen === 'paymentMethods') {
    return <PaymentMethodsScreen onBack={() => setSubScreen('overview')} can={can} />;
  }

  if (subScreen === 'customerWallet') {
    return (
      <WalletFlow
        scope={{ warehouseId: undefined, warehouseName: t('wiringFinance.allWarehouses') }}
        can={can}
        initialScreen="CustomerWallet"
        onBack={() => setSubScreen('overview')}
      />
    );
  }

  if (subScreen === 'purchaseSales') {
    return (
      <SalesFlow
        scope={{ warehouseId: undefined, warehouseName: undefined }}
        can={can}
        onBack={() => setSubScreen('overview')}
        onTabChange={(tab) => {
          onTabChange?.(tab);
          setSubScreen('overview');
        }}
      />
    );
  }

  if (subScreen === 'duesPayouts') {
    return <PurchaseDuesPayoutsScreen onBack={() => setSubScreen('overview')} />;
  }

  if (subScreen === 'salesIncome') {
    return <SalesIncomeRevenueScreen can={can} onBack={() => setSubScreen('overview')} />;
  }

  if (subScreen === 'expenses') {
    return (
      <FinanceFlow
        scope={{ warehouseId: undefined, warehouseName: t('wiringFinance.allWarehouses') }}
        can={can}
        initialScreen="Expenses"
        onBack={() => setSubScreen('overview')}
      />
    );
  }

  if (subScreen === 'invoicesGst') {
    return <InvoicesGstBillingScreen can={can} onBack={() => setSubScreen('overview')} />;
  }

  if (subScreen === 'reviewReturns') {
    return <ReturnsRmaRefundsScreen can={can} onBack={() => setSubScreen('overview')} />;
  }

  if (subScreen === 'payoutTransactions') {
    return <PayoutTransactionsListScreen onBack={() => setSubScreen('overview')} />;
  }

  if (subScreen === 'payoutBatch') {
    return <PayoutBatchListScreen onBack={() => setSubScreen('overview')} />;
  }

  if (subScreen === 'transactionHistory') {
    return <TransactionHistoryScreen can={can} onBack={() => setSubScreen('overview')} />;
  }

  if (subScreen === 'reportExport') {
    return <ReportsExportScreen can={can} onBack={() => setSubScreen('overview')} />;
  }

  // Main Dashboard: Accounts & Finance Overview (Matches Images 1 & 2)
  return (
    <View style={styles.container}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerTitleGroup}>
              {showBackButton && (
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={onBack}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                >
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M19 12H5M12 19l-7-7 7-7"
                      stroke={adminColors.onBrand}
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </TouchableOpacity>
              )}
              <BankBuildingWhiteIcon size={24} color={adminColors.onBrand} />
              <Text style={styles.headerTitle}>Accounts & Finance</Text>
            </View>

            <View style={styles.headerActionsRow}>
              <TouchableOpacity
                style={styles.headerPillBtn}
                onPress={() => setShowFilterModal(true)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Filter accounts and finance"
              >
                <FilterSlidersIcon size={18} color={adminColors.onBrand} />
              </TouchableOpacity>
              {/* No finance-overview export under /admin/exports/*, so drawn unavailable (R3). */}
              <TouchableOpacity
                style={[styles.headerPillBtn, styles.actionUnavailable]}
                disabled
                activeOpacity={1}
                accessibilityRole="button"
                accessibilityLabel="Download finance report"
                accessibilityState={{ disabled: true }}
                testID="finance.flow.export"
              >
                <DownloadWhiteIcon size={18} color={adminColors.onBrand} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>{t(`wiringFinance.flow.range.${rangeKey}`)}</Text>
        </View>

        {/* 2. Subheader */}
        <View style={styles.subheaderRow}>
          <Text style={styles.lastUpdated}>{t('wiringFinance.flow.lastUpdated', { when: ADMIN_NO_VALUE })}</Text>
        </View>

        {/* 3. 8 KPI Cards: a live value only under the label that means it, the dash elsewhere (R5) */}
        <OverviewCardsGrid style={{ paddingHorizontal: adminSpacing.md, rowGap: 10 }}>
          <OverviewDashboardCard
            title="Sales"
            value={salesTotalText}
            icon="sales"
            onPress={() => setSubScreen('salesIncome')}
          />
          <OverviewDashboardCard
            title="Farmer Purchase Value"
            value={ADMIN_NO_VALUE}
            icon="truck"
            onPress={() => setSubScreen('purchaseSales')}
          />
          <OverviewDashboardCard
            title="Outstanding Dues"
            value={duesTotalText}
            icon="orders"
            onPress={() => setSubScreen('duesPayouts')}
          />
          <OverviewDashboardCard
            title="Expenses"
            value={expTotalText}
            icon="cash"
            onPress={() => setSubScreen('expenses')}
          />
          <OverviewDashboardCard
            title="Wallet Liability"
            value={ADMIN_NO_VALUE}
            icon="cash"
            onPress={() => setSubScreen('customerWallet')}
          />
          <OverviewDashboardCard
            title="Pending Payouts"
            value={ADMIN_NO_VALUE}
            icon="cash"
            onPress={() => setSubScreen('duesPayouts')}
          />
          <OverviewDashboardCard
            title="Refunds"
            value={ADMIN_NO_VALUE}
            icon="alert"
            onPress={() => setSubScreen('reviewReturns')}
          />
          <OverviewDashboardCard
            title="Net Financial Summary"
            value={ADMIN_NO_VALUE}
            icon="inventory"
            onPress={() => setSubScreen('profitLoss')}
          />
        </OverviewCardsGrid>

        {/* Helper Note directly on canvas */}
        <View style={styles.noteBox}>
          <Text style={styles.noteText}>
            No profit figure is calculated: expenses can't simply be subtracted from sales until the formula is finance-owner approved.
          </Text>
        </View>

        {/* 4. Daily Bars (Revenue, Expense & Purchase). The reports give a period total, not a day's
            figure, and there is no purchase total: every value is dashed and every bar is empty. */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>Revenue, expense & purchase (daily)</Text>

          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Revenue</Text>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: 0, backgroundColor: adminColors.success.text }]} />
            </View>
            <Text style={styles.progressValue}>{ADMIN_NO_VALUE}</Text>
          </View>

          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Purchase</Text>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: 0, backgroundColor: adminColors.brand }]} />
            </View>
            <Text style={styles.progressValue}>{ADMIN_NO_VALUE}</Text>
          </View>

          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Expense</Text>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: 0, backgroundColor: adminColors.warning.text }]} />
            </View>
            <Text style={styles.progressValue}>{ADMIN_NO_VALUE}</Text>
          </View>
        </View>

        {/* 5. Payment Status. Revenue holds PAID orders only, so its count is "Collected"; pending and
            failed have no source. A bar width would be a ratio computed here, so the bars stay empty. */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>Payment status (statuses the records carry)</Text>

          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Collected</Text>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: 0, backgroundColor: adminColors.success.text }]} />
            </View>
            <Text style={styles.progressValue}>{collectedCountText}</Text>
          </View>

          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Pending</Text>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: 0, backgroundColor: adminColors.warning.text }]} />
            </View>
            <Text style={styles.progressValue}>{ADMIN_NO_VALUE}</Text>
          </View>

          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Failed</Text>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: 0, backgroundColor: adminColors.danger.text }]} />
            </View>
            <Text style={styles.progressValue}>{ADMIN_NO_VALUE}</Text>
          </View>
        </View>

        {/* 6. By Warehouse: every warehouse the server lists; the finance reports take no warehouse, so no per-warehouse figure. */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>By warehouse</Text>
          {warehousesQuery.isPending ? (
            <AdminLoadingState />
          ) : warehousesQuery.error ? (
            <AdminErrorState error={warehousesQuery.error} onRetry={() => void warehousesQuery.refetch()} />
          ) : warehouses.length === 0 ? (
            <AdminEmptyState title={t('wiringFinance.warehouses.empty')} />
          ) : (
            <View style={styles.warehouseCard}>
              {warehouses.map((wh, idx) => (
                <React.Fragment key={wh.id}>
                  {idx > 0 && <View style={styles.cardDivider} />}
                  <View style={styles.warehouseRow}>
                    <Text style={styles.warehouseName}>{wh.name}</Text>
                    <Text style={styles.warehouseValue}>{ADMIN_NO_VALUE}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          )}
        </View>

        {/* 7. Recent Transactions: the newest completed paid orders. A revenue row has no order number,
            so its UUID is never shown in that slot (R9). */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>Recent transactions</Text>

          {recentQuery.isPending ? (
            <AdminLoadingState />
          ) : recentQuery.error ? (
            <AdminErrorState error={recentQuery.error} onRetry={() => void recentQuery.refetch()} />
          ) : recent.length === 0 ? (
            <AdminEmptyState title={t('wiringFinance.flow.recentEmpty')} />
          ) : (
            recent.map((item: FinanceRevenueItemDto) => {
              const tone = paymentTone(item.paymentStatus);
              return (
                <View key={item.orderId} style={styles.txCard}>
                  <View style={styles.txHeaderRow}>
                    <Text style={styles.txTitle}>{t('wiringFinance.flow.txTitle', { number: ADMIN_NO_VALUE, channel: item.channel })}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: tone.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: tone.text }]}>{item.paymentStatus}</Text>
                    </View>
                  </View>
                  <Text style={styles.txSubtext}>
                    {t('wiringFinance.flow.txSubtext', {
                      amount: moneyText(item.totalAmount),
                      method: item.paymentMethod,
                      date: formatAdminDay(item.completedAt) || ADMIN_NO_VALUE,
                    })}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        {/* 8. Go to Grid (Rendered cleanly with reusable OverviewActionCard) */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>Go to</Text>
          <OverviewCardsGrid>
            <OverviewActionCard
              title="Profit & loss"
              icon={<GoToProfitLossIcon size={24} color={adminColors.brand} />}
              onPress={() => setSubScreen('profitLoss')}
            />
            <OverviewActionCard
              title="Sales Income & Revenue"
              icon={<GoToSalesIncomeIcon size={24} color={adminColors.brand} />}
              onPress={() => setSubScreen('salesIncome')}
            />
            <OverviewActionCard
              title="Expenses"
              icon={<GoToExpensesIcon size={24} color={adminColors.brand} />}
              onPress={() => setSubScreen('expenses')}
            />
            <OverviewActionCard
              title="Purchase & Sales"
              icon={<GoToPurchaseSalesIcon size={24} color={adminColors.brand} />}
              onPress={() => setSubScreen('purchaseSales')}
            />
            <OverviewActionCard
              title="Dues & Payouts"
              icon={<GoToDuesPayoutsIcon size={24} color={adminColors.brand} />}
              onPress={() => setSubScreen('duesPayouts')}
            />
            <OverviewActionCard
              title="Customer Wallet"
              icon={<GoToCustomerWalletIcon size={24} color={adminColors.brand} />}
              onPress={() => setSubScreen('customerWallet')}
            />
            <OverviewActionCard
              title="Create or View Invoice"
              icon={<GoToInvoiceIcon size={24} color={adminColors.brand} />}
              onPress={() => setSubScreen('invoicesGst')}
            />
            <OverviewActionCard
              title="Review Returns"
              icon={<GoToReviewReturnsIcon size={24} color={adminColors.brand} />}
              onPress={() => setSubScreen('reviewReturns')}
            />
            <OverviewActionCard
              title="Payout Transactions list"
              icon={<GoToPayoutTransactionsIcon size={24} color={adminColors.brand} />}
              onPress={() => setSubScreen('payoutTransactions')}
            />
            <OverviewActionCard
              title="Payout Batch list"
              icon={<GoToPayoutBatchIcon size={24} color={adminColors.brand} />}
              onPress={() => setSubScreen('payoutBatch')}
            />
            <OverviewActionCard
              title="Transaction History"
              icon={<GoToTransactionHistoryIcon size={24} color={adminColors.brand} />}
              onPress={() => setSubScreen('transactionHistory')}
            />
            <OverviewActionCard
              title="Report & Export"
              icon={<GoToReportExportIcon size={24} color={adminColors.brand} />}
              onPress={() => setSubScreen('reportExport')}
            />
            {canConfigurePayments && (
              <OverviewActionCard
                title="Payment methods"
                icon={<GoToPaymentMethodsIcon size={24} color={adminColors.brand} />}
                onPress={() => setSubScreen('paymentMethods')}
              />
            )}
          </OverviewCardsGrid>
        </View>

        <View style={{ height: adminSpacing.xxl }} />
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter Accounts & Finance</Text>
            <Text style={styles.modalSubtitle}>Select date range to update reporting view:</Text>
            <View style={styles.modalOptions}>
              {(['last7', 'last30'] as const).map((key) => (
                <TouchableOpacity
                  key={key}
                  style={styles.modalOptionBtn}
                  onPress={() => {
                    setRangeKey(key);
                    setShowFilterModal(false);
                  }}
                  testID={`finance.flow.range.${key}`}
                >
                  <Text style={styles.modalOptionText}>{t(`wiringFinance.flow.range.${key}`)}</Text>
                </TouchableOpacity>
              ))}
              {/* Quarter and financial-year spans are the owner's call (calendar vs fiscal, which year):
                  drawn, not selectable, never sent. */}
              {(['This Quarter', 'FY 2026-27'] as const).map((label) => (
                <TouchableOpacity
                  key={label}
                  style={[styles.modalOptionBtn, styles.actionUnavailable]}
                  disabled
                  accessibilityRole="button"
                  accessibilityState={{ disabled: true }}
                >
                  <Text style={styles.modalOptionText}>{label}</Text>
                </TouchableOpacity>
              ))}
              <Text style={styles.noteText}>{t('wiringFinance.flow.rangeUnavailable')}</Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.md,
    paddingHorizontal: adminSpacing.md,
    borderBottomLeftRadius: adminRadius.xl,
    borderBottomRightRadius: adminRadius.xl,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
  },
  backBtn: {
    padding: adminSpacing.xs,
    marginRight: 2,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  headerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
  },
  headerPillBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: adminOverlay.whitePill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitle: {
    ...adminType.caption,
    color: adminColors.onBrand,
    opacity: 0.9,
    marginTop: adminSpacing.xs,
  },
  toast: {
    backgroundColor: adminColors.success.bg,
    borderColor: adminColors.success.border,
    borderWidth: 1,
    borderRadius: adminRadius.md,
    padding: adminSpacing.sm,
    marginHorizontal: adminSpacing.md,
    marginTop: adminSpacing.sm,
  },
  toastText: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.success.text,
    textAlign: 'center',
  },
  subheaderRow: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
  },
  lastUpdated: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  noteBox: {
    marginHorizontal: adminSpacing.md,
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.xs,
  },
  noteText: {
    ...adminType.caption,
    color: adminColors.muted,
    lineHeight: 15,
  },
  sectionBlock: {
    marginHorizontal: adminSpacing.md,
    marginTop: adminSpacing.lg,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: adminSpacing.sm,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: adminSpacing.sm,
  },
  progressLabel: {
    width: 70,
    ...adminType.caption,
    color: adminColors.ink,
    fontWeight: '500',
  },
  progressBarTrack: {
    flex: 1,
    height: 10,
    backgroundColor: adminColors.border,
    borderRadius: adminRadius.full,
    overflow: 'hidden',
    marginHorizontal: adminSpacing.sm,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: adminRadius.full,
  },
  progressValue: {
    width: 75,
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.ink,
    textAlign: 'right',
  },
  warehouseCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
  },
  warehouseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  warehouseName: {
    ...adminType.body,
    color: adminColors.ink,
  },
  warehouseValue: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  cardDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: adminSpacing.xs,
  },
  txCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.xs,
  },
  txHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  txTitle: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  txSubtext: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: adminRadius.xs,
  },
  statusBadgeText: {
    ...adminType.caption,
    fontWeight: '700',
  },
  actionCard: {
    width: '48%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 88,
  },
  actionIconWrap: {
    marginBottom: 4,
  },
  actionTitle: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.ink,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  modalContent: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.xl,
  },
  modalTitle: {
    ...adminType.title,
    color: adminColors.ink,
    marginBottom: adminSpacing.xs,
  },
  modalSubtitle: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.md,
  },
  modalOptions: {
    gap: adminSpacing.xs,
  },
  modalOptionBtn: {
    padding: adminSpacing.md,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.canvas,
  },
  modalOptionText: {
    ...adminType.body,
    fontWeight: '600',
    color: adminColors.ink,
  },
  /** The designed control, kept visible, drawn as unavailable (screens/community/ pattern). */
  actionUnavailable: {
    opacity: 0.5,
  },
});
