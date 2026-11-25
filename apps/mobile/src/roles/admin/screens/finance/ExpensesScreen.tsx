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

import { listExpenses } from '../../api/finance';
import { useAdminQuery } from '../../api/hooks';
import { listAllWarehouses } from '../../api/warehouseList';
import { t, type TranslationKey } from '../../i18n';
import { adminColors, adminType } from '../../theme';
import { formatAdminDay } from '../../utils/datetime';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { moneyText } from '../dashboard/saOverviewFormat';
import { istToday } from '../warehouse/finance-expenses/mappers';
import { reportRange } from '../warehouse/finance-expenses/reportRanges';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';

const EXPENSES_PAGE = 50;

// ─── Design Tokens ────────────────────────────────────────────────────────────
const PALETTE = {
  titleRust:     adminColors.brandDeep,
  orange:        adminColors.brand,
  pageBg:        adminColors.canvas,
  cardBg:        adminColors.card,
  ink:           adminColors.ink,
  labelMuted:    adminColors.muted,
  border:        adminColors.border,
  blueBox:       adminColors.info.bg,
  blueIcon:      adminColors.info.text,
  pendingBg:     adminColors.warning.bg,
  pendingText:   adminColors.warning.text,
  approvedBg:    adminColors.success.bg,
  approvedText:  adminColors.success.text,
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
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5v14M5 12h14"
        stroke={adminColors.ink}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TruckIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"
        stroke={PALETTE.blueIcon}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LightningIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
        stroke={PALETTE.blueIcon}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WrenchIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
        stroke={PALETTE.blueIcon}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckmarkIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={adminColors.onBrand}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

type ExpenseIconType = 'truck' | 'lightning' | 'wrench';

/**
 * The design draws one of three icons per expense. The categories are the
 * fixed seed list of migration 0047 (Transport, Loading, Unloading, Warehouse
 * Operations, Maintenance, Utilities, Other); which icon each gets is a visual
 * choice only, listed for the owner in the brief-07 W1 report.
 */
function iconFor(category: string): ExpenseIconType {
  switch (category) {
    case 'Transport':
    case 'Loading':
    case 'Unloading':
      return 'truck';
    case 'Utilities':
      return 'lightning';
    default:
      return 'wrench';
  }
}

export interface ExpensesScreenProps {
  onBack: () => void;
  onNavigateToAddExpense: () => void;
}

/**
 * Expenses recorded this month (GET /admin/expenses, from the 1st to today:
 * the subtitle says "this month"). BR-62: an expense is only recorded; there
 * is no approve, reject or verify endpoint, so the designed "Approve Selected"
 * control is drawn unavailable and nothing is selectable.
 */
export function ExpensesScreen({
  onBack,
  onNavigateToAddExpense,
}: ExpensesScreenProps) {
  const range = reportRange('monthToDate', istToday());
  const expensesQuery = useAdminQuery(['admin', 'finance', 'expenses-screen', range.from, range.to], (signal) =>
    listExpenses({ from: range.from, to: range.to, limit: EXPENSES_PAGE }, signal),
  );
  const warehousesQuery = useAdminQuery(['admin', 'warehouses', 'all'], (signal) => listAllWarehouses({}, signal));
  const warehouseName = (id: string | null) =>
    (id === null ? undefined : warehousesQuery.data?.find((w) => w.id === id)?.name) ?? ADMIN_NO_VALUE;

  const expenses = expensesQuery.data?.items ?? [];

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Action Row: Back Button on left, Add Button on right */}
        <View style={styles.topActionsRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <BackChevronIcon />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backBtn}
            onPress={onNavigateToAddExpense}
            activeOpacity={0.7}
          >
            <PlusIcon />
          </TouchableOpacity>
        </View>

        {/* Heading Next: nothing awaits approval (BR-62), so the designed count is dashed. */}
        <Text style={styles.screenTitle}>Expenses</Text>
        <Text style={styles.screenSub}>{t('wiringFinance.expenses.subtitle', { count: ADMIN_NO_VALUE })}</Text>

        {/* Expense Cards */}
        {expensesQuery.isPending ? (
          <AdminLoadingState />
        ) : expensesQuery.error ? (
          <AdminErrorState error={expensesQuery.error} onRetry={() => void expensesQuery.refetch()} />
        ) : expenses.length === 0 ? (
          <AdminEmptyState title={t('wiringFinance.expenses.empty')} />
        ) : (
          <View style={styles.expenseList}>
            {expenses.map((item) => {
              const isRejected = item.status === 'REJECTED';
              const icon = iconFor(item.category);
              return (
                <View key={item.id} style={styles.expenseCard}>
                  {/* Left Icon Square */}
                  <View style={styles.iconBox}>
                    {icon === 'truck' && <TruckIcon />}
                    {icon === 'lightning' && <LightningIcon />}
                    {icon === 'wrench' && <WrenchIcon />}
                  </View>

                  {/* Details Col */}
                  <View style={styles.detailsCol}>
                    <Text style={styles.itemTitle}>
                      {t('wiringFinance.expenses.title', { category: item.category, warehouse: warehouseName(item.warehouseId) })}
                    </Text>
                    {/* recordedBy is an admin id; the list carries no name for it. */}
                    <Text style={styles.itemSub}>
                      {t('wiringFinance.expenses.loggedBy', {
                        name: ADMIN_NO_VALUE,
                        date: formatAdminDay(item.expenseDate) || ADMIN_NO_VALUE,
                      })}
                    </Text>

                    {/* Status Pill */}
                    <View style={styles.pillRow}>
                      <View style={[styles.statusPill, isRejected ? styles.pendingPill : styles.approvedPill]}>
                        <Text style={[styles.statusPillText, isRejected ? styles.pendingPillText : styles.approvedPillText]}>
                          {t(`wiringFinance.expenses.status.${item.status}` as TranslationKey)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Amount on Right */}
                  <Text style={styles.amountText}>{moneyText(item.amount)}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Bottom Button: BR-62 has no approval step and no endpoint, so drawn unavailable (R3). */}
        <TouchableOpacity
          style={[styles.approveBtn, styles.actionUnavailable]}
          disabled
          activeOpacity={1}
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
          testID="finance.expenses.approve"
        >
          <CheckmarkIcon />
          <Text style={styles.approveBtnText}>Approve Selected</Text>
        </TouchableOpacity>
        <Text style={styles.unavailableNote}>{t('wiringFinance.expenses.approveUnavailable')}</Text>

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
  topActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  expenseList: {
    gap: 12,
    marginBottom: 24,
  },
  expenseCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: adminColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  expenseCardSelected: {
    borderColor: PALETTE.orange,
    backgroundColor: adminColors.brandTint,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: PALETTE.blueBox,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  detailsCol: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.ink,
    marginBottom: 3,
  },
  itemSub: {
    fontSize: 12,
    color: PALETTE.labelMuted,
    marginBottom: 6,
  },
  pillRow: {
    flexDirection: 'row',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 5,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pendingPill: {
    backgroundColor: PALETTE.pendingBg,
  },
  pendingPillText: {
    color: PALETTE.pendingText,
    fontSize: 11,
    fontWeight: '700',
  },
  approvedPill: {
    backgroundColor: PALETTE.approvedBg,
  },
  approvedPillText: {
    color: PALETTE.approvedText,
    fontSize: 11,
    fontWeight: '700',
  },
  amountText: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.ink,
    marginLeft: 8,
  },
  approveBtn: {
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
  approveBtnText: {
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
  },
});
