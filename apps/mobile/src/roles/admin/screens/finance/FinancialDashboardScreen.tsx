import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import Svg, { Path, Rect } from 'react-native-svg';

import { getFinanceExpenseReport } from '../../api/finance';
import { useAdminQuery } from '../../api/hooks';
import { listPayoutDues } from '../../api/payoutDues';
import { OverviewCardsGrid, OverviewDashboardCard } from '../../components/OverviewDashboardCard';
import { t, type TranslationKey } from '../../i18n';
import { adminColors, adminOverlay } from '../../theme';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { moneyText } from '../dashboard/saOverviewFormat';
import { istToday } from '../warehouse/finance-expenses/mappers';
import { reportRange } from '../warehouse/finance-expenses/reportRanges';

/** "Nov 2026" for a YYYY-MM-DD day, through the admin month names. */
function monthLabel(day: string): string {
  const [year, month] = day.split('-');
  return t('wiringFinance.monthYear', {
    month: t(`datetime.month.${(month ?? '').replace(/^0/, '')}` as TranslationKey),
    year: year ?? ADMIN_NO_VALUE,
  });
}

// ─── Design Tokens ────────────────────────────────────────────────────────────
const PALETTE = {
  titleRust:     adminColors.brandDeep,
  orange:        adminColors.brand,
  heroBg:        adminColors.brandDeep,
  pageBg:        adminColors.canvas,
  cardBg:        adminColors.card,
  ink:           adminColors.ink,
  labelMuted:    adminColors.muted,
  border:        adminColors.border,
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function BackChevronIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 19l-7-7 7-7"
        stroke={adminColors.ink}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BarChartIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 20V10M12 20V4M6 20v-6"
        stroke={adminColors.ink}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WalletIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"
        stroke={adminColors.ink}
        strokeWidth="2"
      />
      <Path
        d="M16 3H4a2 2 0 0 0-2 2v2M18 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"
        stroke={adminColors.ink}
        strokeWidth="2"
      />
    </Svg>
  );
}

function DocumentIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={adminColors.ink}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6" stroke={adminColors.ink} strokeWidth="2" />
    </Svg>
  );
}

function LedgerIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="3" width="16" height="18" rx="2" stroke={adminColors.ink} strokeWidth="2" />
      <Path d="M8 7h8M8 11h8M8 15h5" stroke={adminColors.ink} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Component Props ──────────────────────────────────────────────────────────
export interface FinancialDashboardScreenProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  title?: string;
  subtitle?: string;
}

/**
 * Finance overview for the current month. The hero card is labelled MTD, so
 * the expense report is asked for the 1st of this month to today (BR-63
 * reports need real YYYY-MM-DD dates). Revenue from the API is gross, so the
 * "Net Revenue" figure is dashed (R5); profit and margin would be computed on
 * the phone, so they are dashed too (BR-63 clause 5, R6).
 */
export function FinancialDashboardScreen({
  onBack,
  onNavigate,
  title = 'Financial Dashboard',
  subtitle,
}: FinancialDashboardScreenProps) {
  const range = reportRange('monthToDate', istToday());
  const expenseReport = useAdminQuery(['admin', 'finance', 'expense-report', range.from, range.to], (signal) =>
    getFinanceExpenseReport(range, signal),
  );
  // Payout dues totals cover every due, whatever page is asked for; one row is enough.
  const dues = useAdminQuery(['admin', 'payout-dues', 'totals'], (signal) => listPayoutDues({ limit: 1 }, signal));

  const expensesText = moneyText(expenseReport.data?.summary.total);
  const duesPendingText = moneyText(dues.data?.totals.totalDue);

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button First */}
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <BackChevronIcon />
        </TouchableOpacity>

        {/* Heading Next */}
        <Text style={styles.screenTitle}>{title}</Text>
        <Text style={styles.screenSub}>
          {subtitle ?? t('wiringFinance.dashboard.subtitle', { month: monthLabel(range.from) })}
        </Text>

        {/* Hero Card: Net Revenue (MTD) */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Net Revenue (MTD)</Text>
          <Text style={styles.heroAmount}>{ADMIN_NO_VALUE}</Text>

          <View style={styles.heroDivider} />

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatCol}>
              <Text style={styles.heroStatLabel}>Expenses</Text>
              <Text style={styles.heroStatValue}>{expensesText}</Text>
            </View>

            <View style={styles.heroStatCol}>
              <Text style={styles.heroStatLabel}>Net Profit</Text>
              <Text style={styles.heroStatValue}>{ADMIN_NO_VALUE}</Text>
            </View>

            <View style={styles.heroStatCol}>
              <Text style={styles.heroStatLabel}>Margin</Text>
              <Text style={styles.heroStatValue}>{ADMIN_NO_VALUE}</Text>
            </View>
          </View>
        </View>

        {/* 2 Summary Overview Cards (origin/Superadmin-main). Nothing awaits approval (BR-62), so that count is dashed. */}
        <OverviewCardsGrid style={styles.overviewGrid}>
          <OverviewDashboardCard
            value={duesPendingText}
            title="Farmer Dues Pending"
            subtitle="Pending clearance"
            icon="cash"
            titlePosition="bottom"
          />
          <OverviewDashboardCard
            value={ADMIN_NO_VALUE}
            title="Expenses Pending"
            subtitle="Awaiting approval"
            icon="clipboard"
            tone="warning"
            titlePosition="bottom"
          />
        </OverviewCardsGrid>

        {/* 4 Navigation Cards */}
        <View style={styles.navActionsCol}>
          <TouchableOpacity
            style={styles.navCard}
            onPress={() => onNavigate('PLStatement')}
            activeOpacity={0.75}
          >
            <BarChartIcon />
            <Text style={styles.navCardText}>View P&L Report</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navCard}
            onPress={() => onNavigate('FarmerPayoutDues')}
            activeOpacity={0.75}
          >
            <WalletIcon />
            <Text style={styles.navCardText}>Farmer Payout Dues</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navCard}
            onPress={() => onNavigate('Expenses')}
            activeOpacity={0.75}
          >
            <DocumentIcon />
            <Text style={styles.navCardText}>Expenses</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navCard}
            onPress={() => onNavigate('GSTAccounting')}
            activeOpacity={0.75}
          >
            <LedgerIcon />
            <Text style={styles.navCardText}>GST & Accounting</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: adminColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: PALETTE.titleRust,
    letterSpacing: -0.3,
  },
  screenSub: {
    fontSize: 13,
    fontWeight: '400',
    color: PALETTE.labelMuted,
    marginTop: 4,
    marginBottom: 20,
  },
  heroCard: {
    backgroundColor: PALETTE.heroBg,
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    shadowColor: adminColors.brandDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: adminColors.onBrand,
    opacity: 0.9,
    marginBottom: 6,
  },
  heroAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: adminColors.onBrand,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  heroDivider: {
    height: 1,
    backgroundColor: adminOverlay.whitePill,
    marginBottom: 14,
  },
  heroStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroStatCol: {
    flex: 1,
  },
  heroStatLabel: {
    fontSize: 11,
    color: adminColors.onBrand,
    opacity: 0.85,
    marginBottom: 3,
  },
  heroStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  overviewGrid: {
    marginBottom: 20,
  },
  miniCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  miniCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    shadowColor: adminColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  miniIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  miniVal: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.ink,
    marginBottom: 4,
  },
  miniLabel: {
    fontSize: 12,
    color: PALETTE.labelMuted,
    lineHeight: 16,
  },
  navActionsCol: {
    gap: 10,
  },
  navCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: adminColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  navCardText: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.ink,
  },
});
