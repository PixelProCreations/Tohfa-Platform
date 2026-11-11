import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import {
  OverviewActionCard,
  OverviewCardsGrid,
  OverviewDashboardCard,
} from '../../components/OverviewDashboardCard';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../theme';
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

export type FinanceSubScreen =
  | 'overview'
  | 'profitLoss'
  | 'salesIncome'
  | 'salesOverview'
  | 'expenses'
  | 'expensesBreakdown'
  | 'purchaseSales'
  | 'duesPayouts'
  | 'customerWallet'
  | 'walletDeduction'
  | 'invoicesGst'
  | 'reviewReturns'
  | 'transactionHistory'
  | 'reportExport'
  | 'paymentMethods';

export interface FinanceManagementFlowProps {
  role?: 'SUPER_ADMIN' | 'TOHFA_ADMIN';
  can?: (perm: string) => boolean;
  initialSubScreen?: FinanceSubScreen;
  showBackButton?: boolean;
  onBack: () => void;
  onTabChange?: (tab: string) => void;
}

export function FinanceManagementFlow({
  role = 'SUPER_ADMIN',
  can = () => true,
  initialSubScreen = 'overview',
  showBackButton = false,
  onBack,
  onTabChange,
}: FinanceManagementFlowProps) {
  const [subScreen, setSubScreen] = useState<FinanceSubScreen>(initialSubScreen);
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [showExportToast, setShowExportToast] = useState<boolean>(false);

  // RBAC checks
  const canConfigurePayments = can('payment.method.configure') || role === 'SUPER_ADMIN';

  // Subscreen routers
  if (subScreen === 'profitLoss') {
    return <ProfitLossScreen onBack={() => setSubScreen('overview')} can={can} />;
  }

  if (subScreen === 'walletDeduction') {
    return (
      <WalletDeductionFlow
        onBack={() => setSubScreen('customerWallet')}
        onSuccess={() => setSubScreen('customerWallet')}
        role={role}
      />
    );
  }

  if (subScreen === 'paymentMethods') {
    return <PaymentMethodsScreen onBack={() => setSubScreen('overview')} can={can} />;
  }

  if (subScreen === 'customerWallet') {
    return (
      <WalletFlow
        scope={{ warehouseId: undefined, warehouseName: 'All Warehouses' }}
        can={can}
        initialScreen="CustomerWallet"
        onBack={() => setSubScreen('overview')}
        onDeductMoney={() => setSubScreen('walletDeduction')}
      />
    );
  }

  if (subScreen === 'purchaseSales') {
    return (
      <SalesFlow
        scope={{ warehouseId: undefined, warehouseName: undefined }}
        can={can}
        role={role}
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
    return <SalesIncomeRevenueScreen onBack={() => setSubScreen('overview')} />;
  }

  if (subScreen === 'expenses') {
    return (
      <FinanceFlow
        scope={{ warehouseId: 'WH-COON', warehouseName: 'Coonoor Warehouse' }}
        can={can}
        initialScreen="Expenses"
        onBack={() => setSubScreen('overview')}
      />
    );
  }

  if (subScreen === 'invoicesGst') {
    return <InvoicesGstBillingScreen onBack={() => setSubScreen('overview')} />;
  }

  if (subScreen === 'reviewReturns') {
    return <ReturnsRmaRefundsScreen can={can} onBack={() => setSubScreen('overview')} />;
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
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} translucent={false} />
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
              <TouchableOpacity
                style={styles.headerPillBtn}
                onPress={() => {
                  setShowExportToast(true);
                  setTimeout(() => setShowExportToast(false), 2500);
                }}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Download finance report"
              >
                <DownloadWhiteIcon size={18} color={adminColors.onBrand} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>Last 30 Days</Text>
        </View>

        {showExportToast && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>✓ Finance report export initiated</Text>
          </View>
        )}

        {/* 2. Subheader */}
        <View style={styles.subheaderRow}>
          <Text style={styles.lastUpdated}>Last updated 14 Oct 2026, 06:00</Text>
        </View>

        {/* 3. 8 KPI Cards (Exact reference mockup Image 1: value on top, icon badge on top right, title at bottom) */}
        <OverviewCardsGrid style={{ paddingHorizontal: adminSpacing.md, rowGap: 10 }}>
          <OverviewDashboardCard
            title="Sales"
            value="₹2,14,600.00"
            icon="card"
            preserveCase
            onPress={() => setSubScreen('salesIncome')}
          />
          <OverviewDashboardCard
            title="Farmer Purchase Value"
            value="₹1,38,900.00"
            icon="truck"
            preserveCase
            onPress={() => setSubScreen('purchaseSales')}
          />
          <OverviewDashboardCard
            title="Outstanding Dues"
            value="₹32,450.00"
            icon="invoice"
            preserveCase
            onPress={() => setSubScreen('duesPayouts')}
          />
          <OverviewDashboardCard
            title="Expenses"
            value="₹18,200.00"
            icon="wallet"
            preserveCase
            onPress={() => setSubScreen('expenses')}
          />
          <OverviewDashboardCard
            title="Wallet Liability"
            value="₹9,340.00"
            icon="wallet"
            preserveCase
            onPress={() => setSubScreen('customerWallet')}
          />
          <OverviewDashboardCard
            title="Pending Payouts"
            value="6"
            icon="payout"
            preserveCase
            onPress={() => setSubScreen('duesPayouts')}
          />
          <OverviewDashboardCard
            title="Refunds"
            value="₹1,840.00"
            icon="alert"
            preserveCase
            onPress={() => setSubScreen('reviewReturns')}
          />
          <OverviewDashboardCard
            title="Net Financial Summary"
            value="₹3,840.00"
            icon="clipboard"
            preserveCase
            onPress={() => setSubScreen('profitLoss')}
          />
        </OverviewCardsGrid>

        {/* Helper Note directly on canvas */}
        <View style={styles.noteBox}>
          <Text style={styles.noteText}>
            No profit figure is calculated: expenses can't simply be subtracted from sales until the formula is finance-owner approved.
          </Text>
        </View>

        {/* 4. Daily Bars (Revenue, Expense & Purchase) */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>Revenue, expense & purchase (daily)</Text>

          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Revenue</Text>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: '85%', backgroundColor: adminColors.success.text }]} />
            </View>
            <Text style={styles.progressValue}>₹2,14,600</Text>
          </View>

          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Purchase</Text>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: '55%', backgroundColor: adminColors.brand }]} />
            </View>
            <Text style={styles.progressValue}>₹1,38,900</Text>
          </View>

          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Expense</Text>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: '15%', backgroundColor: adminColors.warning.text }]} />
            </View>
            <Text style={styles.progressValue}>₹18,200</Text>
          </View>
        </View>

        {/* 5. Payment Status */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>Payment status (statuses the records carry)</Text>

          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Collected</Text>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: '82%', backgroundColor: adminColors.success.text }]} />
            </View>
            <Text style={styles.progressValue}>18</Text>
          </View>

          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Pending</Text>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: '23%', backgroundColor: adminColors.warning.text }]} />
            </View>
            <Text style={styles.progressValue}>5</Text>
          </View>

          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Failed</Text>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: '6%', backgroundColor: adminColors.danger.text }]} />
            </View>
            <Text style={styles.progressValue}>1</Text>
          </View>
        </View>

        {/* 6. By Warehouse */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>By warehouse</Text>
          <View style={styles.warehouseCard}>
            <View style={styles.warehouseRow}>
              <Text style={styles.warehouseName}>Main Warehouse, Ooty</Text>
              <Text style={styles.warehouseValue}>₹1,20,400.00</Text>
            </View>
            <View style={styles.cardDivider} />
            <View style={styles.warehouseRow}>
              <Text style={styles.warehouseName}>Coonoor</Text>
              <Text style={styles.warehouseValue}>₹58,200.00</Text>
            </View>
            <View style={styles.cardDivider} />
            <View style={styles.warehouseRow}>
              <Text style={styles.warehouseName}>Kotagiri / Gudalur</Text>
              <Text style={styles.warehouseValue}>₹36,000.00</Text>
            </View>
          </View>
        </View>

        {/* 7. Recent Transactions */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>Recent transactions</Text>

          <View style={styles.txCard}>
            <View style={styles.txHeaderRow}>
              <Text style={styles.txTitle}>SO-0013 · Sale</Text>
              <View style={[styles.statusBadge, { backgroundColor: adminColors.success.bg }]}>
                <Text style={[styles.statusBadgeText, { color: adminColors.success.text }]}>Collected</Text>
              </View>
            </View>
            <Text style={styles.txSubtext}>₹12,560.00 · Nilgiri Fresh Traders · 1 Oct 2026</Text>
          </View>

          <View style={styles.txCard}>
            <View style={styles.txHeaderRow}>
              <Text style={styles.txTitle}>PY-0005 · Payout</Text>
              <View style={[styles.statusBadge, { backgroundColor: adminColors.danger.bg }]}>
                <Text style={[styles.statusBadgeText, { color: adminColors.danger.text }]}>Failed</Text>
              </View>
            </View>
            <Text style={styles.txSubtext}>₹3,300.00 · Kumar · 6 Oct 2026</Text>
          </View>
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
              {['Last 7 Days', 'Last 30 Days', 'This Quarter', 'FY 2026-27'].map((range) => (
                <TouchableOpacity
                  key={range}
                  style={styles.modalOptionBtn}
                  onPress={() => setShowFilterModal(false)}
                >
                  <Text style={styles.modalOptionText}>{range}</Text>
                </TouchableOpacity>
              ))}
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
    fontSize: 18,
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
    fontSize: 11,
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
    fontSize: 10,
    fontWeight: '700',
  },
  goToGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.sm,
  },
  goToCard: {
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
  goToCardTitle: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.ink,
    marginTop: 6,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
});

