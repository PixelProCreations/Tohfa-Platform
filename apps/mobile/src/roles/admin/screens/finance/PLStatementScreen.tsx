import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import Svg, { Path } from 'react-native-svg';

import { getFinanceExpenseReport, getFinanceRevenueReport, type RevenueChannel } from '../../api/finance';
import { useAdminQuery } from '../../api/hooks';
import { t, type TranslationKey } from '../../i18n';
import { adminColors, adminOverlay, adminType } from '../../theme';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { moneyText } from '../dashboard/saOverviewFormat';
import { istToday } from '../warehouse/finance-expenses/mappers';
import { reportRange } from '../warehouse/finance-expenses/reportRanges';
import { AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';

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
  primary:       adminColors.brand,
  brandRust:     adminColors.brandDeep,
  pageBg:        adminColors.canvas,
  cardBg:        adminColors.card,
  ink:           adminColors.ink,
  labelMuted:    adminColors.muted,
  border:        adminColors.border,
  borderLight:   adminColors.border,
  
  revenueBg:     adminColors.success.bg,
  revenueBorder: adminColors.success.bg,
  revenueText:   adminColors.success.text,
  revenuePillBg: adminColors.success.bg,
  
  expenseBg:     adminColors.danger.bg,
  expenseBorder: adminColors.danger.bg,
  expenseText:   adminColors.danger.text,
  expensePillBg: adminColors.danger.bg,
  
  profitCardBg:  adminColors.brandTint,
  profitBorder:  adminColors.border,
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function BackChevronIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 19l-7-7 7-7"
        stroke={PALETTE.brandRust}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ExportDocIcon({ color = adminColors.onBrand }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export interface PLStatementScreenProps {
  onBack: () => void;
  onExportPdf?: () => void;
}

/**
 * P&L report for the month to date (the design's "MTD" period). Every figure
 * is a raw server aggregate from GET /admin/finance/reports/{revenue,expenses}
 * (BR-63 clause 5): nothing is added, subtracted or divided on the phone, so
 * shares, month-on-month growth, a two-channel total, net profit and margin
 * are dashed (R6). There is no P&L export endpoint, so the export is drawn
 * unavailable (R3).
 */
export function PLStatementScreen({
  onBack,
}: PLStatementScreenProps) {
  const range = reportRange('monthToDate', istToday());
  const revenueQuery = useAdminQuery(['admin', 'finance', 'revenue-report', range.from, range.to], (signal) =>
    getFinanceRevenueReport(range, signal),
  );
  const expenseQuery = useAdminQuery(['admin', 'finance', 'expense-report', range.from, range.to], (signal) =>
    getFinanceExpenseReport(range, signal),
  );

  const channelTotal = (channel: RevenueChannel) =>
    moneyText(revenueQuery.data?.byChannel.find((c) => c.channel === channel)?.total);
  const categoryTotal = (category: string) => {
    const total = expenseQuery.data?.byCategory.find((c) => c.category === category)?.total;
    return total === undefined ? ADMIN_NO_VALUE : t('wiringFinance.pl.outflow', { amount: moneyText(total) });
  };
  const month = monthLabel(range.from);
  const error = revenueQuery.error ?? expenseQuery.error;

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
        <Text style={styles.screenTitle}>P&L Report</Text>
        <Text style={styles.screenSub}>{t('wiringFinance.pl.subtitle', { month })}</Text>

        {revenueQuery.isPending || expenseQuery.isPending ? (
          <AdminLoadingState />
        ) : error ? (
          <AdminErrorState
            error={error}
            onRetry={() => {
              void revenueQuery.refetch();
              void expenseQuery.refetch();
            }}
          />
        ) : (
          /* Primary Report Card */
          <View style={styles.statementCard}>
            {/* Revenue Section */}
            <View style={styles.sectionHeaderRow}>
              <View style={styles.revenuePill}>
                <Text style={styles.revenuePillText}>REVENUE STREAMS REPORT</Text>
              </View>
              <Text style={styles.periodText}>{t('wiringFinance.pl.revenuePeriod', { month, growth: ADMIN_NO_VALUE })}</Text>
            </View>

            <View style={styles.lineRow}>
              <View style={styles.lineLabelCol}>
                <Text style={styles.lineLabel}>Revenue — Online</Text>
                <Text style={styles.lineSubLabel}>{t('wiringFinance.pl.onlineSub', { share: ADMIN_NO_VALUE })}</Text>
              </View>
              <Text style={styles.lineValue}>{channelTotal('ONLINE')}</Text>
            </View>

            <View style={styles.lineRow}>
              <View style={styles.lineLabelCol}>
                <Text style={styles.lineLabel}>Revenue — Live Market</Text>
                <Text style={styles.lineSubLabel}>{t('wiringFinance.pl.marketSub', { share: ADMIN_NO_VALUE })}</Text>
              </View>
              <Text style={styles.lineValue}>{channelTotal('MARKET')}</Text>
            </View>

            {/* HORECA and B2B arrive as two channel totals; one row would need them added on the phone. */}
            <View style={styles.lineRow}>
              <View style={styles.lineLabelCol}>
                <Text style={styles.lineLabel}>Revenue — Horeca / B2B</Text>
                <Text style={styles.lineSubLabel}>{t('wiringFinance.pl.horecaSub', { share: ADMIN_NO_VALUE })}</Text>
              </View>
              <Text style={styles.lineValue}>{ADMIN_NO_VALUE}</Text>
            </View>

            {/* Total Revenue Highlight: the server's summary total. */}
            <View style={styles.totalRevenueBox}>
              <Text style={styles.totalRevenueLabel}>Total Revenue</Text>
              <Text style={styles.totalRevenueVal}>{moneyText(revenueQuery.data?.summary.total)}</Text>
            </View>

            <View style={styles.sectionDivider} />

            {/* Expenses Section */}
            <View style={styles.sectionHeaderRow}>
              <View style={styles.expensePill}>
                <Text style={styles.expensePillText}>EXPENDITURES & OUTFLOW REPORT</Text>
              </View>
              <Text style={styles.periodText}>{t('wiringFinance.pl.expensePeriod', { share: ADMIN_NO_VALUE })}</Text>
            </View>

            {/* Farmer payouts are not in the expense report; no source, so dashed. */}
            <View style={styles.lineRow}>
              <View style={styles.lineLabelCol}>
                <Text style={styles.lineLabel}>Farmer Payouts</Text>
                <Text style={styles.lineSubLabel}>{t('wiringFinance.pl.payoutsSub', { share: ADMIN_NO_VALUE })}</Text>
              </View>
              <Text style={styles.expenseVal}>{ADMIN_NO_VALUE}</Text>
            </View>

            <View style={styles.lineRow}>
              <View style={styles.lineLabelCol}>
                <Text style={styles.lineLabel}>Warehouse Operations</Text>
                <Text style={styles.lineSubLabel}>{t('wiringFinance.pl.warehouseOpsSub', { share: ADMIN_NO_VALUE })}</Text>
              </View>
              <Text style={styles.expenseVal}>{categoryTotal('Warehouse Operations')}</Text>
            </View>

            <View style={styles.lineRow}>
              <View style={styles.lineLabelCol}>
                <Text style={styles.lineLabel}>Staff & Payroll</Text>
                <Text style={styles.lineSubLabel}>{t('wiringFinance.pl.payrollSub', { share: ADMIN_NO_VALUE })}</Text>
              </View>
              <Text style={styles.expenseVal}>{ADMIN_NO_VALUE}</Text>
            </View>

            {/* Total Expenses: the expense report leaves out farmer payouts, so it is not this total (R5). */}
            <View style={styles.totalExpensesBox}>
              <Text style={styles.totalExpensesLabel}>Total Expenses</Text>
              <Text style={styles.totalExpensesVal}>{ADMIN_NO_VALUE}</Text>
            </View>

            <View style={styles.sectionDivider} />

            {/* Net Profit Highlight Banner: never computed on the phone (BR-63, R6). */}
            <View style={styles.netProfitContainer}>
              <View>
                <Text style={styles.netProfitSub}>NET PROFIT (EBITDA) REPORT</Text>
                <Text style={styles.netProfitVal}>{ADMIN_NO_VALUE}</Text>
              </View>
              <View style={styles.marginBadge}>
                <Text style={styles.marginBadgeText}>{t('wiringFinance.pl.margin', { margin: ADMIN_NO_VALUE })}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Export Button: no P&L export endpoint under /admin/exports/*, so drawn unavailable (R3). */}
        <TouchableOpacity
          style={[styles.exportBtn, styles.actionUnavailable]}
          disabled
          activeOpacity={1}
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
          testID="finance.plStatement.export"
        >
          <ExportDocIcon color={adminColors.onBrand} />
          <Text style={styles.exportBtnText}>Export P&L Report (PDF)</Text>
        </TouchableOpacity>
        <Text style={styles.unavailableNote}>{t('wiringFinance.pl.exportUnavailable')}</Text>

        <View style={{ height: 32 }} />
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
    color: PALETTE.brandRust,
    letterSpacing: -0.3,
  },
  screenSub: {
    fontSize: 13,
    fontWeight: '400',
    color: PALETTE.labelMuted,
    marginTop: 4,
    marginBottom: 20,
  },
  statementCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 16,
    shadowColor: adminColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  revenuePill: {
    backgroundColor: PALETTE.revenuePillBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  revenuePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: PALETTE.revenueText,
    letterSpacing: 0.5,
  },
  expensePill: {
    backgroundColor: PALETTE.expensePillBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  expensePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: PALETTE.expenseText,
    letterSpacing: 0.5,
  },
  periodText: {
    fontSize: 11,
    fontWeight: '500',
    color: PALETTE.labelMuted,
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.borderLight,
  },
  lineLabelCol: {
    flex: 1,
    marginRight: 10,
  },
  lineLabel: {
    fontSize: 13,
    color: PALETTE.ink,
    fontWeight: '600',
  },
  lineSubLabel: {
    fontSize: 11,
    color: PALETTE.labelMuted,
    marginTop: 2,
  },
  lineValue: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  totalRevenueBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: PALETTE.revenueBg,
    borderWidth: 1,
    borderColor: PALETTE.revenueBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
  },
  totalRevenueLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.revenueText,
  },
  totalRevenueVal: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.revenueText,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: PALETTE.border,
    marginVertical: 16,
  },
  expenseVal: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.expenseText,
  },
  totalExpensesBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: PALETTE.expenseBg,
    borderWidth: 1,
    borderColor: PALETTE.expenseBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
  },
  totalExpensesLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.expenseText,
  },
  totalExpensesVal: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.expenseText,
  },
  netProfitContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: PALETTE.profitCardBg,
    borderWidth: 1,
    borderColor: PALETTE.profitBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  netProfitSub: {
    fontSize: 11,
    fontWeight: '800',
    color: PALETTE.brandRust,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  netProfitVal: {
    fontSize: 20,
    fontWeight: '900',
    color: PALETTE.revenueText,
    letterSpacing: -0.3,
  },
  marginBadge: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: PALETTE.revenueBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  marginBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.revenueText,
  },
  exportBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: PALETTE.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  exportBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: adminColors.onBrand,
  },

  // Modal / Popup Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 24,
    alignItems: 'center',
    shadowColor: adminColors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: adminColors.success.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.ink,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalBody: {
    fontSize: 13,
    color: PALETTE.labelMuted,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  modalBtn: {
    backgroundColor: PALETTE.primary,
    width: '100%',
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  /** The designed control, kept visible, drawn as unavailable (screens/community/ pattern). */
  actionUnavailable: {
    opacity: 0.5,
  },
  unavailableNote: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 8,
    textAlign: 'center',
  },
});
