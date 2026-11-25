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

import { listExpenses, listFinanceRevenue, type ExpenseDto, type FinanceRevenueItemDto } from '../../api/finance';
import { useAdminQuery } from '../../api/hooks';
import { t } from '../../i18n';
import { adminColors } from '../../theme';
import { formatAdminDay, istDay } from '../../utils/datetime';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { moneyText } from '../dashboard/saOverviewFormat';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';

/** One page of each source: the recent entries, not the whole ledger. */
const LEDGER_PAGE = 25;

// ─── Design Tokens ────────────────────────────────────────────────────────────
const PALETTE = {
  titleRust:     adminColors.brandDeep,
  orange:        adminColors.brand,
  pageBg:        adminColors.canvas,
  cardBg:        adminColors.card,
  ink:           adminColors.ink,
  labelMuted:    adminColors.muted,
  border:        adminColors.border,
  creditGreen:   adminColors.success.text,
  debitRed:      adminColors.danger.text,
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

function PlusIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5v14M5 12h14"
        stroke={adminColors.onBrand}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

interface LedgerEntry {
  id: string;
  /** Sort key: the IST day the entry belongs to (YYYY-MM-DD). */
  day: string;
  dateText: string;
  description: string;
  accountHead: string;
  type: 'CREDIT' | 'DEBIT';
  amountText: string;
}

/**
 * The recent entries: one page of revenue (completed paid orders, BR-63) and
 * one page of recorded expenses (BR-62), newest first. There is no general
 * ledger endpoint, so there is no running or closing balance to show (brief
 * 07 R6): those figures are dashed rather than computed on the phone.
 */
function ledgerEntries(revenue: FinanceRevenueItemDto[], expenses: ExpenseDto[]): LedgerEntry[] {
  const rows: LedgerEntry[] = [
    ...revenue.map((r) => ({
      id: `rev-${r.orderId}`,
      day: istDay(new Date(r.completedAt)),
      dateText: formatAdminDay(r.completedAt) || ADMIN_NO_VALUE,
      // The revenue row carries no order number; its UUID is never shown in its place (R9).
      description: t('wiringFinance.ledger.revenueEntry', { number: ADMIN_NO_VALUE, channel: r.channel }),
      accountHead: ADMIN_NO_VALUE,
      type: 'CREDIT' as const,
      amountText: moneyText(r.totalAmount),
    })),
    ...expenses.map((e) => ({
      id: `exp-${e.id}`,
      day: e.expenseDate,
      dateText: formatAdminDay(e.expenseDate) || ADMIN_NO_VALUE,
      description: e.description ?? ADMIN_NO_VALUE,
      accountHead: e.category,
      type: 'DEBIT' as const,
      amountText: moneyText(e.amount),
    })),
  ];
  return rows.sort((a, b) => b.day.localeCompare(a.day));
}

export interface BasicAccountingLedgerScreenProps {
  onBack: () => void;
  onNavigateToAddEntry?: () => void;
}

export function BasicAccountingLedgerScreen({
  onBack,
  onNavigateToAddEntry,
}: BasicAccountingLedgerScreenProps) {
  const expensesQuery = useAdminQuery(['admin', 'finance', 'ledger-expenses'], (signal) =>
    listExpenses({ limit: LEDGER_PAGE }, signal),
  );
  const revenueQuery = useAdminQuery(['admin', 'finance', 'ledger-revenue'], (signal) =>
    listFinanceRevenue({ limit: LEDGER_PAGE }, signal),
  );

  const isPending = expensesQuery.isPending || revenueQuery.isPending;
  const error = expensesQuery.error ?? revenueQuery.error;
  const entries = ledgerEntries(revenueQuery.data?.items ?? [], expensesQuery.data?.items ?? []);

  // Server totals over every row (summary), never a sum of the page shown (R4).
  const totalCredits = moneyText(revenueQuery.data?.summary.total);
  const totalDebits = moneyText(expensesQuery.data?.summary.total);

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
        <Text style={styles.screenTitle}>Accounting Ledger</Text>
        <Text style={styles.screenSub}>{t('wiringFinance.ledger.subtitle')}</Text>

        {/* Balance Card: no ledger endpoint gives a closing balance (R6). */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current Closing Balance</Text>
          <Text style={styles.balanceAmount}>{ADMIN_NO_VALUE}</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceSub}>{t('wiringFinance.ledger.totalCredits', { amount: totalCredits })}</Text>
            <Text style={styles.balanceSub}>·</Text>
            <Text style={[styles.balanceSub, { color: PALETTE.debitRed }]}>
              {t('wiringFinance.ledger.totalDebits', { amount: totalDebits })}
            </Text>
          </View>
        </View>

        {/* Entries List */}
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {isPending ? (
          <AdminLoadingState />
        ) : error ? (
          <AdminErrorState
            error={error}
            onRetry={() => {
              void expensesQuery.refetch();
              void revenueQuery.refetch();
            }}
          />
        ) : entries.length === 0 ? (
          <AdminEmptyState title={t('wiringFinance.ledger.empty')} />
        ) : (
          <View style={styles.entryStack}>
            {entries.map((entry) => {
              const isCredit = entry.type === 'CREDIT';
              return (
                <View key={entry.id} style={styles.entryCard}>
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryDate}>{entry.dateText}</Text>
                    <Text
                      style={[
                        styles.entryAmount,
                        isCredit ? styles.creditText : styles.debitText,
                      ]}
                    >
                      {isCredit ? '+' : '-'}{entry.amountText}
                    </Text>
                  </View>

                  <Text style={styles.entryDesc}>{entry.description}</Text>
                  <Text style={styles.accountHead}>Head: {entry.accountHead}</Text>

                  <View style={styles.runningBalRow}>
                    <Text style={styles.runningBalLabel}>Running Balance:</Text>
                    <Text style={styles.runningBalVal}>{ADMIN_NO_VALUE}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Add Entry Button */}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            if (onNavigateToAddEntry) onNavigateToAddEntry();
          }}
          activeOpacity={0.8}
        >
          <PlusIcon />
          <Text style={styles.addBtnText}>Add Manual Journal Entry</Text>
        </TouchableOpacity>

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
  balanceCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 18,
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 12,
    color: PALETTE.labelMuted,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: PALETTE.ink,
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  balanceSub: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.creditGreen,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.titleRust,
    marginBottom: 12,
  },
  entryStack: {
    gap: 12,
    marginBottom: 20,
  },
  entryCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  entryDate: {
    fontSize: 11.5,
    color: PALETTE.labelMuted,
  },
  entryAmount: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  creditText: {
    color: PALETTE.creditGreen,
  },
  debitText: {
    color: PALETTE.debitRed,
  },
  entryDesc: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.ink,
    marginBottom: 3,
  },
  accountHead: {
    fontSize: 12,
    color: PALETTE.labelMuted,
    marginBottom: 8,
  },
  runningBalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: PALETTE.pageBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  runningBalLabel: {
    fontSize: 11,
    color: PALETTE.labelMuted,
  },
  runningBalVal: {
    fontSize: 11.5,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  addBtn: {
    backgroundColor: PALETTE.orange,
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: PALETTE.orange,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 3,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
});
