import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import type { Can } from '../../permissions/can';
import { adminColors, adminShadow, adminSpacing, adminType } from '../../theme';
import { listExpenses, listFinanceRevenue, type ExpenseDto, type FinanceRevenueItemDto } from '../../api/finance';
import { useAdminQuery } from '../../api/hooks';
import { listInvoices, type InvoiceDto, type InvoiceStatus } from '../../api/invoices';
import { t, type TranslationKey } from '../../i18n';
import { formatAdminDay } from '../../utils/datetime';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { moneyText } from '../dashboard/saOverviewFormat';
import { LiveInvoiceDetail } from '../warehouse/billing-invoices';
import { ExpenseDetailScreen, RevenueDetailScreen } from '../warehouse/finance-expenses';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';

/** One page of each source: the recent history, not every record. */
const HISTORY_PAGE = 25;

function BackArrowWhiteIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

function SearchIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="21" x2="4" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="10" x2="4" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="21" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="8" x2="12" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="20" y1="21" x2="20" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="20" y1="12" x2="20" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="1" y1="14" x2="7" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="9" y1="8" x2="15" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="17" y1="16" x2="23" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export interface TransactionEventItem {
  id: string;
  /** What the row opens: the live detail screen for this record, by its real id. */
  target: { kind: 'invoice' | 'sale' | 'expense'; id: string };
  /** Newest-first sort key, an ISO day or instant. */
  sortKey: string;
  title: string;
  badge: string;
  badgeTone: 'default' | 'success' | 'danger' | 'warning';
  line1: string;
  line2: string;
  line3: string;
  line4: string;
}

const INVOICE_TONE: Record<InvoiceStatus, TransactionEventItem['badgeTone']> = {
  ISSUED: 'success',
  DRAFT: 'default',
  CANCELLED: 'danger',
  CREDIT_NOTED: 'warning',
};

const dayText = (iso: string) => formatAdminDay(iso) || ADMIN_NO_VALUE;

/**
 * One page each of invoices, revenue and expenses, merged newest first. None
 * of the three list rows carries a buyer, an order number or who changed it,
 * so those slots are dashed (R9: an order UUID is never shown as a number).
 */
function historyEvents(invoices: InvoiceDto[], revenue: FinanceRevenueItemDto[], expenses: ExpenseDto[]): TransactionEventItem[] {
  const events: TransactionEventItem[] = [
    ...invoices.map((inv) => ({
      id: `inv-${inv.id}`,
      target: { kind: 'invoice' as const, id: inv.id },
      sortKey: inv.issueDate,
      title: t('wiringFinance.history.invoiceTitle', { number: inv.invoiceNumber }),
      badge: t(`wiringFinance.history.invoiceStatus.${inv.status}` as TranslationKey),
      badgeTone: INVOICE_TONE[inv.status],
      line1: t('wiringFinance.history.when', {
        date: dayText(inv.issueDate),
        kind: t(`wiringFinance.invoices.type.${inv.invoiceType}` as TranslationKey),
      }),
      line2: ADMIN_NO_VALUE,
      line3: t('wiringFinance.history.orderStatus', {
        order: ADMIN_NO_VALUE,
        status: t(`wiringFinance.history.invoiceStatus.${inv.status}` as TranslationKey),
      }),
      line4: t('wiringFinance.history.amountBy', { amount: moneyText(inv.totalAmount), by: ADMIN_NO_VALUE }),
    })),
    ...revenue.map((rev) => ({
      id: `rev-${rev.orderId}`,
      target: { kind: 'sale' as const, id: rev.orderId },
      sortKey: rev.completedAt,
      title: t('wiringFinance.history.saleTitle', { number: ADMIN_NO_VALUE }),
      badge: rev.paymentStatus,
      badgeTone: (rev.paymentStatus === 'PAID' ? 'success' : 'warning') as TransactionEventItem['badgeTone'],
      line1: t('wiringFinance.history.when', { date: dayText(rev.completedAt), kind: rev.channel }),
      line2: ADMIN_NO_VALUE,
      line3: t('wiringFinance.history.payment', { method: rev.paymentMethod }),
      line4: t('wiringFinance.history.amountBy', { amount: moneyText(rev.totalAmount), by: ADMIN_NO_VALUE }),
    })),
    ...expenses.map((exp) => ({
      id: `exp-${exp.id}`,
      target: { kind: 'expense' as const, id: exp.id },
      sortKey: exp.expenseDate,
      title: t('wiringFinance.history.expenseTitle', { category: exp.category }),
      badge: t(`wiringFinance.expenses.status.${exp.status}` as TranslationKey),
      badgeTone: (exp.status === 'REJECTED' ? 'danger' : 'default') as TransactionEventItem['badgeTone'],
      line1: t('wiringFinance.history.when', { date: dayText(exp.expenseDate), kind: t('wiringFinance.history.expenseKind') }),
      line2: exp.vendor ?? ADMIN_NO_VALUE,
      line3: t('wiringFinance.history.payment', { method: exp.paymentMethod ?? ADMIN_NO_VALUE }),
      line4: t('wiringFinance.history.amountBy', { amount: moneyText(exp.amount), by: ADMIN_NO_VALUE }),
    })),
  ];
  return events.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
}

export interface TransactionHistoryScreenProps {
  can?: Can | undefined;
  onBack: () => void;
}

export function TransactionHistoryScreen({ can = () => false, onBack }: TransactionHistoryScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [openTarget, setOpenTarget] = useState<TransactionEventItem['target'] | null>(null);

  const invoicesQuery = useAdminQuery(['admin', 'invoices', 'history', HISTORY_PAGE], (signal) =>
    listInvoices({ limit: HISTORY_PAGE }, signal),
  );
  const revenueQuery = useAdminQuery(['admin', 'finance', 'history-revenue', HISTORY_PAGE], (signal) =>
    listFinanceRevenue({ limit: HISTORY_PAGE }, signal),
  );
  const expensesQuery = useAdminQuery(['admin', 'finance', 'history-expenses', HISTORY_PAGE], (signal) =>
    listExpenses({ limit: HISTORY_PAGE }, signal),
  );

  const isPending = invoicesQuery.isPending || revenueQuery.isPending || expensesQuery.isPending;
  const error = invoicesQuery.error ?? revenueQuery.error ?? expensesQuery.error;
  const events = historyEvents(invoicesQuery.data?.items ?? [], revenueQuery.data?.items ?? [], expensesQuery.data?.items ?? []);
  const query = searchQuery.toLowerCase().trim();
  const filteredItems = query
    ? events.filter((item) =>
        [item.title, item.badge, item.line1, item.line2, item.line3, item.line4].some((v) => v.toLowerCase().includes(query)),
      )
    : events;

  // Drill-down: each row opens the live detail for its own record (R2).
  const scope = { warehouseId: undefined, warehouseName: undefined };
  const close = () => setOpenTarget(null);
  if (openTarget?.kind === 'expense') {
    return <ExpenseDetailScreen scope={scope} can={can} onBack={close} expenseId={openTarget.id} />;
  }
  if (openTarget?.kind === 'sale') {
    return <RevenueDetailScreen scope={scope} can={can} onBack={close} orderId={openTarget.id} />;
  }
  if (openTarget?.kind === 'invoice') {
    return <LiveInvoiceDetail scope={scope} can={can} onBack={close} invoiceId={openTarget.id} />;
  }

  const open = (item: TransactionEventItem) => {
    setSelectedCardId(item.id);
    setOpenTarget(item.target);
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ── Top Header Banner ── */}
      <View style={styles.headerBanner}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.8}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Back to Accounts & Finance"
        >
          <BackArrowWhiteIcon size={22} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>History</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Search Bar ── */}
        <View style={styles.searchBarContainer}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor={adminColors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.filterIconButton}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Filter"
          >
            <FilterSlidersIcon size={18} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        {/* ── Counter Line: three merged pages have no single server total, so the count is dashed (R4). ── */}
        <Text style={styles.counterText}>
          {t('wiringFinance.history.counter', { count: ADMIN_NO_VALUE, warehouses: ADMIN_NO_VALUE })}
        </Text>

        {/* ── Events List ── */}
        {isPending ? (
          <AdminLoadingState />
        ) : error ? (
          <AdminErrorState
            error={error}
            onRetry={() => {
              void invoicesQuery.refetch();
              void revenueQuery.refetch();
              void expensesQuery.refetch();
            }}
          />
        ) : filteredItems.length === 0 ? (
          <AdminEmptyState title={t(query ? 'wiringFinance.history.noMatch' : 'wiringFinance.history.empty')} />
        ) : filteredItems.map((item) => {
          const isSuccess = item.badgeTone === 'success';
          const isDanger = item.badgeTone === 'danger';
          const isWarning = item.badgeTone === 'warning';
          const isSelected = selectedCardId === item.id;

          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.eventCard,
                isSelected && styles.eventCardSelected,
              ]}
              onPress={() => open(item)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    isSuccess
                      ? styles.badgeGreen
                      : isDanger
                      ? styles.badgeRed
                      : isWarning
                      ? styles.badgeAmber
                      : styles.badgeGray,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      isSuccess
                        ? styles.badgeTextGreen
                        : isDanger
                        ? styles.badgeTextRed
                        : isWarning
                        ? styles.badgeTextAmber
                        : styles.badgeTextGray,
                    ]}
                  >
                    {item.badge}
                  </Text>
                </View>
              </View>

              <Text style={styles.lineText}>{item.line1}</Text>
              <Text style={styles.lineText}>{item.line2}</Text>
              <Text style={styles.lineText}>{item.line3}</Text>
              <Text style={styles.lineText}>{item.line4}</Text>

              {/* Action row with "View Details" button */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  testID={`finance.history.view.${item.id}`}
                  onPress={() => open(item)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                >
                  <Text style={styles.actionBtnText}>View Details</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: adminSpacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingTop: adminSpacing.md,
    paddingHorizontal: adminSpacing.md,
    paddingBottom: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.3,
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingBottom: adminSpacing.xxxl,
  },
  searchBarContainer: {
    backgroundColor: adminColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: adminSpacing.md,
    marginTop: 14,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    ...adminType.body,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  filterIconButton: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterText: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.muted,
    marginHorizontal: adminSpacing.md,
    marginTop: 12,
    marginBottom: 10,
  },
  eventCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: adminSpacing.md,
    marginBottom: 10,
    ...adminShadow.sm,
  },
  eventCardSelected: {
    borderColor: adminColors.danger.border,
    borderWidth: 1.5,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  badgeGreen: {
    backgroundColor: adminColors.success.bg,
  },
  badgeRed: {
    backgroundColor: adminColors.danger.bg,
  },
  badgeAmber: {
    backgroundColor: adminColors.warning.bg,
  },
  badgeGray: {
    backgroundColor: adminColors.canvas,
  },
  badgeText: {
    ...adminType.caption,
    fontWeight: '700',
  },
  badgeTextGreen: {
    color: adminColors.success.text,
  },
  badgeTextRed: {
    color: adminColors.danger.text,
  },
  badgeTextAmber: {
    color: adminColors.warning.text,
  },
  badgeTextGray: {
    color: adminColors.muted,
  },
  lineText: {
    ...adminType.body,
    color: adminColors.muted,
    marginTop: 2,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 4,
  },
  actionBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
});
